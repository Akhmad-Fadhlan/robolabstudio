import React, { useState } from 'react';

type Wiring = { images?: string[]; connections: string[] };

const uno: Wiring[] = [
  {
    connections: [
      'Pin D13 sudah tersambung internal ke lampu LED kecil bertanda "L" di papan Arduino Uno.',
      'Colokkan kabel USB Data dari komputer ke port USB-B Arduino Uno untuk memberi daya 5V & jalur Serial.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin D8 → Resistor 220Ω → Kaki panjang (Anoda +) LED Merah.',
      'Pin D9 → Resistor 220Ω → Kaki panjang (Anoda +) LED Hijau.',
      'Kaki pendek (Katoda −) kedua LED → Jalur Pin GND Arduino Uno.',
    ],
  },
  {
    images: ['pushButton.png'],
    connections: [
      'Terminal A Tombol Tekan → Pin Digital D2 (menggunakan resistor internal INPUT_PULLUP).',
      'Terminal B Tombol Tekan (sisi seberang) → Pin GND Arduino Uno.',
      'Pin D13 → Lampu LED "L" bawaan board sebagai indikator.',
    ],
  },
  {
    images: ['potentiometer.png'],
    connections: [
      'Kaki Kiri (VCC) Potensiometer 10kΩ → Pin 5V Arduino Uno.',
      'Kaki Tengah (Wiper / Sinyal) Potensiometer → Pin Analog A0.',
      'Kaki Kanan (GND) Potensiometer → Pin GND Arduino Uno.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin PWM ~D9 → Resistor 220Ω → Kaki panjang (Anoda +) LED.',
      'Kaki pendek (Katoda −) LED → Pin GND Arduino Uno.',
    ],
  },
  {
    connections: [
      'Hubungkan Arduino Uno ke komputer dengan kabel USB Data.',
      'Jalur TX (D1) & RX (D0) terhubung otomatis ke chip USB-Serial menuju Serial Monitor komputer.',
    ],
  },
  {
    images: ['displayLCD16x2I2C.png'],
    connections: [
      'Modul Layar LCD 16x2 I2C: Pin VCC → Pin 5V Arduino Uno.',
      'Pin GND LCD → Pin GND Arduino Uno.',
      'Pin SDA LCD → Pin A4 (SDA) Arduino Uno.',
      'Pin SCL LCD → Pin A5 (SCL) Arduino Uno.',
    ],
  },
  {
    images: ['pushButton.png'],
    connections: [
      'Terminal A Tombol Interupsi → Pin D2 (INT0) Arduino Uno.',
      'Terminal B Tombol Interupsi → Pin GND Arduino Uno.',
      'Pin D13 → LED indikator status ISR.',
    ],
  },
];

const esp32: Wiring[] = [
  {
    images: ['led.png'],
    connections: [
      'Pin GPIO2 → Resistor 220Ω → Kaki panjang (Anoda +) LED.',
      'Kaki pendek (Katoda −) LED → Pin GND ESP32.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin PWM GPIO2 → Resistor 220Ω → Kaki panjang (Anoda +) LED untuk uji redup-terang PWM.',
      'Kaki pendek (Katoda −) LED → Pin GND ESP32.',
    ],
  },
  {
    images: ['potentiometer.png'],
    connections: [
      'Kaki Kiri (VCC) Potensiometer → Pin 3V3 ESP32.',
      'Kaki Tengah (Wiper) Potensiometer → Pin ADC GPIO34 ESP32.',
      'Kaki Kanan (GND) Potensiometer → Pin GND ESP32.',
    ],
  },
  {
    connections: [
      'Layar OLED SSD1306 I2C (0x3C): Pin VCC → 3V3, Pin GND → GND.',
      'Pin SCL OLED → GPIO22 ESP32, Pin SDA OLED → GPIO21 ESP32.',
    ],
  },
  {
    images: ['sensorUltrasonicDistance4Pin.png'],
    connections: [
      'Sensor Ultrasonik HC-SR04: Pin VCC → 5V (VIN), Pin GND → GND ESP32.',
      'Pin TRIG → GPIO12 ESP32, Pin ECHO → GPIO13 ESP32 (lewat pembagi tegangan 3.3V).',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin GPIO2 → Resistor 220Ω → Anoda (+) LED 1 (Kedip Cepat).',
      'Pin GPIO4 → Resistor 220Ω → Anoda (+) LED 2 (Kedip Lambat).',
      'Katoda (−) LED 1 & LED 2 → Jalur Pin GND ESP32.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin GPIO2 → Resistor 220Ω → Anoda (+) LED indikator Web Server Wi-Fi.',
      'Katoda (−) LED → Pin GND ESP32.',
    ],
  },
  {
    connections: [
      'Simulasi kendali loop PID berjalan di prosesor ESP32 dan mengendalikan sinyal PWM GPIO5 ke driver motor.',
    ],
  },
  {
    connections: [
      'Hubungkan ESP32 ke komputer via USB & jaringan Wi-Fi untuk komunikasi dua arah WebSocket Client/Server.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Pin GPIO2 → Resistor 220Ω → Anoda (+) LED yang dikendalikan suara via Gemini AI.',
      'Katoda (−) LED → Pin GND ESP32.',
    ],
  },
  {
    images: ['led.png'],
    connections: [
      'Mikrofon Digital I2S INMP441: VDD → 3V3, GND & L/R → GND ESP32.',
      'Pin SCK → GPIO14, Pin WS → GPIO15, Pin SD → GPIO32 ESP32.',
      'Pin GPIO2 → Resistor 220Ω → LED status respons AI, Tombol BOOT → GPIO0.',
    ],
  },
];

type WireRoute = [string, string, string?];

const unoRoutes: Record<number, WireRoute[]> = {
  0: [
    ['USB 5V', 'Port USB-B Uno'],
    ['D13', 'LED Onboard "L" (+)', 'Internal R'],
    ['GND', 'LED Onboard "L" (−)'],
  ],
  1: [
    ['D8', 'Anoda (+) LED Merah', '220 Ω'],
    ['D9', 'Anoda (+) LED Hijau', '220 Ω'],
    ['GND', 'Katoda (−) LED Merah & Hijau'],
  ],
  2: [
    ['D2', 'Terminal A Push Button', 'PULLUP'],
    ['GND', 'Terminal B Push Button'],
    ['D13', 'LED Indikator Onboard'],
  ],
  3: [
    ['5V', 'Kaki Kiri Potensiometer (VCC)'],
    ['A0', 'Kaki Tengah Potensiometer (Wiper)'],
    ['GND', 'Kaki Kanan Potensiometer (GND)'],
  ],
  4: [
    ['~D9', 'Anoda (+) LED Dimmer', '220 Ω'],
    ['GND', 'Katoda (−) LED Dimmer'],
  ],
  5: [
    ['D1 (TX)', 'USB-Serial RX Komputer'],
    ['D0 (RX)', 'USB-Serial TX Komputer'],
    ['GND', 'Ground Referensi USB'],
  ],
  6: [
    ['5V', 'LCD 16x2 I2C (VCC)'],
    ['GND', 'LCD 16x2 I2C (GND)'],
    ['A4 (SDA)', 'LCD 16x2 I2C (SDA)'],
    ['A5 (SCL)', 'LCD 16x2 I2C (SCL)'],
  ],
  7: [
    ['D2 (INT0)', 'Terminal A Tombol Interupsi'],
    ['GND', 'Terminal B Tombol Interupsi'],
    ['D13', 'LED Status Interupsi'],
  ],
};

