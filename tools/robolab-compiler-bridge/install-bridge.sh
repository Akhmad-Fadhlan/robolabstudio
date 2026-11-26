#!/usr/bin/env bash
# =====================================================================
#       ROBOLAB COMPILER BRIDGE INSTALLER (macOS & Linux)
# =====================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "====================================================================="
echo "        PEMASANG ROBOLAB COMPILER BRIDGE (macOS & Linux)"
echo "====================================================================="
echo ""

chmod +x start-bridge.sh 2>/dev/null || true
chmod +x start-bridge.command 2>/dev/null || true
if [ -f "./bin/arduino-cli" ]; then
    chmod +x "./bin/arduino-cli" 2>/dev/null || true
fi

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[!] Node.js belum terpasang."
    if [ "$(uname -s)" = "Darwin" ]; then
        echo "    Instal dengan: brew install node  (atau dari https://nodejs.org)"
    else
        echo "    Instal dengan: sudo apt update && sudo apt install nodejs npm  (Ubuntu/Debian)"
        echo "               atau: sudo dnf install nodejs                       (Fedora)"
        echo "               atau: sudo pacman -S nodejs                         (Arch)"
    fi
else
    echo "[OK] Node.js ditemukan: $(node -v)"
fi

# 2. Linux USB Serial permissions (dialout / uucp)
if [ "$(uname -s)" = "Linux" ]; then
    echo "[*] Memeriksa izin port USB serial untuk Linux..."
    CURRENT_USER=$(whoami)
    if getent group dialout >/dev/null 2>&1; then
        sudo usermod -a -G dialout "$CURRENT_USER" 2>/dev/null && echo "[OK] Pengguna $CURRENT_USER ditambahkan ke grup dialout." || true
    elif getent group uucp >/dev/null 2>&1; then
        sudo usermod -a -G uucp "$CURRENT_USER" 2>/dev/null && echo "[OK] Pengguna $CURRENT_USER ditambahkan ke grup uucp." || true
    fi
fi

# 3. Create Shortcuts
if [ "$(uname -s)" = "Darwin" ]; then
    DESKTOP="$HOME/Desktop"
    if [ -d "$DESKTOP" ]; then
        ln -sf "$DIR/start-bridge.command" "$DESKTOP/RoboLab Compiler Bridge.command"
        echo "[OK] Pintasan berhasil dibuat di Desktop: $DESKTOP/RoboLab Compiler Bridge.command"
    fi
elif [ "$(uname -s)" = "Linux" ]; then
    APPS_DIR="$HOME/.local/share/applications"
    mkdir -p "$APPS_DIR" 2>/dev/null || true
    cat <<EOF > "$APPS_DIR/robolab-bridge.desktop"
[Desktop Entry]
Type=Application
Name=RoboLab Compiler Bridge
Comment=Bridge compiler native untuk RoboLab Studio Web
Exec=bash -c "cd '$DIR' && ./start-bridge.sh; exec bash"
Terminal=true
Icon=utilities-terminal
Categories=Development;Engineering;
EOF
    chmod +x "$APPS_DIR/robolab-bridge.desktop" 2>/dev/null || true
    echo "[OK] Launcher aplikasi dibuat di $APPS_DIR/robolab-bridge.desktop"
fi

echo ""
echo "====================================================================="
echo " Pemasangan selesai! Anda dapat menjalankan bridge dengan:"
echo " ./start-bridge.sh"
if [ "$(uname -s)" = "Darwin" ]; then
    echo " (Atau cukup double-klik 'RoboLab Compiler Bridge.command' di Desktop)"
fi
echo "====================================================================="
