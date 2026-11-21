// book_assets.cjs - High quality SVG assets for RoboLab Studio IoT Book

function mascotSVG(emotion = 'happy', size = 64) {
  let accessory = '';
  let eyes = '<ellipse cx="32" cy="35" rx="5" ry="6" fill="#38BDF8"/><ellipse cx="48" cy="35" rx="5" ry="6" fill="#38BDF8"/>';
  
  if (emotion === 'smart') {
    accessory = `
      <g transform="translate(56, 6)">
        <circle cx="10" cy="10" r="9" fill="#FEF08A" stroke="#EAB308" stroke-width="1.5"/>
        <path d="M7 10 Q10 5 13 10 M10 5 L10 2 M5 8 L3 7 M15 8 L17 7" stroke="#CA8A04" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="8.5" y="14" width="3" height="3" fill="#94A3B8"/>
      </g>
    `;
  } else if (emotion === 'doctor') {
    accessory = `
      <path d="M26 62 C26 72 54 72 54 62" stroke="#0284C7" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="71" r="5" fill="#EF4444" stroke="#DC2626" stroke-width="1.5"/>
      <line x1="40" y1="69" x2="40" y2="73" stroke="white" stroke-width="1.5"/>
      <line x1="38" y1="71" x2="42" y2="71" stroke="white" stroke-width="1.5"/>
    `;
  } else if (emotion === 'iot') {
    accessory = `
      <path d="M30 6 Q40 -2 50 6" stroke="#22C55E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M34 9 Q40 4 46 9" stroke="#22C55E" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="40" cy="12" r="2" fill="#22C55E"/>
    `;
  } else if (emotion === 'cheer') {
    eyes = '<path d="M27 36 Q32 30 37 36" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M43 36 Q48 30 53 36" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>';
  }

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
    <!-- Antenna -->
    <line x1="40" y1="14" x2="40" y2="5" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="4" r="4" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
    
    <!-- Ears -->
    <rect x="12" y="25" width="6" height="12" rx="2" fill="#F59E0B"/>
    <rect x="62" y="25" width="6" height="12" rx="2" fill="#F59E0B"/>

    <!-- Head -->
    <rect x="17" y="14" width="46" height="36" rx="10" fill="#38BDF8" stroke="#0284C7" stroke-width="2.5"/>
    
    <!-- Visor -->
    <rect x="22" y="22" width="36" height="20" rx="6" fill="#0F172A"/>
    
    <!-- Eyes -->
    ${eyes}
    <circle cx="34" cy="33" r="1.5" fill="#FFFFFF"/>
    <circle cx="50" cy="33" r="1.5" fill="#FFFFFF"/>
    
    <!-- Smile -->
    <path d="M36 40 Q40 43 44 40" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>

    <!-- Neck -->
    <rect x="36" y="50" width="8" height="4" fill="#64748B"/>

    <!-- Body -->
    <rect x="21" y="54" width="38" height="22" rx="7" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="40" cy="65" r="5" fill="#EF4444"/>
    <path d="M40 62 L42 65 L38 65 Z" fill="#FFFFFF"/>
    
    <!-- Arms -->
    <path d="M21 58 C13 62 13 70 19 72" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <path d="M59 58 C67 62 67 70 61 72" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    
    ${accessory}
  </svg>
  `;
}

// Diagram Arduino Uno Board
function arduinoUnoSVG(width = 240, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 280 190" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- PCB Board -->
    <rect x="10" y="10" width="260" height="170" rx="12" fill="#00878F" stroke="#00666D" stroke-width="3"/>
    
    <!-- USB Jack -->
    <rect x="0" y="30" width="45" height="35" rx="3" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
    <rect x="5" y="37" width="12" height="20" rx="2" fill="#475569"/>
    
    <!-- DC Power Jack -->
    <rect x="0" y="115" width="55" height="42" rx="3" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
    <circle cx="28" cy="136" r="7" fill="#475569"/>

    <!-- Reset Button -->
    <rect x="60" y="22" width="16" height="16" rx="3" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
    <circle cx="68" cy="30" r="4" fill="#FCA5A5"/>

    <!-- ATmega328P Chip -->
    <rect x="110" y="95" width="115" height="32" rx="4" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <text x="125" y="115" fill="#94A3B8" font-size="9" font-family="monospace" font-weight="bold">ATMEGA328P</text>
    <!-- IC Pins -->
    ${[...Array(14)].map((_, i) => `<rect x="${115 + i * 7.5}" y="90" width="3" height="5" fill="#E2E8F0"/><rect x="${115 + i * 7.5}" y="127" width="3" height="5" fill="#E2E8F0"/>`).join('')}

    <!-- Top Pin Header (Digital 0-13, GND, AREF) -->
    <rect x="85" y="15" width="180" height="15" rx="2" fill="#1E293B"/>
    ${[...Array(16)].map((_, i) => `<circle cx="${92 + i * 11}" cy="22.5" r="3" fill="#475569" stroke="#E2E8F0" stroke-width="0.8"/>`).join('')}
    <text x="90" y="39" fill="#E2E8F0" font-size="8" font-family="sans-serif" font-weight="bold">SCL SDA AR G 13 12 11~10~ 9~ 8 7 6~ 5~ 4 3~ 2 1 0</text>

    <!-- Bottom Pin Header (Power & Analog) -->
    <rect x="120" y="160" width="145" height="15" rx="2" fill="#1E293B"/>
    ${[...Array(14)].map((_, i) => `<circle cx="${127 + i * 10.5}" cy="167.5" r="3" fill="#475569" stroke="#E2E8F0" stroke-width="0.8"/>`).join('')}
    <text x="123" y="155" fill="#E2E8F0" font-size="8" font-family="sans-serif" font-weight="bold">IO R 3V 5V G G Vin A0 A1 A2 A3 A4 A5</text>

    <!-- Board Labels -->
    <text x="80" y="75" fill="#FFFFFF" font-size="16" font-family="'Fredoka', sans-serif" font-weight="bold" letter-spacing="1">ARDUINO</text>
    <rect x="175" y="63" width="38" height="16" rx="3" fill="#EAB308"/>
    <text x="180" y="75" fill="#1E293B" font-size="10" font-family="sans-serif" font-weight="bold">UNO</text>
    <text x="80" y="90" fill="#99F6E4" font-size="9" font-family="sans-serif">ROBOLAB STUDIO COMPATIBLE</text>
    
    <!-- Power & Status LEDs -->
    <circle cx="75" cy="50" r="3" fill="#22C55E"/>
    <text x="82" y="53" fill="#E2E8F0" font-size="7" font-family="sans-serif">ON</text>
    <circle cx="105" cy="50" r="3" fill="#EAB308"/>
    <text x="112" y="53" fill="#E2E8F0" font-size="7" font-family="sans-serif">L</text>
  </svg>
  `;
}

