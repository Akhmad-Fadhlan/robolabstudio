// ============================================================================
// RoboLab Studio — Cloud Compiler & Firmware Server (Schematik.io Architecture)
// Provides REST endpoints for browser clients to compile Arduino/C++ code
// into .hex / .bin artifacts and stream them back to the browser for
// direct flashing over the Web Serial API (navigator.serial), with automatic
// local arduino-cli / esptool high-speed upload when running locally.
// ============================================================================

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn, execSync } = require('child_process');

const PORT = Number(process.env.PORT) || 3001;

// Locate bundled arduino-cli.exe (works from root or from robolab-web subfolder)
function getArduinoCliPath() {
  const candidates = [
    path.join(__dirname, '..', 'resources', 'bin', 'win32', 'arduino-cli.exe'),
    path.join(__dirname, '..', '..', 'resources', 'bin', 'win32', 'arduino-cli.exe'),
    path.join(process.cwd(), 'resources', 'bin', 'win32', 'arduino-cli.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Arduino15', 'arduino-cli.exe'),
    'C:\\Program Files\\Arduino CLI\\arduino-cli.exe',
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return 'arduino-cli';
}

// Parse directories from Arduino15/arduino-cli.yaml if present
function getYamlDirectories() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const yamlPath = path.join(localAppData, 'Arduino15', 'arduino-cli.yaml');
  const result = { yamlPath: fs.existsSync(yamlPath) ? yamlPath : '', dataDir: '', userDir: '' };
  if (!result.yamlPath) return result;
  try {
    const content = fs.readFileSync(yamlPath, 'utf-8');
    const dataMatch = content.match(/^\s*data:\s*(.+)$/m);
    const userMatch = content.match(/^\s*user:\s*(.+)$/m);
    if (dataMatch && dataMatch[1]) result.dataDir = dataMatch[1].trim().replace(/^['"]|['"]$/g, '');
    if (userMatch && userMatch[1]) result.userDir = userMatch[1].trim().replace(/^['"]|['"]$/g, '');
  } catch {}
  return result;
}

// Resolve the best ARDUINO_DIRECTORIES_DATA for a given FQBN so installed cores (esp32, avr, etc.) are always found
function getCliEnv(fqbn = '') {
  const env = Object.assign({}, process.env);
  const vendor = (fqbn || '').split(':')[0] || '';
  const { dataDir: yamlDataDir, userDir: yamlUserDir } = getYamlDirectories();
  const localAppData = process.env.LOCALAPPDATA || '';

  const candidateDataDirs = [
    yamlDataDir,
    localAppData ? path.join(localAppData, 'Arduino15') : '',
    path.join(__dirname, '..', 'resources', 'arduino-data'),
    path.join(__dirname, '..', '..', 'resources', 'arduino-data'),
    'C:\\KidsBlock Desktop\\resources\\tools\\Arduino',
  ].filter(Boolean);

  let chosenDataDir = '';
  if (vendor) {
    for (const d of candidateDataDirs) {
      try {
        if (fs.existsSync(path.join(d, 'packages', vendor, 'hardware'))) {
          chosenDataDir = d;
          break;
        }
      } catch {}
    }
  }

  if (!chosenDataDir) {
    for (const d of candidateDataDirs) {
      try {
        if (fs.existsSync(path.join(d, 'packages'))) {
          chosenDataDir = d;
          break;
        }
      } catch {}
    }
  }

  if (chosenDataDir) {
    env.ARDUINO_DIRECTORIES_DATA = chosenDataDir;
    env.ARDUINO_DIRECTORIES_DOWNLOADS = path.join(chosenDataDir, 'staging');
  }

  const candidateUserDirs = [
    yamlUserDir,
    path.join(os.homedir(), 'Documents', 'Arduino'),
    chosenDataDir,
  ].filter(Boolean);

  for (const u of candidateUserDirs) {
    try {
      if (fs.existsSync(path.join(u, 'libraries'))) {
        env.ARDUINO_DIRECTORIES_USER = u;
        break;
      }
    } catch {}
  }

  return env;
}

// Collect all existing library folders so arduino-cli finds libraries across Arduino, KidsBlock, and bundled resources
function getExtraLibraryArgs() {
  const { userDir: yamlUserDir } = getYamlDirectories();
  const libDirs = [
    yamlUserDir ? path.join(yamlUserDir, 'libraries') : '',
    path.join(os.homedir(), 'Documents', 'Arduino', 'libraries'),
    path.join(__dirname, '..', 'resources', 'arduino-data', 'libraries'),
    path.join(__dirname, '..', '..', 'resources', 'arduino-data', 'libraries'),
    'C:\\KidsBlock Desktop\\resources\\tools\\Arduino\\libraries',
  ].filter(Boolean);

  const seen = new Set();
  const args = [];
  for (const dir of libDirs) {
    try {
      const norm = path.resolve(dir).toLowerCase();
      if (!seen.has(norm) && fs.existsSync(dir)) {
        seen.add(norm);
        args.push('--libraries', dir);
      }
    } catch {}
  }
  return args;
}

function getConfigArgs() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const arduino15ConfigPath = path.join(localAppData, 'Arduino15', 'arduino-cli.yaml');
  return fs.existsSync(arduino15ConfigPath) ? ['--config-file', arduino15ConfigPath] : [];
}

function resolveFqbn(board = '') {
  if (board.includes(':')) return board;
  const bLower = board.toLowerCase();
  if (board === 'Arduino Uno' || bLower.includes('uno')) return 'arduino:avr:uno';
  if (board === 'Arduino Nano' || bLower.includes('nano')) return 'arduino:avr:nano';
  if (board === 'Arduino Mega' || bLower.includes('mega')) return 'arduino:avr:mega';
  if (board === 'ESP32 DevKit V1' || bLower.includes('esp32')) {
    return 'esp32:esp32:esp32:FlashMode=dio,PartitionScheme=huge_app';
  }
  if (board.includes('ESP8266') || bLower.includes('nodemcu') || bLower.includes('esp8266') || bLower.includes('lolin') || bLower.includes('wemos')) {
    return 'esp8266:esp8266:nodemcuv2';
  }
  if (bLower.includes('pico') || bLower.includes('rp2040')) return 'rp2040:rp2040:rp2040';
  if (bLower.includes('stm32')) return 'STMicroelectronics:stm32:Nucleo_64';
  if (bLower.includes('atmega128') || bLower.includes('megacore')) return 'MegaCore:avr:128';
  return 'esp32:esp32:esp32:FlashMode=dio,PartitionScheme=huge_app';
}

// Ensure buildDir and required subdirectories (core/, ld_h/, sketch/) always exist
// Also pre-seed local.eagle.flash.ld.h for ESP8266 so cp.py / linker never fails with FileNotFoundError
function ensureBuildDirStructure(buildDir, fqbn = '') {
  try {
    if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
    const coreSub = path.join(buildDir, 'core');
    const ldHSub = path.join(buildDir, 'ld_h');
    const sketchSub = path.join(buildDir, 'sketch');
    if (!fs.existsSync(coreSub)) fs.mkdirSync(coreSub, { recursive: true });
    if (!fs.existsSync(ldHSub)) fs.mkdirSync(ldHSub, { recursive: true });
    if (!fs.existsSync(sketchSub)) fs.mkdirSync(sketchSub, { recursive: true });

    if ((fqbn || '').includes('esp8266')) {
      const targetLdH = path.join(ldHSub, 'local.eagle.flash.ld.h');
      if (!fs.existsSync(targetLdH)) {
        const env = getCliEnv(fqbn);
        const dataDir = env.ARDUINO_DIRECTORIES_DATA || '';
        const hwDir = path.join(dataDir, 'packages', 'esp8266', 'hardware', 'esp8266');
        if (fs.existsSync(hwDir)) {
          const versions = fs.readdirSync(hwDir);
          for (const ver of versions) {
            const sdkLdDir = path.join(hwDir, ver, 'tools', 'sdk', 'ld');
            const candidateLd = path.join(sdkLdDir, 'eagle.flash.4m2m.ld');
            const fallbackLd = path.join(sdkLdDir, 'eagle.flash.4m.ld');
            const srcLd = fs.existsSync(candidateLd) ? candidateLd : fs.existsSync(fallbackLd) ? fallbackLd : '';
            if (srcLd) {
              fs.copyFileSync(srcLd, targetLdH);
              break;
            }
          }
        }
      }
    }
  } catch {}
}

// Match Electron's exact build directory naming (RoboLabBuild_${boardSafe}) to share precompiled core.a caches!
function getBuildDirForFqbn(fqbn) {
  const arch = fqbn.split(':')[0] || 'board';
  const boardModel = (fqbn.split(':')[2] || 'gen').split(':')[0];
  const boardSafe = `${arch}_${boardModel}`.replace(/[^a-zA-Z0-9]/g, '_');
  const buildDir = path.join(os.tmpdir(), `RoboLabBuild_${boardSafe}`);
  ensureBuildDirStructure(buildDir, fqbn);
  return buildDir;
}

function getCoreCacheDir() {
  const cacheDir = path.join(os.tmpdir(), 'RoboLabCoreCache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  return cacheDir;
}

// Shared persistent compile hash cache on disk (shared with electron/main.cjs)
const _hashCachePath = path.join(os.tmpdir(), 'RoboLabHashCache.json');
let lastCompiledHashes = global.__robolabLastCompiledHashes || {};
try {
  if (fs.existsSync(_hashCachePath)) {
    lastCompiledHashes = Object.assign(lastCompiledHashes, JSON.parse(fs.readFileSync(_hashCachePath, 'utf-8')));
  }
} catch {}
global.__robolabLastCompiledHashes = lastCompiledHashes;

function saveHashCache() {
  try {
    global.__robolabLastCompiledHashes = lastCompiledHashes;
    fs.writeFileSync(_hashCachePath, JSON.stringify(lastCompiledHashes), 'utf-8');
  } catch {}
}

function killProcessTree(child) {
  if (!child) return;
  try {
    if (process.platform === 'win32' && child.pid) {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGKILL');
    }
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {}
  }
}

function runCli(args, logs, timeoutMs = 600000, fqbn = '') {
  return new Promise((resolve) => {
    const cliPath = getArduinoCliPath();
    const child = spawn(cliPath, args, { env: getCliEnv(fqbn), windowsHide: true });
    let stdoutText = '';
    let stderrText = '';
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      killProcessTree(child);
      if (logs) logs.push({ text: '⚠️ Waktu kompilasi/eksekusi habis (Timeout).', type: 'error' });
      finish({ success: false, stdout: stdoutText, stderr: stderrText, timedOut: true });
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      const str = d.toString();
      stdoutText += str;
      if (logs) {
        str.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          // Filter overly noisy compiler command lines while keeping useful status lines
          if (trimmed.length > 260 && (trimmed.includes('xtensa-esp32-elf-') || trimmed.includes('xtensa-lx106-elf-') || trimmed.includes('avr-g++'))) {
            return;
          }
          logs.push({ text: trimmed, type: 'stdout' });
        });
      }
    });

    child.stderr.on('data', (d) => {
      const str = d.toString();
      stderrText += str;
      if (logs) {
        str.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          // Suppress harmless arduino-cli deprecation notice
          if (trimmed.includes('--build-cache-path has been deprecated')) return;
          const isUploadProgress =
            /\d+%|uploading|writing|reading|erasing|bytes|hard resetting|connecting|leaving|[║╠╚]|SEGMENT|RODATA|ICACHE|IRAM|IROM/i.test(
              trimmed
            );
          logs.push({ text: trimmed, type: isUploadProgress ? 'stdout' : 'error' });
        });
      }
    });

    child.on('close', (code) => {
      const combinedOut = `${stdoutText}\n${stderrText}`;
      const hasFatalUploadErr =
        args[0] === 'upload' &&
        /A fatal esptool\.py error occurred|A fatal error occurred|Cannot configure port|Failed to connect to ESP|Timed out waiting for packet/i.test(
          combinedOut
        );
      finish({ success: code === 0 && !hasFatalUploadErr, stdout: stdoutText, stderr: stderrText });
    });

    child.on('error', (err) => {
      if (logs) logs.push({ text: `❌ Gagal menjalankan arduino-cli: ${err.message}`, type: 'error' });
      finish({ success: false, stdout: stdoutText, stderr: err.message });
    });
  });
}

