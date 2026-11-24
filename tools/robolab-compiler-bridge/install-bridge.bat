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
echo [1/5] Menyiapkan direktori instalasi di:
echo       %TARGET_DIR%
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/5] Menyalin berkas modul compiler & toolchain...
xcopy /E /I /Y "%~dp0*" "%TARGET_DIR%\" >nul 2>&1

:: 3. Check CH340 Driver
echo [3/5] Memeriksa driver USB CH340 (NodeMCU & Arduino Nano)...
set "CH340_EXISTS=0"
if exist "%SystemRoot%\System32\drivers\CH341S64.SYS" set "CH340_EXISTS=1"
if exist "%SystemRoot%\System32\drivers\CH341SER.SYS" set "CH340_EXISTS=1"
if exist "%SystemRoot%\System32\drivers\CH341S98.SYS" set "CH340_EXISTS=1"
pnputil /enum-drivers | findstr /i "ch341ser.inf ch343ser.inf wch.cn" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "CH340_EXISTS=1"

if "!CH340_EXISTS!"=="1" (
    echo       [OK] Driver CH340 sudah terpasang di sistem ^(Dilewati, tidak diinstal ulang^).
) else (
    echo       [!] Driver CH340 belum terdeteksi. Memasang driver CH340...
    if exist "%TARGET_DIR%\drivers\ch340\CH341SER.INF" (
        pnputil /add-driver "%TARGET_DIR%\drivers\ch340\CH341SER.INF" /install >nul 2>&1
        echo       [OK] Driver CH340 berhasil dipasang.
    )
)

:: 4. Check CP2102 Driver
echo [4/5] Memeriksa driver USB CP2102 (ESP32 & NodeMCU V2)...
set "CP2102_EXISTS=0"
if exist "%SystemRoot%\System32\drivers\silabser.sys" set "CP2102_EXISTS=1"
reg query "HKLM\SYSTEM\CurrentControlSet\Services\silabser" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "CP2102_EXISTS=1"
pnputil /enum-drivers | findstr /i "silabser.inf" >nul 2>&1
if %ERRORLEVEL% EQU 0 set "CP2102_EXISTS=1"

if "!CP2102_EXISTS!"=="1" (
    echo       [OK] Driver CP2102 sudah terpasang di sistem ^(Dilewati, tidak diinstal ulang^).
) else (
    echo       [!] Driver CP2102 belum terdeteksi. Memasang driver CP2102...
    if exist "%TARGET_DIR%\drivers\cp2102\silabser.inf" (
        pnputil /add-driver "%TARGET_DIR%\drivers\cp2102\silabser.inf" /install >nul 2>&1
        echo       [OK] Driver CP2102 berhasil dipasang.
    )
)

echo [5/5] Membuat pintasan (shortcut) di Desktop dan Start Menu...
set "EXE_TARGET=%TARGET_DIR%\RoboLabBridge.exe"
if not exist "!EXE_TARGET!" set "EXE_TARGET=%TARGET_DIR%\start-bridge.bat"

set "VBS_SCRIPT=%TEMP%\create_robolab_shortcut.vbs"
(
    echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
    echo sLinkFile = oWS.SpecialFolders^("Desktop"^) ^& "\RoboLab Compiler Bridge.lnk"
    echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
    echo oLink.TargetPath = "!EXE_TARGET!"
    echo oLink.WorkingDirectory = "%TARGET_DIR%"
    echo oLink.Description = "RoboLab Studio - Local Compiler Bridge"
    echo oLink.WindowStyle = 1
    echo oLink.Save
    echo.
    echo sPrograms = oWS.SpecialFolders^("Programs"^)
    echo sLinkFile2 = sPrograms ^& "\RoboLab Compiler Bridge.lnk"
    echo Set oLink2 = oWS.CreateShortcut^(sLinkFile2^)
    echo oLink2.TargetPath = "!EXE_TARGET!"
    echo oLink2.WorkingDirectory = "%TARGET_DIR%"
    echo oLink2.Description = "RoboLab Studio - Local Compiler Bridge"
    echo oLink2.Save
) > "%VBS_SCRIPT%"
cscript //nologo "%VBS_SCRIPT%" >nul 2>&1
del "%VBS_SCRIPT%" >nul 2>&1

echo.
echo =====================================================================
echo  PEMASANGAN BERHASIL! [SUKSES]
echo.
echo  Pintasan "RoboLab Compiler Bridge" telah dibuat di Desktop Anda.
echo  Bridge berjalan di latar belakang (ikon di System Tray dekat jam).
echo  Menutup jendela ini TIDAK akan mematikan server compiler!
echo =====================================================================
echo.
set /p "LAUNCH=Jalankan RoboLab Compiler Bridge sekarang? (Y/N): "
if /i "!LAUNCH!"=="Y" (
    start "" "!EXE_TARGET!"
)
