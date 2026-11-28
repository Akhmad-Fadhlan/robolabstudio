type Wiring = { images?: string[]; connections: string[] };
const uno: Wiring[] = [
  { connections: ['Pin D13 sudah tersambung otomatis ke lampu LED kecil bertanda "L" di papan Arduino Uno. Cukup colokkan kabel USB!'] },
  { images: ['led.png'], connections: ['Pin D8 → Resistor → Kaki panjang (+) LED Merah.', 'Pin D9 → Resistor → Kaki panjang (+) LED Hijau.', 'Kaki pendek (−) kedua LED → Pin GND.'] },
  { images: ['pushButton.png'], connections: ['Satu kaki Tombol → Pin D2, kaki sebelahnya → Pin GND (mode INPUT_PULLUP).', 'Pin D13 → Lampu LED L bawaan board.'] },
  { images: ['potentiometer.png'], connections: ['Kaki kiri & kanan Potensiometer → Pin 5V dan GND.', 'Kaki tengah (Sinyal) → Pin Analog A0.'] },
  { images: ['led.png'], connections: ['Pin PWM ~D9 → Resistor → Kaki panjang (+) LED.', 'Kaki pendek (−) LED → Pin GND.'] },
  { connections: ['Hubungkan Arduino Uno ke komputer dengan kabel USB. Data dikirim lewat jalur USB Serial.'] },
  { images: ['displayLCD16x2I2C.png'], connections: ['Layar LCD I2C: Pin SDA → A4, Pin SCL → A5, Pin VCC → 5V, dan Pin GND → GND.'] },
  { images: ['pushButton.png'], connections: ['Tombol Interupsi dipasang antara Pin D2 (INT0) dan Pin GND.'] },
];
const esp32: Wiring[] = [
  { images: ['led.png'], connections: ['Pin GPIO2 → Resistor → Kaki positif (+) LED. Kaki negatif (−) LED → Pin GND.'] },
  { images: ['led.png'], connections: ['Pin GPIO2 → Resistor → Kaki positif (+) LED untuk uji redup-terang PWM.'] },
  { images: ['potentiometer.png'], connections: ['Kaki tepi Potensiometer → Pin 3V3 dan GND. Kaki tengah → Pin ADC GPIO34.'] },
  { connections: ['Layar OLED SSD1306 I2C: Pin SDA → GPIO21, Pin SCL → GPIO22, Pin VCC → 3V3, Pin GND → GND.'] },
  { images: ['sensorUltrasonicDistance4Pin.png'], connections: ['Sensor Jarak HC-SR04: Pin TRIG → GPIO12, Pin ECHO → GPIO13, Pin VCC → 5V, Pin GND → GND.'] },
  { images: ['led.png'], connections: ['Pin GPIO2 → LED 1, Pin GPIO4 → LED 2 (masing-masing lewat resistor ke GND).'] },
  { images: ['led.png'], connections: ['Pin GPIO2 → LED indikator status server Wi-Fi, Katoda LED → GND.'] },
  { connections: ['Simulasi kendali PID ini berjalan langsung di prosesor tanpa perlu menyambungkan motor fisik.'] },
  { connections: ['Hubungkan ESP32 ke komputer via USB dan sambungkan ke jaringan hotspot Wi-Fi.'] },
  { images: ['led.png'], connections: ['Pin GPIO2 → LED status koneksi AI, Katoda LED → GND.'] },
  { connections: ['Mikrofon Digital INMP441: SCK → GPIO14, WS → GPIO15, SD → GPIO32, VDD → 3V3, GND → GND.'] },
];

type WireRoute = [string, string, string?];
const unoRoutes: Record<number, WireRoute[]> = {
  1: [['D8', 'LED Merah (+)', 'Resistor'], ['GND', 'LED Merah (−)'], ['D9', 'LED Hijau (+)', 'Resistor'], ['GND', 'LED Hijau (−)']],
  2: [['D2', 'Kaki Tombol A'], ['GND', 'Kaki Tombol B']],
  3: [['5V', 'Potensiometer Kiri'], ['A0', 'Potensiometer Tengah'], ['GND', 'Potensiometer Kanan']],
  4: [['D9', 'LED Anoda (+)', 'Resistor'], ['GND', 'LED Katoda (−)']],
  6: [['A4', 'LCD SDA'], ['A5', 'LCD SCL'], ['5V', 'LCD VCC'], ['GND', 'LCD GND']],
  7: [['D2', 'Kaki Tombol A'], ['GND', 'Kaki Tombol B']],
};
const ledOnGpio2: WireRoute[] = [['GPIO2', 'LED Anoda (+)', 'Resistor'], ['GND', 'LED Katoda (−)']];
const espRoutes: Record<number, WireRoute[]> = {
  0: ledOnGpio2,
  1: ledOnGpio2,
  2: [['3V3', 'Potensiometer Kiri'], ['GPIO34', 'Potensiometer Tengah'], ['GND', 'Potensiometer Kanan']],
  3: [['GPIO21', 'OLED SDA'], ['GPIO22', 'OLED SCL'], ['3V3', 'OLED VCC'], ['GND', 'OLED GND']],
  4: [['GPIO12', 'HC-SR04 TRIG'], ['GPIO13', 'HC-SR04 ECHO', '3.3V Level'], ['5V', 'HC-SR04 VCC'], ['GND', 'HC-SR04 GND']],
  5: [['GPIO2', 'LED 1 (+)', 'Resistor'], ['GPIO4', 'LED 2 (+)', 'Resistor'], ['GND', 'Katoda LED 1 & 2']],
  6: ledOnGpio2,
  9: ledOnGpio2,
  10: [['GPIO14', 'INMP441 SCK'], ['GPIO15', 'INMP441 WS'], ['GPIO32', 'INMP441 SD'], ['3V3', 'INMP441 VDD'], ['GND', 'INMP441 GND'], ...ledOnGpio2],
};

