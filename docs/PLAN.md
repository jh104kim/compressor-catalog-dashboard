# Catalog Audit Studio 전체 개발 계획

> 최종 갱신: 2026-08-03
> 현재 기본 제품: Published Release 기반 FastAPI + React Studio

## Goal

Samsung Re/Ro/Sc 모델을 기준으로 공개 카탈로그를 검증하고, 같은 조건의 경쟁
모델만 직접 비교하며, 비교가 불가능한 영역은 공식 자료 리서치 과제로 전환한다.

## 완료된 Phase

| Phase | 결과 | 상태 |
|---|---|---|
| P0~P4 | 기준선, Schema, 이관, Validator, 조회·비교 API | 완료 |
| P5~P8 | React Studio, same-origin Runtime, CI, Release 계보·B1 | 완료 |
| P9~P13 | 유형 우선 Compare Lab, 직접 후보 필터, 비-LG 공식 조사 | 완료 |
| P14 | Compare Report 팝업, 안전 비교 추가 분석·출력 | 완료 |
| P15 | RPM/RPS 원천 성능점 계약·API·Recharts | 완료 |
| P16 | 직접 비교 가능한 항목만 상세 Recharts 보고서에 표시 | 완료 |
| P17 | README·운영 문서·QA 인덱스·폴더 정비 | 완료 |

## 현재 제품 범위

- Overview, Catalog Checks, Compare Lab, Portfolio Gaps, Release / Evidence
- Compare Report 명명 팝업과 CSV·인쇄/PDF
- 76모델(Samsung 27, 경쟁사 49), 13개 비교군
- 직접 비교 가능한 Samsung 8모델, DIRECT_OK 15건
- 공식 성능점이 있는 쌍만 RPM/RPS 차트 제공
- Published Release 조회 전용 UI; 편집·발행 UI 없음
- Legacy DC는 `/legacy/` 회귀 기준선으로 유지

## 공통 완료기준

1. 같은 유형·냉매·측정조건·구동, 용량 ±15%, 같은 지표만 직접 비교한다.
2. REFERENCE/BLOCKED에서 순위·Δ·승패 문구를 만들지 않는다.
3. 원천에 없는 값과 속도점은 보간·외삽·임의 환산하지 않는다.
4. 모든 결과가 활성 Release ID, 모델 ID, Evidence locator로 추적된다.
5. Critical 0, Major 0을 유지한다.
6. Python, Vitest, production build, desktop/mobile Playwright를 통과한다.
7. E2E retries 0, 콘솔·페이지·외부요청·금지쓰기·페이지 overflow 0이다.

## 운영 흐름

```text
공식 자료 조사
  → Staging 정규화
  → Schema·도메인 Validator
  → 승인 및 새 불변 Release
  → Compare Report 생성
  → Studio build
  → Unit/API/E2E
  → Release / Evidence 검수
```

상세 실행과 담당 문서는 [문서 인덱스](README.md)에서 찾는다.

## 다음 후보

| 우선순위 | 아이디어 | 시작 조건 |
|---|---|---|
| P1 | Release 간 모델·수치·Evidence 변경 Diff | 이전/현재 Release 비교 계약 확정 |
| P2 | 동일 비교군 용량-효율 산점도 | 군별 표본 수와 축 단위 검증 |
| P2 | 공식 카탈로그 변경 감지 큐 | URL·파일 해시와 승인 흐름 확정 |

다음 Phase도 테스트 계약과 RED 증거를 먼저 만들고, 구현 후 독립 평가 기준으로
완료 여부를 판정한다.
