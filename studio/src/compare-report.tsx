import { createRoot } from "react-dom/client";

import DirectComparisonReport, {
  type DirectComparisonItem,
} from "./DirectComparisonReport";
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
  directComparisons: DirectComparisonItem[];
  comparisons: StaticSpeedComparison[];
}

function StaticSpeedReport({ payload }: { payload: StaticSpeedPayload }) {
  const eligible = payload.comparisons.filter(
    (item) => item.speedAnalysis.chartEligible,
  );

  return (
    <div className="static-speed-report-stack">
      <p className="static-speed-summary">
        {payload.releaseId} · 공식 속도 비교 가능 {eligible.length}쌍만 표시
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
    </div>
  );
}

function renderError(root: HTMLElement, reason: unknown) {
  const message = reason instanceof Error ? reason.message : "비교 데이터를 불러오지 못했습니다.";
  createRoot(root).render(<div className="static-speed-error" role="alert">{message}</div>);
}

fetch("/compare-lab-speed-data.json")
  .then((response) => {
    if (!response.ok) throw new Error(`비교 데이터 요청 실패 (${response.status})`);
    return response.json() as Promise<StaticSpeedPayload>;
  })
  .then((payload) => {
    const directRoot = document.getElementById("direct-comparison-chart-root");
    const speedRoot = document.getElementById("speed-report-root");
    if (directRoot) {
      createRoot(directRoot).render(
        <DirectComparisonReport comparisons={payload.directComparisons} />,
      );
    }
    if (speedRoot) createRoot(speedRoot).render(<StaticSpeedReport payload={payload} />);
  })
  .catch((reason: unknown) => {
    const roots = [
      document.getElementById("direct-comparison-chart-root"),
      document.getElementById("speed-report-root"),
    ].filter((root): root is HTMLElement => root instanceof HTMLElement);
    roots.forEach((root) => renderError(root, reason));
  });
