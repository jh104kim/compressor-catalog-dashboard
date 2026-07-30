from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.catalog_audit.api import create_app
from backend.catalog_audit.release import FileReleaseStore
from backend.catalog_audit.validation import CatalogValidator


ROOT = Path(__file__).resolve().parents[1]


def evidence(source: str, section: str) -> dict:
    return {
        "evidenceId": f"evidence:test:{section.lower()}",
        "sourcePath": source,
        "authority": "research",
        "locator": {"kind": "markdown-section", "section": section},
        "fieldPaths": ["model", "specs.cop"],
        "note": "API test evidence",
    }


def api_model(
    *,
    model_id: str,
    model_name: str,
    manufacturer: str,
    condition: str,
    capacity_w: float,
    cop: float,
) -> dict:
    is_samsung = manufacturer == "Samsung"
    return {
        "modelId": model_id,
        "model": model_name,
        "manufacturer": manufacturer,
        "type": "Sc",
        "application": "Commercial AC",
        "refrigerant": "R454B",
        "condition": condition,
        "driveClass": "Fixed",
        "driveDetail": "Fixed",
        "lifecycleStatus": "IN_PROGRESS" if is_samsung else "MASS_PRODUCT",
        "sourceLayer": "post_catalog" if is_samsung else "competitor_research",
        "postCatalog": is_samsung,
        "confidence": "Medium",
        "specs": {
            "displacementCc": 49.0,
            "capacityW": capacity_w,
            "capacityBtuH": None,
            "inputW": None,
            "cop": cop,
            "eer": round(cop * 3.412, 3),
        },
        "evidence": evidence(
            "data/20260617-perplexity-gmcc-r454b-scroll-specs.md",
            model_name,
        ),
    }


def published_client(tmp_path: Path) -> TestClient:
    models = [
        api_model(
            model_id="model:samsung:DS8LC5040IN",
            model_name="DS8LC5040IN",
            manufacturer="Samsung",
            condition="DOE-B",
            capacity_w=1000.0,
            cop=3.20,
        ),
        api_model(
            model_id="model:gmcc:STDC049N1ULB",
            model_name="STDC049N1ULB",
            manufacturer="GMCC",
            condition="DOE-B",
            capacity_w=1100.0,
            cop=3.30,
        ),
        api_model(
            model_id="model:gmcc:ATQ360D1UMU",
            model_name="ATQ360D1UMU",
            manufacturer="GMCC",
            condition="SEER60",
            capacity_w=1000.0,
            cop=3.65,
        ),
    ]
    bundle = {
        "schemaVersion": "1.0.0",
        "bundleId": "catalog-staging:test:api",
        "stage": "STAGING",
        "asOf": "2026-07-30",
        "source": {"path": "tests/test_catalog_api.py", "sha256": "test"},
        "counts": {
            "models": 3,
            "samsungModels": 1,
            "competitorModels": 2,
        },
        "models": models,
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
        release_id="release:2026-07-30:001",
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:00:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )
    return TestClient(
        create_app(
            release_root=tmp_path,
            rules_path=ROOT / "config" / "p0_catalog_rules.json",
        )
    )


def test_active_release_and_filtered_catalog_are_read_only(tmp_path: Path) -> None:
    client = published_client(tmp_path)

    active = client.get("/api/v1/releases/active")
    models = client.get(
        "/api/v1/catalog/models",
        params={"manufacturer": "Samsung", "condition": "DOE-B"},
    )

    assert active.status_code == 200
    assert active.json()["releaseId"] == "release:2026-07-30:001"
    assert models.status_code == 200
    assert models.json()["count"] == 1
    assert models.json()["items"][0]["model"] == "DS8LC5040IN"
    assert client.post("/api/v1/releases/publish").status_code == 404


def test_g1_direct_comparison_api(tmp_path: Path) -> None:
    client = published_client(tmp_path)

    response = client.post(
        "/api/v1/compare",
        json={
            "baselineModelId": "model:samsung:DS8LC5040IN",
            "candidateModelId": "model:gmcc:STDC049N1ULB",
            "metric": "cop",
        },
    )

    assert response.status_code == 200
    assert response.json()["code"] == "DIRECT_OK"
    assert response.json()["rankingAllowed"] is True
    assert response.json()["deltaPct"] is not None


def test_g2_condition_mismatch_api_has_no_rank_or_delta(tmp_path: Path) -> None:
    client = published_client(tmp_path)

    response = client.post(
        "/api/v1/compare",
        json={
            "baselineModelId": "model:samsung:DS8LC5040IN",
            "candidateModelId": "model:gmcc:ATQ360D1UMU",
            "metric": "cop",
        },
    )

    assert response.status_code == 200
    assert response.json()["code"] == "BLOCKED_CONDITION_MISMATCH"
    assert response.json()["rankingAllowed"] is False
    assert response.json()["deltaPct"] is None


def test_g3_r290_re_is_gap_without_fake_samsung_model(tmp_path: Path) -> None:
    client = published_client(tmp_path)

    response = client.get("/api/v1/portfolio/Re/R290")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "GAP"
    assert payload["samsungModels"] == []
    assert payload["rankingAllowed"] is False
    assert payload["evidence"]["sourcePath"] == "config/p0_catalog_rules.json"


def test_evidence_endpoint_traces_model_to_active_release(tmp_path: Path) -> None:
    client = published_client(tmp_path)

    response = client.get(
        "/api/v1/evidence/model:samsung:DS8LC5040IN"
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["releaseId"] == "release:2026-07-30:001"
    assert payload["modelId"] == "model:samsung:DS8LC5040IN"
    assert payload["evidence"]["locator"]["section"] == "DS8LC5040IN"