function WiringDiagram({
  routes,
  boardImage,
  boardName,
  images,
  isLight,
}: {
  routes: WireRoute[];
  boardImage: string;
  boardName: string;
  images: string[];
  isLight: boolean;
}) {
  return (
    <figure
      className={`my-2.5 overflow-hidden rounded-xl border p-2.5 ${
        isLight
          ? 'border-slate-200 bg-slate-50/80 text-slate-800'
          : 'border-slate-800 bg-slate-950/80 text-slate-100'
      }`}
    >
      <figcaption className="mb-2 text-[11px] font-extrabold flex items-center justify-between">
        <span>🔌 Peta Sambungan Kabel</span>
        <span className="text-[10px] font-semibold opacity-75">{boardName} ↔ Komponen</span>
      </figcaption>
      <div className="grid grid-cols-[4rem_minmax(2rem,1fr)_minmax(5.5rem,1fr)] items-center text-[10.5px]">
        <div
          className={`flex flex-col items-center self-end gap-1 rounded-t-lg border p-1.5 text-center font-bold ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <img src={boardImage} alt="" className="h-14 max-w-full object-contain" />
          <span>{boardName}</span>
        </div>
        <div />
        <div
          className={`flex flex-wrap items-center justify-center gap-1 self-end rounded-t-lg border p-1.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {images.map((image) => (
            <img key={image} src={'/' + image} alt="" className="h-11 max-w-full object-contain" />
          ))}
          <span className="w-full text-center font-bold">Komponen</span>
        </div>
        {routes.map(([pin, terminal, inline]) => {
          const color =
            pin === 'GND' ? '#64748b' : /^(3V3|5V)$/.test(pin) ? '#ef4444' : 'var(--accent-primary)';
          return (
            <div className="contents" key={terminal}>
              <span
                className={`relative self-stretch border-x border-b px-1.5 py-2 font-mono font-extrabold flex items-center ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                {pin}
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-1/2 z-10 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/40"
                  style={{ backgroundColor: color }}
                />
              </span>
              <span className="relative flex min-h-9 items-center justify-center px-1 text-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 h-0.5"
                  style={{ backgroundColor: color }}
                />
                {inline && (
                  <span
                    className={`relative rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold leading-tight ${
                      isLight ? 'bg-white' : 'bg-slate-900'
                    }`}
                    style={{ color, borderColor: color }}
                  >
                    {inline}
                  </span>
                )}
              </span>
              <span
                className={`relative self-stretch border-x border-b px-2 py-2 font-semibold flex items-center ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/40"
                  style={{ backgroundColor: color }}
                />
                {terminal}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

export function LessonWiring({
  category,
  index,
  themeMode = 'dark',
}: {
  category: 'fundamental' | 'hardware' | 'micropython';
  index: number;
  themeMode?: 'light' | 'dark';
}) {
  if (category === 'fundamental') return null;
  const isLight = themeMode === 'light';
  const arduino = category === 'hardware';
  const wiring = (arduino ? uno : esp32)[index];
  if (!wiring) return null;
  const routes = (arduino ? unoRoutes : espRoutes)[index];
  return (
    <section
      className={`rounded-2xl border p-3.5 transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/60 border-slate-800 text-slate-100'
      }`}
      style={{
        borderColor: isLight ? 'rgba(var(--accent-rgb), 0.25)' : 'rgba(var(--accent-rgb), 0.3)',
      }}
    >
      <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-primary)' }}>
        <span>🔧</span>
        <span>Cara Merakit Rangkaian</span>
      </h3>
      {routes && (
        <WiringDiagram
          routes={routes}
          images={wiring.images || []}
          boardImage={arduino ? '/Arduino-Fixed.svg' : '/1666364456Esp32_devkitc_v4.svg'}
          boardName={arduino ? 'Uno' : 'ESP32'}
          isLight={isLight}
        />
      )}
      <ul className={`mt-2 space-y-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
        {wiring.connections.map((connection) => (
          <li key={connection} className="flex items-start gap-2 leading-relaxed">
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--accent-primary)' }}>●</span>
            <span>{connection}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
