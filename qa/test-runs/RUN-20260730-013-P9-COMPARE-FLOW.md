# RUN-20260730-013 · Compare Lab 유형 우선 직접 비교

## 범위

- Re/Ro/Sc 유형을 먼저 선택
- 선택 유형의 Samsung 모델만 표시
- 동일 유형·냉매·측정조건·구동·용량 ±15%·지표 보유 경쟁 모델만 표시
- 후보 0건 안내와 비교 실행 차단
- 직접 비교 준비도와 후속 분석 UX 아이디어 정리

## RED / GREEN

| 검증 | 결과 |
|---|---|
| 신규 UI 계약 | 구현 전 3건 FAIL 확인 |
| Studio Vitest | 27 passed |
| Python | 49 passed |
| Studio production build | PASS |
| Release | `release:2026-07-30:003` PUBLISHED |
| Application SHA | `fba9d6688d5f5fc486b6b8c3fb77f3ab1e52e325` |
| Data SHA-256 | `5c532241c74768528412550f0139b820dda651ee3aefb321aa2fecdee1c77524` |
| Validation | Critical 0 / Major 0 / Warning 2 |

## Browser / E2E

| Run | Viewport | 시나리오 | 결과 | Screenshot |
|---|---|---:|---|---:|
| `local-run-1` | 1440×1024, 390×844 | 14/14 | PASS | 14 |
| `local-run-2` | 1440×1024, 390×844 | 14/14 | PASS | 14 |

- G1: Sc → EER → DS8LC5040IN → STDA031N1ULB 선택 후 `DIRECT_OK`, EER Δ와 동일군 순위 표시
- G2: Ro → COP → UB8TN8300F 선택 시 조건 불일치 `ATQ360D1UMU` 미노출, 후보 0건과 실행 비활성
- 두 Run 모두 외부 요청, console/page error, request failure, HTTP 400+, 금지 쓰기 요청 0건
- Agent Browser에서도 초기 잠금, 직접 후보 2건, `DIRECT_OK`를 실제 조작으로 확인

## 확인 위치

- 화면: `http://127.0.0.1:8000/?view=compare`
- 직접 비교 이미지: `qa/evidence/p9/local-run-2/screenshots/desktop-1440x1024-g1-direct.png`
- 후보 없음 이미지: `qa/evidence/p9/local-run-2/screenshots/mobile-390x844-g2-incompatible-hidden.png`
- E2E 결과: `qa/evidence/p9/local-run-2/p5-e2e.json`
- UX 아이디어: `docs/10-compare-lab-ux-ideation.md`
