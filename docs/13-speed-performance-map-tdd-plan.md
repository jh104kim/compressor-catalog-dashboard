# P15 RPM/RPS 성능 맵·Recharts TDD 개발안

## Goal

Compare Lab과 정적 Compare Report에서 **속도별 원천 성능점이 검증된 직접 비교쌍만**
RPM/RPS별 **양쪽 Evidence가 완결된 지표**를 Recharts로 보여준다. 현재 Re
Golden은 용량·COP를 제공하며 EER·입력전력은 공식 성능점 확보 후 자동 노출한다. 공개 자료가 부족한
Ro/Sc 비교쌍에는 곡선을 만들지 않고 `DATA_REQUIRED`와 확보해야 할 자료를
안내한다.

## Current structure

- `/api/v1/compare/report`는 같은 Published Release에서 비교 판정과 P14 분석을
  반환한다.
- Compare Lab은 유형 → Samsung 모델 → 직접 비교 가능 경쟁 모델 → 지표 순으로
  선택하고 `comparisonRevision`으로 지연 응답을 폐기한다.
- RED 기준 Published 005에는 직접 비교 지표행 15개·고유 모델쌍 9개가 있었지만
  속도별 성능점은 구조화돼 있지 않았다. 구현 결과는 활성
  `release:2026-08-03:001`의 별도 `performanceMaps`로 발행한다.
- 원천 후보 중 Samsung `ENV4A5DL2B`와 Panasonic
  `TKF76E25DCH-52RPS`가 첫 Re 수직 슬라이스 대상이다.
- `Hz`는 시험/전원 주파수일 수 있으므로 축 회전속도 RPM/RPS로 변환할 수 없다.

## Proposed approach

### 선택안: 관측 성능점 전용 `performanceMaps`

모델 정격 스펙과 속도별 성능점을 분리한다. API는 원천 단위를 보존하면서
`rpm = rps × 60`만 정확히 파생하고, UI는 API가 `chartEligible=true`로 판정한
경우에만 차트와 접근 가능한 표를 함께 표시한다.

```text
Published performanceMaps
  → same Release model pair snapshot
  → CURVE_READY / POINT_READY / REFERENCE_ONLY / DATA_REQUIRED
  → speedAnalysis + safeguards + Evidence
  → Recharts + 원시 성능점 표 + JSON/CSV/print
```

`Line`은 확보된 성능점을 순서대로 연결하는 시각 보조로만 사용한다. 회귀·평활화·
보간·외삽으로 새 성능점을 생성하지 않으며 차트의 점 수는 API 원천점 수와 같아야
한다.

## Task breakdown

| Task | 범위 | TDD 진행 | 배점 |
|---|---|---|---:|
| `P15-A` | 성능 맵 스키마·Evidence·단위 계약 | 문서/스키마 RED → Golden fixture → 계약 GREEN | 20 |
| `P15-B` | 속도 판정 엔진·compare/report API | API RED → 상태/환산/safeguard GREEN → 중복 제거 | 25 |
| `P15-C` | Compare Lab Recharts·표·빈 상태 | Vitest RED → eligible 전용 UI → 반응형/접근성 | 25 |
| `P15-D` | 정적 Report·CSV·print·stale 안전 | 출력/stale RED → 동일 Release trace → 회귀 | 15 |
| `P15-E` | Playwright·CI·평가·운영 로그 | desktop/mobile RED → 로컬 2회 → CI/Judge | 15 |
| **합계** |  |  | **100** |

## Implementation steps

### P15-A — 데이터·계약

1. `REQ-P15-001~007`과 TEST-ID를 구현 전에 고정한다.
2. `performanceMaps[].points[]`에 속도, 용량, 입력전력, COP/EER,
   `MEASURED|DERIVED`, Evidence를 저장한다.
3. 원천 `rpm|rps`를 보존하고 API에서 반대 단위를 파생한다.
4. Evidence 없는 성능점과 `Hz`만 있는 행은 Published 승격을 차단한다.

### P15-B — 판정·API

`POST /api/v1/compare/report` 최상위에 `speedAnalysis`를 추가한다.

- `status`: `CURVE_READY|POINT_READY|REFERENCE_ONLY|DATA_REQUIRED`
- `chartEligible`, `rankingAllowed`, `reason`, `metricOptions`
- `commonRange`, `series[].points[]`, `safeguards`
- 각 점: `speedValue`, `speedUnit`, `rpm`, `rps`, 성능 지표,
  `valueKind`, `evidence`

`CURVE_READY`는 양쪽에 Evidence가 있는 다중 속도점과 공통 운전영역이 있을 때만
허용한다. `DATA_REQUIRED`는 `chartEligible=false`, `commonRange=null`, 빈 points,
보간·외삽·Hz 변환 모두 false다.

### P15-C — Compare Lab UI

