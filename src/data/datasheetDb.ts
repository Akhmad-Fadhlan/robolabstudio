export interface ComponentDatasheet {
  id: string;
  name: string;
  category: 'mcu' | 'sensor' | 'actuator' | 'display' | 'passive';
  operatingVoltage: string;
  maxCurrent: string;
  description: string;
  pinout: Array<{ name: string; type: string; description: string }>;
  specs: Record<string, string>;
  notes: string[];
  sampleCodeArduino?: string;
  sampleCodePython?: string;
}

export const DATASHEET_DATABASE: Record<string, ComponentDatasheet> = {
  arduino_uno: {
    id: 'arduino_uno',
    name: 'Arduino Uno R3',
    category: 'mcu',
    operatingVoltage: '5V DC (Input 7-12V DC via Vin/DC Jack)',
    maxCurrent: '50mA per I/O Pin (Revisi aman 20mA)',
    description: 'Papan mikrokontroler berbasis ATmega328P. Sangat ideal untuk pemula robotika dan sistem tertanam.',
    specs: {
      'Microcontroller': 'ATmega328P',
      'Clock Speed': '16 MHz',
      'Flash Memory': '32 KB (0.5 KB untuk bootloader)',
      'SRAM': '2 KB',
      'EEPROM': '1 KB',
      'Digital I/O Pins': '14 (6 diantaranya mendukung PWM)',
      'Analog Input Pins': '6 (A0 - A5, 10-bit resolution 0-1023)',
      'Interfaces': 'UART (Serial), SPI, I2C (A4/SDA, A5/SCL)'
    },
    pinout: [
      { name: '5V / 3.3V', type: 'Power Output', description: 'Catu daya untuk sensor dan modul external.' },
      { name: 'GND', type: 'Ground', description: 'Pin pembatas ground umum (0V).' },
      { name: 'Digital 0 - 13', type: 'Digital I/O', description: 'Pin digital. Pin 3,5,6,9,10,11 mendukung analogWrite (PWM).' },
      { name: 'Analog A0 - A5', type: 'Analog Input', description: 'Input analog 0 - 5V (Dapat juga digunakan sebagai Digital GPIO).' },
      { name: 'Pin 0 (RX) & 1 (TX)', type: 'UART', description: 'Komunikasi Serial USB & Serial Hardware.' }
    ],
    notes: [
      'Gunakan resistor pembatas (misal 220Ω) jika menghubungkan LED ke pin digital.',
      'Tegangan logika maksimum pada pin I/O adalah 5V. Hati-hati jangan menyambungkan sensor 3.3V tanpa Logic Level Converter.'
    ],
    sampleCodeArduino: `void setup() {
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Arduino Uno Ready!");
}

void loop() {
  digitalWrite(13, HIGH);
  delay(1000);
  digitalWrite(13, LOW);
  delay(1000);
}`
  },

  esp32: {
    id: 'esp32',
    name: 'ESP32 DevKit V4',
    category: 'mcu',
    operatingVoltage: '3.3V DC (Power via Micro-USB / 5V Vin pin)',
    maxCurrent: '12mA per GPIO Pin (Maks 40mA absolute max)',
    description: 'SoC berperforma tinggi 32-bit dengan WiFi 802.11 b/g/n & Bluetooth v4.2 BR/EDR dan BLE.',
    specs: {
      'Processor': 'Tensilica Xtensa Dual-Core 32-bit LX6 @ 240 MHz',
      'SRAM': '520 KB',
      'Flash Memory': '4 MB',
      'Wireless': 'Wi-Fi 802.11 b/g/n (up to 150Mbps) + Bluetooth v4.2 BLE',
      'ADC': '12-bit (Nilai 0 - 4095)',
      'DAC': '2 x 8-bit DAC',
      'I2C Default': 'GPIO 21 (SDA), GPIO 22 (SCL)',
      'PWM Pins': 'Semua pin GPIO dapat dikonfigurasi sebagai PWM (LEDC controller)'
    },
    pinout: [
      { name: '3V3 / Vin (5V)', type: 'Power', description: '3.3V Regulated Output / 5V DC Power Input.' },
      { name: 'GND', type: 'Ground', description: 'Pin pembatas ground (0V).' },
      { name: 'GPIO 21 & 22', type: 'I2C Bus', description: 'GPIO 21 (SDA), GPIO 22 (SCL) untuk LCD I2C / OLED.' },
      { name: 'GPIO 34 - 39', type: 'Input Only', description: 'Hanya bisa dijadikan Input, tidak memiliki internal pull-up/pull-down.' },
      { name: 'GPIO 2 (Built-in LED)', type: 'Digital I/O', description: 'Terhubung ke Onboard LED biru pada sebagian besar modul DevKit.' }
    ],
    notes: [
      'PENTING: Logika ESP32 adalah 3.3V! Jangan hubungkan sinyal 5V langsung ke GPIO ESP32 untuk menghindari kerusakan permanen.',
      'Gunakan Serial.begin(115200) untuk memantau Serial Monitor.'
    ],
    sampleCodeArduino: `#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  pinMode(2, OUTPUT);
  Serial.println("ESP32 Initialized!");
}

void loop() {
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}`
  },

  esp8266: {
    id: 'esp8266',
    name: 'ESP8266 NodeMCU V3',
    category: 'mcu',
    operatingVoltage: '3.3V DC (Input 5V via USB / Vin pin)',
    maxCurrent: '12mA per GPIO Pin',
    description: 'Modul IoT berbiaya rendah berbasis Wi-Fi SoC ESP8266 dengan IC FTDI/CH340 USB-to-Serial.',
    specs: {
      'Processor': 'Tensilica L106 32-bit @ 80 MHz / 160 MHz',
      'SRAM': '80 KB',
      'Flash': '4 MB',
      'Wi-Fi': '802.11 b/g/n',
      'Digital Pins': 'D0 - D8 (GPIO 0,2,4,5,12,13,14,15,16)',
      'Analog Input': '1 Pin (A0 / ADC0, maks 1.0V internal, 3.3V pada NodeMCU board)'
    },
    pinout: [
      { name: '3V3 / Vin (5V)', type: 'Power', description: 'Catu daya 3.3V atau 5V.' },
      { name: 'D1 (GPIO5) & D2 (GPIO4)', type: 'I2C', description: 'Default I2C: D1 (SCL), D2 (SDA).' },
      { name: 'D4 (GPIO2)', type: 'LED', description: 'Internal LED (Active LOW pada banyak board).' },
      { name: 'A0', type: 'Analog', description: 'Input Analog (ADC 10-bit).' }
    ],
    notes: [
      'Gunakan penulisan pin konstanta NodeMCU seperti D1, D2, D4 di Arduino IDE untuk keamanan mapping pin.'
    ],
    sampleCodeArduino: `#include <ESP8266WiFi.h>

void setup() {
  Serial.begin(115200);
  pinMode(D4, OUTPUT);
}

void loop() {
  digitalWrite(D4, LOW); // LED On (Active Low)
  delay(1000);
  digitalWrite(D4, HIGH); // LED Off
  delay(1000);
}`
  },

  microbit: {
    id: 'microbit',
    name: 'BBC micro:bit V2',
    category: 'mcu',
    operatingVoltage: '3.3V DC (Via Micro-USB / Battery Connector)',
    maxCurrent: '5mA per Pin (Maks total 300mA)',
    description: 'Papan edukasi mikrokontroler berbasis ARM Cortex-M4 dengan layar LED Matrix 5x5, tombol, sensor gerak, dan mikrofon/speaker.',
    specs: {
      'Processor': 'Nordic nRF52833 ARM Cortex-M4 @ 64 MHz',
      'RAM': '128 KB',
      'Flash': '512 KB',
      'Peripherals': '5x5 Red LED Matrix, 2x Push Buttons (A/B), Touch Logo, Accelerometer, Magnetometer, Microphone, Speaker, BLE 5.0'
    },
    pinout: [
      { name: 'Pin 0, 1, 2', type: 'Edge Connector (Large)', description: 'Pin Crocodile clip untuk Analog Read / Touch / PWM.' },
      { name: '3V & GND', type: 'Power Pins', description: 'Catu daya 3.3V dan Ground.' },
      { name: 'Pin 19 (SCL) & 20 (SDA)', type: 'I2C Bus', description: 'Koneksi I2C sensor external.' }
    ],
    notes: [
      'Dapat diprogram dengan Python (MicroPython) atau Block Code.',
      'Sangat peka terhadap kelebihan tegangan. Jangan diberi catu daya di atas 3.6V!'
    ],
    sampleCodePython: `from microbit import *

display.show(Image.HAPPY)

while True:
    if button_a.is_pressed():
        display.show(Image.HEART)
        sleep(500)
    else:
        display.show(Image.HAPPY)`
  },

  dht11: {
    id: 'dht11',
    name: 'Sensor Suhu & Kelembaban DHT11',
    category: 'sensor',
    operatingVoltage: '3.3V - 5V DC',
    maxCurrent: '2.5mA (saat mengukur data)',
    description: 'Sensor digital terkalibrasi untuk mengukur suhu ruangan dan kelembaban udara dengan protokol 1-Wire Single-Bus.',
    specs: {
      'Rentang Suhu': '0°C hingga 50°C (Akurasi ±2°C)',
      'Rentang Kelembaban': '20% RH hingga 90% RH (Akurasi ±5%)',
      'Sampling Rate': '1 Hz (1 kali per detik)',
      'Protokol': 'Custom Single-Bus Digital Signal'
    },
    pinout: [
      { name: 'VCC (+)', type: 'Power', description: 'Hubungkan ke 3.3V atau 5V MCU.' },
      { name: 'DATA (Out)', type: 'Digital Output', description: 'Hubungkan ke Digital GPIO (Gunakan pull-up resistor 10kΩ jika menggunakan komponen chip telanjang).' },
      { name: 'NC', type: 'No Connect', description: 'Tidak terhubung (pada modul 4 pin).' },
      { name: 'GND (-)', type: 'Ground', description: 'Hubungkan ke Ground (0V).' }
    ],
    notes: [
      'Sensor membutuhkan waktu jeda minimal 1 hingga 2 detik antar pembacaan data.',
      'Memerlukan library DHT.h (Adafruit) atau DHTSensor pada Arduino.'
    ],
    sampleCodeArduino: `#include "DHT.h"
#define DHTPIN 4
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  dht.begin();
}

void loop() {
  delay(2000);
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  Serial.print("Kelembaban: "); Serial.print(h);
  Serial.print("%  Suhu: "); Serial.print(t); Serial.println("°C");
}`
  },

  hcsr04: {
    id: 'hcsr04',
    name: 'Sensor Jarak Ultrasonik HC-SR04',
    category: 'sensor',
    operatingVoltage: '5V DC',
    maxCurrent: '15mA',
    description: 'Modul pengukur jarak non-kontak 2cm - 400cm memanfaatkan gelombang suara ultrasonik 40kHz.',
    specs: {
      'Jangkauan': '2 cm hingga 400 cm (Akurasi ±3mm)',
      'Sudut Ukur': '15 Derajat',
      'Trigger Input Signal': '10us TTL Pulse HIGH',
      'Echo Output Signal': 'PWL TTL High Pulse yang proporsional dengan jarak'
    },
    pinout: [
      { name: 'VCC', type: 'Power', description: '5V DC Power Supply.' },
      { name: 'Trig', type: 'Digital Input', description: 'Pin pemicu gelombang ultrasonik (Trigger).' },
      { name: 'Echo', type: 'Digital Output', description: 'Pin penerima sinyal balik (Echo).' },
      { name: 'GND', type: 'Ground', description: 'Ground.' }
    ],
    notes: [
      'Rumus perhitungan jarak: Jarak (cm) = (Waktu Echo (us) * 0.0343) / 2.',
      'Jika digunakan pada ESP32 (3.3V), sinyal Echo (5V) disarankan memakai pembagi tegangan resistor 1kΩ / 2kΩ.'
    ],
    sampleCodeArduino: `#define TRIG_PIN 9
#define ECHO_PIN 10

void setup() {
  Serial.begin(9600);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
}

void loop() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH);
  float distance = (duration * 0.0343) / 2;
  
  Serial.print("Jarak: "); Serial.print(distance); Serial.println(" cm");
  delay(500);
}`
  },

  lcd16x2_i2c: {
    id: 'lcd16x2_i2c',
    name: 'Layar Display LCD 16x2 I2C (PCF8574)',
    category: 'display',
    operatingVoltage: '5V DC',
    maxCurrent: '50mA (dengan Backlight menyala)',
    description: 'Modul karakter LCD 16 kolom x 2 baris yang sudah dilengkapi konverter I2C PCF8574 sehingga hanya butuh 2 pin komunikasi (SDA & SCL).',
    specs: {
      'Format Tampilan': '16 Karakter x 2 Baris',
      'Backlight': 'Blue/Yellow-Green dengan LED Backlight',
      'Alamat I2C Default': '0x27 atau 0x3F',
      'Protokol': 'I2C (Standard 100kHz)'
    },
    pinout: [
      { name: 'GND', type: 'Ground', description: 'Ground 0V.' },
      { name: 'VCC', type: 'Power', description: 'Catu daya 5V DC.' },
      { name: 'SDA', type: 'I2C Data', description: 'Serial Data Line (A4 di Arduino / GPIO 21 di ESP32).' },
      { name: 'SCL', type: 'I2C Clock', description: 'Serial Clock Line (A5 di Arduino / GPIO 22 di ESP32).' }
    ],
    notes: [
      'Gunakan trimpot biru di belakang modul I2C backpack untuk menyesuaikan kontras layar jika teks tidak kelihatan.',
      'Memerlukan library LiquidCrystal_I2C.'
    ],
    sampleCodeArduino: `#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RoboLab Studio");
  lcd.setCursor(0, 1);
  lcd.print("AI Connected!");
}

void loop() {}`
  },

  servo_sg90: {
    id: 'servo_sg90',
    name: 'Motor Servo SG90 (Micro Servo 9g)',
    category: 'actuator',
    operatingVoltage: '4.8V - 6.0V DC',
    maxCurrent: '500mA - 650mA (Stall Current)',
    description: 'Motor servo kecil dengan sudut rotasi 0 hingga 180 derajat yang dikendalikan oleh sinyal PWM 50Hz.',
    specs: {
      'Torque': '1.8 kg-cm pada 4.8V',
      'Kecepatan': '0.1s / 60 derajat pada 4.8V',
      'Lebar Pulsa PWM': '500us (0°) - 2400us (180°) pada periode 20ms'
    },
    pinout: [
      { name: 'Cokelat / Hitam', type: 'Ground', description: 'Hubungkan ke GND.' },
      { name: 'Merah', type: 'Power (VCC)', description: 'Hubungkan ke 5V DC (Sangat disarankan catu daya terpisah untuk menghindari reset MCU).' },
      { name: 'Kuning / Oranye', type: 'PWM Signal', description: 'Hubungkan ke Pin Digital PWM.' }
    ],
    notes: [
      'Jangan menggerakkan Servo melebihi 180° secara paksa untuk mencegah kerusakan gear plastik.'
    ],
    sampleCodeArduino: `#include <Servo.h>

Servo myServo;

void setup() {
  myServo.attach(9);
}

void loop() {
  myServo.write(0);
  delay(1000);
  myServo.write(90);
  delay(1000);
  myServo.write(180);
  delay(1000);
}`
  },

  motor_dc: {
    id: 'motor_dc',
    name: 'Motor DC & Driver Motor L298N',
    category: 'actuator',
    operatingVoltage: '5V - 35V DC',
    maxCurrent: '2A per channel (Dual H-Bridge)',
    description: 'Aktuator penggerak roda robot. Modul L298N mengendalikan arah putaran (CW/CCW) dan kecepatan (PWM).',
    specs: {
      'Jumlah Motor': 'Mengendalikan hingga 2 Motor DC secara independen',
      'Metode Kontrol': 'Dual H-Bridge Driver',
      'Pin Kontrol': 'IN1, IN2 (Motor A direction), IN3, IN4 (Motor B direction), ENA, ENB (PWM Speed)'
    },
    pinout: [
      { name: 'VMS / 12V', type: 'Motor Power', description: 'Catu daya motor DC eksternal (5V - 12V DC).' },
      { name: 'GND', type: 'Ground', description: 'Ground bersama MCU dan Baterai.' },
      { name: 'IN1 & IN2', type: 'Logic Dir', description: 'IN1=HIGH, IN2=LOW (Maju); IN1=LOW, IN2=HIGH (Mundur).' },
      { name: 'ENA & ENB', type: 'Speed PWM', description: 'Pin PWM untuk mengatur kecepatan putaran motor (0-255).' }
    ],
    notes: [
      'Pastikan Ground (GND) dari mikrokontroler dan Driver L298N dihubungkan bersatu!'
    ]
  },

  led: {
    id: 'led',
    name: 'LED 5mm (Light Emitting Diode)',
    category: 'passive',
    operatingVoltage: '1.8V - 3.2V DC (Tergantung Warna)',
    maxCurrent: '20mA (Tipikal aman 10-15mA)',
    description: 'Komponen semikonduktor pemancar cahaya sebagai indikator status.',
    specs: {
      'Forward Voltage Merah/Kuning': '1.8V - 2.2V',
      'Forward Voltage Hijau/Biru': '3.0V - 3.2V',
      'R_limiter Formula': 'R = (V_supply - V_led) / I_led'
    },
    pinout: [
      { name: 'Anoda (+)', type: 'Kaki Panjang', description: 'Hubungkan ke Pin Output Digital via Resistor 220Ω - 330Ω.' },
      { name: 'Katoda (-)', type: 'Kaki Pendek / Flat Side', description: 'Hubungkan ke GND.' }
    ],
    notes: [
      'Selalu pasang resistor pembatas arus (misal 220Ω untuk 5V, atau 100Ω untuk 3.3V) agar LED tidak terbakar!'
    ]
  },

  potentiometer: {
    id: 'potentiometer',
    name: 'Potensiometer Rotary 10kΩ',
    category: 'sensor',
    operatingVoltage: '0V - 5V / 3.3V DC',
    maxCurrent: '1mA',
    description: 'Resistor variabel pembagi tegangan analog untuk memberikan masukan nilai linier/rotasi ke mikrokontroler.',
    specs: {
      'Resistansi Maks': '10,000 Ohm (10kΩ)',
      'Tipe Output': 'Tegangan Analog (0V hingga VCC)',
      'Nilai ADC Arduino': '0 - 1023 (10-bit)',
      'Nilai ADC ESP32': '0 - 4095 (12-bit)'
    },
    pinout: [
      { name: 'Pin 1 (Left)', type: 'Power / GND', description: 'Hubungkan ke VCC (5V/3.3V) atau GND.' },
      { name: 'Pin 2 (Center / Wiper)', type: 'Analog Out', description: 'Hubungkan ke Pin Input Analog MCU (A0 di Arduino / GPIO34 di ESP32).' },
      { name: 'Pin 3 (Right)', type: 'GND / Power', description: 'Hubungkan ke GND atau VCC.' }
    ],
    notes: [
      'Mengubah sudut putaran akan mengubah output pembagi tegangan pada pin tengah (Wiper).'
    ]
  },

  pushbutton: {
    id: 'pushbutton',
    name: 'Push Button (Tactile Switch 4-Pin)',
    category: 'passive',
    operatingVoltage: '3.3V - 5V DC',
    maxCurrent: '50mA',
    description: 'Sakelar tekan momen yang menghubungkan sirkuit saat ditekan dan memutuskannya saat dilepas.',
    specs: {
      'Tipe Sakelar': 'Momentary NO (Normally Open)',
      'Konstruksi Pin': 'Pin berseberangan saling terhubung secara internal secara berpasangan'
    },
    pinout: [
      { name: 'Pin 1A & 1B', type: 'Terminal A', description: 'Terhubung internal. Pasang ke Pin Digital MCU.' },
      { name: 'Pin 2A & 2B', type: 'Terminal B', description: 'Terhubung internal. Pasang ke GND (jika menggunakan INPUT_PULLUP).' }
    ],
    notes: [
      'Gunakan pinMode(PIN, INPUT_PULLUP) pada Arduino/ESP32 untuk mengaktifkan resistor pull-up internal tanpa butuh resistor fisik tambahan!'
    ]
  }
};
