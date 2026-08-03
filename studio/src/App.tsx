import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  compareCatalogModelsWithReport,
  getActiveRelease,
  getCriticalGap,
  getEvidence,
  getExpansionBatch,
  getModels,
} from "./api";
import type {
  ActiveRelease,
  CatalogModel,
  ComparisonEvidenceRef,
  ComparisonReport,
  CompressorType,
  EvidenceTrace,
  ExpansionBatch,
  PortfolioStatus,
} from "./types";

type ViewId = "overview" | "catalog" | "compare" | "portfolio" | "release";

const NAV_ITEMS: Array<{ id: ViewId; label: string; kicker: string }> = [
  { id: "overview", label: "Overview", kicker: "준비도" },
  { id: "catalog", label: "Catalog Checks", kicker: "모델 점검" },
  { id: "compare", label: "Compare Lab", kicker: "안전 비교" },
  { id: "portfolio", label: "Portfolio Gaps", kicker: "공백 관리" },
  { id: "release", label: "Release / Evidence", kicker: "추적성" },
];
const SIDEBAR_ITEMS: Array<
  | { id: ViewId; label: string; kicker: string }
  | { id: "compare-report"; label: string; kicker: string }
> = [
  ...NAV_ITEMS,
  { id: "compare-report", label: "Compare Report", kicker: "정적 보고서 ↗" },
];

const SpeedAnalysis = lazy(() => import("./SpeedAnalysis"));

const TYPE_LABEL: Record<CompressorType, string> = {
  Re: "왕복동",
  Ro: "로터리",
  Sc: "스크롤",
};

const LAYER_LABEL: Record<CatalogModel["sourceLayer"], string> = {
  samsung_catalog_2024: "Samsung 2024 공식",
  samsung_legacy_research: "공식 PDF 미확정",
  post_catalog: "2024+ 개발",
  competitor_research: "경쟁사 조사",
};

function shortHash(value: string | undefined, length = 12) {
  if (!value) return "—";
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function metric(value: number | null | undefined, suffix = "") {
  return value == null ? "미확인" : `${value.toLocaleString("ko-KR")}${suffix}`;
}

function capacityW(model: CatalogModel) {
  const watts = model.specs?.capacityW;
  if (typeof watts === "number" && watts > 0) return watts;
  const btuPerHour = model.specs?.capacityBtuH;
  if (typeof btuPerHour === "number" && btuPerHour > 0) {
    return btuPerHour / 3.412;
  }
  return null;
}

function isDirectComparisonCandidate(
  baseline: CatalogModel,
  candidate: CatalogModel,
  comparisonMetric: "cop" | "eer",
) {
  const baselineMetric = baseline.specs?.[comparisonMetric];
  const candidateMetric = candidate.specs?.[comparisonMetric];
  const baselineCapacity = capacityW(baseline);
  const candidateCapacity = capacityW(candidate);

  if (
    baseline.type !== candidate.type ||
    baseline.refrigerant !== candidate.refrigerant ||
    baseline.condition === "UNKNOWN" ||
    baseline.condition !== candidate.condition ||
    baseline.driveClass !== candidate.driveClass ||
    typeof baselineMetric !== "number" ||
    baselineMetric <= 0 ||
    typeof candidateMetric !== "number" ||
    candidateMetric <= 0 ||
    baselineCapacity == null ||
    candidateCapacity == null
  ) {
    return false;
  }

  return (
    (Math.abs(candidateCapacity - baselineCapacity) / baselineCapacity) * 100 <=
    15 + Number.EPSILON
  );
}

function directCandidates(
  baseline: CatalogModel,
  competitors: CatalogModel[],
  comparisonMetric: "cop" | "eer",
) {
  return competitors.filter((candidate) =>
    isDirectComparisonCandidate(baseline, candidate, comparisonMetric),
  );
}

function comparisonResearchTarget(
  model: CatalogModel,
  competitors: CatalogModel[],
  comparisonMetric: "cop" | "eer",
) {
  const modelCapacity = capacityW(model);
  const sameType = competitors.filter((item) => item.type === model.type);
  const sameRefrigerant = sameType.filter(
    (item) => item.refrigerant === model.refrigerant,
  );
  const sameKey = sameRefrigerant.filter(
    (item) =>
      item.condition === model.condition &&
      item.driveClass === model.driveClass &&
      typeof item.specs?.[comparisonMetric] === "number" &&
      item.specs[comparisonMetric]! > 0 &&
      capacityW(item) != null,
  );
  const nearest = [...sameRefrigerant]
    .map((item) => {
      const itemCapacity = capacityW(item);
      const capacityDiffPct =
        modelCapacity != null && itemCapacity != null
          ? (Math.abs(itemCapacity - modelCapacity) / modelCapacity) * 100
          : null;
      return { item, capacityDiffPct };
    })
    .sort(
      (left, right) =>
        (left.capacityDiffPct ?? Number.POSITIVE_INFINITY) -
        (right.capacityDiffPct ?? Number.POSITIVE_INFINITY),
    )[0];
  const targetManufacturers = [
    ...new Set((sameRefrigerant.length ? sameRefrigerant : sameType).map(
      (item) => item.manufacturer,
    )),
  ].slice(0, 3);

  let priority = "P3";
  let reason = `동일 냉매(${model.refrigerant}) 경쟁 모델 공식 성능값이 없습니다.`;
  if (sameKey.length > 0) {
    const keyDiffs = sameKey
      .map((item) => {
        const itemCapacity = capacityW(item);
        return modelCapacity != null && itemCapacity != null
          ? (Math.abs(itemCapacity - modelCapacity) / modelCapacity) * 100
          : Number.POSITIVE_INFINITY;
      })
      .sort((left, right) => left - right);
    const nearestDiff = keyDiffs[0];
    priority = nearestDiff <= 30 ? "P1" : "P2";
    reason = `동일 비교 키 후보는 있으나 최근접 용량 차이 ${nearestDiff.toFixed(1)}%로 ±15%를 벗어납니다.`;
  } else if (sameRefrigerant.length > 0) {
    const sameCondition = sameRefrigerant.some(
      (item) => item.condition === model.condition,
    );
    const sameDrive = sameRefrigerant.some(
      (item) => item.driveClass === model.driveClass,
    );
    const nearCapacity =
      nearest?.capacityDiffPct != null && nearest.capacityDiffPct <= 15;
    priority = nearCapacity ? "P1" : "P2";
    if (!sameCondition) {
      reason = `용량이 ${nearCapacity ? "근접하지만 " : ""}${model.condition} 측정조건의 공식값이 없습니다.`;
    } else if (!sameDrive) {
      reason = `${model.driveClass} 구동 분류의 공식 성능값이 없습니다.`;
    } else {
      reason = `${comparisonMetric.toUpperCase()} 또는 용량 공식값이 누락됐습니다.`;
    }
  }

  return {
    model,
    priority,
    reason,
    targetManufacturers,
    capacityRange:
      modelCapacity == null
        ? "용량 확인 필요"
        : `${Math.round(modelCapacity * 0.85).toLocaleString("ko-KR")}~${Math.round(
            modelCapacity * 1.15,
          ).toLocaleString("ko-KR")} W`,
  };
}

function reportMatchesSelection(
  report: ComparisonReport,
  releaseId: string,
  baselineModelId: string,
  candidateModelId: string,
  comparisonMetric: "cop" | "eer",
) {
  const baselineSpeedSeries = report.speedAnalysis.series.find(
    (series) => series.role === "baseline",
  );
  const candidateSpeedSeries = report.speedAnalysis.series.find(
    (series) => series.role === "candidate",
  );
  return (
    report.releaseId === releaseId &&
    report.releaseId === report.analysis.releaseId &&
    report.comparison.baselineModelId === baselineModelId &&
    report.comparison.candidateModelId === candidateModelId &&
    report.comparison.metric === comparisonMetric &&
    report.analysis.baselineModelId === baselineModelId &&
    report.analysis.candidateModelId === candidateModelId &&
    report.analysis.metric === comparisonMetric &&
    baselineSpeedSeries?.modelId === baselineModelId &&
    candidateSpeedSeries?.modelId === candidateModelId
  );
}

function evidenceLocator(ref: ComparisonEvidenceRef) {
  if (typeof ref.locator.page === "number") return `PDF p.${ref.locator.page}`;
  if (ref.locator.section) return ref.locator.section;
  if (ref.locator.url) return ref.locator.url;
  return ref.locator.kind || "locator 미확인";
}

function StatusPill({
  tone,
  children,
}: {
  tone: "good" | "warn" | "danger" | "neutral" | "accent";
  children: ReactNode;
}) {
  return <span className={`status-pill status-${tone}`}>{children}</span>;
}

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  const view: ViewId =
    requestedView === "model"
      ? "catalog"
      : NAV_ITEMS.some((item) => item.id === requestedView)
        ? (requestedView as ViewId)
        : "overview";
  return {
    view,
    modelId: params.get("modelId"),
    evidence: params.get("evidence") === "1",
    baselineModelId: params.get("baselineModelId"),
    candidateModelId: params.get("candidateModelId"),
    metric: params.get("metric") === "eer" ? "eer" as const : "cop" as const,
  };
}

