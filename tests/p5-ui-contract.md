# P5 React UI 테스트 계약

## 1. 목적과 범위

P5 UI는 활성 `PUBLISHED` Release를 조회하고, 비교 판정을 왜곡 없이 보여주는
**View-first** 앱이다. 이 문서는 구현 전에 Vitest 단위 테스트와 Playwright
E2E의 책임·테스트 ID·합격 기준을 고정한다.

- Vitest: API 응답을 UI가 올바르게 표시·숨김·라우팅하는지 검사한다.
- Playwright: FastAPI가 제공하는 실제 React 빌드에서 Golden G1~G8과 사용자
  흐름을 검사한다.
- P3 책임: Staging 검증, 실제 발행 실패 원자성, 활성 Release 포인터 교체.
- P5 책임: 권위값과 활성 Release만 표시하고 편집·발행 기능을 노출하지 않으며,
  API의 `DIRECT/REFERENCE/BLOCKED/GAP` 판정을 그대로 지킨다.

UI는 직접 비교 후보 목록을 만들기 위해 백엔드의 DIRECT 조건을 읽기 전용으로
미리 적용한다. 최종 판정과 Delta 계산은 API가 담당하며, UI는 API 응답을 다시
안전하게 표현한다.

## 2. 고정 실행 조건

| 항목 | 계약 |
|---|---|
| 데스크톱 | `1440 × 1024` |
| 모바일 | `390 × 844` |
| 브라우저 | Chromium |
| 서버 | FastAPI가 React production build를 같은 origin에서 제공 |
| Playwright | `retries=0`, `reuseExistingServer=false`, 실행마다 새 동적 포트 |
| 외부 요청 | Google Fonts·CDN·분석 도구를 포함해 **0건** |
| 오류 | `console.error=0`, `pageerror=0`, 실패 요청=0, HTTP `>=400` 응답=0 |
| 데이터 | 고정 P5용 `PUBLISHED` Release fixture |
| 최종 반복 | 로컬 2회 연속 PASS + GitHub Actions Chromium 1회 PASS |

앱 요청은 같은 origin의 정적 자원과 다음 API만 허용한다.

- `GET /api/v1/releases/active`
- `GET /api/v1/catalog/models`
- `GET /api/v1/portfolio/{type}/{refrigerant}`
- `POST /api/v1/compare` — 데이터 변경이 없는 판정 요청
- `POST /api/v1/compare/report` — 데이터 변경 없이 판정·분석을 반환하는 요청
- `GET /api/v1/evidence/{modelId}`
- 원천 PDF를 제공한다면 같은 origin의 읽기 전용 경로

`POST /api/v1/releases/publish`, `PUT`, `PATCH`, `DELETE` 요청은 0건이어야 한다.

## 3. Golden fixture

테스트는 실행마다 같은 fixture를 새 임시 Release 저장소에 발행한다.

| 목적 | 고정값 |
|---|---|
| 활성 Release | `catalog/published/active-release.json`과 일치, `status=PUBLISHED` |
| G1 Samsung | `model:samsung:DS8LC5040IN`, Sc/R454B/DOE-B/Fixed |
| G1 경쟁사 | `model:gmcc:STDA031N1ULB`, 같은 비교키, 용량차 `6.21%` |
| G1 판정 | EER 기준 `DIRECT`, `DIRECT_OK`, `rankingAllowed=true`, `deltaPct` 숫자 |
| G2 Samsung | 직접 후보 있음: `UB9TK2150F`; 리서치 큐: `UB8TN8300F` |
| G2 경쟁사 | 직접 후보 Panasonic `9RL160Z`; 제외 후보 GMCC R32 Ro/SEER60 |
| G2 선택 Gate | 직접 후보가 있는 Samsung만 선택하고, 조건 불일치 경쟁 모델은 후보에서 제외 |
| G3 포트폴리오 | `Re/R290=GAP`, Samsung 모델 `[]`, 경쟁 모델 `>=1` |
| G4 권위 모델 | `model:samsung:DS4BC7066FVT`, COP `3.25` |
| G6 Evidence | Release ID, Samsung 모델 ID, `data/Samsung-Compressor-Catalogue_2024.pdf`, `pdf-page`, page `92` |

fixture에 `3.34`, Samsung R290 Re 가짜 모델, 수치 `0`, Staging 레코드를 넣지
않는다. 별도의 음수 fixture에서만 잘못된 응답에 대한 방어 UI를 검사한다.

## 4. 최소 UI·URL 계약

텍스트만으로 선택하지 않도록 아래 `data-testid`를 구현한다.

