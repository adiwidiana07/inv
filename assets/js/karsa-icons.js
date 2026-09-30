/* Karsa - Ikon brutalist tajam (pengganti Iconify outline yang geometrinya
 * membulat). Semua digambar dari primitif siku: rect, garis lurus, polygon.
 * Lingkaran hanya dipakai untuk kenop/dial yang memang bundar secara makna.
 * Atribut linecap/linejoin ditempel di root <svg> sehingga imun terhadap CSS.
 * Pakai: <span class="iconify" data-kicon="nama" data-width=".." data-height=".."></span>
 */
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
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  }
  window.KarsaIcons = { render: render };
})();
