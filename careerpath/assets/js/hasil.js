/* Karsa - Hasil / Dashboard + Simulator What-If
 * Lokasi: careerpath/assets/js/hasil.js
 * Dipisah dari hasil.html agar code rapi dan mudah dirawat.
 */
'use strict';

let chartInstance = null;
let sertifikasiDulu = true;

function fmtRp(n) {
  return 'Rp ' + Number(Math.round(n)).toLocaleString('id-ID');
}

function loadFromStorage() {
  const raw = localStorage.getItem('karsa_input');
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
  el.style.background = `linear-gradient(to right, #D9A441 0%, #D9A441 ${pct}%, #EDE6D3 ${pct}%, #EDE6D3 100%)`;
}

function updateHasil() {
  const data = loadFromStorage();
  const gaji = data?.gaji || 5000000;
  const biaya = data?.biaya || 3000000;
  const target = data?.target || 1000000;
  const investasi = data?.investasi || 2000000;
  const kenaikan = data?.kenaikan || 8;
  const sliderVal = parseInt(document.getElementById('sliderGaji')?.value || 0);

  const sisa = gaji - biaya;
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

  const dot = document.getElementById('rekomDot');
  const txt = document.getElementById('rekomText');
  const extraBox = document.getElementById('rekomExtra');
  const cashflowBaru = gajiBaru - biaya - target;

  let rekomendasi = '';
  let warna = '#D94E3C';

  if (cashflowBaru < 0) {
    rekomendasi = `Cashflow negatif (${fmtRp(cashflowBaru)}/bln). Tunda investasi besar atau cari sertifikasi lebih murah. Dengan kenaikan ${sliderVal}%, gaji baru ${fmtRp(gajiBaru)} belum cukup menutup biaya + target tabungan.`;
    warna = '#D94E3C';
  } else if (bepDisplay > 24) {
    rekomendasi = `Break-even ${bepDisplay} bulan terlalu lama untuk investasi ${fmtRp(investasi)}. Extra gaji hanya +${fmtRp(extraPerBulan)}/bln. Pertimbangkan sertifikasi dengan ROI lebih tinggi atau kenaikan >${sliderVal}%.`;
    warna = '#E8B84A';
  } else if (cashflowBaru >= target && bepDisplay <= 12) {
    rekomendasi = `LAYAK! Cashflow baru ${fmtRp(cashflowBaru)}/bln, modal balik ${bepDisplay} bulan. Extra gaji +${fmtRp(extraPerBulan)}/bln setelah sertifikasi ${sliderVal}%. Strategi ${sertifikasiDulu ? 'sertifikasi dulu' : 'kerja dulu'} prospektif.`;
    warna = '#2d7d5e';
  } else {
    rekomendasi = `Cukup prospektif. Cashflow ${fmtRp(cashflowBaru)}/bln, BEP ${bepDisplay} bulan. Pastikan proyeksi kenaikan ${kenaikan}%/tahun konsisten dan siapkan dana darurat.`;
    warna = '#4A7C59';
  }

  txt.textContent = rekomendasi;
  dot.style.background = warna;
  extraBox.innerHTML = `<div class="extra-grid"><span>Gaji baru: <b>${fmtRp(gajiBaru)}</b></span><span>Extra: <b>+${fmtRp(extraPerBulan)}/bln</b></span><span>Cashflow: <b>${fmtRp(cashflowBaru)}/bln</b></span><span>Mode: <b>${sertifikasiDulu ? 'Sertifikasi dulu' : 'Kerja dulu'}</b></span></div>`;

  if (window.karsaSyncCountUp) window.karsaSyncCountUp();

  updateGrafik(gaji, biaya, kenaikan, sliderVal);
}

function updateGrafik(gaji, biaya, kenaikan, sliderVal) {
  const canvas = document.getElementById('grafikCanvas');
  if (!canvas) return;

  const months = 12;
  const labels = Array.from({ length: months }, (_, i) => `B${i + 1}`);
  const gajiBaru = Math.round(gaji * (1 + sliderVal / 100));
  const investasi = JSON.parse(localStorage.getItem('karsa_input') || '{}').investasi || 2000000;

  const dataRunway = [];
  const dataRoi = [];
  let kumulatif = 0;

  for (let i = 0; i < months; i++) {
    const g = Math.round(gajiBaru * Math.pow(1 + kenaikan / 100 / 12, i));
    const sisa = g - biaya;
    kumulatif += sisa;
    dataRunway.push(Math.round((kumulatif / 1000000) * 10) / 10);
    dataRoi.push(Math.round((((gajiBaru - gaji) * (i + 1) - investasi) / 1000000) * 10) / 10);
  }

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
            x: { grid: { display: false }, ticks: { font: { family: 'Space Mono', size: 9 }, color: '#1a1a1a' } },
            y: { grid: { color: '#E2E8E0' }, ticks: { font: { family: 'Space Mono', size: 9 }, color: '#1a1a1a' } },
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

  ctx.fillStyle = '#F6F9F6';
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

  ctx.strokeStyle = '#E2E8E0';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (i / 4) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const val = yMax - (i / 4) * (yMax - yMin);
    ctx.fillStyle = '#555';
    ctx.font = '10px Space Mono';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1) + 'jt', padL - 6, y + 3);
  }

  ctx.fillStyle = '#1a1a1a';
  ctx.font = '700 9px Space Mono';
  ctx.textAlign = 'center';
  labels.forEach((lb, i) => ctx.fillText(lb, xAt(i), H - 8));

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
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });

  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(padL, padT, plotW, plotH);
}

// Init halaman hasil
syncSliders();
updateHasil();