| 영역 | 필수 selector |
|---|---|
| 앱/Release | `app-shell`, `active-release`, `release-id`, `release-status`, `release-hash`, `read-only-notice` |
| 검색/필터 | `global-search`, `search-results`, `filter-type`, `filter-refrigerant`, `filter-condition`, `filter-drive-class` |
| 모델 | `model-list`, `model-detail`, `model-name`, `model-cop` |
| 비교 | `compare-type-tabs`, `comparison-readiness`, `eligible-candidate-count`, `no-direct-candidate`, `comparison-panel`, `comparison-verdict`, `comparison-code`, `comparison-ranking`, `comparison-delta`, `comparison-reason` |
| GAP | `portfolio-status`, `samsung-models`, `competitor-models` |
| Evidence | `evidence-open`, `evidence-panel`, `evidence-model-id`, `evidence-release-id`, `evidence-source-path`, `evidence-locator`, `source-open` |

비교 패널에는 판정 확인용 `data-verdict`와 `data-code`도 둔다. 모델 행은
`data-model-id`, 비교 행은 `data-candidate-id`를 사용한다.

딥링크 계약은 다음과 같다. 파라미터 순서는 무관하다.

- 모델: `/?view=model&modelId=model%3Asamsung%3ADS4BC7066FVT`
- 비교: `/?view=compare&baselineModelId=...&candidateModelId=...`
- 포트폴리오: `/?view=portfolio&type=Re&refrigerant=R290`
- Evidence 열림: 모델 URL에 `&evidence=1`

검색 결과 선택과 필터 변경은 URL을 갱신한다. 새로고침과 URL 직접 접근은 같은
화면을 복원해야 한다.

## 5. Vitest assertion catalog

React Testing Library와 `userEvent`를 사용한다. API는 MSW 또는 동등한
in-memory adapter로 격리하며 실제 네트워크를 사용하지 않는다.

### Golden G1~G8

| 테스트 ID | 입력/행동 | 필수 assertion |
|---|---|---|
| `P5-UT-G1-001` | `DIRECT_OK` 비교 응답 렌더 | `comparison-verdict=DIRECT`, 코드 `DIRECT_OK`, 네 비교키 배지 표시 |
| `P5-UT-G1-002` | `rankingAllowed=true`, `deltaPct` 숫자 | 순위와 소수 둘째 자리 Δ가 표시되고 `동일 조건 직접 비교` 문구 표시 |
| `P5-UT-G2-001` | `BLOCKED_CONDITION_MISMATCH` 렌더 | `BLOCKED`와 ARI/SEER60 조건 배지, 차단 사유 표시 |
| `P5-UT-G2-002` | 위 BLOCKED 응답 | `comparison-ranking`과 `comparison-delta`가 DOM에 없고 `우위/열위/승/패` 문구도 없음 |
| `P5-UT-G2-003` | BLOCKED인데 악성 fixture가 rank/Δ도 전달 | UI는 rank/Δ를 무시하고 숨김. API 모순 경고를 사용자 안전 오류로 표시 |
| `P5-UT-G3-001` | `Re/R290=GAP` 응답 | `portfolio-status=GAP`, Samsung 모델 영역은 `없음`, 경쟁 모델은 표시 |
| `P5-UT-G3-002` | GAP 응답 | Samsung 모델 카드·수치 `0`·순위·Δ가 생성되지 않음 |
| `P5-UT-G4-001` | DS4BC7066FVT 상세 | COP `3.25`, `Samsung 2024 공식` 배지 표시, `3.34` 문자열 없음 |
| `P5-UT-G4-002` | 권위 모델의 Evidence 동작 | Evidence 버튼이 모델 ID를 유지한 채 패널을 열고 page 92를 표시 |
| `P5-UT-G5-001` | 활성 Release 메타 렌더 | 정확한 Release ID, `PUBLISHED`, 해시 축약값, 승인자·승인시각 표시 |
| `P5-UT-G5-002` | 앱 전체 렌더 | 편집 input/grid, `저장`, `발행`, `Publish`, `승인 후 발행` 버튼과 메뉴가 없음 |
| `P5-UT-G5-003` | 활성 Release 재조회 실패 | 마지막 정상 Release ID와 데이터는 유지하고 읽기 오류 배너만 표시 |
| `P5-UT-G6-001` | Evidence 응답 렌더 | 모델 ID → 활성 Release ID → PDF 경로 → `pdf-page 92` 순서가 한 패널에서 확인 가능 |
| `P5-UT-G6-002` | 원천 열기 링크 | 같은 origin의 읽기 전용 URL이며 PDF fragment 또는 UI 표기가 page 92를 가리킴 |
| `P10-UT-G1-001` | Re/Ro/Sc 유형 탭 선택 | 선택 유형에서 직접 후보가 있는 Samsung 모델만 표시하고 가능한 지표로 전환 |
| `P9-UT-G1-002` | Samsung 모델·지표 선택 | 동일 유형·냉매·조건·구동·용량 ±15%·지표 보유 경쟁 모델만 표시 |
| `P10-UT-G2-001` | 직접 후보 0건인 Samsung 모델 | Samsung 선택에서 제외하고 공식 자료 리서치 큐에 냉매·조건·구동·용량 범위·지표 표시 |

