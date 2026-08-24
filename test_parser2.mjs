import fs from 'fs';

const pythonCode = `import machine
import time

# Inisialisasi Pin 2 (LED Bawaan ESP32) sebagai OUTPUT
led = machine.Pin(2, machine.Pin.OUT)

print("Memulai program Blink LED...")
while True:
    led.on()          # Nyalakan LED
    print("LED: ON")
    time.sleep(1)     # Tunggu 1 detik
    
    led.off()         # Padamkan LED
    print("LED: OFF")
    time.sleep(1)     # Tunggu 1 detik
`;

function parseExpression(expr) {
  expr = expr.trim();
  if (!expr) {
    return `<block type="math_number"><field name="NUM">0</field></block>`;
  }
  
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    const val = expr.substring(1, expr.length - 1);
    return `
      <block type="text">
        <field name="TEXT">${val}</field>
      </block>
    `;
  }
  
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return `
      <block type="math_number">
        <field name="NUM">${expr}</field>
      </block>
    `;
  }
  
  return `
    <block type="variables_get">
      <field name="VAR">${expr}</field>
    </block>
  `;
}

function parseStatement(line, variables) {
  line = line.trim();
  if (line.startsWith('pass')) return null;
  
  let match = line.match(/time\.sleep\(([\d\.]+)\)/);
  if (match) {
    const ms = Math.round(parseFloat(match[1]) * 1000);
    return `
      <block type="arduino_delay">
        <field name="MS">${ms}</field>
      </block>
    `;
  }
  
  match = line.match(/^print\((.+?)\)$/);
  if (match) {
    const expr = match[1].trim();
    if (expr.endsWith(", end=''")) {
      const inner = expr.substring(0, expr.length - 8).trim();
      return `
        <block type="arduino_serial_print_inline">
          <value name="TEXT">
            ${parseExpression(inner)}
          </value>
        </block>
      `;
    } else {
      return `
        <block type="arduino_serial_print">
          <value name="TEXT">
            ${parseExpression(expr)}
          </value>
        </block>
      `;
    }
  }
  
  const varMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
  if (varMatch) {
    variables[varMatch[1]] = varMatch[2];
    return `
      <block type="variables_set">
        <field name="VAR">${varMatch[1]}</field>
        <value name="VALUE">
          ${parseExpression(varMatch[2])}
        </value>
      </block>
    `;
  }
  
  return null;
}

function connectBlocks(blocks) {
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

function popStack(stack) {
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
  }
  
  if (xml) {
    parent.blocks.push(xml);
  }
}

function pythonToBlocklyXml(pythonCode) {
  const lines = pythonCode.split('\n');
  const variables = {};
  
  const stack = [
    { indent: -1, type: 'root', blocks: [] }
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('def ') ||
      trimmed.startsWith('print("Robot process started")') ||
      trimmed.startsWith('if __name__ ==') ||
      trimmed.startsWith('run_robot()') ||
      trimmed.startsWith('loop()') ||
      trimmed.startsWith('#')
    ) {
      continue;
    }
    
    const indent = line.length - line.trimStart().length;
    
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      popStack(stack);
    }
    
    if (trimmed === 'while True:') {
      stack.push({ indent, type: 'loop', blocks: [] });
    } else {
      const blockXml = parseStatement(trimmed, variables);
      if (blockXml) {
        stack[stack.length - 1].blocks.push(blockXml);
      } else {
        stack[stack.length - 1].blocks.push(`
          <block type="raw_code">
            <field name="CODE">${trimmed}</field>
          </block>
        `);
      }
    }
  }
  
  while (stack.length > 1) {
    popStack(stack);
  }
  
  const rootBlocks = stack[0].blocks;
  const setupBlocks = [];
  const otherBlocks = [];
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
    otherBlocks[i] = otherBlocks[i].replace('<block ', \`<block x="20" y="\${300 + i * 100}" \`);
    finalXml += otherBlocks[i];
  }
  
  return \`<xml xmlns="https://developers.google.com/blockly/xml">\${finalXml}</xml>\`;
}

console.log(pythonToBlocklyXml(pythonCode));
