import network
import machine
import usocket as socket
import uhashlib
import ubinascii
import time

# ==========================================
# KONFIGURASI WIFI & PIN
# ==========================================
# Inisialisasi LED Pin 2 (Built-in LED ESP32)
led = machine.Pin(2, machine.Pin.OUT)
led.value(0)

# Inisialisasi DAC untuk Audio Pin 25
try:
    dac = machine.DAC(machine.Pin(25))
except Exception as e:
    print("DAC tidak tersedia:", e)
    dac = None

# Ganti dengan SSID dan Password WiFi Anda
ssid = "i"
password = "12345678"

# ==========================================
# SETUP KONEKSI WIFI
# ==========================================
wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(ssid, password)

print("Menghubungkan ke WiFi...")
while not wlan.isconnected():
    pass

ip_address = wlan.ifconfig()[0]
print("Terhubung! Buka di browser: http://" + ip_address)

# ==========================================
# HALAMAN HTML & JAVASCRIPT (CLIENT SIDE)
# ==========================================
html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>ESP32 Gemini AI</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #121212; color: #fff; display: flex; flex-direction: column; align-items: center; padding: 2rem; margin: 0; }
        .chat-box { width: 100%; max-width: 500px; background: #1e1e1e; border-radius: 12px; padding: 1rem; height: 300px; overflow-y: auto; margin-bottom: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .btn { background: #4a90e2; color: white; border: none; padding: 12px 24px; border-radius: 24px; font-size: 16px; cursor: pointer; transition: 0.3s; margin-top: 10px;}
        .btn:active { transform: scale(0.95); }
        .btn:disabled { background: #555; }
        .msg { margin-bottom: 10px; padding: 10px 14px; border-radius: 8px; max-width: 80%; word-wrap: break-word; font-size: 14px; line-height: 1.4;}
        .msg.user { background: #005c4b; margin-left: auto; border-bottom-right-radius: 2px;}
        .msg.ai { background: #202c33; margin-right: auto; border-bottom-left-radius: 2px;}
        h2 { margin-bottom: 10px; font-weight: 600;}
        p#status { margin-top: 15px; font-size: 13px; color: #aaa;}
    </style>
</head>
<body>
    <h2>ESP32 AI Voice Control</h2>
    <div class="chat-box" id="chat">
        <div class="msg ai">Halo! Saya asisten AI. Tekan tombol di bawah lalu ucapkan 'nyalakan lampu' atau 'matikan lampu'.</div>
    </div>
    <button class="btn" id="btnMic">Mulai Bicara 🎤</button>
    <p id="status"></p>

    <script>
        // API KEY PLACEHOLDER:
        const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
        
        // Inisialisasi WebSocket ke ESP32
        const ws = new WebSocket('ws://' + location.host + '/ws');
        ws.binaryType = 'arraybuffer'; // Setup ws to handle binary audio data
        
        const chat = document.getElementById('chat');
        const status = document.getElementById('status');
        const btnMic = document.getElementById('btnMic');

        ws.onopen = () => status.innerText = 'WebSocket: Terhubung ke ESP32';
        ws.onerror = () => status.innerText = 'WebSocket: Gagal terhubung';

        function addMsg(text, type) {
            const div = document.createElement('div');
            div.className = 'msg ' + type;
            div.innerText = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }

        // Fungsi TTS dan kirim PCM biner ke ESP32
        async function speakAndSend(text) {
            try {
                status.innerText = 'Mengubah teks ke suara (TTS)...';
                // Menggunakan Lingva API (Free Google Translate proxy) agar tidak terkena blokir CORS
                const lingvaUrl = `https://lingva.ml/api/v1/audio/id/${encodeURIComponent(text)}`;
                
                const res = await fetch(lingvaUrl);
                if (!res.ok) throw new Error("Gagal mengambil data audio TTS dari API");
                
                const data = await res.json();
                // Data audio dari API berupa array byte, konversi ke ArrayBuffer
                const arrayBuffer = new Uint8Array(data.audio).buffer;
                
                status.innerText = 'Memproses audio untuk format ESP32...';
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                
                // Downsample audio ke 8000 Hz Mono (supaya tidak berat di ESP32)
                const offlineCtx = new OfflineAudioContext(1, (audioBuffer.length / audioBuffer.sampleRate) * 8000, 8000);
                const source = offlineCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineCtx.destination);
                source.start();
                
                const resampled = await offlineCtx.startRendering();
                const rawData = resampled.getChannelData(0);
                
                // Konversi float PCM [-1.0, 1.0] ke nilai 8-bit unsigned [0, 255] untuk DAC
                const pcm8 = new Uint8Array(rawData.length);
                for (let i = 0; i < rawData.length; i++) {
                    let val = Math.max(-1, Math.min(1, rawData[i])); // clamp
                    pcm8[i] = Math.round((val + 1) * 127.5);
                }
                
                status.innerText = 'Memutar suara di ESP32...';
                // Kirim per chunk agar memori TCP/WebSocket ESP32 tidak langsung penuh
                const chunkSize = 1000;
                for (let i = 0; i < pcm8.length; i += chunkSize) {
                    const chunk = pcm8.slice(i, i + chunkSize);
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(chunk);
                    }
                    // Beri jeda 60ms (ESP32 memutar 1000 sampel dalam 125ms di 8kHz, jeda membantu buffering tanpa delay)
                    await new Promise(r => setTimeout(r, 60)); 
                }
                status.innerText = 'Selesai memutar suara.';
            } catch (e) {
                console.error("Error TTS:", e);
                status.innerText = 'Gagal memutar suara: ' + e.message;
            }
        }

        // Cek dukungan browser untuk Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if(SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'id-ID';
            recognition.continuous = false;

            btnMic.onclick = () => {
                recognition.start();
                btnMic.disabled = true;
                btnMic.innerText = 'Mendengarkan...';
                status.innerText = 'Silakan bicara...';
            };

            recognition.onresult = async (event) => {
                btnMic.disabled = false;
                btnMic.innerText = 'Mulai Bicara 🎤';
                
                const text = event.results[0][0].transcript;
                addMsg(text, 'user');

                // 1. Cek Perintah Kontrol Hardware (Kirim ke ESP32)
                const txtLower = text.toLowerCase();
                if(txtLower.includes('nyala') || txtLower.includes('hidup')) {
                    ws.send('LED_ON');
                } else if(txtLower.includes('mati') || txtLower.includes('padam')) {
                    ws.send('LED_OFF');
                }

                // 2. Kirim pesan ke Gemini API
                status.innerText = 'Menghubungi Gemini AI...';
                try {
                    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=' + GEMINI_API_KEY, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ contents: [{ parts: [{ text: text + " (Beri respons singkat maksimal 2 kalimat)" }] }] })
                    });
                    const data = await response.json();
                    
                    if (response.ok && data.candidates && data.candidates.length > 0) {
                        const aiReply = data.candidates[0].content.parts[0].text;
                        addMsg(aiReply, 'ai');
                        // 3. Putar TTS dari respons AI (Kirim audio ke ESP32)
                        speakAndSend(aiReply);
                    } else {
                        const errMsg = data.error ? data.error.message : "Respons tidak valid";
                        throw new Error(errMsg);
                    }
                } catch(e) {
                    addMsg("Maaf, gagal menghubungi AI.", "ai");
                    status.innerText = 'Error API: ' + e.message;
                    console.error("Gemini API Error:", e);
                }
            };
            
            recognition.onerror = (e) => {
                btnMic.disabled = false;
                btnMic.innerText = 'Mulai Bicara 🎤';
                status.innerText = 'Error Mic: ' + e.error;
            };
        } else {
            status.innerText = 'Browser Anda tidak mendukung Voice Recognition. Silakan gunakan Google Chrome.';
            btnMic.disabled = true;
        }
    </script>
