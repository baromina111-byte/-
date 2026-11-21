// 인플루언서 연결 기능: 프로필, 공개 목록(익명), 협업 요청, 인플루언서 응답, 관리자 처리
import { all, mutate, newId } from "./db.js";

export const PLATFORMS = ["instagram", "tiktok", "youtube", "x", "blog", "other"];
export const CATS = ["fragrance", "beauty", "lifestyle", "fashion", "interior", "other"];
const COLLAB_STATUS = ["new", "reviewing", "proposed", "accepted", "done", "lost"];
const now = () => new Date().toISOString();

export function band(n) {
  n = Number(n) || 0;
  if (n >= 100000) return "100k+";
  if (n >= 50000) return "50k-100k";
  if (n >= 10000) return "10k-50k";
  if (n >= 1000) return "1k-10k";
  return "<1k";
}

// 공개용: 계정명·링크·이름은 빼고 플랫폼·규모·분야만
export const anonInfluencer = p => ({
  id: p.id, platform: p.platform, band: band(p.followers), categories: p.categories || [],
  country: p.country || "", verified: !!p.verified, interests: p.interests || [],
});

export function cleanProfile(b, str) {
  const followers = Math.max(0, Math.min(1e9, parseInt(String(b.followers ?? "").replace(/[^\d]/g, ""), 10) || 0));
  return {
    platform: PLATFORMS.includes(b.platform) ? b.platform : "other",
    handle: str(b.handle, 100), url: str(b.url, 300), followers,
    categories: (Array.isArray(b.categories) ? b.categories : []).filter(c => CATS.includes(c)).slice(0, 4),
    country: ["JP", "KR", "ETC"].includes(b.country) ? b.country : "JP",
    interests: (Array.isArray(b.interests) ? b.interests : []).filter(c => ["own_brand", "collab"].includes(c)),
    rate: str(b.rate, 100), bio: str(b.bio, 600),
  };
}

export async function createInfluencer(userId, b, str) {
  return mutate("influencers", list => {
    const n = list.reduce((m, x) => Math.max(m, Number(String(x.id).replace(/\D/g, "")) || 0), 0) + 1;
    const p = { id: `I-${String(n).padStart(2, "0")}`, userId, ...cleanProfile(b, str), status: "pending", verified: false, createdAt: now(), updatedAt: now() };
    list.push(p); return p;
  });
}

const forBrand = c => ({
  id: c.id, createdAt: c.createdAt, status: c.status, picks: c.picks, product: c.product, budget: c.budget, period: c.period, message: c.message,
  messages: (c.messages || []).filter(m => m.to === "brand" || m.from === "brand").map(({ from, text, at }) => ({ from, text, at })),
  responses: (c.responses || []).filter(x => x.shared).map(({ influencerId, decision, fee, note, at }) => ({ influencerId, decision, fee, note, at })),
});
const forInfluencer = (c, iid) => ({
  id: c.id, createdAt: c.createdAt, status: c.status, product: c.product, budget: c.budget, period: c.period, message: c.message,
  messages: (c.messages || []).filter(m => (m.to === "influencer" || m.from === "influencer") && m.influencerId === iid).map(({ from, text, at }) => ({ from, text, at })),
  myResponse: (c.responses || []).find(x => x.influencerId === iid) || null,
});

