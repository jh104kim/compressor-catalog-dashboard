"""Published Catalog API와 Studio 정적 빌드를 same-origin으로 제공한다."""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .api import create_app as create_api_app


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RELEASE_ROOT = ROOT / "catalog" / "published"
DEFAULT_RULES_PATH = ROOT / "config" / "p0_catalog_rules.json"
DEFAULT_STUDIO_DIST = ROOT / "studio" / "dist"
DEFAULT_SOURCE_PDF = ROOT / "data" / "Samsung-Compressor-Catalogue_2024.pdf"


def _safe_file(dist: Path, request_path: str) -> Path | None:
    candidate = (dist / request_path).resolve()
    if candidate != dist and dist not in candidate.parents:
        return None
    return candidate if candidate.is_file() else None


def create_runtime_app(
    *,
    release_root: Path = DEFAULT_RELEASE_ROOT,
    rules_path: Path = DEFAULT_RULES_PATH,
    studio_dist: Path = DEFAULT_STUDIO_DIST,
    source_pdf: Path = DEFAULT_SOURCE_PDF,
) -> FastAPI:
    """활성 Published Release와 빌드된 Studio만 읽는 Runtime을 만든다."""

    app = create_api_app(
        release_root=Path(release_root),
        rules_path=Path(rules_path),
    )
    app.add_middleware(GZipMiddleware, minimum_size=500)

    @app.api_route(
        "/api/{api_path:path}",
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        include_in_schema=False,
    )
    def missing_api(api_path: str):
        raise HTTPException(status_code=404, detail="API route not found.")

    dist = Path(studio_dist).resolve()
    assets = dist / "assets"
    if assets.is_dir():
        app.mount(
            "/assets",
            StaticFiles(directory=assets, check_dir=True),
            name="studio-assets",
        )

    @app.get(
        "/source/Samsung-Compressor-Catalogue_2024.pdf",
        include_in_schema=False,
    )
    def samsung_source_pdf():
        source = Path(source_pdf).resolve()
        if not source.is_file():
            raise HTTPException(status_code=404, detail="Source PDF not found.")
        return FileResponse(source, media_type="application/pdf")

    @app.get("/{request_path:path}", include_in_schema=False)
    def studio(request_path: str):
        normalized = request_path.lstrip("/")
        if normalized == "api" or normalized.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found.")
        if normalized == "assets" or normalized.startswith("assets/"):
            raise HTTPException(status_code=404, detail="Static asset not found.")

        requested = _safe_file(dist, normalized)
        if requested is not None:
            return FileResponse(requested)

        # 확장자가 있는 요청은 파일 요청이므로 SPA index로 숨기지 않는다.
        if normalized and Path(normalized).suffix:
            raise HTTPException(status_code=404, detail="Static file not found.")

        index = dist / "index.html"
        if not index.is_file():
            raise HTTPException(
                status_code=404,
                detail="Studio build가 없습니다. studio/dist를 먼저 빌드하세요.",
            )
        return FileResponse(index)

    return app
