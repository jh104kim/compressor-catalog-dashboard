# 압축기 SSOT 보완 조사 결과 보고서

**작성일:** 2026년 6월 23일  
**목적:** SSOT 미확인 항목 6개 카테고리에 대한 데이터 조사 결과 정리  
**참고:** 아래 자료는 공개 데이터시트·카탈로그 기반이며, 일부 항목은 제조사 직접 문의 또는 CoolSelector²·AHRI 디렉토리 접속 조회 권장

***

## 1. Copeland YHV0382P — oilCharge, noiseDb, maxDischarge

**조사 결과: 핵심 수치 확인 완료 ★★★**

공식 Copeland 데이터시트(YHV\*2P 시리즈) 및 제3자 판매처 사양 페이지를 통해 다음 수치를 확인하였다.[^1][^2]

| 항목 | YHV0182P | YHV0252P | **YHV0382P** |
|---|---|---|---|
| Displacement (cm³) | 18.0 | 25.0 | **38.0** |
| Oil Quantity (L) | 0.7 | 0.7 | **1.2** |
| Sound Pressure @1m (dBA) | 61 | 65 | **64** |
| Heating Capacity Range (kW) | 2.6–10.1 | 3.9–12.4 | **5.4–21.4** |
| COP* @nominal speed 90Hz | 3.0 | 3.1 | **3.2** |
| Suction Stub | 3/4 inch | 3/4 inch | 3/4 inch |
| Discharge Stub | 1/2 inch | 1/2 inch | 1/2 inch |
| Net Weight (kg) | 15 | 16 | **20** |
| Dimensions L×W×H (mm) | 218×198×334 | 218×198×334 | **218×198×384** |

\* 조건: Heating (-7°C/50°C), @nominal speed 90Hz

**oilType 확인:** 인접 모델(YHV072HG)의 동일 계열 데이터시트 기준, 오일 타입은 **Zerol RFL 68EP** (합성 에스터계 POE 계열) 사용이 확인된다. YHV\*2P 계열도 동일 오일 적용 추정이나, 공식 확인을 위해 Copeland CoolSys 포털에서 YHV0382P 단품 데이터시트 직접 열람 권장.[^3]

**maxDischarge(최대 토출온도):** YHV072HG 기준 High Side TS Max = **150°C**로 동일 YHV 계열 공통 규격으로 확인됨. YHV\*2P 시리즈도 동일 사양 적용 예상.[^3]

### SSOT 업데이트 요약 (YHV0382P)
- `oilCharge`: **1.2 L** ✅
- `oilType`: Zerol RFL 68EP (POE계) — 직접 확인 필요
- `noiseDb`: **64 dB(A) @1m** ✅
- `maxDischarge`: **150°C** (YHV계열 공통, 직접 확인 권장) ⚠️

***

## 2. LG UniRotary R454B Fixed Speed (KJA/KVA 계열)

**조사 결과: 직접 공개 데이터 미확보 ★★★ (추가 조치 필요)**

공개된 LG 카탈로그(2020–2025년판, JOAP 배포분 포함)에서는 R410A 기반 GVA/GJT/GPT 계열의 ARI COP 데이터는 확인 가능하나, **R454B를 냉매로 사용하는 KJA/KVA 계열의 단독 ARI COP·cc(배기량)·모델명 상세 스펙은 공개 웹에서 확인 불가**였다.

### 확인된 R410A 유사 계열 (참고용)

JOAP 배포 LG 카탈로그에서 R410A 기반 Unitary 전용 고정속 계열:

| 시리즈 | 모델 | 냉각용량 (Btu/hr) | 입력 (W) | EER | COP | 테스트 조건 |
|---|---|---|---|---|---|---|
| GVA | GVA153KA | 15,150 | 1,546 | 9.8 | 2.9 | ARI |
| GVA | GVA198KA | 19,700 | 1,950 | 10.1 | 3.0 | ARI |
| GVA | GVA236KA | 23,320 | 2,332 | 10.0 | 2.9 | ARI |