// Global mutex stored on `global` so Vite hot-reloads / multiple endpoints never run two compiles concurrently
async function handleCompileRequest(body) {
  while (global.__robolabActiveCompilePromise) {
    try {
      await global.__robolabActiveCompilePromise;
    } catch {}
  }
  const promise = _executeCompileRequest(body);
  global.__robolabActiveCompilePromise = promise;
  try {
    return await promise;
  } finally {
    if (global.__robolabActiveCompilePromise === promise) {
      global.__robolabActiveCompilePromise = null;
    }
  }
}

function hasLocalArduinoCli() {
  if (process.env.VERCEL) return false;
  const cli = getArduinoCliPath();
  if (cli !== 'arduino-cli' && fs.existsSync(cli)) return true;
  try {
    execSync('arduino-cli version', { stdio: 'ignore', timeout: 2500, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function _executeCompileRequest(body) {
  const { board = 'ESP32 DevKit V1', files = {} } = body || {};
  const logs = [];
  const fqbn = resolveFqbn(board);
  const bLower = board.toLowerCase();
  const isEsp32 = fqbn.includes('esp32') || bLower.includes('esp32');
  const isEsp8266 = fqbn.includes('esp8266') || bLower.includes('esp8266') || bLower.includes('nodemcu') || bLower.includes('lolin') || bLower.includes('wemos');

  // If running on Vercel Serverless or no local arduino-cli binary is installed, use Serverless Cloud Compiler
  if (!hasLocalArduinoCli()) {
    const { compileWithCloudEngine } = require('./cloud-compiler.cjs');
    return compileWithCloudEngine({ board, files, fqbn });
  }

  logs.push({ text: `☁️ [RoboLab Cloud Compiler] Target Board: ${board} (${fqbn})`, type: 'info' });

  // Match Electron's exact sketch directory (RoboLabSketch / RoboLabSketch.ino) so build.options.json cache stays valid!
  const tempDir = path.join(os.tmpdir(), 'RoboLabSketch');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  // Remove old auxiliary files (except RoboLabSketch.ino) so removed files don't linger
  try {
    for (const f of fs.readdirSync(tempDir)) {
      if (f !== 'RoboLabSketch.ino') {
        const p = path.join(tempDir, f);
        if (fs.statSync(p).isFile()) fs.unlinkSync(p);
      }
    }
  } catch {}

  let finalCode = '';
  for (const [fname, fcontent] of Object.entries(files)) {
    if (fname.endsWith('.ino') && typeof fcontent === 'string') {
      if (fcontent.includes('setup(') || !finalCode) {
        finalCode = fcontent;
      }
    }
  }
  if (!finalCode) {
    const firstVal = Object.values(files)[0];
    finalCode = typeof firstVal === 'string' ? firstVal : 'void setup() {}\nvoid loop() {}';
  }

  // ESP32 compatibility transforms
  if (isEsp32) {
    if (finalCode.includes('<Servo.h>')) {
      logs.push({ text: '⚙️ Mengubah #include <Servo.h> menjadi #include <ESP32Servo.h> untuk ESP32...', type: 'info' });
      finalCode = finalCode.replace(/#include\s*<Servo\.h>/g, '#include <ESP32Servo.h>');
    }
    if (/std::string\s+[a-zA-Z0-9_]+\s*=\s*.*->getValue\(\)/.test(finalCode)) {
      finalCode = finalCode.replace(/std::string\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+->getValue\(\));/g, 'String $1 = $2;');
      finalCode = finalCode.replace(/([a-zA-Z0-9_]+)\.empty\(\)/g, '($1.length() == 0)');
    }
    if (finalCode.includes('ledcSetup') || finalCode.includes('ledcAttachPin')) {
      const ledcCompatHeader = `#include <Arduino.h>
#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
struct __LedcChannelConfig { uint32_t freq; uint8_t resolution; };
static __LedcChannelConfig __ledc_channels[16];
static inline double ledcSetup(uint8_t channel, double freq, uint8_t resolution_bits) {
  if (channel < 16) { __ledc_channels[channel].freq = (uint32_t)freq; __ledc_channels[channel].resolution = resolution_bits; }
  return freq;
}
static inline void ledcAttachPin(uint8_t pin, uint8_t channel) {
  if (channel < 16) {
    uint32_t freq = __ledc_channels[channel].freq ? __ledc_channels[channel].freq : 5000;
    uint8_t res = __ledc_channels[channel].resolution ? __ledc_channels[channel].resolution : 8;
    ledcAttachChannel(pin, freq, res, channel);
  }
}
#endif\n`;
      finalCode = ledcCompatHeader + finalCode;
    }
  }

  const inoPath = path.join(tempDir, 'RoboLabSketch.ino');
  let previousDiskCode = '';
  try {
    if (fs.existsSync(inoPath)) previousDiskCode = fs.readFileSync(inoPath, 'utf-8');
  } catch {}

  if (previousDiskCode !== finalCode) {
    fs.writeFileSync(inoPath, finalCode, 'utf-8');
  }

  // Write auxiliary .c, .h, .cpp, .hpp files
  let hashContent = finalCode;
  for (const [fname, fcontent] of Object.entries(files)) {
    const ext = path.extname(fname).toLowerCase();
    if (['.c', '.h', '.cpp', '.hpp'].includes(ext) && typeof fcontent === 'string') {
      const baseName = path.basename(fname);
      let auxContent = fcontent;
      if (!auxContent.includes('<Arduino.h>')) {
        auxContent = '#include <Arduino.h>\n' + auxContent;
      }
      if (
        (auxContent.includes('WiFi') || auxContent.includes('WL_CONNECTED')) &&
        !auxContent.includes('<WiFi.h>') &&
        !auxContent.includes('<ESP8266WiFi.h>')
      ) {
        auxContent = (isEsp8266 ? '#include <ESP8266WiFi.h>\n' : '#include <WiFi.h>\n') + auxContent;
      }
      fs.writeFileSync(path.join(tempDir, baseName), auxContent, 'utf-8');
      hashContent += `\n// --- ${baseName} ---\n` + auxContent;
    }
  }

  const configArgs = getConfigArgs();
  const buildDir = getBuildDirForFqbn(fqbn);

  // Reload hash cache from disk in case Electron updated it
  try {
    if (fs.existsSync(_hashCachePath)) {
      Object.assign(lastCompiledHashes, JSON.parse(fs.readFileSync(_hashCachePath, 'utf-8')));
    }
  } catch {}

  const codeHash = crypto.createHash('md5').update(hashContent).digest('hex');
  let shouldCompile = true;

  if (fs.existsSync(buildDir)) {
    try {
      const bFiles = fs.readdirSync(buildDir);
      const hasMainBin = bFiles.some(
        (f) => (f.endsWith('.bin') || f.endsWith('.hex')) && !f.endsWith('.bootloader.bin') && !f.endsWith('.partitions.bin')
      );
      const hasBootloader = bFiles.some((f) => f.endsWith('.bootloader.bin'));
      const hasPartitions = bFiles.some((f) => f.endsWith('.partitions.bin'));
      const isArtifactComplete = isEsp32 ? hasMainBin && hasBootloader && hasPartitions : hasMainBin;

      const hashMatched =
        lastCompiledHashes[fqbn] === codeHash ||
        lastCompiledHashes[board] === codeHash;

      if (hashMatched && isArtifactComplete) {
        shouldCompile = false;
        lastCompiledHashes[fqbn] = codeHash;
        lastCompiledHashes[board] = codeHash;
        saveHashCache();
        logs.push({
          text: '⚡ [Build Cache] Kode tidak berubah — menggunakan hasil kompilasi cache instan! (Sangat Cepat)',
          type: 'success',
        });
      }
    } catch {}
  }

  if (shouldCompile) {
    // Free RAM and COM locks from background KidsBlock or zombie compiler processes on Windows
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /IM "KidsBlock Desktop.exe" /F /T', { stdio: 'ignore' });
        execSync('taskkill /IM "KidsBlock.exe" /F /T', { stdio: 'ignore' });
      } catch {}
      try {
        execSync('taskkill /IM "cc1plus.exe" /F /T', { stdio: 'ignore' });
        execSync('taskkill /IM "xtensa-lx106-elf-g++.exe" /F /T', { stdio: 'ignore' });
      } catch {}
    }

    // Delete only stale top-level .bin/.hex/.elf in buildDir, keeping precompiled core/ and libraries/ object caches!
    if (fs.existsSync(buildDir)) {
      try {
        for (const f of fs.readdirSync(buildDir)) {
          if (f.endsWith('.bin') || f.endsWith('.hex') || f.endsWith('.elf')) {
            try {
              fs.unlinkSync(path.join(buildDir, f));
            } catch {}
          }
        }
      } catch {}
    }
    ensureBuildDirStructure(buildDir, fqbn);

    const cpuCount = (os.cpus() && os.cpus().length) || 4;
    const freeMemMB = Math.round(os.freemem() / (1024 * 1024));
    const hasPrecompiledCore = fs.existsSync(path.join(buildDir, 'core', 'core.a'));
    // Limit parallel cc1plus.exe jobs on ESP8266 or low-RAM Windows systems to prevent 32-bit cc1plus.exe OOM
    let jobCount = Math.min(6, Math.max(2, Math.floor(cpuCount / 2)));
    if (freeMemMB < 450) {
      jobCount = 1;
    } else if (isEsp8266 || freeMemMB < 800) {
      jobCount = Math.min(2, jobCount);
    }

    const extraLibArgs = getExtraLibraryArgs();

    logs.push({
      text: `🔨 Mengompilasi sketsa C++ dengan arduino-cli (${jobCount} parallel jobs & core cache aktif)...`,
      type: 'info',
    });

    const buildCompileArgs = (jobs) => [
      'compile',
      '--fqbn',
      fqbn,
      '--build-path',
      buildDir,
      '--jobs',
      String(jobs),
      '--warnings',
      'none',
      ...extraLibArgs,
      ...configArgs,
      tempDir,
    ];

    const compileArgs = buildCompileArgs(jobCount);
    let res = await runCli(compileArgs, logs, 600000, fqbn);

    // Check if failure was due to cc1plus.exe OOM, missing ld_h, or parallel race (NOT a user sketch syntax error)
    const stderrStr = res.stderr || '';
    const hasSketchSyntaxError =
      /RoboLabSketch\.ino:\d+:\d+:\s*(?:fatal\s+)?error:/i.test(stderrStr) &&
      !/No such file or directory/i.test(stderrStr);
    const isOomOrLdError =
      /out of memory|cannot allocate|virtual memory|errno=1455|ld_h|local\.eagle\.flash\.ld|cp\.py/i.test(stderrStr);

    if (!res.success && (isOomOrLdError || (!hasSketchSyntaxError && jobCount > 1))) {
      logs.push({
        text: '🔄 Mengoptimalkan penggunaan RAM (mode hemat memori single-job) dan melanjutkan kompilasi...',
        type: 'info',
      });
      ensureBuildDirStructure(buildDir, fqbn);
      res = await runCli(buildCompileArgs(1), logs, 600000, fqbn);

      // If incremental build still hit OOM partway through the core, run one more single-job pass to finish remaining .o files
      if (!res.success && /out of memory|cannot allocate|virtual memory/i.test(res.stderr || '')) {
        logs.push({
          text: '🔄 Melanjutkan kompilasi objek core yang tersisa (mode hemat memori tahap 2)...',
          type: 'info',
        });
        ensureBuildDirStructure(buildDir, fqbn);
        res = await runCli(buildCompileArgs(1), logs, 600000, fqbn);
      }
    }

    // Auto-install missing library if needed
    if (!res.success && res.stderr) {
      const missingLibMatch = res.stderr.match(/fatal error:\s*([a-zA-Z0-9_]+)\.h:\s*No such file or directory/i);
      if (missingLibMatch) {
        const rawHeader = missingLibMatch[1];
        const rawLower = rawHeader.toLowerCase();
        let libToInstall = rawHeader;
        if (rawLower.includes('dht')) libToInstall = 'DHT sensor library';
        else if (rawLower.includes('ssd1306')) libToInstall = 'Adafruit SSD1306';
        else if (rawLower.includes('gfx')) libToInstall = 'Adafruit GFX Library';
        else if (rawLower.includes('pn532') || rawLower.includes('rfid')) libToInstall = 'Adafruit PN532';
        else if (rawLower.includes('mfrc522')) libToInstall = 'MFRC522';
        else if (rawHeader === 'Servo') libToInstall = isEsp32 ? 'ESP32Servo' : 'Servo';
        else if (rawHeader === 'ESP32Servo') libToInstall = 'ESP32Servo';
        else if (rawHeader === 'Adafruit_MPU6050') libToInstall = 'Adafruit MPU6050';
        else if (rawHeader === 'Adafruit_NeoPixel') libToInstall = 'Adafruit NeoPixel';
        else if (rawHeader === 'PubSubClient') libToInstall = 'PubSubClient';
        else if (rawHeader === 'WebSocketsClient') libToInstall = 'WebSockets';
        else if (rawHeader.startsWith('Blynk')) libToInstall = 'Blynk';

        logs.push({ text: `📦 Menginstal library '${libToInstall}' secara otomatis...`, type: 'info' });
        await runCli(['lib', 'install', libToInstall, ...configArgs], logs, 240000, fqbn);
        ensureBuildDirStructure(buildDir, fqbn);
        res = await runCli(buildCompileArgs(1), logs, 600000, fqbn);
      }

      // Auto-install missing platform core if needed
      const missingPlatformMatch = res.stderr.match(
        /Platform '([^']+)' not found|Platform ([a-zA-Z0-9_:]+) is not found|platform not installed/i
      );
      if (!res.success && missingPlatformMatch) {
        const coreToInstall = fqbn.split(':').slice(0, 2).join(':');
        logs.push({ text: `⚙️ Menginstal platform core '${coreToInstall}' secara otomatis...`, type: 'info' });
        await runCli(['core', 'update-index', ...configArgs], logs, 120000, fqbn);
        await runCli(['core', 'install', coreToInstall, ...configArgs], logs, 600000, fqbn);
        ensureBuildDirStructure(buildDir, fqbn);
        res = await runCli(buildCompileArgs(1), logs, 600000, fqbn);
      }

      // Auto-recovery ONLY if build cache has genuinely corrupted dependency (.d) or archive (.a) files
      // Never wipe buildDir on general errors or OOM so precompiled core.a is preserved!
      if (
        !res.success &&
        /opening dependency file|\.d:\s*No such file|archive has no index|file format not recognized/i.test(
          res.stderr
        )
      ) {
        logs.push({
          text: '🔄 Memperbaiki berkas cache dependensi dan mengompilasi ulang dengan mode stabil (1 job)...',
          type: 'info',
        });
        try {
          const sketchCache = path.join(buildDir, 'sketch');
          if (fs.existsSync(sketchCache)) fs.rmSync(sketchCache, { recursive: true, force: true });
          if (/archive has no index|file format not recognized/i.test(res.stderr)) {
            const coreArchive = path.join(buildDir, 'core', 'core.a');
            if (fs.existsSync(coreArchive)) fs.unlinkSync(coreArchive);
          }
          ensureBuildDirStructure(buildDir, fqbn);
        } catch {}
        res = await runCli(buildCompileArgs(1), logs, 600000, fqbn);
      }
    }

    if (!res.success) {
      return { success: false, error: 'Kompilasi gagal.', logs };
    }
    lastCompiledHashes[fqbn] = codeHash;
    lastCompiledHashes[board] = codeHash;
    saveHashCache();
    logs.push({ text: '✓ Kompilasi berhasil!', type: 'success' });
  }

  // Collect compiled artifacts for Web Serial or Local Bridge flashing
  const buildFiles = fs.readdirSync(buildDir);
  if (fqbn.includes('avr')) {
    const hexFile = buildFiles.find((f) => f.endsWith('.ino.hex') || (f.endsWith('.hex') && !f.includes('bootloader')));
    if (hexFile) {
      const hexData = fs.readFileSync(path.join(buildDir, hexFile), 'utf-8');
      return {
        success: true,
        binaryType: 'avr-hex',
        hexData,
        logs,
      };
    }
  }

  if (isEsp32 || isEsp8266) {
    const partitions = [];
    if (isEsp32) {
      const bootFile = buildFiles.find((f) => f.endsWith('.ino.bootloader.bin'));
      const partFile = buildFiles.find((f) => f.endsWith('.ino.partitions.bin'));
      const appFile = buildFiles.find(
        (f) =>
          f.endsWith('.ino.bin') &&
          !f.endsWith('.bootloader.bin') &&
          !f.endsWith('.partitions.bin') &&
          !f.endsWith('.merged.bin')
      );

      if (bootFile) {
        partitions.push({
          name: 'bootloader.bin',
          offset: 0x1000,
          dataBase64: fs.readFileSync(path.join(buildDir, bootFile)).toString('base64'),
        });
      }
      if (partFile) {
        partitions.push({
          name: 'partitions.bin',
          offset: 0x8000,
          dataBase64: fs.readFileSync(path.join(buildDir, partFile)).toString('base64'),
        });
      }
      if (appFile) {
        partitions.push({
          name: 'firmware.bin',
          offset: 0x10000,
          dataBase64: fs.readFileSync(path.join(buildDir, appFile)).toString('base64'),
        });
      }
    } else {
      // ESP8266 single binary at 0x0000 — ensure DOUT flash mode (0x03) for Zbit (5e:4016) & universal Lolin/NodeMCU compatibility
      const appFile = buildFiles.find((f) => f.endsWith('.ino.bin'));
      if (appFile) {
        const appFullPath = path.join(buildDir, appFile);
        const rawBin = fs.readFileSync(appFullPath);
        if (rawBin.length > 4 && rawBin[0] === 0xe9 && rawBin[2] !== 0x03) {
          rawBin[2] = 0x03; // DOUT mode
          try {
            fs.writeFileSync(appFullPath, rawBin);
          } catch {}
        }
        partitions.push({
          name: 'firmware.bin',
          offset: 0x0000,
          dataBase64: rawBin.toString('base64'),
        });
      }
    }

    return {
      success: true,
      binaryType: 'esp-bin',
      partitions,
      logs,
    };
  }

  return { success: true, logs };
}

