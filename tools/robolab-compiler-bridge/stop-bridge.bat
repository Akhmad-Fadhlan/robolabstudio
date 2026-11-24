@echo off
title Hentikan RoboLab Compiler Bridge
echo Menghentikan proses RoboLab Compiler Bridge pada port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo [OK] Menghentikan PID %%a
)
echo Selesai.
timeout /t 2 >nul
