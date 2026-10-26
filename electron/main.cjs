const { app, BrowserWindow, ipcMain, session, Menu, shell, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const os = require('os');

let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  if (autoUpdater) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;
    autoUpdater.allowDowngrade = false;
    try {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'Akhmad-Fadhlan',
        repo: 'robolab'
      });
    } catch (_) {}

    const sendUpdateStatus = (status, payload = {}) => {
      console.log(`[RoboLab AutoUpdater] ${status}:`, payload);
      const wins = BrowserWindow.getAllWindows();
      if (wins.length > 0 && !wins[0].isDestroyed()) {
        wins[0].webContents.send('auto-update-status', { status, ...payload });
      }
    };

    autoUpdater.on('checking-for-update', () => {
      sendUpdateStatus('checking');
    });

    autoUpdater.on('update-available', (info) => {
      sendUpdateStatus('available', { version: info.version, releaseDate: info.releaseDate, info });
    });

    autoUpdater.on('update-not-available', (info) => {
      sendUpdateStatus('not-available', { version: info?.version, info });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      sendUpdateStatus('downloading', {
        percent: Math.round(progressObj.percent || 0),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      sendUpdateStatus('downloaded', { version: info.version, info });
    });

    autoUpdater.on('error', (err) => {
      sendUpdateStatus('error', { message: err ? (err.message || String(err)) : 'Unknown error' });
      console.error('[RoboLab AutoUpdate Error]:', err ? (err.stack || err) : err);
    });
  }
} catch (e) {
  console.warn('[RoboLab] electron-updater module not loaded:', e.message);
}

// === Global crash guards: prevent exit code 134 from unhandled errors ===
process.on('uncaughtException', (err) => {
  console.error('[RoboLab] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[RoboLab] Unhandled Promise Rejection:', reason);
});

const isDev = process.argv.includes('--dev') || !app.isPackaged;

// Optimize memory footprint & performance
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=2048');
app.commandLine.appendSwitch('disable-dev-shm-usage');
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
// Backgrounding and timer throttling kept ENABLED to save CPU idle

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    title: 'RoboLab Studio',
    icon: path.join(__dirname, '../public/icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Allow loading from CDN (Monaco Editor) and local resources
    },
  });

  // Allow CDN resources for Monaco Editor, Blockly sprites, and Kilo AI API Gateway
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: file:",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net blob:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' https://blockly-demo.appspot.com https://www.gstatic.com https://lh3.googleusercontent.com https://*.googleusercontent.com data: blob: file:",
            "connect-src 'self' https://cdn.jsdelivr.net https://api.kilo.ai https://api.kilocode.com https://openrouter.ai https://qcewaspgybtbofjowoxs.supabase.co wss://qcewaspgybtbofjowoxs.supabase.co http://127.0.0.1:54321 blob: data: *",
            "worker-src 'self' blob: data:"
          ].join('; ')
        ]
      }
    });
  });

  win.maximize();

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // Open DevTools in dev mode
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Delay update check to ensure frontend is ready and listening to IPC
  win.webContents.once('did-finish-load', () => {
    setTimeout(() => {
      if (!isDev && autoUpdater) {
        autoUpdater.checkForUpdatesAndNotify().catch(e => {
          console.warn('[RoboLab] AutoUpdater check notice on startup:', e.message);
        });
      }
    }, 3000);
  });
}

// Kilo AI Gateway IPC Handler (bypasses browser CORS & CSP)
ipcMain.handle('kilo-api-request', async (event, payload) => {
  const { url, key, body } = payload;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { error: { message: text } }; }
    
    if (!res.ok) {
      return { success: false, status: res.status, error: data.error?.message || data.message || text || `HTTP ${res.status}` };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Native Dialogs and File System IPC Handlers

// ─── Device Fingerprint IPC Handlers ─────────────────────────────────────────
ipcMain.handle('get-device-id', () => {
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'unknown-cpu';
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch(),
    cpuModel,
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex');
});

ipcMain.handle('get-device-info', () => {
  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'Unknown CPU';
  return {
    name: os.hostname(),
    os: `${os.platform()} ${os.release()} (${os.arch()}) — ${cpuModel}`,
  };
});

ipcMain.handle('open-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  
  const dirPath = result.filePaths[0];
  const folderName = path.basename(dirPath);
  
  const readDirectoryRecursive = async (currentDir, relativeBase = '') => {
    let fileMap = {};
    try {
      const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'build') {
            const subMap = await readDirectoryRecursive(fullPath, relPath);
            Object.assign(fileMap, subMap);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          // Load all project source, header, and configuration files recursively (.ino, .c, .h, .cpp, .hpp, .py, .json, .md, .txt, .hex, .xml)
          if (['.ino', '.c', '.h', '.cpp', '.hpp', '.py', '.json', '.md', '.txt', '.hex', '.xml', '.properties'].includes(ext)) {
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            fileMap[relPath] = content;
          }
        }
      }
    } catch (err) {
      console.warn("Failed to read directory recursively:", currentDir, err);
    }
    return fileMap;
  };

  try {
    const fileMap = await readDirectoryRecursive(dirPath);
    return { name: folderName, files: fileMap, path: dirPath };
  } catch (e) {
    console.error("Failed to read directory:", e);
    return null;
  }
});

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'RoboLab Block & Code Files', extensions: ['hex', 'ino', 'py', 'json', 'md', 'txt'] },
      { name: 'Block HEX Files (*.hex)', extensions: ['hex'] }
    ]
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  
  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return { name: fileName, content, path: filePath };
  } catch (e) {
    console.error("Failed to read file:", e);
    return null;
  }
});

ipcMain.handle('save-file', async (event, payload) => {
  const defaultPath = (payload && payload.defaultPath) ? payload.defaultPath : 'robolab_blocks.hex';
  const content = (payload && typeof payload.content === 'string') ? payload.content : '';
  const result = await dialog.showSaveDialog({
    title: 'Simpan Block HEX (.hex)',
    defaultPath,
    filters: [
      { name: 'RoboLab Block HEX (*.hex)', extensions: ['hex'] },
      { name: 'All Files (*.*)', extensions: ['*'] }
    ]
  });
  if (result.canceled || !result.filePath) return null;

  let filePath = result.filePath;
  if (!filePath.toLowerCase().endsWith('.hex')) {
    filePath += '.hex';
  }
  const fileName = path.basename(filePath);
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { name: fileName, path: filePath };
  } catch (e) {
    console.error("Failed to save file:", e);
    return null;
  }
});

ipcMain.handle('create-file', async () => {
  const result = await dialog.showSaveDialog({
    title: 'Buat Berkas Baru',
    defaultPath: 'sensor.ino',
    filters: [
      { name: 'RoboLab Files', extensions: ['ino', 'py', 'json', 'md', 'txt', 'hex'] }
    ]
  });
  if (result.canceled || !result.filePath) return null;
  
  const filePath = result.filePath;
  const fileName = path.basename(filePath);
  try {
    const extension = fileName.split('.').pop().toLowerCase();
    const content = extension === 'py' ? '# Custom Python script\n' : 'void setup() {\n}\nvoid loop() {\n}';
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { name: fileName, content, path: filePath };
  } catch (e) {
    console.error("Failed to create file:", e);
    return null;
  }
});

const { spawn } = require('child_process');

const findArduinoCLI = () => {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const platformFolder = isWin ? 'win32' : isMac ? 'darwin' : 'linux';
  const binaryName = isWin ? 'arduino-cli.exe' : 'arduino-cli';

  // 1. If app is packaged (production), look in packed extraResources
  if (app.isPackaged) {
    const bundledPath = path.join(process.resourcesPath, 'bin', platformFolder, binaryName);
    if (fs.existsSync(bundledPath)) {
      return bundledPath;
    }
  }

  // 2. If in development, look in workspace resources/bin
  const devBundledPath = path.join(__dirname, '..', 'resources', 'bin', platformFolder, binaryName);
  if (fs.existsSync(devBundledPath)) {
    return devBundledPath;
  }

  // 3. Fallback candidates for Linux / macOS
  if (!isWin) {
    const unixCandidates = [
      '/usr/local/bin/arduino-cli',
      '/usr/bin/arduino-cli',
      path.join(process.env.HOME || '', '.local', 'bin', 'arduino-cli'),
      'arduino-cli'
    ];
    for (const p of unixCandidates) {
      try {
        if (p !== 'arduino-cli' && fs.existsSync(p)) {
          return p;
        }
      } catch (_) {}
    }
    return 'arduino-cli';
  }

  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
  const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const userProfile = process.env.USERPROFILE || '';

  // Windows Fallback candidates
  const candidates = [
    path.join(localAppData, 'Arduino15', 'arduino-cli.exe'),
    path.join(programFiles, 'Arduino CLI', 'arduino-cli.exe'),
    path.join(programFilesX86, 'Arduino CLI', 'arduino-cli.exe'),
    path.join(userProfile, 'scoop', 'shims', 'arduino-cli.exe'),
    'C:\\ProgramData\\chocolatey\\bin\\arduino-cli.exe',
    'arduino-cli',
  ];

  for (const p of candidates) {
    try {
      if (p !== 'arduino-cli' && fs.existsSync(p)) {
        return p;
      }
    } catch (_) {}
  }
  return 'arduino-cli';
};

// Validate that an arduino-cli path is actually a working standalone executable
// Cache results for 10 minutes to avoid redundant validations on every upload/port scan
let _cliValidationCache = { path: null, result: false, ts: 0 };
const validateArduinoCLI = (cliPath, event) => {
  const now = Date.now();
  // Return cached result if same path and not expired (10 minutes)
  if (_cliValidationCache.path === cliPath && _cliValidationCache.result && (now - _cliValidationCache.ts) < 600000) {
    return Promise.resolve(_cliValidationCache.result);
  }
  // Quick filesystem existence check for binary files
  if (cliPath !== 'arduino-cli' && fs.existsSync(cliPath)) {
    _cliValidationCache = { path: cliPath, result: true, ts: now };
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    execFile(cliPath, ['version'], { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('[RoboLab] Validation failed for:', cliPath, 'Error:', error.message);
        if (event) {
          safeSend(event, 'arduino-log', { text: `Validation system error: ${error.message}`, type: 'error' });
          if (stderr) {
            safeSend(event, 'arduino-log', { text: `Validation stderr output: ${stderr.toString()}`, type: 'error' });
          }
        }
        _cliValidationCache = { path: cliPath, result: false, ts: Date.now() };
        resolve(false);
      } else {
        _cliValidationCache = { path: cliPath, result: true, ts: Date.now() };
        resolve(true);
      }
    });
  });
};

// Safe sender: never calls send() on a destroyed WebContents (prevents exit code 134 crash)
const safeSend = (event, channel, data) => {
  try {
    if (event && event.sender && !event.sender.isDestroyed()) {
      event.sender.send(channel, data);
    }
  } catch (e) {
    console.error('[RoboLab] safeSend error:', e.message);
  }
};

let lastCLISterr = '';

const purgeBuildDirs = () => {
  try {
    const tmp = os.tmpdir();
    const files = fs.readdirSync(tmp);
    files.forEach(f => {
      if (f.startsWith('RoboLabBuild_')) {
        try {
          fs.rmSync(path.join(tmp, f), { recursive: true, force: true });
        } catch (_) {}
      }
    });
  } catch (_) {}
};
// --- Per-Account Library Scoping & Scanning Helpers ---
const getUserLibraryDir = (userId) => {
  const safeId = (userId && typeof userId === 'string' && userId.trim())
    ? userId.trim().replace(/[^a-zA-Z0-9_\-]/g, '_')
    : 'guest';
  try {
    const base = app.getPath('userData');
    const userLibDir = path.join(base, 'users', safeId, 'libraries');
    if (!fs.existsSync(userLibDir)) {
      fs.mkdirSync(userLibDir, { recursive: true });
    }
    return userLibDir;
  } catch (err) {
    console.warn('[RoboLab] Failed to resolve user library dir:', err.message);
    const fallback = path.join(os.tmpdir(), 'robolab_users', safeId, 'libraries');
    if (!fs.existsSync(fallback)) {
      try { fs.mkdirSync(fallback, { recursive: true }); } catch (_) {}
    }
    return fallback;
  }
};

const getGlobalLibraryDirs = () => {
  const dirs = [];
  try {
    const docs = app.getPath('documents');
    const d1 = path.join(docs, 'Arduino', 'libraries');
    if (fs.existsSync(d1)) dirs.push(d1);
  } catch (_) {}
  try {
    const d2 = path.join(os.homedir(), 'Documents', 'Arduino', 'libraries');
    if (fs.existsSync(d2) && !dirs.includes(d2)) dirs.push(d2);
  } catch (_) {}
  try {
    const localAppData = process.env.LOCALAPPDATA || '';
    if (localAppData) {
      const d3 = path.join(localAppData, 'Arduino15', 'libraries');
      if (fs.existsSync(d3) && !dirs.includes(d3)) dirs.push(d3);
    }
  } catch (_) {}
  return dirs;
};

