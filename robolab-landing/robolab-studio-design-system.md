# RoboLab Studio — Website Design System (v2.0)

**Tujuan dokumen:** memastikan desain website (4 halaman: Home, Features, Documentation → Getting Started, Download) tidak menyimpang dari **dua sumber acuan visual** yang sudah ada:

1. **Mockup website** (hasil ChatGPT) — menentukan *layout* dan *copy*.
2. **Screenshot aplikasi asli RoboLab Studio** (`home.jpg`, `sim.jpg`, `lp.jpg`, `ter.png`, `lb.jpg`) — menentukan *bahasa visual produk yang sebenarnya* (warna, badge, komponen UI). Website harus terasa seperti "jendela" ke aplikasi ini, bukan ilustrasi generik.

Setiap keputusan desain di bawah ini ditandai sumbernya: `[Mockup]` atau `[App]`.

---

## 1. Referensi Gambar

| Kode | File | Halaman App yang Difoto | Dipakai untuk Website |
|---|---|---|---|
| M1 | `ChatGPT_Image_..._09_56_43_AM.png` | — (mockup) | Referensi layout **Home** |
| M2 | `ChatGPT_Image_..._09_59_28_AM.png` | — (mockup) | Referensi layout **Features** |
| M3 | `ChatGPT_Image_..._10_05_41_AM.png` | — (mockup) | Referensi layout **Documentation → Getting Started** |
| M4 | `ChatGPT_Image_..._10_03_30_AM.png` | — (mockup) | Referensi layout **Download** |
| A1 | `home.jpg` | Project Suite (carousel project di dalam app) | Sumber thumbnail project & window-frame reference |
| A2 | `sim.jpg` | Virtual Hardware Simulator | Sumber thumbnail simulator, warna wiring, panel kanan |
| A3 | `lp.jpg` | Portal Pembelajaran Python & MicroPython | Sumber thumbnail code editor + terminal, window title bar asli |
| A4 | `ter.png` | Asisten RoboLab AI (chat panel) | Sumber thumbnail AI Assistant, gaya bubble chat |
| A5 | `lb.jpg` | Library & Board Manager | Sumber thumbnail library manager, gaya badge "Installed" |

**Aturan kerja:** setiap kali membuat komponen baru untuk website, cek dulu apakah komponen serupa sudah ada di A1–A5. Kalau ada, tiru style-nya (warna badge, radius, ukuran font) alih-alih membuat versi baru dari nol.

---

## 2. Color System

### 2.1 Palet Website (dari mockup, `[Mockup]`)

| Nama | Hex | Pemakaian |
|---|---|---|
| RoboLab Blue | `#1557B0` | Primary CTA, link aktif, headline accent |
| Deep Blue | `#12345B` | Teks judul gelap alternatif |
| Cyan | `#16B8D4` | Aksen sekunder, ikon |
| Purple | `#7C3AED` | Aksen "Simulate"/AI, gradient CTA |
| Orange | `#F59E0B` | Badge warning/highlight (mis. AI, Serial) |
| Green | `#10B981` | Status sukses |
| Background | `#F8FAFC` / `#F1F5F9` / `#FFFFFF` | Section background |
| Text | `#0F172A` / `#334155` / `#64748B` | Heading / body / muted |

### 2.2 Warna Status dari Aplikasi Asli (`[App]`) — WAJIB dipakai ulang di website

Ini yang membuat website "terasa nyata" — jangan diganti dengan warna generik:

- **Badge "CONNECTED"** (A3, A5) — pill hijau kecil dengan dot, teks kapital, dipakai di window-frame screenshot pada Home & Download untuk menunjukkan app benar-benar terhubung ke board.
- **Badge "Pro"** (A3, A5) — pill ungu solid, dipakai di title bar app (di samping "Student").
- **Badge "Installed"** (A5) — pill hijau muda dengan check icon, dipakai di kartu Library Manager pada Features.
- **Wire colors** (A2) — merah, hitam, biru, hijau, kuning — kalau website menampilkan potongan Circuit Builder, gunakan palet wire yang sama persis (jangan diacak).
- **Terminal/console** (A2, A3) — background gelap `#0F172A`–`#1a1a2e`, teks hijau/putih monospace untuk log serial.

---

## 3. Typography

`[Mockup]`

| Elemen | Font | Weight |
|---|---|---|
| Heading (H1–H3) | Inter / Plus Jakarta Sans | Bold–Extra Bold |
| Body | Inter | Regular–Medium |
| Code / terminal / thumbnail app | JetBrains Mono | Regular |

`[App]` — di dalam screenshot asli (A2, A3, A5), font UI aplikasi adalah sans-serif standar (mirip Inter) untuk label, dan monospace untuk area kode/serial. Ini sejalan dengan pilihan di atas — tidak perlu penyesuaian.

---

## 4. Komponen

### 4.1 Window Frame (App Preview Container)

Dipakai di: Home hero, Download hero.

Struktur (ikuti A3/lp.jpg sebagai acuan paling lengkap):

