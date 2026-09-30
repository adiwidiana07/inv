/* Karsa - seluruh interaksi situs dalam satu file
 *
 * BAGIAN 1 berjalan sebelum halaman digambar, jadi tema dan posisi scroll
 * sudah beres saat mata pembaca membuka situs.
 *
 * BAGIAN 2 menunggu elemen siap, lalu menghidupkan fitur halaman per halaman.
 * Modul yang tidak relevan dilewati sendiri lewat penjaga di dalamnya.
 *
 * Daftar isi:
 *   01 Posisi scroll saat kembali
 *   02 Tema terang dan gelap
 *   03 Kunjungan pertama
 *   04 Ikon SVG navbar
 *   05 Sesi login dan tombol keluar
 *   06 Animasi saat halaman dibuka dan digulir
 *   07 Tombol kembali ke atas
 *   08 Akordeon kartu rumus metodologi
 *   09 Kalkulator Coba Cepat di beranda
 *   10 Navigasi, FAQ, dan kalkulasi beranda
 *   11 Angka statistik dan tautan antar-bagian di beranda
 *   12 Panduan langkah simulasi
 *   13 Formulir simulasi tiga langkah
 *   14 Rekap hasil, what-if, dan grafik
 *   15 Riwayat, persona tersimpan, dan pengaturan akun
 *   16 Tampilan slider what-if di halaman hasil
 */
(function () {
  'use strict';

/* ----------------------------------------------------------------
   BAGIAN 1 - SEBELUM HALAMAN DIGAMBAR
   Bagian ini jalan duluan: tema dan posisi scroll sudah beres
   sebelum mata pembaca melihat halaman.
   ---------------------------------------------------------------- */

/* 01. POSISI SCROLL SAAT KEMBALI
   Fungsi:|refresh| tidak membuat halaman lompat ke atas.
   Posisi scroll disimpan per halaman, lalu dikembalikan. */

(function () {
  'use strict';

  // Penjaga: kalau script ini somehow dimuat dua kali, jalan sekali saja.
  if (window.__karsaScrollRestore) return;
  window.__karsaScrollRestore = true;

  var root = document.documentElement;
  // Kunci per halaman: daftar "/hasil.html" dan "/index.html" saling terpisah.
  var KEY = 'karsa_scroll:' + location.pathname + location.search;

  // Matikan scroll restore bawaan browser, kita yang atur sendiri.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  // Baca posisi scroll yang tersimpan. 0 = belum pernah digulir.
  function read() {
    try {
      var v = parseFloat(sessionStorage.getItem(KEY) || '0');
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      return 0; // storage diblokir: anggap posisi 0, halaman mulai dari atas
    }
  }

  // Simpan posisi scroll sekarang (dibulatkan biar hemat storage).
  function write(y) {
    try {
      sessionStorage.setItem(KEY, String(Math.round(y)));
    } catch (e) {}
  }

  // Buang posisi tersimpan, mis. user membuka halaman lewat #hash.
  function drop() {
    try {
      sessionStorage.removeItem(KEY);
    } catch (e) {}
  }

  var target = 0;
  if (location.hash) {
    // Punya anchor: biarkan browser yang menggulir ke anchor itu sendiri.
    drop();
  } else {
    target = read();
  }

  // locked = masih boleh memaksa posisi scroll (user belum berinteraksi).
  var locked = target <= 0;
  var ticking = false;
  var settleTimer = 0;
  var settleEnd = 0;
  var ro = null;

  // Tulis posisi scroll ke storage.
  function persist() {
    write(window.pageYOffset);
  }

  // Berhenti memaksa scroll: lepas timer, observer, dan kelas pengunci.
  function stop() {
    window.clearInterval(settleTimer);
    settleTimer = 0;
    if (ro) {
      ro.disconnect();
      ro = null;
    }
    root.classList.remove('karsa-restoring');
  }

  var api = {
    release: function () {
      if (locked) return;
      locked = true;
      stop();
      persist();
    },
    save: function () {
      if (!locked) persist();
    }
  };
  window.karsaScroll = api;

  // Simpan posisi saat leaving / tab disembunyikan, supaya tidak kehilangan
  // scroll saat user menekan back.
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') persist();
  });

  // Tidak ada posisi tersimpan: tidak perlu ada proses pemulihan sama sekali.
  if (locked) return;

  // Kelas ini dipakai style.css untuk menyembunyikan scrollbar while restoring.
  root.classList.add('karsa-restoring');

  // Batas bawah scroll halaman (kalau halaman lebih pendek, hasilnya 0).
  function maxScroll() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  // Geser halaman ke posisi target, selama belum ada interaksi user.
  function apply() {
    if (locked) return;
    var max = maxScroll();
    if (max <= 0) return;
    var y = Math.min(target, max);
    if (Math.abs(window.pageYOffset - y) < 1) return; // sudah di tempat, tak perlu geser
    window.scrollTo(0, y);
  }

  // Konten sering memuat menyusul (gambar, font) sehingga tinggi halaman
  // berubah. Ulangi apply() tiap 150ms sampai 2,5 detik, lalu berhenti.
  function settle() {
    if (locked) return;
    window.clearInterval(settleTimer);
    settleEnd = Date.now() + 2500;
    settleTimer = window.setInterval(function () {
      apply();
      if (Date.now() > settleEnd) stop();
    }, 150);
  }

  // Kalau tinggi halaman berubah saat dipulihkan, jalankan lagi apply + settle.
  function watchLayout() {
    if (locked || !window.ResizeObserver) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(function () {
      if (locked) return;
      apply();
      settle();
    });
    ro.observe(document.body || root);
  }

  // Simpan posisi saat user sedang menggulir, dibatasi 1x per frame.
  function onScroll() {
    if (locked || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      persist();
    });
  }

  // Gestur user = tanda "user pegang kendali", lepas kunci scroll.
  ['wheel', 'touchstart', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, api.release, { passive: true, capture: true });
  });
  window.addEventListener('keydown', function (e) {
    if (/^(Arrow|Page|Home|End|Space)/.test(e.key)) api.release();
  });
  window.addEventListener('scroll', onScroll, { passive: true });

  function boot() {
    apply();
    settle();
    watchLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  window.addEventListener('load', boot);
})();

/* 02. TEMA TERANG DAN GELAP
   Fungsi: pasang tema sebelum halaman digambar, lalu sediakan tombol
   tema di dalam navbar. */

(function () {
  'use strict';

  var KEY = 'karsa_theme';
  var root = document.documentElement;
  // Deteksi setting sistem operasi user sebagai tema awal.
  var media = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : { matches: false, addEventListener: null };

  // Ambil tema pilihan user. null = belum pernah memilih / storage mati.
  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  // Tema yang dipakai: pilihan user dulu, kalau tidak ada ikut setting sistem.
  function preferred() {
    return stored() || (media.matches ? 'dark' : 'light');
  }

  // Terapkan tema ke <html> dan ikutkan warna address bar browser.
  function paint(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    // Ambil warna dari CSS lewat variabel --theme-color, biar satu sumber.
    var token = window
      .getComputedStyle(root)
      .getPropertyValue('--theme-color')
      .trim();
    meta.setAttribute('content', token || '#FDFCFA');
  }

  // Beri tahu modul lain bahwa tema berubah (grafik canvas ikut menyesuaikan).
  function emit(theme) {
    document.dispatchEvent(
      new CustomEvent('karsa:themechange', { detail: { theme: theme } })
    );
  }

  // Pasang tema sekaligus siarkan perubahannya.
  function apply(theme) {
    paint(theme);
    emit(theme);
  }

  // Pasang tema awal sekarang juga, supaya tidak ada kilat terang di dark mode.
  apply(preferred());

  // Ikuti perubahan setting sistem, tapi hanya kalau user belum memilih sendiri.
  if (media.addEventListener) {
    media.addEventListener('change', function () {
      if (!stored()) apply(preferred());
    });
  }

  // Buat tombol tema (matahari/bulan) dan suntik ke dalam navbar.
  function buildToggle() {
    var nav = document.querySelector('.hg-nav-inner');
    if (!nav || nav.querySelector('.hg-theme-toggle')) return; // navbar tidak ada / sudah ada tombolnya

    var isDark = root.getAttribute('data-theme') === 'dark';
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'hg-theme-toggle';
    button.innerHTML =
      '<svg class="ico-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2' +
      'M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"/></svg>' +
      '<svg class="ico-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M20.4 14.6A8.6 8.6 0 1 1 9.4 3.6a6.9 6.9 0 0 0 11 11z"/></svg>';

    // Selaraskan ikon + label tombol dengan tema yang sedang aktif.
    function sync() {
      isDark = root.getAttribute('data-theme') === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute(
        'aria-label',
        isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
      );
    }

    // Klik = balik tema, simpan ke storage, lalu terapkan.
    button.addEventListener('click', function () {
      var next = isDark ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {
        /* mode privat: tema tetap berubah, cuma tidak diingat */
      }
      apply(next);
      sync();
    });

    sync();
    nav.appendChild(button);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToggle);
  } else {
    buildToggle();
  }
})();

/* 03. KUNJUNGAN PERTAMA
   Fungsi: tandai kunjungan pertama supaya CSS bisa memutar
   animasi pembuka hanya sekali per browser. */

(function () {
  'use strict';

  var KEY = 'karsa_welcome_v1';

  // Sudah pernah datang di browser ini?
  function sudahDilihat() {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch (e) {
      return false; /* storage tidak bisa dibaca */
    }
  }

  // Tandai sudah datang, supaya kunjungan berikutnya tidak diulang.
  function tandaiDilihat() {
    try {
      localStorage.setItem(KEY, '1');
    } catch (e) {
      /* abaikan: animasi tetap jalan, hanya tidak diingat */
    }
  }

  // Pernah datang: tidak ada yang perlu dilakukan.
  if (sudahDilihat()) return;

  /* Reduced motion: jangan pakai animasi sama sekali. Key tetap dicatat
     supaya pengecekan ini tidak terulang setiap load. */
  var reduceMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion) {
    tandaiDilihat();
    return;
  }

  document.documentElement.className += ' karsa-first';
  tandaiDilihat();
})();

