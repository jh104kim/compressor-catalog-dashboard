---
type: perplexity-research-raw
created: 2026-06-17
source: perplexity-pro
status: inbox
sensitivity: review-required
topic: "타사 R290 왕복동(Reciprocating) 압축기 벤치마크 — LG/Embraco/GMCC/Secop/Panasonic/Highly"
intended_use:
  - cnm-dashboard
  - work-report
  - compressor-wiki
tags:
  - compressor
  - reciprocating
  - r290
  - benchmark
  - competitor
  - embraco
  - secop
  - gmcc
  - lg
  - panasonic
  - highly
  - use/cnm-dashboard
processed_status: pending
---

# Perplexity Research Raw — 타사 R290 왕복동 압축기 벤치마크

> **조사 배경**: Gap Matrix P1 항목. 당사(Samsung) R290 Re = 미보유/미진출로 고정.  
> 타사 6개사(LG, Embraco, GMCC, Secop, Panasonic, Highly) 기준으로만 벤치마크 구성.  
> 당사 관점: 경쟁사 R290 Re 커버리지와 성능 수준 파악 → 향후 진입 여부 판단 기초 자료.

---

## 1. 원 질문

```
타사 R290 왕복동(Reciprocating) 압축기 벤치마크 조사
- 대상: LG / Embraco / GMCC / Secop / Panasonic / Highly
- 수집 항목: 모델명 / 냉매 / 용량(W) / 입력(W) / COP / 배제량(cc) / 전압 / 측정조건 / 상태 / 출처
- Samsung R290 Re = 미보유로 고정
```

---

## 2. Perplexity 원문

### 2-1. 당사(Samsung) R290 왕복동 현황

| 항목 | 내용 |
|------|------|
| 공식 확인 페이지 | samsung.com/global/business/compressor/ 전 페이지 |
| R290 Re 모델 | **없음 (미진출 확인)** |
| 비고 | Heat Pump 페이지에 R290 Rotary는 있음. Re는 전무. |

---

### 2-2. LG — CMA 시리즈 R290 왕복동

