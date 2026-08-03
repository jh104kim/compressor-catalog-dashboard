from __future__ import annotations

import pytest

from backend.catalog_audit.performance_map import (
    PerformanceMapError,
    build_speed_analysis,
    normalize_speed,
)


def point(
    speed_value: float,
    speed_unit: str,
    *,
    capacity_w: float,
    cop: float,
    source: str,
) -> dict:
    return {
        "speedValue": speed_value,
        "speedUnit": speed_unit,
        "capacityW": capacity_w,
        "inputW": None,
        "cop": cop,
        "eer": None,
        "valueKind": "MEASURED",
        "evidence": {
            "evidenceId": f"evidence:p15:{source}:{speed_value}",
            "sourcePath": "data/20260730-non-lg-competitor-official-research.md",
            "authority": "official",
            "locator": {
                "kind": "url",
                "url": f"https://example.com/{source}/{speed_value}",
                "accessedAt": "2026-08-03",
            },
            "fieldPaths": [
                "performanceMaps.points.speedValue",
                "performanceMaps.points.capacityW",
                "performanceMaps.points.cop",
            ],
        },
    }


def model(
    model_id: str,
    manufacturer: str,
    points: list[dict],
    *,
    compressor_type: str = "Re",
    refrigerant: str = "R600a",
    condition: str = "ASHRAE-LBP",
    drive_class: str = "Variable",
) -> dict:
    return {
        "modelId": model_id,
        "manufacturer": manufacturer,
        "model": model_id.rsplit(":", 1)[-1],
        "type": compressor_type,
        "refrigerant": refrigerant,
        "condition": condition,
        "driveClass": drive_class,
        "performanceMaps": [
            {
                "mapId": f"performance:{model_id.rsplit(':', 1)[-1].lower()}:ashrae-lbp",
                "familyModel": model_id.rsplit(":", 1)[-1],
                "condition": condition,
                "points": points,
            }
        ],
    }


def test_p15_exact_rpm_rps_conversion_and_hz_rejection() -> None:
    assert normalize_speed(17, "rps") == {"rpm": 1020, "rps": 17}
    assert normalize_speed(1650, "rpm") == {"rpm": 1650, "rps": 27.5}

    with pytest.raises(PerformanceMapError, match="Hz"):
        normalize_speed(60, "hz")


def test_p15_verified_re_curves_have_no_synthetic_points_or_rank() -> None:
    samsung = model(
        "model:samsung:ENV4A5DL2B",
        "Samsung",
        [
            point(1650, "rpm", capacity_w=148, cop=1.97, source="samsung"),
            point(1950, "rpm", capacity_w=174, cop=1.98, source="samsung"),
            point(2800, "rpm", capacity_w=244, cop=1.88, source="samsung"),
            point(3650, "rpm", capacity_w=315, cop=1.73, source="samsung"),
        ],
    )
    panasonic = model(
        "model:panasonic:TKF76E25DCH-52RPS",
        "Panasonic",
        [
            point(17, "rps", capacity_w=46, cop=2.07, source="panasonic"),
            point(27, "rps", capacity_w=76, cop=2.17, source="panasonic"),
            point(52, "rps", capacity_w=149, cop=2.06, source="panasonic"),
            point(80, "rps", capacity_w=220, cop=1.83, source="panasonic"),
        ],
    )

    result = build_speed_analysis(samsung, panasonic)

    assert result["status"] == "CURVE_READY"
    assert result["chartEligible"] is True
    assert result["rankingAllowed"] is False
    assert result["metricOptions"] == ["capacityW", "cop"]
    assert result["commonRange"] == {
        "rpm": {"min": 1650, "max": 3650},
        "rps": {"min": 27.5, "max": pytest.approx(60.833333333333336)},
    }
    assert [series["pointCount"] for series in result["series"]] == [4, 4]
    assert all(series["lineEligible"] is True for series in result["series"])
    assert [
        point["rpm"] for point in result["series"][0]["points"]
    ] == [1650, 1950, 2800, 3650]
    assert [
        point["rpm"] for point in result["series"][1]["points"]
    ] == [1020, 1620, 3120, 4800]
    assert all(
        point["evidence"]["authority"] in {"official", "secondary"}
        for series in result["series"]
        for point in series["points"]
    )
    assert result["safeguards"] == {
        "interpolation": False,
        "extrapolation": False,
        "hzAsSpeed": False,
    }


