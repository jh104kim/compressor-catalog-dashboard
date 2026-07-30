"""활성 Published Release로 Compare Lab 전체 모델 보고서를 생성한다."""

from __future__ import annotations

import argparse
import html
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.catalog_audit.comparison import compare_models


DEFAULT_ACTIVE_RELEASE = ROOT / "catalog" / "published" / "active-release.json"
DEFAULT_RULES = ROOT / "config" / "p0_catalog_rules.json"
DEFAULT_OUTPUT = ROOT / "studio" / "public" / "compare-lab-output.html"

TYPE_ORDER = ("Re", "Ro", "Sc")
TYPE_LABEL = {"Re": "왕복동", "Ro": "로터리", "Sc": "스크롤"}
LIFECYCLE_LABEL = {
    "MASS_PRODUCT": "양산",
    "IN_PROGRESS": "개발중",
    "UNKNOWN": "미확인",
}
SOURCE_LAYER_LABEL = {
    "samsung_catalog_2024": "Samsung 2024 공식",
    "samsung_legacy_research": "공식 PDF 미확정",
    "post_catalog": "2024+ 개발",
    "competitor_research": "경쟁사 조사",
}


def _escape(value: Any) -> str:
    return html.escape(str(value), quote=True)


def _capacity_w(model: dict[str, Any]) -> float | None:
    specs = model.get("specs") or {}
    capacity_w = specs.get("capacityW")
    if isinstance(capacity_w, (int, float)) and capacity_w > 0:
        return float(capacity_w)
    capacity_btu = specs.get("capacityBtuH")
    if isinstance(capacity_btu, (int, float)) and capacity_btu > 0:
        return float(capacity_btu) / 3.412
    return None


def _metric_value(value: Any, digits: int = 2) -> str:
    if not isinstance(value, (int, float)):
        return "미확보"
    return f"{value:,.{digits}f}".rstrip("0").rstrip(".")


def _capacity_value(model: dict[str, Any]) -> str:
    value = _capacity_w(model)
    return "미확보" if value is None else f"{value:,.0f} W"


def _model_url(model_id: str) -> str:
    return f"/?view=model&amp;modelId={quote(model_id, safe='')}"


def _compare_url(baseline_id: str, candidate_id: str, metric: str) -> str:
    return (
        "/?view=compare"
        f"&amp;baselineModelId={quote(baseline_id, safe='')}"
        f"&amp;candidateModelId={quote(candidate_id, safe='')}"
        f"&amp;metric={metric}"
    )


