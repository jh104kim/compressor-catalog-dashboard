"""기존 compressor-data.js 모델을 결정론적 Staging Bundle로 이관한다."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "frontend" / "compressor-data.js"
DEFAULT_OUTPUT = ROOT / "catalog" / "staging" / "catalog-bundle.json"

NODE_EXTRACTOR = r"""
const fs = require("fs");
const vm = require("vm");
const sourcePath = process.argv[1];
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(sourcePath, "utf8"), context, {
  filename: sourcePath,
});
const data = context.window.COMPRESSOR_DATA;
if (!data || !Array.isArray(data.models)) {
  throw new Error("window.COMPRESSOR_DATA.models를 찾을 수 없습니다.");
}
process.stdout.write(JSON.stringify({ meta: data.meta, models: data.models }));
"""

EVIDENCE_FIELDS = [
    "model",
    "manufacturer",
    "type",
    "refrigerant",
    "condition",
    "driveClass",
    "lifecycleStatus",
    "specs",
]


class MigrationError(RuntimeError):
    """입력 계약을 안전하게 이관할 수 없을 때 발생한다."""


def _slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    if not slug:
        raise MigrationError(f"ID를 만들 수 없는 값입니다: {value!r}")
    return slug


def _read_source(source: Path) -> dict[str, Any]:
    try:
        completed = subprocess.run(
            ["node", "-e", NODE_EXTRACTOR, str(source)],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
        )
    except FileNotFoundError as exc:
        raise MigrationError("Node.js가 없어 compressor-data.js를 읽을 수 없습니다.") from exc

    if completed.returncode != 0:
        raise MigrationError(completed.stderr.strip() or "JavaScript 추출 실패")
    try:
        value = json.loads(completed.stdout)
    except json.JSONDecodeError as exc:
        raise MigrationError("JavaScript 추출 결과가 JSON이 아닙니다.") from exc
    if not isinstance(value, dict) or not isinstance(value.get("models"), list):
        raise MigrationError("추출 결과에 models 배열이 없습니다.")
    return value


def _drive_class(drive: str) -> str:
    if drive.startswith("Fixed"):
        return "Fixed"
    if drive == "BLDC" or drive.startswith("Variable"):
        return "Variable"
    return "Unknown"


def _source_path(segment: str) -> str:
    lowered = segment.casefold()
    if lowered.startswith("non-lg-official"):
        return "data/20260730-non-lg-competitor-official-research.md"
    if "2024 catalogue" in lowered:
        if re.search(r"\bp\.\s*\d+", segment, re.IGNORECASE):
            return "data/Samsung-Compressor-Catalogue_2024.pdf"
        return "data/samsung-catalogue-2024-parsed.md"
    if "lg scroll catalog" in lowered:
        return "data/압축기 SSOT 보완 조사 결과 보고서.md"
    if "deepresearch-r454b-scroll-tier1" in lowered:
        return "data/20260619-deepresearch-r454b-scroll-tier1.md"
    if "perplexity normalization" in lowered or lowered.startswith("normalization"):
        return "data/20260617-perplexity-r454b-scroll-normalization.md"
    if lowered.startswith("gmcc") or "gmcc catalog" in lowered:
        return "data/20260617-perplexity-gmcc-r454b-scroll-specs.md"
    if lowered.startswith("followup"):
        return "data/20260617-perplexity-compressor-followup-r454b-r290-regulations.md"
    if lowered.startswith("보완보고서"):
        return "data/압축기 SSOT 보완 조사 결과 보고서.md"
    if lowered.startswith("r290"):
        return "data/20260617-perplexity-r290-re-benchmark-competitors.md"
    if lowered.startswith("report"):
        return "data/compressor_deep_research_report.md"
    return "data/compressor_deep_research_report.md"


def _authority(
    *, manufacturer: str, source_layer: str, segment: str
) -> str:
    if manufacturer == "Samsung" and source_layer == "samsung_catalog_2024":
        return "official"
    if source_layer == "samsung_legacy_research":
        return "secondary"
    lowered = segment.casefold()
    if lowered.startswith("non-lg-official"):
        return "official"
    if "catalog" in lowered or "dsc167-en" in lowered:
        return "official"
    if "report" in lowered or "보완보고서" in lowered:
        return "secondary"
    return "research"


def _locator(segment: str, source_path: str) -> dict[str, Any]:
    page_match = re.search(r"\bp\.\s*(\d+)", segment, re.IGNORECASE)
    if page_match and source_path.lower().endswith(".pdf"):
        return {"kind": "pdf-page", "page": int(page_match.group(1))}

    if "2024 catalogue (Re)" in segment:
        section = "Reciprocating"
    else:
        section = segment.strip()
    return {"kind": "markdown-section", "section": section}


def _evidence(
    *,
    model_id: str,
    manufacturer: str,
    source_layer: str,
    segment: str,
    note: str,
) -> dict[str, Any]:
    source_path = _source_path(segment)
    digest = hashlib.sha256(f"{model_id}|{segment}".encode("utf-8")).hexdigest()[:12]
    return {
        "evidenceId": f"evidence:{_slug(model_id)}:{digest}",
        "sourcePath": source_path,
        "authority": _authority(
            manufacturer=manufacturer,
            source_layer=source_layer,
            segment=segment,
        ),
        "locator": _locator(segment, source_path),
        "fieldPaths": EVIDENCE_FIELDS,
        "note": note,
    }


def _canonical_model(raw: dict[str, Any]) -> dict[str, Any]:
    required = (
        "model",
        "mfr",
        "type",
        "refrigerant",
        "drive",
        "condition",
        "status",
        "src",
    )
    missing = [field for field in required if field not in raw]
    if missing:
        raise MigrationError(
            f"{raw.get('model', '<unknown>')}: 필수 원본 필드 누락 {missing}"
        )

    manufacturer = str(raw["mfr"])
    model = str(raw["model"])
    model_id = f"model:{_slug(manufacturer)}:{model}"
    post_catalog = bool(raw.get("postCatalog", False))
    legacy_source = str(raw["src"])
    if manufacturer == "Samsung":
        if post_catalog:
            source_layer = "post_catalog"
        elif re.search(r"2024 catalogue p\.\s*\d+", legacy_source, re.IGNORECASE):
            source_layer = "samsung_catalog_2024"
        else:
            source_layer = "samsung_legacy_research"
    else:
        if post_catalog:
            raise MigrationError(f"{model}: 경쟁사 모델에 postCatalog=true")
        source_layer = "competitor_research"

    segments = [item.strip() for item in legacy_source.split(" / ") if item.strip()]
    if not segments:
        raise MigrationError(f"{model}: src가 비어 있습니다.")
    if source_layer == "samsung_legacy_research":
        research_segments = [
            segment
            for segment in segments
            if segment.casefold().startswith("report")
        ]
        if research_segments:
            segments = research_segments
    evidence_items = [
        _evidence(
            model_id=model_id,
            manufacturer=manufacturer,
            source_layer=source_layer,
            segment=segment,
            note=legacy_source if index == 0 else segment,
        )
        for index, segment in enumerate(segments)
    ]

    lifecycle = {"양산": "MASS_PRODUCT", "개발중": "IN_PROGRESS"}.get(
        str(raw["status"])
    )
    if lifecycle is None:
        raise MigrationError(f"{model}: 알 수 없는 status {raw['status']!r}")

    result: dict[str, Any] = {
        "modelId": model_id,
        "model": model,
        "manufacturer": manufacturer,
        "type": raw["type"],
        "application": raw.get("app"),
        "refrigerant": raw["refrigerant"],
        "condition": "UNKNOWN" if raw["condition"] == "미확인" else raw["condition"],
        "driveClass": _drive_class(str(raw["drive"])),
        "driveDetail": raw["drive"],
        "lifecycleStatus": lifecycle,
        "sourceLayer": source_layer,
        "postCatalog": post_catalog,
        "confidence": raw.get("confidence", "Unknown"),
        "specs": {
            "displacementCc": raw.get("cc"),
            "capacityW": raw.get("capW"),
            "capacityBtuH": raw.get("capBtu"),
            "inputW": raw.get("inputW"),
            "cop": raw.get("cop"),
            "eer": raw.get("eer"),
        },
        "evidence": evidence_items[0],
    }
    if len(evidence_items) > 1:
        result["supportingEvidence"] = evidence_items[1:]
    if raw.get("nameNote") is not None:
        result["nameNote"] = raw["nameNote"]
    if raw.get("aliases") is not None:
        result["aliases"] = raw["aliases"]
    return result


def build_bundle(source: Path) -> dict[str, Any]:
    source = source.resolve()
    extracted = _read_source(source)
    raw_models = extracted["models"]
    canonical = [_canonical_model(raw) for raw in raw_models]
    canonical.sort(key=lambda item: item["modelId"])

    model_ids = [item["modelId"] for item in canonical]
    if len(model_ids) != len(set(model_ids)):
        raise MigrationError("정규화 modelId가 중복됩니다.")
    raw_by_model = {str(item["model"]): item for item in raw_models}
    if len(raw_by_model) != len(raw_models):
        raise MigrationError("원본 model 값이 중복됩니다.")

    source_records = [
        {"modelId": item["modelId"], "raw": raw_by_model[item["model"]]}
        for item in canonical
    ]
    source_bytes = source.read_bytes()
    source_sha = hashlib.sha256(source_bytes).hexdigest()
    meta = extracted.get("meta") or {}
    try:
        source_relative = source.relative_to(ROOT).as_posix()
    except ValueError:
        source_relative = source.as_posix()

    samsung_count = sum(
        item["manufacturer"] == "Samsung" for item in canonical
    )
    return {
        "schemaVersion": "1.0.0",
        "bundleId": f"catalog-staging:{meta.get('asOf', 'unknown')}:{source_sha[:12]}",
        "stage": "STAGING",
        "asOf": meta.get("asOf"),
        "source": {
            "path": source_relative,
            "sha256": source_sha,
        },
        "counts": {
            "models": len(canonical),
            "samsungModels": samsung_count,
            "competitorModels": len(canonical) - samsung_count,
        },
        "models": canonical,
        "sourceRecords": source_records,
    }


def _write_bundle(bundle: dict[str, Any], output: Path) -> None:
    payload = (
        json.dumps(bundle, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(payload)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    try:
        bundle = build_bundle(args.source)
        _write_bundle(bundle, args.output)
    except (MigrationError, OSError) as exc:
        print(f"migration failed: {exc}", file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "ok": True,
                "output": str(args.output),
                "counts": bundle["counts"],
                "sourceSha256": bundle["source"]["sha256"],
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