function getSerialPortsFromRegistry() {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') return resolve([]);
    const { exec } = require('child_process');
    exec('reg query HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM', { timeout: 3000, windowsHide: true }, (error, stdout) => {
      if (error || !stdout) return resolve([]);
      const ports = [];
      const lines = stdout.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/REG_SZ\s+(COM\d+)/i);
        if (match) {
          const comPort = match[1].toUpperCase();
          const namePart = line.trim().split(/\s+/)[0] || comPort;
          const deviceName = namePart.replace(/.*\\/, '');
          const isBluetooth = /bth|bluetooth/i.test(deviceName);
          ports.push({
            address: comPort,
            label: `${comPort} (${deviceName})`,
            protocol: 'serial',
            isBluetooth,
          });
        }
      }
      // Sort: non-Bluetooth USB/Serial ports (excluding COM1) first, then COM1, then Bluetooth ports
      ports.sort((a, b) => {
        const score = (p) => (p.isBluetooth ? 2 : p.address === 'COM1' ? 1 : 0);
        return score(a) - score(b);
      });
      resolve(ports);
    });
  });
}

async function detectLocalComPorts() {
  // 1. Fast Windows Registry scan (<50ms, never hangs on Bluetooth COM ports)
  const regPorts = await getSerialPortsFromRegistry();
  const hasUsbPort = regPorts.some((p) => !p.isBluetooth && p.address !== 'COM1');

  // If Registry already found a non-Bluetooth USB serial port (like CH340/CP2102), return immediately
  // so Bluetooth virtual COM ports never stall arduino-cli board list!
  if (hasUsbPort) {
    return regPorts;
  }

  // 2. Fallback / enrichment via arduino-cli board list with a tight 3s timeout
  const configArgs = getConfigArgs();
  const res = await runCli(['board', 'list', '--format', 'json', ...configArgs], null, 3000);
  const cliPorts = [];
  if (res.success && res.stdout) {
    try {
      const parsed = JSON.parse(res.stdout);
      const list = Array.isArray(parsed) ? parsed : parsed.detected_ports || [];
      for (const item of list) {
        const p = item.port || item;
        if (p && p.address) {
          const matchingBoards = item.matching_boards || [];
          const hasUsbProps = Boolean(p.properties && (p.properties.vid || p.properties.pid));
          const protoLabel = p.protocol_label || p.label || 'Serial Port';
          const boardName = matchingBoards[0]?.name || protoLabel;
          const isBluetooth = /bth|bluetooth/i.test(boardName) && !hasUsbProps;
          cliPorts.push({
            address: p.address,
            label: `${p.address} (${boardName})`,
            protocol: p.protocol || 'serial',
            isBluetooth: isBluetooth || (!hasUsbProps && !protoLabel.toLowerCase().includes('usb')),
          });
        }
      }
    } catch {}
  }

  const merged = [...regPorts];
  for (const cp of cliPorts) {
    const existing = merged.find((m) => m.address === cp.address);
    if (existing) {
      if (cp.label && !cp.isBluetooth) {
        existing.label = cp.label;
        existing.isBluetooth = false;
      }
    } else {
      merged.push(cp);
    }
  }

  merged.sort((a, b) => {
    const score = (p) => (p.isBluetooth ? 2 : p.address === 'COM1' ? 1 : 0);
    return score(a) - score(b);
  });

  return merged;
}

