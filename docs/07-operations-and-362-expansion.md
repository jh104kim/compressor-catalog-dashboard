# P7 운영 준비와 Samsung 362행 확장

## 1. 목적

현재 앱은 다음 안전장치를 갖고 있다.

- `catalog/published/releases/`의 Release는 발행 후 수정하지 않는다.
- `catalog/published/active-release.json`만 원자적으로 교체한다.
- 발행은 `scripts/publish_catalog.py` 관리자 CLI로만 수행한다.
- FastAPI가 활성 Published Release와 React View-first UI를 same-origin으로 제공한다.
- API에는 Publish·Rollback 경로가 없다.

이 문서는 운영자가 발행과 롤백을 먼저 안전하게 연습하고, Samsung 2024 PDF 파싱 362행을 기존 Samsung 27모델에서 단계적으로 확장하는 기준을 정의한다.

## 2. 현재 운영 기준

2026-08-03 기준 활성 Release는 다음과 같다.

| 항목 | 값 |
|---|---|
| Release | `release:2026-08-03:001` |
| 전체 모델 | 76 |
| Samsung / 경쟁사 | 27 / 49 |
| 상태 | `PUBLISHED` |
| 승인자 | `project-owner:user-requested-p15-speed-map` |
| Source Commit | `0f0d126fd40cfca4c6222358fa54be9c03304e0e` |
| Application SHA | `0f0d126fd40cfca4c6222358fa54be9c03304e0e` |
| Bundle SHA-256 | `866cbb1e5a84cc297317c0768065cd71f84e915a439dfde8758f9fa39c9c1664` |
| Validation | Critical 0, Major 0, Warning 2 |

현재 승인자는 `project-owner:user-requested-p15-speed-map`이며, Warning은
`UB9TK2150F`의 EER 계산 오차 2.02%와 `NLE12.6CNL`의 COP 계산 오차
8.62%다. Warning은 발행 가능하지만 승인자가 내용을 확인해야 한다.

## 3. 운영 원칙

1. Staging을 직접 UI에 연결하지 않는다.
2. 운영 발행 전에 반드시 임시 폴더에서 같은 명령으로 리허설한다.
3. 기존 Release 디렉터리와 `bundle.json`을 수정하거나 덮어쓰지 않는다.
4. `active-release.json`을 수동 편집하지 않는다.
5. Critical 또는 Major가 1건이라도 있으면 발행하지 않는다.
6. Warning은 목록·원인·승인 판단을 증거로 남긴다.
7. 롤백 대상은 해시 검증에 성공한 기존 Release만 허용한다.
8. 모든 운영 판단은 데이터 입력 SHA(`sourceCommit`), 앱 구현
   SHA(`appGitSha`), Release ID를 함께 기록한다.

## 4. 발행 전 검증

프로젝트 루트의 PowerShell에서 실행한다.

```powershell
$env:PYTHONUTF8='1'
if (git status --porcelain) {
  throw "작업 트리가 깨끗하지 않습니다. 변경 범위를 먼저 검토하세요."
}

python -m pytest -q

Push-Location studio
npm ci
npm run test
npm run build
Pop-Location
```

현재 Python 기준선은 `44 passed`다. 테스트 수가 늘어나면 숫자 자체보다 전체 PASS와 실패 0건을 확인한다.

## 5. 발행 리허설

리허설은 운영 `catalog/published`가 아니라 매번 새 임시 폴더를 사용한다.

```powershell
$env:PYTHONUTF8='1'
$sourceCommit = "2f490beee2acec6d8cc024dd65b13cdab4cf7bd4"
$appGitSha = (git rev-parse HEAD).Trim()
$approvedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$releaseDate = (Get-Date).ToString("yyyy-MM-dd")
$rehearsalRoot = Join-Path $env:TEMP (
  "compressor-release-rehearsal-" + [guid]::NewGuid().ToString("N")
)

python scripts/publish_catalog.py `
  --bundle "catalog/staging/catalog-bundle.json" `
  --output-root $rehearsalRoot `
  --approved-by "catalog-owner" `
  --approved-at $approvedAt `
  --source-commit $sourceCommit `
  --app-git-sha $appGitSha `
  --release-id "release:${releaseDate}:901"

if ($LASTEXITCODE -ne 0) {
  throw "첫 번째 리허설 발행 실패"
}

python scripts/publish_catalog.py `
  --bundle "catalog/staging/catalog-bundle.json" `
  --output-root $rehearsalRoot `
  --approved-by "catalog-owner" `
  --approved-at $approvedAt `
  --source-commit $sourceCommit `
  --app-git-sha $appGitSha `
  --release-id "release:${releaseDate}:902"

if ($LASTEXITCODE -ne 0) {
  throw "두 번째 리허설 발행 실패"
}

Get-Content (Join-Path $rehearsalRoot "active-release.json")
Get-ChildItem (Join-Path $rehearsalRoot "releases")
```

