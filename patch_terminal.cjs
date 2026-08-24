const fs = require('fs');

let code = fs.readFileSync('src/components/layout/TerminalPanel.tsx', 'utf-8');

// 1. Add Lucide icons imports if not present
if (!code.includes('Activity, Terminal, LineChart, Sparkles, Send, ChevronsDown, Cpu, Trash2, ShieldAlert')) {
  code = code.replace(
    /import \{([^\}]+)\} from 'lucide-react';/,
    `import { $1, Activity, Terminal, LineChart, Sparkles, Send, ChevronsDown, Cpu, Trash2, ShieldAlert } from 'lucide-react';`
  );
}

// 2. Find the last return statement (which is the main render)
const returnIndex = code.lastIndexOf('  return (');
if (returnIndex === -1) {
    console.error("Could not find return statement");
    process.exit(1);
}

const newJSX = `  return (
    <>
      {/* Horizontal Resizer for Terminal */}
      {!isTerminalCollapsed && (
        <div 
          className="h-1.5 cursor-row-resize flex items-center justify-center select-none flex-shrink-0 z-20 transition-colors hover:bg-sky-500/30 active:bg-sky-500/50"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsResizingTerminal(true);
          }}
        >
          <div className="w-12 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
        </div>
      )}

      {/* BOTTOM PANELS */}
      <div 
        className={\`panel-terminal flex flex-shrink-0 overflow-hidden \${themeMode === 'light' ? 'bg-[#f8fafc] border-t border-slate-200' : 'bg-[#0f111a] border-t border-slate-800/80 shadow-[0_-4px_24px_rgba(0,0,0,0.2)]'}\`}
        style={{ height: isTerminalCollapsed ? '38px' : \`\${terminalHeight}px\` }}
      >
        <div className="flex-1 min-w-0 flex flex-col">
          
          {/* ✨ Premium Tab Navigation */}
          <div className={\`h-10 flex items-center justify-between px-3 select-none border-b \${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#151722] border-slate-800'}\`}>
            <div className="flex gap-1.5 p-1 rounded-lg">
              
              <button 
                onClick={() => {
                  setTerminalTab('serial');
                  if (port && board) {
                    try {
                      const req = (window as any).__Require || (window as any).require;
                      if (req) {
                        const electron = req('electron');
                        electron.ipcRenderer.invoke('start-serial-monitor', port, board);
                      }
                    } catch(e) {}
                  }
                }}
                className={\`flex items-center gap-2 text-[11px] font-bold tracking-wide cursor-pointer px-3 py-1.5 rounded-md transition-all \${terminalTab === 'serial' ? (themeMode === 'light' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-sm') : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent')}\`}
              >
                <Activity className="w-3.5 h-3.5" /> Serial Monitor
              </button>
              
              <button 
                onClick={() => {
                  setTerminalTab('terminal');
                  try {
                    const req = (window as any).__electronRequire || (window as any).require;
                    if (req) req('electron').ipcRenderer.invoke('stop-serial-monitor');
                  } catch(e) {}
                }}
                className={\`flex items-center gap-2 text-[11px] font-bold tracking-wide cursor-pointer px-3 py-1.5 rounded-md transition-all \${terminalTab === 'terminal' ? (themeMode === 'light' ? 'bg-sky-50 text-sky-700 shadow-sm border border-sky-100' : 'bg-sky-500/20 text-sky-300 border border-sky-500/20 shadow-sm') : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent')}\`}
              >
                <TerminalIcon className="w-3.5 h-3.5" /> Terminal Shell
              </button>
              
              <button 
                onClick={() => {
                  setTerminalTab('plotter');
                  try {
                    const req = (window as any).__electronRequire || (window as any).require;
                    if (req) req('electron').ipcRenderer.invoke('stop-serial-monitor');
                  } catch(e) {}
                }}
                className={\`flex items-center gap-2 text-[11px] font-bold tracking-wide cursor-pointer px-3 py-1.5 rounded-md transition-all \${terminalTab === 'plotter' ? (themeMode === 'light' ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shadow-sm') : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent')}\`}
              >
                <LineChart className="w-3.5 h-3.5" /> Wave Plotter
              </button>
              
              <button 
                onClick={() => {
                  setTerminalTab('ai');
                  try {
                    const req = (window as any).__electronRequire || (window as any).require;
                    if (req) req('electron').ipcRenderer.invoke('stop-serial-monitor');
                  } catch(e) {}
                }}
                className={\`flex items-center gap-2 text-[11px] font-bold tracking-wide cursor-pointer px-3 py-1.5 rounded-md transition-all \${terminalTab === 'ai' ? (themeMode === 'light' ? 'bg-fuchsia-50 text-fuchsia-700 shadow-sm border border-fuchsia-100' : 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/20 shadow-sm') : (themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-transparent' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent')}\`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Assistant
              </button>
              
            </div>

            <div className="flex gap-2 px-2 items-center">
              <button 
                onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                className={\`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full transition-all cursor-pointer \${themeMode === 'light' ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}\`}
              >
                <ChevronsDown className={\`w-3.5 h-3.5 transition-transform \${isTerminalCollapsed ? 'rotate-180' : ''}\`} />
                {isTerminalCollapsed ? 'SHOW' : 'HIDE'}
              </button>
              <button 
                onClick={() => {
                  setTerminalLogs([]);
                  setSerialRawOutput('');
                }}
                className={\`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-full transition-all cursor-pointer \${themeMode === 'light' ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-500/10'}\`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative p-3">
            
            {/* ✨ SERIAL MONITOR */}
            {terminalTab === 'serial' && (
              <div className="flex flex-col h-full gap-3">
                
                {/* Serial Top Control Bar */}
                <div className={\`flex items-center gap-3 p-2 rounded-lg border shadow-sm \${themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-[#1a1c23] border-slate-800'}\`}>
                  <div className="relative">
                    <select 
                      value={serialBaudrate}
                      onChange={(e) => setSerialBaudrate(Number(e.target.value))}
                      className={\`appearance-none pl-3 pr-8 py-1.5 text-xs font-bold rounded-md outline-none cursor-pointer border transition-all \${themeMode === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200' : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}\`}
                    >
                      <option value="9600">9600 baud</option>
                      <option value="115200">115200 baud</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      try {
                        const req = (window as any).__electronRequire || (window as any).require;
                        const electron = req('electron');
                        if (isSerialConnected) {
                          electron.ipcRenderer.invoke('stop-serial-monitor');
                          setIsSerialConnected(false);
                        } else {
                          if (port && port !== 'none') {
                            setTerminalLogs([]);
                            setSerialRawOutput('');
                            electron.ipcRenderer.invoke('start-serial-monitor', port, board, serialBaudrate);
                            setIsSerialConnected(true);
                          }
                        }
                      } catch(e) {}
                    }}
                    className={\`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold tracking-wider transition-all cursor-pointer shadow-sm \${
                      isSerialConnected 
                        ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-rose-500/25 ring-1 ring-rose-600/50'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-emerald-500/25 ring-1 ring-emerald-600/50'
                    } \${(!port || port === 'none') && !isSerialConnected ? 'opacity-50 cursor-not-allowed saturate-0' : ''}\`}
                    disabled={(!port || port === 'none') && !isSerialConnected}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    {isSerialConnected ? 'DISCONNECT' : 'CONNECT'}
                  </button>
                  
                  <div className="flex-1"></div>
                  
                  {isSerialConnected && (
                    <div className={\`flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-full \${themeMode === 'light' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}\`}>
                      <span className="relative flex h-2 w-2">
                        <span className={\`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 \${themeMode === 'light' ? 'bg-emerald-500' : 'bg-emerald-400'}\`}></span>
                        <span className={\`relative inline-flex rounded-full h-2 w-2 \${themeMode === 'light' ? 'bg-emerald-600' : 'bg-emerald-500'}\`}></span>
                      </span>
                      PORT TERHUBUNG
                    </div>
                  )}
                </div>
                
                {/* Serial Output Monitor */}
                <div 
                  className={\`flex-1 overflow-y-auto p-3 text-[13px] leading-relaxed relative rounded-lg border shadow-inner \${themeMode === 'light' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-black border-slate-800 text-emerald-400'}\`} 
                  id="serial-output-container"
                  style={{ fontFamily: "'Fira Code', 'Courier New', monospace" }}
                >
                  <div className="absolute top-2 right-3 text-[10px] font-bold text-slate-500/50 uppercase tracking-widest select-none pointer-events-none">
                    TTY Output
                  </div>
                  {serialRawOutput === '' ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 gap-3">
                      <ShieldAlert className="w-10 h-10 text-slate-500" />
                      <div className="italic text-slate-500 font-sans">
                        {isSerialConnected ? 'Menunggu aliran data serial...' : 'Serial monitor terputus. Klik CONNECT untuk menghubungkan ke perangkat.'}
                      </div>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-all font-mono select-text mt-2 text-shadow-sm">
                      {serialRawOutput}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* ✨ TERMINAL SHELL */}
            {terminalTab === 'terminal' && (
              <div className={\`flex flex-col h-full rounded-lg border shadow-inner p-2 \${themeMode === 'light' ? 'bg-[#fcfcfc] border-slate-200' : 'bg-[#0b0d14] border-slate-800'}\`}>
                <div className="flex-1 overflow-y-auto space-y-1 mb-2 font-mono text-[12px] leading-relaxed px-1">
                  {interactiveTerminalLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={
                        log.type === 'input' ? (themeMode === 'light' ? 'text-indigo-600 font-bold' : 'text-cyan-400 font-bold') :
                        log.type === 'error' ? (themeMode === 'light' ? 'text-rose-600 font-bold' : 'text-rose-400 font-bold') :
                        log.type === 'success' ? (themeMode === 'light' ? 'text-emerald-600 font-bold' : 'text-emerald-400 font-bold') :
                        (themeMode === 'light' ? 'text-slate-700' : 'text-slate-300')
                      }
                    >
                      {log.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalCommand} className={\`flex items-center gap-2 border-t pt-2 flex-shrink-0 \${themeMode === 'light' ? 'border-slate-200' : 'border-slate-800'}\`}>
                  <span className={\`font-bold font-mono text-[12px] select-none \${themeMode === 'light' ? 'text-indigo-600' : 'text-indigo-400'}\`}>
                    <span className={\`\${themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'}\`}>➜</span> <span className={\`\${themeMode === 'light' ? 'text-cyan-600' : 'text-cyan-400'}\`}>~</span>/robolab-studio
                  </span>
                  <input 
                    type="text" 
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Ketik 'help' atau perintah sistem..."
                    className={\`flex-1 bg-transparent font-mono text-[12px] border-none focus:outline-none focus:ring-0 p-0 \${themeMode === 'light' ? 'text-slate-900 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'}\`}
                    autoComplete="off"
                    spellCheck="false"
                  />
                </form>
              </div>
            )}

            {/* ✨ WAVE PLOTTER */}
            {terminalTab === 'plotter' && (
              <div className={\`w-full h-full flex flex-col relative rounded-lg border shadow-inner overflow-hidden \${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'}\`}>
                
                {/* Floating Legend */}
                <div className="absolute top-3 left-3 z-10 flex gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white font-bold tracking-wider shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    MOTOR KIRI
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white font-bold tracking-wider shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"></div>
                    MOTOR KANAN
                  </div>
                </div>

                <div className="flex-1 h-full w-full relative">
                  {/* Grid overlay for tech look */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                       style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  </div>
                  <canvas 
                    ref={plotterCanvasRef} 
                    width={400} 
                    height={160}
                    className="w-full h-full absolute inset-0"
                  />
                </div>
              </div>
            )}

            {/* ✨ AI ASSISTANT */}
            {terminalTab === 'ai' && (
              <div className={\`w-full h-full flex flex-col rounded-lg border shadow-sm overflow-hidden \${themeMode === 'light' ? 'bg-slate-50/50 border-slate-200' : 'bg-[#0f111a] border-slate-800'}\`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-2 select-text text-[12.5px] leading-relaxed">
                  
                  {/* AI Greeting Bubble */}
                  {aiChat.length === 0 && (
                    <div className="flex justify-start">
                      <div className={\`max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm \${themeMode === 'light' ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-200'}\`}>
                        <div className="font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 text-fuchsia-500">
                          <Sparkles className="w-3.5 h-3.5" /> AI Assistant
                        </div>
                        <p>Halo! Saya asisten pintar RoboLab Studio. Ada yang bisa saya bantu dengan kode Anda, penjelasan komponen, atau cara merakit robot?</p>
                      </div>
                    </div>
                  )}

                  {aiChat.map((msg, i) => (
                    <div key={i} className={\`flex \${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300\`}>
                      <div className={\`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm \${
                        msg.sender === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : (themeMode === 'light' ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm')
                      }\`}>
                        {msg.sender !== 'user' && (
                          <div className="font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider mb-2 text-fuchsia-500">
                            <Sparkles className="w-3.5 h-3.5" /> AI Assistant
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={\`p-3 bg-opacity-50 flex-shrink-0 \${themeMode === 'light' ? 'bg-white border-t border-slate-200' : 'bg-slate-900 border-t border-slate-800'}\`}>
                  <div className={\`flex items-center gap-2 rounded-full px-4 py-2 border shadow-sm focus-within:ring-2 focus-within:ring-fuchsia-500/30 transition-all \${themeMode === 'light' ? 'bg-slate-100 border-slate-200 focus-within:bg-white' : 'bg-black/50 border-slate-700 focus-within:bg-slate-800'}\`}>
                    <input 
                      type="text" 
                      placeholder="Tanya AI tentang error kode, komponen, atau robotik..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendChat();
                      }}
                      className="flex-1 bg-transparent text-[12px] font-medium focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={!aiInput.trim()}
                      className={\`p-1.5 rounded-full transition-all \${aiInput.trim() ? 'bg-fuchsia-600 text-white shadow-md hover:bg-fuchsia-500 hover:scale-105 cursor-pointer' : 'bg-slate-300 dark:bg-slate-700 text-slate-400 cursor-not-allowed'}\`}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default TerminalPanel;
`;

code = code.substring(0, returnIndex) + newJSX;
fs.writeFileSync('src/components/layout/TerminalPanel.tsx', code);
console.log('Patched TerminalPanel successfully');
