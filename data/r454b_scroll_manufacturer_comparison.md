# R454B Scroll 압축기 제조사 비교

본 문서는 이전 정리값을 기준으로 Samsung(당사), LG, Danfoss, Copeland의 R454B Scroll 모델을 시험조건별로 분리해 비교한 표다. ARI/AHRI, DOE-A, DOE-B, EN12900은 서로 다른 시험 프레임이므로 COP/EER를 직접 비교하지 않았고, `data scope`로 압축기 단품과 시스템 수치를 구분했다. [file:33][file:34]

## 통합 비교표

| Manufacturer | Series | Model | Speed Type | Test Condition | Data Scope | Capacity | Displacement_cc | COP | EER | Normalized to ARI COP | Comparison Group | Notes |
|---|---|---|---|---|---|---:|---:|---:|---:|---:|---|---|
| Samsung | Scroll | DS2DL5046F | Variable | ARI/AHRI cooling | Compressor | 15.0 kW | 46.0 | 3.37 | 11.50 | 3.37 | Same-condition comparable (ARI) | 기준 모델. 첨부 요약에서는 DS2LD5046F 표기가 보이나 사용자 지정 모델명 DS2DL5046F로 반영. [file:33] |
| Samsung | Scroll | DS4LF5052F | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Different-condition / conversion needed | 이전 정리 파일에서 본 모델 상세 수치는 확인되지 않았다. [file:33] |
| Samsung | Scroll | DS8C5040IN | Variable | DOE-B cooling | Compressor | 미확인 | 40.0 | 4.18 | 6.64 | 2.63 | Same-condition comparable (DOE-B) / conversion needed to ARI | 첨부 파일에는 DS8LC5040IN으로 정리되어 있어 사용자 모델명 DS8C5040IN과 표기 차이가 있다. DOE-B→ARI 환산계수 0.63 적용. [file:33] |
| Samsung | Scroll | DSLC5049IN | Variable | DOE-B cooling | Compressor | 미확인 | 49.0 | 4.20 | 6.67 | 2.65 | Same-condition comparable (DOE-B) / conversion needed to ARI | 첨부 파일에는 DS8LC5049IN으로 기재되어 있어 모델명 차이 검증 필요. DOE-B→ARI 환산계수 0.63 적용. [file:33] |
| LG | YPH/YBH | YPH024KA | Variable | DOE-A cooling | Compressor | 24,000 BTU/h | 미확인 | 4.91 | 미확인 | 4.12 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| LG | YPH/YBH | YPH030KA | Variable | DOE-A cooling | Compressor | 30,000 BTU/h | 미확인 | 4.88 | 미확인 | 4.10 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| LG | YPH/YBH | YPH036KA | Variable | DOE-A cooling | Compressor | 36,000 BTU/h | 미확인 | 4.85 | 미확인 | 4.07 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| LG | APH/ABH | 미확인 | Variable | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | 미확인 | Different-condition / conversion needed | 이전 정리 파일에는 APH/ABH 개별 수치가 확인되지 않았다. [file:33] |
| LG | YPH/YBH | YBH048KA | Variable | DOE-A cooling | Compressor | 48,000 BTU/h | 미확인 | 4.92 | 미확인 | 4.13 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| LG | YPH/YBH | YBH051KA | Variable | DOE-A cooling | Compressor | 51,000 BTU/h | 미확인 | 4.91 | 미확인 | 4.12 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| LG | YPH/YBH | YBH060KA | Variable | DOE-A cooling | Compressor | 60,000 BTU/h | 미확인 | 4.87 | 미확인 | 4.09 | Same-condition comparable (DOE-A) / conversion needed to ARI | DOE-A→ARI COP 환산 0.84 적용. [file:33] |
| Danfoss | DSH | DSH090 | Variable | ARI/AHRI cooling | Compressor | 8.9 kW | 미확인 | 3.03 | 미확인 | 3.03 | Same-condition comparable (ARI) | Samsung DS2DL5046F와 ARI 직접 비교 가능. [file:33] |
| Danfoss | DSH | DSH180 | Variable | ARI/AHRI cooling | Compressor | 17.5 kW | 미확인 | 3.10 | 미확인 | 3.10 | Same-condition comparable (ARI) | Samsung DS2DL5046F와 용량대 가장 근접. [file:33] |
| Danfoss | DSH | DSH240 | Variable | ARI/AHRI cooling | Compressor | 23.0 kW | 미확인 | 3.18 | 미확인 | 3.18 | Same-condition comparable (ARI) | ARI 직접 비교 가능. [file:33] |
| Copeland | YHV | YHV0382P | Variable | EN12900 heating | Compressor | 미확인 | 미확인 | 2.20 | 미확인 | 미확인 | Different-condition / heating only | EN12900 난방 데이터이므로 냉방 ARI/DOE 비교에서 제외. [file:33] |
| Copeland | YHV | YHV0502P | Variable | EN12900 heating | Compressor | 미확인 | 미확인 | 2.10 | 미확인 | 미확인 | Different-condition / heating only | EN12900 난방 데이터이므로 냉방 ARI/DOE 비교에서 제외. [file:33] |

