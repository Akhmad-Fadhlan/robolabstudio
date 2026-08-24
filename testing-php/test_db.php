<?php
// ============================================
// test_db.php - Tester Koneksi Database
// Buka file ini dulu untuk cek apakah MySQL OK
// ============================================

require_once 'config.php';

$results = [];

// 1. Cek ekstensi PDO
$results[] = [
    'label' => 'PDO Extension',
    'ok'    => extension_loaded('pdo'),
    'info'  => extension_loaded('pdo') ? 'Aktif' : 'TIDAK ADA - install php-pdo'
];

// 2. Cek PDO MySQL driver
$results[] = [
    'label' => 'PDO MySQL Driver',
    'ok'    => extension_loaded('pdo_mysql'),
    'info'  => extension_loaded('pdo_mysql') ? 'Aktif' : 'TIDAK ADA - install php-pdo-mysql'
];

// 3. Cek PHP version
$phpVer = phpversion();
$results[] = [
    'label' => 'PHP Version',
    'ok'    => version_compare($phpVer, '7.4', '>='),
    'info'  => 'PHP ' . $phpVer . (version_compare($phpVer, '7.4', '>=') ? ' ✓' : ' (min 7.4)')
];

// 4. Cek koneksi DB
$dbOk  = false;
$dbMsg = '';
try {
    $pdo   = getDB();
    $dbOk  = true;
    $dbMsg = 'Berhasil terhubung ke `' . DB_NAME . '` di ' . DB_HOST;
} catch (Exception $e) {
    $dbMsg = $e->getMessage();
}
$results[] = ['label' => 'Koneksi MySQL', 'ok' => $dbOk, 'info' => $dbMsg];

// 5. Cek tabel mahasiswa
$tableOk  = false;
$tableMsg = '';
if ($dbOk) {
    try {
        $pdo      = getDB();
        $q        = $pdo->query("SELECT COUNT(*) as cnt FROM mahasiswa");
        $cnt      = $q->fetchColumn();
        $tableOk  = true;
        $tableMsg = "Tabel ditemukan, berisi $cnt baris data";
    } catch (Exception $e) {
        $tableMsg = 'Tabel belum ada. Import database.sql terlebih dahulu! Error: ' . $e->getMessage();
    }
}
$results[] = ['label' => 'Tabel mahasiswa', 'ok' => $tableOk, 'info' => $tableMsg];

// 6. Cek write test API
$apiPath = __DIR__ . '/api.php';
$results[] = [
    'label' => 'File api.php',
    'ok'    => file_exists($apiPath),
    'info'  => file_exists($apiPath) ? 'Ada (' . number_format(filesize($apiPath)) . ' bytes)' : 'TIDAK DITEMUKAN'
];

$allOk = array_reduce($results, fn($c, $r) => $c && $r['ok'], true);
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DB Connection Tester</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Outfit', sans-serif;
    background: #0a0c14;
    color: #e2e8f0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
  }
  .card {
    background: #0f1220;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 36px;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  }
  .header {
    display: flex; align-items: center; gap: 14px;
    margin-bottom: 28px; padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .icon {
    width: 48px; height: 48px; border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #06b6d4);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    box-shadow: 0 0 24px rgba(99,102,241,0.4);
  }
  h1 { font-size: 1.3rem; font-weight: 700; }
  h1 span { color: #818cf8; }
  .subtitle { font-size: 0.8rem; color: #64748b; margin-top: 3px; }

  .result-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .result-item {
    display: flex; align-items: center; gap: 14px;
    background: #161a2e;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px;
    padding: 14px 16px;
  }
  .result-item.ok    { border-color: rgba(16,185,129,0.2); }
  .result-item.fail  { border-color: rgba(244,63,94,0.2); }
  .badge {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }
  .badge.ok   { background: rgba(16,185,129,0.15); }
  .badge.fail { background: rgba(244,63,94,0.15); }
  .result-label { font-weight: 600; font-size: .9rem; flex: 1; }
  .result-info  { font-size: .78rem; color: #64748b; font-family: 'JetBrains Mono', monospace; text-align: right; }
  .result-item.ok  .result-info { color: #10b981; }
  .result-item.fail .result-info { color: #f43f5e; }

  .summary {
    text-align: center; padding: 18px;
    border-radius: 14px; font-weight: 700; font-size: 1rem;
  }
  .summary.all-ok   { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #10b981; }
  .summary.has-fail { background: rgba(244,63,94,0.1);  border: 1px solid rgba(244,63,94,0.25);  color: #f43f5e; }

  .actions { display: flex; gap: 10px; margin-top: 20px; }
  .btn {
    flex: 1; padding: 11px; border-radius: 10px; font-family: inherit;
    font-size: .88rem; font-weight: 600; cursor: pointer; border: none;
    text-align: center; text-decoration: none;
    transition: all .2s;
  }
  .btn-primary {
    background: linear-gradient(135deg, #6366f1, #818cf8);
    color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,0.35);
  }
  .btn-primary:hover { transform: translateY(-1px); }
  .btn-secondary {
    background: #161a2e; border: 1px solid rgba(255,255,255,0.08);
    color: #94a3b8;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.05); }

  .hint {
    margin-top: 20px; padding: 14px 16px;
    background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
    border-radius: 12px; font-size: .8rem; color: #fbbf24; line-height: 1.6;
  }
  .hint strong { display: block; margin-bottom: 4px; }
  code { background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; font-family: 'JetBrains Mono'; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="icon">🔌</div>
    <div>
      <h1>Database <span>Tester</span></h1>
      <div class="subtitle">Cek semua komponen sebelum menjalankan aplikasi</div>
    </div>
  </div>

  <div class="result-list">
    <?php foreach ($results as $r): ?>
    <div class="result-item <?= $r['ok'] ? 'ok' : 'fail' ?>">
      <div class="badge <?= $r['ok'] ? 'ok' : 'fail' ?>"><?= $r['ok'] ? '✓' : '✗' ?></div>
      <div class="result-label"><?= htmlspecialchars($r['label']) ?></div>
      <div class="result-info"><?= htmlspecialchars($r['info']) ?></div>
    </div>
    <?php endforeach; ?>
  </div>

  <div class="summary <?= $allOk ? 'all-ok' : 'has-fail' ?>">
    <?= $allOk
      ? '🎉 Semua sistem siap! Aplikasi bisa dijalankan.'
      : '⚠️ Ada masalah yang perlu diperbaiki dahulu.' ?>
  </div>

  <div class="actions">
    <?php if ($allOk): ?>
      <a href="index.php" class="btn btn-primary">🚀 Buka Aplikasi</a>
    <?php endif; ?>
    <a href="test_db.php" class="btn btn-secondary">🔄 Cek Ulang</a>
  </div>

  <?php if (!$dbOk): ?>
  <div class="hint">
    <strong>💡 Cara memperbaiki koneksi database:</strong>
    1. Buka <code>config.php</code> dan sesuaikan <code>DB_USER</code> &amp; <code>DB_PASS</code><br/>
    2. Buka phpMyAdmin atau MySQL Workbench<br/>
    3. Jalankan file <code>database.sql</code> untuk membuat database &amp; tabel<br/>
    4. Pastikan server MySQL sudah berjalan (XAMPP/WAMP/Laragon)
  </div>
  <?php endif; ?>

  <?php if ($dbOk && !$tableOk): ?>
  <div class="hint">
    <strong>💡 Tabel belum ada:</strong>
    Buka phpMyAdmin → pilih database <code>robolab_testing</code> → klik <strong>Import</strong> → pilih file <code>database.sql</code>
  </div>
  <?php endif; ?>
</div>
</body>
</html>
