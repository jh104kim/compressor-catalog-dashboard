# P16 Compare Report 직접 비교 상세화 계획

> 상태: 2026-08-03 완료. 구현·검증 증거는
> `qa/test-runs/RUN-20260803-017-P16-RED-GREEN.md`와
> `qa/evidence/p16/local-run-3/`에 있다.

## Goal

랜딩 6번째 `Compare Report` 탭에서 비교 불가 모델·지표·속도쌍을 제외하고,
`DIRECT_OK` 데이터만 유형·지표별 Recharts와 상세 카드로 확인한다.

## Current structure

- Python 생성기: `scripts/build_compare_lab_report.py`
- 정적 React entry: `studio/src/compare-report.tsx`
- 속도 차트: `studio/src/SpeedAnalysis.tsx`
- 브라우저 Gate: `qa/scripts/p15-speed-e2e.cjs`

## Approach

1. 전체 27개 모델은 점검 범위로만 유지하고 보고서 본문에는 직접 비교 가능 8개만 표시한다.
2. COP/EER 직접 판정 15건을 JSON으로 제공한다.
3. 유형·지표 필터, 양사 원값 Bar chart, 경쟁사 Delta percent chart, 비교 상세 카드를 추가한다.
4. 공식 RPM/RPS 성능점이 양쪽에 있는 속도쌍만 정적 보고서에 표시한다.
5. 각 행은 독립 직접 비교쌍으로 취급하고 군 교차 순위를 만들지 않는다.

## Test plan and done criteria

- Python: 모델 카드 8, 매트릭스 8, 직접 판정 15, research gap 0, speed eligible 1.
- Vitest: COP/EER가 있는 유형만 토글에 노출되고 차트 2개가 유지된다.
- Playwright: desktop 1440x1024, mobile 390x844, retries 0, overflow/error 0.
- 기존 전체 Python, Studio Vitest, production build, P15 회귀가 모두 PASS한다.

## Result

- 보고서 표시: Samsung 8모델, `DIRECT_OK` 15건, 조사 공백 0
- 차트: 원본 COP/EER 1개 + 경쟁사 Δ 1개, eligible RPM/RPS 1쌍
- 검증: Python 94, Vitest 37, P15/P16 E2E 8/8, 보고서 회귀 2/2
- 품질 Gate: retries 0, console/page/external request/forbidden write/overflow 0
