# RoboLab Studio — Local Compiler Bridge (Multiplatform)

Bridge compiler lokal ultra-ringan untuk RoboLab Studio Web (https://robolabstudio.vercel.app).
Memungkinkan Anda mengompilasi dan mengunggah kode C++ Arduino, ESP8266, dan ESP32
secara 100% native dari browser dengan kecepatan penuh tanpa antrean cloud.

---

## 🪟 Windows (10 / 11)
1. **Otomatis:** Jalankan installer `RoboLab-Compiler-Bridge-Setup.exe` (otomatis memasang shortcut dan driver CH340 / CP2102).
2. **Manual:** Jalankan `start-bridge.bat` (atau `install-bridge.bat` untuk membuat pintasan Desktop).
3. Status di RoboLab Web otomatis berwarna **HIJAU (Bridge Aktif)** di Port 3001.

---

## 🍎 macOS (Apple Silicon M1/M2/M3 & Intel)
1. Ekstrak file package zip ke folder pilihan Anda (misalnya `~/RoboLabBridge`).
2. Double-klik **`start-bridge.command`** (atau jalankan `./start-bridge.sh` di Terminal).
   *(Opsional: jalankan `./install-bridge.sh` untuk membuat pintasan di Desktop).*
3. Pastikan Node.js terpasang (`brew install node`). Arduino CLI akan otomatis diatur.
4. Buka RoboLab Web di browser — indikator bridge otomatis aktif!

---

## 🐧 Linux (Ubuntu, Debian, Fedora, Arch, Raspberry Pi OS)
1. Ekstrak package `tar.gz` atau `zip`:
   ```bash
   tar -xzf RoboLab-Compiler-Bridge-Linux.tar.gz
   cd robolab-compiler-bridge
   ```
2. Berikan izin port serial USB (sekali saja):
   ```bash
   sudo usermod -a -G dialout $USER
   ```
   *(lalu log out dan log in kembali)*.
3. Jalankan bridge:
   ```bash
   ./start-bridge.sh
   ```
   *(Atau jalankan `./install-bridge.sh` untuk membuat launcher aplikasi).*

---

## 🚀 Fitur Unggulan:
- **100% Native & Bebas Limit:** Kompilasi langsung di CPU komputer Anda dengan multi-core caching.
- **Dukungan Blynk IoT:** Pustaka Blynk, WiFi, ESP8266 & ESP32 sudah lengkap bawaan.
- **Multiplatform:** Windows, macOS (Intel & Apple Silicon), dan Linux.
- **Port USB Otomatis:** Deteksi instan untuk board Arduino Uno, Nano, Mega, NodeMCU, ESP32, dan RP2040.
