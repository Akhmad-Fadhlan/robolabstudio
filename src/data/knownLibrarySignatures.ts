/**
 * RoboLab Studio - Known Library Signatures Database
 * Provides verified, accurate class names, headers, constructors, and real public methods
 * for popular Arduino libraries (Adafruit GFX, SSD1306, ST7735, VL53L0X, HX711, DFPlayer, etc.)
 * so they instantly render rich, faithful Blockly blocks without dummy placeholders.
 */

export interface KnownLibraryMethod {
  name: string;
  returnType: 'void' | 'Number' | 'Boolean' | 'String';
  params: string[];
  label?: string;
  doc?: string;
}

export interface KnownLibraryApi {
  patterns: string[];
  className: string;
  instanceName: string;
  mainHeader: string;
  categoryName: string;
  colour: string;
  constructors?: Array<{ params: string[]; defaultArgs?: string }>;
  pins?: Array<{ name: string; value: string; isPin: boolean }>;
  constants?: Array<{ name: string; value: string; isPin: boolean }>;
  methods: KnownLibraryMethod[];
}

export const KNOWN_LIBRARIES: KnownLibraryApi[] = [
  // ── Adafruit GFX (Graphics Core for displays) ───────────────────────────
  {
    patterns: ['adafruit_gfx', 'adafruit-gfx', 'gfx', 'adafruit gfx'],
    className: 'Adafruit_GFX',
    instanceName: 'display',
    mainHeader: 'Adafruit_GFX.h',
    categoryName: 'Adafruit GFX',
    colour: '#ec4899',
    constructors: [{ params: ['w', 'h'], defaultArgs: '128, 64' }],
    constants: [
      { name: 'WHITE', value: '1', isPin: false },
      { name: 'BLACK', value: '0', isPin: false },
      { name: 'INVERSE', value: '2', isPin: false }
    ],
    methods: [
      { name: 'fillScreen', returnType: 'void', params: ['0'], label: 'Bersihkan / Isi Layar (warna)', doc: 'Mengisi seluruh layar dengan warna (0=Hitam, 1=Putih)' },
      { name: 'drawLine', returnType: 'void', params: ['0', '0', '127', '63', '1'], label: 'Gambar Garis (x0, y0, x1, y1, warna)', doc: 'Menggambar garis lurus dari (x0, y0) ke (x1, y1)' },
      { name: 'drawRect', returnType: 'void', params: ['0', '0', '60', '30', '1'], label: 'Gambar Kotak (x, y, lebar, tinggi, warna)', doc: 'Menggambar bingkai persegi panjang' },
      { name: 'fillRect', returnType: 'void', params: ['0', '0', '60', '30', '1'], label: 'Isi Kotak Penuh (x, y, lebar, tinggi, warna)', doc: 'Menggambar kotak padat terisi warna' },
      { name: 'drawCircle', returnType: 'void', params: ['64', '32', '20', '1'], label: 'Gambar Lingkaran (x, y, radius, warna)', doc: 'Menggambar garis tepi lingkaran' },
      { name: 'fillCircle', returnType: 'void', params: ['64', '32', '20', '1'], label: 'Isi Lingkaran Penuh (x, y, radius, warna)', doc: 'Menggambar lingkaran padat terisi warna' },
      { name: 'drawTriangle', returnType: 'void', params: ['10', '10', '30', '50', '50', '10', '1'], label: 'Gambar Segitiga (x0,y0, x1,y1, x2,y2, warna)', doc: 'Menggambar tepi segitiga dari 3 koordinat sudut' },
      { name: 'fillTriangle', returnType: 'void', params: ['10', '10', '30', '50', '50', '10', '1'], label: 'Isi Segitiga Penuh (x0,y0, x1,y1, x2,y2, warna)', doc: 'Menggambar segitiga terisi padat' },
      { name: 'drawRoundRect', returnType: 'void', params: ['0', '0', '50', '30', '5', '1'], label: 'Gambar Kotak Sudut Bulat (x, y, w, h, r, warna)', doc: 'Menggambar kotak dengan sudut membulat' },
      { name: 'fillRoundRect', returnType: 'void', params: ['0', '0', '50', '30', '5', '1'], label: 'Isi Kotak Sudut Bulat (x, y, w, h, r, warna)', doc: 'Menggambar kotak sudut membulat terisi padat' },
      { name: 'setCursor', returnType: 'void', params: ['0', '0'], label: 'Atur Posisi Kursor Teks (kolom, baris)', doc: 'Menentukan koordinat awal teks akan dicetak' },
      { name: 'setTextColor', returnType: 'void', params: ['1'], label: 'Warna Teks (warna)', doc: 'Mengatur warna huruf yang dicetak' },
      { name: 'setTextSize', returnType: 'void', params: ['1'], label: 'Ukuran Teks (1-4)', doc: 'Mengatur perbesaran ukuran teks' },
      { name: 'print', returnType: 'void', params: ['"RoboLab"'], label: 'Cetak Teks (teks)', doc: 'Mencetak teks ke layar pada posisi kursor' },
      { name: 'println', returnType: 'void', params: ['"Studio"'], label: 'Cetak Teks + Baris Baru (teks)', doc: 'Mencetak teks diikuti baris baru' },
      { name: 'setRotation', returnType: 'void', params: ['1'], label: 'Rotasi Layar (0-3)', doc: 'Memutar orientasi tampilan (0=normal, 1=90°, 2=180°, 3=270°)' },
      { name: 'width', returnType: 'Number', params: [], label: 'Lebar Layar (Piksel)', doc: 'Mengembalikan lebar layar dalam piksel' },
      { name: 'height', returnType: 'Number', params: [], label: 'Tinggi Layar (Piksel)', doc: 'Mengembalikan tinggi layar dalam piksel' }
    ]
  },

  // ── Adafruit SSD1306 OLED Display ─────────────────────────────────────────
  {
    patterns: ['ssd1306', 'adafruit_ssd1306', 'adafruit-ssd1306', 'oled_ssd1306'],
    className: 'Adafruit_SSD1306',
    instanceName: 'display',
    mainHeader: 'Adafruit_SSD1306.h',
    categoryName: 'Adafruit SSD1306 (OLED)',
    colour: '#3b82f6',
    constructors: [{ params: ['w', 'h', '&Wire', 'rst'], defaultArgs: '128, 64, &Wire, -1' }],
    constants: [
      { name: 'SSD1306_SWITCHCAPVCC', value: '0x02', isPin: false },
      { name: 'SSD1306_I2C_ADDR', value: '0x3C', isPin: false }
    ],
    methods: [
      { name: 'begin', returnType: 'void', params: ['SSD1306_SWITCHCAPVCC, 0x3C'], label: 'Mulai OLED I2C (Alamat 0x3C)', doc: 'Inisialisasi layar OLED dengan alamat I2C 0x3C' },
      { name: 'clearDisplay', returnType: 'void', params: [], label: 'Bersihkan Layar (Clear)', doc: 'Mengosongkan buffer tampilan OLED' },
      { name: 'display', returnType: 'void', params: [], label: 'Kirim / Render ke Layar (Update Display)', doc: 'Mendorong semua perubahan grafik dari buffer ke fisik layar OLED' },
      { name: 'fillScreen', returnType: 'void', params: ['0'], label: 'Isi Layar (warna)', doc: 'Mengisi seluruh layar OLED (0=Hitam, 1=Putih)' },
      { name: 'drawLine', returnType: 'void', params: ['0', '0', '127', '63', '1'], label: 'Gambar Garis (x0, y0, x1, y1, warna)', doc: 'Menggambar garis lurus di OLED' },
      { name: 'drawRect', returnType: 'void', params: ['0', '0', '50', '20', '1'], label: 'Gambar Kotak (x, y, w, h, warna)', doc: 'Menggambar bingkai kotak di OLED' },
      { name: 'fillRect', returnType: 'void', params: ['0', '0', '50', '20', '1'], label: 'Isi Kotak Penuh (x, y, w, h, warna)', doc: 'Menggambar kotak padat di OLED' },
      { name: 'setCursor', returnType: 'void', params: ['0', '0'], label: 'Atur Kursor Teks (x, y)', doc: 'Menentukan posisi kursor di OLED' },
      { name: 'setTextSize', returnType: 'void', params: ['1'], label: 'Ukuran Huruf (1-3)', doc: 'Mengatur ukuran font teks' },
      { name: 'setTextColor', returnType: 'void', params: ['1'], label: 'Warna Huruf (SSD1306_WHITE)', doc: 'Mengatur warna huruf' },
      { name: 'print', returnType: 'void', params: ['"RoboLab"'], label: 'Cetak Teks (teks)', doc: 'Mencetak teks ke buffer OLED' },
      { name: 'println', returnType: 'void', params: ['"Studio"'], label: 'Cetak Teks + Enter', doc: 'Mencetak teks dan ganti baris' },
      { name: 'invertDisplay', returnType: 'void', params: ['true'], label: 'Inversi Warna Layar (true/false)', doc: 'Membalikkan warna tampilan OLED' }
    ]
  },

  // ── Adafruit VL53L0X Time-of-Flight Distance Sensor ──────────────────────
  {
    patterns: ['vl53l0x', 'adafruit_vl53l0x', 'adafruit-vl53l0x', 'tof_vl53'],
    className: 'Adafruit_VL53L0X',
    instanceName: 'lox',
    mainHeader: 'Adafruit_VL53L0X.h',
    categoryName: 'VL53L0X Laser Distance',
    colour: '#10b981',
    constructors: [{ params: [], defaultArgs: '' }],
    methods: [
      { name: 'begin', returnType: 'Boolean', params: [], label: 'Inisialisasi Sensor VL53L0X', doc: 'Memulai komunikasi I2C dengan sensor jarak laser VL53L0X' },
      { name: 'startRangeContinuous', returnType: 'void', params: ['100'], label: 'Mulai Pengukuran Jarak Kontinu (ms)', doc: 'Memulai pembacaan jarak secara berkala' },
      { name: 'readRangeContinuousMillimeters', returnType: 'Number', params: [], label: 'Baca Jarak Kontinu (mm)', doc: 'Mengembalikan jarak objek dalam satuan milimeter' },
      { name: 'readRange', returnType: 'Number', params: [], label: 'Baca Jarak Sekali (mm)', doc: 'Melakukan satu pengukuran jarak (mm)' },
      { name: 'timeoutOccurred', returnType: 'Boolean', params: [], label: 'Waktu Habis / Timeout?', doc: 'Memeriksa apakah pembacaan jarak mengalami timeout' }
    ]
  },

  // ── HX711 Load Cell Amplifier (Timbangan Digital) ────────────────────────
  {
    patterns: ['hx711', 'loadcell', 'weighing', 'scale'],
    className: 'HX711',
    instanceName: 'scale',
    mainHeader: 'HX711.h',
    categoryName: 'HX711 Load Cell (Timbangan)',
    colour: '#f59e0b',
    constructors: [{ params: [], defaultArgs: '' }],
    methods: [
      { name: 'begin', returnType: 'void', params: ['3', '2'], label: 'Mulai HX711 (DOUT Pin, SCK Pin)', doc: 'Inisialisasi pin DOUT dan SCK amplifier timbangan HX711' },
      { name: 'is_ready', returnType: 'Boolean', params: [], label: 'Sensor Siap? (Ready)', doc: 'Memeriksa apakah HX711 siap membaca data baru' },
      { name: 'set_scale', returnType: 'void', params: ['2280.f'], label: 'Atur Faktor Kalibrasi Skala', doc: 'Menentukan nilai pembagi kalibrasi beban' },
      { name: 'tare', returnType: 'void', params: ['20'], label: 'Nolkan Timbangan (Tare)', doc: 'Mereset nilai awal timbangan menjadi 0' },
      { name: 'get_units', returnType: 'Number', params: ['10'], label: 'Baca Berat Beban (Gram / Kg)', doc: 'Membaca berat terkalibrasi rata-rata dari n sampel' },
      { name: 'get_value', returnType: 'Number', params: ['5'], label: 'Baca Nilai Mentah Beban', doc: 'Membaca nilai ADC mentah dikurangi tara' },
      { name: 'power_down', returnType: 'void', params: [], label: 'Mode Hemat Daya (Sleep)', doc: 'Mematikan chip HX711 ke mode standby' },
      { name: 'power_up', returnType: 'void', params: [], label: 'Bangunkan Daya (Wake)', doc: 'Menghidupkan kembali chip HX711' }
    ]
  },

  // ── DFRobot DFPlayer Mini MP3 Player ─────────────────────────────────────
  {
    patterns: ['dfplayer', 'dfrobotdfplayermini', 'mp3', 'player_mini'],
    className: 'DFRobotDFPlayerMini',
    instanceName: 'myDFPlayer',
    mainHeader: 'DFRobotDFPlayerMini.h',
    categoryName: 'DFPlayer Mini MP3',
    colour: '#8b5cf6',
    constructors: [{ params: [], defaultArgs: '' }],
    methods: [
      { name: 'begin', returnType: 'Boolean', params: ['Serial1'], label: 'Mulai DFPlayer (Serial Port)', doc: 'Inisialisasi komunikasi UART dengan modul MP3' },
      { name: 'play', returnType: 'void', params: ['1'], label: 'Putar Lagu Nomor (index)', doc: 'Memutar file MP3 sesuai nomor urut di microSD' },
      { name: 'pause', returnType: 'void', params: [], label: 'Jeda Lagu (Pause)', doc: 'Menjeda sementara pemutaran musik' },
      { name: 'start', returnType: 'void', params: [], label: 'Lanjutkan Lagu (Resume)', doc: 'Melanjutkan lagu yang sedang dijeda' },
      { name: 'stop', returnType: 'void', params: [], label: 'Hentikan Lagu (Stop)', doc: 'Menghentikan pemutaran lagu' },
      { name: 'next', returnType: 'void', params: [], label: 'Lagu Berikutnya (Next)', doc: 'Memutar file lagu selanjutnya' },
      { name: 'previous', returnType: 'void', params: [], label: 'Lagu Sebelumnya (Previous)', doc: 'Memutar file lagu terdahulu' },
      { name: 'volume', returnType: 'void', params: ['20'], label: 'Atur Volume Suara (0-30)', doc: 'Mengatur tingkat kekerasan suara' },
      { name: 'volumeUp', returnType: 'void', params: [], label: 'Naikkan Volume (+1)', doc: 'Menambah volume 1 tingkat' },
      { name: 'volumeDown', returnType: 'void', params: [], label: 'Turunkan Volume (-1)', doc: 'Mengurangi volume 1 tingkat' },
      { name: 'readState', returnType: 'Number', params: [], label: 'Status Pemutaran (State)', doc: 'Membaca status player (sedang putar/berhenti)' }
    ]
  },

  // ── LiquidCrystal I2C (LCD 16x2 / 20x4) ──────────────────────────────────
  {
    patterns: ['liquidcrystal_i2c', 'liquidcrystal', 'lcd_i2c', 'i2c_lcd'],
    className: 'LiquidCrystal_I2C',
    instanceName: 'lcd',
    mainHeader: 'LiquidCrystal_I2C.h',
    categoryName: 'LCD I2C (16x2)',
    colour: '#0284c7',
    constructors: [{ params: ['addr', 'cols', 'rows'], defaultArgs: '0x27, 16, 2' }],
    methods: [
      { name: 'init', returnType: 'void', params: [], label: 'Inisialisasi Layar LCD', doc: 'Menyalakan kontroler LCD via I2C' },
      { name: 'backlight', returnType: 'void', params: [], label: 'Nyalakan Lampu Latar (Backlight ON)', doc: 'Menghidupkan LED backlight layar LCD' },
      { name: 'noBacklight', returnType: 'void', params: [], label: 'Matikan Lampu Latar (Backlight OFF)', doc: 'Mematikan LED backlight untuk hemat daya' },
      { name: 'clear', returnType: 'void', params: [], label: 'Bersihkan Layar (Clear)', doc: 'Menghapus seluruh tulisan di layar LCD' },
      { name: 'setCursor', returnType: 'void', params: ['0', '0'], label: 'Atur Posisi Kursor (kolom, baris)', doc: 'Menempatkan posisi kursor tulisan (0-15 kolom, 0-1 baris)' },
      { name: 'print', returnType: 'void', params: ['"RoboLab"'], label: 'Cetak Teks ke LCD (teks)', doc: 'Mencetak teks ke layar LCD pada kursor' },
      { name: 'scrollDisplayLeft', returnType: 'void', params: [], label: 'Geser Tampilan ke Kiri', doc: 'Menggeser seluruh karakter ke kiri' },
      { name: 'scrollDisplayRight', returnType: 'void', params: [], label: 'Geser Tampilan ke Kanan', doc: 'Menggeser seluruh karakter ke kanan' }
    ]
  },

  // ── RTClib (DS3231 / DS1307 Real-Time Clock) ─────────────────────────────
  {
    patterns: ['rtclib', 'rtc_ds3231', 'ds3231', 'ds1307', 'pcf8563'],
    className: 'RTC_DS3231',
    instanceName: 'rtc',
    mainHeader: 'RTClib.h',
    categoryName: 'RTC Waktu Real-Time (DS3231)',
    colour: '#0d9488',
    constructors: [{ params: [], defaultArgs: '' }],
    methods: [
      { name: 'begin', returnType: 'Boolean', params: [], label: 'Mulai Modul RTC', doc: 'Inisialisasi modul jam RTC via I2C' },
      { name: 'lostPower', returnType: 'Boolean', params: [], label: 'Baterai Pernah Lepas / Kehilangan Daya?', doc: 'Cek apakah waktu RTC perlu disetel ulang' },
      { name: 'now', returnType: 'Number', params: [], label: 'Ambil Waktu Sekarang (DateTime)', doc: 'Mengembalikan objek waktu saat ini' }
    ]
  },

  // ── AccelStepper (Advanced Stepper Motor Control) ────────────────────────
  {
    patterns: ['accelstepper', 'accel_stepper'],
    className: 'AccelStepper',
    instanceName: 'stepper',
    mainHeader: 'AccelStepper.h',
    categoryName: 'AccelStepper Motor',
    colour: '#16a34a',
    constructors: [{ params: ['interface', 'stepPin', 'dirPin'], defaultArgs: 'AccelStepper::DRIVER, 2, 3' }],
    constants: [
      { name: 'AccelStepper::DRIVER', value: '1', isPin: false },
      { name: 'AccelStepper::FULL4WIRE', value: '4', isPin: false }
    ],
    methods: [
      { name: 'setMaxSpeed', returnType: 'void', params: ['1000.0'], label: 'Kecepatan Maksimal (langkah/dtk)', doc: 'Mengatur kecepatan gerak tertinggi stepper' },
      { name: 'setAcceleration', returnType: 'void', params: ['500.0'], label: 'Percepatan / Akselerasi', doc: 'Mengatur akselerasi halus motor' },
      { name: 'moveTo', returnType: 'void', params: ['200'], label: 'Gerak ke Posisi Absolut (target)', doc: 'Menentukan koordinat posisi target motor' },
      { name: 'move', returnType: 'void', params: ['100'], label: 'Gerak Relatif n Langkah', doc: 'Menambah langkah gerak dari posisi sekarang' },
      { name: 'run', returnType: 'Boolean', params: [], label: 'Jalankan Step (Panggil di Loop)', doc: 'Mengeksekusi satu langkah motor secara non-blocking' },
      { name: 'stop', returnType: 'void', params: [], label: 'Hentikan Motor Halus', doc: 'Memperlambat motor hingga berhenti' },
      { name: 'currentPosition', returnType: 'Number', params: [], label: 'Ambil Posisi Motor Saat Ini', doc: 'Mengembalikan nomor langkah motor saat ini' }
    ]
  },

  // ── PubSubClient (MQTT Client untuk IoT) ──────────────────────────────────
  {
    patterns: ['pubsubclient', 'mqtt', 'pubsub'],
    className: 'PubSubClient',
    instanceName: 'client',
    mainHeader: 'PubSubClient.h',
    categoryName: 'PubSubClient (MQTT IoT)',
    colour: '#ea580c',
    constructors: [{ params: ['espClient'], defaultArgs: 'espClient' }],
    methods: [
      { name: 'setServer', returnType: 'void', params: ['"broker.hivemq.com"', '1883'], label: 'Atur Server Broker MQTT (Host, Port)', doc: 'Menentukan alamat broker MQTT dan port' },
      { name: 'connect', returnType: 'Boolean', params: ['"RoboLab_Device_01"'], label: 'Hubungkan ke MQTT Broker (ClientID)', doc: 'Melakukan handshake koneksi MQTT' },
      { name: 'connected', returnType: 'Boolean', params: [], label: 'Terhubung ke MQTT Broker?', doc: 'Mengembalikan true jika koneksi aktif' },
      { name: 'publish', returnType: 'Boolean', params: ['"robolab/data"', '"Halo MQTT"'], label: 'Kirim Pesan MQTT (Topik, Pesan)', doc: 'Mempublikasikan data ke topik MQTT' },
      { name: 'subscribe', returnType: 'Boolean', params: ['"robolab/perintah"'], label: 'Berlangganan Topik MQTT (Topik)', doc: 'Menerima pesan dari topik MQTT' },
      { name: 'loop', returnType: 'Boolean', params: [], label: 'Loop MQTT (Panggil di Loop)', doc: 'Menjaga koneksi tetap hidup dan memproses pesan masuk' }
    ]
  },

  // ── GravityTDS (DFRobot Analog TDS Sensor Kualitas Air) ───────────────────
  {
    patterns: ['gravitytds', 'gravity_tds', 'gravity-tds', 'tds', 'dfrobot_gravitytds'],
    className: 'GravityTDS',
    instanceName: 'gravityTds',
    mainHeader: 'GravityTDS.h',
    categoryName: 'Gravity TDS (Air)',
    colour: '#0284c7',
    constructors: [{ params: [], defaultArgs: '' }],
    pins: [{ name: 'TdsSensorPin', value: 'A1', isPin: true }],
    constants: [
      { name: 'TdsFactor', value: '0.5', isPin: false },
      { name: 'ReceivedBufferLength', value: '20', isPin: false }
    ],
    methods: [
      { name: 'setPin', returnType: 'void', params: ['A1'], label: 'Atur Pin Sensor (pin analog)', doc: 'Menghubungkan sensor TDS ke pin analog mikrokontroler (contoh: A1)' },
      { name: 'setAref', returnType: 'void', params: ['5.0'], label: 'Atur Tegangan Referensi Aref (V)', doc: 'Mengatur tegangan referensi ADC mikrokontroler (5.0V pada Uno/Nano, 3.3V pada ESP32)' },
      { name: 'setAdcRange', returnType: 'void', params: ['1024.0'], label: 'Atur Resolusi ADC (1024 / 4096)', doc: 'Resolusi konversi ADC (1024.0 untuk Uno 10-bit, 4096.0 untuk ESP32 12-bit)' },
      { name: 'setTemperature', returnType: 'void', params: ['25.0'], label: 'Atur Suhu Air Kompensasi (°C)', doc: 'Mengatur nilai suhu air untuk kompensasi otomatis keakuratan pembacaan TDS' },
      { name: 'begin', returnType: 'void', params: [], label: 'Mulai Sensor TDS (begin)', doc: 'Inisialisasi objek sensor TDS' },
      { name: 'update', returnType: 'void', params: [], label: 'Perbarui Sampel TDS (update di loop)', doc: 'Membaca sampel tegangan analog dan menghitung ppm TDS (wajib dipanggil di loop)' },
      { name: 'getTdsValue', returnType: 'Number', params: [], label: 'Baca Nilai TDS Air (ppm)', doc: 'Mengembalikan kadar Total Dissolved Solids dalam satuan ppm (parts per million)' },
      { name: 'getKvalue', returnType: 'Number', params: [], label: 'Baca Nilai Kalibrasi K (K-Value)', doc: 'Mengembalikan nilai koefisien kalibrasi elektroda TDS' }
    ]
  },

  // ── DFRobot_PH (DFRobot Gravity Analog pH Sensor) ─────────────────────────
  {
    patterns: ['dfrobot_ph', 'dfrobot-ph', 'gravity_ph', 'ph_meter'],
    className: 'DFRobot_PH',
    instanceName: 'ph',
    mainHeader: 'DFRobot_PH.h',
    categoryName: 'DFRobot pH Sensor',
    colour: '#059669',
    constructors: [{ params: [], defaultArgs: '' }],
    pins: [{ name: 'PH_PIN', value: 'A1', isPin: true }],
    methods: [
      { name: 'begin', returnType: 'void', params: [], label: 'Mulai Sensor pH (begin)', doc: 'Inisialisasi sensor pH dan memuat data kalibrasi dari EEPROM' },
      { name: 'readPH', returnType: 'Number', params: ['voltage', '25.0'], label: 'Hitung Nilai pH (tegangan, suhu)', doc: 'Mengonversi pembacaan tegangan analog dan suhu menjadi nilai derajat keasaman pH (0-14)' },
      { name: 'calibration', returnType: 'void', params: ['voltage', '25.0'], label: 'Kalibrasi Sensor pH (tegangan, suhu)', doc: 'Rutin kalibrasi sensor pH menggunakan larutan buffer standar 4.0 & 7.0' }
    ]
  },

  // ── DFRobot_EC (DFRobot Gravity Analog Electrical Conductivity) ───────────
  {
    patterns: ['dfrobot_ec', 'dfrobot-ec', 'gravity_ec', 'ec_meter'],
    className: 'DFRobot_EC',
    instanceName: 'ec',
    mainHeader: 'DFRobot_EC.h',
    categoryName: 'DFRobot EC Sensor',
    colour: '#0891b2',
    constructors: [{ params: [], defaultArgs: '' }],
    pins: [{ name: 'EC_PIN', value: 'A2', isPin: true }],
    methods: [
      { name: 'begin', returnType: 'void', params: [], label: 'Mulai Sensor EC (begin)', doc: 'Inisialisasi sensor konduktivitas listrik cairan dan memuat data kalibrasi dari EEPROM' },
      { name: 'readEC', returnType: 'Number', params: ['voltage', '25.0'], label: 'Hitung Nilai EC (tegangan, suhu)', doc: 'Mengonversi tegangan analog dan suhu menjadi nilai konduktivitas listrik (ms/cm)' },
      { name: 'calibration', returnType: 'void', params: ['voltage', '25.0'], label: 'Kalibrasi Sensor EC (tegangan, suhu)', doc: 'Rutin kalibrasi sensor EC menggunakan larutan standar' }
    ]
  },

  // ── NewPing (High Performance Ultrasonic HC-SR04) ─────────────────────────
  {
    patterns: ['newping', 'new_ping', 'hcsr04_sonar'],
    className: 'NewPing',
    instanceName: 'sonar',
    mainHeader: 'NewPing.h',
    categoryName: 'NewPing Ultrasonik',
    colour: '#6366f1',
    constructors: [{ params: ['trigPin', 'echoPin', 'maxCm'], defaultArgs: '12, 11, 200' }],
    pins: [
      { name: 'TRIGGER_PIN', value: '12', isPin: true },
      { name: 'ECHO_PIN', value: '11', isPin: true }
    ],
    constants: [{ name: 'MAX_DISTANCE', value: '200', isPin: false }],
    methods: [
      { name: 'ping_cm', returnType: 'Number', params: [], label: 'Baca Jarak Objek (cm)', doc: 'Mengembalikan jarak pantulan gelombang suara dalam satuan sentimeter (0 jika di luar jangkauan)' },
      { name: 'ping_in', returnType: 'Number', params: [], label: 'Baca Jarak Objek (inci)', doc: 'Mengembalikan jarak pantulan dalam satuan inci' },
      { name: 'ping_median', returnType: 'Number', params: ['5'], label: 'Baca Jarak Median Stabil (sampel)', doc: 'Mengambil n kali sampel dan mengembalikan median untuk menyaring derau pembacaan' },
      { name: 'ping', returnType: 'Number', params: [], label: 'Baca Waktu Pantul Echo (mikrodetik)', doc: 'Mengembalikan durasi bolak-balik pulsa dalam mikrodetik' }
    ]
  },

  // ── Adafruit MPU6050 Accelerometer & Gyroscope ────────────────────────────
  {
    patterns: ['adafruit_mpu6050', 'mpu6050', 'mpu_6050'],
    className: 'Adafruit_MPU6050',
    instanceName: 'mpu',
    mainHeader: 'Adafruit_MPU6050.h',
    categoryName: 'MPU6050 Akselerometer',
    colour: '#8b5cf6',
    constructors: [{ params: [], defaultArgs: '' }],
    methods: [
      { name: 'begin', returnType: 'Boolean', params: [], label: 'Mulai Sensor MPU6050 (I2C)', doc: 'Inisialisasi chip akselerometer dan giroskop 6-axis MPU6050 via bus I2C' },
      { name: 'setAccelerometerRange', returnType: 'void', params: ['MPU6050_RANGE_8_G'], label: 'Atur Rentang Akselerometer (2G/4G/8G/16G)', doc: 'Menentukan skala batas maksimum pengukuran percepatan gravitasi' },
      { name: 'setGyroRange', returnType: 'void', params: ['MPU6050_RANGE_500_DEG'], label: 'Atur Rentang Giroskop (250/500/1000/2000 deg/s)', doc: 'Menentukan skala sudut putar maksimum giroskop' },
      { name: 'setFilterBandwidth', returnType: 'void', params: ['MPU6050_BAND_21_HZ'], label: 'Atur Filter Bandwidth (DLPF)', doc: 'Mengatur filter sinyal low-pass bawaan chip untuk meredam getaran mekanis' }
    ]
  }
];

/**
 * Match a library name, header name, or GitHub repo URL against known verified signatures.
 */
export function findKnownLibrary(nameOrUrl: string): KnownLibraryApi | null {
  if (!nameOrUrl) return null;
  const raw = nameOrUrl.toLowerCase().trim();
  const clean = raw
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/[-_]library$/i, '')
    .replace(/[^a-zA-Z0-9_]/g, '_');

  for (const lib of KNOWN_LIBRARIES) {
    if (lib.patterns.some(p => raw.includes(p) || clean.includes(p.replace(/[^a-zA-Z0-9_]/g, '_')))) {
      return lib;
    }
  }
  return null;
}