function findEsp8266UploadToolchain() {
  const dataDir = getCliEnv('esp8266:esp8266:nodemcuv2').ARDUINO_DIRECTORIES_DATA;
  if (!dataDir) return null;
  try {
    const pkgDir = path.join(dataDir, 'packages', 'esp8266');
    const pyToolsDir = path.join(pkgDir, 'tools', 'python3');
    const hwDir = path.join(pkgDir, 'hardware', 'esp8266');
    if (!fs.existsSync(hwDir)) return null;

    let pythonExe = 'python';
    if (fs.existsSync(pyToolsDir)) {
      for (const ver of fs.readdirSync(pyToolsDir)) {
        const candidate = path.join(pyToolsDir, ver, process.platform === 'win32' ? 'python3.exe' : 'python3');
        if (fs.existsSync(candidate)) {
          pythonExe = candidate;
          break;
        }
      }
    }

    for (const ver of fs.readdirSync(hwDir)) {
      const pyserialDir = path.join(hwDir, ver, 'tools', 'pyserial');
      const esptoolDir = path.join(hwDir, ver, 'tools', 'esptool');
      if (fs.existsSync(pyserialDir) && fs.existsSync(esptoolDir)) {
        return { pythonExe, pyserialDir, esptoolDir };
      }
    }
  } catch {}
  return null;
}

