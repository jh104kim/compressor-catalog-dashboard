# RPM/RPS 속도 성능맵 공식 원천 확인

- 확인일: 2026-08-03
- 목적: Compare Lab과 정적 Compare Report에 표시할 속도별 성능점을 공식 제조사
  페이지와 동일 시험조건에서 확인한다.
- 안전 원칙: `Hz`는 축 회전속도로 변환하지 않는다. 공개되지 않은 지표는 계산해
  실측값처럼 채우지 않으며, 보간·외삽한 점을 만들지 않는다.

## 1. Samsung ENV4A5DL2B

- 유형/냉매/구동: Re / R600a / BLDC Variable
- 시험조건: ASHRAE-LBP
- 공식 출처:
  https://www.samsung.com/global/business/compressor/recipro-compressor/bldc-r600a-lbp-ac115-127v-60hz/

| RPM | 용량 W | 입력 W | COP | EER |
|---:|---:|---:|---:|---:|
| 1,650 | 148 | 75 | 1.97 | 6.72 |
| 1,950 | 174 | 88 | 1.98 | 6.77 |
| 2,800 | 244 | 130 | 1.88 | 6.41 |
| 3,650 | 315 | 182 | 1.73 | 5.91 |

## 2. Panasonic TKF76E25DCH family

- 유형/냉매/구동: Re / R600a / Variable
- 시험조건: ASHRAE-LBP, 응축 54.4°C / 증발 -23.3°C
- 공식 출처:
  - https://industrial.panasonic.com/ww/products/pt/reciprocating-compressors-vs/models/TKF76E25DCH%2817RPS%29
  - https://industrial.panasonic.com/ww/products/pt/reciprocating-compressors-vs/models/TKF76E25DCH%2827RPS%29
  - https://industrial.panasonic.com/ww/products/pt/reciprocating-compressors-vs/models/TKF76E25DCH%2852RPS%29
  - https://industrial.panasonic.com/ww/products/pt/reciprocating-compressors-vs/models/TKF76E25DCH%2880RPS%29

| RPS | 환산 RPM | 용량 W | COP | 입력 W / EER |
|---:|---:|---:|---:|---|
| 17 | 1,020 | 46 | 2.07 | 미공개 |
| 27 | 1,620 | 76 | 2.17 | 미공개 |
| 52 | 3,120 | 149 | 2.06 | 미공개 |
| 80 | 4,800 | 220 | 1.83 | 미공개 |

## 3. 비교 판정

- 공통 표시 가능 지표: `capacityW`, `cop`.
- 두 계열 모두 다중 공식 속도점이 있고 RPM 범위가 겹치므로 `CURVE_READY`.
- 정확히 같은 RPM의 양쪽 실측점은 없으므로 `rankingAllowed=false`.
- 선은 관측점을 연결하는 시각 보조일 뿐이며 중간 값을 비교·순위에 사용하지 않는다.
- Ro/Sc 직접 비교쌍은 동일 조건의 양쪽 속도점이 확보될 때까지
  `DATA_REQUIRED`로 표시한다.
