from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "docs" / "12-compare-analysis-report-tdd-plan.md"
CONTRACT = ROOT / "tests" / "p14-analysis-report-contract.md"


def _read(path: Path) -> str:
    assert path.is_file(), f"필수 P14 계약 문서가 없습니다: {path}"
    return path.read_text(encoding="utf-8")


def test_p14_plan_has_planner_sections_and_tdd_order() -> None:
    plan = _read(PLAN)

    for heading in (
        "## Goal",
        "## Current structure",
        "## Proposed approach",
        "## Task breakdown",
        "## Files likely affected",
        "## Risks / open questions",
        "## Test plan",
        "## Done criteria",
    ):
        assert heading in plan
    assert "RED → GREEN → REFACTOR" in plan
    for task_id in ("P14-A", "P14-B", "P14-C", "P14-D", "P14-E"):
        assert task_id in plan


def test_p14_contract_has_requirement_and_test_traceability() -> None:
    contract = _read(CONTRACT)

    for number in range(1, 7):
        assert f"REQ-P14-{number:03d}" in contract
    for test_id in (
        "P14-UT-NAV-001",
        "P14-UT-CSV-001",
        "P14-API-ANALYSIS-001",
        "P14-UT-ANALYSIS-001",
        "P14-E2E-ANALYSIS-001",
        "P14-E2E-BLOCK-001",
        "P14-E2E-TRACE-001",
        "P14-E2E-STALE-001",
        "P14-E2E-MOBILE-001",
    ):
        assert test_id in contract
    assert "DIRECT/REFERENCE/BLOCKED" in contract
    assert "군 교차 순위 금지" in contract


def test_p14_eval_has_hard_gates_and_score_thresholds() -> None:
    contract = _read(CONTRACT)

    for gate in (
        "Critical 0",
        "Major 0",
        "96/100",
        "4.8/5",
        "최대 3회",
        "독립 Judge",
        "지연 응답",
        "stale",
    ):
        assert gate in contract
