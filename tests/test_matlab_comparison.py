import numpy as np

from validation.matlab_compare import bode_errors, coefficient_equivalence_error, root_set_error


def test_root_set_comparison_ignores_order_and_preserves_multiplicity():
    expected = [[-1, 1], [-1, -1], [-1, 1]]
    actual = [{"re": -1, "im": -1}, {"re": -1, "im": 1}, {"re": -1, "im": 1}]

    assert root_set_error(expected, actual) == 0
    assert root_set_error(expected, actual[:2]) == float("inf")


def test_single_matlab_root_pair_is_normalized_from_flat_json_shape():
    assert root_set_error([-1, 0], [{"re": -1, "im": 0}]) == 0


def test_transfer_comparison_is_invariant_to_coefficient_scaling():
    error = coefficient_equivalence_error([1, 1], [1, 3, 2], [5, 5], [5, 15, 10])

    assert error < 1e-12


def test_transfer_comparison_accepts_scalar_constant_coefficients():
    assert coefficient_equivalence_error(1, 1, [1], [1]) == 0


def test_transfer_comparison_detects_a_real_model_difference():
    error = coefficient_equivalence_error([1, 1], [1, 3, 2], [1, 2], [1, 3, 2])

    assert error > 1e-3


def test_bode_phase_comparison_treats_values_separated_by_360_degrees_as_equal():
    magnitude, phase = bode_errors(
        {"num": [1], "den": [1, 1]},
        {"omega": [1], "magnitude": [-3.0102999566], "phase": [315]},
    )

    assert magnitude < 1e-8
    assert phase < 1e-8
