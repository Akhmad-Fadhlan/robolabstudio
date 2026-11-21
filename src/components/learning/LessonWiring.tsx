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

type WireRoute = [string, string, string?];
const unoRoutes: Record<number, WireRoute[]> = {
  1: [['D8', 'LED merah anoda', 'Resistor seri'], ['GND', 'LED merah katoda'], ['D9', 'LED hijau anoda', 'Resistor seri'], ['GND', 'LED hijau katoda']],
  2: [['D2', 'Tombol terminal A'], ['GND', 'Tombol terminal B']],
  3: [['5V', 'Potensiometer kaki luar 1'], ['A0', 'Potensiometer kaki tengah'], ['GND', 'Potensiometer kaki luar 2']],
  4: [['D9', 'LED anoda', 'Resistor seri'], ['GND', 'LED katoda']],
  6: [['A4', 'LCD SDA'], ['A5', 'LCD SCL'], ['5V', 'LCD VCC'], ['GND', 'LCD GND']],
  7: [['D2', 'Tombol terminal A'], ['GND', 'Tombol terminal B']],
};
const ledOnGpio2: WireRoute[] = [['GPIO2', 'LED anoda', 'Resistor seri'], ['GND', 'LED katoda']];
const espRoutes: Record<number, WireRoute[]> = {
  0: ledOnGpio2,
  1: ledOnGpio2,
  2: [['3V3', 'Potensiometer kaki luar 1'], ['GPIO34', 'Potensiometer kaki tengah'], ['GND', 'Potensiometer kaki luar 2']],
  3: [['GPIO21', 'OLED SDA'], ['GPIO22', 'OLED SCL'], ['3V3', 'OLED VCC'], ['GND', 'OLED GND']],
  4: [['GPIO12', 'HC-SR04 TRIG'], ['GPIO13', 'HC-SR04 ECHO', 'Pembagi 5 V → 3,3 V'], ['5V', 'HC-SR04 VCC'], ['GND', 'HC-SR04 GND dan GND pembagi']],
  5: [['GPIO2', 'LED 1 anoda', 'Resistor seri'], ['GPIO4', 'LED 2 anoda', 'Resistor seri'], ['GND', 'Katoda LED 1 dan LED 2']],
  6: ledOnGpio2,
  9: ledOnGpio2,
  10: [['GPIO14', 'INMP441 SCK'], ['GPIO15', 'INMP441 WS'], ['GPIO32', 'INMP441 SD'], ['3V3', 'INMP441 VDD'], ['GND', 'INMP441 GND dan L/R'], ...ledOnGpio2],
};

function WiringDiagram({ routes }: { routes: WireRoute[] }) {
  return <figure className="my-3 overflow-hidden rounded-xl border border-slate-300 bg-white p-2 text-slate-800">
    <figcaption className="mb-2 text-xs font-semibold">Pin board dan terminal komponen</figcaption>
    <div className="grid grid-cols-[3.5rem_minmax(2rem,1fr)_minmax(5rem,1fr)] items-center gap-y-2 text-[11px]">
      {routes.map(([pin, terminal, inline]) => {
        const color = pin === 'GND' ? '#475569' : /^(3V3|5V)$/.test(pin) ? '#b91c1c' : '#0369a1';
        return <div className="contents" key={terminal}>
          <span className="rounded-l border px-1 py-1 font-mono font-bold">{pin}</span>
          <span className="relative flex min-h-9 items-center justify-center px-1 text-center">
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-0.5" style={{ backgroundColor: color }} />
            {inline && <span className="relative rounded border border-current bg-white px-1 leading-tight" style={{ color }}>{inline}</span>}
          </span>
          <span className="rounded-r border px-1 py-1">{terminal}</span>
        </div>;
      })}
    </div>
  </figure>;
}

export function LessonWiring({category, index}: {category: 'fundamental' | 'hardware' | 'micropython'; index: number}) {
  if (category === 'fundamental') return null;
  const arduino = category === 'hardware';
  const wiring = (arduino ? uno : esp32)[index];
  if (!wiring) return null;
  const routes = (arduino ? unoRoutes : espRoutes)[index];
  return <section className="rounded-xl border border-[var(--theme-border,#64748b)] p-3">
    <h3 className="text-sm font-bold">Rangkaian untuk kode ini</h3>
    <div className="my-3 flex flex-wrap items-center gap-3">
      <img className="h-24 w-auto max-w-full object-contain" src={arduino ? '/Arduino-Fixed.svg' : '/1666364456Esp32_devkitc_v4.svg'} alt={arduino ? 'Arduino Uno' : 'ESP32 DevKit'} />
      {wiring.images?.map(image => <img key={image} className="h-16 w-auto max-w-full object-contain" src={'/' + image} alt="" />)}
    </div>
    {routes && <WiringDiagram routes={routes} />}
    <ul className="list-disc space-y-1 pl-4 text-sm">{wiring.connections.map(connection => <li key={connection}>{connection}</li>)}</ul>
  </section>;
}
