import JSZip from 'jszip';
import { findKnownLibrary } from '../data/knownLibrarySignatures';
import { arduinoToBlocklyXml, arduinoToPython } from '../utils/arduinoToBlocks';

export interface ParsedMethod {
  name: string;
  returnType: 'void' | 'Number' | 'Boolean' | 'String';
  params: string[];
  label?: string;
  doc?: string;
}

export interface ParsedApi {
  name: string;
  className: string;
  instanceName?: string;
  mainHeader: string;
  constructors: Array<{ params: string[]; defaultArgs?: string }>;
  pins: Array<{ name: string; value: string; isPin: boolean }>;
  constants: Array<{ name: string; value: string; isPin: boolean }>;
  methods: ParsedMethod[];
}

export interface ParsedExample {
  name: string;
  library: string;
  board: string;
  description: string;
  code: string;
  xml: string;
  py: string;
  parsedApi?: ParsedApi;
}

export interface ParsedZipLibraryResult {
  success: boolean;
  name: string;
  version: string;
  author: string;
  description: string;
  headers: string[];
  parsedApi: ParsedApi;
  examples: ParsedExample[];
  error?: string;
}

/**
 * Extract C++ class body up to matching closing brace
 */
function extractClassBody(src: string, startIdx: number): string {
  let depth = 1;
  let i = startIdx;
  let body = '';
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    body += ch;
    i++;
  }
  return body;
}

/**
 * Extract public methods, constructors, pins, and classes from C++ header source
 */
