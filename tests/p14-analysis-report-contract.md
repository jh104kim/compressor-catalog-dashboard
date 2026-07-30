# P14 Compare Analysis / Reporting 테스트 계약

## 1. 요구사항

| Requirement | 계약 |
|---|---|
| `REQ-P14-001` | 랜딩 사이드바 `Compare Report` 탭은 정적 HTML을 `compareLabReport` 팝업으로 연다. |
| `REQ-P14-002` | 활성 Release에서 HTML과 CSV를 동시에 생성하며 CSV는 DIRECT_OK 15건과 일치한다. |
| `REQ-P14-003` | 안전 비교 실행은 기존 비교 판정과 결정론적 추가 분석을 같은 Release에서 반환한다. |
| `REQ-P14-004` | 분석 레포트는 조건 안전성·수치 해석·신뢰도/Evidence·포트폴리오 시사점·후속 조치/한계 5개 섹션을 제공한다. |
| `REQ-P14-005` | 출력물은 Release ID, Samsung/경쟁 모델 ID, metric, Evidence locator를 포함한다. |
| `REQ-P14-006` | 유형·모델·지표 변경 후 도착한 지연 응답은 stale로 폐기해 화면과 출력물에 반영하지 않는다. |

## 2. 고정 도메인 계약

- 판정은 `DIRECT/REFERENCE/BLOCKED` 세 종류다.
- 직접 비교 키는 유형×냉매×측정조건×구동이며 용량 허용범위는 ±15%다.
- **군 교차 순위 금지**: 조건이나 구동이 다르면 직접 순위·Δ·우열을 만들지 않는다.
- DIRECT의 경쟁사 Δ는 `(경쟁사 − Samsung) ÷ Samsung × 100`이다.
- REFERENCE/BLOCKED는 `rankingAllowed=false`, `deltaPct=null`을 유지한다.
- 분석 문구는 Published 카탈로그 필드와 Evidence에 있는 정보만 사용한다.

## 3. 분석 응답 계약

`POST /api/v1/compare/report`는 다음 구조를 목표로 한다.

```json
{
  "releaseId": "release:2026-07-30:005",
  "comparison": {
    "verdict": "DIRECT",
    "code": "DIRECT_OK",
    "metric": "eer",
    "capacityDiffPct": 6.21,
    "deltaPct": -3.16,
    "rankingAllowed": true
  },
  "analysis": {
    "executiveSummary": "...",
    "conditionSafety": {},
    "performanceInterpretation": {},
    "evidenceConfidence": {},
    "portfolioImplications": [],
    "recommendedActions": [],
    "limitations": [],
    "evidenceRefs": []
  }
}
```

REFERENCE/BLOCKED에서는 `performanceInterpretation`이 승패를 말하지 않고
`limitations`와 확보 필요 데이터만 제공한다.

## 4. Unit / API 테스트

| Test ID | 연결 REQ | RED fixture | 합격 기준 |
|---|---|---|---|
| `P14-UT-NAV-001` | 001 | Compare Report 탭 없음 | 사용자 클릭 1회로 명명된 팝업 URL 호출 |
| `P14-UT-CSV-001` | 002 | HTML만 생성 | CSV 15행, 전부 `DIRECT_OK`, HTML과 Release 동일 |
| `P14-API-ANALYSIS-001` | 003,004 | DS8LC5040IN↔STDA031N1ULB EER | DIRECT_OK, 용량 6.21%, 경쟁사 Δ 음수, Samsung 우위 해석 |
| `P14-API-ANALYSIS-002` | 003 | 조건 불일치 | BLOCKED, 순위·Δ·우열 표현 없음 |
| `P14-API-ANALYSIS-003` | 005 | Evidence 포함 pair | 양쪽 modelId·sourcePath·locator와 Release ID 유지 |
| `P14-UT-ANALYSIS-001` | 004 | DIRECT 분석 UI | 5개 섹션과 안전 판정·한계 표시 |
| `P14-UT-ANALYSIS-002` | 003,004 | BLOCKED 악성 Δ fixture | UI가 Δ·순위를 버리고 안전 오류 표시 |
| `P14-UT-STALE-001` | 006 | 비교 A 지연 중 비교 B 선택 | A 결과·분석·출력 버튼이 DOM에 0개 |