// Diagram ESP32 DevKit Board
function esp32BoardSVG(width = 240, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 280 190" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- PCB Board -->
    <rect x="30" y="10" width="220" height="170" rx="10" fill="#1E293B" stroke="#334155" stroke-width="3"/>
    
    <!-- WiFi Antenna Copper Area -->
    <rect x="75" y="12" width="130" height="36" rx="4" fill="#0F172A" stroke="#B45309" stroke-width="2"/>
    <path d="M85 30 L95 18 L105 30 L115 18 L125 30 L135 18 L145 30 L155 18 L165 30 L175 18 L185 30" stroke="#F59E0B" stroke-width="2.5" fill="none"/>
    <text x="105" y="44" fill="#F59E0B" font-size="8" font-family="sans-serif" font-weight="bold">📡 2.4 GHz WiFi & BT</text>

    <!-- Metal RF Shield -->
    <rect x="80" y="56" width="120" height="70" rx="4" fill="#CBD5E1" stroke="#94A3B8" stroke-width="2"/>
    <text x="96" y="85" fill="#1E293B" font-size="13" font-family="sans-serif" font-weight="bold">ESP-WROOM-32</text>
    <text x="110" y="105" fill="#475569" font-size="9" font-family="sans-serif">Dual Core 240MHz</text>

    <!-- Micro USB Port -->
    <rect x="115" y="160" width="50" height="25" rx="3" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
    <rect x="127" y="168" width="26" height="10" rx="2" fill="#475569"/>

    <!-- EN & BOOT Buttons -->
    <rect x="60" y="145" width="16" height="14" rx="2" fill="#475569"/>
    <text x="58" y="168" fill="#94A3B8" font-size="8" font-family="sans-serif" font-weight="bold">EN</text>
    <rect x="204" y="145" width="16" height="14" rx="2" fill="#475569"/>
    <text x="198" y="168" fill="#94A3B8" font-size="8" font-family="sans-serif" font-weight="bold">BOOT</text>

    <!-- Left Pin Header (15 pins) -->
    <rect x="35" y="20" width="16" height="150" rx="2" fill="#0F172A"/>
    ${[...Array(15)].map((_, i) => `<circle cx="43" cy="${26 + i * 10}" r="3" fill="#EAB308" stroke="#F8FAFC" stroke-width="0.8"/>`).join('')}
    <text x="12" y="28" fill="#38BDF8" font-size="7" font-family="monospace">3V3</text>
    <text x="12" y="48" fill="#38BDF8" font-size="7" font-family="monospace">GND</text>
    <text x="12" y="118" fill="#38BDF8" font-size="7" font-family="monospace">D34</text>
    <text x="12" y="158" fill="#38BDF8" font-size="7" font-family="monospace">D2</text>

    <!-- Right Pin Header (15 pins) -->
    <rect x="229" y="20" width="16" height="150" rx="2" fill="#0F172A"/>
    ${[...Array(15)].map((_, i) => `<circle cx="237" cy="${26 + i * 10}" r="3" fill="#EAB308" stroke="#F8FAFC" stroke-width="0.8"/>`).join('')}
    <text x="250" y="28" fill="#38BDF8" font-size="7" font-family="monospace">GND</text>
    <text x="250" y="68" fill="#38BDF8" font-size="7" font-family="monospace">D21</text>
    <text x="250" y="88" fill="#38BDF8" font-size="7" font-family="monospace">D22</text>
    <text x="250" y="168" fill="#38BDF8" font-size="7" font-family="monospace">VIN</text>
  </svg>
  `;
}

// Diagram Breadboard Mini
function breadboardSVG(width = 300, height = 110) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Breadboard base -->
    <rect x="5" y="5" width="310" height="110" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
    
    <!-- Top Power Rails (+ and -) -->
    <line x1="15" y1="18" x2="305" y2="18" stroke="#EF4444" stroke-width="2"/>
    <line x1="15" y1="28" x2="305" y2="28" stroke="#3B82F6" stroke-width="2"/>
    <text x="8" y="21" fill="#EF4444" font-size="11" font-weight="bold">+</text>
    <text x="8" y="31" fill="#3B82F6" font-size="13" font-weight="bold">-</text>

    <!-- Bottom Power Rails (+ and -) -->
    <line x1="15" y1="92" x2="305" y2="92" stroke="#EF4444" stroke-width="2"/>
    <line x1="15" y1="102" x2="305" y2="102" stroke="#3B82F6" stroke-width="2"/>
    <text x="8" y="95" fill="#EF4444" font-size="11" font-weight="bold">+</text>
    <text x="8" y="105" fill="#3B82F6" font-size="13" font-weight="bold">-</text>

    <!-- Center Divider Trough -->
    <rect x="15" y="58" width="290" height="4" fill="#E2E8F0"/>

    <!-- Tie Points Matrix -->
    ${[...Array(20)].map((_, col) => {
      const cx = 25 + col * 14;
      return `
        <!-- Top rail holes -->
        <circle cx="${cx}" cy="18" r="2" fill="#64748B"/>
        <circle cx="${cx}" cy="28" r="2" fill="#64748B"/>
        <!-- Terminal strip top (a-e) -->
        <circle cx="${cx}" cy="38" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="44" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="50" r="2" fill="#94A3B8"/>
        <!-- Terminal strip bottom (f-j) -->
        <circle cx="${cx}" cy="70" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="76" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="82" r="2" fill="#94A3B8"/>
        <!-- Bottom rail holes -->
        <circle cx="${cx}" cy="92" r="2" fill="#64748B"/>
        <circle cx="${cx}" cy="102" r="2" fill="#64748B"/>
      `;
    }).join('')}
  </svg>
  `;
}

