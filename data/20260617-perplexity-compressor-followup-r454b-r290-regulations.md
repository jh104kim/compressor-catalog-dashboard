---
type: perplexity-research-raw
created: 2026-06-17
source: perplexity-pro
status: inbox
sensitivity: review-required
topic: "압축기 후속 리서치 — R454B/R290 최신 동향 및 규제 기준"
intended_use:
  - cnm-dashboard
  - work-report
  - compressor-wiki
tags:
  - compressor
  - catalog
  - refrigerant
  - r454b
  - r290
  - r744
  - regulation
  - ashrae
  - eu-ecodesign
  - china-gb
  - use/cnm-dashboard
processed_status: pending
---

# Perplexity Research Raw — 압축기 후속 리서치 R454B/R290 규제 기준

> 본 문서는 메인 리포트(`compressor_deep_research_report.md`) Section 11-6의 후속 검색 쿼리 20개 중 핵심 4개 주제를 실행한 결과물입니다.
> Samsung 관점(당사 기준) 으로 정리되었습니다.

---

## 1. 원 질문

**메인 쿼리 그룹 (Section 11-6 기반)**

```
[Samsung 자사 데이터 보완]
1. "Samsung compressor" "R454B" scroll site:samsung.com
2. "Samsung compressor" "R290" reciprocating catalog 2024 OR 2025
3. "Samsung compressor" catalog 2023 OR 2024 OR 2025 filetype:pdf
4. Samsung DA91 OR DA96 compressor refrigerator R290
5. Samsung Electronics compressor division annual report 2024 2025

[경쟁사 R454B 스크롤 벤치마크]
6. Copeland "YH" OR "YHV" R454B scroll compressor specifications EER COP
7. Danfoss "DSH" R454B scroll compressor datasheet 2025
8. LG scroll compressor R454B specifications catalog
9. GMCC scroll R454B compressor specifications 2025

[냉매 전환 트렌드]
10. R290 reciprocating compressor 2025 refrigerator market adoption
11. AIM Act 2025 R454B compressor supply chain update
12. R32 scroll compressor 90kW 2025 market
13. R744 CO2 heat pump compressor rotary market 2025 2026

[효율 규제 기준]
14. ASHRAE 90.1 2022 compressor efficiency standards R32 R454B
15. EU Ecodesign 2025 2026 compressor COP minimum standards
16. China GB 19577 compressor efficiency 2024 R32
```

---

## 2. Perplexity 원문

### 2-1. 당사(Samsung) R454B / R290 최신 동향

#### 2-1-1. Samsung R290 로터리 히트펌프 — 공식 출시 확인

- **출시 시점**: 2024년 3월 공식 발표
- **제품군**: R290 모노블록 히트펌프
- **용량 범위**: 4~14 kW (1.1~4 TR)
- **대표 모델**: AE120CXYDGK-EU
  - 난방 용량: 12 kW
  - COP: **4.80** (A7/W35 기준)
