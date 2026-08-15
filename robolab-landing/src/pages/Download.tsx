import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download as DownloadIcon, Shield, RefreshCw, Rocket, Sparkles, Copy, Check,
  Home, ChevronRight, BookOpen, Settings, Play, CheckCircle2, Box,
  type LucideIcon
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WindowFrame from '../components/WindowFrame'
import StepCard from '../components/StepCard'
import { useLatestRelease } from '../hooks/useLatestRelease'

const highlights: { icon: LucideIcon; color: string; bg: string; label: string; desc: string }[] = [
  { icon: Shield, color: 'text-[#10B981]', bg: 'bg-green-50', label: 'Aman & Terverifikasi', desc: 'Semua file diverifikasi dan bebas virus' },
  { icon: RefreshCw, color: 'text-[#1557B0]', bg: 'bg-blue-50', label: 'Selalu Update', desc: 'Otomatis mendapatkan versi rilis terbaru' },
  { icon: Rocket, color: 'text-[#7C3AED]', bg: 'bg-purple-50', label: 'Mudah Diinstal', desc: 'Proses instalasi cepat dan siap digunakan' },
  { icon: Sparkles, color: 'text-[#F59E0B]', bg: 'bg-yellow-50', label: 'Akses Lengkap', desc: 'Nikmati seluruh fitur IDE, simulator & tools' },
]

const sysReqs = [
  'Windows 10 (64-bit) atau Windows 11',
  'RAM minimum 4 GB (disarankan 8 GB)',
  'Storage minimal 500 MB',
  'Resolusi layar 1366 × 768 atau lebih tinggi',
  'Koneksi internet (untuk instalasi core & library)',
]

const installSteps: { number: number; numberColor: string; Icon: LucideIcon; iconColor: string; title: string; description: string; isLast: boolean }[] = [
  {
    number: 1, numberColor: 'bg-[#1557B0]', Icon: DownloadIcon, iconColor: 'text-[#1557B0]',
    title: 'Unduh Installer',
    description: 'Klik tombol download untuk mengunduh installer RoboLab Studio terbaru.',
    isLast: false,
  },
  {
    number: 2, numberColor: 'bg-[#10B981]', Icon: Box, iconColor: 'text-[#10B981]',
    title: 'Jalankan Installer',
    description: 'Buka file installer (.exe) yang telah diunduh dari browser.',
    isLast: false,
  },
  {
    number: 3, numberColor: 'bg-[#F59E0B]', Icon: Settings, iconColor: 'text-[#F59E0B]',
    title: 'Ikuti Petunjuk',
    description: 'Ikuti wizard langkah instalasi dan tentukan direktori tujuan.',
    isLast: false,
  },
  {
    number: 4, numberColor: 'bg-[#7C3AED]', Icon: Check, iconColor: 'text-[#7C3AED]',
    title: 'Selesai',
    description: 'Tunggu proses pemasangan komponen selesai 100%.',
    isLast: false,
  },
  {
    number: 5, numberColor: 'bg-[#1557B0]', Icon: Play, iconColor: 'text-[#1557B0]',
    title: 'Buka RoboLab Studio',
    description: 'Jalankan RoboLab Studio dan mulailah berkreasi membuat project pertama!',
    isLast: true,
  },
]

const SHA256 = 'eddaf808d3e03f348d28ad93eeff2ced678633052d107fe220be56df37e90331'

