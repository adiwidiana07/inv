/* Karsa - Dark mode (global)
 * Lokasi: assets/js/theme.js
 * Muat script ini di <head> (tanpa defer) supaya tema terpasang sebelum
 * halaman pertama digambar -> tidak ada kedipan warna.
 * Pilihan user disimpan di localStorage "karsa_theme" ("light"/"dark").
 * Kalau belum ada pilihan, ikut prefers-color-scheme sistem.
 * Halaman listen ke event "karsa:themechange" untuk gambar ulang canvas.
 */
(function () {
  'use strict';

  var KEY = 'karsa_theme';
  var root = document.documentElement;
  var media = window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : { matches: false, addEventListener: null };

  function stored() {
    try {
      var v = localStorage.getItem(KEY);
      return v === 'light' || v === 'dark' ? v : null;
    } catch (e) {
      return null;
    }
  }

  function preferred() {
    return stored() || (media.matches ? 'dark' : 'light');
  }

  function paint(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    var token = window
      .getComputedStyle(root)
      .getPropertyValue('--theme-color')
      .trim();
    meta.setAttribute('content', token || '#FDFCFA');
  }

  function emit(theme) {
    document.dispatchEvent(
      new CustomEvent('karsa:themechange', { detail: { theme: theme } })
    );
  }

  function apply(theme) {
    paint(theme);
    emit(theme);
  }

  apply(preferred());

  if (media.addEventListener) {
    media.addEventListener('change', function () {
      if (!stored()) apply(preferred());
    });
  }

  function buildToggle() {
    var nav = document.querySelector('.hg-nav-inner');
    if (!nav || nav.querySelector('.hg-theme-toggle')) return;

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

    function sync() {
      isDark = root.getAttribute('data-theme') === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute(
        'aria-label',
        isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'
      );
    }

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
