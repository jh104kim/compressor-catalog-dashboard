# QA 인덱스

Playwright 러너는 서버를 시작하지 않는다. 먼저 루트에서 Compare Report와
Studio를 빌드하고 FastAPI Runtime을 실행한다.

```powershell
python scripts/build_compare_lab_report.py
npm --prefix studio run build
python -m uvicorn backend.catalog_audit.main:create_runtime_app --factory --host 127.0.0.1 --port 8000
```

다른 터미널에서 실행한다.

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:8000/'
$env:REPORT_BASE_URL=$env:E2E_BASE_URL
$env:P14_BASE_URL=$env:E2E_BASE_URL
$env:P15_BASE_URL=$env:E2E_BASE_URL

npm --prefix qa run test:p5
npm --prefix qa run test:report
npm --prefix qa run test:p14
npm --prefix qa run test:p15
```

| 러너 | 범위 | 기본 Evidence |
|---|---|---|
| `test:p0` | Legacy 5탭 기준선 | `qa/baseline/`, `qa/evidence/p0/` |
| `test:p5` | Studio G1~G8 desktop/mobile | 지정 `OUTPUT_DIR` 또는 timestamp 폴더 |
| `test:report` | 정적 보고서 popup·CSV 회귀 | 지정 `OUTPUT_DIR` |
| `test:p14` | 안전 비교 분석·출력 | 지정 `OUTPUT_DIR` |
| `test:p15` | RPM/RPS와 P16 직접 비교 상세 | 지정 `OUTPUT_DIR` |

현재 최종 P16 증거:

- `qa/evidence/p16/local-run-3/p15-speed-e2e.json`
- `qa/evidence/p16/local-run-3/screenshots/`
- `qa/evidence/p16/report-regression/compare-report-e2e.json`
- `qa/test-runs/RUN-20260803-017-P16-RED-GREEN.md`

공통 Gate는 retries 0, 외부 요청·console/page 오류·HTTP 400+·금지 쓰기·페이지
전체 overflow 0이다. 중간 디버그 캡처는 `.gitignore`로 제외하고 최종 증거만
커밋한다.
