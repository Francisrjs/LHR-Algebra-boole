import json
from pathlib import Path


CATALOG = Path(__file__).resolve().parents[1] / "validation" / "matlab" / "cases.json"
REFERENCES = CATALOG.with_name("references.json")


def test_matlab_catalog_has_the_twelve_reference_models_and_required_variants():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    cases = catalog["cases"]

    assert [case["id"] for case in cases] == [f"C{i:02d}" for i in range(1, 13)]
    assert {run["name"] for run in cases[1]["runs"]} == {"K=6", "K=12", "K=18"}
    assert {run["name"] for run in cases[7]["runs"]} == {"G/H separado", "GH directo"}
    assert {run["payload"]["temporal"]["signal"] for run in cases[0]["runs"]} >= {
        "step",
        "ramp",
        "impulse",
    }
    assert all(run["payload"]["frequency"]["auto"] is False for case in cases for run in case["runs"])
    assert catalog["edgeCases"]["multipleMargins"]["payload"]["k"] == 1


def test_frozen_matlab_references_match_the_catalog_and_include_multiple_margins():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    references = json.loads(REFERENCES.read_text(encoding="utf-8"))

    assert references["schemaVersion"] == catalog["schemaVersion"]
    assert references["matlabRelease"]
    assert [case["id"] for case in references["cases"]] == [
        case["id"] for case in catalog["cases"]
    ]
    margins = references["edgeCases"]["multipleMargins"]
    assert len(margins["phaseMarginsDeg"]) >= 2
    assert len(margins["phaseMarginFrequencies"]) == len(margins["phaseMarginsDeg"])
