const CONDITION_FACTORS_TO_ARI = {
  ARI: 1,
  "DOE-A": 0.84,
  "DOE-B": 0.63,
};
const METRICS = ["capacityW", "inputW", "cop", "eer"];
const COMPARISON_KEYS = ["type", "refrigerant", "condition", "driveClass"];

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value) {
  return isNumber(value) && value > 0;
}

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function capacityW(model) {
  const specs = model.specs ?? {};
  if (isPositiveNumber(specs.capacityW)) return specs.capacityW;
  if (isPositiveNumber(specs.capacityBtuH)) return specs.capacityBtuH / 3.412;
  return null;
}

function comparisonResult(baseline, candidate, metric, values) {
  return {
    verdict: values.verdict,
    code: values.code,
    reason: values.reason,
    baselineModelId: String(baseline.modelId ?? ""),
    candidateModelId: String(candidate.modelId ?? ""),
    metric,
    capacityDiffPct: values.capacityDiffPct ?? null,
    deltaPct: values.deltaPct ?? null,
    rankingAllowed: values.rankingAllowed ?? false,
    normalizedBaselineMetric: values.normalizedBaselineMetric ?? null,
    normalizedCandidateMetric: values.normalizedCandidateMetric ?? null,
  };
}

export function compareModels(
  baseline,
  candidate,
  { metric = "cop", capacityTolerancePct = 15 } = {},
) {
  if (baseline.type !== candidate.type) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_TYPE_MISMATCH",
      reason: "압축기 유형이 달라 직접 비교할 수 없습니다.",
    });
  }
  if (baseline.refrigerant !== candidate.refrigerant) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_REFRIGERANT_MISMATCH",
      reason: "냉매가 달라 직접 비교할 수 없습니다.",
    });
  }

  const baselineCondition = baseline.condition;
  const candidateCondition = candidate.condition;
  if (baselineCondition === "UNKNOWN" || candidateCondition === "UNKNOWN") {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_CONDITION_UNKNOWN",
      reason: "측정조건이 확인되지 않아 비교를 차단했습니다.",
    });
  }
  if (
    (baselineCondition === "HP-heating") !==
    (candidateCondition === "HP-heating")
  ) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_HEATING_COOLING_MISMATCH",
      reason: "난방 조건과 냉방 조건을 직접 비교할 수 없습니다.",
    });
  }

  const baselineMetric = baseline.specs?.[metric];
  const candidateMetric = candidate.specs?.[metric];
  if (!isPositiveNumber(baselineMetric) || !isPositiveNumber(candidateMetric)) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_METRIC_MISSING",
      reason: `${metric} 지표가 누락되어 비교를 차단했습니다.`,
    });
  }

  if (baselineCondition !== candidateCondition) {
    const baselineFactor = CONDITION_FACTORS_TO_ARI[baselineCondition];
    const candidateFactor = CONDITION_FACTORS_TO_ARI[candidateCondition];
    if (baselineFactor !== undefined && candidateFactor !== undefined) {
      return comparisonResult(baseline, candidate, metric, {
        verdict: "REFERENCE",
        code: "REFERENCE_NORMALIZED_CONDITION",
        reason: "측정조건 환산값은 참고용이며 순위에 사용하지 않습니다.",
        normalizedBaselineMetric: round6(baselineMetric * baselineFactor),
        normalizedCandidateMetric: round6(candidateMetric * candidateFactor),
      });
    }
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_CONDITION_MISMATCH",
      reason: "측정조건이 다르고 안전한 환산계수가 없어 비교를 차단했습니다.",
    });
  }

  if (baseline.driveClass !== candidate.driveClass) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "REFERENCE",
      code: "REFERENCE_DRIVE_MISMATCH",
      reason: "구동 분류가 달라 참고 모델로만 표시합니다.",
    });
  }

  const baselineCapacity = capacityW(baseline);
  const candidateCapacity = capacityW(candidate);
  if (baselineCapacity === null || candidateCapacity === null) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "BLOCKED",
      code: "BLOCKED_METRIC_MISSING",
      reason: "용량 지표가 누락되어 유사도를 판정할 수 없습니다.",
    });
  }

  const capacityDiffPct =
    (Math.abs(candidateCapacity - baselineCapacity) / baselineCapacity) * 100;
  if (capacityDiffPct > capacityTolerancePct + 1e-12) {
    return comparisonResult(baseline, candidate, metric, {
      verdict: "REFERENCE",
      code: "REFERENCE_CAPACITY_OUTSIDE_15PCT",
      reason: `용량 차이 ${capacityDiffPct.toFixed(2)}%가 허용범위 ±${capacityTolerancePct.toFixed(0)}%를 초과합니다.`,
      capacityDiffPct,
    });
  }

  const deltaPct = ((candidateMetric - baselineMetric) / baselineMetric) * 100;
  return comparisonResult(baseline, candidate, metric, {
    verdict: "DIRECT",
    code: "DIRECT_OK",
    reason: "동일 비교 키이며 용량 차이가 허용범위 안입니다.",
    capacityDiffPct,
    deltaPct,
    rankingAllowed: true,
  });
}

