# 진행 스냅샷 (Progress Log)

> 단계별 작업·E2E 결과를 시간순으로 기록. 최신이 위.

---

## 2026-08-05 — Phase P20 Cloudflare Preview 접속 복구 ✅

- **재현**: 만료된 임시 URL은 응답 불가, 신규 Preview는 랜딩·API 모두 Cloudflare Error 1042 반환.
- **원인**: 임시 Worker가 `ASSETS.fetch()`를 같은 Workers 영역 호출로 판정.
- **TDD**: `global_fetch_strictly_public` 설정 계약을 먼저 추가해 RED 확인 후 Wrangler 설정에 반영해 GREEN 전환.
- **원격 검증**: 호환 플래그 적용 재배포 후 `/`, `/api/v1/health`, `/compare-lab-output` 모두 HTTP 200. Report 2/2, P14 분석 6/6 PASS.
- **운영 경계**: 임시 주소는 약 1시간 후 만료되며, 영구 배포는 Cloudflare 계정 인증이 필요.

---

## 2026-08-04 — Phase P19 Cloudflare 경량 배포 ⏳

- **TDD**: Python Worker 계약을 JavaScript Worker·runtime JSON·100KB 미만·runtime dependency 0개 기준으로 변경하고 4건 RED 후 GREEN 확인.
- **경량화**: Python Worker gzip 6.68MB를 JavaScript Worker 25KB, Wrangler gzip 6.75KB로 축소. 무료 3MB Worker 한도보다 충분히 작음.
- **API 동등성**: health, Active Release, Diff, Catalog, Portfolio, Evidence, Compare, Compare Report 8개 경로를 FastAPI 응답과 완전 일치 확인.
- **로컬 Worker E2E**: P5 16/16, Compare Report 2/2, P14 6/6, P15/P16 8/8 PASS. 정적 보고서의 Cloudflare 확장자 없는 canonical URL을 E2E에서 허용.
- **임시 원격 배포**: Workers preview에서 Report 2/2, P14 6/6, P15/P16 8/8 PASS. P5는 preview 단일 asset 5MB 제한으로 공식 PDF만 제외되어 14/16; 나머지 오류·overflow 0.
- **사내망 대응**: E2E에 선택적 `PLAYWRIGHT_PROXY_SERVER`를 추가해 로컬에는 영향 없이 원격 Chromium 검증 가능.
- **남은 Gate**: Cloudflare 계정 로그인 후 PDF 포함 영구 `workers.dev` 배포, P5 16/16 원격 재검증, Git main 반영.
- **증거**: `docs/16-cloudflare-lightweight-deploy.md`, `tests/p19-cloudflare-deploy-contract.md`, `qa/test-runs/RUN-20260804-019-P19-CLOUDFLARE.md`, `qa/evaluations/EVAL-22-P19.md`, `qa/evidence/p19/`.

---

## 2026-08-03 — Phase P18 Published Release 변경 Diff ✅

- **TDD 계약**: `REQ-P18-001~006`과 synthetic/실제 Release/API/UI/E2E 테스트를 먼저 작성하고 엔진·API·화면 부재 RED를 확인.
- **Diff 엔진·API**: `modelId` 기준 추가·삭제·변경과 leaf field path를 결정론적으로 계산. 배열은 경로와 item count만 제공하고 현재·직전 Bundle SHA를 모두 검증.
- **Release UI**: `release:2026-07-30:005 → release:2026-08-03:001`의 추가 0, 삭제 0, 변경 2, 성능맵 2를 표시. 변경 모델은 `ENV4A5DL2B`, `TKF76E25DCH-52RPS`이며 경로는 `performanceMaps`.
- **안전 경계**: 최초 Release는 `FIRST_RELEASE`, 직전 Bundle 누락·변조는 503. 과거 Release 편집·복원 기능은 제공하지 않음.
- **전체 검증**: Python 99 passed, Vitest 38/38, build 583 modules, P5 16/16을 2회 연속 PASS. 보고서 2/2, P14 6/6, P15/P16 8/8 PASS. retries·오류·외부요청·금지쓰기·overflow 0.
- **시각 검수**: 1440×1024와 390×844 Release 화면에서 6개 요약·2개 변경 모델·경로를 확인했고 모바일 가로 넘침 0.
- **평가**: Task 100/100, 품질 환산 99.2/100, Critical 0·Major 0으로 로컬 PASS.
- **증거**: `docs/15-release-diff-tdd-plan.md`, `tests/p18-release-diff-contract.md`, `qa/test-runs/RUN-20260803-018-P18-RED-GREEN.md`, `qa/evaluations/EVAL-21-P18.md`, `qa/evidence/p18/local-run-2/`.

