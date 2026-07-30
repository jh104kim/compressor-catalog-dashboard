# 대시보드 개선 계획 (Architecture & Plan)

> 작성: 2026-06-19 · 최종갱신: 2026-06-24
> Samsung(당사) 관점 압축기 경쟁 인텔리전스 대시보드

## 1. 데이터 단일소스 (SSOT)

- `frontend/compressor-data.js` → `window.COMPRESSOR_DATA`. data/*.md를 Samsung 기준으로 구조화.
- 모든 탭은 이 객체만 읽는다. 수치 변경은 여기서만.
- 최종 스키마: `meta` · `tokens` · `conditions` · `refrigerants` · `manufacturers` · `models`(76개) · `benchmarkGroups`(13개) · `gaps` · `priorities`(P1~P6) · `regulations` · `roadmap` · `samsungMoves` · `catalogSources` · `kpi`

## 2. 확정된 핵심 결정 (사용자 승인)

1. **R454B = 로터리 Unitary(UF, ARI, 2024 카탈로그) + 스크롤(2024 이후 개발)** 모두 양산. 진짜 공백은 R290 왕복동(P1).
2. **R290 = Re(왕복동)만 미보유.** R290 로터리·스크롤은 보유/양산(DS4HD5066FVT 3.43). 경쟁사도 R290 Re 보유.
3. **모델명 정규화**: `nameNote`로 오타 변형 표기(DS2LD5046F=DS2DL5046F, DS8LC5049IN=DS8C5040IN 등).
4. **군 교차 순위 금지**: 동일 비교군(유형×냉매×조건×구동) 안에서만 비교. 조건 배지·`reliability` 등급 표기.
5. **데이터 레이어링**: 2024 카탈로그(베이스, 권위) + perplexity 결과(2024 이후 개발분). `postCatalog:true` 마킹.
6. **LG 데이터**: YPH/YBH Variable(DOE-A) 확정, YRH/YGH Fixed(DOE-A) 추가. Samsung UF(ARI)와 조건 불일치 → 별도 비교군 `r454b-sc-fix-doea` 관리.

## 3. 비교 설계 (Samsung 기준)

- **비교 단위** = `benchmarkGroups`의 한 군. 군 안에서 Samsung=baseline, Δ%는 군 내부에서만 계산.
- **Sc**: R454B ARI Variable → 당사 DS2LD5046F(3.37) vs Danfoss DSH(3.51~3.65, +6~8.7%). GMCC STD(DOE-B) → 당사 우위 +1.9~3.6%. LG DOE-A(4.88~5.00) → 조건 불일치, 참고군만.
- **Ro**: R32/R410A Variable(vs GMCC 3.65, Highly, LG). R454B 로터리 Unitary UF 시리즈 ARI 3.22~3.25.
- **Re**: R290 공백(P1) — 경쟁사 LG/Embraco/Secop/Panasonic 보유.

## 4. 5-탭 구조 (최종)

| 탭 | 역할 |
|---|---|
| **① KPI 현황** | 스탯 타일(모델수·COP·갭) · Re/Ro/Sc 경쟁 포지션 카드 · 냉매 커버리지 매트릭스 · 조건별 벤치마크 · 제조사 강도 히트맵(8사) · 카탈로그 출처·신선도 |
| **② Decision 전략** | 스포트라이트 공백(P1 R290 Re) · 우선순위 P1~P6 · 냉매 전환 타임라인(비주얼 dot+라인) · 규제 압력 패널 · 경쟁사 위협 모니터링 · Gap→Action · Samsung 최신 동향 |
| **③ 모델 분석** | 유형·조건 배지 필터 → Samsung 모델 선택 → 보완 스펙(9개 필드) → 유사 경쟁 모델 TOP 5 자동 추천 + 자동 요약문 |
| **④ Reporting** | 비교군(12군) 선택기(relBar 신뢰도 바·포지션 배지·저신뢰 경고) · 비교표(Δ% 미니바·조건 배지) · 모델 드릴다운 리포트 · 인쇄/PDF |
| **⑤ 보완 과제** | SSOT 미확인 항목 진행률(56%) · 제조사별 연락처(클릭 가능 링크) · 우선순위 상태 트래킹 |

## 5. UI/UX 개선 — 완료 항목

- [x] 측정조건 배지·환산 병기·경고 레전드
- [x] 유형 필터 전역화
- [x] 검색(⌘K) 실작동 + 드롭다운 + 클릭 이동
- [x] 드릴다운/딥링크 (Reporting ↔ 모델분석 연결)
- [x] 모델 분석 TOP 5 + 자동 요약문
- [x] 신뢰도 별점 + relBar 5칸 막대
- [x] 포지션 배지(우위/열위/혼재/공백/비교보류)
- [x] 저신뢰 경고 배너(reliability ≤ 1)
- [x] Δ 미니바(좌우 방향 막대, ±15% 스케일)
- [x] 가로 스크롤 그림자 어포던스(Lea Verou)
- [x] 인쇄/PDF(@media print)
- [x] 반응형(1024/820/480px, 와이드테이블 가로스크롤)
- [x] 5개 탭 반응형 E2E(500px/1280px): KPI · Decision · 모델 분석 · Reporting · 보완 과제
- [x] `frontend/index.html` 기본 진입점 추가
- [x] 카탈로그 출처·신선도 사이드바
- [x] Samsung 최신 동향 섹션(Decision 탭)
- [x] 조건 배지 필터(Analysis 탭)
- [x] 보완 스펙 패널(Analysis 탭)
- [x] 보완 과제 탭 P1/P2/P3 티켓형 정리 + 완료 기준 표기
- [x] 연락처 링크 클릭 가능(보완 과제 탭)
- [x] README 정적 호스팅 체크리스트

## 6. 데이터 정정 이력

| 시점 | 정정 내용 |
|---|---|
| 3.6 | 2024 카탈로그 = 권위 베이스. R454B = 로터리 Unitary(UF). R32 스크롤 3.34→3.25. |
| 3.7 | perplexity = 2024+ 개발분. R454B 스크롤 Variable 양산 확정, postCatalog:true. |
| 3.8~3.9 | R290 Re만 미보유(Ro/Sc 보유). R290 스크롤 DS4HD5066FVT(3.43) 복원. |
| 2026-06-23 | LG YRH/YGH DOE-A 추가. benchmarkGroup r454b-sc-fix-doea 신설. models 65→68. |

## 7. E2E 검증 방법

```bash
cd frontend
python -m http.server 8000
# 브라우저: http://localhost:8000/
```

브라우저로 각 탭 렌더·전환·필터·드릴다운·검색 실기능 확인. 콘솔 에러 0, 미해결 `{{ }}` 0, 페이지 전체 가로 넘침 0 기준. 결과는 `docs/PROGRESS.md`에 스냅샷.

## 8. 잔여/후속 과제

| 항목 | 우선순위 | 비고 |
|---|---|---|
| Samsung UF 시리즈 ARI 공인값 확보 | P1 | AHRI Directory 직접 조회 필요 |
| GMCC ATF/ATQ ARI 조건 데이터 | P2 | SEER60→ARI 환산 또는 제조사 문의 |
| LG UniRotary R454B 로터리 스펙 | P2 | LG B2B 포털 |
| Danfoss VZH 스크롤 R454B 최신 | P3 | VZH+DSH hybrid 로드맵 확인 |
| Panasonic R290 스크롤 공식 스펙 | P3 | 카탈로그 갱신 대기 |
| 다차원 스펙 Tier1 보완 (계절효율·운전영역) | P2 | DATA-ENRICHMENT.md 참고 |
