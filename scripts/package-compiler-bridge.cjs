const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[1/6] Preparing RoboLab Compiler Bridge files...');
const rootDir = path.resolve(__dirname, '..');
const bridgeDir = path.join(rootDir, 'tools', 'robolab-compiler-bridge');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
const tmpDir = path.join(rootDir, 'tmp');

if (!fs.existsSync(bridgeDir)) fs.mkdirSync(bridgeDir, { recursive: true });
if (!fs.existsSync(publicDownloadsDir)) fs.mkdirSync(publicDownloadsDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// Generate a valid native 32x32 32-bit BGRA Win32 .ico file so compiled .exe files have genuine RT_GROUP_ICON resources
function ensureWin32Icon(icoPath) {
  const width = 32;
  const height = 32;
  const xorSize = width * height * 4;
  const andRowBytes = Math.ceil(width / 32) * 4;
  const andSize = andRowBytes * height;
  const dibHeaderSize = 40;
  const imageSize = dibHeaderSize + xorSize + andSize;

  const buf = Buffer.alloc(6 + 16 + imageSize, 0);
  // ICONDIR
  buf.writeUInt16LE(0, 0); // Reserved
  buf.writeUInt16LE(1, 2); // Type: 1 = ICO
  buf.writeUInt16LE(1, 4); // Count: 1 image

  // ICONDIRENTRY
  buf.writeUInt8(width, 6);
  buf.writeUInt8(height, 7);
  buf.writeUInt8(0, 8);  // ColorCount
  buf.writeUInt8(0, 9);  // Reserved
  buf.writeUInt16LE(1, 10); // Planes
  buf.writeUInt16LE(32, 12); // BitCount
  buf.writeUInt32LE(imageSize, 14);
  buf.writeUInt32LE(22, 18); // Offset

  // BITMAPINFOHEADER
  const dibOffset = 22;
  buf.writeUInt32LE(dibHeaderSize, dibOffset);
  buf.writeInt32LE(width, dibOffset + 4);
  buf.writeInt32LE(height * 2, dibOffset + 8); // XOR + AND height
  buf.writeUInt16LE(1, dibOffset + 12); // Planes
  buf.writeUInt16LE(32, dibOffset + 14); // BitCount (32-bit BGRA)
  buf.writeUInt32LE(0, dibOffset + 16); // BI_RGB
  buf.writeUInt32LE(xorSize + andSize, dibOffset + 20);

  // Draw rounded emerald-cyan badge with robot face (bottom-up rows)
  const pixelOffset = dibOffset + dibHeaderSize;
  for (let y = 0; y < height; y++) {
    const drawY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const idx = pixelOffset + (y * width + x) * 4;
      const dx = x - 15.5;
      const dy = drawY - 15.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 14.2) {
        // Gradient emerald (#10b981) to cyan (#0ea5e9)
        const t = (x + drawY) / 64;
        let r = Math.round(16 * (1 - t) + 14 * t);
        let g = Math.round(185 * (1 - t) + 165 * t);
        let b = Math.round(129 * (1 - t) + 233 * t);
        let a = dist > 13.2 ? Math.max(0, Math.min(255, Math.round((14.2 - dist) * 255))) : 255;

        // Robot head border / eyes in white
        const inHeadBorder =
          ((drawY === 10 || drawY === 22) && x >= 8 && x <= 23) ||
          ((x === 8 || x === 23) && drawY >= 10 && drawY <= 22) ||
          (x >= 15 && x <= 16 && drawY >= 5 && drawY <= 10);
        const inEyes =
          (x >= 11 && x <= 13 && drawY >= 14 && drawY <= 16) ||
          (x >= 18 && x <= 20 && drawY >= 14 && drawY <= 16) ||
          (x >= 13 && x <= 18 && drawY === 19);

        if (inHeadBorder || inEyes) {
          r = 255;
          g = 255;
          b = 255;
        }

        buf[idx] = b;
        buf[idx + 1] = g;
        buf[idx + 2] = r;
        buf[idx + 3] = a;
      }
    }
  }

  fs.writeFileSync(icoPath, buf);
}

