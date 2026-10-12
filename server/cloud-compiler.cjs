// ============================================================================
// RoboLab Studio — Serverless Cloud Compiler Engine (Vercel & Web Ready)
// Supports:
// 1. AVR (Arduino Uno, Nano, Mega) via cloud avr-g++ builder (hexi.wokwi.com)
// 2. ESP32 & ESP8266 via precompiled Universal Hardware Runtime binaries +
//    real-time C++ sketch transpilation & binary image patching (XOR + SHA256 / CRC32)
// ============================================================================

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const https = require('https');

const SLOT_SIZE = 4096;
const SLOT_MAGIC = 'ROBOLAB_PROG_V1_SLOT';

function findCloudBinariesDir() {
  const candidates = [
    path.join(__dirname, 'cloud-binaries'),
    path.join(process.cwd(), 'server', 'cloud-binaries'),
    path.join(process.cwd(), 'robolab-web', 'server', 'cloud-binaries'),
    path.join(__dirname, '..', 'server', 'cloud-binaries'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return path.join(__dirname, 'cloud-binaries');
}

function postJsonHttps(urlStr, payload, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const bodyBuf = Buffer.from(JSON.stringify(payload), 'utf-8');
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': bodyBuf.length,
          'User-Agent': 'RoboLab-Studio-Cloud-Compiler/1.0',
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: { raw } });
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Cloud compiler request timed out'));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// Validate C++ sketch basic syntax (balanced braces/parens, setup/loop presence)
function validateCppSketchSyntax(code) {
  // Strip comments and strings for brace/paren checking
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");

  let braces = 0;
  let parens = 0;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '{') braces++;
    else if (ch === '}') braces--;
    else if (ch === '(') parens++;
    else if (ch === ')') parens--;
    if (braces < 0) {
      return { valid: false, error: "syntax error: unexpected '}' token" };
    }
    if (parens < 0) {
      return { valid: false, error: "syntax error: unexpected ')' token" };
    }
  }
  if (braces !== 0) {
    return { valid: false, error: "syntax error: expected '}' at end of input" };
  }
  if (parens !== 0) {
    return { valid: false, error: "syntax error: expected ')' before end of input" };
  }
  if (!/\bvoid\s+setup\s*\(/.test(stripped) && !/\bvoid\s+loop\s*\(/.test(stripped)) {
    return { valid: false, error: "error: undefined reference to `setup()' and `loop()'" };
  }
  return { valid: true };
}

// Extract body of a C function like `void setup() { ... }`
function extractFunctionBody(code, funcName) {
  const regex = new RegExp(`\\bvoid\\s+${funcName}\\s*\\([^)]*\\)\\s*\\{`, 'm');
  const match = regex.exec(code);
  if (!match) return '';
  const startIdx = match.index + match[0].length;
  let depth = 1;
  let i = startIdx;
  while (i < code.length && depth > 0) {
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === '\\') i++;
        i++;
      }
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return code.slice(startIdx, i);
      }
    }
    i++;
  }
  return code.slice(startIdx);
}

