import { useMemo, useState } from "react";
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  SpeedAnalysisResult,
  SpeedMetric,
  SpeedPerformancePoint,
  SpeedPerformanceSeries,
  SpeedUnit,
} from "./types";
import "./speed-analysis.css";

const METRIC_LABELS: Record<SpeedMetric, string> = {
  capacityW: "용량",
  inputW: "입력전력",
  cop: "COP",
  eer: "EER",
};

const METRIC_UNITS: Record<SpeedMetric, string> = {
  capacityW: "W",
  inputW: "W",
  cop: "",
  eer: "",
};

const SERIES_COLORS = {
  baseline: "#155eef",
  candidate: "#e04f75",
} as const;

type ChartRow = {
  speed: number;
  baseline?: number;
  candidate?: number;
  baselinePoint?: SpeedPerformancePoint;
  candidatePoint?: SpeedPerformancePoint;
};

type StaticDotProps = {
  cx?: number;
  cy?: number;
  fill?: string;
};

function SourcePointDot({ cx, cy, fill }: StaticDotProps) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4.5}
      fill={fill ?? "currentColor"}
      stroke="#ffffff"
      strokeWidth={2}
      data-testid="speed-plotted-point"
      aria-hidden="true"
    />
  );
}

function formatNumber(value: number | null, digits = 2) {
  if (value == null) return "—";
  return value.toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
  });
}

function evidenceLocator(point: SpeedPerformancePoint) {
  const locator = point.evidence.locator;
  if (typeof locator.page === "number") return `PDF p.${locator.page}`;
  return locator.section ?? locator.url ?? locator.kind;
}

function buildChartRows(
  series: SpeedPerformanceSeries[],
  unit: SpeedUnit,
  selectedMetric: SpeedMetric,
) {
  const rows = new Map<string, ChartRow>();
  for (const item of series) {
    for (const point of item.points) {
      const value = point[selectedMetric];
      if (typeof value !== "number") continue;
      const speed = point[unit];
      const key = speed.toFixed(6);
      const row = rows.get(key) ?? { speed };
      row[item.role] = value;
      row[`${item.role}Point`] = point;
      rows.set(key, row);
    }
  }
  return [...rows.values()].sort((left, right) => left.speed - right.speed);
}

function pointRows(
  series: SpeedPerformanceSeries,
  unit: SpeedUnit,
  selectedMetric: SpeedMetric,
) {
  return series.points.flatMap((point) => {
    const value = point[selectedMetric];
    return typeof value === "number"
      ? [{ speed: point[unit], value, point }]
      : [];
  });
}

function SpeedTooltip({
  active,
  payload,
  unit,
  selectedMetric,
  conditionLabel,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    color?: string;
    payload?: ChartRow & { point?: SpeedPerformancePoint };
  }>;
  unit: SpeedUnit;
  selectedMetric: SpeedMetric;
  conditionLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  const entries = payload.flatMap((entry) => {
    const role = entry.dataKey === "value" ? null : entry.dataKey;
    const point =
      entry.payload?.point ??
      (role === "baseline" || role === "candidate"
        ? entry.payload?.[`${role}Point`]
        : undefined);
    return point ? [{ entry, point }] : [];
  });
  if (!entries.length) return null;

  return (
    <div className="speed-tooltip">
      <strong>
        {formatNumber(entries[0].point[unit], unit === "rpm" ? 0 : 2)} {unit.toUpperCase()}
      </strong>
      {conditionLabel ? <span>조건: {conditionLabel}</span> : null}
      {entries.map(({ entry, point }) => (
        <div key={point.evidence.evidenceId}>
          <b style={{ color: entry.color }}>
            {METRIC_LABELS[selectedMetric]} {formatNumber(point[selectedMetric])}
            {METRIC_UNITS[selectedMetric] ? ` ${METRIC_UNITS[selectedMetric]}` : ""}
          </b>
          <span>{point.valueKind} · {point.evidence.authority}</span>
          <small>{point.evidence.sourcePath} · {evidenceLocator(point)}</small>
        </div>
      ))}
    </div>
  );
}

