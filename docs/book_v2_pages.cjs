// book_v2_pages.cjs - Complete 26 pages curriculum according to user syllabus
const assets = require('./book_v2_assets.cjs');
const blocks = require('./book_blocks.cjs');

const {
  realArduinoUri,
  realEsp32Uri,
  realLedUri,
  realButtonUri,
  realPotUri,
  realServoUri,
  realMotorDcUri,
  realUltrasonicUri,
  realLcdUri,
  realLogoUri,
  mascotSVG,
  robolabStudioUiSVG,
  breadboardSVG,
  circuitLedDirectSVG,
  circuitButtonRealSVG,
  circuitRelayModuleSVG,
  circuitPotRealSVG,
  circuitServoRealSVG,
  circuitLcdRealSVG,
  circuitL298MiniSVG,
  robotSoccerMiniL298ChassisSVG,
  circuitBlynkSVG,
  blynkSignupWorkflowSVG
} = assets;

const { pillInput, reporterPill, stmtBlock, cBlock, tipsBox, pageHeader, pageFooter } = blocks;

function renderPageV2(pageNum, contentHtml, chapterTag = '', chapterTitle = '') {
  if (pageNum === 1) {
    return `<div class="page page-cover">${contentHtml}</div>`;
  }
  return `
    <div class="page page-${pageNum}">
      <div class="page-header">
        <div class="header-badge">RoboLab Studio • Kurikulum Resmi IoT & Robotika</div>
        <div class="header-chapter">${chapterTag ? `<strong>${chapterTag}</strong> — ` : ''}${chapterTitle}</div>
      </div>
      <div class="page-body">
        ${contentHtml}
      </div>
      <div class="page-footer">
        <div class="footer-left">🤖 Panduan Belajar IoT & Robotika Cilik • RoboLab Studio 2026</div>
        <div class="footer-right">Halaman <strong>${pageNum}</strong> dari 26</div>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1: COVER WITH REAL ARDUINO & ESP32
// ─────────────────────────────────────────────────────────────────────────────
const p1_Cover = `
  <div class="cover-container">
    <div class="cover-badge-top">
      <span>🚀 Kurikulum Lengkap Pelatihan IoT & Robotika Cilik 2026</span>
    </div>
    
    <div class="cover-title-group">
      <div class="cover-pretitle">PANDUAN VISUAL PRAKTIK & BLOK PEMROGRAMAN</div>
      <h1 class="cover-main-title">DASAR IOT & ROBOTIKA<br><span class="highlight-text">BERSAMA ROBOLAB STUDIO</span></h1>
      <div class="cover-subtitle">
        Dari Fitur Studio, Input-Output LED & Tombol, Pengendalian Motor & I2C, ESP32 Nirkabel, hingga Mahakarya Proyek Robot Soccer & Smart Home Blynk di Smartphone!
      </div>
    </div>

    <!-- Real Board Display -->
    <div class="cover-real-boards-row">
      <div class="real-board-item">
        <img src="${realArduinoUri}" alt="Real Arduino Uno R3" style="height:115px; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.18));">
        <div class="real-board-caption">Arduino UNO R3 (Hardware Asli)</div>
      </div>
      <div class="cover-mascot-center">
        ${mascotSVG('soccer', 105)}
      </div>
      <div class="real-board-item">
        <img src="${realEsp32Uri}" alt="Real ESP32 DevKit V4" style="height:115px; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.18));">
        <div class="real-board-caption">ESP32 DevKit V4 (WiFi & BT)</div>
      </div>
    </div>

    <!-- 4 Section Pills -->
    <div class="cover-features-grid">
      <div class="feat-card" style="border-top:3px solid #0284C7;">
        <div class="feat-icon">📘 Bagian A</div>
        <div class="feat-title">Dasar IoT & Robotika</div>
        <div class="feat-desc">Konsep IoT, Arduino, Breadboard, Setup & Loop.</div>
      </div>
      <div class="feat-card" style="border-top:3px solid #9966FF;">
        <div class="feat-icon">💡 Bagian B</div>
        <div class="feat-title">I/O & Sensor</div>
        <div class="feat-desc">LED Langsung, Tombol, Relay 220V, Analog & PWM.</div>
      </div>
      <div class="feat-card" style="border-top:3px solid #FF6D00;">
        <div class="feat-icon">⚙️ Bagian C</div>
        <div class="feat-title">Motor & I2C</div>
        <div class="feat-desc">Motor DC, Servo 180°, Driver L298N, LCD I2C.</div>
      </div>
      <div class="feat-card" style="border-top:3px solid #22C55E;">
        <div class="feat-icon">🌐 Bagian D & Proyek</div>
        <div class="feat-title">ESP32 & Proyek Akhir</div>
        <div class="feat-desc">WiFi/BT, Blynk IoT, Robot Soccer & Smart Home.</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Diterbitkan oleh: <strong>RoboLab Studio Education Team</strong></div>
      <div class="cover-platform-pill">RoboLab Studio Desktop & Web v0.9.2</div>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2: SAMBUTAN & PETA KURIKULUM LENGKAP
// ─────────────────────────────────────────────────────────────────────────────
const p2_Welcome = `
  <div class="welcome-box">
    <div style="display:flex; align-items:center; gap:16px;">
      ${mascotSVG('happy', 75)}
      <div>
        <h2 style="margin:0 0 4px 0; color:#0284C7; font-family:'Fredoka',sans-serif; font-size:19px;">Selamat Datang di Kurikulum Resmi IoT & Robotika! 🤖</h2>
        <p style="margin:0; font-size:11.5px; color:#475569; line-height:1.45;">
          Buku ini disusun secara sistematis agar sahabat maker, siswa, dan pengajar dapat belajar dengan mudah, menyenangkan, dan berorientasi praktik langsung. Bersama aplikasi <strong>RoboLab Studio</strong>, kita akan menjelajahi teknologi masa depan dari dasar sirkuit hingga robotika cerdas!
        </p>
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:10px;">🗺️ Peta Kurikulum Pelatihan Terstruktur:</div>

  <div class="curriculum-roadmap">
    <div class="curr-module" style="border-left-color:#0284C7;">
      <div class="curr-badge" style="background:#0284C7;">MODUL STUDIO</div>
      <div class="curr-body">
        <strong>Pengenalan Fitur & Antarmuka RoboLab Studio</strong>
        <span>Topbar Menu, Board Selector, Upload, Mode C++/Python, Toolbox Kategori Blok, dan Workspace.</span>
      </div>
    </div>

    <div class="curr-module" style="border-left-color:#3B82F6;">
      <div class="curr-badge" style="background:#3B82F6;">BAGIAN A</div>
      <div class="curr-body">
        <strong>Dasar IoT & Robotika</strong>
        <span>Memahami apa itu IoT & Robotika, memahami Arduino Uno, instalasi breadboard, serta logika setup & loop.</span>
      </div>
    </div>

    <div class="curr-module" style="border-left-color:#9966FF;">
      <div class="curr-badge" style="background:#9966FF;">BAGIAN B</div>
      <div class="curr-body">
        <strong>Input-Output Arduino & Sensor</strong>
        <span>Menghidupkan LED langsung tanpa resistor (GND rapat), push button, modul relay 220V, sinyal analog & PWM.</span>
      </div>
    </div>

    <div class="curr-module" style="border-left-color:#FF6D00;">
      <div class="curr-badge" style="background:#FF6D00;">BAGIAN C</div>
      <div class="curr-body">
        <strong>Pengendalian Motor & Komunikasi I2C</strong>
        <span>Mengenal motor DC, motor servo presisi, driver L298N (arah & kecepatan), serta komunikasi LCD I2C 4-kabel.</span>
      </div>
    </div>

    <div class="curr-module" style="border-left-color:#10B981;">
      <div class="curr-badge" style="background:#10B981;">BAGIAN D</div>
      <div class="curr-body">
        <strong>Konektivitas IoT dengan ESP32</strong>
        <span>ESP32 vs Arduino, koneksi WiFi & Bluetooth, pengenalan platform Blynk (template, datastream, dashboard).</span>
      </div>
    </div>

    <div class="curr-module" style="border-left-color:#22C55E;">
      <div class="curr-badge" style="background:#22C55E;">PROYEK AKHIR</div>
      <div class="curr-body">
        <strong>Implementasi Robotika & Otomasi IoT</strong>
        <span><strong>Proyek 1: Robot Soccer</strong> (perakitan sasis, motor driver, kontrol gerak via HP & PWM) dan <strong>Proyek 2: Smart Home Blynk</strong> (kontrol relay & monitoring sensor).</span>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Kiat Sukses Mempelajari Buku Ini:', `
    Ikuti setiap langkah secara urut dari Bagian A hingga Proyek Akhir. Setiap bab dirancang berkesinambungan, dilengkapi blok visual asli RoboLab Studio, diagram kabel real, dan kode C++ ekuivalen untuk memperdalam pemahamanmu!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3: PENGENALAN FITUR & MENU ROBOLAB STUDIO
// ─────────────────────────────────────────────────────────────────────────────
const p3_StudioFeatures = `
  <div style="text-align:center; margin-bottom:8px;">
    <p class="text-sm" style="color:#475569; margin:0 auto; max-width:620px;">
      <strong>RoboLab Studio</strong> adalah lingkungan pengembangan cerdas (*IDE*) berbasis visual blok yang dirancang khusus untuk memprogram Arduino, ESP32, ESP8266, dan robotika secara intuitif tanpa pusing sintaksis!
    </p>
  </div>

  <div style="display:flex; justify-content:center; margin-bottom:8px;">
    ${robolabStudioUiSVG(490, 210)}
  </div>

  <div class="section-title">🔍 Membedah 4 Bagian Utama RoboLab Studio:</div>

  <div class="two-col-layout">
    <div class="feature-item-card">
      <div class="feat-item-header">1. Topbar Menu (Navigasi Atas)</div>
      <ul class="text-xs" style="margin:2px 0; padding-left:16px; color:#475569;">
        <li><strong>Board Selector:</strong> Memilih jenis papan (Arduino Uno, Nano, ESP32, ESP8266, Micro:bit).</li>
        <li><strong>COM Port:</strong> Memilih port USB komunikasi yang terhubung ke komputer.</li>
        <li><strong>Tombol Upload (▶):</strong> Mengompilasi visual blok dan melakukan *flash* langsung ke mikrokontroler.</li>
        <li><strong>Toggle View:</strong> Beralih antara Blok Visual, Kode C++ Arduino, dan MicroPython.</li>
        <li><strong>Serial Monitor / Plotter:</strong> Membaca data log dan grafik analog sensor secara live.</li>
        <li><strong>Library Manager:</strong> Mengunggah library file .ZIP atau clone dari GitHub.</li>
      </ul>
    </div>

    <div class="feature-item-card">
      <div class="feat-item-header">2. Sidebar Toolbox (Kategori Blok) & Kanvas</div>
      <ul class="text-xs" style="margin:2px 0; padding-left:16px; color:#475569;">
        <li><strong>Structure:</strong> Blok utama <code>void setup()</code> dan <code>void loop()</code>.</li>
        <li><strong>Pins:</strong> Pengaturan digital read/write dan analog PWM.</li>
        <li><strong>Sensors & Actuators:</strong> Ultrasonik HC-SR04, LDR, Motor Servo, Buzzer.</li>
        <li><strong>IoT Blynk:</strong> Konfigurasi Template, WiFi, Pin Virtual V0-V1.</li>
        <li><strong>Workspace Canvas:</strong> Area drag-and-drop dengan fitur Zoom (+/-), Reset Center, dan Tong Sampah (🗑️) untuk menghapus blok yang tidak digunakan.</li>
      </ul>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4: ANATOMI BLOK KODE ROBOLAB STUDIO
// ─────────────────────────────────────────────────────────────────────────────
const p4_BlockAnatomy = `
  <div class="two-col-layout">
    <div>
      <h3 class="subheading" style="margin-top:0;">Bagaimana Blok Kode Bekerja?</h3>
      <p class="text-sm">
        Di RoboLab Studio, kode tidak diketik huruf demi huruf, melainkan <strong>disusun seperti potongan puzzle</strong>. Blok-blok ini saling mengunci (*snap*) sehingga kamu tidak mungkin melakukan kesalahan sintaksis seperti lupa kurung kurawal <code>{}</code> atau titik koma <code>;</code>!
      </p>
      <p class="text-sm">
        Setiap blok memiliki warna khas sesuai fungsinya pada sistem RoboLab Studio.
      </p>
    </div>
    <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC;">
      <div style="font-weight:bold; color:#166534; font-size:11.5px; margin-bottom:3px;">🎨 Kode Warna Resmi Blok RoboLab Studio:</div>
      <div style="font-size:10px; color:#14532D; line-height:1.5;">
        • <strong style="color:#FF6680;">Merah Muda (#FF6680)</strong>: void setup()<br>
        • <strong style="color:#FFAB19;">Oranye Emas (#FFAB19)</strong>: void loop()<br>
        • <strong style="color:#9966FF;">Ungu (#9966FF)</strong>: Pin Digital & Analog<br>
        • <strong style="color:#FF4081;">Pink (#FF4081)</strong>: Delay Waktu (ms)<br>
        • <strong style="color:#FF6D00;">Oranye (#FF6D00)</strong>: Motor Servo<br>
        • <strong style="color:#22C55E;">Hijau Zamrud (#22C55E)</strong>: IoT Blynk ESP32
      </div>
    </div>
  </div>

  <h3 class="subheading" style="margin-top:8px;">4 Bentuk Blok yang Ada Pada Sistem:</h3>

  <div class="anatomy-grid">
    <div class="anatomy-card" style="border-top:4px solid #FF6680;">
      <div class="anatomy-header">1. Hat / C-Block (Wadah Induk)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Memiliki rongga di dalamnya untuk menampung perintah lain (seperti setup dan loop).</p>
      ${cBlock('#FF6680', 'void setup() {', stmtBlock('#4CBFE6', 'Serial.println ' + pillInput('"Halo Robot!"')), '}')}
    </div>

    <div class="anatomy-card" style="border-top:4px solid #9966FF;">
      <div class="anatomy-header">2. Statement Block (Blok Aksi)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Memiliki lekuk puzzle atas & bawah untuk disusun bertumpuk.</p>
      ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
      <div style="margin-top:4px;"></div>
      ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
    </div>

    <div class="anatomy-card" style="border-top:4px solid #A855F7;">
      <div class="anatomy-header">3. Reporter Pill (Kapsul Nilai Data)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Berbentuk bulat lonjong yang menghasilkan nilai angka atau status sensor.</p>
      <div style="display:flex; flex-direction:column; gap:4px;">
        ${reporterPill('#9966FF', 'digitalRead Pin ' + pillInput('2'))}
        ${reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0'))}
        ${reporterPill('#A855F7', 'Read Ultrasonic HC-SR04 Trig ' + pillInput('12') + ' Echo ' + pillInput('13') + ' (cm)')}
      </div>
    </div>

    <div class="anatomy-card" style="border-top:4px solid #4C97FF;">
      <div class="anatomy-header">4. Blok Percabangan Logika (If-Else)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 6px 0;">Memeriksa kondisi: jika benar jalankan tumpukan atas, jika tidak jalankan tumpukan bawah.</p>
      ${cBlock('#4C97FF', 'jika ' + reporterPill('#3B82F6', 'Tombol == HIGH') + ' maka', stmtBlock('#9966FF', 'digitalWrite Pin 13 to HIGH'), 'selain itu {')}
      <div style="padding-left:12px; margin-top:2px;">
        ${stmtBlock('#9966FF', 'digitalWrite Pin 13 to LOW')}
      </div>
      <div style="font-weight:bold; color:white; padding:1px 0 0 4px;">}</div>
    </div>
  </div>

  ${tipsBox('smart', 'Fitur Live Code Generator di RoboLab Studio:', `
    Setiap kali kamu menaruh atau memodifikasi sebuah blok di kanvas, RoboLab Studio secara instan dan otomatis menuliskan kode C++ Arduino di jendela sebelah kanan! Ini adalah cara terbaik memahami hubungan antara logika visual dan sintaksis kode asli.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5: BAGIAN A - DASAR IOT & ROBOTIKA: APA ITU IOT & ROBOTIKA
// ─────────────────────────────────────────────────────────────────────────────
const p5_PartA_Intro = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #0284C7, #0369A1);">
    <div class="project-tag">BAGIAN A • DASAR IOT & ROBOTIKA (PELAJARAN 1)</div>
    <h3 class="project-title">🌐 Memahami Apa Itu Robotika & Internet of Things (IoT)</h3>
    <div class="project-goal">Membuka wawasan tentang bagaimana teknologi cerdas bekerja dan mengubah dunia di sekitar kita!</div>
  </div>

  <div class="two-col-layout" style="margin-top:10px;">
    <!-- ROBOTIKA -->
    <div class="feature-item-card" style="border-top:4px solid #0284C7;">
      <h4 style="margin:0 0 6px 0; color:#0369A1; font-family:'Fredoka',sans-serif; font-size:15px;">🤖 1. Apa Itu Robotika?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.45;">
        <strong>Robotika</strong> adalah cabang ilmu dan teknologi yang menggabungkan <strong>Mekanika</strong> (badan & rangka robot), <strong>Elektronika</strong> (otot motor, kabel, baterai & sensor), serta <strong>Komputasi / Coding</strong> (otak pintar mikrokontroler).
      </p>
      <div class="highlight-card" style="background:#F0F9FF; border-color:#BAE6FD; font-size:10px; margin-top:6px;">
        <strong>Tiga Hukum Kerja Robot:</strong><br>
        1. <strong>Merasakan (Sense):</strong> Membaca lingkungan melalui sensor (mata ultrasonik, sensor garis).<br>
        2. <strong>Berpikir (Think):</strong> Mengolah data dengan mikrokontroler sesuai program blok.<br>
        3. <strong>Bertindak (Act):</strong> Menggerakkan motor, menyalakan lampu, atau membunyikan alarm!
      </div>
    </div>

    <!-- IOT -->
    <div class="feature-item-card" style="border-top:4px solid #16A34A;">
      <h4 style="margin:0 0 6px 0; color:#15803D; font-family:'Fredoka',sans-serif; font-size:15px;">🌐 2. Apa Itu Internet of Things (IoT)?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.45;">
        <strong>Internet of Things (IoT)</strong> adalah konsep di mana benda-benda di sekitar kita (lampu kamar, kunci pintu, penyiram tanaman, termometer) ditanami chip mikrokontroler dan antena WiFi sehingga <strong>terhubung ke internet</strong> dan dapat saling berbicara serta dikendalikan dari smartphone dari mana saja di seluruh dunia!
      </p>
      <div class="highlight-card" style="background:#F0FDF4; border-color:#BBF7D0; font-size:10px; margin-top:6px;">
        <strong>Contoh Nyata IoT di Kehidupan:</strong><br>
        • Smart Home: Mematikan AC dan lampu rumah dari kantor.<br>
        • Smart Agriculture: Kebun menyiram otomatis saat tanah kering.<br>
        • Smart City: Lampu jalanan menyala hanya jika ada mobil lewat.
      </div>
    </div>
  </div>

  ${tipsBox('cheer', 'Mengapa Mempelajari Robotika & IoT Sejak Dini?', `
    Di masa depan, hampir semua profesi akan berdampingan dengan kecerdasan buatan, otomasi, dan robot. Dengan belajar merakit sirkuit dan menyusun logika blok di RoboLab Studio, kamu tidak hanya menjadi penonton atau konsumen teknologi, melainkan menjadi <strong>Pencipta dan Penemu Teknologi Masa Depan!</strong>
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 6: BAGIAN A - MEMAHAMI APA ITU ARDUINO (REAL BOARD IMAGE)
// ─────────────────────────────────────────────────────────────────────────────
const p6_PartA_Arduino = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #00878F, #00666D);">
    <div class="project-tag">BAGIAN A • DASAR IOT & ROBOTIKA (PELAJARAN 2)</div>
    <h3 class="project-title">🧠 Memahami Apa Itu Arduino & Anatomi Hardware Asli</h3>
    <div class="project-goal">Mengenal papan mikrokontroler paling populer di dunia dan membedah setiap pin fungsionalnya!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- REAL ARDUINO IMAGE -->
    <div style="text-align:center;">
      <img src="${realArduinoUri}" alt="Arduino Uno Real Graphic" style="width:100%; max-width:270px; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.18));">
      <div style="font-size:10px; font-weight:bold; color:#00878F; margin-top:4px;">Gambar Real Hardware Arduino UNO R3</div>
    </div>

    <!-- EXPLANATION -->
    <div>
      <h4 class="subheading" style="margin-top:0;">Apa Itu Arduino Uno?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.4;">
        <strong>Arduino UNO R3</strong> adalah papan mikrokontroler open-source berbasis chip <strong>ATmega328P</strong>. Arduino bertindak sebagai otak yang menerima input dari sensor dan memberikan output perintah ke aktuator (LED, motor, buzzer).
      </p>
      
      <div class="highlight-card" style="background:#F0FDFA; border-color:#99F6E4; font-size:9.5px; line-height:1.4;">
        <strong>Spesifikasi Kunci Arduino Uno:</strong><br>
        • Tegangan Kerja: <strong>5 Volt DC</strong> (melalui USB atau Jack Adaptor 7-12V).<br>
        • Kecepatan Clock: <strong>16 MHz</strong>.<br>
        • Memori Flash: <strong>32 KB</strong> (tempat menyimpan program blok kita).
      </div>
    </div>
  </div>

  <h4 class="subheading" style="margin-top:8px;">Peta Pin Lengkap Arduino Uno:</h4>

  <div class="pin-category-list">
    <div class="pin-cat-item">
      <span class="pin-tag" style="background:#EF4444;">1. Pin Daya (Power)</span>
      <div class="pin-cat-desc">
        <strong>5V & 3.3V:</strong> Sumber listrik positif pembawa energi ke sensor dan modul.<br>
        <strong>GND (Ground):</strong> Kutub negatif listrik penutup sirkuit (wajib terhubung agar arus mengalir!).
      </div>
    </div>
    <div class="pin-cat-item">
      <span class="pin-tag" style="background:#9966FF;">2. Pin Digital (0 sampai 13)</span>
      <div class="pin-cat-desc">
        Pin serbaguna yang hanya mengenal dua kondisi pasti: <strong>HIGH (5V/ON)</strong> atau <strong>LOW (0V/OFF)</strong>.
      </div>
    </div>
    <div class="pin-cat-item">
      <span class="pin-tag" style="background:#F59E0B;">3. Pin PWM (Bertanda ~ seperti ~3, ~5, ~6, ~9, ~10, ~11)</span>
      <div class="pin-cat-desc">
        Pin digital istimewa yang bisa mengeluarkan sinyal denyut cepat (*PWM*) dengan nilai <strong>0 sampai 255</strong> untuk mengatur kecepatan motor atau redup-terang lampu.
      </div>
    </div>
    <div class="pin-cat-item">
      <span class="pin-tag" style="background:#10B981;">4. Pin Analog Input (A0 sampai A5)</span>
      <div class="pin-cat-desc">
        Pin khusus untuk membaca sensor dengan rentang nilai halus dari <strong>0 hingga 1023</strong> (misalnya sensor cahaya LDR dan potensiometer).
      </div>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 7: BAGIAN A - INSTALASI RANGKAIAN PADA PROJECT BOARD (BREADBOARD)
// ─────────────────────────────────────────────────────────────────────────────
const p7_PartA_Breadboard = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #475569, #1E293B);">
    <div class="project-tag">BAGIAN A • DASAR IOT & ROBOTIKA (PELAJARAN 3)</div>
    <h3 class="project-title">🔌 Instalasi Rangkaian Pada Project Board (Breadboard)</h3>
    <div class="project-goal">Membongkar rahasia jalur logam di dalam breadboard agar kabel dan komponen terpasang kokoh tanpa solder!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">Mengapa Disebut "Breadboard"?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.45;">
        Dahulu para insinyur merangkai sirkuit radio prototipe dengan menancapkan paku dan kawat di atas talenan pemotong roti sungguhan (*bread board*)! Kini, kita menggunakan papan plastik modern berlubang dengan penjepit logam di dalamnya.
      </p>
      
      <div class="highlight-card" style="background:#EFF6FF; border-color:#BFDBFE; font-size:10px;">
        <strong>Dua Jalur Rahasia Breadboard:</strong><br>
        1. <strong>🔴 Rel Daya Panjang (+ Merah & - Biru):</strong> Terhubung secara <strong>VERTIKAL</strong> memanjang dari ujung ke ujung. Sangat ideal untuk menyalurkan 5V dan GND ke seluruh rangkaian.<br>
        2. <strong>⚪ Jalur Terminal Baris (a-b-c-d-e):</strong> Terhubung secara <strong>HORIZONTAL</strong> per baris 5 lubang. Komponen yang ditancapkan pada baris yang sama akan saling tersambung secara otomatis!
      </div>
    </div>

    <div>
      <div style="display:flex; justify-content:center;">
        ${breadboardSVG(280, 110)}
      </div>
      <div style="font-size:9.5px; color:#64748B; text-align:center; margin-top:4px;">
        Diagram Anatomi Lempengan Logika Breadboard Half-Size
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:10px;">🛠️ Tiga Aturan Emas Merangkai Sirkuit yang Benar:</div>

  <div class="three-rule-grid">
    <div class="rule-box" style="border-top:3px solid #EF4444;">
      <strong style="color:#DC2626; font-size:11px;">1. JANGAN KORSLET (Short Circuit)!</strong>
      <p class="text-xs" style="color:#475569; margin:2px 0 0 0;">
        Jangan pernah mencolokkan kabel dari pin 5V langsung ke GND di rel yang sama tanpa ada beban komponen di tengahnya.
      </p>
    </div>
    <div class="rule-box" style="border-top:3px solid #F59E0B;">
      <strong style="color:#D97706; font-size:11px;">2. TANCAPKAN HINGGA RAPAT</strong>
      <p class="text-xs" style="color:#475569; margin:2px 0 0 0;">
        Pastikan kaki komponen dan jarum kabel jumper masuk sedalam mungkin ke dalam lubang agar tidak goyang (*bad contact*).
      </p>
    </div>
    <div class="rule-box" style="border-top:3px solid #10B981;">
      <strong style="color:#059669; font-size:11px;">3. GUNAKAN WARNA KABEL SESUAI STANDAR</strong>
      <p class="text-xs" style="color:#475569; margin:2px 0 0 0;">
        Gunakan warna <strong>Merah</strong> untuk VCC/5V, warna <strong>Biru/Hitam</strong> untuk GND, dan warna lain untuk sinyal data!
      </p>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 8: BAGIAN A - DASAR PEMROGRAMAN ARDUINO (SETUP & LOOP)
// ─────────────────────────────────────────────────────────────────────────────
const p8_PartA_Programming = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #FF6680, #EA580C);">
    <div class="project-tag">BAGIAN A • DASAR IOT & ROBOTIKA (PELAJARAN 4)</div>
    <h3 class="project-title">⚙️ Dasar Pemrograman Arduino: void setup() & void loop()</h3>
    <div class="project-goal">Memahami fondasi struktur program mikrokontroler dan aliran eksekusi blok kode!</div>
  </div>

  <div class="comparison-grid" style="margin-top:8px;">
    <!-- SETUP CARD -->
    <div class="comp-card" style="border-top:5px solid #FF6680;">
      <div class="comp-badge" style="background:#FF6680;">void setup() — DIJALANKAN HANYA 1 KALI</div>
      <p class="text-xs" style="color:#475569; margin:6px 0;">
        Fungsi persiapan awal saat mikrokontroler pertama kali mendapat aliran listrik atau tombol Reset ditekan. Digunakan untuk menyiapkan nomor pin dan memulai koneksi.
      </p>
      <div class="block-preview-box">
        ${cBlock('#FF6680', 'void setup() {', `
          ${stmtBlock('#4CBFE6', 'Serial.println ' + pillInput('"RoboLab Siap!"'))}
        `, '}')}
      </div>
      <div class="code-box-mini">
        <pre>void setup() {\n  Serial.begin(115200);\n  Serial.println("RoboLab Siap!");\n}</pre>
      </div>
    </div>

    <!-- LOOP CARD -->
    <div class="comp-card" style="border-top:5px solid #FFAB19;">
      <div class="comp-badge" style="background:#FFAB19;">void loop() — BERULANG SELAMANYA</div>
      <p class="text-xs" style="color:#475569; margin:6px 0;">
        Jantung utama tempat kode dieksekusi terus-menerus dari atas ke bawah, lalu melompat kembali ke baris pertama seketika baris terakhir selesai dikerjakan!
      </p>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('HIGH', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
        `, '}')}
      </div>
      <div class="code-box-mini">
        <pre>void loop() {\n  digitalWrite(13, HIGH);\n  delay(1000);\n}</pre>
      </div>
    </div>
  </div>

  <h4 class="subheading" style="margin-top:6px;">Aliran Eksekusi Program (Flowchart Logika):</h4>
  <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:6px; padding:6px 12px; font-size:10.5px; color:#334155;">
    <strong>Listrik Masuk</strong> ➔ Jalankan <code>void setup()</code> (1x) ➔ Masuk ke <code>void loop()</code> ➔ Baris 1 ➔ Baris 2 ➔ Baris 3 ➔ <strong>Kembali ke Baris 1 loop()</strong> ➔ (Ulangi tanpa henti sampai baterai dilepas).
  </div>

  ${tipsBox('smart', 'Kapan Kode Ditaruh di Setup vs di Loop?', `
    Jika perintah itu adalah <strong>konfigurasi awal</strong> (seperti menghubungkan WiFi atau inisialisasi sensor), taruhlah di <code>void setup()</code>. Jika perintah itu adalah <strong>pemeriksaan berkala</strong> (seperti membaca tombol, menyalakan lampu, menggerakkan motor), taruhlah di <code>void loop()</code>!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 9: BAGIAN B - MENYALAKAN & MEMATIKAN LED (LANGSUNG TANPA RESISTOR & GND SOLID)
// ─────────────────────────────────────────────────────────────────────────────
const p9_PartB_LedDirect = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #9966FF, #7C3AED);">
    <div class="project-tag">BAGIAN B • INPUT-OUTPUT ARDUINO & SENSOR (PELAJARAN 1)</div>
    <h3 class="project-title">💡 Menghidupkan dan Mematikan LED (Rangkaian Langsung)</h3>
    <div class="project-goal">Misi: Mengendalikan status digital output untuk membuat lampu LED berkedip secara langsung tanpa resistor!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- RANGKAIAN USER SPECIFIED: NO RESISTOR & GND CONTINUOUS -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Langsung (Tanpa Resistor):</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitLedDirectSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Langkah Pemasangan Kabel (Sangat Mudah):</strong>
        <ol style="margin:2px 0; padding-left:16px; color:#475569; font-size:9.5px;">
          <li>Ambil 1 buah <strong>Lampu LED 5mm</strong>. Perhatikan kaki Anoda (+) yang lebih panjang dan Katoda (-) yang lebih pendek.</li>
          <li>Hubungkan kaki <strong>Anoda (+)</strong> langsung ke <strong>Pin Digital 13</strong> menggunakan kabel jumper merah.</li>
          <li>Hubungkan kaki <strong>Katoda (-)</strong> langsung ke <strong>Pin GND Arduino</strong> menggunakan kabel jumper biru/hitam.</li>
          <li><strong>PENTING:</strong> Pastikan kabel jalur ke GND terhubung rapat dan tidak putus agar sirkuit tertutup sempurna!</li>
        </ol>
      </div>
    </div>

    <!-- BLOK & KODE -->
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
        <div class="code-box-title">Kode C++ Arduino Ekuivalen:</div>
        <pre>void setup() {\n  pinMode(13, OUTPUT);\n}\nvoid loop() {\n  digitalWrite(13, HIGH); // Lampu Menyala\n  delay(1000);            // Tunggu 1 detik\n  digitalWrite(13, LOW);  // Lampu Padam\n  delay(1000);            // Tunggu 1 detik\n}</pre>
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Mengapa Pin 13 Sangat Istimewa di Arduino Uno?', `
    Di papan Arduino Uno asli, Pin 13 sudah memiliki lampu indikator LED kecil berhuruf <strong>'L'</strong> langsung di badannya! Jadi saat kamu menjalankan blok <code>digitalWrite Pin 13 to HIGH</code>, lampu LED eksternal di breadboard dan lampu LED 'L' di papan Arduino akan berkedip bersamaan!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 10: BAGIAN B - PUSH BUTTON & LED (DIGITAL INPUT)
// ─────────────────────────────────────────────────────────────────────────────
const p10_PartB_ButtonLed = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8);">
    <div class="project-tag">BAGIAN B • INPUT-OUTPUT ARDUINO & SENSOR (PELAJARAN 2)</div>
    <h3 class="project-title">🔘 Menghubungkan LED dan Push Button dengan Arduino</h3>
    <div class="project-goal">Misi: Mengambil input dari tombol fisik dan menyalakan lampu hanya saat tombol ditekan!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Tombol & LED:</h4>
      <div style="display:flex; justify-content:center; margin-bottom:4px;">
        ${circuitButtonRealSVG(300, 135)}
      </div>
      <div class="component-list-box">
        <strong>Pengkabelan Push Button & LED:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li>Kaki 1 Tombol -> Hubungkan ke <strong>5V</strong>.</li>
          <li>Kaki 2 Tombol -> Hubungkan ke <strong>Pin Digital 2</strong> (kabel sinyal).</li>
          <li>Resistor 10kΩ (*Pull-down*) -> Dari Kaki 2 Tombol ke <strong>GND</strong>.</li>
          <li>LED Anoda (+) -> Pin 13 | LED Katoda (-) -> <strong>GND rapat</strong>.</li>
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
          <div style="padding-left:12px; margin-top:2px;">
            ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('13') + ' to ' + pillInput('LOW', true))}
          </div>
          <div style="font-weight:bold; color:white; padding:1px 0 0 4px;">}</div>
        `, '}')}
      </div>

      <div class="code-box-mini">
        <div class="code-box-title">Logika Keputusan (Decision Making):</div>
        <pre>digitalRead(2) membaca apakah ada tegangan masuk.\nJika Tombol DITEKAN ➔ Status HIGH ➔ Nyalakan LED 13\nJika Tombol DILEPAS  ➔ Status LOW  ➔ Matikan LED 13</pre>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Mengenal Blok digitalRead di RoboLab Studio:', `
    Blok <code>digitalRead Pin [2]</code> berbentuk <strong>Reporter Pill (kapsul lonjong)</strong> karena ia menghasilkan nilai (data). Kapsul ini dapat dipasangkan ke dalam slot pembanding blok <code>jika ... maka</code> untuk mengontrol alur program robot!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 11: BAGIAN B - MENGGUNAKAN RELAY UNTUK ON/OFF LAMPU RUMAH
// ─────────────────────────────────────────────────────────────────────────────
const p11_PartB_Relay = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #1E40AF, #0F172A);">
    <div class="project-tag">BAGIAN B • INPUT-OUTPUT ARDUINO & SENSOR (PELAJARAN 3)</div>
    <h3 class="project-title">⚡ Menggunakan Relay untuk ON/OFF Lampu Rumah (220V)</h3>
    <div class="project-goal">Misi: Mengendalikan peralatan listrik tegangan tinggi PLN rumah tangga secara aman menggunakan saklar otomatis relay!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Pengkabelan Modul Relay 5V:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitRelayModuleSVG(300, 140)}
      </div>
      <div class="component-list-box">
        <strong>Pin Kontrol Modul Relay:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9.5px; color:#475569;">
          <li><strong>VCC:</strong> Hubungkan ke Pin 5V Arduino.</li>
          <li><strong>GND:</strong> Hubungkan ke Pin GND Arduino (terhubung rapat).</li>
          <li><strong>IN (Sinyal):</strong> Hubungkan ke Pin Digital 7 Arduino.</li>
          <li><strong>Terminal Output:</strong> COM (Common) & NO (Normally Open) memutus jalur kabel fasa lampu 220V.</li>
        </ul>
      </div>
    </div>

    <!-- BLOK & PENJELASAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          <div style="font-size:9.5px; color:#64748B; margin-bottom:2px;">// Menyalakan Lampu Rumah (Relay Aktif)</div>
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('7') + ' to ' + pillInput('HIGH', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('3000') + ' ms')}
          <div style="font-size:9.5px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Mematikan Lampu Rumah (Relay Nonaktif)</div>
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('7') + ' to ' + pillInput('LOW', true))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('3000') + ' ms')}
        `, '}')}
      </div>

      <div class="highlight-card" style="background:#FFFBEB; border-color:#FDE68A; margin-top:6px;">
        <div style="font-weight:bold; color:#B45309; font-size:10.5px;">🧲 Bagaimana Relay Bekerja?</div>
        <p class="text-xs" style="color:#92400E; margin:2px 0 0 0;">
          Relay adalah <strong>saklar elektromagnetik</strong>. Saat Arduino mengirim sinyal HIGH 5V, sebuah kumparan kawat di dalam relay berubah menjadi magnet yang menarik tuas saklar logam dengan bunyi <em>"klik!"</em>. Sisi tegangan rendah (Arduino 5V) dan sisi tegangan tinggi (PLN 220V) terisolasi secara total sehingga sangat aman!
        </p>
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'Peringatan Keselamatan Tegangan Tinggi PLN 220V:', `
    Tegangan 220V PLN di rumah sangat berbahaya jika tersentuh tangan! Saat mempraktikkan proyek relay pertama kali, disarankan menggunakan beban lampu belajar 12V DC atau mintalah pendampingan orang tua/guru saat menghubungkan ke steker stopkontak listrik rumah.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 12: BAGIAN B - SINYAL ANALOG & PWM (DIMMER LAMPU)
// ─────────────────────────────────────────────────────────────────────────────
const p12_PartB_AnalogPwm = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #0284C7, #0F766E);">
    <div class="project-tag">BAGIAN B • INPUT-OUTPUT ARDUINO & SENSOR (PELAJARAN 4)</div>
    <h3 class="project-title">🌊 Sinyal Analog & PWM (Pulse Width Modulation)</h3>
    <div class="project-goal">Misi: Mengatur tingkat terang-redup lampu LED secara bertahap menggunakan putaran potensiometer!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian Dimmer Potensiometer:</h4>
      <div style="display:flex; justify-content:center; margin-bottom:4px;">
        ${circuitPotRealSVG(300, 130)}
      </div>

      <div class="component-list-box">
        <strong>Pengkabelan Dimmer PWM & Potensiometer:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li>Kaki 1 Potensio -> <strong>5V</strong> | Kaki 3 -> <strong>GND</strong>.</li>
          <li>Kaki 2 (Tengah) -> <strong>Pin A0</strong> (Sinyal analog 0-1023).</li>
          <li>LED Anoda (+) -> <strong>Pin ~9 (PWM)</strong> | Katoda (-) -> <strong>GND rapat</strong>.</li>
        </ul>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#9966FF', 'analogWrite Pin ' + pillInput('9') + ' to value ' + reporterPill('#59C059', reporterPill('#9966FF', 'analogRead Pin ' + pillInput('A0')) + ' / ' + pillInput('4')))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('20') + ' ms')}
        `, '}')}
      </div>

      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; margin-top:6px;">
        <div style="font-weight:bold; color:#166534; font-size:10.5px;">📐 Rumus Matematika Skala: (Input / 4)</div>
        <p class="text-xs" style="color:#14532D; margin:2px 0 0 0; line-height:1.4;">
          Arduino membaca Analog Input 10-bit dari angka <strong>0 sampai 1023</strong>.<br>
          Sedangkan Pin PWM Analog Output 8-bit menerima angka <strong>0 sampai 255</strong>.<br>
          Karena <code>1024 ÷ 4 = 256</code>, membagi hasil bacaan dengan angka 4 menghasilkan konversi skala yang sangat presisi!
        </p>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Tahukah Kamu Trik Rahasia PWM?', `
    Arduino sebenarnya tidak menurunkan tegangan menjadi 2V atau 3V. Melainkan Arduino menyalakan dan mematikan lampu dengan <strong>kecepatan 1000 kali per detik</strong>! Mata manusia tidak mampu melihat kedipan secepat itu, sehingga otak kita melihatnya sebagai lampu redup yang indah.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 13: BAGIAN C - MENGENAL MOTOR DC & PENGENDALIANNYA
// ─────────────────────────────────────────────────────────────────────────────
const p13_PartC_MotorDc = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #FF6D00, #C2410C);">
    <div class="project-tag">BAGIAN C • PENGENDALIAN MOTOR & KOMUNIKASI I2C (PELAJARAN 1)</div>
    <h3 class="project-title">🏎️ Mengenal Motor DC & Prinsip Pengendalian Gerak</h3>
    <div class="project-goal">Misi: Memahami bagaimana motor arus searah (DC) mengubah energi listrik menjadi putaran roda robot!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">Apa Itu Motor DC?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.45;">
        <strong>Motor DC (Direct Current)</strong> adalah aktuator utama yang memutar roda mobil robot. Di dalamnya terdapat kumparan tembaga dan magnet permanen. Saat dialiri arus searah, medan magnet saling tolak-menolak dan memutar poros as roda dengan sangat cepat.
      </p>

      <div style="display:flex; align-items:center; gap:10px; margin:8px 0;">
        <img src="${realMotorDcUri}" alt="Motor DC Kuning TT" style="height:55px;">
        <div style="font-size:10px; color:#475569;">
          <strong>Motor Gearbox Kuning TT:</strong> Dilengkapi roda gigi penurun kecepatan (*gear reduction 1:48*) untuk menghasilkan tenaga torsi kuat pembawa sasis robot!
        </div>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">Bagaimana Membalik Arah Putaran Roda?</h4>
      <div class="highlight-card" style="background:#FFF7ED; border-color:#FFEDD5; font-size:10px; line-height:1.45;">
        Arah putaran motor DC ditentukan oleh <strong>polaritas kutub positif (+) dan negatif (-)</strong>:<br><br>
        • <strong>Putar Maju (Searah Jarum Jam):</strong><br>
        Kutub A = (+) 5V | Kutub B = (-) GND<br><br>
        • <strong>Putar Mundur (Berlawanan Jarum Jam):</strong><br>
        Kutub A = (-) GND | Kutub B = (+) 5V (Dibalik!)<br><br>
        • <strong>Berhenti (Rem):</strong><br>
        Kutub A = LOW | Kutub B = LOW
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:10px;">⚠️ Mengapa Motor DC Tidak Boleh Dicolok Langsung ke Pin Arduino?</div>
  <div style="background:#FEE2E2; border:1.5px solid #FCA5A5; border-radius:6px; padding:6px 10px; font-size:10px; color:#991B1B; line-height:1.4;">
    Pin mikrokontroler Arduino hanya mampu mengeluarkan arus maksimal <strong>40 miliampere (mA)</strong>. Sedangkan sebuah motor DC saat mulai berputar membutuhkan arus besar antara <strong>300 mA hingga 1000 mA (1 Ampere)</strong>! Menancapkan motor langsung ke pin Arduino akan merusak chip mikrokontroler. Karena itulah kita <strong>wajib menggunakan Motor Driver</strong> sebagai jembatan penguat daya!
  </div>

  ${tipsBox('doctor', 'Prinsip Kerja H-Bridge:', `
    Motor Driver memiliki rangkaian 4 saklar transistor berbentuk huruf <strong>'H'</strong> (*H-Bridge*). Driver ini memungkinkan arus baterai besar mengalir maju atau mundur ke motor hanya dengan perintah sinyal digital kecil dari Arduino.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 14: BAGIAN C - MENGENAL MOTOR SERVO & SUDUT DERAJAT
// ─────────────────────────────────────────────────────────────────────────────
const p14_PartC_Servo = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #EA580C, #9A3412);">
    <div class="project-tag">BAGIAN C • PENGENDALIAN MOTOR & KOMUNIKASI I2C (PELAJARAN 2)</div>
    <h3 class="project-title">🦾 Mengenal Motor Servo & Pengendalian Sudutnya</h3>
    <div class="project-goal">Misi: Mengendalikan lengan mekanik dan palang otomatis tepat pada sudut 0° hingga 180° menggunakan motor servo!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Pengkabelan Motor Servo SG90:</h4>
      <div style="display:flex; justify-content:center; margin-bottom:4px;">
        ${circuitServoRealSVG(300, 135)}
      </div>

      <div class="component-list-box">
        <strong>Penting! 3 Warna Kabel Servo SG90:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li>🟤 <strong>Cokelat:</strong> GND (Kutub negatif listrik, terhubung rapat).</li>
          <li>🔴 <strong>Merah:</strong> 5V (Daya positif penggerak motor).</li>
          <li>🟠 <strong>Oranye:</strong> Pin ~9 (Sinyal PWM pengatur sudut 0° - 180°).</li>
        </ul>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${cBlock('#FFAB19', 'void loop() {', `
          <div style="font-size:9.5px; color:#64748B; margin-bottom:2px;">// Gerak ke Sudut 0 Derajat (Palang Tutup)</div>
          ${stmtBlock('#FF6D00', 'Servo on Pin ' + pillInput('9') + ' write angle ' + pillInput('0'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1500') + ' ms')}
          <div style="font-size:9.5px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Gerak ke Sudut 90 Derajat (Palang Buka)</div>
          ${stmtBlock('#FF6D00', 'Servo on Pin ' + pillInput('9') + ' write angle ' + pillInput('90'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1500') + ' ms')}
          <div style="font-size:9.5px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Gerak Maksimal ke 180 Derajat</div>
          ${stmtBlock('#FF6D00', 'Servo on Pin ' + pillInput('9') + ' write angle ' + pillInput('180'))}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1500') + ' ms')}
        `, '}')}
      </div>

      <div class="code-box-mini">
        <pre>#include &lt;Servo.h&gt;\nServo myServo9;\nvoid setup() {\n  myServo9.attach(9);\n}\nvoid loop() {\n  myServo9.write(0);  delay(1500);\n  myServo9.write(90); delay(1500);\n}</pre>
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Penerapan Keren Motor Servo di Dunia Nyata:', `
    Motor servo digunakan pada kemudi sirip pesawat terbang, capit lengan robot industri perakit mobil, kamera pengintai CCTV pan-tilt, hingga palang pintu otomatis jalan tol!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 15: BAGIAN C - MOTOR DRIVER L298 MINI / MX1508 (PENGATUR ARAH & KECEPATAN)
// ─────────────────────────────────────────────────────────────────────────────
const p15_PartC_L298N = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #DC2626, #991B1B);">
    <div class="project-tag">BAGIAN C • PENGENDALIAN MOTOR & KOMUNIKASI I2C (PELAJARAN 3)</div>
    <h3 class="project-title">🛡️ Mengenal Motor Driver L298 Mini (MX1508): Otot Penggerak Robot</h3>
    <div class="project-goal">Misi: Mengatur arah putaran (maju/mundur) dan kecepatan motor DC secara mandiri dengan modul L298 Mini yang ringan & lincah!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- DIAGRAM L298 MINI -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Modul Driver L298 Mini (MX1508):</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitL298MiniSVG(300, 135)}
      </div>
      <div class="component-list-box">
        <strong>Pin & Terminal L298 Mini (MX1508):</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li><strong>MOTOR-A:</strong> Dihubungkan ke 2 kabel Motor Kiri.</li>
          <li><strong>MOTOR-B:</strong> Dihubungkan ke 2 kabel Motor Kanan.</li>
          <li><strong>+ (VCC) & - (GND):</strong> Sumber daya baterai (2V - 10V, ideal 7.4V Li-Ion).</li>
          <li><strong>IN1, IN2:</strong> Mengatur arah & kecepatan (PWM) Motor Kiri.</li>
          <li><strong>IN3, IN4:</strong> Mengatur arah & kecepatan (PWM) Motor Kanan.</li>
          <li><strong>Keunggulan Mini:</strong> Berat cuma ~5 gram (sangat enteng), tanpa ribet jumper ENA/ENB!</li>
        </ul>
      </div>
    </div>

    <!-- LOGIKA TABEL -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Tabel Logika Gerak Motor Driver:</h4>
      
      <div class="scale-table" style="background:#FEF2F2; border-color:#FECACA;">
        <div class="scale-header" style="color:#991B1B;">Kombinasi Pin Logika IN1 - IN4:</div>
        <div class="scale-row" style="color:#7F1D1D; font-weight:bold;"><span>Arah Gerak</span><span>IN1 / IN2</span><span>IN3 / IN4</span></div>
        <div class="scale-row"><span>🚀 MAJU</span><span>PWM 200 / LOW</span><span>PWM 200 / LOW</span></div>
        <div class="scale-row"><span>🔙 MUNDUR</span><span>LOW / PWM 200</span><span>LOW / PWM 200</span></div>
        <div class="scale-row"><span>↩️ BELOK KIRI</span><span>LOW / PWM 180</span><span>PWM 180 / LOW</span></div>
        <div class="scale-row"><span>↪️ BELOK KANAN</span><span>PWM 180 / LOW</span><span>LOW / PWM 180</span></div>
        <div class="scale-row"><span>🛑 BERHENTI</span><span>LOW / LOW</span><span>LOW / LOW</span></div>
      </div>

      <h4 class="subheading" style="margin-top:8px;">Contoh Blok Maju di RoboLab Studio:</h4>
      <div class="block-preview-box" style="padding:4px 8px;">
        ${stmtBlock('#9966FF', 'analogWrite Pin ' + pillInput('18') + ' to value ' + pillInput('200'))}
        ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('19') + ' to ' + pillInput('LOW', true))}
        ${stmtBlock('#9966FF', 'analogWrite Pin ' + pillInput('22') + ' to value ' + pillInput('200'))}
        ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('23') + ' to ' + pillInput('LOW', true))}
      </div>
    </div>
  </div>

  ${tipsBox('doctor', 'PENTING: Satukan Ground (Common Ground)!', `
    Kutub negatif (GND) baterai motor dan pin GND mikrokontroler (Arduino/ESP32) <strong>WAJIB DIHUBUNGKAN MENJADI SATU</strong> pada terminal GND L298 Mini! Jika ground tidak disatukan rapat, sinyal logika dari mikrokontroler tidak akan terbaca oleh driver motor!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 16: BAGIAN C - KOMUNIKASI I2C & LAYAR LCD 16X2 I2C
// ─────────────────────────────────────────────────────────────────────────────
const p16_PartC_I2C = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #059669, #047857);">
    <div class="project-tag">BAGIAN C • PENGENDALIAN MOTOR & KOMUNIKASI I2C (PELAJARAN 4)</div>
    <h3 class="project-title">📟 Komunikasi I2C & Tampilan Layar LCD 16x2 I2C</h3>
    <div class="project-goal">Misi: Menampilkan teks, skor pertandingan robot, dan nilai sensor pada layar LCD menggunakan protokol I2C!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian LCD 16x2 I2C:</h4>
      <div style="display:flex; justify-content:center; margin-bottom:4px;">
        ${circuitLcdRealSVG(300, 135)}
      </div>

      <div class="component-list-box">
        <strong>Pengkabelan 4 Pin I2C LCD:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li><strong>GND:</strong> Hubungkan ke pin <strong>GND</strong> rapat.</li>
          <li><strong>VCC:</strong> Hubungkan ke pin <strong>5V</strong> Arduino.</li>
          <li><strong>SDA (Data):</strong> Hubungkan ke pin <strong>A4</strong> Arduino (atau GPIO 21 ESP32).</li>
          <li><strong>SCL (Clock):</strong> Hubungkan ke pin <strong>A5</strong> Arduino (atau GPIO 22 ESP32).</li>
        </ul>
      </div>
    </div>

    <div>
      <h4 class="subheading" style="margin-top:0;">2. Susunan Blok di RoboLab Studio:</h4>
      <div class="block-preview-box">
        ${stmtBlock('#06B6D4', 'lcd.begin(16, 2); // Inisialisasi Layar')}
        ${stmtBlock('#06B6D4', 'lcd.setCursor(0, 0); // Baris 1')}
        ${stmtBlock('#06B6D4', 'lcd.print ' + pillInput('"RoboLab Soccer"'))}
        ${stmtBlock('#06B6D4', 'lcd.setCursor(0, 1); // Baris 2')}
        ${stmtBlock('#06B6D4', 'lcd.print ' + pillInput('"Skor: 3 - 1"'))}
      </div>

      <div class="highlight-card" style="background:#ECFDF5; border-color:#A7F3D0; font-size:9.5px; margin-top:8px; line-height:1.4;">
        <strong>Mengapa I2C Sangat Menghemat Kabel?</strong><br>
        Layar LCD biasa tanpa modul I2C butuh <strong>16 kabel jumper</strong> yang rumit. Dengan backpack chip I2C (PCFa8574), cukup <strong>4 kabel saja</strong> dan layar langsung menyala menampilkan skor robotmu!
      </div>
    </div>
  </div>

  ${tipsBox('smart', 'Alamat I2C Layar LCD (Address 0x27):', `
    Setiap modul I2C memiliki identitas alamat unik (*I2C address*). Modul LCD 16x2 umumnya menggunakan alamat standar <code>0x27</code> atau <code>0x3F</code>. RoboLab Studio secara otomatis mendeteksi alamat ini sehingga kamu tinggal pakai!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 17: BAGIAN D - PENGENALAN ESP32 & PERBEDAANNYA DENGAN ARDUINO
// ─────────────────────────────────────────────────────────────────────────────
const p17_PartD_Esp32 = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #10B981, #047857);">
    <div class="project-tag">BAGIAN D • KONEKTIVITAS IOT DENGAN ESP32 (PELAJARAN 1)</div>
    <h3 class="project-title">🚀 Pengenalan ESP32 & Perbandingannya dengan Arduino</h3>
    <div class="project-goal">Mengenal papan monster IoT yang memiliki prosesor dual-core kencang, WiFi, dan Bluetooth bawaan!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- REAL ESP32 GRAPHIC -->
    <div style="text-align:center;">
      <img src="${realEsp32Uri}" alt="ESP32 DevKit V4 Real Graphic" style="width:100%; max-width:260px; filter:drop-shadow(0 6px 12px rgba(0,0,0,0.18));">
      <div style="font-size:10px; font-weight:bold; color:#047857; margin-top:4px;">Gambar Real Hardware ESP32 DevKit V4</div>
    </div>

    <!-- COMPARISON TABLE -->
    <div>
      <h4 class="subheading" style="margin-top:0;">Tabel Head-to-Head: Uno vs ESP32</h4>
      <div class="scale-table" style="background:#F0FDF4; border-color:#A7F3D0; font-size:9.5px;">
        <div class="scale-row" style="font-weight:bold; color:#14532D;"><span>Fitur</span><span>Arduino Uno</span><span>ESP32 DevKit</span></div>
        <div class="scale-row"><span>Otak Processor</span><span>8-bit ATmega</span><span>32-bit Dual-Core</span></div>
        <div class="scale-row"><span>Kecepatan</span><span>16 MHz</span><span>240 MHz (15x Lebih Cepat!)</span></div>
        <div class="scale-row"><span>Memori Flash</span><span>32 KB</span><span>4 MB (128x Lebih Luas!)</span></div>
        <div class="scale-row"><span>Koneksi WiFi</span><span>Tidak Ada</span><span>Ada (2.4 GHz B/G/N)</span></div>
        <div class="scale-row"><span>Bluetooth</span><span>Tidak Ada</span><span>Ada (v4.2 BR/EDR & BLE)</span></div>
        <div class="scale-row"><span>Tegangan Logika</span><span>5 Volt</span><span>3.3 Volt</span></div>
        <div class="scale-row"><span>Resolusi ADC</span><span>10-bit (0-1023)</span><span>12-bit (0-4095)</span></div>
      </div>
    </div>
  </div>

  <h4 class="subheading" style="margin-top:8px;">Aturan Penting Memilih Pin ADC Pada ESP32:</h4>
  <div style="background:#FEF3C7; border:1.5px solid #FCD34D; border-radius:6px; padding:6px 10px; font-size:10px; color:#92400E; line-height:1.4;">
    ESP32 memiliki dua kelompok pengontrol analog: <strong>ADC1</strong> dan <strong>ADC2</strong>.<br>
    • <strong>PIN AMAN (ADC1):</strong> GPIO 32, 33, 34, 35, 36, 39. Pin ini bebas digunakan kapan saja!<br>
    • <strong>HINDARI SAAT WIFI AKTIF (ADC2):</strong> GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27. Jika sensor analog dipasang pada pin ADC2 saat WiFi menyala, ESP32 akan freeze/crash karena kontroler ADC2 diambil alih oleh antena WiFi!
  </div>

  ${tipsBox('doctor', 'Peringatan Tegangan ESP32 (3.3V):', `
    ESP32 bekerja dengan level tegangan logika <strong>3.3 Volt</strong>. Selalu gunakan pin 3V3 untuk memberi daya pada sensor-sensor ESP32 agar chip tidak kepanasan.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 18: BAGIAN D - KONEKSI NIRKABEL: WIFI & BLUETOOTH ESP32
// ─────────────────────────────────────────────────────────────────────────────
const p18_PartD_WifiBt = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #0284C7, #0369A1);">
    <div class="project-tag">BAGIAN D • KONEKTIVITAS IOT DENGAN ESP32 (PELAJARAN 2)</div>
    <h3 class="project-title">📡 Koneksi Nirkabel: WiFi & Bluetooth Pada ESP32</h3>
    <div class="project-goal">Misi: Menghubungkan mikrokontroler ke router WiFi internet dan perangkat Bluetooth smartphone!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- WIFI SECTION -->
    <div class="feature-item-card" style="border-top:4px solid #0284C7;">
      <h4 style="margin:0 0 4px 0; color:#0369A1; font-family:'Fredoka',sans-serif; font-size:14px;">📶 1. Menghubungkan ke Jaringan WiFi</h4>
      <p class="text-xs" style="color:#475569; line-height:1.4;">
        ESP32 dapat bertindak sebagai <strong>Station (STA)</strong> yang bergabung ke router WiFi rumah atau Hotspot HP kamu.
      </p>
      
      <div class="block-preview-box" style="margin-top:4px;">
        ${stmtBlock('#0284C7', 'WiFi.begin(' + pillInput('"WiFi-Rumah"') + ', ' + pillInput('"Sandi1234"') + ');')}
      </div>
      
      <div class="highlight-card" style="background:#EFF6FF; border-color:#BFDBFE; font-size:9.5px; margin-top:4px;">
        Setelah terhubung, ESP32 akan mendapatkan sebuah <strong>Alamat IP unik</strong> (contoh: <code>192.168.1.15</code>) untuk saling bertukar data di internet.
      </div>
    </div>

    <!-- BLUETOOTH SECTION -->
    <div class="feature-item-card" style="border-top:4px solid #8B5CF6;">
      <h4 style="margin:0 0 4px 0; color:#6D28D9; font-family:'Fredoka',sans-serif; font-size:14px;">📱 2. Bluetooth Serial Tanpa Internet</h4>
      <p class="text-xs" style="color:#475569; line-height:1.4;">
        Jika di lapangan pertandingan robot soccer tidak ada sinyal internet/WiFi, kamu bisa menggunakan <strong>Bluetooth Serial</strong> untuk mengontrol robot langsung dari HP!
      </p>
      
      <div class="block-preview-box" style="margin-top:4px;">
        ${stmtBlock('#8B5CF6', 'SerialBT.begin(' + pillInput('"RobotSoccer-01"') + ');')}
      </div>
      
      <div class="highlight-card" style="background:#F5F3FF; border-color:#DDD6FE; font-size:9.5px; margin-top:4px;">
        Buka Bluetooth di ponselmu, pasangkan (*pairing*) dengan nama robot, dan kamu bisa mengirimkan karakter kendali (<code>F</code>=Maju, <code>B</code>=Mundur).
      </div>
    </div>
  </div>

  <div class="section-title" style="margin-top:8px;">Kapan Menggunakan WiFi vs Kapan Menggunakan Bluetooth?</div>
  <div class="scale-table" style="background:#F8FAFC; border-color:#CBD5E1; font-size:9.5px;">
    <div class="scale-row" style="font-weight:bold;"><span>Karakteristik</span><span>WiFi 2.4 GHz</span><span>Bluetooth SPP / BLE</span></div>
    <div class="scale-row"><span>Jarak Jangkauan</span><span>Sangat Luas (Seluruh Dunia via Cloud)</span><span>Dekat (Sekitar 10 - 15 meter)</span></div>
    <div class="scale-row"><span>Kebutuhan Internet</span><span>Wajib Ada Router / Kuota Internet</span><span>Tanpa Internet Sama Sekali (Offline)</span></div>
    <div class="scale-row"><span>Kegunaan Terbaik</span><span>Smart Home, Monitoring Cuaca Blynk</span><span>Robot Soccer, Gamepad RC Mini</span></div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 19: BAGIAN D - PENGENALAN PLATFORM BLYNK IOT & STEP-BY-STEP DAFTAR AKUN
// ─────────────────────────────────────────────────────────────────────────────
const p19_PartD_BlynkPlatform = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #22C55E, #15803D);">
    <div class="project-tag">BAGIAN D • KONEKTIVITAS IOT DENGAN ESP32 (PELAJARAN 3)</div>
    <h3 class="project-title">☁️ Panduan Lengkap: Membuat Akun Blynk IoT & Setup Template</h3>
    <div class="project-goal">Misi: Mendaftar akun gratis di Blynk Cloud, mengaktifkan Developer Mode, dan menyiapkan Template & Datastream ESP32!</div>
  </div>

  <!-- VISUAL SCREENSHOTS WORKFLOW BLYNK CLOUD -->
  <div style="display:flex; justify-content:center; margin-top:6px; margin-bottom:6px;">
    ${blynkSignupWorkflowSVG(490, 165)}
  </div>

  <div class="two-col-layout" style="margin-top:4px;">
    <!-- KOLOM KIRI: STEP DAFTAR AKUN -->
    <div>
      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; padding:6px 10px;">
        <h4 style="margin:0 0 4px 0; color:#166534; font-size:11px;">📝 Bagian 1: 4 Langkah Mendaftar Akun Blynk.Cloud</h4>
        <ol class="text-xs" style="margin:0; padding-left:14px; color:#14532D; line-height:1.45;">
          <li><strong>Buka Platform:</strong> Kunjungi situs <code style="color:#15803D;">https://blynk.cloud</code> di peramban laptopmu (atau instal aplikasi <strong>Blynk IoT</strong> di Play Store / App Store).</li>
          <li><strong>Form Registrasi:</strong> Klik <strong>"Create new account"</strong>, masukkan email aktifmu, centang kotak <em>I agree to Terms & Privacy Policy</em>, lalu klik tombol hijau <strong>Sign Up</strong>.</li>
          <li><strong>Cek Kotak Masuk Email:</strong> Buka email dari <em>Blynk IoT &lt;support@blynk.io&gt;</em>, lalu klik tombol hijau <strong>"Create Password"</strong>.</li>
          <li><strong>Buat Kata Sandi:</strong> Ketik kata sandi barumu (kombinasi huruf & angka) dan selesaikan login masuk ke dasbor <strong>Blynk.Console</strong>.</li>
        </ol>
      </div>
    </div>

    <!-- KOLOM KANAN: STEP TEMPLATE & AUTH TOKEN -->
    <div>
      <div class="highlight-card" style="background:#EFF6FF; border-color:#BFDBFE; padding:6px 10px;">
        <h4 style="margin:0 0 4px 0; color:#1E40AF; font-size:11px;">⚙️ Bagian 2: 4 Langkah Konfigurasi Template & Token</h4>
        <ol class="text-xs" style="margin:0; padding-left:14px; color:#1E3A8A; line-height:1.45;">
          <li><strong>Aktifkan Developer Mode:</strong> Klik ikon profilmu di pojok kanan atas, pastikan <strong>"Developer Mode"</strong> posisi <strong>ON</strong> (wajib agar menu template muncul!).</li>
          <li><strong>Buat Template Baru:</strong> Klik menu <strong>Templates (ikon cetak biru)</strong> ➔ klik <strong>+ New Template</strong>. Isi nama <code>SmartHome</code>, Hardware <code>ESP32</code>, Connection <code>WiFi</code>.</li>
          <li><strong>Atur Saluran Datastream:</strong> Tab <strong>Datastreams ➔ New Datastream ➔ Virtual Pin</strong>:
            <ul style="margin:1px 0; padding-left:12px;">
              <li><code>V0</code>: Integer (0 - 1) untuk Saklar Relay Lampu.</li>
              <li><code>V1</code>: Double (0 - 100) untuk Monitoring Sensor.</li>
            </ul>
          </li>
          <li><strong>Ambil KTP Perangkat:</strong> Salin <strong>Template ID</strong> dan <strong>Auth Token</strong> untuk dipasang pada blok hijau RoboLab Studio!</li>
        </ol>
      </div>
    </div>
  </div>

  ${tipsBox('iot', 'Kekuatan Rahasia Auth Token & Pin Virtual (V0 - V255):', `
    <strong>Auth Token</strong> adalah kunci rahasia unik yang menghubungkan board ESP32-mu ke akun Blynk-mu. Sedangkan <strong>Pin Virtual (V0, V1)</strong> adalah <em>kabel data maya di awan internet</em> yang mengalirkan perintah tombol HP langsung ke memori ESP32 secara instan!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 20: BAGIAN D - MEMBEDAH BLOK HIJAU BLYNK DI ROBOLAB STUDIO
// ─────────────────────────────────────────────────────────────────────────────
const p20_PartD_BlynkBlocks = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #16A34A, #14532D);">
    <div class="project-tag">BAGIAN D • KONEKTIVITAS IOT DENGAN ESP32 (PELAJARAN 4)</div>
    <h3 class="project-title">🧩 Membedah Blok Hijau Blynk IoT di RoboLab Studio</h3>
    <div class="project-goal">Misi: Memahami fungsi setiap blok IoT hijau zamrud yang tersedia pada toolbox RoboLab Studio!</div>
  </div>

  <div class="blynk-blocks-grid" style="margin-top:8px;">
    <!-- 1. BLYNK CONFIG -->
    <div class="blynk-card">
      <div class="blynk-card-title">1. Blok Blynk Config (KTP Perangkat)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 4px 0;">Menentukan identitas perangkat agar server Blynk tahu bahwa program ini adalah milik akunmu.</p>
      ${stmtBlock('#22C55E', 'Blynk Config Template ID ' + pillInput('"TMPL123"') + ' Name ' + pillInput('"Robot"') + ' Auth ' + pillInput('"TokenSecret"'))}
    </div>

    <!-- 2. BLYNK BEGIN -->
    <div class="blynk-card">
      <div class="blynk-card-title">2. Blok Blynk Begin (Pintu Gerbang WiFi)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 4px 0;">Menghubungkan ESP32 ke jaringan WiFi lokal dan melakukan login ke cloud Blynk.</p>
      ${stmtBlock('#22C55E', 'Blynk Begin Auth ' + pillInput('AUTH') + ' SSID ' + pillInput('"WiFi-Kamar"') + ' Pass ' + pillInput('"12345678"'))}
    </div>

    <!-- 3. BLYNK RUN -->
    <div class="blynk-card">
      <div class="blynk-card-title">3. Blok Blynk Run (Penjaga Detak Koneksi)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 4px 0;"><strong>WAJIB diletakkan di dalam <code>void loop()</code>!</strong> Blok ini bertugas memeriksa pesan masuk dari HP setiap milidetik.</p>
      ${stmtBlock('#22C55E', 'Blynk Run')}
    </div>

    <!-- 4. BLYNK ON WRITE & PARAM AS INT -->
    <div class="blynk-card">
      <div class="blynk-card-title">4. Blok Blynk On Write & Param As Int (Menerima Perintah Tombol HP)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 4px 0;">Otomatis aktif seketika widget saklar di HP ditekan oleh jari kita.</p>
      ${cBlock('#22C55E', 'Blynk On Write ' + pillInput('V0') + ' {', stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('2') + ' to ' + reporterPill('#22C55E', 'Blynk Parameter Value (Integer)')), '}')}
    </div>

    <!-- 5. BLYNK VIRTUAL WRITE -->
    <div class="blynk-card">
      <div class="blynk-card-title">5. Blok Blynk Virtual Write (Mengirim Nilai Sensor ke Layar HP)</div>
      <p class="text-xs" style="color:#64748B; margin:2px 0 4px 0;">Menembakkan hasil bacaan sensor dari ruangan kamar ke jarum pengukur di HP.</p>
      ${stmtBlock('#22C55E', 'Blynk Virtual Write Pin ' + pillInput('V1') + ' Value ' + reporterPill('#9966FF', 'analogRead Pin ' + pillInput('34')))}
    </div>
  </div>

  ${tipsBox('smart', 'Pesan Penting: Jangan Gunakan delay() Panjang di Loop Bersama Blynk!', `
    Jika kamu memberi <code>delay(5000)</code> di dalam loop saat menjalankan Blynk, ESP32 akan tertidur selama 5 detik dan tidak memproses <code>Blynk Run</code>, sehingga server Blynk akan menganggap alatmu mati (*offline*)! Gunakan delay singkat atau timer tanpa jeda.
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 21: PROYEK AKHIR 1 - ROBOT SOCCER (PERAKITAN & DRIVER L298 MINI)
// ─────────────────────────────────────────────────────────────────────────────
const p21_ProjectSoccer_Part1 = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #DC2626, #B91C1C);">
    <div class="project-tag">PROYEK AKHIR 1 • IMPLEMENTASI ROBOTIKA (BAGIAN 1: PERAKITAN)</div>
    <h3 class="project-title">⚽ Merakit Robot Soccer Cilik: Mekanik, Motor & Driver L298 Mini</h3>
    <div class="project-goal">Misi: Merakit mobil robot sepak bola yang super ringan, gesit, dan siap bertanding di lapangan mini!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- DIAGRAM SASIS -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Sasis Robot Soccer & L298 Mini:</h4>
      <div style="display:flex; justify-content:center;">
        ${robotSoccerMiniL298ChassisSVG(300, 145)}
      </div>
      <div class="component-list-box">
        <strong>Komponen yang Dibutuhkan:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li>1x Plat Sasis Akrilik Robot 2WD + 1 Roda Bebas (Caster Ball).</li>
          <li>2x Motor DC Kuning Gearbox TT + 2 Buah Roda Karet.</li>
          <li><strong>1x Modul Driver L298 Mini (MX1508)</strong> (Kompak & Ringan).</li>
          <li>1x Modul ESP32 DevKit V4 (Sebagai otak kendali WiFi/Bluetooth).</li>
          <li>1x Slot Baterai 2x 18650 Li-Ion (Total Tegangan 7.4V).</li>
        </ul>
      </div>
    </div>

    <!-- WIRING STEPS -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Panduan Pengkabelan Lengkap:</h4>
      
      <div class="scale-table" style="background:#FEF2F2; border-color:#FECACA; font-size:9px; margin-bottom:6px;">
        <div class="scale-row" style="font-weight:bold; color:#991B1B;"><span>Dari Komponen</span><span>Ke Komponen</span><span>Keterangan</span></div>
        <div class="scale-row"><span>Motor Kiri (2 Kabel)</span><span>MOTOR-A L298 Mini</span><span>Penggerak Sisi Kiri</span></div>
        <div class="scale-row"><span>Motor Kanan (2 Kabel)</span><span>MOTOR-B L298 Mini</span><span>Penggerak Sisi Kanan</span></div>
        <div class="scale-row"><span>Kutub (+) Baterai 7.4V</span><span>+ (VCC) L298 & VIN ESP32</span><span>Daya Utama Motor</span></div>
        <div class="scale-row"><span>Kutub (-) Baterai</span><span>- (GND) L298 & GND ESP32</span><span>Wajib Ground Rapat!</span></div>
        <div class="scale-row"><span>Pin IN1 L298 Mini</span><span>GPIO 18 ESP32</span><span>PWM / Maju Kiri</span></div>
        <div class="scale-row"><span>Pin IN2 L298 Mini</span><span>GPIO 19 ESP32</span><span>PWM / Mundur Kiri</span></div>
        <div class="scale-row"><span>Pin IN3 L298 Mini</span><span>GPIO 22 ESP32</span><span>PWM / Maju Kanan</span></div>
        <div class="scale-row"><span>Pin IN4 L298 Mini</span><span>GPIO 23 ESP32</span><span>PWM / Mundur Kanan</span></div>
      </div>

      <div class="highlight-card" style="background:#FFF7ED; border-color:#FED7AA; font-size:9.5px; line-height:1.4;">
        <strong>Mengapa Memakai L298 Mini?</strong> Modul L298 Mini (MX1508) hanya berbobot ~5 gram dan tidak membutuhkan jumper ENA/ENB terpisah, sehingga robot soccer menjadi sangat lincah dan berakselerasi kilat!
      </div>
    </div>
  </div>

  ${tipsBox('soccer', 'Uji Coba Mekanik Roda:', `
    Sebelum menyalakan saklar daya, putar kedua roda karet dengan jarimu secara perlahan. Pastikan roda tidak bergesekan dengan badan akrilik dan roda bebas caster di depan dapat berbelok ke segala arah dengan sangat lancar!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 22: PROYEK AKHIR 1 - ROBOT SOCCER (KONTROL HP & MINI PERTANDINGAN)
// ─────────────────────────────────────────────────────────────────────────────
const p22_ProjectSoccer_Part2 = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #B91C1C, #7F1D1D);">
    <div class="project-tag">PROYEK AKHIR 1 • IMPLEMENTASI ROBOTIKA (BAGIAN 2: KONTROL GERAK)</div>
    <h3 class="project-title">🎮 Mengontrol Robot Soccer L298 Mini & Uji Coba Pertandingan</h3>
    <div class="project-goal">Misi: Mengendalikan manuver lincah robot lewat tombol smartphone dan bertanding di lapangan mini!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- LOGIKA BLOK GERAK -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Blok Kendali L298 Mini di RoboLab Studio:</h4>
      <div class="block-preview-box" style="font-size:9.5px;">
        <div style="font-size:9px; color:#64748B; margin-bottom:2px;">// Fungsi Maju Kencang (Forward)</div>
        ${stmtBlock('#9966FF', 'analogWrite Pin 18 to value 220')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 19 to LOW')}
        ${stmtBlock('#9966FF', 'analogWrite Pin 22 to value 220')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 23 to LOW')}

        <div style="font-size:9px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Fungsi Putar Balik Kiri Cepat (Pivot Left)</div>
        ${stmtBlock('#9966FF', 'digitalWrite Pin 18 to LOW')}
        ${stmtBlock('#9966FF', 'analogWrite Pin 19 to value 200')}
        ${stmtBlock('#9966FF', 'analogWrite Pin 22 to value 200')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 23 to LOW')}

        <div style="font-size:9px; color:#64748B; margin-top:4px; margin-bottom:2px;">// Fungsi Rem Berhenti (Stop)</div>
        ${stmtBlock('#9966FF', 'digitalWrite Pin 18 to LOW')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 19 to LOW')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 22 to LOW')}
        ${stmtBlock('#9966FF', 'digitalWrite Pin 23 to LOW')}
      </div>
    </div>

    <!-- STRATEGI & ATURAN LAPANGAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Aturan Mini Pertandingan Robot Soccer:</h4>
      
      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; font-size:9.5px; line-height:1.45;">
        <strong>⚽ Format Kompetisi Lapangan Mini:</strong><br>
        • <strong>Ukuran Lapangan:</strong> Meja berukuran 120 cm x 80 cm dengan dinding kayu tepian.<br>
        • <strong>Gawang:</strong> Lebar gawang 20 cm di kedua sisi ujung lapangan.<br>
        • <strong>Durasi Laga:</strong> 2 babak x 3 menit pertandingan seru.<br>
        • <strong>Pemenang:</strong> Tim robot yang mencetak gol terbanyak ke gawang lawan!
      </div>

      <div class="highlight-card" style="background:#FEF3C7; border-color:#FCD34D; font-size:9.5px; margin-top:6px; line-height:1.4;">
        <strong>🎯 Tips Taktik Juara:</strong><br>
        1. <strong>Kontrol Halus PWM:</strong> Gunakan kecepatan sedang (PWM 180) saat menggiring bola agar bola tidak lepas.<br>
        2. <strong>Pivot Spin:</strong> Putar robot di tempat untuk menyambar bola liar di sudut lapangan!
      </div>
    </div>
  </div>

  ${tipsBox('cheer', 'Sorak Sorai Lapangan:', `
    Ajak teman sekelasmu untuk merakit robot kedua! Warnai sasis robotmu dengan stiker tim favorit (Merah vs Biru) dan mulailah turnamen mini robot soccer yang mendebarkan!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 23: PROYEK AKHIR 2 - SMART HOME BLYNK (BAGIAN 1: DESAIN & SENSOR)
// ─────────────────────────────────────────────────────────────────────────────
const p23_ProjectBlynk_Part1 = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #059669, #065F46);">
    <div class="project-tag">PROYEK AKHIR 2 • OTOMASI IOT BLYNK (BAGIAN 1: RANGKAIAN & DASBOR)</div>
    <h3 class="project-title">🏠 Smart Home: Kontrol Relay & Monitoring Sensor via Blynk</h3>
    <div class="project-goal">Misi: Mengontrol lampu/relay kamar dari smartphone dan memantau suhu secara real-time dari mana saja!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- RANGKAIAN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Skema Rangkaian ESP32 + Relay + Sensor LDR:</h4>
      <div style="display:flex; justify-content:center;">
        ${circuitBlynkSVG(300, 135)}
      </div>
      <div class="component-list-box">
        <strong>Pengkabelan Komponen ke ESP32:</strong>
        <ul style="margin:2px 0; padding-left:16px; font-size:9px; color:#475569;">
          <li><strong>Modul Relay:</strong> Sinyal IN ke <strong>GPIO 23</strong>, VCC ke 5V/VIN, GND ke GND.</li>
          <li><strong>Sensor Cahaya LDR:</strong> Sinyal analog ke <strong>GPIO 34</strong> (Pin Aman ADC1!).</li>
          <li><strong>Lampu Indikator LED:</strong> Anoda (+) ke <strong>GPIO 2</strong>, Katoda (-) ke GND rapat.</li>
        </ul>
      </div>
    </div>

    <!-- DASHBOARD DESIGN -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Desain Tampilan Aplikasi Blynk di HP:</h4>
      
      <div class="highlight-card" style="background:#F0FDF4; border-color:#86EFAC; font-size:9.5px; line-height:1.45;">
        <strong>📱 Pasang 2 Widget Berikut di Blynk:</strong><br><br>
        • <strong>Widget 1: Button / Switch (Saklar Lampu)</strong><br>
        - Datastream: <strong>V0 (Integer 0 - 1)</strong><br>
        - Mode: Switch (Tekan sekali ON, tekan lagi OFF)<br>
        - Label: "Lampu Kamar"<br><br>
        • <strong>Widget 2: Gauge / Radial Gauge (Meteran Cahaya)</strong><br>
        - Datastream: <strong>V1 (Integer 0 - 4095)</strong><br>
        - Min/Max: 0 sampai 4095 (Resolusi 12-bit ESP32)<br>
        - Label: "Intensitas Cahaya"
      </div>
    </div>
  </div>

  ${tipsBox('iot', 'Konektivitas Global:', `
    Setelah ESP32 terhubung ke WiFi rumah dan aplikasi Blynk di ponselmu dibuka menggunakan jaringan paket data seluler 4G/5G, kamu bisa menyalakan lampu kamarmu bahkan ketika kamu sedang berada di kota lain!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 24: PROYEK AKHIR 2 - SMART HOME BLYNK (BAGIAN 2: OTOMASI & NOTIFIKASI)
// ─────────────────────────────────────────────────────────────────────────────
const p24_ProjectBlynk_Part2 = `
  <div class="project-header-bar" style="background:linear-gradient(135deg, #047857, #064E3B);">
    <div class="project-tag">PROYEK AKHIR 2 • OTOMASI IOT BLYNK (BAGIAN 2: OTOMASI & NOTIFIKASI)</div>
    <h3 class="project-title">🚨 Otomasi Cerdas & Notifikasi Peringatan ke Smartphone</h3>
    <div class="project-goal">Misi: Mengajari sistem mengirimkan notifikasi pop-up ke layar ponsel saat kondisi ruangan darurat!</div>
  </div>

  <div class="two-col-layout" style="margin-top:8px;">
    <!-- BLOK IOT LENGKAP -->
    <div>
      <h4 class="subheading" style="margin-top:0;">1. Susunan Blok Lengkap di RoboLab Studio:</h4>
      <div class="block-preview-box" style="font-size:9.5px;">
        <div style="font-size:8.5px; color:#64748B; margin-bottom:2px;">// Konfigurasi Blynk & WiFi</div>
        ${stmtBlock('#22C55E', 'Blynk Config ID ' + pillInput('"TMPL_SMART"') + ' Name ' + pillInput('"Home"') + ' Auth ' + pillInput('"TokenXYZ"'))}
        ${stmtBlock('#22C55E', 'Blynk Begin Auth ' + pillInput('"TokenXYZ"') + ' SSID ' + pillInput('"WiFi-Rumah"') + ' Pass ' + pillInput('"Pass123"'))}

        <div style="margin-top:4px;"></div>
        ${cBlock('#FFAB19', 'void loop() {', `
          ${stmtBlock('#22C55E', 'Blynk Run')}
          ${stmtBlock('#22C55E', 'Blynk Virtual Write Pin ' + pillInput('V1') + ' Value ' + reporterPill('#9966FF', 'analogRead Pin ' + pillInput('34')))}
          ${cBlock('#4C97FF', 'jika ' + reporterPill('#3B82F6', reporterPill('#9966FF', 'analogRead Pin ' + pillInput('34')) + ' < ' + pillInput('500')) + ' maka', `
            ${stmtBlock('#22C55E', 'Blynk.logEvent(' + pillInput('"dark_alert"') + ', ' + pillInput('"Kamar Gelap!"') + ');')}
          `, '}')}
          ${stmtBlock('#FF4081', 'delay ' + pillInput('1000') + ' ms')}
        `, '}')}

        <div style="margin-top:4px;"></div>
        ${cBlock('#22C55E', 'Blynk On Write ' + pillInput('V0') + ' {', `
          ${stmtBlock('#9966FF', 'digitalWrite Pin ' + pillInput('23') + ' to ' + reporterPill('#22C55E', 'Blynk Param As Int'))}
        `, '}')}
      </div>
    </div>

    <!-- PENJELASAN NOTIFIKASI -->
    <div>
      <h4 class="subheading" style="margin-top:0;">2. Bagaimana Fitur Notifikasi Bekerja?</h4>
      <p class="text-xs" style="color:#334155; line-height:1.45;">
        Fitur <strong>Blynk Events & Notifications</strong> memungkinkan alatmu mengirimkan pesan peringatan darurat langsung ke bilah notifikasi smartphone atau bahkan mengirim email!
      </p>

      <div class="highlight-card" style="background:#FEF2F2; border-color:#FECACA; font-size:9.5px; line-height:1.4; margin:6px 0;">
        <strong>Skenario Otomasi Cerdas:</strong><br>
        1. Saat sensor mendeteksi intensitas cahaya turun di bawah 500 (ruangan gelap gulita).<br>
        2. ESP32 otomatis menyalakan relay lampu kamar secara mandiri.<br>
        3. Seketika ponselmu bergetar dan memunculkan pop-up notifikasi: <em>"Pemberitahuan: Lampu kamar otomatis dinyalakan karena ruangan gelap!"</em>.
      </div>
    </div>
  </div>

  ${tipsBox('cheer', 'Puncak Mahakarya IoT Telah Selesai!', `
    Kamu telah berhasil membangun sistem otomasi IoT berstandar industri modern! Dari perangkat keras sirkuit, pembacaan sensor analog, jaringan internet nirkabel, hingga dasbor aplikasi smartphone interaktif. Hebat sekali!
  `)}
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 25: KLINIK "DOKTER ROBOT" - TROUBLESHOOTING & BENGKEL PRAKTIS
// ─────────────────────────────────────────────────────────────────────────────
const p25_Troubleshooting = `
  <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
    ${mascotSVG('doctor', 65)}
    <div>
      <h3 style="margin:0; font-family:'Fredoka',sans-serif; color:#0369A1; font-size:18px;">🩺 Klinik Dokter Robot: Panduan Mengatasi 6 Masalah Populer</h3>
      <p class="text-xs" style="color:#64748B; margin:2px 0 0 0;">
        Jika rangkaian belum langsung bekerja, jangan berkecil hati! Para insinyur profesional menghabiskan waktu mereka untuk melakukan <strong>Debugging</strong>. Berikut adalah resep obat mujarab untuk 6 masalah yang paling sering ditemui:
      </p>
    </div>
  </div>

  <div class="trouble-grid">
    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 1: Roda Robot Berputar Mundur Padahal Diprogram Maju</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Polaritas dua kabel motor DC yang terpasang pada terminal L298N tertukar.<br>
        <strong>Resep Dokter:</strong> Cukup balik posisi dua kabel motor pada terminal baut output L298N tersebut. Putaran akan langsung berbalik normal!
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 2: ESP32 Mendadak Restart Saat Motor Robot Mulai Berputar</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> *Brownout Reset!* Motor menyedot arus baterai secara mendadak sehingga tegangan ke chip ESP32 drop di bawah batas aman.<br>
        <strong>Resep Dokter:</strong> Pisahkan sumber daya atau pasang baterai berkekuatan tinggi (seperti Li-Ion 18650) dan pastikan kabel ground tetap terhubung bersama.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 3: Lampu LED Tidak Mau Menyala</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Kaki LED terbalik atau kabel ground GND tidak terpasang rapat.<br>
        <strong>Resep Dokter:</strong> Pastikan kaki anoda (+) ke Pin sinyal dan kaki katoda (-) dengan sisi datar terhubung rapat ke GND tanpa terputus.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 4: Port COM Tidak Terdeteksi di RoboLab Studio</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Kabel USB adalah kabel pengisi daya biasa (*charge-only*) atau driver chip komunikasi (CH340/CP2102) belum terpasang.<br>
        <strong>Resep Dokter:</strong> Ganti kabel dengan kabel data berkualitas dan install driver sesuai chip USB board mikrokontrolermu.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 5: ESP32 Gagal Terhubung ke WiFi Rumah</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Router memancarkan frekuensi 5 GHz murni atau nama WiFi/kata sandi salah ketik huruf besar/kecil.<br>
        <strong>Resep Dokter:</strong> Pastikan menggunakan pita frekuensi 2.4 GHz dan periksa kembali penulisan SSID dan Password di blok program.
      </div>
    </div>

    <div class="trouble-card">
      <div class="trouble-title">❌ Masalah 6: Layar Serial Monitor Menampilkan Simbol Aneh / Kotak-Kotak</div>
      <div class="trouble-body">
        <strong>Penyebab:</strong> Baud rate komunikasi serial tidak serasi antara komputer dan mikrokontroler.<br>
        <strong>Resep Dokter:</strong> Samakan baud rate di Serial Monitor menjadi <strong>115200 baud</strong>.
      </div>
    </div>
  </div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 26: KAMUS PINTAR MAKER & PIAGAM SERTIFIKAT KELULUSAN
// ─────────────────────────────────────────────────────────────────────────────
const p26_GlossaryAndCertificate = `
  <div class="cert-outer-frame" style="padding:6px; margin-bottom:6px;">
    <div class="cert-inner-frame" style="padding:10px;">
      <div class="cert-header">
        <div class="cert-logo">${mascotSVG('cheer', 50)}</div>
        <div class="cert-org" style="font-size:9.5px; letter-spacing:1.5px;">ROBOLAB STUDIO • JUNIOR MAKER ACADEMY 2026</div>
        <h2 class="cert-title" style="font-size:24px; margin:2px 0;">PIAGAM PENGHARGAAN</h2>
        <div class="cert-subtitle" style="font-size:9px;">DIBERIKAN ATAS PRESTASI & DEDIKASI KEPADA:</div>
      </div>

      <div class="cert-name-line" style="margin:8px 0;">
        <div class="name-dots">______________________________________________________</div>
        <div class="name-label">Nama Sahabat Maker Cilik</div>
      </div>

      <div class="cert-body-text" style="font-size:10px; line-height:1.4; margin-bottom:8px;">
        Telah berhasil menyelesaikan seluruh rangkaian kurikulum pembelajaran
        <strong>Dasar IoT & Robotika, Input-Output LED & Sensor, Pengendalian Motor & I2C, ESP32 Nirkabel, hingga Mahakarya Proyek Robot Soccer & Smart Home Blynk</strong>
        menggunakan platform visual blok RoboLab Studio.
      </div>

      <div class="cert-badges-row" style="margin-bottom:8px; gap:6px;">
        <span class="cert-pill">✓ Dasar Arduino & Breadboard</span>
        <span class="cert-pill">✓ Motor Driver L298N & Servo</span>
        <span class="cert-pill">✓ Robot Soccer Maker</span>
        <span class="cert-pill">✓ Blynk IoT Certified</span>
      </div>

      <div class="cert-footer-row" style="padding:0 12px;">
        <div class="cert-sign-col">
          <div class="cert-date-line">Tanggal: _______________ 2026</div>
          <div class="cert-sign-title">Instruktur / Pembimbing Robotika</div>
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

  <div class="glossary-grid" style="font-size:8.5px; gap:4px;">
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">Aktuator</span>
      <span class="gloss-def">Komponen pengubah energi listrik menjadi gerakan fisik (Motor DC, Servo, Solenoid).</span>
    </div>
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">Common Ground</span>
      <span class="gloss-def">Penyatuan seluruh kutub negatif GND baterai dan controller agar sinyal terhubung.</span>
    </div>
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">H-Bridge</span>
      <span class="gloss-def">Sirkuit saklar driver yang memungkinkan arus motor dibalik maju dan mundur.</span>
    </div>
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">I2C</span>
      <span class="gloss-def">Protokol komunikasi 2 kabel (SDA & SCL) hemat pin untuk layar LCD dan sensor.</span>
    </div>
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">PWM</span>
      <span class="gloss-def">Denyut pulsa cepat pengatur kehalusan daya (kecepatan roda dan redup lampu).</span>
    </div>
    <div class="gloss-item" style="padding:3px 6px;">
      <span class="gloss-term">Virtual Pin</span>
      <span class="gloss-def">Kabel maya nirkabel di server Blynk untuk menghubungkan tombol HP ke ESP32.</span>
    </div>
  </div>
`;

module.exports = {
  pagesV2: [
    { num: 1, html: p1_Cover, tag: '', title: '' },
    { num: 2, html: p2_Welcome, tag: 'PENGANTAR', title: 'Sambutan & Peta Kurikulum Pelatihan' },
    { num: 3, html: p3_StudioFeatures, tag: 'ROBOLAB STUDIO', title: 'Fitur-Fitur & Menu Utama Antarmuka' },
    { num: 4, html: p4_BlockAnatomy, tag: 'ROBOLAB STUDIO', title: 'Anatomi 4 Jenis Blok Kode Pada Sistem' },
    { num: 5, html: p5_PartA_Intro, tag: 'BAGIAN A', title: 'Memahami Apa Itu Robotika & IoT' },
    { num: 6, html: p6_PartA_Arduino, tag: 'BAGIAN A', title: 'Memahami Apa Itu Arduino & Peta Pinout' },
    { num: 7, html: p7_PartA_Breadboard, tag: 'BAGIAN A', title: 'Instalasi Rangkaian Pada Project Board' },
    { num: 8, html: p8_PartA_Programming, tag: 'BAGIAN A', title: 'Dasar Pemrograman: void setup() & void loop()' },
    { num: 9, html: p9_PartB_LedDirect, tag: 'BAGIAN B', title: 'Menghidupkan & Mematikan LED (Tanpa Resistor)' },
    { num: 10, html: p10_PartB_ButtonLed, tag: 'BAGIAN B', title: 'Menghubungkan LED dan Push Button' },
    { num: 11, html: p11_PartB_Relay, tag: 'BAGIAN B', title: 'Menggunakan Relay untuk ON/OFF Lampu 220V' },
    { num: 12, html: p12_PartB_AnalogPwm, tag: 'BAGIAN B', title: 'Sinyal Analog & Dimmer PWM Potensiometer' },
    { num: 13, html: p13_PartC_MotorDc, tag: 'BAGIAN C', title: 'Mengenal Motor DC & Pengendalian Putaran' },
    { num: 14, html: p14_PartC_Servo, tag: 'BAGIAN C', title: 'Mengenal Motor Servo & Pengendalian Sudut' },
    { num: 15, html: p15_PartC_L298N, tag: 'BAGIAN C', title: 'Mengenal Motor Driver L298N (Arah & Speed)' },
    { num: 16, html: p16_PartC_I2C, tag: 'BAGIAN C', title: 'Komunikasi I2C & Layar LCD 16x2 I2C' },
    { num: 17, html: p17_PartD_Esp32, tag: 'BAGIAN D', title: 'Pengenalan ESP32 & Perbedaannya dg Arduino' },
    { num: 18, html: p18_PartD_WifiBt, tag: 'BAGIAN D', title: 'Koneksi Nirkabel: WiFi & Bluetooth ESP32' },
    { num: 19, html: p19_PartD_BlynkPlatform, tag: 'BAGIAN D', title: 'Pengenalan Platform Cloud Blynk IoT' },
    { num: 20, html: p20_PartD_BlynkBlocks, tag: 'BAGIAN D', title: 'Membedah Blok Hijau Blynk di RoboLab Studio' },
    { num: 21, html: p21_ProjectSoccer_Part1, tag: 'PROYEK AKHIR 1', title: 'Robot Soccer: Perakitan Sasis & Driver' },
    { num: 22, html: p22_ProjectSoccer_Part2, tag: 'PROYEK AKHIR 1', title: 'Robot Soccer: Kontrol HP & Pertandingan' },
    { num: 23, html: p23_ProjectBlynk_Part1, tag: 'PROYEK AKHIR 2', title: 'Smart Home Blynk: Desain Sirkuit & Dasbor' },
    { num: 24, html: p24_ProjectBlynk_Part2, tag: 'PROYEK AKHIR 2', title: 'Smart Home Blynk: Otomasi Cerdas & Notifikasi' },
    { num: 25, html: p25_Troubleshooting, tag: 'BENGKEL PRAKTIK', title: 'Klinik Dokter Robot: Troubleshooting 6 Masalah' },
    { num: 26, html: p26_GlossaryAndCertificate, tag: 'KELULUSAN', title: 'Glosarium Ringkas & Piagam Penghargaan' },
  ],
  renderPageV2
};
