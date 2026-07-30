"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const BASE_URL = new URL(
  process.env.BASE_URL || "http://127.0.0.1:8000/",
).toString();
const RUN_ID =
  process.env.RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_");
const OUTPUT_DIR = path.resolve(
  process.env.OUTPUT_DIR ||
    path.join(ROOT, "qa", "evidence", "p5", RUN_ID),
);
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, "screenshots");
const RESULT_PATH = path.join(OUTPUT_DIR, "p5-e2e.json");
const BASE_ORIGIN = new URL(BASE_URL).origin;
const BROWSER_EXECUTABLE = process.env.BROWSER_EXECUTABLE || "";

const MODELS = {
  g1Baseline: "model:samsung:DS8LC5040IN",
  g1Candidate: "model:gmcc:STDA031N1ULB",
  g2Baseline: "model:samsung:UB8TN8300F",
  g2Candidate: "model:gmcc:ATQ360D1UMU",
  authority: "model:samsung:DS4BC7066FVT",
};

const EXPECTED = {
  releaseId: "release:2026-07-30:004",
  sourcePath: "data/Samsung-Compressor-Catalogue_2024.pdf",
  authorityCop: "3.25",
  authorityPage: "PDF p.92",
};

const VIEWPORTS = [
  { id: "desktop-1440x1024", width: 1440, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
];

function relativePath(filePath) {
  return path.relative(ROOT, filePath).replaceAll("\\", "/");
}

function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack || null,
    };
  }
  return { name: "Error", message: String(error), stack: null };
}

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

async function anyVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    if (await locator.nth(index).isVisible()) return true;
  }
  return false;
}

