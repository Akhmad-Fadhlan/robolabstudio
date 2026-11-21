Warning: truncated output (original token count: 158888)
Total output lines: 13424

import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import type { LangCode } from './i18n';
import { t } from './i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, ChevronRight, ChevronLeft, ChevronDown, BookOpen, 
  Plus, Search, Smartphone, X, Sliders, Download, 
  File as FileIcon, FileText, Folder, Play, Square, RotateCcw, Blocks, Code,
  FolderOpen, Check, Save, Upload, Terminal as TerminalIcon, Trash2,
  HelpCircle, Compass, ArrowRight, Copy, Loader2,
  Info, MessageSquare, Package, Monitor, Lock, Clock, Star
} from 'lucide-react';
import { TopMenuBar } from './components/layout/TopMenuBar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { TerminalPanel } from './components/layout/TerminalPanel';
import { PythonLogo } from './components/icons/PythonLogo';
import { ArduinoLogo } from './components/icons/ArduinoLogo';
import { MicroPythonLogo } from './components/icons/MicroPythonLogo';
import { BlockFieldGuide } from './components/learning/BlockFieldGuide';
import { ProjectWorkshop } from './components/learning/ProjectWorkshop';
import { LessonMission } from './components/learning/LessonMission';
import { KidsAnalogyCard } from './components/learning/KidsAnalogyCards';
import { CloudFooter, TwinklingStars, MascotRobot, RocketBanner } from './components/decorations/KidsThemeDecorations';
import type { BlocklyEditor as BlocklyEditorType } from './components/BlocklyEditor';
import type { CodeEditor as CodeEditorType } from './components/CodeEditor';
import type { Simulator as SimulatorType } from './components/Simulator';

const BlocklyEditorLazy = lazy(() => import('./components/BlocklyEditor').then(m => ({ default: m.BlocklyEditor })));
const CodeEditorLazy = lazy(() => import('./components/CodeEditor').then(m => ({ default: m.CodeEditor })));
const SimulatorLazy = lazy(() => import('./components/Simulator').then(m => ({ default: m.Simulator })));

const BlocklyEditor = (props: React.ComponentProps<typeof BlocklyEditorType>) => <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-indigo-300 font-mono text-sm bg-slate-900/50">Memuat Blockly...</div>}><BlocklyEditorLazy {...props} /></Suspense>;
const CodeEditor = (props: React.ComponentProps<typeof CodeEditorType>) => <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-cyan-300 font-mono text-sm bg-slate-900/50">Memuat Editor...</div>}><CodeEditorLazy {...props} /></Suspense>;


const Simulator = (props: React.ComponentProps<typeof SimulatorType>) => <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-emerald-300 font-mono text-sm bg-slate-900/50">Memuat Simulator...</div>}><SimulatorLazy {...props} /></Suspense>;
import type { Wire } from './components/Simulator';
import {
  type RobotHardwareConfig,
  type RobotPlan,
  type ActiveExecutionHighlight,
  createDefaultRobotHardwareConfig,
  createDefaultRobotPlans,
  generateRobotPlanArduinoCode,
  generateRobotPlanPythonCode,
  buildRobotPlanBlocklyXml,
} from './types/robotSimulator';

import { LIBRARY_PROJECT_TEMPLATES } from './data/libraryProjectTemplates';
import { ARDUINO_HARDWARE_LESSONS } from './data/arduinoHardwareLessons';
import {
  ArduinoPinoutVisualizer,
  DigitalOutputVisualizer,
  DigitalInputVisualizer,
  AdcHardwareVisualizer,
  PwmHardwareVisualizer,
  SerialHardwareVisualizer,
  I2cBusVisualizer,
  InterruptHardwareVisualizer
} from './components/learning/HardwareVisualizers';

import './App.css';
import { arduinoToBlocklyXml, arduinoToPython } from './utils/arduinoToBlocks';
import { pythonToBlocklyXml } from './utils/pythonToBlocks';
import { convertArduinoCodeToBlocklyXmlWithGemini, inferLibraryApiWithGemini } from './services/geminiLibraryService';
import { findKnownLibrary } from './data/knownLibrarySignatures';
import { IOT_LIBRARY_CATALOG, type IoTRepoLibrary } from './data/iotLibraryCatalog';
import { parseArduinoZipArchive } from './services/zipLibraryService';

