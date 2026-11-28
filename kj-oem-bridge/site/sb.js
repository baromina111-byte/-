// SCENT BRIDGE 공용 클라이언트 도구
window.SB = (function () {
  async function api(path, opt = {}) {
    const init = { method: opt.method || (opt.body ? "POST" : "GET"), headers: {}, credentials: "same-origin" };
    if (opt.body) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(opt.body); }
    let res;
    try { res = await fetch("/api/" + path, init); } catch (e) { const er = new Error("network"); er.code = 0; throw er; }
    let data = null;
    try { data = await res.json(); } catch (e) { data = {}; }
    if (!res.ok) { const er = new Error(data.error || "error"); er.code = res.status; throw er; }
    return data;
  }
  let meP = null;
  const me = (fresh) => { if (fresh || !meP) meP = api("auth/me").then(d => d.user).catch(() => null); return meP; };
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else if (k === "text") e.textContent = v; else e.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k instanceof Node ? k : String(k));
    return e;
  };
  const fmt = iso => { if (!iso) return "-"; const d = new Date(iso); return d.toLocaleDateString() + " " + d.toTimeString().slice(0, 5); };
  return { api, me, el, fmt };
})();
