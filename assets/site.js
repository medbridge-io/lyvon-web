(function () {
  'use strict';
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: { req: 'Please fill in the required fields.', send: 'Sending…', err: 'Something went wrong. Please try again or email hello@lyvon.io.', guideOk: 'Thank you. The guide is on its way to your inbox.' },
    ko: { req: '필수 항목을 입력해 주세요.', send: '전송 중…', err: '전송에 실패했습니다. 다시 시도하시거나 hello@lyvon.io로 메일 주세요.', guideOk: '감사합니다. 가이드를 메일로 보내 드렸습니다.' },
    ja: { req: '必須項目を入力してください。', send: '送信中…', err: '送信できませんでした。もう一度お試しいただくか、hello@lyvon.io までご連絡ください。', guideOk: 'ありがとうございます。ガイドをメールでお送りしました。' },
    zh: { req: '請填寫必填欄位。', send: '傳送中…', err: '傳送失敗，請再試一次或來信 hello@lyvon.io。', guideOk: '謝謝。指南已寄到您的信箱。' }
  };
  var t = T[lang] || T.en;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ---------- language menu ----------
  $$('[data-act="lang"]').forEach(function (btn) {
    var menu = btn.parentNode.querySelector('.lv-langmenu');
    if (!menu) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!menu.hidden && !menu.contains(e.target)) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
  });

  // ---------- mobile menu ----------
  var menu = $('.lv-menu');
  $$('[data-act="menu"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (!menu) return;
      menu.hidden = !menu.hidden;
      document.body.style.overflow = menu.hidden ? '' : 'hidden';
    });
  });

  // ---------- guide modal ----------
  var guide = $('.lv-guide');
  function toggleGuide(show) {
    if (!guide) return;
    guide.hidden = !show;
    document.body.style.overflow = show ? 'hidden' : '';
    if (show) { var f = $('input[name="name"]', guide); if (f) f.focus(); }
  }
  $$('[data-act="guide"]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); toggleGuide(guide && guide.hidden); });
  });
  if (guide) guide.addEventListener('click', function (e) { if (e.target === guide) toggleGuide(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (guide && !guide.hidden) toggleGuide(false);
    if (menu && !menu.hidden) { menu.hidden = true; document.body.style.overflow = ''; }
  });
  if (location.hash === '#guide') toggleGuide(true);

  // ---------- helpers ----------
  function collect(root, data) {
    $$('input, select, textarea', root).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'checkbox') {
        if (el.name === 'consent') { data.consent = el.checked; return; }
        if (!el.checked) return;
        data[el.name] = data[el.name] ? data[el.name] + '; ' + el.value : el.value;
      } else if (el.type === 'radio') {
        if (el.checked) data[el.name] = el.value;
      } else {
        data[el.name] = (el.value || '').trim();
      }
    });
    return data;
  }
  function valid(root) {
    var ok = true;
    $$('[required]', root).forEach(function (el) {
      var bad = el.type === 'checkbox' ? !el.checked : !(el.value || '').trim() || !el.checkValidity();
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      el.style.outline = bad ? '2px solid #C0392B' : '';
      if (bad) ok = false;
    });
    // radio groups marked required on any member
    var groups = {};
    $$('input[type="radio"]', root).forEach(function (r) { if (r.required) groups[r.name] = 1; });
    Object.keys(groups).forEach(function (n) { if (!$('input[name="' + n + '"]:checked', root)) ok = false; });
    return ok;
  }
  function post(payload) {
    return fetch('/api/lesson-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) throw new Error(j.error || r.status); return j; }); });
  }

  // ---------- guide form ----------
  var gform = $('.lv-guideform');
  if (gform) {
    var gmsg = $('.lv-guidemsg', gform);
    var gl = $('select[name="replyLang"]', gform);
    if (gl) gl.value = { en: 'EN', ko: 'KO', ja: 'JA', zh: 'ZH' }[lang] || 'EN';
    gform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(gform)) { gmsg.textContent = t.req; return; }
      var d = collect(gform, { type: 'guide', source: location.pathname, siteLang: lang });
      d.guideLang = d.replyLang;
      var btn = $('button[type="submit"]', gform); btn.disabled = true; gmsg.textContent = t.send;
      post({ type: 'guide', company: d.company || '', data: d }).then(function () {
        gmsg.textContent = t.guideOk; gform.reset(); btn.disabled = false;
      }).catch(function () { gmsg.textContent = t.err; btn.disabled = false; });
    });
  }

  // ---------- 3-step lesson form ----------
  var book = $('#book');
  if (book && $('[data-step="1"]', book)) {
    var steps = $$('[data-step]', book);
    var msg = $('.lv-formmsg', book);
    function show(n) {
      steps.forEach(function (s) { s.hidden = s.getAttribute('data-step') !== String(n); });
      if (msg) msg.textContent = '';
      var top = book.getBoundingClientRect().top + window.scrollY - 80;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    var params = new URLSearchParams(location.search);
    var program = params.get('program') || '';
    steps.forEach(function (s) {
      var n = Number(s.getAttribute('data-step'));
      if (s.tagName === 'FORM') {
        s.setAttribute('novalidate', '');
        s.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!valid(s)) { var m = $('.lv-formmsg', s) || msg; if (m) m.textContent = t.req; return; }
          if (n < 3) { show(n + 1); return; }
          var d = { type: 'lesson', source: 'web · ' + location.pathname + (program ? ' · ' + program : ''), siteLang: lang };
          steps.forEach(function (f) { if (f.tagName === 'FORM') collect(f, d); });
          var btn = $('button[type="submit"]', s); btn.disabled = true;
          var m2 = $('.lv-formmsg', s) || msg; if (m2) m2.textContent = t.send;
          post({ type: 'lesson', company: d.company || '', data: d }).then(function () {
            steps.forEach(function (f) { if (f.tagName === 'FORM') f.reset(); });
            btn.disabled = false; show(4);
          }).catch(function () { if (m2) m2.textContent = t.err; btn.disabled = false; });
        });
      }
      $$('[data-to]', s).forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); show(b.getAttribute('data-to')); });
      });
    });
    // mark radio groups required where the step asks for them
    ['whyDoctor', 'englishLevel'].forEach(function (n) { var r = $('input[name="' + n + '"]', book); if (r) r.required = true; });
    show(1);
  }
})();
