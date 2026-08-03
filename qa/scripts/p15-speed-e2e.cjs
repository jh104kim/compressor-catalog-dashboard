"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.P15_BASE_URL || "http://127.0.0.1:8000/";
const outputDir = path.resolve(
  process.env.OUTPUT_DIR ||
    path.join(__dirname, "..", "evidence", "p15", "local"),
);
const screenshotDir = path.join(outputDir, "screenshots");
const resultPath = path.join(outputDir, "p15-speed-e2e.json");
const reportUrl = new URL("compare-lab-output.html", baseUrl).href;
const speedCsvUrl = new URL("compare-lab-speed-output.csv", baseUrl).href;
const baselineId = "model:samsung:ENV4A5DL2B";
const candidateId = "model:panasonic:TKF76E25DCH-52RPS";
const dataRequiredBaselineId = "model:samsung:DS8LC5040IN";
const dataRequiredCandidateId = "model:gmcc:STDA031N1ULB";
const allowedMetrics = ["capacityW", "inputW", "cop", "eer"];
const requiredGoldenMetrics = ["capacityW", "cop"];
const metricLabels = {
  capacityW: "용량",
  inputW: "입력전력",
  cop: "COP",
  eer: "EER",
};
const viewports = [
  { id: "desktop-1440x1024", width: 1440, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function approximatelyEqual(left, right, tolerance = 1e-9) {
  return Math.abs(left - right) <= tolerance;
}

async function waitForLayout(page) {
  await page.evaluate(
    () => new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    ),
  );
}

function attachGuards(context) {
  const errors = [];
  const externalRequests = [];
  const forbiddenWrites = [];
  const attached = new WeakSet();
  const origin = new URL(baseUrl).origin;

  function monitor(page) {
    if (attached.has(page)) return;
    attached.add(page);
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
    page.on("requestfailed", (request) => {
      errors.push(`request: ${request.url()} ${request.failure()?.errorText || ""}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on("request", (request) => {
      const parsed = new URL(request.url());
      if (["http:", "https:"].includes(parsed.protocol) && parsed.origin !== origin) {
        externalRequests.push(request.url());
      }
      const method = request.method().toUpperCase();
      const allowedCompareReport =
        method === "POST" && parsed.pathname === "/api/v1/compare/report";
      if (
        ["PUT", "PATCH", "DELETE"].includes(method) ||
        (method === "POST" && !allowedCompareReport)
      ) {
        forbiddenWrites.push(`${method} ${parsed.pathname}`);
      }
    });
  }

  context.on("page", monitor);
  return { monitor, errors, externalRequests, forbiddenWrites };
}

async function getActiveRelease(context) {
  const response = await context.request.get(
    new URL("api/v1/releases/active", baseUrl).href,
  );
  invariant(response.status() === 200, `Active Release API ${response.status()}`);
  const active = await response.json();
  invariant(active.status === "PUBLISHED", `Release 상태 ${active.status}`);
  invariant(typeof active.releaseId === "string" && active.releaseId.length > 0, "Release ID 누락");
  return active;
}

async function gotoCompare(page) {
  const response = await page.goto(new URL("?view=compare", baseUrl).href, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  invariant(response?.status() === 200, `Compare Lab 응답 ${response?.status()}`);
  await page.getByTestId("app-shell").waitFor({ state: "visible" });
}

async function choosePair(page, { typeName, metric, baselineModelId, candidateModelId }) {
  await page.getByRole("tab", { name: typeName }).click();
  await page.getByLabel("비교 지표").selectOption(metric);
  await page
    .locator(
      `[data-testid="samsung-model-option"][data-model-id="${baselineModelId}"]`,
    )
    .click();
  await page
    .locator(
      `[data-testid="competitor-model-option"][data-model-id="${candidateModelId}"]`,
    )
    .click();
}

function assertEvidence(evidence, label) {
  invariant(evidence && typeof evidence === "object", `${label} Evidence 누락`);
  invariant(Boolean(evidence.evidenceId), `${label} evidenceId 누락`);
  invariant(Boolean(evidence.sourcePath), `${label} sourcePath 누락`);
  invariant(Boolean(evidence.authority), `${label} authority 누락`);
  invariant(evidence.locator && typeof evidence.locator === "object", `${label} locator 누락`);
  invariant(
    Array.isArray(evidence.fieldPaths) && evidence.fieldPaths.length > 0,
    `${label} fieldPaths 누락`,
  );
}

function validateCurvePayload(payload, activeReleaseId) {
  invariant(payload.releaseId === activeReleaseId, "속도 분석 Release 불일치");
  invariant(payload.comparison.code === "DIRECT_OK", "Re Golden이 DIRECT_OK가 아닙니다.");
  const speed = payload.speedAnalysis;
  invariant(speed?.status === "CURVE_READY", `속도 상태 ${speed?.status}`);
  invariant(speed.chartEligible === true, "CURVE_READY chartEligible 오류");
  invariant(speed.rankingAllowed === false, "겹치는 속도점 없는 비교의 순위가 허용됨");
  invariant(Array.isArray(speed.metricOptions), "metricOptions 누락");
  invariant(new Set(speed.metricOptions).size === speed.metricOptions.length, "metricOptions 중복");
  invariant(
    speed.metricOptions.every((metric) => allowedMetrics.includes(metric)),
    `허용하지 않은 지표 ${JSON.stringify(speed.metricOptions)}`,
  );
  invariant(
    requiredGoldenMetrics.every((metric) => speed.metricOptions.includes(metric)),
    `Golden 필수 지표 누락 ${JSON.stringify(speed.metricOptions)}`,
  );
  invariant(speed.commonRange !== null, "공통 속도범위 누락");
  invariant(
    approximatelyEqual(speed.commonRange.rpm.min, speed.commonRange.rps.min * 60) &&
      approximatelyEqual(speed.commonRange.rpm.max, speed.commonRange.rps.max * 60),
    "공통 범위 RPM/RPS 환산 오류",
  );
  invariant(Array.isArray(speed.series) && speed.series.length === 2, "양쪽 속도 series 누락");
  invariant(
    speed.safeguards?.interpolation === false &&
      speed.safeguards?.extrapolation === false &&
      speed.safeguards?.hzAsSpeed === false,
    "보간·외삽·Hz safeguard 오류",
  );

  let pointCount = 0;
  for (const series of speed.series) {
    invariant(
      [baselineId, candidateId].includes(series.modelId),
      `예상하지 않은 series ${series.modelId}`,
    );
    invariant(series.pointCount === series.points.length, `${series.modelId} pointCount 불일치`);
    invariant(series.points.length >= 2, `${series.modelId} 곡선 성능점 부족`);
    invariant(series.lineEligible === true, `${series.modelId} lineEligible 오류`);
    for (const [index, point] of series.points.entries()) {
      const label = `${series.modelId}#${index}`;
      invariant(point.speedUnit === "rpm" || point.speedUnit === "rps", `${label} speedUnit 오류`);
      invariant(approximatelyEqual(point.rpm, point.rps * 60), `${label} RPM/RPS 환산 오류`);
      invariant(
        point.speedUnit === "rpm"
          ? approximatelyEqual(point.speedValue, point.rpm)
          : approximatelyEqual(point.speedValue, point.rps),
        `${label} 원천 속도 보존 오류`,
      );
      invariant(point.valueKind === "MEASURED" || point.valueKind === "DERIVED", `${label} valueKind 오류`);
      assertEvidence(point.evidence, label);
      pointCount += 1;
    }
  }
  return { speed, pointCount };
}

async function assertPressed(toggle, name) {
  const button = toggle.getByRole("button", { name, exact: true });
  await button.click();
  invariant((await button.getAttribute("aria-pressed")) === "true", `${name} 활성 상태 누락`);
}

async function curveScenario(page, viewport, activeReleaseId) {
  await gotoCompare(page);
  await choosePair(page, {
    typeName: "Re 왕복동",
    metric: "cop",
    baselineModelId: baselineId,
    candidateModelId: candidateId,
  });
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/compare/report") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "안전 비교 실행" }).click();
  const response = await responsePromise;
  invariant(response.status() === 200, `Re 분석 API ${response.status()}`);
  const payload = await response.json();
  const { speed, pointCount } = validateCurvePayload(payload, activeReleaseId);

  const speedAnalysis = page.getByTestId("speed-analysis");
  await speedAnalysis.waitFor({ state: "visible" });
  const chart = speedAnalysis.getByTestId("speed-chart");
  invariant((await chart.count()) === 1, "eligible 속도 차트 수가 1이 아닙니다.");
  invariant(
    Number(await chart.getAttribute("data-point-count")) === pointCount,
    "차트 data-point-count와 API 원천점 수 불일치",
  );
  await page.waitForFunction(
    (expected) => document.querySelectorAll('[data-testid="speed-plotted-point"]').length === expected,
    pointCount,
  );
  invariant(
    (await speedAnalysis.getByTestId("speed-plotted-point").count()) === pointCount,
    "실제 Recharts 점 수와 API 원천점 수 불일치",
  );

  const table = speedAnalysis.getByTestId("speed-data-table");
  invariant(
    (await table.locator("caption").innerText()).trim() === "속도별 원시 성능점",
    "원시 성능점 표 caption 불일치",
  );
  const rows = table.locator("tbody tr");
  invariant((await rows.count()) === pointCount, "표 행 수와 API 원천점 수 불일치");
  for (let index = 0; index < pointCount; index += 1) {
    const row = rows.nth(index);
    const rpm = Number(await row.getAttribute("data-rpm"));
    const rps = Number(await row.getAttribute("data-rps"));
    invariant(Number.isFinite(rpm) && Number.isFinite(rps), `표 ${index} 속도 속성 누락`);
    invariant(approximatelyEqual(rpm, rps * 60), `표 ${index} RPM/RPS 환산 오류`);
    invariant(Boolean(await row.getAttribute("data-evidence-id")), `표 ${index} Evidence 누락`);
  }
  const tableText = await table.innerText();
  for (const series of payload.speedAnalysis.series) {
    for (const point of series.points) {
      invariant(tableText.includes(point.evidence.sourcePath), "표 Evidence sourcePath 누락");
    }
  }

  const unitToggle = speedAnalysis.getByTestId("speed-unit-toggle");
  await assertPressed(unitToggle, "RPS");
  await assertPressed(unitToggle, "RPM");
  const metricToggle = speedAnalysis.getByTestId("speed-metric-toggle");
  invariant(
    (await metricToggle.getByRole("button").count()) === speed.metricOptions.length,
    "UI 지표 버튼 수와 API metricOptions 불일치",
  );
  for (const metric of speed.metricOptions) {
    const label = metricLabels[metric];
    await assertPressed(metricToggle, label);
    invariant(await chart.isVisible(), `${label} 전환 후 차트가 숨겨졌습니다.`);
  }
  for (const metric of allowedMetrics.filter((item) => !speed.metricOptions.includes(item))) {
    invariant(
      (await metricToggle.getByRole("button", { name: metricLabels[metric], exact: true }).count()) === 0,
      `${metricLabels[metric]} 미완결 지표가 UI에 노출됐습니다.`,
    );
  }

  await speedAnalysis.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(screenshotDir, `${viewport.id}-speed-curve.png`),
    fullPage: false,
  });
  await page.emulateMedia({ media: "print" });
  invariant(await speedAnalysis.isVisible(), "인쇄 화면에서 속도 분석이 숨겨졌습니다.");
  invariant(!(await page.getByTestId("comparison-panel").isVisible()), "인쇄 화면에 선택 UI가 남았습니다.");
  await page.emulateMedia({ media: "screen" });
  await waitForLayout(page);
  const overflowState = await page.evaluate(() => {
    const root = document.documentElement;
    const viewportWidth = root.clientWidth;
    const offenders = [...document.querySelectorAll("*")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName,
          testId: element.getAttribute("data-testid"),
          className: element.className?.toString().slice(0, 80) || "",
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.right > viewportWidth + 1)
      .sort((left, right) => right.right - left.right)
      .slice(0, 5);
    return {
      overflow: root.scrollWidth - viewportWidth,
      scrollWidth: root.scrollWidth,
      viewportWidth,
      offenders,
    };
  });
  invariant(
    overflowState.overflow <= 1,
    `CURVE 페이지 가로 overflow ${overflowState.overflow}px ${JSON.stringify(overflowState.offenders)}`,
  );
  const overflow = overflowState.overflow;
  return {
    testIds: ["P15-E2E-CURVE-001", "P15-E2E-UNIT-001", "P15-E2E-METRIC-001"],
    status: payload.speedAnalysis.status,
    chartEligible: true,
    rankingAllowed: false,
    apiPointCount: pointCount,
    plottedPointCount: pointCount,
    tableRowCount: pointCount,
    evidenceCoveragePct: 100,
    metricOptions: speed.metricOptions,
    metricCount: speed.metricOptions.length,
    overflowPx: overflow,
  };
}

async function dataRequiredScenario(page, activeReleaseId) {
  await gotoCompare(page);
  await choosePair(page, {
    typeName: "Sc 스크롤",
    metric: "eer",
    baselineModelId: dataRequiredBaselineId,
    candidateModelId: dataRequiredCandidateId,
  });
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/compare/report") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "안전 비교 실행" }).click();
  const response = await responsePromise;
  invariant(response.status() === 200, `DATA_REQUIRED API ${response.status()}`);
  const payload = await response.json();
  invariant(payload.releaseId === activeReleaseId, "DATA_REQUIRED Release 불일치");
  const speed = payload.speedAnalysis;
  invariant(speed.status === "DATA_REQUIRED", `DATA_REQUIRED 대신 ${speed.status}`);
  invariant(speed.chartEligible === false, "DATA_REQUIRED chartEligible 오류");
  invariant(speed.rankingAllowed === false, "DATA_REQUIRED rankingAllowed 오류");
  invariant(speed.commonRange === null, "DATA_REQUIRED commonRange가 남았습니다.");
  invariant(
    speed.safeguards.interpolation === false &&
      speed.safeguards.extrapolation === false &&
      speed.safeguards.hzAsSpeed === false,
    "DATA_REQUIRED safeguard 오류",
  );
  const speedAnalysis = page.getByTestId("speed-analysis");
  await speedAnalysis.waitFor({ state: "visible" });
  invariant((await speedAnalysis.getByTestId("speed-data-gap").count()) === 1, "자료 공백 안내 누락");
  invariant((await speedAnalysis.getByTestId("speed-chart").count()) === 0, "DATA_REQUIRED 차트가 생성됨");
  invariant((await speedAnalysis.getByTestId("speed-data-table").count()) === 0, "DATA_REQUIRED 표가 생성됨");
  invariant((await speedAnalysis.innerText()).includes(speed.reason), "DATA_REQUIRED 사유가 UI에 없습니다.");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  invariant(overflow <= 1, `DATA_REQUIRED 페이지 가로 overflow ${overflow}px`);
  return {
    testId: "P15-E2E-GAP-001",
    status: speed.status,
    chartCount: 0,
    gapCount: 1,
    overflowPx: overflow,
  };
}

async function staleScenario(page) {
  await gotoCompare(page);
  await page.route("**/api/v1/compare/report", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 650));
    await route.continue();
  });
  await choosePair(page, {
    typeName: "Re 왕복동",
    metric: "cop",
    baselineModelId: baselineId,
    candidateModelId: candidateId,
  });
  await page.getByRole("button", { name: "안전 비교 실행" }).click();
  await page.getByLabel("비교 지표").selectOption("eer");
  await page.waitForTimeout(900);
  invariant((await page.getByTestId("comparison-result").count()) === 0, "stale 비교 결과가 남았습니다.");
  invariant((await page.getByTestId("analysis-report").count()) === 0, "stale 분석 리포트가 남았습니다.");
  invariant((await page.getByTestId("speed-analysis").count()) === 0, "stale 속도 분석이 남았습니다.");
  invariant((await page.getByTestId("speed-chart").count()) === 0, "stale 속도 차트가 남았습니다.");
  invariant((await page.getByTestId("speed-data-table").count()) === 0, "stale 속도 표가 남았습니다.");
  await page.unroute("**/api/v1/compare/report");
  return {
    testId: "P15-E2E-STALE-001",
    delayedMs: 650,
    staleResults: 0,
    staleSpeedAnalyses: 0,
    staleCharts: 0,
    staleTables: 0,
  };
}

