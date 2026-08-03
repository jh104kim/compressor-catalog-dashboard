# P18 Release 간 변경 Diff TDD 개발안

> 상태: 로컬 완료. 전체 회귀와 desktop/mobile 2회 연속 PASS, 원격 Gate는 push commit에서 확인한다.

## Goal

`Release / Evidence` 화면에서 활성 Published Release와 직전 불변 Release의
모델·수치·Evidence·성능맵 변경을 읽기 전용으로 확인한다.

## Current structure

- `FileReleaseStore`: 불변 Release와 활성 포인터, 해시 검증 담당
- `GET /api/v1/releases/active`: 현재 Release metadata와 모델 수 제공
- `ReleaseEvidence`: 승인자·SHA·Warning·B1 확장 상태 표시
- 현재 `release:2026-08-03:001`은 직전 `release:2026-07-30:005` 대비
  Samsung/Panasonic 2모델에 공식 `performanceMaps`가 추가됐다.

## Proposed approach

1. 순수 Python Diff 엔진이 `modelId` 기준으로 추가·삭제·변경을 계산한다.
2. 객체는 leaf field path까지, 배열은 배열 field path와 item count만 반환한다.
3. `specs`, 기본 Evidence, `performanceMaps` 변경 모델 수를 따로 집계한다.
4. `GET /api/v1/releases/active/diff`가 현재·직전 Release 해시를 모두 검증한 뒤
   요약만 제공한다.
5. UI는 변경 수와 모델별 field path를 표시하되 과거 Bundle 편집·복원 기능은
   제공하지 않는다.

## Task and score

| Task | 배점 | 완료기준 |
|---|---:|---|
| P18-A Diff 엔진 | 25 | 추가·삭제·변경·정렬·field path 결정론적 PASS |
| P18-B API·무결성 | 25 | active/previous 해시 검증, FIRST_RELEASE, 오류 계약 PASS |
| P18-C Release UI | 20 | From→To, 6개 요약, 모델·경로 표시, 편집 기능 0 |
| P18-D TDD·E2E | 20 | RED→GREEN, desktop/mobile, retries 0, 오류·overflow 0 |
| P18-E 문서·운영 | 10 | README·PLAN·PROGRESS·계약·평가표 최신화 |
| **합계** | **100** | **96 이상**, Critical 0, Major 0 |

## Risks

- 배열의 모든 점을 응답하면 payload가 커질 수 있어 item count로 제한한다.
- `sourceRecords`, bundleId, 생성시각 같은 provenance 차이는 모델 의사결정
  Diff에서 제외한다.
- 롤백 포인터에서는 `rollbackFromReleaseId`를 우선 기준으로 사용한다.
- 직전 Release가 없으면 `FIRST_RELEASE`, 파일이 없거나 해시가 틀리면 503이다.

## Test plan

- Python: synthetic 추가·삭제·spec·Evidence 및 실제 Release의 performanceMaps 2건
- API: 최초 Release, active→previous, 이전 Release 무결성 오류
- Vitest: Release Diff 요약과 변경 모델 경로, Release ID 일치
- Playwright: 1440×1024와 390×844에서 실제 2모델·performanceMaps 2건,
  외부요청·쓰기·console/page/network 오류·페이지 overflow 0

## Done criteria

1. API와 UI의 `toReleaseId`가 활성 Release와 일치한다.
2. 실제 Diff는 추가 0, 삭제 0, 변경 2, 성능맵 변경 2를 표시한다.
3. 변경 모델은 `ENV4A5DL2B`, `TKF76E25DCH-52RPS`이고 경로는
   `performanceMaps`다.
4. 기존 P0~P17 전체 회귀와 GitHub Actions Gate가 PASS한다.

## Local result

- Python 99 passed, Vitest 38/38, build 583 modules
- P5/P18 desktop/mobile 16/16을 retries 0으로 2회 연속 PASS
- Compare Report 2/2, P14 6/6, P15/P16 8/8 회귀 PASS
- 실제 Diff 0/0/2, 성능맵 2, 양쪽 Bundle integrity PASS
- Task 100/100, 품질 환산 99.2/100, Critical 0, Major 0
