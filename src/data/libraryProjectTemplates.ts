// src/data/libraryProjectTemplates.ts
// Program contoh (examples) dari library Arduino populer & terpasang

export interface LibraryProjectTemplate {
  name: string;
  board: "Arduino Uno" | "ESP32 DevKit V1" | "BBC micro:bit";
  description: string;
  iconColor: string;
  components: string[];
  libraryName: string;
  category: "Library Example" | "Semua";
  isLibraryExample: boolean;
  ino: string;
  xml: string;
  py: string;
}

export const LIBRARY_PROJECT_TEMPLATES: LibraryProjectTemplate[] = [
  {
    name: "Servo - Sweep & Angle Control",
    board: "Arduino Uno",
    description: "Contoh resmi Servo: Menggerakkan motor servo secara berputar bolak-balik dari sudut 0 derajat ke 180 derajat secara halus.",
    iconColor: "emerald",
    components: ['servo'],
    libraryName: "Servo",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: Servo Sweep
#include <Servo.h>

Servo myServo;
int pos = 0;

void setup() {
  myServo.attach(9); // Hubungkan sinyal servo ke Pin 9 (PWM)
  Serial.begin(9600);
  Serial.println("Servo Sweep Dimulai!");
}

void loop() {
  // Putar dari 0 ke 180 derajat
  for (pos = 0; pos <= 180; pos += 1) {
    myServo.write(pos);
    delay(15);
  }
  // Putar kembali dari 180 ke 0 derajat
  for (pos = 180; pos >= 0; pos -= 1) {
    myServo.write(pos);
    delay(15);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="custom_servo_attach_pin">
        <field name="PIN">9</field>
        <next>
          <block type="serial_begin">
            <field name="BAUD">9600</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="180">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">9</field>
        <value name="ANGLE"><block type="math_number"><field name="NUM">0</field></block></value>
        <next>
          <block type="arduino_delay">
            <field name="MS">1000</field>
            <next>
              <block type="arduino_servo_write">
                <field name="PIN">9</field>
                <value name="ANGLE"><block type="math_number"><field name="NUM">180</field></block></value>
                <next>
                  <block type="arduino_delay">
                    <field name="MS">1000</field>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# Python / MicroPython Servo Sweep
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        robot.servo_write(9, 0)
        time.sleep(1)
        robot.servo_write(9, 180)
        time.sleep(1)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "Servo - Potentiometer Knob Control",
    board: "Arduino Uno",
    description: "Contoh Servo Knob: Membaca nilai potensiometer analog A0 dan memetakan posisinya ke sudut servo 0-180 derajat secara real-time.",
    iconColor: "cyan",
    components: ['servo', 'pot'],
    libraryName: "Servo",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: Servo Knob Control
#include <Servo.h>

Servo myServo;
const int potPin = A0;
int val = 0;

void setup() {
  myServo.attach(9);
  Serial.begin(9600);
}

void loop() {
  val = analogRead(potPin);            // Baca nilai analog (0-1023)
  val = map(val, 0, 1023, 0, 180);     // Petakan ke sudut derajat (0-180)
  myServo.write(val);                  // Gerakkan servo
  Serial.print("Sudut Servo: ");
  Serial.println(val);
  delay(20);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="custom_servo_attach_pin">
        <field name="PIN">9</field>
        <next>
          <block type="serial_begin">
            <field name="BAUD">9600</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="180">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">9</field>
        <value name="ANGLE">
          <block type="pin_analog_read">
            <field name="PIN">A0</field>
          </block>
        </value>
        <next>
          <block type="arduino_delay">
            <field name="MS">20</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# Python Servo Knob
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        pot = robot.analog_read(0)
        angle = int((pot / 1023.0) * 180)
        robot.servo_write(9, angle)
        time.sleep(0.02)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "LiquidCrystal I2C - 16x2 Display Hello World",
    board: "Arduino Uno",
    description: "Contoh LiquidCrystal_I2C: Menampilkan teks karakter dan penghitung waktu pada layar LCD 16x2 melalui bus komunikasi 2 kabel I2C.",
    iconColor: "blue",
    components: ['lcd'],
    libraryName: "LiquidCrystal_I2C",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: LiquidCrystal_I2C Hello World
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Atur alamat LCD ke 0x27 untuk tampilan 16 karakter dan 2 baris
LiquidCrystal_I2C lcd(0x27, 16, 2);

int counter = 0;

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RoboLab Studio");
  lcd.setCursor(0, 1);
  lcd.print("LCD I2C Ready!");
  delay(1500);
  lcd.clear();
}

void loop() {
  lcd.setCursor(0, 0);
  lcd.print("Detik Berjalan:");
  lcd.setCursor(0, 1);
  lcd.print(counter);
  lcd.print(" s");
  
  counter++;
  delay(1000);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="custom_liquidcrystal_i2c_begin">
        <next>
          <block type="serial_begin">
            <field name="BAUD">9600</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="160">
    <statement name="STACK">
      <block type="custom_liquidcrystal_i2c_print">
        <value name="TEXT">
          <block type="text"><field name="TEXT">RoboLab Studio</field></block>
        </value>
        <next>
          <block type="arduino_delay">
            <field name="MS">1000</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# MicroPython I2C LCD 16x2
import time
from machine import Pin, I2C

i2c = I2C(0, scl=Pin(22), sda=Pin(21))
print("LCD I2C Initialized:", i2c.scan())`
  },
  {
    name: "Adafruit MPU6050 - 6-Axis IMU & Tilt Telemetry",
    board: "Arduino Uno",
    description: "Contoh Adafruit_MPU6050: Membaca sensor akselerometer 3-sumbu dan giroskop melalui I2C untuk mendeteksi kemiringan dan orientasi.",
    iconColor: "purple",
    components: ['imu'],
    libraryName: "Adafruit_MPU6050",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: Adafruit MPU6050 Accelerometer & Gyroscope
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

Adafruit_MPU6050 mpu;

void setup() {
  Serial.begin(115200);
  while (!Serial) delay(10);

  Serial.println("Mencari sensor MPU6050...");
  if (!mpu.begin()) {
    Serial.println("Gagal menemukan chip MPU6050! Periksa kabel I2C (SDA/SCL).");
    while (1) delay(10);
  }
  Serial.println("MPU6050 Siap Beroperasi!");

  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
}

void loop() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);

  Serial.print("Akselerasi X: "); Serial.print(a.acceleration.x);
  Serial.print(", Y: "); Serial.print(a.acceleration.y);
  Serial.print(", Z: "); Serial.print(a.acceleration.z);
  Serial.println(" m/s^2");

  Serial.print("Rotasi Gyro X: "); Serial.print(g.gyro.x);
  Serial.print(", Y: "); Serial.print(g.gyro.y);
  Serial.print(", Z: "); Serial.print(g.gyro.z);
  Serial.println(" rad/s");

  Serial.print("Suhu: "); Serial.print(temp.temperature);
  Serial.println(" degC");
  Serial.println("------------------------------------");

  delay(500);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">115200</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">MPU6050 Active</field></block></value>
        <next>
          <block type="arduino_delay"><field name="MS">500</field></block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# MPU6050 Telemetry Python
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        print("Membaca telemetri MPU6050...")
        time.sleep(0.5)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "DHT11 / DHT22 - Suhu & Kelembaban Udara",
    board: "Arduino Uno",
    description: "Contoh DHT sensor library: Mengukur temperatur lingkungan dalam Celcius/Fahrenheit dan kelembaban relatif udara secara presisi.",
    iconColor: "amber",
    components: ['dht', 'temp'],
    libraryName: "DHT sensor library",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: DHT Temperature & Humidity
#include <DHT.h>

#define DHTPIN 4     // Pin data DHT terhubung ke Pin 4
#define DHTTYPE DHT11   // DHT 11 (atau DHT22)

DHT dht(DHTPIN, DHTTYPE);

void setup() {
  Serial.begin(9600);
  Serial.println("DHT11 Inisialisasi...");
  dht.begin();
}

void loop() {
  delay(2000); // Sensor DHT membutuhkan jeda 2 detik antar pembacaan

  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h) || isnan(t)) {
    Serial.println("Gagal membaca sensor DHT! Periksa kabel.");
    return;
  }

  Serial.print("Kelembaban: ");
  Serial.print(h);
  Serial.print(" %\t");
  Serial.print("Suhu: ");
  Serial.print(t);
  Serial.println(" *C");
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">9600</field><next>
        <block type="custom_dht_begin"><field name="PIN">4</field></block>
      </next></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="160">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT">
          <block type="custom_dht_read_func">
            <field name="FUNC">readTemperature</field>
          </block>
        </value>
        <next>
          <block type="arduino_delay"><field name="MS">2000</field></block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# DHT Reading MicroPython
from machine import Pin
import dht
import time

sensor = dht.DHT11(Pin(4))
while True:
    sensor.measure()
    print("Suhu:", sensor.temperature(), "C, Kelembaban:", sensor.humidity(), "%")
    time.sleep(2)`
  },
  {
    name: "Adafruit NeoPixel - WS2812B RGB Rainbow Effect",
    board: "Arduino Uno",
    description: "Contoh Adafruit_NeoPixel: Mengendalikan LED strip addressable WS2812B dengan animasi pelangi dinamis dan efek spektrum warna.",
    iconColor: "rose",
    components: ['neopixel', 'rgb'],
    libraryName: "Adafruit_NeoPixel",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: Adafruit NeoPixel WS2812B Rainbow
#include <Adafruit_NeoPixel.h>

#define PIN        6 // Pin data LED terhubung ke Pin 6
#define NUMPIXELS 16 // Jumlah LED WS2812B

Adafruit_NeoPixel pixels(NUMPIXELS, PIN, NEO_GRB + NEO_KHZ800);

void setup() {
  pixels.begin();
  pixels.setBrightness(50); // Batasi kecerahan (0-255) agar hemat daya
}

void loop() {
  // Efek pelangi berputar
  for (long firstPixelHue = 0; firstPixelHue < 5 * 65536; firstPixelHue += 256) {
    for (int i = 0; i < pixels.numPixels(); i++) {
      int pixelHue = firstPixelHue + (i * 65536L / pixels.numPixels());
      pixels.setPixelColor(i, pixels.gamma32(pixels.ColorHSV(pixelHue)));
    }
    pixels.show();
    delay(10);
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="custom_adafruit_neopixel_begin"><field name="PIN">6</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="custom_adafruit_neopixel_call">
        <field name="METHOD">show</field>
        <next>
          <block type="arduino_delay"><field name="MS">100</field></block>
        </next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# NeoPixel MicroPython
from machine import Pin
from neopixel import NeoPixel
import time

np = NeoPixel(Pin(6), 16)
for i in range(16):
    np[i] = (255, 0, 0)
np.write()`
  },
  {
    name: "ArduinoJson - IoT Sensor Serialization",
    board: "ESP32 DevKit V1",
    description: "Contoh ArduinoJson: Membuat struktur data JSON berisi data sensor lingkungan untuk dikirimkan melalui HTTP/MQTT ke cloud server.",
    iconColor: "indigo",
    components: ['json', 'iot'],
    libraryName: "ArduinoJson",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: ArduinoJson Serialization
#include <ArduinoJson.h>

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("ArduinoJson Serialization Example");
}

void loop() {
  // Alokasikan memori dokumen JSON
  StaticJsonDocument<256> doc;

  // Isi data telemetri robot
  doc["device_id"] = "ROBOLAB-ESP32-01";
  doc["temperature"] = 28.5;
  doc["humidity"] = 65.2;
  doc["battery_v"] = 4.12;
  doc["status"] = "OK";

  JsonArray sensors = doc.createNestedArray("readings");
  sensors.add(102);
  sensors.add(204);
  sensors.add(308);

  // Serialisasikan ke string JSON
  char output[256];
  serializeJson(doc, output);

  Serial.print("Payload JSON Terkirim: ");
  Serial.println(output);

  delay(3000);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">115200</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">JSON Telemetry Ready</field></block></value>
        <next><block type="arduino_delay"><field name="MS">3000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# JSON Serialization Python
import ujson
import time

while True:
    data = {"device": "ESP32", "temp": 28.5, "status": "OK"}
    print("JSON:", ujson.dumps(data))
    time.sleep(3)`
  },
  {
    name: "ESP32Servo - Dual Servo PWM Controller",
    board: "ESP32 DevKit V1",
    description: "Contoh ESP32Servo: Mengontrol multi-servo menggunakan hardware timer PWM presisi tinggi pada arsitektur mikrokontroler ESP32.",
    iconColor: "teal",
    components: ['servo', 'esp32'],
    libraryName: "ESP32Servo",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: ESP32Servo Dual Control
#include <ESP32Servo.h>

Servo servoPan;
Servo servoTilt;

int panPin = 18;
int tiltPin = 19;

void setup() {
  Serial.begin(115200);
  
  // Alokasi timer hardware untuk servo ESP32
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);

  servoPan.setPeriodHertz(50);     // Standar servo 50hz
  servoPan.attach(panPin, 500, 2400);

  servoTilt.setPeriodHertz(50);
  servoTilt.attach(tiltPin, 500, 2400);

  Serial.println("Dual Servo ESP32 Berhasil Terpasang!");
}

void loop() {
  // Gerakkan pan & tilt ke sudut 45 derajat
  servoPan.write(45);
  servoTilt.write(45);
  delay(1000);

  // Gerakkan ke sudut 135 derajat
  servoPan.write(135);
  servoTilt.write(135);
  delay(1000);
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="custom_esp32servo_attach_pin"><field name="PIN">18</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="arduino_servo_write">
        <field name="PIN">18</field>
        <value name="ANGLE"><block type="math_number"><field name="NUM">90</field></block></value>
        <next><block type="arduino_delay"><field name="MS">1000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# MicroPython PWM Servo ESP32
from machine import Pin, PWM
import time

pwm = PWM(Pin(18), freq=50)
while True:
    pwm.duty(40) # 0 derajat
    time.sleep(1)
    pwm.duty(115) # 180 derajat
    time.sleep(1)`
  },
  {
    name: "PubSubClient - ESP32 MQTT Telemetry & Switch",
    board: "ESP32 DevKit V1",
    description: "Contoh PubSubClient: Komunikasi IoT dua arah dengan broker MQTT untuk mempublikasikan data sensor dan menerima instruksi saklar LED.",
    iconColor: "emerald",
    components: ['mqtt', 'wifi', 'iot'],
    libraryName: "PubSubClient",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: PubSubClient MQTT Publisher & Subscriber
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "WIFI_SSID_ANDA";
const char* password = "WIFI_PASSWORD_ANDA";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Pesan diterima di topik [");
  Serial.print(topic);
  Serial.print("]: ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke MQTT Broker...");
    if (client.connect("RoboLabClientESP32")) {
      Serial.println("Terhubung!");
      client.subscribe("robolab/control");
    } else {
      Serial.print("Gagal, status=");
      Serial.print(client.state());
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 5000) {
    lastMsg = millis();
    client.publish("robolab/sensors/temp", "26.8");
    Serial.println("Publikasi suhu terkirim ke MQTT!");
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" x="40" y="40">
    <statement name="STACK">
      <block type="serial_begin"><field name="BAUD">115200</field></block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="140">
    <statement name="STACK">
      <block type="serial_print">
        <value name="CONTENT"><block type="text"><field name="TEXT">MQTT Client Loop</field></block></value>
        <next><block type="arduino_delay"><field name="MS">1000</field></block></next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# MicroPython MQTT Client
from umqtt.simple import MQTTClient
import time

c = MQTTClient("robolab_esp32", "broker.hivemq.com")
print("MQTT Ready")`
  },
  {
    name: "NewPing - Precision Ultrasonic Radar",
    board: "Arduino Uno",
    description: "Contoh NewPing: Membaca sensor ultrasonik HC-SR04 dengan filter hardware timer presisi tinggi untuk mengukur jarak benda tanpa delay.",
    iconColor: "sky",
    components: ['ultrasonic'],
    libraryName: "NewPing",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: NewPing Ultrasonic Distance Sensor
#include <NewPing.h>

#define TRIGGER_PIN  12  // Pin Arduino terhubung ke pin Trigger HC-SR04
#define ECHO_PIN     11  // Pin Arduino terhubung ke pin Echo HC-SR04
#define MAX_DISTANCE 200 // Jarak maksimum dalam centimeter (maksimal ~400-500cm)

NewPing sonar(TRIGGER_PIN, ECHO_PIN, MAX_DISTANCE);

void setup() {
  Serial.begin(9600);
  Serial.println("Sensor Jarak Ultrasonik NewPing Aktif!");
}

void loop() {
  delay(50); // Jeda 50ms antar ping (~20 ping per detik)
  
  unsigned int uS = sonar.ping(); // Kirim ping, dapatkan durasi dalam mikrodetik
  unsigned int jarakCm = sonar.convert_cm(uS); // Konversi ke Centimeter

  Serial.print("Jarak Terdeteksi: ");
  Serial.print(jarakCm);
  Serial.println(" cm");
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
          <block type="custom_sonar_call_val"><field name="METHOD">ping_cm</field></block>
        </value>
        <next><block type="arduino_delay"><field name="MS">100</field></block></next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# Ultrasonic MicroPython
import time
import robolab as robot

def loop():
    robot.connect("COM3")
    while True:
        dist = robot.ultrasonic_read(12, 11)
        print("Jarak:", dist, "cm")
        time.sleep(0.1)

if __name__ == '__main__':
    loop()`
  },
  {
    name: "IRremote - Infrared Receiver & Decoder",
    board: "Arduino Uno",
    description: "Contoh IRremote: Menangkap sinyal inframerah dari remote TV/AC melalui sensor receiver VS1838B dan mendekode nilai tombolnya.",
    iconColor: "red",
    components: ['ir', 'remote'],
    libraryName: "IRremote",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: IRremote Infrared Decoder
#include <IRremote.hpp>

const int IR_RECEIVE_PIN = 7;

void setup() {
  Serial.begin(9600);
  Serial.println("IR Receiver Inisialisasi...");
  IrReceiver.begin(IR_RECEIVE_PIN, ENABLE_LED_FEEDBACK);
  Serial.println("Arahkan remote inframerah ke sensor dan tekan tombol!");
}

void loop() {
  if (IrReceiver.decode()) {
    Serial.print("Protokol: ");
    Serial.println(getProtocolString(IrReceiver.decodedIRData.protocol));
    
    Serial.print("Kode Command Hex: 0x");
    Serial.println(IrReceiver.decodedIRData.command, HEX);
    
    IrReceiver.resume(); // Siap menerima sinyal berikutnya
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
        <value name="CONTENT"><block type="text"><field name="TEXT">Menunggu sinyal IR...</field></block></value>
        <next><block type="arduino_delay"><field name="MS">500</field></block></next>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# IR Remote Python
import time
print("IR Receiver Ready")`
  },
  {
    name: "Wire - I2C Bus Address Scanner",
    board: "Arduino Uno",
    description: "Contoh Wire: Memindai seluruh 127 alamat komunikasi bus I2C (SDA/SCL) untuk mendeteksi modul atau sensor yang terhubung ke board.",
    iconColor: "violet",
    components: ['wire', 'i2c'],
    libraryName: "Wire",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: Wire I2C Address Scanner
#include <Wire.h>

void setup() {
  Wire.begin();
  Serial.begin(9600);
  while (!Serial);
  Serial.println("\n--- I2C Scanner Dimulai ---");
}

void loop() {
  byte error, address;
  int nDevices = 0;

  Serial.println("Scanning alamat I2C...");

  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Perangkat I2C ditemukan pada alamat 0x");
      if (address < 16) Serial.print("0");
      Serial.print(address, HEX);
      Serial.println(" !");
      nDevices++;
    }
  }

  if (nDevices == 0)
    Serial.println("Tidak ada perangkat I2C yang terdeteksi.\n");
  else
    Serial.println("Selesai memindai.\n");

  delay(5000); // Tunggu 5 detik untuk pemindaian berikutnya
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
</xml>`,
    py: `# MicroPython I2C Scanner
from machine import Pin, I2C

i2c = I2C(0, scl=Pin(22), sda=Pin(21))
devices = i2c.scan()
print("I2C Devices:", [hex(d) for d in devices])`
  },
  {
    name: "MFRC522v2 - RFID Card Reader & UID Detection",
    board: "Arduino Uno",
    description: "Contoh resmi Arduino_MFRC522v2 (OSSLibraries): Membaca data UID kartu / tag RFID menggunakan modul MFRC522 via SPI dan menampilkannya ke Serial Monitor.",
    iconColor: "cyan",
    components: ['rfid'],
    libraryName: "MFRC522v2",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: MFRC522v2 RFID Card Reader
// Repositori: https://github.com/OSSLibraries/Arduino_MFRC522v2
#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>

#define RST_PIN 9 // Pin Reset MFRC522 (Arduino Uno: Pin 9)

// Inisialisasi pin SS / SDA (Pin 10 pada Arduino Uno)
MFRC522DriverPinSimple ss_pin(10);
MFRC522DriverSPI driver{ss_pin};
MFRC522 mfrc522{driver};

void setup() {
  Serial.begin(115200);
  delay(500); // Tunggu Serial Monitor stabil
  pinMode(RST_PIN, OUTPUT);
  digitalWrite(RST_PIN, LOW);
  delay(10);
  digitalWrite(RST_PIN, HIGH);
  delay(50);
  SPI.begin();
  mfrc522.PCD_Init(); // Inisialisasi modul MFRC522
  mfrc522.PCD_AntennaOn();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  byte mfrcVer = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("MFRC522 Chip Version: 0x"));
  Serial.println(mfrcVer, HEX);
  if (mfrcVer == 0x00 || mfrcVer == 0xFF) {
    Serial.println(F("❌ PERINGATAN: Modul RC522 tidak merespons (0x00/0xFF)! Cek kabel SPI & pin RST/SDA."));
  } else {
    Serial.println(F("✅ Modul RC522 Berhasil Terdeteksi!"));
  }
  Serial.println(F("MFRC522v2 Siap! Tempelkan kartu atau tag RFID ke reader..."));
}

void loop() {
  // Cek apakah ada kartu RFID baru di dekat sensor
  if (mfrc522.PICC_IsNewCardPresent()) {
    // Pilih dan baca salah satu kartu
    if (mfrc522.PICC_ReadCardSerial()) {
      // Tampilkan UID ke Serial Monitor dengan MFRC522Debug
      Serial.print(F("Card UID: "));
      MFRC522Debug::PrintUID(Serial, mfrc522.uid);
      Serial.println();

      // Hentikan komunikasi dengan kartu (PICC) dan matikan enkripsi
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      delay(1000);
    }
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" id="setup" x="40" y="40">
    <statement name="STACK">
      <block type="mfrc522_begin">
        <field name="SS_PIN">10</field>
        <next>
          <block type="arduino_serial_print">
            <value name="TEXT">
              <block type="text">
                <field name="TEXT">MFRC522v2 Siap! Tempelkan kartu RFID...</field>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" id="loop" x="40" y="200">
    <statement name="STACK">
      <block type="controls_if">
        <value name="IF0">
          <block type="mfrc522_is_card"></block>
        </value>
        <statement name="DO0">
          <block type="controls_if">
            <value name="IF0">
              <block type="mfrc522_read_serial"></block>
            </value>
            <statement name="DO0">
              <block type="arduino_serial_print_inline">
                <value name="TEXT">
                  <block type="text">
                    <field name="TEXT">Card UID: </field>
                  </block>
                </value>
                <next>
                  <block type="mfrc522_print_uid">
                    <next>
                      <block type="mfrc522_halt">
                        <next>
                          <block type="arduino_delay">
                            <field name="MS">1000</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# Python / MicroPython MFRC522 RFID Reader
import time
import robolab as robot

def setup():
    robot.connect("COM3")
    robot.mfrc522_begin("10")
    print("MFRC522v2 Siap! Tempelkan kartu RFID...")

def loop():
    while True:
        if robot.mfrc522_is_card():
            if robot.mfrc522_read_serial():
                print("Card UID:", robot.mfrc522_get_uid())
                robot.mfrc522_halt()
                time.sleep(1)
        time.sleep(0.1)

if __name__ == '__main__':
    setup()
    loop()`
  },
  {
    name: "ESP32 MFRC522v2 - RFID Card Reader & Access Control",
    board: "ESP32 DevKit V1",
    description: "Contoh resmi MFRC522v2 untuk ESP32: Membaca data UID kartu / tag RFID menggunakan modul MFRC522 via VSPI (Pin GPIO 5, 18, 23, 19) dan menampilkannya ke Serial Monitor.",
    iconColor: "cyan",
    components: ['rfid'],
    libraryName: "MFRC522v2",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Library Example: ESP32 MFRC522v2 RFID Card Reader
// Repositori: https://github.com/OSSLibraries/Arduino_MFRC522v2
// Board: ESP32 DevKit V1
// Pinout VSPI ESP32:
//   SDA (SS) -> GPIO 5
//   SCK      -> GPIO 18
//   MOSI     -> GPIO 23
//   MISO     -> GPIO 19
//   RST      -> GPIO 22
//   GND      -> GND
//   3.3V     -> 3.3V (PERHATIAN: Jangan hubungkan ke 5V!)
#include <SPI.h>
#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>

#define RST_PIN 22 // Pin Reset MFRC522 (ESP32: GPIO 22)

// Inisialisasi pin SS / SDA (Pin GPIO 5 pada ESP32 DevKit)
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ss_pin};
MFRC522 mfrc522{driver};

void setup() {
  Serial.begin(115200);
  delay(500); // Tunggu Serial Monitor stabil
  pinMode(RST_PIN, OUTPUT);
  digitalWrite(RST_PIN, LOW);
  delay(10);
  digitalWrite(RST_PIN, HIGH);
  delay(50);
  SPI.begin(18, 19, 23); // VSPI pins: SCK=18, MISO=19, MOSI=23
  mfrc522.PCD_Init(); // Inisialisasi modul MFRC522
  mfrc522.PCD_AntennaOn();
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
  byte mfrcVer = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("MFRC522 Chip Version: 0x"));
  Serial.println(mfrcVer, HEX);
  if (mfrcVer == 0x00 || mfrcVer == 0xFF) {
    Serial.println(F("❌ PERINGATAN: Modul RC522 tidak merespons (0x00/0xFF)! Cek kabel SPI & pin RST/SDA."));
  } else {
    Serial.println(F("✅ Modul RC522 Berhasil Terdeteksi!"));
  }
  Serial.println(F("ESP32 MFRC522v2 Siap! Tempelkan kartu atau tag RFID ke reader..."));
}

void loop() {
  // Cek apakah ada kartu RFID baru di dekat sensor
  if (mfrc522.PICC_IsNewCardPresent()) {
    // Pilih dan baca salah satu kartu
    if (mfrc522.PICC_ReadCardSerial()) {
      // Tampilkan UID ke Serial Monitor dengan MFRC522Debug
      Serial.print(F("Card UID: "));
      MFRC522Debug::PrintUID(Serial, mfrc522.uid);
      Serial.println();

      // Hentikan komunikasi dengan kartu (PICC) dan matikan enkripsi
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
      delay(1000);
    }
  }
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" id="setup" x="40" y="40">
    <statement name="STACK">
      <block type="mfrc522_begin">
        <field name="SS_PIN">5</field>
        <next>
          <block type="arduino_serial_print">
            <value name="TEXT">
              <block type="text">
                <field name="TEXT">ESP32 MFRC522v2 Siap! Tempelkan kartu RFID...</field>
              </block>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" id="loop" x="40" y="200">
    <statement name="STACK">
      <block type="controls_if">
        <value name="IF0">
          <block type="mfrc522_is_card"></block>
        </value>
        <statement name="DO0">
          <block type="controls_if">
            <value name="IF0">
              <block type="mfrc522_read_serial"></block>
            </value>
            <statement name="DO0">
              <block type="arduino_serial_print_inline">
                <value name="TEXT">
                  <block type="text">
                    <field name="TEXT">Card UID: </field>
                  </block>
                </value>
                <next>
                  <block type="mfrc522_print_uid">
                    <next>
                      <block type="mfrc522_halt">
                        <next>
                          <block type="arduino_delay">
                            <field name="MS">1000</field>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </next>
              </block>
            </statement>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>`,
    py: `# Python / MicroPython ESP32 MFRC522 RFID Reader
import time
import robolab as robot

def setup():
    robot.connect("COM4")
    robot.mfrc522_begin("5")
    print("ESP32 MFRC522v2 Siap! Tempelkan kartu RFID...")

def loop():
    while True:
        if robot.mfrc522_is_card():
            if robot.mfrc522_read_serial():
                print("Card UID:", robot.mfrc522_get_uid())
                robot.mfrc522_halt()
                time.sleep(1)
        time.sleep(0.1)

if __name__ == '__main__':
    setup()
    loop()`
  },
  {
    name: "ESP32 Blynk IoT - Smart LED & Telemetry Control",
    board: "ESP32 DevKit V1",
    description: "Kontrol LED dan aktuator ESP32 dari jarak jauh secara realtime menggunakan Blynk IoT Cloud (Virtual Pin V0 - V3) via WiFi.",
    iconColor: "emerald",
    components: ['led'],
    libraryName: "Blynk",
    category: "Library Example",
    isLibraryExample: true,
    ino: `// Proyek: ESP32 Blynk IoT Smart LED & Telemetry Control
// Board: ESP32 DevKit V1
// Library: Blynk by Volodymyr Shymanskyy
#define BLYNK_TEMPLATE_ID "TMPL69YI5UWvB"
#define BLYNK_TEMPLATE_NAME "ESP32 Smart LED"
#define BLYNK_AUTH_TOKEN "p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT"

#define BLYNK_PRINT Serial
#include <WiFi.h>
#include <BlynkSimpleEsp32.h>

// Blynk Callback Functions
BLYNK_WRITE(V0) {
  int param_val = param.asInt();
  if (param_val == 1) {
    digitalWrite(2, HIGH);
    Blynk.virtualWrite(V1, "Status: ON");
  } else {
    digitalWrite(2, LOW);
    Blynk.virtualWrite(V1, "Status: OFF");
  }
}

void setup() {
  Serial.begin(115200);
  // Configure I/O pins
  pinMode(2, OUTPUT);

  digitalWrite(2, LOW);
  Blynk.begin(BLYNK_AUTH_TOKEN, "RoboLab-WiFi", "12345678");
}

void loop() {
  Blynk.run();
}`,
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="blynk_config" x="40" y="40">
    <value name="TEMPLATE_ID">
      <shadow type="text"><field name="TEXT">TMPL69YI5UWvB</field></shadow>
    </value>
    <value name="TEMPLATE_NAME">
      <shadow type="text"><field name="TEXT">ESP32 Smart LED</field></shadow>
    </value>
    <value name="AUTH_TOKEN">
      <shadow type="text"><field name="TEXT">p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT</field></shadow>
    </value>
  </block>
  <block type="blynk_on_write" x="40" y="160">
    <field name="VPIN">V0</field>
    <statement name="STACK">
      <block type="controls_if">
        <mutation else="1"/>
        <value name="IF0">
          <block type="robolab_logic_compare">
            <field name="OP">EQ</field>
            <value name="A">
              <block type="blynk_param_as_int"></block>
            </value>
            <value name="B">
              <shadow type="math_number"><field name="NUM">1</field></shadow>
            </value>
          </block>
        </value>
        <statement name="DO0">
          <block type="pin_digital_write">
            <field name="PIN">2</field>
            <field name="STATE">HIGH</field>
            <next>
              <block type="blynk_virtual_write">
                <field name="VPIN">V1</field>
                <value name="VALUE">
                  <block type="text"><field name="TEXT">Status: ON</field></block>
                </value>
              </block>
            </next>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="pin_digital_write">
            <field name="PIN">2</field>
            <field name="STATE">LOW</field>
            <next>
              <block type="blynk_virtual_write">
                <field name="VPIN">V1</field>
                <value name="VALUE">
                  <block type="text"><field name="TEXT">Status: OFF</field></block>
                </value>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
  <block type="arduino_setup" x="40" y="440">
    <statement name="STACK">
      <block type="pin_digital_write">
        <field name="PIN">2</field>
        <field name="STATE">LOW</field>
        <next>
          <block type="blynk_begin">
            <value name="AUTH">
              <shadow type="text"><field name="TEXT">BLYNK_AUTH_TOKEN</field></shadow>
            </value>
            <value name="SSID">
              <shadow type="text"><field name="TEXT">RoboLab-WiFi</field></shadow>
            </value>
            <value name="PASS">
              <shadow type="text"><field name="TEXT">12345678</field></shadow>
            </value>
          </block>
        </next>
      </block>
    </statement>
  </block>
  <block type="arduino_loop" x="40" y="600">
    <statement name="STACK">
      <block type="blynk_run"></block>
    </statement>
  </block>
</xml>`,
    py: `# Python / MicroPython ESP32 Blynk IoT Control
import time
import robolab as robot

def setup():
    robot.connect("COM4")
    robot.blynk_begin("p1QoM5C_nySynOw3gx8tnVhDfmOsZCcT", "RoboLab-WiFi", "12345678")
    print("ESP32 Blynk IoT Terhubung!")

def loop():
    while True:
        robot.blynk_run()
        time.sleep(0.1)

if __name__ == '__main__':
    setup()
    loop()`
  }
];
