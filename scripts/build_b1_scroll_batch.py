"""Samsung 2024 PDF p.92 Scroll 16행의 검토용 B1 Batch를 생성한다."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
PARSED = ROOT / "data" / "samsung-catalogue-2024-parsed.md"
PDF = ROOT / "data" / "Samsung-Compressor-Catalogue_2024.pdf"
OUTPUT = ROOT / "catalog" / "expansion" / "b1-scroll-p92.json"
EXPECTED_PDF_SHA = (
    "8913bee2e757dafbfd0fd34cbcc21759f6a441dc880e9dbe5e486e0990abd1ce"
)
EXPECTED_PARSED_SHA = (
    "489801c87c785a7b1c3d1129520c8106b2d0fdce8d4ebe948eee32a4aac206d0"
)
OVERLAP_IDS = {
    model: f"model:samsung:{model}"
    for model in (
        "DS2BB5033FVT",
        "DS2GR7046FVT",
        "DS4BC7066FVT",
        "DS4GM7090FVT",
        "DS4GR5070FVT",
        "DS4GR7066FVT",
        "DS4HD5066FVT",
        "DS4HD5090FVT",
    )
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_scroll_rows() -> list[dict]:
    text = PARSED.read_text(encoding="utf-8")
    section = re.search(
        r"^## Scroll .*?\n(?P<body>.*?)(?=^## |\Z)",
        text,
        flags=re.MULTILINE | re.DOTALL,
    )
    if section is None:
        raise ValueError("Scroll 섹션을 찾을 수 없습니다.")

    rows: list[dict] = []
    for line in section.group("body").splitlines():
        if not line.startswith("|") or "---" in line or "모델" in line:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != 9:
            continue
        model, refrigerant, cc, capacity_w, input_w, cop, eer, _, page = cells
        rows.append(
            {
                "model": model,
                "refrigerant": refrigerant,
                "specs": {
                    "displacementCc": float(cc),
                    "capacityW": int(capacity_w),
                    "inputW": int(input_w),
                    "cop": float(cop),
                    "eer": float(eer),
                },
                "page": int(page),
            }
        )
    if len(rows) != 16 or any(row["page"] != 92 for row in rows):
        raise ValueError("B1 원천은 p.92의 16행이어야 합니다.")
    return rows


def build_batch() -> dict:
    pdf_sha = sha256(PDF)
    parsed_sha = sha256(PARSED)
    if pdf_sha != EXPECTED_PDF_SHA or parsed_sha != EXPECTED_PARSED_SHA:
        raise ValueError("권위 PDF 또는 파싱본 SHA가 기준과 다릅니다.")

    items = []
    for index, source in enumerate(parse_scroll_rows(), start=1):
        model = source["model"]
        items.append(
            {
                "catalogRowId": f"catalog:samsung:2024:p92:{index:03d}",
                "model": model,
                "manufacturer": "Samsung",
                "type": "Sc",
                "refrigerant": source["refrigerant"],
                "condition": "UNKNOWN",
                "comparisonEligible": False,
                "sourceLayer": "samsung_catalog_2024",
                "postCatalog": False,
                "existingModelId": OVERLAP_IDS.get(model),
                "specs": source["specs"],
                "evidence": {
                    "sourcePath": (
                        "data/Samsung-Compressor-Catalogue_2024.pdf"
                    ),
                    "authority": "official",
                    "locator": {"kind": "pdf-page", "page": 92},
                    "fieldPaths": [
                        "model",
                        "refrigerant",
                        "specs.displacementCc",
                        "specs.capacityW",
                        "specs.inputW",
                        "specs.cop",
                        "specs.eer",
                    ],
                },
                "supportingEvidence": {
                    "sourcePath": "data/samsung-catalogue-2024-parsed.md",
                    "authority": "secondary",
                    "locator": {
                        "kind": "markdown-section",
                        "section": "Scroll (스크롤) — 16개",
                    },
                },
            }
        )

    overlap_count = sum(item["existingModelId"] is not None for item in items)
    return {
        "schemaVersion": 1,
        "batchId": "B1",
        "title": "Samsung 2024 Scroll p.92",
        "status": "SOURCE_VERIFIED",
        "publicationStatus": "NOT_PUBLISHED",
        "review": {
            "reviewedAt": "2026-07-30",
            "method": "PDF p.92 visual review and text extraction",
            "conditionDecision": (
                "p.92에 측정조건이 없어 16행 모두 UNKNOWN으로 유지"
            ),
        },
        "source": {
            "pdfPath": "data/Samsung-Compressor-Catalogue_2024.pdf",
            "pdfSha256": pdf_sha,
            "parsedPath": "data/samsung-catalogue-2024-parsed.md",
            "parsedSha256": parsed_sha,
            "page": 92,
        },
        "counts": {
            "totalRows": len(items),
            "uniqueModels": len({item["model"] for item in items}),
            "overlapModels": overlap_count,
            "newCandidates": len(items) - overlap_count,
            "conditionUnknown": sum(
                item["condition"] == "UNKNOWN" for item in items
            ),
        },
        "rows": items,
    }


def main() -> None:
    batch = build_batch()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(batch, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "ok": True,
                "output": str(OUTPUT.relative_to(ROOT)),
                "counts": batch["counts"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