// Diagram Circuit Proyek 1: LED Blink
function circuitBlinkSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Block Minimal -->
    <rect x="15" y="25" width="100" height="110" rx="8" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="25" y="45" fill="white" font-size="11" font-family="'Fredoka', sans-serif" font-weight="bold">ARDUINO</text>
    <circle cx="100" cy="55" r="4" fill="#1E293B" stroke="white"/>
    <text x="65" y="58" fill="white" font-size="9" font-family="sans-serif">Pin 13</text>
    <circle cx="100" cy="95" r="4" fill="#1E293B" stroke="white"/>
    <text x="70" y="98" fill="white" font-size="9" font-family="sans-serif">GND</text>

    <!-- Breadboard Area -->
    <rect x="145" y="20" width="180" height="120" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <text x="195" y="35" fill="#94A3B8" font-size="9" font-weight="bold">BREADBOARD</text>

    <!-- Resistor 220 Ohm -->
    <line x1="160" y1="55" x2="210" y2="55" stroke="#94A3B8" stroke-width="3"/>
    <rect x="175" y="49" width="22" height="12" rx="3" fill="#FBBF24" stroke="#D97706"/>
    <!-- Color Bands: Red, Red, Brown, Gold -->
    <line x1="179" y1="49" x2="179" y2="61" stroke="#DC2626" stroke-width="2"/>
    <line x1="184" y1="49" x2="184" y2="61" stroke="#DC2626" stroke-width="2"/>
    <line x1="189" y1="49" x2="189" y2="61" stroke="#78350F" stroke-width="2"/>
    <text x="170" y="75" fill="#D97706" font-size="8" font-weight="bold">220 Ω</text>

    <!-- LED 5mm Red -->
    <circle cx="240" cy="65" r="16" fill="#FCA5A5" fill-opacity="0.3"/>
    <path d="M232 60 C232 45 248 45 248 60 L248 70 L232 70 Z" fill="#EF4444" stroke="#B91C1C" stroke-width="1.5"/>
    <line x1="236" y1="70" x2="236" y2="55" stroke="#94A3B8" stroke-width="2.5"/><!-- Anode to resistor -->
    <line x1="244" y1="70" x2="244" y2="95" stroke="#94A3B8" stroke-width="2.5"/><!-- Cathode to GND -->
    <text x="225" y="42" fill="#DC2626" font-size="9" font-weight="bold">LED Merah</text>
    <text x="220" y="85" fill="#64748B" font-size="7">(+) Anoda</text>
    <text x="250" y="85" fill="#64748B" font-size="7">Katoda (-)</text>

    <!-- Wires -->
    <!-- Red Wire: Pin 13 to Resistor -->
    <path d="M100 55 C120 55 130 55 160 55" stroke="#EF4444" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="115" y="48" fill="#EF4444" font-size="8" font-weight="bold">Pin 13</text>

    <!-- Blue Wire: Cathode to GND -->
    <path d="M244 95 C200 115 140 110 100 95" stroke="#2563EB" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="155" y="115" fill="#2563EB" font-size="8" font-weight="bold">GND (Kutub -)</text>
  </svg>
  `;
}

// Diagram Circuit Proyek 2: Button + LED
function circuitButtonSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Board -->
    <rect x="15" y="20" width="100" height="120" rx="8" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="25" y="38" fill="white" font-size="11" font-weight="bold">ARDUINO</text>
    
    <circle cx="100" cy="50" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="65" y="53" fill="white" font-size="8">Pin 13 (LED)</text>
    
    <circle cx="100" cy="70" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="50" y="73" fill="white" font-size="8">Pin 2 (Button)</text>

    <circle cx="100" cy="95" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="75" y="98" fill="white" font-size="8">5V</text>
    
    <circle cx="100" cy="115" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="70" y="118" fill="white" font-size="8">GND</text>

    <!-- Breadboard Area -->
    <rect x="140" y="20" width="185" height="120" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>

    <!-- Push Button -->
    <rect x="165" y="65" width="24" height="24" rx="4" fill="#334155" stroke="#0F172A"/>
    <circle cx="177" cy="77" r="7" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
    <text x="158" y="60" fill="#1E293B" font-size="8" font-weight="bold">Tombol Tekan</text>

    <!-- 10k Resistor (Pull-Down) -->
    <rect x="167" y="100" width="8" height="18" rx="2" fill="#D97706"/>
    <text x="180" y="112" fill="#92400E" font-size="7" font-weight="bold">10kΩ</text>

    <!-- LED & 220 Resistor -->
    <path d="M255 35 C255 25 267 25 267 35 L267 43 L255 43 Z" fill="#22C55E" stroke="#16A34A" stroke-width="1.5"/>
    <text x="250" y="20" fill="#16A34A" font-size="8" font-weight="bold">LED Hijau</text>
    <rect x="257" y="52" width="8" height="14" rx="2" fill="#FBBF24"/>
    <text x="270" y="62" fill="#B45309" font-size="7">220Ω</text>

    <!-- Wires -->
    <!-- Pin 13 to LED -->
    <path d="M100 50 C140 40 200 40 255 38" stroke="#16A34A" stroke-width="2.5" fill="none"/>
    <!-- 5V to Button Pin 1 -->
    <path d="M100 95 C120 95 140 85 165 72" stroke="#EF4444" stroke-width="2" fill="none"/>
    <!-- Button to Pin 2 (Signal) -->
    <path d="M177 89 C160 85 130 80 100 70" stroke="#8B5CF6" stroke-width="2.5" fill="none"/>
    <!-- Resistor to GND -->
    <path d="M171 118 C150 125 125 120 100 115" stroke="#1E293B" stroke-width="2" fill="none"/>
    <!-- LED to GND -->
    <path d="M261 66 C261 115 150 120 100 115" stroke="#1E293B" stroke-width="2" fill="none"/>
  </svg>
  `;
}