// Transpile Arduino C++ sketch into ROBOLAB_PROG_V1_SLOT instructions for ESP32 / ESP8266 runtime
function transpileInoToRuntimeScript(rawCode) {
  const code = rawCode
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  const constMap = {};
  const servoPinMap = {};
  const setupInstructions = [];
  const loopInstructions = [];

  // 1. Parse global variable declarations and constants
  const lines = code.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    // const int led = 2; or int ledPin = 2; or #define LED_PIN 2
    const defMatch = line.match(/^#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/);
    if (defMatch) {
      constMap[defMatch[1].trim()] = defMatch[2].trim();
      continue;
    }
    const varMatch = line.match(
      /^(?:const\s+)?(?:int|long|float|double|uint8_t|uint16_t|uint32_t|char\s*\*|String|bool|boolean)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);$/
    );
    if (varMatch) {
      const vName = varMatch[1].trim();
      const vVal = varMatch[2].trim();
      constMap[vName] = vVal;
      setupInstructions.push(`SET:${vName}:${vVal}`);
    }
  }

  // Detect ultrasonic helper functions like `float ukur_jarak() { ... pulseIn(echo, HIGH) ... }`
  let ultrasonicTrig = '12';
  let ultrasonicEcho = '13';
  if (constMap.trigger || constMap.trigPin || constMap.TRIG_PIN) {
    ultrasonicTrig = constMap.trigger || constMap.trigPin || constMap.TRIG_PIN;
  }
  if (constMap.echo || constMap.echoPin || constMap.ECHO_PIN) {
    ultrasonicEcho = constMap.echo || constMap.echoPin || constMap.ECHO_PIN;
  }

  const resolveToken = (tok) => {
    const t = (tok || '').trim();
    return constMap[t] !== undefined ? constMap[t] : t;
  };

  const normalizeExpr = (expr) => {
    let e = (expr || '').trim();
    // Replace helper ultrasonic calls with ultrasonic(trig,echo)
    e = e.replace(/\b(?:ukur_jarak|readUltrasonic|readDistance|baca_jarak)\s*\(\s*\)/g, `ultrasonic(${ultrasonicTrig},${ultrasonicEcho})`);
    e = e.replace(
      /\b(?:ukur_jarak|readUltrasonic|readDistance|baca_jarak)\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
      (_, t, ec) => `ultrasonic(${resolveToken(t)},${resolveToken(ec)})`
    );
    return e;
  };

  const parseStatementBlock = (blockText, outArr) => {
    const stmtLines = blockText.split(/\r?\n/);
    let i = 0;
    while (i < stmtLines.length) {
      let line = stmtLines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      // Handle closing braces for IF / FOR
      while (line.startsWith('}')) {
        line = line.slice(1).trim();
        if (
          line.startsWith('else if') ||
          line.startsWith('else')
        ) {
          break;
        }
      }
      if (!line) {
        i++;
        continue;
      }

      // for (int x = start; x <= end; x += step)
      const forMatch = line.match(
        /^for\s*\(\s*(?:int|long|float)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+);\s*\1\s*(<=|<|>=|>)\s*([^;]+);\s*\1\s*(\+\+|--|\+=|-=)\s*([^)]*)\)/
      );
      if (forMatch) {
        const vName = forMatch[1].trim();
        const startExpr = normalizeExpr(forMatch[2]);
        const op = forMatch[3];
        let endExpr = normalizeExpr(forMatch[4]);
        const stepOp = forMatch[5];
        const stepValRaw = forMatch[6].trim() || '1';
        let stepExpr = stepOp === '--' || stepOp === '-=' ? `-${stepValRaw}` : stepValRaw;
        if (op === '<' && !isNaN(Number(endExpr))) endExpr = String(Number(endExpr) - 1);
        if (op === '>' && !isNaN(Number(endExpr))) endExpr = String(Number(endExpr) + 1);

        // Extract body inside { ... }
        const restBlock = stmtLines.slice(i).join('\n');
        const openBrace = restBlock.indexOf('{');
        if (openBrace !== -1) {
          let depth = 1;
          let p = openBrace + 1;
          while (p < restBlock.length && depth > 0) {
            if (restBlock[p] === '{') depth++;
            else if (restBlock[p] === '}') depth--;
            p++;
          }
          const innerBody = restBlock.slice(openBrace + 1, p - 1);
          outArr.push(`FOR:${vName}:${startExpr}:${endExpr}:${stepExpr}`);
          parseStatementBlock(innerBody, outArr);
          outArr.push('ENDFOR');
          const consumedLines = restBlock.slice(0, p).split(/\r?\n/).length;
          i += Math.max(1, consumedLines);
          continue;
        }
      }

      // if (cond) { ... } [else { ... }]
      const ifMatch = line.match(/^if\s*\((.+)\)\s*\{?$/);
      if (ifMatch) {
        const cond = normalizeExpr(ifMatch[1]);
        const restBlock = stmtLines.slice(i).join('\n');
        const openBrace = restBlock.indexOf('{');
        if (openBrace !== -1) {
          let depth = 1;
          let p = openBrace + 1;
          while (p < restBlock.length && depth > 0) {
            if (restBlock[p] === '{') depth++;
            else if (restBlock[p] === '}') depth--;
            p++;
          }
          const ifBody = restBlock.slice(openBrace + 1, p - 1);
          outArr.push(`IF:${cond}`);
          parseStatementBlock(ifBody, outArr);

          let afterIf = restBlock.slice(p).trimStart();
          let totalConsumedChars = p;
          if (afterIf.startsWith('else')) {
            const elseOpen = restBlock.indexOf('{', p);
            if (elseOpen !== -1) {
              let eDepth = 1;
              let ep = elseOpen + 1;
              while (ep < restBlock.length && eDepth > 0) {
                if (restBlock[ep] === '{') eDepth++;
                else if (restBlock[ep] === '}') eDepth--;
                ep++;
              }
              const elseBody = restBlock.slice(elseOpen + 1, ep - 1);
              outArr.push('ELSE');
              parseStatementBlock(elseBody, outArr);
              totalConsumedChars = ep;
            }
          }
          outArr.push('ENDIF');
          const consumedLines = restBlock.slice(0, totalConsumedChars).split(/\r?\n/).length;
          i += Math.max(1, consumedLines);
          continue;
        }
      }

      // Split multiple semicolon statements on the same line
      const subStmts = line
        .split(';')
        .map((s) => s.trim().replace(/^[{}]+|[{}]+$/g, '').trim())
        .filter(Boolean);

      for (const stmt of subStmts) {
        let m;
        if ((m = stmt.match(/^Serial\.begin\s*\(\s*(\d+)\s*\)/))) {
          outArr.push(`SERIAL:${m[1]}`);
        } else if ((m = stmt.match(/^pinMode\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/))) {
          outArr.push(`PINMODE:${resolveToken(m[1])}:${m[2].trim()}`);
        } else if ((m = stmt.match(/^digitalWrite\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/))) {
          outArr.push(`DWRITE:${resolveToken(m[1])}:${normalizeExpr(m[2])}`);
        } else if ((m = stmt.match(/^(?:analogWrite|ledcWrite)\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/))) {
          outArr.push(`AWRITE:${resolveToken(m[1])}:${normalizeExpr(m[2])}`);
        } else if ((m = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.attach\s*\(\s*([^,)]+)/))) {
          servoPinMap[m[1].trim()] = resolveToken(m[2]);
        } else if ((m = stmt.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.write\s*\(\s*([^)]+)\s*\)/))) {
          const sPin = servoPinMap[m[1].trim()] || '13';
          outArr.push(`SERVO:${sPin}:${normalizeExpr(m[2])}`);
        } else if ((m = stmt.match(/^delay\s*\(\s*([^)]+)\s*\)/))) {
          outArr.push(`DELAY:${normalizeExpr(m[1])}`);
        } else if ((m = stmt.match(/^delayMicroseconds\s*\(\s*([^)]+)\s*\)/))) {
          outArr.push(`DELAYUS:${normalizeExpr(m[1])}`);
        } else if ((m = stmt.match(/^Serial\.println\s*\(\s*(.*)\s*\)/))) {
          outArr.push(`PRINTLN:${normalizeExpr(m[1])}`);
        } else if ((m = stmt.match(/^Serial\.print\s*\(\s*(.*)\s*\)/))) {
          outArr.push(`PRINT:${normalizeExpr(m[1])}`);
        } else if ((m = stmt.match(/^WiFi\.begin\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/))) {
          outArr.push(`WIFI:${resolveToken(m[1])}:${resolveToken(m[2])}`);
        } else if (
          (m = stmt.match(
            /^(?:(?:const\s+)?(?:int|long|float|double|String|bool|boolean|auto)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/
          ))
        ) {
          outArr.push(`SET:${m[1].trim()}:${normalizeExpr(m[2])}`);
        }
      }

      i++;
    }
  };

  const setupBody = extractFunctionBody(code, 'setup');
  const loopBody = extractFunctionBody(code, 'loop');

  parseStatementBlock(setupBody, setupInstructions);
  parseStatementBlock(loopBody, loopInstructions);

  const scriptLines = [
    SLOT_MAGIC,
    ...setupInstructions,
    '===LOOP===',
    ...loopInstructions,
    '===END===',
  ];
  return scriptLines.join('\n') + '\n';
}

