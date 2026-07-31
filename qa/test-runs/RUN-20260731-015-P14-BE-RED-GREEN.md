# RUN-20260731-015 — P14-B~E RED → GREEN → REFACTOR

## 실행 계약

| 필드 | 값 |
|---|---|
| task_id | P14-B, P14-C, P14-D, P14-E |
| requirement_id | REQ-P14-003, REQ-P14-004, REQ-P14-005, REQ-P14-006 |
| artifact_path | `backend/catalog_audit/analysis.py`, `backend/catalog_audit/api.py`, `studio/src/App.tsx`, `qa/scripts/p14-analysis-e2e.cjs` |
| test_id | P14-API-ANALYSIS-001~003, P14-UT-ANALYSIS-001~002, P14-UT-STALE-001~002, P14-E2E-ANALYSIS/BLOCK/TRACE/STALE/MOBILE-001 |
| expected | 안전 비교와 5개 분석 섹션을 같은 Release로 반환하고 비직접 수치·stale 응답을 차단 |
| reviewer_or_judge | P14 Contract Judge |
| version_or_commit | 구현 커밋에 기록 |

## RED

- Python: `backend.catalog_audit.analysis` 부재로 collection error 1건.
- Vitest 분석 UI: `analysis-report` 부재로 2 failed.
- Vitest stale: 80ms 지연 응답이 지표 변경 뒤 `comparison-result`를 다시 표시해 1 failed.

## GREEN

- P14 분석 Python/API 대상: `5 passed`.
- 전체 Python: `82 passed`, warning 1건.
- P14 분석·stale Vitest: `4 passed`; 전체 Vitest `33/33 passed`.
- production build: PASS.
- 기존 P5 회귀: `16/16 passed`.
- 정적 보고서 팝업: `2/2 passed`.
- P14 분석 E2E: 데스크톱/모바일 × DIRECT/BLOCKED/stale `6/6 passed`.
- 두 모델 단일 Release snapshot 조회와 화면 Active Release 불일치 응답 폐기를 추가 검증.

## REFACTOR

- 기존 `/api/v1/compare`는 호환성을 위해 유지하고 새 분석 endpoint를 분리.
- 프론트엔드는 API 수치를 재계산하지 않고 응답만 표시.
- Release·두 modelId·metric이 snapshot과 모두 일치할 때만 결과·JSON을 활성화.
- P5 쓰기 감시에서 읽기 전용 `/api/v1/compare/report`만 명시적으로 허용.

## 증거

- `qa/evidence/p14/analysis-run-1/p14-analysis-e2e.json`
- `qa/evidence/p14/analysis-run-2/p14-analysis-e2e.json`
- `qa/evidence/p14/p5-regression-run-1/p5-e2e.json`
- `qa/evidence/p14/report-popup-final/compare-report-e2e.json`

## 점수

| Task | 배점 | 결과 |
|---|---:|---:|
| P14-A 랜딩·정적 산출물 | 15 | 15 |
| P14-B 분석 엔진/API | 25 | 25 |
| P14-C 분석 레포트 UI | 25 | 25 |
| P14-D 추적성·비동기 안전 | 20 | 20 |
| P14-E E2E·운영 Gate | 15 | 15 |
| **합계** | **100** | **100** |

GitHub Actions run ID와 최종 commit은 원격 Gate 완료 후 평가 문서에 기록한다.
