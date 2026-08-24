import { LucideIcon } from 'lucide-react'

interface StepCardProps {
  number: number
  numberColor: string       // tailwind bg class e.g. "bg-blue-500"
  numberTextColor?: string  // tailwind text class, defaults to white
  Icon: LucideIcon
  iconColor: string         // tailwind text class
  title: string
  description: string
  isLast?: boolean
}

export default function StepCard({
  number,
  numberColor,
  numberTextColor = 'text-white',
  Icon,
  iconColor,
  title,
  description,
  isLast = false,
}: StepCardProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-0 flex-1 min-w-0">
      {/* Card */}
      <div className="card p-4 sm:p-5 flex flex-col gap-3 flex-1 min-w-0">
        {/* Number badge */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${numberColor} ${numberTextColor} shadow-sm`}>
            {number}
          </div>
          <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0 ${iconColor} border border-slate-100`}>
            <Icon size={18} />
          </div>
        </div>

        {/* Text */}
        <div>
          <h4 className="font-display font-semibold text-[#0F172A] text-sm leading-snug mb-1">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Connector arrow (horizontal desktop) */}
      {!isLast && (
        <div className="hidden md:flex items-center flex-shrink-0 w-8 justify-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="step-connector w-6" />
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1 4h5M4 1.5L6.5 4 4 6.5" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
