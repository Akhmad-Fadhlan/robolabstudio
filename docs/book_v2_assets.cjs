// book_v2_assets.cjs - Real Hardware Images & Realistic Wiring Schematics
const fs = require('fs');
const path = require('path');

// Helper to load file as base64 data URI
function loadDataUri(filename, mimeType) {
  const p = path.join(__dirname, '../public', filename);
  if (fs.existsSync(p)) {
    const b64 = fs.readFileSync(p).toString('base64');
    return `data:${mimeType};base64,${b64}`;
  }
  return '';
}

const realArduinoUri = loadDataUri('Arduino-Fixed.svg', 'image/svg+xml');
const realEsp32Uri = loadDataUri('1666364456Esp32_devkitc_v4.svg', 'image/svg+xml');
const realLedUri = loadDataUri('led.png', 'image/png');
const realButtonUri = loadDataUri('pushButton.png', 'image/png');
const realPotUri = loadDataUri('potentiometer.png', 'image/png');
const realServoUri = loadDataUri('servo.png', 'image/png');
const realMotorDcUri = loadDataUri('motorDC.png', 'image/png');
const realUltrasonicUri = loadDataUri('sensorUltrasonicDistance4Pin.png', 'image/png');
const realLcdUri = loadDataUri('displayLCD16x2I2C.png', 'image/png');
const realLogoUri = loadDataUri('icon.png', 'image/png');

// Friendly Mascot RoboBot
function mascotSVG(emotion = 'happy', size = 60) {
  let accessory = '';
  let eyes = '<ellipse cx="32" cy="35" rx="5" ry="6" fill="#38BDF8"/><ellipse cx="48" cy="35" rx="5" ry="6" fill="#38BDF8"/>';
  
  if (emotion === 'smart') {
    accessory = `
      <g transform="translate(56, 4)">
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
  } else if (emotion === 'soccer') {
    accessory = `
      <g transform="translate(6, 48)">
        <circle cx="12" cy="12" r="10" fill="#FFFFFF" stroke="#0F172A" stroke-width="1.5"/>
        <polygon points="12,7 16,10 14,15 10,15 8,10" fill="#0F172A"/>
      </g>
    `;
  }

  return `
  <svg width="${size}" height="${size}" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.1));">
    <line x1="40" y1="14" x2="40" y2="5" stroke="#64748B" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="4" r="4" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"/>
    <rect x="12" y="25" width="6" height="12" rx="2" fill="#F59E0B"/>
    <rect x="62" y="25" width="6" height="12" rx="2" fill="#F59E0B"/>
    <rect x="17" y="14" width="46" height="36" rx="10" fill="#38BDF8" stroke="#0284C7" stroke-width="2.5"/>
    <rect x="22" y="22" width="36" height="20" rx="6" fill="#0F172A"/>
    ${eyes}
    <circle cx="34" cy="33" r="1.5" fill="#FFFFFF"/>
    <circle cx="50" cy="33" r="1.5" fill="#FFFFFF"/>
    <path d="M36 40 Q40 43 44 40" stroke="#38BDF8" stroke-width="2" stroke-linecap="round"/>
    <rect x="36" y="50" width="8" height="4" fill="#64748B"/>
    <rect x="21" y="54" width="38" height="22" rx="7" fill="#E2E8F0" stroke="#94A3B8" stroke-width="2"/>
    <circle cx="40" cy="65" r="5" fill="#EF4444"/>
    <path d="M40 62 L42 65 L38 65 Z" fill="#FFFFFF"/>
    <path d="M21 58 C13 62 13 70 19 72" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <path d="M59 58 C67 62 67 70 61 72" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    ${accessory}
  </svg>
  `;
}

// Diagram UI RoboLab Studio
function robolabStudioUiSVG(width = 480, height = 230) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 560 270" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="560" height="270" rx="8" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    <rect x="2" y="2" width="556" height="38" rx="6" fill="#0F172A"/>
    <circle cx="20" cy="21" r="10" fill="#0284C7"/>
    <text x="36" y="25" fill="white" font-family="'Fredoka', sans-serif" font-weight="bold" font-size="13">RoboLab Studio</text>
    <rect x="135" y="14" width="35" height="14" rx="3" fill="#38BDF8" fill-opacity="0.2"/>
    <text x="138" y="24" fill="#38BDF8" font-size="8" font-weight="bold">v0.9.2</text>
    <rect x="180" y="10" width="95" height="22" rx="4" fill="#1E293B" stroke="#475569"/>
    <text x="188" y="24" fill="#E2E8F0" font-size="9">Board: Arduino Uno ▼</text>
    <rect x="282" y="10" width="65" height="22" rx="4" fill="#1E293B" stroke="#475569"/>
    <text x="290" y="24" fill="#E2E8F0" font-size="9">COM3 ▼</text>
    <rect x="353" y="10" width="70" height="22" rx="4" fill="#22C55E"/>
    <text x="362" y="24" fill="white" font-weight="bold" font-size="9.5">▶ Upload</text>
    <rect x="430" y="10" width="55" height="22" rx="4" fill="#334155"/>
    <text x="438" y="24" fill="#38BDF8" font-size="9">C++ Code</text>
    <rect x="492" y="10" width="60" height="22" rx="4" fill="#0284C7"/>
    <text x="498" y="24" fill="white" font-size="9">🖥️ Serial</text>
    <rect x="2" y="40" width="135" height="228" fill="#1E293B" stroke="#334155" stroke-width="1"/>
    <text x="12" y="58" fill="#94A3B8" font-size="8" font-weight="bold" letter-spacing="1">KATEGORI BLOK</text>
    <g transform="translate(10, 66)">
      <rect x="0" y="0" width="118" height="18" rx="4" fill="#FF6680" fill-opacity="0.2"/>
      <circle cx="8" cy="9" r="4" fill="#FF6680"/>
      <text x="18" y="12" fill="#FFA4B6" font-size="8.5" font-weight="bold">Structure (Setup/Loop)</text>
      <rect x="0" y="22" width="118" height="18" rx="4" fill="#4C97FF" fill-opacity="0.2"/>
      <circle cx="8" cy="31" r="4" fill="#4C97FF"/>
      <text x="18" y="34" fill="#93C5FD" font-size="8.5" font-weight="bold">Logic & Control</text>
      <rect x="0" y="44" width="118" height="18" rx="4" fill="#9966FF" fill-opacity="0.2"/>
      <circle cx="8" cy="53" r="4" fill="#9966FF"/>
      <text x="18" y="56" fill="#C4B5FD" font-size="8.5" font-weight="bold">Pins (Digital/Analog)</text>
      <rect x="0" y="66" width="118" height="18" rx="4" fill="#A855F7" fill-opacity="0.2"/>
      <circle cx="8" cy="75" r="4" fill="#A855F7"/>
      <text x="18" y="78" fill="#E9D5FF" font-size="8.5" font-weight="bold">Sensors (Sonar/LDR)</text>
      <rect x="0" y="88" width="118" height="18" rx="4" fill="#FF6D00" fill-opacity="0.2"/>
      <circle cx="8" cy="97" r="4" fill="#FF6D00"/>
      <text x="18" y="100" fill="#FDBA74" font-size="8.5" font-weight="bold">Motors & Actuators</text>
      <rect x="0" y="110" width="118" height="18" rx="4" fill="#22C55E" fill-opacity="0.2"/>
      <circle cx="8" cy="119" r="4" fill="#22C55E"/>
      <text x="18" y="122" fill="#86EFAC" font-size="8.5" font-weight="bold">IoT Blynk ESP32</text>
      <rect x="0" y="132" width="118" height="18" rx="4" fill="#06B6D4" fill-opacity="0.2"/>
      <circle cx="8" cy="141" r="4" fill="#06B6D4"/>
      <text x="18" y="144" fill="#A5F3FC" font-size="8.5" font-weight="bold">Displays (LCD I2C)</text>
    </g>
    <rect x="140" y="42" width="418" height="224" fill="#F8FAFC"/>
    ${[...Array(10)].map((_, r) => 
      [...Array(18)].map((_, c) => `<circle cx="${160 + c * 22}" cy="${55 + r * 20}" r="1" fill="#CBD5E1"/>`).join('')
    ).join('')}
    <g transform="translate(160, 55)">
      <rect x="0" y="0" width="160" height="24" rx="4" fill="#FF6680"/>
      <text x="8" y="16" fill="white" font-family="'Fredoka', sans-serif" font-weight="bold" font-size="10">void setup() {</text>
      <rect x="0" y="24" width="14" height="26" fill="#FF6680"/>
      <rect x="18" y="27" width="140" height="18" rx="3" fill="#4CBFE6"/>
      <text x="24" y="39" fill="white" font-size="8.5">Serial.println "Robot Siap!"</text>
      <rect x="0" y="50" width="160" height="12" rx="4" fill="#FF6680"/>
      <text x="8" y="59" fill="white" font-weight="bold" font-size="9">}</text>
    </g>
    <g transform="translate(160, 125)">
      <rect x="0" y="0" width="170" height="24" rx="4" fill="#FFAB19"/>
      <text x="8" y="16" fill="white" font-family="'Fredoka', sans-serif" font-weight="bold" font-size="10">void loop() {</text>
      <rect x="0" y="24" width="14" height="74" fill="#FFAB19"/>
      <rect x="18" y="27" width="150" height="18" rx="3" fill="#9966FF"/>
      <text x="24" y="39" fill="white" font-size="8.5">digitalWrite Pin 13 to HIGH</text>
      <rect x="18" y="49" width="105" height="18" rx="3" fill="#FF4081"/>
      <text x="24" y="61" fill="white" font-size="8.5">delay 1000 ms</text>
      <rect x="18" y="71" width="150" height="18" rx="3" fill="#9966FF"/>
      <text x="24" y="83" fill="white" font-size="8.5">digitalWrite Pin 13 to LOW</text>
      <rect x="0" y="98" width="170" height="12" rx="4" fill="#FFAB19"/>
      <text x="8" y="107" fill="white" font-weight="bold" font-size="9">}</text>
    </g>
    <g transform="translate(515, 205)">
      <circle cx="15" cy="0" r="10" fill="white" stroke="#CBD5E1"/>
      <text x="11" y="4" fill="#475569" font-weight="bold" font-size="12">+</text>
      <circle cx="15" cy="24" r="10" fill="white" stroke="#CBD5E1"/>
      <text x="12" y="27" fill="#475569" font-weight="bold" font-size="12">-</text>
      <circle cx="15" cy="48" r="10" fill="#FEE2E2" stroke="#FCA5A5"/>
      <text x="11" y="52" font-size="9">🗑️</text>
    </g>
  </svg>
  `;
}