async function requireVisible(locator, label) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await anyVisible(locator)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${label}이(가) 보이지 않습니다.`);
}

async function requireHidden(locator, label) {
  invariant(!(await anyVisible(locator)), `${label}이(가) 표시되었습니다.`);
}

async function assertion(log, name, action) {
  try {
    const details = await action();
    log.push({
      name,
      status: "PASS",
      details: details === undefined ? null : details,
    });
    return details;
  } catch (error) {
    log.push({
      name,
      status: "FAIL",
      details: null,
      error: serializeError(error),
    });
    throw error;
  }
}

function appUrl(query = "") {
  return new URL(query || "/", BASE_URL).toString();
}

async function gotoReady(page, query) {
  const response = await page.goto(appUrl(query), {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  invariant(response && response.ok(), `화면 응답 실패: ${response?.status()}`);
  await requireVisible(page.getByTestId("app-shell"), "P5 앱");
  await page.waitForLoadState("networkidle", { timeout: 30_000 });
  return {
    url: page.url(),
    status: response.status(),
  };
}

function createMonitor(page) {
  const monitor = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    badResponses: [],
    externalRequests: [],
    forbiddenWrites: [],
    requests: [],
  };

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    monitor.consoleErrors.push({
      text: message.text(),
      location: message.location(),
    });
  });

  page.on("pageerror", (error) => {
    monitor.pageErrors.push(serializeError(error));
  });

  page.on("request", (request) => {
    const method = request.method().toUpperCase();
    const url = request.url();
    monitor.requests.push({
      method,
      url,
      resourceType: request.resourceType(),
    });

    try {
      const parsed = new URL(url);
      if (
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.origin !== BASE_ORIGIN
      ) {
        monitor.externalRequests.push({ method, url });
      }
      const isForbiddenMethod = ["PUT", "PATCH", "DELETE"].includes(method);
      const isPublish = parsed.pathname === "/api/v1/releases/publish";
      const isUnexpectedPost =
        method === "POST" && parsed.pathname !== "/api/v1/compare";
      if (isForbiddenMethod || isPublish || isUnexpectedPost) {
        monitor.forbiddenWrites.push({ method, url });
      }
    } catch {
      // data:, about:, blob: 등은 외부 HTTP 요청이 아니다.
    }
  });

  page.on("requestfailed", (request) => {
    monitor.requestFailures.push({
      method: request.method(),
      url: request.url(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText || "unknown request failure",
    });
  });

  page.on("response", (response) => {
    if (response.status() < 400) return;
    monitor.badResponses.push({
      status: response.status(),
      statusText: response.statusText(),
      url: response.url(),
      method: response.request().method(),
      resourceType: response.request().resourceType(),
    });
  });

  return monitor;
}

function eventOffsets(monitor) {
  return {
    consoleErrors: monitor.consoleErrors.length,
    pageErrors: monitor.pageErrors.length,
    requestFailures: monitor.requestFailures.length,
    badResponses: monitor.badResponses.length,
    externalRequests: monitor.externalRequests.length,
    forbiddenWrites: monitor.forbiddenWrites.length,
    requests: monitor.requests.length,
  };
}

function eventSlice(monitor, offsets) {
  return {
    consoleErrors: monitor.consoleErrors.slice(offsets.consoleErrors),
    pageErrors: monitor.pageErrors.slice(offsets.pageErrors),
    requestFailures: monitor.requestFailures.slice(offsets.requestFailures),
    badResponses: monitor.badResponses.slice(offsets.badResponses),
    externalRequests: monitor.externalRequests.slice(offsets.externalRequests),
    forbiddenWrites: monitor.forbiddenWrites.slice(offsets.forbiddenWrites),
    requests: monitor.requests.slice(offsets.requests),
  };
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const bodyText = body?.innerText || "";
    const documentOverflow = Math.max(0, root.scrollWidth - root.clientWidth);
    const bodyOverflow = body
      ? Math.max(0, body.scrollWidth - body.clientWidth)
      : 0;
    const unresolvedBindings = bodyText.match(/\{\{[^{}\n]+\}\}/g) || [];
    return {
      documentScrollWidth: root.scrollWidth,
      documentClientWidth: root.clientWidth,
      bodyScrollWidth: body?.scrollWidth || 0,
      bodyClientWidth: body?.clientWidth || 0,
      overflowPixels: Math.max(documentOverflow, bodyOverflow),
      unresolvedBindings: [...new Set(unresolvedBindings)].slice(0, 20),
      rootChildCount: document.getElementById("root")?.childElementCount || 0,
    };
  });
}

async function runScenario(page, monitor, viewport, spec) {
  const offsets = eventOffsets(monitor);
  const screenshotPath = path.join(
    SCREENSHOT_DIR,
    `${viewport.id}-${spec.id.toLowerCase()}.png`,
  );
  const result = {
    id: spec.id,
    title: spec.title,
    status: "FAIL",
    assertions: [],
    screenshot: relativePath(screenshotPath),
    layout: null,
    errors: null,
  };

  try {
    await assertion(result.assertions, "화면 진입", async () =>
      gotoReady(page, spec.query),
    );
    await spec.run(page, result.assertions);
    await page.waitForTimeout(150);

    result.layout = await assertion(
      result.assertions,
      "페이지 가로 overflow 0",
      async () => {
        const layout = await inspectLayout(page);
        invariant(
          layout.overflowPixels <= 1,
          `페이지 가로 overflow ${layout.overflowPixels}px`,
        );
        return layout;
      },
    );

    await assertion(result.assertions, "미해결 보간과 빈 root 0", async () => {
      const layout = result.layout || (await inspectLayout(page));
      invariant(
        layout.unresolvedBindings.length === 0,
        `미해결 보간: ${layout.unresolvedBindings.join(", ")}`,
      );
      invariant(layout.rootChildCount > 0, "React root가 비어 있습니다.");
      return {
        unresolvedBindings: layout.unresolvedBindings.length,
        rootChildCount: layout.rootChildCount,
      };
    });
  } catch (error) {
    result.interactionError = serializeError(error);
  }

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    result.assertions.push({
      name: "스크린샷 저장",
      status: "PASS",
      details: { path: result.screenshot },
    });
  } catch (error) {
    result.assertions.push({
      name: "스크린샷 저장",
      status: "FAIL",
      details: null,
      error: serializeError(error),
    });
  }

  await page.waitForTimeout(100);
  result.errors = eventSlice(monitor, offsets);
  const errorCounts = {
    console: result.errors.consoleErrors.length,
    page: result.errors.pageErrors.length,
    requestFailed: result.errors.requestFailures.length,
    http: result.errors.badResponses.length,
    external: result.errors.externalRequests.length,
    forbiddenWrite: result.errors.forbiddenWrites.length,
  };
  const browserGatePass = Object.values(errorCounts).every(
    (count) => count === 0,
  );
  result.assertions.push({
    name: "외부요청·console·page·network·금지쓰기 0",
    status: browserGatePass ? "PASS" : "FAIL",
    details: errorCounts,
  });

  result.status =
    !result.interactionError &&
    result.assertions.every((item) => item.status === "PASS")
      ? "PASS"
      : "FAIL";
  return result;
}

const SCENARIOS = [
  {
    id: "G1-DIRECT",
    title: "R454B Sc Fixed DOE-B EER 직접 비교",
    query: "/?view=compare",
    run: async (page, log) => {
      const baseline = page.getByLabel("Samsung 기준 모델");
      const candidate = page.getByLabel("경쟁 모델");
      const metric = page.getByLabel("비교 지표");
      await assertion(log, "G1 Sc 유형과 EER 선택", async () => {
        await page.getByRole("tab", { name: "Sc 스크롤" }).click();
        await metric.selectOption("eer");
        await baseline.selectOption(MODELS.g1Baseline);
        await candidate.selectOption(MODELS.g1Candidate);
        invariant(
          (await baseline.inputValue()) === MODELS.g1Baseline,
          "G1 Samsung 기준 모델 선택 실패",
        );
        invariant(
          (await candidate.inputValue()) === MODELS.g1Candidate,
          "G1 경쟁 모델 선택 실패",
        );
        invariant((await metric.inputValue()) === "eer", "G1 EER 선택 실패");
        return {
          baseline: MODELS.g1Baseline,
          candidate: MODELS.g1Candidate,
          metric: "eer",
        };
      });
      await assertion(log, "G1 비교 실행", async () => {
        await page.getByRole("button", { name: "안전 비교 실행" }).click();
        await requireVisible(page.getByTestId("comparison-result"), "G1 비교 결과");
      });
      await assertion(log, "G1 DIRECT_OK와 순위·Delta 표시", async () => {
        const result = page.getByTestId("comparison-result");
        invariant(
          (await result.getAttribute("data-verdict")) === "DIRECT",
          "G1 verdict가 DIRECT가 아닙니다.",
        );
        invariant(
          (await result.getAttribute("data-code")) === "DIRECT_OK",
          "G1 code가 DIRECT_OK가 아닙니다.",
        );
        await requireVisible(page.getByTestId("comparison-ranking"), "G1 순위");
        await requireVisible(page.getByTestId("comparison-delta"), "G1 EER Delta");
        invariant(
          (await page.getByTestId("comparison-delta").innerText()).includes("EER"),
          "G1 Delta 지표가 EER가 아닙니다.",
        );
        return {
          verdict: "DIRECT",
          code: "DIRECT_OK",
          delta: await page.getByTestId("comparison-delta").innerText(),
        };
      });
    },
  },
  {
    id: "G2-RESEARCH-QUEUE",
    title: "직접 비교 불가 Samsung 모델의 공식 자료 리서치 큐",
    query: "/?view=compare",
    run: async (page, log) => {
      const baseline = page.getByLabel("Samsung 기준 모델");
      const candidate = page.getByLabel("경쟁 모델");
      await assertion(log, "G2 Ro 직접 비교 가능 모델 없음", async () => {
        await page.getByRole("tab", { name: "Ro 로터리" }).click();
        await page.getByLabel("비교 지표").selectOption("cop");
        invariant(
          await baseline.isDisabled(),
          "G2 직접 비교 가능 Samsung 모델이 없는데 기준 모델 선택이 활성화되었습니다.",
        );
        return {
          directBaselineSelectable: false,
          metric: "cop",
        };
      });
      await assertion(log, "G2 비교 불가 모델과 요구조건을 리서치 큐에 표시", async () => {
        const optionValues = await candidate.locator("option").evaluateAll(
          (options) => options.map((option) => option.value),
        );
        invariant(
          !optionValues.includes(MODELS.g2Candidate),
          "G2 조건 불일치 경쟁 모델이 선택 목록에 노출되었습니다.",
        );
        invariant(
          await candidate.isDisabled(),
          "G2 직접 비교 후보가 없는데 경쟁 모델 선택이 활성화되었습니다.",
        );
        const queue = page.getByTestId("comparison-research-queue");
        await requireVisible(queue, "G2 공식 자료 리서치 큐");
        const queueText = await queue.innerText();
        invariant(
          queueText.includes("UB8TN8300F") &&
            queueText.includes("R32") &&
            queueText.includes("ARI") &&
            queueText.includes("Variable"),
          `G2 리서치 요구조건이 불완전합니다: ${queueText}`,
        );
        invariant(
          await page.getByRole("button", { name: "안전 비교 실행" }).isDisabled(),
          "G2 비교 실행 버튼이 활성화되었습니다.",
        );
        await requireHidden(page.getByTestId("comparison-ranking"), "G2 순위");
        await requireHidden(page.getByTestId("comparison-delta"), "G2 Delta");
        return {
          incompatibleCandidateHidden: true,
          researchTarget: MODELS.g2Baseline,
          comparisonDisabled: true,
          rankingVisible: false,
          deltaVisible: false,
        };
      });
    },
  },
  {
    id: "G3-PORTFOLIO-GAP",
    title: "Samsung R290 Re GAP",
    query: "/?view=portfolio",
    run: async (page, log) => {
      await assertion(log, "G3 GAP과 Samsung 없음", async () => {
        const status = (await page.getByTestId("portfolio-status").innerText()).trim();
        const samsung = (await page.getByTestId("samsung-models").innerText()).trim();
        const competitor = (
          await page.getByTestId("competitor-models").innerText()
        ).trim();
        invariant(status === "GAP", `R290 Re 상태가 GAP이 아닙니다: ${status}`);
        invariant(samsung === "없음", `Samsung 가짜 모델이 있습니다: ${samsung}`);
        const competitorCount = Number.parseInt(competitor, 10);
        invariant(
          Number.isFinite(competitorCount) && competitorCount >= 1,
          `경쟁 모델이 없습니다: ${competitor}`,
        );
        return { status, samsungModels: samsung, competitorModels: competitorCount };
      });
      await assertion(log, "G3 순위·Delta DOM 없음", async () => {
        await requireHidden(page.getByTestId("comparison-ranking"), "G3 순위");
        await requireHidden(page.getByTestId("comparison-delta"), "G3 Delta");
        await requireVisible(
          page.getByText("순위·Δ 없음", { exact: true }),
          "G3 화면 안전 규칙",
        );
      });
    },
  },
  {
    id: "G4-AUTHORITY",
    title: "DS4BC7066FVT 공식 COP 3.25",
    query: `/?view=model&modelId=${encodeURIComponent(MODELS.authority)}`,
    run: async (page, log) => {
      await assertion(log, "G4 권위 모델과 COP 3.25", async () => {
        await requireVisible(page.getByTestId("model-detail"), "G4 모델 상세");
        invariant(
          (await page.getByTestId("model-name").innerText()).trim() ===
            "DS4BC7066FVT",
          "G4 모델명이 다릅니다.",
        );
        invariant(
          (await page.getByTestId("model-cop").innerText()).trim() ===
            EXPECTED.authorityCop,
          "DS4BC7066FVT COP가 3.25가 아닙니다.",
        );
        await requireVisible(
          page.getByText("Samsung 2024 공식", { exact: true }),
          "Samsung 2024 공식 배지",
        );
        invariant(
          !(await page.locator("body").innerText()).includes("3.34"),
          "폐기값 3.34가 화면에 표시됩니다.",
        );
        return { model: "DS4BC7066FVT", cop: EXPECTED.authorityCop };
      });
    },
  },
  {
    id: "G5-RELEASE-SAFETY",
    title: "활성 Published Release와 View-first 경계",
    query: "/?view=release",
    run: async (page, log) => {
      let releaseIds;
      await assertion(log, "G5 Release ID·상태·해시", async () => {
        releaseIds = (await page.getByTestId("release-id").allInnerTexts()).map(
          (value) => value.trim(),
        );
        invariant(
          releaseIds.length >= 1 &&
            releaseIds.every((value) => value === EXPECTED.releaseId),
          `Release ID 불일치: ${releaseIds.join(", ")}`,
        );
        const statuses = (
          await page.getByTestId("release-status").allInnerTexts()
        ).map((value) => value.trim());
        invariant(
          statuses.length >= 1 && statuses.every((value) => value === "PUBLISHED"),
          `PUBLISHED 상태가 아닙니다: ${statuses.join(", ")}`,
        );
        const hashes = (
          await page.getByTestId("release-hash").allInnerTexts()
        ).map((value) => value.trim());
        invariant(
          hashes.some((value) => /^[0-9a-f]{64}$/.test(value)),
          `전체 Release SHA-256이 없습니다: ${hashes.join(", ")}`,
        );
        const appGitSha = (
          await page.getByTestId("app-git-sha").innerText()
        ).trim();
        invariant(
          /^[0-9a-f]{40}$/.test(appGitSha),
          `Application SHA가 40자리 Git SHA가 아닙니다: ${appGitSha}`,
        );
        return { releaseIds, statuses, fullHashPresent: true, appGitSha };
      });
      await assertion(log, "G5 View-only와 편집·발행 control 없음", async () => {
        await requireVisible(
          page.getByTestId("read-only-notice"),
          "View-first 운영 경계",
        );
        const forbidden = page
          .getByRole("button")
          .filter({ hasText: /저장|발행|publish|rollback|수정|편집/i });
        await requireHidden(forbidden, "편집·발행 버튼");
        return { forbiddenControls: 0 };
      });
      await assertion(log, "G5 새로고침 후 활성 Release 불변", async () => {
        await page.reload({ waitUntil: "domcontentloaded" });
        await requireVisible(page.getByTestId("app-shell"), "새로고침 후 앱");
        const after = (await page.getByTestId("release-id").allInnerTexts()).map(
          (value) => value.trim(),
        );
        invariant(
          after.length >= 1 && after.every((value) => value === EXPECTED.releaseId),
          `새로고침 후 Release가 변경됨: ${after.join(", ")}`,
        );
        return { before: releaseIds, after };
      });
    },
  },
  {
    id: "G7-B1-EXPANSION",
    title: "B1 Scroll p.92 검토 Batch와 비교 차단",
    query: "/?view=release",
    run: async (page, log) => {
      await assertion(log, "G7 B1 16행·8개 신규 후보", async () => {
        await requireVisible(page.getByTestId("expansion-batch"), "B1 확장 Batch");
        const total = (
          await page.getByTestId("expansion-total").innerText()
        ).trim();
        const newCandidates = (
          await page.getByTestId("expansion-new").innerText()
        ).trim();
        invariant(total === "16", `B1 원천 행이 16이 아닙니다: ${total}`);
        invariant(
          newCandidates === "8",
          `B1 신규 후보가 8이 아닙니다: ${newCandidates}`,
        );
        return { totalRows: 16, newCandidates: 8 };
      });
      await assertion(log, "G7 조건 UNKNOWN·Published 미반영", async () => {
        const unknown = (
          await page.getByTestId("expansion-unknown").innerText()
        ).trim();
        const batchText = await page.getByTestId("expansion-batch").innerText();
        invariant(
          unknown === "16",
          `B1 조건 UNKNOWN이 16이 아닙니다: ${unknown}`,
        );
        invariant(
          batchText.includes("비교 허용 0건"),
          "B1 비교 차단 문구가 없습니다.",
        );
        invariant(
          batchText.includes("NOT_PUBLISHED"),
          "B1 미발행 상태가 없습니다.",
        );
        return {
          conditionUnknown: 16,
          comparisonEligible: 0,
          publicationStatus: "NOT_PUBLISHED",
        };
      });
    },
  },
  {
    id: "G6-EVIDENCE-TRACE",
    title: "DS4BC7066FVT → Release → Samsung PDF p.92",
    query: `/?view=model&modelId=${encodeURIComponent(
      MODELS.authority,
    )}&evidence=1`,
    run: async (page, log) => {
      await assertion(log, "G6 Evidence chain", async () => {
        await requireVisible(page.getByTestId("evidence-panel"), "Evidence 패널");
        const modelId = (
          await page.getByTestId("evidence-model-id").innerText()
        ).trim();
        const releaseId = (
          await page.getByTestId("evidence-release-id").innerText()
        ).trim();
        const sourcePath = (
          await page.getByTestId("evidence-source-path").innerText()
        ).trim();
        const locator = (
          await page.getByTestId("evidence-locator").innerText()
        ).trim();
        invariant(modelId === MODELS.authority, `Evidence modelId 오류: ${modelId}`);
        invariant(
          releaseId === EXPECTED.releaseId,
          `Evidence releaseId 오류: ${releaseId}`,
        );
        invariant(
          sourcePath === EXPECTED.sourcePath,
          `Evidence sourcePath 오류: ${sourcePath}`,
        );
        invariant(
          locator === EXPECTED.authorityPage,
          `Evidence locator 오류: ${locator}`,
        );
        return { modelId, releaseId, sourcePath, locator };
      });
      await assertion(log, "G6 같은 origin 원천 PDF 200", async () => {
        const link = page.getByTestId("source-open");
        const href = await link.getAttribute("href");
        invariant(Boolean(href), "원천 PDF 링크가 없습니다.");
        const sourceUrl = new URL(href, page.url());
        invariant(
          sourceUrl.origin === BASE_ORIGIN,
          `원천 링크가 외부 origin입니다: ${sourceUrl}`,
        );
        invariant(
          sourceUrl.hash === "#page=92",
          `PDF page fragment가 92가 아닙니다: ${sourceUrl.hash}`,
        );
        const response = await page.request.get(
          `${sourceUrl.origin}${sourceUrl.pathname}`,
        );
        invariant(response.ok(), `원천 PDF 응답 실패: ${response.status()}`);
        invariant(
          (response.headers()["content-type"] || "").includes("application/pdf"),
          `원천 응답이 PDF가 아닙니다: ${response.headers()["content-type"]}`,
        );
        return {
          url: sourceUrl.toString(),
          status: response.status(),
          contentType: response.headers()["content-type"],
        };
      });
    },
  },
];

async function runViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "ko-KR",
    baseURL: BASE_URL,
  });
  const page = await context.newPage();
  const monitor = createMonitor(page);
  const result = {
    id: viewport.id,
    viewport: { width: viewport.width, height: viewport.height },
    status: "FAIL",
    scenarios: [],
    browserGates: null,
  };

  for (const scenario of SCENARIOS) {
    result.scenarios.push(
      await runScenario(page, monitor, viewport, scenario),
    );
  }

  result.browserGates = {
    externalRequests: monitor.externalRequests,
    consoleErrors: monitor.consoleErrors,
    pageErrors: monitor.pageErrors,
    requestFailures: monitor.requestFailures,
    badResponses: monitor.badResponses,
    forbiddenWrites: monitor.forbiddenWrites,
    requestCount: monitor.requests.length,
    status:
      monitor.externalRequests.length === 0 &&
      monitor.consoleErrors.length === 0 &&
      monitor.pageErrors.length === 0 &&
      monitor.requestFailures.length === 0 &&
      monitor.badResponses.length === 0 &&
      monitor.forbiddenWrites.length === 0
        ? "PASS"
        : "FAIL",
  };
  result.status =
    result.scenarios.every((scenario) => scenario.status === "PASS") &&
    result.browserGates.status === "PASS"
      ? "PASS"
      : "FAIL";

  await context.close();
  return result;
}

function writeResult(result) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const result = {
    schemaVersion: 1,
    phase: "P5",
    runId: RUN_ID,
    runStartedAt: new Date().toISOString(),
    runFinishedAt: null,
    baseUrl: BASE_URL,
    outputDir: relativePath(OUTPUT_DIR),
    resultPath: relativePath(RESULT_PATH),
    screenshotDir: relativePath(SCREENSHOT_DIR),
    browser: { name: "chromium", version: null },
    retries: 0,
    serverStartedByRunner: false,
    status: "FAIL",
    viewports: [],
    summary: {
      viewportCount: VIEWPORTS.length,
      scenarioCount: VIEWPORTS.length * SCENARIOS.length,
      passedScenarios: 0,
      failedScenarios: VIEWPORTS.length * SCENARIOS.length,
      screenshotCount: 0,
    },
  };

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(BROWSER_EXECUTABLE
        ? { executablePath: BROWSER_EXECUTABLE }
        : {}),
    });
    result.browser.version = browser.version();
    for (const viewport of VIEWPORTS) {
      result.viewports.push(await runViewport(browser, viewport));
    }
    result.summary.passedScenarios = result.viewports.reduce(
      (count, viewport) =>
        count +
        viewport.scenarios.filter((scenario) => scenario.status === "PASS")
          .length,
      0,
    );
    result.summary.failedScenarios =
      result.summary.scenarioCount - result.summary.passedScenarios;
    result.summary.screenshotCount = result.viewports.reduce(
      (count, viewport) =>
        count +
        viewport.scenarios.filter((scenario) =>
          scenario.assertions.some(
            (item) => item.name === "스크린샷 저장" && item.status === "PASS",
          ),
        ).length,
      0,
    );
    result.status = result.viewports.every(
      (viewport) => viewport.status === "PASS",
    )
      ? "PASS"
      : "FAIL";
  } catch (error) {
    result.fatalError = serializeError(error);
  } finally {
    if (browser) await browser.close();
    result.runFinishedAt = new Date().toISOString();
    writeResult(result);
  }

  console.log(`P5 E2E: ${result.status}`);
  console.log(
    `Scenarios: ${result.summary.passedScenarios}/${result.summary.scenarioCount} PASS`,
  );
  console.log(`Evidence: ${RESULT_PATH}`);
  if (result.status !== "PASS") process.exitCode = 1;
}

main();
