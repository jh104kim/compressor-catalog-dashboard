from __future__ import annotations

import math
from typing import Any


METRICS = ("capacityW", "inputW", "cop", "eer")
COMPARISON_KEYS = ("type", "refrigerant", "condition", "driveClass")


class PerformanceMapError(ValueError):
    """성능맵 원천 단위나 점 계약이 안전하지 않을 때 발생한다."""


def _number(value: float) -> int | float:
    return int(value) if value.is_integer() else value


def normalize_speed(speed_value: float, speed_unit: str) -> dict[str, int | float]:
    """원천 단위를 보존하면서 rpm/rps만 정확히 상호 변환한다."""

    if (
        isinstance(speed_value, bool)
        or not isinstance(speed_value, (int, float))
        or not math.isfinite(float(speed_value))
        or speed_value <= 0
    ):
        raise PerformanceMapError("speedValue는 0보다 큰 유한 숫자여야 합니다.")
    if speed_unit not in {"rpm", "rps"}:
        raise PerformanceMapError("Hz는 RPM/RPS 축 회전속도로 해석할 수 없습니다.")

    value = float(speed_value)
    if speed_unit == "rpm":
        rpm = value
        rps = value / 60
    else:
        rpm = value * 60
        rps = value
    return {"rpm": _number(rpm), "rps": _number(rps)}


def _has_evidence(point: dict[str, Any]) -> bool:
    evidence = point.get("evidence")
    return bool(
        isinstance(evidence, dict)
        and evidence.get("evidenceId")
        and evidence.get("sourcePath")
        and evidence.get("authority")
        and isinstance(evidence.get("locator"), dict)
        and evidence.get("fieldPaths")
    )


def _normalized_points(model: dict[str, Any]) -> list[dict[str, Any]]:
    maps = model.get("performanceMaps")
    if not isinstance(maps, list):
        return []
    model_condition = model.get("condition")
    points: list[dict[str, Any]] = []
    for performance_map in maps:
        if not isinstance(performance_map, dict):
            continue
        if performance_map.get("condition") != model_condition:
            continue
        for point in performance_map.get("points") or []:
            if not isinstance(point, dict) or not _has_evidence(point):
                continue
            try:
                normalized = normalize_speed(
                    point.get("speedValue"), point.get("speedUnit")
                )
            except PerformanceMapError:
                continue
            metrics = {
                metric: point.get(metric)
                if isinstance(point.get(metric), (int, float))
                and not isinstance(point.get(metric), bool)
                else None
                for metric in METRICS
            }
            if all(value is None for value in metrics.values()):
                continue
            points.append(
                {
                    "speedValue": point["speedValue"],
                    "speedUnit": point["speedUnit"],
                    **normalized,
                    **metrics,
                    "valueKind": point.get("valueKind", "MEASURED"),
                    "evidence": point["evidence"],
                }
            )
    points.sort(key=lambda point: float(point["rpm"]))
    return points


def _series(role: str, model: dict[str, Any]) -> dict[str, Any]:
    points = _normalized_points(model)
    return {
        "role": role,
        "modelId": str(model.get("modelId", "")),
        "manufacturer": str(model.get("manufacturer", "")),
        "model": str(model.get("model", "")),
        "pointCount": len(points),
        "lineEligible": len(points) >= 2,
        "points": points,
    }


def _without_points(series: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {**item, "pointCount": 0, "lineEligible": False, "points": []}
        for item in series
    ]


def _common_metrics(series: list[dict[str, Any]]) -> list[str]:
    return [
        metric
        for metric in METRICS
        if all(
            item["points"]
            and all(point[metric] is not None for point in item["points"])
            for item in series
        )
    ]


def _common_range(
    series: list[dict[str, Any]],
) -> dict[str, dict[str, int | float]] | None:
    if any(not item["points"] for item in series):
        return None
    minimum = max(min(float(point["rpm"]) for point in item["points"]) for item in series)
    maximum = min(max(float(point["rpm"]) for point in item["points"]) for item in series)
    if minimum > maximum:
        return None
    return {
        "rpm": {"min": _number(minimum), "max": _number(maximum)},
        "rps": {"min": _number(minimum / 60), "max": _number(maximum / 60)},
    }


