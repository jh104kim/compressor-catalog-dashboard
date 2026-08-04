"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const playwrightProxy = process.env.PLAYWRIGHT_PROXY_SERVER;

const baseUrl = process.env.P14_BASE_URL || "http://127.0.0.1:8000/";
const outputDir = path.resolve(
  process.env.OUTPUT_DIR ||
    path.join(__dirname, "..", "evidence", "p14", "analysis"),
);
const screenshotDir = path.join(outputDir, "screenshots");
const baselineId = "model:samsung:DS8LC5040IN";
const candidateId = "model:gmcc:STDA031N1ULB";
const blockedCandidateId = "model:gmcc:ATQ360D1UMU";
const viewports = [
  { id: "desktop-1440x1024", width: 1440, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function monitorPage(page) {
  const errors = [];
  const externalRequests = [];
  const writes = [];
  const origin = new URL(baseUrl).origin;
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
    const isAllowedPost =
      method === "POST" && parsed.pathname === "/api/v1/compare/report";
    if (
      ["PUT", "PATCH", "DELETE"].includes(method) ||
      (method === "POST" && !isAllowedPost)
    ) {
      writes.push(`${method} ${parsed.pathname}`);
    }
  });
  return { errors, externalRequests, writes };
}

async function gotoCompare(page) {
  const response = await page.goto(new URL("?view=compare", baseUrl).href, {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  invariant(response?.status() === 200, `Compare Lab 응답 ${response?.status()}`);
  await page.getByTestId("app-shell").waitFor({ state: "visible" });
}

async function getActiveReleaseId(context) {
  const response = await context.request.get(
    new URL("api/v1/releases/active", baseUrl).href,
  );
  invariant(response.status() === 200, `Active Release API ${response.status()}`);
  const active = await response.json();
  invariant(active.status === "PUBLISHED", `Active Release 상태 ${active.status}`);
  invariant(typeof active.releaseId === "string" && active.releaseId.length > 0, "Active Release ID 누락");
  return active.releaseId;
}

async function chooseDirectPair(page) {
  await page.getByRole("tab", { name: "Sc 스크롤" }).click();
  await page.getByLabel("비교 지표").selectOption("eer");
  await page
    .locator(`[data-testid="samsung-model-option"][data-model-id="${baselineId}"]`)
    .click();
  await page
    .locator(`[data-testid="competitor-model-option"][data-model-id="${candidateId}"]`)
    .click();
}

function decodeReportHref(href) {
  invariant(href?.startsWith("data:application/json"), "JSON data URL이 아닙니다.");
  const comma = href.indexOf(",");
  invariant(comma > 0, "JSON data URL 구분자가 없습니다.");
  return JSON.parse(decodeURIComponent(href.slice(comma + 1)));
}

async function directAnalysisScenario(page, viewport, releaseId) {
  await gotoCompare(page);
  await chooseDirectPair(page);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/v1/compare/report") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "안전 비교 실행" }).click();
  const apiResponse = await responsePromise;
  invariant(apiResponse.status() === 200, `분석 API ${apiResponse.status()}`);
  const payload = await apiResponse.json();
  await page.getByTestId("analysis-report").waitFor({ state: "visible" });

  invariant(payload.releaseId === releaseId, "분석 Release 불일치");
  invariant(payload.comparison.code === "DIRECT_OK", "DIRECT_OK가 아닙니다.");
  invariant(payload.analysis.performanceInterpretation.allowed === true, "수치 해석이 차단됐습니다.");
  invariant(payload.analysis.evidenceRefs.length === 2, "양쪽 Evidence가 없습니다.");
  for (const testId of [
    "analysis-condition-safety",
    "analysis-performance",
    "analysis-evidence",
    "analysis-portfolio",
    "analysis-actions",
  ]) {
    invariant((await page.getByTestId(testId).count()) === 1, `${testId} 누락`);
  }

  const trace = await page.getByTestId("analysis-trace").innerText();
  invariant(trace.includes(releaseId), "화면 Release 추적 누락");
  invariant(trace.includes(baselineId), "Samsung modelId 추적 누락");
  invariant(trace.includes(candidateId), "경쟁 modelId 추적 누락");
  const href = await page
    .getByRole("link", { name: "JSON 내려받기" })
    .getAttribute("href");
  const exported = decodeReportHref(href);
  invariant(exported.releaseId === releaseId, "JSON Release 불일치");
  invariant(exported.analysis.baselineModelId === baselineId, "JSON Samsung modelId 불일치");
  invariant(exported.analysis.candidateModelId === candidateId, "JSON 경쟁 modelId 불일치");

  await page.getByTestId("analysis-report").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(screenshotDir, `${viewport.id}-analysis-report.png`),
    fullPage: false,
  });
  await page.emulateMedia({ media: "print" });
  invariant(await page.getByTestId("analysis-report").isVisible(), "인쇄 화면에서 분석 리포트가 숨겨졌습니다.");
  invariant(!(await page.getByTestId("comparison-panel").isVisible()), "인쇄 화면에 선택 UI가 남았습니다.");
  await page.emulateMedia({ media: "screen" });
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  invariant(overflow <= 1, `페이지 가로 overflow ${overflow}px`);
  return {
    code: payload.comparison.code,
    evidenceRefs: payload.analysis.evidenceRefs.length,
    sections: 5,
    jsonTrace: true,
    printLayout: true,
    overflowPx: overflow,
  };
}

