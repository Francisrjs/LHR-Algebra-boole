"""Run the MATLAB-backed HTTP validation suite and write a final comparison table."""

from __future__ import annotations

import argparse
import json
import math
import os
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from validation.matlab_compare import bode_errors, coefficient_equivalence_error, root_set_error  # noqa: E402
from validation.report import ValidationReport  # noqa: E402

CATALOG_PATH = ROOT / "validation" / "matlab" / "cases.json"
REFERENCE_PATH = ROOT / "validation" / "matlab" / "references.json"
DEFAULT_REPORT_DIR = ROOT / "validation" / "matlab" / "results"
TOLERANCES = {
    "roots": 1e-6,
    "transfer": 1e-6,
    "magnitude_db": 0.1,
    "phase_deg": 0.5,
    "crossing_relative": 0.005,
    "critical_gain_relative": 0.001,
    "temporal": 1e-3,
}


def _post(base_url: str, route: str, payload: dict[str, Any]) -> tuple[int, Any]:
    request = Request(
        f"{base_url.rstrip('/')}{route}",
        data=json.dumps(payload, allow_nan=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=30) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            return exc.code, json.loads(body)
        except json.JSONDecodeError:
            return exc.code, {"detail": body}


def _get(base_url: str, route: str) -> tuple[int, Any]:
    try:
        with urlopen(f"{base_url.rstrip('/')}{route}", timeout=15) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        return exc.code, {"detail": exc.read().decode("utf-8", errors="replace")}


def _runs(catalog: dict[str, Any], references: dict[str, Any]):
    refs = {case["id"]: case["runs"] for case in references["cases"]}
    for case in catalog["cases"]:
        case_refs = refs.get(case["id"], [])
        if isinstance(case_refs, dict):
            case_refs = [case_refs]
        for index, run in enumerate(case["runs"]):
            reference = case_refs[index] if index < len(case_refs) else None
            yield case, run, reference


def _add(report: ValidationReport, case: str, check: str, expected: Any, actual: Any,
         error: float, tolerance: float, detail: str = "") -> None:
    passed = math.isfinite(error) and error <= tolerance
    report.add(case, check, passed, expected=_fmt(expected), actual=_fmt(actual),
               error=_fmt(error), tolerance=_fmt(tolerance), detail=detail)


def _add_status(report: ValidationReport, case: str, check: str, expected: Any,
                actual: Any, detail: str = "") -> None:
    report.add(case, check, expected == actual, expected=expected, actual=actual,
               error=0 if expected == actual else "mismatch", tolerance="exact", detail=detail)


def _fmt(value: Any) -> Any:
    if value is None:
        return "null"
    if isinstance(value, float):
        if math.isnan(value):
            return "NaN"
        if math.isinf(value):
            return "∞" if value > 0 else "−∞"
        return f"{value:.8g}"
    if isinstance(value, np.ndarray):
        return np.array2string(value, precision=6, threshold=10)
    return value


def _model_error(expected: Any, actual: Any) -> float:
    expected_missing = expected is None or (isinstance(expected, list) and not expected)
    actual_missing = actual is None or (isinstance(actual, list) and not actual)
    if expected_missing or actual_missing:
        return 0.0 if expected_missing and actual_missing else float("inf")
    return coefficient_equivalence_error(
        expected["num"], expected["den"], actual["num"], actual["den"]
    )


def _roots(actual: Any) -> list[dict[str, float]]:
    if not actual:
        return []
    if isinstance(actual, dict):
        actual = [actual]
    return actual


def _list(value: Any) -> list[Any]:
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _relative_error(expected: Any, actual: Any) -> float:
    if expected is None or actual is None:
        return 0.0 if expected is None and actual is None else float("inf")
    expected, actual = float(expected), float(actual)
    return abs(actual - expected) / max(abs(expected), abs(actual), 1e-12)


def _compare_case(report: ValidationReport, base_url: str, case: dict[str, Any],
                  run: dict[str, Any], reference: dict[str, Any] | None) -> None:
    label = f"{case['id']} · {run['name']}"
    if reference is None:
        report.add(label, "MATLAB reference", False, detail="No existe una fila de referencia.")
        return
    if reference.get("error"):
        report.add(label, "MATLAB reference", False, detail=reference["error"])

    try:
        status, response = _post(base_url, "/api/analyze", run["payload"])
    except (URLError, TimeoutError, OSError) as exc:
        report.add(label, "HTTP /api/analyze", False, detail=f"{type(exc).__name__}: {exc}")
        return
    if status != 200 or not isinstance(response, dict):
        report.add(label, "HTTP /api/analyze", False, expected=200, actual=status,
                   detail=str(response)[:500])
        return
    report.add(label, "HTTP /api/analyze", True, expected=200, actual=status)
    if reference.get("error"):
        return

    expected_models = reference["models"]
    actual_models = response["models"]
    for name in ("g", "h", "l0", "l", "t"):
        error = _model_error(expected_models.get(name), actual_models.get(name))
        _add(report, label, f"Transferencia {name}", "MATLAB", "ControlLab", error,
             TOLERANCES["transfer"])

    for model_name in ("l0", "l", "t"):
        expected = expected_models.get(model_name)
        actual = actual_models.get(model_name)
        if expected is None or actual is None:
            continue
        for root_name in ("poles", "zeros"):
            error = root_set_error(expected[root_name], actual[root_name])
            _add(report, label, f"{model_name}.{root_name}", "raíces MATLAB", "raíces API",
                 error, TOLERANCES["roots"])

    _add(report, label, "Polos cerrados/LGR", "MATLAB", "ControlLab",
         root_set_error(reference["closedPoles"], response["locus"]["closedPoles"]),
         TOLERANCES["roots"])
    _add_status(report, label, "Estabilidad cerrada", reference["stability"], response["stability"])
    _add_status(report, label, "Estabilidad base", reference["baseStability"], response["baseStability"])

    locus = response["locus"]
    reference_centroid = _scalar(reference.get("centroid"))
    if reference_centroid is None:
        _add_status(report, label, "Centroide", None, locus.get("centroid"))
    else:
        _add(report, label, "Centroide", reference_centroid, locus.get("centroid"),
             abs(float(locus.get("centroid", float("nan"))) - reference_centroid),
             TOLERANCES["roots"])
    expected_angles = _list(reference.get("angles"))
    actual_angles = _list(locus.get("angles"))
    angle_error = _set_error(expected_angles, actual_angles, circular=True)
    _add(report, label, "Ángulos de asíntotas", expected_angles, actual_angles,
         angle_error, TOLERANCES["phase_deg"])
    for field, key, tolerance in (("breakaways", "re", TOLERANCES["roots"]),
                                  ("breakaways", "k", TOLERANCES["critical_gain_relative"]),
                                  ("crossings", "omega", TOLERANCES["crossing_relative"]),
                                  ("crossings", "k", TOLERANCES["critical_gain_relative"])):
        expected_points = _list(reference.get(field))
        actual_points = _list(locus.get(field))
        if key == "re" and field == "breakaways":
            error = _point_set_error(expected_points, actual_points, "re", absolute=True)
        else:
            error = _point_set_error(expected_points, actual_points, key, absolute=False)
        _add(report, label, f"LGR {field}.{key}", "MATLAB", "ControlLab", error, tolerance)

    try:
        mag_error, phase_error = bode_errors(expected_models["l"], response["bode"])
        _add(report, label, "Bode magnitud", "MATLAB", "ControlLab", mag_error,
             TOLERANCES["magnitude_db"])
        _add(report, label, "Bode fase", "MATLAB", "ControlLab", phase_error,
             TOLERANCES["phase_deg"])
    except (KeyError, TypeError, ValueError, FloatingPointError) as exc:
        report.add(label, "Bode", False, detail=f"{type(exc).__name__}: {exc}")

    _compare_margins(report, label, reference["margins"], response["bode"]["margins"])
    _compare_temporal(report, label, reference["temporal"], response["temporal"])


def _set_error(expected: list[Any], actual: list[Any], circular: bool = False) -> float:
    if len(expected) != len(actual):
        return float("inf")
    if not expected:
        return 0.0
    best = float("inf")
    for ordering in __import__("itertools").permutations(actual):
        diffs = []
        for left, right in zip(expected, ordering):
            delta = float(right) - float(left)
            if circular:
                delta = (delta + 180) % 360 - 180
            diffs.append(abs(delta))
        best = min(best, max(diffs))
    return best


def _point_set_error(expected: list[dict[str, Any]], actual: list[dict[str, Any]],
                     key: str, absolute: bool) -> float:
    if len(expected) != len(actual):
        return float("inf")
    if not expected:
        return 0.0
    best = float("inf")
    for ordering in __import__("itertools").permutations(actual):
        errors = []
        for left, right in zip(expected, ordering):
            if key == "re" and absolute:
                errors.append(abs(float(left.get(key, 0)) - float(right.get(key, 0))))
            else:
                errors.append(_relative_error(left.get(key), right.get(key)))
        best = min(best, max(errors))
    return best


def _numeric_set_error(expected: list[Any], actual: list[Any], relative: bool) -> float:
    expected, actual = _list(expected), _list(actual)
    if len(expected) != len(actual):
        return float("inf")
    if not expected:
        return 0.0
    best = float("inf")
    for ordering in __import__("itertools").permutations(actual):
        errors = [
            _relative_error(left, right) if relative else abs(float(left) - float(right))
            for left, right in zip(expected, ordering)
        ]
        best = min(best, max(errors))
    return best


def _compare_margins(report: ValidationReport, label: str, expected: dict[str, Any],
                     actual: dict[str, Any]) -> None:
    for state in ("gmState", "pmState"):
        _add_status(report, label, f"Estado {state}", expected[state], actual.get(state))
    for key, tolerance in (("gmDb", TOLERANCES["magnitude_db"]),
                           ("pmDeg", TOLERANCES["phase_deg"])):
        left, right = _scalar(expected.get(key)), _scalar(actual.get("gm" if key == "gmDb" else "pm"))
        error = 0.0 if left is None and right is None else (
            abs(left - right) if left is not None and right is not None else float("inf")
        )
        _add(report, label, f"Margen {key}", left, right, error, tolerance)
    for key in ("wgc", "wpc"):
        left, right = _scalar(expected.get(key)), _scalar(actual.get(key))
        error = 0.0 if left is None and right is None else (
            _relative_error(left, right) if left is not None and right is not None else float("inf")
        )
        _add(report, label, f"Margen frecuencia {key}", left, right, error,
             TOLERANCES["crossing_relative"])


def _scalar(value: Any) -> float | None:
    if value is None or value == []:
        return None
    return float(value)


def _compare_temporal(report: ValidationReport, label: str, expected: dict[str, Any],
                      actual: dict[str, Any]) -> None:
    if not expected.get("time"):
        _add_status(report, label, "GH directo no infiere T", True,
                    bool(actual.get("error")))
        return
    if actual.get("error"):
        report.add(label, "Respuesta temporal", False, detail=actual["error"])
        return
    expected_time = np.asarray(expected["time"], dtype=float)
    expected_output = np.asarray(expected["output"], dtype=float)
    actual_time = np.asarray(actual["time"], dtype=float)
    actual_output = np.asarray(actual["output"], dtype=float)
    aligned = np.interp(actual_time, expected_time, expected_output)
    error = float(np.max(np.abs(aligned - actual_output)))
    _add(report, label, f"Respuesta {expected['signal']}", "MATLAB", "ControlLab",
         error, TOLERANCES["temporal"])
    weight_error = abs(float(expected.get("impulseWeight", 0)) - float(actual.get("impulseWeight", 0)))
    _add(report, label, "Peso del impulso", expected.get("impulseWeight", 0),
         actual.get("impulseWeight", 0), weight_error, TOLERANCES["temporal"])


def _edge_checks(base_url: str, report: ValidationReport, references: dict[str, Any]) -> None:
    try:
        status, health = _get(base_url, "/api/health")
        _add_status(report, "API", "GET /api/health", (200, {"status": "ok"}), (status, health))
    except Exception as exc:
        report.add("API", "GET /api/health", False, detail=f"{type(exc).__name__}: {exc}")

    operations = {
        "series": ([1], [1, 3, 2]),
        "parallel": ([2, 3], [1, 3, 2]),
        "subtract": ([1], [1, 3, 2]),
        "feedback": ([1, 2], [1, 3, 3]),
    }
    for operation, (expected_num, expected_den) in operations.items():
        label = f"Álgebra · {operation}"
        try:
            status, result = _post(base_url, "/api/algebra", {
                "operation": operation, "functions": ["1/(s+1)", "1/(s+2)"]
            })
            error = coefficient_equivalence_error(
                expected_num, expected_den, result["result"]["num"], result["result"]["den"]
            ) if status == 200 else float("inf")
            report.add(label, "Endpoint /api/algebra", status == 200 and error <= TOLERANCES["transfer"],
                       expected=(expected_num, expected_den),
                       actual=result.get("result") if isinstance(result, dict) else status,
                       error=_fmt(error), tolerance=TOLERANCES["transfer"])
        except Exception as exc:
            report.add(label, "Endpoint /api/algebra", False, detail=f"{type(exc).__name__}: {exc}")

    try:
        status, result = _post(base_url, "/api/edit-roots", {
            "expression": "1/(s^2+2*s+2)", "kind": "pole", "index": 0, "re": -2, "im": 3
        })
        error = coefficient_equivalence_error([1], [1, 4, 13], result["result"]["num"], result["result"]["den"])
        _add(report, "API", "POST /api/edit-roots", "denominador [1,4,13]", status,
             error if status == 200 else float("inf"), TOLERANCES["transfer"])
    except Exception as exc:
        report.add("API", "POST /api/edit-roots", False, detail=f"{type(exc).__name__}: {exc}")

    project_path = ROOT / "docs" / "ejemplos" / "validate-project.json"
    project = json.loads(project_path.read_text(encoding="utf-8"))
    for name, payload, expected_status in (
        ("proyecto válido", project, 200),
        ("proyecto inválido", {**project, "frequency": {"min": 10, "max": 1, "auto": False}}, 422),
    ):
        try:
            status, body = _post(base_url, "/api/validate-project", payload)
            valid = status == expected_status and (expected_status != 200 or body.get("valid") is True)
            report.add("API", f"POST /api/validate-project · {name}", valid,
                       expected=expected_status, actual=status,
                       detail="" if valid else str(body)[:400])
        except Exception as exc:
            report.add("API", f"POST /api/validate-project · {name}", False,
                       detail=f"{type(exc).__name__}: {exc}")

    invalid_requests = [
        ("K negativo", {"g": "1/(s+1)", "k": -1}),
        ("expresión inválida", {"g": "1/(s+"}),
        ("denominador nulo", {"g": "1/0"}),
    ]
    for name, payload in invalid_requests:
        try:
            status, body = _post(base_url, "/api/analyze", payload)
            report.add("API", f"422 · {name}", status == 422, expected=422, actual=status,
                       detail="" if status == 422 else str(body)[:300])
        except Exception as exc:
            report.add("API", f"422 · {name}", False, detail=f"{type(exc).__name__}: {exc}")

    edge_models = [
        ("K=0", {"g": "1/(s+1)", "k": 0}, lambda r: r["bode"]["margins"]["gmState"] == "undefined"),
        ("sistema cero", {"g": "0"}, lambda r: r["models"]["l"]["num"] == [0.0]),
        ("impropio", {"g": "s+1"}, lambda r: bool(r["locus"].get("error")) and len(r["bode"]["omega"]) > 0),
        ("margen sin cruce", {"g": "1/(s+1)", "k": 0.1}, lambda r: r["bode"]["margins"]["gmState"] == "infinite"),
        ("polo repetido en eje", {"g": "1/(s^2)"}, lambda r: r["baseStability"] == "unstable"),
    ]
    for name, payload, predicate in edge_models:
        try:
            status, body = _post(base_url, "/api/analyze", payload)
            passed = status == 200 and predicate(body)
            report.add("API", f"Caso límite · {name}", passed, expected="regla del caso",
                       actual=body if not passed else "conforme", detail="" if passed else str(body)[:300])
        except Exception as exc:
            report.add("API", f"Caso límite · {name}", False, detail=f"{type(exc).__name__}: {exc}")

    multiple = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))["edgeCases"]["multipleMargins"]
    matlab = references["edgeCases"]["multipleMargins"]
    try:
        status, body = _post(base_url, "/api/analyze", multiple["payload"])
        entries = body["bode"]["margins"]["all"] if status == 200 else []
        for kind, value_key, reference_key, relative, tolerance in (
            ("phase", "margin", "phaseMarginsDeg", False, TOLERANCES["phase_deg"]),
            ("phase", "omega", "phaseMarginFrequencies", True, TOLERANCES["crossing_relative"]),
            ("gain", "margin", "gainMarginsDb", False, TOLERANCES["magnitude_db"]),
            ("gain", "omega", "gainMarginFrequencies", True, TOLERANCES["crossing_relative"]),
        ):
            actual_values = [entry[value_key] for entry in entries if entry["kind"] == kind]
            error = _numeric_set_error(matlab[reference_key], actual_values, relative)
            _add(report, "Márgenes múltiples", f"{kind} · {value_key}",
                 matlab[reference_key], actual_values, error, tolerance)
        report.add("Márgenes múltiples", "Retener todos los cruces", status == 200 and len(entries) >= 3,
                   expected="1 margen de ganancia y 2 de fase", actual=f"{len(entries)} entradas",
                   error=0 if len(entries) >= 3 else "faltan cruces", tolerance="exact")
    except Exception as exc:
        report.add("Márgenes múltiples", "API /api/analyze", False,
                   detail=f"{type(exc).__name__}: {exc}")


