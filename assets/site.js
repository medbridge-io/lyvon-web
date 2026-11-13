// ---------- analytics events (GA4) ----------
window.lvTrack = function (name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} };
document.addEventListener('click', function (e) {
  var a = e.target && e.target.closest ? e.target.closest('a[href*="open.kakao.com"], a[href*="line.me"]') : null;
  if (a) window.lvTrack('chat_click', { channel: /kakao/.test(a.href) ? 'kakao' : 'line', page: location.pathname });
}, true);

// Where this visit came from: referring site (host only), campaign tags and first page. Kept in sessionStorage for this tab only.
window.lvVia = (function () {
  var k = 'lv_via', v = '';
  try { v = sessionStorage.getItem(k) || ''; } catch (x) {}
  if (!v) {
    var p = [], h = '';
    try { h = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch (x) {}
    if (/(^|\.)lyvon\.io$|(^|\.)lyvon-web\.pages\.dev$/.test(h)) h = '';
    p.push('via ' + (h || 'direct').slice(0, 60));
    try {
      var q = new URLSearchParams(location.search), u = [];
      ['utm_source', 'utm_medium', 'utm_campaign'].forEach(function (n) { var x = (q.get(n) || '').replace(/[^\w .\-가-힣ぁ-んァ-ヶ一-龥]/g, '').slice(0, 40); if (x) u.push(x); });
      if (u.length) p.push('utm ' + u.join('/'));
    } catch (x) {}
    p.push('first ' + location.pathname.slice(0, 80));
    v = p.join(' · ');
    try { sessionStorage.setItem(k, v); } catch (x) {}
  }
  return v;
})();
// Turnstile (spam protection): loaded on first form interaction, runs only on submit, shows a box only when Cloudflare asks for one
window.lvTS = (function () {
  var KEY = '0x4AAAAAAF5W9l0Y0yVKyiEe', ld = null;
  function load() {
    if (ld) return ld;
    ld = new Promise(function (ok) {
      if (window.turnstile) return ok(window.turnstile);
      var sc = document.createElement('script');
      sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; sc.async = true; sc.defer = true;
      sc.onload = function () { ok(window.turnstile || null); }; sc.onerror = function () { ok(null); };
      document.head.appendChild(sc);
    });
    return ld;
  }
  document.addEventListener('focusin', function (e) { if (e.target && e.target.closest && e.target.closest('form')) load(); }, { once: true });
  // returns a promise of a fresh token ('' if Turnstile could not run; the server then decides)
  return function (form) {
    return load().then(function (ts) {
      if (!ts) return '';
      return new Promise(function (ok) {
        var box = form.querySelector('.lv-ts');
        if (!box) {
          box = document.createElement('div'); box.className = 'lv-ts';
          // just above the submit button, so a check that needs a click is seen where the user is
          var sb = form.querySelector('button[type="submit"]'), anchor = sb ? (sb.parentNode === form ? sb : sb.parentNode) : null;
          if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor); else form.appendChild(box);
        }
        var lng = (document.documentElement.lang || 'en').toLowerCase();
        var hint = box.previousElementSibling && box.previousElementSibling.className === 'lv-ts-hint' ? box.previousElementSibling : null;
        var ask = function (on) {
          if (on && !hint) {
            hint = document.createElement('p'); hint.className = 'lv-ts-hint'; hint.setAttribute('role', 'status');
            hint.textContent = { ko: '사람인지 확인하는 체크박스를 눌러 주세요.', ja: 'ロボットでないことを確認するため、チェックボックスにチェックを入れてください。', zh: '請勾選方塊以完成驗證。' }[lng.slice(0, 2)] || 'Please tick the box to confirm you are human.';
            box.parentNode.insertBefore(hint, box);
          }
          if (hint) hint.hidden = !on;
          if (on) { try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }
        };
        var done = false, fin = function (v) { if (!done) { done = true; ask(false); ok(v || ''); } };
        try {
          if (box.getAttribute('data-wid')) { ts.remove(box.getAttribute('data-wid')); }
          var id = ts.render(box, { sitekey: KEY, execution: 'execute', appearance: 'interaction-only', language: lng.indexOf('zh') === 0 ? 'zh-tw' : lng.slice(0, 2),
            callback: fin, 'error-callback': function () { fin(''); }, 'timeout-callback': function () { fin(''); },
            'before-interactive-callback': function () { ask(true); }, 'after-interactive-callback': function () { ask(false); } });
          box.setAttribute('data-wid', id); ts.execute(box);
        } catch (x) { fin(''); }
        setTimeout(function () { fin(''); }, 60000);
      });
    });
  };
})();
(function () {
  'use strict';
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: { req: 'Please fill in the required fields.', send: 'Sending…', err: 'Something went wrong. Please try again or email hello@lyvon.io.', guideOk: 'Thank you. The guide is on its way to your inbox.' },
    ko: { req: '필수 항목을 입력해 주세요.', send: '전송 중…', err: '전송에 실패했습니다. 다시 시도하시거나 hello@lyvon.io로 메일을 보내 주세요.', guideOk: '감사합니다. 가이드를 메일로 보내 드렸습니다.' },
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
    // keyboard: Escape closes; leaving the menu with Tab closes it
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
    menu.addEventListener('focusout', function (e) {
      if (!menu.contains(e.relatedTarget) && e.relatedTarget !== btn) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
  });


  // remember a manual language choice (read by the / redirect function)
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[hreflang]');
    if (!a) return;
    var code = (a.getAttribute('hreflang') || 'en').toLowerCase().slice(0, 2);
    document.cookie = 'lv_lang=' + code + ';path=/;samesite=lax';  // session only: a new visit follows the phone language again
  });
  // ---------- "another overseas medical school" free-text ----------
  $$('[data-school-other]').forEach(function (cb) {
    var grid = cb.closest('label').parentNode;
    var txt = grid.querySelector('[data-school-other-text]');
    if (!txt) return;
    var base = cb.value;
    function sync() { var v = (txt.value || '').trim(); cb.value = v ? base + ': ' + v : base; }
    cb.addEventListener('change', function () { txt.hidden = !cb.checked; if (cb.checked) txt.focus(); });
    txt.addEventListener('input', sync);
  });
  // ---------- back button (sub pages) ----------
  $$('[data-act="back"]').forEach(function (a) {
    var m = location.pathname.match(/^(\/(?:ko|ja|zh-Hant))?\/insights\/[^/]+\/$/);
    if (m) a.setAttribute('href', (m[1] || '') + '/insights/');
    // program pages fall back to the programs section of that language's home
    var pm = location.pathname.match(/^(\/(?:ko|ja|zh-Hant))?\/programs\/[^/]+\/$/);
    if (pm) a.setAttribute('href', (pm[1] || '') + '/#programs');
    a.addEventListener('click', function (e) {
      var same = false;
      try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (x) {}
      if (same && history.length > 1) { e.preventDefault(); history.back(); return; }
      // fallback link: tell the target page it was reached through the back arrow
      try { sessionStorage.setItem('lv-via-back', new URL(a.href, location.href).pathname); } catch (x) {}
    });
  });

  // ---------- mobile menu ----------
  var menu = $('.lv-menu'), menuOpener = null;
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    $$('.lv-menubtn').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    if (open) { var c = $('button[data-act="menu"]', menu); if (c) c.focus(); }
    else if (menuOpener) { try { menuOpener.focus(); } catch (x) {} }
  }
  $$('[data-act="menu"]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (!menu) return;
      if (menu.hidden) menuOpener = el;
      setMenu(menu.hidden);
    });
  });
  // keep keyboard focus inside open dialogs (menu, guide); Escape closes
  function trap(box, close) {
    if (!box) return;
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href],button,input,select,textarea', box).filter(function (x) { return x.offsetParent !== null && !x.disabled && x.getAttribute('tabindex') !== '-1'; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  trap(menu, function () { setMenu(false); });

  // ---------- guide modal ----------
  var guide = $('.lv-guide');
  var guideOpener = null;
  function toggleGuide(show) {
    if (!guide) return;
    if (show) guideOpener = document.activeElement;
    guide.hidden = !show;
    if (!show && guideOpener) { try { guideOpener.focus(); } catch (x) {} }
    document.body.style.overflow = show ? 'hidden' : '';
    if (show) { var f = $('input[name="name"]', guide); if (f) f.focus(); }
  }
  trap(guide, function () { toggleGuide(false); });
  $$('[data-act="guide"]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); toggleGuide(guide && guide.hidden); });
  });
  if (guide) guide.addEventListener('click', function (e) { if (e.target === guide) toggleGuide(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (guide && !guide.hidden) toggleGuide(false);
    if (menu && !menu.hidden) setMenu(false);
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
  var E = ({
    en: { req: 'This field is required.', email: 'Please enter a valid email address.', check: 'Please tick this box to continue.', pick: 'Please choose one.', any: 'Please choose at least one.', sum: 'Please check the marked fields.' },
    ko: { req: '필수 항목입니다.', email: '이메일 주소 형식을 확인해 주세요.', check: '계속하려면 체크해 주세요.', pick: '하나를 선택해 주세요.', any: '하나 이상 선택해 주세요.', sum: '표시된 항목을 확인해 주세요.' },
    ja: { req: '必須項目です。', email: 'メールアドレスの形式をご確認ください。', check: '続けるにはチェックを入れてください。', pick: '1つお選びください。', any: '1つ以上お選びください。', sum: '印のついた項目をご確認ください。' },
    zh: { req: '此欄位為必填。', email: '請確認電子郵件格式。', check: '請勾選後繼續。', pick: '請選擇一項。', any: '請至少選擇一項。', sum: '請確認標示的欄位。' }
  })[lang] || null;
  if (!E) E = { req: 'This field is required.', email: 'Please enter a valid email address.', check: 'Please tick this box to continue.', pick: 'Please choose one.', any: 'Please choose at least one.', sum: 'Please check the marked fields.' };
  var errSeq = 0;
  // el: the control flagged for assistive tech; box: what gets the visible outline; host/where: where the message is inserted
  function setErr(el, box, host, where, text) {
    var id = box.getAttribute('data-err'), p = id && document.getElementById(id);
    if (!text) {
      box.classList.remove('lv-bad'); el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby');
      if (p) p.parentNode.removeChild(p); box.removeAttribute('data-err'); return false;
    }
    if (!p) { p = document.createElement('span'); p.className = 'lv-err'; p.id = id = 'lv-err-' + (++errSeq); box.setAttribute('data-err', id); host.insertAdjacentElement(where, p); }
    p.textContent = text; box.classList.add('lv-bad'); el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', id);
    return true;
  }
  function problem(el) {
    if (el.type === 'checkbox') return el.checked ? '' : E.check;
    var v = (el.value || '').trim();
    if (!v) return E.req;
    if (el.type === 'email' && (!el.checkValidity() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))) return E.email;
    return el.checkValidity() ? '' : E.req;
  }
  function groupBox(el) { return el.closest('fieldset') || el.parentNode.parentNode; }
  function checkOne(el, root) {
    if (el.closest('[hidden]')) return false;
    if (el.type === 'radio') {
      var any = $$('input[name="' + el.name + '"]', root).some(function (r) { return r.checked; });
      var first = $('input[name="' + el.name + '"]', root), box = groupBox(first);
      return setErr(first, box, box, 'beforeend', any ? '' : E.pick);
    }
    if (el.name === 'schools') {
      var sc = $$('input[name="schools"]', root), box2 = groupBox(sc[0]);
      return setErr(sc[0], box2, box2, 'beforeend', sc.some(function (c) { return c.checked; }) ? '' : E.any);
    }
    if (el.hasAttribute('data-school-other-text')) {
      var oc = $('[data-school-other]', root);
      return setErr(el, el, el, 'afterend', oc && oc.checked && !(el.value || '').trim() ? E.req : '');
    }
    if (el.type === 'checkbox') { var lab = el.closest('label') || el; return setErr(el, lab, lab, 'afterend', problem(el)); }
    return setErr(el, el, el, 'afterend', problem(el));
  }
  function targets(root) {
    var list = [], seen = {};
    $$('[required]', root).forEach(function (el) {
      if (el.type === 'radio') { if (seen[el.name]) return; seen[el.name] = 1; }
      list.push(el);
    });
    // the free-text school name is optional: ticking 'another school' alone is enough
    return list;
  }
  function clearErrs(root) {
    $$('[data-err]', root).forEach(function (box) {
      var p = document.getElementById(box.getAttribute('data-err')); if (p) p.parentNode.removeChild(p);
      box.classList.remove('lv-bad'); box.removeAttribute('data-err');
    });
    $$('[aria-invalid]', root).forEach(function (el) { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
  }
  // stay: leave the scroll position alone (validation has already scrolled to the first wrong field)
  function say(m, text, kind, stay) {
    if (!m) return;
    m.textContent = text || '';
    m.classList.toggle('is-err', kind === 'err'); m.classList.toggle('is-ok', kind === 'ok');
    if (text && !stay) { try { m.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
  }
  function valid(root) {
    var bad = false;
    targets(root).forEach(function (el) { if (checkOne(el, root)) bad = true; });
    if (!root.getAttribute('data-live')) {
      root.setAttribute('data-live', '1');
      // once a field has been flagged, re-check it as soon as it is corrected
      var live = function () {
        if (!$('.lv-bad', root)) return;
        targets(root).forEach(function (el) {
          var flagged = el.getAttribute('aria-invalid') === 'true' || (el.type !== 'radio' && el.name !== 'schools' ? false : !!$('.lv-bad', groupBox(el).parentNode));
          if (flagged) checkOne(el, root);
        });
        if (!$('.lv-bad', root)) $$('.lv-formmsg.is-err, .lv-guidemsg.is-err', root).forEach(function (m) { say(m, ''); });
      };
      root.addEventListener('input', live); root.addEventListener('change', live);
    }
    if (bad) {
      var first = $('[aria-invalid="true"]', root);
      if (first) {
        var tgt = first.type === 'radio' || first.name === 'schools' ? groupBox(first) : (first.closest('label') || first);
        var tr = tgt.getBoundingClientRect();
        // already comfortably on screen: leave the page where it is
        if (tr.top < 90 || tr.bottom > window.innerHeight - 90) { try { tgt.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} }
        try { first.focus({ preventScroll: true }); } catch (x) {}
      }
    }
    return !bad;
  }
  window.lvForm = { valid: valid, say: say, clear: clearErrs, sum: E.sum };
  function post(payload, form) {
    return window.lvTS(form || document.body).then(function (tok) { payload.cf = tok; return fetch('/api/lesson-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    }); }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) throw new Error(j.error || r.status); return j; }); });
  }

  // ---------- guide form ----------
  var gform = $('.lv-guideform');
  if (gform) {
    var gmsg = $('.lv-guidemsg', gform);
    var gl = $('select[name="replyLang"]', gform);
    if (gl) gl.value = { en: 'EN', ko: 'KO', ja: 'JA', zh: 'ZH' }[lang] || 'EN';
    gform.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid(gform)) { say(gmsg, E.sum, 'err', true); return; }
      var d = collect(gform, { type: 'guide', source: location.pathname + ' · ' + window.lvVia, siteLang: lang });
      d.guideLang = d.replyLang;
      var btn = $('button[type="submit"]', gform); btn.disabled = true; say(gmsg, t.send);
      post({ type: 'guide', company: d.lv_hp_x7 || '', data: d }, gform).then(function () {
        var sentTo = d.email;
        say(gmsg, ''); gform.reset(); if (gl) gl.value = { en: 'EN', ko: 'KO', ja: 'JA', zh: 'ZH' }[lang] || 'EN'; btn.disabled = false;
        guideDone(sentTo);
        window.lvTrack('guide_request', { page: location.pathname });
      }).catch(function () { say(gmsg, t.err, 'err'); btn.disabled = false; try { btn.focus(); } catch (x) {} });
    });
  }

  // ---------- guide sent: what arrives, and the next step ----------
  function guideDone(email) {
    var G = {
      en: { h: 'Your guides are on the way', to: 'We sent an email to ', toEnd: ' with links to two guides.',
            g1: 'LYVON Welcome Guide', g1d: 'our programs and how a lesson works',
            g2: 'Semmelweis oral exam guide', g2d: 'the 50 official topics, key terms and practice questions',
            spam: 'Not there in a few minutes? Check your spam folder.',
            nx: 'Next step', nxp: 'Want to know where you stand? A free 50-minute 1:1 lesson online shows you, with a written diagnostic afterwards.',
            b1: 'Book a free lesson', b2: 'Email us', b2h: 'mailto:hello@lyvon.io', again: 'Send to another email' },
      ko: { h: '가이드를 보내 드렸습니다', to: '', toEnd: ' 주소로 가이드 두 가지 링크를 보내 드렸습니다.',
            g1: 'LYVON 웰컴 가이드', g1d: '프로그램과 수업 방식 소개',
            g2: '셈멜바이스 구술시험 가이드', g2d: '공식 토픽 50개, 핵심 용어, 연습 질문',
            spam: '몇 분이 지나도 메일이 오지 않으면 스팸함을 확인해 주세요.',
            nx: '다음 단계', nxp: '지금 수준이 궁금하다면 50분 1:1 온라인 무료 수업에서 직접 확인해 보세요. 수업 후 진단 리포트를 보내 드립니다.',
            b1: '무료 수업 신청', b2: '카카오톡으로 문의', b2h: 'https://open.kakao.com/o/sh3TzOsi', again: '다른 이메일로 받기' },
      ja: { h: 'ガイドをお送りしました', to: '', toEnd: ' 宛てに、2つのガイドのリンクをお送りしました。',
            g1: 'LYVON ウェルカムガイド', g1d: 'プログラムとレッスンの進め方',
            g2: 'Semmelweis University 口頭試験ガイド', g2d: '公式トピック50、重要用語、練習問題',
            spam: '数分たっても届かない場合は、迷惑メールフォルダをご確認ください。',
            nx: '次のステップ', nxp: '今のレベルを知りたい方は、1対1のオンライン無料レッスン（50分）で確認できます。レッスン後に診断レポートをお送りします。',
            b1: '無料レッスンを予約', b2: 'LINEで相談する', b2h: 'https://line.me/ti/p/uwrW7dtHqN', again: '別のメールアドレスで受け取る' },
      zh: { h: '指南已寄出', to: '我們已寄送兩份指南的連結至 ', toEnd: '。',
            g1: 'LYVON 入門指南', g1d: '課程與上課方式介紹',
            g2: 'Semmelweis University 口試指南', g2d: '官方50個主題、關鍵術語與練習題',
            spam: '幾分鐘後仍未收到，請檢查垃圾郵件匣。',
            nx: '下一步', nxp: '想知道目前的程度嗎？50分鐘一對一線上免費課程可直接確認，課後會寄送診斷報告。',
            b1: '預約免費課程', b2: '來信洽詢', b2h: 'mailto:hello@lyvon.io', again: '寄到其他電子郵件' }
    }[lang] || null;
    var base = { en: '/', ko: '/ko/', ja: '/ja/', zh: '/zh-Hant/' }[lang] || '/';
    var box = gform.parentNode, title = $('p.lv-tb', box);
    var old = $('.lv-gdone', box); if (old) old.parentNode.removeChild(old);
    var el = function (tag, cls, txt) { var x = document.createElement(tag); if (cls) x.className = cls; if (txt != null) x.textContent = txt; return x; };
    var w = el('div', 'lv-gdone'); w.setAttribute('role', 'status'); w.tabIndex = -1;
    var h = el('p', 'lv-gdone-h'); h.appendChild(el('span', 'lv-gdone-ic', '✓')); h.appendChild(document.createTextNode(' ' + G.h)); w.appendChild(h);
    var to = el('p', 'lv-gdone-to'); to.appendChild(document.createTextNode(G.to)); to.appendChild(el('strong', '', email)); to.appendChild(document.createTextNode(G.toEnd)); w.appendChild(to);
    var ol = el('ol', 'lv-gdone-list');
    [[G.g1, G.g1d], [G.g2, G.g2d]].forEach(function (g) { var li = el('li'); li.appendChild(el('strong', '', g[0])); li.appendChild(el('span', '', g[1])); ol.appendChild(li); });
    w.appendChild(ol);
    w.appendChild(el('p', 'lv-gdone-spam', G.spam));
    w.appendChild(el('p', 'lv-gdone-nx', G.nx));
    w.appendChild(el('p', 'lv-gdone-nxp', G.nxp));
    var row = el('div', 'lv-gdone-btns');
    var a1 = el('a', 'lv-btn lv-btn-primary', G.b1 + ' →'); a1.href = base + 'book/'; row.appendChild(a1);
    var a2 = el('a', 'lv-btn lv-btn-secondary', G.b2 + (/^http/.test(G.b2h) ? ' ↗' : '')); a2.href = G.b2h;
    if (/^http/.test(G.b2h)) { a2.target = '_blank'; a2.rel = 'noopener'; }
    row.appendChild(a2); w.appendChild(row);
    var again = el('button', 'lv-gdone-again', G.again); again.type = 'button';
    again.addEventListener('click', function () { w.parentNode.removeChild(w); gform.hidden = false; if (title) title.hidden = false; var f = $('input[name="name"]', gform); if (f) f.focus(); });
    w.appendChild(again);
    gform.hidden = true; if (title) title.hidden = true;
    box.appendChild(w); try { w.focus(); } catch (x) {}
  }

  // ---------- 3-step lesson form ----------
  var book = $('#book');
  if (book && $('[data-step="1"]', book)) {
    var steps = $$('[data-step]', book);
    var msg = $('.lv-formmsg', book);
    function show(n, focus) {
      steps.forEach(function (s) { s.hidden = s.getAttribute('data-step') !== String(n); });
      book.classList.toggle('lv-done', String(n) === '4');
      $$('.lv-formmsg', book).forEach(function (m) { say(m, ''); });
      if (focus) { var cur = $('[data-step="' + n + '"]', book); if (cur) { cur.setAttribute('tabindex', '-1'); try { cur.focus({ preventScroll: true }); } catch (x) {} } }
      var top = book.getBoundingClientRect().top + window.scrollY - 80;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    }
    var params = new URLSearchParams(location.search);
    var program = params.get('program') || '';
    steps.forEach(function (s) {
      var n = Number(s.getAttribute('data-step'));
      if (s.tagName === 'FORM') {
        s.setAttribute('novalidate', '');
        // status and error text sits right above the buttons, where the user is when they press them
        var sm = $('.lv-formmsg', s), sb = $('button[type="submit"]', s);
        if (sm && sb && sb.parentNode.parentNode) sb.parentNode.parentNode.insertBefore(sm, sb.parentNode);
        var li = $$('.lv-stepper li', s)[n - 1]; if (li) li.setAttribute('aria-current', 'step');
        s.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!valid(s)) { say($('.lv-formmsg', s) || msg, E.sum, 'err', true); return; }
          if (n < 3) { show(n + 1, true); return; }
          var d = { type: 'lesson', source: 'web · ' + location.pathname + (program ? ' · ' + program : '') + ' · ' + window.lvVia, siteLang: lang };
          steps.forEach(function (f) { if (f.tagName === 'FORM') collect(f, d); });
          ['preparation', 'schools'].forEach(function (k) { if (!d[k]) d[k] = 'Not answered'; });
          var btn = $('button[type="submit"]', s); btn.disabled = true;
          var m2 = $('.lv-formmsg', s) || msg; say(m2, t.send);
          post({ type: 'lesson', company: d.lv_hp_x7 || '', data: d }, s).then(function () {
            window.lvTrack('lesson_request', { program: program || 'none', page: location.pathname });
            var st = $('.lv-sent-to', book); if (st && d.email) { st.textContent = st.getAttribute('data-tpl').replace('{email}', d.email); st.hidden = false; }
            steps.forEach(function (f) { if (f.tagName === 'FORM') f.reset(); });
            $$('[data-school-other]', book).forEach(function (c) { c.value = 'Another overseas medical school'; });
            $$('[data-school-other-text]', book).forEach(function (x) { x.hidden = true; x.value = ''; });
            if (brl) { var dv2 = { ko: 'KO', ja: 'JA' }[lang] || 'EN'; brl.value = dv2; }
            steps.forEach(function (f) { clearErrs(f); });
            $$('details.lv-more', book).forEach(function (x) { x.open = false; });
            cond(); presetCountry();
            btn.disabled = false; show(4, true);
          }).catch(function () { say(m2, t.err, 'err'); btn.disabled = false; });
        });
      }
      $$('[data-to]', s).forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); show(b.getAttribute('data-to'), true); });
      });
    });
    // reply language defaults to the site language
    var brl = $('select[name="replyLang"]', book);
    if (brl && !brl.value) { var dv = { ko: 'KO', ja: 'JA' }[lang] || 'EN'; if ($('option[value="' + dv + '"]', brl)) brl.value = dv; }
    // country starts on the site's own market (ko: Korea, ja: Japan, zh: Taiwan); English visitors choose
    var ctry = $('select[name="country"]', book);
    function presetCountry() { var ix = { ko: 1, ja: 2, zh: 3 }[lang]; if (ctry && ix && !ctry.value && ctry.options[ix]) ctry.selectedIndex = ix; }
    presetCountry();
    // mark radio groups required where the step asks for them
    ['whyDoctor'].forEach(function (n) { var r = $('input[name="' + n + '"]', book); if (r) r.required = true; });
    // conditional fields: student details for parents, guardian confirmation for middle-school students
    var sit = $('select[name="situation"]', book);
    function cond() {
      var o = sit && sit.options[sit.selectedIndex];
      var on = { parent: !!(o && o.hasAttribute('data-parent')), minor: !!(o && o.hasAttribute('data-minor')) };
      $$('[data-when]', book).forEach(function (el) {
        var v = on[el.getAttribute('data-when')];
        el.hidden = !v;
        $$('[data-req]', el).forEach(function (x) { x.required = v; if (!v) { if (x.type === 'checkbox') x.checked = false; else x.value = ''; } });
      });
    }
    if (sit) { sit.addEventListener('change', cond); cond(); }
    show(1);
  }
})();