- `speed-analysis`: 속도 분석 전체 영역
- `speed-unit-toggle`: RPM/RPS 버튼
- `speed-metric-toggle`: API `metricOptions`에 있는 지표만 표시. 현재 Re Golden은
  용량/COP이며 EER/입력전력은 한쪽 값이 미공개이므로 숨김
- `speed-chart`: Recharts 차트, `data-point-count`로 원천점 수 노출
- `speed-data-table`: caption `속도별 원시 성능점`, Evidence 열 포함
- `speed-data-gap`: `DATA_REQUIRED` 사유와 공식 자료 확보 조건

차트는 `ResponsiveContainer`를 사용한다. 색상만으로 계열을 구분하지 않고 모델명,
점 표식, 범례, Tooltip을 함께 제공한다. 모바일에서는 페이지 overflow 없이 표
컨테이너만 내부 스크롤을 허용한다.

### P15-D — 정적 보고서·비동기 안전

1. 정적 `compare-lab-output.html`에도 eligible Re 비교쌍의 속도 섹션과 차트를
   포함한다.
2. 속도 성능 CSV는 Release·두 modelId·단위·지표·Evidence locator를 보존한다.
3. 기존 팝업·전체 비교 CSV·Compare Lab 링크·print 동작을 회귀 검증한다.
4. 비교 요청 중 모델·유형·지표가 바뀌면 이전 `speedAnalysis`, 표, 내려받기를
   함께 폐기한다.

### P15-E — E2E·평가

Playwright는 `1440×1024`, `390×844`, Chromium, retries 0으로 실행한다.
Release ID는 하드코딩하지 않고 `/api/v1/releases/active` 응답을 사용한다.

1. Re eligible: `ENV4A5DL2B ↔ TKF76E25DCH-52RPS`.
2. RPM↔RPS 변환, 양쪽 완결 지표(현재 용량·COP), 차트점=API점,
   표/Evidence를 확인한다.
3. Sc `DS8LC5040IN ↔ STDA031N1ULB`는 `DATA_REQUIRED`, 차트 0개를 확인한다.
4. 650ms 지연 응답 중 선택을 바꿔 stale 속도 분석 0개를 확인한다.
5. 정적 보고서·CSV·print·popup 회귀와 오류/외부요청/쓰기/overflow 0을 확인한다.

## Risks / decisions log

| 구분 | 문제 | 결정 |
|---|---|---|
| 단위 | `57.5Hz` 등을 회전속도로 오인 가능 | `Hz → RPM/RPS` 변환 금지, safeguard로 검사 |
| 데이터 | 한쪽만 다중 속도점이면 그럴듯한 가짜 곡선 생성 가능 | 양쪽 Gate 충족 전 `DATA_REQUIRED` 또는 참고 상태 |
| 지표 | Panasonic 공개점에 inputW/EER가 없어 4지표 강제 시 가짜 파생 위험 | 양쪽 Evidence 완결 지표만 metricOptions에 포함 |
| 수학 | 선형/스플라인 보간이 미측정 성능처럼 보일 수 있음 | 원천점만 plot, 생성점 0, 점 수 동일성 검사 |
| Release | RED 기준 005에서 구현 Release 001로 변경 | 활성 Release API로 동적 추적 |
| 접근성 | SVG만으로 수치를 읽기 어려움 | 동일 원시점 표와 Evidence 열 필수 |
| 정적 출력 | Recharts가 인쇄/팝업에서 누락될 수 있음 | production build 후 print media와 팝업 E2E |

## Test plan

1. Python/schema: Evidence 100%, 정확한 60배 환산, Hz 차단, 상태 판정.
2. Vitest: eligible 완결 지표/2단위/표, 미완결 지표 0,
   DATA_REQUIRED chart 0, stale 폐기.
3. Playwright: 두 viewport에서 실제 API·React production build 검증.
4. 출력: 정적 보고서, 속도 CSV, JSON, print, 명명 popup 회귀.
5. 공통 Gate: 외부 요청·console/page/network 오류·금지 쓰기·페이지 overflow 0.
6. 로컬 새 실행 2회 연속 PASS 후 GitHub Actions Chromium 1회 PASS.

## Done criteria

- `REQ-P15-001~007`이 TEST/RUN/Evidence와 추적된다.
- 표시된 모든 성능점의 Evidence 연결률이 100%다.
- RPM/RPS는 `rpm = rps × 60`이고 Hz를 속도로 바꾼 항목이 0개다.
- 보간·외삽·회귀로 생성한 성능점이 0개다.
- 차트 수와 API `chartEligible` 대상 수가 정확히 일치한다.
- DATA_REQUIRED 모델쌍은 차트 0개와 구체적 자료 공백을 표시한다.
- Python·Vitest·build·Playwright가 retries 0으로 전부 PASS한다.
- Critical 0, Major 0, 각 품질축 4.8/5 이상, Task score 96/100 이상이다.
- 평가 보완 루프는 최대 3회이며 최종 CI 성공 증거가 기록된다.
