# P15 속도별 성능 맵 테스트 계약

## 1. 요구사항

| Requirement | 계약 |
|---|---|
| `REQ-P15-001` | 속도 성능점은 활성 Published Release의 별도 `performanceMaps`에 저장하며 모든 점이 모델·조건·Evidence로 추적된다. |
| `REQ-P15-002` | API는 원천 rpm/rps를 보존하고 `rpm = rps × 60`만 정확히 파생한다. Hz를 RPM/RPS로 해석하지 않는다. |
| `REQ-P15-003` | 양쪽 모델이 Gate를 충족한 직접 비교쌍만 `chartEligible=true`이며 원천점 수와 그려진 점 수가 일치하고 보간·외삽 생성점은 0개다. |
| `REQ-P15-004` | Compare Lab은 eligible 비교쌍에 RPM/RPS와 양쪽 Evidence가 완결된 지표의 Recharts, 접근 가능한 원시점 표와 Evidence를 제공한다. 현재 Re Golden은 용량·COP만 노출한다. |
| `REQ-P15-005` | 미검증 Ro/Sc 비교쌍은 `DATA_REQUIRED`, `chartEligible=false`, 차트 0개이며 확보할 공식 자료를 안내한다. |
| `REQ-P15-006` | 유형·모델·비교지표 변경 뒤 도착한 지연 응답은 속도 차트·표·출력물을 포함해 stale로 폐기한다. |
| `REQ-P15-007` | 정적 Compare Report에도 eligible 속도 분석·CSV·print를 제공하고 기존 popup/전체 CSV/Compare Lab 링크를 회귀 없이 유지한다. |

## 2. 고정 도메인 계약

- 첫 eligible Re 쌍은 `model:samsung:ENV4A5DL2B`와
  `model:panasonic:TKF76E25DCH-52RPS`다.
- `speedAnalysis.status`는 `CURVE_READY|POINT_READY|REFERENCE_ONLY|DATA_REQUIRED`다.
- Re Golden은 `CURVE_READY`, `chartEligible=true`다. 정확히 겹치는 속도점이
  없으므로 속도점 기준 `rankingAllowed=false`를 유지한다.
- `metricOptions`는 양쪽 series에 완결된 공개 성능점이 있는 지표만 포함한다.
  현재 Re Golden은 `capacityW`, `cop`이며 Panasonic의 `inputW`, `eer`가
  미공개인 동안 해당 토글과 값은 생성하지 않는다.
- Sc Golden `model:samsung:DS8LC5040IN` ↔
  `model:gmcc:STDA031N1ULB`는 `DATA_REQUIRED`, 차트 0개다.
- 성능점 원천 단위는 `rpm|rps`만 허용한다. `Hz`는 전원·시험 주파수일 수 있어
  회전속도 환산 근거가 아니다.
- 차트 선은 관측점 연결만 허용한다. API와 UI가 새로운 성능값을 보간·외삽·회귀로
  생성하지 않는다.
- Release ID는 특정 번호로 고정하지 않고 `/api/v1/releases/active`와 모든
  응답·출력의 일치 여부로 검증한다.

## 3. API 응답 계약

`POST /api/v1/compare/report`는 기존 필드와 함께 최상위 `speedAnalysis`를 반환한다.

