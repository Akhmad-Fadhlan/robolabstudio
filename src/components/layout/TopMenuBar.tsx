import robolabMark from '../../assets/robolab-logo-only.png';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FolderOpen, Save, Check, Upload, Package, 
  MoreHorizontal, Cpu, Settings, 
  HelpCircle, Info, MessageSquare, Code, 
  Search, Sliders, RefreshCw, LogOut, Globe
} from 'lucide-react';
import type { LangCode } from '../../i18n';
import { LANGUAGES, t } from '../../i18n';
import { PythonLogo } from '../icons/PythonLogo';

interface TopMenuBarProps {
  isSerialConnected: boolean;
  connectedPort: string;
  board: string;
  setBoard: (board: string) => void;
  port: string;
  setPort: (port: string) => void;
  availablePorts: Array<{ address: string }>;
  onRefreshPorts?: () => void;
  
  // Handlers
  handleNativeOpenFile: () => void;
  handleSaveFile: () => void;
  handleArduinoHardwareAction: (action: 'verify' | 'upload' | 'flash-firmware') => void;
  handleInstallCores: () => void;
  handleRunPython: () => void;
  
  // File state
  files: { [filename: string]: string };
  activeFile: string;
  savedFiles: { [filename: string]: string };
  
  // UI View Modes
  uiMode: 'student' | 'pro';
  setUiMode: (mode: 'student' | 'pro') => void;
  studentSubMode: 'block' | 'code';
  setStudentSubMode: (subMode: 'block' | 'code') => void;

  // Modals
  setShowSettingsModal: (show: boolean) => void;
  setShowHelpModal: (show: boolean) => void;
  setShowAboutModal?: (show: boolean) => void;
  setShowFeedbackModal?: (show: boolean) => void;
  onOpenBoardManager?: () => void;
  onOpenLibraryManager?: () => void;
  onOpenExtensions?: () => void;
  onOpenCommandPalette?: () => void;

  themeMode: 'light' | 'dark';

  // Auth
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  onSignOut?: () => void;

