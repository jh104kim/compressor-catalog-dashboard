/*
 * compressor-data.js — 단일 진실 소스 (Single Source of Truth)
 * 출처: ../data/*.md (리서치) + Samsung-Compressor-Catalogue_2024.pdf (당사 공식 카탈로그, 권위)
 * 이 파일이 모든 대시보드 탭(KPI / Decision / Reporting)의 데이터 원천이다.
 *
 * 비교 규칙: 동일 비교군(유형 × 냉매 × 측정조건 × 구동) 안에서만 COP/EER 직접 비교.
 *   측정조건 ARI 환산계수 — ARI ×1.00, DOE-A ×0.84, DOE-B ×0.63, EN12900(난방)=환산불가.
 *   수치는 원문(raw) 그대로 저장하고, 환산/Δ는 렌더 단계(renderVals)에서 계산한다.
 *
 * 2024 카탈로그 + 2024 이후 개발분 반영 결정(사용자 승인):
 *  - 당사 모델은 2024 카탈로그를 권위로: Ro/Sc/Unitary 측정조건 = ARI/AHRI(카탈로그 명기), COP는 실측값.
 *  - R454B = 로터리 Unitary(UF 시리즈, ARI) + 스크롤(2024 이후 개발분, postCatalog:true) 모두 양산/개발 관리.
 *  - R454B 스크롤(DS2LD5046F·DS8LC50xxIN)은 미검증이 아니라 2024 카탈로그 이후 개발분으로 표기한다.
 *  - R290: 당사 Re 왕복동만 공백(P1). Ro/Sc는 보유로 처리하며, 스크롤 DS4HD5066FVT 3.43은 양산으로 유지.
 */
