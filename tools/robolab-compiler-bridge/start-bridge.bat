@echo off
setlocal enabledelayedexpansion
title RoboLab Studio - Compiler Bridge (Port 3001)

:: Setup ANSI color codes if supported
color 0B
cls
echo =====================================================================
echo       ROBOLAB STUDIO -- LOCAL COMPILER BRIDGE v1.0
echo       Menghubungkan RoboLab Web dengan Kompiler Hardware Native
echo =====================================================================
echo.

:: 1. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\nvm4w\nodejs\node.exe" (
        set "PATH=C:\nvm4w\nodejs;%PATH%"
    ) else if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
        set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
    ) else if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else (
        echo [X] Node.js tidak ditemukan di sistem.
        echo     Silakan instal Node.js (https://nodejs.org) untuk menjalankan bridge ini.
        echo.
        pause
        exit /b 1
    )
)

:: 2. Check Port 3001
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [!] Port 3001 sedang aktif. Mencoba menghentikan proses lama...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 >nul
)

:: 3. Set Working Directory
cd /d "%~dp0"

echo [1/3] Memeriksa komponen toolchain Arduino...
if exist "bin\arduino-cli.exe" (
    echo       * Arduino CLI: Terpasang (lokal)
) else if exist "..\..\resources\bin\win32\arduino-cli.exe" (
    echo       * Arduino CLI: Ditemukan di workspace RoboLab
) else (
    echo       * Arduino CLI: Menggunakan PATH sistem
)

echo [2/3] Memeriksa pustaka (libraries: Blynk, WiFi, Sensor, Servo)...
if exist "arduino-data\libraries\Blynk" (
    echo       * Blynk IoT Cloud Library: Tersedia
) else if exist "..\..\resources\arduino-data\libraries\Blynk" (
    echo       * Blynk IoT Cloud Library: Tersedia di resources
) else (
    echo       * Menggunakan pustaka Arduino global
)

echo [3/3] Memulai server compiler bridge di http://localhost:3001 ...
echo.
echo =====================================================================
echo  STATUS: AKTIF DAN SIAP!
echo  Buka RoboLab Web (https://robolabstudio.vercel.app atau web lokal).
echo  RoboLab Web akan OTOMATIS mendeteksi bridge ini pada port 3001.
echo.
echo  * Semua kompilasi C++ (Blynk, ESP8266, ESP32, Arduino Uno/Nano/Mega)
echo    akan dieksekusi 100%% native seperti pada APK Desktop.
echo  * Jangan tutup jendela ini saat melakukan Verify / Upload.
echo =====================================================================
echo.

node compile-server.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Server berhenti dengan kode %ERRORLEVEL%.
    pause
)
