# P14 Compare Lab 추가 분석·레포팅 TDD 개발안

> 상태: 완료. 현재 활성 Release와 보고서 수치는 동적으로 조회한다.

## Goal

1. 랜딩 사이드바에 `Compare Report` 탭을 추가하고, 사용자 클릭으로
   `compare-lab-output.html`을 명명된 팝업으로 연다.
2. 활성 Published Release를 기준으로 HTML과 CSV 비교 산출물을 함께 갱신한다.
3. `안전 비교 실행` 시 현재 비교 결과만 보여주는 데서 끝내지 않고, 카탈로그
   근거를 이용한 추가 분석과 의사결정용 레포팅을 함께 제공한다.
4. 기존 Goal인 동일 비교군, Release 무결성, Evidence 추적성, View-first 경계를
   유지하면서 RED → GREEN → REFACTOR 순서로 개발한다.

## Current structure

- `backend/catalog_audit/comparison.py`: DIRECT/REFERENCE/BLOCKED 판정과 Δ 계산.
- `backend/catalog_audit/api.py`: 활성 Release 조회 및 `/api/v1/compare`.
- `studio/src/App.tsx`: Compare Lab 유형·모델·지표 선택과 결과 표시.
- `scripts/build_compare_lab_report.py`: 활성 Release 기준 HTML·CSV·속도 JSON 생성.
- `studio/compare-lab-output.html`: 생성 원본. Vite build 후 `studio/dist/compare-lab-output.html`로 배포.
- `qa/scripts/p5-e2e.cjs`: 기존 Compare Lab 데스크톱·모바일 16개 시나리오.
- `qa/scripts/compare-report-e2e.cjs`: 전체 보고서와 Compare Lab 연결 검증.

현재 비교 엔진은 조건 안전성을 잘 지키지만, 결과 이후의 해석·한계·근거 신뢰도·
후속 조치를 구조화한 API와 UI 계약은 아직 없다.

## Proposed approach

### 선택안

첫 버전은 LLM을 호출하지 않는 **결정론적 분석 엔진**으로 구현한다.

- 입력: 활성 Release의 Samsung 모델, 경쟁 모델, 지표, 비교 판정.
- 처리: 기존 `compare_models()` 결과를 재사용하고 별도 분석 함수가 설명을 생성.
- 출력: 비교 안전성, 용량 맥락, 효율 차이, Evidence 신뢰도, 포트폴리오 시사점,
  권장 조치, 한계와 출처.
- UI: `안전 비교 실행` 1회로 비교 결과와 분석 레포트를 함께 받는다.

새 API 후보는 `POST /api/v1/compare/report`다. 기존 `/api/v1/compare`는
호환성을 위해 유지한다.

```text
Compare request
  → compare_models()            기존 안전 판정
  → build_comparison_analysis() 신규 결정론적 분석
  → comparison + analysis + evidence + releaseId
  → Compare Lab 결과/레포트 패널
```

DIRECT는 수치 해석을 허용한다. REFERENCE/BLOCKED는 순위·Δ·우열을 생성하지
않고 차단 이유, 확보해야 할 데이터, 참고 가능한 Evidence만 설명한다.

## Task breakdown

| Task | 범위 | TDD 진행 | 배점 |
|---|---|---|---:|
| `P14-A` | 랜딩 팝업 탭, HTML+CSV 동시 산출, CI 재생성 | UI/CSV RED → 구현 → 팝업 E2E | 15 |
| `P14-B` | 결정론적 비교 분석 도메인·API | API RED → 분석 함수/API GREEN → 중복 제거 | 25 |
| `P14-C` | 안전 비교 후 분석 레포트 UI | Vitest RED → 5개 분석 섹션 → 인쇄/다운로드 | 25 |
| `P14-D` | Evidence·Release 추적, 지연 응답 stale 차단 | 지연 fixture RED → revision/snapshot → 회귀 | 20 |
| `P14-E` | 전체 E2E, 접근성, 독립 Judge, 점수 확정 | desktop/mobile 2회 → CI → 최대 3회 평가 | 15 |
| **합계** |  |  | **100** |

### P14-A — 랜딩·정적 산출물

1. `P14-UT-NAV-001` 실패를 먼저 확인한다.
2. 랜딩 사이드바의 6번째 탭으로 `Compare Report`를 추가한다.
3. 팝업 이름을 `compareLabReport`로 고정해 중복 팝업을 줄인다.
4. 보고서 생성 시 `compare-lab-output.csv` 15개 DIRECT 판정도 함께 만든다.
5. CI에서 보고서를 재생성하고 팝업·CSV를 Chromium으로 확인한다.

### P14-B — 분석 도메인·API

