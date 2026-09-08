const pptxgen = require("pptxgenjs");

const NAVY = "1E2761";
const ICE = "CADCFC";
const WHITE = "FFFFFF";
const MINT = "3DDC97";
const TEXT_DARK = "1E2761";
const TEXT_MUTED = "5A6B8C";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5

const FONT_TITLE = "Cambria";
const FONT_BODY = "Calibri";

function baseSlide(bg) {
  const s = pres.addSlide();
  s.background = { color: bg };
  return s;
}

function eyebrow(s, text, color) {
  s.addText(text.toUpperCase(), {
    x: 0.6, y: 0.4, w: 8, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, bold: true, color, charSpacing: 2,
    isTextBox: true, margin: 0,
  });
}

// ---------- Slide 1: 제안 개요 (dark hero) ----------
{
  const s = baseSlide(NAVY);
  eyebrow(s, "TechBridge · Proposal", ICE);
  s.addText("고객지원 챗봇 플랫폼 구축 제안", {
    x: 0.6, y: 0.9, w: 12, h: 1.3,
    fontFace: FONT_TITLE, fontSize: 40, bold: true, color: WHITE,
    isTextBox: true, margin: 0,
  });
  s.addText(
    "이메일·전화 중심의 CS 대응 구조를 AI 기반 1차 자동응대 체계로 전환하여, 평균 응답 시간을 6시간에서 3초 이내로 단축하고 성수기 문의 급증에도 안정적으로 대응할 수 있는 구조를 제안합니다.",
    {
      x: 0.6, y: 2.3, w: 7.4, h: 1.6,
      fontFace: FONT_BODY, fontSize: 15, color: ICE, lineSpacing: 24,
      isTextBox: true, margin: 0,
    }
  );

  const stats = [
    ["6h → 3s", "평균 응답 시간"],
    ["3억원", "예산 상한"],
    ["141.75백만원", "총 제안 비용"],
    ["53%", "예산 대비 여유"],
  ];
  stats.forEach(([num, label], i) => {
    const x = 0.6 + i * 3.05;
    s.addShape("roundRect", { x, y: 4.4, w: 2.75, h: 1.9, rectRadius: 0.08, fill: { color: "273878" }, line: { type: "none" } });
    s.addText(num, { x, y: 4.62, w: 2.75, h: 0.8, align: "center", fontFace: FONT_TITLE, fontSize: 24, bold: true, color: MINT, isTextBox: true, margin: 0 });
    s.addText(label, { x, y: 5.4, w: 2.75, h: 0.6, align: "center", fontFace: FONT_BODY, fontSize: 11, color: ICE, isTextBox: true, margin: 0 });
  });

  s.addText("승리 포인트:  (1) 벤더 락인 없는 LLM 어댑터 구조   (2) 기존 Zendesk 계약 그대로 활용   (3) 예산 대비 53% 여유", {
    x: 0.6, y: 6.65, w: 12, h: 0.5,
    fontFace: FONT_BODY, fontSize: 12, italic: true, color: ICE,
    isTextBox: true, margin: 0,
  });
}

