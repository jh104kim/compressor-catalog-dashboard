import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  compareCatalogModels,
  getActiveRelease,
  getCriticalGap,
  getEvidence,
  getExpansionBatch,
  getModels,
} from "./api";
import type {
  ActiveRelease,
  CatalogModel,
  ComparisonResult,
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
  initialBaselineId,
  initialCandidateId,
  initialMetric,
}: {
  models: CatalogModel[];
  initialBaselineId?: string | null;
  initialCandidateId?: string | null;
  initialMetric?: "cop" | "eer";
}) {
  const samsung = useMemo(() => models.filter((item) => item.manufacturer === "Samsung"), [models]);
  const competitors = useMemo(() => models.filter((item) => item.manufacturer !== "Samsung"), [models]);
  const [baselineId, setBaselineId] = useState(
    initialBaselineId ?? samsung[0]?.modelId ?? "",
  );
  const [candidateId, setCandidateId] = useState(
    initialCandidateId ?? competitors[0]?.modelId ?? "",
  );
  const [comparisonMetric, setComparisonMetric] = useState<"cop" | "eer">(
    initialMetric ?? "cop",
  );
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!baselineId && samsung[0]) setBaselineId(samsung[0].modelId);
    if (!candidateId && competitors[0]) setCandidateId(competitors[0].modelId);
  }, [baselineId, candidateId, competitors, samsung]);

  useEffect(() => {
    if (!initialBaselineId || !initialCandidateId) return;
    let active = true;
    setRunning(true);
    compareCatalogModels(
      initialBaselineId,
      initialCandidateId,
      initialMetric ?? "cop",
    )
      .then((nextResult) => {
        if (active) setResult(nextResult);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error ? requestError.message : String(requestError),
          );
        }
      })
      .finally(() => {
        if (active) setRunning(false);
      });
    return () => {
      active = false;
    };
  }, [initialBaselineId, initialCandidateId, initialMetric]);

  const baseline = samsung.find((item) => item.modelId === baselineId);
  const candidate = competitors.find((item) => item.modelId === candidateId);

  async function runComparison() {
    if (!baselineId || !candidateId) return;
    setRunning(true);
    setError("");
    setResult(null);
    try {
      setResult(await compareCatalogModels(baselineId, candidateId, comparisonMetric));
      writeQuery({
        view: "compare",
        baselineModelId: baselineId,
        candidateModelId: candidateId,
        metric: comparisonMetric,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="view-stack">
      <PageHeading
        eyebrow="COMPARE LAB"
        title="같은 조건일 때만 직접 비교합니다"
        description="유형·냉매·측정조건·구동 분류와 용량 ±15%를 자동 점검합니다."
      />
      <section className="compare-grid" data-testid="comparison-panel">
        <article className="panel selection-card">
          <div className="number-tag">01</div>
          <label>
            <span>Samsung 기준 모델</span>
            <select aria-label="Samsung 기준 모델" value={baselineId} onChange={(event) => { setBaselineId(event.target.value); setResult(null); }}>
              {samsung.map((item) => <option key={item.modelId} value={item.modelId}>{item.model} · {item.refrigerant} · {item.condition}</option>)}
            </select>
          </label>
          {baseline && <ModelMiniCard model={baseline} />}
        </article>
        <div className="compare-connector"><span>VS</span></div>
        <article className="panel selection-card">
          <div className="number-tag">02</div>
          <label>
            <span>경쟁 모델</span>
            <select aria-label="경쟁 모델" value={candidateId} onChange={(event) => { setCandidateId(event.target.value); setResult(null); }}>
              {competitors.map((item) => <option key={item.modelId} value={item.modelId} data-candidate-id={item.modelId}>{item.manufacturer} · {item.model} · {item.condition}</option>)}
            </select>
          </label>
          {candidate && <ModelMiniCard model={candidate} />}
        </article>
      </section>
      <label className="metric-select">
        <span>비교 지표</span>
        <select aria-label="비교 지표" value={comparisonMetric} onChange={(event) => { setComparisonMetric(event.target.value as "cop" | "eer"); setResult(null); }}>
          <option value="cop">COP</option>
          <option value="eer">EER</option>
        </select>
      </label>
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
              <div className="safety-note">순위·성능 차이·우열 문구를 표시하지 않습니다.</div>
            )}
          </div>
        </section>
      ) : (
        <section className="panel comparison-placeholder">
          <span className="state-icon">↔</span>
          <div><h3>두 모델을 선택해 비교 Gate를 실행하세요</h3><p>결과는 DIRECT, REFERENCE, BLOCKED 중 하나로 설명됩니다.</p></div>
        </section>
      )}
    </div>
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
          {NAV_ITEMS.map((item, index) => (
            <button
              key={item.id}
              aria-current={view === item.id ? "page" : undefined}
              className={view === item.id ? "active" : ""}
              onClick={() => navigate(item.id)}
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
          {view === "compare" && <CompareLab models={models} initialBaselineId={route.baselineModelId} initialCandidateId={route.candidateModelId} initialMetric={route.metric} />}
          {view === "portfolio" && <PortfolioGaps models={models} gap={gap} />}
          {view === "release" && <ReleaseEvidence release={release} expansionBatch={expansionBatch} />}
        </main>
      </div>
    </div>
  );
}
