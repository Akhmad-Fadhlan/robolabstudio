#!/usr/bin/env bash
# =====================================================================
#       ROBOLAB STUDIO -- LOCAL COMPILER BRIDGE (macOS & Linux)
#       Menghubungkan RoboLab Web dengan Kompiler Hardware Native
# =====================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "====================================================================="
echo "      ROBOLAB STUDIO -- LOCAL COMPILER BRIDGE (macOS / Linux)"
echo "      Menghubungkan RoboLab Web dengan Kompiler Hardware Native"
echo "====================================================================="
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[X] Node.js tidak ditemukan di sistem."
    echo "    Silakan instal Node.js terlebih dahulu:"
    if [ "$(uname -s)" = "Darwin" ]; then
        echo "    * macOS: brew install node   (atau unduh dari https://nodejs.org)"
    else
        echo "    * Ubuntu/Debian: sudo apt update && sudo apt install nodejs npm"
        echo "    * Fedora: sudo dnf install nodejs"
        echo "    * Arch Linux: sudo pacman -S nodejs"
    fi
    echo ""
    read -p "Tekan Enter untuk keluar..."
    exit 1
fi

echo "[1/3] Node.js terdeteksi: $(node -v)"

# 2. Free Port 3001 if currently used
if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti:3001 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo "[!] Port 3001 sedang aktif (PID: $PID). Menghentikan proses lama..."
        kill -9 $PID 2>/dev/null || true
        sleep 1
    fi
elif command -v fuser >/dev/null 2>&1; then
    fuser -k 3001/tcp >/dev/null 2>&1 || true
fi

# 3. Check / Setup Arduino CLI
echo "[2/3] Memeriksa Arduino CLI..."
if [ -f "./bin/arduino-cli" ]; then
    chmod +x "./bin/arduino-cli" 2>/dev/null || true
    echo "      * Arduino CLI: Terpasang (lokal ./bin/arduino-cli)"
elif command -v arduino-cli >/dev/null 2>&1; then
    echo "      * Arduino CLI: Ditemukan di PATH ($(which arduino-cli))"
elif [ -f "/opt/homebrew/bin/arduino-cli" ]; then
    export PATH="/opt/homebrew/bin:$PATH"
    echo "      * Arduino CLI: Ditemukan di Homebrew (/opt/homebrew/bin)"
elif [ -f "/usr/local/bin/arduino-cli" ]; then
    export PATH="/usr/local/bin:$PATH"
    echo "      * Arduino CLI: Ditemukan di /usr/local/bin"
else
    echo "      * Mengunduh Arduino CLI resmi (standalone binary)..."
    mkdir -p bin
    if curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=./bin sh; then
        chmod +x "./bin/arduino-cli" 2>/dev/null || true
        echo "      * Arduino CLI berhasil dipasang di ./bin/arduino-cli!"
    else
        echo "      [!] Gagal mengunduh otomatis. Anda dapat memasang manual: 'brew install arduino-cli' atau via package manager."
    fi
fi

# 4. Check Linux USB permissions
if [ "$(uname -s)" = "Linux" ]; then
    CURRENT_USER=$(whoami)
    if ! groups "$CURRENT_USER" 2>/dev/null | grep -E '\b(dialout|uucp)\b' >/dev/null 2>&1; then
        echo ""
        echo "[!] Perhatian Linux: Pengguna '$CURRENT_USER' belum masuk ke grup 'dialout'."
        echo "    Jika RoboLab tidak dapat mengakses port USB, jalankan sekali:"
        echo "    sudo usermod -a -G dialout $CURRENT_USER"
        echo "    lalu log out dan log in kembali."
        echo ""
    fi
fi

echo "[3/3] Memulai server compiler bridge di http://localhost:3001 ..."
echo ""
echo "====================================================================="
echo " STATUS: AKTIF DAN SIAP!"
echo " Buka RoboLab Web (https://robolabstudio.vercel.app atau web lokal)."
echo " RoboLab Web akan OTOMATIS mendeteksi bridge ini pada port 3001."
echo ""
echo " * Semua kompilasi C++ (Blynk, ESP8266, ESP32, Arduino Uno/Nano/Mega)"
echo "   akan dieksekusi 100% native berkecepatan penuh."
echo " * Jangan tutup jendela terminal ini saat melakukan Verify / Upload."
echo "====================================================================="
echo ""

node compile-server.cjs