// ---------- Slide 2: 고객 요구사항 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "01 · Client Requirements", NAVY);
  s.addText("고객 요구사항", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });

  const cols = [
    { label: "기능", color: NAVY, items: ["임베드형 챗봇 위젯", "주문/배송/반품 자동응대", "상담원 핸드오프", "Zendesk 연동"] },
    { label: "비기능", color: "0F7A6B", items: ["응답 3초 이내", "개인정보 망분리"] },
    { label: "제약", color: "8A5A00", items: ["예산 3억원", "2027-03-01 가동", "벤더 락인 지양"] },
  ];
  cols.forEach((col, i) => {
    const x = 0.6 + i * 4.15;
    s.addShape("roundRect", { x, y: 1.7, w: 3.9, h: 4.6, rectRadius: 0.08, fill: { color: "F5F7FB" }, line: { type: "none" } });
    s.addShape("ellipse", { x: x + 0.3, y: 2.0, w: 0.5, h: 0.5, fill: { color: col.color }, line: { type: "none" } });
    s.addText(col.label, { x: x + 0.3, y: 2.66, w: 3.3, h: 0.45, fontFace: FONT_TITLE, fontSize: 17, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });
    const bodyItems = col.items.map((t, idx) => ({
      text: t,
      options: { bullet: { code: "25AA", color: col.color }, breakLine: idx !== col.items.length - 1, fontFace: FONT_BODY, fontSize: 13, color: TEXT_DARK, paraSpaceAfter: 10 },
    }));
    s.addText(bodyItems, { x: x + 0.3, y: 3.25, w: 3.3, h: 2.9, isTextBox: true, margin: 0 });
  });

  s.addShape("roundRect", { x: 0.6, y: 6.5, w: 12.1, h: 0.7, rectRadius: 0.06, fill: { color: "FFF4E0" }, line: { type: "none" } });
  s.addText("미해결 질문 :  망분리 방식(물리적/논리적)은 요건 분석 단계에서 최우선 확정이 필요합니다.", {
    x: 0.9, y: 6.5, w: 11.6, h: 0.7, valign: "middle", fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: "8A5A00", isTextBox: true, margin: 0,
  });
}

