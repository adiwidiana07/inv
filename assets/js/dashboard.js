/* Karsa - Dashboard (after login): riwayat, persona custom, pengaturan akun.
 * Storage:
 * - karsa_history [{id,email,label,custom,gaji,biaya,target,sisa,cf,status,at}]
 * - karsa_custom_personas [{id,email,name,gaji,biaya,target}]
 */
(function () {
  'use strict';

  if (!window.KarsaAuth || !KarsaAuth.requireLogin()) return;
  var session = KarsaAuth.getSession();
  var email = session.email;

  var HIST_KEY = 'karsa_history';
  var PERS_KEY = 'karsa_custom_personas';

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key) || '[]'); }
    catch (e) { return []; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function myHistory() { return load(HIST_KEY).filter(function (h) { return h.email === email; }); }
  function myPersonas() { return load(PERS_KEY).filter(function (p) { return p.email === email; }); }

  function fmtRp(n) { return 'Rp' + Number(Math.round(n || 0)).toLocaleString('id-ID'); }
  function fmtRpSigned(n) {
    var v = Math.round(n || 0);
    return (v < 0 ? '-' : '') + 'Rp' + Math.abs(v).toLocaleString('id-ID');
  }
  function fmtLong(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function fmtShort(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function statusOf(cf) {
    if (cf < 0) return 'RISIKO';
    if (cf < 1000000) return 'WASPADA';
    return 'AMAN';
  }
  function parseNum(s) {
    var n = parseInt(String(s == null ? '' : s).replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  /* ---------- Modal generik ---------- */
  var modal = document.getElementById('dbModal');
  var mTitle = document.getElementById('dbModalTitle');
  var mBody = document.getElementById('dbModalBody');
  var mActions = document.getElementById('dbModalActions');
  function openModal(title, bodyHTML, actions) {
    mTitle.textContent = title;
    mBody.innerHTML = bodyHTML;
    mActions.innerHTML = '';
    (actions || [{ label: 'Tutup' }]).forEach(function (a) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'db-btn' + (a.kind === 'red' ? ' db-btn-red' : '') + (a.kind === 'danger' ? ' db-btn-danger' : '');
      b.textContent = a.label;
      b.addEventListener('click', function () {
        if (a.onClick) a.onClick();
        else closeModal();
      });
      mActions.appendChild(b);
    });
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; }
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Profil + statistik ---------- */
  function renderProfile() {
    var users = KarsaAuth.getUsers();
    var user = users.find(function (u) { return u.email === email; }) || {};
    var name = session.name || user.name || email.split('@')[0];
    document.getElementById('dbGreet').textContent = 'Halo, ' + name;
    document.getElementById('dbName').textContent = name;
    document.getElementById('dbEmail').textContent = email;
    document.getElementById('dbAvatar').textContent = (name.charAt(0) || 'A').toUpperCase();
    var joined = user.createdAt || session.loginAt || Date.now();
    document.getElementById('dbJoined').textContent = 'Bergabung ' + fmtLong(joined);
  }

  function renderStats(hist, pers) {
    document.getElementById('statTotal').textContent = String(hist.length);
    document.getElementById('statCustom').textContent = String(pers.length);
    document.getElementById('statLast').textContent = hist.length ? fmtShort(hist[0].at) : '-';
  }

  /* ---------- Riwayat ---------- */
  var selected = new Set();
  var compareBtn = document.getElementById('compareBtn');

  function badgeClass(st) {
    return st === 'AMAN' ? 'b-aman' : st === 'WASPADA' ? 'b-waspada' : 'b-risiko';
  }

  function renderHistory(hist) {
    var list = document.getElementById('historyList');
    selected.forEach(function (id) {
      if (!hist.some(function (h) { return h.id === id; })) selected.delete(id);
    });
    if (!hist.length) {
      list.innerHTML = '<p class="db-empty">Belum ada riwayat simulasi. <a href="simulasi.html">Mulai Simulasi</a> dulu biar tercatat di sini.</p>';
    } else {
      list.innerHTML = '';
      hist.forEach(function (h) {
        var row = document.createElement('div');
        row.className = 'db-row';
        row.innerHTML =
          '<button type="button" class="db-check' + (selected.has(h.id) ? ' on' : '') + '" data-check="' + h.id + '" aria-pressed="' + selected.has(h.id) + '" aria-label="Pilih ' + esc(h.label) + ' untuk dibandingkan">✓</button>' +
          '<div class="db-row-main"><b>' + esc(h.label) + (h.custom ? ' (custom)' : '') + '</b><span>' + fmtLong(h.at) + '</span></div>' +
          '<div class="db-row-side"><span class="db-sisa">Sisa ' + fmtRpSigned(h.sisa) + '</span>' +
          '<span class="db-badge ' + badgeClass(h.status) + '">' + h.status + '</span></div>';
        var view = document.createElement('button');
        view.type = 'button';
        view.className = 'db-btn db-btn-sm';
        view.textContent = 'Lihat';
        view.addEventListener('click', function () { viewRecord(h); });
        row.appendChild(view);
        list.appendChild(row);
      });
    }
    syncCompareBtn(hist);
  }

  function syncCompareBtn(hist) {
    compareBtn.textContent = 'Bandingkan (' + selected.size + ')';
    compareBtn.disabled = selected.size < 2;
  }

  document.getElementById('historyList').addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-check]');
    if (!c) return;
    var id = c.getAttribute('data-check');
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    var on = selected.has(id);
    c.classList.toggle('on', on);
    c.setAttribute('aria-pressed', String(on));
    syncCompareBtn();
  });

  compareBtn.addEventListener('click', function () {
    var hist = myHistory();
    var rows = hist.filter(function (h) { return selected.has(h.id); });
    if (rows.length < 2) return;
    var cols = rows.map(function (h) {
      return '<td><b>' + esc(h.label) + '</b><br><span class="db-muted">' + fmtLong(h.at) + '</span></td>';
    }).join('');
    function numRow(label, fn) {
      return '<tr><th>' + label + '</th>' + rows.map(function (h) { return '<td>' + fn(h) + '</td>'; }).join('') + '</tr>';
    }
    openModal('Bandingkan Simulasi',
      '<div class="db-table-wrap"><table class="db-table">' +
      '<tr><th>Persona</th>' + cols + '</tr>' +
      numRow('Gaji', function (h) { return fmtRp(h.gaji); }) +
      numRow('Biaya hidup', function (h) { return fmtRp(h.biaya); }) +
      numRow('Sisa', function (h) { return fmtRpSigned(h.sisa); }) +
      '<tr><th>Status</th>' + rows.map(function (h) {
        return '<td><span class="db-badge ' + badgeClass(h.status) + '">' + h.status + '</span></td>';
      }).join('') + '</tr>' +
      '</table></div>',
      [{ label: 'Tutup' }]);
  });

  function viewRecord(h) {
    var prev = {};
    try { prev = JSON.parse(localStorage.getItem('karsa_input') || '{}'); } catch (e) {}
    localStorage.setItem('karsa_input', JSON.stringify({
      gaji: h.gaji, biaya: h.biaya, target: h.target || prev.target || 0,
      investasi: h.investasi || prev.investasi || 0, kenaikan: h.kenaikan || prev.kenaikan || 8
    }));
    location.href = 'hasil.html';
  }

  /* ---------- Persona custom ---------- */
  function renderPersonas(pers) {
    var grid = document.getElementById('personaGrid');
    grid.innerHTML = '';
    if (!pers.length) {
      var p = document.createElement('p');
      p.className = 'db-empty';
      p.textContent = 'Belum ada persona custom. Buat satu biar pengisian simulasi lebih cepat.';
      grid.appendChild(p);
      return;
    }
    pers.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'db-persona';
      card.innerHTML =
        '<b>' + esc(p.name) + '</b>' +
        '<span class="db-muted">Gaji ' + fmtRp(p.gaji) + ' · Biaya hidup ' + fmtRp(p.biaya) + ' · Tabungan ' + fmtRp(p.target) + '</span>' +
        '<div class="db-persona-actions"></div>';
      var box = card.querySelector('.db-persona-actions');
      function mk(label, cls, fn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'db-btn db-btn-sm' + (cls ? ' ' + cls : '');
        b.textContent = label;
        b.addEventListener('click', fn);
        box.appendChild(b);
      }
      mk('Pakai', 'db-btn-red', function () { usePersona(p); });
      mk('Edit', '', function () { personaModal(p); });
      mk('Hapus', '', function () {
        if (!confirm('Hapus persona "' + p.name + '"?')) return;
        save(PERS_KEY, load(PERS_KEY).filter(function (x) { return x.id !== p.id; }));
        renderAll();
      });
      grid.appendChild(card);
    });
  }

  function usePersona(p) {
    var prev = {};
    try { prev = JSON.parse(localStorage.getItem('karsa_input') || '{}'); } catch (e) {}
    var data = { gaji: p.gaji, biaya: p.biaya, target: p.target };
    try { localStorage.setItem('karsa_input', JSON.stringify(Object.assign({}, prev, data))); } catch (e) {}
    try { localStorage.setItem('karsa_persona', 'custom'); } catch (e) {}
    try { localStorage.setItem('karsa_persona_label', p.name); } catch (e) {}
    try { sessionStorage.setItem('karsa_prefill', JSON.stringify(Object.assign({ label: p.name }, data))); } catch (e) {}
    location.href = 'simulasi.html';
  }

  function personaModal(p) {
    var isEdit = !!p;
    p = p || { name: '', gaji: '', biaya: '', target: '' };
    openModal(isEdit ? 'Edit Persona' : 'Buat Persona Baru',
      '<label class="auth-field" for="pmName"><span>Nama persona</span>' +
      '<input type="text" id="pmName" value="' + esc(p.name) + '" placeholder="cth: Freelancer Desain"></label>' +
      '<label class="auth-field" for="pmGaji"><span>Gaji bulanan</span>' +
      '<input type="text" id="pmGaji" inputmode="numeric" value="' + esc(p.gaji) + '" placeholder="Rp 5.000.000"></label>' +
      '<label class="auth-field" for="pmBiaya"><span>Biaya hidup bulanan</span>' +
      '<input type="text" id="pmBiaya" inputmode="numeric" value="' + esc(p.biaya) + '" placeholder="Rp 3.000.000"></label>' +
      '<label class="auth-field" for="pmTarget"><span>Target tabungan</span>' +
      '<input type="text" id="pmTarget" inputmode="numeric" value="' + esc(p.target) + '" placeholder="Rp 1.000.000"></label>' +
      '<p class="auth-err" id="pmErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: isEdit ? 'Simpan' : 'Buat', kind: 'red', onClick: function () {
            var err = document.getElementById('pmErr');
            var name = document.getElementById('pmName').value.trim();
            var gaji = parseNum(document.getElementById('pmGaji').value);
            var biaya = parseNum(document.getElementById('pmBiaya').value);
            var target = parseNum(document.getElementById('pmTarget').value);
            function fail(m) { err.hidden = false; err.textContent = m; }
            if (!name) return fail('Isi nama persona dulu.');
            if (!gaji || !biaya) return fail('Isi gaji dan biaya hidup dulu.');
            var all = load(PERS_KEY);
            if (isEdit) {
              all = all.map(function (x) {
                return x.id === p.id ? { id: x.id, email: email, name: name, gaji: gaji, biaya: biaya, target: target } : x;
              });
            } else {
              all.push({ id: 'p' + Date.now(), email: email, name: name, gaji: gaji, biaya: biaya, target: target });
            }
            save(PERS_KEY, all);
            closeModal();
            renderAll();
          }
        }
      ]);
  }

  document.getElementById('addPersonaBtn').addEventListener('click', function () { personaModal(null); });

  /* ---------- Pengaturan akun ---------- */
  document.getElementById('editProfileBtn').addEventListener('click', function () {
    openModal('Edit Profil',
      '<label class="auth-field" for="epName"><span>Username</span>' +
      '<input type="text" id="epName" value="' + esc(session.name || '') + '"></label>' +
      '<p class="auth-err" id="epErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: 'Simpan', kind: 'red', onClick: function () {
            var v = document.getElementById('epName').value.trim();
            if (!v) {
              var err = document.getElementById('epErr');
              err.hidden = false; err.textContent = 'Username tidak boleh kosong.';
              return;
            }
            var users = KarsaAuth.getUsers().map(function (u) {
              return u.email === email ? Object.assign({}, u, { name: v }) : u;
            });
            try { localStorage.setItem('karsa_users', JSON.stringify(users)); } catch (e) {}
            session.name = v;
            KarsaAuth.setSession(session);
            closeModal();
            renderProfile();
          }
        }
      ]);
  });

  document.getElementById('changePassBtn').addEventListener('click', function () {
    openModal('Ubah Password',
      '<label class="auth-field" for="cpOld"><span>Password lama</span>' +
      '<input type="password" id="cpOld" autocomplete="current-password"></label>' +
      '<label class="auth-field" for="cpNew"><span>Password baru (min. 8 karakter)</span>' +
      '<input type="password" id="cpNew" autocomplete="new-password"></label>' +
      '<label class="auth-field" for="cpConfirm"><span>Konfirmasi password baru</span>' +
      '<input type="password" id="cpConfirm" autocomplete="new-password"></label>' +
      '<p class="auth-err" id="cpErr" role="alert" hidden></p>',
      [
        { label: 'Batal' },
        {
          label: 'Simpan', kind: 'red', onClick: function () {
            var err = document.getElementById('cpErr');
            var oldP = document.getElementById('cpOld').value;
            var nw = document.getElementById('cpNew').value;
            var cf = document.getElementById('cpConfirm').value;
            function fail(m) { err.hidden = false; err.textContent = m; }
            var users = KarsaAuth.getUsers();
            var user = users.find(function (u) { return u.email === email; });
            if (!user || user.pass !== oldP) return fail('Password lama salah.');
            if (!nw || nw.length < 8) return fail('Password baru minimal 8 karakter.');
            if (nw !== cf) return fail('Konfirmasi password tidak sama.');
            users = users.map(function (u) {
              return u.email === email ? Object.assign({}, u, { pass: nw }) : u;
            });
            try { localStorage.setItem('karsa_users', JSON.stringify(users)); } catch (e) {}
            closeModal();
          }
        }
      ]);
  });

  document.getElementById('wipeBtn').addEventListener('click', function () {
    if (!confirm('Hapus SEMUA riwayat simulasi dan persona custom akun ini? Tindakan ini tidak bisa dibatalkan.')) return;
    save(HIST_KEY, load(HIST_KEY).filter(function (h) { return h.email !== email; }));
    save(PERS_KEY, load(PERS_KEY).filter(function (p) { return p.email !== email; }));
    try {
      localStorage.removeItem('karsa_input');
      localStorage.removeItem('karsa_persona');
      localStorage.removeItem('karsa_persona_label');
      sessionStorage.removeItem('karsa_prefill');
    } catch (e) {}
    selected.clear();
    renderAll();
  });

  function renderAll() {
    renderProfile();
    var hist = myHistory().sort(function (a, b) { return b.at - a.at; });
    var pers = myPersonas();
    renderStats(hist, pers);
    renderHistory(hist);
    renderPersonas(pers);
  }

  window.KarsaDashboard = { renderAll: renderAll, statusOf: statusOf };
  renderAll();
})();