// ---------- motion (subtle; off for prefers-reduced-motion) ----------
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement;
  root.classList.add('lv-anim');

  // hero: slow settle-in of photos and headline
  var ROOT = document.querySelector('body > .lv-root, body > [class$="-root"]') || document.body;
  var hero = document.querySelector('.lv-hero') || ROOT.querySelector('section');
  if (hero) hero.classList.add('lv-hero');

  // scroll reveal
  var SEL = 'h1,h2,h3,p,li,img,figure,dl,table,article,a.lv-row,blockquote';
  var EXCL = 'header,nav,form,.lv-menu,.lv-guide,.lv-guidebar,.lv-langmenu,.lv-hero,footer,[data-step],.lv-film-bg';
  var picked = [];
  ROOT.querySelectorAll(SEL).forEach(function (el) {
    if (el.closest(EXCL)) return;
    for (var p = el.parentElement; p; p = p.parentElement) if (p.classList && p.classList.contains('lv-rv')) return;
    el.classList.add('lv-rv'); picked.push(el);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, sibs = 0;
      // stagger siblings that enter together
      var prev = el.previousElementSibling;
      while (prev && prev.classList.contains('lv-rv') && !prev.classList.contains('lv-in') && sibs < 6) { sibs++; prev = prev.previousElementSibling; }
      el.style.transitionDelay = (sibs * 140) + 'ms';
      el.classList.add('lv-in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -14% 0px', threshold: 0.12 });
  picked.forEach(function (el) { io.observe(el); });
  // safety net: an element clipped by its card (overflow hidden + the reveal offset) may never
  // report an intersection, so reveal anything whose box has reached the viewport while scrolling
  var sweepT = 0;
  function sweep() {
    sweepT = 0;
    var lim = window.innerHeight * 0.92;
    Array.prototype.forEach.call(document.querySelectorAll('.lv-rv:not(.lv-in)'), function (el) {
      var r = el.getBoundingClientRect();
      if (r.top - 56 < lim && r.bottom > 0) { el.classList.add('lv-in'); io.unobserve(el); }
    });
  }
  window.addEventListener('scroll', function () { if (!sweepT) sweepT = setTimeout(sweep, 120); }, { passive: true });
  window.addEventListener('load', function () { setTimeout(sweep, 300); });

  // count-up for large figures (e.g. 91.7%, 12, 150)
  var re = /^(\d+(?:\.\d+)?)(%?)$/;
  var nums = [];
  ROOT.querySelectorAll('p, dt, dd, strong, span').forEach(function (el) {
    if (el.children.length) return;
    var m = (el.textContent || '').trim().match(re);
    if (!m) return;
    if (parseFloat(getComputedStyle(el).fontSize) < 36) return;
    if (/^20\d\d$/.test(m[1])) return; // skip years
    if (m[2] === '%') return; // a rate is never shown part-way
    nums.push({ el: el, end: parseFloat(m[1]), dec: (m[1].split('.')[1] || '').length, suf: m[2], txt: el.textContent });
  });
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      co.unobserve(e.target);
      var n = nums.filter(function (x) { return x.el === e.target; })[0]; if (!n) return;
      var t0 = null, D = 1800;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / D), v = n.end * (1 - Math.pow(1 - k, 3));
        n.el.textContent = v.toFixed(n.dec) + n.suf;
        if (k < 1) requestAnimationFrame(step); else n.el.textContent = n.txt;
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  nums.forEach(function (n) { n.el.style.fontVariantNumeric = 'tabular-nums'; co.observe(n.el); });
})();