const iconPath = path.join(rootDir, 'scripts', 'robolab.ico');
const manifestPath = path.join(rootDir, 'scripts', 'app.manifest');
ensureWin32Icon(iconPath);

// Copy compile-server.cjs, arduino-sketch.cjs, and cloud-compiler.cjs
fs.copyFileSync(
  path.join(rootDir, 'server', 'compile-server.cjs'),
  path.join(bridgeDir, 'compile-server.cjs')
);
fs.copyFileSync(
  path.join(rootDir, 'server', 'arduino-sketch.cjs'),
  path.join(bridgeDir, 'arduino-sketch.cjs')
);
const cloudCompilerSrc = path.join(rootDir, 'server', 'cloud-compiler.cjs');
if (fs.existsSync(cloudCompilerSrc)) {
  fs.copyFileSync(cloudCompilerSrc, path.join(bridgeDir, 'cloud-compiler.cjs'));
}
const cloudBinSrc = path.join(rootDir, 'server', 'cloud-binaries');
const cloudBinDest = path.join(bridgeDir, 'cloud-binaries');
if (fs.existsSync(cloudBinSrc)) {
  fs.cpSync(cloudBinSrc, cloudBinDest, { recursive: true });
}

// Remove any legacy .vbs script so antivirus heuristics never flag the package as a VBS dropper
const legacyVbsPath = path.join(bridgeDir, 'start-silent.vbs');
if (fs.existsSync(legacyVbsPath)) {
  try { fs.unlinkSync(legacyVbsPath); } catch (_) {}
}

// Copy arduino-cli.exe
const binDir = path.join(bridgeDir, 'bin');
if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
const cliSrc = path.join(rootDir, 'resources', 'bin', 'win32', 'arduino-cli.exe');
if (fs.existsSync(cliSrc)) {
  console.log('      * Copying arduino-cli.exe...');
  fs.copyFileSync(cliSrc, path.join(binDir, 'arduino-cli.exe'));
}