확인할 내용:

- `releases/release_YYYY-MM-DD_901`과 `_902`가 각각 존재
- 활성 포인터가 902를 가리킴
- 902의 `previousReleaseId`가 901
- 두 Release의 `bundle.json`과 `release.json` 존재
- Critical 0, Major 0

CLI 종료코드 `2`는 Validation 거절, `1`은 인자·파일·Release·무결성 오류다. 두 경우 모두 운영 발행으로 진행하지 않는다.

## 6. 롤백 리허설

현재 롤백 CLI는 없으므로 검증된 `FileReleaseStore.rollback()`을 사용한다.

```powershell
$env:REHEARSAL_ROOT = $rehearsalRoot
$env:TARGET_RELEASE_ID = "release:${releaseDate}:901"
$env:ROLLBACK_APPROVED_BY = "catalog-owner"
$env:ROLLBACK_APPROVED_AT = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")

@'
import json
import os
from pathlib import Path
from backend.catalog_audit.release import FileReleaseStore

store = FileReleaseStore(Path(os.environ["REHEARSAL_ROOT"]))
pointer = store.rollback(
    target_release_id=os.environ["TARGET_RELEASE_ID"],
    approved_by=os.environ["ROLLBACK_APPROVED_BY"],
    approved_at=os.environ["ROLLBACK_APPROVED_AT"],
)
print(json.dumps(pointer, ensure_ascii=False, sort_keys=True))
'@ | python -

Get-Content (Join-Path $rehearsalRoot "active-release.json")
Get-ChildItem (Join-Path $rehearsalRoot "audit")
```

PASS 기준:

- 활성 포인터가 901로 복귀
- `rollbackFromReleaseId`가 902
- `audit/`에 `ROLLBACK` 이벤트 생성
- 901·902 Release 디렉터리는 그대로 유지

## 7. 실제 발행

리허설 PASS와 승인자 확인 후에만 실행한다. 아래 `releaseId`, 승인자, 시각은 실제 값으로 바꾼다.

```powershell
$env:PYTHONUTF8='1'
$sourceCommit = (git rev-parse HEAD).Trim()
$appGitSha = (git rev-parse HEAD).Trim()
$approvedAt = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")
$nextReleaseId = "release:YYYY-MM-DD:NNN"

python scripts/publish_catalog.py `
  --approved-by "실제-승인자" `
  --approved-at $approvedAt `
  --source-commit $sourceCommit `
  --app-git-sha $appGitSha `
  --release-id $nextReleaseId

if ($LASTEXITCODE -ne 0) {
  throw "운영 발행 실패"
}

Get-Content "catalog/published/active-release.json"
```

Release ID는 `release:YYYY-MM-DD:NNN` 형식이며 기존 ID를 재사용할 수 없다. 현재 활성 ID를 예제에 넣지 말고 항상 새 번호를 사용한다. 발행 성공 후 보고서를 재생성하고 Runtime을 시작한다.

```powershell
python scripts/build_compare_lab_report.py
npm --prefix studio run build
python -m uvicorn backend.catalog_audit.main:create_runtime_app `
  --factory `
  --host 127.0.0.1 `
  --port 8000
```

별도 PowerShell에서 확인한다.

```powershell
curl.exe --noproxy "*" "http://127.0.0.1:8000/api/v1/health"
curl.exe --noproxy "*" "http://127.0.0.1:8000/api/v1/releases/active"
curl.exe --noproxy "*" --silent --output NUL `
  --write-out "%{http_code}" "http://127.0.0.1:8000/"
```

API와 UI의 Release ID, 승인자, SHA가 같아야 한다.

## 8. 실제 롤백

새 Release의 내용이 잘못됐지만 이전 Release가 정상일 때만 수행한다. 대상 Release의 무결성을 먼저 확인하고, `active-release.json`을 직접 고치지 않는다.

```powershell
$env:RELEASE_ROOT = (Resolve-Path "catalog/published").Path
$env:TARGET_RELEASE_ID = "release:2026-07-30:001"
$env:ROLLBACK_APPROVED_BY = "실제-승인자"
$env:ROLLBACK_APPROVED_AT = (Get-Date).ToString("yyyy-MM-ddTHH:mm:sszzz")

@'
import json
import os
from pathlib import Path
from backend.catalog_audit.release import FileReleaseStore

