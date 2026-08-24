<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RoboLab — Manajemen Mahasiswa</title>
<meta name="description" content="Aplikasi CRUD Mahasiswa sederhana dengan PHP dan MySQL" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0a0c14;
    --surface:   #0f1220;
    --surface2:  #161a2e;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.12);
    --primary:   #6366f1;
    --primary-g: #818cf8;
    --emerald:   #10b981;
    --amber:     #f59e0b;
    --rose:      #f43f5e;
    --cyan:      #06b6d4;
    --text:      #e2e8f0;
    --text-muted:#94a3b8;
    --text-dim:  #475569;
    --radius:    14px;
    --shadow:    0 8px 32px rgba(0,0,0,0.5);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Outfit', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* BG mesh */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 40% at 20% 20%, rgba(99,102,241,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 50% 30% at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .app { position: relative; z-index: 1; max-width: 1200px; margin: 0 auto; padding: 0 20px 60px; }

  /* HEADER */
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 0 32px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
  }

  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--cyan) 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; box-shadow: 0 0 24px rgba(99,102,241,0.4);
  }
  .logo h1 { font-size: 1.4rem; font-weight: 700; }
  .logo span { color: var(--primary-g); }
  .header-badge {
    display: flex; align-items: center; gap: 8px;
    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
    color: var(--emerald); padding: 6px 14px; border-radius: 99px; font-size: 0.78rem; font-weight: 600;
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--emerald); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }

  /* STATS */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color .2s, transform .2s;
  }
  .stat-card:hover { border-color: var(--border2); transform: translateY(-2px); }
  .stat-label { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--text-dim); margin-bottom: 8px; }
  .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
  .stat-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }
  .c-indigo  { color: var(--primary-g); }
  .c-emerald { color: var(--emerald); }
  .c-amber   { color: var(--amber); }
  .c-cyan    { color: var(--cyan); }

  /* TOOLBAR */
  .toolbar {
    display: flex; gap: 12px; align-items: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 16px; margin-bottom: 20px;
  }
  .search-wrap { position: relative; flex: 1; }
  .search-wrap svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); opacity: .4; }
  .search-wrap input {
    width: 100%; padding: 10px 14px 10px 40px;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text); border-radius: 10px; font-family: inherit; font-size: .9rem;
    transition: border-color .2s;
  }
  .search-wrap input:focus { outline: none; border-color: var(--primary); }
  .search-wrap input::placeholder { color: var(--text-dim); }

  select {
    padding: 10px 14px; background: var(--surface2);
    border: 1px solid var(--border); color: var(--text);
    border-radius: 10px; font-family: inherit; font-size: .88rem; cursor: pointer;
    transition: border-color .2s;
  }
  select:focus { outline: none; border-color: var(--primary); }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; font-family: inherit;
    font-size: .88rem; font-weight: 600; cursor: pointer; border: none;
    transition: all .2s; white-space: nowrap;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary) 0%, #818cf8 100%);
    color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,0.35);
  }
  .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.5); }
  .btn-sm { padding: 6px 13px; font-size: .78rem; }
  .btn-edit { background: rgba(99,102,241,0.12); border: 1px solid rgba(99,102,241,0.25); color: var(--primary-g); }
  .btn-edit:hover { background: rgba(99,102,241,0.22); }
  .btn-del  { background: rgba(244,63,94,0.1); border: 1px solid rgba(244,63,94,0.25); color: var(--rose); }
  .btn-del:hover  { background: rgba(244,63,94,0.2); }
  .btn-cancel { background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted); }
  .btn-cancel:hover { background: var(--border); }

  /* TABLE */
  .table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
  }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: var(--surface2); border-bottom: 1px solid var(--border); }
  thead th {
    padding: 14px 16px; text-align: left; font-size: .73rem;
    font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-dim);
  }
  tbody tr { border-bottom: 1px solid var(--border); transition: background .15s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.025); }
  tbody td { padding: 14px 16px; font-size: .875rem; }

  .nim-badge {
    font-size: .72rem; font-weight: 700; font-family: monospace;
    background: rgba(6,182,212,0.12); color: var(--cyan);
    border: 1px solid rgba(6,182,212,0.2); padding: 3px 8px; border-radius: 6px;
  }

  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: .72rem; font-weight: 600; padding: 3px 10px; border-radius: 99px;
  }
  .st-aktif  { background: rgba(16,185,129,0.12);  color: var(--emerald);    border: 1px solid rgba(16,185,129,0.25); }
  .st-cuti   { background: rgba(245,158,11,0.12);  color: var(--amber);      border: 1px solid rgba(245,158,11,0.25); }
  .st-lulus  { background: rgba(99,102,241,0.12);  color: var(--primary-g);  border: 1px solid rgba(99,102,241,0.25); }
  .st-do     { background: rgba(244,63,94,0.12);   color: var(--rose);       border: 1px solid rgba(244,63,94,0.25);  }

  .ipk-bar { display: flex; align-items: center; gap: 8px; }
  .ipk-track { flex: 1; height: 4px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
  .ipk-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, var(--emerald), var(--cyan)); transition: width .5s; }

  .empty-state {
    text-align: center; padding: 60px 20px; color: var(--text-dim);
  }
  .empty-state svg { width: 48px; height: 48px; margin: 0 auto 16px; opacity: .25; }

  /* MODAL */
  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);
    z-index: 100; display: none; align-items: center; justify-content: center; padding: 20px;
  }
  .overlay.show { display: flex; }
  .modal {
    background: var(--surface); border: 1px solid var(--border2);
    border-radius: 20px; width: 100%; max-width: 600px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.7);
    animation: slideUp .25s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 24px 28px 20px; border-bottom: 1px solid var(--border);
  }
  .modal-title { font-size: 1.1rem; font-weight: 700; }
  .modal-body { padding: 24px 28px; }
  .modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 28px 24px; border-top: 1px solid var(--border); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group.full { grid-column: 1 / -1; }
  .form-group label { font-size: .78rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
  .form-group input, .form-group select {
    padding: 11px 14px; background: var(--surface2);
    border: 1px solid var(--border); color: var(--text);
    border-radius: 10px; font-family: inherit; font-size: .9rem;
    width: 100%; transition: border-color .2s;
  }
  .form-group input:focus, .form-group select:focus { outline: none; border-color: var(--primary); }

  .close-btn {
    background: none; border: none; color: var(--text-dim);
    cursor: pointer; font-size: 1.3rem; line-height: 1;
    width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
    border-radius: 8px; transition: background .15s, color .15s;
  }
  .close-btn:hover { background: var(--border); color: var(--text); }

  /* TOAST */
  #toast {
    position: fixed; bottom: 28px; right: 28px; z-index: 999;
    display: flex; align-items: center; gap: 12px;
    padding: 14px 20px; border-radius: 12px;
    font-size: .9rem; font-weight: 600;
    box-shadow: var(--shadow);
    transform: translateY(80px); opacity: 0;
    transition: all .35s cubic-bezier(.34,1.56,.64,1);
    pointer-events: none;
  }
  #toast.show { transform: translateY(0); opacity: 1; }
  #toast.success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: var(--emerald); }
  #toast.error   { background: rgba(244,63,94,0.15);  border: 1px solid rgba(244,63,94,0.3);  color: var(--rose); }

  /* LOADING */
  .spinner {
    width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.15);
    border-top-color: var(--primary-g); border-radius: 50%; animation: spin .7s linear infinite; display: none;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* CONFIRM DIALOG */
  .confirm-box {
    background: var(--surface); border: 1px solid rgba(244,63,94,0.3);
    border-radius: 16px; padding: 24px 28px; max-width: 380px; width: 100%;
    box-shadow: var(--shadow); animation: slideUp .25s ease;
  }
  .confirm-box h3 { font-size: 1rem; margin-bottom: 8px; }
  .confirm-box p  { font-size: .875rem; color: var(--text-muted); margin-bottom: 20px; }

  @media (max-width: 768px) {
    .stats { grid-template-columns: repeat(2,1fr); }
    .toolbar { flex-wrap: wrap; }
    .form-grid { grid-template-columns: 1fr; }
    .stat-value { font-size: 1.5rem; }
    header { flex-direction: column; gap: 12px; align-items: flex-start; }
  }
