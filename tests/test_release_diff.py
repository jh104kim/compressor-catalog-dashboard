from __future__ import annotations

import json
from pathlib import Path

from backend.catalog_audit.release_diff import build_release_diff


ROOT = Path(__file__).resolve().parents[1]


def _model(model_id: str, *, cop: float, page: int) -> dict:
    return {
        "modelId": model_id,
        "model": model_id.rsplit(":", 1)[-1],
        "manufacturer": "Samsung" if ":samsung:" in model_id else "GMCC",
        "type": "Sc",
        "specs": {"cop": cop},
        "evidence": {
            "sourcePath": "data/source.md",
            "locator": {"kind": "pdf-page", "page": page},
        },
    }


def test_p18_diff_is_deterministic_and_separates_change_kinds() -> None:
    before = {
        "models": [
            _model("model:samsung:A", cop=3.1, page=10),
            _model("model:gmcc:B", cop=3.2, page=11),
        ]
    }
    after = {
        "models": [
            _model("model:gmcc:B", cop=3.3, page=12),
            _model("model:samsung:C", cop=3.4, page=13),
        ]
    }

    result = build_release_diff(
        from_release_id="release:2026-07-30:001",
        from_bundle=before,
        to_release_id="release:2026-07-30:002",
        to_bundle=after,
    )

    assert result["status"] == "CHANGES"
    assert result["summary"] == {
        "addedModels": 1,
        "removedModels": 1,
        "changedModels": 1,
        "specChangedModels": 1,
        "evidenceChangedModels": 1,
        "performanceMapChangedModels": 0,
    }
    assert [item["modelId"] for item in result["addedModels"]] == [
        "model:samsung:C"
    ]
    assert [item["modelId"] for item in result["removedModels"]] == [
        "model:samsung:A"
    ]
    assert result["changedModels"][0]["modelId"] == "model:gmcc:B"
    assert [
        item["fieldPath"] for item in result["changedModels"][0]["changes"]
    ] == ["evidence.locator.page", "specs.cop"]


def test_p18_actual_release_diff_finds_only_two_performance_maps() -> None:
    release_root = ROOT / "catalog" / "published" / "releases"
    before = json.loads(
        (release_root / "release_2026-07-30_005" / "bundle.json").read_text(
            encoding="utf-8"
        )
    )
    after = json.loads(
        (release_root / "release_2026-08-03_001" / "bundle.json").read_text(
            encoding="utf-8"
        )
    )

    result = build_release_diff(
        from_release_id="release:2026-07-30:005",
        from_bundle=before,
        to_release_id="release:2026-08-03:001",
        to_bundle=after,
    )

    assert result["summary"] == {
        "addedModels": 0,
        "removedModels": 0,
        "changedModels": 2,
        "specChangedModels": 0,
        "evidenceChangedModels": 0,
        "performanceMapChangedModels": 2,
    }
    assert [item["model"] for item in result["changedModels"]] == [
        "TKF76E25DCH-52RPS",
        "ENV4A5DL2B",
    ]
    assert all(
        [change["fieldPath"] for change in item["changes"]]
        == ["performanceMaps"]
        for item in result["changedModels"]
    )
    assert all(
        item["changes"][0]["after"] == {"itemCount": 1}
        for item in result["changedModels"]
    )
