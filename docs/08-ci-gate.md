# P6 GitHub Actions CI Gate

## 목적

기존 `.github/workflows/catalog-audit-gate.yml` 한 개를 유지하면서 P0 계약과 P5 View-first Runtime을 Ubuntu Chromium에서 함께 검증한다.

## 실행 순서

1. Python 3.12 의존성 1회 설치
2. 전체 pytest
3. Draft 2020-12 Schema 검사
4. 활성 포인터가 가리키는 실제 Release의 상태·해시·승인·76/27/49·B1 검증
5. Node 24 설정과 QA 의존성 1회 설치
6. Playwright Chromium 1회 설치
7. 기존 P0 Characterization 1회
8. Studio `npm ci → Vitest → Compare Report 생성 → build`
9. FastAPI same-origin Runtime을 동적 포트로 기동
10. P5, Compare Report, P14 분석, P15/P16 속도·상세 보고서 E2E 1회
11. P0·P5·P15 Evidence artifact 업로드

Job 제한시간은 30분이며 `P0_RETRIES=0`, `P5_RETRIES=0`, `P15_RETRIES=0`이다. 실패 테스트를 재시도로 통과시키지 않는다.

## Release Gate

CI는 Release를 새로 발행하지 않고 저장소의 실제 활성 Release를 읽기만 한다.

- Release ID: `catalog/published/active-release.json`에서 동적 조회
- 상태: `PUBLISHED`
- Validation: Critical 0, Major 0
- 모델: 전체 76, Samsung 27, 경쟁사 49
- 활성 포인터·Release metadata·Bundle SHA-256 일치
- 승인자·승인시각 존재
- `sourceCommit`: 소문자 40자리 Git SHA
- `appGitSha`: 소문자 40자리 Git SHA
- B1: 16행, 기존 모델 연결 8, 신규 후보 8, 조건 UNKNOWN 16,
  `NOT_PUBLISHED`

## Runtime E2E

FastAPI는 `catalog/published`와 `studio/dist`를 같은 origin에서 제공한다. CI가 빈 동적 포트를 선택하고 `/api/v1/health` 준비 완료 후 P5 Chromium을 실행한다.

E2E에 전달하는 환경변수:

- `BASE_URL`, `E2E_BASE_URL`: same-origin Runtime URL
- `E2E_APP_PORT`: 선택된 동적 포트
- `OUTPUT_DIR`: `qa/evidence/p5/github-actions`
- `P5_RETRIES=0`
- `REPORT_BASE_URL`, `P14_BASE_URL`, `P15_BASE_URL`: 같은 Runtime URL

## Artifact

- P0: `p0-catalog-audit-<run_id>-<attempt>`
- P5: `p5-catalog-audit-<run_id>-<attempt>`
- P15/P16: `p15-speed-performance-<run_id>-<attempt>`

P5 artifact에는 Release 검사 로그, Runtime 로그, health 응답, P5·정적 보고서·P14 로그와 결과·스크린샷을 포함한다. P15/P16 artifact는 속도·상세 보고서 결과를 보존한다. 실패해도 `if: always()`로 업로드한다.

## 과거 Release 003 실행 증거

- 대상 SHA: `cf95c93dc59f9422881353dbff5154be7efbac0d`
- Actions Run: [30523905496](https://github.com/jh104kim/compressor-catalog-dashboard/actions/runs/30523905496)
- 결과: PASS, 1분 15초
- P0 Artifact: `p0-catalog-audit-30523905496-1` (3,523,669 bytes)
- P5 Artifact: `p5-catalog-audit-30523905496-1` (1,574,354 bytes)
- P5 Artifact 내용 확인: 12/12 PASS, 스크린샷 12장

Release의 `sourceCommit`은 **카탈로그 데이터 발행 입력 SHA**이고,
`appGitSha`는 **앱·검증 코드 SHA**다. 두 역할을 Release metadata 안에서
분리해 추적한다. Published Bundle 내부의 `meta.stage=STAGING`은
입력 bytes와 SHA를 보존하기 위한 provenance이며 API/UI 상태로 노출하지 않는다.
