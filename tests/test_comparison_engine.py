from __future__ import annotations

import pytest

from backend.catalog_audit.comparison import compare_models


def model(
    *,
    model_id: str,
    manufacturer: str,
    type_: str = "Sc",
    refrigerant: str = "R454B",
    condition: str = "DOE-B",
    drive_class: str = "Fixed",
    capacity_w: float | None = 1000.0,
    cop: float | None = 3.2,
) -> dict:
    return {
        "modelId": model_id,
        "model": model_id.rsplit(":", 1)[-1],
        "manufacturer": manufacturer,
        "type": type_,
        "refrigerant": refrigerant,
        "condition": condition,
        "driveClass": drive_class,
        "specs": {"capacityW": capacity_w, "capacityBtuH": None, "cop": cop},
    }


def test_g1_direct_same_key_and_capacity_boundary() -> None:
    samsung = model(
        model_id="model:samsung:DS8LC5040IN",
        manufacturer="Samsung",
        capacity_w=1000.0,
        cop=3.20,
    )
    competitor = model(
        model_id="model:gmcc:STDC049N1ULB",
        manufacturer="GMCC",
        capacity_w=1150.0,
        cop=3.30,
    )

    result = compare_models(samsung, competitor, metric="cop")

    assert result.verdict == "DIRECT"
    assert result.code == "DIRECT_OK"
    assert result.capacity_diff_pct == pytest.approx(15.0)
    assert result.delta_pct == pytest.approx(3.125)
    assert result.ranking_allowed is True


@pytest.mark.parametrize(
    ("candidate_capacity", "expected_verdict"),
    [(1149.9, "DIRECT"), (1150.0, "DIRECT"), (1150.1, "REFERENCE")],
)
def test_capacity_15_percent_boundary(
    candidate_capacity: float,
    expected_verdict: str,
) -> None:
    baseline = model(model_id="model:samsung:A", manufacturer="Samsung")
    candidate = model(
        model_id="model:gmcc:B",
        manufacturer="GMCC",
        capacity_w=candidate_capacity,
    )

    result = compare_models(baseline, candidate)

    assert result.verdict == expected_verdict
    assert result.ranking_allowed is (expected_verdict == "DIRECT")
    if expected_verdict == "REFERENCE":
        assert result.code == "REFERENCE_CAPACITY_OUTSIDE_15PCT"
        assert result.delta_pct is None


def test_g2_condition_mismatch_blocks_rank_and_delta() -> None:
    samsung = model(
        model_id="model:samsung:UB5TN5450FJX",
        manufacturer="Samsung",
        type_="Ro",
        refrigerant="R32",
        condition="ARI",
        drive_class="Variable",
    )
    competitor = model(
        model_id="model:gmcc:ATQ240D1UMU",
        manufacturer="GMCC",
        type_="Ro",
        refrigerant="R32",
        condition="SEER60",
        drive_class="Variable",
    )

    result = compare_models(samsung, competitor)

    assert result.verdict == "BLOCKED"
    assert result.code == "BLOCKED_CONDITION_MISMATCH"
    assert result.ranking_allowed is False
    assert result.delta_pct is None


def test_convertible_condition_is_reference_only() -> None:
    ari = model(
        model_id="model:samsung:A",
        manufacturer="Samsung",
        condition="ARI",
    )
    doe_a = model(
        model_id="model:lg:B",
        manufacturer="LG",
        condition="DOE-A",
        cop=4.0,
    )

    result = compare_models(ari, doe_a)

    assert result.verdict == "REFERENCE"
    assert result.code == "REFERENCE_NORMALIZED_CONDITION"
    assert result.normalized_candidate_metric == pytest.approx(3.36)
    assert result.ranking_allowed is False
    assert result.delta_pct is None


@pytest.mark.parametrize(
    ("change", "expected_code"),
    [
        ({"type_": "Ro"}, "BLOCKED_TYPE_MISMATCH"),
        ({"refrigerant": "R32"}, "BLOCKED_REFRIGERANT_MISMATCH"),
        ({"condition": "UNKNOWN"}, "BLOCKED_CONDITION_UNKNOWN"),
        ({"condition": "HP-heating"}, "BLOCKED_HEATING_COOLING_MISMATCH"),
        ({"cop": None}, "BLOCKED_METRIC_MISSING"),
    ],
)
def test_blocked_reasons_are_explicit(
    change: dict,
    expected_code: str,
) -> None:
    baseline = model(model_id="model:samsung:A", manufacturer="Samsung")
    candidate = model(
        model_id="model:other:B",
        manufacturer="Other",
        **change,
    )

    result = compare_models(baseline, candidate)

    assert result.verdict == "BLOCKED"
    assert result.code == expected_code
    assert result.ranking_allowed is False
    assert result.delta_pct is None


def test_drive_mismatch_is_reference_without_rank() -> None:
    baseline = model(
        model_id="model:samsung:A",
        manufacturer="Samsung",
        drive_class="Fixed",
    )
    candidate = model(
        model_id="model:copeland:B",
        manufacturer="Copeland",
        drive_class="Variable",
    )

    result = compare_models(baseline, candidate)

    assert result.verdict == "REFERENCE"
    assert result.code == "REFERENCE_DRIVE_MISMATCH"
    assert result.ranking_allowed is False
    assert result.delta_pct is None
