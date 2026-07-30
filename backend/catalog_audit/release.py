from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any

from .validation import (
    ValidationReport,
    canonical_json_bytes,
    canonical_json_sha256,
)


RELEASE_ID_PATTERN = re.compile(r"^release:\d{4}-\d{2}-\d{2}:\d{3}$")


class ReleaseGateError(ValueError):
    """Validation Gate 또는 승인 메타데이터가 충족되지 않음."""


class ReleaseIntegrityError(ValueError):
    """저장된 Release의 내용과 기록된 해시가 다름."""


class FileReleaseStore:
    """불변 Release 디렉터리와 원자적 활성 포인터를 관리한다."""

    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.releases_dir = self.root / "releases"
        self.audit_dir = self.root / "audit"
        self.active_pointer_path = self.root / "active-release.json"
        self.releases_dir.mkdir(parents=True, exist_ok=True)
        self.audit_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _directory_name(release_id: str) -> str:
        if not RELEASE_ID_PATTERN.fullmatch(release_id):
            raise ReleaseGateError(
                "releaseId는 release:YYYY-MM-DD:NNN 형식이어야 합니다."
            )
        return release_id.replace(":", "_")

    def release_path(self, release_id: str) -> Path:
        return self.releases_dir / self._directory_name(release_id)

    def active_release(self) -> dict[str, Any] | None:
        if not self.active_pointer_path.exists():
            return None
        return json.loads(self.active_pointer_path.read_text(encoding="utf-8"))

    def publish(
        self,
        *,
        bundle: dict[str, Any],
        validation: ValidationReport,
        release_id: str,
        approved_by: str,
        approved_at: str,
        source_commit: str,
    ) -> dict[str, Any]:
        if validation.critical_count or validation.major_count:
            raise ReleaseGateError(
                "Published Gate는 Critical 0, Major 0이어야 합니다."
            )
        if validation.status != "VALIDATED":
            raise ReleaseGateError("Validation status가 VALIDATED여야 합니다.")
        if not approved_by.strip() or not approved_at.strip():
            raise ReleaseGateError("승인자와 승인시각이 필요합니다.")
        if not re.fullmatch(r"[0-9a-f]{40}", source_commit):
            raise ReleaseGateError("sourceCommit은 40자리 Git SHA여야 합니다.")

        data_sha256 = canonical_json_sha256(bundle)
        if validation.data_sha256 != data_sha256:
            raise ReleaseIntegrityError("Validation 해시와 Bundle 해시가 다릅니다.")

        target = self.release_path(release_id)
        if target.exists():
            raise ReleaseGateError("Published Release는 수정하거나 덮어쓸 수 없습니다.")

        active_before = self.active_release()
        previous_release_id = (
            active_before.get("releaseId") if active_before else None
        )
        metadata = {
            "releaseId": release_id,
            "status": "PUBLISHED",
            "createdAt": approved_at,
            "approvedBy": approved_by,
            "approvedAt": approved_at,
            "sourceCommit": source_commit,
            "dataSha256": data_sha256,
            "previousReleaseId": previous_release_id,
            "validationSummary": validation.to_dict(),
        }

        temporary = Path(
            tempfile.mkdtemp(prefix=".tmp-release-", dir=self.root)
        )
        moved = False
        try:
            self._write_json(temporary / "bundle.json", bundle)
            self._write_json(temporary / "release.json", metadata)
            os.replace(temporary, target)
            moved = True
            self._activate(
                {
                    "releaseId": release_id,
                    "dataSha256": data_sha256,
                    "activatedAt": approved_at,
                    "approvedBy": approved_by,
                    "previousReleaseId": previous_release_id,
                }
            )
        finally:
            if not moved and temporary.exists():
                shutil.rmtree(temporary)
        return metadata

    def verify_release(self, release_id: str) -> bool:
        release_dir = self.release_path(release_id)
        bundle_path = release_dir / "bundle.json"
        metadata_path = release_dir / "release.json"
        if not bundle_path.exists() or not metadata_path.exists():
            raise ReleaseIntegrityError("Release 파일이 완전하지 않습니다.")
        bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        if canonical_json_sha256(bundle) != metadata.get("dataSha256"):
            raise ReleaseIntegrityError("Release Bundle 해시가 일치하지 않습니다.")
        return True

    def rollback(
        self,
        *,
        target_release_id: str,
        approved_by: str,
        approved_at: str,
    ) -> dict[str, Any]:
        if not approved_by.strip() or not approved_at.strip():
            raise ReleaseGateError("롤백 승인자와 승인시각이 필요합니다.")
        self.verify_release(target_release_id)
        active_before = self.active_release()
        from_release_id = (
            active_before.get("releaseId") if active_before else None
        )
        metadata = json.loads(
            (self.release_path(target_release_id) / "release.json").read_text(
                encoding="utf-8"
            )
        )
        pointer = {
            "releaseId": target_release_id,
            "dataSha256": metadata["dataSha256"],
            "activatedAt": approved_at,
            "approvedBy": approved_by,
            "rollbackFromReleaseId": from_release_id,
        }
        self._activate(pointer)
        event_name = (
            f"{approved_at.replace(':', '-').replace('+', '_')}-"
            f"{self._directory_name(target_release_id)}.json"
        )
        self._write_json(
            self.audit_dir / event_name,
            {
                "event": "ROLLBACK",
                "targetReleaseId": target_release_id,
                "fromReleaseId": from_release_id,
                "approvedBy": approved_by,
                "approvedAt": approved_at,
            },
        )
        return pointer

    def _activate(self, pointer: dict[str, Any]) -> None:
        temporary = self.root / ".active-release.tmp"
        self._write_json(temporary, pointer)
        os.replace(temporary, self.active_pointer_path)

    @staticmethod
    def _write_json(path: Path, value: Any) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(canonical_json_bytes(value) + b"\n")
