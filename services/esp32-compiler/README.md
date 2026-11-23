# Kompilasi ESP32 untuk RoboLab Web

RoboLab di Vercel menerima sketch `.ino`, meneruskan kompilasi ke Arduino CLI, lalu browser mengunggah firmware melalui Web Serial. Pengguna masuk ke akun RoboLab dan memilih board **ESP32 DevKit V1**. Arduino CLI terpasang di server.

## Aktifkan di produksi tanpa Docker di laptop

1. Setelah konfigurasi tersedia di GitHub, buka **New > Blueprint** di Render dan pilih repository RoboLab. File `render.yaml` mengatur path Dockerfile, konteks build, pemeriksaan `/health`, dan pembuatan token otomatis. Render membangun image dari repo. Blueprint memilih paket Free. Render dapat menidurkan layanan saat tidak dipakai. RoboLab menunggu compiler siap sebelum memulai build.
2. Setelah layanan sehat, salin URL HTTPS layanan dan salin nilai `ESP32_COMPILER_TOKEN` dari pengaturan Environment Render ke Environment Variables proyek RoboLab di Vercel. Simpan URL sebagai `ESP32_COMPILER_URL`. Jika `VITE_SUPABASE_ANON_KEY` belum tersedia, set `SUPABASE_ANON_KEY` dengan publishable atau anon key proyek Supabase yang dipakai untuk login. Atur `SUPABASE_URL` bila proyek memakai origin Supabase lain.
3. Redeploy RoboLab di Vercel. Di Chrome atau Edge desktop, masuk ke RoboLab dan buka sketch, pilih **ESP32 DevKit V1**, lalu klik **Verify** dan periksa log **Arduino CLI cloud**. Sambungkan board lewat USB, klik **Upload**, lalu cek tab Serial.

Blueprint bersifat opsional. Host Docker terkelola lain bisa menggunakan `services/esp32-compiler/Dockerfile`, konteks dari root repository, dan variabel `ESP32_COMPILER_TOKEN` acak minimal 32 karakter.

Kompilasi pertama setelah layanan tidur bisa memerlukan hingga sekitar dua menit. Layanan memproses satu build sekaligus. Sketch besar dan library berat dapat melampaui kapasitas paket Free. Sketch bisa membawa berkas pendukung C/C++ dengan nama unik dan memakai library yang tersedia di image. Pasang library tambahan saat build image sesuai kebutuhan proyek.

## Coba image Docker

Jalankan dari root repository.

```sh
docker build -t robolab-esp32-compiler -f services/esp32-compiler/Dockerfile .
docker run --rm -p 8080:8080 -e ESP32_COMPILER_TOKEN robolab-esp32-compiler
```

Sediakan token melalui environment shell sebelum menjalankan perintah. Token untuk komunikasi Vercel ke compiler disimpan sebagai variabel server tanpa awalan `VITE_`.
