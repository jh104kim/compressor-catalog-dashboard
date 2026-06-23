# R454B 스크롤 Tier 1 Deep-Research 결과
> 조사일: 2026-06-19 | 조사 범위: R454B 스크롤 압축기 경쟁사 Tier 1 스펙(오일·소음·운전영역)
> 방법: 웹검색 15개 소스 페치 → 3-vote 적대적 검증
> 적용: frontend/compressor-data.js Danfoss DSH240 항목

---

## §1. 검증 완료 (3-0 votes)

### §1.1 Danfoss DSH 시리즈 R454B 지원 (DSH090–485 전용)
- DSH090–184: R454B 전용 라인업으로 확인
- DSH240–485: R454B + R410A + R452B 지원 (멀티 냉매)
- 출처: Danfoss DSH scroll 공식 데이터시트 (danfoss.com, 2025-2026)

### §1.2 DSH240B4APC 냉매 지원 확인
- R410A · R452B · R454B 모두 지원
- 모델번호 체계: DSH[Displacement][B=Rev][4=R454B+R410A+R452B][APC=connector]
- 출처: Danfoss product selector + 데이터시트 (3-0)

### §1.3 DSH240 오일 스펙 (즉시 SSOT 반영)
- **오일 타입: POE (폴리올에스터)**
- **충전량: 6.1 L**
- 점도: 32 cP (VG32)
- 출처: Danfoss DSH240 데이터시트 (3-0 검증 완료)
- SSOT 반영: compressor-data.js DSH240 항목에 `oilType:"POE"`, `oilCharge:"6.1L"` 추가

---

## §2. 미검증 항목 (세션 한도로 vote 불완전 — 참고만)

### §2.1 Copeland YHV0382P 상세 스펙
- 주장: 38cc, COP 3.2(EN12900 난방), 오일 1.2L, 중량 20kg, 소음 64dB(A)
- 검증 상태: vote 3개 중 실행 실패 (세션 한도)
- 신뢰도: Low — 추후 재검증 필요
- 비고: 이미 SSOT에 YHV0382P가 있으나 oilCharge/noiseDb 미반영 상태 유지

### §2.2 Danfoss VZH 인버터 스크롤 R454B
- 주장: R454B 자격, 소음 80dB(A)@60rps, 운전영역 최대 토출 155°C
- 검증 상태: 미완료
- 신뢰도: Low

### §2.3 LG 신규 R454B Fixed 스크롤
- 주장: YRH(6~12톤), YGH(13~27톤) 신규 라인업
- 검증 상태: 미완료
- 신뢰도: Low — 공식 카탈로그에서 직접 확인 필요

### §2.4 EU F-Gas 상세 규정
- 주장: R454B(GWP 466) 스플릿 >12kW는 2033년까지 허용, 자립형 ≤12kW는 2027년 금지
- 검증 상태: 미완료
- 비고: 현재 REGULATIONS에 "EU F-Gas 2027" 항목 있음. 세분화 필요 시 재조사

---

## §3. 후속 권장 조사 (다음 세션)

| 우선순위 | 항목 | 타깃 모델/소스 |
|---------|------|--------------|
| 1 | Copeland YHV0382P: oilCharge, noiseDb 실측 확인 | copeland.com 데이터시트 |
| 2 | LG YRH/YGH R454B Fixed 스펙·조건 확인 | LG 카탈로그 2025 |
| 3 | Danfoss VZH R454B 인버터 스크롤 소음·운전영역 | Danfoss VZH 데이터시트 |
| 4 | GMCC STD 시리즈 소음 재확인 (현재 "58~62/60~65" 표기) | GMCC 데이터시트 확인 |

---

## §4. 이 파일이 열어주는 SSOT 업데이트

```
// DSH240 항목에 추가:
oilType: "POE",
oilCharge: "6.1L",
```

extSpecs 드릴다운에서 "오일" 항목이 "미확인" → "POE · 6.1L"로 채워짐.
