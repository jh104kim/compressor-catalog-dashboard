from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


CONDITION_FACTORS_TO_ARI = {
    "ARI": 1.0,
    "DOE-A": 0.84,
    "DOE-B": 0.63,
}


@dataclass(frozen=True)
class ComparisonResult:
    verdict: str
    code: str
    reason: str
    baseline_model_id: str
    candidate_model_id: str
    metric: str
    capacity_diff_pct: float | None = None
    delta_pct: float | None = None
    ranking_allowed: bool = False
    normalized_baseline_metric: float | None = None
    normalized_candidate_metric: float | None = None

    def to_dict(self) -> dict[str, Any]:
        values = asdict(self)
        return {
            "verdict": values["verdict"],
            "code": values["code"],
            "reason": values["reason"],
            "baselineModelId": values["baseline_model_id"],
            "candidateModelId": values["candidate_model_id"],
            "metric": values["metric"],
            "capacityDiffPct": values["capacity_diff_pct"],
            "deltaPct": values["delta_pct"],
            "rankingAllowed": values["ranking_allowed"],
            "normalizedBaselineMetric": values[
                "normalized_baseline_metric"
            ],
            "normalizedCandidateMetric": values[
                "normalized_candidate_metric"
            ],
        }


def _result(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    metric: str,
    *,
    verdict: str,
    code: str,
    reason: str,
    capacity_diff_pct: float | None = None,
    delta_pct: float | None = None,
    ranking_allowed: bool = False,
    normalized_baseline_metric: float | None = None,
    normalized_candidate_metric: float | None = None,
) -> ComparisonResult:
    return ComparisonResult(
        verdict=verdict,
        code=code,
        reason=reason,
        baseline_model_id=str(baseline.get("modelId", "")),
        candidate_model_id=str(candidate.get("modelId", "")),
        metric=metric,
        capacity_diff_pct=capacity_diff_pct,
        delta_pct=delta_pct,
        ranking_allowed=ranking_allowed,
        normalized_baseline_metric=normalized_baseline_metric,
        normalized_candidate_metric=normalized_candidate_metric,
    )


def _capacity_w(model: dict[str, Any]) -> float | None:
    specs = model.get("specs") or {}
    capacity_w = specs.get("capacityW")
    if isinstance(capacity_w, (int, float)) and capacity_w > 0:
        return float(capacity_w)
    capacity_btu = specs.get("capacityBtuH")
    if isinstance(capacity_btu, (int, float)) and capacity_btu > 0:
        return float(capacity_btu) / 3.412
    return None


def compare_models(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    *,
    metric: str = "cop",
    capacity_tolerance_pct: float = 15.0,
) -> ComparisonResult:
    """두 모델을 동일 비교군 규칙으로 판정한다.

    REFERENCE와 BLOCKED는 설명용 값만 반환하고 순위·Δ를 만들지 않는다.
    """

    if baseline.get("type") != candidate.get("type"):
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_TYPE_MISMATCH",
            reason="압축기 유형이 달라 직접 비교할 수 없습니다.",
        )
    if baseline.get("refrigerant") != candidate.get("refrigerant"):
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_REFRIGERANT_MISMATCH",
            reason="냉매가 달라 직접 비교할 수 없습니다.",
        )

    baseline_condition = baseline.get("condition")
    candidate_condition = candidate.get("condition")
    if "UNKNOWN" in {baseline_condition, candidate_condition}:
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_CONDITION_UNKNOWN",
            reason="측정조건이 확인되지 않아 비교를 차단했습니다.",
        )
    baseline_heating = baseline_condition == "HP-heating"
    candidate_heating = candidate_condition == "HP-heating"
    if baseline_heating != candidate_heating:
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_HEATING_COOLING_MISMATCH",
            reason="난방 조건과 냉방 조건을 직접 비교할 수 없습니다.",
        )

    baseline_metric = (baseline.get("specs") or {}).get(metric)
    candidate_metric = (candidate.get("specs") or {}).get(metric)
    if not all(
        isinstance(value, (int, float)) and value > 0
        for value in (baseline_metric, candidate_metric)
    ):
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_METRIC_MISSING",
            reason=f"{metric} 지표가 누락되어 비교를 차단했습니다.",
        )

    if baseline_condition != candidate_condition:
        baseline_factor = CONDITION_FACTORS_TO_ARI.get(baseline_condition)
        candidate_factor = CONDITION_FACTORS_TO_ARI.get(candidate_condition)
        if baseline_factor is not None and candidate_factor is not None:
            return _result(
                baseline,
                candidate,
                metric,
                verdict="REFERENCE",
                code="REFERENCE_NORMALIZED_CONDITION",
                reason="측정조건 환산값은 참고용이며 순위에 사용하지 않습니다.",
                normalized_baseline_metric=round(
                    float(baseline_metric) * baseline_factor, 6
                ),
                normalized_candidate_metric=round(
                    float(candidate_metric) * candidate_factor, 6
                ),
            )
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_CONDITION_MISMATCH",
            reason="측정조건이 다르고 안전한 환산계수가 없어 비교를 차단했습니다.",
        )

    if baseline.get("driveClass") != candidate.get("driveClass"):
        return _result(
            baseline,
            candidate,
            metric,
            verdict="REFERENCE",
            code="REFERENCE_DRIVE_MISMATCH",
            reason="구동 분류가 달라 참고 모델로만 표시합니다.",
        )

    baseline_capacity = _capacity_w(baseline)
    candidate_capacity = _capacity_w(candidate)
    if baseline_capacity is None or candidate_capacity is None:
        return _result(
            baseline,
            candidate,
            metric,
            verdict="BLOCKED",
            code="BLOCKED_METRIC_MISSING",
            reason="용량 지표가 누락되어 유사도를 판정할 수 없습니다.",
        )

    capacity_diff_pct = (
        abs(candidate_capacity - baseline_capacity) / baseline_capacity * 100
    )
    if capacity_diff_pct > capacity_tolerance_pct + 1e-12:
        return _result(
            baseline,
            candidate,
            metric,
            verdict="REFERENCE",
            code="REFERENCE_CAPACITY_OUTSIDE_15PCT",
            reason=(
                f"용량 차이 {capacity_diff_pct:.2f}%가 "
                f"허용범위 ±{capacity_tolerance_pct:.0f}%를 초과합니다."
            ),
            capacity_diff_pct=capacity_diff_pct,
        )

    delta_pct = (
        (float(candidate_metric) - float(baseline_metric))
        / float(baseline_metric)
        * 100
    )
    return _result(
        baseline,
        candidate,
        metric,
        verdict="DIRECT",
        code="DIRECT_OK",
        reason="동일 비교 키이며 용량 차이가 허용범위 안입니다.",
        capacity_diff_pct=capacity_diff_pct,
        delta_pct=delta_pct,
        ranking_allowed=True,
    )
