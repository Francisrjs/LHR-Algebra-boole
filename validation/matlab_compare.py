"""Numerical comparison helpers for MATLAB and ControlLab outputs."""

from __future__ import annotations

from itertools import permutations
from typing import Any, Iterable

import numpy as np


def root_set_error(expected: Iterable[Iterable[float]], actual: Iterable[Any]) -> float:
    """Maximum matched complex-root distance, independent of root ordering."""
    expected = list(expected)
    actual = list(actual)
    if len(expected) == 2 and all(np.isscalar(value) for value in expected):
        expected = [expected]
    if len(actual) == 2 and all(np.isscalar(value) for value in actual):
        actual = [actual]
    expected_values = [complex(float(pair[0]), float(pair[1])) for pair in expected]
    actual_values = [_as_complex(value) for value in actual]
    if len(expected_values) != len(actual_values):
        return float("inf")
    if not expected_values:
        return 0.0
    # System orders in the reference catalog are small. Exhaustive matching
    # avoids introducing another dependency and handles repeated roots.
    return min(
        max(abs(left - right) for left, right in zip(expected_values, order))
        for order in permutations(actual_values)
    )


def coefficient_equivalence_error(
    expected_num: Iterable[float],
    expected_den: Iterable[float],
    actual_num: Iterable[float],
    actual_den: Iterable[float],
) -> float:
    """Compare rational functions at deterministic complex points, scale-free."""
    n_ref, d_ref, n_app, d_app = [
        _coefficients(coeffs)
        for coeffs in (expected_num, expected_den, actual_num, actual_den)
    ]
    points = np.asarray(
        [0.137 + 0.371j, -0.823 + 1.119j, 1.731 - 0.419j, -2.317 - 0.683j]
    )
    ref_den = np.polyval(d_ref, points)
    app_den = np.polyval(d_app, points)
    valid = (np.abs(ref_den) > 1e-12) & (np.abs(app_den) > 1e-12)
    if not np.any(valid):
        return float("inf")
    ref = np.polyval(n_ref, points[valid]) / ref_den[valid]
    app = np.polyval(n_app, points[valid]) / app_den[valid]
    scale = np.maximum(np.maximum(np.abs(ref), np.abs(app)), 1e-12)
    return float(np.max(np.abs(ref - app) / scale))


def bode_errors(reference_model: dict[str, Any], bode: dict[str, Any]) -> tuple[float, float]:
    """Return max magnitude-dB and wrapped-phase errors over finite API samples."""
    omega = np.asarray(bode["omega"], dtype=float)
    actual_mag = _float_array(bode["magnitude"])
    actual_phase = _float_array(bode["phase"])
    num = _coefficients(reference_model["num"])
    den = _coefficients(reference_model["den"])
    with np.errstate(divide="ignore", invalid="ignore"):
        response = np.polyval(num, 1j * omega) / np.polyval(den, 1j * omega)
    expected_mag = 20 * np.log10(np.abs(response))
    expected_phase = np.angle(response, deg=True)
    finite_mag = np.isfinite(expected_mag) & np.isfinite(actual_mag)
    finite_phase = np.isfinite(expected_phase) & np.isfinite(actual_phase)
    if not np.any(finite_mag) or not np.any(finite_phase):
        return float("inf"), float("inf")
    magnitude_error = float(np.max(np.abs(expected_mag[finite_mag] - actual_mag[finite_mag])))
    phase_delta = (actual_phase[finite_phase] - expected_phase[finite_phase] + 180) % 360 - 180
    phase_error = float(np.max(np.abs(phase_delta)))
    return magnitude_error, phase_error


def _coefficients(value: Any) -> np.ndarray:
    if np.isscalar(value):
        return np.asarray([value], dtype=float)
    return np.asarray(value, dtype=float).reshape(-1)


def _float_array(values: Iterable[Any]) -> np.ndarray:
    return np.asarray([np.nan if item is None else float(item) for item in values], dtype=float)


def _as_complex(value: Any) -> complex:
    if isinstance(value, dict):
        return complex(float(value["re"]), float(value["im"]))
    if isinstance(value, (list, tuple)) and len(value) == 2:
        return complex(float(value[0]), float(value[1]))
    return complex(value)