const ledOnGpio2: WireRoute[] = [
  ['GPIO2', 'Anoda (+) LED', '220 Ω'],
  ['GND', 'Katoda (−) LED'],
];

const espRoutes: Record<number, WireRoute[]> = {
  0: ledOnGpio2,
  1: [
    ['GPIO2 (PWM)', 'Anoda (+) LED', '220 Ω'],
    ['GND', 'Katoda (−) LED'],
  ],
  2: [
    ['3V3', 'Kaki Kiri Potensiometer (VCC)'],
    ['GPIO34', 'Kaki Tengah Potensiometer (ADC)'],
    ['GND', 'Kaki Kanan Potensiometer (GND)'],
  ],
  3: [
    ['3V3', 'OLED SSD1306 (VCC)'],
    ['GND', 'OLED SSD1306 (GND)'],
    ['GPIO22', 'OLED SSD1306 (SCL)'],
    ['GPIO21', 'OLED SSD1306 (SDA)'],
  ],
  4: [
    ['5V', 'HC-SR04 (VCC)'],
    ['GPIO12', 'HC-SR04 (TRIG)'],
    ['GPIO13', 'HC-SR04 (ECHO)', 'Level 3.3V'],
    ['GND', 'HC-SR04 (GND)'],
  ],
  5: [
    ['GPIO2', 'Anoda (+) LED 1 Cepat', '220 Ω'],
    ['GPIO4', 'Anoda (+) LED 2 Lambat', '220 Ω'],
    ['GND', 'Katoda (−) LED 1 & LED 2'],
  ],
  6: [
    ['GPIO2', 'Anoda (+) LED Server', '220 Ω'],
    ['GND', 'Katoda (−) LED Server'],
    ['Wi-Fi STA', 'Router / Browser Client (Port 80)'],
  ],
  7: [
    ['GPIO5 (PWM)', 'Input Driver Motor (PWM)'],
    ['GPIO34 (ADC)', 'Sensor Feedback Posisi'],
    ['GND', 'Common Ground Sistem'],
  ],
  8: [
    ['Wi-Fi STA', 'WebSocket Server (ws://:80/ws)'],
    ['GPIO2', 'LED Status Koneksi'],
  ],
  9: [
    ['Wi-Fi + WS', 'Browser Voice & Gemini AI'],
    ['GPIO2', 'Anoda (+) LED Kontrol Suara', '220 Ω'],
    ['GND', 'Katoda (−) LED Kontrol Suara'],
  ],
  10: [
    ['3V3', 'INMP441 (VDD)'],
    ['GPIO14', 'INMP441 (SCK / BCLK)'],
    ['GPIO15', 'INMP441 (WS / LRCLK)'],
    ['GPIO32', 'INMP441 (SD / DOUT)'],
    ['GPIO2', 'Anoda (+) LED Respons AI', '220 Ω'],
    ['GND', 'INMP441 (GND & L/R) + Katoda LED'],
  ],
};

/**
 * Renders a realistic inline 4-band axial resistor on the wire path
 */
function SvgResistor({ x, y, label = '220Ω' }: { x: number; y: number; label?: string }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Lead wires */}
      <line x1="-22" y1="0" x2="-13" y2="0" stroke="#94a3b8" strokeWidth="2.2" />
      <line x1="13" y1="0" x2="22" y2="0" stroke="#94a3b8" strokeWidth="2.2" />
      {/* Ceramic beige body */}
      <rect x="-13" y="-5.5" width="26" height="11" rx="3.5" fill="#e6c28b" stroke="#855b35" strokeWidth="1.2" />
      {/* Color bands: Red - Red - Brown - Gold (220 Ohm) */}
      <rect x="-8.5" y="-5" width="2.5" height="10" fill="#ef4444" />
      <rect x="-3.5" y="-5" width="2.5" height="10" fill="#ef4444" />
      <rect x="1.5" y="-5" width="2.5" height="10" fill="#78350f" />
      <rect x="7" y="-5" width="2.2" height="10" fill="#eab308" />
      <text x="0" y="-8.5" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#f59e0b" fontFamily="monospace">
        {label}
      </text>
    </g>
  );
}

/**
 * Renders a realistic LED with glowing dome and clear Anode (+) / Cathode (-) legs
 */
function SvgLed({
  x,
  y,
  color = '#ef4444',
  glowColor = 'rgba(239,68,68,0.45)',
  label = 'LED',
  anodePin = { x: 0, y: 0 },
  cathodePin = { x: 0, y: 0 },
}: {
  x: number;
  y: number;
  color?: string;
  glowColor?: string;
  label?: string;
  anodePin?: { x: number; y: number };
  cathodePin?: { x: number; y: number };
}) {
  void anodePin;
  void cathodePin;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer glow */}
      <circle cx="0" cy="-10" r="17" fill={glowColor} />
      {/* Metal legs: Left = Anode (+, bent/longer), Right = Cathode (-, straight) */}
      <path d="M -6 6 L -6 22" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 6 6 L 6 22" stroke="#94a3b8" strokeWidth="2.4" strokeLinecap="round" />
      {/* Terminal solder pads at leg tips */}
      <circle cx="-6" cy="22" r="3.2" fill={color} stroke="#ffffff" strokeWidth="1.2" />
      <circle cx="6" cy="22" r="3.2" fill="#475569" stroke="#ffffff" strokeWidth="1.2" />
      {/* LED Rim & Dome */}
      <path
        d="M -11 6 L -11 -8 A 11 11 0 0 1 11 -8 L 11 6 Z"
        fill={color}
        stroke="#ffffff"
        strokeOpacity="0.65"
        strokeWidth="1.2"
      />
      <rect x="-12.5" y="3.5" width="25" height="3.5" rx="1.5" fill={color} stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" />
      {/* Specular reflection highlight */}
      <ellipse cx="-4" cy="-10" rx="3" ry="5.5" transform="rotate(-15 -4 -10)" fill="#ffffff" fillOpacity="0.55" />
      {/* Labels */}
      <text x="-11" y="19" textAnchor="end" fontSize="7.5" fontWeight="900" fill={color} fontFamily="monospace">
        +
      </text>
      <text x="11" y="19" textAnchor="start" fontSize="7.5" fontWeight="900" fill="#94a3b8" fontFamily="monospace">
        −
      </text>
      <text x="0" y="-24" textAnchor="middle" fontSize="8" fontWeight="800" fill={color}>
        {label}
      </text>
    </g>
  );
}