// Diagram Breadboard Mini
function breadboardSVG(width = 300, height = 110) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="5" width="310" height="110" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
    <line x1="15" y1="18" x2="305" y2="18" stroke="#EF4444" stroke-width="2"/>
    <line x1="15" y1="28" x2="305" y2="28" stroke="#3B82F6" stroke-width="2"/>
    <text x="8" y="21" fill="#EF4444" font-size="11" font-weight="bold">+</text>
    <text x="8" y="31" fill="#3B82F6" font-size="13" font-weight="bold">-</text>
    <line x1="15" y1="92" x2="305" y2="92" stroke="#EF4444" stroke-width="2"/>
    <line x1="15" y1="102" x2="305" y2="102" stroke="#3B82F6" stroke-width="2"/>
    <text x="8" y="95" fill="#EF4444" font-size="11" font-weight="bold">+</text>
    <text x="8" y="105" fill="#3B82F6" font-size="13" font-weight="bold">-</text>
    <rect x="15" y="58" width="290" height="4" fill="#E2E8F0"/>
    ${[...Array(20)].map((_, col) => {
      const cx = 25 + col * 14;
      return `
        <circle cx="${cx}" cy="18" r="2" fill="#64748B"/>
        <circle cx="${cx}" cy="28" r="2" fill="#64748B"/>
        <circle cx="${cx}" cy="38" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="44" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="50" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="70" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="76" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="82" r="2" fill="#94A3B8"/>
        <circle cx="${cx}" cy="92" r="2" fill="#64748B"/>
        <circle cx="${cx}" cy="102" r="2" fill="#64748B"/>
      `;
    }).join('')}
  </svg>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// RANGKAIAN REALISTIK ARDUINO + KOMPONEN ASLI
// ─────────────────────────────────────────────────────────────────────────────