// ---------- scroll position: restore where the visitor was when they come back ----------
(function () {
  'use strict';
  var ss; try { ss = window.sessionStorage; ss.setItem('lv-t', '1'); ss.removeItem('lv-t'); } catch (x) { return; }
  var KEY = 'lv-scroll:' + location.pathname + location.search;
  var de = document.documentElement;
  function save() { try { ss.setItem(KEY, String(Math.round(window.scrollY || de.scrollTop || 0))); } catch (x) {} }
  var tid = 0;
  window.addEventListener('scroll', function () { clearTimeout(tid); tid = setTimeout(save, 150); }, { passive: true });
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && a.origin === location.origin) save();
  }, true);

  var nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var type = nav ? nav.type : (performance.navigation && performance.navigation.type === 2 ? 'back_forward' : 'navigate');
  var viaBack = false;
  try { viaBack = ss.getItem('lv-via-back') === location.pathname; ss.removeItem('lv-via-back'); } catch (x) {}
  var saved = parseInt(ss.getItem(KEY) || '', 10);
  function manual() { try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (x) {} }
  if (!(type === 'back_forward' || viaBack) || !(saved > 0)) {
    // nothing saved: keep the browser's own behaviour (fragment links, native restore)
    if (type === 'reload' && saved > 0 && !location.hash) { manual(); jump(saved, 1500); }
    else if (location.hash.length > 1) {
      // landed on an anchor (e.g. /#programs): show whatever already peeks into the viewport
      var peek = function () {
        // jump straight to the anchor instead of a long smooth scroll from the top
        var tg = null; try { tg = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (x) {}
        if (tg && !(window.scrollY > 0 && Math.abs(tg.getBoundingClientRect().top) < 2)) {
          var prev = de.style.scrollBehavior; de.style.scrollBehavior = 'auto';
          tg.scrollIntoView({ block: 'start' });
          de.style.scrollBehavior = prev;
        }
        Array.prototype.forEach.call(document.querySelectorAll('.lv-rv:not(.lv-in)'), function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('lv-in');
        });
      };
      if (document.readyState === 'complete') setTimeout(peek, 0); else window.addEventListener('load', function () { setTimeout(peek, 0); });
    }
    return;
  }
  manual();
  jump(saved, 2500);

  function jump(y, budget) {
    var stopped = false, t0 = Date.now(), done = 0;
    function stop() { stopped = true; }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, stop, { passive: true, once: true }); });
    function to(v) {
      var prev = de.style.scrollBehavior;
      de.style.scrollBehavior = 'auto';
      window.scrollTo(0, v);
      de.style.scrollBehavior = prev;
    }
    function reveal() {
      var lim = window.innerHeight * 1.25;
      Array.prototype.forEach.call(document.querySelectorAll('.lv-rv:not(.lv-in)'), function (el) {
        if (el.getBoundingClientRect().top < lim) {
          el.style.transition = 'none'; el.style.transitionDelay = '0ms'; el.classList.add('lv-in');
          requestAnimationFrame(function () { requestAnimationFrame(function () { el.style.transition = ''; }); });
        }
      });
    }
    function near() {
      // images in or near the viewport still loading?
      var imgs = document.images, h = window.innerHeight;
      for (var i = 0; i < imgs.length; i++) {
        var r = imgs[i].getBoundingClientRect();
        if (!imgs[i].complete && r.bottom > -h && r.top < 2 * h) return true;
      }
      return false;
    }
    function tick() {
      if (stopped) return;
      var max = (document.scrollingElement || de).scrollHeight - window.innerHeight;
      if (max >= y - 1) {
        if (Math.abs((window.scrollY || 0) - y) > 1) to(y);
        reveal();
        done++;
        if ((document.readyState === 'complete' && !near() && done > 2) || Date.now() - t0 > budget) return;
      } else if (Date.now() - t0 > budget) { to(Math.min(y, max)); reveal(); return; }
      setTimeout(tick, 60);
    }
    tick();
  }
})();

