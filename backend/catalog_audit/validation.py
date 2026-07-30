from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker


def canonical_json_bytes(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def canonical_json_sha256(value: Any) -> str:
    return hashlib.sha256(canonical_json_bytes(value)).hexdigest()


@dataclass(frozen=True)
class ValidationIssue:
    code: str
    severity: str
    message: str
    model_id: str | None = None
    field_path: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            key: value
            for key, value in asdict(self).items()
            if value is not None
        }


@dataclass(frozen=True)
class ValidationReport:
    status: str
    data_sha256: str
    model_count: int
    critical_count: int
    major_count: int
    warning_count: int
    issues: tuple[ValidationIssue, ...]

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "dataSha256": self.data_sha256,
            "modelCount": self.model_count,
            "criticalCount": self.critical_count,
            "majorCount": self.major_count,
            "warningCount": self.warning_count,
            "issues": [issue.to_dict() for issue in self.issues],
        }


class CatalogValidator:
    """Staging Bundle을 Published Gate 전에 결정적으로 검사한다."""

    def __init__(self, *, schema_path: Path, rules_path: Path) -> None:
        self.schema_path = Path(schema_path)
        self.rules_path = Path(rules_path)
        self.schema = json.loads(self.schema_path.read_text(encoding="utf-8"))
        self.rules = json.loads(self.rules_path.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(self.schema)
        self.model_validator = Draft202012Validator(
            self.schema,
            format_checker=FormatChecker(),
        )

    def validate(self, bundle: dict[str, Any]) -> ValidationReport:
        issues: list[ValidationIssue] = []
        models = bundle.get("models")
        if not isinstance(models, list):
            issues.append(
                ValidationIssue(
                    code="SCHEMA_INVALID",
                    severity="Major",
                    message="Bundle models는 배열이어야 합니다.",
                    field_path="models",
                )
            )
            models = []

        if bundle.get("stage") != "STAGING":
            issues.append(
                ValidationIssue(
                    code="SCHEMA_INVALID",
                    severity="Major",
                    message="검증 입력 Bundle의 stage는 STAGING이어야 합니다.",
                    field_path="stage",
                )
            )

        self._validate_counts(bundle, models, issues)
        self._validate_models(models, issues)

        severity_count = {
            severity: sum(issue.severity == severity for issue in issues)
            for severity in ("Critical", "Major", "Warning")
        }
        ordered = tuple(
            sorted(
                issues,
                key=lambda issue: (
                    {"Critical": 0, "Major": 1, "Warning": 2}.get(
                        issue.severity, 3
                    ),
                    issue.code,
                    issue.model_id or "",
                    issue.field_path or "",
                ),
            )
        )
        return ValidationReport(
            status=(
                "VALIDATED"
                if severity_count["Critical"] == 0
                and severity_count["Major"] == 0
                else "REJECTED"
            ),
            data_sha256=canonical_json_sha256(bundle),
            model_count=len(models),
            critical_count=severity_count["Critical"],
            major_count=severity_count["Major"],
            warning_count=severity_count["Warning"],
            issues=ordered,
        )

    def _validate_counts(
        self,
        bundle: dict[str, Any],
        models: list[dict[str, Any]],
        issues: list[ValidationIssue],
    ) -> None:
        counts = bundle.get("counts")
        if not isinstance(counts, dict):
            issues.append(
                ValidationIssue(
                    code="SCHEMA_INVALID",
                    severity="Major",
                    message="Bundle counts 객체가 필요합니다.",
                    field_path="counts",
                )
            )
            return
        expected = {
            "models": len(models),
            "samsungModels": sum(
                model.get("manufacturer") == "Samsung" for model in models
            ),
            "competitorModels": sum(
                model.get("manufacturer") != "Samsung" for model in models
            ),
        }
        if any(counts.get(key) != value for key, value in expected.items()):
            issues.append(
                ValidationIssue(
                    code="COUNT_MISMATCH",
                    severity="Major",
                    message=f"counts가 실제 모델 수와 다릅니다: expected={expected}",
                    field_path="counts",
                )
            )

    def _validate_models(
        self,
        models: list[dict[str, Any]],
        issues: list[ValidationIssue],
    ) -> None:
        seen: set[str] = set()
        for index, model in enumerate(models):
            model_id = model.get("modelId")
            if not isinstance(model_id, str) or not model_id:
                issues.append(
                    ValidationIssue(
                        code="SCHEMA_INVALID",
                        severity="Major",
                        message="modelId가 필요합니다.",
                        field_path=f"models.{index}.modelId",
                    )
                )
            elif model_id in seen:
                issues.append(
                    ValidationIssue(
                        code="MODEL_ID_DUPLICATE",
                        severity="Major",
                        message=f"중복 modelId: {model_id}",
                        model_id=model_id,
                        field_path=f"models.{index}.modelId",
                    )
                )
            else:
                seen.add(model_id)

            schema_errors = sorted(
                self.model_validator.iter_errors(model),
                key=lambda error: list(error.absolute_path),
            )
            for error in schema_errors:
                field_path = ".".join(str(part) for part in error.absolute_path)
                issues.append(
                    ValidationIssue(
                        code="SCHEMA_INVALID",
                        severity="Major",
                        message=error.message,
                        model_id=model_id,
                        field_path=field_path or None,
                    )
                )

            self._validate_authority(model, model_id, issues)
            self._validate_metrics(model, model_id, issues)

    def _validate_authority(
        self,
        model: dict[str, Any],
        model_id: str | None,
        issues: list[ValidationIssue],
    ) -> None:
        if model.get("sourceLayer") == "samsung_catalog_2024":
            evidence = model.get("evidence") or {}
            authority = self.rules["authority"]
            if (
                evidence.get("sourcePath") != authority["source"]
                or evidence.get("authority") != "official"
                or evidence.get("locator", {}).get("kind") != "pdf-page"
            ):
                issues.append(
                    ValidationIssue(
                        code="AUTHORITY_SOURCE_MISSING",
                        severity="Critical",
                        message="Samsung Baseline은 공식 2024 PDF 페이지 근거가 필요합니다.",
                        model_id=model_id,
                        field_path="evidence",
                    )
                )

        canonical = self.rules.get("canonicalFacts", {}).get(model.get("model"))
        if not canonical:
            return
        expected_cop = canonical.get("cop")
        actual_cop = (model.get("specs") or {}).get("cop")
        if expected_cop is not None and actual_cop != expected_cop:
            issues.append(
                ValidationIssue(
                    code="AUTHORITY_VALUE_MISMATCH",
                    severity="Critical",
                    message=(
                        f"{model.get('model')} COP 권위값은 "
                        f"{expected_cop}이며 입력값은 {actual_cop}입니다."
                    ),
                    model_id=model_id,
                    field_path="specs.cop",
                )
            )
        expected_condition = canonical.get("condition")
        if expected_condition and model.get("condition") != expected_condition:
            issues.append(
                ValidationIssue(
                    code="AUTHORITY_VALUE_MISMATCH",
                    severity="Critical",
                    message=(
                        f"{model.get('model')} 조건 권위값은 "
                        f"{expected_condition}입니다."
                    ),
                    model_id=model_id,
                    field_path="condition",
                )
            )

    @staticmethod
    def _relative_error(actual: float, expected: float) -> float:
        if expected == 0:
            return 0.0 if actual == 0 else float("inf")
        return abs(actual - expected) / abs(expected)

    def _validate_metrics(
        self,
        model: dict[str, Any],
        model_id: str | None,
        issues: list[ValidationIssue],
    ) -> None:
        specs = model.get("specs") or {}
        capacity = specs.get("capacityW")
        input_w = specs.get("inputW")
        cop = specs.get("cop")
        if all(isinstance(value, (int, float)) for value in (capacity, input_w, cop)):
            calculated = capacity / input_w
            self._append_formula_issue(
                model_id=model_id,
                field_path="specs.cop",
                actual=cop,
                expected=calculated,
                issues=issues,
            )

        eer = specs.get("eer")
        if all(isinstance(value, (int, float)) for value in (cop, eer)):
            self._append_formula_issue(
                model_id=model_id,
                field_path="specs.eer",
                actual=eer,
                expected=cop * 3.412,
                issues=issues,
            )

    def _append_formula_issue(
        self,
        *,
        model_id: str | None,
        field_path: str,
        actual: float,
        expected: float,
        issues: list[ValidationIssue],
    ) -> None:
        error = self._relative_error(actual, expected)
        if error <= 0.02:
            return
        severity = "Warning" if error <= 0.10 else "Major"
        issues.append(
            ValidationIssue(
                code="METRIC_FORMULA_MISMATCH",
                severity=severity,
                message=(
                    f"{field_path} 계산 상대오차가 {error * 100:.2f}%입니다."
                ),
                model_id=model_id,
                field_path=field_path,
            )
        )