async function stopLocalSerialMonitor() {
  if (global.__robolabActiveLocalSerialProc) {
    try {
      killProcessTree(global.__robolabActiveLocalSerialProc);
    } catch {}
    global.__robolabActiveLocalSerialProc = null;
    await new Promise((r) => setTimeout(r, 400));
  }
}

function runEsp8266Ch340SafeUpload(targetComPort, buildDir, logs, baudRate = '115200') {
  return new Promise((resolve) => {
    const tc = findEsp8266UploadToolchain();
    if (!tc || !fs.existsSync(buildDir)) {
      return resolve(null);
    }

    const binFile = fs.readdirSync(buildDir).find((f) => f.endsWith('.ino.bin'));
    if (!binFile) {
      return resolve(null);
    }
    const binPath = path.join(buildDir, binFile);

    const pyScript = [
      'import sys, time',
      `sys.path.insert(0, ${JSON.stringify(tc.pyserialDir)})`,
      `sys.path.insert(0, ${JSON.stringify(tc.esptoolDir)})`,
      'import serial',
      '_orig_reconf = serial.Serial._reconfigure_port',
      'def _safe_reconf(self):',
      '    try:',
      '        _orig_reconf(self)',
      '    except Exception as e:',
      '        msg = str(e)',
      '        if "PermissionError" in msg or "Cannot configure port" in msg or "31" in msg:',
      '            pass',
      '        else:',
      '            raise',
      'serial.Serial._reconfigure_port = _safe_reconf',
      'import esptool',
      `esptool.main(['--chip', 'esp8266', '--port', ${JSON.stringify(targetComPort)}, '--baud', ${JSON.stringify(String(baudRate))}, '--before', 'default_reset', '--after', 'hard_reset', 'write_flash', '--flash_mode', 'dout', '--flash_size', 'detect', '0x0', ${JSON.stringify(binPath)}])`,
      'try:',
      `    s = serial.Serial(${JSON.stringify(targetComPort)}, 115200, timeout=0.1)`,
      '    s.setDTR(False)',
      '    s.setRTS(True)',
      '    s.setDTR(False)',
      '    time.sleep(0.08)',
      '    s.setRTS(False)',
      '    s.setDTR(False)',
      '    s.close()',
      'except Exception:',
      '    pass',
    ].join('\n');

    const child = spawn(tc.pythonExe, ['-u', '-c', pyScript], { windowsHide: true });
    let stdoutText = '';
    let stderrText = '';
    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      killProcessTree(child);
      if (logs) logs.push({ text: '⚠️ Waktu upload ESP8266 habis (Timeout).', type: 'error' });
      finish({ success: false, stdout: stdoutText, stderr: stderrText, timedOut: true });
    }, 180000);

    const handleChunk = (d, isErr) => {
      const str = d.toString();
      if (isErr) stderrText += str;
      else stdoutText += str;
      if (logs) {
        str.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed) return;
          const isProgress =
            /\d+%|uploading|writing|reading|erasing|bytes|hard resetting|connecting|leaving|chip is|features:|crystal is|mac:|stub|configuring flash|flash params|hash of data/i.test(
              trimmed
            );
          logs.push({ text: trimmed, type: !isErr || isProgress ? 'stdout' : 'error' });
        });
      }
    };

    child.stdout.on('data', (d) => handleChunk(d, false));
    child.stderr.on('data', (d) => handleChunk(d, true));

    child.on('close', (code) => {
      const combined = `${stdoutText}\n${stderrText}`;
      const hasFatal =
        /A fatal esptool\.py error occurred|A fatal error occurred|Cannot configure port|Failed to connect|Timed out waiting for packet/i.test(
          combined
        );
      finish({ success: code === 0 && !hasFatal, stdout: stdoutText, stderr: stderrText });
    });

    child.on('error', (err) => {
      finish({ success: false, stdout: stdoutText, stderr: err.message });
    });
  });
}