```json
{
  "releaseId": "release:...",
  "comparison": {},
  "analysis": {},
  "speedAnalysis": {
    "status": "CURVE_READY",
    "chartEligible": true,
    "rankingAllowed": false,
    "reason": "...",
    "metricOptions": ["capacityW", "cop"],
    "commonRange": {
      "rpm": {"min": 1650, "max": 3650},
      "rps": {"min": 27.5, "max": 60.833333333333336}
    },
    "series": [
      {
        "role": "baseline",
        "modelId": "model:samsung:ENV4A5DL2B",
        "manufacturer": "Samsung",
        "model": "ENV4A5DL2B",
        "pointCount": 4,
        "lineEligible": true,
        "points": [
          {
            "speedValue": 1650,
            "speedUnit": "rpm",
            "rpm": 1650,
            "rps": 27.5,
            "capacityW": 148,
            "inputW": 75,
            "cop": 1.97,
            "eer": 6.72,
            "valueKind": "MEASURED",
            "evidence": {
              "evidenceId": "evidence:...",
              "sourcePath": "data/20260803-speed-performance-map-research.md",
              "authority": "official",
              "locator": {"kind": "url", "url": "https://www.samsung.com/global/business/compressor/recipro-compressor/bldc-r600a-lbp-ac115-127v-60hz/"},
              "fieldPaths": ["performanceMaps"]
            }
          },
          {
            "speedValue": 1950,
            "speedUnit": "rpm",
            "rpm": 1950,
            "rps": 32.5,
            "capacityW": 174,
            "inputW": 88,
            "cop": 1.98,
            "eer": 6.77,
            "valueKind": "MEASURED",
            "evidence": {"evidenceId": "evidence:...", "sourcePath": "data/20260803-speed-performance-map-research.md", "authority": "official", "locator": {"kind": "url"}, "fieldPaths": ["performanceMaps"]}
          },
          {
            "speedValue": 2800,
            "speedUnit": "rpm",
            "rpm": 2800,
            "rps": 46.666666666666664,
            "capacityW": 244,
            "inputW": 130,
            "cop": 1.88,
            "eer": 6.41,
            "valueKind": "MEASURED",
            "evidence": {"evidenceId": "evidence:...", "sourcePath": "data/20260803-speed-performance-map-research.md", "authority": "official", "locator": {"kind": "url"}, "fieldPaths": ["performanceMaps"]}
          },
          {
            "speedValue": 3650,
            "speedUnit": "rpm",
            "rpm": 3650,
            "rps": 60.833333333333336,
            "capacityW": 315,
            "inputW": 182,
            "cop": 1.73,
            "eer": 5.91,
            "valueKind": "MEASURED",
            "evidence": {"evidenceId": "evidence:...", "sourcePath": "data/20260803-speed-performance-map-research.md", "authority": "official", "locator": {"kind": "url"}, "fieldPaths": ["performanceMaps"]}
          }
        ]
      }
    ],
    "safeguards": {
      "interpolation": false,
      "extrapolation": false,
      "hzAsSpeed": false
    }
  }
}
```

`DATA_REQUIRED`는 `chartEligible=false`, `rankingAllowed=false`,
`commonRange=null`, 빈 `metricOptions/series` 또는 빈 points, 모든 safeguard false다.

## 4. Unit / API 테스트

| Test ID | 연결 REQ | RED fixture | 합격 기준 |
|---|---|---|---|
| `P15-SCHEMA-001` | 001 | performanceMaps 계약 없음 | 각 점에 speed/valueKind/Evidence 필수, 모델·조건 연결 유효 |
| `P15-SCHEMA-002` | 002 | speedUnit=Hz | Published 검증 실패, Hz 환산 0 |
| `P15-API-SPEED-001` | 002,003 | ENV↔TKF | CURVE_READY, eligible=true, rpm/rps 정확한 60배, ranking=false |
| `P15-API-SPEED-002` | 003 | API pointCount 변조 | series pointCount와 points 길이 불일치 차단 |
| `P15-API-SPEED-003` | 003 | 보간/외삽 safeguard true | chartEligible 불허 또는 검증 실패 |
| `P15-API-SPEED-004` | 005 | Sc Golden | DATA_REQUIRED, commonRange null, 차트 데이터 0 |
| `P15-API-SPEED-005` | 001,007 | active Release 전환 | report와 모든 점 Evidence가 동일 active Release에 속함 |
| `P15-UT-SPEED-001` | 004 | eligible UI | 2단위·API 완결 지표(현재 용량·COP)·Recharts·표 caption·Evidence 표시, 미완결 토글 0 |
| `P15-UT-SPEED-002` | 003,004 | 차트 점 변조 | `data-point-count`가 API points 합계와 정확히 일치 |
| `P15-UT-SPEED-003` | 005 | DATA_REQUIRED 응답 | `speed-data-gap` 1개, `speed-chart` 0개 |
| `P15-UT-STALE-002` | 006 | 650ms 지연 중 지표 변경 | 이전 speed-analysis/chart/table/download DOM 0개 |
| `P15-UT-REPORT-001` | 007 | 정적 보고서 | eligible 속도 섹션·CSV·print, 기존 popup/CSV 유지 |

