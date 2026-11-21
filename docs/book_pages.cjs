// book_pages.cjs - All 20 Pages content for RoboLab Studio IoT Book
const assets = require('./book_assets.cjs');
const blocks = require('./book_blocks.cjs');

const { mascotSVG, arduinoUnoSVG, esp32BoardSVG, breadboardSVG, circuitBlinkSVG, circuitButtonSVG, circuitLdrSVG, circuitPotentiometerSVG, circuitServoSVG, circuitUltrasonicLcdSVG, circuitBlynkSVG } = assets;
const { pillInput, reporterPill, stmtBlock, cBlock, tipsBox, pageHeader, pageFooter } = blocks;

function renderPage(pageNum, contentHtml, chapterNum = '', chapterTitle = '') {
  if (pageNum === 1) {
    // Cover page has special layout
    return `<div class="page page-cover">${contentHtml}</div>`;
  }
  return `
    <div class="page page-${pageNum}">
      ${pageHeader(chapterNum, chapterTitle)}
      <div class="page-body">
        ${contentHtml}
      </div>
      ${pageFooter(pageNum, 20)}
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: COVER
// ─────────────────────────────────────────────────────────────────────────────
const page1_Cover = `
  <div class="cover-container">
    <div class="cover-badge-top">
      <span>🚀 Edisi Resmi Pembelajaran Robotika & IoT 2026</span>
    </div>
    
    <div class="cover-title-group">
      <div class="cover-pretitle">PANDUAN VISUAL LENGKAP & SERU</div>
      <h1 class="cover-main-title">PETUALANGAN BELAJAR<br><span class="highlight-text">IOT & ROBOTIKA</span></h1>
      <div class="cover-subtitle">Dari Pemrograman Blok Visual RoboLab Studio, Arduino Dasar, Hingga Kendali Jarak Jauh Blynk IoT di Smartphone!</div>
    </div>

    <div class="cover-hero-illustration">
      <div class="cover-mascot-wrap">
        ${mascotSVG('iot', 130)}
      </div>
      <div class="cover-puzzle-badges">
        <div class="puzzle-badge" style="background:#FF6680; top:10px; left:10px;">void setup() { }</div>
        <div class="puzzle-badge" style="background:#FFAB19; top:50px; right:10px;">void loop() { }</div>
        <div class="puzzle-badge" style="background:#9966FF; bottom:40px; left:20px;">digitalWrite Pin 13</div>
        <div class="puzzle-badge" style="background:#22C55E; bottom:10px; right:20px;">Blynk IoT Online 📱</div>
      </div>
    </div>

    <div class="cover-features-grid">
      <div class="feat-card">
        <div class="feat-icon">🧩</div>
        <div class="feat-title">100% Visual Blok</div>
        <div class="feat-desc">Menyusun logika seperti bermain puzzle tanpa pusing sintaks!</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">⚡</div>
        <div class="feat-title">Praktik Rangkaian</div>
        <div class="feat-desc">Dilengkapi diagram skema kabel warna-warni yang sangat jelas.</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">🌐</div>
        <div class="feat-title">Proyek IoT Nyata</div>
        <div class="feat-desc">Kontrol lampu kamar & sensor lewat HP via Blynk & ESP32.</div>
      </div>
      <div class="feat-card">
        <div class="feat-icon">🧒</div>
        <div class="feat-title">Kids & Beginner Friendly</div>
        <div class="feat-desc">Bahasa santai, penuh analogi seru, dan karakter pendamping ramah!</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Diterbitkan oleh: <strong>RoboLab Studio Education Team</strong></div>
      <div class="cover-platform-pill">RoboLab Studio v0.9.2 Compatible</div>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: SAMBUTAN & ROADMAP 8 LEVEL
// ─────────────────────────────────────────────────────────────────────────────
const page2_Welcome = `
  <div class="welcome-box">
    <div style="display:flex; align-items:center; gap:16px;">
      ${mascotSVG('happy', 75)}
      <div>
        <h2 style="margin:0 0 4px 0; color:#0284C7; font-family:'Fredoka',sans-serif; font-size:20px;">Halo Sahabat Calon Penemu Masa Depan! 👋</h2>
        <p style="margin:0; font-size:12px; color:#475569; line-height:1.4;">
          Namaku <strong>RoboBot</strong>, asisten cerdasmu di <strong>RoboLab Studio</strong>! Di buku ini, kamu akan diajak bertualang dari nol merakit sirkuit listrik hingga membuat perangkat pintar yang bisa kamu kendalikan dari ponselmu lewat internet. Siap jadi Master IoT cilik?
        </p>
      </div>
    </div>
  </div>

  <div class="section-title">🗺️ Peta Petualangan 8 Level Belajar Kita:</div>

  <div class="roadmap-grid">
    <div class="road-step" style="border-left-color:#FF6680;">
      <div class="road-num" style="background:#FF6680;">1</div>
      <div class="road-info">
        <strong>Level 1: Mengenal Studio & Anatomi Blok</strong>
        <span>Memahami antarmuka RoboLab Studio dan puzzle pemrograman.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#FFAB19;">
      <div class="road-num" style="background:#FFAB19;">2</div>
      <div class="road-info">
        <strong>Level 2: Dua Jantung: Setup & Loop</strong>
        <span>Rahasia di balik fungsi yang jalan sekali vs berulang selamanya.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#9966FF;">
      <div class="road-num" style="background:#9966FF;">3</div>
      <div class="road-info">
        <strong>Level 3: Otak Robot & Lampu Pertama (Blink LED)</strong>
        <span>Kenalan dengan Arduino Uno dan menyalakan LED berkedip ceria.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#3B82F6;">
      <div class="road-num" style="background:#3B82F6;">4</div>
      <div class="road-info">
        <strong>Level 4: Saklar Pintar (Tombol & Logika If-Else)</strong>
        <span>Mengajari mikrokontroler mengambil keputusan jika tombol ditekan.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#EAB308;">
      <div class="road-num" style="background:#EAB308;">5</div>
      <div class="road-info">
        <strong>Level 5: Merasakan Dunia Nyata (Sensor LDR & Potensio)</strong>
        <span>Membaca nilai analog cahaya dan mengatur redup-terang lampu (PWM).</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#E040FB;">
      <div class="road-num" style="background:#E040FB;">6</div>
      <div class="road-info">
        <strong>Level 6: Suara Alarm & Lengan Robotik (Buzzer & Servo)</strong>
        <span>Memainkan nada musik dan memutar sudut motor servo 0°-180°.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#06B6D4;">
      <div class="road-num" style="background:#06B6D4;">7</div>
      <div class="road-info">
        <strong>Level 7: Mata Kelelawar & Layar Teks (Ultrasonik & LCD)</strong>
        <span>Mengukur jarak benda tanpa sentuhan dan mencetak teks di layar LCD.</span>
      </div>
    </div>
    <div class="road-step" style="border-left-color:#22C55E;">
      <div class="road-num" style="background:#22C55E;">8</div>
      <div class="road-info">
        <strong>Level 8: Master IoT Blynk & ESP32 di Smartphone</strong>
        <span>Menghubungkan robot ke internet dan mengontrolnya dari jarak jauh!</span>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Tiga Kunci Sukses Belajar Robotika:', `
    <strong>1. Jangan Takut Salah:</strong> Jika kabel atau blok keliru, robot tidak akan marah! Periksa lagi dan coba lagi.<br>
    <strong>2. Amati Warnanya:</strong> Setiap kategori blok di RoboLab Studio memiliki warna khas yang memandumu.<br>
    <strong>3. Lakukan Eksperimen:</strong> Ubah angka delay atau nilai pin untuk melihat perubahan seru yang terjadi!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: BAB 1 - MENGENAL ROBOLAB STUDIO
// ─────────────────────────────────────────────────────────────────────────────
const page3_StudioBlocks = `
  <div class="two-col-layout">
    <div>
      <h3 class="subheading">Apa Itu Pemrograman Blok?</h3>
      <p class="text-sm">
        Jika biasanya para programmer dewasa harus mengetik ratusan baris kode teks yang rumit dan sering error hanya karena lupa tanda titik koma (<code>;</code>), di <strong>RoboLab Studio</strong> kita belajar menggunakan <strong>Blok Visual</strong>!
      </p>
      <p class="text-sm">
        Blok visual bekerja persis seperti <strong>potongan puzzle LEGO</strong>. Blok hanya bisa saling menempel jika logikanya sesuai. Ini membuat belajar coding jadi sangat mudah, aman, dan menyenangkan untuk siapa saja!
      </p>
    </div>
    <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC;">
      <h4 style="margin:0 0 6px 0; color:#166534; font-size:13px;">🎯 Keunggulan RoboLab Studio:</h4>
      <ul style="margin:0; padding-left:18px; font-size:11.5px; color:#14532D; line-height:1.5;">
        <li>Menyusun logika dengan drag-and-drop puzzle.</li>
        <li>Otomatis menghasilkan kode C++ Arduino & MicroPython.</li>
        <li>Tersedia simulator interaktif & serial monitor langsung.</li>
        <li>Mendukung board Uno, Nano, ESP32, hingga ESP8266.</li>
      </ul>
    </div>
  </div>

  <h3 class="subheading" style="margin-top:14px;">Anatomi 4 Jenis Blok di RoboLab Studio:</h3>

  <div class="anatomy-grid">
    <div class="anatomy-card" style="border-top:4px solid #FF6680;">
      <div class="anatomy-header">1. Blok Struktur (C-Block)</div>
      <div class="anatomy-body">
        <div style="font-size:11px; margin-bottom:8px; color:#64748B;">Berbentuk huruf 'C' dengan wadah di dalamnya untuk meletakkan blok perintah lain.</div>
        ${cBlock('#FF6680', 'void setup() {', stmtBlock('#4CBFE6', 'Serial.println ' + pillInput('"Halo!"')), '}')}
      </div>
    </div>

    <div class="anatomy-card" style="border-top:4px solid #9966FF;">
      <div class="anatomy-header">2. Blok Perintah (Statement)</div>
      <div class="anatomy-body">
        <div style="font-size:11px; margin-bottom:8px; color:#64748B;">Memiliki lekuk puzzle di atas dan bawahnya. Berisi instruksi aksi yang dijalankan mikrokontroler.</div>
        ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
        <div style="margin-top:6px;"></div>
        ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
      </div>
    </div>

    <div class="anatomy-card" style="border-top:4px solid #A855F7;">
      <div class="anatomy-header">3. Blok Nilai (Reporter Pill)</div>
      <div class="anatomy-body">
        <div style="font-size:11px; margin-bottom:8px; color:#64748B;">Berbentuk kapsul bulat lonjong. Mengembalikan data angka atau status (HIGH/LOW) untuk dipasang ke blok lain.</div>
        <div style="display:flex; flex-direction:column; gap:6px;">
          ${reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0'))}
          ${reporterPill('#A855F7', 'Read Ultrasonic Trig ' + pillInput('12') + ' Echo ' + pillInput('13'))}
        </div>
      </div>
    </div>

    <div class="anatomy-card" style="border-top:4px solid #4C97FF;">
      <div class="anatomy-header">4. Blok Logika & Percabangan</div>
      <div class="anatomy-body">
        <div style="font-size:11px; margin-bottom:8px; color:#64748B;">Mengambil keputusan berdasarkan syarat tertentu (Jika kondisi benar, maka lakukan aksi).</div>
        ${cBlock('#4C97FF', 'jika ' + reporterPill('#3B82F6', 'Tombol == HIGH') + ' maka', stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true)), 'selain itu...')}
      </div>
    </div>
  </div>

  ${tipsBox('happy', 'Tips Menempelkan Blok di Workspace:', `
    Arahkan lekuk puzzle blok baru mendekati lekuk blok yang sudah ada sampai muncul bayangan putih/kuning bersinar, lalu lepaskan mouse! Blok akan menempel secara otomatis dengan bunyi <em>'klik'</em> yang memuaskan.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4: BAB 2 - DUA JANTUNG PROGRAM: SETUP & LOOP
// ─────────────────────────────────────────────────────────────────────────────
const page4_SetupLoop = `
  <div class="two-col-layout">
    <div>
      <h3 class="subheading" style="margin-top:0;">Dua Sahabat Sejati: Setup & Loop</h3>
      <p class="text-sm">
        Setiap program mikrokontroler di dunia (mulai dari robot mainan hingga satelit luar angkasa!) selalu memiliki dua bagian terpenting: <strong>void setup()</strong> dan <strong>void loop()</strong>.
      </p>
      <p class="text-sm">
        Mari kita pahami perbedaannya dengan analogi kegiatan sehari-hari yang sangat mudah dibayangkan!
      </p>
    </div>
    <div class="highlight-card" style="background:#FFFBEB; border-color:#FCD34D;">
      <div style="font-size:12px; font-weight:bold; color:#B45309; margin-bottom:4px;">⏱️ Waktu Eksekusi:</div>
      <div style="font-size:11.5px; color:#92400E;">
        • <strong>setup()</strong>: Berjalan <strong>HANYA 1 KALI</strong> saat robot pertama dinyalakan.<br>
        • <strong>loop()</strong>: Berjalan <strong>TERUS MENERUS BERULANG-ULANG</strong> sampai baterai habis!
      </div>
    </div>
  </div>

  <div class="comparison-grid">
    <!-- SETUP CARD -->
    <div class="comp-card" style="border-top:5px solid #FF6680;">
      <div class="comp-badge" style="background:#FF6680;">JANTUNG 1: PERSIS SEPERTI BANGUN TIDUR</div>
      <h4 style="margin:8px 0 4px 0; color:#E11D48; font-family:'Fredoka',sans-serif; font-size:16px;">void setup() { ... }</h4>
      <p class="text-xs" style="color:#64748B; margin-bottom:10px;">
        Ketika kamu bangun di pagi hari, kamu mencuci muka, merapikan baju seragam, dan memakai sepatu. Kamu <strong>hanya melakukannya satu kali saja</strong> sebelum berangkat sekolah, bukan mengulang pakai sepatu setiap menit, kan?
      </p>

      <div class="block-preview-box">
        ${cBlock('#FF6680', 'void setup() {', `
          ${stmtBlock('#4CBFE6', 'Serial.println ' + pillInput('"Robot Siap Beraksi!"'))}
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('LOW', true))}
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Kode C++ Arduino Ekuivalen:</div>
        <pre>void setup() {\n  Serial.begin(115200);\n  Serial.println("Robot Siap!");\n  pinMode(13, OUTPUT);\n}</pre>
      </div>
    </div>

    <!-- LOOP CARD -->
    <div class="comp-card" style="border-top:5px solid #FFAB19;">
      <div class="comp-badge" style="background:#FFAB19;">JANTUNG 2: PERSIS SEPERTI DETAK JANTUNG</div>
      <h4 style="margin:8px 0 4px 0; color:#D97706; font-family:'Fredoka',sans-serif; font-size:16px;">void loop() { ... }</h4>
      <p class="text-xs" style="color:#64748B; margin-bottom:10px;">
        Setelah siap, kamu mulai bernapas, berjalan, melihat sekeliling, dan berkedip. Kegiatan ini dilakukan <strong>berulang kali tanpa henti</strong> sepanjang hari. Inilah tugas dari <code>void loop()</code>!
      </p>

      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('LOW', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Kode C++ Arduino Ekuivalen:</div>
        <pre>void loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n  digitalWrite(13, LOW);\n  delay(1000);\n}</pre>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Eksperimen Seru: Apa yang Terjadi Jika...?', `
    Jika kamu memindahkan blok kedip LED ke dalam <code>void setup()</code>, lampu hanya akan menyala lalu mati <strong>satu kali saja</strong> saat dinyalakan, lalu robot akan terdiam selamanya! Karena itu, semua aksi yang ingin dilakukan berulang (seperti membaca sensor atau kedip lampu) harus ditaruh di dalam <code>void loop()</code>!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5: BAB 3 - MENGENAL OTAK ROBOT: ARDUINO & MIKROKONTROLER
