# 진행 스냅샷 (Progress Log)

> 단계별 작업·E2E 결과를 시간순으로 기록. 최신이 위.

---

## 2026-06-23 (최신)

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
