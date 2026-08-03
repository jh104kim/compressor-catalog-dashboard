"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..", "..");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8000/";
const BROWSER_EXECUTABLE = process.env.BROWSER_EXECUTABLE || null;
const OUTPUT_DIR = path.resolve(
  process.env.OUTPUT_DIR || path.join(ROOT, "qa", "baseline"),
);
const SCREENSHOT_DIR = process.env.OUTPUT_DIR
  ? path.join(OUTPUT_DIR, "screenshots")
  : path.join(ROOT, "qa", "evidence", "p0");
const RESULT_PATH = path.join(OUTPUT_DIR, "browser-characterization.json");

const VIEWPORTS = [
  { id: "desktop-1440x1024", width: 1440, height: 1024 },
  { id: "mobile-390x844", width: 390, height: 844 },
];

const TABS = [
  {
    id: "kpi",
    buttonName: "KPI 현황",
    heading: "Samsung 압축기 포트폴리오 현황",
  },
  {
    id: "decision",
    buttonName: "Decision 전략",
    heading: "지금, 무엇을 결정해야 하는가",
  },
  {
    id: "analysis",
    buttonName: "모델 분석",
    heading: "모델 분석",
  },
  {
    id: "reporting",
    buttonName: "Reporting",
    heading: "모델별 경쟁 비교 리포트",
  },
  {
    id: "backlog",
    buttonName: "보완 과제",
    heading: "데이터 보완 과제",
  },
];

