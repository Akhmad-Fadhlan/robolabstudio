/**
 * RoboLab Studio - Arduino C++ to Blockly XML Converter
 */
import { pythonToBlocklyXml } from './pythonToBlocks';

export function arduinoToBlocklyXml(code: string): string {
  const lines = code.split('\n');
  
  const setupLines: string[] = [];
  const loopLines: string[] = [];
  const globalLines: string[] = [];
  
  let currentSection: 'global' | 'setup' | 'loop' = 'global';
  let braceCount = 0;
  
  for (const line of lines) {
    let clean = line;
    if (clean.includes('//')) clean = clean.split('//')[0];
    const trimmed = clean.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('void setup()')) {
      currentSection = 'setup';
      braceCount = 0;
      continue;
    }
    if (trimmed.startsWith('void loop()')) {
      currentSection = 'loop';
      braceCount = 0;
      continue;
    }
    
    if (trimmed.includes('{')) {
      braceCount++;
      if (trimmed === '{') continue;
    }
    if (trimmed.includes('}')) {
      braceCount--;
      if (braceCount <= 0) {
        currentSection = 'global';
        continue;
      }
    }
    
    if (currentSection === 'setup') {
      setupLines.push(line);
    } else if (currentSection === 'loop') {
      loopLines.push(line);
    } else if (currentSection === 'global') {
      if (trimmed.startsWith('const ') || trimmed.match(/^(?:int|float|double|char\*|String)\s+/)) {
        globalLines.push(line);
      }
    }
  }

  const convertCtoPython = (cLines: string[], indentOffset: number = 0): string[] => {
    const pyLines: string[] = [];
    let indentLevel = indentOffset;
    
    for (const line of cLines) {
      let clean = line;
      if (clean.includes('//')) clean = clean.split('//')[0];
      let trimmed = clean.trim();
      if (!trimmed) continue;
      
      if (trimmed === '{') {
        indentLevel++;
        continue;
      }
      if (trimmed === '}') {
        indentLevel = Math.max(0, indentLevel - 1);
        continue;
      }
      
      let hasOpeningBrace = false;
      if (trimmed.endsWith('{')) {
        trimmed = trimmed.substring(0, trimmed.length - 1).trim();
        hasOpeningBrace = true;
      }
      if (trimmed.endsWith(';')) {
        trimmed = trimmed.substring(0, trimmed.length - 1).trim();
      }
      
      // Ignore pinMode and Serial.begin
      if (trimmed.startsWith('pinMode(') || trimmed.startsWith('Serial.begin(')) {
        continue;
      }
      
      // Convert mapping rules:
      const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/) ||
                          trimmed.match(/^(?:const\s+)?(?:int|float|double|char\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      if (assignMatch) {
        const varName = assignMatch[1].trim();
        let expr = assignMatch[2].trim();
        
        if (expr.includes('analogRead(')) {
          expr = expr.replace(/analogRead\(\s*([a-zA-Z0-9_]+)\s*\)/, 'analog_read($1)');
        } else if (expr.includes('digitalRead(')) {
          expr = expr.replace(/digitalRead\(\s*([a-zA-Z0-9_]+)\s*\)/, 'digital_read($1)');
        }
        
        if (expr.includes('map(')) {
          expr = expr.replace(/map\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'int($1 * 255 / 1023)');
        }
        
        trimmed = `${varName} = ${expr}`;
      }
      else if (trimmed.startsWith('delay(')) {
        const match = trimmed.match(/delay\(\s*([0-9.]+)\s*\)/);
        if (match) {
          trimmed = `time.sleep(${parseFloat(match[1]) / 1000})`;
        }
      }
      else if (trimmed.startsWith('digitalWrite(')) {
        trimmed = trimmed.replace(/digitalWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'digital_write($1, "$2")');
      }
      else if (trimmed.startsWith('analogWrite(')) {
        trimmed = trimmed.replace(/analogWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'analog_write($1, $2)');
      }
      else if (trimmed.startsWith('Serial.print')) {
        const isLn = trimmed.startsWith('Serial.println');
        const innerMatch = trimmed.match(/Serial\.print(?:ln)?\(\s*(.*?)\s*\)/);
        if (innerMatch) {
          trimmed = `print(${innerMatch[1]}${isLn ? '' : ", end=''"})`;
        }
      }
      else if (trimmed.startsWith('if ')) {
        trimmed = trimmed.replace(/if\s*\((.*?)\)/, 'if $1:');
        trimmed = trimmed.replace(/==\s*LOW/g, '== 0').replace(/==\s*HIGH/g, '== 1');
      }
      else if (trimmed.startsWith('else')) {
        trimmed = 'else:';
      }
      
      const indentStr = '    '.repeat(indentLevel);
      pyLines.push(indentStr + trimmed);
      
      if (hasOpeningBrace) {
        indentLevel++;
      }
    }
    return pyLines;
  };

  const globalPy = convertCtoPython(globalLines);
  const setupPy = convertCtoPython(setupLines);
  const loopPy = convertCtoPython(loopLines);

  const getInnerBlocks = (pyCode: string): string => {
    if (!pyCode.trim()) return '';
    const xml = pythonToBlocklyXml(pyCode);
    const startIdx = xml.indexOf('>') + 1;
    const endIdx = xml.lastIndexOf('</xml>');
    return xml.substring(startIdx, endIdx).trim();
  };

  const setupInner = getInnerBlocks([...globalPy, ...setupPy].join('\n'));
  const loopInner = getInnerBlocks(loopPy.join('\n'));
  
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
  
  finalXml += '</xml>';
  return finalXml;
}

