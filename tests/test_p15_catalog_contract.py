from __future__ import annotations

import copy
import json
from pathlib import Path

from jsonschema import Draft202012Validator

from scripts.migrate_catalog import build_bundle


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "frontend" / "compressor-data.js"
SCHEMA = ROOT / "data" / "contracts" / "catalog.schema.json"


def _model(bundle: dict, model_id: str) -> dict:
    return next(item for item in bundle["models"] if item["modelId"] == model_id)


def test_p15_migration_preserves_verified_re_performance_maps() -> None:
    bundle = build_bundle(SOURCE)
    samsung = _model(bundle, "model:samsung:ENV4A5DL2B")
    panasonic = _model(bundle, "model:panasonic:TKF76E25DCH-52RPS")

    samsung_points = samsung["performanceMaps"][0]["points"]
    panasonic_points = panasonic["performanceMaps"][0]["points"]

    assert samsung["performanceMaps"][0]["familyModel"] == "ENV4A5DL2B"
    assert panasonic["performanceMaps"][0]["familyModel"] == "TKF76E25DCH"
    assert [point["speedValue"] for point in samsung_points] == [
        1650,
        1950,
        2800,
        3650,
    ]
    assert [point["speedUnit"] for point in samsung_points] == ["rpm"] * 4
    assert [point["capacityW"] for point in samsung_points] == [148, 174, 244, 315]
    assert [point["inputW"] for point in samsung_points] == [75, 88, 130, 182]
    assert [point["cop"] for point in samsung_points] == [1.97, 1.98, 1.88, 1.73]
    assert [point["eer"] for point in samsung_points] == [6.72, 6.77, 6.41, 5.91]
    assert [point["speedValue"] for point in panasonic_points] == [17, 27, 52, 80]
    assert [point["speedUnit"] for point in panasonic_points] == ["rps"] * 4
    assert [point["capacityW"] for point in panasonic_points] == [46, 76, 149, 220]
    assert [point["cop"] for point in panasonic_points] == [2.07, 2.17, 2.06, 1.83]
    assert all(point["evidence"] for point in samsung_points + panasonic_points)
    assert all(
        point["evidence"]["sourcePath"]
        == "data/20260803-speed-performance-map-research.md"
        for point in samsung_points + panasonic_points
    )
    assert all(
        point["evidence"]["authority"] == "official"
        and point["evidence"]["locator"]["kind"] == "url"
        for point in samsung_points + panasonic_points
    )
    assert all("TKF76E25DCH family" in point["evidence"]["note"] for point in panasonic_points)
    assert {point["speedUnit"] for point in samsung_points + panasonic_points} == {
        "rpm",
        "rps",
    }


def test_p15_schema_rejects_hz_and_missing_point_evidence() -> None:
    bundle = build_bundle(SOURCE)
    model = _model(bundle, "model:samsung:ENV4A5DL2B")
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)

    hz_model = copy.deepcopy(model)
    hz_model["performanceMaps"][0]["points"][0]["speedUnit"] = "hz"
    hz_errors = list(validator.iter_errors(hz_model))
    assert any(list(error.path)[-1:] == ["speedUnit"] for error in hz_errors)

    no_evidence = copy.deepcopy(model)
    del no_evidence["performanceMaps"][0]["points"][0]["evidence"]
    evidence_errors = list(validator.iter_errors(no_evidence))
    assert any(
        "'evidence' is a required property" in error.message
        and list(error.path)[-1:] == [0]
        for error in evidence_errors
    )

    no_evidence_id = copy.deepcopy(model)
    del no_evidence_id["performanceMaps"][0]["points"][0]["evidence"][
        "evidenceId"
    ]
    evidence_id_errors = list(validator.iter_errors(no_evidence_id))
    assert any(
        "'evidenceId' is a required property" in error.message
        and list(error.path)[-1:] == ["evidence"]
        for error in evidence_id_errors
    )