/* ----------------------------------------------------------------
   BAGIAN 2 - SETELAH ELEMEN SIAP
   ---------------------------------------------------------------- */

  function onDom(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onDom(function () {
    /* 04. IKON SVG NAVBAR */
    /* Fungsi: ganti <span class="iconify"> di navbar dengan SVG geometris
       sendiri, supayauris dan sudut siku, bukan membulat. */
(function () {
  'use strict';

  var ICONS = {
    calculator: '<rect x="5" y="3" width="14" height="18"/><rect x="8.5" y="6.5" width="7" height="3"/><path d="M8.5 14h.01M12 14h.01M15.5 14h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01"/>',
    'chart-bar': '<path d="M4 4v16h16"/><rect x="8" y="12" width="3" height="5"/><rect x="12.5" y="9" width="3" height="8"/><rect x="17" y="6" width="3" height="11"/>',
    bolt: '<polygon points="13,2 5.5,13.5 11,13.5 10,22 18.5,9.5 13,9.5"/>',
    user: '<rect x="8.5" y="4" width="7" height="7"/><path d="M4 20l1.5-4L12 13l6.5 3L20 20"/>',






    'piggy-bank': '<rect x="3" y="10" width="14" height="7"/><rect x="17" y="12" width="4" height="3"/><path d="M7 17v3M13 17v3M10.5 10V8"/><rect x="9" y="4" width="3" height="3"/>',

    scale: '<path d="M12 4v16M8 20h8M5 7h14"/><polygon points="5,7 2.5,13 7.5,13"/><polygon points="19,7 16.5,13 21.5,13"/>',
    school: '<polygon points="12,3 21,10 3,10"/><rect x="6" y="10" width="12" height="11"/><rect x="11" y="15" width="2" height="6"/>',
    'switch-horizontal': '<path d="M4 8h13M14 5l3 3-3 3M20 16H7M10 13l-3 3 3 3"/>',

    home: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/>',

    'shopping-bag': '<path d="M6 8h12l-1 12H7z"/><path d="M9.5 10V6.5h5V10"/>',
    select: '<rect x="4" y="4" width="16" height="16"/><path d="M9 12l3 3 3-3"/>',
    'chart-line': '<path d="M4 4v16h16"/><path d="M7.5 14.5l3.5-3.5 2.5 2.5 5-6"/>',
    adjustments: '<path d="M7 4v16M17 4v16"/><rect x="5" y="9" width="4" height="4" fill="currentColor" stroke="none"/><rect x="15" y="13" width="4" height="4" fill="currentColor" stroke="none"/>'
  };

  function render() {
    document.querySelectorAll('span.iconify[data-kicon]').forEach(function (el) {
      var name = el.getAttribute('data-kicon');
      if (!name || !ICONS[name]) return;
      var w = el.getAttribute('data-width') || '24';
      var h = el.getAttribute('data-height') || '24';
      el.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '"' +
        ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"' +
        ' stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">' +
        ICONS[name] + '</svg>';
    });
  }

  render();
  window.KarsaIcons = { render: render };
})();

    /* 05. SESI LOGIN DAN TOMBOL KELUAR */
    /* Fungsi: login, signup, dan sinkronisasi navbar (tombol Masuk
       atau Dashboard) sesuai status sesi di localStorage. */
(function () {
  'use strict';

  var USERS_KEY = 'karsa_users';
  var SESSION_KEY = 'karsa_session';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveUsers(users) {
    try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); } catch (e) {}
  }
  function getSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch (e) { return null; }
  }
  function setSession(session) {
    try {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function findUser(email) {
    email = String(email || '').trim().toLowerCase();
    return getUsers().find(function (u) { return u.email === email; }) || null;
  }

  /* Navbar global: belum login -> tombol Login; sudah login -> tombol
     disembunyikan, diganti ikon user di kiri toggle tema (tanpa teks). */
  function syncNavbar() {
    var session = getSession();
    var onDash = /(dashboard\.html)$/.test(location.pathname);
    document.querySelectorAll('[data-auth-links]').forEach(function (wrap) {
      var navInner = (wrap.closest && wrap.closest('.hg-nav-inner')) || wrap.parentElement;
      var btn = navInner.querySelector('[data-auth-btn]');
      var icon = navInner.querySelector('[data-auth-icon]');
      if (session) {
        if (btn) btn.style.display = 'none';
        if (!icon) {
          icon = document.createElement('a');
          icon.href = 'dashboard.html';
          icon.className = 'hg-user-icon';
          icon.setAttribute('data-auth-icon', '');
          icon.setAttribute('aria-label', 'Buka Dashboard');
          icon.innerHTML = '<span class="iconify" data-kicon="user" data-width="26" data-height="26"></span>';
        }
        icon.classList.toggle('active', onDash);
        var toggle = navInner.querySelector('.hg-theme-toggle');
        if (toggle) navInner.insertBefore(icon, toggle);
        else navInner.appendChild(icon);
      } else {
        if (icon) icon.remove();
        if (btn) {
          btn.style.display = '';
          btn.textContent = 'Login';
          btn.setAttribute('href', 'login.html');
          btn.removeAttribute('data-action');
        }
      }
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-action="logout"]');
    if (!t) return;
    e.preventDefault();
    setSession(null);
    syncNavbar();
    if (/dashboard\.html$/.test(location.pathname)) location.href = 'index.html';
  });

  /* ---------- Login form ---------- */
  var loginForm = document.getElementById('loginForm');
  if (loginForm) {
    var emailEl = document.getElementById('loginEmail');
    var passEl = document.getElementById('loginPassword');
    var errEl = document.getElementById('loginErr');
    var peekBtn = document.getElementById('peekBtn');

    if (peekBtn && passEl) {
      peekBtn.addEventListener('click', function () {
        var show = passEl.type === 'password';
        passEl.type = show ? 'text' : 'password';
        peekBtn.textContent = show ? 'Sembunyi' : 'Lihat';
        peekBtn.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password');
      });
    }

    var forgot = document.getElementById('forgotLink');
    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        if (errEl) {
          errEl.hidden = false;
          errEl.textContent = 'Demo lokal: reset password belum tersedia. Hubungi admin.';
        }
      });
    }

    function showErr(msg) {
      if (!errEl) { alert(msg); return; }
      errEl.hidden = false;
      errEl.textContent = msg;
    }

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (errEl) errEl.hidden = true;
      var email = String(emailEl.value || '').trim().toLowerCase();
      var pass = String(passEl.value || '');

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailEl.focus();
        return showErr('Masukkan alamat Gmail yang valid.');
      }
      if (!email.endsWith('@gmail.com')) {
        emailEl.focus();
        return showErr('Gunakan alamat @gmail.com sesuai label Gmail.');
      }
      if (!pass || pass.length < 6) {
        passEl.focus();
        return showErr('Password minimal 6 karakter.');
      }
      var user = findUser(email);
      if (!user) return showErr('Akun tidak ditemukan. Silakan Daftar dulu.');
      if (user.pass !== pass) return showErr('Password salah. Coba lagi.');

      setSession({ email: user.email, name: user.name || user.email.split('@')[0], loginAt: Date.now() });
      location.href = 'dashboard.html';
    });
  }

  /* ---------- Signup form (dipakai halaman berikut) ---------- */
  var signupForm = document.getElementById('signupForm');
  if (signupForm) {
    var peek1 = document.getElementById('peekBtn1');
    var peek2 = document.getElementById('peekBtn2');
    function wirePeek(btn, input) {
      if (!btn || !input) return;
      btn.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.textContent = show ? 'Sembunyi' : 'Lihat';
      });
    }
    wirePeek(peek1, document.getElementById('suPassword'));
    wirePeek(peek2, document.getElementById('suConfirm'));
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl = document.getElementById('suName');
      var emailEl = document.getElementById('suEmail');
      var passEl = document.getElementById('suPassword');
      var confirmEl = document.getElementById('suConfirm');
      var errEl = document.getElementById('signupErr');
      function fail(msg, el) {
        if (errEl) { errEl.hidden = false; errEl.textContent = msg; }
        else alert(msg);
        if (el) el.focus();
      }
      var name = String(nameEl && nameEl.value || '').trim();
      var email = String(emailEl && emailEl.value || '').trim().toLowerCase();
      var pass = String(passEl && passEl.value || '');
      var confirm = String(confirmEl && confirmEl.value || '');
      if (!name) return fail('Masukkan nama dulu.', nameEl);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !email.endsWith('@gmail.com')) {
        return fail('Gunakan alamat @gmail.com yang valid.', emailEl);
      }
      if (!pass || pass.length < 8) return fail('Password minimal 8 karakter.', passEl);
      if (pass !== confirm) return fail('Konfirmasi password tidak sama.', confirmEl);
      if (findUser(email)) return fail('Email sudah terdaftar. Silakan Masuk.', emailEl);
      var users = getUsers();
      users.push({ name: name, email: email, pass: pass, createdAt: Date.now() });
      saveUsers(users);
      setSession({ email: email, name: name, loginAt: Date.now() });
      location.href = 'dashboard.html';
    });
  }

  window.KarsaAuth = {
    getUsers: getUsers,
    getSession: getSession,
    setSession: setSession,
    syncNavbar: syncNavbar,
    requireLogin: function () {
      if (!getSession()) { location.href = 'login.html'; return false; }
      return true;
    }
  };

  syncNavbar();
})();

    /* 06. ANIMASI SAAT HALAMAN DIBUKA DAN DIGULIR */
    /* Fungsi: semua animasi dekoratif: AOS, anime.js, parallax,
       hover kursor, count-up angka, scroll progress, dan reveal. */
