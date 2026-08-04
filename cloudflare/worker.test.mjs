import assert from "node:assert/strict";
import test from "node:test";

import worker, {
  buildComparisonAnalysis,
  buildSpeedAnalysis,
  compareModels,
} from "./worker.js";

function evidence(id) {
  return {
    evidenceId: id,
    sourcePath: "data/test.md",
    authority: "official",
    locator: { kind: "section", section: id },
    fieldPaths: ["specs.cop"],
  };
}

function model({ id, manufacturer, capacityW, cop, speeds = [1800, 2400] }) {
  return {
    modelId: id,
    manufacturer,
    model: id.split(":").at(-1),
    type: "Re",
    refrigerant: "R600a",
    condition: "ASHRAE-LBP",
    driveClass: "VARIABLE",
    lifecycleStatus: "MASS_PRODUCT",
    confidence: "High",
    specs: { capacityW, cop, eer: cop * 3.412 },
    evidence: evidence(`${id}:catalog`),
    performanceMaps: [
      {
        condition: "ASHRAE-LBP",
        points: speeds.map((speedValue, index) => ({
          speedValue,
          speedUnit: "rpm",
          capacityW: capacityW + index * 10,
          cop: cop - index * 0.02,
          evidence: evidence(`${id}:${speedValue}`),
        })),
      },
    ],
  };
}

const baseline = model({
  id: "model:samsung:BASE",
  manufacturer: "Samsung",
  capacityW: 100,
  cop: 2,
});
const candidate = model({
  id: "model:competitor:CANDIDATE",
  manufacturer: "Competitor",
  capacityW: 110,
  cop: 2.1,
  speeds: [1900, 2500],
});

test("direct comparison and analysis preserve the FastAPI contract", () => {
  const comparison = compareModels(baseline, candidate, {
    metric: "cop",
    capacityTolerancePct: 15,
  });
  assert.equal(comparison.code, "DIRECT_OK");
  assert.equal(comparison.rankingAllowed, true);
  assert.equal(comparison.capacityDiffPct, 10);
  assert.ok(Math.abs(comparison.deltaPct - 5) < 1e-9);

  const analysis = buildComparisonAnalysis(
    baseline,
    candidate,
    comparison,
    "release:test",
  );
  assert.equal(analysis.conditionSafety.status, "DIRECT_SAFE");
  assert.equal(analysis.performanceInterpretation.allowed, true);
  assert.equal(analysis.evidenceRefs.length, 2);

  const speed = buildSpeedAnalysis(baseline, candidate, {
    comparisonAllowed: true,
    comparisonReason: comparison.reason,
  });
  assert.equal(speed.status, "CURVE_READY");
  assert.equal(speed.chartEligible, true);
  assert.equal(speed.rankingAllowed, false);
});

test("condition mismatch never produces a ranking", () => {
  const unsafe = { ...candidate, condition: "EN12900" };
  const result = compareModels(baseline, unsafe, {
    metric: "cop",
    capacityTolerancePct: 15,
  });
  assert.equal(result.code, "BLOCKED_CONDITION_MISMATCH");
  assert.equal(result.rankingAllowed, false);
  assert.equal(result.deltaPct, null);
});

test("worker serves health, filtered catalog, compare report, and SPA assets", async () => {
  const runtime = {
    "/_runtime/active.json": {
      releaseId: "release:test",
      status: "PUBLISHED",
      counts: { models: 2, samsungModels: 1, competitorModels: 1 },
    },
    "/_runtime/catalog.json": {
      releaseId: "release:test",
      count: 2,
      items: [baseline, candidate],
    },
    "/_runtime/rules.json": {
      benchmark: { similarityCapacityTolerancePct: 15 },
      portfolio: { R290: { Re: "gap" } },
    },
    "/_runtime/release-diff.json": { status: "NO_CHANGES" },
    "/_runtime/expansion-b1.json": { status: "SOURCE_VERIFIED" },
  };
  const env = {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        if (pathname in runtime) {
          return Response.json(runtime[pathname]);
        }
        return new Response("<main>studio</main>", {
          headers: { "content-type": "text/html;charset=utf-8" },
        });
      },
    },
  };

  const health = await worker.fetch(
    new Request("https://example.test/api/v1/health"),
    env,
  );
  assert.deepEqual(await health.json(), {
    status: "ok",
    activeReleaseId: "release:test",
  });

  const catalog = await worker.fetch(
    new Request("https://example.test/api/v1/catalog/models?manufacturer=Samsung"),
    env,
  );
  assert.equal((await catalog.json()).count, 1);

  const report = await worker.fetch(
    new Request("https://example.test/api/v1/compare/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        baselineModelId: baseline.modelId,
        candidateModelId: candidate.modelId,
        metric: "cop",
      }),
    }),
    env,
  );
  const reportPayload = await report.json();
  assert.equal(reportPayload.comparison.code, "DIRECT_OK");
  assert.equal(reportPayload.speedAnalysis.status, "CURVE_READY");

  const spa = await worker.fetch(new Request("https://example.test/"), env);
  assert.match(await spa.text(), /studio/);
});
