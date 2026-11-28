@echo off
setlocal enabledelayedexpansion
title RoboLab Studio - Compiler Bridge (Port 3001)

color 0B
cls
echo =====================================================================
echo       ROBOLAB STUDIO -- LOCAL COMPILER BRIDGE v1.3
echo       Menghubungkan RoboLab Web dengan Kompiler Hardware Native
echo =====================================================================
echo.

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

cd /d "%~dp0"

echo [1/3] Memeriksa komponen toolchain Arduino...
if exist "bin\arduino-cli.exe" (
    echo       * Arduino CLI: Terpasang (lokal)
) else (
    echo       * Arduino CLI: Menggunakan PATH sistem
)

echo [2/3] Memeriksa pustaka C++ (Blynk, WiFi, Sensor, Servo)...
if exist "arduino-data\libraries\Blynk" (
    echo       * Pustaka Hardware Lokal: Tersedia
)

echo [3/3] Memulai server compiler bridge di http://127.0.0.1:3001 ...
echo.
echo =====================================================================
echo  STATUS: AKTIF DAN SIAP!
echo  Buka RoboLab Studio di browser Anda.
echo  RoboLab Studio akan OTOMATIS mendeteksi bridge ini pada Port 3001.
echo =====================================================================
echo.

node compile-server.cjs
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Server berhenti dengan kode %ERRORLEVEL%.
    pause
)