  // Language
  language: LangCode;
  onLanguageChange: (lang: LangCode) => void;
  onRequestWebPort?: () => void;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  isSerialConnected,
  connectedPort,
  board,
  setBoard,
  port,
  setPort,
  availablePorts,
  onRefreshPorts,
  handleNativeOpenFile,
  handleSaveFile,
  handleArduinoHardwareAction,
  handleInstallCores,
  handleRunPython,
  files,
  activeFile,
  savedFiles,
  uiMode,
  setUiMode,
  studentSubMode,
  setStudentSubMode,
  setShowSettingsModal,
  setShowHelpModal,
  setShowAboutModal,
  setShowFeedbackModal,
  onOpenBoardManager,
  onOpenLibraryManager,
  onOpenExtensions,
  onOpenCommandPalette,
  themeMode,
  userEmail,
  userName,
  userAvatar: _userAvatar,
  onSignOut,
  language,
  onLanguageChange,
  onRequestWebPort,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; left: number }>({ top: 48, left: 220 });
  const [langMenuPos, setLangMenuPos] = useState<{ top: number; right: number }>({ top: 48, right: 16 });
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(target) &&
        (!moreDropdownRef.current || !moreDropdownRef.current.contains(target))
      ) {
        setShowMoreMenu(false);
      }
      if (
        langMenuRef.current &&
        !langMenuRef.current.contains(target) &&
        (!langDropdownRef.current || !langDropdownRef.current.contains(target))
      ) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [toolsOpen, setToolsOpen] = useState(false);
  const isMicrobit = board === 'BBC micro:bit';
  const isDark = themeMode === 'dark';
  const isFileModified = files[activeFile] !== savedFiles[activeFile];

  // Helper: get translation for topBar section
  const tb = (key: string) => t(language, 'topBar', key);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[1];

  return (
    <div className={`studio-topbar flex flex-col select-none flex-shrink-0 relative z-[200] border-b ${
      isDark ? 'bg-[#0a0b10]/95 border-white/10 text-white' : 'bg-white/95 backdrop-blur-md border-[var(--theme-border,rgba(186,230,253,0.9))] shadow-sm text-slate-800'
    }`}>
      {/* 1. TOP HEADER & MAIN TOOLBAR */}
      <div className="studio-strip px-2 sm:px-3 flex items-center justify-between gap-1 sm:gap-2 border-b border-white/5 overflow-x-auto overflow-y-hidden no-scrollbar flex-shrink-0 flex-nowrap">
        
        {/* Left: Branding + Main Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0">
          {/* Logo & Title */}
          <div className="flex items-center gap-1.5 mr-0.5 flex-shrink-0">
            <img src={robolabMark} className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9" alt="" />
            <div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap" style={{ fontFamily: 'Outfit, Inter, sans-serif' }}>
                RoboLab Studio
              </h1>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
            <button
              onClick={handleNativeOpenFile}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 shadow-sm ${
                isDark ? 'hover:bg-white/10 text-slate-200' : 'bg-amber-100/70 hover:bg-amber-200/80 text-amber-900 border border-amber-200/90'
              }`}
              title="Buka File (Ctrl+O)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span >{tb('open')}</span>
            </button>

            <button
              onClick={handleSaveFile}
              className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer relative flex-shrink-0 shadow-sm ${
                isDark ? 'hover:bg-white/10 text-slate-200' : 'bg-sky-100/70 hover:bg-sky-200/80 text-sky-900 border border-sky-200/90'
              }`}
              title="Simpan File (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span >{tb('save')}</span>
              {isFileModified && (
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute top-1 right-1" title="File belum disimpan" />
              )}
            </button>

            <div className="w-px h-4 bg-white/10 mx-0.5 sm:mx-1 flex-shrink-0" />

            {/* Primary Action Buttons: Context-aware (Python vs Arduino/C++) */}
            {isMicrobit ? (
              <button type="button" onClick={() => handleArduinoHardwareAction('upload')}
                className="flex items-center gap-1.5 rounded-lg bg-sky-800 px-3 py-1 text-xs font-bold text-white"
                title="Upload MicroPython ke BBC micro:bit">
                <Upload className="h-4 w-4" /> Upload
              </button>
            ) : activeFile.endsWith('.py') ? (
              <button
                onClick={handleRunPython}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 shadow-md ${
                  isDark ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold shadow-amber-400/30 border border-amber-400'
                }`}
                title="Jalankan Kode Python"
              >
                <PythonLogo className="w-3.5 h-3.5" />
                <span className="font-bold hidden sm:inline">{tb('runPython')}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleArduinoHardwareAction('verify')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 shadow-sm ${
                    isDark ? 'hover:bg-white/10 text-emerald-300' : 'bg-emerald-100/70 hover:bg-emerald-200/80 text-emerald-900 border border-emerald-200/90'
                  }`}
                  title="Verify / Compile Firmware"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="hidden xl:inline">{tb('verify')}</span>
                </button>

                <button
                  onClick={() => handleArduinoHardwareAction('upload')}
                  className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 shadow-md ${
                    isDark ? 'bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/40' : 'bg-purple-600 hover:bg-purple-700 !text-white text-white-force shadow-purple-500/30 border border-purple-600'
                  }`}
                  title="Upload to Hardware"
                >
                  <Upload className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-purple-200' : '!text-white text-white-force'}`} />
                  <span className={`hidden xl:inline font-bold ${isDark ? 'text-purple-200' : '!text-white text-white-force'}`}>{tb('upload')}</span>
                </button>
              </>
            )}

            {/* Dropdown "More" (3-dots button only, no text label to guarantee zero overlap) */}
            <div className="relative flex-shrink-0" ref={moreMenuRef}>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMoreMenuPos({
                    top: rect.bottom + 6,
                    left: Math.max(8, Math.min(rect.left, window.innerWidth - 220)),
                  });
                  setShowMoreMenu(!showMoreMenu);
                }}
                className={`flex items-center justify-center p-1.5 px-2.5 rounded-full text-xs font-bold transition cursor-pointer shadow-sm ${
                  isDark ? 'hover:bg-white/10 text-slate-300' : 'bg-sky-100/70 hover:bg-sky-200/80 text-sky-900 border border-sky-200/90'
                }`}
                title="Menu Lainnya (Board Manager, Library, Python, Cores, dll.)"
              >
                <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
              </button>

              {showMoreMenu && typeof document !== 'undefined' && createPortal(
                <div
                  ref={moreDropdownRef}
                  style={{
                    position: 'fixed',
                    top: moreMenuPos.top,
                    left: moreMenuPos.left,
                    zIndex: 999999,
                  }}
                  className={`w-52 rounded-xl shadow-2xl border py-1.5 text-xs select-none ${
                    isDark ? 'bg-[#0f1118] border-white/15 text-slate-200 shadow-black/90' : 'bg-white border-slate-200 text-slate-800 shadow-slate-400/80'
                  }`}
                >
                  <div className="border-b border-white/10 pb-1 mb-1">
                    <button
                      onClick={() => { setShowMoreMenu(false); if (isMicrobit) handleArduinoHardwareAction('upload'); else handleRunPython(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                    >
                      {isMicrobit ? <><Upload className="w-3.5 h-3.5" /> Upload</> : <><PythonLogo className="w-3.5 h-3.5" /> {tb('runPython')}</>}
                    </button>
                    <button
                      onClick={() => { setShowMoreMenu(false); handleInstallCores(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-cyan-400" /> {tb('installCore')}
                    </button>
                  </div>
                  <button
                    onClick={() => { setShowMoreMenu(false); onOpenBoardManager?.(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5 text-purple-400" /> {tb('boardManager')}
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); onOpenLibraryManager?.(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-cyan-400" /> {tb('libraryManager')}
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); onOpenExtensions?.(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> {tb('extensions')}
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={() => { setShowMoreMenu(false); setShowSettingsModal(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" /> {tb('settings')}
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); setShowHelpModal(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> {tb('documentation')}
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); setShowAboutModal?.(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-400" /> {tb('about')}
                  </button>

                  <button
                    onClick={() => { setShowMoreMenu(false); setShowFeedbackModal?.(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-purple-600/20 hover:text-purple-300 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-rose-400" /> {tb('feedback')}
                  </button>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        <button className="studio-disclosure" aria-expanded={toolsOpen} aria-controls="studio-tools" onClick={() => setToolsOpen(!toolsOpen)}>{language === "id" ? "Alat proyek" : "Project tools"} {toolsOpen ? "−" : "+"}</button>
        {/* Right: Mode Switchers, Selectors & Command Palette Trigger */}
        <div id="studio-tools" data-open={toolsOpen} className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0 min-w-0">
          
          {/* Mode Switcher: Student Mode 🎓 vs Professional Mode ⚡ */}
          <div className={`flex items-center p-0.5 rounded-xl border flex-shrink-0 ${
            isDark ? 'bg-black/40 border-purple-500/20' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setUiMode('student')}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                uiMode === 'student'
                  ? (isDark ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-600 !text-white text-white-force shadow-sm')
                  : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
              }`}
              title="Student Mode: Tampilan sederhana untuk pemula"
            >

              <span >{tb('student')}</span>
            </button>
            <button
              onClick={() => setUiMode('pro')}
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                uiMode === 'pro'
                  ? (isDark ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-600 !text-white text-white-force shadow-sm')
                  : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
              }`}
              title="Professional Mode: Tampilan lengkap dengan Explorer & Multi-editor"
            >

              <span >{tb('pro')}</span>
            </button>
          </div>

          {/* If in Student Mode, show Sub-toggle: Block vs Code */}
          {uiMode === 'student' && (
            <div className={`flex items-center p-0.5 rounded-xl border flex-shrink-0 ${
              isDark ? 'bg-black/40 border-cyan-500/20' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                onClick={() => setStudentSubMode('block')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  studentSubMode === 'block'
                    ? (isDark ? 'bg-cyan-600 text-white shadow-sm' : 'bg-cyan-600 !text-white text-white-force shadow-sm')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
                title="Tampilan Visual Block"
              >
                <Sliders className="w-3 h-3 flex-shrink-0" />
                <span className="hidden md:inline">{tb('block')}</span>
              </button>
              <button
                onClick={() => setStudentSubMode('code')}
                className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  studentSubMode === 'code'
                    ? (isDark ? 'bg-cyan-600 text-white shadow-sm' : 'bg-cyan-600 !text-white text-white-force shadow-sm')
                    : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')
                }`}
                title="Tampilan Kode Program"
              >
                <Code className="w-3 h-3 flex-shrink-0" />
                <span className="hidden md:inline">{tb('code')}</span>
              </button>
            </div>
          )}

          {/* Board Selector */}
          <div className={`flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1 border flex-shrink-0 shadow-sm ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-[var(--theme-pill-bg,#e0f2fe)] hover:opacity-90 border-[var(--theme-pill-border,#bae6fd)] text-[var(--theme-pill-text,#075985)]'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-purple-400 hidden xl:inline">{tb('boardLabel')}</span>
            <select 
              value={board} 
              onChange={(e) => setBoard(e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer max-w-[80px] sm:max-w-[100px] md:max-w-[120px] lg:max-w-[135px] xl:max-w-[150px] truncate"
            >
              <option value="ESP32 DevKit V1" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>ESP32 DevKit V1</option>
              <option value="NodeMCU / ESP8266" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>NodeMCU / ESP8266</option>
              <option value="Arduino Uno" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>Arduino Uno</option>
              <option value="Arduino Nano" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>Arduino Nano</option>
              <option value="Arduino Mega" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>Arduino Mega</option>
              <option value="ATmega128 (MegaCore)" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>ATmega128 (MegaCore)</option>
              <option value="Raspberry Pi Pico" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>Raspberry Pi Pico</option>
              <option value="STM32 Boards" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>STM32 Boards</option>
              <option value="BBC micro:bit" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>BBC micro:bit</option>
            </select>
          </div>

          {/* Port Selector */}
          <div className={`flex items-center gap-1.5 rounded-full px-2 sm:px-2.5 py-1 border flex-shrink-0 shadow-sm ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-[var(--theme-pill-bg,#e0f2fe)] hover:opacity-90 border-[var(--theme-pill-border,#bae6fd)] text-[var(--theme-pill-text,#075985)]'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wide text-cyan-400 hidden xl:inline">{tb('portLabel')}</span>
            <select 
              value={port} 
              onChange={(e) => {
                if (e.target.value === '__request_web_serial__') {
                  onRequestWebPort?.();
                } else {
                  setPort(e.target.value);
                }
              }}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer max-w-[70px] sm:max-w-[90px] md:max-w-[110px] lg:max-w-[130px] xl:max-w-[145px] truncate"
            >
              {availablePorts.map((p) => (
                <option key={p.address} value={p.address} className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>
                  {p.address}
                </option>
              ))}
              {onRequestWebPort && (
                <option value="__request_web_serial__" className={isDark ? 'bg-[#0e0f16] text-cyan-400 font-bold' : 'bg-white text-cyan-700 font-bold'}>
                  ➕ Pilih USB (Web Serial)...
                </option>
              )}
              <option value="none" className={isDark ? 'bg-[#0e0f16]' : 'bg-white'}>None</option>
            </select>
            {onRefreshPorts && (
              <button
                onClick={() => {
                  if (onRequestWebPort) {
                    onRequestWebPort();
                  } else {
                    onRefreshPorts();
                  }
                }}
                title={onRequestWebPort ? 'Pilih / Hubungkan Port USB (CH340 / CP2102)' : 'Refresh Port USB'}
                className={`p-0.5 rounded transition-colors hover:text-cyan-400 cursor-pointer ${
                  isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-500 hover:bg-slate-200'
                }`}
                style={{ lineHeight: 0 }}
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Connected Indicator */}
          {isSerialConnected && connectedPort === port && port !== 'none' ? (
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border flex-shrink-0 shadow-sm font-extrabold ${
              isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-emerald-100 border-emerald-200 text-emerald-700'
            }`} title={`Connected to ${connectedPort}`}>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-wide hidden lg:inline">{tb('connected')}</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border flex-shrink-0 shadow-sm font-extrabold ${
              isDark ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' : 'bg-rose-100 border-rose-200 text-rose-700'
            }`} title="Disconnected">
              <span className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0" />
              <span className="text-[11px] uppercase tracking-wide hidden lg:inline">{tb('disconnected')}</span>
            </div>
          )}

          {/* Command Palette / Search Button */}
          <button
            onClick={onOpenCommandPalette}
            className={`px-2.5 py-1 rounded-full border transition cursor-pointer flex-shrink-0 flex items-center gap-1.5 shadow-sm ${
              isDark ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25' : 'bg-[var(--theme-pill-bg,#e0f2fe)] border-[var(--theme-pill-border,#bae6fd)] text-[var(--theme-pill-text,#075985)] hover:opacity-90'
            }`}
            title="Pencarian & Command Palette (Ctrl + Shift + P)"
          >
            <Search className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs font-bold hidden 2xl:inline">{tb('search')}</span>
          </button>

          {/* ── Language Switcher ── */}
          <div className="relative flex-shrink-0" ref={langMenuRef}>
            <button
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setLangMenuPos({
                  top: rect.bottom + 6,
                  right: Math.max(8, window.innerWidth - rect.right),
                });
                setShowLangMenu(!showLangMenu);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition cursor-pointer flex-shrink-0 shadow-sm ${
                isDark
                  ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  : 'bg-[var(--theme-pill-bg,#e0f2fe)] border-[var(--theme-pill-border,#bae6fd)] text-[var(--theme-pill-text,#075985)] hover:opacity-90 font-bold'
              }`}
              title={tb('changeLanguage')}
            >
              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-xs font-bold hidden sm:inline">{currentLang.flag}</span>
            </button>

            {showLangMenu && typeof document !== 'undefined' && createPortal(
              <div
                ref={langDropdownRef}
                style={{
                  position: 'fixed',
                  top: langMenuPos.top,
                  right: langMenuPos.right,
                  zIndex: 999999,
                }}
                className={`w-52 rounded-xl shadow-2xl border py-1.5 text-xs select-none ${
                  isDark ? 'bg-[#0f1118] border-white/15 text-slate-200 shadow-black/90' : 'bg-white border-slate-200 text-slate-800 shadow-slate-400/80'
                }`}
              >
                {/* Dropdown header */}
                <div className={`px-3 pb-1.5 mb-1 border-b text-[10px] font-bold uppercase tracking-widest ${
                  isDark ? 'text-slate-500 border-white/5' : 'text-slate-400 border-slate-100'
                }`}>
                  {tb('changeLanguage')}
                </div>

                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { onLanguageChange(lang.code); setShowLangMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition cursor-pointer ${
                      language === lang.code
                        ? isDark
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : 'bg-cyan-50 text-cyan-700'
                        : isDark
                          ? 'hover:bg-white/5 text-slate-300'
                          : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-semibold text-[11px] leading-tight">{lang.label}</span>
                      <span className={`text-[9px] uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{lang.code.toUpperCase()}</span>
                    </div>
                    {language === lang.code && (
                      <span className="ml-auto text-[10px] font-bold text-cyan-400">✓</span>
                    )}
                  </button>
                ))}
              </div>,
              document.body
            )}
          </div>

          {/* User Avatar + Logout */}
          {(userEmail || onSignOut) && (() => {
            const initial = ((userName || userEmail || 'U').trim().charAt(0) || 'U').toUpperCase();
            const displayName = userName || userEmail || 'User';
            return (
              <div className="flex items-center gap-1.5 flex-shrink-0 pl-1 border-l border-white/10">
                <div className="flex items-center gap-1.5" title={`${displayName} (${userEmail})`}>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 border border-cyan-300/40 flex items-center justify-center flex-shrink-0 shadow-md shadow-cyan-500/20 font-bold text-white text-[11px] select-none tracking-tight">
                    {initial}
                  </div>
                  <span className="text-[10px] text-slate-300 font-medium hidden xl:inline max-w-[110px] truncate">
                    {displayName}
                  </span>
                </div>
                {onSignOut && (
                  <button
                    id="btn-logout"
                    onClick={onSignOut}
                    title="Logout"
                    className={`p-1 rounded-lg transition cursor-pointer flex-shrink-0 ${
                      isDark
                        ? 'hover:bg-red-500/15 text-slate-400 hover:text-red-400'
                        : 'hover:bg-red-50 text-slate-500 hover:text-red-600'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
};