async function blockedApiScenario(context, releaseId) {
  const response = await context.request.post(
    new URL("api/v1/compare/report", baseUrl).href,
    {
      data: {
        baselineModelId: baselineId,
        candidateModelId: blockedCandidateId,
        metric: "eer",
      },
    },
  );
  invariant(response.status() === 200, `BLOCKED API ${response.status()}`);
  const payload = await response.json();
  invariant(payload.releaseId === releaseId, "BLOCKED Release 불일치");
  invariant(payload.comparison.verdict === "BLOCKED", "BLOCKED 판정이 아닙니다.");
  invariant(payload.comparison.rankingAllowed === false, "BLOCKED rankingAllowed 오류");
  invariant(payload.comparison.deltaPct === null, "BLOCKED deltaPct 오류");
  invariant(
    payload.analysis.performanceInterpretation.allowed === false,
    "BLOCKED 분석 수치 허용 오류",
  );
  const rendered = JSON.stringify(payload.analysis);
  for (const forbidden of ["우위", "열위", "순위", "Δ"]) {
    invariant(!rendered.includes(forbidden), `BLOCKED 금지 표현: ${forbidden}`);
  }
  return { code: payload.comparison.code, forbiddenTerms: 0 };
}

async function staleScenario(page) {
  await gotoCompare(page);
  await page.route("**/api/v1/compare/report", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 650));
    await route.continue();
  });
  await chooseDirectPair(page);
  await page.getByRole("button", { name: "안전 비교 실행" }).click();
  await page.getByLabel("비교 지표").selectOption("cop");
  await page.waitForTimeout(900);
  invariant((await page.getByTestId("comparison-result").count()) === 0, "stale 비교 결과가 남았습니다.");
  invariant((await page.getByTestId("analysis-report").count()) === 0, "stale 분석 리포트가 남았습니다.");
  invariant(await page.getByRole("button", { name: "안전 비교 실행" }).isDisabled(), "이전 선택 실행 버튼이 활성화됐습니다.");
  await page.unroute("**/api/v1/compare/report");
  return { delayedMs: 650, staleResults: 0, staleReports: 0 };
}

async function main() {
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(playwrightProxy ? { proxy: { server: playwrightProxy } } : {}),
  });
  const results = [];
  let releaseId = null;
  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const contextReleaseId = await getActiveReleaseId(context);
      if (releaseId === null) releaseId = contextReleaseId;
      invariant(contextReleaseId === releaseId, "viewport 사이 Active Release가 변경됨");
      const page = await context.newPage();
      const monitor = monitorPage(page);
      const direct = await directAnalysisScenario(page, viewport, releaseId);
      const blocked = await blockedApiScenario(context, releaseId);
      const stale = await staleScenario(page);
      invariant(monitor.errors.length === 0, monitor.errors.join("\n"));
      invariant(monitor.externalRequests.length === 0, "외부 요청이 발생했습니다.");
      invariant(monitor.writes.length === 0, `쓰기 요청: ${monitor.writes.join(", ")}`);
      results.push({
        viewport,
        status: "PASS",
        scenarios: { direct, blocked, stale },
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
    phase: "P14-E",
    status: "PASS",
    releaseId,
    retries: 0,
    scenarioCount: results.length * 3,
    results,
  };
  const resultPath = path.join(outputDir, "p14-analysis-e2e.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log("P14 analysis E2E: PASS");
  console.log(`Scenarios: ${report.scenarioCount}/${report.scenarioCount} PASS`);
  console.log(`Evidence: ${resultPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
