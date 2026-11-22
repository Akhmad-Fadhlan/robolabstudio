import { DATASHEET_DATABASE } from '../data/datasheetDb';
import type { ComponentDatasheet } from '../data/datasheetDb';

export const ASSISTANT_PROVIDERS = {
  kilo: { label: 'Kilo Gateway', url: 'https://ai-gateway.kilo.ai/api/v1/chat/completions', model: 'kilo-auto/free' },
  openrouter: { label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'openrouter/free' },
} as const;

export interface KiloCodeConfig {
  apiKey: string;
  provider: keyof typeof ASSISTANT_PROVIDERS;
  model: string;
}

export interface KiloCodeContext {
  board: string;
  activeFileName: string;
  activeCode: string;
  activeComponents: string[];
  wires?: any[];
  terminalLogs?: Array<{ text: string; type: string }>;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  message: string;
  isKiloCode?: boolean;
  isError?: boolean;
}

export const DEFAULT_KILOCODE_CONFIG: KiloCodeConfig = {
  apiKey: '',
  provider: 'kilo',
  model: ASSISTANT_PROVIDERS.kilo.model,
};

interface ProviderMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
}

function responseError(status: number): string {
  if (status === 401 || status === 403) return 'Kunci API ditolak. Periksa kunci dan penyedia di Pengaturan AI.';
  if (status === 402) return 'Kuota atau saldo akun habis. Periksa akun penyedia AI.';
  if (status === 404) return 'Model tidak ditemukan. Periksa ID model di Pengaturan AI.';
  if (status === 429) return 'Batas penggunaan tercapai. Tunggu sebentar lalu coba lagi.';
  return `Penyedia AI gagal merespons (HTTP ${status}). Coba lagi atau periksa model.`;
}

async function requestCompletion(config: KiloCodeConfig, messages: ProviderMessage[], maxTokens: number): Promise<string> {
  const provider = ASSISTANT_PROVIDERS[config.provider];
  const key = config.apiKey.trim();
  if (!key) throw new Error('Masukkan kunci API terlebih dahulu.');

  const body = { model: config.model.trim() || provider.model, messages, max_tokens: maxTokens, stream: false };
  const desktopRequire = (window as any).__electronRequire || (window as any).require;
  let data;
  if (desktopRequire) {
    const result = await desktopRequire('electron').ipcRenderer.invoke('kilo-api-request', { url: provider.url, key, body });
    if (!result.success) throw new Error(result.status ? responseError(result.status) : 'Koneksi ke penyedia AI gagal atau melewati batas waktu.');
    data = result.data;
  } else {
    let response: Response;
    try {
      response = await fetch(config.provider === 'kilo' ? '/api/assistant' : provider.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(40000),
        redirect: 'error',
      });
    } catch {
      throw new Error('Koneksi ke penyedia AI gagal atau melewati batas waktu.');
    }
    if (!response.ok) throw new Error(responseError(response.status));
    data = await response.json().catch(() => null);
  }

  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string'
    ? content.trim()
    : Array.isArray(content)
      ? content.map(part => typeof part?.text === 'string' ? part.text : '').join('').trim()
      : '';
  if (!text) throw new Error('Penyedia AI mengembalikan jawaban kosong. Coba lagi atau ganti model.');
  return text;
}

export async function testAssistantConnection(config: KiloCodeConfig): Promise<void> {
  await requestCompletion(config, [{ role: 'user', content: 'Reply with OK.' }], 128);
}

export async function processAiMessage(
  userPrompt: string,
  history: ChatMessage[],
  config: KiloCodeConfig,
  context: KiloCodeContext,
  includeProject = false,
): Promise<{ text: string; isKiloCode: boolean }> {
  if (!config.apiKey.trim()) {
    return { text: generateOfflineAiResponse(userPrompt, context), isKiloCode: false };
  }

  const system: ProviderMessage = {
    role: 'system',
    content: 'Kamu adalah Asisten RoboLab untuk siswa yang belajar coding, IoT, dan robotika. Jawab dalam bahasa pengguna, pakai bahasa sederhana, jelaskan langkah singkat dan alasan di baliknya. Jika membantu debugging, mulai dari penyebab dan cara memeriksanya. Saat diminta kode, gunakan Markdown berpagar dengan bahasa yang sesuai board. Tanyakan detail yang masih diperlukan. Jangan mengaku sudah menjalankan program atau menguji perangkat.',
  };
  const messages: ProviderMessage[] = [system, ...history
    .filter(message => !message.isError && (message.sender === 'user' || message.isKiloCode))
    .slice(-12)
    .map(message => ({
      role: message.sender === 'user' ? 'user' as const : 'assistant' as const,
      content: message.message.slice(0, 8000),
    }))];
  messages.push({
    role: 'user',
    content: includeProject
      ? `${userPrompt}\n\nKonteks proyek saat ini:\nBoard: ${context.board}\nBerkas: ${context.activeFileName.slice(0, 255)}\nKomponen: ${context.activeComponents.join(', ').slice(0, 1000)}\nJumlah kabel: ${context.wires?.length ?? 0}\nKode aktif (maks. 6000 karakter):\n${context.activeCode.slice(0, 6000)}`
      : userPrompt,
  });
  return { text: await requestCompletion(config, messages, 2300), isKiloCode: true };
}

