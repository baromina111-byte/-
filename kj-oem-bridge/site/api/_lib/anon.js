// 제조사 원본 → 공개용(회사명·연락처 제외). scripts/build-directory.py 와 같은 규칙.
export const TAGS = [
  [["향수", "퍼퓸", "EDP"], "perfume", "香水", "향수", "cos"],
  [["디퓨저"], "diffuser", "ディフューザー", "디퓨저", "goods"],
  [["룸스프레이", "룸미스트", "룸·차량용 스프레이", "스프레이"], "roomspray", "ルームスプレー", "룸스프레이", "goods"],
  [["캔들"], "candle", "キャンドル", "캔들", "goods"],
  [["섬유향수", "패브릭"], "fabric", "ファブリックミスト", "섬유향수", "goods"],
  [["필로우미스트"], "pillow", "ピローミスト", "필로우미스트", "goods"],
  [["헤어미스트", "헤어퍼퓸", "헤어케어", "헤어·바디", "헤어"], "hair", "ヘアミスト・ヘアケア", "헤어미스트·헤어케어", "cos"],
  [["바디미스트", "바디 스프레이", "바디워시", "바디케어", "바디"], "body", "ボディミスト・ボディケア", "바디미스트·바디케어", "cos"],
  [["인센스"], "incense", "インセンス", "인센스", "goods"],
  [["사쉐", "석고방향제", "고체 방향제", "방향제"], "sachet", "サシェ・芳香剤", "사쉐·방향제", "goods"],
  [["탈취제"], "deodorant", "消臭剤", "탈취제", "goods"],
  [["양말", "삭스", "스타킹"], "socks", "ソックス", "양말", "wear"],
  [["의류", "티셔츠", "맨투맨", "후드", "니트", "셔츠", "팬츠", "봉제", "어패럴"], "apparel", "アパレル", "의류", "wear"],
];
const REGION = { "서울": "ソウル", "경기": "京畿道", "인천": "仁川", "부산": "釜山", "울산": "蔚山", "충북": "忠清北道", "충남": "忠清南道", "세종": "世宗", "대구": "大邱", "대전": "大田", "광주": "光州", "강원": "江原道", "경북": "慶尙北道", "경남": "慶尙南道", "전북": "全羅北道", "전남": "全羅南道", "제주": "済州" };
const CERTS = ["ISO 22716", "ISO 9001", "ISO 14001", "CGMP"];

export const tagList = () => TAGS.map(t => ({ id: t[1], ja: t[2], ko: t[3], kind: t[4] }));

export function anon(r) {
  const items = r["주력품목"] || "";
  const mq = r["MOQ"] || "";
  const m = mq.startsWith("미확인") ? null : /(\d[\d,]*)\s*(?:개|켤레|장|족)/.exec(mq);
  const regKo = Object.keys(REGION).find(k => (r["소재지"] || "").includes(k));
  const cert = r["인증"] || "", exp = r["수출경험"] || "";
  const certs = CERTS.filter(c => cert.includes(c));
  if (cert.includes("비건")) certs.push("Vegan");
  return {
    id: r.id, tags: TAGS.filter(t => t[0].some(k => items.includes(k))).map(t => t[1]),
    moq: m ? Number(m[1].replace(/,/g, "")) : null,
    region: { ko: regKo || "비공개", ja: REGION[regKo] || "非公開" },
    certs, japan: exp.includes("일본"), export: !!exp && !exp.startsWith("미확인"),
    large: (r["회사명"] || "").startsWith("[대형]"), checked: r["확인일"] || "",
    registered: r["공장등록"] === "확인",
  };
}

// 간단한 CSV 파서/작성기 (따옴표·줄바꿈 지원)
export function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() || [];
  return rows.filter(r => r.some(c => c.trim())).map(r => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}
export function toCsv(list, cols) {
  const esc = v => { const s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [cols.join(","), ...list.map(r => cols.map(c => esc(r[c])).join(","))].join("\r\n");
}