// 1. RANGKAIAN LED LANGSUNG TANPA RESISTOR & GND TERHUBUNG SOLID (REAL ARDUINO & REAL LED)
function circuitLedDirectSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Real Arduino Uno Graphic on Left -->
    <g transform="translate(10, 15)">
      <image href="${realArduinoUri}" x="0" y="0" width="170" height="120" />
      <!-- Pointer indicators on real pin headers -->
      <circle cx="112" cy="19" r="3.5" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.2"/>
      <text x="105" y="11" fill="#DC2626" font-size="7.5" font-weight="bold">Pin 13</text>
      
      <circle cx="103" cy="19" r="3.5" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.2"/>
      <text x="82" y="11" fill="#2563EB" font-size="7.5" font-weight="bold">GND</text>
      <text x="45" y="132" fill="#00878F" font-family="'Fredoka', sans-serif" font-weight="bold" font-size="9.5">Arduino Uno R3 Real</text>
    </g>

    <!-- Real LED on Right -->
    <g transform="translate(225, 20)">
      <!-- Glow effect -->
      <circle cx="50" cy="55" r="30" fill="#EF4444" fill-opacity="0.25"/>
      <image href="${realLedUri}" x="0" y="0" width="100" height="100" />
      
      <!-- Pin Contact Dots at the bottom of LED legs -->
      <!-- Anode (+) Left Leg -->
      <circle cx="36" cy="94" r="4" fill="#DC2626" stroke="#FFFFFF" stroke-width="1.5"/>
      <text x="10" y="112" fill="#DC2626" font-size="8.5" font-weight="bold">Anoda (+)</text>

      <!-- Cathode (-) Right Leg -->
      <circle cx="62" cy="94" r="4" fill="#2563EB" stroke="#FFFFFF" stroke-width="1.5"/>
      <text x="50" y="112" fill="#2563EB" font-size="8.5" font-weight="bold">Katoda (-)</text>

      <text x="18" y="128" fill="#1E293B" font-family="'Fredoka', sans-serif" font-weight="bold" font-size="10">Lampu LED 5mm</text>
    </g>

    <!-- REAL SOLID WIRES (UNBROKEN, CONTINUOUS, HIGH VISIBILITY) -->
    <!-- Red Wire: Pin 13 header to LED Anode (+) -->
    <path d="M 122 34 C 155 34, 200 70, 261 114" stroke="#DC2626" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="122" cy="34" r="3" fill="#DC2626"/>
    <circle cx="261" cy="114" r="3" fill="#DC2626"/>
    <text x="160" y="45" fill="#DC2626" font-size="8.5" font-weight="bold">Kabel Pin 13 (+)</text>

    <!-- Blue Wire: GND header directly to LED Cathode (-) — SOLID UNBROKEN CONTINUOUS -->
    <path d="M 113 34 C 135 15, 230 45, 287 114" stroke="#2563EB" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="113" cy="34" r="3" fill="#2563EB"/>
    <circle cx="287" cy="114" r="3" fill="#2563EB"/>
    <text x="165" y="25" fill="#2563EB" font-size="8.5" font-weight="bold">Jalur GND Terhubung Rapat (-)</text>

    <!-- Badge Info -->
    <rect x="15" y="145" width="330" height="18" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="25" y="157" fill="#991B1B" font-size="8.5" font-weight="bold">⚡ RANGKAIAN LANGSUNG: Kaki LED langsung terpasang ke Pin 13 dan GND tanpa resistor!</text>
  </svg>
  `;
}

// 2. RANGKAIAN PUSH BUTTON + LED (REAL ARDUINO & REAL BUTTON)
function circuitButtonRealSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Real Arduino Uno Graphic on Left -->
    <g transform="translate(10, 15)">
      <image href="${realArduinoUri}" x="0" y="0" width="165" height="116" />
      <circle cx="108" cy="18" r="3" fill="#EF4444"/>
      <circle cx="140" cy="18" r="3" fill="#8B5CF6"/>
      <circle cx="85" cy="104" r="3" fill="#EF4444"/>
      <circle cx="95" cy="104" r="3" fill="#2563EB"/>
    </g>

    <!-- Real Push Button Center -->
    <g transform="translate(185, 45)">
      <image href="${realButtonUri}" x="0" y="0" width="65" height="65" />
      <text x="2" y="78" fill="#1E293B" font-weight="bold" font-size="9">Push Button</text>
    </g>

    <!-- Real LED Right -->
    <g transform="translate(275, 40)">
      <image href="${realLedUri}" x="0" y="0" width="70" height="70" />
      <text x="15" y="82" fill="#DC2626" font-weight="bold" font-size="9">LED Hijau</text>
    </g>

    <!-- Wires connecting clearly -->
    <path d="M 95 119 C 130 145, 170 115, 195 95" stroke="#EF4444" stroke-width="2.5" fill="none"/>
    <text x="125" y="140" fill="#EF4444" font-size="8" font-weight="bold">5V ke Tombol</text>

    <path d="M 150 33 C 165 33, 190 55, 215 75" stroke="#8B5CF6" stroke-width="2.5" fill="none"/>
    <text x="155" y="45" fill="#8B5CF6" font-size="8" font-weight="bold">Pin 2 (Sinyal)</text>

    <path d="M 118 33 C 160 15, 240 25, 298 90" stroke="#16A34A" stroke-width="2.5" fill="none"/>
    <text x="200" y="18" fill="#16A34A" font-size="8" font-weight="bold">Pin 13 ke LED</text>

    <path d="M 105 119 C 150 160, 260 160, 320 95" stroke="#2563EB" stroke-width="2.5" fill="none"/>
    <text x="200" y="160" fill="#2563EB" font-size="8" font-weight="bold">GND Bersama Rapat (-)</text>
  </svg>
  `;
}

// 3. RANGKAIAN RELAY 5V MODUL
function circuitRelayModuleSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <g transform="translate(10, 20)">
      <image href="${realArduinoUri}" x="0" y="0" width="155" height="110" />
      <text x="40" y="125" fill="#00878F" font-weight="bold" font-size="9">Arduino Uno R3</text>
    </g>
    <g transform="translate(180, 25)">
      <rect width="80" height="95" rx="5" fill="#1E40AF" stroke="#1D4ED8" stroke-width="2"/>
      <rect x="10" y="12" width="60" height="42" rx="3" fill="#0284C7"/>
      <text x="16" y="32" fill="white" font-weight="bold" font-size="8.5">SONGLE</text>
      <text x="14" y="44" fill="white" font-size="6.5">5V DC / 250V AC</text>
      <circle cx="0" cy="22" r="3" fill="#EAB308"/>
      <circle cx="0" cy="48" r="3" fill="#EF4444"/>
      <circle cx="0" cy="74" r="3" fill="#3B82F6"/>
      <text x="5" y="25" fill="white" font-size="7">IN</text>
      <text x="5" y="51" fill="white" font-size="7">VCC</text>
      <text x="5" y="77" fill="white" font-size="7">GND</text>
      <rect x="65" y="65" width="15" height="25" fill="#047857"/>
      <text x="25" y="85" fill="white" font-size="7" font-weight="bold">NO COM</text>
      <text x="12" y="110" fill="#1E40AF" font-weight="bold" font-size="9">Modul Relay 5V</text>
    </g>
    <g transform="translate(285, 30)">
      <circle cx="30" cy="30" r="18" fill="#FEF08A" stroke="#EAB308" stroke-width="2"/>
      <path d="M25 30 Q30 20 35 30" stroke="#CA8A04" stroke-width="1.5" fill="none"/>
      <rect x="25" y="48" width="10" height="8" rx="2" fill="#94A3B8"/>
      <text x="5" y="68" fill="#A16207" font-weight="bold" font-size="8.5">Lampu 220V</text>
      <rect x="15" y="80" width="30" height="18" rx="2" fill="#334155"/>
      <text x="10" y="110" fill="#EF4444" font-weight="bold" font-size="8">⚡ Listrik PLN</text>
    </g>
    <path d="M 140 33 C 155 33, 165 47, 180 47" stroke="#9966FF" stroke-width="2.5" fill="none"/>
    <path d="M 95 124 C 130 145, 165 85, 180 73" stroke="#EF4444" stroke-width="2.5" fill="none"/>
    <path d="M 105 124 C 140 155, 170 110, 180 99" stroke="#2563EB" stroke-width="2.5" fill="none"/>
    <path d="M 260 90 L 300 80" stroke="#EAB308" stroke-width="2"/>
  </svg>
  `;
}

// 3B. RANGKAIAN POTENSIOMETER & LED DIMMER (REAL ARDUINO, REAL POT, REAL LED)
function circuitPotRealSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Real Arduino Uno on Left -->
    <g transform="translate(10, 15)">
      <image href="${realArduinoUri}" x="0" y="0" width="155" height="110" />
      <circle cx="80" cy="98" r="3" fill="#EF4444"/>
      <circle cx="89" cy="98" r="3" fill="#2563EB"/>
      <circle cx="132" cy="98" r="3" fill="#10B981"/>
      <text x="125" y="112" fill="#059669" font-size="7.5" font-weight="bold">A0</text>
      <!-- PWM Pin 9 -->
      <circle cx="118" cy="17" r="3" fill="#8B5CF6"/>
      <text x="110" y="9" fill="#7C3AED" font-size="7.5" font-weight="bold">~9</text>
    </g>

    <!-- Real Potentiometer Center -->
    <g transform="translate(180, 25)">
      <image href="${realPotUri}" x="0" y="0" width="70" height="70" />
      <text x="2" y="76" fill="#0284C7" font-weight="bold" font-size="8.5">Potensiometer 10k</text>
    </g>

    <!-- Real LED Right -->
    <g transform="translate(275, 25)">
      <image href="${realLedUri}" x="0" y="0" width="70" height="70" />
      <text x="8" y="76" fill="#DC2626" font-weight="bold" font-size="8.5">LED Dimmer</text>
    </g>

    <!-- Wires Potentiometer: 5V (Red), A0 Wiper (Green), GND (Blue) -->
    <path d="M 90 113 C 120 145, 160 120, 190 75" stroke="#EF4444" stroke-width="2.5" fill="none"/>
    <text x="115" y="145" fill="#EF4444" font-size="7.5" font-weight="bold">5V Potensio</text>

    <path d="M 142 113 C 160 135, 180 110, 212 75" stroke="#10B981" stroke-width="2.5" fill="none"/>
    <text x="155" y="125" fill="#059669" font-size="7.5" font-weight="bold">Pin A0 (Sinyal)</text>

    <path d="M 99 113 C 130 155, 190 140, 235 75" stroke="#2563EB" stroke-width="2.5" fill="none"/>
    <text x="175" y="155" fill="#2563EB" font-size="7.5" font-weight="bold">GND Potensio</text>

    <!-- Wires LED: Pin ~9 to Anode, GND to Cathode -->
    <path d="M 128 32 C 180 10, 240 15, 295 75" stroke="#8B5CF6" stroke-width="2.5" fill="none"/>
    <text x="195" y="15" fill="#7C3AED" font-size="7.5" font-weight="bold">Pin PWM ~9 ke LED (+)</text>

    <path d="M 99 113 C 150 165, 250 165, 315 75" stroke="#2563EB" stroke-width="2.5" fill="none"/>
    <text x="245" y="160" fill="#2563EB" font-size="7.5" font-weight="bold">GND Rapat (-)</text>
  </svg>
  `;
}