// ---------- phone dock: home · free lesson · chat, always one tap away ----------
(function () {
  'use strict';
  var path = location.pathname;
  var m = path.match(/^\/(ko|ja|zh-Hant)(\/|$)/), L = m ? m[1] : 'en', base = m ? '/' + L + '/' : '/';
  var rest = path.slice(base.length - 1);
  if (/^\/(book|salon|card|legal)(\/|$)/.test(rest) || /^\/(book|salon|card|legal)(\/|$)/.test(path)) return;
  if (!document.querySelector('.lv-root, [class$="-root"]') && !document.querySelector('header')) return;
  var T = {
    en: { nav: 'Quick actions', home: 'Home', cta: 'Book a free lesson', chat: 'Email', href: 'mailto:hello@lyvon.io' },
    ko: { nav: '빠른 메뉴', home: '홈', cta: '무료 수업 신청', chat: '카카오 상담', href: 'https://open.kakao.com/o/sh3TzOsi' },
    ja: { nav: 'クイックメニュー', home: 'ホーム', cta: '無料レッスンを予約', chat: 'LINE 相談', href: 'https://line.me/ti/p/uwrW7dtHqN' },
    'zh-Hant': { nav: '快速選單', home: '首頁', cta: '預約免費課程', chat: 'Email', href: 'mailto:hello@lyvon.io' }
  }[L];
  var mc = /^\/programs\/medconnect(\/|$)/.test(rest) || /^\/programs\/medconnect(\/|$)/.test(path);
  var ctaHref = base + 'book/', ctaText = T.cta;
  // on a program page, every link to the booking form carries the program
  var pg = (rest.match(/^\/programs\/(medpath|medbridge)(\/|$)/) || [])[1];
  if (pg) {
    ctaHref += '?program=' + pg;
    document.querySelectorAll('a[href]').forEach(function (a) { if (a.getAttribute('href') === base + 'book/') a.setAttribute('href', base + 'book/?program=' + pg); });
  }
  var cr = /^\/programs\/career(\/|$)/.test(rest);
  if (mc || cr) {
    ctaHref = '#book';
    ctaText = mc ? { en: 'MedConnect inquiry', ko: 'MedConnect 문의', ja: 'お問い合わせ', 'zh-Hant': '洽詢 MedConnect' }[L]
                 : { en: 'Career inquiry', ko: 'Career 문의', ja: 'お問い合わせ', 'zh-Hant': '洽詢 Career' }[L];
    document.querySelectorAll('a.lv-navcta').forEach(function (a) { a.setAttribute('href', '#book'); a.textContent = ctaText; });
  }
  var ic = function (d) { return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var home = ic('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h5v-6h4v6h5V9.5"/>');
  var chat = /^mailto:/.test(T.href) ? ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>') : ic('<path d="M12 4c-4.97 0-9 3.13-9 7 0 2.44 1.6 4.6 4.03 5.85L6 20.5l4.13-2.6c.6.07 1.23.1 1.87.1 4.97 0 9-3.13 9-7s-4.03-7-9-7Z"/>');
  var ext = /^https?:/.test(T.href) ? ' target="_blank" rel="noopener"' : '';
  var dock = document.createElement('nav');
  dock.className = 'lv-dock';
  dock.setAttribute('aria-label', T.nav);
  dock.innerHTML =
    '<a class="lv-dock-side" href="' + base + '">' + home + '<span>' + T.home + '</span></a>' +
    '<a class="lv-dock-cta" href="' + ctaHref + '">' + ctaText + ' <span aria-hidden="true">→</span></a>' +
    '<a class="lv-dock-side" href="' + T.href + '"' + ext + '>' + chat + '<span>' + T.chat + '</span></a>';
  document.body.appendChild(dock);
  document.documentElement.classList.add('lv-has-dock');
  // wider screens: a slim bar with the same action, shown once the hero has scrolled away
  var stick = document.createElement('div');
  stick.className = 'lv-stick';
  var onPage = !mc && !cr && document.getElementById('book') && document.getElementById('contact');
  stick.innerHTML = '<div><a class="lv-stick-brand" href="' + base + '">LYVON</a><span class="lv-stick-acts"><a class="lv-stick-chat" href="' + T.href + '"' + ext + '>' + T.chat + '</a><a class="lv-stick-cta" href="' + (onPage ? '#book' : ctaHref) + '">' + ctaText + ' <span aria-hidden="true">→</span></a></span></div>';
  document.body.appendChild(stick);
  // home on the home page itself: back to the top
  dock.firstChild.addEventListener('click', function (e) {
    if (location.pathname === base) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  // stay out of the way: hidden at the very top (hero already has the buttons), over the contact form, and while typing
  var contact = document.getElementById('contact') || document.getElementById('book');
  var overForm = false, typing = false;
  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { overForm = es[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
  }
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input,select,textarea')) { typing = true; upd(); } });
  document.addEventListener('focusout', function () { typing = false; setTimeout(upd, 50); });
  function upd() {
    var show = (window.scrollY || 0) > window.innerHeight * 0.5 && !overForm && !typing;
    dock.classList.toggle('lv-dock-on', show);
    if (show) dock.removeAttribute('inert'); else dock.setAttribute('inert', '');
    var on = (window.scrollY || 0) > window.innerHeight * 0.85 && !overForm;
    stick.classList.toggle('lv-stick-on', on);
    if (on) stick.removeAttribute('inert'); else stick.setAttribute('inert', '');
  }
  var t = 0;
  window.addEventListener('scroll', function () { if (!t) t = requestAnimationFrame(function () { t = 0; upd(); }); }, { passive: true });
  window.addEventListener('resize', upd);
  upd();
})();

/* 2026-11-09: show the chosen program on the booking page (?program=medpath|medbridge|medconnect) */
(function () {
  try {
    var el = document.querySelector('.lv-trust-prog');
    if (!el) return;
    var p = new URLSearchParams(location.search).get('program');
    var names = { medpath: 'MedPath', medbridge: 'MedBridge', medconnect: 'MedConnect' };
    if (p && names[p]) { el.textContent = el.getAttribute('data-prog-label') + (/^(ja|zh)/.test(document.documentElement.lang) ? '：' : ': ') + names[p]; el.hidden = false; }
  } catch (e) {}
})();

/* 2026-11-09: MedConnect inquiry form (posts to the same endpoint as the lesson form) */
(function () {
  var f = document.querySelector('form.lv-mcform');
  if (!f) return;
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: ['Please fill in the required fields.', 'Sending…', 'Thank you. We will reply within 24 hours on weekdays.', 'Something went wrong. Please email hello@lyvon.io.'],
    ko: ['필수 항목을 입력해 주세요.', '전송 중…', '감사합니다. 평일 24시간 이내에 답변해 드리겠습니다.', '전송에 실패했습니다. hello@lyvon.io로 메일을 보내 주세요.'],
    ja: ['必須項目を入力してください。', '送信中…', 'ありがとうございます。平日24時間以内にご返信します。', '送信できませんでした。hello@lyvon.io までメールでご連絡ください。'],
    zh: ['請填寫必填欄位。', '傳送中…', '謝謝。我們將於平日24小時內回覆。', '傳送失敗，請來信 hello@lyvon.io。']
  }[lang] || null;
  T = T || ['Please fill in the required fields.', 'Sending…', 'Thank you. We will reply within 24 hours on weekdays.', 'Something went wrong. Please email hello@lyvon.io.'];
  var msg = f.querySelector('.lv-formmsg');
  var sb0 = f.querySelector('button[type="submit"]'); if (msg && sb0) sb0.parentNode.insertBefore(msg, sb0);
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var F = window.lvForm, sayM = function (x, k, stay) { if (F) F.say(msg, x, k, stay); else msg.textContent = x; };
    if (F && !F.valid(f)) { sayM(F.sum, 'err', true); return; }
    var v = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? (el.value || '').trim() : ''; };
    var career = f.getAttribute('data-inquiry') === 'career';
    var d = { type: 'lesson', source: 'web · ' + location.pathname + (career ? ' · career' : ' · medconnect') + ' · ' + window.lvVia, siteLang: lang, name: v('name'), email: v('email'),
      situation: career ? 'Career inquiry' : 'University student', targetField: career ? 'LYVON Career' : 'MedConnect', replyLang: v('replyLang'), consent: true,
      message: (career ? 'LYVON Career inquiry — Goal: ' : 'MedConnect inquiry — School/year: ') + v('school') + (v('message') ? ' — ' + v('message') : '') };
    var btn = f.querySelector('button[type="submit"]'); btn.disabled = true; sayM(T[1]);
    window.lvTS(f).then(function (tok) { return fetch('/api/lesson-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'lesson', company: v('lv_hp_x7'), cf: tok, data: d }) }); })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) throw 0; }); })
      .then(function () { sayM(T[2], 'ok'); f.reset(); btn.disabled = false; window.lvTrack('lesson_request', { program: career ? 'career' : 'medconnect', page: location.pathname }); })
      .catch(function () { sayM(T[3], 'err'); btn.disabled = false; });
  });
})();

// ---------- phones: long sample report opens on request ----------
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(max-width: 700px)').matches) return;
  var card = document.querySelector('#method .lv-card[role="img"]');
  if (!card || card.scrollHeight < 620) return;
  var L = (document.documentElement.lang || 'en').toLowerCase();
  var txt = L.indexOf('ko') === 0 ? '리포트 예시 전체 보기' : L.indexOf('ja') === 0 ? 'サンプルレポートをすべて見る' : L.indexOf('zh') === 0 ? '查看完整範例報告' : 'Show the full sample report';
  var wrap = document.createElement('div'); wrap.className = 'lv-fold';
  card.parentNode.insertBefore(wrap, card); wrap.appendChild(card);
  var b = document.createElement('button'); b.type = 'button'; b.className = 'lv-fold-btn'; b.setAttribute('aria-expanded', 'false');
  b.innerHTML = txt + ' <span aria-hidden="true">↓</span>';
  wrap.parentNode.insertBefore(b, wrap.nextSibling);
  b.addEventListener('click', function () { wrap.classList.add('lv-fold-open'); b.parentNode.removeChild(b); });
})();

/* 2026-11-13: philosophy film — crossfade the clip that matches the chapter in view */
(function () {
  var film = document.querySelector('.lv-film'); if (!film || !('IntersectionObserver' in window)) return;
  var bg = film.querySelector('.lv-film-bg'); if (!bg) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = window.matchMedia && matchMedia('(max-width: 700px)').matches;
  var imgs = [].slice.call(bg.querySelectorAll('img')), vids = [].slice.call(bg.querySelectorAll('video'));
  var rows = [].slice.call(film.querySelectorAll('.ph-row')), cur = -1; var intro = film.querySelector('div > p.lv-tb:first-child');
  function load(v) { if (!v.getAttribute('src')) v.src = v.getAttribute('data-src') + (small ? '-m' : '') + '.mp4'; }
  // iOS: muted+inline must be set as properties; if autoplay is refused (Low Power Mode etc.)
  // keep the still image and retry on the first touch.
  vids.forEach(function (v) { v.muted = true; v.defaultMuted = true; v.playsInline = true; v.setAttribute('webkit-playsinline', ''); });
  function tryPlay(v) {
    var p; try { p = v.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () { if (+v.getAttribute('data-i') === cur) v.classList.add('on'); }).catch(function () { v.classList.remove('on'); });
    } else { v.classList.add('on'); }
  }
  function kick() {
    var v = vids.filter(function (x) { return +x.getAttribute('data-i') === cur; })[0];
    if (v && v.paused) tryPlay(v);
  }
  ['touchstart', 'click', 'keydown'].forEach(function (ev) { window.addEventListener(ev, kick, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) kick(); });
  function show(i) {
    if (i === cur) return; cur = i;
    imgs.forEach(function (m) { m.classList.toggle('on', +m.getAttribute('data-i') === i); });
    if (reduce) return;
    vids.forEach(function (v) {
      var k = +v.getAttribute('data-i');
      if (k === i) { load(v); tryPlay(v); }
      else { v.classList.remove('on'); setTimeout(function () { if (!v.classList.contains('on')) v.pause(); }, 1100); }
      if (k === i + 1) load(v);
    });
  }
  // Scene = last chapter whose top has passed the viewport middle (intro and 01 share scene 0)
  var tick = false;
  function pick() {
    tick = false;
    var r = film.getBoundingClientRect(), vh = window.innerHeight || 800;
    if (r.bottom < 0 || r.top > vh) return;
    var mid = vh / 2, idx = 0;
    for (var k = 0; k < rows.length; k++) { if (rows[k].getBoundingClientRect().top <= mid) idx = k; }
    show(idx);
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(pick); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  window.addEventListener('pageshow', req);
  pick();
})();
