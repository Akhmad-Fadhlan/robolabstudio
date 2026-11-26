#!/usr/bin/env bash
# macOS double-clickable launcher for RoboLab Compiler Bridge
cd "$(dirname "$0")"
chmod +x ./start-bridge.sh 2>/dev/null || true
./start-bridge.sh