// --- Arduino Library Parser: Extract headers, classes, #define pins & constants, and methods ---
const parseArduinoLibrary = (libPath, libName) => {
  const result = {
    name: libName,
    mainHeader: null,
    headers: [],    // Array<string> of all header basenames
    className: null,
    classes: [],    // Array<string> of all detected classes
    pins: [],       // Array<{ name: string, value: string, isPin: boolean }>
    constants: [],  // Array<{ name: string, value: string, isPin: boolean }>
    methods: [],    // Array<{ name: string, returnType: string, params: string[] }>
    constructors: []
  };
  if (!libPath || !fs.existsSync(libPath)) return result;

  try {
    const headerFiles = [];
    const findHeaders = (dir, depth = 0) => {
      if (depth > 4) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            if (ent.name !== 'examples' && ent.name !== 'Examples' && ent.name !== '.git') {
              findHeaders(path.join(dir, ent.name), depth + 1);
            }
          } else if (ent.isFile() && (ent.name.endsWith('.h') || ent.name.endsWith('.hpp'))) {
            headerFiles.push(path.join(dir, ent.name));
          }
        }
      } catch (_) {}
    };
    findHeaders(libPath);

    result.headers = Array.from(new Set(headerFiles.map(h => path.basename(h))));

    // 1. Parse keywords.txt if present
    const keywordsPath = path.join(libPath, 'keywords.txt');
    if (fs.existsSync(keywordsPath)) {
      try {
        const kwLines = fs.readFileSync(keywordsPath, 'utf8').split(/\r?\n/);
        for (const line of kwLines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            const kw = parts[0];
            const type = parts[1].toUpperCase();
            if (type === 'KEYWORD1') {
              if (!result.classes.includes(kw)) result.classes.push(kw);
              if (!result.className) result.className = kw;
            } else if (type === 'KEYWORD2') {
              if (!result.methods.some(m => m.name.toLowerCase() === kw.toLowerCase())) {
                const isGetter = /^(?:get|read|is|has|check|ping|analog|digital)/i.test(kw);
                result.methods.push({
                  name: kw,
                  returnType: isGetter ? 'Number' : 'void',
                  params: []
                });
              }
            } else if (type === 'LITERAL1' || type === 'LITERAL2') {
              const isPin = /(?:pin|trig|echo|sda|scl|cs|rst|irq|led|rx|tx|btn|button|relay|buzzer)/i.test(kw);
              if (isPin) {
                if (!result.pins.some(p => p.name === kw)) {
                  result.pins.push({ name: kw, value: '2', isPin: true });
                }
              } else {
                if (!result.constants.some(c => c.name === kw)) {
                  result.constants.push({ name: kw, value: '0', isPin: false });
                }
              }
            }
          }
        }
      } catch (_) {}
    }

    // 2. Parse C++ header files
    const pinKeywordsRegex = /(?:pin|trig|echo|sda|scl|cs|ss|rst|reset|irq|led|rx|tx|btn|button|relay|buzzer|sensor|pot|adc|servo)/i;

    for (const hFile of headerFiles) {
      try {
        let content = fs.readFileSync(hFile, 'utf8');
        content = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '');

        // #define
        const defRegex = /#define\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+([^\r\n]+)/g;
        let dm;
        const fileNameBase = path.basename(hFile, path.extname(hFile)).toUpperCase();
        while ((dm = defRegex.exec(content)) !== null) {
          const dName = dm[1].trim();
          const dVal = dm[2].trim().replace(/^\(|\)$/g, '');
          if (dName.toUpperCase() === `_${fileNameBase}_H_` || dName.toUpperCase() === `${fileNameBase}_H` || dName.toUpperCase() === `_${fileNameBase}_H`) continue;
          if (dName.endsWith('_H') && (!dVal || dVal === '1')) continue;
          if (dVal.startsWith('(') && dVal.includes(')')) continue;

          const isPin = pinKeywordsRegex.test(dName) || /^(?:[AD]?\d+)$/.test(dVal);
          if (isPin) {
            if (!result.pins.some(p => p.name === dName)) {
              result.pins.push({ name: dName, value: dVal || '2', isPin: true });
            }
          } else if (dVal && !dVal.includes('(')) {
            if (!result.constants.some(c => c.name === dName)) {
              result.constants.push({ name: dName, value: dVal, isPin: false });
            }
          }
        }

        // Classes & public methods
        const classRegex = /class\s+([a-zA-Z0-9_]+)\s*(?::\s*public\s+[a-zA-Z0-9_]+)?\s*\{([\s\S]*?)\};/g;
        let cm;
        while ((cm = classRegex.exec(content)) !== null) {
          const clsName = cm[1];
          if (!result.classes.includes(clsName)) result.classes.push(clsName);
          if (!result.className) result.className = clsName;
          const classBody = cm[2];

          const publicSections = classBody.split(/\bpublic\s*:/i).slice(1);
          for (const pub of publicSections) {
            const cleanPub = pub.split(/\b(?:private|protected)\s*:/i)[0];

            // Constructors
            const ctorRegex = new RegExp(`\\b${clsName}\\s*\\(([^)]*)\\)`, 'g');
            let ctm;
            while ((ctm = ctorRegex.exec(cleanPub)) !== null) {
              const cParams = ctm[1].split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean);
              if (!result.constructors.some(c => c.params.join(',') === cParams.join(','))) {
                result.constructors.push({ params: cParams });
              }
            }

            // Method declarations
            const methodRegex = /\b(?:void|int|float|double|bool|boolean|uint8_t|uint16_t|uint32_t|int16_t|int32_t|long|unsigned\s+long|size_t|String|char\s*\*?)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g;
            let mm;
            while ((mm = methodRegex.exec(cleanPub)) !== null) {
              const mName = mm[1];
              const mParams = mm[2].split(',').map(p => p.trim().split(/\s+/).pop()).filter(Boolean);
              if (mName.startsWith('_') || mName.startsWith('operator') || mName === clsName) continue;

              const existingIdx = result.methods.findIndex(m => m.name.toLowerCase() === mName.toLowerCase());
              const returnType = /\b(?:void)\b/.test(mm[0]) ? 'void' : (/\b(?:bool|boolean)\b/.test(mm[0]) ? 'Boolean' : 'Number');
              if (existingIdx >= 0) {
                if (result.methods[existingIdx].params.length === 0 && mParams.length > 0) {
                  result.methods[existingIdx].params = mParams;
                  result.methods[existingIdx].returnType = returnType;
                }
              } else {
                result.methods.push({ name: mName, returnType, params: mParams });
              }
            }
          }
        }
      } catch (_) {}
    }

    // 3. Intelligent mainHeader selection
    if (headerFiles.length > 0) {
      const cleanLib = libName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const strippedLib = cleanLib.replace(/^(?:arduino|rfid|adafruit|sparkfun|dfrobot|sensor|lib|esp32|esp8266)+/i, '');

      let bestHeader = headerFiles[0];
      let bestScore = -999;

      for (const h of headerFiles) {
        const base = path.basename(h, path.extname(h));
        const cleanBase = base.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let score = 0;

        if (cleanBase === cleanLib) score += 100;
        else if (strippedLib && cleanBase === strippedLib) score += 90;
        else if (cleanLib.includes(cleanBase) && cleanBase.length >= 4) score += 50;
        else if (strippedLib && cleanBase.includes(strippedLib)) score += 40;

        if (result.className) {
          const cleanCls = result.className.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (cleanBase === cleanCls) score += 80;
          else if (cleanBase.includes(cleanCls) || cleanCls.includes(cleanBase)) score += 30;
        }

        // Penalize auxiliary/internal headers
        if (/(?:constants|debug|driver|config|defs|internal|helper|types|require|util|pin)/i.test(base)) {
          score -= 35;
        }

        if (score > bestScore) {
          bestScore = score;
          bestHeader = h;
        }
      }

      result.mainHeader = path.basename(bestHeader);
    }

    if (!result.className) {
      if (result.classes.length > 0) {
        result.className = result.classes[0];
      } else {
        result.className = libName;
      }
    }
  } catch (_) {}

  return result;
};