## 동일 조건 비교 가능 그룹

| Group | Test Condition | Included Models | Direct COP/EER Comparison | Remarks |
|---|---|---|---|---|
| G1 | ARI/AHRI cooling | Samsung DS2DL5046F, Danfoss DSH090, DSH180, DSH240 | 가능 | 모두 ARI cooling compressor data라 직접 비교 가능. [file:33] |
| G2 | DOE-A cooling | LG YPH024KA, YPH030KA, YPH036KA, YBH048KA, YBH051KA, YBH060KA | 가능 | LG 내부 DOE-A 그룹 내 비교만 가능. ARI/DOE-B와 직접 비교 금지. [file:33] |
| G3 | DOE-B cooling | Samsung DS8C5040IN, DSLC5049IN | 가능 | 첨부 값 기준으로 DOE-B compressor data끼리만 직접 비교 가능. [file:33] |
| G4 | EN12900 heating | Copeland YHV0382P, YHV0502P | 가능 | 난방 EN12900 데이터끼리만 비교 가능하며 냉방 ARI 비교에서 제외. [file:33] |

## 조건 상이로 비교불가 또는 환산 필요

| Model Set | Current Condition | Why Direct Comparison Is Not Allowed | Practical Handling |
|---|---|---|---|
| Samsung DS2DL5046F vs LG YPH/YBH | ARI vs DOE-A | 응축온도 조건이 다르고 첨부 정리에서 DOE-A는 ARI 대비 COP 환산계수 0.84로 설명된다. [file:33] | 원수치 직접 비교 금지, 필요 시 참고용 ARI 환산값만 병기. [file:33] |
| Samsung DS2DL5046F vs Samsung DS8C5040IN/DSLC5049IN | ARI vs DOE-B | DOE-B는 ARI보다 저응축 조건이며 첨부 정리에서 DOE-B→ARI 환산계수 0.63이 제시된다. [file:33] | 원수치 직접 비교 금지, 환산값은 참고용만 사용. [file:33] |
| Any cooling model vs Copeland YHV | ARI/DOE-A/DOE-B vs EN12900 heating | 냉방과 난방, 표준과 목적이 모두 달라 직접 비교 불가. [file:33] | YHV는 별도 난방 표로만 관리. [file:33] |
| Any compressor data vs system submittal data | Scope mismatch | 시스템 COP와 압축기 단품 COP가 섞이면 성능 해석이 왜곡된다. [file:33][file:34] | `Data Scope`를 기준으로 분리 표기. [file:33][file:34] |

## 용량대별 Samsung 근접 경쟁 모델 제안

| Samsung Model | Samsung Condition | Reference Capacity | Closest Competitor | Competitor Condition | Matching Logic | Notes |
|---|---|---:|---|---|---|---|
| DS2DL5046F | ARI | 15.0 kW | Danfoss DSH180 | ARI | 같은 ARI 조건에서 17.5 kW로 가장 근접하며 직접 COP 비교 가능. [file:33] | DSH090은 8.9 kW로 너무 작고 DSH240은 23.0 kW로 더 멀다. [file:33] |
| DS4LF5052F | 미확인 | 미확인 | 미확인 | 미확인 | 이전 정리값에 본 모델 데이터가 없어 매칭 보류. [file:33] | 원문 spec 확보 후 재매칭 필요. [file:33] |
| DS8C5040IN | DOE-B | 40.0 cc | GMCC STDA031N1ULB | DOE-B | 같은 DOE-B 조건군에서 31.5 cc, EER 6.43 / ARI환산 COP 4.05로 가장 근접 후보로 정리된 바 있다. [file:34] | 성능 기준으로는 STDC049N1ULB도 근접하지만 용적은 더 크다. [file:34] |
| DSLC5049IN | DOE-B | 49.0 cc | GMCC STDC049N1ULB | DOE-B | 같은 DOE-B 조건에서 48.9 cc로 사실상 동급 용적이다. [file:34] | Samsung 6.67 vs GMCC 6.50 EER로 첨부 정리에서 약 2.4% 차이로 제시됐다. [file:34] |

