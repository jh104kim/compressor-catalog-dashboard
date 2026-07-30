# 비-LG 경쟁사 공식 카탈로그 보완 조사

- 조사일: 2026-07-30
- 대상: Embraco, Secop, Panasonic, GMCC, Highly, Danfoss, Copeland
- 목적: Samsung Re/Ro/Sc와 동일한 `유형 × 냉매 × 측정조건 × 구동`이고 용량 차이가 ±15% 이내인 모델을 우선 확보한다.
- 원칙: 제조사 공식 웹·공식 PDF만 신규 DB 값의 권위 근거로 사용한다. 조건이 다르거나 모델별 수치가 없으면 등록 보류한다.

## 1. 제조사별 결론

| 제조사 | Re | Ro | Sc | 이번 조치 |
|---|---|---|---|---|
| Panasonic | R600a 공식 모델 확인 | R32/R410A/R454B 공식 모델 확인 | Samsung과 같은 조건의 공개 후보 미확보 | 7개 DB 반영 |
| Secop | R134a ASHRAE LBP 공식 모델 확인 | 제품군 없음 | 제품군 없음 | 1개 DB 반영 |
| Danfoss | 이번 범위에서 직접 후보 미확보 | 제품군 없음 | DSH 공식 60Hz ARI 값 확인 | 기존 3개 공식값 정정 |
| Embraco | VEM R134a/R600a 제품군 확인 | 제품군 없음 | 공식 제품군은 있으나 이번 Samsung 직접 후보 미확보 | 모델별 동일조건 수치 확보 전 등록 보류 |
| GMCC | 기존 조사값 유지 | 공식 사이트에 제품군만 공개 | 공식 사이트에 제품군만 공개 | 모델별 공식 표 미확보로 신규 등록 보류 |
| Highly | 이번 범위에서 공식 모델표 미확보 | 공식 사이트에 제품군만 공개 | 이번 범위에서 공식 모델표 미확보 | 모델별 공식 표 미확보로 신규 등록 보류 |
| Copeland | 제품군 없음 | 제품군 없음 | R454B/R290 공식 제품군 확인 | Samsung과 같은 냉방 ARI 모델별 수치 미확보로 신규 등록 보류 |

## 2. DB 반영 모델

### 2.1 Panasonic Re

Panasonic 공식 모델 목록의 ASHRAE 조건은 응축 54.4°C, 증발 -23.3°C다.

| 정규화 모델 | 공식 표기 | 냉매 | 조건 | 구동 | 용량 W | COP | Samsung 직접 후보 |
|---|---|---|---|---|---:|---:|---|
| TKF76E25DCH-52RPS | TKF76E25DCH(52RPS) | R600a | ASHRAE-LBP | Variable | 149 | 2.06 | ENV4A5DL2B, 148 W |

공식 출처:

- https://industrial.panasonic.com/ww/products/pt/reciprocating-compressors-vs/models?page=1
- https://industrial.panasonic.com/sa/products/pt/reciprocating-compressors-vs/models/TKF76E25DCH%2852RPS%29

### 2.2 Panasonic Ro

Panasonic 공식 모델 상세의 `Testing Condition`이 ARI 또는 ARI 57.5Hz인 행만 반영했다.

| 정규화 모델 | 공식 표기 | 냉매 | 용량 W | 입력 W | COP | EER | Samsung 직접 후보 |
|---|---|---|---:|---:|---:|---:|---|
| 9RL160Z | 9RL160Z- | R32 | 4,414 | 1,746 | 2.56 | 8.73 | UB9TK2150F, 4,689 W |
| 5KD184XAA21 | 동일 | R410A | 5,440 | 미공개 | 3.01 | 10.27 | UG4T200FUA, 5,920 W |
| 5KD240XAA21 | 동일 | R410A | 7,280 | 2,400 | 3.03 | 10.35 | UG8TH8265F, 7,825 W |
| 5VD550ZD | 5VD550ZD- | R410A | 17,250 | 5,442 | 3.17 | 10.82 | UG5TM5520F, 15,445 W |
| KRD220Z | KRD220Z- | R454B | 8,070 | 1,900 | 4.25 | 14.49 | UF8LB3265F, 7,532 W |
| KKD420Z | KKD420Z- | R454B | 16,185 | 3,710 | 4.36 | 14.88 | UF5LB3520F, 14,712 W |

공식 출처:

