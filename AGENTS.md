# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

Samsung(당사) 관점의 **압축기 경쟁 인텔리전스 대시보드** 프로젝트. 현재 기본 제품은 Published Release만 읽는 FastAPI + React **Catalog Audit Studio**다. 기존 DC 화면은 `/legacy/` 회귀 기준선으로 유지한다.

## 디렉토리 구조

```
2606-Compressor-Catalog-Dashboard/
├── AGENTS.md
├── README.md
├── backend/   ← Published Release 조회·비교 FastAPI
├── catalog/   ← Staging, 확장 검토, 불변 Published Release
├── data/      ← 리서치 원천 데이터 = 콘텐츠의 1차 출처
├── docs/      ← 아키텍처·운영·TDD·진행 스냅샷
├── studio/    ← React 19 + Vite 기본 앱과 Compare Report
└── frontend/  ← 기존 Design Component 대시보드(Legacy)
```

### data/ — 리서치 자료 (모든 대시보드 콘텐츠의 1차 출처)
| 파일 | 핵심 내용 |
|------|-----------|
| `Samsung-Compressor-Catalogue_2024.pdf` | **당사 공식 2024 카탈로그(96p) = Samsung 모델의 권위 소스.** Re/Ro/Sc 풀스펙·측정조건(ASHRAE/ARI) 명기. R454B=로터리 Unitary(UF, ARI), R290 스크롤 양산. |
| `samsung-catalogue-2024-parsed.md` | 위 PDF의 전 모델 자동 파싱 참조본(362 스펙행, pdfplumber). 비교핵심은 PDF 원본 대조 검증. |
| `compressor_deep_research_report.md` | 메인 리포트(808줄). 15개 발견사항, 소스 24건, Samsung 27모델 + 경쟁사 모델 데이터셋, 냉매 매트릭스(21종), Re/Ro/Sc 비교, 제조사 벤치마크(8사), 냉매 전환 P1~P6, 엔지니어링 인사이트, QA 검증, 공백 목록, 권장 C&M 컬럼 |
| `20260617-perplexity-r454b-scroll-normalization.md` | **측정조건 정규화** — ARI/DOE-A/DOE-B/EN12900 환산계수(×1.00/0.84/0.63/불가), Samsung vs Danfoss·LG·Copeland·GMCC |
| `20260617-perplexity-gmcc-r454b-scroll-specs.md` | GMCC STD 9모델 풀스펙, Two-Stage Scroll 위협, Samsung Fixed +1.9~3.6% 우위 |
| `20260617-perplexity-r290-re-benchmark-competitors.md` | R290 왕복동 경쟁사(LG/Embraco/GMCC/Secop/Panasonic) 모델별 COP. Samsung Re=미보유 |
| `20260617-perplexity-compressor-followup-r454b-r290-regulations.md` | Samsung 최신 동향(R290 모노블록 HP COP 4.80, CES2025 AI인버터, R454B Unitary 양산), 규제(AIM Act/EU F-Gas 2027/ASHRAE 90.1/China GB 19577-2024) |
| `r290_reciprocating_benchmark.md` | R290 Re 벤치마크 표(축약본) |
| `r454b_scroll_manufacturer_comparison.md` | R454B 스크롤 조건별 비교·정규화 순위·근접 경쟁모델 매칭 |

### frontend/ — Legacy Design Component (DC) 대시보드
- **`index.html`** — 기본 진입점. `/` 접근 시 `Compressor Dashboard.dc.html`로 자동 이동.
- **`compressor-data.js`** — **데이터 단일 진실 소스(SSOT)**. `data/*.md`를 Samsung 기준으로 구조화해 `window.COMPRESSOR_DATA`에 노출. 모든 탭이 이 객체만 읽는다. 수치 변경은 반드시 여기서. `.dc.html`의 `<head>`에서 `support.js`보다 **먼저** 로드되어야 함(동기 실행으로 렌더 전 준비됨).
- `Compressor Dashboard.dc.html` — 대시보드 본체. 파일명에 공백 있음. 하단 `<script type="text/x-dc" data-dc-script>` 의 `class Component extends DCLogic`가 `window.COMPRESSOR_DATA`를 읽어 `renderVals()`로 바인딩. (데이터를 여기 하드코딩하지 말 것 — SSOT 사용)
- `support.js` — `dc-runtime` (자동 생성됨, **직접 편집 금지**). `{{ }}` 보간·디렉티브를 React 18로 컴파일. React/ReactDOM 18.3.1을 unpkg CDN에서 로드.

### `window.COMPRESSOR_DATA` 스키마 (compressor-data.js)
`meta` · `tokens`(색상) · `conditions`(측정조건+환산계수) · `refrigerants` · `manufacturers` · `models`(76개: Samsung 27 + 경쟁사 49) · `benchmarkGroups`(동일 비교군 13개) · `gaps` · `priorities`(P1~P6) · `regulations` · `roadmap` · `samsungMoves` · `catalogSources` · `kpi`.

## DC 프레임워크 사용법 (support.js 런타임)

`.dc.html` = `<x-dc>` 템플릿 + `<script data-dc-script>` 로직. 핵심 규칙:

- **로직**: `class Component extends DCLogic { state = {...}; renderVals() { return {...} } }`. `renderVals()`가 반환하는 평면 객체가 템플릿의 `{{ }}`에 바인딩됨. `this.setState({...})`로 상태 변경 → 자동 리렌더.
- **보간**: `{{ expr }}` — 경로/비교(`===`,`!==`)/리터럴/`!` 부정만 지원. **임의 JS 실행 불가**(파서가 제한적, 산술·함수호출 안 됨). 모든 계산·정렬·환산은 `renderVals()`(순수 JS)에서 끝내고 결과만 바인딩. 함수는 핸들러로만(`onClick="{{ handler }}"`).
- **반복**: `<sc-for list="{{ arr }}" as="item" hint-placeholder-count="N"> ... {{ item.x }} ... </sc-for>`
- **조건**: `<sc-if value="{{ flag }}"> ... </sc-if>`
- **스타일**: `style="..."` 문자열은 자동으로 객체로 변환됨. CSS 변수(`--accent`) 사용 가능.
- **`<helmet>`**: `<head>`에 주입할 link/style/script (폰트·전역 CSS).
- **props/preview**: `data-props` 속성의 JSON. 현재 `startView`(enum), `accent`(color), `$preview`(1440×1024).

## 실행 / 미리보기 (E2E 검증)

기본 Studio는 정적 보고서 생성과 production build 후 same-origin으로 실행한다.

```powershell
python scripts/build_compare_lab_report.py
npm --prefix studio run build
python -m uvicorn backend.catalog_audit.main:create_runtime_app --factory --host 127.0.0.1 --port 8000
# http://127.0.0.1:8000/
```

Legacy DC만 확인할 때는 별도 8001 포트를 사용한다.

정적 파일이지만 런타임이 `fetch(location.href)` + CDN 로드를 하므로 **로컬 HTTP 서버 필요** (`file://` 직접 열기는 fetch 실패). 인터넷 연결 필요(React unpkg).

```bash
python -m http.server 8001 --directory frontend
# 브라우저: http://127.0.0.1:8001/
```

Legacy는 빌드 단계가 없다. 기본 Studio 작업은 활성 Published Release, API, React UI, 정적 Compare Report를 함께 검증한다.

## 도메인 핵심 개념

- **압축기 유형**: Re(왕복동/냉장고), Ro(로터리/에어컨), Sc(스크롤/상업·히트펌프).
- **냉매·GWP**: R290(3)·R600a(3)·R744(1)·R1234yf(1) 자연/초저GWP, R454B(466), R32(675), R410A(2088). 저GWP 전환이 핵심 드라이버.
- **효율 지표**: COP, EER (EER = COP × 3.412).
- **⚠️ 측정조건 비교 규칙 (필수)**: ARI/AHRI·DOE-A·DOE-B·EN12900은 응축온도가 달라 **COP/EER 직접 비교 금지**. ARI 환산계수 DOE-A ×0.84, DOE-B ×0.63, EN12900(난방)=환산불가. **비교는 동일 비교군(유형×냉매×조건×구동) 안에서만** — 군을 가로질러 순위 매기지 말 것. 조건 배지를 항상 표기. (`benchmarkGroups`가 이 군을 정의)
- **상태**: Mass Product(양산) / In Progress(개발중) / 없음(공백) → 데이터의 `status`/`gap`.
- **경쟁사 8사**: LG, Embraco(Nidec), Danfoss/Secop, Copeland(Emerson), GMCC(Midea), Highly, Panasonic.

## 확정된 데이터 결정사항 (작업 시 준수)

1. **데이터 레이어링: 2024 카탈로그(베이스) + perplexity(2024 이후 개발분).** 당사 모델 기본값은 2024 카탈로그 권위. perplexity 결과는 카탈로그 **이후 개발/양산**으로 레이어링(미검증 아님). post-catalog 모델은 `postCatalog:true` + "2024+ 개발" 배지.
2. **R454B = 로터리 + 스크롤 모두 양산.** 로터리 Unitary(UF 시리즈, ARI, 2024 카탈로그) + 스크롤(DS2LD5046F Variable ARI 3.37 양산 / DS8LC5049IN Fixed 개발중, **2024 이후 개발**). R290 스크롤(DS4HD5066FVT 3.43)·R32 스크롤(DS4BC7066FVT **3.25**, 구 3.34 폐기)·UB R32 로터리 실측 반영. Ro/Sc/Unitary 측정조건 = **ARI/AHRI**.
3. **R290 압축기 = 당사 Re 왕복동만 미보유(공백, 사용자 확정).** R290 Re 없음 → P1 공백. R290 로터리·스크롤은 보유/양산으로 처리한다. 2024 카탈로그 p.92의 R290 스크롤(DS4HD5066FVT 3.43)은 보유로 유지. AE120 R290 모노블록 HP는 완제품(시스템) 사례로, 압축기 보유 판단과 분리한다.
4. **모델명 정규화** — `DS2GR7046FVT`(구 …FV), `DS4BC7066FVT`, `DS2LD5046F`(=DS2DL5046F 오타) 등 `nameNote`로 표기.
5. **군 교차 순위 금지** — 측정조건이 다른 모델을 한 순위표에 섞지 않는다. 같은 `condition`끼리만 비교, 환산값은 참고(`*`), `reliability` 등급·조건 배지 표기.

## 작업 원칙

- `support.js`는 직접 수정 금지(생성물).
- 기본 Studio 데이터 변경은 `catalog/staging` → Validator → 새 Published Release 절차를 따른다. Published Release를 직접 편집하지 않는다.
- Legacy 데이터 변경만 `compressor-data.js`에서 수행하며 출처(`data/` md)와 `src` 필드를 유지한다.
- 색상 토큰(`COMPRESSOR_DATA.tokens`): accent `#FF385C`, Re `#FF385C`, Ro `#00A699`, Sc `#FC642D`, 양산 `#067647`, 개발중 `#E8A100`/`#B25E00`, 공백 `#C4C4C4`.
- 작업 진행은 `docs/`에 단계별 스냅샷으로 기록하고, 단계마다 E2E로 검증 후 개선.