// 4. RANGKAIAN MOTOR SERVO (REAL ARDUINO & REAL SERVO)
function circuitServoRealSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 170" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="170" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <g transform="translate(10, 20)">
      <image href="${realArduinoUri}" x="0" y="0" width="160" height="113" />
      <circle cx="120" cy="18" r="3" fill="#F97316"/>
      <text x="110" y="10" fill="#EA580C" font-size="7.5" font-weight="bold">Pin ~9</text>
      <circle cx="85" cy="102" r="3" fill="#EF4444"/>
      <circle cx="95" cy="102" r="3" fill="#78350F"/>
    </g>
    <g transform="translate(230, 25)">
      <image href="${realServoUri}" x="0" y="0" width="105" height="105" />
      <text x="18" y="125" fill="#0284C7" font-weight="bold" font-size="10">Micro Servo SG90</text>
    </g>
    <!-- 3 Servo Wires -->
    <path d="M 130 38 C 160 20, 210 25, 240 55" stroke="#F97316" stroke-width="3" fill="none"/>
    <text x="160" y="30" fill="#EA580C" font-size="8" font-weight="bold">Oranye: Sinyal ~9</text>

    <path d="M 95 122 C 140 145, 200 90, 240 65" stroke="#EF4444" stroke-width="3" fill="none"/>
    <text x="165" y="100" fill="#DC2626" font-size="8" font-weight="bold">Merah: 5V</text>

    <path d="M 105 122 C 150 155, 210 110, 240 75" stroke="#78350F" stroke-width="3" fill="none"/>
    <text x="165" y="135" fill="#78350F" font-size="8" font-weight="bold">Cokelat: GND Rapat</text>
  </svg>
  `;
}

// 5. RANGKAIAN LCD 16X2 I2C (REAL ARDUINO UNO & REAL LCD 1602 I2C BACKPACK)
function circuitLcdRealSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 380 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="380" height="180" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Real Arduino Uno on Left -->
    <g transform="translate(10, 20)">
      <image href="${realArduinoUri}" x="0" y="0" width="155" height="110" />
      <text x="35" y="126" fill="#00878F" font-weight="bold" font-size="9">Arduino Uno R3</text>
      <!-- Power pins 5V & GND -->
      <circle cx="80" cy="98" r="3.5" fill="#EF4444" stroke="#FFF" stroke-width="1"/>
      <text x="73" y="112" fill="#DC2626" font-size="7" font-weight="bold">5V</text>
      <circle cx="89" cy="98" r="3.5" fill="#1E293B" stroke="#FFF" stroke-width="1"/>
      <text x="83" y="112" fill="#1E293B" font-size="7" font-weight="bold">GND</text>
      <!-- Analog I2C pins A4 & A5 -->
      <circle cx="132" cy="98" r="3.5" fill="#10B981" stroke="#FFF" stroke-width="1"/>
      <text x="123" y="112" fill="#059669" font-size="7" font-weight="bold">A4(SDA)</text>
      <circle cx="141" cy="98" r="3.5" fill="#F59E0B" stroke="#FFF" stroke-width="1"/>
      <text x="138" y="120" fill="#D97706" font-size="7" font-weight="bold">A5(SCL)</text>
    </g>

    <!-- REALISTIC LCD 16X2 WITH I2C BACKPACK -->
    <g transform="translate(180, 18)">
      <!-- Main Green PCB of LCD 1602 -->
      <rect width="190" height="92" rx="4" fill="#047857" stroke="#064E3B" stroke-width="1.5"/>
      <!-- 4 Corner Mounting Screw Holes -->
      <circle cx="8" cy="8" r="3.5" fill="#E2E8F0" stroke="#94A3B8"/>
      <circle cx="182" cy="8" r="3.5" fill="#E2E8F0" stroke="#94A3B8"/>
      <circle cx="8" cy="84" r="3.5" fill="#E2E8F0" stroke="#94A3B8"/>
      <circle cx="182" cy="84" r="3.5" fill="#E2E8F0" stroke="#94A3B8"/>

      <!-- Metal Bezel Frame around Glass -->
      <rect x="18" y="15" width="138" height="60" rx="3" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
      <!-- Blue Backlit LCD Screen -->
      <rect x="23" y="20" width="128" height="50" rx="2" fill="#1E3A8A"/>
      <!-- Pixel Matrix Characters Glowing Cyan -->
      <text x="28" y="38" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="bold">RoboLab Studio</text>
      <text x="28" y="52" fill="#38BDF8" font-family="'JetBrains Mono', monospace" font-size="8.5">I2C Addr: 0x27</text>
      <text x="28" y="64" fill="#60A5FA" font-family="'JetBrains Mono', monospace" font-size="7">Skor: 3 - 1 GOAL</text>

      <!-- I2C Backpack Module attached on Right -->
      <g transform="translate(155, 12)">
        <!-- Black PCB of PCF8574 Adapter -->
        <rect width="32" height="66" rx="2" fill="#18181B" stroke="#3F3F46" stroke-width="1"/>
        <text x="4" y="9" fill="#A1A1AA" font-size="5.5" font-weight="bold">PCF8574</text>
        <text x="4" y="16" fill="#4ADE80" font-size="5" font-weight="bold">I2C MODUL</text>
        <!-- Blue Trimmer Potentiometer for Contrast -->
        <rect x="6" y="20" width="12" height="12" fill="#2563EB" stroke="#1D4ED8"/>
        <circle cx="12" cy="26" r="3.5" fill="#FFFFFF"/>
        <line x1="10" y1="26" x2="14" y2="26" stroke="#94A3B8" stroke-width="1"/>
        <line x1="12" y1="24" x2="12" y2="28" stroke="#94A3B8" stroke-width="1"/>
        
        <!-- 4-Pin Right Angle Header clearly protruding & labeled -->
        <g transform="translate(20, 16)">
          <!-- Pin 1: GND -->
          <circle cx="6" cy="10" r="3" fill="#1E293B" stroke="#FFFFFF" stroke-width="1"/>
          <text x="12" y="13" fill="#1E293B" font-size="7.5" font-weight="bold">GND</text>
          <!-- Pin 2: VCC -->
          <circle cx="6" cy="20" r="3" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
          <text x="12" y="23" fill="#DC2626" font-size="7.5" font-weight="bold">VCC</text>
          <!-- Pin 3: SDA -->
          <circle cx="6" cy="30" r="3" fill="#10B981" stroke="#FFFFFF" stroke-width="1"/>
          <text x="12" y="33" fill="#059669" font-size="7.5" font-weight="bold">SDA</text>
          <!-- Pin 4: SCL -->
          <circle cx="6" cy="40" r="3" fill="#F59E0B" stroke="#FFFFFF" stroke-width="1"/>
          <text x="12" y="43" fill="#D97706" font-size="7.5" font-weight="bold">SCL</text>
        </g>
      </g>
    </g>

    <!-- REAL 4 JUMPER WIRES CONNECTING PRECISELY -->
    <!-- Black Wire: Arduino GND -> I2C Backpack GND -->
    <path d="M 99 118 C 115 155, 180 155, 206 44" stroke="#1E293B" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    
    <!-- Red Wire: Arduino 5V -> I2C Backpack VCC -->
    <path d="M 90 118 C 105 145, 175 140, 206 54" stroke="#EF4444" stroke-width="2.5" fill="none" stroke-linecap="round"/>

    <!-- Green Wire: Arduino A4 -> I2C Backpack SDA -->
    <path d="M 142 118 C 160 135, 185 110, 206 64" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>

    <!-- Yellow Wire: Arduino A5 -> I2C Backpack SCL -->
    <path d="M 151 118 C 170 145, 195 125, 206 74" stroke="#F59E0B" stroke-width="2.5" fill="none" stroke-linecap="round"/>

    <!-- Bottom Pinout Indicator Banner -->
    <rect x="15" y="148" width="350" height="22" rx="4" fill="#ECFDF5" stroke="#A7F3D0"/>
    <text x="22" y="162" fill="#065F46" font-size="8.5" font-weight="bold">⚡ KONEKSI ASLI I2C: GND ➔ GND | VCC ➔ 5V | SDA ➔ Pin A4 | SCL ➔ Pin A5</text>
  </svg>
  `;
}

