# P5 Studio E2E 실행

전체 QA 실행기 안내는 [QA 인덱스](README.md)를 먼저 본다.

P5 러너는 서버를 시작하지 않는다. 먼저 FastAPI Runtime을 별도 터미널에서
실행한 뒤, 저장소 루트에서 러너를 실행한다.

```powershell
$env:E2E_BASE_URL='http://127.0.0.1:8000/'
$env:OUTPUT_DIR='C:\ai\ai_coding_pjt\2606-Compressor-Catalog-Dashboard\qa\evidence\p5\local-run-1'
$env:BROWSER_EXECUTABLE='C:\Program Files\Google\Chrome\Application\chrome.exe' # Playwright Chromium 미설치 시 선택
npm --prefix qa run test:p5
```

`OUTPUT_DIR`은 선택사항이다. 생략하면
`qa/evidence/p5/<UTC timestamp>/`에 다음 증거를 저장한다.
`BROWSER_EXECUTABLE`도 선택사항이며 CI는 설치된 Playwright Chromium을 사용한다.

- `p5-e2e.json`
- `screenshots/` 아래 2 viewport × G1~G8, 총 16장

러너 조건:

- Chromium, `retries=0`
- `1440×1024`, `390×844`
- G1~G8 실제 UI와 API 검증
- 외부 요청, console/page/network 오류, HTTP 400 이상, 금지 쓰기 요청 0
- 페이지 전체 가로 overflow와 미해결 보간 0

PASS는 종료 코드 0, FAIL은 JSON을 저장한 뒤 종료 코드 1을 반환한다.
