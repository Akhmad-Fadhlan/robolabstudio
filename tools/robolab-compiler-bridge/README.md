# RoboLab Studio — Local Compiler Bridge

Bridge lokal ultra-ringan untuk RoboLab Web (https://robolabstudio.vercel.app).
Memungkinkan Anda mengompilasi dan mengunggah kode C++ Arduino, ESP8266, dan ESP32
secara 100% native dari browser dengan kecepatan penuh.

## Cara Menggunakan:
1. Klik ganda **start-bridge.bat** (atau jalankan **install-bridge.bat** untuk membuat shortcut di Desktop).
2. Bridge akan berjalan di `http://localhost:3001`.
3. Buka RoboLab Web di browser (Chrome / Edge / Opera).
4. Indikator Compiler di RoboLab Web akan otomatis berwarna **HIJAU (Terhubung)**.
5. Klik **Upload** atau **Verify** — sketch Anda langsung dikompilasi secara native!

## Fitur:
- Mendukung penuh Blynk IoT Cloud (ESP8266 & ESP32).
- Pustaka lengkap bawaan (Blynk, WiFi, DHT, Servo, LiquidCrystal, Ultrasonic, dll).
- Otomatis mendeteksi port COM USB (CH340, CP2102, FTDI).