// Diagram Circuit Proyek 3: LDR Sensor Cahaya
function circuitLdrSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Board -->
    <rect x="15" y="20" width="100" height="120" rx="8" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="25" y="38" fill="white" font-size="11" font-weight="bold">ARDUINO</text>
    <circle cx="100" cy="50" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="50" y="53" fill="white" font-size="8">Pin 12 (LED)</text>
    <circle cx="100" cy="80" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="50" y="83" fill="white" font-size="8">Pin A0 (LDR)</text>
    <circle cx="100" cy="105" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="75" y="108" fill="white" font-size="8">5V</text>
    <circle cx="100" cy="125" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="70" y="128" fill="white" font-size="8">GND</text>

    <!-- Breadboard Area -->
    <rect x="140" y="20" width="185" height="120" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>

    <!-- LDR Component -->
    <circle cx="180" cy="70" r="12" fill="#FCA5A5" stroke="#DC2626" stroke-width="1.5"/>
    <path d="M172 68 Q176 64 180 68 Q184 72 188 68" stroke="#7F1D1D" stroke-width="1.5" fill="none"/>
    <path d="M172 72 Q176 68 180 72 Q184 76 188 72" stroke="#7F1D1D" stroke-width="1.5" fill="none"/>
    <text x="160" y="52" fill="#991B1B" font-size="8" font-weight="bold">Sensor LDR</text>

    <!-- 10k Resistor -->
    <rect x="176" y="95" width="8" height="18" rx="2" fill="#D97706"/>
    <text x="188" y="108" fill="#92400E" font-size="7" font-weight="bold">10kΩ</text>

    <!-- Yellow LED -->
    <path d="M260 40 C260 30 272 30 272 40 L272 48 L260 48 Z" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>
    <text x="250" y="25" fill="#CA8A04" font-size="8" font-weight="bold">Lampu LED</text>
    <rect x="262" y="56" width="8" height="14" rx="2" fill="#FBBF24"/>
    <text x="274" y="66" fill="#B45309" font-size="7">220Ω</text>

    <!-- Wires -->
    <!-- Pin 12 to LED -->
    <path d="M100 50 C140 45 200 45 260 44" stroke="#EAB308" stroke-width="2.5" fill="none"/>
    <!-- 5V to LDR -->
    <path d="M100 105 C120 105 140 90 170 73" stroke="#EF4444" stroke-width="2" fill="none"/>
    <!-- LDR to A0 -->
    <path d="M180 82 C160 85 130 85 100 80" stroke="#8B5CF6" stroke-width="2.5" fill="none"/>
    <!-- GND wires -->
    <path d="M180 113 C150 125 125 125 100 125" stroke="#1E293B" stroke-width="2" fill="none"/>
    <path d="M266 70 C266 120 150 125 100 125" stroke="#1E293B" stroke-width="2" fill="none"/>
  </svg>
  `;
}

// Diagram Circuit Proyek 4: Potensiometer Dimmer (PWM)
function circuitPotentiometerSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Board -->
    <rect x="15" y="20" width="100" height="120" rx="8" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="25" y="38" fill="white" font-size="11" font-weight="bold">ARDUINO</text>
    <circle cx="100" cy="50" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="45" y="53" fill="white" font-size="8">Pin ~9 (PWM)</text>
    <circle cx="100" cy="80" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="50" y="83" fill="white" font-size="8">Pin A0 (Pot)</text>
    <circle cx="100" cy="105" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="75" y="108" fill="white" font-size="8">5V</text>
    <circle cx="100" cy="125" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="70" y="128" fill="white" font-size="8">GND</text>

    <!-- Potentiometer Component -->
    <rect x="155" y="55" width="40" height="40" rx="20" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
    <circle cx="175" cy="75" r="10" fill="#E2E8F0" stroke="#64748B"/>
    <line x1="175" y1="75" x2="182" y2="68" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round"/>
    <text x="145" y="48" fill="#0369A1" font-size="8" font-weight="bold">Potensiometer</text>

    <!-- LED PWM -->
    <path d="M260 45 C260 35 272 35 272 45 L272 53 L260 53 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
    <text x="250" y="30" fill="#0284C7" font-size="8" font-weight="bold">LED Biru</text>
    <rect x="262" y="60" width="8" height="14" rx="2" fill="#FBBF24"/>
    <text x="274" y="70" fill="#B45309" font-size="7">220Ω</text>

    <!-- Wires -->
    <!-- Pin ~9 to LED -->
    <path d="M100 50 C140 45 200 45 260 48" stroke="#38BDF8" stroke-width="2.5" fill="none"/>
    <!-- 5V to Pot Pin 1 -->
    <path d="M100 105 C120 105 140 90 160 85" stroke="#EF4444" stroke-width="2" fill="none"/>
    <!-- Pot Wiper (Center) to Pin A0 -->
    <path d="M175 95 C160 110 130 95 100 80" stroke="#8B5CF6" stroke-width="2.5" fill="none"/>
    <!-- Pot Pin 3 & LED to GND -->
    <path d="M190 85 C190 110 140 125 100 125" stroke="#1E293B" stroke-width="2" fill="none"/>
    <path d="M266 74 C266 120 150 125 100 125" stroke="#1E293B" stroke-width="2" fill="none"/>
  </svg>
  `;
}

