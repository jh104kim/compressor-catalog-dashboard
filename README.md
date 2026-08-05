# Samsung Compressor Catalog Audit Studio

Samsung(당사) 관점에서 공개 카탈로그와 리서치 데이터를 점검하고, 같은 조건의
경쟁 모델만 안전하게 비교하는 압축기 경쟁 인텔리전스 앱이다.

- 기본 화면: FastAPI + React 기반 **Catalog Audit Studio**
- 데이터 기준: 검증 후 발행된 불변 **Published Release**
- 비교 원칙: 유형·냉매·측정조건·구동·용량 범위를 통과한 모델만 직접 비교
- 변경 추적: 활성 Release와 직전 Release의 모델·수치·Evidence·성능맵 Diff
- 보조 화면: 기존 DC 대시보드는 `/legacy/`에서 조회 가능

저장소: [jh104kim/compressor-catalog-dashboard](https://github.com/jh104kim/compressor-catalog-dashboard)

현재 Cloudflare 검수 페이지:
[Samsung Compressor Catalog Audit Studio 열기](https://samsung-compressor-catalog-dashboard.prong-workshop.workers.dev/)

> 임시 Preview 주소로 약 1시간 후 만료될 수 있다. Cloudflare 계정 인증 후
> 영구 주소가 발급되면 이 링크를 교체한다.

## 현재 기준

| 항목 | 값 |
|---|---|
| 활성 Release | `release:2026-08-03:001` (`PUBLISHED`) |
| 전체 모델 | 76개 |
| Samsung | 27개 — Re 4 / Ro 12 / Sc 11 |
| 경쟁사 | 49개 |
| 비교군 | 13개 |
| 정적 보고서 직접 비교 | Samsung 8모델, DIRECT_OK 15건 |
| Validation | Critical 0 / Major 0 / Warning 2 |

활성 기준은 문서의 숫자가 아니라
[`catalog/published/active-release.json`](catalog/published/active-release.json)이
항상 최종 권위다.

## 5분 실행

### 가장 쉬운 방법

Windows에서 루트의 `run.bat`을 실행한다. 정적 Compare Report와 Studio를 다시
빌드한 뒤 브라우저에서 `http://127.0.0.1:8000/`을 연다. 종료는 실행 창에서
`Ctrl+C`다.

### 명령으로 실행

필요 환경은 Python 3.12+, Node.js 20+다.

```powershell
# 최초 1회 또는 package-lock 변경 후
python -m pip install -r backend/requirements.txt
npm --prefix studio ci

# 정적 보고서 생성 + production build
python scripts/build_compare_lab_report.py
npm --prefix studio run build

# Published Release + API + Studio same-origin 실행
python -m uvicorn backend.catalog_audit.main:create_runtime_app `
  --factory --host 127.0.0.1 --port 8000
```

주요 주소:

| 화면 | 주소 |
|---|---|
| 랜딩 / Overview | `http://127.0.0.1:8000/?view=overview` |
| Catalog Checks | `http://127.0.0.1:8000/?view=checks` |
| Compare Lab | `http://127.0.0.1:8000/?view=compare` |
| Portfolio Gaps | `http://127.0.0.1:8000/?view=gaps` |
| Release / Evidence | `http://127.0.0.1:8000/?view=release` |
| Compare Report | `http://127.0.0.1:8000/compare-lab-output.html` |
| API 상태 | `http://127.0.0.1:8000/api/v1/health` |

로컬 프록시 때문에 접속이 안 되면 아래 명령으로 서버 상태를 먼저 확인한다.

```powershell
curl.exe --noproxy "*" http://127.0.0.1:8000/api/v1/health
```

## 랜딩 페이지를 보는 순서

왼쪽 메뉴는 앱 내부 5개 뷰와 팝업 보고서 1개로 구성된다.

| 순서 | 메뉴 | 확인할 내용 |
|---:|---|---|
| 1 | **Overview** | 현재 Release, 76/27/49 모델 수, Validation과 주요 GAP을 확인한다. |
| 2 | **Catalog Checks** | Warning을 코드·제조사·모델별로 필터하고 원본 Evidence를 확인한다. |
| 3 | **Compare Lab** | Re/Ro/Sc → COP/EER → Samsung → 경쟁사 순으로 고르고 안전 비교를 실행한다. |
| 4 | **Portfolio Gaps** | 냉매×유형별 HAVE/IN_PROGRESS/GAP/UNKNOWN과 추가 조사 대상을 확인한다. |
| 5 | **Release / Evidence** | 승인자·SHA·원본 위치와 직전 Release 대비 변경 모델·필드를 추적한다. |
| 6 | **Compare Report** | 직접 비교 가능한 결과와 차트를 별도 팝업에서 검토·CSV·인쇄한다. |

권장 검수 흐름은 `Overview → Catalog Checks → Compare Lab → Compare Report →
Release / Evidence`다. 숫자가 의심되면 마지막 화면에서 직전 Release Diff를 먼저
확인하고, 모델 → Release → sourcePath → PDF page/Markdown section 순으로 추적한다.

### Release Diff 보는 법

`Release / Evidence`의 **직전 Release 대비 변경** 영역은 두 불변 Bundle의 해시를
검증한 뒤 모델 ID별 차이를 보여준다. 추가·삭제·변경 모델과 수치·Evidence·성능맵
변경 수를 분리하며, 배열 원문 전체 대신 변경 필드와 항목 수만 표시한다. 현재
Release는 직전 `release:2026-07-30:005` 대비 성능맵이 추가된 2모델만 변경됐다.
이 화면은 조회 전용이며 과거 Release 편집·복원 기능은 없다.

## Compare Lab 사용법

1. 먼저 **Re / Ro / Sc** 유형을 선택한다.
2. **COP / EER** 지표를 선택한다.
3. 직접 비교 후보가 있는 Samsung 모델을 선택한다.
4. 조건을 통과한 경쟁사 모델 중 하나를 선택한다.
5. **안전 비교 실행**을 누른다.

후보는 같은 유형·냉매·측정조건·구동이고, 용량 차이가 ±15% 이내이며 선택
지표가 있어야 한다. UI가 후보를 걸러도 API가 같은 규칙을 다시 검사한다.

| 판정 | 의미 | 화면 동작 |
|---|---|---|
| `DIRECT / DIRECT_OK` | 직접 비교 가능 | 원본값, 용량 차이, 경쟁사 기준 Δ, 추가 분석 표시 |
| `REFERENCE` | 참고만 가능 | 차이의 이유와 필요한 데이터만 표시, 순위·승패 숨김 |
| `BLOCKED` | 비교 금지 | 차단 이유와 해결 조건만 표시, Δ·순위·승패 숨김 |

안전 비교 결과에는 조건 안전성, 용량·효율 해석, Evidence 신뢰도, 포트폴리오
시사점, 권장 조치·한계가 함께 나온다. 이 분석은 LLM 추정이 아니라 활성
Published Release의 값과 고정 규칙으로 생성된다.

### 속도별 RPM/RPS 분석

원천 속도점과 시험조건이 검증된 직접 비교쌍만 Recharts로 표시한다.

- X축은 RPM 또는 RPS를 선택할 수 있다. `RPS = RPM ÷ 60`이다.
- Y축은 해당 원천점의 COP/EER다.
- 원천에 없는 속도점은 보간·외삽하지 않는다.
- 조건이 다르거나 속도 데이터가 없으면 차트를 만들지 않고 조사 큐로 보낸다.

## Compare Report 보는 법

사이드바의 **Compare Report**를 누르면 `compareLabReport`라는 별도 팝업이 열린다.
정적 보고서는 비교할 내용이 없는 모델을 제외하고, 현재 직접 비교 가능한
Samsung 8모델과 DIRECT_OK 15건만 보여준다.

- 유형(Re/Ro/Sc)과 지표(COP/EER)로 필터
- Samsung·경쟁사 원본값 비교 차트
- 경쟁사 기준 Δ(%) 차트와 상세 카드
- 검증된 쌍에 한해 RPM/RPS별 COP/EER 차트와 원시점 표
- 전체 직접 비교 CSV, 속도 CSV, 브라우저 인쇄/PDF
- Release ID·모델 ID·Evidence locator 추적

보고서를 다시 만들려면 다음 명령을 실행한다.

```powershell
python scripts/build_compare_lab_report.py
npm --prefix studio run build
```

생성 원본은 `studio/compare-lab-output.html`, 서비스용 HTML은 build 후
`studio/dist/compare-lab-output.html`이다. CSV/JSON 원본은 `studio/public/`에 있다.

## 데이터와 릴리스 구조

```text
data/ 공개 원천 자료
  ↓ 조사·정규화
catalog/staging/catalog-bundle.json
  ↓ Schema + 도메인 Validator
catalog/published/releases/<release>/  불변 bundle + metadata
  ↓ active-release.json
FastAPI /api/v1  →  React Studio + Compare Report
```

핵심 안전 규칙:

- Samsung 공식 2024 카탈로그가 당사 모델 기본 권위 소스다.
- 2024 이후 자료는 원본을 덮지 않고 별도 Evidence 계층으로 보존한다.
- ARI/AHRI, DOE-A, DOE-B, EN12900 등 서로 다른 조건을 직접 순위화하지 않는다.
- R290 Re는 Samsung 미보유 `GAP`이며 가짜 모델이나 0값을 만들지 않는다.
- Published Release는 불변이다. 수정이 필요하면 새 Release를 발행한다.
- 발행은 관리자 CLI만 수행하며 Studio에는 편집·저장·발행 버튼이 없다.

### 데이터 갱신 절차

1. `data/`에 공식 카탈로그·데이터시트와 조사 근거를 저장한다.
2. `catalog/staging/catalog-bundle.json`을 갱신하고 출처 locator를 유지한다.
3. Schema, 권위값, 비교조건, GAP 규칙 테스트를 통과시킨다.
4. 승인 후 고유 Release ID로 `scripts/publish_catalog.py`를 실행한다.
5. Compare Report를 재생성하고 Studio를 빌드한다.
6. Python, Vitest, Playwright E2E와 Release/Evidence 화면을 확인한다.

상세 발행·롤백 절차는
[`docs/07-operations-and-362-expansion.md`](docs/07-operations-and-362-expansion.md)를
따른다. 기존 Release ID를 재사용하거나 활성 Release 파일을 직접 수정하지 않는다.

## 검증 명령

```powershell
$env:PYTHONUTF8='1'

# Python 계약·API·Release 회귀
python -m pytest -q

# React 컴포넌트와 production build
npm --prefix studio test
npm --prefix studio run build

# 실행 중인 http://127.0.0.1:8000 대상 브라우저 검증
$env:E2E_BASE_URL='http://127.0.0.1:8000/'
$env:REPORT_BASE_URL=$env:E2E_BASE_URL
$env:P14_BASE_URL=$env:E2E_BASE_URL
$env:P15_BASE_URL=$env:E2E_BASE_URL
npm --prefix qa run test:p5
npm --prefix qa run test:report
npm --prefix qa run test:p14
npm --prefix qa run test:p15
```

P18 최종 로컬 기준은 Python 99 passed, Vitest 38 passed, P5 E2E 16/16,
P15/P16 E2E 8/8, 정적 보고서 회귀 2/2, 콘솔·페이지·외부요청·가로 overflow
0이다. 실행할 때마다
현재 결과와 [`docs/PROGRESS.md`](docs/PROGRESS.md)를 함께 확인한다.

## Cloudflare 경량 배포

무료 Workers 한도에 맞춰 운영 배포는 Python/FastAPI를 번들하지 않는다.
`cloudflare/worker.js`가 기존 조회·비교·분석 API 계약을 유지하고, 검증된
Published Release는 배포 전에 `studio/dist/_runtime/` JSON asset으로 생성한다.

```powershell
$env:PYTHONUTF8='1'
$env:NODE_OPTIONS='--use-system-ca' # 사내 인증서 환경에서만 필요

python scripts/build_compare_lab_report.py
npm --prefix studio run build
python scripts/prepare_cloudflare_deploy.py
npm --prefix cloudflare test

Push-Location cloudflare
npx --yes wrangler@4.118.0 deploy --dry-run
npx --yes wrangler@4.118.0 login
npx --yes wrangler@4.118.0 deploy
Pop-Location
```

배포 후 `/api/v1/health`, 랜딩 페이지, Compare Lab, Compare Report,
Release Diff, RPM/RPS 차트를 확인한다. 임시 preview 계정은 단일 asset 5MB
제한 때문에 8.57MB 공식 PDF가 제외될 수 있으므로 영구 계정 배포에서 PDF
응답까지 최종 확인한다. 상세 계약은
[P19 Cloudflare 배포 문서](docs/16-cloudflare-lightweight-deploy.md)를 따른다.

## 프로젝트 폴더

```text
backend/   FastAPI 조회·검증·비교·분석·속도맵
catalog/   staging, 확장 검토 Batch, 불변 Published Release
cloudflare/ 의존성 없는 JavaScript Worker와 Wrangler 설정
config/    권위값·GAP·비교 정책
data/      PDF와 Markdown 리서치 원천
docs/      아키텍처·운영·TDD 계획·진행 기록
frontend/  기존 DC 대시보드(Legacy)
qa/        Playwright 실행기, 평가표, 최종 증거
scripts/   이관·발행·정적 보고서 생성 도구
studio/    React 19 + TypeScript + Vite 앱과 정적 보고서
tests/     Python 및 UI 테스트 계약
```

문서 시작점:

- [문서 인덱스](docs/README.md)
- [현재 진행 상태](docs/PROGRESS.md)
- [전체 개발 계획](docs/PLAN.md)
- [UI 아키텍처](docs/05-ui-architecture.md)
- [Runtime 실행](docs/06-runtime.md)
- [운영·발행·롤백](docs/07-operations-and-362-expansion.md)
- [CI Gate](docs/08-ci-gate.md)
- [P18 Release Diff TDD](docs/15-release-diff-tdd-plan.md)
- [P19 Cloudflare 경량 배포](docs/16-cloudflare-lightweight-deploy.md)
- [QA 인덱스](qa/README.md)
- [테스트 계약 인덱스](tests/README.md)

## Legacy DC 화면

기존 5탭 DC 화면은 회귀 비교용으로만 유지한다.

```powershell
python -m http.server 8001 --directory frontend
# http://127.0.0.1:8001/
```

Legacy 데이터는 `frontend/compressor-data.js`가 SSOT이며
`frontend/support.js`는 생성물이므로 직접 편집하지 않는다. `file://`로 열면
런타임 fetch가 실패하므로 반드시 HTTP 서버를 사용한다.

## 알려진 경계

- 공개 자료만으로 확인되지 않은 값은 UNKNOWN/조사 큐로 남긴다.
- Warning 2건은 공개 원본과 계산식 간 차이를 숨기지 않고 Release에 보존한다.
- 금액·성능을 임의 추정하지 않으며, 직접 비교 조건이 없으면 결과를 만들지 않는다.
- 이 저장소의 데이터와 보고서는 내부 연구·경쟁 인텔리전스 검토 목적이다.
