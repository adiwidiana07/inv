/* Karsa - Scroll restore: cegah halaman lompat ke atas tiap refresh
 * Lokasi: careerpath/assets/js/scroll-restore.js
 * Muat script ini di <head> SEBELUM script lain supaya scrollRestoration
 * dimatikan lebih dulu dan browser tidak berebut posisi scroll.
 */
(function () {
  'use strict';

  if (window.__karsaScrollRestore) return;
  window.__karsaScrollRestore = true;

  var root = document.documentElement;
  var KEY = 'karsa_scroll:' + location.pathname + location.search;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function read() {
    try {
      var v = parseFloat(sessionStorage.getItem(KEY) || '0');
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) {
      return 0;
    }
  }

  function write(y) {
    try {
      sessionStorage.setItem(KEY, String(Math.round(y)));
    } catch (e) {}
  }

  function drop() {
    try {
      sessionStorage.removeItem(KEY);
    } catch (e) {}
  }

  var target = 0;
  if (location.hash) {
    drop();
  } else {
    target = read();
  }

  var locked = target <= 0;
  var ticking = false;
  var settleTimer = 0;
  var settleEnd = 0;
  var ro = null;

  function persist() {
    write(window.pageYOffset);
  }

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

  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') persist();
  });

  if (locked) return;

  root.classList.add('karsa-restoring');

  function maxScroll() {
    return Math.max(0, root.scrollHeight - window.innerHeight);
  }

  function apply() {
    if (locked) return;
    var max = maxScroll();
    if (max <= 0) return;
    var y = Math.min(target, max);
    if (Math.abs(window.pageYOffset - y) < 1) return;
    window.scrollTo(0, y);
  }

  function settle() {
    if (locked) return;
    window.clearInterval(settleTimer);
    settleEnd = Date.now() + 2500;
    settleTimer = window.setInterval(function () {
      apply();
      if (Date.now() > settleEnd) stop();
    }, 150);
  }

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

  function onScroll() {
    if (locked || ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      persist();
    });
  }

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