> **주의:** 위 모델은 R410A용이며, R454B KJA/KVA와는 계열이 다름. R454B의 경우 냉매 특성(GWP 466, A2L 분류) 차이로 인해 별도 COP/EER 검증이 필요하다.

### 권장 조치
- **LG 컴프레서 공식 사이트** (lg.com/global/business/compressor-motor) → UniRotary R454B 전용 카탈로그 요청
- **LG 한국 OEM 영업 채널** 통해 KJA/KVA, KJT/KPT 기술 사양서 직접 수령 권장
- 인버터 계열(KJT/KPT): 동일 경로로 ARI 조건 COP 및 가변 주파수 범위 확인 필요

***

## 3. LG UniRotary R454B 인버터 (KJT/KPT 계열)

**조사 결과: 공개 데이터 미확보 ★★★**

KJT/KPT 계열 인버터 모델의 R454B 전용 ARI COP 수치는 공개 카탈로그에서 검색되지 않았다. 참고용으로, R410A 기반 인버터 계열(GJT/GPT)의 ARI 조건 데이터는 다음과 같다:

| 시리즈 | 모델 | 자석 | 전원 | 냉각용량 (Btu/hr) | 입력 (W) | EER | COP @ARI | 테스트 조건 |
|---|---|---|---|---|---|---|---|---|
| GJT | GJT240MC | NdFeB | DC 380V | 25,400 | 2,327 | 10.9 | 3.2 | ARI |
| GPT | GPT442MA | NdFeB | — | 47,000 | 4,360 | 10.8 | 3.2 | ARI |

> R410A 인버터(GJT/GPT) COP 약 3.2 (ARI) → R454B KJT/KPT는 냉매 특성 차이로 약간 다를 예상이나, 직접 측정 데이터 필요.

### Samsung UF 시리즈와 직접 비교 가능성
ARI 조건 동일 적용 여부가 확인되면 Samsung UB(COP 3.31) 대비 포지션 판단 가능. **KJT/KPT의 ARI 조건 확인이 핵심 선행 조건**.

***

## 4. GMCC ATF R32 로터리 — 측정 조건 확정

**조사 결과: SEER60 조건 확인 완료 ★★★**

GMCC 공식 카탈로그(Haiding 배포, refricompressor.com 원본) 및 GMCC 자체 카탈로그 데이터를 교차 확인한 결과, ATF 시리즈의 테스트 조건은 명확하게 **SEER60**으로 표기되어 있다.

| 모델 | Displacement (cc/rev) | 냉각용량 (W) | 입력 (W) | COP | 테스트 조건 |
|---|---|---|---|---|---|
| **ATF310D43UMT** | 30.8 | 9,490 | 2,600 | **3.65** | **SEER60** |
| **ATF400D64UMV** | 39.8 | 12,285 | 3,365 | **3.65** | **SEER60** |
| ATQ360D1UMU | 36.3 | 11,200 | 3,040 | 3.68 | SEER60 |
| ATQ420D1UMU | 41.5 | 12,960 | 3,485 | 3.72 | SEER60 |

출처: GMCC 공식 카탈로그 (R410A DC Inverter Twin Cylinder 섹션, Test Condition: SEER60 명시)

### 중요 판단: Samsung UB와 직접 비교 불가

SEER60 조건은 ARI(ASHRAE/T) 조건과 **측정 온도가 다르다**. 구체적으로:

| 테스트 조건 | 응축온도 | 증발온도 | 과냉각 | 과열도 |
|---|---|---|---|---|
| **ARI (ASHRAE/T)** | 54.4°C | 7.2°C | 8.3°C | 27.8°C |
| **SEER60** | 42.3°C | 2.7°C | — | — |

- SEER60은 부분 부하 시즌 효율 조건으로, 응축 온도가 낮아 COP가 높게 측정됨
- Samsung UB(R32, COP 3.31)는 **ARI 조건** 기준
- GMCC ATF310D43UMT(COP 3.65)는 **SEER60 조건** 기준

