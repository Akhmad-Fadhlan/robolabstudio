import React from 'react';
import { Home, BookOpen, Monitor, FolderOpen, PlayCircle, Settings, HelpCircle } from 'lucide-react';
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

  const getNavBtnClass = (isActive: boolean) => {
    if (isActive) {
      return 'text-white shadow-md scale-105';
    }
    return isDark
      ? 'hover:bg-white/5 text-slate-400 hover:text-white'
      : 'hover:bg-black/5 text-slate-600 hover:text-slate-900';
  };

  const getNavBtnStyle = (isActive: boolean): React.CSSProperties => {
    if (isActive) {
      return {
        background: 'var(--accent-gradient)',
        boxShadow: '0 4px 14px var(--accent-primary-glow)',
      };
    }
    return {};
  };

  return (
    <aside 
      aria-label="Sidebar Navigation"
      className="lab-surface z-40 flex w-full shrink-0 select-none flex-col justify-between overflow-hidden rounded-xl border px-1 shadow-sm md:w-16 2xl:w-20 md:rounded-2xl md:px-1.5 2xl:px-2 md:py-2 2xl:py-3"
    >
      {/* ── Top Navigation Links ── */}
      <div className="lab-nav-links flex w-full items-center gap-0.5 overflow-x-auto md:flex-col md:gap-1.5 md:overflow-visible">
        {/* Brand Icon Mini */}
        <div className="mb-1 hidden md:block">
          <div 
            style={{ background: 'var(--accent-gradient)' }}
            className="w-9 h-9 rounded-2xl p-0.5 shadow-md flex items-center justify-center transition-all"
          >
            <img src="./icon-only.png" alt="RoboLab" className="w-5 h-5 object-contain" />
          </div>
        </div>

        {/* 1. Home */}
        <button 
          onClick={() => setCurrentTab('home')}
          style={getNavBtnStyle(currentTab === 'home')}
          className={`w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all cursor-pointer group ${getNavBtnClass(currentTab === 'home')}`}
          title={sb('dashboardHome')}
        >
          <div className="p-1 rounded-xl transition-transform group-hover:scale-110">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 tracking-tight leading-tight">
            Home
          </span>
        </button>

        {/* 2. Library / Packages */}
        <button 
          onClick={() => setCurrentTab('packages')}
          style={getNavBtnStyle(currentTab === 'packages')}
          className={`w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all cursor-pointer group ${getNavBtnClass(currentTab === 'packages')}`}
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
          style={getNavBtnStyle(currentTab === 'ide' && showExplorer)}
          className={`w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all cursor-pointer group ${getNavBtnClass(currentTab === 'ide' && showExplorer)}`}
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
          style={getNavBtnStyle(currentTab === 'simulator')}
          className={`w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all cursor-pointer group ${getNavBtnClass(currentTab === 'simulator')}`}
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
          style={getNavBtnStyle(currentTab === 'learning')}
          className={`w-full flex flex-col items-center justify-center py-1.5 2xl:py-2 px-1 rounded-2xl transition-all cursor-pointer group ${getNavBtnClass(currentTab === 'learning')}`}
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
        <div className={`my-1 hidden h-px w-8 md:block ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />

        {/* 6. Settings */}
        <button 
          onClick={() => {
            if (onOpenSettings) onOpenSettings();
            else setCurrentTab('settings');
          }}
          className={`w-full flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'
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
            isDark ? 'hover:bg-white/5 text-slate-400 hover:text-white' : 'hover:bg-black/5 text-slate-500 hover:text-slate-800'
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
      <div className="hidden w-full flex-col items-center justify-center pt-2 md:flex">
        <div 
          className="w-10 h-10 rounded-2xl border shadow-sm flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
          style={{
            background: 'var(--theme-pill-bg, #e0f2fe)',
            borderColor: 'var(--theme-pill-border, #bae6fd)'
          }}
          title="RoboBuddy - Sahabat Belajar Robotika"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="4" r="1.5" fill="#f59e0b" />
            <line x1="12" y1="5.5" x2="12" y2="7.5" stroke="var(--accent-primary, #0284c7)" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="5" y="7.5" width="14" height="11" rx="3" fill="#ffffff" stroke="var(--accent-primary, #0284c7)" strokeWidth="1.5" />
            <rect x="7.5" y="9.5" width="9" height="5" rx="1.5" fill="#0f172a" />
            <circle cx="9.5" cy="12" r="1" fill="var(--accent-primary, #38bdf8)" />
            <circle cx="14.5" cy="12" r="1" fill="var(--accent-primary, #38bdf8)" />
            <path d="M10 16 Q12 17.5 14 16" stroke="var(--accent-primary, #0284c7)" strokeWidth="1" strokeLinecap="round" />
            <rect x="8" y="19" width="2.5" height="2" rx="0.5" fill="var(--accent-primary, #0284c7)" />
            <rect x="13.5" y="19" width="2.5" height="2" rx="0.5" fill="var(--accent-primary, #0284c7)" />
          </svg>
        </div>
      </div>
    </aside>
  );
};
