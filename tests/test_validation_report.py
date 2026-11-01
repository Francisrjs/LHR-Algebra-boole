from validation.report import ValidationReport, run_independent_cases, wrapped_phase_error


def test_independent_cases_continue_after_a_failure():
    visited = []

    def check(case):
        visited.append(case)
        if case == "C02":
            raise ValueError("reference mismatch")
        return {"expected": 2, "actual": 2, "error": 0, "tolerance": 1e-6}

    report = run_independent_cases(["C01", "C02", "C03"], check)

    assert visited == ["C01", "C02", "C03"]
    assert [row["status"] for row in report.rows] == ["PASS", "FAIL", "PASS"]
    assert report.passed is False
    assert "C03" in report.to_markdown()


def test_comparative_table_contains_expected_actual_error_and_tolerance():
    report = ValidationReport()
    report.add("C01", "step output", True, expected=0.5, actual=0.5, error=0.0, tolerance=1e-3)

    table = report.to_markdown()

    assert "MATLAB" in table
    assert "ControlLab" in table
    assert "Error" in table
    assert "Tolerancia" in table
    assert "C01" in table


def test_report_ends_with_a_summary_and_failed_comparison_table():
    report = ValidationReport()
    report.add("C01", "ok", True)
    report.add("C02", "margin", False, expected=180, actual=None,
               error="∞", tolerance=0.5)

    table = report.to_markdown()

    assert table.index("## Resumen comparativo final") > table.index("| C02 | margin | FAIL |")
    assert "| FALLIDO | 1 | 1 | 2 |" in table
    assert "| C02 | margin | 180 | null | ∞ | 0.5 |" in table


def test_phase_difference_is_wrapped_to_one_revolution():
    assert wrapped_phase_error(179.0, -181.0) == 0.0