</style>
</head>
<body>

<div class="app">

  <!-- HEADER -->
  <header>
    <div class="logo">
      <div class="logo-icon">🎓</div>
      <div>
        <h1>RoboLab <span>CRUD</span></h1>
        <p style="font-size:.75rem;color:var(--text-dim);margin-top:2px;">PHP + MySQL — Manajemen Mahasiswa</p>
      </div>
    </div>
    <div class="header-badge">
      <div class="dot"></div>
      Database Connected
    </div>
  </header>

  <!-- STATS -->
  <div class="stats" id="stats">
    <div class="stat-card">
      <div class="stat-label">Total Mahasiswa</div>
      <div class="stat-value c-indigo" id="s-total">—</div>
      <div class="stat-sub">Semua angkatan</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Status Aktif</div>
      <div class="stat-value c-emerald" id="s-aktif">—</div>
      <div class="stat-sub">Sedang kuliah</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cuti / Lulus</div>
      <div class="stat-value c-amber" id="s-cuti">—</div>
      <div class="stat-sub">Tidak aktif semester ini</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Rata-rata IPK</div>
      <div class="stat-value c-cyan" id="s-ipk">—</div>
      <div class="stat-sub">Seluruh mahasiswa</div>
    </div>
  </div>

  <!-- TOOLBAR -->
  <div class="toolbar">
    <div class="search-wrap">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.868-3.834zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
      <input type="text" id="searchInput" placeholder="Cari nama, NIM, atau email..." />
    </div>
    <select id="filterJurusan">
      <option value="">Semua Jurusan</option>
      <option>Teknik Informatika</option>
      <option>Sistem Informasi</option>
      <option>Teknik Elektro</option>
      <option>Manajemen Informatika</option>
    </select>
    <select id="filterStatus">
      <option value="">Semua Status</option>
      <option>Aktif</option>
      <option>Cuti</option>
      <option>Lulus</option>
      <option>DO</option>
    </select>
    <button class="btn btn-primary" onclick="openModal()">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
      Tambah Mahasiswa
    </button>
  </div>

  <!-- TABLE -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>NIM</th>
          <th>Nama Mahasiswa</th>
          <th>Jurusan</th>
          <th>Angkatan</th>
          <th>IPK</th>
          <th>Status</th>
          <th style="text-align:center">Aksi</th>
        </tr>
      </thead>
      <tbody id="tableBody">
        <tr><td colspan="7" class="empty-state">
          <div class="spinner" id="tableSpinner" style="display:block;margin:40px auto;"></div>
        </td></tr>
      </tbody>
    </table>
  </div>

  <div style="margin-top:12px;font-size:.78rem;color:var(--text-dim);text-align:center;" id="rowCount"></div>
