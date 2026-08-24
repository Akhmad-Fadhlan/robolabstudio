import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  themeMode: 'light' | 'dark';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  themeMode
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = React.useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      cmd => cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isDark = themeMode === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${
          isDark 
            ? 'bg-[#0e0f17] border-purple-500/30 text-white' 
            : 'bg-white border-purple-300 text-slate-900'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Search bar input */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik perintah... (CTRL + SHIFT + P)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-medium placeholder-slate-400"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Tidak ada perintah ditemukan untuk "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition text-xs select-none ${
                    isSelected
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold'
                      : isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{cmd.title}</div>
                      <div className="text-[10px] text-slate-400">{cmd.category}</div>
                    </div>
                  </div>
                  {cmd.shortcut && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-mono text-slate-400">
                      {cmd.shortcut}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 text-[10px] border-t border-white/10 flex items-center justify-between text-slate-400 bg-black/20">
          <span>Navigasi: <kbd className="px-1 bg-white/10 rounded">↑</kbd> <kbd className="px-1 bg-white/10 rounded">↓</kbd> Pilih | <kbd className="px-1 bg-white/10 rounded">Enter</kbd> Jalankan</span>
          <span>RoboLab Command Palette</span>
        </div>
      </div>
    </div>
  );
};