const scanLibraryExamples = (libPath, libName, parsedApi = null) => {
  const examples = [];
  if (!libPath || !fs.existsSync(libPath)) return examples;

  const candidateDirNames = ['examples', 'Examples', 'example'];
  let exampleDir = null;
  for (const c of candidateDirNames) {
    const p = path.join(libPath, c);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      exampleDir = p;
      break;
    }
  }

  if (exampleDir) {
    const findInoFiles = (dir, depth = 0) => {
      if (depth > 3) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
          const fullPath = path.join(dir, ent.name);
          if (ent.isDirectory()) {
            findInoFiles(fullPath, depth + 1);
          } else if (ent.isFile() && (ent.name.endsWith('.ino') || ent.name.endsWith('.pde') || ent.name.endsWith('.cpp'))) {
            try {
              const code = fs.readFileSync(fullPath, 'utf8');
              const baseName = path.basename(ent.name, path.extname(ent.name));
              const parentDir = path.basename(dir);
              const titleName = (parentDir && parentDir !== 'examples' && parentDir !== 'Examples')
                ? `${libName} - ${parentDir}`
                : `${libName} - ${baseName}`;

              let desc = `Contoh program ${titleName} dari library ${libName}.`;
              const commentMatch = code.match(/^\/\*([\s\S]*?)\*\//) || code.match(/^\/\/\s*([^\r\n]+)/);
              if (commentMatch && commentMatch[1]) {
                const cleaned = commentMatch[1].replace(/\*+/g, '').trim().split('\n')[0].trim();
                if (cleaned.length > 5 && cleaned.length < 120) {
                  desc = cleaned;
                }
              }

              const isEsp32 = /WiFi\.h|esp_wifi|esp32|ESP32|freertos/i.test(code);
              const board = isEsp32 ? 'ESP32 DevKit V1' : 'Arduino Uno';

              examples.push({
                name: titleName,
                fileName: ent.name,
                library: libName,
                board: board,
                description: desc,
                code: code,
                path: fullPath,
                parsedApi: parsedApi
              });
            } catch (_) {}
          }
        }
      } catch (_) {}
    };

    findInoFiles(exampleDir);
  }

  // If no examples were found on disk, generate a starter example sketch from parsedApi
  if (examples.length === 0 && parsedApi) {
    const mainHeader = parsedApi.mainHeader || (parsedApi.name ? `${parsedApi.name}.h` : null);
    const clsName = parsedApi.className || parsedApi.name || 'MySensor';
    const varName = clsName ? clsName.charAt(0).toLowerCase() + clsName.slice(1) : 'mySensor';

    let pinDefs = '';
    let pinInits = '';
    if (Array.isArray(parsedApi.pins) && parsedApi.pins.length > 0) {
      pinDefs = parsedApi.pins.slice(0, 3).map(p => `#define ${p.name} ${p.value || '2'}`).join('\n') + '\n';
      pinInits = parsedApi.pins.slice(0, 3).map(p => `  pinMode(${p.name}, OUTPUT);`).join('\n') + '\n';
    }

    let methodCalls = '';
    if (Array.isArray(parsedApi.methods) && parsedApi.methods.length > 0) {
      const demoMethods = parsedApi.methods.slice(0, 3);
      methodCalls = demoMethods.map(m => {
        if (m.returnType === 'void') {
          return `  ${varName}.${m.name}();`;
        } else {
          return `  Serial.print("${m.name}: ");\n  Serial.println(${varName}.${m.name}());`;
        }
      }).join('\n');
    } else {
      methodCalls = `  Serial.println("Running ${libName}...");`;
    }

    const starterCode = `// Program Contoh: ${libName} Starter
${mainHeader ? `#include <${mainHeader}>` : `// #include <${libName}.h>`}

${pinDefs}
${clsName} ${varName};

void setup() {
  Serial.begin(9600);
${pinInits}  Serial.println("${libName} diinisialisasi!");
}

void loop() {
${methodCalls}
  delay(1000);
}`;

    examples.push({
      name: `${libName} - Starter Demo`,
      fileName: 'StarterDemo.ino',
      library: libName,
      board: 'Arduino Uno',
      description: `Program contoh starter otomatis untuk library ${libName}.`,
      code: starterCode,
      path: null
    });
  }

  return examples;
};

const scanLibrariesInFolder = (folderPath, isCustom = false, userId = null) => {
  const list = [];
  if (!folderPath || !fs.existsSync(folderPath)) return list;
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const libPath = path.join(folderPath, ent.name);
      let name = ent.name;
      let version = '1.0.0';
      let author = isCustom ? 'Akun Pengguna' : 'Community';
      let desc = isCustom ? 'Library terpasang di akun Anda' : 'Arduino Library';
      const headers = [];

      const propFile = path.join(libPath, 'library.properties');
      if (fs.existsSync(propFile)) {
        try {
          const lines = fs.readFileSync(propFile, 'utf-8').split(/\r?\n/);
          for (const line of lines) {
            const idx = line.indexOf('=');
            if (idx > 0) {
              const k = line.slice(0, idx).trim();
              const v = line.slice(idx + 1).trim();
              if (k === 'name' && v) name = v;
              else if (k === 'version' && v) version = v;
              else if (k === 'author' && v) author = v;
              else if (k === 'sentence' && v) desc = v;
            }
          }
        } catch (_) {}
      }

      try {
        const rootFiles = fs.readdirSync(libPath);
        for (const f of rootFiles) {
          if (f.endsWith('.h')) headers.push(f);
        }
        const srcPath = path.join(libPath, 'src');
        if (fs.existsSync(srcPath) && fs.statSync(srcPath).isDirectory()) {
          const srcFiles = fs.readdirSync(srcPath);
          for (const f of srcFiles) {
            if (f.endsWith('.h') && !headers.includes(f)) headers.push(f);
          }
        }
      } catch (_) {}

      const parsedApi = parseArduinoLibrary(libPath, name);
      const examples = scanLibraryExamples(libPath, name, parsedApi);

      list.push({
        name,
        folderName: ent.name,
        version,
        author,
        desc,
        path: libPath,
        headers,
        parsedApi,
        examples,
        isCustom,
        userId: userId || null,
        installed: true
      });
    }
  } catch (e) {
    console.warn(`[RoboLab] Error scanning libraries in ${folderPath}:`, e.message);
  }
  return list;
};


const runArduinoCLI = (args, event, timeoutMs) => {
  return new Promise((resolve) => {
    let resolved = false;
    let stderrBuffer = '';
    let stdoutBuffer = '';
    let stdoutLineBuf = '';
    let stderrLineBuf = '';

    const done = (val) => {
      if (!resolved) {
        resolved = true;
        lastCLISterr = stderrBuffer;
        resolve(val);
      }
    };

    try {
      const cliPath = findArduinoCLI();
      safeSend(event, 'arduino-log', { text: `Using arduino-cli at: ${cliPath}`, type: 'info' });
      safeSend(event, 'arduino-log', { text: `Running: ${path.basename(cliPath)} ${args.join(' ')}`, type: 'info' });

      if (!fs.existsSync(cliPath) && cliPath !== 'arduino-cli') {
        safeSend(event, 'arduino-log', { text: `arduino-cli not found at: ${cliPath}`, type: 'error' });
        done(false);
        return;
      }

      const isCompile = args[0] === 'compile';
      const isUpload  = args[0] === 'upload';
      // 10 minutes (600,000ms) for compilation to allow large ESP32 sketches to build completely.
      // 3 minutes (180,000ms) for upload. No artificial mid-way force kills.
      const maxMs = timeoutMs || (isUpload ? 180000 : 600000);

      let completionTimer = null;

      const triggerSuccess = (source) => {
        if (resolved) return;
        if (completionTimer) { clearTimeout(completionTimer); completionTimer = null; }
        safeSend(event, 'arduino-log', { text: `✅ Done: ${source}`, type: 'success' });
        done(true);
      };

      const triggerFailure = (source) => {
        if (resolved) return;
        if (completionTimer) { clearTimeout(completionTimer); completionTimer = null; }
        try { if (childProc) childProc.kill(); } catch (_) {}
        done(false);
      };

      const processLine = (line) => {
        if (!line.trim() || resolved) return;

        // Detect GCC out-of-memory (cc1plus.exe: out of memory allocating N bytes)
        if (/cc1plus\.exe.*out of memory/i.test(line) || /out of memory allocating/i.test(line)) {
          safeSend(event, 'arduino-log', { text: line, type: 'error' });
          safeSend(event, 'arduino-log', { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' });
          safeSend(event, 'arduino-log', { text: '🚨 GCC kehabisan RAM (cc1plus.exe OOM)', type: 'error' });
          safeSend(event, 'arduino-log', { text: '💡 Solusi: Tutup aplikasi lain sebelum compile:', type: 'info' });
          safeSend(event, 'arduino-log', { text: '   1. Tutup KidsBlock Desktop jika sedang terbuka', type: 'info' });
          safeSend(event, 'arduino-log', { text: '   2. Tutup browser, game, atau aplikasi berat lainnya', type: 'info' });
          safeSend(event, 'arduino-log', { text: '   3. Restart komputer jika masalah berlanjut', type: 'info' });
          safeSend(event, 'arduino-log', { text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', type: 'error' });
          return;
        }

        // Detect Go runtime thread OOM (errno=1455 ERROR_COMMITMENT_LIMIT)
        if (/failed to create new OS thread|runtime\.newosproc/i.test(line)) {
          safeSend(event, 'arduino-log', { text: '🚨 Windows kehabisan thread (errno=1455). Tutup KidsBlock Desktop dan restart RoboLab.', type: 'error' });
          return;
        }

        const isRealError = /^.*error:.+/i.test(line) &&
                            !/\d+%|uploading|writing|reading|erasing|bytes/i.test(line) &&
                            !/warning:/i.test(line);
        safeSend(event, 'arduino-log', { text: line, type: isRealError ? 'error' : 'stdout' });

        if (isCompile) {
          // Log output lines to UI; process completes naturally when childProc exits with code 0.
        }

        if (isUpload) {
          if (/Hard resetting|Leaving\.\.\./i.test(line)) {
            triggerSuccess('upload: esptool done');
          }
          if (/Failed to connect|No serial data|A fatal esptool\.py error occurred|Cannot configure port/i.test(line)) {
            if (completionTimer) clearTimeout(completionTimer);
            completionTimer = setTimeout(() => triggerFailure('upload error'), 2000);
          }
        }
      };

      // Global safety timeout
      const globalTimeout = setTimeout(() => {
        safeSend(event, 'arduino-log', { text: `⚠️ Timeout setelah ${maxMs / 1000}s. Klik Upload lagi.`, type: 'error' });
        try { if (childProc) childProc.kill('SIGKILL'); } catch (_) {}
        done(false);
      }, maxMs);

      const onDestroyed = () => {
        clearTimeout(globalTimeout);
        if (completionTimer) clearTimeout(completionTimer);
        try { if (childProc) childProc.kill('SIGKILL'); } catch (_) {}
        done(false);
      };
      if (event && event.sender) event.sender.once('destroyed', onDestroyed);

      const { spawn } = require('child_process');
      // Inactivity watchdog timestamp — must be declared before childProc stdout/stderr listeners
      let lastActivityTs = Date.now();

      const cliEnv = {
        ...process.env,
      };
      try {
        const fqbnIdx = args.indexOf('--fqbn');
        const fqbnArg = fqbnIdx !== -1 && args[fqbnIdx + 1] ? args[fqbnIdx + 1] : '';
        const vendor = (fqbnArg || '').split(':')[0] || '';
        const localAppData = process.env.LOCALAPPDATA || '';
        const candidateDataDirs = [
          localAppData ? path.join(localAppData, 'Arduino15') : '',
          path.join(__dirname, '..', 'resources', 'arduino-data'),
          'C:\\KidsBlock Desktop\\resources\\tools\\Arduino',
        ].filter(Boolean);
        for (const d of candidateDataDirs) {
          if (vendor && fs.existsSync(path.join(d, 'packages', vendor, 'hardware'))) {
            cliEnv.ARDUINO_DIRECTORIES_DATA = d;
            cliEnv.ARDUINO_DIRECTORIES_DOWNLOADS = path.join(d, 'staging');
            break;
          }
        }
      } catch (_) {}

      const childProc = spawn(cliPath, args, { windowsHide: true, env: cliEnv });

      if (childProc.stdout) {
        childProc.stdout.on('data', (data) => {
          lastActivityTs = Date.now();
          const text = data.toString();
          stdoutBuffer += text;
          stdoutLineBuf += text;
          const lines = stdoutLineBuf.split(/\r?\n/);
          stdoutLineBuf = lines.pop() || '';
          lines.forEach(processLine);
        });
      }

      if (childProc.stderr) {
        childProc.stderr.on('data', (data) => {
          lastActivityTs = Date.now();
          const text = data.toString();
          stderrBuffer += text;
          stderrLineBuf += text;
          const lines = stderrLineBuf.split(/\r?\n/);
          stderrLineBuf = lines.pop() || '';
          lines.forEach(processLine);
        });
      }

      // Non-blocking compilation heartbeat — logs progress without killing the process
      let heartbeatTimer = null;
      if (isCompile) {
        heartbeatTimer = setInterval(() => {
          if (resolved) { clearInterval(heartbeatTimer); return; }
          const idle = Math.round((Date.now() - lastActivityTs) / 1000);
          if (idle > 10) {
            safeSend(event, 'arduino-log', { text: `⏳ Memproses kompilasi berkas... (${idle}s)`, type: 'info' });
          }
        }, 15000);
      }
      let hb = heartbeatTimer;

      const handleExitOrClose = (code) => {
        clearTimeout(globalTimeout);
        if (completionTimer) clearTimeout(completionTimer);
        if (hb) clearInterval(hb);
        try { if (event && event.sender) event.sender.removeListener('destroyed', onDestroyed); } catch (_) {}

        if (stdoutLineBuf.trim()) processLine(stdoutLineBuf);
        if (stderrLineBuf.trim()) processLine(stderrLineBuf);

        if (!resolved) {
          const combinedOut = `${stdoutBuffer}\n${stderrBuffer}`;
          const hasFatalUploadErr = isUpload && /A fatal esptool\.py error occurred|A fatal error occurred|Cannot configure port|Failed to connect to ESP|Timed out waiting for packet/i.test(combinedOut);
          const success = code === 0 && !hasFatalUploadErr;
          if (success) {
            safeSend(event, 'arduino-log', { text: '✅ Kompilasi/Proses selesai dengan sukses!', type: 'success' });
          } else {
            safeSend(event, 'arduino-log', { text: `❌ Kompilasi/Proses gagal dengan kode keluar ${code}`, type: 'error' });
          }
          done(success);
        }
      };

      childProc.on('exit', handleExitOrClose);
      childProc.on('close', handleExitOrClose);

      childProc.on('error', (err) => {
        clearTimeout(globalTimeout);
        if (completionTimer) clearTimeout(completionTimer);
        if (hb) clearInterval(hb);
        try { if (event && event.sender) event.sender.removeListener('destroyed', onDestroyed); } catch (_) {}
        safeSend(event, 'arduino-log', { text: `Execution error: ${err.message}`, type: 'error' });
        done(false);
      });

    } catch (err) {
      console.error('[RoboLab] runArduinoCLI unexpected error:', err);
      safeSend(event, 'arduino-log', { text: `Unexpected error: ${err.message}`, type: 'error' });
      done(false);
    }
  });
};
// Global cache for compiled sketches code hash — persisted to disk to survive app restarts
const _hashCachePath = path.join(os.tmpdir(), 'RoboLabHashCache.json');
let lastCompiledHashes = {};
try {
  if (fs.existsSync(_hashCachePath)) {
    lastCompiledHashes = JSON.parse(fs.readFileSync(_hashCachePath, 'utf-8'));
    console.log('[RoboLab] Loaded compile hash cache from disk:', Object.keys(lastCompiledHashes));
  }
} catch (_) { lastCompiledHashes = {}; }

ipcMain.handle('arduino-upload', async (event, payload = {}) => {
  const { code = '', board = '', port = '', action = 'upload', fileExt = 'ino', files = {}, userId = null } = (payload || {});

  try {
    // Release COM port from Serial Monitor if active
    if (activeSerialProcess) {
      safeSend(event, 'arduino-log', { text: '🔌 Menutup Serial Monitor untuk membebaskan port COM...', type: 'info' });
      try { activeSerialProcess.kill(); } catch (_) {}
      activeSerialProcess = null;
      await new Promise(r => setTimeout(r, 600));
    }

    safeSend(event, 'arduino-log', { text: `Starting ${action} process for ${board}...`, type: 'info' });

    if (board === 'BBC micro:bit') {
      const tempDir = path.join(os.tmpdir(), 'RoboLabSketch');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const pyPath = path.join(tempDir, 'main.py');
      fs.writeFileSync(pyPath, code, 'utf-8');

      if (action === 'verify') {
        safeSend(event, 'arduino-log', { text: 'Memeriksa sintaks kode Python untuk micro:bit...', type: 'info' });
        return new Promise((resolve) => {
          const child = spawn('python', ['-m', 'py_compile', pyPath]);
          let stderr = '';
          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });
          child.on('close', (code) => {
            if (code === 0) {
              safeSend(event, 'arduino-log', { text: 'Pemeriksaan sintaks berhasil!', type: 'success' });
              resolve({ success: true });
            } else {
              safeSend(event, 'arduino-log', { text: `Pemeriksaan sintaks gagal:\n${stderr}`, type: 'error' });
              resolve({ success: false, error: 'Syntax check failed' });
            }
          });
          child.on('error', (err) => {
            safeSend(event, 'arduino-log', { text: `Gagal menjalankan python: ${err.message}`, type: 'error' });
            resolve({ success: false, error: err.message });
          });
        });
      }

      // Action is 'upload'
      safeSend(event, 'arduino-log', { text: 'Mengunggah kode ke BBC micro:bit menggunakan uflash...', type: 'info' });
      return new Promise((resolve) => {
        const child = spawn('python', ['-m', 'uflash', pyPath]);
        
        child.stdout.on('data', (data) => {
          data.toString().split(/\r?\n/).forEach(line => {
            if (line.trim()) safeSend(event, 'arduino-log', { text: line, type: 'stdout' });
          });
        });

        child.stderr.on('data', (data) => {
          data.toString().split(/\r?\n/).forEach(line => {
            if (line.trim()) safeSend(event, 'arduino-log', { text: line, type: 'error' });
          });
        });

        child.on('close', (code) => {
          if (code === 0) {
            safeSend(event, 'arduino-log', { text: 'Unggah berhasil ke BBC micro:bit!', type: 'success' });
            resolve({ success: true });
          } else {
            safeSend(event, 'arduino-log', { text: 'Unggah gagal! Pastikan micro:bit terhubung dan uflash terpasang (pip install uflash).', type: 'error' });
            resolve({ success: false, error: 'Upload failed' });
          }
        });

        child.on('error', (err) => {
          safeSend(event, 'arduino-log', { text: `Gagal menjalankan uflash: ${err.message}`, type: 'error' });
          resolve({ success: false, error: err.message });
        });
      });
    }

    if (board === 'ESP32 DevKit V1' && fileExt === 'py') {
      const { exec } = require('child_process');
      const tempDir = path.join(os.tmpdir(), 'RoboLabSketch');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      const pyPath = path.join(tempDir, 'main.py');
      if (action !== 'flash-firmware') {
        fs.writeFileSync(pyPath, code, 'utf-8');
      }

      if (action === 'flash-firmware') {
        const https = require('https');
        return new Promise((resolve) => {
          safeSend(event, 'arduino-log', { text: 'Menyiapkan modul esptool untuk instalasi firmware...', type: 'info' });
          exec('python -c "import esptool"', (err) => {
            const runFlash = () => {
              const fwUrl = 'https://micropython.org/resources/firmware/ESP32_GENERIC-20231005-v1.21.0.bin';
              const fwPath = path.join(os.tmpdir(), 'esp32_micropython.bin');
              safeSend(event, 'arduino-log', { text: 'Mengunduh firmware MicroPython v1.21.0...', type: 'info' });
              
              const file = fs.createWriteStream(fwPath);
              https.get(fwUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                  safeSend(event, 'arduino-log', { text: 'Unduhan selesai. Menghapus flash memory (Erase Flash)...', type: 'info' });
                  
                  const erase = spawn('python', ['-m', 'esptool', '--chip', 'esp32', '--port', port, 'erase_flash']);
                  let eraseLog = '';
                  erase.stdout.on('data', d => { eraseLog += d.toString(); });
                  erase.stderr.on('data', d => { eraseLog += d.toString(); });

                  erase.on('close', (eCode) => {
                    if (eCode !== 0) {
                      safeSend(event, 'arduino-log', { text: `Erase flash gagal:\n${eraseLog}`, type: 'error' });
                      return resolve({ success: false, error: 'Erase flash failed' });
                    }

                    safeSend(event, 'arduino-log', { text: 'Erase flash berhasil. Memulai proses flashing firmware MicroPython...', type: 'info' });
                    const flash = spawn('python', ['-m', 'esptool', '--chip', 'esp32', '--port', port, '--baud', '460800', 'write_flash', '-z', '0x1000', fwPath]);
                    let flashLog = '';
                    flash.stdout.on('data', d => { flashLog += d.toString(); });
                    flash.stderr.on('data', d => { flashLog += d.toString(); });
                    
                    flash.on('close', (fCode) => {
                      if (fCode === 0) {
                        safeSend(event, 'arduino-log', { text: 'Flashing MicroPython berhasil!', type: 'success' });
                        resolve({ success: true });
                      } else {
                        safeSend(event, 'arduino-log', { text: `Flashing gagal:\n${flashLog}`, type: 'error' });
                        resolve({ success: false, error: 'Flash failed' });
                      }
                    });
                  });
                });
              }).on('error', (err) => {
                fs.unlink(fwPath, () => {});
                safeSend(event, 'arduino-log', { text: `Gagal mengunduh firmware: ${err.message}`, type: 'error' });
                resolve({ success: false, error: err.message });
              });
            };

            if (err) {
              safeSend(event, 'arduino-log', { text: 'Menginstal esptool via pip...', type: 'info' });
              exec('python -m pip install esptool', (installErr, stdout, stderr) => {
                if (installErr) {
                  safeSend(event, 'arduino-log', { text: `Gagal menginstal esptool:\n${stderr}`, type: 'error' });
                  resolve({ success: false, error: 'Failed to install esptool' });
                } else {
                  runFlash();
                }
              });
            } else {
              runFlash();
            }
          });
        });
      }

      if (action === 'verify') {
        safeSend(event, 'arduino-log', { text: 'Memeriksa sintaks kode MicroPython...', type: 'info' });
        return new Promise((resolve) => {
          const child = spawn('python', ['-m', 'py_compile', pyPath]);
          let stderr = '';
          child.stderr.on('data', (data) => { stderr += data.toString(); });
          child.on('close', (code) => {
            if (code === 0) {
              safeSend(event, 'arduino-log', { text: 'Pemeriksaan sintaks berhasil!', type: 'success' });
              resolve({ success: true });
            } else {
              safeSend(event, 'arduino-log', { text: `Pemeriksaan sintaks gagal:\n${stderr}`, type: 'error' });
              resolve({ success: false, error: 'Syntax check failed' });
            }
          });
          child.on('error', (err) => {
            safeSend(event, 'arduino-log', { text: `Gagal menjalankan python: ${err.message}`, type: 'error' });
            resolve({ success: false, error: err.message });
          });
        });
      }

      // Action is 'upload'
      return new Promise((resolve) => {
        safeSend(event, 'arduino-log', { text: 'Menyiapkan mpremote untuk upload MicroPython ke ESP32...', type: 'info' });
        
        const utf8Env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };
        exec('python -c "import mpremote"', { env: utf8Env }, (err) => {
          const runUpload = () => {
            safeSend(event, 'arduino-log', { text: `Mengunggah skrip ke ESP32 di port ${port}...`, type: 'info' });
            const child = spawn('python', ['-m', 'mpremote', 'connect', port, 'fs', 'cp', pyPath, ':main.py'], { env: utf8Env });
            let outLog = '';
            child.stdout.on('data', (d) => { outLog += d.toString('utf8'); });
            child.stderr.on('data', (d) => { outLog += d.toString('utf8'); });
            
            child.on('close', (code) => {
              if (code === 0) {
                safeSend(event, 'arduino-log', { text: 'Unggah file berhasil! Melakukan soft-reset ESP32...', type: 'success' });
                // Soft reset to run the new main.py
                spawn('python', ['-m', 'mpremote', 'connect', port, 'soft-reset'], { env: utf8Env });
                resolve({ success: true });
              } else {
                safeSend(event, 'arduino-log', { text: `Unggah gagal (Pastikan ESP32 sudah di-flash firmware MicroPython).\nOutput:\n${outLog}`, type: 'error' });
                resolve({ success: false, error: 'Upload failed' });
              }
            });
            child.on('error', (err) => {
               safeSend(event, 'arduino-log', { text: `Gagal menjalankan mpremote: ${err.message}`, type: 'error' });
               resolve({ success: false, error: err.message });
            });
          };

          if (err) {
            safeSend(event, 'arduino-log', { text: 'Modul mpremote belum terinstal. Menginstal via pip...', type: 'info' });
            exec('python -m pip install mpremote', (installErr, stdout, stderr) => {
              if (installErr) {
                safeSend(event, 'arduino-log', { text: `Gagal menginstal mpremote:\n${stderr}`, type: 'error' });
                resolve({ success: false, error: 'Failed to install mpremote' });
              } else {
                runUpload();
              }
            });
          } else {
            runUpload();
          }
        });
      });
    }

    // Validate arduino-cli is available and working before proceeding
    const cliPathCheck = findArduinoCLI();
    safeSend(event, 'arduino-log', { text: `Checking arduino-cli at: ${cliPathCheck}`, type: 'info' });
    const cliValid = await validateArduinoCLI(cliPathCheck, event);
    if (!cliValid) {
      safeSend(event, 'arduino-log', { text: '❌ arduino-cli tidak ditemukan atau tidak bisa dijalankan!', type: 'error' });
      safeSend(event, 'arduino-log', { text: 'Download arduino-cli standalone dari: https://arduino.github.io/arduino-cli/latest/installation/', type: 'error' });
      safeSend(event, 'arduino-log', { text: 'Atau install ke: C:\\Program Files\\Arduino CLI\\arduino-cli.exe', type: 'error' });
      return { success: false, error: 'arduino-cli not found' };
    }
    safeSend(event, 'arduino-log', { text: `✅ arduino-cli ditemukan: ${cliPathCheck}`, type: 'info' });

    let fqbn = '';
    const bLower = (board || '').toLowerCase();
    if (board.includes(':')) {
      // User passed raw FQBN string directly
      fqbn = board;
    } else if (board === 'Arduino Uno' || bLower.includes('uno')) {
      fqbn = 'arduino:avr:uno';
    } else if (board === 'Arduino Nano' || bLower.includes('nano')) {
      fqbn = 'arduino:avr:nano';
    } else if (board === 'Arduino Mega' || bLower.includes('mega')) {
      fqbn = 'arduino:avr:mega';
    } else if (board === 'ESP32 DevKit V1' || bLower.includes('esp32')) {
      fqbn = 'esp32:esp32:esp32:FlashMode=dio,PartitionScheme=huge_app';
    } else if (board.includes('ESP8266') || bLower.includes('nodemcu') || bLower.includes('esp8266') || bLower.includes('lolin') || bLower.includes('wemos')) {
      fqbn = 'esp8266:esp8266:nodemcuv2';
    } else if (bLower.includes('pico') || bLower.includes('rp2040')) {
      fqbn = 'rp2040:rp2040:rp2040';
    } else if (bLower.includes('stm32')) {
      fqbn = 'STMicroelectronics:stm32:Nucleo_64';
    } else if (bLower.includes('atmega128') || bLower.includes('atmega 128') || bLower.includes('megacore')) {
      fqbn = 'MegaCore:avr:128';
    } else {
      safeSend(event, 'arduino-log', { text: `Unsupported board: ${board}`, type: 'error' });
      return { success: false, error: 'Unsupported board' };
    }

    // Clean stale PyInstaller temporary folders (_MEI*) to prevent _ssl.pyd extraction errors
    try {
      const tmpItems = fs.readdirSync(os.tmpdir());
      tmpItems.forEach(item => {
        if (item.startsWith('_MEI')) {
          const p = path.join(os.tmpdir(), item);
          try { fs.rmSync(p, { recursive: true, force: true }); } catch (_) {}
        }
      });
    } catch (_) {}

    const tempDir = path.join(os.tmpdir(), 'RoboLabSketch');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Clear previous auxiliary files in tempDir so removed files don't linger
    try {
      const existingTempFiles = fs.readdirSync(tempDir);
      existingTempFiles.forEach(f => {
        if (f !== 'RoboLabSketch.ino') {
          const p = path.join(tempDir, f);
          if (fs.statSync(p).isFile()) fs.unlinkSync(p);
        }
      });
    } catch (e) {}

    const inoPath = path.join(tempDir, 'RoboLabSketch.ino');
    
    const projectFiles = files || (payload && payload.files) || {};
    let finalCode = code;

    // Fallback: If finalCode does not contain setup()/loop() (e.g. user selected secrets.h or TTS.cpp), find primary .ino sketch file
    if (!finalCode.includes('setup(') && !finalCode.includes('loop(')) {
      for (const [fname, fcontent] of Object.entries(projectFiles)) {
        if (fname.endsWith('.ino') && fcontent.includes('setup(')) {
          finalCode = fcontent;
          safeSend(event, 'arduino-log', { text: `⚙️ Otomatis memilih sketsa utama .ino: ${fname}`, type: 'info' });
          break;
        }
      }
    }

    // Fix for ESP32: Standard Servo.h is for AVR boards (Arduino Uno/Nano).
    // On ESP32, replace #include <Servo.h> with #include <ESP32Servo.h> automatically.
    if (board === 'ESP32 DevKit V1' || bLower.includes('esp32')) {
      if (finalCode.includes('<Servo.h>')) {
        safeSend(event, 'arduino-log', { text: '⚙️ Penyesuaian ESP32: Mengubah #include <Servo.h> menjadi #include <ESP32Servo.h>...', type: 'info' });
        finalCode = finalCode.replace(/#include\s*<Servo\.h>/g, '#include <ESP32Servo.h>');
      }
      // Fix for ESP32 Core 3.x BLECharacteristic::getValue() returning String
      if (/std::string\s+[a-zA-Z0-9_]+\s*=\s*.*->getValue\(\)/.test(finalCode)) {
        safeSend(event, 'arduino-log', { text: '⚙️ Penyesuaian ESP32 BLE: Penyesuaian tipe std::string ke String untuk ESP32 Core v3.x...', type: 'info' });
        finalCode = finalCode.replace(/std::string\s+([a-zA-Z0-9_]+)\s*=\s*([^;]+->getValue\(\));/g, 'String $1 = $2;');
        finalCode = finalCode.replace(/([a-zA-Z0-9_]+)\.empty\(\)/g, '($1.length() == 0)');
      }
      // Fix for ESP32 Core 3.x LEDC API breaking changes (ledcSetup / ledcAttachPin)
      if (finalCode.includes('ledcSetup') || finalCode.includes('ledcAttachPin')) {
        safeSend(event, 'arduino-log', { text: '⚙️ Penyesuaian ESP32 LEDC PWM: Menyediakan fungsi kompatibilitas ledcSetup & ledcAttachPin untuk ESP32 Core v3.x...', type: 'info' });
        const ledcCompatHeader = `#include <Arduino.h>
#if defined(ESP_ARDUINO_VERSION_MAJOR) && (ESP_ARDUINO_VERSION_MAJOR >= 3)
struct __LedcChannelConfig {
  uint32_t freq;
  uint8_t resolution;
};
static __LedcChannelConfig __ledc_channels[16];

static inline double ledcSetup(uint8_t channel, double freq, uint8_t resolution_bits) {
  if (channel < 16) {
    __ledc_channels[channel].freq = (uint32_t)freq;
    __ledc_channels[channel].resolution = resolution_bits;
  }
  return freq;
}

static inline void ledcAttachPin(uint8_t pin, uint8_t channel) {
  if (channel < 16) {
    uint32_t freq = __ledc_channels[channel].freq ? __ledc_channels[channel].freq : 5000;
    uint8_t res = __ledc_channels[channel].resolution ? __ledc_channels[channel].resolution : 8;
    ledcAttachChannel(pin, freq, res, channel);
  }
}
#endif
`;
        finalCode = ledcCompatHeader + finalCode;
      }
    }

    fs.writeFileSync(inoPath, finalCode, 'utf-8');

    // Write auxiliary .c, .h, .cpp, .hpp files from workspace files into tempDir
    // DO NOT copy secondary .ino files into tempDir to prevent duplicate setup()/loop() definition errors!
    const isESP8266 = board === 'NodeMCU / ESP8266' || (board || '').toLowerCase().includes('esp8266') || (board || '').toLowerCase().includes('nodemcu') || fqbn.includes('esp8266');
    let hashContent = finalCode;
    if (projectFiles && typeof projectFiles === 'object') {
      for (const [fname, fcontent] of Object.entries(projectFiles)) {
        const ext = path.extname(fname).toLowerCase();
        if (['.c', '.h', '.cpp', '.hpp'].includes(ext)) {
          const baseName = path.basename(fname);
          const targetPath = path.join(tempDir, baseName);
          let auxContent = fcontent || '';

          // Auto-inject missing Arduino.h & WiFi.h headers for standalone .cpp/.c files
          if (ext === '.cpp' || ext === '.c' || ext === '.h' || ext === '.hpp') {
            if (auxContent.includes('urlEncode')) {
              auxContent = auxContent
                .replace(/static\s+inline\s+String\s+urlEncode[\s\S]*?\n\}/g, '')
                .replace(/#include\s*<Arduino\.h>\s*String\s+urlEncode\s*\([^)]*\);\s*/g, '')
                .replace(/String\s+urlEncode\s*\([^)]*\);\s*/g, '');

              const hasUserImplementation = /String\s+urlEncode\s*\(/.test(auxContent);

              if (hasUserImplementation) {
                auxContent = '#include <Arduino.h>\nString urlEncode(String str);\n' + auxContent;
              } else {
                const urlEncodeHelper = `#include <Arduino.h>\nstatic inline String urlEncode(String str) {
  String encodedString = "";
  for (int i = 0; i < str.length(); i++) {
    char c = str.charAt(i);
    if (c == ' ') encodedString += '+';
    else if (isalnum(c)) encodedString += c;
    else {
      char code0 = (c & 0xf) + '0';
      if ((c & 0xf) > 9) code0 = (c & 0xf) - 10 + 'A';
      c = (c >> 4) & 0xf;
      char code1 = c + '0';
      if (c > 9) code1 = c - 10 + 'A';
      encodedString += '%';
      encodedString += code1;
      encodedString += code0;
    }
  }
  return encodedString;
}\n\n`;
                auxContent = urlEncodeHelper + auxContent;
              }
            }
            if (!auxContent.includes('<Arduino.h>')) {
              auxContent = '#include <Arduino.h>\n' + auxContent;
            }
            if ((auxContent.includes('WiFi') || auxContent.includes('WL_CONNECTED')) && !auxContent.includes('<WiFi.h>') && !auxContent.includes('<ESP8266WiFi.h>')) {
              const wifiHeader = isESP8266 ? '#include <ESP8266WiFi.h>\n' : '#include <WiFi.h>\n';
              auxContent = wifiHeader + auxContent;
            }
          }

          try {
            fs.writeFileSync(targetPath, auxContent, 'utf-8');
            hashContent += `\n// --- ${baseName} ---\n` + auxContent;
            console.log(`[RoboLab] Wrote auxiliary build file: ${baseName}`);
          } catch (err) {
            console.error(`[RoboLab] Failed to write aux file ${baseName}:`, err);
          }
        }
      }
    }

    // Use arduino-cli.yaml from Arduino15 so compile can find installed cores (arduino:avr, esp32:esp32)
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const configArgs = fs.existsSync(arduino15ConfigPath)
      ? ['--config-file', arduino15ConfigPath]
      : [];

    // Create persistent board-specific build directory to cache compiled objects
    const arch = (fqbn.split(':')[0] || 'board');
    const boardModel = (fqbn.split(':')[2] || 'gen').split(':')[0];
    const boardSafe = `${arch}_${boardModel}`.replace(/[^a-zA-Z0-9]/g, '_');
    const buildDir = path.join(os.tmpdir(), `RoboLabBuild_${boardSafe}`);
    const ensureElectronBuildDir = () => {
      try {
        if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
        const coreSub = path.join(buildDir, 'core');
        const ldHSub = path.join(buildDir, 'ld_h');
        const sketchSub = path.join(buildDir, 'sketch');
        if (!fs.existsSync(coreSub)) fs.mkdirSync(coreSub, { recursive: true });
        if (!fs.existsSync(ldHSub)) fs.mkdirSync(ldHSub, { recursive: true });
        if (!fs.existsSync(sketchSub)) fs.mkdirSync(sketchSub, { recursive: true });
        if (fqbn.includes('esp8266')) {
          const targetLdH = path.join(ldHSub, 'local.eagle.flash.ld.h');
          if (!fs.existsSync(targetLdH)) {
            const candidateDataDirs = [
              localAppDataForConfig ? path.join(localAppDataForConfig, 'Arduino15') : '',
              path.join(__dirname, '..', 'resources', 'arduino-data'),
              'C:\\KidsBlock Desktop\\resources\\tools\\Arduino',
            ].filter(Boolean);
            for (const d of candidateDataDirs) {
              const hwDir = path.join(d, 'packages', 'esp8266', 'hardware', 'esp8266');
              if (fs.existsSync(hwDir)) {
                for (const ver of fs.readdirSync(hwDir)) {
                  const sdkLdDir = path.join(hwDir, ver, 'tools', 'sdk', 'ld');
                  const c1 = path.join(sdkLdDir, 'eagle.flash.4m2m.ld');
                  const c2 = path.join(sdkLdDir, 'eagle.flash.4m.ld');
                  const srcLd = fs.existsSync(c1) ? c1 : fs.existsSync(c2) ? c2 : '';
                  if (srcLd) {
                    fs.copyFileSync(srcLd, targetLdH);
                    break;
                  }
                }
                break;
              }
            }
          }
        }
      } catch (_) {}
    };
    ensureElectronBuildDir();

    // Reload hash cache from disk in case Web Compiler updated it
    try {
      if (fs.existsSync(_hashCachePath)) {
        Object.assign(lastCompiledHashes, JSON.parse(fs.readFileSync(_hashCachePath, 'utf-8')));
      }
    } catch (_) {}

    // Check code changes to see if we can skip compilation
    const codeHash = crypto.createHash('md5').update(finalCode).digest('hex');
    let shouldCompile = true;

    if ((lastCompiledHashes[board] === codeHash || lastCompiledHashes[fqbn] === codeHash) && fs.existsSync(buildDir)) {
      try {
        const files = fs.readdirSync(buildDir);
        const hasMainBin = files.some(f => (f.endsWith('.bin') || f.endsWith('.hex') || f.endsWith('.elf')) && !f.endsWith('.bootloader.bin') && !f.endsWith('.partitions.bin'));
        const hasBootloader = files.some(f => f.endsWith('.bootloader.bin'));
        const hasPartitions = files.some(f => f.endsWith('.partitions.bin'));

        // For ESP32, all 3 binaries (.bin, bootloader, partitions) must exist to skip compilation
        const isEsp32Board = fqbn.includes('esp32') || (board || '').toLowerCase().includes('esp32');
        const isCacheValid = isEsp32Board ? (hasMainBin && hasBootloader && hasPartitions) : hasMainBin;

        if (isCacheValid) {
          shouldCompile = false;
          safeSend(event, 'arduino-log', { text: '⚡ Kode tidak berubah. Skip kompilasi dan gunakan cache build! (Sangat Cepat)', type: 'success' });
        }
      } catch (_) {}
    }

    // 1. Compile
    if (shouldCompile) {
      // Auto-close KidsBlock Desktop or zombie compiler processes on Windows to free RAM and COM port locks
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          execSync('taskkill /IM "KidsBlock Desktop.exe" /F /T', { stdio: 'ignore' });
          execSync('taskkill /IM "KidsBlock.exe" /F /T', { stdio: 'ignore' });
        } catch (_) {}
        try {
          const { execSync } = require('child_process');
          execSync('taskkill /IM "cc1plus.exe" /F /T', { stdio: 'ignore' });
          execSync('taskkill /IM "xtensa-lx106-elf-g++.exe" /F /T', { stdio: 'ignore' });
        } catch (_) {}
      }

      // Clear old compiled binaries from buildDir to force arduino-cli to produce a fresh file
      if (fs.existsSync(buildDir)) {
        try {
          const files = fs.readdirSync(buildDir);
          files.forEach(f => {
            if (f.endsWith('.bin') || f.endsWith('.hex') || f.endsWith('.elf')) {
              fs.unlinkSync(path.join(buildDir, f));
            }
          });
        } catch (e) {
          console.warn('[RoboLab] Failed to clean stale binaries in buildDir:', e.message);
        }
      }
      ensureElectronBuildDir();

      // Log the first 100 characters of the code being compiled to verify what code is actually being built
      const cleanSnippet = finalCode.trim().substring(0, 100).replace(/\r?\n/g, ' ');
      safeSend(event, 'arduino-log', { text: `Code to compile: "${cleanSnippet}..."`, type: 'info' });

      safeSend(event, 'arduino-log', { text: 'Compiling sketch...', type: 'info' });
      const cpuCount = os.cpus().length || 4;
      const freeMemMB = Math.round(os.freemem() / (1024 * 1024));
      const hasPrecompiledCore = fs.existsSync(path.join(buildDir, 'core', 'core.a'));
      let jobCount = Math.min(4, Math.max(2, Math.floor(cpuCount / 2)));
      if (freeMemMB < 1300) {
        jobCount = 1;
      } else if (isESP8266 || freeMemMB < 2400 || !hasPrecompiledCore) {
        jobCount = Math.min(2, jobCount);
      }

      const userLibDir = getUserLibraryDir(userId);
      const libArgs = [];
      if (userLibDir && fs.existsSync(userLibDir)) {
        libArgs.push('--libraries', userLibDir);
      }
      const globalDirs = getGlobalLibraryDirs();
      for (const gd of globalDirs) {
        if (fs.existsSync(gd) && gd !== userLibDir) {
          libArgs.push('--libraries', gd);
        }
      }

      const compileArgs = ['compile', '--fqbn', fqbn, '--build-path', buildDir, '--jobs', String(jobCount), '--warnings', 'none', '--verbose', ...libArgs, ...configArgs, tempDir];
      const singleJobArgs = ['compile', '--fqbn', fqbn, '--build-path', buildDir, '--jobs', '1', '--warnings', 'none', ...libArgs, ...configArgs, tempDir];
      let compileSuccess = await runArduinoCLI(compileArgs, event);

      const stderrStr = lastCLISterr || '';
      const hasSketchSyntaxError = /RoboLabSketch\.ino:\d+:\d+:\s*(?:fatal\s+)?error:/i.test(stderrStr) && !/No such file or directory/i.test(stderrStr);
      const isOomOrLdError = /out of memory|cannot allocate|virtual memory|errno=1455|ld_h|local\.eagle\.flash\.ld|cp\.py/i.test(stderrStr);

      // Auto-retry with single job if first compile failed due to OOM, ld_h race, or non-syntax issue
      if (!compileSuccess && (isOomOrLdError || (!hasSketchSyntaxError && jobCount > 1))) {
        safeSend(event, 'arduino-log', { text: '🔄 Mengoptimalkan penggunaan RAM (mode hemat memori single-job) dan melanjutkan kompilasi...', type: 'info' });
        ensureElectronBuildDir();
        compileSuccess = await runArduinoCLI(singleJobArgs, event, 600000);
        if (!compileSuccess && /out of memory|cannot allocate|virtual memory/i.test(lastCLISterr || '')) {
          safeSend(event, 'arduino-log', { text: '🔄 Melanjutkan kompilasi objek core yang tersisa (mode hemat memori tahap 2)...', type: 'info' });
          ensureElectronBuildDir();
          compileSuccess = await runArduinoCLI(singleJobArgs, event, 600000);
        }
      }

      // Automatic missing library detection & auto-installation
      if (!compileSuccess) {
        const missingMatch = (lastCLISterr || '').match(/fatal error:\s*([a-zA-Z0-9_]+)\.h:\s*No such file or directory/i);
        if (missingMatch) {
          const rawHeader = missingMatch[1];
          const rawLower = rawHeader.toLowerCase();
          let libToInstall = rawHeader;
          if (rawLower.includes('dht')) {
            libToInstall = 'DHT sensor library';
          } else if (rawLower.includes('ps3') || rawLower.includes('ps3controller')) {
            libToInstall = 'PS3 Controller Host';
          } else if (rawLower.includes('ps4') || rawLower.includes('ps4controller')) {
            libToInstall = 'PS4Controller';
          } else if (rawLower.includes('pn532') || rawLower.includes('rfid')) {
            libToInstall = 'Adafruit PN532';
          } else if (rawLower.includes('mfrc522')) {
            libToInstall = 'MFRC522';
          } else if (rawLower.includes('ssd1306')) {
            libToInstall = 'Adafruit SSD1306';
          } else if (rawLower.includes('gfx')) {
            libToInstall = 'Adafruit GFX Library';
          } else if (rawLower.includes('bme280')) {
            libToInstall = 'Adafruit BME280 Library';
          } else if (rawLower.includes('adafruit_sensor') || rawLower === 'adafruit_sensor') {
            libToInstall = 'Adafruit Unified Sensor';
          } else if (rawHeader === 'Servo') {
            libToInstall = board === 'ESP32 DevKit V1' ? 'ESP32Servo' : 'Servo';
          } else if (rawHeader === 'ESP32Servo') {
            libToInstall = 'ESP32Servo';
          } else if (rawHeader === 'Adafruit_MPU6050') {
            libToInstall = 'Adafruit MPU6050';
          } else if (rawHeader === 'Adafruit_NeoPixel') {
            libToInstall = 'Adafruit NeoPixel';
          } else if (rawHeader === 'PubSubClient') {
            libToInstall = 'PubSubClient';
          } else if (rawHeader === 'WebSocketsClient') {
            libToInstall = 'WebSockets';
          } else if (rawHeader.startsWith('Blynk') || rawHeader === 'BlynkSimpleEsp8266' || rawHeader === 'BlynkSimpleEsp32') {
            libToInstall = 'Blynk';
          }

          if (board === 'ESP32 DevKit V1' && (rawHeader === 'Servo' || rawHeader === 'ESP32Servo')) {
            let updatedIno = fs.readFileSync(inoPath, 'utf-8');
            if (updatedIno.includes('<Servo.h>')) {
              updatedIno = updatedIno.replace(/#include\s*<Servo\.h>/g, '#include <ESP32Servo.h>');
              fs.writeFileSync(inoPath, updatedIno, 'utf-8');
            }
          }

          safeSend(event, 'arduino-log', { text: `📦 Library '${libToInstall}' belum terpasang. Memperbarui index & menginstal otomatis...`, type: 'info' });
          // Update library index first so install can find latest version
          await runArduinoCLI(['lib', 'update-index', ...configArgs], event, 30000).catch(() => {});
          const installSuccess = await runArduinoCLI(['lib', 'install', libToInstall, ...configArgs], event, 240000);

          if (installSuccess) {
            safeSend(event, 'arduino-log', { text: `✅ Library '${libToInstall}' berhasil diinstal! Memulai kompilasi ulang...`, type: 'success' });
            ensureElectronBuildDir();
            compileSuccess = await runArduinoCLI(singleJobArgs, event);
          } else {
            safeSend(event, 'arduino-log', { text: `❌ Gagal install library '${libToInstall}'. Pastikan koneksi internet aktif, lalu klik Upload lagi.`, type: 'error' });
          }
        }

        // Automatic missing platform core detection & auto-installation (e.g. esp8266:esp8266, rp2040:rp2040)
        const missingPlatformMatch = (lastCLISterr || '').match(/Platform '([^']+)' not found|Platform ([a-zA-Z0-9_:]+) is not found|platform not installed/i);
        if (missingPlatformMatch) {
          let coreToInstall = fqbn.split(':').slice(0, 2).join(':');
          safeSend(event, 'arduino-log', { text: `⚙️ Platform core '${coreToInstall}' belum terpasang. Memperbarui index & mengunduh otomatis...`, type: 'info' });

          let boardUrl = '';
          if (coreToInstall.includes('esp8266')) {
            boardUrl = 'https://arduino.esp8266.com/stable/package_esp8266com_index.json';
          } else if (coreToInstall.includes('esp32')) {
            boardUrl = 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json';
          } else if (coreToInstall.includes('rp2040')) {
            boardUrl = 'https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json';
          } else if (coreToInstall.includes('stm32')) {
            boardUrl = 'https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json';
          } else if (coreToInstall.toLowerCase().includes('megacore')) {
            boardUrl = 'https://mcudude.github.io/MegaCore/package_MCUdude_MegaCore_index.json';
          }

          const urlArgs = boardUrl ? ['--additional-urls', boardUrl] : [];
          safeSend(event, 'arduino-log', { text: `Memperbarui index platform core...`, type: 'info' });
          await runArduinoCLI(['core', 'update-index', ...urlArgs, ...configArgs], event, 120000).catch(() => {});

          safeSend(event, 'arduino-log', { text: `Mengunduh & menginstal core ${coreToInstall}...`, type: 'info' });
          const coreInstallSuccess = await runArduinoCLI(['core', 'install', coreToInstall, ...urlArgs, ...configArgs], event, 600000);

          if (coreInstallSuccess) {
            safeSend(event, 'arduino-log', { text: `✅ Core '${coreToInstall}' berhasil diinstal! Memulai kompilasi ulang...`, type: 'success' });
            ensureElectronBuildDir();
            compileSuccess = await runArduinoCLI(singleJobArgs, event);
          } else {
            safeSend(event, 'arduino-log', { text: `❌ Gagal menginstal core '${coreToInstall}'. Periksa koneksi internet Anda.`, type: 'error' });
          }
        }

        // Auto-recovery ONLY for genuinely corrupted dependency (.d) or archive (.a) files
        if (!compileSuccess) {
          const isCacheOrDepErr = (lastCLISterr || '').match(/opening dependency file|\.d:\s*No such file|archive has no index|file format not recognized/i);
          if (isCacheOrDepErr) {
            safeSend(event, 'arduino-log', { text: '🔄 Memperbaiki berkas cache dependensi dan mengompilasi ulang dengan mode stabil (1 job)...', type: 'warning' });
            try {
              const sketchCache = path.join(buildDir, 'sketch');
              if (fs.existsSync(sketchCache)) fs.rmSync(sketchCache, { recursive: true, force: true });
              if (/archive has no index|file format not recognized/i.test(lastCLISterr || '')) {
                const coreArchive = path.join(buildDir, 'core', 'core.a');
                if (fs.existsSync(coreArchive)) fs.unlinkSync(coreArchive);
              }
              ensureElectronBuildDir();
            } catch (_) {}
            compileSuccess = await runArduinoCLI(singleJobArgs, event, 600000);
          }
        }
      }

      if (!compileSuccess) {
        safeSend(event, 'arduino-log', { text: 'Compilation failed!', type: 'error' });
        return { success: false, error: 'Compilation failed' };
      }

      lastCompiledHashes[board] = codeHash;
      if (fqbn) lastCompiledHashes[fqbn] = codeHash;
      // Persist hash to disk so it survives app restarts
      try { fs.writeFileSync(_hashCachePath, JSON.stringify(lastCompiledHashes), 'utf-8'); } catch (_) {}
      safeSend(event, 'arduino-log', { text: 'Compilation successful!', type: 'success' });
    }

    if (action === 'verify') {
      return { success: true };
    }

    // 2. Upload
    if (!port || port === 'none') {
      safeSend(event, 'arduino-log', { text: 'Error: No serial port selected. Please select a COM port first.', type: 'error' });
      return { success: false, error: 'No serial port selected' };
    }

    // Automatically release COM port from any active serial monitor process before flashing
    if (activeSerialProcess) {
      try {
        if (process.platform === 'win32' && activeSerialProcess.pid) {
          const { execSync } = require('child_process');
          try { execSync(`taskkill /pid ${activeSerialProcess.pid} /T /F`); } catch (_) { activeSerialProcess.kill('SIGKILL'); }
        } else {
          activeSerialProcess.kill('SIGKILL');
        }
      } catch (_) {}
      activeSerialProcess = null;
      safeSend(event, 'arduino-log', { text: `⚡ Membebaskan port serial ${port} dari Serial Monitor...`, type: 'info' });
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Diagnostic: confirm binary exists before starting upload
    try {
      const buildFiles = fs.readdirSync(buildDir);
      const binFiles = buildFiles.filter(f => f.endsWith('.bin') || f.endsWith('.hex') || f.endsWith('.elf'));
      if (binFiles.length === 0) {
        safeSend(event, 'arduino-log', { text: `⚠️ Tidak ada file binary di buildDir (${buildDir}). Pastikan kompilasi berhasil.`, type: 'error' });
        return { success: false, error: 'No binary file found in buildDir' };
      }
      safeSend(event, 'arduino-log', { text: `📁 Binary siap: ${binFiles.join(', ')}`, type: 'info' });
    } catch (e) {
      safeSend(event, 'arduino-log', { text: `⚠️ Tidak bisa membaca buildDir: ${e.message}`, type: 'error' });
    }

    safeSend(event, 'arduino-log', { text: `🚀 Memulai upload ke ${board} pada port ${port}...`, type: 'info' });
    const uploadArgs = ['upload', '-p', port, '--fqbn', fqbn, '--build-path', buildDir, '--verbose', ...configArgs, tempDir];

    // High-speed baud rate 921600 for fast flashing (~8-10 seconds for 1.5MB ESP32 binary).
    if (board === 'ESP32 DevKit V1' || fqbn.includes('esp32')) {
      uploadArgs.push(
        '--upload-field', 'UploadSpeed=921600',
        '--upload-field', 'speed=921600',
        '--upload-field', 'upload.speed=921600'
      );
    }

    const runElectronEsp8266Ch340Upload = () => new Promise((resolve) => {
      try {
        const binFile = fs.readdirSync(buildDir).find(f => f.endsWith('.ino.bin'));
        if (!binFile) return resolve(false);
        const binPath = path.join(buildDir, binFile);

        const candidateDataDirs = [
          localAppDataForConfig ? path.join(localAppDataForConfig, 'Arduino15') : '',
          path.join(__dirname, '..', 'resources', 'arduino-data'),
          'C:\\KidsBlock Desktop\\resources\\tools\\Arduino',
        ].filter(Boolean);

        let pythonExe = 'python';
        let pyserialDir = '';
        let esptoolDir = '';
        for (const d of candidateDataDirs) {
          const pkgDir = path.join(d, 'packages', 'esp8266');
          const hwDir = path.join(pkgDir, 'hardware', 'esp8266');
          if (fs.existsSync(hwDir)) {
            const pyToolsDir = path.join(pkgDir, 'tools', 'python3');
            if (fs.existsSync(pyToolsDir)) {
              for (const ver of fs.readdirSync(pyToolsDir)) {
                const candidate = path.join(pyToolsDir, ver, process.platform === 'win32' ? 'python3.exe' : 'python3');
                if (fs.existsSync(candidate)) { pythonExe = candidate; break; }
              }
            }
            for (const ver of fs.readdirSync(hwDir)) {
              const ps = path.join(hwDir, ver, 'tools', 'pyserial');
              const et = path.join(hwDir, ver, 'tools', 'esptool');
              if (fs.existsSync(ps) && fs.existsSync(et)) {
                pyserialDir = ps;
                esptoolDir = et;
                break;
              }
            }
            if (pyserialDir && esptoolDir) break;
          }
        }
        if (!pyserialDir || !esptoolDir) return resolve(false);

        const pyScript = [
          'import sys, time',
          `sys.path.insert(0, ${JSON.stringify(pyserialDir)})`,
          `sys.path.insert(0, ${JSON.stringify(esptoolDir)})`,
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
          `esptool.main(['--chip', 'esp8266', '--port', ${JSON.stringify(port)}, '--baud', '115200', '--before', 'default_reset', '--after', 'hard_reset', 'write_flash', '--flash_mode', 'dout', '--flash_size', 'detect', '0x0', ${JSON.stringify(binPath)}])`,
          'try:',
          `    s = serial.Serial(${JSON.stringify(port)}, 115200, timeout=0.1)`,
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

        const child = spawn(pythonExe, ['-u', '-c', pyScript], { windowsHide: true });
        let outBuf = '';
        const onChunk = (d, isErr) => {
          const s = d.toString();
          outBuf += s;
          s.split(/\r?\n/).forEach(l => {
            const t = l.trim();
            if (!t) return;
            const isProg = /\d+%|uploading|writing|reading|erasing|bytes|hard resetting|connecting|leaving|chip is|features:|crystal is|mac:|stub|configuring flash|hash of data/i.test(t);
            safeSend(event, 'arduino-log', { text: t, type: (!isErr || isProg) ? 'stdout' : 'error' });
          });
        };
        child.stdout.on('data', d => onChunk(d, false));
        child.stderr.on('data', d => onChunk(d, true));
        child.on('close', code => {
          const hasFatal = /A fatal esptool\.py error occurred|A fatal error occurred|Cannot configure port|Failed to connect|Timed out waiting for packet/i.test(outBuf);
          resolve(code === 0 && !hasFatal);
        });
        child.on('error', () => resolve(false));
      } catch (_) {
        resolve(false);
      }
    });

    let uploadSuccess = false;
    if (isESP8266) {
      uploadSuccess = await runElectronEsp8266Ch340Upload();
    }

    if (!uploadSuccess) {
      uploadSuccess = await runArduinoCLI(uploadArgs, event);
    }

    // Fallback for ESP8266 Lolin / NodeMCU on CH340/CP2102 if first upload attempt failed
    if (!uploadSuccess && isESP8266) {
      safeSend(event, 'arduino-log', { text: '🔄 Mencoba ulang upload ESP8266 Lolin/NodeMCU dengan reset otomatis @ 115200 baud...', type: 'info' });
      await new Promise(r => setTimeout(r, 600));
      uploadSuccess = await runElectronEsp8266Ch340Upload();
      if (!uploadSuccess) {
        const esp8266FallbackArgs = ['upload', '-p', port, '--fqbn', 'esp8266:esp8266:nodemcuv2:eesz=4M2M,baud=115200', '--build-path', buildDir, '--verbose', ...configArgs, tempDir];
        uploadSuccess = await runArduinoCLI(esp8266FallbackArgs, event);
      }
    }

    // Fallback: if 921600 fails on legacy USB-Serial chips (CH340G), retry at 460800 baud
    if (!uploadSuccess && (board === 'ESP32 DevKit V1' || fqbn.includes('esp32'))) {
      safeSend(event, 'arduino-log', { text: '🔄 Upload 921600 baud tidak didukung chip USB. Mencoba ulang pada 460800 baud (Sangat Cepat)...', type: 'info' });
      const fallbackUploadArgs = ['upload', '-p', port, '--fqbn', fqbn, '--build-path', buildDir, '--verbose', '--upload-field', 'UploadSpeed=460800', '--upload-field', 'speed=460800', ...configArgs, tempDir];
      uploadSuccess = await runArduinoCLI(fallbackUploadArgs, event);
    }

    if (!uploadSuccess) {
      safeSend(event, 'arduino-log', { text: 'Upload failed!', type: 'error' });
      return { success: false, error: 'Upload failed' };
    }

    safeSend(event, 'arduino-log', { text: 'Upload successful!', type: 'success' });
    return { success: true };

  } catch (err) {
    console.error('[RoboLab] arduino-upload handler crashed:', err);
    safeSend(event, 'arduino-log', { text: `Internal error during upload: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-board-cores', async (event) => {
  try {
    const cliPath = findArduinoCLI();
    if (!fs.existsSync(cliPath) && cliPath !== 'arduino-cli') {
      safeSend(event, 'arduino-log', { text: 'arduino-cli tidak ditemukan. Pastikan sudah terpasang.', type: 'error' });
      return { success: false, error: 'arduino-cli not found' };
    }
    
    safeSend(event, 'arduino-log', { text: 'Memulai instalasi package core Arduino & ESP32...', type: 'info' });
    
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    let configArgs = [];
    if (fs.existsSync(arduino15ConfigPath)) {
      configArgs = ['--config-file', arduino15ConfigPath];
    } else {
      safeSend(event, 'arduino-log', { text: 'Membuat konfigurasi arduino-cli...', type: 'info' });
      await runArduinoCLI(['config', 'init'], event, 30000);
      configArgs = ['--config-file', arduino15ConfigPath];
    }

    safeSend(event, 'arduino-log', { text: 'Menambahkan URL package ESP32...', type: 'info' });
    await runArduinoCLI(['config', 'set', 'board_manager.additional_urls', 'https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json', ...configArgs], event, 30000);

    safeSend(event, 'arduino-log', { text: 'Memperbarui index core (butuh internet)...', type: 'info' });
    const updateSuccess = await runArduinoCLI(['core', 'update-index', ...configArgs], event, 120000);
    if (!updateSuccess) {
      safeSend(event, 'arduino-log', { text: 'Gagal memperbarui index core. Periksa koneksi internet.', type: 'error' });
      return { success: false, error: 'core update-index failed' };
    }

    safeSend(event, 'arduino-log', { text: 'Menginstal core arduino:avr...', type: 'info' });
    await runArduinoCLI(['core', 'install', 'arduino:avr', ...configArgs], event, 300000);

    safeSend(event, 'arduino-log', { text: 'Menginstal core esp32:esp32 (mungkin butuh waktu lama)...', type: 'info' });
    const espSuccess = await runArduinoCLI(['core', 'install', 'esp32:esp32', ...configArgs], event, 600000);

    if (espSuccess) {
      safeSend(event, 'arduino-log', { text: '✅ Semua package Arduino dan ESP32 berhasil diinstal!', type: 'success' });
      return { success: true };
    } else {
      safeSend(event, 'arduino-log', { text: '⚠️ Instalasi ESP32 gagal atau dibatalkan.', type: 'error' });
      return { success: false, error: 'esp32 core install failed' };
    }
  } catch (err) {
    console.error('[RoboLab] install-board-cores crashed:', err);
    safeSend(event, 'arduino-log', { text: `Internal error during install: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// IPC Handler: Fetch installed Arduino libraries from disk using arduino-cli lib list --format json
ipcMain.handle('get-installed-libs', async (event, payloadUserId) => {
  const userId = (typeof payloadUserId === 'string') ? payloadUserId : (payloadUserId?.userId || null);
  const userLibDir = getUserLibraryDir(userId);
  const globalDirs = getGlobalLibraryDirs();

  const userLibs = scanLibrariesInFolder(userLibDir, true, userId);
  const globalLibs = [];
  for (const gd of globalDirs) {
    const scanned = scanLibrariesInFolder(gd, false, null);
    for (const s of scanned) {
      if (!globalLibs.some(g => g.name.toLowerCase() === s.name.toLowerCase())) {
        globalLibs.push(s);
      }
    }
  }

  // Fast check arduino-cli lib list (short timeout so it never hangs)
  const cliLibs = await new Promise((resolve) => {
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const args = ['lib', 'list', '--format', 'json'];
    if (fs.existsSync(arduino15ConfigPath)) {
      args.push('--config-file', arduino15ConfigPath);
    }
    execFile(cliPath, args, { maxBuffer: 10 * 1024 * 1024, timeout: 5000 }, (error, stdout) => {
      if (error || !stdout) return resolve([]);
      try {
        const data = JSON.parse(stdout);
        const libs = Array.isArray(data) ? data.map(item => item.library ? item.library.name : item.name).filter(Boolean) : [];
        resolve(libs);
      } catch (_) {
        resolve([]);
      }
    });
  });

  for (const cName of cliLibs) {
    if (!globalLibs.some(g => g.name.toLowerCase() === cName.toLowerCase())) {
      globalLibs.push({
        name: cName,
        version: '1.0.0',
        author: 'Arduino CLI Index',
        desc: 'Installed Arduino library',
        isCustom: false,
        installed: true
      });
    }
  }

  // Combine: globalLibs + userLibs (userLibs takes precedence if duplicate)
  const combined = [...globalLibs];
  for (const u of userLibs) {
    const idx = combined.findIndex(c => c.name.toLowerCase() === u.name.toLowerCase());
    if (idx >= 0) {
      combined[idx] = u;
    } else {
      combined.push(u);
    }
  }

  console.log(`[RoboLab] Installed libraries for user [${userId || 'guest'}]: ${combined.length} (custom: ${userLibs.length})`);
  return combined;
});

// IPC Handler: Fetch installed Arduino board cores from disk using arduino-cli core list --format json
ipcMain.handle('get-installed-cores', async () => {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const args = ['core', 'list', '--format', 'json'];
    if (fs.existsSync(arduino15ConfigPath)) {
      args.push('--config-file', arduino15ConfigPath);
    }
    execFile(cliPath, args, { maxBuffer: 20 * 1024 * 1024, timeout: 30000 }, (error, stdout) => {
      if (error) {
        console.warn('[RoboLab] core list notice:', error.message);
        resolve([]);
        return;
      }
      try {
        const data = JSON.parse(stdout);
        const cores = Array.isArray(data) ? data.map(item => item.id).filter(Boolean) : [];
        console.log('[RoboLab] Installed board cores on disk:', cores);
        resolve(cores);
      } catch (e) {
        console.warn('[RoboLab] core list JSON parse warning:', e.message);
        resolve([]);
      }
    });
  });
});

// IPC Handler: Real Arduino library installation
ipcMain.handle('install-arduino-lib', async (event, libName) => {
  try {
    let actualLibName = libName;
    const lowerName = (libName || '').toLowerCase();
    if (lowerName.includes('ps3') || lowerName.includes('ps3controller')) {
      actualLibName = 'PS3 Controller Host';
    } else if (lowerName.includes('ps4') || lowerName.includes('ps4controller')) {
      actualLibName = 'PS4Controller';
    }

    safeSend(event, 'arduino-log', { text: `📦 Memulai instalasi library '${actualLibName}' via arduino-cli...`, type: 'info' });
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const configArgs = fs.existsSync(arduino15ConfigPath) ? ['--config-file', arduino15ConfigPath] : [];

    // Update library index first
    await runArduinoCLI(['lib', 'update-index', ...configArgs], event, 30000).catch(() => {});

    // Install library
    const success = await runArduinoCLI(['lib', 'install', actualLibName, ...configArgs], event, 240000);
    if (success) {
      purgeBuildDirs();
      safeSend(event, 'arduino-log', { text: `✅ Library '${actualLibName}' berhasil diinstal!`, type: 'success' });
      return { success: true };
    } else {
      safeSend(event, 'arduino-log', { text: `❌ Gagal menginstal library '${actualLibName}'.`, type: 'error' });
      return { success: false, error: 'lib install failed' };
    }
  } catch (err) {
    safeSend(event, 'arduino-log', { text: `Error installing library '${libName}': ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// IPC Handler: Live search Arduino libraries from official Arduino/GitHub index using arduino-cli lib search --format json
ipcMain.handle('search-arduino-lib', async (event, searchQuery) => {
  return new Promise((resolve) => {
    if (!searchQuery || !searchQuery.trim()) {
      return resolve([]);
    }
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const args = ['lib', 'search', searchQuery.trim(), '--format', 'json'];
    if (fs.existsSync(arduino15ConfigPath)) {
      args.push('--config-file', arduino15ConfigPath);
    }
    execFile(cliPath, args, { maxBuffer: 20 * 1024 * 1024, timeout: 30000 }, (error, stdout) => {
      if (error) {
        console.warn('[RoboLab] lib search notice:', error.message);
        return resolve([]);
      }
      try {
        const data = JSON.parse(stdout);
        const libraries = Array.isArray(data.libraries) ? data.libraries.slice(0, 30).map(lib => ({
          name: lib.name,
          author: lib.author || 'Community',
          desc: lib.sentence || lib.paragraph || 'Arduino Library from GitHub Index',
          cat: lib.category || 'General',
          version: lib.latest ? lib.latest.version : (lib.version || 'latest')
        })) : [];
        resolve(libraries);
      } catch (e) {
        console.warn('[RoboLab] lib search JSON parse warning:', e.message);
        resolve([]);
      }
    });
  });
});

// IPC Handler: Install Arduino library directly from GitHub Git URL
ipcMain.handle('install-lib-from-github', async (event, payload) => {
  try {
    const githubUrl = typeof payload === 'object' && payload ? payload.githubUrl : payload;
    const userId = typeof payload === 'object' && payload ? payload.userId : null;
    const userLibDir = getUserLibraryDir(userId);

    const trimmedUrl = (githubUrl || '').trim();
    if (!trimmedUrl) {
      safeSend(event, 'arduino-log', { text: 'URL GitHub tidak boleh kosong.', type: 'error' });
      return { success: false, error: 'Empty URL' };
    }

    safeSend(event, 'arduino-log', { text: `📦 Memulai instalasi library dari GitHub ke akun Anda: ${trimmedUrl}...`, type: 'info' });

    const cleanRepoUrl = trimmedUrl.replace(/\.git$/i, '').replace(/\/$/, '');
    const parts = cleanRepoUrl.split('/').filter(Boolean);
    const repoName = (parts[parts.length - 1] || 'library').replace(/[^a-zA-Z0-9_\-]/g, '_');

    // 1. Try git clone first
    const { spawn } = require('child_process');
    const tempCloneDir = path.join(os.tmpdir(), `gh_clone_${Date.now()}_${repoName}`);
    if (fs.existsSync(tempCloneDir)) {
      try { fs.rmSync(tempCloneDir, { recursive: true, force: true }); } catch (_) {}
    }

    let cloneSuccess = false;
    try {
      const gitUrl = trimmedUrl.endsWith('.git') ? trimmedUrl : `${cleanRepoUrl}.git`;
      cloneSuccess = await new Promise((res) => {
        const gitProc = spawn('git', ['clone', '--depth', '1', gitUrl, tempCloneDir], { windowsHide: true });
        gitProc.on('close', (code) => res(code === 0));
        gitProc.on('error', () => res(false));
      });
    } catch (_) { cloneSuccess = false; }

    let sourceDir = null;
    if (cloneSuccess && fs.existsSync(tempCloneDir)) {
      sourceDir = tempCloneDir;
    } else {
      // 2. Fallback: Download ZIP from GitHub archive
      safeSend(event, 'arduino-log', { text: '⚠️ Git clone tidak tersedia/gagal. Mengunduh arsip ZIP dari GitHub...', type: 'info' });
      const zipUrls = [
        `${cleanRepoUrl}/archive/refs/heads/main.zip`,
        `${cleanRepoUrl}/archive/refs/heads/master.zip`,
        `${cleanRepoUrl}/archive/refs/heads/HEAD.zip`
      ];

      const https = require('https');
      const http = require('http');
      const tempZip = path.join(os.tmpdir(), `gh_zip_${Date.now()}.zip`);

      const downloadWithRedirects = (u) => new Promise((res, rej) => {
        const client = u.startsWith('https') ? https : http;
        client.get(u, (response) => {
          if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return res(downloadWithRedirects(response.headers.location));
          }
          if (response.statusCode !== 200) return rej(new Error(`HTTP ${response.statusCode}`));
          const fileStream = fs.createWriteStream(tempZip);
          response.pipe(fileStream);
          fileStream.on('finish', () => { fileStream.close(); res(tempZip); });
        }).on('error', rej);
      });

      let downloadedZip = null;
      for (const zUrl of zipUrls) {
        try {
          downloadedZip = await downloadWithRedirects(zUrl);
          if (downloadedZip) break;
        } catch (_) {}
      }

      if (downloadedZip) {
        const tempExtractDir = path.join(os.tmpdir(), `gh_extract_${Date.now()}`);
        fs.mkdirSync(tempExtractDir, { recursive: true });

        if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          const safeZip = downloadedZip.replace(/'/g, "''");
          const safeDest = tempExtractDir.replace(/'/g, "''");
          execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${safeZip}' -DestinationPath '${safeDest}' -Force"`, { stdio: 'ignore' });
        } else {
          const { execSync } = require('child_process');
          execSync(`unzip -q -o "${downloadedZip}" -d "${tempExtractDir}"`);
        }
        try { fs.unlinkSync(downloadedZip); } catch (_) {}

        const entries = fs.readdirSync(tempExtractDir);
        if (entries.length === 1 && fs.statSync(path.join(tempExtractDir, entries[0])).isDirectory()) {
          sourceDir = path.join(tempExtractDir, entries[0]);
        } else {
          sourceDir = tempExtractDir;
        }
      }
    }

    if (!sourceDir || !fs.existsSync(sourceDir)) {
      safeSend(event, 'arduino-log', { text: '❌ Gagal mengunduh atau mengekstrak pustaka dari GitHub.', type: 'error' });
      return { success: false, error: 'Download failed' };
    }

    // Detect actual library name from library.properties
    let finalLibName = repoName;
    const propPath = path.join(sourceDir, 'library.properties');
    if (fs.existsSync(propPath)) {
      try {
        const lines = fs.readFileSync(propPath, 'utf-8').split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith('name=')) {
            const n = line.slice(5).trim();
            if (n) finalLibName = n;
            break;
          }
        }
      } catch (_) {}
    }

    const safeFinalName = finalLibName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const targetPath = path.join(userLibDir, safeFinalName);
    if (fs.existsSync(targetPath)) {
      try { fs.rmSync(targetPath, { recursive: true, force: true }); } catch (_) {}
    }

    fs.cpSync(sourceDir, targetPath, { recursive: true });
    try { fs.rmSync(sourceDir, { recursive: true, force: true }); } catch (_) {}

    // Scan headers in installed library
    const headers = [];
    try {
      const rootFiles = fs.readdirSync(targetPath);
      for (const f of rootFiles) {
        if (f.endsWith('.h')) headers.push(f);
      }
      const srcDir = path.join(targetPath, 'src');
      if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
        const srcFiles = fs.readdirSync(srcDir);
        for (const f of srcFiles) {
          if (f.endsWith('.h') && !headers.includes(f)) headers.push(f);
        }
      }
    } catch (_) {}

    const parsedApi = parseArduinoLibrary(targetPath, safeFinalName);
    const examples = scanLibraryExamples(targetPath, safeFinalName, parsedApi);
    purgeBuildDirs();
    safeSend(event, 'arduino-log', { text: `✅ Library '${safeFinalName}' berhasil diinstal ke akun Anda!`, type: 'success' });
    return {
      success: true,
      libName: safeFinalName,
      isCustom: true,
      userId: userId || null,
      path: targetPath,
      headers,
      parsedApi,
      examples
    };
  } catch (err) {
    safeSend(event, 'arduino-log', { text: `Error GitHub install: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// IPC Handler: Install Arduino library directly from local ZIP file into user account
ipcMain.handle('install-lib-from-zip', async (event, payload) => {
  try {
    const inputFilePath = typeof payload === 'object' && payload ? payload.filePath : payload;
    const userId = typeof payload === 'object' && payload ? payload.userId : null;
    const userLibDir = getUserLibraryDir(userId);

    let zipPath = inputFilePath;
    if (!zipPath) {
      const result = await dialog.showOpenDialog({
        title: 'Pilih Berkas Library Arduino (.zip)',
        properties: ['openFile'],
        filters: [{ name: 'Arduino Library ZIP', extensions: ['zip'] }]
      });
      if (result.canceled || result.filePaths.length === 0) return { success: false, error: 'Canceled' };
      zipPath = result.filePaths[0];
    }

    safeSend(event, 'arduino-log', { text: `📦 Memulai instalasi library ZIP ke akun Anda: ${path.basename(zipPath)}...`, type: 'info' });

    const tempExtractDir = path.join(os.tmpdir(), `zip_extract_${Date.now()}`);
    fs.mkdirSync(tempExtractDir, { recursive: true });

    if (process.platform === 'win32') {
      const { execSync } = require('child_process');
      const safeZip = zipPath.replace(/'/g, "''");
      const safeDest = tempExtractDir.replace(/'/g, "''");
      execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${safeZip}' -DestinationPath '${safeDest}' -Force"`, { stdio: 'ignore' });
    } else {
      const { execSync } = require('child_process');
      execSync(`unzip -q -o "${zipPath}" -d "${tempExtractDir}"`);
    }

    const items = fs.readdirSync(tempExtractDir);
    let sourceDir = tempExtractDir;
    if (items.length === 1 && fs.statSync(path.join(tempExtractDir, items[0])).isDirectory()) {
      sourceDir = path.join(tempExtractDir, items[0]);
    }

    let detectedName = path.basename(zipPath, '.zip').replace(/-master|-main/gi, '');
    const propPath = path.join(sourceDir, 'library.properties');
    if (fs.existsSync(propPath)) {
      try {
        const lines = fs.readFileSync(propPath, 'utf-8').split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith('name=')) {
            const n = line.slice(5).trim();
            if (n) detectedName = n;
            break;
          }
        }
      } catch (_) {}
    }

    const safeName = detectedName.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const targetPath = path.join(userLibDir, safeName);
    if (fs.existsSync(targetPath)) {
      try { fs.rmSync(targetPath, { recursive: true, force: true }); } catch (_) {}
    }

    fs.cpSync(sourceDir, targetPath, { recursive: true });
    try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch (_) {}

    const headers = [];
    try {
      const rootFiles = fs.readdirSync(targetPath);
      for (const f of rootFiles) {
        if (f.endsWith('.h')) headers.push(f);
      }
      const srcDir = path.join(targetPath, 'src');
      if (fs.existsSync(srcDir) && fs.statSync(srcDir).isDirectory()) {
        const srcFiles = fs.readdirSync(srcDir);
        for (const f of srcFiles) {
          if (f.endsWith('.h') && !headers.includes(f)) headers.push(f);
        }
      }
    } catch (_) {}

    const parsedApi = parseArduinoLibrary(targetPath, safeName);
    const examples = scanLibraryExamples(targetPath, safeName, parsedApi);
    purgeBuildDirs();
    safeSend(event, 'arduino-log', { text: `✅ Library '${safeName}' dari ZIP berhasil diinstal ke akun Anda!`, type: 'success' });
    return {
      success: true,
      libName: safeName,
      isCustom: true,
      userId: userId || null,
      path: targetPath,
      headers,
      parsedApi,
      examples
    };
  } catch (err) {
    safeSend(event, 'arduino-log', { text: `Error ZIP install: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// IPC Handler: Get API definitions, pins, and methods from installed library
ipcMain.handle('get-library-api', async (event, payload) => {
  try {
    const libName = typeof payload === 'object' && payload ? payload.libName : payload;
    const userId = typeof payload === 'object' && payload ? payload.userId : null;
    const userLibDir = getUserLibraryDir(userId);
    const globalDirs = getGlobalLibraryDirs();

    const candidateDirs = [path.join(userLibDir, libName), ...globalDirs.map(gd => path.join(gd, libName))];
    for (const cDir of candidateDirs) {
      if (fs.existsSync(cDir)) {
        return parseArduinoLibrary(cDir, libName);
      }
    }
    return { name: libName, pins: [], constants: [], methods: [] };
  } catch (err) {
    return { name: payload?.libName || '', error: err.message, pins: [], constants: [], methods: [] };
  }
});

// IPC Handler: Get all example sketches from installed & custom libraries
ipcMain.handle('get-library-examples', async (event, payloadUserId) => {
  try {
    const userId = (typeof payloadUserId === 'string') ? payloadUserId : (payloadUserId?.userId || null);
    const userLibDir = getUserLibraryDir(userId);
    const globalDirs = getGlobalLibraryDirs();

    const allExamples = [];
    const scannedCustom = scanLibrariesInFolder(userLibDir, true, userId);
    for (const lib of scannedCustom) {
      if (Array.isArray(lib.examples)) {
        for (const ex of lib.examples) {
          allExamples.push({ ...ex, isCustom: true, libraryAuthor: lib.author, parsedApi: ex.parsedApi || lib.parsedApi });
        }
      }
    }

    for (const gd of globalDirs) {
      const scannedGlobal = scanLibrariesInFolder(gd, false, null);
      for (const lib of scannedGlobal) {
        if (Array.isArray(lib.examples)) {
          for (const ex of lib.examples) {
            if (!allExamples.some(e => e.name === ex.name)) {
              allExamples.push({ ...ex, isCustom: false, libraryAuthor: lib.author, parsedApi: ex.parsedApi || lib.parsedApi });
            }
          }
        }
      }
    }

    return allExamples;
  } catch (err) {
    console.warn('[RoboLab] Error in get-library-examples:', err.message);
    return [];
  }
});

// IPC Handler: Uninstall/Delete an Arduino library from user account and disk
ipcMain.handle('uninstall-arduino-lib', async (event, payload) => {
  try {
    const libName = typeof payload === 'object' && payload ? payload.libName : payload;
    const userId = typeof payload === 'object' && payload ? payload.userId : null;

    if (!libName || typeof libName !== 'string' || !libName.trim()) {
      return { success: false, error: 'Nama library tidak valid' };
    }

    const cleanName = libName.trim();
    safeSend(event, 'arduino-log', { text: `🗑️ Memulai penghapusan library '${cleanName}'...`, type: 'info' });

    let deletedAny = false;
    const userLibDir = getUserLibraryDir(userId);
    const globalDirs = getGlobalLibraryDirs();
    const candidateDirs = [userLibDir, ...globalDirs];

    const cleanSafe = cleanName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();

    for (const baseDir of candidateDirs) {
      if (!baseDir || !fs.existsSync(baseDir)) continue;
      try {
        const entries = fs.readdirSync(baseDir, { withFileTypes: true });
        for (const ent of entries) {
          if (ent.isDirectory()) {
            const entName = ent.name;
            const entSafe = entName.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
            if (entName.toLowerCase() === cleanName.toLowerCase() || entSafe === cleanSafe) {
              const targetPath = path.join(baseDir, entName);
              try {
                fs.rmSync(targetPath, { recursive: true, force: true });
                deletedAny = true;
                console.log(`[RoboLab] Removed library directory: ${targetPath}`);
              } catch (rmErr) {
                console.warn(`[RoboLab] Failed to remove library directory ${targetPath}:`, rmErr.message);
              }
            }
          }
        }
      } catch (_) {}
    }

    // Attempt arduino-cli lib uninstall if available
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    if (cliPath && fs.existsSync(cliPath)) {
      try {
        await new Promise((resolve) => {
          execFile(cliPath, ['lib', 'uninstall', cleanName], { timeout: 10000 }, () => resolve());
        });
      } catch (_) {}
    }

    purgeBuildDirs();
    safeSend(event, 'arduino-log', { text: `✅ Library '${cleanName}' berhasil dihapus dari sistem!`, type: 'success' });
    return { success: true, libName: cleanName };
  } catch (err) {
    console.error('[RoboLab] Error in uninstall-arduino-lib:', err);
    safeSend(event, 'arduino-log', { text: `❌ Gagal menghapus library: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// IPC Handler: Real Python package uninstallation via pip
ipcMain.handle('uninstall-python-pkg', async (event, pkgName) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    safeSend(event, 'python-output', { text: `🗑️ Menghapus package Python '${pkgName}' via pip...`, type: 'info' });
    exec(`python -m pip uninstall -y ${pkgName}`, { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        safeSend(event, 'python-output', { text: `❌ Gagal menghapus '${pkgName}': ${error.message}`, type: 'error' });
        resolve({ success: false, error: error.message });
      } else {
        safeSend(event, 'python-output', { text: `✅ Package Python '${pkgName}' berhasil dihapus!`, type: 'info' });
        resolve({ success: true });
      }
    });
  });
});

