import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import SpeedAnalysis from "./SpeedAnalysis";
import type { SpeedAnalysisResult } from "./types";

interface StaticSpeedComparison {
  pairKey: string;
  baseline: { modelId: string; manufacturer: string; model: string };
  candidate: { modelId: string; manufacturer: string; model: string };
  conditionLabel: string;
  speedAnalysis: SpeedAnalysisResult;
}

interface StaticSpeedPayload {
  releaseId: string;
  comparisons: StaticSpeedComparison[];
}

function StaticSpeedReport() {
  const [payload, setPayload] = useState<StaticSpeedPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    fetch("/compare-lab-speed-data.json")
      .then((response) => {
        if (!response.ok) throw new Error(`속도 데이터 요청 실패 (${response.status})`);
        return response.json() as Promise<StaticSpeedPayload>;
      })
      .then((nextPayload) => {
        if (current) setPayload(nextPayload);
      })
      .catch((reason: unknown) => {
        if (current) {
          setError(reason instanceof Error ? reason.message : "속도 데이터를 불러오지 못했습니다.");
        }
      });
    return () => {
      current = false;
    };
  }, []);

  if (error) return <div className="static-speed-error" role="alert">{error}</div>;
  if (!payload) return <p className="static-speed-summary">속도 성능 지도를 불러오는 중입니다.</p>;

  const eligible = payload.comparisons.filter(
    (item) => item.speedAnalysis.chartEligible,
  );
  const gaps = payload.comparisons.filter(
    (item) => !item.speedAnalysis.chartEligible,
  );

  return (
    <div className="static-speed-report-stack">
      <p className="static-speed-summary">
        {payload.releaseId} · 차트 가능 {eligible.length}쌍 · 공식 속도점 보완 {gaps.length}쌍
      </p>
      {eligible.map((item) => (
        <article
          className="static-speed-pair"
          key={item.pairKey}
          data-pair-key={item.pairKey}
          data-testid="speed-report-section"
          data-chart-eligible="true"
        >
          <header>
            <p>{item.conditionLabel}</p>
            <h3>
              {item.baseline.manufacturer} {item.baseline.model} ↔ {item.candidate.manufacturer} {item.candidate.model}
            </h3>
          </header>
          <SpeedAnalysis
            analysis={item.speedAnalysis}
            conditionLabel={item.conditionLabel}
          />
        </article>
      ))}
      {gaps.length > 0 ? (
        <details className="static-speed-gaps" data-testid="speed-data-gap">
          <summary>속도별 공식 성능점 보완 대상 {gaps.length}쌍</summary>
          <ul>
            {gaps.map((item) => (
              <li key={item.pairKey}>
                {item.baseline.model} ↔ {item.candidate.model}: {item.speedAnalysis.reason}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

const root = document.getElementById("speed-report-root");
if (root) createRoot(root).render(<StaticSpeedReport />);