### 검색·필터·딥링크·표시 안전성

| 테스트 ID | 입력/행동 | 필수 assertion |
|---|---|---|
| `P5-UT-NAV-001` | 검색창에 `DS4BC7066FVT` 입력 | 한 결과만 표시, 선택 후 모델 상세와 URL `modelId` 갱신 |
| `P5-UT-NAV-002` | 검색 결과가 0건 | 빈 상태 표시, 기존 모델을 임의 선택하지 않음 |
| `P5-UT-FILTER-001` | `Sc → R454B → DOE-B → Fixed` 순서로 필터 | 선택값이 모두 유지되고 DS8LC 후보만 남음 |
| `P5-UT-FILTER-002` | 조건을 ARI로 변경 | 이전 DOE-B 선택 모델·비교 결과를 초기화하고 새 조건 결과만 표시 |
| `P5-UT-LINK-001` | 모델 딥링크 직접 렌더 | 해당 모델 상세를 바로 표시하고 검색·필터 상태도 일치 |
| `P5-UT-LINK-002` | 비교 딥링크 직접 렌더 | baseline/candidate를 복원해 동일 비교 요청 1회만 수행 |
| `P5-UT-LINK-003` | Evidence 딥링크 직접 렌더 | 모델 상세와 Evidence 패널이 함께 열림 |
| `P5-UT-LINK-004` | 존재하지 않는 modelId | 명시적 `모델을 찾을 수 없음`, 빈 순위·가짜 수치 없음 |
| `P11-UT-LINK-005` | 비교 API 응답이 지연되는 딥링크 직접 렌더 | loading 상태가 해제되고 비교 결과와 실행 버튼이 정상 복구 |
| `P5-UT-STATE-001` | API loading/error/empty 각각 렌더 | 서로 구분되는 상태, 오류 중 이전 Release를 Staging 값으로 대체하지 않음 |

### Vitest 합격 기준

- 현재 구현된 전체 Vitest 모두 PASS.
- BLOCKED/GAP 테스트에서 순위·Δ·우열 표현이 0개.
- `3.34`, 편집·발행 control이 0개.
- 테스트 중 실제 `fetch`가 mock되지 않은 주소로 나가면 즉시 FAIL.
- 스냅샷 단독 비교로 통과시키지 않고 role·텍스트·속성의 명시 assertion을 사용.

## 6. Playwright E2E assertion catalog

각 Golden 테스트는 같은 시나리오를 데스크톱 `-D`와 모바일 `-M`로 실행한다.
예: `P5-E2E-G1-001-D`, `P5-E2E-G1-001-M`.

### Golden G1~G8

| 기본 테스트 ID | 실제 사용자 흐름 | 합격 기준 |
|---|---|---|
| `P5-E2E-G1-001` | `Sc` 탭 → EER → DS8LC5040IN → STDA031N1ULB 비교 | 후보가 직접 비교 모델로 제한되고 `DIRECT_OK`, 순위와 Δ 모두 보임 |
| `P5-E2E-G2-001` | `Ro` 탭 → COP | Panasonic ARI 직접 후보가 있는 Samsung만 선택 가능하고, UB8TN8300F는 리서치 큐에 남으며 GMCC SEER60은 후보에서 제외 |
| `P5-E2E-G3-001` | 포트폴리오에서 `Re/R290` 선택 | GAP 표시, 경쟁 모델 `>=1`, Samsung 모델·가짜 0·순위 없음 |
| `P5-E2E-G4-001` | 검색으로 DS4BC7066FVT 선택 | 모델 상세 COP 3.25, 공식 배지, 화면 전체에 3.34 없음 |
| `P5-E2E-G5-001` | 앱 진입 → 여러 화면 이동 → 새로고침 | Release ID·해시 불변, PUBLISHED만 표시, 편집·발행 control 없음 |
| `P5-E2E-G6-001` | G4 상세에서 Evidence 열기 | DS4BC7066FVT → 활성 Release → Samsung PDF → pdf-page 92 연결 |
| `P5-E2E-G7-001` | B1 Scroll p.92 검토 Batch 확인 | 비교 불가 후보가 직접 비교 목록에 섞이지 않고 검토 상태로 유지 |
| `P5-E2E-G8-001` | 비교 딥링크 직접 진입 | `DIRECT_OK` 복원 후 loading 문구가 사라지고 실행 버튼이 다시 활성화 |