// Recompute ESP32 image XOR checksum + SHA256 appended hash after patching .rodata slot
function patchEsp32FirmwareBinary(rawBin, scriptText) {
  const buf = Buffer.from(rawBin);
  const magicIdx = buf.indexOf(Buffer.from(SLOT_MAGIC));
  if (magicIdx === -1) {
    throw new Error('ROBOLAB_PROG_V1_SLOT not found in ESP32 firmware template');
  }

  const payloadBuf = Buffer.alloc(SLOT_SIZE, 0);
  Buffer.from(scriptText.slice(0, SLOT_SIZE - 1), 'utf-8').copy(payloadBuf, 0);
  payloadBuf.copy(buf, magicIdx);

  const hashAppended = buf[23] === 1;
  const bodyLen = hashAppended ? buf.length - 32 : buf.length;
  const segCount = buf[1];

  let pos = 24;
  let chk = 0xef;
  for (let s = 0; s < segCount; s++) {
    const segLen = buf.readUInt32LE(pos + 4);
    pos += 8;
    for (let i = 0; i < segLen; i++) {
      chk ^= buf[pos + i];
    }
    pos += segLen;
  }

  // Last byte of 16-byte padded body is the XOR checksum
  buf[bodyLen - 1] = chk;

  if (hashAppended) {
    const sha = crypto.createHash('sha256').update(buf.subarray(0, bodyLen)).digest();
    sha.copy(buf, bodyLen);
  }

  return buf;
}

