# P19 Cloudflare 경량 배포

## 목적

React Studio, Compare Report, 조회·비교 API를 한 `workers.dev` origin에서
제공하되 무료 Workers 번들 한도를 넘지 않는다.

## 구조

```text
Published Release SHA 검증
  → studio production build
  → _runtime JSON 생성(active/catalog/diff/rules/B1)
  → Cloudflare Static Assets
  → worker.js가 /api/*만 계산·응답
```

- `worker.js`: 외부 의존성 없는 조회·비교·분석·RPM/RPS API
- `studio/dist`: SPA, 정적 보고서, CSV, Legacy, 공식 PDF, runtime JSON
- `prepare_cloudflare_deploy.py`: 활성·직전 Release SHA 검증 후 asset 생성
- Publish·Rollback API와 쓰기 저장소는 배포 Worker에 포함하지 않는다.

## 완료 기준

1. Worker script 100KB 미만, npm runtime dependency 0개
2. Wrangler dry-run gzip 3MB 미만
3. FastAPI와 대표 8개 API JSON 동등
4. 로컬 P5 16/16, Report 2/2, P14 6/6, P15 8/8
5. 영구 URL에서 같은 E2E와 공식 PDF `application/pdf` 응답 PASS
6. Critical 0, Major 0, 콘솔·페이지·network·overflow 0

## 배포

```powershell
$env:PYTHONUTF8='1'
$env:NODE_OPTIONS='--use-system-ca'
python scripts/build_compare_lab_report.py
npm --prefix studio run build
python scripts/prepare_cloudflare_deploy.py
npm --prefix cloudflare test

Push-Location cloudflare
npx --yes wrangler@4.118.0 deploy --dry-run
npx --yes wrangler@4.118.0 login
npx --yes wrangler@4.118.0 deploy
Pop-Location
```

임시 preview 배포는 공식 PDF 8.57MB가 preview 단일 asset 5MB 제한을 넘는다.
따라서 preview는 UI/API 검수에만 사용하고, 영구 계정 배포에서 PDF 포함 최종
검수를 수행한다. 임시 URL과 claim token은 운영 문서나 Git에 저장하지 않는다.

## 현재 결과

- Worker: 25,212 bytes, dry-run gzip 6.75KB
- API parity: 8/8 PASS
- 로컬 Chromium: 32/32 PASS
- 임시 원격 Chromium: 30/32 PASS; PDF 2건만 preview 제한으로 제외
- 상태: 영구 Cloudflare 계정 인증 대기