export function generateOfflineAiResponse(
  userPrompt: string,
  context: KiloCodeContext
): string {
  const promptLower = userPrompt.toLowerCase();
  let response = '';

  // 1. DATASHEET & COMPONENT INQUIRY
  const matchedDatasheet = findMatchingDatasheet(promptLower);
  if (matchedDatasheet) {
    return formatDatasheetResponse(matchedDatasheet);
  }

  // 2. CODE ANALYSIS & EDIT REQUESTS
  if (promptLower.includes('analisis') || promptLower.includes('analisa') || promptLower.includes('perbaiki') || promptLower.includes('edit') || promptLower.includes('error') || promptLower.includes('optimasi')) {
    response = analyzeAndFixCode(context);
  }
  // 3. CIRCUIT SIMULATOR ANALYSIS
  else if (promptLower.includes('rangkaian') || promptLower.includes('simulator') || promptLower.includes('kabel') || promptLower.includes('pin') || promptLower.includes('wire')) {
    response = analyzeCircuitState(context);
  }
  // 4. DATASHEET GENERAL REQUEST
  else if (promptLower.includes('datasheet') || promptLower.includes('spesifikasi') || promptLower.includes('pinout')) {
    response = `📖 **Panduan Datasheet Komponen RoboLab Studio**\n\n` +
      `Anda dapat menanyakan detail komponen seperti **Arduino Uno, ESP32, ESP8266, micro:bit, DHT11, HC-SR04, LCD 16x2 I2C, Servo SG90, Motor DC, LED, Potensiometer, Push Button**.\n\n` +
      `*Contoh:* *"Berapa tegangan kerja DHT11?"* atau *"Bagaimana pinout LCD 16x2 I2C?"*`;
  }
  // 5. GENERATE SAMPLE CODE FOR CONNECTED COMPONENTS
  else if (promptLower.includes('buat') || promptLower.includes('kode') || promptLower.includes('contoh') || promptLower.includes('program')) {
    response = generateSampleCodeForContext(context);
  }
  // DEFAULT HELPFUL RESPONSE
  else {
    response = `🤖 **Asisten Robolab AI** (Panduan Lokal)\n\n` +
      `Saya dapat membantu Anda dalam beberapa hal:\n` +
      `1. **🔍 Analisis & Edit Kode**: Ketik *"Analisis kode"* untuk mengecek kesalahan atau optimasi program.\n` +
      `2. **🔌 Cek Simulator Rangkaian**: Ketik *"Analisis rangkaian"* untuk memeriksa komponen terpasang (${context.activeComponents.join(', ') || 'Belum ada'}).\n` +
      `3. **📖 Datasheet Komponen**: Ketik *"Datasheet ESP32"* atau *"Pinout DHT11"* untuk rincian spesifikasi teknis.\n\n` +
      `💡 *Tips:* Masukkan **API Key** Anda di Pengaturan Asisten AI (ikon ⚙️ di pojok kanan atas AI Chat) untuk mengaktifkan kemampuan AI penuh!`;
  }

  return response;
}

function findMatchingDatasheet(prompt: string): ComponentDatasheet | null {
  if (prompt.includes('esp32')) return DATASHEET_DATABASE.esp32;
  if (prompt.includes('uno') || prompt.includes('arduino')) return DATASHEET_DATABASE.arduino_uno;
  if (prompt.includes('esp8266') || prompt.includes('nodemcu')) return DATASHEET_DATABASE.esp8266;
  if (prompt.includes('microbit') || prompt.includes('micro:bit')) return DATASHEET_DATABASE.microbit;
  if (prompt.includes('dht11') || prompt.includes('dht') || prompt.includes('suhu') || prompt.includes('kelembaban')) return DATASHEET_DATABASE.dht11;
  if (prompt.includes('hcsr04') || prompt.includes('ultrasonik') || prompt.includes('ultrasonic') || prompt.includes('jarak')) return DATASHEET_DATABASE.hcsr04;
  if (prompt.includes('lcd') || prompt.includes('16x2') || prompt.includes('i2c')) return DATASHEET_DATABASE.lcd16x2_i2c;
  if (prompt.includes('servo') || prompt.includes('sg90')) return DATASHEET_DATABASE.servo_sg90;
  if (prompt.includes('motor') || prompt.includes('l298n')) return DATASHEET_DATABASE.motor_dc;
  if (prompt.includes('led')) return DATASHEET_DATABASE.led;
  if (prompt.includes('potensio') || prompt.includes('potentiometer')) return DATASHEET_DATABASE.potentiometer;
  if (prompt.includes('button') || prompt.includes('tombol') || prompt.includes('push')) return DATASHEET_DATABASE.pushbutton;
  return null;
}