**결론: 두 값은 측정 조건이 달라 직접 비교 불가 판정.** Samsung UB와의 비교를 위해서는 GMCC ATF 계열의 ARI 조건 별도 측정값이 필요하다. GMCC 카탈로그 내 R32 ARI 조건 라인업(KSN/KSM 계열 등)으로 별도 검색 권장.

***

## 5. R290 스크롤 경쟁사 — Copeland 및 Panasonic

**조사 결과: Copeland 확인 완료 / Panasonic 미확보 ★★**

### 5-1. Copeland R290 고정속 스크롤 (ZH*KCU 계열)

공식 Copeland 브로슈어(DSC167-EN)에서 ZH 시리즈 고정속 라인업 확인:

| 모델 | 변위 (m³/h) | Heating Cap. (kW) | COP (Heating) | 소음 @1m (dBA) | 무게 (kg) |
|---|---|---|---|---|---|
| ZH04KCU | 5.8 | 4.4 | 3.2 | 61 | 23 |
| ZH06KCU | 8.0 | 6.2 | 3.2 | 61 | 27 |
| ZH08KCU | 10.0 | 7.7 | 3.3 | 64 | 28 |
| ZH09KCU | 11.7 | 9.0 | 3.2 | 65 | 38 |
| ZH11KCU | 14.4 | 10.9 | 3.3 | 65 | 38 |
| ZH13KCU | 17.1 | 13.0 | 3.3 | 67 | 40 |
| ZH16KCU | 21.4 | 16.0 | 3.3 | 71 | 40 |

> 조건: Heating kW @ Evap. -7°C / Cond. 50°C / Superheat 10K / Subcooling 4K

### 5-2. Copeland R290 가변속 스크롤 (YHV 계열)

동일 브로슈어에서 YHV 가변속 계열 확인:

| 모델 | 변위 (cm³) | Heating Cap. Min–Max (kW) | COP @nominal | Oil (L) |
|---|---|---|---|---|
| YHV0211U | 21 | 1.4–7.3 | 3.1 | 0.7 |
| YHV0291U | 29 | 1.9–10.0 | 3.1 | 0.7 |
| YHV0461U | 46 | 3.4–15.7 | 3.2 | 1.2 |

> 조건: Heating @nominal speed 90Hz, (-7°C/50°C)

### 당사 Samsung DS4HD5066FVT 대비 포지션

| | Samsung DS4HD5066FVT | Copeland ZH11KCU (Fixed) | Copeland YHV0461U (Var.) |
|---|---|---|---|
| 냉매 | R290 | R290 | R290 |
| COP (ARI) | 3.43 | 3.3 (Heating) | 3.2 (Heating @90Hz) |
| 용량 | 스크롤 (대용량) | 10.9 kW | 3.4–15.7 kW |
| 구분 | 가변속 | 고정속 | 가변속 |

> **주의:** Copeland ZH/YHV 계열 수치는 Heating COP 조건이며, Samsung의 ARI Cooling COP(3.43)와 직접 비교 시 조건 정렬 필요.

### 5-3. Panasonic R290 스크롤

공개 웹 검색에서 Panasonic의 R290 스크롤 압축기 독립 모델의 ARI COP 데이터시트는 확인되지 않았다. Panasonic은 R290을 주로 자사 에어컨/히트펌프 시스템 레벨에서 탑재하며, OEM 단품 판매 카탈로그는 공개 배포가 제한적이다.  
**조치:** Panasonic Appliances Compressor Corporation(PACC) 한국/일본 지사 문의 또는 panasoniccompressor.com 직접 접속 권장.

***

## 6. Danfoss DSH090 / DSH180 — oilType, oilCharge

**조사 결과: DSH090 확인 완료 / DSH180 간접 확인 ★★**

공식 Danfoss 문서(Application Guidelines AB288965961751en-000301)에서 DSH 시리즈 기술 사양 확인:

### Oil Type 확인

