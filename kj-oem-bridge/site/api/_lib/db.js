// 저장소: 배포 환경에서는 Vercel Blob(비공개), 로컬 테스트에서는 파일.
// 컬렉션 하나 = JSON 파일 하나. 쓸 때 ETag로 충돌을 막고 다시 시도한다.
import { promises as fs } from "node:fs";
import path from "node:path";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = process.env.SB_LOCAL_DB || path.join(process.cwd(), ".localdb");
const key = c => `db/${c}.json`;

async function readRaw(c) {
  if (!useBlob) {
    try { return { data: JSON.parse(await fs.readFile(path.join(LOCAL, c + ".json"), "utf8")), etag: null }; }
    catch { return { data: [], etag: null }; }
  }
  const { get } = await import("@vercel/blob");
  const r = await get(key(c), { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return { data: [], etag: null };
  const text = await new Response(r.stream).text();
  return { data: JSON.parse(text), etag: r.blob.etag };
}

async function writeRaw(c, data, etag) {
  const body = JSON.stringify(data);
  if (!useBlob) {
    await fs.mkdir(LOCAL, { recursive: true });
    await fs.writeFile(path.join(LOCAL, c + ".json"), body);
    return;
  }
  const { put } = await import("@vercel/blob");
  const opt = { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  if (etag) opt.ifMatch = etag;
  await put(key(c), body, opt);
}

export async function all(c) { return (await readRaw(c)).data; }

// fn(list) 은 list를 직접 고치고 결과값을 돌려준다.
export async function mutate(c, fn) {
  for (let i = 0; i < 5; i++) {
    const { data, etag } = await readRaw(c);
    const out = await fn(data);
    try { await writeRaw(c, data, etag); return out; }
    catch (e) { if (!/Precondition|412/i.test(String(e?.name) + String(e?.message))) throw e; }
  }
  throw new Error("busy");
}

export const newId = (p = "") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
