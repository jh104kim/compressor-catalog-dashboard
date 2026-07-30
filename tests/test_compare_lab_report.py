from __future__ import annotations

import csv
import re
from pathlib import Path

from scripts.build_compare_lab_report import (
    build_report,
    load_active_catalog,
)


def test_report_covers_every_samsung_model_and_direct_result(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"
    release, bundle, _ = load_active_catalog()

    data = build_report(output_path=output)
    rendered = output.read_text(encoding="utf-8")
    samsung = [
        item for item in bundle["models"] if item["manufacturer"] == "Samsung"
    ]

    assert release["releaseId"] == "release:2026-07-30:005"
    assert data["summary"]["samsungModels"] == 27
    assert data["summary"]["readyModels"] == 8
    assert data["summary"]["researchModels"] == 19
    assert data["summary"]["uniquePairs"] == 9
    assert data["summary"]["comparisons"] == 15
    assert rendered.count('data-testid="samsung-model-card"') == 27
    assert rendered.count('data-testid="direct-comparison-row"') == 15
    assert rendered.count("DIRECT_OK") >= 15
    assert all(item["model"] in rendered for item in samsung)


def test_report_is_standalone_semantic_html_with_safe_tables(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"

    build_report(output_path=output)
    rendered = output.read_text(encoding="utf-8")

    assert "<h1>" in rendered
    assert "<h2>" in rendered
    assert "<table>" in rendered
    assert '<div class="table-wrap">' in rendered
    assert '<html lang="ko">' in rendered
    assert "https://fonts." not in rendered
    assert "unpkg.com" not in rendered
    assert not re.search(r"(?m)^#{1,3} ", rendered)
    assert not re.search(r"(?m)^\|.+\|$", rendered)


def test_report_links_each_direct_result_back_to_compare_lab(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"

    data = build_report(output_path=output)
    rendered = output.read_text(encoding="utf-8")

    for row in data["directRows"]:
        baseline_id = row["baseline"]["modelId"].replace(":", "%3A")
        candidate_id = row["candidate"]["modelId"].replace(":", "%3A")
        assert f"baselineModelId={baseline_id}" in rendered
        assert f"candidateModelId={candidate_id}" in rendered
        assert f"metric={row['metric']}" in rendered


def test_report_build_writes_matching_csv_export(tmp_path: Path) -> None:
    output = tmp_path / "compare-lab-output.html"

    data = build_report(output_path=output)
    csv_output = output.with_suffix(".csv")

    assert csv_output.is_file()
    with csv_output.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == data["summary"]["comparisons"] == 15
    assert set(rows[0]) == {
        "release_id",
        "compressor_type",
        "refrigerant",
        "condition",
        "drive_class",
        "samsung_model",
        "competitor_manufacturer",
        "competitor_model",
        "metric",
        "samsung_value",
        "competitor_value",
        "capacity_diff_pct",
        "competitor_delta_pct",
        "verdict",
        "code",
    }
    assert {row["code"] for row in rows} == {"DIRECT_OK"}
