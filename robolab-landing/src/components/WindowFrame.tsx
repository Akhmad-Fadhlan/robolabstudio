import { Home, FolderOpen, Layers, Monitor, BookOpen, Download, CheckSquare, Upload, Save, Play } from 'lucide-react'

interface WindowFrameProps {
  screenshot: string
  screenshotAlt?: string
  board?: string
  port?: string
  height?: string | number
  objectPosition?: string
}

export default function WindowFrame({
  screenshot,
  screenshotAlt = 'RoboLab Studio App Screenshot',
  board = 'ESP32 DevKit V1',
  port = 'COM32',
  height = 420,
  objectPosition = 'top left',
}: WindowFrameProps) {
  return (
    <div
      className="window-frame w-full transition-all"
      style={{ minHeight: '260px', height: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* Title bar */}
      <div className="window-titlebar px-3 py-2 flex items-center justify-between">
        <div className="flex gap-1.5 flex-shrink-0">
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-[11px] sm:text-xs text-slate-500 font-mono flex-1 text-center truncate px-2">
          robolab-studio
        </span>
        <span className="w-8 sm:w-16"></span>
      </div>

      {/* Toolbar */}
      <div className="window-toolbar px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <img src="/assets/robolab-logo.png" alt="RoboLab" className="w-4 h-4 sm:w-5 sm:h-5 object-contain rounded" />
          <span className="text-xs font-semibold text-slate-700 hidden sm:inline">RoboLab</span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 overflow-x-auto">
          <button className="tb-btn text-[10px] sm:text-xs py-1 px-1.5 sm:px-2">
            <FolderOpen size={11} /> <span className="hidden sm:inline">Open</span>
          </button>
          <button className="tb-btn text-[10px] sm:text-xs py-1 px-1.5 sm:px-2">
            <Save size={11} /> <span className="hidden sm:inline">Save</span>
          </button>
          <button className="tb-btn verify text-[10px] sm:text-xs py-1 px-1.5 sm:px-2">
            <CheckSquare size={11} /> Verify
          </button>
          <button className="tb-btn upload text-[10px] sm:text-xs py-1 px-1.5 sm:px-2">
            <Upload size={11} /> Upload
          </button>
          <button className="tb-btn run text-[10px] sm:text-xs py-1 px-1.5 sm:px-2 hidden sm:inline-flex">
            <Play size={11} /> Run
          </button>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="hidden lg:flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">BOARD:</span>
            <span className="text-[10px] text-slate-700 font-medium">{board}</span>
          </div>
          <span className="badge-connected badge text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 font-bold tracking-wide">
            CONNECTED
          </span>
        </div>
      </div>

      {/* Body: icon rail + content */}
      <div className="window-body" style={{ height: `calc(100% - 75px)` }}>
        {/* Icon Rail */}
        <div className="window-icon-rail w-9 sm:w-11">
          {[
            { Icon: Home, active: false },
            { Icon: FolderOpen, active: true },
            { Icon: Layers, active: false },
            { Icon: Monitor, active: false },
            { Icon: BookOpen, active: false },
            { Icon: Download, active: false },
          ].map(({ Icon, active }, i) => (
            <div key={i} className={`window-rail-icon w-7 h-7 sm:w-8 sm:h-8 ${active ? 'active' : ''}`}>
              <Icon size={13} />
            </div>
          ))}
        </div>

        {/* Screenshot content */}
        <div className="window-content">
          <img
            src={screenshot}
            alt={screenshotAlt}
            className="window-screenshot"
            style={{ objectPosition }}
            loading="eager"
          />
        </div>
      </div>
    </div>
  )
}