Danfoss 공식 오일 타입 개요 문서(AI275663610280en-000301, 2025.03)에 따르면:

| 압축기 계열 | 사용 냉매 | 오일 타입 | 오일 코드 |
|---|---|---|---|
| **DSH** | R410A, R452B, **R454B** | **POE (폴리올에스터)** | **160SZ** |
| PSH | R410A/R454B | POE | 160SZ |
| SH | R410A | POE | 160SZ |

→ **DSH090 및 DSH180 모두 POE 오일(160SZ) 사용 확정**

### Oil Charge 확인

DSH 시리즈 단일 압축기 오일 충전량 (공식 기술 규격표):

| 모델 | 오일 충전량 (dm³ = L) | 무게 (kg) |
|---|---|---|
| **DSH090** | **3.0 L** | 58 kg |
| DSH105 | 3.3 L | 64 kg |
| DSH120 | 3.3 L | 64 kg |
| DSH140 | 3.3 L | 67 kg |
| DSH161 | 3.3 L | 69 kg |
| DSH184 | 3.6 L | 71.5 kg |
| DSH240 | 6.1 L | 114 kg |
| DSH295 | 6.1 L | 117 kg |

> **DSH180 관련:** Danfoss 명칭 체계상 단일(Single) 압축기로서 "DSH180"은 존재하지 않는다. **DSH180E**는 DSH090 × 2조합의 **탠덤(Tandem) 어셈블리** 모델 명칭이다. 단일 압축기 기준 가장 근접한 모델은 **DSH184(3.6 L POE 오일)**이다. DSH090(3.0 L) + DSH090(3.0 L) = 탠덤 합산 6.0 L로 추정 가능.

### SSOT 업데이트 요약
- DSH090: `oilType` = **POE 160SZ** ✅ / `oilCharge` = **3.0 L** ✅
- DSH180(탠덤 DSH180E = DSH090×2): `oilType` = **POE 160SZ** ✅ / `oilCharge` = **6.0 L (추정, 탠덤 합산)** ⚠️
- DSH184(단일): `oilCharge` = **3.6 L** — DSH180 단일 모델 대용으로 참고 가능

***

## 7. Highly 2024 카탈로그 — R454B 로터리 구체 모델

**조사 결과: R454B 전용 모델 공개 데이터 미확인 ★★**

JOAP 배포 Highly 2024 공식 카탈로그 및 Philexi 배포 Highly 카탈로그를 확인한 결과:

- **R290 (ASHRAE/T 조건) 모델**: 모델명·변위·COP 확인 완료 (WHP03300~WHP37600 시리즈, COP 3.35–3.78)
- **R22, R410A, R32 (ASHRAE/T 조건) 모델**: 다수 확인
- **R454B 전용 로터리 Unitary 모델**: 2024년 카탈로그 내 명시적 R454B 항목 **미발견**

