/* Karsa - Coba Cepat (homepage teaser). Murni in-memory: tanpa localStorage.
 * Threshold badge diduplikat dari logika status aplikasi (sumber: hasil.js
 * cabang rekomendasi cashflow + dashboard.js statusOf), karena cabang
 * hasil.js menyatu dengan BEP/investasi/DOM sehingga tidak aman diekstrak.
 * cf < 0 -> RISIKO; cf < Rp1.000.000 -> WASPADA; selebihnya AMAN.
 */
(function () {
  'use strict';

  var BIAYA = 3000000;
  var TARGET = 1000000;

  var gajiEl = document.getElementById('cepatGaji');
  if (!gajiEl) return;
  var valEl = document.getElementById('cepatGajiVal');
  var sisaEl = document.getElementById('cepatSisa');
  var cfEl = document.getElementById('cepatCf');
  var badgeEl = document.getElementById('cepatBadge');

  function fmt(n) {
    return 'Rp' + Math.round(n).toLocaleString('id-ID');
  }

  function status(cf) {
    if (cf < 0) return 'RISIKO';
    if (cf < 1000000) return 'WASPADA';
    return 'AMAN';
  }

  function render() {
    var gaji = parseInt(gajiEl.value, 10) || 0;
    var sisa = gaji - BIAYA;
    var cf = sisa - TARGET;
    var st = status(cf);
    if (valEl) valEl.textContent = fmt(gaji);
    if (sisaEl) sisaEl.textContent = fmt(sisa);
    if (cfEl) cfEl.textContent = fmt(cf);
    if (badgeEl) {
      badgeEl.textContent = st;
      badgeEl.className = 'db-badge ' + (st === 'AMAN' ? 'b-aman' : st === 'WASPADA' ? 'b-waspada' : 'b-risiko');
    }
  }

  gajiEl.addEventListener('input', render);
  render();
})();