// IPC Handler: Real Python package installation via pip
ipcMain.handle('install-python-pkg', async (event, pkgName) => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    safeSend(event, 'python-output', { text: `📦 Memulai instalasi package Python '${pkgName}' via pip...`, type: 'info' });
    exec(`python -m pip install ${pkgName}`, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        safeSend(event, 'python-output', { text: `❌ Gagal menginstal '${pkgName}': ${error.message}`, type: 'error' });
        resolve({ success: false, error: error.message });
      } else {
        safeSend(event, 'python-output', { text: `✅ Package Python '${pkgName}' berhasil diinstal!`, type: 'info' });
        resolve({ success: true });
      }
    });
  });
});

// IPC Handler: Install individual Board Core
ipcMain.handle('install-board-core', async (event, { coreName, url }) => {
  try {
    safeSend(event, 'arduino-log', { text: `⚙️ Memulai instalasi Board Core '${coreName}'...`, type: 'info' });
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const configArgs = fs.existsSync(arduino15ConfigPath) ? ['--config-file', arduino15ConfigPath] : [];

    // If core has custom package index URL (e.g. MegaCore, ESP32, ESP8266, STM32, RP2040)
    if (url) {
      safeSend(event, 'arduino-log', { text: `Menambahkan URL index board: ${url}`, type: 'info' });
      await runArduinoCLI(['config', 'set', 'board_manager.additional_urls', url, ...configArgs], event, 30000).catch(() => {});
    }

    const urlArgs = url ? ['--additional-urls', url] : [];

    safeSend(event, 'arduino-log', { text: `Memperbarui index platform core (butuh internet)...`, type: 'info' });
    await runArduinoCLI(['core', 'update-index', ...urlArgs, ...configArgs], event, 120000).catch(() => {});

    safeSend(event, 'arduino-log', { text: `Mengunduh & menginstal core ${coreName}...`, type: 'info' });
    const success = await runArduinoCLI(['core', 'install', coreName, ...urlArgs, ...configArgs], event, 600000);
    if (success) {
      safeSend(event, 'arduino-log', { text: `✅ Board Core '${coreName}' berhasil diinstal!`, type: 'success' });
      return { success: true };
    } else {
      safeSend(event, 'arduino-log', { text: `❌ Gagal menginstal Board Core '${coreName}'.`, type: 'error' });
      return { success: false, error: 'core install failed' };
    }
  } catch (err) {
    safeSend(event, 'arduino-log', { text: `Error: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
});

// Get serial ports from Windows Registry - most reliable, no encoding issues
const getSerialPortsFromRegistry = () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    // Query HKLM\HARDWARE\DEVICEMAP\SERIALCOMM - lists all COM ports Windows knows about
    exec('reg query HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM', { timeout: 5000 }, (error, stdout) => {
      if (error) {
        console.error('[RoboLab] reg query failed:', error.message);
        resolve(null);
        return;
      }
      const ports = [];
      const lines = stdout.split(/\r?\n/);
      lines.forEach(line => {
        // Lines look like:    \Device\ProlificSerial0    REG_SZ    COM3
        const match = line.match(/REG_SZ\s+(COM\d+)/i);
        if (match) {
          const comPort = match[1].toUpperCase();
          // Try to get device name from the registry key name
          const namePart = line.trim().split(/\s+/)[0] || comPort;
          const deviceName = namePart.replace(/.*\\/, ''); // Get last part after backslash
          ports.push({ address: comPort, label: `${comPort} (${deviceName})` });
        }
      });
      console.log('[RoboLab] Registry COM ports:', ports);
      resolve(ports);
    });
  });
};

// Get serial ports using arduino-cli board list — used to enrich port labels with board names
// Runs with a tight 5-second timeout to avoid blocking the UI
const getSerialPortsViaCLI = () => {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const args = ['board', 'list', '--format', 'json'];
    if (fs.existsSync(arduino15ConfigPath)) {
      args.push('--config-file', arduino15ConfigPath);
    }
    // Tighter timeout: 5s max so Registry result is never blocked waiting for CLI
    execFile(cliPath, args, { timeout: 5000 }, (error, stdout) => {
      if (error) { resolve(null); return; }
      try {
        const data = JSON.parse(stdout);
        const ports = [];
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item.port && item.port.address) {
              const boardName = item.matching_boards && item.matching_boards.length > 0
                ? item.matching_boards[0].name : '';
              ports.push({
                address: item.port.address,
                label: boardName ? `${item.port.address} (${boardName})` : item.port.address
              });
            }
          });
        }
        console.log('[RoboLab] arduino-cli COM ports:', ports);
        resolve(ports);
      } catch (e) {
        resolve(null);
      }
    });
  });
};

const findDriversDir = () => {
  if (app.isPackaged) {
    const packagedDrivers = path.join(process.resourcesPath, 'drivers');
    if (fs.existsSync(packagedDrivers)) return packagedDrivers;
  }
  const devDrivers = path.join(__dirname, '..', 'resources', 'drivers');
  if (fs.existsSync(devDrivers)) return devDrivers;
  return null;
};

ipcMain.handle('install-usb-drivers', async () => {
  const driversDir = findDriversDir();
  if (!driversDir) {
    return { success: false, error: 'Folder driver tidak ditemukan.' };
  }

  const cp2102Inf = path.join(driversDir, 'cp2102', 'silabser.inf');
  const ch340Inf = path.join(driversDir, 'ch340', 'CH341SER.INF');
  const ch340Setup = path.join(driversDir, 'ch340', 'SETUP.EXE');

  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const psScript = `Start-Process pnputil.exe -ArgumentList '/add-driver "${cp2102Inf}" /install' -Verb RunAs -Wait; Start-Process pnputil.exe -ArgumentList '/add-driver "${ch340Inf}" /install' -Verb RunAs -Wait; if (Test-Path "${ch340Setup}") { Start-Process "${ch340Setup}" -ArgumentList '/S' -Verb RunAs -Wait }`;
      const cmd = `powershell -Command "${psScript.replace(/"/g, '\\"')}"`;
      const { exec } = require('child_process');
      exec(cmd, (err) => {
        if (err) {
          console.error('[RoboLab] Error installing drivers via IPC:', err);
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true });
        }
      });
    });
  } else {
    return { success: false, error: 'Instalasi driver hanya didukung di OS Windows.' };
  }
});

