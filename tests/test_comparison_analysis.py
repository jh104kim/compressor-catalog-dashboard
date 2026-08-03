from __future__ import annotations

import json

import pytest

from backend.catalog_audit.analysis import build_comparison_analysis
from backend.catalog_audit.comparison import compare_models


def evidence(
    source_path: str,
    section: str,
    *,
    authority: str,
) -> dict:
    return {
        "evidenceId": f"evidence:{section.lower()}",
        "sourcePath": source_path,
        "authority": authority,
        "locator": {"kind": "markdown-section", "section": section},
        "fieldPaths": ["model", "specs.capacityW", "specs.eer"],
    }


def model(
    *,
    model_id: str,
    model_name: str,
    manufacturer: str,
    condition: str = "DOE-B",
    drive_class: str = "Fixed",
    capacity_w: float = 1000.0,
    eer: float = 6.64,
    confidence: str = "High",
    authority: str = "official",
) -> dict:
    return {
        "modelId": model_id,
        "model": model_name,
        "manufacturer": manufacturer,
        "type": "Sc",
        "refrigerant": "R454B",
        "condition": condition,
        "driveClass": drive_class,
        "confidence": confidence,
        "specs": {"capacityW": capacity_w, "eer": eer},
        "evidence": evidence(
            f"data/{manufacturer.lower()}-catalog.md",
            model_name,
            authority=authority,
        ),
    }


def test_p14_direct_analysis_uses_comparison_values_and_both_evidence() -> None:
    samsung = model(
        model_id="model:samsung:DS8LC5040IN",
        model_name="DS8LC5040IN",
        manufacturer="Samsung",
        capacity_w=13200.0,
        eer=6.64,
        confidence="Medium",
        authority="research",
    )
    competitor = model(
        model_id="model:gmcc:STDA031N1ULB",
        model_name="STDA031N1ULB",
        manufacturer="GMCC",
        capacity_w=12380.0,
        eer=6.43,
        authority="research",
    )
    comparison = compare_models(samsung, competitor, metric="eer")

    analysis = build_comparison_analysis(
        samsung,
        competitor,
        comparison,
        release_id="release:2026-07-30:005",
    )

    assert comparison.code == "DIRECT_OK"
    assert analysis["conditionSafety"]["status"] == "DIRECT_SAFE"
    performance = analysis["performanceInterpretation"]
    assert performance["allowed"] is True
    assert performance["metric"] == "eer"
    assert performance["baselineValue"] == pytest.approx(6.64)
    assert performance["candidateValue"] == pytest.approx(6.43)
    assert performance["capacityDiffPct"] == pytest.approx(6.212121, rel=1e-5)
    assert performance["deltaPct"] == pytest.approx(-3.1626506, rel=1e-5)
    assert performance["direction"] == "BASELINE_HIGHER"
    assert "Samsung 대비 3.16% 낮습니다" in performance["summary"]
    assert analysis["evidenceConfidence"]["level"] == "Medium"
    assert {
        item["modelId"] for item in analysis["evidenceRefs"]
    } == {
        "model:samsung:DS8LC5040IN",
        "model:gmcc:STDA031N1ULB",
    }
    assert all(item["sourcePath"].startswith("data/") for item in analysis["evidenceRefs"])
    assert analysis["releaseId"] == "release:2026-07-30:005"


@pytest.mark.parametrize(
    ("candidate_change", "expected_verdict"),
    [
        ({"condition": "SEER60"}, "BLOCKED"),
        ({"drive_class": "Variable"}, "REFERENCE"),
    ],
)
def test_p14_non_direct_analysis_never_creates_rank_or_delta_language(
    candidate_change: dict,
    expected_verdict: str,
) -> None:
    samsung = model(
        model_id="model:samsung:A",
        model_name="A",
        manufacturer="Samsung",
    )
    competitor = model(
        model_id="model:gmcc:B",
        model_name="B",
        manufacturer="GMCC",
        **candidate_change,
    )
    comparison = compare_models(samsung, competitor, metric="eer")

    analysis = build_comparison_analysis(
        samsung,
        competitor,
        comparison,
        release_id="release:test",
    )

    assert comparison.verdict == expected_verdict
    performance = analysis["performanceInterpretation"]
    assert performance == {
        "allowed": False,
        "metric": "eer",
        "baselineValue": None,
        "candidateValue": None,
        "capacityDiffPct": None,
        "deltaPct": None,
        "direction": "NOT_ASSESSED",
        "summary": comparison.reason,
    }
    rendered = json.dumps(analysis, ensure_ascii=False)
    for forbidden in ("우위", "열위", "순위", "Δ"):
        assert forbidden not in rendered


def test_p14_evidence_confidence_is_capped_by_weakest_source() -> None:
    samsung = model(
        model_id="model:samsung:A",
        model_name="A",
        manufacturer="Samsung",
        confidence="High",
        authority="official",
    )
    competitor = model(
        model_id="model:gmcc:B",
        model_name="B",
        manufacturer="GMCC",
        confidence="Low",
        authority="secondary",
    )
    comparison = compare_models(samsung, competitor, metric="eer")

    analysis = build_comparison_analysis(
        samsung,
        competitor,
        comparison,
        release_id="release:test",
    )

    confidence = analysis["evidenceConfidence"]
    assert confidence["level"] == "Low"
    assert confidence["baselineAuthority"] == "official"
    assert confidence["candidateAuthority"] == "secondary"
    assert confidence["basis"] == "두 모델의 authority와 confidence 중 가장 낮은 수준"
