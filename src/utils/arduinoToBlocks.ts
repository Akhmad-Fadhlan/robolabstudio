/**
 * RoboLab Studio - Arduino C++ to Blockly XML Converter
 */
import { pythonBodyToBlocksXml, escapeXml } from './pythonToBlocks';

/**
 * Strip C++ single-line `//` comments outside string literals
 */
function stripCppLineComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '/' && line[i + 1] === '/' && !inSingle && !inDouble) {
      return line.substring(0, i);
    }
  }
  return line;
}

/**
 * Count `{` and `}` outside string literals
 */
function countBracesOutsideStrings(line: string): { open: number; close: number } {
  let open = 0;
  let close = 0;
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '\\') {
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '{') open++;
      else if (ch === '}') close++;
    }
  }
  return { open, close };
}

function parseCppSections(code: string) {
  // Remove block comments /* ... */
  const noBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
  const rawLines = noBlockComments.split('\n');

  const setupLines: string[] = [];
  const loopLines: string[] = [];
  const globalLines: string[] = [];
  const blynkBlocks: Array<{ vpin: string; lines: string[] }> = [];

  let currentSection: 'global' | 'setup' | 'loop' | 'blynk' | 'other_func' = 'global';
  let braceCount = 0;
  let waitingForOpeningBrace = false;
  let currentBlynk: { vpin: string; lines: string[] } | null = null;

  for (const rawLine of rawLines) {
    const clean = stripCppLineComment(rawLine);
    const trimmed = clean.trim();
    if (!trimmed) continue;

    const { open, close } = countBracesOutsideStrings(trimmed);

    if (currentSection === 'global') {
      const setupMatch = trimmed.match(/^void\s+setup\s*\(\s*\)\s*(.*)$/);
      if (setupMatch) {
        currentSection = 'setup';
        braceCount = open - close;
        waitingForOpeningBrace = open === 0;
        const remainder = setupMatch[1].replace(/^\{/, '').replace(/\}$/, '').trim();
        if (remainder) setupLines.push(remainder);
        if (!waitingForOpeningBrace && braceCount <= 0) {
          currentSection = 'global';
          braceCount = 0;
        }
        continue;
      }

      const loopMatch = trimmed.match(/^void\s+loop\s*\(\s*\)\s*(.*)$/);
      if (loopMatch) {
        currentSection = 'loop';
        braceCount = open - close;
        waitingForOpeningBrace = open === 0;
        const remainder = loopMatch[1].replace(/^\{/, '').replace(/\}$/, '').trim();
        if (remainder) loopLines.push(remainder);
        if (!waitingForOpeningBrace && braceCount <= 0) {
          currentSection = 'global';
          braceCount = 0;
        }
        continue;
      }

      const blynkMatch = trimmed.match(/^BLYNK_WRITE\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*(.*)$/);
      if (blynkMatch) {
        currentSection = 'blynk';
        currentBlynk = { vpin: blynkMatch[1], lines: [] };
        blynkBlocks.push(currentBlynk);
        braceCount = open - close;
        waitingForOpeningBrace = open === 0;
        if (!waitingForOpeningBrace && braceCount <= 0) {
          currentSection = 'global';
          braceCount = 0;
          currentBlynk = null;
        }
        continue;
      }

      // Skip other top-level function or class definitions (e.g. float ukur_jarak() { ... } or class PID { ... })
      if (
        (open > 0 || trimmed.endsWith(')')) &&
        (/^(?:void|int|float|double|long|unsigned\s+long|bool|String|char\s*\*?)\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(/.test(trimmed) ||
         /^class\s+[a-zA-Z_][a-zA-Z0-9_]*/.test(trimmed))
      ) {
        currentSection = 'other_func';
        braceCount = open - close;
        waitingForOpeningBrace = open === 0;
        if (!waitingForOpeningBrace && braceCount <= 0) {
          currentSection = 'global';
          braceCount = 0;
        }
        continue;
      }

      globalLines.push(trimmed);
      continue;
    }

    // Inside setup / loop / blynk / other_func
    if (waitingForOpeningBrace) {
      if (open > 0) {
        waitingForOpeningBrace = false;
        braceCount = open - close;
        if (braceCount <= 0) {
          currentSection = 'global';
          braceCount = 0;
          currentBlynk = null;
        } else if (trimmed !== '{') {
          const inner = trimmed.replace(/^\{/, '').trim();
          if (inner) {
            if (currentSection === 'setup') setupLines.push(inner);
            else if (currentSection === 'loop') loopLines.push(inner);
            else if (currentSection === 'blynk' && currentBlynk) currentBlynk.lines.push(inner);
          }
        }
      }
      continue;
    }

    const prevBraceCount = braceCount;
    braceCount += open - close;

    if (braceCount <= 0) {
      // End of current function section
      const beforeFinalBrace = trimmed.replace(/\}\s*;?\s*$/, '').trim();
      if (beforeFinalBrace && prevBraceCount === 1) {
        if (currentSection === 'setup') setupLines.push(beforeFinalBrace);
        else if (currentSection === 'loop') loopLines.push(beforeFinalBrace);
        else if (currentSection === 'blynk' && currentBlynk) currentBlynk.lines.push(beforeFinalBrace);
      }
      currentSection = 'global';
      braceCount = 0;
      currentBlynk = null;
      continue;
    }

    if (currentSection === 'setup') {
      setupLines.push(trimmed);
    } else if (currentSection === 'loop') {
      loopLines.push(trimmed);
    } else if (currentSection === 'blynk' && currentBlynk) {
      currentBlynk.lines.push(trimmed);
    }
  }

  return { globalLines, setupLines, loopLines, blynkBlocks };
}

function buildArduinoConvertContext(globalLines: string[], setupLines: string[], parsedApi?: any) {
  const variables: Record<string, string> = {};
  const pinConstants: Record<string, string> = {};
  const servoPins: Record<string, string> = {};
  const defineStatements: Array<{ name: string; val: string; isPin: boolean }> = [];
  const libInstantiations: Array<{ className: string; instanceName: string; args: string }> = [];
  const instanceToClass: Record<string, string> = {};
  const includeHeaders: string[] = [];
  let dhtConfig: { pin: string; type: string } | null = null;
  let neoConfig: { pin: string; num: string } | null = null;
  let blynkConfig: { tId?: string; tName?: string; auth?: string } = {};
  const userGlobalInits: string[] = [];

  for (const line of globalLines) {
    // #include headers
    const incMatch = line.match(/^#include\s*[<"]([^>"]+)[>"]/);
    if (incMatch) {
      includeHeaders.push(incMatch[1].trim());
      continue;
    }

    // #define constants
    const defMatch = line.match(/^#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+(.+)$/);
    if (defMatch) {
      const name = defMatch[1].trim();
      const val = defMatch[2].trim().replace(/^\(|\)$/g, '');
      if (name === 'BLYNK_TEMPLATE_ID') blynkConfig.tId = val;
      else if (name === 'BLYNK_TEMPLATE_NAME') blynkConfig.tName = val;
      else if (name === 'BLYNK_AUTH_TOKEN') blynkConfig.auth = val;
      else if (name !== 'BLYNK_PRINT') {
        variables[name] = val;
        pinConstants[name] = val;
        const isPin = /(?:pin|led|trig|echo|btn|button|relay|buzzer|sensor|pot|adc|servo|sda|scl|rx|tx|rst|irq)/i.test(name) || (/^(?:A\d+|D\d+)$/i.test(val));
        defineStatements.push({ name, val, isPin });
      }
      continue;
    }

    // DHT dht(pin, type);
    const dhtMatch = line.match(/^DHT\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)\s*;?$/);
    if (dhtMatch) {
      const rawPin = dhtMatch[1].trim();
      dhtConfig = { pin: pinConstants[rawPin] || rawPin, type: dhtMatch[2].trim() };
      instanceToClass['dht'] = 'DHT';
      continue;
    }

    // Adafruit_NeoPixel pixels(num, pin, ...);
    const neoMatch = line.match(/^Adafruit_NeoPixel\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(\s*([^,]+?)\s*,\s*([^,)]+)/);
    if (neoMatch) {
      const rawNum = neoMatch[1].trim();
      const rawPin = neoMatch[2].trim();
      neoConfig = { num: pinConstants[rawNum] || rawNum, pin: pinConstants[rawPin] || rawPin };
      instanceToClass['pixels'] = 'Adafruit_NeoPixel';
      continue;
    }

    // Servo myServo9;
    const servoDecl = line.match(/^Servo\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?$/);
    if (servoDecl) {
      const sName = servoDecl[1];
      const numMatch = sName.match(/(\d+)$/);
      servoPins[sName] = numMatch ? numMatch[1] : '9';
      instanceToClass[sName] = 'Servo';
      continue;
    }

    // const / variable declarations
    const charArrayMatch = line.match(/^(?:const\s+)?char\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*\]\s*=\s*(.+?)\s*;?$/);
    if (charArrayMatch) {
      const name = charArrayMatch[1].trim();
      const val = charArrayMatch[2].trim();
      variables[name] = val;
      pinConstants[name] = val;
      continue;
    }

    const constMatch = line.match(/^const\s+(?:int|long|float|double|byte|uint8_t|char\s*\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*;?$/);
    if (constMatch) {
      const name = constMatch[1].trim();
      const val = constMatch[2].trim();
      variables[name] = val;
      pinConstants[name] = val;
      const isPin = /(?:pin|led|trig|echo|btn|button|relay|buzzer|sensor|pot|adc|servo|sda|scl|rx|tx|rst|irq)/i.test(name) || (/^(?:A\d+|D\d+)$/i.test(val));
      defineStatements.push({ name, val, isPin });
      continue;
    }

    const varDecl = line.match(/^(?:unsigned\s+long|long|int|float|double|bool|boolean|byte|uint8_t|char\s*\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*;?$/);
    if (varDecl) {
      const name = varDecl[1].trim();
      const val = varDecl[2].trim();
      if (name === '_ws_last_message' || name === '_ws_has_message' || name === 'cardPresent') {
        continue;
      }
      // Skip auto-generated Blockly default `double x = 0;` if `x` is assigned later
      if (line.startsWith('double ') && val === '0') {
        continue;
      }
      variables[name] = val;
      // If it looks like a pin constant (e.g. int ledPin = 2;), also register in defineStatements
      if (/^(?:\d+|A\d+|D\d+)$/i.test(val) && /(?:pin|led|trig|echo|btn|button|relay|buzzer|sensor|pot|adc|servo)/i.test(name)) {
        pinConstants[name] = val;
        defineStatements.push({ name, val, isPin: true });
      } else {
        userGlobalInits.push(`${name} = ${val}`);
      }
      continue;
    }

    // Custom library object instantiation in global scope (e.g. NewPing sonar(12, 11, 200); or LiquidCrystal_I2C lcd(0x27, 16, 2);)
    const objInstMatch = line.match(/^(?:const\s+)?([a-zA-Z_][a-zA-Z0-9_:]*(?:<[^>]+>)?)\s*(?:&\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:[\({]([^)}]*)[)}]|=\s*(.+?))\s*;?$/);
    if (objInstMatch) {
      const cls = objInstMatch[1].trim();
      const inst = objInstMatch[2].trim();
      let args = (objInstMatch[3] || objInstMatch[4] || '').trim();
      if (args.startsWith(cls + '(') && args.endsWith(')')) {
        args = args.substring(cls.length + 1, args.length - 1).trim();
      }
      const skipPrimitives = /^(?:unsigned\s+long|unsigned\s+int|long|int|short|float|double|bool|boolean|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|char\s*\*?|String|void)$/;
      const skipHandled = ['Servo', 'DHT', 'Adafruit_NeoPixel'];
      if (!skipPrimitives.test(cls) && !skipHandled.includes(cls)) {
        libInstantiations.push({ className: cls, instanceName: inst, args });
        instanceToClass[inst] = cls;
      }
    }
  }

  // Scan setupLines for object declarations (some examples declare instances in setup)
  for (const line of setupLines) {
    const objInstMatch = line.match(/^(?:const\s+)?([a-zA-Z_][a-zA-Z0-9_:]*(?:<[^>]+>)?)\s*(?:&\s*)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:[\({]([^)}]*)[)}]|=\s*(.+?))\s*;?$/);
    if (objInstMatch) {
      const cls = objInstMatch[1].trim();
      const inst = objInstMatch[2].trim();
      let args = (objInstMatch[3] || objInstMatch[4] || '').trim();
      if (args.startsWith(cls + '(') && args.endsWith(')')) {
        args = args.substring(cls.length + 1, args.length - 1).trim();
      }
      const skipPrimitives = /^(?:unsigned\s+long|unsigned\s+int|long|int|short|float|double|bool|boolean|byte|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|char\s*\*?|String|void)$/;
      const skipHandled = ['Servo', 'DHT', 'Adafruit_NeoPixel'];
      if (!skipPrimitives.test(cls) && !skipHandled.includes(cls)) {
        if (!libInstantiations.some(li => li.instanceName === inst)) {
          libInstantiations.push({ className: cls, instanceName: inst, args });
          instanceToClass[inst] = cls;
        }
      }
    }
  }

  // If parsedApi is known and no instance found, check if code references methods of parsedApi
  if (parsedApi?.className && !libInstantiations.some(li => li.className.toLowerCase() === parsedApi.className.toLowerCase())) {
    const knownMethods = (parsedApi.methods || []).map((m: any) => m.name.toLowerCase());
    if (knownMethods.length > 0) {
      for (const line of [...setupLines, ...globalLines]) {
        const mCall = line.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
        if (mCall) {
          const varInst = mCall[1];
          const methodName = mCall[2];
          if (knownMethods.includes(methodName.toLowerCase()) && !['Serial', 'SerialBT', 'WiFi'].includes(varInst)) {
            libInstantiations.push({ className: parsedApi.className, instanceName: varInst, args: '' });
            instanceToClass[varInst] = parsedApi.className;
            break;
          }
        }
      }
    }
  }

  // Scan setupLines for myServo.attach(pin)
  for (const sLine of setupLines) {
    const attachMatch = sLine.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.attach\s*\(\s*([^,)]+)/);
    if (attachMatch) {
      const sName = attachMatch[1];
      const rawPin = attachMatch[2].trim();
      servoPins[sName] = pinConstants[rawPin] || rawPin;
      instanceToClass[sName] = 'Servo';
    }
  }

  return { variables, pinConstants, servoPins, dhtConfig, neoConfig, blynkConfig, userGlobalInits, defineStatements, libInstantiations, instanceToClass, includeHeaders };
}

