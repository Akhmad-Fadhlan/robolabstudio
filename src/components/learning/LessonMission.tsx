import React from 'react';

const activities = {
  fundamental: [
    ['Ketik namamu sendiri di dalam perintah print("Halo, ...").', 'Tulisan di dalam tanda kutip akan langsung tampil di layar terminal.', 'Tambahkan baris print() kedua di bawahnya. Lihat urutannya dari atas ke bawah!'],
    ['Ubah angka yang disimpan di dalam variabel, lalu jalankan program.', 'Nama kotaknya (variabel) tetap sama, tapi isinya otomatis berganti mengikuti angka baru.', 'Coba bedakan angka 5 (tanpa kutip) dengan tulisan "5" (pakai tanda kutip).'],
    ['Ganti kata di dalam variabel teks dengan nama robot kesukaanmu.', 'Tanda tambah (+) akan menggandeng dua potong kata menjadi satu kalimat utuh.', 'Tambahkan spasi " " di tengah supaya dua kata tidak saling menempel.'],
    ['Coba masukkan angka di bawah batas dan di atas batas pada syarat if.', 'Program hanya akan menjalankan jalur yang syaratnya bernilai benar (True).', 'Apa yang terjadi kalau angkanya sama persis dengan angka batasnya?'],
    ['Tebak dulu berapa baris yang akan muncul, lalu jalankan perulangan for.', 'Perintah di dalam blok yang menjorok ke dalam akan diulang sesuai angka di range().', 'Ubah angka di dalam range(5) menjadi range(3) atau range(10).'],
    ['Panggil fungsi yang sama dua kali dengan isi masukan (input) yang berbeda.', 'Satu resep fungsi bisa dipakai berkali-kali tanpa harus menulis ulang kodenya.', 'Buat panggilan ketiga dengan angka atau kata buatanmu sendiri!'],
    ['Buat dua robot dari satu cetakan class yang sama dengan nama berbeda.', 'Walaupun dari cetakan yang sama, tiap robot menyimpan data miliknya masing-masing.', 'Ubah energi robot pertama, lalu cek apakah energi robot kedua ikut berubah.'],
    ['Perhatikan bagaimana class anak mewarisi kemampuan dari class induk.', 'Class anak otomatis punya semua jurus induknya ditambah jurus baru miliknya sendiri.', 'Ubah salah satu fungsi pada class anak dan lihat perbedaannya.'],
  ],
  hardware: [
    ['Temukan letak pin D13, GND, dan lampu kecil bertanda L di board Arduino Uno.', 'Lampu L di papan Arduino akan menyala saat D13 diberi HIGH dan mati saat LOW.', 'Ubah angka di dalam delay(1000) menjadi delay(300) supaya kedipnya lebih cepat!'],
    ['Ikuti jalur kabel dari pin D8 dan D9 yang melewati resistor menuju kaki positif LED.', 'Saat D8 bernilai HIGH dan D9 bernilai LOW, kedua lampu akan menyala bergantian.', 'Tukar nilai HIGH dan LOW pada kedua pin, lalu amati urutan nyala lampunya.'],
    ['Pasang tombol di antara pin D2 dan GND, lalu bandingkan saat ditekan vs dilepas.', 'Karena memakai INPUT_PULLUP, saat tombol ditekan nilainya justru terbaca LOW (0).', 'Coba buat lampu menyala hanya ketika tombol sedang ditekan!'],
    ['Putar knop potensiometer perlahan dari kiri ke kanan sambil melihat nilai A0.', 'Nilai analogRead(A0) berubah mulus dari 0 (0 Volt) sampai 1023 (5 Volt).', 'Kira-kira berapa angkanya kalau knop diputar tepat di posisi seperempat?'],
    ['Coba ganti angka analogWrite(9, ...) dengan 0, 60, 128, dan 255.', 'Semakin besar angkanya (maksimal 255), semakin terang nyala lampu LED-nya.', 'Cari angka yang pas supaya lampu LED menyala redup lembut seperti lampu tidur.'],
    ['Pastikan angka pada Serial.begin(9600) sama dengan baudrate di Serial Monitor.', 'Setiap kali Serial.println() dijalankan, Arduino mengirim satu baris pesan ke komputer.', 'Tambahkan kata keterangan di depan angka supaya data sensornya mudah dibaca.'],
    ['Perhatikan dua kabel utama layar I2C: jalur data (SDA) dan jalur detak (SCL).', 'Hanya dengan 2 kabel sinyal (A4 & A5), Arduino bisa menulis teks ke layar LCD.', 'Apa yang harus dicek pertama kali kalau layar LCD menyala tapi tulisannya belum muncul?'],
    ['Lihat pin D2 yang dipasangi attachInterrupt() untuk mendeteksi tombol seketika.', 'Berbeda dengan tombol biasa, interupsi langsung merespons walau program sedang delay().', 'Tekan tombol interupsi berkali-kali di simulator kanan dan lihat penghitungnya!'],
  ],
  micropython: [
    ['Ubah angka waktu tunggu di dalam time.sleep(1) menjadi 0.2 detik.', 'Angka di dalam sleep() mengatur berapa detik lampu bertahan menyala atau padam.', 'Buat pola kedip lampu SOS: tiga kedip cepat, lalu satu jeda agak panjang!'],
    ['Bandingkan terang lampu saat nilai pwm.duty() diisi angka kecil vs angka besar.', 'Lebar pulsa PWM mengatur seberapa banyak daya yang mengalir ke lampu LED.', 'Temukan angka duty yang membuat lampu menyala sekitar setengah terang.'],
    ['Geser nilai potensiometer lalu baca hasil pengukurannya lewat ADC.', 'Perubahan tegangan pada pin GPIO34 diubah menjadi angka digital oleh sensor ADC.', 'Catat berapa angka terkecil saat knop mentok kiri dan angka terbesar saat mentok kanan.'],
    ['Lihat pin SDA (21) dan SCL (22) yang dipakai untuk menyambungkan layar OLED.', 'Teks yang kamu tulis baru akan muncul di layar setelah perintah oled.show() dipanggil.', 'Ganti teks baris pertama dengan nama tim robotmu!'],
    ['Amati kapan pin TRIG menembakkan suara sonar dan kapan pin ECHO menangkap pantulannya.', 'Lama waktu pantulan suara dikalikan kecepatan suara untuk menghitung jarak benda (cm).', 'Apa yang terjadi pada nilai jarak kalau benda di depan sensor digeser makin jauh?'],
    ['Perhatikan dua tugas async def yang sama-sama memiliki perintah await uasyncio.sleep().', 'Saat satu tugas sedang istirahat (await), tugas lainnya langsung bergantian bekerja!', 'Ubah waktu jeda salah satu tugas supaya kedua lampu berkedip dengan irama berbeda.'],
    ['Ikuti langkah program mulai dari menyambung ke Wi-Fi sampai membuka alamat web.', 'ESP32 bisa menjawab permintaan dari browser HP atau laptop yang satu jaringan Wi-Fi.', 'Ubah teks judul halaman HTML yang dikirimkan oleh robot!'],
    ['Bandingkan posisi target yang diinginkan dengan posisi sensor saat ini.', 'Selisih antara target dan posisi asli disebut Error, yang dikoreksi otomatis oleh PID.', 'Ke arah mana motor harus berputar kalau nilai Error-nya berubah menjadi negatif?'],
    ['Lihat bagian kode yang mengirim dan menerima pesan langsung lewat WebSocket.', 'WebSocket menjaga jalur komunikasi tetap terbuka sehingga data terkirim tanpa jeda.', 'Ganti isi pesan status yang dikirim perangkat setiap detik.'],
    ['Ikuti perjalanan data dari sensor di board menuju layanan kecerdasan buatan (AI).', 'Program menunggu balasan data dari server sebelum menampilkannya di layar.', 'Apa yang sebaiknya dilakukan robot kalau koneksi internetnya tiba-tiba terputus?'],
    ['Perhatikan tiga pin utama mikrofon digital I2S: SCK (Clock), WS, dan SD (Data).', 'Suara di sekitar mikrofon diubah menjadi deretan angka sampel gelombang suara.', 'Bandingkan tinggi grafik gelombang saat suasana hening vs saat kamu bertepuk tangan!'],
  ],
};