ipcMain.handle('get-serial-ports', async () => {
  // Run Registry query and CLI board list in PARALLEL for speed.
  // Registry is fast (<100ms) and most reliable for detecting all COM ports
  // (including CH340, CP2102 clones that arduino-cli sometimes misses).
  // CLI board list enriches labels with board names (e.g. "Arduino Uno") when available.
  const [regPorts, cliPorts] = await Promise.all([
    getSerialPortsFromRegistry().catch(e => {
      console.error('[RoboLab] Registry port detection error:', e);
      return [];
    }),
    getSerialPortsViaCLI().catch(e => {
      console.error('[RoboLab] arduino-cli port detection error:', e);
      return null;
    })
  ]);

  // Start with Registry ports as the authoritative list (catches all COM ports)
  const allPorts = Array.isArray(regPorts) ? [...regPorts] : [];

  // Enrich with CLI labels (board name) where available, and add any CLI-only ports
  if (Array.isArray(cliPorts)) {
    cliPorts.forEach(cp => {
      const existing = allPorts.find(p => p.address === cp.address);
      if (existing) {
        // Overwrite label only if CLI found a more descriptive board name
        if (cp.label && cp.label !== cp.address) {
          existing.label = cp.label;
        }
      } else {
        allPorts.push(cp);
      }
    });
  }

  console.log('[RoboLab] Final COM ports:', allPorts);
  return allPorts;
});