// ─────────────────────────────────────────────────────────────────────────────
const page5_Microcontrollers = `
  <div class="two-col-layout">
    <div>
      <h3 class="subheading" style="margin-top:0;">Apa Itu Mikrokontroler?</h3>
      <p class="text-sm">
        Jika komputer desktop atau laptop di rumahmu memiliki monitor besar, keyboard, dan kipas pendingin, <strong>Mikrokontroler</strong> adalah <em>komputer mini lengkap dalam satu keping chip kecil</em>!
      </p>
      <p class="text-sm">
        Di dalamnya sudah ada Processor (otak berpikir), RAM (ingatan sementara), dan Flash Memory (penyimpan program). Hebatnya lagi, ia memiliki pin-pin logam ajaib untuk mengendalikan lampu, motor, sensor, hingga koneksi internet!
      </p>
    </div>
    <div style="display:flex; justify-content:center; align-items:center;">
      ${arduinoUnoSVG(220, 135)}
    </div>
  </div>

  <h3 class="subheading" style="margin-top:10px;">Empat Bintang Mikrokontroler yang Sering Digunakan:</h3>

  <div class="board-grid">
    <!-- ARDUINO UNO -->
    <div class="board-card">
      <div class="board-badge" style="background:#00878F;">POPULER & RAMAH PEMULA</div>
      <h4 class="board-name">Arduino UNO R3</h4>
      <p class="board-desc">
        Papan paling legendaris di dunia! Komponennya kuat, pin soketnya besar sehingga mudah ditusuk kabel jumper tanpa takut patah. Pilihan terbaik untuk belajar pertama kali.
      </p>
      <div class="board-specs">
        <span>⚡ Tegangan: 5 Volt</span>
        <span>🧠 Chip: ATmega328P</span>
        <span>📍 Pin: 14 Digital, 6 Analog</span>
      </div>
    </div>

    <!-- ARDUINO NANO -->
    <div class="board-card">
      <div class="board-badge" style="background:#0284C7;">MUNGIL & RINGAN</div>
      <h4 class="board-name">Arduino Nano</h4>
      <p class="board-desc">
        Saudara kembar Arduino Uno tapi dalam ukuran sekecil jempol tangan! Fungsinya persis sama, sangat cocok untuk dipasang langsung di atas breadboard atau badan robot kecil.
      </p>
      <div class="board-specs">
        <span>⚡ Tegangan: 5 Volt</span>
        <span>🧠 Ukuran: Sangat Mungil</span>
        <span>📍 Pin: 14 Digital, 8 Analog</span>
      </div>
    </div>

    <!-- ESP8266 -->
    <div class="board-card">
      <div class="board-badge" style="background:#D97706;">WIFI TERJANGKAU</div>
      <h4 class="board-name">ESP8266 (NodeMCU)</h4>
      <p class="board-desc">
        Papan pintar pertama yang membawa teknologi WiFi murah! Sangat disukai pembuat proyek saklar pintar lampu rumah tangga yang terhubung ke jaringan internet lokal.
      </p>
      <div class="board-specs">
        <span>⚡ Tegangan: 3.3 Volt</span>
        <span>📶 Fitur: WiFi 2.4 GHz</span>
        <span>📍 Pin: 10 Digital, 1 Analog</span>
      </div>
    </div>

    <!-- ESP32 -->
    <div class="board-card" style="border:2px solid #22C55E;">
      <div class="board-badge" style="background:#22C55E;">MONSTER IOT TERBAIK</div>
      <h4 class="board-name">ESP32 DevKit V1</h4>
      <p class="board-desc">
        Raja dari segala papan IoT! Memiliki prosesor Dual-Core super kencang, koneksi WiFi + Bluetooth, dan memori raksasa. Sangat cocok untuk proyek Blynk dan smart home!
      </p>
      <div class="board-specs">
        <span>⚡ Tegangan: 3.3 Volt</span>
        <span>🚀 Kecepatan: 240 MHz Dual-Core</span>
        <span>📶 Fitur: WiFi + Bluetooth BLE</span>
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Peringatan Tegangan Penting (5V vs 3.3V):', `
    Arduino Uno bekerja dengan tegangan <strong>5 Volt</strong>, sedangkan ESP32 dan ESP8266 bekerja dengan tegangan <strong>3.3 Volt</strong>. Jangan pernah memberikan tegangan 5V langsung ke pin data ESP32 tanpa hambatan agar chip pintarmu tetap awet dan tidak kepanasan!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6: BAB 3 - PINOUT & BREADBOARD
