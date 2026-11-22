export const PYTHON_PACKAGE_CATALOG = [
  ['pyserial', 'IoT', 'Komunikasi serial dengan Arduino, ESP32, atau micro:bit.'],
  ['paho-mqtt', 'IoT', 'Kirim dan terima data melalui broker MQTT.'],
  ['bleak', 'IoT', 'Hubungkan sensor Bluetooth Low Energy.'],
  ['mpremote', 'IoT', 'Kelola berkas dan REPL board MicroPython dari komputer.'],
  ['esptool', 'IoT', 'Unggah firmware ke board Espressif.'],
  ['requests', 'Web', 'Kirim permintaan HTTP dan baca respons API.'],
  ['httpx', 'Web', 'Klien HTTP sinkron dan asinkron.'],
  ['flask', 'Web', 'Buat aplikasi web dan API sederhana.'],
  ['fastapi', 'Web', 'Buat API Python dengan validasi data.'],
  ['uvicorn', 'Web', 'Jalankan server ASGI untuk FastAPI.'],
  ['beautifulsoup4', 'Web', 'Baca dan pilih elemen dalam dokumen HTML.'],
  ['numpy', 'Data', 'Olah array dan hitung data numerik.'],
  ['pandas', 'Data', 'Olah tabel, CSV, dan data sensor.'],
  ['matplotlib', 'Data', 'Buat grafik dari hasil pengukuran.'],
  ['openpyxl', 'Data', 'Baca dan tulis workbook Excel.'],
  ['scipy', 'Data', 'Komputasi ilmiah dan pengolahan sinyal.'],
  ['scikit-learn', 'AI & Visi', 'Latih model machine learning untuk data tabel.'],
  ['opencv-python', 'AI & Visi', 'Proses gambar, video, dan kamera lokal.'],
  ['pillow', 'AI & Visi', 'Buka, edit, dan simpan gambar.'],
  ['ultralytics', 'AI & Visi', 'Gunakan model YOLO untuk deteksi objek.'],
  ['pygame', 'Aplikasi', 'Buat permainan dan latihan animasi.'],
  ['customtkinter', 'Aplikasi', 'Buat antarmuka desktop berbasis Tkinter.'],
  ['pytest', 'Aplikasi', 'Jalankan pengujian kode Python.'],
  ['python-dotenv', 'Aplikasi', 'Baca pengaturan lokal dari file .env.'],
].map(([name, category, desc]) => ({ name, category, desc, installed: false, version: '' }));

export function normalizePythonPackageName(name: string): string {
  return name.trim().toLowerCase().replace(/[-_.]+/g, '-');
}