// Diagram Circuit Proyek 6: Servo Motor SG90
function circuitServoSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Board -->
    <rect x="15" y="20" width="100" height="120" rx="8" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="25" y="38" fill="white" font-size="11" font-weight="bold">ARDUINO</text>
    <circle cx="100" cy="50" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="45" y="53" fill="white" font-size="8">Pin ~9 (PWM)</text>
    <circle cx="100" cy="85" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="75" y="88" fill="white" font-size="8">5V</text>
    <circle cx="100" cy="115" r="3.5" fill="#1E293B" stroke="white"/>
    <text x="70" y="118" fill="white" font-size="8">GND</text>

    <!-- SG90 Micro Servo -->
    <rect x="180" y="45" width="80" height="55" rx="5" fill="#0284C7" stroke="#0369A1" stroke-width="2"/>
    <!-- Servo Horn -->
    <circle cx="205" cy="72" r="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2"/>
    <rect x="200" y="42" width="10" height="30" rx="3" fill="#FFFFFF" stroke="#94A3B8"/>
    <circle cx="205" cy="50" r="2" fill="#64748B"/>
    <circle cx="205" cy="72" r="3" fill="#F59E0B"/>
    <text x="185" y="115" fill="#0369A1" font-size="9" font-weight="bold">Servo SG90 (0°-180°)</text>

    <!-- 3 Servo Wires -->
    <!-- Signal (Orange) to Pin 9 -->
    <path d="M100 50 C130 50 160 55 180 60" stroke="#F97316" stroke-width="3" fill="none"/>
    <text x="125" y="43" fill="#EA580C" font-size="8" font-weight="bold">Oranye: Sinyal (~9)</text>

    <!-- 5V (Red) to 5V -->
    <path d="M100 85 C130 85 160 70 180 70" stroke="#EF4444" stroke-width="3" fill="none"/>
    <text x="135" y="77" fill="#DC2626" font-size="8" font-weight="bold">Merah: 5V</text>

    <!-- GND (Brown) to GND -->
    <path d="M100 115 C130 115 160 80 180 80" stroke="#78350F" stroke-width="3" fill="none"/>
    <text x="130" y="105" fill="#78350F" font-size="8" font-weight="bold">Cokelat: GND</text>
  </svg>
  `;
}

// Diagram Circuit Proyek 7: Ultrasonic HC-SR04 + LCD 16x2
function circuitUltrasonicLcdSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- Arduino Board -->
    <rect x="10" y="20" width="85" height="120" rx="6" fill="#00878F" stroke="#00666D" stroke-width="2"/>
    <text x="20" y="38" fill="white" font-size="10" font-weight="bold">ARDUINO</text>
    <circle cx="85" cy="50" r="3" fill="#1E293B" stroke="white"/>
    <text x="35" y="53" fill="white" font-size="7.5">Trig 12</text>
    <circle cx="85" cy="65" r="3" fill="#1E293B" stroke="white"/>
    <text x="35" y="68" fill="white" font-size="7.5">Echo 13</text>
    <circle cx="85" cy="85" r="3" fill="#1E293B" stroke="white"/>
    <text x="35" y="88" fill="white" font-size="7.5">SDA (A4)</text>
    <circle cx="85" cy="100" r="3" fill="#1E293B" stroke="white"/>
    <text x="35" y="103" fill="white" font-size="7.5">SCL (A5)</text>

    <!-- Ultrasonic HC-SR04 -->
    <rect x="115" y="25" width="80" height="42" rx="4" fill="#0284C7" stroke="#0369A1"/>
    <!-- 2 Cylinders -->
    <circle cx="135" cy="46" r="13" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <text x="131" y="50" font-size="10" font-weight="bold" fill="#475569">T</text>
    <circle cx="175" cy="46" r="13" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <text x="171" y="50" font-size="10" font-weight="bold" fill="#475569">R</text>
    <text x="120" y="18" fill="#0284C7" font-size="8" font-weight="bold">HC-SR04</text>

    <!-- LCD 16x2 I2C Display -->
    <rect x="115" y="85" width="100" height="55" rx="4" fill="#047857" stroke="#065F46" stroke-width="1.5"/>
    <rect x="125" y="93" width="80" height="30" rx="2" fill="#064E3B"/>
    <text x="130" y="106" fill="#34D399" font-family="monospace" font-size="8">Jarak Benda:</text>
    <text x="130" y="118" fill="#34D399" font-family="monospace" font-size="9" font-weight="bold">25 cm</text>
    <text x="120" y="152" fill="#047857" font-size="8" font-weight="bold">LCD I2C (4 Kabel)</text>

    <!-- Sound waves -->
    <path d="M195 40 Q215 46 195 52" stroke="#38BDF8" stroke-width="2" fill="none"/>
    <path d="M205 34 Q230 46 205 58" stroke="#38BDF8" stroke-width="2" fill="none"/>
    
    <!-- Target Object -->
    <rect x="235" y="30" width="16" height="35" rx="3" fill="#F59E0B"/>
    <text x="255" y="50" fill="#B45309" font-size="8" font-weight="bold">Rintangan</text>

    <!-- Connections -->
    <path d="M85 50 L115 50" stroke="#8B5CF6" stroke-width="2"/>
    <path d="M85 65 L115 65" stroke="#EC4899" stroke-width="2"/>
    <path d="M85 85 C95 85 105 105 115 105" stroke="#10B981" stroke-width="2" fill="none"/>
    <path d="M85 100 C95 100 105 115 115 115" stroke="#F59E0B" stroke-width="2" fill="none"/>
  </svg>
  `;
}

