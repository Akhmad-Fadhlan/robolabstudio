# Product Requirements Document (PRD) — v2.0

## RoboLab Studio — Public Landing Page (Scoped Build)

**Versi:** 2.0 (Revisi — Scope Dipersempit)
**Status:** Product Definition — Ready for Build
**Platform:** Web Responsive
**Produk:** RoboLab Studio
**Brand:** RoboLab Studio × Pymasterclass

> **Perubahan dari v1.0:** Scope website dipersempit. Yang dibangun **hanya 4 halaman** yang sudah punya referensi visual (mockup dari ChatGPT): **Home, Features, Documentation (Getting Started), dan Download**. Semua halaman lain (Projects list, Learning Hub, Boards, Libraries, Changelog, Community, dsb.) dipindahkan ke *Phase 2 / Backlog* dan **tidak dibangun** sampai ada referensi desain baru. Nav item untuk halaman-halaman itu tetap boleh muncul di navbar sebagai link, tapi route-nya belum dibuat (atau diarahkan ke "Coming Soon").

---

# 1. Product Overview

RoboLab Studio adalah platform pembelajaran dan development environment untuk **IoT, Robotika, Arduino, ESP32, ESP8266, Micro:Bit, Python, MicroPython, Visual Block Programming, Virtual Hardware Simulation, dan AI-assisted programming**.

Website publik ini, pada rilis pertama, berfungsi sebagai:

> **Landing Page + Feature Showcase + Getting-Started Docs + Download Center**

Website bukan menggantikan aplikasi RoboLab Studio. Tugasnya: memperkenalkan produk, menampilkan fitur secara visual, memberi jalur onboarding awal (getting started), dan menyediakan file installer.

---

# 2. Scope Halaman (Definisi Final)

Hanya 4 halaman berikut yang masuk build v2.0. Setiap halaman **wajib mengacu langsung** ke mockup yang sudah disediakan (lihat referensi file di setiap section).

| # | Halaman | File Referensi Mockup | Status |
|---|---|---|---|
| 1 | **Home** (Hero + Platform Strip + Feature Preview) | `ChatGPT_Image_Aug_15__2026__09_56_43_AM.png` | In Scope |
| 2 | **Features** | `ChatGPT_Image_Aug_15__2026__09_59_28_AM.png` | In Scope |
| 3 | **Documentation → Getting Started** | `ChatGPT_Image_Aug_15__2026__10_05_41_AM.png` | In Scope |
| 4 | **Download** | `ChatGPT_Image_Aug_15__2026__10_03_30_AM.png` | In Scope |

Semua halaman lain dari PRD v1.0 (Projects list, Learning Hub, Boards, Libraries, Changelog, Community, full Documentation portal di luar Getting Started) → **Backlog**, tidak dikerjakan di rilis ini karena belum ada mockup acuan.

---

# 3. Product Goals (v2.0)

Untuk 4 halaman yang di-scope, website harus mampu:

1. Menjelaskan RoboLab Studio dalam beberapa detik pertama (Home).
2. Menampilkan visual aplikasi asli sebagai bukti produk nyata, bukan mockup generik.
3. Menjelaskan 8 fitur utama secara ringkas dengan preview kode/UI (Features).
4. Memberi pengguna baru jalur "5 langkah cepat" untuk mulai (Documentation → Getting Started).
5. Menyediakan halaman download yang lengkap dengan checksum, requirement, dan langkah instalasi (Download).
6. Mendorong konversi: Home → Features → Getting Started → Download.

---

# 4. Target User

Tidak berubah dari v1.0: **Student, Teacher, Maker/Hobbyist, Developer.** Lihat detail kebutuhan masing-masing di dokumen asli — tetap berlaku sebagai konteks pesan/copywriting, walau halaman yang melayani mereka secara spesifik (Learning Hub, Boards) belum dibangun di rilis ini.

---

# 5. Struktur Website (v2.0 — Scoped)

