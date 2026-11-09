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
  function valid(root) {
    var ok = true, first = null;
    $$('[required]', root).forEach(function (el) {
      var bad;
      if (el.type === 'radio') bad = !$$('input[name="' + el.name + '"]', root).some(function (r) { return r.checked; });
      else bad = el.type === 'checkbox' ? !el.checked : !(el.value || '').trim() || !el.checkValidity();
      el.setAttribute('aria-invalid', bad ? 'true' : 'false');
      el.style.outline = bad ? '2px solid #C0392B' : '';
      if (bad) { ok = false; if (!first) first = el; }
    });
    // at least one school (checkbox group)
    var sc = $$('input[name="schools"]', root);
    if (sc.length) {
      var any = sc.some(function (c) { return c.checked; });
      var box = sc[0].closest('fieldset') || sc[0].parentNode.parentNode;
      box.style.outline = any ? '' : '2px solid #C0392B';
      if (!any) { ok = false; if (!first) first = sc[0]; }
      var oc = $('[data-school-other]', root), ot = $('[data-school-other-text]', root);
      if (oc && ot && oc.checked && !(ot.value || '').trim()) { ok = false; ot.style.outline = '2px solid #C0392B'; if (!first) first = ot; }
      else if (ot) ot.style.outline = '';
    }
    if (first) { try { first.focus({ preventScroll: true }); } catch (x) {} }
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
        gmsg.textContent = t.guideOk; gform.reset(); if (gl) gl.value = { en: 'EN', ko: 'KO', ja: 'JA', zh: 'ZH' }[lang] || 'EN'; btn.disabled = false;
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
      $$('.lv-formmsg', book).forEach(function (m) { m.textContent = ''; });
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
          if (!valid(s)) { var m = $('.lv-formmsg', s) || msg; if (m) { m.textContent = t.req; try { m.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {} } return; }
          if (n < 3) { show(n + 1); return; }
          var d = { type: 'lesson', source: 'web · ' + location.pathname + (program ? ' · ' + program : ''), siteLang: lang };
          steps.forEach(function (f) { if (f.tagName === 'FORM') collect(f, d); });
          var btn = $('button[type="submit"]', s); btn.disabled = true;
          var m2 = $('.lv-formmsg', s) || msg; if (m2) m2.textContent = t.send;
          post({ type: 'lesson', company: d.company || '', data: d }).then(function () {
            steps.forEach(function (f) { if (f.tagName === 'FORM') f.reset(); });
            $$('[data-school-other]', book).forEach(function (c) { c.value = 'Other overseas medical school'; });
            $$('[data-school-other-text]', book).forEach(function (x) { x.hidden = true; x.value = ''; });
            if (brl) { var dv2 = { ko: 'KO', ja: 'JA' }[lang] || 'EN'; brl.value = dv2; }
            btn.disabled = false; show(4);
          }).catch(function () { if (m2) m2.textContent = t.err; btn.disabled = false; });
        });
      }
      $$('[data-to]', s).forEach(function (b) {
        b.addEventListener('click', function (e) { e.preventDefault(); show(b.getAttribute('data-to')); });
      });
    });
    // reply language defaults to the site language
    var brl = $('select[name="replyLang"]', book);
    if (brl && !brl.value) { var dv = { ko: 'KO', ja: 'JA' }[lang] || 'EN'; if ($('option[value="' + dv + '"]', brl)) brl.value = dv; }
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

