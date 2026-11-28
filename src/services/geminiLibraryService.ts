/**
 * RoboLab Studio - Gemini AI Library Analyzer & Blockly Converter Service
 * Powers intelligent Arduino Library understanding and Blockly block generation
 * using Google Gemini AI.
 */

import { findKnownLibrary } from '../data/knownLibrarySignatures';

// SECURITY: Never embed secret API keys in client bundles. Users can configure
// their own key in localStorage ('gemini_api_key') or via VITE_GEMINI_API_KEY in local dev.
export const getGeminiApiKey = (): string => {
  if (typeof localStorage !== 'undefined') {
    const customKey = localStorage.getItem('gemini_api_key');
    if (customKey && customKey.trim()) return customKey.trim();
  }
  const envKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) || '';
  return typeof envKey === 'string' ? envKey.trim() : '';
};
export const GEMINI_MODEL = 'gemini-3.5-flash';

export interface ParsedLibraryApi {
  name: string;
  className?: string;
  mainHeader?: string;
  headers?: string[];
  constructors?: Array<{ params: string[] }>;
  pins?: Array<{ name: string; value: string; isPin: boolean }>;
  constants?: Array<{ name: string; value: string; isPin: boolean }>;
  methods?: Array<{ name: string; returnType: 'void' | 'Number' | 'Boolean' | 'String'; params: string[]; doc?: string }>;
}

/**
 * Call Gemini 3.5 Flash via REST API
 */
async function callGeminiApi(prompt: string, timeoutMs: number = 12000): Promise<string | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2500,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[Gemini API] Request failed with HTTP ${res.status}`);
      return null;
    }

    const json = await res.json();
    const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn('[Gemini API] Error calling Gemini:', err.message);
    return null;
  }
}

/**
 * Convert an Arduino example sketch (.ino) to complete Google Blockly XML
 * specifically designed for RoboLab Studio's Blockly block definitions.
 */
export async function convertArduinoCodeToBlocklyXmlWithGemini(
  inoCode: string,
  libName?: string,
  parsedApi?: ParsedLibraryApi
): Promise<string | null> {
  if (!inoCode || !inoCode.trim()) return null;

  const prompt = `You are an expert compiler that converts Arduino C++ code into Google Blockly XML for RoboLab Studio.
Target library: "${libName || 'Custom Arduino Library'}"
${parsedApi ? `Known API: Class=${parsedApi.className || ''}, Header=${parsedApi.mainHeader || ''}` : ''}

Arduino C++ Code to convert:
\`\`\`cpp
${inoCode}
\`\`\`

RoboLab Studio Blockly specification:
- Root container: <xml xmlns="https://developers.google.com/blockly/xml"> ... </xml>
- Setup block: <block type="arduino_setup" id="setup" x="40" y="40"><statement name="STACK"> ... </statement></block>
- Loop block: <block type="arduino_loop" id="loop" x="40" y="240"><statement name="STACK"> ... </statement></block>

BLOCK TYPES TO USE:
1. Object initialization:
   <block type="custom_library_init">
     <field name="CLASS">ClassName</field>
     <field name="INSTANCE">instanceName</field>
     <field name="ARGS">param1, param2</field>
   </block>

2. Void method call:
   <block type="custom_library_call">
     <field name="INSTANCE">instanceName</field>
     <field name="METHOD">methodName</field>
     <field name="PARAM">args</field>
   </block>

3. Value-returning method call (e.g. sensor.read(), sensor.ping_cm(), rtc.now()):
   <block type="custom_library_call_val">
     <field name="INSTANCE">instanceName</field>
     <field name="METHOD">methodName</field>
     <field name="PARAM">args</field>
   </block>

4. #define Pin: <block type="arduino_define_pin"><field name="PIN_NAME">PIN_NAME</field><field name="PIN_NUM">PIN_NUM</field></block>
5. #define Const: <block type="arduino_define_const"><field name="NAME">NAME</field><field name="VALUE">VALUE</field></block>
6. Pin Mode: <block type="arduino_pin_mode"><field name="PIN">2</field><field name="MODE">OUTPUT</field></block>
7. Digital Write: <block type="arduino_digital_write"><field name="PIN">2</field><field name="STATE">HIGH</field></block>
8. Delay: <block type="arduino_delay"><field name="MS">1000</field></block>
9. Serial Println:
   <block type="arduino_serial_print">
     <value name="TEXT">
       <block type="text"><field name="TEXT">your text</field></block>
     </value>
   </block>
   (If printing a value, place <block type="custom_library_call_val"> or <block type="variables_get"> in <value name="TEXT">).
10. Serial Print (inline):
    <block type="arduino_serial_print_inline">
      <value name="TEXT">
        <block type="text"><field name="TEXT">your text</field></block>
      </value>
    </block>
11. If / Else:
    <block type="controls_if">
      <value name="IF0"> ... condition ... </value>
      <statement name="DO0"> ... </statement>
    </block>
12. While loop:
    <block type="controls_whileUntil">
      <field name="MODE">WHILE</field>
      <value name="BOOL"><block type="logic_boolean"><field name="BOOL">TRUE</field></block></value>
      <statement name="DO"> ... </statement>
    </block>
13. Variable declaration/assignment:
    <block type="variables_set">
      <field name="VAR">varName</field>
      <value name="VALUE"> ... </value>
    </block>
14. Chain sequential blocks using <next><block ...> ... </block></next>.

RULES:
- Always produce both <block type="arduino_setup"> and <block type="arduino_loop"> blocks.
- Faithfully represent what the example code does in setup() and loop().
- Output ONLY the clean raw XML string starting with <xml and ending with </xml>. Do NOT wrap in markdown \`\`\`xml backticks.`;

  const output = await callGeminiApi(prompt, 14000);
  if (!output) return null;

  // Clean any markdown fences if present
  let cleanXml = output.replace(/^```(?:xml)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const xmlStart = cleanXml.indexOf('<xml');
  const xmlEnd = cleanXml.lastIndexOf('</xml>');

  if (xmlStart >= 0 && xmlEnd > xmlStart) {
    cleanXml = cleanXml.substring(xmlStart, xmlEnd + 6);
    return cleanXml;
  }

  return null;
}

/**
 * Analyze an Arduino C++ library header & example using Gemini AI to extract
 * complete class metadata, constructors, public methods, and pin constants.
 */
export async function analyzeLibraryWithGemini(
  libName: string,
  headerSnippet: string,
  exampleSnippet?: string
): Promise<ParsedLibraryApi | null> {
  const prompt = `Analyze this Arduino library "${libName}" C++ code and example to extract its public API for Blockly blocks generation.

HEADER SNIPPET:
\`\`\`cpp
${headerSnippet.slice(0, 4000)}
\`\`\`

${exampleSnippet ? `EXAMPLE USAGE SNIPPET:\n\`\`\`cpp\n${exampleSnippet.slice(0, 2500)}\n\`\`\`` : ''}

