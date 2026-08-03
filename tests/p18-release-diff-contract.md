# P18 Release Diff 테스트 계약

## 요구사항

| ID | 계약 |
|---|---|
| `REQ-P18-001` | Diff는 활성 Release와 직전/롤백 원본 Release를 `modelId`로 비교한다. |
| `REQ-P18-002` | 양쪽 Release의 Bundle SHA-256을 검증하고 불일치·누락은 503으로 차단한다. |
| `REQ-P18-003` | 추가·삭제·변경 모델과 specs·Evidence·performanceMaps 변경 모델 수를 구분한다. |
| `REQ-P18-004` | 객체는 leaf path, 배열은 field path와 item count만 반환해 응답을 제한한다. |
| `REQ-P18-005` | 최초 Release는 `FIRST_RELEASE`와 0건 요약을 반환한다. |
| `REQ-P18-006` | Release / Evidence UI는 From→To와 변경 모델·경로를 표시하고 편집·복원 기능을 만들지 않는다. |

## Test ID

| Test | 검증 |
|---|---|
| `P18-UT-DIFF-001` | synthetic 추가·삭제·spec·Evidence 변경과 정렬 |
| `P18-UT-DIFF-002` | 실제 Release 005→001에서 performanceMaps 2모델 |
| `P18-API-DIFF-001` | 최초 Release `FIRST_RELEASE` |
| `P18-API-DIFF-002` | active/previous 무결성 검증과 현재 Release 일치 |
| `P18-UT-UI-001` | UI 요약 0/0/2/2와 두 모델·경로 표시 |
| `P18-E2E-DIFF-001-D/M` | 실제 Release 화면 desktop/mobile Diff 및 공통 Guard |

## Hard Gate

- 변경 없는 모델을 변경으로 표시하지 않는다.
- `sourceRecords`, `bundleId`, `asOf`만 바뀐 경우 모델 변경 수는 0이다.
- 배열 원문 전체를 API 응답에 복제하지 않는다.
- 읽기 전용 GET 외 발행·수정·롤백 요청은 0건이다.
- 총점 96/100 이상, Critical 0, Major 0, E2E retries 0이다.
