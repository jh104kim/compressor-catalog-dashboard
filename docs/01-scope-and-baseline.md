# P0 범위와 현재 기준선

## 목표

현재 정적 대시보드를 바로 교체하지 않고, GitHub 스냅샷과 데이터 계약 및 화면 동작을 재현 가능한 기준선으로 고정한다. 이후 Phase에서 조사 데이터를 검증하고 발행하는 Catalog Audit Studio로 확장해도 기존 68개 모델과 Samsung 권위값이 조용히 바뀌지 않게 하는 것이 P0의 목적이다.

## 고정 스냅샷

- 저장소: `jh104kim/compressor-catalog-dashboard`
- 커밋: `f142bcaba987408a766fcb6b3e20f8d431719e13`
- 브랜치: `codex/catalog-audit-snapshot-20260730`
- Draft PR: [#1 chore: snapshot current catalog dashboard](https://github.com/jh104kim/compressor-catalog-dashboard/pull/1)
- SSOT: `frontend/compressor-data.js`
- SSOT SHA-256: `16cfc74dce4eeebdf243996a83aa143d99dd90c256828fc4d5fbc589ef4de6b0`
- 권위 소스: `data/Samsung-Compressor-Catalogue_2024.pdf`

현재 기준 수량은 전체 모델 **68개**, Samsung **27개**, 경쟁사 **41개**, 비교군 **12개**다. Samsung 27개는 Re 4개, Ro 12개, Sc 11개다.

## 확정 운영 경계

이번 MVP는 **View-first** 방식이다.

- 사용자는 조회·점검을 우선 수행한다.
- UI 데이터 편집과 Published 발행은 이번 MVP 범위에서 제외한다.
- 승인자 기록은 포함한다. 기록은 누가 어떤 Release를 검토했는지 남기기 위한 메타데이터이며, 이 단계에서 데이터 발행 권한을 뜻하지 않는다.
- 우선 Samsung 대표 27개 모델의 Gate를 완성한다.
- PDF 자동 파싱 참조본의 전체 362개 스펙행 확장은 27개 Gate가 안정된 뒤 진행한다.
- 유사 용량 후보의 허용범위는 **±15%**다. 다만 유형·냉매·측정조건·구동 분류가 같아야 직접 비교할 수 있다.

## 권위와 데이터 레이어

1. Samsung 기본 수치는 2024 공식 카탈로그를 Baseline으로 사용한다.
2. Samsung 모델이지만 2024 공식 PDF 페이지가 확인되지 않은 기존 공개 조사값은 `samsung_legacy_research`로 분리하며 Baseline으로 가장하지 않는다.
3. 공식 카탈로그 이후 확인된 Samsung 개발·양산 모델은 Post-catalog 레이어로 분리하고 `postCatalog: true` 및 `2024+ 개발` 배지를 사용한다.
4. 경쟁사 공개 조사 데이터는 competitor-research 레이어로 관리한다.
5. UI 표시는 향후 활성 Published Release만 읽도록 전환하지만, P0에서는 현재 SSOT를 그대로 보존하고 특성만 기록한다.

변경할 수 없는 핵심 사실은 다음과 같다.

- R290: Samsung Re는 공백, Ro와 Sc는 보유
- R454B: Samsung Ro와 Sc 모두 보유
- `DS4BC7066FVT`: ARI COP **3.25**가 권위값이며 3.34는 폐기
- `DS4HD5066FVT`: R290 Sc, ARI COP 3.43, 양산
- 측정조건이 다른 비교군을 가로질러 순위를 만들지 않는다.

직접 비교 키는 `type × refrigerant × condition × driveClass`다. DOE-A/DOE-B 환산값은 참고용일 뿐 직접 순위의 근거로 쓰지 않는다.

## 현재 UI 기준선

| ID | 탭 | 필수 화면 기준점 |
|---|---|---|
| `kpi` | KPI 현황 | Samsung 포트폴리오 제목, 27/41 모델, 냉매 커버리지 |
| `decision` | Decision 전략 | R290 Re P1 공백, P1~P6, Samsung 최신 동향 |
| `analysis` | 모델 분석 | 유형·조건 필터, Samsung 모델 선택, 유사 경쟁 모델 TOP 5 |
| `reporting` | Reporting | 12개 비교군, 조건·신뢰도 배지, 모델 드릴다운 |
| `backlog` | 보완 과제 | 보완 티켓, 진행률, 원본 연락처 링크 |

`backlog`은 실제 내비게이션의 5번째 탭이지만 현재 `startView` enum에는 없다. P0에서는 내비게이션 접근을 Characterization하고, props 정리는 후속 개선으로 남긴다.

현재 `r32-ro-var`는 Samsung ARI와 GMCC SEER60을 포함한 신뢰도 1 레거시 비교군이다. P0는 저신뢰 경고가 보이는 현재 동작만 기록한다. P1부터는 `CONDITION_MISMATCH` 및 `BLOCKED`로 판정해 순위와 차이를 만들지 않는 것이 목표다.

## P0 Characterization E2E

상태: **COMPLETE**

기존 문서의 500px/1280px 수동 확인은 참고자료일 뿐, 새 완료기준인 390px/1440px 자동 검증을 대체하지 않는다.

### 실행 조건

- Chromium
- 데스크톱 `1440 × 1024`
- 모바일 `390 × 844`
- 새 HTTP 서버와 동적 포트
- `retries=0`
- `reuseExistingServer=false`
- 로컬 E2E 2회 연속 PASS
- **GitHub Actions 1회** PASS

### 필수 시나리오

1. `/`가 `Compressor Dashboard.dc.html`로 이동하고 대시보드·SSOT·런타임 요청이 성공한다.
2. KPI 현황이 기본 탭으로 열리고 27개 Samsung, 41개 경쟁사, TOP COP 3.43, P1 공백 1건을 표시한다.
3. Decision 전략에서 R290 왕복동 공백과 P1~P6 및 Samsung 최신 동향을 표시한다.
4. 모델 분석에서 유형과 측정조건 필터가 동작하고 Samsung 모델 선택 후 TOP 5 영역이 갱신된다.
5. Reporting에서 동일조건 R454B Sc Fixed DOE-B 비교군과 저신뢰 R32 Ro 경고를 각각 확인한다.
6. 보완 과제 탭으로 이동하고 진행률 및 외부 출처 링크가 렌더된다.
7. 헤더 검색으로 모델을 찾고 결과 선택 후 해당 모델의 Reporting 드릴다운으로 이동한다.
8. 5개 탭 모두 두 viewport에서 페이지 전체 가로 넘침이 없어야 한다. 넓은 표 내부의 의도된 가로 스크롤은 허용한다.
9. 미해결 `{{ }}` 보간, console error, page error, 실패한 앱 리소스 요청이 각각 0건이어야 한다.

두 viewport에서 5개 탭의 기준 캡처 10장을 `qa/evidence/p0/` 아래에 저장한다. 로컬 실행 결과와 GitHub Actions 결과에는 실행 SHA, 브라우저 버전, viewport, 테스트 결과를 함께 남긴다.

### 로컬 실행 증거

- `local-run-2`: 10/10 탭, 2/2 워크플로, 오류 0, 캡처 10장 PASS
- `local-run-3`: 새 서버에서 10/10 탭, 2/2 워크플로, 오류 0, 캡처 10장 PASS
- 두 실행은 2026-07-30 16:09 KST에 연속 통과했다.
- React 18.3.1 UMD를 SRI와 같은 로컬 파일로 고정하고 Google Font 외부 요청을 제거해, P0 실행의 외부 네트워크 요청은 0건이다.
- GitHub Actions [run 30522200310](https://github.com/jh104kim/compressor-catalog-dashboard/actions/runs/30522200310): SHA `632954d`, Python 39 passed, Schema PASS, Chromium Characterization PASS
- Artifact: `p0-catalog-audit-30522200310-1` (3,523,674 bytes)

## P0 범위 밖

- UI에서 모델·수치 편집
- Staging 데이터 Published 발행
- SQLite/PostgreSQL 및 인증 도입
- 362개 전체 스펙행 이관
- 기존 DC UI의 React 전면 재작성
- 새로운 경쟁사 조사와 기존 수치 재해석

## P0 완료기준

- `config/p0_catalog_rules.json`과 `qa/baseline/current_snapshot.json`이 유효한 JSON이며 계약 테스트를 통과한다.
- 스냅샷 SSOT SHA-256이 실제 파일과 일치한다.
- 68/27/41/12 수량과 핵심 권위값이 자동 테스트로 고정된다.
- 5개 탭의 Characterization E2E가 로컬 2회 연속 및 GitHub Actions 1회 PASS한다.
- 데스크톱·모바일 기준 캡처 10장과 실행 증거가 저장된다.
- Critical 0건, Major 0건이다.
- P0 평가점수는 5점 만점 중 4.0 이상이다.

로컬 2회 연속과 GitHub Actions 1회 증거가 모두 생성되어 P0를 완료한다.
