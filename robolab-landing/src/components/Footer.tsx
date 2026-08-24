import { Link } from 'react-router-dom'
import { Download, BookOpen } from 'lucide-react'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Documentation', to: '/docs/getting-started' },
  { label: 'Download', to: '/download' },
]

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-400 mt-0">
      {/* Top CTA Band */}
      <div className="border-b border-white/10 py-10 sm:py-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-display font-bold text-lg sm:text-xl text-white mb-1">
              Mulai Belajar IoT & Robotika Hari Ini
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">Akses gratis sekarang dan siap digunakan di Windows.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link to="/download" className="btn-primary text-xs sm:text-sm justify-center py-2.5 px-5">
              <Download size={14} />
              Download RoboLab Studio
            </Link>
            <Link to="/docs/getting-started" className="btn-ghost text-xs sm:text-sm border-white/20 text-slate-300 hover:border-white/40 hover:text-white justify-center py-2.5 px-5">
              <BookOpen size={14} />
              Lihat Dokumentasi
            </Link>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          {/* Brand */}
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2.5 mb-2.5 group">
              <img
                src="/assets/robolab-logo.png"
                alt="RoboLab Studio"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg shadow"
              />
              <div>
                <div className="font-display font-bold text-sm sm:text-base text-white">
                  <span className="text-[#60A5FA]">RoboLab</span> Studio
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">by Pymasterclass</div>
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Platform pembelajaran IoT & Robotika all-in-one untuk Arduino, ESP32, ESP8266, Micro:Bit, Python, dan MicroPython.
            </p>
          </div>

          {/* Navigation Links matching Topbar */}
          <nav className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.to}
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[11px] sm:text-xs text-slate-500">
            © {new Date().getFullYear()} RoboLab Studio × Pymasterclass. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
            <span className="text-[11px] sm:text-xs text-slate-400">RoboLab Studio Platform</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
