const personas=document.querySelectorAll('.persona');
let selectedPersona=null;
personas.forEach(p=>{
  p.addEventListener('click',()=>{
    personas.forEach(x=>x.classList.remove('active'));
    p.classList.add('active');
    selectedPersona=p.dataset.persona;
    updateResult();
  })
});

// FAQ
document.querySelectorAll('.faq-item').forEach(item=>{
  const btn=item.querySelector('.faq-q');
  btn.addEventListener('click',()=>{
    const isOpen=item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i=>{i.classList.remove('open'); i.querySelector('.chev').textContent='⌄'; i.querySelector('.faq-a').style.display='none'});
    if(!isOpen){ item.classList.add('open'); item.querySelector('.faq-a').style.display='block'; item.querySelector('.chev').textContent='⌃';}
  })
});

// Slider
const slider=document.getElementById('slider');
const sliderValue=document.getElementById('sliderValue');
if(slider){
  slider.addEventListener('input',()=>{
    sliderValue.textContent='+'+slider.value+'%';
    updateResult();
  })
}

// Inputs
['gaji','kenaikan','biaya','target','investasi','statusTinggal','tanggungan','jenisKerja'].forEach(id=>{
  const el=document.getElementById(id);
  if(el) el.addEventListener('input',updateResult);
  if(el) el.addEventListener('change',updateResult);
});

document.getElementById('btnAyoMulai')?.addEventListener('click',(e)=>{
  // navigasi ke halaman Input Data 1-2-3
  if(document.getElementById('btnAyoMulai').tagName==='A'){
    // biarkan href="input-data.html" yang bekerja
    return;
  }
  e.preventDefault();
  window.location.href='input-data.html';
});

