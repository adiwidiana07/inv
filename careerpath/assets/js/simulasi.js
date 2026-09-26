'use strict';
let currentStep = 1;
const personaCards = document.querySelectorAll('.persona-card');
let selectedPersona = localStorage.getItem('karsa_persona') || null;
personaCards.forEach(c => {
  if (c.dataset.persona === selectedPersona) c.classList.add('active');
  c.addEventListener('click', () => {
    personaCards.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    selectedPersona = c.dataset.persona;
    localStorage.setItem('karsa_persona', selectedPersona);
  });
});
function showStep(n) {
  document.querySelectorAll('.sim-step').forEach(s => s.classList.remove('active'));
  document.getElementById('step'+n).classList.add('active');
  currentStep = n;
  if (window.karsaScroll) window.karsaScroll.release();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.getElementById('toStep2')?.addEventListener('click', () => {
  if (!selectedPersona) { alert('Pilih persona dulu, baru lanjut'); return; }
  showStep(2);
});
document.getElementById('back1')?.addEventListener('click', () => showStep(1));
document.getElementById('toStep3')?.addEventListener('click', () => {
  const gaji = document.getElementById('gaji').value.trim();
  const biaya = document.getElementById('biaya').value.trim();
  const target = document.getElementById('target').value.trim();
  if (!gaji || !biaya || !target) { alert('Isi dulu Gaji, Biaya, sama Target'); return; }
  saveWajib();
  showStep(3);
});
document.getElementById('back2')?.addEventListener('click', () => showStep(2));
let stepBeforeTour = currentStep;
document.addEventListener('karsa:tour-start', () => { stepBeforeTour = currentStep; });
document.addEventListener('karsa:tour-reveal', (e) => {
  const n = Number(e.detail);
  if (n >= 1 && n <= 3) showStep(n);
});
document.addEventListener('karsa:tour-end', () => {
  if (currentStep !== stepBeforeTour) showStep(stepBeforeTour);
});
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
  const prev = JSON.parse(localStorage.getItem('karsa_input') || '{}');
  localStorage.setItem('karsa_input', JSON.stringify({ ...prev, ...data }));
}
function parseRupiah(s) {
  const n = parseInt(s.replace(/[^0-9]/g,''),10);
  return isNaN(n)?0:n;
}
['gaji','biaya','target','investasi','cicilan','danaDarurat'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    const raw = el.value.replace(/[^0-9]/g,'');
    if (!raw) { el.value=''; return; }
    el.value = 'Rp ' + Number(raw).toLocaleString('id-ID');
  });
});
['usia','jmlTanggungan'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', () => {
    el.value = el.value.replace(/[^0-9]/g,'');
  });
});
document.getElementById('kenaikan')?.addEventListener('input', e => {
  let v = e.target.value.replace(/[^0-9]/g,'');
  if (v) e.target.value = v + '%';
});
function toggleSim(which) {
  const id = which === 'tinggal' ? 'toggleTinggal' : 'toggleTanggung';
  const el = document.getElementById(id);
  const on = el.getAttribute('aria-pressed') === 'true';
  el.setAttribute('aria-pressed', String(!on));
  const cap = document.getElementById(which === 'tinggal' ? 'capTinggal' : 'capTanggung');
  if (which === 'tinggal') cap.textContent = !on ? 'Dengan Ortu / Keluarga' : 'Kos / Sendiri';
  else cap.textContent = !on ? 'Ada (1+ orang)' : 'Tidak ada';
}
window.toggleSim = toggleSim;
function toggleJob() {
  const list = document.getElementById('jobList');
  const btn = document.getElementById('dropdownJob');
  const open = list.classList.toggle('open');
  const arrow = btn.querySelector('.arrow');
  if(arrow) arrow.textContent = open ? '›' : '▼';
}
window.toggleJob = toggleJob;
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
function finishSim() {
  saveWajib();
  const jenis = document.getElementById('jenisKerja').value;
  const tinggal = document.getElementById('toggleTinggal').getAttribute('aria-pressed') === 'true' ? 'ortu' : 'sendiri';
  const tanggungan = document.getElementById('toggleTanggung').getAttribute('aria-pressed') === 'true' ? 'ada' : 'tidak';
  const persona = localStorage.getItem('karsa_persona') || 'fresh';
  const prev = JSON.parse(localStorage.getItem('karsa_input') || '{}');
  localStorage.setItem('karsa_input', JSON.stringify({ ...prev, jenis, tinggal, tanggungan, persona }));
  window.location.href = 'hasil.html';
}
window.finishSim = finishSim;
const saved = JSON.parse(localStorage.getItem('karsa_input') || '{}');
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
function toggleBurger(btn){const l=btn.nextElementSibling; if(!l) return; const o=l.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o))}
window.toggleBurger=toggleBurger;
document.addEventListener('click', (e)=>{ if(!e.target.closest('.hg-navbar')){ document.querySelectorAll('.hg-nav-links.open').forEach(el=>{el.classList.remove('open'); const b=el.previousElementSibling; if(b&&b.classList.contains('hg-burger')) b.setAttribute('aria-expanded','false')}) }});
