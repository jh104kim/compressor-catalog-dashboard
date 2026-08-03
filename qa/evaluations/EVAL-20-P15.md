# EVAL-20 — P15 RPM/RPS 성능 맵·Recharts

## Judge 계약

- Judge: `P15 Contract Judge`
- 평가 대상: P15-A~E 구현과 REQ/TEST/RUN/Evidence
- 반복 상한: 3회
- 합격 Gate: 각 품질축 4.8/5 이상, 환산 96/100 이상, Critical 0, Major 0
- 평가 독립성: 구현 담당과 분리된 QA 에이전트가 계약·실행 JSON을 기준으로 판정
- 최종 평가 반복: `2/3` — 1차 reflow 측정 오탐 보완 후 2차 독립 재검증 PASS

## Hard gate

| Gate | 결과 | 필요한 증거 |
|---|---|---|
| 표시 성능점 Evidence 연결률 100% | PASS | 두 실행 모두 8/8점 Evidence 완결 |
| RPM/RPS 정확한 60배 관계 | PASS | API Golden + RPM/RPS toggle·표 DOM |
| Hz→RPM/RPS 오인 0 | PASS | schema 음수 테스트 + E2E hardGates 0 |
| 보간·외삽 생성점 0 | PASS | API=Recharts dots=표 rows `8=8=8` |
| chart 수=chartEligible 대상 수 | PASS | live/static desktop/mobile 2회 |
| DATA_REQUIRED chart 0·gap 안내 | PASS | Sc Golden: chart 0, gap 1 |
| 지연 응답 stale 결과/차트/표 0 | PASS | 650ms 전환: 각 0 |
| 정적 report/CSV/print/popup 회귀 | PASS | P15 2회 + report 2/2 |
| console/page/network/external/write/overflow 0 | PASS | 두 viewport·두 실행 모두 0 |
| Critical / Major | **0 / 0** | 전체 로컬 Gate |

## 품질 점수

| 품질축 | 점수 | 판정 근거 |
|---|---:|---|
| 기능 완전성 | 5.0/5 | eligible 차트·단위·지표·표·CSV·print와 DATA_REQUIRED 구현 |
| 속도 단위·성능점 도메인 안전성 | 5.0/5 | 정확한 60배, Hz/생성점 0, speed ranking 금지 |
| Release/Evidence 추적성 | 5.0/5 | active Release 001, 표시점 Evidence 100%, 동적 Release Gate |
| UX·접근성·E2E 검증가능성 | 4.9/5 | desktop/mobile·원시점 표·caption·overflow 0; 실제 사용자성 정성 점검은 후속 가능 |
| 유지보수성·TDD 규율 | 4.9/5 | RED 선작성·SSOT point 배열·stale·회귀 자동화; 원격 run만 대기 |
| **환산 합계** | **99.2/100** | `(24.8/25) × 100`, 합격 기준 96/100 충족 |

## 확정 증거

- 계약 문서: `tests/p15-speed-performance-contract.md`
- 개발 계획: `docs/13-speed-performance-map-tdd-plan.md`
- RED 실행: `qa/evidence/p15/red-contract/p15-speed-e2e.json`
- GREEN 실행 1: `qa/evidence/p15/local-run-2/p15-speed-e2e.json`
- GREEN 실행 2: `qa/evidence/p15/local-run-3/p15-speed-e2e.json`
- 회귀: `qa/evidence/p15/regression-p5/`, `qa/evidence/p15/regression-report/`,
  `qa/evidence/p15/regression-p14/`, `qa/evidence/p15/regression-p0/`
- 실행 로그: `qa/test-runs/RUN-20260803-016-P15-RED-GREEN.md`
- 구현 commit: `0f0d126fd40cfca4c6222358fa54be9c03304e0e`

## 판정

- Critical: **0**
- Major: **0**
- Task score: **100/100**
- 품질 환산: **99.2/100**
- 최종 로컬 판정: **PASS**

Python 94, Vitest 35/35, build 581 modules, P15 8/8 2회, P5 16/16,
report 2/2, P14 6/6, P0 characterization을 근거로 로컬 판정을 확정한다.
원격 배포 Gate는 아래 실행 결과가 추가돼야 닫힌다.

## 원격 Gate

- 구현 commit: `0f0d126fd40cfca4c6222358fa54be9c03304e0e`
- GitHub Actions 원격 run: **PENDING** — push 또는 PR 실행 후 run ID·URL·결과 기록
