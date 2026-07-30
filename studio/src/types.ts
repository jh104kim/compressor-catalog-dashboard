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

export interface ComparisonResult {
  releaseId: string;
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
