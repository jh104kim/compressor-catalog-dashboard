# 직접 비교 공백 리서치 계획

## 1. 현재 기준

활성 Release `release:2026-07-30:004`의 Samsung 27모델 중 현재 데이터로
직접 비교 가능한 모델은 Sc `DS8LC5040IN` 1개다.

| 유형 | Samsung | 직접 비교 가능 | 리서치 대상 |
|---|---:|---:|---:|
| Re | 4 | 0 | 4 |
| Ro | 12 | 0 | 12 |
| Sc | 11 | 1 | 10 |
| 합계 | 27 | 1 | 26 |

Compare Lab은 이 상태를 숨기지 않는다.

- Samsung 선택에는 직접 비교 가능한 모델만 노출한다.
- 나머지는 오류가 아니라 `공식 자료 리서치 큐`로 표시한다.
- 큐에는 필요한 냉매·조건·구동·용량 범위·지표를 함께 표시한다.

## 2. 조사 우선순위

| 우선순위 | 조사군 | 목표 |
|---|---|---|
| P1 | Ro Variable · ARI · R32/R410A/R454B | LG 공식 카탈로그 후보를 검토해 Ro 8모델 직접 비교 가능성 확인 |
| P1 | Re Variable · ASHRAE-LBP · R600a | LG BSA 계열을 검토해 `ENV4A5DL2B` 직접 비교 가능성 확인 |
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

공식 LG 자료에서 다음 후보를 찾았다. 아직 Published에는 넣지 않았다.

- Ro: R32 ARI Variable 4모델, R410A 2모델, R454B 2모델의 용량 근접
  가능성을 확인했다.
- Re: R600a ASHRAE-LBP Variable `BSA057...` 147 W 계열이 Samsung
  `ENV4A5DL2B` 148 W와 근접한다.
- Sc: 제품군 범위는 확인했지만 Samsung과 동일 조건·구동·용량을 모두
  만족하는 모델별 행은 아직 미확보다.

상세 근거와 후보 계산은
`data/20260730-lg-direct-comparison-candidates.md`에 기록한다.

## 5. 다음 조사 순서

1. LG PDF 원문 표에서 R32/R410A/R454B 냉매별 모델 소속을 2인 검토한다.
2. Sc R454B의 DOE-B Fixed와 ARI Variable 모델을 Copeland·Danfoss·LG에서
   우선 탐색한다.
3. 검토 완료 후보만 별도 Staging batch로 만들고 Release 전 비교 Gate를
   자동 실행한다.

## 6. 구현·검증 스냅샷

- 앱 구현 SHA: `5f61d1df7358c5c1873a1779a80b1770b9fd3370`
- 활성 Release: `release:2026-07-30:004`
- Published 데이터: 기존 검증 Bundle 68개 유지
- Vitest: 27/27 PASS
- Python: 49/49 PASS
- Studio build: PASS
- Playwright: desktop/mobile 14/14 PASS, 2회 연속
- Evidence:
  - `qa/evidence/p10/local-run-6/p5-e2e.json`
  - `qa/evidence/p10/local-run-7/p5-e2e.json`
