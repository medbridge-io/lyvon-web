// GET / — send first-time visitors to their phone/browser language.
// Order: saved choice (cookie lv_lang, set by the language menu) → Accept-Language → English.
// Crawlers always get the English root, so search engines index every language via hreflang.
const MAP = { ko: '/ko/', ja: '/ja/', zh: '/zh-Hant/' };
const BOT = /bot|crawl|spider|slurp|yeti|daumoa|facebookexternalhit|kakaotalk-scrap|line-poker|preview|whatsapp|telegram|discord|embed/i;

function pick(header) {
  const langs = (header || '')
    .split(',')
    .map(p => { const [tag, q] = p.trim().split(/;\s*q=/); return { tag: tag.toLowerCase(), q: q ? parseFloat(q) : 1 }; })
    .filter(x => x.tag)
    .sort((a, b) => b.q - a.q);
  for (const { tag } of langs) {
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}

export async function onRequestGet({ request, next }) {
  const ua = request.headers.get('user-agent') || '';
  if (BOT.test(ua)) return next();
  const url = new URL(request.url);
  if (url.searchParams.has('lang')) return next();             // explicit ?lang=en etc. stays put
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)lv_lang=([a-z-]+)/i);
  const lang = m ? m[1].toLowerCase().slice(0, 2) : pick(request.headers.get('accept-language'));
  const dest = MAP[lang];
  if (!dest) return next();
  const res = Response.redirect(new URL(dest + url.search, url.origin).toString(), 302);
  return new Response(null, { status: 302, headers: { Location: res.headers.get('Location'), 'Cache-Control': 'private, no-store', Vary: 'Accept-Language, Cookie' } });
}