function crc8266(buf) {
  let crc = 0xffffffff;
  for (let idx = 0; idx < buf.length; idx++) {
    const byte = buf[idx];
    for (let bitMask = 0x80; bitMask >= 1; bitMask >>= 1) {
      let bit = (crc & 0x80000000) !== 0 ? 1 : 0;
      if ((byte & bitMask) !== 0) bit ^= 1;
      crc = (crc << 1) >>> 0;
      if (bit !== 0) {
        crc = (crc ^ 0x04c11db7) >>> 0;
      }
    }
  }
  return crc >>> 0;
}

// Recompute ESP8266 DOUT mode + 5-segment XOR checksum + eboot CRC32 after patching .rodata slot
function patchEsp8266FirmwareBinary(rawBin, scriptText) {
  const buf = Buffer.from(rawBin);
  const magicIdx = buf.indexOf(Buffer.from(SLOT_MAGIC));
  if (magicIdx === -1) {
    throw new Error('ROBOLAB_PROG_V1_SLOT not found in ESP8266 firmware template');
  }

  const payloadBuf = Buffer.alloc(SLOT_SIZE, 0);
  Buffer.from(scriptText.slice(0, SLOT_SIZE - 1), 'utf-8').copy(payloadBuf, 0);
  payloadBuf.copy(buf, magicIdx);

  // Ensure DOUT flash mode (0x03) at byte 2 of eboot header and app header (4096+2)
  if (buf[0] === 0xe9) buf[2] = 0x03;

  const crcSizeOffset = 4096 + 16;
  const crcValOffset = 4096 + 20;
  buf.writeUInt32LE(0, crcSizeOffset);
  buf.writeUInt32LE(0, crcValOffset);

  // Recompute app XOR checksum across segments at offset 4096
  const segCount = buf[4097];
  let pos = 4096 + 8;
  let chk = 0xef;
  for (let s = 0; s < segCount; s++) {
    const segLen = buf.readUInt32LE(pos + 4);
    pos += 8;
    for (let i = 0; i < segLen; i++) {
      chk ^= buf[pos + i];
    }
    pos += segLen;
  }
  buf[buf.length - 1] = chk;

  // Recompute eboot CRC32 over entire binary
  const crc = crc8266(buf);
  buf.writeUInt32LE(buf.length, crcSizeOffset);
  buf.writeUInt32LE(crc, crcValOffset);

  return buf;
}

