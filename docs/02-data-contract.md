# P1 데이터 계약

## 목적

조사 데이터를 화면에 바로 노출하지 않고, 동일한 규칙으로 검증한 모델만 Release에 포함한다. 현재 `compressor-data.js`의 68개 모델은 값 변경 없이 이 계약으로 이관한다.

## 권위와 레이어

| `sourceLayer` | 의미 | 필수 규칙 |
|---|---|---|
| `samsung_catalog_2024` | Samsung 2024 공식 카탈로그 Baseline | Samsung만 허용, `postCatalog:false`, 공식 PDF Evidence 필수 |
| `samsung_legacy_research` | Samsung 기존 공개 조사값 중 2024 PDF 페이지 미확정 | Samsung만 허용, `postCatalog:false`, `official` 권위 표기 금지 |
| `post_catalog` | 2024년 이후 Samsung 개발·양산 정보 | Samsung만 허용, `postCatalog:true` |
| `competitor_research` | 경쟁사 공개 조사 데이터 | Samsung 금지, `postCatalog:false` |

Baseline, Legacy Research, Post-catalog는 덮어쓰지 않고 함께 유지한다. `postCatalog:true`는 “미검증”이 아니라 “2024 공식 카탈로그 이후 정보”라는 뜻이다. Legacy Research는 모델을 삭제하지 않고 68개 이관 parity를 지키기 위한 레이어이며, PDF 위치가 확인되기 전에는 공식 Baseline으로 승격하지 않는다.

고정 권위값은 다음과 같다.

- `DS4BC7066FVT`의 COP는 `3.25`이다.
- R290은 Samsung `Re=GAP`, `Ro=HAVE`, `Sc=HAVE`이다.
- R454B는 Samsung `Ro=HAVE`, `Sc=HAVE`이다.

## 모델 계약과 ID

모델 1건은 [catalog.schema.json](../data/contracts/catalog.schema.json)을 따른다. 필수 비교 키는 `type × refrigerant × condition × driveClass`이다.

- `modelId`: `model:<manufacturer-slug>:<normalized-model>`
  - 예: `model:samsung:DS4BC7066FVT`
- `evidenceId`: `evidence:<source-slug>:<locator>`
  - 예: `evidence:samsung-catalog-2024:p92`
- `groupId`: `group:<refrigerant>-<type>-<driveClass>-<condition>`을 소문자로 정규화한다.
- `releaseId`: `release:YYYY-MM-DD:NNN`

ID는 한번 Published 되면 바꾸지 않는다. 모델명 오타·구 표기는 새 모델을 만들지 않고 `aliases`와 `nameNote`에 기록한다.

기존 필드의 이관 규칙은 다음과 같다.

| 기존 | 계약 |
|---|---|
| `mfr` | `manufacturer` |
| `app` | `application` |
| `drive` | 원문은 `driveDetail`, 판정값은 `driveClass` |
| `cc`, `capW`, `capBtu`, `inputW`, `cop`, `eer` | `specs.*` |
| `status:양산/개발중` | `lifecycleStatus:MASS_PRODUCT/IN_PROGRESS` |
| `condition:미확인` | `condition:UNKNOWN` |
| `src` | 구조화된 `evidence`와 `supportingEvidence` |

수치 미확보는 `null`로 저장한다. `0`으로 대신하지 않는다.

## Evidence locator

모든 모델은 최소 하나의 Evidence를 가져야 한다. Evidence는 `sourcePath`, `authority`, `locator`, `fieldPaths`로 “어느 파일의 어느 위치가 어떤 필드를 뒷받침하는지” 기록한다.

- PDF: `sourcePath + locator.kind:pdf-page + page`
- Markdown: `sourcePath + locator.kind:markdown-section + section`
- 웹: 재현용 로컬 조사 파일인 `sourcePath`와 `url + accessedAt`
- 여러 출처: 권위가 가장 높은 출처를 `evidence`, 나머지는 `supportingEvidence`

Samsung Baseline의 모델명·조건·수치는 `data/Samsung-Compressor-Catalogue_2024.pdf` 페이지 locator가 없으면 Published 할 수 없다.

## 비교 판정

용량 유사도는 기준 모델 대비 `abs(후보용량-기준용량) / 기준용량 × 100`으로 계산하고 허용범위는 **±15%**로 한다.

| 결과 | 조건 | 화면 규칙 |
|---|---|---|
| `DIRECT` | type·refrigerant·condition·driveClass 일치, 양쪽 지표 존재, 용량 차이 ±15% 이내 | 동일 군 안에서만 순위와 Δ 표시 |
| `REFERENCE` | 핵심 제품군은 같지만 용량이 ±15% 밖이거나 driveClass가 다름, 또는 ARI/DOE-A/DOE-B 환산 참고 | 원값·환산 참고값과 사유만 표시, 순위 금지 |
| `BLOCKED` | type/냉매 불일치, 조건 `UNKNOWN`, 냉방↔난방, 환산계수 없는 조건 차이, 지표 누락 | 순위·Δ·우열 문구 모두 숨김 |