Output a strictly valid JSON object with the following schema:
{
  "name": "${libName}",
  "className": "PrimaryClassName",
  "mainHeader": "PrimaryHeader.h",
  "constructors": [
    { "params": ["pin1", "pin2"] }
  ],
  "pins": [
    { "name": "PIN_NAME", "value": "2", "isPin": true }
  ],
  "constants": [
    { "name": "CONST_NAME", "value": "100", "isPin": false }
  ],
  "methods": [
    {
      "name": "methodName",
      "returnType": "void" | "Number" | "Boolean" | "String",
      "params": ["arg1", "arg2"],
      "doc": "Brief description"
    }
  ]
}

Only return valid JSON, no markdown explanation.`;

  const output = await callGeminiApi(prompt, 10000);
  if (!output) return null;

  try {
    const cleanJson = output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed && typeof parsed === 'object') {
      return {
        name: parsed.name || libName,
        className: parsed.className || libName,
        mainHeader: parsed.mainHeader || `${libName}.h`,
        constructors: Array.isArray(parsed.constructors) ? parsed.constructors : [],
        pins: Array.isArray(parsed.pins) ? parsed.pins : [],
        constants: Array.isArray(parsed.constants) ? parsed.constants : [],
        methods: Array.isArray(parsed.methods) ? parsed.methods : [],
      };
    }
  } catch (err) {
    console.warn('[Gemini AI] Failed to parse library analysis JSON:', err);
  }

  return null;
}

/**
 * Infer library API metadata for any library from its name and GitHub URL using Gemini AI.
 * First checks the verified known library database. If not found, prompts Gemini AI.
 */
export async function inferLibraryApiWithGemini(
  libName: string,
  githubUrl?: string
): Promise<ParsedLibraryApi | null> {
  if (!libName || !libName.trim()) return null;

  // 1. Check known verified signatures first (fast, offline-capable)
  const known = findKnownLibrary(libName) || (githubUrl ? findKnownLibrary(githubUrl) : null);
  if (known) {
    return {
      name: libName,
      className: known.className,
      mainHeader: known.mainHeader,
      constructors: known.constructors || [],
      pins: known.pins || [],
      constants: known.constants || [],
      methods: known.methods,
    };
  }

  // 2. Query Gemini AI to analyze the library
  const prompt = `You are an expert Arduino C++ developer. Analyze the Arduino library "${libName}"${githubUrl ? ` (GitHub: ${githubUrl})` : ''}.
Provide its standard public C++ API so we can generate accurate Google Blockly visual blocks for it.

Required JSON format:
{
  "name": "${libName}",
  "className": "PrimaryCppClassName",
  "instanceName": "recommendedInstanceName",
  "mainHeader": "PrimaryHeader.h",
  "constructors": [
    { "params": ["defaultParam1", "defaultParam2"] }
  ],
  "pins": [
    { "name": "PIN_NAME", "value": "2", "isPin": true }
  ],
  "constants": [
    { "name": "CONST_NAME", "value": "100", "isPin": false }
  ],
  "methods": [
    {
      "name": "methodName",
      "returnType": "void" | "Number" | "Boolean" | "String",
      "params": ["defaultArg1", "defaultArg2"],
      "doc": "Deskripsi singkat fungsi dalam bahasa Indonesia"
    }
  ]
}

Provide 8-15 of the most commonly used, useful public methods of this library.
Only return valid JSON, no markdown explanation.`;

  const output = await callGeminiApi(prompt, 12000);
  if (!output) return null;

  try {
    const cleanJson = output.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);
    if (parsed && typeof parsed === 'object') {
      const sanitizedClass = (parsed.className || libName).replace(/[^a-zA-Z0-9_]/g, '_');
      return {
        name: parsed.name || libName,
        className: sanitizedClass,
        mainHeader: parsed.mainHeader || `${sanitizedClass}.h`,
        constructors: Array.isArray(parsed.constructors) ? parsed.constructors : [],
        pins: Array.isArray(parsed.pins) ? parsed.pins : [],
        constants: Array.isArray(parsed.constants) ? parsed.constants : [],
        methods: Array.isArray(parsed.methods) ? parsed.methods : [],
      };
    }
  } catch (err) {
    console.warn('[Gemini AI] Failed to infer library API:', err);
  }

  return null;
}