// ─────────────────────────────────────────────────────────────────────────────
const page6_PinoutBreadboard = `
  <div class="two-col-layout">
    <div>
      <h3 class="subheading" style="margin-top:0;">Membedah Pin-Pin Pada Arduino Uno:</h3>
      <div class="pin-category-list">
        <div class="pin-cat-item">
          <span class="pin-tag" style="background:#EF4444;">Daya & Ground</span>
          <div class="pin-cat-desc">
            <strong>5V / 3.3V:</strong> Sumber kutub positif listrik pembawa tenaga.<br>
            <strong>GND (Ground):</strong> Kutub negatif listrik penutup sirkuit (wajib ada!).
          </div>
        </div>
        <div class="pin-cat-item">
          <span class="pin-tag" style="background:#9966FF;">Digital (0 - 13)</span>
          <div class="pin-cat-desc">
            Hanya mengenal 2 kondisi pasti: <strong>HIGH (5V/ON)</strong> atau <strong>LOW (0V/OFF)</strong>. Contoh: Tombol, LED, Relay.
          </div>
        </div>
        <div class="pin-cat-item">
          <span class="pin-tag" style="background:#F59E0B;">PWM (~3, ~5, ~6, ~9, ~10, ~11)</span>
          <div class="pin-cat-desc">
            Pin digital bertanda cacing <code>~</code> yang bisa menyimulasikan kehalusan daya (0-255). Contoh: Redup lampu, servo.
          </div>
        </div>
        <div class="pin-cat-item">
          <span class="pin-tag" style="background:#10B981;">Analog Input (A0 - A5)</span>
          <div class="pin-cat-desc">
            Membaca rentang tegangan halus dari <strong>0 hingga 1023</strong>. Contoh: Sensor cahaya LDR, potensiometer, sensor suhu.
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 class="subheading" style="margin-top:0;">Rahasia Breadboard: Papan Bebas Solder!</h3>
      <p class="text-xs" style="color:#64748B; margin-bottom:8px;">
        Breadboard adalah papan tempat kita merangkai komponen tanpa perlu menyolder. Di balik lubang-lubangnya, ada lempengan logam penjepit yang terhubung secara rahasia!
      </p>
      <div style="display:flex; justify-content:center; margin-bottom:8px;">
        ${breadboardSVG(250, 95)}
      </div>
      <div class="highlight-card" style="background:#EFF6FF; border-color:#BFDBFE; font-size:11px;">
        <strong>🔴 Rel Daya (+ dan -):</strong> Terhubung secara <strong>VERTIKAL</strong> memanjang dari ujung ke ujung untuk menyalurkan 5V dan GND ke semua komponen.<br>
        <strong>⚪ Jalur Terminal (a-b-c-d-e):</strong> Terhubung secara <strong>HORIZONTAL</strong> per baris 5 lubang untuk memasang kaki komponen.
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Aturan Emas: Mencegah Korsleting Listrik (Short Circuit)!', `
    Jangan pernah menghubungkan kabel dari pin <strong>5V</strong> langsung ke pin <strong>GND</strong> tanpa ada beban (seperti resistor atau lampu LED di tengahnya)! Menghubungkan kutub positif dan negatif secara langsung disebut <em>Short Circuit</em>, yang bisa membuat kabel menjadi panas dan chip mikrokontroler mati mendadak!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7: BAB 4 - EMPAT JURUS SAKTI: INPUT vs OUTPUT, DIGITAL vs ANALOG
