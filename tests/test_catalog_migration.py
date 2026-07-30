from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "migrate_catalog.py"
SOURCE = ROOT / "frontend" / "compressor-data.js"
SCHEMA = ROOT / "data" / "contracts" / "catalog.schema.json"
CHECKED_BUNDLE = ROOT / "catalog" / "staging" / "catalog-bundle.json"


def _load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    assert isinstance(value, dict)
    return value


@pytest.fixture()
def migrated_bundle(tmp_path: Path) -> tuple[dict[str, Any], bytes]:
    assert SCRIPT.is_file(), "P2 마이그레이션 스크립트가 필요합니다."
    output = tmp_path / "catalog-bundle.json"
    completed = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--source",
            str(SOURCE),
            "--output",
            str(output),
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert completed.returncode == 0, completed.stderr or completed.stdout
    return _load_json(output), output.read_bytes()


def test_p2_checked_bundle_exists_and_is_generated_deterministically(
    migrated_bundle: tuple[dict[str, Any], bytes],
    tmp_path: Path,
) -> None:
    _, first_bytes = migrated_bundle
    assert CHECKED_BUNDLE.is_file(), "검토할 Staging Bundle이 필요합니다."

    second_output = tmp_path / "second.json"
    subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--source",
            str(SOURCE),
            "--output",
            str(second_output),
        ],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert second_output.read_bytes() == first_bytes
    assert CHECKED_BUNDLE.read_bytes() == first_bytes


def test_p2_preserves_current_model_counts(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    assert bundle["stage"] == "STAGING"
    assert bundle["counts"] == {
        "models": 68,
        "samsungModels": 27,
        "competitorModels": 41,
    }
    assert len(bundle["models"]) == 68
    assert len(bundle["sourceRecords"]) == 68


def test_p2_model_ids_are_unique_and_sorted(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    model_ids = [item["modelId"] for item in bundle["models"]]
    source_ids = [item["modelId"] for item in bundle["sourceRecords"]]
    assert len(model_ids) == len(set(model_ids))
    assert model_ids == sorted(model_ids)
    assert source_ids == model_ids


def test_p2_source_hash_is_current(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    assert bundle["source"]["path"] == "frontend/compressor-data.js"
    assert bundle["source"]["sha256"] == hashlib.sha256(SOURCE.read_bytes()).hexdigest()


def test_p2_canonical_models_follow_p1_schema(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    validator = Draft202012Validator(_load_json(SCHEMA))
    errors = [
        f"{model['modelId']}: {error.message}"
        for model in bundle["models"]
        for error in validator.iter_errors(model)
    ]
    assert errors == []


def test_p2_source_layer_and_post_catalog_are_consistent(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    raw_by_id = {
        item["modelId"]: item["raw"] for item in bundle["sourceRecords"]
    }
    for item in bundle["models"]:
        if item["manufacturer"] == "Samsung" and item["postCatalog"]:
            assert item["sourceLayer"] == "post_catalog"
        elif (
            item["manufacturer"] == "Samsung"
            and "2024 catalogue p." in raw_by_id[item["modelId"]]["src"]
        ):
            assert item["sourceLayer"] == "samsung_catalog_2024"
        elif item["manufacturer"] == "Samsung":
            assert item["sourceLayer"] == "samsung_legacy_research"
        else:
            assert item["sourceLayer"] == "competitor_research"
            assert item["postCatalog"] is False


def test_p2_raw_records_and_core_values_have_zero_diff(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    raw_by_id = {item["modelId"]: item["raw"] for item in bundle["sourceRecords"]}

    for item in bundle["models"]:
        raw = raw_by_id[item["modelId"]]
        assert item["model"] == raw["model"]
        assert item["manufacturer"] == raw["mfr"]
        assert item["type"] == raw["type"]
        assert item["refrigerant"] == raw["refrigerant"]
        assert item["driveDetail"] == raw["drive"]
        assert item["postCatalog"] is bool(raw.get("postCatalog", False))
        assert item["evidence"]["note"] == raw["src"]
        assert item["specs"] == {
            "displacementCc": raw.get("cc"),
            "capacityW": raw.get("capW"),
            "capacityBtuH": raw.get("capBtu"),
            "inputW": raw.get("inputW"),
            "cop": raw.get("cop"),
            "eer": raw.get("eer"),
        }

    authoritative = next(
        item for item in bundle["models"] if item["model"] == "DS4BC7066FVT"
    )
    assert authoritative["specs"]["cop"] == pytest.approx(3.25)
    assert {
        item["model"]
        for item in bundle["models"]
        if item["sourceLayer"] == "post_catalog"
    } == {"DS2LD5046F", "DS8LC5040IN", "DS8LC5049IN"}
    assert {
        item["model"]
        for item in bundle["models"]
        if item["sourceLayer"] == "samsung_legacy_research"
    } == {"ENV4A5DL2B", "CD124K-S1ZA"}


def test_p2_legacy_samsung_models_do_not_claim_pdf_authority(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    legacy = {
        item["model"]: item
        for item in bundle["models"]
        if item["sourceLayer"] == "samsung_legacy_research"
    }
    assert set(legacy) == {"ENV4A5DL2B", "CD124K-S1ZA"}
    for item in legacy.values():
        assert item["postCatalog"] is False
        assert item["evidence"]["sourcePath"] == "data/compressor_deep_research_report.md"
        assert item["evidence"]["authority"] == "secondary"


def test_p2_every_legacy_source_has_structured_evidence_locator(
    migrated_bundle: tuple[dict[str, Any], bytes],
) -> None:
    bundle, _ = migrated_bundle
    for item in bundle["models"]:
        evidence = [item["evidence"], *item.get("supportingEvidence", [])]
        assert evidence
        assert item["evidence"]["note"]
        for entry in evidence:
            assert (ROOT / entry["sourcePath"]).is_file()
            assert entry["locator"]["kind"] in {
                "pdf-page",
                "markdown-section",
                "url",
            }
            assert entry["fieldPaths"]