export function LessonMission({
  category,
  index,
  themeMode = 'dark',
}: {
  category: keyof typeof activities;
  index: number;
  themeMode?: 'light' | 'dark';
}) {
  const steps = activities[category]?.[index];
  if (!steps) return null;
  const isLight = themeMode === 'light';
  const stepLabels = [
    { title: 'Ayo Coba!', icon: '🚀' },
    { title: 'Coba Amati', icon: '🔍' },
    { title: 'Tantangan Seru', icon: '🏆' },
  ];

  return (
    <section
      className="rounded-2xl p-4 border transition-colors"
      style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, rgba(255, 255, 255, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.14) 0%, rgba(15, 23, 42, 0.75) 100%)',
        borderColor: isLight ? 'rgba(var(--accent-rgb), 0.28)' : 'rgba(var(--accent-rgb), 0.35)',
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3
          className="font-extrabold text-sm sm:text-base flex items-center gap-2"
          style={{ color: isLight ? '#0f172a' : '#f8fafc' }}
        >
          <span>🎯</span>
          <span>Langkah Praktik Hari Ini</span>
        </h3>
        <span
          className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border"
          style={{
            background: 'rgba(var(--accent-rgb), 0.14)',
            color: 'var(--accent-primary)',
            borderColor: 'rgba(var(--accent-rgb), 0.3)',
          }}
        >
          3 Langkah Mudah
        </span>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {steps.map((step, i) => (
          <li
            key={step}
            className={`rounded-xl p-3 border flex flex-col gap-1.5 transition-all ${
              isLight
                ? 'bg-white/95 border-slate-200/90 text-slate-700 shadow-xs'
                : 'bg-slate-900/80 border-white/10 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-6 h-6 rounded-lg text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs"
                style={{ background: 'var(--accent-gradient)' }}
              >
                {i + 1}
              </span>
              <strong
                className="text-xs font-extrabold flex items-center gap-1"
                style={{ color: isLight ? '#0f172a' : '#ffffff' }}
              >
                <span>{stepLabels[i]?.icon}</span>
                <span>{stepLabels[i]?.title}</span>
              </strong>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {step}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
