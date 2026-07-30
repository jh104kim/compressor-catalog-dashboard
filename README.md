# 압축기 경쟁 인텔리전스 대시보드

Samsung(당사) 관점의 압축기 경쟁 인텔리전스 대시보드. 현재 기본 개발 대상은 검증된 Published Release만 읽는 **Catalog Audit Studio**이며, 기존 DC 대시보드는 `/legacy/` 호환 화면으로 유지한다.

---

## 빠른 시작

```powershell
# 1. React production build
Push-Location studio
npm ci
npm test
npm run build
Pop-Location

# 2. Published Release + API + UI same-origin 실행
python -m uvicorn backend.catalog_audit.main:create_runtime_app `
  --factory --host 127.0.0.1 --port 8000

# 브라우저: http://127.0.0.1:8000/
```

현재 활성 데이터는 `catalog/published/active-release.json`이 가리키는 Release다. Studio는 조회 전용이며 편집·발행 기능을 제공하지 않는다. 발행·롤백 절차는 `docs/07-operations-and-362-expansion.md`를 따른다.

기존 DC 화면은 아래처럼 별도 실행한다.

```powershell
python -m http.server 8001 --directory frontend
# 브라우저: http://127.0.0.1:8001/
```

---

## 디렉토리 구조

```
2606-Compressor-Catalog-Dashboard/
├── CLAUDE.md                        # Claude Code 작업 지침
├── README.md                        # 이 파일
├── backend/                         # Published Release 조회·비교 FastAPI
├── catalog/
│   ├── staging/                     # 검증 전 이관 Bundle
│   └── published/                   # 불변 Release와 활성 포인터
├── config/                          # 권위값·GAP·비교 정책
├── data/                            # 리서치 원천 데이터 (모든 콘텐츠의 1차 출처)
│   ├── Samsung-Compressor-Catalogue_2024.pdf          # 당사 공식 카탈로그 (권위 소스)
│   ├── samsung-catalogue-2024-parsed.md               # 위 PDF 자동 파싱 참조본
│   ├── compressor_deep_research_report.md             # 메인 리서치 리포트 (808줄)
│   ├── 20260617-perplexity-r454b-scroll-normalization.md
│   ├── 20260617-perplexity-gmcc-r454b-scroll-specs.md
│   ├── 20260617-perplexity-r290-re-benchmark-competitors.md
│   ├── 20260617-perplexity-compressor-followup-r454b-r290-regulations.md
│   ├── 20260619-deepresearch-r454b-scroll-tier1.md
│   ├── r290_reciprocating_benchmark.md
│   ├── r454b_scroll_manufacturer_comparison.md
│   └── 압축기 SSOT 보완 조사 결과 보고서.md
├── docs/                            # 작업 문서
│   ├── PLAN.md                      # 아키텍처·구현 계획
│   ├── PROGRESS.md                  # 단계별 진행 스냅샷
│   └── DATA-ENRICHMENT.md          # 데이터 보완 브리프 (Tier 1~3)
├── studio/                          # React 19 + Vite View-first 앱
├── qa/                              # P0/P5 E2E와 완료 증거
├── tests/                           # Python·UI 계약
└── frontend/                        # 기존 DC 대시보드
    ├── index.html                   # 기본 진입점 (대시보드로 자동 이동)
    ├── Compressor Dashboard.dc.html # 대시보드 본체
    ├── compressor-data.js           # 데이터 단일소스 (SSOT)
    └── support.js                   # DC 런타임 (직접 편집 금지)
