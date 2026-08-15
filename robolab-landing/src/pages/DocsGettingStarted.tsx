import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Rocket, Code2, GraduationCap, Download, Wifi, Cpu, FolderPlus, Upload,
  ChevronRight, Info, Home, Search, Play, CheckCircle2, Monitor
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import StepCard from '../components/StepCard'

const steps = [
  {
    number: 1,
    numberColor: 'bg-[#1557B0]',
    Icon: Download,
    iconColor: 'text-[#1557B0]',
    title: 'Download & Install',
    description: 'Unduh RoboLab Studio untuk Windows dan instal pada komputer Anda.',
    isLast: false,
  },
  {
    number: 2,
    numberColor: 'bg-[#10B981]',
    Icon: Wifi,
    iconColor: 'text-[#10B981]',
    title: 'Hubungkan Board',
    description: 'Sambungkan board Arduino, ESP32, atau Micro:Bit ke komputer menggunakan kabel USB.',
    isLast: false,
  },
  {
    number: 3,
    numberColor: 'bg-[#F59E0B]',
    Icon: Cpu,
    iconColor: 'text-[#F59E0B]',
    title: 'Pilih Board & Port',
    description: 'Pilih tipe board yang digunakan dan COM port yang terdeteksi secara otomatis.',
    isLast: false,
  },
  {
    number: 4,
    numberColor: 'bg-[#7C3AED]',
    Icon: FolderPlus,
    iconColor: 'text-[#7C3AED]',
    title: 'Buat Project',
    description: 'Pilih mode Visual Block atau Code Editor, lalu susun logika program Anda.',
    isLast: false,
  },
  {
    number: 5,
    numberColor: 'bg-[#1557B0]',
    Icon: Upload,
    iconColor: 'text-[#1557B0]',
    title: 'Upload & Jalankan',
    description: 'Upload kode ke hardware atau jalankan simulasi virtual secara real-time.',
    isLast: true,
  },
]

const sidebarItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'fitur-utama', label: 'Keunggulan Platform' },
  { id: 'simulasi', label: 'Simulasi Virtual' },
  { id: 'langkah-cepat', label: '5 Langkah Cepat' },
  { id: 'board-didukung', label: 'Board yang Didukung' },
]

export default function DocsGettingStarted() {
  useEffect(() => {
    document.title = 'Getting Started — RoboLab Studio Docs'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Panduan lengkap untuk memulai menggunakan RoboLab Studio: Download & Install, Hubungkan Board, Pilih Board & Port, Buat Project, Upload & Jalankan.')
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16">
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <Link to="/" className="hover:text-[#1557B0] flex items-center gap-1 transition-colors">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-slate-500">Docs</span>
            <ChevronRight size={13} />
            <span className="text-[#1557B0] font-medium">Getting Started</span>

            {/* Search display */}
            <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-400">
              <Search size={12} />
              Cari panduan...
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16 py-8">
        <div className="flex gap-8">

          {/* ─── Sidebar Navigation ───────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
                Daftar Isi Panduan
              </div>
              <nav className="space-y-1">
                {sidebarItems.map((item, idx) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      idx === 0
                        ? 'text-[#1557B0] bg-blue-50/80 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1557B0]/60"></span>
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  to="/download"
                  className="btn-primary text-xs w-full justify-center py-2.5"
                >
                  <Download size={13} />
                  Download RoboLab Studio
                </Link>
              </div>
            </div>
          </aside>

          {/* ─── Main Content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Badge + H1 */}
            <div id="overview" className="section-badge mb-4">
              <Rocket size={11} />
              Dokumentasi Resmi
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0F172A] mb-3">
              Getting Started with RoboLab Studio
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-2xl">
              Selamat datang di RoboLab Studio! Panduan ini akan memandu Anda dari instalasi awal, menghubungkan perangkat, hingga berhasil menjalankan project IoT &amp; Robotika pertama Anda.
            </p>

            {/* 3 Value Cards */}
            <div id="fitur-utama" className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  icon: Rocket, color: 'text-[#1557B0]', bg: 'bg-blue-50',
                  title: 'Mudah untuk Pemula',
                  desc: 'Dirancang khusus untuk pelajar dan pemula dengan antarmuka visual yang intuitif dan rapi.',
                },
                {
                  icon: Code2, color: 'text-[#10B981]', bg: 'bg-green-50',
                  title: 'Powerful & Fleksibel',
                  desc: 'Editor kode, visual block, simulator, library manager, dan tools lengkap dalam satu workspace.',
                },
                {
                  icon: GraduationCap, color: 'text-[#7C3AED]', bg: 'bg-purple-50',
                  title: 'Belajar Lebih Cepat',
                  desc: 'Dukungan contoh project siap pakai dan pembelajaran terstruktur untuk mempercepat penguasaan.',
                },
              ].map(card => (
                <div key={card.title} className="card p-5">
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3 ${card.color}`}>
                    <card.icon size={20} />
                  </div>
                  <h3 className="font-display font-semibold text-[#0F172A] text-sm mb-1.5">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            {/* Info Banner: Simulasi */}
            <div id="simulasi" className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1557B0] flex items-center justify-center flex-shrink-0 text-white shadow">
                  <Monitor size={18} />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-[#1557B0] text-sm mb-1">
                    Belajar dengan Simulasi Virtual atau Hardware Nyata
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                    RoboLab Studio dilengkapi Virtual Hardware Simulator yang memungkinkan Anda merangkai dan menguji program langsung di komputer sebelum menghubungkan ke perangkat fisik.
                  </p>
                </div>
              </div>
              <div className="hidden md:block w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-blue-200">
                <img src="/assets/sim.jpg" alt="Virtual Hardware Simulator" className="w-full h-full object-cover object-left-top" />
              </div>
            </div>

            {/* Quick Steps */}
            <div id="langkah-cepat" className="mb-12">
              <h2 className="font-display font-bold text-2xl text-[#0F172A] mb-2">5 Langkah Cepat Memulai</h2>
              <p className="text-slate-500 text-sm mb-6">Ikuti urutan langkah di bawah ini untuk memulai project Anda:</p>

              <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0">
                {steps.map(step => (
                  <StepCard key={step.number} {...step} />
                ))}
              </div>
            </div>

            {/* Board Support Section */}
            <div id="board-didukung" className="card p-6 mb-10">
              <h3 className="font-display font-bold text-lg text-[#0F172A] mb-2">Board &amp; Platform yang Didukung</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                RoboLab Studio mendukung beragam mikrokontroler dan bahasa pemrograman populer secara native:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>Arduino Uno, Nano, Mega</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>ESP32 (WROOM, DevKit, S2, S3)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>ESP8266 &amp; NodeMCU</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>BBC Micro:Bit</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>Python &amp; Jupyter Kernel</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                  <span>MicroPython REPL &amp; Scripts</span>
                </div>
              </div>
            </div>

            {/* Bottom CTA Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 gap-4">
              <div>
                <h4 className="font-display font-bold text-base text-[#0F172A] mb-1">Siap untuk Mulai Mengoding?</h4>
                <p className="text-xs text-slate-500">Unduh aplikasinya sekarang dan nikmati kemudahan belajar robotika.</p>
              </div>
              <Link to="/download" className="btn-primary px-6 py-3 text-sm flex-shrink-0">
                <Download size={15} />
                Download RoboLab Studio
              </Link>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  )
}