- **배경**: 개정 EU F-Gas 규제 대응 목적으로 개발
- **출처**: [Samsung Newsroom — naturalrefrigerants.com (2024-03-07)](https://naturalrefrigerants.com/news/samsung-showcases-new-r290-monobloc-heat-pump-designed-for-revised-f-gas-regulation/)
- **제품 페이지**: [samsung.com/levant — AE120CXYDGK-EU](https://www.samsung.com/levant/business/system-air-conditioners/eco-heating-system/ae6000c-r290-refrigerant-ae120cxydgk-eu/)

#### 2-1-2. Samsung R290 스크롤 압축기 — 개발 중

- **상태**: In Progress (개발 진행 중, 미출시)
- **예상 용량**: 16~20 kW (4.5~5.7 TR)
- **최대 응축 온도**: 85°C
- **시사점**: 당사 스크롤 라인업의 저GWP 전환 로드맵 확인

#### 2-1-3. Samsung R454B 스크롤 — Unitary 공식 확인

- **출처**: [samsung.com/global/business/compressor/applications/unitary/](https://www.samsung.com/global/business/compressor/applications/unitary/)
- **확인 내용**:

| 구분 | 냉매 | 상태 |
|------|------|------|
| Variable Speed Scroll | R454B | Mass Product (양산 중) |
| Fixed Speed Scroll | R454B | In Progress (개발 중) |

- **시사점**: 당사 Unitary AC용 R454B 스크롤은 Variable Speed 기준 이미 양산 단계

#### 2-1-4. Samsung AI 인버터 압축기 — CES 2025 발표

- **발표일**: 2024-12-19
- **주요 성능**:
  - 모터 효율: **95%+**
  - 기존 대비 효율 개선: **10%+** (950~1,450 rpm 구간)
  - 소음: **<35 dB(A)**
- **적용 제품**: 냉장고 세그먼트 (AI Hybrid Cooling)
- **출처**: [Samsung Newsroom — CES 2025 (2024-12-19)](https://news.samsung.com/global/samsung-unveils-new-refrigerators-with-innovative-ai-hybrid-cooling-technology-at-ces-2025)

---

### 2-2. 경쟁사 R454B 스크롤 벤치마크

#### 2-2-1. Copeland YH 시리즈 (Fixed Speed, R452B/R454C)

- **모델**: YH15K1P
- **냉매**: R452B
- **용량**: 15 hp
- **난방 성능** (-7°C/50°C 기준):
  - 난방 용량: 17.5 kW
  - 입력 전력: 5.0 kW
  - COP: **3.50** (계산값)
- **출처**: [Copeland YH Scroll Datasheet — hasioti.gr (2025-02)](https://hasioti.gr/wp-content/uploads/2025/02/copeland-scroll-yh.pdf)

#### 2-2-2. Copeland YHV 시리즈 (Variable Speed, R452B/R454B)

| 모델 | 배제량 | 냉매 | 난방 용량 | COP |
|------|--------|------|---------|-----|
| YHV018 (YHV0182P) | 18 cc | R454B | 6.2~10.1 kW | 2.0 |
| YHV038 (YHV0382P) | 38 cc | R454B | 12.6 kW (정격) / 최대 21.4 kW | 2.2 |
| YHV025 | 25 cc | R454B | — | — |

- **출처**: [Copeland YHV/XHV Scroll Datasheet — hasioti.gr (2025-02)](https://hasioti.gr/wp-content/uploads/2025/02/copeland-scroll-yhv-xhv.pdf)

> **당사 비교 노트**: Samsung Variable Speed R454B Scroll (Unitary, Mass Product) 대비 Copeland YHV는 COP 2.0~2.2 수준으로, 당사 R410A 스크롤 COP 3.28~3.37 대비 낮음. 측정 조건 차이(히트펌프 난방 vs. 냉방 기준) 확인 필요.

#### 2-2-3. Danfoss DSH 시리즈 (R410A / R452B / R454B, 7.5~50 TR)

| 모델 | 냉매 | 주파수 | 냉방 용량 | COP |
|------|------|--------|---------|-----|
| DSH090 | R454B | 50 Hz | **19,346 W** | ~3.34 |
| DSH090 | R410A | 60 Hz | 21,500 W | — |
| DSH600 | R410A | 60 Hz | **175,344 W** (50 TR) | 3.26~3.35 |

- **DSH240 상세 스펙**:
  - 배제량: 227.60 cc
  - 전원: 380~415V / 3ph / 50 Hz
  - 오일: POE
  - 오일 충전량: 6.10 L
- **출처**: [Danfoss DSH Datasheet AB288965961751en-001701](https://assets.danfoss.com/documents/latest/461327/AB288965961751en-001701.pdf)
- **제품 페이지**: [Danfoss Design Center — DSH240](https://designcenter.danfoss.com/products/climate-solutions-for-cooling/compressors/compressors-for-air-conditioning/scroll-compressors/dsh/p/120H1374)

> **당사 비교 노트**: Danfoss DSH는 7.5~50 TR 대용량 라인업. 당사 DS 스크롤 최대 범위 초과 구간 대응 가능 여부 검토 필요.

#### 2-2-4. LG 스크롤 R454B 시리즈 (2025 카탈로그)

| 시리즈 | 구분 | 냉매 | 용량 범위 | COP |
|--------|------|------|---------|-----|
| YPH / YBH | Fixed Speed | R454B | 1.5~8+ Ton | 비공개 (Confidential) |
| APH / ABH | — | R454B | — | 비공개 |
| YPM / YBM | Two-stage Modulating | R454B | — | 비공개 |
| R1™ | Variable Speed | R454B 지원 확인 | — | — |

- **신규 확장 시리즈**: 2025년 발표 (2025-07-28 예정 포함)
- **Gen 3 스크롤**: R32 및 R454B 호환 확인
- **출처**: [LG Scroll Compressor Catalogue 2025 (PDF)](https://www.lg.com/global/images/business/compressor-motor/resource-download/pdf-file/LG_Scroll_Compressor_Catalogue.pdf)
- **블로그**: [LG Expanded Scroll Series for R454B (2025)](https://www.lg.com/global/business/insights/compressor-motor/blog/lgs-new-expanded-scroll-series-for-r454b-refrigerant/)
- **Gen 3**: [LG Gen 3 Scroll Compressor PDF](https://www.lg.com/global/business/download/resources/CT00000308/LG%20Gen%203%20Scroll%20Compressor%5B20230418_170129%5D.pdf)

> **당사 비교 노트**: LG는 R454B 스크롤 스펙을 비공개(Confidential) 처리. 당사 대비 직접 수치 비교 불가. 시장 출시 타이밍은 유사(2025).

---

### 2-3. 냉매 전환 트렌드

#### 2-3-1. R1234yf 시장 현황

- **2025년 시장 규모**: **$295M**
- **CAGR**: 5.2% (2025~2033)
- **주요 수요처**: 자동차 에어컨 **70%+ 점유**
- **시사점**: 압축기 적용보다는 자동차 냉매 전환 주도
- **출처**: [Data Insights Market — R1234yf Report (2026-02-04)](https://www.datainsightsmarket.com/reports/low-gwp-refrigerant-r-1234yf-1123643)

#### 2-3-2. R744 (CO2) 히트펌프 시장

- **전망**: 2025년 대형 자연냉매 히트펌프 시장에서 **R744 세그먼트가 주도적 위치** 예상
- **적용 분야**: 대형 산업용 히트펌프, 지역 난방
- **출처**: [Scotts International — Large-Scale Natural Refrigerant Heat Pump Market 2025](https://www.scotts-international.com/large-scale-natural-refrigerant-heat-pump-market-)

#### 2-3-3. R32 성능 비교

- R410A 대비 R32:
  - 냉방 용량: **+11% 우위**
  - 효율: **+3% 우위** (ARI 정격 조건 기준)
- **시사점**: 당사 UB 시리즈(R32/R410A 듀얼) 포지셔닝 강점 확인

#### 2-3-4. 냉매 전환 로드맵 요약 (당사 관점)

```
현재 (2025)          단기 (2026~2027)        중기 (2028~2030)
─────────────────────────────────────────────────────────
R410A (주류)    →   R454B (AIM Act 대응)  →   R290/R32 (EU/글로벌)
R134a (냉장고)  →   R600a / R290          →   R290 확대
R22 (레거시)    →   단계적 퇴출            →   완전 퇴출
```

---

### 2-4. 효율 규제 기준

#### 2-4-1. ASHRAE 90.1-2022 (미국)

| 구분 | 기준값 |
|------|--------|
| 스플릿 냉방 EER | ≥ 11.0 (3.22 W/W) |
| 난방 COP (47°F) | ≥ 3.3 |
| **US DOE 2023 SEER2** | ≥ **15.2** |
| **US DOE 2023 EER2** | ≥ **11.7** |
| **US DOE 2023 HSPF2** | ≥ **7.5** |

- **ASHRAE 15-2022 추가 승인 냉매**: R32, R452B, R454A, R454B, R454C (주거용 제습기/칠러)
- **시사점**: 당사 R454B 스크롤 Variable Speed (Unitary, Mass Product)는 ASHRAE 15-2022 기준 적합

#### 2-4-2. EU Ecodesign (유럽)

| 구분 | 기준값 |
|------|--------|
| Tier 2 SEER (스플릿 냉방) | ≥ **5.1** |
| Tier 2 SCOP (난방) | ≥ **3.8** (의무 최소) |

- **EU F-Gas 2027 규제**:
  - 정치용 칠러 ≤12 kW, GWP ≥150 냉매 사용 **금지**
  - 대상 냉매: R410A (GWP 2,088), R454B (GWP 466 → 해당 없음), R290 (GWP 3 → 적합)
- **출처**: [EU Climate Action — Air Conditioning F-Gas](https://climate.ec.europa.eu/eu-action/fluorinated-greenhouse-gases/climate-friendly-alternatives-f-gases/air-conditioning_en)
- **당사 대응**: EHS R290 히트펌프 (AE120CXYDGK-EU, COP 4.80) → EU 2027 규제 사전 대응 완료

#### 2-4-3. China GB 19577-2024 (중국)

| 항목 | 내용 |
|------|------|
| 개정 연도 | **2024년** (GB 19577-2015 대체) |
| 신규 용량 구간 | **300 kW** 구간 추가 |
| 평가 방식 | 이중 트랙: 수냉식(IPLV + COPc) / 공냉식(CSPF + COPc) |
| 효율 등급 | **3단계** (1등급 최고) |
| 시행 | 2024년 발효 |

- **시사점**: 중국 공냉식 칠러 대상 CSPF 지표 추가 — 당사 Unitary 라인 중국 인증 재검토 필요

---

## 3. Perplexity 출처 링크

**Samsung 공식**
- [samsung.com — Unitary Compressor Applications](https://www.samsung.com/global/business/compressor/applications/unitary/)
- [samsung.com — EHS R290 히트펌프 AE120CXYDGK-EU](https://www.samsung.com/levant/business/system-air-conditioners/eco-heating-system/ae6000c-r290-refrigerant-ae120cxydgk-eu/)
- [Samsung Newsroom — CES 2025 AI 인버터 (2024-12-19)](https://news.samsung.com/global/samsung-unveils-new-refrigerators-with-innovative-ai-hybrid-cooling-technology-at-ces-2025)
- [naturalrefrigerants.com — Samsung R290 모노블록 (2024-03-07)](https://naturalrefrigerants.com/news/samsung-showcases-new-r290-monobloc-heat-pump-designed-for-revised-f-gas-regulation/)

**Copeland**
- [Copeland YH Scroll Datasheet (PDF, 2025-02)](https://hasioti.gr/wp-content/uploads/2025/02/copeland-scroll-yh.pdf)
- [Copeland YHV/XHV Scroll Datasheet (PDF, 2025-02)](https://hasioti.gr/wp-content/uploads/2025/02/copeland-scroll-yhv-xhv.pdf)

**Danfoss**
- [Danfoss DSH Datasheet AB288965961751en-001701 (PDF)](https://assets.danfoss.com/documents/latest/461327/AB288965961751en-001701.pdf)
- [Danfoss Design Center — DSH240 제품 페이지](https://designcenter.danfoss.com/products/climate-solutions-for-cooling/compressors/compressors-for-air-conditioning/scroll-compressors/dsh/p/120H1374)

**LG**
- [LG Scroll Compressor Catalogue 2025 (PDF)](https://www.lg.com/global/images/business/compressor-motor/resource-download/pdf-file/LG_Scroll_Compressor_Catalogue.pdf)
- [LG Expanded Scroll Series for R454B — Blog (2025)](https://www.lg.com/global/business/insights/compressor-motor/blog/lgs-new-expanded-scroll-series-for-r454b-refrigerant/)
- [LG Gen 3 Scroll Compressor (PDF)](https://www.lg.com/global/business/download/resources/CT00000308/LG%20Gen%203%20Scroll%20Compressor%5B20230418_170129%5D.pdf)

**규제 기준**
- [EU Climate Action — F-Gas Air Conditioning](https://climate.ec.europa.eu/eu-action/fluorinated-greenhouse-gases/climate-friendly-alternatives-f-gases/air-conditioning_en)
- [Data Insights Market — R1234yf Market Report (2026-02-04)](https://www.datainsightsmarket.com/reports/low-gwp-refrigerant-r-1234yf-1123643)
- [Scotts International — Natural Refrigerant Heat Pump Market 2025](https://www.scotts-international.com/large-scale-natural-refrigerant-heat-pump-market-)

---

## 4. 내가 원하는 활용 방향

- **압축기 카탈로그 데이터셋화**: R454B/R290 스크롤 경쟁사 스펙 행 추가
- **냉매별 Re/Ro/Sc 매트릭스 갱신**: R290 스크롤(개발 중), R454B 스크롤(양산) 상태 반영
- **제조사별 벤치마크**: Copeland YHV vs. Danfoss DSH vs. LG YPH vs. 당사 DS 시리즈 비교표 생성
- **C&M 대시보드 컬럼 후보 추출**:
  - `refrigerant_transition_status` (Mass Product / In Progress / Legacy)
  - `regulation_compliance` (ASHRAE / EU Ecodesign / China GB)
  - `cop_benchmark_delta` (경쟁사 대비 당사 COP 차이)
- **업무 리포트 문장 후보**:
  - "당사 R454B Variable Speed 스크롤은 Unitary 세그먼트에서 양산 단계에 진입하였으며, EU F-Gas 2027 규제 대응을 위한 R290 라인업 확장이 병행 진행 중입니다."
  - "경쟁사 LG는 R454B 스크롤 스펙을 비공개 처리하고 있어, 공개 데이터 기반 직접 비교에 제한이 있습니다."

---

## 5. 미수집 항목 (추가 검색 권장)

Section 11-6 쿼리 중 이번 검색에서 결과 미확보 항목:

| # | 쿼리 | 우선순위 |
|---|------|---------|
| 4 | Samsung DA91/DA96 냉장고용 R290 압축기 | 중 |
| 9 | GMCC 스크롤 R454B 스펙 2025 | 중 |
| 11 | AIM Act 2025 R454B 공급망 현황 | 高 |
| 17 | Embraco R290 제품 선택 도구 | 저 |
| 18 | Secop Toolkit 2026 다운로드 | 저 |
| 19 | Danfoss Coolselector2 2025~2026 업데이트 | 저 |
| 20 | GMCC AT 시리즈 R32 트윈 로터리 COP 스펙 | 중 |

---

*작성일: 2026-06-17 | 기반 세션: Perplexity Computer — 압축기 카탈로그 딥 리서치*
*메인 리포트 연결: `compressor_deep_research_report.md`*