function convertCppExpr(expr: string, pinConstants: Record<string, string>, instanceToClass: Record<string, string> = {}): string {
  let res = expr.trim();
  res = res.replace(/digitalRead\(\s*([a-zA-Z0-9_]+)\s*\)/g, (_, p) => `digital_read(${pinConstants[p] || p})`);
  res = res.replace(/analogRead\(\s*([a-zA-Z0-9_]+)\s*\)/g, (_, p) => `analog_read(${pinConstants[p] || p})`);
  res = res.replace(/touchRead\(\s*([a-zA-Z0-9_]+)\s*\)/g, (_, p) => `touch_read(${pinConstants[p] || p})`);
  res = res.replace(/pulseIn\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/g, (_, p, st) => `pulse_in(${pinConstants[p] || p}, "${st}")`);
  res = res.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False');
  res = res.replace(/\bdht\.readTemperature\s*\(\s*\)/g, 'robot.dht_read_temp()');
  res = res.replace(/\bdht\.readHumidity\s*\(\s*\)/g, 'robot.dht_read_humi()');
  res = res.replace(/\bgetRFIDUID\s*\(\s*\)/g, 'robot.rfid_read()');
  res = res.replace(/\bmfrc522\.PICC_IsNewCardPresent\s*\(\s*\)/g, 'robot.rfid_is_card()');
  res = res.replace(/\bmfrc522\.PICC_ReadCardSerial\s*\(\s*\)/g, 'robot.rfid_is_card()');
  res = res.replace(/\bgetMFRC522UID\s*\(\s*\)/g, 'robot.rfid_read()');
  res = res.replace(/\bparam\.asInt\s*\(\s*\)/g, 'robot.blynk_param_as_int()');
  res = res.replace(/\bparam_val\b/g, 'robot.blynk_param_as_int()');
  res = res.replace(/\bpinValue\b/g, 'robot.blynk_param_as_int()');
  res = res.replace(/\bF\(\s*(["'].*?["'])\s*\)/g, '$1');

  // Convert custom object and static class method calls in expressions: sonar.ping_cm(), myObj.calc(x), MFRC522Debug::PICC_DumpToSerial(...)
  res = res.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?:\.|::)([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g, (full, inst, method, args) => {
    const skipInsts = ['Serial', 'SerialBT', 'WiFi', 'pixels', 'FastLED', 'time', 'math', 'robot', 'display', 'oled'];
    if (skipInsts.includes(inst)) return full;
    const cleanArgs = (args || '').trim();
    return `robot.custom_lib_val("${inst}", "${method}", "${cleanArgs.replace(/"/g, '\\"')}")`;
  });

  return res;
}

function convertCppCondition(cond: string, pinConstants: Record<string, string>, instanceToClass: Record<string, string> = {}): string {
  let res = convertCppExpr(cond, pinConstants, instanceToClass);
  res = res.replace(/(?:robot\.rfid_read\(\)|cardUID|getRFIDUID\(\))\s*!=\s*["']["']/g, 'robot.rfid_is_card()');
  res = res.replace(/(?:robot\.rfid_read\(\)|cardUID|getRFIDUID\(\))\s*==\s*["']["']/g, 'not robot.rfid_is_card()');
  res = res.replace(/&&/g, ' and ').replace(/\|\|/g, ' or ');
  res = res.replace(/(?:^|(?<=[\s(]))!(?!=)\s*/g, 'not ');
  res = res.replace(/\bHIGH\b/g, '1').replace(/\bLOW\b/g, '0');
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

function convertCtoPython(
  cLines: string[],
  ctx: ReturnType<typeof buildArduinoConvertContext>,
  indentOffset: number = 0
): string[] {
  const pyLines: string[] = [];
  let indentLevel = indentOffset;
  const { pinConstants, servoPins, dhtConfig, neoConfig, instanceToClass } = ctx;

  const emitLine = (pyStmt: string) => {
    pyLines.push('    '.repeat(indentLevel) + pyStmt);
  };

  const resolvePin = (raw: string): string => {
    const t = raw.trim();
    return pinConstants[t] || t;
  };

  let skipWifiConnectLoop = false;
  let wifiLoopBraceDepth = 0;

  let detectedSsPin = '10';
  for (const rawLine of cLines) {
    const sm = rawLine.match(/MFRC522DriverPinSimple\s+ss_pin\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
    if (sm) {
      detectedSsPin = resolvePin(sm[1]);
      break;
    }
  }

  for (let idx = 0; idx < cLines.length; idx++) {
    let trimmed = stripCppLineComment(cLines[idx]).trim();
    if (!trimmed) continue;

    // Skip while (WiFi.status() != WL_CONNECTED) loop immediately following WiFi.begin
    if (skipWifiConnectLoop) {
      const { open, close } = countBracesOutsideStrings(trimmed);
      wifiLoopBraceDepth += open - close;
      if (wifiLoopBraceDepth <= 0) {
        skipWifiConnectLoop = false;
      }
      continue;
    }

    // Handle leading closing brace: `} else if (...) {`, `} else {`, or standalone `}`
    while (trimmed.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
      trimmed = trimmed.substring(1).trim();
    }
    if (!trimmed) continue;

    if (trimmed === '{') {
      indentLevel++;
      continue;
    }

    let hasOpeningBrace = false;
    let hasInlineClosingBrace = false;
    if (trimmed.endsWith('{}')) {
      trimmed = trimmed.substring(0, trimmed.length - 2).trim();
      hasOpeningBrace = true;
      hasInlineClosingBrace = true;
    } else if (trimmed.endsWith('{')) {
      trimmed = trimmed.substring(0, trimmed.length - 1).trim();
      hasOpeningBrace = true;
    }
    if (trimmed.endsWith(';')) {
      trimmed = trimmed.substring(0, trimmed.length - 1).trim();
    }
    if (!trimmed) {
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    // pinMode(pin, mode)
    const pinModeMatch = trimmed.match(/^pinMode\s*\(\s*([^,]+?)\s*,\s*([^)]+?)\s*\)$/);
    if (pinModeMatch) {
      const pin = resolvePin(pinModeMatch[1]);
      const mode = pinModeMatch[2].trim();
      emitLine(`robot.pin_mode(${pin}, "${mode}")`);
      continue;
    }

    // Skip Serial.begin, while(!Serial), Servo.attach, Wire.begin, OLED boilerplate
    if (
      trimmed.startsWith('Serial.begin(') ||
      trimmed.startsWith('while (!Serial') ||
      trimmed.startsWith('while(!Serial') ||
      /^[a-zA-Z_][a-zA-Z0-9_]*\.attach\s*\(/.test(trimmed) ||
      trimmed === 'int param_val = param.asInt()' ||
      trimmed === 'display.display()' ||
      trimmed === 'oled.display()' ||
      trimmed.startsWith('oled.setTextSize(') ||
      trimmed.startsWith('oled.setTextColor(') ||
      trimmed.startsWith('display.setTextSize(') ||
      trimmed.startsWith('display.setTextColor(')
    ) {
      continue;
    }

    // Control Flow: else if / if / else / for / while
    const elseIfMatch = trimmed.match(/^else\s+if\s*\((.+?)\)(?:\s*\{)?$/);
    if (elseIfMatch) {
      emitLine(`elif ${convertCppCondition(elseIfMatch[1], pinConstants)}:`);
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    const ifMatch = trimmed.match(/^if\s*\((.+?)\)(?:\s*\{)?$/);
    if (ifMatch) {
      const condRaw = ifMatch[1].trim();
      if (condRaw === '!mpu.begin()') {
        emitLine('robot.mpu_init()');
        if (hasOpeningBrace && !hasInlineClosingBrace) {
          skipWifiConnectLoop = true;
          wifiLoopBraceDepth = 1;
        }
        continue;
      }
      if (condRaw.includes('!oled.begin(') || condRaw.includes('!display.begin(')) {
        emitLine('robot.display_begin()');
        if (hasOpeningBrace && !hasInlineClosingBrace) {
          skipWifiConnectLoop = true;
          wifiLoopBraceDepth = 1;
        }
        continue;
      }
      emitLine(`if ${convertCppCondition(condRaw, pinConstants)}:`);
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    // Single-line if: if (cond) stmt
    const singleIfMatch = !hasOpeningBrace ? trimmed.match(/^if\s*\(([^)]+)\)\s+(.+)$/) : null;
    if (singleIfMatch) {
      emitLine(`if ${convertCppCondition(singleIfMatch[1], pinConstants)}:`);
      const innerPy = convertCtoPython([singleIfMatch[2]], ctx, indentLevel + 1);
      pyLines.push(...innerPy);
      continue;
    }

    if (trimmed === 'else') {
      emitLine('else:');
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    // C++ for loop: for (int i = 0; i < 10; i++) or for (int duty = 0; duty <= 255; duty += 4)
    const forMatch = trimmed.match(
      /^for\s*\(\s*(?:int|long|unsigned\s+int|byte|size_t)?\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^;]+?)\s*;\s*\1\s*(<=|>=|<|>)\s*([^;]+?)\s*;\s*(.+?)\s*\)$/
    );
    if (forMatch) {
      const varName = forMatch[1].trim();
      const startVal = convertCppExpr(forMatch[2], pinConstants);
      const cmpOp = forMatch[3];
      const endVal = convertCppExpr(forMatch[4], pinConstants);
      const stepExpr = forMatch[5].trim();

      let stepVal = '1';
      if (stepExpr.includes('++')) stepVal = '1';
      else if (stepExpr.includes('--')) stepVal = '-1';
      else {
        const stepMatch = stepExpr.match(/(\+=|-=)\s*(.+)$/);
        if (stepMatch) {
          stepVal = (stepMatch[1] === '-=' ? '-' : '') + stepMatch[2].trim();
        }
      }

      if (startVal === '0' && cmpOp === '<' && stepVal === '1') {
        emitLine(`for ${varName} in range(${endVal}):`);
      } else if (cmpOp === '<=') {
        emitLine(`for ${varName} in range(${startVal}, ${endVal} + 1, ${stepVal}):`);
      } else if (cmpOp === '>=') {
        emitLine(`for ${varName} in range(${startVal}, ${endVal} - 1, ${stepVal}):`);
      } else {
        emitLine(`for ${varName} in range(${startVal}, ${endVal}, ${stepVal}):`);
      }
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    // C++ while loop
    const whileMatch = trimmed.match(/^while\s*\((.+?)\)(?:\s*\{)?$/);
    if (whileMatch) {
      const condRaw = whileMatch[1].trim();
      if (condRaw.includes('WiFi.status()') && condRaw.includes('WL_CONNECTED')) {
        if (hasOpeningBrace && !hasInlineClosingBrace) {
          skipWifiConnectLoop = true;
          wifiLoopBraceDepth = 1;
        }
        continue;
      }
      emitLine(`while ${convertCppCondition(condRaw, pinConstants)}:`);
      if (hasOpeningBrace && !hasInlineClosingBrace) indentLevel++;
      continue;
    }

    // Statements
    if (trimmed.includes('MFRC522DriverPinSimple') || trimmed.includes('MFRC522DriverSPI') || (trimmed.startsWith('MFRC522 ') && trimmed.includes('{driver}'))) {
      continue;
    }
    if (trimmed.includes('nfc.begin()') || trimmed.includes('nfc.SAMConfig()') || trimmed.includes('mfrc522.PCD_Init()')) {
      const sda = pinConstants['SDA_PIN'] || '21';
      const scl = pinConstants['SCL_PIN'] || '22';
      emitLine(`robot.rfid_begin("${sda}", "${scl}")`);
      continue;
    }
    if (trimmed.includes('MFRC522Debug::PrintUID(') || (trimmed.includes('Serial.print') && trimmed.includes('cardUID'))) {
      emitLine('robot.rfid_print_uid()');
      continue;
    }
    if (trimmed.includes('mfrc522.PICC_HaltA()')) {
      continue;
    }
    if (trimmed.includes('MFRC522Debug::PCD_DumpVersionToSerial(') || trimmed.includes('mfrc522.PCD_StopCrypto1()') || trimmed.includes('SPI.begin()')) {
      continue;
    }

    // 1. delay(ms)
    let m = trimmed.match(/^delay\(\s*(.+?)\s*\)$/);
    if (m) {
      const num = parseFloat(m[1]);
      if (!isNaN(num)) {
        emitLine(`time.sleep(${num / 1000})`);
      } else {
        emitLine(`sleep_ms(${convertCppExpr(m[1], pinConstants)})`);
      }
      continue;
    }

    // 2. digitalWrite(pin, state)
    m = trimmed.match(/^digitalWrite\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/);
    if (m) {
      const pin = resolvePin(m[1]);
      let state = m[2].trim();
      if (state === '1' || state === 'true' || state === 'HIGH') state = 'HIGH';
      else if (state === '0' || state === 'false' || state === 'LOW') state = 'LOW';
      emitLine(`digital_write(${pin}, "${state}")`);
      continue;
    }

    // 3. analogWrite(pin, val)
    m = trimmed.match(/^analogWrite\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/);
    if (m) {
      const pin = resolvePin(m[1]);
      const val = convertCppExpr(m[2], pinConstants);
      emitLine(`analog_write(${pin}, ${val})`);
      continue;
    }

    // 4. Servo write: myServo.write(angle)
    m = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.write\(\s*(.+?)\s*\)$/);
    if (m && m[1] !== 'Serial' && m[1] !== 'SerialBT' && m[1] !== 'myFile') {
      const pin = servoPins[m[1]] || '9';
      const angle = convertCppExpr(m[2], pinConstants);
      emitLine(`servo_write(${pin}, ${angle})`);
      continue;
    }

    // 5. tone / noTone
    m = trimmed.match(/^tone\(\s*([^,]+?)\s*,\s*([^,]+?)(?:\s*,\s*(.+?))?\s*\)$/);
    if (m) {
      const pin = resolvePin(m[1]);
      const freq = convertCppExpr(m[2], pinConstants);
      const dur = m[3] ? convertCppExpr(m[3], pinConstants) : '500';
      emitLine(`tone(${pin}, ${freq}, ${dur})`);
      continue;
    }
    m = trimmed.match(/^noTone\(\s*([^)]+?)\s*\)$/);
    if (m) {
      emitLine(`no_tone(${resolvePin(m[1])})`);
      continue;
    }

    // 6. Serial.println / Serial.print
    m = trimmed.match(/^Serial\.println\(\s*(.*?)\s*\)$/);
    if (m) {
      emitLine(`print(${convertCppExpr(m[1] || '""', pinConstants)})`);
      continue;
    }
    m = trimmed.match(/^Serial\.print\(\s*(.*?)\s*\)$/);
    if (m) {
      emitLine(`print(${convertCppExpr(m[1] || '""', pinConstants)}, end='')`);
      continue;
    }

    // 7. WiFi / Bluetooth / Blynk / MQTT / WebSocket
    m = trimmed.match(/^WiFi\.begin\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
    if (m) {
      const ssid = pinConstants[m[1].trim()] || m[1].trim();
      const pass = pinConstants[m[2].trim()] || m[2].trim();
      emitLine(`robot.wifi_connect(${ssid}, ${pass})`);
      continue;
    }
    m = trimmed.match(/^SerialBT\.begin\(\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.bluetooth_begin(${convertCppExpr(m[1], pinConstants)})`);
      continue;
    }
    m = trimmed.match(/^SerialBT\.write\(\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.bluetooth_write(${convertCppExpr(m[1], pinConstants)})`);
      continue;
    }
    if (trimmed.includes('param.asInt()') && (trimmed.startsWith('int param_val') || trimmed.startsWith('int pinValue'))) {
      continue;
    }
    m = trimmed.match(/^Blynk\.begin\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)(?:\s*,\s*(.+?)\s*,\s*(.+?))?\s*\)$/);
    if (m) {
      const rawAuth = m[1].trim();
      const auth = (rawAuth === 'BLYNK_AUTH_TOKEN' && ctx.blynkConfig.auth) ? ctx.blynkConfig.auth : (pinConstants[rawAuth] || rawAuth);
      const ssid = pinConstants[m[2].trim()] || m[2].trim();
      const pass = pinConstants[m[3].trim()] || m[3].trim();
      emitLine(`robot.blynk_begin(${auth}, ${ssid}, ${pass})`);
      continue;
    }
    if (trimmed === 'Blynk.run()') {
      emitLine('robot.blynk_run()');
      continue;
    }
    m = trimmed.match(/^Blynk\.virtualWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.blynk_virtual_write("${m[1]}", ${convertCppExpr(m[2], pinConstants)})`);
      continue;
    }
    if (trimmed === 'webSocket.loop()') {
      emitLine('robot.websocket_loop()');
      continue;
    }
    m = trimmed.match(/^webSocket\.sendTXT\(\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.websocket_send(${convertCppExpr(m[1], pinConstants)})`);
      continue;
    }
    m = trimmed.match(/^client\.publish\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.mqtt_publish(${convertCppExpr(m[1], pinConstants)}, ${convertCppExpr(m[2], pinConstants)})`);
      continue;
    }
    m = trimmed.match(/^client\.subscribe\(\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.mqtt_subscribe(${convertCppExpr(m[1], pinConstants)})`);
      continue;
    }

    // 8. DHT / MPU / NeoPixel / Display / FastLED / SD
    if (trimmed === 'dht.begin()') {
      const pin = dhtConfig?.pin || '4';
      const type = dhtConfig?.type || 'DHT11';
      emitLine(`robot.dht_init(${pin}, "${type}")`);
      continue;
    }
    if (trimmed === 'mpu.begin()') {
      emitLine('robot.mpu_init()');
      continue;
    }
    if (trimmed === 'pixels.begin()') {
      const pin = neoConfig?.pin || '5';
      const num = neoConfig?.num || '8';
      emitLine(`robot.neopixel_init(${pin}, ${num})`);
      continue;
    }
    m = trimmed.match(/^pixels\.setPixelColor\(\s*([^,]+?)\s*,\s*pixels\.Color\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^)]+?)\s*\)\s*\)$/);
    if (m) {
      emitLine(`robot.neopixel_set_color(${convertCppExpr(m[1], pinConstants)}, ${convertCppExpr(m[2], pinConstants)}, ${convertCppExpr(m[3], pinConstants)}, ${convertCppExpr(m[4], pinConstants)})`);
      continue;
    }
    if (trimmed === 'pixels.show()') {
      emitLine('robot.neopixel_show()');
      continue;
    }
    if (trimmed.startsWith('display.begin(') || trimmed.startsWith('oled.begin(')) {
      emitLine('robot.display_begin()');
      continue;
    }
    if (trimmed === 'display.clearDisplay()' || trimmed === 'oled.clearDisplay()') {
      emitLine('robot.display_clear()');
      continue;
    }
    m = trimmed.match(/^(?:display|oled)\.setCursor\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (m) {
      emitLine(`robot.display_setcursor(${m[1]}, ${m[2]})`);
      continue;
    }
    m = trimmed.match(/^(?:display|oled)\.print(?:ln)?\(\s*(.+?)\s*\)$/);
    if (m) {
      emitLine(`robot.display_print(${convertCppExpr(m[1], pinConstants)})`);
      continue;
    }
    m = trimmed.match(/^FastLED\.addLeds<[^,]+,\s*([^,>]+)(?:,[^>]+)?\s*>\(\s*leds\s*,\s*(\d+)\s*\)$/);
    if (m) {
      emitLine(`robot.fastled_begin(${resolvePin(m[1])}, ${m[2]})`);
      continue;
    }
    if (trimmed === 'FastLED.show()') {
      emitLine('robot.fastled_show()');
      continue;
    }
    m = trimmed.match(/^leds\[\s*(\d+)\s*\]\s*=\s*CRGB\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
    if (m) {
      emitLine(`robot.fastled_setrgb(${m[1]}, ${m[2]}, ${m[3]}, ${m[4]})`);
      continue;
    }
    m = trimmed.match(/^FastLED\.setBrightness\(\s*(\d+)\s*\)$/);
    if (m) {
      emitLine(`robot.fastled_brightness(${m[1]})`);
      continue;
    }

    // 9. Increment / Decrement / Assignments
    m = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+\+|--)$/);
    if (m) {
      const op = m[2] === '++' ? '+' : '-';
      emitLine(`${m[1]} = ${m[1]} ${op} 1`);
      continue;
    }

    const assignMatch =
      trimmed.match(/^(?:const\s+)?(?:unsigned\s+long|long|int|float|double|bool|boolean|byte|uint8_t|char\s*\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/) ||
      trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (assignMatch) {
      const varName = assignMatch[1].trim();
      const expr = convertCppExpr(assignMatch[2].trim(), pinConstants);
      emitLine(`${varName} = ${expr}`);
      continue;
    }

    const compoundAssign = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
    if (compoundAssign) {
      emitLine(`${compoundAssign[1]} ${compoundAssign[2]} ${convertCppExpr(compoundAssign[3], pinConstants)}`);
      continue;
    }

    // 10. Flow statements: return, continue, break
    if (trimmed === 'return' || trimmed === 'return;') {
      emitLine('return');
      continue;
    }
    if (trimmed === 'continue' || trimmed === 'continue;') {
      emitLine('continue');
      continue;
    }
    if (trimmed === 'break' || trimmed === 'break;') {
      emitLine('break');
      continue;
    }

    // 11. Custom library / Object method calls: instance.method(args) or Class::method(args)
    const objCallMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:\.|::)([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)$/);
    if (objCallMatch) {
      const inst = objCallMatch[1];
      const method = objCallMatch[2];
      const rawArgs = objCallMatch[3].trim();
      const skipInstances = ['Serial', 'SerialBT', 'WiFi', 'Blynk', 'webSocket', 'client', 'display', 'oled', 'pixels', 'FastLED', 'ss'];
      if (!skipInstances.includes(inst)) {
        if (servoPins[inst] && (method === 'write' || method === 'writeMicroseconds')) {
          const pin = servoPins[inst];
          emitLine(`servo_write(${pin}, ${convertCppExpr(rawArgs, pinConstants, instanceToClass)})`);
          continue;
        }
        if (inst === 'dht' && method === 'begin') {
          const pin = dhtConfig?.pin || '4';
          const type = dhtConfig?.type || 'DHT11';
          emitLine(`robot.dht_init(${pin}, "${type}")`);
          continue;
        }
        if (method === 'setPin') {
          emitLine(`robot.custom_lib_set_pin("${inst}", ${resolvePin(rawArgs)})`);
          continue;
        }
        // General custom library call: preserves exact instance, method, and arguments
        emitLine(`robot.custom_lib_call("${inst}", "${method}", "${rawArgs.replace(/"/g, '\\"')}")`);
        continue;
      }
    }

    emitLine(trimmed);
    if (hasOpeningBrace && !hasInlineClosingBrace) {
      indentLevel++;
    }
  }

  return pyLines;
}

export function arduinoToBlocklyXml(code: string, parsedApi?: any): string {
  const { globalLines, setupLines, loopLines, blynkBlocks } = parseCppSections(code);
  const ctx = buildArduinoConvertContext(globalLines, setupLines, parsedApi);

  const setupPyLines: string[] = [];
  if (ctx.blynkConfig.tId && ctx.blynkConfig.tName && ctx.blynkConfig.auth) {
    setupPyLines.push(`robot.blynk_config(${ctx.blynkConfig.tId}, ${ctx.blynkConfig.tName}, ${ctx.blynkConfig.auth})`);
  }
  // Emit define pin & define const statements
  for (const def of ctx.defineStatements) {
    if (def.isPin) {
      setupPyLines.push(`robot.define_pin("${def.name}", "${def.val}")`);
    } else {
      setupPyLines.push(`robot.define_const("${def.name}", "${def.val}")`);
    }
  }
  // Emit custom library object init statements
  for (const libInst of ctx.libInstantiations) {
    setupPyLines.push(`robot.custom_lib_init("${libInst.className}", "${libInst.instanceName}", "${libInst.args.replace(/"/g, '\\"')}")`);
  }
  setupPyLines.push(...ctx.userGlobalInits);
  setupPyLines.push(...convertCtoPython(setupLines, ctx));

  const loopPyLines = convertCtoPython(loopLines, ctx);

  const setupInner = pythonBodyToBlocksXml(setupPyLines.join('\n'), ctx.variables);
  const loopInner = pythonBodyToBlocksXml(loopPyLines.join('\n'), ctx.variables);

  let finalXml = '<xml xmlns="https://developers.google.com/blockly/xml">';

  finalXml += `<block type="arduino_setup" id="setup" x="40" y="40">`;
  if (setupInner) {
    finalXml += `<statement name="STACK">${setupInner}</statement>`;
  }
  finalXml += `</block>`;

  finalXml += `<block type="arduino_loop" id="loop" x="40" y="240">`;
  if (loopInner) {
    finalXml += `<statement name="STACK">${loopInner}</statement>`;
  }
  finalXml += `</block>`;

  // Render any BLYNK_WRITE(V0) callback blocks
  blynkBlocks.forEach((bBlock, idx) => {
    const bPy = convertCtoPython(bBlock.lines, ctx);
    const bInner = pythonBodyToBlocksXml(bPy.join('\n'), ctx.variables);
    finalXml += `<block type="blynk_on_write" x="40" y="${440 + idx * 180}">`;
    finalXml += `<field name="VPIN">${escapeXml(bBlock.vpin)}</field>`;
    if (bInner) {
      finalXml += `<statement name="STACK">${bInner}</statement>`;
    }
    finalXml += `</block>`;
  });

  finalXml += '</xml>';
  return finalXml;
}

export function arduinoToPython(code: string, parsedApi?: any): string {
  const { globalLines, setupLines, loopLines } = parseCppSections(code);
  const ctx = buildArduinoConvertContext(globalLines, setupLines, parsedApi);

  const globalPy = ctx.userGlobalInits;
  const setupPy = convertCtoPython(setupLines, ctx);
  const loopPy = convertCtoPython(loopLines, ctx);

  let finalPython = `# RoboLab Studio - Auto Generated from Arduino\nimport robolab as robot\nimport time\n\n`;
  if (globalPy.length > 0) {
    finalPython += `# Global variables\n` + globalPy.join('\n') + `\n\n`;
  }

  finalPython += `def setup():\n`;
  if (setupPy.length > 0) {
    finalPython += setupPy.map(l => '    ' + l).join('\n') + `\n`;
  } else {
    finalPython += `    pass\n`;
  }

  finalPython += `\ndef loop():\n`;
  if (loopPy.length > 0) {
    finalPython += loopPy.map(l => '    ' + l).join('\n') + `\n`;
  } else {
    finalPython += `    pass\n`;
  }

  finalPython += `\nif __name__ == "__main__":\n    setup()\n    while True:\n        loop()\n`;
  return finalPython;
}
