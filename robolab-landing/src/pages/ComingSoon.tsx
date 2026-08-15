import { Link } from 'react-router-dom'
import { Clock, Home, ArrowLeft } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-20 px-5">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1557B0] to-[#7C3AED] flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock size={36} className="text-white" />
          </div>
          <h1 className="font-display font-extrabold text-3xl text-[#0F172A] mb-3">Coming Soon</h1>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Halaman ini sedang dalam pengembangan dan akan segera tersedia. Sementara itu, Anda bisa mengeksplorasi fitur-fitur yang sudah ada.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary">
              <Home size={15} />
              Kembali ke Beranda
            </Link>
            <button onClick={() => window.history.back()} className="btn-outline">
              <ArrowLeft size={15} />
              Kembali
            </button>
          </div>
          <div className="mt-10 text-xs text-slate-400">
            Halaman yang tersedia: <Link to="/" className="text-[#1557B0] hover:underline">Home</Link> ·{' '}
            <Link to="/features" className="text-[#1557B0] hover:underline">Features</Link> ·{' '}
            <Link to="/docs/getting-started" className="text-[#1557B0] hover:underline">Getting Started</Link> ·{' '}
            <Link to="/download" className="text-[#1557B0] hover:underline">Download</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