def _web_checks(base_url: str, report_dir: Path, report: ValidationReport) -> None:
    env = os.environ.copy()
    env["CONTROLLAB_URL"] = base_url
    node = "node"
    e2e_dir = ROOT / "e2e"
    browser_report = report_dir / "browser.json"
    commands = [
        ("Aplicación web · comparación API", [node, "validation.cjs", "--result-file", str(browser_report)]),
        ("Aplicación web · smoke (arrastre, modos, exportación)", [node, "smoke.cjs"]),
        ("Aplicación web · aceptación (proyectos e interacciones)", [node, "acceptance.cjs"]),
    ]
    for label, command in commands:
        try:
            result = subprocess.run(command, cwd=e2e_dir, env=env, capture_output=True,
                                    text=True, timeout=240, check=False)
            if command[1] == "validation.cjs" and browser_report.exists():
                web_result = json.loads(browser_report.read_text(encoding="utf-8"))
                for row in web_result.get("rows", []):
                    report.rows.append(row)
                continue
            success = result.returncode == 0
            report.add(label, "Playwright", success, expected=0, actual=result.returncode,
                       detail="" if success else (result.stderr or result.stdout)[-1500:])
        except subprocess.TimeoutExpired:
            report.add(label, "Playwright", False, detail="Timeout tras 240 segundos.")
        except Exception as exc:
            report.add(label, "Playwright", False, detail=f"{type(exc).__name__}: {exc}")


