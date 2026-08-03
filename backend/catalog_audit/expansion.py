from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class ExpansionBatchError(ValueError):
    """확장 후보 Batch의 추적성 또는 안전 Gate가 깨짐."""


def load_expansion_batch(path: Path) -> dict[str, Any]:
    """검토용 확장 Batch를 읽고 핵심 불변조건을 확인한다."""

    batch = json.loads(Path(path).read_text(encoding="utf-8"))
    rows = batch.get("rows")
    if not isinstance(rows, list):
        raise ExpansionBatchError("rows는 배열이어야 합니다.")

    row_ids = [row.get("catalogRowId") for row in rows]
    models = [row.get("model") for row in rows]
    if len(row_ids) != len(set(row_ids)):
        raise ExpansionBatchError("catalogRowId가 중복되었습니다.")
    if len(models) != len(set(models)):
        raise ExpansionBatchError("B1 모델명이 중복되었습니다.")

    invalid_rows = [
        row.get("catalogRowId", "UNKNOWN")
        for row in rows
        if row.get("type") != "Sc"
        or row.get("condition") != "UNKNOWN"
        or row.get("comparisonEligible") is not False
        or row.get("sourceLayer") != "samsung_catalog_2024"
        or row.get("postCatalog") is not False
        or row.get("evidence", {}).get("sourcePath")
        != "data/Samsung-Compressor-Catalogue_2024.pdf"
        or row.get("evidence", {}).get("locator")
        != {"kind": "pdf-page", "page": 92}
    ]
    if invalid_rows:
        raise ExpansionBatchError(
            f"B1 안전·Evidence 규칙 위반: {', '.join(invalid_rows)}"
        )

    computed_counts = {
        "totalRows": len(rows),
        "uniqueModels": len(set(models)),
        "overlapModels": sum(
            row.get("existingModelId") is not None for row in rows
        ),
        "newCandidates": sum(
            row.get("existingModelId") is None for row in rows
        ),
        "conditionUnknown": sum(
            row.get("condition") == "UNKNOWN" for row in rows
        ),
    }
    if batch.get("counts") != computed_counts:
        raise ExpansionBatchError(
            f"기록된 counts와 계산값이 다릅니다: {computed_counts}"
        )
    if batch.get("batchId") != "B1" or len(rows) != 16:
        raise ExpansionBatchError("B1은 Scroll p.92의 16행이어야 합니다.")
    return batch
