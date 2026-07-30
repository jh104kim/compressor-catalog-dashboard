# P2 카탈로그 Staging 이관

## 목적

`frontend/compressor-data.js`의 68개 모델을 값 변경 없이 검토 가능한 Canonical Staging Bundle로 옮긴다. 이 단계는 발행이 아니며 UI는 계속 기존 SSOT를 읽는다.

비교 프로젝트 `2608-comp-set-costsaving`의 다음 원칙만 가져왔다.

1. 조사·기존 데이터는 먼저 Staging에 둔다.
2. 원본 해시와 원본 레코드를 보존한다.
3. 검증·승인 전에는 Published 또는 UI 데이터로 사용하지 않는다.
4. 동일 입력은 항상 동일한 byte의 Bundle을 만든다.

## 실행

```powershell
$env:PYTHONUTF8='1'
python scripts/migrate_catalog.py
python -m pytest -q tests/test_catalog_migration.py
```

산출물은 `catalog/staging/catalog-bundle.json`이다.

## Bundle 구조

| 필드 | 역할 |
|---|---|
| `schemaVersion`, `bundleId`, `stage`, `asOf` | Staging 식별 |
| `source.path`, `source.sha256` | 원본 JS 고정 |
| `counts` | 전체·Samsung·경쟁사 모델 수 |
| `models` | P1 Schema 형태의 정규화 모델 |
| `sourceRecords` | 원본 모델 객체 전체. 이관 손실 확인용이며 Published 대상 아님 |

`models`와 `sourceRecords`는 `modelId` 오름차순이다. JSON은 UTF-8, `sort_keys=True`, 마지막 개행으로 고정한다.

## 필드 변환

| 원본 | Canonical |
|---|---|
| `mfr` | `manufacturer` |
| `app` | `application` |
| `drive` | `driveDetail` + `driveClass` |
| `status` | `lifecycleStatus` |
| `cc/capW/capBtu/inputW/cop/eer` | `specs.*` |
| `condition:미확인` | `condition:UNKNOWN` |
| `src` | `evidence` + `supportingEvidence` |
| 원본 전체 객체 | `sourceRecords[].raw` |

`driveClass`는 `Fixed* → Fixed`, `Variable*`과 `BLDC → Variable`, 그 외는 `Unknown`으로 정규화한다.

## 레이어 규칙

- Samsung + `postCatalog:true` → `post_catalog`
- Samsung + `postCatalog:false` + `2024 catalogue p.N` → `samsung_catalog_2024`
- Samsung + `postCatalog:false` + 공식 PDF 페이지 미확정 → `samsung_legacy_research`
- 경쟁사 → `competitor_research` + `postCatalog:false`

현재 Post-catalog 모델은 `DS2LD5046F`, `DS8LC5040IN`, `DS8LC5049IN` 3개다.

## Evidence 구조화

기존 `src` 원문은 첫 Evidence의 `note`에 그대로 보존한다. `" / "`로 나뉜 복수 출처는 첫 항목을 `evidence`, 이후 항목을 `supportingEvidence`로 만든다.

| 기존 표기 | `sourcePath` |
|---|---|
| `2024 catalogue p.N` | Samsung 2024 공식 PDF + page |
| `2024 catalogue (Re)` | 공식 PDF 파싱 참조본의 Reciprocating 섹션 |
| `report §...` | 메인 deep research report |
| `normalization §...` | R454B 정규화 보고서 |
| `gmcc §...` | GMCC R454B 조사 보고서 |
| `r290 §...` | R290 Re 벤치마크 조사 보고서 |
| `followup`, `보완보고서` | 해당 로컬 조사 보고서 |

모든 locator는 저장소 내부의 실제 파일을 가리킨다.

## RED/GREEN 수락조건

- 68개 = Samsung 27 + 경쟁사 41
- `modelId` 중복 0, 정렬 고정
- 68개 원본 객체 전체 보존
- 주요 수치와 `null`의 Diff 0
- 원본 `src` 원문 보존과 locator 100%
- P1 JSON Schema 오류 0
- 원본 SHA-256 일치
- 같은 입력으로 2회 생성한 파일 byte 일치

## 발견한 데이터 이상

이관기는 값을 고치지 않고 그대로 보존했다. 다음은 P3 Validator에서 처리해야 한다.

1. `ENV4A5DL2B`, `CD124K-S1ZA`는 현재 `src`에 Samsung 공식 PDF 페이지 번호가 없다. 각각 파싱 참조본·메인 보고서 locator까지만 연결된다.
2. `NLE12.6CNL`의 `capacityW/inputW` 역산 COP와 저장 COP 차이가 약 9.4%다. P1 기준 Warning이며 원문 재확인이 필요하다.
3. 기존 `r32-ro-var` 비교군에는 ARI·SEER60·미확인 조건이 섞여 있다.
4. 기존 `r454b-sc-var-ari` 비교군에는 Variable과 Fixed가 섞여 있다.

3~4번 비교군은 이번 모델 이관 범위 밖이며, P4 비교 엔진에서 분리하거나 BLOCKED 처리한다.

## P2 완료기준

Staging Bundle과 테스트가 PASS하고 원본·핵심값 Diff가 0이면 P2 이관 완료다. Published 생성, 활성 Release 교체, UI 전환은 수행하지 않는다.
