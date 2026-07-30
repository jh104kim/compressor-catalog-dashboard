import type {
  ActiveRelease,
  CatalogModel,
  ComparisonResult,
  EvidenceTrace,
  ExpansionBatch,
  PortfolioStatus,
} from "./types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`요청 실패 (${response.status}): ${url}`);
  }
  return (await response.json()) as T;
}

export function getActiveRelease(): Promise<ActiveRelease> {
  return requestJson<ActiveRelease>("/api/v1/releases/active");
}

export function getExpansionBatch(): Promise<ExpansionBatch> {
  return requestJson<ExpansionBatch>("/api/v1/expansion/batches/B1");
}

export async function getModels(): Promise<CatalogModel[]> {
  const payload = await requestJson<{ items: CatalogModel[] }>(
    "/api/v1/catalog/models",
  );
  return payload.items;
}

export function getCriticalGap(): Promise<PortfolioStatus> {
  return requestJson<PortfolioStatus>("/api/v1/portfolio/Re/R290");
}

export function compareCatalogModels(
  baselineModelId: string,
  candidateModelId: string,
  metric: "cop" | "eer" = "cop",
): Promise<ComparisonResult> {
  return requestJson<ComparisonResult>("/api/v1/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      baselineModelId,
      candidateModelId,
      metric,
    }),
  });
}

export function getEvidence(modelId: string): Promise<EvidenceTrace> {
  return requestJson<EvidenceTrace>(
    `/api/v1/evidence/${encodeURIComponent(modelId)}`,
  );
}
