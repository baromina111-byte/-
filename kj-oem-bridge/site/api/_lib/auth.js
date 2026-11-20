import crypto from "node:crypto";
import { all, mutate, newId } from "./db.js";

if (process.env.VERCEL && !process.env.SESSION_SECRET) throw new Error("SESSION_SECRET is not set");
const SECRET = process.env.SESSION_SECRET || "dev-only-secret";
const DAY = 86400;

export function hashPassword(pw, salt = crypto.randomBytes(16).toString("hex")) {
  const h = crypto.scryptSync(pw, salt, 64).toString("hex");
  return `scrypt:${salt}:${h}`;
}
export function checkPassword(pw, stored) {
  const [, salt, h] = String(stored).split(":");
  if (!salt || !h) return false;
  const a = Buffer.from(crypto.scryptSync(pw, salt, 64).toString("hex"));
  const b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const sign = v => crypto.createHmac("sha256", SECRET).update(v).digest("base64url");
export function makeToken(uid, days = 14) {
  const v = `${uid}.${Math.floor(Date.now() / 1000) + days * DAY}`;
  return `${v}.${sign(v)}`;
}
function readToken(t) {
  const p = String(t || "").split(".");
  if (p.length !== 3) return null;
  const v = `${p[0]}.${p[1]}`, s = sign(v);
  if (s.length !== p[2].length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(p[2]))) return null;
  if (Number(p[1]) < Date.now() / 1000) return null;
  return p[0];
}

export function cookie(res, token, maxAge) {
  res.setHeader("Set-Cookie", `sb_s=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);
}

export async function currentUser(req) {
  const m = /(?:^|;\s*)sb_s=([^;]+)/.exec(req.headers.cookie || "");
  const uid = m && readToken(m[1]);
  if (!uid) return null;
  const u = (await all("users")).find(x => x.id === uid);
  return u && !u.disabled ? u : null;
}

export const publicUser = u => u && ({ id: u.id, email: u.email, name: u.name, company: u.company, role: u.role, makerId: u.makerId || null, country: u.country || "", lang: u.lang || "ja", createdAt: u.createdAt });

// 처음 관리자: 환경변수 BOOTSTRAP_ADMIN = "이메일|scrypt해시" 가 있으면 사용자 목록에 없을 때 만든다.
export async function ensureBootstrapAdmin() {
  const b = process.env.BOOTSTRAP_ADMIN;
  if (!b) return;
  const [email, hash] = b.split("|");
  const users = await all("users");
  if (users.some(u => u.role === "admin")) return;
  await mutate("users", list => {
    if (list.some(u => u.role === "admin")) return;
    list.push({ id: newId("u_"), email: email.toLowerCase(), name: "Admin", company: "SCENT BRIDGE", role: "admin", pass: hash, createdAt: new Date().toISOString() });
  });
}
