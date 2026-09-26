/* Karsa - Script global (index + input-data)
 * Lokasi: careerpath/assets/js/script.js
 */
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

(function () {
  const guideSlider = document.querySelector('.hg-panduan-slider');
  if (!guideSlider) return;
  const guideTrack = guideSlider.querySelector('.hg-panduan-steps');
  const guideSteps = Array.from(guideSlider.querySelectorAll('.hg-pstep'));
  const guideControls = guideSlider.querySelector('.hg-panduan-controls');
  const guidePrev = guideSlider.querySelector('[data-guide-prev]');
  const guideNext = guideSlider.querySelector('[data-guide-next]');
  const guideDots = Array.from(guideSlider.querySelectorAll('[data-guide-dot]'));
  const guideCurrent = guideSlider.querySelector('[data-guide-current]');
  if (!guideTrack || !guideSteps.length) return;
  let guideIndex = 0;
  function showGuideStep(index) {
    guideIndex = Math.max(0, Math.min(index, guideSteps.length - 1));
    guideTrack.style.transform = 'translateX(-' + guideIndex * 100 + '%)';
    guideSteps.forEach((step, stepIndex) => {
      const active = stepIndex === guideIndex;
      step.classList.toggle('active', active);
      step.setAttribute('aria-hidden', String(!active));
      step.toggleAttribute('inert', !active);
    });
    guideDots.forEach((dot, dotIndex) => {
      const active = dotIndex === guideIndex;
      dot.classList.toggle('active', active);
      if (active) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });
    if (guideCurrent) guideCurrent.textContent = String(guideIndex + 1);
    if (guidePrev) guidePrev.disabled = guideIndex === 0;
    if (guideNext) guideNext.disabled = guideIndex === guideSteps.length - 1;
  }
  guidePrev?.addEventListener('click', () => showGuideStep(guideIndex - 1));
  guideNext?.addEventListener('click', () => showGuideStep(guideIndex + 1));
  guideDots.forEach((dot, index) => {
    dot.addEventListener('click', () => showGuideStep(index));
  });
  guideControls?.addEventListener('keydown', (event) => {
    let targetIndex = guideIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') targetIndex += 1;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') targetIndex -= 1;
    else if (event.key === 'Home') targetIndex = 0;
    else if (event.key === 'End') targetIndex = guideSteps.length - 1;
    else return;
    event.preventDefault();
    showGuideStep(targetIndex);
    if (event.target.matches('[data-guide-dot]')) guideDots[guideIndex]?.focus();
  });
  showGuideStep(0);
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