**출처**: [LG Find Compressors](https://www.lg.com/global/business/compressor-motor/find-compressors/) / [LG 2025 Reciprocating Catalogue PDF](https://www.lg.com/content/dam/channelbtb/lgcom/global/images/business/compressor-motor/resource-download/pdf-file/0804_2025_LG_CM_Catalog_Reciprocating%20compressor_preview.pdf)  
**측정 조건**: ASHRAE LBP — Te = -23.3°C / Tc = 54.4°C

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | COP | 전압(V/Hz) | 적용 | 상태 | 출처 구분 |
|--------|------|-----------|--------|-----|-----------|------|------|---------|
| CMA053PJJM | R290 | 5.3 | 203 | 1.28 | 220V/50Hz | LBP냉동 | ✅ 양산 | 공식 |
| CMA062PHJG | R290 | 6.2 | 256 | 1.28 | 220V/50Hz | LBP냉동 | ✅ 양산 | 공식 |
| CMA075PHJM | R290 | 7.5 | 331 | 1.46 | 220V/50Hz | LBP냉동 | ✅ 양산 | 공식 |
| CMA075PHEM | R290 | 7.5 | 335 | 1.50 | 220~240V/50Hz | LBP냉동 | ✅ 양산 | 공식 |
| CMA075PACH | R290 | 7.5 | N/A | N/A | 100V/50~60Hz | — | ⚠️ 파트너포털 | 비공개 |
| LX110PACH | R290 | 11.0 | N/A | N/A | 100V/50~60Hz | — | ⚠️ 파트너포털 | 비공개 |

> **비고**: LG CMA 모델명 체계 — CMA + 배제량×10 + P(R290) + 모터코드.  
> 입력(W) 미기재 — COP로부터 역산 가능.  
> CMA075PACH / LX110PACH는 LG Partner Portal 전용으로 스펙 비공개.

---

### 2-3. Embraco — EM/NEK/NT 시리즈 R290 왕복동

**출처**: [Embraco 공식 제품 페이지](https://www.embraco.com/en/products/) / [Embraco Application Guide 2020](https://www.embraco.com/wp-content/uploads/2023/10/eweb-compressors-072020-en.pdf) / [Fixed-Speed Portfolio Sept 2024](https://www.embraco.com/wp-content/uploads/2024/10/fixed-speed-portfolio-technical-table-sept-2024.pdf)

#### EM 시리즈 (소형 가정용 냉장/냉동, LBP)
**측정 조건**: ASHRAE LBP — Te = -23.3°C / Tc = 54.4°C

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | 입력(W) | COP | 전압/Hz | 적용 | 출처 구분 |
|--------|------|-----------|--------|--------|-----|--------|------|---------|
| EMT2117U | R290 | 4.50 | 208 | ~135 | ~1.54 | 220-240V/50Hz | LBP | 공식 |
| EMT2121U | R290 | 5.20 | 270 | ~165 | ~1.64 | 220-240V/50Hz | LBP | 공식 |
| EMT2125U | R290 | 5.96 | 301 | ~188 | ~1.60 | 220-240V/50Hz | LBP | 공식 |
| EMT2130U | R290 | 6.76 | 340 | 218 | ~1.56 | 220-240V/50Hz | LBP | 공식 |
| EM2X3121U | R290 | 5.54 | 175* | 112 | 1.56 | 220-240V/50Hz | LBP | 공식 |
| EM2X3134U | R290 | 7.96 | 374 | — | ~1.72 | 220-240V/50Hz | LBP | 공식 |

> *EM2X3121U는 EN12900 조건 (Te=-35°C/Tc=40°C) 기준

#### NEK/NEU 시리즈 (중형, LBP/HBP)
**측정 조건**: ASHRAE LBP/HBP

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | COP | 전압/Hz | 적용 |
|--------|------|-----------|--------|-----|--------|------|
| NEK2125U | R290 | 7.28 | 317 | ~1.55 | 220-240V/50Hz | LBP |
| NEK2134U | R290 | 10.00 | 449 | ~1.61 | 220-240V/50Hz | LBP |
| NEK2150U | R290 | 13.54 | 582 | ~1.58 | 220-240V/50Hz | LBP |
| NEU2155U | R290 | 13.54 | 626 | ~1.62 | 220-240V/50Hz | LBP |
| NEK2160U | R290 | 16.80 | 729 | ~1.61 | 220-240V/50Hz | LBP |
| NEU2168U | R290 | 16.80 | 788 | ~1.63 | 220-240V/50Hz | LBP |
| NEU6214U | R290 | 12.11 | 1,645 | ~1.71 | 220-240V/50Hz | HBP |
| NEU6217U | R290 | 14.30 | 1,903 | ~1.73 | 220-240V/50Hz | HBP |

#### NT 시리즈 (대형 상업용)
**측정 조건**: ASHRAE LBP/HBP

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | COP | 전압/Hz | 적용 |
|--------|------|-----------|--------|-----|--------|------|
| NT2160U | R290 | 17.40 | 703 | ~1.60 | 220-240V/50Hz | LBP |
| NT2170U | R290 | 20.40 | 816~830 | ~1.63 | 220-240V/50Hz | LBP |
| NT2180U | R290 | 22.40 | 931 | ~1.63 | 220-240V/50Hz | LBP |
| NT2210U | R290 | 27.80 | 1,186 | ~1.68 | 220-240V/50Hz | LBP |
| NT6220U | R290 | 17.40 | 2,250 | ~1.74 | 220-240V/50Hz | HBP |
| NT6222U | R290 | 20.40 | 2,632 | ~1.75 | 220-240V/50Hz | HBP |
| NT6230U | R290 | 27.80 | 3,620 | ~1.77 | 220-240V/50Hz | HBP |

---

### 2-4. GMCC — R290 왕복동

**출처**: [GMCC 공식 사이트 (gmcc-welling.com)](https://www.gmcc-welling.com/en/product/product-detail/prod-detail?productId=100461) / [areacooling.com 데이터시트](https://areacooling.com)  
**측정 조건**: ASHRAE — LBP: Te=-23.3°C/Tc=54.4°C / MBP: Te=-6.7°C/Tc=54.4°C

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | 입력(W) | COP | 전압/Hz | 적용 | 상태 |
|--------|------|-----------|--------|--------|-----|--------|------|------|
| PA59HMF | R290 | 5.9 | 295(L/MBP) | ~181 | 1.63 | 220-240V/50Hz | L/MBP | 양산 |
| KA59HMB | R290 | 5.9 | 295(L/MBP) | ~174 | 1.70 | 220-240V/50Hz | L/MBP | 양산 |
| PA59HMY | R290 | 5.9 | 300(L/MBP) | ~162 | 1.85 | 220-240V/50Hz | L/MBP | 양산 |
| PA59HMZ (LBP) | R290 | 5.9 | 295 | 164 | **1.80** | 220-240V/50Hz | LBP | 양산 |
| PA59HMZ (MBP) | R290 | 5.9 | 490 | 233 | **2.10** | 220-240V/50Hz | MBP | 양산 |
| PA65HMF | R290 | 6.5 | 355(L/MBP) | ~218 | 1.63 | 220-240V/50Hz | L/MBP | 양산 |
| PA65HMZ | R290 | 6.5 | 350(L/MBP) | ~191 | 1.83 | 220-240V/50Hz | L/MBP | 양산 |
| KA80HMF | R290 | 8.0 | 390(L/MBP) | ~244 | 1.60 | 220-240V/50Hz | L/MBP | 양산 |
| PA80HMZ | R290 | 8.0 | 400(L/MBP) | ~220 | 1.82 | 220-240V/50Hz | L/MBP | 양산 |
| PA90HMZ | R290 | 9.0 | 450(L/MBP) | ~250 | 1.80 | 220-240V/50Hz | L/MBP | 양산 |
| KA99HMB | R290 | 9.9 | 490(L/MBP) | ~288 | 1.70 | 220-240V/50Hz | L/MBP | 양산 |
| PA120QMA | R290 | 12.0 | 545(L/MBP) | ~341 | 1.60 | 220-240V/50Hz | L/MBP | 양산 |
| KA140QHT (MBP) | R290 | 14.0 | 1,100 | 564 | **1.95** | 220-240V/50Hz | MBP | 양산 |
| KA140QMF | R290 | 14.0 | 670(L/MBP) | ~447 | 1.50 | 220-240V/50Hz | L/MBP | 양산 |
| KA180QMF | R290 | 16.0 | 750(L/MBP) | ~500 | 1.50 | 220-240V/50Hz | L/MBP | 양산 |
| KA180QMA | R290 | 18.0 | 930(L/MBP) | ~596 | 1.56 | 220-240V/50Hz | L/MBP | 양산 |
| KA210LMH | R290 | 21.0 | 1,000(L/MBP) | ~690 | 1.45 | 220-240V/50Hz | L/MBP | 양산 |

---

### 2-5. Secop — KL/NL/DL/SC 시리즈 R290 왕복동

**출처**: [Secop 공식 포트폴리오](https://www.secop.com/products/product-portfolio) / [Secop Product Portfolio PDF (Mar 2026)](https://www.secop.com/fileadmin/user_upload/pdf-files/secop_product_portfolio_03-2026_desh000b1002.pdf) / [KLF4.8CNT Datasheet (May 2025)](https://www.secop.com/fileadmin/user_upload/SEPS/datasheets/en/klf48cnt_106h2517_r290_200v_208v_50hz_60hz_05-2025_ds.pdf)

#### KL 시리즈 (소형 상업용)
**측정 조건**: ASHRAE LBP (Te=-23.3°C/Tc=54.4°C) 또는 EN12900

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | 입력(W) | COP/EER | 전압/Hz | 측정조건 |
|--------|------|-----------|--------|--------|--------|--------|---------|
| KLF4.8CNT | R290 | 4.80 | 228.7(LBP) | 196.8 | COP 1.48 | 200-240V/50Hz 또는 208-230V/60Hz | ASHRAE LBP |
| KLF4.8CNT | R290 | 4.80 | 336(MBP) | 200 | COP 1.68 | 200-240V/50Hz | ASHRAE MBP |
| KLF6.6CNH | R290 | 6.60 | ~311(MBP) | — | EER 7.85 | 115-127V/60Hz | EN12900 MBP |
| KLF7.7CND | R290 | 7.70 | ~395(LBP) | — | — | 220-240V/50Hz | ASHRAE LBP |

#### NL/DL 시리즈 (에너지 최적화형)
**측정 조건**: ASHRAE LBP/MBP

| 모델명 | 냉매 | 배제량(cc) | LBP용량(W) | LBP입력(W) | LBP COP | MBP용량(W) | MBP입력(W) | MBP COP |
|--------|------|-----------|----------|----------|--------|----------|----------|--------|
| DLE4CN | R290 | 4.0 | 191 | 129 | 1.48 | 338 | 172 | **1.97** |
| DLE4.8CN | R290 | 4.80 | 242 | 155 | 1.22 | 415 | 210 | **1.98** |
| DLE5.7CN | R290 | 5.70 | 298 | 195 | 1.22 | 507 | 258 | **1.97** |
| DLE6.5CN | R290 | 6.50 | 315 | 206 | 1.53 | 548 | 285 | **1.92** |
| DLE7.5CN | R290 | 7.50 | 366 | 249 | 1.47 | 643 | 336 | **1.91** |
| NLE8.8CN | R290 | 8.80 | 430 | 275 | 1.56 | 751 | 380 | **1.98** |
| NLE10CN | R290 | 10.00 | 486 | 331 | 1.47 | 872 | 462 | **1.89** |
| NLE11CNL | R290 | 11.00 | 540 | 356 | 1.52 | 981 | 488 | **2.01** |
| NLE11MN | R290 | 11.00 | 562 | 375 | 1.50 | 1,060 | 536 | **1.97** |
| NLE12.6CNL | R290 | 12.60 | 611 | 410 | 1.49 | 1,277 | 572 | **2.04** |

#### SC/SCE 시리즈 (대형)

| 모델명 | 냉매 | 배제량(cc) | 용량(W) | 입력(W) | COP | 측정조건 |
|--------|------|-----------|--------|--------|-----|---------|
| SCE18MNX | R290 | 17.69 | 773 | 634 | 1.22 | CECOMAF LBP -25°C/55°C |
| SCE18MNX | R290 | 17.69 | 1,523 | 873 | 1.74 | CECOMAF MBP -10°C/55°C |
| SCE18MNX | R290 | 17.69 | 615 | 476 | 1.29 | EN12900 LBP -35°C/40°C |
| SCE Plus (23cc) | R290 | 23.00 | 881 | 699 | 1.26 | CECOMAF LBP |
| SCE Plus (25cc) | R290 | 25.00 | 1,660 | 992 | 1.67 | CECOMAF MBP |

---

### 2-6. Panasonic — E Series R290 왕복동 인버터

**출처**: [Panasonic Industrial NA — E Series R290](https://na.industrial.panasonic.com/products/hvacr-appliance-devices/compressors/lineup/reciprocating-compressors/series/150227)  
**측정 조건**: ASHRAE LBP (Te=-23.3°C/Tc=54.4°C)  
**특징**: 가정용 냉장고/냉동고 전용 **인버터(Variable Speed)** 왕복동 압축기

| 모델명 | 냉매 | 배제량(cc) | 속도(rps) | 용량(W) | COP | 전압/Hz | 상태 |
|--------|------|-----------|---------|--------|-----|--------|------|
| EEI57T13DMH | R290 | 5.7 | 27 | 133 | — | 220-240V/50Hz | 양산 |
| EEI57T13DMH | R290 | 5.7 | 40 | ~200 | — | 220-240V/50Hz | 양산 |
| EEI57T13DMH | R290 | 5.7 | 52 | ~260 | — | 220-240V/50Hz | 양산 |
| EEI57T13DMH | R290 | 5.7 | 72 | ~360 | — | 220-240V/50Hz | 양산 |
| EEI76T13DMH | R290 | 7.6 | 27 | — | — | 220-240V/50Hz | 양산 |
| EEI76T13DMH | R290 | 7.6 | 40 | — | — | 220-240V/50Hz | 양산 |
| EEI76T13DMH | R290 | 7.6 | 52 | ~288 | — | 220-240V/50Hz | 양산 |
| EEI76T13DMH | R290 | 7.6 | 64 | ~380 | — | 220-240V/50Hz | 양산 |

> **비고**: 인버터 방식으로 속도에 따라 용량 가변. COP/입력 공개 데이터 미확인 — Panasonic 보충 PDF 참조 필요.

---

### 2-7. Highly (Shanghai Highly) — R290 왕복동

**결론: ❌ R290 왕복동 라인업 없음**

**출처**: [Highly 공식 사이트](https://www.highly.com.cn/en/) / [Highly Rotary Catalogue (refricompressor.com)](https://refricompressor.com/wp-content/uploads/2024/09/Highiy-Rotary-Compressor-Catalogue.pdf)

| 확인 사항 | 내용 |
|---------|------|
| 전 제품 라인업 | 회전식(Rotary) 전용 |
| R290 Rotary 라인 | WHP 시리즈 (히트펌프용 DC 인버터) 존재 |
| R290 Re 라인 | **없음** |
| 대안 제조사 | Secop, Embraco, Tecumseh, Cubigel(Huayi) |

---

## 3. Perplexity 출처 링크

### LG
- [LG Find Compressors (R290 필터)](https://www.lg.com/global/business/compressor-motor/find-compressors/)
- [LG 2025 Reciprocating Catalogue PDF](https://www.lg.com/content/dam/channelbtb/lgcom/global/images/business/compressor-motor/resource-download/pdf-file/0804_2025_LG_CM_Catalog_Reciprocating%20compressor_preview.pdf)

### Embraco
- [Embraco 제품 페이지](https://www.embraco.com/en/products/)
- [Embraco Application Guide 2020 (PDF)](https://www.embraco.com/wp-content/uploads/2023/10/eweb-compressors-072020-en.pdf)
- [Embraco Fixed-Speed Portfolio Sept 2024 (PDF)](https://www.embraco.com/wp-content/uploads/2024/10/fixed-speed-portfolio-technical-table-sept-2024.pdf)
- [EMT6144U 데이터시트 (hawco.co.uk)](https://www.hawco.co.uk/refrigeration/service-components/embraco-reciprocating-compressors/4-5cc-hbp-r290-reciprocating-compressor-tube-10-em-emt6144u-csir-ast)

### GMCC
- [GMCC R290 왕복동 제품 페이지](https://www.gmcc-welling.com/en/product/product-detail/prod-detail?productId=100461)
- [PA59HMZ 데이터시트 (areacooling.com)](https://areacooling.com/wp-content/uploads/product-documentation/PA59HMZ%20R290%20Datasheet.pdf)
- [KA140QHT 데이터시트 (areacooling.com)](https://areacooling.com/wp-content/uploads/product-documentation/KA140QHT%20Datasheet.pdf)

### Secop
- [Secop 공식 제품 포트폴리오](https://www.secop.com/products/product-portfolio)
- [Secop Product Portfolio PDF (Mar 2026)](https://www.secop.com/fileadmin/user_upload/pdf-files/secop_product_portfolio_03-2026_desh000b1002.pdf)
- [KLF4.8CNT 데이터시트 (May 2025)](https://www.secop.com/fileadmin/user_upload/SEPS/datasheets/en/klf48cnt_106h2517_r290_200v_208v_50hz_60hz_05-2025_ds.pdf)
- [SCE18MNX 데이터시트 (Nov 2024)](https://www.secop.com/fileadmin/user_upload/SEPS/datasheets/en/sce18mnx_104h8851_r290_220v_50hz_11-2024_ds.pdf)
- [SCE Plus 리플릿 (Feb 2025)](https://www.secop.com/fileadmin/user_upload/technical-literature/leaflets/sce-plus_r290_220v_50hz_compressors_02-2025_desn560e202.pdf)

### Panasonic
- [Panasonic E Series R290 (NA Industrial)](https://na.industrial.panasonic.com/products/hvacr-appliance-devices/compressors/lineup/reciprocating-compressors/series/150227)
- [Panasonic R290 히트펌프 출시 (naturalrefrigerants.com, 2026-04-06)](https://naturalrefrigerants.com/news/panasonic-launches-heating-optimized-air-to-water-r290-heat-pump-range-for-commercial-applications/)

### Highly
- [Highly 공식 사이트](https://www.highly.com.cn/en/)
- [Highly Rotary Catalogue](https://refricompressor.com/wp-content/uploads/2024/09/Highiy-Rotary-Compressor-Catalogue.pdf)

---

## 4. 내가 원하는 활용 방향

- **Gap Matrix P1 보완**: Samsung R290 Re 미보유 확정 + 경쟁사 커버리지 범위 확인
- **CNM 대시보드 컬럼 후보**:
  - `r290_re_coverage` (보유/미보유/비공개)
  - `application_type` (LBP/MBP/HBP)
  - `cop_lbp` / `cop_mbp` (측정조건 구분)
- **경쟁사 R290 Re 커버리지 요약**:

| 제조사 | R290 Re 라인업 | 용량 범위(W) | COP 범위 | 측정조건 | 비고 |
|--------|-------------|-----------|---------|---------|------|
| **Samsung** | ❌ 없음 | — | — | — | 당사 미진출 |
| LG | ✅ CMA 시리즈 | 203~335(LBP) | 1.28~1.50 | ASHRAE LBP | 5개 모델 공개 |
| Embraco | ✅ EM/NEK/NT | 175~3,620 | 1.54~1.77 | ASHRAE/EN12900 | 광범위 라인업 |
| GMCC | ✅ PA/KA 시리즈 | 295~1,100 | 1.45~2.10 | ASHRAE L/MBP | 공식 확인 |
| Secop | ✅ KL/NL/DL/SC | 191~1,660 | 1.22~2.04 | ASHRAE/CECOMAF | Danfoss 계열 |
| Panasonic | ✅ E Series (인버터) | 133~380 | — (미공개) | ASHRAE LBP | 가정용 소형 전용 |
| Highly | ❌ 없음 | — | — | — | Rotary 전용 |

- **업무 리포트 문장 후보**:
  - "당사 R290 왕복동(Re) 압축기는 현재 제품 라인업에 없으며, 주요 경쟁사(Embraco, Secop, GMCC) 대비 해당 세그먼트 공백이 확인됩니다."
  - "Secop NLE 시리즈는 MBP 조건에서 COP 최대 2.04를 기록하며 R290 Re 중 가장 높은 효율을 보입니다."

---

*작성일: 2026-06-17 | 기반: Perplexity Computer — 압축기 벤치마크 리서치*  
*연결 파일: `compressor_deep_research_report.md` Section 11-6 Gap Matrix P1*
