from __future__ import annotations

from pathlib import Path

from backend.catalog_audit.expansion import load_expansion_batch


ROOT = Path(__file__).resolve().parents[1]
B1_PATH = ROOT / "catalog" / "expansion" / "b1-scroll-p92.json"


def test_b1_scroll_batch_preserves_all_official_page_92_rows() -> None:
    batch = load_expansion_batch(B1_PATH)

    assert batch["batchId"] == "B1"
    assert batch["status"] == "SOURCE_VERIFIED"
    assert batch["counts"] == {
        "totalRows": 16,
        "uniqueModels": 16,
        "overlapModels": 8,
        "newCandidates": 8,
        "conditionUnknown": 16,
    }
    assert len({row["catalogRowId"] for row in batch["rows"]}) == 16
    assert len({row["model"] for row in batch["rows"]}) == 16
    assert all(row["type"] == "Sc" for row in batch["rows"])
    assert all(row["condition"] == "UNKNOWN" for row in batch["rows"])
    assert all(row["comparisonEligible"] is False for row in batch["rows"])
    assert all(row["evidence"]["locator"] == {"kind": "pdf-page", "page": 92}
               for row in batch["rows"])


def test_b1_authority_values_and_overlap_are_locked() -> None:
    batch = load_expansion_batch(B1_PATH)
    rows = {row["model"]: row for row in batch["rows"]}

    assert rows["DS4BC7066FVT"]["specs"]["cop"] == 3.25
    assert rows["DS4HD5066FVT"]["refrigerant"] == "R290"
    assert rows["DS4HD5066FVT"]["specs"]["cop"] == 3.43
    assert sum(row["existingModelId"] is not None for row in batch["rows"]) == 8