</body>
</html>"""

# ==========================================
# WEBSOCKET & HTTP SERVER (MICROPYTHON)
# ==========================================
def handle_client(s):
    try:
        req = s.recv(1024).decode('utf-8', 'ignore')
        if not req: return False
        
        if 'Upgrade: websocket' in req:
            key = ""
            for line in req.split('\r\n'):
                if 'Sec-WebSocket-Key:' in line:
                    key = line.split(': ')[1].strip()
            
            if key:
                magic = key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
                resp_key = ubinascii.b2a_base64(uhashlib.sha1(magic.encode()).digest())[:-1].decode()
                
                resp = "HTTP/1.1 101 Switching Protocols\r\n"
                resp += "Upgrade: websocket\r\n"
                resp += "Connection: Upgrade\r\n"
                resp += "Sec-WebSocket-Accept: " + resp_key + "\r\n\r\n"
                
                s.send(resp.encode())
                return True
                
        elif 'GET / ' in req:
            s.send("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\nConnection: close\r\n\r\n".encode() + html.encode())
            s.close()
            return False
    except Exception as e:
        print("Error HTTP/Handshake:", e)
    return False

# Fungsi pembantu untuk membaca ukuran byte tertentu dari stream socket
def read_exact(conn, size):
    res = b''
    while len(res) < size:
        chunk = conn.recv(size - len(res))
        if not chunk: return None
        res += chunk
    return res

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(('', 80))
sock.listen(1)

print("Server Web/WebSocket berjalan. Menunggu koneksi...")

while True:
    conn, addr = sock.accept()
    
    if handle_client(conn):
        print("Klien WebSocket terhubung dari", addr)
        conn.settimeout(None) # Bloking read untuk stream yang stabil
        
        while True:
            try:
                # 1. Baca 2 byte header utama WebSocket
                header = read_exact(conn, 2)
                if not header: break
                
                opcode = header[0] & 0x0F
                payload_len = header[1] & 127
                
                # 2. Baca extended payload length jika perlu
                if payload_len == 126:
                    ext = read_exact(conn, 2)
                    if not ext: break
                    payload_len = (ext[0] << 8) | ext[1]
                elif payload_len == 127:
                    ext = read_exact(conn, 8)
                    break # Skip extended 64-bit length (Terlalu besar untuk RAM ESP32)
                    
                has_mask = (header[1] & 128) > 0
                if has_mask:
                    masks = read_exact(conn, 4)
                    if not masks: break
                    
                # 3. Baca payload asli sebesar payload_len
                payload = read_exact(conn, payload_len)
                if not payload: break
                
                # 4. Unmask data jika diperlukan
                if has_mask:
                    msg_bytes = bytearray(payload)
                    for i in range(payload_len):
                        msg_bytes[i] ^= masks[i % 4]
                else:
                    msg_bytes = payload
                    
                # 5. Eksekusi perintah berdasarkan tipe (opcode)
                if opcode == 1: # Text frame (Kontrol LED dll)
                    cmd = msg_bytes.decode('utf-8', 'ignore')
                    print("Pesan WS Diterima:", cmd)
                    
                    if cmd == 'LED_ON':
                        led.value(1)
                        print("-> LED Dinyalakan")
                    elif cmd == 'LED_OFF':
                        led.value(0)
                        print("-> LED Dimatikan")
                        
                elif opcode == 2: # Binary frame (Audio Streaming PCM 8-bit)
                    # Output langsung ke DAC untuk diputar
                    if dac:
                        for val in msg_bytes:
                            dac.write(val)
                            time.sleep_us(125) # Sampling Rate 8000 Hz = 125 mikrodetik / sampel
                            
                elif opcode == 8: # Close frame
                    break
                    
            except Exception as e:
                # Klien disconnect / Error jaringan
                break
                
        print("Klien WebSocket terputus")
        conn.close()
