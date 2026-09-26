/* Karsa - Tombol kembali ke atas (global)
 * Lokasi: careerpath/assets/js/to-top.js
 * Muat script ini di akhir <body> supaya tombolnya ada di semua halaman.
 * Tombol dibuat via JS supaya tidak perlu diulang di tiap HTML.
 */
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