function evidenceRef(model) {
  const evidence = model.evidence ?? {};
  return {
    modelId: String(model.modelId ?? ""),
    manufacturer: String(model.manufacturer ?? ""),
    model: String(model.model ?? ""),
    sourcePath: String(evidence.sourcePath ?? ""),
    authority: String(evidence.authority ?? "unknown"),
    confidence: String(model.confidence ?? "Unknown"),
    locator: evidence.locator ?? {},
    fieldPaths: evidence.fieldPaths ?? [],
  };
}

function evidenceConfidence(baseline, candidate) {
  const authorityLevels = { official: 3, research: 2, secondary: 1 };
  const confidenceLevels = { High: 3, Medium: 2, Low: 1, Unknown: 0 };
  const levelNames = ["Unknown", "Low", "Medium", "High"];
  const baselineAuthority = String(baseline.evidence?.authority ?? "unknown");
  const candidateAuthority = String(candidate.evidence?.authority ?? "unknown");
  const baselineConfidence = String(baseline.confidence ?? "Unknown");
  const candidateConfidence = String(candidate.confidence ?? "Unknown");
  const weakest = Math.min(
    authorityLevels[baselineAuthority] ?? 0,
    authorityLevels[candidateAuthority] ?? 0,
    confidenceLevels[baselineConfidence] ?? 0,
    confidenceLevels[candidateConfidence] ?? 0,
  );
  return {
    level: levelNames[weakest],
    basis: "두 모델의 authority와 confidence 중 가장 낮은 수준",
    baselineAuthority,
    candidateAuthority,
    baselineConfidence,
    candidateConfidence,
  };
}

function directPerformance(baseline, candidate, comparison) {
  const metric = comparison.metric;
  const baselineValue = baseline.specs?.[metric] ?? null;
  const candidateValue = candidate.specs?.[metric] ?? null;
  const deltaPct = comparison.deltaPct;
  const baselineName = String(baseline.manufacturer ?? "기준 모델");
  const candidateName = String(candidate.manufacturer ?? "경쟁 모델");
  let direction;
  let summary;
  if (deltaPct === null) {
    direction = "NOT_ASSESSED";
    summary = comparison.reason;
  } else if (deltaPct < 0) {
    direction = "BASELINE_HIGHER";
    summary = `${candidateName} ${metric.toUpperCase()}은 ${baselineName} 대비 ${Math.abs(deltaPct).toFixed(2)}% 낮습니다.`;
  } else if (deltaPct > 0) {
    direction = "CANDIDATE_HIGHER";
    summary = `${candidateName} ${metric.toUpperCase()}은 ${baselineName} 대비 ${Math.abs(deltaPct).toFixed(2)}% 높습니다.`;
  } else {
    direction = "EQUAL";
    summary = `두 모델의 ${metric.toUpperCase()} 값이 같습니다.`;
  }
  return {
    allowed: true,
    metric,
    baselineValue,
    candidateValue,
    capacityDiffPct: comparison.capacityDiffPct,
    deltaPct,
    direction,
    summary,
  };
}