// 처리했으면 결과를, 이 모듈 경로가 아니면 undefined를 돌려준다.
export async function creatorRoutes({ r, seg, method, user, body, need, fail, str, isEmail }) {
  // ---- 공개 ----
  if (r === "public/influencers" && method === "GET") {
    const list = (await all("influencers")).filter(p => p.status === "approved");
    return { influencers: list.map(anonInfluencer) };
  }

  if (r === "public/collab" && method === "POST") {
    const b = await body();
    const email = str(b.email || user?.email, 200);
    if (!str(b.company || user?.company) || !str(b.name || user?.name) || !isEmail(email)) fail(400, "missing_fields");
    if (!str(b.product)) fail(400, "missing_fields");
    if (str(b.website)) return { ok: true };
    const picks = (Array.isArray(b.picks) ? b.picks : []).map(x => str(x, 10)).filter(x => /^I-\d+$/.test(x)).slice(0, 5);
    const it = await mutate("collabs", list => {
      const it = { id: newId("c_"), userId: user?.id || null, company: str(b.company || user.company, 200), name: str(b.name || user.name, 100), email, picks, assigned: [...picks], product: str(b.product, 300), budget: str(b.budget, 100), period: str(b.period, 100), message: str(b.message, 5000), lang: str(b.lang, 4), status: "new", messages: [], responses: [], sentTo: [], notes: "", createdAt: now(), updatedAt: now() };
      list.push(it); return it;
    });
    return { ok: true, id: it.id };
  }

  // ---- 브랜드: 내 협업 요청 ----
  if (r === "me/collabs" && method === "GET") {
    need(user);
    const list = (await all("collabs")).filter(c => c.userId === user.id || c.email === user.email);
    return { collabs: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(forBrand) };
  }
  if (seg[0] === "me" && seg[1] === "collabs" && seg[3] === "message" && method === "POST") {
    need(user);
    const b = await body(); const text = str(b.text, 3000); if (!text) fail(400, "empty");
    await mutate("collabs", list => {
      const c = list.find(y => y.id === seg[2] && (y.userId === user.id || y.email === user.email)); if (!c) fail(404, "not_found");
      c.messages.push({ id: newId("m_"), from: "brand", to: "admin", text, at: now(), by: user.id }); c.updatedAt = now(); c.unread = true;
    });
    return { ok: true };
  }

  // ---- 인플루언서: 내 프로필 ----
  if (r === "me/influencer") {
    need(user, "influencer");
    if (method === "GET") {
      const p = (await all("influencers")).find(x => x.id === user.influencerId || x.userId === user.id);
      return { profile: p || null };
    }
    if (method === "POST") {
      const b = await body();
      const p = await mutate("influencers", list => {
        const x = list.find(y => y.id === user.influencerId || y.userId === user.id); if (!x) fail(404, "not_found");
        const next = cleanProfile({ ...x, ...b }, str);
        if (next.followers !== x.followers || next.handle !== x.handle || next.platform !== x.platform) x.verified = false;
        Object.assign(x, next, { updatedAt: now() }); return x;
      });
      return { profile: p };
    }
  }

  // ---- 인플루언서: 받은 협업 제안 ----
  if (r === "influencer/collabs" && method === "GET") {
    need(user, "influencer");
    const iid = user.influencerId;
    if (!iid) return { requests: [] };
    const list = (await all("collabs")).filter(c => (c.sentTo || []).includes(iid));
    return { requests: list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(c => forInfluencer(c, iid)) };
  }
  if (seg[0] === "influencer" && seg[1] === "collabs" && seg[3] && method === "POST") {
    need(user, "influencer");
    const iid = user.influencerId; if (!iid) fail(403, "not_linked");
    const b = await body();
    await mutate("collabs", list => {
      const c = list.find(y => y.id === seg[2] && (y.sentTo || []).includes(iid)); if (!c) fail(404, "not_found");
      if (seg[3] === "respond") {
        const decision = ["accept", "decline", "question"].includes(b.decision) ? b.decision : "question";
        c.responses = (c.responses || []).filter(x => x.influencerId !== iid);
        c.responses.push({ influencerId: iid, decision, fee: str(b.fee, 100), note: str(b.note, 3000), at: now(), shared: false });
      } else if (seg[3] === "message") {
        const text = str(b.text, 3000); if (!text) fail(400, "empty");
        c.messages.push({ id: newId("m_"), from: "influencer", to: "admin", influencerId: iid, text, at: now(), by: user.id });
      } else fail(404, "not_found");
      c.updatedAt = now(); c.unread = true;
    });
    return { ok: true };
  }

  // ---- 관리자: 협업 요청 메시지·처리 ----
  if (seg[0] === "admin" && seg[1] === "collabs" && seg[3] === "message" && method === "POST") {
    need(user, "admin");
    const b = await body(); const text = str(b.text, 3000); if (!text) fail(400, "empty");
    const to = ["brand", "influencer", "internal"].includes(b.to) ? b.to : "internal";
    await mutate("collabs", list => {
      const c = list.find(y => y.id === seg[2]); if (!c) fail(404, "not_found");
      const m = { id: newId("m_"), from: "admin", to, text, at: now(), by: user.id };
      if (to === "influencer") { if (!b.influencerId) fail(400, "influencer_required"); m.influencerId = str(b.influencerId, 10); c.sentTo = [...new Set([...(c.sentTo || []), m.influencerId])]; c.assigned = [...new Set([...(c.assigned || []), m.influencerId])]; }
      c.messages.push(m); c.updatedAt = now();
    });
    return { ok: true };
  }
  if (seg[0] === "admin" && seg[1] === "collabs" && seg[2] && method === "PATCH") {
    need(user, "admin");
    const b = await body();
    const item = await mutate("collabs", list => {
      const c = list.find(y => y.id === seg[2]); if (!c) fail(404, "not_found");
      if (b.status && COLLAB_STATUS.includes(b.status)) c.status = b.status;
      if (Array.isArray(b.assigned)) c.assigned = b.assigned.map(v => str(v, 10)).slice(0, 20);
      if (b.notes != null) c.notes = str(b.notes, 10000);
      if (b.read) c.unread = false;
      if (b.shareResponse) { const x = (c.responses || []).find(y => y.influencerId === b.shareResponse); if (x) x.shared = b.shared !== false; }
      if (b.response) { const x = { influencerId: str(b.response.influencerId, 10), decision: ["accept", "decline", "question"].includes(b.response.decision) ? b.response.decision : "accept", fee: str(b.response.fee, 100), note: str(b.response.note, 3000), at: now(), shared: !!b.response.shared, byAdmin: true }; c.responses = (c.responses || []).filter(y => y.influencerId !== x.influencerId); c.responses.push(x); }
      c.updatedAt = now(); return c;
    });
    return { item };
  }
  if (seg[0] === "admin" && seg[1] === "influencers" && seg[2] && method === "PATCH") {
    need(user, "admin");
    const b = await body();
    const item = await mutate("influencers", list => {
      const x = list.find(y => y.id === seg[2]); if (!x) fail(404, "not_found");
      Object.assign(x, cleanProfile({ ...x, ...b }, str));
      if (b.status && ["pending", "approved", "hidden"].includes(b.status)) x.status = b.status;
      if (b.verified !== undefined) x.verified = !!b.verified;
      if (b.adminNote != null) x.adminNote = str(b.adminNote, 3000);
      x.updatedAt = now(); return x;
    });
    return { item };
  }
  if (seg[0] === "admin" && seg[1] === "influencers" && !seg[2] && method === "POST") {
    need(user, "admin");
    const b = await body();
    const p = await createInfluencer(null, b, str);
    if (b.status === "approved" || b.verified) await mutate("influencers", list => { const x = list.find(y => y.id === p.id); if (b.status === "approved") x.status = "approved"; if (b.verified) x.verified = true; });
    return { item: p };
  }
  return undefined;
}
