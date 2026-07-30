# 직접 비교 공백 리서치 계획

## 1. 현재 기준

활성 Release `release:2026-07-30:005`의 Samsung 27모델 중 현재 데이터로
직접 비교 가능한 모델은 8개다. 기존 Sc 1개에 Panasonic 공식 Re 1개와
Ro 6개가 추가됐다.

| 유형 | Samsung | 직접 비교 가능 | 리서치 대상 |
|---|---:|---:|---:|
| Re | 4 | 1 | 3 |
| Ro | 12 | 6 | 6 |
| Sc | 11 | 1 | 10 |
| 합계 | 27 | 8 | 19 |

Compare Lab은 이 상태를 숨기지 않는다.

- Samsung 선택에는 직접 비교 가능한 모델만 노출한다.
- 나머지는 오류가 아니라 `공식 자료 리서치 큐`로 표시한다.
- 큐에는 필요한 냉매·조건·구동·용량 범위·지표를 함께 표시한다.

## 2. 조사 우선순위

| 우선순위 | 조사군 | 목표 |
|---|---|---|
| 완료 | Ro Variable · ARI · R32/R410A/R454B | Panasonic 공식 6모델 반영, Samsung Ro 6모델 직접 비교 가능 |
| 완료 | Re Variable · ASHRAE-LBP · R600a | Panasonic `TKF76E25DCH-52RPS` 반영, `ENV4A5DL2B` 직접 비교 가능 |
| P1 | Sc Fixed · DOE-B · R454B | `DS8LC5049IN` 용량 13,345~18,055 W 경쟁 모델 확보 |
| P1 | Sc Variable · ARI · R454B | `DS2LD5046F` 용량 12,750~17,250 W 경쟁 모델 확보 |
| P2 | Sc Variable · ARI · R32/R410A/R290 | LG·Danfoss·Copeland 공식 성능표 확보 |
| P2 | Re Fixed · ASHRAE-LBP/MBP · R134a | LG·Secop·Embraco 공식 모델별 성능표 확보 |

## 3. Phase별 진행

### Phase R1 — 공식 자료 탐색

제조사 제품 페이지·카탈로그·datasheet만 수집한다. 판매처, 블로그, 검색
요약은 후보 발견에만 쓰고 Published 근거로 사용하지 않는다.

완료기준:

- 모델명, 냉매, 유형, 측정조건, 구동, 용량, COP/EER가 식별된다.
- 원문 URL, 문서명, 페이지, 확인일을 기록한다.

### Phase R2 — 표 시각 검토와 정규화

PDF 표의 행·열을 사람이 다시 확인한 뒤 Staging 후보로 정규화한다.
한 모델 번호가 여러 냉매에 함께 표기되면 냉매별 variant ID 정책을 먼저
결정한다.

완료기준:

- OCR 열 밀림과 냉매 소속을 원문 표로 대조한다.
- 용량 단위와 측정조건을 임의 환산하지 않는다.
- 각 후보는 `SOURCE_FOUND`, `NEEDS_REVIEW`, `REJECTED` 중 하나다.

### Phase R3 — 직접 비교 Gate

다음 조건을 모두 만족할 때만 비교 후보로 승인한다.

1. 유형·냉매·측정조건·구동이 동일하다.
2. 경쟁 모델 용량이 Samsung 기준 ±15%다.
3. 같은 COP 또는 EER 원값이 있다.
4. 공식 1차 출처와 페이지가 연결된다.

완료기준:

- 경계값 15.00%는 허용, 15.01%는 제외한다.
- 조건이 하나라도 다르면 Reference 또는 Research 상태를 유지한다.
- 군을 가로지르는 순위·우열은 만들지 않는다.

### Phase R4 — 승인·Release

검토자가 후보를 승인한 뒤에만 Catalog Staging을 갱신하고 새 불변
Published Release를 발행한다.

완료기준:

- Critical 0, Major 0
- 전체 Python·Vitest·build·Playwright 2회 PASS
- 활성 Release 해시와 Git SHA가 일치

## 4. 이번 조사 결과

비-LG 공식 자료를 조사해 다음을 Release 005에 반영했다.

- Panasonic: Re 1개, Ro 6개 신규 등록
- Secop: R134a Re 1개 유사 모델 신규 등록
- Danfoss: DSH090/184/240을 공식 60Hz ARI·Fixed 값으로 정정
- Embraco·GMCC·Highly·Copeland: 제품군은 확인했지만 동일조건 모델별
  공식 수치가 부족해 신규 행은 등록 보류

상세 근거와 보류 사유는
`data/20260730-non-lg-competitor-official-research.md`에 기록한다.

## 5. 다음 조사 순서

1. Sc R454B의 DOE-B Fixed와 ARI Variable 모델을 Copeland·Danfoss에서
   우선 탐색한다.
2. Embraco Product Selector에서 R134a Fixed Re 모델별 export를 확보한다.
3. GMCC·Highly에는 공식 시험조건 표를 요청하고, 회신값만 Staging에 넣는다.
4. 공식 URL 해시 변경을 월 1회 확인하고 변경분만 Release 후보로 만든다.

## 6. 구현·검증 스냅샷

- 앱·데이터 입력 SHA: `2f490beee2acec6d8cc024dd65b13cdab4cf7bd4`
- 활성 Release: `release:2026-07-30:005`
- Published 데이터: 76개(Samsung 27, 경쟁사 49)
- 직접 비교 가능 Samsung: 8개
- Vitest: 27/27 PASS
- Python: 69/69 PASS
- Studio build: PASS
- Playwright: Release 005 desktop/mobile 14/14 PASS, 2회 연속
- Evidence:
  - `qa/evidence/p11/local-run-1/p5-e2e.json`
  - `qa/evidence/p11/local-run-2/p5-e2e.json`