export function buildComparisonAnalysis(
  baseline,
  candidate,
  comparison,
  releaseId,
) {
  const isDirect = comparison.verdict === "DIRECT" && comparison.rankingAllowed;
  let conditionSafety;
  let performanceInterpretation;
  let portfolioImplications;
  let recommendedActions;
  let executiveSummary;
  if (isDirect) {
    conditionSafety = {
      status: "DIRECT_SAFE",
      summary:
        "유형·냉매·측정조건·구동 분류가 같고 용량 차이가 허용범위 안입니다.",
    };
    performanceInterpretation = directPerformance(
      baseline,
      candidate,
      comparison,
    );
    portfolioImplications = [
      `${baseline.type} · ${baseline.refrigerant} · ${baseline.condition} · ${baseline.driveClass} 비교군에서 직접 비교할 수 있습니다.`,
      "이 결과는 선택한 지표와 현재 Published Release 범위에 한정됩니다.",
    ];
    recommendedActions = [
      "양쪽 제조사의 최신 공식 데이터시트에서 동일 조건 값을 재확인합니다.",
      "제품 적용 전 운전범위와 시스템 레벨 시험 결과를 함께 검토합니다.",
    ];
    executiveSummary = `${conditionSafety.summary} ${performanceInterpretation.summary}`;
  } else {
    conditionSafety = {
      status:
        comparison.verdict === "REFERENCE"
          ? "REFERENCE_ONLY"
          : "COMPARISON_BLOCKED",
      summary: comparison.reason,
    };
    performanceInterpretation = {
      allowed: false,
      metric: comparison.metric,
      baselineValue: null,
      candidateValue: null,
      capacityDiffPct: null,
      deltaPct: null,
      direction: "NOT_ASSESSED",
      summary: comparison.reason,
    };
    portfolioImplications = [
      "현재 공개 데이터만으로 직접 성능 판단을 만들지 않습니다.",
      "동일 비교 키의 공식 자료가 확보되면 다시 판정해야 합니다.",
    ];
    recommendedActions = [
      "동일 유형·냉매·측정조건·구동 분류의 공식 성능표를 확보합니다.",
      "용량과 선택 지표가 함께 표기된 원문 Evidence를 검증합니다.",
    ];
    executiveSummary = `${comparison.reason} 직접 수치 해석은 생성하지 않았습니다.`;
  }
  return {
    releaseId,
    baselineModelId: String(baseline.modelId ?? ""),
    candidateModelId: String(candidate.modelId ?? ""),
    metric: comparison.metric,
    executiveSummary,
    conditionSafety,
    performanceInterpretation,
    evidenceConfidence: evidenceConfidence(baseline, candidate),
    portfolioImplications,
    recommendedActions,
    limitations: [
      "카탈로그 성능값만으로 비용 절감, 수명, 소음, 품질을 판단하지 않습니다.",
      "현재 Published Release 이후 변경된 제조사 자료는 별도 갱신이 필요합니다.",
    ],
    evidenceRefs: [evidenceRef(baseline), evidenceRef(candidate)],
  };
}

function hasEvidence(point) {
  const evidence = point?.evidence;
  return Boolean(
    evidence &&
      typeof evidence === "object" &&
      evidence.evidenceId &&
      evidence.sourcePath &&
      evidence.authority &&
      evidence.locator &&
      typeof evidence.locator === "object" &&
      Array.isArray(evidence.fieldPaths) &&
      evidence.fieldPaths.length,
  );
}

function normalizeSpeed(speedValue, speedUnit) {
  if (!isPositiveNumber(speedValue) || !["rpm", "rps"].includes(speedUnit)) {
    return null;
  }
  return speedUnit === "rpm"
    ? { rpm: speedValue, rps: speedValue / 60 }
    : { rpm: speedValue * 60, rps: speedValue };
}

function normalizedPoints(model) {
  if (!Array.isArray(model.performanceMaps)) return [];
  const points = [];
  for (const performanceMap of model.performanceMaps) {
    if (
      !performanceMap ||
      typeof performanceMap !== "object" ||
      performanceMap.condition !== model.condition
    ) {
      continue;
    }
    for (const point of performanceMap.points ?? []) {
      const speed = normalizeSpeed(point?.speedValue, point?.speedUnit);
      if (!point || typeof point !== "object" || !hasEvidence(point) || !speed) {
        continue;
      }
      const values = Object.fromEntries(
        METRICS.map((metric) => [
          metric,
          isNumber(point[metric]) ? point[metric] : null,
        ]),
      );
      if (Object.values(values).every((value) => value === null)) continue;
      points.push({
        speedValue: point.speedValue,
        speedUnit: point.speedUnit,
        ...speed,
        ...values,
        valueKind: point.valueKind ?? "MEASURED",
        evidence: point.evidence,
      });
    }
  }
  return points.sort((left, right) => left.rpm - right.rpm);
}

