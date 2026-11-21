/**
 * RoboLab Studio - Curated IoT GitHub Library Catalog
 * Provides verified, popular IoT libraries (DHT11/22, Ultrasonic, OLED, DFRobot pH/EC/TDS,
 * PT100 RTD, Firebase, RFID, etc.) with rich search tags and direct block activation.
 */

export interface IoTRepoLibrary {
  name: string;
  displayName: string;
  author: string;
  desc: string;
  cat: 'Sensor' | 'Display' | 'IoT' | 'Aktuator' | 'Lainnya';
  version: string;
  githubUrl: string;
  tags: string[];
}

export const IOT_LIBRARY_CATALOG: IoTRepoLibrary[] = [
  {
    name: 'DHT sensor library',
    displayName: 'DHT11 / DHT22 (Suhu & Kelembapan)',
    author: 'Adafruit',
    desc: 'Library sensor suhu presisi (°C) dan kelembapan udara relatif (%) untuk DHT11 dan DHT22.',
    cat: 'Sensor',
    version: '1.4.6',
    githubUrl: 'https://github.com/adafruit/DHT-sensor-library',
    tags: ['dht', 'dht11', 'dht22', 'suhu', 'kelembapan', 'temperature', 'humidity', 'cuaca', 'sensor']
  },
  {
    name: 'NewPing',
    displayName: 'Ultrasonik HC-SR04 (NewPing)',
    author: 'Tim Eckel',
    desc: 'Library sensor jarak ultrasonik HC-SR04 ultra cepat dengan penyaring median derau pantulan.',
    cat: 'Sensor',
    version: '1.9.7',
    githubUrl: 'https://github.com/PaulStoffregen/NewPing',
    tags: ['ultrasonic', 'ultrasonik', 'hcsr04', 'hc-sr04', 'sonar', 'jarak', 'distance', 'radar', 'sensor']
  },
  {
    name: 'Adafruit SSD1306',
    displayName: 'OLED Display 0.96" I2C (SSD1306)',
    author: 'Adafruit',
    desc: 'Menampilkan visual grafik, teks, garis, lingkaran, dan gambar monokrom pada layar OLED I2C 128x64.',
    cat: 'Display',
    version: '2.5.9',
    githubUrl: 'https://github.com/adafruit/Adafruit_SSD1306',
    tags: ['oled', 'ssd1306', 'display', 'layar', 'grafik', 'i2c', '128x64', 'monochrome']
  },
  {
    name: 'DFRobot_PH',
    displayName: 'Sensor pH Cairan (DFRobot Gravity)',
    author: 'DFRobot',
    desc: 'Sensor derajat keasaman cairan (pH 0-14) analog Gravity dengan kalibrasi larutan buffer pH 4.0 & 7.0.',
    cat: 'Sensor',
    version: '1.0.0',
    githubUrl: 'https://github.com/DFRobot/DFRobot_PH',
    tags: ['ph', 'ph_meter', 'dfrobot_ph', 'keasaman', 'air', 'water', 'hidroponik', 'aquaponik', 'sensor']
  },
  {
    name: 'GravityTDS',
    displayName: 'Sensor EC & TDS Kualitas Air (DFRobot)',
    author: 'DFRobot',
    desc: 'Sensor konduktivitas listrik (EC) & Total Dissolved Solids (TDS ppm) untuk nutrisi tanaman & kemurnian air.',
    cat: 'Sensor',
    version: '1.0.0',
    githubUrl: 'https://github.com/DFRobot/GravityTDS',
    tags: ['ec', 'tds', 'gravitytds', 'dfrobot_ec', 'konduktivitas', 'kemurnian', 'ppm', 'air', 'nutrisi', 'sensor']
  },
  {
    name: 'Adafruit_MAX31865',
    displayName: 'Sensor PT100 / PT1000 RTD (MAX31865)',
    author: 'Adafruit',
    desc: 'Amplifier RTD Platinum presisi tinggi industri untuk membaca probe suhu ekstrem PT100 / PT1000 via SPI.',
    cat: 'Sensor',
    version: '1.6.2',
    githubUrl: 'https://github.com/adafruit/Adafruit_MAX31865',
    tags: ['pt100', 'pt1000', 'max31865', 'rtd', 'suhu', 'temperature', 'industri', 'presisi', 'sensor']
  },
  {
    name: 'FirebaseESP32',
    displayName: 'Google Firebase Realtime Database (IoT)',
    author: 'Mobizt',
    desc: 'Koneksi cloud langsung ke Google Firebase Realtime Database untuk sinkronisasi nilai sensor & saklar IoT.',
    cat: 'IoT',
    version: '4.4.14',
    githubUrl: 'https://github.com/mobizt/Firebase-ESP32',
    tags: ['firebase', 'database', 'rtdb', 'cloud', 'iot', 'google', 'esp32', 'telemetri']
  },
  {
    name: 'MFRC522',
    displayName: 'RFID Reader RC522 13.56 MHz (SPI)',
    author: 'GithubCommunity',
    desc: 'Membaca nomor UID kartu RFID / e-KTP / gantungan kunci 13.56 MHz untuk sistem absensi dan akses pintu.',
    cat: 'Sensor',
    version: '1.4.10',
    githubUrl: 'https://github.com/miguelbalboa/rfid',
    tags: ['rfid', 'rc522', 'mfrc522', 'nfc', 'kartu', 'card', 'reader', 'absensi', 'akses', 'sensor']
  },
  {
    name: 'Adafruit PN532',
    displayName: 'RFID & NFC Reader (Adafruit PN532)',
    author: 'Adafruit',
    desc: 'Modul NFC & RFID canggih komunikasi I2C/SPI untuk membaca kartu Mifare, ponsel pintar, dan tag NFC.',
    cat: 'Sensor',
    version: '1.3.3',
    githubUrl: 'https://github.com/adafruit/Adafruit-PN532',
    tags: ['pn532', 'nfc', 'rfid', 'i2c', 'spi', 'kartu', 'emoney', 'reader']
  },
  {
    name: 'LiquidCrystal_I2C',
    displayName: 'LCD 16x2 / 20x4 I2C Backpack',
    author: 'Frank de Brabander',
    desc: 'Menampilkan karakter alfanumerik pada modul LCD 16x2 / 20x4 dengan chip PCF8574 hemat pin I2C.',
    cat: 'Display',
    version: '1.1.4',
    githubUrl: 'https://github.com/johnrickman/LiquidCrystal_I2C',
    tags: ['lcd', 'liquidcrystal', 'i2c', 'display', 'layar', '16x2', '20x4', 'karakter']
  },
  {
    name: 'Blynk',
    displayName: 'Blynk IoT Cloud Platform',
    author: 'Volodymyr Shymanskyy',
    desc: 'Library resmi Blynk IoT Cloud untuk ESP8266 & ESP32 guna memonitor widget dashboard di ponsel.',
    cat: 'IoT',
    version: '1.3.2',
    githubUrl: 'https://github.com/blynkkk/blynk-library',
    tags: ['blynk', 'iot', 'cloud', 'dashboard', 'aplikasi', 'hp', 'wifi', 'esp32', 'esp8266']
  },
  {
    name: 'PubSubClient',
    displayName: 'MQTT Client IoT (HiveMQ / ThingsBoard)',
    author: 'Nick O\'Leary',
    desc: 'Protokol pengiriman pesan data ringan Publish-Subscribe ke broker MQTT untuk aplikasi IoT industri.',
    cat: 'IoT',
    version: '2.8.0',
    githubUrl: 'https://github.com/knolleary/pubsubclient',
    tags: ['mqtt', 'pubsubclient', 'broker', 'hivemq', 'thingsboard', 'iot', 'cloud', 'telemetri']
  },
  {
    name: 'Adafruit_MPU6050',
    displayName: 'MPU6050 Akselerometer & Gyroscope 6-Axis',
    author: 'Adafruit',
    desc: 'Sensor gerak 6-Axis (3-axis akselerasi + 3-axis sudut rotasi putar) via I2C untuk deteksi kemiringan.',
    cat: 'Sensor',
    version: '2.2.6',
    githubUrl: 'https://github.com/adafruit/Adafruit_MPU6050',
    tags: ['mpu6050', 'gyro', 'accelerometer', 'akselerometer', 'imu', 'kemiringan', 'sudut', 'motion', 'sensor']
  },
  {
    name: 'Adafruit_NeoPixel',
    displayName: 'NeoPixel RGB LED Strip (WS2812B)',
    author: 'Adafruit',
    desc: 'Mengendalikan rangkaian LED RGB addressable WS2812B dengan 16 juta warna hanya dari 1 pin mikrokontroler.',
    cat: 'Aktuator',
    version: '1.12.0',
    githubUrl: 'https://github.com/adafruit/Adafruit_NeoPixel',
    tags: ['neopixel', 'ws2812', 'ws2812b', 'rgb', 'led', 'strip', 'warna', 'lampu', 'aktuator']
  },
  {
    name: 'HX711',
    displayName: 'Timbangan Digital Load Cell (HX711)',
    author: 'Bogde',
    desc: 'Amplifier ADC 24-bit untuk membaca sensor berat (load cell) timbangan digital dengan akurasi gram.',
    cat: 'Sensor',
    version: '0.7.5',
    githubUrl: 'https://github.com/bogde/HX711',
    tags: ['hx711', 'loadcell', 'timbangan', 'berat', 'gram', 'scale', 'weight', 'sensor']
  },
  {
    name: 'RTClib',
    displayName: 'RTC Waktu Real-Time (DS3231 / DS1307)',
    author: 'Adafruit',
    desc: 'Pencatat waktu nyata presisi tinggi (jam, menit, detik, tanggal) dengan baterai backup cadangan.',
    cat: 'Sensor',
    version: '2.1.3',
    githubUrl: 'https://github.com/adafruit/RTClib',
    tags: ['rtc', 'rtclib', 'ds3231', 'ds1307', 'waktu', 'jam', 'tanggal', 'realtime', 'clock']
  },
  {
    name: 'Adafruit_VL53L0X',
    displayName: 'Laser ToF Distance Sensor (VL53L0X)',
    author: 'Adafruit',
    desc: 'Sensor jarak laser Time-of-Flight hingga 2 meter dengan presisi tinggi bebas gangguan warna target.',
    cat: 'Sensor',
    version: '1.2.4',
    githubUrl: 'https://github.com/adafruit/Adafruit_VL53L0X',
    tags: ['vl53l0x', 'laser', 'tof', 'distance', 'jarak', 'presisi', 'sensor']
  },
  {
    name: 'DFRobotDFPlayerMini',
    displayName: 'DFPlayer Mini MP3 Player Audio',
    author: 'DFRobot',
    desc: 'Pemutar file musik MP3/WAV dari microSD dengan komunikasi serial UART dan kontrol volume langsung.',
    cat: 'Aktuator',
    version: '1.0.6',
    githubUrl: 'https://github.com/DFRobot/DFRobotDFPlayerMini',
    tags: ['dfplayer', 'mp3', 'musik', 'audio', 'suara', 'sound', 'sdcard', 'speaker', 'aktuator']
  },
  {
    name: 'AccelStepper',
    displayName: 'AccelStepper Motor Stepper Presisi',
    author: 'Mike McCauley',
    desc: 'Pengendalian motor stepper multi-axis dengan akselerasi dan deselerasi halus tanpa kehilangan langkah.',
    cat: 'Aktuator',
    version: '1.64.0',
    githubUrl: 'https://github.com/waspinator/AccelStepper',
    tags: ['stepper', 'accelstepper', 'motor', 'langkah', 'presisi', 'cnc', 'aktuator']
  },
  {
    name: 'Servo',
    displayName: 'Servo Motor Control (SG90 / MG996R)',
    author: 'Michael Margolis',
    desc: 'Pengendali posisi sudut rotasi (0 - 180 derajat) untuk motor servo standar Arduino & ESP32.',
    cat: 'Aktuator',
    version: '1.2.1',
    githubUrl: 'https://github.com/arduino-libraries/Servo',
    tags: ['servo', 'motor', 'sg90', 'mg996r', 'sudut', 'rotasi', 'aktuator']
  }
];
