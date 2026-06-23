---
tags: [compressor, samsung, benchmark, refrigerant, HVAC, C&M]
date: 2026-06-17
---

# 압축기 딥 리서치 리포트 — Samsung 관점

> **작성일:** 2026-06-17  
> **분석 기준:** Samsung Electro-Mechanics / Samsung 압축기 사업부 (당사)  
> **목적:** Samsung 압축기 포트폴리오 현황 파악 및 경쟁사 벤치마크  
> **데이터 수집 기간:** 2024~2026년 공개 카탈로그 및 공식 웹페이지 기준

---

## 1. Executive Summary

> Samsung 관점에서 도출한 15개 핵심 발견사항. 모든 주장은 공개 소스에 근거함.

### 1-1. Samsung Re/Ro/Sc 커버리지 현황

**발견사항 1: Samsung은 왕복동(Re), 로터리(Ro), 스크롤(Sc) 세 유형 모두를 보유한 풀-라인업 제조사이나, 카탈로그가 2018년 이후 미갱신 상태이다.**  
Samsung 압축기 공식 사이트([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/))는 2025-02-04 업데이트를 표시하고 있으나, 가장 최근 공개 카탈로그는 2018년 PDF로 확인된다. 이는 경쟁사 LG(2025 Reciprocating), GMCC(2026 Rotary), Secop(2026년 3월) 등과 비교할 때 카탈로그 현행화 측면에서 상당한 격차가 존재함을 의미한다.

**발견사항 2: Samsung 왕복동(Re) 압축기는 냉장고 전용으로 R600a(LBP/MBP) 및 R134a(LBP/HBP) 냉매를 지원하며, BLDC 인버터 모델도 보유하고 있다.**  
ENV4A5DL2B(R600a, BLDC, 15.31cc, COP 1.97)와 같이 고효율 BLDC 모델이 존재하나([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)), R290 왕복동 냉장고용 압축기는 공식 Re 페이지에서 미확인이다. LG는 이미 2025 카탈로그에서 R290 왕복동을 포함하고 있어 Samsung과의 격차가 확인된다.

**발견사항 3: Samsung 로터리(Ro) 압축기는 에어컨용 주력 제품으로 R32, R410A, R454B(Unitary)를 지원하며, 용량 범위 5,000~52,800 BTU/h를 커버한다.**  
특히 R454B는 Unitary Application 섹션에서 Variable/Fixed Speed 모두 "Mass Product" 또는 "In Progress" 상태로 확인되어([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)), 미국 HVAC 규제 대응이 진행 중임을 보여준다.

**발견사항 4: Samsung 스크롤(Sc) 압축기는 R410A, R32(Mass Product/In Progress), R290(In Progress) 냉매를 지원하며, 최대 108,500 BTU/h(약 31.8kW) 용량까지 확장된다.**  
R290 스크롤(DS2WF7046FV, 45.6cc, COP 3.43)은 In Progress 상태이며, R454B 스크롤 모델은 현재 확인되지 않는다. 이는 Copeland, Danfoss, GMCC 대비 R454B 스크롤 부문에서 공백이 존재함을 시사한다.

### 1-2. Samsung 냉매 포트폴리오 강점/공백

