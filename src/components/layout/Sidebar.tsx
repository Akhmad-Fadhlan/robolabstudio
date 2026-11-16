import React from 'react';
import { Home, BookOpen, Download, Monitor, FolderOpen, PlayCircle, Settings, HelpCircle } from 'lucide-react';
import type { LangCode } from '../../i18n';
import { t } from '../../i18n';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: 'home' | 'ide' | 'learning' | 'packages' | 'settings' | 'simulator') => void;
  workspaceMode: string;
  setWorkspaceMode: (mode: 'split' | 'code' | 'blockly') => void;
  level: number;
  showExplorer?: boolean;
  setShowExplorer?: React.Dispatch<React.SetStateAction<boolean>>;
  language?: LangCode;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  themeMode?: 'light' | 'dark';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  workspaceMode: _workspaceMode,
  setWorkspaceMode: _setWorkspaceMode,
  level: _level,
  showExplorer = true,
  setShowExplorer,
  language = 'id',
  onOpenSettings,
  onOpenHelp,
  themeMode = 'light',
}) => {
  const isDark = themeMode === 'dark';
  const sb = (key: string) => t(language, 'sidebar', key);

  return (
    <aside 
      aria-label="Sidebar Navigation"
      className={`flex flex-col justify-between py-3 px-1.5 sm:px-2 select-none flex-shrink-0 transition-all duration-300 z-40 w-16 sm:w-20 ${
        isDark 
          ? 'bg-[#0b0d14]/95 border border-white/10 rounded-2xl shadow-2xl text-slate-300' 
          : 'bg-white/95 backdrop-blur-md border border-sky-100 rounded-3xl shadow-[0_10px_30px_rgba(59,130,246,0.10)] text-slate-700'
      }`}
    >
      {/* ── Top Navigation Links ── */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Brand Icon Mini */}
        <div className="mb-1">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center">
            <img src="./icon-only.png" alt="RoboLab" className="w-5 h-5 object-contain" />
          </div>
        </div>

        {/* 1. Home */}
        <button 
          onClick={() => setCurrentTab('home')}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer group ${
            currentTab === 'home' 
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105' 
              : isDark
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-sky-50 text-slate-600 hover:text-sky-600'
          }`}
          title={sb('dashboardHome')}
        >
          <div className={`p-1 rounded-xl transition-transform group-hover:scale-110 ${currentTab === 'home' ? 'text-white' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Home
          </span>
        </button>

        {/* 2. Library / Packages */}
        <button 
          onClick={() => setCurrentTab('packages')}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer group ${
            currentTab === 'packages' 
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105' 
              : isDark
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-sky-50 text-slate-600 hover:text-sky-600'
          }`}
          title={sb('packageManager')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Library
          </span>
        </button>

        {/* 3. Project / Explorer */}
        <button 
          onClick={() => {
            if (currentTab !== 'ide') {
              setCurrentTab('ide');
              if (setShowExplorer) setShowExplorer(true);
            } else if (setShowExplorer) {
              setShowExplorer(prev => !prev);
            }
          }}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer group ${
            currentTab === 'ide' && showExplorer
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105' 
              : isDark
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-sky-50 text-slate-600 hover:text-sky-600'
          }`}
          title={sb('fileExplorer')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <FolderOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Project
          </span>
        </button>

        {/* 4. Simulator */}
        <button 
          onClick={() => setCurrentTab('simulator')}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer group ${
            currentTab === 'simulator'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105' 
              : isDark
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-sky-50 text-slate-600 hover:text-sky-600'
          }`}
          title={sb('hardwareSimulator')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <Monitor className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Arena
          </span>
        </button>

        {/* 5. Tutorial / Learning */}
        <button 
          onClick={() => setCurrentTab('learning')}
          className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer group ${
            currentTab === 'learning' 
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 scale-105' 
              : isDark
                ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                : 'hover:bg-sky-50 text-slate-600 hover:text-sky-600'
          }`}
          title={sb('learningPortal')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <PlayCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Tutorial
          </span>
        </button>

        {/* Separator */}
        <div className={`w-8 h-px my-1 ${isDark ? 'bg-white/10' : 'bg-sky-100'}`} />

        {/* 6. Settings */}
        <button 
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
            else setCurrentTab('settings');
          }}
          className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-sky-50 text-slate-500 hover:text-slate-800'
          }`}
          title={sb('settings')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:rotate-45">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold mt-0.5 leading-tight">
            Setting
          </span>
        </button>

        {/* 7. Help */}
        <button 
          onClick={() => {
            if (onOpenHelp) onOpenHelp();
          }}
          className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-sky-50 text-slate-500 hover:text-slate-800'
          }`}
          title={sb('documentation')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span className="text-[9.5px] font-semibold mt-0.5 leading-tight">
            Help
          </span>
        </button>
      </div>

      {/* ── Bottom Mascot Avatar ── */}
      <div className="w-full flex flex-col items-center justify-center pt-2">
        <div 
          className="w-10 h-10 rounded-2xl bg-gradient-to-b from-sky-100 to-sky-200 border border-sky-300/80 shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          title="RoboBuddy - Sahabat Belajar Robotika"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="4" r="1.5" fill="#f59e0b" />
            <line x1="12" y1="5.5" x2="12" y2="7.5" stroke="#0284c7" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="5" y="7.5" width="14" height="11" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
            <rect x="7.5" y="9.5" width="9" height="5" rx="1.5" fill="#0f172a" />
            <circle cx="9.5" cy="12" r="1" fill="#38bdf8" />
            <circle cx="14.5" cy="12" r="1" fill="#38bdf8" />
            <path d="M10 16 Q12 17.5 14 16" stroke="#0284c7" strokeWidth="1" strokeLinecap="round" />
            <rect x="8" y="19" width="2.5" height="2" rx="0.5" fill="#0284c7" />
            <rect x="13.5" y="19" width="2.5" height="2" rx="0.5" fill="#0284c7" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