function parseHeaderSource(
  headerName: string,
  rawContent: string,
  api: ParsedApi
) {
  // Strip comments
  const content = rawContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\r\n]*/g, '');

  const baseName = headerName.replace(/\.[^/.]+$/, '').toUpperCase();

  // 1. Parse #define constants and pins
  const defRegex = /#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+([^\r\n]+)/g;
  let dm: RegExpExecArray | null;
  const pinKeywordsRegex = /(?:pin|trig|echo|sda|scl|cs|ss|rst|reset|irq|led|rx|tx|btn|button|relay|buzzer|sensor|pot|adc|servo)/i;

  while ((dm = defRegex.exec(content)) !== null) {
    const dName = dm[1].trim();
    const dVal = dm[2].trim().replace(/^\(|\)$/g, '');

    // Skip header guards or include guards
    if (dVal.startsWith('#') || dVal.startsWith('//') || dVal.startsWith('/*')) continue;
    if (dName.toUpperCase() === `_${baseName}_H_` || dName.toUpperCase() === `${baseName}_H` || dName.endsWith('_H') || dName.endsWith('_H_')) continue;
    if (dVal.startsWith('(') && dVal.includes(')')) continue;

    const isPin = pinKeywordsRegex.test(dName) || /^(?:[AD]?\d+)$/.test(dVal);
    if (isPin) {
      if (!api.pins.some(p => p.name === dName)) {
        api.pins.push({ name: dName, value: dVal || '2', isPin: true });
      }
    } else if (dVal && !dVal.includes('(')) {
      if (!api.constants.some(c => c.name === dName)) {
        api.constants.push({ name: dName, value: dVal, isPin: false });
      }
    }
  }

  // 2. Parse C++ Classes
  const classStartRegex = /\bclass\s+([a-zA-Z0-9_]+)\s*(?::\s*(?:public|protected|private)\s+[a-zA-Z0-9_:]+(?:\s*,\s*(?:public|protected|private)\s+[a-zA-Z0-9_:]+)*)?\s*\{/g;
  let csm: RegExpExecArray | null;

  while ((csm = classStartRegex.exec(content)) !== null) {
    const clsName = csm[1];
    if (['if', 'else', 'for', 'while', 'switch', 'do', 'try', 'catch', 'namespace', 'struct', 'union'].includes(clsName)) continue;

    if (!api.className) {
      api.className = clsName;
    }

    const classBody = extractClassBody(content, csm.index + csm[0].length);
    const publicSections = classBody.split(/\bpublic\s*:/i).slice(1);

    for (const pub of publicSections) {
      const cleanPub = pub.split(/\b(?:private|protected)\s*:/i)[0];

      // Constructors
      const ctorRegex = new RegExp(`\\b${clsName}\\s*\\(([^)]*)\\)`, 'g');
      let ctm: RegExpExecArray | null;
      while ((ctm = ctorRegex.exec(cleanPub)) !== null) {
        const rawCParams = ctm[1].trim();
        const cParams = rawCParams
          ? rawCParams.split(',').map(p => {
              const noDefault = p.replace(/=[^,]+$/, '').trim();
              const token = noDefault.split(/\s+/).pop();
              return token ? token.replace(/^[*&]/, '') : '';
            }).filter(Boolean)
          : [];
        if (!api.constructors.some(c => c.params.join(',') === cParams.join(','))) {
          api.constructors.push({ params: cParams });
        }
      }

      // Public Methods
      const methodRegex = /(?:virtual\s+)?(?:static\s+)?(?:inline\s+)?(?:const\s+)?([a-zA-Z0-9_:<>\*&]+(?:\s+const)?(?:\s*\*|\s*&)?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*(?:const)?\s*(?:override)?\s*(?:=\s*0)?/g;
      let mm: RegExpExecArray | null;
      while ((mm = methodRegex.exec(cleanPub)) !== null) {
        const rawRetType = mm[1].trim();
        const mName = mm[2];
        if (['if', 'else', 'for', 'while', 'switch', 'return', 'delete', 'new', clsName].includes(mName)) continue;
        if (mName.startsWith('_') || mName.startsWith('operator')) continue;

        const rawParams = mm[3].trim();
        const mParams = rawParams
          ? rawParams.split(',').map(p => {
              const noDefault = p.replace(/=[^,]+$/, '').trim();
              const token = noDefault.split(/\s+/).pop();
              return token ? token.replace(/^[*&]/, '') : '';
            }).filter(Boolean)
          : [];

        const isVoid = /\bvoid\b/i.test(rawRetType);
        const isBool = /\b(?:bool|boolean)\b/i.test(rawRetType) || /^(?:is|has|check|was|can|should)/i.test(mName);
        const isNum = /\b(?:float|double|int|uint\d+_t|int\d+_t|long|unsigned|byte|word|size_t|short)\b/i.test(rawRetType) || /^(?:get|read|calc|measure|ping)/i.test(mName);
        const returnType: 'void' | 'Number' | 'Boolean' = isVoid ? 'void' : (isBool ? 'Boolean' : (isNum ? 'Number' : 'Number'));

        const existingIdx = api.methods.findIndex(m => m.name.toLowerCase() === mName.toLowerCase());
        if (existingIdx >= 0) {
          if (mParams.length > 0) {
            api.methods[existingIdx].params = mParams;
          }
          api.methods[existingIdx].returnType = returnType;
        } else {
          api.methods.push({ name: mName, returnType, params: mParams });
        }
      }
    }
  }
}

/**
 * Parse an Arduino library .zip file directly in the browser or Node.js environment
 */
export async function parseArduinoZipArchive(
  fileOrBuffer: File | Blob | ArrayBuffer | Uint8Array,
  fileNameHint?: string
): Promise<ParsedZipLibraryResult> {
  try {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(fileOrBuffer);

    let libPropertiesContent = '';
    let keywordsContent = '';
    const headerMap = new Map<string, string>();
    const exampleMap = new Map<string, string>();

    // Scan all files in zip
    for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
      if (zipEntry.dir) continue;
      const lower = relativePath.toLowerCase();

      // library.properties
      if (lower.endsWith('library.properties')) {
        libPropertiesContent = await zipEntry.async('string');
      }
      // keywords.txt
      else if (lower.endsWith('keywords.txt')) {
        keywordsContent = await zipEntry.async('string');
      }
      // C++ headers (*.h, *.hpp)
      else if (lower.endsWith('.h') || lower.endsWith('.hpp')) {
        const basename = relativePath.split('/').pop() || relativePath;
        const text = await zipEntry.async('string');
        headerMap.set(basename, text);
      }
      // Example sketches (*.ino, *.pde)
      else if (lower.endsWith('.ino') || lower.endsWith('.pde')) {
        const basename = relativePath.split('/').pop() || relativePath;
        const text = await zipEntry.async('string');
        exampleMap.set(basename, text);
      }
    }

    // 1. Detect Library Name and Metadata from library.properties
    let libName = (fileNameHint || 'Custom_Library').replace(/\.zip$/i, '').replace(/[-_]master|[-_]main/gi, '');
    let version = '1.0.0-custom';
    let author = 'Custom Library';
    let description = `Pustaka Arduino ${libName}`;

    if (libPropertiesContent) {
      const lines = libPropertiesContent.split(/\r?\n/);
      for (const line of lines) {
        const idx = line.indexOf('=');
        if (idx > 0) {
          const key = line.slice(0, idx).trim();
          const val = line.slice(idx + 1).trim();
          if (key === 'name' && val) libName = val;
          else if (key === 'version' && val) version = val;
          else if (key === 'author' && val) author = val;
          else if (key === 'sentence' && val) description = val;
        }
      }
    }

    const cleanSafeName = libName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const headers = Array.from(headerMap.keys());

    const parsedApi: ParsedApi = {
      name: cleanSafeName,
      className: '',
      mainHeader: '',
      constructors: [],
      pins: [],
      constants: [],
      methods: []
    };

    // 2. Parse keywords.txt
    if (keywordsContent) {
      const kwLines = keywordsContent.split(/\r?\n/);
      for (const line of kwLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const kw = parts[0];
          const type = parts[1].toUpperCase();

          if (type === 'KEYWORD1') {
            if (!parsedApi.className) parsedApi.className = kw;
          } else if (type === 'KEYWORD2') {
            if (!parsedApi.methods.some(m => m.name.toLowerCase() === kw.toLowerCase())) {
              const isBool = /^(?:is|has|check|was|can|should)/i.test(kw);
              const isGetter = /^(?:get|read|calc|calculate|measure|ping|analog|digital)/i.test(kw);
              parsedApi.methods.push({
                name: kw,
                returnType: isBool ? 'Boolean' : (isGetter ? 'Number' : 'void'),
                params: []
              });
            }
          } else if (type === 'LITERAL1' || type === 'LITERAL2') {
            const isPin = /(?:pin|trig|echo|sda|scl|cs|rst|irq|led|rx|tx|btn|button|relay|buzzer)/i.test(kw);
            if (isPin) {
              if (!parsedApi.pins.some(p => p.name === kw)) {
                parsedApi.pins.push({ name: kw, value: '2', isPin: true });
              }
            } else {
              if (!parsedApi.constants.some(c => c.name === kw)) {
                parsedApi.constants.push({ name: kw, value: '0', isPin: false });
              }
            }
          }
        }
      }
    }

    // 3. Parse All Header Files
    for (const [hName, hContent] of headerMap.entries()) {
      parseHeaderSource(hName, hContent, parsedApi);
    }

    // Determine primary mainHeader
    if (headers.length > 0) {
      const cleanTarget = cleanSafeName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      let bestH = headers[0];
      for (const h of headers) {
        const baseH = h.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (baseH === cleanTarget || (parsedApi.className && baseH === parsedApi.className.toLowerCase())) {
          bestH = h;
          break;
        }
      }
      parsedApi.mainHeader = bestH;
    } else {
      parsedApi.mainHeader = `${cleanSafeName}.h`;
    }

    if (!parsedApi.className) {
      parsedApi.className = cleanSafeName;
    }

    // 4. Enrich with Known Library Database if available
    const known = findKnownLibrary(cleanSafeName);
    if (known) {
      parsedApi.className = known.className || parsedApi.className;
      parsedApi.instanceName = known.instanceName;
      parsedApi.mainHeader = known.mainHeader || parsedApi.mainHeader;
      if (known.constructors && known.constructors.length > 0) {
        parsedApi.constructors = known.constructors;
      }
      if (known.pins && known.pins.length > 0) {
        parsedApi.pins = known.pins;
      }
      if (known.constants && known.constants.length > 0) {
        parsedApi.constants = known.constants;
      }
      // Merge verified methods
      if (known.methods && known.methods.length > 0) {
        for (const km of known.methods) {
          const idx = parsedApi.methods.findIndex(m => m.name.toLowerCase() === km.name.toLowerCase());
          if (idx >= 0) {
            parsedApi.methods[idx] = { ...parsedApi.methods[idx], ...km };
          } else {
            parsedApi.methods.push(km);
          }
        }
      }
    }

    // 5. Parse Examples and Generate Blockly XML
    const parsedExamples: ParsedExample[] = [];
    for (const [exName, exCode] of exampleMap.entries()) {
      const cleanExTitle = exName.replace(/\.ino$/i, '').replace(/_/g, ' ');
      const xml = arduinoToBlocklyXml(exCode, parsedApi) || '';
      const py = arduinoToPython(exCode, parsedApi) || `# Contoh Program ${cleanExTitle}\n`;

      parsedExamples.push({
        name: cleanExTitle,
        library: cleanSafeName,
        board: 'Arduino Uno',
        description: `Contoh program ${cleanExTitle} dari pustaka ${cleanSafeName}.`,
        code: exCode,
        xml,
        py,
        parsedApi
      });
    }

    return {
      success: true,
      name: cleanSafeName,
      version,
      author,
      description,
      headers,
      parsedApi,
      examples: parsedExamples
    };
  } catch (err: any) {
    return {
      success: false,
      name: fileNameHint || 'Custom_Library',
      version: '1.0.0',
      author: 'Unknown',
      description: '',
      headers: [],
      parsedApi: {
        name: fileNameHint || 'Custom_Library',
        className: fileNameHint || 'Custom_Library',
        mainHeader: '',
        constructors: [],
        pins: [],
        constants: [],
        methods: []
      },
      examples: [],
      error: err.message || String(err)
    };
  }
}