```text
RoboLab Studio Website (v2.0 build)
│
├── Home                              ← in scope
│
├── Features                          ← in scope
│
├── Documentation
│   └── Getting Started               ← in scope (satu-satunya sub-halaman docs yang dibangun)
│
└── Download                          ← in scope

Navbar juga menampilkan (link non-fungsional / "Coming Soon" sampai ada mockup):
├── Projects        (backlog)
├── Learning         (backlog)
└── Community        (backlog)
```

Navbar tetap menampilkan semua item seperti pada mockup (Home, Features, Documentation, Projects, Learning, Download, Community + GitHub + Download Now button) agar visual konsisten dengan referensi — tapi hanya 4 route di atas yang punya halaman nyata.

---

# 6. Halaman 1 — Home

**Acuan:** `ChatGPT_Image_Aug_15__2026__09_56_43_AM.png`

Ikuti layout mockup persis:

1. **Navbar** — logo "RoboLab Studio" + tagline "Build. Simulate. Code. Create.", menu (Features, Documentation, Projects, Learning, Download), GitHub icon, dark-mode toggle, tombol primer "Download Now" (gradient biru→ungu).
2. **Hero (2 kolom)**
   - Kiri: badge "All-in-One IDE for IoT & Robotics Education", headline **"Build. Simulate. Code. Create."** (kata "Simulate" biru, "Code" ungu), sub-copy produk, tombol "Download RoboLab Studio" (gradient) + "Explore Documentation" (outline), baris kecil: Gratis & Open Source · Mudah digunakan · Cross Platform.
   - Kanan: **screenshot aplikasi asli** di dalam window frame (title bar palsu "RoboLab Studio" dengan tombol Open/Save/Verify/Upload/Install Core/Run Python, dan badge "CONNECTED"). Gunakan crop dari `lp.jpg` / `sim.jpg` sebagai sumber visual asli, bukan ilustrasi.
3. **Platform strip** — "Didukung oleh berbagai platform dan board populer": Arduino, ESP32, ESP8266, Micro:Bit, Python, MicroPython dengan icon.
4. **Feature preview grid (6 kartu, potongan dari Features)** — Visual Block Programming, Code Editor, Virtual Hardware Simulator, Python & MicroPython, Library & Board Manager, RoboLab AI Assistant. Setiap kartu: icon badge berwarna, judul, 1 kalimat deskripsi, cuplikan kode/UI mini.

**Catatan desain:** kartu preview di Home adalah versi ringkas (tanpa expand chevron) dari kartu penuh di halaman Features — jangan duplikasi konten identik kata-per-kata, gunakan versi 1 kalimat lebih pendek.

---

# 7. Halaman 2 — Features

**Acuan:** `ChatGPT_Image_Aug_15__2026__09_59_28_AM.png`

1. Badge "Powerful Features", headline **"Everything You Need in One Workspace"**, sub-copy.
2. Baris 4 highlight ringkas (icon + label): All-in-One, Multi Platform, Open Source, Education First.
3. **Grid 8 kartu fitur** (4×2), masing-masing dengan icon badge warna beda, judul, deskripsi 1 baris, dan **screenshot mini asli** dari aplikasi:
   - Visual Block Programming — potongan block programming asli
   - Code Editor — potongan editor kode gelap (syntax highlighted)
   - Virtual Hardware Simulator — potongan `sim.jpg`
   - Python & MicroPython — potongan `lp.jpg` (terminal + kode)
   - Library Manager — potongan `lb.jpg`
   - Board Manager — daftar board (ESP32 DevKit V1, ESP8266 NodeMCU, Arduino Uno) dengan tombol Install
   - Serial Monitor & Terminal — log serial asli
   - RoboLab AI Assistant — potongan `ter.png` (chat Asisten RoboLab AI)
4. CTA band bawah: "Siap membangun project IoT & Robotika Anda?" + tombol "Download RoboLab Studio" dan "Lihat Dokumentasi".

**Wajib:** semua 8 thumbnail harus diambil/di-crop dari screenshot aplikasi asli (`lp.jpg`, `sim.jpg`, `home.jpg`, `ter.png`, `lb.jpg`), **bukan ilustrasi buatan** — ini yang membedakan v2.0 dari mockup generik v1.0.

---

# 8. Halaman 3 — Documentation → Getting Started

**Acuan:** `ChatGPT_Image_Aug_15__2026__10_05_41_AM.png`

