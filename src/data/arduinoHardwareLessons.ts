// src/data/arduinoHardwareLessons.ts
// Materi Pembelajaran Interaktif Pengenalan Hardware Arduino Uno & Mikrokontroler

export interface ArduinoHardwareLesson {
  title: string;
  desc: string;
  content: string;
  code: string;
  cppCode?: string;
  xml: string;
}

export const ARDUINO_HARDWARE_LESSONS: ArduinoHardwareLesson[] = [
  {
    title: "1. Arsitektur & Pinout Arduino Uno",
    desc: "Mengenal anatomi board Arduino Uno: Chip ATmega328P, Pin Digital D0-D13, Analog A0-A5, dan Jalur Power.",
    content: `### 1. Mengenal Anatomi Board Arduino Uno R3
Arduino Uno adalah papan mikrokontroler berbasis chip **ATmega328P** dengan clock speed **16 MHz**. Board ini menjadi standar dunia pendidikan robotika karena memiliki perlindungan sirkuit dan antarmuka pemrograman yang sangat mudah dipahami.

### 2. Zona Pin pada Arduino Uno:
- **Pin Power & Ground**:
  - **5V**: Jalur tegangan output stabil 5.0V dari regulator onboard untuk menyuplai sensor.
  - **3.3V**: Jalur tegangan output 3.3V (maksimal 50 mA) untuk sensor sensitif seperti modul Bluetooth atau SD Card.
  - **GND (Ground)**: Titik referensi tegangan 0 Volt. Semua sirkuit dan sensor **wajib** terhubung ke Ground yang sama (*common ground*).
  - **VIN**: Pin input daya eksternal (7V s/d 12V DC) jika tidak menggunakan kabel USB.
  - **RESET**: Pin untuk me-reset ulang eksekusi program ATmega328P dari awal saat dihubungkan ke GND.
- **Pin Digital I/O (D0 - D13)**:
  - Beroperasi pada level logika digital TTL: **0V (LOW)** atau **5V (HIGH)**.
  - Arus aman yang disarankan adalah **20 mA per pin** (maksimum absolut 40 mA per pin). Total arus seluruh pin tidak boleh melebihi 200 mA.
- **Pin Analog Input (A0 - A5)**:
  - Membaca tegangan kontinu dari 0V s/d 5V melalui sirkuit ADC (Analog-to-Digital Converter) 10-bit internal.
  - Pin A0-A5 juga dapat digunakan sebagai pin digital biasa (D14 s/d D19).
- **Pin Khusus yang Wajib Diingat**:
  - **D0 (RX) & D1 (TX)**: Terhubung ke chip USB-Serial. Jangan gunakan kedua pin ini untuk tombol/sensor jika Anda menggunakan Serial Monitor!
  - **D13**: Terhubung langsung ke onboard LED warna oranye melalui resistor internal.
  - **Pin Tilde ~ (D3, D5, D6, D9, D10, D11)**: Mendukung fitur PWM (Pulse Width Modulation).
  - **D2 & D3**: Mendukung Hardware External Interrupts.`,
    code: `// Lesson 1: Pengujian Pinout Onboard LED Arduino Uno
const int onboardLed = 13; // Pin D13 terhubung ke LED bawaan board

void setup() {
  // Inisialisasi pin D13 sebagai OUTPUT
  pinMode(onboardLed, OUTPUT);
  Serial.begin(9600);
  Serial.println("=== RoboLab Arduino Uno Board Check ===");
  Serial.println("Status: ATmega328P 16MHz Berhasil Dikenali!");
}

void loop() {
  // Kedipkan LED bawaan board
  digitalWrite(onboardLed, HIGH);
  Serial.println("Pin 13: HIGH (5V) -> LED Menyala");
  delay(1000);

  digitalWrite(onboardLed, LOW);
  Serial.println("Pin 13: LOW (0V) -> LED Padam");
  delay(1000);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field><next>
        <block type="serial_begin"><field name="BAUD">9600</field></block>
      </next></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="160">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">HIGH</field><next>
        <block type="arduino_delay"><field name="MS">1000</field><next>
          <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field><next>
            <block type="arduino_delay"><field name="MS">1000</field></block>
          </next></block>
        </next></block>
      </next></block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "2. Digital Output & Kontrol Aktuator (HIGH / LOW)",
    desc: "Mengonfigurasi pin sebagai OUTPUT dengan pinMode() dan mengalirkan arus listrik dengan digitalWrite().",
    content: `### 1. Prinsip Logika Digital
Mikrokontroler digital hanya mengenal dua kondisi keadaan logika:
- **HIGH (Logika 1)**: Pin mengeluarkan tegangan sebesar **5.0 Volt** (atau 3.3V pada ESP32). Pin mengalirkan arus (*source current*) ke beban.
- **LOW (Logika 0)**: Pin mengeluarkan tegangan sebesar **0 Volt (GND)**. Pin memutus arus atau menyerap arus (*sink current*).

### 2. Fungsi Utama Digital Output:
- \`pinMode(pin, OUTPUT)\`: Mengubah impedansi pin internal ATmega328P menjadi rendah agar mampu mengalirkan arus listrik keluar. Wajib dipanggil di dalam \`setup()\`.
- \`digitalWrite(pin, HIGH)\`: Mengalirkan tegangan 5V ke pin tersebut.
- \`digitalWrite(pin, LOW)\`: Memutus tegangan (0V / Ground).

### 3. Pentingnya Resistor Pembatas Arus (Current-Limiting Resistor):
LED (Light Emitting Diode) memiliki tegangan jatuh maju (*forward voltage* $V_f$) sekitar 1.8V s/d 2.2V. Jika dihubungkan langsung ke pin 5V tanpa resistor, arus yang mengalir akan melonjak drastis melebihi batas aman 40mA dan membakar LED serta merusak port mikrokontroler!

Berdasarkan **Hukum Ohm** ($V = I \\times R$):
$$R = \\frac{V_{CC} - V_f}{I} = \\frac{5.0\\text{V} - 2.0\\text{V}}{0.015\\text{A}} = 200\\,\\Omega$$
Oleh karena itu, selalu gunakan resistor bernilai **220\\,\\Omega** s/d **330\\,\\Omega** yang dipasang secara seri dengan LED!`,
    code: `// Lesson 2: Digital Output dengan Resistor Pembatas
const int redLedPin = 8;
const int greenLedPin = 9;

void setup() {
  // Konfigurasi pin sebagai OUTPUT
  pinMode(redLedPin, OUTPUT);
  pinMode(greenLedPin, OUTPUT);
}

void loop() {
  // Nyalakan LED Merah, Padamkan LED Hijau
  digitalWrite(redLedPin, HIGH);
  digitalWrite(greenLedPin, LOW);
  delay(500);

  // Nyalakan LED Hijau, Padamkan LED Merah
  digitalWrite(redLedPin, LOW);
  digitalWrite(greenLedPin, HIGH);
  delay(500);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">8</field><field name="STATE">LOW</field><next>
        <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
      </next></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="160">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">8</field><field name="STATE">HIGH</field><next>
        <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field><next>
          <block type="arduino_delay"><field name="MS">500</field><next>
            <block type="pin_digital_write"><field name="PIN">8</field><field name="STATE">LOW</field><next>
              <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">HIGH</field><next>
                <block type="arduino_delay"><field name="MS">500</field></block>
              </next></block>
            </next></block>
          </next></block>
        </next></block>
      </next></block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "3. Digital Input & Tombol (Floating vs INPUT_PULLUP)",
    desc: "Membaca status tombol tekan dengan digitalRead() dan memahami pentingnya resistor Pull-Up untuk menghindari floating pin.",
    content: `### 1. Membaca Status Pin Digital
Fungsi \`digitalRead(pin)\` digunakan untuk memeriksa kondisi tegangan pada pin input:
- Mengembalikan nilai \`HIGH\` (1) jika tegangan pin terdeteksi di atas ~3.0V.
- Mengembalikan nilai \`LOW\` (0) jika tegangan pin terdeteksi di bawah ~1.5V.

### 2. Bahaya Masalah Pin Mengambang (*Floating Pin*)
Jika Anda menghubungkan sebuah tombol ke pin input tanpa resistor:
- Saat tombol ditekan, pin terhubung ke 5V (terbaca HIGH).
- Saat tombol dilepas, pin **tidak terhubung ke mana pun** (mengambang di udara bebas).
- Pin yang mengambang akan bertindak seperti antena radio kecil yang menangkap interferensi gelombang elektromagnetik sekitar, menyebabkan nilai \`digitalRead()\` berubah-ubah secara liar dan acak antara 1 dan 0!

### 3. Solusi Elegan: Resistor Internal \`INPUT_PULLUP\`
Arduino Uno telah menyertakan resistor pull-up internal bernilai **20k\\,\\Omega - 50k\\,\\Omega** di dalam chip ATmega328P.
Cukup deklarasikan:
\`pinMode(buttonPin, INPUT_PULLUP);\`

**Karakteristik Logika Active-LOW**:
- Saat tombol **dilepas**: Resistor internal menarik pin ke 5V $\\to$ \`digitalRead()\` bernilai **HIGH (1)**.
- Saat tombol **ditekan**: Sirkuit terhubung langsung ke GND $\\to$ \`digitalRead()\` bernilai **LOW (0)**.`,
    code: `// Lesson 3: Membaca Tombol dengan Fitur INPUT_PULLUP
const int buttonPin = 2; // Pin Tombol terhubung ke Pin 2 dan GND
const int ledPin = 13;   // Pin LED Indikator

void setup() {
  pinMode(buttonPin, INPUT_PULLUP); // Aktifkan resistor internal pull-up
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int buttonState = digitalRead(buttonPin);

  // Karena Active-LOW, tombol ditekan ketika nilainya LOW
  if (buttonState == LOW) {
    digitalWrite(ledPin, HIGH); // Nyalakan LED
    Serial.println("Tombol DITEKAN! (Level LOW)");
  } else {
    digitalWrite(ledPin, LOW);  // Padamkan LED
  }
  delay(50); // Debounce sederhana
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field><next>
        <block type="serial_begin"><field name="BAUD">9600</field></block>
      </next></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="160">
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare"><field name="OP">EQ</field>
            <value name="A"><block type="pin_digital_read"><field name="PIN">2</field></block></value>
            <value name="B"><block type="math_number"><field name="NUM">0</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">HIGH</field></block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field></block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "4. Pin Analog Input & Konversi ADC 10-Bit",
    desc: "Membaca sinyal kontinu dari potensiometer dan sensor fisik melalui pin A0-A5 dan mengonversinya ke tegangan nyata.",
    content: `### 1. Perbedaan Sinyal Analog vs Digital
Di alam semesta nyata, parameter fisik seperti suhu, cahaya, tekanan, dan suara tidak bersifat ON/OFF, melainkan berubah secara kontinu dengan nilai tak hingga. Pin Analog **A0 s/d A5** dirancang khusus untuk menangkap variasi tegangan halus ini.

### 2. Cara Kerja ADC (Analog-to-Digital Converter) 10-Bit
Chip ATmega328P dilengkapi konverter ADC 10-bit internal:
- Resolusi 10-bit berarti rentang pembagian sebesar $2^{10} = 1024$ tingkat diskrit (**0 s/d 1023**).
- Rentang tegangan referensi standar adalah **0.0V s/d 5.0V**.
- Setiap kenaikan 1 angka pada nilai ADC merepresentasikan tegangan sebesar:
  $$\\text{Resolusi} = \\frac{5.0\\text{ Volt}}{1024} \\approx 4.88\\text{ mV}$$

### 3. Rumus Konversi Nilai Mentah ADC ke Tegangan Fisik:
$$V_{in} = \\frac{\\text{Nilai ADC}}{1023.0} \\times 5.0\\text{ Volt}$$

Contoh Kasus:
- Jika \`analogRead(A0)\` menghasilkan angka **0**, tegangan input adalah **0.00 V**.
- Jika menghasilkan angka **512**, tegangan input adalah $\\frac{512}{1023} \\times 5 = \\mathbf{2.50\\text{ V}}$.
- Jika menghasilkan angka **1023**, tegangan input adalah $\\mathbf{5.00\\text{ V}}$.`,
    code: `// Lesson 4: Membaca Tegangan Potensiometer dengan ADC 10-Bit
const int potPin = A0; // Pin wiper potensiometer terhubung ke A0

void setup() {
  Serial.begin(9600);
  Serial.println("Inisialisasi Pembacaan ADC Analog Uno (0-1023)...");
}

void loop() {
  // Baca nilai mentah ADC 10-bit (0 s/d 1023)
  int rawAdc = analogRead(potPin);

  // Hitung nilai tegangan analog riil dalam Volt
  float voltage = (rawAdc / 1023.0) * 5.0;

  // Tampilkan hasil telemetri ke Serial Monitor
  Serial.print("Nilai Mentah ADC: ");
  Serial.print(rawAdc);
  Serial.print(" | Tegangan Riil: ");
  Serial.print(voltage, 2);
  Serial.println(" V");

  delay(300);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">9600</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT">
          <block type="pin_analog_read"><field name="PIN">A0</field></block>
        </value>
        <next><block type="arduino_delay"><field name="MS">300</field></block></next>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "5. PWM (Pulse Width Modulation) & analogWrite()",
    desc: "Mensimulasikan tegangan analog variabel untuk mengatur kecerahan LED dan kecepatan motor DC menggunakan gelombang pulsa PWM.",
    content: `### 1. Mengapa Mikrokontroler Membutuhkan PWM?
Arduino Uno tidak memiliki konverter DAC (*Digital to Analog Converter*) sejati untuk menghasilkan output tegangan murni 2.1V atau 3.7V.
Untuk mengatasinya, digunakan teknik **PWM (Pulse Width Modulation)**, yaitu menyalakan (5V) dan memadamkan (0V) pin secara amat sangat cepat (sekitar 490 kali per detik atau 490 Hz).

### 2. Konsep Duty Cycle (Siklus Kerja)
Mata manusia dan motor listrik tidak dapat melihat kedipan pada frekuensi tinggi, melainkan hanya merasakan **tegangan rata-rata (*Average Voltage*)**:
$$V_{avg} = \\text{Duty Cycle} \\times 5.0\\text{V}$$

Rentang nilai \`analogWrite(pin, nilai)\` adalah 8-bit (**0 s/d 255**):
- **Nilai 0**: Duty Cycle 0% $\\to V_{avg} = 0.0\\text{ V}$ (LED Mati / Motor Berhenti)
- **Nilai 64**: Duty Cycle 25% $\\to V_{avg} = 1.25\\text{ V}$ (LED Redup)
- **Nilai 128**: Duty Cycle 50% $\\to V_{avg} = 2.50\\text{ V}$ (LED Terang Sedang)
- **Nilai 191**: Duty Cycle 75% $\\to V_{avg} = 3.75\\text{ V}$ (LED Terang)
- **Nilai 255**: Duty Cycle 100% $\\to V_{avg} = 5.00\\text{ V}$ (Maksimal Terang)

### 3. Pin Khusus PWM pada Arduino Uno
Pin yang mendukung PWM ditandai dengan lambang tilde **~**:
Pin **3, 5, 6, 9, 10, dan 11**.`,
    code: `// Lesson 5: Efek Fading LED Berkelanjutan dengan PWM
const int ledPwmPin = 9; // Pin 9 mendukung PWM (tanda ~)

void setup() {
  pinMode(ledPwmPin, OUTPUT);
}

void loop() {
  // Tingkatkan kecerahan secara perlahan (Fade In)
  for (int brightness = 0; brightness <= 255; brightness += 5) {
    analogWrite(ledPwmPin, brightness);
    delay(20);
  }

  // Turunkan kecerahan secara perlahan (Fade Out)
  for (int brightness = 255; brightness >= 0; brightness -= 5) {
    analogWrite(ledPwmPin, brightness);
    delay(20);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">9</field><field name="STATE">LOW</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="pin_analog_write">
        <field name="PIN">9</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">128</field></block></value>
        <next><block type="arduino_delay"><field name="MS">500</field><next>
          <block type="pin_analog_write">
            <field name="PIN">9</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">255</field></block></value>
            <next><block type="arduino_delay"><field name="MS">500</field></block></next>
          </block>
        </next></block></next>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "6. Komunikasi Serial UART & Telemetri Sensor",
    desc: "Membangun jalur komunikasi dua arah antara Arduino dan komputer melalui pin RX/TX dan Serial Monitor.",
    content: `### 1. Apa itu Komunikasi Serial UART?
UART (*Universal Asynchronous Receiver-Transmitter*) adalah protokol komunikasi data sekuensial bit per bit melalui dua jalur kawat:
- **TX (Transmit - Pin D1)**: Jalur pengiriman data dari Arduino ke Komputer.
- **RX (Receive - Pin D0)**: Jalur penerimaan data dari Komputer ke Arduino.

Karena bersifat asinkron (*tanpa sinyal clock bersama*), kedua perangkat harus menyepakati kecepatan transmisi bit per detik yang sama, yang dikenal sebagai **Baud Rate**.

### 2. Standar Baud Rate Populer:
- **9600 bps**: Standar paling stabil untuk Arduino Uno dan proyek pemula.
- **115200 bps**: Standar kecepatan tinggi untuk mikrokontroler ESP32, ESP8266, dan telemetri data grafik berkecepatan tinggi.

### 3. Fungsi Utama Serial Library:
- \`Serial.begin(baudrate)\`: Membuka kanal komunikasi serial di fungsi \`setup()\`.
- \`Serial.print(data)\`: Mengirim data teks atau angka tanpa ganti baris.
- \`Serial.println(data)\`: Mengirim data diikuti karakter enter (newline \`\\r\\n\`).
- \`Serial.available()\`: Mengecek apakah ada data kiriman yang masuk di buffer memori.
- \`Serial.read()\`: Membaca 1 karakter byte data yang masuk.`,
    code: `// Lesson 6: Telemetri Dua Arah Serial Monitor
int counter = 0;

void setup() {
  Serial.begin(9600); // Buka port komunikasi serial pada 9600 baud
  Serial.println("========================================");
  Serial.println("  ROBOLAB STUDIO SERIAL TELEMETRY READY ");
  Serial.println("========================================");
  Serial.println("Ketik '1' untuk menyalakan LED onboard, atau '0' untuk mematikan.");
  pinMode(13, OUTPUT);
}

void loop() {
  // 1. Cek apakah pengguna mengirim perintah dari Serial Monitor
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == '1') {
      digitalWrite(13, HIGH);
      Serial.println("-> RESPON: LED Onboard D13 [NYALA]");
    } else if (cmd == '0') {
      digitalWrite(13, LOW);
      Serial.println("-> RESPON: LED Onboard D13 [MATI]");
    }
  }

  // 2. Kirim data periodik setiap 2 detik
  static unsigned long lastTime = 0;
  if (millis() - lastTime >= 2000) {
    lastTime = millis();
    counter++;
    Serial.print("Uptime Detik: ");
    Serial.print(counter * 2);
    Serial.print(" s | Free RAM OK\n");
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">9600</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">Telemetri RoboLab Berjalan...</field></block></value>
        <next><block type="arduino_delay"><field name="MS">1000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "7. Protokol Komunikasi Bus: I2C & SPI",
    desc: "Menghubungkan puluhan sensor dan display ke mikrokontroler secara efisien menggunakan bus I2C (SDA/SCL) dan bus SPI.",
    content: `### 1. Masalah Keterbatasan Pin GPIO
Jika sebuah LCD membutuhkan 6 pin dan sensor IMU membutuhkan 4 pin, pin mikrokontroler akan cepat habis. Protokol Bus mengatasi masalah ini dengan membagikan jalur kabel bersama (*shared bus*) ke banyak modul periferal sekaligus!

### 2. Protokol I2C (Inter-Integrated Circuit / TWI)
I2C hanya memerlukan **2 kabel komunikasi**:
- **SDA (Serial Data)**: Jalur pertukaran data dua arah (Pin **A4** pada Uno / Pin 21 pada ESP32).
- **SCL (Serial Clock)**: Jalur detak clock sinkronisasi dari Master (Pin **A5** pada Uno / Pin 22 pada ESP32).

Setiap perangkat sensor memiliki **Alamat Hexadecimal 7-bit unik**:
- LCD Karakter I2C: Biasanya \`0x27\` atau \`0x3F\`
- Sensor Gerak IMU MPU6050: Biasanya \`0x68\`
- Layar OLED SSD1306: Biasanya \`0x3C\`
- Sensor Suhu Presisi BMP280: Biasanya \`0x76\`
Dengan I2C, Anda dapat menghubungkan hingga 127 sensor berbeda hanya ke 2 pin yang sama!

### 3. Protokol SPI (Serial Peripheral Interface)
SPI menggunakan **4 kabel komunikasi** dengan kecepatan transfer data sangat tinggi (hingga 10-50 MHz):
- **MOSI**: Master Out Slave In (Pin D11 pada Uno)
- **MISO**: Master In Slave Out (Pin D12 pada Uno)
- **SCK**: Serial Clock (Pin D13 pada Uno)
- **CS / SS**: Chip Select (Pin D10 pada Uno)`,
    code: `// Lesson 7: Pemindaian Alamat I2C Terhubung (I2C Bus Scanner)
#include <Wire.h>

void setup() {
  Wire.begin(); // Gabung ke bus I2C sebagai Master
  Serial.begin(9600);
  while (!Serial);
  Serial.println("\n--- Memulai Pemindaian Seluruh Alamat I2C (0x01 - 0x7E) ---");
}

void loop() {
  byte error, address;
  int deviceCount = 0;

  for (address = 1; address < 127; address++) {
    // Coba jabat tangan dengan alamat target
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("✓ Perangkat I2C DITEMUKAN pada alamat Hex: 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      deviceCount++;
    }
  }

  if (deviceCount == 0) {
    Serial.println("Tidak ada modul I2C terdeteksi. Periksa kabel SDA (A4) dan SCL (A5).");
  } else {
    Serial.print("Selesai memindai. Total perangkat aktif: ");
    Serial.println(deviceCount);
  }

  Serial.println("---------------------------------------------------------");
  delay(5000); // Pindai ulang setiap 5 detik
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">9600</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">Scanning I2C Bus...</field></block></value>
        <next><block type="arduino_delay"><field name="MS">5000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`
  },
  {
    title: "8. Interupsi Hardware (External Interrupts)",
    desc: "Merespons sinyal darurat atau pulsa encoder secara instan tanpa terhambat oleh delay() di fungsi loop().",
    content: `### 1. Masalah Polling Konvensional
Dalam program sekuensial standar, CPU memeriksa kondisi tombol di dalam fungsi \`loop()\`. Jika kode program Anda memiliki fungsi jeda seperti \`delay(2000)\`, CPU akan "tertidur", dan penekanan tombol darurat atau putaran roda motor pada saat jeda tersebut akan hilang terlewat (*missed event*)!

### 2. Cara Kerja Hardware Interrupt
Arduino memiliki sirkuit hardware terdedikasi yang terus memantau level pin fisik secara independen:
- Ketika terjadi transisi sinyal listrik pada pin interupsi, hardware langsung menghentikan sementara jalannya program utama \`loop()\`.
- CPU seketika melompat mengeksekusi fungsi darurat khusus yang disebut **ISR (Interrupt Service Routine)**.
- Setelah ISR selesai, CPU melanjutkan program utama tepat di titik terakhir tanpa kehilangan data!

### 3. Pin Interupsi Eksternal pada Arduino Uno:
- **Pin D2**: Menangani Interrupt 0 (\`digitalPinToInterrupt(2)\`)
- **Pin D3**: Menangani Interrupt 1 (\`digitalPinToInterrupt(3)\`)

### 4. Mode Pemicu Interupsi:
- **RISING**: Terpicu saat sinyal berubah dari LOW ke HIGH.
- **FALLING**: Terpicu saat sinyal berubah dari HIGH ke LOW (sangat cocok untuk tombol dengan \`INPUT_PULLUP\`).
- **CHANGE**: Terpicu pada setiap perubahan level tegangan.

### 5. Aturan Penting ISR & Kata Kunci \`volatile\`:
1. Buat fungsi ISR seringkas mungkin (hindari \`delay()\` atau cetak serial panjang di dalam ISR).
2. Variabel global yang diubah di dalam ISR **wajib** diberi deklarasi \`volatile\` (contoh: \`volatile int counter = 0;\`) agar compiler tidak mengabaikan pembacaan memori RAM-nya.`,
    code: `// Lesson 8: Interupsi Hardware Eksternal pada Pin D2
const int interruptPin = 2; // Pin D2 mendukung external interrupt
const int ledPin = 13;

volatile int pulseCount = 0; // Variabel yang diubah di dalam ISR wajib volatile
volatile bool ledState = LOW;

// Fungsi ISR (Interrupt Service Routine) yang dipanggil otomatis oleh hardware
void handleInterrupt() {
  pulseCount++;
  ledState = !ledState;
  digitalWrite(ledPin, ledState);
}

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
  pinMode(interruptPin, INPUT_PULLUP);

  // Daftarkan fungsi ISR ke Pin D2 pada transisi FALLING (saat tombol ditekan ke GND)
  attachInterrupt(digitalPinToInterrupt(interruptPin), handleInterrupt, FALLING);

  Serial.println("Sistem Interupsi Hardware Siap!");
  Serial.println("Tekan tombol di Pin D2, CPU akan merespons seketika tanpa jeda.");
}

void loop() {
  // Simulasikan CPU sedang sibuk memproses tugas berat selama 3 detik
  Serial.println("CPU sedang menjalankan loop utama yang lambat...");
  delay(3000);

  // Cetak jumlah interupsi yang berhasil tertangkap secara instan
  Serial.print("-> Total Pulsa Interupsi Tertangkap: ");
  Serial.println(pulseCount);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="pin_digital_write"><field name="PIN">13</field><field name="STATE">LOW</field><next>
        <block type="serial_begin"><field name="BAUD">9600</field></block>
      </next></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">Interrupt System Running</field></block></value>
        <next><block type="arduino_delay"><field name="MS">2000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`
  }
];
