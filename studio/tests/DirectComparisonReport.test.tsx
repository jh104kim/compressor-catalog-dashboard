import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import DirectComparisonReport, {
  type DirectComparisonItem,
} from "../src/DirectComparisonReport";

const comparisons: DirectComparisonItem[] = [
  {
    comparisonKey: "re-cop",
    compressorType: "Re",
    refrigerant: "R600a",
    conditionLabel: "ASHRAE · Variable",
    driveClass: "Variable",
    metric: "cop",
    baseline: { modelId: "s-re", manufacturer: "Samsung", model: "ENV4A5DL2B", value: 1.97, capacityW: 148 },
    candidate: { modelId: "p-re", manufacturer: "Panasonic", model: "TKF76", value: 2.06, capacityW: 149 },
    capacityDiffPct: 0.68,
    deltaPct: 4.57,
    verdict: "DIRECT",
    code: "DIRECT_OK",
    compareUrl: "/?view=compare&metric=cop",
  },
  {
    comparisonKey: "ro-cop",
    compressorType: "Ro",
    refrigerant: "R32",
    conditionLabel: "ARI · Fixed",
    driveClass: "Fixed",
    metric: "cop",
    baseline: { modelId: "s-ro", manufacturer: "Samsung", model: "UG4T200FUA", value: 3.31, capacityW: 1000 },
    candidate: { modelId: "p-ro", manufacturer: "Panasonic", model: "5KD184", value: 3.01, capacityW: 1081 },
    capacityDiffPct: 8.11,
    deltaPct: -9.06,
    verdict: "DIRECT",
    code: "DIRECT_OK",
    compareUrl: "/?view=compare&metric=cop",
  },
  {
    comparisonKey: "sc-eer",
    compressorType: "Sc",
    refrigerant: "R454B",
    conditionLabel: "DOE-B · Fixed",
    driveClass: "Fixed",
    metric: "eer",
    baseline: { modelId: "s-sc", manufacturer: "Samsung", model: "DS8LC5040IN", value: 6.64, capacityW: 13200 },
    candidate: { modelId: "g-sc", manufacturer: "GMCC", model: "STDA031N1ULB", value: 6.43, capacityW: 12380 },
    capacityDiffPct: 6.21,
    deltaPct: -3.16,
    verdict: "DIRECT",
    code: "DIRECT_OK",
    compareUrl: "/?view=compare&metric=eer",
  },
];

afterEach(cleanup);

describe("DirectComparisonReport", () => {
  it("P16-UT-REPORT-001 직접 비교 데이터만 두 Recharts와 상세 요약에 표시한다", () => {
    render(<DirectComparisonReport comparisons={comparisons} />);

    expect(screen.getByTestId("direct-comparison-report")).toHaveAttribute("data-total-count", "3");
    expect(screen.getByTestId("direct-comparison-report")).toHaveAttribute("data-comparison-count", "2");
    expect(screen.getByTestId("direct-raw-chart")).toBeInTheDocument();
    expect(screen.getByTestId("direct-delta-chart")).toBeInTheDocument();
    expect(screen.getAllByTestId("direct-comparison-item")).toHaveLength(2);
    expect(screen.queryByTestId("speed-data-gap")).not.toBeInTheDocument();
  });

  it("P16-UT-REPORT-002 유형 선택 뒤 값이 있는 지표만 선택 가능하다", async () => {
    const user = userEvent.setup();
    render(<DirectComparisonReport comparisons={comparisons} />);

    await user.click(within(screen.getByTestId("direct-type-toggle")).getByRole("button", { name: "Sc" }));

    const metrics = within(screen.getByTestId("direct-metric-toggle"));
    expect(metrics.getByRole("button", { name: "EER" })).toBeInTheDocument();
    expect(metrics.queryByRole("button", { name: "COP" })).not.toBeInTheDocument();
    expect(screen.getByTestId("direct-comparison-report")).toHaveAttribute("data-comparison-count", "1");
    expect(screen.getAllByTestId("direct-comparison-item")).toHaveLength(1);
  });
});
