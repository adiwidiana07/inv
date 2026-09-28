'use strict';
let currentStep = 1;
const personaCards = document.querySelectorAll('.persona-card');
const personaHint = document.getElementById('personaHint');
const personaPreset = {
  fresh: { label: 'Si Fresh Graduate', gaji: 4500000, biaya: 2800000, target: 1000000, investasi: 1500000, kenaikan: 15, usia: 23, jmlTanggungan: 0, kota: 'Jakarta', cicilan: 0, danaDarurat: 2000000, tinggal: false, tanggungan: false, jenis: 'tetap' },
  pindah: { label: 'Si Mau Pindah Karier', gaji: 9000000, biaya: 5500000, target: 2000000, investasi: 8000000, kenaikan: 25, usia: 29, jmlTanggungan: 1, kota: 'Bandung', cicilan: 1500000, danaDarurat: 30000000, tinggal: false, tanggungan: true, jenis: 'tetap' },
  banding: { label: 'Si Bandingin Tawaran', gaji: 14000000, biaya: 8500000, target: 3000000, investasi: 3000000, kenaikan: 20, usia: 32, jmlTanggungan: 2, kota: 'Surabaya', cicilan: 3000000, danaDarurat: 60000000, tinggal: false, tanggungan: true, jenis: 'kontrak' }
};
let selectedPersona = localStorage.getItem('karsa_persona') || null;
function setRp(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = 'Rp ' + Number(val || 0).toLocaleString('id-ID');
}
function setNum(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = String(val);
}
function setSimToggle(which, on) {
  const el = document.getElementById(which === 'tinggal' ? 'toggleTinggal' : 'toggleTanggung');
  if (!el) return;
  el.setAttribute('aria-pressed', String(on));
  const cap = document.getElementById(which === 'tinggal' ? 'capTinggal' : 'capTanggung');
  if (cap) cap.textContent = which === 'tinggal' ? (on ? 'Dengan Ortu / Keluarga' : 'Kos / Sendiri') : (on ? 'Ada (1+ orang)' : 'Tidak ada');
}
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
  setSimToggle('tinggal', p.tinggal);
  setSimToggle('tanggung', p.tanggungan);
  const opt = document.querySelector('#jobList div[data-value="' + p.jenis + '"]');
  if (opt) pickJob(opt);
  if (personaHint) {
    personaHint.textContent = 'Form udah keisi contoh data ' + p.label + '. Semua angka masih bisa diubah di langkah berikutnya.';
    personaHint.hidden = false;
  }
}
personaCards.forEach(c => {
  if (c.dataset.persona === selectedPersona) {
    c.classList.add('active');
    c.setAttribute('aria-pressed', 'true');
  }
  c.addEventListener('click', () => {
    personaCards.forEach(x => {
      x.classList.remove('active');
      x.setAttribute('aria-pressed', 'false');
    });
    c.classList.add('active');
    c.setAttribute('aria-pressed', 'true');
    selectedPersona = c.dataset.persona;
    localStorage.setItem('karsa_persona', selectedPersona);
    applyPersona(selectedPersona);
    saveWajib();
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
function pushHistoryRecord() {
  try {
    var sess = JSON.parse(localStorage.getItem('karsa_session') || 'null');
    if (!sess) return;
    var input = JSON.parse(localStorage.getItem('karsa_input') || '{}');
    var gaji = input.gaji || 0, biaya = input.biaya || 0, target = input.target || 0;
    if (!gaji && !biaya) return;
    var sisa = gaji - biaya;
    var cf = sisa - target;
    var status = cf < 0 ? 'RISIKO' : cf < 1000000 ? 'WASPADA' : 'AMAN';
    var persona = localStorage.getItem('karsa_persona') || 'fresh';
    var labels = { fresh: 'Si Fresh Graduate', pindah: 'Si Mau Pindah Karier', banding: 'Si Bandingin Tawaran' };
    var label = labels[persona] || (localStorage.getItem('karsa_persona_label') || 'Persona Custom');
    var hist = JSON.parse(localStorage.getItem('karsa_history') || '[]');
    hist.unshift({ id: 'h' + Date.now(), email: sess.email, label: label, custom: persona === 'custom', gaji: gaji, biaya: biaya, target: target, sisa: sisa, cf: cf, status: status, investasi: input.investasi || 0, kenaikan: input.kenaikan || 0, at: Date.now() });
    localStorage.setItem('karsa_history', JSON.stringify(hist.slice(0, 100)));
  } catch (e) {}
}
function finishSim() {
  saveWajib();
  const jenis = document.getElementById('jenisKerja').value;
  const tinggal = document.getElementById('toggleTinggal').getAttribute('aria-pressed') === 'true' ? 'ortu' : 'sendiri';
  const tanggungan = document.getElementById('toggleTanggung').getAttribute('aria-pressed') === 'true' ? 'ada' : 'tidak';
  const persona = localStorage.getItem('karsa_persona') || 'fresh';
  const prev = JSON.parse(localStorage.getItem('karsa_input') || '{}');
  localStorage.setItem('karsa_input', JSON.stringify({ ...prev, jenis, tinggal, tanggungan, persona }));
  pushHistoryRecord();
  window.location.href = 'hasil.html';
}
window.finishSim = finishSim;
let saved = JSON.parse(localStorage.getItem('karsa_input') || '{}');
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
if (selectedPersona && !saved.gaji) applyPersona(selectedPersona);
function toggleBurger(btn){const l=btn.nextElementSibling; if(!l) return; const o=l.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o))}
window.toggleBurger=toggleBurger;
document.addEventListener('click', (e)=>{ if(!e.target.closest('.hg-navbar')){ document.querySelectorAll('.hg-nav-links.open').forEach(el=>{el.classList.remove('open'); const b=el.previousElementSibling; if(b&&b.classList.contains('hg-burger')) b.setAttribute('aria-expanded','false')}) }});