```

---

## 대시보드 구조 (5탭)

| 탭 | 주요 내용 |
|---|---|
| **KPI 현황** | Samsung 모델 수·TOP COP·P1 갭 · Re/Ro/Sc 경쟁 포지션 카드 · 냉매 커버리지 매트릭스(11종) · 제조사 강도 히트맵(8사) · 카탈로그 신선도 |
| **Decision 전략** | 전략 공백 스포트라이트(P1 R290 Re) · 우선순위 P1~P6 · 냉매 전환 타임라인 · 규제 압력(AIM Act/EU F-Gas/ASHRAE 90.1/중국 GB) · 경쟁사 위협 모니터링 · Samsung 최신 동향 |
| **모델 분석** | 유형+측정조건 배지 필터 · Samsung 모델 선택 · 보완 스펙 9개 필드 · 유사 경쟁 모델 TOP 5 자동 추천 + 분석 요약문 |
| **Reporting** | 비교군(12군) 선택기(신뢰도 바·포지션 배지·저신뢰 경고) · 비교표(Δ% 미니바·조건 배지) · 모델 드릴다운 리포트 · 인쇄/PDF |
| **보완 과제** | SSOT 미확인 항목 진행률(56%) · 제조사별 연락처(클릭 가능) · 우선순위 상태 |

---

## 데이터 아키텍처

### SSOT (단일 진실 소스)

모든 데이터는 `frontend/compressor-data.js`에서 `window.COMPRESSOR_DATA`로 노출된다. 탭/뷰는 이 객체만 읽는다.

```
data/*.md (리서치 원천)
    ↓ 수동 구조화
frontend/compressor-data.js (SSOT)
    ↓ window.COMPRESSOR_DATA
Compressor Dashboard.dc.html (renderVals → 템플릿 바인딩)
```

### 주요 스키마 객체

| 키 | 내용 |
|---|---|
| `meta` | 기준일·버전·소스 수 |
| `models` | 68개 모델 (Samsung 27 + 경쟁사 41) |
| `benchmarkGroups` | 12개 비교군 (유형×냉매×조건×구동) |
| `priorities` | P1~P6 냉매 전환 우선순위 |
| `regulations` | 규제 5건 (AIM Act / EU F-Gas 등) |
| `samsungMoves` | Samsung 최신 동향 5건 |
| `catalogSources` | 9개 제조사 카탈로그 출처·연도 |

### 측정조건 비교 규칙

> **ARI / DOE-A / DOE-B / EN12900 / SEER60은 직접 비교 불가.**  
> 같은 `benchmarkGroup` 안에서만 Δ% 계산. 조건이 다른 군은 reliability↓ + ⚠ 경고 배지.

| 조건 | 응축온도 | ARI 대비 환산 |
|---|---|---|
| ARI/AHRI | 54.4°C | ×1.00 |
| DOE-A | 46.1°C | ×~1.20 (높음) |
| DOE-B | 37.8°C | ×~1.59 (훨씬 높음) |
| EN12900 | 난방 조건 | 환산 불가 |
| SEER60 | 42.3°C | 직접 비교 불가 |

---

## 주요 데이터 포인트 (2026-06-23 기준)

- **Samsung 모델**: 27개 (Re 4 / Ro 12 / Sc 11)
- **경쟁사 모델**: 41개 (LG / Embraco / Danfoss / Copeland / GMCC / Highly / Panasonic / Secop)
- **TOP COP**: DS4HD5066FVT 3.43 (R290 스크롤, 양산)
- **P1 공백**: R290 왕복동(Re) 미보유 — 경쟁사 LG/Embraco/Secop/Panasonic 보유
- **R454B 현황**: 로터리 Unitary(UF, ARI 3.22~3.25, 양산) + 스크롤 Variable(DS2LD5046F ARI 3.37, 양산) + 스크롤 Fixed(DS8LC5049IN, 개발중)
- **비교군**: 12개 (r290-re, r454b-ro-ari, r454b-sc-var, r454b-sc-fix 등)

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| Studio | React 19, TypeScript, Vite |
| API/Runtime | FastAPI, same-origin 정적 제공 |
| 데이터 | JSON Schema Draft 2020-12, 불변 Published Release |
| 검증 | pytest, Vitest, Playwright Chromium |
| Legacy | DC Framework + vendored React 18.3.1 |

### Legacy DC 프레임워크 핵심 규칙

```js
class Component extends DCLogic {
  state = { view: 'kpi', ... };
  renderVals() {
    // 모든 계산은 여기서. {{ }} 템플릿에 순수 값만 전달.
    return { myValue: computed, onClick: () => this.setState({...}) };
  }
}
```

- `{{ expr }}`: 경로/비교/리터럴만. **임의 JS 실행 불가** (산술·함수호출 안 됨).
- `<sc-for list="{{ arr }}" as="item">`: 반복
- `<sc-if value="{{ flag }}">`: 조건부 렌더
- `support.js`는 **직접 편집 금지** (자동 생성 런타임).

---

## E2E 검증 현황

- 2026-06-24 기준 500px 모바일 / 1280px 데스크톱 폭에서 5개 탭 모두 반응형 검증 완료.
- 검증 탭: KPI 현황, Decision 전략, 모델 분석, Reporting, 보완 과제.
- 기준: 페이지 전체 가로 넘침 0, 미해결 `{{ }}` 0, 콘솔 에러 0.
- 와이드 표는 페이지를 밀어내지 않고 `dc-scroll-x` 내부 가로 스크롤로 유지.

---

## 데이터 업데이트 방법

1. `data/` 폴더의 md 파일을 최신 리서치로 갱신
2. `frontend/compressor-data.js` 해당 `M({...})` 항목 수정 (수치·출처·상태)
3. HTTP 서버에서 하드 리프레시(`Ctrl+Shift+R`)로 확인
4. `benchmarkGroups`의 `members` 배열도 일치 여부 확인

> 수치 변경은 **반드시 `compressor-data.js`에서만**. `.dc.html`에 데이터 하드코딩 금지.

---

## Legacy DC 정적 배포

```bash
# 옵션 A: 로컬 개발
cd frontend && python -m http.server 8000

# 옵션 B: GitHub Pages / Netlify
# frontend/ 폴더 통째로 업로드 (index.html이 기본 진입점)

# 옵션 C: nginx
location / { root /var/www/compressor-dashboard; }

# 옵션 D: S3 정적 호스팅
aws s3 sync frontend/ s3://버킷명/ --delete
```

**핵심 요건**: HTTP 서버 필수 + React CDN 인터넷 접근 가능. `file://` 직접 열기 금지.

### 정적 호스팅 체크리스트

- 배포 루트는 `frontend/`로 지정한다.
- `index.html`, `Compressor Dashboard.dc.html`, `compressor-data.js`, `support.js`가 같은 폴더에 있어야 한다.
- React CDN(`unpkg.com`) 접근이 막히지 않는 네트워크에서 연다.
- 파일명에 공백이 있으므로 직접 링크가 필요하면 `Compressor%20Dashboard.dc.html`처럼 URL 인코딩한다.
- 배포 후 `/` 접속 → KPI 화면 렌더 → 탭 전환 → 콘솔 에러 0 순서로 확인한다.
- 기존에 열어둔 브라우저가 있으면 `Ctrl+Shift+R`로 캐시를 비우고 다시 확인한다.

---

## 출처 및 라이선스

- 데이터 출처: Samsung Compressor Catalogue 2024, LG Scroll Compressor Catalog 2025, Perplexity 공개 리서치(2026-06), 각사 공개 카탈로그·데이터시트
- 이 저장소는 내부 연구/경쟁 인텔리전스 목적입니다.
