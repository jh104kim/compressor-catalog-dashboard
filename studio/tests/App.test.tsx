import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../src/App";

const samsung = {
  modelId: "model:samsung:DS4BC7066FVT",
  model: "DS4BC7066FVT",
  manufacturer: "Samsung",
  type: "Sc",
  application: "Commercial AC",
  refrigerant: "R32",
  condition: "ARI",
  driveClass: "Variable",
  lifecycleStatus: "MASS_PRODUCT",
  sourceLayer: "samsung_catalog_2024",
  postCatalog: false,
  confidence: "High",
  specs: { capacityW: 1000, cop: 3.25, eer: 11.09 },
  evidence: {
    sourcePath: "data/Samsung-Compressor-Catalogue_2024.pdf",
    authority: "official",
    locator: { kind: "pdf-page", page: 92 },
    fieldPaths: ["specs.cop"],
  },
};

const competitor = {
  ...samsung,
  modelId: "model:gmcc:ATQ360D1UMU",
  model: "ATQ360D1UMU",
  manufacturer: "GMCC",
  condition: "SEER60",
  sourceLayer: "competitor_research",
  evidence: {
    sourcePath: "data/20260617-perplexity-gmcc-r454b-scroll-specs.md",
    authority: "research",
    locator: { kind: "markdown-section", section: "ATQ360D1UMU" },
    fieldPaths: ["specs.cop"],
  },
};

const directSamsung = {
  ...samsung,
  modelId: "model:samsung:DS8LC5040IN",
  model: "DS8LC5040IN",
  refrigerant: "R454B",
  condition: "DOE-B",
  driveClass: "Fixed",
  sourceLayer: "post_catalog",
  specs: { capacityW: 13200, cop: null, eer: 6.64 },
};

const directCompetitor = {
  ...competitor,
  modelId: "model:gmcc:STDA031N1ULB",
  model: "STDA031N1ULB",
  refrigerant: "R454B",
  condition: "DOE-B",
  driveClass: "Fixed",
  specs: { capacityW: 12380, cop: null, eer: 6.86 },
};

const samsungRe = {
  ...samsung,
  modelId: "model:samsung:MKV190C-L2J",
  model: "MKV190C-L2J",
  type: "Re",
  refrigerant: "R600a",
  condition: "ASHRAE",
  driveClass: "Fixed",
  specs: { capacityW: 210, cop: 1.75, eer: 5.97 },
};

const directComparison = {
  releaseId: "release:2026-07-30:001",
  verdict: "DIRECT",
  code: "DIRECT_OK",
  reason: "동일 조건 직접 비교가 가능합니다.",
  baselineModelId: samsung.modelId,
  candidateModelId: competitor.modelId,
  metric: "eer",
  capacityDiffPct: 6.21,
  deltaPct: -3.16,
  rankingAllowed: true,
};

let comparePayload: Record<string, unknown>;
let compareResponseDelayMs = 0;
let failActiveRelease = false;
let modelItems: Array<Record<string, unknown>>;

function jsonResponse(value: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(value), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

async function renderReady() {
  render(<App />);
  await screen.findAllByText("release:2026-07-30:001");
}

async function openView(name: RegExp) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name }));
  return user;
}

async function chooseDirectPair(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("tab", { name: "Sc 스크롤" }));
  await user.selectOptions(screen.getByLabelText("비교 지표"), "eer");
  await user.click(
    screen.getByRole("option", {
      name: `Samsung 기준 모델 ${directSamsung.model}`,
    }),
  );
  await user.click(
    screen.getByRole("option", {
      name: `경쟁 모델 ${directCompetitor.manufacturer} ${directCompetitor.model}`,
    }),
  );
}

