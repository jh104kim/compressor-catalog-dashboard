# RUN-20260804-019 — P19 Cloudflare 경량 배포

## RED

- Wrangler가 `worker.py`와 `python_workers`를 사용해 gzip 6.68MB 생성.
- JavaScript Worker, runtime JSON, size/dependency 계약 부재로 P19 4건 실패.

## GREEN

- Python 계약 4/4, Node Worker 계약 3/3 PASS.
- Worker 25,212 bytes; Wrangler dry-run gzip 6.75KB.
- FastAPI ↔ Worker API 8개 JSON 완전 일치.
- 로컬 Worker: P5 16/16, Report 2/2, P14 6/6, P15 8/8.

## 원격 preview

- Cloudflare 임시 preview 배포 성공, Worker startup 8ms.
- Report 2/2, P14 6/6, P15 8/8 PASS.
- P5 14/16: 임시 계정 단일 asset 5MB 제한으로 8.57MB 공식 PDF를 preview에서만 제외.
- 영구 계정 로그인 후 PDF 포함 P5 16/16 재실행이 hard gate다.
