from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field

from .comparison import compare_models
from .release import FileReleaseStore, ReleaseIntegrityError


class CompareRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    baseline_model_id: str = Field(alias="baselineModelId")
    candidate_model_id: str = Field(alias="candidateModelId")
    metric: Literal["cop", "eer"] = "cop"


class PublishedCatalog:
    def __init__(self, store: FileReleaseStore) -> None:
        self.store = store

    def read(self) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        active = self.store.active_release()
        if active is None:
            raise HTTPException(status_code=503, detail="활성 Published Release가 없습니다.")
        release_id = active["releaseId"]
        try:
            self.store.verify_release(release_id)
        except ReleaseIntegrityError as exc:
            raise HTTPException(
                status_code=503,
                detail="활성 Release 무결성 검증에 실패했습니다.",
            ) from exc
        release_dir = self.store.release_path(release_id)
        release = json.loads(
            (release_dir / "release.json").read_text(encoding="utf-8")
        )
        bundle = json.loads(
            (release_dir / "bundle.json").read_text(encoding="utf-8")
        )
        return active, release, bundle

    def model(self, model_id: str) -> tuple[dict[str, Any], str]:
        active, _, bundle = self.read()
        for item in bundle["models"]:
            if item["modelId"] == model_id:
                return item, active["releaseId"]
        raise HTTPException(status_code=404, detail="모델을 찾을 수 없습니다.")


def create_app(*, release_root: Path, rules_path: Path) -> FastAPI:
    store = FileReleaseStore(Path(release_root))
    catalog = PublishedCatalog(store)
    rules = json.loads(Path(rules_path).read_text(encoding="utf-8"))
    app = FastAPI(
        title="Samsung Compressor Catalog Audit API",
        version="0.1.0",
        description="활성 Published Release만 읽는 View-first API",
    )

    @app.get("/api/v1/health")
    def health() -> dict[str, Any]:
        active = store.active_release()
        return {
            "status": "ok",
            "activeReleaseId": active.get("releaseId") if active else None,
        }

    @app.get("/api/v1/releases/active")
    def active_release() -> dict[str, Any]:
        active, release, bundle = catalog.read()
        return {
            **active,
            "status": release["status"],
            "sourceCommit": release["sourceCommit"],
            "validationSummary": release["validationSummary"],
            "counts": bundle["counts"],
            "asOf": bundle.get("asOf"),
        }

    @app.get("/api/v1/catalog/models")
    def list_models(
        manufacturer: str | None = None,
        compressor_type: str | None = Query(default=None, alias="type"),
        refrigerant: str | None = None,
        condition: str | None = None,
        drive_class: str | None = Query(default=None, alias="driveClass"),
        search: str | None = None,
    ) -> dict[str, Any]:
        active, _, bundle = catalog.read()
        items = bundle["models"]
        filters = {
            "manufacturer": manufacturer,
            "type": compressor_type,
            "refrigerant": refrigerant,
            "condition": condition,
            "driveClass": drive_class,
        }
        for field, expected in filters.items():
            if expected is not None:
                items = [item for item in items if item.get(field) == expected]
        if search:
            needle = search.casefold()
            items = [
                item
                for item in items
                if needle in item["model"].casefold()
                or needle in item["manufacturer"].casefold()
            ]
        return {
            "releaseId": active["releaseId"],
            "count": len(items),
            "items": items,
        }

    @app.get("/api/v1/catalog/models/{model_id:path}")
    def get_model(model_id: str) -> dict[str, Any]:
        item, release_id = catalog.model(model_id)
        return {"releaseId": release_id, "item": item}

    @app.post("/api/v1/compare")
    def compare(request: CompareRequest) -> dict[str, Any]:
        baseline, release_id = catalog.model(request.baseline_model_id)
        candidate, _ = catalog.model(request.candidate_model_id)
        result = compare_models(
            baseline,
            candidate,
            metric=request.metric,
            capacity_tolerance_pct=rules["benchmark"][
                "similarityCapacityTolerancePct"
            ],
        )
        return {"releaseId": release_id, **result.to_dict()}

    @app.get("/api/v1/portfolio/{compressor_type}/{refrigerant}")
    def portfolio(compressor_type: str, refrigerant: str) -> dict[str, Any]:
        active, _, bundle = catalog.read()
        samsung_models = [
            item
            for item in bundle["models"]
            if item["manufacturer"] == "Samsung"
            and item["type"] == compressor_type
            and item["refrigerant"] == refrigerant
        ]
        if any(
            item.get("lifecycleStatus") == "MASS_PRODUCT"
            for item in samsung_models
        ):
            status = "HAVE"
        elif samsung_models:
            status = "IN_PROGRESS"
        else:
            configured = (
                rules.get("portfolio", {})
                .get(refrigerant, {})
                .get(compressor_type)
            )
            status = "GAP" if configured == "gap" else "UNKNOWN"
        return {
            "releaseId": active["releaseId"],
            "manufacturer": "Samsung",
            "type": compressor_type,
            "refrigerant": refrigerant,
            "status": status,
            "samsungModels": samsung_models,
            "rankingAllowed": False if status in {"GAP", "UNKNOWN"} else None,
            "evidence": {
                "sourcePath": "config/p0_catalog_rules.json",
                "locator": {
                    "kind": "json-path",
                    "path": f"portfolio.{refrigerant}.{compressor_type}",
                },
                "approvalBasis": "2026-07-30 user-confirmed recommended defaults",
            },
        }

    @app.get("/api/v1/evidence/{model_id:path}")
    def model_evidence(model_id: str) -> dict[str, Any]:
        item, release_id = catalog.model(model_id)
        return {
            "releaseId": release_id,
            "modelId": model_id,
            "evidence": item["evidence"],
            "supportingEvidence": item.get("supportingEvidence", []),
        }

    return app
