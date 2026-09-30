/* Karsa - Hasil / Dashboard + Simulator What-If
 * Lokasi: careerpath/assets/js/hasil.js
 * Dipisah dari hasil.html agar code rapi dan mudah dirawat.
 */
'use strict';

let chartInstance = null;
let sertifikasiDulu = true;
let grafikLastArgs = null;
let grafikLastTotals = null;

function fmtRp(n) {
  return 'Rp ' + Number(Math.round(n)).toLocaleString('id-ID');
}

/* Warna kanvas & slider ikut token CSS supaya ikut berubah saat tema
   light/dark diganti (lihat assets/js/theme.js). */
function token(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function loadFromStorage() {
  const raw = sessionStorage.getItem('karsa_input');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function setSertifikasi(val) {
  sertifikasiDulu = val;
  document.getElementById('btnYa').classList.toggle('active', val);
  document.getElementById('btnTidak').classList.toggle('active', !val);
  updateHasil();
}

/* UX4: reset total ke kosong (sesi login tidak ikut dihapus). */
function resetSimulasi() {
  if (!confirm('Hapus semua data simulasi dan mulai dari kosong?')) return;
  try {
    sessionStorage.removeItem('karsa_input');
    sessionStorage.removeItem('karsa_persona');
    sessionStorage.removeItem('karsa_persona_label');
    sessionStorage.removeItem('karsa_prefill');
  } catch (e) {}
  location.href = 'simulasi.html';
}

function syncSliders() {
  const s1 = document.getElementById('sliderGaji');
  const s2 = document.getElementById('sliderGaji2');
  if (!s1 || !s2) return;
  s1.addEventListener('input', () => {
    s2.value = s1.value;
    updateHasil();
    styleRange(s1);
    styleRange(s2);
  });
  s2.addEventListener('input', () => {
    s1.value = s2.value;
    updateHasil();
    styleRange(s1);
    styleRange(s2);
  });
  styleRange(s1);
  styleRange(s2);
}

function styleRange(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.background = `linear-gradient(to right, #D9A441 0%, #D9A441 ${pct}%, ${token('--cream', '#EDE6D3')} ${pct}%, ${token('--cream', '#EDE6D3')} 100%)`;
}

function updateHasil() {
  const data = loadFromStorage();
  const gaji = data?.gaji || 5000000;
  const biaya = data?.biaya || 3000000;
  const target = data?.target || 1000000;
  const investasi = data?.investasi || 2000000;
  const kenaikan = data?.kenaikan || 8;
  const cicilan = data?.cicilan || 0;
  const danaDarurat = data?.danaDarurat || 0;
  const sliderVal = parseInt(document.getElementById('sliderGaji')?.value || 0);
  /* What-if butuh nominal sertifikasi: tanpa itu slider + opsi Ya/Tidak
     dimatikan (murni static, tanpa backend). */
  var noSertif = !(investasi > 0);
  var sliderEl = document.getElementById('sliderGaji');
  ['btnYa', 'btnTidak'].forEach(function (id) {
    var b = document.getElementById(id);
    if (b) b.disabled = noSertif;
  });
  if (sliderEl) {
    sliderEl.disabled = noSertif;
    var wCard = sliderEl.closest('.whatif-card');
    if (wCard) wCard.classList.toggle('is-disabled', noSertif);
  }
  var tBtn = document.getElementById('btnYa');
  if (tBtn) {
    var tCard = tBtn.closest('.whatif-card');
    if (tCard) tCard.classList.toggle('is-disabled', noSertif);
  }
  var wSub = document.querySelector('.whatif-sub');
  if (wSub) {
    if (!wSub.dataset.orig) wSub.dataset.orig = wSub.textContent;
    wSub.textContent = noSertif ? 'Isi nominal sertifikasi di Simulasi biar what-if bisa dipakai.' : wSub.dataset.orig;
  }

  const sisa = gaji - biaya - cicilan;
  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const extraPerBulan = gajiBaru - gaji;
  const bep = extraPerBulan > 0 ? Math.ceil(investasi / extraPerBulan) : 99;

  let bepDisplay = bep;
  if (sertifikasiDulu && extraPerBulan > 0) bepDisplay = bep + 3;

  const elSisa = document.getElementById('valSisaGaji');
  const elBEP = document.getElementById('valBEP');
  elSisa.dataset.count = String(sisa);
  if (bepDisplay >= 99) {
    elBEP.textContent = '>24 bln';
    elBEP.dataset.count = '';
  } else {
    elBEP.dataset.count = String(bepDisplay);
  }

  const base = sisa > 0 ? sisa : gaji;
  document.getElementById('alokasiPrimer').dataset.count = String(Math.round(base * 0.5));
  document.getElementById('alokasiSekunder').dataset.count = String(Math.round(base * 0.3));
  document.getElementById('alokasiTersier').dataset.count = String(Math.round(base * 0.2));

  /* UX8: wawasan konteks dari Step 3 (rule sederhana, tanpa backend). */
  var elDana = document.getElementById('valDanaBulan');
  var elCicil = document.getElementById('valCicilPct');
  if (elDana) elDana.textContent = biaya > 0 ? (danaDarurat / biaya).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' bulan' : '- bulan';
  if (elCicil) elCicil.textContent = gaji > 0 ? (cicilan / gaji * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%' : '-';

  const dot = document.getElementById('rekomDot');
  const txt = document.getElementById('rekomText');
  const extraBox = document.getElementById('rekomExtra');
  const cashflowBaru = gajiBaru - biaya - cicilan - target;

  let rekomendasi = '';
  let warna = '#D94E3C';

  if (cashflowBaru < 0) {
    rekomendasi = `Cashflow kamu minus ${fmtRp(cashflowBaru)}/bln. Tunda investasi gede dulu, atau cari sertifikasi yang ROI-nya lebih tinggi / kenaikan di atas ${sliderVal}%.`;
    warna = '#D94E3C';
  } else if (bepDisplay > 24) {
    if (extraPerBulan <= 0) {
      rekomendasi = `Belum balik modal karena extra gaji Rp0/bln. Naikkan slider gaji di atas atau pilih investasi yang lebih murah dari ${fmtRp(investasi)}.`;
    } else {
      rekomendasi = `Balik modal ${bepDisplay} bulan kelamaan buat investasi ${fmtRp(investasi)}. Extra gaji cuma ${fmtRp(extraPerBulan)}/bln. Coba cari investasi yang lebih murah, atau sertifikasi yang lebih worth it.`;
    }
    warna = '#E8B84A';
  } else if (cashflowBaru >= target && bepDisplay <= 12) {
    rekomendasi = `LAYAK! Cashflow baru ${fmtRp(cashflowBaru)}/bln, modal balik dalam ${bepDisplay} bulan. Extra gaji ${fmtRp(extraPerBulan)}/bln abis ambil ${sertifikasiDulu ? 'sertifikasi dulu' : 'kerja dulu'}. Strategi ini kelihatan worth it.`;
    warna = '#2d7d5e';
  } else {
    rekomendasi = `Lumayan prospektif. Cashflow ${fmtRp(cashflowBaru)}/bln, balik modal ${bepDisplay} bulan. Pastikan kenaikan ${kenaikan}%/tahun konsisten, dan siapin dana darurat.`;
    warna = '#2d7d5e';
  }

  txt.textContent = rekomendasi;
  dot.style.background = warna;
  /* M5: kartu verdict = jawaban utama; ambang sama dengan badge app. */
  var vBadge = document.getElementById('verdictBadge');
  var vText = document.getElementById('verdictText');
  var vCash = document.getElementById('verdictCash');
  var vStatus = cashflowBaru < 0 ? 'RISIKO' : cashflowBaru < 1000000 ? 'WASPADA' : 'AMAN';
  if (vBadge) {
    vBadge.textContent = vStatus;
    vBadge.className = 'db-badge dash-verdict-badge ' + (vStatus === 'AMAN' ? 'b-aman' : vStatus === 'WASPADA' ? 'b-waspada' : 'b-risiko');
  }
  if (vText) vText.textContent = vStatus === 'RISIKO' ? 'Cashflow masih minus — tunda dulu keputusan besarnya.' : vStatus === 'WASPADA' ? 'Cashflow di bawah Rp1 juta — pertimbangkan baik-baik sebelum jalan.' : 'Cashflow Rp1 juta ke atas — kondisimu relatif sehat.';
  if (vCash) vCash.textContent = fmtRp(cashflowBaru) + '/bln';
  extraBox.innerHTML = `<div class="extra-grid"><span>Gaji baru: <b>${fmtRp(gajiBaru)}</b></span><span>Extra: <b>+${fmtRp(extraPerBulan)}/bln</b></span><span>Cashflow: <b>${fmtRp(cashflowBaru)}/bln</b></span><span>Mode: <b>${sertifikasiDulu ? 'Sertifikasi dulu' : 'Kerja dulu'}</b></span></div>`;

  updateGrafik(gaji, biaya, cicilan, kenaikan, sliderVal);
  var elCashflow = document.getElementById('valCashflow');
  var elRunway = document.getElementById('valRunway');
  var elRoi = document.getElementById('valRoi');
  if (elCashflow) elCashflow.dataset.count = String(Math.round(cashflowBaru));
  if (grafikLastTotals) {
    if (elRunway) elRunway.dataset.count = String(Math.round(grafikLastTotals.runway));
    if (elRoi) elRoi.dataset.count = String(Math.round(grafikLastTotals.roi));
  }

  if (window.karsaSyncCountUp) window.karsaSyncCountUp();
}

function updateGrafik(gaji, biaya, cicilan, kenaikan, sliderVal) {
  const canvas = document.getElementById('grafikCanvas');
  if (!canvas) return;
  grafikLastArgs = [gaji, biaya, cicilan, kenaikan, sliderVal];

  const months = 12;
  const labels = Array.from({ length: months }, (_, i) => `B${i + 1}`);
  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const investasi = JSON.parse(sessionStorage.getItem('karsa_input') || '{}').investasi || 2000000;

  const dataRunway = [];
  const dataRoi = [];
  let kumulatif = 0;

  for (let i = 0; i < months; i++) {
    const g = Math.round(gajiBaru * Math.pow(1 + kenaikan / 100 / 12, i));
    const sisa = g - biaya - cicilan;
    kumulatif += sisa;
    dataRunway.push(Math.round((kumulatif / 1000000) * 10) / 10);
    dataRoi.push(Math.round((((gajiBaru - gaji) * (i + 1) - investasi) / 1000000) * 10) / 10);
  }
  grafikLastTotals = {
    runway: dataRunway[dataRunway.length - 1] * 1000000,
    roi: dataRoi[dataRoi.length - 1] * 1000000
  };
  var grafikCanvas = document.getElementById('grafikCanvas');
  if (grafikCanvas) grafikCanvas.setAttribute('aria-label', 'Grafik proyeksi 12 bulan: runway kumulatif dari Rp' + Math.round(dataRunway[0] * 1000000).toLocaleString('id-ID') + ' ke Rp' + Math.round(dataRunway[dataRunway.length - 1] * 1000000).toLocaleString('id-ID') + ', ROI akhir Rp' + Math.round(dataRoi[dataRoi.length - 1] * 1000000).toLocaleString('id-ID'));

  // Coba pakai Chart.js jika tersedia
  if (typeof Chart !== 'undefined') {
    try {
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Runway Kumulatif (jt)', data: dataRunway, borderColor: '#3D6B4F', backgroundColor: 'rgba(61,107,79,0.15)', tension: 0.38, fill: true, pointRadius: 0, borderWidth: 2.8 },
            { label: 'ROI vs Investasi (jt)', data: dataRoi, borderColor: '#D9A441', backgroundColor: 'rgba(217,164,65,0.15)', tension: 0.38, fill: true, pointRadius: 0, borderWidth: 2.6, borderDash: [6, 4] },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Space Grotesk, sans-serif', size: 11 }, color: token('--ink', '#1a1a1a') } },
            y: { grid: { color: token('--gray-light', '#E2E8E0') }, ticks: { font: { family: 'Space Grotesk, sans-serif', size: 11 }, color: token('--ink', '#1a1a1a') } },
          },
        },
      });
      return;
    } catch (e) {
      console.warn('Chart.js gagal, fallback manual', e);
    }
  }

  // Fallback manual canvas 2D (tanpa CDN)
  drawGrafikManual(canvas, labels, dataRunway, dataRoi);
}

