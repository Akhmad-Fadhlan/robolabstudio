const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[1/5] Preparing RoboLab Compiler Bridge files...');
const rootDir = path.resolve(__dirname, '..');
const bridgeDir = path.join(rootDir, 'tools', 'robolab-compiler-bridge');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');
const tmpDir = path.join(rootDir, 'tmp');

if (!fs.existsSync(bridgeDir)) fs.mkdirSync(bridgeDir, { recursive: true });
if (!fs.existsSync(publicDownloadsDir)) fs.mkdirSync(publicDownloadsDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

// Copy compile-server.cjs and arduino-sketch.cjs
fs.copyFileSync(
  path.join(rootDir, 'server', 'compile-server.cjs'),
  path.join(bridgeDir, 'compile-server.cjs')
);
fs.copyFileSync(
  path.join(rootDir, 'server', 'arduino-sketch.cjs'),
  path.join(bridgeDir, 'arduino-sketch.cjs')
);

// Copy arduino-cli.exe
const binDir = path.join(bridgeDir, 'bin');
if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
const cliSrc = path.join(rootDir, 'resources', 'bin', 'win32', 'arduino-cli.exe');
if (fs.existsSync(cliSrc)) {
  console.log('      * Copying arduino-cli.exe...');
  fs.copyFileSync(cliSrc, path.join(binDir, 'arduino-cli.exe'));
}

// Compile RoboLabBridge.exe (System Tray companion app)
const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';
const traySrc = path.join(rootDir, 'scripts', 'RoboLabBridgeTray.cs');
const trayExe = path.join(bridgeDir, 'RoboLabBridge.exe');
if (fs.existsSync(cscPath) && fs.existsSync(traySrc)) {
  console.log('      * Compiling RoboLabBridge.exe (System Tray Companion)...');
  try {
    execSync(
      `"${cscPath}" /target:winexe /optimize+ /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /out:"${trayExe}" "${traySrc}"`,
      { stdio: 'inherit' }
    );
  } catch (err) {
    console.error('Failed to compile RoboLabBridge.exe:', err.message);
  }
}

// Copy essential libraries (Blynk, Adafruit, DHT, WiFi, etc.)
console.log('[2/5] Copying essential Arduino libraries (Blynk, Adafruit, DHT, Servo)...');
const libSrc = path.join(rootDir, 'resources', 'arduino-data', 'libraries');
const libDest = path.join(bridgeDir, 'arduino-data', 'libraries');
if (fs.existsSync(libSrc)) {
  fs.cpSync(libSrc, libDest, { recursive: true });
}

// Copy drivers
const driversSrc = path.join(rootDir, 'resources', 'drivers');
const driversDest = path.join(bridgeDir, 'drivers');
if (fs.existsSync(driversSrc)) {
  fs.cpSync(driversSrc, driversDest, { recursive: true });
}

// Windows ZIP & EXE
console.log('[3/5] Packaging Windows installer & portable zip...');
const zipOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Setup.zip');
const winZipOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Windows.zip');
try {
  if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
  execSync(
    `tar.exe -a -c -f "${zipOutput}" -C "${bridgeDir}" .`,
    { stdio: 'inherit' }
  );
  if (fs.existsSync(winZipOutput)) fs.unlinkSync(winZipOutput);
  fs.copyFileSync(zipOutput, winZipOutput);
  const stats = fs.statSync(zipOutput);
  console.log(`      * Created Windows ZIP: ${zipOutput} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create zip package with tar, falling back to powershell:', err.message);
  if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
  execSync(
    `powershell -Command "Compress-Archive -Path '${bridgeDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal -Force"`,
    { stdio: 'inherit' }
  );
  if (fs.existsSync(winZipOutput)) fs.unlinkSync(winZipOutput);
  fs.copyFileSync(zipOutput, winZipOutput);
}

// Compile standalone .exe installer using csc.exe
const exeOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Setup.exe');
const installerCs = path.join(rootDir, 'scripts', 'Installer.cs');
if (fs.existsSync(cscPath) && fs.existsSync(installerCs) && fs.existsSync(zipOutput)) {
  console.log('      * Compiling RoboLab-Compiler-Bridge-Setup.exe with embedded payload...');
  try {
    if (fs.existsSync(exeOutput)) fs.unlinkSync(exeOutput);
    execSync(
      `"${cscPath}" /target:winexe /optimize+ /reference:System.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.IO.Compression.dll /reference:System.IO.Compression.FileSystem.dll /reference:Microsoft.CSharp.dll /resource:"${zipOutput}",payload.zip /out:"${exeOutput}" "${installerCs}"`,
      { stdio: 'inherit' }
    );
    const exeStats = fs.statSync(exeOutput);
    console.log(`      * Created Windows EXE: ${exeOutput} (${(exeStats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error('Failed to compile installer executable:', err.message);
  }
}

// macOS & Linux packaging
console.log('[4/5] Packaging macOS & Linux archives...');
const unixTemp = path.join(tmpDir, 'robolab-bridge-unix');
if (fs.existsSync(unixTemp)) fs.rmSync(unixTemp, { recursive: true, force: true });
fs.mkdirSync(unixTemp, { recursive: true });

// Copy scripts & configs for macOS & Linux (no .exe, no .bat, no Windows drivers!)
const unixFiles = [
  'compile-server.cjs',
  'arduino-sketch.cjs',
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

// Copy libraries to unix temp
const unixLibDest = path.join(unixTemp, 'arduino-data', 'libraries');
fs.mkdirSync(path.dirname(unixLibDest), { recursive: true });
if (fs.existsSync(libSrc)) {
  fs.cpSync(libSrc, unixLibDest, { recursive: true });
}

// Package macOS ZIP
const macZip = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-macOS.zip');
try {
  if (fs.existsSync(macZip)) fs.unlinkSync(macZip);
  execSync(`tar.exe -a -c -f "${macZip}" -C "${unixTemp}" .`, { stdio: 'inherit' });
  const macStats = fs.statSync(macZip);
  console.log(`      * Created macOS ZIP: ${macZip} (${(macStats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create macOS zip:', err.message);
}

// Package Linux TAR.GZ and ZIP
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

// Cleanup unixTemp
try {
  fs.rmSync(unixTemp, { recursive: true, force: true });
} catch (_) {}

console.log('[5/5] All Compiler Bridge packages (Windows, macOS, Linux) successfully generated!');
