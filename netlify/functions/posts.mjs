import { getStore } from "@netlify/blobs";

// Same password hash that is in the page. Changing the password in the page updates it here too.
const DEFAULT_PW = "555d2bc11a9bc41f6c0bafbd1d24db5c68f26893ceef0f929f5f976c7bf6efb2";
const json = (o, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const okPost = (p) => p && typeof p.t === "string" && typeof p.a === "string" && typeof p.b === "string" &&
  Array.isArray(p.g) && typeof p.d === "number";

export default async (req) => {
  const store = getStore("mun-press");
  const state = await store.get("state", { type: "json" });
  if (req.method === "GET") return json(state || {});
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const raw = await req.text();
  if (raw.length > 900000) return json({ error: "too large" }, 413);
  let b;
  try { b = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400); }

  const current = (state && state.pw) || DEFAULT_PW;
  if (typeof b.auth !== "string" || b.auth !== current) return json({ error: "unauthorized" }, 401);
  if (!Array.isArray(b.posts) || !b.posts.every(okPost) || typeof b.pw !== "string" || b.pw.length !== 64)
    return json({ error: "invalid" }, 400);

  await store.setJSON("state", { pw: b.pw, posts: b.posts });
  return json({ ok: true });
};