```text
┌─────────────────────────────────────────────────┐
│ ● robolab-studio          [title bar, abu muda]  │
│ [Logo] RoboLab Studio   Open  Save  Verify  ...  │
│                      Student  Pro   BOARD: ▾      │
│                      PORT: ▾  ● CONNECTED         │
├───────────┬───────────────────────────────────────┤
│ icon rail │           konten (crop dari A2/A3)     │
│ (vertikal)│                                        │
└───────────┴───────────────────────────────────────┘
```

- Icon rail kiri: ikon vertikal kecil (Home, Folder, Layers, Monitor, Book, Download) — selalu sertakan meski hanya dekoratif, ini ciri khas UI app (lihat A2–A5).
- Title bar selalu menampilkan: nama board aktif (mis. "ESP32 DevKit V1"), port (mis. "COM32"), dan badge status "CONNECTED" hijau.
- Border radius window: 12–16px, shadow lembut, sedikit floating (translateY -4px) sesuai `[Mockup]`.

### 4.2 Feature Card

`[Mockup]` (M2) + `[App]` thumbnail:

```text
┌─────────────────────────────┐
│ [icon badge warna]   ›       │
│ Judul Fitur                  │
│ Deskripsi 1 baris.           │
│ ┌───────────────────────┐   │
│ │ thumbnail dari A1–A5   │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

- Icon badge: kotak rounded 40×40px, background pastel dari warna kategori (biru muda, hijau muda, ungu muda, oranye muda) — persis pola di M2.
- Thumbnail wajib crop asli dari app (bukan mockup UI palsu) — lihat mapping di Section 1.

### 4.3 Step Card (5-langkah)

Dipakai di: Documentation → Getting Started (M3), Download → Cara Instalasi (M4).

```text
[nomor bulat berwarna] → [icon] → Judul step → deskripsi 1 baris
```

- Angka dalam lingkaran (28–32px), warna berbeda tiap step secara berurutan (biru, hijau, oranye, ungu, biru) sesuai M3.
- Panah penghubung antar-card berupa garis putus-putus horizontal, menghilang jadi vertikal di mobile.

### 4.4 Status / Info Badge

- Pill kecil, radius penuh, padding horizontal 10–12px, font 12px medium.
- Varian warna ikuti makna: hijau = sukses/terverifikasi (`Verified`, `Clean`, `Installed`, `CONNECTED`), biru = info/kategori (`Latest`, `Getting Started`), ungu = premium (`Pro`), abu = netral.

### 4.5 Download Card

`[Mockup]` (M4):

- Logo OS besar (kotak rounded, ikon platform) + nama platform + versi OS minimum.
- Tombol download full-width, gradient biru→ungu, ikon panah-bawah.
- Baris meta di bawah: SHA256 checksum (monospace, kecil, dengan tombol copy), Digital Signature (badge hijau "Verified"), Virus Total (badge hijau "Clean").
- Panel System Requirements di sisi kanan: list dengan check icon hijau per item.

---

## 5. Layout Grid

`[Mockup]`, konsisten di 4 halaman:

- Max content width: `1440px`, padding horizontal 80–120px di desktop.
- Breakpoint: Desktop ≥1200px, Tablet 768–1199px, Mobile 320–767px.
- Grid fitur: 4 kolom desktop → 2 kolom tablet → 1 kolom mobile.
- Border radius standar komponen: `12px / 16px / 20px / 24px` (kartu kecil → kartu besar → window frame → hero visual).

---

## 6. Prinsip Utama (Jangan Dilanggar)

1. **Screenshot > Ilustrasi.** Setiap kali sebuah section butuh "gambar aplikasi", gunakan crop dari A1–A5, bukan digambar ulang sebagai ilustrasi vektor. Ini yang membedakan website dari mockup generik biasa.
2. **Badge status app dipertahankan.** Jangan menghapus atau mengganti badge "CONNECTED" / "Pro" / "Installed" saat meng-crop screenshot — badge ini yang membuat produk terasa nyata dan sudah dipakai orang.
3. **Window frame konsisten.** Setiap preview aplikasi (Home, Features thumbnail besar, Download) memakai title bar yang sama persis strukturnya (lihat 4.1), hanya kontennya yang beda per section.
4. **4 halaman dulu.** Jangan menambah komponen untuk halaman di luar scope (Projects, Learning, Boards, dst.) — lihat `PRD-RoboLab-Studio-Website-v2.md` Section 12 untuk daftar backlog.
5. **Wire & terminal color tetap dari app.** Untuk elemen teknikal (wiring, log serial, kode), jangan re-skin dengan warna brand website — biarkan tampil apa adanya seperti di A2/A3 agar kredibel sebagai screenshot asli.

---

*Dokumen ini adalah pasangan dari `PRD-RoboLab-Studio-Website-v2.md`. Gunakan PRD untuk keputusan scope/konten per halaman, dan dokumen ini untuk keputusan visual/komponen.*