function speedSeries(role, model) {
  const points = normalizedPoints(model);
  return {
    role,
    modelId: String(model.modelId ?? ""),
    manufacturer: String(model.manufacturer ?? ""),
    model: String(model.model ?? ""),
    pointCount: points.length,
    lineEligible: points.length >= 2,
    points,
  };
}

function withoutPoints(series) {
  return series.map((item) => ({
    ...item,
    pointCount: 0,
    lineEligible: false,
    points: [],
  }));
}

function commonMetrics(series) {
  return METRICS.filter((metric) =>
    series.every(
      (item) =>
        item.points.length && item.points.every((point) => point[metric] !== null),
    ),
  );
}

function commonRange(series) {
  if (series.some((item) => !item.points.length)) return null;
  const minimum = Math.max(
    ...series.map((item) => Math.min(...item.points.map((point) => point.rpm))),
  );
  const maximum = Math.min(
    ...series.map((item) => Math.max(...item.points.map((point) => point.rpm))),
  );
  if (minimum > maximum) return null;
  return {
    rpm: { min: minimum, max: maximum },
    rps: { min: minimum / 60, max: maximum / 60 },
  };
}

function exactSpeedOverlap(series) {
  const baselineSpeeds = new Set(series[0].points.map((point) => point.rpm));
  return series[1].points.some((point) => baselineSpeeds.has(point.rpm));
}

function speedResult({
  status,
  chartEligible,
  rankingAllowed,
  reason,
  metricOptions,
  range,
  series,
}) {
  return {
    status,
    chartEligible,
    rankingAllowed,
    reason,
    metricOptions,
    commonRange: range,
    series,
    safeguards: { interpolation: false, extrapolation: false, hzAsSpeed: false },
  };
}

export function buildSpeedAnalysis(
  baseline,
  candidate,
  { comparisonAllowed = true, comparisonReason = null } = {},
) {
  const series = [
    speedSeries("baseline", baseline),
    speedSeries("candidate", candidate),
  ];
  if (series.some((item) => !item.points.length)) {
    return speedResult({
      status: "DATA_REQUIRED",
      chartEligible: false,
      rankingAllowed: false,
      reason: "양쪽 모델의 검증된 RPM/RPS 성능점이 모두 필요합니다.",
      metricOptions: [],
      range: null,
      series: withoutPoints(series),
    });
  }
  const metricOptions = commonMetrics(series);
  const range = commonRange(series);
  if (!comparisonAllowed) {
    return speedResult({
      status: "REFERENCE_ONLY",
      chartEligible: false,
      rankingAllowed: false,
      reason: comparisonReason ?? "카탈로그 직접 비교 Gate를 통과하지 못했습니다.",
      metricOptions,
      range,
      series,
    });
  }
  const mismatches = COMPARISON_KEYS.filter(
    (key) => baseline[key] !== candidate[key],
  );
  if (mismatches.length) {
    return speedResult({
      status: "REFERENCE_ONLY",
      chartEligible: false,
      rankingAllowed: false,
      reason: `속도 비교 키가 다릅니다: ${mismatches.join(", ")}`,
      metricOptions,
      range,
      series,
    });
  }
  if (!metricOptions.length) {
    return speedResult({
      status: "DATA_REQUIRED",
      chartEligible: false,
      rankingAllowed: false,
      reason: "양쪽 성능맵에 공통으로 완결된 지표가 없습니다.",
      metricOptions: [],
      range: null,
      series: withoutPoints(series),
    });
  }
  if (!range) {
    return speedResult({
      status: "REFERENCE_ONLY",
      chartEligible: false,
      rankingAllowed: false,
      reason: "검증된 속도 범위가 겹치지 않아 같은 구간을 비교할 수 없습니다.",
      metricOptions,
      range: null,
      series,
    });
  }
  const exactOverlap = exactSpeedOverlap(series);
  if (series.every((item) => item.lineEligible)) {
    return speedResult({
      status: "CURVE_READY",
      chartEligible: true,
      rankingAllowed: exactOverlap,
      reason:
        "양쪽에 두 개 이상의 검증된 성능점과 공통 속도 범위가 있습니다. " +
        (exactOverlap
          ? "동일 속도 실측점에서만 수치 비교할 수 있습니다."
          : "동일 속도 실측점이 없어 곡선 관찰만 가능하며 순위를 만들지 않습니다."),
      metricOptions,
      range,
      series,
    });
  }
  if (exactOverlap) {
    return speedResult({
      status: "POINT_READY",
      chartEligible: true,
      rankingAllowed: true,
      reason: "동일 속도의 검증된 단일점을 Scatter로 비교합니다.",
      metricOptions,
      range,
      series,
    });
  }
  return speedResult({
    status: "REFERENCE_ONLY",
    chartEligible: false,
    rankingAllowed: false,
    reason: "단일점은 동일 속도 실측점이 없으면 보간 없이 비교할 수 없습니다.",
    metricOptions,
    range,
    series,
  });
}