describe("Catalog Audit Studio", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    failActiveRelease = false;
    compareResponseDelayMs = 0;
    comparePayload = {
      releaseId: "release:2026-07-30:001",
      verdict: "BLOCKED",
      code: "BLOCKED_CONDITION_MISMATCH",
      reason: "측정조건이 달라 직접 비교할 수 없습니다.",
      baselineModelId: samsung.modelId,
      candidateModelId: competitor.modelId,
      metric: "cop",
      capacityDiffPct: null,
      deltaPct: null,
      rankingAllowed: false,
    };
    modelItems = [samsung, competitor];
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/releases/active")) {
          if (failActiveRelease) {
            return Promise.resolve(new Response("release unavailable", { status: 503 }));
          }
          return jsonResponse({
            releaseId: "release:2026-07-30:001",
            status: "PUBLISHED",
            approvedBy: "catalog-owner",
            activatedAt: "2026-07-30T16:00:00+09:00",
            dataSha256: "abc123",
            sourceCommit: "f142bca",
            appGitSha: "3c1de57f8b6c95cdbf2181e6889b0ebc4e811834",
            asOf: "2026-07-30",
            counts: { models: 76, samsungModels: 27, competitorModels: 49 },
            validationSummary: {
              criticalCount: 0,
              majorCount: 0,
              warningCount: 2,
              issues: [
                {
                  code: "METRIC_FORMULA_MISMATCH",
                  severity: "Warning",
                  model_id: "model:secop:NLE12.6CNL",
                  message: "COP 계산 상대오차가 8.62%입니다.",
                },
              ],
            },
          });
        }
        if (url.includes("/expansion/batches/B1")) {
          return jsonResponse({
            batchId: "B1",
            title: "Samsung 2024 Scroll p.92",
            status: "SOURCE_VERIFIED",
            publicationStatus: "NOT_PUBLISHED",
            review: {
              reviewedAt: "2026-07-30",
              method: "PDF p.92 visual review and text extraction",
              conditionDecision: "p.92에 측정조건이 없어 UNKNOWN 유지",
            },
            source: {
              pdfPath: "data/Samsung-Compressor-Catalogue_2024.pdf",
              pdfSha256: "pdf-sha",
              parsedPath: "data/samsung-catalogue-2024-parsed.md",
              parsedSha256: "parsed-sha",
              page: 92,
            },
            counts: {
              totalRows: 16,
              uniqueModels: 16,
              overlapModels: 8,
              newCandidates: 8,
              conditionUnknown: 16,
            },
            rows: [],
          });
        }
        if (url.includes("/catalog/models")) {
          return jsonResponse({
            releaseId: "release:2026-07-30:001",
            count: modelItems.length,
            items: modelItems,
          });
        }
        if (url.includes("/portfolio/Re/R290")) {
          return jsonResponse({
            releaseId: "release:2026-07-30:001",
            manufacturer: "Samsung",
            type: "Re",
            refrigerant: "R290",
            status: "GAP",
            samsungModels: [],
            competitorModels: [competitor],
            rankingAllowed: false,
            evidence: { sourcePath: "config/p0_catalog_rules.json" },
          });
        }
        if (url.includes("/evidence/")) {
          return jsonResponse({
            releaseId: "release:2026-07-30:001",
            modelId: samsung.modelId,
            evidence: samsung.evidence,
            supportingEvidence: [],
          });
        }
        if (url.includes("/compare")) {
          if (compareResponseDelayMs > 0) {
            return new Promise((resolve) => {
              window.setTimeout(
                () => resolve(new Response(JSON.stringify(comparePayload), {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                })),
                compareResponseDelayMs,
              );
            });
          }
          return jsonResponse(comparePayload);
        }
        throw new Error(`Unexpected request: ${url}`);
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("P5-UT-G5-001 활성 Release와 76/27/49를 보여준다", async () => {
    render(<App />);

    expect(
      await screen.findByRole("heading", {
        name: "Compressor Catalog Audit Studio",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("release:2026-07-30:001").length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("76")).toBeInTheDocument();
    expect(screen.getByText("27")).toBeInTheDocument();
    expect(screen.getByText("49")).toBeInTheDocument();
    expect(screen.getByText("View-only")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /발행|편집/ })).not.toBeInTheDocument();
  });

  it("P8-UT-G7-001 앱 SHA와 B1 Scroll 검토상태를 분리해 보여준다", async () => {
    await renderReady();
    await openView(/Release \/ Evidence/);

    expect(screen.getByTestId("app-git-sha")).toHaveTextContent(
      "3c1de57f8b6c95cdbf2181e6889b0ebc4e811834",
    );
    expect(screen.getByTestId("expansion-batch")).toHaveTextContent(
      "SOURCE_VERIFIED",
    );
    expect(screen.getByTestId("expansion-total")).toHaveTextContent("16");
    expect(screen.getByTestId("expansion-new")).toHaveTextContent("8");
    expect(screen.getByTestId("expansion-unknown")).toHaveTextContent("16");
    expect(screen.getByTestId("expansion-batch")).toHaveTextContent(
      "아직 Published Release에는 합치지 않았습니다.",
    );
  });

  it("P10-UT-G1-001 유형 선택 시 직접 가능한 지표와 Samsung 모델만 먼저 표시한다", async () => {
    modelItems = [samsungRe, samsung, directSamsung, directCompetitor];
    await renderReady();
    const user = await openView(/Compare Lab/);

    expect(
      screen.getByRole("link", { name: /전체 비교 보고서 보기/ }),
    ).toHaveAttribute("href", "/compare-lab-output.html");
    expect(screen.getByTestId("type-first-callout")).toHaveTextContent(
      "Re · Ro · Sc 유형을 먼저 선택하세요",
    );
    expect(
      screen.queryByRole("listbox", { name: "Samsung 기준 모델" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: /Sc 스크롤/ }));

    expect(screen.getByLabelText("비교 지표")).toHaveValue("eer");
    const baselineList = screen.getByRole("listbox", {
      name: "Samsung 기준 모델",
    });
    expect(within(baselineList).getByRole("option", { name: /DS8LC5040IN/ })).toBeInTheDocument();
    expect(within(baselineList).queryByRole("option", { name: /DS4BC7066FVT/ })).not.toBeInTheDocument();
    expect(within(baselineList).queryByRole("option", { name: /MKV190C-L2J/ })).not.toBeInTheDocument();
  });

  it("P9-UT-G1-002 Samsung 모델 기준 직접 비교 가능한 경쟁 모델만 표시한다", async () => {
    modelItems = [directSamsung, directCompetitor, competitor];
    await renderReady();
    const user = await openView(/Compare Lab/);

    await user.click(screen.getByRole("tab", { name: /Sc 스크롤/ }));
    await user.selectOptions(screen.getByLabelText("비교 지표"), "eer");
    await user.click(
      screen.getByRole("option", {
        name: `Samsung 기준 모델 ${directSamsung.model}`,
      }),
    );

    const candidateList = screen.getByRole("listbox", { name: "경쟁 모델" });
    expect(within(candidateList).getByRole("option", { name: /STDA031N1ULB/ })).toBeInTheDocument();
    expect(within(candidateList).queryByRole("option", { name: /ATQ360D1UMU/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("eligible-candidate-count")).toHaveTextContent("1");
  });

  it("P10-UT-G2-001 직접 불가 Samsung 모델은 리서치 큐와 요구조건에 표시한다", async () => {
    modelItems = [samsung, directSamsung, directCompetitor];
    await renderReady();
    const user = await openView(/Compare Lab/);

    await user.click(screen.getByRole("tab", { name: /Sc 스크롤/ }));

    const queue = screen.getByTestId("comparison-research-queue");
    expect(queue).toHaveTextContent("DS4BC7066FVT");
    expect(queue).toHaveTextContent("R32");
    expect(queue).toHaveTextContent("ARI");
    expect(queue).toHaveTextContent("Variable");
    expect(queue).toHaveTextContent("850~1,150 W");
    expect(queue).toHaveTextContent("EER");
    expect(queue).not.toHaveTextContent("DS8LC5040IN");
  });

  it("P5-UT-G2-002 BLOCKED 응답에서는 순위와 Delta를 숨긴다", async () => {
    modelItems = [directSamsung, directCompetitor];
    await renderReady();
    const user = await openView(/Compare Lab/);
    await chooseDirectPair(user);
    await user.click(screen.getByRole("button", { name: "안전 비교 실행" }));

    const result = await screen.findByRole("status");
    expect(within(result).getByText("BLOCKED")).toBeInTheDocument();
    expect(
      within(result).getByText("BLOCKED_CONDITION_MISMATCH"),
    ).toBeInTheDocument();
    expect(within(result).queryByText(/COP Δ|동일군 내 순위/)).not.toBeInTheDocument();
  });

  it("P5-UT-G6-001 모델에서 Release와 PDF 페이지 Evidence까지 추적한다", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findAllByText("release:2026-07-30:001");

    await user.click(
      screen.getByRole("button", { name: /Catalog Checks/ }),
    );
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));
    await user.click(screen.getByRole("button", { name: "Evidence 열기" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("data/Samsung-Compressor-Catalogue_2024.pdf").length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getByText("PDF p.92")).toBeInTheDocument();
    expect(
      screen.getAllByText("release:2026-07-30:001").length,
    ).toBeGreaterThan(0);
  });

  it("P5-UT-G1-001 DIRECT_OK와 동일 조건 비교를 표시한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    comparePayload = directComparison;
    await renderReady();
    const user = await openView(/Compare Lab/);
    await chooseDirectPair(user);
    await user.click(screen.getByRole("button", { name: "안전 비교 실행" }));

    expect(await screen.findByTestId("comparison-verdict")).toHaveTextContent("DIRECT");
    expect(screen.getByTestId("comparison-code")).toHaveTextContent("DIRECT_OK");
    expect(screen.getByTestId("comparison-reason")).toHaveTextContent("동일 조건 직접 비교");
  });

  it("P5-UT-G1-002 DIRECT에서 EER Delta와 순위를 표시한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    comparePayload = directComparison;
    await renderReady();
    const user = await openView(/Compare Lab/);
    await chooseDirectPair(user);
    await user.click(screen.getByRole("button", { name: "안전 비교 실행" }));

    expect(await screen.findByTestId("comparison-delta")).toHaveTextContent("-3.16%");
    expect(screen.getByTestId("comparison-ranking")).toHaveTextContent("동일군 내 허용");
  });

  it("P5-UT-G2-001 조건 불일치 코드와 차단 사유를 표시한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    await renderReady();
    const user = await openView(/Compare Lab/);
    await chooseDirectPair(user);
    await user.click(screen.getByRole("button", { name: "안전 비교 실행" }));

    expect(await screen.findByTestId("comparison-verdict")).toHaveTextContent("BLOCKED");
    expect(screen.getByTestId("comparison-code")).toHaveTextContent("BLOCKED_CONDITION_MISMATCH");
    expect(screen.getByTestId("comparison-reason")).toHaveTextContent("측정조건");
  });

  it("P5-UT-G2-003 모순된 BLOCKED 응답의 rank와 Delta를 무시한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    comparePayload = {
      ...comparePayload,
      rankingAllowed: true,
      deltaPct: 12.34,
    };
    await renderReady();
    const user = await openView(/Compare Lab/);
    await chooseDirectPair(user);
    await user.click(screen.getByRole("button", { name: "안전 비교 실행" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("안전 규칙과 충돌");
    expect(screen.queryByTestId("comparison-ranking")).not.toBeInTheDocument();
    expect(screen.queryByTestId("comparison-delta")).not.toBeInTheDocument();
  });

  it("P5-UT-G3-001 R290 Re GAP과 경쟁 모델을 표시한다", async () => {
    await renderReady();
    await openView(/Portfolio Gaps/);

    expect(screen.getByTestId("portfolio-status")).toHaveTextContent("GAP");
    expect(screen.getByTestId("samsung-models")).toHaveTextContent("없음");
    expect(screen.getByTestId("competitor-models")).toHaveTextContent("1건");
  });

  it("P5-UT-G3-002 GAP에 가짜 Samsung 수치와 비교 지표가 없다", async () => {
    await renderReady();
    await openView(/Portfolio Gaps/);

    expect(screen.getByTestId("samsung-models")).not.toHaveTextContent("0");
    expect(screen.queryByTestId("comparison-ranking")).not.toBeInTheDocument();
    expect(screen.queryByTestId("comparison-delta")).not.toBeInTheDocument();
  });

  it("P5-UT-G4-001 권위 모델 COP 3.25와 공식 배지를 표시한다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));

    expect(screen.getByTestId("model-cop")).toHaveTextContent("3.25");
    expect(screen.getAllByText("Samsung 2024 공식").length).toBeGreaterThan(0);
    expect(document.body).not.toHaveTextContent("3.34");
  });

  it("P5-UT-G4-002 권위 모델 ID를 유지해 PDF p.92를 연다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));
    await user.click(screen.getByTestId("evidence-open"));

    expect(await screen.findByTestId("evidence-model-id")).toHaveTextContent(samsung.modelId);
    expect(screen.getByTestId("evidence-locator")).toHaveTextContent("PDF p.92");
  });

  it("P5-UT-G5-002 편집·저장·발행 control을 노출하지 않는다", async () => {
    await renderReady();

    expect(screen.queryByRole("button", { name: /저장|발행|Publish|편집/ })).not.toBeInTheDocument();
    expect(screen.getByTestId("read-only-notice")).toHaveTextContent("View-only");
  });

  it("P5-UT-G5-003 재조회 실패 시 마지막 Published Release를 유지한다", async () => {
    await renderReady();
    failActiveRelease = true;
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "데이터 새로고침" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("기존 Published Release를 유지");
    expect(screen.getAllByTestId("release-id")[0]).toHaveTextContent("release:2026-07-30:001");
  });

  it("P5-UT-G6-002 원천 링크는 같은 origin의 PDF page 92를 가리킨다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));
    await user.click(screen.getByTestId("evidence-open"));

    const link = await screen.findByTestId("source-open");
    expect(link).toHaveAttribute(
      "href",
      "/source/Samsung-Compressor-Catalogue_2024.pdf#page=92",
    );
  });

  it("P5-UT-NAV-001 검색 결과 선택 시 모델 상세과 URL을 갱신한다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.type(screen.getByTestId("global-search"), "DS4BC7066FVT");

    expect(screen.getByTestId("search-results")).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));
    expect(screen.getByTestId("model-name")).toHaveTextContent("DS4BC7066FVT");
    expect(window.location.search).toContain("modelId=model%3Asamsung%3ADS4BC7066FVT");
  });

  it("P5-UT-NAV-002 검색 결과 0건은 명시적 빈 상태를 표시한다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.type(screen.getByTestId("global-search"), "NO-SUCH-MODEL");

    expect(screen.getByTestId("search-results")).toHaveTextContent("0");
    expect(screen.getByText("조건에 맞는 모델을 찾을 수 없음")).toBeInTheDocument();
  });

  it("P5-UT-FILTER-001 네 필터를 함께 유지하고 같은 군만 남긴다", async () => {
    modelItems = [samsung, competitor, directSamsung, directCompetitor];
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.selectOptions(screen.getByTestId("filter-type"), "Sc");
    await user.selectOptions(screen.getByTestId("filter-refrigerant"), "R454B");
    await user.selectOptions(screen.getByTestId("filter-condition"), "DOE-B");
    await user.selectOptions(screen.getByTestId("filter-drive-class"), "Fixed");

    expect(screen.getByTestId("model-list")).toHaveTextContent("DS8LC5040IN");
    expect(screen.getByTestId("model-list")).toHaveTextContent("STDA031N1ULB");
    expect(screen.getByTestId("model-list")).not.toHaveTextContent("DS4BC7066FVT");
  });

  it("P5-UT-FILTER-002 조건 변경 시 이전 선택 상세를 초기화한다", async () => {
    await renderReady();
    const user = await openView(/Catalog Checks/);
    await user.click(screen.getByRole("button", { name: /DS4BC7066FVT/ }));
    await user.selectOptions(screen.getByTestId("filter-condition"), "SEER60");

    expect(screen.getByTestId("model-detail")).toHaveTextContent("모델을 선택하세요");
    expect(screen.getByTestId("model-detail")).not.toHaveTextContent("3.25");
  });

  it("P5-UT-LINK-001 모델 딥링크를 바로 복원한다", async () => {
    window.history.replaceState({}, "", "/?view=model&modelId=model%3Asamsung%3ADS4BC7066FVT");
    await renderReady();

    expect(screen.getByTestId("model-name")).toHaveTextContent("DS4BC7066FVT");
    expect(screen.getByTestId("model-cop")).toHaveTextContent("3.25");
  });

  it("P5-UT-LINK-002 비교 딥링크는 비교 요청을 한 번 수행한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    comparePayload = directComparison;
    window.history.replaceState(
      {},
      "",
      `/?view=compare&baselineModelId=${encodeURIComponent(directSamsung.modelId)}&candidateModelId=${encodeURIComponent(directCompetitor.modelId)}&metric=eer`,
    );
    await renderReady();

    expect(await screen.findByTestId("comparison-code")).toHaveTextContent("DIRECT_OK");
    const calls = vi.mocked(fetch).mock.calls.filter(([input]) => String(input).includes("/compare"));
    expect(calls).toHaveLength(1);
  });

  it("P11-UT-LINK-005 느린 비교 딥링크도 loading에서 정상 복귀한다", async () => {
    modelItems = [directSamsung, directCompetitor];
    comparePayload = directComparison;
    compareResponseDelayMs = 80;
    window.history.replaceState(
      {},
      "",
      `/?view=compare&baselineModelId=${encodeURIComponent(directSamsung.modelId)}&candidateModelId=${encodeURIComponent(directCompetitor.modelId)}&metric=eer`,
    );
    await renderReady();

    expect(await screen.findByTestId("comparison-code")).toHaveTextContent("DIRECT_OK");
    expect(
      screen.getByRole("button", { name: "안전 비교 실행" }),
    ).toBeEnabled();
  });

  it("P5-UT-LINK-003 Evidence 딥링크는 상세과 근거를 함께 연다", async () => {
    window.history.replaceState(
      {},
      "",
      "/?view=model&modelId=model%3Asamsung%3ADS4BC7066FVT&evidence=1",
    );
    await renderReady();

    expect(screen.getByTestId("model-name")).toHaveTextContent("DS4BC7066FVT");
    expect(await screen.findByTestId("evidence-locator")).toHaveTextContent("PDF p.92");
  });

  it("P5-UT-LINK-004 없는 modelId는 가짜 수치 없이 오류를 표시한다", async () => {
    window.history.replaceState({}, "", "/?view=model&modelId=model%3Asamsung%3ANOPE");
    await renderReady();

    expect(screen.getByTestId("model-detail")).toHaveTextContent("모델을 찾을 수 없음");
    expect(screen.getByTestId("model-detail")).not.toHaveTextContent("0");
  });

  it("P5-UT-STATE-001 loading·error·empty 상태를 구분한다", async () => {
    failActiveRelease = true;
    render(<App />);
    expect(screen.getByText("Catalog Release를 불러오는 중입니다")).toBeInTheDocument();
    expect(await screen.findByRole("alert")).toHaveTextContent("Audit Studio를 열 수 없습니다");
    expect(document.body).not.toHaveTextContent("Staging");

    cleanup();
    failActiveRelease = false;
    modelItems = [];
    await renderReady();
    const user = await openView(/Catalog Checks/);
    expect(screen.getByText("조건에 맞는 모델을 찾을 수 없음")).toBeInTheDocument();
  });
});