## 동일 조건 내 순위

### ARI/AHRI 냉방 COP 순위

| Rank | Model | Manufacturer | COP | Notes |
|---|---|---|---:|---|
| 1 | DS2DL5046F | Samsung | 3.37 | ARI compressor data 기준 최고. [file:33] |
| 2 | DSH240 | Danfoss | 3.18 | ARI compressor data. [file:33] |
| 3 | DSH180 | Danfoss | 3.10 | ARI compressor data. [file:33] |
| 4 | DSH090 | Danfoss | 3.03 | ARI compressor data. [file:33] |

### DOE-A 냉방 COP 순위

| Rank | Model | Manufacturer | COP | ARI-normalized COP | Notes |
|---|---|---|---:|---:|---|
| 1 | YBH048KA | LG | 4.92 | 4.13 | DOE-A 그룹 내 최고. [file:33] |
| 2 | YPH024KA | LG | 4.91 | 4.12 | YBH051KA와 동급 수준. [file:33] |
| 2 | YBH051KA | LG | 4.91 | 4.12 | 동률 처리. [file:33] |
| 4 | YPH030KA | LG | 4.88 | 4.10 | DOE-A 그룹 내 비교. [file:33] |
| 5 | YBH060KA | LG | 4.87 | 4.09 | DOE-A 그룹 내 비교. [file:33] |
| 6 | YPH036KA | LG | 4.85 | 4.07 | DOE-A 그룹 내 비교. [file:33] |

### DOE-B 냉방 COP/EER 순위

| Rank | Model | Manufacturer | EER | ARI-normalized COP | Notes |
|---|---|---|---:|---:|---|
| 1 | DSLC5049IN | Samsung | 6.67 | 2.65 | 첨부 파일 표기상 DS8LC5049IN 값 사용. [file:33] |
| 2 | DS8C5040IN | Samsung | 6.64 | 2.63 | 첨부 파일 표기상 DS8LC5040IN 값 사용. [file:33] |
| 3 | STDC049N1ULB | GMCC | 6.50 | 4.10 | 같은 DOE-B 그룹 내 GMCC 최고 수준. [file:34] |
| 4 | STDC051N1ULB | GMCC | 6.48 | 4.08 | DOE-B compressor data. [file:34] |
| 5 | STDA031N1ULB | GMCC | 6.43 | 4.05 | DOE-B compressor data. [file:34] |
| 6 | STDA029N1ULB | GMCC | 6.40 | 4.03 | DOE-B compressor data. [file:34] |

### EN12900 난방 COP 순위

| Rank | Model | Manufacturer | COP | Notes |
|---|---|---|---:|---|
| 1 | YHV0382P | Copeland | 2.20 | EN12900 heating only. 냉방 비교 제외. [file:33] |
| 2 | YHV0502P | Copeland | 2.10 | EN12900 heating only. 냉방 비교 제외. [file:33] |

## 해석 메모

- Samsung과 Danfoss는 ARI 냉방 조건에서 직접 비교할 수 있으며, 현재 확보값 기준으로 Samsung DS2DL5046F의 COP 3.37이 DSH090~240의 3.03~3.18보다 높게 정리되어 있다. [file:33]
- LG YPH/YBH는 DOE-A 그룹 내부 비교는 가능하지만, Samsung ARI 또는 DOE-B 수치와는 직접 비교하지 말고 필요 시 환산 참고치만 병기해야 한다. [file:33]
- Copeland YHV의 EN12900 난방 데이터는 냉방 ARI 비교표에서 제외하는 것이 맞고, 시스템 COP와 압축기 단품 COP가 섞이지 않도록 계속 `Data Scope`를 유지해야 한다. [file:33][file:34]