</div>

<!-- MODAL TAMBAH / EDIT -->
<div class="overlay" id="modal">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title" id="modalTitle">Tambah Mahasiswa</div>
      <button class="close-btn" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="mahasiswaForm">
        <input type="hidden" id="fId" />
        <div class="form-grid">
          <div class="form-group">
            <label>NIM *</label>
            <input type="text" id="fNim" placeholder="Contoh: 2023001" required />
          </div>
          <div class="form-group">
            <label>Nama Lengkap *</label>
            <input type="text" id="fNama" placeholder="Nama lengkap mahasiswa" required />
          </div>
          <div class="form-group">
            <label>Jurusan *</label>
            <select id="fJurusan" required>
              <option value="">Pilih Jurusan</option>
              <option>Teknik Informatika</option>
              <option>Sistem Informasi</option>
              <option>Teknik Elektro</option>
              <option>Manajemen Informatika</option>
            </select>
          </div>
          <div class="form-group">
            <label>Angkatan *</label>
            <input type="number" id="fAngkatan" placeholder="2023" min="2000" max="2099" required />
          </div>
          <div class="form-group full">
            <label>Email *</label>
            <input type="email" id="fEmail" placeholder="mahasiswa@mail.com" required />
          </div>
          <div class="form-group">
            <label>No. HP</label>
            <input type="text" id="fHp" placeholder="08xxxxxxxxxx" />
          </div>
          <div class="form-group">
            <label>IPK (0.00 – 4.00)</label>
            <input type="number" id="fIpk" placeholder="3.75" min="0" max="4" step="0.01" />
          </div>
          <div class="form-group full">
            <label>Status</label>
            <select id="fStatus">
              <option>Aktif</option>
              <option>Cuti</option>
              <option>Lulus</option>
              <option>DO</option>
            </select>
          </div>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-cancel" onclick="closeModal()">Batal</button>
      <button class="btn btn-primary" id="saveBtn" onclick="saveMahasiswa()">
        <span id="saveBtnText">Simpan</span>
        <div class="spinner" id="saveSpinner"></div>
      </button>
    </div>
  </div>