def _exact_speed_overlap(series: list[dict[str, Any]]) -> bool:
    baseline_speeds = {float(point["rpm"]) for point in series[0]["points"]}
    candidate_speeds = {float(point["rpm"]) for point in series[1]["points"]}
    return bool(baseline_speeds & candidate_speeds)


def _result(
    *,
    status: str,
    chart_eligible: bool,
    ranking_allowed: bool,
    reason: str,
    metric_options: list[str],
    common_range: dict[str, dict[str, int | float]] | None,
    series: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "status": status,
        "chartEligible": chart_eligible,
        "rankingAllowed": ranking_allowed,
        "reason": reason,
        "metricOptions": metric_options,
        "commonRange": common_range,
        "series": series,
        "safeguards": {
            "interpolation": False,
            "extrapolation": False,
            "hzAsSpeed": False,
        },
    }


def build_speed_analysis(
    baseline: dict[str, Any],
    candidate: dict[str, Any],
    *,
    comparison_allowed: bool = True,
    comparison_reason: str | None = None,
) -> dict[str, Any]:
    """검증된 원천점만으로 속도 비교 가능 상태를 결정론적으로 판정한다."""

    series = [_series("baseline", baseline), _series("candidate", candidate)]
    if any(not item["points"] for item in series):
        return _result(
            status="DATA_REQUIRED",
            chart_eligible=False,
            ranking_allowed=False,
            reason="양쪽 모델의 검증된 RPM/RPS 성능점이 모두 필요합니다.",
            metric_options=[],
            common_range=None,
            series=_without_points(series),
        )

    if not comparison_allowed:
        return _result(
            status="REFERENCE_ONLY",
            chart_eligible=False,
            ranking_allowed=False,
            reason=comparison_reason or "카탈로그 직접 비교 Gate를 통과하지 못했습니다.",
            metric_options=_common_metrics(series),
            common_range=_common_range(series),
            series=series,
        )

    mismatches = [
        key for key in COMPARISON_KEYS if baseline.get(key) != candidate.get(key)
    ]
    metrics = _common_metrics(series)
    common_range = _common_range(series)
    if mismatches:
        return _result(
            status="REFERENCE_ONLY",
            chart_eligible=False,
            ranking_allowed=False,
            reason=f"속도 비교 키가 다릅니다: {', '.join(mismatches)}",
            metric_options=metrics,
            common_range=common_range,
            series=series,
        )
    if not metrics:
        return _result(
            status="DATA_REQUIRED",
            chart_eligible=False,
            ranking_allowed=False,
            reason="양쪽 성능맵에 공통으로 완결된 지표가 없습니다.",
            metric_options=[],
            common_range=None,
            series=_without_points(series),
        )
    if common_range is None:
        return _result(
            status="REFERENCE_ONLY",
            chart_eligible=False,
            ranking_allowed=False,
            reason="검증된 속도 범위가 겹치지 않아 같은 구간을 비교할 수 없습니다.",
            metric_options=metrics,
            common_range=None,
            series=series,
        )

    exact_overlap = _exact_speed_overlap(series)
    if all(item["lineEligible"] for item in series):
        return _result(
            status="CURVE_READY",
            chart_eligible=True,
            ranking_allowed=exact_overlap,
            reason=(
                "양쪽에 두 개 이상의 검증된 성능점과 공통 속도 범위가 있습니다. "
                + (
                    "동일 속도 실측점에서만 수치 비교할 수 있습니다."
                    if exact_overlap
                    else "동일 속도 실측점이 없어 곡선 관찰만 가능하며 순위를 만들지 않습니다."
                )
            ),
            metric_options=metrics,
            common_range=common_range,
            series=series,
        )
    if exact_overlap:
        return _result(
            status="POINT_READY",
            chart_eligible=True,
            ranking_allowed=True,
            reason="동일 속도의 검증된 단일점을 Scatter로 비교합니다.",
            metric_options=metrics,
            common_range=common_range,
            series=series,
        )
    return _result(
        status="REFERENCE_ONLY",
        chart_eligible=False,
        ranking_allowed=False,
        reason="단일점은 동일 속도 실측점이 없으면 보간 없이 비교할 수 없습니다.",
        metric_options=metrics,
        common_range=common_range,
        series=series,
    )
