from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


ROOT = Path(__file__).resolve().parents[1]
PUBLISH_SCRIPT = ROOT / "scripts" / "publish_catalog.py"
STAGING_BUNDLE = ROOT / "catalog" / "staging" / "catalog-bundle.json"
RULES = ROOT / "config" / "p0_catalog_rules.json"
SOURCE_COMMIT = "f142bcaba987408a766fcb6b3e20f8d431719e13"
APP_GIT_SHA = "3c1de57f8b6c95cdbf2181e6889b0ebc4e811834"


def _run_publish(
    *,
    bundle: Path,
    output_root: Path,
    release_id: str = "release:2026-07-30:901",
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [
            sys.executable,
            str(PUBLISH_SCRIPT),
            "--bundle",
            str(bundle),
            "--output-root",
            str(output_root),
            "--approved-by",
            "runtime-test-owner",
            "--approved-at",
            "2026-07-30T18:00:00+09:00",
            "--source-commit",
            SOURCE_COMMIT,
            "--app-git-sha",
            APP_GIT_SHA,
            "--release-id",
            release_id,
        ],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )


@pytest.fixture()
def published_root(tmp_path: Path) -> Path:
    assert PUBLISH_SCRIPT.is_file(), "발행 CLI가 필요합니다."
    root = tmp_path / "published"
    completed = _run_publish(bundle=STAGING_BUNDLE, output_root=root)
    assert completed.returncode == 0, completed.stderr or completed.stdout
    return root


@pytest.fixture()
def studio_dist(tmp_path: Path) -> Path:
    dist = tmp_path / "studio" / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text(
        "<!doctype html><title>Catalog Audit Studio</title><main>studio-shell</main>",
        encoding="utf-8",
    )
    (dist / "assets" / "app.js").write_text(
        "window.STUDIO_READY=true;",
        encoding="utf-8",
    )
    (dist / "manifest.json").write_text('{"name":"studio"}', encoding="utf-8")
    return dist


def _client(*, release_root: Path, studio_dist: Path) -> TestClient:
    from backend.catalog_audit.main import create_runtime_app

    return TestClient(
        create_runtime_app(
            release_root=release_root,
            rules_path=RULES,
            studio_dist=studio_dist,
        )
    )


def test_publish_cli_validates_and_publishes_to_requested_root(
    published_root: Path,
) -> None:
    active = json.loads(
        (published_root / "active-release.json").read_text(encoding="utf-8")
    )
    release_dir = published_root / "releases" / "release_2026-07-30_901"
    metadata = json.loads(
        (release_dir / "release.json").read_text(encoding="utf-8")
    )

    assert active["releaseId"] == "release:2026-07-30:901"
    assert metadata["approvedBy"] == "runtime-test-owner"
    assert metadata["sourceCommit"] == SOURCE_COMMIT
    assert metadata["appGitSha"] == APP_GIT_SHA
    assert active["appGitSha"] == APP_GIT_SHA
    assert metadata["validationSummary"]["status"] == "VALIDATED"
    assert metadata["validationSummary"]["criticalCount"] == 0
    assert metadata["validationSummary"]["majorCount"] == 0
    assert (release_dir / "bundle.json").is_file()


def test_publish_cli_rejects_invalid_bundle_without_active_release(
    tmp_path: Path,
) -> None:
    bundle = json.loads(STAGING_BUNDLE.read_text(encoding="utf-8"))
    target = next(
        item for item in bundle["models"] if item["model"] == "DS4BC7066FVT"
    )
    target["specs"]["cop"] = 3.34
    invalid_bundle = tmp_path / "invalid-bundle.json"
    invalid_bundle.write_text(
        json.dumps(bundle, ensure_ascii=False),
        encoding="utf-8",
    )
    output_root = tmp_path / "published"

    completed = _run_publish(bundle=invalid_bundle, output_root=output_root)

    assert completed.returncode != 0
    assert "AUTHORITY_VALUE_MISMATCH" in completed.stderr
    assert not (output_root / "active-release.json").exists()
    assert not (output_root / "releases").exists()


def test_runtime_serves_api_and_studio_from_same_origin(
    published_root: Path,
    studio_dist: Path,
) -> None:
    client = _client(release_root=published_root, studio_dist=studio_dist)

    root = client.get("/")
    deep_link = client.get("/catalog/models/model:samsung:DS4BC7066FVT")
    asset = client.get("/assets/app.js")
    manifest = client.get("/manifest.json")
    health = client.get("/api/v1/health")
    active = client.get("/api/v1/releases/active")
    source_pdf = client.get("/source/Samsung-Compressor-Catalogue_2024.pdf")

    assert root.status_code == 200
    assert "studio-shell" in root.text
    assert deep_link.status_code == 200
    assert "studio-shell" in deep_link.text
    assert asset.status_code == 200
    assert "STUDIO_READY" in asset.text
    assert manifest.status_code == 200
    assert manifest.json() == {"name": "studio"}
    assert health.status_code == 200
    assert health.json()["activeReleaseId"] == "release:2026-07-30:901"
    assert active.status_code == 200
    assert active.json()["counts"]["models"] == 68
    assert source_pdf.status_code == 200
    assert source_pdf.headers["content-type"].startswith("application/pdf")
    assert source_pdf.content.startswith(b"%PDF")


def test_api_and_static_misses_are_not_hidden_by_spa_fallback(
    published_root: Path,
    studio_dist: Path,
) -> None:
    client = _client(release_root=published_root, studio_dist=studio_dist)

    missing_api = client.get("/api/v1/not-found")
    missing_asset = client.get("/assets/missing.js")
    missing_file = client.get("/missing.js")
    publish_route = client.post("/api/v1/releases/publish")

    assert missing_api.status_code == 404
    assert "studio-shell" not in missing_api.text
    assert missing_api.headers["content-type"].startswith("application/json")
    assert missing_asset.status_code == 404
    assert "studio-shell" not in missing_asset.text
    assert missing_file.status_code == 404
    assert "studio-shell" not in missing_file.text
    assert publish_route.status_code == 404


def test_runtime_keeps_api_available_when_studio_build_is_missing(
    published_root: Path,
    tmp_path: Path,
) -> None:
    missing_dist = tmp_path / "missing-dist"
    client = _client(release_root=published_root, studio_dist=missing_dist)

    assert client.get("/api/v1/health").status_code == 200
    assert client.get("/").status_code == 404