(function () {
  "use strict";

  // ── 색상 토큰 ────────────────────────────────────────────────
  var T = {
    accent: "#FF385C",
    Re: "#FF385C", Ro: "#00A699", Sc: "#FC642D",
    have: "#067647", prog: "#E8A100", progFg: "#B25E00", none: "#C4C4C4",
    danger: "#C13515", ink: "#222222", sub: "#717171", mute: "#9b9b9b",
  };

  // ── 측정조건 정규화 계수 (R454B 정규화 md §2.2 + 2024 카탈로그) ──
  var CONDITIONS = {
    "ARI":     { label: "ARI/AHRI", factor: 1.00, evap: -6.7, cond: 54.4, heating: false, color: "#1D6FB8", note: "북미 기준조건. 환산 불필요. (2024 카탈로그 Ro/Sc/Unitary 명기)" },
    "DOE-A":   { label: "DOE-A",    factor: 0.84, evap: -6.7, cond: 46.1, heating: false, color: "#E8A100", note: "ARI 대비 ~16% 낮음(응축 46.1°C)." },
    "DOE-B":   { label: "DOE-B",    factor: 0.63, evap: -6.7, cond: 37.8, heating: false, color: "#C13515", note: "SEER2 기반(응축 37.8°C). ARI 대비 ~37% 낮음." },
    "EN12900": { label: "EN12900",  factor: null, evap: -10,  cond: 45,   heating: true,  color: "#717171", note: "유럽/난방 조건. 냉방(ARI/DOE)과 직접 비교·환산 불가." },
    "ASHRAE-LBP": { label: "ASHRAE LBP", factor: null, evap: -23.3, cond: 54.4, heating: false, color: "#5B5B5B", note: "냉장고 저압(LBP). Re 전용, 타 조건과 직접비교 금지." },
    "ASHRAE-MBP": { label: "ASHRAE MBP", factor: null, evap: -6.7,  cond: 54.4, heating: false, color: "#7A7A7A", note: "냉장고 중압(MBP). Re 전용." },
    "CECOMAF":    { label: "CECOMAF",    factor: null, evap: -25,   cond: 55,   heating: false, color: "#9b9b9b", note: "Embraco/Secop 일부. 타 조건과 직접비교 금지." },
    "SEER60":     { label: "SEER60",    factor: null, evap: 2.7,  cond: 42.3, heating: false, color: "#8B5CF6", note: "GMCC R32 로터리 부분부하 조건(응축 42.3°C/증발 2.7°C). ARI(응축 54.4°C)보다 낮아 COP 높게 측정 — 직접 비교 불가." },
    "HP-heating": { label: "HP Heating(-7/50)", factor: null, evap: -7, cond: 50, heating: true, color: "#8B7355", note: "히트펌프 난방 조건(증발 -7°C/응축 50°C). Copeland ZH/YHV R290 브로슈어 조건. ARI 냉방과 직접 비교 불가." },
    "미확인":  { label: "미확인",   factor: null, evap: null, cond: null, heating: false, color: "#C4C4C4", note: "측정조건 미공개 — 비교 주의." },
  };

  // ── 냉매 (메인 §4 + 2024 카탈로그 커버리지) ──────────────────
  var REFRIGERANTS = [
    { id: "R600a",   gwp: 3,     trend: "Growing",   flammability: "A3",  use: "냉장고",            samsung: { re: "have", ro: "no",   sc: "no"   }, rivals: "LG·Embraco·GMCC·Secop·Panasonic" },
    { id: "R134a",   gwp: 1430,  trend: "Declining", flammability: "A1",  use: "냉장고·에어컨·EV",  samsung: { re: "have", ro: "have", sc: "no"   }, rivals: "LG·Embraco·GMCC·Secop·Panasonic·Highly" },
    { id: "R290",    gwp: 3,     trend: "Growing",   flammability: "A3",  use: "냉장고·에어컨·히트펌프", samsung: { re: "no", ro: "have", sc: "have" }, rivals: "LG·Embraco·GMCC·Secop·Panasonic·Copeland" },
    { id: "R22",     gwp: 1810,  trend: "Declining", flammability: "A1",  use: "구형 에어컨",       samsung: { re: "no",   ro: "have", sc: "no"   }, rivals: "LG·GMCC·Panasonic·Highly" },
    { id: "R407C",   gwp: 1774,  trend: "Declining", flammability: "A1",  use: "구형 에어컨",       samsung: { re: "no",   ro: "have", sc: "no"   }, rivals: "LG·GMCC·Highly" },
    { id: "R410A",   gwp: 2088,  trend: "Declining", flammability: "A1",  use: "에어컨·히트펌프",   samsung: { re: "no",   ro: "have", sc: "have" }, rivals: "LG·GMCC·Highly·Panasonic·Copeland" },
    { id: "R32",     gwp: 675,   trend: "Growing",   flammability: "A2L", use: "에어컨·히트펌프",   samsung: { re: "no",   ro: "have", sc: "have" }, rivals: "LG·GMCC·Highly·Panasonic·Copeland·Danfoss" },
    { id: "R454B",   gwp: 466,   trend: "Growing",   flammability: "A2L", use: "미국 Unitary·상업 AC", samsung: { re: "no", ro: "have", sc: "have" }, rivals: "Copeland·Danfoss·LG·GMCC·Panasonic" },
    { id: "R1234yf", gwp: 1,     trend: "Growing",   flammability: "A2L", use: "자동차·냉장고",     samsung: { re: "no",   ro: "no",   sc: "no"   }, rivals: "Embraco·GMCC·Panasonic·Highly" },
    { id: "R744",    gwp: 1,     trend: "Growing",   flammability: "A1",  use: "히트펌프·상업냉동", samsung: { re: "no",   ro: "no",   sc: "no"   }, rivals: "Copeland·GMCC·Panasonic·Danfoss·Highly" },
    { id: "R454C",   gwp: 148,   trend: "Growing",   flammability: "A2L", use: "상업냉동(R404A 대체)", samsung: { re: "no", ro: "no", sc: "no" }, rivals: "Danfoss·Embraco·Panasonic" },
  ];

  // ── 제조사 벤치마크 (메인 §6) ────────────────────────────────
  var MANUFACTURERS = [
    { id: "Samsung",  isUs: false, re: "중간",     ro: "강함",     sc: "중간",     catalogYear: 2024, threatLevel: 0, refrigerants: "R600a·R134a·R410A·R32·R454B(Ro·Sc)·R290(Ro·Sc)", strategy: "R32 전환, R454B 로터리·스크롤 양산, R290 로터리·스크롤 보유, BLDC 성숙도", monitor: "—", url: "https://www.samsung.com/global/business/compressor/" },
    { id: "LG",       isUs: false, re: "매우강함", ro: "강함",     sc: "강함",     catalogYear: 2025, threatLevel: 5, refrigerants: "R600a·R134a·R290·R32·R410A·R454B", strategy: "Linear 독자기술, UniRotary™ R454B, R1™ 하이브리드", monitor: "R290 Re 선제, R454B, 카탈로그 갱신 (분기)", url: "https://www.lg.com/global/business/compressor-motor/" },
    { id: "Copeland", isUs: true,  re: "없음",     ro: "없음",     sc: "매우강함", catalogYear: 2024, threatLevel: 5, refrigerants: "R410A·R32·R454B·R452B·R404A·R744·R290", strategy: "Sc 독보적, 저GWP+CO2 선도, 선택도구", monitor: "R454B/R744 스크롤 선도 — Sc 직접 위협 (분기)", url: "https://www.copeland.com" },
    { id: "GMCC",     isUs: false, re: "중간",     ro: "매우강함", sc: "중간",     catalogYear: 2026, threatLevel: 4, refrigerants: "R32·R410A·R744·R1234yf·R290·R454B 등 전냉매", strategy: "연 1.2억대 규모, 냉매 다변화, R744 CO2, Two-Stage Scroll(2026)", monitor: "세계 최대 로터리, R744 CO2, Two-Stage (반기)", url: "https://www.gmcc-welling.com/en" },
    { id: "Embraco",  isUs: false, re: "매우강함", ro: "없음",     sc: "중간",     catalogYear: 2026, threatLevel: 4, refrigerants: "R134a·R600a·R290·R1234yf·R404A·R448A/R449A", strategy: "Re 전문화, 자연냉매(R290·R1234yf) 선도", monitor: "R290/R1234yf Re 최선두 — Re 직접 위협 (반기)", url: "https://www.embraco.com" },
    { id: "Danfoss",  isUs: false, re: "중간",     ro: "없음",     sc: "강함",     catalogYear: 2026, threatLevel: 3, refrigerants: "R134a·R448A/R449A·R454B·R454C·R1234ze·R600a·R290", strategy: "저GWP 전환, 대형 고효율 Turbocor 원심형, Secop 계열", monitor: "DSH R454B, Turbocor 원심형 (연간)", url: "https://www.danfoss.com/en/products/dcs/compressors/" },
    { id: "Panasonic",isUs: false, re: "중간",     ro: "강함",     sc: "중간",     catalogYear: 2026, threatLevel: 3, refrigerants: "R410A·R134a·R32·R290·R1234yf·R454B·R454C·R744", strategy: "R454B 로터리, CO2 히트펌프, R1234yf 다변화", monitor: "R454B/R32 로터리, CO2 인버터 (분기)", url: "https://industrial.panasonic.com/ww/products/motors-compressors/compressors" },
    { id: "Highly",   isUs: false, re: "낮음",     ro: "중간",     sc: "중간",     catalogYear: 2024, threatLevel: 2, refrigerants: "R22·R32·R410A·R454B/C·R744·R1234yf", strategy: "EV 압축기 차별화, 저GWP 로터리", monitor: "R454B/C 로터리, EV 스크롤 (연간)", url: "https://en.highly.cc" },
    { id: "Secop",    isUs: false, re: "중간",     ro: "없음",     sc: "없음",     catalogYear: 2026, threatLevel: 2, refrigerants: "R600a·R290·R134a·R404A·R170", strategy: "소형/DC/의료 특화, Danfoss 계열", monitor: "R290 소형 Re, DC/의료 (연간)", url: "https://www.secop.com/products/product-portfolio" },
  ];

  // ── 모델 데이터셋 ────────────────────────────────────────────
  // gap: have(양산) / prog(개발중) / none(공백) | type=Re/Ro/Sc | src=출처
  // postCatalog:true = 2024 카탈로그 이후 개발/양산분. "미검증" 배지로 처리하지 않는다.
  var M = function (o) { return o; };
  var MODELS = [
    // ===== Samsung Re (왕복동, 냉장고) — 2024 catalogue + report =====
    M({ mfr:"Samsung", type:"Re", app:"냉장고 LBP", model:"ENV4A5DL2B", refrigerant:"R600a", drive:"BLDC", cc:15.31, capW:148, inputW:75, cop:1.97, eer:6.72, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"115-127V", phase:"1Φ", freq:"60Hz", confidence:"Medium", src:"2024 catalogue (Re) / report §3-1" }),
    M({ mfr:"Samsung", type:"Re", app:"냉장고 LBP", model:"CD124K-S1ZA", refrigerant:"R134a", drive:"Fixed(RSIR)", cc:null, capW:49, inputW:64, cop:0.76, eer:2.61, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220V", phase:"1Φ", freq:"50Hz", confidence:"Medium", src:"report §3-1" }),
    M({ mfr:"Samsung", type:"Re", app:"냉장고 MBP", model:"MSA143K-S1B", refrigerant:"R134a", drive:"Fixed(RSCR)", cc:null, capW:112, inputW:77, cop:1.45, eer:4.95, condition:"ASHRAE-MBP", status:"양산", gap:"have", voltage:"115V", phase:"1Φ", freq:"60Hz", confidence:"High", src:"2024 catalogue p.31" }),
    M({ mfr:"Samsung", type:"Re", app:"냉장고 MBP", model:"MSA170K-S1G", refrigerant:"R134a", drive:"Fixed(RSCR)", cc:null, capW:201, inputW:132, cop:1.52, eer:5.20, condition:"ASHRAE-MBP", status:"양산", gap:"have", voltage:"220V", phase:"1Φ", freq:"50Hz", confidence:"High", nameNote:"2024 카탈로그 COP 1.52(구 1.49)", src:"2024 catalogue p.31" }),

    // ===== Samsung Ro R410A (로터리, 에어컨) — 2024 catalogue p.58/60 (ARI/AHRI) =====
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UG9C050HS", refrigerant:"R410A", drive:"Fixed(AC)", cc:4.9, capW:1465, inputW:495, cop:2.96, eer:10.1, condition:"ARI", status:"양산", gap:"have", voltage:"115V", phase:"1Φ", freq:"60Hz", confidence:"High", src:"2024 catalogue p.60" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UG4T200FUA", refrigerant:"R410A", drive:"Variable(BLDC)", cc:19.5, capW:5920, inputW:1788, cop:3.31, eer:11.3, condition:"ARI", status:"양산", gap:"have", phase:"1Φ", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.58" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UG8TH8265F", refrigerant:"R410A", drive:"Variable(BLDC)", cc:25.2, capW:7825, inputW:2282, cop:3.43, eer:11.7, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", nameNote:"R410A 로터리 최고 COP", src:"2024 catalogue p.58" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UG5TM5520F", refrigerant:"R410A", drive:"Variable(BLDC)", cc:49.4, capW:15445, inputW:4705, cop:3.28, eer:11.2, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.58" }),

    // ===== Samsung Ro R32 (로터리 DC Inverter Twin) — 2024 catalogue p.59 (ARI) =====
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UB9TK2150F", refrigerant:"R32", drive:"Variable(BLDC Twin)", cc:15.1, capW:4689, inputW:1455, cop:3.16, eer:11.0, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.59" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UB8TA8265F", refrigerant:"R32", drive:"Variable(BLDC Twin)", cc:25.2, capW:8440, inputW:2548, cop:3.31, eer:11.3, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.59" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UB8TN8300F", refrigerant:"R32", drive:"Variable(BLDC Twin)", cc:30.0, capW:9636, inputW:2911, cop:3.31, eer:11.3, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.59" }),
    M({ mfr:"Samsung", type:"Ro", app:"에어컨", model:"UB5TN5450F", refrigerant:"R32", drive:"Variable(BLDC Twin)", cc:43.0, capW:13950, inputW:4250, cop:3.28, eer:11.2, condition:"ARI", status:"양산", gap:"have", freq:"50/60Hz", confidence:"High", src:"2024 catalogue p.59" }),

    // ===== Samsung Ro R454B Unitary — 2024 catalogue p.67 (ARI, 양산) [카탈로그 권위] =====
    M({ mfr:"Samsung", type:"Ro", app:"Unitary AC", model:"UF9BL3180F", refrigerant:"R454B", drive:"Variable(BLDC Twin)", cc:17.6, capW:5188, inputW:1595, cop:3.25, eer:11.1, condition:"ARI", status:"양산", gap:"have", freq:"60Hz", confidence:"High", nameNote:"R454B는 스크롤이 아닌 로터리 Unitary(카탈로그 확정)", src:"2024 catalogue p.67", approvals:["AIM Act","EPA SNAP"], tech:["BLDC Twin","DC 인버터"] }),
    M({ mfr:"Samsung", type:"Ro", app:"Unitary AC", model:"UF8LB3265F", refrigerant:"R454B", drive:"Variable(BLDC Twin)", cc:25.2, capW:7532, inputW:2336, cop:3.22, eer:11.0, condition:"ARI", status:"양산", gap:"have", freq:"60Hz", confidence:"High", src:"2024 catalogue p.67" }),
    M({ mfr:"Samsung", type:"Ro", app:"Unitary AC", model:"UF8LB3360F", refrigerant:"R454B", drive:"Variable(BLDC Twin)", cc:36.0, capW:10668, inputW:3309, cop:3.22, eer:11.0, condition:"ARI", status:"양산", gap:"have", freq:"60Hz", confidence:"High", src:"2024 catalogue p.67" }),
    M({ mfr:"Samsung", type:"Ro", app:"Unitary AC", model:"UF5LB3520F", refrigerant:"R454B", drive:"Variable(BLDC Twin)", cc:49.4, capW:14712, inputW:4523, cop:3.25, eer:11.1, condition:"ARI", status:"양산", gap:"have", freq:"60Hz", confidence:"High", src:"2024 catalogue p.67" }),

    // ===== Samsung Sc R410A (스크롤 Variable) — 2024 catalogue p.92 (ARI) =====
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS2GR7046FVT", refrigerant:"R410A", drive:"Variable(BLDC)", cc:45.6, capW:15240, inputW:4602, cop:3.31, eer:11.3, condition:"ARI", status:"양산", gap:"have", voltage:"380-460V", phase:"3Φ", confidence:"High", nameNote:"구 표기 DS2GR7046FV", src:"2024 catalogue p.92" }),
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS4GR7066FVT", refrigerant:"R410A", drive:"Variable(BLDC)", cc:65.8, capW:22098, inputW:6670, cop:3.31, eer:11.3, condition:"ARI", status:"양산", gap:"have", voltage:"380-460V", phase:"3Φ", confidence:"High", src:"2024 catalogue p.92" }),
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS4GR5070FVT", refrigerant:"R410A", drive:"Variable(BLDC)", cc:70.0, capW:23535, inputW:6990, cop:3.37, eer:11.5, condition:"ARI", status:"양산", gap:"have", voltage:"380-460V", phase:"3Φ", confidence:"High", nameNote:"R410A 스크롤 최고 COP", src:"2024 catalogue p.92" }),
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS4GM7090FVT", refrigerant:"R410A", drive:"Variable(BLDC)", cc:90.0, capW:30305, inputW:9230, cop:3.28, eer:11.2, condition:"ARI", status:"양산", gap:"have", voltage:"380-460V", phase:"3Φ", confidence:"High", src:"2024 catalogue p.92" }),

    // ===== Samsung Sc R32 (스크롤 Variable) — 2024 catalogue p.92 (ARI) =====
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS2BB5033FVT", refrigerant:"R32", drive:"Variable(BLDC)", cc:33.0, capW:11782, inputW:3622, cop:3.25, eer:11.1, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"2024 catalogue p.92" }),
    M({ mfr:"Samsung", type:"Sc", app:"에어컨/히트펌프", model:"DS4BC7066FVT", refrigerant:"R32", drive:"Variable(BLDC)", cc:65.8, capW:23564, inputW:7243, cop:3.25, eer:11.1, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"구 DS4BC7066FV(COP 3.34는 오기) → 카탈로그 3.25", src:"2024 catalogue p.92" }),

    // ===== Samsung Sc R290 (스크롤 Variable, 히트펌프) — 2024 catalogue p.92 (ARI). R290은 Re만 미보유 =====
    M({ mfr:"Samsung", type:"Sc", app:"히트펌프", model:"DS4HD5066FVT", refrigerant:"R290", drive:"Variable(BLDC)", cc:65.8, capW:13042, inputW:3803, cop:3.43, eer:11.7, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"R290 스크롤 양산. 동급 R410A 대비 최고효율", src:"2024 catalogue p.92", approvals:["EU F-Gas 2027"], tech:["자연냉매(A3)","BLDC 인버터"], refrigerantCharge:"A3 충전량 관리" }),
    M({ mfr:"Samsung", type:"Sc", app:"히트펌프", model:"DS4HD5090FVT", refrigerant:"R290", drive:"Variable(BLDC)", cc:90.0, capW:17878, inputW:5259, cop:3.40, eer:11.6, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"2024 catalogue p.92" }),

    // ===== Samsung Sc R454B (2024 카탈로그 이후 개발 · perplexity 2026) =====
    M({ mfr:"Samsung", type:"Sc", app:"Unitary AC", model:"DS2LD5046F", refrigerant:"R454B", drive:"Variable(BLDC)", cc:46.0, capW:15000, inputW:null, cop:3.37, eer:11.5, condition:"ARI", status:"양산", gap:"have", confidence:"Medium", postCatalog:true, nameNote:"2024 카탈로그 이후 개발(스크롤 R454B). DS2DL5046F는 오기", src:"perplexity normalization §2.3 (2026-06)", approvals:["AIM Act","EPA SNAP","ASHRAE 90.1"], tech:["BLDC 인버터"] }),
    M({ mfr:"Samsung", type:"Sc", app:"Unitary AC", model:"DS8LC5040IN", refrigerant:"R454B", drive:"Fixed", cc:40.0, capW:13200, inputW:null, cop:null, eer:6.64, condition:"DOE-B", status:"양산", gap:"have", confidence:"Medium", postCatalog:true, nameNote:"2024 카탈로그 이후 개발. DS8C5040IN은 오기", src:"perplexity normalization §2.3 / gmcc §2.5 (2026-06)" }),
    M({ mfr:"Samsung", type:"Sc", app:"Unitary AC", model:"DS8LC5049IN", refrigerant:"R454B", drive:"Fixed", cc:49.0, capW:15700, inputW:null, cop:null, eer:6.67, condition:"DOE-B", status:"개발중", gap:"prog", confidence:"Medium", postCatalog:true, nameNote:"2024 카탈로그 이후 개발중. DSLC5049IN은 오기", src:"perplexity normalization §2.3 / gmcc §2.5 (2026-06)" }),

    // ===== 경쟁사 Sc R454B — Danfoss DSH 공식 2025.01 가이드, 60Hz ARI =====
    M({ mfr:"Danfoss", type:"Sc", app:"HVAC", model:"DSH090", refrigerant:"R454B", drive:"Fixed(AC)", cc:88.4, capW:26320, capBtu:89804, inputW:8180, cop:3.22, eer:10.98, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"non-lg-official §2.4 Danfoss DSH 공식값 정정", oilType:"POE", oilCharge:"3.0L", weightKg:58 }),
    M({ mfr:"Danfoss", type:"Sc", app:"HVAC", model:"DSH184", refrigerant:"R454B", drive:"Fixed(AC)", cc:170.3, capW:51267, capBtu:174922, inputW:15360, cop:3.34, eer:11.39, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"Danfoss 단일 DSH184. DSH180E는 DSH090×2 탠덤 어셈블리", src:"non-lg-official §2.4 Danfoss DSH 공식값 정정", oilType:"POE", oilCharge:"3.6L", weightKg:71.5 }),
    M({ mfr:"Danfoss", type:"Sc", app:"HVAC", model:"DSH240", refrigerant:"R454B", drive:"Fixed(AC)", cc:227.6, capW:68133, capBtu:232478, inputW:20810, cop:3.27, eer:11.17, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"non-lg-official §2.4 Danfoss DSH 공식값 정정", oilType:"POE", oilCharge:"6.1L" }),

    // ===== 경쟁사 Sc R454B — Copeland (ARI Fixed / EN12900 난방) =====
    M({ mfr:"Copeland", type:"Sc", app:"HVAC", model:"ZO38KAE-TFD", refrigerant:"R454B", drive:"Fixed", cc:null, capW:11100, inputW:null, cop:3.05, eer:null, condition:"ARI", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3" }),
    M({ mfr:"Copeland", type:"Sc", app:"HVAC", model:"ZO50KAE-TFD", refrigerant:"R454B", drive:"Fixed", cc:null, capW:14600, inputW:null, cop:3.10, eer:null, condition:"ARI", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3" }),
    M({ mfr:"Copeland", type:"Sc", app:"히트펌프", model:"YHV0382P", refrigerant:"R454B", drive:"Variable", cc:38.0, capW:12600, inputW:null, cop:2.20, eer:null, condition:"EN12900", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3 / followup §2-2-2 / 보완보고서 §1 (난방, 비교제외)", oilType:"POE", oilCharge:"1.2L", noiseDb:"64", maxDischarge:150, weightKg:20 }),
    M({ mfr:"Copeland", type:"Sc", app:"히트펌프", model:"YHV0502P", refrigerant:"R454B", drive:"Variable", cc:null, capW:null, inputW:null, cop:2.10, eer:null, condition:"EN12900", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3 (난방, 비교제외)" }),

    // ===== 경쟁사 Sc R454B — LG YPH/YBH Variable (DOE-A 46.1/10.0°C) — LG Scroll Catalog Feb 2025 =====
    // ⚠️ DOE-A(46.1°C) ≠ ARI(54.4°C) — ARI 환산 시 약 -20~25% 저하 예상. Samsung UF(ARI)와 직접 비교 불가.
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YPH024KA", refrigerant:"R454B", drive:"Variable", cc:null, capW:8702, capBtu:29700, inputW:1772, cop:4.91, eer:16.76, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YPH/YBH (DOE-A 46.1/10.0°C 공식확인)" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YPH030KA", refrigerant:"R454B", drive:"Variable", cc:null, capBtu:30000, inputW:null, cop:4.88, eer:null, condition:"DOE-A", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3 (카탈로그 미수록 — YPH029KA 10,548W 근접)", nameNote:"YPH030KA 카탈로그 미수록. YPH029KA(10,548W, COP~4.9) 대응 추정" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YPH036KA", refrigerant:"R454B", drive:"Variable", cc:null, capW:13097, capBtu:44700, inputW:2684, cop:4.88, eer:16.65, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YPH/YBH (DOE-A 공식확인)" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YBH048KA", refrigerant:"R454B", drive:"Variable", cc:null, capBtu:48000, inputW:null, cop:4.91, eer:null, condition:"DOE-A", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3 (카탈로그 미수록 — YBH049KA 17,990W 근접)", nameNote:"YBH048KA 카탈로그 미수록. YBH049KA(17,990W, COP 4.91) 대응" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YBH051KA", refrigerant:"R454B", drive:"Variable", cc:null, capW:18547, capBtu:63300, inputW:3777, cop:4.91, eer:16.76, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YPH/YBH (DOE-A 공식확인)" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YBH060KA", refrigerant:"R454B", drive:"Variable", cc:null, capBtu:60000, inputW:null, cop:4.87, eer:null, condition:"DOE-A", status:"양산", gap:"have", confidence:"Medium", src:"normalization §2.3 (카탈로그 미수록)", nameNote:"YBH060KA 카탈로그 미수록. 추정치 유지" }),

    // ===== 경쟁사 Sc R454B — LG YRH/YGH Fixed (DOE-A 46.1/10.0°C) 대형 — LG Scroll Catalog Feb 2025 =====
    // ⚠️ DOE-A(46.1°C) ≠ ARI(54.4°C). Samsung DS8LC(ARI)와 직접 비교 불가 — 별도 그룹.
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YRH083KA", refrigerant:"R454B", drive:"Fixed", cc:null, capW:30326, capBtu:103500, inputW:6310, cop:4.81, eer:16.40, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YRH (DOE-A 공식확인, 1Ø 대표)", voltage:"1Ø 208-230V", freq:"60Hz" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC", model:"YRH104RA", refrigerant:"R454B", drive:"Fixed", cc:null, capW:38266, capBtu:130500, inputW:7650, cop:5.00, eer:17.07, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YRH (DOE-A 공식확인, 3Ø 최고효율)", voltage:"3Ø 208-230V", freq:"60Hz" }),
    M({ mfr:"LG", type:"Sc", app:"Unitary AC (대형)", model:"YGH275WA", refrigerant:"R454B", drive:"Fixed", cc:null, capW:80868, capBtu:275900, inputW:17056, cop:4.74, eer:16.18, condition:"DOE-A", status:"양산", gap:"have", confidence:"High", src:"LG Scroll Catalog 2025 §YGH (DOE-A 공식확인, 50Hz)", voltage:"3Ø 380/420V", freq:"50Hz" }),

    // ===== 경쟁사 Sc R454B — GMCC STD (DOE-B Fixed) — GMCC md §2.2 =====
    M({ mfr:"GMCC", type:"Sc", app:"주거 AC", model:"STDA016N1ULB", refrigerant:"R454B", drive:"Fixed", cc:17.0, capW:6435, capBtu:21950, inputW:null, cop:null, eer:6.20, condition:"DOE-B", status:"개발중", gap:"prog", confidence:"High", src:"gmcc §2.2" }),
    M({ mfr:"GMCC", type:"Sc", app:"주거 AC", model:"STDA024N1ULB", refrigerant:"R454B", drive:"Fixed", cc:24.2, capW:9350, capBtu:31900, inputW:null, cop:null, eer:6.30, condition:"DOE-B", status:"개발중", gap:"prog", confidence:"High", src:"gmcc §2.2" }),
    M({ mfr:"GMCC", type:"Sc", app:"주거 AC", model:"STDA029N1ULB", refrigerant:"R454B", drive:"Fixed", cc:29.8, capW:11575, capBtu:39500, inputW:null, cop:null, eer:6.40, condition:"DOE-B", status:"양산", gap:"have", confidence:"High", src:"gmcc §2.2" }),
    M({ mfr:"GMCC", type:"Sc", app:"주거 AC", model:"STDA031N1ULB", refrigerant:"R454B", drive:"Fixed", cc:31.5, capW:12380, capBtu:42250, inputW:null, cop:null, eer:6.43, condition:"DOE-B", status:"양산", gap:"have", confidence:"High", src:"gmcc §2.2 (Innovair GT4 탑재)", noiseDb:"58~62", oilType:"POE", oilCharge:"0.9~1.2L", maxDischarge:135, approvals:["EPA SNAP","CARB","China GB"], oemWins:["Innovair GT4-36K"] }),
    M({ mfr:"GMCC", type:"Sc", app:"상업 AC", model:"STDC049N1ULB", refrigerant:"R454B", drive:"Fixed", cc:48.9, capW:19050, capBtu:65000, inputW:null, cop:null, eer:6.50, condition:"DOE-B", status:"양산", gap:"have", confidence:"High", src:"gmcc §2.2 (STDC 최고효율)", noiseDb:"60~65", oilType:"POE", oilCharge:"1.2~1.5L", maxDischarge:135, approvals:["EPA SNAP","CARB","China GB"], oemWins:["Innovair GT4"] }),
    M({ mfr:"GMCC", type:"Sc", app:"상업 AC", model:"STDC051N1ULB", refrigerant:"R454B", drive:"Fixed", cc:51.5, capW:20040, capBtu:68400, inputW:null, cop:null, eer:6.48, condition:"DOE-B", status:"양산", gap:"have", confidence:"High", src:"gmcc §2.2" }),

    // ===== 경쟁사 Ro R32/R410A — 메인 §3-2 / §9-2 =====
    M({ mfr:"GMCC", type:"Ro", app:"에어컨(Twin DC)", model:"ATF310D43UMT", refrigerant:"R32", drive:"Variable(BLDC)", cc:30.8, capW:9490, inputW:2600, cop:3.65, eer:null, condition:"SEER60", status:"양산", gap:"have", confidence:"High", src:"report §3-2 / GMCC catalog (SEER60 조건 확정 — ARI와 직접 비교 불가)", nameNote:"SEER60 조건(응축 42.3°C). Samsung UB(ARI 3.31)와 조건 달라 순위비교 금지" }),
    M({ mfr:"GMCC", type:"Ro", app:"에어컨(Twin DC)", model:"ATF400D64UMV", refrigerant:"R32", drive:"Variable(BLDC)", cc:39.8, capW:12285, inputW:3365, cop:3.65, eer:null, condition:"SEER60", status:"양산", gap:"have", confidence:"High", src:"report §3-2 / GMCC catalog (SEER60 조건 확정)" }),
    M({ mfr:"GMCC", type:"Ro", app:"에어컨(Twin DC)", model:"ATQ360D1UMU", refrigerant:"R32", drive:"Variable(BLDC)", cc:36.3, capW:11200, inputW:3040, cop:3.68, eer:null, condition:"SEER60", status:"양산", gap:"have", confidence:"High", src:"보완보고서 §4 / GMCC catalog (SEER60 조건)" }),
    M({ mfr:"GMCC", type:"Ro", app:"에어컨(Twin DC)", model:"ATQ420D1UMU", refrigerant:"R32", drive:"Variable(BLDC)", cc:41.5, capW:12960, inputW:3485, cop:3.72, eer:null, condition:"SEER60", status:"양산", gap:"have", confidence:"High", src:"보완보고서 §4 / GMCC catalog (SEER60 조건)" }),
    M({ mfr:"Highly", type:"Ro", app:"에어컨", model:"SH307MV", refrigerant:"R32", drive:"Variable(BLDC)", cc:30.7, capW:5250, inputW:1641, cop:3.20, eer:null, condition:"미확인", status:"양산", gap:"have", confidence:"Medium", src:"report §3-2" }),
    M({ mfr:"LG", type:"Ro", app:"에어컨", model:"GSG045MJ", refrigerant:"R410A", drive:"Variable(BLDC)", cc:null, capW:1379, inputW:402, cop:3.43, eer:11.7, condition:"미확인", status:"양산", gap:"have", confidence:"Medium", src:"report §9-2" }),

    // ===== 비-LG 경쟁사 공식 보완 — Panasonic Ro, 2026-07-30 =====
    M({ mfr:"Panasonic", type:"Ro", app:"에어컨", model:"9RL160Z", aliases:["9RL160Z-"], refrigerant:"R32", drive:"Variable(DC inverter)", cc:16.0, capW:4414, capBtu:15061, inputW:1746, cop:2.56, eer:8.73, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"공식 표기 9RL160Z-, ARI 57.5Hz", src:"non-lg-official §2.2 Panasonic Ro" }),
    M({ mfr:"Panasonic", type:"Ro", app:"에어컨", model:"5KD184XAA21", refrigerant:"R410A", drive:"Variable(DC inverter)", cc:18.4, capW:5440, capBtu:18560, inputW:null, cop:3.01, eer:10.27, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"non-lg-official §2.2 Panasonic Ro" }),
    M({ mfr:"Panasonic", type:"Ro", app:"에어컨", model:"5KD240XAA21", refrigerant:"R410A", drive:"Variable(DC inverter)", cc:24.0, capW:7280, capBtu:24840, inputW:2400, cop:3.03, eer:10.35, condition:"ARI", status:"양산", gap:"have", confidence:"High", src:"non-lg-official §2.2 Panasonic Ro" }),
    M({ mfr:"Panasonic", type:"Ro", app:"에어컨", model:"5VD550ZD", aliases:["5VD550ZD-"], refrigerant:"R410A", drive:"Variable(DC inverter)", cc:55.0, capW:17250, capBtu:58857, inputW:5442, cop:3.17, eer:10.82, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"공식 표기 5VD550ZD-, ARI 57.5Hz", src:"non-lg-official §2.2 Panasonic Ro" }),
    M({ mfr:"Panasonic", type:"Ro", app:"Unitary AC", model:"KRD220Z", aliases:["KRD220Z-"], refrigerant:"R454B", drive:"Variable(DC inverter)", cc:22.0, capW:8070, capBtu:27535, inputW:1900, cop:4.25, eer:14.49, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"공식 표기 KRD220Z-, ARI 57.5Hz", src:"non-lg-official §2.2 Panasonic Ro" }),
    M({ mfr:"Panasonic", type:"Ro", app:"Unitary AC", model:"KKD420Z", aliases:["KKD420Z-"], refrigerant:"R454B", drive:"Variable(DC inverter)", cc:42.0, capW:16185, capBtu:55223, inputW:3710, cop:4.36, eer:14.88, condition:"ARI", status:"양산", gap:"have", confidence:"High", nameNote:"공식 표기 KKD420Z-, ARI 57.5Hz", src:"non-lg-official §2.2 Panasonic Ro" }),

    // ===== 경쟁사 Sc R290 (히트펌프 · 난방) — Copeland DSC167-EN (HP Heating -7/50°C) =====
    // 주의: 난방 조건 COP. Samsung DS4HD(냉방 ARI 3.43)와 직접 비교 불가 — 참고 그룹
    M({ mfr:"Copeland", type:"Sc", app:"히트펌프(고정속)", model:"ZH11KCU", refrigerant:"R290", drive:"Fixed", cc:null, capW:10900, inputW:null, cop:3.3, eer:null, condition:"HP-heating", status:"양산", gap:"have", confidence:"High", noiseDb:"65", weightKg:38, src:"보완보고서 §5-1 / Copeland DSC167-EN (Heating -7/50°C)" }),
    M({ mfr:"Copeland", type:"Sc", app:"히트펌프(고정속)", model:"ZH13KCU", refrigerant:"R290", drive:"Fixed", cc:null, capW:13000, inputW:null, cop:3.3, eer:null, condition:"HP-heating", status:"양산", gap:"have", confidence:"High", noiseDb:"67", weightKg:40, src:"보완보고서 §5-1 / Copeland DSC167-EN (Heating -7/50°C)" }),
    M({ mfr:"Copeland", type:"Sc", app:"히트펌프(가변속)", model:"YHV0461U", refrigerant:"R290", drive:"Variable", cc:46.0, capW:null, inputW:null, cop:3.2, eer:null, condition:"HP-heating", status:"양산", gap:"have", confidence:"High", oilCharge:"1.2L", src:"보완보고서 §5-2 / Copeland DSC167-EN (Heating @90Hz, -7/50°C)" }),

    // ===== 경쟁사 Re R290 (냉장고) — r290 벤치마크 md §2 =====
    M({ mfr:"LG", type:"Re", app:"냉장고 LBP", model:"CMA053PJJM", refrigerant:"R290", drive:"Fixed", cc:5.3, capW:203, inputW:null, cop:1.28, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220V", freq:"50Hz", confidence:"High", src:"r290 §2-2" }),
    M({ mfr:"LG", type:"Re", app:"냉장고 LBP", model:"CMA075PHEM", refrigerant:"R290", drive:"Fixed", cc:7.5, capW:335, inputW:null, cop:1.50, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-2" }),
    M({ mfr:"Embraco", type:"Re", app:"냉장고 LBP", model:"EMT2121U", refrigerant:"R290", drive:"Fixed", cc:5.20, capW:270, inputW:165, cop:1.64, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-3" }),
    M({ mfr:"Embraco", type:"Re", app:"상업냉동 HBP", model:"NEU6217U", refrigerant:"R290", drive:"Fixed", cc:14.30, capW:1903, inputW:null, cop:1.73, eer:null, condition:"ASHRAE-MBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-3 (HBP)" }),
    M({ mfr:"Embraco", type:"Re", app:"상업냉동 HBP", model:"NT6230U", refrigerant:"R290", drive:"Fixed", cc:27.80, capW:3620, inputW:null, cop:1.77, eer:null, condition:"ASHRAE-MBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-3 (R290 Re 최고 COP)" }),
    M({ mfr:"GMCC", type:"Re", app:"냉장고 LBP", model:"PA59HMZ", refrigerant:"R290", drive:"Fixed", cc:5.9, capW:295, inputW:164, cop:1.80, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-4" }),
    M({ mfr:"GMCC", type:"Re", app:"냉장고 MBP", model:"KA140QHT", refrigerant:"R290", drive:"Fixed", cc:14.0, capW:1100, inputW:564, cop:1.95, eer:null, condition:"ASHRAE-MBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"High", src:"r290 §2-4" }),
    M({ mfr:"Secop", type:"Re", app:"상업냉장 MBP", model:"NLE12.6CNL", refrigerant:"R290", drive:"Fixed", cc:12.60, capW:1277, inputW:572, cop:2.04, eer:null, condition:"ASHRAE-MBP", status:"양산", gap:"have", confidence:"High", src:"r290 §2-5 (R290 Re 최고 MBP COP)" }),
    M({ mfr:"Secop", type:"Re", app:"상업냉장 MBP", model:"DLE4.8CN", refrigerant:"R290", drive:"Fixed", cc:4.80, capW:415, inputW:210, cop:1.98, eer:null, condition:"ASHRAE-MBP", status:"양산", gap:"have", confidence:"High", src:"r290 §2-5" }),
    M({ mfr:"Panasonic", type:"Re", app:"냉장고(인버터)", model:"EEI57T13DMH", refrigerant:"R290", drive:"Variable(인버터)", cc:5.7, capW:360, inputW:null, cop:null, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", voltage:"220-240V", freq:"50Hz", confidence:"Medium", src:"r290 §2-6 (COP 미공개)" }),
    M({ mfr:"Panasonic", type:"Re", app:"냉장고(인버터)", model:"TKF76E25DCH-52RPS", aliases:["TKF76E25DCH(52RPS)"], refrigerant:"R600a", drive:"Variable(인버터)", cc:7.6, capW:149, inputW:null, cop:2.06, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", confidence:"High", nameNote:"공식 표기 TKF76E25DCH(52RPS)", src:"non-lg-official §2.1 Panasonic Re" }),
    M({ mfr:"Secop", type:"Re", app:"모바일 냉장 LBP", model:"BD35F", refrigerant:"R134a", drive:"Variable(2000-3500rpm)", cc:2.0, capW:50.5, inputW:null, cop:1.15, eer:null, condition:"ASHRAE-LBP", status:"양산", gap:"have", confidence:"High", nameNote:"공식 BD Nano 비교표, 최대 속도 ASHRAE LBP", src:"non-lg-official §2.3 Secop Re" }),
  ];

  // ── 동일 비교군 (Reporting 그룹뷰 + KPI 벤치) ────────────────
  // 같은 condition 안에서만 직접 비교. samsungRef = 군의 당사 기준 모델.
  // members = 군에 속한 모델명. metric = 비교 지표(cop|eer).
  var BENCHMARK_GROUPS = [
    { id:"r454b-ro-ari",      title:"R454B 로터리 Unitary · ARI",     type:"Ro", refrigerant:"R454B", condition:"ARI",   drive:"Variable", metric:"cop", samsungRef:"UF8LB3265F", members:["UF9BL3180F","UF8LB3265F","UF8LB3360F","UF5LB3520F","KRD220Z","KKD420Z"], note:"Samsung과 Panasonic 공식 ARI 가변속 로터리. 용량 ±15% 이내 후보만 Compare Lab에서 직접 비교한다.", reliability:5 },
    { id:"r454b-sc-var-ari",  title:"R454B 스크롤 · Variable · ARI",  type:"Sc", refrigerant:"R454B", condition:"ARI",   drive:"Variable", metric:"cop", samsungRef:"DS2LD5046F", members:["DS2LD5046F"], note:"Danfoss DSH와 Copeland ZO는 Fixed로 정정되어 이 가변속 직접 비교군에서 제외했다.", reliability:3 },
    { id:"r454b-sc-fix-doeb", title:"R454B 스크롤 · Fixed · DOE-B",   type:"Sc", refrigerant:"R454B", condition:"DOE-B", drive:"Fixed",    metric:"eer", samsungRef:"DS8LC5040IN", members:["DS8LC5040IN","DS8LC5049IN","STDA029N1ULB","STDA031N1ULB","STDC049N1ULB","STDC051N1ULB","STDA016N1ULB","STDA024N1ULB"], note:"당사 스크롤 R454B(DS8LC, 2024 이후 개발) vs GMCC STD — 동일 DOE-B. 당사 EER 6.64~6.67로 +1.9~3.6% 우위.", reliability:4 },
    { id:"r454b-sc-doea",     title:"R454B 스크롤 · DOE-A (LG Variable)", type:"Sc", refrigerant:"R454B", condition:"DOE-A", drive:"Variable", metric:"cop", samsungRef:null, members:["YPH024KA","YPH030KA","YPH036KA","YBH048KA","YBH051KA","YBH060KA"], note:"LG 가변속(Variable) DOE-A(46.1/10.0°C). COP 4.87~4.91. ARI 환산 ×0.80 적용 시 ~3.9(추산) — Samsung UF ARI(3.31)보다 환산 후에도 높을 수 있으나 ±5% 불확실. ARI 실측값 요청 필요.", reliability:3 },
    { id:"r454b-sc-fix-doea", title:"R454B 스크롤 · Fixed · DOE-A (LG 대형)", type:"Sc", refrigerant:"R454B", condition:"DOE-A", drive:"Fixed", metric:"cop", samsungRef:null, members:["YRH083KA","YRH104RA","YGH275WA"], note:"LG 고정속(Fixed) 대형 라인업 DOE-A(46.1/10.0°C). COP 4.74~5.00, 용량 30~81kW. Samsung 기준 모델 없음(당사 DS8LC는 ARI 조건) — 조건 전환 없이 직접 비교 불가. 참고군으로 관리.", reliability:2 },
    { id:"r454b-sc-en12900",  title:"R454B 스크롤 · EN12900 (난방)",  type:"Sc", refrigerant:"R454B", condition:"EN12900", drive:"Variable", metric:"cop", samsungRef:null, members:["YHV0382P","YHV0502P"], note:"Copeland YHV 난방 데이터 — 냉방 비교 제외, 별도 관리.", reliability:1 },
    { id:"r32-ro-var",        title:"R32 로터리 · Variable · ARI",    type:"Ro", refrigerant:"R32", condition:"ARI", drive:"Variable", metric:"cop", samsungRef:"UB9TK2150F", members:["UB9TK2150F","UB8TA8265F","UB8TN8300F","UB5TN5450F","9RL160Z"], note:"Samsung UB와 Panasonic 9RL 공식 ARI 비교군. GMCC SEER60과 Highly 조건 미확인 값은 직접 순위에서 제외한다.", reliability:5 },
    { id:"r410a-ro-var-ari",  title:"R410A 로터리 · Variable · ARI",  type:"Ro", refrigerant:"R410A", condition:"ARI", drive:"Variable", metric:"cop", samsungRef:"UG8TH8265F", members:["UG4T200FUA","UG8TH8265F","UG5TM5520F","5KD184XAA21","5KD240XAA21","5VD550ZD"], note:"Samsung과 Panasonic 공식 ARI 가변속 로터리 비교군.", reliability:5 },
    { id:"r290-sc-ari",       title:"R290 스크롤 · ARI (당사 차별화)", type:"Sc", refrigerant:"R290", condition:"ARI", drive:"Variable", metric:"cop", samsungRef:"DS4HD5066FVT", members:["DS4HD5066FVT","DS4HD5090FVT"], note:"당사 R290 스크롤 양산(COP 3.43, 2024 카탈로그) — 동급 R410A(3.31) 대비 효율 우위. 공개 경쟁 ARI 스펙 미확보(차별화 영역). Copeland R290 스크롤은 난방 조건만 확보 → r290-sc-heating 참고.", reliability:3 },
    { id:"r290-sc-heating",   title:"R290 스크롤 · 난방 HP(-7/50) [참고]", type:"Sc", refrigerant:"R290", condition:"HP-heating", drive:"mixed", metric:"cop", samsungRef:null, members:["ZH11KCU","ZH13KCU","YHV0461U"], note:"Copeland R290 스크롤 난방 조건(-7/50°C). Samsung DS4HD 냉방 ARI(3.43)와 직접 비교 불가 — 측정 방향(냉방↔난방)·조건 상이. Heating COP 3.2~3.3 수준 참고용. 냉방 ARI 데이터 확보 시 r290-sc-ari에 통합 가능.", reliability:2 },
    { id:"r290-re-lbp",       title:"R290 왕복동 · ASHRAE LBP",       type:"Re", refrigerant:"R290", condition:"ASHRAE-LBP", drive:"Fixed", metric:"cop", samsungRef:null, members:["CMA053PJJM","CMA075PHEM","EMT2121U","PA59HMZ","EEI57T13DMH"], note:"당사 공백(P1). 경쟁사 COP 1.28~1.80(LBP).", reliability:3 },
    { id:"r290-re-mbp",       title:"R290 왕복동 · ASHRAE MBP",       type:"Re", refrigerant:"R290", condition:"ASHRAE-MBP", drive:"Fixed", metric:"cop", samsungRef:null, members:["NEU6217U","NT6230U","KA140QHT","NLE12.6CNL","DLE4.8CN"], note:"당사 공백(P1). Secop NLE 최대 COP 2.04(MBP).", reliability:3 },
    { id:"re-bldc-uplift",    title:"냉장고 Re · BLDC 전환 효과",     type:"Re", refrigerant:"R600a/R134a", condition:"ASHRAE-LBP", drive:"mixed", metric:"cop", samsungRef:"ENV4A5DL2B", members:["ENV4A5DL2B","TKF76E25DCH-52RPS","CD124K-S1ZA","MSA143K-S1B","MSA170K-S1G"], note:"ENV4A5DL2B와 Panasonic TKF76E25DCH-52RPS는 R600a·ASHRAE-LBP·Variable 직접 비교. 나머지는 Samsung 내부 참고.", reliability:4 },
  ];

  // ── Samsung 공백 (메인 §10-1, 2024 카탈로그 반영) ─────────────
  var GAPS = [
    { refrigerant:"R290", type:"Re", title:"R290 왕복동", status:"없음", priority:"P1", driver:"EU F-Gas · 인도 규제", rivals:"LG·Embraco·GMCC·Secop·Panasonic 양산중", detail:"냉장고 R290 왕복동(Re)만 미보유. R290 로터리·스크롤은 당사 양산. 경쟁사 6사 중 5사 R290 Re 양산." },
    { refrigerant:"R744", type:"전 유형", title:"R744 / CO2", status:"없음", priority:"P2", driver:"히트펌프·상업냉동 성장", rivals:"Copeland·GMCC·Panasonic·Danfoss", detail:"초고압 플랫폼 부재. 히트펌프 고성장 세그먼트 미진입." },
    { refrigerant:"R1234yf", type:"전 유형", title:"R1234yf", status:"없음", priority:"P3", driver:"EV·프리미엄 냉장고", rivals:"Embraco·GMCC·Panasonic·Highly", detail:"Re·Ro·Sc 전 제품 미확인." },
    { refrigerant:"R454C", type:"전 유형", title:"R454C 등 상업냉동", status:"없음", priority:"낮음", driver:"R404A 대체", rivals:"Danfoss·Embraco·Panasonic", detail:"상업냉동용 저GWP 냉매 미진출. (R454B는 로터리+스크롤 양산으로 대응됨)" },
  ];

  // ── 전환 우선순위 P1~P6 (메인 §7-4, 2024 카탈로그 반영) ───────
  var PRIORITIES = [
    { p:"P1", path:"R134a → R290", type:"Re 왕복동", status:"없음",          action:"개발 로드맵 확인·가속", urgency:"매우 높음", driver:"EU F-Gas · 인도 규제", accent:T.danger },
    { p:"P2", path:"R744/CO2 진입 검토", type:"Ro/Sc 히트펌프", status:"없음", action:"중기 개발 검토",        urgency:"높음",     driver:"히트펌프 시장 성장", accent:"#FC642D" },
    { p:"P3", path:"R454B 스크롤 Fixed 양산 완성", type:"Sc 스크롤", status:"Variable 양산·Fixed 개발중", action:"Fixed Speed(DS8LC5049IN) 양산 전환", urgency:"중간", driver:"미국 상업 AC(AIM Act)", accent:"#1D6FB8" },
    { p:"P4", path:"R290 스크롤 라인 확대", type:"Sc 스크롤", status:"65.8/90cc 양산",   action:"용량 라인업 확대(COP 3.43)", urgency:"중간",   driver:"자연냉매 효율 차별화", accent:T.Ro },
    { p:"P5", path:"R32 대용량 스크롤·로터리 확대", type:"Sc/Ro", status:"양산", action:"대형 시장 선점", urgency:"중간", driver:"효율 향상 · 대형 시장", accent:"#E8A100" },
    { p:"P6", path:"R1234yf 왕복동", type:"Re 왕복동", status:"없음",            action:"장기 검토",          urgency:"낮음",     driver:"EV·프리미엄 냉장고", accent:T.sub },
  ];

  // ── 규제 (followup md §2-4) ──────────────────────────────────
  var REGULATIONS = [
    { id:"AIM Act",          region:"미국",   year:2025, status:"적용 중", refs:"R454B·R32", impact:"Unitary AC R410A 퇴출 — 당사 R454B 로터리 Unitary 양산 대응", url:"" },
    { id:"EU F-Gas 2027",    region:"유럽",   year:2027, status:"예정",    refs:"R290·R454B", impact:"칠러 ≤12kW GWP≥150 금지 — 당사 R290 HP 사전대응(COP 4.80)", url:"https://climate.ec.europa.eu/eu-action/fluorinated-greenhouse-gases/climate-friendly-alternatives-f-gases/air-conditioning_en" },
    { id:"ASHRAE 90.1-2022", region:"미국",   year:2022, status:"적용 중", refs:"SEER2 ≥15.2 / EER2 ≥11.7", impact:"고효율 기준 — 당사 R454B/R32 변속 적합", url:"" },
    { id:"China GB 19577-2024", region:"중국", year:2024, status:"적용 중", refs:"CSPF+COPc 이중트랙", impact:"공냉식 칠러 신규 지표 — 당사 Unitary 인증 재검토 필요", url:"" },
    { id:"인도 규제",         region:"인도",   year:2025, status:"강화",    refs:"R290", impact:"냉장고 자연냉매 압력 — R290 Re 공백 리스크", url:"" },
  ];

  // ── 냉매 전환 로드맵 타임라인 (followup md §2-3-4) ──────────────
  var ROADMAP = [
    { phase:"현재 (2025)",      ac:"R410A (주류)",          re:"R134a (냉장고)",    legacy:"R22 (레거시)" },
    { phase:"단기 (2026~2027)", ac:"R454B (AIM Act 대응)",  re:"R600a / R290",      legacy:"단계적 퇴출" },
    { phase:"중기 (2028~2030)", ac:"R290 / R32 (EU·글로벌)", re:"R290 확대",         legacy:"완전 퇴출" },
  ];

  // ── Samsung 최신 동향 (followup md §2-1 + 2024 카탈로그) ───────
  var SAMSUNG_MOVES = [
    { date:"2024",    title:"2024 압축기 카탈로그 발행", detail:"Re/Ro/Sc 전 라인업 96p 공개. 측정조건(ASHRAE/ARI) 명기. 카탈로그 현행화 완료.", tag:"카탈로그" },
    { date:"2024-03", title:"R290 모노블록 히트펌프", detail:"AE120CXYDGK-EU · 난방 12kW · COP 4.80 (A7/W35). EU F-Gas 대응.", tag:"양산" },
    { date:"2024-12", title:"AI 인버터 압축기 (CES 2025)", detail:"모터효율 95%+, 효율 +10%(950~1450rpm), 소음 <35dB(A). 냉장고 AI Hybrid Cooling.", tag:"발표" },
    { date:"2024",    title:"R454B 로터리 Unitary", detail:"UF 시리즈(17.6~49.4cc, ARI COP 3.22~3.25) 양산. (2024 카탈로그 수록)", tag:"양산" },
    { date:"2026",    title:"R454B 스크롤 (카탈로그 이후 개발)", detail:"DS2LD5046F Variable(ARI COP 3.37) 양산 + DS8LC5049IN Fixed 개발중. 2024 카탈로그 이후 신규 개발.", tag:"양산" },
  ];

  // ── 카탈로그 출처·연도 (메인 §2 Source Inventory + 2024 카탈로그) ──
  // year = 신선도 계산용 대표연도. yearLabel = 표기용. self=당사.
  var CATALOG_SOURCES = [
    { mfr:"Samsung", self:true, year:2024, yearLabel:"2024", doc:"Samsung Compressor Catalogue 2024 (96p, PDF)", webUpdate:"2025-02-04", url:"https://www.samsung.com/global/business/compressor/", note:"2024 공식 카탈로그 확보 — Re/Ro/Sc 풀스펙·측정조건 명기. (구 2018 PDF 대체)" },
    { mfr:"LG",       self:false, year:2025, yearLabel:"2025 (Sc ~2023-24)", doc:"Reciprocating 2025 · Rotary 2024 · Scroll ~2023-24", url:"https://www.lg.com/global/business/compressor-motor/", note:"Re는 최신(2025). Scroll 카탈로그는 2023~2024로 다소 경과." },
    { mfr:"Embraco",  self:false, year:2026, yearLabel:"2025-2026", doc:"제품 웹 + Product Selector(2026)", url:"https://www.embraco.com", note:"선택도구 포함 최신." },
    { mfr:"Danfoss",  self:false, year:2026, yearLabel:"2025-2026", doc:"Scroll(DSH) · Maneurop · Turbocor 웹", url:"https://www.danfoss.com/en/products/dcs/compressors/", note:"최신." },
    { mfr:"Secop",    self:false, year:2026, yearLabel:"2026-03", doc:"Product Portfolio PDF (2026.03) + Toolkit", url:"https://www.secop.com/products/product-portfolio", note:"가장 최신 갱신(2026년 3월)." },
    { mfr:"Copeland", self:false, year:2024, yearLabel:"2024", doc:"General Catalogue 2024 + Select 소프트웨어", url:"https://www.copeland.com", note:"2년 경과 — 신모델/가격 점검 권장." },
    { mfr:"GMCC",     self:false, year:2026, yearLabel:"2026 (Sc 2025·Re 2024)", doc:"Rotary 2026 · Scroll 2025 · Reciprocating 2024", url:"https://www.gmcc-welling.com/en", note:"Rotary 최신. Scroll 2025, Re 2024." },
    { mfr:"Highly",   self:false, year:2024, yearLabel:"2024", doc:"Rotary Catalogue 2024 · EV Scroll", url:"https://en.highly.cc", note:"2년 경과 — 점검 권장." },
    { mfr:"Panasonic",self:false, year:2026, yearLabel:"2025-26 (Sc 2023)", doc:"Rotary 2025-2026 · Scroll 2023", url:"https://industrial.panasonic.com/ww/products/motors-compressors/compressors", note:"Rotary 최신. Scroll 카탈로그 2023으로 3년 경과." },
  ];

  // ── 핵심 KPI (파생값 스냅샷) ─────────────────────────────────
  var KPI = {
    samsungModels: MODELS.filter(function (m) { return m.mfr === "Samsung"; }).length,
    competitorModels: MODELS.filter(function (m) { return m.mfr !== "Samsung"; }).length,
    refrigerantCoverage: { covered: 8, total: 11 },
    topCop: { value: 3.43, model: "DS4HD5066FVT", note: "R290 스크롤 (양산)" },
    p1Gaps: GAPS.filter(function (g) { return g.priority === "P1"; }).length,
    catalogYear: 2024,
  };

  window.COMPRESSOR_DATA = {
    meta: { asOf: "2026-07-30", baseline: "Samsung", confidence: "High–Medium", nextReview: "2026-10-30", sources: 30, currentYear: 2026, samsungCatalog: 2024 },
    tokens: T,
    conditions: CONDITIONS,
    refrigerants: REFRIGERANTS,
    manufacturers: MANUFACTURERS,
    models: MODELS,
    benchmarkGroups: BENCHMARK_GROUPS,
    gaps: GAPS,
    priorities: PRIORITIES,
    regulations: REGULATIONS,
    roadmap: ROADMAP,
    samsungMoves: SAMSUNG_MOVES,
    catalogSources: CATALOG_SOURCES,
    kpi: KPI,
  };
})();
