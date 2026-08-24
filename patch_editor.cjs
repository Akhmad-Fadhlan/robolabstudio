const fs = require('fs');
let code = fs.readFileSync('src/components/CodeEditor.tsx', 'utf-8');

// 1. Update imports
code = code.replace(
  /import \{ Play, Square \} from 'lucide-react';/,
  `import { Play, Square, ChevronRight, FileCode2, Link, Unplug, Code2 } from 'lucide-react';`
);

// 2. Inject custom themes in the import('monaco-editor') block
const customThemes = `
        monaco.editor.defineTheme('premium-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: 'c792ea', fontStyle: 'italic' },
            { token: 'string', foreground: 'c3e88d' },
            { token: 'number', foreground: 'f78c6c' },
            { token: 'type', foreground: 'ffcb6b' },
            { token: 'function', foreground: '82aaff' },
            { token: 'comment', foreground: '676e95', fontStyle: 'italic' },
            { token: 'variable', foreground: 'eeffff' },
          ],
          colors: {
            'editor.background': '#0b0c10',
            'editor.foreground': '#eeffff',
            'editor.lineHighlightBackground': '#1f2029',
            'editorLineNumber.foreground': '#4f5b66',
            'editorIndentGuide.background': '#1f2029',
          }
        });

        monaco.editor.defineTheme('premium-light', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: 'keyword', foreground: 'a626a4', fontStyle: 'italic' },
            { token: 'string', foreground: '50a14f' },
            { token: 'number', foreground: '986801' },
            { token: 'type', foreground: 'c18401' },
            { token: 'function', foreground: '4078f2' },
            { token: 'comment', foreground: 'a0a1a7', fontStyle: 'italic' },
            { token: 'variable', foreground: '383a42' },
          ],
          colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#383a42',
            'editor.lineHighlightBackground': '#f8f9fa',
            'editorLineNumber.foreground': '#9ca3af',
            'editorIndentGuide.background': '#f1f5f9',
          }
        });
`;

code = code.replace(
  /monacoRef\.current = monaco;/,
  `monacoRef.current = monaco;\n\n${customThemes}`
);

// Update theme application on init
code = code.replace(
  /theme: themeMode === 'light' \? 'vs' : 'vs-dark',/,
  `theme: themeMode === 'light' ? 'premium-light' : 'premium-dark',`
);

// Update theme application on useEffect
code = code.replace(
  /monaco\.editor\.setTheme\(themeMode === 'light' \? 'vs' : 'vs-dark'\);/,
  `monaco.editor.setTheme(themeMode === 'light' ? 'premium-light' : 'premium-dark');`
);

// 3. Rewrite the UI elements
const oldUIStart = `  return (
    <div className={\`w-full h-full flex flex-col overflow-hidden \${themeMode === 'light' ? 'bg-[#ffffff]' : 'bg-[#1e1e24]'}\`}>
      {/* Tab Bar: scrollable tabs left + fixed right controls */}
      <div className={\`flex items-style select-none min-h-0 border-b \${themeMode === 'light' ? 'bg-[#f1f5f9] border-slate-200' : 'bg-[#111216] border-slate-800'}\`}>`;

const oldUIEnd = `                  </button>
                )
              )}
            </div>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className={\`px-2 py-1.5 ml-1 transition cursor-pointer flex items-center \${themeMode === 'light' ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-[#18191f]'}\`}
              title="Close editor"
            >
              <span className="text-xs font-mono mr-1">Tutup</span>
              <span className="text-xs">▶</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 min-h-0 relative">
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );`;

