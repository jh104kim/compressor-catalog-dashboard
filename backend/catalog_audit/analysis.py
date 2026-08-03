from __future__ import annotations

from typing import Any

from .comparison import ComparisonResult


_AUTHORITY_LEVEL = {
    "official": 3,
    "research": 2,
    "secondary": 1,
}
_CONFIDENCE_LEVEL = {
    "High": 3,
    "Medium": 2,
    "Low": 1,
    "Unknown": 0,
}
_LEVEL_NAME = {
    0: "Unknown",
    1: "Low",
    2: "Medium",
    3: "High",
}


def _evidence_ref(model: dict[str, Any]) -> dict[str, Any]:
    evidence = model.get("evidence") or {}
    return {
        "modelId": str(model.get("modelId", "")),
        "manufacturer": str(model.get("manufacturer", "")),
        "model": str(model.get("model", "")),
        "sourcePath": str(evidence.get("sourcePath", "")),
        "authority": str(evidence.get("authority", "unknown")),
        "confidence": str(model.get("confidence", "Unknown")),
        "locator": evidence.get("locator") or {},
        "fieldPaths": evidence.get("fieldPaths") or [],
    }


def _evidence_confidence(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
) -> dict[str, Any]:
    baseline_evidence = baseline.get("evidence") or {}
    candidate_evidence = candidate.get("evidence") or {}
    baseline_authority = str(baseline_evidence.get("authority", "unknown"))
    candidate_authority = str(candidate_evidence.get("authority", "unknown"))
    baseline_confidence = str(baseline.get("confidence", "Unknown"))
    candidate_confidence = str(candidate.get("confidence", "Unknown"))
    weakest = min(
        _AUTHORITY_LEVEL.get(baseline_authority, 0),
        _AUTHORITY_LEVEL.get(candidate_authority, 0),
        _CONFIDENCE_LEVEL.get(baseline_confidence, 0),
        _CONFIDENCE_LEVEL.get(candidate_confidence, 0),
    )
    return {
        "level": _LEVEL_NAME[weakest],
        "basis": "두 모델의 authority와 confidence 중 가장 낮은 수준",
        "baselineAuthority": baseline_authority,
        "candidateAuthority": candidate_authority,
        "baselineConfidence": baseline_confidence,
        "candidateConfidence": candidate_confidence,
    }


def _direct_performance(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    comparison: ComparisonResult,
) -> dict[str, Any]:
    metric = comparison.metric
    baseline_value = (baseline.get("specs") or {}).get(metric)
    candidate_value = (candidate.get("specs") or {}).get(metric)
    delta_pct = comparison.delta_pct
    baseline_name = str(baseline.get("manufacturer", "기준 모델"))
    candidate_name = str(candidate.get("manufacturer", "경쟁 모델"))

    if delta_pct is None:
        direction = "NOT_ASSESSED"
        summary = comparison.reason
    elif delta_pct < 0:
        direction = "BASELINE_HIGHER"
        summary = (
            f"{candidate_name} {metric.upper()}은 "
            f"{baseline_name} 대비 {abs(delta_pct):.2f}% 낮습니다."
        )
    elif delta_pct > 0:
        direction = "CANDIDATE_HIGHER"
        summary = (
            f"{candidate_name} {metric.upper()}은 "
            f"{baseline_name} 대비 {abs(delta_pct):.2f}% 높습니다."
        )
    else:
        direction = "EQUAL"
        summary = f"두 모델의 {metric.upper()} 값이 같습니다."

    return {
        "allowed": True,
        "metric": metric,
        "baselineValue": baseline_value,
        "candidateValue": candidate_value,
        "capacityDiffPct": comparison.capacity_diff_pct,
        "deltaPct": delta_pct,
        "direction": direction,
        "summary": summary,
    }


def build_comparison_analysis(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    comparison: ComparisonResult,
    *,
    release_id: str,
) -> dict[str, Any]:
    """Published 카탈로그와 비교 판정만으로 재현 가능한 설명을 만든다."""

    is_direct = comparison.verdict == "DIRECT" and comparison.ranking_allowed
    if is_direct:
        condition_safety = {
            "status": "DIRECT_SAFE",
            "summary": (
                "유형·냉매·측정조건·구동 분류가 같고 "
                "용량 차이가 허용범위 안입니다."
            ),
        }
        performance = _direct_performance(baseline, candidate, comparison)
        portfolio_implications = [
            (
                f"{baseline.get('type')} · {baseline.get('refrigerant')} · "
                f"{baseline.get('condition')} · {baseline.get('driveClass')} "
                "비교군에서 직접 비교할 수 있습니다."
            ),
            "이 결과는 선택한 지표와 현재 Published Release 범위에 한정됩니다.",
        ]
        recommended_actions = [
            "양쪽 제조사의 최신 공식 데이터시트에서 동일 조건 값을 재확인합니다.",
            "제품 적용 전 운전범위와 시스템 레벨 시험 결과를 함께 검토합니다.",
        ]
        executive_summary = (
            f"{condition_safety['summary']} {performance['summary']}"
        )
    else:
        status = (
            "REFERENCE_ONLY"
            if comparison.verdict == "REFERENCE"
            else "COMPARISON_BLOCKED"
        )
        condition_safety = {
            "status": status,
            "summary": comparison.reason,
        }
        performance = {
            "allowed": False,
            "metric": comparison.metric,
            "baselineValue": None,
            "candidateValue": None,
            "capacityDiffPct": None,
            "deltaPct": None,
            "direction": "NOT_ASSESSED",
            "summary": comparison.reason,
        }
        portfolio_implications = [
            "현재 공개 데이터만으로 직접 성능 판단을 만들지 않습니다.",
            "동일 비교 키의 공식 자료가 확보되면 다시 판정해야 합니다.",
        ]
        recommended_actions = [
            "동일 유형·냉매·측정조건·구동 분류의 공식 성능표를 확보합니다.",
            "용량과 선택 지표가 함께 표기된 원문 Evidence를 검증합니다.",
        ]
        executive_summary = (
            f"{comparison.reason} 직접 수치 해석은 생성하지 않았습니다."
        )

    return {
        "releaseId": release_id,
        "baselineModelId": str(baseline.get("modelId", "")),
        "candidateModelId": str(candidate.get("modelId", "")),
        "metric": comparison.metric,
        "executiveSummary": executive_summary,
        "conditionSafety": condition_safety,
        "performanceInterpretation": performance,
        "evidenceConfidence": _evidence_confidence(baseline, candidate),
        "portfolioImplications": portfolio_implications,
        "recommendedActions": recommended_actions,
        "limitations": [
            "카탈로그 성능값만으로 비용 절감, 수명, 소음, 품질을 판단하지 않습니다.",
            "현재 Published Release 이후 변경된 제조사 자료는 별도 갱신이 필요합니다.",
        ],
        "evidenceRefs": [
            _evidence_ref(baseline),
            _evidence_ref(candidate),
        ],
    }
