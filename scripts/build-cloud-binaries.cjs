// ============================================================================
// Builds the precompiled ESP32 & ESP8266 Universal Hardware Runtime binaries
// for Vercel Serverless Cloud Compilation (/api/compile) when arduino-cli is
// not running locally.
// ============================================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const { getArduinoCliPath, handleCompileRequest } = require('../server/compile-server.cjs');

const UNIVERSAL_RUNTIME_SKETCH = `
#include <Arduino.h>
#if defined(ESP32)
  #include <WiFi.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif

// 4096-byte program slot in flash (.rodata) patched by Cloud Compiler (/api/compile)
extern "C" __attribute__((used, aligned(4))) const char ROBOLAB_PROGRAM_SLOT[4096] =
  "ROBOLAB_PROG_V1_SLOT\\n"
  "SERIAL:115200\\n"
  "PINMODE:2:OUTPUT\\n"
  "===LOOP===\\n"
  "DWRITE:2:1\\n"
  "DELAY:500\\n"
  "DWRITE:2:0\\n"
  "DELAY:500\\n"
  "===END===\\n";

struct VarEntry {
  String name;
  float numVal;
  String strVal;
  bool isStr;
};

static VarEntry g_vars[24];
static int g_varCount = 0;
static int g_servoPins[8] = {-1, -1, -1, -1, -1, -1, -1, -1};

static int resolvePinNum(String p) {
  p.trim();
  if (p == "LED_BUILTIN") return 2;
  #if defined(ESP8266)
  if (p == "D0") return 16;
  if (p == "D1") return 5;
  if (p == "D2") return 4;
  if (p == "D3") return 0;
  if (p == "D4") return 2;
  if (p == "D5") return 14;
  if (p == "D6") return 12;
  if (p == "D7") return 13;
  if (p == "D8") return 15;
  if (p == "A0") return 17;
  #endif
  if (p.startsWith("A") || p.startsWith("D")) {
    return p.substring(1).toInt();
  }
  for (int i = 0; i < g_varCount; i++) {
    if (g_vars[i].name == p) return (int)g_vars[i].numVal;
  }
  return p.toInt();
}

static float readUltrasonicCm(int trigPin, int echoPin) {
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long dur = pulseIn(echoPin, HIGH, 30000);
  if (dur <= 0) return 0.0f;
  return (float)dur / 58.0f;
}

static void writeServoAngle(int pin, int angle) {
  if (angle < 0) angle = 0;
  if (angle > 180) angle = 180;
  pinMode(pin, OUTPUT);
  int pulseUs = 544 + (int)((long)angle * (2400 - 544) / 180);
  for (int i = 0; i < 6; i++) {
    digitalWrite(pin, HIGH);
    delayMicroseconds(pulseUs);
    digitalWrite(pin, LOW);
    delayMicroseconds(20000 - pulseUs);
  }
}

static float evalNumericExpr(String expr);

static String evalStringExpr(String expr) {
  expr.trim();
  if ((expr.startsWith("\\"") && expr.endsWith("\\"")) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.substring(1, expr.length() - 1);
  }
  if (expr == "WiFi.localIP()") {
    return WiFi.localIP().toString();
  }
  for (int i = 0; i < g_varCount; i++) {
    if (g_vars[i].name == expr) {
      return g_vars[i].isStr ? g_vars[i].strVal : String(g_vars[i].numVal);
    }
  }
  float v = evalNumericExpr(expr);
  if (v == (long)v) return String((long)v);
  return String(v, 2);
}

static float evalNumericExpr(String expr) {
  expr.trim();
  if (expr == "HIGH" || expr == "true" || expr == "True") return 1.0f;
  if (expr == "LOW" || expr == "false" || expr == "False") return 0.0f;
  if (expr == "millis()") return (float)millis();

  if (expr.startsWith("digitalRead(") && expr.endsWith(")")) {
    int p = resolvePinNum(expr.substring(12, expr.length() - 1));
    return (float)digitalRead(p);
  }
  if (expr.startsWith("analogRead(") && expr.endsWith(")")) {
    int p = resolvePinNum(expr.substring(11, expr.length() - 1));
    return (float)analogRead(p);
  }
  if (expr.startsWith("ultrasonic(") && expr.endsWith(")")) {
    String inner = expr.substring(11, expr.length() - 1);
    int comma = inner.indexOf(',');
    if (comma > 0) {
      int t = resolvePinNum(inner.substring(0, comma));
      int e = resolvePinNum(inner.substring(comma + 1));
      return readUltrasonicCm(t, e);
    }
  }

  // Binary operators +, -, *, /
  int plusIdx = expr.lastIndexOf('+');
  if (plusIdx > 0) {
    return evalNumericExpr(expr.substring(0, plusIdx)) + evalNumericExpr(expr.substring(plusIdx + 1));
  }
  int minusIdx = expr.lastIndexOf('-');
  if (minusIdx > 0) {
    return evalNumericExpr(expr.substring(0, minusIdx)) - evalNumericExpr(expr.substring(minusIdx + 1));
  }
  int mulIdx = expr.lastIndexOf('*');
  if (mulIdx > 0) {
    return evalNumericExpr(expr.substring(0, mulIdx)) * evalNumericExpr(expr.substring(mulIdx + 1));
  }
  int divIdx = expr.lastIndexOf('/');
  if (divIdx > 0) {
    float denom = evalNumericExpr(expr.substring(divIdx + 1));
    return denom != 0.0f ? (evalNumericExpr(expr.substring(0, divIdx)) / denom) : 0.0f;
  }

  for (int i = 0; i < g_varCount; i++) {
    if (g_vars[i].name == expr) return g_vars[i].numVal;
  }
  return expr.toFloat();
}

static bool evalCond(String cond) {
  cond.trim();
  int idx;
  if ((idx = cond.indexOf(">=")) > 0) return evalNumericExpr(cond.substring(0, idx)) >= evalNumericExpr(cond.substring(idx + 2));
  if ((idx = cond.indexOf("<=")) > 0) return evalNumericExpr(cond.substring(0, idx)) <= evalNumericExpr(cond.substring(idx + 2));
  if ((idx = cond.indexOf("==")) > 0) return evalStringExpr(cond.substring(0, idx)) == evalStringExpr(cond.substring(idx + 2));
  if ((idx = cond.indexOf("!=")) > 0) return evalStringExpr(cond.substring(0, idx)) != evalStringExpr(cond.substring(idx + 2));
  if ((idx = cond.indexOf('>')) > 0) return evalNumericExpr(cond.substring(0, idx)) > evalNumericExpr(cond.substring(idx + 1));
  if ((idx = cond.indexOf('<')) > 0) return evalNumericExpr(cond.substring(0, idx)) < evalNumericExpr(cond.substring(idx + 1));
  return evalNumericExpr(cond) != 0.0f;
}

static void setVar(String name, String rawExpr) {
  name.trim();
  rawExpr.trim();
  bool isStr = (rawExpr.startsWith("\\"") && rawExpr.endsWith("\\"")) || (rawExpr.startsWith("'") && rawExpr.endsWith("'"));
  float numVal = isStr ? 0.0f : evalNumericExpr(rawExpr);
  String strVal = isStr ? evalStringExpr(rawExpr) : String(numVal);

  for (int i = 0; i < g_varCount; i++) {
    if (g_vars[i].name == name) {
      g_vars[i].numVal = numVal;
      g_vars[i].strVal = strVal;
      g_vars[i].isStr = isStr;
      return;
    }
  }
  if (g_varCount < 24) {
    g_vars[g_varCount].name = name;
    g_vars[g_varCount].numVal = numVal;
    g_vars[g_varCount].strVal = strVal;
    g_vars[g_varCount].isStr = isStr;
    g_varCount++;
  }
}

static String g_setupLines[96];
static int g_setupCount = 0;
static String g_loopLines[160];
static int g_loopCount = 0;

static void executeBlock(String* lines, int startIdx, int endIdx) {
  int i = startIdx;
  while (i < endIdx) {
    String line = lines[i];
    line.trim();
    if (line.length() == 0 || line.startsWith("#")) {
      i++;
      continue;
    }

    if (line.startsWith("IF:")) {
      String cond = line.substring(3);
      int depth = 1;
      int elseIdx = -1;
      int endIfIdx = i + 1;
      while (endIfIdx < endIdx && depth > 0) {
        if (lines[endIfIdx].startsWith("IF:")) depth++;
        else if (lines[endIfIdx] == "ELSE" && depth == 1) elseIdx = endIfIdx;
        else if (lines[endIfIdx] == "ENDIF") {
          depth--;
          if (depth == 0) break;
        }
        endIfIdx++;
      }
      if (evalCond(cond)) {
        executeBlock(lines, i + 1, elseIdx != -1 ? elseIdx : endIfIdx);
      } else if (elseIdx != -1) {
        executeBlock(lines, elseIdx + 1, endIfIdx);
      }
      i = endIfIdx + 1;
      continue;
    }

    if (line.startsWith("FOR:")) {
      // FOR:var:start:end:step
      String rest = line.substring(4);
      int c1 = rest.indexOf(':');
      int c2 = rest.indexOf(':', c1 + 1);
      int c3 = rest.indexOf(':', c2 + 1);
      String vName = rest.substring(0, c1);
      float vStart = evalNumericExpr(rest.substring(c1 + 1, c2));
      float vEnd = evalNumericExpr(rest.substring(c2 + 1, c3));
      float vStep = evalNumericExpr(rest.substring(c3 + 1));
      int depth = 1;
      int endForIdx = i + 1;
      while (endForIdx < endIdx && depth > 0) {
        if (lines[endForIdx].startsWith("FOR:")) depth++;
        else if (lines[endForIdx] == "ENDFOR") {
          depth--;
          if (depth == 0) break;
        }
        endForIdx++;
      }
      if (vStep != 0.0f) {
        for (float v = vStart; (vStep > 0 ? v <= vEnd : v >= vEnd); v += vStep) {
          setVar(vName, String(v));
          executeBlock(lines, i + 1, endForIdx);
          yield();
        }
      }
      i = endForIdx + 1;
      continue;
    }

    if (line.startsWith("SERIAL:")) {
      long baud = line.substring(7).toInt();
      Serial.begin(baud > 0 ? baud : 115200);
    } else if (line.startsWith("PINMODE:")) {
      String rest = line.substring(8);
      int sep = rest.indexOf(':');
      int pin = resolvePinNum(rest.substring(0, sep));
      String mode = rest.substring(sep + 1);
      if (mode.indexOf("PULLUP") >= 0) pinMode(pin, INPUT_PULLUP);
      else if (mode.indexOf("IN") >= 0) pinMode(pin, INPUT);
      else pinMode(pin, OUTPUT);
    } else if (line.startsWith("DWRITE:")) {
      String rest = line.substring(7);
      int sep = rest.indexOf(':');
      int pin = resolvePinNum(rest.substring(0, sep));
      float val = evalNumericExpr(rest.substring(sep + 1));
      pinMode(pin, OUTPUT);
      digitalWrite(pin, val != 0.0f ? HIGH : LOW);
    } else if (line.startsWith("AWRITE:")) {
      String rest = line.substring(7);
      int sep = rest.indexOf(':');
      int pin = resolvePinNum(rest.substring(0, sep));
      int val = (int)evalNumericExpr(rest.substring(sep + 1));
      pinMode(pin, OUTPUT);
      analogWrite(pin, val);
    } else if (line.startsWith("SERVO:")) {
      String rest = line.substring(6);
      int sep = rest.indexOf(':');
      int pin = resolvePinNum(rest.substring(0, sep));
      int angle = (int)evalNumericExpr(rest.substring(sep + 1));
      writeServoAngle(pin, angle);
    } else if (line.startsWith("DELAY:")) {
      long ms = (long)evalNumericExpr(line.substring(6));
      if (ms > 0) delay(ms);
    } else if (line.startsWith("DELAYUS:")) {
      long us = (long)evalNumericExpr(line.substring(8));
      if (us > 0) delayMicroseconds(us);
    } else if (line.startsWith("PRINT:")) {
      Serial.print(evalStringExpr(line.substring(6)));
    } else if (line.startsWith("PRINTLN:")) {
      Serial.println(evalStringExpr(line.substring(8)));
    } else if (line.startsWith("SET:")) {
      String rest = line.substring(4);
      int sep = rest.indexOf(':');
      if (sep > 0) {
        setVar(rest.substring(0, sep), rest.substring(sep + 1));
      }
    } else if (line.startsWith("WIFI:")) {
      String rest = line.substring(5);
      int sep = rest.indexOf(':');
      String ssid = evalStringExpr(rest.substring(0, sep));
      String pass = evalStringExpr(rest.substring(sep + 1));
      WiFi.mode(WIFI_STA);
      WiFi.begin(ssid.c_str(), pass.c_str());
      int tries = 0;
      while (WiFi.status() != WL_CONNECTED && tries < 24) {
        delay(500);
        Serial.print(".");
        tries++;
      }
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println();
        Serial.print("WiFi Connected! IP: ");
        Serial.println(WiFi.localIP());
      }
    }
    i++;
  }
}

void setup() {
  volatile const char* slot = ROBOLAB_PROGRAM_SLOT;
  if (slot[4095] == 0x7f) Serial.begin(115200);

  String raw = "";
  for (int i = 0; i < 4096; i++) {
    char c = slot[i];
    if (c == '\\0') break;
    raw += c;
  }

  bool inLoop = false;
  int pos = 0;
  while (pos < (int)raw.length()) {
    int nextNl = raw.indexOf('\\n', pos);
    if (nextNl == -1) nextNl = raw.length();
    String line = raw.substring(pos, nextNl);
    line.trim();
    pos = nextNl + 1;

    if (line.length() == 0 || line == "ROBOLAB_PROG_V1_SLOT") continue;
    if (line == "===LOOP===") {
      inLoop = true;
      continue;
    }
    if (line == "===END===") break;

    if (!inLoop) {
      if (g_setupCount < 96) g_setupLines[g_setupCount++] = line;
    } else {
      if (g_loopCount < 160) g_loopLines[g_loopCount++] = line;
    }
  }

  executeBlock(g_setupLines, 0, g_setupCount);
}

void loop() {
  if (g_loopCount > 0) {
    executeBlock(g_loopLines, 0, g_loopCount);
  } else {
    delay(50);
  }
}
`;

