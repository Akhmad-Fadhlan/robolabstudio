import React, { useState } from 'react';
import { Home, Layers, BookOpen, Download, Award, Monitor, Zap, FolderOpen } from 'lucide-react';
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  workspaceMode,
  setWorkspaceMode,
  level,
  showExplorer = true,
  setShowExplorer,
  language = 'id',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sb = (key: string) => t(language, 'sidebar', key, { level: String(level) });

  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`glass-sidebar flex flex-col justify-between py-4 px-2.5 select-none flex-shrink-0 rounded-2xl border border-white/5 shadow-2xl transition-all duration-300 ease-in-out z-40 ${
        isHovered ? 'w-56' : 'w-16'
      }`}
    >
      <div className="flex flex-col gap-3.5 w-full">
        {/* Top Logo / Brand mark when expanded */}
        <div className="flex items-center gap-3 px-2 py-1 mb-1">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Zap className="w-4 h-4 fill-cyan-400/20" />
          </div>
          {isHovered && (
            <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden">
              ROBOLAB
            </span>
          )}
        </div>

        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'home' 
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('dashboardHome')}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('dashboardHome')}
            </span>
          )}
        </button>

        <button 
          onClick={() => {
            if (currentTab !== 'ide') {
              setCurrentTab('ide');
              if (setShowExplorer) setShowExplorer(true);
            } else if (setShowExplorer) {
              setShowExplorer(prev => !prev);
            }
          }}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'ide' && showExplorer
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('fileExplorer')}
        >
          <FolderOpen className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('fileExplorer')}
            </span>
          )}
        </button>

        <button 
          onClick={() => { setCurrentTab('ide'); setWorkspaceMode('split'); }}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'ide' && workspaceMode === 'split'
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('workspace')}
        >
          <Layers className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('workspace')}
            </span>
          )}
        </button>

        {/* Separator */}
        <div className="w-full px-2">
          <div className="w-full h-px bg-white/10 rounded-full" />
        </div>

        <button 
          onClick={() => setCurrentTab('simulator')}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'simulator'
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('hardwareSimulator')}
        >
          <Monitor className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('hardwareSimulator')}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentTab('learning')}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'learning'
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('learningPortal')}
        >
          <BookOpen className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('learningPortal')}
            </span>
          )}
        </button>

        <button 
          onClick={() => setCurrentTab('packages')}
          className={`flex items-center gap-3.5 p-2.5 rounded-xl transition-all cursor-pointer ${
            currentTab === 'packages'
              ? 'nav-icon-active bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
          }`}
          title={sb('packageManager')}
        >
          <Download className="w-5 h-5 flex-shrink-0" />
          {isHovered && (
            <span className="text-xs font-semibold whitespace-nowrap overflow-hidden">
              {sb('packageManager')}
            </span>
          )}
        </button>
      </div>

      {/* Gamification STEM badge */}
      <div 
        className={`rounded-xl p-2.5 flex items-center transition-all ${
          isHovered ? 'w-full gap-3' : 'w-11 justify-center self-center'
        }`} 
        style={{
          background: 'rgba(245,158,11,0.08)', 
          border: '1px solid rgba(245,158,11,0.2)', 
          boxShadow: '0 0 16px rgba(245,158,11,0.1)'
        }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-yellow-400 flex-shrink-0" style={{background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)'}}>
          <Award className="w-4 h-4" />
        </div>
        {isHovered ? (
          <div className="flex flex-col whitespace-nowrap overflow-hidden">
            <span className="text-[10px] text-slate-400 font-semibold leading-tight">{sb('robomakerLevel')}</span>
            <span className="text-xs font-bold text-yellow-400 font-mono leading-tight">{sb('levelMaster')}</span>
          </div>
        ) : (
          <span className="hidden text-xs font-bold text-yellow-400 font-mono">{level}</span>
        )}
      </div>
    </div>
  );
};
