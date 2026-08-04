# 테스트 계약 인덱스

## 자동 테스트

| 영역 | 파일 |
|---|---|
| Schema·이관·Validator | `test_catalog_contract.py`, `test_catalog_migration.py` |
| API·Runtime·Release | `test_catalog_api.py`, `test_runtime_hosting.py`, `test_release_workflow.py` |
| 비교·분석 | `test_comparison_engine.py`, `test_comparison_analysis.py` |
| 정적 Compare Report | `test_compare_lab_report.py` |
| 공식 경쟁사 조사 | `test_non_lg_official_research.py` |
| P15 성능 맵 | `test_p15_catalog_contract.py`, `test_p15_performance_map.py`, `test_p15_api.py` |
| P18 Release Diff | `test_release_diff.py`, `test_catalog_api.py` |
| P19 Cloudflare 배포 | `test_cloudflare_deploy.py`, `cloudflare/worker.test.mjs` |
| B1 확장 | `test_expansion_batch.py` |

```powershell
$env:PYTHONUTF8='1'
python -m pytest -q
npm --prefix studio test
```

## 요구사항 계약

- [P5 Studio UI](p5-ui-contract.md)
- [P14 안전 비교 분석·보고서](p14-analysis-report-contract.md)
- [P15 RPM/RPS 성능 맵](p15-speed-performance-contract.md)
- [P18 Published Release 변경 Diff](p18-release-diff-contract.md)
- [P19 Cloudflare 경량 배포](p19-cloudflare-deploy-contract.md)

새 기능은 요구사항 ID → RED 테스트 → 구현 → GREEN → E2E Evidence 순으로
연결한다. 특정 Release 번호를 하드코딩하지 않고 활성 포인터와 응답의 일치를
검증한다.