// We use regex to slice the whole UI part out, and put the new UI
const newUI = `  return (
    <div className={\`w-full h-full flex flex-col p-2 gap-2 \${themeMode === 'light' ? 'bg-slate-50/50' : 'bg-[#08090d]/50'}\`}>
      {/* ✨ Premium Glassmorphism Tab Bar */}
      <div className={\`flex items-center justify-between select-none min-h-0 rounded-xl px-2 py-1.5 shadow-sm backdrop-blur-md border \${themeMode === 'light' ? 'bg-white/80 border-slate-200/80' : 'bg-[#0b0c10]/80 border-slate-800/80'}\`}>
        
        {/* Left: Scrollable file tabs */}
        <div className="flex overflow-x-auto flex-1 min-w-0 items-center gap-1.5 pl-1">
          {Object.keys(files).map((filename) => {
            const isActive = filename === activeFile;
            return (
              <button
                key={filename}
                onClick={() => {
                  flushPendingChanges();
                  onTabChange(filename);
                }}
                className={\`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] transition-all cursor-pointer font-bold whitespace-nowrap flex-shrink-0 \${
                  isActive
                    ? themeMode === 'light'
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50 ring-1 ring-indigo-500/10'
                      : 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20 ring-1 ring-indigo-500/20'
                    : themeMode === 'light'
                      ? 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 border border-transparent'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }\`}
              >
                <div className="flex items-center justify-center">
                  {filename.endsWith('.ino') ? (
                    <div className={\`w-1.5 h-1.5 rounded-full \${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-500/50'}\`} />
                  ) : filename.endsWith('.py') ? (
                    <div className={\`w-1.5 h-1.5 rounded-full \${isActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-amber-400/50'}\`} />
                  ) : (
                    <FileCode2 className="w-3.5 h-3.5 opacity-70" />
                  )}
                </div>
                {filename}
              </button>
            );
          })}
        </div>

        {/* Right: Fixed controls */}
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          
          {/* Sync Status / Toggle Control */}
          {(activeFile.endsWith('.ino') || activeFile.endsWith('.py')) && (
            <div className={\`flex items-center rounded-full p-0.5 border \${themeMode === 'light' ? 'bg-slate-100/80 border-slate-200/80' : 'bg-slate-900/60 border-slate-800'}\`}>
              {isSyncWithBlocks ? (
                <>
                  <div className={\`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold \${themeMode === 'light' ? 'text-emerald-700 bg-emerald-100/50' : 'text-emerald-400 bg-emerald-500/10'}\`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span className="hidden sm:inline">Sync On</span>
                  </div>
                  <button
                    onClick={() => onSyncToggle(false)}
                    className={\`flex items-center gap-1 px-3 py-1 ml-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer \${themeMode === 'light' ? 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
                    title="Putuskan sinkronisasi untuk mengedit kode manual"
                  >
                    <Unplug className="w-3 h-3" /> Manual
                  </button>
                </>
              ) : (
                <>
                  <div className={\`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold \${themeMode === 'light' ? 'text-amber-700 bg-amber-100/50' : 'text-amber-400 bg-amber-500/10'}\`}>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    <span className="hidden sm:inline">Manual</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Mengaktifkan sinkronisasi akan menimpa kode manual Anda. Lanjutkan?")) {
                        onSyncToggle(true);
                      }
                    }}
                    className={\`flex items-center gap-1 px-3 py-1 ml-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer \${themeMode === 'light' ? 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
                    title="Hubungkan kembali dengan Blockly"
                  >
                    <Link className="w-3 h-3" /> Sync
                  </button>
                </>
              )}
            </div>
          )}

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5"></div>

          {/* Simulator Controls */}
          {onRunSimulator && onStopSimulator && (
            isRunning ? (
              <button 
                onClick={onStopSimulator}
                className="text-[10px] bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center gap-1.5 font-bold cursor-pointer shadow-sm"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> Stop
              </button>
            ) : (
              <button 
                onClick={() => onRunSimulator?.()}
                className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1.5 font-bold cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Run Sim
              </button>
            )
          )}

          {onCollapse && (
            <button
              onClick={onCollapse}
              className={\`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer \${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}\`}
              title="Close editor"
            >
              Tutup <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ✨ Premium Editor Container */}
      <div className={\`flex-1 min-h-0 relative rounded-xl overflow-hidden border shadow-inner \${themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0b0c10]'}\`}>
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );`;

// Find the index of the start of return
const startIndex = code.indexOf('  return (\n    <div className={`w-full h-full flex flex-col overflow-hidden');
if (startIndex !== -1) {
  // we just slice from startIndex to the end of the file since it's the main render return
  const endSlice = code.substring(0, startIndex);
  code = endSlice + newUI + '\n};\n';
}

fs.writeFileSync('src/components/CodeEditor.tsx', code);
console.log('Patched CodeEditor UI and Themes!');
