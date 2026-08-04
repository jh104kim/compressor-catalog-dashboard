# P19 Cloudflare Workers 배포 계약

## 요구사항

| ID | 계약 |
|---|---|
| `REQ-P19-001` | React production build와 조회·비교 API를 하나의 Cloudflare Worker origin에서 제공한다. |
| `REQ-P19-002` | `/api/*`는 의존성 없는 JavaScript Worker를 먼저 실행하고 나머지 navigation은 SPA asset fallback을 사용한다. |
| `REQ-P19-003` | Worker는 활성·직전 Published Release의 Bundle SHA를 배포 전에 검증한다. |
| `REQ-P19-004` | Worker에는 조회·비교 API만 포함하며 Publish·Rollback API를 만들지 않는다. |
| `REQ-P19-005` | 공식 PDF와 Legacy 기준 화면을 정적 asset으로 함께 제공한다. |
| `REQ-P19-006` | 배포 URL에서 health, Release Diff, Compare Lab, Compare Report를 실제 검증한다. |
| `REQ-P19-007` | Worker script는 100KB 미만이며 npm runtime dependency를 사용하지 않는다. |

## 테스트

| ID | 검증 |
|---|---|
| `P19-UT-CONFIG-001` | JavaScript Worker, static assets, SPA, `/api/*` worker-first 설정 |
| `P19-UT-PACK-001` | 검증된 Published Release를 읽어 active·catalog·diff·rules·B1 runtime JSON 생성 |
| `P19-UT-ASSET-001` | 공식 PDF와 Legacy 파일을 production asset에 복사 |
| `P19-UT-BOUNDARY-001` | JavaScript fetch handler와 조회 전용 경계 |
| `P19-UT-PARITY-001` | direct/reference/blocked 비교와 분석·RPM/RPS 응답 계약 |
| `P19-UT-SIZE-001` | Worker 100KB 미만, runtime dependency 0개 |
| `P19-E2E-001` | workers.dev health·Release·Diff·UI·보고서 smoke |

## 완료기준

- Python/Vitest/build 기존 회귀 PASS
- `pywrangler deploy --dry-run` PASS
- workers.dev 영구 URL 발급
- 원격 health 200, 활성 Release `release:2026-08-03:001`
- 원격 P5/P18 및 Compare Report 핵심 smoke PASS
- `wrangler deploy --dry-run` 압축 크기가 Free plan 한도 이하
- Critical 0, Major 0, 비밀정보 커밋 0