// ─────────────────────────────────────────────────────────────────────────────
const page7_InputOutputMatrix = `
  <div style="text-align:center; margin-bottom:12px;">
    <p class="text-sm" style="color:#475569; margin:0 auto; max-width:600px;">
      Semua komponen elektronika di alam semesta ini pasti masuk ke dalam salah satu dari <strong>4 kotak ajaib</strong> di bawah ini. Sekali kamu memahami matriks ini, kamu bisa merakit alat apa saja!
    </p>
  </div>

  <div class="matrix-grid">
    <!-- 1. DIGITAL OUTPUT -->
    <div class="matrix-card" style="border-top:5px solid #EC4899;">
      <div class="matrix-head">
        <span class="matrix-type">DIGITAL OUTPUT (DO)</span>
        <span class="matrix-pill" style="background:#EC4899;">Perintah Pasti ON/OFF</span>
      </div>
      <p class="matrix-desc">Mikrokontroler memberikan perintah saklar listrik tegas: Hidup (HIGH) atau Mati (LOW).</p>
      <div class="matrix-examples">
        <strong>Contoh Komponen:</strong> Lampu LED, Relay Saklar Listrik, Pompa Air Mini, Solenoid Lock.
      </div>
      <div class="matrix-block-wrap">
        ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
      </div>
    </div>

    <!-- 2. DIGITAL INPUT -->
    <div class="matrix-card" style="border-top:5px solid #8B5CF6;">
      <div class="matrix-head">
        <span class="matrix-type">DIGITAL INPUT (DI)</span>
        <span class="matrix-pill" style="background:#8B5CF6;">Deteksi Ada / Tidak Ada</span>
      </div>
      <p class="matrix-desc">Mikrokontroler membaca status sensor apakah sedang aktif (HIGH) atau mati (LOW).</p>
      <div class="matrix-examples">
        <strong>Contoh Komponen:</strong> Tombol Tekan (Push Button), Sensor Halangan Inframerah, Saklar Magnet Pintu.
      </div>
      <div class="matrix-block-wrap">
        ${reporterPill('#9966FF', 'digitalRead Pin ' + pillInput('2'))}
      </div>
    </div>

    <!-- 3. ANALOG INPUT -->
    <div class="matrix-card" style="border-top:5px solid #10B981;">
      <div class="matrix-head">
        <span class="matrix-type">ANALOG INPUT (AI)</span>
        <span class="matrix-pill" style="background:#10B981;">Rentang Halus: 0 - 1023</span>
      </div>
      <p class="matrix-desc">Mikrokontroler mengukur seberapa banyak nilai fisik di alam nyata dalam bentuk angka bertingkat.</p>
      <div class="matrix-examples">
        <strong>Contoh Komponen:</strong> Sensor Cahaya LDR, Potensiometer Putar, Sensor Suhu LM35, Sensor Kualitas Air TDS.
      </div>
      <div class="matrix-block-wrap">
        ${reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0'))}
      </div>
    </div>

    <!-- 4. ANALOG OUTPUT (PWM) -->
    <div class="matrix-card" style="border-top:5px solid #F59E0B;">
      <div class="matrix-head">
        <span class="matrix-type">ANALOG OUTPUT / PWM (AO)</span>
        <span class="matrix-pill" style="background:#F59E0B;">Daya Bertahap: 0 - 255</span>
      </div>
      <p class="matrix-desc">Mikrokontroler membagi daya dengan denyut pulsa cepat untuk menghasilkan efek halus.</p>
      <div class="matrix-examples">
        <strong>Contoh Komponen:</strong> Mengatur Redup-Terang Lampu LED, Mengatur Kecepatan Putaran Kipas/Motor DC.
      </div>
      <div class="matrix-block-wrap">
        ${stmtBlock('#9966FF', 'analogWrite Pin ' + pillInput('9') + ' to value ' + pillInput('128'))}
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Kamus Singkat Rentang Angka Mikrokontroler:', `
    • <strong>Digital</strong>: Hanya 2 nilai (<code>0</code> atau <code>1</code>, alias <code>LOW</code> atau <code>HIGH</code>).<br>
    • <strong>Analog Input (Arduino Uno 10-bit)</strong>: Nilai dari <code>0</code> (gelap/0V) hingga <code>1023</code> (terang/5V).<br>
    • <strong>Analog Output PWM (8-bit)</strong>: Nilai dari <code>0</code> (mati) hingga <code>255</code> (kekuatan penuh 100%).
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 8: PROYEK 1 - LED BERKEDIP CERIA (BLINK LED)
// ─────────────────────────────────────────────────────────────────────────────
const page8_ProjectBlink = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #FF6680, #E11D48);">
    <div class="project-tag">PROYEK 1 • DASAR DIGITAL OUTPUT</div>
    <h3 class="project-title">💡 Lampu LED Berkedip Ceria (Blink LED)</h3>
    <div class="project-goal">Misi: Mengajarkan Arduino menyalakan dan mematikan lampu LED secara bergantian setiap 1 detik!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Breadboard:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitBlinkSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Daftar Komponen yang Diperlukan:</strong>
        <ul>
          <li>1x Board Arduino Uno + Kabel USB</li>
          <li>1x Breadboard Half-Size</li>
          <li>1x Lampu LED 5mm (Warna Bebas)</li>
          <li>1x Resistor 220 Ω (Merah - Merah - Cokelat)</li>
          <li>2x Kabel Jumper Male-to-Male</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & PENJELASAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('LOW', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Kode Asli Arduino C++:</div>
        <pre>void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH); // Nyala\n  delay(1000);            // Tunggu 1 dtk\n  digitalWrite(13, LOW);  // Mati\n  delay(1000);            // Tunggu 1 dtk\n}</pre>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Ilmuwan Cilik: Mengenal Kaki LED & Mengapa Butuh Resistor?', `
    • <strong>Kaki Panjang (+) Anoda:</strong> Hubungkan ke Pin 13 melalui Resistor 220Ω.<br>
    • <strong>Kaki Pendek (-) Katoda:</strong> Hubungkan ke GND (Kutub Negatif). Bagian pinggir plastik dekat kaki pendek juga dibuat pipih datar.<br>
    • <strong>Mengapa Harus Ada Resistor?</strong> Resistor bertugas menahan derasnya aliran arus listrik. Tanpa resistor, arus listrik akan terlalu kuat dan membuat kawat filamen di dalam LED terbakar putus!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 9: PROYEK 2 - SAKLAR PINTAR TOMBOL TEKAN (PUSH BUTTON & IF-ELSE)
// ─────────────────────────────────────────────────────────────────────────────
const page9_ProjectButton = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8);">
    <div class="project-tag">PROYEK 2 • DIGITAL INPUT & LOGIKA</div>
    <h3 class="project-title">🔘 Saklar Lampu Pintar (Tombol & If-Else)</h3>
    <div class="project-goal">Misi: Lampu hanya menyala jika tombol ditekan oleh jari kita; saat dilepaskan, lampu langsung padam!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Breadboard:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitButtonSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Komponen Tambahan:</strong>
        <ul>
          <li>1x Push Button Tactile Switch (4 kaki)</li>
          <li>1x Resistor 10k Ω (Cokelat - Hitam - Oranye) sebagai Pull-Down</li>
          <li>Kabel jumper secukupnya</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & LOGIKA -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${cBlock('#4C97FF', 'jika ' + reporterPill('#3B82F6', reporterPill('#9966FF', 'digitalRead Pin ' + pillInput('2')) + ' == ' + pillInput('HIGH', true)) + ' maka', `
            ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
          `, 'selain itu {')}
          <div style="padding-left:12px; margin-top:4px;">
            ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('LOW', true))}
          </div>
          <div style="font-weight:bold; color:white; padding:2px 0 0 4px;">}</div>
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Cara Berpikir Logika Blok:</div>
        <pre>1. Arduino memeriksa status Pin 2 setiap detik.\n2. Jika tombol DITEKAN -> Pin 2 membaca HIGH -> LED Nyala.\n3. Jika tombol DILEPAS -> Pin 2 membaca LOW -> LED Padam.</pre>
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Tahukah Kamu? Fungsi Rahasia Resistor Pull-Down 10kΩ:', `
    Saat tombol tidak ditekan, kaki Pin 2 berada di udara terbuka (*floating pin*). Tanpa resistor penarik ke tanah (*pull-down*), pin bisa menangkap gelombang liar di udara dan mengira tombol sedang ditekan sendiri! Resistor 10kΩ memastikan nilai pin tetap bersih di angka <strong>LOW (0V)</strong> saat tombol dilepas.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 10: PROYEK 3 - LAMPU MALAM OTOMATIS (SENSOR CAHAYA LDR)
