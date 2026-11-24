const { selectArduinoSketch, needsNativeEspCompiler } = require('./arduino-sketch.cjs');

const isClassicEsp32 = board => ['esp32 devkit v1', 'esp32', 'esp32:esp32:esp32'].includes(board.toLowerCase());

function shouldUseHostedEsp32(input) {
  return typeof input.board === 'string' && isClassicEsp32(input.board);
}

function failure(error, code) {
  return { success: false, code, error, logs: [{ text: error, type: 'error' }] };
}

async function waitForCompiler(endpoint) {
  const deadline = Date.now() + 90000;
  const health = new URL('/health', endpoint);
  while (Date.now() < deadline) {
    try {
      const response = await fetch(health, {
        signal: AbortSignal.timeout(Math.min(15000, Math.max(1, deadline - Date.now()))),
        redirect: 'error',
      });
      if (response.ok && (await response.json()).ok === true) return true;
    } catch {
      // Sleeping hosts can respond with HTML or timeout until the worker wakes.
    }
    const remaining = deadline - Date.now();
    if (remaining > 0) await new Promise(resolve => setTimeout(resolve, Math.min(3000, remaining)));
  }
  return false;
}

async function compileHostedEsp32(input, authorization, action) {
  const sketch = selectArduinoSketch(input.files, input.sketchPath);
  if (!sketch?.[1]?.trim()) return failure('Buka sketch .ino sebelum Verify atau Upload.', 'SKETCH_REQUIRED');

  const aux = Object.entries(input.files).filter(([name, content]) =>
    /\.(?:h|hpp|c|cpp|cc|cxx)$/i.test(name) && typeof content === 'string'
  );

  const { compileWithCloudEngine } = require('./cloud-compiler.cjs');

  const serviceUrl = process.env.ESP32_COMPILER_URL;
  const serviceToken = process.env.ESP32_COMPILER_TOKEN;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || 'https://qcewaspgybtbofjowoxs.supabase.co';

  // If hosted compiler service is not configured on this deployment, always use cloud compatibility engine
  if (!serviceUrl || !serviceToken || !supabaseKey) {
    return compileWithCloudEngine(input);
  }

  // If sketch does not strictly need native Arduino CLI compilation, use fast cloud engine
  if (!input.requireNative && !needsNativeEspCompiler(sketch[1], aux)) {
    return compileWithCloudEngine(input);
  }

  // If user is not logged in, fall back to cloud compatibility engine instead of blocking
  if (!/^Bearer [^\s]+$/.test(authorization || '')) {
    const result = await compileWithCloudEngine(input);
    if (result && Array.isArray(result.logs)) {
      result.logs.unshift({
        text: 'Menggunakan runtime kompatibilitas RoboLab. Masuk ke akun RoboLab untuk kompilasi Arduino CLI cloud penuh.',
        type: 'info',
      });
    }
    return result;
  }

  const data = JSON.stringify({ sketchPath: sketch[0], files: Object.fromEntries([sketch, ...aux]) });
  if (Buffer.byteLength(data) > 384 * 1024) {
    return failure('Ukuran sketch dan file pendukung melebihi batas kompilasi web.', 'SKETCH_TOO_LARGE');
  }

  try {
    const endpoint = new URL('/compile', serviceUrl);
    if (endpoint.protocol !== 'https:') return failure('Alamat layanan compiler harus menggunakan HTTPS.', 'HOSTED_COMPILER_UNCONFIGURED');
    const authResponse = await fetch(new URL('/auth/v1/user', supabaseUrl), {
      headers: { apikey: supabaseKey, Authorization: authorization },
      signal: AbortSignal.timeout(3000), redirect: 'error',
    });
    if (!authResponse.ok) return failure('Sesi RoboLab tidak aktif. Masuk kembali untuk melanjutkan.', 'LOGIN_REQUIRED');
    const user = await authResponse.json();
    if (typeof user.id !== 'string' || !user.id) return failure('Sesi RoboLab tidak valid.', 'LOGIN_REQUIRED');

    if (!await waitForCompiler(endpoint)) {
      const result = await compileWithCloudEngine(input);
      if (result && Array.isArray(result.logs)) {
        result.logs.unshift({
          text: 'Compiler cloud native sedang tidak merespons, beralih ke runtime kompatibilitas RoboLab.',
          type: 'info',
        });
      }
      return result;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceToken}` },
      body: data,
      signal: AbortSignal.timeout(55000), redirect: 'error',
    });
    if (response.status === 429) return failure('Compiler ESP32 sedang sibuk. Coba lagi sebentar.', 'COMPILER_BUSY');
    if (!response.ok) return failure('Layanan compiler ESP32 gagal merespons.', 'COMPILER_UNAVAILABLE');
    const json = await response.json();
    if (!json.success) {
      const result = failure(json.error || 'Arduino CLI gagal mengompilasi sketch.', 'COMPILE_FAILED');
      if (Array.isArray(json.logs)) result.logs.push(...json.logs.filter(log => typeof log?.text === 'string'));
      return result;
    }
    const expectedOffsets = [0x1000, 0x8000, 0xe000, 0x10000];
    if (json.binaryType !== 'esp-bin' || !Array.isArray(json.partitions) ||
        json.partitions.length !== expectedOffsets.length || !expectedOffsets.every((offset, index) =>
          json.partitions[index]?.offset === offset && typeof json.partitions[index]?.dataBase64 === 'string' &&
          json.partitions[index].dataBase64.length > 0
        )) {
      return failure('Compiler tidak mengembalikan firmware ESP32 yang lengkap.', 'INVALID_FIRMWARE');
    }
    if (action === 'verify') return { success: true, cloudCompiled: true, logs: json.logs };
    return json;
  } catch {
    const result = await compileWithCloudEngine(input);
    if (result && Array.isArray(result.logs)) {
      result.logs.unshift({
        text: 'Layanan compiler cloud tidak dapat dihubungi, menggunakan runtime kompatibilitas RoboLab.',
        type: 'info',
      });
    }
    return result;
  }
}

module.exports = { shouldUseHostedEsp32, compileHostedEsp32 };
