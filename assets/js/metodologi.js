/* Karsa - Metodologi: accordion kartu rumus (section 5).
 * Kartu 1 default terbuka; klik head untuk buka/tutup + tukar ikon +/−.
 */
(function () {
  'use strict';

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
