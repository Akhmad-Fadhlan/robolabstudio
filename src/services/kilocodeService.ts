import { DATASHEET_DATABASE } from '../data/datasheetDb';
import type { ComponentDatasheet } from '../data/datasheetDb';

export interface KiloCodeConfig {
  apiKey: string;
  endpoint: string;
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
  timestamp?: string;
  isKiloCode?: boolean;
}

export const DEFAULT_KILOCODE_CONFIG: KiloCodeConfig = {
  apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbnYiOiJwcm9kdWN0aW9uIiwia2lsb1VzZXJJZCI6IjA1ZTdiMGMzLTNjOGEtNDA5YS1hNDg0LWRlNWMxNzRhMzc3ZiIsImFwaVRva2VuUGVwcGVyIjpudWxsLCJ2ZXJzaW9uIjozLCJpYXQiOjE3ODY0Mjc2MTksImV4cCI6MTk0NDEwNzYxOX0.ApfgibBiiznufEFofH8AFwgl5ldiy4lXqzdt1SqTB9M',
  endpoint: 'https://api.kilo.ai/api/gateway',
  model: 'kilo-auto/free'
};

/**
 * Main AI Request Handler - Connects to KiloCode API if key is present,
 * or falls back to intelligent local RoboLab AI engine.
 */
export async function processAiMessage(
  userPrompt: string,
  history: ChatMessage[],
  config: KiloCodeConfig,
  context: KiloCodeContext
): Promise<{ text: string; isKiloCode: boolean }> {
  const trimmedKey = config.apiKey.trim();
  
  if (trimmedKey) {
    try {
      const responseText = await sendKiloCodeApiCall(userPrompt, history, config, context);
      return { text: responseText, isKiloCode: true };
    } catch (err: any) {
      console.warn('[KiloCode API] Call failed, using smart fallback engine:', err);
      const fallbackText = generateOfflineAiResponse(userPrompt, context, `⚠️ *Asisten Robolab AI Error (${err.message || 'Koneksi gagal'}). Menggunakan AI lokal:*`);
      return { text: fallbackText, isKiloCode: false };
    }
  }

  // Fallback if no API Key is set
  const offlineText = generateOfflineAiResponse(userPrompt, context);
  return { text: offlineText, isKiloCode: false };
}

/**
 * Helper to robustly extract text content from any OpenAI/Kilo/Anthropic/Local LLM response JSON structure.
 */
function extractAiContent(data: any): string {
  if (!data) return '';

  // 1. OpenAI / Kilo AI Gateway choices format
  if (Array.isArray(data.choices) && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice?.message) {
      if (typeof choice.message.content === 'string' && choice.message.content.trim()) {
        return choice.message.content.trim();
      }
      if (Array.isArray(choice.message.content)) {
        const textParts = choice.message.content
          .map((c: any) => (typeof c === 'string' ? c : c?.text || c?.content || ''))
          .filter(Boolean);
        if (textParts.length > 0) return textParts.join('\n').trim();
      }
      if (typeof choice.message.reasoning_content === 'string' && choice.message.reasoning_content.trim()) {
        return choice.message.reasoning_content.trim();
      }
    }
    if (typeof choice?.text === 'string' && choice.text.trim()) {
      return choice.text.trim();
    }
    if (choice?.delta && typeof choice.delta.content === 'string' && choice.delta.content.trim()) {
      return choice.delta.content.trim();
    }
  }

  // 2. Direct message / text / content fields
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
  if (typeof data.content === 'string' && data.content.trim()) return data.content.trim();
  if (Array.isArray(data.content) && data.content.length > 0) {
    const textParts = data.content
      .map((c: any) => (typeof c === 'string' ? c : c?.text || c?.content || ''))
      .filter(Boolean);
    if (textParts.length > 0) return textParts.join('\n').trim();
  }

  return '';
}

/**
 * Sends request to KiloCode / Kilo.ai Gateway / OpenAI compatible API endpoint
 */