let activeSerialProcess = null;

ipcMain.handle('start-serial-monitor', async (event, port, board, baudrate = 115200) => {
  if (activeSerialProcess) {
    activeSerialProcess.kill();
    activeSerialProcess = null;
  }
  
  safeSend(event, 'arduino-log', { text: `Menghubungkan ke port serial ${port} dengan baudrate ${baudrate}...`, type: 'info' });
  
  try {
    const { spawn } = require('child_process');
    // UTF-8 env: fix UnicodeEncodeError on Windows (CP1252 can't encode emoji/non-latin chars)
    const utf8Env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };

    if (board === 'ESP32 DevKit V1' || board === 'BBC micro:bit') {
      // MicroPython boards via mpremote repl
      // mpremote usually uses 115200 by default. Just pass the port.
      activeSerialProcess = spawn('python', ['-m', 'mpremote', 'connect', port, 'repl'], { env: utf8Env });
      
      // Give mpremote a moment to connect, then send Ctrl+D to trigger a soft-reset
      // so the user can see their script run from the beginning.
      setTimeout(() => {
        if (activeSerialProcess && activeSerialProcess.stdin) {
          activeSerialProcess.stdin.write('\x04');
        }
      }, 1000);
    } else {
      // Arduino Uno via arduino-cli monitor
      const cliPath = findArduinoCLI();
      activeSerialProcess = spawn(cliPath, ['monitor', '-p', port, '--config', `baudrate=${baudrate}`]);
    }
    
    activeSerialProcess.stdout.on('data', (d) => {
      safeSend(event, 'serial-data', d.toString('utf8'));
    });
    
    activeSerialProcess.stderr.on('data', (d) => {
      safeSend(event, 'serial-data', d.toString('utf8'));
    });
    
    activeSerialProcess.on('close', () => {
      safeSend(event, 'arduino-log', { text: `Koneksi serial terputus.`, type: 'info' });
      safeSend(event, 'serial-disconnected');
      activeSerialProcess = null;
    });
    
    return { success: true };
  } catch (err) {
    console.error('Failed to start serial monitor:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-serial-monitor', async () => {
  if (activeSerialProcess) {
    try {
      if (process.platform === 'win32' && activeSerialProcess.pid) {
        const { execSync } = require('child_process');
        try {
          execSync(`taskkill /pid ${activeSerialProcess.pid} /T /F`);
        } catch (_) {
          activeSerialProcess.kill('SIGKILL');
        }
      } else {
        activeSerialProcess.kill('SIGKILL');
      }
    } catch (_) {}
    activeSerialProcess = null;
    // Beri jeda 1.2 detik agar OS & USB-Serial driver merilis COM port sepenuhnya
    await new Promise(resolve => setTimeout(resolve, 1200));
  }
  return { success: true };
});


// --- PYTHON EXECUTION ---
let activePythonProcess = null;

ipcMain.handle('run-python', async (event, { code }) => {
  try {
    const os = require('os');
    const tmpDir = path.join(os.tmpdir(), 'robolab-studio-tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const pyPath = path.join(tmpDir, 'run.py');
    fs.writeFileSync(pyPath, code, 'utf-8');

    if (activePythonProcess) {
      activePythonProcess.kill();
    }

    // Default to 'python', user must have it installed
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    activePythonProcess = spawn(pythonCmd, ['-u', pyPath]); // -u for unbuffered stdout

    activePythonProcess.stdout.on('data', (data) => {
      event.sender.send('python-output', { type: 'stdout', text: data.toString() });
    });

    activePythonProcess.stderr.on('data', (data) => {
      event.sender.send('python-output', { type: 'error', text: data.toString() });
    });

    activePythonProcess.on('close', (exitCode) => {
      event.sender.send('python-output', { type: 'info', text: `\n[PYTHON] Process exited with code ${exitCode}` });
      activePythonProcess = null;
    });

    activePythonProcess.on('error', (err) => {
      event.sender.send('python-output', { type: 'error', text: `\n[PYTHON] Failed to start Python: ${err.message}. Pastikan Python sudah terinstall di komputer ini.` });
      activePythonProcess = null;
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-python', async () => {
  if (activePythonProcess) {
    activePythonProcess.kill();
    activePythonProcess = null;
  }
  return { success: true };
});
ipcMain.handle('scan-wifi', async () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    if (process.platform === 'win32') {
      exec('netsh wlan show networks', (error, stdout, stderr) => {
        if (error) {
          resolve(['Simulated WiFi 1', 'Simulated WiFi 2']);
          return;
        }
        const networks = [];
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('SSID') && !line.includes('BSSID')) {
            const parts = line.split(':');
            if (parts.length > 1) {
              const ssid = parts[1].trim();
              if (ssid) networks.push(ssid);
            }
          }
        }
        // Remove duplicates and empty ones
        const unique = [...new Set(networks)].filter(n => n.length > 0);
        resolve(unique.length > 0 ? unique : ['No Networks Found']);
      });
    } else {
      // Fallback for non-Windows
      resolve(['Simulated WiFi A', 'Simulated WiFi B']);
    }
  });
});

// ─── Desktop Google OAuth via Local Loopback Server ────────────────────────
ipcMain.handle('start-google-oauth', async (event, { oauthUrl, port = 54321 }) => {
  return new Promise((resolve, reject) => {
    let server = null;
    let timeoutTimer = null;

    const cleanup = () => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (server) {
        try { server.close(); } catch (_) {}
        server = null;
      }
    };

    server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, `http://127.0.0.1:${port}`);

        // Callback route: Serve HTML that captures hash or query params
        if (parsedUrl.pathname === '/callback' || parsedUrl.pathname === '/auth/callback' || parsedUrl.pathname === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoboLab Studio - Autentikasi Berhasil</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
    }
    .card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 48px 36px;
      text-align: center;
      max-width: 460px;
      box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(20px);
    }
    .icon {
      width: 72px;
      height: 72px;
      background: #10B981;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
    }
    .icon svg { width: 40px; height: 40px; stroke: #fff; fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    h1 { font-size: 26px; margin: 0 0 12px; font-weight: 700; letter-spacing: -0.02em; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
    </div>
    <h1>Autentikasi Berhasil!</h1>
    <p>Akun Google Anda telah terhubung. Anda dapat menutup tab ini dan kembali ke aplikasi <strong>RoboLab Studio</strong>.</p>
  </div>
  <script>
    try {
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const params = new URLSearchParams(hash || search);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const code = params.get('code');
      const error = params.get('error_description') || params.get('error');

      fetch('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token, code, error })
      }).catch(console.error);

      setTimeout(() => {
        try { window.close(); } catch(e) {}
      }, 2500);
    } catch(e) {
      console.error(e);
    }
  </script>
</body>
</html>`);
          return;
        }

        // Token delivery endpoint from browser script
        if (parsedUrl.pathname === '/token' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ ok: true }));

            try {
              const data = JSON.parse(body || '{}');
              cleanup();

              // Focus RoboLab Electron window
              const wins = BrowserWindow.getAllWindows();
              if (wins.length > 0) {
                if (wins[0].isMinimized()) wins[0].restore();
                wins[0].focus();
              }

              if (data.error) {
                reject(new Error(data.error));
              } else {
                resolve(data);
              }
            } catch (err) {
              cleanup();
              reject(err);
            }
          });
          return;
        }

        res.writeHead(404);
        res.end();
      } catch (err) {
        cleanup();
        reject(err);
      }
    });

    server.on('error', (err) => {
      cleanup();
      reject(err);
    });

    server.listen(port, '127.0.0.1', () => {
      // Launch default OS browser
      shell.openExternal(oauthUrl);
    });

    // 2 minutes timeout
    timeoutTimer = setTimeout(() => {
      cleanup();
      reject(new Error('Proses login Google melebihi batas waktu (timeout). Silakan coba lagi.'));
    }, 120000);
  });
});

// ─── Auto-Updater IPC Handlers ──────────────────────────────────────────────
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { status: 'dev-mode', message: 'Pemeriksaan pembaruan tidak aktif dalam mode pengembangan.' };
  }
  if (!autoUpdater) {
    return { status: 'error', message: 'Modul electron-updater tidak tersedia.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', updateInfo: result?.updateInfo };
  } catch (err) {
    console.error('[RoboLab] checkForUpdates error:', err);
    // Fallback: check GitHub API directly
    try {
      const res = await fetch('https://api.github.com/repos/Akhmad-Fadhlan/robolab/releases/latest', {
        headers: { 'User-Agent': 'RoboLab-Studio-App' }
      });
      if (res.ok) {
        const release = await res.json();
        const latestVer = (release.tag_name || '').replace(/^v/, '');
        const currentVer = app.getVersion();
        return {
          status: 'github-fallback',
          latestVersion: latestVer,
          currentVersion: currentVer,
          hasUpdate: latestVer !== currentVer,
          releaseUrl: release.html_url,
          releaseNotes: release.body,
        };
      }
    } catch (_) {}
    return { status: 'error', message: err?.message || String(err) };
  }
});

ipcMain.handle('install-update-now', () => {
  console.log('[RoboLab AutoUpdater] Installing update now...');
  try {
    const { execSync } = require('child_process');
    if (activeSerialProcess) {
      try {
        if (process.platform === 'win32' && activeSerialProcess.pid) {
          execSync(`taskkill /pid ${activeSerialProcess.pid} /T /F`);
        } else {
          activeSerialProcess.kill('SIGKILL');
        }
      } catch (_) {}
      activeSerialProcess = null;
    }
  } catch (_) {}

  setImmediate(() => {
    try {
      if (autoUpdater) {
        autoUpdater.quitAndInstall(false, true);
      } else {
        app.quit();
      }
    } catch (err) {
      console.error('[RoboLab AutoUpdater] quitAndInstall error:', err);
      app.quit();
    }
  });
});

app.whenReady().then(() => {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  createWindow();



  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
