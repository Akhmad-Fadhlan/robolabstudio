const http = require('node:http');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { mkdtemp, mkdir, writeFile, readFile, rm, chown } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { timingSafeEqual } = require('node:crypto');
const { selectArduinoSketch } = require('../../server/arduino-sketch.cjs');

const runFile = promisify(execFile);
const fqbn = 'esp32:esp32:esp32:FlashMode=dio,PartitionScheme=huge_app';
const maxInputBytes = 384 * 1024;
const maxFirmwareBytes = 2900 * 1024;
const compilerUid = 10001;
const compilerToken = process.env.ESP32_COMPILER_TOKEN || '';
let compiling = false;

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function authorized(header) {
  const expected = Buffer.from(`Bearer ${compilerToken}`);
  const received = Buffer.from(header || '');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

async function readPayload(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxInputBytes) throw Object.assign(new Error('Sketch terlalu besar.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Permintaan kompilasi tidak valid.'), { status: 400 });
  }
}

async function compile({ sketchPath, files } = {}) {
  const sketch = selectArduinoSketch(files, sketchPath);
  if (!sketch?.[1]?.trim()) return { success: false, error: 'Sketch .ino yang dipilih kosong atau tidak ditemukan.' };

  const job = await mkdtemp(join(tmpdir(), 'robolab-esp32-'));
  const sketchDir = join(job, 'Sketch');
  const buildDir = join(job, 'output');
  try {
    await mkdir(sketchDir);
    await mkdir(buildDir);
    await writeFile(join(sketchDir, 'Sketch.ino'), sketch[1]);

    const usedNames = new Set(['sketch.ino']);
    for (const [name, content] of Object.entries(files)) {
      if (!/\.(?:h|hpp|c|cpp|cc|cxx)$/i.test(name) || typeof content !== 'string') continue;
      const basename = name.split('/').at(-1);
      if (!/^[a-z0-9_][a-z0-9_.-]{0,99}$/i.test(basename) || usedNames.has(basename.toLowerCase())) {
        return { success: false, error: `Nama file pendukung tidak valid atau duplikat: ${name}` };
      }
      usedNames.add(basename.toLowerCase());
      await writeFile(join(sketchDir, basename), content);
    }

    if (process.getuid() === 0) {
      for (const dir of [job, buildDir]) await chown(dir, compilerUid, compilerUid);
    }

    const cliEnv = {
      PATH: process.env.PATH,
      HOME: process.getuid() === 0 ? '/home/compiler' : process.env.HOME,
      ARDUINO_DIRECTORIES_DATA: process.env.ARDUINO_DIRECTORIES_DATA,
      ARDUINO_DIRECTORIES_USER: process.env.ARDUINO_DIRECTORIES_USER,
      ARDUINO_DIRECTORIES_DOWNLOADS: process.env.ARDUINO_DIRECTORIES_DOWNLOADS,
      LANG: 'C.UTF-8',
    };
    let stdout;
    try {
      ({ stdout } = await runFile('timeout',
        ['--kill-after=2s', '50s', 'arduino-cli', 'compile', '--fqbn', fqbn, '--jobs', '1', '--output-dir', buildDir, sketchDir], {
          cwd: job, env: cliEnv, timeout: 52000, maxBuffer: 512 * 1024,
          ...(process.getuid() === 0 ? { uid: compilerUid, gid: compilerUid } : {}),
        }));
    } catch (err) {
      const error = err.killed || err.code === 124 || err.code === 137 ? 'Waktu kompilasi ESP32 habis. Coba lagi.' : 'Arduino CLI gagal mengompilasi sketch ESP32.';
      const details = String(err.stderr || err.stdout || '').replaceAll(job, '').trim().slice(-6000);
      return { success: false, error, logs: details ? [{ type: 'error', text: details }] : [] };
    }

    const partitions = await Promise.all([
      ['bootloader.bin', 0x1000, join(buildDir, 'Sketch.ino.bootloader.bin')],
      ['partitions.bin', 0x8000, join(buildDir, 'Sketch.ino.partitions.bin')],
      ['boot_app0.bin', 0xe000, process.env.ESP32_BOOT_APP_PATH],
      ['firmware.bin', 0x10000, join(buildDir, 'Sketch.ino.bin')],
    ].map(async ([name, offset, filename]) => ({ name, offset, bytes: await readFile(filename) })));
    if (partitions.some(part => !part.bytes.length) ||
        partitions.reduce((sum, part) => sum + part.bytes.length, 0) > maxFirmwareBytes) {
      return { success: false, error: 'Arduino CLI menghasilkan firmware kosong atau melebihi batas upload web.' };
    }

    return {
      success: true,
      binaryType: 'esp-bin',
      cloudCompiled: true,
      partitions: partitions.map(({ name, offset, bytes }) => ({ name, offset, dataBase64: bytes.toString('base64') })),
      logs: [
        { type: 'info', text: `Arduino CLI cloud • ${sketch[0]} • ESP32 DevKit V1` },
        ...(stdout.trim() ? [{ type: 'stdout', text: stdout.trim().slice(-6000) }] : []),
      ],
    };
  } finally {
    await rm(job, { recursive: true, force: true });
  }
}

function createCompilerServer() {
  if (compilerToken.length < 32) throw new Error('ESP32_COMPILER_TOKEN harus diisi dengan token minimal 32 karakter.');
  return http.createServer({ requestTimeout: 10000, headersTimeout: 5000 }, async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
    if (req.method !== 'POST' || req.url !== '/compile') return send(res, 404, { success: false, error: 'Rute tidak ditemukan.' });
    if (!authorized(req.headers.authorization)) return send(res, 401, { success: false, error: 'Koneksi compiler tidak diizinkan.' });
    if (compiling) return send(res, 429, { success: false, error: 'Compiler ESP32 sedang sibuk. Coba lagi sebentar.' });
    compiling = true;
    try {
      const body = await readPayload(req);
      if (!body || typeof body !== 'object' || !body.files || typeof body.files !== 'object' || Array.isArray(body.files)) {
        return send(res, 400, { success: false, error: 'Daftar file tidak valid.' });
      }
      return send(res, 200, await compile(body));
    } catch (err) {
      return send(res, err.status || 500, { success: false, error: err.status ? err.message : 'Layanan compiler ESP32 gagal menyiapkan firmware.' });
    } finally {
      compiling = false;
    }
  });
}

if (require.main === module) createCompilerServer().listen(process.env.PORT || 8080, '0.0.0.0');
module.exports = { createCompilerServer };
