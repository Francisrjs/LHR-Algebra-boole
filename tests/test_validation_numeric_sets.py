import math

from validation.run_api_validation import _numeric_set_error


def test_unordered_crossings_match_by_value():
    assert _numeric_set_error([1.0, 2.0], [2.0, 1.0], relative=False) == 0


def test_crossing_count_difference_fails():
    assert math.isinf(_numeric_set_error([1.0, 2.0], [1.0], relative=False))


def test_frequency_crossings_use_relative_error():
    assert _numeric_set_error([2.0], [2.01], relative=True) <= 0.005
