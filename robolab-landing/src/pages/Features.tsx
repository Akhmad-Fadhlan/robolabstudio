import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Download, BookOpen, Rocket, Code2, Globe, GraduationCap } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import FeatureCard from '../components/FeatureCard'

const highlights = [
  { icon: Rocket, label: 'All-in-One', desc: 'Semua tool dalam satu workspace' },
  { icon: Globe, label: 'Multi Platform', desc: 'Windows, macOS, dan Linux' },
  { icon: Code2, label: 'Akses Penuh', desc: 'Akses lengkap ke seluruh fitur & tools' },
  { icon: GraduationCap, label: 'Education First', desc: 'Dirancang untuk pelajar, guru, dan maker' },
]

const features = [
  {
    icon: '◈',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Visual Block Programming',
    description: 'Buat program dengan drag & drop block. Mudah dipahami, seru, dan efektif untuk pemula.',
    thumbnail: '/assets/home.jpg',
    thumbnailPosition: '35% 25%',
  },
  {
    icon: '</>',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    title: 'Code Editor',
    description: 'Editor kode yang lengkap dengan syntax highlighting, auto-complete, dan banyak fitur modern.',
    thumbnail: '/assets/lp.jpg',
    thumbnailPosition: '55% top',
  },
  {
    icon: '⬡',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    title: 'Virtual Hardware Simulator',
    description: 'Simulasikan rangkaian elektronika secara virtual sebelum menghubungkannya ke hardware nyata.',
    thumbnail: '/assets/sim.jpg',
    thumbnailPosition: 'center top',
  },
  {
    icon: '🐍',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Python & MicroPython',
    description: 'Belajar Python dari dasar hingga lanjut. Jalankan project Python dan MicroPython secara interaktif.',
    thumbnail: '/assets/lp.jpg',
    thumbnailPosition: 'right top',
  },
  {
    icon: '⊞',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    title: 'Library Manager',
    description: 'Kelola library Arduino dan package Python dengan mudah. Install dari registry, GitHub, atau file ZIP.',
    thumbnail: '/assets/lb.jpg',
    thumbnailPosition: '0% 30%',
  },
  {
    icon: '🔧',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Board Manager',
    description: 'Dukungan banyak board populer seperti ESP32, ESP8266, Arduino, Micro:Bit dan lainnya.',
    thumbnail: '/assets/lb.jpg',
    thumbnailPosition: '0% 70%',
  },
  {
    icon: '⊡',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    title: 'Serial Monitor & Terminal',
    description: 'Monitor data serial, kirim perintah, dan debug perangkat dengan mudah secara real-time.',
    thumbnail: '/assets/ter.png',
    thumbnailPosition: 'center top',
  },
  {
    icon: '✦',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'RoboLab AI Assistant',
    description: 'Asisten AI untuk analisis kode, perbaikan error, jelaskan komponen, hingga bantu desain rangkaian.',
    thumbnail: '/assets/ter.png',
    thumbnailPosition: 'center 40%',
  },
]

export default function Features() {
  useEffect(() => {
    document.title = 'Features — RoboLab Studio'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Explore 8 powerful features of RoboLab Studio: Visual Block Programming, Code Editor, Virtual Hardware Simulator, Python & MicroPython, Library Manager, Board Manager, Serial Monitor, and AI Assistant.')
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-white pt-10 pb-12 sm:pt-12 sm:pb-14 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
            {/* Left */}
            <div>
              <div className="section-badge mb-4 sm:mb-5">
                <Rocket size={11} />
                Powerful Features
              </div>
              <h1 className="font-display font-extrabold text-[clamp(1.85rem,4vw,3rem)] text-[#0F172A] leading-[1.1] mb-3 sm:mb-4">
                Everything You Need<br />in <span className="text-blue-accent">One Workspace</span>
              </h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg">
                RoboLab Studio menggabungkan editor kode, visual block, simulator, library manager, hingga AI assistant dalam satu platform terintegrasi untuk belajar dan membangun project IoT &amp; Robotika.
              </p>
            </div>

            {/* Right: 4 highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {highlights.map(h => (
                <div key={h.label} className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl bg-[#F8FAFC] border border-slate-100">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-slate-100 shadow-card flex items-center justify-center mb-2.5 sm:mb-3 text-[#1557B0]">
                    <h.icon size={20} />
                  </div>
                  <div className="font-display font-bold text-xs sm:text-sm text-[#0F172A] mb-1">{h.label}</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">{h.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8 Feature Cards ──────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map(f => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                iconBg={f.iconBg}
                iconColor={f.iconColor}
                title={f.title}
                description={f.description}
                thumbnail={f.thumbnail}
                thumbnailPosition={f.thumbnailPosition}
                showChevron={true}
                linkTo="/docs/getting-started"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Band ─────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-14 bg-gradient-to-br from-[#1557B0] via-[#1E40AF] to-[#7C3AED]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold mb-3 sm:mb-4 border border-white/20">
              <Download size={12} />
              Akses Gratis Sekarang
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl md:text-3xl text-white mb-2">
              Siap membangun project IoT &amp; Robotika Anda?
            </h2>
            <p className="text-blue-200 text-xs sm:text-sm md:text-base">Download RoboLab Studio sekarang dan mulai berkreasi!</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full md:w-auto">
            <Link to="/download"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-[#1557B0] font-bold text-xs sm:text-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              <Download size={16} />
              Download RoboLab Studio
            </Link>
            <Link to="/docs/getting-started"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white/10 text-white font-semibold text-xs sm:text-sm border border-white/20 hover:bg-white/20 transition-all">
              <BookOpen size={16} />
              Lihat Dokumentasi
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
