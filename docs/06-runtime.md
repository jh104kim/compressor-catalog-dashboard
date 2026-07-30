# P5 발행 CLI와 same-origin Runtime

## 역할

Runtime은 다음 두 대상만 읽는다.

- `catalog/published`의 활성 Published Release
- `studio/dist`의 빌드된 View-first UI

발행은 관리자 CLI로만 수행한다. API publish route는 만들지 않는다.

## 발행 Gate

`scripts/publish_catalog.py`는 다음 순서로 동작한다.

1. `catalog/staging/catalog-bundle.json` 읽기
2. 기존 `CatalogValidator`로 검증
3. `VALIDATED`, Critical 0, Major 0 확인
4. 승인자·승인시각·데이터 입력 SHA·앱 구현 SHA·Release ID 확인
5. `FileReleaseStore`로 불변 Release 저장
6. 마지막에 활성 포인터를 원자적으로 교체

검증 실패 시 `catalog/published`를 만들거나 활성 포인터를 변경하지 않는다. Warning은 출력되는 검증 요약에 보존한다.

## 수동 발행 명령

아래 명령은 검토·승인 후 루트에서 사용한다. 자동 실행하지 않는다.

```powershell
$env:PYTHONUTF8='1'
$sourceCommit = "d413cfa2037438f025edeb1111812289a489889e"
$appGitSha = (git rev-parse HEAD).Trim()
python scripts/publish_catalog.py `
  --approved-by "catalog-owner" `
  --approved-at "2026-07-30T18:00:00+09:00" `
  --source-commit $sourceCommit `
  --app-git-sha $appGitSha `
  --release-id "release:2026-07-30:003"
```

기본 입력은 `catalog/staging/catalog-bundle.json`, 기본 출력은 `catalog/published`이다. 테스트에서는 `--bundle`, `--output-root`, `--schema`, `--rules`로 임시 경로를 사용한다.

## Runtime 실행

먼저 Studio를 빌드한 후 Uvicorn factory를 실행한다.

```powershell
cd studio
npm run build
cd ..
python -m uvicorn backend.catalog_audit.main:create_runtime_app `
  --factory `
  --host 127.0.0.1 `
  --port 8000
```

기본 경로:

- API: `http://127.0.0.1:8000/api/v1/`
- Studio: `http://127.0.0.1:8000/`
- Published: `catalog/published`
- Studio build: `studio/dist`

`main.py`는 import만으로 실제 Published Release를 생성하지 않는다. 기본 실행도 활성 Release가 없으면 Catalog API가 503을 반환하며, Studio build가 없으면 UI 경로만 404를 반환한다.

## Routing 안전 규칙

- 기존 `/api/v1/*` route를 가장 먼저 처리한다.
- 없는 `/api/*`는 JSON 404이며 SPA index로 보내지 않는다.
- `/assets/*`와 확장자가 있는 파일 요청도 index로 보내지 않는다.
- 확장자 없는 Studio deep-link만 `index.html`로 fallback한다.
- `POST /api/v1/releases/publish`는 존재하지 않는다.
- `GET /api/v1/expansion/batches/B1`은 검토 후보만 반환하며 Published
  모델 API에 합치지 않는다.

## 검증

```powershell
$env:PYTHONUTF8='1'
python -m pytest -q tests/test_runtime_hosting.py
python -m pytest -q
```

완료기준:

- 실제 68개 Staging Bundle을 임시 경로에 발행 가능
- 잘못된 Samsung 권위값은 발행 거절, 활성 포인터 미생성
- API·Studio·정적 asset이 한 origin에서 응답
- API/asset 404가 SPA fallback에 가려지지 않음
- Studio build가 없어도 API health는 동작
- 운영 `catalog/published` 산출물은 승인 전 생성하지 않음