def load_active_catalog(
    *,
    active_release_path: Path = DEFAULT_ACTIVE_RELEASE,
    rules_path: Path = DEFAULT_RULES,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    active = json.loads(active_release_path.read_text(encoding="utf-8"))
    release_slug = active["releaseId"].replace(":", "_")
    release_dir = active_release_path.parent / "releases" / release_slug
    release = json.loads((release_dir / "release.json").read_text(encoding="utf-8"))
    bundle = json.loads((release_dir / "bundle.json").read_text(encoding="utf-8"))
    rules = json.loads(rules_path.read_text(encoding="utf-8"))
    return release, bundle, rules


def _research_target(
    model: dict[str, Any],
    competitors: list[dict[str, Any]],
    metric: str,
) -> dict[str, Any]:
    model_capacity = _capacity_w(model)
    same_type = [item for item in competitors if item["type"] == model["type"]]
    same_refrigerant = [
        item for item in same_type if item["refrigerant"] == model["refrigerant"]
    ]
    same_key = [
        item
        for item in same_refrigerant
        if item["condition"] == model["condition"]
        and item["driveClass"] == model["driveClass"]
        and isinstance((item.get("specs") or {}).get(metric), (int, float))
        and (item.get("specs") or {}).get(metric, 0) > 0
        and _capacity_w(item) is not None
    ]
    nearest_items = []
    for item in same_refrigerant:
        item_capacity = _capacity_w(item)
        diff = None
        if model_capacity is not None and item_capacity is not None:
            diff = abs(item_capacity - model_capacity) / model_capacity * 100
        nearest_items.append((item, diff))
    nearest_items.sort(
        key=lambda pair: pair[1] if pair[1] is not None else float("inf")
    )
    nearest = nearest_items[0] if nearest_items else None
    target_pool = same_refrigerant or same_type
    manufacturers = list(dict.fromkeys(item["manufacturer"] for item in target_pool))[:3]

    baseline_metric = (model.get("specs") or {}).get(metric)
    priority = "P3"
    reason = f"동일 냉매({model['refrigerant']}) 경쟁 모델 공식 성능값이 없습니다."
    if not isinstance(baseline_metric, (int, float)) or baseline_metric <= 0:
        priority = "P1"
        reason = f"Samsung 기준 {metric.upper()} 값이 없어 비교를 실행할 수 없습니다."
    elif same_key:
        differences = []
        for item in same_key:
            item_capacity = _capacity_w(item)
            if model_capacity is not None and item_capacity is not None:
                differences.append(
                    abs(item_capacity - model_capacity) / model_capacity * 100
                )
        nearest_diff = min(differences) if differences else float("inf")
        priority = "P1" if nearest_diff <= 30 else "P2"
        reason = (
            "동일 비교 키 후보는 있으나 최근접 용량 차이 "
            f"{nearest_diff:.1f}%로 ±15%를 벗어납니다."
        )
    elif same_refrigerant:
        same_condition = any(
            item["condition"] == model["condition"] for item in same_refrigerant
        )
        same_drive = any(
            item["driveClass"] == model["driveClass"] for item in same_refrigerant
        )
        near_capacity = (
            nearest is not None
            and nearest[1] is not None
            and nearest[1] <= 15
        )
        priority = "P1" if near_capacity else "P2"
        if not same_condition:
            qualifier = "용량이 근접하지만 " if near_capacity else ""
            reason = (
                f"{qualifier}{model['condition']} 측정조건의 공식값이 없습니다."
            )
        elif not same_drive:
            reason = f"{model['driveClass']} 구동 분류의 공식 성능값이 없습니다."
        else:
            reason = f"{metric.upper()} 또는 용량 공식값이 누락됐습니다."

    capacity_range = "용량 확인 필요"
    if model_capacity is not None:
        capacity_range = (
            f"{model_capacity * 0.85:,.0f}~{model_capacity * 1.15:,.0f} W"
        )
    return {
        "metric": metric,
        "priority": priority,
        "reason": reason,
        "targetManufacturers": manufacturers,
        "capacityRange": capacity_range,
    }


def build_report_data(
    release: dict[str, Any],
    bundle: dict[str, Any],
    rules: dict[str, Any],
) -> dict[str, Any]:
    samsung = sorted(
        (
            item
            for item in bundle["models"]
            if item["manufacturer"] == "Samsung"
        ),
        key=lambda item: (TYPE_ORDER.index(item["type"]), item["model"]),
    )
    competitors = [
        item for item in bundle["models"] if item["manufacturer"] != "Samsung"
    ]
    tolerance = rules["benchmark"]["similarityCapacityTolerancePct"]
    report_models = []
    direct_rows = []

    for baseline in samsung:
        model_results: dict[str, list[dict[str, Any]]] = {"cop": [], "eer": []}
        research: dict[str, dict[str, Any]] = {}
        for metric in ("cop", "eer"):
            for candidate in competitors:
                result = compare_models(
                    baseline,
                    candidate,
                    metric=metric,
                    capacity_tolerance_pct=tolerance,
                )
                if result.verdict != "DIRECT":
                    continue
                row = {
                    "baseline": baseline,
                    "candidate": candidate,
                    "metric": metric,
                    "result": result.to_dict(),
                }
                model_results[metric].append(row)
                direct_rows.append(row)
            model_results[metric].sort(
                key=lambda row: (
                    row["candidate"]["manufacturer"],
                    row["candidate"]["model"],
                )
            )
            if not model_results[metric]:
                research[metric] = _research_target(
                    baseline, competitors, metric
                )
        report_models.append(
            {
                "model": baseline,
                "results": model_results,
                "research": research,
                "directReady": bool(
                    model_results["cop"] or model_results["eer"]
                ),
            }
        )

    unique_pairs = {
        (
            row["baseline"]["modelId"],
            row["candidate"]["modelId"],
        )
        for row in direct_rows
    }
    type_summary = {}
    for compressor_type in TYPE_ORDER:
        typed = [
            item
            for item in report_models
            if item["model"]["type"] == compressor_type
        ]
        typed_rows = [
            row
            for row in direct_rows
            if row["baseline"]["type"] == compressor_type
        ]
        typed_pairs = {
            (
                row["baseline"]["modelId"],
                row["candidate"]["modelId"],
            )
            for row in typed_rows
        }
        type_summary[compressor_type] = {
            "models": len(typed),
            "readyModels": sum(item["directReady"] for item in typed),
            "pairs": len(typed_pairs),
            "comparisons": len(typed_rows),
        }

    return {
        "release": release,
        "bundle": bundle,
        "rules": rules,
        "models": report_models,
        "directRows": direct_rows,
        "summary": {
            "samsungModels": len(samsung),
            "competitorModels": len(competitors),
            "readyModels": sum(item["directReady"] for item in report_models),
            "researchModels": sum(not item["directReady"] for item in report_models),
            "uniquePairs": len(unique_pairs),
            "comparisons": len(direct_rows),
            "types": Counter(item["type"] for item in samsung),
        },
        "typeSummary": type_summary,
    }


def _delta_view(delta: float) -> tuple[str, str]:
    if delta > 0.005:
        return f"+{delta:.2f}%", f"경쟁사 {delta:.2f}% 우위"
    if delta < -0.005:
        return f"{delta:.2f}%", f"Samsung {abs(delta):.2f}% 우위"
    return "0.00%", "동등"


def _render_direct_table(rows: list[dict[str, Any]]) -> str:
    body = []
    for row in rows:
        baseline = row["baseline"]
        candidate = row["candidate"]
        metric = row["metric"]
        result = row["result"]
        baseline_value = (baseline.get("specs") or {}).get(metric)
        candidate_value = (candidate.get("specs") or {}).get(metric)
        delta, interpretation = _delta_view(float(result["deltaPct"]))
        body.append(
            f"""
            <tr data-testid="direct-comparison-row"
                data-baseline-id="{_escape(baseline['modelId'])}"
                data-candidate-id="{_escape(candidate['modelId'])}"
                data-metric="{metric}">
              <td>
                <strong>{_escape(candidate['manufacturer'])}</strong>
                <a href="{_model_url(candidate['modelId'])}">{_escape(candidate['model'])}</a>
              </td>
              <td><span class="metric-pill">{metric.upper()}</span></td>
              <td>{_metric_value(baseline_value)}</td>
              <td>{_metric_value(candidate_value)}</td>
              <td>{float(result['capacityDiffPct']):.2f}%</td>
              <td><strong>{delta}</strong><small>{_escape(interpretation)}</small></td>
              <td>
                <span class="direct-code">DIRECT_OK</span>
                <a class="open-lab" href="{_compare_url(baseline['modelId'], candidate['modelId'], metric)}">Compare Lab 열기</a>
              </td>
            </tr>
            """
        )
    return f"""
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>경쟁 모델</th>
              <th>지표</th>
              <th>Samsung</th>
              <th>경쟁사</th>
              <th>용량 차이</th>
              <th>경쟁사 Δ</th>
              <th>판정</th>
            </tr>
          </thead>
          <tbody>{''.join(body)}</tbody>
        </table>
      </div>
    """


def _render_research(target: dict[str, Any]) -> str:
    manufacturers = ", ".join(target["targetManufacturers"]) or "신규 공식 자료 탐색"
    return f"""
      <div class="research-note" data-testid="research-gap">
        <div>
          <span class="priority">{_escape(target['priority'])}</span>
          <strong>직접 비교 없음</strong>
        </div>
        <p>{_escape(target['reason'])}</p>
        <dl>
          <div><dt>용량 목표</dt><dd>{_escape(target['capacityRange'])}</dd></div>
          <div><dt>우선 조사사</dt><dd>{_escape(manufacturers)}</dd></div>
        </dl>
      </div>
    """


def _render_model_card(item: dict[str, Any]) -> str:
    model = item["model"]
    specs = model.get("specs") or {}
    evidence = model.get("evidence") or {}
    ready_class = "ready" if item["directReady"] else "gap"
    ready_label = "직접 비교 가능" if item["directReady"] else "공식자료 보완 필요"
    metric_blocks = []
    for metric in ("cop", "eer"):
        rows = item["results"][metric]
        metric_blocks.append(
            f"""
            <section class="metric-section">
              <div class="metric-heading">
                <div>
                  <span>{metric.upper()} 기준값</span>
                  <strong>{_metric_value(specs.get(metric))}</strong>
                </div>
                <span>{len(rows)}개 직접 비교</span>
              </div>
              {_render_direct_table(rows) if rows else _render_research(item['research'][metric])}
            </section>
            """
        )
    return f"""
      <article class="model-card {ready_class}" data-testid="samsung-model-card"
               data-type="{_escape(model['type'])}" data-model="{_escape(model['model'])}">
        <header class="model-head">
          <div>
            <p>{_escape(model['type'])} · {_escape(TYPE_LABEL[model['type']])}</p>
            <h3>{_escape(model['model'])}</h3>
            <span>{_escape(model.get('application') or '용도 미확인')}</span>
          </div>
          <div class="model-actions">
            <span class="model-state {ready_class}">{ready_label}</span>
            <a href="{_model_url(model['modelId'])}">모델 근거 보기</a>
          </div>
        </header>
        <div class="model-meta">
          <div><span>냉매</span><strong>{_escape(model['refrigerant'])}</strong></div>
          <div><span>측정조건</span><strong>{_escape(model['condition'])}</strong></div>
          <div><span>구동</span><strong>{_escape(model['driveClass'])}</strong></div>
          <div><span>용량</span><strong>{_capacity_value(model)}</strong></div>
          <div><span>상태</span><strong>{_escape(LIFECYCLE_LABEL.get(model.get('lifecycleStatus'), model.get('lifecycleStatus', '미확인')))}</strong></div>
          <div><span>출처층</span><strong>{_escape(SOURCE_LAYER_LABEL.get(model.get('sourceLayer'), model.get('sourceLayer', '미확인')))}</strong></div>
        </div>
        <p class="source-line">근거: {_escape(evidence.get('sourcePath', '미확인'))}</p>
        {''.join(metric_blocks)}
      </article>
    """


def _render_summary_table(data: dict[str, Any]) -> str:
    rows = []
    for item in data["models"]:
        model = item["model"]
        candidate_names = {}
        for metric in ("cop", "eer"):
            candidate_names[metric] = ", ".join(
                f"{row['candidate']['manufacturer']} {row['candidate']['model']}"
                for row in item["results"][metric]
            ) or "없음"
        rows.append(
            f"""
            <tr>
              <td><span class="type-tag type-{_escape(model['type'])}">{_escape(model['type'])}</span></td>
              <td><a href="#model-{quote(model['modelId'], safe='')}">{_escape(model['model'])}</a></td>
              <td>{_escape(model['refrigerant'])}</td>
              <td>{_escape(model['condition'])} · {_escape(model['driveClass'])}</td>
              <td>{_escape(candidate_names['cop'])}</td>
              <td>{_escape(candidate_names['eer'])}</td>
              <td><span class="matrix-state {'ready' if item['directReady'] else 'gap'}">{'가능' if item['directReady'] else '보완'}</span></td>
            </tr>
            """
        )
    return f"""
      <div class="table-wrap summary-table">
        <table>
          <thead>
            <tr>
              <th>유형</th>
              <th>Samsung 모델</th>
              <th>냉매</th>
              <th>조건 · 구동</th>
              <th>COP 직접 후보</th>
              <th>EER 직접 후보</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>{''.join(rows)}</tbody>
        </table>
      </div>
    """


def render_report(data: dict[str, Any]) -> str:
    summary = data["summary"]
    release = data["release"]
    rules = data["rules"]
    model_sections = []
    for compressor_type in TYPE_ORDER:
        typed = [
            item
            for item in data["models"]
            if item["model"]["type"] == compressor_type
        ]
        type_summary = data["typeSummary"][compressor_type]
        cards = []
        for item in typed:
            card = _render_model_card(item)
            card = card.replace(
                'class="model-card ',
                f'id="model-{quote(item["model"]["modelId"], safe="")}" class="model-card ',
                1,
            )
            cards.append(card)
        model_sections.append(
            f"""
            <section class="report-section type-section" id="type-{compressor_type}"
                     data-type-section="{compressor_type}">
              <div class="section-title">
                <div>
                  <span>TYPE {compressor_type}</span>
                  <h2>{TYPE_LABEL[compressor_type]} 전체 모델</h2>
                </div>
                <p>{type_summary['models']}개 중 직접 비교 가능 {type_summary['readyModels']}개 · 고유 모델쌍 {type_summary['pairs']}개 · 지표 판정 {type_summary['comparisons']}건</p>
              </div>
              <div class="model-stack">{''.join(cards)}</div>
            </section>
            """
        )

    type_cards = []
    for compressor_type in TYPE_ORDER:
        item = data["typeSummary"][compressor_type]
        type_cards.append(
            f"""
            <a class="type-summary type-{compressor_type}" href="#type-{compressor_type}">
              <span>{compressor_type}</span>
              <strong>{TYPE_LABEL[compressor_type]}</strong>
              <p>{item['models']}개 모델 · 비교 가능 {item['readyModels']}개</p>
              <small>직접 판정 {item['comparisons']}건</small>
            </a>
            """
        )

    warnings = release["validationSummary"].get("warningCount", 0)
    tolerance = rules["benchmark"]["similarityCapacityTolerancePct"]
    report_html = f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Samsung Compressor Compare Lab 전체 보고서</title>
  <style>
    :root {{
      --ink:#10213d; --muted:#68758a; --line:#dce4ef; --paper:#fff;
      --canvas:#f3f6fa; --blue:#1f66ff; --navy:#0e2b55; --green:#087a55;
      --orange:#c65f12; --red:#c23b4b; --re:#ff385c; --ro:#00a699; --sc:#fc642d;
      --shadow:0 16px 42px rgba(19,42,75,.08);
    }}
    * {{ box-sizing:border-box; }}
    html {{ scroll-behavior:smooth; }}
    body {{ margin:0; color:var(--ink); background:var(--canvas); font-family:"Segoe UI","Malgun Gothic",Arial,sans-serif; line-height:1.58; }}
    a {{ color:var(--blue); text-decoration:none; }}
    a:hover {{ text-decoration:underline; }}
    .topbar {{ position:sticky; top:0; z-index:20; display:flex; align-items:center; gap:24px; min-height:64px; padding:12px max(24px,calc((100vw - 1320px)/2)); background:rgba(255,255,255,.96); border-bottom:1px solid var(--line); backdrop-filter:blur(14px); }}
    .brand {{ margin-right:auto; display:flex; align-items:center; gap:10px; font-weight:800; }}
    .brand i {{ display:grid; place-items:center; width:34px; height:34px; color:#fff; background:linear-gradient(135deg,#1a73e8,#00a699); border-radius:10px; font-style:normal; }}
    .topbar nav {{ display:flex; gap:8px; flex-wrap:wrap; }}
    .topbar nav a {{ padding:7px 10px; color:#3c4c65; border-radius:8px; font-size:13px; font-weight:700; }}
    .topbar nav a:hover {{ background:#edf3ff; text-decoration:none; }}
    .print-btn {{ border:1px solid var(--line); background:#fff; color:var(--ink); padding:8px 12px; border-radius:9px; font-weight:700; cursor:pointer; }}
    .container {{ width:min(1320px,calc(100% - 40px)); margin:0 auto; }}
    .hero {{ color:#fff; background:radial-gradient(circle at 85% 20%,rgba(31,102,255,.5),transparent 30%),linear-gradient(135deg,#0a1e3e 0%,#12396b 100%); padding:76px 0 66px; }}
    .eyebrow {{ margin:0 0 10px; color:#7fb5ff; font-size:12px; font-weight:900; letter-spacing:.15em; }}
    h1 {{ max-width:820px; margin:0; font-size:clamp(34px,5vw,62px); line-height:1.08; letter-spacing:-.04em; }}
    .hero-copy {{ max-width:760px; margin:20px 0 28px; color:#d6e4f7; font-size:17px; }}
    .release-line {{ display:flex; gap:9px; flex-wrap:wrap; }}
    .release-line span {{ padding:7px 10px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.08); border-radius:999px; font-size:12px; }}
    .kpi-grid {{ display:grid; grid-template-columns:repeat(6,1fr); gap:12px; margin-top:-30px; position:relative; }}
    .kpi {{ min-height:118px; padding:20px; background:var(--paper); border:1px solid var(--line); border-radius:16px; box-shadow:var(--shadow); }}
    .kpi span {{ display:block; color:var(--muted); font-size:12px; font-weight:700; }}
    .kpi strong {{ display:block; margin:8px 0 2px; font-size:31px; letter-spacing:-.03em; }}
    .kpi small {{ color:var(--muted); }}
    .report-section {{ margin:30px 0; padding:30px; background:var(--paper); border:1px solid var(--line); border-radius:20px; box-shadow:0 8px 28px rgba(19,42,75,.04); }}
    .section-title {{ display:flex; justify-content:space-between; align-items:end; gap:20px; margin-bottom:22px; }}
    .section-title span {{ color:var(--blue); font-size:11px; font-weight:900; letter-spacing:.14em; }}
    h2 {{ margin:5px 0 0; font-size:28px; letter-spacing:-.03em; }}
    .section-title p {{ max-width:620px; margin:0; color:var(--muted); text-align:right; }}
    .type-grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }}
    .type-summary {{ display:block; padding:22px; color:var(--ink); background:#f8fafc; border:1px solid var(--line); border-top:4px solid; border-radius:14px; }}
    .type-summary:hover {{ transform:translateY(-2px); box-shadow:var(--shadow); text-decoration:none; }}
    .type-summary.type-Re {{ border-top-color:var(--re); }} .type-summary.type-Ro {{ border-top-color:var(--ro); }} .type-summary.type-Sc {{ border-top-color:var(--sc); }}
    .type-summary span {{ float:right; color:var(--muted); font-weight:900; }}
    .type-summary strong {{ display:block; font-size:20px; }}
    .type-summary p {{ margin:8px 0 2px; }} .type-summary small {{ color:var(--muted); }}
    .rule-grid {{ display:grid; grid-template-columns:repeat(5,1fr); gap:10px; counter-reset:rule; }}
    .rule-grid div {{ padding:16px; background:#f7f9fc; border:1px solid var(--line); border-radius:12px; }}
    .rule-grid div::before {{ counter-increment:rule; content:counter(rule); display:grid; place-items:center; width:24px; height:24px; margin-bottom:10px; color:#fff; background:var(--blue); border-radius:50%; font-size:12px; font-weight:900; }}
    .rule-grid strong {{ display:block; }} .rule-grid span {{ color:var(--muted); font-size:12px; }}
    .method-note {{ margin-top:14px; padding:14px 16px; color:#61420d; background:#fff8e8; border:1px solid #f5d48f; border-radius:11px; }}
    .table-wrap {{ overflow-x:auto; border:1px solid var(--line); border-radius:12px; }}
    table {{ width:100%; border-collapse:collapse; font-size:13px; }}
    th {{ padding:11px 12px; color:#526178; background:#f6f8fb; text-align:left; white-space:nowrap; }}
    td {{ padding:12px; border-top:1px solid #e8edf4; vertical-align:top; }}
    td small {{ display:block; margin-top:3px; color:var(--muted); white-space:nowrap; }}
    td a {{ display:block; font-weight:700; }}
    .summary-table td:nth-child(5),.summary-table td:nth-child(6) {{ min-width:210px; }}
    .type-tag,.metric-pill,.direct-code,.matrix-state,.model-state,.priority {{ display:inline-flex; align-items:center; padding:4px 8px; border-radius:999px; font-size:11px; font-weight:900; white-space:nowrap; }}
    .type-tag {{ color:#fff; }} .type-Re {{ background:var(--re); }} .type-Ro {{ background:var(--ro); }} .type-Sc {{ background:var(--sc); }}
    .metric-pill {{ color:#31547f; background:#eaf2ff; }} .direct-code,.matrix-state.ready,.model-state.ready {{ color:#04724e; background:#e8f8f1; }}
    .matrix-state.gap,.model-state.gap,.priority {{ color:#a44a0a; background:#fff0e3; }}
    .open-lab {{ margin-top:6px; font-size:12px; }}
    .type-section {{ scroll-margin-top:80px; }}
    .model-stack {{ display:grid; gap:18px; }}
    .model-card {{ scroll-margin-top:82px; overflow:hidden; border:1px solid var(--line); border-left:4px solid #9cabbc; border-radius:16px; }}
    .model-card.ready {{ border-left-color:var(--green); }}
    .model-head {{ display:flex; justify-content:space-between; gap:18px; padding:20px 22px; background:#fbfcfe; border-bottom:1px solid var(--line); }}
    .model-head p {{ margin:0; color:var(--blue); font-size:11px; font-weight:900; letter-spacing:.1em; }}
    .model-head h3 {{ margin:3px 0 1px; font-size:23px; }} .model-head span {{ color:var(--muted); }}
    .model-actions {{ display:flex; align-items:flex-end; flex-direction:column; gap:8px; }}
    .model-actions a {{ font-size:12px; font-weight:700; }}
    .model-meta {{ display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--line); border-bottom:1px solid var(--line); }}
    .model-meta div {{ padding:13px 14px; background:#fff; }} .model-meta span {{ display:block; color:var(--muted); font-size:11px; }}
    .model-meta strong {{ display:block; margin-top:3px; font-size:13px; word-break:break-word; }}
    .source-line {{ margin:0; padding:11px 16px; color:var(--muted); background:#fbfcfe; border-bottom:1px solid var(--line); font-size:11px; }}
    .metric-section {{ padding:18px 20px; }} .metric-section + .metric-section {{ border-top:1px solid var(--line); }}
    .metric-heading {{ display:flex; align-items:end; justify-content:space-between; margin-bottom:12px; }}
    .metric-heading div span {{ display:block; color:var(--muted); font-size:11px; }} .metric-heading div strong {{ font-size:22px; }}
    .metric-heading > span {{ color:var(--muted); font-size:12px; font-weight:700; }}
    .research-note {{ padding:15px 16px; background:#fffaf5; border:1px dashed #efbd8e; border-radius:11px; }}
    .research-note > div {{ display:flex; align-items:center; gap:8px; }} .research-note p {{ margin:8px 0; color:#6d4d30; }}
    .research-note dl {{ display:flex; gap:28px; margin:0; }} .research-note dl div {{ display:flex; gap:6px; }}
    .research-note dt {{ color:var(--muted); font-size:12px; }} .research-note dd {{ margin:0; font-size:12px; font-weight:700; }}
    .footer {{ margin-top:40px; padding:34px 0 50px; color:#cbd8e8; background:var(--navy); }}
    .footer .container {{ display:flex; justify-content:space-between; gap:20px; }} .footer p {{ margin:0; }}
    .footer a {{ color:#fff; font-weight:800; }}
    @media (max-width:1000px) {{
      .kpi-grid {{ grid-template-columns:repeat(3,1fr); }} .model-meta {{ grid-template-columns:repeat(3,1fr); }}
      .rule-grid {{ grid-template-columns:repeat(2,1fr); }} .topbar nav {{ display:none; }}
    }}
    @media (max-width:650px) {{
      .container {{ width:min(100% - 24px,1320px); }} .hero {{ padding:52px 0; }} .kpi-grid {{ grid-template-columns:repeat(2,1fr); }}
      .report-section {{ padding:18px; border-radius:15px; }} .section-title,.model-head,.footer .container {{ align-items:flex-start; flex-direction:column; }}
      .section-title p {{ text-align:left; }} .type-grid {{ grid-template-columns:1fr; }} .model-meta {{ grid-template-columns:repeat(2,1fr); }}
      .model-actions {{ align-items:flex-start; }} .research-note dl {{ flex-direction:column; gap:5px; }} .rule-grid {{ grid-template-columns:1fr; }}
      .topbar {{ padding:10px 12px; }} .print-btn {{ margin-left:auto; }}
    }}
    @media print {{
      body {{ background:#fff; }} .topbar,.print-btn {{ display:none; }} .hero {{ padding:30px 0; }}
      .report-section,.model-card,.kpi {{ box-shadow:none; break-inside:avoid; }} a {{ color:inherit; }}
    }}
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand"><i>S</i> Samsung Compressor Compare Lab</div>
    <nav aria-label="보고서 목차">
      <a href="#summary">요약</a><a href="#matrix">전체 매트릭스</a>
      <a href="#type-Re">Re</a><a href="#type-Ro">Ro</a><a href="#type-Sc">Sc</a>
    </nav>
    <button class="print-btn" type="button" onclick="window.print()">인쇄 / PDF</button>
  </header>

  <main>
    <section class="hero">
      <div class="container">
        <p class="eyebrow">COMPRESSOR INTELLIGENCE · COMPARE LAB OUTPUT</p>
        <h1>Samsung Re · Ro · Sc<br>전 모델 비교 보고서</h1>
        <p class="hero-copy">활성 Published Release의 27개 Samsung 모델을 전수 점검하고, Compare Lab의 동일 비교 규칙으로 허용된 경쟁 모델과 COP/EER 결과만 수록했습니다.</p>
        <div class="release-line">
          <span>{_escape(release['releaseId'])}</span>
          <span>{_escape(release['status'])}</span>
          <span>승인 {_escape(release['approvedAt'])}</span>
          <span>Critical 0 · Major 0 · Warning {warnings}</span>
        </div>
      </div>
    </section>

    <div class="container">
      <section class="kpi-grid" aria-label="보고서 핵심 수치">
        <div class="kpi"><span>Samsung 전 모델</span><strong>{summary['samsungModels']}</strong><small>Re 4 · Ro 12 · Sc 11</small></div>
        <div class="kpi"><span>경쟁사 모델 풀</span><strong>{summary['competitorModels']}</strong><small>Published Release 수록</small></div>
        <div class="kpi"><span>직접 비교 가능</span><strong>{summary['readyModels']}</strong><small>Samsung 모델 기준</small></div>
        <div class="kpi"><span>공식자료 보완</span><strong>{summary['researchModels']}</strong><small>직접 후보 0개</small></div>
        <div class="kpi"><span>고유 모델쌍</span><strong>{summary['uniquePairs']}</strong><small>Samsung ↔ 경쟁사</small></div>
        <div class="kpi"><span>Compare Lab 판정</span><strong>{summary['comparisons']}</strong><small>COP/EER 합계</small></div>
      </section>

      <section class="report-section" id="summary">
        <div class="section-title">
          <div><span>EXECUTIVE SUMMARY</span><h2>유형별 직접 비교 준비도</h2></div>
          <p>직접 비교가 없다는 것은 성능 열위가 아니라, 현재 확보한 공개 카탈로그 안에 동일 조건 후보가 없다는 뜻입니다.</p>
        </div>
        <div class="type-grid">{''.join(type_cards)}</div>
      </section>

      <section class="report-section">
        <div class="section-title">
          <div><span>COMPARISON CONTRACT</span><h2>Compare Lab과 동일한 안전 규칙</h2></div>
          <p>조건을 가로지르는 순위는 만들지 않으며, 환산값은 이 직접 비교 보고서에서 제외했습니다.</p>
        </div>
        <div class="rule-grid">
          <div><strong>유형 일치</strong><span>Re / Ro / Sc가 같아야 함</span></div>
          <div><strong>냉매 일치</strong><span>R32, R454B 등 동일 냉매</span></div>
          <div><strong>조건·구동 일치</strong><span>측정조건과 Fixed/Variable 동일</span></div>
          <div><strong>용량 ±{tolerance:.0f}%</strong><span>Samsung 기준 허용범위</span></div>
          <div><strong>동일 지표 보유</strong><span>COP 또는 EER가 양쪽 모두 존재</span></div>
        </div>
        <p class="method-note"><strong>Δ 해석:</strong> 경쟁사 Δ = (경쟁사 지표 − Samsung 지표) ÷ Samsung 지표. 양수는 경쟁사 우위, 음수는 Samsung 우위입니다. 모든 표 행은 백엔드 판정 <code>DIRECT_OK</code>만 포함합니다.</p>
      </section>

      <section class="report-section" id="matrix">
        <div class="section-title">
          <div><span>FULL COVERAGE</span><h2>Samsung 27개 모델 전체 매트릭스</h2></div>
          <p>COP와 EER 후보를 분리했습니다. ‘없음’ 모델은 아래 상세 영역에서 조사 사유와 목표조건을 확인할 수 있습니다.</p>
        </div>
        {_render_summary_table(data)}
      </section>

      {''.join(model_sections)}
    </div>
  </main>

  <footer class="footer">
    <div class="container">
      <p>데이터 기준: {_escape(release['releaseId'])} · SHA-256 {_escape(release['dataSha256'][:16])}…</p>
      <p><a href="/?view=compare">Compare Lab으로 돌아가기</a></p>
    </div>
  </footer>
</body>
</html>
"""
    return report_html


def build_report(
    *,
    output_path: Path = DEFAULT_OUTPUT,
    active_release_path: Path = DEFAULT_ACTIVE_RELEASE,
    rules_path: Path = DEFAULT_RULES,
) -> dict[str, Any]:
    release, bundle, rules = load_active_catalog(
        active_release_path=active_release_path,
        rules_path=rules_path,
    )
    data = build_report_data(release, bundle, rules)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_report(data), encoding="utf-8")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(
        description="활성 Published Release의 Compare Lab HTML 보고서를 생성합니다."
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"출력 HTML 경로 (기본: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()
    data = build_report(output_path=args.output)
    summary = data["summary"]
    print(
        "COMPARE_LAB_REPORT_OK "
        f"models={summary['samsungModels']} "
        f"ready={summary['readyModels']} "
        f"pairs={summary['uniquePairs']} "
        f"comparisons={summary['comparisons']} "
        f"output={args.output.resolve()}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
