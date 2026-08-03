from __future__ import annotations

from typing import Any


_MISSING = object()


def _summary_value(value: Any) -> Any:
    if value is _MISSING:
        return None
    if isinstance(value, list):
        return {"itemCount": len(value)}
    return value


def _changes(before: Any, after: Any, field_path: str) -> list[dict[str, Any]]:
    if before is not _MISSING and after is not _MISSING and before == after:
        return []
    if isinstance(before, dict) and isinstance(after, dict):
        changes: list[dict[str, Any]] = []
        for key in sorted(set(before) | set(after)):
            path = f"{field_path}.{key}" if field_path else key
            changes.extend(
                _changes(
                    before.get(key, _MISSING),
                    after.get(key, _MISSING),
                    path,
                )
            )
        return changes
    if before is _MISSING and isinstance(after, dict):
        changes = []
        for key in sorted(after):
            path = f"{field_path}.{key}" if field_path else key
            changes.extend(_changes(_MISSING, after[key], path))
        return changes
    if after is _MISSING and isinstance(before, dict):
        changes = []
        for key in sorted(before):
            path = f"{field_path}.{key}" if field_path else key
            changes.extend(_changes(before[key], _MISSING, path))
        return changes
    return [
        {
            "fieldPath": field_path,
            "before": _summary_value(before),
            "after": _summary_value(after),
        }
    ]


def _model_summary(model: dict[str, Any]) -> dict[str, Any]:
    return {
        "modelId": model["modelId"],
        "manufacturer": model.get("manufacturer"),
        "model": model.get("model"),
        "type": model.get("type"),
    }


def build_release_diff(
    *,
    from_release_id: str,
    from_bundle: dict[str, Any],
    to_release_id: str,
    to_bundle: dict[str, Any],
) -> dict[str, Any]:
    """두 불변 Release의 모델 의사결정 필드만 결정론적으로 비교한다."""

    before_by_id = {
        item["modelId"]: item for item in from_bundle.get("models", [])
    }
    after_by_id = {
        item["modelId"]: item for item in to_bundle.get("models", [])
    }
    added_ids = sorted(set(after_by_id) - set(before_by_id))
    removed_ids = sorted(set(before_by_id) - set(after_by_id))
    changed_models: list[dict[str, Any]] = []

    for model_id in sorted(set(before_by_id) & set(after_by_id)):
        changes = _changes(before_by_id[model_id], after_by_id[model_id], "")
        if changes:
            changed_models.append(
                {
                    **_model_summary(after_by_id[model_id]),
                    "changes": changes,
                }
            )

    def changed_model_count(prefixes: tuple[str, ...]) -> int:
        return sum(
            any(
                change["fieldPath"] == prefix
                or change["fieldPath"].startswith(f"{prefix}.")
                for change in item["changes"]
                for prefix in prefixes
            )
            for item in changed_models
        )

    summary = {
        "addedModels": len(added_ids),
        "removedModels": len(removed_ids),
        "changedModels": len(changed_models),
        "specChangedModels": changed_model_count(("specs",)),
        "evidenceChangedModels": changed_model_count(
            ("evidence", "supportingEvidence")
        ),
        "performanceMapChangedModels": changed_model_count(
            ("performanceMaps",)
        ),
    }
    return {
        "status": (
            "CHANGES"
            if summary["addedModels"]
            or summary["removedModels"]
            or summary["changedModels"]
            else "NO_CHANGES"
        ),
        "fromReleaseId": from_release_id,
        "toReleaseId": to_release_id,
        "summary": summary,
        "addedModels": [_model_summary(after_by_id[item]) for item in added_ids],
        "removedModels": [
            _model_summary(before_by_id[item]) for item in removed_ids
        ],
        "changedModels": changed_models,
    }