def run(base_url: str, report_dir: Path, include_web: bool = True) -> ValidationReport:
    catalog = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    references = json.loads(REFERENCE_PATH.read_text(encoding="utf-8"))
    if references.get("schemaVersion") != catalog.get("schemaVersion"):
        raise ValueError("El catálogo y las referencias MATLAB usan versiones de esquema distintas.")
    report = ValidationReport()
    for case, run_case, reference in _runs(catalog, references):
        try:
            _compare_case(report, base_url, case, run_case, reference)
        except Exception as exc:
            report.add(f"{case['id']} · {run_case['name']}", "internal case error", False,
                       detail=f"{type(exc).__name__}: {exc}")
    _edge_checks(base_url, report, references)
    report_dir.mkdir(parents=True, exist_ok=True)
    if include_web:
        _web_checks(base_url, report_dir, report)
    (report_dir / "latest.md").write_text(report.to_markdown(), encoding="utf-8")
    summary = {
        "status": "PASS" if report.passed else "FAIL",
        "baseUrl": base_url,
        "matlabVersion": references.get("matlabVersion"),
        "matlabRelease": references.get("matlabRelease"),
        "totalChecks": len(report.rows),
        "passedChecks": sum(row["status"] == "PASS" for row in report.rows),
        "failedChecks": sum(row["status"] == "FAIL" for row in report.rows),
        "rows": report.rows,
    }
    (report_dir / "latest.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    print(report.to_markdown())
    print(f"Reportes: {report_dir / 'latest.md'} y {report_dir / 'latest.json'}")
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default=os.environ.get("CONTROLLAB_URL", "http://127.0.0.1:8765"))
    parser.add_argument("--report-dir", type=Path, default=DEFAULT_REPORT_DIR)
    parser.add_argument("--skip-web", action="store_true", help="Ejecuta solo API/MATLAB; no abre Chrome.")
    args = parser.parse_args()
    try:
        report = run(args.base_url, args.report_dir, include_web=not args.skip_web)
    except Exception as exc:
        print(f"No se pudo iniciar la batería: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2
    return 0 if report.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