/**
 * Interactive SVG Circuit Schematic where every pin on the Arduino Uno / ESP32 board
 * is physically connected via continuous color-coded jumper wires to the actual component terminals.
 */
function ConnectedCircuitCanvas({
  arduino,
  index,
  isLight,
}: {
  arduino: boolean;
  index: number;
  isLight: boolean;
}) {
  const [hoveredWire, setHoveredWire] = useState<string | null>(null);

  const wireStroke = (id: string, baseWidth = 2.6) =>
    hoveredWire === id ? baseWidth + 1.4 : baseWidth;
  const wireOpacity = (id: string) =>
    hoveredWire && hoveredWire !== id ? 0.35 : 1;

  // Render realistic Arduino Uno R3 left board block (x: 12..136, y: 18..202)
  const renderUnoBoard = (activePins: Array<{ id: string; y: number; color: string; side?: 'right' | 'left' }>) => (
    <g>
      {/* PCB Base */}
      <rect
        x="14"
        y="22"
        width="120"
        height="176"
        rx="10"
        fill="#008184"
        stroke="#005f61"
        strokeWidth="2"
      />
      {/* Inner PCB Silkscreen frame */}
      <rect
        x="19"
        y="27"
        width="110"
        height="166"
        rx="7"
        fill="none"
        stroke="#2dd4bf"
        strokeOpacity="0.3"
        strokeWidth="1"
      />
      {/* Silver USB-B Port */}
      <rect x="6" y="42" width="22" height="28" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
      <rect x="10" y="47" width="14" height="18" rx="1.5" fill="#94a3b8" />
      {/* Black DC Barrel Jack */}
      <rect x="8" y="148" width="24" height="24" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
      {/* ATmega328P DIP IC Chip */}
      <rect x="44" y="88" width="42" height="72" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
      {[0, 1, 2, 3, 4, 5, 6].map((p) => (
        <g key={p}>
          <rect x="40" y={94 + p * 9} width="4" height="4" fill="#cbd5e1" />
          <rect x="86" y={94 + p * 9} width="4" height="4" fill="#cbd5e1" />
        </g>
      ))}
      <text x="65" y="127" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace" transform="rotate(-90 65 127)">
        ATMEGA328P
      </text>
      {/* Arduino Uno Title & Infinity Mark */}
      <text x="64" y="44" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#ffffff" fontFamily="sans-serif">
        ARDUINO
      </text>
      <text x="64" y="55" textAnchor="middle" fontSize="8" fontWeight="800" fill="#a7f3d0" fontFamily="monospace">
        UNO R3
      </text>
      {/* Onboard LED "L" (D13) & ON LED */}
      <circle cx="64" cy="70" r="4" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" />
      <text x="72" y="72.5" fontSize="6.5" fontWeight="800" fill="#fde68a" fontFamily="monospace">
        L (D13)
      </text>
      {/* Right Female Pin Header Strip */}
      <rect x="116" y="34" width="14" height="154" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      {/* Active Pin Terminals on Right Header */}
      {activePins.map((pin) => {
        const px = pin.side === 'left' ? 14 : 130;
        return (
          <g key={pin.id}>
            <rect
              x={pin.side === 'left' ? 16 : 86}
              y={pin.y - 6.5}
              width={pin.side === 'left' ? 36 : 42}
              height="13"
              rx="3"
              fill="#042f2e"
              stroke={pin.color}
              strokeWidth="1"
            />
            <text
              x={pin.side === 'left' ? 34 : 107}
              y={pin.y + 3}
              textAnchor="middle"
              fontSize="7.5"
              fontWeight="900"
              fill="#ffffff"
              fontFamily="monospace"
            >
              {pin.id}
            </text>
            <circle cx={px} cy={pin.y} r="3.8" fill={pin.color} stroke="#ffffff" strokeWidth="1.3" />
          </g>
        );
      })}
    </g>
  );

  // Render realistic ESP32 DevKit V1 left board block (x: 12..136, y: 18..202)
  const renderEsp32Board = (activePins: Array<{ id: string; y: number; color: string }>) => (
    <g>
      {/* Dark Matte PCB Base */}
      <rect
        x="14"
        y="20"
        width="120"
        height="180"
        rx="9"
        fill="#18181b"
        stroke="#3f3f46"
        strokeWidth="2"
      />
      {/* Gold Antenna meanders at top */}
      <path
        d="M 42 28 H 96 M 42 32 H 86"
        stroke="#eab308"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* ESP-WROOM-32 Silver RF Shield Can */}
      <rect
        x="34"
        y="38"
        width="72"
        height="54"
        rx="4"
        fill="#d4d4d8"
        stroke="#71717a"
        strokeWidth="1.5"
      />
      <text x="70" y="63" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#18181b" fontFamily="monospace">
        ESP-WROOM-32
      </text>
      <text x="70" y="75" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#3f3f46" fontFamily="monospace">
        Wi-Fi + BLE
      </text>
      {/* Micro-USB Port at bottom */}
      <rect x="54" y="191" width="32" height="12" rx="2.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
      {/* Onboard Blue GPIO2 LED & Red PWR LED */}
      <circle cx="48" cy="180" r="3.2" fill="#ef4444" />
      <text x="48" y="173" textAnchor="middle" fontSize="5.5" fill="#fca5a5" fontFamily="monospace">
        PWR
      </text>
      <circle cx="92" cy="180" r="3.5" fill="#38bdf8" stroke="#bae6fd" strokeWidth="0.8" />
      <text x="92" y="173" textAnchor="middle" fontSize="5.5" fill="#7dd3fc" fontFamily="monospace">
        D2
      </text>
      {/* Left & Right Gold Header Strips */}
      <rect x="18" y="34" width="10" height="154" rx="2" fill="#27272a" />
      <rect x="118" y="34" width="12" height="154" rx="2" fill="#27272a" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <circle key={i} cx="23" cy={42 + i * 15} r="2" fill="#eab308" />
      ))}
      {/* Active Pin Terminals on Right Header */}
      {activePins.map((pin) => (
        <g key={pin.id}>
          <rect
            x="78"
            y={pin.y - 6.5}
            width="46"
            height="13"
            rx="3"
            fill="#090d16"
            stroke={pin.color}
            strokeWidth="1.1"
          />
          <text
            x="101"
            y={pin.y + 3}
            textAnchor="middle"
            fontSize="7.2"
            fontWeight="900"
            fill="#ffffff"
            fontFamily="monospace"
          >
            {pin.id}
          </text>
          <circle cx="130" cy={pin.y} r="3.8" fill={pin.color} stroke="#ffffff" strokeWidth="1.3" />
        </g>
      ))}
    </g>
  );

  // Choose scene based on track (Arduino Uno vs ESP32) and lesson index
  const renderScene = () => {
    if (arduino) {
      switch (index) {
        case 0: // Lesson 1: Onboard D13 LED & USB Power
          return (
            <>
              {renderUnoBoard([
                { id: 'D13', y: 70, color: '#f59e0b' },
                { id: '5V', y: 120, color: '#ef4444' },
                { id: 'GND', y: 160, color: '#64748b' },
              ])}
              {/* Laptop / PC USB Host on Right */}
              <g transform="translate(215, 36)">
                <rect x="0" y="0" width="96" height="64" rx="7" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.8" />
                <rect x="6" y="6" width="84" height="46" rx="4" fill="#0f172a" />
                <text x="48" y="24" textAnchor="middle" fontSize="8" fontWeight="900" fill="#38bdf8" fontFamily="monospace">
                  PC / LAPTOP
                </text>
                <text x="48" y="37" textAnchor="middle" fontSize="7" fontWeight="700" fill="#34d399" fontFamily="monospace">
                  USB Serial 9600
                </text>
                <rect x="-10" y="18" width="10" height="14" rx="2" fill="#94a3b8" />
              </g>
              {/* USB Cable connecting Laptop to Uno USB Port */}
              <path
                d="M 205 61 C 175 61, 175 12, 70 12 C 20 12, -2 25, 6 56"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Zoomed Onboard D13 Circuit Callout */}
              <g transform="translate(200, 122)">
                <rect x="0" y="0" width="118" height="72" rx="9" fill={isLight ? '#ffffff' : '#0f172a'} stroke="#f59e0b" strokeWidth="1.5" />
                <text x="59" y="14" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#f59e0b">
                  JALUR INTERNAL PIN D13
                </text>
                <SvgResistor x={36} y={36} label="1kΩ" />
                <circle cx="88" cy="36" r="10" fill="rgba(245,158,11,0.35)" />
                <circle cx="88" cy="36" r="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
                <text x="88" y="55" textAnchor="middle" fontSize="7" fontWeight="800" fill="#f59e0b" fontFamily="monospace">
                  LED "L"
                </text>
              </g>
              {/* Wires from D13 & GND to Callout */}
              <path
                d="M 130 70 C 165 70, 165 158, 214 158"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <path
                d="M 130 160 C 170 160, 260 185, 288 158 L 288 144"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
              />
              <line x1="258" y1="158" x2="282" y2="158" stroke="#f59e0b" strokeWidth="2.5" />
            </>
          );

        case 1: // Lesson 2: Dual LED (Red on D8, Green on D9) with 220Ω Resistors & Common GND
          return (
            <>
              {renderUnoBoard([
                { id: 'D8', y: 62, color: '#ef4444' },
                { id: 'D9', y: 112, color: '#10b981' },
                { id: 'GND', y: 168, color: '#64748b' },
              ])}
              {/* Wire 1: Pin D8 -> Resistor 220Ω -> Red LED Anode (+) */}
              <g
                onMouseEnter={() => setHoveredWire('d8')}
                onMouseLeave={() => setHoveredWire(null)}
                opacity={wireOpacity('d8')}
              >
                <path
                  d="M 130 62 H 168 M 212 62 H 238 V 74"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={wireStroke('d8')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <SvgResistor x={190} y={62} label="220Ω" />
              </g>
              {/* Wire 2: Pin D9 -> Resistor 220Ω -> Green LED Anode (+) */}
              <g
                onMouseEnter={() => setHoveredWire('d9')}
                onMouseLeave={() => setHoveredWire(null)}
                opacity={wireOpacity('d9')}
              >
                <path
                  d="M 130 112 H 168 M 212 112 H 292 V 74"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={wireStroke('d9')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <SvgResistor x={190} y={112} label="220Ω" />
              </g>
              {/* Wire 3: Common GND -> Both LED Cathodes (-) */}
              <g
                onMouseEnter={() => setHoveredWire('gnd')}
                onMouseLeave={() => setHoveredWire(null)}
                opacity={wireOpacity('gnd')}
              >
                <path
                  d="M 130 168 H 304 V 74 M 250 168 V 74"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth={wireStroke('gnd')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="250" cy="168" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
                <text x="220" y="182" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace">
                  Jalur Common GND (0V)
                </text>
              </g>
              {/* Red LED & Green LED components */}
              <SvgLed x={244} y={52} color="#ef4444" glowColor="rgba(239,68,68,0.4)" label="LED MERAH" />
              <SvgLed x={298} y={52} color="#10b981" glowColor="rgba(16,185,129,0.4)" label="LED HIJAU" />
            </>
          );

        case 2: // Lesson 3: Push Button INPUT_PULLUP (D2 & GND) + Onboard LED D13
        case 7: // Lesson 8: Hardware Interrupt Push Button (D2 INT0 & GND)
          return (
            <>
              {renderUnoBoard([
                { id: 'D13', y: 58, color: '#f59e0b' },
                { id: index === 7 ? 'D2 INT0' : 'D2', y: 108, color: '#38bdf8' },
                { id: 'GND', y: 162, color: '#64748b' },
              ])}
              {/* Tactile Push Button Module on Right */}
              <g transform="translate(232, 88)">
                {/* Outer housing */}
                <rect x="0" y="0" width="68" height="68" rx="10" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
                {/* 4 corner metal pins */}
                <rect x="-8" y="12" width="8" height="6" rx="1" fill="#cbd5e1" />
                <rect x="-8" y="50" width="8" height="6" rx="1" fill="#cbd5e1" />
                <rect x="68" y="12" width="8" height="6" rx="1" fill="#cbd5e1" />
                <rect x="68" y="50" width="8" height="6" rx="1" fill="#cbd5e1" />
                {/* Inner plate & red tactile plunger */}
                <rect x="10" y="10" width="48" height="48" rx="8" fill="#1e293b" />
                <circle cx="34" cy="34" r="17" fill="#ef4444" stroke="#fecaca" strokeWidth="1.5" />
                <circle cx="30" cy="30" r="5" fill="#ffffff" fillOpacity="0.35" />
                <text x="34" y="-8" textAnchor="middle" fontSize="8" fontWeight="900" fill="#38bdf8">
                  PUSH BUTTON
                </text>
                <text x="34" y="82" textAnchor="middle" fontSize="7" fontWeight="800" fill="#94a3b8" fontFamily="monospace">
                  {index === 7 ? 'Trigger FALLING' : 'Mode INPUT_PULLUP'}
                </text>
              </g>
              {/* Wire D2 -> Button Terminal A (top-left leg at 224, 103) */}
              <path
                d="M 130 108 H 180 L 195 103 H 224"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="224" cy="103" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
              <text x="178" y="97" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#38bdf8" fontFamily="monospace">
                Sinyal Input (D2)
              </text>
              {/* Wire GND -> Button Terminal B (bottom-left leg at 224, 141) */}
              <path
                d="M 130 162 H 180 L 195 141 H 224"
                fill="none"
                stroke="#64748b"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="224" cy="141" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
              <text x="178" y="176" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace">
                Ground (0V)
              </text>
              {/* Internal Pull-up badge */}
              <g transform="translate(155, 42)">
                <rect x="0" y="0" width="142" height="28" rx="6" fill={isLight ? '#fffbeb' : '#1e293b'} stroke="#f59e0b" strokeWidth="1.2" />
                <text x="71" y="12" textAnchor="middle" fontSize="7" fontWeight="900" fill="#f59e0b">
                  ⚡ PULL-UP INTERNAL 20kΩ AKTIF
                </text>
                <text x="71" y="22" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={isLight ? '#92400e' : '#fde68a'} fontFamily="monospace">
                  Dilepas = HIGH (1) | Ditekan = LOW (0)
                </text>
              </g>
              <path d="M 130 58 H 155" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
            </>
          );

        case 3: // Lesson 4: Rotary Potentiometer 10kΩ to 5V, A0, GND
          return (
            <>
              {renderUnoBoard([
                { id: '5V', y: 60, color: '#ef4444' },
                { id: 'A0 (ADC)', y: 112, color: '#10b981' },
                { id: 'GND', y: 164, color: '#64748b' },
              ])}
              {/* Rotary Potentiometer Component on Right */}
              <g transform="translate(264, 86)">
                <circle cx="0" cy="0" r="34" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2.2" />
                <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="14" fill="#cbd5e1" />
                <line x1="0" y1="0" x2="10" y2="-10" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                <text x="0" y="-42" textAnchor="middle" fontSize="8" fontWeight="900" fill="#60a5fa">
                  POTENSIOMETER 10kΩ
                </text>
                {/* 3 Bottom Terminal Legs: Left (VCC), Center (Wiper A0), Right (GND) */}
                <line x1="-18" y1="31" x2="-18" y2="54" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="0" y1="34" x2="0" y2="54" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="18" y1="31" x2="18" y2="54" stroke="#cbd5e1" strokeWidth="3" />
                <circle cx="-18" cy="54" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="0" cy="54" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="18" cy="54" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
              </g>
              {/* Wire 1: 5V -> Left Pot Pin (246, 140) */}
              <path
                d="M 130 60 H 206 V 140 H 246"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="168" y="54" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#ef4444" fontFamily="monospace">
                5V (VCC)
              </text>
              {/* Wire 2: A0 -> Center Wiper Pin (264, 140) */}
              <path
                d="M 130 112 H 186 V 158 H 264 V 140"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="162" y="106" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#10b981" fontFamily="monospace">
                Wiper → A0
              </text>
              {/* Wire 3: GND -> Right Pot Pin (282, 140) */}
              <path
                d="M 130 164 H 170 V 176 H 282 V 140"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="225" y="190" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace">
                GND (0V)
              </text>
            </>
          );

        case 4: // Lesson 5: PWM Dimmer LED on Pin ~D9 with 220Ω Resistor
          return (
            <>
              {renderUnoBoard([
                { id: '~D9 PWM', y: 84, color: '#a855f7' },
                { id: 'GND', y: 154, color: '#64748b' },
              ])}
              {/* Wire ~D9 -> 220Ω Resistor -> LED Anode (+) */}
              <path
                d="M 130 84 H 174 M 218 84 H 262 V 96"
                fill="none"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <SvgResistor x={196} y={84} label="220Ω" />
              {/* Wire GND -> LED Cathode (-) */}
              <path
                d="M 130 154 H 274 V 96"
                fill="none"
                stroke="#64748b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <SvgLed x={268} y={74} color="#a855f7" glowColor="rgba(168,85,247,0.45)" label="LED PWM ~D9" />
              <text x="200" y="172" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#c084fc" fontFamily="monospace">
                Sinyal PWM 490Hz (0 - 255)
              </text>
            </>
          );

        case 5: // Lesson 6: UART Serial Monitor (TX D1 & RX D0 via USB to PC)
          return (
            <>
              {renderUnoBoard([
                { id: 'D1 (TX)', y: 74, color: '#f59e0b' },
                { id: 'D0 (RX)', y: 116, color: '#10b981' },
                { id: 'GND', y: 158, color: '#64748b' },
              ])}
              {/* Serial Terminal Monitor Box on Right */}
              <g transform="translate(208, 44)">
                <rect x="0" y="0" width="114" height="128" rx="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
                <rect x="6" y="20" width="102" height="98" rx="5" fill="#020617" />
                <circle cx="12" cy="10" r="2.5" fill="#ef4444" />
                <circle cx="20" cy="10" r="2.5" fill="#f59e0b" />
                <circle cx="28" cy="10" r="2.5" fill="#10b981" />
                <text x="72" y="12.5" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace">
                  SERIAL 9600
                </text>
                <text x="12" y="38" fontSize="7" fontWeight="700" fill="#34d399" fontFamily="monospace">
                  &gt; Telemetry Ready
                </text>
                <text x="12" y="54" fontSize="7" fontWeight="700" fill="#38bdf8" fontFamily="monospace">
                  &gt; Uptime: 14 s
                </text>
                <text x="12" y="70" fontSize="7" fontWeight="700" fill="#fde047" fontFamily="monospace">
                  &gt; LED D13: NYALA
                </text>
                {/* Pin Pads on Left of Monitor */}
                <circle cx="0" cy="30" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="0" cy="72" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
                <circle cx="0" cy="114" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
              </g>
              {/* TX / RX / GND Lines */}
              <path d="M 130 74 H 208" fill="none" stroke="#f59e0b" strokeWidth="2.8" />
              <text x="169" y="68" textAnchor="middle" fontSize="7" fontWeight="800" fill="#f59e0b" fontFamily="monospace">
                TX → RX PC
              </text>
              <path d="M 130 116 H 208" fill="none" stroke="#10b981" strokeWidth="2.8" />
              <text x="169" y="110" textAnchor="middle" fontSize="7" fontWeight="800" fill="#10b981" fontFamily="monospace">
                RX ← TX PC
              </text>
              <path d="M 130 158 H 208" fill="none" stroke="#64748b" strokeWidth="2.5" />
            </>
          );

        case 6: // Lesson 7: 16x2 I2C LCD connected to 5V, GND, A4 (SDA), A5 (SCL)
        default:
          return (
            <>
              {renderUnoBoard([
                { id: '5V', y: 54, color: '#ef4444' },
                { id: 'GND', y: 88, color: '#64748b' },
                { id: 'A4 (SDA)', y: 124, color: '#10b981' },
                { id: 'A5 (SCL)', y: 160, color: '#38bdf8' },
              ])}
              {/* 16x2 LCD I2C Module on Right */}
              <g transform="translate(204, 42)">
                <rect x="0" y="0" width="122" height="132" rx="8" fill="#15803d" stroke="#22c55e" strokeWidth="1.8" />
                <rect x="10" y="16" width="102" height="62" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <rect x="14" y="20" width="94" height="54" rx="3" fill="#84cc16" />
                <text x="61" y="42" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#1a2e05" fontFamily="monospace">
                  HALO ROBOLAB!
                </text>
                <text x="61" y="59" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#365314" fontFamily="monospace">
                  I2C ADDR: 0x27
                </text>
                <text x="61" y="122" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#bbf7d0" fontFamily="monospace">
                  LCD 16x2 I2C MODULE
                </text>
                {/* 4 I2C Header Pins on Left Edge of LCD */}
                {[
                  { label: 'VCC', y: 12, color: '#ef4444' },
                  { label: 'GND', y: 46, color: '#64748b' },
                  { label: 'SDA', y: 82, color: '#10b981' },
                  { label: 'SCL', y: 118, color: '#38bdf8' },
                ].map((p) => (
                  <g key={p.label}>
                    <circle cx="0" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
                    <text x="8" y={p.y + 3} fontSize="7" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                      {p.label}
                    </text>
                  </g>
                ))}
              </g>
              {/* 4 Connected Jumper Wires */}
              <path d="M 130 54 H 204" fill="none" stroke="#ef4444" strokeWidth="2.8" />
              <path d="M 130 88 H 204" fill="none" stroke="#64748b" strokeWidth="2.8" />
              <path d="M 130 124 H 204" fill="none" stroke="#10b981" strokeWidth="2.8" />
              <path d="M 130 160 H 204" fill="none" stroke="#38bdf8" strokeWidth="2.8" />
            </>
          );
      }
    }

    // ========================================================================
    // ESP32 MICROPYTHON SCENES (Lessons 0 .. 10)
    // ========================================================================
    switch (index) {
      case 0: // Blink LED on GPIO2
      case 1: // PWM LED on GPIO2
      case 6: // Web Server LED on GPIO2
      case 8: // WebSocket Client LED on GPIO2
      case 9: // Gemini Voice LED on GPIO2
        return (
          <>
            {renderEsp32Board([
              { id: index === 1 ? 'GPIO2 ~' : 'GPIO2', y: 82, color: '#38bdf8' },
              { id: 'GND', y: 154, color: '#64748b' },
            ])}
            {/* Wire GPIO2 -> 220Ω Resistor -> LED Anode (+) */}
            <path
              d="M 130 82 H 174 M 218 82 H 262 V 96"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgResistor x={196} y={82} label="220Ω" />
            {/* Wire GND -> LED Cathode (-) */}
            <path
              d="M 130 154 H 274 V 96"
              fill="none"
              stroke="#64748b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgLed
              x={268}
              y={74}
              color="#38bdf8"
              glowColor="rgba(56,189,248,0.45)"
              label={index === 6 || index === 9 ? 'LED IOT GPIO2' : 'LED GPIO2'}
            />
            {(index === 6 || index === 8 || index === 9) && (
              <g transform="translate(154, 24)">
                <rect x="0" y="0" width="166" height="24" rx="6" fill={isLight ? '#eff6ff' : '#0f172a'} stroke="#38bdf8" strokeWidth="1.2" />
                <text x="83" y="15" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#38bdf8" fontFamily="monospace">
                  📶 Wi-Fi 2.4GHz {index === 9 ? '+ Gemini AI Voice' : 'Terhubung'}
                </text>
              </g>
            )}
          </>
        );

      case 2: // Potentiometer on ESP32 (3V3, GPIO34, GND)
        return (
          <>
            {renderEsp32Board([
              { id: '3V3', y: 60, color: '#ef4444' },
              { id: 'GPIO34', y: 112, color: '#f59e0b' },
              { id: 'GND', y: 164, color: '#64748b' },
            ])}
            <g transform="translate(264, 86)">
              <circle cx="0" cy="0" r="34" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2.2" />
              <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="14" fill="#cbd5e1" />
              <line x1="0" y1="0" x2="10" y2="-10" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
              <text x="0" y="-42" textAnchor="middle" fontSize="8" fontWeight="900" fill="#f59e0b">
                POTENSIOMETER (ADC 12-BIT)
              </text>
              <line x1="-18" y1="31" x2="-18" y2="54" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="0" y1="34" x2="0" y2="54" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="18" y1="31" x2="18" y2="54" stroke="#cbd5e1" strokeWidth="3" />
              <circle cx="-18" cy="54" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="54" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="18" cy="54" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <path d="M 130 60 H 206 V 140 H 246" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinejoin="round" />
            <text x="168" y="54" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#ef4444" fontFamily="monospace">
              3.3V (VCC)
            </text>
            <path d="M 130 112 H 186 V 158 H 264 V 140" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinejoin="round" />
            <text x="165" y="106" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#f59e0b" fontFamily="monospace">
              Wiper → GPIO34
            </text>
            <path d="M 130 164 H 170 V 176 H 282 V 140" fill="none" stroke="#64748b" strokeWidth="2.8" strokeLinejoin="round" />
          </>
        );

      case 3: // OLED SSD1306 I2C (3V3, GND, GPIO22 SCL, GPIO21 SDA)
        return (
          <>
            {renderEsp32Board([
              { id: '3V3', y: 54, color: '#ef4444' },
              { id: 'GND', y: 88, color: '#64748b' },
              { id: 'GPIO22', y: 124, color: '#38bdf8' },
              { id: 'GPIO21', y: 160, color: '#10b981' },
            ])}
            {/* OLED SSD1306 Module on Right */}
            <g transform="translate(206, 40)">
              <rect x="0" y="0" width="118" height="134" rx="8" fill="#1e3a8a" stroke="#38bdf8" strokeWidth="1.8" />
              <rect x="14" y="18" width="94" height="66" rx="4" fill="#020617" stroke="#475569" strokeWidth="1.5" />
              <text x="61" y="34" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fde047" fontFamily="monospace">
                ROBOLAB STUDIO
              </text>
              <line x1="18" y1="39" x2="102" y2="39" stroke="#334155" strokeWidth="1" />
              <text x="61" y="54" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#38bdf8" fontFamily="monospace">
                MicroPython IoT
              </text>
              <text x="61" y="69" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#34d399" fontFamily="monospace">
                Status: ONLINE
              </text>
              <text x="61" y="123" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#93c5fd" fontFamily="monospace">
                OLED SSD1306 (0x3C)
              </text>
              {[
                { label: 'VCC', y: 14, color: '#ef4444' },
                { label: 'GND', y: 48, color: '#64748b' },
                { label: 'SCL', y: 84, color: '#38bdf8' },
                { label: 'SDA', y: 120, color: '#10b981' },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx="0" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
                  <text x="6" y={p.y + 3} fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                    {p.label}
                  </text>
                </g>
              ))}
            </g>
            <path d="M 130 54 H 206" fill="none" stroke="#ef4444" strokeWidth="2.8" />
            <path d="M 130 88 H 206" fill="none" stroke="#64748b" strokeWidth="2.8" />
            <path d="M 130 124 H 206" fill="none" stroke="#38bdf8" strokeWidth="2.8" />
            <path d="M 130 160 H 206" fill="none" stroke="#10b981" strokeWidth="2.8" />
          </>
        );

      case 4: // HC-SR04 Ultrasonic Sensor (5V, GPIO12 TRIG, GPIO13 ECHO, GND)
        return (
          <>
            {renderEsp32Board([
              { id: '5V (VIN)', y: 54, color: '#ef4444' },
              { id: 'GPIO12', y: 88, color: '#38bdf8' },
              { id: 'GPIO13', y: 124, color: '#10b981' },
              { id: 'GND', y: 160, color: '#64748b' },
            ])}
            {/* HC-SR04 Module on Right */}
            <g transform="translate(206, 40)">
              <rect x="0" y="0" width="118" height="134" rx="8" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.8" />
              {/* Ultrasonic Transducer Cylinders (T & R) */}
              <circle cx="70" cy="40" r="22" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <circle cx="70" cy="40" r="14" fill="#334155" />
              <text x="102" y="43" textAnchor="middle" fontSize="8" fontWeight="900" fill="#e0f2fe" fontFamily="monospace">
                TX
              </text>
              <circle cx="70" cy="94" r="22" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
              <circle cx="70" cy="94" r="14" fill="#334155" />
              <text x="102" y="97" textAnchor="middle" fontSize="8" fontWeight="900" fill="#e0f2fe" fontFamily="monospace">
                RX
              </text>
              <text x="64" y="128" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                HC-SR04 SONAR
              </text>
              {[
                { label: 'VCC', y: 14, color: '#ef4444' },
                { label: 'TRIG', y: 48, color: '#38bdf8' },
                { label: 'ECHO', y: 84, color: '#10b981' },
                { label: 'GND', y: 120, color: '#64748b' },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx="0" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
                  <text x="6" y={p.y + 3} fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                    {p.label}
                  </text>
                </g>
              ))}
            </g>
            <path d="M 130 54 H 206" fill="none" stroke="#ef4444" strokeWidth="2.8" />
            <path d="M 130 88 H 206" fill="none" stroke="#38bdf8" strokeWidth="2.8" />
            <path d="M 130 124 H 206" fill="none" stroke="#10b981" strokeWidth="2.8" />
            <path d="M 130 160 H 206" fill="none" stroke="#64748b" strokeWidth="2.8" />
          </>
        );

      case 5: // Multitasking uasyncio Dual LED (GPIO2 & GPIO4)
        return (
          <>
            {renderEsp32Board([
              { id: 'GPIO2', y: 62, color: '#38bdf8' },
              { id: 'GPIO4', y: 112, color: '#a855f7' },
              { id: 'GND', y: 168, color: '#64748b' },
            ])}
            <path d="M 130 62 H 168 M 212 62 H 238 V 74" fill="none" stroke="#38bdf8" strokeWidth="2.8" strokeLinejoin="round" />
            <SvgResistor x={190} y={62} label="220Ω" />
            <path d="M 130 112 H 168 M 212 112 H 292 V 74" fill="none" stroke="#a855f7" strokeWidth="2.8" strokeLinejoin="round" />
            <SvgResistor x={190} y={112} label="220Ω" />
            <path d="M 130 168 H 304 V 74 M 250 168 V 74" fill="none" stroke="#64748b" strokeWidth="2.8" strokeLinejoin="round" />
            <circle cx="250" cy="168" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
            <SvgLed x={244} y={52} color="#38bdf8" glowColor="rgba(56,189,248,0.4)" label="LED 1 (0.2s)" />
            <SvgLed x={298} y={52} color="#a855f7" glowColor="rgba(168,85,247,0.4)" label="LED 2 (1.0s)" />
          </>
        );

      case 7: // PID Controller Motor Loop (GPIO5 PWM, GPIO34 Sensor, GND)
        return (
          <>
            {renderEsp32Board([
              { id: 'GPIO5 ~', y: 66, color: '#10b981' },
              { id: 'GPIO34', y: 116, color: '#f59e0b' },
              { id: 'GND', y: 162, color: '#64748b' },
            ])}
            <g transform="translate(212, 48)">
              <rect x="0" y="0" width="112" height="126" rx="10" fill="#1e293b" stroke="#10b981" strokeWidth="1.8" />
              <circle cx="56" cy="52" r="24" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
              <circle cx="56" cy="52" r="7" fill="#cbd5e1" />
              <line x1="56" y1="52" x2="74" y2="38" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
              <text x="56" y="94" textAnchor="middle" fontSize="8" fontWeight="900" fill="#34d399" fontFamily="monospace">
                SERVO / MOTOR PID
              </text>
              <text x="56" y="108" textAnchor="middle" fontSize="7" fontWeight="700" fill="#fde047" fontFamily="monospace">
                Target Setpoint: 90°
              </text>
              <circle cx="0" cy="18" r="3.8" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="68" r="3.8" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="114" r="3.8" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <path d="M 130 66 H 212" fill="none" stroke="#10b981" strokeWidth="2.8" />
            <text x="171" y="60" textAnchor="middle" fontSize="7" fontWeight="800" fill="#10b981" fontFamily="monospace">
              Output PWM
            </text>
            <path d="M 130 116 H 212" fill="none" stroke="#f59e0b" strokeWidth="2.8" />
            <text x="171" y="110" textAnchor="middle" fontSize="7" fontWeight="800" fill="#f59e0b" fontFamily="monospace">
              Feedback PV
            </text>
            <path d="M 130 162 H 212" fill="none" stroke="#64748b" strokeWidth="2.5" />
          </>
        );

      case 10: // INMP441 I2S Microphone + LED on GPIO2
      default:
        return (
          <>
            {renderEsp32Board([
              { id: '3V3', y: 46, color: '#ef4444' },
              { id: 'GPIO14', y: 76, color: '#38bdf8' },
              { id: 'GPIO15', y: 106, color: '#10b981' },
              { id: 'GPIO32', y: 136, color: '#f59e0b' },
              { id: 'GND', y: 168, color: '#64748b' },
            ])}
            {/* INMP441 I2S MEMS Microphone Breakout Board */}
            <g transform="translate(208, 34)">
              <rect x="0" y="0" width="114" height="146" rx="10" fill="#0f172a" stroke="#a855f7" strokeWidth="1.8" />
              <circle cx="64" cy="56" r="24" fill="#1e293b" stroke="#c084fc" strokeWidth="1.8" />
              <circle cx="64" cy="56" r="9" fill="#020617" stroke="#eab308" strokeWidth="1.5" />
              <text x="64" y="96" textAnchor="middle" fontSize="8" fontWeight="900" fill="#e9d5ff" fontFamily="monospace">
                INMP441 I2S MIC
              </text>
              <text x="64" y="110" textAnchor="middle" fontSize="7" fontWeight="700" fill="#38bdf8" fontFamily="monospace">
                Gemini 1.5 Audio
              </text>
              {[
                { label: 'VDD', y: 12, color: '#ef4444' },
                { label: 'SCK', y: 42, color: '#38bdf8' },
                { label: 'WS', y: 72, color: '#10b981' },
                { label: 'SD', y: 102, color: '#f59e0b' },
                { label: 'GND', y: 134, color: '#64748b' },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx="0" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
                  <text x="6" y={p.y + 3} fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                    {p.label}
                  </text>
                </g>
              ))}
            </g>
            <path d="M 130 46 H 208" fill="none" stroke="#ef4444" strokeWidth="2.6" />
            <path d="M 130 76 H 208" fill="none" stroke="#38bdf8" strokeWidth="2.6" />
            <path d="M 130 106 H 208" fill="none" stroke="#10b981" strokeWidth="2.6" />
            <path d="M 130 136 H 208" fill="none" stroke="#f59e0b" strokeWidth="2.6" />
            <path d="M 130 168 H 208" fill="none" stroke="#64748b" strokeWidth="2.6" />
          </>
        );
    }
  };

  return (
    <div
      className={`my-2.5 overflow-hidden rounded-xl border p-2 ${
        isLight
          ? 'border-slate-200 bg-slate-900 text-slate-100 shadow-inner'
          : 'border-slate-800 bg-[#070a12] text-slate-100 shadow-inner'
      }`}
    >
      <div className="flex items-center justify-between px-1.5 pb-1.5 text-[10px] font-extrabold border-b border-white/10">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Skema Rangkaian Terhubung</span>
        </span>
        <span className="font-mono text-[9.5px] text-slate-400">
          {arduino ? 'Arduino Uno R3' : 'ESP32 DevKit V1'} ↔ Komponen
        </span>
      </div>
      <svg
        viewBox="0 0 340 212"
        className="w-full h-auto max-h-[225px] select-none"
        role="img"
        aria-label="Diagram skema rangkaian kabel terhubung antar pin mikrokontroler dan komponen"
      >
        <defs>
          <pattern id="circuitGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="340" height="212" fill="url(#circuitGrid)" />
        {renderScene()}
      </svg>
    </div>
  );
}

