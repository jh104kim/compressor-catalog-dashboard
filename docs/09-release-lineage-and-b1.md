# Release 계보와 B1 Scroll 검토 결과

## 적용 결과

- `sourceCommit`: 68개 Published 데이터가 생성된 입력 커밋
- `appGitSha`: API·Studio·검증 코드의 구현 커밋
- 두 SHA는 Release metadata, 활성 포인터, API, Release / Evidence 화면,
  CI Gate에서 각각 확인한다.

## B1 Scroll p.92

공식 `Samsung-Compressor-Catalogue_2024.pdf` p.92를 PNG와 텍스트로
직접 대조했다.

| 항목 | 결과 |
|---|---:|
| 원천 행 | 16 |
| 고유 모델 | 16 |
| 기존 Published 모델 연결 | 8 |
| 신규 후보 | 8 |
| 측정조건 미확인 | 16 |
| 비교 허용 | 0 |
| 발행 상태 | `NOT_PUBLISHED` |

p.92 표에는 냉매·모델·용량·EER·COP 등은 있지만 측정조건 표기가 없다.
따라서 유형만 보고 ARI로 채우지 않고 B1 후보 16행 모두 `UNKNOWN`으로
유지한다. 기존 Published 모델의 조건값은 기존 승인 근거를 그대로 유지하며,
B1 후보를 이유로 덮어쓰지 않는다.

검토 파일은 `catalog/expansion/b1-scroll-p92.json`, 생성기는
`scripts/build_b1_scroll_batch.py`, 자동 Gate는
`backend/catalog_audit/expansion.py`다.

## 화면 확인

1. 루트에서 `studio` production build를 만든다.
2. FastAPI Runtime을 8000 포트로 실행한다.
3. `http://127.0.0.1:8000/?view=release`를 연다.
4. `Release 추적 정보`에서 Data source SHA와 Application SHA를 확인한다.
5. `362-ROW EXPANSION · B1`에서 `16 / 8 / 8 / 16`,
   `NOT_PUBLISHED`, `비교 허용 0건`을 확인한다.
6. `공식 PDF p.92 열기`로 원천 표를 대조한다.
