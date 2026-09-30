/* Karsa - Auth mock (login / signup / navbar) pakai localStorage.
 * - Register: karsa_users [{name,email,pass}]
 * - Session: karsa_session {email, name, loginAt}
 * - Navbar: tombol Login -> Keluar + link Dashboard di-highlight saat login.
 */
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

  document.addEventListener('DOMContentLoaded', syncNavbar);
  syncNavbar();
})();