// ─────────────────────────────────────────────────────────────────────────────
const page10_ProjectLdr = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #10B981, #059669);">
    <div class="project-tag">PROYEK 3 • ANALOG INPUT & THRESHOLD</div>
    <h3 class="project-title">🌙 Lampu Tidur Otomatis (Sensor Cahaya LDR)</h3>
    <div class="project-goal">Misi: Lampu otomatis menyala ketika ruangan gelap gulita, dan padam dengan sendirinya saat matahari terbit!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Breadboard:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitLdrSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Komponen yang Diperlukan:</strong>
        <ul>
          <li>1x Sensor LDR (Light Dependent Resistor)</li>
          <li>1x Resistor 10k Ω (Pembagi Tegangan)</li>
          <li>1x LED Kuning / Putih + Resistor 220 Ω</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & LOGIKA -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#4CBFE6', 'Serial.println ' + reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0')))}
          ${cBlock('#4C97FF', 'jika ' + reporterPill('#3B82F6', reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0')) + ' < ' + pillInput('400')) + ' maka', `
            ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('12') + ' to ' + pillInput('HIGH', true))}
          `, 'selain itu {')}
          <div style="padding-left:12px; margin-top:4px;">
            ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('12') + ' to ' + pillInput('LOW', true))}
          </div>
          <div style="font-weight:bold; color:white; padding:2px 0 0 4px;">}</div>
          ${stmtBlock('#FF4081', 'delay ' + pillInput('200') + ' ms')}
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Cara Kerja Ambang Batas (Threshold 400):</div>
        <pre>Ruangan Terang: LDR membaca nilai 600 - 900 -> Lampu Mati\nRuangan Gelap:  LDR membaca nilai 100 - 350 -> Lampu NYALA!</pre>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Mengintip Angka Sensor Lewat Serial Monitor:', `
    Klik tombol <strong>Serial Monitor</strong> di pojok kanan atas RoboLab Studio (pastikan baudrate 115200). Tutup sensor LDR dengan jarimu, dan amati angka di layar yang turun drastis! Angka <code>400</code> adalah batas ambang (*threshold*) yang bisa kamu ubah sesuai kegelapan kamarmu.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 11: PROYEK 4 - PENGATUR KECERAHAN LAMPU (DIMMER PWM)
// ─────────────────────────────────────────────────────────────────────────────
const page11_ProjectDimmer = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #0284C7, #0369A1);">
    <div class="project-tag">PROYEK 4 • ANALOG OUTPUT / PWM</div>
    <h3 class="project-title">🎛️ Pengatur Kecerahan Lampu (Dimmer LED & PWM)</h3>
    <div class="project-goal">Misi: Mengatur tingkat terang-redupnya lampu LED secara halus dengan memutar kenop potensiometer!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Breadboard:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitPotentiometerSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Komponen yang Diperlukan:</strong>
        <ul>
          <li>1x Potensiometer Putar 10k Ω (3 Kaki)</li>
          <li>1x LED Biru terhubung ke Pin PWM ~9</li>
          <li>1x Resistor 220 Ω</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & RUMUS -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#9966FF', 'analogWrite Pin ' + pillInput('9') + ' to value ' + reporterPill('#59C059', reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0')) + ' / ' + pillInput('4')))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('20') + ' ms')}
        `, '}')}
      </div>

      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; margin-top:8px;">
        <div style="font-size:12px; font-weight:bold; color:#166534;">📐 Mengapa Dibagi 4?</div>
        <p class="text-xs" style="color:#14532D; margin:4px 0 0 0; line-height:1.4;">
          Sensor Analog Input membaca rentang <strong>0 sampai 1023</strong> (1024 level).<br>
          Sedangkan Pin PWM Analog Output hanya menerima <strong>0 sampai 255</strong> (256 level).<br>
          Karena <code>1024 ÷ 4 = 256</code>, membagi nilai bacaan dengan 4 adalah trik matematika pintar yang sangat cepat dan akurat!
        </p>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Apa Sih Sebenarnya PWM (Pulse Width Modulation) Itu?', `
    Arduino sebenarnya tidak bisa menurunkan tegangan jadi 2V atau 3V. Yang dilakukan Arduino adalah menyalakan dan mematikan lampu dengan <strong>kecepatan super tinggi (ratusan kali per detik)</strong>! Jika lampu menyala 50% waktu dan mati 50% waktu, mata kita akan melihatnya sebagai lampu redup separuh daya. Ajaib, kan?
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 12: PROYEK 5 - ALARM KEBAKARAN & KOTAK MUSIK (BUZZER & TONE)
// ─────────────────────────────────────────────────────────────────────────────
const page12_ProjectBuzzer = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #E040FB, #C026D3);">
    <div class="project-tag">PROYEK 5 • FREKUENSI SUARA & MUSIK</div>
    <h3 class="project-title">🔔 Kotak Musik & Sirine Alarm (Piezo Buzzer)</h3>
    <div class="project-goal">Misi: Membunyikan melodi tangga nada lagu dan sirine peringatan bahaya menggunakan getaran gelombang suara!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Mengenal Piezo Buzzer & Frekuensi Nada:</h4>
      <p class="text-xs" style="color:#475569; margin-bottom:8px;">
        Buzzer adalah pengeras suara mini yang bergetar ketika dialiri pulsa listrik. Semakin cepat ia bergetar (Frekuensi Hertz/Hz), semakin tinggi pula nada suara yang dihasilkan!
      </p>

      <div class="scale-table">
        <div class="scale-header">Tabel Frekuensi Nada Dasar (Hz):</div>
        <div class="scale-row"><span>Do (C4)</span><strong>262 Hz</strong><span>Sol (G4)</span><strong>392 Hz</strong></div>
        <div class="scale-row"><span>Re (D4)</span><strong>294 Hz</strong><span>La (A4)</span><strong>440 Hz</strong></div>
        <div class="scale-row"><span>Mi (E4)</span><strong>330 Hz</strong><span>Si (B4)</span><strong>494 Hz</strong></div>
        <div class="scale-row"><span>Fa (F4)</span><strong>349 Hz</strong><span>Do Tinggi (C5)</span><strong>523 Hz</strong></div>
      </div>

      <div class="component-list-box" style="margin-top:8px;">
        <strong>Cara Pasang Kabel Buzzer:</strong>
        <ul>
          <li>Kaki Positif (+) bertanda plus -> Pin Digital 8</li>
          <li>Kaki Negatif (-) -> Pin GND Arduino</li>
        </ul>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok Lagu di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          <div style="font-size:10px; color:#64748B; margin-bottom:2px;">// Nada Do - Re - Mi - Sol</div>
          ${stmtBlock('#E040FB', 'Tone on Pin ' + pillInput('8') + ' freq ' + pillInput('262') + ' duration ' + pillInput('400'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('450') + ' ms')}
          ${stmtBlock('#E040FB', 'Tone on Pin ' + pillInput('8') + ' freq ' + pillInput('294') + ' duration ' + pillInput('400'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('450') + ' ms')}
          ${stmtBlock('#E040FB', 'Tone on Pin ' + pillInput('8') + ' freq ' + pillInput('330') + ' duration ' + pillInput('400'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('450') + ' ms')}
          ${stmtBlock('#E040FB', 'Tone on Pin ' + pillInput('8') + ' freq ' + pillInput('392') + ' duration ' + pillInput('800'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1500') + ' ms')}
        `, '}')}
      </div>
    </div>
  </div>

  ${tipsBox('happy', 'Tantangan Bunyi Sirine Ambulans:', `
    Coba ganti frekuensinya menjadi bergantian antara <strong>600 Hz</strong> (selama 400ms) dan <strong>900 Hz</strong> (selama 400ms) tanpa jeda panjang. Seketika kamarmu akan terdengar seperti mobil polisi atau ambulans darurat yang sedang melintas!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 13: PROYEK 6 - PALANG PINTU OTOMATIS (MOTOR SERVO SG90)
// ─────────────────────────────────────────────────────────────────────────────
const page13_ProjectServo = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #FF6D00, #EA580C);">
    <div class="project-tag">PROYEK 6 • AKTUATOR & SUDUT DERAJAT</div>
    <h3 class="project-title">🚧 Palang Pintu Otomatis (Motor Servo SG90)</h3>
    <div class="project-goal">Misi: Menggerakkan lengan palang pintu kereta api ke sudut 0°, 90°, dan 180° menggunakan motor servo!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Motor Servo:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitServoSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Penting! Arti 3 Warna Kabel Servo SG90:</strong>
        <ul>
          <li>🟤 <strong>Cokelat / Hitam:</strong> GND (Kutub Negatif)</li>
          <li>🔴 <strong>Merah:</strong> 5V (Daya Listrik Positif)</li>
          <li>🟠 <strong>Oranye / Kuning:</strong> Sinyal PWM (Hubungkan ke Pin ~9)</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & SUDUT -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          <div style="font-size:10px; color:#64748B; margin-bottom:2px;">// Palang Tertutup Rapat (0 Derajat)</div>
          ${stmtBlock('#FF6D00', 'Servo on Pin ' + pillInput('9') + ' write angle ' + pillInput('0'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('2000') + ' ms')}
          <div style="font-size:10px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Palang Terbuka Naik (90 Derajat)</div>
          ${stmtBlock('#FF6D00', 'Servo on Pin ' + pillInput('9') + ' write angle ' + pillInput('90'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('2000') + ' ms')}
        `, '}')}
      </div>

      <div class="highlight-card" style="background:#FFF7ED; border-color:#FED7AA; margin-top:8px;">
        <div style="font-size:11.5px; font-weight:bold; color:#C2410C;">Apa Bedanya Motor Servo dengan Motor DC Biasa?</div>
        <p class="text-xs" style="color:#9A3412; margin:2px 0 0 0;">
          Motor DC biasa berputar terus-menerus tanpa tahu posisinya (seperti baling-baling kipas angin). Sedangkan <strong>Motor Servo</strong> memiliki sensor posisi di dalamnya, sehingga ia bisa diperintahkan berhenti tepat di sudut tertentu (0° sampai 180°)!
        </p>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Ide Penggabungan Proyek:', `
    Gabungkan proyek ini dengan <strong>Tombol Tekan di Proyek 2</strong>! Buatlah program agar ketika tombol ditekan, palang servo membuka ke 90°, lampu hijau menyala, dan setelah 3 detik palang otomatis menutup kembali ke 0°. Keren sekali, kan?
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 14: PROYEK 7 - RADAR JARAK & LAYAR PINTAR (ULTRASONIC & LCD I2C)
// ─────────────────────────────────────────────────────────────────────────────
const page14_ProjectUltrasonic = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #0284C7, #0F766E);">
    <div class="project-tag">PROYEK 7 • SENSOR SONAR & DISPLAY I2C</div>
    <h3 class="project-title">🦇 Radar Kelelawar & Layar Teks (HC-SR04 & LCD)</h3>
    <div class="project-goal">Misi: Mengukur jarak benda secara real-time dan menampilkan hasilnya dalam satuan cm pada layar LCD 16x2!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Sensor & Layar:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitUltrasonicLcdSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Pin Sensor Ultrasonik HC-SR04:</strong>
        <ul>
          <li>VCC -> 5V | GND -> GND</li>
          <li><strong>Trig</strong> (Pemancar) -> Pin 12 | <strong>Echo</strong> (Penerima) -> Pin 13</li>
          <li><strong>LCD I2C (4 Kabel):</strong> SDA -> Pin A4 | SCL -> Pin A5</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & CARA KERJA -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#4CBFE6', 'Serial.println ' + reporterPill('#A855F7', 'Read Ultrasonic Trig ' + pillInput('12') + ' Echo ' + pillInput('13')))}
          ${stmtBlock('#4CBFE6', 'Serial.println ' + pillInput('" cm"'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('300') + ' ms')}
        `, '}')}
      </div>

      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; margin-top:8px;">
        <div style="font-size:11.5px; font-weight:bold; color:#166534;">🦇 Bagaimana HC-SR04 Mengukur Jarak?</div>
        <p class="text-xs" style="color:#14532D; margin:2px 0 0 0;">
          Silinder 'T' memancarkan suara ultrasonik berfrekuensi tinggi (tidak terdengar manusia). Gelombang suara menabrak benda lalu memantul kembali ke silinder 'R'. Dengan menghitung kecepatan suara di udara (340 m/s), mikrokontroler langsung tahu jarak benda tersebut!
        </p>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Mengapa Harus Menggunakan Modul LCD I2C?', `
    Layar LCD biasa membutuhkan <strong>16 kabel jumper</strong> yang sangat membingungkan dan menghabiskan pin Arduino! Dengan modul ransel hitam kecil <strong>I2C</strong> di belakang layar, kita hanya butuh <strong>4 kabel saja</strong> (VCC, GND, SDA, SCL). Sangat rapi dan hemat pin!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 15: BAB 6 - GERBANG MENUJU IOT (INTERNET OF THINGS)
// ─────────────────────────────────────────────────────────────────────────────
const page15_IntroIot = `
  <div style="text-align:center; margin-bottom:12px;">
    <h3 style="font-family:'Fredoka',sans-serif; color:#15803D; font-size:22px; margin:0 0 4px 0;">🌐 Selamat Datang di Dunia Internet of Things!</h3>
    <p class="text-sm" style="color:#475569; margin:0 auto; max-width:620px;">
      Bayangkan kamu sedang berlibur di luar kota, lalu menyalakan lampu kamarmu lewat smartphone, atau menerima pesan WhatsApp saat tanamanmu butuh disiram. Itulah keajaiban <strong>IoT (Internet of Things)</strong>!
    </p>
  </div>

  <div class="two-col-layout">
    <div>
      <h4 class="subheading" style="margin-top:0;">Empat Pilar Utama Dalam Arsitektur IoT:</h4>
      <div class="iot-pillars">
        <div class="pillar-item">
          <div class="pillar-num">1</div>
          <div class="pillar-text">
            <strong>Perangkat Keras (ESP32):</strong> Mikrokontroler pintar yang terhubung ke sensor fisik di rumahmu.
          </div>
        </div>
        <div class="pillar-item">
          <div class="pillar-num">2</div>
          <div class="pillar-text">
            <strong>Koneksi Internet (WiFi):</strong> Jembatan nirkabel yang membawa paket data dari ESP32 ke seluruh dunia.
          </div>
        </div>
        <div class="pillar-item">
          <div class="pillar-num">3</div>
          <div class="pillar-text">
            <strong>Server Cloud (Blynk Server):</strong> Kantor pos raksasa di internet yang meneruskan perintah dalam milidetik.
          </div>
        </div>
        <div class="pillar-item">
          <div class="pillar-num">4</div>
          <div class="pillar-text">
            <strong>Aplikasi Pengguna (Smartphone):</strong> Layar HP tempat kita menekan saklar tombol dan melihat grafik sensor.
          </div>
        </div>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">Kenapa Kita Memakai ESP32 untuk IoT?</h4>
      <div style="display:flex; justify-content:center; margin-bottom:8px;">
        ${esp32BoardSVG(240, 130)}
      </div>
      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; font-size:11px;">
        Arduino Uno biasa tidak memiliki modul internet bawaan. <strong>ESP32</strong> adalah pilihan sempurna karena sudah memiliki chip antena WiFi & Bluetooth di badannya, harganya terjangkau, dan sangat cepat!
      </div>
    </div>
  </div>

  ${tipsBox('iot', 'Konsep Keren: Mengenal "Pin Virtual" (V0, V1, V2...):', `
    Jika pin fisik (seperti GPIO 2) bisa kita sentuh dengan jari, <strong>Pin Virtual (V0, V1, V2...)</strong> adalah <em>kabel ajaib tak kasat mata di internet</em>! Tombol di layar HP terhubung ke Pin Virtual V0. Ketika tombol HP ditekan, Blynk Cloud akan mengirim angka 1 lewat kawat maya V0 tersebut ke dalam memori ESP32!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 16: BAB 6 - MEMBEDAH BLOK HIJAU BLYNK IOT
// ─────────────────────────────────────────────────────────────────────────────
const page16_BlynkBlocks = `
  <div style="text-align:center; margin-bottom:12px;">
    <p class="text-sm" style="color:#475569; margin:0 auto; max-width:620px;">
      Di <strong>RoboLab Studio</strong>, semua fungsi IoT Blynk yang tadinya rumit telah diubah menjadi blok-blok berwarna <strong>Hijau Zamrud (#22C55E)</strong> yang sangat mudah disusun!
    </p>
  </div>

  <div class="blynk-blocks-grid">
    <!-- 1. BLYNK CONFIG -->
    <div class="blynk-card">
      <div class="blynk-card-title">1. Blok Konfigurasi Identitas (KTP Perangkat)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Diletakkan di bagian paling atas program untuk mengenalkan nama dan kunci rahasia alatmu ke Blynk.</p>
      <div class="block-wrap-sm">
        ${stmtBlock('#22C55E', 'Blynk Config ID ' + pillInput('"TMPL123"') + ' Name ' + pillInput('"MyESP32"') + ' Auth ' + pillInput('"TokenXYZ"'))}
      </div>
    </div>

    <!-- 2. BLYNK BEGIN -->
    <div class="blynk-card">
      <div class="blynk-card-title">2. Blok Membuka Koneksi WiFi Rumah</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Menghubungkan ESP32 ke nama WiFi (SSID) dan kata sandi (Password) internet rumahmu.</p>
      <div class="block-wrap-sm">
        ${stmtBlock('#22C55E', 'Blynk Begin Auth ' + pillInput('AUTH') + ' SSID ' + pillInput('"WiFi-Rumah"') + ' Pass ' + pillInput('"Password123"'))}
      </div>
    </div>

    <!-- 3. BLYNK RUN -->
    <div class="blynk-card">
      <div class="blynk-card-title">3. Blok Penjaga Koneksi (Wajib di Loop!)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Menjaga agar ESP32 selalu mendengarkan pesan dari server Blynk tanpa pernah terputus.</p>
      <div class="block-wrap-sm">
        ${stmtBlock('#22C55E', 'Blynk Run')}
      </div>
    </div>

    <!-- 4. BLYNK ON WRITE -->
    <div class="blynk-card">
      <div class="blynk-card-title">4. Blok Pendengar Perintah HP (Callback)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Akan otomatis melompat dan bekerja seketika tombol widget di aplikasi HP ditekan!</p>
      <div class="block-wrap-sm">
        ${cBlock('#22C55E', 'Blynk On Write ' + pillInput('V0') + ' {', stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('2') + ' to ' + reporterPill('#22C55E', 'Blynk Param As Int')), '}')}
      </div>
    </div>

    <!-- 5. BLYNK VIRTUAL WRITE -->
    <div class="blynk-card">
      <div class="blynk-card-title">5. Blok Kirim Data Sensor ke HP</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Mengirimkan data hasil bacaan sensor dari ruangan kamar ke jarum pengukur di HP.</p>
      <div class="block-wrap-sm">
        ${stmtBlock('#22C55E', 'Blynk Virtual Write Pin ' + pillInput('V1') + ' Value ' + reporterPill('#9966FF', 'analogRead Pin ' + pillInput('34')))}
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Peringatan Penting Untuk WiFi ESP32:', `
    Pastikan WiFi rumahmu menggunakan frekuensi <strong>2.4 GHz</strong> (bukan 5 GHz)! Hampir semua chip mikrokontroler IoT di dunia hanya mendukung gelombang WiFi standar 2.4 GHz.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 17: PROYEK 8 - SMART HOME KONTROL LAMPU & SENSOR VIA BLYNK
// ─────────────────────────────────────────────────────────────────────────────
const page17_ProjectBlynk = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #15803D, #047857);">
    <div class="project-tag">PROYEK 8 • PROYEK PAMUNGKAS IOT</div>
    <h3 class="project-title">🏠 Smart Home: Kendali Lampu & Monitor Suhu via HP</h3>
    <div class="project-goal">Misi: Menyalakan lampu kamar dari smartphone lewat internet dan memantau sensor secara live dari mana saja!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema ESP32 + WiFi + Smartphone:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitBlynkSVG(300, 135)}
      </div>
      <div class="component-list-box" style="margin-top:4px;">
        <strong>Langkah di Aplikasi Blynk Mobile:</strong>
        <ol style="margin:2px 0; padding-left:16px; font-size:10.5px; color:#475569;">
          <li>Buat Template baru -> Pilih Hardware <strong>ESP32</strong>.</li>
          <li>Tambahkan Datastream: <strong>V0 (Integer 0-1)</strong> & <strong>V1 (Double/Float)</strong>.</li>
          <li>Di layar Dashboard, pasang widget <strong>Button (ke V0)</strong> dan <strong>Gauge (ke V1)</strong>.</li>
          <li>Salin Auth Token ke dalam blok RoboLab Studio!</li>
        </ol>
      </div>
    </div>

    <!-- BLOK IOT LENGKAP -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok IoT di RoboLab Studio:</h4>
      <div class="block-preview-box" style="font-size:11px;">
        <div style="font-size:10px; color:#64748B; margin-bottom:2px;">// Inisialisasi Koneksi Blynk</div>
        ${stmtBlock('#22C55E', 'Blynk Config ID ' + pillInput('"TMPL_01"') + ' Name ' + pillInput('"SmartHome"') + ' Auth ' + pillInput('"MyToken"'))}
        ${stmtBlock('#22C55E', 'Blynk Begin Auth ' + pillInput('"MyToken"') + ' SSID ' + pillInput('"WiFi-Kamar"') + ' Pass ' + pillInput('"12345678"'))}
        
        <div style="margin-top:6px;"></div>
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#22C55E', 'Blynk Run')}
          ${stmtBlock('#22C55E', 'Blynk Virtual Write Pin ' + pillInput('V1') + ' Value ' + reporterPill('#9966FF', 'analogRead Pin ' + pillInput('34')))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
        `, '}')}

        <div style="margin-top:6px;"></div>
        ${cBlock('#22C55E', 'Blynk On Write ' + pillInput('V0') + ' {', `
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('2') + ' to ' + reporterPill('#22C55E', 'Blynk Param As Int'))}
        `, '}')}
      </div>
    </div>
  </div>

  ${tipsBox('cheer', 'Selamat! Kamu Telah Menjadi Insinyur IoT!', `
    Ketika tombol di aplikasi Blynk kamu geser ke <strong>ON</strong>, ponselmu mengirim sinyal ke server Cloud, menembus samudra internet, sampai ke router WiFi rumahmu, masuk ke ESP32, dan membuat lampu menyala! Kamu baru saja merakit teknologi masa depan dengan tanganmu sendiri!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 18: KLINIK "DOKTER ROBOT" - PANDUAN TROUBLESHOOTING
// ─────────────────────────────────────────────────────────────────────────────
const page18_Troubleshooting = `
  <div style="display:flex; align-items:center; gap:14px; margin-bottom:12px;">
    ${mascotSVG('doctor', 65)}
    <div>
      <h3 style="margin:0; font-family:'Fredoka',sans-serif; color:#0369A1; font-size:18px;">🩺 Klinik Dokter Robot: Saat Terjadi Masalah</h3>
      <p class="text-xs" style="color:#64748B; margin:2px 0 0 0;">
        Jangan panik jika robotmu belum berjalan! Semua penemu hebat pasti pernah mengalami error. Berikut adalah resep obat dari Dokter Robot untuk mengatasi 5 penyakit paling umum:
      </p>
    </div>
  </div>

  <div class="trouble-grid">
    <div class="trouble-card">
      <div class="trouble-title">❌ Penyakit 1: Program Gagal Upload / Port COM Tidak Muncul</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Kabel USB hanya kabel pengisi daya (bukan kabel data), atau driver CH340 / CP2102 belum terinstal.<br>
        <strong>Resep Dokter:</strong> Ganti kabel USB dengan kabel data berkualitas, coba pindahkan ke colokan port USB laptop yang lain, dan pastikan driver terpasang di Device Manager.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Penyakit 2: Lampu LED Tidak Mau Menyala Sama Sekali</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Kaki LED terpasang terbalik atau kabel GND kendor.<br>
        <strong>Resep Dokter:</strong> Cabut LED dan putar 180 derajat (pastikan kaki panjang ke arah pin sinyal positif, dan kaki pendek yang ada sisi datarnya ke arah GND).
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Penyakit 3: ESP32 Gagal Terhubung ke WiFi Rumah</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Nama WiFi (SSID) atau kata sandi salah ketik, atau router memancarkan sinyal 5 GHz murni.<br>
        <strong>Resep Dokter:</strong> Perhatikan huruf besar/kecil pada SSID dan Password. Pastikan WiFi menggunakan frekuensi 2.4 GHz.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Penyakit 4: Serial Monitor Menampilkan Huruf Aneh / Kotak-Kotak</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Kecepatan data (*Baud Rate*) antara mikrokontroler dan laptop tidak sama.<br>
        <strong>Resep Dokter:</strong> Ubah pilihan Baud Rate di pojok kanan bawah Serial Monitor menjadi <strong>115200 baud</strong> agar sama dengan perintah di program.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Penyakit 5: Nilai Sensor Membaca Angka Acak Loncat-Loncat</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Jalur kabel GND resistor lepas sehingga terjadi *Floating Pin*.<br>
        <strong>Resep Dokter:</strong> Pastikan kabel dari resistor benar-benar menancap erat ke rel jalur biru GND di breadboard.
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Pesan Moral Dokter Robot:', `
    Menemukan dan memperbaiki kesalahan (disebut <strong>Debugging</strong>) adalah 80% bagian dari seni pemrograman! Setiap kali kamu berhasil memperbaiki error, kemampuan analisismu sedang naik level menjadi semakin cerdas.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 19: KAMUS PINTAR MAKER CILIK (GLOSARIUM DARI A SAMPAI Z)
// ─────────────────────────────────────────────────────────────────────────────
const page19_Glossary = `
  <div style="text-align:center; margin-bottom:10px;">
    <h3 style="font-family:'Fredoka',sans-serif; color:#7C3AED; font-size:20px; margin:0 0 4px 0;">📖 Kamus Pintar Maker Cilik: Istilah Dari A sampai Z</h3>
    <p class="text-xs" style="color:#64748B; margin:0;">Kumpulan istilah keren dunia elektronika yang sering kamu dengar agar kamu makin fasih berdiskusi!</p>
  </div>

  <div class="glossary-grid">
    <div class="gloss-item">
      <span class="gloss-term">Aktuator</span>
      <span class="gloss-def">Komponen yang mengubah energi listrik menjadi gerakan fisik nyata (contoh: motor servo, motor DC).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Analog</span>
      <span class="gloss-def">Sinyal listrik yang nilainya bervariasi secara halus dalam rentang angka tertentu (contoh: 0 sampai 1023).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Baud Rate</span>
      <span class="gloss-def">Kecepatan pengiriman data bit per detik antara mikrokontroler dan komputer (contoh standar: 115200 baud).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Breadboard</span>
      <span class="gloss-def">Papan sirkuit dengan lubang berpenjepit logam untuk merangkai komponen elektronik sementara tanpa perlu disolder.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Cloud Server</span>
      <span class="gloss-def">Komputer server raksasa di internet (seperti Blynk Cloud) yang bertugas menghubungkan HP dengan alat IoT di rumah.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Digital</span>
      <span class="gloss-def">Sinyal listrik pasti yang hanya mengenal dua kondisi saja: ON (Tinggi/HIGH) atau OFF (Rendah/LOW).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Firmware</span>
      <span class="gloss-def">Program perangkat lunak permanen yang ditanamkan langsung ke dalam memori chip mikrokontroler.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">GND (Ground)</span>
      <span class="gloss-def">Titik nol volt atau kutub negatif listrik tempat kembalinya arus listrik agar sirkuit tertutup sempurna.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">IoT</span>
      <span class="gloss-def">Internet of Things: Konsep menghubungkan benda-benda fisik di sekitar kita ke jaringan internet agar bisa dikontrol.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">PWM</span>
      <span class="gloss-def">Pulse Width Modulation: Trik menyalakan-mematikan daya dengan denyut pulsa cepat untuk menghasilkan efek halus.</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Resistor</span>
      <span class="gloss-def">Komponen penahan laju arus listrik agar komponen sensitif (seperti LED) tidak rusak terbakar. Satuan: Ohm (Ω).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Sensor</span>
      <span class="gloss-def">Indera peraba mikrokontroler untuk mendeteksi besaran fisik alam (suhu, cahaya, getaran, jarak, kelembapan).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Threshold</span>
      <span class="gloss-def">Nilai ambang batas pembanding yang digunakan dalam logika percabangan untuk memicu tindakan (contoh: cahaya < 400).</span>
    </div>
    <div class="gloss-item">
      <span class="gloss-term">Virtual Pin</span>
      <span class="gloss-def">Saluran saluran data nirkabel tak kasat mata di server Blynk untuk menghubungkan tombol HP dengan program ESP32.</span>
    </div>
  </div>

  ${tipsBox('smart', 'Kiat Menjadi Maker Sejati:', `
    Hafalkan istilah-istilah di atas secara bertahap saat kamu sedang merangkai proyek. Dengan menguasai bahasanya, kamu akan semakin percaya diri saat membaca buku atau membuat tutorial karyamu sendiri!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 20: TANTANGAN KREATIF & SERTIFIKAT KELULUSAN
// ─────────────────────────────────────────────────────────────────────────────
const page20_Certificate = `
  <div class="cert-outer-frame">
    <div class="cert-inner-frame">
      <div class="cert-header">
        <div class="cert-logo">${mascotSVG('cheer', 55)}</div>
        <div class="cert-org">ROBOLAB STUDIO • ACADEMY OF JUNIOR MAKERS</div>
        <h2 class="cert-title">PIAGAM PENGHARGAAN</h2>
        <div class="cert-subtitle">DIBERIKAN DENGAN BANGGA KEPADA:</div>
      </div>

      <div class="cert-name-line">
        <div class="name-dots">______________________________________________________</div>
        <div class="name-label">Nama Sahabat Maker Cilik</div>
      </div>

      <div class="cert-body-text">
        Atas keberhasilan, ketekunan, dan semangat belajarnya yang luar biasa dalam menyelesaikan seluruh materi pembelajaran 
        <strong>Dasar Pemrograman Blok Visual, Rangkaian Elektronika Mikrokontroler, hingga Mahakarya Internet of Things (IoT)</strong>
        menggunakan RoboLab Studio.
      </div>

      <div class="cert-badges-row">
        <span class="cert-pill">✓ Logika Blok</span>
        <span class="cert-pill">✓ Sensor & Aktuator</span>
        <span class="cert-pill">✓ Sirkuit Arduino</span>
        <span class="cert-pill">✓ Blynk IoT Master</span>
      </div>

      <div class="cert-footer-row">
        <div class="cert-sign-col">
          <div class="cert-date-line">Tanggal: _______________ 2026</div>
          <div class="cert-sign-title">Tanda Tangan Instruktur / Mentor</div>
        </div>
        <div class="cert-stamp">
          <div class="stamp-circle">
            <span>ROBOLAB</span>
            <strong>OFFICIAL</strong>
            <span>STUDIO</span>
          </div>
        </div>
        <div class="cert-sign-col">
          <div class="cert-date-line">🤖 RoboBot</div>
          <div class="cert-sign-title">Maskot Cerdas RoboLab Studio</div>
        </div>
      </div>
    </div>
  </div>

  <div class="challenge-footer-box">
    <strong>🎯 3 Tantangan Kreatif Masa Depan Untuk Dicoba di Rumah:</strong><br>
    <strong>1. Alarm Anti-Maling Kamar:</strong> Bunyikan alarm buzzer jika sensor ultrasonik mendeteksi orang mendekati pintu kamar!<br>
    <strong>2. Penyiram Tanaman Pintar:</strong> Pasang sensor kelembapan tanah, dan nyalakan pompa mini jika tanah kering via HP.<br>
    <strong>3. Lampu Pesta Disko:</strong> Buat 3 buah LED (Merah, Kuning, Hijau) berkedip bergantian sesuai irama lagu buzzer!
  </div>
`;

module.exports = {
  pages: [
    { num: 1, html: page1_Cover, chNum: '', chTitle: '' },
    { num: 2, html: page2_Welcome, chNum: '', chTitle: 'Sambutan & Peta Petualangan Belajar' },
    { num: 3, html: page3_StudioBlocks, chNum: '1', chTitle: 'Mengenal RoboLab Studio & Blok Pemrograman' },
    { num: 4, html: page4_SetupLoop, chNum: '2', chTitle: 'Dua Jantung Program: void setup() & void loop()' },
    { num: 5, html: page5_Microcontrollers, chNum: '3', chTitle: 'Otak Robot: Arduino & Mikrokontroler' },
    { num: 6, html: page6_PinoutBreadboard, chNum: '3', chTitle: 'Peta Pinout Arduino & Rahasia Breadboard' },
    { num: 7, html: page7_InputOutputMatrix, chNum: '4', chTitle: 'Empat Jurus Sakti: Input Output, Analog Digital' },
    { num: 8, html: page8_ProjectBlink, chNum: '5', chTitle: 'Proyek 1: Lampu LED Berkedip Ceria (Blink)' },
    { num: 9, html: page9_ProjectButton, chNum: '5', chTitle: 'Proyek 2: Saklar Lampu Pintar (Tombol & If-Else)' },
    { num: 10, html: page10_ProjectLdr, chNum: '5', chTitle: 'Proyek 3: Lampu Malam Otomatis (Sensor Cahaya LDR)' },
    { num: 11, html: page11_ProjectDimmer, chNum: '5', chTitle: 'Proyek 4: Pengatur Kecerahan Lampu (Dimmer PWM)' },
    { num: 12, html: page12_ProjectBuzzer, chNum: '5', chTitle: 'Proyek 5: Alarm & Kotak Musik (Piezo Buzzer)' },
    { num: 13, html: page13_ProjectServo, chNum: '5', chTitle: 'Proyek 6: Palang Pintu Otomatis (Motor Servo SG90)' },
    { num: 14, html: page14_ProjectUltrasonic, chNum: '5', chTitle: 'Proyek 7: Radar Kelelawar & LCD I2C (HC-SR04)' },
    { num: 15, html: page15_IntroIot, chNum: '6', chTitle: 'Gerbang Menuju IoT (Internet of Things)' },
    { num: 16, html: page16_BlynkBlocks, chNum: '6', chTitle: 'Membedah Blok Hijau Blynk IoT di RoboLab Studio' },
    { num: 17, html: page17_ProjectBlynk, chNum: '6', chTitle: 'Proyek 8: Smart Home Kontrol Lampu via Blynk' },
    { num: 18, html: page18_Troubleshooting, chNum: '7', chTitle: 'Klinik Dokter Robot: Panduan Troubleshooting' },
    { num: 19, html: page19_Glossary, chNum: '8', chTitle: 'Kamus Pintar Maker Cilik: Glosarium A - Z' },
    { num: 20, html: page20_Certificate, chNum: '8', chTitle: 'Tantangan Masa Depan & Piagam Kelulusan' },
  ],
  renderPage
};
