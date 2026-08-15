import { ChevronRight } from 'lucide-react'
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
  linkTo = '/features',
  className = '',
}: FeatureCardProps) {
  return (
    <div className={`card p-5 flex flex-col gap-3 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        {showChevron && (
          <Link to={linkTo}
            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-[#1557B0] transition-all">
            <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Text */}
      <div>
        <h3 className="font-display font-semibold text-[#0F172A] text-base leading-snug mb-1">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{description}</p>
      </div>

      {/* Thumbnail */}
      <div className="rounded-xl overflow-hidden border border-slate-100 mt-auto bg-slate-50" style={{ height: '140px' }}>
        <img
          src={thumbnail}
          alt={thumbnailAlt || title}
          className="w-full h-full object-cover"
          style={{ objectPosition: thumbnailPosition }}
          loading="lazy"
        />
      </div>
    </div>
  )
}
