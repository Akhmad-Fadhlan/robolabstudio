import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  Terminal,
  Download,
  FolderArchive,
  RefreshCw,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export interface CompilerBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isChecking: boolean;
  onCheckStatus: () => void;
  themeMode?: string;
  themeColor?: string;
}

type OSType = 'windows' | 'macos' | 'linux';

// Clean official Microsoft Windows 4-pane vector logo
const WindowsLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => (
  <svg viewBox="0 0 88 88" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#00adef" d="M0 12.402l35.689-4.86.016 34.423-35.67.203zm35.67 33.529l.026 34.453-35.67-4.901-.026-29.576zm4.326-39.027l47.989-6.904v41.986l-47.989.373zm47.989 39.569v41.947l-47.989-6.756v-35.253z" />
  </svg>
);

// Clean official Apple vector logo (high-contrast: black in light mode, white in dark mode)
const AppleLogo: React.FC<{ className?: string; isLight?: boolean }> = ({ className = 'w-7 h-7', isLight = false }) => (
  <svg viewBox="0 0 170 170" className={className} fill={isLight ? '#0f172a' : '#ffffff'} xmlns="http://www.w3.org/2000/svg">
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.74 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.79-11.72-14.24-6.3-9.76-11.2-20.94-14.71-33.55-3.51-12.61-5.26-24.3-5.26-35.08 0-14.44 3.63-26.4 10.88-35.88 7.26-9.48 16.29-14.35 27.08-14.61 5.18 0 11.14 1.48 17.86 4.43 6.73 2.94 11.01 4.47 12.85 4.58 1.5 0 6.05-1.64 13.64-4.93 7.59-3.29 13.79-4.7 18.6-4.22 13.71.74 24.39 5.86 32.05 15.37-12.04 7.28-17.96 17.29-17.74 30.04.22 10.05 4.09 18.52 11.61 25.42 7.53 6.9 16.48 10.78 26.85 11.63-2.19 6.5-4.66 12.68-7.41 18.54zm-30.82-108.57c0 6.38-2.34 12.43-7.03 18.15-4.68 5.72-10.42 9.5-17.22 11.35-.38-1.52-.57-3.05-.57-4.57 0-6.14 2.4-12.24 7.19-18.3 4.8-6.06 10.71-9.79 17.74-11.19.11 1.53.17 3.05.17 4.56z" />
  </svg>
);