function writeQuery(
  values: Record<string, string | null | undefined>,
  mode: "push" | "replace" = "push",
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  const next = `${window.location.pathname}${params.size ? `?${params}` : ""}`;
  window.history[mode === "replace" ? "replaceState" : "pushState"]({}, "", next);
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
    </header>
  );
}

function LoadingState() {
  return (
    <main className="center-state" aria-live="polite">
      <span className="spinner" />
      <h1>Catalog Release를 불러오는 중입니다</h1>
      <p>활성 Release와 Evidence 무결성을 확인하고 있습니다.</p>
    </main>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="center-state error-state" role="alert">
      <span className="state-icon">!</span>
      <h1>Audit Studio를 열 수 없습니다</h1>
      <p>{message}</p>
      <p>활성 Published Release와 API 서버 상태를 확인해 주세요.</p>
    </main>
  );
}

function Overview({
  release,
  models,
  gap,
  onNavigate,
}: {
  release: ActiveRelease;
  models: CatalogModel[];
  gap: PortfolioStatus;
  onNavigate: (view: ViewId) => void;
}) {
  const layers = useMemo(
    () =>
      models.reduce<Record<string, number>>((counts, item) => {
        counts[item.sourceLayer] = (counts[item.sourceLayer] ?? 0) + 1;
        return counts;
      }, {}),
    [models],
  );
  const warning = release.validationSummary.warningCount;

  return (
    <div className="view-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">SAMSUNG COMPRESSOR INTELLIGENCE</p>
          <h2>검증된 카탈로그로<br />안전하게 판단하세요.</h2>
          <p className="hero-copy">
            조사값을 바로 비교하지 않고, 권위·조건·Evidence·Release Gate를
            통과한 정보만 보여줍니다.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => onNavigate("catalog")}>
              Catalog 점검 시작
            </button>
            <button className="secondary-button" onClick={() => onNavigate("compare")}>
              안전 비교 열기
            </button>
          </div>
        </div>
        <div className="release-card">
          <div className="release-card-top">
            <span className="pulse-dot" />
            Active Published Release
          </div>
          <strong>{release.releaseId}</strong>
          <dl>
            <div><dt>기준일</dt><dd>{release.asOf ?? "—"}</dd></div>
            <div><dt>승인자</dt><dd>{release.approvedBy}</dd></div>
            <div><dt>Bundle</dt><dd>{shortHash(release.dataSha256)}</dd></div>
          </dl>
        </div>
      </section>

      <section className="stat-grid" aria-label="카탈로그 핵심 지표">
        <article className="stat-card">
          <span>전체 모델</span>
          <strong>{release.counts.models}</strong>
          <small>활성 Release 기준</small>
        </article>
        <article className="stat-card">
          <span>Samsung 모델</span>
          <strong>{release.counts.samsungModels}</strong>
          <small>2024 + 후속 개발</small>
        </article>
        <article className="stat-card">
          <span>경쟁 모델</span>
          <strong>{release.counts.competitorModels}</strong>
          <small>공개 조사 Evidence</small>
        </article>
        <article className="stat-card stat-card-warn">
          <span>검토 Warning</span>
          <strong>{warning}</strong>
          <small>Critical / Major 0</small>
        </article>
      </section>

      <section className="split-grid">
        <article className="panel">
          <div className="panel-title-row">
            <div>
              <p className="section-kicker">RELEASE READINESS</p>
              <h3>현재 데이터는 의사결정 준비 상태입니다</h3>
            </div>
            <StatusPill tone="good">Gate PASS</StatusPill>
          </div>
          <div className="gate-list">
            {[
              ["권위값", "Samsung 2024 PDF 우선", "PASS"],
              ["비교 안전", "조건 교차 순위 금지", "PASS"],
              ["Evidence", "모델별 locator 연결", "PASS"],
              ["수식 검토", `Warning ${warning}건 원문 유지`, warning ? "REVIEW" : "PASS"],
            ].map(([label, detail, status]) => (
              <div className="gate-row" key={label}>
                <span className={`gate-mark ${status === "PASS" ? "pass" : "review"}`}>
                  {status === "PASS" ? "✓" : "!"}
                </span>
                <div><strong>{label}</strong><small>{detail}</small></div>
                <b>{status}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="panel gap-spotlight">
          <div className="panel-title-row">
            <div>
              <p className="section-kicker">PRIORITY GAP</p>
              <h3>R290 왕복동</h3>
            </div>
            <StatusPill tone="danger">{gap.status}</StatusPill>
          </div>
          <div className="gap-visual">
            <span>R290</span>
            <strong>Re</strong>
            <i>당사 미보유</i>
          </div>
          <p>
            가짜 Samsung 모델이나 0값을 만들지 않습니다. 경쟁 모델은 참고할 수
            있지만 당사 순위는 표시하지 않습니다.
          </p>
          <button className="text-button" onClick={() => onNavigate("portfolio")}>
            Portfolio Gap 근거 보기 →
          </button>
        </article>
      </section>

      <section className="panel">
        <div className="panel-title-row">
          <div>
            <p className="section-kicker">SOURCE LAYERS</p>
            <h3>출처 레이어 분포</h3>
          </div>
          <span className="muted">총 {models.length}개</span>
        </div>
        <div className="layer-grid">
          {Object.entries(LAYER_LABEL).map(([key, label]) => (
            <div className="layer-item" key={key}>
              <span className={`layer-dot layer-${key}`} />
              <div><strong>{label}</strong><small>{key}</small></div>
              <b>{layers[key] ?? 0}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CatalogChecks({
  models,
  release,
  initialModelId,
  initialEvidence,
}: {
  models: CatalogModel[];
  release: ActiveRelease;
  initialModelId?: string | null;
  initialEvidence?: boolean;
}) {
  const [search, setSearch] = useState(
    () => models.find((item) => item.modelId === initialModelId)?.model ?? "",
  );
  const [type, setType] = useState<"ALL" | CompressorType>("ALL");
  const [refrigerant, setRefrigerant] = useState("ALL");
  const [condition, setCondition] = useState("ALL");
  const [driveClass, setDriveClass] = useState("ALL");
  const [selected, setSelected] = useState<CatalogModel | null>(
    () => models.find((item) => item.modelId === initialModelId) ?? null,
  );
  const [trace, setTrace] = useState<EvidenceTrace | null>(null);
  const [traceError, setTraceError] = useState("");

  const conditions = useMemo(
    () => [...new Set(models.map((item) => item.condition))].sort(),
    [models],
  );
  const refrigerants = useMemo(
    () => [...new Set(models.map((item) => item.refrigerant))].sort(),
    [models],
  );
  const driveClasses = useMemo(
    () => [...new Set(models.map((item) => item.driveClass))].sort(),
    [models],
  );
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return models.filter(
      (item) =>
        (type === "ALL" || item.type === type) &&
        (refrigerant === "ALL" || item.refrigerant === refrigerant) &&
        (condition === "ALL" || item.condition === condition) &&
        (driveClass === "ALL" || item.driveClass === driveClass) &&
        (!needle ||
          item.model.toLowerCase().includes(needle) ||
          item.manufacturer.toLowerCase().includes(needle) ||
          item.refrigerant.toLowerCase().includes(needle)),
    );
  }, [condition, driveClass, models, refrigerant, search, type]);

  useEffect(() => {
    if (selected && !filtered.some((item) => item.modelId === selected.modelId)) {
      setSelected(null);
      setTrace(null);
    }
  }, [filtered, selected]);

  async function openEvidence() {
    if (!selected) return;
    setTraceError("");
    try {
      setTrace(await getEvidence(selected.modelId));
      writeQuery({
        view: "model",
        modelId: selected.modelId,
        evidence: "1",
      });
    } catch (error) {
      setTraceError(error instanceof Error ? error.message : String(error));
    }
  }

  useEffect(() => {
    if (initialEvidence && selected && !trace && !traceError) {
      void openEvidence();
    }
    // URL 초기 상태는 첫 렌더에서 한 번만 복원한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="view-stack">
      <PageHeading
        eyebrow="CATALOG CHECKS"
        title="모델과 근거를 한 화면에서 점검합니다"
        description="검색 → 조건 확인 → 원천 위치 추적 순서로 검토하세요."
      />
      <section className="panel filter-bar" aria-label="모델 필터">
        <label className="search-field">
          <span>모델 검색</span>
          <input
            data-testid="global-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="모델명, 제조사, 냉매"
          />
        </label>
        <label>
          <span>유형</span>
          <select data-testid="filter-type" value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="ALL">전체 유형</option>
            <option value="Re">Re · 왕복동</option>
            <option value="Ro">Ro · 로터리</option>
            <option value="Sc">Sc · 스크롤</option>
          </select>
        </label>
        <label>
          <span>냉매</span>
          <select data-testid="filter-refrigerant" value={refrigerant} onChange={(event) => setRefrigerant(event.target.value)}>
            <option value="ALL">전체 냉매</option>
            {refrigerants.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>측정조건</span>
          <select data-testid="filter-condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
            <option value="ALL">전체 조건</option>
            {conditions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span>구동</span>
          <select data-testid="filter-drive-class" value={driveClass} onChange={(event) => setDriveClass(event.target.value)}>
            <option value="ALL">전체 구동</option>
            {driveClasses.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <div className="result-count" data-testid="search-results"><strong>{filtered.length}</strong><span>models</span></div>
      </section>

      <section className="catalog-layout">
        <div className="panel table-panel">
          <div className="table-scroll" data-testid="table-scroll">
            <table data-testid="model-list">
              <thead>
                <tr>
                  <th>모델</th><th>유형</th><th>냉매</th><th>조건</th><th>COP</th><th>레이어</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.modelId} data-model-id={item.modelId} className={selected?.modelId === item.modelId ? "selected-row" : ""}>
                    <td>
                      <button className="model-button" onClick={() => {
                        setSelected(item);
                        setTrace(null);
                        writeQuery({ view: "model", modelId: item.modelId });
                      }}>
                        <strong>{item.model}</strong><small>{item.manufacturer}</small>
                      </button>
                    </td>
                    <td><span className={`type-badge type-${item.type}`}>{item.type}</span></td>
                    <td>{item.refrigerant}</td>
                    <td><span className="condition-badge">{item.condition}</span></td>
                    <td>{metric(item.specs?.cop)}</td>
                    <td><span className={`layer-badge layer-${item.sourceLayer}`}>{LAYER_LABEL[item.sourceLayer]}</span></td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={6}>조건에 맞는 모델을 찾을 수 없음</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="panel detail-panel" aria-live="polite" data-testid="model-detail">
          {selected ? (
            <>
              <div className="detail-head">
                <div>
                  <span>{selected.manufacturer} · {TYPE_LABEL[selected.type]}</span>
                  <h3 data-testid="model-name">{selected.model}</h3>
                </div>
                <StatusPill tone={selected.lifecycleStatus === "MASS_PRODUCT" ? "good" : "warn"}>
                  {selected.lifecycleStatus === "MASS_PRODUCT" ? "양산" : "개발중"}
                </StatusPill>
              </div>
              <div className="spec-grid">
                <div><span>냉매</span><strong>{selected.refrigerant}</strong></div>
                <div><span>측정조건</span><strong>{selected.condition}</strong></div>
                <div><span>구동</span><strong>{selected.driveClass}</strong></div>
                <div><span>신뢰도</span><strong>{selected.confidence}</strong></div>
                <div><span>용량</span><strong>{metric(selected.specs?.capacityW, " W")}</strong></div>
                <div><span>COP</span><strong data-testid="model-cop">{metric(selected.specs?.cop)}</strong></div>
              </div>
              <div className="evidence-preview">
                <span>Primary Evidence</span>
                <strong>{selected.evidence.sourcePath}</strong>
                <small>{selected.evidence.authority} · {selected.evidence.locator.kind}</small>
              </div>
              <button data-testid="evidence-open" className="primary-button full-button" onClick={openEvidence}>Evidence 열기</button>
              {traceError && <p className="inline-error">{traceError}</p>}
              {trace && (
                <div className="trace-card" data-testid="evidence-panel">
                  <div><span>Model</span><strong data-testid="evidence-model-id">{trace.modelId}</strong></div>
                  <div><span>Release</span><strong data-testid="evidence-release-id">{trace.releaseId}</strong></div>
                  <div><span>Source</span><strong data-testid="evidence-source-path">{trace.evidence.sourcePath}</strong></div>
                  <div>
                    <span>Locator</span>
                    <strong data-testid="evidence-locator">
                      {trace.evidence.locator.page
                        ? `PDF p.${trace.evidence.locator.page}`
                        : trace.evidence.locator.section ?? trace.evidence.locator.url ?? "—"}
                    </strong>
                  </div>
                  <a
                    data-testid="source-open"
                    href={`/source/Samsung-Compressor-Catalogue_2024.pdf${trace.evidence.locator.page ? `#page=${trace.evidence.locator.page}` : ""}`}
                  >
                    원천 열기
                  </a>
                </div>
              )}
            </>
          ) : (
            <div className="empty-detail">
              <span className="state-icon">⌁</span>
              <h3>{initialModelId ? "모델을 찾을 수 없음" : "모델을 선택하세요"}</h3>
              <p>행을 선택하면 수치·조건·Evidence 경로를 확인할 수 있습니다.</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function CompareLab({
  models,
  releaseId,
  initialBaselineId,
  initialCandidateId,
  initialMetric,
}: {
  models: CatalogModel[];
  releaseId: string;
  initialBaselineId?: string | null;
  initialCandidateId?: string | null;
  initialMetric?: "cop" | "eer";
}) {
  const samsung = useMemo(() => models.filter((item) => item.manufacturer === "Samsung"), [models]);
  const competitors = useMemo(() => models.filter((item) => item.manufacturer !== "Samsung"), [models]);
  const initialBaseline = samsung.find((item) => item.modelId === initialBaselineId);
  const initialCandidate = competitors.find((item) => item.modelId === initialCandidateId);
  const [selectedType, setSelectedType] = useState<CompressorType | null>(
    initialBaseline?.type ?? null,
  );
  const [baselineId, setBaselineId] = useState(initialBaseline?.modelId ?? "");
  const [candidateId, setCandidateId] = useState(initialCandidate?.modelId ?? "");
  const [comparisonMetric, setComparisonMetric] = useState<"cop" | "eer">(
    initialMetric ?? "cop",
  );
  const initialPairAttempted = useRef(false);
  const comparisonRevision = useRef(0);
  const [comparisonReport, setComparisonReport] =
    useState<ComparisonReport | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const result = comparisonReport?.comparison ?? null;

  const samsungByType = useMemo(
    () => selectedType ? samsung.filter((item) => item.type === selectedType) : [],
    [samsung, selectedType],
  );
  const directReadySamsung = useMemo(
    () =>
      samsungByType
        .map((item) => ({
          item,
          candidateCount: directCandidates(item, competitors, comparisonMetric).length,
        }))
        .filter(({ candidateCount }) => candidateCount > 0)
        .sort(
          (left, right) =>
            right.candidateCount - left.candidateCount ||
            left.item.model.localeCompare(right.item.model),
        ),
    [comparisonMetric, competitors, samsungByType],
  );
  const directReadyIds = useMemo(
    () => new Set(directReadySamsung.map(({ item }) => item.modelId)),
    [directReadySamsung],
  );
  const researchTargets = useMemo(
    () =>
      samsungByType
        .filter((item) => !directReadyIds.has(item.modelId))
        .map((item) =>
          comparisonResearchTarget(item, competitors, comparisonMetric),
        )
        .sort(
          (left, right) =>
            left.priority.localeCompare(right.priority) ||
            left.model.model.localeCompare(right.model.model),
        ),
    [comparisonMetric, competitors, directReadyIds, samsungByType],
  );
  const baseline = directReadySamsung
    .map(({ item }) => item)
    .find((item) => item.modelId === baselineId);
  const eligibleCandidates = useMemo(
    () => baseline
      ? directCandidates(baseline, competitors, comparisonMetric)
      : [],
    [baseline, comparisonMetric, competitors],
  );
  const candidate = eligibleCandidates.find((item) => item.modelId === candidateId);
  const readiness = useMemo(() => {
    if (!selectedType) {
      return { samsungCount: 0, readySamsungCount: 0, researchCount: 0, pairCount: 0 };
    }
    const typeSamsung = samsung.filter((item) => item.type === selectedType);
    const typeCompetitors = competitors.filter((item) => item.type === selectedType);
    const pairCounts = typeSamsung.map(
      (item) =>
        typeCompetitors.filter((competitorModel) =>
          isDirectComparisonCandidate(item, competitorModel, comparisonMetric),
        ).length,
    );
    return {
      samsungCount: typeSamsung.length,
      readySamsungCount: pairCounts.filter((count) => count > 0).length,
      researchCount: pairCounts.filter((count) => count === 0).length,
      pairCount: pairCounts.reduce((sum, count) => sum + count, 0),
    };
  }, [comparisonMetric, competitors, samsung, selectedType]);

  useEffect(() => {
    if (
      initialPairAttempted.current ||
      !initialBaselineId ||
      !initialCandidateId
    ) {
      return;
    }
    initialPairAttempted.current = true;
    const canRestorePair =
      eligibleCandidates.some((item) => item.modelId === initialCandidateId);
    if (!canRestorePair) {
      setCandidateId("");
      return;
    }
    let active = true;
    const requestRevision = ++comparisonRevision.current;
    setRunning(true);
    compareCatalogModelsWithReport(
      initialBaselineId!,
      initialCandidateId!,
      initialMetric ?? "cop",
    )
      .then((nextReport) => {
        if (
          active &&
          requestRevision === comparisonRevision.current &&
          reportMatchesSelection(
            nextReport,
            releaseId,
            initialBaselineId!,
            initialCandidateId!,
            initialMetric ?? "cop",
          )
        ) {
          setComparisonReport(nextReport);
        }
      })
      .catch((requestError) => {
        if (active && requestRevision === comparisonRevision.current) {
          setError(
            requestError instanceof Error ? requestError.message : String(requestError),
          );
        }
      })
      .finally(() => {
        if (active && requestRevision === comparisonRevision.current) {
          setRunning(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    eligibleCandidates,
    initialBaselineId,
    initialCandidateId,
    initialMetric,
    releaseId,
  ]);

  function invalidateComparison() {
    comparisonRevision.current += 1;
    setComparisonReport(null);
    setRunning(false);
  }

  function chooseType(type: CompressorType) {
    const typeSamsung = samsung.filter((item) => item.type === type);
    const hasDirectFor = (metricName: "cop" | "eer") =>
      typeSamsung.some(
        (item) => directCandidates(item, competitors, metricName).length > 0,
      );
    const nextMetric =
      !hasDirectFor(comparisonMetric) &&
      hasDirectFor(comparisonMetric === "cop" ? "eer" : "cop")
        ? comparisonMetric === "cop" ? "eer" : "cop"
        : comparisonMetric;
    invalidateComparison();
    setSelectedType(type);
    setComparisonMetric(nextMetric);
    setBaselineId("");
    setCandidateId("");
    setError("");
    writeQuery({ view: "compare" });
  }

  function chooseBaseline(modelId: string) {
    invalidateComparison();
    setBaselineId(modelId);
    setCandidateId("");
    setError("");
  }

  function chooseMetric(nextMetric: "cop" | "eer") {
    invalidateComparison();
    setComparisonMetric(nextMetric);
    setCandidateId("");
    setError("");
  }

  async function runComparison() {
    if (!baselineId || !candidateId) return;
    const snapshot = {
      baselineModelId: baselineId,
      candidateModelId: candidateId,
      metric: comparisonMetric,
    };
    const requestRevision = ++comparisonRevision.current;
    setRunning(true);
    setError("");
    setComparisonReport(null);
    try {
      const nextReport = await compareCatalogModelsWithReport(
        snapshot.baselineModelId,
        snapshot.candidateModelId,
        snapshot.metric,
      );
      if (requestRevision !== comparisonRevision.current) return;
      if (
        !reportMatchesSelection(
          nextReport,
          releaseId,
          snapshot.baselineModelId,
          snapshot.candidateModelId,
          snapshot.metric,
        )
      ) {
        setError("분석 응답의 Release·모델·지표가 현재 선택과 일치하지 않습니다.");
        return;
      }
      setComparisonReport(nextReport);
      writeQuery({
        view: "compare",
        baselineModelId: snapshot.baselineModelId,
        candidateModelId: snapshot.candidateModelId,
        metric: snapshot.metric,
      });
    } catch (requestError) {
      if (requestRevision === comparisonRevision.current) {
        setError(requestError instanceof Error ? requestError.message : String(requestError));
      }
    } finally {
      if (requestRevision === comparisonRevision.current) {
        setRunning(false);
      }
    }
  }

  return (
    <div className="view-stack">
      <PageHeading
        eyebrow="COMPARE LAB"
        title="같은 조건일 때만 직접 비교합니다"
        description="유형·냉매·측정조건·구동 분류와 용량 ±15%를 자동 점검합니다."
      />
      <div className="compare-report-entry" data-testid="compare-report-entry">
        <div>
          <strong>Samsung Re · Ro · Sc 전 모델 보고서</strong>
          <span>27개 모델의 직접 비교 결과와 공식자료 보완 대상을 한 번에 확인합니다.</span>
        </div>
        <a href="/compare-lab-output.html" target="_blank" rel="noreferrer">
          전체 비교 보고서 보기 ↗
        </a>
      </div>
      <section className="panel compare-setup">
        <div className="compare-setup-head">
          <div>
            <p className="section-kicker">STEP 01 · TYPE FIRST</p>
            <h3>먼저 압축기 유형을 선택하세요</h3>
          </div>
          <label className="metric-select">
            <span>비교 지표</span>
            <select
              aria-label="비교 지표"
              value={comparisonMetric}
              onChange={(event) => chooseMetric(event.target.value as "cop" | "eer")}
            >
              <option value="cop">COP</option>
              <option value="eer">EER</option>
            </select>
          </label>
        </div>
        <div
          className="type-tabs"
          role="tablist"
          aria-label="압축기 유형 선택"
          data-testid="compare-type-tabs"
        >
          {(["Re", "Ro", "Sc"] as CompressorType[]).map((type) => {
            const count = samsung.filter((item) => item.type === type).length;
            const directCount = samsung.filter(
              (item) =>
                item.type === type &&
                directCandidates(item, competitors, comparisonMetric).length > 0,
            ).length;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-label={`${type} ${TYPE_LABEL[type]}`}
                aria-selected={selectedType === type}
                className={selectedType === type ? `active type-${type}` : ""}
                onClick={() => chooseType(type)}
              >
                <strong>{type}</strong>
                <span>{TYPE_LABEL[type]}</span>
                <small>전체 {count} · 직접 {directCount}</small>
              </button>
            );
          })}
        </div>
        {!selectedType && (
          <div className="type-first-callout" data-testid="type-first-callout" role="status">
            <span>①</span>
            <div>
              <strong>위에서 Re · Ro · Sc 유형을 먼저 선택하세요</strong>
              <small>유형을 선택하면 직접 비교 가능한 Samsung 모델 카드만 바로 열립니다.</small>
            </div>
          </div>
        )}
        <div className="readiness-grid" data-testid="comparison-readiness">
          <div><span>선택 유형 Samsung</span><strong>{readiness.samsungCount}</strong></div>
          <div><span>직접 비교 가능 Samsung</span><strong>{readiness.readySamsungCount}</strong></div>
          <div><span>직접 비교 조합</span><strong>{readiness.pairCount}</strong></div>
          <div><span>공식 자료 리서치 대상</span><strong>{readiness.researchCount}</strong></div>
        </div>
        <div className="criteria-chips" aria-label="직접 비교 기준">
          <span>동일 유형</span><span>동일 냉매</span><span>동일 측정조건</span>
          <span>동일 구동</span><span>용량 ±15%</span><span>{comparisonMetric.toUpperCase()} 보유</span>
        </div>
      </section>
      <section className="compare-grid" data-testid="comparison-panel">
        <article className="panel selection-card">
          <div className="number-tag">02</div>
          <div className="model-picker-head">
            <span>Samsung 기준 모델</span>
            <b>{selectedType ? `${directReadySamsung.length}개` : "대기"}</b>
          </div>
          {!selectedType ? (
            <div className="picker-empty">
              <strong>① 유형 선택이 필요합니다</strong>
              <span>위의 Re · Ro · Sc 카드 중 하나를 눌러주세요.</span>
            </div>
          ) : directReadySamsung.length === 0 ? (
            <div className="picker-empty warning">
              <strong>직접 비교 가능한 Samsung 모델이 없습니다</strong>
              <span>{comparisonMetric.toUpperCase()} 기준 Research Queue를 확인하세요.</span>
            </div>
          ) : (
            <div
              className="model-choice-list"
              role="listbox"
              aria-label="Samsung 기준 모델"
            >
              {directReadySamsung.map(({ item, candidateCount }) => (
                <button
                  key={item.modelId}
                  type="button"
                  role="option"
                  aria-label={`Samsung 기준 모델 ${item.model}`}
                  aria-selected={baselineId === item.modelId}
                  className={baselineId === item.modelId ? "active" : ""}
                  data-testid="samsung-model-option"
                  data-model-id={item.modelId}
                  onClick={() => chooseBaseline(item.modelId)}
                >
                  <strong>{item.model}</strong>
                  <span>{item.refrigerant} · {item.condition} · {item.driveClass}</span>
                  <small>직접 후보 {candidateCount}개</small>
                </button>
              ))}
            </div>
          )}
          {baseline && <ModelMiniCard model={baseline} />}
        </article>
        <div className="compare-connector"><span>VS</span></div>
        <article className="panel selection-card">
          <div className="number-tag">03</div>
          <div className="model-picker-head">
            <span>경쟁 모델</span>
            <b data-testid="eligible-candidate-count">{eligibleCandidates.length}개</b>
          </div>
          {!baseline ? (
            <div className="picker-empty">
              <strong>② Samsung 모델을 먼저 선택하세요</strong>
              <span>선택한 기준 모델과 직접 비교 가능한 경쟁 모델만 표시됩니다.</span>
            </div>
          ) : eligibleCandidates.length === 0 ? (
            <div className="picker-empty warning" data-testid="no-direct-candidate">
              <strong>직접 비교 가능한 경쟁 모델이 없습니다</strong>
              <span>조건이 다른 모델은 숨겼습니다. Research Queue를 확인하세요.</span>
            </div>
          ) : (
            <div
              className="model-choice-list"
              role="listbox"
              aria-label="경쟁 모델"
            >
              {eligibleCandidates.map((item) => (
                <button
                  key={item.modelId}
                  type="button"
                  role="option"
                  aria-label={`경쟁 모델 ${item.manufacturer} ${item.model}`}
                  aria-selected={candidateId === item.modelId}
                  className={candidateId === item.modelId ? "active" : ""}
                  data-testid="competitor-model-option"
                  data-model-id={item.modelId}
                  onClick={() => {
                    invalidateComparison();
                    setCandidateId(item.modelId);
                    setError("");
                  }}
                >
                  <strong>{item.manufacturer} · {item.model}</strong>
                  <span>{item.refrigerant} · {item.condition} · {item.driveClass}</span>
                  <small>용량 {metric(capacityW(item), " W")}</small>
                </button>
              ))}
            </div>
          )}
          {candidate && <ModelMiniCard model={candidate} />}
        </article>
      </section>
      <button className="primary-button compare-button" disabled={!baselineId || !candidateId || running} onClick={runComparison}>
        {running ? "비교 규칙 확인 중…" : "안전 비교 실행"}
      </button>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {result ? (
        <section
          className={`comparison-result verdict-${result.verdict.toLowerCase()}`}
          role="status"
          data-testid="comparison-result"
          data-verdict={result.verdict}
          data-code={result.code}
        >
          <div className="verdict-mark">{result.verdict === "DIRECT" ? "✓" : result.verdict === "REFERENCE" ? "i" : "!"}</div>
          <div className="verdict-copy">
            <div className="verdict-title">
              <span data-testid="comparison-verdict"><StatusPill tone={result.verdict === "DIRECT" ? "good" : result.verdict === "REFERENCE" ? "warn" : "danger"}>{result.verdict}</StatusPill></span>
              <strong data-testid="comparison-code">{result.code}</strong>
            </div>
            <p data-testid="comparison-reason">{result.reason}</p>
            {result.verdict === "DIRECT" && result.rankingAllowed && (
              <div className="direct-metrics">
                <div><span>용량 차이</span><strong>{result.capacityDiffPct?.toFixed(2)}%</strong></div>
                <div data-testid="comparison-delta"><span>{result.metric.toUpperCase()} Δ</span><strong>{result.deltaPct?.toFixed(2)}%</strong></div>
                <div data-testid="comparison-ranking"><span>순위</span><strong>동일군 내 허용</strong></div>
              </div>
            )}
            {result.verdict !== "DIRECT" && result.rankingAllowed && (
              <p className="inline-error" role="alert">API 비교 판정이 안전 규칙과 충돌합니다.</p>
            )}
            {result.verdict !== "DIRECT" && (
              <div className="safety-note">직접 비교 수치를 표시하지 않습니다.</div>
            )}
          </div>
        </section>
      ) : (
        <section className="panel comparison-placeholder">
          <span className="state-icon">↔</span>
          <div><h3>두 모델을 선택해 비교 Gate를 실행하세요</h3><p>결과는 DIRECT, REFERENCE, BLOCKED 중 하나로 설명됩니다.</p></div>
        </section>
      )}
      {comparisonReport ? (
        <AnalysisReport
          report={comparisonReport}
          conditionLabel={
            baseline && candidate
              ? `${baseline.condition} · ${baseline.driveClass}`
              : undefined
          }
        />
      ) : null}
      {selectedType && researchTargets.length > 0 && (
        <section
          className="panel research-queue"
          data-testid="comparison-research-queue"
        >
          <div className="panel-title-row">
            <div>
              <p className="section-kicker">RESEARCH QUEUE</p>
              <h3>직접 비교 불가 Samsung 모델 · {researchTargets.length}개</h3>
            </div>
            <StatusPill tone="warn">공식 자료 필요</StatusPill>
          </div>
          <p className="research-intro">
            아래 비교 키와 용량 범위를 만족하는 경쟁사 카탈로그·데이터시트를
            우선 조사합니다. 판매처·블로그 수치는 Published 후보로 사용하지 않습니다.
          </p>
          <div className="research-target-grid">
            {researchTargets.map((target) => (
              <article
                key={target.model.modelId}
                data-research-model-id={target.model.modelId}
              >
                <div className="research-target-head">
                  <strong>{target.model.model}</strong>
                  <StatusPill tone={target.priority === "P1" ? "danger" : "warn"}>
                    {target.priority}
                  </StatusPill>
                </div>
                <p>{target.reason}</p>
                <dl>
                  <div><dt>필수 키</dt><dd>{target.model.refrigerant} · {target.model.condition} · {target.model.driveClass}</dd></div>
                  <div><dt>용량 목표</dt><dd>{target.capacityRange}</dd></div>
                  <div><dt>필수 지표</dt><dd>{comparisonMetric.toUpperCase()}</dd></div>
                  <div><dt>우선 조사사</dt><dd>{target.targetManufacturers.join(", ") || "동종 경쟁사 신규 조사"}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AnalysisReport({
  report,
  conditionLabel,
}: {
  report: ComparisonReport;
  conditionLabel?: string;
}) {
  const { analysis, comparison } = report;
  const performance = analysis.performanceInterpretation;
  const baselineName =
    analysis.evidenceRefs.find(
      (item) => item.modelId === analysis.baselineModelId,
    )?.model ?? "baseline";
  const candidateName =
    analysis.evidenceRefs.find(
      (item) => item.modelId === analysis.candidateModelId,
    )?.model ?? "candidate";
  const fileName = `compare-analysis-${baselineName}-${candidateName}-${analysis.metric}.json`;
  const downloadHref = `data:application/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(report, null, 2),
  )}`;
  const confidenceTone =
    analysis.evidenceConfidence.level === "High"
      ? "good"
      : analysis.evidenceConfidence.level === "Medium"
        ? "warn"
        : analysis.evidenceConfidence.level === "Low"
          ? "danger"
          : "neutral";

  return (
    <section
      className="analysis-report panel"
      data-testid="analysis-report"
      data-verdict={comparison.verdict}
      aria-label="비교 분석 리포트"
    >
      <div className="analysis-report-head">
        <div>
          <p className="section-kicker">COMPARE DECISION REPORT</p>
          <h3>카탈로그 근거 기반 추가 분석</h3>
          <p>{analysis.executiveSummary}</p>
        </div>
        <div className="analysis-report-actions">
          <a href={downloadHref} download={fileName}>
            JSON 내려받기
          </a>
          <button type="button" onClick={() => window.print()}>
            분석 인쇄 / PDF
          </button>
        </div>
      </div>

      <dl className="analysis-trace" data-testid="analysis-trace">
        <div><dt>Release</dt><dd>{report.releaseId}</dd></div>
        <div><dt>Samsung modelId</dt><dd>{analysis.baselineModelId}</dd></div>
        <div><dt>경쟁 modelId</dt><dd>{analysis.candidateModelId}</dd></div>
        <div><dt>지표</dt><dd>{analysis.metric.toUpperCase()}</dd></div>
      </dl>

      <div className="analysis-section-grid">
        <article data-testid="analysis-condition-safety">
          <div className="analysis-section-title">
            <span>01</span>
            <div><small>COMPARISON SAFETY</small><h4>비교 결론과 조건 안전성</h4></div>
          </div>
          <StatusPill
            tone={analysis.conditionSafety.status === "DIRECT_SAFE" ? "good" : "danger"}
          >
            {analysis.conditionSafety.status}
          </StatusPill>
          <p>{analysis.conditionSafety.summary}</p>
        </article>

        <article data-testid="analysis-performance">
          <div className="analysis-section-title">
            <span>02</span>
            <div><small>PERFORMANCE CONTEXT</small><h4>용량·효율 차이 해석</h4></div>
          </div>
          <p>{performance.summary}</p>
          {performance.allowed ? (
            <dl className="analysis-metrics">
              <div><dt>Samsung</dt><dd>{performance.baselineValue} {performance.metric.toUpperCase()}</dd></div>
              <div><dt>경쟁 모델</dt><dd>{performance.candidateValue} {performance.metric.toUpperCase()}</dd></div>
              <div><dt>용량 차이</dt><dd>{performance.capacityDiffPct?.toFixed(2)}%</dd></div>
              <div><dt>경쟁사 변화율</dt><dd>{performance.deltaPct?.toFixed(2)}%</dd></div>
            </dl>
          ) : (
            <div className="analysis-blocked-note">직접 비교 수치는 제공하지 않습니다.</div>
          )}
        </article>

        <article
          className="analysis-evidence-section"
          data-testid="analysis-evidence"
        >
          <div className="analysis-section-title">
            <span>03</span>
            <div><small>EVIDENCE CONFIDENCE</small><h4>데이터 신뢰도와 Evidence</h4></div>
          </div>
          <div className="analysis-confidence">
            <StatusPill tone={confidenceTone}>
              {analysis.evidenceConfidence.level}
            </StatusPill>
            <p>{analysis.evidenceConfidence.basis}</p>
          </div>
          <div className="analysis-evidence-grid">
            {analysis.evidenceRefs.map((ref) => (
              <div key={ref.modelId}>
                <strong>{ref.manufacturer} · {ref.model}</strong>
                <code>{ref.modelId}</code>
                <span>{ref.sourcePath}</span>
                <small>{ref.authority} · {ref.confidence} · {evidenceLocator(ref)}</small>
              </div>
            ))}
          </div>
        </article>

        <article data-testid="analysis-portfolio">
          <div className="analysis-section-title">
            <span>04</span>
            <div><small>PORTFOLIO SIGNAL</small><h4>포트폴리오 시사점</h4></div>
          </div>
          <ul>
            {analysis.portfolioImplications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article data-testid="analysis-actions">
          <div className="analysis-section-title">
            <span>05</span>
            <div><small>NEXT ACTION</small><h4>권장 후속 조치와 분석 한계</h4></div>
          </div>
          <h5>권장 조치</h5>
          <ul>
            {analysis.recommendedActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h5>분석 한계</h5>
          <ul className="analysis-limitations">
            {analysis.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
      <Suspense fallback={<div className="speed-loading">속도 분석 차트를 준비 중입니다.</div>}>
        <SpeedAnalysis
          analysis={report.speedAnalysis}
          conditionLabel={conditionLabel}
        />
      </Suspense>
    </section>
  );
}

function ModelMiniCard({ model }: { model: CatalogModel }) {
  return (
    <div className="model-mini">
      <div><span>유형</span><strong>{model.type} · {TYPE_LABEL[model.type]}</strong></div>
      <div><span>냉매</span><strong>{model.refrigerant}</strong></div>
      <div><span>조건</span><strong>{model.condition}</strong></div>
      <div><span>구동</span><strong>{model.driveClass}</strong></div>
      <div><span>용량</span><strong>{metric(model.specs?.capacityW, " W")}</strong></div>
      <div><span>COP</span><strong>{metric(model.specs?.cop)}</strong></div>
      <div><span>EER</span><strong>{metric(model.specs?.eer)}</strong></div>
    </div>
  );
}

function PortfolioGaps({
  models,
  gap,
}: {
  models: CatalogModel[];
  gap: PortfolioStatus;
}) {
  const refrigerants = ["R290", "R454B", "R32", "R410A", "R600a"];
  const types: CompressorType[] = ["Re", "Ro", "Sc"];
  function statusFor(refrigerant: string, type: CompressorType) {
    if (refrigerant === "R290" && type === "Re") return gap.status;
    const matches = models.filter((item) => item.manufacturer === "Samsung" && item.refrigerant === refrigerant && item.type === type);
    if (matches.some((item) => item.lifecycleStatus === "MASS_PRODUCT")) return "HAVE";
    if (matches.length) return "IN_PROGRESS";
    return "UNKNOWN";
  }

  return (
    <div className="view-stack">
      <PageHeading
        eyebrow="PORTFOLIO GAPS"
        title="GAP과 UNKNOWN을 구분합니다"
        description="미보유가 승인된 GAP만 공백으로 표시하고, 조사 미완료는 UNKNOWN으로 남깁니다."
      />
      <section className="panel matrix-panel">
        <div className="matrix-legend">
          <StatusPill tone="good">HAVE</StatusPill>
          <StatusPill tone="warn">IN PROGRESS</StatusPill>
          <StatusPill tone="danger">GAP</StatusPill>
          <StatusPill tone="neutral">UNKNOWN</StatusPill>
        </div>
        <div className="portfolio-matrix">
          <div className="matrix-corner">냉매 / 유형</div>
          {types.map((type) => <div className="matrix-head" key={type}><strong>{type}</strong><span>{TYPE_LABEL[type]}</span></div>)}
          {refrigerants.flatMap((refrigerant) => [
            <div className="matrix-refrigerant" key={`${refrigerant}-label`}><strong>{refrigerant}</strong></div>,
            ...types.map((type) => {
              const status = statusFor(refrigerant, type);
              return (
                <div className={`matrix-cell matrix-${status.toLowerCase().replace("_", "-")}`} key={`${refrigerant}-${type}`}>
                  <strong>{status}</strong>
                  <small>{models.filter((item) => item.manufacturer === "Samsung" && item.refrigerant === refrigerant && item.type === type).length} models</small>
                </div>
              );
            }),
          ])}
        </div>
      </section>
      <section className="split-grid">
        <article className="panel gap-detail">
          <div className="panel-title-row"><div><p className="section-kicker">APPROVED GAP</p><h3>R290 · Re 왕복동</h3></div><StatusPill tone="danger">P1</StatusPill></div>
          <p>Samsung R290 왕복동은 기준일 현재 미보유로 확정했습니다. Ro와 Sc 보유 상태에는 영향을 주지 않습니다.</p>
          <dl>
            <div><dt>판정</dt><dd data-testid="portfolio-status">{gap.status}</dd></div>
            <div><dt>Samsung 모델</dt><dd data-testid="samsung-models">{gap.samsungModels.length ? `${gap.samsungModels.length}건` : "없음"}</dd></div>
            <div><dt>경쟁 모델</dt><dd data-testid="competitor-models">{gap.competitorModels.length}건</dd></div>
            <div><dt>근거</dt><dd>{gap.evidence.sourcePath}</dd></div>
            <div><dt>화면 규칙</dt><dd>순위·Δ 없음</dd></div>
          </dl>
        </article>
        <article className="panel unknown-card">
          <p className="section-kicker">SAFETY RULE</p>
          <h3>UNKNOWN은 0이 아닙니다</h3>
          <p>공개 정보가 없거나 조사가 끝나지 않은 경우 수치를 0으로 채우지 않습니다. Evidence가 보강될 때까지 비교를 차단합니다.</p>
          <div className="rule-chips"><span>가짜 모델 금지</span><span>0값 대체 금지</span><span>자동 GAP 승격 금지</span></div>
        </article>
      </section>
    </div>
  );
}

function ReleaseEvidence({
  release,
  expansionBatch,
}: {
  release: ActiveRelease;
  expansionBatch: ExpansionBatch;
}) {
  return (
    <div className="view-stack">
      <PageHeading
        eyebrow="RELEASE / EVIDENCE"
        title="화면 수치가 어디에서 왔는지 추적합니다"
        description="활성 Release, 승인자, Git SHA, Bundle 해시와 검증 이슈를 함께 보관합니다."
      />
      <section className="release-banner" data-testid="active-release">
        <div className="release-seal"><span>✓</span></div>
        <div>
          <p>ACTIVE PUBLISHED RELEASE</p>
          <h3 data-testid="release-id">{release.releaseId}</h3>
          <span>Critical 0 · Major 0 · View-only</span>
        </div>
        <span data-testid="release-status"><StatusPill tone="good">{release.status}</StatusPill></span>
      </section>
      <section className="release-info-grid">
        <article className="panel lineage-card">
          <p className="section-kicker">LINEAGE</p>
          <h3>Release 추적 정보</h3>
          <dl>
            <div><dt>승인자</dt><dd>{release.approvedBy}</dd></div>
            <div><dt>활성화</dt><dd>{formatDate(release.activatedAt)}</dd></div>
            <div><dt>Data source SHA</dt><dd><code data-testid="source-commit">{release.sourceCommit}</code></dd></div>
            <div><dt>Application SHA</dt><dd><code data-testid="app-git-sha">{release.appGitSha ?? "Legacy release - 미기록"}</code></dd></div>
            <div><dt>Bundle SHA-256</dt><dd><code data-testid="release-hash">{release.dataSha256}</code></dd></div>
            <div><dt>이전 Release</dt><dd>{release.previousReleaseId ?? "최초 Release"}</dd></div>
          </dl>
        </article>
        <article className="panel">
          <div className="panel-title-row">
            <div><p className="section-kicker">VALIDATION</p><h3>검증 이슈</h3></div>
            <StatusPill tone={release.validationSummary.warningCount ? "warn" : "good"}>{release.validationSummary.warningCount} Warning</StatusPill>
          </div>
          <div className="issue-list">
            {release.validationSummary.issues.length ? release.validationSummary.issues.map((issue, index) => (
              <div className="issue-row" key={`${issue.code}-${index}`}>
                <span>!</span>
                <div><strong>{issue.code}</strong><p>{issue.message}</p><small>{issue.model_id ?? "bundle"}</small></div>
              </div>
            )) : <p className="empty-copy">검토할 이슈가 없습니다.</p>}
          </div>
        </article>
      </section>
      <section className="panel expansion-card" data-testid="expansion-batch">
        <div className="panel-title-row">
          <div>
            <p className="section-kicker">362-ROW EXPANSION · {expansionBatch.batchId}</p>
            <h3>{expansionBatch.title}</h3>
          </div>
          <StatusPill tone="accent">{expansionBatch.status}</StatusPill>
        </div>
        <p>
          공식 PDF p.{expansionBatch.source.page}의 Scroll 행을 검토용 후보로 분리했습니다.
          아직 Published Release에는 합치지 않았습니다.
        </p>
        <div className="expansion-stats">
          <div><span>원천 행</span><strong data-testid="expansion-total">{expansionBatch.counts.totalRows}</strong></div>
          <div><span>기존 모델 연결</span><strong>{expansionBatch.counts.overlapModels}</strong></div>
          <div><span>신규 후보</span><strong data-testid="expansion-new">{expansionBatch.counts.newCandidates}</strong></div>
          <div><span>조건 UNKNOWN</span><strong data-testid="expansion-unknown">{expansionBatch.counts.conditionUnknown}</strong></div>
        </div>
        <div className="expansion-footer">
          <span>비교 허용 0건 · {expansionBatch.publicationStatus}</span>
          <a href={`/source/Samsung-Compressor-Catalogue_2024.pdf#page=${expansionBatch.source.page}`} target="_blank" rel="noreferrer">
            공식 PDF p.{expansionBatch.source.page} 열기 →
          </a>
        </div>
      </section>
      <section className="panel view-only-contract" data-testid="read-only-notice">
        <div><span className="state-icon">◉</span><div><h3>View-first 운영 경계</h3><p>이 앱은 조회·점검 전용입니다. 데이터 수정과 Published 발행은 UI에서 제공하지 않습니다.</p></div></div>
        <ul><li>Staging 값 노출 금지</li><li>발행 실패 시 활성 Release 불변</li><li>승인자 메타데이터 표시</li></ul>
      </section>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(readQuery);
  const [view, setView] = useState<ViewId>(route.view);
  const [release, setRelease] = useState<ActiveRelease | null>(null);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [gap, setGap] = useState<PortfolioStatus | null>(null);
  const [expansionBatch, setExpansionBatch] = useState<ExpansionBatch | null>(null);
  const [error, setError] = useState("");
  const [refreshError, setRefreshError] = useState("");

  const loadData = useCallback((preserveCurrent: boolean) => {
    setRefreshError("");
    return Promise.all([
      getActiveRelease(),
      getModels(),
      getCriticalGap(),
      getExpansionBatch(),
    ])
      .then(([nextRelease, nextModels, nextGap, nextExpansionBatch]) => {
        setRelease(nextRelease);
        setModels(nextModels);
        setGap(nextGap);
        setExpansionBatch(nextExpansionBatch);
      })
      .catch((loadError) => {
        const message = loadError instanceof Error ? loadError.message : String(loadError);
        if (preserveCurrent) {
          setRefreshError(message);
        } else {
          setError(message);
        }
      });
  }, []);

  useEffect(() => {
    let active = true;
    if (active) void loadData(false);
    return () => { active = false; };
  }, [loadData]);

  useEffect(() => {
    function restoreRoute() {
      const nextRoute = readQuery();
      setRoute(nextRoute);
      setView(nextRoute.view);
    }
    window.addEventListener("popstate", restoreRoute);
    return () => window.removeEventListener("popstate", restoreRoute);
  }, []);

  function navigate(nextView: ViewId) {
    setView(nextView);
    setRoute({
      view: nextView,
      modelId: null,
      evidence: false,
      baselineModelId: null,
      candidateModelId: null,
      metric: "cop",
    });
    writeQuery({ view: nextView });
  }

  function openCompareReport() {
    const popup = window.open(
      "/compare-lab-output.html",
      "compareLabReport",
      "popup=yes,width=1440,height=960,resizable=yes,scrollbars=yes",
    );
    popup?.focus();
  }

  if (error) return <ErrorState message={error} />;
  if (!release || !gap || !expansionBatch) return <LoadingState />;

  return (
    <div className="app-shell" data-testid="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div><strong>Compressor</strong><small>CATALOG AUDIT</small></div>
        </div>
        <nav aria-label="주요 화면">
          {SIDEBAR_ITEMS.map((item, index) => (
            <button
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              aria-haspopup={item.id === "compare-report" ? "dialog" : undefined}
              className={view === item.id ? "active" : ""}
              data-testid={
                item.id === "compare-report" ? "nav-compare-report" : undefined
              }
              onClick={() =>
                item.id === "compare-report"
                  ? openCompareReport()
                  : navigate(item.id)
              }
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{item.label}</strong><small>{item.kicker}</small></div>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span data-testid="read-only-notice"><StatusPill tone="neutral">View-only</StatusPill></span>
          <p>데이터 편집·발행 미제공</p>
          <code>{shortHash(release.releaseId, 22)}</code>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p>COMPRESSOR INTELLIGENCE</p>
            <h1>Compressor Catalog Audit Studio</h1>
          </div>
          <div className="topbar-meta">
            <div data-testid="active-release"><span className="pulse-dot" /><div><small>Active release</small><strong data-testid="release-id">{release.releaseId}</strong></div></div>
            <span data-testid="release-status"><StatusPill tone="good">{release.status}</StatusPill></span>
            <code data-testid="release-hash" className="visually-hidden">{shortHash(release.dataSha256)}</code>
            <button className="text-button" onClick={() => void loadData(true)}>데이터 새로고침</button>
          </div>
        </header>
        <main className="content">
          {refreshError && <p className="inline-error" role="alert">기존 Published Release를 유지합니다: {refreshError}</p>}
          {view === "overview" && <Overview release={release} models={models} gap={gap} onNavigate={navigate} />}
          {view === "catalog" && <CatalogChecks release={release} models={models} initialModelId={route.modelId} initialEvidence={route.evidence} />}
          {view === "compare" && <CompareLab models={models} releaseId={release.releaseId} initialBaselineId={route.baselineModelId} initialCandidateId={route.candidateModelId} initialMetric={route.metric} />}
          {view === "portfolio" && <PortfolioGaps models={models} gap={gap} />}
          {view === "release" && <ReleaseEvidence release={release} expansionBatch={expansionBatch} />}
        </main>
      </div>
    </div>
  );
}
