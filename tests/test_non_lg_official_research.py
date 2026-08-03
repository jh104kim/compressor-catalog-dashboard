from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest


ROOT = Path(__file__).resolve().parents[1]
BUNDLE_PATH = ROOT / "catalog" / "staging" / "catalog-bundle.json"
REPORT_PATH = ROOT / "data" / "20260730-non-lg-competitor-official-research.md"


def _bundle() -> dict[str, Any]:
    value = json.loads(BUNDLE_PATH.read_text(encoding="utf-8"))
    assert isinstance(value, dict)
    return value


def _models_by_id() -> dict[str, dict[str, Any]]:
    return {item["modelId"]: item for item in _bundle()["models"]}


def test_official_research_expands_non_lg_catalog_without_changing_samsung_scope() -> None:
    bundle = _bundle()

    assert bundle["counts"] == {
        "models": 76,
        "samsungModels": 27,
        "competitorModels": 49,
    }

    expected_ids = {
        "model:panasonic:TKF76E25DCH-52RPS",
        "model:panasonic:9RL160Z",
        "model:panasonic:5KD184XAA21",
        "model:panasonic:5KD240XAA21",
        "model:panasonic:5VD550ZD",
        "model:panasonic:KRD220Z",
        "model:panasonic:KKD420Z",
        "model:secop:BD35F",
    }
    models = _models_by_id()
    assert expected_ids <= set(models)

    for model_id in expected_ids:
        model = models[model_id]
        assert model["manufacturer"] != "LG"
        assert model["sourceLayer"] == "competitor_research"
        assert model["evidence"]["authority"] == "official"
        assert model["evidence"]["sourcePath"] == REPORT_PATH.relative_to(ROOT).as_posix()


@pytest.mark.parametrize(
    ("model_id", "refrigerant", "condition", "drive", "capacity_w", "cop"),
    [
        (
            "model:panasonic:TKF76E25DCH-52RPS",
            "R600a",
            "ASHRAE-LBP",
            "Variable",
            149,
            2.06,
        ),
        ("model:panasonic:9RL160Z", "R32", "ARI", "Variable", 4414, 2.56),
        (
            "model:panasonic:5KD184XAA21",
            "R410A",
            "ARI",
            "Variable",
            5440,
            3.01,
        ),
        (
            "model:panasonic:5KD240XAA21",
            "R410A",
            "ARI",
            "Variable",
            7280,
            3.03,
        ),
        (
            "model:panasonic:5VD550ZD",
            "R410A",
            "ARI",
            "Variable",
            17250,
            3.17,
        ),
        (
            "model:panasonic:KRD220Z",
            "R454B",
            "ARI",
            "Variable",
            8070,
            4.25,
        ),
        (
            "model:panasonic:KKD420Z",
            "R454B",
            "ARI",
            "Variable",
            16185,
            4.36,
        ),
        ("model:secop:BD35F", "R134a", "ASHRAE-LBP", "Variable", 50.5, 1.15),
    ],
)
def test_new_official_models_keep_source_test_condition(
    model_id: str,
    refrigerant: str,
    condition: str,
    drive: str,
    capacity_w: float,
    cop: float,
) -> None:
    model = _models_by_id()[model_id]

    assert model["refrigerant"] == refrigerant
    assert model["condition"] == condition
    assert model["driveClass"] == drive
    assert model["specs"]["capacityW"] == pytest.approx(capacity_w)
    assert model["specs"]["cop"] == pytest.approx(cop)


@pytest.mark.parametrize(
    ("samsung_id", "competitor_id"),
    [
        (
            "model:samsung:ENV4A5DL2B",
            "model:panasonic:TKF76E25DCH-52RPS",
        ),
        ("model:samsung:UB9TK2150F", "model:panasonic:9RL160Z"),
        ("model:samsung:UG4T200FUA", "model:panasonic:5KD184XAA21"),
        ("model:samsung:UG8TH8265F", "model:panasonic:5KD240XAA21"),
        ("model:samsung:UG5TM5520F", "model:panasonic:5VD550ZD"),
        ("model:samsung:UF8LB3265F", "model:panasonic:KRD220Z"),
        ("model:samsung:UF5LB3520F", "model:panasonic:KKD420Z"),
    ],
)
def test_new_panasonic_rows_are_direct_comparison_ready(
    samsung_id: str,
    competitor_id: str,
) -> None:
    models = _models_by_id()
    samsung = models[samsung_id]
    competitor = models[competitor_id]

    assert (
        samsung["type"],
        samsung["refrigerant"],
        samsung["condition"],
        samsung["driveClass"],
    ) == (
        competitor["type"],
        competitor["refrigerant"],
        competitor["condition"],
        competitor["driveClass"],
    )

    samsung_capacity = samsung["specs"]["capacityW"]
    competitor_capacity = competitor["specs"]["capacityW"]
    assert samsung_capacity is not None
    assert competitor_capacity is not None
    capacity_delta_pct = abs(competitor_capacity - samsung_capacity) / samsung_capacity * 100
    assert capacity_delta_pct <= 15


@pytest.mark.parametrize(
    ("model_id", "capacity_w", "input_w", "cop", "eer", "displacement_cc"),
    [
        ("model:danfoss:DSH090", 26320, 8180, 3.22, 10.98, 88.4),
        ("model:danfoss:DSH184", 51267, 15360, 3.34, 11.39, 170.3),
        ("model:danfoss:DSH240", 68133, 20810, 3.27, 11.17, 227.6),
    ],
)
def test_danfoss_dsh_uses_official_60hz_ari_fixed_speed_values(
    model_id: str,
    capacity_w: float,
    input_w: float,
    cop: float,
    eer: float,
    displacement_cc: float,
) -> None:
    model = _models_by_id()[model_id]

    assert model["condition"] == "ARI"
    assert model["driveClass"] == "Fixed"
    assert model["evidence"]["authority"] == "official"
    assert model["evidence"]["sourcePath"] == REPORT_PATH.relative_to(ROOT).as_posix()
    assert model["specs"] == {
        "capacityBtuH": pytest.approx(capacity_w * 3.412, rel=0.001),
        "capacityW": pytest.approx(capacity_w),
        "cop": pytest.approx(cop),
        "displacementCc": pytest.approx(displacement_cc),
        "eer": pytest.approx(eer),
        "inputW": pytest.approx(input_w),
    }


def test_research_report_records_acceptance_and_hold_reasons_for_every_non_lg_maker() -> None:
    report = REPORT_PATH.read_text(encoding="utf-8")

    for manufacturer in (
        "Embraco",
        "Secop",
        "Panasonic",
        "GMCC",
        "Highly",
        "Danfoss",
        "Copeland",
    ):
        assert manufacturer in report
    assert "DB 반영" in report
    assert "등록 보류" in report
    assert "측정조건" in report
    assert "±15%" in report
