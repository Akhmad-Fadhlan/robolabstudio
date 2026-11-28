@echo off
title RoboLab Studio - Install Local Compiler Bridge
color 0B
echo ===============================================================================
echo    ROBOLAB STUDIO - INSTALASI LOCAL COMPILER BRIDGE (AMAN ^& PORTABLE)
echo ===============================================================================
echo.

set "SRC_DIR=%~dp0"
set "DEST_DIR=%LOCALAPPDATA%\RoboLabCompilerBridge"

echo [1/3] Menyiapkan direktori %DEST_DIR% ...
if not exist "%DEST_DIR%" mkdir "%DEST_DIR%"

echo [2/3] Menyalin file Compiler Bridge (arduino-cli + Node runtime)...
xcopy "%SRC_DIR%*" "%DEST_DIR%\" /E /I /Y /Q >nul

:: Buat launcher batch ringan di Startup folder user tanpa menggunakan script .VBS
set "STARTUP_BAT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RoboLabCompilerBridge.bat"
echo [3/3] Mengaktifkan Auto-Start saat komputer menyala...
(
  echo @echo off
  echo cd /d "%DEST_DIR%"
  echo if exist "%DEST_DIR%\RoboLabBridge.exe" ^(
  echo   start "" "%DEST_DIR%\RoboLabBridge.exe"
  echo ^) else ^(
  echo   start "RoboLab Compiler Bridge" /min "%DEST_DIR%\start-bridge.bat"
  echo ^)
) > "%STARTUP_BAT%"

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
echo  - Aman untuk Antivirus ^& Windows Defender (100%% Tanpa Script VBS)
echo ===============================================================================
echo.
timeout /t 4
