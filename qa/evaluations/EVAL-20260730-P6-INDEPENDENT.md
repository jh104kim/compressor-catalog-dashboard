# EVAL-20260730-P6 · 독립 최종 심사

## 결론

- 심사 대상 Git SHA: `cf95c93dc59f9422881353dbff5154be7efbac0d`
- 판정: **PASS**
- 가중 총점: **4.93 / 5.00**
- P6 기준: 모든 평가축 `4.8 이상`, Critical `0`, Major `0`
- 심사 방식: 고정 SHA의 코드·문서·보관 증거를 정적 대조했다. Windows 자원 보호 지시에 따라 브라우저와 테스트를 추가 실행하지 않았다.

## 즉시탈락 검사

| 검사 항목 | 결과 | 근거 |
|---|---|---|
| Samsung 권위값 오류 | 없음 | `DS4BC7066FVT COP=3.25`가 Published Bundle, API/UI Golden G4 및 계약 테스트에 고정됨 |
| 조건이 다른 모델의 직접 순위 | 없음 | 비교 엔진이 조건 불일치를 `BLOCKED_CONDITION_MISMATCH`로 차단하며 G2에서 순위·Delta DOM이 없음 |
| GAP과 UNKNOWN 혼동 | 없음 | R290 Re는 근거 있는 `GAP`, 미확인 항목은 `UNKNOWN`으로 분리되고 G3에서 가짜 Samsung 모델·0값이 없음 |
| Staging 데이터의 사용자 화면 노출 | 없음 | API는 활성 `PUBLISHED` Release만 읽고, UI는 API 상대경로만 사용함 |
| 발행 실패 후 활성 Release 변경 | 없음 | 실패 원자성 테스트와 Release workflow가 활성 포인터를 마지막에 교체하도록 고정함 |
| Critical 또는 Major 1건 이상 | 없음 | Published Release validation은 Critical `0`, Major `0`, Warning `2` |

`bundle` 내부의 `meta.stage=STAGING`은 발행 시 데이터 해시를 바꾸지 않기 위한 내부 provenance다. Release 메타의 상태는 `PUBLISHED`이고 API/UI에 해당 내부 stage를 사용자 상태로 노출하지 않으므로 즉시탈락 사유가 아니다.

## 축별 평가

| 평가축 | 가중치 | 점수 | 가중점수 | 독립 판단 근거 |
|---|---:|---:|---:|---|
| 데이터 정확성·도메인 안전성 | 25% | 5.0 | 1.250 | 권위값, R290 Re GAP, 비교군·조건 차단이 계약/Validator/API/UI/E2E에 중복 고정됨. Published Release는 68개(당사 27, 경쟁 41), Critical·Major 0임 |
| Evidence·Release 추적성 | 20% | 4.8 | 0.960 | 모델 → Release → 원천 파일 locator와 적용 필드가 구조화되어 있고 G6가 Samsung PDF p.92까지 확인함. 데이터 SHA-256은 활성 포인터·Release·Bundle에서 일치함. 단, 로컬 P5 JSON 자체에 Git SHA가 없어 소폭 감점함 |
| E2E 검증·재현성 | 20% | 4.9 | 0.980 | `local-run-1`, `local-run-2`가 각각 데스크톱·모바일 Golden 6종, 총 12/12 PASS이며 `retries=0`; 오류·외부 요청·금지 쓰기·가로 overflow가 모두 0임. [GitHub Actions run 30523905496](https://github.com/jh104kim/compressor-catalog-dashboard/actions/runs/30523905496)도 성공함 |
| Workflow 완전성 | 15% | 5.0 | 0.750 | Staging 검증·거절·승인·Published·해시·활성 포인터 교체가 구현됨. P7 별도 임시 저장소에서 901→902 발행, 901 롤백, 양쪽 SHA-256 및 audit 보존을 재현함 |
| UI 의사결정 안전성 | 10% | 5.0 | 0.500 | View-first UI에 편집·Publish·Rollback 기능이 없고, `rankingAllowed !== true`이면 순위·Delta를 렌더하지 않음. G2/G3/G5가 차단·공백·Release 안전 표시를 데스크톱/모바일에서 확인함 |
| 유지보수·운영 안정성 | 10% | 4.9 | 0.490 | 비교, 검증, Release, API, React UI가 분리되고 단일 GitHub Actions workflow가 pytest·Schema·Vitest·build·same-origin E2E를 묶음. 보관 결과는 Python 44 PASS, Vitest 23 PASS, production build PASS임 |
| **합계** | **100%** |  | **4.930** | **PASS** |

## 증거 대조 요약

- 기준과 즉시탈락 규칙: `docs/03-test-plan.md`
- CI 재현 계약: `docs/08-ci-gate.md`, `.github/workflows/catalog-audit-gate.yml`
- 로컬 Golden E2E: `qa/evidence/p5/local-run-1/p5-e2e.json`, `qa/evidence/p5/local-run-2/p5-e2e.json`
- 자동검증·브라우저 결과: `qa/test-runs/RUN-20260730-009-P5-GREEN.md`
- 롤백 리허설: `qa/test-runs/RUN-20260730-010-P7-ROLLBACK.md`
- 발행 무결성: `catalog/published/active-release.json`, `catalog/published/releases/release_2026-07-30_001/release.json`, `bundle.json`
- 핵심 구현: `backend/catalog_audit/comparison.py`, `validation.py`, `release.py`, `api.py`, `studio/src/App.tsx`, `studio/src/api.ts`

## 잔여 위험

1. 로컬 P5 결과 JSON에는 실행 Git SHA가 없다. CI gate context와 커밋에 보관된 증거로 이번 판정은 가능하지만, 향후 runner가 `gitSha`를 결과 JSON에 직접 기록하면 독립 재현성이 더 좋아진다.
2. Release의 `sourceCommit=d413cfa2037438f025edeb1111812289a489889e`은 발행 데이터 생성 커밋이며, 심사 대상 앱 SHA `cf95c93dc59f9422881353dbff5154be7efbac0d`와 역할이 다르다. 현재는 CI/PR 이력으로 연결되지만 두 값을 별도 필드로 함께 기록하면 혼동을 줄일 수 있다.

위 위험은 현재 Published 데이터 무결성, 사용자 화면 안전성 또는 비교 판정을 깨뜨리지 않는 경미한 추적성 개선사항이다.
