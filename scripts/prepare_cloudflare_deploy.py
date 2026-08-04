"""Cloudflare 경량 Worker용 검증된 runtime JSON과 static assets를 준비한다."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import shutil
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.catalog_audit.release import (  # noqa: E402
    FileReleaseStore,
    ReleaseIntegrityError,
)
from backend.catalog_audit.expansion import load_expansion_batch  # noqa: E402
from backend.catalog_audit.release_diff import build_release_diff  # noqa: E402


DEFAULT_WORKER_ROOT = ROOT / "cloudflare"
DEFAULT_STUDIO_DIST = ROOT / "studio" / "dist"
PUBLISHED_ROOT = ROOT / "catalog" / "published"
EXPANSION_SOURCE = ROOT / "catalog" / "expansion" / "b1-scroll-p92.json"
RULES_SOURCE = ROOT / "config" / "p0_catalog_rules.json"
PDF_SOURCE = ROOT / "data" / "Samsung-Compressor-Catalogue_2024.pdf"
LEGACY_SOURCE = ROOT / "frontend"


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--worker-root", type=Path, default=DEFAULT_WORKER_ROOT)
    parser.add_argument("--studio-dist", type=Path, default=DEFAULT_STUDIO_DIST)
    return parser.parse_args(argv)


def _reset_generated(target: Path, *, parent: Path) -> None:
    resolved_target = target.resolve()
    resolved_parent = parent.resolve()
    if resolved_target.parent != resolved_parent:
        raise ValueError(f"생성 경로가 허용 범위를 벗어났습니다: {target}")
    if resolved_target.exists():
        shutil.rmtree(resolved_target)
    resolved_target.mkdir(parents=True)


def _verify_source_releases() -> tuple[str, str | None]:
    store = FileReleaseStore(PUBLISHED_ROOT)
    active = store.active_release()
    if active is None:
        raise ReleaseIntegrityError("활성 Published Release가 없습니다.")
    current = active["releaseId"]
    previous = active.get("rollbackFromReleaseId") or active.get(
        "previousReleaseId"
    )
    store.verify_release(current)
    if previous:
        store.verify_release(previous)
    return current, previous


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _release_dir(store: FileReleaseStore, release_id: str) -> Path:
    return store.release_path(release_id)


def _empty_diff(current_release: str) -> dict[str, Any]:
    return {
        "status": "FIRST_RELEASE",
        "fromReleaseId": None,
        "toReleaseId": current_release,
        "summary": {
            "addedModels": 0,
            "removedModels": 0,
            "changedModels": 0,
            "specChangedModels": 0,
            "evidenceChangedModels": 0,
            "performanceMapChangedModels": 0,
        },
        "addedModels": [],
        "removedModels": [],
        "changedModels": [],
        "integrity": {
            "currentVerified": True,
            "previousVerified": None,
        },
    }


def _runtime_payloads(
    current_release: str,
    previous_release: str | None,
) -> dict[str, dict[str, Any]]:
    store = FileReleaseStore(PUBLISHED_ROOT)
    active = _read_json(PUBLISHED_ROOT / "active-release.json")
    current_dir = _release_dir(store, current_release)
    release = _read_json(current_dir / "release.json")
    bundle = _read_json(current_dir / "bundle.json")

    active_payload = {
        **active,
        "status": release["status"],
        "sourceCommit": release["sourceCommit"],
        "appGitSha": release.get("appGitSha"),
        "validationSummary": release["validationSummary"],
        "counts": bundle["counts"],
        "asOf": bundle.get("asOf"),
    }
    catalog_payload = {
        "releaseId": current_release,
        "count": len(bundle["models"]),
        "items": bundle["models"],
    }

    if previous_release:
        previous_bundle = _read_json(
            _release_dir(store, previous_release) / "bundle.json"
        )
        release_diff = build_release_diff(
            from_release_id=previous_release,
            from_bundle=previous_bundle,
            to_release_id=current_release,
            to_bundle=bundle,
        )
        release_diff["integrity"] = {
            "currentVerified": True,
            "previousVerified": True,
        }
    else:
        release_diff = _empty_diff(current_release)

    return {
        "active.json": active_payload,
        "catalog.json": catalog_payload,
        "release-diff.json": release_diff,
        "rules.json": _read_json(RULES_SOURCE),
        "expansion-b1.json": load_expansion_batch(EXPANSION_SOURCE),
    }


def _write_runtime_assets(
    studio_dist: Path,
    payloads: dict[str, dict[str, Any]],
) -> Path:
    runtime_target = studio_dist / "_runtime"
    _reset_generated(runtime_target, parent=studio_dist)
    for filename, payload in payloads.items():
        (runtime_target / filename).write_text(
            json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
    return runtime_target


def _remove_python_worker_runtime(worker_root: Path) -> None:
    for name in ("backend", "runtime_data", "python_modules"):
        target = worker_root / name
        resolved_target = target.resolve()
        if resolved_target.parent != worker_root.resolve():
            raise ValueError(f"정리 경로가 허용 범위를 벗어났습니다: {target}")
        if target.exists():
            shutil.rmtree(target)


def _copy_static_assets(studio_dist: Path) -> None:
    if not (studio_dist / "index.html").is_file():
        raise FileNotFoundError(
            "studio/dist/index.html이 없습니다. production build를 먼저 실행하세요."
        )
    source_target = studio_dist / "source"
    source_target.mkdir(parents=True, exist_ok=True)
    shutil.copy2(PDF_SOURCE, source_target / PDF_SOURCE.name)

    legacy_target = studio_dist / "legacy"
    if legacy_target.exists():
        shutil.rmtree(legacy_target)
    shutil.copytree(
        LEGACY_SOURCE,
        legacy_target,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc"),
    )


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    worker_root = args.worker_root.resolve()
    studio_dist = args.studio_dist.resolve()
    worker_root.mkdir(parents=True, exist_ok=True)

    try:
        current_release, previous_release = _verify_source_releases()
        payloads = _runtime_payloads(current_release, previous_release)
        _write_runtime_assets(studio_dist, payloads)
        _remove_python_worker_runtime(worker_root)
        _copy_static_assets(studio_dist)
    except (OSError, ValueError, ReleaseIntegrityError) as exc:
        print(f"Cloudflare deploy preparation failed: {exc}", file=sys.stderr)
        return 1

    print(
        "CLOUDFLARE_DEPLOY_PREPARED "
        f"release={current_release} previous={previous_release or 'none'} "
        f"worker_root={worker_root} studio_dist={studio_dist}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
