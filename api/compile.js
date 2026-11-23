import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { compileWithCloudEngine } = require('../server/cloud-compiler.cjs');
const { shouldUseHostedEsp32, compileHostedEsp32 } = require('../server/hosted-esp32.cjs');

function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    const body = await readRequestBody(req);
    const input = {
      board: body.board || 'ESP32 DevKit V1',
      files: body.files || {},
      sketchPath: body.sketchPath,
      requireNative: body.requireNative === true,
    };
    const result = shouldUseHostedEsp32(input)
      ? await compileHostedEsp32(input, req.headers?.authorization, body.action)
      : await compileWithCloudEngine(input);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: err?.message || String(err),
        logs: [{ text: `Serverless Compile Error: ${err?.message || err}`, type: 'error' }],
      })
    );
  }
}
