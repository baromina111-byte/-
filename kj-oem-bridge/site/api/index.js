// SCENT BRIDGE API (하나의 함수가 /api/* 전체를 처리한다)
import { all, mutate, newId } from "./_lib/db.js";
import { hashPassword, checkPassword, makeToken, cookie, currentUser, publicUser, ensureBootstrapAdmin } from "./_lib/auth.js";
import { anon, tagList, parseCsv, toCsv } from "./_lib/anon.js";

const COLS = ["users", "requests", "inquiries", "makers", "brands"];
const REQ_STATUS = ["new", "reviewing", "matched", "quoted", "sample", "won", "lost"];
const MAKER_CSV = ["회사명", "영문명", "홈페이지", "소재지", "주력품목", "MOQ", "수출경험", "인증", "문의창구", "근거URL", "확인일", "비고", "공장등록", "등록생산품", "등록주소"];
const BRAND_CSV = ["브랜드명", "운영법인", "사이트", "주력품목", "대표제품", "가격대(엔)", "유형", "문의창구", "근거URL", "상태", "확인일", "비고"];
const now = () => new Date().toISOString();
const str = (v, n = 2000) => String(v ?? "").trim().slice(0, n);
const isEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new HttpError(code, msg); };

async function body(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  const chunks = []; for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}

// 같은 IP에서 짧은 시간 로그인 실패가 쌓이면 잠시 막는다 (함수 인스턴스 메모리 기준).
const fails = new Map();
function throttle(ip) {
  const f = fails.get(ip); if (f && f.n >= 8 && Date.now() - f.t < 10 * 60e3) fail(429, "too_many_attempts");
}
function noteFail(ip) { const f = fails.get(ip) || { n: 0, t: Date.now() }; f.n++; f.t = Date.now(); fails.set(ip, f); }

const need = (u, ...roles) => { if (!u) fail(401, "login_required"); if (roles.length && !roles.includes(u.role)) fail(403, "forbidden"); return u; };

// 브랜드에게 보여줄 견적 요청 (제조사 실명·내부 메모 제외)
function forBrand(r) {
  return {
    id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, status: r.status, picks: r.picks, item: r.item, qty: r.qty, message: r.message,
    company: r.company, name: r.name, email: r.email,
    messages: (r.messages || []).filter(m => m.to === "brand" || m.from === "brand").map(({ from, text, at }) => ({ from, text, at })),
    quotes: (r.quotes || []).filter(q => q.shared).map(({ makerId, price, moq, lead, note, at }) => ({ makerId, price, moq, lead, note, at })),
  };
}
// 제조사에게 보여줄 견적 요청 (브랜드 연락처 제외)
function forMaker(r, makerId) {
  return {
    id: r.id, createdAt: r.createdAt, status: r.status, item: r.item, qty: r.qty, message: r.message, country: r.country || "JP",
    messages: (r.messages || []).filter(m => (m.to === "maker" || m.from === "maker") && m.makerId === makerId).map(({ from, text, at }) => ({ from, text, at })),
    myQuote: (r.quotes || []).find(q => q.makerId === makerId) || null,
  };
}

