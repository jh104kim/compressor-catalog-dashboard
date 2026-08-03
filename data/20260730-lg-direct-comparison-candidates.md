# LG 공식 자료 기반 직접 비교 후보 조사

- 조사일: 2026-07-30
- 상태: `SOURCE_FOUND / NOT_PUBLISHED`
- 목적: 현재 직접 비교 불가 Samsung 모델에 필요한 경쟁사 공식 성능행 확보

## 1. 공식 출처

| ID | 문서 | URL | 활용 |
|---|---|---|---|
| LG-RO-PAGE | LG Variable Speed Rotary | https://www.lg.com/global/business/compressor-motor/compressor/rotary-compressor/variable-speed/ | 냉매·시리즈·용량 범위와 ARI 조건 |
| LG-RO-CAT | LG Rotary Compressor Catalogue | https://www.lg.com/global/images/business/compressor-motor/resource-download/pdf-file/LG_Rotary_Compressor_Catalogue.pdf | R32 모델별 ARI 용량·COP |
| LG-RO-UNI | LG UniRotary Compressor Leaflet | https://www.lg.com/global/images/business/compressor-motor/resource-download/pdf-file/LG_UniRotary_Compressor_Leaflet.pdf | R454B/R32/R410A 2-piston variable 행 |
| LG-RE-PAGE | LG Reciprocating Compressor | https://www.lg.com/global/business/compressor-motor/compressor/reciprocating | 냉매·구동·용량 범위와 ASHRAE 조건 |
| LG-RE-CAT | LG Reciprocating Compressor Catalogue | https://www.lg.com/global/images/business/compressor-motor/resource-download/pdf-file/LG_Reciprocating_Compressor_Catalogue.pdf | R600a variable 모델별 성능 |

## 2. 원문에서 확보한 후보 행

### 2.1 R32 로터리

LG Rotary Catalogue의 Variable Speed R32 표에서 다음 ARI 행을 확인했다.

| LG 모델 | 조건 | 용량 W | COP | 비고 |
|---|---|---:|---:|---|
| DST134MB | ARI | 4,308 | 3.1 | Variable |
| DST156MA | ARI | 5,000 | 3.1 | Variable |
| GJT240MA | ARI | 7,415 | 3.3 | Variable |
| GPT330MA | ARI | 10,317 | 3.3 | Variable |
| GPT442MA | ARI | 13,921 | 3.3 | Variable |

### 2.2 다냉매 UniRotary

LG UniRotary Leaflet는 `R454B / R32 / R410A`, 2-piston variable 구간에
다음 행을 표시한다.

| LG 모델 | 조건 | 용량 W | COP | 확인 상태 |
|---|---|---:|---:|---|
| GJT240MC | ARI @60Hz | 7,443 | 3.20 | 냉매별 모델 소속 시각 검토 필요 |
| GPT442MA | ARI @60Hz | 13,773 | 3.16 | 냉매별 모델 소속 시각 검토 필요 |

한 모델명이 여러 냉매에 공통 표기돼 있으므로 현재 단일 refrigerant 스키마에
바로 넣지 않는다. 냉매별 variant ID 또는 applicability 배열 중 하나를
결정한 뒤 정규화한다.

### 2.3 R600a 왕복동

LG Reciprocating Catalogue의 Variable Speed R600a, ASHRAE
`-23.3 ℃ / 54.4 ℃` 표에서 BSA057 계열은 4,500 RPM 기준 용량 147 W,
COP 1.78을 표시한다.

## 3. Samsung 용량 매칭

차이율은 `|LG 용량 - Samsung 용량| / Samsung 용량 × 100`으로 계산했다.

| Samsung | 냉매 | Samsung W | LG 후보 | LG W | 차이 | 판정 |
|---|---|---:|---|---:|---:|---|
| UB9TK2150F | R32 | 4,689 | DST134MB | 4,308 | 8.1% | 후보 |
| UB8TA8265F | R32 | 8,440 | GJT240MA | 7,415 | 12.1% | 후보 |
| UB8TN8300F | R32 | 9,636 | GPT330MA | 10,317 | 7.1% | 후보 |
| UB5TN5450F | R32 | 13,950 | GPT442MA | 13,921 | 0.2% | 후보 |
| UF8LB3265F | R454B | 7,532 | GJT240MC | 7,443 | 1.2% | 냉매 소속 검토 필요 |
| UF5LB3520F | R454B | 14,712 | GPT442MA | 13,773 | 6.4% | 냉매 소속 검토 필요 |
| UG8TH8265F | R410A | 7,825 | GJT240MC | 7,443 | 4.9% | 냉매 소속 검토 필요 |
| UG5TM5520F | R410A | 15,445 | GPT442MA | 13,773 | 10.8% | 냉매 소속 검토 필요 |
| ENV4A5DL2B | R600a | 148 | BSA057 계열 | 147 | 0.7% | 모델 variant 검토 필요 |

현재 1/27인 직접 비교 가능 Samsung 모델은 위 후보가 모두 승인되면
최대 10/27까지 늘어날 가능성이 있다. 이는 **조사 가설**이며 검토·정규화·
Validator 통과 전에는 UI의 Published 비교 후보로 노출하지 않는다.

## 4. 미확보 공백

- Ro: `UG4T200FUA`, `UG9C050HS`, `UF8LB3360F`, `UF9BL3180F`
- Sc: R32/R410A/R290 Variable ARI와 R454B Variable ARI/Fixed DOE-B
- Re: R134a Fixed ASHRAE-LBP/MBP의 모델별 동일 조건 후보

## 5. Published 반영 전 검토 체크

- [ ] PDF 표에서 냉매 헤더와 모델 행의 소속을 시각 확인
- [ ] 모델 suffix와 전압·주파수 variant를 보존
- [ ] LG의 ARI와 Samsung ARI 정의가 같은지 온도 조건 대조
- [ ] 용량 ±15%, 같은 구동, 같은 지표를 자동 재검증
- [ ] Evidence에 URL·페이지·필드 경로 저장
- [ ] 승인 후 새 Release로만 발행
