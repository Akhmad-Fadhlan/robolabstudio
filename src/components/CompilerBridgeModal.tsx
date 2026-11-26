import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Copy,
  Terminal,
  Download,
  FolderArchive,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export interface CompilerBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnline: boolean;
  isChecking: boolean;
  onCheckStatus: () => void;
  themeMode?: string;
}

type OSType = 'windows' | 'macos' | 'linux';

export const CompilerBridgeModal: React.FC<CompilerBridgeModalProps> = ({
  isOpen,
  onClose,
  isOnline,
  isChecking,
  onCheckStatus,
  themeMode = 'dark',
}) => {
  const isDark = themeMode !== 'light';
  const [detectedOS, setDetectedOS] = useState<OSType>('windows');
  const [activeTab, setActiveTab] = useState<OSType>('windows');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showTerminalGuide, setShowTerminalGuide] = useState(false);

  // Detect user OS on mount
  useEffect(() => {
    const userAgent = window.navigator.userAgent || '';
    const platform = window.navigator.platform || '';
    if (/Mac|iPhone|iPod|iPad/i.test(userAgent) || /Mac/i.test(platform)) {
      setDetectedOS('macos');
      setActiveTab('macos');
    } else if (/Linux/i.test(userAgent) || /Linux/i.test(platform)) {
      setDetectedOS('linux');
      setActiveTab('linux');
    } else {
      setDetectedOS('windows');
      setActiveTab('windows');
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
        isDark ? 'bg-black/75 backdrop-blur-md' : 'bg-slate-900/35 backdrop-blur-md'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-4xl rounded-3xl flex flex-col shadow-2xl relative overflow-hidden max-h-[92vh] border transition-all ${
          isDark
            ? 'bg-[#0e111a]/95 text-slate-100 border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
            : 'bg-white text-slate-800 border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)]'
        }`}
      >
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Modal Header ── */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b relative z-10 ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  RoboLab Compiler Bridge
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-sm">
                  v1.0 Multiplatform
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Kompilasi native C++ (Blynk IoT, ESP8266, ESP32, Arduino) 100% lokal di komputer Anda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-white/10'
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 relative z-10 custom-scrollbar">
          {/* Status Bar */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isOnline
                ? isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <span
                  className={`block w-3.5 h-3.5 rounded-full ${
                    isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-amber-500 shadow-lg shadow-amber-500/50'
                  }`}
                />
                {isOnline && (
                  <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {isOnline ? 'Compiler Bridge Aktif (Port 3001)' : 'Compiler Bridge Belum Terhubung'}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {isOnline ? 'SIAP PAKAI' : 'STANDBY'}
                  </span>
                </div>
                <p className="text-xs opacity-85 mt-0.5">
                  {isOnline
                    ? 'RoboLab Web terhubung ke compiler lokal. Kompilasi & upload Blynk IoT & ESP berjalan dengan performa native penuh.'
                    : 'Pilih compiler untuk sistem operasi Anda di bawah dan jalankan. RoboLab Web akan otomatis mendeteksi koneksi.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isChecking}
              onClick={onCheckStatus}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-sm ${
                isOnline
                  ? isDark
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                    : 'bg-emerald-200/60 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : isDark
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  : 'bg-amber-200/60 hover:bg-amber-200 text-amber-900 border border-amber-300'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Memeriksa…' : 'Cek Status'}</span>
            </button>
          </div>

          {/* Title OS Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div>
              <h4 className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span>Pilih Compiler Sesuai Perangkat Anda</span>
                <span className="text-xs font-normal text-slate-400">
                  (Gratis &amp; Otomatis Terhubung)
                </span>
              </h4>
            </div>

            {/* Quick OS Tabs for Mobile/Switching */}
            <div
              className={`flex p-1 rounded-xl border text-xs font-bold ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab('windows')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'windows'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🪟 Windows</span>
                {detectedOS === 'windows' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('macos')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'macos'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🍎 macOS</span>
                {detectedOS === 'macos' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('linux')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'linux'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🐧 Linux</span>
                {detectedOS === 'linux' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* ── 3 STYLISH OS CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. WINDOWS CARD */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 relative group ${
                activeTab === 'windows'
                  ? 'ring-2 ring-blue-500/60 shadow-xl shadow-blue-500/10'
                  : 'opacity-90 hover:opacity-100'
              } ${
                isDark
                  ? 'bg-gradient-to-b from-blue-950/20 to-slate-900/60 border-blue-500/25 hover:border-blue-400/50'
                  : 'bg-gradient-to-b from-blue-50/70 to-white border-blue-200 hover:border-blue-300'
              }`}
            >
              {detectedOS === 'windows' && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-[10px] font-extrabold text-white flex items-center gap-1 shadow-md shadow-blue-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Sistem Anda</span>
                </div>
              )}

              <div>
                {/* OS Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                    {/* Windows Logo Icon */}
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base">Windows</h5>
                    <p className="text-xs text-slate-400 font-medium">Windows 10 / 11 (64-bit)</p>
                  </div>
                </div>

                {/* Features & Badges */}
                <div className="space-y-2 text-xs py-2">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Installer otomatis 1-klik (.exe)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Driver USB CH340 &amp; CP2102 otomatis</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Pintasan Desktop &amp; System Tray</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-700/20">
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Setup.exe"
                  download="RoboLab-Compiler-Bridge-Setup.exe"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Installer (.exe)</span>
                  <span className="text-[10px] opacity-80 font-normal">~27 MB</span>
                </a>

                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Windows.zip"
                  download="RoboLab-Compiler-Bridge-Windows.zip"
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Portable ZIP (.zip)</span>
                </a>
              </div>
            </div>

            {/* 2. MACOS CARD */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 relative group ${
                activeTab === 'macos'
                  ? 'ring-2 ring-purple-500/60 shadow-xl shadow-purple-500/10'
                  : 'opacity-90 hover:opacity-100'
              } ${
                isDark
                  ? 'bg-gradient-to-b from-purple-950/20 to-slate-900/60 border-purple-500/25 hover:border-purple-400/50'
                  : 'bg-gradient-to-b from-purple-50/70 to-white border-purple-200 hover:border-purple-300'
              }`}
            >
              {detectedOS === 'macos' && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-[10px] font-extrabold text-white flex items-center gap-1 shadow-md shadow-purple-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Sistem Anda</span>
                </div>
              )}

              <div>
                {/* OS Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0 border border-white/10">
                    {/* Apple Logo Icon */}
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.15c.61-.74 1.04-1.76.92-2.78-.9.04-2.01.6-2.65 1.34-.56.64-1.06 1.68-.93 2.69.99.08 2.05-.51 2.66-1.25" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base">macOS</h5>
                    <p className="text-xs text-slate-400 font-medium">Apple Silicon &amp; Intel</p>
                  </div>
                </div>

                {/* Features & Badges */}
                <div className="space-y-2 text-xs py-2">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>M1, M2, M3, M4 &amp; Mac Intel</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Klik ganda start-bridge.command di Finder</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Tanpa driver tambahan (Plug &amp; Play)</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-700/20">
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-macOS.zip"
                  download="RoboLab-Compiler-Bridge-macOS.zip"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Package macOS (.zip)</span>
                  <span className="text-[10px] opacity-80 font-normal">~2.5 MB</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowTerminalGuide(!showTerminalGuide)}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-purple-400" />
                  <span>Panduan Terminal 1-Baris</span>
                </button>
              </div>
            </div>

            {/* 3. LINUX CARD */}
            <div
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 relative group ${
                activeTab === 'linux'
                  ? 'ring-2 ring-emerald-500/60 shadow-xl shadow-emerald-500/10'
                  : 'opacity-90 hover:opacity-100'
              } ${
                isDark
                  ? 'bg-gradient-to-b from-emerald-950/20 to-slate-900/60 border-emerald-500/25 hover:border-emerald-400/50'
                  : 'bg-gradient-to-b from-emerald-50/70 to-white border-emerald-200 hover:border-emerald-300'
              }`}
            >
              {detectedOS === 'linux' && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-[10px] font-extrabold text-white flex items-center gap-1 shadow-md shadow-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  <span>Sistem Anda</span>
                </div>
              )}

              <div>
                {/* OS Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 via-orange-600 to-yellow-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                    {/* Linux Tux Icon */}
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                      <path d="M12.001 2c-2.76 0-4.5 2.1-4.5 4.7 0 1.5.6 2.9 1.5 3.9-.2.5-.5 1.1-.9 1.7-.8 1.1-1.8 2.2-2.1 3.7-.3 1.4-.1 3 .6 4.3.7 1.3 2 2.3 3.5 2.7 1.2.3 2.5.3 3.8.1 1.3-.2 2.5-.7 3.5-1.5 1-0.8 1.8-1.9 2-3.1.2-1.3 0-2.6-.6-3.8-.4-.9-.9-1.7-1.4-2.5.7-.9 1.1-2 1.1-3.3 0-2.6-1.74-4.7-4.5-4.7zm0 2c1.7 0 2.5 1.4 2.5 2.7 0 .8-.3 1.5-.8 2.1-.5.6-1.1.9-1.7.9s-1.2-.3-1.7-.9c-.5-.6-.8-1.3-.8-2.1 0-1.3.8-2.7 2.5-2.7z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base">Linux</h5>
                    <p className="text-xs text-slate-400 font-medium">Ubuntu, Debian, Fedora, Arch</p>
                  </div>
                </div>

                {/* Features & Badges */}
                <div className="space-y-2 text-xs py-2">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Dukungan x86_64, aarch64 &amp; Raspberry Pi</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Auto-setup izin serial USB (dialout)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Ultra-ringan, konsumsi RAM &lt;20MB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-700/20">
                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Linux.tar.gz"
                  download="RoboLab-Compiler-Bridge-Linux.tar.gz"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5 cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Package Linux (.tar.gz)</span>
                  <span className="text-[10px] opacity-80 font-normal">~2.5 MB</span>
                </a>

                <a
                  href="/downloads/RoboLab-Compiler-Bridge-Linux.zip"
                  download="RoboLab-Compiler-Bridge-Linux.zip"
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isDark
                      ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ZIP Package (.zip)</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── CLI / Quick Terminal Box (Mac & Linux) ── */}
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-slate-900 text-slate-200 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-black/30 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300">
                  Instalasi Instan via Terminal (macOS &amp; Linux)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                1-Liner Bash Command
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* macOS Command */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">🍎 Perintah Terminal untuk macOS:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(macTerminalCmd, 'mac')}
                    className="flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 transition cursor-pointer"
                  >
                    {copiedCmd === 'mac' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'mac' ? 'Tersalin!' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-slate-300 overflow-x-auto border border-white/5">
                  <code>{macTerminalCmd}</code>
                </div>
              </div>

              {/* Linux Command */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">🐧 Perintah Terminal untuk Linux:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(linuxTerminalCmd, 'linux')}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
                  >
                    {copiedCmd === 'linux' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd === 'linux' ? 'Tersalin!' : 'Salin Perintah'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-slate-300 overflow-x-auto border border-white/5">
                  <code>{linuxTerminalCmd}</code>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3-Step Setup Guide ── */}
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
              isDark ? 'bg-white/[0.03] border-white/10 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Cara Kerja 3 Langkah Mudah:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <div>
                  <div className="font-bold text-slate-200">Unduh &amp; Jalankan</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Unduh file sesuai OS Anda di atas dan jalankan sekali di komputer.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-purple-600/20 text-purple-400 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <div>
                  <div className="font-bold text-slate-200">Deteksi Otomatis</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    RoboLab Web otomatis mendeteksi bridge lokal di Port 3001 (Indikator Hijau).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <div>
                  <div className="font-bold text-slate-200">Kompilasi Cepat</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Klik Upload di RoboLab. Proyek Blynk, ESP32, dan Arduino terkompilasi instan!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer ── */}
        <div
          className={`flex items-center justify-between px-6 py-3.5 border-t relative z-10 ${
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/60'
          }`}
        >
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Aman &amp; Open Source
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Multi-core CPU Speed
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