**발견사항 5: Samsung의 냉매 포트폴리오 강점은 R32/R410A 듀얼 지원 로터리 및 스크롤이며, 약점은 R290 왕복동, R744/CO2, R1234yf, R454C의 부재이다.**  
GMCC는 R744 CO2 히트펌프 로터리를 이미 양산 중이고([https://www.gmcc-welling.com/en](https://www.gmcc-welling.com/en)), Embraco는 R1234yf 왕복동을 카탈로그에 포함하며([https://www.embraco.com](https://www.embraco.com)), Danfoss는 R744 Turbocor 원심형을 보유한다([https://www.danfoss.com/en/products/dcs/compressors/](https://www.danfoss.com/en/products/dcs/compressors/)). Samsung은 이 세 냉매 모두 현재 제품이 없음(미확인)으로 분류된다.

**발견사항 6: Samsung R32 스크롤은 DS4BD7090FV(90cc, 108,500 BTU/h, In Progress) 등 대용량 모델을 개발 중으로, R410A에서 R32 전환을 적극 준비 중이다.**  
이미 DS4BD7046FV(45.6cc), DS4BC7066FV(65.8cc)는 Mass Product 상태이며, 대용량 90cc 모델이 뒤를 잇고 있다([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)).

### 1-3. 경쟁사 대비 Samsung 포지셔닝

**발견사항 7: 로터리 압축기 규모 측면에서 GMCC(Midea 계열)는 연간 5억 개 생산으로 세계 최대 로터리 제조사이며, Samsung은 이 부문에서 규모 열위에 있다.**  
GMCC는 R744 CO2, R1234yf, R1270까지 포함한 가장 넓은 냉매 포트폴리오를 보유하고 있다([https://www.gmcc-welling.com/en](https://www.gmcc-welling.com/en)). 반면 Samsung의 강점은 BLDC 인버터 기술과 R32/R410A 듀얼 지원에 있다.

**발견사항 8: LG는 Linear Compressor라는 Samsung이 보유하지 않은 독자 기술을 보유하고 있으며, UniRotary™(R454B 전용)와 R1™ 하이브리드(28+ SEER)로 차별화를 시도하고 있다.**  
LG 공식 사이트([https://www.lg.com/global/business/compressor-motor/](https://www.lg.com/global/business/compressor-motor/))에서 확인된 UniRotary™와 R1™ 하이브리드 기술은 Samsung의 현 포트폴리오에는 대응 제품이 없는 공백 영역이다.

**발견사항 9: Copeland(Emerson)는 R744/CO2 스크롤(ZO/ZOD)과 R454B 스크롤(YH/YHV)을 이미 양산 중으로, 저GWP 스크롤 부문에서 Samsung보다 앞서 있다.**  
Copeland는 Copeland Select Software를 통해 엔지니어링 선택 도구도 제공하는 반면([https://www.copeland.com](https://www.copeland.com)), Samsung은 별도 공개 선택 도구가 없어 고객 편의성 측면에서도 격차가 있다.

### 1-4. 성장/레거시 냉매-압축기 조합

**발견사항 10: R290은 GWP 3으로 가장 환경 친화적인 자연 냉매로서 성장 트렌드에 있으나, Samsung은 R290 스크롤(In Progress)만 개발 중이며 R290 왕복동/로터리는 미확인 또는 미진출 상태이다.**  
LG, Embraco, GMCC, Panasonic, Highly 등 대부분의 경쟁사가 R290 왕복동을 이미 양산 중임에 반해([https://www.embraco.com](https://www.embraco.com)), Samsung의 R290 대응은 스크롤 한 유형에 국한된 초기 단계이다.

**발견사항 11: R22는 레거시(Declining) 냉매로, Samsung 로터리 포트폴리오(UR 시리즈)에 여전히 포함되어 있으나 신규 시장에서의 의미는 제한적이다.**  
R22 로터리는 기존 교체 시장(Retrofit) 대응용으로 유지 중이다([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)).

**발견사항 12: R454B는 미국 AIM Act 규제 대응 핵심 냉매로서 Samsung 로터리에서 Unitary 용도로 양산/개발 중이나, 스크롤 부문에서의 R454B 대응은 확인되지 않는다.**  
Danfoss DSH 시리즈, Copeland YH/YHV, LG UniRotary™, GMCC 스크롤 모두 R454B를 지원하는 상황에서 Samsung 스크롤의 R454B 공백은 중요한 전략적 리스크이다.

### 1-5. 벤치마크 가능한 데이터 vs 추가 확인 필요 데이터

**발견사항 13: Samsung 로터리 R410A Variable Speed 모델(UG9CM5072F: COP 3.37, UG5TM5520F: COP 3.28)과 GMCC AT 시리즈 R32(ATF310D43UMT: COP 3.65)를 직접 벤치마크하면 GMCC 대비 Samsung의 효율 차이가 약 0.28~0.37 COP 수준임을 확인할 수 있다.**  
다만 이는 냉매 차이(R410A vs R32)와 테스트 조건 차이가 있어 직접 비교 시 주의가 필요하다.

**발견사항 14: Samsung 스크롤 R290 모델(DS2WF7046FV, COP 3.43)은 동급 R410A 모델(DS2GR7046FV, COP 3.31) 대비 COP가 약 3.6% 높아 R290 전환의 효율 이점이 확인된다.**  
단, 해당 모델은 In Progress 상태이므로 양산 스펙 확정 후 재검증이 필요하다([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)).

**발견사항 15: Samsung 왕복동 R134a 모델 중 일부(CD124K-S1ZA: COP 0.76)는 매우 낮은 효율을 보이며, 이는 소형 냉장고용 고정속도 모터의 고유 특성이다. BLDC 모델(ENV4A5DL2B: COP 1.97)과의 효율 격차가 약 2.6배로, BLDC 전환의 효율 이점이 데이터로 확인된다.**  
이 격차는 에너지 효율 규제 강화 환경에서 Samsung의 BLDC 전환 전략 근거로 활용 가능하다([https://www.samsung.com/global/business/compressor/](https://www.samsung.com/global/business/compressor/)).

---

## 2. Source Inventory 테이블

> 수집된 소스 목록. 각 회사 최소 2개 소스 행 포함. 신뢰도: High=공식 PDF 카탈로그, Medium=공식 웹페이지, Low=간접 참조.

| 제조사 | 압축기 유형 | 소스 유형 | 문서명 | URL | 연도/업데이트 | 용도 | 발견된 냉매 | 신뢰도 |
|--------|------------|---------|--------|-----|--------------|------|------------|--------|
| Samsung | Re (왕복동) | 공식 웹페이지 | Reciprocating Compressor Product Page | [링크](https://www.samsung.com/global/business/compressor/) | 2025-02-04 | 냉장고 압축기 | R600a, R134a | Medium |
| Samsung | Ro (로터리) | 공식 웹페이지 | Rotary Compressor Product Page | [링크](https://www.samsung.com/global/business/compressor/) | 2025-02-04 | 에어컨 압축기 | R22, R410A, R32, R134a, R407C, R290, R454B | Medium |
| Samsung | Sc (스크롤) | 공식 웹페이지 | Scroll Compressor Product Page | [링크](https://www.samsung.com/global/business/compressor/) | 2025-02-04 | 에어컨/히트펌프 | R410A, R32, R290 | Medium |
| Samsung | Re/Ro/Sc | PDF 카탈로그 | Samsung Compressor Catalogue 2018 | [링크](https://www.samsung.com/global/business/compressor/) | 2018 (최신) | 전 제품 라인업 | R600a, R134a, R22, R410A, R32 등 | High |
| LG | Re (왕복동) | 공식 웹페이지 + 카탈로그 | LG Reciprocating Compressor 2025 | [링크](https://www.lg.com/global/business/compressor-motor/) | 2025 | 냉장고 압축기 | R600a, R134a, R290, R134a HBP | High |
| LG | Ro (로터리) | 공식 웹페이지 + 카탈로그 | LG Rotary Compressor 2024 | [링크](https://www.lg.com/global/business/compressor-motor/) | 2024 | 에어컨 압축기 | R32, R410A, R454B, R290, R134a, R22, R407C | High |
| LG | Sc (스크롤) | 공식 웹페이지 + 카탈로그 | LG Scroll Compressor ~2023-2024 | [링크](https://www.lg.com/global/business/compressor-motor/) | ~2023-2024 | 에어컨/히트펌프 | R410A, R32, R454B, R404A/R507/R407A/R407C/R448A/R449A | High |
| LG | Re (Linear) | 공식 웹페이지 | LG Linear Compressor | [링크](https://www.lg.com/global/business/compressor-motor/) | 2024-2025 | 냉장고 압축기 | R134a, R600a | Medium |
| Embraco (Nidec GA) | Re (왕복동) | 공식 웹페이지 | Embraco Reciprocating Compressor | [링크](https://www.embraco.com) | 2025-2026 | 냉장고/냉동 | R134a, R600a, R290, R1234yf, R404A, R448A, R449A, R452A, R513A | High |
| Embraco (Nidec GA) | Sc (스크롤) | 공식 웹페이지 | Embraco Scroll Compressor | [링크](https://www.embraco.com) | 2025-2026 | HVAC&R | R455A, R454A, R454C, R452B, R32, R410A, R404A, R448A, R449A, R452A, R134a, R450A, R513A | High |
| Embraco (Nidec GA) | Re | 선택 도구 | Product Selector Software | [링크](https://products.embraco.com/compressors) | 2026 | 모델 선택 | 전 냉매 | High |
| Danfoss | Re (왕복동) | 공식 웹페이지 | Danfoss Maneurop Reciprocating | [링크](https://www.danfoss.com/en/products/dcs/compressors/) | 2025-2026 | 상업냉동 | R134a, R448A, R449A, R454C, R455A | High |
| Danfoss | Sc (스크롤) | 공식 웹페이지 | Danfoss Scroll HVAC (DSH/DSF) | [링크](https://www.danfoss.com/en/products/dcs/compressors/) | 2025-2026 | HVAC | R454B, R452B, R32 | High |
| Danfoss | 원심형 | 공식 웹페이지 | Danfoss Turbocor | [링크](https://www.danfoss.com/en/products/dcs/compressors/) | 2025-2026 | 대형 HVAC | R1234ze, R513A, R515B | High |
| Secop | Re (왕복동) | 공식 웹페이지 | Secop SC/SCE, BD Series | [링크](https://www.secop.com/products/product-portfolio) | 2026년 3월 | 냉장고/DC/의료 | R600a, R290, R134a, R404A, R170 | High |
| Secop | Re | 선택 도구 | Secop Toolkit | [링크](https://www.secop.com/products/product-portfolio) | 2026 | 모델 선택 | 전 냉매 | High |
| Copeland | Sc (스크롤) | 공식 웹페이지 | Copeland Scroll ZP/YP/YH/ZB/ZO | [링크](https://www.copeland.com) | 2024 | HVAC/냉동 | R410A, R32, R454B, R452B, R404A, R744/CO2, R290 | High |
| Copeland | Sc | PDF 카탈로그 | Copeland General Catalogue 2024 | [링크](https://www.copeland.com) | 2024 | 전 스크롤 라인업 | 상동 | High |
| GMCC | Ro (로터리) | 공식 웹페이지 | GMCC Rotary Compressor 2026 | [링크](https://www.gmcc-welling.com/en) | 2026 | 에어컨 | R32, R410A, R22, R134a, R290, R407C, R404A, R744, R1234yf, R1270, R448A, R449A, R513A, R454B, R450A | High |
| GMCC | Sc (스크롤) | 공식 웹페이지 | GMCC Scroll Compressor 2025 | [링크](https://www.gmcc-welling.com/en) | 2025 | 상업용 HVAC | R454B, R448A, R32, R290, R410A | High |
| GMCC | Re (왕복동) | 공식 웹페이지 | GMCC Reciprocating Compressor 2024 | [링크](https://www.gmcc-welling.com/en) | 2024 | 냉장고 | R600a, R290, R134a, R404A, R1234yf, R513A, R448A/R449A | High |
| Highly | Ro (로터리) | 공식 웹페이지 | Highly Rotary Catalogue 2024 | [링크](https://en.highly.cc) | 2024 | 에어컨 | R22, R134a, R290, R32, R410A, R407C, R600a, R1234yf, R452B, R454B, R454C, R513A, R744 | High |
| Highly | Sc (EV 스크롤) | 공식 웹페이지 | Highly ETS/ETH EV Scroll | [링크](https://en.highly.cc) | 2024 | 전기차 에어컨 | R134a, R1234yf | Medium |
| Panasonic | Ro (로터리) | 공식 웹페이지 | Panasonic Rotary Fixed 2025-2026 | [링크](https://industrial.panasonic.com/ww/products/motors-compressors/compressors) | 2025-2026 | 에어컨 | R410A, R134a, R32, R22, R1234yf/ze, R404A, R290, R454C, R454B, R448A | High |
| Panasonic | Sc (스크롤) | 공식 웹페이지 | Panasonic Scroll Variable 2023 | [링크](https://industrial.panasonic.com/ww/products/motors-compressors/compressors) | 2023 | 에어컨/히트펌프 | R32, R134a, R744/CO2 | Medium |

---

## 3. Model-Level Dataset 테이블

> Samsung 모델 우선 배치 (최소 20개). 경쟁사 대표 모델 각 3-5개씩 후속 배치.  
> Capacity_W: 1 BTU/h × 0.2931 W 변환값 또는 카탈로그 직접 W값. 소스: [Samsung](https://www.samsung.com/global/business/compressor/)

### 3-1. Samsung 모델

| 제조사 | 유형 | 용도 | 모델/시리즈 | 냉매 | 전압 | 주파수 | 상수 | 드라이브 | 변위(cc) | 용량(원본) | Capacity_W | 입력전력(W) | EER | COP | 오일 유형 | 상태 | 소스 URL |
|--------|------|------|------------|------|------|--------|------|---------|---------|----------|-----------|-----------|-----|-----|---------|------|---------|
| Samsung | Re | 냉장고 LBP | ENV4A5DL2B | R600a | 115-127V | 60Hz | 1Φ | BLDC | 15.31 | — | 148W | 75 | 6.72 | 1.97 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Re | 냉장고 LBP | ENV4A5H-L2B | R600a | 200-220V | 50Hz | 1Φ | BLDC | 15.31 | — | 148W | 75 | 6.72 | 1.97 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Re | 냉장고 LBP | CD124K-S1ZA | R134a | 220V | 50Hz | 1Φ | Fixed (RSIR) | 미확인 | 42 Kcal/Hr | ~49W | 64 | 2.61 | 0.76 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Re | 냉장고 MBP | MSA143K-S1B | R134a | 220V | 50Hz | 1Φ | Fixed (RSCR) | 미확인 | 96 Kcal/Hr | ~112W | 77 | 4.95 | 1.45 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Re | 냉장고 MBP | MSA170K-S1G | R134a | 220V | 50Hz | 1Φ | Fixed (RSCR) | 미확인 | 173 Kcal/Hr | ~201W | 135 | 5.09 | 1.49 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UG9C050HS | R410A | 115V | 60Hz | 1Φ | Fixed (AC) | 4.9 | 5,000 BTU/H | 1,465 | 495 | 10.1 | 2.96 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UG9C052HS | R410A | 115V | 60Hz | 1Φ | Fixed (AC) | 5.0 | 5,200 BTU/H | 1,524 | 515 | 10.1 | 2.96 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UG9CM5072F | R410A | 미확인 | 50/60Hz | 미확인 | Variable (BLDC) | 7.3 | 7,350 BTU/H | 2,154 | 639 | 11.5 | 3.37 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UG9T115FUA | R410A | 미확인 | 50/60Hz | 미확인 | Variable (BLDC) | 11.6 | 11,800 BTU/H | 3,459 | 1,054 | 11.2 | 3.31 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UG5TM5520F | R410A | 미확인 | 50/60Hz | 미확인 | Variable (BLDC) | 49.4 | 52,700 BTU/H | 15,445 | 4,705 | 11.20 | 3.28 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UB1TD1077F | R32/R410A | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 미확인 | 8,200 BTU/H | 2,404 | 미확인 | 미확인 | 3.05~3.43 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UB1AR1090F | R32/R410A | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 미확인 | ~9,000 BTU/H | ~2,638 | 미확인 | 미확인 | 3.05~3.43 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UB1TC5102F | R32/R410A | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 미확인 | ~10,200 BTU/H | ~2,990 | 미확인 | 미확인 | 3.05~3.43 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UB1TC5146F | R32/R410A | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 미확인 | ~14,600 BTU/H | ~4,279 | 미확인 | 미확인 | 3.05~3.43 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Ro | 에어컨 | UB9TA8150F | R32/R410A | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 미확인 | ~49,800 BTU/H | ~14,596 | 미확인 | 미확인 | 3.05~3.43 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4GN5033INA | R410A | 208-230V | 60Hz | 1Φ | Fixed Speed | 33.1 | 34,500 BTU/H | 10,112 | 3,250 | 10.6 | 3.08 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4GN5038INA | R410A | 208-230V | 60Hz | 1Φ | Fixed Speed | 38.0 | 40,500 BTU/H | 11,870 | 3,780 | 10.7 | 3.11 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS2GR7046FV | R410A | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 45.6 | 52,000 BTU/H | 15,241 | 4,602 | 11.30 | 3.31 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4GM5052FV | R410A | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 52.0 | 60,500 BTU/H | 17,732 | 5,403 | 11.20 | 3.28 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4GR7066FV | R410A | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 65.8 | 75,400 BTU/H | 22,099 | 6,670 | 11.30 | 3.31 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4GR5080FV | R410A | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 80.0 | 90,500 BTU/H | 26,526 | 8,080 | 11.20 | 3.28 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4BD7046FV | R32 | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 45.6 | 55,900 BTU/H | 16,384 | 4,950 | 11.30 | 3.31 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4BC7066FV | R32 | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 65.8 | 81,700 BTU/H | 23,946 | 7,167 | 11.40 | 3.34 | 미확인 | Mass Product | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 에어컨/히트펌프 | DS4BD7090FV | R32 | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 90.0 | 108,500 BTU/H | 31,801 | 9,688 | 11.20 | 3.28 | 미확인 | In Progress | [링크](https://www.samsung.com/global/business/compressor/) |
| Samsung | Sc | 히트펌프 | DS2WF7046FV | R290 | 380V | 50/60Hz | 3Φ | Variable (BLDC) | 45.6 | 56,160 BTU/H | 16,461 | 4,800 | 11.70 | 3.43 | 미확인 | In Progress | [링크](https://www.samsung.com/global/business/compressor/) |

### 3-2. 경쟁사 대표 모델 (Samsung 동급 비교용)

| 제조사 | 유형 | 용도 | 모델/시리즈 | 냉매 | 전압 | 주파수 | 상수 | 드라이브 | 변위(cc) | 용량(원본) | Capacity_W | 입력전력(W) | EER | COP | 오일 유형 | 상태 | 소스 URL |
|--------|------|------|------------|------|------|--------|------|---------|---------|----------|-----------|-----------|-----|-----|---------|------|---------|
| GMCC | Ro | 에어컨 (Twin DC) | ATF310D43UMT | R32 | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 30.8 | — | 9,490 | 2,600 | 미확인 | 3.65 | 미확인 | Mass Product | [링크](https://www.gmcc-welling.com/en) |
| GMCC | Ro | 에어컨 (Twin DC) | ATF400D64UMV | R32 | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 39.8 | — | 12,285 | 3,365 | 미확인 | 3.65 | 미확인 | Mass Product | [링크](https://www.gmcc-welling.com/en) |
| Highly | Ro | 에어컨 | SH307MV | R32 | 미확인 | 미확인 | 미확인 | Variable (BLDC) | 30.7 | — | 5,250 | ~1,641 | 미확인 | 3.20 | 미확인 | Mass Product | [링크](https://en.highly.cc) |
| LG | Ro | 에어컨 | UniRotary™ | R454B | 미확인 | 미확인 | 미확인 | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.lg.com/global/business/compressor-motor/) |
| LG | Re | 냉장고 | R1™ Hybrid (Scroll+Rotary) | 미확인 | 미확인 | 미확인 | 미확인 | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 28+ SEER | 미확인 | 미확인 | Mass Product | [링크](https://www.lg.com/global/business/compressor-motor/) |
| Copeland | Sc | HVAC | YH/YHV R454B | R454B | 미확인 | 미확인 | 미확인 | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.copeland.com) |
| Copeland | Sc | 냉동 | ZO/ZOD | R744/CO2 | 미확인 | 미확인 | 미확인 | Fixed/Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.copeland.com) |
| Panasonic | Ro | 에어컨 | 로터리 Fixed (R410A, 151 모델) | R410A | 미확인 | 미확인 | 미확인 | Fixed | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://industrial.panasonic.com/ww/products/motors-compressors/compressors) |
| Panasonic | Sc | 히트펌프 | Scroll Variable R744 | R744/CO2 | 미확인 | 미확인 | 3Φ | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://industrial.panasonic.com/ww/products/motors-compressors/compressors) |
| Embraco | Re | 냉장고/냉동 | X-Generation (NEX/NTX/NIX/VNEX) | R290 | 미확인 | 미확인 | 1Φ | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.embraco.com) |
| Embraco | Re | 냉장고 | R1234yf 시리즈 | R1234yf | 미확인 | 미확인 | 1Φ | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.embraco.com) |
| Danfoss | Re | 상업냉동 | Maneurop MTZ | R134a/R448A/R449A/R454C/R455A | 미확인 | 미확인 | 미확인 | Fixed | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.danfoss.com/en/products/dcs/compressors/) |
| Danfoss | Sc | 대형 HVAC | Turbocor (원심형) | R1234ze/R513A/R515B | 미확인 | 미확인 | 미확인 | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.danfoss.com/en/products/dcs/compressors/) |
| Secop | Re | 냉장고/DC | BD Series | R600a/R134a/R290/R404A | 12/24V DC | 미확인 | 미확인 | Variable (DC) | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.secop.com/products/product-portfolio) |
| Secop | Re | 의료/ULT | ULT 시리즈 | R170 | 미확인 | 미확인 | 미확인 | Fixed | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Mass Product | [링크](https://www.secop.com/products/product-portfolio) |
---

## 4. 냉매 매핑 매트릭스

> Samsung 커버리지 기준: ✅ Mass Product / 🔄 In Progress / ❌ 미확인/없음  
> 트렌드: Growing(성장) / Stable(안정) / Legacy(레거시) / Declining(감소) / Unclear(불명확)  
> GWP: AR6 기준 100년 지구온난화지수

| 냉매 | GWP | Re 가용 | Ro 가용 | Sc 가용 | 주요 용도 | Samsung 커버리지 | 주요 경쟁사 | 트렌드 | 증거 강도 |
|------|-----|---------|---------|---------|----------|----------------|------------|--------|---------|
| R600a | 3 | ✅ (냉장고 LBP/MBP) | ❌ | ❌ | 냉장고 | ✅ Re Mass Product | LG, Embraco, GMCC, Secop, Panasonic | Growing | High |
| R134a | 1,430 | ✅ (냉장고 LBP/HBP) | ✅ (Ro UX 시리즈) | ❌ | 냉장고, 에어컨, EV | ✅ Re, ✅ Ro Mass Product | LG, Embraco, GMCC, Secop, Panasonic, Highly | Stable→Declining | High |
| R290 | 3 | ❌ (웹페이지 미확인) | ❌ (Heat Pump 언급만) | 🔄 In Progress | 냉장고, 에어컨, 히트펌프 | ❌ Re 미확인, 🔄 Sc | LG, Embraco, GMCC, Secop, Panasonic, Highly, Copeland | **Growing** | Medium |
| R22 | 1,810 | ❌ | ✅ (Ro UR 시리즈) | ❌ | 구형 에어컨 | ✅ Ro (교체시장) | LG, GMCC, Panasonic, Highly | **Declining** | High |
| R407C | 1,774 | ❌ | ✅ (Ro UF 시리즈) | ❌ | 구형 에어컨 | ✅ Ro (교체시장) | LG, GMCC, Highly | Declining | High |
| R410A | 2,088 | ❌ | ✅ (Ro UG 시리즈, 5~52,800 BTU/h) | ✅ (Sc, 34,500~90,500 BTU/h) | 에어컨, 히트펌프 | ✅ Ro, ✅ Sc Mass Product | LG, GMCC, Highly, Panasonic, Copeland | **Declining** (→R32/R454B 전환) | High |
| R32 | 675 | ❌ | ✅ (Ro UB 시리즈, 듀얼 R32/R410A) | ✅ (Sc DS4BD, DS4BC, DS4BD7090 In Progress) | 에어컨, 히트펌프 | ✅ Ro, ✅ Sc Mass/In Progress | LG, GMCC, Highly, Panasonic, Copeland, Danfoss | **Growing** | High |
| R454B | ~466 | ❌ | ✅ (Ro Unitary, Mass/In Progress) | ❌ | 미국 Unitary 에어컨 | ✅ Ro (Unitary), ❌ Sc | LG (UniRotary™), Copeland (YH/YHV), Danfoss (DSH), GMCC | **Growing** (AIM Act) | Medium (세부스펙 미확인) |
| R290 (Heat Pump) | 3 | ❌ | 🔄 (Heat Pump 페이지 일부 언급) | 🔄 In Progress | 히트펌프 | 🔄 개발 중 | LG, GMCC, Highly, Embraco | Growing | Low |
| R1234yf | ~1 | ❌ | ❌ | ❌ | 자동차 에어컨, 냉장고 | ❌ 미확인/없음 | Embraco, GMCC, Panasonic, Highly | Growing (EV) | High (Samsung 없음 확인) |
| R744 (CO2) | 1 | ❌ | ❌ | ❌ | 히트펌프, 극저온, 상업냉동 | ❌ 미확인/없음 | Copeland (ZO), GMCC, Panasonic, Danfoss (Turbocor), Highly | **Growing** (히트펌프) | High (Samsung 없음 확인) |
| R454C | ~148 | ❌ | ❌ | ❌ | 상업냉동 (R404A 대체) | ❌ 미확인/없음 | Danfoss (Maneurop), Embraco, Panasonic | Growing | High (Samsung 없음 확인) |
| R1270 | 2 | ❌ | ❌ | ❌ | 자동차/특수 | ❌ 미확인/없음 | GMCC | Unclear | Low |
| R404A | 3,922 | ❌ | ❌ | ❌ | 상업냉동 | ❌ 미확인/없음 | Embraco, Copeland, Danfoss, GMCC | **Declining** | High (Samsung 미진출) |
| R448A | ~1,387 | ❌ | ❌ | ❌ | 상업냉동 (R404A 대체) | ❌ 미확인/없음 | Embraco, Danfoss, GMCC, Panasonic | Stable | High (Samsung 미진출) |
| R449A | ~1,397 | ❌ | ❌ | ❌ | 상업냉동 (R404A 대체) | ❌ 미확인/없음 | Embraco, Danfoss, GMCC, Panasonic | Stable | High (Samsung 미진출) |
| R513A | ~573 | ❌ | ❌ | ❌ | 냉장고, 상업냉동 | ❌ 미확인/없음 | Embraco, GMCC, Panasonic, Highly | Stable | High (Samsung 미진출) |
| R455A | ~148 | ❌ | ❌ | ❌ | 상업냉동 (저GWP) | ❌ 미확인/없음 | Embraco, Danfoss | Growing | Medium |
| R452B | ~698 | ❌ | ❌ | ❌ | 상업냉동 (R404A 대체) | ❌ 미확인/없음 | Embraco, Copeland, Highly | Stable | Medium |
| R170 | 3 | ❌ | ❌ | ❌ | 의료/ULT | ❌ 미확인/없음 | Secop | Unclear | Low |

> 출처: [Samsung](https://www.samsung.com/global/business/compressor/), [LG](https://www.lg.com/global/business/compressor-motor/), [Embraco](https://www.embraco.com), [Danfoss](https://www.danfoss.com/en/products/dcs/compressors/), [Secop](https://www.secop.com/products/product-portfolio), [Copeland](https://www.copeland.com), [GMCC](https://www.gmcc-welling.com/en), [Highly](https://en.highly.cc), [Panasonic](https://industrial.panasonic.com/ww/products/motors-compressors/compressors)

---

## 5. Re / Ro / Sc 비교표

> Samsung 관점에서 각 유형 강점/약점 분석. 경쟁사 포지셔닝 포함.

### 5-1. 압축기 유형별 개요

| 구분 | 왕복동 (Reciprocating, Re) | 로터리 (Rotary, Ro) | 스크롤 (Scroll, Sc) |
|------|--------------------------|-------------------|-------------------|
| **작동 원리** | 피스톤 왕복운동으로 냉매 압축 | 편심 롤러가 실린더 내부 회전하며 압축 | 2개 스크롤(고정+선회)의 상호 맞물림으로 압축 |
| **일반 용량 범위** | 소형 (42~173+ Kcal/Hr) | 소~중형 (5,000~52,800 BTU/h) | 중~대형 (34,500~108,500 BTU/h) |
| **Samsung 주요 용도** | 냉장고 (가전) | 에어컨 (실외기) | 에어컨/히트펌프 (상업용) |
| **Samsung 냉매** | R600a, R134a | R22, R410A, R32, R134a, R407C, R290(HP), R454B | R410A, R32, R290 |
| **Samsung 드라이브** | Fixed Speed (RSIR/RSCR/CSIR/CSR), BLDC Variable | Fixed (AC), Variable (BLDC) | Fixed Speed (1Φ), Variable Speed (3Φ BLDC) |
| **Samsung COP 범위** | 0.76~1.97 (냉장고 특성상 낮음) | 2.96~3.37 | 3.08~3.43 |
| **Samsung EER 범위** | 2.61~6.72 | 10.1~11.5 | 10.6~11.7 |
| **소음·진동** | 상대적으로 높음 (피스톤 왕복) | 낮음 (회전운동) | 매우 낮음 (부드러운 압축) |
| **효율성** | 낮음~중간 (용량 특성상) | 중간~높음 | 높음 (연속 압축) |
| **내구성** | 높음 (단순 구조) | 높음 | 매우 높음 |
| **부품 복잡도** | 낮음 | 중간 | 높음 |
| **카탈로그 최신도** | 2018년 PDF (오래됨) | 2025-02-04 웹 업데이트 | 2025-02-04 웹 업데이트 |

### 5-2. Samsung Re (왕복동) 강점/약점

**강점:**
1. R600a BLDC 모델 보유 (ENV4A5 시리즈, COP 1.97) — 고효율 냉장고용 인버터 압축기 경쟁력
2. 다양한 전압 지원 (100V~240V, 50/60Hz) — 글로벌 냉장고 시장 커버리지
3. 다양한 모터 유형 (RSIR, RSCR, CSIR, CSR, BLDC) — 용도별 최적화
4. 다양한 냉각 방식 (Static, Fan Cooling, Oil Cooling) — 설계 유연성

**약점:**
1. R290 왕복동 미확인 — LG, Embraco, GMCC 대비 환경 규제 대응 지연
2. 카탈로그 2018년 이후 미갱신 — 경쟁사 대비 정보 투명성 낮음
3. R1234yf, R744 미진출 — 냉장고 프리미엄 시장 공백
4. Linear Compressor 기술 없음 — LG 고유 기술 대비 에너지 효율 및 소음 측면 열위
5. 공개 제품 선택 도구(Selector) 없음 — 고객 편의성 낮음

### 5-3. Samsung Ro (로터리) 강점/약점

**강점:**
1. 용량 범위 5,000~52,800 BTU/h — 소형 룸에어컨에서 상업용 에어컨까지 커버
2. R32/R410A 듀얼 냉매 지원 모델 (UB 시리즈) — 시장 전환기 유연성 극대화
3. R454B Unitary 대응 진행 중 — 미국 AIM Act 규제 대응
4. Variable Speed BLDC 모델군 (UG9CM5072F: COP 3.37, UG9T115FUA: COP 3.31)
5. R290 Heat Pump 언급 — 자연 냉매 히트펌프 방향성 보유

**약점:**
1. R32 전용 로터리 모델 세부 스펙 미공개 (UB 시리즈 일부)
2. R454B 로터리 세부 모델 스펙 미확인 (웹페이지 선택 도구 없음)
3. R744/CO2, R1234yf 로터리 없음 — GMCC, Highly, Panasonic 대비 공백
4. GMCC 대비 연간 생산 규모 열위 (GMCC 5억개/년 vs Samsung 미확인)
5. UniRotary™(LG) 같은 특수 기술 플랫폼 부재

### 5-4. Samsung Sc (스크롤) 강점/약점

**강점:**
1. 대용량 라인업 보유 (최대 108,500 BTU/h, R32 DS4BD7090FV 개발 중)
2. R290 스크롤 개발 중 (DS2WF7046FV, COP 3.43 — 동급 R410A 대비 최고 효율)
3. R32 스크롤 Variable Speed 양산 확대 (DS4BD7046FV, DS4BC7066FV Mass Product)
4. 3Φ 380V BLDC 인버터 지원 — 상업용 에어컨 적합
5. R410A~R32 점진적 전환 전략 가시화

**약점:**
1. R454B 스크롤 없음 — Copeland, Danfoss, LG, GMCC 대비 공백 (미국 상업용 시장 진입 제한)
2. Fixed Speed 스크롤은 1Φ 208-230V만 확인 — 글로벌 시장 전압 다양성 제한
3. 상업냉동용 냉매(R404A, R448A, R449A 등) 스크롤 없음 — Copeland, Embraco 대비 상업냉동 미진출
4. R744/CO2 스크롤 없음 — Copeland ZO/ZOD, Panasonic 대비 공백
5. 2018년 PDF 카탈로그로 인한 공개 스펙 데이터 한계

---

## 6. 제조사 벤치마크 테이블

> Samsung을 기준점(Baseline)으로 설정. 증거 강도: High(공식 카탈로그)/Medium(웹페이지)/Low(간접 언급)

| 제조사 | Re 강도 | Ro 강도 | Sc 강도 | 주요 냉매 | 주요 용도 | 주요 모델 패밀리 | 전략 방향 | 증거 강도 |
|--------|---------|---------|---------|---------|---------|---------------|---------|---------|
| **Samsung (기준)** | 중간 (R600a BLDC 보유, R290 미진출, 카탈로그 오래됨) | **강함** (R32/R410A 듀얼, R454B 진행, 5~52,800 BTU/h) | 중간 (R290/R32 개발 중, R454B 공백) | R600a, R134a, R410A, R32, R454B | 냉장고, 에어컨, 히트펌프 | ENV(BLDC), UG/UB(Ro), DS(Sc) | R32 전환, R454B 로터리, R290 스크롤 | Medium |
| **LG** | **매우 강함** (R290 포함, Linear 독자 기술, 2025 카탈로그) | **강함** (UniRotary™ R454B, 전냉매 지원) | **강함** (R454B, 다냉매 지원) | R600a, R134a, R290, R32, R410A, R454B | 냉장고, 에어컨, 히트펌프 | Linear, UniRotary™, R1™ Hybrid | 저GWP 전환 가속, 하이브리드 기술 | High |
| **Embraco (Nidec GA)** | **매우 강함** (Re 전문, R290/R1234yf/다냉매, 2026 카탈로그, 선택도구) | ❌ 없음 | 중간 (HVAC&R 스크롤, 다냉매) | R134a, R600a, R290, R1234yf, R404A, R448A/R449A | 냉장고, 상업냉동 | X-Generation (NEX/NTX/NIX/VNEX) | Re 전문화, 자연냉매(R290, R1234yf) 선도 | High |
| **Danfoss + Secop** | 중간 (Maneurop: 상업냉동 전문, Secop: 소형/DC/의료 특화) | ❌ 없음 | **강함** (DSH R454B, Turbocor 원심형 — 대형 고효율) | R134a, R448A/R449A, R454B, R454C, R1234ze, R600a, R290 | 상업냉동, 대형HVAC, 냉장고, 의료 | Maneurop MTZ/NTZ, DSH, Turbocor, Secop BD | 저GWP 전환, 대형 고효율 원심형 | High |
| **Copeland (Emerson)** | ❌ 없음 (Re 없음) | ❌ 없음 (Ro 없음) | **매우 강함** (Sc 주력, R410A→R454B/R32, R744, 2024 카탈로그, 선택도구) | R410A, R32, R454B, R452B, R404A, R744/CO2, R290 | HVAC, 상업냉동 | ZP, YP/YPV, YH/YHV, ZB/ZF, ZO/ZOD | Sc 독보적 포지션, 저GWP+CO2 선도 | High |
| **GMCC (Midea)** | 중간 (냉장고용, 다냉매) | **매우 강함** (연5억개, 가장 넓은 냉매 포트폴리오, R744 포함) | 중간 (상업용, R454B/R32/R290) | R32, R410A, R744, R1234yf, R290, R454B, 전냉매 | 에어컨, 냉장고, 히트펌프 | AT 시리즈(Twin DC), 스크롤 | 규모의 경제, 냉매 다변화, CO2 히트펌프 | High |
| **Highly (Shanghai Highly)** | 낮음 (소수) | 중간 (R454B/C 포함, 2024 카탈로그) | 중간 (EV 스크롤 특화) | R22, R32, R410A, R454B/C, R744, R1234yf | 에어컨, 전기차 EV | SH 시리즈(Ro), ETS/ETH(EV Sc) | EV 압축기 차별화, 저GWP 로터리 | Medium |
| **Panasonic** | 중간 (R290 왕복동, R1234yf 보유) | **강함** (423모델, CO2 인버터, R454C) | 중간 (Variable 7모델, CO2 스크롤) | R410A, R134a, R32, R290, R1234yf, R454C, R744 | 에어컨, 냉장고, 히트펌프 | 로터리 Fixed/Variable, Scroll Variable | CO2 히트펌프, R1234yf 다변화 | High |

> 출처: [Samsung](https://www.samsung.com/global/business/compressor/), [LG](https://www.lg.com/global/business/compressor-motor/), [Embraco](https://www.embraco.com), [Danfoss](https://www.danfoss.com/en/products/dcs/compressors/), [Copeland](https://www.copeland.com), [GMCC](https://www.gmcc-welling.com/en), [Highly](https://en.highly.cc), [Panasonic](https://industrial.panasonic.com/ww/products/motors-compressors/compressors)

### 6-1. Samsung 포지셔닝 요약

Samsung은 로터리(Ro) 부문에서 경쟁력 있는 포지션을 보유하고 있으며, 특히 **R32/R410A 듀얼 냉매 지원**과 **R454B Unitary 대응** 측면에서 주요 경쟁사와 유사한 전략을 취하고 있다. 그러나 다음 세 가지 구조적 공백이 확인된다:

1. **Re(왕복동) 부문:** LG, Embraco 대비 R290, R1234yf 미진출로 냉장고 규제 대응 지연 위험
2. **Sc(스크롤) 부문:** Copeland, Danfoss, LG 대비 R454B 스크롤 없음으로 미국 상업용 시장 대응 공백
3. **R744/CO2 전체:** Copeland, GMCC, Panasonic 대비 CO2 압축기 없음으로 히트펌프·상업냉동 고성장 세그먼트 미진입

Samsung의 강점은 **인버터(BLDC) 기술 성숙도**와 **R32 스크롤 대용량 개발** 방향성이며, 이를 R454B 스크롤 및 R290 왕복동으로 확장하는 것이 전략적 우선순위로 판단된다 ([Samsung 공식 사이트](https://www.samsung.com/global/business/compressor/)).
---

## 7. 냉매 전환 분석

> Samsung 관점에서 냉매 전환 현황 및 전략적 시사점 분석. 출처: [Samsung](https://www.samsung.com/global/business/compressor/), [LG](https://www.lg.com/global/business/compressor-motor/), [Embraco](https://www.embraco.com), [GMCC](https://www.gmcc-welling.com/en), [Copeland](https://www.copeland.com), [Danfoss](https://www.danfoss.com/en/products/dcs/compressors/)

### 7-1. R600a / R134a → R290 전환 (냉장고 왕복동, Re)

**현황 분석:**

| 전환 경로 | Samsung 현황 | 경쟁사 현황 | 전환 압력 |
|----------|-------------|------------|---------|
| R134a → R290 (Re 냉장고) | ❌ Re 페이지 R290 미확인 | LG: ✅ 2025 카탈로그 포함 / Embraco: ✅ NEX/NTX/NIX/VNEX X-Gen / GMCC: ✅ 2024 카탈로그 / Secop: ✅ SCE/SC 시리즈 | EU F-Gas Regulation, 인도 규제 |
| R600a → R290 (Re 냉장고) | ✅ R600a Mass Product (GWP 3) | R600a 자체가 저GWP — R290과 유사 환경성, 직접 전환 압력 낮음 | 낮음 (R600a는 이미 저GWP) |

**Samsung 관점 전략 권고:**
- **단기 (2026-2027):** R290 왕복동 냉장고용 압축기 개발 로드맵 확인 및 공식 발표 필요. LG, Embraco가 이미 양산 중인 시장에서 Samsung의 부재는 EU/인도 냉장고 시장에서 고객 이탈 위험을 내포한다 ([LG](https://www.lg.com/global/business/compressor-motor/), [Embraco](https://www.embraco.com)).
- **중기 (2027-2029):** R1234yf 왕복동 개발 검토. EV 냉장 시스템 및 프리미엄 냉장고 시장 진입을 위해 필요하나, 현재 완전 미진출 상태이다.
- **레거시 관리:** R134a Re는 HBP(고압) 용도로 일정 기간 유지 불가피하나 장기 단종 계획 수립 권장.

### 7-2. R32 / R454B 전환 (HVAC 로터리/스크롤)

**현황 분석:**

| 전환 경로 | Samsung Ro 현황 | Samsung Sc 현황 | 주요 드라이버 |
|----------|---------------|---------------|------------|
| R410A → R32 (Ro) | ✅ UB 시리즈 듀얼(R32/R410A) Mass Product | ✅ DS4BD/DS4BC 시리즈 Mass Product | EU F-Gas, 중국 14차 5개년 계획 |
| R410A → R454B (Ro, Unitary) | ✅ Unitary Mass Product/In Progress | ❌ 스크롤 R454B 없음 | 미국 AIM Act (2025~) |
| R410A → R454B (Sc) | 해당 없음 | ❌ 미확인/없음 — **전략적 공백** | 미국 상업용 에어컨 규제 |
| R32 → 대형 R32 Sc | 해당 없음 | 🔄 DS4BD7090FV (90cc, In Progress) | 효율 향상 |

**R454B 전환의 의미:**
R454B는 GWP ~466으로 R410A(GWP 2,088) 대비 약 78% 감소하며, 미국 AIM Act에 의해 2025년부터 Unitary AC에 R454B 또는 R32로의 전환이 요구되고 있다. 현재 Samsung은 로터리 Unitary 부문에서만 R454B를 대응하고 있으나, 스크롤 기반 상업용 패키지 에어컨 시장에서의 R454B 공백은 Copeland([https://www.copeland.com](https://www.copeland.com)), Danfoss([https://www.danfoss.com/en/products/dcs/compressors/](https://www.danfoss.com/en/products/dcs/compressors/)), LG([https://www.lg.com/global/business/compressor-motor/](https://www.lg.com/global/business/compressor-motor/)) 대비 경쟁 열위로 작용할 수 있다.

**Samsung 관점 전략 권고:**
- **즉시 우선순위:** R454B 스크롤 개발 착수. Copeland YH/YHV, Danfoss DSH가 이미 양산 중인 시장에서 Samsung의 부재는 미국 상업용 에어컨 OEM 고객 이탈 직접 위험이다.
- **R32 스크롤 완성:** DS4BD7090FV(90cc) In Progress → Mass Product 전환 가속화로 대형 R32 시장 선점.
- **듀얼 냉매 로터리 전략 유지:** UB 시리즈(R32/R410A 듀얼)는 전환기 고객의 설비 호환성을 최대화하는 차별화 포인트로 적극 마케팅.

### 7-3. R744/CO2 적용 경계

**현황 분석:**

R744(CO2, GWP=1)는 자연 냉매 중 가장 높은 작동 압력(최대 130bar 이상)을 요구하여 일반 압축기 설계와 근본적으로 다른 접근이 필요하다.

| 적용 세그먼트 | Samsung 현황 | 주요 경쟁사 | 삼성 진입 가능성 |
|------------|-------------|------------|--------------|
| 상업냉동 (슈퍼마켓) | ❌ 없음 | Copeland ZO/ZOD, Danfoss Turbocor | 낮음 (설계 난이도, 시장 특성 다름) |
| 히트펌프 수온기 (Ro) | ❌ 없음 | GMCC R744 CO2 히트펌프 | 중간 (히트펌프 시장 성장, 기술 투자 필요) |
| 히트펌프 (Sc) | ❌ 없음 | Panasonic Scroll R744, Copeland | 중간 |
| EV 에어컨 (Sc) | ❌ 없음 | Highly ETS/ETH (R134a/R1234yf) | 낮음~중간 (R1234yf EV 스크롤 필요) |

**Samsung 관점 전략 권고:**
- R744/CO2 압축기는 단기(2026-2028) 내 Samsung 포트폴리오 편입이 어려운 영역으로 판단. 투자 우선순위는 R454B 스크롤 및 R290 왕복동에 집중 권장.
- 히트펌프 수온기(Water Heater) 시장이 빠르게 성장하는 경우, GMCC의 R744 CO2 히트펌프 로터리를 모니터링하여 Samsung의 중장기 로드맵 결정에 활용.
- EV 에어컨 스크롤(R1234yf)은 Highly의 ETS/ETH 시리즈([https://en.highly.cc](https://en.highly.cc)) 벤치마킹을 통해 별도 기회 평가 권장.

### 7-4. Samsung 관점 전환 전략 종합 권고

| 우선순위 | 전환 경로 | 현황 | 권고 | 시급성 |
|---------|---------|------|------|------|
| **P1** | R410A → R454B (Sc 스크롤) | ❌ 없음 | 즉시 개발 착수 | 매우 높음 (AIM Act 적용 중) |
| **P2** | R134a → R290 (Re 왕복동) | ❌ 미확인 | 개발 로드맵 확인 및 가속 | 높음 (EU/인도 규제) |
| **P3** | R32 Sc 대용량 완성 | 🔄 90cc In Progress | In Progress → Mass Product 가속 | 중간 |
| **P4** | R290 Sc | 🔄 45.6cc In Progress | 양산 가속 (COP 3.43 차별화) | 중간 |
| **P5** | R1234yf Re (냉장고) | ❌ 없음 | 중기 개발 검토 | 낮음~중간 |
| **P6** | R744/CO2 (히트펌프 Ro) | ❌ 없음 | 장기 모니터링 | 낮음 (단기 투자 불필요) |

---

## 8. Engineering Insights

> Samsung 압축기 포트폴리오의 엔지니어링 관점 분석. C&M 대시보드 활용 가이드 포함.

### 8-1. 냉매별 압력 레벨 함의

| 냉매 | 대표 작동 압력 (고압/저압) | Samsung 보유 | 설계 함의 |
|------|----------------------|------------|---------|
| R600a | 저압 (~8/~1 bar) | ✅ Re | 경량 셸 가능, 습기 민감도 낮음 |
| R134a | 중압 (~16/~2 bar) | ✅ Re, Ro | 표준 설계, 범용 모터 사용 가능 |
| R22 | 중압 (~18/~2 bar) | ✅ Ro | 레거시 대응, 신규 설계 불필요 |
| R407C | 중압 (~18/~2 bar) | ✅ Ro | R22 교체용, 혼합냉매 특성 주의 |
| R410A | 고압 (~28/~5 bar) | ✅ Ro, Sc | 고강도 셸 필요, 표준화된 오일(POE) |
| R32 | 고압 (~28/~5 bar, R410A 유사) | ✅ Ro, Sc | R410A 대비 단일 성분 → 오일 호환성 간소화, 가연성 A2L 주의 |
| R454B | 고압 (~28/~5 bar, R410A 유사) | ✅ Ro, ❌ Sc | A2L 가연성 안전 설계 필수 (HFO+HFC 혼합) |
| R290 | 중압 (~14/~2 bar) | 🔄 Sc | **A3 고가연성** — 안전 설계, 충진량 최소화 (< 150g 권장), 방폭 부품 |
| R744/CO2 | 초고압 (~130/~60 bar) | ❌ 없음 | 완전히 다른 압축기 플랫폼 필요 |
| R1234yf | 저~중압 (~11/~1.5 bar) | ❌ 없음 | A2L 가연성, 자동차용 특수 요구사항 |

**Samsung 관점 시사점:** R32와 R454B는 R410A와 유사한 작동 압력을 공유하므로, 기존 R410A 로터리/스크롤 플랫폼의 적응(Adaptation) 비용이 낮다. 이것이 Samsung의 R32/R454B 전환 전략을 지지하는 핵심 엔지니어링 근거이다 ([Samsung 공식 사이트](https://www.samsung.com/global/business/compressor/)).

### 8-2. 모터/인버터 설계 함의

| 드라이브 유형 | Samsung 적용 | COP/EER 효과 | 설계 주의사항 |
|------------|------------|------------|------------|
| RSIR (Resistance Start Induction Run) | Re R134a (CD 시리즈) | 낮음 (COP ~0.76) | 단상 소형, 기동 저항기 열 손실 |
| RSCR (Resistance Start Capacitor Run) | Re R134a (MSA 시리즈) | 중간 (COP ~1.45~1.49) | RSIR 개선형, 커패시터 추가 |
| CSIR/CSR | Re R134a | RSCR 유사 | 커패시터 기동/운전, 비교적 효율적 |
| BLDC (Variable Speed) | Re R600a (ENV 시리즈), Ro UG/UB, Sc DS FV | 높음 (COP 1.97~3.43) | 인버터 드라이브 필요, 전자 제어 복잡도 증가 |
| AC Fixed (단상) | Ro UG9C 시리즈 | 중간 (COP ~2.96) | 단순 제어, 글로벌 전압 호환 설계 필요 |
| AC Fixed (3Φ) | Sc DS4GN 시리즈 | 중간~높음 (COP 3.08~3.11) | 3상 전원 필요, 상업용 적합 |

**BLDC 전환 효율 이점 정량화 (Samsung 데이터 기준):**
- Re 냉장고: Fixed (CD124K COP 0.76) → BLDC (ENV4A5 COP 1.97) = **+159% COP 향상**
- Ro 에어컨: Fixed AC (UG9C050HS COP 2.96) → BLDC Variable (UG9CM5072F COP 3.37) = **+13.9% COP 향상**

이 데이터는 에너지 효율 규제 강화 환경에서 BLDC 전환 우선순위를 지지하는 내부 근거로 활용 가능하다 ([Samsung 공식 사이트](https://www.samsung.com/global/business/compressor/)).

### 8-3. 오일 호환성

| 냉매 | 권장 오일 유형 | LG 확인 오일 | Samsung 오일 |
|------|------------|------------|------------|
| R600a | Mineral Oil (MO) 또는 Alkylbenzene (AB) | 미확인 | 미확인 |
| R134a | POE (Polyolester) | 미확인 | 미확인 |
| R22 | Mineral Oil (MO) 또는 AB | 미확인 | 미확인 |
| R410A | POE | 미확인 | 미확인 |
| R32 | POE | LG: FVC68D (PVE), FW68D (PVE) | 미확인 |
| R454B | POE | 미확인 | 미확인 |
| R290 | POE 또는 Mineral Oil | 미확인 | 미확인 |

**Samsung 관점 시사점:** LG는 R32 로터리에 PVE(FVC68D, FW68D) 오일을 명시하고 있는 반면([LG 공식 사이트](https://www.lg.com/global/business/compressor-motor/)), Samsung 카탈로그에서는 오일 유형이 미확인이다. Samsung 압축기의 오일 사양 공개는 OEM 고객의 설비 선택 및 유지보수 측면에서 필요한 정보이며, 카탈로그 현행화 시 반드시 포함 권장.

### 8-4. 밸브 손실 / 누설 고려사항

- **왕복동(Re):** 흡입/토출 밸브 리드(Reed Valve) 구조에서 밸브 플랩 마모 및 냉매 역류(Back-flow) 손실이 효율에 직접 영향. 특히 고속 운전(BLDC 고RPM) 시 밸브 반응속도가 COP에 영향.
- **로터리(Ro):** 롤러-베인(Blade) 간격 누설이 핵심 손실 경로. 저온(-10°C 이하) 조건에서 오일 점도 증가로 마찰 손실 증가 우려.
- **스크롤(Sc):** 스크롤 팁(Tip) 씰(Seal)의 누설이 주 손실 경로. Variable Speed 운전 시 저속 부하에서 누설 비율 증가 — Samsung DS FV 시리즈의 최소 운전속도 명세 확인 필요.

**Samsung ENV4A5 시리즈 참고:** 1650RPM 정격에서 148W(냉각용량) / 75W(입력) = COP 1.97. 이 RPM은 BLDC의 중간 속도로, 실제 가변 범위(1,000~3,500RPM 추정)에서의 COP 변화 데이터는 미확인이다.

### 8-5. 소음·진동 함의

| 압축기 유형 | 소음 수준 | Samsung 적용 특이사항 |
|----------|---------|-------------------|
| Re (RSIR/RSCR) | 상대적으로 높음 (40~50 dB(A) 추정) | 냉각 방식(Static/Fan/Oil)에 따라 상이 |
| Re (BLDC) | 중간 (가변속으로 저소음 가능) | 1650RPM에서 최적화, RPM 가변 시 소음 변화 |
| Ro Fixed | 낮음 (회전운동) | 편심 불균형(Unbalance) 설계가 관건 |
| Ro Variable (BLDC) | 매우 낮음 (최적 RPM 범위) | 저속 운전 시 맥동음(Pulsation) 발생 가능 |
| Sc Fixed | 낮음 | 스크롤 맞물림 소음이 주요 인자 |
| Sc Variable (BLDC) | 매우 낮음 | 3Φ 380V BLDC의 경우 전자기 소음 관리 필요 |

### 8-6. COP/EER 비교 주의사항

EER(Energy Efficiency Ratio)과 COP(Coefficient of Performance)는 단위계가 다르며, 테스트 조건(ASHRAE, ISO, JIS 등)에 따라 직접 비교가 불가하다.

**단위 관계:**
- EER = 냉방용량(BTU/h) / 입력전력(W)
- COP = 냉방용량(W) / 입력전력(W) = EER / 3.412

**테스트 조건 차이:**
- Samsung Re: ASHRAE LBP(−23.3°C), MBP(−6.7°C), HBP(+7.2°C) 증발온도 기준
- Samsung Ro: 조건 미명시 (카탈로그에서 부분 확인)
- Samsung Sc: 미확인

**경쟁사 간 비교 시 주의사항:**
- GMCC ATF310D43UMT(R32, COP 3.65)와 Samsung UG9CM5072F(R410A, COP 3.37)를 직접 비교하면 GMCC가 우위이나, 냉매(R32 vs R410A), 냉각 용량 크기, 테스트 조건이 다름.
- **올바른 비교:** 동일 냉매, 동일 테스트 조건, 유사 용량 범위로만 비교 가능.

### 8-7. C&M 대시보드 유용한 컬럼 (Samsung 기준)

Samsung 압축기 포트폴리오 관리를 위한 C&M(Competitive & Market Intelligence) 대시보드 권장 컬럼:

| 컬럼명 | 데이터 예시 | 용도 |
|--------|----------|------|
| Manufacturer | Samsung, LG, Embraco... | 제조사 식별 |
| CompressorType | Re, Ro, Sc | 유형 필터 |
| ModelID | ENV4A5DL2B, UG9CM5072F... | 모델 고유 식별 |
| Refrigerant | R600a, R32, R410A... | 냉매 필터 |
| GWP | 3, 675, 2088... | 환경 규제 대응 모니터링 |
| Application | 냉장고, Unitary AC, 히트펌프... | 용도 세그먼트 |
| Drive | Fixed, BLDC, DC | 드라이브 기술 분류 |
| Displacement_cc | 15.31, 7.3, 45.6... | 용량 정렬 |
| Capacity_W | 148, 2154, 15241... | 용량 비교 (SI 단위 통일) |
| InputPower_W | 75, 639, 4602... | 입력전력 비교 |
| COP | 1.97, 3.37, 3.43... | 효율 벤치마크 핵심 지표 |
| EER | 6.72, 11.5, 11.7... | 효율 벤치마크 (BTU/W) |
| Status | Mass Product, In Progress, Legacy | 개발 단계 추적 |
| OilType | POE, PVE, MO... | 유지보수 호환성 |
| Voltage | 115V, 220V, 380V... | 시장 적용 가능성 |
| Frequency | 50Hz, 60Hz, 50/60Hz | 글로벌 시장 적용 |
| Phase | 1Φ, 3Φ | 전원 공급 유형 |
| CatalogYear | 2018, 2024, 2026... | 데이터 신선도 모니터링 |
| SourceURL | https://... | 원본 데이터 추적 |
| ConfidenceLevel | High, Medium, Low | 데이터 신뢰도 추적 |
| SamsungGap | ✅ 대응, 🔄 개발중, ❌ 없음 | Samsung 공백 시각화 |

---

## 9. QA 및 데이터 검증

> 수집된 스펙 데이터의 계산 일치 여부 검증. 변환식: 1 BTU/h = 0.29307 W  
> EER 역산 = Capacity(BTU/h) / Input(W), COP 역산 = Capacity(W) / Input(W)  
> 플래그 기준: 카탈로그 값과 역산값의 차이 ±5% 초과

### 9-1. 검증 방법론

- `Capacity_W = Capacity(BTU/h) × 0.29307107`
- `EER_역산 = Capacity(BTU/h) / Input(W)`
- `COP_역산 = Capacity(W) / Input(W)`
- 소스: [Samsung 공식 제품 페이지](https://www.samsung.com/global/business/compressor/)

### 9-2. QA 검증 테이블 (Samsung 27개 + 경쟁사 4개)

| 제조사 | 모델 | 냉매 | 유형 | 용량(BTU/h) | Capacity_W | 입력(W) | 카탈로그EER | 역산EER | EER편차 | EER판정 | 카탈로그COP | 역산COP | COP편차 | COP판정 |
|--------|------|------|------|------------|------------|---------|------------|--------|---------|---------|------------|--------|---------|---------|
| Samsung | CD124K-S1ZA | R134a | Re-Fixed | 167 | 48.9 | 64 | 2.61 | 2.61 | 0.0% | ✅ | 0.76 | 0.76 | 0.0% | ✅ |
| Samsung | CD130K-S1ZA | R134a | Re-Fixed | 230 | 67.4 | 79 | 2.91 | 2.91 | 0.0% | ✅ | 0.85 | 0.85 | 0.0% | ✅ |
| Samsung | MSA143K-S1B | R134a | Re-Fixed | 381 | 111.7 | 77 | 4.95 | 4.95 | 0.0% | ✅ | 1.45 | 1.45 | 0.0% | ✅ |
| Samsung | MSA170K-S1G | R134a | Re-Fixed | 687 | 201.3 | 135 | 5.09 | 5.09 | 0.0% | ✅ | 1.49 | 1.49 | 0.0% | ✅ |
| Samsung | ENV4A5DL2B@1650rpm | R600a | Re-BLDC | 504 | 147.7 | 75 | 6.72 | 6.72 | 0.0% | ✅ | 1.97 | 1.97 | 0.0% | ✅ |
| Samsung | ENV4A5DL2B@2800rpm | R600a | Re-BLDC | 834 | 244.4 | 130 | 6.41 | 6.42 | 0.2% | ✅ | 1.88 | 1.88 | 0.0% | ✅ |
| Samsung | ENV4A3G-L2J@1650rpm | R600a | Re-BLDC | 441 | 129.2 | 68 | 6.48 | 6.49 | 0.2% | ✅ | 1.9 | 1.9 | 0.0% | ✅ |
| Samsung | ENV4A3G-L2J@2800rpm | R600a | Re-BLDC | 730 | 213.9 | 120 | 6.09 | 6.08 | -0.2% | ✅ | 1.78 | 1.78 | 0.0% | ✅ |
| Samsung | UG9C050HS | R410A | Ro-Fixed | 5000 | 1465.4 | 495 | 10.1 | 10.1 | 0.0% | ✅ | 2.96 | 2.96 | 0.0% | ✅ |
| Samsung | UG9C052HS | R410A | Ro-Fixed | 5200 | 1524.0 | 515 | 10.1 | 10.1 | 0.0% | ✅ | 2.96 | 2.96 | 0.0% | ✅ |
| Samsung | UG9C060IS | R410A | Ro-Fixed | 6000 | 1758.4 | 600 | 10.0 | 10.0 | 0.0% | ✅ | 2.93 | 2.93 | 0.0% | ✅ |
| Samsung | UG9C067IS | R410A | Ro-Fixed | 6750 | 1978.2 | 660 | 10.2 | 10.23 | 0.3% | ✅ | 3.0 | 3.0 | 0.0% | ✅ |
| Samsung | UG9C076IS | R410A | Ro-Fixed | 7600 | 2227.3 | 750 | 10.1 | 10.13 | 0.3% | ✅ | 2.97 | 2.97 | 0.0% | ✅ |
| Samsung | UG9CM5072F | R410A | Ro-BLDC | 7350 | 2154.1 | 639 | 11.5 | 11.5 | 0.0% | ✅ | 3.37 | 3.37 | 0.0% | ✅ |
| Samsung | UG9AJ1090F | R410A | Ro-BLDC | 9200 | 2696.3 | 852 | 10.8 | 10.8 | 0.0% | ✅ | 3.17 | 3.16 | -0.3% | ✅ |
| Samsung | UG9T115FUA | R410A | Ro-BLDC | 11800 | 3458.2 | 1054 | 11.2 | 11.2 | 0.0% | ✅ | 3.31 | 3.28 | -0.9% | ✅ |
| Samsung | UG5TM5520F | R410A | Ro-BLDC | 52700 | 15444.8 | 4705 | 11.2 | 11.2 | 0.0% | ✅ | 3.28 | 3.28 | 0.0% | ✅ |
| Samsung | UG5TK1450F | R410A | Ro-BLDC | 45500 | 13334.7 | 4099 | 11.1 | 11.1 | 0.0% | ✅ | 3.25 | 3.25 | 0.0% | ✅ |
| Samsung | DS4GN5033INA | R410A | Sc-Fixed | 34500 | 10111.0 | 3250 | 10.6 | 10.62 | 0.2% | ✅ | 3.08 | 3.11 | 1.0% | ✅ |
| Samsung | DS4GN5038INA | R410A | Sc-Fixed | 40500 | 11869.4 | 3780 | 10.7 | 10.71 | 0.1% | ✅ | 3.11 | 3.14 | 1.0% | ✅ |
| Samsung | DS2GR7046FV | R410A | Sc-Var | 52000 | 15239.7 | 4602 | 11.3 | 11.3 | 0.0% | ✅ | 3.31 | 3.31 | 0.0% | ✅ |
| Samsung | DS4GM5052FV | R410A | Sc-Var | 60500 | 17730.8 | 5403 | 11.2 | 11.2 | 0.0% | ✅ | 3.28 | 3.28 | 0.0% | ✅ |
| Samsung | DS4GR7066FV | R410A | Sc-Var | 75400 | 22097.6 | 6670 | 11.3 | 11.3 | 0.0% | ✅ | 3.31 | 3.31 | 0.0% | ✅ |
| Samsung | DS4GR5080FV | R410A | Sc-Var | 90500 | 26522.9 | 8080 | 11.2 | 11.2 | 0.0% | ✅ | 3.28 | 3.28 | 0.0% | ✅ |
| Samsung | DS4BD7046FV | R32 | Sc-Var | 55900 | 16382.7 | 4950 | 11.3 | 11.29 | -0.1% | ✅ | 3.31 | 3.31 | 0.0% | ✅ |
| Samsung | DS4BC7066FV | R32 | Sc-Var | 81700 | 23943.9 | 7167 | 11.4 | 11.4 | 0.0% | ✅ | 3.34 | 3.34 | 0.0% | ✅ |
| Samsung | DS2WF7046FV | R290 | Sc-Var | 56160 | 16458.9 | 4800 | 11.7 | 11.7 | 0.0% | ✅ | 3.43 | 3.43 | 0.0% | ✅ |
| LG | GSG045MJ | R410A | Ro-BLDC | 4705 | 1378.9 | 402 | 11.7 | 11.7 | 0.0% | ✅ | 3.4 | 3.43 | 0.9% | ✅ |
| LG | GVS295QM | R410A | Ro-Fixed | 30100 | 8821.4 | 2951 | 10.2 | 10.2 | 0.0% | ✅ | 3.0 | 2.99 | -0.3% | ✅ |
| GMCC | ATF310D43UMT | R32 | Ro-BLDC | 32380 | 9489.6 | 2600 | N/A | 12.45 | 미확인 | - | 3.65 | 3.65 | 0.0% | ✅ |
| GMCC | ASN68N1UDZ | R410A | Ro-Fixed | 7029 | 2060.0 | 676 | N/A | 10.4 | 미확인 | - | 3.05 | 3.05 | 0.0% | ✅ |

### 9-3. QA 결과 요약

| 항목 | 결과 |
|------|------|
| 검증 대상 모델 수 | 31개 (Samsung 27, LG 2, GMCC 2) |
| ⚠️ 이슈 발생 (±5% 초과) | **0건** |
| 최대 EER 오차 | 0.3% (UG9C067IS, UG9C076IS) |
| 최대 COP 오차 | 1.0% (DS4GN5033INA, DS4GN5038INA) |
| 데이터 발명 여부 | **없음** — 모든 값 공식 소스에서 직접 추출 |
| GMCC EER 미확인 | ATF310D43UMT, ASN68N1UDZ (공식 카탈로그에 EER 미기재) |

> ✅ 전체 검증 모델에서 ±5% 초과 이슈 없음. Samsung 공식 웹페이지 데이터 신뢰도 높음.

## 10. Missing Data (데이터 공백 목록)

> Samsung 기준으로 우선 나열. 경쟁사 공백은 후순위. 공백은 후속 리서치 우선순위 설정에 활용.  
> 출처: [Samsung](https://www.samsung.com/global/business/compressor/)

### 10-1. Samsung 공백 — 냉매 미확인/없음

| 냉매 | Samsung 유형 | 공백 상세 | 경쟁사 현황 | 우선순위 |
|------|------------|---------|------------|--------|
| R290 | Re (왕복동) | Refrigerator 페이지에서 R290 왕복동 완전 미확인. Heat Pump 페이지 일부 언급만 존재 | LG✅, Embraco✅, GMCC✅, Secop✅ | **P1 긴급** |
| R454B | Sc (스크롤) | 로터리 Unitary에만 있고, 스크롤에는 없음. 웹페이지 명시 없음 | Copeland✅, Danfoss✅, LG✅, GMCC✅ | **P1 긴급** |
| R1234yf | Re/Ro/Sc 전체 | Samsung 전 제품에서 완전 미확인 | Embraco✅, GMCC✅, Panasonic✅, Highly✅ | P2 |
| R744/CO2 | Re/Ro/Sc 전체 | Samsung 전 제품에서 완전 미확인 | Copeland✅, GMCC✅, Panasonic✅, Danfoss✅ | P3 |
| R454C | Re/Ro/Sc 전체 | 완전 미확인 | Danfoss✅, Embraco✅, Panasonic✅ | P3 |
| R404A | Re/Ro/Sc 전체 | 상업냉동 미진출 확인 | Embraco✅, Copeland✅, Danfoss✅, GMCC✅ | 낮음 |
| R448A/R449A | Re/Ro/Sc 전체 | 상업냉동 미진출 확인 | Embraco✅, Danfoss✅, GMCC✅ | 낮음 |
| R290 | Ro (로터리) | Heat Pump 페이지에 일부 언급만, 세부 스펙·모델 미확인 | LG✅, GMCC✅ | P2 |

### 10-2. Samsung 공백 — 카탈로그 미발견/날짜 불명확

| 구분 | 상세 | 영향 |
|------|------|------|
| 최신 PDF 카탈로그 | 2018년 이후 공개 PDF 카탈로그 미발견. 웹페이지는 2025-02-04 업데이트이나 모든 모델 스펙이 웹에 표시되지 않을 수 있음 | OEM 고객 설계 참고 자료 신뢰도 저하 |
| 왕복동 최신 모델 | 웹 업데이트는 있으나 2018 이후 신규 Re 시리즈 공식 발표 내용 불명확 | Samsung Re 신제품 파악 불가 |
| 로터리 R454B 세부 모델 | "Mass Product" 또는 "In Progress" 표시만 있고 모델 번호/스펙 미확인 | 벤치마크 불가 |
| 스크롤 Fixed Speed 전체 | DS4GN 시리즈 2개 모델만 확인, 전체 라인업 미파악 | 스크롤 포트폴리오 불완전 파악 |

### 10-3. Samsung 공백 — 모델 스펙 미명시

| 모델/시리즈 | 누락 데이터 | 중요도 |
|----------|----------|-------|
| UB 시리즈 (R32/R410A 듀얼, 모든 모델) | 입력전력, EER, 변위(일부) — COP 범위만 확인 | 높음 |
| R454B Unitary Ro 전체 | 모델 번호, 변위, 용량, EER, COP, 전압 | 높음 |
| Re 전체 시리즈 | 오일 유형 미명시 | 중간 |
| Ro 전체 시리즈 | 오일 유형 미명시, 테스트 조건 미명시 | 중간 |
| Sc FV 시리즈 | 오일 유형 미명시, 운전속도 범위(RPM) 미확인 | 중간 |
| ENV4A5 시리즈 | RPM 가변 범위, 실제 냉각용량(BTU/h 원본) 미확인 | 낮음 |
| CD/SD/MD/SK/MK/HK/MKV/MSV/NC/NF/NN 시리즈 | 대부분의 세부 스펙 (변위, COP, EER) 미확인 | 중간 |

### 10-4. Samsung 공백 — 용량 범위 누락

| 유형 | 확인된 용량 범위 | 미확인 구간 | 영향 |
|------|--------------|----------|------|
| Re (왕복동) | 42~173 Kcal/Hr (일부 모델만) | 전체 Re 용량 범위 상한 미확인 | 포트폴리오 전략 수립 어려움 |
| Ro (로터리) | 5,000~52,800 BTU/h (R410A 기준) | R32 전용 Ro 용량 상한 미확인 | R32 시장 커버리지 파악 불가 |
| Sc (스크롤) Fixed Speed | 34,500~40,500 BTU/h (2모델만) | 40,500 BTU/h 초과 Fixed Speed 또는 소형 모델 | 스크롤 고정속도 시장 전체 파악 불가 |

### 10-5. Samsung 공백 — 효율/기술 데이터 누락

| 데이터 | 상세 | 영향 |
|------|------|------|
| 가변속 운전 범위 (RPM) | BLDC Variable Speed 모델의 최소/최대 RPM 미확인 | 부분 부하 성능 평가 불가 |
| 부분 부하 효율 (IPLV/NPLV) | 스크롤/로터리 인버터 모델의 계절 효율 데이터 없음 | SEER/HSPF 비교 불가 |
| 소음 데이터 (dB(A)) | 전 모델 소음 수준 미명시 | 정숙성 비교 불가 |
| 중량/외형 치수 | 카탈로그 미제공 (일부) | 설비 설계 참고 어려움 |
| 오일 충진량 | 전 모델 미확인 | 유지보수 계획 수립 불가 |

### 10-6. Samsung 공백 — 상태 불명확 (Mass Product vs In Progress)

| 모델/시리즈 | 표시 상태 | 불명확 사항 |
|----------|---------|----------|
| R454B Ro (Unitary) 일부 | Mass Product 및 In Progress 혼재 | 어떤 모델이 양산이고 어떤 것이 개발중인지 불명확 |
| R32 Sc DS4BD7090FV | In Progress | 양산 예정 시기 불명확 |
| R290 Sc DS2WF7046FV | In Progress | 양산 예정 시기, 안전 인증(UL, CE 등) 현황 불명확 |
| R32 Sc (일부 모델) | Mass Product/In Progress 혼재 | 혼재 표시 모델의 실제 공급 가능 여부 |

### 10-7. 경쟁사 공백 (Samsung 대비 참고용)

| 경쟁사 | 공백 |
|-------|------|
| LG | R744/CO2 미확인, 세부 EER/COP 스펙 수집 필요 |
| Embraco | 왕복동 전용 (Ro 없음), R744 없음, 구체적 EER/COP 데이터 미수집 |
| Danfoss/Secop | Ro 없음, 왕복동 Secop 상세 스펙 미수집 |
| Copeland | Re/Ro 없음, LXE 플랫폼 상세 스펙 미수집 |
| GMCC | 상세 모델별 EER/전압/주파수 데이터 대부분 미수집 (대표 2모델만) |
| Highly | 대부분 상세 스펙 미수집 (대표 1모델만) |
| Panasonic | 423개 Fixed Ro 모델 중 대표 스펙 미수집 |

---

## 11. Final Recommendations

> Samsung 관점 후속 액션 플랜. 구체적이고 실행 가능한 사항으로 구성.

### 11-1. 다운로드 및 아카이브할 카탈로그 목록

경쟁사 카탈로그를 즉시 다운로드하여 로컬 아카이브에 저장할 것을 권장한다. Samsung 2018년 카탈로그는 기준 문서로 아카이브하고, 갱신 시 버전 관리 필요.

| 우선순위 | 제조사 | 카탈로그 | URL | 연도 | 목적 |
|---------|-------|---------|-----|------|------|
| P1 | LG | Reciprocating 2025 | [링크](https://www.lg.com/global/business/compressor-motor/) | 2025 | R290 Re 벤치마크 |
| P1 | LG | Rotary 2024 + UniRotary™ | [링크](https://www.lg.com/global/business/compressor-motor/) | 2024 | R454B Ro 벤치마크 |
| P1 | Copeland | General Catalogue 2024 | [링크](https://www.copeland.com) | 2024 | R454B/R744 Sc 벤치마크 |
| P1 | Danfoss | Scroll DSH/DSF 2025-2026 | [링크](https://www.danfoss.com/en/products/dcs/compressors/) | 2025-2026 | R454B Sc 벤치마크 |
| P2 | GMCC | Rotary 2026 | [링크](https://www.gmcc-welling.com/en) | 2026 | R32/R744 Ro 효율 벤치마크 |
| P2 | GMCC | Scroll 2025 | [링크](https://www.gmcc-welling.com/en) | 2025 | R454B/R32 Sc 벤치마크 |
| P2 | Embraco | Asia Pacific 2025 + NAR 2024 | [링크](https://www.embraco.com) | 2025/2024 | R290/R1234yf Re 벤치마크 |
| P2 | Panasonic | General 2025-2026 | [링크](https://industrial.panasonic.com/ww/products/motors-compressors/compressors) | 2025-2026 | R1234yf/R454C Ro 포트폴리오 |
| P3 | Secop | 제품 포트폴리오 2026.03 | [링크](https://www.secop.com/products/product-portfolio) | 2026.03 | R290/R170 특수 Re |
| P3 | Highly | Rotary Catalogue 2024 | [링크](https://en.highly.cc) | 2024 | R454B/C 로터리, EV 스크롤 |
| P3 | Samsung | 내부 최신 카탈로그 | [링크](https://www.samsung.com/global/business/compressor/) | 2018+ | 자사 기준 문서 확인 |

### 11-2. 모니터링해야 할 경쟁사 및 이유

| 경쟁사 | 모니터링 이유 | 모니터링 항목 | 주기 |
|-------|------------|------------|------|
| **LG** | R290 Re 선제 진출, UniRotary™ R454B, R1™ Hybrid 기술 — Samsung의 직접 경쟁사 | 신규 R290/R454B 모델 출시, EER/COP 개선, 카탈로그 업데이트 | 분기 |
| **Copeland** | R454B/R744 Sc 시장 선도 — Samsung Sc R454B 공백의 직접 위협 | R454B 스크롤 신모델, 가격 정책, Copeland Select 업데이트 | 분기 |
| **GMCC** | 세계 최대 Ro 제조사, R744 CO2 히트펌프 로터리 양산 중 — Samsung 규모 대비 효율 비교 | R744 CO2 로터리 확산, R32/R454B 스크롤 가격 | 반기 |
| **Embraco (Nidec GA)** | R290/R1234yf Re 최선두 — Samsung Re 공백의 직접 위협, X-Generation 시리즈 | X-Generation R290 신모델, R1234yf 채택 고객 동향 | 반기 |
| **Panasonic** | CO2 스크롤/로터리 인버터 보유, R1234yf 보유 — Samsung 미진출 냉매 트렌드 선행 지표 | CO2 인버터 Ro 확산, R1234yf 채택 범위 | 반기 |
| **Danfoss** | Turbocor 원심형(R1234ze) 대형 HVAC — Samsung 미진출 영역이나 고객 에코시스템 영향 | Turbocor 확산, R454B DSH 채택률 | 연간 |

### 11-3. 벤치마크할 냉매-압축기 조합

Samsung 관점에서 직접적인 경쟁 데이터 수집이 필요한 조합:

| 벤치마크 조합 | Samsung 현황 | 대상 경쟁사 | 핵심 지표 |
|------------|------------|------------|---------|
| R290 + Re (냉장고) | ❌ 없음 | LG, Embraco NEX/NTX, GMCC | COP, 충진량(g), 안전 인증 |
| R454B + Sc (HVAC) | ❌ 없음 | Copeland YH/YHV, Danfoss DSH, LG, GMCC | COP, EER, 용량 범위 |
| R32 + Sc Variable (대형) | 🔄 90cc In Progress | LG, Copeland YP/YPV | COP 3.28 vs 경쟁사 동급 비교 |
| R32 + Ro Variable | ✅ UB 시리즈 | GMCC AT 시리즈(COP 3.65), Highly SH307MV(COP 3.20) | 동일 테스트 조건 COP/EER 비교 |
| R410A + Ro Variable | ✅ UG 시리즈 (COP 3.37) | Panasonic, LG, GMCC | 5,000~52,800 BTU/h 구간별 COP 비교 |
| R290 + Sc Variable | 🔄 DS2WF7046FV (COP 3.43) | Copeland R290 스크롤, LG | COP/EER, 안전 인증, 용량 범위 |
| R1234yf + Re | ❌ 없음 | Embraco, GMCC | 냉장고 효율 비교, 규제 대응 현황 |

### 11-4. C&M 대시보드 저장 컬럼 (최종 확정)

섹션 8-7의 권장 컬럼 외 추가 권장 컬럼:

| 컬럼명 | 데이터 타입 | 비고 |
|--------|----------|------|
| BenchmarkVsSamsung | 텍스트 (우위/동등/열위) | 경쟁사 모델과 Samsung 동급 모델 비교 결과 |
| RegulatoryFlag | 텍스트 (AIM Act, EU F-Gas, India Schedule...) | 해당 냉매의 규제 리스크 표시 |
| TransitionPath | 텍스트 (R410A→R32, R134a→R290...) | 전환 경로 명시 |
| DataGapFlag | Boolean (TRUE/FALSE) | 주요 스펙 미확인 여부 |
| NextReviewDate | 날짜 | 업데이트 필요 시점 |
| InternalPriority | 정수 (1~5) | Samsung 내부 우선순위 |

**최종 C&M 대시보드 컬럼 순서 (권장):**

```
Manufacturer | CompressorType | ModelID | Refrigerant | GWP | Application | 
Drive | Displacement_cc | Capacity_W | InputPower_W | COP | EER | 
Voltage | Frequency | Phase | OilType | Status | CatalogYear | 
BenchmarkVsSamsung | RegulatoryFlag | TransitionPath | SamsungGap | 
DataGapFlag | SourceURL | ConfidenceLevel | NextReviewDate | InternalPriority
```

### 11-5. Obsidian 노트 구조 제안

Obsidian Vault에서 압축기 리서치를 관리하기 위한 폴더 및 노트 구조:

```
📁 Compressor Research/
├── 📄 000 Index (압축기 리서치 허브 노트)
│   ├── [[제조사 벤치마크 테이블]]
│   ├── [[냉매 매핑 매트릭스]]
│   └── [[냉매 전환 로드맵]]
│
├── 📁 Manufacturers/
│   ├── 📄 Samsung (당사) ← 이 리포트의 핵심
│   │   ├── [[Samsung Re 왕복동]]
│   │   ├── [[Samsung Ro 로터리]]
│   │   └── [[Samsung Sc 스크롤]]
│   ├── 📄 LG
│   ├── 📄 Embraco (Nidec GA)
│   ├── 📄 Danfoss + Secop
│   ├── 📄 Copeland (Emerson)
│   ├── 📄 GMCC (Midea)
│   ├── 📄 Highly (Shanghai Highly)
│   └── 📄 Panasonic
│
├── 📁 Refrigerants/
│   ├── 📄 R290 (저GWP 전환 핵심)
│   ├── 📄 R32 (HVAC 주류)
│   ├── 📄 R454B (AIM Act 대응)
│   ├── 📄 R744-CO2 (히트펌프)
│   └── 📄 R1234yf (EV/냉장고)
│
├── 📁 Models/
│   └── 📄 (모델별 1페이지 노트, 태그: #samsung #lg #r32...)
│
├── 📁 QA/
│   └── 📄 QA 검증 결과 2026-06-17
│
└── 📁 Missing Data/
    └── 📄 공백 목록 및 후속 액션
```

**권장 태그 체계:**
- `#압축기유형`: #re #ro #sc #linear #turbocor
- `#냉매`: #r290 #r32 #r454b #r410a #r600a #r744 #r1234yf
- `#드라이브`: #bldc #fixed #variable #dc
- `#상태`: #mass-product #in-progress #legacy
- `#규제`: #aim-act #eu-fgas #india-schedule
- `#제조사`: #samsung #lg #embraco #copeland #danfoss #gmcc #highly #panasonic

### 11-6. 후속 검색 쿼리 목록

Samsung 압축기 리서치 심화를 위한 구체적 검색 쿼리:

**Samsung 자사 데이터 보완:**
1. `"Samsung compressor" "R454B" scroll site:samsung.com`
2. `"Samsung compressor" "R290" reciprocating catalog 2024 OR 2025`
3. `"Samsung compressor" catalog 2023 OR 2024 OR 2025 filetype:pdf`
4. `Samsung DA91 OR DA96 compressor refrigerator R290`
5. `Samsung Electronics compressor division annual report 2024 2025`

**경쟁사 R454B 스크롤 벤치마크:**
6. `Copeland "YH" OR "YHV" R454B scroll compressor specifications EER COP`
7. `Danfoss "DSH" R454B scroll compressor datasheet 2025`
8. `LG scroll compressor R454B specifications catalog`
9. `GMCC scroll R454B compressor specifications 2025`

**냉매 전환 트렌드:**
10. `R290 reciprocating compressor 2025 refrigerator market adoption`
11. `AIM Act 2025 R454B compressor supply chain update`
12. `R32 scroll compressor 90kW 2025 market`
13. `R744 CO2 heat pump compressor rotary market 2025 2026`

**효율 기준 데이터:**
14. `ASHRAE 90.1 2022 compressor efficiency standards R32 R454B`
15. `EU Ecodesign 2025 2026 compressor COP minimum standards`
16. `China GB 19577 compressor efficiency 2024 R32`

**선택 도구 및 기술 데이터:**
17. `Embraco product selector R290 compressor specifications tool`
18. `Secop Toolkit download 2026 compressor selection`
19. `Coolselector2 Danfoss update 2025 2026`
20. `GMCC AT series R32 twin rotary compressor COP specifications`

---

## 부록: Samsung 압축기 시리즈 코드 해석표

> Samsung 모델 번호 체계 참조표 (수집 데이터 기반 추정)

| 접두사 | 유형 | 냉매 추정 | 드라이브 |
|--------|------|---------|---------|
| CD | Re (왕복동) | R134a | Fixed |
| SD | Re | R134a | Fixed |
| MD | Re | R134a | Fixed |
| MSS/MSA/MSE | Re | R134a | Fixed (RSCR/CSIR) |
| SK/MK/HK | Re | R134a | Fixed |
| MKV/MSV | Re | R134a | Variable |
| ENV | Re | R600a/R134a | BLDC Variable |
| NC/NF/NN | Re | 미확인 | 미확인 |
| UG | Ro (로터리) | R410A | Fixed/Variable |
| UB | Ro | R32/R410A (듀얼) | Variable |
| UR | Ro | R22 | Fixed |
| UX | Ro | R134a | Fixed/Variable |
| UF | Ro | R407C | Fixed |
| DS4GN/DS4GM | Sc (스크롤) | R410A | Fixed (1Φ) |
| DS2GR/DS4GR/DS4GM FV | Sc | R410A | Variable (3Φ) |
| DS4BD/DS4BC FV | Sc | R32 | Variable (3Φ) |
| DS2WF FV | Sc | R290 | Variable (3Φ) |

> 출처: [Samsung 공식 사이트](https://www.samsung.com/global/business/compressor/) 기반 수집 데이터 분석

---

*리포트 끝. 작성일: 2026-06-17. 다음 리뷰 권장일: 2026-12-17 (6개월 후).*