1. `ComparisonAnalysis` 스키마와 Golden fixture를 먼저 만든다.
2. DIRECT 분석은 정확한 Δ 부호와 용량 차이를 사용한다.
3. 신뢰도는 양쪽 Evidence authority/confidence 중 낮은 쪽을 상한으로 한다.
4. 원천에 없는 시장규모·가격·수명·비용은 생성하지 않는다.
5. BLOCKED/REFERENCE 음수 fixture에서 우위·열위·순위·Δ가 0개인지 검사한다.

### P14-C — UI 레포팅

안전 비교 결과 아래에 다음 5개 섹션을 표시한다.

1. 비교 결론과 조건 안전성
2. 용량·효율 차이 해석
3. 데이터 신뢰도와 Evidence
4. 포트폴리오 시사점
5. 권장 후속 조치와 분석 한계

API가 허용하지 않은 수치를 프론트엔드가 재계산하지 않는다. 인쇄/PDF와 JSON
내려받기는 현재 Release ID, 모델 ID, 지표를 반드시 포함한다.

### P14-D — 비동기 안전성

모델·지표·유형 변경마다 `comparisonRevision`을 증가시키고 요청 시작 시
revision과 모델 ID를 snapshot으로 보관한다. 응답 시 현재 snapshot과 다르면
비교 결과·분석 레포트·내려받기 상태를 모두 폐기한다.

지연 응답 테스트는 이전 요청이 최신 선택을 덮어쓰는 stale 결과가 0건임을
검사한다.

### P14-E — 평가

각 Task 완료 때 REQ/TEST/RUN 증거를 기록한다. 전체 구현 후 독립 Judge가
기능 완전성, 비교 안전성, 추적성, UX/E2E, 유지보수성의 5개 축을 평가한다.
각 축 4.8/5 이상, 총점 96/100 이상이 아니면 최대 3회까지 보완한다.

## Files likely affected

- `backend/catalog_audit/analysis.py` — 신규 결정론적 분석.
- `backend/catalog_audit/api.py` — compare/report 요청·응답.
- `studio/src/types.ts`, `studio/src/api.ts` — 분석 타입과 호출.
- `studio/src/App.tsx`, `studio/src/styles.css` — 팝업 탭·분석 레포트 UI.
- `scripts/build_compare_lab_report.py` — HTML+CSV 산출.
- `tests/test_comparison_analysis.py`, `studio/tests/App.test.tsx`.
- `qa/scripts/p5-e2e.cjs`, `qa/scripts/compare-report-e2e.cjs`.
- `qa/test-runs/`, `qa/evaluations/` — RED/GREEN/REFACTOR와 점수 증거.

## Risks / open questions

- 공개 카탈로그만으로 비용 절감액·수명·소음 우열을 추론하지 않는다.
- `경쟁사 Δ` 부호를 Samsung 우위와 반대로 읽지 않도록 Golden 값을 고정한다.
- 팝업 차단을 줄이기 위해 반드시 사용자 클릭 이벤트 안에서 `window.open`한다.
- 새 Release가 발행되면 HTML·CSV가 함께 갱신되는지 CI hash 검사를 둔다.
- 느린 응답이 새 선택을 덮어쓰지 않도록 지연 응답 경계 테스트를 필수로 둔다.
- 분석 문구가 길어져 모바일을 밀어내지 않도록 표는 내부 스크롤만 허용한다.

## Test plan

1. 문서 계약: REQ/TEST/E2E/점수 기준 누락 시 pytest 실패.
2. Python: DIRECT·REFERENCE·BLOCKED 분석 스키마와 금지 표현 검사.
3. Vitest: 팝업, 분석 5개 섹션, 오류/빈 상태, stale 응답 폐기.
4. Playwright: 데스크톱 1440×1024, 모바일 390×844, retries 0.
5. E2E: 팝업→보고서→CSV→Compare Lab 왕복과 안전 비교→분석→출력.
6. 공통 Gate: 외부 요청·console/page/network 오류·페이지 overflow 0.
7. 로컬 새 실행 2회 연속 PASS 후 GitHub Actions Chromium 1회 PASS.

## Done criteria

- `P14-A`~`P14-E` 산출물이 REQ/TEST/RUN으로 추적된다.
- Python·Vitest·Playwright가 retries 0으로 전부 통과한다.
- DIRECT 수치가 비교 엔진과 일치하고 군 교차 순위가 0개다.
- BLOCKED/REFERENCE에서 우위·열위·순위·Δ가 0개다.
- 지연 응답 stale 결과·레포트·다운로드가 0개다.
- Release → 모델 → Evidence → 분석 문구를 한 화면에서 추적할 수 있다.
- Critical 0, Major 0, 각 품질축 4.8/5 이상, 총점 96/100 이상이다.
- 독립 Judge 평가를 최대 3회 안에 PASS하고 GitHub CI가 성공한다.
