export type CompressorType = "Re" | "Ro" | "Sc";
export type Verdict = "DIRECT" | "REFERENCE" | "BLOCKED";

export interface Evidence {
  evidenceId?: string;
  sourcePath: string;
  authority: "official" | "secondary" | "research";
  locator: {
    kind: string;
    page?: number;
    section?: string;
    url?: string;
    accessedAt?: string;
  };
  fieldPaths: string[];
  note?: string | null;
}

export interface CatalogModel {
  modelId: string;
  model: string;
  manufacturer: string;
  type: CompressorType;
  application?: string | null;
  refrigerant: string;
  condition: string;
  driveClass: string;
  driveDetail?: string | null;
  lifecycleStatus: "MASS_PRODUCT" | "IN_PROGRESS";
  sourceLayer:
    | "samsung_catalog_2024"
    | "samsung_legacy_research"
    | "post_catalog"
    | "competitor_research";
  postCatalog: boolean;
  confidence: "High" | "Medium" | "Low" | "Unknown";
  specs?: {
    displacementCc?: number | null;
    capacityW?: number | null;
    capacityBtuH?: number | null;
    inputW?: number | null;
    cop?: number | null;
    eer?: number | null;
  };
  evidence: Evidence;
  supportingEvidence?: Evidence[];
}

export interface ValidationIssue {
  code: string;
  severity: "Critical" | "Major" | "Warning";
  message: string;
  model_id?: string;
  field_path?: string;
}

export interface ActiveRelease {
  releaseId: string;
  status: "PUBLISHED";
  activatedAt: string;
  approvedBy: string;
  dataSha256: string;
  sourceCommit: string;
  appGitSha?: string | null;
  previousReleaseId?: string | null;
  asOf?: string | null;
  counts: {
    models: number;
    samsungModels: number;
    competitorModels: number;
  };
  validationSummary: {
    criticalCount: number;
    majorCount: number;
    warningCount: number;
    issues: ValidationIssue[];
  };
}

export interface ExpansionBatch {
  batchId: "B1";
  title: string;
  status: "SOURCE_VERIFIED";
  publicationStatus: "NOT_PUBLISHED";
  review: {
    reviewedAt: string;
    method: string;
    conditionDecision: string;
  };
  source: {
    pdfPath: string;
    pdfSha256: string;
    parsedPath: string;
    parsedSha256: string;
    page: number;
  };
  counts: {
    totalRows: number;
    uniqueModels: number;
    overlapModels: number;
    newCandidates: number;
    conditionUnknown: number;
  };
  rows: Array<{
    catalogRowId: string;
    model: string;
    existingModelId?: string | null;
    condition: "UNKNOWN";
    comparisonEligible: false;
  }>;
}

export interface ComparisonResult {
  releaseId?: string;
  verdict: Verdict;
  code: string;
  reason: string;
  baselineModelId: string;
  candidateModelId: string;
  metric: string;
  capacityDiffPct: number | null;
  deltaPct: number | null;
  rankingAllowed: boolean;
  normalizedBaselineMetric?: number | null;
  normalizedCandidateMetric?: number | null;
}

export interface ComparisonEvidenceRef {
  modelId: string;
  manufacturer: string;
  model: string;
  sourcePath: string;
  authority: string;
  confidence: string;
  locator: {
    kind?: string;
    page?: number;
    section?: string;
    url?: string;
  };
  fieldPaths: string[];
}

export interface ComparisonAnalysis {
  releaseId: string;
  baselineModelId: string;
  candidateModelId: string;
  metric: "cop" | "eer";
  executiveSummary: string;
  conditionSafety: {
    status: "DIRECT_SAFE" | "REFERENCE_ONLY" | "COMPARISON_BLOCKED";
    summary: string;
  };
  performanceInterpretation: {
    allowed: boolean;
    metric: "cop" | "eer";
    baselineValue: number | null;
    candidateValue: number | null;
    capacityDiffPct: number | null;
    deltaPct: number | null;
    direction:
      | "BASELINE_HIGHER"
      | "CANDIDATE_HIGHER"
      | "EQUAL"
      | "NOT_ASSESSED";
    summary: string;
  };
  evidenceConfidence: {
    level: "High" | "Medium" | "Low" | "Unknown";
    basis: string;
    baselineAuthority: string;
    candidateAuthority: string;
    baselineConfidence: string;
    candidateConfidence: string;
  };
  portfolioImplications: string[];
  recommendedActions: string[];
  limitations: string[];
  evidenceRefs: ComparisonEvidenceRef[];
}

export type SpeedMetric = "capacityW" | "inputW" | "cop" | "eer";
export type SpeedUnit = "rpm" | "rps";

export interface SpeedPerformancePoint {
  speedValue: number;
  speedUnit: SpeedUnit;
  rpm: number;
  rps: number;
  capacityW: number | null;
  inputW: number | null;
  cop: number | null;
  eer: number | null;
  valueKind: "MEASURED" | "DERIVED";
  evidence: Evidence & { evidenceId: string };
}

export interface SpeedPerformanceSeries {
  role: "baseline" | "candidate";
  modelId: string;
  manufacturer: string;
  model: string;
  pointCount: number;
  lineEligible: boolean;
  points: SpeedPerformancePoint[];
}

export interface SpeedAnalysisResult {
  status:
    | "CURVE_READY"
    | "POINT_READY"
    | "REFERENCE_ONLY"
    | "DATA_REQUIRED";
  chartEligible: boolean;
  rankingAllowed: boolean;
  reason: string;
  metricOptions: SpeedMetric[];
  commonRange: {
    rpm: { min: number; max: number };
    rps: { min: number; max: number };
  } | null;
  series: SpeedPerformanceSeries[];
  safeguards: {
    interpolation: false;
    extrapolation: false;
    hzAsSpeed: false;
  };
}

export interface ComparisonReport {
  releaseId: string;
  comparison: ComparisonResult;
  analysis: ComparisonAnalysis;
  speedAnalysis: SpeedAnalysisResult;
}

export interface PortfolioStatus {
  releaseId: string;
  manufacturer: "Samsung";
  type: CompressorType;
  refrigerant: string;
  status: "HAVE" | "IN_PROGRESS" | "GAP" | "UNKNOWN";
  samsungModels: CatalogModel[];
  competitorModels: CatalogModel[];
  rankingAllowed: boolean | null;
  evidence: {
    sourcePath: string;
  };
}

export interface EvidenceTrace {
  releaseId: string;
  modelId: string;
  evidence: Evidence;
  supportingEvidence: Evidence[];
}