// Compile RoboLabBridge.exe (System Tray companion app) with Win32 Manifest & Icon
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const traySrc = path.join(rootDir, 'scripts', 'RoboLabBridgeTray.cs');
const trayExe = path.join(bridgeDir, 'RoboLabBridge.exe');
if (fs.existsSync(cscPath) && fs.existsSync(traySrc)) {
  console.log('      * Compiling RoboLabBridge.exe (System Tray Companion with Win32 Manifest & Icon)...');
  try {
    execSync(
      `"${cscPath}" /target:winexe /optimize+ /win32icon:"${iconPath}" /win32manifest:"${manifestPath}" /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:"${trayExe}" "${traySrc}"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error('Failed to compile RoboLabBridge.exe:', err.message);
  }
}

// Recursively sanitize Arduino libraries: remove non-compilation folders (examples, extras, scripts, tests, doc, linux, travis)
// and any non-C++ executable/script artifacts (.bin, .elf, .bat, .sh, .py, .reg) so antivirus engines see 100% pure C/C++ headers
function sanitizeLibrariesDir(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  const skipDirs = new Set(['examples', 'extras', 'scripts', 'tests', 'test', 'doc', 'docs', 'linux', 'travis', '.github', '.git']);
  const blockedExts = new Set(['.bin', '.elf', '.bat', '.cmd', '.vbs', '.ps1', '.sh', '.py', '.reg', '.exe', '.dll', '.vxd']);

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name.toLowerCase())) {
        fs.rmSync(full, { recursive: true, force: true });
      } else {
        sanitizeLibrariesDir(full);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (blockedExts.has(ext)) {
        fs.unlinkSync(full);
      }
    }
  }
}

console.log('[2/6] Copying & sanitizing essential Arduino C++ libraries...');
const libSrc = path.join(rootDir, 'resources', 'arduino-data', 'libraries');
const libDest = path.join(bridgeDir, 'arduino-data', 'libraries');
if (fs.existsSync(libDest)) fs.rmSync(libDest, { recursive: true, force: true });
if (fs.existsSync(libSrc)) {
  fs.cpSync(libSrc, libDest, { recursive: true });
  sanitizeLibrariesDir(libDest);
}

// Copy & sanitize drivers (remove legacy Win98 .VXD / .SYS and silent .reg/.bat scripts)
const driversSrc = path.join(rootDir, 'resources', 'drivers');
const driversDest = path.join(bridgeDir, 'drivers');
if (fs.existsSync(driversDest)) fs.rmSync(driversDest, { recursive: true, force: true });
if (fs.existsSync(driversSrc)) {
  fs.cpSync(driversSrc, driversDest, { recursive: true });
  for (const badDriverFile of [
    path.join(driversDest, 'cp2102', 'UpdateParam.bat'),
    path.join(driversDest, 'cp2102', 'UpdateParameters.reg'),
    path.join(driversDest, 'ch340', 'CH341SER.VXD'),
    path.join(driversDest, 'ch340', 'CH341S98.SYS'),
  ]) {
    if (fs.existsSync(badDriverFile)) {
      try { fs.unlinkSync(badDriverFile); } catch (_) {}
    }
  }
}

// Prepare clean Windows staging directory (excluding Unix .sh / .command files)
console.log('[3/6] Creating clean Windows payload & portable ZIP...');
const winStage = path.join(tmpDir, 'robolab-bridge-win');
if (fs.existsSync(winStage)) fs.rmSync(winStage, { recursive: true, force: true });
fs.mkdirSync(winStage, { recursive: true });

// Copy only clean Windows files into winStage
const winRootFiles = [
  'RoboLabBridge.exe',
  'compile-server.cjs',
  'arduino-sketch.cjs',
  'cloud-compiler.cjs',
  'install-bridge.bat',
  'start-bridge.bat',
  'stop-bridge.bat',
  'README.md',
];
for (const wf of winRootFiles) {
  const src = path.join(bridgeDir, wf);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(winStage, wf));
  }
}
for (const folder of ['bin', 'arduino-data', 'cloud-binaries', 'drivers']) {
  const src = path.join(bridgeDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(winStage, folder), { recursive: true });
  }
}

const zipOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Setup.zip');
const winZipOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Windows.zip');
if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
execSync(`tar.exe -a -c -f "${zipOutput}" -C "${winStage}" .`, { stdio: 'inherit' });
if (fs.existsSync(winZipOutput)) fs.unlinkSync(winZipOutput);
fs.copyFileSync(zipOutput, winZipOutput);
const stats = fs.statSync(zipOutput);
console.log(`      * Created Windows ZIP: ${zipOutput} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

// Prepare pure EXE payload (zero .bat or shell scripts inside the .exe installer resource!)
console.log('[4/6] Compiling standalone Windows Installer (.exe) with Win32 Manifest & Icon...');
const exeStage = path.join(tmpDir, 'robolab-bridge-exe-payload');
if (fs.existsSync(exeStage)) fs.rmSync(exeStage, { recursive: true, force: true });
fs.mkdirSync(exeStage, { recursive: true });

for (const ef of ['RoboLabBridge.exe', 'compile-server.cjs', 'arduino-sketch.cjs', 'cloud-compiler.cjs', 'README.md']) {
  const src = path.join(bridgeDir, ef);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(exeStage, ef));
  }
}
for (const folder of ['bin', 'arduino-data', 'cloud-binaries', 'drivers']) {
  const src = path.join(bridgeDir, folder);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(exeStage, folder), { recursive: true });
  }
}
const exePayloadZip = path.join(tmpDir, 'exe-payload.zip');
if (fs.existsSync(exePayloadZip)) fs.unlinkSync(exePayloadZip);
execSync(`tar.exe -a -c -f "${exePayloadZip}" -C "${exeStage}" .`, { stdio: 'inherit' });

const exeOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Setup.exe');
const installerCs = path.join(rootDir, 'scripts', 'Installer.cs');
if (fs.existsSync(cscPath) && fs.existsSync(installerCs) && fs.existsSync(exePayloadZip)) {
  try {
    if (fs.existsSync(exeOutput)) fs.unlinkSync(exeOutput);
    execSync(
      `"${cscPath}" /target:winexe /optimize+ /win32icon:"${iconPath}" /win32manifest:"${manifestPath}" /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:Microsoft.CSharp.dll /resource:"${exePayloadZip}",payload.zip /out:"${exeOutput}" "${installerCs}"`,
      { stdio: 'inherit' }
    );
    const exeStats = fs.statSync(exeOutput);
    console.log(`      * Created Windows EXE: ${exeOutput} (${(exeStats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error('Failed to compile installer executable:', err.message);
  }
}

// Cleanup temporary Windows staging
try {
  fs.rmSync(winStage, { recursive: true, force: true });
  fs.rmSync(exeStage, { recursive: true, force: true });
  if (fs.existsSync(exePayloadZip)) fs.unlinkSync(exePayloadZip);
} catch (_) {}

// macOS & Linux packaging
console.log('[5/6] Packaging macOS & Linux archives...');
const unixTemp = path.join(tmpDir, 'robolab-bridge-unix');
if (fs.existsSync(unixTemp)) fs.rmSync(unixTemp, { recursive: true, force: true });
fs.mkdirSync(unixTemp, { recursive: true });

const unixFiles = [
  'compile-server.cjs',
  'arduino-sketch.cjs',
  'cloud-compiler.cjs',
  'start-bridge.sh',
  'start-bridge.command',
  'install-bridge.sh',
  'README.md',
];

for (const uf of unixFiles) {
  const src = path.join(bridgeDir, uf);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(unixTemp, uf));
  }
}

const unixLibDest = path.join(unixTemp, 'arduino-data', 'libraries');
fs.mkdirSync(path.dirname(unixLibDest), { recursive: true });
if (fs.existsSync(libDest)) {
  fs.cpSync(libDest, unixLibDest, { recursive: true });
}

const macZip = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-macOS.zip');
try {
  if (fs.existsSync(macZip)) fs.unlinkSync(macZip);
  execSync(`tar.exe -a -c -f "${macZip}" -C "${unixTemp}" .`, { stdio: 'inherit' });
  const macStats = fs.statSync(macZip);
  console.log(`      * Created macOS ZIP: ${macZip} (${(macStats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create macOS zip:', err.message);
}

const linuxTar = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Linux.tar.gz');
const linuxZip = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Linux.zip');
try {
  if (fs.existsSync(linuxTar)) fs.unlinkSync(linuxTar);
  execSync(`tar.exe -czf "${linuxTar}" -C "${unixTemp}" .`, { stdio: 'inherit' });
  const tarStats = fs.statSync(linuxTar);
  console.log(`      * Created Linux TAR.GZ: ${linuxTar} (${(tarStats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create Linux tar.gz:', err.message);
}

try {
  if (fs.existsSync(linuxZip)) fs.unlinkSync(linuxZip);
  execSync(`tar.exe -a -c -f "${linuxZip}" -C "${unixTemp}" .`, { stdio: 'inherit' });
  const lzipStats = fs.statSync(linuxZip);
  console.log(`      * Created Linux ZIP: ${linuxZip} (${(lzipStats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create Linux zip:', err.message);
}

try {
  fs.rmSync(unixTemp, { recursive: true, force: true });
} catch (_) {}

console.log('[6/6] All Compiler Bridge packages (Windows, macOS, Linux) successfully generated and sanitized!');
