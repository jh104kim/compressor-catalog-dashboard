# P1~P6 테스트·E2E·평가 계획

## 기본 원칙

각 Phase는 `RED → 구현 → 자동 테스트 → 실제 화면 E2E → 기록` 순서로 닫는다. 실패를 숨기거나 재시도로 통과시키지 않는다.

- 로컬 E2E: 깨끗한 서버에서 **2회 연속** PASS
- GitHub Actions: Chromium **1회** PASS
- Playwright: `retries=0`, `reuseExistingServer=false`, 동적 포트
- 최종 구조: FastAPI가 빌드된 React를 같은 origin에서 제공
- 최종 Gate: Critical 0, Major 0

## 테스트 계층

| 계층 | 검사 대상 | 도구 |
|---|---|---|
| Contract | Schema, 고정 권위값, 레이어, 해시 | pytest + jsonschema |
| Validator | 중복, 수식, Evidence, GAP, 발행 Gate | pytest |
| API | 활성 Release, 비교 판정, 실패 원자성 | pytest/TestClient |
| UI | 배지, 차단 사유, 필터, Release 표시 | Vitest |
| E2E | 사용자 흐름과 실제 브라우저 결과 | Playwright |

## Golden E2E

| ID | 흐름 | 기대 결과 |
|---|---|---|
| `G1-DIRECT` | R454B Sc Fixed DOE-B에서 Samsung과 동일 키·용량 ±15% 후보 선택 | `DIRECT_OK`, 동일 조건 배지, 순위·Δ 표시 |
| `G2-CONDITION-MISMATCH` | API에 Samsung R32 Ro ARI와 GMCC SEER60 비교 요청 | `BLOCKED_CONDITION_MISMATCH`, 순위·Δ 없음 |
| `G2-RESEARCH-QUEUE` | 직접 후보가 없는 Samsung R32 Ro 선택 시도 | Samsung 선택 비활성, 공식 자료 요구조건 표시, 순위·Δ 없음 |
| `G3-PORTFOLIO-GAP` | Samsung R290 Re 조회 | `PORTFOLIO_GAP`, 경쟁 모델은 표시하되 Samsung 가짜 모델·0·순위 없음 |
| `G4-AUTHORITY` | `DS4BC7066FVT COP=3.34`인 Staging 검증 | `AUTHORITY_VALUE_MISMATCH`, 3.25만 PASS |
| `G5-RELEASE-SAFETY` | 오류 Bundle 발행 시도 | 발행 실패, 활성 Release ID·해시·화면 수치 불변 |
| `G6-EVIDENCE-TRACE` | 화면의 Samsung COP에서 Evidence 열기 | 모델 → Release → 원천 PDF p.92까지 연결 |

추가 경계값은 용량 차이 `14.99%, 15.00%=DIRECT`, `15.01%=REFERENCE`로 고정한다. 조건 `UNKNOWN`, 지표 `null`, 냉방↔난방도 각각 BLOCKED를 확인한다.

## Phase별 Gate

| Phase | 자동 검증 | E2E/완료기준 |
|---|---|---|
| P0 기준선 | 68/27/41/12, 원본 SHA-256, 권위값 | 기존 5탭 390px·1440px 기준 캡처 |
| P1 계약 | Schema 유효성, 레이어·오류코드·Golden 계약 | 문서와 테스트 용어 일치, RED 테스트 GREEN |
| P2 이관 | 모델 ID 중복 0, 누락 0, 핵심값 Diff 0 | 기존 화면과 68개 모델/KPI parity |
| P3 Validator/Release | Critical 0·Major 0만 발행, 해시·롤백 | G4·G5 PASS |
| P4 API/비교 엔진 | DIRECT/REFERENCE/BLOCKED와 ±15% 경계 | G1·G2·G3 PASS |
| P5 React UI | API 계약, 배지·차단 UI, Evidence 링크 | 390px·1440px, G6 PASS |
| P6 독립 검증 | 전체 pytest·Vitest·Playwright | 로컬 2회 연속 + GitHub Actions 1회 |

## Eval score

| 평가축 | 가중치 | 5점 기준 |
|---|---:|---|
| 데이터 정확성·도메인 안전성 | 25% | 권위값·공백·비교 금지 회귀 0 |
| Evidence·Release 추적성 | 20% | 화면 수치 100%가 원천 위치까지 연결 |
| E2E 검증·재현성 | 20% | Golden 6종과 2회 연속/Actions 모두 PASS |
| Workflow 완전성 | 15% | Staging 검증·거절·Published·롤백 재현 |
| UI 의사결정 안전성 | 10% | 차단 비교에서 순위·Δ·우열 문구 0 |
| 유지보수·운영 안정성 | 10% | clean build, 오류 0, 실행 문서 재현 |

총점은 `각 축 점수(0~5) × 가중치`의 합으로 계산한다. Phase 중간 Gate는 해당 Phase 목표 점수 이상이어야 한다.

- P0: 4.0 이상
- P1: 4.3 이상
- P2: 4.5 이상
- P3~P4: 4.6 이상
- P5: 4.7 이상
- P6: 모든 축 각각 4.8 이상

평균이 높아도 다음은 즉시 FAIL이다.

- Samsung 권위값 오류
- 조건이 다른 모델의 직접 순위
- GAP과 UNKNOWN 혼동
- Staging 데이터의 사용자 화면 노출
- 발행 실패 후 활성 Release 변경
- Critical 또는 Major 1건 이상

## 실행 결과 기록

각 실행은 Phase, Git SHA, Release ID, 명령, PASS/FAIL 수, 브라우저/뷰포트, 캡처 경로를 `docs/PROGRESS.md`에 남긴다. 최대 3회 평가 후에도 Gate 미달이면 점수를 낮추지 말고 `BLOCKED`와 원인을 기록한다.