def test_p15_single_exact_speed_is_scatter_only() -> None:
    samsung = model(
        "model:samsung:A",
        "Samsung",
        [point(1620, "rpm", capacity_w=76, cop=2.1, source="samsung")],
    )
    competitor = model(
        "model:panasonic:B",
        "Panasonic",
        [point(27, "rps", capacity_w=76, cop=2.2, source="panasonic")],
    )

    result = build_speed_analysis(samsung, competitor)

    assert result["status"] == "POINT_READY"
    assert result["chartEligible"] is True
    assert result["rankingAllowed"] is True
    assert all(series["lineEligible"] is False for series in result["series"])


def test_p15_missing_or_hz_only_maps_are_data_required() -> None:
    samsung = model("model:samsung:A", "Samsung", [])
    competitor = model(
        "model:gmcc:B",
        "GMCC",
        [point(60, "hz", capacity_w=100, cop=2.0, source="gmcc")],
    )

    result = build_speed_analysis(samsung, competitor)

    assert result["status"] == "DATA_REQUIRED"
    assert result["chartEligible"] is False
    assert result["rankingAllowed"] is False
    assert result["metricOptions"] == []
    assert result["commonRange"] is None
    assert all(series["points"] == [] for series in result["series"])


def test_p15_point_without_evidence_id_is_not_chart_eligible() -> None:
    missing_id_point = point(
        1620,
        "rpm",
        capacity_w=76,
        cop=2.1,
        source="samsung",
    )
    del missing_id_point["evidence"]["evidenceId"]
    samsung = model(
        "model:samsung:A",
        "Samsung",
        [missing_id_point],
    )
    competitor = model(
        "model:panasonic:B",
        "Panasonic",
        [point(27, "rps", capacity_w=76, cop=2.2, source="panasonic")],
    )

    result = build_speed_analysis(samsung, competitor)

    assert result["status"] == "DATA_REQUIRED"
    assert result["chartEligible"] is False
    assert result["rankingAllowed"] is False
    assert all(series["points"] == [] for series in result["series"])


def test_p15_incompatible_curves_are_reference_only() -> None:
    samsung = model(
        "model:samsung:A",
        "Samsung",
        [
            point(1000, "rpm", capacity_w=100, cop=2.0, source="samsung"),
            point(2000, "rpm", capacity_w=200, cop=1.9, source="samsung"),
        ],
    )
    competitor = model(
        "model:gmcc:B",
        "GMCC",
        [
            point(20, "rps", capacity_w=100, cop=2.0, source="gmcc"),
            point(30, "rps", capacity_w=200, cop=1.9, source="gmcc"),
        ],
        condition="DOE-A",
    )

    result = build_speed_analysis(samsung, competitor)

    assert result["status"] == "REFERENCE_ONLY"
    assert result["chartEligible"] is False
    assert result["rankingAllowed"] is False


def test_p15_catalog_gate_blocks_chart_even_when_curves_exist() -> None:
    samsung = model(
        "model:samsung:A",
        "Samsung",
        [
            point(1000, "rpm", capacity_w=100, cop=2.0, source="samsung"),
            point(2000, "rpm", capacity_w=200, cop=1.9, source="samsung"),
        ],
    )
    competitor = model(
        "model:gmcc:B",
        "GMCC",
        [
            point(20, "rps", capacity_w=100, cop=2.0, source="gmcc"),
            point(30, "rps", capacity_w=200, cop=1.9, source="gmcc"),
        ],
    )

    result = build_speed_analysis(
        samsung,
        competitor,
        comparison_allowed=False,
        comparison_reason="용량 차이가 직접 비교 허용범위를 벗어납니다.",
    )

    assert result["status"] == "REFERENCE_ONLY"
    assert result["chartEligible"] is False
    assert result["rankingAllowed"] is False
    assert result["reason"] == "용량 차이가 직접 비교 허용범위를 벗어납니다."