function formatDatasheetResponse(ds: ComponentDatasheet): string {
  let out = `📖 **Datasheet: ${ds.name}**\n\n`;
  out += `* **Tegangan Kerja:** ${ds.operatingVoltage}\n`;
  out += `* **Arus Maksimum:** ${ds.maxCurrent}\n`;
  out += `* **Deskripsi:** ${ds.description}\n\n`;

  out += `⚡ **Spesifikasi Utama:**\n`;
  Object.entries(ds.specs).forEach(([k, v]) => {
    out += `* **${k}:** ${v}\n`;
  });

  out += `\n📌 **Pinout & Fungsi Pin:**\n`;
  ds.pinout.forEach(p => {
    out += `* \`${p.name}\` (${p.type}): ${p.description}\n`;
  });

  if (ds.notes.length > 0) {
    out += `\n⚠️ **Catatan Penting:**\n`;
    ds.notes.forEach(n => {
      out += `* ${n}\n`;
    });
  }

  if (ds.sampleCodeArduino) {
    out += `\n💻 **Contoh Kode (Arduino C++):**\n\`\`\`cpp\n${ds.sampleCodeArduino}\n\`\`\``;
  } else if (ds.sampleCodePython) {
    out += `\n💻 **Contoh Kode (MicroPython):**\n\`\`\`python\n${ds.sampleCodePython}\n\`\`\``;
  }

  return out;
}

function analyzeAndFixCode(context: KiloCodeContext): string {
  const code = context.activeCode || '';
  const isPython = context.activeFileName.endsWith('.py');
  const board = context.board || 'Arduino Uno';

  let issues: string[] = [];
  let suggestedCode = code;

  if (isPython) {
    if (!code.includes('import') && !code.includes('from microbit')) {
      issues.push('Modul microbit belum di-import.');
      suggestedCode = `from microbit import *\n\n` + code;
    }
  } else {
    // C++ Checks
    if (!code.includes('void setup()') && !code.includes('void setup ()')) {
      issues.push('Fungsi `void setup()` tidak ditemukan.');
    }
    if (!code.includes('void loop()') && !code.includes('void loop ()')) {
      issues.push('Fungsi `void loop()` tidak ditemukan.');
    }
    if (code.includes('Serial.print') && !code.includes('Serial.begin')) {
      issues.push('Penggunaan `Serial.print` tanpa menginisialisasi `Serial.begin(...)` di setup().');
    }
    if (context.activeComponents.includes('DHT11') && !code.includes('DHT')) {
      issues.push('Komponen DHT11 terpasang di simulator tetapi library `#include <DHT.h>` belum dipanggil.');
    }
    if (context.activeComponents.includes('LCD16x2') && !code.includes('LiquidCrystal_I2C')) {
      issues.push('Komponen LCD I2C terpasang tetapi library `#include <LiquidCrystal_I2C.h>` belum dikonfigurasi.');
    }
  }

  let res = `🔍 **Analisis Kode Berkas (\`${context.activeFileName}\`)**\n\n`;
  res += `* **Board Target:** ${board}\n`;
  res += `* **Status Syntax:** ${issues.length === 0 ? '✅ Baik (Tidak ditemukan kesalahan struktur kritis)' : `⚠️ Ditemukan ${issues.length} potensi masalah`}\n\n`;

  if (issues.length > 0) {
    res += `**Isu Yang Ditemukan:**\n`;
    issues.forEach((iss, idx) => {
      res += `${idx + 1}. ${iss}\n`;
    });
    res += `\n**Rekomendasi Kode Perbaikan:**\n`;
  } else {
    res += `Kode Anda tampak siap di-compile! Berikut adalah versi teroptimasi dengan penanganan komponen aktif:\n\n`;
  }

  // Generate improved code if empty or needed
  if (!code.trim()) {
    suggestedCode = generateTemplateForBoardAndComponents(board, context.activeComponents, isPython);
  }

  const lang = isPython ? 'python' : 'cpp';
  res += `\`\`\`${lang}\n${suggestedCode}\n\`\`\`\n\n`;
  res += `👉 Klik tombol **"Terapkan ke Editor"** di atas blok kode untuk memperbarui file \`${context.activeFileName}\` secara otomatis!`;

  return res;
}

