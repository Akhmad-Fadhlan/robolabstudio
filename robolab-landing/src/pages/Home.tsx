import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, BookOpen, CheckCircle2, Zap, Monitor, ChevronRight, Star, Send, Bug, MessageCircle, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WindowFrame from '../components/WindowFrame'
import FeatureCard from '../components/FeatureCard'

const platforms = [
  { name: 'Arduino', icon: '/assets/platforms/arduino.svg', color: '#00979D' },
  { name: 'ESP32', icon: '/assets/platforms/esp32.svg', color: '#E7352C' },
  { name: 'ESP8266', icon: '/assets/platforms/esp8266.png', color: '#E7352C' },
  { name: 'Micro:Bit', icon: '/assets/platforms/microbit.svg', color: '#00B5AD' },
  { name: 'Python', icon: '/assets/platforms/python.svg', color: '#3776AB' },
  { name: 'MicroPython', icon: '/assets/platforms/micropython.svg', color: '#2B5F75' },
]

const previewFeatures = [
  {
    icon: '◈',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Visual Block & Code Editor',
    description: 'Belajar logika pemrograman secara visual dengan drag & drop, sekaligus tulis dan upload kode dengan syntax highlighting modern.',
    thumbnail: '/assets/h1.jpg',
    thumbnailPosition: 'center top',
  },
  {
    icon: '⬡',
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    title: 'Virtual Hardware Simulator',
    description: 'Simulasikan rangkaian secara virtual sebelum ke hardware nyata.',
    thumbnail: '/assets/sim.jpg',
    thumbnailPosition: 'center top',
  },
  {
    icon: '🐍',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'Python & MicroPython',
    description: 'Belajar Python dan jalankan project IoT dengan terminal interaktif.',
    thumbnail: '/assets/lp.jpg',
    thumbnailPosition: 'right top',
  },
  {
    icon: '⊞',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    title: 'Library & Board Manager',
    description: 'Kelola library, install core, dan pilih board dengan cepat dan mudah.',
    thumbnail: '/assets/lb.jpg',
    thumbnailPosition: 'left top',
  },
  {
    icon: '✦',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    title: 'RoboLab AI Assistant',
    description: 'Asisten AI untuk analisis kode, perbaiki error, dan desain rangkaian.',
    thumbnail: '/assets/ter.png',
    thumbnailPosition: 'center top',
  },
  {
    icon: '📚',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    title: 'Learning Path',
    description: 'Jalur belajar terstruktur dari dasar hingga mahir — mulai dari elektronika, Arduino, hingga IoT.',
    thumbnail: '/assets/lp.jpg',
    thumbnailPosition: 'center top',
  },
  {
    icon: '🗂️',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
    title: 'Project Sample',
    description: 'Kumpulan project siap pakai sebagai referensi dan inspirasi untuk proyek IoT & Robotika Anda.',
    thumbnail: '/assets/home.jpg',
    thumbnailPosition: 'center top',
  },
]