(function () {
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
    /* warna bayangan diambil dari token --ink supaya ikut tema */
    var ink = (getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1a1a');
    var rest = '4px 4px 0 ' + ink;
    var lift = '7px 9px 0 ' + ink;
    el.addEventListener('mouseenter', function () {
      anime({
        targets: el,
        translateY: -3,
        boxShadow: [rest, lift],
        duration: 200,
        easing: 'easeOutQuad'
      });
    });
    el.addEventListener('mouseleave', function () {
      anime({
        targets: el,
        translateY: 0,
        boxShadow: [lift, rest],
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
  const titles = document.querySelectorAll('.kenapa-title, .faq-title, .header-title, .sim-hero-title, .hasil-title, .tentang-title');
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
})();

    /* 07. TOMBOL KEMBALI KE ATAS */
    /* Fungsi: tombol kembali ke atas di semua halaman. Tombol dibuat via JS
       supaya tidak perlu diulang di tiap HTML. */
(function () {
  'use strict';

  if (document.querySelector('.hg-to-top')) return;

  var THRESHOLD = 400;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'hg-to-top';
  button.tabIndex = -1;
  button.setAttribute('aria-label', 'Kembali ke atas halaman');
  button.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 20V4M4 12l8-8 8 8"/></svg>';
  document.body.appendChild(button);

  var shown = false;
  var ticking = false;
  var focusMoved = false;

  function sync() {
    var next = window.pageYOffset > THRESHOLD;
    if (next === shown) return;
    shown = next;
    button.classList.toggle('show', next);
    button.tabIndex = next ? 0 : -1;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      sync();
    });
  }

  function moveFocus() {
    if (focusMoved) return;
    focusMoved = true;
    var top = document.querySelector('.hg-navbar .hg-logo') || document.querySelector('h1');
    if (top && typeof top.focus === 'function') top.focus({ preventScroll: true });
  }

  button.addEventListener('click', function () {
    focusMoved = false;
    if (window.karsaScroll) window.karsaScroll.release();
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    window.addEventListener('scrollend', moveFocus, { once: true });
    window.setTimeout(moveFocus, reduced ? 0 : 800);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', sync);
  sync();
})();

    /* 08. AKORDEON KARTU RUMUS METODOLOGI */
    /* Fungsi: kartu rumus di metodologi.html bisa buka-tutup. Kartu 1
       default terbuka; klik head untuk buka/tutup + tukar ikon +/-. */
(function () {
  'use strict';

  if (!document.querySelector('.meto-card-head')) return;

  document.querySelectorAll('.meto-card-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.meto-card');
      if (!card) return;
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      var ico = btn.querySelector('.meto-card-ico');
      if (ico) ico.textContent = open ? '−' : '+';
    });
  });

})();

    /* 09. KALKULATOR COBA CEPAT DI BERANDA */
    /* Fungsi: teaser di beranda. User geser gaji, langsung lihat sisa
       uang dan badge status. Murni in-memory, tidak disimpan. */
(function () {
  'use strict';

  // Angka tebakan untuk teaser ini, bukan preset persona.
  var BIAYA = 3000000;
  var TARGET = 1000000;

  // Penjaga: bukan di halaman beranda, dilewati.
  var gajiEl = document.getElementById('cepatGaji');
  if (!gajiEl) return;
  var valEl = document.getElementById('cepatGajiVal');
  var sisaEl = document.getElementById('cepatSisa');
  var cfEl = document.getElementById('cepatCf');
  var badgeEl = document.getElementById('cepatBadge');

  // Format angka jadi rupiah, mis. 5000000 -> "Rp5.000.000".
  function fmt(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  // Terjemahkan sisa kas jadi tiga status warna.
  function status(cf) {
    if (cf < 0) return 'RISIKO';
    if (cf < 1000000) return 'WASPADA';
    return 'AMAN';
  }

  // Hitung ulang + tulis ulang semua angka kalkulator.
  function render() {
    var gaji = parseInt(gajiEl.value, 10) || 0;
    var sisa = gaji - BIAYA;  // sisa setelah biaya tetap
    var cf = sisa - TARGET;    // sisa setelah menabung target
    var st = status(cf);
    if (valEl) valEl.textContent = fmt(gaji);
    if (sisaEl) sisaEl.textContent = fmt(sisa);
    if (cfEl) cfEl.textContent = fmt(cf);
    if (badgeEl) {
      badgeEl.textContent = st;
      // Kelas badge ikut diganti supaya warnanya sesuai status.
      badgeEl.className = 'db-badge ' + (st === 'AMAN' ? 'b-aman' : st === 'WASPADA' ? 'b-waspada' : 'b-risiko');
    }
  }

  // Hitung ulang tiap slider digeser.
  gajiEl.addEventListener('input', render);
  render();
})();

    /* 10. NAVIGASI, FAQ, DAN KALKULASI BERANDA */
    /* Fungsi: navbar burger, slider simulasi beranda, form input
       beranda, dan kalkulasi kartu rekomendasi. */
(function () {
  if (document.body.classList.contains('sim-page')) return;
  if (document.body.classList.contains('hasil-page')) return;

'use strict';

/* ---------- 1. Persona (index.html) ---------- */
const personas = document.querySelectorAll('.persona');
let selectedPersona = null;

personas.forEach((p) => {
  p.addEventListener('click', () => {
    personas.forEach((x) => x.classList.remove('active'));
    p.classList.add('active');
    selectedPersona = p.dataset.persona;
    updateResult();
  });
});

/* ---------- 2. FAQ accordion ---------- */
document.querySelectorAll('.faq-item').forEach((item) => {
  const btn = item.querySelector('.faq-q');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach((i) => {
      i.classList.remove('open');
      const chev = i.querySelector('.chev');
      const answer = i.querySelector('.faq-a');
      if (chev) chev.textContent = '⌄';
      if (answer) answer.style.display = 'none';
    });
    if (!isOpen) {
      item.classList.add('open');
      const answer = item.querySelector('.faq-a');
      const chev = item.querySelector('.chev');
      if (answer) answer.style.display = 'block';
      if (chev) chev.textContent = '⌃';
    }
  });
});

/* ---------- 3. Slider simulasi (index.html) ---------- */
const slider = document.getElementById('slider');
const sliderValue = document.getElementById('sliderValue');

if (slider) {
  slider.addEventListener('input', () => {
    if (sliderValue) sliderValue.textContent = '+' + slider.value + '%';
    updateResult();
  });
}

/* ---------- 4. Live update form index ---------- */
['gaji', 'kenaikan', 'biaya', 'target', 'investasi', 'statusTinggal', 'tanggungan', 'jenisKerja'].forEach((id) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', updateResult);
  el.addEventListener('change', updateResult);
});

/* ---------- 5. Tombol Ayo Mulai ---------- */
document.getElementById('btnAyoMulai')?.addEventListener('click', (e) => {
  const btn = document.getElementById('btnAyoMulai');
  if (btn && btn.tagName === 'A') return; // biarkan href="input-data.html" bekerja
  e.preventDefault();
  window.location.href = 'input-data.html';
});

/* ---------- Helpers ---------- */
function formatRp(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function getVal(id) {
  return parseInt(document.getElementById(id)?.value || 0, 10);
}

/* ---------- 6. Kalkulasi kartu rekomendasi (index.html) ---------- */
function updateResult() {
  // Hanya jalan di halaman yang punya form index
  if (!document.getElementById('gaji') || !document.getElementById('resultText')) return;

  const gaji = getVal('gaji');
  const kenaikan = getVal('kenaikan');
  const biaya = getVal('biaya');
  const target = getVal('target');
  const investasi = getVal('investasi');
  const status = document.getElementById('statusTinggal')?.value;
  const tanggungan = document.getElementById('tanggungan')?.value;
  const sliderVal = parseInt(document.getElementById('slider')?.value || 0, 10);

  if (!gaji || !biaya) return;

  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const extra = gajiBaru - gaji;
  const cashflowBaru = gajiBaru - biaya - target;
  const breakEven = extra > 0 ? Math.ceil(investasi / extra) : 99;

  let personalNote = '';
  if (status === 'ortu') personalNote = 'Biaya hidup bisa lebih ringan karena tinggal sama ortu.';
  if (status === 'keluarga') personalNote = 'Cashflow lebih ketat karena ada tanggungan keluarga.';
  if (tanggungan && tanggungan !== '0') personalNote += ' Siapin dana darurat 3-6x biaya.';

  let rekomendasi = '';
  let warna = '';

  if (cashflowBaru < 0) {
    rekomendasi = `Cashflow kamu minus ${formatRp(cashflowBaru)}/bln. Tunda investasi gede dulu, atau cari kenaikan gaji di atas ${sliderVal}%.`;
    warna = '#d94e3c';
  } else if (breakEven > 24) {
    rekomendasi = `Balik modal ${breakEven} bulan kelamaan. Cari sertifikasi yang lebih murah, atau kejar kenaikan gaji minimal ${Math.ceil((investasi / gaji) * 100)}%. ${personalNote}`;
    warna = '#e8b84a';
  } else if (cashflowBaru >= target && breakEven <= 12) {
    rekomendasi = `LAYAK! Cashflow +${formatRp(cashflowBaru)}/bln, modal balik ${breakEven} bulan. Extra gaji +${formatRp(extra)}. ${personalNote}`;
    warna = '#2d7d5e';
  } else {
    rekomendasi = `Lumayan prospektif. Cashflow ${formatRp(cashflowBaru)}/bln, balik modal ${breakEven} bulan. Pastikan kenaikan ${kenaikan}%/tahun konsisten.`;
    warna = '#2d7d5e';
  }

  const textEl = document.getElementById('resultText');
  const statsEl = document.getElementById('resultStats');
  const dot = document.querySelector('.result-dot');

  if (dot) dot.style.background = warna;
  if (textEl) textEl.textContent = rekomendasi;
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat"><span>Gaji Baru</span><b>${formatRp(gajiBaru)}</b></div>
      <div class="stat"><span>Cashflow Baru</span><b>${formatRp(cashflowBaru)}</b></div>
      <div class="stat"><span>BEP Investasi</span><b>${breakEven} bulan</b></div>
      <div class="stat"><span>Persona</span><b>${selectedPersona ? 'Preset ' + selectedPersona : '-'}</b></div>
    `;
  }
}

/* ---------- 7. Halaman input-data.html ---------- */
let jobOpenInput = true;

function toggleDropdownInput() {
  const list = document.getElementById('dropdownList');
  const btn = document.getElementById('dropdownBtn');
  if (!list || !btn) return;
  jobOpenInput = !jobOpenInput;
  list.style.display = jobOpenInput ? 'block' : 'none';
  btn.style.borderRadius = jobOpenInput ? '10px 10px 0 0' : '10px';
}

function selectJobInput(el) {
  document.querySelectorAll('#dropdownList div').forEach((d) => d.classList.remove('active'));
  el.classList.add('active');
  const hidden = document.getElementById('jenisKerja');
  if (hidden) hidden.value = el.dataset.value;
  const btn = document.getElementById('dropdownBtn');
  if (btn) btn.innerHTML = el.textContent + ' <span>▼</span>';
}

function toggleSwitchInput(el) {
  el.classList.toggle('on');
  const isOn = el.classList.contains('on');
  if (el.id === 'switchTinggal') {
    const lbl = document.getElementById('labelTinggal');
    if (lbl) lbl.textContent = isOn ? 'Dengan Ortu / Keluarga' : 'Kos / Sendiri';
  } else if (el.id === 'switchTanggungan') {
    const lbl = document.getElementById('labelTanggungan');
    if (lbl) lbl.textContent = isOn ? 'Ada (1+ orang)' : 'Tidak ada';
  }
}

function kalkulasiInput() {
  const gaji = getVal('gaji');
  const biaya = getVal('biaya');
  const target = getVal('target');
  const investasi = getVal('investasi');
  const kenaikan = getVal('kenaikan');
  const jenis = document.getElementById('jenisKerja')?.value || 'tetap';
  const tinggal = document.getElementById('switchTinggal')?.classList.contains('on') ? 'ortu' : 'sendiri';
  const tanggungan = document.getElementById('switchTanggungan')?.classList.contains('on') ? 'ada' : 'tidak';

  if (!gaji || !biaya) {
    alert('Isi dulu Gaji Bulanan sama Biaya Hidupmu');
    return;
  }

  const cashflow = gaji - biaya - target;
  const extra = Math.round(gaji * (kenaikan / 100) / 12);
  const bep = extra > 0 ? Math.ceil(investasi / extra) : 99;

  let personal = '';
  if (tinggal === 'ortu') personal = ' Biaya hidup lebih ringan karena tinggal sama ortu.';
  if (tanggungan === 'ada') personal += ' Siapin dana darurat 3-6x biaya.';

  let rekom = '';
  if (cashflow < 0) {
    rekom = `Cashflow kamu minus Rp ${cashflow.toLocaleString('id-ID')}/bln. Tunda investasi gede dulu.${personal}`;
  } else if (bep > 24) {
    rekom = `Balik modal ${bep} bulan kelamaan. Cari sertifikasi lebih murah, atau kejar kenaikan di atas ${kenaikan}%.${personal}`;
  } else {
    rekom = `LAYAK! Cashflow Rp ${cashflow.toLocaleString('id-ID')}/bln • Extra +Rp ${extra.toLocaleString('id-ID')}/bln • Balik modal ${bep} bulan • Jenis: ${jenis}.${personal}`;
  }

  const box = document.getElementById('resultBox');
  const txt = document.getElementById('resultText');
  if (txt) txt.textContent = rekom;
  if (box) {
    box.classList.add('show');
    box.scrollIntoView({ behavior: 'smooth' });
  }

  localStorage.setItem('karsa_input', JSON.stringify({ gaji, biaya, target, investasi, kenaikan, jenis, tinggal, tanggungan }));

  // Auto redirect ke Dashboard Hasil setelah 900ms
  setTimeout(() => {
    window.location.href = 'hasil.html';
  }, 900);
}

// Expose untuk onclick inline di input-data.html / hasil.html
window.toggleDropdownInput = toggleDropdownInput;
window.selectJobInput = selectJobInput;
window.toggleSwitchInput = toggleSwitchInput;
window.kalkulasiInput = kalkulasiInput;

/* ---------- 8. Navbar active pop animation ---------- */
(function () {
  const navLinks = document.querySelectorAll('.hg-nav-link[data-nav]');
  if (!navLinks.length) return;
  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      // allow anchor navigation if hash, otherwise prevent for demo
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) e.preventDefault();
      navLinks.forEach((l) => {
        l.classList.remove('active');
        // reset animation to allow replay
        l.style.animation = 'none';
        void l.offsetWidth;
        l.style.animation = '';
      });
      link.classList.add('active');
    });
  });
})();



function toggleBurger(btn){
  const links = btn.nextElementSibling;
  if(!links) return;
  const open = links.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
}
window.toggleBurger = toggleBurger;
document.addEventListener('click', (e)=>{
  if(!e.target.closest('.hg-navbar')){
    document.querySelectorAll('.hg-nav-links.open').forEach(el=>{el.classList.remove('open'); const b=el.previousElementSibling; if(b&&b.classList.contains('hg-burger')) b.setAttribute('aria-expanded','false')});
  }
});

/* ---------- Init ---------- */
const firstJob = document.querySelector('#dropdownList div');
if (firstJob) firstJob.classList.add('active');

updateResult();
})();

    /* 11. ANGKA STATISTIK DAN TAUTAN ANTAR-BAGIAN DI BERANDA */
    /* Fungsi: angka statistik beranimasi, FAQ bisa buka-tutup, dan
       semua tautan #anchor jadi halus (smooth) + hormati scroll restore. */
(function () {

  /* ---------- 11a. Angka statistik (count-up saat elemen terlihat) ---------- */
  /* Tiga angka pengangguran di bagian 03. Nilai akhir (7,35 / 28 / 13,9)
     sudah tertulis di HTML, jadi angkanya tetap terbaca walau animasi
     tidak jalan. */
  (function () {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-fun-count]'));
    if (!els.length) return;
    // Angka ikut aturan desimal dari atribut data-dec per elemen.
    function fmt(el, v) {
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      return v.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    // Kalau user minta animasi dikurangi, biarkan angka final di HTML.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Hitung dari 0 ke nilai target pakai anime.js.
    function play(el) {
      if (typeof anime === 'undefined') return;
      var target = parseFloat(el.getAttribute('data-fun-count')) || 0;
      var o = { v: 0 };
      anime({ targets: o, v: target, duration: 1400, easing: 'easeOutExpo', update: function () { el.textContent = fmt(el, o.v); } });
    }
    // Animasi baru jalan saat elemen masuk layar, lalu diam (satu kali saja).
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { play(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      els.forEach(function (el) { io.observe(el); });
    } else {
      // Browser lama: tidak bisa menunggu elemen terlihat, langsung main.
      els.forEach(play);
    }
  })();

  /* ---------- 11b. FAQ: satu jawaban terbuka pada satu waktu ---------- */
  document.querySelectorAll('.hg-faq-item').forEach(function (item) {
    var btn = item.querySelector('.hg-faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      // Tutup semua dulu, baru buka yang diklik (kecuali yang diklik yang ini).
      document.querySelectorAll('.hg-faq-item').forEach(function (i) { i.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---------- 11c. Tautan antar-bagian jadi smooth scroll ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(a.getAttribute('href'));
      if (t) {
        e.preventDefault();
        // Lepas kunci scroll restore dulu, kalau tidak posisi halaman
        // bisa ditimpa oleh proses pemulihan scroll yang masih jalan.
        if (window.karsaScroll) window.karsaScroll.release();
        t.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
})();

    /* 12. PANDUAN LANGKAH SIMULASI */
    /* Fungsi: guided tour (overlay spotlight) di halaman simulasi.
       configuration diambil dari <script type="application/json"
       data-tour-config> di simulasi.html, jadi teks langkah mudah diubah
       dari HTML tanpa menyentuh kode ini. */
(function () {
  'use strict';

  /* ---------- 12a. Baca konfigurasi + kumpulkan elemen overlay ---------- */
  const configEl = document.querySelector('[data-tour-config]');
  if (!configEl) return;  // bukan halaman simulasi
  let config;
  try {
    config = JSON.parse(configEl.textContent);
  } catch (error) {
    return;  // JSON rusak: tenang saja, panduan tidak dimunculkan
  }
  const root = document.querySelector('[data-tour-root]');
  if (!root) return;
  const spotlight = root.querySelector('[data-tour-spotlight]'); // kotak cahaya
  const card = root.querySelector('[data-tour-card]');           // kartu teks
  const title = root.querySelector('[data-tour-title]');
  const text = root.querySelector('[data-tour-text]');
  const progress = root.querySelector('[data-tour-progress]');  // "1 / 5"
  const skip = root.querySelector('[data-tour-skip]');
  const previous = root.querySelector('[data-tour-prev]');
  const next = root.querySelector('[data-tour-next]');
  // Salah satu saja hilang = overlay tidak bisa dipakai.
  if (!spotlight || !card || !title || !text || !progress || !skip || !previous || !next) return;
  const kicker = root.querySelector('[data-tour-kicker]');
  if (kicker && config.kicker) kicker.textContent = config.kicker;
  // Buang langkah yang tidak punya target, supaya tidak error saat dipindai.
  const steps = (config.steps || []).filter((step) => step && step.target);
  if (!steps.length) return;
  const storageKey = config.key || 'karsa_tour_v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;       // indeks langkah yang sedang tampil
  let active = false;    // tour sedang terbuka?
  let returnFocus = null; // elemen yang dib focussed sebelum tour, dikembalikan setelah selesai
  let settleTimer = 0;

  /* ---------- 12b. Helpers kecil ---------- */
  // Sudah pernah lewat panduan ini di browser ini?
  function isSeen() {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch (error) {
      return false;
    }
  }
  // Tandai sudah lewat supaya tidak muncul lagi.
  function markSeen() {
    try {
      localStorage.setItem(storageKey, '1');
    } catch (error) {
      return;
    }
  }
  // Batasi nilai di antara min dan max.
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
  // Elemen yang disorot pada langkah sekarang.
  function getTarget() {
    return document.querySelector(steps[current].target);
  }

  /* ---------- 12c. Letakkan kartu teks di sekitar elemen yang disorot ---------- */
  // Di layar kecil, kartu menempel penuh di bawah (ikut aturan atas/bawah).
  function placeCard(rect) {
    if (window.innerWidth <= 680) {
      card.style.top = '';
      card.style.right = '1rem';
      card.style.bottom = '1rem';
      card.style.left = '1rem';
      card.style.width = '';
      card.dataset.placement = 'bottom';
      return;
    }
    // Layar besar: pilih sisi yang paling longgar.
    const cardRect = card.getBoundingClientRect();
    const gap = 16;
    const topSpace = rect.top;
    const bottomSpace = window.innerHeight - rect.bottom;
    const leftSpace = rect.left;
    const rightSpace = window.innerWidth - rect.right;
    let placement = 'bottom';
    if (topSpace > cardRect.height + gap + 16) placement = 'top';
    else if (bottomSpace > cardRect.height + gap + 16) placement = 'bottom';
    else if (rightSpace > cardRect.width + gap + 16) placement = 'right';
    else placement = 'left';
    // Default: kartu di bawah target, sejajar tengah secara horizontal.
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - cardRect.width / 2;
    if (placement === 'top') top = rect.top - cardRect.height - gap;
    if (placement === 'right') {
      top = rect.top + rect.height / 2 - cardRect.height / 2;
      left = rect.right + gap;
    }
    if (placement === 'left') {
      top = rect.top + rect.height / 2 - cardRect.height / 2;
      left = rect.left - cardRect.width - gap;
    }
    card.dataset.placement = placement;
    card.style.right = '';
    card.style.bottom = '';
    card.style.width = '';
    // Clamp supaya kartu tidak keluar layar.
    card.style.top = `${clamp(top, 16, Math.max(16, window.innerHeight - cardRect.height - 16))}px`;
    card.style.left = `${clamp(left, 16, Math.max(16, window.innerWidth - cardRect.width - 16))}px`;
  }

  // Geser spotlight + kartu mengikuti posisi target saat ini.
  function position() {
    if (!active) return;
    const target = getTarget();
    if (!target) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;  // target masih tersembunyi
    // Beri sedikit ruang di sekeliling target supaya terlihat jelas.
    const padding = 8;
    const left = Math.max(8, rect.left - padding);
    const top = Math.max(8, rect.top - padding);
    const width = Math.min(window.innerWidth - left - 8, rect.width + padding * 2);
    const height = Math.min(window.innerHeight - top - 8, rect.height + padding * 2);
    if (width <= 0 || height <= 0) return;
    spotlight.style.left = `${left}px`;
    spotlight.style.top = `${top}px`;
    spotlight.style.width = `${width}px`;
    spotlight.style.height = `${height}px`;
    spotlight.style.opacity = '1';
    placeCard(rect);
  }

  // Saat halaman masih bergeser (gambar load, buka step), posisi spotlight
  // ikut dihitung ulang sampai posisinya stabil 6 frame berturut-turut.
  function schedulePosition() {
    window.clearTimeout(settleTimer);
    let previousTop = null;
    let stableFrames = 0;
    const tick = () => {
      if (!active) return;
      const target = getTarget();
      if (!target) return;
      const rect = target.getBoundingClientRect();
      position();
      if (previousTop !== null && Math.abs(rect.top - previousTop) < 0.5) stableFrames += 1;
      else stableFrames = 0;
      previousTop = rect.top;
      if (stableFrames < 6) settleTimer = window.setTimeout(tick, 80);
    };
    settleTimer = window.setTimeout(tick, 60);
  }

  // Minta bagian 13 membuka step tertentu (kalau langkahnya butuh itu).
  function reveal(step) {
    if (step.revealStep === undefined) return;
    document.dispatchEvent(new CustomEvent('karsa:tour-reveal', { detail: step.revealStep }));
  }

  /* ---------- 12d. Pindah langkah ---------- */
  function setStep(index) {
    current = clamp(index, 0, steps.length - 1);
    const step = steps[current];
    const target = document.querySelector(step.target);
    // Target hilang (mis. pengguna ada di halaman lain): lewati atau selesai.
    if (!target) {
      if (current < steps.length - 1) setStep(current + 1);
      else finish();
      return;
    }
    reveal(step);
    title.textContent = step.title;
    text.textContent = step.text;
    progress.textContent = `${current + 1} / ${steps.length}`;
    previous.disabled = current === 0;
    // Label tombol menyesuaikan posisi: Mulai / Berikutnya / Selesai.
    next.textContent = current === steps.length - 1 ? 'Selesai' : current === 0 ? 'Mulai' : 'Berikutnya';
    root.hidden = false;
    active = true;
    // Kunci scroll halaman di belakang overlay.
    document.documentElement.classList.add('hg-tour-lock');
    const rect = target.getBoundingClientRect();
    // Lepas scroll restore supaya tidak berebut posisi dengan tour.
    if (window.karsaScroll) window.karsaScroll.release();
    // Gulung supaya target berada di tengah layar.
    const scrollTop = Math.max(0, window.scrollY + rect.top - (window.innerHeight - rect.height) / 2);
    window.scrollTo({ top: scrollTop, behavior: reducedMotion ? 'auto' : 'smooth' });
    schedulePosition();
    // Fokus ke tombol next, jadi keyboard langsung bisa lanjut.
    next.focus({ preventScroll: true });
  }

  // Tutup overlay dan kembalikan fokus ke tempat user tadi berada.
  function finish() {
    if (!active) return;
    active = false;
    window.clearTimeout(settleTimer);
    root.hidden = true;
    spotlight.style.opacity = '0';
    document.documentElement.classList.remove('hg-tour-lock');
    markSeen();
    document.dispatchEvent(new CustomEvent('karsa:tour-end'));
    if (returnFocus && document.contains(returnFocus) && typeof returnFocus.focus === 'function') {
      window.setTimeout(() => returnFocus.focus({ preventScroll: true }), 0);
    }
  }

  // Tombol next: di langkah terakhir berarti selesai.
  function nextStep() {
    if (current >= steps.length - 1) finish();
    else setStep(current + 1);
  }

  /* ---------- 12e. Tombol + keyboard ---------- */
  next.addEventListener('click', nextStep);
  previous.addEventListener('click', () => setStep(current - 1));
  skip.addEventListener('click', finish);

  // Cegah halaman di belakang overlay ikut tergulir.
  function blockScroll(event) {
    if (active) event.preventDefault();
  }
  // Cegah tombol scroll/panah.space menggeser halaman.
  function blockScrollKey(event) {
    if (!active) return;
    if (event.key === ' ' || event.key === 'Spacebar' || event.key === 'PageUp' || event.key === 'PageDown' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
    }
  }
  document.addEventListener('wheel', blockScroll, { passive: false });
  document.addEventListener('touchmove', blockScroll, { passive: false });
  document.addEventListener('keydown', (event) => {
    blockScrollKey(event);
    if (!active) return;
    // Esc = keluar, panah kiri/kanan = mundur/maju.
    if (event.key === 'Escape') {
      event.preventDefault();
      finish();
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      nextStep();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (current > 0) setStep(current - 1);
      return;
    }
    // Jebak fokus: Tab memutar di antara tombol skip/prev/next saja.
    if (event.key !== 'Tab') return;
    const focusable = [skip, previous, next].filter((element) => !element.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- 12f. Posisi spotlight mengikuti layout ---------- */
  window.addEventListener('resize', position);
  window.addEventListener('orientationchange', position);
  window.addEventListener('scroll', position, { passive: true });
  window.addEventListener('load', position);
  // Font baru dimuat = teks bergeser, hitung ulang posisi.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(position);

  /* ---------- 12g. Kapan tour dimulai ---------- */
  // Paksa buka lewat query ?tour, untuk cek cepat saat develops.
  const force = new URLSearchParams(window.location.search).has('tour');
  // Baru dilihat browser ini (dan tidak dipaksa) = tampilkan sekali.
  if (force || !isSeen()) window.setTimeout(() => {
    returnFocus = document.activeElement;
    document.dispatchEvent(new CustomEvent('karsa:tour-start'));
    setStep(0);
  }, 700);
})();

    /* 13. FORMULIR SIMULASI TIGA LANGKAH */
    /* Fungsi: wizard 3 langkah (Data Diri -> Kebutuhan -> Target).
       Data form ditulis ke sessionStorage sebagai "karsa_input",
       lalu dibaca bagian 14 (halaman hasil).
       Storage:
       - karsa_input        {gaji,biaya,target,investasi,kenaikan,usia,
                            jmlTanggungan,kota,cicilan,danaDarurat,
                            jenis,tinggal,persona}
       - karsa_persona      slug persona yang dipilih
       - karsa_persona_label label persona custom
       - karsa_prefill      data sementara dari Beranda, dipakai sekali lalu dihapus */
(function () {
  if (!document.body.classList.contains('sim-page')) return; // bukan halaman simulasi

'use strict';

let currentStep = 1; // step yang sedang tampil
const personaCards = document.querySelectorAll('.persona-card');
const personaHint = document.getElementById('personaHint');

/* Preset persona: mengisi form sekaligus jadi sumber angka untuk simulasi. */
const personaPreset = {
  fresh: { label: 'Si Fresh Graduate', gaji: 4500000, biaya: 2800000, target: 1000000, investasi: 1500000, kenaikan: 15, usia: 23, jmlTanggungan: 0, kota: 'Jakarta', cicilan: 0, danaDarurat: 2000000, tinggal: false, jenis: 'tetap' },
  pindah: { label: 'Si Mau Pindah Karier', gaji: 9000000, biaya: 5500000, target: 2000000, investasi: 8000000, kenaikan: 25, usia: 29, jmlTanggungan: 1, kota: 'Bandung', cicilan: 1500000, danaDarurat: 30000000, tinggal: false, jenis: 'tetap' },
  banding: { label: 'Si Bandingin Tawaran', gaji: 14000000, biaya: 8500000, target: 3000000, investasi: 3000000, kenaikan: 20, usia: 32, jmlTanggungan: 2, kota: 'Surabaya', cicilan: 3000000, danaDarurat: 60000000, tinggal: false, jenis: 'kontrak' }
};
let selectedPersona = sessionStorage.getItem('karsa_persona') || null;

/* ---------- 13a. Helper isi form ---------- */
// Isi field rupiah dengan format "Rp 4.500.000".
function setRp(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}
// Isi field angka biasa (tanpa format).
function setNum(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = String(val);
}
// Tandai tombol segmented "sendiri / keluarga" yang aktif.
function setTinggal(v) {
  document.querySelectorAll('.sim-seg-btn').forEach(function (b) {
    var on = b.dataset.tinggal === v;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', String(on));
  });
}
// Dipakai inline onclick dari HTML.
function pickTinggal(btn) {
  if (btn) setTinggal(btn.dataset.tinggal);
}
window.pickTinggal = pickTinggal;

// Terapkan satu persona: isi semua field dari preset.
function applyPersona(key) {
  const p = personaPreset[key];
  if (!p) return;
  setRp('gaji', p.gaji);
  setRp('biaya', p.biaya);
  setRp('target', p.target);
  setRp('investasi', p.investasi);
  setNum('kenaikan', p.kenaikan + '%');
  setNum('usia', p.usia);
  setNum('jmlTanggungan', p.jmlTanggungan);
  const kota = document.getElementById('kota');
  if (kota) kota.value = p.kota;
  setRp('cicilan', p.cicilan);
  setRp('danaDarurat', p.danaDarurat);
  setTinggal(p.tinggal ? 'keluarga' : 'sendiri');
  const opt = document.querySelector('#jobList div[data-value="' + p.jenis + '"]');
  if (opt) pickJob(opt);
  if (personaHint) {
    personaHint.textContent = 'Form udah keisi contoh data ' + p.label + '.';
    personaHint.hidden = false;
  }
}
personaCards.forEach(c => {
  // Tandai persona yang tersimpan sebagai aktif saat halaman dibuka.
  if (c.dataset.persona === selectedPersona) {
    c.classList.add('active');
    c.setAttribute('aria-pressed', 'true');
  }
  c.addEventListener('click', () => {
    // Klik persona yang sama lagi = batal pilih, form dikosongkan.
    if (c.dataset.persona === selectedPersona && c.classList.contains('active')) {
      personaCards.forEach(x => {
        x.classList.remove('active');
        x.setAttribute('aria-pressed', 'false');
      });
      selectedPersona = null;
      clearForm();
      if (personaHint) {
        personaHint.textContent = 'Oke, isi manual dari nol di langkah berikutnya.';
        personaHint.hidden = false;
      }
      return;
    }
    // Pilih persona baru: nonaktifkan yang lain, lalu isi form.
    personaCards.forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-pressed', 'false');
    });
    c.classList.add('active');
    c.setAttribute('aria-pressed', 'true');
    selectedPersona = c.dataset.persona;
    sessionStorage.setItem('karsa_persona', selectedPersona);
    applyPersona(selectedPersona);
    saveWajib();
  });
});

/* ---------- 13b. Pindah step ---------- */
// Kosongkan semua field + hapus data persona di storage.
function clearForm() {
  ['gaji', 'biaya', 'target', 'investasi', 'cicilan', 'danaDarurat', 'kenaikan', 'usia', 'jmlTanggungan', 'kota'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  try {
    sessionStorage.removeItem('karsa_input');
    sessionStorage.removeItem('karsa_persona');
    sessionStorage.removeItem('karsa_persona_label');
  } catch (e) {}
}

// Tampilkan step n, sembunyikan yang lain, lalu gulir ke atas.
function showStep(n) {
  document.querySelectorAll('.sim-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step'+n).classList.add('active');
  currentStep = n;
  // Lepas scroll restore supaya tidak melawan posisi yang baru diatur.
  if (window.karsaScroll) window.karsaScroll.release();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Step 1 -> 2. Tanpa persona tetap boleh lanjut (dianggap isi manual).
document.getElementById('toStep2')?.addEventListener('click', () => {
  if (!selectedPersona) {
    selectedPersona = 'custom';
    try {
      sessionStorage.setItem('karsa_persona', 'custom');
      sessionStorage.setItem('karsa_persona_label', 'Isi Manual');
    } catch (e) {}
  }
  showStep(2);
});
document.getElementById('back1')?.addEventListener('click', () => showStep(1));

// Step 2 -> 3. Tiga field wajib harus terisi dulu.
document.getElementById('toStep3')?.addEventListener('click', () => {
  const gaji = document.getElementById('gaji').value.trim();
  const biaya = document.getElementById('biaya').value.trim();
  const target = document.getElementById('target').value.trim();
  if (!gaji || !biaya || !target) { alert('Isi dulu Gaji, Biaya, sama Target'); return; }
  saveWajib();
  showStep(3);
});
document.getElementById('back2')?.addEventListener('click', () => showStep(2));

/* ---------- 13c. Integrasi dengan guided tour (bagian 12) ---------- */
// Simpan step asal, biar bisa dikembalikan setelah tour selesai.
let stepBeforeTour = currentStep;
document.addEventListener('karsa:tour-start', () => { stepBeforeTour = currentStep; });
// Tour minta membuka step tertentu (1-3).
document.addEventListener('karsa:tour-reveal', (e) => {
  const n = Number(e.detail);
  if (n >= 1 && n <= 3) showStep(n);
});
// Setelah tour selesai, kembalikan user ke step diawal.
document.addEventListener('karsa:tour-end', () => {
  if (currentStep !== stepBeforeTour) showStep(stepBeforeTour);
});
/* ---------- 13d. Simpan isian form ke storage ---------- */
// Tulis semua field ke sessionStorage "karsa_input".
// Dipanggil sebelum pindah step, jadi user tidak kehilangan data kalau
// user tidak kehilangan data kalau berpindah bolak-balik antar step.
function saveWajib() {
  const data = {
    gaji: parseRupiah(document.getElementById('gaji').value),
    biaya: parseRupiah(document.getElementById('biaya').value),
    target: parseRupiah(document.getElementById('target').value),
    investasi: parseRupiah(document.getElementById('investasi').value),
    kenaikan: parseInt(document.getElementById('kenaikan').value.replace(/[^0-9]/g,'')) || 0,
    usia: parseInt(document.getElementById('usia')?.value.replace(/[^0-9]/g,'')||0),
    jmlTanggungan: parseInt(document.getElementById('jmlTanggungan')?.value.replace(/[^0-9]/g,'')||0),
    kota: document.getElementById('kota')?.value.trim() || '',
    cicilan: parseRupiah(document.getElementById('cicilan')?.value || ''),
    danaDarurat: parseRupiah(document.getElementById('danaDarurat')?.value || '')
  };
  // Gabung ke data yang sudah ada, jangan timpa field lain (jenis, tinggal).
  const prev = JSON.parse(sessionStorage.getItem('karsa_input') || '{}');
  sessionStorage.setItem('karsa_input', JSON.stringify({ ...prev, ...data }));
}

// Ubah "Rp 4.500.000" jadi angka 4500000.
function parseRupiah(s) {
  const n = parseInt(s.replace(/[^0-9]/g,''),10);
  return isNaN(n)?0:n;
}

/* ---------- 13e. Format input saat diketik ---------- */
// Field rupiah: buang non-angka, lalu format ulang tiap ketikan.
['gaji','biaya','target','investasi','cicilan','danaDarurat'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    const raw = el.value.replace(/[^0-9]/g,'');
    if (!raw) { el.value=''; return; }
    el.value = 'Rp ' + Number(raw).toLocaleString('id-ID');
  });
});
// Field angka biasa: hanya boleh digit.
['usia','jmlTanggungan'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    el.value = el.value.replace(/[^0-9]/g,'');
  });
});
// Field persen: angka + tanda "%" otomatis di belakang.
document.getElementById('kenaikan')?.addEventListener('input', e => {
  let v = e.target.value.replace(/[^0-9]/g,'');
  if (v) e.target.value = v + '%';
});

/* ---------- 13f. Dropdown custom "jenis kerja" ---------- */
// Buka/tutup daftar pilihan.
function toggleJob() {
  const list = document.getElementById('jobList');
  const btn = document.getElementById('dropdownJob');
  const open = list.classList.toggle('open');
  const arrow = btn.querySelector('.arrow');
  if(arrow) arrow.textContent = open ? '›' : '▼';
}
window.toggleJob = toggleJob;

// Pilih salah satu opsi: tandai aktif, isi input tersembunyi, tutup daftar.
function pickJob(el) {
  document.querySelectorAll('#jobList div').forEach(d=>d.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('jenisKerja').value = el.dataset.value;
  const btn = document.getElementById('dropdownJob');
  btn.childNodes[0].textContent = el.textContent + ' ';
  document.getElementById('jobList').classList.remove('open');
  const arrow = btn.querySelector('.arrow');
  if(arrow) arrow.textContent = '▼';
}
window.pickJob = pickJob;

/* ---------- 13g. Simpan riwayat + pindah ke halaman hasil ---------- */
// Tambahkan 1 baris riwayat ke localStorage "karsa_history" (maks 100).
// Dipakai bagian 15 (dashboard) untuk menampilkan daftar riwayat.
function pushHistoryRecord() {
  try {
    var sess = JSON.parse(localStorage.getItem('karsa_session') || 'null');
    if (!sess) return;                       // belum login: tidak dicatat
    var input = JSON.parse(sessionStorage.getItem('karsa_input') || '{}');
    var gaji = input.gaji || 0, biaya = input.biaya || 0, target = input.target || 0, cicilan = input.cicilan || 0;
    if (!gaji && !biaya) return;              // data kosong, jangan dicatat
    var sisa = gaji - biaya - cicilan;        // sisa setelah biaya + cicilan
    var cf = sisa - target;                   // sisa setelah menabung target
    var status = cf < 0 ? 'RISIKO' : cf < 1000000 ? 'WASPADA' : 'AMAN';
    var persona = sessionStorage.getItem('karsa_persona') || 'fresh';
    var labels = { fresh: 'Si Fresh Graduate', pindah: 'Si Mau Pindah Karier', banding: 'Si Bandingin Tawaran' };
    var label = labels[persona] || (sessionStorage.getItem('karsa_persona_label') || 'Persona Custom');
    var hist = JSON.parse(localStorage.getItem('karsa_history') || '[]');
    hist.unshift({ id: 'h' + Date.now(), email: sess.email, label: label, custom: persona === 'custom', gaji: gaji, biaya: biaya, target: target, sisa: sisa, cf: cf, status: status, investasi: input.investasi || 0, kenaikan: input.kenaikan || 0, at: Date.now() });
    localStorage.setItem('karsa_history', JSON.stringify(hist.slice(0, 100)));
  } catch (e) {}
}

// Tombol "Hitung": simpan semua, catat riwayat, lalu ke halaman hasil.
function finishSim() {
  saveWajib();
  const jenis = document.getElementById('jenisKerja').value;
  const segAktif = document.querySelector('.sim-seg-btn.active');
  const tinggal = segAktif ? segAktif.dataset.tinggal : 'sendiri';
  const persona = sessionStorage.getItem('karsa_persona') || 'fresh';
  const prev = JSON.parse(sessionStorage.getItem('karsa_input') || '{}');
  sessionStorage.setItem('karsa_input', JSON.stringify({ ...prev, jenis, tinggal, persona }));
  pushHistoryRecord();
  window.location.href = 'hasil.html';
}
window.finishSim = finishSim;

/* ---------- 13h. Isi ulang form dari storage (refresh / kembali) ---------- */
let saved = JSON.parse(sessionStorage.getItem('karsa_input') || '{}');
// Data sementara dari Beranda (?persona=) hanya dipakai sekali, lalu dihapus.
try {
  const pre = JSON.parse(sessionStorage.getItem('karsa_prefill') || 'null');
  if (pre) { saved = { ...saved, ...pre }; sessionStorage.removeItem('karsa_prefill'); }
} catch (e) {}
if (saved.gaji) document.getElementById('gaji').value = 'Rp ' + Number(saved.gaji).toLocaleString('id-ID');
if (saved.biaya) document.getElementById('biaya').value = 'Rp ' + Number(saved.biaya).toLocaleString('id-ID');
if (saved.target) document.getElementById('target').value = 'Rp ' + Number(saved.target).toLocaleString('id-ID');
if (saved.investasi) document.getElementById('investasi').value = 'Rp ' + Number(saved.investasi).toLocaleString('id-ID');
if (saved.kenaikan) document.getElementById('kenaikan').value = saved.kenaikan + '%';
if (saved.usia) document.getElementById('usia').value = String(saved.usia);
if (saved.jmlTanggungan) document.getElementById('jmlTanggungan').value = String(saved.jmlTanggungan);
if (saved.kota) document.getElementById('kota').value = saved.kota;
if (saved.cicilan) document.getElementById('cicilan').value = 'Rp ' + Number(saved.cicilan).toLocaleString('id-ID');
if (saved.danaDarurat) document.getElementById('danaDarurat').value = 'Rp ' + Number(saved.danaDarurat).toLocaleString('id-ID');
// Persona aktif tapi form masih kosong = isi dari preset.
if (selectedPersona && !saved.gaji) applyPersona(selectedPersona);

/* ---------- 13i. Deep-link dari halaman lain ---------- */
// ?persona=slug dari kartu "Untuk Siapa" di Beranda.
// Cuma preselect kartu Step 1; alur wizard tidak berubah.
(function () {
  var q = null;
  try { q = new URLSearchParams(location.search).get('persona'); } catch (e) {}
  if (q !== 'fresh' && q !== 'pindah' && q !== 'banding') return;
  selectedPersona = q;
  try { sessionStorage.setItem('karsa_persona', q); } catch (e) {}
  personaCards.forEach(function (c) {
    var on = c.dataset.persona === q;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', String(on));
  });
  var gajiEl = document.getElementById('gaji');
  if (gajiEl && !gajiEl.value) applyPersona(q);
})();
// ?step=2|3 dari tombol "Ubah Data" di halaman hasil — buka langsung di step itu.
(function () {
  var s = null;
  try { s = new URLSearchParams(location.search).get('step'); } catch (e) {}
  if (s === '2' || s === '3') showStep(Number(s));
})();

/* ---------- 13j. Navbar burger (dipakai inline onclick) ---------- */
function toggleBurger(btn){const l=btn.nextElementSibling; if(!l) return; const o=l.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o))}
window.toggleBurger=toggleBurger;
// Klik di luar navbar = tutup menu mobile + reset aria-expanded.
document.addEventListener('click', (e)=>{ if(!e.target.closest('.hg-navbar')){ document.querySelectorAll('.hg-nav-links.open').forEach(el=>{el.classList.remove('open'); const b=el.previousElementSibling; if(b&&b.classList.contains('hg-burger')) b.setAttribute('aria-expanded','false')}) }});
})();

    /* 14. REKAP HASIL, WHAT-IF, DAN GRAFIK */
    /* Fungsi: baca data dari sessionStorage "karsa_input" (ditulis bagian
       13), hitung semua angka, lalu tulis ke kartu-kartu di hasil.html.
       Slider what-if memaksa hitung ulang tiap digeser. */
(function () {
  if (!document.body.classList.contains('hasil-page')) return;

  /* Dipakai tombol di hasil.html, jadi harus menempel di window. */
  window.resetSimulasi = resetSimulasi;
  window.setSertifikasi = setSertifikasi;
  window.updateHasil = updateHasil;

'use strict';

let chartInstance = null;    // instance Chart.js, dihancurkan tiap redraw
let sertifikasiDulu = true;  // user pilih "sertifikasi dulu"?
let grafikLastArgs = null;   // argumen updateGrafik terakhir, buat redraw
let grafikLastTotals = null; // {runway, roi} akhir bulan ke-12

/* ---------- 14a. Helpers ---------- */
// Format angka jadi "Rp 4.500.000".
function fmtRp(n) {
  return 'Rp ' + Number(Math.round(n)).toLocaleString('id-ID');
}

/* Warna kanvas & slider ikut token CSS supaya ikut berubah saat tema
   light/dark diganti (lihat bagian 02 tema di file ini). */
function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

// Ambil data simulasi. null = user belum pernah isi form.
function loadFromStorage() {
  const raw = sessionStorage.getItem('karsa_input');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/* ---------- 14b. Tombol mode + reset ---------- */
// Pilih "sertifikasi dulu" atau "kerja dulu", lalu hitung ulang.
function setSertifikasi(val) {
  sertifikasiDulu = val;
  document.getElementById('btnYa').classList.toggle('active', val);
  document.getElementById('btnTidak').classList.toggle('active', !val);
  updateHasil();
}

/* UX4: reset total ke kosong (sesi login tidak ikut dihapus). */
function resetSimulasi() {
  if (!confirm('Hapus semua data simulasi dan mulai dari kosong?')) return;
  try {
    sessionStorage.removeItem('karsa_input');
    sessionStorage.removeItem('karsa_persona');
    sessionStorage.removeItem('karsa_persona_label');
    sessionStorage.removeItem('karsa_prefill');
  } catch (e) {}
  location.href = 'simulasi.html';
}

/* ---------- 14c. Dua slider gaji yang digabung ---------- */
// Dua slider (desktop + mobile) saling meniru: digeser salah satu,
// yang lain ikut, lalu hasil dihitung ulang.
function syncSliders() {
  const s1 = document.getElementById('sliderGaji');
  const s2 = document.getElementById('sliderGaji2');
  if (!s1 || !s2) return;
  s1.addEventListener('input', () => {
    s2.value = s1.value;
    updateHasil();
    styleRange(s1);
    styleRange(s2);
  });
  s2.addEventListener('input', () => {
    s1.value = s2.value;
    updateHasil();
    styleRange(s1);
    styleRange(s2);
  });
  styleRange(s1);
  styleRange(s2);
}

// Warnai slider sesuai posisinya (isian kiri = emas, kanan = netral).
function styleRange(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.background = `linear-gradient(to right, #D9A441 0%, #D9A441 ${pct}%, ${token('--cream', '#EDE6D3')} ${pct}%, ${token('--cream', '#EDE6D3')} 100%)`;
}

/* ---------- 14d. Hitung + tulis semua angka hasil ---------- */
function updateHasil() {
  // Angka default dipakai kalau datanya belum ada, biar kartu tidak kosong.
  const data = loadFromStorage();
  const gaji = data?.gaji || 5000000;
  const biaya = data?.biaya || 3000000;
  const target = data?.target || 1000000;
  const investasi = data?.investasi || 2000000;
  const kenaikan = data?.kenaikan || 8;
  const cicilan = data?.cicilan || 0;
  const danaDarurat = data?.danaDarurat || 0;
  const sliderVal = parseInt(document.getElementById('sliderGaji')?.value || 0);
  /* What-if butuh nominal sertifikasi: tanpa itu slider + opsi Ya/Tidak
     dimatikan (murni static, tanpa backend). */
  var noSertif = !(investasi > 0);
  var sliderEl = document.getElementById('sliderGaji');
  ['btnYa', 'btnTidak'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.disabled = noSertif;
  });
  if (sliderEl) {
    sliderEl.disabled = noSertif;
    var wCard = sliderEl.closest('.whatif-card');
    if (wCard) wCard.classList.toggle('is-disabled', noSertif);
  }
  var tBtn = document.getElementById('btnYa');
  if (tBtn) {
    var tCard = tBtn.closest('.whatif-card');
    if (tCard) tCard.classList.toggle('is-disabled', noSertif);
  }
  var wSub = document.querySelector('.whatif-sub');
  if (wSub) {
    if (!wSub.dataset.orig) wSub.dataset.orig = wSub.textContent;
    wSub.textContent = noSertif ? 'Isi nominal sertifikasi di Simulasi biar what-if bisa dipakai.' : wSub.dataset.orig;
  }

  const sisa = gaji - biaya - cicilan;
  // Simulasi kenaikan gaji dari slider (dalam persen).
  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const extraPerBulan = gajiBaru - gaji;
  // Break-even point: berapa bulan extra gaji menutup modal investasi.
  const bep = extraPerBulan > 0 ? Math.ceil(investasi / extraPerBulan) : 99;
  // Mode "sertifikasi dulu" menambah 3 bulan (waktu belajar + urus sertifikat).
  let bepDisplay = bep;
  if (sertifikasiDulu && extraPerBulan > 0) bepDisplay = bep + 3;

  // Tulis sisa gaji + BEP. Nilainya ditaruh di dataset.count supaya
  // bagian 06 (animasi count-up) yang mengurus pem-format-an dan animasinya.
  const elSisa = document.getElementById('valSisaGaji');
  const elBEP = document.getElementById('valBEP');
  elSisa.dataset.count = String(sisa);
  if (bepDisplay >= 99) {
    elBEP.textContent = '>24 bln';
    elBEP.dataset.count = '';
  } else {
    elBEP.dataset.count = String(bepDisplay);
  }

  // Alokasi 50/30/20 dari sisa (fallback ke gaji kalau sisa minus).
  const base = sisa > 0 ? sisa : gaji;
  document.getElementById('alokasiPrimer').dataset.count = String(Math.round(base * 0.5));
  document.getElementById('alokasiSekunder').dataset.count = String(Math.round(base * 0.3));
  document.getElementById('alokasiTersier').dataset.count = String(Math.round(base * 0.2));

  /* UX8: wawasan konteks dari Step 3 (rule sederhana, tanpa backend). */
  var elDana = document.getElementById('valDanaBulan');
  var elCicil = document.getElementById('valCicilPct');
  // Dana darurat = berapa kali lipat biaya bulanan.
  if (elDana) elDana.textContent = biaya > 0 ? (danaDarurat / biaya).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' bulan' : '- bulan';
  // Cicilan = berapa persen dari gaji.
  if (elCicil) elCicil.textContent = gaji > 0 ? (cicilan / gaji * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '-';

  // Rekomendasi + warna badge, ditulis dari aturan if/else di bawah.
  const dot = document.getElementById('rekomDot');
  const txt = document.getElementById('rekomText');
  const extraBox = document.getElementById('rekomExtra');
  // Cashflow setelah kenaikan gaji, dikurangi biaya, cicilan, dan target.
  const cashflowBaru = gajiBaru - biaya - cicilan - target;

  let rekomendasi = '';
  let warna = '#D94E3C';

  // 1) Cashflow minus = merah, saran tunda investasi besar.
  if (cashflowBaru < 0) {
    rekomendasi = `Cashflow kamu minus ${fmtRp(cashflowBaru)}/bln. Tunda investasi gede dulu, atau cari sertifikasi yang ROI-nya lebih tinggi / kenaikan di atas ${sliderVal}%.`;
    warna = '#D94E3C';
  // 2) BEP kelamaan = kuning.
  } else if (bepDisplay > 24) {
    if (extraPerBulan <= 0) {
      rekomendasi = `Belum balik modal karena extra gaji Rp0/bln. Naikkan slider gaji di atas atau pilih investasi yang lebih murah dari ${fmtRp(investasi)}.`;
    } else {
      rekomendasi = `Balik modal ${bepDisplay} bulan kelamaan buat investasi ${fmtRp(investasi)}. Extra gaji cuma ${fmtRp(extraPerBulan)}/bln. Coba cari investasi yang lebih murah, atau sertifikasi yang lebih worth it.`;
    }
    warna = '#E8B84A';
  // 3) Cashflow >= target dan BEP <= 12 bulan = hijau, strategi Layak.
  } else if (cashflowBaru >= target && bepDisplay <= 12) {
    rekomendasi = `LAYAK! Cashflow baru ${fmtRp(cashflowBaru)}/bln, modal balik dalam ${bepDisplay} bulan. Extra gaji ${fmtRp(extraPerBulan)}/bln abis ambil ${sertifikasiDulu ? 'sertifikasi dulu' : 'kerja dulu'}. Strategi ini kelihatan worth it.`;
    warna = '#2d7d5e';
  // 4) Sisanya = hijau, tapi nada lebih hati-hati.
  } else {
    rekomendasi = `Lumayan prospektif. Cashflow ${fmtRp(cashflowBaru)}/bln, balik modal ${bepDisplay} bulan. Pastikan kenaikan ${kenaikan}%/tahun konsisten, dan siapin dana darurat.`;
    warna = '#2d7d5e';
  }

  txt.textContent = rekomendasi;
  dot.style.background = warna;
  /* M5: kartu verdict = jawaban utama; ambang sama dengan badge app. */
  var vBadge = document.getElementById('verdictBadge');
  var vText = document.getElementById('verdictText');
  var vCash = document.getElementById('verdictCash');
  // Status memakai ambang yang sama dengan bagian 09 dan 13.
  var vStatus = cashflowBaru < 0 ? 'RISIKO' : cashflowBaru < 1000000 ? 'WASPADA' : 'AMAN';
  if (vBadge) {
    vBadge.textContent = vStatus;
    vBadge.className = 'db-badge dash-verdict-badge ' + (vStatus === 'AMAN' ? 'b-aman' : vStatus === 'WASPADA' ? 'b-waspada' : 'b-risiko');
  }
  if (vText) vText.textContent = vStatus === 'RISIKO' ? 'Cashflow masih minus — tunda dulu keputusan besarnya.' : vStatus === 'WASPADA' ? 'Cashflow di bawah Rp1 juta — pertimbangkan baik-baik sebelum jalan.' : 'Cashflow Rp1 juta ke atas — kondisimu relatif sehat.';
  if (vCash) vCash.textContent = fmtRp(cashflowBaru) + '/bln';
  // Ringkasan 4 angka di bawah rekomendasi.
  extraBox.innerHTML = `<div class="extra-grid"><span>Gaji baru: <b>${fmtRp(gajiBaru)}</b></span><span>Extra: <b>+${fmtRp(extraPerBulan)}/bln</b></span><span>Cashflow: <b>${fmtRp(cashflowBaru)}/bln</b></span><span>Mode: <b>${sertifikasiDulu ? 'Sertifikasi dulu' : 'Kerja dulu'}</b></span></div>`;

  // Grafik + angka runway/ROI ikut diperbarui.
  updateGrafik(gaji, biaya, cicilan, kenaikan, sliderVal);
  var elCashflow = document.getElementById('valCashflow');
  var elRunway = document.getElementById('valRunway');
  var elRoi = document.getElementById('valRoi');
  if (elCashflow) elCashflow.dataset.count = String(Math.round(cashflowBaru));
  if (grafikLastTotals) {
    if (elRunway) elRunway.dataset.count = String(Math.round(grafikLastTotals.runway));
    if (elRoi) elRoi.dataset.count = String(Math.round(grafikLastTotals.roi));
  }
  // Panggil sinkron count-up dari bagian 06 supaya angka ikut beranimasi.
  if (window.karsaSyncCountUp) window.karsaSyncCountUp();
}

/* ---------- 14e. Grafik proyeksi 12 bulan ---------- */
// Hitung runway kumulatif + ROI per bulan, lalu gambar.
// Kalau user belum isi form, angka default yang dipakai.
function updateGrafik(gaji, biaya, cicilan, kenaikan, sliderVal) {
  const canvas = document.getElementById('grafikCanvas');
  if (!canvas) return;
  grafikLastArgs = [gaji, biaya, cicilan, kenaikan, sliderVal];

  const months = 12;
  const labels = Array.from({ length: months }, (_, i) => `B${i + 1}`);
  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const investasi = JSON.parse(sessionStorage.getItem('karsa_input') || '{}').investasi || 2000000;

  const dataRunway = []; // sisa menumpuk tiap bulan (dalam juta)
  const dataRoi = [];    // untung investasi dikurangi modal (dalam juta)
  let kumulatif = 0;

  for (let i = 0; i < months; i++) {
    // Gaji naik tiap bulan sesuai kenaikan tahunan yang dibagi 12.
    const g = Math.round(gajiBaru * Math.pow(1 + kenaikan / 100 / 12, i));
    const sisa = g - biaya - cicilan;
    kumulatif += sisa;
    dataRunway.push(Math.round((kumulatif / 1000000) * 10) / 10);
    dataRoi.push(Math.round((((gajiBaru - gaji) * (i + 1) - investasi) / 1000000) * 10) / 10);
  }
  // Simpan nilai akhir (bukan juta) buat kartu angka di bawah grafik.
  grafikLastTotals = {
    runway: dataRunway[dataRunway.length - 1] * 1000000,
    roi: dataRoi[dataRoi.length - 1] * 1000000
  };
  // Ringkasan grafik untuk pembaca layar (aria-label).
  var grafikCanvas = document.getElementById('grafikCanvas');
  if (grafikCanvas) grafikCanvas.setAttribute('aria-label', 'Grafik proyeksi 12 bulan: runway kumulatif dari Rp' + Math.round(dataRunway[0] * 1000000).toLocaleString('id-ID') + ' ke Rp' + Math.round(dataRunway[dataRunway.length - 1] * 1000000).toLocaleString('id-ID') + ', ROI akhir Rp' + Math.round(dataRoi[dataRoi.length - 1] * 1000000).toLocaleString('id-ID'));

  // Coba pakai Chart.js jika tersedia
  if (typeof Chart !== 'undefined') {
    try {
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Runway Kumulatif (jt)', data: dataRunway, borderColor: '#3D6B4F', backgroundColor: 'rgba(61,107,79,0.15)', tension: 0.38, fill: true, pointRadius: 0, borderWidth: 2.8 },
            { label: 'ROI vs Investasi (jt)', data: dataRoi, borderColor: '#D9A441', backgroundColor: 'rgba(217,164,65,0.15)', tension: 0.38, fill: true, pointRadius: 0, borderWidth: 2.6, borderDash: [6, 4] },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Space Grotesk, sans-serif', size: 11 }, color: token('--ink', '#1a1a1a') } },
            y: { grid: { color: token('--gray-light', '#E2E8E0') }, ticks: { font: { family: 'Space Grotesk, sans-serif', size: 11 }, color: token('--ink', '#1a1a1a') } },
          },
        },
      });
      return;
    } catch (e) {
      console.warn('Chart.js gagal, fallback manual', e);
    }
  }

  // Fallback manual canvas 2D (tanpa CDN)
  drawGrafikManual(canvas, labels, dataRunway, dataRoi);
}

