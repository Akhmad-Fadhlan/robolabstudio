import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { handleFirmwareRequest } = require('../server/compile-server.cjs');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const parsedUrl = new URL(req.url || '/api/firmware', 'http://localhost');
    const board = (req.query && req.query.board) || parsedUrl.searchParams.get('board') || 'ESP32 DevKit V1';
    const result = await handleFirmwareRequest(board);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err?.message || String(err) }));
  }
}