// 6. RANGKAIAN ASLI L298 MINI (MX1508) DENGAN ESP32, BATERAI 7.4V & MOTOR TT
function circuitL298MiniSVG(width = 340, height = 160) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 380 185" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="380" height="185" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Real ESP32 on Left -->
    <g transform="translate(10, 25)">
      <image href="${realEsp32Uri}" x="0" y="0" width="95" height="120" />
      <text x="8" y="132" fill="#0F172A" font-weight="bold" font-size="8">ESP32 DevKit V4</text>
      <!-- Pin Indicators -->
      <circle cx="85" cy="52" r="3" fill="#8B5CF6"/>
      <text x="48" y="55" fill="#7C3AED" font-size="6.5" font-weight="bold">GPIO 18</text>
      <circle cx="85" cy="63" r="3" fill="#3B82F6"/>
      <text x="48" y="66" fill="#2563EB" font-size="6.5" font-weight="bold">GPIO 19</text>
      <circle cx="85" cy="74" r="3" fill="#F97316"/>
      <text x="48" y="77" fill="#EA580C" font-size="6.5" font-weight="bold">GPIO 22</text>
      <circle cx="85" cy="85" r="3" fill="#10B981"/>
      <text x="48" y="88" fill="#059669" font-size="6.5" font-weight="bold">GPIO 23</text>
      <!-- VIN & GND -->
      <circle cx="10" cy="52" r="3" fill="#EF4444"/>
      <text x="15" y="55" fill="#DC2626" font-size="6.5" font-weight="bold">VIN</text>
      <circle cx="10" cy="63" r="3" fill="#1E293B"/>
      <text x="15" y="66" fill="#1E293B" font-size="6.5" font-weight="bold">GND</text>
    </g>

    <!-- REAL 2x 18650 LI-ION BATTERY PACK (7.4V) -->
    <g transform="translate(125, 8)">
      <rect width="115" height="38" rx="4" fill="#0F172A" stroke="#334155" stroke-width="1.5"/>
      <!-- Two 18650 Battery Cylinders (Blue) -->
      <rect x="6" y="6" width="48" height="26" rx="2" fill="#0284C7"/>
      <rect x="58" y="6" width="48" height="26" rx="2" fill="#0284C7"/>
      <text x="10" y="22" fill="#E0F2FE" font-size="6.5" font-weight="bold">18650 3.7V</text>
      <text x="62" y="22" fill="#E0F2FE" font-size="6.5" font-weight="bold">18650 3.7V</text>
      <text x="11" y="34" fill="#38BDF8" font-size="6" font-weight="bold">Baterai Robot (Total 7.4V)</text>
      <!-- Battery Leads -->
      <circle cx="110" cy="12" r="2.5" fill="#EF4444"/>
      <circle cx="110" cy="26" r="2.5" fill="#1E293B"/>
    </g>

    <!-- REAL L298 MINI (MX1508) RED PCB MODULE -->
    <g transform="translate(135, 55)">
      <!-- Red PCB Board -->
      <rect width="95" height="90" rx="5" fill="#DC2626" stroke="#991B1B" stroke-width="1.8"/>
      <!-- Solder mounting holes -->
      <circle cx="8" cy="8" r="2.5" fill="#FDE047"/>
      <circle cx="87" cy="8" r="2.5" fill="#FDE047"/>
      <circle cx="8" cy="82" r="2.5" fill="#FDE047"/>
      <circle cx="87" cy="82" r="2.5" fill="#FDE047"/>

      <!-- Center IC MX1508 (SOIC-16) -->
      <rect x="25" y="28" width="45" height="26" rx="2" fill="#18181B" stroke="#27272A"/>
      <text x="29" y="42" fill="#FFFFFF" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="bold">MX1508</text>
      <text x="27" y="50" fill="#FDE047" font-size="6" font-weight="bold">L298 MINI</text>
      <!-- IC Pins on sides -->
      <line x1="22" y1="33" x2="25" y2="33" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="22" y1="38" x2="25" y2="38" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="22" y1="43" x2="25" y2="43" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="22" y1="48" x2="25" y2="48" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="70" y1="33" x2="73" y2="33" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="70" y1="38" x2="73" y2="38" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="70" y1="43" x2="73" y2="43" stroke="#CBD5E1" stroke-width="1.5"/>
      <line x1="70" y1="48" x2="73" y2="48" stroke="#CBD5E1" stroke-width="1.5"/>

      <!-- Top Terminals: + and - (Power from Battery) -->
      <rect x="30" y="4" width="35" height="14" rx="2" fill="#7F1D1D"/>
      <circle cx="39" cy="11" r="3" fill="#EF4444" stroke="#FFF" stroke-width="1"/>
      <text x="36" y="8" fill="#FFFFFF" font-size="6" font-weight="bold">+</text>
      <circle cx="56" cy="11" r="3" fill="#1E293B" stroke="#FFF" stroke-width="1"/>
      <text x="54" y="8" fill="#FFFFFF" font-size="6" font-weight="bold">-</text>

      <!-- Left Side: MOTOR-A Pads (Motor Kiri) -->
      <rect x="2" y="24" width="14" height="40" rx="2" fill="#7F1D1D"/>
      <circle cx="8" cy="34" r="3" fill="#FDE047" stroke="#92400E" stroke-width="1"/>
      <circle cx="8" cy="54" r="3" fill="#FDE047" stroke="#92400E" stroke-width="1"/>
      <text x="3" y="22" fill="#FFFFFF" font-size="5.5" font-weight="bold">MOTOR A</text>

      <!-- Right Side: MOTOR-B Pads (Motor Kanan) -->
      <rect x="79" y="24" width="14" height="40" rx="2" fill="#7F1D1D"/>
      <circle cx="86" cy="34" r="3" fill="#FDE047" stroke="#92400E" stroke-width="1"/>
      <circle cx="86" cy="54" r="3" fill="#FDE047" stroke="#92400E" stroke-width="1"/>
      <text x="73" y="22" fill="#FFFFFF" font-size="5.5" font-weight="bold">MOTOR B</text>

      <!-- Bottom Logic Control Pins: IN1, IN2, IN3, IN4 -->
      <rect x="18" y="72" width="60" height="12" rx="2" fill="#18181B"/>
      <circle cx="26" cy="78" r="2.5" fill="#8B5CF6"/>
      <circle cx="36" cy="78" r="2.5" fill="#3B82F6"/>
      <circle cx="58" cy="78" r="2.5" fill="#F97316"/>
      <circle cx="68" cy="78" r="2.5" fill="#10B981"/>
      <text x="22" y="70" fill="#FEF08A" font-size="6" font-weight="bold">IN1 IN2  IN3 IN4</text>
    </g>

    <!-- RIGHT SIDE: REALISTIC YELLOW GEARBOX TT MOTORS -->
    <!-- Left Motor (A) -->
    <g transform="translate(265, 30)">
      <rect x="0" y="5" width="48" height="24" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="1.2"/>
      <circle cx="10" cy="17" r="5" fill="#FFFFFF" stroke="#94A3B8"/>
      <!-- Wheel -->
      <rect x="44" y="0" width="12" height="34" rx="2" fill="#0F172A"/>
      <text x="0" y="38" fill="#854D0E" font-weight="bold" font-size="7.5">Motor Kiri (A)</text>
    </g>

    <!-- Right Motor (B) -->
    <g transform="translate(265, 95)">
      <rect x="0" y="5" width="48" height="24" rx="3" fill="#EAB308" stroke="#CA8A04" stroke-width="1.2"/>
      <circle cx="10" cy="17" r="5" fill="#FFFFFF" stroke="#94A3B8"/>
      <!-- Wheel -->
      <rect x="44" y="0" width="12" height="34" rx="2" fill="#0F172A"/>
      <text x="0" y="38" fill="#854D0E" font-weight="bold" font-size="7.5">Motor Kanan (B)</text>
    </g>

    <!-- WIRING: BATTERY TO L298 MINI AND ESP32 VIN/GND -->
    <path d="M 235 20 C 235 45, 174 45, 174 66" stroke="#EF4444" stroke-width="2.5" fill="none"/>
    <path d="M 174 66 C 140 66, 60 40, 20 77" stroke="#EF4444" stroke-width="2" stroke-dasharray="2 2" fill="none"/>
    
    <path d="M 235 34 C 235 55, 191 55, 191 66" stroke="#1E293B" stroke-width="2.5" fill="none"/>
    <path d="M 191 66 C 150 75, 60 50, 20 88" stroke="#1E293B" stroke-width="2" stroke-dasharray="2 2" fill="none"/>

    <!-- WIRING: MOTOR A & B TO TT MOTORS -->
    <path d="M 143 89 C 130 89, 130 50, 265 42" stroke="#CA8A04" stroke-width="2" fill="none"/>
    <path d="M 143 109 C 125 109, 125 60, 265 48" stroke="#CA8A04" stroke-width="2" stroke-dasharray="2 2" fill="none"/>
    <path d="M 221 89 C 240 89, 250 105, 265 105" stroke="#CA8A04" stroke-width="2" fill="none"/>
    <path d="M 221 109 C 240 109, 250 115, 265 115" stroke="#CA8A04" stroke-width="2" stroke-dasharray="2 2" fill="none"/>

    <!-- WIRING: ESP32 GPIO 18,19,22,23 TO IN1,IN2,IN3,IN4 -->
    <path d="M 95 77 C 120 77, 140 133, 161 133" stroke="#8B5CF6" stroke-width="2" fill="none"/>
    <path d="M 95 88 C 125 88, 145 133, 171 133" stroke="#3B82F6" stroke-width="2" fill="none"/>
    <path d="M 95 99 C 135 99, 165 133, 193 133" stroke="#F97316" stroke-width="2" fill="none"/>
    <path d="M 95 110 C 145 110, 175 133, 203 133" stroke="#10B981" stroke-width="2" fill="none"/>

    <!-- Bottom Summary Banner -->
    <rect x="15" y="156" width="350" height="20" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="20" y="169" fill="#991B1B" font-size="8" font-weight="bold">⚡ RANGKAIAN L298 MINI ASLI: Baterai 7.4V menyuplai Driver (+) & ESP32 (VIN), GND wajib disatukan!</text>
  </svg>
  `;
}

// 7. SASIS ROBOT SOCCER DENGAN L298 MINI (USER SPECIFIED)
function robotSoccerMiniL298ChassisSVG(width = 340, height = 170) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 360 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="360" height="180" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    
    <!-- Transparent Acrylic Chassis Base -->
    <rect x="75" y="20" width="210" height="140" rx="20" fill="#38BDF8" fill-opacity="0.12" stroke="#0284C7" stroke-width="2"/>
    
    <!-- Left Wheel & Real Yellow TT Motor -->
    <rect x="45" y="35" width="26" height="65" rx="5" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <!-- Yellow gearbox body -->
    <rect x="71" y="45" width="38" height="24" rx="2" fill="#EAB308" stroke="#CA8A04"/>
    <circle cx="80" cy="57" r="4" fill="#FFFFFF"/>
    <text x="35" y="112" fill="#0F172A" font-size="8" font-weight="bold">Roda Kiri</text>

    <!-- Right Wheel & Real Yellow TT Motor -->
    <rect x="289" y="35" width="26" height="65" rx="5" fill="#0F172A" stroke="#334155" stroke-width="2"/>
    <!-- Yellow gearbox body -->
    <rect x="251" y="45" width="38" height="24" rx="2" fill="#EAB308" stroke="#CA8A04"/>
    <circle cx="280" cy="57" r="4" fill="#FFFFFF"/>
    <text x="280" y="112" fill="#0F172A" font-size="8" font-weight="bold">Roda Kanan</text>

    <!-- Front Caster Ball (Roda Bebas Depan) -->
    <circle cx="180" cy="35" r="14" fill="#CBD5E1" stroke="#64748B" stroke-width="2"/>
    <circle cx="180" cy="35" r="8" fill="#F1F5F9"/>
    <text x="145" y="15" fill="#475569" font-size="7.5" font-weight="bold">Roda Bebas Caster</text>

    <!-- 2x 18650 Battery Holder in Center Deck -->
    <rect x="125" y="48" width="110" height="28" rx="3" fill="#0F172A" stroke="#334155"/>
    <rect x="128" y="52" width="50" height="20" rx="2" fill="#0284C7"/>
    <rect x="182" y="52" width="50" height="20" rx="2" fill="#0284C7"/>
    <text x="135" y="65" fill="#E0F2FE" font-size="6" font-weight="bold">18650 3.7V</text>
    <text x="189" y="65" fill="#E0F2FE" font-size="6" font-weight="bold">18650 3.7V</text>

    <!-- L298 MINI Module (Compact Red PCB in Center) -->
    <g transform="translate(148, 85)">
      <rect width="64" height="55" rx="4" fill="#DC2626" stroke="#991B1B" stroke-width="1.5"/>
      <rect x="16" y="12" width="32" height="18" rx="2" fill="#1E293B"/>
      <text x="19" y="24" fill="white" font-size="6.5" font-weight="bold">MX1508</text>
      <text x="18" y="30" fill="#FDE047" font-size="5">L298 MINI</text>
      <circle cx="6" cy="22" r="2.5" fill="#FDE047"/>
      <circle cx="6" cy="36" r="2.5" fill="#FDE047"/>
      <circle cx="58" cy="22" r="2.5" fill="#FDE047"/>
      <circle cx="58" cy="36" r="2.5" fill="#FDE047"/>
      <text x="4" y="48" fill="white" font-size="6" font-weight="bold">Driver Ringan</text>
    </g>

    <!-- Front Ball Guide / Kicker Bumper -->
    <path d="M 140 22 C 160 32, 200 32, 220 22" stroke="#EF4444" stroke-width="3" fill="none"/>
    <text x="145" y="28" fill="#DC2626" font-size="6.5" font-weight="bold">Bumper Penggiring</text>

    <!-- Orange Mini Soccer Ball -->
    <circle cx="180" cy="-2" r="12" fill="#F97316" stroke="#C2410C" stroke-width="1.5"/>
    <polygon points="180,-5 183,-3 182,1 178,1 177,-3" fill="#FFFFFF"/>
    <text x="200" y="5" fill="#EA580C" font-weight="bold" font-size="8.5">⚽ Bola Soccer</text>

    <!-- Badge Highlight L298 Mini -->
    <rect x="15" y="152" width="330" height="18" rx="4" fill="#FEF2F2" stroke="#FECACA"/>
    <text x="20" y="164" fill="#991B1B" font-size="8" font-weight="bold">⚡ DRIVER L298 MINI: Super ringkas, sangat enteng, akselerasi robot kencang tanpa beban berat!</text>
  </svg>
  `;
}