async function staticReportScenario(context, landingPage, viewport, activeReleaseId) {
  const response = await landingPage.goto(baseUrl, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  invariant(response?.status() === 200, `랜딩 응답 ${response?.status()}`);
  const reportTab = landingPage.getByTestId("nav-compare-report");
  invariant(await reportTab.isVisible(), "Compare Report popup 탭 누락");
  const popupPromise = landingPage.waitForEvent("popup");
  await reportTab.click();
  const reportPage = await popupPromise;
  await reportPage.waitForLoadState("networkidle");
  await reportPage.setViewportSize({ width: viewport.width, height: viewport.height });
  await waitForLayout(reportPage);
  invariant(reportPage.url() === reportUrl, `정적 보고서 popup URL ${reportPage.url()}`);

  const directReport = reportPage.getByTestId("direct-comparison-report");
  await directReport.waitFor({ state: "visible" });
  const directComparisonCount = Number(await directReport.getAttribute("data-total-count"));
  invariant(
    directComparisonCount === 15,
    "정적 보고서 직접 비교 데이터 누락",
  );
  invariant((await reportPage.getByTestId("direct-raw-chart").count()) === 1, "원값 Recharts 누락");
  invariant((await reportPage.getByTestId("direct-delta-chart").count()) === 1, "Delta Recharts 누락");
  invariant((await reportPage.getByTestId("research-gap").count()) === 0, "비교 불가 항목이 보고서에 노출됨");
  invariant((await reportPage.getByTestId("speed-data-gap").count()) === 0, "속도 비교 불가 항목이 보고서에 노출됨");
  invariant((await reportPage.getByTestId("samsung-model-card").count()) === 8, "직접 비교 가능 Samsung 모델 수 불일치");
  invariant((await reportPage.getByTestId("comparison-matrix-row").count()) === 8, "직접 비교 매트릭스 수 불일치");
  const typeToggle = reportPage.getByTestId("direct-type-toggle");
  const metricToggle = reportPage.getByTestId("direct-metric-toggle");
  await typeToggle.getByRole("button", { name: "Sc", exact: true }).click();
  invariant((await metricToggle.getByRole("button").count()) === 1, "Sc에 값 없는 지표가 노출됨");
  invariant(await metricToggle.getByRole("button", { name: "EER", exact: true }).isVisible(), "Sc EER 필터 누락");
  invariant(Number(await directReport.getAttribute("data-comparison-count")) === 2, "Sc EER 비교 건수 불일치");
  invariant((await reportPage.getByTestId("direct-comparison-item").count()) === 2, "Sc EER 상세 카드 수 불일치");
  await typeToggle.getByRole("button", { name: "Ro", exact: true }).click();
  invariant((await metricToggle.getByRole("button").count()) === 2, "Ro COP/EER 필터 누락");
  invariant(Number(await directReport.getAttribute("data-comparison-count")) === 6, "Ro COP 비교 건수 불일치");
  await typeToggle.getByRole("button", { name: "전체", exact: true }).click();

  const speedSections = reportPage.getByTestId("speed-report-section");
  const speedSectionCount = await speedSections.count();
  invariant(speedSectionCount >= 1, "정적 보고서 eligible 속도 섹션 누락");
  const eligibleSections = reportPage.locator(
    '[data-testid="speed-report-section"][data-chart-eligible="true"]',
  );
  const eligibleSectionCount = await eligibleSections.count();
  invariant(eligibleSectionCount >= 1, "정적 보고서 eligible 판정 누락");
  const charts = reportPage.getByTestId("speed-chart");
  invariant(
    (await charts.count()) === eligibleSectionCount,
    "정적 보고서 chart 수와 eligibility 수 불일치",
  );
  const plottedPoints = reportPage.getByTestId("speed-plotted-point");
  let declaredPoints = 0;
  for (let index = 0; index < (await charts.count()); index += 1) {
    declaredPoints += Number(await charts.nth(index).getAttribute("data-point-count"));
  }
  invariant((await plottedPoints.count()) === declaredPoints, "정적 보고서 원천점/plot 수 불일치");
  invariant((await reportPage.getByTestId("speed-data-table").count()) >= 1, "정적 보고서 원시점 표 누락");
  const speedCsvLink = reportPage.getByRole("link", {
    name: "속도 성능 CSV 내려받기",
    exact: true,
  });
  invariant((await speedCsvLink.getAttribute("href")) === "/compare-lab-speed-output.csv", "속도 CSV 링크 오류");
  const csvResponse = await context.request.get(speedCsvUrl);
  invariant(csvResponse.status() === 200, `속도 CSV 응답 ${csvResponse.status()}`);
  const csvText = (await csvResponse.text()).replace(/^\uFEFF/, "");
  invariant(csvText.includes(activeReleaseId), "속도 CSV Active Release 누락");
  invariant(csvText.includes(baselineId) && csvText.includes(candidateId), "속도 CSV 모델 trace 누락");
  invariant(csvText.includes("evidence") || csvText.includes("Evidence"), "속도 CSV Evidence 열 누락");
  invariant((await reportPage.getByRole("link", { name: "CSV 내려받기", exact: true }).count()) === 1, "기존 전체 CSV 회귀");
  invariant((await reportPage.locator(".open-lab").count()) >= 1, "Compare Lab 왕복 링크 회귀");

  await directReport.scrollIntoViewIfNeeded();
  await reportPage.screenshot({
    path: path.join(screenshotDir, `${viewport.id}-direct-comparison-report.png`),
    fullPage: false,
  });
  await speedSections.first().scrollIntoViewIfNeeded();
  await reportPage.screenshot({
    path: path.join(screenshotDir, `${viewport.id}-static-speed-report.png`),
    fullPage: false,
  });
  await reportPage.emulateMedia({ media: "print" });
  invariant(await speedSections.first().isVisible(), "정적 print에서 속도 섹션 누락");
  invariant(await charts.first().isVisible(), "정적 print에서 속도 차트 누락");
  await reportPage.emulateMedia({ media: "screen" });
  await waitForLayout(reportPage);
  const overflow = await reportPage.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  invariant(overflow <= 1, `정적 보고서 가로 overflow ${overflow}px`);
  await reportPage.close();
  return {
    testIds: ["P15-E2E-REPORT-001", "P15-E2E-PRINT-001"],
    popup: true,
    directComparisonCount,
    directChartCount: 2,
    visibleModelCount: 8,
    excludedGapCount: 0,
    speedSectionCount,
    chartEligibilityMatched: true,
    plottedPointCount: declaredPoints,
    speedCsv: true,
    legacyCsv: true,
    compareLabLink: true,
    overflowPx: overflow,
  };
}

function assertGuards(guards) {
  invariant(guards.errors.length === 0, guards.errors.join("\n"));
  invariant(guards.externalRequests.length === 0, `외부 요청: ${guards.externalRequests.join(", ")}`);
  invariant(guards.forbiddenWrites.length === 0, `금지 쓰기: ${guards.forbiddenWrites.join(", ")}`);
}

function writeReport(report) {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let activeReleaseId = null;
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const guards = attachGuards(context);
      const active = await getActiveRelease(context);
      if (activeReleaseId === null) activeReleaseId = active.releaseId;
      invariant(active.releaseId === activeReleaseId, "viewport 사이 Active Release가 변경됨");

      const page = await context.newPage();
      guards.monitor(page);
      const curve = await curveScenario(page, viewport, activeReleaseId);
      const dataRequired = await dataRequiredScenario(page, activeReleaseId);
      const stale = await staleScenario(page);
      const landingPage = await context.newPage();
      guards.monitor(landingPage);
      const staticReport = await staticReportScenario(
        context,
        landingPage,
        viewport,
        activeReleaseId,
      );
      assertGuards(guards);
      results.push({
        viewport,
        status: "PASS",
        scenarios: { curve, dataRequired, stale, staticReport },
        consolePageNetworkErrors: 0,
        externalRequests: 0,
        forbiddenWrites: 0,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = {
    phase: "P15-E",
    status: "PASS",
    activeReleaseId,
    retries: 0,
    viewportCount: results.length,
    scenarioCount: results.length * 4,
    hardGates: {
      evidenceCoveragePct: 100,
      hzAsSpeedCount: 0,
      interpolatedPointCount: 0,
      extrapolatedPointCount: 0,
      chartEligibilityMismatchCount: 0,
      critical: 0,
      major: 0,
    },
    results,
  };
  writeReport(report);
  console.log("P15 speed E2E: PASS");
  console.log(`Scenarios: ${report.scenarioCount}/${report.scenarioCount} PASS`);
  console.log(`Active Release: ${activeReleaseId}`);
  console.log(`Evidence: ${resultPath}`);
}

main().catch((error) => {
  writeReport({
    phase: "P15-E",
    status: "FAIL",
    retries: 0,
    error: error.stack || error.message || String(error),
  });
  console.error(error.stack || error.message || String(error));
  console.error(`Evidence: ${resultPath}`);
  process.exitCode = 1;
});
