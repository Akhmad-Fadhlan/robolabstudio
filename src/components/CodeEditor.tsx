import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, ChevronRight, Link, FileCode2, Unplug } from 'lucide-react';

// Self-contained Monaco Editor component that uses direct ES module import
// This completely bypasses @monaco-editor/react and its AMD loader (which conflicts with Electron)
// The monaco-editor package is bundled by Vite as standard ES modules

interface CodeEditorProps {
  files: { [filename: string]: string };
  activeFile: string;
  onFileChange: (filename: string, content: string) => void;
  onTabChange: (filename: string) => void;
  onCollapse?: () => void;
  isSyncWithBlocks: boolean;
  onSyncToggle: (sync: boolean) => void;
  isRunning?: boolean;
  onRunSimulator?: () => void;
  onStopSimulator?: () => void;
  themeMode?: 'dark' | 'light';
  onSaveFile?: () => void;
}

const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['ino', 'cpp', 'c', 'h', 'hpp'].includes(ext || '')) return 'cpp';
  if (ext === 'py') return 'python';
  if (ext === 'json') return 'json';
  if (ext === 'md') return 'markdown';
  return 'plaintext';
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files,
  activeFile,
  onFileChange,
  onTabChange,
  onCollapse,
  isSyncWithBlocks,
  onSyncToggle,
  isRunning = false,
  onRunSimulator,
  onStopSimulator,
  themeMode = 'dark',
  onSaveFile,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const onFileChangeRef = useRef(onFileChange);
  const onSaveFileRef = useRef(onSaveFile);
  const activeFileRef = useRef(activeFile);
  const lastActiveFileRef = useRef(activeFile);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update refs so callbacks are not stale
  useEffect(() => {
    onFileChangeRef.current = onFileChange;
    onSaveFileRef.current = onSaveFile;
    activeFileRef.current = activeFile;
  }, [onFileChange, onSaveFile, activeFile]);

  // Clean up debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Helper to immediately flush any pending debounced change
  const flushPendingChanges = () => {
    if (debounceTimeoutRef.current && editorRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
      const value = editorRef.current.getValue();
      onFileChangeRef.current(activeFileRef.current, value);
    }
  };

  // Dynamically import monaco-editor to avoid AMD loader issues
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let editorInstance: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let disposable: any = null;

    import('monaco-editor').then((monaco) => {
      if (cancelled || !containerRef.current) return;

      monacoRef.current = monaco;


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


      editorInstance = monaco.editor.create(containerRef.current, {
        value: files[activeFileRef.current] || '',
        language: getLanguage(activeFileRef.current),
        theme: themeMode === 'light' ? 'premium-light' : 'premium-dark',
        readOnly: isSyncWithBlocks,
        fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
        fontSize: 14,
        minimap: { enabled: true },
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
          useShadows: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        lineNumbersMinChars: 3,
        padding: { top: 8, bottom: 8 },
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        bracketPairColorization: { enabled: true },
      });

      editorRef.current = editorInstance;
      setIsEditorReady(true);

      disposable = editorInstance.onDidChangeModelContent(() => {
        const value = editorInstance.getValue();
        
        // Debounce update to parent by 150ms to prevent component re-render lag during typing
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          debounceTimeoutRef.current = null;
          onFileChangeRef.current(activeFileRef.current, value);
        }, 150);
      });

      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
        const isReadOnly = editorInstance.getOption(monaco.editor.EditorOption.readOnly);
        if (!isReadOnly) {
          try {
            const req = (window as any).__electronRequire || (window as any).require;
            if (req) {
              const { clipboard } = req('electron');
              const text = clipboard.readText();
              if (text) {
                editorInstance.executeEdits("clipboard-paste", [{
                  range: editorInstance.getSelection(),
                  text: text,
                  forceMoveMarkers: true
                }]);
              }
            } else if (navigator.clipboard && navigator.clipboard.readText) {
              navigator.clipboard.readText().then((text: string) => {
                if (text) {
                  editorInstance.executeEdits("clipboard-paste", [{
                    range: editorInstance.getSelection(),
                    text: text,
                    forceMoveMarkers: true
                  }]);
                }
              }).catch((err: any) => console.error("Paste error:", err));
            }
          } catch (err) {
            console.error("Failed manual paste", err);
          }
        }
      });

      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        if (onSaveFileRef.current) {
          onSaveFileRef.current();
        }
      });
    }).catch((err) => {
      console.error('Failed to load monaco-editor:', err);
    });

    return () => {
      cancelled = true;
      if (disposable) disposable.dispose();
      if (editorInstance) editorInstance.dispose();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update theme when themeMode changes
  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco && isEditorReady) {
      monaco.editor.setTheme(themeMode === 'light' ? 'premium-light' : 'premium-dark');
    }
  }, [themeMode, isEditorReady]);

  // Update editor when active file, content, or sync state changes
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !isEditorReady) return;

    const fileSwitched = lastActiveFileRef.current !== activeFile;
    lastActiveFileRef.current = activeFile;
    
    const newLang = getLanguage(activeFile);
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, newLang);
    }
    editor.updateOptions({ readOnly: isSyncWithBlocks });

    // Programmatic updates: switch file OR content changed from Blockly/external
    const newContent = files[activeFile] || '';
    const currentValue = editor.getValue();
    if (fileSwitched) {
      editor.setValue(newContent);
      editor.setScrollTop(0);
    } else if (currentValue !== newContent) {
      const state = editor.saveViewState();
      editor.setValue(newContent);
      if (state) editor.restoreViewState(state);
    }
  }, [activeFile, files, isSyncWithBlocks, isEditorReady]);

  return (
    <div className={`w-full h-full flex flex-col p-2 gap-2 ${themeMode === 'light' ? 'bg-slate-50/50' : 'bg-[#08090d]/50'}`}>
      {/* ✨ Premium Glassmorphism Tab Bar */}
      <div className={`flex items-center justify-between select-none min-h-0 rounded-xl px-2 py-1.5 shadow-sm backdrop-blur-md border ${themeMode === 'light' ? 'bg-white/80 border-slate-200/80' : 'bg-[#0b0c10]/80 border-slate-800/80'}`}>
        
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] transition-all cursor-pointer font-bold whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? themeMode === 'light'
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100/50 ring-1 ring-indigo-500/10'
                      : 'bg-indigo-500/15 text-indigo-400 shadow-sm border border-indigo-500/20 ring-1 ring-indigo-500/20'
                    : themeMode === 'light'
                      ? 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-700 border border-transparent'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-center">
                  {filename.endsWith('.ino') ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-emerald-500/50'}`} />
                  ) : (filename.endsWith('.c') || filename.endsWith('.h') || filename.endsWith('.cpp') || filename.endsWith('.hpp')) ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]' : 'bg-sky-400/50'}`} />
                  ) : filename.endsWith('.py') ? (
                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-amber-400/50'}`} />
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
            <div className={`flex items-center rounded-full p-0.5 border ${themeMode === 'light' ? 'bg-slate-100/80 border-slate-200/80' : 'bg-slate-900/60 border-slate-800'}`}>
              {isSyncWithBlocks ? (
                <>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${themeMode === 'light' ? 'text-emerald-700 bg-emerald-100/50' : 'text-emerald-400 bg-emerald-500/10'}`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                    <span className="hidden sm:inline">Sync On</span>
                  </div>
                  <button
                    onClick={() => onSyncToggle(false)}
                    className={`flex items-center gap-1 px-3 py-1 ml-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${themeMode === 'light' ? 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                    title="Putuskan sinkronisasi untuk mengedit kode manual"
                  >
                    <Unplug className="w-3 h-3" /> Manual
                  </button>
                </>
              ) : (
                <>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${themeMode === 'light' ? 'text-amber-700 bg-amber-100/50' : 'text-amber-400 bg-amber-500/10'}`}>
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                    <span className="hidden sm:inline">Manual</span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm("Mengaktifkan sinkronisasi akan menimpa kode manual Anda. Lanjutkan?")) {
                        onSyncToggle(true);
                      }
                    }}
                    className={`flex items-center gap-1 px-3 py-1 ml-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${themeMode === 'light' ? 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
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
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              title="Close editor"
            >
              Tutup <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ✨ Premium Editor Container */}
      <div className={`flex-1 min-h-0 relative rounded-xl overflow-hidden border shadow-inner ${themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-slate-800 bg-[#0b0c10]'}`}>
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  );
};
