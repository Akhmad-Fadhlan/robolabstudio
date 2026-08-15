import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Features', to: '/features' },
  { label: 'Documentation', to: '/docs/getting-started' },
  { label: 'Download', to: '/download' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      } border-b border-slate-100`}
    >
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 lg:px-16">
        <div className="flex items-center h-16 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src="/assets/robolab-logo.png"
              alt="RoboLab Studio"
              className="w-9 h-9 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="font-display font-bold text-base leading-tight text-[#0F172A]">
                <span className="text-[#1557B0]">RoboLab</span> Studio
              </div>
              <div className="text-[10px] text-slate-400 leading-tight hidden sm:block">Build. Simulate. Code. Create.</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {navItems.map(item => (
              <Link
                key={item.label}
                to={item.to}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.to)
                    ? 'text-[#1557B0] bg-blue-50/80 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
                {isActive(item.to) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#1557B0] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            <Link to="/download" className="btn-primary text-sm px-4 py-2">
              <Download size={14} />
              Download Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden ml-auto w-9 h-9 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white pb-4 shadow-lg">
          <div className="max-w-[1440px] mx-auto px-5 pt-2">
            {navItems.map(item => (
              <Link
                key={item.label}
                to={item.to}
                className={`flex items-center justify-between py-3 text-sm border-b border-slate-50 last:border-0 ${
                  isActive(item.to) ? 'text-[#1557B0] font-semibold bg-blue-50/50 px-2 rounded-lg' : 'text-slate-700 px-2'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4">
              <Link to="/download" className="btn-primary text-sm w-full justify-center">
                <Download size={14} /> Download
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
