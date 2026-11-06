// Cloudflare Pages Function: POST /api/lesson-request
// Forwards form submissions to the LYVON Google Apps Script web app.
// Env (Pages → Settings → Variables, type "Secret"): APPS_SCRIPT_URL, APPS_SCRIPT_SECRET
const MAX = 20000;
const FIELD_MAX = 1000;
const ALLOWED = ['name', 'email', 'phone', 'situation', 'country', 'targetField', 'schools', 'whyDoctor', 'englishLevel',
  'concerns', 'plannedApplication', 'preparation', 'budget', 'heardFrom', 'replyLang', 'guideLang', 'consent', 'source', 'siteLang'];
const SITE = /^https:\/\/([a-z0-9-]+\.)?(lyvon\.io|lyvon-web\.pages\.dev)(\/|$)/i;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// keep spreadsheet cells as plain text (no formulas), trim and cap length
const clean = v => {
  if (typeof v === 'boolean') return v;
  let s = String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, FIELD_MAX);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
};

export async function onRequestPost({ request, env }) {
  if (!env.APPS_SCRIPT_URL || !env.APPS_SCRIPT_SECRET) return json({ ok: false, error: 'not_configured' }, 500);
  // same-site requests only (browsers always send Origin on POST from a page)
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  if (!SITE.test(origin)) return json({ ok: false, error: 'origin' }, 403);
  const raw = await request.text();
  if (raw.length > MAX) return json({ ok: false, error: 'too_large' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'bad_json' }, 400);
  if (body.company) return json({ ok: true }); // honeypot
  const src = body.data && typeof body.data === 'object' ? body.data : {};
  const d = {};
  for (const k of ALLOWED) if (k in src) d[k] = clean(src[k]);
  if (!d.name || !d.email || d.consent !== true) return json({ ok: false, error: 'missing' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email))) return json({ ok: false, error: 'email' }, 400);
  d.type = body.type === 'guide' ? 'guide' : 'lesson';
  const payload = JSON.stringify({ secret: env.APPS_SCRIPT_SECRET, company: '', data: d });
  for (let i = 0; i < 2; i++) {
    let r;
    try {
      r = await fetch(env.APPS_SCRIPT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, redirect: 'follow' });
    } catch (e) {
      console.error('lesson-request: network error', i, String(e)); // retry once on network failure only
      continue;
    }
    const t = await r.text();
    let j; try { j = JSON.parse(t); } catch { j = null; }
    if (j && j.ok) return json({ ok: true });
    console.error('lesson-request: upstream', r.status, j ? j.error : t.slice(0, 200));
    if (j && j.error && j.error !== 'unauthorized') return json({ ok: false, error: j.error }, 400);
    return json({ ok: false, error: 'upstream' }, 502);
  }
  return json({ ok: false, error: 'upstream' }, 502);
}
export const onRequest = () => json({ ok: false, error: 'method' }, 405);
