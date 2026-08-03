from __future__ import annotations

import csv
import json
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

    assert data["release"]["releaseId"] == release["releaseId"]
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


def test_report_build_writes_same_origin_speed_payload_and_csv(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"
    release, _, _ = load_active_catalog()

    build_report(output_path=output)
    rendered = output.read_text(encoding="utf-8")
    speed_json = tmp_path / "compare-lab-speed-data.json"
    speed_csv = tmp_path / "compare-lab-speed-output.csv"

    assert speed_json.is_file()
    assert speed_csv.is_file()
    payload = json.loads(speed_json.read_text(encoding="utf-8"))
    eligible = [
        item
        for item in payload["comparisons"]
        if item["speedAnalysis"]["chartEligible"]
    ]
    assert payload["releaseId"] == release["releaseId"]
    assert len(eligible) == 1
    assert eligible[0]["speedAnalysis"]["status"] == "CURVE_READY"
    assert eligible[0]["speedAnalysis"]["rankingAllowed"] is False
    assert eligible[0]["speedAnalysis"]["safeguards"] == {
        "interpolation": False,
        "extrapolation": False,
        "hzAsSpeed": False,
    }
    assert 'data-testid="speed-report-shell"' in rendered
    assert 'href="/compare-lab-speed-output.csv"' in rendered
    assert 'src="/src/compare-report.tsx"' in rendered
    assert "https://" not in rendered

    with speed_csv.open(encoding="utf-8-sig", newline="") as handle:
        speed_rows = list(csv.DictReader(handle))
    expected_points = sum(
        len(series["points"])
        for item in eligible
        for series in item["speedAnalysis"]["series"]
    )
    assert len(speed_rows) == expected_points
    assert all(row["evidence_id"] for row in speed_rows)


def test_static_speed_report_keeps_unavailable_pairs_non_numeric(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"

    build_report(output_path=output)
    payload = json.loads(
        (tmp_path / "compare-lab-speed-data.json").read_text(encoding="utf-8")
    )
    gaps = [
        item
        for item in payload["comparisons"]
        if item["speedAnalysis"]["status"] == "DATA_REQUIRED"
    ]

    assert gaps
    assert all(item["speedAnalysis"]["chartEligible"] is False for item in gaps)
    assert all(item["speedAnalysis"]["metricOptions"] == [] for item in gaps)
    assert all(
        not series["points"]
        for item in gaps
        for series in item["speedAnalysis"]["series"]
    )
