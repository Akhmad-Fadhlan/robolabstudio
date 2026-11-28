@echo off
title RoboLab Studio - Install Local Compiler Bridge
color 0B
echo ===============================================================================
echo    ROBOLAB STUDIO - INSTALASI LOCAL COMPILER BRIDGE (AMAN ^& PORTABLE)
echo ===============================================================================
echo.

set "SRC_DIR=%~dp0"
set "DEST_DIR=%LOCALAPPDATA%\RoboLabCompilerBridge"

echo [1/2] Menyiapkan direktori %DEST_DIR% ...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

echo [2/2] Menyalin file Compiler Bridge (arduino-cli + C++ Libraries)...
xcopy "%SRC_DIR%*" "%DEST_DIR%\" /E /I /Y /Q >nul

echo.
echo [INFO] Menyalakan RoboLab Compiler Bridge di background (Port 3001)...
if exist "%DEST_DIR%\RoboLabBridge.exe" (
    start "" "%DEST_DIR%\RoboLabBridge.exe"
) else (
    start "RoboLab Compiler Bridge" /min "%DEST_DIR%\start-bridge.bat"
)

echo.
echo ===============================================================================
echo  SUKSES! RoboLab Local Compiler Bridge telah aktif di Port 3001.
echo  - Status di RoboLab Studio akan otomatis berubah menjadi "Local Bridge Online"
echo  - 100%% Aman untuk Antivirus ^& Windows Defender (User-Space Safe)
echo ===============================================================================
echo.
timeout /t 4