// ---------- Slide 3: 제안 아키텍처 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "02 · Proposed Architecture", NAVY);
  s.addText("제안 아키텍처", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });
  s.addText(
    "관리형 대화형 AI 플랫폼 + 시나리오 엔진 + LLM 어댑터 + Zendesk 연동 구조. 사내 데이터는 VPC 내부에 유지하고 API 게이트웨이로 논리적 망분리를 충족합니다.",
    { x: 0.6, y: 1.55, w: 12, h: 0.6, fontFace: FONT_BODY, fontSize: 13.5, color: TEXT_MUTED, isTextBox: true, margin: 0 }
  );

  const boxes = [
    { t: "웹/모바일 위젯", c: ICE },
    { t: "API 게이트웨이", c: ICE },
    { t: "대화 오케스트레이션\n(시나리오 엔진 · LLM 어댑터)", c: MINT },
    { t: "핸드오프 라우터\n→ Zendesk API", c: ICE },
  ];
  const bx = 0.6, bw = 2.85, gap = 0.35, by = 2.55, bh = 1.5;
  boxes.forEach((b, i) => {
    const x = bx + i * (bw + gap);
    s.addShape("roundRect", { x, y: by, w: bw, h: bh, rectRadius: 0.08, fill: { color: b.c }, line: { type: "none" } });
    s.addText(b.t, { x, y: by, w: bw, h: bh, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: NAVY, isTextBox: true, margin: 8 });
    if (i < boxes.length - 1) {
      s.addText("→", { x: x + bw, y: by, w: gap, h: bh, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 20, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    }
  });

  s.addShape("roundRect", { x: 0.6, y: 4.6, w: 12.1, h: 1.0, rectRadius: 0.08, fill: { color: "F5F7FB" }, line: { type: "none" } });
  s.addText("사내 주문/배송 데이터  —  VPC 내부 유지, API 게이트웨이를 통한 논리적 망분리 (RFP 미해결 질문에 따라 재검토 필요)", {
    x: 0.9, y: 4.6, w: 11.6, h: 1.0, valign: "middle", fontFace: FONT_BODY, fontSize: 13, color: TEXT_DARK, isTextBox: true, margin: 0,
  });

  const reqMap = [
    ["F1~F4", "기능 요구사항", "위젯 · 시나리오 엔진 · 핸드오프 · Zendesk 연동"],
    ["N1", "응답 3초 이내", "캐싱 + 비동기 스트리밍 응답"],
    ["N2 / C3", "망분리 · 벤더 락인 지양", "논리적 망분리 · LLM 어댑터 패턴"],
  ];
  let ry = 5.85;
  reqMap.forEach(([tag, title, desc]) => {
    s.addShape("roundRect", { x: 0.6, y: ry, w: 1.1, h: 0.42, rectRadius: 0.06, fill: { color: NAVY }, line: { type: "none" } });
    s.addText(tag, { x: 0.6, y: ry, w: 1.1, h: 0.42, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 10, bold: true, color: WHITE, isTextBox: true, margin: 0 });
    s.addText([{ text: title + "  ", options: { bold: true, color: TEXT_DARK } }, { text: desc, options: { color: TEXT_MUTED } }], {
      x: 1.9, y: ry, w: 10.8, h: 0.42, valign: "middle", fontFace: FONT_BODY, fontSize: 12, isTextBox: true, margin: 0,
    });
    ry += 0.48;
  });
}

// ---------- Slide 4: 문제 해결 방안 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "03 · How We Solve It", NAVY);
  s.addText("문제 해결 방안", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });

  const rows = [
    ["응답 지연 문제", "API 게이트웨이 캐싱 + 비동기 스트리밍 응답으로 3초 이내 목표 충족"],
    ["벤더 락인 우려", "LLM 어댑터 패턴 — 엔진 교체 시 오케스트레이션 레이어 변경 불필요"],
    ["기존 시스템 연동 부담", "Zendesk 공식 API/Webhook 활용, 커스텀 미들웨어 불필요"],
    ["성수기 트래픽 급증", "오토스케일링 구조로 평시 대비 3배까지 자동 확장"],
  ];
  let y = 1.75;
  rows.forEach(([problem, solution], i) => {
    s.addShape("ellipse", { x: 0.6, y: y + 0.05, w: 0.45, h: 0.45, fill: { color: MINT }, line: { type: "none" } });
    s.addText(String(i + 1), { x: 0.6, y: y + 0.05, w: 0.45, h: 0.45, align: "center", valign: "middle", fontFace: FONT_TITLE, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(problem, { x: 1.25, y, w: 3.5, h: 0.55, fontFace: FONT_BODY, fontSize: 14, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });
    s.addText(solution, { x: 4.9, y, w: 7.8, h: 0.55, fontFace: FONT_BODY, fontSize: 13, color: TEXT_MUTED, isTextBox: true, margin: 0 });
    if (i < rows.length - 1) {
      s.addShape("line", { x: 0.6, y: y + 0.78, w: 12.1, h: 0, line: { color: "E4E8F2", width: 1 } });
    }
    y += 1.15;
  });
}

// ---------- Slide 5: 일정 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "04 · Schedule", NAVY);
  s.addText("일정", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });

  const phases = [
    ["요건 분석", "2026-10", "망분리 방식 확정 (게이트)"],
    ["설계", "2026-11", "상세 설계서, 연동 명세"],
    ["개발", "2026-12 ~ 2027-01", "시나리오 엔진 + 연동"],
    ["통합/부하 테스트", "2027-02", "N1(3초) 검증"],
    ["가동/안정화", "2027-03-01~", "운영 전환, 하이퍼케어"],
  ];
  const px = 0.6, pw = 2.36, py = 2.4;
  phases.forEach((p, i) => {
    const x = px + i * pw;
    s.addShape("ellipse", { x: x + pw / 2 - 0.14, y: py - 0.14, w: 0.28, h: 0.28, fill: { color: i === 0 ? MINT : NAVY }, line: { type: "none" } });
    if (i < phases.length - 1) {
      s.addShape("line", { x: x + pw / 2 + 0.14, y: py, w: pw - 0.28, h: 0, line: { color: NAVY, width: 2 } });
    }
    s.addText(p[0], { x: x - 0.2, y: py + 0.3, w: pw + 0.1, h: 0.4, align: "center", fontFace: FONT_BODY, fontSize: 13, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });
    s.addText(p[1], { x: x - 0.2, y: py + 0.68, w: pw + 0.1, h: 0.35, align: "center", fontFace: FONT_BODY, fontSize: 11, color: MINT === "3DDC97" ? "0F7A6B" : TEXT_MUTED, bold: true, isTextBox: true, margin: 0 });
    s.addShape("roundRect", { x: x - 0.05, y: py + 1.15, w: pw - 0.2, h: 1.5, rectRadius: 0.06, fill: { color: "F5F7FB" }, line: { type: "none" } });
    s.addText(p[2], { x: x - 0.05, y: py + 1.15, w: pw - 0.2, h: 1.5, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 11, color: TEXT_DARK, isTextBox: true, margin: 8 });
  });

  s.addShape("roundRect", { x: 0.6, y: 5.6, w: 12.1, h: 0.9, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("총 소요기간 약 5개월 · 2027-03-01 가동 목표 역산 일정", {
    x: 0.9, y: 5.6, w: 11.6, h: 0.9, valign: "middle", fontFace: FONT_BODY, fontSize: 14, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
}

// ---------- Slide 6: 로드맵 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "05 · Roadmap", NAVY);
  s.addText("로드맵", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });
  s.addText(
    "요건 분석 단계에서 망분리 방식이 게이트로 확정된 후 설계 단계가 착수됩니다. 설계 → 개발 → 통합/부하 테스트를 거쳐 2027-03-01 가동을 목표로 순차 진행합니다.",
    { x: 0.6, y: 1.55, w: 12, h: 0.7, fontFace: FONT_BODY, fontSize: 13.5, color: TEXT_MUTED, isTextBox: true, margin: 0 }
  );

  const nodes = ["요건 분석", "설계", "개발", "통합/부하 테스트", "가동"];
  const nx = 0.6, nw = 2.36, ny = 3.3;
  nodes.forEach((n, i) => {
    const x = nx + i * nw;
    const isGate = i === 0;
    s.addShape("roundRect", { x: x + 0.1, y: ny, w: nw - 0.5, h: 0.9, rectRadius: 0.08, fill: { color: isGate ? "FFF4E0" : ICE }, line: { type: "none" } });
    s.addText(n, { x: x + 0.1, y: ny, w: nw - 0.5, h: 0.9, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 12.5, bold: true, color: NAVY, isTextBox: true, margin: 4 });
    if (i < nodes.length - 1) {
      s.addText("→", { x: x + nw - 0.4, y: ny, w: 0.4, h: 0.9, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 18, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    }
  });
  s.addShape("roundRect", { x: nx + 0.1, y: ny + 1.15, w: nw - 0.5, h: 0.6, rectRadius: 0.06, fill: { color: "8A5A00" }, line: { type: "none" } });
  s.addText("GATE", { x: nx + 0.1, y: ny + 1.15, w: nw - 0.5, h: 0.6, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 11, bold: true, color: WHITE, isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 0.6, y: 5.5, w: 12.1, h: 1.4, rectRadius: 0.08, fill: { color: "F5F7FB" }, line: { type: "none" } });
  s.addText([
    { text: "리스크 : ", options: { bold: true, color: TEXT_DARK } },
    { text: "망분리 방식이 요건 분석 단계 종료 시점까지 미확정 시 설계 착수가 지연됩니다. 첫 성수기 트래픽 검증은 가동 후 실사용 모니터링으로 대체합니다.", options: { color: TEXT_MUTED } },
  ], { x: 0.9, y: 5.5, w: 11.6, h: 1.4, valign: "middle", fontFace: FONT_BODY, fontSize: 13, isTextBox: true, margin: 0, lineSpacing: 20 });
}

// ---------- Slide 7: 투입 인건비 등 비용 ----------
{
  const s = baseSlide(WHITE);
  eyebrow(s, "06 · Cost", NAVY);
  s.addText("투입 인건비 등 비용", { x: 0.6, y: 0.75, w: 8, h: 0.7, fontFace: FONT_TITLE, fontSize: 30, bold: true, color: TEXT_DARK, isTextBox: true, margin: 0 });

  const laborRows = [
    ["구분", "역할", "산정 근거", "금액(원)"],
    ["인건비", "Solutions Architect", "40일 × 800,000원", "32,000,000"],
    ["인건비", "Backend Developer A", "40일 × 500,000원", "20,000,000"],
    ["인건비", "Backend Developer B", "40일 × 500,000원", "20,000,000"],
    ["인건비", "QA Engineer", "15일 × 450,000원", "6,750,000"],
    ["인건비", "Engagement Leader(파트타임)", "30일 × 600,000원", "18,000,000"],
  ];
  s.addTable(
    laborRows.map((r, ri) =>
      r.map((c, ci) => ({
        text: c,
        options: {
          fontFace: FONT_BODY,
          fontSize: 11.5,
          bold: ri === 0,
          color: ri === 0 ? WHITE : TEXT_DARK,
          fill: { color: ri === 0 ? NAVY : ri % 2 === 0 ? "F5F7FB" : WHITE },
          align: ci === 3 ? "right" : "left",
          valign: "middle",
        },
      }))
    ),
    { x: 0.6, y: 1.65, w: 7.9, colW: [1.1, 2.6, 2.4, 1.8], rowH: 0.42, border: { type: "none" } }
  );

  const solRows = [
    ["구분", "항목", "금액(원)"],
    ["솔루션", "LLM API 사용료 (12개월)", "24,000,000"],
    ["솔루션", "클라우드 인프라 (12개월)", "18,000,000"],
    ["솔루션", "Zendesk 연동 구축 (1회성)", "3,000,000"],
  ];
  s.addTable(
    solRows.map((r, ri) =>
      r.map((c, ci) => ({
        text: c,
        options: {
          fontFace: FONT_BODY,
          fontSize: 11.5,
          bold: ri === 0,
          color: ri === 0 ? WHITE : TEXT_DARK,
          fill: { color: ri === 0 ? "0F7A6B" : ri % 2 === 0 ? "F5F7FB" : WHITE },
          align: ci === 2 ? "right" : "left",
          valign: "middle",
        },
      }))
    ),
    { x: 0.6, y: 4.55, w: 7.9, colW: [1.1, 4.9, 1.9], rowH: 0.42, border: { type: "none" } }
  );

  s.addShape("roundRect", { x: 8.85, y: 1.65, w: 3.85, h: 4.35, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("총 합계", { x: 8.85, y: 2.0, w: 3.85, h: 0.5, align: "center", fontFace: FONT_BODY, fontSize: 13, color: ICE, isTextBox: true, margin: 0 });
  s.addText("141,750,000원", { x: 8.85, y: 2.5, w: 3.85, h: 0.9, align: "center", fontFace: FONT_TITLE, fontSize: 26, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  s.addShape("line", { x: 9.25, y: 3.55, w: 3.05, h: 0, line: { color: "3A4B8C", width: 1 } });
  s.addText("인건비 96,750,000\n솔루션 45,000,000", { x: 8.85, y: 3.7, w: 3.85, h: 0.9, align: "center", fontFace: FONT_BODY, fontSize: 12, color: ICE, isTextBox: true, margin: 0, lineSpacing: 20 });
  s.addShape("roundRect", { x: 9.1, y: 4.75, w: 3.35, h: 0.9, rectRadius: 0.08, fill: { color: MINT }, line: { type: "none" } });
  s.addText("예산 대비 53% 여유\n(상한 3억원)", { x: 9.1, y: 4.75, w: 3.35, h: 0.9, valign: "middle", align: "center", fontFace: FONT_BODY, fontSize: 12, bold: true, color: NAVY, isTextBox: true, margin: 0, lineSpacing: 16 });

  s.addText("비용은 scripts/co-consult/proposal-cost-calculator.ts 실행 결과이며 (memory/techbridge-cost-input-2026-09-08.yaml 입력 기준), 수동 계산이 아닙니다.", {
    x: 8.85, y: 5.85, w: 3.85, h: 0.9, fontFace: FONT_BODY, fontSize: 9.5, italic: true, color: TEXT_MUTED, isTextBox: true, margin: 0, lineSpacing: 13,
  });
}

pres.writeFile({ fileName: "techbridge-proposal-2026-09-08_ko.pptx" }).then(() => {
  console.log("written");
});