// Authentic official Linux Tux Penguin logo
const LinuxTuxLogo: React.FC<{ className?: string }> = ({ className = 'w-7 h-7' }) => {
  const [imgError, setImgError] = useState(false);
  if (!imgError) {
    return (
      <img
        src="/tux.svg"
        alt="Linux Tux"
        className={`${className} object-contain`}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <svg viewBox="0 0 340 395" className={className} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="105" cy="355" rx="60" ry="24" fill="#f59e0b" />
      <ellipse cx="235" cy="355" rx="60" ry="24" fill="#f59e0b" />
      <path d="M55 358 C70 375, 135 375, 150 358 Z" fill="#d97706" />
      <path d="M190 358 C205 375, 270 375, 285 358 Z" fill="#d97706" />
      <path d="M170 30 C120 30, 95 65, 95 125 C95 160, 65 210, 45 270 C25 330, 60 360, 100 360 C130 360, 210 360, 240 360 C280 360, 315 330, 295 270 C275 210, 245 160, 245 125 C245 65, 220 30, 170 30 Z" fill="#111827" />
      <ellipse cx="65" cy="240" rx="26" ry="58" transform="rotate(-18 65 240)" fill="#111827" />
      <ellipse cx="275" cy="240" rx="26" ry="58" transform="rotate(18 275 240)" fill="#111827" />
      <path d="M170 145 C125 145, 100 185, 100 250 C100 308, 125 348, 170 348 C215 348, 240 308, 240 250 C240 185, 215 145, 170 145 Z" fill="#ffffff" />
      <ellipse cx="148" cy="85" rx="14" ry="20" fill="#ffffff" />
      <ellipse cx="192" cy="85" rx="14" ry="20" fill="#ffffff" />
      <ellipse cx="152" cy="88" rx="6" ry="9" fill="#111827" />
      <ellipse cx="188" cy="88" rx="6" ry="9" fill="#111827" />
      <circle cx="154" cy="85" r="2.5" fill="#ffffff" />
      <circle cx="190" cy="85" r="2.5" fill="#ffffff" />
      <path d="M140 108 C155 100, 185 100, 200 108 C210 120, 185 138, 170 138 C155 138, 130 120, 140 108 Z" fill="#f59e0b" />
    </svg>
  );
};

export const CompilerBridgeModal: React.FC<CompilerBridgeModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isChecking,
  onCheckStatus,
  themeMode = 'dark',
}) => {
  const isLight = themeMode === 'light';
  const [detectedOS, setDetectedOS] = useState<OSType>('windows');
  const [terminalTab, setTerminalTab] = useState<'macos' | 'linux'>('macos');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  // Auto-detect user OS
  useEffect(() => {
    const userAgent = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    if (/Mac|iPhone|iPod|iPad/i.test(userAgent) || /Mac/i.test(platform)) {
      setDetectedOS('macos');
      setTerminalTab('macos');
    } else if (/Linux/i.test(userAgent) || /Linux/i.test(platform)) {
      setDetectedOS('linux');
      setTerminalTab('linux');
    } else {
      setDetectedOS('windows');
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const macTerminalCmd = `curl -fsSL https://robolabstudio.vercel.app/downloads/RoboLab-Compiler-Bridge-macOS.zip -o robolab-bridge.zip && unzip -q -o robolab-bridge.zip -d ~/RoboLabBridge && cd ~/RoboLabBridge && bash start-bridge.sh`;
  const linuxTerminalCmd = `mkdir -p ~/RoboLabBridge && curl -fsSL https://robolabstudio.vercel.app/downloads/RoboLab-Compiler-Bridge-Linux.tar.gz | tar -xz -C ~/RoboLabBridge && cd ~/RoboLabBridge && bash start-bridge.sh`;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[99999] p-3 sm:p-5 select-none ${
        isLight ? 'bg-slate-900/35 backdrop-blur-sm' : 'bg-black/75 backdrop-blur-sm'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-4xl rounded-2xl flex flex-col shadow-2xl relative overflow-hidden max-h-[92vh] border transition-colors ${
          isLight
            ? 'bg-white text-slate-900 border-slate-200'
            : 'bg-[#0f111a] text-slate-100 border-white/10'
        }`}
      >
        {/* ── Modal Header (Clean & Minimal: No Subtitle, No AI Badges) ── */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight ? 'border-slate-200 bg-slate-50/70' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Cpu className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`} />
            <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              RoboLab Compiler Bridge
            </h3>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isLight
                ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Status Bar */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
              isOnline
                ? isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : isLight
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isOnline ? 'Bridge Aktif (Port 3001)' : 'Bridge Belum Aktif'}
                </div>
                <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isOnline
                    ? 'RoboLab Web terhubung dengan compiler lokal di komputer Anda.'
                    : 'Nyalakan compiler bridge di komputer Anda untuk mengaktifkan kompilasi native lokal.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isChecking}
              onClick={onCheckStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa…' : 'Cek Status'}</span>
            </button>
          </div>

          {/* ── 3 OS CARDS (Unified Clean Design) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. WINDOWS CARD */}
            <div
              className={`rounded-xl p-5 border flex flex-col justify-between transition-all relative ${
                detectedOS === 'windows'
                  ? isLight
                    ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white/[0.05] border-blue-400/80 ring-2 ring-blue-500/20 shadow-md'
                  : isLight
                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              {detectedOS === 'windows' && (
                <div
                  className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  Sistem Anda
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                  }`}>
                    <WindowsLogo className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Windows</h5>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Windows 10 / 11 (64-bit)</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs py-2">
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Installer otomatis 1-klik (.exe)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Driver USB CH340 &amp; CP2102</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Pintasan Desktop &amp; System Tray</span>
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Setup.exe"
                  download="RoboLab-Compiler-Bridge-Setup.exe"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Installer (.exe)</span>
                  <span className="text-[10px] opacity-80">~27 MB</span>
                </a>

                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Windows.zip"
                  download="RoboLab-Compiler-Bridge-Windows.zip"
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Portable ZIP (.zip)</span>
                </a>
              </div>
            </div>

            {/* 2. MACOS CARD */}
            <div
              className={`rounded-xl p-5 border flex flex-col justify-between transition-all relative ${
                detectedOS === 'macos'
                  ? isLight
                    ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white/[0.05] border-blue-400/80 ring-2 ring-blue-500/20 shadow-md'
                  : isLight
                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              {detectedOS === 'macos' && (
                <div
                  className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  Sistem Anda
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                  }`}>
                    <AppleLogo className="w-6 h-6" isLight={isLight} />
                  </div>
                  <div>
                    <h5 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>macOS</h5>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Apple Silicon &amp; Intel Mac</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs py-2">
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>M1, M2, M3, M4 &amp; Mac Intel</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Klik ganda start-bridge.command</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Plug &amp; Play tanpa driver</span>
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-macOS.zip"
                  download="RoboLab-Compiler-Bridge-macOS.zip"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Package macOS (.zip)</span>
                  <span className="text-[10px] opacity-80">~9.5 MB</span>
                </a>

                <button
                  type="button"
                  onClick={() => setTerminalTab('macos')}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Lihat Perintah Terminal</span>
                </button>
              </div>
            </div>

            {/* 3. LINUX CARD (With Authentic Tux Logo) */}
            <div
              className={`rounded-xl p-5 border flex flex-col justify-between transition-all relative ${
                detectedOS === 'linux'
                  ? isLight
                    ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'bg-white/[0.05] border-blue-400/80 ring-2 ring-blue-500/20 shadow-md'
                  : isLight
                  ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              {detectedOS === 'linux' && (
                <div
                  className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isLight
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  }`}
                >
                  Sistem Anda
                </div>
              )}

              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
                  }`}>
                    <LinuxTuxLogo className="w-7 h-7" />
                  </div>
                  <div>
                    <h5 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>Linux</h5>
                    <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Ubuntu, Debian, Fedora, Arch</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs py-2">
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Dukungan x86_64, aarch64 &amp; ARM</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Script izin port USB (dialout)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Launcher menu aplikasi (.desktop)</span>
                  </div>
                </div>
              </div>

              <div className={`space-y-2 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Linux.tar.gz"
                  download="RoboLab-Compiler-Bridge-Linux.tar.gz"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition cursor-pointer text-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Package Linux (.tar.gz)</span>
                  <span className="text-[10px] opacity-80">~8.5 MB</span>
                </a>

                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Linux.zip"
                  download="RoboLab-Compiler-Bridge-Linux.zip"
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>ZIP Package (.zip)</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── Terminal Commands (Clean & High Contrast) ── */}
          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/40'
            }`}
          >
            <div className={`flex items-center justify-between px-4 py-2 border-b ${
              isLight ? 'border-slate-200 bg-slate-100/80' : 'border-white/5 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2">
                <Terminal className={`w-3.5 h-3.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`} />
                <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Instalasi via Terminal
                </span>
              </div>

              {/* Tab Selector macOS / Linux */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTerminalTab('macos')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    terminalTab === 'macos'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'bg-white/15 text-white'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  macOS
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalTab('linux')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                    terminalTab === 'linux'
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'bg-white/15 text-white'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Linux
                </button>
              </div>
            </div>

            <div className="p-3">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {terminalTab === 'macos' ? 'Jalankan di Terminal macOS:' : 'Jalankan di Terminal Linux:'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(terminalTab === 'macos' ? macTerminalCmd : linuxTerminalCmd, terminalTab)}
                  className={`flex items-center gap-1 font-semibold transition cursor-pointer ${
                    isLight ? 'text-blue-600 hover:text-blue-700' : 'text-blue-400 hover:text-blue-300'
                  }`}
                >
                  {copiedCmd === terminalTab ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd === terminalTab ? 'Tersalin' : 'Salin Perintah'}</span>
                </button>
              </div>

              <div className={`p-2.5 rounded-lg font-mono text-[11px] overflow-x-auto border ${
                isLight
                  ? 'bg-slate-900 text-slate-100 border-slate-800'
                  : 'bg-black/70 text-slate-200 border-white/5'
              }`}>
                <code>{terminalTab === 'macos' ? macTerminalCmd : linuxTerminalCmd}</code>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer (Clean: Just Tutup button) ── */}
        <div
          className={`flex justify-end px-6 py-3 border-t ${
            isLight ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
