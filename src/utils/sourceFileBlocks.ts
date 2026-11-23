import { arduinoToBlocklyXml } from './arduinoToBlocks';
import { escapeXml, pythonToBlocklyXml } from './pythonToBlocks';
import { fileExtension, isCppSourceFile, isPythonSourceFile } from './sourceFileTypes';

export function hasNativeOnlyArduinoCode(source: string): boolean {
  const code = source.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ' ');
  return /\b(?:analogReadResolution|analogSetPinAttenuation|analogSetAttenuation|analogReadMilliVolts)\s*\(|\breturn\s+[^;]/.test(code);
}

function sourceReference(filename: string, code: string, x: number): string {
  const preview = code.slice(0, 12000).replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '\uFFFD');
  const comment = code.length > 12000 ? preview + '\n\n[Lihat kode lengkap di editor.]' : preview;
  const firstLine = preview.split(/\r?\n/).find(line => line.trim())?.trim() ?? '';
  return `<block type="imported_source_preview" x="${x}" y="40">
    <field name="FILE">${escapeXml(filename.split('/').pop() ?? filename)}</field>
    <field name="LINE">${escapeXml(firstLine.length > 75 ? firstLine.slice(0, 72) + '…' : firstLine)}</field>
    <comment pinned="false" w="360" h="200">${escapeXml(comment)}</comment>
  </block>`;
}

export function sourceFileToBlockly(filename: string, code: string): string {
  const source = code.replace(/^\uFEFF/, '');
  const extension = fileExtension(filename);
  const isHeader = extension === 'h' || extension === 'hpp';
  const hasArduinoEntry = /^\s*void\s+(?:setup|loop)\s*\(/m.test(source);
  let xml = '';

  try {
    if (isPythonSourceFile(filename)) {
      xml = pythonToBlocklyXml(source);
    } else if (isCppSourceFile(filename)) {
      if (extension === 'ino' || hasArduinoEntry || isHeader) {
        xml = arduinoToBlocklyXml(source);
      } else {
        // Map familiar statements from a C/C++ main function for the visual workspace.
        const entry = source.replace(/^(\s*)(?:int|void)\s+main\s*\([^{};]*\)(?=\s*\{)/m, '$1void setup()');
        if (entry !== source) xml = arduinoToBlocklyXml(entry);
      }
    }
  } catch {
    // Invalid or unsupported syntax can still be read from the original file.
  }

  const hasMappedStatements = xml.includes('<statement') || /type="(?!arduino_(?:setup|loop)\b)/.test(xml);
  const hasNativeOnlyCode = isCppSourceFile(filename) && hasNativeOnlyArduinoCode(source);
  const includesSourcePreview = source.trim().length > 0 && (
    !hasMappedStatements || hasNativeOnlyCode || isHeader || (isCppSourceFile(filename) && extension !== 'ino' && !hasArduinoEntry)
  );
  if (!includesSourcePreview && xml) return xml;
  const hasProgramView = hasMappedStatements ? xml : '';
  const reference = source.trim() ? sourceReference(filename, source, hasProgramView ? 520 : 40) : '';
  return hasProgramView
    ? hasProgramView.replace(/<\/xml>\s*$/, () => reference + '</xml>')
    : '<xml xmlns="https://developers.google.com/blockly/xml">' + reference + '</xml>';
}
