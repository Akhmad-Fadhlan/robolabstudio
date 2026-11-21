type Wiring = { images?: string[]; connections: string[] };
const uno: Wiring[] = [
  { connections: ['D13 → LED L bawaan. Hubungkan Uno ke komputer lewat USB.'] },
  { images: ['led.png'], connections: ['D8 → resistor → anoda LED merah.', 'D9 → resistor → anoda LED hijau.', 'Kedua katoda LED → GND.'] },
  { images: ['pushButton.png'], connections: ['Tombol di antara D2 dan GND. Gunakan INPUT_PULLUP.', 'D13 → LED L bawaan.'] },
  { images: ['potentiometer.png'], connections: ['Kaki luar potensiometer → 5V dan GND.', 'Kaki tengah → A0.'] },
  { images: ['led.png'], connections: ['D9 → resistor → anoda LED.', 'Katoda LED → GND.'] },
  { connections: ['Hubungkan Uno ke komputer lewat USB. Serial memakai LED L pada D13.'] },
  { images: ['displayLCD16x2I2C.png'], connections: ['LCD I2C 5 V: SDA → A4, SCL → A5, VCC → 5V, GND → GND.'] },
  { images: ['pushButton.png'], connections: ['Tombol di antara D2 dan GND. Gunakan INPUT_PULLUP.', 'D13 → LED L bawaan.'] },
];
const esp32: Wiring[] = [
  { images: ['led.png'], connections: ['GPIO2 → resistor → anoda LED eksternal. Jika board memiliki LED bawaan di GPIO2, LED itu juga dapat dipakai. Katoda LED → GND.'] },
  { images: ['led.png'], connections: ['GPIO2 → resistor → anoda LED eksternal. Jika board memiliki LED bawaan di GPIO2, LED itu juga dapat dipakai. Katoda LED → GND.'] },
  { images: ['potentiometer.png'], connections: ['Kaki luar potensiometer → 3V3 dan GND. Kaki tengah → GPIO34.'] },
  { connections: ['OLED SSD1306 I2C: SDA → GPIO21, SCL → GPIO22, VCC → 3V3, GND → GND.'] },
  { images: ['sensorUltrasonicDistance4Pin.png'], connections: ['TRIG → GPIO12. ECHO → GPIO13 melalui pembagi tegangan 5 V ke 3,3 V. VCC → 5V, GND → GND bersama.'] },
  { images: ['led.png'], connections: ['GPIO2 dan GPIO4 → masing-masing resistor dan anoda LED. Sambungkan kedua katoda ke GND.'] },
  { images: ['led.png'], connections: ['GPIO2 → resistor → anoda LED eksternal. Jika board memiliki LED bawaan di GPIO2, LED itu juga dapat dipakai. Katoda LED → GND.'] },
  { connections: ['Contoh ini memakai nilai posisi buatan di kode. Tidak perlu menyambungkan motor.'] },
  { connections: ['Hubungkan ESP32 lewat USB dan gunakan jaringan WiFi.'] },
  { images: ['led.png'], connections: ['GPIO2 → resistor → anoda LED eksternal. Jika board memiliki LED bawaan di GPIO2, LED itu juga dapat dipakai. Katoda LED → GND.'] },
  { connections: ['INMP441: SCK → GPIO14, WS → GPIO15, SD → GPIO32, VDD → 3V3, GND dan L/R → GND. Gunakan tombol BOOT bawaan pada GPIO0.'] },
];

export function LessonWiring({category, index}: {category: 'fundamental' | 'hardware' | 'micropython'; index: number}) {
  if (category === 'fundamental') return null;
  const arduino = category === 'hardware';
  const wiring = (arduino ? uno : esp32)[index];
  if (!wiring) return null;
  return <section className="rounded-xl border border-[var(--theme-border,#64748b)] p-3">
    <h3 className="text-sm font-bold">Rangkaian untuk kode ini</h3>
    <div className="my-3 flex flex-wrap items-center gap-3">
      <img className="h-24 w-auto max-w-full object-contain" src={arduino ? '/Arduino-Fixed.svg' : '/1666364456Esp32_devkitc_v4.svg'} alt={arduino ? 'Arduino Uno' : 'ESP32 DevKit'} />
      {wiring.images?.map(image => <img key={image} className="h-16 w-auto max-w-full object-contain" src={'/' + image} alt="" />)}
    </div>
    <ul className="list-disc space-y-1 pl-4 text-sm">{wiring.connections.map(connection => <li key={connection}>{connection}</li>)}</ul>
  </section>;
}
