import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./direct-comparison-report.css";

type CompressorType = "Re" | "Ro" | "Sc";
type ComparisonMetric = "cop" | "eer";
type TypeFilter = "ALL" | CompressorType;

export interface DirectComparisonItem {
  comparisonKey: string;
  compressorType: CompressorType;
  refrigerant: string;
  conditionLabel: string;
  driveClass: string;
  metric: ComparisonMetric;
  baseline: {
    modelId: string;
    manufacturer: string;
    model: string;
    value: number;
    capacityW: number | null;
  };
  candidate: {
    modelId: string;
    manufacturer: string;
    model: string;
    value: number;
    capacityW: number | null;
  };
  capacityDiffPct: number;
  deltaPct: number;
  verdict: "DIRECT";
  code: "DIRECT_OK";
  compareUrl: string;
}

type ChartItem = DirectComparisonItem & {
  label: string;
  baselineValue: number;
  candidateValue: number;
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  ALL: "전체",
  Re: "Re",
  Ro: "Ro",
  Sc: "Sc",
};

const METRIC_LABELS: Record<ComparisonMetric, string> = {
  cop: "COP",
  eer: "EER",
};

function formatNumber(value: number, digits = 2) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: digits });
}

function deltaInterpretation(deltaPct: number) {
  if (deltaPct > 0.005) return `경쟁사 ${formatNumber(deltaPct)}% 우위`;
  if (deltaPct < -0.005) return `Samsung ${formatNumber(Math.abs(deltaPct))}% 우위`;
  return "동등";
}

function ComparisonTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: ChartItem }>;
}) {
  const item = payload?.[0]?.payload;
  if (!active || !item) return null;
  return (
    <div className="direct-chart-tooltip">
      <strong>{item.baseline.model} ↔ {item.candidate.model}</strong>
      <span>{item.compressorType} · {item.refrigerant} · {item.conditionLabel}</span>
      <span>Samsung {formatNumber(item.baselineValue)} / 경쟁사 {formatNumber(item.candidateValue)}</span>
      <b>{deltaInterpretation(item.deltaPct)}</b>
      <small>용량 차이 {formatNumber(item.capacityDiffPct)}%</small>
    </div>
  );
}

function chartRows(items: DirectComparisonItem[]): ChartItem[] {
  return items.map((item) => ({
    ...item,
    label: item.baseline.model,
    baselineValue: item.baseline.value,
    candidateValue: item.candidate.value,
  }));
}