</div>

<!-- CONFIRM DELETE -->
<div class="overlay" id="confirmModal">
  <div class="confirm-box">
    <h3>🗑️ Hapus Data?</h3>
    <p>Data mahasiswa "<strong id="confirmName"></strong>" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
    <div style="display:flex;gap:10px;justify-content:flex-end;">
      <button class="btn btn-cancel" onclick="closeConfirm()">Batal</button>
      <button class="btn btn-del" id="confirmDelBtn" onclick="confirmDelete()">Ya, Hapus</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toast"></div>

<script>
// ─── CONFIG ─────────────────────────────────────────────────
const API = 'api.php';
let deleteId   = null;
let isEditing  = false;

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  document.getElementById('searchInput').addEventListener('input', debounce(loadData, 300));
  document.getElementById('filterJurusan').addEventListener('change', loadData);
  document.getElementById('filterStatus').addEventListener('change', loadData);
});

// ─── LOAD DATA ───────────────────────────────────────────────
async function loadData() {
  const q       = document.getElementById('searchInput').value;
  const jurusan = document.getElementById('filterJurusan').value;
  const status  = document.getElementById('filterStatus').value;

  showTableSpinner(true);
  try {
    const params = new URLSearchParams({ action:'list', q, jurusan, status });
    const res    = await fetch(`${API}?${params}`);
    const json   = await res.json();

    if (!json.success) { showToast('Gagal memuat data: ' + json.message, 'error'); return; }

    renderStats(json.stats);
    renderTable(json.data);
    document.getElementById('rowCount').textContent =
      `Menampilkan ${json.data.length} dari ${json.stats.total} mahasiswa`;
  } catch(e) {
    showToast('Koneksi ke server gagal. Pastikan PHP server berjalan.', 'error');
    document.getElementById('tableBody').innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>Tidak dapat terhubung ke database.<br/><small>Pastikan server PHP dan MySQL aktif, lalu atur <code>config.php</code>.</small></p>
      </td></tr>`;
  } finally {
    showTableSpinner(false);
  }
}

function renderStats(s) {
  if (!s) return;
  document.getElementById('s-total').textContent = s.total ?? '—';
  document.getElementById('s-aktif').textContent = s.aktif ?? '—';
  document.getElementById('s-cuti').textContent  = (+(s.cuti||0)) + (+(s.lulus||0));
  document.getElementById('s-ipk').textContent   = s.avg_ipk ?? '—';
}

function renderTable(rows) {
  const tbody = document.getElementById('tableBody');
  if (!rows || rows.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>Tidak ada data yang cocok.</p>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(m => {
    const ipkPct = Math.round((m.ipk / 4) * 100);
    const stClass = { 'Aktif':'st-aktif', 'Cuti':'st-cuti', 'Lulus':'st-lulus', 'DO':'st-do' }[m.status] || 'st-aktif';
    return `
    <tr>
      <td><span class="nim-badge">${esc(m.nim)}</span></td>
      <td>
        <div style="font-weight:600">${esc(m.nama)}</div>
        <div style="font-size:.75rem;color:var(--text-dim)">${esc(m.email)}</div>
      </td>
      <td style="color:var(--text-muted);font-size:.85rem">${esc(m.jurusan)}</td>
      <td style="font-weight:600;color:var(--text-muted)">${esc(m.angkatan)}</td>
      <td style="min-width:110px">
        <div class="ipk-bar">
          <div class="ipk-track"><div class="ipk-fill" style="width:${ipkPct}%"></div></div>
          <span style="font-size:.8rem;font-weight:700;color:var(--cyan);min-width:32px">${parseFloat(m.ipk).toFixed(2)}</span>
        </div>
      </td>
      <td><span class="status-badge ${stClass}">${esc(m.status)}</span></td>
      <td style="text-align:center">
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-sm btn-edit" onclick="editMahasiswa(${m.id})">✏️ Edit</button>
          <button class="btn btn-sm btn-del" onclick="askDelete(${m.id},'${esc(m.nama)}')">🗑️ Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── MODAL ───────────────────────────────────────────────────
function openModal(edit = false) {
  isEditing = edit;
  document.getElementById('modalTitle').textContent = edit ? 'Edit Data Mahasiswa' : 'Tambah Mahasiswa Baru';
  if (!edit) document.getElementById('mahasiswaForm').reset();
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

async function editMahasiswa(id) {
  try {
    const res  = await fetch(`${API}?action=get&id=${id}`);
    const json = await res.json();
    if (!json.success) { showToast(json.message, 'error'); return; }
    const m = json.data;

    document.getElementById('fId').value       = m.id;
    document.getElementById('fNim').value      = m.nim;
    document.getElementById('fNama').value     = m.nama;
    document.getElementById('fJurusan').value  = m.jurusan;
    document.getElementById('fAngkatan').value = m.angkatan;
    document.getElementById('fEmail').value    = m.email;
    document.getElementById('fHp').value       = m.no_hp || '';
    document.getElementById('fIpk').value      = m.ipk;
    document.getElementById('fStatus').value   = m.status;

    openModal(true);
  } catch(e) {
    showToast('Gagal memuat data.', 'error');
  }
}

async function saveMahasiswa() {
  const payload = {
    id:       document.getElementById('fId').value,
    nim:      document.getElementById('fNim').value.trim(),
    nama:     document.getElementById('fNama').value.trim(),
    jurusan:  document.getElementById('fJurusan').value,
    angkatan: document.getElementById('fAngkatan').value,
    email:    document.getElementById('fEmail').value.trim(),
    no_hp:    document.getElementById('fHp').value.trim(),
    ipk:      document.getElementById('fIpk').value,
    status:   document.getElementById('fStatus').value,
  };

  if (!payload.nim || !payload.nama || !payload.jurusan || !payload.angkatan || !payload.email) {
    showToast('Harap isi semua field wajib (*)', 'error'); return;
  }

  setBtnLoading(true);
  try {
    const method = isEditing ? 'PUT' : 'POST';
    const action = isEditing ? 'update' : 'create';
    const res    = await fetch(`${API}?action=${action}`, {
      method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (json.success) {
      showToast(json.message, 'success');
      closeModal();
      loadData();
    } else {
      showToast(json.message, 'error');
    }
  } catch(e) {
    showToast('Request gagal. Periksa koneksi server.', 'error');
  } finally {
    setBtnLoading(false);
  }
}

// ─── DELETE ──────────────────────────────────────────────────
function askDelete(id, nama) {
  deleteId = id;
  document.getElementById('confirmName').textContent = nama;
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirm() {
  deleteId = null;
  document.getElementById('confirmModal').classList.remove('show');
}

async function confirmDelete() {
  if (!deleteId) return;
  const btn = document.getElementById('confirmDelBtn');
  btn.textContent = 'Menghapus...'; btn.disabled = true;
  try {
    const res  = await fetch(`${API}?action=delete&id=${deleteId}`, { method:'DELETE' });
    const json = await res.json();
    showToast(json.message, json.success ? 'success' : 'error');
    if (json.success) loadData();
  } catch(e) {
    showToast('Gagal menghapus data.', 'error');
  } finally {
    btn.textContent = 'Ya, Hapus'; btn.disabled = false;
    closeConfirm();
  }
}

// ─── HELPERS ─────────────────────────────────────────────────
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  t.className = 'show ' + type;
  t.innerHTML = (type==='success'?'✅ ':'❌ ') + msg;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3500);
}

function showTableSpinner(show) {
  const spinner = document.getElementById('tableSpinner');
  if (spinner) spinner.style.display = show ? 'block' : 'none';
}

function setBtnLoading(on) {
  document.getElementById('saveBtnText').textContent = on ? 'Menyimpan...' : 'Simpan';
  document.getElementById('saveSpinner').style.display = on ? 'block' : 'none';
  document.getElementById('saveBtn').disabled = on;
}

function debounce(fn, delay) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// Close modals on overlay click
document.getElementById('modal').addEventListener('click', e => { if(e.target===e.currentTarget) closeModal(); });
document.getElementById('confirmModal').addEventListener('click', e => { if(e.target===e.currentTarget) closeConfirm(); });
</script>
</body>
</html>