function drawGrafikManual(canvas, labels, dataA, dataB) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = token('--white', '#F6F9F6');
  ctx.fillRect(0, 0, W, H);

  const padL = 44;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const all = [...dataA, ...dataB];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;
  const yPad = range * 0.18;
  const yMin = min - yPad;
  const yMax = max + yPad;

  const xAt = (i) => padL + (i / (labels.length - 1)) * plotW;
  const yAt = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  ctx.strokeStyle = token('--gray-light', '#E2E8E0');
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = yMax - (i / 4) * (yMax - yMin);
    ctx.fillStyle = token('--gray-dark', '#555');
    ctx.font = '12px "Space Grotesk", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1) + 'jt', padL - 6, y + 3);
  }

  ctx.fillStyle = token('--ink', '#1a1a1a');
  ctx.font = '700 11px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  var xSkip = W < 420 ? 2 : 1;
  labels.forEach((lb, i) => { if (i % xSkip === 0) ctx.fillText(lb, xAt(i), H - 8); });

  const drawLine = (data, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  const drawFill = (data, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = xAt(i);
      const y = yAt(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(xAt(data.length - 1), padT + plotH);
    ctx.lineTo(xAt(0), padT + plotH);
    ctx.closePath();
    ctx.fill();
  };

  drawFill(dataA, 'rgba(61,107,79,0.14)');
  drawLine(dataA, '#3D6B4F');
  drawFill(dataB, 'rgba(217,164,65,0.14)');
  ctx.setLineDash([6, 4]);
  drawLine(dataB, '#D9A441');
  ctx.setLineDash([]);

  ctx.fillStyle = '#D94E3C';
  dataB.forEach((v, i) => {
    if (Math.abs(v) < 0.6) {
      const x = xAt(i);
      const y = yAt(v);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = token('--ink', '#1a1a1a');
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });

  ctx.strokeStyle = token('--ink', '#1a1a1a');
  ctx.lineWidth = 1.2;
  ctx.strokeRect(padL, padT, plotW, plotH);
}

// Init halaman hasil
syncSliders();
updateHasil();

/* Grafik manual digores ulang saat viewport berubah (rotasi / resize),
   karena ukuran canvas diambil dari getBoundingClientRect saat draw. */
(function bindGrafikResize() {
  let raf = 0;
  const redraw = function () {
    if (!grafikLastArgs) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { updateGrafik.apply(null, grafikLastArgs); });
  };
  window.addEventListener('resize', redraw);
  window.addEventListener('orientationchange', redraw);
  document.addEventListener('karsa:themechange', redraw);
})();

function toggleBurger(btn){const l=btn.nextElementSibling; if(!l) return; const o=l.classList.toggle('open'); btn.setAttribute('aria-expanded',String(o))} window.toggleBurger=toggleBurger
