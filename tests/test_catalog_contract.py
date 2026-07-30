"""P0/P1 카탈로그 감사 앱의 고정 계약.

이 테스트는 구현을 먼저 요구하는 RED 테스트다. 테스트를 약화하지 말고,
P0/P1 산출물이 아래 계약을 충족하도록 작성해야 한다.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

import pytest


ROOT = Path(__file__).resolve().parents[1]
RULES_PATH = ROOT / "config" / "p0_catalog_rules.json"
SNAPSHOT_PATH = ROOT / "qa" / "baseline" / "current_snapshot.json"
SCHEMA_PATH = ROOT / "data" / "contracts" / "catalog.schema.json"
SCOPE_DOC_PATH = ROOT / "docs" / "01-scope-and-baseline.md"
DATA_CONTRACT_DOC_PATH = ROOT / "docs" / "02-data-contract.md"
TEST_PLAN_DOC_PATH = ROOT / "docs" / "03-test-plan.md"
DATA_SOURCE_PATH = ROOT / "frontend" / "compressor-data.js"


def _load_json(path: Path) -> dict[str, Any]:
    assert path.is_file(), f"P0/P1 필수 산출물이 없습니다: {path.relative_to(ROOT)}"
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        pytest.fail(f"{path.relative_to(ROOT)}가 유효한 JSON이 아닙니다: {exc}")
    assert isinstance(value, dict), f"{path.relative_to(ROOT)}의 최상위 값은 object여야 합니다."
    return value


def _read_doc(path: Path) -> str:
    assert path.is_file(), f"P0/P1 필수 문서가 없습니다: {path.relative_to(ROOT)}"
    text = path.read_text(encoding="utf-8")
    assert text.strip(), f"{path.relative_to(ROOT)}가 비어 있습니다."
    return text


def _nested(data: dict[str, Any], *keys: str) -> Any:
    current: Any = data
    for key in keys:
        assert isinstance(current, dict) and key in current, (
            f"필수 JSON 경로가 없습니다: {'.'.join(keys)}"
        )
        current = current[key]
    return current


def _assert_terms(path: Path, terms: list[str]) -> None:
    text = _read_doc(path).casefold()
    missing = [term for term in terms if term.casefold() not in text]
    assert not missing, (
        f"{path.relative_to(ROOT)}에 필수 결정사항이 없습니다: {', '.join(missing)}"
    )


def test_p0_rules_lock_authority_layers_and_portfolio_decisions() -> None:
    """도메인 안전 규칙은 UI와 분리된 단일 정책 파일로 고정한다."""
    rules = _load_json(RULES_PATH)

    assert _nested(rules, "version") == 1
    assert _nested(rules, "authority", "manufacturer") == "Samsung"
    assert _nested(rules, "authority", "catalogYear") == 2024
    assert _nested(rules, "authority", "source") == (
        "data/Samsung-Compressor-Catalogue_2024.pdf"
    )
    assert _nested(rules, "authority", "policy") == "baseline"

    assert _nested(rules, "layers", "baseline") == "samsung_catalog_2024"
    assert _nested(rules, "layers", "postCatalog", "field") == "postCatalog"
    assert _nested(rules, "layers", "postCatalog", "requiredValue") is True

    assert _nested(rules, "portfolio", "R290") == {
        "Re": "gap",
        "Ro": "have",
        "Sc": "have",
    }
    assert _nested(rules, "portfolio", "R454B", "Ro") == "have"
    assert _nested(rules, "portfolio", "R454B", "Sc") == "have"


def test_p0_rules_lock_comparison_e2e_and_view_first_mvp() -> None:
    """직접비교·E2E·MVP 범위는 구현자가 임의로 넓히지 못하게 고정한다."""
    rules = _load_json(RULES_PATH)

    assert _nested(rules, "benchmark", "directComparisonKey") == [
        "type",
        "refrigerant",
        "condition",
        "driveClass",
    ]
    assert _nested(rules, "benchmark", "similarityCapacityTolerancePct") == 15
    assert _nested(rules, "benchmark", "crossGroupRanking") == "forbidden"

    assert _nested(rules, "e2e", "localConsecutivePasses") == 2
    assert _nested(rules, "e2e", "githubActionsRuns") == 1

    assert _nested(rules, "mvp", "mode") == "view-first"
    assert _nested(rules, "mvp", "dataEditing") is False
    assert _nested(rules, "mvp", "publishing") is False
    assert _nested(rules, "mvp", "approvalRecording") is True


def test_p0_snapshot_is_hash_pinned_and_preserves_current_counts() -> None:
    """현재 76개 데이터가 이관 중 손실되지 않도록 기준선과 원본 해시를 고정한다."""
    snapshot = _load_json(SNAPSHOT_PATH)

    assert _nested(snapshot, "snapshotVersion") == 1
    assert _nested(snapshot, "counts") == {
        "models": 76,
        "samsungModels": 27,
        "competitorModels": 49,
        "benchmarkGroups": 13,
    }

    assert _nested(snapshot, "source", "path") == "frontend/compressor-data.js"
    recorded_sha = _nested(snapshot, "source", "sha256")
    assert re.fullmatch(r"[0-9a-f]{64}", recorded_sha), (
        "snapshot.source.sha256는 소문자 SHA-256이어야 합니다."
    )
    actual_sha = hashlib.sha256(DATA_SOURCE_PATH.read_bytes()).hexdigest()
    assert recorded_sha == actual_sha, (
        "compressor-data.js가 기준선 생성 후 변경되었습니다. "
        "변경 의도를 검토한 뒤 스냅샷을 다시 생성하세요."
    )


def test_p0_snapshot_locks_authoritative_catalog_facts() -> None:
    """확정된 Samsung 권위값과 포트폴리오 판정의 회귀를 차단한다."""
    snapshot = _load_json(SNAPSHOT_PATH)

    assert _nested(snapshot, "authority") == {
        "manufacturer": "Samsung",
        "catalogYear": 2024,
        "source": "data/Samsung-Compressor-Catalogue_2024.pdf",
    }
    assert _nested(snapshot, "criticalFacts", "DS4BC7066FVT", "cop") == pytest.approx(
        3.25
    )
    assert _nested(snapshot, "criticalFacts", "R290") == {
        "Re": "gap",
        "Ro": "have",
        "Sc": "have",
    }
    assert _nested(snapshot, "criticalFacts", "R454B", "Ro") == "have"
    assert _nested(snapshot, "criticalFacts", "R454B", "Sc") == "have"


def test_p1_catalog_schema_exposes_normalized_comparison_contract() -> None:
    """모델 스키마는 직접비교와 출처 추적에 필요한 필드를 강제한다."""
    schema = _load_json(SCHEMA_PATH)

    assert schema.get("$schema") == "https://json-schema.org/draft/2020-12/schema"
    assert schema.get("type") == "object"

    required = set(schema.get("required", []))
    assert {
        "model",
        "manufacturer",
        "type",
        "refrigerant",
        "condition",
        "driveClass",
        "sourceLayer",
        "postCatalog",
        "evidence",
    } <= required

    properties = schema.get("properties")
    assert isinstance(properties, dict), "catalog.schema.json에 properties가 필요합니다."
    assert properties["type"]["enum"] == ["Re", "Ro", "Sc"]
    assert properties["sourceLayer"]["enum"] == [
        "samsung_catalog_2024",
        "samsung_legacy_research",
        "post_catalog",
        "competitor_research",
    ]
    assert properties["postCatalog"]["type"] == "boolean"
    assert set(properties["evidence"]["required"]) >= {"sourcePath"}


def test_scope_document_records_frozen_baseline_and_operating_boundary() -> None:
    """P0 범위 문서에는 기준선, 권위 소스, 실행 범위가 함께 있어야 한다."""
    _assert_terms(
        SCOPE_DOC_PATH,
        [
            "View-first",
            "Samsung-Compressor-Catalogue_2024.pdf",
            "76",
            "27",
            "49",
            "13",
            "로컬 E2E 2회",
            "GitHub Actions 1회",
            "승인자 기록",
        ],
    )


def test_data_contract_document_records_non_negotiable_domain_rules() -> None:
    """P1 계약 문서에는 레이어링과 비교 금지 규칙을 사람이 읽을 수 있게 남긴다."""
    _assert_terms(
        DATA_CONTRACT_DOC_PATH,
        [
            "Baseline",
            "Post-catalog",
            "postCatalog",
            "type × refrigerant × condition × driveClass",
            "±15%",
            "R290",
            "R454B",
            "DS4BC7066FVT",
            "3.25",
            "군 교차 순위 금지",
        ],
    )


def test_test_plan_documents_all_golden_e2e_release_safety_cases() -> None:
    """정상·차단·공백·권위·발행·추적의 여섯 흐름을 E2E 기준으로 고정한다."""
    _assert_terms(
        TEST_PLAN_DOC_PATH,
        [
            "G1-DIRECT",
            "G2-CONDITION-MISMATCH",
            "G3-PORTFOLIO-GAP",
            "G4-AUTHORITY",
            "G5-RELEASE-SAFETY",
            "G6-EVIDENCE-TRACE",
            "2회 연속",
            "GitHub Actions",
            "Critical 0",
            "Major 0",
        ],
    )
