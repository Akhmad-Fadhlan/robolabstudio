@echo off
title Hentikan RoboLab Compiler Bridge
echo Mengirim sinyal berhenti ke RoboLab Compiler Bridge pada port 3001...
curl -s -X POST http://127.0.0.1:3001/api/shutdown >nul 2>&1
echo Selesai.
timeout /t 2 >nul
