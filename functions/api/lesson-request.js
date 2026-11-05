// Cloudflare Pages Function: POST /api/lesson-request
// Forwards form submissions to the LYVON Google Apps Script web app.
// Env (Pages → Settings → Variables, type "Secret"): APPS_SCRIPT_URL, APPS_SCRIPT_SECRET
const MAX = 20000;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export async function onRequestPost({ request, env }) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) return json({ ok: false, error: 'not_configured' }, 500);
  const origin = request.headers.get('origin') || '';
  if (origin && !/^https:\/\/([a-z0-9-]+\.)?(lyvon\.io|lyvon-web\.pages\.dev)$/i.test(origin)) return json({ ok: false, error: 'origin' }, 403);
  const raw = await request.text();
  if (raw.length > MAX) return json({ ok: false, error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (body.company) return json({ ok: true }); // honeypot
  const d = body.data || {};
  if (typeof d !== 'object' || !d.name || !d.email || d.consent !== true) return json({ ok: false, error: 'missing' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email))) return json({ ok: false, error: 'email' }, 400);
  d.type = body.type === 'guide' ? 'guide' : 'lesson';
  const payload = JSON.stringify({ secret: env.APPS_SCRIPT_SECRET, company: '', data: d });
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, redirect: 'follow' });
      const t = await r.text();
      let j; try { j = JSON.parse(t); } catch { j = null; }
      if (j && j.ok) return json({ ok: true });
      if (j && j.error && j.error !== 'unauthorized') return json({ ok: false, error: j.error }, 400);
    } catch (e) { /* retry once */ }
  }
  return json({ ok: false, error: 'upstream' }, 502);
}
export const onRequest = () => json({ ok: false, error: 'method' }, 405);
