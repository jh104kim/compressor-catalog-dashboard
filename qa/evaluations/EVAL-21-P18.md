# EVAL-21 — P18 Published Release 변경 Diff

## Judge 계약

- Judge: `P18 Release Diff Contract Judge`
- 평가 대상: P18-A~E 구현, 요구사항 계약, RED/GREEN, 실제 Release와 브라우저 Evidence
- 합격 Gate: Task 96/100 이상, 각 품질축 4.8/5 이상, Critical 0, Major 0
- 반복 상한: 3회
- 최종 평가 반복: `1/3` — 전체 Gate PASS

## Task score

| Task | 배점 | 결과 | 근거 |
|---|---:|---:|---|
| P18-A Diff 엔진 | 25 | 25 | 결정론적 정렬, 추가·삭제·변경, leaf path, 배열 요약 PASS |
| P18-B API·무결성 | 25 | 25 | 양쪽 SHA 검증, FIRST_RELEASE, 변조 503 PASS |
| P18-C Release UI | 20 | 20 | From→To, 6개 요약, 모델·경로, 편집 기능 0 |
| P18-D TDD·E2E | 20 | 20 | RED→GREEN, 2회 연속 16/16, retries·오류·overflow 0 |
| P18-E 문서·운영 | 10 | 10 | README·PLAN·PROGRESS·계약·RUN·Eval 갱신 |
| **합계** | **100** | **100** | 합격 기준 96 충족 |

## 품질 점수

| 품질축 | 점수 | 판정 근거 |
|---|---:|---|
| 기능 완전성 | 5.0/5 | 실제 Release 005→001의 변경 2건을 엔진/API/UI에서 일치시킴 |
| Release 무결성·안전성 | 5.0/5 | 양쪽 Bundle 검증, 변조 차단, 조회 전용 경계 유지 |
| 추적성 | 5.0/5 | From/To Release ID, modelId, field path를 함께 제공 |
| UX·반응형 | 4.9/5 | desktop/mobile 직접 검수, 6개 요약과 카드, overflow 0 |
| 유지보수성·TDD | 4.9/5 | 순수 Diff 엔진, API/UI 계약, RED 증거, 전체 회귀 자동화 |
| **환산 합계** | **99.2/100** | `(24.8/25) × 100` |

## Hard gate

- 실제 Diff 추가/삭제/변경/성능맵: `0/0/2/2` PASS
- 변경 모델/경로: `ENV4A5DL2B`, `TKF76E25DCH-52RPS` / `performanceMaps` PASS
- 현재·직전 Bundle integrity: PASS/PASS
- Python 99, Vitest 38, build, P5/P18 16/16 2회: PASS
- Compare Report 2/2, P14 6/6, P15/P16 8/8: PASS
- retries·외부요청·console/page/network·금지쓰기·overflow: 0
- Critical/Major: **0/0**

## 판정

- Task score: **100/100**
- 품질 환산: **99.2/100**
- 최종 로컬 판정: **PASS**
- 원격 GitHub Actions Gate는 push된 동일 commit에서 확인한다.