function analyzeCircuitState(context: KiloCodeContext): string {
  const comps = context.activeComponents || [];
  const wires = context.wires || [];
  const board = context.board || 'Arduino Uno';

  let res = `🔌 **Laporan Diagnosa Rangkaian Simulator**\n\n`;
  res += `* **Papan Pengendali:** ${board}\n`;
  res += `* **Komponen Terpasang:** ${comps.length > 0 ? comps.map(c => `\`${c}\``).join(', ') : 'Belum ada (Kanvas Kosong)'}\n`;
  res += `* **Jalur Kabel Terhubung:** ${wires.length} koneksi wire\n\n`;

  if (comps.length === 0) {
    res += `💡 *Tips:* Klik ikon komponen di Simulator (seperti LED, DHT11, Servo, LCD 16x2) untuk menambahkan sensor ke rangkaian Anda.`;
    return res;
  }

  res += `**Analisis & Rekomendasi Pin Wiring:**\n`;
  comps.forEach(c => {
    if (c.toLowerCase().includes('led')) {
      res += `* **LED:** Anoda ke Digital Pin (misal Pin 2 / D2), Katoda ke GND via Resistor 220Ω.\n`;
    } else if (c.toLowerCase().includes('dht')) {
      res += `* **DHT11:** VCC ke 5V/3.3V, GND ke GND, Data Pin ke GPIO 4 (Arduino) atau GPIO 4 (ESP32).\n`;
    } else if (c.toLowerCase().includes('hcsr04') || c.toLowerCase().includes('ultrasonic')) {
      res += `* **HC-SR04:** VCC ke 5V, GND ke GND, Trig ke Pin 9, Echo ke Pin 10.\n`;
    } else if (c.toLowerCase().includes('lcd')) {
      res += `* **LCD 16x2 I2C:** VCC ke 5V, GND ke GND, SDA ke ${board.includes('ESP32') ? 'GPIO 21' : 'Pin A4'}, SCL ke ${board.includes('ESP32') ? 'GPIO 22' : 'Pin A5'}.\n`;
    } else if (c.toLowerCase().includes('servo')) {
      res += `* **Servo SG90:** Merah (VCC 5V), Hitam/Cokelat (GND), Kuning/Oranye (PWM Signal Pin 9).\n`;
    }
  });

  return res;
}

function generateSampleCodeForContext(context: KiloCodeContext): string {
  const board = context.board || 'Arduino Uno';
  const isPython = context.activeFileName.endsWith('.py');
  const code = generateTemplateForBoardAndComponents(board, context.activeComponents, isPython);

  const lang = isPython ? 'python' : 'cpp';
  return `✨ **Rekomendasi Kode Terintegrasi Komponen**\n\n` +
    `Kode berikut disesuaikan untuk **${board}** dan komponen terpasang (\`${context.activeComponents.join(', ') || 'Standard'}\`):\n\n` +
    `\`\`\`${lang}\n${code}\n\`\`\`\n\n` +
    `👉 Klik tombol **"Terapkan ke Editor"** untuk mengunggah kode ini ke \`${context.activeFileName}\`.`;
}

function generateTemplateForBoardAndComponents(_board: string, components: string[], isPython: boolean): string {
  if (isPython) {
    return `from microbit import *
import music

display.show(Image.HAPPY)

while True:
    if button_a.is_pressed():
        display.scroll("RoboLab AI")
    sleep(100)`;
  }

  const hasDHT = components.some(c => c.toLowerCase().includes('dht'));
  const hasLCD = components.some(c => c.toLowerCase().includes('lcd'));
  const hasServo = components.some(c => c.toLowerCase().includes('servo'));

  let includes = `#include <Arduino.h>\n`;
  if (hasDHT) includes += `#include <DHT.h>\n#define DHTPIN 4\n#define DHTTYPE DHT11\nDHT dht(DHTPIN, DHTTYPE);\n`;
  if (hasLCD) includes += `#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n`;
  if (hasServo) includes += `#include <Servo.h>\nServo myServo;\n`;

  let setupBody = `  Serial.begin(115200);\n  Serial.println("RoboLab Studio Ready!");\n`;
  if (hasDHT) setupBody += `  dht.begin();\n`;
  if (hasLCD) setupBody += `  lcd.init();\n  lcd.backlight();\n  lcd.print("RoboLab AI");\n`;
  if (hasServo) setupBody += `  myServo.attach(9);\n`;

  let loopBody = `  // Program utama\n  delay(1000);\n`;
  if (hasDHT) loopBody += `  float t = dht.readTemperature();\n  Serial.print("Temp: "); Serial.println(t);\n`;
  if (hasServo) loopBody += `  myServo.write(90);\n`;

  return `${includes}
void setup() {
${setupBody}}

void loop() {
${loopBody}}`;
}