function toRelative(filePath) {
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

function isExternalUrl(resourceUrl, pageOrigin) {
  try {
    const parsed = new URL(resourceUrl);
    return (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.origin !== pageOrigin
    );
  } catch {
    return false;
  }
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
  await locator.first().waitFor({ state: "visible", timeout: 10_000 });
  invariant(await anyVisible(locator), `${label}이(가) 보이지 않습니다.`);
}

async function runAssertion(name, action) {
  try {
    const details = await action();
    return {
      name,
      status: "PASS",
      details: details === undefined ? null : details,
    };
  } catch (error) {
    return {
      name,
      status: "FAIL",
      details: null,
      error: serializeError(error),
    };
  }
}

async function kpiAssertions(page) {
  const main = page.locator("main");
  const cardText = async (label) => {
    const card = main
      .locator(".dc-tiles > div")
      .filter({ hasText: label })
      .first();
    await requireVisible(card, `KPI 카드 '${label}'`);
    await requireVisible(
      card.getByText(label, { exact: true }),
      `KPI 카드 레이블 '${label}'`,
    );
    return (await card.innerText()).replace(/\s+/g, " ").trim();
  };

  return [
    await runAssertion("KPI Samsung 27 / 경쟁사 49", async () => {
      const text = await cardText("추적 모델 (Samsung)");
      invariant(/\b27\s*개/.test(text), `Samsung 27개가 아닙니다: ${text}`);
      invariant(
        text.includes("+49 경쟁사 비교"),
        `경쟁사 49개가 아닙니다: ${text}`,
      );
      return { renderedText: text };
    }),
    await runAssertion("KPI 최고 COP 3.43", async () => {
      const text = await cardText("최고 COP");
      invariant(/\b3\.43\b/.test(text), `최고 COP 3.43이 아닙니다: ${text}`);
      return { renderedText: text };
    }),
    await runAssertion("KPI P1 긴급 공백 1건", async () => {
      const text = await cardText("P1 긴급 공백");
      invariant(/\b1\s*건/.test(text), `P1 공백 1건이 아닙니다: ${text}`);
      invariant(text.includes("R290 왕복동"), `R290 Re 공백이 아닙니다: ${text}`);
      return { renderedText: text };
    }),
  ];
}

async function decisionAssertions(page) {
  const main = page.locator("main");
  return [
    await runAssertion("Decision R290 Re 공백", async () => {
      await requireVisible(
        main.getByText("R290 왕복동", { exact: true }),
        "R290 왕복동 공백",
      );
      return { gap: "R290 왕복동" };
    }),
    await runAssertion("Decision P1~P6 로드맵", async () => {
      const visiblePriorities = [];
      for (let rank = 1; rank <= 6; rank += 1) {
        const label = `P${rank}`;
        await requireVisible(
          main.getByText(label, { exact: true }),
          `우선순위 ${label}`,
        );
        visiblePriorities.push(label);
      }
      return { visiblePriorities };
    }),
    await runAssertion("Decision Samsung 최신 동향", async () => {
      await requireVisible(
        main.getByRole("heading", {
          name: "Samsung 최신 동향",
          exact: true,
        }),
        "Samsung 최신 동향",
      );
      return { heading: "Samsung 최신 동향" };
    }),
  ];
}

async function analysisAssertions(page) {
  const main = page.locator("main");
  const filterPanel = main.getByText("분석 필터", { exact: true }).locator("..");
  const assertions = [];

  assertions.push(
    await runAssertion("모델 분석 유형 필터 Sc", async () => {
      const scButton = filterPanel.getByRole("button", {
        name: "Sc",
        exact: true,
      });
      await requireVisible(scButton, "Sc 유형 필터");
      await scButton.click();
      await requireVisible(
        filterPanel.getByRole("button", { name: /DS2GR7046FVT/ }),
        "Sc Samsung 모델",
      );
      invariant(
        !(await anyVisible(
          filterPanel.getByRole("button", { name: /ENV4A5DL2B/ }),
        )),
        "Sc 필터 후 Re 모델이 남아 있습니다.",
      );
      return { selectedType: "Sc", firstVisibleModel: "DS2GR7046FVT" };
    }),
  );

  assertions.push(
    await runAssertion("모델 분석 측정조건 필터 DOE-B", async () => {
      const conditionButton = filterPanel.getByRole("button", {
        name: "DOE-B",
        exact: true,
      });
      await requireVisible(conditionButton, "DOE-B 조건 필터");
      await conditionButton.click();
      await requireVisible(
        filterPanel.getByRole("button", { name: /DS8LC5040IN/ }),
        "DOE-B Samsung 기준 모델",
      );
      await requireVisible(
        filterPanel.getByRole("button", { name: /DS8LC5049IN/ }),
        "DOE-B Samsung 선택 모델",
      );
      invariant(
        !(await anyVisible(
          filterPanel.getByRole("button", { name: /DS4BC7066FVT/ }),
        )),
        "DOE-B 필터 후 ARI 모델이 남아 있습니다.",
      );
      return {
        selectedCondition: "DOE-B",
        visibleModels: ["DS8LC5040IN", "DS8LC5049IN"],
      };
    }),
  );

  assertions.push(
    await runAssertion("Samsung 모델 선택 후 TOP 5 갱신", async () => {
      const modelButton = filterPanel.getByRole("button", {
        name: /DS8LC5049IN/,
      });
      await requireVisible(modelButton, "Samsung DS8LC5049IN 선택 버튼");
      await modelButton.click();
      await requireVisible(
        main.getByRole("heading", { name: "DS8LC5049IN", exact: true }),
        "선택 모델 DS8LC5049IN",
      );
      await requireVisible(
        main.getByRole("heading", {
          name: "유사 경쟁 모델 TOP 5",
          exact: true,
        }),
        "유사 경쟁 모델 TOP 5",
      );
      await requireVisible(
        main.getByText("STDC049N1ULB", { exact: true }),
        "갱신된 경쟁 모델 STDC049N1ULB",
      );
      await requireVisible(
        main.getByText(/선택한 DS8LC5049IN은/),
        "DS8LC5049IN 자동 분석 요약",
      );
      return {
        selectedModel: "DS8LC5049IN",
        refreshedCompetitor: "STDC049N1ULB",
      };
    }),
  );

  return assertions;
}

async function reportingAssertions(page) {
  const main = page.locator("main");
  const lowReliabilityWarning = main.getByText(
    "신뢰도 낮음 — 직접 순위 비교 부적절",
    { exact: true },
  );
  const assertions = [];

  assertions.push(
    await runAssertion("Reporting R454B Sc Fixed DOE-B 동일조건군", async () => {
      const groupButton = main.getByRole("button", {
        name: /R454B 스크롤 · Fixed · DOE-B/,
      });
      await requireVisible(groupButton, "R454B Sc Fixed DOE-B 비교군");
      await groupButton.click();
      await requireVisible(
        main.getByRole("heading", {
          name: "R454B 스크롤 · Fixed · DOE-B",
          exact: true,
        }),
        "R454B Sc Fixed DOE-B 선택 결과",
      );
      await requireVisible(
        main.getByText("조건: DOE-B", { exact: true }),
        "DOE-B 조건 배지",
      );
      await requireVisible(
        main.getByText("DS8LC5040IN", { exact: true }),
        "Samsung DOE-B 기준 모델",
      );
      await requireVisible(
        main.getByText("STDA029N1ULB", { exact: true }),
        "GMCC DOE-B 경쟁 모델",
      );
      invariant(
        !(await anyVisible(lowReliabilityWarning)),
        "동일조건 DOE-B 군에 저신뢰 경고가 표시됩니다.",
      );
      return {
        group: "r454b-sc-fix-doeb",
        condition: "DOE-B",
        samsungReference: "DS8LC5040IN",
      };
    }),
  );

  assertions.push(
    await runAssertion("Reporting R32 Ro ARI 직접 비교군", async () => {
      const groupButton = main.getByRole("button", {
        name: /R32 로터리 · Variable · ARI/,
      });
      await requireVisible(groupButton, "R32 Ro Variable ARI 비교군");
      await groupButton.click();
      await requireVisible(
        main.getByRole("heading", {
          name: "R32 로터리 · Variable · ARI",
          exact: true,
        }),
        "R32 Ro 선택 결과",
      );
      await requireVisible(
        main.getByText("9RL160Z", { exact: true }),
        "Panasonic R32 ARI 경쟁 모델",
      );
      invariant(
        !(await anyVisible(main.getByText("ATQ360D1UMU", { exact: true }))),
        "SEER60 모델이 ARI 직접 비교군에 포함되었습니다.",
      );
      invariant(
        !(await anyVisible(lowReliabilityWarning)),
        "동일조건 R32 ARI 군에 저신뢰 경고가 표시됩니다.",
      );
      await requireVisible(
        main.getByText(/Samsung UB와 Panasonic 9RL 공식 ARI 비교군/),
        "R32 Ro 동일조건 설명",
      );
      return {
        group: "r32-ro-var",
        condition: "ARI",
        competitor: "9RL160Z",
      };
    }),
  );

  return assertions;
}

async function backlogAssertions(page) {
  const main = page.locator("main");
  return [
    await runAssertion("Backlog 진행률 수치와 막대 일치", async () => {
      const progressText = main.getByText(/^진행률 \d+% \(\d+\/\d+ 부분 확인됨\)$/);
      await requireVisible(progressText, "Backlog 진행률");
      const renderedText = (await progressText.first().innerText()).trim();
      const match = renderedText.match(
        /^진행률 (\d+)% \((\d+)\/(\d+) 부분 확인됨\)$/,
      );
      invariant(match, `진행률 형식이 잘못되었습니다: ${renderedText}`);
      const percent = Number(match[1]);
      const done = Number(match[2]);
      const total = Number(match[3]);
      invariant(total > 0 && done <= total, `진행률 분수가 잘못되었습니다: ${renderedText}`);
      invariant(
        percent === Math.round((done / total) * 100),
        `진행률 계산이 일치하지 않습니다: ${renderedText}`,
      );
      const bar = progressText.locator("xpath=preceding-sibling::div[1]/div");
      const renderedWidth = await bar.getAttribute("style");
      invariant(
        renderedWidth && renderedWidth.includes(`width: ${percent}%`),
        `진행률 막대가 ${percent}%와 일치하지 않습니다: ${renderedWidth}`,
      );
      return { percent, done, total };
    }),
    await runAssertion("Backlog 외부 출처 링크", async () => {
      const links = main.locator('a[target="_blank"][href^="https://"]');
      const count = await links.count();
      invariant(count > 0, "Backlog 외부 출처 링크가 없습니다.");
      const hrefs = [];
      for (let index = 0; index < count; index += 1) {
        const link = links.nth(index);
        invariant(await link.isVisible(), `외부 링크 ${index + 1}이 보이지 않습니다.`);
        const href = await link.getAttribute("href");
        const target = await link.getAttribute("target");
        const rel = (await link.getAttribute("rel")) || "";
        const parsed = new URL(href);
        invariant(parsed.protocol === "https:", `HTTPS 링크가 아닙니다: ${href}`);
        invariant(Boolean(parsed.hostname), `호스트가 없는 링크입니다: ${href}`);
        invariant(target === "_blank", `새 탭 링크가 아닙니다: ${href}`);
        invariant(
          rel.split(/\s+/).includes("noopener"),
          `noopener가 없는 외부 링크입니다: ${href}`,
        );
        hrefs.push(href);
      }
      return { count, firstHref: hrefs[0] };
    }),
  ];
}

async function runTabAssertions(page, tabId) {
  if (tabId === "kpi") return kpiAssertions(page);
  if (tabId === "decision") return decisionAssertions(page);
  if (tabId === "analysis") return analysisAssertions(page);
  if (tabId === "reporting") return reportingAssertions(page);
  if (tabId === "backlog") return backlogAssertions(page);
  return [];
}

async function searchDrilldownAssertions(page) {
  const main = page.locator("main");
  const searchInput = page.getByPlaceholder("모델 · 냉매 · 제조사 검색", {
    exact: true,
  });
  const assertions = [];

  assertions.push(
    await runAssertion("헤더 검색 DS4BC7066FVT 결과", async () => {
      await requireVisible(searchInput, "헤더 모델 검색 입력");
      await searchInput.fill("DS4BC7066FVT");
      await requireVisible(
        page.getByText("1개 결과 — 클릭하면 리포트가 열립니다", {
          exact: true,
        }),
        "검색 결과 개수",
      );
      const resultButton = page.getByRole("button", {
        name: /Samsung DS4BC7066FVT/,
      });
      await requireVisible(resultButton, "DS4BC7066FVT 검색 결과");
      return { query: "DS4BC7066FVT", resultCount: 1 };
    }),
  );

  assertions.push(
    await runAssertion("검색 모델 선택 후 Reporting 드릴다운", async () => {
      const resultButton = page.getByRole("button", {
        name: /Samsung DS4BC7066FVT/,
      });
      await requireVisible(resultButton, "DS4BC7066FVT 검색 결과 선택");
      await resultButton.click();
      await requireVisible(
        main.getByRole("heading", {
          name: "모델별 경쟁 비교 리포트",
          exact: true,
        }),
        "검색 후 Reporting 화면",
      );
      await requireVisible(
        main.getByText("모델 리포트", { exact: true }),
        "Reporting 모델 리포트 카드",
      );
      await requireVisible(
        main.getByText("Samsung DS4BC7066FVT", { exact: true }),
        "DS4BC7066FVT 드릴다운",
      );
      invariant(
        (await searchInput.inputValue()) === "",
        "검색 결과 선택 후 검색어가 초기화되지 않았습니다.",
      );
      return {
        destination: "reporting",
        drilldownModel: "DS4BC7066FVT",
      };
    }),
  );

  return assertions;
}

async function inspectPage(page, selectedHeading) {
  return page.evaluate(
    ({ allHeadings, expectedHeading }) => {
      const documentElement = document.documentElement;
      const body = document.body;
      const visible = (element) => {
        if (!element) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) !== 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      };

      const headingStates = allHeadings.map((heading) => {
        const elements = Array.from(document.querySelectorAll("h1")).filter(
          (element) => element.textContent.trim() === heading,
        );
        return {
          heading,
          visibleCount: elements.filter(visible).length,
        };
      });

      const bodyText = body ? body.innerText : "";
      const unresolvedMatches = bodyText.match(/\{\{[^{}\n]+\}\}/g) || [];
      const documentScrollWidth = Math.ceil(documentElement.scrollWidth);
      const documentClientWidth = Math.ceil(documentElement.clientWidth);
      const bodyScrollWidth = body ? Math.ceil(body.scrollWidth) : 0;
      const bodyClientWidth = body ? Math.ceil(body.clientWidth) : 0;
      const overflowPixels = Math.max(
        0,
        documentScrollWidth - documentClientWidth,
        bodyScrollWidth - bodyClientWidth,
      );
      const overflowingElements = Array.from(
        document.querySelectorAll("body *"),
      )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className:
              typeof element.className === "string" ? element.className : "",
            text: (element.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          };
        })
        .filter(
          (item) =>
            item.width > 0 &&
            (item.right > documentClientWidth + 1 || item.left < -1),
        )
        .slice(0, 30);

      return {
        selectedHeading: expectedHeading,
        headingStates,
        selectedHeadingVisible:
          headingStates.find((item) => item.heading === expectedHeading)
            ?.visibleCount === 1,
        onlySelectedHeadingVisible: headingStates.every((item) =>
          item.heading === expectedHeading
            ? item.visibleCount === 1
            : item.visibleCount === 0,
        ),
        unresolvedBindings: [...new Set(unresolvedMatches)].slice(0, 20),
        overflow: {
          documentScrollWidth,
          documentClientWidth,
          bodyScrollWidth,
          bodyClientWidth,
          overflowPixels,
          hasHorizontalOverflow: overflowPixels > 1,
          overflowingElements,
        },
      };
    },
    {
      allHeadings: TABS.map((tab) => tab.heading),
      expectedHeading: selectedHeading,
    },
  );
}