export const isBareSkeletonCode = (code: string, lang: 'arduino' | 'python' = 'arduino'): boolean => {
  const trimmed = (code || '').trim();
  if (trimmed.length < 20) return true;
  if (lang === 'arduino' || !trimmed.includes('def ')) {
    const stripped = trimmed
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\r\n]*/g, '')
      .replace(/^#include\s*[<"][^>"]+[>"]\s*/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (
      stripped === 'void setup() { Serial.begin(115200); } void loop() { }' ||
      stripped === 'void setup() { Serial.begin(9600); } void loop() { }' ||
      stripped === 'void setup() { } void loop() { }' ||
      stripped === 'void setup() { }' ||
      stripped === 'void loop() { }'
    ) {
      return true;
    }
  }
  if (lang === 'python' || trimmed.includes('def ')) {
    const strippedPy = trimmed
      .replace(/#[^\r\n]*/g, '')
      .replace(/import\s+[a-zA-Z0-9_]+\s*(?:as\s+[a-zA-Z0-9_]+)?\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (
      strippedPy === 'def setup(): pass def loop(): pass if __name__ == "__main__": setup() while True: loop()' ||
      strippedPy === 'def setup(): pass def loop(): pass' ||
      strippedPy === 'pass' ||
      strippedPy === ''
    ) {
      return true;
    }
  }
  return false;
};
import { processAiMessage, DEFAULT_KILOCODE_CONFIG } from './services/kilocodeService';
import type { KiloCodeConfig, ChatMessage } from './services/kilocodeService';
import { checkTrialStatus, fetchUserCustomLibraries, saveUserCustomLibrary, deleteUserCustomLibrary } from './services/supabaseClient';
import type { TrialStatus } from './services/supabaseClient';
import {
  isElectronEnv,
  getWebSerialPorts,
  requestWebSerialPort,
  executeWebHardwareAction,
  startWebSerialMonitor,
  stopWebSerialMonitor,
  openFileInBrowser,
  openFolderInBrowser,
  downloadFileInBrowser,
} from './services/webSerialService';

// const DEFAULT_FILES = {};

const INITIAL_PACKAGES = {
  arduino: [
    { name: 'ArduinoJson', desc: 'Efficient JSON serialization library for embedded C++.', version: '6.21.3', installed: true, cat: 'Core' },
    { name: 'Wire', desc: 'I2C communication library for Arduino.', version: '1.0.0', installed: true, cat: 'Core' },
    { name: 'SPI', desc: 'SPI communication library for Arduino.', version: '1.0.0', installed: true, cat: 'Core' },
    { name: 'DHT sensor library', displayName: 'DHT11 / DHT22 (Suhu & Kelembapan)', desc: 'Library sensor suhu presisi (°C) dan kelembapan udara relatif (%) untuk DHT11 dan DHT22.', version: '1.4.6', installed: false, cat: 'Sensor', tags: ['dht', 'dht11', 'dht22', 'suhu', 'kelembaban', 'temperature'] },
    { name: 'NewPing', displayName: 'Ultrasonik HC-SR04 (NewPing)', desc: 'Library sensor jarak ultrasonik HC-SR04 ultra cepat dengan penyaring median derau pantulan.', version: '1.9.7', installed: false, cat: 'Sensor', tags: ['ultrasonic', 'ultrasonik', 'hcsr04', 'hc-sr04', 'sonar', 'jarak'] },
    { name: 'Adafruit SSD1306', displayName: 'OLED Display 0.96" I2C (SSD1306)', desc: 'Menampilkan visual grafik, teks, garis, lingkaran, dan gambar monokrom pada layar OLED I2C 128x64.', version: '2.5.9', installed: false, cat: 'Display', tags: ['oled', 'ssd1306', 'display', 'layar', 'i2c'] },
    { name: 'DFRobot_PH', displayName: 'Sensor pH Cairan (DFRobot Gravity)', desc: 'Sensor derajat keasaman cairan (pH 0-14) analog Gravity dengan kalibrasi larutan buffer pH 4.0 & 7.0.', version: '1.0.0', installed: false, cat: 'Sensor', tags: ['ph', 'ph_meter', 'keasaman', 'air'] },
    { name: 'GravityTDS', displayName: 'Sensor EC & TDS Kualitas Air (DFRobot)', desc: 'Sensor konduktivitas listrik (EC) & Total Dissolved Solids (TDS ppm) untuk nutrisi tanaman & kemurnian air.', version: '1.0.0', installed: false, cat: 'Sensor', tags: ['ec', 'tds', 'gravitytds', 'ppm', 'air'] },
    { name: 'DFRobot_EC', displayName: 'Sensor EC Konduktivitas Listrik (DFRobot)', desc: 'Sensor konduktivitas listrik (EC) analog Gravity untuk larutan nutrisi tanaman hidroponik.', version: '1.0.0', installed: false, cat: 'Sensor', tags: ['ec', 'dfrobot_ec', 'konduktivitas', 'nutrisi'] },
    { name: 'Adafruit_MAX31865', displayName: 'Sensor PT100 / PT1000 RTD (MAX31865)', desc: 'Amplifier RTD Platinum presisi tinggi industri untuk membaca probe suhu ekstrem PT100 / PT1000 via SPI.', version: '1.6.2', installed: false, cat: 'Sensor', tags: ['pt100', 'pt1000', 'max31865', 'rtd', 'suhu'] },
    { name: 'FirebaseESP32', displayName: 'Google Firebase Realtime Database (IoT)', desc: 'Koneksi cloud langsung ke Google Firebase Realtime Database untuk sinkronisasi nilai sensor & saklar IoT.', version: '4.4.14', installed: false, cat: 'IoT', tags: ['firebase', 'database', 'rtdb', 'cloud', 'iot'] },
    { name: 'MFRC522', displayName: 'RFID Reader RC522 13.56 MHz (SPI)', desc: 'Membaca nomor UID kartu RFID / e-KTP / gantungan kunci 13.56 MHz untuk sistem absensi dan akses pintu.', version: '1.4.10', installed: false, cat: 'Sensor', tags: ['rfid', 'rc522', 'mfrc522', 'nfc', 'kartu'] },
    { name: 'Adafruit PN532', displayName: 'RFID & NFC Reader (Adafruit PN532)', desc: 'Modul NFC & RFID canggih komunikasi I2C/SPI untuk membaca kartu Mifare, ponsel pintar, dan tag NFC.', version: '1.3.3', installed: false, cat: 'Sensor', tags: ['pn532', 'nfc', 'rfid'] },
    { name: 'LiquidCrystal_I2C', displayName: 'LCD 16x2 / 20x4 I2C Backpack', desc: 'Menampilkan karakter alfanumerik pada modul LCD 16x2 / 20x4 dengan chip PCF8574 hemat pin I2C.', version: '1.1.4', installed: false, cat: 'Display', tags: ['lcd', 'liquidcrystal', '16x2', '20x4', 'display'] },
    { name: 'Blynk', displayName: 'Blynk IoT Cloud Platform', desc: 'Library resmi Blynk IoT Cloud untuk ESP8266 & ESP32 guna memonitor widget dashboard di ponsel.', version: '1.3.2', installed: false, cat: 'IoT', tags: ['blynk', 'iot', 'cloud', 'dashboard'] },
    { name: 'PubSubClient', displayName: 'MQTT Client IoT (HiveMQ / ThingsBoard)', desc: 'Protokol pengiriman pesan data ringan Publish-Subscribe ke broker MQTT untuk aplikasi IoT industri.', version: '2.8.0', installed: false, cat: 'IoT', tags: ['mqtt', 'pubsubclient', 'broker'] },
    { name: 'Adafruit_MPU6050', displayName: 'MPU6050 Akselerometer & Gyroscope 6-Axis', desc: 'Sensor gerak 6-Axis (3-axis akselerasi + 3-axis sudut rotasi putar) via I2C untuk deteksi kemiringan.', version: '2.2.6', installed: false, cat: 'Sensor', tags: ['mpu6050', 'gyro', 'accelerometer', 'akselerometer'] },
    { name: 'Adafruit_NeoPixel', displayName: 'NeoPixel RGB LED Strip (WS2812B)', desc: 'Mengendalikan rangkaian LED RGB addressable WS2812B dengan 16 juta warna hanya dari 1 pin mikrokontroler.', version: '1.12.0', installed: false, cat: 'Aktuator', tags: ['neopixel', 'ws2812', 'rgb', 'led'] },
    { name: 'HX711', displayName: 'Timbangan Digital Load Cell (HX711)', desc: 'Amplifier ADC 24-bit untuk membaca sensor berat (load cell) timbangan digital dengan akurasi gram.', version: '0.7.5', installed: false, cat: 'Sensor', tags: ['hx711', 'loadcell', 'timbangan', 'berat'] },
    { name: 'RTClib', displayName: 'RTC Waktu Real-Time (DS3231 / DS1307)', desc: 'Pencatat waktu nyata presisi tinggi (jam, menit, detik, tanggal) dengan baterai backup cadangan.', version: '2.1.3', installed: false, cat: 'Sensor', tags: ['rtc', 'rtclib', 'ds3231', 'jam', 'waktu'] },
    { name: 'Adafruit_VL53L0X', displayName: 'Laser ToF Distance Sensor (VL53L0X)', desc: 'Sensor jarak laser Time-of-Flight hingga 2 meter dengan presisi tinggi bebas gangguan warna target.', version: '1.2.4', installed: false, cat: 'Sensor', tags: ['vl53l0x', 'laser', 'tof', 'distance'] },
    { name: 'DFRobotDFPlayerMini', displayName: 'DFPlayer Mini MP3 Player Audio', desc: 'Pemutar file musik MP3/WAV dari microSD dengan komunikasi serial UART dan kontrol volume langsung.', version: '1.0.6', installed: false, cat: 'Aktuator', tags: ['dfplayer', 'mp3', 'audio', 'musik'] },
    { name: 'AccelStepper', displayName: 'AccelStepper Motor Stepper Presisi', desc: 'Pengendalian motor stepper multi-axis dengan akselerasi dan deselerasi halus tanpa kehilangan langkah.', version: '1.64.0', installed: false, cat: 'Aktuator', tags: ['stepper', 'accelstepper', 'motor'] },
    { name: 'Servo', displayName: 'Servo Motor Control (SG90 / MG996R)', desc: 'Pengendali posisi sudut rotasi (0 - 180 derajat) untuk motor servo standar Arduino & ESP32.', version: '1.2.1', installed: false, cat: 'Aktuator', tags: ['servo', 'motor'] },
    { name: 'ESP32Servo', displayName: 'ESP32Servo Motor Control', desc: 'Servo library specifically optimized for ESP32 with hardware timers.', version: '0.13.0', installed: false, cat: 'Aktuator', tags: ['esp32servo', 'servo', 'esp32'] },
    { name: 'IRremote', displayName: 'IRremote Infrared Receiver & Transmitter', desc: 'Send and receive infrared remote control signals.', version: '4.3.1', installed: false, cat: 'Sensor', tags: ['irremote', 'ir', 'infrared'] },
    { name: 'WebSockets', displayName: 'WebSockets Server & Client', desc: 'WebSocket Server and Client for Arduino & ESP32.', version: '2.4.1', installed: false, cat: 'IoT', tags: ['websocket', 'websockets'] }
  ],
  python: [
    { name: 'robolab-client', desc: 'Python API for connecting and sending commands to RoboLab kits.', version: '1.0.4', installed: true },
    { name: 'opencv-python', desc: 'Open Source Computer Vision Library for image processing.', version: '4.8.1', installed: true },
    { name: 'ultralytics', desc: 'YOLOv8 deep learning training and inference library.', version: '8.0.200', installed: false }
  ],
  boards: [
    { name: 'ESP32 Arduino', desc: 'Espressif ESP32 core for Arduino IDE. Supports all ESP32 variants.', version: '2.0.17', installed: true, url: 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json' },
    { name: 'Arduino AVR Boards', desc: 'Official Arduino AVR core (Uno, Mega, Nano, Leonardo, etc).', version: '1.8.6', installed: true, url: 'https://downloads.arduino.cc/packages/package_index.json' },
    { name: 'MegaCore (ATmega128)', desc: 'MCUdude MegaCore for ATmega128, ATmega64, ATmega32, ATmega16.', version: '3.0.0', installed: false, url: 'https://mcudude.github.io/MegaCore/package_MCUdude_MegaCore_index.json' },
    { name: 'STM32 Boards', desc: 'STMicroelectronics STM32 family board support package.', version: '2.7.1', installed: false, url: 'https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json' },
    { name: 'Raspberry Pi Pico', desc: 'RP2040 Arduino core by Earle Philhower.', version: '3.9.3', installed: false, url: 'https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json' },
    { name: 'ESP8266 Arduino', desc: 'Espressif ESP8266 core for Arduino IDE.', version: '3.1.2', installed: false, url: 'https://arduino.esp8266.com/stable/package_esp8266com_index.json' }
  ]
};

interface ProgramPinConfig {
  ledPin?: string;
  ledPins?: string[];
  servoPin?: string;
  servoPins?: string[];
  ultrasonicTrigPin?: string;
  ultrasonicEchoPin?: string;
  potPin?: string;
  potPins?: string[];
  btnPin?: string;
  btnPins?: string[];
}

const PYTHON_LESSONS = [
  {
    title: "1. Dasar Python & Output Print",
    desc: "Memahami cara menampilkan data ke terminal menggunakan fungsi print dan penulisan komentar.",
    content: "### 1. Menampilkan Output dengan print()\nFungsi `print()` digunakan untuk menampilkan informasi atau hasil keluaran program ke layar/terminal. Ini sangat penting untuk debugging program robot kita.\n\nBeberapa cara penggunaan `print()`:\n- Menampilkan teks: `print(\"Halo Dunia\")`\n- Menampilkan angka: `print(123)`\n- Menulis Komentar: Gunakan tanda pagar `#` untuk baris penjelasan yang tidak dieksekusi program.",
    code: `# Contoh Dasar Python & Output Print
print("Halo! Selamat datang di RoboLab Studio.")
print("Python adalah bahasa pemrograman utama untuk AI dan Robotika.")
`
  },
  {
    title: "2. Variabel & Tipe Data",
    desc: "Mempelajari deklarasi variabel, tipe data dasar (int, float, boolean, str) dan konversi tipe.",
    content: "### 2. Variabel dan Tipe Data\nVariabel adalah wadah penyimpanan nilai data. Di Python, variabel dibuat saat Anda memberikan nilai pertamanya.\n\nTipe data dasar:\n- **String**: Teks (contoh: \"RoboRover\")\n- **Integer**: Bilangan bulat (contoh: 30)\n- **Float**: Bilangan desimal (contoh: 2.5)\n- **Boolean**: Kebenaran (`True` atau `False`)",
    code: `# Contoh Variabel & Tipe Data
nama_robot = "RoboRover"
versi = 2.0
sensor_aktif = True
jarak_aman = 30

print("Nama Robot:", nama_robot)
print("Versi Core:", versi)
print("Status Sensor:", sensor_aktif)
print("Jarak Minimum:", jarak_aman, "cm")
`
  },
  {
    title: "3. Manipulasi String",
    desc: "Mempelajari operasi string seperti penggabungan, panjang karakter, dan format string (f-strings).",
    content: "### 3. Operasi Manipulasi String\nString di Python dapat diolah menggunakan operator dan fungsi bawaan.\n\nMetode manipulasi string:\n- **Penggabungan**: Menggunakan operator `+` (contoh: `\"Robo\" + \"Lab\"` menghasilkan `\"RoboLab\"`)\n- **Mengukur panjang**: Menggunakan `len(string)`\n- **Format string (f-string)**: Menyisipkan nilai variabel secara langsung ke dalam string dengan `f\"Teks {variabel}\"`",
    code: `# Contoh Manipulasi String
pesan_awal = "inisialisasi robot"
print(pesan_awal.capitalize())

nama = "Robo"
seri = "X-90"
nama_lengkap = nama + " " + seri
print("Nama Lengkap:", nama_lengkap)

# Mengukur panjang string (len)
print("Panjang karakter nama:", len(nama_lengkap))
`
  },
  {
    title: "4. Struktur Kontrol (Kondisi)",
    desc: "Mengontrol alur logika program robot dengan if, elif, dan else.",
    content: "### 4. Percabangan IF-ELIF-ELSE\nPercabangan digunakan untuk mengeksekusi blok kode tertentu hanya ketika kondisi yang ditentukan terpenuhi.\n\nLogika kondisi:\n- **if**: Kondisi pertama yang diuji.\n- **elif**: Kondisi alternatif jika kondisi sebelumnya salah.\n- **else**: Blok default jika tidak ada kondisi yang terpenuhi.",
    code: `# Contoh Percabangan & Kondisi
jarak_benda = 15 # cm

if jarak_benda < 10:
    print("RINTANGAN SANGAT DEKAT! Kurangi kecepatan segera.")
elif jarak_benda >= 10 and jarak_benda < 30:
    print("Peringatan: Objek terdeteksi. Bersiap belok.")
else:
    print("Kondisi aman. Maju lurus ke depan.")
`
  },
  {
    title: "5. Perulangan (Loops)",
    desc: "Mengulangi eksekusi blok kode menggunakan loop for dan while.",
    content: "### 5. Loop (for & while)\nLoop digunakan untuk mengulangi instruksi secara terus-menerus selama kondisi terpenuhi atau mencacah suatu deret nilai.\n\nTipe Perulangan:\n- **for**: Biasanya digunakan dengan `range(start, end, step)` untuk mencacah nilai numerik secara pasti.\n- **while**: Terus mengulang kode selama kondisi ekspresi logika bernilai `True`.",
    code: `# Contoh Perulangan (Loops)
print("--- Contoh Perulangan FOR ---")
for i in range(1, 6):
    print("Pemindaian sensor ke-", i)

print("\\n--- Contoh Perulangan WHILE ---")
counter = 3
while counter > 0:
    print("Mundur dalam hitungan:", counter)
    counter = counter - 1
print("BUM! Pergerakan selesai.")
`
  },
  {
    title: "6. Fungsi (Functions)",
    desc: "Membuat blok kode yang dapat digunakan kembali dengan parameter dan nilai kembalian.",
    content: "### 6. Mendefinisikan Fungsi dengan def\nFungsi membantu merapikan kode program menjadi modul-modul kecil yang memiliki tugas khusus.\n\nSintaksis:\n- Mendefinisikan: `def nama_fungsi(parameter):`\n- Mengembalikan nilai: Menggunakan kata kunci `return`.",
    code: `# Contoh Mendefinisikan & Memanggil Fungsi
def hitung_luas_area(lebar, panjang):
    luas = lebar * panjang
    return luas

def status_baterai(level):
    if level < 20:
        return "Baterai Lemah!"
    return "Baterai Aman."

print("Luas area kerja:", hitung_luas_area(5, 10), "meter persegi")
print("Status baterai (15%):", status_baterai(15))
`
  },
  {
    title: "7. Pengenalan OOP (Class & Object)",
    desc: "Membuat class, object, constructor __init__, atribut, dan method pada OOP.",
    content: "### 7. Dasar Pemrograman Berorientasi Objek (OOP)\nOOP merepresentasikan komponen-komponen nyata (seperti motor, sensor, dll.) ke dalam bentuk Class dan Object.\n\nKonsep Dasar:\n- **Class**: Cetak biru (blueprint) dari objek.\n- **Object**: Hasil cetakan (instance) dari Class.\n- **Constructor (__init__)**: Fungsi khusus untuk menginisialisasi atribut atau properti objek saat pertama kali dibuat.",
    code: `# Contoh Dasar Class & Objek (OOP)
class MotorRobot:
    def __init__(self, nama, pin_pwm):
        self.nama = nama
        self.pin = pin_pwm
        self.kecepatan = 0
        
    def set_speed(self, speed):
        self.kecepatan = speed
        print(self.nama, "berputar dengan kecepatan:", self.kecepatan)

# Membuat objek (instansiasi)
motor_kiri = MotorRobot("Motor Kiri", 5)
motor_kiri.set_speed(150)
`
  },
  {
    title: "8. OOP Lanjutan (Inheritance)",
    desc: "Memahami pewarisan sifat dari parent class ke child class menggunakan super().",
    content: "### 8. Pewarisan (Inheritance)\nInheritance memungkinkan sebuah Class anak mewarisi atribut dan method dari Class induk (parent). Ini menghemat penulisan kode berulang.\n\n- Gunakan `super().__init__()` untuk memanggil constructor induk dari dalam constructor anak.\n- **Override**: Menimpa fungsionalitas method induk agar lebih spesifik.",
    code: `# Contoh OOP Pewarisan (Inheritance)
class SensorDasar:
    def __init__(self, nama):
        self.nama = nama
        
    def baca(self):
        return "Nilai dasar"

# Class Anak (Child Class) mewarisi dari SensorDasar
class SensorJarak(SensorDasar):
    def __init__(self, nama, trig_pin):
        super().__init__(nama)
        self.trig = trig_pin
        
    # Menimpa (override) method baca
    def baca(self):
        return "Jarak terdeteksi: 25 cm"

sensor_sonar = SensorJarak("Ultrasonic HC-SR04", 12)
print("Nama Sensor:", sensor_sonar.nama)
print("Hasil Baca :", sensor_sonar.baca())
`
  }
];

const MICROPYTHON_LESSONS = [
  {
    title: "1. Kontrol GPIO (Blink LED)",
    desc: "Belajar mengontrol pin output digital MicroPython untuk menyalakan/memadamkan LED.",
    content: "### 1. Dasar GPIO & Kontrol Pin Digital\nMicroPython memungkinkan Anda mengontrol pin I/O fisik pada mikrokontroler seperti ESP32 dengan modul `machine.Pin`.\n\nKonsep Dasar:\n- **Inisialisasi Pin**: Menggunakan `Pin(nomor_pin, Pin.OUT)` untuk menjadikannya output digital.\n- **Mengubah Status**: Menggunakan `.value(1)` atau `.on()` untuk memberi tegangan HIGH (3.3V), dan `.value(0)` atau `.off()` untuk LOW (0V).\n- **Library Time**: Gunakan `time.sleep(detik)` untuk memberikan jeda waktu/delay eksekusi.",
    code: `import machine
import time

# Inisialisasi Pin 2 (LED Bawaan ESP32) sebagai OUTPUT
led = machine.Pin(2, machine.Pin.OUT)

print("Memulai program Blink LED...")
while True:
    led.on()          # Nyalakan LED
    print("LED: ON")
    time.sleep(1)     # Tunggu 1 detik
    
    led.off()         # Padamkan LED
    print("LED: OFF")
    time.sleep(1)     # Tunggu 1 detik
`,
    cppCode: `// C++ Arduino - Blink LED
const int led = 2;

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(115200);
  Serial.println("Memulai program Blink LED...");
}

void loop() {
  digitalWrite(led, HIGH);
  Serial.println("LED: ON");
  delay(1000);
  
  digitalWrite(led, LOW);
  Serial.println("LED: OFF");
  delay(1000);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block></statement></block><block type="arduino_loop" x="40" y="150"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="arduino_delay"><field name="MS">1000</field><next><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field><next><block type="arduino_delay"><field name="MS">1000</field></block></next></block></next></block></next></block></statement></block></xml>`
  },
  {
    title: "2. PWM (Kecerahan LED)",
    desc: "Mengatur kecerahan LED atau sudut motor servo dengan Pulse Width Modulation (PWM).",
    content: "### 2. Pulse Width Modulation (PWM)\nPWM memanipulasi sinyal digital agar bertingkah seperti sinyal analog dengan mengatur rasio waktu ON terhadap OFF (duty cycle).\n\nParameter Utama:\n- **Frekuensi (freq)**: Seberapa cepat sinyal berubah (biasanya 50Hz untuk Servo, 1000Hz untuk LED).\n- **Duty Cycle**: Siklus kerja. Di MicroPython ESP32, duty cycle berkisar dari 0 (0%) hingga 1023 (100%) menggunakan `.duty()`.",
    code: `import machine
import time

# Inisialisasi PWM pada Pin 2 (LED Bawaan)
led_pin = machine.Pin(2)
led_pwm = machine.PWM(led_pin, freq=1000)

print("Memulai modulasi kecerahan LED...")
try:
    while True:
        # Fading UP: Mencerahkan LED
        for duty in range(0, 1024, 16):
            led_pwm.duty(duty)
            time.sleep(0.02)
        # Fading DOWN: Meredupkan LED
        for duty in range(1023, -1, -16):
            led_pwm.duty(duty)
            time.sleep(0.02)
except KeyboardInterrupt:
    led_pwm.deinit()
    print("Program dihentikan.")
`,
    cppCode: `// C++ Arduino - PWM (Kecerahan LED)
const int ledPin = 2;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("Memulai modulasi kecerahan LED...");
}

void loop() {
  for (int duty = 0; duty <= 255; duty += 4) {
    analogWrite(ledPin, duty);
    delay(20);
  }
  for (int duty = 255; duty >= 0; duty -= 4) {
    analogWrite(ledPin, duty);
    delay(20);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="pin_analog_write"><field name="PIN">2</field><value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value></block></statement></block><block type="arduino_loop" x="40" y="150"><statement name="STACK"><block type="pin_analog_write"><field name="PIN">2</field><value name="VALUE"><block type="math_number"><field name="NUM">128</field></block></value><next><block type="arduino_delay"><field name="MS">500</field></block></next></block></statement></block></xml>`
  },
  {
    title: "3. ADC & Sensor Analog",
    desc: "Membaca nilai input analog dari sensor (potensiometer/LDR) dengan resolusi ADC.",
    content: "### 3. Analog to Digital Converter (ADC)\nMikrokontroler memiliki ADC untuk membaca level tegangan analog (0-3.3V) dan mengubahnya menjadi nilai digital.\n\nKonsep Dasar:\n- **Resolusi ADC**: ESP32 memiliki resolusi 12-bit secara default, menghasilkan nilai bacaan dari 0 hingga 4095.\n- **Peredaman (Attenuation)**: Mengatur rentang tegangan yang dapat dibaca. Menggunakan `ADC.ATTN_11DB` untuk rentang penuh 0 - 3.6V.\n- **Membaca Nilai**: Menggunakan `.read()` atau `.read_u16()` (untuk kompatibilitas multi-platform).",
    code: `import machine
import time

# Hubungkan potensiometer/sensor analog ke Pin 34
adc_pin = machine.Pin(34)
adc = machine.ADC(adc_pin)

# Konfigurasi redaman untuk range 0-3.3V
adc.atten(machine.ADC.ATTN_11DB)

print("Memulai pembacaan ADC...")
while True:
    nilai_analog = adc.read() # Membaca nilai 0 - 4095
    tegangan = (nilai_analog / 4095) * 3.3
    
    print("Nilai Digital:", nilai_analog, "| Tegangan:", round(tegangan, 2), "V")
    time.sleep(0.5)
`,
    cppCode: `// C++ Arduino - ADC & Sensor Analog
const int adcPin = 34;

void setup() {
  Serial.begin(115200);
  Serial.println("Memulai pembacaan ADC...");
}

void loop() {
  int nilai_analog = analogRead(adcPin);
  float tegangan = (nilai_analog / 4095.0) * 3.3;
  
  Serial.print("Nilai Digital: ");
  Serial.print(nilai_analog);
  Serial.print(" | Tegangan: ");
  Serial.print(tegangan);
  Serial.println(" V");
  delay(500);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"></block><block type="arduino_loop" x="40" y="120"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="pin_analog_read"><field name="PIN">34</field></block></value><next><block type="arduino_delay"><field name="MS">500</field></block></next></block></statement></block></xml>`
  },
  {
    title: "4. Protokol I2C & OLED SSD1306",
    desc: "Menggunakan jalur komunikasi serial I2C untuk menampilkan teks pada layar OLED SSD1306.",
    content: "### 4. Komunikasi Serial I2C & OLED\nI2C (Inter-Integrated Circuit) adalah protokol komunikasi 2-kabel (SDA & SCL) untuk bertukar data dengan display atau sensor.\n\nKonsep Dasar:\n- **SDA & SCL**: Pin pengirim data (SDA) dan sinkronisasi clock (SCL). Pada ESP32 standar: SDA=21, SCL=22.\n- **OLED SSD1306**: Layar monokrom 128x64 yang dikendalikan via I2C. Gunakan `.text(\"teks\", x, y)` lalu `.show()` untuk menampilkan teks.",
    code: `import machine
import ssd1306
import time

# Konfigurasi Pin I2C pada ESP32 (SCL=Pin 22, SDA=Pin 21)
i2c = machine.I2C(0, scl=machine.Pin(22), sda=machine.Pin(21))

# Inisialisasi OLED display 128x64 piksel
oled = ssd1306.SSD1306_I2C(128, 64, i2c)

print("Inisialisasi layar OLED...")
oled.fill(0) # Bersihkan layar

# Tulis informasi
oled.text("ROBOLAB STUDIO", 10, 10)
oled.text("MicroPython IoT", 10, 25)
oled.text("Status: ONLINE", 10, 40)

oled.show() # Tampilkan ke layar fisik
`,
    cppCode: `// C++ Arduino - Protokol I2C & OLED SSD1306
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 oled(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Serial.println("Inisialisasi layar OLED...");
  if(!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED gagal diinisialisasi");
    for(;;);
  }
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(WHITE);
  
  oled.setCursor(10, 10);
  oled.println("ROBOLAB STUDIO");
  oled.setCursor(10, 25);
  oled.println("MicroPython IoT");
  oled.setCursor(10, 40);
  oled.println("Status: ONLINE");
  oled.display();
}

void loop() {}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="text"><field name="TEXT">ROBOLAB STUDIO</field></block></value></block></statement></block><block type="arduino_loop" x="40" y="150"></block></xml>`
  },
  {
    title: "5. Interrupt & Sensor Jarak",
    desc: "Menggunakan event interrupt pin dan menghitung jarak ultrasonic HC-SR04 secara presisi.",
    content: "### 5. Interrupts & Pengukuran Jarak Ultrasonik\nInterrupt (Interupsi) memungkinkan mikrokontroler merespons kejadian eksternal secara langsung tanpa harus terus-menerus melakukan polling pin.\n\nKonsep Utama:\n- **Pin.irq()**: Mengonfigurasi interupsi pada pin masukan (misal: tombol ditekan).\n- **Sensor Ultrasonik (HC-SR04)**: Mengirimkan pulsa trigger 10us dan mengukur waktu pantulan echo menggunakan `time.ticks_us()`.",
    code: `import machine
import time

# Pin trigger dan echo untuk sensor jarak HC-SR04
trigger = machine.Pin(12, machine.Pin.OUT)
echo = machine.Pin(13, machine.Pin.IN)

def ukur_jarak():
    # Kirim pulsa trigger 10 mikrodetik
    trigger.value(0)
    time.sleep_us(2)
    trigger.value(1)
    time.sleep_us(10)
    trigger.value(0)
    
    # Tunggu pulsa pantulan (echo) naik
    while echo.value() == 0:
        pulsa_mulai = time.ticks_us()
        
    # Tunggu pulsa pantulan turun
    while echo.value() == 1:
        pulsa_selesai = time.ticks_us()
        
    # Hitung selisih waktu dalam mikrodetik
    durasi = time.ticks_diff(pulsa_selesai, pulsa_mulai)
    
    # Jarak (cm) = durasi / 58
    jarak = durasi / 58
    return jarak

print("Memulai pembacaan sensor jarak...")
while True:
    jarak_objek = ukur_jarak()
    print("Jarak Terdeteksi:", round(jarak_objek, 1), "cm")
    time.sleep(0.5)
`,
    cppCode: `// C++ Arduino - Interrupt & Sensor Jarak
const int trigger = 12;
const int echo = 13;

float ukur_jarak() {
  digitalWrite(trigger, LOW);
  delayMicroseconds(2);
  digitalWrite(trigger, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigger, LOW);
  
  long durasi = pulseIn(echo, HIGH);
  float jarak = durasi / 58.0;
  return jarak;
}

void setup() {
  pinMode(trigger, OUTPUT);
  pinMode(echo, INPUT);
  Serial.begin(115200);
  Serial.println("Memulai pembacaan sensor jarak...");
}

void loop() {
  float jarak_objek = ukur_jarak();
  Serial.print("Jarak Terdeteksi: ");
  Serial.print(jarak_objek);
  Serial.println(" cm");
  delay(500);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"></block><block type="arduino_loop" x="40" y="120"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="sensor_ultrasonic"><field name="TRIGGER">12</field><field name="ECHO">13</field></block></value><next><block type="arduino_delay"><field name="MS">500</field></block></next></block></statement></block></xml>`
  },
  {
    title: "6. Multitasking (uasyncio)",
    desc: "Menjalankan beberapa proses secara asinkron seperti mengedipkan LED dan membaca sensor tanpa blocking.",
    content: "### 6. Asynchronous Programming (uasyncio)\nPada program tradisional, fungsi `time.sleep()` membekukan seluruh eksekusi. Modul `uasyncio` memungkinkan sistem berpindah tugas secara cerdas saat suatu proses sedang menunggu jeda (non-blocking delay).\n\nKonsep Utama:\n- **async def**: Mendeklarasikan fungsi asinkron (coroutine).\n- **await asyncio.sleep()**: Jeda waktu non-blocking, membiarkan tugas lain berjalan.",
    code: `import uasyncio as asyncio
import machine

led1 = machine.Pin(2, machine.Pin.OUT)
led2 = machine.Pin(4, machine.Pin.OUT)

async def blink_led_cepat():
    while True:
        led1.on()
        await asyncio.sleep(0.2)
        led1.off()
        await asyncio.sleep(0.2)

async def blink_led_lambat():
    while True:
        led2.on()
        await asyncio.sleep(1.0)
        led2.off()
        await asyncio.sleep(1.0)

async def main():
    print("Menjalankan multi-tasking asinkron...")
    await asyncio.gather(
        blink_led_cepat(),
        blink_led_lambat()
    )

# Jalankan event loop
asyncio.run(main())
`,
    cppCode: `// C++ Arduino - Multitasking (millis scheduler)
const int led1 = 2;
const int led2 = 4;

unsigned long lastTime1 = 0;
unsigned long lastTime2 = 0;
bool state1 = false;
bool state2 = false;

void setup() {
  pinMode(led1, OUTPUT);
  pinMode(led2, OUTPUT);
  Serial.begin(115200);
  Serial.println("Menjalankan multi-tasking...");
}

void loop() {
  unsigned long sekarang = millis();
  
  if (sekarang - lastTime1 >= 200) {
    lastTime1 = sekarang;
    state1 = !state1;
    digitalWrite(led1, state1);
  }
  
  if (sekarang - lastTime2 >= 1000) {
    lastTime2 = sekarang;
    state2 = !state2;
    digitalWrite(led2, state2);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block></statement></block><block type="arduino_loop" x="40" y="150"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="arduino_delay"><field name="MS">200</field></block></next></block></statement></block></xml>`
  },
  {
    title: "7. Web Server IoT & Wifi",
    desc: "Menghubungkan ESP32 ke jaringan WiFi dan membuat Web Server lokal untuk mengendalikan hardware.",
    content: "### 7. Koneksi Wifi & Web Server Lokal\nESP32 memiliki chip WiFi terintegrasi. Kita dapat menggunakannya sebagai Station (STA) untuk terhubung ke router, lalu membuat Web Server HTTP untuk kontrol perangkat.\n\nTahapan Koneksi WiFi:\n- **network.WLAN(STA_IF)**: Mengaktifkan mode Station.\n- **wifi.connect(ssid, pass)**: Terhubung ke jaringan.\n- **wifi.isconnected()**: Cek status koneksi.\n- **wifi.ifconfig()**: Mendapatkan tuple (IP, subnet, gateway, DNS).",
    code: `import network
import socket
import machine
import time

# === LANGKAH 1: Koneksi ke WiFi ===
SSID = "NamaWiFi"
PASSWORD = "passwordwifi"

wifi = network.WLAN(network.STA_IF)
wifi.active(True)

print("Menghubungkan ke WiFi...")
wifi.connect(SSID, PASSWORD)

while not wifi.isconnected():
    time.sleep(1)
    print(".", end="")

print("\\nBERHASIL!")
print("Konfigurasi IP:", wifi.ifconfig())

# === LANGKAH 2: Buka Web Server di port 80 ===
led = machine.Pin(2, machine.Pin.OUT)

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind(('', 80))
s.listen(5)

html = """<html>
<head><title>ESP32 Web Server</title></head>
<body>
<h1>RoboLab Web Controller</h1>
<p><a href="/led/on"><button>LED ON</button></a></p>
<p><a href="/led/off"><button>LED OFF</button></a></p>
</body>
</html>"""

print("Web Server berjalan di port 80")
while True:
    conn, addr = s.accept()
    request = conn.recv(1024).decode('utf-8')
    if '/led/on' in request:
        led.on()
    elif '/led/off' in request:
        led.off()
    conn.send('HTTP/1.1 200 OK\\nContent-Type: text/html\\n\\n')
    conn.send(html)
    conn.close()
`,
    cppCode: `// C++ Arduino - Web Server IoT & Wifi
#include <WiFi.h>
#include <WebServer.h>

const char* ssid     = "NamaWiFi";
const char* password = "passwordwifi";
const int led = 2;
WebServer server(80);

void handleRoot() {
  String html = "<html><head><title>ESP32 Web Server</title></head><body>";
  html += "<h1>RoboLab Web Controller</h1>";
  html += "<p><a href=\\"/led/on\\"><button>LED ON</button></a></p>";
  html += "<p><a href=\\"/led/off\\"><button>LED OFF</button></a></p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Menghubungkan...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nBERHASIL!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  server.on("/", handleRoot);
  server.on("/led/on", []() { digitalWrite(led, HIGH); handleRoot(); });
  server.on("/led/off", []() { digitalWrite(led, LOW); handleRoot(); });
  server.begin();
  Serial.println("Web Server berjalan di port 80.");
}

void loop() {
  server.handleClient();
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="text"><field name="TEXT">Web Server Online</field></block></value></block></statement></block><block type="arduino_loop" x="40" y="150"></block></xml>`
  },
  {
    title: "8. Kontrol PID Robot (Expert)",
    desc: "Implementasi algoritma kontroler Proportional-Integral-Derivative (PID) untuk stabilitas robot.",
    content: "### 8. Algoritma Kontrol PID\nPID adalah algoritma umpan balik (feedback loop) untuk mengontrol aktuator (seperti kecepatan motor) agar secara otomatis menyesuaikan diri ke target yang diinginkan (setpoint).\n\nElemen Kontroler:\n- **P (Proportional)**: Koreksi sebanding dengan error saat ini.\n- **I (Integral)**: Akumulasi error masa lalu untuk menghilangkan error konstan.\n- **D (Derivative)**: Prediksi kecenderungan error masa depan.",
    code: `import time

class PIDController:
    def __init__(self, kp, ki, kd, setpoint=0):
        self.kp = kp
        self.ki = ki
        self.kd = kd
        self.setpoint = setpoint
        self.prev_error = 0
        self.integral = 0
        self.last_time = time.ticks_ms()
        
    def hitung(self, pv):
        sekarang = time.ticks_ms()
        dt = time.…138888 tokens truncated…</div>
          </div>
          
          <div className={`p-2.5 rounded-lg border transition ${
            dist >= 10 && dist < 30 
              ? 'bg-yellow-500/10 border-yellow-500/60 text-yellow-400 font-bold' 
              : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}>
            <span className="text-pink-500">elif</span> jarak_benda &gt;= 10 <span className="text-pink-500">and</span> jarak_benda &lt; 30:
            <div className="pl-4 mt-0.5 font-bold text-yellow-550">print("Peringatan: Objek terdeteksi. Bersiap belok.")</div>
          </div>
          
          <div className={`p-2.5 rounded-lg border transition ${
            dist >= 30 
              ? 'bg-emerald-500/10 border-emerald-500/60 text-emerald-400 font-bold' 
              : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}>
            <span className="text-pink-500">else</span>:
            <div className="pl-4 mt-0.5 font-bold text-emerald-500">print("Kondisi aman. Maju lurus.")</div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Logika Percabangan</span>
        Gunakan operator perbandingan seperti `&lt;`, `&gt;=`, dan operator logika `and`, `or` untuk merangkai kondisi rumit pada robot.
      </div>
    </div>
  );
};

const LoopPlayground = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  
  const runSimulation = async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setLogs([]);
    
    setActiveStep('for');
    setLogs(p => [...p, "--- Contoh Perulangan FOR ---"]);
    await new Promise(r => setTimeout(r, 600));
    for (let i = 1; i <= 3; i++) {
      setActiveStep('for-body');
      setLogs(p => [...p, `Pemindaian sensor ke-${i}`]);
      await new Promise(r => setTimeout(r, 600));
    }
    
    setActiveStep('while-init');
    setLogs(p => [...p, "", "--- Contoh Perulangan WHILE ---"]);
    await new Promise(r => setTimeout(r, 600));
    let counter = 3;
    while (counter > 0) {
      setActiveStep('while-condition');
      await new Promise(r => setTimeout(r, 400));
      setActiveStep('while-body');
      setLogs(p => [...p, `Mundur dalam hitungan: ${counter}`]);
      counter--;
      await new Promise(r => setTimeout(r, 600));
    }
    setActiveStep('while-end');
    setLogs(p => [...p, "BUM! Pergerakan selesai."]);
    await new Promise(r => setTimeout(r, 600));
    
    setActiveStep(null);
    setIsPlaying(false);
  };
  
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulator Loop & Eksekusi Baris</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col gap-3 min-h-[300px] justify-between">
        <button 
          onClick={runSimulation}
          disabled={isPlaying}
          className={`w-full py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none ${
            isPlaying ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Play className="w-3 h-3" />
          {isPlaying ? 'Simulasi Sedang Berjalan...' : 'Mulai Jalankan Perulangan'}
        </button>
        
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 font-mono text-[8px] space-y-1.5">
            <span className="text-slate-500 block border-b border-slate-800 pb-1 mb-1 font-sans">Kode Program</span>
            
            <div className={`p-0.5 rounded ${activeStep === 'for' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-slate-400'}`}>
              <span className="text-pink-500">for</span> i <span className="text-pink-500">in</span> range(1, 4):
            </div>
            <div className={`p-0.5 pl-3 rounded ${activeStep === 'for-body' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-500'}`}>
              print("Pemindaian ke-", i)
            </div>
            
            <div className={`p-0.5 rounded ${activeStep === 'while-init' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-slate-400'}`}>
              counter = 3
            </div>
            <div className={`p-0.5 rounded ${activeStep === 'while-condition' ? 'bg-blue-500/20 text-blue-400 font-bold' : 'text-slate-400'}`}>
              <span className="text-pink-500">while</span> counter &gt; 0:
            </div>
            <div className={`p-0.5 pl-3 rounded ${activeStep === 'while-body' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-500'}`}>
              print("Mundur...", counter)
              counter = counter - 1
            </div>
            <div className={`p-0.5 rounded ${activeStep === 'while-end' ? 'bg-purple-500/20 text-purple-400 font-bold' : 'text-slate-400'}`}>
              print("BUM! Pergerakan selesai.")
            </div>
          </div>
          
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-850 font-mono text-[8px] text-emerald-400 space-y-1 overflow-y-auto flex flex-col justify-start">
            <span className="text-slate-500 border-b border-slate-800 pb-1 mb-1 font-sans">Console Output</span>
            {logs.map((log, idx) => (
              <div key={idx} className={log === "" ? "h-1" : ""}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Logika Perulangan</span>
        Looping berulang mengeksekusi blok kode. `for` digunakan saat jumlah iterasi sudah pasti, sedangkan `while` berjalan selama ekspresi logika bernilai `True`.
      </div>
    </div>
  );
};

const FunctionPlayground = () => {
  const [lebar, setLebar] = useState(5);
  const [panjang, setPanjang] = useState(10);
  const [baterai, setBaterai] = useState(15);
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visualisasi Pemanggilan Fungsi</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col gap-4 min-h-[300px] justify-center">
        
        <div className="p-2.5 bg-slate-900/30 rounded-lg border border-slate-850 space-y-2">
          <span className="text-[9px] text-blue-400 font-mono font-bold">def hitung_luas_area(lebar, panjang):</span>
          <div className="flex items-center gap-4 text-[10px]">
            <div className="flex-1 space-y-1">
              <span className="text-[8px] text-slate-500">Lebar ({lebar}):</span>
              <input type="range" min="1" max="15" value={lebar} onChange={(e) => setLebar(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded accent-blue-500" />
            </div>
            <div className="flex-1 space-y-1">
              <span className="text-[8px] text-slate-500">Panjang ({panjang}):</span>
              <input type="range" min="1" max="25" value={panjang} onChange={(e) => setPanjang(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded accent-blue-500" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-900 pt-2 font-mono text-[9px]">
            <span className="text-slate-500">hitung_luas_area({lebar}, {panjang})</span>
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>{lebar * panjang} (Return Value)</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-slate-900/30 rounded-lg border border-slate-850 space-y-2">
          <span className="text-[9px] text-purple-400 font-mono font-bold">def status_baterai(level):</span>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-[8px] text-slate-500">Level Baterai ({baterai}%):</span>
              <input type="range" min="5" max="100" value={baterai} onChange={(e) => setBaterai(Number(e.target.value))} className="w-24 h-1 bg-slate-800 rounded accent-purple-500" />
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-900 pt-2 font-mono text-[9px]">
            <span className="text-slate-500">status_baterai({baterai})</span>
            <div className={`flex items-center gap-1 font-bold ${baterai < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span>"{baterai < 20 ? 'Baterai Lemah!' : 'Baterai Aman.'}"</span>
            </div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Fungsi (Functions)</span>
        Fungsi menerima parameter input, memproses data di dalamnya, dan mengembalikan hasil ke program utama menggunakan kata kunci `return`.
      </div>
    </div>
  );
};

const OopPlayground = () => {
  const [motorName, setMotorName] = useState("Motor Kiri");
  const [motorPin, setMotorPin] = useState(5);
  const [motorSpeed, setMotorSpeed] = useState(150);
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instansiasi Objek (OOP)</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col gap-4 min-h-[300px] justify-center">
        <div className="grid grid-cols-2 gap-3 text-[9px] font-mono">
          <div className="space-y-1">
            <span className="text-slate-500">Nama Objek:</span>
            <input type="text" value={motorName} onChange={(e) => setMotorName(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none" />
          </div>
          <div className="space-y-1">
            <span className="text-slate-500">Pin PWM:</span>
            <input type="number" min="0" max="32" value={motorPin} onChange={(e) => setMotorPin(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white focus:outline-none" />
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-500">motor.set_speed():</span>
            <span className="font-bold text-emerald-400">{motorSpeed} RPM</span>
          </div>
          <input type="range" min="0" max="255" value={motorSpeed} onChange={(e) => setMotorSpeed(Number(e.target.value))} className="w-full h-1 bg-slate-800 rounded accent-emerald-500" />
        </div>
        
        <div className="relative rounded-lg bg-slate-900/40 p-3 border border-slate-850 font-mono text-[9px] space-y-2 flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-purple-400 font-bold"># Object Instance</div>
            <div>motor_kiri = MotorRobot("{motorName}", {motorPin})</div>
            <div className="text-slate-500 mt-1">Properties:</div>
            <div className="pl-2">- self.nama = "{motorName}"</div>
            <div className="pl-2">- self.pin = {motorPin}</div>
            <div className="pl-2">- self.kecepatan = {motorSpeed}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center gap-1.5 pr-1">
            <span className="text-[8px] text-slate-500 font-sans">Simulasi Motor</span>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: "linear", duration: motorSpeed > 0 ? (260 - motorSpeed) / 50 : 0 }}
              className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-blue-500 flex items-center justify-center shadow-lg"
            >
              <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
            </motion.div>
            <span className="text-[7.5px] font-bold text-blue-400 uppercase tracking-wider">{motorSpeed > 0 ? 'Spinning' : 'Stopped'}</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Pemrograman Berorientasi Objek</span>
        Class bertindak sebagai *blueprint* (cetakan). Objek (`motor_kiri`) adalah instansiasi nyata yang menyimpan variabel internal sendiri (`self.kecepatan`).
      </div>
    </div>
  );
};

const InheritancePlayground = () => {
  const [hoveredClass, setHoveredClass] = useState<'parent' | 'child' | null>(null);
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pewarisan Kelas (Inheritance)</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col gap-3 min-h-[300px] justify-center items-center font-mono">
        
        <div 
          onMouseEnter={() => setHoveredClass('parent')}
          onMouseLeave={() => setHoveredClass(null)}
          className={`w-full max-w-[240px] p-3 rounded-lg border transition cursor-default ${
            hoveredClass === 'parent' ? 'bg-blue-950/30 border-blue-500 shadow-lg' : 'bg-slate-900/30 border-slate-800'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-400">class SensorDasar:</div>
          <div className="text-[8px] text-slate-500 mt-0.5"># Parent Class (Induk)</div>
          <div className="text-[8.5px] text-slate-400 pl-2 space-y-0.5 mt-1.5">
            <div>def __init__(self, nama)</div>
            <div className="text-emerald-400">def baca(self) -&gt; "Nilai dasar"</div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-8 text-slate-600">
          <div className="w-0.5 h-6 bg-slate-850 relative">
            <div className="absolute -top-1 -left-[3px] border-b-4 border-l-[4px] border-r-[4px] border-transparent border-b-slate-700"></div>
          </div>
        </div>

        <div 
          onMouseEnter={() => setHoveredClass('child')}
          onMouseLeave={() => setHoveredClass(null)}
          className={`w-full max-w-[240px] p-3 rounded-lg border transition cursor-default ${
            hoveredClass === 'child' ? 'bg-purple-950/30 border-purple-500 shadow-lg' : 'bg-slate-900/30 border-slate-800'
          }`}
        >
          <div className="text-[10px] font-bold text-purple-400">class SensorJarak(SensorDasar):</div>
          <div className="text-[8px] text-slate-500 mt-0.5"># Child Class (Anak) Mewarisi</div>
          <div className="text-[8.5px] text-slate-400 pl-2 space-y-0.5 mt-1.5">
            <div>def __init__(self, nama, trig)</div>
            <div className="text-purple-400 font-bold"># Override Method</div>
            <div className="text-emerald-400">def baca(self) -&gt; "Jarak: 25 cm"</div>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Pewarisan (Inheritance)</span>
        Class anak mewarisi seluruh fungsi & variabel milik induknya. Dengan *override*, class anak dapat meredefinisi fungsi induk agar sesuai kebutuhan barunya.
      </div>
    </div>
  );
};

const BlinkVisualizer = () => {
  const [isOn, setIsOn] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOn(p => !p);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulasi Sirkuit Blink LED</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-5">
        <div className="text-[10px] font-mono text-center text-slate-500">Board: ESP32 DevKit V1 (Pin 2)</div>
        
        <div className="relative w-36 h-48 bg-zinc-900 border-2 border-zinc-800 rounded-xl flex flex-col items-center p-3 shadow-2xl">
          <div className="w-20 h-14 bg-gradient-to-br from-zinc-400 to-zinc-600 rounded-lg flex items-center justify-center border border-zinc-300 shadow-md">
            <span className="text-[7.5px] font-bold text-zinc-950 tracking-wider">ESP-WROOM-32</span>
          </div>
          
          <div className="text-[7.5px] text-zinc-600 mt-2 font-mono">GPIO PINS (3.3V)</div>
          
          <div className="absolute left-[-2px] top-10 flex flex-col gap-1.5">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="w-1.5 h-1 bg-yellow-600 rounded-r border-t border-yellow-400"></div>
            ))}
          </div>

          <div className="absolute right-[-2px] top-10 flex flex-col gap-1.5">
            {Array(12).fill(0).map((_, i) => (
              <div key={i} className="w-1.5 h-1 bg-yellow-600 rounded-l border-t border-yellow-400"></div>
            ))}
          </div>

          <div className="absolute right-2 top-28 flex flex-col items-center">
            <span className="text-[6.5px] text-slate-500 font-mono">D2</span>
            <div className={`w-3.5 h-3.5 rounded-full border border-slate-950 transition-all duration-300 ${
              isOn 
                ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' 
                : 'bg-red-950'
            }`}></div>
          </div>
          
          <div className="absolute left-2 top-28 flex flex-col items-center">
            <span className="text-[6.5px] text-slate-500 font-mono">PWR</span>
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono">Status LED:</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
            isOn ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}>{isOn ? 'High (3.3V)' : 'Low (0V)'}</span>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Dasar Digital I/O</span>
        Pin digital hanya memiliki dua nilai: `HIGH` (ada tegangan, senilai 3.3V) dan `LOW` (tanpa tegangan, 0V). Fungsi `time.sleep(1)` membuat jeda waktu sebelum berganti state.
      </div>
    </div>
  );
};

const PwmVisualizer = () => {
  const [duty, setDuty] = useState(512);
  useEffect(() => {
    const interval = setInterval(() => {
      setDuty(prev => {
        const next = prev + 32;
        return next > 1023 ? 0 : next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);
  
  const percentage = (duty / 1023) * 100;
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulasi Modulasi PWM (Fading)</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-5">
        <div className="text-[10px] font-mono text-center text-slate-500">Duty Cycle: {duty} / 1023 ({Math.round(percentage)}%)</div>
        
        <div className="relative flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full border border-slate-700 bg-slate-900 flex items-center justify-center" style={{
            boxShadow: `0 0 ${percentage / 3}px rgba(251, 191, 36, ${duty / 1023})`
          }}>
            <div className="w-8 h-8 rounded-full transition-all duration-100" style={{
              background: `radial-gradient(circle, rgba(251,191,36,1) 0%, rgba(251,191,36,0) 80%)`,
              opacity: duty / 1023
            }}></div>
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-2">Kecerahan LED</span>
        </div>

        <div className="w-full bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
          <span className="text-[8px] text-slate-500 font-mono">Visualisasi Bentuk Gelombang Sinyal:</span>
          <div className="h-10 border-l border-b border-slate-800 flex items-end overflow-hidden relative">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path 
                d={`M 0,40 L 0,10 L ${percentage / 2},10 L ${percentage / 2},40 L 50,40 L 50,10 L ${50 + percentage / 2},10 L ${50 + percentage / 2},40 L 100,40`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Mengenal PWM</span>
        PWM merubah rasio waktu aktif sinyal (`Duty Cycle`). Semakin besar duty cycle, semakin lama tegangan HIGH bertahan, sehingga daya rata-rata yang dikeluarkan meningkat.
      </div>
    </div>
  );
};

const AdcVisualizer = ({ virtualPotVal, setVirtualPotVal }: {
  virtualPotVal: number,
  setVirtualPotVal: (val: number) => void
}) => {
  const voltage = (virtualPotVal / 4095) * 3.3;
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Input Analog (ADC)</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-6">
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500">Putar Potensiometer Virtual:</span>
          
          <div className="relative w-20 h-20 rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center shadow-lg cursor-pointer">
            <motion.div 
              style={{ rotate: (virtualPotVal / 4095) * 270 - 135 }}
              className="absolute w-full h-full flex items-start justify-center pt-1"
            >
              <div className="w-1.5 h-3 bg-amber-500 rounded-full"></div>
            </motion.div>
            
            <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-mono font-bold text-white">{virtualPotVal}</span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-1">
          <input 
            type="range" 
            min="0" 
            max="4095" 
            value={virtualPotVal} 
            onChange={(e) => setVirtualPotVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[7.5px] text-slate-500 font-mono">
            <span>0 (0V)</span>
            <span>2048 (1.65V)</span>
            <span>4095 (3.3V)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full font-mono text-[9px]">
          <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 text-[7px] uppercase">Nilai Digital</span>
            <span className="font-bold text-amber-400 text-[10px] mt-0.5">{virtualPotVal}</span>
          </div>
          <div className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center">
            <span className="text-slate-500 text-[7px] uppercase">Tegangan Masuk</span>
            <span className="font-bold text-amber-400 text-[10px] mt-0.5">{voltage.toFixed(2)} V</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Konversi ADC</span>
        ADC mengubah tegangan analog kontinyu menjadi representasi numerik. ESP32 memiliki resolusi 12-bit, menghasilkan nilai digital diskrit 0-4095.
      </div>
    </div>
  );
};

const OledVisualizer = () => {
  const [customText, setCustomText] = useState("ROBOLAB STUDIO");
  const [customText2, setCustomText2] = useState("MicroPython IoT");
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulasi Layar I2C OLED</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-4">
        
        <div className="w-48 h-28 rounded-lg bg-[#080b11] border-4 border-zinc-800 p-2 flex flex-col justify-center items-center relative shadow-2xl">
          <div className="w-full text-center border-b border-blue-950/60 pb-1.5 mb-1.5 font-mono text-[8.5px] font-bold text-cyan-400 tracking-wider">
            {customText.toUpperCase()}
          </div>
          <div className="w-full font-mono text-[7.5px] text-yellow-400 space-y-1 pl-1">
            <div>&gt; {customText2}</div>
            <div>&gt; STATUS: ONLINE</div>
            <div>&gt; I2C ADDR: 0x3C</div>
          </div>
        </div>

        <div className="w-full space-y-2 text-[9px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-12 font-mono">Baris 1:</span>
            <input 
              type="text" 
              maxLength={15} 
              value={customText} 
              onChange={(e) => setCustomText(e.target.value)} 
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-12 font-mono">Baris 2:</span>
            <input 
              type="text" 
              maxLength={15} 
              value={customText2} 
              onChange={(e) => setCustomText2(e.target.value)} 
              className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-white focus:outline-none"
            />
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Protokol I2C</span>
        I2C menyederhanakan perkabelan karena hanya menggunakan dua pin bus: SDA (jalur data) dan SCL (jalur detak clock) untuk mengalamati banyak perangkat sekaligus.
      </div>
    </div>
  );
};

const UltrasonicVisualizer = ({ virtualDistVal, setVirtualDistVal }: {
  virtualDistVal: number,
  setVirtualDistVal: (val: number) => void
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simulasi Pengukuran Jarak</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-5">
        
        <div className="w-full h-20 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between px-3 relative overflow-hidden">
          <div className="flex gap-1 z-10">
            <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-cyan-400 flex items-center justify-center font-bold text-[6px] text-cyan-400">TX</div>
            <div className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-cyan-400 flex items-center justify-center font-bold text-[6px] text-cyan-400">RX</div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            {Array(3).fill(0).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.5, ease: "easeOut" }}
                className="absolute border border-cyan-500/30 rounded-full h-16"
                style={{
                  width: virtualDistVal * 1.2,
                  left: '40px',
                }}
              />
            ))}
          </div>

          <motion.div 
            style={{ x: -(100 - virtualDistVal) * 1.0 }}
            className="w-3 h-14 bg-gradient-to-b from-slate-600 to-slate-855 rounded border border-slate-500 z-10"
          ></motion.div>
        </div>

        <div className="w-full space-y-1">
          <div className="flex justify-between items-center text-[10px] font-mono">
            <span className="text-slate-500 font-sans">Jarak Obstacle:</span>
            <span className="font-bold text-cyan-400">{virtualDistVal.toFixed(1)} cm</span>
          </div>
          <input 
            type="range" 
            min="5" 
            max="100" 
            value={virtualDistVal} 
            onChange={(e) => setVirtualDistVal(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        <div className="text-center font-mono text-[8px] text-slate-500">
          Waktu Pantulan Pulsa: <span className="text-cyan-400 font-bold">{Math.round(virtualDistVal * 58)} us</span>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Sensor Sonar HC-SR04</span>
        Sensor mengukur jarak dengan menghitung waktu pantulan pulsa suara ultrasonik (tinggi). Jarak dihitung dengan rumus: `Waktu (us) / 58`.
      </div>
    </div>
  );
};

const AsyncVisualizer = ({ asyncLed1, asyncLed2 }: {
  asyncLed1: boolean,
  asyncLed2: boolean
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visualisasi Multitasking Asinkron</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-5">
        
        <div className="w-full space-y-2.5 font-mono text-[8.5px]">
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-sky-400">Task 1: blink_led_cepat()</span>
              <span className="text-slate-500 text-[7.5px] block">Delay: 0.2 detik (non-blocking)</span>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border border-slate-950 ${
              asyncLed1 ? 'bg-sky-500 shadow-[0_0_12px_#0ea5e9]' : 'bg-sky-950'
            }`}></div>
          </div>

          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-purple-400">Task 2: blink_led_lambat()</span>
              <span className="text-slate-500 text-[7.5px] block">Delay: 1.0 detik (non-blocking)</span>
            </div>
            <div className={`w-3.5 h-3.5 rounded-full border border-slate-950 ${
              asyncLed2 ? 'bg-purple-500 shadow-[0_0_12px_#a855f7]' : 'bg-purple-950'
            }`}></div>
          </div>
        </div>

        <div className="w-full bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <span className="text-[8px] text-slate-500 font-mono">CPU Scheduler Allocation:</span>
          <div className="flex gap-0.5 h-3.5 w-full">
            {Array(18).fill(0).map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-sm transition-colors duration-100 ${
                  i % 3 === 0 
                    ? 'bg-sky-500/60' 
                    : i % 5 === 0 
                      ? 'bg-purple-500/60' 
                      : 'bg-slate-800'
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Mengapa Asyncio?</span>
        Alih-alih diam membeku (`sleep` biasa), task asinkron mengembalikan kendali CPU ke scheduler saat menunggu (`await sleep`), memungkinkan tugas lain berjalan bersamaan.
      </div>
    </div>
  );
};

const WebServerVisualizer = ({ virtualWebLed, setVirtualWebLed }: {
  virtualWebLed: boolean,
  setVirtualWebLed: (val: boolean) => void
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IoT Web Server & Wifi AP</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-4">
        
        <div className="flex items-center gap-3 w-full justify-center">
          <div className="flex flex-col items-center">
            <span className="text-[7.5px] text-slate-500 font-mono">ESP32 Server</span>
            <div className="w-8 h-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center relative">
              <Cpu className="w-4 h-4 text-slate-400" />
              <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${virtualWebLed ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' : 'bg-red-950'}`}></div>
            </div>
          </div>
          
          <div className="flex gap-1 items-center h-3">
            <div className="w-1 h-1 rounded-full bg-cyan-500 animate-ping"></div>
            <div className="w-0.5 h-2.5 bg-cyan-500/20 rounded"></div>
            <div className="w-0.5 h-4 bg-cyan-500/40 rounded"></div>
            <div className="w-0.5 h-5 bg-cyan-500/60 rounded"></div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[7.5px] text-slate-500 font-mono">Mobile Client</span>
            <div className="w-8 h-8 rounded bg-slate-900 border border-slate-850 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="w-40 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-lg font-sans">
          <div className="bg-slate-950 text-white rounded px-2 py-0.5 text-[7px] font-mono flex items-center gap-1 mb-2 truncate">
            <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
            <span>http://192.168.4.1/</span>
          </div>
          <div className="text-center font-bold text-[8px] text-slate-200 mb-1.5">RoboLab Controller</div>
          
          <div className="flex gap-1.5 justify-center">
            <button 
              onClick={() => setVirtualWebLed(true)}
              className={`px-2.5 py-1 rounded text-[7.5px] font-bold transition cursor-pointer select-none ${
                virtualWebLed ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              LED ON
            </button>
            <button 
              onClick={() => setVirtualWebLed(false)}
              className={`px-2.5 py-1 rounded text-[7.5px] font-bold transition cursor-pointer select-none ${
                !virtualWebLed ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              LED OFF
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 IoT & Web Server</span>
        ESP32 bertindak sebagai *Access Point* yang memancarkan sinyal WiFi sendiri, dan menjalankan program Web Server socket port 80 untuk menyajikan laman HTML kontrol.
      </div>
    </div>
  );
};

const PidVisualizer = ({ pidHistory }: {
  pidHistory: number[]
}) => {
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Grafik Respon Loop Kontrol PID</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center items-center min-h-[300px] gap-4">
        
        <div className="w-full h-32 bg-slate-900 rounded-lg border border-slate-800 p-2 relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center text-[7px] text-slate-500 font-mono">
            <span>SetPoint Target: 90.0</span>
            <span className="text-emerald-400 font-bold">Stable</span>
          </div>
          
          <div className="absolute inset-0 top-5 bottom-4 flex flex-col justify-between">
            <div className="w-full border-t border-slate-950"></div>
            <div className="w-full border-t-2 border-dashed border-red-500/40 relative">
              <span className="absolute -top-1.5 left-2 text-[6px] text-red-400/80 font-mono">Target (90°)</span>
            </div>
            <div className="w-full border-t border-slate-950"></div>
          </div>
          
          <div className="w-full h-20 z-10 relative">
            <svg className="w-full h-full text-emerald-400" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path 
                d={pidHistory.length > 0 
                  ? `M ` + pidHistory.map((val, i) => {
                      const x = (i / 19) * 100;
                      const y = 35 - ((val - 55) / 40) * 30;
                      return `${x},${y}`;
                    }).join(' L ')
                  : 'M 0,35'
                } 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              />
            </svg>
          </div>
          
          <div className="flex justify-between text-[7px] text-slate-500 font-mono">
            <span>Time (s)</span>
            <span>Angle: {pidHistory[pidHistory.length - 1]?.toFixed(1) || '0.0'}°</span>
          </div>
        </div>

        <div className="text-[9px] font-mono text-slate-500 flex justify-between w-full">
          <span>Kp=1.2</span>
          <span>Ki=0.1</span>
          <span>Kd=0.05</span>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 Sistem Kontrol PID</span>
        PID adalah algoritma umpan balik tertutup yang secara kontinyu menghitung nilai error dan memberikan koreksi motor secara halus guna mencegah overshoot atau osilasi berlebih.
      </div>
    </div>
  );
};

export default App;