DOE-A와 DOE-B의 ARI 참고 환산은 원값에 각각 `0.84`, `0.63`을 곱한다. 환산값에는 `*`와 “참고”를 표시하며, **군 교차 순위 금지** 원칙은 그대로 적용한다.

판정 코드는 다음만 사용한다.

- `DIRECT_OK`
- `REFERENCE_CAPACITY_OUTSIDE_15PCT`
- `REFERENCE_DRIVE_MISMATCH`
- `REFERENCE_NORMALIZED_CONDITION`
- `BLOCKED_TYPE_MISMATCH`
- `BLOCKED_REFRIGERANT_MISMATCH`
- `BLOCKED_CONDITION_MISMATCH`
- `BLOCKED_CONDITION_UNKNOWN`
- `BLOCKED_HEATING_COOLING_MISMATCH`
- `BLOCKED_METRIC_MISSING`

## HAVE, IN_PROGRESS, GAP, UNKNOWN

포트폴리오 판정은 모델 레코드와 분리한다.

- `HAVE`: 양산 모델 Evidence가 1건 이상 존재
- `IN_PROGRESS`: 개발중 모델 Evidence만 존재
- `GAP`: 조사되지 않은 것이 아니라, 기준일 현재 미보유라는 근거와 승인자 기록이 존재
- `UNKNOWN`: 공개 정보가 없거나 조사 미완료. GAP으로 자동 승격 금지

GAP과 UNKNOWN은 가짜 모델이나 수치 `0`을 만들지 않는다. 현재 확정 GAP은 R290 Re이며, R1234yf 등 “미확인” 항목은 Evidence가 보강되기 전 UNKNOWN으로 취급한다.

## 수치 검증과 오류 코드

- `COP ≈ capacityW / inputW`, `EER ≈ COP × 3.412`
- 상대 오차 `≤2%`: PASS
- `>2% ~ 10%`: Warning. 원문값을 유지하고 확인 티켓 생성
- `>10%`: Major. Published 차단
- 공식 Samsung 값 불일치는 허용오차와 무관하게 Critical이다.
- 저장값은 원문 정밀도를 유지하고 UI만 소수 둘째 자리로 표시한다.

| 코드 | 등급 | 의미 |
|---|---|---|
| `SCHEMA_INVALID` | Major | JSON Schema 불일치 |
| `MODEL_ID_DUPLICATE` | Major | 동일 `modelId` 중복 |
| `EVIDENCE_LOCATOR_MISSING` | Major | 출처 위치 또는 대상 필드 누락 |
| `LAYER_FLAG_MISMATCH` | Major | `sourceLayer`와 `postCatalog` 불일치 |
| `METRIC_FORMULA_MISMATCH` | Warning/Major | 계산식 허용오차 초과 |
| `PORTFOLIO_GAP_UNVERIFIED` | Major | 근거·승인 없는 GAP |
| `AUTHORITY_SOURCE_MISSING` | Critical | Samsung Baseline 공식 PDF 근거 없음 |
| `AUTHORITY_VALUE_MISMATCH` | Critical | Samsung 공식 카탈로그 값과 불일치 |
| `CROSS_GROUP_RANKING` | Critical | 비교 키가 다른 모델에 순위·Δ 생성 |
| `RELEASE_HASH_MISMATCH` | Critical | 저장 데이터와 Release 해시 불일치 |

## Release 계약

Release 메타데이터의 최소 필드는 `releaseId`, `status`, `createdAt`,
`sourceCommit`, `appGitSha`, `dataSha256`, `previousReleaseId`,
`validationSummary`이다. `sourceCommit`은 발행 데이터 입력 SHA,
`appGitSha`는 해당 데이터를 보여주는 앱 구현 SHA다. 상태는
`STAGING → VALIDATED → PUBLISHED`이며 실패 시 `REJECTED`로 남긴다.

Published Gate는 다음과 같다.

1. Schema PASS
2. Critical 0, Major 0
3. 승인자와 승인시각 기록
4. `dataSha256` 재계산 일치
5. 활성 Release 포인터를 마지막에 한 번만 교체

Published Release는 수정하지 않는다. 실패하거나 중단되면 이전 활성 Release와 화면 수치는 그대로 유지한다. View-first MVP에서는 UI 데이터 수정과 발행을 제공하지 않고 승인자 기록만 표시한다.

## P1 완료기준

- Draft 2020-12 Schema가 유효하다.
- 68개 모델을 표현할 필드와 이관표가 있다.
- 레이어·Evidence·비교·GAP/UNKNOWN·Release 규칙이 문서와 테스트에서 동일하다.
- 확정 권위값과 군 교차 순위 금지가 자동 테스트로 고정된다.