async function handleUploadLocalRequest(body) {
  await stopLocalSerialMonitor();
  const { board = 'Arduino Uno', port = '' } = body || {};
  const logs = [];
  const fqbn = resolveFqbn(board);
  const bLower = board.toLowerCase();
  const isEsp32 = fqbn.includes('esp32') || bLower.includes('esp32');
  const isEsp8266 = fqbn.includes('esp8266') || bLower.includes('esp8266') || bLower.includes('nodemcu') || bLower.includes('lolin') || bLower.includes('wemos');
  const configArgs = getConfigArgs();
  const buildDir = getBuildDirForFqbn(fqbn);
  const tempDir = path.join(os.tmpdir(), 'RoboLabSketch');

  const detected = await detectLocalComPorts();
  let targetComPort = port;

  // If no port specified, or WebUSB virtual label, or user accidentally had a Bluetooth COM port selected while a real USB port exists
  const selectedMeta = detected.find((p) => p.address.toUpperCase() === (targetComPort || '').toUpperCase());
  const usbPort =
    detected.find((p) => !p.isBluetooth && p.address !== 'COM1') ||
    detected.find((p) => !p.isBluetooth) ||
    detected[0];

  if (
    !targetComPort ||
    targetComPort === 'none' ||
    targetComPort.startsWith('WebUSB') ||
    (selectedMeta && selectedMeta.isBluetooth && usbPort && !usbPort.isBluetooth)
  ) {
    if (usbPort) {
      targetComPort = usbPort.address;
      logs.push({ text: `🔌 [Local Bridge] Otomatis mendeteksi port perangkat USB pada ${usbPort.label}`, type: 'info' });
    }
  }

  if (!targetComPort || targetComPort === 'none' || targetComPort.startsWith('WebUSB')) {
    return {
      success: false,
      error: 'Tidak ada port COM perangkat yang terdeteksi di komputer.',
      logs,
    };
  }

  logs.push({
    text: `🚀 [High-Speed Local Uploader] Mengunggah ke ${board} pada port ${targetComPort}...`,
    type: 'info',
  });

  // For ESP8266 Lolin / NodeMCU: use CH340-safe direct esptool uploader first (handles Windows 11 CH340 driver WinError 31 & Python 3 upload.py bug)
  if (isEsp8266) {
    const directRes = await runEsp8266Ch340SafeUpload(targetComPort, buildDir, logs, '115200');
    if (directRes && directRes.success) {
      logs.push({ text: `🎉 Upload ke ${board} (${targetComPort}) berhasil!`, type: 'success' });
      return { success: true, port: targetComPort, logs };
    }
  }

  const baseUploadArgs = [
    'upload',
    '-p',
    targetComPort,
    '--fqbn',
    fqbn,
    '--build-path',
    buildDir,
    '--verbose',
    ...configArgs,
    tempDir,
  ];

  let uploadArgs = [...baseUploadArgs];
  if (isEsp32) {
    // High-speed 921600 baud rate for fast ESP32 flashing (~6-8 seconds)
    uploadArgs = [
      'upload',
      '-p',
      targetComPort,
      '--fqbn',
      fqbn,
      '--build-path',
      buildDir,
      '--verbose',
      '--upload-field',
      'UploadSpeed=921600',
      '--upload-field',
      'speed=921600',
      '--upload-field',
      'upload.speed=921600',
      ...configArgs,
      tempDir,
    ];
  }

  let res = await runCli(uploadArgs, logs, 180000, fqbn);

  // Fallback for ESP8266 Lolin / NodeMCU on CH340/CP2102 if first upload attempt failed
  if (!res.success && isEsp8266) {
    logs.push({
      text: '🔄 Mencoba ulang upload ESP8266 Lolin/NodeMCU dengan reset otomatis @ 115200 baud...',
      type: 'info',
    });
    await new Promise((r) => setTimeout(r, 600));
    const directRetry = await runEsp8266Ch340SafeUpload(targetComPort, buildDir, logs, '115200');
    if (directRetry && directRetry.success) {
      res = directRetry;
    } else {
      const esp8266FallbackArgs = [
        'upload',
        '-p',
        targetComPort,
        '--fqbn',
        'esp8266:esp8266:nodemcuv2:eesz=4M2M,baud=115200',
        '--build-path',
        buildDir,
        '--verbose',
        ...configArgs,
        tempDir,
      ];
      res = await runCli(esp8266FallbackArgs, logs, 180000, fqbn);
    }
  }

  // Fallback for ESP32 on CH340/CP2102 chips that prefer 460800 or 115200 baud
  if (!res.success && isEsp32) {
    logs.push({
      text: '🔄 Mencoba ulang upload ESP32 pada kecepatan 460800 baud...',
      type: 'info',
    });
    const fallback460Args = [
      'upload',
      '-p',
      targetComPort,
      '--fqbn',
      fqbn,
      '--build-path',
      buildDir,
      '--verbose',
      '--upload-field',
      'UploadSpeed=460800',
      '--upload-field',
      'speed=460800',
      ...configArgs,
      tempDir,
    ];
    res = await runCli(fallback460Args, logs, 180000, fqbn);

    if (!res.success) {
      logs.push({
        text: '🔄 Mencoba ulang upload ESP32 pada kecepatan standar 115200 baud...',
        type: 'info',
      });
      const fallback115Args = [
        'upload',
        '-p',
        targetComPort,
        '--fqbn',
        fqbn,
        '--build-path',
        buildDir,
        '--verbose',
        '--upload-field',
        'UploadSpeed=115200',
        '--upload-field',
        'speed=115200',
        ...configArgs,
        tempDir,
      ];
      res = await runCli(fallback115Args, logs, 180000, fqbn);
    }
  }

  // Automatic fallback for Arduino Nano with Old Bootloader (57600 baud)
  if (!res.success && fqbn === 'arduino:avr:nano') {
    logs.push({ text: '🔄 Mencoba ulang dengan konfigurasi Arduino Nano (Old Bootloader @ 57600 baud)...', type: 'info' });
    const oldNanoArgs = [
      'upload',
      '-p',
      targetComPort,
      '--fqbn',
      'arduino:avr:nano:cpu=atmega328old',
      '--build-path',
      buildDir,
      '--verbose',
      ...configArgs,
      tempDir,
    ];
    res = await runCli(oldNanoArgs, logs, 120000, fqbn);
  }

  if (res.success) {
    logs.push({ text: `🎉 Upload ke ${board} (${targetComPort}) berhasil!`, type: 'success' });
    return { success: true, port: targetComPort, logs };
  }

  return {
    success: false,
    error: `Upload ke ${targetComPort} gagal.`,
    logs,
  };
}

function downloadUrlToBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadUrlToBuffer(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function handleFirmwareRequest(board = 'ESP32 DevKit V1') {
  const bLower = board.toLowerCase();
  const isEsp8266 = bLower.includes('esp8266') || bLower.includes('nodemcu');
  const cacheFile = path.join(
    os.tmpdir(),
    isEsp8266 ? 'esp8266_micropython_fw.bin' : 'esp32_micropython_fw.bin'
  );
  const fwUrl = isEsp8266
    ? 'https://micropython.org/resources/firmware/ESP8266_GENERIC-20231005-v1.21.0.bin'
    : 'https://micropython.org/resources/firmware/ESP32_GENERIC-20231005-v1.21.0.bin';

  let buf;
  if (fs.existsSync(cacheFile) && fs.statSync(cacheFile).size > 100000) {
    buf = fs.readFileSync(cacheFile);
  } else {
    buf = await downloadUrlToBuffer(fwUrl);
    fs.writeFileSync(cacheFile, buf);
  }

  return {
    success: true,
    partitions: [
      {
        name: isEsp8266 ? 'micropython-esp8266.bin' : 'micropython-esp32.bin',
        offset: isEsp8266 ? 0x0000 : 0x1000,
        dataBase64: buf.toString('base64'),
      },
    ],
  };
}

function createApiMiddleware() {
  const handler = async (req, res, next) => {
    const rawUrl = req.url || '';
    if (!rawUrl.startsWith('/api/')) {
      if (typeof next === 'function') return next();
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
      return;
    }

    // CORS headers for browser access (including Chrome Private Network Access)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(rawUrl, `http://localhost:${PORT}`);

    if (req.method === 'GET' && parsedUrl.pathname === '/api/health') {
      const cliPath = getArduinoCliPath();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ok: true,
          service: 'RoboLab Studio Web Cloud Compiler',
          arduinoCliPath: cliPath,
          arduinoCliExists: fs.existsSync(cliPath),
        })
      );
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/ports') {
      try {
        const ports = await detectLocalComPorts();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, ports }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, ports: [], error: err.message || String(err) }));
      }
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/firmware') {
      try {
        const board = parsedUrl.searchParams.get('board') || 'ESP32 DevKit V1';
        const result = await handleFirmwareRequest(board);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || String(err) }));
      }
      return;
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/api/serial-monitor') {
      await stopLocalSerialMonitor();
      let targetPort = parsedUrl.searchParams.get('port') || '';
      const baud = Number(parsedUrl.searchParams.get('baud')) || 115200;

      if (!targetPort || targetPort === 'none' || targetPort.startsWith('WebUSB')) {
        const detected = await detectLocalComPorts();
        const usbPort =
          detected.find((p) => !p.isBluetooth && p.address !== 'COM1') ||
          detected.find((p) => !p.isBluetooth) ||
          detected[0];
        if (usbPort) targetPort = usbPort.address;
      }

      if (!targetPort) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Tidak ada port COM yang ditemukan.' }));
        return;
      }

      const tc = findEsp8266UploadToolchain();
      let child;
      if (tc) {
        const pyMonitorScript = [
          'import sys, time, threading',
          `sys.path.insert(0, ${JSON.stringify(tc.pyserialDir)})`,
          'import serial',
          '_orig_reconf = serial.Serial._reconfigure_port',
          'def _safe_reconf(self):',
          '    try:',
          '        _orig_reconf(self)',
          '    except Exception as e:',
          '        msg = str(e)',
          '        if "PermissionError" in msg or "Cannot configure port" in msg or "31" in msg:',
          '            pass',
          '        else:',
          '            raise',
          'serial.Serial._reconfigure_port = _safe_reconf',
          `s = serial.Serial(${JSON.stringify(targetPort)}, ${baud}, timeout=0.05)`,
          'try:',
          '    s.setDTR(False)',
          '    s.setRTS(False)',
          '    s.setDTR(False)',
          'except Exception:',
          '    pass',
          'def _stdin_reader():',
          '    while True:',
          '        try:',
          '            line = sys.stdin.buffer.readline()',
          '            if not line: break',
          '            s.write(line)',
          '        except Exception:',
          '            break',
          't = threading.Thread(target=_stdin_reader, daemon=True)',
          't.start()',
          'while True:',
          '    data = s.read(256)',
          '    if data:',
          '        sys.stdout.buffer.write(data)',
          '        sys.stdout.buffer.flush()',
        ].join('\n');
        child = spawn(tc.pythonExe, ['-u', '-c', pyMonitorScript], { windowsHide: true });
      } else {
        const cliPath = getArduinoCliPath();
        child = spawn(cliPath, ['monitor', '-p', targetPort, '--config', `baudrate=${baud}`], { windowsHide: true });
      }

      global.__robolabActiveLocalSerialProc = child;

      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
      res.write(`\r\n--- Serial Monitor Connected to ${targetPort} @ ${baud} baud ---\r\n`);

      child.stdout.on('data', (chunk) => {
        try {
          res.write(chunk);
        } catch {}
      });
      child.stderr.on('data', (chunk) => {
        try {
          res.write(chunk);
        } catch {}
      });
      child.on('close', () => {
        if (global.__robolabActiveLocalSerialProc === child) {
          global.__robolabActiveLocalSerialProc = null;
        }
        try {
          res.end();
        } catch {}
      });
      req.on('close', () => {
        if (global.__robolabActiveLocalSerialProc === child) {
          global.__robolabActiveLocalSerialProc = null;
        }
        killProcessTree(child);
      });
      return;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/serial-stop') {
      await stopLocalSerialMonitor();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/api/serial-send') {
      let rawBody = '';
      req.on('data', (c) => {
        rawBody += c;
      });
      req.on('end', () => {
        try {
          const { data = '' } = JSON.parse(rawBody || '{}');
          if (global.__robolabActiveLocalSerialProc && global.__robolabActiveLocalSerialProc.stdin) {
            global.__robolabActiveLocalSerialProc.stdin.write(data.endsWith('\n') ? data : data + '\r\n');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
          }
        } catch {}
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      });
      return;
    }

    if (req.method === 'POST' && (parsedUrl.pathname === '/api/compile' || parsedUrl.pathname === '/api/upload-local')) {
      let rawBody = '';
      req.on('data', (chunk) => {
        rawBody += chunk;
      });
      req.on('end', async () => {
        try {
          const body = JSON.parse(rawBody || '{}');
          const result =
            parsedUrl.pathname === '/api/upload-local'
              ? await handleUploadLocalRequest(body)
              : await handleCompileRequest(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              success: false,
              error: err.message || String(err),
              logs: [{ text: `Server Error: ${err.message || err}`, type: 'error' }],
            })
          );
        }
      });
      return;
    }

    if (typeof next === 'function') return next();
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  };
  if (global.__robolabActiveCompileServer) {
    try {
      global.__robolabActiveCompileServer.removeAllListeners('request');
      global.__robolabActiveCompileServer.on('request', (req, res) => handler(req, res));
    } catch {}
  }
  return handler;
}

function startCompileServer(port = PORT) {
  const middleware = createApiMiddleware();
  if (global.__robolabActiveCompileServer) {
    return global.__robolabActiveCompileServer;
  }

  const server = http.createServer((req, res) => middleware(req, res));

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.log(`[RoboLab Web Compiler] Port ${port} already active.`);
    } else {
      console.warn(`[RoboLab Web Compiler] Server warning:`, err.message || err);
    }
  });

  server.listen(port, () => {
    console.log(`[RoboLab Web Compiler] Listening on http://localhost:${port}`);
    console.log(`[RoboLab Web Compiler] Using arduino-cli: ${getArduinoCliPath()}`);
  });

  global.__robolabActiveCompileServer = server;
  return server;
}

if (require.main === module) {
  startCompileServer(PORT);
}

module.exports = {
  getArduinoCliPath,
  handleCompileRequest,
  handleFirmwareRequest,
  handleUploadLocalRequest,
  detectLocalComPorts,
  createApiMiddleware,
  startCompileServer,
};