## 5. Playwright E2E

모든 시나리오는 데스크톱 `1440×1024`와 모바일 `390×844`에서 retries 0으로
실행한다.

| Test ID | 사용자 흐름 | 합격 기준 |
|---|---|---|
| `P14-E2E-POPUP-001` | 랜딩 → Compare Report 탭 | 새 팝업 URL이 `/compare-lab-output.html` |
| `P14-E2E-CSV-001` | 보고서 → CSV 내려받기 | HTTP 200, 헤더+15행, Release 005, 코드 DIRECT_OK |
| `P14-E2E-ANALYSIS-001` | Sc → EER → 직접 pair → 안전 비교 | DIRECT 결과와 분석 5개 섹션, 수치 일치 |
| `P14-E2E-BLOCK-001` | 조건 불일치 API fixture | BLOCKED, 순위·Δ·승패 0개, 확보 필요 데이터 표시 |
| `P14-E2E-TRACE-001` | 분석 Evidence 열기 → 출력 | Release·두 모델·원천 locator가 출력물에도 유지 |
| `P14-E2E-STALE-001` | A 요청 지연 중 모델/지표 B로 변경 | 지연 응답 stale 결과 0개, B 선택 유지 |
| `P14-E2E-MOBILE-001` | 모바일 전체 흐름 | 페이지 overflow 0, 내부 표만 가로 스크롤 |

공통 Gate:

- 외부 요청 0, `console.error` 0, `pageerror` 0, 실패 요청/HTTP 400+ 0.
- UI에서 편집·발행 API 요청 0.
- BLOCKED/REFERENCE에서 우위·열위·승·패·TOP·순위·Δ 0.
- 로컬 2회 연속 PASS + GitHub Actions Chromium 1회 PASS.

## 6. Task 점수

| Task | 배점 | 만점 조건 |
|---|---:|---|
| P14-A 랜딩·정적 산출물 | 15 | 팝업·HTML·CSV·CI 재생성·2 viewport PASS |
| P14-B 분석 엔진/API | 25 | 세 판정별 스키마·수치·금지표현 PASS |
| P14-C 분석 레포트 UI | 25 | 5개 섹션·상태·인쇄/출력 PASS |
| P14-D 추적성·비동기 안전 | 20 | Evidence 완전성·지연 응답 stale 0 |
| P14-E E2E·운영 Gate | 15 | 2회 로컬·CI·접근성·오류 0 |
| **합계** | **100** | **96/100 이상** |

Task 점수 외에 독립 Judge가 다음 5개 품질축을 각각 5점 만점으로 평가한다.

1. 기능 완전성
2. 비교 안전성과 도메인 정확성
3. Release/Evidence 추적성
4. UX·접근성·E2E 검증가능성
5. 유지보수성·TDD 규율

합격은 각 축 `4.8/5` 이상, `Critical 0`, `Major 0`, 총점 `96/100` 이상이다.
독립 Judge 보완 루프는 **최대 3회**이며, 미달 항목은 같은 TEST-ID로 RED 재현
후 수정한다.

## 7. REQ / TEST / RUN 증거

완료 Task는 다음 필드를 모두 기록한다.

| 필드 | 필수값 |
|---|---|
| task_id / requirement_id | P14 Task와 REQ ID |
| artifact_path | 코드·HTML·CSV·문서 실제 경로 |
| test_id | Unit/API/E2E ID |
| expected / actual | 기대값과 실행 결과 |
| evidence_path | JSON·스크린샷·RUN 문서 |
| version_or_commit | Git SHA |
| reviewer_or_judge | 실행자 또는 독립 Judge |

지연 응답 테스트는 최소 500ms의 의도적 지연 후 선택을 변경하고, stale 응답이
비교 결과·분석 레포트·다운로드 기록 어디에도 남지 않음을 증명해야 한다.