// ---------- phone strip: start centred on the middle phone when it overflows ----------
(function () {
  document.querySelectorAll('.lv-phones').forEach(function (strip) {
    function centre() {
      if (strip.scrollWidth <= strip.clientWidth + 2) return;
      var kids = strip.children, mid = kids[Math.floor(kids.length / 2)];
      if (mid) strip.scrollLeft += mid.getBoundingClientRect().left - strip.getBoundingClientRect().left - (strip.clientWidth - mid.offsetWidth) / 2;
    }
    centre(); window.addEventListener('load', centre);
  });
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
  var EXCL = 'header,nav,form,.lv-menu,.lv-guide,.lv-guidebar,.lv-langmenu,.lv-hero,footer,[data-step]';
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
  if (mc) {
    ctaHref = '#book';
    ctaText = { en: 'Ask about MedConnect', ko: 'MedConnect 문의', ja: 'MedConnect に問い合わせ', 'zh-Hant': '洽詢 MedConnect' }[L];
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
  // home on the home page itself: back to the top
  dock.firstChild.addEventListener('click', function (e) {
    if (location.pathname === base) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
  // stay out of the way: hidden at the very top (hero already has the buttons), over the contact form, and while typing
  var contact = document.getElementById('contact');
  var overForm = false, typing = false;
  if (contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { overForm = es[0].isIntersecting; upd(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contact);
  }
  document.addEventListener('focusin', function (e) { if (e.target.matches && e.target.matches('input,select,textarea')) { typing = true; upd(); } });
  document.addEventListener('focusout', function () { typing = false; setTimeout(upd, 50); });
  function upd() {
    var show = (window.scrollY || 0) > window.innerHeight * 0.5 && !overForm && !typing;
    dock.classList.toggle('lv-dock-on', show);
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
    if (p && names[p]) { el.textContent = el.getAttribute('data-prog-label') + ': ' + names[p]; el.hidden = false; }
  } catch (e) {}
})();

/* 2026-11-09: MedConnect inquiry form (posts to the same endpoint as the lesson form) */
(function () {
  var f = document.querySelector('form.lv-mcform');
  if (!f) return;
  var lang = (document.documentElement.lang || 'en').slice(0, 2);
  var T = {
    en: ['Please fill in the required fields.', 'Sending…', 'Thank you. We will reply within 24 hours on weekdays.', 'Something went wrong. Please email hello@lyvon.io.'],
    ko: ['필수 항목을 입력해 주세요.', '보내는 중…', '감사합니다. 평일 24시간 이내에 답변드리겠습니다.', '전송에 실패했습니다. hello@lyvon.io로 메일 주세요.'],
    ja: ['必須項目をご入力ください。', '送信中…', 'ありがとうございます。平日24時間以内にご返信します。', '送信できませんでした。hello@lyvon.io までメールでご連絡ください。'],
    zh: ['請填寫必填欄位。', '傳送中…', '謝謝。我們將於平日24小時內回覆。', '傳送失敗，請來信 hello@lyvon.io。']
  }[lang] || null;
  T = T || ['Please fill in the required fields.', 'Sending…', 'Thank you. We will reply within 24 hours on weekdays.', 'Something went wrong. Please email hello@lyvon.io.'];
  var msg = f.querySelector('.lv-formmsg');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = null;
    f.querySelectorAll('[required]').forEach(function (el) {
      var b = el.type === 'checkbox' ? !el.checked : !(el.value || '').trim() || !el.checkValidity();
      el.setAttribute('aria-invalid', b ? 'true' : 'false'); el.style.outline = b ? '2px solid #F7F7F4' : '';
      if (b && !bad) bad = el;
    });
    if (bad) { msg.textContent = T[0]; try { bad.focus(); } catch (x) {} return; }
    var v = function (n) { var el = f.querySelector('[name="' + n + '"]'); return el ? (el.value || '').trim() : ''; };
    var d = { type: 'lesson', source: 'web · ' + location.pathname + ' · medconnect', siteLang: lang, name: v('name'), email: v('email'),
      situation: 'University student', targetField: 'MedConnect', replyLang: v('replyLang'), consent: true,
      message: 'MedConnect inquiry — School/year: ' + v('school') + (v('message') ? ' — ' + v('message') : '') };
    var btn = f.querySelector('button[type="submit"]'); btn.disabled = true; msg.textContent = T[1];
    fetch('/api/lesson-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'lesson', company: v('company'), data: d }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.ok === false) throw 0; }); })
      .then(function () { msg.textContent = T[2]; f.reset(); btn.disabled = false; })
      .catch(function () { msg.textContent = T[3]; btn.disabled = false; });
  });
})();
