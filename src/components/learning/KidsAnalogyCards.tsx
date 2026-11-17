import React from 'react';
import { Sparkles, Compass, Lightbulb, Play, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface KidsAnalogyProps {
  category: 'fundamental' | 'micropython' | 'hardware';
  lessonIndex: number;
  themeMode: 'light' | 'dark';
}

export const KidsAnalogyCard: React.FC<KidsAnalogyProps> = ({ category, lessonIndex, themeMode }) => {
  const isLight = themeMode === 'light';

  // Analogy definitions for each lesson
  const getAnalogyData = () => {
    if (category === 'fundamental') {
      switch (lessonIndex) {
        case 0:
          return {
            badge: 'Robot Pengeras Suara 📢',
            badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            title: 'Corong Pengeras Suara Robot',
            analogy: 'Bayangkan perintah print() seperti corong pengeras suara robot. Apapun kata yang kamu tulis di dalam tanda kurung ("..."), robot akan membacanya lantang di layar!',
            mission: 'Suruh robot menyapa teman-temanmu dengan kata "Halo Dunia!"',
            recipe: [
              { step: '1. Ambil Perintah', desc: 'Tulis nama corong suara: print()' },
              { step: '2. Masukkan Kata', desc: 'Bungkus kata dengan tanda kutip: ("Halo!")' },
              { step: '3. Robot Bersuara', desc: 'Kata muncul di terminal komputer!' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Friendly Robot with Megaphone */}
                <rect x="20" y="35" width="55" height="50" rx="14" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2.5" />
                {/* Robot Eyes */}
                <circle cx="38" cy="55" r="5" fill="#FFFFFF" />
                <circle cx="39" cy="55" r="2.5" fill="#1E293B" />
                <circle cx="58" cy="55" r="5" fill="#FFFFFF" />
                <circle cx="59" cy="55" r="2.5" fill="#1E293B" />
                {/* Robot Antenna */}
                <line x1="47.5" y1="35" x2="47.5" y2="20" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <circle cx="47.5" cy="18" r="4" fill="#EF4444" />
                {/* Robot Smile */}
                <path d="M41 70 Q47.5 76 54 70" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Megaphone */}
                <path d="M78 62 L110 45 L110 79 L78 62 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                <rect x="110" y="42" width="6" height="40" rx="3" fill="#EF4444" />
                <path d="M88 64 L88 78 L82 78 L82 64 Z" fill="#94A3B8" />

                {/* Sound waves & Chat Bubble */}
                <path d="M124 50 Q130 62 124 74" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
                <path d="M132 44 Q142 62 132 80" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
                
                {/* Speech Bubble */}
                <rect x="150" y="30" width="155" height="64" rx="16" fill={isLight ? '#FFFFFF' : '#1E293B'} stroke="#3B82F6" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
                <path d="M150 55 L140 60 L150 67 Z" fill={isLight ? '#FFFFFF' : '#1E293B'} stroke="#3B82F6" strokeWidth="2" />
                <text x="165" y="54" fill={isLight ? '#0F172A' : '#F8FAFC'} fontSize="11" fontWeight="bold" fontFamily="monospace">print("Halo!")</text>
                <text x="165" y="74" fill="#10B981" fontSize="11" fontWeight="bold" fontFamily="monospace">&gt; Halo Dunia! ✨</text>
              </svg>
            )
          };

        case 1:
          return {
            badge: 'Kotak Ajaib Berlabel 📦',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            title: 'Kotak Mainan Berlabel Nama',
            analogy: 'Variabel itu seperti kotak mainan berpita nama. Kamu bisa menyimpan kata, angka kelereng, atau saklar ON/OFF di dalamnya dan membukanya lagi kapan saja!',
            mission: 'Beri nama robotmu dan simpan jumlah bateraimu di kotak rahasia!',
            recipe: [
              { step: '1. Beri Nama Kotak', desc: 'nama_robot = "Rover"' },
              { step: '2. Simpan Angka', desc: 'energi = 100' },
              { step: '3. Panggil Kotak', desc: 'print(nama_robot)' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Box 1: String */}
                <g transform="translate(10, 20)">
                  <rect x="0" y="25" width="90" height="70" rx="10" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
                  <rect x="10" y="15" width="70" height="20" rx="5" fill="#10B981" />
                  <text x="45" y="29" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">nama_robot</text>
                  <text x="45" y="65" fill={isLight ? '#065F46' : '#6EE7B7'} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">"Rover"</text>
                  <text x="45" y="82" fill="#94A3B8" fontSize="8" textAnchor="middle">Tipe: Teks (str)</text>
                </g>

                {/* Box 2: Integer */}
                <g transform="translate(115, 20)">
                  <rect x="0" y="25" width="90" height="70" rx="10" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" />
                  <rect x="10" y="15" width="70" height="20" rx="5" fill="#3B82F6" />
                  <text x="45" y="29" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">baterai</text>
                  <text x="45" y="65" fill={isLight ? '#1E40AF' : '#93C5FD'} fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">100</text>
                  <text x="45" y="82" fill="#94A3B8" fontSize="8" textAnchor="middle">Tipe: Angka (int)</text>
                </g>

                {/* Box 3: Boolean */}
                <g transform="translate(220, 20)">
                  <rect x="0" y="25" width="90" height="70" rx="10" fill="#8B5CF6" fillOpacity="0.2" stroke="#8B5CF6" strokeWidth="2" />
                  <rect x="10" y="15" width="70" height="20" rx="5" fill="#8B5CF6" />
                  <text x="45" y="29" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">aktif</text>
                  <text x="45" y="65" fill={isLight ? '#5B21B6' : '#C4B5FD'} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">True (ON)</text>
                  <text x="45" y="82" fill="#94A3B8" fontSize="8" textAnchor="middle">Tipe: Saklar (bool)</text>
                </g>
              </svg>
            )
          };

        case 2:
          return {
            badge: 'Kereta Gerbong Kata 🚂',
            badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            title: 'Rangkaian Gerbong Huruf & Kata',
            analogy: 'String itu seperti rangkaian gerbong kereta! Simbol tambah (+) adalah kait penghubung gerbong kata, dan indeks angka adalah nomor kursi penumpang huruf!',
            mission: 'Genggam kata depan dan belakang lalu sambungkan jadi satu kalimat panjang!',
            recipe: [
              { step: '1. Gerbong 1', desc: 'kata1 = "Robo"' },
              { step: '2. Gerbong 2', desc: 'kata2 = "Lab"' },
              { step: '3. Gandeng Kait', desc: 'kata1 + kata2 ➡️ "RoboLab"' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Train Engine */}
                <g transform="translate(15, 30)">
                  <path d="M0 45 L50 45 L50 15 L25 15 L15 30 L0 30 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
                  <circle cx="15" cy="52" r="7" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="38" cy="52" r="7" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <rect x="25" y="20" width="18" height="12" rx="2" fill="#BAE6FD" />
                  <text x="25" y="40" fill="#FFFFFF" fontSize="8" fontWeight="bold">CHOO</text>
                </g>

                {/* Plus connector */}
                <text x="75" y="62" fill="#F59E0B" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>

                {/* Wagon 1 */}
                <g transform="translate(90, 35)">
                  <rect x="0" y="10" width="60" height="35" rx="6" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
                  <circle cx="15" cy="50" r="6" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="45" cy="50" r="6" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="30" y="32" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">"Robo"</text>
                </g>

                {/* Plus connector */}
                <text x="160" y="62" fill="#F59E0B" fontSize="16" fontWeight="bold" textAnchor="middle">+</text>

                {/* Wagon 2 */}
                <g transform="translate(175, 35)">
                  <rect x="0" y="10" width="55" height="35" rx="6" fill="#10B981" stroke="#059669" strokeWidth="2" />
                  <circle cx="15" cy="50" r="6" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="40" cy="50" r="6" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="27.5" y="32" fill="#FFFFFF" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">"Lab"</text>
                </g>

                {/* Equals arrow to result */}
                <path d="M238 52 L250 52" stroke="#64748B" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M250 48 L255 52 L250 56 Z" fill="#64748B" />

                <g transform="translate(260, 30)">
                  <rect x="0" y="12" width="55" height="40" rx="8" fill="#F8FAFC" stroke="#8B5CF6" strokeWidth="2" />
                  <text x="27.5" y="28" fill="#6B21A8" fontSize="7" fontWeight="bold" textAnchor="middle">HASIL</text>
                  <text x="27.5" y="42" fill="#7C3AED" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">"RoboLab"</text>
                </g>
              </svg>
            )
          };

        case 3:
          return {
            badge: 'Lampu Rambu & Simpang Tiga 🚦',
            badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            title: 'Polisi Lalu Lintas Keputusan Robot',
            analogy: 'If/Else adalah polisi rambu lalu lintas di otak robot! Jika kondisi benar (Hijau) ➡️ robot maju! Jika ada halangan (Merah) ➡️ robot belok atau berhenti!',
            mission: 'Cek apakah baterai cukup untuk jalan-jalan atau harus dicas dulu!',
            recipe: [
              { step: '1. Cek Syarat (if)', desc: 'if baterai > 20:' },
              { step: '2. Jika Benar (True)', desc: 'print("Robot Siap Jalan! 🏎️")' },
              { step: '3. Jika Salah (else)', desc: 'print("Harus dicas! 🔌")' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Traffic light */}
                <g transform="translate(30, 20)">
                  <rect x="0" y="0" width="30" height="75" rx="8" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                  <circle cx="15" cy="18" r="7" fill="#EF4444" />
                  <circle cx="15" cy="38" r="7" fill="#F59E0B" fillOpacity="0.3" />
                  <circle cx="15" cy="58" r="7" fill="#10B981" />
                  <rect x="12" y="75" width="6" height="35" fill="#475569" />
                </g>

                {/* Fork in the road */}
                <g transform="translate(90, 25)">
                  {/* Road */}
                  <path d="M10 50 Q50 50 80 20 L180 20" stroke={isLight ? '#CBD5E1' : '#334155'} strokeWidth="16" strokeLinecap="round" />
                  <path d="M10 50 Q50 50 80 80 L180 80" stroke={isLight ? '#CBD5E1' : '#334155'} strokeWidth="16" strokeLinecap="round" />
                  
                  {/* Branch True (Green) */}
                  <rect x="90" y="8" width="115" height="24" rx="6" fill="#10B981" fillOpacity="0.15" stroke="#10B981" strokeWidth="1.5" />
                  <text x="96" y="24" fill="#059669" fontSize="9" fontWeight="bold">if baterai &gt; 20: 🏎️ MAJU</text>

                  {/* Branch False (Red) */}
                  <rect x="90" y="68" width="115" height="24" rx="6" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5" />
                  <text x="96" y="84" fill="#DC2626" fontSize="9" fontWeight="bold">else: 🛑 CHARGE DULU</text>

                  {/* Robot at junction */}
                  <circle cx="20" cy="50" r="14" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
                  <text x="20" y="54" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">🤖</text>
                </g>
              </svg>
            )
          };

        case 4:
          return {
            badge: 'Bianglala Berputar 🎡',
            badgeColor: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            title: 'Kincir Ria Perulangan (Loops)',
            analogy: 'Loop seperti naik bianglala berputar! Daripada menyuruh robot: "Lompat!", "Lompat!", "Lompat!" berkali-kali, cukup katakan: "Ulangi lompat 5 kali!"',
            mission: 'Hitung mundur roket robot dari 5 sampai 1 untuk meluncur!',
            recipe: [
              { step: '1. Tentukan Putaran', desc: 'for i in range(5):' },
              { step: '2. Kerjakan Tugas', desc: 'print("Putaran ke-", i)' },
              { step: '3. Selesai Otomatis', desc: 'Robot lanjut ke tugas berikutnya!' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ferris Wheel */}
                <g transform="translate(80, 65)">
                  <circle cx="0" cy="0" r="45" stroke="#8B5CF6" strokeWidth="3" strokeDasharray="6 4" />
                  <circle cx="0" cy="0" r="8" fill="#7C3AED" />
                  {/* Spokes */}
                  <line x1="-45" y1="0" x2="45" y2="0" stroke="#A78BFA" strokeWidth="2" />
                  <line x1="0" y1="-45" x2="0" y2="45" stroke="#A78BFA" strokeWidth="2" />
                  {/* Gondolas */}
                  <circle cx="0" cy="-45" r="7" fill="#F59E0B" />
                  <text x="0" y="-42" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">1</text>
                  <circle cx="45" cy="0" r="7" fill="#10B981" />
                  <text x="45" y="3" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">2</text>
                  <circle cx="0" cy="45" r="7" fill="#3B82F6" />
                  <text x="0" y="48" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">3</text>
                  <circle cx="-45" cy="0" r="7" fill="#EF4444" />
                  <text x="-45" y="3" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">4</text>
                  {/* Stand */}
                  <line x1="0" y1="0" x2="-25" y2="55" stroke="#64748B" strokeWidth="3" />
                  <line x1="0" y1="0" x2="25" y2="55" stroke="#64748B" strokeWidth="3" />
                </g>

                {/* Explanation Card */}
                <g transform="translate(160, 25)">
                  <rect x="0" y="0" width="145" height="75" rx="12" fill={isLight ? '#F8FAFC' : '#1E293B'} stroke="#8B5CF6" strokeWidth="1.5" />
                  <text x="12" y="22" fill="#7C3AED" fontSize="10" fontWeight="bold">for putaran in range(5):</text>
                  <text x="24" y="40" fill={isLight ? '#334155' : '#CBD5E1'} fontSize="9">print("Putaran...")</text>
                  <path d="M12 50 L135 50" stroke={isLight ? '#E2E8F0' : '#334155'} />
                  <text x="12" y="65" fill="#10B981" fontSize="9" fontWeight="bold">🔄 Otomatis Berulang 5x</text>
                </g>
              </svg>
            )
          };

        case 5:
          return {
            badge: 'Mesin Jus Buah Ajaib 🧃',
            badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            title: 'Resep Rahasia Fungsi (def)',
            analogy: 'Fungsi seperti mesin pembuat jus! Masukkan buah segar (Input/Parameter), mesin memprosesnya, dan menuangkan segelas jus lezat (Return)!',
            mission: 'Buat resep rahasia untuk robot menghitung skor game otomatis!',
            recipe: [
              { step: '1. Buat Resep (def)', desc: 'def buat_jus(buah):' },
              { step: '2. Racik Bahan', desc: 'hasil = "Jus " + buah' },
              { step: '3. Sajikan (return)', desc: 'return hasil' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Input Fruit */}
                <g transform="translate(20, 45)">
                  <circle cx="16" cy="16" r="14" fill="#EF4444" />
                  <path d="M16 4 Q20 0 22 2" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" />
                  <text x="16" y="20" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">Apel</text>
                  <text x="16" y="42" fill="#64748B" fontSize="8" textAnchor="middle">Input (Bahan)</text>
                </g>

                {/* Arrow */}
                <path d="M58 60 L78 60" stroke="#06B6D4" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M78 57 L84 60 L78 63 Z" fill="#06B6D4" />

                {/* Blender Machine */}
                <g transform="translate(95, 20)">
                  <rect x="0" y="15" width="75" height="70" rx="10" fill="#06B6D4" fillOpacity="0.2" stroke="#0891B2" strokeWidth="2" />
                  <rect x="15" y="0" width="45" height="15" rx="4" fill="#0891B2" />
                  <text x="37.5" y="10" fill="#FFFFFF" fontSize="8" fontWeight="bold" textAnchor="middle">def blender()</text>
                  <circle cx="37.5" cy="45" r="15" fill="#FDE047" fillOpacity="0.6" />
                  <path d="M30 45 Q37.5 35 45 45" stroke="#EA580C" strokeWidth="2" />
                  <text x="37.5" y="74" fill="#0891B2" fontSize="7.5" fontWeight="bold" textAnchor="middle">PROSES JUS</text>
                </g>

                {/* Arrow */}
                <path d="M180 60 L200 60" stroke="#10B981" strokeWidth="2" />
                <path d="M200 57 L206 60 L200 63 Z" fill="#10B981" />

                {/* Juice Output */}
                <g transform="translate(220, 30)">
                  <path d="M10 20 L15 65 L45 65 L50 20 Z" fill="#F97316" fillOpacity="0.4" stroke="#EA580C" strokeWidth="2" />
                  <path d="M12 30 L14 62 L46 62 L48 30 Z" fill="#FB923C" />
                  <line x1="30" y1="5" x2="40" y2="50" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
                  <text x="30" y="80" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle">return "Jus Apel"</text>
                </g>
              </svg>
            )
          };

        default:
          return {
            badge: 'Cetakan Kue Robot 🍪',
            badgeColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
            title: 'Cetakan Kue Super (Class & Object)',
            analogy: 'Class adalah cetakan kue! Dari satu cetakan master, kamu bisa memanggang puluhan kue robot warna-warni (Object) dengan jurus dan perlengkapan berbeda!',
            mission: 'Cetak 2 robot petarung dari 1 cetakan blueprint yang sama!',
            recipe: [
              { step: '1. Buat Cetakan', desc: 'class Robot:' },
              { step: '2. Cetak Robot A', desc: 'r1 = Robot("Merah")' },
              { step: '3. Cetak Robot B', desc: 'r2 = Robot("Biru")' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Master Blueprint */}
                <g transform="translate(20, 20)">
                  <rect x="0" y="0" width="85" height="85" rx="10" fill="#6366F1" fillOpacity="0.15" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 3" />
                  <text x="42.5" y="20" fill="#4F46E5" fontSize="8" fontWeight="bold" textAnchor="middle">CLASS (CETAKAN)</text>
                  <text x="42.5" y="35" fill="#4338CA" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">class Robot:</text>
                  <circle cx="42.5" cy="58" r="16" fill="none" stroke="#6366F1" strokeWidth="2" />
                  <text x="42.5" y="63" fill="#6366F1" fontSize="12" textAnchor="middle">🤖</text>
                </g>

                {/* Stamp Arrows */}
                <path d="M115 45 L145 35" stroke="#6366F1" strokeWidth="2" />
                <path d="M115 65 L145 75" stroke="#6366F1" strokeWidth="2" />

                {/* Printed Object 1 */}
                <g transform="translate(155, 15)">
                  <rect x="0" y="0" width="130" height="38" rx="8" fill="#EF4444" fillOpacity="0.15" stroke="#EF4444" strokeWidth="1.5" />
                  <text x="10" y="16" fill="#DC2626" fontSize="8" fontWeight="bold">Object 1: r1 = Robot("Merah")</text>
                  <text x="10" y="30" fill="#991B1B" fontSize="8">❤️ Kekuatan: Api | Kecepatan: 90</text>
                </g>

                {/* Printed Object 2 */}
                <g transform="translate(155, 60)">
                  <rect x="0" y="0" width="130" height="38" rx="8" fill="#3B82F6" fillOpacity="0.15" stroke="#3B82F6" strokeWidth="1.5" />
                  <text x="10" y="16" fill="#2563EB" fontSize="8" fontWeight="bold">Object 2: r2 = Robot("Biru")</text>
                  <text x="10" y="30" fill="#1E40AF" fontSize="8">💙 Kekuatan: Air | Kecepatan: 110</text>
                </g>
              </svg>
            )
          };
      }
    }

    if (category === 'micropython') {
      switch (lessonIndex) {
        case 0:
          return {
            badge: 'Kunang-Kunang Lampu Listrik 💡',
            badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            title: 'Saklar Digital Lampu Berkedip',
            analogy: 'Digital Pin itu seperti saklar dinding kamar! Nilai 1 (HIGH) menyalakan lampu terang, lalu time.sleep(1) istirahat sejenak, dan nilai 0 (LOW) memadamkan lampu!',
            mission: 'Buat lampu LED di board ESP32 berkedip seperti detak jantung!',
            recipe: [
              { step: '1. Pasang Pin', desc: 'led = Pin(2, Pin.OUT)' },
              { step: '2. Nyalakan Lampu', desc: 'led.value(1) # Terang! ☀️' },
              { step: '3. Padamkan Lampu', desc: 'led.value(0) # Gelap 🌙' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* ESP32 Chip */}
                <rect x="25" y="25" width="80" height="75" rx="8" fill="#1E293B" stroke="#334155" strokeWidth="2" />
                <rect x="40" y="15" width="50" height="10" fill="#94A3B8" rx="2" />
                <text x="65" y="55" fill="#E2E8F0" fontSize="9" fontWeight="bold" textAnchor="middle">ESP32</text>
                <text x="65" y="70" fill="#38BDF8" fontSize="8" fontWeight="bold" textAnchor="middle">Pin 2 (OUT)</text>

                {/* Wire */}
                <path d="M105 65 L180 65" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <path d="M105 85 L180 85" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />

                {/* Glowing LED */}
                <g transform="translate(195, 30)">
                  <circle cx="35" cy="35" r="28" fill="#F59E0B" fillOpacity="0.25" className="animate-pulse" />
                  <path d="M20 35 C20 18 50 18 50 35 L50 48 L20 48 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                  <rect x="22" y="48" width="26" height="8" rx="2" fill="#94A3B8" />
                  <line x1="28" y1="56" x2="28" y2="70" stroke="#F59E0B" strokeWidth="2" />
                  <line x1="42" y1="56" x2="42" y2="70" stroke="#64748B" strokeWidth="2" />
                  <text x="35" y="38" fill="#78350F" fontSize="9" fontWeight="bold" textAnchor="middle">ON! ✨</text>
                </g>
              </svg>
            )
          };

        case 1:
          return {
            badge: 'Ombak Denyut Kecerahan 🌊',
            badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            title: 'Kacamata Dimmer Lampu Tidur (PWM)',
            analogy: 'PWM adalah trik sulap mata! Robot menyalakan dan mematikan lampu ribuan kali per detik sangat cepat, sehingga lampu tampak redup atau terang seperti lampu tidur!',
            mission: 'Atur lampu agar bersinar redup lembut lalu perlahan menjadi sangat terang!',
            recipe: [
              { step: '1. Aktifkan PWM', desc: 'pwm = PWM(Pin(2), freq=1000)' },
              { step: '2. Atur Redup (20%)', desc: 'pwm.duty(200)' },
              { step: '3. Atur Terang (100%)', desc: 'pwm.duty(1023)' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Wave form 1 (Dim) */}
                <g transform="translate(20, 20)">
                  <text x="0" y="12" fill="#06B6D4" fontSize="8" fontWeight="bold">PWM 25% (Redup)</text>
                  <path d="M0 35 H15 V15 H25 V35 H50 V15 H60 V35 H85 V15 H95 V35 H120" stroke="#06B6D4" strokeWidth="2" fill="none" />
                </g>
                {/* Wave form 2 (Bright) */}
                <g transform="translate(170, 20)">
                  <text x="0" y="12" fill="#F59E0B" fontSize="8" fontWeight="bold">PWM 80% (Terang)</text>
                  <path d="M0 35 H5 V15 H35 V35 H45 V15 H75 V35 H85 V15 H115 V35 H120" stroke="#F59E0B" strokeWidth="2" fill="none" />
                </g>
                {/* Result lamp illustration */}
                <g transform="translate(45, 70)">
                  <circle cx="20" cy="20" r="14" fill="#06B6D4" fillOpacity="0.3" />
                  <circle cx="20" cy="20" r="7" fill="#06B6D4" />
                  <text x="45" y="24" fill="#64748B" fontSize="9">Lampu Tidur Redup 🌙</text>
                </g>
                <g transform="translate(195, 70)">
                  <circle cx="20" cy="20" r="20" fill="#F59E0B" fillOpacity="0.4" className="animate-pulse" />
                  <circle cx="20" cy="20" r="9" fill="#F59E0B" />
                  <text x="50" y="24" fill="#D97706" fontSize="9" fontWeight="bold">Lampu Penuh Terang ☀️</text>
                </g>
              </svg>
            )
          };

        case 2:
          return {
            badge: 'Keran Air & Knop Putar 🚰',
            badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
            title: 'Membaca Sensor Potensiometer (ADC)',
            analogy: 'Sensor ADC seperti keran air putar atau pengatur volume musik! Semakin kamu putar ke kanan, semakin banyak energi yang mengalir, terbaca dari 0 hingga 4095!',
            mission: 'Putar knop potensiometer untuk mengatur kecepatan laju roda robot!',
            recipe: [
              { step: '1. Pasang Pin ADC', desc: 'pot = ADC(Pin(34))' },
              { step: '2. Baca Level', desc: 'nilai = pot.read()' },
              { step: '3. Tampilkan Nilai', desc: 'print("Tegangan:", nilai)' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Rotary Knob */}
                <g transform="translate(50, 65)">
                  <circle cx="0" cy="0" r="35" fill="#334155" stroke="#64748B" strokeWidth="3" />
                  <circle cx="0" cy="0" r="25" fill="#1E293B" />
                  <line x1="0" y1="0" x2="16" y2="-16" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="6" fill="#10B981" />
                  <text x="0" y="48" fill="#94A3B8" fontSize="8" textAnchor="middle">Knop Diputar 🎚️</text>
                </g>

                {/* Meter gauge */}
                <g transform="translate(160, 25)">
                  <rect x="0" y="0" width="135" height="75" rx="10" fill={isLight ? '#F1F5F9' : '#1E293B'} stroke="#10B981" strokeWidth="1.5" />
                  <text x="12" y="20" fill="#059669" fontSize="9" fontWeight="bold">Bacaan Sensor ADC:</text>
                  <text x="12" y="44" fill={isLight ? '#065F46' : '#6EE7B7'} fontSize="18" fontWeight="bold" fontFamily="monospace">2048</text>
                  <text x="65" y="44" fill="#94A3B8" fontSize="9">/ 4095 (50%)</text>
                  <div className="w-24 h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <rect x="12" y="55" width="110" height="8" rx="4" fill="#E2E8F0" />
                    <rect x="12" y="55" width="55" height="8" rx="4" fill="#10B981" />
                  </div>
                </g>
              </svg>
            )
          };

        case 4:
          return {
            badge: 'Radar Lumba-Lumba & Kelelawar 🐬',
            badgeColor: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
            title: 'Mata Ganda Sensor Jarak (HC-SR04)',
            analogy: 'HC-SR04 punya dua mata sonar! Mata kiri menembakkan suara jeritan tak terdengar (PING), lalu memantul di dinding, dan mata kanan menangkap pantulannya (PONG) untuk menghitung jarak!',
            mission: 'Beri tahu robot untuk berhenti jika ada tembok berjarak kurang dari 15 cm!',
            recipe: [
              { step: '1. Kirim Suara', desc: 'trig.value(1) lalu 0 (Ping!)' },
              { step: '2. Dengar Gema', desc: 'waktu = echo.pulse_in()' },
              { step: '3. Hitung Jarak', desc: 'jarak = (waktu x 0.034) / 2' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ultrasonic Sensor Eyes */}
                <g transform="translate(25, 30)">
                  <rect x="0" y="10" width="85" height="50" rx="8" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                  <circle cx="22" cy="35" r="16" fill="#E2E8F0" stroke="#334155" strokeWidth="3" />
                  <circle cx="22" cy="35" r="6" fill="#0F172A" />
                  <text x="22" y="68" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">TRIG 🔊</text>

                  <circle cx="63" cy="35" r="16" fill="#E2E8F0" stroke="#334155" strokeWidth="3" />
                  <circle cx="63" cy="35" r="6" fill="#0F172A" />
                  <text x="63" y="68" fill="#FFFFFF" fontSize="7" fontWeight="bold" textAnchor="middle">ECHO 👂</text>
                </g>

                {/* Sound waves outgoing */}
                <path d="M120 40 Q130 50 120 60" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M135 32 Q150 50 135 68" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" />

                {/* Sound waves returning */}
                <path d="M175 42 Q165 50 175 58" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
                <path d="M160 34 Q148 50 160 66" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />

                {/* Obstacle Wall */}
                <g transform="translate(210, 20)">
                  <rect x="0" y="0" width="18" height="75" rx="4" fill="#EF4444" stroke="#B91C1C" strokeWidth="2" />
                  <line x1="0" y1="20" x2="18" y2="20" stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1="0" y1="40" x2="18" y2="40" stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1="0" y1="60" x2="18" y2="60" stroke="#FFFFFF" strokeWidth="1.5" />
                  <text x="9" y="90" fill="#EF4444" fontSize="8" fontWeight="bold" textAnchor="middle">Dinding</text>
                </g>

                {/* Distance Measurement */}
                <g transform="translate(245, 30)">
                  <rect x="0" y="0" width="65" height="50" rx="8" fill={isLight ? '#F8FAFC' : '#1E293B'} stroke="#0284C7" strokeWidth="1.5" />
                  <text x="32.5" y="18" fill="#0369A1" fontSize="8" fontWeight="bold" textAnchor="middle">JARAK</text>
                  <text x="32.5" y="38" fill="#0284C7" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">24 cm</text>
                </g>
              </svg>
            )
          };

        default:
          return {
            badge: 'Sinyal Awan IoT 🌐',
            badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            title: 'Koneksi Ajaib Tanpa Kabel',
            analogy: 'MicroPython menghubungkan otak robot ke udara melalui gelombang Wi-Fi! Robot bisa mengirim kabar ke handphonemu dari mana saja!',
            mission: 'Kirim pesan rahasia robot ke halaman web lokal!',
            recipe: [
              { step: '1. Sambung Wi-Fi', desc: 'wlan.connect("SSID", "PASS")' },
              { step: '2. Buka Server', desc: 'server = socket.socket()' },
              { step: '3. Kirim Data', desc: 'client.send("Status Robot: OK!")' }
            ],
            illustration: (
              <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Robot */}
                <g transform="translate(30, 30)">
                  <rect x="0" y="10" width="50" height="45" rx="10" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="2" />
                  <circle cx="16" cy="28" r="4" fill="#FFFFFF" />
                  <circle cx="34" cy="28" r="4" fill="#FFFFFF" />
                  <line x1="25" y1="10" x2="25" y2="0" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="25" cy="-2" r="3" fill="#EF4444" />
                </g>
                {/* Wi-Fi Waves */}
                <path d="M100 45 Q125 25 150 45" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />
                <path d="M110 52 Q125 38 140 52" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <circle cx="125" cy="58" r="3" fill="#3B82F6" />
                {/* Smartphone / Cloud */}
                <g transform="translate(180, 20)">
                  <rect x="0" y="0" width="45" height="75" rx="8" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
                  <rect x="5" y="8" width="35" height="55" rx="4" fill="#BAE6FD" />
                  <text x="22.5" y="32" fill="#0369A1" fontSize="7" fontWeight="bold" textAnchor="middle">HP KAMU</text>
                  <text x="22.5" y="45" fill="#15803D" fontSize="8" fontWeight="bold" textAnchor="middle">ONLINE</text>
                </g>
              </svg>
            )
          };
      }
    }

    // Hardware Arduino Lessons
    switch (lessonIndex) {
      case 0:
        return {
          badge: 'Kerajaan Pin Uno 🗺️',
          badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
          title: 'Peta Anatomi Board Arduino Uno',
          analogy: 'Arduino Uno seperti kota kecil robot! Ada Pembangkit Listrik (5V & GND), Jalur Jalan Tol Saklar (D0-D13), dan Stasiun Penerima Sinyal Sensor (A0-A5)!',
          mission: 'Temukan letak pin D13 yang terhubung ke lampu oranye bawaan board!',
          recipe: [
            { step: '1. Pulau Power', desc: '5V (Energi) & GND (Jalur Arus Kembali)' },
            { step: '2. Pulau Digital', desc: 'D0 s/d D13 untuk tombol & lampu' },
            { step: '3. Pulau Analog', desc: 'A0 s/d A5 untuk membaca sensor luar' }
          ],
          illustration: (
            <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Arduino Board Body */}
              <rect x="30" y="15" width="220" height="95" rx="8" fill="#00979C" stroke="#00797E" strokeWidth="3" />
              {/* USB Port */}
              <rect x="15" y="30" width="25" height="35" rx="3" fill="#94A3B8" stroke="#64748B" strokeWidth="2" />
              <text x="27" y="52" fill="#334155" fontSize="6.5" fontWeight="bold" textAnchor="middle">USB</text>
              {/* Power Jack */}
              <rect x="25" y="75" width="22" height="25" rx="2" fill="#1E293B" />
              {/* Microcontroller Chip */}
              <rect x="100" y="45" width="85" height="30" rx="3" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
              <text x="142.5" y="63" fill="#F8FAFC" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">ATmega328P</text>
              {/* Header Pins Top */}
              <rect x="90" y="17" width="130" height="10" fill="#334155" />
              <text x="155" y="25" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle">DIGITAL D0 - D13</text>
              {/* Header Pins Bottom */}
              <rect x="90" y="97" width="60" height="10" fill="#334155" />
              <text x="120" y="105" fill="#F59E0B" fontSize="6" fontWeight="bold" textAnchor="middle">POWER 5V/GND</text>
              <rect x="160" y="97" width="60" height="10" fill="#334155" />
              <text x="190" y="105" fill="#38BDF8" fontSize="6" fontWeight="bold" textAnchor="middle">ANALOG A0-A5</text>
              {/* D13 Builtin LED */}
              <circle cx="85" cy="50" r="4" fill="#F59E0B" stroke="#B45309" strokeWidth="1" className="animate-pulse" />
              <text x="85" y="62" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">L</text>
            </svg>
          )
        };

      case 4:
        return {
          badge: 'Lengan Robot Presisi 🦾',
          badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          title: 'Motor Servo Pembelok Sudut',
          analogy: 'Motor Servo seperti sendi siku atau pergelangan tangan robot! Kamu bisa menyuruhnya berputar tepat ke sudut 0°, 90°, atau 180° untuk melambaikan tangan!',
          mission: 'Gerakkan horn servo dari kiri ke kanan seperti lambaian tangan salam robot!',
          recipe: [
            { step: '1. Pasang Servo', desc: 'myServo.attach(9);' },
            { step: '2. Putar ke Tengah', desc: 'myServo.write(90); // 90 Derajat' },
            { step: '3. Putar Penuh', desc: 'myServo.write(180); // 180 Derajat' }
          ],
          illustration: (
            <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Servo Box */}
              <g transform="translate(60, 35)">
                <rect x="0" y="15" width="70" height="55" rx="6" fill="#1E3A8A" stroke="#1D4ED8" strokeWidth="2" />
                <rect x="-10" y="32" width="10" height="8" fill="#1E3A8A" />
                <rect x="70" y="32" width="10" height="8" fill="#1E3A8A" />
                {/* Gear top */}
                <circle cx="50" cy="15" r="16" fill="#2563EB" stroke="#1D4ED8" strokeWidth="2" />
                {/* Horn Arm */}
                <g transform="rotate(45, 50, 15)">
                  <rect x="44" y="-25" width="12" height="40" rx="6" fill="#F8FAFC" stroke="#64748B" strokeWidth="1.5" />
                  <circle cx="50" cy="15" r="4" fill="#0F172A" />
                  <circle cx="50" cy="-18" r="2.5" fill="#64748B" />
                  <circle cx="50" cy="-8" r="2.5" fill="#64748B" />
                </g>
                <text x="35" y="55" fill="#93C5FD" fontSize="8" fontWeight="bold" textAnchor="middle">SERVO SG90</text>
              </g>

              {/* Angle scale arch */}
              <g transform="translate(185, 30)">
                <path d="M10 65 A 50 50 0 0 1 90 65" stroke="#94A3B8" strokeWidth="2" strokeDasharray="3 3" fill="none" />
                <text x="8" y="78" fill="#64748B" fontSize="8" fontWeight="bold">0°</text>
                <text x="50" y="12" fill="#2563EB" fontSize="9" fontWeight="bold" textAnchor="middle">90°</text>
                <text x="92" y="78" fill="#64748B" fontSize="8" fontWeight="bold">180°</text>
                <path d="M50 65 L50 22" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="50" cy="65" r="4" fill="#2563EB" />
                <text x="50" y="92" fill="#10B981" fontSize="9" fontWeight="bold" textAnchor="middle">Putar Presisi Siku 🦾</text>
              </g>
            </svg>
          )
        };

      default:
        return {
          badge: 'Listrik & Sinyal Cilik ⚡',
          badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          title: 'Sinyal Elektronika Robot',
          analogy: 'Komponen elektronika bekerja seperti aliran air di dalam pipa. Saklar membuka jalan, resistor memperlambat aliran, dan lampu bersinar gembira!',
          mission: 'Kendalikan aliran listrik pada pin robot!',
          recipe: [
            { step: '1. Atur Arah Pin', desc: 'pinMode(pin, OUTPUT/INPUT);' },
            { step: '2. Tulis Tegangan', desc: 'digitalWrite(pin, HIGH);' },
            { step: '3. Beri Waktu Jeda', desc: 'delay(1000);' }
          ],
          illustration: (
            <svg viewBox="0 0 320 130" className="w-full h-auto max-h-[140px]" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="40" y="30" width="60" height="50" rx="8" fill="#00979C" stroke="#00797E" strokeWidth="2" />
              <text x="70" y="58" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">Uno</text>
              <path d="M100 55 L200 55" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 3" />
              <g transform="translate(200, 35)">
                <circle cx="20" cy="20" r="16" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                <text x="20" y="24" fill="#78350F" fontSize="10" textAnchor="middle">💡</text>
              </g>
            </svg>
          )
        };
    }
  };

  const data = getAnalogyData();

  return (
    <div className={`w-full rounded-2xl p-4 sm:p-5 border transition flex flex-col gap-3.5 shadow-sm ${
      isLight ? 'bg-gradient-to-br from-amber-50/50 via-white to-blue-50/30 border-blue-100' : 'bg-gradient-to-br from-[#121626] to-[#0c0d14] border-blue-900/40'
    }`}>
      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${data.badgeColor}`}>
            <Sparkles className="w-3 h-3" />
            <span>{data.badge}</span>
          </span>
          <span className={`text-[11px] font-extrabold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
            {data.title}
          </span>
        </div>
        <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-lg ${
          isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
        }`}>
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Analogi Seru</span>
        </div>
      </div>

      {/* Hero Visual Analogy Illustration */}
      <div className={`w-full rounded-xl p-2 sm:p-3 border flex items-center justify-center overflow-hidden transition ${
        isLight ? 'bg-white/90 border-slate-200/90 shadow-inner' : 'bg-black/40 border-white/5'
      }`}>
        {data.illustration}
      </div>

      {/* Kid-Friendly Analogy Story */}
      <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
        isLight ? 'bg-blue-50/70 border-blue-200/70 text-blue-950' : 'bg-blue-950/20 border-blue-800/40 text-blue-200'
      }`}>
        <div className="p-1 rounded-lg bg-blue-500 text-white flex-shrink-0 mt-0.5">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">💡 Analogi Dunia Nyata:</h4>
          <p className="text-[10.5px] leading-relaxed font-medium">{data.analogy}</p>
        </div>
      </div>

      {/* Kid Mission Challenge */}
      <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
        isLight ? 'bg-emerald-50/70 border-emerald-200/70 text-emerald-950' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
      }`}>
        <div className="p-1 rounded-lg bg-emerald-500 text-white flex-shrink-0 mt-0.5">
          <Play className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">🎯 Misi Robot Cilik:</h4>
          <p className="text-[10.5px] leading-relaxed font-medium">{data.mission}</p>
        </div>
      </div>

      {/* Simplified 3-Step Recipe */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
        {data.recipe.map((step, idx) => (
          <div key={idx} className={`p-2.5 rounded-xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <span className="text-[9px] font-extrabold text-blue-500 block mb-0.5">{step.step}</span>
            <p className="text-[9.5px] font-mono leading-tight text-slate-600 dark:text-slate-300">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KidsAnalogyCard;