단, Hitachi Highly 브로슈어(WHP09100VUK 등)에서는 R454B 호환 인버터 모델(22.6 cc/rev, DC BLDC, R410A/R452B/**R454B/R454C** 적용 가능)이 확인되었다:

| 항목 | 사양 |
|---|---|
| 냉매 | R410A / R452B / **R454B** / R454C |
| 변위 | 22.6 ml/rev |
| 회전수 범위 | 900–7,200 min⁻¹ |
| 모터 | DC/BLDC |

> 이 모델은 Multi-refrigerant 설계로 R454B 사용 가능하나, R454B 단독 ARI COP 수치는 별도 측정 필요.

### 권장 조치
- Highly (Shanghai Electric Co.) 한국 대리점 또는 HVACR 전시회(MOSTRA CONVEGNO, MCE 2025/2026) 통해 R454B 전용 Unitary 카탈로그 요청
- Highly 공식 웹사이트(highly.com.cn) OEM 영업 문의

***

## 종합 현황표

| # | 항목 | 핵심 목적 | 확인 수준 | 비고 |
|---|---|---|---|---|
| 1 | **Copeland YHV0382P** | oilCharge(L), noiseDb, maxDischarge | **✅ 대부분 확인** | oilCharge=1.2L, noise=64dB(A), maxDischarge=150°C(간접) |
| 2 | **LG UniRotary R454B Fixed (KJA/KVA)** | 모델명·cc·ARI COP | **❌ 미확보** | 공개 카탈로그 없음, 직접 문의 필요 |
| 3 | **LG UniRotary R454B Inverter (KJT/KPT)** | 모델명·cc·ARI COP | **❌ 미확보** | 동상 |
| 4 | **GMCC ATF R32 측정조건** | ARI vs SEER60 판정 | **✅ SEER60 확정** | Samsung UB(ARI)와 직접 비교 불가 판정 |
| 5-1 | **Copeland R290 스크롤 (ZH/YHV)** | ARI COP — 비교군 추가 | **✅ 부분 확인** | Heating COP 3.2–3.3 (조건 정렬 필요) |
| 5-2 | **Panasonic R290 스크롤** | ARI COP | **❌ 미확보** | 공개 단품 데이터 없음 |
| 6 | **Danfoss DSH090/DSH180** | oilType, oilCharge(L) | **✅ 대부분 확인** | POE 160SZ, DSH090=3.0L, DSH184=3.6L |
| 7 | **Highly R454B 로터리** | 모델명·cc·ARI COP | **⚠️ 부분 확인** | Multi-ref 모델 존재, R454B 전용 ARI COP 미확보 |

***

## 추가 조치 권장 사항

### 즉시 조회 가능 (온라인)

1. **Copeland CoolSys Portal** (coolselector.danfoss.com) → YHV0382P 단품 선택 → oilType, maxDischarge 직접 확인
2. **AHRI 디렉토리** (ahridirectory.org) → Brand: Samsung → R290 스크롤 모델 SEER2 조회 (SEER2 항목 C)

### 제조사 직접 문의 필요

3. **LG 컴프레서 한국 영업** → UniRotary R454B KJA/KVA/KJT/KPT 전용 기술 사양서 요청
4. **Panasonic Appliances Compressor** → R290 스크롤 OEM 카탈로그 요청
5. **Highly/Shanghai Electric** 한국 대리점 → R454B Unitary 로터리 전용 ARI COP 데이터 요청

### 비교 분석 시 주의사항

- GMCC ATF310D43UMT의 COP 3.65는 **SEER60 조건**이므로, Samsung UB(ARI, COP 3.31)와의 직접 수치 비교는 **비교 불가 판정**
- Copeland ZH/YHV의 Heating COP와 Samsung DS4HD5066FVT의 Cooling COP는 측정 방향이 다르므로 **동일 조건 재측정값 또는 역산 환산 필요**
- Danfoss DSH 시리즈는 R454B 사용 가능함이 공식 오일 타입 문서로 확인되었으나, R454B 전용 성능 표(COP/EER)는 별도 Coolselector²에서 확인 권장

---

## References

1. [Refrigeration compressor YHV0382P-9E9-ED3020A - Elektronika S.A.](https://www.elektronika-sa.com.pl/en/products/refrigeration/compressors/scroll/yhv/YHV0382P-9E9-ED3020A/v/YHV0382P-9E9-ED3020A) - Technical data. Displacement. [m³/h]. 6.90. Oil charge. [l]. 1.18. Internal free volume. [dm³]. 3.2....

2. [Copeland Scroll™ YHV Variable Speed Scroll for A2L Refrigerants](https://manuals.plus/m/5c79b71d377861d9431e3fb92352bae49760652714a0547778bc6a7c5aae7502) - Explore the Copeland Scroll™ YHV series of variable speed scroll compressors, designed for A2L refri...

3. [[PDF] 50 1/s YHV072HG-4X9 R290 Software Version - Alfaco.cz](https://www.alfaco.cz/copeland-1/skrol-kompresory-7/2566/documents/YHV072HG-4X9_R290_data_sheet.pdf)

