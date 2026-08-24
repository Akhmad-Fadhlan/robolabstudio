/**
 * RoboLab Studio - Python to Blockly XML Converter
 * Converts standard python robocode commands back to Blockly workspace XML representation
 */

export function pythonToBlocklyXml(pythonCode: string): string {
  const lines = pythonCode.split('\n');
  const variables: Record<string, string> = {};
  
  interface StackEntry {
    indent: number;
    type: 'loop' | 'if' | 'elif' | 'else' | 'root' | 'for' | 'raw_statement';
    cond?: string;
    blocks: string[];
    match?: RegExpMatchArray;
  }
  
  const stack: StackEntry[] = [
    { indent: -1, type: 'root', blocks: [] }
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Skip boilerplate imports and function headers
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('def ') ||
      trimmed.startsWith('print("Robot process started")') ||
      trimmed.startsWith('if __name__ ==') ||
      trimmed.startsWith('run_robot()') ||
      trimmed.startsWith('loop()') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('try:') ||
      trimmed.startsWith('except') ||
      trimmed.startsWith('from machine')
    ) {
      continue;
    }

    // Capture explicit hardware initializations in variables but skip generating a block
    if (trimmed.match(/=\s*machine\.(Pin|PWM|ADC)\(/)) {
      const varMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (varMatch) {
          variables[varMatch[1]] = varMatch[2];
      }
      continue;
    }
    
    // Measure indentation (count spaces)
    const indent = line.length - line.trimStart().length;
    
    // If indentation decreased, pop items from stack
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      popStack(stack, variables);
    }
    
    // Parse structures
    if (trimmed === 'while True:') {
      stack.push({ indent, type: 'loop', blocks: [] });
    } else if (trimmed.startsWith('if ')) {
      const cond = trimmed.substring(3, trimmed.length - 1).trim(); // remove "if " and ":"
      stack.push({ indent, type: 'if', cond, blocks: [] });
    } else if (trimmed.startsWith('elif ')) {
      const cond = trimmed.substring(5, trimmed.length - 1).trim(); // remove "elif " and ":"
      stack.push({ indent, type: 'elif', cond, blocks: [] });
    } else if (trimmed === 'else:') {
      stack.push({ indent, type: 'else', blocks: [] });
    } else if (trimmed.startsWith('for ')) {
      const match = trimmed.match(/^for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+range\(\s*(.+?)\s*,\s*(.+?)\s*(?:,\s*(.+?)\s*)?\):$/);
      if (match) {
        stack.push({ indent, type: 'for', cond: trimmed, blocks: [], match });
      } else {
        stack.push({ indent, type: 'raw_statement', cond: trimmed, blocks: [] });
      }
    } else if (trimmed.endsWith(':')) {
      stack.push({ indent, type: 'raw_statement', cond: trimmed, blocks: [] });
    } else {
      // Regular statement
      const blockXml = parseStatement(trimmed, variables);
      if (blockXml) {
        stack[stack.length - 1].blocks.push(blockXml);
      } else {
        // Fallback to raw_code block
        stack[stack.length - 1].blocks.push(`
          <block type="raw_code">
            <field name="CODE">${trimmed}</field>
          </block>
        `);
      }
    }
  }
  
  // Collapse remaining stack
  while (stack.length > 1) {
    popStack(stack, variables);
  }
  
  // Group root blocks into Setup (everything before arduino_loop) and others
  const rootBlocks = stack[0].blocks;
  const setupBlocks: string[] = [];
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
        otherBlocks.push(block);
      }
    }
  }

  let finalXml = '';
  if (setupBlocks.length > 0) {
    const setupContent = connectBlocks(setupBlocks);
    finalXml += `
      <block type="arduino_setup" x="20" y="20">
        <statement name="STACK">
          ${setupContent}
        </statement>
      </block>
    `;
  }
  
  for (let i = 0; i < otherBlocks.length; i++) {
    otherBlocks[i] = otherBlocks[i].replace('<block ', `<block x="20" y="${300 + i * 100}" `);
    finalXml += otherBlocks[i];
  }
  
  // Return the main workspace XML wrapper
  return `<xml xmlns="https://developers.google.com/blockly/xml">${finalXml}</xml>`;
}