function formatRp(n){
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function updateResult(){
  const gaji=parseInt(document.getElementById('gaji')?.value||0);
  const kenaikan=parseInt(document.getElementById('kenaikan')?.value||0);
  const biaya=parseInt(document.getElementById('biaya')?.value||0);
  const target=parseInt(document.getElementById('target')?.value||0);
  const investasi=parseInt(document.getElementById('investasi')?.value||0);
  const status=document.getElementById('statusTinggal')?.value;
  const tanggungan=document.getElementById('tanggungan')?.value;
  const sliderVal=parseInt(document.getElementById('slider')?.value||0);

  if(!gaji||!biaya) return;
  // Simulasi kenaikan gaji setelah sertifikasi (range 0-20% sesuai referensi)
  const gajiBaru = Math.round(gaji * (1 + sliderVal/100));
  const extra = gajiBaru - gaji;
  const cashflow = gaji - biaya - target;
  const cashflowBaru = gajiBaru - biaya - target;
  const breakEven = extra>0 ? Math.ceil(investasi / extra) : 99;

  // adjustment personal
  let personalNote='';
  if(status==='ortu') personalNote='Biaya hidup bisa lebih rendah karena tinggal dengan ortu.';
  if(status==='keluarga') personalNote='Cashflow lebih ketat karena tanggungan keluarga.';
  if(tanggungan!=='0') personalNote+=' Pertimbangkan dana darurat 3-6x biaya.';

  let rekomendasi='';
  let warna='';
  if(cashflowBaru < 0){
    rekomendasi=`Cashflow negatif (${formatRp(cashflowBaru)}/bln). Tunda investasi besar, prioritaskan efisensi biaya atau kenaikan gaji >${sliderVal}%`;
    warna='#d94e3c';
  } else if(breakEven > 24){
    rekomendasi=`Break-even ${breakEven} bulan terlalu lama. Cari sertifikasi lebih murah atau kenaikan gaji minimal ${Math.ceil(investasi/ gaji *100)}%. ${personalNote}`;
    warna='#e8b84a';
  } else if(cashflowBaru >= target && breakEven <=12){
    rekomendasi=`LAYAK! Cashflow +${formatRp(cashflowBaru)}/bln, modal balik ${breakEven} bulan. Extra gaji +${formatRp(extra)}. ${personalNote}`;
    warna='#2d7d5e';
  } else {
    rekomendasi=`Cukup prospektif. Cashflow ${formatRp(cashflowBaru)}/bln, BEP ${breakEven} bulan. Pastikan kenaikan ${kenaikan}%/tahun konsisten.`;
    warna='#2d7d5e';
  }

  const textEl=document.getElementById('resultText');
  const statsEl=document.getElementById('resultStats');
  const dot=document.querySelector('.result-dot');
  if(dot) dot.style.background=warna;
  if(textEl) textEl.textContent=rekomendasi;
  if(statsEl){
    statsEl.innerHTML=`
      <div class="stat"><span>Gaji Baru</span><b>${formatRp(gajiBaru)}</b></div>
      <div class="stat"><span>Cashflow Baru</span><b>${formatRp(cashflowBaru)}</b></div>
      <div class="stat"><span>BEP Investasi</span><b>${breakEven} bulan</b></div>
      <div class="stat"><span>Persona</span><b>${selectedPersona? 'Preset '+selectedPersona : '-'}</b></div>
    `;
  }
}
// initial calc
updateResult();

// ===== Input Data Page 1-2-3 (pisah file, fitur aktif) =====
let jobOpenInput = true;
function toggleDropdownInput(){
  const list=document.getElementById('dropdownList');
  const btn=document.getElementById('dropdownBtn');
  if(!list||!btn) return;
  jobOpenInput=!jobOpenInput;
  list.style.display=jobOpenInput?'block':'none';
  btn.style.borderRadius=jobOpenInput?'10px 10px 0 0':'10px';
}
function selectJobInput(el){
  document.querySelectorAll('#dropdownList div').forEach(d=>d.classList.remove('active'));
  el.classList.add('active');
  const hidden=document.getElementById('jenisKerja');
  if(hidden) hidden.value=el.dataset.value;
  const btn=document.getElementById('dropdownBtn');
  if(btn) btn.innerHTML=el.textContent+' <span>▼</span>';
}
function toggleSwitchInput(el){
  el.classList.toggle('on');
  const isOn=el.classList.contains('on');
  if(el.id==='switchTinggal'){
    const lbl=document.getElementById('labelTinggal');
    if(lbl) lbl.textContent=isOn?'Dengan Ortu / Keluarga':'Kos / Sendiri';
  } else if(el.id==='switchTanggungan'){
    const lbl=document.getElementById('labelTanggungan');
    if(lbl) lbl.textContent=isOn?'Ada (1+ orang)':'Tidak ada';
  }
}
function kalkulasiInput(){
  const gaji=parseInt(document.getElementById('gaji')?.value||0);
  const biaya=parseInt(document.getElementById('biaya')?.value||0);
  const target=parseInt(document.getElementById('target')?.value||0);
  const investasi=parseInt(document.getElementById('investasi')?.value||0);
  const kenaikan=parseInt(document.getElementById('kenaikan')?.value||0);
  const jenis=document.getElementById('jenisKerja')?.value||'tetap';
  const tinggal=document.getElementById('switchTinggal')?.classList.contains('on')?'ortu':'sendiri';
  const tanggungan=document.getElementById('switchTanggungan')?.classList.contains('on')?'ada':'tidak';
  if(!gaji || !biaya){ alert('Isi Gaji Bulanan dan Biaya Hidup dulu'); return; }
  const cashflow = gaji - biaya - target;
  const extra = Math.round(gaji * (kenaikan/100)/12);
  const bep = extra>0 ? Math.ceil(investasi/extra) : 99;
  let personal='';
  if(tinggal==='ortu') personal=' Biaya hidup lebih ringan (tinggal dengan ortu).';
  if(tanggungan==='ada') personal+=' Siapkan dana darurat 3-6x biaya.';
  let rekom='';
  if(cashflow<0) rekom=`Cashflow negatif Rp ${cashflow.toLocaleString('id-ID')}/bln. Tunda investasi besar.${personal}`;
  else if(bep>24) rekom=`BEP ${bep} bulan terlalu lama. Cari sertifikasi lebih murah atau pastikan kenaikan >${kenaikan}%.${personal}`;
  else rekom=`LAYAK! Cashflow Rp ${cashflow.toLocaleString('id-ID')}/bln • Extra +Rp ${extra.toLocaleString('id-ID')}/bln • BEP ${bep} bulan • Jenis: ${jenis}.${personal}`;
  const box=document.getElementById('resultBox');
  const txt=document.getElementById('resultText');
  if(txt) txt.textContent=rekom;
  if(box){ box.classList.add('show'); box.scrollIntoView({behavior:'smooth'}); }
  localStorage.setItem('karsa_input', JSON.stringify({gaji,biaya,target,investasi,kenaikan,jenis,tinggal,tanggungan}));
  // Auto redirect ke Dashboard Hasil (1.2.png) setelah 900ms
  setTimeout(()=>{ window.location.href='hasil.html'; }, 900);
}
// init dropdown default untuk input-data page
const firstJob=document.querySelector('#dropdownList div');
if(firstJob) firstJob.classList.add('active');
