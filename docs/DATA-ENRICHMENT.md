# 비교 데이터 보완 브리프 (Reporting 풍부화)

> 상태: 후속 리서치 백로그. 현재 제품은 Published Release와 `performanceMaps`를
> 사용하며, 아래 필드는 공식 근거·측정조건·Evidence가 확보된 뒤에만 Staging에 추가한다.

> 목적: 당사(Samsung) vs 경쟁사 비교를 단일점 COP/EER을 넘어 **다차원**으로 확장해 연구원 인사이트 극대화.
> Legacy DB(`compressor-data.js` models)는 cc·용량·입력·COP·EER·조건·상태를 보유. 기본 Studio는 Published Release 계약을 사용한다.
> 출처 표기는 기존처럼 `src` 필드 유지, 추정/후속은 `postCatalog`/`confidence`로 구분.

## 현재 비교의 한계
- **단일점 효율만** 비교(정격 COP/EER) → 실사용·계절효율·부분부하 정보 없음.
- **물리/설계 스펙 부재**(소음·치수·중량·오일·충전량) → 설계 적합성·프리미엄 차별화 비교 불가.
- **상업/시장 정보 부재**(가격·OEM 채택·규제 승인) → "이길 수 있는 시장" 판단 근거 부족.
- **경쟁사 모델 수 희소**(군당 1~3개) + **미확인 조건 다수** → 분포/순위 신뢰도 낮음.

## Tier 1 — 최우선 (인사이트 ↑↑, 비교적 확보 가능)
| 보완 항목 | 추가 필드(제안) | 왜 중요 | 리서치 타깃·소스 |
|---|---|---|---|
| **계절·부분부하 효율** | `seer2,hspf2,iplv,scop` | 정격 COP의 한계 보완 — 실사용 효율로 우열 재평가(메인 §10-5 공백) | AHRI Directory(인증값), 각사 카탈로그 SEER2/SCOP, EU Ecodesign 등급 |
| **운전 영역** | `evapMin/Max,condMax,ambientMax,rpsMin/Max,turndown` | 고온 히트펌프(60~70°C)·저외기 난방 커버리지, 변속 변조 깊이 — GMCC Two-Stage 위협 정량화 | 각사 데이터시트 Operating Envelope, rps 범위(Panasonic E·삼성 BLDC) |
| **소음/진동** | `noiseDb` | 프리미엄·정숙성 차별화(삼성 AI인버터 <35dB 강점) | GMCC 58~65dB 보유, 각사 데이터시트 dB(A) |

## Tier 2 — 설계·시장 적합성
| 보완 항목 | 추가 필드 | 왜 중요 | 소스 |
|---|---|---|---|
| **오일·충전량** | `oilType,oilCharge,refrigerantCharge` | 유지보수 호환성, R290 A3 충전량 <150g 안전(메인 §8-3) | 데이터시트(LG R32=PVE, GMCC 0.9~1.5L) |
| **치수·중량** | `dimsMM,weightKg` | 설치 적합성 (스크롤 표에 중량 일부 파싱됨) | 2024 카탈로그·각사 도면 |
| **규제·시장 승인** | `approvals[]`(EPA SNAP·EU F-Gas·CARB·China GB·AIM Act) | 모델별 **판매 가능 시장** 매트릭스 → 시장별 경쟁 구도 | GMCC md 규제표, 각사 인증 |

## Tier 3 — 상업/전략 (고가치, 출처 난이도↑)
| 보완 항목 | 추가 필드 | 왜 중요 | 소스 |
|---|---|---|---|
| **가격/원가 지수(상대)** | `priceIndex` | 성능-가격 포지셔닝(GMCC 중국 -20~30%) | 유통·OEM 견적(상대치), perplexity |
| **OEM 채택/디자인윈** | `oemWins[]` | 소켓 점유(Innovair GT4=GMCC STDA) — 영업 타깃 | OEM 사양서 |
| **출시일·로드맵·워런티** | `launchDate,warranty,reliabilityClass` | 시장 진입 시점·신뢰성 비교 | 뉴스룸·카탈로그 |
| **기술 차별화 플래그** | `tech[]`(Two-stage·EVI·AI인버터·Linear·UniRotary) | 구조적 차별화 가시화 | 각사 기술자료 |

## 방법론 보완 (데이터 품질)
1. **경쟁사 모델 수 확대**: 군당 1~3 → 6~8개(분포·백분위 순위 신뢰도).
2. **동일조건 실측 확보**: LG R454B를 **ARI 실측**으로(현재 DOE-A 환산 불확실 ★★★). GMCC 로터리 `미확인` 조건 확정.
3. **용량 매칭쌍**: 당사 각 모델의 최근접 용량 경쟁모델(모델분석 뷰가 쓰지만 데이터가 얇음).

## 실행 티켓 기준

대시보드의 **보완 과제** 탭은 아래 기준으로 티켓을 정렬한다.

| 우선순위 | 의미 | 대표 티켓 | 완료 기준 |
|---|---|---|---|
| P1 즉시 실행 | 비교 신뢰도나 핵심 공백 판단에 바로 영향 | LG UniRotary R454B ARI 스펙, Samsung UF·DS2LD SEER2/AHRI | 출처 URL·측정조건·수치를 확인하고 `data/*.md`와 `compressor-data.js`에 반영 |
| P2 후속 보완 | 비교군 확대와 모델 분석 품질 개선 | Panasonic R290 Sc, Highly R454B Ro, GMCC/LG ARI 조건 재확인 | 동일조건 여부와 신뢰도를 확정하고 해당 `benchmarkGroups`/모델 필드 갱신 |
| P3 관찰/보류 | 근거 일부 확인 또는 공개 데이터 난도 높음 | Danfoss VZH, LG YRH/YGH Fixed ARI | 공식 출처 확보 전까지 참고/보류 상태 유지 |

## 이 데이터가 여는 새 비교 뷰 (대시보드 확장)
- **다차원 레이더**: COP·계절효율·소음·운전영역·가격을 한 모델 vs 경쟁 5각형 비교.
- **계절효율 비교**: SEER2/SCOP 기준 — 단일 COP보다 실효적 우열.
- **운전영역(P-T) 차트**: 고온 HP·저외기 커버리지 시각화.
- **시장 접근성 매트릭스**: 모델 × 규제/지역 승인.
- **성능-가격 산점도**: 포지셔닝 맵.

## 권장 진행
1. (구조) models 스키마에 위 필드를 **nullable로 선반영** → 리서치 결과를 점진 채움(빈 값은 "미확인" 렌더).
2. (리서치) Tier 1부터 군별로 perplexity/딥리서치 → `data/*.md`로 적재 → `compressor-data.js` 반영(기존 워크플로 유지).
3. (검증) 측정조건·출처·신뢰도 필수 — 군 교차 순위 금지 규칙 유지.
