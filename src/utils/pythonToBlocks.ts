/**
 * RoboLab Studio - Python to Blockly XML Converter
 * Converts standard Python / MicroPython robocode commands back to Blockly workspace XML representation
 */

export function escapeXml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface StackEntry {
  indent: number;
  type: 'loop' | 'while' | 'until' | 'if' | 'elif' | 'else' | 'root' | 'for' | 'repeat' | 'raw_statement' | 'setup_def';
  cond?: string;
  blocks: string[];
  match?: RegExpMatchArray;
}

/**
 * Strip inline `#` comments outside of string literals
 */
function stripPythonComment(line: string): string {
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
    else if (ch === '#' && !inSingle && !inDouble) {
      return line.substring(0, i);
    }
  }
  return line;
}

/**
 * Parse a sequence of Python lines into an array of top-level XML block strings.
 * When `allowTopLoopBlock` is false (e.g. inside Arduino setup/loop bodies),
 * `while True:` is converted into a `controls_whileUntil` statement block instead of `arduino_loop`.
 */
export function parsePythonLinesToBlocks(
  lines: string[],
  variables: Record<string, string> = {},
  allowTopLoopBlock: boolean = true
): string[] {
  const stack: StackEntry[] = [
    { indent: -1, type: 'root', blocks: [] }
  ];

  for (const rawLine of lines) {
    const cleanLine = stripPythonComment(rawLine);
    const trimmed = cleanLine.trim();
    if (!trimmed) continue;

    // Measure indentation (count spaces, tabs = 4 spaces)
    const leadingWhitespace = cleanLine.match(/^[\t ]*/)?.[0] || '';
    const indent = leadingWhitespace.replace(/\t/g, '    ').length;

    // If indentation decreased, pop items from stack
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      popStack(stack, variables);
    }

    // Handle def setup(): and def loop():
    if (/^def\s+setup\s*\(\s*\)\s*:/.test(trimmed)) {
      stack.push({ indent, type: 'setup_def', blocks: [] });
      continue;
    }
    if (/^def\s+loop\s*\(\s*\)\s*:/.test(trimmed)) {
      stack.push({ indent, type: allowTopLoopBlock ? 'loop' : 'while', cond: 'True', blocks: [] });
      continue;
    }

    // Skip boilerplate imports and runner headers
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('from ') ||
      trimmed.startsWith('def run_robot(') ||
      trimmed.startsWith('def run_hex(') ||
      trimmed.startsWith('print("Robot process started")') ||
      trimmed.startsWith('print("Executing HEX program...")') ||
      trimmed.startsWith('if __name__ ==') ||
      trimmed === 'run_robot()' ||
      trimmed === 'run_hex()' ||
      trimmed === 'setup()' ||
      trimmed === 'loop()' ||
      trimmed.startsWith('try:') ||
      trimmed.startsWith('except')
    ) {
      continue;
    }

    // Capture explicit hardware initializations in variables
    if (trimmed.match(/=\s*(?:machine\.)?(Pin|PWM|ADC)\(/)) {
      const varMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (varMatch) {
        variables[varMatch[1]] = varMatch[2];
      }
      continue;
    }

    // Skip ADC attenuation / PWM deinit boilerplate
    if (trimmed.match(/\.atten\(/) || trimmed.match(/\.deinit\(\)/)) {
      continue;
    }

    // Parse control structures
    if (trimmed === 'while True:' || trimmed === 'while 1:' || trimmed === 'while (True):' || trimmed === 'while (1):') {
      const isAtRoot = stack.length === 1 || (stack.length === 2 && stack[1].type === 'setup_def');
      if (allowTopLoopBlock && isAtRoot) {
        stack.push({ indent, type: 'loop', blocks: [] });
      } else {
        stack.push({ indent, type: 'while', cond: 'True', blocks: [] });
      }
    } else if (trimmed.startsWith('while not ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(10, trimmed.length - 1).trim();
      stack.push({ indent, type: 'until', cond, blocks: [] });
    } else if (trimmed.startsWith('while ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(6, trimmed.length - 1).trim();
      stack.push({ indent, type: 'while', cond, blocks: [] });
    } else if (trimmed.startsWith('if ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(3, trimmed.length - 1).trim();
      stack.push({ indent, type: 'if', cond, blocks: [] });
    } else if (trimmed.startsWith('elif ') && trimmed.endsWith(':')) {
      const cond = trimmed.substring(5, trimmed.length - 1).trim();
      stack.push({ indent, type: 'elif', cond, blocks: [] });
    } else if (trimmed === 'else:') {
      stack.push({ indent, type: 'else', blocks: [] });
    } else if (trimmed.startsWith('for ') && trimmed.endsWith(':')) {
      // 1-arg range: for i in range(10):
      const repeatMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(\s*([^,]+?)\s*\):$/);
      // 2 or 3-arg range: for i in range(1, 10, 1):
      const forMatch = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(\s*(.+?)\s*,\s*(.+?)\s*(?:,\s*(.+?)\s*)?\):$/);
      if (repeatMatch) {
        stack.push({ indent, type: 'repeat', cond: repeatMatch[2].trim(), blocks: [], match: repeatMatch });
      } else if (forMatch) {
        stack.push({ indent, type: 'for', cond: trimmed, blocks: [], match: forMatch });
      } else {
        stack.push({ indent, type: 'raw_statement', cond: trimmed, blocks: [] });
      }
    } else if (trimmed.endsWith(':')) {
      stack.push({ indent, type: 'raw_statement', cond: trimmed, blocks: [] });
    } else {
      // Regular statement
      const blockXml = parseStatement(trimmed, variables);
      if (blockXml) {
        if (blockXml !== '__SKIP__') {
          stack[stack.length - 1].blocks.push(blockXml);
        }
      } else {
        stack[stack.length - 1].blocks.push(`
          <block type="raw_code">
            <field name="CODE">${escapeXml(trimmed)}</field>
          </block>
        `);
      }
    }
  }

  // Collapse remaining stack
  while (stack.length > 1) {
    popStack(stack, variables);
  }

  return stack[0].blocks;
}

/**
 * Convert Python statement body directly into connected inner Blockly XML blocks
 * (without wrapping in <xml> or <block type="arduino_setup">).
 */
export function pythonBodyToBlocksXml(
  pythonCode: string,
  variables: Record<string, string> = {}
): string {
  if (!pythonCode.trim()) return '';
  const lines = pythonCode.split('\n');
  const blocks = parsePythonLinesToBlocks(lines, variables, false);
  return connectBlocks(blocks);
}

export function pythonToBlocklyXml(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const variables: Record<string, string> = {};
  const rootBlocks = parsePythonLinesToBlocks(lines, variables, true);

  const setupBlocks: string[] = [];
  const loopInnerBlocks: string[] = [];
  const otherBlocks: string[] = [];
  let foundLoop = false;

  for (const block of rootBlocks) {
    if (block.includes('type="arduino_loop"')) {
      foundLoop = true;
      otherBlocks.push(block);
    } else {
      if (!foundLoop) {
        setupBlocks.push(block);
      } else {
        loopInnerBlocks.push(block);
      }
    }
  }

  let finalXml = '';
  const setupContent = connectBlocks(setupBlocks);
  finalXml += `
    <block type="arduino_setup" x="40" y="40">
      ${setupContent ? `<statement name="STACK">${setupContent}</statement>` : ''}
    </block>
  `;

  if (otherBlocks.length > 0) {
    for (let i = 0; i < otherBlocks.length; i++) {
      const b = otherBlocks[i].replace('<block ', `<block x="40" y="${220 + i * 160}" `);
      finalXml += b;
    }
    if (loopInnerBlocks.length > 0) {
      const extraContent = connectBlocks(loopInnerBlocks);
      finalXml += `
        <block type="arduino_loop" x="40" y="${220 + otherBlocks.length * 160}">
          <statement name="STACK">${extraContent}</statement>
        </block>
      `;
    }
  } else {
    finalXml += `
      <block type="arduino_loop" x="40" y="220">
      </block>
    `;
  }

  return `<xml xmlns="https://developers.google.com/blockly/xml">${finalXml}</xml>`;
}

function popStack(stack: StackEntry[], variables: Record<string, string>) {
  const popped = stack.pop()!;
  const parent = stack[stack.length - 1];
  const innerContent = connectBlocks(popped.blocks);

  if (popped.type === 'setup_def') {
    for (const b of popped.blocks) {
      parent.blocks.push(b);
    }
    return;
  }

  let xml = '';
  if (popped.type === 'loop') {
    // Avoid pushing an empty duplicate arduino_loop if one already exists
    const alreadyHasLoop = parent.blocks.some(b => b.includes('type="arduino_loop"'));
    if (alreadyHasLoop && !innerContent.trim()) {
      return;
    }
    xml = `
      <block type="arduino_loop">
        <statement name="STACK">
          ${innerContent}
        </statement>
      </block>
    `;
  } else if (popped.type === 'while' || popped.type === 'until') {
    const mode = popped.type === 'until' ? 'UNTIL' : 'WHILE';
    const condXml = parseExpression(popped.cond || 'True', variables);
    xml = `
      <block type="controls_whileUntil">
        <field name="MODE">${mode}</field>
        <value name="BOOL">
          ${condXml}
        </value>
        <statement name="DO">
          ${innerContent}
        </statement>
      </block>
    `;
  } else if (popped.type === 'repeat') {
    const timesVal = parseExpression(popped.cond || '10', variables);
    xml = `
      <block type="controls_repeat_ext">
        <value name="TIMES">
          ${timesVal}
        </value>
        <statement name="DO">
          ${innerContent}
        </statement>
      </block>
    `;
  } else if (popped.type === 'if') {
    const condXml = parseExpression(popped.cond || 'True', variables);
    xml = `
      <block type="controls_if">
        <value name="IF0">
          ${condXml}
        </value>
        <statement name="DO0">
          ${innerContent}
        </statement>
      </block>
    `;
  } else if (popped.type === 'elif') {
    const condXml = parseExpression(popped.cond || 'True', variables);
    const lastBlockIdx = parent.blocks.length - 1;
    if (lastBlockIdx >= 0 && parent.blocks[lastBlockIdx].includes('type="controls_if"')) {
      let ifBlockXml = parent.blocks[lastBlockIdx];
      const matches = ifBlockXml.match(/<value name="IF\d+"/g);
      const nextIdx = matches ? matches.length : 1;
      const lastIndex = ifBlockXml.lastIndexOf('</block>');
      if (lastIndex !== -1) {
        const newChunk = `<value name="IF${nextIdx}">${condXml}</value><statement name="DO${nextIdx}">${innerContent}</statement>`;
        ifBlockXml = ifBlockXml.substring(0, lastIndex) + newChunk + ifBlockXml.substring(lastIndex);
        if (ifBlockXml.includes('<mutation')) {
          if (ifBlockXml.includes('elseif=')) {
            ifBlockXml = ifBlockXml.replace(/elseif="\d+"/, `elseif="${nextIdx}"`);
          } else {
            ifBlockXml = ifBlockXml.replace('<mutation', `<mutation elseif="${nextIdx}"`);
          }
        } else {
          const insertPos = ifBlockXml.indexOf('>') + 1;
          ifBlockXml = ifBlockXml.substring(0, insertPos) + `<mutation elseif="${nextIdx}"></mutation>` + ifBlockXml.substring(insertPos);
        }
        parent.blocks[lastBlockIdx] = ifBlockXml;
      }
      return;
    } else {
      xml = `
        <block type="controls_if">
          <value name="IF0">
            ${condXml}
          </value>
          <statement name="DO0">
            ${innerContent}
          </statement>
        </block>
      `;
    }
  } else if (popped.type === 'else') {
    const lastBlockIdx = parent.blocks.length - 1;
    if (lastBlockIdx >= 0 && parent.blocks[lastBlockIdx].includes('type="controls_if"')) {
      let ifBlockXml = parent.blocks[lastBlockIdx];
      const lastIndex = ifBlockXml.lastIndexOf('</block>');
      if (lastIndex !== -1) {
        ifBlockXml = ifBlockXml.substring(0, lastIndex) + `<statement name="ELSE">${innerContent}</statement>` + ifBlockXml.substring(lastIndex);
        if (ifBlockXml.includes('<mutation')) {
          if (!ifBlockXml.includes('else="1"')) {
            ifBlockXml = ifBlockXml.replace('<mutation', '<mutation else="1"');
          }
        } else {
          const insertPos = ifBlockXml.indexOf('>') + 1;
          ifBlockXml = ifBlockXml.substring(0, insertPos) + `<mutation else="1"></mutation>` + ifBlockXml.substring(insertPos);
        }
        parent.blocks[lastBlockIdx] = ifBlockXml;
      }
      return;
    } else {
      xml = `
        <block type="controls_if">
          <mutation else="1"></mutation>
          <statement name="ELSE">
            ${innerContent}
          </statement>
        </block>
      `;
    }
  } else if (popped.type === 'for') {
    const varName = popped.match![1];
    const fromRaw = popped.match![2].trim();
    let toRaw = popped.match![3].trim();
    const stepRaw = popped.match![4]?.trim() || '1';
    if (toRaw.endsWith('+ 1') || toRaw.endsWith('+1')) {
      toRaw = toRaw.replace(/\+\s*1$/, '').trim();
    } else if (toRaw.endsWith('- 1') || toRaw.endsWith('-1')) {
      if (stepRaw.startsWith('-') && toRaw === '-1') {
        toRaw = '0';
      } else if (stepRaw.startsWith('-')) {
        toRaw = toRaw.replace(/-\s*1$/, '').trim();
      }
    } else if (/^\d+$/.test(toRaw) && !stepRaw.startsWith('-')) {
      // Standard Python range(start, stop) stops at stop - 1
      const numStop = parseInt(toRaw, 10);
      const numStart = parseInt(fromRaw, 10);
      if (!isNaN(numStop) && !isNaN(numStart) && numStop > numStart) {
        toRaw = String(numStop - 1);
      }
    }
    const fromVal = parseExpression(fromRaw, variables);
    const toVal = parseExpression(toRaw, variables);
    const byVal = parseExpression(stepRaw, variables);
    xml = `
      <block type="controls_for">
        <field name="VAR">${escapeXml(varName)}</field>
        <value name="FROM">${fromVal}</value>
        <value name="TO">${toVal}</value>
        <value name="BY">${byVal}</value>
        <statement name="DO">
          ${innerContent}
        </statement>
      </block>
    `;
  } else if (popped.type === 'raw_statement') {
    xml = `
      <block type="raw_statement">
        <field name="CODE">${escapeXml(popped.cond || '')}</field>
        <statement name="STACK">
          ${innerContent}
        </statement>
      </block>
    `;
  }

  if (xml) {
    parent.blocks.push(xml);
  }
}

function resolvePinVariable(pinOrVar: string, variables: Record<string, string>): string {
  const cleaned = pinOrVar.trim().replace(/^["']|["']$/g, '');
  if (variables[cleaned]) {
    const def = variables[cleaned];
    if (/^[0-9]+$/.test(def) || /^[AD][0-9]+$/i.test(def)) {
      return def;
    }
    const pinMatch = def.match(/Pin\(\s*([0-9]+|"[AD]?[0-9]+"|'[AD]?[0-9]+')/);
    if (pinMatch) {
      return pinMatch[1].replace(/^["']|["']$/g, '');
    }
  }
  return cleaned;
}

function parseStatement(line: string, variables: Record<string, string>): string | null {
  line = line.trim();
  if (line === 'pass' || line.startsWith('pass ')) return '__SKIP__';

  // 0. Pin Definition and Setup Statements
  const defPinMatch = line.match(/^robot\.define_pin\(\s*["']([^"']+)["']\s*,\s*["']?([^"')]+)["']?\s*\)$/);
  if (defPinMatch) {
    return `
      <block type="arduino_define_pin">
        <field name="PIN_NAME">${escapeXml(defPinMatch[1])}</field>
        <field name="PIN_NUM">${escapeXml(defPinMatch[2])}</field>
      </block>
    `;
  }

  const defConstMatch = line.match(/^robot\.define_const\(\s*["']([^"']+)["']\s*,\s*["']?([^"')]+)["']?\s*\)$/);
  if (defConstMatch) {
    return `
      <block type="arduino_define_const">
        <field name="NAME">${escapeXml(defConstMatch[1])}</field>
        <field name="VALUE">${escapeXml(defConstMatch[2])}</field>
      </block>
    `;
  }

  const pinModeMatch = line.match(/^robot\.pin_mode\(\s*([^,]+?)\s*,\s*["']([^"']+)["']\s*\)$/);
  if (pinModeMatch) {
    const p = pinModeMatch[1].trim().replace(/^["']|["']$/g, '');
    const m = pinModeMatch[2].trim();
    return `
      <block type="arduino_pin_mode">
        <field name="PIN">${escapeXml(p)}</field>
        <field name="MODE">${escapeXml(m)}</field>
      </block>
    `;
  }

  // Custom Library Calls from Arduino converter
  const libSetPin = line.match(/^robot\.custom_lib_set_pin\(\s*["']([^"']+)["']\s*,\s*(.+?)\s*\)$/);
  if (libSetPin) {
    const safe = libSetPin[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const pinVal = libSetPin[2].trim().replace(/^["']|["']$/g, '');
    return `
      <block type="custom_${safe}_set_pin">
        <field name="PIN">${escapeXml(pinVal)}</field>
        <field name="MODE">OUTPUT</field>
      </block>
    `;
  }

  const libBegin = line.match(/^robot\.custom_lib_begin\(\s*["']([^"']+)["']\s*\)$/);
  if (libBegin) {
    const safe = libBegin[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `
      <block type="custom_${safe}_begin"></block>
    `;
  }

  const libBeginPin = line.match(/^robot\.custom_lib_begin_pin\(\s*["']([^"']+)["']\s*,\s*(.+?)\s*\)$/);
  if (libBeginPin) {
    const safe = libBeginPin[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const pinVal = libBeginPin[2].trim().replace(/^["']|["']$/g, '');
    return `
      <block type="custom_${safe}_begin_pin">
        <field name="PIN">${escapeXml(pinVal)}</field>
      </block>
    `;
  }

  const libInitObj = line.match(/^robot\.custom_lib_init\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["'](?:\s*,\s*["']([^"']*)["'])?\s*\)$/);
  if (libInitObj) {
    const safe = libInitObj[2].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const pinVal = (libInitObj[3] || '2').split(',')[0].trim().replace(/^["']|["']$/g, '');
    return `
      <block type="custom_${safe}_init_pin">
        <field name="PIN">${escapeXml(pinVal || '2')}</field>
      </block>
    `;
  }

  const libWrite = line.match(/^robot\.custom_lib_write\(\s*["']([^"']+)["']\s*,\s*(.+?)\s*\)$/);
  if (libWrite) {
    const safe = libWrite[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `
      <block type="custom_${safe}_write">
        <value name="VAL">${parseExpression(libWrite[2], variables)}</value>
      </block>
    `;
  }

  const libUpdate = line.match(/^robot\.custom_lib_update\(\s*["']([^"']+)["']\s*\)$/);
  if (libUpdate) {
    const safe = libUpdate[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    return `
      <block type="custom_${safe}_update"></block>
    `;
  }

  const libReset = line.match(/^robot\.custom_lib_reset\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)$/);
  if (libReset) {
    const safe = libReset[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const act = libReset[2];
    return `
      <block type="custom_${safe}_reset">
        <field name="ACTION">${escapeXml(act)}()</field>
      </block>
    `;
  }

  const libCall = line.match(/^robot\.custom_lib_call\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["'](?:\s*,\s*(.+?))?\s*\)$/);
  if (libCall) {
    const safe = libCall[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const method = libCall[2];
    const arg = libCall[3] && libCall[3] !== '""' ? libCall[3].trim() : '';
    return `
      <block type="custom_${safe}_call">
        <field name="METHOD">${escapeXml(method)}</field>
        ${arg ? `<value name="PARAM">${parseExpression(arg, variables)}</value>` : ''}
      </block>
    `;
  }

  // Custom Object-Oriented PWM/Pin resolution: led_pwm.duty(duty)
  const pwmMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.duty\(\s*(.+?)\s*\)$/);
  if (pwmMatch) {
    const varName = pwmMatch[1];
    const val = pwmMatch[2];
    let pin = '2';
    let freq = '1000';
    const pwmDef = variables[varName];
    if (pwmDef) {
      const inlinePinMatch = pwmDef.match(/Pin\(\s*(\d+)/);
      if (inlinePinMatch) {
        pin = inlinePinMatch[1];
      } else {
        const pinMatch = pwmDef.match(/PWM\(\s*(?:machine\.)?([a-zA-Z0-9_]+)/);
        if (pinMatch) {
          pin = resolvePinVariable(pinMatch[1], variables);
        }
      }
      const freqMatch = pwmDef.match(/freq\s*=\s*(\d+)/);
      if (freqMatch) {
        freq = freqMatch[1];
      }
    } else if (/^pwm(\d+)$/i.test(varName)) {
      pin = varName.replace(/^pwm/i, '');
    }
    return `
      <block type="pin_analog_write">
        <field name="PIN">${escapeXml(pin)}</field>
        <field name="FREQ">${escapeXml(freq)}</field>
        <value name="VALUE">${parseExpression(val, variables)}</value>
      </block>
    `;
  }

  // Custom Object-Oriented Pin write: led.on(), led.off(), led.value(1)
  const pinWriteMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(on|off|value)\(\s*([^)]*)\s*\)$/);
  if (pinWriteMatch) {
    const varName = pinWriteMatch[1];
    const action = pinWriteMatch[2];
    const val = pinWriteMatch[3].trim();
    if (action === 'value' && val === '') {
      // It's a read, not a write
    } else {
      let state = 'LOW';
      if (action === 'on' || val === '1' || val === 'True' || val === 'HIGH') state = 'HIGH';
      else if (action === 'off' || val === '0' || val === 'False' || val === 'LOW') state = 'LOW';

      let pin = resolvePinVariable(varName, variables);
      if (pin === varName && /^pin(\d+)$/i.test(varName)) {
        pin = varName.replace(/^pin/i, '');
      } else if (pin === varName && /^led(\d*)$/i.test(varName)) {
        const num = varName.replace(/^led/i, '');
        pin = num || '2';
      }
      return `
        <block type="pin_digital_write">
          <field name="PIN">${escapeXml(pin)}</field>
          <field name="STATE">${state}</field>
        </block>
      `;
    }
  }

  // 1. Delay: time.sleep(1.0), time.sleep_ms(500), sleep(500)
  let match = line.match(/^(?:await\s+)?(?:time|asyncio|uasyncio)\.sleep\(\s*(.+?)\s*\)$/);
  if (match) {
    const numVal = parseFloat(match[1]);
    const ms = !isNaN(numVal) ? Math.round(numVal * 1000) : 1000;
    return `
      <block type="arduino_delay">
        <field name="MS">${ms}</field>
      </block>
    `;
  }
  match = line.match(/^(?:time\.)?sleep_ms\(\s*(.+?)\s*\)$/) || line.match(/^sleep\(\s*(.+?)\s*\)$/);
  if (match) {
    const numVal = parseFloat(match[1]);
    const ms = !isNaN(numVal) ? Math.round(numVal) : 500;
    return `
      <block type="arduino_delay">
        <field name="MS">${ms}</field>
      </block>
    `;
  }

  // 2. Digital write: digital_write(2, "HIGH")
  match = line.match(/^(?:robot\.)?digital_write\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/) ||
          line.match(/^(?:machine\.)?Pin\(\s*([^,]+?)\s*,\s*(?:machine\.)?Pin\.OUT\s*\)\.value\(\s*([01])\s*\)$/) ||
          line.match(/^pin([a-zA-Z0-9_]+)\.write_digital\(\s*([01])\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    let state = match[2].trim().replace(/^["']|["']$/g, '');
    if (state === '1' || state === 'True' || state === 'true' || state === 'HIGH') state = 'HIGH';
    else state = 'LOW';
    return `
      <block type="pin_digital_write">
        <field name="PIN">${escapeXml(pin)}</field>
        <field name="STATE">${state}</field>
      </block>
    `;
  }

  // 3. Analog write: analog_write(5, 128[, 1000])
  match = line.match(/^(?:robot\.)?analog_write\(\s*([^,]+?)\s*,\s*(.+?)(?:\s*,\s*(\d+))?\s*\)$/) ||
          line.match(/^(?:machine\.)?PWM\((?:machine\.)?Pin\(\s*([^)]+?)\s*\)(?:[^)]*)\)\.duty\(\s*(.+?)\s*\)$/) ||
          line.match(/^pin([a-zA-Z0-9_]+)\.write_analog\(\s*(.+?)\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    const val = match[2].trim();
    const freq = match[3] || '1000';
    return `
      <block type="pin_analog_write">
        <field name="PIN">${escapeXml(pin)}</field>
        <field name="FREQ">${escapeXml(freq)}</field>
        <value name="VALUE">${parseExpression(val, variables)}</value>
      </block>
    `;
  }

  // 4. Servo write: servo_write(9, 90)
  match = line.match(/^(?:robot\.)?servo_write\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/) ||
          line.match(/^servo\.write_angle\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    const angleExpr = match[2].trim();
    return `
      <block type="arduino_servo_write">
        <field name="PIN">${escapeXml(pin)}</field>
        <value name="ANGLE">
          ${parseExpression(angleExpr, variables)}
        </value>
      </block>
    `;
  }

  // 5. Tone / noTone
  match = line.match(/^(?:robot\.)?tone\(\s*([^,]+?)\s*,\s*([^,]+?)(?:\s*,\s*(.+?))?\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    const freq = match[2].trim();
    const dur = match[3]?.trim() || '500';
    return `
      <block type="arduino_tone">
        <field name="PIN">${escapeXml(pin)}</field>
        <value name="FREQ">${parseExpression(freq, variables)}</value>
        <value name="DURATION">${parseExpression(dur, variables)}</value>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?(?:no_tone|noTone)\(\s*([^)]+?)\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    return `
      <block type="arduino_notone">
        <field name="PIN">${escapeXml(pin)}</field>
      </block>
    `;
  }

  // 6. Serial print / print
  match = line.match(/^print\((.*)\)$/);
  if (match) {
    const expr = match[1].trim();
    if (expr.endsWith(", end=''") || expr.endsWith(', end=""')) {
      const inner = expr.substring(0, expr.length - 8).trim();
      return `
        <block type="arduino_serial_print_inline">
          <value name="TEXT">
            ${parseExpression(inner, variables)}
          </value>
        </block>
      `;
    } else {
      return `
        <block type="arduino_serial_print">
          <value name="TEXT">
            ${parseExpression(expr, variables)}
          </value>
        </block>
      `;
    }
  }

  // 7. WiFi connect: robot.wifi_connect("SSID", "PASS") or wifi.connect(SSID, PASS)
  match = line.match(/^(?:robot\.wifi_connect|wifi\.connect)\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_wifi_connect">
        <value name="SSID">${parseExpression(match[1], variables)}</value>
        <value name="PASS">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }

  // 8. Blynk blocks
  match = line.match(/^(?:robot\.)?blynk_config\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="blynk_config">
        <value name="TEMPLATE_ID">${parseExpression(match[1], variables)}</value>
        <value name="TEMPLATE_NAME">${parseExpression(match[2], variables)}</value>
        <value name="AUTH_TOKEN">${parseExpression(match[3], variables)}</value>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?blynk_begin\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="blynk_begin">
        <value name="AUTH">${parseExpression(match[1], variables)}</value>
        <value name="SSID">${parseExpression(match[2], variables)}</value>
        <value name="PASS">${parseExpression(match[3], variables)}</value>
      </block>
    `;
  }
  if (line === 'robot.blynk_run()' || line === 'blynk_run()') {
    return `<block type="blynk_run"></block>`;
  }
  match = line.match(/^(?:robot\.)?blynk_virtual_write\(\s*["']?([a-zA-Z0-9_]+)["']?\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="blynk_virtual_write">
        <field name="VPIN">${escapeXml(match[1])}</field>
        <value name="VALUE">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }

  // 9. WebSocket blocks
  match = line.match(/^(?:robot\.)?websocket_connect\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_websocket_connect">
        <value name="HOST">${parseExpression(match[1], variables)}</value>
        <value name="PORT">${parseExpression(match[2], variables)}</value>
        <value name="PATH">${parseExpression(match[3], variables)}</value>
      </block>
    `;
  }
  if (line === 'robot.websocket_loop()' || line === 'websocket_loop()') {
    return `<block type="esp32_websocket_loop"></block>`;
  }
  match = line.match(/^(?:robot\.websocket_send|websocket_send|ws\.send)\(\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_websocket_send">
        <value name="TEXT">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }

  // 10. DHT Init: robot.dht_init(4, "DHT11")
  match = line.match(/^(?:robot\.)?dht_init\(\s*([^,]+?)\s*,\s*["']?(.+?)["']?\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    return `
      <block type="dht_init">
        <field name="PIN">${escapeXml(pin)}</field>
        <field name="TYPE">${escapeXml(match[2])}</field>
      </block>
    `;
  }

  // 11. MPU Init
  if (line === 'robot.mpu_init()' || line === 'mpu_init()') {
    return `<block type="mpu6050_init"></block>`;
  }

  // 12. Neopixel Init / Set Color / Show
  match = line.match(/^(?:robot\.)?neopixel_init\(\s*([^,]+?)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    const pin = resolvePinVariable(match[1], variables);
    return `
      <block type="neopixel_init">
        <field name="PIN">${escapeXml(pin)}</field>
        <field name="NUM">${escapeXml(match[2])}</field>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?neopixel_set_color\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="neopixel_set_color">
        <value name="INDEX">${parseExpression(match[1], variables)}</value>
        <value name="R">${parseExpression(match[2], variables)}</value>
        <value name="G">${parseExpression(match[3], variables)}</value>
        <value name="B">${parseExpression(match[4], variables)}</value>
      </block>
    `;
  }
  if (line === 'robot.neopixel_show()' || line === 'neopixel_show()') {
    return `<block type="neopixel_show"></block>`;
  }

  // 13. Display (OLED SSD1306)
  if (line === 'robot.display_begin()' || line === 'display_begin()' || line.includes('SSD1306_I2C(')) {
    return `<block type="lib_display_begin"></block>`;
  }
  if (line === 'robot.display_clear()' || line === 'display_clear()' || line === 'oled.fill(0)') {
    return `<block type="lib_display_clear"></block>`;
  }
  if (line === 'oled.show()' || line === 'display.display()') {
    return '__SKIP__';
  }
  match = line.match(/^(?:robot\.)?display_setcursor\(\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    return `
      <block type="lib_display_setcursor">
        <field name="X">${escapeXml(match[1])}</field>
        <field name="Y">${escapeXml(match[2])}</field>
      </block>
    `;
  }
  match = line.match(/^oled\.text\(\s*(.+?)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    return `
      <block type="lib_display_setcursor">
        <field name="X">${escapeXml(match[2])}</field>
        <field name="Y">${escapeXml(match[3])}</field>
        <next>
          <block type="lib_display_print">
            <value name="TEXT">${parseExpression(match[1], variables)}</value>
          </block>
        </next>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?display_print\(\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="lib_display_print">
        <value name="TEXT">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }

  // 14. FastLED
  match = line.match(/^(?:robot\.)?fastled_begin\(\s*([^,]+?)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    return `
      <block type="lib_fastled_begin">
        <field name="PIN">${escapeXml(resolvePinVariable(match[1], variables))}</field>
        <field name="NUM">${escapeXml(match[2])}</field>
      </block>
    `;
  }
  if (line === 'robot.fastled_show()' || line === 'fastled_show()') {
    return `<block type="lib_fastled_show"></block>`;
  }
  match = line.match(/^(?:robot\.)?fastled_setrgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (match) {
    return `
      <block type="lib_fastled_setrgb">
        <field name="IDX">${escapeXml(match[1])}</field>
        <field name="R">${escapeXml(match[2])}</field>
        <field name="G">${escapeXml(match[3])}</field>
        <field name="B">${escapeXml(match[4])}</field>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?fastled_brightness\(\s*(\d+)\s*\)$/);
  if (match) {
    return `
      <block type="lib_fastled_brightness">
        <field name="VAL">${escapeXml(match[1])}</field>
      </block>
    `;
  }

  // 15. MQTT
  if (line === 'robot.mqtt_init()' || line === 'mqtt_init()') {
    return `<block type="mqtt_init"></block>`;
  }
  match = line.match(/^(?:robot\.)?mqtt_publish\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="mqtt_publish">
        <value name="TOPIC">${parseExpression(match[1], variables)}</value>
        <value name="MSG">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?mqtt_subscribe\(\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="mqtt_subscribe">
        <value name="TOPIC">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }

  // 16. Bluetooth
  match = line.match(/^(?:robot\.)?bluetooth_begin\(\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_bluetooth_begin">
        <value name="NAME">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }
  match = line.match(/^(?:robot\.)?bluetooth_write\(\s*(.+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_bluetooth_write">
        <value name="DATA">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }

  // 17. RFID / SD / Stepper / BME / GPS
  match = line.match(/^(?:robot\.)?rfid_begin\(\s*["']?([^"',]+)["']?\s*,\s*["']?([^"',]+)["']?\s*\)$/);
  if (match) {
    return `
      <block type="lib_rfid_i2c_begin">
        <field name="SDA">${escapeXml(match[1])}</field>
        <field name="SCL">${escapeXml(match[2])}</field>
      </block>
    `;
  }
  if (line === 'robot.rfid_print_uid()' || line === 'rfid_print_uid()') {
    return `<block type="lib_rfid_print_uid"></block>`;
  }
  match = line.match(/^(?:robot\.)?sd_begin\(\s*([^)]+)\s*\)$/);
  if (match) {
    return `<block type="lib_sd_begin"><field name="PIN">${escapeXml(resolvePinVariable(match[1], variables))}</field></block>`;
  }
  match = line.match(/^(?:robot\.)?sd_open\(\s*(.+?)\s*\)$/);
  if (match) {
    return `<block type="lib_sd_open"><value name="NAME">${parseExpression(match[1], variables)}</value></block>`;
  }
  match = line.match(/^(?:robot\.)?sd_write\(\s*(.+?)\s*\)$/);
  if (match) {
    return `<block type="lib_sd_write"><value name="DATA">${parseExpression(match[1], variables)}</value></block>`;
  }
  if (line === 'robot.sd_close()' || line === 'sd_close()') {
    return `<block type="lib_sd_close"></block>`;
  }

  // 18. Micro:bit statements
  match = line.match(/^display\.scroll\(\s*(.+?)\s*\)$/);
  if (match) {
    return `<block type="basic_show_string"><value name="TEXT">${parseExpression(match[1], variables)}</value></block>`;
  }
  match = line.match(/^display\.show\(\s*Image\.([A-Z_]+)\s*\)$/);
  if (match) {
    return `<block type="basic_show_icon"><field name="ICON">${escapeXml(match[1])}</field></block>`;
  }
  match = line.match(/^display\.show\(\s*(.+?)\s*\)$/);
  if (match && !match[1].startsWith('Image(')) {
    return `<block type="basic_show_number"><value name="NUMBER">${parseExpression(match[1], variables)}</value></block>`;
  }
  if (line === 'display.clear()') {
    return `<block type="basic_clear_screen"></block>`;
  }
  match = line.match(/^music\.pitch\(\s*(.+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    return `<block type="music_play_tone"><value name="NOTE">${parseExpression(match[1], variables)}</value><value name="DURATION">${parseExpression(match[2], variables)}</value></block>`;
  }

  // 19. Compound assignment: x += 1, x -= 1
  const compoundMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|\/=)\s*(.+)$/);
  if (compoundMatch) {
    const varName = compoundMatch[1];
    const opMap: Record<string, string> = { '+=': '+', '-=': '-', '*=': '*', '/=': '/' };
    const op = opMap[compoundMatch[2]] || '+';
    const rhs = `${varName} ${op} (${compoundMatch[3]})`;
    return `
      <block type="variables_set">
        <field name="VAR">${escapeXml(varName)}</field>
        <value name="VALUE">
          ${parseExpression(rhs, variables)}
        </value>
      </block>
    `;
  }

  // 20. Variable Assignment: x = 10
  const varMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  if (varMatch) {
    const varName = varMatch[1];
    const rhs = varMatch[2].trim();
    // Skip WiFi / I2C / Socket object initializations
    if (rhs.startsWith('network.WLAN(') || rhs.startsWith('machine.I2C(')) {
      variables[varName] = rhs;
      return '__SKIP__';
    }
    variables[varName] = rhs;
    return `
      <block type="variables_set">
        <field name="VAR">${escapeXml(varName)}</field>
        <value name="VALUE">
          ${parseExpression(rhs, variables)}
        </value>
      </block>
    `;
  }

  // Skip wifi.active(True)
  if (line === 'wifi.active(True)' || line === 'wifi.active(1)') {
    return '__SKIP__';
  }

  return null;
}

/**
 * Helper to check if outer parentheses wrap the entire expression
 */
function stripOuterParens(expr: string): string {
  expr = expr.trim();
  while (expr.startsWith('(') && expr.endsWith(')')) {
    let depth = 0;
    let balanced = true;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === '\\') { i++; continue; }
      if (ch === "'" && !inDouble) inSingle = !inSingle;
      else if (ch === '"' && !inSingle) inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0 && i < expr.length - 1) {
            balanced = false;
            break;
          }
        }
      }
    }
    if (balanced) {
      expr = expr.substring(1, expr.length - 1).trim();
    } else {
      break;
    }
  }
  return expr;
}

/**
 * Split expression by top-level operator (outside parentheses and quotes)
 */
function splitByTopLevelOp(expr: string, ops: string[]): { left: string; op: string; right: string } | null {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  // Scan from right-to-left for left-associative binary operators (+, -, *, /, and, or)
  for (let i = expr.length - 1; i >= 0; i--) {
    const ch = expr[i];
    if (i > 0 && expr[i - 1] === '\\') continue;
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === ')') depth++;
      else if (ch === '(') depth--;
      else if (depth === 0) {
        for (const op of ops) {
          if (expr.substring(i, i + op.length) === op) {
            // For word operators like ' and ' or ' or ', match exact boundaries
            const left = expr.substring(0, i).trim();
            const right = expr.substring(i + op.length).trim();
            if (!left || !right) continue;
            // Ensure unary minus/plus isn't mistaken for binary operator
            if ((op === '-' || op === '+') && /[+\-*/(<>=,&|]$/.test(left)) {
              continue;
            }
            return { left, op: op.trim(), right };
          }
        }
      }
    }
  }
  return null;
}

/**
 * Split comma-separated arguments at top level (outside nested parens/strings)
 */
function splitTopLevelArgs(argsStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === '\\') {
      current += ch + (argsStr[i + 1] || '');
      i++;
      continue;
    }
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (!inSingle && !inDouble) {
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      else if (ch === ',' && depth === 0) {
        result.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

export function parseExpression(expr: string, variables: Record<string, string> = {}): string {
  expr = stripOuterParens(expr.trim());
  if (!expr) {
    return `<block type="math_number"><field name="NUM">0</field></block>`;
  }

  // 0. f-string literal: f"Text {var}"
  if ((expr.startsWith('f"') && expr.endsWith('"')) || (expr.startsWith("f'") && expr.endsWith("'"))) {
    const inner = expr.substring(2, expr.length - 1);
    const parts: string[] = [];
    let lastIdx = 0;
    const regex = /\{([^}]+)\}/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(inner)) !== null) {
      if (m.index > lastIdx) {
        parts.push(`"${inner.substring(lastIdx, m.index)}"`);
      }
      parts.push(m[1].trim());
      lastIdx = m.index + m[0].length;
    }
    if (lastIdx < inner.length) {
      parts.push(`"${inner.substring(lastIdx)}"`);
    }
    if (parts.length === 1) {
      return parseExpression(parts[0], variables);
    }
    if (parts.length > 1) {
      let valuesXml = '';
      parts.forEach((p, idx) => {
        valuesXml += `<value name="ADD${idx}">${parseExpression(p, variables)}</value>`;
      });
      return `<block type="text_join"><mutation items="${parts.length}"></mutation>${valuesXml}</block>`;
    }
  }

  // 1. Text Literal (only if it's a single unbroken string literal)
  if (
    ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) &&
    !splitByTopLevelOp(expr, ['+', ',', '==', '!='])
  ) {
    const val = expr.substring(1, expr.length - 1);
    return `
      <block type="text">
        <field name="TEXT">${escapeXml(val)}</field>
      </block>
    `;
  }

  // 1b. Multiple arguments in print(a, b, c) -> text_join
  const commaParts = splitTopLevelArgs(expr);
  if (commaParts.length > 1) {
    let valuesXml = '';
    commaParts.forEach((p, idx) => {
      valuesXml += `<value name="ADD${idx}">${parseExpression(p, variables)}</value>`;
    });
    return `<block type="text_join"><mutation items="${commaParts.length}"></mutation>${valuesXml}</block>`;
  }

  // 2. Numeric Literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return `
      <block type="math_number">
        <field name="NUM">${expr}</field>
      </block>
    `;
  }

  // 2b. Boolean Literal
  if (expr === 'True' || expr === 'true' || expr === 'HIGH') {
    return `<block type="logic_boolean"><field name="BOOL">TRUE</field></block>`;
  }
  if (expr === 'False' || expr === 'false' || expr === 'LOW') {
    return `<block type="logic_boolean"><field name="BOOL">FALSE</field></block>`;
  }

  // 2c. Custom Library Value Expressions: robot.custom_lib_val("inst", "method", arg) or inst.method(arg)
  const libValMatch = expr.match(/^robot\.custom_lib_val\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["'](?:\s*,\s*(.+?))?\s*\)$/) ||
                      expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)$/);
  if (libValMatch) {
    const inst = libValMatch[1].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const method = libValMatch[2];
    const param = libValMatch[3] && libValMatch[3] !== '""' ? libValMatch[3].trim() : '';
    const skipInsts = ['math', 'time', 'robot', 'machine', 'display', 'oled', 'pixels', 'FastLED', 'Serial', 'WiFi', 'wifi', 'Blynk', 'blynk'];
    if (!skipInsts.includes(inst)) {
      if (method === 'read' || method === 'readVal' || method === 'getValue') {
        return `<block type="custom_${inst}_read"></block>`;
      }
      if (method === 'available' || method === 'isReady' || method === 'connected') {
        return `
          <block type="custom_${inst}_status">
            <field name="CHECK">${escapeXml(method)}()</field>
          </block>
        `;
      }
      return `
        <block type="custom_${inst}_call_val">
          <field name="METHOD">${escapeXml(method)}</field>
          ${param ? `<value name="PARAM">${parseExpression(param, variables)}</value>` : ''}
        </block>
      `;
    }
  }

  // 3. WiFi & Bluetooth & Blynk & Sensor status expressions (before splitting by ==)
  if (
    expr === 'WiFi.status() == WL_CONNECTED' ||
    expr === 'wifi.isconnected()' ||
    expr === 'robot.wifi_is_connected()'
  ) {
    return `<block type="esp32_wifi_status"></block>`;
  }
  if (
    expr === 'WiFi.localIP().toString()' ||
    expr === 'WiFi.localIP()' ||
    expr === 'wifi.ifconfig()' ||
    expr === 'robot.wifi_get_ip()'
  ) {
    return `<block type="esp32_wifi_ip"></block>`;
  }
  if (expr === 'Serial.available()' || expr === 'robot.serial_available()') {
    return `<block type="arduino_serial_available"></block>`;
  }
  if (expr === 'Serial.read()' || expr === 'robot.serial_read()') {
    return `<block type="arduino_serial_read"></block>`;
  }
  if (expr === 'SerialBT.available()' || expr === 'robot.bluetooth_available()') {
    return `<block type="esp32_bluetooth_available"></block>`;
  }
  if (expr === 'SerialBT.read()' || expr === 'robot.bluetooth_read()') {
    return `<block type="esp32_bluetooth_read"></block>`;
  }
  if (expr === 'dht.readTemperature()' || expr === 'robot.dht_read_temp()') {
    return `<block type="dht_read_temp"></block>`;
  }
  if (expr === 'dht.readHumidity()' || expr === 'robot.dht_read_humi()') {
    return `<block type="dht_read_humi"></block>`;
  }
  if (expr === 'param.asInt()' || expr === 'param_val') {
    return `<block type="blynk_param_as_int"></block>`;
  }
  if (expr === '_ws_has_message' || expr === 'robot.websocket_has_message()') {
    return `<block type="esp32_websocket_has_message"></block>`;
  }
  if (expr === 'robot.websocket_get_message()' || expr === 'ws.recv()') {
    return `<block type="esp32_websocket_get_message"></block>`;
  }

  // 4. Top-level Logical OR / AND
  const logicSplit = splitByTopLevelOp(expr, [' or ', ' || ', ' and ', ' && ']);
  if (logicSplit) {
    const op = (logicSplit.op === 'or' || logicSplit.op === '||') ? 'OR' : 'AND';
    return `
      <block type="logic_operation">
        <field name="OP">${op}</field>
        <value name="A">${parseExpression(logicSplit.left, variables)}</value>
        <value name="B">${parseExpression(logicSplit.right, variables)}</value>
      </block>
    `;
  }

  // 5. Logical NOT
  if (expr.startsWith('not ')) {
    return `
      <block type="logic_negate">
        <value name="BOOL">${parseExpression(expr.substring(4), variables)}</value>
      </block>
    `;
  }
  if (expr.startsWith('!') && !expr.startsWith('!=')) {
    return `
      <block type="logic_negate">
        <value name="BOOL">${parseExpression(expr.substring(1), variables)}</value>
      </block>
    `;
  }

  // 6. Logic Compare (<=, >=, ==, !=, <, >)
  const cmpSplit = splitByTopLevelOp(expr, ['<=', '>=', '==', '!=', '<', '>']);
  if (cmpSplit) {
    let op = 'EQ';
    if (cmpSplit.op === '<') op = 'LT';
    else if (cmpSplit.op === '>') op = 'GT';
    else if (cmpSplit.op === '<=') op = 'LTE';
    else if (cmpSplit.op === '>=') op = 'GTE';
    else if (cmpSplit.op === '!=') op = 'NEQ';
    else if (cmpSplit.op === '==') op = 'EQ';
    return `
      <block type="robolab_logic_compare">
        <field name="OP">${op}</field>
        <value name="A">${parseExpression(cmpSplit.left, variables)}</value>
        <value name="B">${parseExpression(cmpSplit.right, variables)}</value>
      </block>
    `;
  }

  // 7. Digital Read
  const dReadMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.value\(\)$/);
  let dReadPin: string | null = null;
  if (dReadMatch) {
    const resolved = resolvePinVariable(dReadMatch[1], variables);
    if (resolved !== dReadMatch[1]) dReadPin = resolved;
    else if (/^pin(\d+)$/i.test(dReadMatch[1])) dReadPin = dReadMatch[1].replace(/^pin/i, '');
  }
  let match = expr.match(/^(?:robot\.)?(?:digital_read|digitalRead)\(\s*([^)]+?)\s*\)$/) ||
              expr.match(/^(?:machine\.)?Pin\(\s*([^,]+?)\s*,\s*(?:machine\.)?Pin\.IN\s*\)\.value\(\)$/) ||
              expr.match(/^pin([a-zA-Z0-9_]+)\.read_digital\(\)$/);
  if (match || dReadPin) {
    const rawPin = match ? match[1] : dReadPin!;
    const pin = resolvePinVariable(rawPin, variables);
    return `
      <block type="pin_digital_read">
        <field name="PIN">${escapeXml(pin)}</field>
      </block>
    `;
  }

  // 8. Analog Read
  const adcMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.read\(\)$/);
  let adcPin: string | null = null;
  if (adcMatch) {
    const varDef = variables[adcMatch[1]];
    if (varDef) {
      const m = varDef.match(/Pin\(\s*(\d+)/) || varDef.match(/ADC\(\s*(?:machine\.)?([a-zA-Z0-9_]+)/);
      if (m) adcPin = resolvePinVariable(m[1], variables);
    } else if (/^adc(\d+)$/i.test(adcMatch[1])) {
      adcPin = adcMatch[1].replace(/^adc/i, '');
    }
  }
  match = expr.match(/^(?:robot\.)?(?:analog_read|analogRead)\(\s*([^)]+?)\s*\)$/) ||
          expr.match(/^(?:machine\.)?ADC\((?:machine\.)?Pin\(\s*([^)]+?)\s*\)\)\.read\(\)$/) ||
          expr.match(/^pin([a-zA-Z0-9_]+)\.read_analog\(\)$/);
  if (match || adcPin) {
    const rawPin = match ? match[1] : adcPin!;
    const pin = resolvePinVariable(rawPin, variables);
    return `
      <block type="pin_analog_read">
        <field name="PIN">${escapeXml(pin)}</field>
      </block>
    `;
  }

  // 9. Touch Read / Hall Read / Ultrasonic / pulseIn / map / constrain / random
  match = expr.match(/^(?:robot\.)?(?:touch_read|touchRead)\(\s*([^)]+?)\s*\)$/);
  if (match) {
    return `
      <block type="esp32_touch_read">
        <field name="PIN">${escapeXml(resolvePinVariable(match[1], variables))}</field>
      </block>
    `;
  }
  if (expr === 'robot.hall_read()' || expr === 'hall_read()' || expr === 'hallRead()') {
    return `<block type="esp32_hall_read"></block>`;
  }
  match = expr.match(/^(?:robot\.)?(?:read_ultrasonic|readUltrasonic|ultrasonic)\(\s*([^,]+?)\s*,\s*(.+?)\s*\)$/);
  if (match) {
    const trig = resolvePinVariable(match[1], variables);
    const echo = resolvePinVariable(match[2], variables);
    return `
      <block type="sensor_ultrasonic">
        <field name="TRIGGER">${escapeXml(trig)}</field>
        <field name="ECHO">${escapeXml(echo)}</field>
      </block>
    `;
  }
  if (expr === 'ukur_jarak()' && (variables['trigger'] || variables['trig'])) {
    const trig = resolvePinVariable(variables['trigger'] ? 'trigger' : 'trig', variables);
    const echo = resolvePinVariable('echo', variables);
    return `
      <block type="sensor_ultrasonic">
        <field name="TRIGGER">${escapeXml(trig)}</field>
        <field name="ECHO">${escapeXml(echo)}</field>
      </block>
    `;
  }
  match = expr.match(/^(?:robot\.)?(?:pulse_in|pulseIn)\(\s*([^,]+?)\s*,\s*["']?([A-Z]+)["']?\s*\)$/);
  if (match) {
    return `
      <block type="arduino_pulsein">
        <field name="PIN">${escapeXml(resolvePinVariable(match[1], variables))}</field>
        <field name="STATE">${escapeXml(match[2])}</field>
      </block>
    `;
  }
  match = expr.match(/^map\(\s*(.+?)\s*\)$/);
  if (match) {
    const args = splitTopLevelArgs(match[1]);
    if (args.length === 5) {
      return `
        <block type="arduino_map">
          <value name="VAL">${parseExpression(args[0], variables)}</value>
          <value name="FL">${parseExpression(args[1], variables)}</value>
          <value name="FH">${parseExpression(args[2], variables)}</value>
          <value name="TL">${parseExpression(args[3], variables)}</value>
          <value name="TH">${parseExpression(args[4], variables)}</value>
        </block>
      `;
    }
  }
  match = expr.match(/^constrain\(\s*(.+?)\s*\)$/);
  if (match) {
    const args = splitTopLevelArgs(match[1]);
    if (args.length === 3) {
      return `
        <block type="arduino_constrain">
          <value name="VAL">${parseExpression(args[0], variables)}</value>
          <value name="LOW">${parseExpression(args[1], variables)}</value>
          <value name="HIGH">${parseExpression(args[2], variables)}</value>
        </block>
      `;
    }
  }
  match = expr.match(/^(?:random\.randint|random)\(\s*(.+?)\s*\)$/);
  if (match) {
    const args = splitTopLevelArgs(match[1]);
    if (args.length === 2) {
      return `
        <block type="arduino_random">
          <value name="MIN">${parseExpression(args[0], variables)}</value>
          <value name="MAX">${parseExpression(args[1], variables)}</value>
        </block>
      `;
    }
  }

  // 10. Math functions: round, ceil, floor, sqrt, abs
  match = expr.match(/^(?:math\.)?(round|ceil|floor)\(\s*(.+?)\s*\)$/);
  if (match) {
    const fn = match[1];
    const args = splitTopLevelArgs(match[2]);
    const op = fn === 'ceil' ? 'ROUNDUP' : fn === 'floor' ? 'ROUNDDOWN' : 'ROUND';
    return `
      <block type="math_round">
        <field name="OP">${op}</field>
        <value name="NUM">${parseExpression(args[0], variables)}</value>
      </block>
    `;
  }
  match = expr.match(/^(?:math\.)?(sqrt|abs|log|log10|exp|sin|cos|tan)\(\s*(.+?)\s*\)$/);
  if (match) {
    const fnMap: Record<string, string> = {
      sqrt: 'ROOT', abs: 'ABS', log: 'LN', log10: 'LOG10', exp: 'EXP', sin: 'SIN', cos: 'COS', tan: 'TAN'
    };
    const op = fnMap[match[1]] || 'ABS';
    return `
      <block type="math_single">
        <field name="OP">${op}</field>
        <value name="NUM">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }

  // 11. Unwrap str(...) or String(...) or int(...) or float(...)
  match = expr.match(/^(?:str|String|int|float)\(\s*(.+)\s*\)$/);
  if (match && splitTopLevelArgs(match[1]).length === 1) {
    return parseExpression(match[1], variables);
  }

  // 12. Arithmetic (+, -, *, /) or String Join (+)
  const addSubSplit = splitByTopLevelOp(expr, ['+', '-']);
  if (addSubSplit) {
    // If '+' and either side is a string literal or String(...)/str(...), use text_join
    if (
      addSubSplit.op === '+' &&
      (addSubSplit.left.startsWith('"') || addSubSplit.left.startsWith("'") ||
       addSubSplit.right.startsWith('"') || addSubSplit.right.startsWith("'") ||
       addSubSplit.left.startsWith('String(') || addSubSplit.left.startsWith('str(') ||
       addSubSplit.right.startsWith('String(') || addSubSplit.right.startsWith('str('))
    ) {
      return `
        <block type="text_join">
          <mutation items="2"></mutation>
          <value name="ADD0">${parseExpression(addSubSplit.left, variables)}</value>
          <value name="ADD1">${parseExpression(addSubSplit.right, variables)}</value>
        </block>
      `;
    }
    const op = addSubSplit.op === '+' ? 'ADD' : 'MINUS';
    return `
      <block type="math_arithmetic">
        <field name="OP">${op}</field>
        <value name="A">${parseExpression(addSubSplit.left, variables)}</value>
        <value name="B">${parseExpression(addSubSplit.right, variables)}</value>
      </block>
    `;
  }

  const mulDivSplit = splitByTopLevelOp(expr, ['*', '/']);
  if (mulDivSplit) {
    const op = mulDivSplit.op === '*' ? 'MULTIPLY' : 'DIVIDE';
    return `
      <block type="math_arithmetic">
        <field name="OP">${op}</field>
        <value name="A">${parseExpression(mulDivSplit.left, variables)}</value>
        <value name="B">${parseExpression(mulDivSplit.right, variables)}</value>
      </block>
    `;
  }

  // 13. Default: Variable
  return `
    <block type="variables_get">
      <field name="VAR">${escapeXml(expr)}</field>
    </block>
  `;
}

export function connectBlocks(blocks: string[]): string {
  if (blocks.length === 0) return '';
  let result = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    let current = blocks[i].trim();
    if (!current) continue;
    // Normalize self-closing <block ... /> to <block ...></block> so <next> can be inserted
    if (current.endsWith('/>')) {
      current = current.substring(0, current.length - 2) + '></block>';
    }
    if (result) {
      const lastIndex = current.lastIndexOf('</block>');
      if (lastIndex !== -1) {
        current = current.substring(0, lastIndex) + '<next>' + result + '</next>' + current.substring(lastIndex);
      }
    }
    result = current;
  }
  return result;
}
