# EVAL-20 — P15 RPM/RPS 성능 맵·Recharts

## Judge 계약

- Judge: `P15 Contract Judge`
- 평가 대상: P15-A~E 구현과 REQ/TEST/RUN/Evidence
- 반복 상한: 3회
- 합격 Gate: 각 품질축 4.8/5 이상, 환산 96/100 이상, Critical 0, Major 0
- 현재 평가 반복: `0/3` — 구현·검증 진행 중

## Hard gate

| Gate | 결과 | 필요한 증거 |
|---|---|---|
| 표시 성능점 Evidence 연결률 100% | PENDING | schema/API/E2E point trace |
| RPM/RPS 정확한 60배 관계 | PENDING | API Golden + 표 DOM |
| Hz→RPM/RPS 오인 0 | PENDING | 음수 schema/API + safeguard |
| 보간·외삽 생성점 0 | PENDING | API points=Recharts dots=표 rows |
| chart 수=chartEligible 대상 수 | PENDING | live/static desktop/mobile E2E |
| DATA_REQUIRED chart 0·gap 안내 | PENDING | Sc Golden E2E |
| 지연 응답 stale 결과/차트/표 0 | PENDING | 650ms E2E |
| 정적 report/CSV/print/popup 회귀 | PENDING | report E2E |
| console/page/network/external/write/overflow 0 | PENDING | P15 E2E JSON |
| Critical / Major | **PENDING / PENDING** | 전체 Gate |

## 품질 점수

| 품질축 | 점수 | 판정 근거 |
|---|---:|---|
| 기능 완전성 | PENDING | 구현·검증 후 평가 |
| 속도 단위·성능점 도메인 안전성 | PENDING | 구현·검증 후 평가 |
| Release/Evidence 추적성 | PENDING | 구현·검증 후 평가 |
| UX·접근성·E2E 검증가능성 | PENDING | 구현·검증 후 평가 |
| 유지보수성·TDD 규율 | PENDING | 구현·검증 후 평가 |
| **환산 합계** | **PENDING** | 합격 기준 96/100 |

## 현재 증거

- 계약 문서: `tests/p15-speed-performance-contract.md`
- 개발 계획: `docs/13-speed-performance-map-tdd-plan.md`
- RED 실행: `qa/evidence/p15/red-contract/p15-speed-e2e.json`
- 실행 로그: `qa/test-runs/RUN-20260803-016-P15-RED-GREEN.md`

## 판정

- Critical: PENDING
- Major: PENDING
- Task score: PENDING
- 최종 판정: **PENDING**

실제 Python·Vitest·build·로컬 E2E 2회·GitHub Actions가 모두 끝나기 전에는
PASS나 점수를 확정하지 않는다.

## 원격 Gate

- 구현 commit: PENDING
- GitHub Actions PR run: PENDING
- GitHub Actions push run: PENDING