### 검색·필터·딥링크

| 테스트 ID | 흐름 | 합격 기준 |
|---|---|---|
| `P5-E2E-NAV-001-D/M` | 헤더 검색 → 결과 선택 | 상세 갱신, URL modelId 반영, 새로고침 후 같은 모델 |
| `P5-E2E-FILTER-001-D/M` | 유형·냉매·조건·구동 필터 변경 | 매 단계 결과가 줄고 잘못된 조건의 이전 비교 결과가 남지 않음 |
| `P5-E2E-LINK-001-D/M` | 모델 딥링크를 새 context에서 직접 열기 | 검색을 거치지 않고 모델·Release·COP 복원 |
| `P5-E2E-LINK-002-D/M` | 비교 딥링크 직접 열기 후 `history.back()` | 비교 복원, 뒤로 가기 시 이전 모델/필터 상태 복원 |
| `P5-E2E-LINK-003-D/M` | Evidence 딥링크 직접 열기 | Evidence 패널과 page 92 표시, 닫으면 모델 URL 유지 |

### 공통 브라우저 Gate

다음 검사는 모든 Playwright 테스트의 fixture에서 자동 적용한다.

| 테스트 ID | 합격 기준 |
|---|---|
| `P5-E2E-GUARD-001` | 요청 URL의 origin이 `baseURL`과 다른 요청 0건 |
| `P5-E2E-GUARD-002` | `requestfailed` 0건, HTTP `>=400` 0건 |
| `P5-E2E-GUARD-003` | `console.error` 0건, `pageerror` 0건 |
| `P5-E2E-GUARD-004` | 발행 API, `PUT/PATCH/DELETE` 요청 0건 |
| `P5-E2E-GUARD-005-D/M` | `documentElement.scrollWidth <= clientWidth + 1`; 내부 표 스크롤만 허용 |
| `P5-E2E-GUARD-006-D/M` | 미해결 `{{ }}`, 빈 root, 로딩 spinner 잔류 0건 |

내부 넓은 표는 `[data-testid="table-scroll"]` 안에서만
`scrollWidth > clientWidth`를 허용한다. 모바일에서 주요 버튼·필터·Evidence
패널은 가로 스크롤 없이 키보드와 터치로 접근 가능해야 한다.

## 7. BLOCKED/GAP 음수 assertion

다음 선택자는 BLOCKED 또는 GAP 화면에 존재하면 즉시 Critical FAIL이다.

- `[data-testid="comparison-ranking"]`
- `[data-testid="comparison-delta"]`
- `[data-ranking]`, `[data-delta]`
- `우위`, `열위`, `승`, `패`, `TOP`, `1위`

단, 차단 사유 설명 안에서 “순위 없음”처럼 금지 원칙을 설명하는 문구는
`comparison-reason` 안에서만 허용한다. 값이 없는 항목은 `0`, `0.00`,
`0%`로 대체하지 않고 `미확보` 또는 `해당 없음`으로 표시한다.

## 8. P5 최종 합격 기준

P5는 아래 조건을 모두 만족해야 완료다.

1. Vitest assertion catalog 전부 PASS.
2. Golden G1~G8이 두 viewport에서 PASS.
3. 검색·4종 필터·모델/비교/Evidence 딥링크가 두 viewport에서 PASS.
4. BLOCKED/GAP에서 순위·Δ·우열·가짜 0이 0개.
5. 화면에 활성 `PUBLISHED` Release ID·상태·해시가 항상 표시됨.
6. 모델 → Release → 원천 PDF page 92 Evidence 추적이 가능함.
7. 편집·저장·발행 UI와 발행 네트워크 요청이 0개.
8. 외부 요청, console/page/network 오류, 페이지 전체 가로 overflow가 모두 0개.
9. 로컬 새 서버에서 2회 연속 PASS 후 GitHub Actions Chromium 1회 PASS.
10. Critical 0, Major 0, P5 Eval score `4.7/5 이상`.

실행 증거에는 Git SHA, Release ID, 브라우저 버전, viewport, 테스트 ID별 결과,
네트워크 요약, 캡처 경로를 기록한다. 재시도로 PASS를 만들지 않는다.