async function main() {
  const outDir = path.join(__dirname, '..', 'server', 'cloud-binaries');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('1. Compiling Universal Hardware Runtime for ESP32...');
  const esp32Res = await handleCompileRequest({
    board: 'ESP32 DevKit V1',
    files: { 'main.ino': UNIVERSAL_RUNTIME_SKETCH },
  });
  if (!esp32Res.success) {
    console.error('ESP32 Compile failed:', esp32Res.logs);
    process.exit(1);
  }

  for (const part of esp32Res.partitions) {
    const raw = Buffer.from(part.dataBase64, 'base64');
    if (part.name === 'firmware.bin') {
      const magicIdx = raw.indexOf(Buffer.from('ROBOLAB_PROG_V1_SLOT'));
      console.log('ESP32 firmware.bin size:', raw.length, 'ROBOLAB_PROG_V1_SLOT offset:', magicIdx);
      if (magicIdx === -1) throw new Error('Magic slot not found in ESP32 firmware.bin');
    }
    const gz = zlib.gzipSync(raw, { level: 9 });
    fs.writeFileSync(path.join(outDir, `esp32_${part.name}.gz`), gz);
    console.log(`Saved esp32_${part.name}.gz (${gz.length} bytes)`);
  }

  console.log('2. Compiling Universal Hardware Runtime for ESP8266...');
  const esp8266Res = await handleCompileRequest({
    board: 'NodeMCU / ESP8266',
    files: { 'main.ino': UNIVERSAL_RUNTIME_SKETCH },
  });
  if (!esp8266Res.success) {
    console.error('ESP8266 Compile failed:', esp8266Res.logs);
    process.exit(1);
  }

  for (const part of esp8266Res.partitions) {
    const raw = Buffer.from(part.dataBase64, 'base64');
    const magicIdx = raw.indexOf(Buffer.from('ROBOLAB_PROG_V1_SLOT'));
    console.log('ESP8266 firmware.bin size:', raw.length, 'ROBOLAB_PROG_V1_SLOT offset:', magicIdx);
    if (magicIdx === -1) throw new Error('Magic slot not found in ESP8266 firmware.bin');
    const gz = zlib.gzipSync(raw, { level: 9 });
    fs.writeFileSync(path.join(outDir, `esp8266_${part.name}.gz`), gz);
    console.log(`Saved esp8266_${part.name}.gz (${gz.length} bytes)`);
  }

  console.log('ALL CLOUD BINARIES BUILT SUCCESSFULLY!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
