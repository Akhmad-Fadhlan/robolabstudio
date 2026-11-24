const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('[1/4] Preparing RoboLab Compiler Bridge files...');
const rootDir = path.resolve(__dirname, '..');
const bridgeDir = path.join(rootDir, 'tools', 'robolab-compiler-bridge');
const publicDownloadsDir = path.join(rootDir, 'public', 'downloads');

if (!fs.existsSync(bridgeDir)) fs.mkdirSync(bridgeDir, { recursive: true });
if (!fs.existsSync(publicDownloadsDir)) fs.mkdirSync(publicDownloadsDir, { recursive: true });

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
console.log('[2/4] Copying essential Arduino libraries (Blynk, Adafruit, DHT, Servo)...');
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

// Create README.md
const readmeContent = `# RoboLab Studio — Local Compiler Bridge

Bridge lokal ultra-ringan untuk RoboLab Web (https://robolabstudio.vercel.app).
Memungkinkan Anda mengompilasi dan mengunggah kode C++ Arduino, ESP8266, dan ESP32
secara 100% native dari browser dengan kecepatan penuh.

## Cara Menggunakan:
1. Klik ganda **start-bridge.bat** (atau jalankan **install-bridge.bat** untuk membuat shortcut di Desktop).
2. Bridge akan berjalan di \`http://localhost:3001\`.
3. Buka RoboLab Web di browser (Chrome / Edge / Opera).
4. Indikator Compiler di RoboLab Web akan otomatis berwarna **HIJAU (Terhubung)**.
5. Klik **Upload** atau **Verify** — sketch Anda langsung dikompilasi secara native!

## Fitur:
- Mendukung penuh Blynk IoT Cloud (ESP8266 & ESP32).
- Pustaka lengkap bawaan (Blynk, WiFi, DHT, Servo, LiquidCrystal, Ultrasonic, dll).
- Otomatis mendeteksi port COM USB (CH340, CP2102, FTDI).
`;
fs.writeFileSync(path.join(bridgeDir, 'README.md'), readmeContent, 'utf-8');

console.log('[3/4] Creating zip package in public/downloads/RoboLab-Compiler-Bridge-Setup.zip...');
const zipOutput = path.join(publicDownloadsDir, 'RoboLab-Compiler-Bridge-Setup.zip');
try {
  if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
  execSync(
    `tar.exe -a -c -f "${zipOutput}" -C "${bridgeDir}" .`,
    { stdio: 'inherit' }
  );
  const stats = fs.statSync(zipOutput);
  console.log(`      * Created: ${zipOutput} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
} catch (err) {
  console.error('Failed to create zip package with tar, falling back to powershell:', err.message);
  if (fs.existsSync(zipOutput)) fs.unlinkSync(zipOutput);
  execSync(
    `powershell -Command "Compress-Archive -Path '${bridgeDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal -Force"`,
    { stdio: 'inherit' }
  );
  const stats = fs.statSync(zipOutput);
  console.log(`      * Created: ${zipOutput} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
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
    console.log(`      * Created: ${exeOutput} (${(exeStats.size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error('Failed to compile installer executable:', err.message);
  }
}

console.log('[4/4] Done! Compiler Bridge package is ready.');