// 8. RANGKAIAN BLYNK IOT (REAL ESP32 & PHONE)
function circuitBlynkSVG(width = 320, height = 150) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 350 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="350" height="160" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>
    <g transform="translate(10, 15)">
      <image href="${realEsp32Uri}" x="0" y="0" width="90" height="120" />
      <text x="15" y="142" fill="#047857" font-weight="bold" font-size="8.5">ESP32 DevKit Real</text>
    </g>
    <g transform="translate(130, 25)">
      <path d="M25 35 A15 15 0 0 1 50 25 A22 22 0 0 1 85 30 A18 18 0 0 1 80 50 L20 50 A15 15 0 0 1 25 35 Z" fill="#22C55E" fill-opacity="0.15" stroke="#22C55E" stroke-width="2"/>
      <text x="32" y="42" fill="#15803D" font-size="8.5" font-weight="bold">Blynk Cloud</text>
      <text x="38" y="58" fill="#15803D" font-size="7.5">🌐 Internet</text>
    </g>
    <path d="M100 50 Q115 50 125 45" stroke="#22C55E" stroke-width="2" stroke-dasharray="3 3" fill="none"/>
    <path d="M225 45 Q235 50 250 50" stroke="#22C55E" stroke-width="2" stroke-dasharray="3 3" fill="none"/>
    <g transform="translate(250, 15)">
      <rect width="75" height="130" rx="10" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <rect x="4" y="10" width="67" height="110" rx="6" fill="#1E293B"/>
      <circle cx="37" cy="5" r="1.5" fill="#64748B"/>
      <rect x="4" y="10" width="67" height="16" rx="6" fill="#22C55E"/>
      <text x="12" y="22" fill="white" font-size="8" font-weight="bold">Blynk IoT</text>
      <rect x="10" y="35" width="55" height="32" rx="6" fill="#334155"/>
      <text x="14" y="47" fill="#94A3B8" font-size="7">Relay (V0)</text>
      <rect x="20" y="52" width="35" height="12" rx="6" fill="#22C55E"/>
      <circle cx="47" cy="58" r="5" fill="white"/>
      <text x="24" y="61" fill="white" font-size="7" font-weight="bold">ON</text>
      <rect x="10" y="73" width="55" height="38" rx="6" fill="#334155"/>
      <text x="14" y="85" fill="#94A3B8" font-size="7">Cahaya (V1)</text>
      <text x="20" y="101" fill="#38BDF8" font-size="11" font-weight="bold">1850 lux</text>
    </g>
  </svg>
  `;
}

// 9. VISUAL SCREENSHOTS: WORKFLOW DAFTAR AKUN BLYNK & SETUP TEMPLATE
function blynkSignupWorkflowSVG(width = 500, height = 180) {
  return `
  <svg width="${width}" height="${height}" viewBox="0 0 520 185" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="520" height="185" rx="10" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.5"/>

    <!-- SCREENSHOT 1: SIGN UP SCREEN AT BLYNK.CLOUD -->
    <g transform="translate(10, 10)">
      <!-- Browser Frame -->
      <rect width="155" height="140" rx="5" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.2"/>
      <rect width="155" height="18" rx="5 5 0 0" fill="#E2E8F0"/>
      <!-- Window buttons -->
      <circle cx="8" cy="9" r="2.5" fill="#EF4444"/>
      <circle cx="15" cy="9" r="2.5" fill="#F59E0B"/>
      <circle cx="22" cy="9" r="2.5" fill="#10B981"/>
      <rect x="32" y="4" width="115" height="10" rx="3" fill="#FFFFFF"/>
      <text x="36" y="11" fill="#64748B" font-size="5.5">blynk.cloud/register</text>

      <!-- Content -->
      <circle cx="77" cy="30" r="5" fill="#22C55E"/>
      <text x="74" y="32" fill="#FFFFFF" font-size="6" font-weight="bold">B</text>
      <text x="50" y="42" fill="#0F172A" font-size="7.5" font-weight="bold">Create Account</text>
      
      <!-- Input email -->
      <text x="12" y="54" fill="#64748B" font-size="6">Email Address</text>
      <rect x="12" y="57" width="131" height="14" rx="2" fill="#F8FAFC" stroke="#CBD5E1"/>
      <text x="16" y="67" fill="#1E293B" font-size="6">siswa.maker@gmail.com</text>

      <!-- Checkbox Terms -->
      <rect x="12" y="76" width="6" height="6" rx="1" fill="#22C55E"/>
      <path d="M13 79 L15 81 L17 77" stroke="#FFF" stroke-width="1" fill="none"/>
      <text x="21" y="81" fill="#64748B" font-size="5">I agree to Terms & Policy</text>

      <!-- Sign Up Button -->
      <rect x="12" y="87" width="131" height="15" rx="3" fill="#22C55E"/>
      <text x="58" y="97" fill="#FFFFFF" font-size="7" font-weight="bold">Sign Up</text>
      
      <text x="22" y="112" fill="#3B82F6" font-size="5.5">Already have an account? Log In</text>

      <!-- Step Label Below -->
      <rect x="10" y="122" width="135" height="14" rx="3" fill="#E0F2FE"/>
      <text x="16" y="132" fill="#0369A1" font-size="6.5" font-weight="bold">Langkah 1: Daftar di blynk.cloud</text>
    </g>

    <!-- ARROW 1 -->
    <path d="M 168 80 L 178 80" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>

    <!-- SCREENSHOT 2: EMAIL VERIFICATION & PASSWORD CREATION -->
    <g transform="translate(182, 10)">
      <!-- Email Inbox Mockup Frame -->
      <rect width="155" height="140" rx="5" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1.2"/>
      <rect width="155" height="18" rx="5 5 0 0" fill="#E2E8F0"/>
      <circle cx="8" cy="9" r="2.5" fill="#EF4444"/>
      <circle cx="15" cy="9" r="2.5" fill="#F59E0B"/>
      <circle cx="22" cy="9" r="2.5" fill="#10B981"/>
      <text x="36" y="12" fill="#64748B" font-size="6" font-weight="bold">Inbox: Blynk IoT</text>

      <!-- Email Header -->
      <text x="10" y="30" fill="#64748B" font-size="5.5">Dari: Blynk &lt;support@blynk.io&gt;</text>
      <text x="10" y="38" fill="#0F172A" font-size="6.5" font-weight="bold">Create your Blynk password</text>
      <line x1="10" y1="42" x2="145" y2="42" stroke="#E2E8F0"/>

      <!-- Email Body -->
      <text x="10" y="52" fill="#334155" font-size="6">Klik tombol di bawah untuk</text>
      <text x="10" y="60" fill="#334155" font-size="6">mengaktifkan akun IoT barumu:</text>

      <!-- Action Button inside email -->
      <rect x="18" y="67" width="120" height="16" rx="4" fill="#22C55E"/>
      <text x="38" y="78" fill="#FFFFFF" font-size="7" font-weight="bold">Create Password</text>

      <!-- Password form preview -->
      <rect x="12" y="90" width="131" height="14" rx="2" fill="#F1F5F9" stroke="#94A3B8"/>
      <text x="16" y="100" fill="#0F172A" font-size="6">Password: ••••••••••••</text>
      <text x="102" y="100" fill="#16A34A" font-size="5.5" font-weight="bold">✓ Strong</text>

      <!-- Step Label Below -->
      <rect x="10" y="122" width="135" height="14" rx="3" fill="#DCFCE7"/>
      <text x="15" y="132" fill="#15803D" font-size="6.5" font-weight="bold">Langkah 2: Verifikasi & Password</text>
    </g>

    <!-- ARROW 2 -->
    <path d="M 340 80 L 350 80" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round"/>

    <!-- SCREENSHOT 3: BLYNK CONSOLE TEMPLATE & AUTH TOKEN -->
    <g transform="translate(355, 10)">
      <!-- Console Mockup Frame -->
      <rect width="155" height="140" rx="5" fill="#0F172A" stroke="#334155" stroke-width="1.2"/>
      <rect width="155" height="16" rx="5 5 0 0" fill="#1E293B"/>
      <text x="8" y="11" fill="#38BDF8" font-size="6" font-weight="bold">Blynk.Console • Templates</text>
      <rect x="110" y="4" width="38" height="9" rx="2" fill="#16A34A"/>
      <text x="113" y="10.5" fill="#FFFFFF" font-size="5" font-weight="bold">DEV MODE: ON</text>

      <!-- Template Dialog -->
      <rect x="8" y="22" width="139" height="42" rx="3" fill="#1E293B" stroke="#475569"/>
      <text x="12" y="32" fill="#F8FAFC" font-size="6.5" font-weight="bold">+ New Template: SmartHome</text>
      <text x="12" y="42" fill="#94A3B8" font-size="5.5">Hardware: <tspan fill="#38BDF8">ESP32</tspan> | Conn: <tspan fill="#38BDF8">WiFi</tspan></text>
      <text x="12" y="52" fill="#94A3B8" font-size="5.5">Datastreams: <tspan fill="#4ADE80">V0 (Relay)</tspan>, <tspan fill="#4ADE80">V1 (Sensor)</tspan></text>
      <rect x="105" y="44" width="36" height="12" rx="2" fill="#22C55E"/>
      <text x="115" y="52.5" fill="#FFFFFF" font-size="6" font-weight="bold">Save</text>

      <!-- Auth Token Callout Box -->
      <rect x="8" y="70" width="139" height="46" rx="3" fill="#172554" stroke="#3B82F6"/>
      <text x="12" y="80" fill="#93C5FD" font-size="6" font-weight="bold">KTP PERANGKAT (Copy ke Blok):</text>
      <text x="12" y="90" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="5.5">TMPL_ID: "TMPL6aB9x"</text>
      <text x="12" y="99" fill="#E2E8F0" font-family="'JetBrains Mono', monospace" font-size="5.5">NAME: "ESP32 Soccer"</text>
      <text x="12" y="108" fill="#FDE047" font-family="'JetBrains Mono', monospace" font-size="5.5">AUTH: "a89fc42b01e..."</text>

      <!-- Step Label Below -->
      <rect x="10" y="122" width="135" height="14" rx="3" fill="#FEF3C7"/>
      <text x="13" y="132" fill="#B45309" font-size="6.5" font-weight="bold">Langkah 3: Ambil Auth Token KTP</text>
    </g>

    <!-- Bottom Info Banner -->
    <rect x="10" y="156" width="500" height="20" rx="4" fill="#F0FDF4" stroke="#BBF7D0"/>
    <text x="20" y="169" fill="#166534" font-size="8" font-weight="bold">🌐 ALUR MUDAH BLYNK: Daftar Email ➔ Verifikasi Password ➔ Buka Template ESP32 ➔ Pasang Auth Token di RoboLab!</text>
  </svg>
  `;
}

module.exports = {
  realArduinoUri,
  realEsp32Uri,
  realLedUri,
  realButtonUri,
  realPotUri,
  realServoUri,
  realMotorDcUri,
  realUltrasonicUri,
  realLcdUri,
  realLogoUri,
  mascotSVG,
  robolabStudioUiSVG,
  breadboardSVG,
  circuitLedDirectSVG,
  circuitButtonRealSVG,
  circuitRelayModuleSVG,
  circuitPotRealSVG,
  circuitServoRealSVG,
  circuitLcdRealSVG,
  circuitL298MiniSVG,
  robotSoccerMiniL298ChassisSVG,
  circuitBlynkSVG,
  blynkSignupWorkflowSVG
};