export default function Download() {
  const [copied, setCopied] = useState(false)
  const { version, downloadUrl, releaseUrl, fileSize, releaseDate, fileName, triggerDownload } = useLatestRelease()

  useEffect(() => {
    document.title = `Download RoboLab Studio — Windows ${version}`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', `Download RoboLab Studio ${version} untuk Windows. Installer ${fileSize}, terverifikasi, akses gratis. Platform IoT & Robotika untuk Arduino, ESP32, ESP8266.`)
  }, [version, fileSize])

  const handleCopy = () => {
    navigator.clipboard.writeText(SHA256)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ─── Breadcrumb ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/" className="hover:text-[#1557B0] flex items-center gap-1 transition-colors">
              <Home size={13} /> Home
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#1557B0] font-medium">Download</span>
          </div>
        </div>
      </div>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-white pt-12 pb-16 border-b border-slate-100 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-50 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-50 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* Left */}
            <div>
              <div className="section-badge mb-5">
                <DownloadIcon size={11} />
                Official Release
              </div>
              <h1 className="font-display font-extrabold text-[clamp(2rem,4.5vw,3rem)] text-[#0F172A] leading-[1.1] mb-5">
                Download <span className="text-blue-accent">RoboLab Studio</span>
              </h1>
              <p className="text-slate-500 text-base leading-relaxed mb-8 max-w-lg">
                Unduh versi terbaru RoboLab Studio untuk Windows dan mulailah membangun project IoT, Robotika, dan Embedded System dengan mudah.
              </p>

              {/* 4 highlights 2x2 */}
              <div className="grid grid-cols-2 gap-4">
                {highlights.map(h => (
                  <div key={h.label} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${h.bg} flex items-center justify-center flex-shrink-0 ${h.color}`}>
                      <h.icon size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#0F172A]">{h.label}</div>
                      <div className="text-xs text-slate-500">{h.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Window Frame */}
            <div className="w-full">
              <WindowFrame
                screenshot="/assets/h1.jpg"
                screenshotAlt="RoboLab Studio — Visual Block + Code Editor + Serial Monitor"
                board="ESP32 DevKit V1"
                port="COM32"
                height={400}
                objectPosition="left top"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Download Card ────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16">
          <div className="download-card overflow-hidden">
            {/* Main row */}
            <div className="p-6 md:p-8 grid md:grid-cols-[auto_1fr_auto] gap-6 md:gap-8 items-start">
              {/* Platform info */}
              <div className="flex items-center gap-5 md:block">
                {/* Windows logo */}
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 md:mb-4 shadow-sm">
                  <svg viewBox="0 0 88 88" className="w-10 h-10 md:w-12 md:h-12" fill="none">
                    <path d="M4 12.4L38.8 8v30.8H4V12.4z" fill="#00ADEF"/>
                    <path d="M41.6 7.6L84 1.6v37.2H41.6V7.6z" fill="#00ADEF"/>
                    <path d="M4 41.6h34.8V72L4 67.2V41.6z" fill="#00ADEF"/>
                    <path d="M41.6 41.6H84V80l-42.4-6V41.6z" fill="#00ADEF"/>
                  </svg>
                </div>
                <div>
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold mb-2">
                    Rekomendasi
                  </div>
                  <h2 className="font-display font-bold text-2xl text-[#0F172A]">Windows</h2>
                  <p className="text-sm text-slate-500">Windows 10 / 11 (64-bit)</p>
                </div>
              </div>

              {/* Download action center */}
              <div className="min-w-0">
                {/* Meta stats from GitHub Release */}
                <div className="flex flex-wrap gap-6 mb-5">
                  <div className="flex items-center gap-2">
                    <DownloadIcon size={14} className="text-[#1557B0]" />
                    <div>
                      <div className="text-xs text-slate-500">Versi Terbaru</div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0F172A] text-sm">{version}</span>
                        <span className="badge badge-blue text-[10px]">Latest Release</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Box size={14} className="text-[#1557B0]" />
                    <div>
                      <div className="text-xs text-slate-500">Ukuran File</div>
                      <div className="font-bold text-[#0F172A] text-sm">{fileSize}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-[#1557B0]" />
                    <div>
                      <div className="text-xs text-slate-500">Tanggal Rilis</div>
                      <div className="font-bold text-[#0F172A] text-sm">{releaseDate}</div>
                    </div>
                  </div>
                </div>

                {/* Direct Download button to GitHub Release exe */}
                <a
                  href={downloadUrl}
                  download={fileName}
                  className="btn-primary w-full justify-center py-3.5 text-base mb-3 shadow-md hover:shadow-lg transition-all"
                >
                  <DownloadIcon size={18} />
                  Download for Windows ({version})
                </a>


                {/* Description */}
                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                  Paket installer resmi untuk Windows. Dilengkapi compiler, library manager, serial monitor, dan simulator terintegrasi.
                </p>
              </div>

              {/* System Requirements */}
              <div className="md:w-56 flex-shrink-0 bg-[#F8FAFC] rounded-xl p-5 border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <Settings size={14} className="text-[#1557B0]" />
                  <h3 className="font-display font-bold text-sm text-[#0F172A]">System Requirements</h3>
                </div>
                <ul className="space-y-2.5">
                  {sysReqs.map(req => (
                    <li key={req} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                      <CheckCircle2 size={13} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Checksum bar */}
            <div className="checksum-bar">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 flex-shrink-0">SHA256 Checksum</span>
                <span className="font-mono text-xs text-slate-700 truncate">{SHA256}</span>
                <button onClick={handleCopy}
                  className="flex-shrink-0 w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all"
                  title="Salin Checksum"
                >
                  {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-slate-500">Digital Signature</span>
                <span className="badge badge-green">
                  <Check size={9} className="text-green-700" /> Verified
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs text-slate-500">Virus Total</span>
                <span className="badge badge-green">
                  <Check size={9} className="text-green-700" /> Clean
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Cara Instalasi ───────────────────────────────────────────────── */}
      <section className="pb-16">
        <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16">
          <h2 className="font-display font-bold text-2xl text-[#0F172A] mb-2">Cara Instalasi</h2>
          <p className="text-slate-500 text-sm mb-7">Ikuti langkah-langkah berikut untuk menginstal RoboLab Studio di komputer Anda.</p>

          {/* Steps */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-2 md:gap-0 mb-8">
            {installSteps.map(step => (
              <StepCard key={step.number} {...step} />
            ))}
          </div>

          {/* Full guide link */}
          <div className="text-center">
            <Link to="/docs/getting-started"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-[#1557B0] hover:bg-blue-50 hover:border-blue-200 transition-all shadow-card">
              <BookOpen size={15} />
              Lihat Panduan Getting Started →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
