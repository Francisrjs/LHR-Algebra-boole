"""Small, fail-soft result collector shared by validation runners."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Iterable


@dataclass
class ValidationReport:
    rows: list[dict[str, Any]] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return bool(self.rows) and all(row["status"] == "PASS" for row in self.rows)

    def add(
        self,
        case: str,
        check: str,
        passed: bool,
        *,
        expected: Any = "—",
        actual: Any = "—",
        error: Any = "—",
        tolerance: Any = "—",
        detail: str = "",
    ) -> None:
        self.rows.append(
            {
                "case": case,
                "check": check,
                "status": "PASS" if passed else "FAIL",
                "expected": expected,
                "actual": actual,
                "error": error,
                "tolerance": tolerance,
                "detail": detail,
            }
        )

    def to_markdown(self) -> str:
        lines = [
            f"Resultado global: **{'APROBADO' if self.passed else 'FALLIDO'}**",
            "",
            "| Caso | Verificación | Estado | MATLAB | ControlLab | Error | Tolerancia | Detalle |",
            "|---|---|---:|---:|---:|---:|---:|---|",
        ]
        for row in self.rows:
            cells = [
                row["case"],
                row["check"],
                row["status"],
                row["expected"],
                row["actual"],
                row["error"],
                row["tolerance"],
                row["detail"],
            ]
            lines.append("| " + " | ".join(_cell(value) for value in cells) + " |")
        passed = sum(row["status"] == "PASS" for row in self.rows)
        failed = [row for row in self.rows if row["status"] == "FAIL"]
        lines.extend(
            [
                "",
                "## Resumen comparativo final",
                "",
                "| Resultado global | Aprobadas | Fallidas | Total |",
                "|---|---:|---:|---:|",
                f"| {'APROBADO' if self.passed else 'FALLIDO'} | {passed} | {len(failed)} | {len(self.rows)} |",
            ]
        )
        if failed:
            lines.extend(
                [
                    "",
                    "### Diferencias que requieren revisión",
                    "",
                    "| Caso | Verificación | MATLAB / esperado | ControlLab / observado | Error | Tolerancia | Detalle |",
                    "|---|---|---:|---:|---:|---:|---|",
                ]
            )
            for row in failed:
                cells = [
                    row["case"], row["check"], row["expected"], row["actual"],
                    row["error"], row["tolerance"], row["detail"],
                ]
                lines.append("| " + " | ".join(_cell(value) for value in cells) + " |")
        return "\n".join(lines) + "\n"


def run_independent_cases(
    cases: Iterable[Any], check: Callable[[Any], dict[str, Any]]
) -> ValidationReport:
    """Run every case even when one check raises; preserve every outcome."""
    report = ValidationReport()
    for case in cases:
        case_id = case if isinstance(case, str) else str(case.get("id", "unknown"))
        try:
            result = check(case)
            passed = result.get("passed")
            if passed is None:
                error, tolerance = result.get("error"), result.get("tolerance")
                passed = (
                    isinstance(error, (int, float))
                    and isinstance(tolerance, (int, float))
                    and error <= tolerance
                )
            report.add(
                case_id,
                result.get("check", "case"),
                bool(passed),
                expected=result.get("expected", "—"),
                actual=result.get("actual", "—"),
                error=result.get("error", "—"),
                tolerance=result.get("tolerance", "—"),
                detail=result.get("detail", ""),
            )
        except Exception as exc:  # A case failure must not stop the circuit.
            report.add(case_id, "case", False, detail=f"{type(exc).__name__}: {exc}")
    return report


def wrapped_phase_error(expected: float, actual: float) -> float:
    """Return the shortest signed-phase distance in degrees, as an absolute value."""
    return abs((actual - expected + 180.0) % 360.0 - 180.0)


def _cell(value: Any) -> str:
    if value is None:
        return "null"
    return str(value).replace("|", "\\|").replace("\n", "<br>")
