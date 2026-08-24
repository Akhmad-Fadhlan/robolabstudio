<?php
// ============================================
// api.php - REST API Handler (CRUD)
// ============================================

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    $db = getDB();

    // ── READ ALL ──────────────────────────────────────────────
    if ($method === 'GET' && $action === 'list') {
        $search   = '%' . trim($_GET['q'] ?? '') . '%';
        $jurusan  = trim($_GET['jurusan'] ?? '');
        $status   = trim($_GET['status'] ?? '');

        $sql  = "SELECT * FROM mahasiswa WHERE (nama LIKE :q OR nim LIKE :q OR email LIKE :q)";
        $params = [':q' => $search];

        if ($jurusan !== '') {
            $sql .= " AND jurusan = :jurusan";
            $params[':jurusan'] = $jurusan;
        }
        if ($status !== '') {
            $sql .= " AND status = :status";
            $params[':status'] = $status;
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Stats
        $stats = $db->query("SELECT
            COUNT(*) as total,
            SUM(status='Aktif') as aktif,
            SUM(status='Cuti') as cuti,
            SUM(status='Lulus') as lulus,
            ROUND(AVG(ipk),2) as avg_ipk
            FROM mahasiswa")->fetch();

        echo json_encode(['success' => true, 'data' => $rows, 'stats' => $stats]);
        exit;
    }

    // ── READ ONE ──────────────────────────────────────────────
    if ($method === 'GET' && $action === 'get') {
        $id   = (int)($_GET['id'] ?? 0);
        $stmt = $db->prepare("SELECT * FROM mahasiswa WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row  = $stmt->fetch();

        if (!$row) jsonResponse(false, 'Data tidak ditemukan.');
        echo json_encode(['success' => true, 'data' => $row]);
        exit;
    }

    // ── CREATE ────────────────────────────────────────────────
    if ($method === 'POST' && $action === 'create') {
        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        $required = ['nim','nama','jurusan','angkatan','email'];
        foreach ($required as $field) {
            if (empty(trim($input[$field] ?? ''))) {
                jsonResponse(false, "Field '$field' wajib diisi.");
            }
        }

        // Cek NIM duplikat
        $check = $db->prepare("SELECT id FROM mahasiswa WHERE nim = :nim");
        $check->execute([':nim' => trim($input['nim'])]);
        if ($check->fetch()) jsonResponse(false, "NIM sudah terdaftar.");

        $stmt = $db->prepare("INSERT INTO mahasiswa
            (nim, nama, jurusan, angkatan, email, no_hp, ipk, status)
            VALUES (:nim, :nama, :jurusan, :angkatan, :email, :no_hp, :ipk, :status)");

        $stmt->execute([
            ':nim'      => trim($input['nim']),
            ':nama'     => trim($input['nama']),
            ':jurusan'  => trim($input['jurusan']),
            ':angkatan' => (int)$input['angkatan'],
            ':email'    => trim($input['email']),
            ':no_hp'    => trim($input['no_hp'] ?? ''),
            ':ipk'      => (float)($input['ipk'] ?? 0),
            ':status'   => $input['status'] ?? 'Aktif',
        ]);

        jsonResponse(true, 'Mahasiswa berhasil ditambahkan!', ['id' => $db->lastInsertId()]);
    }

    // ── UPDATE ────────────────────────────────────────────────
    if ($method === 'PUT' && $action === 'update') {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $id    = (int)($input['id'] ?? 0);

        if (!$id) jsonResponse(false, 'ID tidak valid.');

        // Cek NIM duplikat (selain diri sendiri)
        $check = $db->prepare("SELECT id FROM mahasiswa WHERE nim = :nim AND id != :id");
        $check->execute([':nim' => trim($input['nim']), ':id' => $id]);
        if ($check->fetch()) jsonResponse(false, "NIM sudah digunakan mahasiswa lain.");

        $stmt = $db->prepare("UPDATE mahasiswa SET
            nim=:nim, nama=:nama, jurusan=:jurusan, angkatan=:angkatan,
            email=:email, no_hp=:no_hp, ipk=:ipk, status=:status
            WHERE id=:id");

        $stmt->execute([
            ':id'       => $id,
            ':nim'      => trim($input['nim']),
            ':nama'     => trim($input['nama']),
            ':jurusan'  => trim($input['jurusan']),
            ':angkatan' => (int)$input['angkatan'],
            ':email'    => trim($input['email']),
            ':no_hp'    => trim($input['no_hp'] ?? ''),
            ':ipk'      => (float)($input['ipk'] ?? 0),
            ':status'   => $input['status'] ?? 'Aktif',
        ]);

        jsonResponse(true, 'Data berhasil diperbarui!');
    }

    // ── DELETE ────────────────────────────────────────────────
    if ($method === 'DELETE' && $action === 'delete') {
        $id   = (int)($_GET['id'] ?? 0);
        if (!$id) jsonResponse(false, 'ID tidak valid.');

        $stmt = $db->prepare("DELETE FROM mahasiswa WHERE id = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) jsonResponse(false, 'Data tidak ditemukan.');
        jsonResponse(true, 'Data berhasil dihapus!');
    }

    jsonResponse(false, 'Endpoint tidak ditemukan. Method: ' . $method . ', Action: ' . $action);

} catch (PDOException $e) {
    jsonResponse(false, 'Database error: ' . $e->getMessage());
} catch (Exception $e) {
    jsonResponse(false, 'Server error: ' . $e->getMessage());
}
