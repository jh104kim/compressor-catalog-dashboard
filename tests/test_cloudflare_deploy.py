from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys
import tomllib

ROOT = Path(__file__).resolve().parents[1]
WRANGLER_CONFIG = ROOT / "cloudflare" / "wrangler.toml"
PACKAGE = ROOT / "cloudflare" / "package.json"
WORKER = ROOT / "cloudflare" / "worker.js"
PREPARE = ROOT / "scripts" / "prepare_cloudflare_deploy.py"


def test_p19_wrangler_routes_api_before_spa_assets() -> None:
    config = tomllib.loads(WRANGLER_CONFIG.read_text(encoding="utf-8"))

    assert config["name"] == "samsung-compressor-catalog-dashboard"
    assert config["main"] == "worker.js"
    assert config["compatibility_flags"] == ["global_fetch_strictly_public"]
    assert config["assets"] == {
        "directory": "../studio/dist",
        "binding": "ASSETS",
        "not_found_handling": "single-page-application",
        "run_worker_first": ["/api/*"],
    }


def test_p19_lightweight_worker_has_no_runtime_dependencies() -> None:
    package = json.loads(PACKAGE.read_text(encoding="utf-8"))

    assert package["type"] == "module"
    assert package["scripts"]["test"] == "node --test worker.test.mjs"
    assert package.get("dependencies", {}) == {}
    assert package.get("devDependencies", {}) == {}
    assert WORKER.stat().st_size < 100_000


def test_p19_prepare_copies_verified_runtime_and_static_assets(
    tmp_path: Path,
) -> None:
    worker_root = tmp_path / "worker"
    studio_dist = tmp_path / "dist"
    studio_dist.mkdir()
    (studio_dist / "index.html").write_text("studio", encoding="utf-8")

    completed = subprocess.run(
        [
            sys.executable,
            str(PREPARE),
            "--worker-root",
            str(worker_root),
            "--studio-dist",
            str(studio_dist),
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )

    assert completed.returncode == 0, completed.stderr or completed.stdout
    runtime_root = studio_dist / "_runtime"
    active = json.loads((runtime_root / "active.json").read_text(encoding="utf-8"))
    catalog = json.loads((runtime_root / "catalog.json").read_text(encoding="utf-8"))
    release_diff = json.loads(
        (runtime_root / "release-diff.json").read_text(encoding="utf-8")
    )
    assert active["releaseId"] == "release:2026-08-03:001"
    assert active["status"] == "PUBLISHED"
    assert catalog["releaseId"] == active["releaseId"]
    assert catalog["count"] == 76
    assert release_diff["fromReleaseId"] == "release:2026-07-30:005"
    assert release_diff["toReleaseId"] == active["releaseId"]
    assert release_diff["summary"]["performanceMapChangedModels"] == 2
    assert (runtime_root / "rules.json").is_file()
    assert (runtime_root / "expansion-b1.json").is_file()
    assert not (worker_root / "backend").exists()
    assert not (worker_root / "runtime_data").exists()
    source_pdf = (
        studio_dist / "source" / "Samsung-Compressor-Catalogue_2024.pdf"
    )
    assert source_pdf.read_bytes().startswith(b"%PDF")
    assert (studio_dist / "legacy" / "index.html").is_file()
    assert "CLOUDFLARE_DEPLOY_PREPARED" in completed.stdout


def test_p19_worker_uses_javascript_fetch_without_write_routes() -> None:
    source = WORKER.read_text(encoding="utf-8")

    assert "export default" in source
    assert "async fetch(request, env)" in source
    assert "env.ASSETS.fetch" in source
    assert "compareModels" in source
    assert 'pathname === "/api/v1/releases/publish"' not in source
    assert 'pathname === "/api/v1/releases/rollback"' not in source
