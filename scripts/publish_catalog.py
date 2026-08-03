"""검증된 Catalog Staging Bundle을 불변 Published Release로 발행한다."""

from __future__ import annotations

import argparse
from datetime import datetime
import json
from pathlib import Path
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.catalog_audit.release import (  # noqa: E402
    FileReleaseStore,
    ReleaseGateError,
    ReleaseIntegrityError,
)
from backend.catalog_audit.validation import CatalogValidator  # noqa: E402


DEFAULT_BUNDLE = ROOT / "catalog" / "staging" / "catalog-bundle.json"
DEFAULT_OUTPUT_ROOT = ROOT / "catalog" / "published"
DEFAULT_SCHEMA = ROOT / "data" / "contracts" / "catalog.schema.json"
DEFAULT_RULES = ROOT / "config" / "p0_catalog_rules.json"


def _approved_at(value: str) -> str:
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError(
            "approved-at은 ISO 8601 형식이어야 합니다."
        ) from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise argparse.ArgumentTypeError(
            "approved-at에는 UTC offset이 포함되어야 합니다."
        )
    return value


def _load_json(path: Path) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{path}의 최상위 값은 object여야 합니다.")
    return value


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA)
    parser.add_argument("--rules", type=Path, default=DEFAULT_RULES)
    parser.add_argument("--approved-by", required=True)
    parser.add_argument("--approved-at", required=True, type=_approved_at)
    parser.add_argument("--source-commit", required=True)
    parser.add_argument("--app-git-sha", required=True)
    parser.add_argument("--release-id", required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    # 파이프·CI에서도 Windows 로캘(cp949)에 영향받지 않도록 출력 계약을 UTF-8로 고정한다.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")

    args = parse_args(argv)
    try:
        bundle = _load_json(args.bundle)
        validator = CatalogValidator(
            schema_path=args.schema,
            rules_path=args.rules,
        )
        validation = validator.validate(bundle)
        if validation.status != "VALIDATED":
            print(
                json.dumps(
                    {
                        "ok": False,
                        "error": "Catalog validation rejected the bundle.",
                        "validation": validation.to_dict(),
                    },
                    ensure_ascii=False,
                    sort_keys=True,
                ),
                file=sys.stderr,
            )
            return 2

        store = FileReleaseStore(args.output_root)
        metadata = store.publish(
            bundle=bundle,
            validation=validation,
            release_id=args.release_id,
            approved_by=args.approved_by,
            approved_at=args.approved_at,
            source_commit=args.source_commit,
            app_git_sha=args.app_git_sha,
        )
    except (
        json.JSONDecodeError,
        OSError,
        ValueError,
        ReleaseGateError,
        ReleaseIntegrityError,
    ) as exc:
        print(f"publish failed: {exc}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "ok": True,
                "release": metadata,
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