export default function Home() {
  useEffect(() => {
    document.title = 'RoboLab Studio — All-in-One IDE for IoT & Robotics Education'
  }, [])

  // Feedback form state
  const [fbName, setFbName] = useState('')
  const [fbEmail, setFbEmail] = useState('')
  const [fbCategory, setFbCategory] = useState('Bug Report')
  const [fbMessage, setFbMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fbSent, setFbSent] = useState(false)
  const [fbError, setFbError] = useState<string | null>(null)

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fbMessage.trim()) return

    setIsSubmitting(true)
    setFbError(null)

    try {
      const response = await fetch('https://formsubmit.co/ajax/hamilulquranizayn@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          _subject: `[RoboLab Studio] ${fbCategory}: ${fbName || 'Pengguna'}`,
          Kategori: fbCategory,
          Nama: fbName || '(Anonim)',
          Email_Pengirim: fbEmail || '(Tidak disertakan)',
          Pesan: fbMessage,
          _template: 'table',
          _captcha: 'false',
        }),
      })

      if (!response.ok) {
        throw new Error('Gagal mengirim pesan. Silakan coba lagi.')
      }

      setFbSent(true)
      setFbName('')
      setFbEmail('')
      setFbMessage('')
    } catch (err: any) {
      console.error('Feedback submit error:', err)
      setFbError(err?.message || 'Terjadi kesalahan saat mengirim. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-50 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-violet-50 rounded-full opacity-40 blur-3xl" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="flex flex-col items-start">
              {/* Badge */}
              <div className="section-badge mb-4 sm:mb-6">
                <Star size={11} className="text-yellow-500 fill-yellow-400" />
                All-in-One IDE for IoT &amp; Robotics Education
              </div>

              {/* Headline */}
              <h1 className="font-display font-extrabold text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] text-[#0F172A] mb-4 sm:mb-5">
                Build. <span className="text-blue-accent">Simulate.</span><br />
                Code. <span className="text-purple-accent">Create.</span>
              </h1>

              {/* Sub-copy */}
              <p className="text-sm sm:text-base md:text-lg text-slate-500 leading-relaxed mb-6 sm:mb-8 max-w-lg">
                RoboLab Studio adalah platform pembelajaran dan development environment untuk Arduino, ESP32, ESP8266, Micro:Bit, Python, dan MicroPython. Belajar, simulasi, dan buat project robotika dengan mudah dalam satu workspace.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:mb-8 w-full sm:w-auto">
                <Link to="/download" className="btn-primary justify-center text-sm sm:text-base py-3 sm:py-3.5 px-6">
                  <Download size={16} />
                  Download RoboLab Studio
                </Link>
                <Link to="/docs/getting-started" className="btn-outline justify-center text-sm sm:text-base py-3 sm:py-3.5 px-6">
                  <BookOpen size={16} />
                  Explore Documentation
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                  Akses Gratis Sekarang
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap size={14} className="text-yellow-500 flex-shrink-0" />
                  Mudah digunakan
                </span>
                <span className="flex items-center gap-1.5">
                  <Monitor size={14} className="text-blue-500 flex-shrink-0" />
                  Cross Platform
                </span>
              </div>
            </div>

            {/* Right: Window Frame */}
            <div className="w-full lg:pl-4">
              <WindowFrame
                screenshot="/assets/h1.jpg"
                screenshotAlt="RoboLab Studio — Portal Pembelajaran Python & MicroPython"
                board="ESP32 DevKit V1"
                port="COM32"
                height={400}
                objectPosition="left top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Strip ───────────────────────────────────────────────── */}
      <section className="bg-[#F8FAFC] border-y border-slate-100 py-8 sm:py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <p className="text-center text-xs sm:text-sm font-medium text-slate-500 mb-5 sm:mb-7">
            Didukung oleh berbagai platform dan board populer
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
            {platforms.map(p => (
              <div key={p.name} className="platform-chip py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm">
                {p.icon ? (
                  <img src={p.icon} alt={p.name} className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: p.color }}>
                    {p.name[0]}
                  </div>
                )}
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Preview Grid ─────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 lg:py-24 bg-[#F8FAFC]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="section-badge">
              <Zap size={11} className="text-yellow-500 fill-yellow-400" />
              Fitur Utama
            </div>
            <h2 className="font-display font-extrabold text-[clamp(1.6rem,3.5vw,2.5rem)] text-[#0F172A] leading-tight mb-3">
              Everything You Need to Build Amazing Projects
            </h2>
            <p className="text-slate-500 text-sm sm:text-base max-w-xl">
              Semua fitur yang Anda butuhkan dalam satu workspace yang powerful dan mudah digunakan.
            </p>
          </div>

          {/* Grid 3 col desktop, 2 tablet, 1 mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-8">
            {previewFeatures.map(f => (
              <FeatureCard
                key={f.title}
                icon={f.icon}
                iconBg={f.iconBg}
                iconColor={f.iconColor}
                title={f.title}
                description={f.description}
                thumbnail={f.thumbnail}
                thumbnailPosition={f.thumbnailPosition}
                showChevron={false}
              />
            ))}
          </div>

          {/* See all link */}
          <div className="text-center">
            <Link to="/features"
              className="inline-flex items-center gap-2 text-[#1557B0] font-semibold text-xs sm:text-sm hover:gap-3 transition-all">
              Lihat Semua Fitur
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Feedback / Bug Report ────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8 sm:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold mb-4">
                <MessageCircle size={12} />
                Feedback &amp; Bug Report
              </div>
              <h2 className="font-display font-extrabold text-[clamp(1.5rem,3vw,2.2rem)] text-[#0F172A] leading-tight mb-3">
                Found a bug? Have a suggestion?
              </h2>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
                Kami sangat menghargai masukan Anda. Kirimkan laporan bug atau saran fitur langsung ke tim kami.
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-6 sm:p-8 shadow-sm">
              {fbSent ? (
                <div className="py-10 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                    <CheckCircle2 size={28} className="text-green-500" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0F172A]">Pesan Berhasil Terkirim!</h3>
                  <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                    Terima kasih atas masukan Anda. Laporan atau saran Anda telah langsung terkirim ke tim kami dan akan segera ditinjau.
                  </p>
                  <button
                    onClick={() => setFbSent(false)}
                    className="mt-2 text-xs font-semibold text-[#1557B0] hover:underline cursor-pointer"
                  >
                    Kirim masukan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4 sm:space-y-5">
                  {fbError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                      {fbError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Nama <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        value={fbName}
                        onChange={e => setFbName(e.target.value)}
                        placeholder="Nama Anda"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      />
                    </div>
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Email balasan <span className="text-slate-400 font-normal">(opsional)</span>
                      </label>
                      <input
                        type="email"
                        value={fbEmail}
                        onChange={e => setFbEmail(e.target.value)}
                        placeholder="email@contoh.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kategori</label>
                    <div className="flex flex-wrap gap-2">
                      {['Bug Report', 'Saran Fitur', 'Pertanyaan', 'Lainnya'].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFbCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                            fbCategory === cat
                              ? 'bg-[#1557B0] text-white border-[#1557B0] shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-[#1557B0] hover:text-[#1557B0]'
                          }`}
                        >
                          {cat === 'Bug Report' && <Bug size={11} className="inline mr-1 -mt-px" />}
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Pesan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={fbMessage}
                      onChange={e => setFbMessage(e.target.value)}
                      placeholder="Jelaskan bug yang ditemukan atau saran yang ingin Anda sampaikan..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex items-center justify-between gap-4 pt-1">
                    <p className="text-[11px] text-slate-400 leading-snug">
                      Pesan akan langsung terkirim secara instan ke tim pengembang RoboLab Studio.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary text-sm py-2.5 px-5 flex-shrink-0 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Kirim Masukan
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
