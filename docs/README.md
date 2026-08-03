# 문서 인덱스

처음에는 루트 [README](../README.md)로 앱을 실행하고 랜딩 페이지를 확인한다.
아래 문서는 목적별 상세 근거다.

## 현재 운영 문서

| 문서 | 용도 |
|---|---|
| [PLAN](PLAN.md) | 전체 Goal, 완료 Phase, 공통 완료기준, 다음 후보 |
| [PROGRESS](PROGRESS.md) | 최신 구현·테스트·GitHub Actions 진행 기록 |
| [UI 아키텍처](05-ui-architecture.md) | 5개 앱 뷰, Compare Report, API·접근성 계약 |
| [Runtime](06-runtime.md) | Studio build, same-origin 실행, 발행 CLI 경계 |
| [운영·362행 확장](07-operations-and-362-expansion.md) | 발행·리허설·롤백·B1 확장 절차 |
| [CI Gate](08-ci-gate.md) | GitHub Actions 단계와 artifact |
| [직접 비교 공백 조사](11-comparison-gap-research-plan.md) | Samsung 19개 비교 공백과 공식 조사 우선순위 |
| [데이터 보완 브리프](DATA-ENRICHMENT.md) | 계절효율·운전영역 등 후속 필드 제안 |

## 계약과 역사 기록

| 문서 | 용도 |
|---|---|
| [01 Scope/Baseline](01-scope-and-baseline.md) | Legacy 기준선과 프로젝트 경계 |
| [02 Data Contract](02-data-contract.md) | Schema, Evidence, 권위·레이어 규칙 |
| [03 Test Plan](03-test-plan.md) | P0~P8 테스트 전략 |
| [04 Migration](04-migration.md) | 최초 68개 Staging 이관 기록 |
| [09 Release Lineage/B1](09-release-lineage-and-b1.md) | source/app SHA 분리와 B1 p.92 검토 |
| [10 Compare UX](10-compare-lab-ux-ideation.md) | 반영 아이디어와 후속 UX 후보 |
| [12 P14 TDD](12-compare-analysis-report-tdd-plan.md) | 안전 비교 분석·보고서 계약 |
| [13 P15 TDD](13-speed-performance-map-tdd-plan.md) | RPM/RPS 성능점과 차트 계약 |
| [14 P16 계획](14-compare-report-detail-plan.md) | 직접 비교 전용 상세 보고서 결과 |

## 문서 유지 규칙

- 현재 수량과 Release는 `catalog/published/active-release.json`을 기준으로 쓴다.
- 과거 RED/GREEN 증거의 당시 Release·수량은 역사 기록이므로 바꾸지 않는다.
- 새 Phase는 `PLAN.md`에 범위를, `PROGRESS.md`에 결과를, `qa/test-runs/`에
  실행 증거를 남긴다.
- 명령은 저장소 루트 PowerShell 기준으로 작성한다.