store = FileReleaseStore(Path(os.environ["RELEASE_ROOT"]))
target = os.environ["TARGET_RELEASE_ID"]
store.verify_release(target)
pointer = store.rollback(
    target_release_id=target,
    approved_by=os.environ["ROLLBACK_APPROVED_BY"],
    approved_at=os.environ["ROLLBACK_APPROVED_AT"],
)
print(json.dumps(pointer, ensure_ascii=False, sort_keys=True))
'@ | python -
```

이후 Health, 활성 Release API, Studio를 다시 확인한다. 대상 해시가 맞지 않으면 롤백도 차단되며, 해당 Release를 강제로 활성화하면 안 된다.

## 9. 장애 판단표

| 증상 | 판단 | 조치 |
|---|---|---|
| Publish CLI 종료코드 2 | 데이터 Validation 거절 | 이슈를 수정하고 새 Staging 생성. 활성 Release 유지 |
| Publish CLI 종료코드 1 | 인자·경로·중복 ID·무결성 오류 | 오류 원인 확인. 기존 Release 덮어쓰기 금지 |
| 새 Release 내용이 틀리지만 해시는 정상 | 잘못 승인된 데이터 | 직전 정상 Release를 검증 후 롤백 |
| Release 해시 불일치 | 파일 손상 또는 변조 | 해당 Release 격리. 활성화 금지. 보관 증거에서 복구 |
| `/api/v1/releases/active`가 503 | 활성 포인터 없음 또는 무결성 실패 | 이전 정상 Release 검증 후 롤백. 없으면 서비스 중지 후 복구 |
| API는 정상, UI만 404 | `studio/dist` 없음 | `npm run build` 후 Runtime 재시작. 데이터 롤백 불필요 |
| UI와 API의 Release ID가 다름 | 서로 다른 응답 혼합 가능성 | 판단 중지, 새로고침·Runtime 확인. 포인터 수동 편집 금지 |
| Warning 증가, Critical/Major 0 | 기술적으로 발행 가능 | Warning별 원본·영향을 승인자가 확인한 뒤 결정 |
| 비교 차단인데 순위·Delta 표시 | UI 안전 회귀 | Release 문제가 아니라 UI 장애. Studio를 이전 빌드로 복구 |

## 10. 증거 보관

각 발행·롤백 단위로 `qa/evidence/p7/<release-id>/` 또는 CI Artifact에 다음을 보관한다.

- 실행 Git SHA와 깨끗한 작업 트리 확인
- 입력 Staging Bundle과 SHA-256
- Schema·Rules 버전과 SHA-256
- Validation 전체 결과와 Warning 승인 메모
- Publish CLI stdout/stderr와 종료코드
- 발행 전후 `active-release.json`
- `release.json`, `bundle.json`, 데이터 SHA-256
- 승인자, 승인시각, 이전 Release ID
- 롤백 시 `audit/` 이벤트
- Python·Studio test/build 결과
- 390px·1440px E2E 결과와 핵심 화면 캡처

활성 Release, 직전 정상 Release, audit에서 참조하는 Release는 삭제하지 않는다. 비밀정보나 개인 인증정보는 Bundle과 증거에 넣지 않는다.

## 11. 362행 원천 기준

| 항목 | 값 |
|---|---|
| PDF | `data/Samsung-Compressor-Catalogue_2024.pdf` |
| PDF SHA-256 | `8913bee2e757dafbfd0fd34cbcc21759f6a441dc880e9dbe5e486e0990abd1ce` |
| 파싱본 | `data/samsung-catalogue-2024-parsed.md` |
| 파싱본 SHA-256 | `489801c87c785a7b1c3d1129520c8106b2d0fdce8d4ebe948eee32a4aac206d0` |
| 전체 행 | 362 |
| Re / Ro / Sc | 154 / 192 / 16 |
| 고유 모델명 | 351 |
| 중복 모델명 그룹 | 11 |
| 파싱본 조건값 보유 | 0 / 362 |

파싱본은 참조 자료이며 권위 소스는 PDF 원본이다. 362행을 곧바로 362개 모델로 간주하지 않는다.

## 12. 단계별 Batch

한 Batch를 검증·리뷰·승인한 뒤 다음 Batch로 이동한다.

| Batch | 범위 | 행 수 |
|---|---|---:|
| B0 | 기존 Samsung 27모델 회귀 기준 | 27모델 |
| B1 | Sc p.92 | 16 |
| B2 | Ro p.58~60 | 52 |
| B3 | Ro p.61~62 | 47 |
| B4 | Ro p.63~67 | 37 |
| B5 | Ro p.71~75 | 56 |
| B6 | Re p.17~26 | 55 |
| B7 | Re p.27~28 | 42 |
| B8 | Re p.29~31 | 38 |
| B9 | Re p.32 | 19 |
| 합계 | PDF 파싱 행 | 362 |

Batch별 원본 행 수는 줄어들면 안 된다. 모델 병합 후 모델 수는 원본 행 수와 달라도 되지만, 모든 원본 행은 `catalogRowId`와 PDF page locator로 역추적되어야 한다.

## 13. Batch Gate

### 13.1 원천·Locator

- PDF와 파싱본 SHA가 위 기준과 일치
- 362행 및 Batch별 행 수 일치
- 모든 행에 고유 `catalogRowId`
- `sourceLayer=samsung_catalog_2024`, `postCatalog=false`
- Evidence는 공식 PDF `pdf-page`를 기본으로 사용
- 파싱본 위치는 보조 Evidence로만 사용
- 모델, 냉매, 수치마다 적용 `fieldPaths` 기록

파싱본의 조건 칼럼은 362행 모두 비어 있다. 유형만 보고 조건을 추정하지 않는다. PDF의 표 제목·각주에서 확인하지 못한 조건은 `UNKNOWN`으로 두고 직접 비교를 차단한다.

### 13.2 중복

현재 중복 모델명 11개는 다음과 같다.

`UG8TT3360F`, `UG5TK8520F`, `UG5C250IN`, `UG5DN8300I`,
`UX9AK2040I`, `UX9AK2037J`, `UX9BJ2042J`, `UX0TM5009S`,
`UX0AK5007Z`, `UF0TN5006Z`, `UF0TT5011Z`

- 값이 같은 중복 8개 그룹은 모델 1개로 병합하되 원본 행과 locator를 모두 보존
- `UX0AK5007Z`, `UF0TN5006Z`, `UF0TT5011Z`는 수치 또는 냉매가 달라 자동 병합 금지
- 충돌은 PDF 원본 확인 후 별도 rating point, 명확한 variant 또는 파싱 오류 중 하나로 결정
- 미해결 충돌이 있으면 해당 Batch 발행 금지
- 최종 `modelId` 중복 0

### 13.3 기존 27모델과 권위값

기존 Samsung 27모델 중 파싱본과 모델명이 정확히 겹치는 모델은 20개다. 이들은 신규 모델로 추가하지 않고 기존 모델에 공식 locator를 병합한다.

정확히 겹치지 않는 7개는 다음과 같다.

`CD124K-S1ZA`, `DS2LD5046F`, `DS8LC5040IN`, `DS8LC5049IN`,
`ENV4A5DL2B`, `MSA143K-S1B`, `UG9C050HS`

이 7개를 자동 삭제하거나 임의 별칭으로 합치지 않는다. 이 중 Post-catalog 3개는 기존 레이어를 유지하고, 나머지는 Evidence와 모델명 차이를 개별 검토한다.

고정 회귀값:

- `DS4BC7066FVT`: ARI COP 3.25, PDF p.92
- `DS4HD5066FVT`: R290 Sc, ARI COP 3.43, 양산, PDF p.92
- R290: Re GAP, Ro/Sc HAVE
- R454B: Ro/Sc HAVE

### 13.4 수치·Validation

- `modelId`와 `catalogRowId` 중복 0
- COP `capacityW / inputW`와 EER `COP × 3.412` 검사
- 상대오차 2% 이하 PASS
- 2% 초과~10% 이하 Warning
- 10% 초과 Major
- Critical 0, Major 0일 때만 발행 가능
- Warning은 원본 PDF 재확인 결과와 승인 판단을 기록

### 13.5 회귀

각 Batch에서 다음을 모두 확인한다.

- 기존 68개 레코드의 승인 없는 변경 0
- 경쟁사 41모델 변경 0
- 기존 Samsung 27모델 핵심값 Diff 0
- 원본 362행 누락 0, locator 누락 0
- 조건 혼합 직접 순위 0
- G1~G6 Golden E2E PASS
- 전체 Python test PASS
- Studio test/build PASS
- 390px·1440px 화면, Console/Page/Network 오류 0

## 14. 확장 완료기준

- 362개 원본 행이 모두 Staging에 보존됨
- 154/192/16 및 Batch별 수량 일치
- 중복 11개 그룹의 병합·분리 판단 기록
- 고유 이름 351개와 현재 27모델의 관계가 추적됨
- 모든 Published 필드가 PDF page 또는 승인된 보조 Evidence까지 연결됨
- 조건 미확인 행은 직접 비교에서 BLOCKED
- 기존 27모델·경쟁사 41모델의 승인 없는 Diff 0
- Critical 0, Major 0
- Batch별 리허설, 승인, Release, 롤백 가능 증거 보관
- 전체 자동 테스트와 E2E PASS
- P7 Eval score 4.8/5 이상

최종 Samsung 모델 수는 `27 + 362`로 미리 정하지 않는다. 중복 병합, 기존 20개 overlap, Post-catalog·Legacy 7개 검토가 끝난 뒤 검증 결과로 확정한다.
