import { Home, FolderOpen, Layers, Monitor, BookOpen, Download, CheckSquare, Upload, Save, Play, HardDrive } from 'lucide-react'

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
    <div className="window-frame w-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
      {/* Title bar */}
      <div className="window-titlebar">
        <div className="flex gap-1.5 flex-shrink-0">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-xs text-slate-500 font-mono flex-1 text-center">robolab-studio</span>
      </div>

      {/* Toolbar */}
      <div className="window-toolbar">
        <img src="/assets/robolab-logo.png" alt="RoboLab" className="w-5 h-5 object-contain rounded" />
        <span className="text-xs font-semibold text-slate-700 mr-2">RoboLab Studio</span>

        <div className="flex items-center gap-0.5 flex-wrap">
          <button className="tb-btn">
            <FolderOpen size={11} /> Open
          </button>
          <button className="tb-btn">
            <Save size={11} /> Save
          </button>
          <button className="tb-btn verify">
            <CheckSquare size={11} /> Verify
          </button>
          <button className="tb-btn upload">
            <Upload size={11} /> Upload
          </button>
          <button className="tb-btn">
            <HardDrive size={11} /> Install Core
          </button>
          <button className="tb-btn run">
            <Play size={11} /> Run Python
          </button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0 flex-wrap justify-end">
          <span className="text-[10px] text-slate-500 font-medium">Student</span>
          <span className="badge badge-purple text-[10px] px-2 py-0.5">⚡ Pro</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">BOARD:</span>
            <span className="text-[10px] text-slate-700 font-medium">{board}</span>
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="text-slate-400">
              <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-semibold">PORT:</span>
            <span className="text-[10px] text-slate-700 font-medium">{port}</span>
          </div>
          <span className="badge-connected badge text-[10px] px-2 py-0.5 font-bold tracking-wide">CONNECTED</span>
        </div>
      </div>

      {/* Body: icon rail + content */}
      <div className="window-body" style={{ height: `calc(100% - 80px)` }}>
        {/* Icon Rail */}
        <div className="window-icon-rail">
          {[
            { Icon: Home, active: false },
            { Icon: FolderOpen, active: true },
            { Icon: Layers, active: false },
            { Icon: Monitor, active: false },
            { Icon: BookOpen, active: false },
            { Icon: Download, active: false },
          ].map(({ Icon, active }, i) => (
            <div key={i} className={`window-rail-icon ${active ? 'active' : ''}`}>
              <Icon size={15} />
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
