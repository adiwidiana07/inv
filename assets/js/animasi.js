/* Karsa - Animasi global (anime.js + AOS + parallax.js)
 * Lokasi: careerpath/assets/js/animasi.js
 */
'use strict';

/* ---------- AOS: Animate On Scroll ---------- */
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 700,
    easing: 'ease-out-back',
    offset: 60,
    once: true,
    disable: 'mobile'
  });
}

/* ---------- anime.js: efek masuk halaman ---------- */
function animHalaman() {
  if (typeof anime === 'undefined') return;

  // Navbar slide in
  anime({
    targets: '.navbar',
    translateY: [-40, 0],
    opacity: [0, 1],
    duration: 600,
    easing: 'easeOutCubic'
  });

  // Hero title stagger
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    const spans = heroTitle.innerHTML.split(/<br\s*\/?>/i);
    heroTitle.innerHTML = spans
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<span class="hu-line">${s}</span>`)
      .join('');
    anime({
      targets: '.hu-line',
      translateY: [40, 0],
      opacity: [0, 1],
      duration: 800,
      delay: anime.stagger(150, { start: 250 }),
      easing: 'easeOutExpo'
    });
  }

  // Hero sub scale-in
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    anime({
      targets: heroSub,
      scale: [0.85, 1],
      opacity: [0, 1],
      duration: 700,
      delay: 700,
      easing: 'easeOutBack'
    });
  }

  // Hero buttons pop
  anime({
    targets: '.hero-btns .btn',
    scale: [0, 1],
    opacity: [0, 1],
    duration: 500,
    delay: anime.stagger(160, { start: 900 }),
    easing: 'easeOutElastic(1, 0.6)'
  });

  // Warning banner fade
  const warning = document.querySelector('.warning-banner');
  if (warning) {
    anime({
      targets: warning,
      opacity: [0, 1],
      duration: 600,
      delay: 1100,
      easing: 'linear'
    });
    anime({
      targets: warning.querySelectorAll('.warn-icon'),
      scale: [0, 1],
      rotate: { value: 360, duration: 500 },
      delay: anime.stagger(150, { start: 1200 }),
      easing: 'easeOutElastic(1, 0.7)'
    });
  }
}

/* ---------- anime.js: kartu warn-in ---------- */
function glowIn(el) {
  if (!el || typeof anime === 'undefined') return;
  anime({
    targets: el,
    scale: [0.97, 1],
    opacity: [0, 1],
    duration: 450,
    easing: 'easeOutQuad'
  });
}

/* ---------- animasi statistik / angka ---------- */
function animAngka(el, target) {
  if (!el || typeof anime === 'undefined') return;
  const from = { v: 0 };
  anime({
    targets: from,
    v: target,
    duration: 1200,
    easing: 'easeOutExpo',
    update: function () {
      el.textContent = Math.round(from.v).toLocaleString('id-ID');
    }
  });
}

/* ---------- hero: partikel chibi per-char (webp) - seamless CSS animation ---------- */
function initHeroBgFloats() {
  const wrap = document.querySelector('.hero-bg-floats');
  if (!wrap) return;
  // cegah inject dobel saat HMR / navigasi
  if (wrap.dataset.ready === '1' || wrap.children.length) return;
  wrap.dataset.ready = '1';

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CHAR_SRCS = [
    'assets/img/chibi/chibi-01.webp',
    'assets/img/chibi/chibi-02.webp',
    'assets/img/chibi/chibi-03.webp',
    'assets/img/chibi/chibi-04.webp',
    'assets/img/chibi/chibi-05.webp',
    'assets/img/chibi/chibi-06.webp',
    'assets/img/chibi/chibi-07.webp',
    'assets/img/chibi/chibi-08.webp',
    'assets/img/chibi/chibi-09.webp',
    'assets/img/chibi/chibi-10.webp'
  ];

  const isMobile = window.innerWidth < 768;
  const count = prefersReduced ? 3 : (isMobile ? 5 : 10);
  const aspectBySrc = {}; // cache aspect via natural ratio (approx dari nama, fallback 0.9)

  for (let i = 0; i < count; i++) {
    const img = document.createElement('img');
    img.className = 'hero-chibi-float';
    img.alt = '';
    img.draggable = false;
    img.decoding = 'async';
    img.loading = 'eager';
    // rotasi stok: semua char tampil, kalau count>10 diulang acak
    const src = CHAR_SRCS[i % CHAR_SRCS.length];
    // kalau count==10, urutan acak biar tidak sekuensial monoton
    const pick = count === 10 ? CHAR_SRCS[(i * 7) % CHAR_SRCS.length] : src;
    img.src = pick;

    // variasi ukuran 78..160px mobile, 90..170px desktop (sedikit lebih kecil agar tidak nutup teks)
    const w = isMobile ? (72 + Math.random() * 68) : (92 + Math.random() * 78);
    const dur = 13000 + Math.random() * 11000; // 13..24s
    const delay = -(Math.random() * dur); // negative delay = seamless, sudah tersebar di timeline
    const r0 = (-10 + Math.random() * 20).toFixed(1) + 'deg';
    const r1 = (-10 + Math.random() * 20).toFixed(1) + 'deg';
    const drift = (Math.random() < 0.5 ? '-' : '') + (18 + Math.random() * 36).toFixed(0) + 'px';
    const left = (Math.random() * 92 + 1).toFixed(2) + '%';
    const scale = (0.92 + Math.random() * 0.16).toFixed(2);
    const opacityJitter = (0.46 + Math.random() * 0.18).toFixed(2);

    img.style.width = w.toFixed(0) + 'px';
    img.style.height = 'auto';
    img.style.left = left;
    img.style.setProperty('--r0', r0);
    img.style.setProperty('--r1', r1);
    img.style.setProperty('--drift', drift);
    img.style.setProperty('--s0', scale);
    img.style.animationDuration = dur.toFixed(0) + 'ms';
    img.style.animationDelay = delay.toFixed(0) + 'ms';
    img.style.opacity = opacityJitter;
    img.style.setProperty('--op', opacityJitter);

    // fallback aman kalau webp gagal load -> sembunyikan elemen
    img.addEventListener('error', function () { img.style.display = 'none'; });

    wrap.appendChild(img);
  }
}

/* ---------- parallax.js ---------- */
function initParallax() {
  if (typeof Parallax === 'undefined') return;
  const scenes = document.querySelectorAll('[data-parallax]');
  scenes.forEach(function (scene) {
    try {
      new Parallax(scene, {
        selector: '[data-depth]',
        relativeInput: true,
        pointerEvents: true,
        scalarX: 6,
        scalarY: 6,
        frictionX: 0.15,
        frictionY: 0.15
      });
    } catch (e) {
      /* aman diabaikan */
    }
  });
}

/* ---------- ikuti kursor (efek hover) ---------- */
function initHoverGlow() {
  document.querySelectorAll('.btn, .persona, .faq-item, .hasil-card').forEach(function (el) {
    if (!el || typeof anime === 'undefined') return;
    el.addEventListener('mouseenter', function () {
      anime({
        targets: el,
        translateY: -3,
        boxShadow: ['4px 4px 0 #1a1a1a', '7px 9px 0 #1a1a1a'],
        duration: 200,
        easing: 'easeOutQuad'
      });
    });
    el.addEventListener('mouseleave', function () {
      anime({
        targets: el,
        translateY: 0,
        boxShadow: ['7px 9px 0 #1a1a1a', '4px 4px 0 #1a1a1a'],
        duration: 200,
        easing: 'easeOutQuad'
      });
    });
  });
}

/* ---------- animasi nav-link underline ---------- */
function initNavUnderline() {
  const links = document.querySelectorAll('.nav-link');
  if (!links.length || typeof anime === 'undefined') return;
  links.forEach(function (link) {
    link.style.position = 'relative';
    const bar = document.createElement('span');
    bar.style.cssText =
      'position:absolute;left:0;bottom:-6px;height:3px;width:0;background:#D9A441;transition:width .25s ease;';
    link.appendChild(bar);
    link.addEventListener('mouseenter', function () {
      bar.style.width = '100%';
    });
    link.addEventListener('mouseleave', function () {
      bar.style.width = '0';
    });
  });
}

/* ---------- FAQ accordion animasi tambahan ---------- */
function initFaqAnim() {
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    if (!btn || typeof anime === 'undefined') return;
    btn.addEventListener('click', function () {
      const item = btn.closest('.faq-item');
      if (!item || item.classList.contains('open')) return;
      const ans = item.querySelector('.faq-a');
      if (ans) {
        const h0 = ans.scrollHeight;
        ans.style.overflow = 'hidden';
        anime({
          targets: ans,
          height: [0, h0],
          opacity: [0, 1],
          duration: 380,
          easing: 'easeOutQuart',
          complete: function () {
            ans.style.height = '';
            ans.style.overflow = '';
          }
        });
      }
    });
  });
}

/* ---------- titik timeline berdenyut ---------- */
function initDotPulse() {
  document.querySelectorAll('.tl-dot').forEach(function (dot, i) {
    if (typeof anime === 'undefined') return;
    anime({
      targets: dot,
      scale: { value: [1, 1.35, 1], duration: 700, easing: 'easeInOutSine' },
      delay: 1400 + i * 220,
      loop: false
    });
  });
}

/* ---------- shimmer checker ---------- */
function initChecker() {
  const checker = document.querySelector('.checker');
  if (!checker || typeof anime === 'undefined') return;
  const band = document.createElement('div');
  band.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:1;background:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,0.35) 50%,rgba(255,255,255,0) 70%);width:38%;';
  checker.style.position = 'relative';
  checker.appendChild(band);
  anime({
    targets: band,
    translateX: [-(checker.offsetWidth * 0.6), checker.offsetWidth],
    duration: 2600,
    delay: 1600,
    loop: true,
    easing: 'easeInOutSine'
  });
}

/* ---------- header title 3D sedikit bergoyang ---------- */
function initTiltTitle() {
  const titles = document.querySelectorAll('.panduan-title, .kenapa-title, .faq-title, .header-title, .sim-hero-title, .hasil-title, .tentang-title');
  if (!titles.length || typeof anime === 'undefined') return;
  titles.forEach(function (t) {
    anime({
      targets: t,
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 700,
      easing: 'easeOutBack'
    });
  });
}

/* ---------- footer heart berdetak ---------- */
function initHeart() {
  const heart = document.querySelector('.heart');
  if (!heart || typeof anime === 'undefined') return;
  anime({
    targets: heart,
    scale: { value: [1, 1.35, 1], duration: 600, easing: 'easeInOutSine' },
    delay: 1200,
    loop: true,
    loopDelay: 1600
  });
}

/* ============================================================
   ENHANCEMENT: mesin scroll-scrub ringan (tanpa library baru)
   ============================================================ */
const __prefersReduced = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

const __rails = [];
let __railLoop = false;

/* Bind elemen ke timeline scroll.
 * opts: { start, end } = posisi viewport (fraksi vh) saat progress 0 dan 1
 *       { lerp } = smoothing; { fn(p, el) } = handler per frame
 */
function rail(el, opts) {
  if (!el) return;
  if (__prefersReduced) {
    if (opts && typeof opts.fn === 'function') opts.fn(1, el);
    return;
  }
  opts.el = el;
  opts.cur = 0;
  __rails.push(Object.assign({ start: 1, end: -1, lerp: 0.1 }, opts));
  if (!__railLoop) {
    __railLoop = true;
    requestAnimationFrame(__railFrame);
  }
}

function __railFrame() {
  const vh = window.innerHeight || 1;
  for (let i = 0; i < __rails.length; i++) {
    const r = __rails[i];
    const rect = r.el.getBoundingClientRect();
    const total = vh * (r.start - r.end);
    const target = total === 0 ? 1 : Math.max(0, Math.min(1, (vh * r.start - rect.top) / total));
    r.cur += (target - r.cur) * r.lerp;
    if (Math.abs(r.cur - target) < 0.0015) r.cur = target;
    r.fn(r.cur, r.el);
  }
  requestAnimationFrame(__railFrame);
}

function isInView(el, margin) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  const m = (margin || 0) * vh;
  return rect.top < vh - m && rect.bottom > m;
}

/* ---------- scroll progress bar ---------- */
function initScrollProgress() {
  const fill = document.getElementById('scrollProgressFill');
  if (!fill) return;
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? window.scrollY / max : 0;
    fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

/* ---------- tombol magnetik (CSS var) ---------- */
function initMagnetic() {
  if (__prefersReduced) return;
  document.querySelectorAll('.btn-kalkulasi, .toggle-btn').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.setProperty('--mx', (dx * 0.16).toFixed(1) + 'px');
      el.style.setProperty('--my', (dy * 0.16).toFixed(1) + 'px');
    });
    el.addEventListener('mouseleave', function () {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  });
}

/* ---------- hero ikut scroll (fade + rise ala Apple) ---------- */
function initHeroScroll() {
  const hero = document.querySelector('.hero-inner, .hg-hero-inner');
  if (!hero) return;
  rail(hero, {
    start: -0.1,
    end: -0.9,
    lerp: 0.09,
    fn: function (p, el) {
      if (p >= 0.999) {
        el.style.opacity = '';
        el.style.transform = '';
        return;
      }
      el.style.opacity = (1 - 0.65 * p).toFixed(3);
      el.style.transform =
        'translateY(' + (-60 * p).toFixed(1) + 'px) scale(' + (1 - 0.07 * p).toFixed(3) + ')';
    }
  });
}

/* ---------- judul reveal pakai clip-path (data-mask) ---------- */
function initMaskReveal() {
  if (__prefersReduced) {
    document.querySelectorAll('[data-mask]').forEach(function (el) {
      el.style.clipPath = '';
      el.style.opacity = '1';
    });
    return;
  }
  document.querySelectorAll('[data-mask]').forEach(function (el) {
    // kalau sudah terlihat saat load, jangan dikunci setengah terpotong
    if (isInView(el, 0.4)) {
      el.style.clipPath = '';
      el.style.opacity = '1';
      return;
    }
    rail(el, {
      start: 1.0,
      end: 0.45,
      lerp: 0.12,
      fn: function (p, e) {
        if (p >= 0.999) {
          e.style.clipPath = '';
          e.style.opacity = '1';
          return;
        }
        e.style.clipPath = 'inset(0 0 ' + Math.round((1 - p) * 100) + '% 0)';
        e.style.opacity = String(0.15 + 0.85 * p);
      }
    });
  });
}

/* ---------- timeline: garis menumbuh + kartu reveal + paralaks ---------- */
function initTimelineScroll() {
  const wrap = document.getElementById('timeline-start');
  if (!wrap) return;

  const line = wrap.querySelector('.timeline-line');
  if (line) {
    line.style.transformOrigin = 'top center';
    rail(line, {
      start: 1.0,
      end: -1.0,
      lerp: 0.08,
      fn: function (p, el) {
        if (p >= 0.999) {
          el.style.transform = 'translateX(-50%)';
          return;
        }
        el.style.transform = 'scaleY(' + p.toFixed(3) + ') translateX(-50%)';
      }
    });
  }

  wrap.querySelectorAll('.tl-item').forEach(function (item, i) {
    const card = item.querySelector('.tl-card');
    const dir = item.classList.contains('tl-left') ? -1 : 1;
    if (card) {
      rail(card, {
        start: 0.98,
        end: 0.52,
        lerp: 0.09,
        fn: function (p, el) {
          if (p >= 0.999) {
            el.style.opacity = '';
            el.style.transform = '';
            el.style.filter = '';
            return;
          }
          el.style.opacity = p.toFixed(3);
          el.style.transform =
            'translateX(' + (dir * 130 * (1 - p)).toFixed(1) + 'px) scale(' + (0.86 + 0.14 * p).toFixed(3) + ')';
          el.style.filter = 'blur(' + (14 * (1 - p)).toFixed(1) + 'px)';
        }
      });
    }
    const speed = 0.6 + ((i * 37) % 3) * 0.4;
    rail(item, {
      start: 1.0,
      end: -0.6,
      lerp: 0.07,
      fn: function (p, el) {
        const y = (1 - 2 * p) * 60 * speed;
        el.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      }
    });
  });
}

/* ---------- timeline: kartu di tengah layar jadi "aktif" ---------- */
function initTimelineActive() {
  const items = Array.prototype.slice.call(document.querySelectorAll('.tl-item'));
  if (!items.length || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        items.forEach(function (it) { it.classList.remove('tl-active'); });
        en.target.classList.add('tl-active');
      });
    },
    { rootMargin: '-42% 0px -42% 0px', threshold: 0 }
  );
  items.forEach(function (it) { io.observe(it); });
}

/* ---------- kenapa: judul fade ambles + kartu reveal ---------- */
function initKenapaScroll() {
  const title = document.querySelector('.kenapa-title');
  if (title) {
    rail(title, {
      start: 0.98,
      end: -0.9,
      lerp: 0.08,
      fn: function (p, el) {
        if (p >= 0.999) {
          el.style.opacity = '';
          return;
        }
        el.style.opacity = (1 - 0.5 * p).toFixed(3);
      }
    });
  }
  document.querySelectorAll('.kenapa-grid .alert-card').forEach(function (card, i) {
    const d = 0.08 * i;
    rail(card, {
      start: 1.02 + d,
      end: 0.55 + d,
      lerp: 0.1,
      fn: function (p, el) {
        if (p >= 0.999) {
          el.style.opacity = '';
          el.style.transform = '';
          return;
        }
        el.style.opacity = p.toFixed(3);
        el.style.transform =
          'translateY(' + (60 * (1 - p)).toFixed(1) + 'px) scale(' + (0.9 + 0.1 * p).toFixed(3) + ')';
      }
    });
  });
}

/* ---------- elemen naik (data-rise) ---------- */
function initRise() {
  document.querySelectorAll('[data-rise]').forEach(function (el) {
    rail(el, {
      start: 1.02,
      end: 0.6,
      lerp: 0.1,
      fn: function (p, e) {
        if (p >= 0.999) {
          e.style.opacity = '';
          e.style.transform = '';
          return;
        }
        e.style.opacity = p.toFixed(3);
        e.style.transform = 'translateY(' + (46 * (1 - p)).toFixed(1) + 'px)';
      }
    });
  });
}

/* ---------- count-up (.count-up, nilai di dataset.count) ---------- */
function fmtCount(el, n) {
  return (
    (el.dataset.prefix || '') +
    Math.round(n).toLocaleString('id-ID') +
    (el.dataset.suffix || '')
  );
}

function countUp(el, target) {
  if (!el || typeof anime === 'undefined') {
    if (el) el.textContent = fmtCount(el, target);
    return;
  }
  const from = { v: 0 };
  anime({
    targets: from,
    v: target,
    duration: 1000,
    easing: 'easeOutExpo',
    update: function () {
      el.textContent = fmtCount(el, from.v);
    }
  });
}

let __countEls = [];
let __countAttached = false;

function initCountUp() {
  if (__countAttached) return;
  __countAttached = true;
  __countEls = Array.prototype.slice.call(document.querySelectorAll('.count-up'));
  __countEls.forEach(countSync);
  window.addEventListener('scroll', onCountScroll, { passive: true });
}

function onCountScroll() {
  __countEls.forEach(countSync);
}

function countSync(el) {
  const raw = el.dataset.count;
  if (raw === undefined || raw === '') return;
  const t = parseFloat(raw);
  if (isNaN(t)) return;
  if (!isInView(el, 0.25)) {
    el._shown = false;
    el.textContent = fmtCount(el, t);
    return;
  }
  if (el._shown && el._last === t) return;
  el._last = t;
  el._shown = true;
  countUp(el, t);
}

window.karsaSyncCountUp = function () {
  initCountUp();
  __countEls.forEach(countSync);
};

/* ---------- fallback AOS gagal load ---------- */
function initAosFallback() {
  if (window.AOS) return;
  setTimeout(function () {
    document.querySelectorAll('[data-aos]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('aos-animate');
    });
  }, 500);
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', function () {
  initAosFallback();
  animHalaman();
  initHeroBgFloats();
  initParallax();
  initHoverGlow();
  initNavUnderline();
  initFaqAnim();
  initDotPulse();
  initChecker();
  initTiltTitle();
  initHeart();
  initScrollProgress();
  initMagnetic();
  initHeroScroll();
  initMaskReveal();
  initTimelineScroll();
  initTimelineActive();
  initKenapaScroll();
  initRise();
  initCountUp();
});