---

## 2026-08-03 — Phase P17 README·프로젝트 문서·폴더 정비 ✅

- **README 개편**: 현재 Studio 기준 빠른 실행, 5개 앱 뷰+Compare Report 검수 순서, 안전 비교 판정, RPM/RPS 차트, 데이터 발행, 테스트, Legacy 경계를 상세화.
- **문서 연결**: `docs/README.md`, `qa/README.md`, `tests/README.md`를 추가하고 운영·UI·CI·P14~P16 문서의 활성 Release·수량·경로를 최신화. 과거 RED/GREEN 수치는 역사 기록으로 보존.
- **실행 정비**: `run.bat`을 Legacy 정적 서버에서 현재 Compare Report 생성 → Studio build → FastAPI same-origin 실행 흐름으로 변경.
- **폴더 정비**: 최종 Evidence로 대체된 P0/P15/P16 중간 실행·디버그 파일만 제거하고 `.gitignore`에 로컬 scratch 경계를 명시. P16 최종 desktop/mobile 증거 유지.
- **문서 품질**: 프로젝트 Markdown 60개 감사, 로컬 링크 36개 검사에서 누락 0, `git diff --check` PASS.
- **전체 검증**: 보고서 8모델/9쌍/15판정 생성, Python 94 passed, Vitest 37/37, build 583 modules, P5 16/16, 보고서 2/2, P14 6/6, P15/P16 8/8 PASS. retries·오류·외부요청·금지쓰기·overflow 0.

---

## 2026-08-03 — Phase P16 Compare Report 직접 비교 상세화 ✅

- **표시 정리**: Samsung 27개 전체 점검은 유지하되, 보고서 본문·매트릭스는 직접 비교 가능 8개 모델과 `DIRECT_OK` 15건만 표시. 조사 필요 모델·빈 COP/EER 섹션·DATA_REQUIRED 속도쌍은 제외.
- **상세 Recharts**: 유형·COP/EER 필터, 양사 원값, 경쟁사 Δ%, Samsung/경쟁사 우위 건수, 평균 용량 차이와 직접 비교 상세 카드를 추가.
- **안전성**: 각 행을 독립 직접 비교쌍으로 표시하고 조건군·COP/EER 교차 순위를 금지. RPM/RPS는 공식 성능점이 양쪽에 있는 1쌍만 유지.
- **검증**: Python 94, Vitest 37/37, build 583 modules, desktop/mobile Playwright 8/8과 정적 보고서 회귀 2/2 PASS. 오류·외부요청·금지쓰기·overflow 0.
- **E2E 개선**: 이름 있는 팝업의 1440x960 고정 크기를 발견해, 모바일 검증 시 실제 390x844 viewport를 강제하고 재검수.
- **증거**: `docs/14-compare-report-detail-plan.md`, `qa/test-runs/RUN-20260803-017-P16-RED-GREEN.md`, `qa/evidence/p16/local-run-3/`.

---

## 2026-08-03 — Phase P15 RPM/RPS 성능 맵·Recharts ✅ 로컬 완료