function popStack(stack: any[], variables: Record<string, string>) {
  const popped = stack.pop();
  const parent = stack[stack.length - 1];
  const innerContent = connectBlocks(popped.blocks);
  
  let xml = '';
  if (popped.type === 'loop') {
    xml = `
      <block type="arduino_loop">
        <statement name="STACK">
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
    }
  } else if (popped.type === 'else') {
    // Integrate else into the preceding controls_if block if possible
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
    const fromVal = parseExpression(popped.match![2], variables);
    let toRaw = popped.match![3];
    if (toRaw.endsWith(' + 1')) toRaw = toRaw.substring(0, toRaw.length - 4);
    const toVal = parseExpression(toRaw, variables);
    const byVal = popped.match![4] ? parseExpression(popped.match![4], variables) : parseExpression('1', variables);
    xml = `
      <block type="controls_for">
        <field name="VAR">${varName}</field>
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
        <field name="CODE">${popped.cond}</field>
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

function parseStatement(line: string, variables: Record<string, string>): string | null {
  line = line.trim();
  if (line.startsWith('pass')) return null;
  
  // Custom Object-Oriented PWM/Pin resolution
  const pwmMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.duty\(\s*(.+?)\s*\)\s*(?:#.*)?$/);
  if (pwmMatch) {
    const varName = pwmMatch[1];
    const val = pwmMatch[2];
    let pin = '1'; // Fallback
    let freq = '1000'; // Default
    const pwmDef = variables[varName];
    if (pwmDef) {
      // Try to match inline Pin first
      const inlinePinMatch = pwmDef.match(/Pin\(\s*(\d+)/);
      if (inlinePinMatch) {
          pin = inlinePinMatch[1];
      } else {
          const pinMatch = pwmDef.match(/PWM\(\s*(?:machine\.)?([a-zA-Z0-9_]+)/);
          if (pinMatch) {
            const pinVar = pinMatch[1];
            const pinDef = variables[pinVar];
            if (pinDef) {
              const numMatch = pinDef.match(/Pin\(\s*(\d+)/);
              if (numMatch) pin = numMatch[1];
            }
          }
      }
      // Extract freq
      const freqMatch = pwmDef.match(/freq\s*=\s*(\d+)/);
      if (freqMatch) {
         freq = freqMatch[1];
      }
    }
    return `
      <block type="pin_analog_write">
        <field name="PIN">${pin}</field>
        <field name="FREQ">${freq}</field>
        <value name="VALUE">${parseExpression(val, variables)}</value>
      </block>
    `;
  }

  // Custom Object-Oriented Pin write: led.on(), led.off(), led.value(1)
  const pinWriteMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(on|off|value)\(\s*([01]?)\s*\)\s*(?:#.*)?$/);
  if (pinWriteMatch) {
    const varName = pinWriteMatch[1];
    const action = pinWriteMatch[2];
    const val = pinWriteMatch[3];
    let state = 'LOW';
    if (action === 'on' || val === '1') state = 'HIGH';
    else if (action === 'off' || val === '0') state = 'LOW';
    
    let pin = '1';
    const pinDef = variables[varName];
    if (pinDef) {
      const numMatch = pinDef.match(/Pin\(\s*(\d+)/);
      if (numMatch) {
        pin = numMatch[1];
      }
    }
    return `
      <block type="pin_digital_write">
        <field name="PIN">${pin}</field>
        <field name="STATE">${state}</field>
      </block>
    `;
  }
  
  // 1. Delay: time.sleep(1.0)
  let match = line.match(/time\.sleep\(([\d\.]+)\)/);
  if (match) {
    const ms = Math.round(parseFloat(match[1]) * 1000);
    return `
      <block type="arduino_delay">
        <field name="MS">${ms}</field>
      </block>
    `;
  }
  
  // 3. Digital write: digital_write(2, "HIGH")
  match = line.match(/(?:robot\.)?digital_write\(\s*([a-zA-Z0-9_]+)\s*,\s*["']?([A-Z_]+)["']?\s*\)/) ||
          line.match(/(?:machine\.)?Pin\(\s*([a-zA-Z0-9_]+)\s*,\s*(?:machine\.)?Pin\.OUT\s*\)\.value\(\s*([01])\s*\)/) ||
          line.match(/pin([a-zA-Z0-9_]+)\.write_digital\(\s*([01])\s*\)/);
  if (match) {
    const pin = match[1];
    let state = match[2];
    if (state === '1') state = 'HIGH';
    if (state === '0') state = 'LOW';
    return `
      <block type="pin_digital_write">
        <field name="PIN">${pin}</field>
        <field name="STATE">${state}</field>
      </block>
    `;
  }
  
  // 4. Analog write: analog_write(5, 128)
  match = line.match(/(?:robot\.)?analog_write\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/) ||
          line.match(/(?:machine\.)?PWM\((?:machine\.)?Pin\(\s*([a-zA-Z0-9_]+)\s*\)(?:[^)]*)\)\.duty\(\s*(.+?)\s*\)/) ||
          line.match(/pin([a-zA-Z0-9_]+)\.write_analog\(\s*(.+?)\s*\)/);
  if (match) {
    const matchedPin = match[1] || match[3] || match[5];
    const matchedVal = match[2] || match[4] || match[6];
    return `
      <block type="pin_analog_write">
        <field name="PIN">${matchedPin}</field>
        <field name="FREQ">1000</field>
        <value name="VALUE">${parseExpression(matchedVal, variables)}</value>
      </block>
    `;
  }
  
  // 5. Servo write: servo_write(9, 90)
  match = line.match(/(?:robot\.)?servo_write\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/) ||
          line.match(/servo\.write_angle\(\s*([a-zA-Z0-9_]+)\s*,\s*(.+?)\)/);
  if (match) {
    const pin = match[1];
    const angleExpr = match[2].trim();
    return `
      <block type="arduino_servo_write">
        <field name="PIN">${pin}</field>
        <value name="ANGLE">
          ${parseExpression(angleExpr, variables)}
        </value>
      </block>
    `;
  }
  
  // 6. Serial print / print
  match = line.match(/^print\((.+?)\)\s*(?:#.*)?$/);
  if (match) {
    const expr = match[1].trim();
    if (expr.endsWith(", end=''")) {
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
  
  // 7. WiFi connect: robot.wifi_connect("SSID", "PASS")
  match = line.match(/robot\.wifi_connect\((.+?),\s*(.+?)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="esp32_wifi_connect">
        <value name="SSID">${parseExpression(match[1], variables)}</value>
        <value name="PASS">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }
  
  // 8. DHT Init: robot.dht_init(4, "DHT11")
  match = line.match(/robot\.dht_init\((\d+),\s*"(.+?)"\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="dht_init">
        <field name="PIN">${match[1]}</field>
        <field name="TYPE">${match[2]}</field>
      </block>
    `;
  }
  
  // 9. MPU Init
  if (line.includes('robot.mpu_init()')) {
    return `<block type="mpu6050_init" />`;
  }
  
  // 10. Neopixel Init
  match = line.match(/robot\.neopixel_init\((\d+),\s*(\d+)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="neopixel_init">
        <field name="PIN">${match[1]}</field>
        <field name="NUM">${match[2]}</field>
      </block>
    `;
  }
  
  // 11. Neopixel set color: robot.neopixel_set_color(idx, r, g, b)
  match = line.match(/robot\.neopixel_set_color\((.+?),\s*(.+?),\s*(.+?),\s*(.+?)\)\s*(?:#.*)?$/);
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
  
  // 12. Neopixel show
  if (line.includes('robot.neopixel_show()')) {
    return `<block type="neopixel_show" />`;
  }
  
  // 13. MQTT Init
  if (line.includes('robot.mqtt_init()')) {
    return `<block type="mqtt_init" />`;
  }
  
  // 14. MQTT publish
  match = line.match(/robot\.mqtt_publish\((.+?),\s*(.+?)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="mqtt_publish">
        <value name="TOPIC">${parseExpression(match[1], variables)}</value>
        <value name="MSG">${parseExpression(match[2], variables)}</value>
      </block>
    `;
  }
  
  // 15. MQTT subscribe
  match = line.match(/robot\.mqtt_subscribe\((.+?)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="mqtt_subscribe">
        <value name="TOPIC">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }
  
  // 16. Bluetooth begin
  match = line.match(/robot\.bluetooth_begin\((.+?)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="esp32_bluetooth_begin">
        <value name="NAME">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }
  
  // 17. Bluetooth write
  match = line.match(/robot\.bluetooth_write\((.+?)\)\s*(?:#.*)?$/);
  if (match) {
    return `
      <block type="esp32_bluetooth_write">
        <value name="DATA">${parseExpression(match[1], variables)}</value>
      </block>
    `;
  }
  
  // 18. Variable Assignment: x = 10
  const varMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+?)\s*(?:#.*)?$/);
  if (varMatch) {
    variables[varMatch[1]] = varMatch[2];
    return `
      <block type="variables_set">
        <field name="VAR">${varMatch[1]}</field>
        <value name="VALUE">
          ${parseExpression(varMatch[2], variables)}
        </value>
      </block>
    `;
  }
  
  return null;
}

function parseExpression(expr: string, variables: Record<string, string> = {}): string {
  expr = expr.trim();
  if (!expr) {
    return `<block type="math_number"><field name="NUM">0</field></block>`;
  }
  
  // 1. Text Literal
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    const val = expr.substring(1, expr.length - 1);
    return `
      <block type="text">
        <field name="TEXT">${val}</field>
      </block>
    `;
  }
  
  // 2. Numeric Literal
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return `
      <block type="math_number">
        <field name="NUM">${expr}</field>
      </block>
    `;
  }
  
  // 3. Digital Read
  let dReadMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.value\(\)$/);
  let dReadPin = null;
  if (dReadMatch) {
    const varDef = variables[dReadMatch[1]];
    if (varDef) {
       const m = varDef.match(/Pin\(\s*(\d+)/);
       if (m) dReadPin = m[1];
    }
  }
  let match = expr.match(/(?:robot\.)?digital_read\(\s*([a-zA-Z0-9_]+)\s*\)/) ||
              expr.match(/(?:machine\.)?Pin\(\s*([a-zA-Z0-9_]+)\s*,\s*(?:machine\.)?Pin\.IN\s*\)\.value\(\)/) ||
              expr.match(/pin([a-zA-Z0-9_]+)\.read_digital\(\)/);
  if (match || dReadPin) {
     return `
       <block type="pin_digital_read">
         <field name="PIN">${match ? match[1] : dReadPin}</field>
       </block>
     `;
  }
  
  // 4. Analog Read
  let adcMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.read\(\)$/);
  let adcPin = null;
  if (adcMatch) {
    const varDef = variables[adcMatch[1]];
    if (varDef) {
       const m = varDef.match(/ADC\(\s*(?:machine\.)?Pin\(\s*(\d+)/);
       if (m) adcPin = m[1];
    }
  }
  match = expr.match(/(?:robot\.)?analog_read\(\s*([a-zA-Z0-9_]+)\s*\)/) ||
          expr.match(/(?:machine\.)?ADC\((?:machine\.)?Pin\(\s*([a-zA-Z0-9_]+)\s*\)\)\.read\(\)/) ||
          expr.match(/pin([a-zA-Z0-9_]+)\.read_analog\(\)/);
  if (match || adcPin) {
     return `
       <block type="pin_analog_read">
         <field name="PIN">${match ? match[1] : adcPin}</field>
       </block>
     `;
  }
  
  // 5. Touch Read
  match = expr.match(/(?:robot\.)?touch_read\((\d+)\)/);
  if (match) {
    return `
      <block type="esp32_touch_read">
        <field name="PIN">${match[1]}</field>
      </block>
    `;
  }
  
  // 6. Hall Read
  if (expr.includes('robot.hall_read()') || expr.includes('hall_read()')) {
    return `<block type="esp32_hall_read" />`;
  }
  
  // 7. Ultrasonic
  match = expr.match(/(?:robot\.)?(?:read_)?ultrasonic\((\d+),\s*(\d+)\)/);
  if (match) {
    return `
      <block type="sensor_ultrasonic">
        <field name="TRIGGER">${match[1]}</field>
        <field name="ECHO">${match[2]}</field>
      </block>
    `;
  }
  
  // 8. Logic Compare
  match = expr.match(/(.+?)\s*([<>]=?|==|!=)\s*(.+)/);
  if (match) {
    let op = 'EQ';
    const rawOp = match[2];
    if (rawOp === '<') op = 'LT';
    else if (rawOp === '>') op = 'GT';
    else if (rawOp === '==') op = 'EQ';
    return `
      <block type="robolab_logic_compare">
        <field name="OP">${op}</field>
        <value name="A">${parseExpression(match[1], variables)}</value>
        <value name="B">${parseExpression(match[3], variables)}</value>
      </block>
    `;
  }
  
  // 9. Default: Variable
  return `
    <block type="variables_get">
      <field name="VAR">${expr}</field>
    </block>
  `;
}

function connectBlocks(blocks: string[]): string {
  if (blocks.length === 0) return '';
  let result = '';
  for (let i = blocks.length - 1; i >= 0; i--) {
    let current = blocks[i].trim();
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