Layout 3 kolom (sidebar kiri, konten tengah, "On this page" kanan):

1. **Sidebar kiri** — grup: Getting Started (Getting Started, Installation, First Project), Workspace (Workspace Overview, Connecting Hardware, Uploading Code), Programming (Visual Block, Code Editor, Python, MicroPython), Hardware (Board Manager, Library Manager, Supported Boards), Tools (Virtual Simulator, Serial Monitor, Terminal), AI Assistant (RoboLab AI Assistant), Troubleshooting (Common Issues, FAQ). Item aktif: "Getting Started" (highlight biru).
   - *Catatan v2.0:* sidebar boleh menampilkan seluruh daftar link ini untuk konsistensi visual dengan mockup, tapi **hanya halaman "Getting Started" yang perlu benar-benar dibangun**; item lain non-fungsional/"Coming Soon" di rilis ini.
2. **Konten utama**
   - Breadcrumb: Docs / Getting Started
   - Badge "Getting Started", H1 "Getting Started", sub-copy singkat.
   - 3 kartu value: Mudah untuk Pemula, Powerful & Fleksibel, Belajar Lebih Cepat.
   - Info banner: "Belajar dengan Simulasi atau Hardware Nyata" + thumbnail kecil breadboard/board (dari `sim.jpg`).
   - **"Langkah Cepat"** — 5 step card berurutan dengan panah penghubung: (1) Download & Install, (2) Hubungkan Board, (3) Pilih Board & Port, (4) Buat Project, (5) Upload & Jalankan.
   - Tombol besar "Buat Project Pertama Anda →".
   - Navigasi Prev/Next: "← Installation" / "Workspace Overview →" (link, boleh non-aktif/placeholder karena halaman tsb belum dibangun).
3. **Sidebar kanan ("On this page")** — anchor list (Langkah Cepat, Download & Install, dst.), kotak "Masih bingung? → Kunjungi Community" dan kotak "Video Tutorial → Tonton Sekarang" (kedua CTA ini boleh mengarah ke link eksternal/placeholder, karena halaman Community belum ada).

---

# 9. Halaman 4 — Download

**Acuan:** `ChatGPT_Image_Aug_15__2026__10_03_30_AM.png`

1. Breadcrumb: Home / Download. Badge "Download RoboLab Studio".
2. **Hero 2 kolom**
   - Kiri: headline **"Download RoboLab Studio"**, sub-copy, 4 highlight (Aman & Terverifikasi, Selalu Update, Mudah Diinstal, Open Source).
   - Kanan: **screenshot aplikasi asli** di window frame (mirip Home tapi versi lebih lebar, menampilkan Explorer + Visual Block + Code + Serial Monitor).
3. **Kartu rekomendasi platform (Windows sebagai default/rekomendasi)** — logo OS, versi (v1.2.0, badge "Latest"), ukuran file, tanggal rilis, tombol besar "Download for Windows", link "Alternatif: Mirror Download", baris SHA256 checksum + Digital Signature (Verified) + Virus Total (Clean).
   - Panel kanan: System Requirements (OS, RAM, Storage, Resolusi, Koneksi internet).
   - *Catatan v2.0:* PRD v1.0 menyebut 3 kartu platform (Windows/macOS/Linux) berdampingan — mockup aktual hanya menampilkan **satu kartu platform yang direkomendasikan (Windows) + system requirements**, dengan tab/pemilihan platform lain sebagai pengembangan lanjutan. Ikuti mockup: build versi satu-kartu-rekomendasi dulu; tambahkan switcher macOS/Linux di iterasi berikutnya bila aset/link tersedia.
4. **"Cara Instalasi"** — 5 step horizontal dengan panah: Unduh Installer → Jalankan Installer → Ikuti Petunjuk → Selesai → Buka RoboLab Studio. Tombol "Lihat Panduan Instalasi Lengkap →" (mengarah ke Documentation → Getting Started, satu-satunya docs page yang ada).

---

# 10. Screenshot Asli (Sumber Kebenaran Visual)

Semua thumbnail/preview di 4 halaman **harus** diambil dari salah satu file screenshot aplikasi asli berikut — bukan digambar ulang:

