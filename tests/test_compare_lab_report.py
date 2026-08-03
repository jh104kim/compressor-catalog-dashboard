from __future__ import annotations

import csv
import json
import re
from pathlib import Path

from scripts.build_compare_lab_report import (
    build_report,
    load_active_catalog,
)


def test_report_renders_only_direct_ready_models_and_results(
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
    assert rendered.count('data-testid="samsung-model-card"') == 8
    assert rendered.count('data-testid="comparison-matrix-row"') == 8
    assert rendered.count('data-testid="direct-comparison-row"') == 15
    assert rendered.count("DIRECT_OK") >= 15
    ready_names = {
        item["model"]["model"] for item in data["models"] if item["directReady"]
    }
    excluded_names = {item["model"] for item in samsung} - ready_names
    assert all(name in rendered for name in ready_names)
    assert all(f'data-model="{name}"' not in rendered for name in excluded_names)
    assert 'data-testid="research-gap"' not in rendered


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
    eligible = payload["comparisons"]
    assert payload["releaseId"] == release["releaseId"]
    assert len(eligible) == 1
    assert all(item["speedAnalysis"]["chartEligible"] for item in eligible)
    assert len(payload["directComparisons"]) == 15
    assert all(item["code"] == "DIRECT_OK" for item in payload["directComparisons"])
    assert {item["metric"] for item in payload["directComparisons"]} == {"cop", "eer"}
    assert eligible[0]["speedAnalysis"]["status"] == "CURVE_READY"
    assert eligible[0]["speedAnalysis"]["rankingAllowed"] is False
    assert eligible[0]["speedAnalysis"]["safeguards"] == {
        "interpolation": False,
        "extrapolation": False,
        "hzAsSpeed": False,
    }
    assert 'data-testid="speed-report-shell"' in rendered
    assert 'data-testid="direct-comparison-chart-shell"' in rendered
    assert 'id="direct-comparison-chart-root"' in rendered
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


def test_static_report_payload_excludes_unavailable_speed_pairs(
    tmp_path: Path,
) -> None:
    output = tmp_path / "compare-lab-output.html"

    build_report(output_path=output)
    payload = json.loads(
        (tmp_path / "compare-lab-speed-data.json").read_text(encoding="utf-8")
    )
    assert payload["comparisons"]
    assert all(
        item["speedAnalysis"]["chartEligible"] is True
        for item in payload["comparisons"]
    )
    assert all(
        item["speedAnalysis"]["status"] != "DATA_REQUIRED"
        for item in payload["comparisons"]
    )
