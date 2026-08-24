import { useState, useEffect } from 'react'
import { ChevronRight, Maximize2, X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface FeatureCardProps {
  icon: string               // emoji or single char
  iconBg: string             // tailwind bg class e.g. "bg-blue-100"
  iconColor: string          // tailwind text class e.g. "text-blue-600"
  title: string
  description: string
  thumbnail: string          // image src
  thumbnailAlt?: string
  thumbnailPosition?: string // object-position CSS value
  showChevron?: boolean
  linkTo?: string
  className?: string
}

export default function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  thumbnail,
  thumbnailAlt,
  thumbnailPosition = 'top left',
  showChevron = false,
  linkTo = '/docs/getting-started',
  className = '',
}: FeatureCardProps) {
  const [modalOpen, setModalOpen] = useState(false)

  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!modalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false)
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen])

  return (
    <>
      <div className={`card p-4 sm:p-5 flex flex-col gap-3 transition-all hover:shadow-lg ${className}`}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${iconBg} shadow-sm`}>
            <span className={iconColor}>{icon}</span>
          </div>
          {showChevron && (
            <Link
              to={linkTo}
              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-[#1557B0] transition-all"
              title="Lihat panduan"
            >
              <ChevronRight size={14} />
            </Link>
          )}
        </div>

        {/* Text */}
        <div>
          <h3 className="font-display font-semibold text-[#0F172A] text-base leading-snug mb-1">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-2">{description}</p>
        </div>

        {/* Thumbnail - Clickable with hover overlay */}
        <div
          onClick={() => setModalOpen(true)}
          className="group/img relative rounded-xl overflow-hidden border border-slate-100 mt-auto bg-slate-50 cursor-pointer shadow-sm"
          style={{ height: '150px' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setModalOpen(true) }}
          aria-label={`Buka gambar ${title}`}
        >
          <img
            src={thumbnail}
            alt={thumbnailAlt || title}
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
            style={{ objectPosition: thumbnailPosition }}
            loading="lazy"
          />

          {/* Hover Overlay with Zoom Icon */}
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1.5 text-white text-xs font-semibold backdrop-blur-[2px]">
            <Maximize2 size={16} />
            <span>Klik untuk memperbesar</span>
          </div>
        </div>
      </div>

      {/* ─── Modal Popup Lightbox ───────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${iconBg}`}>
                  <span className={iconColor}>{icon}</span>
                </div>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-[#0F172A] leading-tight">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 hidden sm:block">Preview Tampilan RoboLab Studio</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-200/70 hover:bg-red-50 hover:text-red-600 text-slate-600 flex items-center justify-center transition-all"
                aria-label="Tutup popup"
                title="Tutup (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="p-3 sm:p-5 overflow-auto flex-1 flex flex-col items-center justify-center bg-slate-900/5">
              <img
                src={thumbnail}
                alt={thumbnailAlt || title}
                className="w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-slate-200/80 bg-white"
              />
              <p className="text-xs sm:text-sm text-slate-600 text-center mt-3 sm:mt-4 max-w-2xl px-2 leading-relaxed">
                {description}
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="btn-primary text-xs sm:text-sm px-4 py-2"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