function WiringDiagram({
  routes,
  boardName,
  isLight,
}: {
  routes: WireRoute[];
  boardName: string;
  isLight: boolean;
}) {
  return (
    <figure
      className={`my-2 overflow-hidden rounded-xl border p-2.5 ${
        isLight
          ? 'border-slate-200 bg-slate-50/90 text-slate-800'
          : 'border-slate-800 bg-slate-950/80 text-slate-100'
      }`}
    >
      <figcaption className="mb-2 text-[10.5px] font-extrabold flex items-center justify-between">
        <span>🔌 Tabel Pin-ke-Pin ({boardName})</span>
        <span className="text-[9.5px] font-semibold opacity-75">{routes.length} Jalur Kabel</span>
      </figcaption>
      <div className="grid grid-cols-[4.5rem_minmax(2rem,1fr)_minmax(6rem,1.2fr)] items-center text-[10px]">
        {routes.map(([pin, terminal, inline]) => {
          const color =
            pin === 'GND'
              ? '#64748b'
              : /^(3V3|5V|USB 5V|5V \(VIN\))$/.test(pin)
              ? '#ef4444'
              : 'var(--accent-primary)';
          return (
            <div className="contents" key={`${pin}-${terminal}`}>
              <span
                className={`relative self-stretch border px-1.5 py-1.5 font-mono font-extrabold flex items-center rounded-l-lg my-0.5 ${
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
              <span className="relative flex min-h-8 items-center justify-center px-1 text-center">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-1/2 h-0.5"
                  style={{ backgroundColor: color }}
                />
                {inline && (
                  <span
                    className={`relative rounded-md border px-1.5 py-0.5 text-[9px] font-bold leading-tight ${
                      isLight ? 'bg-white' : 'bg-slate-900'
                    }`}
                    style={{ color, borderColor: color }}
                  >
                    {inline}
                  </span>
                )}
              </span>
              <span
                className={`relative self-stretch border px-2 py-1.5 font-semibold flex items-center rounded-r-lg my-0.5 ${
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
      <h3
        className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5"
        style={{ color: 'var(--accent-primary)' }}
      >
        <span>🔧</span>
        <span>Cara Merakit Rangkaian</span>
      </h3>

      {/* Interactive Connected Circuit Diagram */}
      <ConnectedCircuitCanvas arduino={arduino} index={index} isLight={isLight} />

      {/* Pin-to-Pin Reference Table */}
      {routes && (
        <WiringDiagram
          routes={routes}
          boardName={arduino ? 'Arduino Uno' : 'ESP32'}
          isLight={isLight}
        />
      )}

      <ul className={`mt-2 space-y-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
        {wiring.connections.map((connection) => (
          <li key={connection} className="flex items-start gap-2 leading-relaxed">
            <span className="text-[10px] mt-0.5" style={{ color: 'var(--accent-primary)' }}>
              ●
            </span>
            <span>{connection}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