| File | Konten yang Ditampilkan |
|---|---|
| `home.jpg` | Project Suite carousel — kartu project (LED Dimmer & Switch, Obstacle Avoidance Scanner, Smart Light & Compass, dll.) dengan badge board |
| `sim.jpg` | Virtual Hardware Simulator — NodeMCU ESP8266, wiring LED, panel Circuit Builder, Virtual WiFi, Connections list |
| `lp.jpg` | Portal Pembelajaran Python & MicroPython — sidebar modul, contoh kode, Preview Terminal, Tips Singkat |
| `ter.png` | Asisten RoboLab AI — chat panel dengan tab Serial/Terminal/Asisten, quick actions (Analisis Kode, Perbaiki Error, Rangkaian, Datasheet) |
| `lb.jpg` | Library & Board Manager — install dari GitHub/ZIP, tab Arduino Library/Python(PIP)/Board Manager, daftar library dengan status Installed |

Pemetaan ke bagian website (v2.0):

- **Home hero visual** → `lp.jpg` atau `sim.jpg` (crop window frame app)
- **Features → Visual Block / Code Editor** → potongan editor dari `lp.jpg` / `home.jpg`
- **Features → Virtual Hardware Simulator** → `sim.jpg`
- **Features → Python & MicroPython** → `lp.jpg`
- **Features → Library Manager & Board Manager** → `lb.jpg`
- **Features → Serial Monitor & Terminal / RoboLab AI** → `ter.png`
- **Documentation → Getting Started info banner** → crop kecil breadboard dari `sim.jpg`
- **Download hero visual** → kombinasi `lp.jpg` (editor+terminal) untuk window frame lebar

---

# 11. Visual Design System (Ringkas — Detail Lengkap di `robolab-studio-design-system.md`)

Referensi warna & tipografi tetap mengikuti PRD v1.0 (RoboLab Blue #1557B0, Cyan #16B8D4, Purple #7C3AED, Orange #F59E0B, Green #10B981; font Inter/Plus Jakarta Sans; JetBrains Mono untuk kode) — **namun disesuaikan** agar kartu, badge status, dan komponen di website terasa konsisten dengan UI aplikasi asli (lihat file design system terpisah untuk detail per-komponen: badge "Installed", badge "CONNECTED", badge "Pro", pill status, dsb.).

---

# 12. MVP Scope (v2.0 — Final)

### In Scope (build sekarang)

```text
✓ Home (hero, platform strip, feature preview grid)
✓ Features (8 kartu fitur dengan screenshot asli)
✓ Documentation → Getting Started (5-step onboarding)
✓ Download (kartu Windows + system requirements + cara instalasi)
✓ Navbar & Footer (nav item lain boleh tampil tapi non-fungsional)
✓ Responsive (desktop/tablet/mobile)
✓ SEO dasar untuk 4 halaman ini
```

### Backlog (tidak dikerjakan sampai ada mockup baru)

```text
✗ Projects (listing & detail page)
✗ Learning Hub
✗ Boards page (daftar lengkap)
✗ Libraries page (daftar lengkap)
✗ Documentation (kategori selain Getting Started)
✗ Changelog
✗ Community page
✗ Search global
✗ User accounts
```

---

# 13. Definition of Done (v2.0)

* [ ] Home selesai, hero visual pakai screenshot asli
* [ ] Features selesai, 8 kartu dengan thumbnail asli
* [ ] Documentation → Getting Started selesai, 5-step flow berfungsi
* [ ] Download selesai, checksum & requirement terisi data valid
* [ ] Navbar/Footer konsisten di 4 halaman, link backlog diberi label "Coming Soon" atau disembunyikan sementara
* [ ] Responsive mobile untuk 4 halaman
* [ ] SEO meta untuk 4 halaman
* [ ] Deployment production

---

*Dokumen ini menggantikan bagian struktur/scope dari PRD v1.0. Bagian lain PRD v1.0 (Vision, Target User detail, Design System penuh, SEO keyword list, Performance, Accessibility) tetap berlaku sebagai referensi tambahan dan tidak diulang di sini.*