/* ---------- 14f. Grafik manual (dipakai kalau Chart.js tidak ada) ---------- */
// Gambar sendiri pakai canvas 2D: sumbu, grid, dua garis, isian, titik.
function drawGrafikManual(canvas, labels, dataA, dataB) {
  const ctx = canvas.getContext('2d');
  // Perbesar resolution mengikuti device pixel ratio supaya tidak pecah.
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  // Latar canvas ikut warna tema.
  ctx.fillStyle = token('--white', '#F6F9F6');
  ctx.fillRect(0, 0, W, H);

  // Margin area gambar.
  const padL = 44;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Skala Y dari nilai terkecil ke terbesar, plus ruang kosong 18%.
  const all = [...dataA, ...dataB];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const yPad = range * 0.18;
  const yMin = min - yPad;
  const yMax = max + yPad;

  const xAt = (i) => padL + (i / (labels.length - 1)) * plotW;
  const yAt = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  // Garis grid horizontal + label sumbu Y.
  ctx.strokeStyle = token('--gray-light', '#E2E8E0');
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = yMax - (i / 4) * (yMax - yMin);
    ctx.fillStyle = token('--gray-dark', '#555');
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1) + 'jt', padL - 6, y + 3);
  }

  // Label sumbu X (B1..B12). Di layar sempit, label dikasih spasi biar tidak bertabrakan.
  ctx.fillStyle = token('--ink', '#1a1a1a');
  ctx.font = '700 11px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  var xSkip = W < 420 ? 2 : 1;
  labels.forEach((lb, i) => { if (i % xSkip === 0) ctx.fillText(lb, xAt(i), H - 8); });

  // Gambar satu garis dari data (polyline).
  const drawLine = (data, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  // Isi area di bawah garis sampai sumbu bawah.
  const drawFill = (data, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xAt(data.length - 1), padT + plotH);
    ctx.lineTo(xAt(0), padT + plotH);
    ctx.closePath();
    ctx.fill();
  };

  // Urutan lapisan: isian dulu, lalu garis di atasnya.
  drawFill(dataA, 'rgba(61,107,79,0.14)');
  drawLine(dataA, '#3D6B4F');
  drawFill(dataB, 'rgba(217,164,65,0.14)');
  ctx.setLineDash([6, 4]);
  drawLine(dataB, '#D9A441');
  ctx.setLineDash([]);

  // Titik merah di garis ROI: tanda bulan di mana modal hampir impas.
  ctx.fillStyle = '#D94E3C';
  dataB.forEach((v, i) => {
    if (Math.abs(v) < 0.6) {
      const x = xAt(i);
      const y = yAt(v);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = token('--ink', '#1a1a1a');
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });

  // Bingkai area gambar.
  ctx.strokeStyle = token('--ink', '#1a1a1a');
  ctx.lineWidth = 1.2;
  ctx.strokeRect(padL, padT, plotW, plotH);
}