// Diagram Circuit Proyek 8: Blynk IoT (ESP32 + WiFi + Phone)
function circuitBlynkSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 340 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="340" height="160" rx="10" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5"/>
    
    <!-- ESP32 Board -->
    <rect x="15" y="25" width="80" height="110" rx="6" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <rect x="35" y="30" width="40" height="16" rx="2" fill="#0F172A"/>
    <path d="M40 38 L45 32 L50 38 L55 32 L60 38 L65 32 L70 38" stroke="#F59E0B" stroke-width="1.5" fill="none"/>
    <rect x="30" y="55" width="50" height="35" rx="2" fill="#CBD5E1"/>
    <text x="35" y="75" fill="#0F172A" font-size="7" font-weight="bold">ESP32</text>
    <circle cx="85" cy="100" r="3" fill="#EAB308" stroke="white"/>
    <text x="35" y="103" fill="#38BDF8" font-size="7">GPIO 2 (LED)</text>

    <!-- Cloud Server (Blynk Cloud) -->
    <g transform="translate(130, 25)">
      <path d="M25 35 A15 15 0 0 1 50 25 A22 22 0 0 1 85 30 A18 18 0 0 1 80 50 L20 50 A15 15 0 0 1 25 35 Z" fill="#22C55E" fill-opacity="0.15" stroke="#22C55E" stroke-width="2"/>
      <text x="32" y="42" fill="#15803D" font-size="8" font-weight="bold">Blynk Cloud</text>
      <text x="38" y="58" fill="#15803D" font-size="7">🌐 Internet</text>
    </g>

    <!-- WiFi Wave Left -->
    <path d="M100 50 Q115 50 125 45" stroke="#22C55E" stroke-width="2" stroke-dasharray="3 3" fill="none"/>
    <!-- WiFi Wave Right -->
    <path d="M225 45 Q235 50 250 50" stroke="#22C55E" stroke-width="2" stroke-dasharray="3 3" fill="none"/>

    <!-- Smartphone with Blynk App -->
    <g transform="translate(250, 15)">
      <!-- Phone Frame -->
      <rect x="0" y="0" width="75" height="130" rx="10" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Screen -->
      <rect x="4" y="10" width="67" height="110" rx="6" fill="#1E293B"/>
      <!-- Top speaker / camera -->
      <circle cx="37" cy="5" r="1.5" fill="#64748B"/>
      <!-- Blynk Header -->
      <rect x="4" y="10" width="67" height="16" rx="6" fill="#22C55E"/>
      <text x="12" y="22" fill="white" font-size="8" font-weight="bold">Blynk IoT</text>
      <!-- Switch Widget (V0) -->
      <rect x="10" y="35" width="55" height="32" rx="6" fill="#334155"/>
      <text x="14" y="47" fill="#94A3B8" font-size="7">Lampu (V0)</text>
      <!-- Toggle ON -->
      <rect x="20" y="52" width="35" height="12" rx="6" fill="#22C55E"/>
      <circle cx="47" cy="58" r="5" fill="white"/>
      <text x="24" y="61" fill="white" font-size="7" font-weight="bold">ON</text>
      <!-- Gauge / Display (V1) -->
      <rect x="10" y="73" width="55" height="38" rx="6" fill="#334155"/>
      <text x="14" y="85" fill="#94A3B8" font-size="7">Suhu (V1)</text>
      <text x="20" y="101" fill="#38BDF8" font-size="12" font-weight="bold">28.5 °C</text>
    </g>

    <!-- LED Connected to ESP32 GPIO 2 -->
    <g transform="translate(105, 90)">
      <path d="M10 20 C10 10 22 10 22 20 L22 28 L10 28 Z" fill="#38BDF8" stroke="#0284C7" stroke-width="1.5"/>
      <circle cx="16" cy="18" r="12" fill="#38BDF8" fill-opacity="0.25"/>
      <text x="0" y="42" fill="#0284C7" font-size="8" font-weight="bold">LED (Pin 2)</text>
      <line x1="-20" y1="10" x2="10" y2="24" stroke="#38BDF8" stroke-width="2"/>
    </g>
  </svg>
  `;
}

module.exports = {
  mascotSVG,
  arduinoUnoSVG,
  esp32BoardSVG,
  breadboardSVG,
  circuitBlinkSVG,
  circuitButtonSVG,
  circuitLdrSVG,
  circuitPotentiometerSVG,
  circuitServoSVG,
  circuitUltrasonicLcdSVG,
  circuitBlynkSVG
};