async function characterizeViewport(browser, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "ko-KR",
  });
  const page = await context.newPage();
  const pageOrigin = new URL(BASE_URL).origin;
  const consoleErrors = [];
  const pageErrors = [];
  const networkFailures = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    consoleErrors.push({
      text: message.text(),
      location: message.location(),
    });
  });

  page.on("pageerror", (error) => {
    pageErrors.push(serializeError(error));
  });

  page.on("requestfailed", (request) => {
    networkFailures.push({
      kind: "requestfailed",
      url: request.url(),
      resourceType: request.resourceType(),
      errorText: request.failure()?.errorText || "unknown request failure",
      external: isExternalUrl(request.url(), pageOrigin),
    });
  });

  page.on("response", (response) => {
    if (response.status() < 400) return;
    networkFailures.push({
      kind: "http-error",
      url: response.url(),
      resourceType: response.request().resourceType(),
      status: response.status(),
      statusText: response.statusText(),
      external: isExternalUrl(response.url(), pageOrigin),
    });
  });

  const result = {
    id: viewport.id,
    viewport: { width: viewport.width, height: viewport.height },
    status: "FAIL",
    navigation: null,
    tabs: [],
    workflows: [],
    errors: {
      console: consoleErrors,
      page: pageErrors,
      network: networkFailures,
      externalCdn: [],
    },
  };

  try {
    const response = await page.goto(BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    result.navigation = {
      requestedUrl: BASE_URL,
      finalUrl: page.url(),
      status: response ? response.status() : null,
      ok: response ? response.ok() : false,
    };
  } catch (error) {
    result.navigation = {
      requestedUrl: BASE_URL,
      finalUrl: page.url(),
      status: null,
      ok: false,
      error: serializeError(error),
    };
  }

  try {
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
  } catch (error) {
    pageErrors.push({
      name: "NetworkIdleTimeout",
      message: serializeError(error).message,
      stack: null,
    });
  }

  for (const tab of TABS) {
    const errorOffsets = {
      console: consoleErrors.length,
      page: pageErrors.length,
      network: networkFailures.length,
    };
    const screenshotPath = path.join(
      SCREENSHOT_DIR,
      `${viewport.id}-${tab.id}.png`,
    );
    const tabResult = {
      id: tab.id,
      label: tab.buttonName,
      expectedHeading: tab.heading,
      status: "FAIL",
      screenshot: toRelative(screenshotPath),
      checks: {
        buttonClicked: false,
        selectedHeadingVisible: false,
        onlySelectedHeadingVisible: false,
        noHorizontalOverflow: false,
        noUnresolvedBindings: false,
        noConsoleErrors: false,
        noPageErrors: false,
        noNetworkFailures: false,
        screenshotSaved: false,
        domainAssertions: false,
      },
      state: null,
      assertions: [],
      errors: {
        interaction: [],
        console: [],
        page: [],
        network: [],
      },
    };

    try {
      const button = page.getByRole("button", {
        name: tab.buttonName,
        exact: false,
      });
      await button.waitFor({ state: "visible", timeout: 10_000 });
      await button.click();
      tabResult.checks.buttonClicked = true;

      const heading = page.getByRole("heading", {
        name: tab.heading,
        exact: true,
      });
      await heading.waitFor({ state: "visible", timeout: 10_000 });
      await page.waitForTimeout(250);
      tabResult.state = await inspectPage(page, tab.heading);
      tabResult.checks.selectedHeadingVisible =
        tabResult.state.selectedHeadingVisible;
      tabResult.checks.onlySelectedHeadingVisible =
        tabResult.state.onlySelectedHeadingVisible;
      tabResult.checks.noHorizontalOverflow =
        !tabResult.state.overflow.hasHorizontalOverflow;
      tabResult.checks.noUnresolvedBindings =
        tabResult.state.unresolvedBindings.length === 0;
    } catch (error) {
      tabResult.errors.interaction.push(serializeError(error));
    }

    if (tabResult.checks.buttonClicked) {
      tabResult.assertions = await runTabAssertions(page, tab.id);
    }
    tabResult.checks.domainAssertions =
      tabResult.assertions.length > 0 &&
      tabResult.assertions.every((assertion) => assertion.status === "PASS");

    try {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      tabResult.checks.screenshotSaved = true;
    } catch (error) {
      tabResult.errors.interaction.push({
        name: "ScreenshotError",
        message: serializeError(error).message,
        stack: serializeError(error).stack,
      });
    }

    tabResult.errors.console = consoleErrors.slice(errorOffsets.console);
    tabResult.errors.page = pageErrors.slice(errorOffsets.page);
    tabResult.errors.network = networkFailures.slice(errorOffsets.network);
    tabResult.checks.noConsoleErrors = tabResult.errors.console.length === 0;
    tabResult.checks.noPageErrors = tabResult.errors.page.length === 0;
    tabResult.checks.noNetworkFailures =
      tabResult.errors.network.length === 0;
    tabResult.status = Object.values(tabResult.checks).every(Boolean)
      ? "PASS"
      : "FAIL";
    result.tabs.push(tabResult);
  }

  const searchWorkflowAssertions = await searchDrilldownAssertions(page);
  result.workflows.push({
    id: "header-search-reporting-drilldown",
    status: searchWorkflowAssertions.every(
      (assertion) => assertion.status === "PASS",
    )
      ? "PASS"
      : "FAIL",
    assertions: searchWorkflowAssertions,
  });

  result.errors.externalCdn = networkFailures.filter(
    (failure) => failure.external,
  );
  result.status =
    result.navigation?.ok === true &&
    result.tabs.length === TABS.length &&
    result.tabs.every((tab) => tab.status === "PASS") &&
    result.workflows.every((workflow) => workflow.status === "PASS") &&
    consoleErrors.length === 0 &&
    pageErrors.length === 0 &&
    networkFailures.length === 0
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
  const runStartedAt = new Date().toISOString();
  const result = {
    schemaVersion: 1,
    runStartedAt,
    runFinishedAt: null,
    baseUrl: BASE_URL,
    outputDir: toRelative(OUTPUT_DIR),
    screenshotDir: toRelative(SCREENSHOT_DIR),
    status: "FAIL",
    viewports: [],
    summary: {
      viewportCount: VIEWPORTS.length,
      tabCount: VIEWPORTS.length * TABS.length,
      passedTabs: 0,
      failedTabs: VIEWPORTS.length * TABS.length,
      workflowCount: VIEWPORTS.length,
      passedWorkflows: 0,
      failedWorkflows: VIEWPORTS.length,
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
    for (const viewport of VIEWPORTS) {
      result.viewports.push(await characterizeViewport(browser, viewport));
    }

    result.summary.passedTabs = result.viewports.reduce(
      (count, viewport) =>
        count + viewport.tabs.filter((tab) => tab.status === "PASS").length,
      0,
    );
    result.summary.failedTabs =
      result.summary.tabCount - result.summary.passedTabs;
    result.summary.passedWorkflows = result.viewports.reduce(
      (count, viewport) =>
        count +
        viewport.workflows.filter((workflow) => workflow.status === "PASS")
          .length,
      0,
    );
    result.summary.failedWorkflows =
      result.summary.workflowCount - result.summary.passedWorkflows;
    result.status = result.viewports.every(
      (viewport) => viewport.status === "PASS",
    )
      ? "PASS"
      : "FAIL";
  } catch (error) {
    result.fatalError = serializeError(error);
    result.status = "FAIL";
  } finally {
    if (browser) await browser.close();
    result.runFinishedAt = new Date().toISOString();
    writeResult(result);
  }

  console.log(`P0 browser characterization: ${result.status}`);
  console.log(`Result: ${RESULT_PATH}`);
  if (result.status !== "PASS") process.exitCode = 1;
}

main();