- **계약 고정**: `REQ-P15-001~007`, 속도 성능점 Evidence·RPM/RPS 60배·Hz 금지·eligible 전용 차트·DATA_REQUIRED·stale·정적 보고서 회귀를 정의.
- **E2E 선작성**: desktop `1440×1024`, mobile `390×844`, retries 0의 P15 Playwright와 CI Gate를 추가.
- **RED 확인**: 활성 Release 005에서 `speedAnalysis` 부재로 `속도 상태 undefined` 실패를 재현하고 `qa/evidence/p15/red-contract/p15-speed-e2e.json`에 기록.
- **문제/결정**: Release 번호는 동적 조회, Re Golden은 정확히 겹치는 속도점이 없어 ranking 불허, 미검증 Ro/Sc는 DATA_REQUIRED·차트 0으로 고정.
- **지표 안전성**: Panasonic 공개 속도점에 inputW/EER가 없어 가짜 파생을 금지하고, 현재 양쪽 완결 지표인 용량·COP만 노출하도록 계약을 수정.
- **구현/Release**: `release:2026-08-03:001`, commit `0f0d126fd40cfca4c6222358fa54be9c03304e0e`. Compare Lab과 정적 보고서에 eligible Re RPM/RPS Recharts·원시점 표·Evidence·속도 CSV·print를 반영.
- **GREEN**: Python 94 passed(warning 1), Vitest 35/35, build 581 modules, P15 desktop/mobile 8/8을 retries 0으로 2회 연속 PASS. API/차트/표 8=8=8, Evidence 100%, DATA_REQUIRED chart 0, stale 0, 오류·외부요청·쓰기·overflow 0.
- **회귀**: P5 16/16, 정적 보고서 2/2, P14 6/6, P0 characterization PASS.
- **오탐 개선**: 최초 print→screen 직후 Recharts 1-frame reflow를 overflow 231px로 감지. offender 진단 후 2 rAF 뒤 측정하도록 보완하고 후속 2회 overflow 0을 확인.
- **독립 Judge**: Task 100/100, 품질축 `5.0/5.0/5.0/4.9/4.9`, 환산 99.2/100, Critical 0·Major 0으로 로컬 PASS.
- **현재 상태**: 로컬 Goal과 GitHub Actions push Gate를 완료. commit `bc0bb70`의 run [30804663489](https://github.com/jh104kim/compressor-catalog-dashboard/actions/runs/30804663489) **PASS**.
- **증거**: `docs/13-speed-performance-map-tdd-plan.md`, `tests/p15-speed-performance-contract.md`, `qa/test-runs/RUN-20260803-016-P15-RED-GREEN.md`, `qa/evaluations/EVAL-20-P15.md`.

---

## 2026-07-31 — Phase P14-B~E 안전 비교 추가 분석·레포팅 ✅

- **P14-B 분석 API**: `POST /api/v1/compare/report`와 결정론적 분석 엔진을 추가. DIRECT만 수치 해석하며 REFERENCE/BLOCKED는 직접 성능 판단을 생성하지 않음.
- **P14-C 레포트 UI**: 조건 안전성·용량/효율·Evidence 신뢰도·포트폴리오·후속 조치/한계 5개 섹션, Release/두 modelId/지표 추적, JSON·인쇄/PDF 반영.
- **P14-D 비동기 안전**: `comparisonRevision`과 요청 snapshot으로 선택 변경 뒤 도착한 지연 비교·분석 응답을 폐기. 두 모델은 서버에서 단일 Release snapshot으로 읽고, 화면 Active Release와 다른 응답도 차단.
- **P14-E 검증**: Python 82, Vitest 33/33, build, 기존 P5 16/16, 정적 보고서 2/2, P14 분석 E2E 6/6을 retries 0으로 PASS.
- **점수**: Task `100/100`, 독립 Gate 품질축 `5.0/5.0/5.0/4.9/4.9`, 환산 `99.2/100`, Critical 0·Major 0.
- **증거**: `qa/test-runs/RUN-20260731-015-P14-BE-RED-GREEN.md`, `qa/evaluations/EVAL-19-P14.md`, `qa/evidence/p14/analysis-run-1/`, `qa/evidence/p14/analysis-run-2/`.

---

## 2026-07-31 — Phase P14-A 랜딩 보고서 팝업·CSV·TDD 계약 ✅

- **RED 우선**: 랜딩 `Compare Report` 탭 부재 1 failed, CSV 미생성 1 failed, P14 계획/테스트 계약 부재 3 failed를 구현 전에 확인.
- **랜딩 탭**: 사이드바 6번째 `Compare Report` 탭을 사용자 클릭형 명명 팝업(`compareLabReport`)으로 구현.
- **추가 제안 반영**: 정적 HTML과 동일한 DIRECT_OK 15건을 `compare-lab-output.csv`로 동시 생성하고 보고서 상단에 내려받기 추가. CI도 HTML+CSV를 재생성.
- **P14 후속 계약**: 안전 비교 후 결정론적 추가 분석·5개 레포트 섹션·Evidence·stale 응답 차단을 `REQ-P14-001~006`과 Unit/API/E2E ID로 고정.
- **현재 점수**: P14-A `15/15`. P14 전체는 `15/100` 진행 상태이며 P14-B~E 구현 후 `96/100`, 품질축별 `4.8/5`, Critical 0/Major 0을 완료 Gate로 사용.
- **회귀 검증**: Python 76, Vitest 29/29, 기존 Compare Lab E2E 16/16, 보고서 팝업 E2E 2/2를 retries 0으로 2회 연속 PASS. 같은 서버를 사용하는 브라우저 E2E는 순차 실행.
- **증거**: `qa/test-runs/RUN-20260731-014-P14-RED-GREEN.md`, `qa/evidence/p14/report-popup/compare-report-e2e.json`, `qa/evidence/p14/report-popup-run-2/compare-report-e2e.json`.

---

## 2026-07-30 — Phase P13 Compare Lab 전 모델 HTML 보고서 ✅

- **전체 범위**: 활성 Release 005의 Samsung 27개(Re 4, Ro 12, Sc 11)와 경쟁사 49개를 백엔드 비교 엔진으로 전수 판정.
- **직접 비교 결과**: Samsung 직접 비교 가능 8개, 고유 모델쌍 9개, COP/EER `DIRECT_OK` 15건. 직접 후보가 없는 19개 모델은 사유·용량 목표·우선 조사사를 함께 표시.
- **보고서 UI**: `compare-lab-output.html`에 KPI, 유형별 준비도, 안전 비교 규칙, 27개 전체 매트릭스, 모델별 상세 표, Compare Lab 딥링크, 인쇄/PDF 기능 반영.
- **재생성**: `python scripts/build_compare_lab_report.py` 실행 후 `npm --prefix studio run build`.
- **검증**: 보고서 pytest 3 passed · 비교 엔진 포함 15 passed · Chromium 데스크톱/모바일 2/2 PASS · 모델 27/27 · 직접 판정 15/15 · 가로 overflow/콘솔/페이지/네트워크/외부 요청 0.
- **증거**: `qa/evidence/p13/report-e2e/compare-report-e2e.json`, `qa/evidence/p13/report-e2e/screenshots/`.

---

## 2026-07-30 — Phase P12 Compare Lab 로딩 복구·선택 UX 개선 ✅

- **고착 원인 수정**: 비교 딥링크 복원 효과가 자체 상태 변경으로 정리(cleanup)되어 느린 `/compare` 응답을 무시하던 문제를 일회성 `useRef` 가드로 교체.
- **선택 UX 개선**: `Re · Ro · Sc 유형 먼저 선택` 안내를 강조하고, Samsung·경쟁 모델을 드롭다운 대신 조건·용량·지표가 보이는 선택 카드로 변경. 선택 불가 단계에는 다음 행동을 명확히 표시.
- **회귀 방지**: 지연된 비교 응답에서도 loading 해제와 결과 복구를 검증하는 Vitest·Playwright 시나리오 추가.
- **검증**: Vitest 28 passed · build 통과 · Release 005 Studio E2E 16/16을 데스크톱·모바일에서 2회 연속 통과 · 콘솔/페이지/네트워크 오류 0.
- **증거**: `qa/evidence/p12/local-run-1/p5-e2e.json`, `qa/evidence/p12/local-run-2/p5-e2e.json`.

---

## 2026-07-30 — Phase P11 공식 경쟁사 카탈로그 확장 ✅

- **공식 자료 우선 조사**: LG 외 Embraco·Secop·Panasonic·GMCC·Highly·Danfoss·Copeland의 Re/Ro/Sc 후보를 재점검.
- **DB 반영**: Panasonic 7개(Re 1, Ro 6)와 Secop Re 1개를 직접 비교 가능 모델로 승인. 전체 76개(Samsung 27 + 경쟁사 49).
- **조건 정합성 보정**: Danfoss DSH090/184/240을 공식 60 Hz ARI·Fixed-speed 값으로 정정. 동일 조건이 확인되지 않은 후보는 DB에 억지로 넣지 않고 Research Queue에 유지.
- **Release 005 발행**: `release:2026-07-30:005`, 데이터 SHA-256 `9f6ff238e0ee7c2869fe3c5073fd829de568c0f3a330be24ae1599586d17e8b7`.
- **검증**: Validator `VALIDATED`(Critical 0/Major 0) · Python 69 passed · Vitest 27 passed · build 통과 · Studio E2E 14/14를 2회 연속 통과 · 기존 대시보드 P0 탭 10/10 및 워크플로 2/2 통과.
- **증거**: `qa/evidence/p11/local-run-1/p5-e2e.json`, `qa/evidence/p11/local-run-2/p5-e2e.json`, `qa/evidence/p11/p0-local/browser-characterization.json`.

---

## 2026-06-23

### 단계 B+C Phase 1~4 — UI/UX 개선 완료 ✅

#### Phase 1 — 인터랙션 기초
- **연락처 링크 클릭 가능**: 보완 과제 탭 BL_ITEMS 각 항목의 `contact` 필드를 `https://` prefix로 `<a href>` 앵커로 변환(`contactHref` 계산 후 바인딩). 18개 링크 새 탭 열림 확인.
- **저신뢰 경고 배너**: Reporting 탭 그룹 선택기에 reliability ≤ 1인 그룹에 `⚠ 조건불일치` 배지 추가. 해당 그룹 선택 시 `⚠️ 신뢰도 낮음 — 직접 순위 비교 부적절` 경고 배너(주황/적 배경) 자동 노출. "R454B 스크롤 · EN12900" 그룹 클릭 → 배너 확인 ✅

#### Phase 2 — 시각화 강화
- **Reporting 그룹 nav relBar**: 그룹 선택기 각 항목에 5칸 컬러 신뢰도 바(9×5px 직사각형, 녹/청/주황/적) 추가. 60개 도트(12그룹×5) 렌더 확인 ✅
- **Analysis 탭 보완 스펙 패널**: 선택 모델의 확장 스펙(계절효율·운전영역·소음·오일·냉매충전·중량·규제승인·기술·OEM채택) 9개 필드를 3열 그리드로 표시. 미보유 필드는 `미확인`(회색) 폴백. `보완 N/9` 카운터 배지.

#### Phase 3 — Decision 탭 강화
- **냉매 전환 타임라인 비주얼 개선**: 기존 텍스트 목록 → 좌측에 그라데이션 세로 라인(적→주황→녹) + 컬러 dot(각 페이즈별) 추가. 현재/단기/중기 3단계 시각적 계층화.
- **Samsung 최신 동향 섹션 신설**: Decision 탭 하단(Gap→Action 아래)에 `SAMSUNG_MOVES` 데이터 기반 타임라인 카드 5개 추가. 날짜 배지 + 태그(양산/발표/카탈로그) 색상 코딩. 카드 항목: 2024 카탈로그 발행 / R290 HP / AI 인버터 CES / R454B 로터리 Unitary / R454B 스크롤 2024+ 개발.

#### Phase 4 — 검색·필터
- **Analysis 탭 측정조건 배지 필터**: 유형 필터 아래에 조건 배지(전체/ASHRAE LBP/ASHRAE MBP/ARI/AHRI/DOE-B) 자동 생성. 상태: `analysisCondFilter`. 클릭 시 모델 목록 즉시 필터링 + 선택 초기화. ARI/AHRI 클릭 → ARI 모델만 표시 확인 ✅
- **헤더 검색 재확인**: 이전 단계에서 이미 완전 구현(입력→드롭다운→클릭→Reporting 이동). Phase 4에서 재검증 완료 ✅

#### LG 데이터 업데이트 (Perplexity Q1~Q5 반영)
- LG YPH/YBH Variable 6모델 DOE-A 공식값 반영 (YPH024/036KA, YBH051KA 수치 확정, YPH030/YBH048/060KA nameNote 처리)
- LG YRH/YGH Fixed 3대표 모델 신규 추가 (YRH083KA, YRH104RA COP 5.00, YGH275WA 50Hz)
- 신규 benchmarkGroup `r454b-sc-fix-doea` 추가 (LG Fixed DOE-A 참고군, Samsung ref=null, reliability:2)
- meta.sources 28→29, models 65→68
- BL_ITEMS 진행률 업데이트: LG YRH/YGH 미확인→부분확인, Panasonic R290 스크롤 미확보→부분확인, Danfoss VZH 미확인→부분확인. 진행률 22%→56%, 미확인 배지 7→4건.
- GMCC ATF/ATQ ARI COP 미확인 유지 (Q3: SEER60 조건 — ARI 직접 비교 불가 확인)

#### E2E 최종 확인 (2026-06-23 python http.server + Claude Preview)
| 탭 | 핵심 기능 | 상태 |
|---|---|---|
| KPI 현황 | Samsung 모델·COP·P1 갭·냉매 커버리지 | ✅ |
| Decision 전략 | 우선순위·규제·타임라인 dot·Samsung Moves | ✅ |
| 모델 분석 | 조건 배지 필터·보완 스펙·TOP 5 비교 | ✅ |
| Reporting | relBar 60개·저신뢰 경고 배너·연락처 링크 18개 | ✅ |
| 보완 과제 | 진행률·미확인 항목·클릭 가능 연락처 | ✅ |
| 헤더 검색 | 입력→드롭다운→클릭→Reporting 이동 | ✅ |
| 콘솔 에러 | JS 런타임 에러 | 없음 ✅ |

---

## 2026-06-19

### 단계 1 — SSOT 데이터 레이어 ✅
- `frontend/compressor-data.js` 생성. `window.COMPRESSOR_DATA` 노출.
- data/ 6개 md를 Samsung 기준 구조화: 모델 45개(Samsung 23+경쟁사 22), 비교군 9개, 냉매 11, 제조사 9, 규제 5, 로드맵·삼성동향·우선순위·공백 포함.
- 확정 결정 3건 인코딩(R454B 재프레이밍 / 모델명 nameNote / 군 교차 순위 차단용 condition·reliability).
- `CLAUDE.md` 갱신(/init): SSOT·결정사항·실행법 반영. `docs/PLAN.md` 작성.
- E2E: 데이터 파일 단독이라 별도 렌더 검증 없음(다음 단계에서 배선 후 검증).

### 단계 2~3 — SSOT 배선 + 3-탭 전면 재구성 ✅
- `Compressor Dashboard.dc.html` 전면 재작성: `<head>`에서 `compressor-data.js` → `support.js` 순 로드. `Component.renderVals()`가 `window.COMPRESSOR_DATA`만 읽도록 데이터화(하드코딩 제거).
- **네비 3탭**: KPI 현황 / Decision 전략 / Reporting(신규). `state.view`로 전환.
- **KPI 탭**: 스탯 타일 5(데이터 파생) · 유형별 경쟁 포지션 카드(Re/Ro/Sc) · 냉매 매트릭스(가연성 배지 추가) · 제조사 강도 히트맵(9사) · 동일조건 벤치마크(유형 필터 연동, 조건 배지) · 측정조건 환산계수 레전드 · BLDC 카드.
- **Decision 탭**: 스포트라이트 공백(재구성 P1=R290 Re) · 우선순위 P1~P6 · 냉매 전환 타임라인(신규) · 규제 패널(신규) · 경쟁사 위협 모니터링 · Gap→Action.
- **Reporting 탭**: 비교군 선택기(8군, 조건 배지+신뢰도 별점) · 동일조건 비교표(당사 기준 Δ% 자동계산, ARI 환산 병기, 상태 배지) · 자동 리포트 요약문.
- **확정 결정 반영**: R454B 재프레이밍 / 모델명 nameNote / 군 교차 순위 차단(condition 태깅+reliability).
- 공통: 검색 입력 실작동(건수 표시), 유형 필터 전역 연동(벤치+Reporting군), @media print 숨김.

#### E2E 결과 (python http.server 8000 + 프리뷰)
- 데이터 로드 OK: `window.COMPRESSOR_DATA` 모델 55(Samsung 22 + 경쟁사 33), dc-root 렌더.
- 3탭 모두 렌더 확인(스크린샷). **콘솔 에러 0 · 미해결 `{{ }}` 0 · 로직 에러 0**.
- Reporting Δ 검증: R454B Variable ARI 군 — Samsung DS2LD5046F(3.37)=기준, Danfoss DSH240 +6.0%, DSH180 +8.7% (정확).
- 유형 필터(Ro)→Reporting 비교군 1개로 정상 축소.

### 단계 3.5 — 사이드바 카탈로그 출처·연도 + 신선도 ✅
- SSOT에 `catalogSources`(9사) + `meta.currentYear=2026` 추가.
- 사이드바 "카탈로그 출처 · 연도" 섹션: 신선도 색(현행화 필요/점검 권장/최신) 도트, 출처 클릭 시 원본 링크.
- 신선도 규칙: 4년↑=현행화 필요(적), 2~3년=점검 권장(주황), ≤1년=최신(녹).
- E2E: 9개 출처 렌더, 정렬/라벨/색상 정확, 콘솔 에러 0.

### 단계 3.6 — Samsung 2024 공식 카탈로그 파싱·반영 ✅
- `data/Samsung-Compressor-Catalogue_2024.pdf`(96p). pdfplumber로 362개 스펙행 추출 → `samsung-catalogue-2024-parsed.md` 생성.
- Samsung 모델 27개를 2024 카탈로그 권위값으로 교체. R454B = 로터리 Unitary(UF 시리즈) 확정.
- 측정조건 확정: ASHRAE(LBP/MBP) / ARI·AHRI(Ro/Sc/Unitary) 명기.

### 단계 3.7 — perplexity = "2024 카탈로그 이후 개발분"으로 정정 ✅
- Sc R454B 격상: DS2LD5046F(Variable ARI 3.37) 양산 + DS8LC5049IN(Fixed) 개발중. `postCatalog:true` 태깅.
- R454B 냉매 커버리지 sc `prog`→`have`, GAPS R454B P3 제거.

### 단계 3.8 — R290 범위 오판 임시 반영(3.9에서 폐기)
- 당시 오판: R290 Re 공백을 Ro/Sc까지 과확대. → 단계 3.9에서 복원.

### 단계 3.9 — R290 정정(Re만 미보유) + Reporting 드릴다운 ✅
- **R290 정정**: Re만 미보유, Ro/Sc 보유. 비교군 r290-sc-ari 복원, COP DS4HD5066FVT(3.43) 복귀.
- **드릴다운**: Reporting 비교표 모델 행 클릭 → 모델 리포트 카드(COP·EER·타일+조건배지+출처). E2E 확인.

### 단계 3.10 — 문서 정합성 정리 ✅
- AGENTS.md·CLAUDE.md R290 보유 범위 "Re만 미보유"로 정정.

### 단계 4.1 — KPI 반응형 1차 수정 ✅

### 단계 5.1~5.2 — 모델 분석 탭 구현 ✅
- 4번째 탭 **모델 분석** 추가. 유형 필터 + Samsung 모델 리스트 + 선택 모델 스펙 카드 + **유사 경쟁 모델 TOP 5** 표 + 자동 분석 요약.

### 단계 ②-1~②-2 — 반응형 완전 구현 ✅
- 미디어쿼리(1024/820/480px). dc-body/dc-aside/dc-tiles/dc-2col/dc-gaps4 클래스.
- 와이드 테이블 dc-scroll-x 가로 스크롤.
- E2E: 500px·1280px 전 뷰 가로 넘침 0.

### 단계 ②후속 — UI/UX A·B·C·D + 검색 패널 ✅
- A: 드릴다운↔모델분석 연결
- B: Δ 미니바(좌우 방향 막대)
- C: 가로 스크롤 그림자 어포던스
- D: 비교군 포지션 배지(우위/열위/혼재/공백)
- ③: 헤더 검색 결과 드롭다운 + 클릭 이동

### 단계 — 인쇄/PDF + 타임라인·버그픽스 ✅
- 인쇄 버튼(@media print).
- 냉매 전환 타임라인 phase 헤더 재구성.
- dc-gaps4/dc-analysis 가로 넘침 버그픽스.

### 단계 — 다차원 스펙 스키마 선반영 ✅
- models에 seer2/scop/noiseDb/oilType/approvals[]/tech[]/oemWins[] 등 nullable 추가.
- 드릴다운 리포트 카드에 "다차원 스펙(보완 중)" 섹션 + "보완 N/9" 카운터.

---

## 2026-06-24

### 단계 4.1 재검증 — KPI 반응형 E2E ✅
- 검증 URL: `http://127.0.0.1:8010/Compressor%20Dashboard.dc.html`
- 검증 폭: 500px 모바일 기준(실측 clientWidth 485) + 1280px 데스크톱 기준(실측 clientWidth 1265).
- 결과: KPI 화면 페이지 전체 가로 넘침 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
- 비고: 냉매 매트릭스 등 와이드 표는 `dc-scroll-x` 내부 스크롤로 유지. 페이지 자체 넘침은 없음.

### 단계 4.2 — Decision 반응형 E2E ✅
- 검증 폭: 500px 모바일 기준(실측 clientWidth 485) + 1280px 데스크톱 기준(실측 clientWidth 1265).
- 결과: Decision 화면 페이지 전체 가로 넘침 0, `dc-scroll-x` 외 화면 밖 요소 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
- 비고: 경쟁사 위협 모니터링 와이드 표는 내부 가로 스크롤로 유지.

### 단계 4.3 — Reporting 반응형 E2E ✅
- 검증 폭: 500px 모바일 기준(실측 clientWidth 485) + 1280px 데스크톱 기준(실측 clientWidth 1265).
- 기본 비교군 결과: 페이지 전체 가로 넘침 0, `dc-scroll-x` 외 화면 밖 요소 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
- 비교군 선택 E2E: `R290 왕복동 · ASHRAE LBP` 선택 후에도 동일 기준 통과.
- 비고: 비교표는 의도대로 내부 가로 스크롤 유지. 페이지 자체 넘침은 없음.

### 단계 4.4 — 모델 분석 반응형 E2E ✅
- 검증 폭: 500px 모바일 기준(실측 clientWidth 485) + 1280px 데스크톱 기준(실측 clientWidth 1265).
- 기본 상태 결과: 페이지 전체 가로 넘침 0, `dc-scroll-x` 외 화면 밖 요소 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
- 필터 E2E: `Sc` 유형 필터 선택 후 `DS4HD5066FVT` 모델 분석과 유사 경쟁 모델 TOP 5 렌더 확인. 동일 기준 통과.
- 비고: TOP 5 경쟁모델 표는 내부 가로 스크롤 유지. 페이지 자체 넘침은 없음.

### 단계 4.5 — index.html 진입점 및 문서 갱신 ✅
- `frontend/index.html` 추가: 기본 URL(`/`)에서 `Compressor Dashboard.dc.html`로 자동 이동.
- `README.md` 빠른 시작·배포 안내를 `index.html` 기준으로 갱신.
- `docs/PLAN.md`에 5개 탭 반응형 E2E 완료와 기본 진입점 추가 반영.
- `run.bat` 자동 실행 URL을 `http://localhost:8000/`로 갱신.
- E2E: `http://127.0.0.1:8010/` 접근 시 대시보드 본체로 이동, KPI 렌더, 미해결 `{{ }}` 0, 콘솔 에러 0.

### 단계 4.6 — 보완 과제 티켓화 + 정적 호스팅 체크리스트 ✅
- 보완 과제 탭을 기존 카테고리 묶음에서 P1/P2/P3 실행 티켓 묶음으로 재정리.
- 각 티켓에 `P1-01` 형식 티켓 번호, 원 카테고리 배지, 완료 기준을 표시.
- README에 정적 호스팅 체크리스트 추가: 배포 루트, 필수 파일, CDN 접근, URL 인코딩, 배포 후 점검, 브라우저 캐시 갱신.
- `docs/DATA-ENRICHMENT.md`에 P1/P2/P3 실행 티켓 기준 추가.
- E2E: 보완 과제 탭 500px·1280px 기준 페이지 전체 가로 넘침 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