async function sendKiloCodeApiCall(
  userPrompt: string,
  history: ChatMessage[],
  config: KiloCodeConfig,
  context: KiloCodeContext
): Promise<string> {
  let baseUrl = (config.endpoint || 'https://api.kilo.ai/api/gateway').replace(/\/+$/, '');
  // Auto-migrate legacy endpoint
  if (baseUrl.includes('api.kilocode.com') || baseUrl.includes('api.kilo.ai/v1')) {
    baseUrl = 'https://api.kilo.ai/api/gateway';
  }

  const url = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`;

  // Truncate active code context if too long to reserve max completion tokens for AI output
  let activeCodeContext = context.activeCode || '// Belum ada kode';
  if (activeCodeContext.length > 3500) {
    activeCodeContext = activeCodeContext.slice(0, 3500) + '\n// ... [sisa kode dipotong untuk menghemat ruang respons AI] ...';
  }

  const systemPrompt = `Anda adalah Asisten Robolab AI, pakar IoT, robotika, embedded C++ (Arduino/ESP32), dan MicroPython.
Anda terhubung secara real-time dengan IDE RoboLab Studio milik pengguna.

KONTEKS WORKSPACE SAAT INI:
- Papan / Board: ${context.board || 'Arduino Uno'}
- Berkas Aktif: ${context.activeFileName || 'firmware/main.ino'}
- Komponen Rangkaian di Simulator: ${context.activeComponents.length > 0 ? context.activeComponents.join(', ') : 'Tidak ada komponen terpasang'}
- Jumlah Kabel Wiring: ${context.wires?.length || 0} kabel terhubung

KODE BERKAS AKTIF SAAT INI:
\`\`\`${context.activeFileName.endsWith('.py') ? 'python' : 'cpp'}
${activeCodeContext}
\`\`\`

Instruksi Penting:
1. Berikan jawaban yang ramah, presisi, dan LENGKAP dari awal hingga akhir dalam Bahasa Indonesia.
2. Jika diminta membuat/memperbaiki kode, berikan SELURUH KODE LENGKAP (termasuk #include, void setup(), void loop(), dan fungsi penunjang). JANGAN PERNAH memotong atau menghentikan penulisan kode di tengah jalan.
3. Selalu tutup semua blok kode markdown (\`\`\`cpp atau \`\`\`python) dengan benar di akhir penjelasan.`;

  // Format message history (limit to last 6 messages)
  const formattedHistory = history.slice(-6).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.message
  }));

  // Auto-migrate legacy or paid model names if needed
  let selectedModel = config.model || 'kilo-auto/free';
  if (selectedModel === 'kilocode/kilo-auto' || selectedModel === 'kilo-auto') {
    selectedModel = 'kilo-auto/free';
  }

  const payload = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 8192,
    max_completion_tokens: 8192,
    stream: false
  };

  const key = config.apiKey.trim();

  // Try Electron IPC handler first if running in Electron (bypasses browser CORS & CSP)
  try {
    const req = (window as any).__electronRequire || (window as any).require;
    if (req) {
      const electron = req('electron');
      if (electron && electron.ipcRenderer) {
        let ipcRes = await electron.ipcRenderer.invoke('kilo-api-request', { url, key, body: payload });
        
        // Auto retry with free model if 402 Payment Required or 429 Rate Limit/Overloaded
        if (!ipcRes.success && (ipcRes.status === 402 || ipcRes.status === 429) && payload.model !== 'kilo-auto/free') {
          payload.model = 'kilo-auto/free';
          ipcRes = await electron.ipcRenderer.invoke('kilo-api-request', { url, key, body: payload });
        }

        if (ipcRes.success && ipcRes.data) {
          const content = extractAiContent(ipcRes.data);
          if (content) return content;
          if (ipcRes.data.error?.message) {
            throw new Error(ipcRes.data.error.message);
          }
        }
        
        if (!ipcRes.success) {
          throw new Error(ipcRes.error || `Gateway API Error (HTTP ${ipcRes.status || 'unknown'})`);
        }
      }
    }
  } catch (ipcErr: any) {
    if (ipcErr.message && !ipcErr.message.includes('__electronRequire') && !ipcErr.message.includes('require')) {
      console.warn('[KiloCode IPC] IPC call error:', ipcErr.message);
      throw ipcErr;
    }
  }

  // AbortController — timeout 60 detik agar tidak stuck selamanya
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    // Standard Browser Fetch (Clean Headers)
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    // If 402 Payment Required or 429 Rate Limit, retry automatically with free model
    if ((response.status === 402 || response.status === 429) && selectedModel !== 'kilo-auto/free') {
      payload.model = 'kilo-auto/free';
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let msg = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = JSON.parse(errorBody);
        if (errJson.error?.message) msg = errJson.error.message;
      } catch (e) {}
      throw new Error(msg);
    }

    const data = await response.json();
    const content = extractAiContent(data);
    if (content) return content;
    if (data.error?.message) {
      throw new Error(data.error.message);
    }

    throw new Error('Respons AI kosong dari server');
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Permintaan timeout (60 detik). Coba lagi atau periksa koneksi internet.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Smart Offline AI Fallback Engine
 * Analyzes code, circuit, and component datasheets locally without needing an API Key.
 */
export function generateOfflineAiResponse(
  userPrompt: string,
  context: KiloCodeContext,
  prefixNotice?: string
): string {
  const promptLower = userPrompt.toLowerCase();
  let response = '';

  // 1. DATASHEET & COMPONENT INQUIRY
  const matchedDatasheet = findMatchingDatasheet(promptLower);
  if (matchedDatasheet) {
    return (prefixNotice ? `${prefixNotice}\n\n` : '') + formatDatasheetResponse(matchedDatasheet);
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
    response = `🤖 **Asisten Robolab AI** (Mode Cerdas Lokal)\n\n` +
      `Saya dapat membantu Anda dalam beberapa hal:\n` +
      `1. **🔍 Analisis & Edit Kode**: Ketik *"Analisis kode"* untuk mengecek kesalahan atau optimasi program.\n` +
      `2. **🔌 Cek Simulator Rangkaian**: Ketik *"Analisis rangkaian"* untuk memeriksa komponen terpasang (${context.activeComponents.join(', ') || 'Belum ada'}).\n` +
      `3. **📖 Datasheet Komponen**: Ketik *"Datasheet ESP32"* atau *"Pinout DHT11"* untuk rincian spesifikasi teknis.\n\n` +
      `💡 *Tips:* Masukkan **API Key** Anda di Pengaturan Asisten AI (ikon ⚙️ di pojok kanan atas AI Chat) untuk mengaktifkan kemampuan AI penuh!`;
  }

  return prefixNotice ? `${prefixNotice}\n\n${response}` : response;
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