function SpeedChart({
  analysis,
  unit,
  selectedMetric,
  conditionLabel,
}: {
  analysis: SpeedAnalysisResult;
  unit: SpeedUnit;
  selectedMetric: SpeedMetric;
  conditionLabel?: string;
}) {
  const data = useMemo(
    () => buildChartRows(analysis.series, unit, selectedMetric),
    [analysis.series, selectedMetric, unit],
  );
  const pointCount = analysis.series.reduce(
    (count, series) => count + series.points.length,
    0,
  );
  const commonRange = analysis.commonRange?.[unit] ?? null;

  return (
    <div
      className="speed-chart"
      data-testid="speed-chart"
      data-point-count={pointCount}
      role="img"
      aria-label="속도별 성능 차트"
    >
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 14, right: 24, bottom: 18, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e7ec" />
          {commonRange ? (
            <ReferenceArea
              x1={commonRange.min}
              x2={commonRange.max}
              fill="#dbe9ff"
              fillOpacity={0.42}
              label={{ value: "공통 운전영역", position: "insideTop", fill: "#344054" }}
            />
          ) : null}
          <XAxis
            type="number"
            dataKey="speed"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) =>
              formatNumber(value, unit === "rpm" ? 0 : 1)
            }
            label={{ value: unit.toUpperCase(), position: "insideBottom", offset: -10 }}
          />
          <YAxis
            domain={["auto", "auto"]}
            width={54}
            label={{
              value: `${METRIC_LABELS[selectedMetric]}${METRIC_UNITS[selectedMetric] ? ` (${METRIC_UNITS[selectedMetric]})` : ""}`,
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            content={
              <SpeedTooltip
                unit={unit}
                selectedMetric={selectedMetric}
                conditionLabel={conditionLabel}
              />
            }
          />
          <Legend />
          {analysis.series.map((series) =>
            series.lineEligible ? (
              <Line
                key={series.role}
                type="linear"
                dataKey={series.role}
                name={`${series.manufacturer} ${series.model}`}
                stroke={SERIES_COLORS[series.role]}
                strokeWidth={2.2}
                connectNulls
                dot={<SourcePointDot fill={SERIES_COLORS[series.role]} />}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ) : (
              <Scatter
                key={series.role}
                data={pointRows(series, unit, selectedMetric)}
                dataKey="value"
                name={`${series.manufacturer} ${series.model}`}
                fill={SERIES_COLORS[series.role]}
                shape={<SourcePointDot fill={SERIES_COLORS[series.role]} />}
                isAnimationActive={false}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SpeedDataTable({ analysis }: { analysis: SpeedAnalysisResult }) {
  return (
    <div className="speed-table-wrap">
      <table className="speed-data-table" data-testid="speed-data-table">
        <caption>속도별 원시 성능점</caption>
        <thead>
          <tr>
            <th>모델</th><th>원천 속도</th><th>RPM</th><th>RPS</th>
            <th>용량</th><th>입력</th><th>COP</th><th>EER</th>
            <th>값 구분</th><th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {analysis.series.flatMap((series) =>
            series.points.map((point) => (
              <tr
                key={`${series.modelId}:${point.evidence.evidenceId}`}
                data-rpm={point.rpm}
                data-rps={point.rps}
                data-evidence-id={point.evidence.evidenceId}
              >
                <td><strong>{series.manufacturer}</strong><span>{series.model}</span></td>
                <td>{formatNumber(point.speedValue)} {point.speedUnit.toUpperCase()}</td>
                <td>{formatNumber(point.rpm, 0)}</td>
                <td>{formatNumber(point.rps, 2)}</td>
                <td>{formatNumber(point.capacityW)} W</td>
                <td>{formatNumber(point.inputW)} W</td>
                <td>{formatNumber(point.cop)}</td>
                <td>{formatNumber(point.eer)}</td>
                <td><span className={`speed-kind speed-kind-${point.valueKind.toLowerCase()}`}>{point.valueKind}</span></td>
                <td>
                  <code>{point.evidence.evidenceId}</code>
                  <span>{point.evidence.sourcePath}</span>
                  <small>{point.evidence.authority} · {evidenceLocator(point)}</small>
                </td>
              </tr>
            )),
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SpeedAnalysis({
  analysis,
  conditionLabel,
}: {
  analysis: SpeedAnalysisResult;
  conditionLabel?: string;
}) {
  const [unit, setUnit] = useState<SpeedUnit>("rpm");
  const [preferredMetric, setPreferredMetric] = useState<SpeedMetric>(
    analysis.metricOptions.includes("cop") ? "cop" : analysis.metricOptions[0] ?? "cop",
  );
  const selectedMetric = analysis.metricOptions.includes(preferredMetric)
    ? preferredMetric
    : analysis.metricOptions[0] ?? "cop";
  const hasChartData =
    analysis.chartEligible &&
    analysis.metricOptions.length > 0 &&
    analysis.series.some((series) => series.points.length > 0);

  return (
    <section
      className="speed-analysis"
      data-testid="speed-analysis"
      data-status={analysis.status}
      data-chart-eligible={analysis.chartEligible}
      aria-label="RPM RPS 속도별 성능 분석"
    >
      <div className="speed-analysis-head">
        <div>
          <p>RPM · RPS PERFORMANCE MAP</p>
          <h4>속도별 카탈로그 성능 분석</h4>
          <span>{analysis.reason}</span>
        </div>
        <strong className={`speed-status speed-status-${analysis.status.toLowerCase()}`}>
          {analysis.status}
        </strong>
      </div>

      {hasChartData ? (
        <>
          <div className="speed-controls">
            <div data-testid="speed-unit-toggle" role="group" aria-label="속도 단위">
              {(["rpm", "rps"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={unit === option}
                  onClick={() => setUnit(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            <div data-testid="speed-metric-toggle" role="group" aria-label="성능 지표">
              {analysis.metricOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selectedMetric === option}
                  onClick={() => setPreferredMetric(option)}
                >
                  {METRIC_LABELS[option]}
                </button>
              ))}
            </div>
          </div>
          <SpeedChart
            analysis={analysis}
            unit={unit}
            selectedMetric={selectedMetric}
            conditionLabel={conditionLabel}
          />
          <p className="speed-safety-note">
            실제 Evidence 성능점만 직선으로 연결합니다. 공통 운전영역 밖의 값을 만들지 않으며,
            동일 속도 관측점이 없으면 상대 성능 결론을 생성하지 않습니다.
          </p>
          <SpeedDataTable analysis={analysis} />
        </>
      ) : (
        <div className="speed-data-gap" data-testid="speed-data-gap">
          <strong>속도 성능 지도 조사 필요</strong>
          <p>{analysis.reason}</p>
          <span>양쪽 모델의 동일 조건 공식 RPM/RPS 성능점이 확보될 때 차트가 열립니다.</span>
        </div>
      )}
    </section>
  );
}