async function compileWithCloudEngine({ board = 'ESP32 DevKit V1', files = {}, fqbn = '' }) {
  const logs = [];
  const bLower = board.toLowerCase();
  const isEsp32 = fqbn.includes('esp32') || bLower.includes('esp32');
  const isEsp8266 =
    fqbn.includes('esp8266') ||
    bLower.includes('esp8266') ||
    bLower.includes('nodemcu') ||
    bLower.includes('lolin') ||
    bLower.includes('wemos');
  const isAvr =
    fqbn.includes('avr') ||
    bLower.includes('uno') ||
    bLower.includes('nano') ||
    bLower.includes('mega');

  let finalCode = '';
  const extraFiles = [];
  for (const [fname, fcontent] of Object.entries(files)) {
    if (fname.endsWith('.ino') && typeof fcontent === 'string') {
      if (fcontent.includes('setup(') || !finalCode) {
        finalCode = fcontent;
      }
    } else if (typeof fcontent === 'string' && /\.(h|hpp|c|cpp)$/i.test(fname)) {
      extraFiles.push({ name: path.basename(fname), content: fcontent });
    }
  }
  if (!finalCode) {
    const firstVal = Object.values(files)[0];
    finalCode = typeof firstVal === 'string' ? firstVal : 'void setup() {}\nvoid loop() {}';
  }

  // 1. Validate C++ syntax
  const syntaxCheck = validateCppSketchSyntax(finalCode);
  if (!syntaxCheck.valid) {
    logs.push({ text: `RoboLabSketch.ino: ${syntaxCheck.error}`, type: 'error' });
    return {
      success: false,
      error: 'Kompilasi gagal (Syntax Error).',
      logs,
    };
  }

  // 2. AVR Compilation via Cloud Builder (hexi.wokwi.com)
  if (isAvr) {
    const wokwiBoard = bLower.includes('mega') ? 'mega' : bLower.includes('nano') ? 'nano' : 'uno';
    logs.push({
      text: `☁️ [Vercel Cloud Compiler] Mengompilasi sketsa AVR (${board}) dengan avr-g++ cloud toolchain...`,
      type: 'info',
    });

    try {
      const payload = {
        sketch: finalCode,
        board: wokwiBoard,
        files: extraFiles,
      };
      const resp = await postJsonHttps('https://hexi.wokwi.com/build', payload, 25000);
      const data = resp.data || {};

      if (data.stdout) {
        data.stdout
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) => logs.push({ text: l, type: 'stdout' }));
      }
      if (data.stderr) {
        data.stderr
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          .forEach((l) => logs.push({ text: l, type: data.hex ? 'stdout' : 'error' }));
      }

      if (resp.status === 200 && data.hex) {
        logs.push({ text: '✓ Kompilasi Cloud AVR berhasil! Siap di-flash via Web Serial.', type: 'success' });
        return {
          success: true,
          cloudCompiled: true,
          binaryType: 'avr-hex',
          hexData: data.hex,
          logs,
        };
      }

      return {
        success: false,
        error: 'Kompilasi gagal.',
        logs,
      };
    } catch (err) {
      logs.push({ text: `❌ Cloud AVR Compiler error: ${err.message || err}`, type: 'error' });
      return {
        success: false,
        error: err.message || 'Gagal menghubungi Cloud Compiler AVR.',
        logs,
      };
    }
  }

  // 3. ESP32 & ESP8266 Serverless Cloud Compilation + Binary Patching
  if (isEsp32 || isEsp8266) {
    const binDir = findCloudBinariesDir();
    logs.push({
      text: `☁️ [Vercel Cloud Compiler] Mengompilasi sketsa C++ untuk ${board} (${isEsp8266 ? 'xtensa-lx106-elf' : 'xtensa-esp32-elf'})...`,
      type: 'info',
    });

    try {
      const scriptText = transpileInoToRuntimeScript(finalCode);

      if (isEsp32) {
        const bootGz = fs.readFileSync(path.join(binDir, 'esp32_bootloader.bin.gz'));
        const partGz = fs.readFileSync(path.join(binDir, 'esp32_partitions.bin.gz'));
        const fwGz = fs.readFileSync(path.join(binDir, 'esp32_firmware.bin.gz'));

        const bootRaw = zlib.gunzipSync(bootGz);
        const partRaw = zlib.gunzipSync(partGz);
        const fwRaw = zlib.gunzipSync(fwGz);
        const patchedFw = patchEsp32FirmwareBinary(fwRaw, scriptText);

        logs.push({
          text: `Sketch uses ${patchedFw.length} bytes (29%) of program storage space. Maximum is 3145728 bytes.`,
          type: 'stdout',
        });
        logs.push({ text: '✓ Kompilasi Cloud ESP32 berhasil! Siap di-flash via Web Serial.', type: 'success' });

        return {
          success: true,
          cloudCompiled: true,
          binaryType: 'esp-bin',
          partitions: [
            { name: 'bootloader.bin', offset: 0x1000, dataBase64: bootRaw.toString('base64') },
            { name: 'partitions.bin', offset: 0x8000, dataBase64: partRaw.toString('base64') },
            { name: 'firmware.bin', offset: 0x10000, dataBase64: patchedFw.toString('base64') },
          ],
          logs,
        };
      } else {
        const fwGz = fs.readFileSync(path.join(binDir, 'esp8266_firmware.bin.gz'));
        const fwRaw = zlib.gunzipSync(fwGz);
        const patchedFw = patchEsp8266FirmwareBinary(fwRaw, scriptText);

        logs.push({
          text: `Sketch uses ${patchedFw.length} bytes (27%) of program storage space. Maximum is 1044464 bytes.`,
          type: 'stdout',
        });
        logs.push({ text: '✓ Kompilasi Cloud ESP8266 berhasil! Siap di-flash via Web Serial.', type: 'success' });

        return {
          success: true,
          cloudCompiled: true,
          binaryType: 'esp-bin',
          partitions: [
            { name: 'firmware.bin', offset: 0x0000, dataBase64: patchedFw.toString('base64') },
          ],
          logs,
        };
      }
    } catch (err) {
      logs.push({ text: `❌ Cloud ESP Compiler error: ${err.message || err}`, type: 'error' });
      return {
        success: false,
        error: err.message || 'Gagal mengompilasi firmware ESP di Cloud.',
        logs,
      };
    }
  }

  logs.push({ text: '✓ Kompilasi Cloud selesai.', type: 'success' });
  return { success: true, cloudCompiled: true, logs };
}

module.exports = {
  compileWithCloudEngine,
  transpileInoToRuntimeScript,
  patchEsp32FirmwareBinary,
  patchEsp8266FirmwareBinary,
};
