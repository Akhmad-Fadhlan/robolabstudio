import { useState, useEffect, useRef, lazy, Suspense, useMemo, useCallback } from 'react';
import type { LangCode } from './i18n';
import { t } from './i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Activity, ChevronRight, ChevronLeft, 
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
    { name: 'ArduinoJson', desc: 'Efficient JSON serialization library for embedded C++.', version: '6.21.3', installed: true },
    { name: 'Adafruit_MPU6050', desc: 'Inertial Measurement Unit (IMU) sensor driver library.', version: '2.2.4', installed: false },
    { name: 'Servo', desc: 'Controls servo motors connected to Arduino/ESP32.', version: '1.2.1', installed: true },
    { name: 'Wire', desc: 'I2C communication library for Arduino.', version: '1.0.0', installed: true },
    { name: 'SPI', desc: 'SPI communication library for Arduino.', version: '1.0.0', installed: true },
    { name: 'DHT sensor library', desc: 'Library for DHT11/DHT22 temperature and humidity sensors.', version: '1.4.6', installed: false },
    { name: 'Adafruit_NeoPixel', desc: 'Driver for WS2812B RGB LEDs (NeoPixel strips).', version: '1.11.0', installed: false },
    { name: 'PubSubClient', desc: 'MQTT client library for ESP32 IoT projects.', version: '2.8.0', installed: false },
    { name: 'ESP32Servo', desc: 'Servo library specifically optimized for ESP32.', version: '0.13.0', installed: true },
    { name: 'IRremote', desc: 'Send and receive infrared remote control signals.', version: '4.3.1', installed: false },
    { name: 'Ultrasonic', desc: 'HC-SR04 ultrasonic distance sensor driver.', version: '3.0.0', installed: false },
    { name: 'MFRC522v2', desc: 'Arduino RFID driver library for MFRC522 (SPI, I2C) by Github/OSSLibraries.', version: '2.0.6', installed: true },
    { name: 'WebSockets', desc: 'WebSocket Server and Client for Arduino.', version: '2.4.1', installed: false },
    { name: 'Blynk', desc: 'Blynk IoT library for ESP8266 & ESP32.', version: '1.3.2', installed: false }
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
  servoPin?: string;
  ultrasonicTrigPin?: string;
  ultrasonicEchoPin?: string;
  potPin?: string;
  btnPin?: string;
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
        dt = time.ticks_diff(sekarang, self.last_time) / 1000.0
        if dt <= 0: dt = 0.001
            
        error = self.setpoint - pv
        proportional = error
        self.integral += error * dt
        derivative = (error - self.prev_error) / dt
        
        output = (self.kp * proportional) + (self.ki * self.integral) + (self.kd * derivative)
        
        self.prev_error = error
        self.last_time = sekarang
        return output

# Contoh penggunaan PID untuk menjaga posisi lengan robot
pid = PIDController(kp=1.2, ki=0.1, kd=0.05, setpoint=90.0)

for detik in range(5):
    posisi_sensor = 85.0 + detik * 1.2
    sinyal_koreksi = pid.hitung(posisi_sensor)
    print(f"Detik: {detik} | Posisi: {posisi_sensor} | Koreksi Motor: {round(sinyal_koreksi, 2)}")
    time.sleep(1)
`,
    cppCode: `// C++ Arduino - Kontrol PID
class PIDController {
public:
  float kp, ki, kd, setpoint;
  float prev_error, integral;
  unsigned long last_time;
  
  PIDController(float p, float i, float d, float sp) {
    kp = p; ki = i; kd = d; setpoint = sp;
    prev_error = 0; integral = 0;
    last_time = millis();
  }
  
  float hitung(float pv) {
    unsigned long sekarang = millis();
    float dt = (sekarang - last_time) / 1000.0;
    if (dt <= 0) dt = 0.001;
    
    float error = setpoint - pv;
    float proportional = error;
    integral += error * dt;
    float derivative = (error - prev_error) / dt;
    
    float output = (kp * proportional) + (ki * integral) + (kd * derivative);
    
    prev_error = error;
    last_time = sekarang;
    return output;
  }
};

PIDController pid(1.2, 0.1, 0.05, 90.0);

void setup() {
  Serial.begin(115200);
}

void loop() {
  for (int detik = 0; detik < 5; detik++) {
    float posisi_sensor = 85.0 + detik * 1.2;
    float sinyal_koreksi = pid.hitung(posisi_sensor);
    Serial.print("Detik: "); Serial.print(detik);
    Serial.print(" | Posisi: "); Serial.print(posisi_sensor);
    Serial.print(" | Koreksi Motor: "); Serial.println(sinyal_koreksi);
    delay(1000);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"></block><block type="arduino_loop" x="40" y="120"><statement name="STACK"><block type="pin_analog_write"><field name="PIN">5</field><value name="VALUE"><block type="math_number"><field name="NUM">150</field></block></value></block></statement></block></xml>`
  },
  {
    title: "9. IoT WebSocket & Realtime Data",
    desc: "Mengirim dan menerima data secara real-time dari mikrokontroler menggunakan protokol WebSocket.",
    content: "### 9. Komunikasi Dua Arah dengan WebSocket\nWebSocket memungkinkan komunikasi **real-time dan dua arah (full-duplex)** antara ESP32 (klien) dan server. Sangat cocok untuk dashboard IoT atau remote control minim delay.\n\nTahapan WebSocket:\n- **Koneksi WiFi**: Harus terhubung internet/jaringan lokal terlebih dahulu.\n- **Koneksi WebSocket**: `ws = websocket.WebSocket()`, lalu `ws.connect('ws://...')`\n- **Send/Recv**: Menggunakan `ws.send('data')` dan `ws.recv()`.",
    code: `import network
import websocket
import time

SSID = "NamaWiFi"
PASSWORD = "passwordwifi"
WS_URL = "ws://192.168.1.50/ws"

wifi = network.WLAN(network.STA_IF)
wifi.active(True)
wifi.connect(SSID, PASSWORD)

print("Menghubungkan ke WiFi...")
while not wifi.isconnected():
    time.sleep(1)
    print(".", end="")

print("\\nWiFi Terhubung!")

print("Membuka koneksi WebSocket ke", WS_URL)
ws = websocket.WebSocket()
ws.connect(WS_URL)
print("WebSocket Berhasil Terhubung!")

for i in range(5):
    pesan = f"Halo dari ESP32! Pesan ke-{i+1}"
    print("Mengirim:", pesan)
    ws.send(pesan)
    
    balasan = ws.recv()
    print("Menerima:", balasan)
    
    time.sleep(2)
    
ws.close()
print("WebSocket Ditutup.")
`,
    cppCode: `// C++ Arduino - WebSocket Client
#include <WiFi.h>
#include <WebSocketsClient.h>

const char* ssid     = "NamaWiFi";
const char* password = "passwordwifi";

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    Serial.printf("Menerima: %s\\n", payload);
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  Serial.print("Menghubungkan WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Terhubung!");

  webSocket.begin("192.168.1.50", 80, "/ws");
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();
  
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 2000) {
    webSocket.sendTXT("Halo dari ESP32!");
    Serial.println("Mengirim: Halo dari ESP32!");
    lastSend = millis();
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="text"><field name="TEXT">WebSocket Client Started</field></block></value></block></statement></block></xml>`
  },
  {
    title: "10. IoT WebSocket & Gemini AI",
    desc: "Mengontrol ESP32 menggunakan suara melalui browser dengan bantuan Gemini AI dan protokol WebSocket.",
    content: "### 10. Integrasi Gemini AI dan WebSocket\nProyek ini menggabungkan kemampuan ESP32 sebagai Web Server dan WebSocket Server dengan antarmuka web yang dapat menangkap suara (Voice Recognition) dan memprosesnya menggunakan API Gemini AI dari Google.\n\nTahapan Utama:\n- **Koneksi WiFi**: ESP32 terhubung ke jaringan.\n- **Web Server**: Menjalankan server HTTP ringan untuk mengirimkan halaman HTML kontrol suara.\n- **WebSocket**: Menunggu perintah WebSocket (seperti `LED_ON` atau `LED_OFF`) hasil dari pemrosesan suara dan AI di browser client.",
    code: `import network
import machine
import usocket as socket
import uhashlib
import ubinascii

# ==========================================
# KONFIGURASI WIFI & PIN
# ==========================================
# Inisialisasi LED Pin 2 (Built-in LED ESP32)
led = machine.Pin(2, machine.Pin.OUT)
led.value(0)

# Ganti dengan SSID dan Password WiFi Anda
ssid = "WIFI_SSID_ANDA"
password = "WIFI_PASSWORD_ANDA"

# ==========================================
# SETUP KONEKSI WIFI
# ==========================================
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, password)

print("Menghubungkan ke WiFi...")
while not wlan.isconnected():
    pass

ip_address = wlan.ifconfig()[0]
print("Terhubung! Buka di browser: http://" + ip_address)

# ==========================================
# HALAMAN HTML & JAVASCRIPT (CLIENT SIDE)
# ==========================================
html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ESP32 Gemini AI</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #121212; color: #fff; display: flex; flex-direction: column; align-items: center; padding: 2rem; margin: 0; }
        .chat-box { width: 100%; max-width: 500px; background: #1e1e1e; border-radius: 12px; padding: 1rem; height: 300px; overflow-y: auto; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .btn { background: #4a90e2; color: white; border: none; padding: 12px 24px; border-radius: 24px; font-size: 16px; cursor: pointer; transition: 0.3s; margin-top: 10px;}
        .btn:active { transform: scale(0.95); }
        .btn:disabled { background: #555; }
        .msg { margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; max-width: 80%; word-wrap: break-word; font-size: 14px; line-height: 1.4;}
        .msg.user { background: #005c4b; margin-left: auto; border-bottom-right-radius: 2px;}
        .msg.ai { background: #202c33; margin-right: auto; border-bottom-left-radius: 2px;}
        h2 { margin-bottom: 10px; font-weight: 600;}
        p#status { margin-top: 15px; font-size: 13px; color: #aaa;}
    </style>
</head>
<body>
    <h2>ESP32 AI Voice Control</h2>
    <div class="chat-box" id="chat">
        <div class="msg ai">Halo! Saya asisten AI. Tekan tombol di bawah lalu ucapkan 'nyalakan lampu' atau 'matikan lampu'.</div>
    </div>
    <button class="btn" id="btnMic">Mulai Bicara 🎤</button>
    <p id="status"></p>

    <script>
        // GANTI DENGAN API KEY GEMINI ANDA
        const GEMINI_API_KEY = 'MASUKKAN_API_KEY_ANDA_DISINI';
        
        // Inisialisasi WebSocket ke ESP32
        const ws = new WebSocket('ws://' + location.host + '/ws');
        const chat = document.getElementById('chat');
        const status = document.getElementById('status');
        const btnMic = document.getElementById('btnMic');

        ws.onopen = () => status.innerText = 'WebSocket: Terhubung ke ESP32';
        ws.onerror = () => status.innerText = 'WebSocket: Gagal terhubung';

        function addMsg(text, type) {
            const div = document.createElement('div');
            div.className = 'msg ' + type;
            div.innerText = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        // Cek dukungan browser untuk Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if(SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'id-ID';
            recognition.continuous = false;

            btnMic.onclick = () => {
                recognition.start();
                btnMic.disabled = true;
                btnMic.innerText = 'Mendengarkan...';
                status.innerText = 'Silakan bicara...';
            };

            recognition.onresult = async (event) => {
                btnMic.disabled = false;
                btnMic.innerText = 'Mulai Bicara 🎤';
                
                const text = event.results[0][0].transcript;
                addMsg(text, 'user');

                // 1. Cek Perintah Kontrol Hardware (Kirim ke ESP32)
                const txtLower = text.toLowerCase();
                if(txtLower.includes('nyala') || txtLower.includes('hidup')) {
                    ws.send('LED_ON');
                } else if(txtLower.includes('mati') || txtLower.includes('padam')) {
                    ws.send('LED_OFF');
                }

                // 2. Kirim pesan ke Gemini API
                status.innerText = 'Menghubungi Gemini AI...';
                try {
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ contents: [{ parts: [{ text: text + " (Beri respons singkat maksimal 2 kalimat)" }] }] })
                    });
                    const data = await response.json();
                    
                    if(data.candidates && data.candidates.length > 0) {
                        const aiReply = data.candidates[0].content.parts[0].text;
                        addMsg(aiReply, 'ai');
                        status.innerText = 'Selesai';
                    } else {
                        throw new Error("Respons tidak valid");
                    }
                } catch(e) {
                    addMsg("Maaf, gagal menghubungi AI.", "ai");
                    status.innerText = 'Error API Gemini: ' + e.message;
                }
            };
            
            recognition.onerror = (e) => {
                btnMic.disabled = false;
                btnMic.innerText = 'Mulai Bicara 🎤';
                status.innerText = 'Error Mic: ' + e.error;
            };
        } else {
            status.innerText = 'Browser Anda tidak mendukung Voice Recognition. Silakan gunakan Google Chrome.';
            btnMic.disabled = true;
        }
    </script>
</body>
</html>"""

# ==========================================
# WEBSOCKET & HTTP SERVER (MICROPYTHON)
# ==========================================
def handle_client(s):
    try:
        # Terima request awal dari browser
        req = s.recv(1024).decode('utf-8', 'ignore')
        if not req: return False
        
        # Jika klien me-request upgrade ke WebSocket
        if 'Upgrade: websocket' in req:
            key = ""
            for line in req.split('\\r\\n'):
                if 'Sec-WebSocket-Key:' in line:
                    key = line.split(': ')[1].strip()
            
            if key:
                # Membuat respons Handshake WebSocket (RFC6455)
                magic = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                resp_key = ubinascii.b2a_base64(uhashlib.sha1(magic.encode()).digest())[:-1].decode()
                
                resp = "HTTP/1.1 101 Switching Protocols\\r\\n"
                resp += "Upgrade: websocket\\r\\n"
                resp += "Connection: Upgrade\\r\\n"
                resp += "Sec-WebSocket-Accept: " + resp_key + "\\r\\n\\r\\n"
                
                s.send(resp.encode())
                return True # Kembalikan True menandakan ini sesi WebSocket
                
        # Jika klien hanya me-request HTTP GET biasa (menampilkan antarmuka HTML)
        elif 'GET / ' in req:
            s.send("HTTP/1.1 200 OK\\r\\nContent-Type: text/html\\r\\nConnection: close\\r\\n\\r\\n".encode() + html.encode())
            s.close()
            return False
    except Exception as e:
        print("Error HTTP/Handshake:", e)
    return False

# Setup Socket untuk Web Server
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(('', 80))
sock.listen(1)

print("Server Web/WebSocket berjalan. Menunggu koneksi...")

while True:
    conn, addr = sock.accept()
    
    if handle_client(conn):
        print("Klien WebSocket terhubung dari", addr)
        conn.settimeout(None) # Jangan timeout saat koneksi websocket aktif
        
        while True:
            try:
                # Baca frame websocket
                data = conn.recv(1024)
                if not data: break
                
                # Decoding data frame WebSocket (Text frame unfragmented)
                payload_len = data[1] & 127
                if payload_len > 0 and payload_len < 126:
                    masks = data[2:6]
                    msg_bytes = bytearray(data[6:6+payload_len])
                    
                    # Unmask data
                    for i in range(payload_len):
                        msg_bytes[i] ^= masks[i % 4]
                        
                    cmd = msg_bytes.decode()
                    print("Pesan WS Diterima:", cmd)
                    
                    # LOGIKA KONTROL HARDWARE
                    if cmd == 'LED_ON':
                        led.value(1)
                        print("-> LED Dinyalakan")
                    elif cmd == 'LED_OFF':
                        led.value(0)
                        print("-> LED Dimatikan")
                        
            except Exception as e:
                # Terjadi error atau klien terputus
                break
                
        print("Klien WebSocket terputus")
        conn.close()
`,
    cppCode: `// C++ Arduino - WebSocket Gemini AI Voice Control
// (Fitur ini lebih mudah diimplementasikan dengan MicroPython
// karena ukuran memori dan kompleksitas parsing string pada C++)
void setup() {
  Serial.begin(115200);
  Serial.println("Silakan gunakan mode MicroPython untuk fitur WebSocket Gemini AI.");
}
void loop() {}
`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="text"><field name="TEXT">Gunakan MicroPython</field></block></value></block></statement></block></xml>`
  },
  {
    title: "11. INMP441 & Gemini AI (Direct I2S)",
    desc: "Merekam suara dari mikrofon INMP441, mengirimnya langsung ke Gemini AI via HTTP POST, dan menampilkan respons AI di Serial Monitor.",
    content: "### 11. INMP441 I2S & Gemini AI\nProyek ini mendemonstrasikan pengenalan suara dan respons AI murni menggunakan ESP32 tanpa antarmuka web.\n\nTahapan Utama:\n- **Koneksi WiFi**: ESP32 terhubung ke jaringan.\n- **Rekam I2S**: Membaca data audio mentah dari mikrofon INMP441 selama 2 detik.\n- **Gemini AI**: Mengemas audio menjadi WAV format dan Base64, lalu dikirim via HTTPS POST ke Google Gemini 1.5 Flash (mendukung input audio).\n- **Serial Debugging**: Anda dapat melihat respons cerdas dari AI pada Serial Monitor dan LED akan menyala/mati sesuai perintah.",
    code: `import network
import machine
import time
import urequests
import ubinascii
import struct
import gc
from machine import I2S, Pin

# ==========================================
# KONFIGURASI WIFI & PIN
# ==========================================
ssid = "WIFI_ANDA"
password = "PASSWORD_WIFI"

# Ganti dengan API Key Gemini Anda (Gemini 1.5 Flash mendukung input audio)
GEMINI_API_KEY = "MASUKKAN_API_KEY_ANDA_DISINI"

# Inisialisasi LED Pin 2 (Built-in LED ESP32)
led = Pin(2, Pin.OUT)
led.value(0)

# Konfigurasi Pin I2S INMP441
SCK_PIN = 14
WS_PIN = 15
SD_PIN = 32

audio_in = I2S(0, sck=Pin(SCK_PIN), ws=Pin(WS_PIN), sd=Pin(SD_PIN), 
               mode=I2S.RX, bits=16, format=I2S.MONO, rate=8000, ibuf=20000)

# Tombol BOOT (GPIO 0) untuk mulai merekam
btn = Pin(0, Pin.IN, Pin.PULL_UP)

# ==========================================
# SETUP KONEKSI WIFI
# ==========================================
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, password)

print("Menghubungkan ke WiFi...")
while not wlan.isconnected():
    time.sleep(0.5)
    print(".", end="")
print("\\nTerhubung ke WiFi!")

# ==========================================
# PROGRAM UTAMA
# ==========================================
def record_audio(duration_sec=2.0):
    print("Merekam suara ({} detik)...".format(duration_sec))
    num_bytes = int(8000 * 2 * duration_sec)
    audio_data = bytearray(num_bytes)
    
    num_read = audio_in.readinto(audio_data)
    print("Selesai merekam:", num_read, "bytes")
    
    # Buat WAV header minimal (44 bytes)
    header = b'RIFF' + struct.pack('<I', 36 + num_read) + b'WAVEfmt ' + \\
             struct.pack('<I', 16) + struct.pack('<H', 1) + struct.pack('<H', 1) + \\
             struct.pack('<I', 8000) + struct.pack('<I', 16000) + struct.pack('<H', 2) + \\
             struct.pack('<H', 16) + b'data' + struct.pack('<I', num_read)
             
    full_audio = header + audio_data[:num_read]
    del audio_data # Bebaskan memori
    gc.collect()
    
    print("Mengencode audio...")
    # b2a_base64 menambah karakter newline '\\n', kita harus menghapusnya untuk JSON string
    b64_audio = ubinascii.b2a_base64(full_audio).decode('utf-8').replace('\\n', '')
    del full_audio
    gc.collect()
    
    return b64_audio

def send_to_gemini(b64_audio):
    print("Mengirim ke Gemini AI...")
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY
    
    # Membangun JSON string secara manual untuk menghemat memori
    json_start = '{"contents": [{"parts": [{"text": "Beri respons singkat maksimal 2 kalimat dan jika ada perintah terkait lampu (nyalakan/matikan), berikan konfirmasi."}, {"inlineData": {"mimeType": "audio/wav", "data": "'
    json_end = '"}}]}]}'
    
    payload = json_start + b64_audio + json_end
    headers = {"Content-Type": "application/json"}
    
    try:
        # Mengatur timeout dan melakukan POST
        response = urequests.post(url, headers=headers, data=payload)
        if response.status_code == 200:
            import json
            data = response.json()
            reply = data['candidates'][0]['content']['parts'][0]['text']
            response.close()
            return reply.strip()
        else:
            print("Error API:", response.text)
            response.close()
            return None
    except Exception as e:
        print("Gagal request:", e)
        return None

print("Sistem siap! Tekan & Tahan tombol BOOT (Pin 0) lalu bicaralah.")
while True:
    if btn.value() == 0:
        time.sleep(0.1)
        if btn.value() == 0:
            gc.collect()
            b64 = record_audio(2.0)
            reply = send_to_gemini(b64)
            
            # Bebaskan memori variabel besar
            del b64
            gc.collect()
            
            if reply:
                print("\\n================================")
                print("RESPONS GEMINI AI:")
                print(reply)
                print("================================\\n")
                
                # Cek kontrol hardware dari respons AI atau suara
                txt_lower = reply.lower()
                if "nyala" in txt_lower or "hidup" in txt_lower:
                    led.value(1)
                    print("-> LAMPU (LED) DINYALAKAN\\n")
                elif "mati" in txt_lower or "padam" in txt_lower:
                    led.value(0)
                    print("-> LAMPU (LED) DIMATIKAN\\n")
                    
            print("Siap mendengarkan lagi...")
            time.sleep(1)
`,
    cppCode: `// C++ Arduino - INMP441 Gemini AI
// Disarankan menggunakan MicroPython karena dukungan SSL, HTTP POST,
// dan memory management JSON (String) yang jauh lebih praktis di MicroPython.
void setup() {
  Serial.begin(115200);
  Serial.println("Silakan gunakan mode MicroPython untuk fitur INMP441 Gemini AI.");
}
void loop() {}
`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="arduino_serial_print"><value name="TEXT"><block type="text"><field name="TEXT">Gunakan MicroPython</field></block></value></block></statement></block></xml>`
  }
];

const evalExpr = (exprStr: string, vars: { [key: string]: any }): any => {
  let replaced = exprStr.trim();
  
  // Replace map(var, inMin, inMax, outMin, outMax)
  const mapMatch = replaced.match(/map\(\s*(.*?)\s*,\s*(.*?)\s*,\s*(.*?)\s*,\s*(.*?)\s*,\s*(.*?)\s*\)/);
  if (mapMatch) {
    const val = Number(evalExpr(mapMatch[1], vars));
    const inMin = Number(evalExpr(mapMatch[2], vars));
    const inMax = Number(evalExpr(mapMatch[3], vars));
    const outMin = Number(evalExpr(mapMatch[4], vars));
    const outMax = Number(evalExpr(mapMatch[5], vars));
    return Math.round(outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin));
  }

  // Replace int(var) with Math.floor(var) using a balanced parenthesis parser
  let intIdx = replaced.indexOf('int(');
  while (intIdx >= 0) {
    let parenCount = 1;
    let endIdx = -1;
    for (let i = intIdx + 4; i < replaced.length; i++) {
      if (replaced[i] === '(') parenCount++;
      else if (replaced[i] === ')') {
        parenCount--;
        if (parenCount === 0) {
          endIdx = i;
          break;
        }
      }
    }
    if (endIdx > intIdx) {
      const inner = replaced.slice(intIdx + 4, endIdx);
      replaced = replaced.slice(0, intIdx) + 'Math.floor(' + inner + ')' + replaced.slice(endIdx + 1);
      intIdx = replaced.indexOf('int(', intIdx + 12);
    } else {
      break;
    }
  }

  // Replace variables names with word boundaries
  for (const name of Object.keys(vars)) {
    const regex = new RegExp(`\\b${name}\\b`, 'g');
    replaced = replaced.replace(regex, vars[name]);
  }

  try {
    // Safe evaluation for math and comparison expressions
    const cleaned = replaced.replace(/True/g, 'true').replace(/False/g, 'false');
    if (/^[0-9+\-*/().\s|Math.floor&|!=<>truefals]+$/.test(cleaned)) {
      // eslint-disable-next-line no-eval
      return eval(cleaned);
    }
  } catch (e) {
    console.warn("Failed to evaluate math expression:", replaced, e);
  }
  return exprStr;
};

const evalPrintArgs = (argStr: string, vars: { [key: string]: any }, sensorData?: any, wifiSimVars?: { ip: string, ssid: string, connected: boolean }): string => {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < argStr.length; i++) {
    const char = argStr[i];
    if ((char === '"' || char === "'") && (i === 0 || argStr[i-1] !== '\\')) {
      if (inQuotes && char === quoteChar) {
        inQuotes = false;
      } else if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      }
      current += char;
    } else if (char === ',' && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }

  return args.filter(arg => {
    // Filter out keyword arguments like end="", sep=" " from output
    return !(/^(end|sep|file|flush)\s*=/.test(arg));
  }).map(arg => {
    let cleanArg = arg.trim();
    // Strip Arduino F() flash string macro: F("text") -> "text"
    if (cleanArg.startsWith('F("') && cleanArg.endsWith('")')) {
      cleanArg = cleanArg.slice(2, -1);
    } else if (cleanArg.startsWith("F('") && cleanArg.endsWith("')")) {
      cleanArg = cleanArg.slice(2, -1);
    }
    arg = cleanArg;

    // Check if starts and ends with quotes
    if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
      return arg.substring(1, arg.length - 1);
    }

    // Check wifi/network simulation expressions
    if (arg === 'wifi.ifconfig()' || arg === 'wlan.ifconfig()' || arg === 'sta.ifconfig()' || arg === 'network.ifconfig()') {
      const ip = wifiSimVars?.ip || '192.168.1.100';
      return `('${ip}', '255.255.255.0', '192.168.1.1', '8.8.8.8')`;
    }
    if (arg === 'wifi.config(\'essid\')' || arg === "wifi.config('essid')") {
      return wifiSimVars?.ssid || 'MyWiFi';
    }
    
    // Check if variable is defined
    if (vars[arg] !== undefined) {
      return String(vars[arg]);
    }
    
    // Check f-strings e.g. f"Cahaya: {light}"
    const fStringMatch = arg.match(/^f['"](.*)['"]$/);
    if (fStringMatch) {
      let content = fStringMatch[1];
      const braceRegex = /\{(.*?)\}/g;
      content = content.replace(braceRegex, (_, expr) => {
        const trimmedExpr = expr.trim();
        if (vars[trimmedExpr] !== undefined) return String(vars[trimmedExpr]);
        // wifi ifconfig inside f-string
        if (trimmedExpr === 'wifi.ifconfig()' || trimmedExpr === 'wlan.ifconfig()') {
          const ip = wifiSimVars?.ip || '192.168.1.100';
          return `('${ip}', '255.255.255.0', '192.168.1.1', '8.8.8.8')`;
        }
        if (trimmedExpr.includes('.ifconfig()')) {
          const ip = wifiSimVars?.ip || '192.168.1.100';
          return `('${ip}', '255.255.255.0', '192.168.1.1', '8.8.8.8')`;
        }
        if (sensorData) {
          if (trimmedExpr === 'light') return String(Math.round(sensorData.temp * 4));
          if (trimmedExpr === 'temp' || trimmedExpr === 'temperature') return String(sensorData.temp);
          if (trimmedExpr === 'heading') return '180';
          if (trimmedExpr === 'dist' || trimmedExpr === 'distance' || trimmedExpr === 'sensor_jarak') return String(sensorData.distance);
        }
        return trimmedExpr;
      });
      return content;
    }

    // Check ternary conditions "Aktif" if aktif else "Mati"
    if (arg.includes(' if ') && arg.includes(' else ')) {
      const match = arg.match(/(.*?)\s+if\s+(.*?)\s+else\s+(.*)/);
      if (match) {
        const valTrue = evalPrintArgs(match[1].trim(), vars, sensorData);
        const cond = match[2].trim();
        const valFalse = evalPrintArgs(match[3].trim(), vars, sensorData);
        
        let condVal = false;
        if (cond === 'True') condVal = true;
        else if (cond === 'False') condVal = false;
        else if (vars[cond] !== undefined) condVal = !!vars[cond] && vars[cond] !== 'False';
        return condVal ? valTrue : valFalse;
      }
    }

    // Check str(var)
    const strMatch = arg.match(/^str\((.*?)\)$/);
    if (strMatch) {
      const inner = strMatch[1].trim();
      if (vars[inner] !== undefined) return String(vars[inner]);
      return inner;
    }

    // Check concatenation with +
    if (arg.includes('+')) {
      return arg.split('+').map(p => evalPrintArgs(p.trim(), vars, sensorData)).join('');
    }

    return arg;
  }).join(' ');
};

// ── Project-specific Blockly XML templates ──────────────────────────────────

// Project 1: LED Dimmer & Switch (Arduino) — pot+button+LED
const ledDimmerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write">
        <field name="PIN">9</field><field name="STATE">LOW</field>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="pin_digital_read"><field name="PIN">2</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_analog_write">
            <field name="PIN">9</field>
            <value name="VALUE"><block type="pin_analog_read"><field name="PIN">A0</field></block></value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_analog_write">
            <field name="PIN">9</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 2: Obstacle Avoidance Scanner (Arduino) — ultrasonic+servo
const obstacleScannerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write">
        <field name="PIN">12</field><field name="STATE">LOW</field>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">3</field>
        <value name="ANGLE"><block type="math_number"><field name="NUM">90</field></block></value>
        <next>
          <block type="arduino_delay"><field name="MS">300</field>
            <next>
              <block type="arduino_serial_print">
                <value name="TEXT">
                  <block type="sensor_ultrasonic">
                    <field name="TRIG">12</field><field name="ECHO">13</field>
                  </block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 3: Smart Light & Compass (micro:bit)
const smartLightXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_on_start" x="40" y="40">
    <statement name="STACK">
      <block type="basic_show_string">
        <value name="TEXT"><block type="text"><field name="TEXT">ROBOLAB</field></block></value>
      </block>
    </statement>
  </block>
  <block type="basic_forever" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="input_light_level"/></value>
            <value name="B"><block type="math_number"><field name="NUM">50</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="basic_show_icon"><field name="ICON">SMILE</field></block>
        </statement>
        <statement name="ELSE">
          <block type="basic_show_number">
            <value name="NUM"><block type="input_light_level"/></value>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 4: ESP32 Soccer AI Bot
const esp32SoccerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <value name="IF0"><block type="arduino_serial_available"/></value>
        <statement name="DO0">
          <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field>
            <next><block type="arduino_delay"><field name="MS">500</field></block></next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 5: Arduino Radar Scanner — same logic as obstacle scanner
const radarScannerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">12</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">3</field>
        <value name="ANGLE"><block type="math_number"><field name="NUM">0</field></block></value>
        <next>
          <block type="arduino_delay"><field name="MS">300</field>
            <next>
              <block type="arduino_serial_print">
                <value name="TEXT">
                  <block type="sensor_ultrasonic"><field name="TRIG">12</field><field name="ECHO">13</field></block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 6: Micro:bit Gesture Controller
const gestureControllerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_forever" x="40" y="40">
    <statement name="STACK">
      <block type="controls_if">
        <mutation elseif="1" else="1"/>
        <value name="IF0">
          <block type="input_button_is_pressed"><field name="BUTTON">A</field></block>
        </value>
        <statement name="DO0">
          <block type="basic_show_icon"><field name="ICON">YES</field></block>
        </statement>
        <value name="IF1">
          <block type="input_button_is_pressed"><field name="BUTTON">B</field></block>
        </value>
        <statement name="DO1">
          <block type="basic_show_icon"><field name="ICON">NO</field></block>
        </statement>
        <statement name="ELSE">
          <block type="basic_show_icon"><field name="ICON">HAPPY</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 7: Automated Plant Watering (Arduino) — pot+servo+LED
const plantWateringXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="pin_analog_read"><field name="PIN">A0</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">300</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">HIGH</field>
            <next>
              <block type="arduino_servo_write">
                <field name="PIN">3</field>
                <value name="ANGLE"><block type="math_number"><field name="NUM">90</field></block></value>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field>
            <next>
              <block type="arduino_servo_write">
                <field name="PIN">3</field>
                <value name="ANGLE"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 8: ESP32 Smart Thermostat — pot+LED
const smartThermostatXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_serial_print">
        <value name="TEXT"><block type="pin_analog_read"><field name="PIN">26</field></block></value>
        <next>
          <block type="controls_if">
            <mutation else="1"/>
            <value name="IF0">
              <block type="robolab_logic_compare">
                <field name="OP">LT</field>
                <value name="A"><block type="pin_analog_read"><field name="PIN">26</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">900</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field></block>
            </statement>
            <statement name="ELSE">
              <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
            </statement>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 9: Micro:bit Traffic Light — button+LED
const trafficLightXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_forever" x="40" y="40">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="input_button_is_pressed"><field name="BUTTON">A</field></block>
        </value>
        <statement name="DO0">
          <block type="basic_show_icon"><field name="ICON">YES</field>
            <next>
              <block type="pins_digital_write">
                <field name="PIN">P2</field>
                <value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value>
                <next><block type="basic_pause"><value name="MS"><block type="math_number"><field name="NUM">3000</field></block></value></block></next>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="basic_show_icon"><field name="ICON">NO</field>
            <next>
              <block type="pins_digital_write">
                <field name="PIN">P2</field>
                <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 10: Arduino Pedestrian Crossing — button+LED+tone
const pedestrianCrossingXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="pin_digital_read"><field name="PIN">2</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">HIGH</field>
            <next>
              <block type="arduino_tone">
                <field name="PIN">8</field>
                <value name="FREQ"><block type="math_number"><field name="NUM">440</field></block></value>
                <value name="DURATION"><block type="math_number"><field name="NUM">100</field></block></value>
                <next><block type="arduino_delay"><field name="MS">2000</field></block></next>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field>
            <next><block type="arduino_notone"><field name="PIN">8</field></block></next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 11: ESP32 Weather Station — LCD serial
const weatherStationXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="arduino_serial_print">
        <value name="TEXT"><block type="text"><field name="TEXT">ESP32 Weather Station Ready</field></block></value>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_serial_print">
        <value name="TEXT"><block type="text"><field name="TEXT">Temp: 28.5 C</field></block></value>
        <next><block type="arduino_delay"><field name="MS">1000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 12: Micro:bit Step Counter — gesture shake
const stepCounterXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_on_start" x="40" y="40">
    <statement name="STACK">
      <block type="basic_show_number">
        <value name="NUM"><block type="math_number"><field name="NUM">0</field></block></value>
      </block>
    </statement>
  </block>
  <block type="input_on_gesture" x="40" y="170">
    <field name="GESTURE">shake</field>
    <statement name="HANDLER">
      <block type="basic_show_icon"><field name="ICON">YES</field>
        <next>
          <block type="basic_pause">
            <value name="MS"><block type="math_number"><field name="NUM">200</field></block></value>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 13: Arduino Combination Safe — pot+button+LED
const combinationSafeXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="pin_digital_read"><field name="PIN">2</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="controls_if">
            <mutation else="1"/>
            <value name="IF0">
              <block type="robolab_logic_compare">
                <field name="OP">GT</field>
                <value name="A"><block type="pin_analog_read"><field name="PIN">A0</field></block></value>
                <value name="B"><block type="math_number"><field name="NUM">700</field></block></value>
              </block>
            </value>
            <statement name="DO0">
              <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">HIGH</field>
                <next><block type="arduino_delay"><field name="MS">2000</field></block></next>
              </block>
            </statement>
            <statement name="ELSE">
              <block type="arduino_serial_print">
                <value name="TEXT"><block type="text"><field name="TEXT">Sandi Salah!</field></block></value>
              </block>
            </statement>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 14: ESP32 Intruder Alarm — ultrasonic+LED
const intruderAlarmXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">LT</field>
            <value name="A">
              <block type="sensor_ultrasonic"><field name="TRIG">12</field><field name="ECHO">13</field></block>
            </value>
            <value name="B"><block type="math_number"><field name="NUM">30</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field>
            <next>
              <block type="arduino_serial_print">
                <value name="TEXT"><block type="text"><field name="TEXT">ALARM! Penyusup terdeteksi!</field></block></value>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 15: Micro:bit Night Light — light sensor+LED
const nightLightXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_forever" x="40" y="40">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="input_light_level"/></value>
            <value name="B"><block type="math_number"><field name="NUM">30</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pins_digital_write">
            <field name="PIN">P2</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value>
            <next><block type="basic_show_icon"><field name="ICON">SAD</field></block></next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pins_digital_write">
            <field name="PIN">P2</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
            <next><block type="basic_show_icon"><field name="ICON">SMILE</field></block></next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 16: Arduino Ultrasonic Ruler — ultrasonic+LCD
const ultrasonicRulerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">12</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_serial_print">
        <value name="TEXT">
          <block type="sensor_ultrasonic"><field name="TRIG">12</field><field name="ECHO">13</field></block>
        </value>
        <next><block type="arduino_delay"><field name="MS">500</field></block></next>
      </block>
    </statement>
  </block>
</xml>`;

// Project 17: ESP32 Bluetooth Servo Controller — bluetooth+servo
const bluetoothControllerXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="esp32_bluetooth_begin">
        <value name="NAME"><block type="text"><field name="TEXT">RoboLab-BT</field></block></value>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <value name="IF0"><block type="esp32_bluetooth_available"/></value>
        <statement name="DO0">
          <block type="arduino_servo_write">
            <field name="PIN">18</field>
            <value name="ANGLE"><block type="math_number"><field name="NUM">90</field></block></value>
            <next><block type="arduino_delay"><field name="MS">50</field></block></next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 18: Micro:bit Spirit Level — accelerometer X/Y
const spiritLevelXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="basic_forever" x="40" y="40">
    <statement name="STACK">
      <block type="controls_if">
        <mutation elseif="1" else="1"/>
        <value name="IF0">
          <block type="input_button_is_pressed"><field name="BUTTON">A</field></block>
        </value>
        <statement name="DO0">
          <block type="basic_show_icon"><field name="ICON">ARROW_W</field></block>
        </statement>
        <value name="IF1">
          <block type="input_button_is_pressed"><field name="BUTTON">B</field></block>
        </value>
        <statement name="DO1">
          <block type="basic_show_icon"><field name="ICON">ARROW_E</field></block>
        </statement>
        <statement name="ELSE">
          <block type="basic_show_icon"><field name="ICON">YES</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 19: Arduino Morse Code Keyer — button+tone
const morseCodeXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">EQ</field>
            <value name="A"><block type="pin_digital_read"><field name="PIN">2</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="arduino_tone">
            <field name="PIN">8</field>
            <value name="FREQ"><block type="math_number"><field name="NUM">880</field></block></value>
            <value name="DURATION"><block type="math_number"><field name="NUM">100</field></block></value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="arduino_notone"><field name="PIN">8</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`;

// Project 20: ESP32 Smart Fan Controller — pot+servo
const smartFanXml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="arduino_serial_print">
        <value name="TEXT"><block type="text"><field name="TEXT">Smart Fan Ready</field></block></value>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="170">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">18</field>
        <value name="ANGLE">
          <block type="arduino_map">
            <value name="VAL"><block type="pin_analog_read"><field name="PIN">26</field></block></value>
            <value name="FL"><block type="math_number"><field name="NUM">0</field></block></value>
            <value name="FH"><block type="math_number"><field name="NUM">4095</field></block></value>
            <value name="TL"><block type="math_number"><field name="NUM">0</field></block></value>
            <value name="TH"><block type="math_number"><field name="NUM">180</field></block></value>
          </block>
        </value>
        <next>
          <block type="arduino_serial_print">
            <value name="TEXT"><block type="pin_analog_read"><field name="PIN">26</field></block></value>
            <next><block type="arduino_delay"><field name="MS">200</field></block></next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`;


const BASE_PROJECTS_LIST = [
  {
    name: "LED Dimmer & Switch",
    board: "Arduino Uno",
    description: "Gunakan potensiometer, tombol tekan, dan LED untuk membuat kontrol kecerahan lampu interaktif.",
    iconColor: "blue",
    components: ['led', 'pot', 'button'],
    xml: ledDimmerXml,
    ino: `// Proyek: LED Dimmer & Switch
void setup() {
  pinMode(9, OUTPUT);
  pinMode(2, INPUT);
  Serial.begin(9600);
  digitalWrite(9, LOW);
}

void loop() {
  if (digitalRead(2) == 0) {
    analogWrite(9, (analogRead(A0) / 4));
  } else {
    analogWrite(9, 0);
  }
}`,
    py: `# Proyek: LED Dimmer & Switch
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        if robot.digital_read(2) == 0:
            robot.analog_write(9, int(robot.analog_read(0) / 4))
        else:
            robot.analog_write(9, 0)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Obstacle Avoidance Scanner",
    board: "Arduino Uno",
    description: "Buat pemindai jarak otonom menggunakan sensor ultrasonik HC-SR04 dan motor servo.",
    iconColor: "emerald",
    components: ['ultrasonic', 'servo'],
    xml: obstacleScannerXml,
    ino: `// Proyek: Sensor Jarak & Servo Scanner
#include <Servo.h>
Servo myServo;

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;
}

void servoWrite(int pin, int angle) {
  myServo.write(angle);
}

void setup() {
  pinMode(12, OUTPUT);
  pinMode(13, INPUT);
  myServo.attach(3);
  Serial.begin(9600);
  digitalWrite(12, LOW);
}

void loop() {
  servoWrite(3, 90);
  delay(300);
  Serial.println(readUltrasonic(12, 13));
}`,
    py: `# Proyek: Sensor Jarak & Servo Scanner
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        robot.servo_write(3, 90)
        time.sleep(0.3)
        print(robot.read_ultrasonic(12, 13))

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Smart Light & Compass",
    board: "BBC micro:bit",
    description: "Manfaatkan sensor cahaya internal dan sensor arah kompas internal pada BBC micro:bit.",
    iconColor: "amber",
    components: [],
    xml: smartLightXml,
    ino: `// Proyek: Micro:bit Smart Light & Compass
#include <Microbit.h>

void setup() {
  Microbit.begin();
  Microbit.scroll("ROBOLAB");
}

void loop() {
  int light = Microbit.readLightLevel();
  int temp = Microbit.readTemperature();
  int heading = Microbit.readCompassHeading();
  
  Serial.print("Cahaya: ");
  Serial.print(light);
  Serial.print(", Suhu: ");
  Serial.print(temp);
  Serial.print(", Kompas: ");
  Serial.println(heading);
  
  if (light < 50) {
    Microbit.showIcon("SMILE");
  } else {
    Microbit.showNumber(light);
  }
  delay(500);
}`,
    py: `# Proyek: Micro:bit Smart Light & Compass
import microbit
import time

# saat mulai
microbit.display.scroll("ROBOLAB")

# selamanya
while True:
    light = microbit.display.read_light_level()
    temp = microbit.temperature()
    heading = microbit.compass.heading()
    
    print(f"Cahaya: {light}, Suhu: {temp}C, Kompas: {heading}")
    
    if light < 50:
        # Tampilkan pola ikon senyum di ruangan gelap
        microbit.display.show(microbit.Image.SMILE)
    else:
        # Tampilkan tingkat cahaya dalam angka
        microbit.display.show(light)
        
    time.sleep(0.5)`
  },
  {
    name: "ESP32 Soccer AI Bot",
    board: "ESP32 DevKit V1",
    description: "Implementasikan model AI Vision mendeteksi bola sepak secara otonom menggunakan ESP32.",
    iconColor: "blue",
    components: ['led'],
    xml: esp32SoccerXml,
    ino: `// Proyek: ESP32 Soccer AI Bot
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  digitalWrite(2, LOW);
}

void loop() {
  if (Serial.available()) {
    digitalWrite(2, HIGH);
    delay(500);
  }
}`,
    py: `# Proyek: ESP32 Soccer AI Bot
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    while True:
        if robot.serial_available():
            robot.digital_write(2, 1)
            time.sleep(0.5)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Arduino Uno Radar Scanner",
    board: "Arduino Uno",
    description: "Peta rintangan sekitar robot dalam bentuk sapuan radar grafis menggunakan Arduino Uno.",
    iconColor: "emerald",
    components: ['ultrasonic', 'servo'],
    xml: radarScannerXml,
    ino: `// Proyek: Sensor Jarak & Servo Scanner
#include <Servo.h>
Servo myServo;

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;
}

void servoWrite(int pin, int angle) {
  myServo.write(angle);
}

void setup() {
  pinMode(12, OUTPUT);
  pinMode(13, INPUT);
  myServo.attach(3);
  Serial.begin(9600);
  digitalWrite(12, LOW);
}

void loop() {
  servoWrite(3, 0);
  delay(300);
  Serial.println(readUltrasonic(12, 13));
}`,
    py: `# Proyek: Sensor Jarak & Servo Scanner
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        robot.servo_write(3, 0)
        time.sleep(0.3)
        print(robot.read_ultrasonic(12, 13))

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Micro:bit Gesture Controller",
    board: "BBC micro:bit",
    description: "Kirim perintah pergerakan robot menggunakan akselerometer internal micro:bit.",
    iconColor: "amber",
    components: [],
    xml: gestureControllerXml,
    ino: `// Proyek: Micro:bit Gesture Controller
#include <Microbit.h>

void setup() {
  Microbit.begin();
  Serial.begin(9650);
}

void loop() {
  int x = Microbit.readAccelerometer('X');
  int y = Microbit.readAccelerometer('Y');
  
  if (y < -300) {
    Serial.println("Gerakan: FORWARD");
    Microbit.showIcon("ARROW_N");
  } else if (y > 300) {
    Serial.println("Gerakan: BACKWARD");
    Microbit.showIcon("ARROW_S");
  } else {
    Microbit.showIcon("HAPPY");
  }
  delay(100);
}`,
    py: `# Proyek: Micro:bit Gesture Controller
import microbit
import time

while True:
    x = microbit.accelerometer.get_x()
    y = microbit.accelerometer.get_y()
    
    if y < -300:
        print("Gerakan: FORWARD")
        microbit.display.show(microbit.Image.YES)
    elif y > 300:
        print("Gerakan: BACKWARD")
        microbit.display.show(microbit.Image.NO)
    else:
        microbit.display.show(microbit.Image.HAPPY)
    time.sleep(0.1)`
  },
  {
    name: "Automated Plant Watering",
    board: "Arduino Uno",
    description: "Sistem penyiraman tanaman otomatis menggunakan Potensiometer (kelembaban) dan Servo (katup).",
    iconColor: "purple",
    components: ['pot', 'servo', 'led'],
    xml: plantWateringXml,
    ino: `// Proyek: Automated Plant Watering
#include <Servo.h>
Servo valveServo;

void servoWrite(int pin, int angle) {
  valveServo.write(angle);
}

void setup() {
  pinMode(9, OUTPUT);
  valveServo.attach(3);
  Serial.begin(9600);
  digitalWrite(9, LOW);
}

void loop() {
  if (analogRead(A0) < 300) {
    digitalWrite(9, HIGH);
    servoWrite(3, 90);
  } else {
    digitalWrite(9, LOW);
    servoWrite(3, 0);
  }
}`,
    py: `# Proyek: Automated Plant Watering
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        if robot.analog_read(0) < 300:
            robot.digital_write(9, 1)
            robot.servo_write(3, 90)
        else:
            robot.digital_write(9, 0)
            robot.servo_write(3, 0)
        time.sleep(0.1)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 Smart Thermostat",
    board: "ESP32 DevKit V1",
    description: "Kontrol suhu ruangan dengan potensiometer (dial) dan alarm pendingin LED.",
    iconColor: "blue",
    components: ['pot', 'led'],
    xml: smartThermostatXml,
    ino: `// Proyek: ESP32 Smart Thermostat
void setup() {
  pinMode(2, OUTPUT);
  Serial.begin(115200);
  digitalWrite(2, LOW);
}

void loop() {
  Serial.println(analogRead(26));
  if (analogRead(26) < 900) {
    digitalWrite(2, HIGH);
  } else {
    digitalWrite(2, LOW);
  }
}`,
    py: `# Proyek: ESP32 Smart Thermostat
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    while True:
        val = robot.analog_read(26)
        print(val)
        if val < 900:
            robot.digital_write(2, 1)
        else:
            robot.digital_write(2, 0)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Micro:bit Traffic Light",
    board: "BBC micro:bit",
    description: "Sistem lampu lalu lintas interaktif dengan tombol penyeberang pejalan kaki.",
    iconColor: "amber",
    components: ['button', 'led'],
    xml: trafficLightXml,
    ino: `// Proyek: Micro:bit Traffic Light
#include <Microbit.h>

const int ledPin = 2;  // Hijau penyeberang
const int btnPin = 1;  // Tombol penyeberang

void setup() {
  Microbit.begin();
  pinMode(ledPin, OUTPUT);
  pinMode(btnPin, INPUT);
}

void loop() {
  int btnPressed = digitalRead(btnPin);
  
  if (btnPressed == HIGH) {
    // Mobil stop, pejalan kaki jalan
    Microbit.showIcon("YES");
    digitalWrite(ledPin, HIGH);
    delay(3000);
  } else {
    Microbit.showIcon("NO");
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`,
    py: `# Proyek: Micro:bit Traffic Light
import microbit
import time

while True:
    btnPressed = microbit.pin1.read_digital()
    if btnPressed == 1:
        # Tampilkan lampu pejalan kaki aman melintas
        microbit.display.show(microbit.Image.YES)
        microbit.pin2.write_digital(1) # Nyalakan lampu hijau
        time.sleep(3)
    else:
        microbit.display.show(microbit.Image.NO)
        microbit.pin2.write_digital(0)
    time.sleep(0.1)`
  },
  {
    name: "Arduino Pedestrian Crossing",
    board: "Arduino Uno",
    description: "Lampu lalu lintas penyeberangan jalan dengan tombol tekan dan bel peringatan tone.",
    iconColor: "emerald",
    components: ['button', 'led'],
    xml: pedestrianCrossingXml,
    ino: `// Proyek: Pedestrian Crossing
void setup() {
  pinMode(9, OUTPUT);
  pinMode(2, INPUT);
  Serial.begin(9600);
  digitalWrite(9, LOW);
}

void loop() {
  if (digitalRead(2) == 0) {
    digitalWrite(9, HIGH);
    tone(8, 440, 100);
    delay(2000);
  } else {
    digitalWrite(9, LOW);
    noTone(8);
  }
}`,
    py: `# Proyek: Pedestrian Crossing
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        if robot.digital_read(2) == 0:
            robot.digital_write(9, 1)
            time.sleep(2)
        else:
            robot.digital_write(9, 0)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 Weather Station",
    board: "ESP32 DevKit V1",
    description: "Stasiun cuaca WiFi mandiri menggunakan LCD untuk menampilkan data sensor suhu.",
    iconColor: "purple",
    components: ['lcd'],
    xml: weatherStationXml,
    ino: `// Proyek: ESP32 Weather Station
void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Weather Station Ready");
}

void loop() {
  Serial.println("Temp: 28.5 C");
  delay(1000);
}`,
    py: `# Proyek: ESP32 Weather Station
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    while True:
        print("Temp: 28.5 C")
        time.sleep(1.0)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Micro:bit Step Counter",
    board: "BBC micro:bit",
    description: "Alat pengukur langkah kaki (pedometer) menggunakan sensor akselerometer bawaan.",
    iconColor: "amber",
    components: [],
    xml: stepCounterXml,
    ino: `// Proyek: Pedometer Pengukur Langkah
#include <Microbit.h>

int stepCount = 0;

void setup() {
  Microbit.begin();
  Microbit.showNumber(stepCount);
}

void loop() {
  if (Microbit.wasGesture("shake")) {
    stepCount++;
    Microbit.showNumber(stepCount);
    delay(200);
  }
}`,
    py: `# Proyek: Pedometer Pengukur Langkah
import microbit
import time

steps = 0
microbit.display.show(steps)

while True:
    if microbit.accelerometer.was_gesture("shake"):
        steps += 1
        print(f"Langkah: {steps}")
        microbit.display.show(steps)
        time.sleep(0.2)
    time.sleep(0.02)`
  },
  {
    name: "Arduino Combination Safe",
    board: "Arduino Uno",
    description: "Kunci brankas digital menggunakan potensiometer sebagai dial sandi dan tombol untuk membuka.",
    iconColor: "blue",
    components: ['pot', 'button', 'led'],
    xml: combinationSafeXml,
    ino: `// Proyek: Combination Safe
void setup() {
  pinMode(2, INPUT);
  pinMode(9, OUTPUT);
  Serial.begin(9600);
  digitalWrite(9, LOW);
}

void loop() {
  if (digitalRead(2) == 0) {
    if (analogRead(A0) > 700) {
      digitalWrite(9, HIGH);
      delay(2000);
    } else {
      Serial.println("Sandi Salah!");
    }
  } else {
    digitalWrite(9, LOW);
  }
}`,
    py: `# Proyek: Combination Safe
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        if robot.digital_read(2) == 0:
            if robot.analog_read(0) > 700:
                print("Brankas Terbuka")
                robot.digital_write(9, 1)
                time.sleep(2)
            else:
                print("Sandi Salah!")
        else:
            robot.digital_write(9, 0)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 Intruder Alarm",
    board: "ESP32 DevKit V1",
    description: "Sistem keamanan rumah dengan deteksi jarak ultrasonik dan sirene alarm.",
    iconColor: "emerald",
    components: ['ultrasonic', 'led'],
    xml: intruderAlarmXml,
    ino: `// Proyek: ESP32 Intruder Alarm
const int trig = 12;
const int echo = 13;
const int led = 2;

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH);
  return duration * 0.034 / 2;
}

void setup() {
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  pinMode(led, OUTPUT);
  Serial.begin(115200);
  digitalWrite(led, LOW);
}

void loop() {
  if (readUltrasonic(12, 13) < 30) {
    digitalWrite(led, HIGH);
    Serial.println("ALARM! Penyusup terdeteksi!");
  } else {
    digitalWrite(led, LOW);
  }
}`,
    py: `# Proyek: ESP32 Intruder Alarm
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    while True:
        if robot.read_ultrasonic(12, 13) < 30:
            print("ALARM! Penyusup terdeteksi!")
            robot.digital_write(2, 1)
        else:
            robot.digital_write(2, 0)
        time.sleep(0.05)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Micro:bit Night Light",
    board: "BBC micro:bit",
    description: "Lampu tidur otomatis yang menyala menggunakan sensor cahaya internal.",
    iconColor: "amber",
    components: ['led'],
    xml: nightLightXml,
    ino: `// Proyek: Lampu Tidur Otomatis
#include <Microbit.h>

const int ledPin = 2; // Lampu tidur luar

void setup() {
  Microbit.begin();
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int light = Microbit.readLightLevel();
  if (light < 30) {
    digitalWrite(ledPin, HIGH); // Ruangan gelap, nyalakan lampu
    Microbit.showIcon("CONFUSED");
  } else {
    digitalWrite(ledPin, LOW);
    Microbit.showIcon("HAPPY");
  }
  delay(200);
}`,
    py: `# Proyek: Lampu Tidur Otomatis
import microbit
import time

while True:
    level = microbit.display.read_light_level()
    if level < 30:
        microbit.pin2.write_digital(1) # Nyalakan lampu
        microbit.display.show(microbit.Image.SAD)
    else:
        microbit.pin2.write_digital(0)
        microbit.display.show(microbit.Image.SMILE)
    time.sleep(0.2)`
  },
  {
    name: "Arduino Ultrasonic Ruler",
    board: "Arduino Uno",
    description: "Penggaris pengukur jarak digital presisi tinggi dengan visualisasi di layar LCD.",
    iconColor: "purple",
    components: ['ultrasonic', 'lcd'],
    xml: ultrasonicRulerXml,
    ino: `// Proyek: Ultrasonic Ruler
const int trigPin = 12;
const int echoPin = 13;

void setup() {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distanceCm = duration * 0.034 / 2;
  
  Serial.print("Ukuran Penggaris: ");
  Serial.print(distanceCm);
  Serial.println(" cm");
  delay(500);
}`,
    py: `# Proyek: Ultrasonic Ruler
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    trig = 12
    echo = 13
    while True:
        dist = robot.read_ultrasonic(trig, echo)
        print(f"Jarak: {dist} cm")
        time.sleep(0.5)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 Bluetooth Controller",
    board: "ESP32 DevKit V1",
    description: "Kendalikan sudut motor servo secara nirkabel melalui komunikasi Bluetooth Serial.",
    iconColor: "blue",
    components: ['servo'],
    xml: bluetoothControllerXml,
    ino: `// Proyek: ESP32 Bluetooth Servo Controller
const int servoPin = 18;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Bluetooth Servo Ready");
}

void loop() {
  if (Serial.available()) {
    int angle = Serial.parseInt();
    if (angle >= 0 && angle <= 180) {
      Serial.print("Memutar Servo ke: ");
      Serial.println(angle);
    }
  }
  delay(50);
}`,
    py: `# Proyek: ESP32 Bluetooth Servo Controller
import time
import robolab as robot

def main():
    robot.connect("COM4")
    servo = 18
    while True:
        print("Menerima Bluetooth input...")
        robot.servo_write(servo, 90)
        time.sleep(1.0)

if __name__ == '__main__':
    main()`
  },
  {
    name: "Micro:bit Spirit Level",
    board: "BBC micro:bit",
    description: "Waterpass digital penunjuk kemiringan permukaan menggunakan akselerometer X/Y.",
    iconColor: "amber",
    components: [],
    xml: spiritLevelXml,
    ino: `// Proyek: Waterpass Spirit Level
#include <Microbit.h>

void setup() {
  Microbit.begin();
}

void loop() {
  int x = Microbit.readAccelerometer('X');
  if (x < -200) {
    Microbit.showIcon("ARROW_W");
  } else if (x > 200) {
    Microbit.showIcon("ARROW_E");
  } else {
    Microbit.showIcon("YES");
  }
  delay(150);
}`,
    py: `# Proyek: Waterpass Spirit Level
import microbit
import time

while True:
    x = microbit.accelerometer.get_x()
    if x < -200:
        microbit.display.show(microbit.Image.ARROW_W)
    elif x > 200:
        microbit.display.show(microbit.Image.ARROW_E)
    else:
        microbit.display.show(microbit.Image.YES)
    time.sleep(0.15)`
  },
  {
    name: "Arduino Morse Code Keyer",
    board: "Arduino Uno",
    description: "Kirim pesan sandi Morse menggunakan ketukan tombol tekan dan bunyi buzzer.",
    iconColor: "emerald",
    components: ['button'],
    xml: morseCodeXml,
    ino: `// Proyek: Morse Code Generator
const int pinBtn = 2;

void setup() {
  pinMode(pinBtn, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int btn = digitalRead(pinBtn);
  if (btn == LOW) {
    tone(8, 880); // Bunyikan nada morse 880Hz
    Serial.print(".");
  } else {
    noTone(8);
  }
  delay(100);
}`,
    py: `# Proyek: Morse Code Generator
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    btn = 2
    while True:
        state = robot.digital_read(btn)
        if state == 0:
            print("morse: .")
        time.sleep(0.1)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 Smart Fan Controller",
    board: "ESP32 DevKit V1",
    description: "Kipas otomatis pintar pengatur kecepatan hembusan berdasarkan dial potensiometer.",
    iconColor: "purple",
    components: ['pot', 'servo'],
    xml: smartFanXml,
    ino: `// Proyek: Smart Fan Controller
const int potPin = 26;
const int servoPin = 18;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int val = analogRead(potPin);
  int servoAngle = map(val, 0, 4095, 0, 180);
  
  Serial.print("Kecepatan Kipas (Sudut): ");
  Serial.println(servoAngle);
  delay(200);
}`,
    py: `# Proyek: Smart Fan Controller
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    pot = 26
    servo = 18
    while True:
        val = robot.analog_read(pot)
        angle = int(val * 180 / 1023)
        robot.servo_write(servo, angle)
        print(f"Kemiringan Kipas: {angle}")
        time.sleep(0.2)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP32 HTTP & WebSocket Client",
    board: "ESP32 DevKit V1",
    description: "Kirim request HTTP GET/POST dan pantau komunikasi realtime dari server via WebSocket menggunakan library WiFi.",
    iconColor: "blue",
    components: ['led'],
    xml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="10" y="10"><statement name="STACK"><block type="esp32_wifi_connect"><value name="SSID"><shadow type="text"><field name="TEXT">MyWiFi</field></shadow></value><value name="PASS"><shadow type="text"><field name="TEXT">password123</field></shadow></value><next><block type="esp32_websocket_connect"><value name="HOST"><shadow type="text"><field name="TEXT">echo.websocket.events</field></shadow></value><value name="PORT"><shadow type="math_number"><field name="NUM">80</field></shadow></value><value name="PATH"><shadow type="text"><field name="TEXT">/</field></shadow></value></block></next></block></statement></block><block type="arduino_loop" x="10" y="200"><statement name="STACK"><block type="esp32_websocket_loop"><next><block type="controls_if"><value name="IF0"><block type="esp32_websocket_has_message"></block></value><statement name="DO0"><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_websocket_get_message"></block></value></block></statement><next><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_http_get"><value name="URL"><shadow type="text"><field name="TEXT">http://httpbin.org/get</field></shadow></value></block></value><next><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_http_post"><value name="URL"><shadow type="text"><field name="TEXT">http://httpbin.org/post</field></shadow></value><value name="CONTENT_TYPE"><shadow type="text"><field name="TEXT">application/json</field></shadow></value><value name="DATA"><shadow type="text"><field name="TEXT">{\"suhu\": 30}</field></shadow></value></block></value><next><block type="arduino_delay"><field name="MS">5000</field></block></next></block></next></block></next></block></next></block></statement></block></xml>',
    ino: `// Proyek: ESP32 HTTP & WebSocket Client
#if defined(ESP8266)
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#else
#include <WiFi.h>
#include <HTTPClient.h>
#endif
#include <WebSocketsClient.h>

WebSocketsClient webSocket;
String _ws_last_message = "";
bool _ws_has_message = false;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    _ws_last_message = String((char*)payload);
    _ws_has_message = true;
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin("MyWiFi", "password123");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected!");
  webSocket.begin("echo.websocket.events", 80, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();
  if (_ws_has_message) {
    Serial.println(([]() -> String { _ws_has_message = false; return _ws_last_message; })());
  }
  Serial.println(([]() -> String { HTTPClient http; http.begin("http://httpbin.org/get"); int httpCode = http.GET(); String payload = (httpCode > 0) ? http.getString() : ""; http.end(); return payload; })());
  Serial.println(([]() -> String { HTTPClient http; http.begin("http://httpbin.org/post"); http.addHeader("Content-Type", "application/json"); int httpCode = http.POST("{\\"suhu\\": 30}"); String payload = (httpCode > 0) ? http.getString() : ""; http.end(); return payload; })());
  delay(5000);
}`,
    py: `# Proyek: ESP32 HTTP & WebSocket Client
import time
import robolab as robot

def loop():
    robot.connect("COM4")
    robot.wifi_connect("MyWiFi", "password123")
    robot.websocket_connect("echo.websocket.events", 80, "/")
    while True:
        robot.websocket_loop()
        if robot.websocket_has_message():
            print(robot.websocket_get_message())
        print(robot.http_get("http://httpbin.org/get"))
        print(robot.http_post("http://httpbin.org/post", "application/json", '{"suhu": 30}'))
        time.sleep(5)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP8266 HTTP Relay Control",
    board: "ESP8266 NodeMCU",
    description: "Kontrol Relay / Pin Output via HTTP GET request dari server API secara optimal.",
    iconColor: "cyan",
    components: ['led'],
    xml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="40" y="40"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">HIGH</field><next><block type="esp32_wifi_connect"><value name="SSID"><shadow type="text"><field name="TEXT">i</field></shadow></value><value name="PASS"><shadow type="text"><field name="TEXT">12345678</field></shadow></value></block></next></block></next></block></statement></block><block type="arduino_loop" x="40" y="200"><statement name="STACK"><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_http_get"><value name="URL"><shadow type="text"><field name="TEXT">http://pymasterclass.codestechno.com/api1.php</field></shadow></value></block></value><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="esp32_http_get"><value name="URL"><shadow type="text"><field name="TEXT">http://pymasterclass.codestechno.com/api1.php</field></shadow></value></block></value><value name="B"><shadow type="text"><field name="TEXT">0</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">HIGH</field></block></next></block></statement><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="esp32_http_get"><value name="URL"><shadow type="text"><field name="TEXT">http://pymasterclass.codestechno.com/api1.php</field></shadow></value></block></value><value name="B"><shadow type="text"><field name="TEXT">1</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">LOW</field></block></next></block></statement><next><block type="arduino_delay"><field name="MS">2000</field></block></next></block></next></block></next></block></statement></block></xml>',
    ino: `// Proyek: ESP8266 HTTP Relay Control
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

void setup() {
  Serial.begin(115200);
  pinMode(4, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(2, OUTPUT);
  pinMode(0, OUTPUT);

  digitalWrite(4, HIGH);
  digitalWrite(5, HIGH);

  WiFi.begin("i", "12345678");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected!");
}

void loop() {
  WiFiClient client;
  HTTPClient http;
  if (http.begin(client, "http://pymasterclass.codestechno.com/api1.php")) {
    int httpCode = http.GET();
    if (httpCode > 0) {
      String payload = http.getString();
      Serial.println(payload);
      if (payload == "0") {
        digitalWrite(2, HIGH);
        digitalWrite(0, HIGH);
      } else if (payload == "1") {
        digitalWrite(2, LOW);
        digitalWrite(0, LOW);
      }
    }
    http.end();
  }
  delay(2000);
}`,
    py: `# Proyek: ESP8266 HTTP Relay Control
import time
import robolab as robot

def loop():
    robot.wifi_connect("i", "12345678")
    while True:
        res = robot.http_get("http://pymasterclass.codestechno.com/api1.php")
        print(res)
        if res == "0":
            robot.digital_write(2, 1)
            robot.digital_write(0, 1)
        elif res == "1":
            robot.digital_write(2, 0)
            robot.digital_write(0, 0)
        time.sleep(2)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "ESP8266 Blynk IoT Relay Control",
    board: "ESP8266 NodeMCU",
    description: "Kontrol Relay / Pin Output secara realtime menggunakan Blynk IoT Cloud (Virtual Pin V0 - V3).",
    iconColor: "green",
    components: ['led'],
    xml: '<xml xmlns="https://developers.google.com/blockly/xml"><block type="blynk_config" x="40" y="40"><value name="TEMPLATE_ID"><shadow type="text"><field name="TEXT">TMPL69YI5UWvB</field></shadow></value><value name="TEMPLATE_NAME"><shadow type="text"><field name="TEXT">ESP8266 Relay</field></shadow></value><value name="AUTH_TOKEN"><shadow type="text"><field name="TEXT">p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT</field></shadow></value></block><block type="blynk_on_write" x="40" y="160"><field name="VPIN">V0</field><statement name="STACK"><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">HIGH</field></block></next></block></next></block></statement><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">LOW</field></block></next></block></statement></block></next></block></statement></block><block type="blynk_on_write" x="40" y="480"><field name="VPIN">V1</field><statement name="STACK"><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">HIGH</field></block></next></block></next></block></statement><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">LOW</field></block></next></block></statement></block></next></block></statement></block><block type="blynk_on_write" x="40" y="800"><field name="VPIN">V2</field><statement name="STACK"><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">HIGH</field></block></next></block></next></block></statement><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">LOW</field></block></next></block></statement></block></next></block></statement></block><block type="blynk_on_write" x="40" y="1120"><field name="VPIN">V3</field><statement name="STACK"><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">0</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">2</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">0</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">HIGH</field><next><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">HIGH</field></block></next></block></next></block></statement><next><block type="controls_if"><value name="IF0"><block type="robolab_logic_compare"><field name="OP">EQ</field><value name="A"><block type="blynk_param_as_int"></block></value><value name="B"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block></value><statement name="DO0"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">LOW</field></block></next></block></statement></block></next></block></statement></block><block type="arduino_setup" x="40" y="1440"><statement name="STACK"><block type="pin_digital_write"><field name="PIN">4</field><field name="STATE">LOW</field><next><block type="pin_digital_write"><field name="PIN">5</field><field name="STATE">LOW</field><next><block type="blynk_begin"><value name="AUTH"><shadow type="text"><field name="TEXT">p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT</field></shadow></value><value name="SSID"><shadow type="text"><field name="TEXT">i</field></shadow></value><value name="PASS"><shadow type="text"><field name="TEXT">12345678</field></shadow></value></block></next></block></next></block></statement></block><block type="arduino_loop" x="40" y="1620"><statement name="STACK"><block type="blynk_run"></block></statement></block></xml>',
    ino: `// RoboLab Studio - Generated Arduino Code
// Blocks in workspace: blynk_on_write, arduino_setup, arduino_loop, blynk_on_write, blynk_on_write, blynk_on_write, controls_if, pin_digital_write, blynk_run, controls_if, controls_if, controls_if, robolab_logic_compare, pin_digital_write, controls_if, pin_digital_write, pin_digital_write, controls_if, robolab_logic_compare, robolab_logic_compare, pin_digital_write, controls_if, robolab_logic_compare, pin_digital_write, controls_if, blynk_param_as_int, math_number, pin_digital_write, robolab_logic_compare, pin_digital_write, blynk_begin, pin_digital_write, robolab_logic_compare, pin_digital_write, blynk_param_as_int, math_number, blynk_param_as_int, math_number, pin_digital_write, robolab_logic_compare, pin_digital_write, blynk_param_as_int, math_number, pin_digital_write, robolab_logic_compare, pin_digital_write, pin_digital_write, blynk_param_as_int, math_number, pin_digital_write, text, text, text, blynk_config, pin_digital_write, blynk_param_as_int, math_number, pin_digital_write, pin_digital_write, blynk_param_as_int, math_number, pin_digital_write, pin_digital_write, blynk_param_as_int, math_number, pin_digital_write, pin_digital_write, text, text, text, pin_digital_write, pin_digital_write, pin_digital_write
#define BLYNK_TEMPLATE_ID "TMPL69YI5UWvB"
#define BLYNK_TEMPLATE_NAME "ESP8266 Relay"
#define BLYNK_AUTH_TOKEN "p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT"

#define BLYNK_PRINT Serial
#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>

// Blynk Callback Functions
BLYNK_WRITE(V0) {
  int param_val = param.asInt();
  if ((param.asInt() == 0)) {
    digitalWrite(2, HIGH);
    digitalWrite(0, HIGH);
    digitalWrite(4, HIGH);
    digitalWrite(5, HIGH);
  }
  if ((param.asInt() == 1)) {
    digitalWrite(4, LOW);
    digitalWrite(5, LOW);
  }
}

BLYNK_WRITE(V1) {
  int param_val = param.asInt();
  if ((param.asInt() == 0)) {
    digitalWrite(2, LOW);
    digitalWrite(0, LOW);
    digitalWrite(5, HIGH);
    digitalWrite(4, HIGH);
  }
  if ((param.asInt() == 1)) {
    digitalWrite(4, LOW);
    digitalWrite(5, LOW);
  }
}

BLYNK_WRITE(V2) {
  int param_val = param.asInt();
  if ((param.asInt() == 0)) {
    digitalWrite(2, HIGH);
    digitalWrite(0, LOW);
    digitalWrite(5, HIGH);
    digitalWrite(4, HIGH);
  }
  if ((param.asInt() == 1)) {
    digitalWrite(4, LOW);
    digitalWrite(5, LOW);
  }
}

BLYNK_WRITE(V3) {
  int param_val = param.asInt();
  if ((param.asInt() == 0)) {
    digitalWrite(2, LOW);
    digitalWrite(0, HIGH);
    digitalWrite(5, HIGH);
    digitalWrite(4, HIGH);
  }
  if ((param.asInt() == 1)) {
    digitalWrite(4, LOW);
    digitalWrite(5, LOW);
  }
}

void setup() {
  Serial.begin(115200);
  // Configure I/O pins
  pinMode(4, OUTPUT);
  pinMode(2, OUTPUT);
  pinMode(5, OUTPUT);
  pinMode(0, OUTPUT);

  digitalWrite(4, LOW);
  digitalWrite(5, LOW);
  Blynk.begin("p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT", "i", "12345678");
}

void loop() {
  Blynk.run();
}`,
    py: `# Proyek: ESP8266 Blynk IoT Relay Control
import time
import robolab as robot

def loop():
    robot.blynk_begin("p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT", "i", "12345678")
    while True:
        robot.blynk_run()
        time.sleep(0.1)

if __name__ == '__main__':
    loop()`
  }
];

const PROJECTS_LIST = [...BASE_PROJECTS_LIST, ...LIBRARY_PROJECT_TEMPLATES];

interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

function App({ authUser, onSignOut }: { authUser?: AuthUser; onSignOut?: () => void }) {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'home' | 'ide' | 'packages' | 'learning' | 'settings' | 'simulator'>('ide');
  const [projectName, setProjectName] = useState<string | null>(() => {
    return localStorage.getItem('robolab_project_name') || null;
  });
  const [showExplorer, setShowExplorer] = useState<boolean>(() => {
    const saved = localStorage.getItem('robolab_show_explorer');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (projectName) {
      localStorage.setItem('robolab_project_name', projectName);
    } else {
      localStorage.removeItem('robolab_project_name');
    }
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem('robolab_show_explorer', JSON.stringify(showExplorer));
  }, [showExplorer]);

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [customLibProjects, setCustomLibProjects] = useState<any[]>([]);
  const allProjectsList = useMemo(() => [...PROJECTS_LIST, ...customLibProjects], [customLibProjects]);
  const [showLoading, setShowLoading] = useState(true);

  // Theme & Modal States
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [appVersion, setAppVersion] = useState('0.8.0');

  // ── Trial System ──────────────────────────────────────────────────────────
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isExpired: false,
    daysUsed: 0,
    daysLeft: 30,
    firstOpenDate: null,
  });
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<'AI' | 'Simulator' | 'Upload'>('AI');
  const [updateStatus, setUpdateStatus] = useState<
    | { status: 'idle' }
    | { status: 'checking' }
    | { status: 'available'; version: string; releaseDate?: string }
    | { status: 'not-available'; version?: string }
    | { status: 'downloading'; percent: number; bytesPerSecond: number; transferred: number; total: number }
    | { status: 'downloaded'; version: string }
    | { status: 'github-fallback'; latestVersion: string; currentVersion: string; hasUpdate: boolean; releaseUrl?: string }
    | { status: 'error'; message: string }
    | { status: 'dev-mode'; message: string }
  >({ status: 'idle' });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBoardManagerModal, setShowBoardManagerModal] = useState(false);
  const [showLibraryManagerModal, setShowLibraryManagerModal] = useState(false);
  const [showExtensionsModal, setShowExtensionsModal] = useState(false);
  const [libSearchQuery, setLibSearchQuery] = useState('');
  const [installingLib, setInstallingLib] = useState<string | null>(null);
  const [liveSearchResults, setLiveSearchResults] = useState<Array<{ name: string; author: string; desc: string; cat: string; version: string }>>([]);
  const [isSearchingLibs, setIsSearchingLibs] = useState(false);
  const [customGithubUrl, setCustomGithubUrl] = useState('');

  useEffect(() => {
    if (!libSearchQuery || libSearchQuery.trim().length < 2) {
      setLiveSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const req = (window as any).__electronRequire || (window as any).require;
      if (req) {
        setIsSearchingLibs(true);
        req('electron').ipcRenderer.invoke('search-arduino-lib', libSearchQuery).then((results: any[]) => {
          if (Array.isArray(results)) setLiveSearchResults(results);
          setIsSearchingLibs(false);
        }).catch(() => setIsSearchingLibs(false));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [libSearchQuery]);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [helpTab, setHelpTab] = useState<'quickstart' | 'shortcuts' | 'about'>('quickstart');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('robolab_theme_mode') as 'dark' | 'light') || 'light';
  });
  const [themeColor, setThemeColor] = useState<'cyan' | 'sky' | 'emerald' | 'pink'>(() => {
    return (localStorage.getItem('robolab_theme_color') as 'cyan' | 'sky' | 'emerald' | 'pink') || 'cyan';
  });
  const [language, setLanguage] = useState<LangCode>(() => {
    return (localStorage.getItem('robolab_language') as LangCode) || 'id';
  });
  const handleLanguageChange = (lang: LangCode) => {
    setLanguage(lang);
    localStorage.setItem('robolab_language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.body.classList.remove('theme-dark', 'theme-light', 'color-cyan', 'color-sky', 'color-emerald', 'color-pink');
    document.body.classList.add(`theme-${themeMode}`);
    document.body.classList.add(`color-${themeColor}`);
    
    localStorage.setItem('robolab_theme_mode', themeMode);
    localStorage.setItem('robolab_theme_color', themeColor);
  }, [themeMode, themeColor]);

  // ── Trial Status Init ─────────────────────────────────────────────────────
  useEffect(() => {
    checkTrialStatus().then(status => {
      setTrialStatus(status);
    }).catch(() => {});
  }, []);

  // ── Auto-update IPC listener & version init ─────────────────────────────
  useEffect(() => {
    const req = (window as any).__electronRequire || (window as any).require;
    if (!req) return;
    try {
      const { ipcRenderer } = req('electron');
      // Fetch and display the real running app version
      ipcRenderer.invoke('get-app-version').then((v: string) => {
        if (v) setAppVersion(v);
      }).catch(() => {});
      // Listen to real-time auto-update progress events from main process
      const handler = (_: any, payload: any) => {
        if (payload?.status) setUpdateStatus(payload);
      };
      ipcRenderer.on('auto-update-status', handler);
      return () => { ipcRenderer.removeListener('auto-update-status', handler); };
    } catch (_) {}
  }, []);

  // File system
  const [files, setFiles] = useState<{ [filename: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('robolab_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return {};
  });
  const [savedFiles, setSavedFiles] = useState<{ [filename: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('robolab_savedFiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  }); // tracks last-saved content
  const [activeFile, setActiveFile] = useState<string>(() => {
    try {
      const savedFilesRaw = localStorage.getItem('robolab_files');
      const parsedFiles = savedFilesRaw ? JSON.parse(savedFilesRaw) : {};
      const fileKeys = Object.keys(parsedFiles || {});
      if (fileKeys.length === 0) return '';
      const savedActive = localStorage.getItem('robolab_activeFile');
      if (savedActive && parsedFiles[savedActive] !== undefined) {
        return savedActive;
      }
      return fileKeys.find(f => f.endsWith('.ino') || f.endsWith('.py')) || fileKeys[0] || '';
    } catch (e) {
      return '';
    }
  });
  const [filePaths, setFilePaths] = useState<{ [filename: string]: string }>({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'ino' | 'py' | 'h' | 'cpp' | 'c' | 'json'>('ino');
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  useEffect(() => {
    if (Object.keys(files).length > 0) {
      localStorage.setItem('robolab_files', JSON.stringify(files));
    } else {
      localStorage.removeItem('robolab_files');
    }
  }, [files]);

  useEffect(() => {
    if (activeFile) {
      localStorage.setItem('robolab_activeFile', activeFile);
    } else {
      localStorage.removeItem('robolab_activeFile');
    }
  }, [activeFile]);

  useEffect(() => {
    if (Object.keys(savedFiles).length > 0) {
      localStorage.setItem('robolab_savedFiles', JSON.stringify(savedFiles));
    } else {
      localStorage.removeItem('robolab_savedFiles');
    }
  }, [savedFiles]);

  // Helper: Encode & Decode RoboLab Block HEX (.hex) format (Intel HEX + Lossless UTF-8 Base64 Blockly XML, Arduino & Python metadata)
  const toBase64Utf8 = (str: string): string => {
    try {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      return '';
    }
  };

  const fromBase64Utf8 = (b64: string): string => {
    try {
      const binary = atob(b64.trim());
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return '';
    }
  };

  const buildRoboLabBlockHex = (payload: { xml: string; ino: string; py: string; board: string }): string => {
    const lines: string[] = [
      '; ROBOLAB_BLOCK_HEX_V1',
      `; BOARD: ${payload.board || 'Arduino Uno'}`,
      `; XML_BASE64: ${toBase64Utf8(payload.xml || '')}`,
      `; INO_BASE64: ${toBase64Utf8(payload.ino || '')}`,
      `; PY_BASE64: ${toBase64Utf8(payload.py || '')}`,
    ];

    // Encode Blockly XML payload as standard Intel HEX records (:LLAAAATTDD...CC)
    const dataBytes = new TextEncoder().encode(payload.xml || '');
    let highAddress = -1;
    for (let offset = 0; offset < dataBytes.length; offset += 16) {
      const currentHigh = (offset >>> 16) & 0xffff;
      if (currentHigh !== highAddress) {
        highAddress = currentHigh;
        const hiByte = (highAddress >>> 8) & 0xff;
        const loByte = highAddress & 0xff;
        const extSum = (0x02 + 0x00 + 0x00 + 0x04 + hiByte + loByte) & 0xff;
        const extChecksum = ((~extSum + 1) & 0xff).toString(16).toUpperCase().padStart(2, '0');
        lines.push(`:02000004${hiByte.toString(16).toUpperCase().padStart(2, '0')}${loByte.toString(16).toUpperCase().padStart(2, '0')}${extChecksum}`);
      }
      const chunk = dataBytes.subarray(offset, Math.min(offset + 16, dataBytes.length));
      const byteCount = chunk.length;
      const addr16 = offset & 0xffff;
      const addrHi = (addr16 >>> 8) & 0xff;
      const addrLo = addr16 & 0xff;
      let sum = byteCount + addrHi + addrLo + 0x00;
      let dataHex = '';
      for (let i = 0; i < chunk.length; i++) {
        sum += chunk[i];
        dataHex += chunk[i].toString(16).toUpperCase().padStart(2, '0');
      }
      const checksum = ((~sum + 1) & 0xff).toString(16).toUpperCase().padStart(2, '0');
      lines.push(
        `:${byteCount.toString(16).toUpperCase().padStart(2, '0')}${addr16.toString(16).toUpperCase().padStart(4, '0')}00${dataHex}${checksum}`
      );
    }
    lines.push(':00000001FF');
    return lines.join('\n') + '\n';
  };

  const parseRoboLabBlockHex = (content: string): { xml: string; ino: string; py: string; board: string | null } => {
    let xml = '';
    let ino = '';
    let py = '';
    let detectedBoard: string | null = null;

    const boardMatch = content.match(/^;\s*BOARD:\s*(.+)$/m);
    if (boardMatch && boardMatch[1]) {
      detectedBoard = boardMatch[1].trim();
    }
    const xmlB64Match = content.match(/^;\s*XML_BASE64:\s*([A-Za-z0-9+/=]+)\s*$/m);
    if (xmlB64Match && xmlB64Match[1]) {
      xml = fromBase64Utf8(xmlB64Match[1]);
    }
    const inoB64Match = content.match(/^;\s*INO_BASE64:\s*([A-Za-z0-9+/=]+)\s*$/m);
    if (inoB64Match && inoB64Match[1]) {
      ino = fromBase64Utf8(inoB64Match[1]);
    }
    const pyB64Match = content.match(/^;\s*PY_BASE64:\s*([A-Za-z0-9+/=]+)\s*$/m);
    if (pyB64Match && pyB64Match[1]) {
      py = fromBase64Utf8(pyB64Match[1]);
    }

    // Fallback 1: Direct embedded <xml>...</xml>
    if (!xml || !xml.includes('<block')) {
      const rawXmlMatch = content.match(/<xml[\s\S]*?<\/xml>/i);
      if (rawXmlMatch) {
        xml = rawXmlMatch[0];
      }
    }

    // Fallback 2: Decode Intel HEX data records (:LLAAAATTDD...CC)
    if (!xml || !xml.includes('<block')) {
      try {
        const bytes: number[] = [];
        const hexLines = content.split(/\r?\n/);
        for (const line of hexLines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith(':') || trimmed.length < 11) continue;
          const byteCount = parseInt(trimmed.slice(1, 3), 16);
          const recordType = parseInt(trimmed.slice(7, 9), 16);
          if (recordType === 0x00 && !isNaN(byteCount) && trimmed.length >= 9 + byteCount * 2) {
            for (let i = 0; i < byteCount; i++) {
              const b = parseInt(trimmed.slice(9 + i * 2, 11 + i * 2), 16);
              if (!isNaN(b)) bytes.push(b);
            }
          }
        }
        if (bytes.length > 0) {
          const decodedText = new TextDecoder().decode(new Uint8Array(bytes));
          const decodedXmlMatch = decodedText.match(/<xml[\s\S]*?<\/xml>/i);
          if (decodedXmlMatch) {
            xml = decodedXmlMatch[0];
          } else if (/void\s+(setup|loop)\s*\(/.test(decodedText)) {
            ino = ino || decodedText;
            xml = arduinoToBlocklyXml(decodedText);
          } else if (/\b(import|def|while\s+True)\b/.test(decodedText)) {
            py = py || decodedText;
            xml = pythonToBlocklyXml(decodedText);
          }
        }
      } catch (e) {
        // Ignore Intel HEX decode errors
      }
    }

    // Fallback 3: Convert from ino or py if XML is still empty
    if ((!xml || !xml.includes('<block')) && ino) {
      try {
        xml = arduinoToBlocklyXml(ino);
      } catch (_) {}
    }
    if ((!xml || !xml.includes('<block')) && py) {
      try {
        xml = pythonToBlocklyXml(py);
      } catch (_) {}
    }

    return { xml, ino, py, board: detectedBoard };
  };

  // Save active workspace as Block HEX (.hex) containing Blockly XML + Arduino + Python
  const handleSaveFile = async () => {
    const isSim = currentTab === 'simulator';
    const targetFiles = isSim ? simFiles : files;
    const targetXmls = isSim ? simWorkspaceXmls : workspaceXmls;
    const targetActive = isSim ? simActiveFile : activeFile;
    const targetBoard = isSim ? simBoard : board;

    const inoCode = targetFiles['firmware/main.ino'] || (targetActive.endsWith('.ino') ? targetFiles[targetActive] : '') || '';
    const pyCode = targetFiles['python/main.py'] || (targetActive.endsWith('.py') ? targetFiles[targetActive] : '') || '';
    let currentXml = targetXmls[targetActive] || targetXmls['firmware/main.ino'] || targetXmls['python/main.py'] || '';

    if (!currentXml || !currentXml.includes('<block')) {
      try {
        if (targetActive.endsWith('.py') && pyCode.trim()) {
          currentXml = pythonToBlocklyXml(pyCode);
        } else if (inoCode.trim()) {
          currentXml = arduinoToBlocklyXml(inoCode);
        } else if (pyCode.trim()) {
          currentXml = pythonToBlocklyXml(pyCode);
        }
      } catch (e) {
        console.warn('Fallback XML generation on save failed:', e);
      }
    }

    const hexContent = buildRoboLabBlockHex({
      xml: currentXml,
      ino: inoCode,
      py: pyCode,
      board: targetBoard,
    });

    const rawBaseName =
      (projectName && projectName !== 'PROYEK' ? projectName : '') ||
      targetActive.split('/').pop()?.replace(/\.[^.]+$/, '') ||
      'robolab_blocks';
    const safeBaseName = rawBaseName.toLowerCase().replace(/[^a-z0-9_-]+/g, '_') || 'robolab_blocks';
    const hexFilename = `${safeBaseName}.hex`;

    setSavedFiles(prev => ({
      ...prev,
      [activeFile]: files[activeFile] || '',
      'firmware/main.ino': files['firmware/main.ino'] || '',
      'python/main.py': files['python/main.py'] || '',
    }));

    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const electron = req('electron');
        const saved = await electron.ipcRenderer.invoke('save-file', {
          defaultPath: hexFilename,
          content: hexContent,
        });
        if (saved && saved.name) {
          setTerminalLogs(prev => [
            ...prev,
            { text: `✓ Block HEX '${saved.name}' berhasil disimpan (Blok Visual + Arduino + Python).`, type: 'success' },
          ]);
        }
      } catch (err) {
        console.error("Electron save-file error:", err);
      }
    } else {
      await downloadFileInBrowser(hexFilename, hexContent);
      setTerminalLogs(prev => [
        ...prev,
        { text: `✓ Block HEX '${hexFilename}' berhasil diunduh (Blok Visual + Arduino + Python).`, type: 'success' },
      ]);
    }
  };

  // Layout mode
  const [workspaceMode, setWorkspaceMode] = useState<'blockly' | 'code' | 'split'>('split');
  const [uiMode, setUiMode] = useState<'student' | 'pro'>('pro');
  const [studentSubMode, setStudentSubMode] = useState<'block' | 'code'>('block');
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [learningCategory, setLearningCategory] = useState<'fundamental' | 'micropython' | 'hardware'>('fundamental');

  // Code Synchronization with Blockly statuses (Real Device Workspace)
  const [syncStatuses, setSyncStatuses] = useState<{ [filename: string]: boolean }>({
    'firmware/main.ino': true,
    'python/main.py': true
  });
  const [workspaceXmls, setWorkspaceXmls] = useState<{ [filename: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('robolab_workspaceXmls');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    if (Object.keys(workspaceXmls).length > 0) {
      localStorage.setItem('robolab_workspaceXmls', JSON.stringify(workspaceXmls));
    }
  }, [workspaceXmls]);
  const [learningLessonLoadedCount, setLearningLessonLoadedCount] = useState(0);

  // ==========================================================================
  // DEDICATED & ISOLATED SIMULATOR WORKSPACE STATE (3D Robot + Circuit)
  // ==========================================================================
  const initialRobotSetup = useMemo(() => {
    const hw = createDefaultRobotHardwareConfig();
    const rawPlans = createDefaultRobotPlans(hw.sensorCount);
    const { xml, plansWithBlockIds } = buildRobotPlanBlocklyXml(hw, rawPlans, 1);
    const ino = generateRobotPlanArduinoCode(hw, plansWithBlockIds, 1);
    const py = generateRobotPlanPythonCode(hw, plansWithBlockIds, 1);
    return { hw, plans: plansWithBlockIds, xml, ino, py };
  }, []);

  const DEFAULT_SIM_FILES: { [filename: string]: string } = {
    'firmware/main.ino': initialRobotSetup.ino,
    'python/main.py': initialRobotSetup.py,
  };

  const [simulatorMode, setSimulatorMode] = useState<'robot' | 'circuit'>('robot');
  const [robotHardwareConfig, setRobotHardwareConfig] = useState<RobotHardwareConfig>(() => initialRobotSetup.hw);
  const [robotPlans, setRobotPlans] = useState<RobotPlan[]>(() => initialRobotSetup.plans);
  const [activeRobotPlanId, setActiveRobotPlanId] = useState<number>(1);
  const [activeRobotHighlight, setActiveRobotHighlight] = useState<ActiveExecutionHighlight | null>(null);

  const [simBoard, setSimBoard] = useState<string>(() => {
    return localStorage.getItem('robolab_sim_board') || 'ESP32 DevKit V1';
  });
  const [simFiles, setSimFiles] = useState<{ [filename: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('robolab_sim_files_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed['firmware/main.ino']) return parsed;
      }
    } catch (e) {}
    return DEFAULT_SIM_FILES;
  });
  const [simActiveFile, setSimActiveFile] = useState<string>(() => {
    const saved = localStorage.getItem('robolab_sim_activeFile');
    if (saved === 'firmware/main.ino' || saved === 'python/main.py') return saved;
    return 'firmware/main.ino';
  });
  const [simSyncStatuses, setSimSyncStatuses] = useState<{ [filename: string]: boolean }>({
    'firmware/main.ino': true,
    'python/main.py': true
  });
  const [simWorkspaceXmls, setSimWorkspaceXmls] = useState<{ [filename: string]: string }>(() => {
    try {
      const saved = localStorage.getItem('robolab_sim_workspaceXmls_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sharedXml = parsed?.['firmware/main.ino'] || parsed?.['python/main.py'];
        if (sharedXml && sharedXml.includes('arduino_setup')) {
          return {
            ...parsed,
            'firmware/main.ino': sharedXml,
            'python/main.py': sharedXml,
          };
        }
      }
    } catch (e) {}
    return {
      'firmware/main.ino': initialRobotSetup.xml,
      'python/main.py': initialRobotSetup.xml,
    };
  });
  const [simViewMode, setSimViewMode] = useState<'split' | 'blockly' | 'code' | 'circuit'>('split');
  const [simShowConsole, setSimShowConsole] = useState<boolean>(false);
  const [simResetKey, setSimResetKey] = useState<number>(0);

  const syncRobotToSimulatorWorkspace = useCallback(
    (
      nextHw: RobotHardwareConfig,
      nextPlans: RobotPlan[],
      nextActiveId: number,
      rebuildBlocklyXml = false
    ) => {
      const { xml, plansWithBlockIds } = buildRobotPlanBlocklyXml(nextHw, nextPlans, nextActiveId);
      const inoCode = generateRobotPlanArduinoCode(nextHw, plansWithBlockIds, nextActiveId);
      const pyCode = generateRobotPlanPythonCode(nextHw, plansWithBlockIds, nextActiveId);

      setRobotHardwareConfig(nextHw);
      setRobotPlans(plansWithBlockIds);
      setActiveRobotPlanId(nextActiveId);
      setSimBoard(nextHw.mcu);
      setSimFiles({
        'firmware/main.ino': inoCode,
        'python/main.py': pyCode,
      });
      setSimSyncStatuses({
        'firmware/main.ino': true,
        'python/main.py': true,
      });
      if (rebuildBlocklyXml) {
        setSimWorkspaceXmls({
          'firmware/main.ino': xml,
          'python/main.py': xml,
        });
        setSimResetKey((prev) => prev + 1);
      }
    },
    []
  );

  useEffect(() => {
    localStorage.setItem('robolab_sim_board', simBoard);
  }, [simBoard]);

  useEffect(() => {
    if (Object.keys(simFiles).length > 0) {
      localStorage.setItem('robolab_sim_files_v2', JSON.stringify(simFiles));
    }
  }, [simFiles]);

  useEffect(() => {
    localStorage.setItem('robolab_sim_activeFile', simActiveFile);
  }, [simActiveFile]);

  useEffect(() => {
    if (Object.keys(simWorkspaceXmls).length > 0) {
      localStorage.setItem('robolab_sim_workspaceXmls_v2', JSON.stringify(simWorkspaceXmls));
    }
  }, [simWorkspaceXmls]);

  // Board Connection (Real Hardware Device)
  const [board, setBoard] = useState<string>('ESP32 DevKit V1');
  const [port, setPort] = useState<string>('none');
  const [availablePorts, setAvailablePorts] = useState<Array<{ address: string, label: string }>>([]);
  
  // Serial Monitor states
  const [serialBaudrate, setSerialBaudrate] = useState<number>(115200);
  const [isSerialConnected, setIsSerialConnected] = useState<boolean>(false);
  const [connectedPort, setConnectedPort] = useState<string>('none');
  const [serialRawOutput, setSerialRawOutput] = useState<string>('');

  const handleSetIsSerialConnected = useCallback((connected: boolean) => {
    setIsSerialConnected(connected);
    if (connected) {
      setConnectedPort(port);
    } else {
      setConnectedPort('none');
    }
  }, [port]);

  // Shared simulator states for synchronization between sidebar and expanded view
  const [simulatorPotValue, setSimulatorPotValue] = useState(50);
  const [simulatorButtonPressed, setSimulatorButtonPressed] = useState(false);
  const [simulatorActiveComponents, setSimulatorActiveComponents] = useState<string[]>([]);
  const [simulatorPositions, setSimulatorPositions] = useState<{ [key: string]: { x: number; y: number } }>({
    board: { x: 85, y: 15 },
    breadboard: { x: 18, y: 380 },
    led: { x: 15, y: 420 },
    servo: { x: 110, y: 420 },
    ultrasonic: { x: 15, y: 520 },
    pot: { x: 15, y: 630 },
    button: { x: 120, y: 530 },
    lcd: { x: 210, y: 530 },
    dht11: { x: 120, y: 640 }
  });
  const [simulatorWires, setSimulatorWires] = useState<Wire[]>([]);
  const [microbitFrames, setMicrobitFrames] = useState<string[]>([]);
  
  // Shared Virtual WiFi simulator state
  const [isWifiConnected, setIsWifiConnected] = useState<boolean>(false);
  const [selectedWifi, setSelectedWifi] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');

  // Interactive simulator states for Learning page illustrations
  const [virtualPotVal, setVirtualPotVal] = useState(2048);
  const [virtualDistVal, setVirtualDistVal] = useState(35.5);
  const [virtualWebLed, setVirtualWebLed] = useState(false);
  const [asyncLed1, setAsyncLed1] = useState(false);
  const [asyncLed2, setAsyncLed2] = useState(false);
  const [pidHistory, setPidHistory] = useState<number[]>([]);

  // uasyncio simulated blinking effect
  useEffect(() => {
    if (currentTab !== 'learning' || learningCategory !== 'micropython' || activeLessonIndex !== 5) return;
    
    const interval1 = setInterval(() => {
      setAsyncLed1(p => !p);
    }, 200);
    
    const interval2 = setInterval(() => {
      setAsyncLed2(p => !p);
    }, 1000);
    
    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [currentTab, learningCategory, activeLessonIndex]);

  // PID simulated graph ticking effect
  useEffect(() => {
    if (currentTab !== 'learning' || learningCategory !== 'micropython' || activeLessonIndex !== 7) {
      setPidHistory([]);
      return;
    }
    
    let currentPos = 55.0;
    const target = 90.0;
    let prevError = 0;
    let integral = 0;
    const kp = 0.2;
    const ki = 0.02;
    const kd = 0.05;
    setPidHistory([currentPos]);
    
    const interval = setInterval(() => {
      const error = target - currentPos;
      integral += error * 0.1;
      const derivative = (error - prevError) / 0.1;
      const output = (kp * error) + (ki * integral) + (kd * derivative);
      
      prevError = error;
      currentPos += output;
      
      setPidHistory(prev => {
        const next = [...prev, currentPos];
        if (next.length > 20) next.shift();
        return next;
      });
    }, 250);
    
    return () => clearInterval(interval);
  }, [currentTab, learningCategory, activeLessonIndex]);



  // Package search & Per-Account Scoped Libraries
  const [pkgSearch, setPkgSearch] = useState('');
  const userPackageStorageKey = authUser?.id ? `robolab_packages_${authUser.id}` : 'robolab_packages';
  const [packages, setPackages] = useState(() => {
    try {
      const key = authUser?.id ? `robolab_packages_${authUser.id}` : 'robolab_packages';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.arduino)) {
          const existing = new Set(parsed.arduino.map((p: any) => (p.name || '').toLowerCase()));
          INITIAL_PACKAGES.arduino.forEach((initPkg: any) => {
            if (!existing.has((initPkg.name || '').toLowerCase())) {
              parsed.arduino.push(initPkg);
            }
          });
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved packages:', e);
    }
    return INITIAL_PACKAGES;
  });
  const [pkgTab, setPkgTab] = useState<'arduino' | 'python' | 'boards'>('arduino');
  const [githubUrl, setGithubUrl] = useState('');
  const [isInstallingGithub, setIsInstallingGithub] = useState(false);
  const [isSyncingLibs, setIsSyncingLibs] = useState(false);
  const [installingMap, setInstallingMap] = useState<Record<string, { loading: boolean; progress?: string }>>({});
  const [uninstallingMap, setUninstallingMap] = useState<{ [pkgName: string]: boolean }>({});

  const handleUninstallPkg = async (type: 'arduino' | 'python', name: string) => {
    if (!name) return;
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus/uninstall ${type === 'arduino' ? 'library' : 'package'} '${name}'?`);
    if (!confirmed) return;

    setIsTerminalCollapsed(false);
    setTerminalTab('terminal');
    setUninstallingMap(prev => ({ ...prev, [name]: true }));
    setTerminalLogs((prev: any) => [...prev, { text: `🗑️ Memulai penghapusan package ${name}...`, type: 'info' }]);

    // Always delete from Supabase custom libraries database if type is arduino
    if (type === 'arduino') {
      try {
        await deleteUserCustomLibrary(authUser?.id || '', name);
      } catch (dbErr: any) {
        console.warn('[RoboLab] Error deleting custom library from database:', dbErr?.message || dbErr);
      }
    }

    const req = (window as any).__electronRequire || (window as any).require;
    if (!req) {
      setTimeout(async () => {
        setPackages((prev: any) => ({
          ...prev,
          [type]: prev[type].map((p: any) => p.name.toLowerCase() === name.toLowerCase() ? { ...p, installed: false, isCustom: false } : p)
            .filter((p: any) => {
              if (type === 'arduino') {
                const isInitial = INITIAL_PACKAGES.arduino.some((init: any) => init.name.toLowerCase() === p.name.toLowerCase());
                if (!isInitial && p.name.toLowerCase() === name.toLowerCase()) return false;
              }
              return true;
            })
        }));
        if (type === 'arduino') {
          setCustomLibProjects(prev => prev.filter(p => (p.libraryName || '').toLowerCase() !== name.toLowerCase()));
          await syncInstalledLibraries();
        }
        setUninstallingMap(prev => ({ ...prev, [name]: false }));
        setTerminalLogs((prev: any) => [...prev, { text: `✓ Package ${name} berhasil dihapus dari database & sistem (Web mode).`, type: 'success' }]);
      }, 500);
      return;
    }

    try {
      const electron = req('electron');
      const channel = type === 'arduino' ? 'uninstall-arduino-lib' : 'uninstall-python-pkg';
      const result = await electron.ipcRenderer.invoke(channel, type === 'arduino' ? { libName: name, userId: authUser?.id } : name);

      // Clean packages from state and update customLibProjects
      setPackages((prev: any) => ({
        ...prev,
        [type]: prev[type].map((p: any) => p.name.toLowerCase() === name.toLowerCase() ? { ...p, installed: false, isCustom: false } : p)
          .filter((p: any) => {
            if (type === 'arduino') {
              const isInitial = INITIAL_PACKAGES.arduino.some((init: any) => init.name.toLowerCase() === p.name.toLowerCase());
              if (!isInitial && p.name.toLowerCase() === name.toLowerCase()) return false;
            }
            return true;
          })
      }));
      if (type === 'arduino') {
        setCustomLibProjects(prev => prev.filter(p => (p.libraryName || '').toLowerCase() !== name.toLowerCase()));
        await syncInstalledLibraries();
      }

      if (result && result.success) {
        setTerminalLogs((prev: any) => [...prev, { text: `✅ Package ${name} berhasil dihapus dari sistem & database!`, type: 'success' }]);
      } else {
        // Even if disk removal was skipped because directory didn't exist on disk, DB was successfully cleared
        setTerminalLogs((prev: any) => [...prev, { text: `✅ Package ${name} berhasil dibersihkan dari database!`, type: 'success' }]);
      }
    } catch (err: any) {
      setTerminalLogs((prev: any) => [...prev, { text: `Error: ${err.message || err}`, type: 'error' }]);
    } finally {
      setUninstallingMap(prev => ({ ...prev, [name]: false }));
    }
  };

  // Persist packages state to localStorage per user
  useEffect(() => {
    localStorage.setItem(userPackageStorageKey, JSON.stringify(packages));
  }, [packages, userPackageStorageKey]);

  // Sync installed libraries and board cores status from disk & cloud scoped to current user account
  const syncInstalledLibraries = useCallback(async () => {
    setIsSyncingLibs(true);
    try {
      const req = (window as any).__electronRequire || (window as any).require;
      let installedLibsOnDisk: any[] = [];
      let installedCoresOnDisk: any[] = [];

      // 1. Sync libraries and cores from local disk if Electron is available
      if (req) {
        try {
          const electron = req('electron');
          installedLibsOnDisk = (await electron.ipcRenderer.invoke('get-installed-libs', authUser?.id)) || [];
          installedCoresOnDisk = (await electron.ipcRenderer.invoke('get-installed-cores')) || [];
          try {
            const diskExamples = (await electron.ipcRenderer.invoke('get-library-examples', authUser?.id)) || [];
            if (Array.isArray(diskExamples) && diskExamples.length > 0) {
              const formattedExamples = diskExamples.map((ex: any) => ({
                name: ex.name,
                board: ex.board || 'Arduino Uno',
                description: ex.description || `Contoh program ${ex.name} dari library ${ex.library}.`,
                iconColor: ex.isCustom ? 'emerald' : 'cyan',
                components: ['custom_lib'],
                libraryName: ex.library,
                category: 'Library Example',
                isLibraryExample: true,
                isCustom: !!ex.isCustom,
                isGitHubLib: !!ex.isCustom,
                ino: ex.code,
                xml: ex.code ? (arduinoToBlocklyXml(ex.code, ex.parsedApi) || '') : '',
                parsedApi: ex.parsedApi,
                py: ex.code ? (arduinoToPython(ex.code, ex.parsedApi) || `# Contoh Library ${ex.library}\n`) : ''
              }));
              setCustomLibProjects(formattedExamples);
            }
          } catch (exErr) {
            console.warn('[RoboLab] Error loading library examples:', exErr);
          }
        } catch (e) {
          console.warn('[RoboLab] Error invoking electron ipc:', e);
        }
      }

      // 2. Sync from Supabase Cloud (Always runs and is awaited in both Web and Electron)
      let cloudLibs: any[] = [];
      if (authUser?.id) {
        try {
          cloudLibs = (await fetchUserCustomLibraries(authUser.id)) || [];
        } catch (e) {
          console.warn('[RoboLab] Error fetching custom libraries from cloud:', e);
        }
      }

      // 3. Atomically update packages
      setPackages((prev: any) => {
        const existingArduino = Array.isArray(prev?.arduino) ? [...prev.arduino] : [...INITIAL_PACKAGES.arduino];

        // A. Match disk libraries — gunakan exact match dulu, lalu substring hanya jika keduanya cukup panjang (>=5 char)
        let updated = existingArduino.map((p: any) => {
          const diskObj = installedLibsOnDisk.find((diskLib: any) => {
            const diskName = (typeof diskLib === 'string' ? diskLib : diskLib.name) || '';
            const pName = p.name.toLowerCase();
            const dName = diskName.toLowerCase();
            if (!dName || !pName) return false;
            // Exact match selalu prioritas
            if (dName === pName) return true;
            // Substring match hanya jika keduanya >= 5 karakter (cegah false positive: "SPI" match "Serial" dll.)
            if (pName.length >= 5 && dName.length >= 5) {
              return dName.includes(pName) || pName.includes(dName);
            }
            return false;
          });
          if (diskObj) {
            const isObj = typeof diskObj === 'object' && diskObj !== null;
            return {
              ...p,
              installed: true,
              isCustom: isObj && diskObj.isCustom !== undefined ? diskObj.isCustom : p.isCustom,
              parsedApi: (isObj && diskObj.parsedApi) ? diskObj.parsedApi : p.parsedApi,
              headers: (isObj && diskObj.headers) ? diskObj.headers : p.headers
            };
          }
          return p;
        });

        // B. Inject custom disk libraries — gunakan exact match dulu, hindari false positive
        for (const diskLib of installedLibsOnDisk) {
          const diskName = typeof diskLib === 'string' ? diskLib : diskLib.name;
          if (!diskName) continue;
          const dName = diskName.toLowerCase();
          // Cari match: exact dulu, lalu substring hanya jika >= 6 karakter
          const idx = updated.findIndex(p => {
            const pName = p.name.toLowerCase();
            if (pName === dName) return true;
            if (pName.length >= 6 && dName.length >= 6) {
              return pName.includes(dName) || dName.includes(pName);
            }
            return false;
          });
          const isObj = typeof diskLib === 'object' && diskLib !== null;
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              installed: true,
              isCustom: true,
              headers: isObj && diskLib.headers ? diskLib.headers : updated[idx].headers,
              parsedApi: isObj && diskLib.parsedApi ? diskLib.parsedApi : updated[idx].parsedApi,
            };
          } else {
            updated.push({
              name: diskName,
              desc: isObj ? (diskLib.desc || `Library kustom di akun Anda (${diskName})`) : `Custom Library (${diskName})`,
              version: isObj ? (diskLib.version || '1.0.0-custom') : '1.0.0-custom',
              author: isObj ? (diskLib.author || (authUser?.name || 'Akun Anda')) : (authUser?.name || 'Akun Anda'),
              installed: true,
              isCustom: true,
              userId: isObj ? diskLib.userId : authUser?.id,
              headers: isObj ? diskLib.headers : [],
              parsedApi: isObj ? diskLib.parsedApi : undefined,
            });
          }
        }

        // C. Inject Supabase cloud libraries
        for (const cLib of cloudLibs) {
          if (!cLib.name) continue;
          const idx = updated.findIndex(p => p.name.toLowerCase() === cLib.name.toLowerCase());
          if (idx >= 0) {
            updated[idx] = {
              ...updated[idx],
              installed: true,
              isCustom: true,
              userId: authUser?.id,
              headers: cLib.headers || updated[idx].headers || [],
            };
          } else {
            updated.push({
              name: cLib.name,
              desc: `Library akun dari Cloud (${cLib.source_type}): ${cLib.source_url || ''}`,
              version: cLib.version || '1.0.0',
              author: authUser?.name || 'Akun Anda',
              installed: true,
              isCustom: true,
              userId: authUser?.id,
              headers: cLib.headers || [],
            });
          }
        }

        // D. Board cores
        let updatedBoards = prev.boards;
        if (Array.isArray(installedCoresOnDisk) && installedCoresOnDisk.length > 0) {
          const coreNameMap: Record<string, string> = {
            'ESP32 Arduino': 'esp32:esp32',
            'Arduino AVR Boards': 'arduino:avr',
            'MegaCore (ATmega128)': 'MegaCore:avr',
            'ESP8266 Arduino': 'esp8266:esp8266',
            'STM32 Boards': 'STMicroelectronics:stm32',
            'Raspberry Pi Pico': 'rp2040:rp2040'
          };
          updatedBoards = prev.boards.map((b: any) => {
            const targetCore = coreNameMap[b.name] || b.name;
            const isInstalled = installedCoresOnDisk.some(c => c.toLowerCase() === targetCore.toLowerCase());
            return { ...b, installed: isInstalled };
          });
        }

        return {
          ...prev,
          arduino: updated,
          boards: updatedBoards,
        };
      });
    } catch (err: any) {
      console.warn('[RoboLab] Failed to sync installed libs:', err);
    } finally {
      setIsSyncingLibs(false);
    }
  }, [authUser?.id, authUser?.name]);

  useEffect(() => {
    syncInstalledLibraries();
  }, [syncInstalledLibraries]);

  // Automatically install packages for components when they are added to the workspace
  useEffect(() => {
    setPackages((prev: any) => {
      let updated = false;
      const newArduino = prev.arduino.map((p: any) => {
        const wantsDht = simulatorActiveComponents.includes('dht11') || simulatorActiveComponents.includes('dht');
        if (p.name === 'DHT sensor library' && wantsDht && !p.installed) {
          updated = true;
          return { ...p, installed: true };
        }
        const wantsUltrasonic = simulatorActiveComponents.includes('ultrasonic') || simulatorActiveComponents.includes('hcsr') || simulatorActiveComponents.includes('hcsr04');
        if (p.name === 'Ultrasonic' && wantsUltrasonic && !p.installed) {
          updated = true;
          return { ...p, installed: true };
        }
        const wantsServo = simulatorActiveComponents.includes('servo');
        if (p.name === 'Servo' && wantsServo && !p.installed) {
          updated = true;
          return { ...p, installed: true };
        }
        return p;
      });
      if (updated) {
        return { ...prev, arduino: newArduino };
      }
      return prev;
    });
  }, [simulatorActiveComponents]);

  // Auto-play for 3D Carousel dinonaktifkan (perbaikan bug geser saat dipilih)
  /*
  useEffect(() => {
    if (currentTab !== 'home') return;
    const interval = setInterval(() => {
      setActiveCardIndex((prev) => (prev + 1) % allProjectsList.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [currentTab]);
  */

  // Loading Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Listen for native arduino logs from electron main process
  useEffect(() => {
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const { ipcRenderer } = req('electron');
        const handleArduinoLog = (_event: any, log: { text: string, type: 'info' | 'error' | 'success' | 'stdout' }) => {
          setTerminalLogs(prev => [...prev, { text: log.text, type: log.type === 'stdout' ? 'stdout' : 'info' }]);
          const termType = log.type === 'info' ? 'output' : log.type === 'success' ? 'success' : log.type === 'error' ? 'error' : 'output';
          setInteractiveTerminalLogs(prev => [...prev, { text: log.text, type: termType }]);
        };
        
        const handleSerialData = (_event: any, data: string) => {
          setSerialRawOutput(prev => {
            const next = prev + data;
            if (next.length > 50000) return next.slice(next.length - 50000); // keep last 50k chars
            return next;
          });
        };
        
        const handlePythonOutput = (_event: any, data: {type: string, text: string}) => {
          const interactiveTermType = data.type === 'stdout' ? 'output' : data.type === 'info' ? 'output' : 'error';
          const termType = data.type === 'stdout' ? 'stdout' : data.type === 'info' ? 'info' : 'error';
          setInteractiveTerminalLogs(prev => [...prev, { text: data.text, type: interactiveTermType }]);
          setTerminalLogs(prev => [...prev, { text: data.text, type: termType }]);
          
          if (data.text.includes('Process exited')) {
            setIsRunning(false);
            setBuildStatusText('Finished');
          }
        };
        
        const handleSerialDisconnected = () => {
          setIsSerialConnected(false);
          setConnectedPort('none');
        };
        
        ipcRenderer.on('arduino-log', handleArduinoLog);
        ipcRenderer.on('serial-data', handleSerialData);
        ipcRenderer.on('python-output', handlePythonOutput);
        ipcRenderer.on('serial-disconnected', handleSerialDisconnected);
        return () => {
          ipcRenderer.removeListener('arduino-log', handleArduinoLog);
          ipcRenderer.removeListener('serial-data', handleSerialData);
          ipcRenderer.removeListener('python-output', handlePythonOutput);
          ipcRenderer.removeListener('serial-disconnected', handleSerialDisconnected);
        };
      } catch (err) {
        console.warn("Failed to set up ipcRenderer listener:", err);
      }
    }
  }, []);

  // Hardware action ref to pause port polling during upload/compile
  const isHardwareActionRef = useRef(false);

  // Fetch and sync active serial ports periodically (Electron IPC + Web Serial API)
  const refreshPorts = useCallback(async () => {
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const electron = req('electron');
        const ports = await electron.ipcRenderer.invoke('get-serial-ports');
        console.log('[RoboLab UI] Detected ports:', ports);
        if (ports) {
          setAvailablePorts(ports);
          if (ports.length > 0) {
            setPort((prev: string) => {
              if (prev !== 'none' && ports.some((p: any) => p.address === prev)) {
                return prev;
              }
              const usbPort = ports.find((p: any) =>
                p.label && !p.label.toLowerCase().includes('bth') && !p.label.toLowerCase().includes('bluetooth')
              );
              const selected = usbPort ? usbPort.address : ports[0].address;
              console.log('[RoboLab UI] Auto-selected port:', selected);
              return selected;
            });
          } else {
            setPort('none');
          }
        }
      } catch (err) {
        console.warn("Failed to fetch serial ports:", err);
      }
    } else {
      // Web Browser Mode — Web Serial API
      try {
        const webPorts = await getWebSerialPorts();
        setAvailablePorts(webPorts.map(p => ({ address: p.address, label: p.label })));
        if (webPorts.length > 0) {
          setPort((prev: string) => {
            if (prev !== 'none' && webPorts.some(p => p.address === prev)) {
              return prev;
            }
            const usbCom = webPorts.find(
              p =>
                /^COM\d+$/i.test(p.address) &&
                p.address !== 'COM1' &&
                !p.label.toLowerCase().includes('bth') &&
                !p.label.toLowerCase().includes('bluetooth')
            );
            if (usbCom) return usbCom.address;
            const webUsbList = webPorts.filter(p => p.address.startsWith('WebUSB'));
            if (webUsbList.length > 0) return webUsbList[webUsbList.length - 1].address;
            return webPorts[0].address;
          });
        } else {
          setPort('none');
        }
      } catch (err) {
        console.warn('[WebSerial] Failed to list ports:', err);
      }
    }
  }, []);

  const handleRequestWebPort = useCallback(async () => {
    const picked = await requestWebSerialPort();
    if (picked) {
      await refreshPorts();
      setPort(picked.address);
      setInteractiveTerminalLogs(prev => [
        ...prev,
        { text: `🔌 [Web Serial API] Perangkat USB terhubung: ${picked.label}`, type: 'success' }
      ]);
    }
  }, [refreshPorts]);

  useEffect(() => {
    let isMounted = true;
    const fetchPorts = async () => {
      if (isHardwareActionRef.current) return;
      if (!isMounted) return;
      await refreshPorts();
    };

    fetchPorts();
    const req = (window as any).__electronRequire || (window as any).require;
    const interval = req ? setInterval(fetchPorts, 2000) : null;

    // In Web mode, listen for USB plug/unplug events via navigator.serial
    const serial = typeof navigator !== 'undefined' ? (navigator as any).serial : null;
    if (!req && serial && typeof serial.addEventListener === 'function') {
      serial.addEventListener('connect', fetchPorts);
      serial.addEventListener('disconnect', fetchPorts);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (!req && serial && typeof serial.removeEventListener === 'function') {
        serial.removeEventListener('connect', fetchPorts);
        serial.removeEventListener('disconnect', fetchPorts);
      }
    };
  }, [refreshPorts]);

  // Run Pipeline simulation
  const [isRunning, setIsRunning] = useState(false);
  const [pinStates, setPinStates] = useState<{ [pin: string]: 'HIGH' | 'LOW' | number }>({});
  const isRunningRef = useRef(false);
  
  // Blynk Simulation & Real Cloud Sync State
  const [blynkStatus, setBlynkStatus] = useState<'offline' | 'connecting' | 'online'>('offline');
  const [blynkVirtualPins, setBlynkVirtualPins] = useState<{ [vpin: string]: number }>({});
  const blynkHandlersRef = useRef<{ [vpin: string]: any[] }>({});
  const blynkAuthTokenRef = useRef<string | null>(null);
  const blynkPollingTimerRef = useRef<any>(null);
  const blynkTcpClientRef = useRef<any>(null);
  const blynkPingIntervalRef = useRef<any>(null);
  const blynkWsRef = useRef<any>(null);
  const lastRealBlynkValuesRef = useRef<{ [vpin: string]: number | string }>({});

  useEffect(() => {
    isRunningRef.current = isRunning;
    if (!isRunning) {
      setBlynkStatus('offline');
      setBlynkVirtualPins({});
      blynkAuthTokenRef.current = null;
      lastRealBlynkValuesRef.current = {};
      setIsWifiConnected(false);
      if (blynkTcpClientRef.current) {
        try { blynkTcpClientRef.current.destroy(); } catch (e) {}
        blynkTcpClientRef.current = null;
      }
      if (blynkPingIntervalRef.current) {
        clearInterval(blynkPingIntervalRef.current);
        blynkPingIntervalRef.current = null;
      }
      if (blynkWsRef.current) {
        try { blynkWsRef.current.close(); } catch (e) {}
        blynkWsRef.current = null;
      }
      if (blynkPollingTimerRef.current) {
        clearInterval(blynkPollingTimerRef.current);
        blynkPollingTimerRef.current = null;
      }
    }
  }, [isRunning]);

  const createBlynkTcpFrame = (msgType: number, msgId: number, body: string | Buffer) => {
    let bodyBuf = Buffer.isBuffer(body) ? body : Buffer.from(body || '', 'utf-8');
    if (msgType === 2 && bodyBuf.length !== 32) {
      const padded = Buffer.alloc(32);
      bodyBuf.copy(padded, 0, 0, Math.min(32, bodyBuf.length));
      bodyBuf = padded;
    }
    const buf = Buffer.alloc(5 + bodyBuf.length);
    buf.writeUInt8(msgType, 0);
    buf.writeUInt16BE(msgId, 1);
    buf.writeUInt16BE(bodyBuf.length, 3);
    if (bodyBuf.length > 0) bodyBuf.copy(buf, 5);
    return buf;
  };

  const extractBlynkCredentials = (codeText: string, providedAuth: string, providedSsid?: string, providedPass?: string) => {
    let token = (providedAuth || '').trim().replace(/^['"]|['"]$/g, '');
    let ssid = (providedSsid || '').trim().replace(/^['"]|['"]$/g, '');
    let pass = (providedPass || '').trim().replace(/^['"]|['"]$/g, '');

    // 1. Extract Token if variable name (like 'auth') or placeholder token was passed
    if (!token || token === 'auth' || token === 'YourAuthToken' || token === 'AUTH_TOKEN' || token.length < 15) {
      const tokenMatch = 
        codeText.match(/#define\s+BLYNK_AUTH_TOKEN\s+["']([^"']+)["']/) ||
        codeText.match(/char\s+auth\s*\[\s*\]\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/(?:const\s+char\*|String)\s+auth\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/BLYNK_AUTH_TOKEN\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/auth\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/blynk(?:_begin|\.begin|\.config)\s*\(\s*["']([^"']+)["']/i) ||
        codeText.match(/["']([a-zA-Z0-9_-]{32})["']/);
      if (tokenMatch && tokenMatch[1] && tokenMatch[1] !== 'YourAuthToken' && tokenMatch[1] !== 'AUTH_TOKEN') {
        token = tokenMatch[1].trim();
      }
    }

    // 2. Extract SSID if variable name (like 'ssid') was passed
    if (!ssid || ssid === 'ssid' || ssid === 'WiFi' || ssid === 'SSID' || ssid === 'MyWiFi') {
      const ssidMatch = 
        codeText.match(/char\s+ssid\s*\[\s*\]\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/(?:const\s+char\*|String)\s+ssid\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/#define\s+WIFI_SSID\s+["']([^"']+)["']/) ||
        codeText.match(/SSID\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/ssid\s*=\s*["']([^"']+)["']/);
      if (ssidMatch && ssidMatch[1]) {
        ssid = ssidMatch[1].trim();
      }
    }

    // 3. Extract Password if variable name (like 'pass') was passed
    if (!pass || pass === 'pass' || pass === 'password' || pass === 'PASS') {
      const passMatch = 
        codeText.match(/char\s+pass\s*\[\s*\]\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/(?:const\s+char\*|String)\s+(?:pass|password)\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/#define\s+WIFI_PASS\s+["']([^"']+)["']/) ||
        codeText.match(/PASS(?:WORD)?\s*=\s*["']([^"']+)["']/) ||
        codeText.match(/pass(?:word)?\s*=\s*["']([^"']+)["']/);
      if (passMatch && passMatch[1]) {
        pass = passMatch[1].trim();
      }
    }

    return { token, ssid, pass };
  };

  const startRealBlynkCloudSync = (rawAuthToken: string) => {
    const allFilesContent = Object.values(files).join('\n');
    const activeCodeText = allFilesContent + '\n' + activePythonCode + '\n' + ((window as any).__lastGeneratedBlocklyCode || '');
    const creds = extractBlynkCredentials(activeCodeText, rawAuthToken);
    const cleanAuth = creds.token;
    blynkAuthTokenRef.current = cleanAuth;
    
    if (!cleanAuth || cleanAuth === 'YourAuthToken' || cleanAuth === 'AUTH_TOKEN' || cleanAuth.length < 15) {
      setTerminalLogs(prev => [
        ...prev,
        { text: `[BLYNK CLOUD] ℹ️ To connect to REAL blynk.cloud dashboard, replace "YourAuthToken" with your 32-character Auth Token from blynk.cloud!`, type: 'stdout' }
      ]);
      setBlynkStatus('online');
      return;
    }

    setTerminalLogs(prev => [
      ...prev,
      { text: `[BLYNK CLOUD] 🌐 Connecting Hardware Socket to blynk.cloud with Token: "${cleanAuth}"...`, type: 'stdout' }
    ]);

    // Close any previous connections
    if (blynkTcpClientRef.current) {
      try { blynkTcpClientRef.current.destroy(); } catch (e) {}
      blynkTcpClientRef.current = null;
    }
    if (blynkPingIntervalRef.current) {
      clearInterval(blynkPingIntervalRef.current);
      blynkPingIntervalRef.current = null;
    }
    if (blynkWsRef.current) {
      try { blynkWsRef.current.close(); } catch (e) {}
      blynkWsRef.current = null;
    }

    // 1. Electron TCP & TLS Hardware Socket Engine
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const net = req('net');
        const tls = req('tls');
        const blynkTargets = [
          { host: 'sgp1.blynk.cloud', port: 80, isTls: false },
          { host: 'sgp1.blynk.cloud', port: 8080, isTls: false },
          { host: 'sgp1.blynk.cloud', port: 443, isTls: true },
          { host: 'blynk.cloud', port: 80, isTls: false },
          { host: 'blynk.cloud', port: 8080, isTls: false },
          { host: 'blynk.cloud', port: 443, isTls: true }
        ];

        blynkTargets.forEach(target => {
          const onConnect = () => {
            setTerminalLogs(prev => [
              ...prev,
              { text: `[BLYNK HARDWARE ${target.isTls ? 'TLS' : 'TCP'}] 🔌 Socket Connected to ${target.host}:${target.port}! Sending Hardware Login...`, type: 'stdout' }
            ]);
            const loginFrame = createBlynkTcpFrame(2, 1, cleanAuth);
            try { socket.write(loginFrame); } catch (e) {}
          };

          const socket = target.isTls
            ? tls.connect({ host: target.host, port: target.port, rejectUnauthorized: false }, onConnect)
            : net.createConnection({ host: target.host, port: target.port }, onConnect);

          let pId = 2;
          const pingInterval = setInterval(() => {
            try {
              const pingFrame = createBlynkTcpFrame(17, pId++, '');
              socket.write(pingFrame);
            } catch (e) {}
          }, 5000);

          socket.on('data', (buf: Buffer) => {
            try {
              const rawStr = buf.toString('utf-8');
              const hexStr = buf.toString('hex');
              
              if (buf.length >= 5 && (buf.readUInt8(0) === 0 || buf.readUInt16BE(3) === 200)) {
                setTerminalLogs(prev => [
                  ...prev,
                  { text: `[BLYNK HARDWARE ${target.isTls ? 'TLS' : 'TCP'}] ✅ Hardware Connected & Online 🟢 on ${target.host}:${target.port} Blynk Console!`, type: 'stdout' }
                ]);
                setBlynkStatus('online');
              }

              if (rawStr.includes('vw') || hexStr.includes('7677')) {
                const matches = rawStr.match(/vw\x00(\d+)\x00([^\x00]+)/g) ||
                                rawStr.match(/vw[,\s]+(\d+)[,\s]+([^\s,]+)/g);
                if (matches) {
                  matches.forEach((m: string) => {
                    const parts = m.split(/[\x00,\s]+/);
                    if (parts.length >= 3) {
                      const vpin = `V${parts[1]}`;
                      const val = Number(parts[2]);
                      setTerminalLogs(prev => [
                        ...prev,
                        { text: `[BLYNK REAL-TIME 📱] Mobile App trigger via Hardware ${target.isTls ? 'TLS' : 'TCP'} (${target.host}:${target.port}): ${vpin} = ${val}`, type: 'stdout' }
                      ]);
                      handleBlynkVirtualWrite(vpin, val);
                    }
                  });
                }
              }
            } catch (err) {}
          });

          socket.on('error', (_err: any) => {
            clearInterval(pingInterval);
          });
        });
      } catch (err) {
        console.warn("Blynk TCP/TLS init error:", err);
      }
    }

    // Close any previous WebSocket
    if (blynkWsRef.current) {
      try { blynkWsRef.current.close(); } catch (e) {}
      blynkWsRef.current = null;
    }

    // Initialize Real WebSocket Connection to blynk.cloud
    // This WebSocket handshake causes blynk.cloud to set Device Status to ONLINE 🟢 on Blynk App!
    try {
      const wsUrl = `wss://blynk.cloud/external/api/ws?token=${cleanAuth}`;
      const ws = new WebSocket(wsUrl);
      blynkWsRef.current = ws;

      ws.onopen = () => {
        setTerminalLogs(prev => [
          ...prev,
          { text: `[BLYNK CLOUD] ✅ WebSocket Connected to REAL Blynk Cloud! Device Status on Blynk Console: ONLINE 🟢`, type: 'stdout' }
        ]);
        setBlynkStatus('online');

        // Query initial V0 pin state from blynk.cloud to prevent LED glowing prematurely
        fetch(`https://blynk.cloud/external/api/get?token=${cleanAuth}&v0`)
          .then(res => res.text())
          .then(valText => {
            const rawVal = valText.trim();
            const initialVal = rawVal === '1' ? 1 : 0;
            lastRealBlynkValuesRef.current['V0'] = initialVal;
            handleBlynkVirtualWrite('V0', initialVal);
          })
          .catch(() => {});
      };

      ws.onmessage = (event) => {
        try {
          const msgData = String(event.data || '');
          let vpin = '';
          let val = 0;
          
          if (msgData.includes('vw')) {
            const match = msgData.match(/["']?vw["']?\s*,\s*["']?(\d+)["']?\s*,\s*["']?([^"'\],]+)["']?/i) ||
                          msgData.match(/vw\s+(\d+)\s+(.+)/i);
            if (match) {
              vpin = `V${match[1]}`;
              val = Number(match[2]);
            }
          }

          if (vpin) {
            setTerminalLogs(prev => [
              ...prev,
              { text: `[BLYNK REAL-TIME 📱] Real Phone App trigger from blynk.cloud: ${vpin} = ${val}`, type: 'stdout' }
            ]);
            handleBlynkVirtualWrite(vpin, val);
          }
        } catch (err) {}
      };

      ws.onerror = (err) => {
        console.warn("Blynk WS error:", err);
      };

      ws.onclose = () => {
        setBlynkStatus('offline');
      };
    } catch (wsErr) {
      console.warn("Blynk WS init error:", wsErr);
    }

    if (blynkPollingTimerRef.current) {
      clearInterval(blynkPollingTimerRef.current);
    }

    const vpinsToPoll = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5'];
    const servers = ['https://blynk.cloud', 'https://sgp1.blynk.cloud'];

    blynkPollingTimerRef.current = setInterval(async () => {
      if (!isRunningRef.current || blynkAuthTokenRef.current !== cleanAuth) {
        if (blynkPollingTimerRef.current) clearInterval(blynkPollingTimerRef.current);
        return;
      }

      for (const srv of servers) {
        for (const vp of vpinsToPoll) {
          try {
            const response = await fetch(`${srv}/external/api/get?token=${cleanAuth}&${vp}`);
            if (response.ok) {
              const rawText = (await response.text()).trim();
              if (rawText && !rawText.includes('error') && !rawText.includes('Invalid')) {
                setBlynkStatus('online');
                const numVal = Number(rawText);
                const val = isNaN(numVal) ? rawText : numVal;
                const upperVpin = vp.toUpperCase();
                
                const prevVal = lastRealBlynkValuesRef.current[upperVpin];
                if (prevVal !== undefined && prevVal !== val) {
                  setTerminalLogs(prev => [
                    ...prev,
                    { text: `[BLYNK REAL-TIME 📱] Phone App event from ${srv.replace('https://', '')}: ${upperVpin} = ${val}`, type: 'stdout' }
                  ]);
                  handleBlynkVirtualWrite(upperVpin, Number(val));
                }
                lastRealBlynkValuesRef.current[upperVpin] = val;
              }
            }
          } catch (e) {}
        }
      }
    }, 400);
  };

  const pinStatesRef = useRef(pinStates);
  useEffect(() => {
    pinStatesRef.current = pinStates;
  }, [pinStates]);


  const handlePinStateChange = (pin: string, state: 'HIGH' | 'LOW' | number) => {
    pinStatesRef.current[pin] = state;
    setPinStates(prev => ({ ...prev, [pin]: state }));
  };

  const parseProgramPins = (codeText: string): ProgramPinConfig => {
    const config: ProgramPinConfig = {};
    const codeLines = codeText.split('\n');
    const vars: { [key: string]: string } = {};

    // First pass: extract all const/variable assignments
    codeLines.forEach(line => {
      let clean = line;
      if (clean.includes('//')) clean = clean.split('//')[0];
      if (clean.includes('#')) clean = clean.split('#')[0];
      const trimmed = clean.trim();
      
      const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/) ||
                          trimmed.match(/^(?:const\s+)?(?:int|float|double|char\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*);$/);
      if (assignMatch) {
        vars[assignMatch[1].trim()] = assignMatch[2].replace(/;$/, '').trim();
      }
    });

    // Helper to resolve variable or direct value to clean pin string (e.g. 'A0' -> '0', 'D9' -> '9', 'P0' -> '0')
    const resolvePin = (p: string): string => {
      let val = p.trim();
      if (vars[val] !== undefined) {
        val = vars[val];
      }
      // Remove 'D', 'A', or 'P' prefixes followed by digits or quotes
      val = val.replace(/['"]/g, '');
      if (/^[ADP]\d+$/.test(val)) {
        return val.substring(1);
      }
      return val;
    };

    // Second pass: detect pin usage
    codeLines.forEach(line => {
      let clean = line;
      if (clean.includes('//')) clean = clean.split('//')[0];
      if (clean.includes('#')) clean = clean.split('#')[0];
      const trimmed = clean.trim();
      
      // 1. LED Pin: look for digitalWrite/analogWrite
      const ledMatch = trimmed.match(/(?:digitalWrite|analogWrite|digital_write|analog_write)\(\s*([a-zA-Z0-9_]+)/) ||
                       trimmed.match(/microbit\.pin(\d+)\.write_digital/) ||
                       trimmed.match(/pins\.digitalWrite\(\s*"(P\d+)"/) ||
                       trimmed.match(/microbit\.pin(\d+)\.write_analog/) ||
                       trimmed.match(/pins\.analogWrite\(\s*"(P\d+)"/);
      if (ledMatch) {
        config.ledPin = resolvePin(ledMatch[1]);
      }

      // 2. Servo Pin
      const servoMatch = trimmed.match(/(?:servoWrite|servo_write)\(\s*([a-zA-Z0-9_]+)/) ||
                         trimmed.match(/([a-zA-Z0-9_]+)\.attach\(\s*([a-zA-Z0-9_]+)/) ||
                         trimmed.match(/pins\.servoWrite\(\s*"(P\d+)"/) ||
                         trimmed.match(/pin(\d+)_servo\s*=\s*True/) ||
                         trimmed.match(/pin(\d+)\.set_analog_period\(\s*20\s*\)/);
      if (servoMatch) {
        config.servoPin = resolvePin(servoMatch[2] || servoMatch[1]);
      }

      // 3. Potentiometer Pin
      const potMatch = trimmed.match(/(?:analogRead|analog_read)\(\s*([a-zA-Z0-9_]+)/) ||
                       trimmed.match(/microbit\.pin(\d+)\.read_analog/) ||
                       trimmed.match(/pins\.analogRead\(\s*"(P\d+)"/);
      if (potMatch) {
        config.potPin = resolvePin(potMatch[1]);
      }

      // 4. Button Pin
      const btnMatch = trimmed.match(/(?:digitalRead|digital_read)\(\s*([a-zA-Z0-9_]+)/) ||
                       trimmed.match(/microbit\.pin(\d+)\.read_digital/) ||
                       trimmed.match(/pins\.digitalRead\(\s*"(P\d+)"/);
      if (btnMatch) {
        config.btnPin = resolvePin(btnMatch[1]);
      }

      // 5. Ultrasonic Pins (Trig & Echo)
      const ultraMatch = trimmed.match(/(?:readUltrasonic|read_ultrasonic|readDistance)\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)/);
      if (ultraMatch) {
        config.ultrasonicTrigPin = resolvePin(ultraMatch[1]);
        config.ultrasonicEchoPin = resolvePin(ultraMatch[2]);
      }
    });

    return config;
  };

  const programPins = useMemo(() => parseProgramPins(simFiles[simActiveFile] || ''), [simFiles, simActiveFile]);
  const simulationTimeouts = useRef<any[]>([]);
  const [activeLoopPrints, setActiveLoopPrints] = useState<string[]>([]);
  const [hasLoop, setHasLoop] = useState<boolean>(false);
  const [loopLimit, setLoopLimit] = useState<number>(Infinity);
  
  // Popovers state for actions bar (kept for future use)
  const [_showCameraPopover, _setShowCameraPopover] = useState(false);
  const [_showDevicePopover, _setShowDevicePopover] = useState(false);
  const [_showActionsPopover, _setShowActionsPopover] = useState(false);

  const clearSimulationTimeouts = () => {
    simulationTimeouts.current.forEach(t => clearTimeout(t));
    simulationTimeouts.current = [];
  };
  
  // ============================================================================
  // PANDUAN DETEKSI KEBUTUHAN FITUR (KAMERA & TELEMETRI):
  // 1. Kamera AI Vision: Aktif jika kode Python mengimpor/menggunakan 'cv2', 'yolo', 
  //    'camera', 'detect_object', atau 'ai_detect'.
  // 2. Telemetry Dashboard: Aktif jika kode Python mengimpor/menggunakan 'robot', 
  //    'robolab', 'sensor', 'telemetry', 'dht', 'mpu', atau 'ultrasonic'.
  // ============================================================================
  const activePythonFile = Object.keys(files).find(f => f.endsWith('.py')) || 'python/main.py';
  const activePythonCode = files[activePythonFile] || '';
  const activeCode = files[activeFile] || '';
  const simActivePythonFile = Object.keys(simFiles).find(f => f.endsWith('.py')) || 'python/sim_main.py';
  const simActivePythonCode = simFiles[simActivePythonFile] || '';
  const simActiveCode = simBoard === 'BBC micro:bit' ? simActivePythonCode : (simFiles[simActiveFile] || '');
  const codeUpper = activeCode.toUpperCase();
  void codeUpper; // referenced dynamically in runtime checks

  // Telemetry dashboard has been removed as per architectural upgrade plan

  const [buildProgress, setBuildProgress] = useState(0);
  const [buildStatusText, setBuildStatusText] = useState('');
  const [terminalTab, setTerminalTab] = useState<'serial' | 'terminal' | 'problems' | 'ai'>('serial');
  const [terminalLogs, setTerminalLogs] = useState<Array<{ text: string, type: 'info' | 'error' | 'success' | 'stdout' }>>([
    { text: 'RoboLab Studio IDE Initialized.', type: 'info' },
    { text: 'Device ESP32 connected to COM4 at 115200 baud.', type: 'success' }
  ]);

  // Dynamic sensor state for circuit components & telemetry
  const [sensorData, setSensorData] = useState({ 
    distance: 42, 
    temp: 28.4, 
    humidity: 65.0, 
    battery: 94, 
    accelX: 0, 
    accelY: 0, 
    accelZ: 0, 
    gesture: 'none',
    rfidCardPresent: false,
    rfidUid: '53 7A 92 1F'
  });
  const sensorDataRef = useRef(sensorData);
  useEffect(() => {
    sensorDataRef.current = sensorData;
  }, [sensorData]);

  // Layout Collapse state controls (Task 4)
  const [isBlocklyCollapsed, setIsBlocklyCollapsed] = useState(false);
  const [isEditorCollapsed, setIsEditorCollapsed] = useState(false);
  const [_isSimulatorCollapsed, _setIsSimulatorCollapsed] = useState(false);
  const [isSimulatorExpanded, setIsSimulatorExpanded] = useState(false);
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);


  const [splitRatio, setSplitRatio] = useState(50);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [isResizingSplit, setIsResizingSplit] = useState(false);
  const [isResizingTerminal, setIsResizingTerminal] = useState(false);
  const [_simulatorWidth, setSimulatorWidth] = useState(340);
  const [isResizingSimulator, setIsResizingSimulator] = useState(false);
  const [projectPath, setProjectPath] = useState<string>('');
  
  // Responsive screen checker (only stack vertically on small phone screens < 640px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    setIsMobile(mql.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSimulatorExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Interactive Terminal State (Task 3)
  const [terminalInput, setTerminalInput] = useState('');
  const [interactiveTerminalLogs, setInteractiveTerminalLogs] = useState<Array<{ text: string, type: 'input' | 'output' | 'error' | 'success' }>>([
    { text: 'RoboLab CMD v1.0.0 - Sandboxed Terminal', type: 'success' },
    { text: 'Ketik "help" untuk melihat daftar perintah tersedia.', type: 'output' }
  ]);

  const handleCloseFolder = () => {
    setFiles({});
    setSavedFiles({});
    setActiveFile('');
    setFilePaths({});
    setProjectName(null);
    setProjectPath('');
    localStorage.removeItem('robolab_files');
    localStorage.removeItem('robolab_savedFiles');
    localStorage.removeItem('robolab_activeFile');
    localStorage.removeItem('robolab_project_name');
    setTerminalLogs(prev => [...prev, { text: '✓ Folder proyek ditutup.', type: 'info' }]);
  };

  const handleCloseFile = (filenameToClose: string) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[filenameToClose];
      return next;
    });
    setSavedFiles(prev => {
      const next = { ...prev };
      delete next[filenameToClose];
      return next;
    });
    setFilePaths(prev => {
      const next = { ...prev };
      delete next[filenameToClose];
      return next;
    });
    setWorkspaceXmls(prev => {
      const next = { ...prev };
      delete next[filenameToClose];
      return next;
    });
    
    if (activeFile === filenameToClose) {
      setActiveFile('');
    }
    setTerminalLogs(prev => [...prev, { text: `✓ Berkas '${filenameToClose}' ditutup.`, type: 'info' }]);
  };

  const handleCreateFile = async () => {
    setShowExplorer(true);
    if (activeFile.endsWith('.py') || board === 'BBC micro:bit') {
      setNewFileType('py');
    } else {
      setNewFileType('ino');
    }
    setNewFileName('');
    setShowNewFileModal(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const name = droppedFile.name;
      const extension = name.split('.').pop()?.toLowerCase();
      
      if (['ino', 'c', 'h', 'cpp', 'hpp', 'py', 'hex', 'json', 'md', 'txt'].includes(extension || '')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string || '';
          const absolutePath = (droppedFile as any).path || '';
          if (absolutePath) {
            setFilePaths(prev => ({ ...prev, [name]: absolutePath }));
          }
          handleOpenFileAction(name, content, absolutePath);
        };
        reader.readAsText(droppedFile);
      } else {
        setTerminalLogs(prev => [...prev, { text: `❌ Format file '${name}' tidak didukung.`, type: 'error' }]);
      }
    }
  };

  const handleOpenFileAction = (filename: string, content: string, _absolutePath?: string) => {
    setShowExplorer(true);
    const baseName = filename.split('/').pop()?.replace(/\.[^.]+$/, '') || 'PROYEK';
    setProjectName(baseName.toUpperCase());
    const extension = filename.split('.').pop()?.toLowerCase();
    
    let updatedFiles: { [key: string]: string } = {};
    let updatedXmls: { [key: string]: string } = {};
    const pyFilename = (filename === 'firmware/main.ino' || filename === 'python/main.py' || extension === 'hex') ? 'python/main.py' : filename.replace(/\.(ino|hex|cpp|c)$/i, '.py');
    const inoFilename = (filename === 'firmware/main.ino' || filename === 'python/main.py' || extension === 'hex') ? 'firmware/main.ino' : filename.replace(/\.py$/i, '.ino');
    
    let detectedBoard: 'Arduino Uno' | 'ESP32 DevKit V1' | 'BBC micro:bit' | null = null;

    if (extension === 'hex') {
      const parsedHex = parseRoboLabBlockHex(content);
      let xml = parsedHex.xml;
      const inoCode = parsedHex.ino || files[inoFilename] || 'void setup() {\n}\n\nvoid loop() {\n}\n';
      const pyCode = parsedHex.py || files[pyFilename] || '# RoboLab Studio - Auto Synced Python\n';

      if (!xml || !xml.includes('<block')) {
        try {
          xml = arduinoToBlocklyXml(inoCode);
        } catch (err) {
          console.warn("Failed to parse fallback XML from HEX:", err);
        }
      }

      updatedFiles[inoFilename] = inoCode;
      updatedFiles[pyFilename] = pyCode;

      if (xml && xml.includes('<block')) {
        updatedXmls[filename] = xml;
        updatedXmls[inoFilename] = xml;
        updatedXmls[pyFilename] = xml;
      }

      // Enable block sync so BlocklyEditor loads the XML blocks and automatically generates/syncs both Arduino (.ino) and Python (.py)
      setSyncStatuses(prev => ({
        ...prev,
        [filename]: true,
        [inoFilename]: true,
        [pyFilename]: true,
      }));

      // Also sync into Simulator workspace so blocks are ready if user is in or switches to Simulator
      if (xml && xml.includes('<block')) {
        setSimWorkspaceXmls(prev => ({
          ...prev,
          'firmware/main.ino': xml,
          'python/main.py': xml,
        }));
        setSimSyncStatuses(prev => ({
          ...prev,
          'firmware/main.ino': true,
          'python/main.py': true,
        }));
        setSimFiles(prev => ({
          ...prev,
          ...(parsedHex.ino ? { 'firmware/main.ino': parsedHex.ino } : {}),
          ...(parsedHex.py ? { 'python/main.py': parsedHex.py } : {}),
        }));
        setSimResetKey(prev => prev + 1);
      }

      if (parsedHex.board === 'Arduino Uno' || parsedHex.board === 'ESP32 DevKit V1' || parsedHex.board === 'BBC micro:bit') {
        detectedBoard = parsedHex.board;
      } else if (filename.toLowerCase().includes('esp32')) {
        detectedBoard = 'ESP32 DevKit V1';
      } else if (filename.toLowerCase().includes('microbit') || filename.toLowerCase().includes('soccer')) {
        detectedBoard = 'BBC micro:bit';
      }

      setIsBlocklyCollapsed(false);
      setIsEditorCollapsed(false);
      setTerminalLogs(prev => [
        ...prev,
        { text: `✓ Block HEX '${filename}' dimuat. Blok visual serta kode Arduino & Python otomatis disesuaikan.`, type: 'success' }
      ]);
    }
    else if (extension === 'ino' || ((extension === 'cpp' || extension === 'c') && /void\s+(setup|loop)\s*\(/.test(content))) {
      updatedFiles[filename] = content;
      let xml = '';
      try {
        xml = arduinoToBlocklyXml(content);
      } catch (err) {
        console.warn("Failed to parse Arduino to Blockly XML:", err);
      }
      if (xml && xml.includes('<block')) {
        updatedXmls[filename] = xml;
        updatedXmls[inoFilename] = xml;
        updatedXmls[pyFilename] = xml;
        setSyncStatuses(prev => ({ ...prev, [filename]: true, [inoFilename]: true, [pyFilename]: true }));
      } else {
        setSyncStatuses(prev => ({ ...prev, [filename]: false, [inoFilename]: false, [pyFilename]: false }));
      }
      setIsBlocklyCollapsed(false);
      setIsEditorCollapsed(false);
    }
    else if (extension === 'py') {
      updatedFiles[filename] = content;
      let xml = '';
      try {
        xml = pythonToBlocklyXml(content);
      } catch (err) {
        console.warn("Failed to parse Python to Blockly XML:", err);
      }
      if (xml && xml.includes('<block')) {
        updatedXmls[filename] = xml;
        updatedXmls[pyFilename] = xml;
        updatedXmls[inoFilename] = xml;
        setSyncStatuses(prev => ({ ...prev, [filename]: true, [pyFilename]: true, [inoFilename]: true }));
      } else {
        setSyncStatuses(prev => ({ ...prev, [filename]: false, [pyFilename]: false, [inoFilename]: false }));
      }
      setIsBlocklyCollapsed(false);
      setIsEditorCollapsed(false);
    } else {
      updatedFiles[filename] = content;
      setIsEditorCollapsed(false);
    }

    // Auto-detect board target based on analog pin usage or metadata
    if (!detectedBoard && (extension === 'ino' || extension === 'py')) {
      const hasEsp32Pins = /\b(32|33|34|35|36|39)\b/.test(content);
      const hasAnalogRead = /analogRead|analog_read/i.test(content);
      if (hasEsp32Pins && hasAnalogRead) {
        detectedBoard = 'ESP32 DevKit V1';
      } else if (/A0|A1|A2|A3|A4|A5/i.test(content) && hasAnalogRead) {
        detectedBoard = 'Arduino Uno';
      }
    }

    if (detectedBoard) {
      setBoard(detectedBoard);
      setTerminalLogs(prev => [...prev, { text: `ℹ Board target otomatis beralih ke: ${detectedBoard}`, type: 'info' }]);
    }

    setFiles(prev => ({ ...prev, ...updatedFiles }));
    setWorkspaceXmls(prev => ({ ...prev, ...updatedXmls }));
    setLearningLessonLoadedCount(prev => prev + 1);
    
    if (['c', 'h', 'cpp', 'hpp', 'json', 'txt', 'md'].includes(extension || '') && !updatedXmls[filename]) {
      setWorkspaceMode('code');
      if (uiMode === 'student') {
        setStudentSubMode('code');
      }
    } else {
      if (workspaceMode === 'blockly' || workspaceMode === 'code') {
        setWorkspaceMode('split');
      }
      if (uiMode === 'student') {
        setUiMode('pro');
      }
    }

    // Redirect .hex active view to firmware/main.ino (or python/main.py for micro:bit)
    const activeFileToSet = extension === 'hex'
      ? (detectedBoard === 'BBC micro:bit' ? pyFilename : inoFilename)
      : filename;
    setActiveFile(activeFileToSet);
    if (currentTab !== 'simulator') {
      setCurrentTab('ide');
    }
  };

  const handleFileSelect = (filename: string, explicitFilesMap?: { [key: string]: string }) => {
    const sourceFiles = explicitFilesMap || files;
    const content = sourceFiles[filename] || '';
    
    const extension = filename.split('.').pop()?.toLowerCase();
    let updatedFiles: { [key: string]: string } = {};
    let updatedXmls: { [key: string]: string } = {};
    const pyFilename = (filename === 'firmware/main.ino' || filename === 'python/main.py' || extension === 'hex') ? 'python/main.py' : filename.replace(/\.(ino|hex|cpp|c)$/i, '.py');
    const inoFilename = (filename === 'firmware/main.ino' || filename === 'python/main.py' || extension === 'hex') ? 'firmware/main.ino' : filename.replace(/\.py$/i, '.ino');
    const existingSharedXml = workspaceXmls[filename] || workspaceXmls[inoFilename] || workspaceXmls[pyFilename] || '';
    
    if (extension === 'ino') {
      let xml = existingSharedXml;
      // Only re-parse from text code if sync is manual (false) or if no valid XML exists yet
      if ((syncStatuses[filename] === false || !xml.includes('<block') || explicitFilesMap) && content.trim()) {
        try {
          const parsedXml = arduinoToBlocklyXml(content);
          if (parsedXml && parsedXml.includes('<block')) {
            xml = parsedXml;
            updatedXmls[filename] = parsedXml;
            updatedXmls[inoFilename] = parsedXml;
            updatedXmls[pyFilename] = parsedXml;
          }
        } catch (e) {
          console.warn("Failed to parse Arduino to Blockly XML on select:", e);
        }
      } else if (xml.includes('<block') && !workspaceXmls[filename]) {
        updatedXmls[filename] = xml;
      }

      const effectiveXml = updatedXmls[filename] || xml || '';
      if (!effectiveXml.includes('<block') && content.trim().length > 0) {
        setSyncStatuses(prev => ({ ...prev, [filename]: false }));
      }
    }
    else if (extension === 'hex') {
      const parsedHex = parseRoboLabBlockHex(content);
      const xml = parsedHex.xml || existingSharedXml;
      if (xml && xml.includes('<block')) {
        updatedXmls[filename] = xml;
        updatedXmls[inoFilename] = xml;
        updatedXmls[pyFilename] = xml;
      }
      if (parsedHex.ino) updatedFiles[inoFilename] = parsedHex.ino;
      if (parsedHex.py) updatedFiles[pyFilename] = parsedHex.py;
      setSyncStatuses(prev => ({ ...prev, [filename]: true, [inoFilename]: true, [pyFilename]: true }));
    }
    else if (extension === 'py') {
      let xml = existingSharedXml;
      // Do NOT overwrite existing synced blocks when switching to the Python tab
      if ((syncStatuses[filename] === false || !xml.includes('<block') || explicitFilesMap) && content.trim()) {
        try {
          const parsedXml = pythonToBlocklyXml(content);
          if (parsedXml && parsedXml.includes('<block')) {
            xml = parsedXml;
            updatedXmls[filename] = parsedXml;
            updatedXmls[pyFilename] = parsedXml;
            updatedXmls[inoFilename] = parsedXml;
          }
        } catch (e) {
          console.warn("Failed to parse Python to Blockly XML on select:", e);
        }
      } else if (xml.includes('<block') && !workspaceXmls[filename]) {
        updatedXmls[filename] = xml;
      }
    }

    // Auto-detect board target based on analog pin usage or metadata
    let detectedBoard: 'Arduino Uno' | 'ESP32 DevKit V1' | 'BBC micro:bit' | null = null;
    if (extension === 'ino' || extension === 'py') {
      const hasEsp32Pins = /\b(32|33|34|35|36|39)\b/.test(content);
      const hasAnalogRead = /analogRead|analog_read/i.test(content);
      if (hasEsp32Pins && hasAnalogRead) {
        detectedBoard = 'ESP32 DevKit V1';
      } else if (/A0|A1|A2|A3|A4|A5/i.test(content) && hasAnalogRead) {
        detectedBoard = 'Arduino Uno';
      }
    } else if (extension === 'hex') {
      if (filename.toLowerCase().includes('esp32')) {
        detectedBoard = 'ESP32 DevKit V1';
      } else if (filename.toLowerCase().includes('microbit') || filename.toLowerCase().includes('soccer')) {
        detectedBoard = 'BBC micro:bit';
      } else {
        detectedBoard = 'Arduino Uno';
      }
    }
    if (detectedBoard) {
      setBoard(detectedBoard);
    }

    if (Object.keys(updatedFiles).length > 0 || Object.keys(updatedXmls).length > 0) {
      if (Object.keys(updatedFiles).length > 0) {
        setFiles(prev => ({ ...prev, ...updatedFiles }));
      }
      if (Object.keys(updatedXmls).length > 0) {
        setWorkspaceXmls(prev => ({ ...prev, ...updatedXmls }));
      }
    }
    
    setIsEditorCollapsed(false);
    // Auto-switch to 'code' view mode if selecting a non-Blockly code/header file (.c, .h, .cpp, .hpp, .json, .txt, .md) while in 'blockly' mode
    if (['c', 'h', 'cpp', 'hpp', 'json', 'txt', 'md'].includes(extension || '')) {
      if (workspaceMode === 'blockly') {
        setWorkspaceMode('code');
      }
    } else if (workspaceMode === 'blockly') {
      setWorkspaceMode('split');
    }

    const activeFileToSet = extension === 'hex' ? inoFilename : filename;
    setActiveFile(activeFileToSet);
  };

  const handleNativeOpenFolder = async () => {
    setShowExplorer(true);
    const buildFolderXmlsAndSync = (rawFiles: { [key: string]: string }) => {
      const cleanedFiles: { [key: string]: string } = {};
      const generatedXmls: { [key: string]: string } = {};
      const newSyncs: { [key: string]: boolean } = {};

      Object.keys(rawFiles).forEach(f => {
        if (f.endsWith('.xml')) return;
        cleanedFiles[f] = rawFiles[f];
      });

      Object.keys(cleanedFiles).forEach(f => {
        const ext = f.split('.').pop()?.toLowerCase();
        const code = cleanedFiles[f] || '';
        if (ext === 'ino') {
          try {
            const xml = arduinoToBlocklyXml(code);
            if (xml && xml.includes('<block')) {
              generatedXmls[f] = xml;
            }
          } catch (_) {}
          newSyncs[f] = false;
        } else if (ext === 'py') {
          try {
            const xml = pythonToBlocklyXml(code);
            if (xml && xml.includes('<block')) {
              generatedXmls[f] = xml;
            }
          } catch (_) {}
          newSyncs[f] = false;
        }
      });

      return { cleanedFiles, generatedXmls, newSyncs };
    };

    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const electron = req('electron');
        const folder = await electron.ipcRenderer.invoke('open-directory');
        if (folder) {
          const { cleanedFiles, generatedXmls, newSyncs } = buildFolderXmlsAndSync(folder.files || {});
          const folderPath = folder.path || '';
          
          const paths: { [key: string]: string } = {};
          Object.keys(cleanedFiles).forEach(f => {
            paths[f] = folderPath ? `${folderPath}/${f}` : f;
          });
          setFilePaths(paths);
          setWorkspaceXmls(generatedXmls);
          setSyncStatuses(newSyncs);
          setFiles(cleanedFiles);
          setProjectPath(folderPath);
          setProjectName(folder.name);
          setIsBlocklyCollapsed(false);
          setIsEditorCollapsed(false);
          if (workspaceMode === 'blockly') setWorkspaceMode('split');
          if (uiMode === 'student') setUiMode('pro');

          const fileKeys = Object.keys(cleanedFiles);
          const firstFile = fileKeys.find(f => f.endsWith('.ino') || f.endsWith('.py')) || fileKeys[0];
          if (firstFile) {
            handleFileSelect(firstFile, cleanedFiles);
          }
          setLearningLessonLoadedCount(prev => prev + 1);
          setCurrentTab('ide');
          setTerminalLogs(prev => [
            ...prev,
            { text: `Successfully loaded folder: ${folder.name}`, type: 'success' }
          ]);
        }
      } catch (err) {
        console.error("IPC open-directory error", err);
      }
    } else {
      // Web Browser Mode — File System Access API / webkitdirectory
      const webFolder = await openFolderInBrowser();
      if (webFolder && Object.keys(webFolder.files).length > 0) {
        const { cleanedFiles, generatedXmls, newSyncs } = buildFolderXmlsAndSync(webFolder.files);
        setWorkspaceXmls(generatedXmls);
        setSyncStatuses(newSyncs);
        setFiles(cleanedFiles);
        setProjectName(webFolder.name);
        setIsBlocklyCollapsed(false);
        setIsEditorCollapsed(false);
        if (workspaceMode === 'blockly') setWorkspaceMode('split');
        if (uiMode === 'student') setUiMode('pro');

        const fileKeys = Object.keys(cleanedFiles);
        const firstFile = fileKeys.find(f => f.endsWith('.ino') || f.endsWith('.py')) || fileKeys[0];
        if (firstFile) {
          handleFileSelect(firstFile, cleanedFiles);
        }
        setLearningLessonLoadedCount(prev => prev + 1);
        setCurrentTab('ide');
        setTerminalLogs(prev => [
          ...prev,
          { text: `✓ Folder '${webFolder.name}' berhasil dibuka di browser (${Object.keys(cleanedFiles).length} berkas).`, type: 'success' }
        ]);
      }
    }
  };

  const handleNativeOpenFile = async () => {
    setShowExplorer(true);
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const electron = req('electron');
        const file = await electron.ipcRenderer.invoke('open-file');
        if (file) {
          if (file.path) {
            setFilePaths(prev => ({ ...prev, [file.name]: file.path }));
          }
          handleOpenFileAction(file.name, file.content, file.path);
        }
      } catch (err) {
        console.error("IPC open-file error", err);
      }
    } else {
      // Web Browser Mode — File System Access API / <input type="file">
      const webFile = await openFileInBrowser();
      if (webFile) {
        handleOpenFileAction(webFile.name, webFile.content);
      }
    }
  };

  const handleImportZipLibrary = async () => {
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      try {
        const electron = req('electron');
        const res = await electron.ipcRenderer.invoke('install-lib-from-zip', { userId: authUser?.id });
        if (res && res.success) {
          const installedName = res.libName || 'Custom_ZIP_Library';
          setPackages((prev: any) => ({
            ...prev,
            arduino: [
              ...prev.arduino.filter((p: any) => p.name.toLowerCase() !== installedName.toLowerCase()),
              {
                name: installedName,
                desc: `ZIP Library terpasang di akun Anda`,
                version: '1.0.0-custom',
                author: authUser?.name || 'Akun Anda',
                installed: true,
                isCustom: true,
                userId: authUser?.id
              }
            ]
          }));
          if (authUser?.id) {
            saveUserCustomLibrary(authUser.id, {
              name: installedName,
              source_type: 'zip',
              version: '1.0.0-custom',
              headers: res.headers || []
            });
          }
          setTerminalLogs((prev: any) => [
            ...prev,
            { text: `[ZIP IMPORT] Library '${installedName}' berhasil diekstrak dan diinstal ke akun Anda!`, type: 'success' }
          ]);
          syncInstalledLibraries();
        }
      } catch (e: any) {
        console.warn('ZIP Import error:', e);
      }
    } else {
      const input = prompt("Nama Pustaka Arduino (.zip):", "Adafruit_MPU6050.zip");
      if (!input) return;
      setPackages((prev: any) => ({
        ...prev,
        arduino: [
          ...prev.arduino,
          {
            name: input.replace('.zip', ''),
            desc: `ZIP Library imported from local file: ${input}`,
            version: '1.0.0-custom',
            installed: true,
            isCustom: true
          }
        ]
      }));
    }
  };

  const handleTerminalCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const cmdParts = cmd.split(' ');
    const mainCmd = cmdParts[0].toLowerCase();
    const cmdLower = cmd.toLowerCase();
    const displayPath = projectPath || 'C:\\Users\\hp\\Downloads\\robolab-studio';
    
    setInteractiveTerminalLogs(prev => [
      ...prev,
      { text: `${displayPath}> ${cmd}`, type: 'input' }
    ]);

    setTerminalInput('');

    // SANDBOX SIMULATED TERMINAL (No native OS spawning, lightweight and 100% reliable)
    setTimeout(() => {
      if (mainCmd === 'help') {
        setInteractiveTerminalLogs(prev => [
          ...prev,
          { text: 'RoboLab Studio Sandboxed Terminal v0.0.1', type: 'success' },
          { text: 'Available simulated commands:', type: 'output' },
          { text: '  python python/main.py   - Runs the AI computer vision script', type: 'output' },
          { text: '  pip install <package>   - Installs a custom Python library', type: 'output' },
          { text: '  arduino-cli compile     - Verifies and compiles the Arduino code', type: 'output' },
          { text: '  arduino-cli upload      - Uploads compiled sketch to ESP32 board', type: 'output' },
          { text: '  ls / dir                - Lists current project files', type: 'output' },
          { text: '  clear / cls             - Clears terminal output', type: 'output' }
        ]);
      } else if (mainCmd === 'clear' || mainCmd === 'cls') {
        setInteractiveTerminalLogs([]);
      } else if (mainCmd === 'ls' || mainCmd === 'dir') {
        const fileList = Object.keys(files).join('    ');
        setInteractiveTerminalLogs(prev => [
          ...prev,
          { text: ` Directory of ${displayPath}`, type: 'output' },
          { text: '', type: 'output' },
          { text: fileList, type: 'output' },
          { text: '', type: 'output' },
          { text: `               ${Object.keys(files).length} File(s)`, type: 'output' }
        ]);
      } else if (cmdLower.startsWith('pip install ')) {
        const pkg = cmd.substring(12).trim();
        if (!pkg) {
          setInteractiveTerminalLogs((prev: any) => [...prev, { text: 'Error: package name missing.', type: 'error' }]);
          return;
        }
        setInteractiveTerminalLogs((prev: any) => [
          ...prev,
          { text: `Collecting ${pkg}...`, type: 'output' },
          { text: `  Downloading ${pkg}-2.1.4-py3-none-any.whl (142 kB)...`, type: 'output' },
          { text: `Installing collected packages: ${pkg}`, type: 'output' },
          { text: `Successfully installed ${pkg}-2.1.4`, type: 'success' }
        ]);

        setPackages((prev: any) => ({
          ...prev,
          python: prev.python.some((p: any) => p.name === pkg)
            ? prev.python.map((p: any) => p.name === pkg ? { ...p, installed: true } : p)
            : [...prev.python, { name: pkg, desc: 'User-installed Python pip package', version: '2.1.4', installed: true }]
        }));
      } else if (cmdLower.startsWith('python') || cmdLower === 'run') {
        handleRunPython();
      } else if (cmdLower.startsWith('arduino-cli compile') || cmdLower.startsWith('arduino-cli verify')) {
        setInteractiveTerminalLogs(prev => [
          ...prev,
          { text: 'Compiling sketch using arduino-cli...', type: 'output' },
          { text: 'xtensa-esp32-elf-g++ -c -g -Os -w -nostdlib', type: 'output' },
          { text: 'Sketch uses 234102 bytes (17%) of program storage space. Maximum is 1310720 bytes.', type: 'success' }
        ]);
      } else if (cmdLower.startsWith('arduino-cli upload')) {
        setInteractiveTerminalLogs(prev => [
          ...prev,
          { text: 'Uploading binary to ESP32 on COM4...', type: 'output' },
          { text: 'esptool.py v4.5.1', type: 'output' },
          { text: 'Serial port COM4', type: 'output' },
          { text: 'Connecting....', type: 'output' },
          { text: 'Chip is ESP32-D0WDQ6-V3 (revision v3.0)', type: 'output' },
          { text: 'Writing at 0x00010000... (100%)', type: 'output' },
          { text: 'Hash of data verified.', type: 'output' },
          { text: 'Leaving... Hard resetting via RTS pin...', type: 'output' },
          { text: 'Upload successful!', type: 'success' }
        ]);
      } else {
        setInteractiveTerminalLogs(prev => [
          ...prev,
          { text: `'${cmd}' is not recognized as an internal or external command. Type 'help' for info.`, type: 'error' }
        ]);
      }
    }, 150);
  };

  const [robotCommand, setRobotCommand] = useState('STOP');

  // Gamification STEM matching Level 12 in desain.png
  const level = 12;

  // KiloCode & AI Assistant Chat State
  const [kiloConfig, setKiloConfig] = useState<KiloCodeConfig>(() => {
    const saved = localStorage.getItem('robolab_kilocode_config');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (!parsed.apiKey?.trim()) {
          parsed.apiKey = DEFAULT_KILOCODE_CONFIG.apiKey;
        }
        if (!parsed.endpoint || parsed.endpoint.includes('api.kilocode.com') || parsed.endpoint.includes('api.kilo.ai/v1')) {
          parsed.endpoint = DEFAULT_KILOCODE_CONFIG.endpoint;
        }
        if (!parsed.model || parsed.model === 'kilocode/kilo-auto' || parsed.model === 'kilo-auto') {
          parsed.model = DEFAULT_KILOCODE_CONFIG.model;
        }
        return parsed;
      } catch (e) {}
    }
    return DEFAULT_KILOCODE_CONFIG;
  });

  useEffect(() => {
    localStorage.setItem('robolab_kilocode_config', JSON.stringify(kiloConfig));
  }, [kiloConfig]);

  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState<Array<ChatMessage>>([
    { sender: 'ai', message: 'Halo! Saya **Asisten Robolab AI**. Tanyakan analisis kode, perbaikan error, simulator rangkaian, atau datasheet komponen!' }
  ]);

  // AI Camera mode state
  const [_activeAiMode, _setActiveAiMode] = useState<'gesture' | 'object' | 'face' | 'line' | 'none'>('object');

  // Simulation pipeline execution
  const startRunAll = (customCode?: string) => {
    if (isRunning) return;
    clearSimulationTimeouts();
    setIsRunning(true);
    setPinStates({});
    setTerminalTab('terminal');
    setBuildProgress(0);
    setTerminalLogs([]);

    const log = (text: string, type: 'info' | 'error' | 'success' | 'stdout' = 'info') => {
      setTerminalLogs(prev => [...prev, { text, type }]);
    };

    setBuildStatusText('Checking project dependencies...');
    log('🤖 [PIPELINE] Reading project.json config file...', 'info');
    
    const t1 = setTimeout(() => {
      setBuildProgress(20);
      log('✓ Board verified: ESP32 NodeMCU.', 'success');
      log('✓ Packages OK: OpenCV, MediaPipe', 'success');

      setBuildStatusText('Compiling firmware (main.ino)...');
      log('🔨 [COMPILER] Executing arduino-cli compile --board esp32:esp32:nodemcu...', 'info');
      
      const t2 = setTimeout(() => {
        setBuildProgress(50);
        log('🧬 [COMPILER] Linking binary files...', 'info');
        log('✓ Compilation completed successfully. Binary size: 842 KB.', 'success');

        setBuildStatusText('Uploading binary to ESP32 on COM4...');
        log('🔌 [UPLOADER] esptool.py v4.5.1 - Writing flash at 0x00010000...', 'info');
        
        const t3 = setTimeout(() => {
          setBuildProgress(80);
          log('✓ Flash completed. Resetting chip...', 'success');

          setBuildStatusText('Launching Python AI Vision Engine...');
          log('⚙️ [PYTHON] Executing virtualenv python/main.py...', 'info');
          log('🎥 [CAMERA] Accessing Camera sensor...', 'info');
          
          const t4 = setTimeout(() => {
            setBuildProgress(100);
            setBuildStatusText('System Running Successfully');
            log('🚀 [READY] Pipeline is fully operational! Visualizing telemetry.', 'success');
            setTerminalTab('serial');
            _setActiveAiMode('object');
            startCodeInterpreter(customCode);
          }, 1000);
          simulationTimeouts.current.push(t4);
        }, 1200);
        simulationTimeouts.current.push(t3);
      }, 1500);
      simulationTimeouts.current.push(t2);
    }, 1000);
    simulationTimeouts.current.push(t1);
  };

  const startCodeInterpreter = (customCode?: string) => {
    const code = customCode !== undefined ? customCode : (simFiles[simActiveFile] || files[activeFile] || '');
    const lines = code.split('\n');

    // Pre-scan: detect which pins are used as servo (Microbit MicroPython pattern)
    // Must be before parseLines so the closure can access servoPins
    const servoPins = new Set<string>();
    for (const rawLine of lines) {
      // Detect: pinN.set_analog_period(20) — marks pin N as servo
      const periodMatch = rawLine.match(/pin(\d+)\.set_analog_period\(\s*20\s*\)/);
      if (periodMatch) servoPins.add(periodMatch[1]);
      // Detect: pinN_servo = True — explicit servo marker
      const markerMatch = rawLine.match(/pin(\d+)_servo\s*=\s*True/);
      if (markerMatch) servoPins.add(markerMatch[1]);
      // Detect: pinN.write_analog(...) # Servo
      const servoCommentMatch = rawLine.match(/pin(\d+)\.write_analog\(.+\)\s*#\s*Servo/);
      if (servoCommentMatch) servoPins.add(servoCommentMatch[1]);
    }
    console.log("ROBOLAB SIMULATOR: Detected servo pins:", [...servoPins]);

    const parseLines = (lineList: string[], startIdx: number, endIdx: number): any[] => {
      const queue: any[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const line = lineList[i];
        if (line === undefined) continue;
        const originalLine = line; // keep original for # Servo detection
        let clean = line;
        if (clean.includes('//')) clean = clean.split('//')[0];
        const trimmedBeforeHash = clean.trim();
        // Check for #define before stripping #
        const defineMatch = trimmedBeforeHash.match(/^#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/);
        if (defineMatch) {
          const varName = defineMatch[1].trim();
          const expr = defineMatch[2].replace(/;$/, '').trim();
          queue.push({ type: 'assign', value: { varName, expr } });
          continue;
        }
        // For Python comments, only strip if not in a string context (simple heuristic: strip if # is not preceded by even number of quotes)
        // But we need to preserve the line for # Servo detection, so we work with originalLine where needed
        const hashIdx = clean.indexOf('#');
        if (hashIdx >= 0) clean = clean.slice(0, hashIdx);
        const trimmed = clean.trim();
        if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Check C++ / Python loops
        const pythonForMatch = trimmed.match(/for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\):/);
        const cppForMatch = trimmed.match(/for\s*\(\s*(?:const\s+)?int\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+)\s*;\s*\1\s*(<=|<)\s*(\d+)\s*;\s*\1\s*\+=\s*(\d+)\s*\)\s*\{?/);

        if (pythonForMatch) {
          const loopVar = pythonForMatch[1];
          const start = parseInt(pythonForMatch[2]);
          const end = parseInt(pythonForMatch[3]);
          const step = parseInt(pythonForMatch[4]);
          
          const bodyLines: string[] = [];
          let j = i + 1;
          while (j < lineList.length && (lineList[j].trim() === '' || lineList[j].startsWith('    ') || lineList[j].startsWith('\t'))) {
            bodyLines.push(lineList[j]);
            j++;
          }
          i = j - 1;

          for (let val = start; val < end; val += step) {
            queue.push({ type: 'assign', value: { varName: loopVar, expr: String(val) } });
            queue.push(...parseLines(bodyLines, 0, bodyLines.length - 1));
          }
          continue;
        }

        if (cppForMatch) {
          const loopVar = cppForMatch[1];
          const start = parseInt(cppForMatch[2]);
          const isLessEqual = cppForMatch[3] === '<=';
          const end = parseInt(cppForMatch[4]);
          const step = parseInt(cppForMatch[5]);

          const bodyLines: string[] = [];
          let j = i + 1;
          let braceCount = trimmed.includes('{') ? 1 : 0;
          if (braceCount === 0 && j < lineList.length && lineList[j].trim() === '{') {
            braceCount = 1;
            j++;
          }
          
          while (j < lineList.length) {
            const bodyLine = lineList[j];
            let ended = false;
            for (let charIdx = 0; charIdx < bodyLine.length; charIdx++) {
              const char = bodyLine[charIdx];
              if (char === '{') braceCount++;
              else if (char === '}') {
                braceCount--;
                if (braceCount <= 0) {
                  ended = true;
                  break;
                }
              }
            }
            if (ended) {
              j++;
              break;
            }
            bodyLines.push(bodyLine);
            j++;
          }
          i = j - 1;

          for (let val = start; isLessEqual ? (val <= end) : (val < end); val += step) {
            queue.push({ type: 'assign', value: { varName: loopVar, expr: String(val) } });
            queue.push(...parseLines(bodyLines, 0, bodyLines.length - 1));
          }
          continue;
        }

        // Check C++ / Python If statements
        const pythonIfMatch = trimmed.match(/^if\s+(.+?)\s*:/);
        let isCppIf = false;
        let cppCondition = '';
        if (/^(?:if|\}\s*else\s+if|else\s+if)\s*\(/.test(trimmed)) {
          const openParenIdx = trimmed.indexOf('(');
          if (openParenIdx !== -1) {
            let depth = 0;
            let closeParenIdx = -1;
            for (let cIdx = openParenIdx; cIdx < trimmed.length; cIdx++) {
              if (trimmed[cIdx] === '(') depth++;
              else if (trimmed[cIdx] === ')') {
                depth--;
                if (depth === 0) {
                  closeParenIdx = cIdx;
                  break;
                }
              }
            }
            if (closeParenIdx !== -1) {
              isCppIf = true;
              cppCondition = trimmed.substring(openParenIdx + 1, closeParenIdx).trim();
            }
          }
        }
        if (pythonIfMatch || isCppIf) {
          const condition = pythonIfMatch ? pythonIfMatch[1].trim() : cppCondition;
          
          // Parse if body lines
          const ifBodyLines: string[] = [];
          let j = i + 1;
          
          if (pythonIfMatch) {
            // Python indentation: compute indent level of the 'if' line itself
            const ifLineIndent = line.length - line.trimStart().length;
            // Only take lines that are MORE indented than the 'if' line
            while (j < lineList.length) {
              const bodyLine = lineList[j];
              const bodyTrimmed = bodyLine.trim();
              if (bodyTrimmed === '') { ifBodyLines.push(bodyLine); j++; continue; }
              const bodyIndent = bodyLine.length - bodyLine.trimStart().length;
              if (bodyIndent > ifLineIndent) {
                ifBodyLines.push(bodyLine);
                j++;
              } else {
                break; // same or less indent = end of if body
              }
            }
          } else {
            // C++ brace check
            let braceCount = trimmed.includes('{') ? 1 : 0;
            if (braceCount === 0 && j < lineList.length && lineList[j].trim() === '{') {
              braceCount = 1;
              j++;
            }
            if (braceCount > 0) {
              while (j < lineList.length) {
                const bodyLine = lineList[j];
                let ended = false;
                for (let charIdx = 0; charIdx < bodyLine.length; charIdx++) {
                  const char = bodyLine[charIdx];
                  if (char === '{') braceCount++;
                  else if (char === '}') {
                    braceCount--;
                    if (braceCount <= 0) {
                      ended = true;
                      break;
                    }
                  }
                }
                if (ended) {
                  break;
                }
                ifBodyLines.push(bodyLine);
                j++;
              }
            } else {
              // Single line if body
              ifBodyLines.push(lineList[j]);
              j++;
            }
          }
          
          i = j - 1; // Advance main loop index
          const ifBody = parseLines(ifBodyLines, 0, ifBodyLines.length - 1);
          
          // Check for else block next
          const elseBodyLines: string[] = [];
          let nextNonEmptyIdx = i + 1;
          while (nextNonEmptyIdx < lineList.length && lineList[nextNonEmptyIdx].trim() === '') {
            nextNonEmptyIdx++;
          }
          
          if (nextNonEmptyIdx < lineList.length) {
            const nextLineTrimmed = lineList[nextNonEmptyIdx].trim();
            const pythonElseMatch = nextLineTrimmed.match(/^else\s*:/);
            const cppElseMatch = nextLineTrimmed.match(/^(?:\}\s*)?else\s*\{?$/);
            
            if (pythonElseMatch || cppElseMatch) {
              i = nextNonEmptyIdx; // Advance to else line
              let k = i + 1;
              
              if (pythonElseMatch) {
                // Use indent level of the 'else:' line itself
                const elseLineRaw = lineList[nextNonEmptyIdx] || '';
                const elseLineIndent = elseLineRaw.length - elseLineRaw.trimStart().length;
                while (k < lineList.length) {
                  const bodyLine = lineList[k];
                  const bodyTrimmed = bodyLine.trim();
                  if (bodyTrimmed === '') { elseBodyLines.push(bodyLine); k++; continue; }
                  const bodyIndent = bodyLine.length - bodyLine.trimStart().length;
                  if (bodyIndent > elseLineIndent) {
                    elseBodyLines.push(bodyLine);
                    k++;
                  } else {
                    break;
                  }
                }
              } else {
                let braceCount = nextLineTrimmed.includes('{') ? 1 : 0;
                if (braceCount === 0 && k < lineList.length && lineList[k].trim() === '{') {
                  braceCount = 1;
                  k++;
                }
                if (braceCount > 0) {
                  while (k < lineList.length) {
                    const bodyLine = lineList[k];
                    let ended = false;
                    for (let charIdx = 0; charIdx < bodyLine.length; charIdx++) {
                      const char = bodyLine[charIdx];
                      if (char === '{') braceCount++;
                      else if (char === '}') {
                        braceCount--;
                        if (braceCount <= 0) {
                          ended = true;
                          break;
                        }
                      }
                    }
                    if (ended) {
                      k++;
                      break;
                    }
                    elseBodyLines.push(bodyLine);
                    k++;
                  }
                } else {
                  elseBodyLines.push(lineList[k]);
                  k++;
                }
              }
              i = k - 1; // Advance main loop index past else block
            }
          }
          
          const elseBody = elseBodyLines.length > 0 ? parseLines(elseBodyLines, 0, elseBodyLines.length - 1) : undefined;
          
          queue.push({
            type: 'if',
            value: { condition, ifBody, elseBody }
          });
          continue;
        }

        // Regular statement parsing...
        // 0. Return statement (e.g. return; or return 0;)
        if (/^return\b/.test(trimmed)) {
          queue.push({ type: 'return' });
          continue;
        }

        // 1. Assignments
        const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/) ||
                            trimmed.match(/^(?:const\s+)?(?:int|float|double|char\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*);$/);
        if (assignMatch) {
          const varName = assignMatch[1].trim();
          const expr = assignMatch[2].replace(/;$/, '').trim();
          queue.push({ type: 'assign', value: { varName, expr } });
          continue;
        }

        // 2. Prints — support end="" and multiline args
        const cppPrintMatch = trimmed.match(/Serial\.print(ln)?\(\s*(.*?)\s*\)/);
        if (trimmed.startsWith('print(')) {
          // Extract full argument string between the outer parentheses
          let parenDepth = 0;
          let printArgStart = trimmed.indexOf('(');
          let printArgEnd = -1;
          for (let pi = printArgStart; pi < trimmed.length; pi++) {
            if (trimmed[pi] === '(') parenDepth++;
            else if (trimmed[pi] === ')') {
              parenDepth--;
              if (parenDepth === 0) { printArgEnd = pi; break; }
            }
          }
          const printFullArgs = printArgEnd > printArgStart ? trimmed.slice(printArgStart + 1, printArgEnd).trim() : '';
          // Detect end keyword — if end="" or end='' means no newline / inline print
          const endMatch = printFullArgs.match(/,\s*end\s*=\s*(['"])([^'"]*)\1/);
          const hasNoNewline = endMatch !== null;
          // Remove the end=... keyword from the expression
          const exprWithoutEnd = printFullArgs.replace(/,\s*end\s*=\s*(['"])[^'"]*\1/, '').trim();
          queue.push({ type: 'print', value: { expr: exprWithoutEnd, newline: !hasNoNewline } });
          continue;
        }
        if (cppPrintMatch) {
          queue.push({ type: 'print', value: { expr: cppPrintMatch[2].trim(), newline: cppPrintMatch[1] === 'ln' } });
          continue;
        }

        // MFRC522 RFID specific helpers in serial / debug
        if (trimmed.includes('MFRC522Debug::PCD_DumpVersionToSerial')) {
          queue.push({ type: 'print', value: { expr: '"Firmware Version: 0x92 = v2.0"', newline: true } });
          continue;
        }
        if (trimmed.includes('MFRC522Debug::PrintUID') || trimmed.includes('mfrc522_print_uid') || trimmed.includes('robot.mfrc522_print_uid')) {
          queue.push({ type: 'mfrc522PrintUid' });
          continue;
        }

        // 3. Move
        const pythonMoveMatch = trimmed.match(/robot\.send\((['"])(.*?)\1\)/);
        const arduinoMoveMatch = trimmed.match(/Robot\.move\((['"])(.*?)\1/);
        if (pythonMoveMatch) {
          queue.push({ type: 'move', value: pythonMoveMatch[2] });
          continue;
        }
        if (arduinoMoveMatch) {
          queue.push({ type: 'move', value: arduinoMoveMatch[2] });
          continue;
        }

        // 4. Delay
        const pythonDelayMatch = trimmed.match(/time\.sleep\(\s*([0-9.]+)\s*\)/);
        const arduinoDelayMatch = trimmed.match(/delay\(\s*([0-9.]+)\s*\)/);
        const microbitSleepMatch = trimmed.match(/^sleep\(\s*([0-9.]+)\s*\)/);
        if (pythonDelayMatch) {
          queue.push({ type: 'delay', value: parseFloat(pythonDelayMatch[1]) * 1000 });
          continue;
        }
        if (arduinoDelayMatch) {
          queue.push({ type: 'delay', value: parseFloat(arduinoDelayMatch[1]) });
          continue;
        }
        if (microbitSleepMatch) {
          queue.push({ type: 'delay', value: parseFloat(microbitSleepMatch[1]) });
          continue;
        }

        // 5. DigitalWrite
        const pythonDigitalWriteMatch = trimmed.match(/robot\.digital_write\(\s*([a-zA-Z0-9_]+)\s*,\s*(['"]?)([a-zA-Z0-9_]+)\2\s*\)/) ||
                                       trimmed.match(/Pin\(\s*([a-zA-Z0-9_]+)\s*,\s*Pin\.OUT\)\.value\(\s*([a-zA-Z0-9_]+)\s*\)/) ||
                                       trimmed.match(/pin(\d+)\.write_digital\(\s*([a-zA-Z0-9_]+)\s*\)/);
        const arduinoDigitalWriteMatch = trimmed.match(/digitalWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/);
        if (pythonDigitalWriteMatch) {
          const pin = pythonDigitalWriteMatch[1];
          const state = pythonDigitalWriteMatch[3] || pythonDigitalWriteMatch[2];
          queue.push({ 
            type: 'digitalWrite', 
            value: { pin, state } 
          });
          continue;
        }
        if (arduinoDigitalWriteMatch) {
          queue.push({ 
            type: 'digitalWrite', 
            value: { pin: arduinoDigitalWriteMatch[1], state: arduinoDigitalWriteMatch[2] } 
          });
          continue;
        }

        // 6. ServoWrite / myServo.write / myServo.attach
        const pythonServoWriteMatch = trimmed.match(/robot\.servo_write\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/);
        const arduinoServoWriteMatch = trimmed.match(/servoWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/);
        const cppServoAttachMatch = trimmed.match(/([a-zA-Z0-9_]+)\.attach\(\s*(.+?)\s*\);?/);
        const cppServoWriteMatch = trimmed.match(/([a-zA-Z0-9_]+)\.write\(\s*(.+?)\s*\);?/);
        // Microbit MicroPython servo: pinN.write_analog(...) # Servo
        // Also handle pinN_servo = True marker
        const mbPinServoMarkerMatch = trimmed.match(/^pin(\d+)_servo\s*=\s*True/);
        // Pattern: pinN.write_analog(int(30 + (angle * 90) / 180)) # Servo
        // Use originalLine (before comment stripping) to detect # Servo comment
        const mbPinServoWriteMatch = originalLine.trim().match(/pin(\d+)\.write_analog\((.+?)\)\s*#\s*Servo/);
        // Also: pinN.write_analog(...) without comment but pin is known servo (fallback using trimmed)
        const mbPinWriteAnalogMatch = trimmed.match(/pin(\d+)\.write_analog\((.+)\)/);
        
        if (mbPinServoMarkerMatch) {
          // Mark this pin as a servo pin in executionVars tracker (via assign)
          const servoPinNum = mbPinServoMarkerMatch[1];
          queue.push({
            type: 'assign',
            value: { varName: `__servo_pin_${servoPinNum}`, expr: 'true' }
          });
          continue;
        }
        if (mbPinServoWriteMatch) {
          // Microbit servo write with # Servo comment - extract angle from PWM formula
          const servoPinNum = mbPinServoWriteMatch[1];
          const pwmExpr = mbPinServoWriteMatch[2];
          // Try to extract angle from pattern: int(30 + (ANGLE * 90) / 180)
          const angleFromFormula = pwmExpr.match(/int\s*\(\s*30\s*\+\s*\((.+?)\s*\*\s*90\)\s*\/\s*180\s*\)/);
          if (angleFromFormula) {
            queue.push({
              type: 'servoWrite',
              value: { pin: servoPinNum, angle: angleFromFormula[1].trim(), isMicrobitServo: true }
            });
          } else {
            // Fallback: pass raw PWM expression, mark as microbit servo so we convert
            queue.push({
              type: 'servoWrite',
              value: { pin: servoPinNum, angle: pwmExpr.trim(), isMicrobitPwm: true }
            });
          }
          continue;
        }
        if (pythonServoWriteMatch) {
          queue.push({
            type: 'servoWrite',
            value: { pin: pythonServoWriteMatch[1], angle: pythonServoWriteMatch[2] }
          });
          continue;
        }
        if (arduinoServoWriteMatch) {
          queue.push({
            type: 'servoWrite',
            value: { pin: arduinoServoWriteMatch[1], angle: arduinoServoWriteMatch[2] }
          });
          continue;
        }
        if (cppServoAttachMatch) {
          const varName = cppServoAttachMatch[1];
          const pinExpr = cppServoAttachMatch[2].replace(/;$/, '').trim();
          queue.push({
            type: 'assign',
            value: { varName: `servo_pin_of_${varName}`, expr: pinExpr }
          });
          continue;
        }
        if (cppServoWriteMatch && cppServoWriteMatch[1] !== 'Serial' && cppServoWriteMatch[1] !== 'Serial1') {
          const varName = cppServoWriteMatch[1];
          const angleExpr = cppServoWriteMatch[2].replace(/;$/, '').trim();
          queue.push({
            type: 'servoWrite',
            value: { pin: `servo_pin_of_${varName}`, angle: angleExpr }
          });
          continue;
        }

        // 7. AnalogWrite — check if this is a Microbit servo pin write_analog without # Servo comment
        if (mbPinWriteAnalogMatch) {
          const analogPinNum = mbPinWriteAnalogMatch[1];
          const analogExpr = mbPinWriteAnalogMatch[2].trim();
          // Check if this pin is a known servo pin via pre-scan
          const isServoPin = servoPins.has(analogPinNum);
          if (isServoPin) {
            // Treat as servo: try extract angle from int(30 + (angle * 90) / 180)
            const angleFromFormula = analogExpr.match(/int\s*\(\s*30\s*\+\s*\((.+?)\s*\*\s*90\)\s*\/\s*180\s*\)/);
            if (angleFromFormula) {
              queue.push({
                type: 'servoWrite',
                value: { pin: analogPinNum, angle: angleFromFormula[1].trim(), isMicrobitServo: true }
              });
            } else {
              queue.push({
                type: 'servoWrite',
                value: { pin: analogPinNum, angle: analogExpr, isMicrobitPwm: true }
              });
            }
          } else {
            queue.push({
              type: 'analogWrite',
              value: { pin: analogPinNum, val: analogExpr }
            });
          }
          continue;
        }
        const pythonAnalogWriteMatch = trimmed.match(/robot\.analog_write\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/) ||
                                       trimmed.match(/PWM\(\s*Pin\(\s*([a-zA-Z0-9_]+)\s*\)\s*\)\.duty\(\s*(.+?)\s*\)/);
        const arduinoAnalogWriteMatch = trimmed.match(/analogWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/);
        if (pythonAnalogWriteMatch) {
          queue.push({
            type: 'analogWrite',
            value: { pin: pythonAnalogWriteMatch[1], val: pythonAnalogWriteMatch[2] }
          });
          continue;
        }
        if (arduinoAnalogWriteMatch) {
          queue.push({
            type: 'analogWrite',
            value: { pin: arduinoAnalogWriteMatch[1], val: arduinoAnalogWriteMatch[2] }
          });
          continue;
        }

        // 8. Microbit matches
        const mbDigitalWriteMatch = trimmed.match(/microbit\.pin(\d+)\.write_digital\(\s*(\d+)\s*\)/) ||
                                     trimmed.match(/pins\.digitalWrite\(\s*"(P\d+)"\s*,\s*(\d+)\s*\)/);
        const mbAnalogWriteMatch = trimmed.match(/microbit\.pin(\d+)\.write_analog\(\s*([0-9.]+)\s*\)/) ||
                                    trimmed.match(/pins\.analogWrite\(\s*"(P\d+)"\s*,\s*([0-9.]+)\s*\)/);
        const mbServoWriteMatch = trimmed.match(/pins\.servoWrite\(\s*"(P\d+)"\s*,\s*([0-9.]+)\s*\)/);
        const mbPauseMatch = trimmed.match(/basic\.pause\(\s*([0-9.]+)\s*\)/);

        if (mbDigitalWriteMatch) {
          const rawPin = mbDigitalWriteMatch[1] || mbDigitalWriteMatch[2];
          const pin = rawPin.startsWith('P') ? rawPin.replace('P', '') : rawPin;
          const valVal = mbDigitalWriteMatch[2];
          const state = valVal === '1' || valVal === 'HIGH' ? 'HIGH' : 'LOW';
          queue.push({ type: 'digitalWrite', value: { pin, state } });
          continue;
        }
        if (mbServoWriteMatch) {
          const rawPin = mbServoWriteMatch[1];
          const pin = rawPin.startsWith('P') ? rawPin.replace('P', '') : rawPin;
          queue.push({ type: 'servoWrite', value: { pin, angle: parseFloat(mbServoWriteMatch[2]) } });
          continue;
        }
        if (mbAnalogWriteMatch) {
          const rawPin = mbAnalogWriteMatch[1];
          const pin = rawPin.startsWith('P') ? rawPin.replace('P', '') : rawPin;
          queue.push({ type: 'analogWrite', value: { pin, val: parseFloat(mbAnalogWriteMatch[2]) } });
          continue;
        }
        if (mbPauseMatch) {
          queue.push({ type: 'delay', value: parseFloat(mbPauseMatch[1]) });
          continue;
        }

        // 9. Blynk IoT matches
        const cppBlynkWriteMatch = trimmed.match(/BLYNK_WRITE\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{?/);
        const pythonBlynkWriteMatch = trimmed.match(/@blynk\.on\(\s*['"]?([a-zA-Z0-9_]+)['"]?\s*\)/) ||
                                       trimmed.match(/def\s+blynk_on_write_([a-zA-Z0-9_]+)/);
        
        if (cppBlynkWriteMatch || pythonBlynkWriteMatch) {
          const vpin = cppBlynkWriteMatch ? cppBlynkWriteMatch[1] : (pythonBlynkWriteMatch![1]);
          const bodyLines: string[] = [];
          let j = i + 1;
          
          if (cppBlynkWriteMatch) {
            let braceCount = trimmed.includes('{') ? 1 : 0;
            if (braceCount === 0 && j < lineList.length && lineList[j].trim() === '{') {
              braceCount = 1;
              j++;
            }
            while (j < lineList.length) {
              const bLine = lineList[j];
              let ended = false;
              for (let charIdx = 0; charIdx < bLine.length; charIdx++) {
                if (bLine[charIdx] === '{') braceCount++;
                else if (bLine[charIdx] === '}') {
                  braceCount--;
                  if (braceCount <= 0) { ended = true; break; }
                }
              }
              if (ended) { j++; break; }
              bodyLines.push(bLine);
              j++;
            }
          } else {
            const ifLineIndent = line.length - line.trimStart().length;
            while (j < lineList.length) {
              const bLine = lineList[j];
              if (bLine.trim() === '') { bodyLines.push(bLine); j++; continue; }
              const bIndent = bLine.length - bLine.trimStart().length;
              if (bIndent > ifLineIndent) { bodyLines.push(bLine); j++; }
              else break;
            }
          }
          i = j - 1;

          const handlerQueue = parseLines(bodyLines, 0, bodyLines.length - 1);
          blynkHandlersRef.current[vpin] = handlerQueue;
          blynkHandlersRef.current[vpin.toUpperCase()] = handlerQueue;
          continue;
        }

        const blynkBeginMatch = trimmed.match(/Blynk\.begin\(\s*(.*?)\s*\)/) ||
                                trimmed.match(/robot\.blynk_begin\(\s*(.*?)\s*\)/);
        if (blynkBeginMatch) {
          const args = blynkBeginMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
          queue.push({
            type: 'blynk_begin',
            value: { auth: args[0] || 'AuthToken', ssid: args[1] || 'WiFi', pass: args[2] || '' }
          });
          continue;
        }

        const blynkRunMatch = trimmed.match(/Blynk\.run\(\s*\)/) ||
                              trimmed.match(/robot\.blynk_run\(\s*\)/);
        if (blynkRunMatch) {
          queue.push({ type: 'blynk_run' });
          continue;
        }

        const blynkVirtualWriteMatch = trimmed.match(/Blynk\.virtualWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/) ||
                                       trimmed.match(/robot\.blynk_virtual_write\(\s*['"]?([a-zA-Z0-9_]+)['"]?\s*,\s*(.+?)\)/);
        if (blynkVirtualWriteMatch) {
          queue.push({
            type: 'blynk_virtual_write',
            value: { vpin: blynkVirtualWriteMatch[1], val: blynkVirtualWriteMatch[2] }
          });
          continue;
        }

        // 10. HTTPClient matches (C++ & Python requests)
        const httpBeginMatch = trimmed.match(/http\.begin\(\s*["']?([^"']+)["']?\s*\)/);
        const httpGetMatch = trimmed.match(/http\.GET\(\s*\)/);
        const httpPostMatch = trimmed.match(/http\.POST\(\s*(.*?)\s*\)/);
        const pyGetMatch = trimmed.match(/requests\.get\(\s*["']?([^"']+)["']?\s*\)/);
        const pyPostMatch = trimmed.match(/requests\.post\(\s*["']?([^"']+)["']?\s*,?\s*(.*?)\)/);

        if (httpBeginMatch) {
          queue.push({ type: 'http_begin', value: { url: httpBeginMatch[1] } });
          continue;
        }
        if (httpGetMatch) {
          queue.push({ type: 'http_get' });
          continue;
        }
        if (httpPostMatch) {
          queue.push({ type: 'http_post', value: { payload: httpPostMatch[1] } });
          continue;
        }
        if (pyGetMatch) {
          queue.push({ type: 'http_fetch', value: { method: 'GET', url: pyGetMatch[1] } });
          continue;
        }
        if (pyPostMatch) {
          queue.push({ type: 'http_fetch', value: { method: 'POST', url: pyPostMatch[1], payload: pyPostMatch[2] } });
          continue;
        }

        // 11. MQTT (PubSubClient / umqtt) matches
        const mqttServerMatch = trimmed.match(/client\.setServer\(\s*["']?([^"']+)["']?\s*,\s*(\d+)\s*\)/) ||
                                trimmed.match(/MQTTClient\(\s*["']?([^"']+)["']?\s*,\s*["']?([^"']+)["']?\s*\)/);
        const mqttConnectMatch = trimmed.match(/client\.connect\(\s*["']?([^"']+)["']?\s*\)/) ||
                                 trimmed.match(/client\.connect\(\s*\)/);
        const mqttPublishMatch = trimmed.match(/client\.publish\(\s*["']?([^"']+)["']?\s*,\s*(.+?)\)/);
        const mqttSubscribeMatch = trimmed.match(/client\.subscribe\(\s*["']?([^"']+)["']?\s*\)/);

        if (mqttServerMatch) {
          queue.push({ type: 'mqtt_config', value: { server: mqttServerMatch[1], port: mqttServerMatch[2] || '1883' } });
          continue;
        }
        if (mqttConnectMatch) {
          queue.push({ type: 'mqtt_connect', value: { clientId: mqttConnectMatch[1] || 'ESP8266_Sim' } });
          continue;
        }
        if (mqttPublishMatch) {
          queue.push({ type: 'mqtt_publish', value: { topic: mqttPublishMatch[1], payload: mqttPublishMatch[2] } });
          continue;
        }
        if (mqttSubscribeMatch) {
          queue.push({ type: 'mqtt_subscribe', value: { topic: mqttSubscribeMatch[1] } });
          continue;
        }

        // 12. WebSocket Client matches
        const wsBeginMatch = trimmed.match(/webSocket\.begin\(\s*["']?([^"']+)["']?\s*,\s*(\d+)\s*,?\s*["']?([^"']*)["']?\s*\)/) ||
                             trimmed.match(/websockets\.connect\(\s*["']?([^"']+)["']?\s*\)/);
        const wsSendMatch = trimmed.match(/webSocket\.sendTXT\(\s*(.+?)\s*\)/) ||
                            trimmed.match(/ws\.send\(\s*(.+?)\s*\)/);

        if (wsBeginMatch) {
          const url = wsBeginMatch[1].startsWith('ws') ? wsBeginMatch[1] : `ws://${wsBeginMatch[1]}:${wsBeginMatch[2] || 80}${wsBeginMatch[3] || '/'}`;
          queue.push({ type: 'ws_connect', value: { url } });
          continue;
        }
        if (wsSendMatch) {
          queue.push({ type: 'ws_send', value: { msg: wsSendMatch[1] } });
          continue;
        }
      }
      return queue;
    };

    // Split sketch into global, setup, and loop if Arduino sketch
    const hasArduinoStructure = /void\s+setup\s*\(/.test(code) || /void\s+loop\s*\(/.test(code);
    let globalLines: string[] = [];
    let setupLines: string[] = [];
    let loopLines: string[] = [];

    if (hasArduinoStructure) {
      let currentFunc = ''; // 'setup', 'loop', 'other', or ''
      let funcBraceCount = 0;

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        let clean = rawLine;
        if (clean.includes('//')) clean = clean.split('//')[0];
        const trimmed = clean.trim();

        if (!currentFunc) {
          const setupMatch = trimmed.match(/void\s+setup\s*\([^)]*\)\s*\{?/);
          const loopMatch = trimmed.match(/void\s+loop\s*\([^)]*\)\s*\{?/);
          const otherFuncMatch = trimmed.match(/^(?:void|int|bool|String|float|double|uint8_t|uint16_t|uint32_t|byte)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{?/);

          if (setupMatch) {
            currentFunc = 'setup';
            funcBraceCount = 0;
            const openIdx = trimmed.indexOf('{');
            if (openIdx >= 0) {
              funcBraceCount = 1;
              for (let c = openIdx + 1; c < trimmed.length; c++) {
                if (trimmed[c] === '{') funcBraceCount++;
                else if (trimmed[c] === '}') funcBraceCount--;
              }
              if (funcBraceCount <= 0) currentFunc = '';
            }
          } else if (loopMatch) {
            currentFunc = 'loop';
            funcBraceCount = 0;
            const openIdx = trimmed.indexOf('{');
            if (openIdx >= 0) {
              funcBraceCount = 1;
              for (let c = openIdx + 1; c < trimmed.length; c++) {
                if (trimmed[c] === '{') funcBraceCount++;
                else if (trimmed[c] === '}') funcBraceCount--;
              }
              if (funcBraceCount <= 0) currentFunc = '';
            }
          } else if (otherFuncMatch) {
            currentFunc = 'other';
            funcBraceCount = 0;
            const openIdx = trimmed.indexOf('{');
            if (openIdx >= 0) {
              funcBraceCount = 1;
              for (let c = openIdx + 1; c < trimmed.length; c++) {
                if (trimmed[c] === '{') funcBraceCount++;
                else if (trimmed[c] === '}') funcBraceCount--;
              }
              if (funcBraceCount <= 0) currentFunc = '';
            }
          } else {
            globalLines.push(rawLine);
          }
        } else {
          if (funcBraceCount === 0) {
            const openIdx = trimmed.indexOf('{');
            if (openIdx >= 0) {
              funcBraceCount = 1;
              for (let c = openIdx + 1; c < trimmed.length; c++) {
                if (trimmed[c] === '{') funcBraceCount++;
                else if (trimmed[c] === '}') funcBraceCount--;
              }
              if (funcBraceCount <= 0) currentFunc = '';
            }
          } else {
            let ended = false;
            for (let c = 0; c < trimmed.length; c++) {
              if (trimmed[c] === '{') funcBraceCount++;
              else if (trimmed[c] === '}') {
                funcBraceCount--;
                if (funcBraceCount <= 0) {
                  ended = true;
                  break;
                }
              }
            }
            if (ended) {
              currentFunc = '';
              funcBraceCount = 0;
            } else {
              if (currentFunc === 'setup') {
                setupLines.push(rawLine);
              } else if (currentFunc === 'loop') {
                loopLines.push(rawLine);
              }
            }
          }
        }
      }
    }

    const globalQueue = hasArduinoStructure ? parseLines(globalLines, 0, globalLines.length - 1) : [];
    const setupQueue = hasArduinoStructure ? parseLines(setupLines, 0, setupLines.length - 1) : [];
    const loopQueue = hasArduinoStructure ? parseLines(loopLines, 0, loopLines.length - 1) : [];
    const queue = hasArduinoStructure ? [] : parseLines(lines, 0, lines.length - 1);
    console.log("ROBOLAB SIMULATOR: Parsed queues:", { hasArduinoStructure, globalQueue, setupQueue, loopQueue, queue });

    if (hasArduinoStructure) {
      if (globalQueue.length === 0 && setupQueue.length === 0 && loopQueue.length === 0) {
        console.warn("ROBOLAB SIMULATOR: Arduino queues are empty!");
        return;
      }
    } else {
      if (queue.length === 0) {
        console.warn("ROBOLAB SIMULATOR: Queue is empty!");
        return;
      }
    }

    // Reset pinStates so no pins start HIGH prematurely
    setPinStates({});

    // Auto-detect Blynk code and initiate 3-layer sync immediately
    const activeCodeText = (files[activeFile] || activePythonCode || '');
    if (activeCodeText.toLowerCase().includes('blynk') || activeCodeText.includes('BLYNK')) {
      const creds = extractBlynkCredentials(activeCodeText, '', '', '');
      const targetSsid = creds.ssid || 'Local_WiFi';
      const targetPass = creds.pass || '12345678';
      setIsWifiConnected(true);
      setSelectedWifi(targetSsid);
      setWifiPassword(targetPass);
      if (creds.token && creds.token.length >= 15) {
        startRealBlynkCloudSync(creds.token);
      }
    }

    const executionVars: { [key: string]: any } = {};

    const resolveSensorReads = (expr: string): string => {
      let replaced = expr;
      
      // 1. analogRead / analog_read / micro:bit pin.read_analog / ESP32 ADC.read
      while (replaced.includes('analogRead') || replaced.includes('analog_read') || replaced.includes('read_analog') || replaced.includes('ADC(')) {
        let match = replaced.match(/(?:analogRead|analog_read)\(\s*([a-zA-Z0-9_]+)\s*\)/) ||
                    replaced.match(/(?:microbit\.)?pin(\d+)\.read_analog\(\s*\)/) ||
                    replaced.match(/ADC\(\s*Pin\(\s*([a-zA-Z0-9_]+)\s*\)\s*\)\.read\(\s*\)/);
        if (!match) break;
        let pin = match[1];
        if (executionVars[pin] !== undefined) {
          pin = String(executionVars[pin]);
        }
        const cleanPin = pin.startsWith('A') ? pin.replace('A', '') : pin;
        const val = pinStatesRef.current[cleanPin] !== undefined ? Number(pinStatesRef.current[cleanPin]) : (pinStatesRef.current[pin] !== undefined ? Number(pinStatesRef.current[pin]) : 512);
        replaced = replaced.replace(match[0], String(val));
      }

      // 2. digitalRead / digital_read / micro:bit pin.read_digital / ESP32 Pin.value
      while (replaced.includes('digitalRead') || replaced.includes('digital_read') || replaced.includes('read_digital') || replaced.includes('.value(')) {
        let match = replaced.match(/(?:digitalRead|digital_read)\(\s*([a-zA-Z0-9_]+)\s*\)/) ||
                    replaced.match(/(?:microbit\.)?pin(\d+)\.read_digital\(\s*\)/) ||
                    replaced.match(/Pin\(\s*([a-zA-Z0-9_]+)\s*(?:,\s*Pin\.IN)?\s*\)\.value\(\s*\)/);
        if (!match) break;
        let pin = match[1];
        if (executionVars[pin] !== undefined) {
          pin = String(executionVars[pin]);
        }
        const val = pinStatesRef.current[pin] === 'HIGH' ? 1 : 0;
        replaced = replaced.replace(match[0], String(val));
      }

      // 3. readDistance / readUltrasonic / read_ultrasonic
      while (replaced.includes('readDistance') || replaced.includes('readUltrasonic') || replaced.includes('read_ultrasonic')) {
        const match = replaced.match(/(?:readDistance|readUltrasonic|read_ultrasonic)\(\s*.*?\s*\)/) || replaced.match(/(?:readDistance|readUltrasonic|read_ultrasonic)\s*\(\s*\)/);
        if (!match) break;
        const val = sensorDataRef.current.distance;
        replaced = replaced.replace(match[0], String(val));
      }

      // 4. dht.readTemperature / dht_read_temp
      while (replaced.includes('readTemperature') || replaced.includes('dht_read_temp')) {
        const match = replaced.match(/(?:dht\.readTemperature|robot\.dht_read_temp)\(\s*\)/) || replaced.match(/(?:readTemperature|dht_read_temp)\(\s*\)/);
        if (!match) break;
        const val = sensorDataRef.current.temp;
        replaced = replaced.replace(match[0], String(val));
      }

      // 5. dht.readHumidity / dht_read_humi
      while (replaced.includes('readHumidity') || replaced.includes('dht_read_humi')) {
        const match = replaced.match(/(?:dht\.readHumidity|robot\.dht_read_humi)\(\s*\)/) || replaced.match(/(?:readHumidity|dht_read_humi)\(\s*\)/);
        if (!match) break;
        const val = sensorDataRef.current.humidity ?? 65.0;
        replaced = replaced.replace(match[0], String(val));
      }

      // 6. MFRC522 / RFID Card Present
      while (replaced.includes('PICC_IsNewCardPresent') || replaced.includes('mfrc522_is_card') || replaced.includes('rfid_iscard')) {
        const match = replaced.match(/(?:mfrc522\.PICC_IsNewCardPresent|robot\.mfrc522_is_card|mfrc522_is_card|rfid_iscard)\(\s*\)/);
        if (!match) break;
        const isPresent = !!(sensorDataRef.current as any)?.rfidCardPresent;
        replaced = replaced.replace(match[0], isPresent ? 'true' : 'false');
      }

      // 7. MFRC522 / RFID Read Card Serial
      while (replaced.includes('PICC_ReadCardSerial') || replaced.includes('mfrc522_read_serial') || replaced.includes('rfid_read_serial')) {
        const match = replaced.match(/(?:mfrc522\.PICC_ReadCardSerial|robot\.mfrc522_read_serial|mfrc522_read_serial|robot\.rfid_read_serial)\(\s*\)/);
        if (!match) break;
        const isPresent = !!(sensorDataRef.current as any)?.rfidCardPresent;
        replaced = replaced.replace(match[0], isPresent ? 'true' : 'false');
      }

      // 8. MFRC522 / RFID Read Card UID (String value)
      while (replaced.includes('getMFRC522UID') || replaced.includes('getRFIDUID') || replaced.includes('mfrc522_get_uid') || replaced.includes('rfid_get_uid') || replaced.includes('rfid_read')) {
        const match = replaced.match(/(?:getMFRC522UID|getRFIDUID|robot\.mfrc522_get_uid|mfrc522_get_uid|robot\.rfid_get_uid|robot\.rfid_read)\(\s*\)/);
        if (!match) break;
        const isPresent = !!(sensorDataRef.current as any)?.rfidCardPresent;
        const uid = (sensorDataRef.current as any)?.rfidUid || '53 7A 92 1F';
        replaced = replaced.replace(match[0], isPresent ? `"${uid}"` : '""');
      }

      // 9. MFRC522 uid.size
      while (replaced.includes('mfrc522.uid.size')) {
        const isPresent = !!(sensorDataRef.current as any)?.rfidCardPresent;
        replaced = replaced.replace(/mfrc522\.uid\.size/g, isPresent ? '4' : '0');
      }

      // 10. MFRC522 PCD_ReadRegister
      while (replaced.includes('PCD_ReadRegister')) {
        const match = replaced.match(/mfrc522\.PCD_ReadRegister\(.*?\)/);
        if (!match) break;
        replaced = replaced.replace(match[0], '146'); // 146 = 0x92 (v2.0)
      }

      return replaced;
    };

    let hasOpenLine = false;

    const executeBlock = (blockQueue: any[], blockIndex: number, onComplete: () => void, onReturn?: () => void) => {
      if (!isRunningRef.current) return;

      if (blockIndex >= blockQueue.length) {
        onComplete();
        return;
      }

      const item = blockQueue[blockIndex];
      console.log("ROBOLAB SIMULATOR: Executing block item:", item);
      const next = () => executeBlock(blockQueue, blockIndex + 1, onComplete, onReturn);

      if (item.type === 'return') {
        if (onReturn) {
          onReturn();
        } else {
          onComplete();
        }
        return;
      }

      if (item.type === 'assign') {
        const { varName, expr } = item.value as { varName: string, expr: string };
        const resolvedExpr = resolveSensorReads(expr);
        const val = evalExpr(resolvedExpr, executionVars);
        executionVars[varName] = val;
        next();
      } else if (item.type === 'if') {
        const resolvedCond = resolveSensorReads(item.value.condition);
        const condVal = evalExpr(resolvedCond, executionVars);
        const condBool = condVal === 'true' || condVal === true || (typeof condVal === 'number' && condVal !== 0);
        if (condBool) {
          executeBlock(item.value.ifBody, 0, next, onReturn || onComplete);
        } else if (item.value.elseBody) {
          executeBlock(item.value.elseBody, 0, next, onReturn || onComplete);
        } else {
          next();
        }
      } else if (item.type === 'print') {
        const { expr, newline } = item.value as { expr: string, newline: boolean };
        const resolvedExpr = resolveSensorReads(expr);
        const evaluated = evalPrintArgs(resolvedExpr, executionVars, sensorDataRef.current, (executionVars as any).__wifiSim);
        if (newline === false) {
          if (hasOpenLine) {
            setTerminalLogs(prev => {
              if (prev.length === 0) return [{ text: evaluated, type: 'stdout' as const }];
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, text: last.text + evaluated }];
            });
            setInteractiveTerminalLogs(prev => {
              if (prev.length === 0) return [{ text: evaluated, type: 'output' as const }];
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, text: last.text + evaluated }];
            });
          } else {
            hasOpenLine = true;
            setTerminalLogs(prev => [
              ...prev, 
              { text: evaluated, type: 'stdout' }
            ]);
            setInteractiveTerminalLogs(prev => [
              ...prev,
              { text: evaluated, type: 'output' }
            ]);
          }
        } else {
          if (hasOpenLine) {
            setTerminalLogs(prev => {
              if (prev.length === 0) return [{ text: evaluated, type: 'stdout' as const }];
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, text: last.text + evaluated }];
            });
            setInteractiveTerminalLogs(prev => {
              if (prev.length === 0) return [{ text: evaluated, type: 'output' as const }];
              const last = prev[prev.length - 1];
              return [...prev.slice(0, -1), { ...last, text: last.text + evaluated }];
            });
            hasOpenLine = false;
          } else {
            setTerminalLogs(prev => [
              ...prev, 
              { text: evaluated, type: 'stdout' }
            ]);
            setInteractiveTerminalLogs(prev => [
              ...prev,
              { text: evaluated, type: 'output' }
            ]);
          }
        }
        next();
      } else if (item.type === 'mfrc522PrintUid') {
        const uid = (sensorDataRef.current as any)?.rfidUid || '53 7A 92 1F';
        if (hasOpenLine) {
          setTerminalLogs(prev => {
            if (prev.length === 0) return [{ text: uid, type: 'stdout' as const }];
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text: last.text + uid }];
          });
          setInteractiveTerminalLogs(prev => {
            if (prev.length === 0) return [{ text: uid, type: 'output' as const }];
            const last = prev[prev.length - 1];
            return [...prev.slice(0, -1), { ...last, text: last.text + uid }];
          });
        } else {
          hasOpenLine = true;
          setTerminalLogs(prev => [
            ...prev, 
            { text: uid, type: 'stdout' }
          ]);
          setInteractiveTerminalLogs(prev => [
            ...prev,
            { text: uid, type: 'output' }
          ]);
        }
        next();
      } else if (item.type === 'move') {
        const cmd = item.value as string;
        setRobotCommand(cmd);
        setTerminalLogs(prev => [
          ...prev, 
          { text: `[SIMULATOR] Robot command executed: ${cmd}`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'digitalWrite') {
        let { pin, state } = item.value as { pin: string, state: string };
        if (executionVars[pin] !== undefined) {
          pin = String(executionVars[pin]);
        }
        const resolvedStateExpr = resolveSensorReads(state);
        const evalState = executionVars[state] !== undefined ? executionVars[state] : evalExpr(resolvedStateExpr, executionVars);
        const isHigh = evalState === 'HIGH' || evalState === '1' || evalState === 1 || evalState === 'true' || evalState === true;
        const finalState = isHigh ? 'HIGH' : 'LOW';
        setPinStates(prev => ({ ...prev, [pin]: finalState }));
        setTerminalLogs(prev => [
          ...prev, 
          { text: `[GPIO] Pin ${pin} -> ${finalState}`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'servoWrite') {
        let { pin, angle, isMicrobitServo, isMicrobitPwm } = item.value as { pin: string, angle: any, isMicrobitServo?: boolean, isMicrobitPwm?: boolean };
        if (executionVars[pin] !== undefined) {
          pin = String(executionVars[pin]);
        } else if (pin.startsWith('servo_pin_of_')) {
          const resolvedPin = executionVars[pin];
          if (resolvedPin !== undefined) {
            pin = String(resolvedPin);
          } else {
            pin = programPins.servoPin || '3';
          }
        }
        const resolvedAngleExpr = resolveSensorReads(String(angle));
        let numericAngle = typeof angle === 'number' ? angle : Number(evalExpr(resolvedAngleExpr, executionVars));
        // Clamp to valid servo range
        numericAngle = Math.max(0, Math.min(180, numericAngle));
        
        // For Microbit servo, Simulator.tsx expects PWM duty value (30-120) in pinStates
        // and converts it back to angle via: (duty - 30) * 2
        // So we store the PWM value: duty = 30 + (angle * 90) / 180
        let stateValue: number;
        if (isMicrobitServo) {
          // angle is already extracted (0-180), convert to PWM for storage
          stateValue = Math.round(30 + (numericAngle * 90) / 180);
        } else if (isMicrobitPwm) {
          // raw expression was passed, re-evaluate to get PWM value
          const rawPwm = typeof angle === 'number' ? angle : Number(evalExpr(resolvedAngleExpr, executionVars));
          stateValue = Math.round(Math.max(30, Math.min(120, rawPwm)));
          // recalculate angle for logging
          numericAngle = Math.round(Math.max(0, Math.min(180, (stateValue - 30) * 2)));
        } else {
          stateValue = numericAngle;
        }
        setPinStates(prev => ({ ...prev, [pin]: stateValue }));
        setTerminalLogs(prev => [
          ...prev, 
          { text: `[SERVO] Pin ${pin} -> ${numericAngle}°`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'analogWrite') {
        let { pin, val } = item.value as { pin: string, val: any };
        if (executionVars[pin] !== undefined) {
          pin = String(executionVars[pin]);
        }
        const resolvedValExpr = resolveSensorReads(String(val));
        const numericVal = typeof val === 'number' ? val : Number(evalExpr(resolvedValExpr, executionVars));
        setPinStates(prev => ({ ...prev, [pin]: numericVal }));
        setTerminalLogs(prev => [
          ...prev, 
          { text: `[PWM] Pin ${pin} -> ${numericVal}`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'blynk_begin') {
        const { auth, ssid, pass } = item.value;
        const activeCodeText = (files[activeFile] || activePythonCode || '');
        const creds = extractBlynkCredentials(activeCodeText, auth, ssid, pass);

        const targetSsid = creds.ssid || 'Local_WiFi';
        const targetPass = creds.pass || '12345678';

        setIsWifiConnected(true);
        setSelectedWifi(targetSsid);
        setWifiPassword(targetPass);
        setBlynkStatus('connecting');

        setTerminalLogs(prev => [
          ...prev,
          { text: `[WIFI SIMULATOR] 🌐 Virtual WiFi Auto-Connected to "${targetSsid}" (Password: "${targetPass}")`, type: 'stdout' },
          { text: `[WIFI SIMULATOR] IP Address: 192.168.1.105 (Signal: -52 dBm)`, type: 'stdout' }
        ]);

        startRealBlynkCloudSync(creds.token);
        next();
      } else if (item.type === 'blynk_run') {
        setBlynkStatus('online');
        next();
      } else if (item.type === 'blynk_virtual_write') {
        const { vpin, val } = item.value;
        const evaluatedVal = evalExpr(resolveSensorReads(String(val)), executionVars);
        setBlynkVirtualPins(prev => ({ ...prev, [vpin]: Number(evaluatedVal) }));
        setTerminalLogs(prev => [
          ...prev,
          { text: `[BLYNK] Virtual Write ${vpin} -> ${evaluatedVal}`, type: 'stdout' }
        ]);

        // Real Blynk Cloud Sync Push (Multi-region)
        const cleanAuth = blynkAuthTokenRef.current;
        if (cleanAuth && cleanAuth !== 'YourAuthToken' && cleanAuth !== 'AUTH_TOKEN') {
          const servers = ['https://blynk.cloud', 'https://sgp1.blynk.cloud'];
          servers.forEach(srv => {
            fetch(`${srv}/external/api/update?token=${cleanAuth}&${vpin.toLowerCase()}=${evaluatedVal}`)
              .then(res => {
                if (res.ok) {
                  setTerminalLogs(prev => [
                    ...prev,
                    { text: `[BLYNK REAL-TIME ☁️] Pushed to real Blynk App (${vpin} = ${evaluatedVal})`, type: 'stdout' }
                  ]);
                }
              })
              .catch(() => {});
          });
        }
        next();
      } else if (item.type === 'http_begin') {
        executionVars['__http_url'] = item.value.url;
        setTerminalLogs(prev => [
          ...prev,
          { text: `[HTTPClient] Configured Target URL: "${item.value.url}"`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'http_get' || (item.type === 'http_fetch' && item.value.method === 'GET')) {
        const targetUrl = resolveSensorReads(String(item.value?.url || executionVars['__http_url'] || 'http://httpbin.org/get')).replace(/^['"]|['"]$/g, '');
        setTerminalLogs(prev => [
          ...prev,
          { text: `[HTTPClient GET 🌐] Sending GET request to ${targetUrl}...`, type: 'stdout' }
        ]);
        
        fetch(targetUrl)
          .then(async res => {
            const bodyText = await res.text();
            executionVars['httpCode'] = res.status;
            executionVars['payload'] = bodyText;
            executionVars['__http_response'] = bodyText;
            setTerminalLogs(prev => [
              ...prev,
              { text: `[HTTPClient GET 200 OK] Response (${res.status}): ${bodyText.slice(0, 150)}${bodyText.length > 150 ? '...' : ''}`, type: 'stdout' }
            ]);
            next();
          })
          .catch(err => {
            executionVars['httpCode'] = -1;
            executionVars['payload'] = '';
            setTerminalLogs(prev => [
              ...prev,
              { text: `[HTTPClient GET Failed ❌] ${err.message}`, type: 'stdout' }
            ]);
            next();
          });
        return; // async step
      } else if (item.type === 'http_post' || (item.type === 'http_fetch' && item.value.method === 'POST')) {
        const targetUrl = resolveSensorReads(String(item.value?.url || executionVars['__http_url'] || 'http://httpbin.org/post')).replace(/^['"]|['"]$/g, '');
        const rawPayload = resolveSensorReads(String(item.value?.payload || '{}'));
        const evaluatedPayload = evalExpr(rawPayload, executionVars);
        const payloadStr = typeof evaluatedPayload === 'object' ? JSON.stringify(evaluatedPayload) : String(evaluatedPayload).replace(/^['"]|['"]$/g, '');

        setTerminalLogs(prev => [
          ...prev,
          { text: `[HTTPClient POST 🌐] Sending POST to ${targetUrl} (Body: ${payloadStr})...`, type: 'stdout' }
        ]);

        fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payloadStr
        })
          .then(async res => {
            const bodyText = await res.text();
            executionVars['httpCode'] = res.status;
            executionVars['payload'] = bodyText;
            executionVars['__http_response'] = bodyText;
            setTerminalLogs(prev => [
              ...prev,
              { text: `[HTTPClient POST 200 OK] Response (${res.status}): ${bodyText.slice(0, 150)}${bodyText.length > 150 ? '...' : ''}`, type: 'stdout' }
            ]);
            next();
          })
          .catch(err => {
            executionVars['httpCode'] = -1;
            executionVars['payload'] = '';
            setTerminalLogs(prev => [
              ...prev,
              { text: `[HTTPClient POST Failed ❌] ${err.message}`, type: 'stdout' }
            ]);
            next();
          });
        return; // async step
      } else if (item.type === 'mqtt_config') {
        const { server, port } = item.value;
        executionVars['__mqtt_server'] = server;
        executionVars['__mqtt_port'] = port;
        setTerminalLogs(prev => [
          ...prev,
          { text: `[MQTT] Broker configured: ${server}:${port}`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'mqtt_connect') {
        const server = executionVars['__mqtt_server'] || 'broker.hivemq.com';
        const clientId = item.value.clientId || `ESP_Sim_${Math.floor(Math.random()*10000)}`;
        setTerminalLogs(prev => [
          ...prev,
          { text: `[MQTT] Connecting to Broker "${server}" (Client ID: ${clientId})...`, type: 'stdout' },
          { text: `[MQTT] Connected to Broker "${server}"! Status: ONLINE 🟢`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'mqtt_publish') {
        const topic = resolveSensorReads(String(item.value.topic)).replace(/^['"]|['"]$/g, '');
        const rawPayload = resolveSensorReads(String(item.value.payload));
        const evaluatedPayload = evalExpr(rawPayload, executionVars);
        const server = executionVars['__mqtt_server'] || 'broker.hivemq.com';
        
        setTerminalLogs(prev => [
          ...prev,
          { text: `[MQTT PUBLISH 🚀] Topic: "${topic}" -> Payload: "${evaluatedPayload}" (Broker: ${server})`, type: 'stdout' }
        ]);

        fetch(`https://broker.hivemq.com/api/v1/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, payload: String(evaluatedPayload) })
        }).catch(() => {});
        next();
      } else if (item.type === 'mqtt_subscribe') {
        const topic = resolveSensorReads(String(item.value.topic)).replace(/^['"]|['"]$/g, '');
        setTerminalLogs(prev => [
          ...prev,
          { text: `[MQTT SUBSCRIBE 📥] Subscribed to Topic: "${topic}"`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'ws_connect') {
        const targetUrl = item.value.url;
        setTerminalLogs(prev => [
          ...prev,
          { text: `[WEBSOCKET 🔌] Connecting to ${targetUrl}...`, type: 'stdout' },
          { text: `[WEBSOCKET] Connected to ${targetUrl}! Status: ONLINE 🟢`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'ws_send') {
        const rawMsg = resolveSensorReads(String(item.value.msg));
        const evaluatedMsg = evalExpr(rawMsg, executionVars);
        setTerminalLogs(prev => [
          ...prev,
          { text: `[WEBSOCKET OUT 📤] Sent message: "${evaluatedMsg}"`, type: 'stdout' }
        ]);
        next();
      } else if (item.type === 'delay') {
        const ms = item.value as number;
        const t = setTimeout(next, ms);
        simulationTimeouts.current.push(t);
      }
    };

    if (hasArduinoStructure) {
      const runLoopIteration = () => {
        if (!isRunningRef.current) return;
        executeBlock(loopQueue, 0, () => {
          if (!isRunningRef.current) return;
          if (loopQueue.length > 0) {
            const t = setTimeout(runLoopIteration, 20);
            simulationTimeouts.current.push(t);
          } else {
            setRobotCommand('STOP');
          }
        });
      };

      // 1. Run global statements (defines, global variables)
      executeBlock(globalQueue, 0, () => {
        if (!isRunningRef.current) return;
        // 2. Run setup() ONCE
        executeBlock(setupQueue, 0, () => {
          if (!isRunningRef.current) return;
          // 3. Run loop() repeatedly
          runLoopIteration();
        });
      });
    } else {
      const runIteration = () => {
        if (!isRunningRef.current) return;
        executeBlock(queue, 0, () => {
          if (code.includes('while True') || code.includes('void loop') || code.includes('while(true)')) {
            const t = setTimeout(runIteration, 20);
            simulationTimeouts.current.push(t);
          } else {
            setRobotCommand('STOP');
          }
        });
      };

      runIteration();
    }
  };

  const handleBlynkVirtualWrite = (vpin: string, val: number) => {
    setBlynkVirtualPins(prev => ({ ...prev, [vpin]: val }));
    
    // Real Blynk Cloud Push on Simulator Widget click
    const cleanAuth = blynkAuthTokenRef.current;
    if (cleanAuth && cleanAuth !== 'YourAuthToken' && cleanAuth !== 'AUTH_TOKEN') {
      fetch(`https://blynk.cloud/external/api/update?token=${cleanAuth}&${vpin.toLowerCase()}=${val}`)
        .catch(() => {});
    }

    setTerminalLogs(prev => [
      ...prev,
      { text: `[BLYNK CLOUD] Mobile App event: BLYNK_WRITE(${vpin}) = ${val}`, type: 'stdout' }
    ]);

    const handlerQueue = blynkHandlersRef.current[vpin] || blynkHandlersRef.current[vpin.toUpperCase()];
    if (handlerQueue && handlerQueue.length > 0) {
      const blynkVars: Record<string, any> = {
        param: val,
        'param.asInt()': val,
        'param.asInt': val,
        'param.asString()': String(val),
        'param.asDouble()': val
      };

      const runHandlerBlock = (bq: any[], idx: number) => {
        if (idx >= bq.length) return;
        const item = bq[idx];
        if (item.type === 'digitalWrite') {
          let { pin, state } = item.value;
          if (blynkVars[pin] !== undefined) pin = String(blynkVars[pin]);
          const evalState = blynkVars[state] !== undefined ? blynkVars[state] : state;
          const isHigh = evalState === 'HIGH' || evalState === '1' || evalState === 1 || evalState === 'true' || evalState === true;
          const finalState = isHigh ? 'HIGH' : 'LOW';
          setPinStates(prev => ({ ...prev, [pin]: finalState }));
          setTerminalLogs(prev => [
            ...prev,
            { text: `[GPIO] Pin ${pin} -> ${finalState}`, type: 'stdout' }
          ]);
        } else if (item.type === 'if') {
          const resolvedCond = item.value.condition;
          const condVal = evalExpr(resolvedCond, blynkVars);
          const condBool = condVal === 'true' || condVal === true || (typeof condVal === 'number' && condVal !== 0);
          if (condBool) {
            runHandlerBlock(item.value.ifBody, 0);
          } else if (item.value.elseBody) {
            runHandlerBlock(item.value.elseBody, 0);
          }
        }
        runHandlerBlock(bq, idx + 1);
      };

      runHandlerBlock(handlerQueue, 0);
    }
  };

  const handleArduinoHardwareAction = async (action: 'verify' | 'upload' | 'flash-firmware') => {
    if (isHardwareActionRef.current) {
      return;
    }
    // ── Trial Gate: block upload if trial expired ──
    if (action === 'upload' && trialStatus.isExpired) {
      setPaywallFeature('Upload');
      setShowPaywallModal(true);
      return;
    }

    let activeCode = files[activeFile] || '';
    if (board === 'BBC micro:bit') {
      activeCode = files['python/main.py'] || files[activeFile] || '';
    } else if (!activeFile.toLowerCase().endsWith('.ino')) {
      // If user is currently editing a .h, .cpp, or .c file, find the primary .ino sketch file
      const mainInoKey = Object.keys(files).find(f => f.toLowerCase().endsWith('.ino'));
      if (mainInoKey && files[mainInoKey]) {
        activeCode = files[mainInoKey];
      }
    }
    const fileExt = activeFile.split('.').pop() || 'ino';

    const urlEncodeHelperCode = `#include <Arduino.h>\nstatic inline String urlEncode(String str) {
  String encodedString = "";
  for (int i = 0; i < str.length(); i++) {
    char c = str.charAt(i);
    if (c == ' ') encodedString += '+';
    else if (isalnum(c)) encodedString += c;
    else {
      char code0 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code0 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      char code1 = c + '0';
      if (c > 9) code1 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code1;
      encodedString += code0;
    }
  }
  return encodedString;
}\n\n`;

    const preparedFiles: { [key: string]: string } = { ...files };
    Object.keys(preparedFiles).forEach(fname => {
      let content = preparedFiles[fname] || '';
      if (content.includes('urlEncode')) {
        content = content
          .replace(/static\s+inline\s+String\s+urlEncode[\s\S]*?\n\}/g, '')
          .replace(/#include\s*<Arduino\.h>\s*String\s+urlEncode\s*\([^)]*\);\s*/g, '')
          .replace(/String\s+urlEncode\s*\([^)]*\);\s*/g, '');

        const hasUserImplementation = /String\s+urlEncode\s*\(/.test(content);

        if (hasUserImplementation) {
          content = '#include <Arduino.h>\nString urlEncode(String str);\n' + content;
        } else {
          content = urlEncodeHelperCode + content;
        }
      }
      if ((fname.endsWith('.cpp') || fname.endsWith('.c')) && (content.includes('WiFi') || content.includes('WL_CONNECTED')) && !content.includes('<WiFi.h>') && !content.includes('<ESP8266WiFi.h>')) {
        content = '#include <WiFi.h>\n' + content;
      }
      preparedFiles[fname] = content;
    });

    if (activeCode.includes('urlEncode')) {
      activeCode = activeCode
        .replace(/static\s+inline\s+String\s+urlEncode[\s\S]*?\n\}/g, '')
        .replace(/#include\s*<Arduino\.h>\s*String\s+urlEncode\s*\([^)]*\);\s*/g, '')
        .replace(/String\s+urlEncode\s*\([^)]*\);\s*/g, '');

      const hasUserImplementation = /String\s+urlEncode\s*\(/.test(activeCode);

      if (hasUserImplementation) {
        activeCode = '#include <Arduino.h>\nString urlEncode(String str);\n' + activeCode;
      } else {
        activeCode = urlEncodeHelperCode + activeCode;
      }
    }

    const req = (window as any).__electronRequire || (window as any).require;

    // ── WEB BROWSER MODE: Cloud Compiler + Web Serial API Flashing (Schematik.io style) ──
    if (!req) {
      isHardwareActionRef.current = true;
      setIsTerminalCollapsed(false);
      setTerminalTab('terminal');
      setTerminalLogs([]);
      setInteractiveTerminalLogs([]);
      if (action === 'upload') {
        setSerialRawOutput('');
      }
      setBuildProgress(5);
      setBuildStatusText(
        action === 'verify'
          ? 'Compiling sketch via Cloud Compiler...'
          : action === 'upload'
          ? 'Compiling & uploading via Web Serial...'
          : 'Flashing Firmware via Web Serial...'
      );

      try {
        if (isSerialConnected) {
          setIsSerialConnected(false);
        }
        await stopWebSerialMonitor();

        const webRes = await executeWebHardwareAction({
          action,
          board,
          port,
          fileExt,
          files: preparedFiles,
          onLog: (log) => {
            setTerminalLogs(prev => [...prev, log]);
            setInteractiveTerminalLogs(prev => [
              ...prev,
              { text: log.text, type: log.type === 'stdout' || log.type === 'info' ? 'output' : log.type }
            ]);
          },
          onProgress: (pct: number) => {
            setBuildProgress(pct);
          },
          onPortSelected: (newAddr: string) => {
            setPort(newAddr);
            refreshPorts();
          },
        });

        if (webRes.selectedPort && webRes.selectedPort !== port) {
          setPort(webRes.selectedPort);
          refreshPorts();
        }

        if (webRes.success) {
          setBuildStatusText(
            action === 'verify'
              ? 'Compilation Successful'
              : action === 'upload'
              ? 'Upload Successful 🎉'
              : 'Firmware Flashed Successfully 🎉'
          );
          if (action === 'upload') {
            setTerminalLogs(prev => [
              ...prev,
              {
                text: '📡 Program sedang berjalan di board! Buka tab "Serial Monitor" jika ingin melihat output Serial.',
                type: 'info',
              },
            ]);
            setTimeout(async () => {
              const targetPortAddr = webRes.selectedPort || port;
              const started = await startWebSerialMonitor(
                targetPortAddr,
                serialBaudrate,
                (chunk: string) => setSerialRawOutput(prev => (prev + chunk).slice(-50000)),
                () => setIsSerialConnected(false)
              );
              if (started.success) {
                setIsSerialConnected(true);
                setConnectedPort(started.address || targetPortAddr);
              }
            }, 800);
          }
        } else {
          setBuildStatusText(
            action === 'verify'
              ? 'Compilation Failed'
              : action === 'upload'
              ? 'Upload Failed'
              : 'Flash Firmware Failed'
          );
        }
      } catch (err: any) {
        console.error(err);
        setBuildProgress(100);
        setBuildStatusText('Error executing Web hardware action');
        setTerminalLogs(prev => [...prev, { text: `Web Hardware Error: ${err?.message || err}`, type: 'error' }]);
      } finally {
        isHardwareActionRef.current = false;
      }
      return;
    }

    isHardwareActionRef.current = true;
    setTerminalTab('terminal');
    setTerminalLogs([]);
    setInteractiveTerminalLogs([]);
    setBuildProgress(10);
    setBuildStatusText(action === 'verify' ? 'Compiling sketch...' : action === 'upload' ? 'Compiling & uploading sketch...' : 'Downloading & Flashing Firmware...');
    
    try {
      const electron = req('electron');
      // Stop serial monitor to free up the COM port before uploading
      try {
        await electron.ipcRenderer.invoke('stop-serial-monitor');
      } catch (serialErr) {
        console.warn('Could not stop serial monitor (might not be registered yet):', serialErr);
      }

      const targetBoardArg = (board === 'ESP32 DevKit V1' || (board || '').toLowerCase().includes('esp32')) 
        ? 'esp32:esp32:esp32:PartitionScheme=huge_app,UploadSpeed=921600' 
        : board;

      const result = await electron.ipcRenderer.invoke('arduino-upload', {
        code: activeCode,
        board: targetBoardArg,
        port,
        action,
        fileExt,
        files: preparedFiles,
        userId: authUser?.id
      });
      
      setBuildProgress(100);
      if (result && result.success) {
        setBuildStatusText(action === 'verify' ? 'Compilation Successful' : action === 'upload' ? 'Upload Successful 🎉' : 'Firmware Flashed Successfully 🎉');
        // After successful upload, switch to Serial Monitor to see real hardware output
        if (action === 'upload') {
          setTimeout(() => {
            setTerminalTab('serial');
            try {
              const electron = req('electron');
              electron.ipcRenderer.invoke('start-serial-monitor', port, board, serialBaudrate);
              setIsSerialConnected(true);
              setConnectedPort(port);
            } catch(e) {}
          }, 500);
        }
      } else {
        setBuildStatusText(action === 'verify' ? 'Compilation Failed' : action === 'upload' ? 'Upload Failed' : 'Flash Firmware Failed');
      }
    } catch (err: any) {
      console.error(err);
      setBuildProgress(100);
      setBuildStatusText('Error executing action');
      setInteractiveTerminalLogs(prev => [
        ...prev,
        { text: `System Error: ${err.message || err}`, type: 'error' }
      ]);
    } finally {
      // Always reset so port polling resumes after upload/verify — whether success or error
      isHardwareActionRef.current = false;
    }
  };

  const handleInstallCores = async () => {
    const req = (window as any).__electronRequire || (window as any).require;
    if (!req) {
      setIsTerminalCollapsed(false);
      setTerminalTab('terminal');
      setTerminalLogs(prev => [
        ...prev,
        { text: '🌐 [WEB COMPILER] Core Arduino AVR, ESP32, dan ESP8266 sudah terinstal dan siap di Cloud Compiler Server.', type: 'success' }
      ]);
      return;
    }
    
    isHardwareActionRef.current = true;
    setTerminalTab('terminal');
    setTerminalLogs([]);
    setInteractiveTerminalLogs([]);
    setBuildProgress(10);
    setBuildStatusText('Installing Arduino & ESP32 Cores (This may take several minutes)...');
    
    try {
      const electron = req('electron');
      const result = await electron.ipcRenderer.invoke('install-board-cores');
      setBuildProgress(100);
      if (result && result.success) {
        setBuildStatusText('Install Completed 🎉');
      } else {
        setBuildStatusText('Install Failed');
      }
    } catch (err: any) {
      console.error(err);
      setBuildProgress(100);
      setBuildStatusText('Error executing action');
      setInteractiveTerminalLogs(prev => [
        ...prev,
        { text: `System Error: ${err.message || err}`, type: 'error' }
      ]);
    } finally {
      isHardwareActionRef.current = false;
    }
  };

  const handleRunCode = (customCode?: string | React.MouseEvent) => {
    // ── Trial Gate: block simulator if trial expired ──
    if (trialStatus.isExpired) {
      setPaywallFeature('Simulator');
      setShowPaywallModal(true);
      return;
    }
    const codeStr = typeof customCode === 'string'
      ? customCode
      : (simFiles[simActiveFile] || simFiles['firmware/main.ino'] || files[activeFile] || files['firmware/main.ino'] || '');
    startRunAll(codeStr);
  };


  // Run Python - reads and simulates the current Simulator Python file content
  const handleRunPython = async (customCode?: string | React.MouseEvent) => {
    const codeStr = typeof customCode === 'string' ? customCode : undefined;
    const useSimWorkspace = currentTab === 'simulator' || isSimulatorExpanded;
    const targetFiles = useSimWorkspace ? simFiles : files;
    const targetActive = useSimWorkspace ? simActiveFile : activeFile;
    const pyFile = targetActive.endsWith('.py') ? targetActive
      : Object.keys(targetFiles).find(f => f.endsWith('.py')) || 'python/main.py';
    const code = codeStr !== undefined ? codeStr : (targetFiles[pyFile] || '');
    
    if (isRunning) return;
    clearSimulationTimeouts();
    setIsRunning(true);
    setPinStates({});
    setTerminalTab('terminal');
    setBuildProgress(20);
    setTerminalLogs([]);
    setInteractiveTerminalLogs([]);

    const logToBoth = (text: string, type: 'info' | 'error' | 'success' | 'stdout' = 'info') => {
      setTerminalLogs(prev => [...prev, { text, type }]);
      const termType = type === 'stdout' ? 'output' : type === 'info' ? 'output' : type;
      setInteractiveTerminalLogs(prev => [...prev, { text, type: termType }]);
    };

    setBuildStatusText(`Running ${pyFile}...`);
    logToBoth(`▶ [PYTHON] Executing: python ${pyFile}`, 'info');

    // Tetap jalankan simulator visual untuk LED/Sensor UI di sidebar
    startCodeInterpreter(code);

    const req = (window as any).__electronRequire || (window as any).require;
    const isIoTCode = !req ||
                      code.includes('import machine') || 
                      code.includes('import network') || 
                      code.includes('import cv2') || 
                      code.includes('robot.') ||
                      code.includes('import dht') ||
                      code.includes('from machine');

    if (isIoTCode) {
      logToBoth(`[HYBRID ENGINE] Menjalankan eksekusi di Virtual Simulator`, 'success');
      
      const simSSID = localStorage.getItem('simulatorWifiSSID') || 'Wokwi-GUEST';
      let delay = 500;

      if (code.includes('network.WLAN')) {
        const t1 = setTimeout(() => {
          logToBoth(`Connecting to WiFi: ${simSSID}...`, 'info');
        }, delay);
        simulationTimeouts.current.push(t1);
        delay += 1000;
        
        const t2 = setTimeout(() => {
          logToBoth(`WiFi Connected! IP Address: 192.168.1.${Math.floor(Math.random() * 200) + 10}`, 'success');
        }, delay);
        simulationTimeouts.current.push(t2);
        delay += 500;
      }

      const lines = code.split('\n');
      lines.forEach(line => {
        const printMatch = line.match(/print\s*\(\s*(['"])(.*?)\1\s*\)/);
        if (printMatch) {
          const textToPrint = printMatch[2];
          const t = setTimeout(() => {
            logToBoth(textToPrint, 'stdout');
          }, delay);
          simulationTimeouts.current.push(t);
          delay += 400;
        }
      });

      const tEnd = setTimeout(() => {
        if (!code.includes('while True:')) {
          logToBoth(`\n[PYTHON] Process exited with code 0`, 'info');
          setIsRunning(false);
          setBuildStatusText('Finished');
        } else {
          setBuildStatusText(`${pyFile} is running in loop...`);
        }
      }, delay + 500);
      simulationTimeouts.current.push(tEnd);

    } else {
      // PYTHON MURNI (REAL ENGINE)
      try {
        const electron = req('electron');
        setBuildProgress(60);
        
        const result = await electron.ipcRenderer.invoke('run-python', { code });
        
        setBuildProgress(100);
        if (!result.success) {
          logToBoth(`[PYTHON ERROR] ${result.error}`, 'error');
          setIsRunning(false);
          setBuildStatusText('Error executing action');
        } else {
          setBuildStatusText(`${pyFile} is running...`);
        }
      } catch (err: any) {
        console.error(err);
        setBuildProgress(100);
        setIsRunning(false);
        setBuildStatusText('Error executing action');
        logToBoth(`System Error: ${err.message || err}`, 'error');
      }
    }
  };

  const handleStopCode = () => {
    clearSimulationTimeouts();
    setIsRunning(false);
    setRobotCommand('STOP');
    setPinStates({});
    setActiveLoopPrints([]);
    setHasLoop(false);
    setLoopLimit(Infinity);
    setBuildProgress(0);
    setBuildStatusText('Stopped');
    setTerminalLogs(prev => [...prev, { text: '⏹ Execution stopped by user.', type: 'error' }]);
    setInteractiveTerminalLogs(prev => [...prev, { text: '⏹ Execution stopped by user.', type: 'error' }]);

    try {
      const req = (window as any).__electronRequire || (window as any).require;
      const electron = req('electron');
      electron.ipcRenderer.invoke('stop-python');
    } catch(e) {}
  };

  // Ctrl+S to save active file
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSavedFiles(prev => ({ ...prev, [activeFile]: files[activeFile] }));
        setTerminalLogs(prev => [...prev, { text: `✓ File '${activeFile}' disimpan.`, type: 'success' }]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, files]);

  // Real-time sensor feed updater
  // telemetry simulation loop removed

  // Loop prints simulation interval
  useEffect(() => {
    let interval: any;
    if (isRunning && hasLoop) {
      let iterationCount = 0;
      interval = setInterval(() => {
        if (iterationCount >= loopLimit) {
          clearInterval(interval);
          setBuildStatusText('Finished');
          setTerminalLogs(prev => [
            ...prev,
            { text: `🚀 Process finished with exit code 0.`, type: 'success' }
          ]);
          setInteractiveTerminalLogs(prev => [
            ...prev,
            { text: `🚀 Process finished with exit code 0.`, type: 'success' }
          ]);
          setIsRunning(false);
          setActiveLoopPrints([]);
          setHasLoop(false);
          setLoopLimit(Infinity);
          return;
        }

        if (activeLoopPrints.length > 0) {
          activeLoopPrints.forEach(text => {
            setTerminalLogs(prev => [...prev, { text: `  ${text}`, type: 'stdout' }]);
            setInteractiveTerminalLogs(prev => [...prev, { text: `  ${text}`, type: 'output' }]);
          });
        } else {
          setTerminalLogs(prev => [...prev, { text: `  Loop iteration ${iterationCount + 1}: OK`, type: 'stdout' }]);
        }

        iterationCount++;
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isRunning, hasLoop, activeLoopPrints, loopLimit]);

  // Handle panel resizing events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSplit) {
        const container = document.getElementById('workspace-split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const ratio = ((e.clientX - rect.left) / rect.width) * 100;
          setSplitRatio(Math.max(5, Math.min(95, ratio))); // Expanded bounds (5% to 95%)
        }
      }
      if (isResizingTerminal) {
        const height = window.innerHeight - e.clientY;
        setTerminalHeight(Math.max(100, Math.min(600, height)));
      }
      if (isResizingSimulator) {
        const container = document.getElementById('workspace-split-container');
        if (container) {
          const rect = container.getBoundingClientRect();
          const newWidth = rect.right - e.clientX;
          setSimulatorWidth(Math.max(220, Math.min(600, newWidth)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingSplit(false);
      setIsResizingTerminal(false);
      setIsResizingSimulator(false);
    };

    if (isResizingSplit || isResizingTerminal || isResizingSimulator) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSplit, isResizingTerminal, isResizingSimulator]);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [terminalHeight, isTerminalCollapsed]);

  const handleSendChat = async (customPrompt?: string) => {
    // ── Trial Gate: block AI if trial expired ──
    if (trialStatus.isExpired) {
      setPaywallFeature('AI');
      setShowPaywallModal(true);
      return;
    }
    const text = (customPrompt || aiInput).trim();
    if (!text || isAiLoading) return;

    const userMsg: ChatMessage = { sender: 'user', message: text };
    setAiChat(prev => [...prev, userMsg]);
    if (!customPrompt) setAiInput('');
    setIsAiLoading(true);

    const safetyTimer = setTimeout(() => {
      setIsAiLoading(false);
    }, 60000);

    try {
      const context = {
        board: board || 'Arduino Uno',
        activeFileName: activeFile || 'firmware/main.ino',
        activeCode: files[activeFile] || '',
        activeComponents: simulatorActiveComponents || [],
        wires: simulatorWires || [],
        terminalLogs: terminalLogs || []
      };

      const res = await processAiMessage(text, aiChat, kiloConfig, context);
      setAiChat(prev => [...prev, { sender: 'ai', message: res.text, isKiloCode: res.isKiloCode }]);
    } catch (err: any) {
      setAiChat(prev => [...prev, { sender: 'ai', message: `⚠️ Terjadi kesalahan: ${err.message || 'Gagal memproses pesan'}` }]);
    } finally {
      clearTimeout(safetyTimer);
      setIsAiLoading(false);
    }
  };

  const handleApplyCodeToEditor = (newCode: string) => {
    if (!activeFile) return;
    setFiles(prev => ({
      ...prev,
      [activeFile]: newCode
    }));
    const inoFile = Object.keys(files).find(f => f.endsWith('.ino')) || 'firmware/main.ino';
    const pyFile = Object.keys(files).find(f => f.endsWith('.py')) || 'python/main.py';
    if (activeFile.endsWith('.ino')) {
      try {
        const xml = arduinoToBlocklyXml(newCode);
        setWorkspaceXmls(prev => ({ ...prev, [activeFile]: xml, [inoFile]: xml, [pyFile]: xml }));
        setLearningLessonLoadedCount(c => c + 1);
      } catch (e) {
        console.warn('Failed to parse applied C++ code to blocks:', e);
      }
    } else if (activeFile.endsWith('.py')) {
      try {
        const xml = pythonToBlocklyXml(newCode);
        setWorkspaceXmls(prev => ({ ...prev, [activeFile]: xml, [inoFile]: xml, [pyFile]: xml }));
        setLearningLessonLoadedCount(c => c + 1);
      } catch (e) {
        console.warn('Failed to parse applied Python code to blocks:', e);
      }
    }
    setInteractiveTerminalLogs(prev => [
      ...prev,
      { text: `✨ [Asisten Robolab AI] Kode berhasil diterapkan ke berkas '${activeFile}'`, type: 'success' }
    ]);
  };

  const handleClearChat = () => {
    setAiChat([]);
  };

  const handleOpenTemplate = (name: string) => {
    setShowExplorer(true);
    const proj = allProjectsList.find(p => p.name === name) || PROJECTS_LIST.find(p => p.name === name);
    if (!proj) return;

    // Choose active file based on board
    const primaryFile = (proj.board === 'BBC micro:bit') ? 'python/main.py' : 'firmware/main.ino';

    setProjectName(proj.name?.toUpperCase() || "");
    setBoard(proj.board as "ESP32 DevKit V1" | "BBC micro:bit" | "Arduino Uno");
    setActiveFile(primaryFile);
    setWorkspaceMode('split');
    setIsBlocklyCollapsed(false);
    setIsEditorCollapsed(false);
    if (uiMode === 'student') setUiMode('pro');
    setCurrentTab('ide');

    // Set handcrafted code sebagai fallback awal
    const libName = ((proj as any).libraryName || '').toLowerCase();
    const libInfo = packages.arduino.find((p: any) => (p.name || '').toLowerCase() === libName);
    const api = (proj as any).parsedApi || libInfo?.parsedApi;

    const initialIno = proj.ino || '';
    let initialPy = proj.py || '';
    if ((!initialPy || initialPy.startsWith('# Contoh Library') || initialPy.trim() === '') && initialIno) {
      try {
        initialPy = arduinoToPython(initialIno, api) || initialPy;
      } catch (_) {}
    }

    setFiles((prev: any) => ({
      ...prev,
      'firmware/main.ino': initialIno,
      'python/main.py': initialPy
    }));

    setSimFiles((prev: any) => ({
      ...prev,
      'firmware/main.ino': initialIno,
      'python/main.py': initialPy
    }));

    if (proj.board) {
      setSimBoard(proj.board as "ESP32 DevKit V1" | "BBC micro:bit" | "Arduino Uno");
    }

    // Auto-generate blockly XML jika template dari library belum memiliki XML
    let targetXml = proj.xml;
    if ((!targetXml || targetXml.trim() === '') && initialIno) {
      try {
        targetXml = arduinoToBlocklyXml(initialIno, api);
      } catch (err) {
        targetXml = '<xml xmlns="https://developers.google.com/blockly/xml"></xml>';
      }
    }

    // Load XML ke workspace Blockly
    setWorkspaceXmls({
      'firmware/main.ino': targetXml,
      'python/main.py': targetXml
    });

    setSimWorkspaceXmls({
      'firmware/main.ino': targetXml,
      'python/main.py': targetXml
    });

    // Aktifkan auto-sync HANYA jika targetXml memiliki block statements (hindari empty overwrite)
    const hasBlocksInXml = !!(targetXml && (targetXml.includes('<statement name="STACK">') || targetXml.includes('custom_library_')));
    setSyncStatuses({
      'firmware/main.ino': hasBlocksInXml,
      'python/main.py': hasBlocksInXml
    });

    setSimSyncStatuses({
      'firmware/main.ino': hasBlocksInXml,
      'python/main.py': hasBlocksInXml
    });

    setSensorData(prev => ({ ...prev, rfidCardPresent: false }));

    // Reset simulator to show only the components this project uses
    setSimulatorActiveComponents(proj.components || []);
    setSimulatorWires([]);
    setSimulatorPositions({
      board: { x: 85, y: 15 },
      breadboard: { x: 18, y: 380 },
      led: { x: 15, y: 420 },
      servo: { x: 110, y: 420 },
      ultrasonic: { x: 15, y: 520 },
      pot: { x: 15, y: 630 },
      button: { x: 120, y: 530 },
      lcd: { x: 210, y: 530 },
      dht11: { x: 120, y: 640 },
      rfid: { x: 160, y: 640 }
    });

    setTerminalLogs((prev: any) => [...prev, { text: `✓ Loaded template: ${name} (auto-sync aktif)`, type: 'success' }]);
  };


  const handleInstallPkg = async (type: 'arduino' | 'python', name: string) => {
    const req = (window as any).__electronRequire || (window as any).require;
    setIsTerminalCollapsed(false);
    setTerminalTab('terminal');
    setInstallingMap(prev => ({ ...prev, [name]: { loading: true, progress: 'Mengunduh...' } }));
    setTerminalLogs((prev: any) => [...prev, { text: `📦 Memulai instalasi package ${name}...`, type: 'info' }]);
    
    if (!req) {
      setTimeout(() => {
        setPackages((prev: any) => ({
          ...prev,
          [type]: prev[type].map((p: any) => p.name === name ? { ...p, installed: true } : p)
        }));
        setInstallingMap(prev => ({ ...prev, [name]: { loading: false } }));
        setTerminalLogs((prev: any) => [...prev, { text: `✓ Package ${name} installed (Web Demo mode).`, type: 'success' }]);
      }, 1000);
      return;
    }

    try {
      const electron = req('electron');
      const channel = type === 'arduino' ? 'install-arduino-lib' : 'install-python-pkg';
      const result = await electron.ipcRenderer.invoke(channel, name);
      if (result && result.success) {
        setPackages((prev: any) => ({
          ...prev,
          [type]: prev[type].map((p: any) => p.name === name ? { ...p, installed: true } : p)
        }));
        setTerminalLogs((prev: any) => [...prev, { text: `✅ Package ${name} berhasil diinstal!`, type: 'success' }]);
      } else {
        setTerminalLogs((prev: any) => [...prev, { text: `❌ Gagal menginstal package ${name}.`, type: 'error' }]);
      }
    } catch (err: any) {
      setTerminalLogs((prev: any) => [...prev, { text: `Error: ${err.message || err}`, type: 'error' }]);
    } finally {
      setInstallingMap(prev => ({ ...prev, [name]: { loading: false } }));
    }
  };

  const handleInstallBoardCore = async (displayName: string, coreName: string, url?: string) => {
    const req = (window as any).__electronRequire || (window as any).require;
    setIsTerminalCollapsed(false);
    setTerminalTab('terminal');
    setInstallingMap(prev => ({ ...prev, [displayName]: { loading: true, progress: 'Mengunduh Core...' } }));
    setTerminalLogs((prev: any) => [...prev, { text: `⚙️ Memulai instalasi Board Core '${displayName}' (${coreName})...`, type: 'info' }]);
    
    if (!req) {
      setPackages((prev: any) => ({
        ...prev,
        boards: prev.boards.map((b: any) => b.name === displayName ? { ...b, installed: true } : b)
      }));
      setInstallingMap(prev => ({ ...prev, [displayName]: { loading: false } }));
      return;
    }

    try {
      const electron = req('electron');
      const result = await electron.ipcRenderer.invoke('install-board-core', { coreName, url });
      if (result && result.success) {
        setPackages((prev: any) => ({
          ...prev,
          boards: prev.boards.map((b: any) => b.name === displayName ? { ...b, installed: true } : b)
        }));
        setTerminalLogs((prev: any) => [...prev, { text: `✅ Board Core '${displayName}' berhasil diinstal!`, type: 'success' }]);
      } else {
        setTerminalLogs((prev: any) => [...prev, { text: `❌ Gagal menginstal Board Core '${displayName}'.`, type: 'error' }]);
      }
    } catch (err: any) {
      setTerminalLogs((prev: any) => [...prev, { text: `Error: ${err.message || err}`, type: 'error' }]);
    } finally {
      setInstallingMap(prev => ({ ...prev, [displayName]: { loading: false } }));
    }
  };



  const renderLearningVisualizer = () => {
    if (learningCategory === 'hardware') {
      switch (activeLessonIndex) {
        case 0: return <ArduinoPinoutVisualizer />;
        case 1: return <DigitalOutputVisualizer />;
        case 2: return <DigitalInputVisualizer />;
        case 3: return <AdcHardwareVisualizer />;
        case 4: return <PwmHardwareVisualizer />;
        case 5: return <SerialHardwareVisualizer />;
        case 6: return <I2cBusVisualizer />;
        case 7: return <InterruptHardwareVisualizer />;
        default: return <ArduinoPinoutVisualizer />;
      }
    }

    if (learningCategory === 'fundamental') {
      switch (activeLessonIndex) {
        case 0:
          return (
            <div className="flex flex-col h-full gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preview Terminal</span>
              <div className="flex-1 rounded-xl bg-slate-950 p-4 font-mono text-[10px] text-emerald-400 border border-slate-800 shadow-inner flex flex-col justify-between min-h-[260px]">
                <div className="space-y-2">
                  <div className="text-slate-600 border-b border-slate-900 pb-1.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                    <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                    <span className="ml-1 text-[8.5px]">python3 terminal</span>
                  </div>
                  <div>
                    <span className="text-slate-500">&gt;&gt;&gt; </span>
                    <span className="text-white">print("Halo! Selamat datang di RoboLab Studio.")</span>
                  </div>
                  <div className="text-sky-300">Halo! Selamat datang di RoboLab Studio.</div>
                  <div>
                    <span className="text-slate-500">&gt;&gt;&gt; </span>
                    <span className="text-white">print("Python adalah bahasa pemrograman utama untuk AI.")</span>
                  </div>
                  <div className="text-sky-300">Python adalah bahasa pemrograman utama untuk AI.</div>
                  <div className="animate-pulse">
                    <span className="text-slate-500">&gt;&gt;&gt; </span>
                    <span className="w-1.5 h-3 bg-emerald-400 inline-block align-middle ml-0.5"></span>
                  </div>
                </div>
                <div className="text-slate-600 text-[8px] text-right">Process finished with exit code 0</div>
              </div>
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
                <span className="font-bold text-blue-400 block mb-0.5">💡 Tips Singkat</span>
                Fungsi <code className="text-blue-300 px-1 py-0.5 bg-blue-950/40 rounded">print()</code> menampilkan data ke konsol standard output. Sangat berguna untuk melihat status variabel saat debug program.
              </div>
            </div>
          );
        case 1:
          return (
            <div className="flex flex-col h-full gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alokasi Memori Variabel</span>
              <div className="flex-1 rounded-xl bg-slate-900/40 p-4 border border-slate-800 flex flex-col gap-2.5 min-h-[260px] justify-center">
                <div className="text-center text-[9px] text-slate-500 mb-1">Visualisasi RAM / Memori Sistem</div>
                {[
                  { name: 'nama_robot', val: '"RoboRover"', type: 'str (String)', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' },
                  { name: 'versi', val: '2.0', type: 'float (Desimal)', color: 'border-blue-500/20 bg-blue-500/5 text-blue-400' },
                  { name: 'sensor_aktif', val: 'True', type: 'bool (Boolean)', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
                  { name: 'jarak_aman', val: '30', type: 'int (Integer)', color: 'border-amber-500/20 bg-amber-500/5 text-amber-400' }
                ].map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-2 rounded-lg border ${item.color} font-mono text-[9px]`}
                  >
                    <div>
                      <span className="text-slate-500">var </span>
                      <span className="font-bold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 text-[7px]">{item.type}</span>
                      <span className="font-bold bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{item.val}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
                <span className="font-bold text-blue-400 block mb-0.5">💡 Tipe Dinamis</span>
                Python mendeteksi tipe data variabel secara otomatis saat Anda memberikan nilai pertama kali.
              </div>
            </div>
          );
        case 2:
          return <StringPlayground />;
        case 3:
          return <ConditionalPlayground />;
        case 4:
          return <LoopPlayground />;
        case 5:
          return <FunctionPlayground />;
        case 6:
          return <OopPlayground />;
        case 7:
          return <InheritancePlayground />;
        default:
          return null;
      }
    } else {
      switch (activeLessonIndex) {
        case 0:
          return <BlinkVisualizer />;
        case 1:
          return <PwmVisualizer />;
        case 2:
          return <AdcVisualizer virtualPotVal={virtualPotVal} setVirtualPotVal={setVirtualPotVal} />;
        case 3:
          return <OledVisualizer />;
        case 4:
          return <UltrasonicVisualizer virtualDistVal={virtualDistVal} setVirtualDistVal={setVirtualDistVal} />;
        case 5:
          return <AsyncVisualizer asyncLed1={asyncLed1} asyncLed2={asyncLed2} />;
        case 6:
          return <WebServerVisualizer virtualWebLed={virtualWebLed} setVirtualWebLed={setVirtualWebLed} />;
        case 7:
          return <PidVisualizer pidHistory={pidHistory} />;
        default:
          return null;
      }
    }
  };

  return (
    <div 
      className={`w-screen h-screen flex flex-col font-sans overflow-hidden relative app-root theme-${themeMode} color-${themeColor}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 0. BLOCKING UPDATE OVERLAY */}
      {['available', 'downloading', 'downloaded'].includes(updateStatus.status) && (() => {
        const status = updateStatus.status;
        const version = (updateStatus as any).version || '';
        const percent = status === 'downloaded' ? 100 : ((updateStatus as any).percent || 0);
        const transferred = (updateStatus as any).transferred || 0;
        const total = (updateStatus as any).total || 0;
        
        return (
          <div className={`fixed inset-0 z-[100005] flex flex-col items-center justify-center select-none ${themeMode === 'light' ? 'bg-slate-900/60 backdrop-blur-xl' : 'bg-black/80 backdrop-blur-md'}`}>
            <div className="absolute w-[300px] h-[300px] rounded-full blur-[120px] bg-cyan-500/10 animate-pulse" />
            
            <div className={`max-w-md w-full mx-4 p-6 rounded-2xl border shadow-2xl flex flex-col items-center text-center gap-4 relative overflow-hidden ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#0f111a] border-white/10 text-white'}`}>
              
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <img src="./icon-only.png" className="w-11 h-11 object-contain animate-bounce" alt="RoboLab Logo" />
              </div>
              
              <div className="space-y-1">
                <h3 className={`text-base font-bold tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Memasang Pembaruan RoboLab Studio
                </h3>
                <p className={`text-xs ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {status === 'available' && `Menghubungkan & menyiapkan unduhan versi v${version}...`}
                  {status === 'downloading' && `Sedang mengunduh pembaruan v${version}...`}
                  {status === 'downloaded' && `Selesai mengunduh! Memasang & memulai ulang aplikasi...`}
                </p>
              </div>

              <div className="w-full mt-2 space-y-1.5">
                <div className={`w-full h-2 rounded-full overflow-hidden ${themeMode === 'light' ? 'bg-slate-100' : 'bg-white/5'}`}>
                  <div 
                    className="h-2 rounded-full bg-cyan-500 transition-all duration-300 bg-gradient-to-r from-cyan-400 to-blue-500" 
                    style={{ width: `${percent}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>{percent}%</span>
                  {status === 'downloading' && total > 0 && (
                    <span>
                      {(transferred / 1024 / 1024).toFixed(1)} MB / {(total / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                <span>Harap tunggu, proses ini tidak dapat dibatalkan.</span>
              </div>
            </div>
          </div>
        );
      })()}

      {isDraggingFile && (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-md border-4 border-dashed border-indigo-500 rounded-2xl z-[99999] flex flex-col items-center justify-center pointer-events-none animate-pulse m-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-white-force">Lepaskan Berkas untuk Membuka</h3>
          <p className="text-xs text-indigo-300 mt-1">Format yang didukung: .ino, .c, .h, .cpp, .hpp, .py, atau .hex</p>
        </div>
      )}
      <AnimatePresence mode="wait">
        {showLoading && (
          <motion.div
            key="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#07080d] z-[9999]"
            style={{ pointerEvents: 'all' }}
          >
            {/* Ambient loading glow background */}
            <div className="absolute w-[400px] h-[400px] rounded-full blur-[100px] bg-blue-500/10 -z-10" />
            
            {/* Swirling transparent logo with rotation and pulse */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.95, 1.05, 0.95],
                opacity: 1,
                rotate: 360
              }}
              transition={{ 
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                rotate: { duration: 1.5, ease: "easeOut" },
                opacity: { duration: 0.5 }
              }}
              className="w-24 h-24 mb-6 flex items-center justify-center"
            >
              <img src="./icon-only.png" className="w-20 h-20 object-contain" alt="RoboLab Logo" />
            </motion.div>
            
            {/* Brand Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl font-bold tracking-widest text-white font-display"
              style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
            >
              ROBOLAB STUDIO
            </motion.h1>
            
            {/* Progress line */}
            <div className="w-40 h-[2px] bg-white/5 rounded-full overflow-hidden mt-4 relative">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient orbs */}
      <div className="orb orb-blue" style={{width: 600, height: 600, top: -200, left: -100, opacity: 0.4}} />
      <div className="orb orb-purple" style={{width: 500, height: 500, bottom: -150, right: -100, opacity: 0.35, animationDelay: '4s'}} />
      <div className="orb orb-cyan" style={{width: 300, height: 300, top: '40%', left: '40%', opacity: 0.2, animationDelay: '8s'}} />
      
      {/* 1 & 2. TOP HEADER & ACTIONS TOOLBAR */}
            <TopMenuBar 
        isSerialConnected={isSerialConnected}
        connectedPort={connectedPort}
        themeMode={themeMode}
        board={board}
        setBoard={(b: string) => setBoard(b as any)}
        port={port}
        setPort={setPort}
        availablePorts={availablePorts}
        onRefreshPorts={refreshPorts}
        onRequestWebPort={handleRequestWebPort}
        setShowSettingsModal={setShowSettingsModal}
        setShowHelpModal={setShowHelpModal}
        setShowAboutModal={setShowAboutModal}
        setShowFeedbackModal={setShowFeedbackModal}
        onOpenBoardManager={() => setShowBoardManagerModal(true)}
        onOpenLibraryManager={() => setShowLibraryManagerModal(true)}
        onOpenExtensions={() => setShowExtensionsModal(true)}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        handleNativeOpenFile={handleNativeOpenFile}
        handleSaveFile={handleSaveFile}
        files={files}
        activeFile={activeFile}
        savedFiles={savedFiles}
        handleArduinoHardwareAction={handleArduinoHardwareAction}
        handleRunPython={handleRunPython}
        handleInstallCores={handleInstallCores}
        uiMode={uiMode}
        setUiMode={setUiMode}
        studentSubMode={studentSubMode}
        setStudentSubMode={setStudentSubMode}
        userEmail={authUser?.email}
        userName={authUser?.name}
        userAvatar={authUser?.avatar}
        onSignOut={onSignOut}
        language={language}
        onLanguageChange={handleLanguageChange}
      />

      {/* 3. CORE PANEL CONTAINER (Left sidebar + Workspace area) */}
      <div className="flex-1 flex min-h-0 relative z-10 p-3 gap-3">
        
        {/* A. LEFT NAVIGATION SIDEBAR (narrow layout) */}
        <Sidebar 
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          workspaceMode={workspaceMode}
          setWorkspaceMode={setWorkspaceMode}
          level={level}
          showExplorer={showExplorer}
          setShowExplorer={setShowExplorer}
          language={language}
        />

        {/* B. MAIN INTERFACE TABS CONTROLLER */}
        <div className="flex-1 flex min-w-0 relative gap-3 bg-transparent">
          
          {currentTab === 'home' && (
            <div className={`absolute inset-0 flex flex-col justify-between overflow-x-hidden overflow-y-auto home-carousel-bg ${themeMode === 'light' ? 'text-slate-800' : 'text-slate-100'}`}>
              {/* Header title */}
              <div className="pt-8 px-8 text-center space-y-2 select-none relative z-10">
                <h2 className="text-3xl font-extrabold tracking-tight home-carousel-title" style={{fontFamily: 'Outfit, Inter, sans-serif'}}>
                  {t(language, 'home', 'carouselTitle')}
                </h2>
                <p className={`text-xs max-w-md mx-auto ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                  {t(language, 'home', 'carouselSubtitle')}
                </p>
              </div>

              {/* 3D Circular Carousel Viewport */}
              <div className="relative flex-1 w-full flex items-center justify-center py-6 select-none" style={{ perspective: 1200, minHeight: '450px' }}>
                
                {/* 3D Stack Container */}
                <div className="relative w-full max-w-none h-[380px] flex items-center justify-center overflow-visible">
                  {allProjectsList.map((proj, index) => {
                    const totalCards = allProjectsList.length;
                    let diff = index - activeCardIndex;
                    
                    // Wrap-around for circular math
                    if (diff < -totalCards / 2) diff += totalCards;
                    if (diff > totalCards / 2) diff -= totalCards;

                    // Only render or animate cards that are within visible range (-2 to 2)
                    const isVisible = Math.abs(diff) <= 2;
                    if (!isVisible) return null;

                    // Calculate 3D transforms based on relative offset (diff)
                    let xOffset = 0;
                    let rotateYAngle = 0;
                    let scaleValue = 1;
                    let zIndexValue = 1;
                    let opacityValue = 1;

                    if (diff === 0) {
                      xOffset = 0;
                      rotateYAngle = 0;
                      scaleValue = 1.15;
                      zIndexValue = 10;
                      opacityValue = 1;
                    } else if (diff === -1) {
                      xOffset = -280;
                      rotateYAngle = 38;
                      scaleValue = 0.9;
                      zIndexValue = 5;
                      opacityValue = 0.8;
                    } else if (diff === 1) {
                      xOffset = 280;
                      rotateYAngle = -38;
                      scaleValue = 0.9;
                      zIndexValue = 5;
                      opacityValue = 0.8;
                    } else if (diff === -2) {
                      xOffset = -540;
                      rotateYAngle = 55;
                      scaleValue = 0.75;
                      zIndexValue = 2;
                      opacityValue = 0.45;
                    } else if (diff === 2) {
                      xOffset = 540;
                      rotateYAngle = -55;
                      scaleValue = 0.75;
                      zIndexValue = 2;
                      opacityValue = 0.45;
                    }

                    let IconComponent = Cpu;
                    let accentColor = "#10b981"; // Emerald
                    let bgGlow = "rgba(16,185,129,0.15)";
                    
                    if (proj.board === 'Arduino Uno') {
                      IconComponent = Cpu;
                      accentColor = "#10b981";
                      bgGlow = "rgba(16,185,129,0.12)";
                    } else if (proj.board === 'BBC micro:bit') {
                      IconComponent = Activity;
                      accentColor = "#f59e0b";
                      bgGlow = "rgba(245,158,11,0.12)";
                    } else {
                      IconComponent = Compass;
                      accentColor = "#a855f7";
                      bgGlow = "rgba(168,85,247,0.12)";
                    }

                    return (
                      <motion.div
                        key={proj.name}
                        animate={{
                          x: xOffset,
                          scale: scaleValue,
                          rotateY: rotateYAngle,
                          opacity: opacityValue,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 260,
                          damping: 24,
                        }}
                        onClick={() => {
                          // Klik kartu mana saja akan langsung membuka template
                          handleOpenTemplate(proj.name || "");
                          setActiveCardIndex(index);
                        }}
                        className="w-[280px] h-[340px] rounded-3xl p-6 cursor-pointer relative flex flex-col justify-between overflow-hidden"
                        style={{
                          position: 'absolute',
                          zIndex: zIndexValue,
                          transformStyle: 'preserve-3d',
                          background: themeMode === 'light'
                             ? 'linear-gradient(135deg, rgba(255,255,255,0.90) 0%, rgba(248,250,252,0.95) 100%)'
                             : 'linear-gradient(135deg, rgba(16,18,27,0.95) 0%, rgba(8,9,15,0.98) 100%)',
                          border: `1px solid ${diff === 0 ? accentColor : themeMode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                          boxShadow: diff === 0 
                            ? themeMode === 'light'
                              ? `0 15px 35px -5px ${bgGlow}, 0 0 0 1px ${accentColor}40, 0 10px 20px -10px rgba(0,0,0,0.08)`
                              : `0 15px 35px -5px ${bgGlow}, 0 0 0 1px ${accentColor}33, 0 10px 20px -10px rgba(0,0,0,0.5)`
                            : themeMode === 'light'
                              ? '0 8px 24px -10px rgba(0,0,0,0.05)'
                              : '0 8px 24px -10px rgba(0,0,0,0.4)',
                        }}
                      >
                        {/* Accent top glow */}
                        {diff === 0 && (
                          <div 
                            className="absolute -top-24 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full blur-[60px]"
                            style={{ background: accentColor, opacity: themeMode === 'light' ? 0.08 : 0.15 }}
                          />
                        )}

                        {/* Card body */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                          <div>
                            <div 
                              className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border"
                              style={{ 
                                color: accentColor, 
                                backgroundColor: `${accentColor}12`,
                                borderColor: `${accentColor}25`
                              }}
                            >
                              <IconComponent className="w-6 h-6" />
                            </div>
                            
                            <h3 className={`text-sm font-bold leading-tight font-display mb-2 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{proj.name}</h3>
                            <p className={`text-[11px] leading-relaxed font-sans line-clamp-4 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{proj.description}</p>
                          </div>

                          <div>
                            {/* Component list badge preview if present */}
                            {proj.components && proj.components.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {proj.components.map(comp => (
                                  <span key={comp} className={`text-[8px] border px-1.5 py-0.5 rounded uppercase ${themeMode === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className={`flex items-center justify-between border-t pt-3 ${themeMode === 'light' ? 'border-slate-200/50' : 'border-white/5'}`}>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">BOARD:</span>
                              <span 
                                className="text-[9px] font-bold px-2.5 py-0.5 rounded-full border"
                                style={{
                                  color: accentColor,
                                  backgroundColor: `${accentColor}12`,
                                  borderColor: `${accentColor}25`
                                }}
                              >
                                {proj.board}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Left navigation arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCardIndex((prev) => (prev - 1 + allProjectsList.length) % allProjectsList.length);
                  }}
                  className="absolute left-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-white/70 hover:text-white transition duration-200 cursor-pointer z-20"
                >
                  <ChevronLeft className="w-5 h-5 -translate-x-0.5" />
                </button>

                {/* Right navigation arrow */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCardIndex((prev) => (prev + 1) % PROJECTS_LIST.length);
                  }}
                  className="absolute right-6 w-10 h-10 rounded-full flex items-center justify-center bg-slate-900/60 hover:bg-slate-800 border border-white/10 text-white/70 hover:text-white transition duration-200 cursor-pointer z-20"
                >
                  <ChevronRight className="w-5 h-5 translate-x-0.5" />
                </button>
              </div>

              {/* Progress Indicator dots */}
              <div className="pb-8 w-full flex items-center justify-center gap-1.5 select-none relative z-10">
                {allProjectsList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCardIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeCardIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>

              {/* PROJECT GRID SECTION (Card 2) */}
              <div className="w-full max-w-6xl mx-auto px-8 pb-20 select-none relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                  <h3 className="text-2xl font-bold tracking-tight" style={{fontFamily: 'Outfit, Inter, sans-serif'}}>
                    {t(language, 'home', 'allProjects')}
                  </h3>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className={`w-4 h-4 ${themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <input 
                        type="text" 
                        placeholder={t(language, 'home', 'searchPlaceholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                          themeMode === 'light' 
                            ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-slate-700'
                        }`}
                      />
                    </div>
                    
                    {/* Category Filter */}
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className={`px-4 py-2 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                        themeMode === 'light' 
                          ? 'bg-white border-slate-200 text-slate-800' 
                          : 'bg-slate-900 border-slate-800 text-slate-200'
                      }`}
                    >
                      <option value="Semua">{t(language, 'home', 'allBoards')}</option>
                      <option value="Arduino Uno">Arduino Uno</option>
                      <option value="ESP32 DevKit V1">ESP32 DevKit V1</option>
                      <option value="BBC micro:bit">BBC micro:bit</option>
                    
                      <option value="Library Examples">📚 Library Examples</option>
                      <option value="GitHub Libraries">🐙 GitHub Libraries</option>
                    </select>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allProjectsList.filter(p => {
                    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ((p as any).libraryName || '').toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = categoryFilter === 'Semua'
                      ? true
                      : categoryFilter === 'Library Examples'
                        ? (p.isLibraryExample || (p as any).category === 'Library Example')
                        : categoryFilter === 'GitHub Libraries'
                          ? (p.isCustom || (p as any).isGitHubLib)
                          : p.board === categoryFilter;
                    return matchesSearch && matchesCategory;
                  }).map((proj, idx) => {
                    let IconComponent = Cpu;
                    let accentColor = "#10b981"; // Emerald
                    
                    if (proj.board === 'Arduino Uno') {
                      IconComponent = Cpu;
                      accentColor = "#10b981";
                    } else if (proj.board === 'BBC micro:bit') {
                      IconComponent = Activity;
                      accentColor = "#f59e0b";
                    } else {
                      IconComponent = Compass;
                      accentColor = "#a855f7";
                    }

                    return (
                      <div
                        key={`grid-${proj.name}-${idx}`}
                        onClick={() => handleOpenTemplate(proj.name || "")}
                        className={`rounded-2xl p-5 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl border flex flex-col justify-between group ${
                          themeMode === 'light'
                            ? 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-slate-200/50'
                            : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:shadow-black/50'
                        }`}
                        style={{ height: '220px' }}
                      >
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                              style={{ 
                                color: accentColor, 
                                backgroundColor: `${accentColor}15`,
                              }}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              {proj.board}
                            </span>
                          </div>
                          <div className={`flex items-center gap-1.5 mb-1 px-1 font-semibold select-none ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
                            {(proj as any).libraryName && (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                📚 {(proj as any).libraryName}
                              </span>
                            )}
                            {(proj as any).isCustom && (
                              <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                🐙 GitHub Lib
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-lg mb-2 line-clamp-1">{proj.name}</h4>
                          <p className={`text-xs line-clamp-3 leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                            {proj.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider group-hover:underline`} style={{ color: accentColor }}>
                            {t(language, 'home', 'openProject')}
                          </span>
                          <ArrowRight className="w-3 h-3" style={{ color: accentColor }} />
                        </div>
                      </div>
                    );
                  })}
                  
                  {allProjectsList.filter(p => {
                    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      ((p as any).libraryName || '').toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesCategory = categoryFilter === 'Semua'
                      ? true
                      : categoryFilter === 'Library Examples'
                        ? (p.isLibraryExample || (p as any).category === 'Library Example')
                        : categoryFilter === 'GitHub Libraries'
                          ? (p.isCustom || (p as any).isGitHubLib)
                          : p.board === categoryFilter;
                    return matchesSearch && matchesCategory;
                  }).length === 0 && (
                    <div className={`col-span-full text-center py-12 rounded-2xl border border-dashed ${themeMode === 'light' ? 'border-slate-300 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p>{t(language, 'home', 'noResults')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IDE WORKSPACE SCREEN */}
          {currentTab === 'ide' && (
            <div className="absolute inset-0 flex gap-3 bg-transparent">
              
              {/* SIDEBAR PANEL (Explorer / Files list) */}
              {showExplorer && (
                <div className="panel-explorer w-56 flex flex-col flex-shrink-0 select-none overflow-hidden">
                  {/* Panel Title */}
                  <div className="h-10 flex items-center justify-between px-4 border-b border-white/5">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Explorer</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={handleNativeOpenFolder}
                        className="p-1 text-slate-600 hover:text-slate-300 rounded-md hover:bg-white/5 transition cursor-pointer"
                        title="Buka Folder Lokal"
                      >
                        <Folder className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleNativeOpenFile}
                        className="p-1 text-slate-600 hover:text-slate-300 rounded-md hover:bg-white/5 transition cursor-pointer"
                        title="Buka Berkas Lokal"
                      >
                        <FileIcon className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={handleCreateFile}
                        className="p-1 text-slate-600 hover:text-slate-300 rounded-md hover:bg-white/5 transition cursor-pointer"
                        title="Tambah Berkas Baru"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setShowExplorer(false)}
                        className="p-1 text-slate-600 hover:text-slate-300 rounded-md hover:bg-white/5 transition cursor-pointer ml-0.5"
                        title="Sembunyikan Explorer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* File Tree List matching desain.png */}
                  <div className="flex-1 overflow-y-auto py-2 px-2">
                    <div className="space-y-1">
                      {Object.keys(files).length === 0 ? (
                        <div className="text-[10.5px] text-slate-500/80 px-4 py-8 text-center italic leading-relaxed border border-dashed border-slate-300 dark:border-slate-800 rounded-xl m-2 bg-slate-100/30 dark:bg-slate-950/20">
                          Belum ada file terbuka.<br/>Buka file .ino, .c, .h, .cpp, .py, atau .hex untuk memulai.
                        </div>
                      ) : (
                        <>
                          <div className={`text-[10px] font-bold px-2 py-1.5 tracking-wide uppercase flex items-center justify-between group/folder ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-500'}`}>
                            <div className="flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 rotate-90" />
                              <span>{projectName || 'PROYEK'}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCloseFolder();
                              }}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer font-sans font-semibold tracking-normal normal-case transition ${themeMode === 'light' ? 'text-slate-800 hover:text-slate-900 bg-slate-200 hover:bg-slate-300' : 'text-slate-200 hover:text-white bg-white/5 hover:bg-white/10'}`}
                              title="Tutup Folder Proyek"
                            >
                              Tutup Folder
                            </button>
                          </div>
                          {/* Dynamic Folder & Root File Tree */}
                          {(() => {
                            const foldersMap: { [folder: string]: string[] } = {};
                            const rootFiles: string[] = [];

                            Object.keys(files).forEach(f => {
                              if (f.includes('/')) {
                                const folderName = f.substring(0, f.indexOf('/'));
                                if (!foldersMap[folderName]) foldersMap[folderName] = [];
                                foldersMap[folderName].push(f);
                              } else {
                                rootFiles.push(f);
                              }
                            });

                            return (
                              <>
                                {Object.entries(foldersMap).map(([folderName, folderFiles]) => {
                                  const folderIconColor = folderName === 'firmware' ? 'text-blue-400' : folderName === 'python' ? 'text-yellow-500' : 'text-indigo-400';
                                  return (
                                    <div key={folderName} className="pl-3">
                                      <div className="text-xs text-slate-400 font-medium py-1 flex items-center gap-1.5 cursor-pointer">
                                        <ChevronRight className="w-3 h-3 rotate-90" />
                                        <Folder className={`w-3.5 h-3.5 ${folderIconColor}`} />
                                        <span>{folderName}</span>
                                      </div>
                                      <div className="pl-5 space-y-0.5">
                                        {folderFiles.map(filename => {
                                          const isActive = filename === activeFile;
                                          const isUnsaved = files[filename] !== savedFiles[filename];
                                          const ext = filename.split('.').pop()?.toLowerCase();
                                          const iconColor = ext === 'ino' ? 'text-emerald-500' : (ext === 'c' || ext === 'h' || ext === 'cpp' || ext === 'hpp') ? 'text-sky-400' : ext === 'py' ? 'text-yellow-500' : 'text-slate-400';
                                          return (
                                            <div 
                                              key={filename}
                                              onClick={() => handleFileSelect(filename)}
                                              className={`group/file flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-mono cursor-pointer transition relative ${isActive ? (themeMode === 'light' ? 'text-indigo-700 font-semibold bg-indigo-50 border border-indigo-200' : 'text-indigo-300 font-semibold') : (themeMode === 'light' ? 'text-slate-700 hover:text-slate-900 hover:bg-black/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}`}
                                              style={isActive ? {background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)'} : {}}
                                            >
                                              {ext === 'py' ? (
                                                <PythonLogo className="w-3.5 h-3.5 flex-shrink-0" />
                                              ) : (
                                                <FileIcon className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
                                              )}
                                              <span className="flex-1 truncate mr-4">{filename.split('/').pop()}</span>
                                              {isUnsaved && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Belum disimpan" />}
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleCloseFile(filename);
                                                }}
                                                className="opacity-0 group-hover/file:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer absolute right-1.5 flex items-center justify-center bg-white/5 dark:bg-black/10 hover:bg-rose-500/10"
                                                title="Tutup Berkas"
                                              >
                                                <X className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Root level files */}
                                <div className="pl-6 space-y-0.5">
                                  {rootFiles.map(filename => {
                                    const isActive = filename === activeFile;
                                    const isUnsaved = files[filename] !== savedFiles[filename];
                                    const ext = filename.split('.').pop()?.toLowerCase();
                                    const iconColor = ext === 'ino' ? 'text-emerald-500' : (ext === 'c' || ext === 'h' || ext === 'cpp' || ext === 'hpp') ? 'text-sky-400' : ext === 'py' ? 'text-yellow-500' : 'text-slate-400';
                                    return (
                                      <div 
                                        key={filename}
                                        onClick={() => handleFileSelect(filename)}
                                        className={`group/file flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-mono cursor-pointer transition relative ${isActive ? (themeMode === 'light' ? 'text-indigo-700 bg-indigo-100 border border-indigo-300 font-semibold' : 'text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 font-semibold') : (themeMode === 'light' ? 'text-slate-700 hover:text-slate-900 hover:bg-black/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5')}`}
                                      >
                                        {ext === 'py' ? (
                                          <PythonLogo className="w-3.5 h-3.5 flex-shrink-0" />
                                        ) : (
                                          <FileIcon className={`w-3 h-3 ${iconColor} flex-shrink-0`} />
                                        )}
                                        <span className="flex-1 truncate mr-4">{filename}</span>
                                        {isUnsaved && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Belum disimpan" />}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseFile(filename);
                                          }}
                                          className="opacity-0 group-hover/file:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer absolute right-1.5 flex items-center justify-center bg-white/5 dark:bg-black/10 hover:bg-rose-500/10"
                                          title="Tutup Berkas"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  </div>


                </div>
              )}

              {/* CENTRAL WORKSPACE & TELEMETRY */}
              <div className="flex-1 flex flex-col min-w-0 gap-0 bg-transparent relative">
                
                {/* Compile progress overlay */}
                {buildProgress > 0 && buildProgress < 100 && (
                  <div className="bg-[#0b0c10] border-b border-[#181b28] px-4 py-2 flex items-center justify-between gap-4 font-mono text-[10px] select-none">
                    <div className="flex items-center gap-2 text-slate-350">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" />
                      <span>{buildStatusText}</span>
                    </div>
                    <div className="flex-1 max-w-sm bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 transition-all duration-300" style={{ width: `${buildProgress}%` }} />
                    </div>
                    <span className="text-slate-400 font-bold">{buildProgress}%</span>
                  </div>
                )}

                {/* EDITORS SPLIT WORKSPACE */}
                <div 
                  id="workspace-split-container" 
                  className="flex-1 min-h-0 flex flex-col sm:flex-row gap-0 bg-transparent relative z-10 box-border"
                  style={{
                    paddingBottom: isTerminalCollapsed ? '38px' : `${terminalHeight + 6}px`,
                    transition: isResizingTerminal ? 'none' : 'padding-bottom 0.15s ease-out'
                  }}
                >
                  
                  {/* Editors Area (Left + Center) */}
                  <div className="flex-1 flex flex-col sm:flex-row min-w-0 h-full relative gap-0 bg-transparent">
                    {activeFile === '' ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center rounded-2xl min-h-[400px]">
                        <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6 relative shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
                          <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/5 blur-xl animate-pulse" />
                          <Cpu className="w-12 h-12 text-indigo-500 dark:text-cyan-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-3 font-sans tracking-tight">Workspace Kosong</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
                          Workspace RoboLab Studio Anda kosong. Mulailah dengan membuat berkas baru, atau buka proyek yang sudah ada untuk mulai memprogram robot Anda.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            onClick={handleNativeOpenFile}
                            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] dark:shadow-indigo-500/20 hover:-translate-y-0.5"
                          >
                            <FolderOpen className="w-4 h-4" />
                            <span>Buka Berkas</span>
                          </button>
                          <button
                            onClick={handleNativeOpenFolder}
                            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-all shadow-sm hover:-translate-y-0.5"
                          >
                            <Folder className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                            <span>Buka Folder</span>
                          </button>
                          <button
                            onClick={handleCreateFile}
                            className="flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition-all shadow-sm hover:-translate-y-0.5"
                          >
                            <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span>Buat Berkas Baru</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Blockly Canvas — purple glass panel */}
                        {((uiMode === 'student' && studentSubMode === 'block') ||
                          (uiMode === 'pro' && (workspaceMode === 'blockly' || (workspaceMode === 'split' && !isBlocklyCollapsed)))) && (
                          <div 
                            className="panel-3d panel-blockly min-w-0 min-h-0 h-full relative overflow-hidden glass-panel"
                            style={{ 
                              width: uiMode === 'student' ? '100%' : (isMobile ? '100%' : (workspaceMode === 'split' ? (!isEditorCollapsed ? `calc(${splitRatio}% - 2px)` : 'calc(100% - 32px)') : '100%')),
                              height: uiMode === 'student' ? '100%' : (isMobile ? (workspaceMode === 'split' && !isEditorCollapsed ? `${splitRatio}%` : '100%') : '100%'),
                              flexGrow: 0,
                              flexShrink: 0
                            }}
                          >
                            <BlocklyEditor 
                              key={projectName + "_" + ((activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'main_workspace' : activeFile) + "_" + themeMode + "_" + learningLessonLoadedCount + "_" + packages.arduino.filter((p: any) => p.installed).map((p: any) => p.name).sort().join(',')}
                              codeType={activeFile.endsWith('.py') ? 'python' : 'arduino'} 
                              board={board}
                              installedLibraries={packages.arduino.filter((p: any) => p.installed).map((p: any) => ({
                                name: p.name,
                                parsedApi: p.parsedApi,
                                headers: p.headers,
                                isCustom: p.isCustom
                              }))}
                              isSyncWithBlocks={(activeFile.endsWith('.ino') || activeFile.endsWith('.py')) && syncStatuses[activeFile] === true}
                              workspaceXml={workspaceXmls[activeFile] || workspaceXmls['firmware/main.ino'] || workspaceXmls['python/main.py'] || null}
                              onWorkspaceChange={(xmlText) => {
                                const pyFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'python/main.py' : activeFile.replace(/\.(ino|hex)$/i, '.py');
                                const inoFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'firmware/main.ino' : activeFile.replace(/\.py$/i, '.ino');
                                setWorkspaceXmls(prev => ({
                                  ...prev,
                                  [activeFile]: xmlText,
                                  ...(activeFile.endsWith('.ino') || activeFile.endsWith('.py') ? {
                                    [inoFile]: xmlText,
                                    [pyFile]: xmlText
                                  } : {})
                                }));
                              }}
                              onCodeChange={(newCode, otherCode) => {
                                if (syncStatuses[activeFile] === false) {
                                  return;
                                }
                                const currentCode = files[activeFile] || '';
                                // Safeguard: if user code is non-empty (>30 chars), don't overwrite with empty Blockly skeleton code
                                if (currentCode.trim().length > 30 && isBareSkeletonCode(newCode, activeFile.endsWith('.py') ? 'python' : 'arduino')) {
                                  console.warn("[RoboLab] Protected user code from empty Blockly skeleton overwrite.");
                                  return;
                                }

                                const pyFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'python/main.py' : activeFile.replace(/\.(ino|hex)$/i, '.py');
                                const inoFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'firmware/main.ino' : activeFile.replace(/\.py$/i, '.ino');
                                const otherFile = activeFile.endsWith('.ino') ? pyFile : inoFile;
                                setSyncStatuses(prev => {
                                  if (prev[activeFile] === false || prev[otherFile] === false) {
                                    return { ...prev, [activeFile]: true, [otherFile]: true };
                                  }
                                  return prev;
                                });
                                setFiles((prev: any) => ({
                                  ...prev,
                                  [activeFile]: newCode,
                                  ...(otherCode !== undefined ? {
                                    [otherFile]: otherCode
                                  } : {})
                                }));
                                setSimFiles((prev: any) => ({
                                  ...prev,
                                  [activeFile]: newCode,
                                  ...(otherCode !== undefined ? {
                                    [otherFile]: otherCode
                                  } : {})
                                }));
                              }}
                              onSyncToCode={(arduinoCode, pythonCode) => {
                                const pyFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'python/main.py' : activeFile.replace(/\.(ino|hex)$/i, '.py');
                                const inoFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'firmware/main.ino' : activeFile.replace(/\.py$/i, '.ino');
                                setSyncStatuses(prev => ({
                                  ...prev,
                                  [inoFile]: true,
                                  [pyFile]: true
                                }));
                                setFiles(prev => ({
                                  ...prev,
                                  [inoFile]: arduinoCode,
                                  [pyFile]: pythonCode
                                }));
                                setSimFiles(prev => ({
                                  ...prev,
                                  [inoFile]: arduinoCode,
                                  [pyFile]: pythonCode
                                }));
                              }}
                              activeFile={activeFile}
                              onCollapse={workspaceMode === 'split' ? () => { setIsBlocklyCollapsed(true); setIsEditorCollapsed(false); } : undefined}
                              isRunning={isRunning}
                              onMicrobitPreview={(frames) => setMicrobitFrames(frames)}
                              themeMode={themeMode}
                            />
                          </div>
                        )}

                        {/* Resizable Divider — neon cyan glow */}
                        {uiMode === 'pro' && workspaceMode === 'split' && !isBlocklyCollapsed && !isEditorCollapsed && !isMobile && (
                          <div 
                            className="panel-divider w-1 hover:w-1.5 cursor-col-resize transition-all flex items-center justify-center select-none z-20 flex-shrink-0"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setIsResizingSplit(true);
                            }}
                          >
                            <div className="w-0.5 h-8 rounded-full bg-cyan-500/30" />
                          </div>
                        )}

                        {/* Collapsed Blockly bar */}
                        {uiMode === 'pro' && workspaceMode === 'split' && isBlocklyCollapsed && (
                          <div className="glass-sidebar w-8 h-full flex flex-col items-center justify-center py-4 flex-shrink-0 select-none border-r border-indigo-500/20">
                            <button 
                              onClick={() => setIsBlocklyCollapsed(false)}
                              className="text-[9px] font-mono font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer select-none [writing-mode:vertical-lr] rotate-180"
                            >
                              BUKA BLOCKLY
                            </button>
                          </div>
                        )}

                        {/* Monaco Code Editor — cyan glass panel */}
                        {((uiMode === 'student' && studentSubMode === 'code') ||
                          (uiMode === 'pro' && (workspaceMode === 'code' || (workspaceMode === 'split' && !isEditorCollapsed)))) && (
                          <div 
                            className="panel-3d panel-code min-w-0 min-h-0 h-full relative overflow-hidden rounded-2xl glass-panel"
                            style={{ 
                              width: (uiMode === 'student') ? '100%' : (isMobile ? '100%' : (workspaceMode === 'split' ? (!isBlocklyCollapsed ? `calc(${100 - splitRatio}% - 2px)` : 'calc(100% - 32px)') : '100%')),
                              height: (uiMode === 'student') ? '100%' : (isMobile ? (workspaceMode === 'split' && !isBlocklyCollapsed ? `${100 - splitRatio}%` : '100%') : '100%'),
                              flexGrow: 0,
                              flexShrink: 0
                            }}
                          >
                            <CodeEditor 
                              files={files}
                              activeFile={activeFile}
                              onSaveFile={handleSaveFile}
                              isSyncWithBlocks={(activeFile.endsWith('.ino') || activeFile.endsWith('.py')) && syncStatuses[activeFile] === true}
                              onSyncToggle={(sync) => {
                                const pyFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'python/main.py' : activeFile.replace(/\.(ino|hex)$/i, '.py');
                                const inoFile = (activeFile === 'firmware/main.ino' || activeFile === 'python/main.py') ? 'firmware/main.ino' : activeFile.replace(/\.py$/i, '.ino');
                                if (sync) {
                                  try {
                                    const currentCode = files[activeFile] || '';
                                    let xml = '';
                                    if (activeFile.endsWith('.ino')) {
                                      xml = arduinoToBlocklyXml(currentCode);
                                    } else if (activeFile.endsWith('.py')) {
                                      xml = pythonToBlocklyXml(currentCode);
                                    }
                                    // Hanya ganti workspaceXmls jika XML valid dan memiliki blok
                                    if (xml && xml.includes('<block')) {
                                      setWorkspaceXmls(prev => ({
                                        ...prev,
                                        [activeFile]: xml,
                                        ...(activeFile.endsWith('.ino') || activeFile.endsWith('.py') ? {
                                          [inoFile]: xml,
                                          [pyFile]: xml
                                        } : {})
                                      }));
                                    } else {
                                      console.warn("Kode memuat sintaks kustom yang belum dipetakan balik ke blok visual; mempertahankan blok yang ada.");
                                    }
                                  } catch (err) {
                                    console.warn("Failed to parse code back to blocks:", err);
                                  }
                                }
                                setSyncStatuses(prev => ({
                                  ...prev,
                                  [inoFile]: sync,
                                  [pyFile]: sync
                                }));
                              }}

                              onFileChange={(filename, content) => {
                                setFiles(prev => ({
                                  ...prev,
                                  [filename]: content
                                }));
                                if (syncStatuses[filename] === false) {
                                  const inoFile = Object.keys(files).find(f => f.endsWith('.ino')) || 'firmware/main.ino';
                                  const pyFile = Object.keys(files).find(f => f.endsWith('.py')) || 'python/main.py';
                                  try {
                                    if (filename.endsWith('.ino')) {
                                      const xml = arduinoToBlocklyXml(content);
                                      setWorkspaceXmls(prev => ({ ...prev, [filename]: xml, [inoFile]: xml, [pyFile]: xml }));
                                    } else if (filename.endsWith('.py')) {
                                      const xml = pythonToBlocklyXml(content);
                                      setWorkspaceXmls(prev => ({ ...prev, [filename]: xml, [inoFile]: xml, [pyFile]: xml }));
                                    }
                                  } catch (err) {
                                    // Ignore transient parse errors while typing
                                  }
                                }
                              }}
                              onTabChange={(filename) => {
                                handleFileSelect(filename);
                              }}
                              onCollapse={workspaceMode === 'split' ? () => { setIsEditorCollapsed(true); setIsBlocklyCollapsed(false); } : undefined}
                              isRunning={isRunning}
                              themeMode={themeMode}
                            />
                          </div>
                        )}

                        {/* Collapsed Editor bar */}
                        {workspaceMode === 'split' && isEditorCollapsed && (
                          <div className="glass-sidebar w-8 h-full flex flex-col items-center justify-center py-4 flex-shrink-0 select-none border-l border-cyan-500/20">
                            <button 
                              onClick={() => setIsEditorCollapsed(false)}
                              className="text-[9px] font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer select-none [writing-mode:vertical-lr] flex items-center justify-center gap-1 rotate-180"
                            >
                              <span>BUKA EDITOR</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                </div>

                <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
                  <div className="pointer-events-auto">
                    <TerminalPanel
                      isTerminalCollapsed={isTerminalCollapsed}
                      setIsTerminalCollapsed={setIsTerminalCollapsed}
                      terminalHeight={terminalHeight}
                      setIsResizingTerminal={setIsResizingTerminal}
                      terminalTab={terminalTab}
                      setTerminalTab={setTerminalTab}
                      port={port}
                      board={board}
                      themeMode={themeMode}
                      terminalLogs={terminalLogs}
                      setTerminalLogs={setTerminalLogs}
                      serialRawOutput={serialRawOutput}
                      setSerialRawOutput={setSerialRawOutput}
                      interactiveTerminalLogs={interactiveTerminalLogs}
                      setInteractiveTerminalLogs={setInteractiveTerminalLogs}
                      serialBaudrate={serialBaudrate}
                      setSerialBaudrate={setSerialBaudrate}
                      isSerialConnected={isSerialConnected}
                      setIsSerialConnected={handleSetIsSerialConnected}
                      terminalInput={terminalInput}
                      setTerminalInput={setTerminalInput}
                      handleTerminalCommand={handleTerminalCommand}
                      aiChat={aiChat}
                      aiInput={aiInput}
                      setAiInput={setAiInput}
                      handleSendChat={handleSendChat}
                      kiloConfig={kiloConfig}
                      setKiloConfig={setKiloConfig}
                      onApplyCodeToEditor={handleApplyCodeToEditor}
                      onClearChat={handleClearChat}
                      activeFileName={activeFile}
                      activeComponents={simulatorActiveComponents}
                      isAiLoading={isAiLoading}
                    />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: PACKAGE MANAGER - UPGRADED */}
          {currentTab === 'packages' && (
            <div className="absolute inset-0 p-6 overflow-y-auto space-y-5" style={{background: 'transparent'}}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 select-none border-b border-white/10">
                <div>
                  <h2 className={`text-lg font-bold flex items-center gap-1.5 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`} style={{fontFamily: 'Outfit, Inter, sans-serif'}}>
                    <Sliders className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} /> Library &amp; Board Manager
                  </h2>
                  <p className={`text-xs mt-0.5 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>Kelola library Arduino, paket Python, dan board core mikrokontroler.</p>
                </div>
                <div className="relative w-56">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${themeMode === 'light' ? 'text-slate-450' : 'text-slate-600'}`} />
                  <input
                    type="text"
                    placeholder="Cari library/board..."
                    value={pkgSearch}
                    onChange={(e) => setPkgSearch(e.target.value)}
                    className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition border ${themeMode === 'light' ? 'bg-slate-200/50 border-slate-200 text-slate-850 focus:border-[var(--accent-primary)]' : 'bg-white/5 border-white/10 text-slate-200 focus:border-blue-500'}`}
                  />
                </div>
              </div>

              {/* GitHub URL Install + ZIP Upload */}
              <div className="rounded-2xl p-4 space-y-3" style={themeMode === 'light' ? {background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)'} : {background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)'}}>
                <h3 className={`text-xs font-bold flex items-center gap-1.5 ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-400'}`}>
                  <span className="text-emerald-450">↓</span> Install dari GitHub / ZIP
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="GitHub URL library (contoh: https://github.com/user/repo)"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none font-mono transition border ${themeMode === 'light' ? 'bg-slate-200/50 border-slate-200 text-slate-850 focus:border-[var(--accent-primary)]' : 'bg-[#080910] border-slate-700 text-slate-200 focus:border-blue-500'}`}
                  />
                  <button
                    onClick={async () => {
                      const url = githubUrl.trim();
                      if (!url) return;
                      if (!url.startsWith('http')) {
                        alert('URL tidak valid. Pastikan dimulai dengan https://github.com/...');
                        return;
                      }
                      setIsInstallingGithub(true);
                      const parts = url.split('/').filter(Boolean);
                      let repoName = (parts[parts.length - 1] || 'library').replace(/\.git$/i, '');
                      const authorName = parts.length >= 2 ? parts[parts.length - 2] : 'unknown';

                      setInteractiveTerminalLogs((prev: any) => [
                        ...prev,
                        { text: `> Memulai instalasi library dari ${url}...`, type: 'output' },
                      ]);

                      const req = (window as any).__electronRequire || (window as any).require;
                      let success = false;
                      let installedParsedApi: any = undefined;
                      if (req) {
                        try {
                          const res = await req('electron').ipcRenderer.invoke('install-lib-from-github', { githubUrl: url, userId: authUser?.id });
                          if (res && res.success) {
                            success = true;
                            if (res.libName) repoName = res.libName;
                            installedParsedApi = res.parsedApi;
                            if (Array.isArray(res.examples) && res.examples.length > 0) {
                              const newCards = res.examples.map((ex: any) => ({
                                name: ex.name,
                                board: ex.board || 'Arduino Uno',
                                description: ex.description || `Contoh program ${ex.name} dari library ${ex.library}.`,
                                iconColor: 'emerald',
                                components: ['custom_lib'],
                                libraryName: ex.library,
                                category: 'Library Example',
                                isLibraryExample: true,
                                isCustom: true,
                                isGitHubLib: true,
                                ino: ex.code,
                                xml: ex.code ? (arduinoToBlocklyXml(ex.code, ex.parsedApi || installedParsedApi) || '') : '',
                                parsedApi: ex.parsedApi || installedParsedApi,
                                py: ex.code ? (arduinoToPython(ex.code, ex.parsedApi || installedParsedApi) || `# Contoh Library ${ex.library}\n`) : ''
                              }));
                              setCustomLibProjects((prev: any[]) => {
                                const existing = prev.filter(p => (p.libraryName || '').toLowerCase() !== (res.libName || repoName).toLowerCase());
                                return [...newCards, ...existing];
                              });
                            }
                            if (authUser?.id) {
                              await saveUserCustomLibrary(authUser.id, {
                                name: res.libName || repoName,
                                source_type: 'github',
                                source_url: url,
                                version: 'latest-git',
                                headers: res.headers || []
                              });
                            }
                            await syncInstalledLibraries();
                          }
                        } catch (e: any) {
                          console.warn('GitHub install error:', e);
                        }
                      } else {
                        success = true;
                        if (authUser?.id) {
                          await saveUserCustomLibrary(authUser.id, {
                            name: repoName,
                            source_type: 'github',
                            source_url: url,
                            version: 'latest-git',
                            headers: []
                          });
                        }
                      }

                      if (success) {
                        setPackages((prev: any) => ({
                          ...prev,
                          arduino: prev.arduino.some((p: any) => p.name.toLowerCase() === repoName.toLowerCase())
                            ? prev.arduino.map((p: any) => p.name.toLowerCase() === repoName.toLowerCase() ? { ...p, installed: true, isCustom: true, userId: authUser?.id, parsedApi: installedParsedApi || p.parsedApi } : p)
                            : [...prev.arduino, { name: repoName, desc: `GitHub Library: ${url} (by ${authorName})`, version: 'latest-git', installed: true, isCustom: true, userId: authUser?.id, parsedApi: installedParsedApi }]
                        }));
                        setTerminalLogs((prev: any) => [
                          ...prev,
                          { text: `[LIB] ✓ Library '${repoName}' berhasil diinstal!`, type: 'success' }
                        ]);
                        setInteractiveTerminalLogs((prev: any) => [
                          ...prev,
                          { text: `> ✓ Library '${repoName}' installed to Arduino/libraries/`, type: 'success' }
                        ]);
                        setGithubUrl('');
                      } else {
                        setTerminalLogs((prev: any) => [
                          ...prev,
                          { text: `[LIB] ❌ Gagal menginstal library dari ${url}. Cek log terminal.`, type: 'error' }
                        ]);
                      }
                      setIsInstallingGithub(false);
                    }}
                    disabled={isInstallingGithub || !githubUrl.trim()}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer select-none whitespace-nowrap hover:opacity-90 border ${
                      themeMode === 'light'
                        ? githubUrl.trim()
                          ? 'text-white-force border-transparent'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : githubUrl.trim()
                          ? 'text-white border-transparent'
                          : 'bg-slate-800/60 text-slate-500 border-slate-700/50 cursor-not-allowed'
                    }`}
                    style={githubUrl.trim() ? { background: 'var(--accent-gradient)' } : {}}
                  >
                    {isInstallingGithub ? '⟳ Installing...' : '↓ Clone & Install'}
                  </button>
                  <button
                    onClick={handleImportZipLibrary}
                    className="px-4 py-2 text-white-force text-xs font-bold rounded-lg transition cursor-pointer select-none whitespace-nowrap flex items-center gap-1.5 hover:opacity-90"
                    style={{ background: 'var(--accent-gradient)' }}
                  >
                    📦 Upload ZIP
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Paste URL repo GitHub atau upload file .zip library Arduino yang sudah didownload.</p>
              </div>

              {/* Category Tabs */}
              <div className={`flex gap-1 p-1 rounded-lg w-fit border ${themeMode === 'light' ? 'bg-slate-200/60 border-slate-200' : 'bg-[#0c0d12] border-slate-800'}`}>
                {(['arduino', 'python', 'boards'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPkgTab(tab)}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition select-none cursor-pointer ${
                      pkgTab === tab
                        ? 'text-white shadow-sm'
                        : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                    style={pkgTab === tab ? { background: 'var(--accent-gradient)' } : {}}
                  >
                    {tab === 'arduino' ? (
                      '⚡ Arduino Library'
                    ) : tab === 'python' ? (
                      <span className="inline-flex items-center gap-1.5">
                        <PythonLogo className="w-3.5 h-3.5" />
                        <span>Python (PIP)</span>
                      </span>
                    ) : (
                      '🔲 Board Manager'
                    )}
                  </button>
                ))}
              </div>

              {/* Arduino Libraries */}
              {pkgTab === 'arduino' && (
                <div className="space-y-2">
                  {packages.arduino
                    .filter((p: any) => p.name.toLowerCase().includes(pkgSearch.toLowerCase()) || p.desc.toLowerCase().includes(pkgSearch.toLowerCase()))
                    .map((pkg: any) => (
                      <div key={pkg.name} className={`p-4 rounded-xl flex justify-between items-start gap-4 transition border ${themeMode === 'light' ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-[#0c0d14] border-slate-800/70 hover:border-slate-700'}`}>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{pkg.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${themeMode === 'light' ? 'text-slate-600 bg-slate-100' : 'text-slate-400 bg-slate-900'}`}>v{pkg.version}</span>
                            {pkg.installed && <span className="text-[9px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded">✓ Installed</span>}
                            {pkg.isCustom ? (
                              <span className="text-[9px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-1.5 py-0.5 rounded font-medium">👤 Akun Anda</span>
                            ) : (
                              <span className="text-[9px] text-slate-400 bg-slate-800/40 border border-slate-700/40 px-1.5 py-0.5 rounded">📦 Bawaan</span>
                            )}
                          </div>
                          <p className={`text-[11px] leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{pkg.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pkg.installed ? (
                            <>
                              <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 select-none flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Installed</span>
                              </span>
                              <button
                                disabled={uninstallingMap[pkg.name]}
                                onClick={() => handleUninstallPkg('arduino', pkg.name)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-900/40 hover:border-rose-700/60 transition cursor-pointer select-none flex items-center gap-1 disabled:opacity-50"
                                title={`Hapus library ${pkg.name}`}
                              >
                                {uninstallingMap[pkg.name] ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menghapus...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={installingMap[pkg.name]?.loading}
                              onClick={() => handleInstallPkg('arduino', pkg.name)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 ${
                                installingMap[pkg.name]?.loading
                                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 cursor-wait'
                                  : 'text-white hover:opacity-90'
                              }`}
                              style={!installingMap[pkg.name]?.loading ? { background: 'var(--accent-gradient)' } : {}}
                            >
                              {installingMap[pkg.name]?.loading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{installingMap[pkg.name]?.progress || 'Mengunduh...'}</span>
                                </>
                              ) : (
                                'Install'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Python PIP */}
              {pkgTab === 'python' && (
                <div className="space-y-2">
                  {packages.python
                    .filter((p: any) => p.name.toLowerCase().includes(pkgSearch.toLowerCase()) || p.desc.toLowerCase().includes(pkgSearch.toLowerCase()))
                    .map((pkg: any) => (
                      <div key={pkg.name} className={`p-4 rounded-xl flex justify-between items-start gap-4 transition border ${themeMode === 'light' ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-[#0c0d14] border-slate-800/70 hover:border-slate-700'}`}>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{pkg.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${themeMode === 'light' ? 'text-slate-600 bg-slate-100' : 'text-slate-400 bg-slate-900'}`}>v{pkg.version}</span>
                            {pkg.installed && <span className="text-[9px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded">✓ Installed</span>}
                          </div>
                          <p className={`text-[11px] leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{pkg.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {pkg.installed ? (
                            <>
                              <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 select-none flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Installed</span>
                              </span>
                              <button
                                disabled={uninstallingMap[pkg.name]}
                                onClick={() => handleUninstallPkg('python', pkg.name)}
                                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-rose-950/30 text-rose-400 border border-rose-900/40 hover:bg-rose-900/40 hover:border-rose-700/60 transition cursor-pointer select-none flex items-center gap-1 disabled:opacity-50"
                                title={`Hapus package ${pkg.name}`}
                              >
                                {uninstallingMap[pkg.name] ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Menghapus...</span>
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <button
                              disabled={installingMap[pkg.name]?.loading}
                              onClick={() => handleInstallPkg('python', pkg.name)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex items-center gap-1.5 ${
                                installingMap[pkg.name]?.loading
                                  ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 cursor-wait'
                                  : 'text-white hover:opacity-90'
                              }`}
                              style={!installingMap[pkg.name]?.loading ? { background: 'var(--accent-gradient)' } : {}}
                            >
                              {installingMap[pkg.name]?.loading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{installingMap[pkg.name]?.progress || 'Mengunduh...'}</span>
                                </>
                              ) : (
                                'Install'
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Board Manager */}
              {pkgTab === 'boards' && (
                <div className="space-y-2">
                  {packages.boards
                    .filter((p: any) => p.name.toLowerCase().includes(pkgSearch.toLowerCase()) || p.desc.toLowerCase().includes(pkgSearch.toLowerCase()))
                    .map((pkg: any) => (
                      <div key={pkg.name} className={`p-4 rounded-xl flex justify-between items-start gap-4 transition border ${themeMode === 'light' ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' : 'bg-[#0c0d14] border-slate-800/70 hover:border-slate-700'}`}>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{pkg.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${themeMode === 'light' ? 'text-slate-600 bg-slate-100' : 'text-slate-400 bg-slate-900'}`}>v{pkg.version}</span>
                            {pkg.installed && <span className="text-[9px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-1.5 py-0.5 rounded">✓ Installed</span>}
                          </div>
                          <p className={`text-[11px] leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{pkg.desc}</p>
                          <p className={`text-[10px] font-mono truncate ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-600'}`}>{pkg.url}</p>
                        </div>
                        <button
                          disabled={pkg.installed || installingMap[pkg.name]?.loading}
                          onClick={() => {
                            const coreMap: Record<string, { coreName: string; url?: string }> = {
                              'ESP32 Arduino': { coreName: 'esp32:esp32', url: 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json' },
                              'Arduino AVR Boards': { coreName: 'arduino:avr', url: 'https://downloads.arduino.cc/packages/package_index.json' },
                              'ESP8266 Arduino': { coreName: 'esp8266:esp8266', url: 'https://arduino.esp8266.com/stable/package_esp8266com_index.json' },
                              'STM32 Boards': { coreName: 'STMicroelectronics:stm32', url: 'https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json' },
                              'Raspberry Pi Pico': { coreName: 'rp2040:rp2040', url: 'https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json' }
                            };
                            const target = coreMap[pkg.name] || { coreName: pkg.name, url: pkg.url };
                            handleInstallBoardCore(pkg.name, target.coreName, target.url);
                          }}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer select-none flex-shrink-0 flex items-center gap-1.5 ${
                            pkg.installed
                              ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 cursor-default'
                              : installingMap[pkg.name]?.loading
                              ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 cursor-wait'
                              : 'text-white hover:opacity-90'
                          }`}
                          style={!pkg.installed && !installingMap[pkg.name]?.loading ? { background: 'var(--accent-gradient)' } : {}}
                        >
                          {installingMap[pkg.name]?.loading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{installingMap[pkg.name]?.progress || 'Mengunduh Core...'}</span>
                            </>
                          ) : pkg.installed ? (
                            '✓ Installed'
                          ) : (
                            'Install Core'
                          )}
                        </button>
                      </div>
                    ))}
                  <div className={`mt-4 p-3 rounded-lg border ${themeMode === 'light' ? 'bg-[#f1f5f9] border-slate-200/60' : 'bg-[#0a0b12] border-slate-800'}`}>
                    <p className={`text-[10px] font-mono ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>💡 Untuk board custom, tambahkan URL Additional Board Manager di Settings → Board Manager URLs</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: HARDWARE SIMULATOR (ISOLATED WORKSPACE) */}
          {currentTab === 'simulator' && (
            <div className={`absolute inset-0 p-3 flex flex-col min-w-0 min-h-0 overflow-hidden transition-colors ${themeMode === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-[#090a0f] text-slate-100'}`}>
              {/* Simulator Dedicated Toolbar (Single Compact Kids-Friendly Bar) */}
              <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 select-none border-b mb-2 flex-shrink-0 ${themeMode === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                <div className="flex items-center gap-2">
                  {/* PROMINENT SIMULATOR MODE SWITCHER: Robot 3D vs Rangkaian */}
                  <div className={`flex items-center p-1 rounded-xl border shadow-sm ${themeMode === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900/95 border-slate-700/80'}`}>
                    <button
                      type="button"
                      onClick={() => setSimulatorMode('robot')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        simulatorMode === 'robot'
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30'
                          : themeMode === 'light'
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>🤖 Arena Robot 3D</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-black/25 text-white font-bold hidden xl:inline">
                        Line Follower • PID 1-5
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorMode('circuit')}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                        simulatorMode === 'circuit'
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30'
                          : themeMode === 'light'
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>🔌 Rangkaian Sirkuit</span>
                    </button>
                  </div>

                  {/* Layout Mode Switcher */}
                  <div className={`flex items-center p-0.5 rounded-xl border ${themeMode === 'light' ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-900/90 border-slate-800'}`}>
                    <button
                      onClick={() => setSimViewMode('blockly')}
                      title="Tampilkan Visual Blockly + Simulator"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        simViewMode === 'blockly'
                          ? 'bg-purple-600 text-white shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Blocks className="w-3.5 h-3.5" /> 🧩 Blok + Sim
                    </button>
                    <button
                      onClick={() => setSimViewMode('split')}
                      title="Tampilkan Blok + Kode + Simulator"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        simViewMode === 'split'
                          ? 'bg-indigo-600 text-white shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" /> Split
                    </button>
                    <button
                      onClick={() => setSimViewMode('code')}
                      title="Tampilkan Code Editor + Simulator"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        simViewMode === 'code'
                          ? 'bg-sky-600 text-white shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" /> Kode + Sim
                    </button>
                    <button
                      onClick={() => setSimViewMode('circuit')}
                      title="Layar Penuh Arena / Rangkaian Simulator"
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer ${
                        simViewMode === 'circuit'
                          ? 'bg-emerald-600 text-white shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" /> Full Arena
                    </button>
                  </div>
                </div>

                {/* Right Controls: Language File, Board, Run/Stop, Reset */}
                <div className="flex items-center gap-2">
                  {/* Simulator File / Language Switcher */}
                  <div className={`flex items-center p-0.5 rounded-xl border ${themeMode === 'light' ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-900/90 border-slate-800'}`}>
                    <button
                      onClick={() => setSimActiveFile('firmware/main.ino')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        simActiveFile === 'firmware/main.ino'
                          ? 'bg-cyan-600 text-white shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ⚡ C++ (.ino)
                    </button>
                    <button
                      onClick={() => setSimActiveFile('python/main.py')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        simActiveFile === 'python/main.py'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <PythonLogo className="w-3.5 h-3.5" />
                      <span>Python (.py)</span>
                    </button>
                  </div>

                  {/* Simulator Virtual Board Selector */}
                  <div className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${themeMode === 'light' ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-700/80 text-slate-200'}`}>
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <select
                      value={simBoard}
                      onChange={(e) => setSimBoard(e.target.value)}
                      className="bg-transparent text-[11px] font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="ESP32 DevKit V1" className="bg-slate-900 text-white">ESP32 DevKit V1</option>
                      <option value="ESP32-CAM" className="bg-slate-900 text-white">ESP32-CAM</option>
                      <option value="ESP8266 NodeMCU" className="bg-slate-900 text-white">ESP8266 NodeMCU</option>
                      <option value="Arduino Uno" className="bg-slate-900 text-white">Arduino Uno</option>
                      <option value="Arduino Nano" className="bg-slate-900 text-white">Arduino Nano</option>
                      <option value="Arduino Mega" className="bg-slate-900 text-white">Arduino Mega</option>
                      <option value="Raspberry Pi Pico" className="bg-slate-900 text-white">Raspberry Pi Pico</option>
                      <option value="STM32 BluePill" className="bg-slate-900 text-white">STM32 BluePill</option>
                      <option value="BBC micro:bit" className="bg-slate-900 text-white">BBC micro:bit</option>
                    </select>
                  </div>

                  {/* Run / Stop Simulator Button */}
                  {isRunning ? (
                    <button
                      onClick={handleStopCode}
                      className="px-4 py-1.5 text-xs font-extrabold rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition cursor-pointer select-none"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" /> Stop Robot
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const codeToRun = simFiles[simActiveFile] || '';
                        if (simActiveFile.endsWith('.py') || simBoard === 'BBC micro:bit') {
                          handleRunPython(codeToRun);
                        } else {
                          handleRunCode(codeToRun);
                        }
                      }}
                      className="px-4 py-1.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer select-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Jalankan Robot!
                    </button>
                  )}

                  {/* Reset Simulator Workspace Code */}
                  <button
                    onClick={() => {
                      handleStopCode();
                      setActiveRobotHighlight(null);
                      syncRobotToSimulatorWorkspace(
                        initialRobotSetup.hw,
                        initialRobotSetup.plans,
                        1,
                        true
                      );
                    }}
                    title="Reset Kode & Posisi Simulator ke Awal"
                    className={`p-1.5 rounded-xl border transition cursor-pointer ${themeMode === 'light' ? 'bg-white hover:bg-slate-50 text-slate-600 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'}`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Virtual Serial Output */}
                  <button
                    onClick={() => setSimShowConsole(prev => !prev)}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-xl border transition cursor-pointer select-none flex items-center gap-1 ${
                      simShowConsole
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                        : themeMode === 'light' ? 'bg-white text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    <TerminalIcon className="w-3 h-3" /> Log
                  </button>
                </div>
              </div>

              {/* Main Simulator Workspace Content: Left (Spacious Code/Blockly ~56%) + Right (Compact Simulator ~44%) */}
              <div className="flex-1 min-w-0 min-h-0 flex gap-3 overflow-hidden">
                {/* LEFT PANE: Isolated Simulator Code / Blockly Workspace (Circuit uses original 42% layout; Robot uses spacious 56% layout) */}
                {simViewMode !== 'circuit' && (
                  <div className={`${simulatorMode === 'circuit' ? 'w-[42%] min-w-[340px]' : 'w-[56%] min-w-[420px]'} h-full flex flex-col gap-2 min-h-0 flex-shrink-0`}>
                    {/* Blockly Visual Editor (shown in 'blockly' or top half of 'split') */}
                    {(simViewMode === 'blockly' || simViewMode === 'split') && (
                      <div
                        className="panel-3d panel-blockly min-w-0 relative overflow-hidden glass-panel rounded-2xl border border-indigo-500/20"
                        style={{ height: simViewMode === 'split' ? (simulatorMode === 'circuit' ? '52%' : '56%') : '100%' }}
                      >
                        <BlocklyEditor
                          key={`sim_blockly_${themeMode}_${simResetKey}_${packages.arduino.filter((p: any) => p.installed).map((p: any) => p.name).sort().join(',')}`}
                          codeType={simActiveFile.endsWith('.py') ? 'python' : 'arduino'}
                          board={simBoard}
                          installedLibraries={packages.arduino.filter((p: any) => p.installed).map((p: any) => ({
                            name: p.name,
                            parsedApi: p.parsedApi,
                            headers: p.headers,
                            isCustom: p.isCustom
                          }))}
                          isSyncWithBlocks={(simActiveFile.endsWith('.ino') || simActiveFile.endsWith('.py')) && simSyncStatuses[simActiveFile] === true}
                          workspaceXml={simWorkspaceXmls[simActiveFile] || simWorkspaceXmls['firmware/main.ino'] || simWorkspaceXmls['python/main.py'] || null}
                          onWorkspaceChange={(xmlText) => {
                            const pyFile = 'python/main.py';
                            const inoFile = 'firmware/main.ino';
                            setSimWorkspaceXmls(prev => ({
                              ...prev,
                              [simActiveFile]: xmlText,
                              [inoFile]: xmlText,
                              [pyFile]: xmlText,
                            }));
                          }}
                          onCodeChange={(newCode, otherCode) => {
                            if (simSyncStatuses[simActiveFile] === false) return;
                            const currentCode = simFiles[simActiveFile] || '';
                            if (currentCode.trim().length > 30 && isBareSkeletonCode(newCode, simActiveFile.endsWith('.py') ? 'python' : 'arduino')) return;
                            const pyFile = 'python/main.py';
                            const inoFile = 'firmware/main.ino';
                            const otherFile = simActiveFile.endsWith('.ino') ? pyFile : inoFile;
                            setSimFiles(prev => ({
                              ...prev,
                              [simActiveFile]: newCode,
                              ...(otherCode !== undefined ? { [otherFile]: otherCode } : {})
                            }));
                          }}
                          onSyncToCode={(arduinoCode, pythonCode) => {
                            setSimSyncStatuses(prev => ({
                              ...prev,
                              'firmware/main.ino': true,
                              'python/main.py': true,
                            }));
                            setSimFiles(prev => ({
                              ...prev,
                              'firmware/main.ino': arduinoCode,
                              'python/main.py': pythonCode,
                            }));
                          }}
                          activeFile={simActiveFile}
                          isRunning={isRunning}
                          onMicrobitPreview={(frames) => setMicrobitFrames(frames)}
                          onRunSimulator={(code) => {
                            if (simActiveFile.endsWith('.py') || simBoard === 'BBC micro:bit') {
                              handleRunPython(code);
                            } else {
                              handleRunCode(code);
                            }
                          }}
                          onStopSimulator={() => {
                            handleStopCode();
                            setActiveRobotHighlight(null);
                          }}
                          themeMode={themeMode}
                          robotHardwareConfig={robotHardwareConfig}
                          activeRobotHighlight={activeRobotHighlight}
                          onRobotPlansExtracted={(extractedPlans, extractedActiveId, hwPatch) => {
                            setRobotPlans(extractedPlans);
                            setActiveRobotPlanId(extractedActiveId);
                            if (hwPatch) {
                              setRobotHardwareConfig((prev) => ({
                                ...prev,
                                ...hwPatch,
                                pins: {
                                  ...prev.pins,
                                  ...(hwPatch.pins || {}),
                                },
                              }));
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* Monaco Code Editor (shown in 'code' or bottom half of 'split') */}
                    {(simViewMode === 'code' || simViewMode === 'split') && (
                      <div
                        className="panel-3d panel-code min-w-0 relative overflow-hidden rounded-2xl glass-panel border border-cyan-500/20"
                        style={{ height: simViewMode === 'split' ? (simulatorMode === 'circuit' ? '46%' : '42%') : '100%' }}
                      >
                        <CodeEditor
                          files={simFiles}
                          activeFile={simActiveFile}
                          onSaveFile={() => {
                            handleSaveFile();
                          }}
                          isSyncWithBlocks={(simActiveFile.endsWith('.ino') || simActiveFile.endsWith('.py')) && simSyncStatuses[simActiveFile] === true}
                          onSyncToggle={(sync) => {
                            const pyFile = 'python/main.py';
                            const inoFile = 'firmware/main.ino';
                            if (sync) {
                              try {
                                const currentCode = simFiles[simActiveFile] || '';
                                const xml = simActiveFile.endsWith('.ino')
                                  ? arduinoToBlocklyXml(currentCode)
                                  : pythonToBlocklyXml(currentCode);
                                if (xml && xml.includes('<block')) {
                                  setSimWorkspaceXmls(prev => ({
                                    ...prev,
                                    [simActiveFile]: xml,
                                    [inoFile]: xml,
                                    [pyFile]: xml,
                                  }));
                                }
                              } catch (err) {
                                console.warn('Failed to parse simulator code back to blocks:', err);
                              }
                            }
                            setSimSyncStatuses(prev => ({
                              ...prev,
                              [inoFile]: sync,
                              [pyFile]: sync,
                            }));
                          }}
                          onFileChange={(filename, content) => {
                            setSimFiles(prev => ({
                              ...prev,
                              [filename]: content,
                            }));
                            if (simSyncStatuses[filename] === false) {
                              const inoFile = Object.keys(simFiles).find(f => f.endsWith('.ino')) || 'firmware/main.ino';
                              const pyFile = Object.keys(simFiles).find(f => f.endsWith('.py')) || 'python/main.py';
                              try {
                                if (filename.endsWith('.ino')) {
                                  const xml = arduinoToBlocklyXml(content);
                                  setSimWorkspaceXmls(prev => ({ ...prev, [filename]: xml, [inoFile]: xml, [pyFile]: xml }));
                                } else if (filename.endsWith('.py')) {
                                  const xml = pythonToBlocklyXml(content);
                                  setSimWorkspaceXmls(prev => ({ ...prev, [filename]: xml, [inoFile]: xml, [pyFile]: xml }));
                                }
                              } catch (err) {
                                // Ignore transient parse errors while typing
                              }
                            }
                          }}
                          onTabChange={(filename) => {
                            // Jangan ubah atau timpa blok visual yang sudah dibuat ketika berpindah tab C++ <-> Python
                            setSimActiveFile(filename);
                          }}
                          isRunning={isRunning}
                          onRunSimulator={() => {
                            const codeToRun = simFiles[simActiveFile] || '';
                            if (simActiveFile.endsWith('.py') || simBoard === 'BBC micro:bit') {
                              handleRunPython(codeToRun);
                            } else {
                              handleRunCode(codeToRun);
                            }
                          }}
                          onStopSimulator={() => {
                            handleStopCode();
                            setActiveRobotHighlight(null);
                          }}
                          themeMode={themeMode}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* RIGHT PANE: Hardware Circuit / 3D Robot Simulator + Collapsible Virtual Serial Console */}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-2">
                  <div className={`flex-1 min-w-0 min-h-0 relative rounded-2xl overflow-hidden border shadow-2xl ${themeMode === 'light' ? 'border-slate-200/90 bg-slate-50' : 'border-slate-800 bg-slate-950'}`}>
                    <Simulator
                      isExpanded={true}
                      isRunning={isRunning}
                      robotCommand={robotCommand}
                      sensorData={sensorData}
                      board={simBoard}
                      activePythonCode={simActivePythonCode}
                      activeCode={simActiveCode}
                      microbitFrames={microbitFrames}
                      pinStates={pinStates}
                      onPinStateChange={handlePinStateChange}
                      programPins={programPins}
                      potValue={simulatorPotValue}
                      onPotValueChange={setSimulatorPotValue}
                      buttonPressed={simulatorButtonPressed}
                      onButtonPressedChange={setSimulatorButtonPressed}
                      activeComponents={simulatorActiveComponents}
                      onActiveComponentsChange={setSimulatorActiveComponents}
                      positions={simulatorPositions}
                      onPositionsChange={setSimulatorPositions}
                      wires={simulatorWires}
                      onWiresChange={setSimulatorWires}
                      blynkStatus={blynkStatus}
                      blynkVirtualPins={blynkVirtualPins}
                      onBlynkVirtualWrite={handleBlynkVirtualWrite}
                      isWifiConnected={isWifiConnected}
                      onWifiConnectedChange={setIsWifiConnected}
                      selectedWifi={selectedWifi}
                      onSelectedWifiChange={setSelectedWifi}
                      wifiPassword={wifiPassword}
                      onWifiPasswordChange={setWifiPassword}
                      onSensorDataChange={(newData) => setSensorData(prev => ({ ...prev, ...newData }))}
                      themeMode={themeMode}
                      simulatorMode={simulatorMode}
                      onSimulatorModeChange={setSimulatorMode}
                      robotHardwareConfig={robotHardwareConfig}
                      onRobotHardwareChange={(nextHw) => {
                        syncRobotToSimulatorWorkspace(nextHw, robotPlans, activeRobotPlanId, false);
                      }}
                      robotPlans={robotPlans}
                      activePlanId={activeRobotPlanId}
                      onRobotPlansChange={(nextPlans, nextActiveId) => {
                        syncRobotToSimulatorWorkspace(
                          robotHardwareConfig,
                          nextPlans,
                          nextActiveId ?? activeRobotPlanId,
                          false
                        );
                      }}
                      onSyncRobotToCodeAndBlocks={(hw, nextPlans, nextActiveId) => {
                        syncRobotToSimulatorWorkspace(hw, nextPlans, nextActiveId, true);
                      }}
                      onRobotHighlightChange={setActiveRobotHighlight}
                      onToggleRun={() => {
                        if (isRunning) {
                          handleStopCode();
                          setActiveRobotHighlight(null);
                        } else {
                          const codeToRun = simFiles[simActiveFile] || '';
                          if (simActiveFile.endsWith('.py') || simBoard === 'BBC micro:bit') {
                            handleRunPython(codeToRun);
                          } else {
                            handleRunCode(codeToRun);
                          }
                        }
                      }}
                    />
                  </div>

                  {/* Virtual Simulator Serial / Output Console */}
                  {simShowConsole && (
                    <div className={`h-36 flex-shrink-0 rounded-2xl border p-3 flex flex-col font-mono text-xs overflow-hidden ${themeMode === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#07080d] border-slate-800 text-slate-200'}`}>
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10 select-none">
                        <div className="flex items-center gap-2">
                          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                            Virtual Simulator Serial &amp; Telemetry Log
                          </span>
                          <span className="text-[10px] text-slate-500">({buildStatusText})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setTerminalLogs([])}
                            className="text-[10px] text-slate-400 hover:text-white cursor-pointer px-1.5 py-0.5 rounded bg-white/5"
                          >
                            Bersihkan
                          </button>
                          <button
                            onClick={() => setSimShowConsole(false)}
                            className="text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-[11px]">
                        {terminalLogs.length === 0 ? (
                          <p className="text-slate-500 italic text-[10px]">
                            Klik &quot;Jalankan Simulasi&quot; untuk melihat output Serial.println() / print() dan telemetri virtual di sini...
                          </p>
                        ) : (
                          terminalLogs.map((log, i) => (
                            <div
                              key={i}
                              className={
                                log.type === 'error'
                                  ? 'text-rose-400'
                                  : log.type === 'success'
                                  ? 'text-emerald-400'
                                  : log.type === 'stdout'
                                  ? 'text-cyan-300'
                                  : 'text-slate-300'
                              }
                            >
                              {log.text}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LEARNING PORTAL */}
          {currentTab === 'learning' && (() => {
            const currentLessons = learningCategory === 'fundamental' ? PYTHON_LESSONS : (learningCategory === 'hardware' ? ARDUINO_HARDWARE_LESSONS : MICROPYTHON_LESSONS);
            const currentLesson = currentLessons[activeLessonIndex] || currentLessons[0];
            
            return (
              <div className={`absolute inset-0 p-8 overflow-y-auto space-y-6 transition ${themeMode === 'light' ? 'bg-[#f8fafc] text-slate-800' : 'bg-[#0a0b10] text-slate-100'}`}>
                {/* Header */}
                <div className="w-full space-y-1 select-none">
                  <h2 className={`text-lg font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`} style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                    {t(language, 'learning', 'title')}
                  </h2>
                  <p className={`text-[11px] ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    {t(language, 'learning', 'subtitle')}
                  </p>
                </div>

                {/* 3-Column Layout */}
                <div className="flex gap-5 w-full min-h-[580px] items-stretch">
                  {/* Column 1 (Left): Category Selector + Nav List */}
                  <div className="w-64 flex flex-col gap-3 flex-shrink-0">
                    {/* Category Switcher Tabs */}
                    <div className={`flex p-1 rounded-xl gap-1 ${themeMode === 'light' ? 'bg-slate-200/60' : 'bg-slate-900/60 border border-slate-800'}`}>
                      <button
                        onClick={() => { setLearningCategory('fundamental'); setActiveLessonIndex(0); }}
                        className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition select-none cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                          learningCategory === 'fundamental'
                            ? 'bg-blue-600 text-white shadow'
                            : themeMode === 'light' ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <PythonLogo className="w-3.5 h-3.5" />
                        <span>{t(language, 'learning', 'pythonBasic')}</span>
                      </button>
                      <button
                        onClick={() => { setLearningCategory('micropython'); setActiveLessonIndex(0); }}
                        className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition select-none cursor-pointer text-center ${
                          learningCategory === 'micropython'
                            ? 'bg-blue-600 text-white shadow'
                            : themeMode === 'light' ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t(language, 'learning', 'microPython')}
                      </button>
                      <button
                        onClick={() => { setLearningCategory('hardware'); setActiveLessonIndex(0); }}
                        className={`flex-1 py-1.5 text-[8.5px] font-bold rounded-lg transition select-none cursor-pointer text-center flex items-center justify-center gap-1 ${
                          learningCategory === 'hardware'
                            ? 'bg-blue-600 text-white shadow'
                            : themeMode === 'light' ? 'text-slate-600 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Cpu className="w-3 h-3" />
                        <span>Hardware Arduino</span>
                      </button>
                    </div>

                    {/* Lesson Buttons List */}
                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-1">
                      {currentLessons.map((lesson, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveLessonIndex(idx)}
                          className={`text-left p-3 rounded-xl border transition cursor-pointer select-none ${
                            activeLessonIndex === idx
                              ? themeMode === 'light'
                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/40 shadow-sm font-bold'
                                : 'bg-blue-950/45 text-sky-400 border-blue-800/60 shadow-lg'
                              : themeMode === 'light'
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-800 hover:bg-slate-800/20'
                          }`}
                        >
                          <h4 className="text-[10.5px] font-bold font-mono truncate">{lesson.title}</h4>
                          <p className="text-[9px] text-slate-500 mt-0.5 leading-normal line-clamp-2">{lesson.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Column 2 (Middle): Module Detail Panel */}
                  <div className={`flex-1 rounded-2xl p-5 flex flex-col gap-4 overflow-y-auto shadow-xl border ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c0d12] border-[#181b28]'}`}>
                    <div className="flex items-center justify-between pb-2.5 flex-shrink-0 border-b" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t(language, 'learning', 'moduleDetail')}</span>
                      <button
                        onClick={() => {
                          setLearningLessonLoadedCount(prev => prev + 1);
                          if (learningCategory === 'hardware') {
                            const blocklyXml = (currentLesson as any).xml || '';
                            const cppCode = currentLesson.code || '';

                            setBoard('Arduino Uno');
                            setFiles(prev => ({
                              ...prev,
                              'firmware/main.ino': cppCode,
                              'python/main.py': `# Hardware Arduino: ${currentLesson.title}\n`
                            }));

                            setWorkspaceXmls(prev => ({
                              ...prev,
                              'firmware/main.ino': blocklyXml,
                              'python/main.py': blocklyXml
                            }));

                            setSyncStatuses(prev => ({
                              ...prev,
                              'firmware/main.ino': false,
                              'python/main.py': false
                            }));

                            setActiveFile('firmware/main.ino');
                            setCurrentTab('ide');
                            setWorkspaceMode('split');
                            setTerminalLogs(prev => [
                              ...prev,
                              { text: `✓ Memuat materi Hardware Arduino '${currentLesson.title}' ke workspace editor!`, type: 'success' }
                            ]);
                          } else if (learningCategory === 'micropython') {
                            const blocklyXml = (currentLesson as any).xml || '';
                            const cppCode = (currentLesson as any).cppCode || `// C++ counterpart\n`;

                            setFiles(prev => ({
                              ...prev,
                              'python/main.py': currentLesson.code,
                              'firmware/main.ino': cppCode
                            }));

                            setWorkspaceXmls(prev => ({
                              ...prev,
                              'python/main.py': blocklyXml,
                              'firmware/main.ino': blocklyXml
                            }));

                            setSyncStatuses(prev => ({
                              ...prev,
                              'python/main.py': false,
                              'firmware/main.ino': false
                            }));

                            setActiveFile('python/main.py');
                            setCurrentTab('ide');
                            setWorkspaceMode('split');
                            setTerminalLogs(prev => [
                              ...prev,
                              { text: `✓ Memuat kode MicroPython & Sirkuit Simulator interaktif ke editor!`, type: 'success' }
                            ]);
                          } else {
                            setFiles(prev => ({
                              ...prev,
                              'python/main.py': currentLesson.code
                            }));
                            setSyncStatuses(prev => ({
                              ...prev,
                              'python/main.py': false,
                              'firmware/main.ino': false
                            }));
                            setActiveFile('python/main.py');
                            setCurrentTab('ide');
                            setWorkspaceMode('code');
                            setTerminalLogs(prev => [
                              ...prev,
                              { text: `✓ Memuat kode fundamental Python ke 'python/main.py'`, type: 'info' }
                            ]);
                          }
                        }}
                        className="px-2.5 py-1.5 text-white rounded-lg text-[9px] font-bold transition shadow-md cursor-pointer select-none hover:opacity-95"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        {t(language, 'learning', 'loadToEditor')}
                      </button>
                    </div>

                    <div className={`prose max-w-none text-[11px] leading-relaxed space-y-3 ${themeMode === 'light' ? 'prose-slate text-slate-600' : 'prose-invert text-slate-300'}`}>
                      <h3 className={`text-xs font-bold mb-1.5 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{currentLesson.title}</h3>
                      {currentLesson.content.split('\n\n').map((paragraph, pIdx) => {
                        if (paragraph.startsWith('###')) {
                          return <h4 key={pIdx} className={`text-[10.5px] font-bold mt-3.5 border-b pb-1 ${themeMode === 'light' ? 'text-slate-800 border-slate-200/80' : 'text-slate-200 border-slate-800/40'}`}>{paragraph.replace('###', '').trim()}</h4>;
                        }
                        if (paragraph.startsWith('-')) {
                          return (
                            <ul key={pIdx} className={`list-disc pl-4 space-y-1 my-1.5 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                              {paragraph.split('\n').map((li, liIdx) => (
                                <li key={liIdx}>{li.replace('-', '').trim()}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={pIdx} className={themeMode === 'light' ? 'text-slate-600' : 'text-slate-300'}>{paragraph}</p>;
                      })}
                    </div>

                    <div className="space-y-1 flex-1 flex flex-col min-h-[150px] relative group">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{t(language, 'learning', 'codeExample')}</span>
                        <button 
                          onClick={(e) => {
                            try {
                              const req = (window as any).__electronRequire || (window as any).require;
                              if (req) {
                                const { clipboard } = req('electron');
                                clipboard.writeText(currentLesson.code);
                              } else if (navigator.clipboard) {
                                navigator.clipboard.writeText(currentLesson.code);
                              } else {
                                const textArea = document.createElement("textarea");
                                textArea.value = currentLesson.code;
                                document.body.appendChild(textArea);
                                textArea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textArea);
                              }
                              const el = (e.currentTarget.nextElementSibling as HTMLElement);
                              if (el) {
                                el.classList.remove('opacity-0');
                                setTimeout(() => el.classList.add('opacity-0'), 2000);
                              }
                            } catch (err) {
                              console.error("Failed to copy", err);
                            }
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold transition opacity-0 group-hover:opacity-100 cursor-pointer ${themeMode === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                        >
                          <Copy className="w-3 h-3" />
                          <span>{t(language, 'learning', 'copy')}</span>
                        </button>
                        <span className="absolute right-2 top-8 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded opacity-0 transition-opacity pointer-events-none z-10">{t(language, 'learning', 'copied')}</span>
                      </div>
                      <pre className={`p-3 rounded-xl font-mono text-[9px] overflow-auto flex-1 select-text border relative ${themeMode === 'light' ? 'bg-[#f1f5f9] border-slate-200 text-emerald-800' : 'bg-[#050608] border-slate-900 text-emerald-400'}`}>
                        {currentLesson.code}
                      </pre>
                    </div>
                  </div>

                  {/* Column 3 (Right): Interactive Visualizer & Illustration Panel */}
                  <div className={`w-[290px] rounded-2xl p-5 flex flex-col gap-4 flex-shrink-0 shadow-xl border overflow-y-auto ${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#0c0d12] border-[#181b28]'}`}>
                    {renderLearningVisualizer()}
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* 4. MOCK STATUS BAR (At bottom of application matching design) */}
      <div className="h-6 glass-header border-t px-4 flex items-center justify-between font-mono text-[9px] text-slate-500 select-none flex-shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-blue-500 font-bold">RoboLab Studio v1.0.0</span>
          <span>Bound: {currentTab === 'simulator' ? `${simBoard} (Sim)` : board}</span>
          <span>Port: {port || 'Web Serial'}</span>
          <span>Baudrate: {serialBaudrate}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Ln 15, Col 25</span>
          <span>Spaces: 2</span>
          <span>UTF-8</span>
          <span>LF</span>
          <span>{(currentTab === 'simulator' ? simActiveFile : activeFile).endsWith('.py') ? 'MicroPython' : 'C++'}</span>
          <span>{currentTab === 'simulator' ? simBoard : board}</span>
        </div>
      </div>

      {/* 5. NEW FILE DIALOG MODAL (CARD BUTTON SELECTOR & THEME ADAPTIVE) */}
      {showNewFileModal && (() => {
        const isLight = themeMode === 'light';
        const fileTypeOptions: Array<{
          ext: 'ino' | 'py' | 'h' | 'cpp' | 'c' | 'json';
          title: string;
          badge: string;
          desc: string;
          defaultBase: string;
          suggestions: string[];
          icon: React.ReactNode;
        }> = [
          {
            ext: 'ino',
            title: 'Arduino Sketch',
            badge: '.ino',
            desc: 'Program utama mikrokontroler C++ (setup & loop)',
            defaultBase: 'main',
            suggestions: ['main', 'sensor', 'motor_control', 'iot_blynk'],
            icon: <Cpu className="w-4 h-4" />
          },
          {
            ext: 'py',
            title: 'Python / MicroPython',
            badge: '.py',
            desc: 'Skrip Python untuk robotika, AI Vision & IoT',
            defaultBase: 'main',
            suggestions: ['main', 'robot_ai', 'sensor_node', 'vision'],
            icon: <PythonLogo className="w-4 h-4" />
          },
          {
            ext: 'h',
            title: 'Header C/C++',
            badge: '.h',
            desc: 'Deklarasi fungsi, konstanta pin & konfigurasi',
            defaultBase: 'config',
            suggestions: ['config', 'pins', 'secrets', 'sensors'],
            icon: <Code className="w-4 h-4" />
          },
          {
            ext: 'cpp',
            title: 'Modul C++',
            badge: '.cpp',
            desc: 'Implementasi class & driver perangkat keras C++',
            defaultBase: 'motor_driver',
            suggestions: ['motor_driver', 'pid_controller', 'oled_ui', 'helper'],
            icon: <FileText className="w-4 h-4" />
          },
          {
            ext: 'c',
            title: 'Modul Bahasa C',
            badge: '.c',
            desc: 'Kode sumber C standar tingkat rendah',
            defaultBase: 'utils',
            suggestions: ['utils', 'hal_driver', 'crc_check'],
            icon: <FileIcon className="w-4 h-4" />
          },
          {
            ext: 'json',
            title: 'Konfigurasi JSON',
            badge: '.json',
            desc: 'Data konfigurasi, kalibrasi & parameter proyek',
            defaultBase: 'config',
            suggestions: ['config', 'calibration', 'settings'],
            icon: <Sliders className="w-4 h-4" />
          }
        ];

        const activeOption = fileTypeOptions.find(o => o.ext === newFileType) || fileTypeOptions[0];
        const rawCleaned = newFileName
          .trim()
          .replace(/\.(ino|py|h|hpp|cpp|c|json|txt|md|hex)$/i, '')
          .replace(/[\\/:*?"<>|]/g, '_');
        const effectiveBaseName = rawCleaned || activeOption.defaultBase;
        const finalFileName = `${effectiveBaseName}.${newFileType}`;

        const confirmCreateNewFile = () => {
          const base = rawCleaned || activeOption.defaultBase;
          const targetName = `${base}.${newFileType}`;
          let defaultContent = `void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  \n}\n`;

          if (newFileType === 'py') {
            defaultContent = `# Berkas MicroPython / Python: ${targetName}\nimport time\nimport robolab as robot\n\ndef loop():\n    while True:\n        print("RoboLab Python aktif")\n        time.sleep(1)\n\nif __name__ == "__main__":\n    loop()\n`;
          } else if (newFileType === 'h') {
            const guard = `${base.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}_H`;
            defaultContent = `#ifndef ${guard}\n#define ${guard}\n\n#include <Arduino.h>\n\n// Deklarasi konstanta & fungsi untuk ${base}\n\n#endif // ${guard}\n`;
          } else if (newFileType === 'cpp') {
            defaultContent = `#include <Arduino.h>\n#include "${base}.h"\n\n// Implementasi fungsi C++ untuk ${base}\n`;
          } else if (newFileType === 'c') {
            defaultContent = `#include <Arduino.h>\n\n// Implementasi fungsi C untuk ${base}\n`;
          } else if (newFileType === 'json') {
            defaultContent = `{\n  "project": "${projectName || 'RoboLab_Project'}",\n  "board": "${board}",\n  "baudrate": 115200\n}\n`;
          }

          let savedDiskPath: string | undefined = undefined;
          const req = (window as any).__electronRequire || (window as any).require;
          if (req && projectPath) {
            try {
              const fs = req('fs');
              const pathMod = req('path');
              const fullPath = pathMod.join(projectPath, targetName);
              fs.writeFileSync(fullPath, defaultContent, 'utf-8');
              savedDiskPath = fullPath;
              setFilePaths(prev => ({ ...prev, [targetName]: fullPath }));
            } catch (e) {
              console.warn('Could not save new file to projectPath:', e);
            }
          }

          handleOpenFileAction(targetName, defaultContent, savedDiskPath);
          setTerminalLogs(prev => [
            ...prev,
            { text: `✓ Berkas baru '${targetName}' (${activeOption.title}) berhasil dibuat.`, type: 'success' }
          ]);
          setNewFileName('');
          setShowNewFileModal(false);
        };

        return (
          <div
            className={`fixed inset-0 flex items-center justify-center z-[99999] select-none p-4 ${
              isLight ? 'bg-slate-900/30 backdrop-blur-md' : 'bg-black/65 backdrop-blur-sm'
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowNewFileModal(false);
            }}
          >
            <div
              className="glass-panel rounded-2xl p-6 w-full max-w-[540px] space-y-5 shadow-2xl relative overflow-hidden"
              style={
                isLight
                  ? {
                      background: '#ffffff',
                      border: '1px solid rgba(var(--accent-rgb), 0.22)',
                      boxShadow: '0 24px 60px -15px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(var(--accent-rgb), 0.08)'
                    }
                  : {
                      background: 'var(--glass-bg)',
                      border: '1px solid rgba(var(--accent-rgb), 0.28)',
                      boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.75), 0 0 30px -8px rgba(var(--accent-rgb), 0.18)'
                    }
              }
            >
              {/* Decorative ambient accent glow */}
              <div
                className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[70px] pointer-events-none"
                style={{ background: 'var(--accent-primary)', opacity: isLight ? 0.12 : 0.18 }}
              />

              {/* Header */}
              <div
                className="flex justify-between items-center pb-3.5 border-b relative z-10"
                style={{ borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.14)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(var(--accent-rgb), 0.28)'
                    }}
                  >
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold tracking-wide uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>
                      Buat Berkas Baru
                    </h3>
                    <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Pilih jenis berkas di bawah, lalu ketik nama tanpa menulis ekstensi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    isLight
                      ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Step 1: Card Button File Type Picker */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <label
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                  >
                    1. Pilih Jenis Berkas
                  </label>
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.12)',
                      color: 'var(--accent-primary)'
                    }}
                  >
                    Ekstensi Otomatis: .{newFileType}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {fileTypeOptions.map((item) => {
                    const isSelected = newFileType === item.ext;
                    return (
                      <button
                        key={item.ext}
                        type="button"
                        onClick={() => setNewFileType(item.ext)}
                        className="group relative text-left rounded-xl p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 overflow-hidden"
                        style={
                          isSelected
                            ? {
                                background: isLight
                                  ? 'rgba(var(--accent-rgb), 0.10)'
                                  : 'rgba(var(--accent-rgb), 0.16)',
                                border: '1.5px solid var(--accent-primary)',
                                boxShadow: isLight
                                  ? '0 8px 20px -6px rgba(var(--accent-rgb), 0.25)'
                                  : '0 8px 24px -6px rgba(var(--accent-rgb), 0.35)'
                              }
                            : {
                                background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                                border: isLight
                                  ? '1.5px solid rgba(15, 23, 42, 0.08)'
                                  : '1.5px solid rgba(255, 255, 255, 0.08)'
                              }
                        }
                      >
                        <div className="flex items-center justify-between w-full">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
                            style={
                              isSelected
                                ? {
                                    background: 'var(--accent-gradient)',
                                    color: '#ffffff',
                                    boxShadow: '0 4px 10px rgba(var(--accent-rgb), 0.35)'
                                  }
                                : {
                                    background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.06)',
                                    color: isLight ? '#475569' : '#94a3b8'
                                  }
                            }
                          >
                            {item.icon}
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md transition"
                              style={
                                isSelected
                                  ? {
                                      background: 'var(--accent-gradient)',
                                      color: '#ffffff'
                                    }
                                  : {
                                      background: isLight ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.07)',
                                      color: isLight ? '#475569' : '#94a3b8'
                                    }
                              }
                            >
                              {item.badge}
                            </span>
                            {isSelected && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                                style={{ background: 'var(--accent-primary)' }}
                              >
                                <Check className="w-2.5 h-2.5 stroke-[3px]" />
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div
                            className="text-xs font-bold leading-snug"
                            style={{
                              color: isSelected
                                ? isLight
                                  ? 'var(--accent-primary)'
                                  : '#ffffff'
                                : isLight
                                  ? '#1e293b'
                                  : '#e2e8f0'
                            }}
                          >
                            {item.title}
                          </div>
                          <div
                            className={`text-[10px] leading-tight mt-0.5 line-clamp-2 ${
                              isLight ? 'text-slate-500' : 'text-slate-400'
                            }`}
                          >
                            {item.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: File Base Name Input (Auto-Extension) */}
              <div className="space-y-2 relative z-10">
                <label
                  className="text-[10px] font-bold uppercase tracking-wider block"
                  style={{ color: isLight ? '#334155' : '#cbd5e1' }}
                >
                  2. Nama Berkas (Tanpa Menulis Ekstensi)
                </label>

                <div
                  className="flex items-center rounded-xl overflow-hidden transition-all"
                  style={{
                    background: isLight ? '#f8fafc' : 'rgba(10, 12, 20, 0.85)',
                    border: '1.5px solid var(--accent-primary)',
                    boxShadow: '0 0 0 3px rgba(var(--accent-rgb), 0.12)'
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Contoh: ${activeOption.defaultBase}`}
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        confirmCreateNewFile();
                      } else if (e.key === 'Escape') {
                        setShowNewFileModal(false);
                      }
                    }}
                    className={`flex-1 bg-transparent px-3.5 py-2.5 text-xs font-mono focus:outline-none ${
                      isLight ? 'text-slate-800 placeholder-slate-400' : 'text-slate-100 placeholder-slate-500'
                    }`}
                  />
                  <div
                    className="px-3.5 py-2.5 text-xs font-mono font-bold select-none border-l"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.14)',
                      color: 'var(--accent-primary)',
                      borderColor: 'rgba(var(--accent-rgb), 0.25)'
                    }}
                  >
                    .{newFileType}
                  </div>
                </div>

                {/* Quick Name Suggestion Chips & Live Preview */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Saran cepat:</span>
                    {activeOption.suggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewFileName(sug)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md transition cursor-pointer"
                        style={
                          effectiveBaseName === sug
                            ? {
                                background: 'rgba(var(--accent-rgb), 0.18)',
                                color: 'var(--accent-primary)',
                                border: '1px solid rgba(var(--accent-rgb), 0.35)'
                              }
                            : {
                                background: isLight ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)',
                                color: isLight ? '#475569' : '#94a3b8',
                                border: '1px solid transparent'
                              }
                        }
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] font-mono flex items-center gap-1">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Hasil:</span>
                    <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {finalFileName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div
                className="flex items-center justify-end gap-2.5 pt-3 border-t relative z-10"
                style={{ borderColor: isLight ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.08)' }}
              >
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
                    isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmCreateNewFile}
                  className="text-xs font-bold text-white px-5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md hover:opacity-95"
                  style={{
                    background: 'var(--accent-gradient)',
                    boxShadow: '0 6px 16px -3px rgba(var(--accent-rgb), 0.4)'
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat {finalFileName}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. EXPANDED SIMULATOR MODAL */}
      {isSimulatorExpanded && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex"
          onClick={(e) => { if (e.target === e.currentTarget) setIsSimulatorExpanded(false); }}
        >
          {/* Floating close button */}
          <button
            onClick={() => setIsSimulatorExpanded(false)}
            className="absolute top-3 right-4 z-10 text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer bg-slate-900/80 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition duration-150 select-none"
          >
            ✕ ESC
          </button>

          {/* Full-bleed Simulator */}
          <div className="flex-1 min-w-0 min-h-0 p-3">
            <Simulator
              isExpanded={true}
              isRunning={isRunning}
              robotCommand={robotCommand}
              sensorData={sensorData}
              board={simBoard}
              activePythonCode={simActivePythonCode}
              activeCode={simActiveCode}
              microbitFrames={microbitFrames}
              pinStates={pinStates}
              onPinStateChange={handlePinStateChange}
              programPins={programPins}
              potValue={simulatorPotValue}
              onPotValueChange={setSimulatorPotValue}
              buttonPressed={simulatorButtonPressed}
              onButtonPressedChange={setSimulatorButtonPressed}
              activeComponents={simulatorActiveComponents}
              onActiveComponentsChange={setSimulatorActiveComponents}
              positions={simulatorPositions}
              onPositionsChange={setSimulatorPositions}
              wires={simulatorWires}
              onWiresChange={setSimulatorWires}
              blynkStatus={blynkStatus}
              blynkVirtualPins={blynkVirtualPins}
              onBlynkVirtualWrite={handleBlynkVirtualWrite}
              isWifiConnected={isWifiConnected}
              onWifiConnectedChange={setIsWifiConnected}
              selectedWifi={selectedWifi}
              onSelectedWifiChange={setSelectedWifi}
              wifiPassword={wifiPassword}
              themeMode={themeMode}
              onWifiPasswordChange={setWifiPassword}
              onSensorDataChange={(newData) => setSensorData(prev => ({ ...prev, ...newData }))}
            />
          </div>
        </div>
      )}

      {/* 7. SETTINGS MODAL */}
      {showSettingsModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[400px] shadow-2xl relative" style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Pengaturan Sistem</h3>
              <button onClick={() => setShowSettingsModal(false)} className={`transition cursor-pointer ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-350'}`}><X className="w-4 h-4" /></button>
            </div>
            
            <div className="p-5 space-y-6">
              {/* Theme Settings */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Mode Tampilan</label>
                  <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#94a3b8' }}>Ubah tema interface aplikasi</span>
                </div>
                <div className={`flex gap-1.5 p-1 rounded-xl transition ${themeMode === 'light' ? 'bg-slate-200/60' : 'bg-slate-900/40'}`}>
                  <button 
                    onClick={() => setThemeMode('light')}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg transition duration-200 cursor-pointer ${themeMode === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setThemeMode('dark')}
                    className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg transition duration-200 cursor-pointer ${themeMode === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Dark
                  </button>
                </div>
              </div>

              {/* Theme Colors */}
              <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                <div className="space-y-0.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Warna Aksen</label>
                  <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#94a3b8' }}>Sesuaikan warna aksen &amp; kartu sistem</span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { id: 'cyan', bg: 'bg-[#06b6d4]', title: 'Cyan' },
                    { id: 'sky', bg: 'bg-[#0ea5e9]', title: 'Sky' },
                    { id: 'emerald', bg: 'bg-[#10b981]', title: 'Emerald' },
                    { id: 'pink', bg: 'bg-[#ec4899]', title: 'Pink' }
                  ].map((item) => {
                    const isSelected = themeColor === item.id;
                    return (
                      <button 
                        key={item.id}
                        onClick={() => setThemeColor(item.id as any)}
                        className={`w-6 h-6 rounded-full ${item.bg} flex items-center justify-center transition cursor-pointer relative shadow-md hover:scale-110`}
                        title={item.title}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Extra System Settings */}
              <div className="pt-4 border-t space-y-4" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Baudrate Serial</label>
                    <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#cbd5e1' }}>Kecepatan data komunikasi serial</span>
                  </div>
                  <select 
                    className="rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                    style={{
                      background: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      color: themeMode === 'light' ? '#1e293b' : '#e2e8f0',
                      border: themeMode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                    defaultValue="115200"
                  >
                    <option value="9600">9600 bps</option>
                    <option value="19200">19200 bps</option>
                    <option value="38400">38400 bps</option>
                    <option value="57600">57600 bps</option>
                    <option value="115200">115200 bps</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Ukuran Font Editor</label>
                    <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#cbd5e1' }}>Ukuran teks di code editor</span>
                  </div>
                  <select 
                    className="rounded-lg px-2 py-1 text-xs focus:outline-none cursor-pointer"
                    style={{
                      background: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      color: themeMode === 'light' ? '#1e293b' : '#e2e8f0',
                      border: themeMode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                    defaultValue="14"
                  >
                    <option value="12">12 px</option>
                    <option value="14">14 px</option>
                    <option value="16">16 px</option>
                    <option value="18">18 px</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Simpan Otomatis</label>
                    <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#cbd5e1' }}>Simpan berkas setiap terjadi perubahan</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div 
                      className="w-8 h-4 bg-slate-400/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-500 after:rounded-full after:h-3 after:w-3 after:transition-all"
                      style={{
                        background: 'rgba(var(--accent-rgb), 0.2)'
                      }}
                    ></div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                  <div className="space-y-0.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: themeMode === 'light' ? '#1e293b' : '#f8fafc' }}>Driver USB COM Port</label>
                    <span className="text-[8px]" style={{ color: themeMode === 'light' ? '#64748b' : '#cbd5e1' }}>Install driver CP2102 &amp; CH340</span>
                  </div>
                  <button
                    onClick={async () => {
                      if ((window as any).electron?.ipcRenderer) {
                        try {
                          const res = await (window as any).electron.ipcRenderer.invoke('install-usb-drivers');
                          if (res?.success) {
                            alert('Instalasi driver USB COM Port (CP2102 & CH340) berhasil dipicu!');
                          } else {
                            alert('Gagal menginstal driver: ' + (res?.error || 'Unknown error'));
                          }
                        } catch (e: any) {
                          alert('Error memanggil IPC driver: ' + (e?.message || e));
                        }
                      } else {
                        alert('Fitur auto-install driver hanya tersedia di aplikasi RoboLab Desktop (Electron).');
                      }
                    }}
                    className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition cursor-pointer border border-cyan-500/30"
                  >
                    Install Driver
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 mt-4 border-t" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-[10px] font-bold text-white-force px-5 py-2.5 rounded-xl transition duration-200 cursor-pointer shadow-md"
                style={{
                  background: 'var(--accent-gradient)',
                  boxShadow: '0 4px 12px rgba(var(--accent-rgb), 0.3)'
                }}
              >
                Simpan &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. HELP MODAL */}
      {showHelpModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[450px] h-[380px] flex flex-col justify-between shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            {/* Header */}
            <div className="flex justify-between items-center pb-2 flex-shrink-0 border-b" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Pusat Bantuan RoboLab</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)} 
                className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab navigation inside help modal */}
            <div className="flex gap-2 py-1.5 flex-shrink-0 border-b" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              {[
                { id: 'quickstart', label: 'Panduan Cepat' },
                { id: 'shortcuts', label: 'Pintasan Keyboard' },
                { id: 'about', label: 'Tentang Aplikasi' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setHelpTab(tab.id as any)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    helpTab === tab.id
                      ? 'shadow-sm'
                      : themeMode === 'light'
                        ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                  style={helpTab === tab.id ? { 
                    background: 'rgba(var(--accent-rgb), 0.11)', 
                    color: 'var(--accent-primary)',
                    border: '1px solid rgba(var(--accent-rgb), 0.25)' 
                  } : {
                    border: '1px solid transparent'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content Box - Scrollable */}
            <div className={`flex-1 overflow-y-auto py-4 text-xs leading-relaxed min-h-0 select-text ${themeMode === 'light' ? 'text-slate-650' : 'text-slate-300'}`}>
              {helpTab === 'quickstart' && (
                <div className="space-y-3.5">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}><Play className="w-3 h-3" style={{ color: 'var(--accent-primary)' }} /> Langkah Memulai Project:</h4>
                  <ol className="list-decimal pl-4.5 space-y-2 text-[11px]">
                    <li>
                      <strong className={themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Pilih Board Mikrokontroler:</strong> Pada menu di header kanan, pilih board (ESP32 DevKit V1, Arduino Uno, atau BBC micro:bit).
                    </li>
                    <li>
                      <strong className={themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Susun Rangkaian Simulator:</strong> Hubungkan pin mikrokontroler ke komponen sirkuit (LED, Motor, Potensiometer, LCD) secara interaktif dengan membuat kabel (klik antar pin/lubang).
                    </li>
                    <li>
                      <strong className={themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Tulis Program:</strong> Gunakan editor <strong style={{ color: 'var(--accent-primary)' }}>Blockly</strong> (visual block-based coding) atau editor <strong className="text-sky-550">Monaco</strong> (teks berbasis C++ Arduino / Python). Kode dapat disinkronkan secara otomatis.
                    </li>
                    <li>
                      <strong className={themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}>Jalankan Simulasi:</strong> Klik tombol <strong className="text-emerald-550">Run All</strong>. Rangkaian sirkuit 3D akan mensimulasikan status logika sirkuit, telemetri data, dan pembacaan sensor secara langsung.
                    </li>
                  </ol>
                </div>
              )}

              {helpTab === 'shortcuts' && (
                <div className="space-y-3">
                  <h4 className={`text-xs font-bold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Pintasan keyboard editor kode:</h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                    {[
                      { key: 'Ctrl + S', desc: 'Simpan berkas aktif' },
                      { key: 'F5 / Ctrl + Enter', desc: 'Jalankan simulasi' },
                      { key: 'Ctrl + Space', desc: 'Auto-complete teks' },
                      { key: 'Ctrl + F', desc: 'Cari teks di editor' },
                      { key: 'Ctrl + H', desc: 'Ganti kata di editor' },
                      { key: 'Esc', desc: 'Keluar / Tutup modal' }
                    ].map((item, idx) => (
                      <div key={idx} className={`flex justify-between items-center border rounded-lg p-2 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
                        <span className="font-bold" style={{ color: 'var(--accent-primary)' }}>{item.key}</span>
                        <span className={`text-[10px] text-right font-sans ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {helpTab === 'about' && (
                <div className="space-y-3.5 flex flex-col items-center text-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden mt-1 shadow-lg border ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                    <img src="./icon-only.png" className="w-9 h-9 object-contain" alt="RoboLab Logo" />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold tracking-wide ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>RoboLab Studio</h4>
                    <p className="text-[10px] font-bold font-mono" style={{ color: 'var(--accent-primary)' }}>Versi 1.0.0 (Production Build)</p>
                  </div>
                  <p className={`text-[11px] max-w-sm ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                    RoboLab Studio adalah platform pembelajaran robotika terintegrasi yang menggabungkan blockly coding, editor monaco profesional, sirkuit simulator 3D interaktif, AI Camera Vision, dan telemetri data IoT dalam satu sistem terpadu.
                  </p>
                  <p className="text-[9px] text-slate-500 font-medium">
                    &copy; 2026 RoboLab Studio &amp; Pymasterclass. All rights reserved.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 flex-shrink-0 border-t" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-[10px] font-bold text-white-force px-5 py-2 rounded-xl transition cursor-pointer shadow-md"
                style={{ background: 'var(--accent-gradient)' }}
              >
                Tutup Bantuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8.5 COMMAND PALETTE */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        themeMode={themeMode}
        commands={[
          { id: 'new_file', title: 'Buat Berkas Baru...', category: 'File', icon: <Plus className="w-4 h-4 text-emerald-400" />, shortcut: 'Ctrl+N', action: handleCreateFile },
          { id: 'open', title: 'Buka Berkas...', category: 'File', icon: <FolderOpen className="w-4 h-4 text-amber-400" />, shortcut: 'Ctrl+O', action: handleNativeOpenFile },
          { id: 'save', title: 'Simpan Berkas', category: 'File', icon: <Save className="w-4 h-4 text-blue-400" />, shortcut: 'Ctrl+S', action: handleSaveFile },
          { id: 'verify', title: 'Kompilasi Firmware (Verify)', category: 'Hardware', icon: <Check className="w-4 h-4 text-emerald-400" />, action: () => handleArduinoHardwareAction('verify') },
          { id: 'upload', title: 'Unggah ke Board (Upload)', category: 'Hardware', icon: <Upload className="w-4 h-4 text-purple-400" />, action: () => handleArduinoHardwareAction('upload') },
          { id: 'board_mgr', title: 'Buka Board Manager', category: 'Tools', icon: <Cpu className="w-4 h-4 text-purple-400" />, action: () => setShowBoardManagerModal(true) },
          { id: 'lib_mgr', title: 'Buka Library Manager', category: 'Tools', icon: <Sliders className="w-4 h-4 text-cyan-400" />, action: () => setShowLibraryManagerModal(true) },
          { id: 'settings', title: 'Buka Pengaturan Sistem', category: 'Settings', icon: <Sliders className="w-4 h-4 text-slate-400" />, action: () => setShowSettingsModal(true) },
          { id: 'help', title: 'Buka Pusat Bantuan', category: 'Help', icon: <HelpCircle className="w-4 h-4 text-blue-400" />, action: () => setShowHelpModal(true) }
        ]}
      />

      {/* 9. ABOUT MODAL */}
      {showAboutModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[440px] flex flex-col gap-4 shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Tentang RoboLab Studio</h3>
              </div>
              <button onClick={() => setShowAboutModal(false)} className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* App Info */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <img src="./icon-only.png" className="w-11 h-11 object-contain" alt="RoboLab Logo" />
              </div>
              <div>
                <h4 className={`text-base font-bold tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>RoboLab Studio</h4>
                <p className="text-xs font-bold font-mono mt-0.5" style={{ color: 'var(--accent-primary)' }}>v{appVersion}</p>
              </div>
              <p className={`text-xs leading-relaxed max-w-xs ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                IDE Terpadu Robotika &amp; IoT dengan Visual Block Coding (Blockly), Code Editor (C++/MicroPython), Simulator 3D Interaktif &amp; Serial Monitor.
              </p>
            </div>

            {/* Update Section */}
            <div className={`rounded-xl p-3 border text-xs ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-semibold ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>Pembaruan Aplikasi</span>
                {updateStatus.status === 'idle' && (
                  <button
                    onClick={async () => {
                      setUpdateStatus({ status: 'checking' });
                      try {
                        const req = (window as any).__electronRequire || (window as any).require;
                        if (req) {
                          const { ipcRenderer } = req('electron');
                          const result = await ipcRenderer.invoke('check-for-updates');
                          if (result) setUpdateStatus(result);
                        } else {
                          setUpdateStatus({ status: 'error', message: 'Hanya tersedia di aplikasi desktop.' });
                        }
                      } catch (e: any) {
                        setUpdateStatus({ status: 'error', message: e?.message || 'Gagal memeriksa pembaruan.' });
                      }
                    }}
                    className="text-[10px] font-bold px-3 py-1 rounded-lg cursor-pointer transition"
                    style={{ background: 'var(--accent-gradient)', color: '#fff' }}
                  >
                    Periksa Pembaruan
                  </button>
                )}
                {(updateStatus.status === 'checking') && (
                  <span className="text-[10px] text-slate-400 animate-pulse">Memeriksa...</span>
                )}
                {updateStatus.status !== 'idle' && updateStatus.status !== 'checking' && (
                  <button
                    onClick={() => setUpdateStatus({ status: 'idle' })}
                    className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${themeMode === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                  >reset</button>
                )}
              </div>

              {/* Status Messages */}
              {updateStatus.status === 'not-available' && (
                <p className="text-emerald-500 text-[11px]">✓ Aplikasi sudah versi terbaru.</p>
              )}
              {updateStatus.status === 'available' && (
                <p className="text-blue-400 text-[11px]">🔄 Versi baru <strong>v{updateStatus.version}</strong> tersedia — mengunduh...</p>
              )}
              {updateStatus.status === 'downloading' && (
                <div className="space-y-1.5">
                  <p className="text-blue-400 text-[11px]">⬇ Mengunduh... {updateStatus.percent}%</p>
                  <div className={`w-full h-1.5 rounded-full ${themeMode === 'light' ? 'bg-slate-200' : 'bg-white/10'}`}>
                    <div className="h-1.5 rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${updateStatus.percent}%` }} />
                  </div>
                </div>
              )}
              {updateStatus.status === 'downloaded' && (
                <div className="flex items-center justify-between">
                  <p className="text-emerald-400 text-[11px]">✓ v{updateStatus.version} siap dipasang.</p>
                  <button
                    onClick={() => {
                      const req = (window as any).__electronRequire || (window as any).require;
                      if (req) { req('electron').ipcRenderer.invoke('install-update-now'); }
                    }}
                    className="text-[10px] font-bold px-3 py-1 rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-500 transition"
                  >Restart &amp; Pasang</button>
                </div>
              )}
              {updateStatus.status === 'github-fallback' && (
                <div className="space-y-1">
                  {updateStatus.hasUpdate ? (
                    <>
                      <p className="text-amber-400 text-[11px]">🔔 Versi baru <strong>v{updateStatus.latestVersion}</strong> tersedia di GitHub!</p>
                      {updateStatus.releaseUrl && (
                        <a href={updateStatus.releaseUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-400 text-[10px] underline cursor-pointer">Buka halaman rilis →</a>
                      )}
                    </>
                  ) : (
                    <p className="text-emerald-500 text-[11px]">✓ Sudah versi terbaru (v{updateStatus.currentVersion}).</p>
                  )}
                </div>
              )}
              {updateStatus.status === 'error' && (
                <p className="text-red-400 text-[11px]">⚠ {updateStatus.message}</p>
              )}
              {updateStatus.status === 'dev-mode' && (
                <p className="text-slate-500 text-[11px]">{updateStatus.message}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] text-slate-500">Engine: Electron + React · &copy; 2026 RoboLab Studio</span>
              <button onClick={() => setShowAboutModal(false)} className="text-[10px] font-bold text-white px-4 py-1.5 rounded-xl transition cursor-pointer shadow-md" style={{ background: 'var(--accent-gradient)' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[420px] flex flex-col justify-between shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="flex justify-between items-center pb-3 border-b" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-rose-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Umpan Balik &amp; Saran</h3>
              </div>
              <button onClick={() => setShowFeedbackModal(false)} className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackSent ? (
              <div className="py-8 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-6 h-6 stroke-[3px]" />
                </div>
                <h4 className={`text-sm font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>Terima Kasih Atas Masukan Anda!</h4>
                <p className="text-xs text-slate-400 max-w-xs">Umpan balik Anda sangat berharga untuk pengembangan RoboLab Studio ke depan.</p>
                <button onClick={() => { setFeedbackSent(false); setShowFeedbackModal(false); }} className="mt-2 text-xs font-bold px-5 py-2 rounded-xl text-white shadow-md cursor-pointer" style={{ background: 'var(--accent-gradient)' }}>Selesai</button>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: themeMode === 'light' ? '#334155' : '#cbd5e1' }}>Penilaian Pengalaman Anda</label>
                  <div className="flex gap-2 justify-center py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className={`text-2xl transition cursor-pointer ${star <= feedbackRating ? 'text-amber-400 scale-110' : 'text-slate-600 hover:text-slate-400'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: themeMode === 'light' ? '#334155' : '#cbd5e1' }}>Pesan / Masukan Anda</label>
                  <textarea
                    rows={4}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Tuliskan masukan, saran fitur, atau laporan masalah yang Anda temukan..."
                    className="w-full rounded-xl p-3 text-xs focus:outline-none resize-none"
                    style={{
                      background: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                      color: themeMode === 'light' ? '#0f172a' : '#f8fafc',
                      border: themeMode === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
                  <button onClick={() => setShowFeedbackModal(false)} className={`px-4 py-2 rounded-xl text-xs font-semibold ${themeMode === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}>Batal</button>
                  <button onClick={() => setFeedbackSent(true)} className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer" style={{ background: 'var(--accent-gradient)' }}>Kirim Feedback</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PAYWALL MODAL — Trial Expired */}
      {showPaywallModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[999999] select-none bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-[440px] rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: themeMode === 'light'
                ? 'linear-gradient(145deg, #ffffff, #f0f4ff)'
                : 'linear-gradient(145deg, #0f172a, #1e293b)',
              border: themeMode === 'light' ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {/* Top accent strip */}
            <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

            <div className="p-7">
              {/* Icon */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className={`text-xl font-extrabold mb-1 ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Trial Period Ended
                </h2>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  Your 30-day free trial has expired. Upgrade to <span className="font-bold text-violet-400">RoboLab Pro</span> to continue using{' '}
                  <span className="font-semibold text-white/80">{paywallFeature}</span>.
                </p>
              </div>

              {/* Feature locked info */}
              <div className="rounded-2xl p-4 mb-5 space-y-2.5"
                style={{ background: themeMode === 'light' ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${themeMode === 'light' ? 'text-indigo-700' : 'text-indigo-300'}`}>
                  Locked Premium Features
                </p>
                {[
                  { icon: '🤖', name: 'AI Assistant', desc: 'Smart code analysis & error fixing' },
                  { icon: '🖥️', name: 'Hardware Simulator', desc: 'Virtual circuit simulation' },
                  { icon: '⬆️', name: 'Upload to Board', desc: 'Compile & flash firmware' },
                ].map(f => (
                  <div key={f.name} className="flex items-center gap-3">
                    <span className="text-base">{f.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>{f.name}</p>
                      <p className="text-[10px] text-slate-400">{f.desc}</p>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-red-400 ml-auto flex-shrink-0" />
                  </div>
                ))}
              </div>

              {/* Trial info */}
              <div className="flex items-center gap-2 mb-5 px-3 py-2.5 rounded-xl"
                style={{ background: themeMode === 'light' ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-400">
                  You have used RoboLab Studio for <strong>{trialStatus.daysUsed} days</strong>. Upgrade to unlock all features permanently.
                </p>
              </div>

              {/* CTA */}
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    // Contact via email for upgrade info
                    window.open('mailto:hamilulquranizayn@gmail.com?subject=RoboLab Studio Pro - Upgrade Request&body=Hi, I would like to upgrade to RoboLab Studio Pro. My device ID is: ' + (localStorage.getItem('rl_device_id') || 'unknown'), '_blank');
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Star className="w-4 h-4 inline mr-2 -mt-0.5" />
                  Contact Us to Upgrade — RoboLab Pro
                </button>
                <button
                  onClick={() => setShowPaywallModal(false)}
                  className={`w-full py-2.5 rounded-2xl text-xs font-semibold transition cursor-pointer ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  Continue with Free Features
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 11. BOARD MANAGER MODAL */}
      {showBoardManagerModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[500px] max-h-[500px] flex flex-col shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="flex justify-between items-center pb-3 border-b flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Board Core Manager</h3>
              </div>
              <button onClick={() => setShowBoardManagerModal(false)} className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {packages.boards.map((b: any) => (
                <div key={b.name} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>{b.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono">v{b.version}</span>
                    </div>
                    <p className="text-[10px] text-slate-400">{b.desc}</p>
                  </div>
                  {b.installed ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 flex-shrink-0">
                      <Check className="w-3 h-3" /> Installed
                    </span>
                  ) : (
                    <button
                      disabled={installingLib === b.name}
                      onClick={async () => {
                        setInstallingLib(b.name);
                        const req = (window as any).__electronRequire || (window as any).require;
                        if (req) {
                          try {
                            const coreIdMap: Record<string, string> = {
                              'MegaCore (ATmega128)': 'MegaCore:avr',
                              'ESP32 Arduino': 'esp32:esp32',
                              'Arduino AVR Boards': 'arduino:avr',
                              'ESP8266 Arduino': 'esp8266:esp8266',
                              'STM32 Boards': 'STMicroelectronics:stm32',
                              'Raspberry Pi Pico': 'rp2040:rp2040'
                            };
                            const targetCore = coreIdMap[b.name] || b.name;
                            const res = await req('electron').ipcRenderer.invoke('install-board-core', { coreName: targetCore, url: b.url });
                            if (res && res.success) {
                              setPackages((prev: any) => ({
                                ...prev,
                                boards: prev.boards.map((item: any) => item.name === b.name ? { ...item, installed: true } : item)
                              }));
                            }
                          } catch (_) {}
                        }
                        setInstallingLib(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow transition cursor-pointer disabled:opacity-50 flex-shrink-0"
                      style={{ background: 'var(--accent-gradient)' }}
                    >
                      {installingLib === b.name ? 'Installing...' : 'Install'}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowBoardManagerModal(false)} className="text-[10px] font-bold text-white-force px-5 py-2 rounded-xl transition cursor-pointer shadow-md" style={{ background: 'var(--accent-gradient)' }}>
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. LIBRARY MANAGER MODAL */}
      {showLibraryManagerModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[560px] max-h-[560px] flex flex-col shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="flex justify-between items-center pb-3 border-b flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>Arduino &amp; Python Library Manager</h3>
              </div>
              <button onClick={() => setShowLibraryManagerModal(false)} className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 space-y-2 flex-shrink-0">
              <input
                type="text"
                value={libSearchQuery}
                onChange={(e) => setLibSearchQuery(e.target.value)}
                placeholder="Cari library resmi dari GitHub Index (contoh: SSD1306, DHT, PubSubClient, Servo)..."
                className="w-full rounded-xl px-3.5 py-2 text-xs focus:outline-none"
                style={{
                  background: themeMode === 'light' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
                  color: themeMode === 'light' ? '#0f172a' : '#f8fafc',
                  border: themeMode === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                }}
              />

              {/* GitHub Direct URL Install Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customGithubUrl}
                  onChange={(e) => setCustomGithubUrl(e.target.value)}
                  placeholder="Atau install langsung dari URL GitHub (e.g. https://github.com/username/repository)..."
                  className="flex-1 rounded-xl px-3 py-1.5 text-[11px] focus:outline-none font-mono"
                  style={{
                    background: themeMode === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
                    color: themeMode === 'light' ? '#0f172a' : '#f8fafc',
                    border: themeMode === 'light' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)'
                  }}
                />
                <button
                  disabled={isInstallingGithub || !customGithubUrl.trim()}
                  onClick={async () => {
                    if (!customGithubUrl.trim()) return;
                    setIsInstallingGithub(true);
                    const req = (window as any).__electronRequire || (window as any).require;
                    if (req) {
                      try {
                        const res = await req('electron').ipcRenderer.invoke('install-lib-from-github', { githubUrl: customGithubUrl.trim(), userId: authUser?.id });
                        if (res && res.success) {
                          const installedName = res.libName || 'Custom_Library';
                          if (Array.isArray(res.examples) && res.examples.length > 0) {
                            const newCards = res.examples.map((ex: any) => ({
                              name: ex.name,
                              board: ex.board || 'Arduino Uno',
                              description: ex.description || `Contoh program ${ex.name} dari library ${ex.library}.`,
                              iconColor: 'emerald',
                              components: ['custom_lib'],
                              libraryName: ex.library,
                              category: 'Library Example',
                              isLibraryExample: true,
                              isCustom: true,
                              isGitHubLib: true,
                              ino: ex.code,
                              xml: ex.code ? (arduinoToBlocklyXml(ex.code, ex.parsedApi || res.parsedApi) || '') : '',
                              parsedApi: ex.parsedApi || res.parsedApi,
                              py: ex.code ? (arduinoToPython(ex.code, ex.parsedApi || res.parsedApi) || `# Contoh Library ${ex.library}\n`) : ''
                            }));
                            setCustomLibProjects((prev: any[]) => {
                              const existing = prev.filter(p => (p.libraryName || '').toLowerCase() !== installedName.toLowerCase());
                              return [...newCards, ...existing];
                            });
                          }
                          setPackages((prev: any) => ({
                            ...prev,
                            arduino: [
                              ...prev.arduino.filter((p: any) => p.name.toLowerCase() !== installedName.toLowerCase()),
                              {
                                name: installedName,
                                desc: `GitHub Library: ${customGithubUrl.trim()}`,
                                version: 'latest-git',
                                author: authUser?.name || 'Akun Anda',
                                installed: true,
                                isCustom: true,
                                userId: authUser?.id,
                                headers: res.headers || [],
                                parsedApi: res.parsedApi
                              }
                            ]
                          }));
                          if (authUser?.id) {
                            await saveUserCustomLibrary(authUser.id, {
                              name: installedName,
                              source_type: 'github',
                              source_url: customGithubUrl.trim(),
                              version: 'latest-git',
                              headers: res.headers || []
                            });
                          }
                          setTerminalLogs((prev: any) => [
                            ...prev,
                            { text: `[LIB] ✓ Library '${installedName}' berhasil diinstal ke akun Anda!`, type: 'success' }
                          ]);
                          setCustomGithubUrl('');
                          await syncInstalledLibraries();
                        }
                      } catch (_) {}
                    }
                    setIsInstallingGithub(false);
                  }}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold text-white shadow transition cursor-pointer disabled:opacity-50 flex-shrink-0"
                  style={{ background: 'var(--accent-gradient)' }}
                >
                  {isInstallingGithub ? 'Cloning...' : 'Install via GitHub'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-2.5">
              {isSearchingLibs && (
                <div className="text-center py-6 text-xs text-slate-400 animate-pulse">
                  🔍 Mencari pustaka di GitHub &amp; Arduino Index...
                </div>
              )}
              {((liveSearchResults.length > 0 ? liveSearchResults : [
                { name: 'Adafruit SSD1306', author: 'Adafruit', desc: 'Library pendukung layar OLED 0.96 inch I2C / SPI', cat: 'Display', version: '2.5.7' },
                { name: 'DHT sensor library', author: 'Adafruit', desc: 'Library sensor suhu & kelembaban DHT11, DHT22', cat: 'Sensors', version: '1.4.4' },
                { name: 'PS3 Controller Host', author: 'JV Pernis', desc: 'Library Bluetooth Controller PS3 / DualShock 3 untuk ESP32', cat: 'Control', version: '1.1.0' },
                { name: 'PS4Controller', author: 'Juan Pablo Marquez', desc: 'Library Bluetooth Controller PS4 / DualShock 4 untuk ESP32', cat: 'Control', version: '1.0.6' },
                { name: 'PubSubClient', author: 'Nick O\'Leary', desc: 'MQTT Client untuk koneksi IoT Broker (HiveMQ, ThingsBoard)', cat: 'IoT', version: '2.8.0' },
                { name: 'Blynk', author: 'Volodymyr Shymanskyy', desc: 'Library resmi Blynk IoT Cloud untuk ESP8266 & ESP32', cat: 'IoT', version: '1.3.2' },
                { name: 'LiquidCrystal_I2C', author: 'Frank de Brabander', desc: 'Library modul LCD 16x2 / 20x4 I2C Backpack', cat: 'Display', version: '1.1.2' },
                { name: 'Servo', author: 'Michael Margolis', desc: 'Library kontrol motor Servo SG90, MG996R', cat: 'Actuators', version: '1.2.1' },
                { name: 'MFRC522v2', author: 'OSSLibraries', desc: 'Library RFID Reader RC522 (v2) untuk ESP32 & Arduino via SPI / I2C', cat: 'Sensors', version: '2.0.6' },
                { name: 'NewPing', author: 'Tim Eckel', desc: 'Library sensor jarak ultrasonic HC-SR04 ultra cepat', cat: 'Sensors', version: '1.9.7' }
              ]).filter(l => !libSearchQuery || liveSearchResults.length > 0 || l.name.toLowerCase().includes(libSearchQuery.toLowerCase()) || l.desc.toLowerCase().includes(libSearchQuery.toLowerCase()))
              ).map((lib) => {
                const isLibInstalled = packages.arduino.some((p: any) => p.name.toLowerCase() === lib.name.toLowerCase() && p.installed);
                return (
                  <div key={lib.name} className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>{lib.name}</h4>
                        {lib.cat && <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">{lib.cat}</span>}
                        {lib.version && <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-mono">v{lib.version}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400">{lib.desc} &bull; <span className="text-slate-500">by {lib.author}</span></p>
                    </div>
                    {isLibInstalled ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Installed
                        </span>
                        <button
                          disabled={uninstallingMap[lib.name]}
                          onClick={() => handleUninstallPkg('arduino', lib.name)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          title={`Hapus library ${lib.name}`}
                        >
                          {uninstallingMap[lib.name] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Hapus</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={installingLib === lib.name}
                        onClick={async () => {
                          setInstallingLib(lib.name);
                          const req = (window as any).__electronRequire || (window as any).require;
                          if (req) {
                            try {
                              const res = await req('electron').ipcRenderer.invoke('install-arduino-lib', lib.name);
                              if (res && res.success) {
                                setPackages((prev: any) => ({
                                  ...prev,
                                  arduino: [...prev.arduino.filter((item: any) => item.name !== lib.name), { name: lib.name, desc: lib.desc, version: lib.version || '1.0.0', installed: true }]
                                }));
                              }
                            } catch (_) {}
                          }
                          setInstallingLib(null);
                        }}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow transition cursor-pointer flex-shrink-0 disabled:opacity-50"
                        style={{ background: 'var(--accent-gradient)' }}
                      >
                        {installingLib === lib.name ? 'Installing...' : 'Install'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowLibraryManagerModal(false)} className="text-[10px] font-bold text-white-force px-5 py-2 rounded-xl transition cursor-pointer shadow-md" style={{ background: 'var(--accent-gradient)' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. EXTENSIONS MODAL */}
      {showExtensionsModal && (
        <div className={`fixed inset-0 flex items-center justify-center z-[99999] select-none ${themeMode === 'light' ? 'bg-slate-900/25 backdrop-blur-md' : 'bg-black/60 backdrop-blur-sm'}`}>
          <div className="glass-panel rounded-2xl p-6 w-[500px] max-h-[500px] flex flex-col shadow-2xl relative overflow-hidden"
          style={themeMode === 'light' ? { background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' } : {background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
            <div className="flex justify-between items-center pb-3 border-b flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-800' : 'text-white'}`}>RoboLab Extensions &amp; Plugins</h3>
              </div>
              <button onClick={() => setShowExtensionsModal(false)} className={`transition cursor-pointer p-1 rounded-lg ${themeMode === 'light' ? 'text-slate-400 hover:text-slate-650 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {[
                { name: 'AI Vision & Object Detection', desc: 'Google Teachable Machine & OpenCV Camera Vision', active: true },
                { name: 'IoT Telemetry Cloud', desc: 'Real-time WebSocket & MQTT Telemetry Data Streamer', active: true },
                { name: '3D Physics Simulator Engine', desc: 'Physics simulation for servo motors, sensors & LEDs', active: true },
                { name: 'Block-to-Code Converter', desc: 'Bi-directional Blockly to Arduino C++ / MicroPython', active: true }
              ].map((ext) => (
                <div key={ext.name} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="space-y-0.5">
                    <h4 className={`text-xs font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>{ext.name}</h4>
                    <p className="text-[10px] text-slate-400">{ext.desc}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t flex-shrink-0" style={{ borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowExtensionsModal(false)} className="text-[10px] font-bold text-white-force px-5 py-2 rounded-xl transition cursor-pointer shadow-md" style={{ background: 'var(--accent-gradient)' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// INTERACTIVE VISUALIZER COMPONENTS FOR LESSONS
// ==========================================

const StringPlayground = () => {
  const [inp, setInp] = useState("Robo X-90");
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manipulator String Real-time</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col justify-center gap-4 min-h-[300px]">
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Input Teks:</label>
          <input 
            type="text" 
            value={inp} 
            onChange={(e) => setInp(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            placeholder="Ketik string di sini..."
          />
        </div>
        
        <div className="space-y-2 font-mono text-[10px]">
          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-850 flex items-center justify-between">
            <span className="text-slate-500">inp.capitalize()</span>
            <span className="text-emerald-400 font-bold">"{inp.charAt(0).toUpperCase() + inp.slice(1)}"</span>
          </div>
          
          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-850 flex items-center justify-between">
            <span className="text-slate-500">"Inisialisasi: " + inp</span>
            <span className="text-sky-400 font-bold">"Inisialisasi: {inp}"</span>
          </div>

          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-850 flex items-center justify-between">
            <span className="text-slate-500">len(inp)</span>
            <span className="text-yellow-400 font-bold">{inp.length} karakter</span>
          </div>

          <div className="p-2.5 bg-slate-900/40 rounded border border-slate-850 flex items-center justify-between">
            <span className="text-slate-500">f"Status: {"{"}inp{"}"} OK"</span>
            <span className="text-pink-400 font-bold">"Status: {inp} OK"</span>
          </div>
        </div>
      </div>
      <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl text-[10px] leading-relaxed">
        <span className="font-bold text-blue-400 block mb-0.5">💡 String di Python</span>
        String bersifat *immutable*. Operasi manipulasi string mengembalikan string baru yang dimodifikasi tanpa mengubah string aslinya.
      </div>
    </div>
  );
};

const ConditionalPlayground = () => {
  const [dist, setDist] = useState(15);
  return (
    <div className="flex flex-col h-full gap-4">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alur Logika Percabangan</span>
      <div className="flex-1 rounded-xl bg-slate-950 p-4 border border-slate-900/50 flex flex-col gap-4 min-h-[300px] justify-center">
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Jarak Objek/Benda:</span>
            <span className="font-bold text-blue-400 font-mono">{dist} cm</span>
          </div>
          <input 
            type="range" 
            min="2" 
            max="45" 
            value={dist} 
            onChange={(e) => setDist(Number(e.target.value))}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        <div className="space-y-2 font-mono text-[9px]">
          <div className={`p-2.5 rounded-lg border transition ${
            dist < 10 
              ? 'bg-red-500/10 border-red-500/60 text-red-400 font-bold' 
              : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}>
            <span className="text-pink-500">if</span> jarak_benda &lt; 10:
            <div className="pl-4 mt-0.5 font-bold text-red-500">print("RINTANGAN SANGAT DEKAT!")</div>
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
