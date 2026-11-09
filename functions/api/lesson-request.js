// Cloudflare Pages Function: POST /api/lesson-request
// Forwards form submissions to the LYVON Google Apps Script web app.
// Env (Pages → Settings → Variables, type "Secret"): APPS_SCRIPT_URL, APPS_SCRIPT_SECRET
// Optional TURNSTILE_SECRET: when set, every submission must carry a valid Turnstile token (body.cf)
const MAX = 20000;
const FIELD_MAX = 1000;
const ALLOWED = ['name', 'email', 'phone', 'situation', 'country', 'targetField', 'schools', 'whyDoctor', 'englishLevel',
  'concerns', 'message', 'studentInfo', 'guardianConfirm', 'preferredTimes', 'messengerId', 'plannedApplication', 'preparation', 'budget', 'heardFrom', 'replyLang', 'guideLang', 'consent', 'source', 'siteLang'];
const SITE = /^https:\/\/([a-z0-9-]+\.)?(lyvon\.io|lyvon-web\.pages\.dev)(\/|$)/i;
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

// trim and cap length (formula escaping is done by the Apps Script, which also prefixes phone numbers)
const clean = v => {
  if (typeof v === 'boolean') return v;
  return String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, FIELD_MAX);
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
  if (env.TURNSTILE_SECRET) {
    const tok = typeof body.cf === 'string' ? body.cf.slice(0, 2048) : '';
    if (!tok) return json({ ok: false, error: 'captcha' }, 403);
    let v = null;
    try {
      const f = new FormData();
      f.append('secret', env.TURNSTILE_SECRET); f.append('response', tok);
      const ip = request.headers.get('cf-connecting-ip'); if (ip) f.append('remoteip', ip);
      v = await (await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f })).json();
    } catch (e) { console.error('lesson-request: turnstile', String(e)); }
    if (!v || !v.success) return json({ ok: false, error: 'captcha' }, 403);
  }
  const src = body.data && typeof body.data === 'object' ? body.data : {};
  const d = {};
  for (const k of ALLOWED) if (k in src) d[k] = clean(src[k]);
  // extra answers travel inside 'concerns' so they reach the sheet and the team email without new columns
  const extra = [['studentInfo', 'Student'], ['guardianConfirm', 'Guardian confirmed (under 14)'], ['preferredTimes', 'Preferred times'], ['messengerId', 'Messenger ID'], ['message', 'Message']];
  for (const [k, label] of extra) {
    if (d[k] === undefined || d[k] === '' || d[k] === false) { delete d[k]; continue; }
    const v = d[k] === true ? 'yes' : d[k];
    d.concerns = (d.concerns ? d.concerns + '; ' : '') + label + ': ' + v; delete d[k];
  }
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