export default function DirectComparisonReport({
  comparisons,
}: {
  comparisons: DirectComparisonItem[];
}) {
  const availableTypes = (["Re", "Ro", "Sc"] as const).filter((type) =>
    comparisons.some((item) => item.compressorType === type),
  );
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [preferredMetric, setPreferredMetric] = useState<ComparisonMetric>("cop");
  const typeRows = comparisons.filter((item) =>
    typeFilter === "ALL" || item.compressorType === typeFilter,
  );
  const availableMetrics = (["cop", "eer"] as const).filter((metric) =>
    typeRows.some((item) => item.metric === metric),
  );
  const selectedMetric = availableMetrics.includes(preferredMetric)
    ? preferredMetric
    : availableMetrics[0];
  const filtered = selectedMetric
    ? typeRows.filter((item) => item.metric === selectedMetric)
    : [];
  const data = chartRows(filtered);
  const chartHeight = Math.max(280, data.length * 48 + 86);
  const samsungWins = filtered.filter((item) => item.deltaPct < -0.005).length;
  const competitorWins = filtered.filter((item) => item.deltaPct > 0.005).length;
  const averageCapacityDiff = filtered.length
    ? filtered.reduce((sum, item) => sum + item.capacityDiffPct, 0) / filtered.length
    : 0;

  return (
    <section
      className="direct-comparison-report"
      data-testid="direct-comparison-report"
      data-comparison-count={filtered.length}
      data-total-count={comparisons.length}
      aria-label="직접 비교 상세 차트"
    >
      <div className="direct-filter-row">
        <div data-testid="direct-type-toggle" role="group" aria-label="압축기 유형">
          {(["ALL", ...availableTypes] as TypeFilter[]).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={typeFilter === type}
              onClick={() => setTypeFilter(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <div data-testid="direct-metric-toggle" role="group" aria-label="비교 지표">
          {availableMetrics.map((metric) => (
            <button
              key={metric}
              type="button"
              aria-pressed={selectedMetric === metric}
              onClick={() => setPreferredMetric(metric)}
            >
              {METRIC_LABELS[metric]}
            </button>
          ))}
        </div>
      </div>

      <div className="direct-summary-grid" data-testid="direct-comparison-summary">
        <div><span>직접 판정</span><strong>{filtered.length}건</strong></div>
        <div><span>Samsung 우위</span><strong>{samsungWins}건</strong></div>
        <div><span>경쟁사 우위</span><strong>{competitorWins}건</strong></div>
        <div><span>평균 용량 차이</span><strong>{formatNumber(averageCapacityDiff)}%</strong></div>
      </div>

      <div className="direct-chart-grid">
        <article data-testid="direct-raw-chart" data-row-count={data.length}>
          <header><span>ABSOLUTE VALUE</span><h3>양사 {selectedMetric ? METRIC_LABELS[selectedMetric] : ""} 원값</h3></header>
          <div className="direct-chart" role="img" aria-label="Samsung 경쟁사 원값 비교 차트">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={data} layout="vertical" margin={{ top: 12, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
                <XAxis type="number" domain={[0, "auto"]} />
                <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 9 }} />
                <Tooltip content={<ComparisonTooltip />} />
                <Legend />
                <Bar dataKey="baselineValue" name="Samsung" fill="#155eef" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                <Bar dataKey="candidateValue" name="경쟁사" fill="#e04f75" radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article data-testid="direct-delta-chart" data-row-count={data.length}>
          <header><span>COMPETITOR DELTA</span><h3>경쟁사 대비 Δ%</h3></header>
          <div className="direct-chart" role="img" aria-label="경쟁사 대비 성능 차이 차트">
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={data} layout="vertical" margin={{ top: 12, right: 24, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
                <XAxis type="number" unit="%" />
                <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 9 }} />
                <ReferenceLine x={0} stroke="#344054" strokeWidth={1.4} />
                <Tooltip content={<ComparisonTooltip />} />
                <Bar dataKey="deltaPct" name="경쟁사 Δ%" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                  {data.map((item) => (
                    <Cell key={item.comparisonKey} fill={item.deltaPct <= 0 ? "#155eef" : "#e04f75"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="direct-insight-grid">
        {filtered.map((item) => (
          <article key={item.comparisonKey} data-testid="direct-comparison-item">
            <div><span>{item.compressorType} · {item.refrigerant}</span><b>{item.code}</b></div>
            <h4>{item.baseline.model} ↔ {item.candidate.manufacturer} {item.candidate.model}</h4>
            <p>{item.conditionLabel} · 용량 차이 {formatNumber(item.capacityDiffPct)}%</p>
            <dl>
              <div><dt>Samsung</dt><dd>{formatNumber(item.baseline.value)}</dd></div>
              <div><dt>경쟁사</dt><dd>{formatNumber(item.candidate.value)}</dd></div>
              <div><dt>해석</dt><dd>{deltaInterpretation(item.deltaPct)}</dd></div>
            </dl>
            <a href={item.compareUrl}>Compare Lab에서 확인</a>
          </article>
        ))}
      </div>
      <p className="direct-comparison-note">
        Δ%는 동일 유형·냉매·측정조건·구동·용량 허용범위를 통과한 DIRECT_OK만 계산합니다.
        각 행은 독립된 비교쌍이며, 서로 다른 행이나 COP/EER 사이의 통합 순위를 만들지 않습니다.
      </p>
    </section>
  );
}
