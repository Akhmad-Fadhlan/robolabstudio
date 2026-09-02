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
      { name: 'RoboLab Files', extensions: ['ino', 'py', 'json', 'md', 'txt', 'hex'] }
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
          if (/Failed to connect|No serial data/i.test(line)) {
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
          const success = code === 0;
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
  const { code = '', board = '', port = '', action = 'upload', fileExt = 'ino', files = {} } = (payload || {});

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
      fqbn = 'esp32:esp32:esp32:PartitionScheme=huge_app,UploadSpeed=115200';
    } else if (board.includes('ESP8266') || bLower.includes('nodemcu') || bLower.includes('esp8266')) {
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
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }

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
      // Auto-close KidsBlock Desktop background processes on Windows to free RAM and COM port locks
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          execSync('taskkill /IM "KidsBlock Desktop.exe" /F /T', { stdio: 'ignore' });
          execSync('taskkill /IM "KidsBlock.exe" /F /T', { stdio: 'ignore' });
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

      // Log the first 100 characters of the code being compiled to verify what code is actually being built
      const cleanSnippet = finalCode.trim().substring(0, 100).replace(/\r?\n/g, ' ');
      safeSend(event, 'arduino-log', { text: `Code to compile: "${cleanSnippet}..."`, type: 'info' });

      safeSend(event, 'arduino-log', { text: 'Compiling sketch...', type: 'info' });
      const cpuCount = os.cpus().length || 4;
      const jobCount = Math.min(4, Math.max(2, Math.floor(cpuCount / 2)));

      const compileArgs = ['compile', '--fqbn', fqbn, '--build-path', buildDir, '--jobs', String(jobCount), '--warnings', 'none', '--verbose', ...configArgs, tempDir];
      let compileSuccess = await runArduinoCLI(compileArgs, event);

      // Auto-retry with single job if first compile failed without a code error (e.g. timeout/hang)
      if (!compileSuccess && !(lastCLISterr || '').match(/error:/i) && jobCount > 1) {
        safeSend(event, 'arduino-log', { text: '🔄 Mencoba ulang kompilasi dengan mode single-job...', type: 'info' });
        const singleJobArgs = ['compile', '--fqbn', fqbn, '--build-path', buildDir, '--jobs', '1', '--warnings', 'none', ...configArgs, tempDir];
        compileSuccess = await runArduinoCLI(singleJobArgs, event, 150000);
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
            compileSuccess = await runArduinoCLI(compileArgs, event);
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
            compileSuccess = await runArduinoCLI(compileArgs, event);
          } else {
            safeSend(event, 'arduino-log', { text: `❌ Gagal menginstal core '${coreToInstall}'. Periksa koneksi internet Anda.`, type: 'error' });
          }
        }

        // Auto-recovery for corrupted build dir / linker undefined reference errors
        if (!compileSuccess && (lastCLISterr || '').match(/undefined reference|ld returned 1 exit status|error during build/i)) {
          safeSend(event, 'arduino-log', { text: '🔄 Terdeteksi kesalahan cache/linker. Membersihkan build cache & mengompilasi ulang...', type: 'info' });
          try {
            fs.rmSync(buildDir, { recursive: true, force: true });
            fs.mkdirSync(buildDir, { recursive: true });
          } catch (_) {}
          compileSuccess = await runArduinoCLI(compileArgs, event);
        }
      }

      if (!compileSuccess) {
        // Clean buildDir on hard failure so subsequent attempts start fresh
        try { fs.rmSync(buildDir, { recursive: true, force: true }); } catch (_) {}
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

    let uploadSuccess = await runArduinoCLI(uploadArgs, event);

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
ipcMain.handle('get-installed-libs', async () => {
  return new Promise((resolve) => {
    const { execFile } = require('child_process');
    const cliPath = findArduinoCLI();
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const args = ['lib', 'list', '--format', 'json'];
    if (fs.existsSync(arduino15ConfigPath)) {
      args.push('--config-file', arduino15ConfigPath);
    }
    execFile(cliPath, args, { maxBuffer: 20 * 1024 * 1024, timeout: 30000 }, (error, stdout) => {
      if (error) {
        console.warn('[RoboLab] lib list notice:', error.message);
        resolve([]);
        return;
      }
      try {
        const data = JSON.parse(stdout);
        const libs = Array.isArray(data) ? data.map(item => item.library ? item.library.name : item.name).filter(Boolean) : [];
        console.log('[RoboLab] Installed libraries on disk:', libs);
        resolve(libs);
      } catch (e) {
        console.warn('[RoboLab] lib list JSON parse warning:', e.message);
        resolve([]);
      }
    });
  });
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
ipcMain.handle('install-lib-from-github', async (event, githubUrl) => {
  try {
    const trimmedUrl = (githubUrl || '').trim();
    if (!trimmedUrl) {
      safeSend(event, 'arduino-log', { text: 'URL GitHub tidak boleh kosong.', type: 'error' });
      return { success: false, error: 'Empty URL' };
    }
    safeSend(event, 'arduino-log', { text: `📦 Memulai instalasi library dari GitHub: ${trimmedUrl}...`, type: 'info' });
    const localAppDataForConfig = process.env.LOCALAPPDATA || '';
    const arduino15ConfigPath = path.join(localAppDataForConfig, 'Arduino15', 'arduino-cli.yaml');
    const configArgs = fs.existsSync(arduino15ConfigPath) ? ['--config-file', arduino15ConfigPath] : [];

    const success = await runArduinoCLI(['lib', 'install', '--git-url', trimmedUrl, ...configArgs], event, 300000);
    if (success) {
      safeSend(event, 'arduino-log', { text: `✅ Pustaka berhasil diinstal dari GitHub!`, type: 'success' });
      return { success: true };
    } else {
      safeSend(event, 'arduino-log', { text: `❌ Gagal menginstal dari GitHub. Memencoba cara kloning repositori...`, type: 'error' });
      const userDocsDir = path.join(os.homedir(), 'Documents', 'Arduino', 'libraries');
      if (!fs.existsSync(userDocsDir)) fs.mkdirSync(userDocsDir, { recursive: true });
      const repoName = path.basename(trimmedUrl, '.git');
      const targetPath = path.join(userDocsDir, repoName);
      const { spawn } = require('child_process');
      return new Promise((res) => {
        const gitProc = spawn('git', ['clone', trimmedUrl, targetPath]);
        gitProc.on('close', (code) => {
          if (code === 0) {
            safeSend(event, 'arduino-log', { text: `✅ Pustaka '${repoName}' berhasil dikloning dari GitHub ke Arduino/libraries!`, type: 'success' });
            res({ success: true });
          } else {
            safeSend(event, 'arduino-log', { text: `❌ Gagal kloning repositori GitHub. Pastikan URL valid.`, type: 'error' });
            res({ success: false, error: 'git clone failed' });
          }
        });
      });
    }
  } catch (err) {
    safeSend(event, 'arduino-log', { text: `Error: ${err.message}`, type: 'error' });
    return { success: false, error: err.message };
  }
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
