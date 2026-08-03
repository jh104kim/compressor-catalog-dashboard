from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.catalog_audit.api import create_app
from backend.catalog_audit.release import FileReleaseStore
from backend.catalog_audit.validation import CatalogValidator
from scripts.migrate_catalog import build_bundle


ROOT = Path(__file__).resolve().parents[1]


def test_p15_compare_report_includes_speed_analysis(tmp_path: Path) -> None:
    source_bundle = build_bundle(ROOT / "frontend" / "compressor-data.js")
    wanted = {
        "model:samsung:ENV4A5DL2B",
        "model:panasonic:TKF76E25DCH-52RPS",
    }
    models = [
        model for model in source_bundle["models"] if model["modelId"] in wanted
    ]
    bundle = {
        **source_bundle,
        "bundleId": "catalog-staging:test:p15-api",
        "counts": {
            "models": 2,
            "samsungModels": 1,
            "competitorModels": 1,
        },
        "models": models,
        "sourceRecords": [
            row for row in source_bundle["sourceRecords"] if row["modelId"] in wanted
        ],
    }
    validator = CatalogValidator(
        schema_path=ROOT / "data" / "contracts" / "catalog.schema.json",
        rules_path=ROOT / "config" / "p0_catalog_rules.json",
    )
    report = validator.validate(bundle)
    assert report.status == "VALIDATED"
    FileReleaseStore(tmp_path).publish(
        bundle=bundle,
        validation=report,
        release_id="release:2026-08-03:001",
        approved_by="catalog-owner",
        approved_at="2026-08-03T10:00:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )
    client = TestClient(
        create_app(
            release_root=tmp_path,
            rules_path=ROOT / "config" / "p0_catalog_rules.json",
        )
    )

    response = client.post(
        "/api/v1/compare/report",
        json={
            "baselineModelId": "model:samsung:ENV4A5DL2B",
            "candidateModelId": "model:panasonic:TKF76E25DCH-52RPS",
            "metric": "cop",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["comparison"]["code"] == "DIRECT_OK"
    assert payload["speedAnalysis"]["status"] == "CURVE_READY"
    assert payload["speedAnalysis"]["chartEligible"] is True
    assert payload["speedAnalysis"]["rankingAllowed"] is False
    assert len(payload["speedAnalysis"]["series"][0]["points"]) == 4
    assert len(payload["speedAnalysis"]["series"][1]["points"]) == 4

    legacy = client.post(
        "/api/v1/compare",
        json={
            "baselineModelId": "model:samsung:ENV4A5DL2B",
            "candidateModelId": "model:panasonic:TKF76E25DCH-52RPS",
            "metric": "cop",
        },
    )
    assert legacy.status_code == 200
    assert "speedAnalysis" not in legacy.json()
