from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

from backend.catalog_audit.release import (
    FileReleaseStore,
    ReleaseGateError,
    ReleaseIntegrityError,
)
from backend.catalog_audit.validation import CatalogValidator


ROOT = Path(__file__).resolve().parents[1]


def samsung_model(*, cop: float = 3.25) -> dict:
    return {
        "modelId": "model:samsung:DS4BC7066FVT",
        "model": "DS4BC7066FVT",
        "manufacturer": "Samsung",
        "type": "Sc",
        "application": "Commercial AC",
        "refrigerant": "R32",
        "condition": "ARI",
        "driveClass": "Variable",
        "driveDetail": "BLDC Inverter",
        "lifecycleStatus": "MASS_PRODUCT",
        "sourceLayer": "samsung_catalog_2024",
        "postCatalog": False,
        "confidence": "High",
        "specs": {
            "displacementCc": 66.0,
            "capacityW": 1000.0,
            "capacityBtuH": 3412.0,
            "inputW": 307.6923,
            "cop": cop,
            "eer": round(cop * 3.412, 3),
        },
        "aliases": [],
        "nameNote": None,
        "evidence": {
            "evidenceId": "evidence:samsung-catalog-2024:p92",
            "sourcePath": "data/Samsung-Compressor-Catalogue_2024.pdf",
            "authority": "official",
            "locator": {"kind": "pdf-page", "page": 92},
            "fieldPaths": [
                "model",
                "condition",
                "specs.capacityW",
                "specs.inputW",
                "specs.cop",
                "specs.eer",
            ],
            "note": "Samsung 2024 catalogue authority value",
        },
    }


def staging_bundle(*, cop: float = 3.25) -> dict:
    return {
        "schemaVersion": 1,
        "bundleId": "bundle:catalog:2026-07-30:001",
        "stage": "STAGING",
        "asOf": "2026-07-30",
        "source": {
            "path": "frontend/compressor-data.js",
            "sha256": "16cfc74dce4eeebdf243996a83aa143d99dd90c256828fc4d5fbc589ef4de6b0",
        },
        "counts": {"models": 1, "samsungModels": 1, "competitorModels": 0},
        "models": [samsung_model(cop=cop)],
    }


def validator() -> CatalogValidator:
    return CatalogValidator(
        schema_path=ROOT / "data" / "contracts" / "catalog.schema.json",
        rules_path=ROOT / "config" / "p0_catalog_rules.json",
    )


def test_authority_value_mismatch_is_critical() -> None:
    report = validator().validate(staging_bundle(cop=3.34))

    assert report.status == "REJECTED"
    assert report.critical_count == 1
    assert any(
        issue.code == "AUTHORITY_VALUE_MISMATCH"
        and issue.model_id == "model:samsung:DS4BC7066FVT"
        for issue in report.issues
    )


def test_valid_bundle_is_release_eligible() -> None:
    report = validator().validate(staging_bundle())

    assert report.status == "VALIDATED"
    assert report.critical_count == 0
    assert report.major_count == 0
    assert report.model_count == 1


def test_rejected_publish_keeps_active_release_unchanged(tmp_path: Path) -> None:
    store = FileReleaseStore(tmp_path)
    good_bundle = staging_bundle()
    first = store.publish(
        bundle=good_bundle,
        validation=validator().validate(good_bundle),
        release_id="release:2026-07-30:001",
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:00:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )
    active_before = copy.deepcopy(store.active_release())

    bad_bundle = staging_bundle(cop=3.34)
    with pytest.raises(ReleaseGateError, match="Critical 0.*Major 0"):
        store.publish(
            bundle=bad_bundle,
            validation=validator().validate(bad_bundle),
            release_id="release:2026-07-30:002",
            approved_by="catalog-owner",
            approved_at="2026-07-30T16:05:00+09:00",
            source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
        )

    assert store.active_release() == active_before
    assert store.active_release()["releaseId"] == first["releaseId"]
    assert not (tmp_path / "releases" / "release_2026-07-30_002").exists()


def test_publish_hash_and_rollback_are_traceable(tmp_path: Path) -> None:
    store = FileReleaseStore(tmp_path)
    first_bundle = staging_bundle()
    first = store.publish(
        bundle=first_bundle,
        validation=validator().validate(first_bundle),
        release_id="release:2026-07-30:001",
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:00:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )

    second_bundle = staging_bundle()
    second_bundle["bundleId"] = "bundle:catalog:2026-07-30:002"
    second = store.publish(
        bundle=second_bundle,
        validation=validator().validate(second_bundle),
        release_id="release:2026-07-30:002",
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:10:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )

    assert second["previousReleaseId"] == first["releaseId"]
    assert store.verify_release(second["releaseId"]) is True

    rolled_back = store.rollback(
        target_release_id=first["releaseId"],
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:20:00+09:00",
    )
    assert rolled_back["releaseId"] == first["releaseId"]
    assert rolled_back["rollbackFromReleaseId"] == second["releaseId"]
    assert store.active_release()["releaseId"] == first["releaseId"]


def test_tampered_release_cannot_be_activated_by_rollback(tmp_path: Path) -> None:
    store = FileReleaseStore(tmp_path)
    bundle = staging_bundle()
    release = store.publish(
        bundle=bundle,
        validation=validator().validate(bundle),
        release_id="release:2026-07-30:001",
        approved_by="catalog-owner",
        approved_at="2026-07-30T16:00:00+09:00",
        source_commit="f142bcaba987408a766fcb6b3e20f8d431719e13",
    )
    bundle_path = store.release_path(release["releaseId"]) / "bundle.json"
    tampered = json.loads(bundle_path.read_text(encoding="utf-8"))
    tampered["models"][0]["specs"]["cop"] = 9.99
    bundle_path.write_text(json.dumps(tampered), encoding="utf-8")

    with pytest.raises(ReleaseIntegrityError, match="해시"):
        store.rollback(
            target_release_id=release["releaseId"],
            approved_by="catalog-owner",
            approved_at="2026-07-30T16:20:00+09:00",
        )
