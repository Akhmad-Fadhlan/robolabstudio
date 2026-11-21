const activities = {
  fundamental: [
    ['Tulis namamu di dalam print().', 'Teks yang ada di antara tanda kutip muncul di terminal.', 'Tambahkan print kedua. Baris mana yang muncul dulu?'],
    ['Ganti nilai satu variabel angka sebelum dicetak.', 'Nama variabel tetap sama, tetapi hasilnya mengikuti nilai terbaru.', 'Coba bandingkan angka 3 dengan teks "3".'],
    ['Ganti kata yang disimpan dalam variabel teks.', 'Hasil berubah saat potongan teks digabung.', 'Sisipkan spasi di antara dua kata.'],
    ['Jalankan contoh dengan nilai di bawah dan di atas batas kondisi.', 'Untuk setiap masukan, amati cabang yang dipilih.', 'Apa yang terjadi saat nilainya tepat di batas?'],
    ['Prediksi jumlah baris, lalu jalankan perulangan.', 'Setiap putaran menjalankan isi blok sekali.', 'Kurangi jumlah putaran menjadi satu.'],
    ['Panggil fungsi contoh dua kali dengan masukan berbeda.', 'Instruksi yang sama bisa dipakai lagi.', 'Prediksi hasil untuk masukan ketiga.'],
    ['Buat dua objek dari kelas contoh dengan nama berbeda.', 'Setiap objek menyimpan datanya sendiri.', 'Ubah satu objek dan periksa objek satunya.'],
    ['Temukan kelas induk dan kelas anak dalam contoh.', 'Objek anak bisa memakai perilaku yang diwariskan.', 'Bandingkan hasil metode yang ditulis ulang.'],
  ],
  hardware: [
    ['Cari pin D13, GND dan label LED L pada Uno.', 'LED bawaan mengikuti perubahan D13.', 'Perpanjang jeda mati saja.'],
    ['Telusuri dua jalur LED dari D8 dan D9 melalui resistor ke GND.', 'Saat satu pin HIGH dan yang lain LOW, warna yang menyala berganti.', 'Prediksi efek menukar dua nilai HIGH dan LOW.'],
    ['Hubungkan tombol di antara D2 dan GND. Bandingkan posisi ditekan dan dilepas.', 'Dengan INPUT_PULLUP, tombol ditekan terbaca LOW.', 'Jelaskan mengapa tombol ditekan justru menghasilkan nol.'],
    ['Putar potensiometer perlahan dari ujung ke tengah. Amati pembacaan A0.', 'Nilai di tengah mendekati separuh rentang 0–1023.', 'Prediksi nilai saat putaran mencapai seperempat.'],
    ['Bandingkan tiga nilai PWM pada D9: 0, 128, dan 255.', 'Waktu nyala dalam setiap pulsa menentukan terang rata-rata.', 'Pilih nilai agar LED tampak lebih redup.'],
    ['Samakan baud rate monitor dengan Serial.begin pada contoh.', 'Satu baris pesan bisa diamati setiap kali program mencetaknya.', 'Tambahkan label agar temanmu tahu arti angkanya.'],
    ['Ikuti jalur SDA dan SCL dari Uno menuju perangkat I2C.', 'Data dan clock memakai jalur berbeda. Alamat memilih perangkat tujuan.', 'Jelaskan apa yang perlu diperiksa jika layar kosong.'],
    ['Cari pin D2 dan fungsi yang dipanggil saat terjadi interupsi.', 'Perubahan pada tombol bisa memicu aksi di sela pekerjaan utama.', 'Bandingkan menunggu tombol dan menerima interupsi.'],
  ],
  micropython: [
    ['Ubah satu waktu tunggu LED.', 'Jeda menentukan lamanya LED berada dalam satu keadaan.', 'Buat nyala pendek dan mati panjang.'],
    ['Bandingkan dua nilai duty pada frekuensi tetap.', 'Lebar pulsa memengaruhi terang LED.', 'Temukan nilai yang tampak setengah terang.'],
    ['Ubah posisi potensiometer lalu baca ADC.', 'Perubahan tegangan menghasilkan angka yang berbeda.', 'Catat nilai minimum dan maksimum.'],
    ['Temukan alamat OLED dan pin I2C dalam contoh.', 'Isi layar berubah setelah buffer dikirim ke display.', 'Ganti tulisan pertama.'],
    ['Telusuri kapan pulsa mulai dan berakhir.', 'Durasi pulsa menjadi masukan perhitungan jarak.', 'Prediksi hasil saat objek menjauh.'],
    ['Cari dua tugas dan titik await masing-masing.', 'Satu tugas memberi kesempatan tugas lain berjalan.', 'Perpanjang jeda satu tugas.'],
    ['Ikuti alur dari koneksi WiFi sampai permintaan web.', 'Respons dikirim setelah ada permintaan.', 'Ganti teks respons.'],
    ['Bandingkan posisi target dan posisi terukur.', 'Selisih keduanya menjadi error pengendali.', 'Prediksi arah koreksi jika error berganti tanda.'],
    ['Cari baris yang mengirim pesan WebSocket.', 'Dua sisi dapat bertukar pesan selama koneksi aktif.', 'Ubah isi satu pesan.'],
    ['Telusuri perjalanan pesan dari perangkat hingga jawaban AI.', 'Respons jaringan perlu diterima sebelum ditampilkan.', 'Prediksi apa yang terlihat saat jaringan terputus.'],
    ['Temukan pin data dan clock pada konfigurasi mikrofon.', 'Sampel audio dibaca sebelum dikirim untuk diproses.', 'Bandingkan suara pelan dan suara keras.'],
  ],
};
export function LessonMission({category,index}:{category:keyof typeof activities;index:number}) {
  const steps = activities[category][index];
  if (!steps) return null;
  return <section className="rounded-2xl bg-sky-50 p-4 text-slate-800 border border-sky-200">
    <h3 className="font-bold text-lg text-sky-900">Misi kecilmu</h3>
    <ol className="mt-3 grid gap-3">{steps.map((step,i)=><li key={step} className="flex gap-3 items-start text-sm"><b className="rounded-full bg-sky-800 text-white w-6 h-6 text-center shrink-0">{i+1}</b><div><strong>{['Coba','Amati','Tantangan'][i]}</strong><p>{step}</p></div></li>)}</ol>
  </section>;
}