## 5. Playwright E2E

모든 UI 시나리오는 데스크톱 `1440×1024`와 모바일 `390×844`, Chromium,
retries 0으로 실행한다.

| Test ID | 사용자 흐름 | 합격 기준 |
|---|---|---|
| `P15-E2E-CURVE-001-D/M` | Re → COP → ENV → TKF → 안전 비교 | CURVE_READY, chart 1, chart 점 수=API 점 수, Evidence 100% |
| `P15-E2E-UNIT-001-D/M` | RPM → RPS → RPM | 모든 표 속도가 정확히 60배 관계, 원복값 동일 |
| `P15-E2E-METRIC-001-D/M` | API metricOptions 순회 | 현재 용량/COP 버튼만 활성·차트 유지, EER/입력전력 0; 향후 완결 지표는 자동 포함 |
| `P15-E2E-GAP-001-D/M` | Sc → EER → DS8LC → STD | DATA_REQUIRED, gap 안내 1, chart 0 |
| `P15-E2E-STALE-001-D/M` | Re 요청 650ms 지연 중 비교 지표 변경 | stale 결과·speed-analysis·chart·table 0 |
| `P15-E2E-REPORT-001-D/M` | 랜딩 Compare Report popup | eligible 속도 섹션/chart, 속도 CSV, 기존 전체 CSV·링크 유지 |
| `P15-E2E-PRINT-001-D/M` | Compare Lab·정적 보고서 print media | 속도 분석/표 보임, 선택 UI 숨김, 빈 차트 0 |

공통 Gate:

- 표시된 점의 `evidence.sourcePath`, `locator`, `fieldPaths` 연결률 100%.
- `rpm === rps * 60` 허용 오차 `1e-9`, Hz→speed 항목 0.
- `safeguards.interpolation/extrapolation/hzAsSpeed` 모두 false.
- 페이지별 `speed-chart` 수와 `chartEligible=true` 대상 수가 일치.
- 외부 요청 0, `console.error` 0, `pageerror` 0, 실패 요청/HTTP 400+ 0.
- `/api/v1/compare/report` 외 POST와 PUT/PATCH/DELETE 요청 0.
- 페이지 overflow 0; 내부 원시점 표 컨테이너만 가로 스크롤 허용.
- 로컬 새 실행 2회 연속 PASS + GitHub Actions Chromium 1회 PASS.

## 6. Task score와 독립 평가

| Task | 배점 | 만점 조건 |
|---|---:|---|
| P15-A 데이터·계약 | 20 | schema·Evidence·단위·Hz 차단 PASS |
| P15-B 판정 엔진/API | 25 | 4상태·환산·safeguard·Release PASS |
| P15-C Recharts UI | 25 | 2단위·완결 지표만·표·DATA_REQUIRED·접근성 PASS |
| P15-D 정적 출력·stale | 15 | report/CSV/print/popup/stale PASS |
| P15-E E2E·CI·평가 | 15 | 두 viewport·2회 로컬·CI·오류 0 |
| **합계** | **100** | **96/100 이상** |

별도 P15 Contract Judge는 다음 5개 축을 각각 평가한다.

1. 기능 완전성
2. 속도 단위·성능점 도메인 안전성
3. Release/Evidence 추적성
4. UX·접근성·E2E 검증가능성
5. 유지보수성·TDD 규율

각 축 `4.8/5` 이상, 환산 `96/100` 이상, Critical 0, Major 0이 합격이다.
보완 루프는 최대 3회이며 미달은 같은 TEST-ID로 RED 재현 후 수정한다.

## 7. REQ / TEST / RUN 증거

완료 판단에는 `task_id`, `requirement_id`, `artifact_path`, `test_id`,
`expected`, `actual`, `evidence_path`, `version_or_commit`,
`reviewer_or_judge`가 모두 필요하다.

실행 전에는 점수, PASS 건수, Release 번호, CI run ID를 `미실행`으로 기록한다.
실제 명령 출력과 JSON/스크린샷이 생긴 뒤에만 값을 확정한다.