function jsonResponse(payload, status = 200) {
  return Response.json(payload, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

async function runtimeJson(request, env, filename) {
  const url = new URL(request.url);
  url.pathname = `/_runtime/${filename}`;
  url.search = "";
  const response = await env.ASSETS.fetch(new Request(url.toString()));
  if (!response.ok) throw new Error(`runtime asset missing: ${filename}`);
  return response.json();
}

function decodePathValue(pathname, prefix) {
  try {
    return decodeURIComponent(pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

function findModel(catalog, modelId) {
  return catalog.items.find((item) => item.modelId === modelId) ?? null;
}

async function compareRequest(request, env, withReport) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ detail: "비교 요청 JSON이 올바르지 않습니다." }, 422);
  }
  if (
    !body ||
    typeof body.baselineModelId !== "string" ||
    typeof body.candidateModelId !== "string" ||
    !["cop", "eer"].includes(body.metric ?? "cop")
  ) {
    return jsonResponse({ detail: "비교 모델과 cop/eer 지표가 필요합니다." }, 422);
  }
  const [catalog, rules] = await Promise.all([
    runtimeJson(request, env, "catalog.json"),
    runtimeJson(request, env, "rules.json"),
  ]);
  const baseline = findModel(catalog, body.baselineModelId);
  const candidate = findModel(catalog, body.candidateModelId);
  if (!baseline || !candidate) {
    return jsonResponse({ detail: "모델을 찾을 수 없습니다." }, 404);
  }
  const comparison = compareModels(baseline, candidate, {
    metric: body.metric ?? "cop",
    capacityTolerancePct: rules.benchmark.similarityCapacityTolerancePct,
  });
  if (!withReport) {
    return jsonResponse({ releaseId: catalog.releaseId, ...comparison });
  }
  return jsonResponse({
    releaseId: catalog.releaseId,
    comparison,
    analysis: buildComparisonAnalysis(
      baseline,
      candidate,
      comparison,
      catalog.releaseId,
    ),
    speedAnalysis: buildSpeedAnalysis(baseline, candidate, {
      comparisonAllowed:
        comparison.verdict === "DIRECT" && comparison.rankingAllowed,
      comparisonReason: comparison.reason,
    }),
  });
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  if (request.method === "GET" && pathname === "/api/v1/health") {
    const active = await runtimeJson(request, env, "active.json");
    return jsonResponse({ status: "ok", activeReleaseId: active.releaseId ?? null });
  }
  if (request.method === "GET" && pathname === "/api/v1/releases/active") {
    return jsonResponse(await runtimeJson(request, env, "active.json"));
  }
  if (
    request.method === "GET" &&
    pathname === "/api/v1/releases/active/diff"
  ) {
    return jsonResponse(await runtimeJson(request, env, "release-diff.json"));
  }
  if (
    request.method === "GET" &&
    pathname === "/api/v1/expansion/batches/B1"
  ) {
    return jsonResponse(await runtimeJson(request, env, "expansion-b1.json"));
  }
  if (request.method === "GET" && pathname === "/api/v1/catalog/models") {
    const catalog = await runtimeJson(request, env, "catalog.json");
    let items = catalog.items;
    const filters = {
      manufacturer: searchParams.get("manufacturer"),
      type: searchParams.get("type"),
      refrigerant: searchParams.get("refrigerant"),
      condition: searchParams.get("condition"),
      driveClass: searchParams.get("driveClass"),
    };
    for (const [field, expected] of Object.entries(filters)) {
      if (expected !== null) items = items.filter((item) => item[field] === expected);
    }
    const search = searchParams.get("search")?.toLocaleLowerCase();
    if (search) {
      items = items.filter(
        (item) =>
          item.model.toLocaleLowerCase().includes(search) ||
          item.manufacturer.toLocaleLowerCase().includes(search),
      );
    }
    return jsonResponse({ releaseId: catalog.releaseId, count: items.length, items });
  }
  const modelPrefix = "/api/v1/catalog/models/";
  if (request.method === "GET" && pathname.startsWith(modelPrefix)) {
    const modelId = decodePathValue(pathname, modelPrefix);
    const catalog = await runtimeJson(request, env, "catalog.json");
    const item = modelId ? findModel(catalog, modelId) : null;
    return item
      ? jsonResponse({ releaseId: catalog.releaseId, item })
      : jsonResponse({ detail: "모델을 찾을 수 없습니다." }, 404);
  }
  if (request.method === "POST" && pathname === "/api/v1/compare") {
    return compareRequest(request, env, false);
  }
  if (request.method === "POST" && pathname === "/api/v1/compare/report") {
    return compareRequest(request, env, true);
  }
  const portfolioMatch = pathname.match(/^\/api\/v1\/portfolio\/([^/]+)\/([^/]+)$/);
  if (request.method === "GET" && portfolioMatch) {
    const compressorType = decodeURIComponent(portfolioMatch[1]);
    const refrigerant = decodeURIComponent(portfolioMatch[2]);
    const [catalog, rules] = await Promise.all([
      runtimeJson(request, env, "catalog.json"),
      runtimeJson(request, env, "rules.json"),
    ]);
    const samsungModels = catalog.items.filter(
      (item) =>
        item.manufacturer === "Samsung" &&
        item.type === compressorType &&
        item.refrigerant === refrigerant,
    );
    const competitorModels = catalog.items.filter(
      (item) =>
        item.manufacturer !== "Samsung" &&
        item.type === compressorType &&
        item.refrigerant === refrigerant,
    );
    let status;
    if (samsungModels.some((item) => item.lifecycleStatus === "MASS_PRODUCT")) {
      status = "HAVE";
    } else if (samsungModels.length) {
      status = "IN_PROGRESS";
    } else {
      status =
        rules.portfolio?.[refrigerant]?.[compressorType] === "gap"
          ? "GAP"
          : "UNKNOWN";
    }
    return jsonResponse({
      releaseId: catalog.releaseId,
      manufacturer: "Samsung",
      type: compressorType,
      refrigerant,
      status,
      samsungModels,
      competitorModels,
      rankingAllowed: ["GAP", "UNKNOWN"].includes(status) ? false : null,
      evidence: {
        sourcePath: "config/p0_catalog_rules.json",
        locator: {
          kind: "json-path",
          path: `portfolio.${refrigerant}.${compressorType}`,
        },
        approvalBasis: "2026-07-30 user-confirmed recommended defaults",
      },
    });
  }
  const evidencePrefix = "/api/v1/evidence/";
  if (request.method === "GET" && pathname.startsWith(evidencePrefix)) {
    const modelId = decodePathValue(pathname, evidencePrefix);
    const catalog = await runtimeJson(request, env, "catalog.json");
    const item = modelId ? findModel(catalog, modelId) : null;
    return item
      ? jsonResponse({
          releaseId: catalog.releaseId,
          modelId,
          evidence: item.evidence,
          supportingEvidence: item.supportingEvidence ?? [],
        })
      : jsonResponse({ detail: "모델을 찾을 수 없습니다." }, 404);
  }
  return jsonResponse({ detail: "Not Found" }, 404);
}

export default {
  async fetch(request, env) {
    try {
      if (new URL(request.url).pathname.startsWith("/api/")) {
        return await handleApi(request, env);
      }
      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error("Worker request failed", error);
      return jsonResponse({ detail: "배포 runtime 처리에 실패했습니다." }, 500);
    }
  },
};