async function route(req, res, r, method) {
  const user = await currentUser(req);
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0] || "local";
  const seg = r.split("/").filter(Boolean);

  // ---------- 인증 ----------
  if (r === "auth/me" && method === "GET") return { user: publicUser(user) };

  if (r === "auth/signup" && method === "POST") {
    const b = await body(req);
    const email = str(b.email, 200).toLowerCase(), pw = String(b.password || "");
    const role = b.role === "maker" ? "maker" : "brand";
    if (!isEmail(email)) fail(400, "invalid_email");
    if (pw.length < 8) fail(400, "weak_password");
    if (!str(b.name) || !str(b.company)) fail(400, "missing_fields");
    const u = await mutate("users", list => {
      if (list.some(x => x.email === email)) fail(409, "email_taken");
      const u = { id: newId("u_"), email, pass: hashPassword(pw), name: str(b.name, 100), company: str(b.company, 200), role, country: str(b.country, 40), lang: b.lang === "ko" ? "ko" : "ja", createdAt: now() };
      list.push(u); return u;
    });
    cookie(res, makeToken(u.id), 14 * 86400);
    return { user: publicUser(u) };
  }

  if (r === "auth/login" && method === "POST") {
    throttle(ip);
    await ensureBootstrapAdmin();
    const b = await body(req);
    const email = str(b.email, 200).toLowerCase();
    const u = (await all("users")).find(x => x.email === email);
    if (!u || u.disabled || !checkPassword(String(b.password || ""), u.pass)) { noteFail(ip); fail(401, "bad_credentials"); }
    if (b.admin && u.role !== "admin") fail(403, "not_admin");
    fails.delete(ip);
    await mutate("users", list => { const x = list.find(y => y.id === u.id); if (x) x.lastLogin = now(); });
    cookie(res, makeToken(u.id, u.role === "admin" ? 1 : 14), u.role === "admin" ? 86400 : 14 * 86400);
    return { user: publicUser(u) };
  }

  if (r === "auth/logout" && method === "POST") { cookie(res, "", 0); return { ok: true }; }

  if (r === "auth/password" && method === "POST") {
    need(user);
    const b = await body(req);
    if (!checkPassword(String(b.current || ""), user.pass)) fail(400, "bad_current");
    if (String(b.next || "").length < 8) fail(400, "weak_password");
    await mutate("users", list => { const x = list.find(y => y.id === user.id); x.pass = hashPassword(String(b.next)); x.updatedAt = now(); });
    return { ok: true };
  }

  if (r === "auth/profile" && method === "POST") {
    need(user);
    const b = await body(req);
    const u = await mutate("users", list => {
      const x = list.find(y => y.id === user.id);
      for (const k of ["name", "company", "country"]) if (b[k] != null) x[k] = str(b[k], 200);
      if (b.lang) x.lang = b.lang === "ko" ? "ko" : "ja";
      return x;
    });
    return { user: publicUser(u) };
  }

  // ---------- 공개 ----------
  if (r === "public/makers" && method === "GET") {
    const makers = (await all("makers")).filter(m => !m.hidden);
    return { tags: tagList(), makers: makers.map(anon) };
  }

  if (r === "public/inquiry" && method === "POST") {
    const b = await body(req);
    const email = str(b.email, 200);
    if (!str(b.company) || !str(b.name) || !isEmail(email)) fail(400, "missing_fields");
    if (str(b.website)) return { ok: true }; // 스팸 봇 함정 필드
    const it = await mutate("inquiries", list => {
      const it = { id: newId("q_"), type: b.type === "maker" ? "maker" : "brand", company: str(b.company, 200), name: str(b.name, 100), email, item: str(b.item, 100), qty: str(b.qty, 40), message: str(b.message, 5000), lang: str(b.lang, 4), userId: user?.id || null, status: "new", createdAt: now() };
      list.push(it); return it;
    });
    return { ok: true, id: it.id };
  }

  if (r === "public/request" && method === "POST") {
    const b = await body(req);
    const email = str(b.email || user?.email, 200);
    if (!str(b.company || user?.company) || !str(b.name || user?.name) || !isEmail(email)) fail(400, "missing_fields");
    if (str(b.website)) return { ok: true };
    const picks = (Array.isArray(b.picks) ? b.picks : []).map(x => str(x, 10)).filter(x => /^M-\d+$/.test(x)).slice(0, 3);
    const it = await mutate("requests", list => {
      const it = { id: newId("r_"), userId: user?.id || null, company: str(b.company || user.company, 200), name: str(b.name || user.name, 100), email, picks, item: str(b.item, 200), qty: str(b.qty, 40), message: str(b.message, 5000), lang: str(b.lang, 4), country: user?.country || "", status: "new", assigned: [...picks], messages: [], quotes: [], notes: "", createdAt: now(), updatedAt: now() };
      list.push(it); return it;
    });
    return { ok: true, id: it.id };
  }

  // ---------- 브랜드 마이페이지 ----------
  if (r === "me/requests" && method === "GET") {
    need(user);
    const list = (await all("requests")).filter(x => x.userId === user.id || x.email === user.email);
    return { requests: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(forBrand) };
  }
  if (seg[0] === "me" && seg[1] === "requests" && seg[3] === "message" && method === "POST") {
    need(user);
    const b = await body(req); const text = str(b.text, 3000); if (!text) fail(400, "empty");
    await mutate("requests", list => {
      const x = list.find(y => y.id === seg[2] && (y.userId === user.id || y.email === user.email)); if (!x) fail(404, "not_found");
      x.messages.push({ id: newId("m_"), from: "brand", to: "admin", text, at: now(), by: user.id }); x.updatedAt = now(); x.unread = true;
    });
    return { ok: true };
  }

  // ---------- 제조사 포털 ----------
  if (r === "maker/requests" && method === "GET") {
    need(user, "maker");
    if (!user.makerId) return { linked: false, requests: [] };
    const list = (await all("requests")).filter(x => (x.assigned || []).includes(user.makerId) && x.sentToMakers?.includes(user.makerId));
    return { linked: true, makerId: user.makerId, requests: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(x => forMaker(x, user.makerId)) };
  }
  if (seg[0] === "maker" && seg[1] === "requests" && seg[3] && method === "POST") {
    need(user, "maker"); if (!user.makerId) fail(403, "not_linked");
    const b = await body(req);
    await mutate("requests", list => {
      const x = list.find(y => y.id === seg[2] && y.sentToMakers?.includes(user.makerId)); if (!x) fail(404, "not_found");
      if (seg[3] === "quote") {
        const q = { makerId: user.makerId, price: str(b.price, 100), moq: str(b.moq, 100), lead: str(b.lead, 100), note: str(b.note, 3000), at: now(), shared: false };
        x.quotes = (x.quotes || []).filter(y => y.makerId !== user.makerId); x.quotes.push(q);
      } else if (seg[3] === "message") {
        const text = str(b.text, 3000); if (!text) fail(400, "empty");
        x.messages.push({ id: newId("m_"), from: "maker", to: "admin", makerId: user.makerId, text, at: now(), by: user.id });
      } else fail(404, "not_found");
      x.updatedAt = now(); x.unread = true;
    });
    return { ok: true };
  }

  // ---------- 관리자 ----------
  if (seg[0] === "admin") {
    need(user, "admin");
    const col = seg[1];

    if (col === "summary" && method === "GET") {
      const [users, requests, inquiries, makers, brands] = await Promise.all(COLS.map(all));
      const count = (l, k) => l.reduce((a, x) => (a[x[k]] = (a[x[k]] || 0) + 1, a), {});
      return {
        users: { total: users.length, byRole: count(users, "role") },
        requests: { total: requests.length, byStatus: count(requests, "status"), unread: requests.filter(x => x.unread).length },
        inquiries: { total: inquiries.length, open: inquiries.filter(x => x.status !== "done").length },
        makers: { total: makers.length, registered: makers.filter(m => m["공장등록"] === "확인").length, withMoq: makers.filter(m => /\d/.test(m.MOQ || "")).length },
        brands: { total: brands.length, byStatus: count(brands, "상태") },
        recent: [...requests.map(x => ({ kind: "request", id: x.id, title: x.company, at: x.updatedAt })), ...inquiries.map(x => ({ kind: "inquiry", id: x.id, title: x.company, at: x.createdAt }))].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10),
      };
    }

    if (col === "import" && method === "POST") {
      const b = await body(req);
      const kind = b.kind === "brands" ? "brands" : "makers";
      const rows = parseCsv(String(b.csv || ""));
      if (!rows.length) fail(400, "empty_csv");
      const mode = b.mode === "append" ? "append" : "replace";
      const n = await mutate(kind, list => {
        if (mode === "replace") list.length = 0;
        let i = list.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, "")) || 0), 0);
        for (const row of rows) { i++; list.push({ ...row, id: kind === "makers" ? `M-${String(i).padStart(2, "0")}` : `B-${String(i).padStart(2, "0")}`, updatedAt: now() }); }
        return list.length;
      });
      return { ok: true, total: n };
    }

    if (col === "export" && method === "GET") {
      const kind = new URL(req.url, "http://x").searchParams.get("kind") === "brands" ? "brands" : "makers";
      const csv = toCsv(await all(kind), ["id", ...(kind === "makers" ? MAKER_CSV : BRAND_CSV)]);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${kind}.csv"`);
      res.status(200).send(csv); return undefined;
    }

    if (col === "requests" && seg[3] === "message" && method === "POST") {
      const b = await body(req); const text = str(b.text, 3000); if (!text) fail(400, "empty");
      const to = ["brand", "maker", "internal"].includes(b.to) ? b.to : "internal";
      await mutate("requests", list => {
        const x = list.find(y => y.id === seg[2]); if (!x) fail(404, "not_found");
        const m = { id: newId("m_"), from: "admin", to, text, at: now(), by: user.id };
        if (to === "maker") { if (!b.makerId) fail(400, "maker_required"); m.makerId = str(b.makerId, 10); x.sentToMakers = [...new Set([...(x.sentToMakers || []), m.makerId])]; x.assigned = [...new Set([...(x.assigned || []), m.makerId])]; }
        x.messages.push(m); x.updatedAt = now();
      });
      return { ok: true };
    }

    if (!COLS.includes(col)) fail(404, "not_found");
    const id = seg[2];

    if (method === "GET") {
      let list = await all(col);
      if (col === "users") list = list.map(u => ({ ...publicUser(u), disabled: !!u.disabled, lastLogin: u.lastLogin || null }));
      if (id) { const x = list.find(y => y.id === id); if (!x) fail(404, "not_found"); return { item: x }; }
      return { items: list };
    }

    if (method === "POST" && !id) {
      const b = await body(req);
      if (col === "users") {
        const email = str(b.email, 200).toLowerCase();
        if (!isEmail(email) || String(b.password || "").length < 8) fail(400, "invalid");
        const u = await mutate("users", list => {
          if (list.some(x => x.email === email)) fail(409, "email_taken");
          const u = { id: newId("u_"), email, pass: hashPassword(String(b.password)), name: str(b.name, 100), company: str(b.company, 200), role: ["brand", "maker", "admin"].includes(b.role) ? b.role : "brand", makerId: str(b.makerId, 10) || null, createdAt: now() };
          list.push(u); return u;
        });
        return { item: publicUser(u) };
      }
      const item = await mutate(col, list => {
        let it = { ...b, createdAt: now(), updatedAt: now() };
        if (col === "makers") { const n = list.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, "")) || 0), 0) + 1; it.id = `M-${String(n).padStart(2, "0")}`; }
        else if (col === "brands") { const n = list.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, "")) || 0), 0) + 1; it.id = `B-${String(n).padStart(2, "0")}`; }
        else it = { messages: [], quotes: [], assigned: [], status: "new", ...it, id: newId(col[0] + "_") };
        list.push(it); return it;
      });
      return { item };
    }

    if (method === "PATCH" && id) {
      const b = await body(req);
      const item = await mutate(col, list => {
        const x = list.find(y => y.id === id); if (!x) fail(404, "not_found");
        if (col === "users") {
          for (const k of ["name", "company", "country"]) if (b[k] != null) x[k] = str(b[k], 200);
          if (b.role && ["brand", "maker", "admin"].includes(b.role)) { if (x.id === user.id && b.role !== "admin") fail(400, "cannot_demote_self"); x.role = b.role; }
          if (b.makerId !== undefined) x.makerId = str(b.makerId, 10) || null;
          if (b.disabled !== undefined) { if (x.id === user.id) fail(400, "cannot_disable_self"); x.disabled = !!b.disabled; }
          if (b.password) { if (String(b.password).length < 8) fail(400, "weak_password"); x.pass = hashPassword(String(b.password)); }
          x.updatedAt = now(); return publicUser(x);
        }
        if (col === "requests") {
          if (b.status && REQ_STATUS.includes(b.status)) x.status = b.status;
          if (Array.isArray(b.assigned)) x.assigned = b.assigned.map(v => str(v, 10)).slice(0, 10);
          if (b.notes != null) x.notes = str(b.notes, 10000);
          if (b.read) x.unread = false;
          if (b.shareQuote) { const q = (x.quotes || []).find(y => y.makerId === b.shareQuote); if (q) q.shared = b.shared !== false; }
          if (b.quote) { const q = { makerId: str(b.quote.makerId, 10), price: str(b.quote.price, 100), moq: str(b.quote.moq, 100), lead: str(b.quote.lead, 100), note: str(b.quote.note, 3000), at: now(), shared: !!b.quote.shared, byAdmin: true }; x.quotes = (x.quotes || []).filter(y => y.makerId !== q.makerId); x.quotes.push(q); }
          x.updatedAt = now(); return x;
        }
        const { id: _i, createdAt: _c, pass: _p, ...rest } = b;
        Object.assign(x, rest, { updatedAt: now() }); return x;
      });
      return { item };
    }

    if (method === "DELETE" && id) {
      if (col === "users" && id === user.id) fail(400, "cannot_delete_self");
      await mutate(col, list => { const i = list.findIndex(y => y.id === id); if (i < 0) fail(404, "not_found"); list.splice(i, 1); });
      return { ok: true };
    }
  }

  fail(404, "not_found");
}

export default async function handler(req, res) {
  const url = new URL(req.url, "http://x");
  let r = url.searchParams.get("r") || url.pathname.replace(/^\/api\/?/, "");
  r = r.replace(/^index\/?/, "").replace(/\/+$/, "");
  const method = req.method;
  // 다른 사이트에서 보낸 쓰기 요청 차단 (CSRF)
  if (method !== "GET") {
    const origin = req.headers.origin;
    if (origin && new URL(origin).host !== req.headers.host) { res.status(403).json({ error: "bad_origin" }); return; }
  }
  try {
    const out = await route(req, res, r, method);
    if (out !== undefined) res.status(200).json(out);
  } catch (e) {
    const code = e instanceof HttpError ? e.code : 500;
    if (code === 500) console.error(e);
    res.status(code).json({ error: e instanceof HttpError ? e.message : "server_error" });
  }
}
