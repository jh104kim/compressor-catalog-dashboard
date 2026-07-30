const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = process.env.REPORT_BASE_URL || "http://127.0.0.1:8000/";
const outputDir = path.resolve(
  process.env.OUTPUT_DIR || path.join(__dirname, "..", "evidence", "p14"),
);
const reportUrl = new URL("compare-lab-output.html", baseUrl).href;
const csvUrl = new URL("compare-lab-output.csv", baseUrl).href;
const viewports = [
  { id: "desktop-1440x1024", width: 1440, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const screenshotDir = path.join(outputDir, "screenshots");
  fs.mkdirSync(screenshotDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const errors = [];
      const externalRequests = [];
      const badResponses = [];
      const attached = new WeakSet();
      function attachGuards(guardedPage) {
        if (attached.has(guardedPage)) return;
        attached.add(guardedPage);
        guardedPage.on("console", (message) => {
          if (message.type() === "error") errors.push(`console: ${message.text()}`);
        });
        guardedPage.on("pageerror", (error) => errors.push(`page: ${error.message}`));
        guardedPage.on("requestfailed", (request) => {
          errors.push(`request: ${request.url()} ${request.failure()?.errorText || ""}`);
        });
        guardedPage.on("request", (request) => {
          if (new URL(request.url()).origin !== new URL(baseUrl).origin) {
            externalRequests.push(request.url());
          }
        });
        guardedPage.on("response", (response) => {
          if (response.status() >= 400) {
            badResponses.push(`${response.status()} ${response.url()}`);
          }
        });
      }
      context.on("page", attachGuards);
      const landingPage = await context.newPage();
      attachGuards(landingPage);
      const landingResponse = await landingPage.goto(baseUrl, {
        waitUntil: "networkidle",
      });
      invariant(landingResponse?.status() === 200, "랜딩 응답이 200이 아닙니다.");
      const reportTab = landingPage.getByTestId("nav-compare-report");
      invariant(await reportTab.isVisible(), "랜딩 Compare Report 탭이 보이지 않습니다.");
      await landingPage.screenshot({
        path: path.join(screenshotDir, `${viewport.id}-landing-report-tab.png`),
        fullPage: false,
      });
      const popupPromise = landingPage.waitForEvent("popup");
      await reportTab.click();
      const page = await popupPromise;
      attachGuards(page);
      await page.waitForLoadState("networkidle");
      invariant(page.url() === reportUrl, `팝업 URL 불일치: ${page.url()}`);

      const reportResponse = await context.request.get(reportUrl);
      invariant(reportResponse.status() === 200, "보고서 응답이 200이 아닙니다.");
      const modelCount = await page
        .locator('[data-testid="samsung-model-card"]')
        .count();
      const comparisonCount = await page
        .locator('[data-testid="direct-comparison-row"]')
        .count();
      invariant(modelCount === 27, `Samsung 모델 카드 ${modelCount}/27`);
      invariant(comparisonCount === 15, `직접 비교 행 ${comparisonCount}/15`);

      const typeCounts = {};
      for (const type of ["Re", "Ro", "Sc"]) {
        typeCounts[type] = await page
          .locator(`[data-testid="samsung-model-card"][data-type="${type}"]`)
          .count();
      }
      invariant(
        typeCounts.Re === 4 && typeCounts.Ro === 12 && typeCounts.Sc === 11,
        `유형별 모델 수 불일치 ${JSON.stringify(typeCounts)}`,
      );
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      invariant(overflow <= 1, `페이지 가로 overflow ${overflow}px`);
      const csvLink = page.getByRole("link", { name: "CSV 내려받기" });
      invariant((await csvLink.getAttribute("href")) === "/compare-lab-output.csv", "CSV 링크가 잘못됐습니다.");
      const csvResponse = await context.request.get(csvUrl);
      invariant(csvResponse.status() === 200, "CSV 응답이 200이 아닙니다.");
      const csvLines = (await csvResponse.text())
        .replace(/^\uFEFF/, "")
        .trim()
        .split(/\r?\n/);
      invariant(csvLines.length === 16, `CSV 행 수 ${csvLines.length}/16`);

      await page.screenshot({
        path: path.join(screenshotDir, `${viewport.id}-report-top.png`),
        fullPage: false,
      });

      const firstLabLink = page.locator(".open-lab").first();
      invariant((await firstLabLink.count()) === 1, "Compare Lab 링크가 없습니다.");
      await firstLabLink.click();
      await page.getByTestId("comparison-code").waitFor({ state: "visible" });
      invariant(
        (await page.getByTestId("comparison-code").innerText()).trim() === "DIRECT_OK",
        "보고서 링크의 Compare Lab 판정이 DIRECT_OK가 아닙니다.",
      );
      invariant(errors.length === 0, errors.join("\n"));
      invariant(externalRequests.length === 0, "외부 요청이 발생했습니다.");
      invariant(badResponses.length === 0, badResponses.join("\n"));

      results.push({
        viewport,
        status: "PASS",
        landingPopup: true,
        modelCount,
        comparisonCount,
        csvComparisonRows: 15,
        typeCounts,
        overflowPx: overflow,
        compareLabLink: "DIRECT_OK",
        consolePageNetworkErrors: 0,
        externalRequests: 0,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const report = {
    phase: "P14",
    status: "PASS",
    reportUrl,
    releaseId: "release:2026-07-30:005",
    retries: 0,
    results,
  };
  const resultPath = path.join(outputDir, "compare-report-e2e.json");
  fs.writeFileSync(resultPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log("Compare report E2E: PASS");
  console.log("Viewports: 2/2 PASS");
  console.log(`Evidence: ${resultPath}`);
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exitCode = 1;
});