// Init halaman hasil
syncSliders();
updateHasil();

/* Grafik manual digores ulang saat viewport berubah (rotasi / resize),
   karena ukuran canvas diambil dari getBoundingClientRect saat draw. */
(function bindGrafikResize() {
  let raf = 0;
  const redraw = function () {
    if (!grafikLastArgs) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { updateGrafik.apply(null, grafikLastArgs); });
  };
  window.addEventListener('resize', redraw);
  window.addEventListener('orientationchange', redraw);
  document.addEventListener('karsa:themechange', redraw);
})();

function toggleBurger(btn){const l=btn.nextElementSibling; if(!l) return; const o=l.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o))} window.toggleBurger=toggleBurger
})();

    /* 15. RIWAYAT, PERSONA TERSIMPAN, DAN PENGATURAN AKUN */
    /* Fungsi: halaman dashboard setelah login. Menampilkan riwayat
       simulasi, persona custom, dan pengaturan akun.
       Storage:
       - karsa_history           [{id,email,label,custom,gaji,biaya,target,
                                   sisa,cf,status,investasi,kenaikan,at}]
       - karsa_custom_personas   [{email,name,gaji,biaya,target}]
       Riwayat ditulis dari bagian 13 saat simulasi dihitung. */
(function () {
  'use strict';

  if (!document.body.classList.contains('db-page')) return;

  // Penjaga: belum login -> tendang ke halaman login.
  if (!window.KarsaAuth || !KarsaAuth.requireLogin()) return;
  var session = KarsaAuth.getSession();
  var email = session.email; // semua data di bawah difilter per email ini

  var HIST_KEY = 'karsa_history';
  var PERS_KEY = 'karsa_custom_personas';

  /* ---------- 15a. Baca/tulis storage + format angka ---------- */
  // Baca array dari localStorage. Data rusak = array kosong, bukan crash.
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
  }
  // Tulis array ke localStorage.
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  // Riwayat milik user yang sedang login saja.
  function myHistory() { return load(HIST_KEY).filter(function (h) { return h.email === email; }); }
  // Persona custom milik user yang sedang login saja.
  function myPersonas() { return load(PERS_KEY).filter(function (p) { return p.email === email; }); }

  // Rupiah tanpa spasi: "Rp4.500.000".
  function fmtRp(n) { return 'Rp' + Number(Math.round(n || 0)).toLocaleString('id-ID'); }
  // Rupiah dengan tanda minus di depan kalau negatif.
  function fmtRpSigned(n) {
    var v = Math.round(n || 0);
    return (v < 0 ? '-' : '') + 'Rp' + Math.abs(v).toLocaleString('id-ID');
  }
  // Tanggal panjang: "12 Mei 2026".
  function fmtLong(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  // Tanggal pendek: "12 Mei".
  function fmtShort(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  // Escape teks sebelum masuk ke innerHTML (lindungi dari XSS).
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Cashflow -> status. Ambang sama dengan bagian 09, 13, dan 14.
  function statusOf(cf) {
    if (cf < 0) return 'RISIKO';
    if (cf < 1000000) return 'WASPADA';
    return 'AMAN';
  }
  // "Rp 4.500.000" -> 4500000. Dipakai form persona.
  function parseNum(s) {
    var n = parseInt(String(s == null ? '' : s).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  /* ---------- Modal generik ---------- */
  var modal = document.getElementById('dbModal');
  var mTitle = document.getElementById('dbModalTitle');
  var mBody = document.getElementById('dbModalBody');
  var mActions = document.getElementById('dbModalActions');
  /* Harus sama dengan durasi animasi penutup di style.css (.db-modal.is-out) */
  var MODAL_OUT_MS = 150;
  var outTimer = null;
  function openModal(title, bodyHTML, actions) {
    mTitle.textContent = title;
    mBody.innerHTML = bodyHTML;
    mActions.innerHTML = '';
    (actions || [{ label: 'Tutup' }]).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'db-btn' + (a.kind === 'red' ? ' db-btn-red' : '') + (a.kind === 'danger' ? ' db-btn-danger' : '');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        if (a.onClick) a.onClick();
        else closeModal();
      });
      mActions.appendChild(b);
    });
    if (outTimer) { clearTimeout(outTimer); outTimer = null; }
    modal.classList.remove('is-in', 'is-out');
    modal.hidden = false;
    void modal.offsetWidth; /* reflow paksa: animasi opening selalu diputar ulang */
    modal.classList.add('is-in');
    lastFocus = document.activeElement;
    var firstField = mBody.querySelector('input, select, textarea') || mActions.querySelector('button');
    if (firstField) {
      try { firstField.focus({ preventScroll: true }); }
      catch (e) { firstField.focus(); }
    }
  }
  var lastFocus = null;
  function closeModal() {
    if (modal.hidden) return;
    modal.classList.remove('is-in');
    modal.classList.add('is-out');
    /* Pakai timer, bukan animationend: tetap menutup walau animasi
       dimatikan oleh prefers-reduced-motion (animationend tidak akan fire). */
    outTimer = setTimeout(function () {
      outTimer = null;
      if (!modal.classList.contains('is-out')) return;
      modal.hidden = true;
      modal.classList.remove('is-out');
      if (lastFocus && document.contains(lastFocus) && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    }, MODAL_OUT_MS);
  }
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || modal.hidden) return;
    var els = Array.prototype.slice.call(modal.querySelectorAll('button, input, select, textarea, a[href]'))
      .filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!els.length) return;
    var first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Profil + statistik ---------- */
  function renderProfile() {
    var users = KarsaAuth.getUsers();
    var user = users.find(function (u) { return u.email === email; }) || {};
    var name = session.name || user.name || email.split('@')[0];
    document.getElementById('dbGreet').textContent = 'Halo, ' + name;
    document.getElementById('dbName').textContent = name;
    document.getElementById('dbEmail').textContent = email;
    paintPhoto();
    var joined = user.createdAt || session.loginAt || Date.now();
    document.getElementById('dbJoined').textContent = 'Bergabung ' + fmtLong(joined);
  }

  function renderStats(hist, pers) {
    document.getElementById('statTotal').textContent = String(hist.length);
    document.getElementById('statCustom').textContent = String(pers.length);
    document.getElementById('statLast').textContent = hist.length ? fmtShort(hist[0].at) : '-';
  }

  /* ---------- Riwayat ---------- */
  var selected = new Set();
  var compareBtn = document.getElementById('compareBtn');

  function badgeClass(st) {
    return st === 'AMAN' ? 'b-aman' : st === 'WASPADA' ? 'b-waspada' : 'b-risiko';
  }

  function renderHistory(hist) {
    var list = document.getElementById('historyList');
    selected.forEach(function (id) {
      if (!hist.some(function (h) { return h.id === id; })) selected.delete(id);
    });
    if (!hist.length) {
      list.innerHTML = '<p class="db-empty">Belum ada riwayat simulasi. <a href="simulasi.html">Mulai Simulasi</a> dulu biar tercatat di sini.</p>';
    } else {
      list.innerHTML = '';
      hist.forEach(function (h) {
        var row = document.createElement('div');
        row.className = 'db-row static-box';
        row.innerHTML =
          '<button type="button" class="db-check' + (selected.has(h.id) ? ' on' : '') + '" data-check="' + h.id + '" aria-pressed="' + selected.has(h.id) + '" aria-label="Pilih ' + esc(h.label) + ' untuk dibandingkan">✓</button>' +
          '<div class="db-row-main"><b>' + esc(h.label) + (h.custom ? ' (custom)' : '') + '</b><span>' + fmtLong(h.at) + '</span></div>' +
          '<div class="db-row-side"><span class="db-sisa">Sisa ' + fmtRpSigned(h.sisa) + '</span>' +
          '<span class="db-badge ' + badgeClass(h.status) + '">' + h.status + '</span></div>';
        var view = document.createElement('button');
        view.type = 'button';
        view.className = 'db-btn db-btn-sm';
        view.textContent = 'Lihat';
        view.addEventListener('click', function () { viewRecord(h); });
        row.appendChild(view);
        list.appendChild(row);
      });
    }
    syncCompareBtn(hist);
  }

  function syncCompareBtn(hist) {
    compareBtn.textContent = 'Bandingkan (' + selected.size + ')';
    compareBtn.disabled = selected.size < 2;
  }

  document.getElementById('historyList').addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-check]');
    if (!c) return;
    var id = c.getAttribute('data-check');
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    var on = selected.has(id);
    c.classList.toggle('on', on);
    c.setAttribute('aria-pressed', String(on));
    syncCompareBtn();
  });

  compareBtn.addEventListener('click', function () {
    var hist = myHistory();
    var rows = hist.filter(function (h) { return selected.has(h.id); });
    if (rows.length < 2) return;
    var cols = rows.map(function (h) {
      return '<td><b>' + esc(h.label) + '</b><br><span class="db-muted">' + fmtLong(h.at) + '</span></td>';
    }).join('');
    function numRow(label, fn) {
      return '<tr><th>' + label + '</th>' + rows.map(function (h) { return '<td>' + fn(h) + '</td>'; }).join('') + '</tr>';
    }
    openModal('Bandingkan Simulasi',
      '<div class="db-table-wrap"><table class="db-table">' +
      '<tr><th>Persona</th>' + cols + '</tr>' +
      numRow('Gaji', function (h) { return fmtRp(h.gaji); }) +
      numRow('Biaya hidup', function (h) { return fmtRp(h.biaya); }) +
      numRow('Sisa', function (h) { return fmtRpSigned(h.sisa); }) +
      '<tr><th>Status</th>' + rows.map(function (h) {
        return '<td><span class="db-badge ' + badgeClass(h.status) + '">' + h.status + '</span></td>';
      }).join('') + '</tr>' +
      '</table></div>',
      [{ label: 'Tutup' }]);
  });

  function viewRecord(h) {
    var prev = {};
    try { prev = JSON.parse(sessionStorage.getItem('karsa_input') || '{}'); } catch (e) {}
    sessionStorage.setItem('karsa_input', JSON.stringify({
      gaji: h.gaji, biaya: h.biaya, target: h.target || prev.target || 0,
      investasi: h.investasi || prev.investasi || 0, kenaikan: h.kenaikan || prev.kenaikan || 8
    }));
    location.href = 'hasil.html';
  }

  /* ---------- Persona custom ---------- */
  function renderPersonas(pers) {
    var grid = document.getElementById('personaGrid');
    grid.innerHTML = '';
    if (!pers.length) {
      var p = document.createElement('p');
      p.className = 'db-empty';
      p.textContent = 'Belum ada persona custom. Buat satu biar pengisian simulasi lebih cepat.';
      grid.appendChild(p);
      return;
    }
    pers.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'db-persona';
      card.innerHTML =
        '<b>' + esc(p.name) + '</b>' +
        '<span class="db-muted">Gaji ' + fmtRp(p.gaji) + ' · Biaya hidup ' + fmtRp(p.biaya) + ' · Tabungan ' + fmtRp(p.target) + '</span>' +
        '<div class="db-persona-actions"></div>';
      var box = card.querySelector('.db-persona-actions');
      function mk(label, cls, fn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'db-btn db-btn-sm' + (cls ? ' ' + cls : '');
        b.textContent = label;
        b.addEventListener('click', fn);
        box.appendChild(b);
      }
      mk('Pakai', 'db-btn-red', function () { usePersona(p); });
      mk('Edit', '', function () { personaModal(p); });
      mk('Hapus', '', function () {
        if (!confirm('Hapus persona "' + p.name + '"?')) return;
        save(PERS_KEY, load(PERS_KEY).filter(function (x) { return x.id !== p.id; }));
        renderAll();
      });
      grid.appendChild(card);
    });
  }

  function usePersona(p) {
    var prev = {};
    try { prev = JSON.parse(sessionStorage.getItem('karsa_input') || '{}'); } catch (e) {}
    var data = { gaji: p.gaji, biaya: p.biaya, target: p.target };
    try { sessionStorage.setItem('karsa_input', JSON.stringify(Object.assign({}, prev, data))); } catch (e) {}
    try { sessionStorage.setItem('karsa_persona', 'custom'); } catch (e) {}
    try { sessionStorage.setItem('karsa_persona_label', p.name); } catch (e) {}
    try { sessionStorage.setItem('karsa_prefill', JSON.stringify(Object.assign({ label: p.name }, data))); } catch (e) {}
    location.href = 'simulasi.html';
  }

  function personaModal(p) {
    var isEdit = !!p;
    p = p || { name: '', gaji: '', biaya: '', target: '' };
    openModal(isEdit ? 'Edit Persona' : 'Buat Persona Baru',
      '<label class="auth-field" for="pmName"><span>Nama persona</span>' +
      '<input type="text" id="pmName" value="' + esc(p.name) + '" placeholder="cth: Freelancer Desain"></label>' +
      '<label class="auth-field" for="pmGaji"><span>Gaji bulanan</span>' +
      '<input type="text" id="pmGaji" inputmode="numeric" value="' + esc(p.gaji) + '" placeholder="Rp 5.000.000"></label>' +
      '<label class="auth-field" for="pmBiaya"><span>Biaya hidup bulanan</span>' +
      '<input type="text" id="pmBiaya" inputmode="numeric" value="' + esc(p.biaya) + '" placeholder="Rp 3.000.000"></label>' +
      '<label class="auth-field" for="pmTarget"><span>Target tabungan</span>' +
      '<input type="text" id="pmTarget" inputmode="numeric" value="' + esc(p.target) + '" placeholder="Rp 1.000.000"></label>' +
      '<p class="auth-err" id="pmErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: isEdit ? 'Simpan' : 'Buat', kind: 'red', onClick: function () {
            var err = document.getElementById('pmErr');
            var name = document.getElementById('pmName').value.trim();
            var gaji = parseNum(document.getElementById('pmGaji').value);
            var biaya = parseNum(document.getElementById('pmBiaya').value);
            var target = parseNum(document.getElementById('pmTarget').value);
            function fail(m) { err.hidden = false; err.textContent = m; }
            if (!name) return fail('Isi nama persona dulu.');
            if (!gaji || !biaya) return fail('Isi gaji dan biaya hidup dulu.');
            var all = load(PERS_KEY);
            if (isEdit) {
              all = all.map(function (x) {
                return x.id === p.id ? { id: x.id, email: email, name: name, gaji: gaji, biaya: biaya, target: target } : x;
              });
  // 4) Sisanya = hijau, tapi nada lebih hati-hati.
  } else {
              all.push({ id: 'p' + Date.now(), email: email, name: name, gaji: gaji, biaya: biaya, target: target });
            }
            save(PERS_KEY, all);
            closeModal();
            renderAll();
          }
        }
      ]);
  }

  document.getElementById('addPersonaBtn').addEventListener('click', function () { personaModal(null); });

  /* ---------- Pengaturan akun ---------- */
  document.getElementById('editProfileBtn').addEventListener('click', function () {
    openModal('Edit Profil',
      '<label class="auth-field" for="epName"><span>Username</span>' +
      '<input type="text" id="epName" value="' + esc(session.name || '') + '"></label>' +
      '<div class="auth-field"><span>Foto profil</span>' +
      '<button type="button" class="db-btn db-btn-sm" id="epPhotoBtn">Ubah Foto</button>' +
      '<input type="file" id="epPhoto" accept="image/*" hidden>' +
      '<p class="auth-err" id="epPhotoErr" role="alert" hidden></p></div>' +
      '<p class="auth-err" id="epErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: 'Simpan', kind: 'red', onClick: function () {
            var v = document.getElementById('epName').value.trim();
            if (!v) {
              var err = document.getElementById('epErr');
              err.hidden = false; err.textContent = 'Username tidak boleh kosong.';
              return;
            }
            var users = KarsaAuth.getUsers().map(function (u) {
              return u.email === email ? Object.assign({}, u, { name: v }) : u;
            });
            try { localStorage.setItem('karsa_users', JSON.stringify(users)); } catch (e) {}
            session.name = v;
            KarsaAuth.setSession(session);
            closeModal();
            renderProfile();
          }
        }
      ]);
    var epPhotoBtn = document.getElementById('epPhotoBtn');
    var epPhoto = document.getElementById('epPhoto');
    var epPhotoErr = document.getElementById('epPhotoErr');
    if (epPhotoBtn && epPhoto) {
      epPhotoBtn.addEventListener('click', function () { epPhoto.click(); });
      epPhoto.addEventListener('change', function () {
        var f = epPhoto.files && epPhoto.files[0];
        savePhotoFile(f, epPhotoErr, function (ok) {
          if (ok) {
            epPhoto.value = '';
            epPhotoBtn.textContent = 'Foto tersimpan!';
          }
        });
      });
    }
  });

  document.getElementById('changePassBtn').addEventListener('click', function () {
    openModal('Ubah Password',
      '<label class="auth-field" for="cpOld"><span>Password lama</span>' +
      '<input type="password" id="cpOld" autocomplete="current-password"></label>' +
      '<label class="auth-field" for="cpNew"><span>Password baru (min. 8 karakter)</span>' +
      '<input type="password" id="cpNew" autocomplete="new-password"></label>' +
      '<label class="auth-field" for="cpConfirm"><span>Konfirmasi password baru</span>' +
      '<input type="password" id="cpConfirm" autocomplete="new-password"></label>' +
      '<p class="auth-err" id="cpErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: 'Simpan', kind: 'red', onClick: function () {
            var err = document.getElementById('cpErr');
            var oldP = document.getElementById('cpOld').value;
            var nw = document.getElementById('cpNew').value;
            var cf = document.getElementById('cpConfirm').value;
            function fail(m) { err.hidden = false; err.textContent = m; }
            var users = KarsaAuth.getUsers();
            var user = users.find(function (u) { return u.email === email; });
            if (!user || user.pass !== oldP) return fail('Password lama salah.');
            if (!nw || nw.length < 8) return fail('Password baru minimal 8 karakter.');
            if (nw !== cf) return fail('Konfirmasi password tidak sama.');
            users = users.map(function (u) {
              return u.email === email ? Object.assign({}, u, { pass: nw }) : u;
            });
            try { localStorage.setItem('karsa_users', JSON.stringify(users)); } catch (e) {}
            closeModal();
          }
        }
      ]);
  });

  document.getElementById('wipeBtn').addEventListener('click', function () {
    if (!confirm('Hapus SEMUA riwayat simulasi dan persona custom akun ini? Tindakan ini tidak bisa dibatalkan.')) return;
    save(HIST_KEY, load(HIST_KEY).filter(function (h) { return h.email !== email; }));
    save(PERS_KEY, load(PERS_KEY).filter(function (p) { return p.email !== email; }));
    try {
      sessionStorage.removeItem('karsa_input');
      sessionStorage.removeItem('karsa_persona');
      sessionStorage.removeItem('karsa_persona_label');
      sessionStorage.removeItem('karsa_prefill');
    } catch (e) {}
    selected.clear();
    renderAll();
  });

  /* ---------- Foto profil (base64 di localStorage) ---------- */
  /* ---------- Foto profil: simpan base64, pakai ulang untuk modal ---------- */
  function savePhotoFile(f, errEl, done) {
    if (errEl) errEl.hidden = true;
    if (!f) { if (done) done(false); return; }
    if (f.size > 2 * 1024 * 1024) {
      if (errEl) { errEl.hidden = false; errEl.textContent = 'Ukuran foto maksimal 2MB.'; }
      if (done) done(false);
      return;
    }
    var rd = new FileReader();
    rd.onload = function () {
      try { localStorage.setItem('karsa_profile_photo', String(rd.result || '')); } catch (e) {}
      paintPhoto();
      if (done) done(true);
    };
    rd.readAsDataURL(f);
  }
  function paintPhoto() {
    var av = document.getElementById('dbAvatar');
    if (!av) return;
    var nm = session.name || email.split('@')[0];
    var photo = null;
    try { photo = localStorage.getItem('karsa_profile_photo'); } catch (e) {}
    if (photo) {
      av.innerHTML = '';
      var img = document.createElement('img');
      img.src = photo;
      img.alt = 'Foto profil ' + nm;
      av.appendChild(img);
    } else {
      av.textContent = (nm.charAt(0) || 'A').toUpperCase();
    }
  }

  /* ---------- Kirim testimoni: simulasi UI, tidak menyimpan/menampilkan ke mana pun ---------- */
  var testiInput = document.getElementById('testiInput');
  var testiCount = document.getElementById('testiCount');
  var testiBtn = document.getElementById('testiBtn');
  var testiOk = document.getElementById('testiOk');
  function syncTestiCount() {
    if (testiCount && testiInput) testiCount.textContent = testiInput.value.length + ' / 200';
  }
  if (testiInput) {
    testiInput.addEventListener('input', function () {
      syncTestiCount();
      if (testiOk) testiOk.hidden = true;
    });
    syncTestiCount();
  }
  if (testiBtn) testiBtn.addEventListener('click', function () {
    if (!testiInput || !testiInput.value.trim()) {
      if (testiInput) testiInput.focus();
      return;
    }
    testiInput.value = '';
    syncTestiCount();
    if (testiOk) testiOk.hidden = false;
  });

  function renderAll() {
    renderProfile();
    var hist = myHistory().sort(function (a, b) { return b.at - a.at; });
    var pers = myPersonas();
    renderStats(hist, pers);
    renderHistory(hist);
    renderPersonas(pers);
  }

  window.KarsaDashboard = { renderAll: renderAll, statusOf: statusOf };
  renderAll();
})();

    /* 16. TAMPILAN SLIDER WHAT-IF DI HALAMAN HASIL */
    /* Fungsi: slider what-if di hasil.html. Cuma soal tampilan -
       nilai slider dibaca section 14 lewat window.updateHasil(). */
