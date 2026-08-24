# 🎓 RoboLab — PHP CRUD Testing App

Aplikasi manajemen mahasiswa sederhana menggunakan **PHP + MySQL** dengan tampilan modern. Mendukung Create, Read, Update, Delete (CRUD) lengkap.

---

## 📁 Struktur File

```
testing-php/
├── index.php        ← Halaman utama (UI + tabel + modal form)
├── api.php          ← REST API handler (GET/POST/PUT/DELETE)
├── config.php       ← Konfigurasi database
├── test_db.php      ← Tester koneksi (buka ini dulu!)
├── database.sql     ← Script SQL untuk membuat database & tabel
└── README.md        ← Panduan ini
```

---

## ⚙️ Cara Menjalankan

### 1. Siapkan Web Server Lokal
Gunakan salah satu:
- **XAMPP** → [https://www.apachefriends.org](https://www.apachefriends.org)
- **Laragon** → [https://laragon.org](https://laragon.org)
- **WAMP** → [https://www.wampserver.com](https://www.wampserver.com)

### 2. Letakkan File di Folder yang Tepat

**XAMPP:**
```
C:\xampp\htdocs\testing-php\
```

**Laragon:**
```
C:\laragon\www\testing-php\
```

### 3. Import Database

Buka **phpMyAdmin** (`http://localhost/phpmyadmin`) lalu:

1. Klik **"New"** → buat database baru bernama `robolab_testing`
2. Klik database tersebut → tab **"Import"**
3. Pilih file `database.sql` → klik **"Go"**

**Atau via Command Line:**
```bash
mysql -u root -p < database.sql
```

### 4. Konfigurasi Koneksi

Edit file `config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // ← sesuaikan
define('DB_PASS', '');           // ← sesuaikan (kosong untuk XAMPP default)
define('DB_NAME', 'robolab_testing');
```

### 5. Buka di Browser

```
http://localhost/testing-php/test_db.php   ← cek koneksi dulu
http://localhost/testing-php/             ← aplikasi utama
```

---

## ✨ Fitur

| Fitur | Keterangan |
|-------|-----------|
| 📋 Tampil Data | Tabel mahasiswa dengan info NIM, nama, jurusan, IPK, status |
| ➕ Tambah | Form modal untuk input data baru |
| ✏️ Edit | Popup form pre-filled untuk mengubah data |
| 🗑️ Hapus | Konfirmasi dialog sebelum hapus |
| 🔍 Pencarian | Live search by nama / NIM / email |
| 🏷️ Filter | Filter by jurusan dan status |
| 📊 Statistik | Kartu ringkasan total, aktif, cuti/lulus, rata-rata IPK |
| 🔔 Toast | Notifikasi sukses / gagal |
| ✅ Validasi | Validasi client-side dan server-side |
| 🔄 REST API | `api.php` menggunakan PDO prepared statements |

---

## 🛠️ Endpoint API

| Method | URL | Fungsi |
|--------|-----|--------|
| GET | `api.php?action=list` | Ambil semua data (support `q`, `jurusan`, `status`) |
| GET | `api.php?action=get&id=1` | Ambil satu data |
| POST | `api.php?action=create` | Tambah data baru (JSON body) |
| PUT | `api.php?action=update` | Update data (JSON body dengan `id`) |
| DELETE | `api.php?action=delete&id=1` | Hapus data |

---

## 🔒 Keamanan yang Diterapkan

- **PDO Prepared Statements** — mencegah SQL Injection
- **Input Sanitization** — `trim()` + `htmlspecialchars()`
- **Validasi Server-Side** — cek field wajib, duplikat NIM
- **PDO Error Mode** — exception-based error handling

---

## 📸 Tampilan

- Dark theme premium dengan gradient & glow effects
- Google Font: **Outfit**
- Responsive untuk mobile & desktop
- IPK bar progress indicator
- Status badge berwarna (Aktif / Cuti / Lulus / DO)
- Loading spinner & animasi modal

---

> Dibuat untuk keperluan testing PHP + MySQL. Cocok sebagai template dasar aplikasi CRUD.