export function arduinoToPython(code: string): string {
  const lines = code.split('\n');
  
  const setupLines: string[] = [];
  const loopLines: string[] = [];
  const globalLines: string[] = [];
  
  let currentSection: 'global' | 'setup' | 'loop' = 'global';
  let braceCount = 0;
  
  for (const line of lines) {
    let clean = line;
    if (clean.includes('//')) clean = clean.split('//')[0];
    const trimmed = clean.trim();
    if (!trimmed) continue;
    
    if (trimmed.startsWith('void setup()')) {
      currentSection = 'setup';
      braceCount = 0;
      continue;
    }
    if (trimmed.startsWith('void loop()')) {
      currentSection = 'loop';
      braceCount = 0;
      continue;
    }
    
    if (trimmed.includes('{')) {
      braceCount++;
      if (trimmed === '{') continue;
    }
    if (trimmed.includes('}')) {
      braceCount--;
      if (braceCount <= 0) {
        currentSection = 'global';
        continue;
      }
    }
    
    if (currentSection === 'setup') {
      setupLines.push(line);
    } else if (currentSection === 'loop') {
      loopLines.push(line);
    } else if (currentSection === 'global') {
      if (trimmed.startsWith('const ') || trimmed.match(/^(?:int|float|double|char\*|String)\s+/)) {
        globalLines.push(line);
      }
    }
  }

  const convertCtoPython = (cLines: string[], indentOffset: number = 0): string[] => {
    const pyLines: string[] = [];
    let indentLevel = indentOffset;
    
    for (const line of cLines) {
      let clean = line;
      if (clean.includes('//')) clean = clean.split('//')[0];
      let trimmed = clean.trim();
      if (!trimmed) continue;
      
      if (trimmed === '{') {
        indentLevel++;
        continue;
      }
      if (trimmed === '}') {
        indentLevel = Math.max(0, indentLevel - 1);
        continue;
      }
      
      let hasOpeningBrace = false;
      if (trimmed.endsWith('{')) {
        trimmed = trimmed.substring(0, trimmed.length - 1).trim();
        hasOpeningBrace = true;
      }
      if (trimmed.endsWith(';')) {
        trimmed = trimmed.substring(0, trimmed.length - 1).trim();
      }
      
      // Ignore pinMode and Serial.begin
      if (trimmed.startsWith('pinMode(') || trimmed.startsWith('Serial.begin(')) {
        continue;
      }
      
      // Convert mapping rules:
      const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/) ||
                          trimmed.match(/^(?:const\s+)?(?:int|float|double|char\*|String)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      if (assignMatch) {
        const varName = assignMatch[1].trim();
        let expr = assignMatch[2].trim();
        
        if (expr.includes('analogRead(')) {
          expr = expr.replace(/analogRead\(\s*([a-zA-Z0-9_]+)\s*\)/, 'analog_read($1)');
        } else if (expr.includes('digitalRead(')) {
          expr = expr.replace(/digitalRead\(\s*([a-zA-Z0-9_]+)\s*\)/, 'digital_read($1)');
        }
        
        if (expr.includes('map(')) {
          expr = expr.replace(/map\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'int($1 * 255 / 1023)');
        }
        
        trimmed = `${varName} = ${expr}`;
      }
      else if (trimmed.startsWith('delay(')) {
        const match = trimmed.match(/delay\(\s*([0-9.]+)\s*\)/);
        if (match) {
          trimmed = `time.sleep(${parseFloat(match[1]) / 1000})`;
        }
      }
      else if (trimmed.startsWith('digitalWrite(')) {
        trimmed = trimmed.replace(/digitalWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'digital_write($1, "$2")');
      }
      else if (trimmed.startsWith('analogWrite(')) {
        trimmed = trimmed.replace(/analogWrite\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)/, 'analog_write($1, $2)');
      }
      else if (trimmed.startsWith('Serial.print')) {
        const isLn = trimmed.startsWith('Serial.println');
        const innerMatch = trimmed.match(/Serial\.print(?:ln)?\(\s*(.*?)\s*\)/);
        if (innerMatch) {
          trimmed = `print(${innerMatch[1]}${isLn ? '' : ", end=''"})`;
        }
      }
      else if (trimmed.startsWith('if ')) {
        trimmed = trimmed.replace(/if\s*\((.*?)\)/, 'if $1:');
        trimmed = trimmed.replace(/==\s*LOW/g, '== 0').replace(/==\s*HIGH/g, '== 1');
      }
      else if (trimmed.startsWith('else')) {
        trimmed = 'else:';
      }
      
      const indentStr = '    '.repeat(indentLevel);
      pyLines.push(indentStr + trimmed);
      
      if (hasOpeningBrace) {
        indentLevel++;
      }
    }
    return pyLines;
  };

  const globalPy = convertCtoPython(globalLines);
  const setupPy = convertCtoPython(setupLines);
  const loopPy = convertCtoPython(loopLines);

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
