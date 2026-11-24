@echo off
setlocal enabledelayedexpansion
title Pemasang RoboLab Compiler Bridge

color 0A
cls
echo =====================================================================
echo           PEMASANG ROBOLAB COMPILER BRIDGE v1.0
echo   Ringan, Mudah, Otomatis Terintegrasi dengan RoboLab Web
echo =====================================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\RoboLabBridge"
echo [1/4] Menyiapkan direktori instalasi di:
echo       %TARGET_DIR%
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/4] Menyalin berkas modul compiler...
xcopy /E /I /Y "%~dp0*" "%TARGET_DIR%\" >nul 2>&1

echo [3/4] Membuat pintasan (shortcut) di Desktop dan Start Menu...
set "VBS_SCRIPT=%TEMP%\create_robolab_shortcut.vbs"
(
    echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
    echo sLinkFile = oWS.SpecialFolders^("Desktop"^) ^& "\RoboLab Compiler Bridge.lnk"
    echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
    echo oLink.TargetPath = "%TARGET_DIR%\start-bridge.bat"
    echo oLink.WorkingDirectory = "%TARGET_DIR%"
    echo oLink.Description = "RoboLab Studio - Local Compiler Bridge"
    echo oLink.WindowStyle = 1
    echo oLink.Save
    echo.
    echo sPrograms = oWS.SpecialFolders^("Programs"^)
    echo sLinkFile2 = sPrograms ^& "\RoboLab Compiler Bridge.lnk"
    echo Set oLink2 = oWS.CreateShortcut^(sLinkFile2^)
    echo oLink2.TargetPath = "%TARGET_DIR%\start-bridge.bat"
    echo oLink2.WorkingDirectory = "%TARGET_DIR%"
    echo oLink2.Description = "RoboLab Studio - Local Compiler Bridge"
    echo oLink2.Save
) > "%VBS_SCRIPT%"
cscript //nologo "%VBS_SCRIPT%" >nul 2>&1
del "%VBS_SCRIPT%" >nul 2>&1

echo [4/4] Verifikasi instalasi...
if exist "%TARGET_DIR%\start-bridge.bat" (
    echo.
    echo =====================================================================
    echo  PEMASANGAN BERHASIL! [SUKSES]
    echo.
    echo  Pintasan "RoboLab Compiler Bridge" telah dibuat di Desktop Anda.
    echo  Cukup klik ganda pintasan tersebut kapan saja ingin mengompilasi
    echo  proyek Arduino/ESP8266/ESP32 langsung dari browser RoboLab Web!
    echo =====================================================================
    echo.
    set /p "LAUNCH=Jalankan RoboLab Compiler Bridge sekarang? (Y/N): "
    if /i "!LAUNCH!"=="Y" (
        start "" "%TARGET_DIR%\start-bridge.bat"
    )
) else (
    echo [X] Gagal menyalin beberapa berkas. Silakan coba kembali dengan hak Akses Pengguna.
    pause
)