- https://industrial.panasonic.com/ww/products/pt/rotary-compressors-vs/models/9RL160Z-
- https://industrial.panasonic.com/ww/products/pt/rotary-compressors-vs/models/5KD184XAA21
- https://industrial.panasonic.com/ww/products/pt/rotary-compressors-vs/models/5KD240XAA21
- https://industrial.panasonic.com/ww/products/pt/rotary-compressors-vs/models/5VD550ZD-
- https://industrial.panasonic.com/jp/products/pt/rotary-compressors-vs/models/KRD220Z-
- https://industrial.panasonic.com/ww/products/pt/rotary-compressors-vs/models/KKD420Z-

### 2.3 Secop Re

| 모델 | 냉매 | 조건 | 구동 | 배기량 cc | 용량 W | COP | 판정 |
|---|---|---|---|---:|---:|---:|---|
| BD35F | R134a | ASHRAE-LBP | Variable | 2.0 | 50.5 | 1.15 | 공식 유사 모델. Samsung R134a Re는 구동 방식이 달라 직접 비교 불가 |

공식 PDF:

- https://www.secop.com/fileadmin/user_upload/technical-literature/leaflets/bd-nano-series_compressors_03-2025_desn101k502.pdf

시험조건은 증발 -23.3°C, 응축 54.4°C, 최대 속도다.

### 2.4 Danfoss DSH 공식값 정정

기존 DB의 DSH090/184/240은 `Variable` 및 8.9~23.0 kW로 들어 있었으나, Danfoss 공식 자료는 DSH를 `Fixed speed`로 분류한다. 2025.01 Application Guide의 R454B 60Hz ARI 조건으로 교체한다.

| 모델 | 구동 | 배기량 cc | 용량 W | 입력 W | COP | EER |
|---|---|---:|---:|---:|---:|---:|
| DSH090 | Fixed | 88.4 | 26,320 | 8,180 | 3.22 | 10.98 |
| DSH184 | Fixed | 170.3 | 51,267 | 15,360 | 3.34 | 11.39 |
| DSH240 | Fixed | 227.6 | 68,133 | 20,810 | 3.27 | 11.17 |

공식 출처:

- https://assets.danfoss.com/documents/latest/461327/AB288965961751en-001701.pdf
- https://designcenter.danfoss.com/products/p/120H1845

60Hz 시험조건은 증발 7.2°C, 응축 54.4°C, 과열 11.1K, 과냉 8.3K다.

## 3. 등록 보류 근거

- Embraco: 공식 VEM 페이지에서 R134a/R600a, 3~11cc, Variable 제품군은 확인했다. 그러나 Samsung과 같은 조건의 모델별 용량·COP 조합을 이번 공개 경로에서 확정하지 못했다.
  - https://www.embraco.com/en/products/vem-series
- GMCC: 공식 사이트는 가정용·상업용·히트펌프 제품군과 문의 경로를 제공하지만 모델별 시험조건 표가 공개 페이지에 없다.
  - https://www.gmcc-welling.com/en/product
- Highly: 공식 그룹 페이지는 압축기 사업과 제품군을 확인할 수 있으나 모델별 냉매·조건·용량·효율 표를 제공하지 않는다.
  - https://en.highly.cc/compressor.html
- Copeland: 공식 페이지에서 R454B용 YAV와 R290 중심 YHV 제품군을 확인했다. 현재 확보된 공개 수치는 Samsung ARI 냉방과 다른 난방/유럽 조건이라 신규 직접 비교 행은 보류한다.
  - https://www.copeland.com/en-us/products/heating-and-air-conditioning/commercial-scroll-compressors/modulating-compressors/variable-speed-compressors

## 4. 반영 효과

- 모델: 68 → 76
- Samsung: 27 유지
- 경쟁사: 41 → 49
- 직접 비교 가능한 Samsung 모델: 1 → 8
- 새 직접 비교 조합: Re 1개, Ro 6개
- Danfoss DSH는 공식값 정정 후 Samsung Variable Sc와 직접 비교 대상에서 제외한다.

## 5. 카탈로그 업데이트 진행안

1. 월 1회 공식 URL의 변경일·파일 해시를 확인한다.
2. 변경된 소스만 `data/` 조사 문서에 기록하고, 기존값과 필드 단위 차이를 만든다.
3. `유형 × 냉매 × 측정조건 × 구동 × 용량 ±15%`를 통과한 행만 Staging에 넣는다.
4. 공식 근거, 모델 중복, COP/EER 관계, 조건 교차 순위 금지를 자동 검증한다.
5. 승인 후 새 Published Release로 발행하고 Compare Lab E2E를 2회 실행한다.

향후 우선순위는 `Panasonic 공식 목록의 신규/Active 변경 → Embraco Product Selector 모델 export → GMCC/Highly 공식 문의 회신 → Copeland/Danfoss PDF 개정` 순서다.