(function(){
  const s = document.getElementById('sliderGaji');
  const v = document.getElementById('sliderVal');
  // Ambil token warna dari CSS supaya ikut berubah saat tema diganti.
  const cssVar = (n, f) => (getComputedStyle(document.documentElement).getPropertyValue(n) || f).trim();
  /* Fill diukur dari posisi tengah thumb (26px = 1.625rem) supaya sejajar. */
  function paint() {
    if (!s) return;
    const min = parseFloat(s.min) || 0;
    const max = parseFloat(s.max) || 30;
    const val = parseFloat(s.value) || 0;
    // Posisi thumb dalam persen (0-1), dibatasi agar tidak keluar jalur.
    const p = Math.min(1, Math.max(0, (val - min) / (max - min)));
    const w = s.offsetWidth || 1;
    const tw = 26;
    const x = (p * (w - tw) + tw / 2) / w * 100;
    const ink = cssVar('--ink', '#211D1A');
    const base = cssVar('--cream', '#e8ded2');
    // Gradien: isi kiri sampai posisi thumb, kanan warna track.
    s.style.background = 'linear-gradient(to right, ' + ink + ' 0%, ' + ink + ' ' + x.toFixed(2) + '%, ' + base + ' ' + x.toFixed(2) + '%, ' + base + ' 100%)';
    if (v) v.textContent = s.value + '%';
  }
  if (s) {
    // Geser slider = gambar ulang + minta section 14 hitung ulang.
    s.addEventListener('input', () => { paint(); if (window.updateHasil) updateHasil(); });
    paint();
    // Lebar berubah = posisi thumb dalam persen ikut berubah.
    window.addEventListener('resize', paint);
  }
})();

  });
})();
