import React, { useState, useRef, useEffect, type FormEvent } from 'react';
import { 
  Trash2, Cpu, Send, Sparkles, ChevronsDown, Activity, Terminal, 
  Settings, Check, Copy, FileCode, Zap, BookOpen, X, Radio, Bot,
  ChevronRight, Wifi, WifiOff
} from 'lucide-react';
import type { KiloCodeConfig, ChatMessage } from '../../services/kilocodeService';
import { DATASHEET_DATABASE } from '../../data/datasheetDb';
import type { ComponentDatasheet } from '../../data/datasheetDb';
import {
  startWebSerialMonitor,
  stopWebSerialMonitor,
  sendWebSerialData,
} from '../../services/webSerialService';

interface TerminalPanelProps {
  isTerminalCollapsed: boolean;
  setIsTerminalCollapsed: (val: boolean) => void;
  terminalHeight: number;
  setIsResizingTerminal: (val: boolean) => void;
  terminalTab: 'serial' | 'terminal' | 'problems' | 'ai';
  setTerminalTab: (tab: 'serial' | 'terminal' | 'problems' | 'ai') => void;
  port: string;
  board: string;
  themeMode: 'light' | 'dark';
  
  terminalLogs?: Array<{ text: string, type: 'info' | 'error' | 'success' | 'stdout' }>;
  setTerminalLogs: React.Dispatch<React.SetStateAction<Array<{ text: string, type: 'info' | 'error' | 'success' | 'stdout' }>>>;
  
  serialRawOutput: string;
  setSerialRawOutput: React.Dispatch<React.SetStateAction<string>>;
  
  interactiveTerminalLogs: Array<{ text: string, type: 'input' | 'output' | 'error' | 'success' }>;
  setInteractiveTerminalLogs?: React.Dispatch<React.SetStateAction<Array<{ text: string, type: 'input' | 'output' | 'error' | 'success' }>>>;
  
  serialBaudrate: number;
  setSerialBaudrate: (baud: number) => void;
  isSerialConnected: boolean;
  setIsSerialConnected: (connected: boolean) => void;
  
  terminalInput: string;
  setTerminalInput: (val: string) => void;
  handleTerminalCommand: (e: FormEvent) => void;
  
  aiChat: Array<ChatMessage>;
  aiInput: string;
  setAiInput: (val: string) => void;
  handleSendChat: (customPrompt?: string) => void;

  kiloConfig?: KiloCodeConfig;
  setKiloConfig?: (cfg: KiloCodeConfig) => void;
  onApplyCodeToEditor?: (code: string) => void;
  onClearChat?: () => void;
  activeFileName?: string;
  activeComponents?: string[];
  isAiLoading?: boolean;
}

// ─── Inline Markdown Renderer ────────────────────────────────────────────────
function renderInlineMd(text: string, keyPrefix: string, isLight: boolean): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const inlineRe = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = inlineRe.exec(text)) !== null) {
    if (m.index > last) nodes.push(<span key={`${keyPrefix}-t${idx++}`}>{text.slice(last, m.index)}</span>);
    if (m[2]) nodes.push(
      <strong key={`${keyPrefix}-b${idx++}`} className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
        {m[2]}
      </strong>
    );
    else if (m[3]) nodes.push(
      <em key={`${keyPrefix}-i${idx++}`} className={`italic ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
        {m[3]}
      </em>
    );
    else if (m[4]) nodes.push(
      <code key={`${keyPrefix}-c${idx++}`} className={`px-1.5 py-0.5 rounded-md font-mono text-[10.5px] ${isLight ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-slate-800 text-sky-300 border border-slate-700'}`}>
        {m[4]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(<span key={`${keyPrefix}-t${idx}`}>{text.slice(last)}</span>);
  return nodes;
}

interface MessageBlock {
  type: 'text' | 'code';
  lang?: string;
  content: string;
}

function parseMarkdownBlocks(text: string): MessageBlock[] {
  const lines = text.split('\n');
  const blocks: MessageBlock[] = [];
  let inCode = false;
  let currentLang = '';
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeFenceMatch = line.match(/^```(\w+)?/);

    if (codeFenceMatch) {
      if (!inCode) {
        if (currentLines.length > 0) {
          blocks.push({ type: 'text', content: currentLines.join('\n') });
          currentLines = [];
        }
        inCode = true;
        currentLang = codeFenceMatch[1] || 'code';
      } else {
        blocks.push({ type: 'code', lang: currentLang || 'code', content: currentLines.join('\n') });
        currentLines = [];
        inCode = false;
        currentLang = '';
      }
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    if (inCode) {
      blocks.push({ type: 'code', lang: currentLang || 'code', content: currentLines.join('\n') });
    } else {
      blocks.push({ type: 'text', content: currentLines.join('\n') });
    }
  }

  return blocks;
}

// ─── Formatted Message Component ─────────────────────────────────────────────
const FormattedMessage: React.FC<{
  content: string;
  themeMode: 'light' | 'dark';
  onApplyCodeToEditor?: (code: string) => void;
}> = ({ content, themeMode, onApplyCodeToEditor }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [appliedIdx, setAppliedIdx] = useState<number | null>(null);
  const isLight = themeMode === 'light';

  const blocks = parseMarkdownBlocks(content);

  const renderTextPart = (text: string, partIdx: number) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    let listKey = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${partIdx}-${listKey++}`} className="space-y-1 my-2 pl-1">
            {listItems}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, li) => {
      const key = `p${partIdx}-l${li}`;
      const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
      if (headingMatch) {
        flushList();
        const level = headingMatch[1].length;
        const hClass = level === 1
          ? `text-[13px] font-bold mt-3 mb-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`
          : level === 2
          ? `text-[12px] font-bold mt-2.5 mb-1 ${isLight ? 'text-slate-800' : 'text-slate-100'}`
          : `text-[11.5px] font-semibold mt-2 mb-0.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;
        elements.push(<div key={key} className={hClass}>{renderInlineMd(headingMatch[2], key, isLight)}</div>);
        return;
      }
      const listMatch = line.match(/^(\s*[-*]|\s*\d+\.)\s+(.+)/);
      if (listMatch) {
        listItems.push(
          <li key={`${key}-li`} className={`flex items-start gap-2 text-[12px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLight ? 'bg-sky-500' : 'bg-sky-400'}`} />
            <span>{renderInlineMd(listMatch[2], `${key}-li`, isLight)}</span>
          </li>
        );
        return;
      }
      flushList();
      if (line.trim() === '') {
        elements.push(<div key={key} className="h-1.5" />);
      } else {
        elements.push(
          <div key={key} className={`text-[12px] leading-relaxed break-words ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            {renderInlineMd(line, key, isLight)}
          </div>
        );
      }
    });
    flushList();
    return elements;
  };

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => {
        if (block.type === 'code') {
          const lang = block.lang || 'code';
          const codeText = block.content;

          const handleCopy = () => {
            navigator.clipboard.writeText(codeText);
            setCopiedIdx(index);
            setTimeout(() => setCopiedIdx(null), 2000);
          };

          const handleApply = () => {
            if (onApplyCodeToEditor) {
              onApplyCodeToEditor(codeText);
              setAppliedIdx(index);
              setTimeout(() => setAppliedIdx(null), 2500);
            }
          };

          return (
            <div key={index} className={`my-3 rounded-xl overflow-hidden border shadow-lg select-text max-w-full ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d0f18] border-slate-700/60'}`}>
              {/* Code block header */}
              <div className={`flex items-center justify-between px-4 py-2 border-b ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-gradient-to-r from-[#161a27] to-[#1a1e2e] border-slate-700/50'}`}>
                <span className={`flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-sky-400'}`}>
                  <FileCode className="w-3.5 h-3.5" />
                  {lang}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-[10px] font-medium cursor-pointer border ${isLight ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/50 hover:border-slate-600'}`}
                    title="Salin Kode"
                  >
                    {copiedIdx === index
                      ? <><Check className="w-3 h-3 text-emerald-500" /><span className="text-emerald-500">Tersalin!</span></>
                      : <><Copy className="w-3 h-3" /><span>Salin</span></>
                    }
                  </button>
                  {onApplyCodeToEditor && (
                    <button
                      onClick={handleApply}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md transition-all text-[10px] cursor-pointer"
                      title="Terapkan Kode ke Editor"
                    >
                      {appliedIdx === index ? (
                        <><Check className="w-3 h-3" /><span>Diterapkan!</span></>
                      ) : (
                        <><Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" /><span>Terapkan</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className={`overflow-x-auto w-full ${isLight ? 'bg-white' : 'bg-[#080a12]'}`}>
                <pre className={`p-4 text-[11.5px] font-mono leading-relaxed w-max min-w-full ${isLight ? 'text-slate-800' : 'text-emerald-300'}`}>
                  <code>{codeText}</code>
                </pre>
              </div>
            </div>
          );
        }

        return (
          <div key={index} className="leading-relaxed">
            {renderTextPart(block.content, index)}
          </div>
        );
      })}
    </div>
  );
};

// ─── Typing Indicator Dots ─────────────────────────────────────────────────
const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map(i => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-sky-400"
        style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
      />
    ))}
    <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
  </div>
);

// ─── Main Terminal Panel ──────────────────────────────────────────────────────
export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isTerminalCollapsed,
  setIsTerminalCollapsed,
  terminalHeight,
  setIsResizingTerminal,
  terminalTab,
  setTerminalTab,
  port,
  board,
  themeMode,
  terminalLogs: _terminalLogs = [],
  setTerminalLogs,
  serialRawOutput,
  setSerialRawOutput,
  interactiveTerminalLogs,
  serialBaudrate,
  setSerialBaudrate,
  isSerialConnected,
  setIsSerialConnected,
  terminalInput,
  setTerminalInput,
  handleTerminalCommand,
  aiChat,
  aiInput,
  setAiInput,
  handleSendChat,
  kiloConfig,
  setKiloConfig,
  onApplyCodeToEditor,
  onClearChat,
  activeFileName = 'firmware/main.ino',
  activeComponents = [],
  isAiLoading = false
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDatasheetModal, setShowDatasheetModal] = useState(false);
  const [selectedDsKey, setSelectedDsKey] = useState<string>('esp32');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [tempApiKey, setTempApiKey] = useState(kiloConfig?.apiKey || '');
  const [tempEndpoint, setTempEndpoint] = useState(kiloConfig?.endpoint || 'https://api.kilo.ai/api/gateway');
  const [tempModel, setTempModel] = useState(kiloConfig?.model || 'kilo-auto/free');

  const isLight = themeMode === 'light';
  const isKiloConnected = Boolean(kiloConfig?.apiKey?.trim());
  const selectedDatasheet: ComponentDatasheet = DATASHEET_DATABASE[selectedDsKey] || DATASHEET_DATABASE.esp32;

  // Auto-scroll chat container to bottom without affecting window/parent scroll
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [aiChat, isAiLoading]);

  const handleSaveSettings = () => {
    if (setKiloConfig) {
      setKiloConfig({
        apiKey: tempApiKey.trim(),
        endpoint: tempEndpoint.trim() || 'https://api.kilo.ai/api/gateway',
        model: tempModel.trim() || 'kilo-auto/free'
      });
    }
    setShowSettingsModal(false);
  };

  const [serialTxInput, setSerialTxInput] = useState('');

  // ─── Tab button helper ───────────────────────────────────────────────────
  const tabBtn = (
    tab: typeof terminalTab,
    icon: React.ReactNode,
    label: string,
    activeColor: string
  ) => (
    <button
      onClick={() => {
        setTerminalTab(tab);
        if (tab !== 'serial') {
          try {
            const req = (window as any).__electronRequire || (window as any).require;
            if (req) req('electron').ipcRenderer.invoke('stop-serial-monitor');
            else stopWebSerialMonitor();
          } catch(e) {}
        } else if (port && port !== 'none' && board) {
          try {
            const req = (window as any).__electronRequire || (window as any).require;
            if (req) {
              req('electron').ipcRenderer.invoke('start-serial-monitor', port, board, serialBaudrate);
              setIsSerialConnected(true);
            }
          } catch(e) {}
        }
      }}
      className={`
        flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200
        ${terminalTab === tab
          ? isLight
            ? `${activeColor} shadow-sm`
            : `${activeColor} shadow-sm`
          : isLight
            ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
        }
      `}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );


  return (
    <>
      {/* ─── Resize Handle ──────────────────────────────────────────────── */}
      {!isTerminalCollapsed && (
        <div
          className={`h-1.5 cursor-row-resize flex items-center justify-center select-none flex-shrink-0 z-20 group transition-colors
            ${isLight ? 'hover:bg-sky-400/30' : 'hover:bg-sky-500/25'}`}
          onMouseDown={(e) => { e.preventDefault(); setIsResizingTerminal(true); }}
        >
          <div className={`w-10 h-0.5 rounded-full transition-all group-hover:w-16 ${isLight ? 'bg-slate-300 group-hover:bg-sky-400' : 'bg-slate-700 group-hover:bg-sky-500'}`} />
        </div>
      )}

      {/* ─── Main Panel Container ────────────────────────────────────────── */}
      <div
        className={`panel-terminal flex flex-shrink-0 overflow-hidden transition-all
          ${isLight
            ? 'bg-slate-50 border-t border-slate-200/80'
            : 'bg-[#0c0e16] border-t border-slate-800/60 shadow-[0_-8px_32px_rgba(0,0,0,0.4)]'
          }`}
        style={{ height: isTerminalCollapsed ? '38px' : `${terminalHeight}px` }}
      >
        <div className="flex-1 min-w-0 flex flex-col">

          {/* ─── Tab Bar ──────────────────────────────────────────────────── */}
          <div className={`h-10 flex items-center justify-between px-2 select-none border-b flex-shrink-0
            ${isLight ? 'bg-white border-slate-200/80' : 'bg-[#10121c] border-slate-800/60'}`}>
            
            <div className="flex items-center gap-0.5 px-1">
              {tabBtn('serial',   <Activity  className="w-3.5 h-3.5" />, 'Serial',   isLight ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20')}
              {tabBtn('terminal', <Terminal  className="w-3.5 h-3.5" />, 'Terminal', isLight ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-sky-500/15 text-sky-400 border border-sky-500/20')}
              
              {/* AI Tab — special gradient style */}
              <button
                onClick={() => { setTerminalTab('ai'); try { const req = (window as any).__electronRequire || (window as any).require; if (req) req('electron').ipcRenderer.invoke('stop-serial-monitor'); else stopWebSerialMonitor(); } catch(e) {} }}
                className={`flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg transition-all duration-200
                  ${terminalTab === 'ai'
                    ? 'bg-gradient-to-r from-sky-500/15 to-blue-500/15 text-sky-400 border border-sky-500/20 shadow-sm'
                    : isLight
                      ? 'text-slate-500 hover:text-sky-600 hover:bg-sky-50'
                      : 'text-slate-500 hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Asisten Robolab AI</span>
              </button>
            </div>

            <div className="flex items-center gap-1 pr-1">
              <button
                onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer
                  ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'}`}
              >
                <ChevronsDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isTerminalCollapsed ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => {
                  if (terminalTab === 'ai' && onClearChat) { onClearChat(); }
                  else { setTerminalLogs([]); setSerialRawOutput(''); }
                }}
                className={`flex items-center gap-1 text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer
                  ${isLight ? 'text-rose-500 hover:bg-rose-50' : 'text-rose-500 hover:bg-rose-500/10'}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ─── Panel Content ─────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 relative overflow-hidden">

            {/* SERIAL MONITOR */}
            {terminalTab === 'serial' && (
              <div className="absolute inset-0 flex flex-col gap-2 p-3">
                <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#141620] border-slate-800'}`}>
                  <select
                    value={serialBaudrate}
                    onChange={(e) => setSerialBaudrate(Number(e.target.value))}
                    className={`appearance-none px-3 py-1.5 text-xs font-semibold rounded-lg outline-none cursor-pointer border transition-all
                      ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400 focus:border-indigo-500' : 'bg-[#0c0e16] border-slate-700 text-slate-200 hover:border-slate-500'}`}
                  >
                    <option value="9600">9600 baud</option>
                    <option value="115200">115200 baud</option>
                  </select>
                  <button
                    onClick={async () => {
                      try {
                        const req = (window as any).__electronRequire || (window as any).require;
                        if (req) {
                          if (port && port !== 'none' && board) {
                            const electron = req('electron');
                            if (isSerialConnected) {
                              electron.ipcRenderer.invoke('stop-serial-monitor');
                              setIsSerialConnected(false);
                            } else {
                              electron.ipcRenderer.invoke('start-serial-monitor', port, board, serialBaudrate);
                              setIsSerialConnected(true);
                            }
                          }
                        } else {
                          // Web Browser Mode — Web Serial API
                          if (isSerialConnected) {
                            await stopWebSerialMonitor();
                            setIsSerialConnected(false);
                          } else {
                            const res = await startWebSerialMonitor(
                              port,
                              serialBaudrate,
                              (chunk) => {
                                setSerialRawOutput((prev) => {
                                  const next = prev + chunk;
                                  return next.length > 50000 ? next.slice(next.length - 50000) : next;
                                });
                              },
                              () => {
                                setIsSerialConnected(false);
                              }
                            );
                            if (res.success) {
                              setIsSerialConnected(true);
                            } else if (res.error) {
                              setSerialRawOutput((prev) => prev + `\r\n[WebSerial Error] ${res.error}\r\n`);
                            }
                          }
                        }
                      } catch(e) {}
                    }}
                    className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer
                      ${isSerialConnected ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                  >
                    {isSerialConnected ? <><WifiOff className="w-3.5 h-3.5" />Disconnect</> : <><Wifi className="w-3.5 h-3.5" />Connect (WebUSB / Serial)</>}
                  </button>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!serialTxInput) return;
                      await sendWebSerialData(serialTxInput + '\r\n');
                      setSerialTxInput('');
                    }}
                    className="flex-1 flex gap-2 ml-2"
                  >
                    <input
                      type="text"
                      value={serialTxInput}
                      onChange={(e) => setSerialTxInput(e.target.value)}
                      placeholder="Kirim pesan ke Serial Port (Enter)..."
                      className={`flex-1 px-3 py-1 text-xs font-mono rounded-lg border outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                          : 'bg-[#0c0e16] border-slate-700 text-slate-200 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Kirim
                    </button>
                  </form>
                </div>
                <div className={`flex-1 p-3 rounded-xl border font-mono text-xs overflow-y-auto ${isLight ? 'bg-slate-900 text-emerald-400 border-slate-700' : 'bg-[#070810] text-emerald-400 border-slate-800'}`}>
                  <pre className="whitespace-pre-wrap">{serialRawOutput || 'Belum ada data Serial...'}</pre>
                </div>
              </div>
            )}

            {/* TERMINAL SHELL */}
            {terminalTab === 'terminal' && (
              <div className="absolute inset-0 flex flex-col gap-2 p-3">
                <div className={`flex-1 p-3 rounded-xl border font-mono text-xs overflow-y-auto space-y-1 ${isLight ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-[#070810] text-slate-100 border-slate-800'}`}>
                  {interactiveTerminalLogs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-2 ${log.type === 'input' ? 'text-sky-400 font-bold' : log.type === 'error' ? 'text-rose-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'}`}>
                      <span className="text-slate-500">{log.type === 'input' ? '❯' : '·'}</span>
                      <span className="whitespace-pre-wrap">{log.text}</span>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleTerminalCommand} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik perintah shell..."
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border outline-none transition-all
                      ${isLight ? 'bg-white border-slate-300 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20' : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'}`}
                  />
                  <button type="submit" className="px-4 py-1.5 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-all cursor-pointer">
                    Kirim
                  </button>
                </form>
              </div>
            )}

            {/* AI PANEL */}
            {terminalTab === 'ai' && (
              <div className={`absolute inset-0 flex flex-col overflow-hidden
                ${isLight ? 'bg-gradient-to-b from-slate-50 to-white' : 'bg-gradient-to-b from-[#0c0e16] to-[#0a0c14]'}`}>

                {/* ── AI Header ─────────────────────────────────────────── */}
                <div className={`flex-shrink-0 px-4 py-2.5 flex items-center justify-between border-b backdrop-blur-sm
                  ${isLight ? 'bg-white/90 border-slate-200/80' : 'bg-[#10121e]/90 border-slate-800/60'}`}>

                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isLight ? 'border-white' : 'border-[#10121e]'} ${isKiloConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    </div>

                    {/* Name + status */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-[12.5px] tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          Asisten Robolab AI
                        </span>
                        {isKiloConnected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                            <Radio className="w-2 h-2 animate-pulse" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                            <Cpu className="w-2 h-2" /> Lokal
                          </span>
                        )}
                      </div>
                      <p className={`text-[10px] leading-tight truncate max-w-[280px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className={`font-medium ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>{board}</span>
                        <span className="mx-1 opacity-40">·</span>
                        <span className="font-mono opacity-70">{activeFileName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setShowDatasheetModal(true)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer
                        ${isLight ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-slate-300 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50'}`}
                      title="Lihat Datasheet Komponen"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-sky-500" />
                      <span className="hidden md:inline">Datasheet</span>
                    </button>
                    <button
                      onClick={() => {
                        setTempApiKey(kiloConfig?.apiKey || '');
                        setTempEndpoint(kiloConfig?.endpoint || 'https://api.kilo.ai/api/gateway');
                        setTempModel(kiloConfig?.model || 'kilo-auto/free');
                        setShowSettingsModal(true);
                      }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer
                        ${isLight ? 'text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-slate-400 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50'}`}
                      title="Pengaturan Asisten AI"
                    >
                      <Settings className="w-4 h-4 text-sky-500" />
                    </button>
                  </div>
                </div>

                {/* ── Quick Chips ────────────────────────────────────────── */}
                <div className={`flex-shrink-0 px-4 py-2 flex items-center gap-2 overflow-x-auto border-b scrollbar-none
                  ${isLight ? 'bg-slate-50/80 border-slate-200/60' : 'bg-[#0e1018]/80 border-slate-800/40'}`}>
                  {[
                    { emoji: '🔍', label: 'Analisis Kode', prompt: 'Analisis kode aktif saya dan berikan saran optimasi', colorL: 'text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100', colorD: 'text-sky-300 bg-sky-500/10 border-sky-500/25 hover:bg-sky-500/20' },
                    { emoji: '🛠️', label: 'Perbaiki Error', prompt: 'Perbaiki potensi error syntax atau logika pada kode ini', colorL: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100', colorD: 'text-rose-300 bg-rose-500/10 border-rose-500/25 hover:bg-rose-500/20' },
                    { emoji: '🔌', label: 'Rangkaian', prompt: 'Analisis rangkaian simulator dan rekomendasikan pin wiring', colorL: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100', colorD: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25 hover:bg-emerald-500/20' },
                    { emoji: '📖', label: 'Datasheet', onClick: () => setShowDatasheetModal(true), colorL: 'text-sky-700 bg-sky-50 border-sky-200 hover:bg-sky-100', colorD: 'text-sky-300 bg-sky-500/10 border-sky-500/25 hover:bg-sky-500/20' },
                  ].map(chip => (
                    <button
                      key={chip.label}
                      onClick={() => chip.onClick ? chip.onClick() : handleSendChat(chip.prompt)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border
                        ${isLight ? chip.colorL : chip.colorD}`}
                    >
                      <span>{chip.emoji}</span>
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>

                {/* ── Chat Scroll Area ───────────────────────────────────── */}
                <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 select-text">

                  {/* Welcome state */}
                  {aiChat.length === 0 && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className={`max-w-[90%] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm border
                        ${isLight ? 'bg-white border-slate-200/80 text-slate-700' : 'bg-[#151827] border-slate-700/50 text-slate-200'}`}>
                        
                        <div className={`flex items-center gap-2 mb-3 pb-2.5 border-b ${isLight ? 'border-slate-100' : 'border-slate-700/50'}`}>
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className={`font-bold text-[11px] uppercase tracking-widest bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent`}>
                            Asisten Robolab AI
                          </span>
                        </div>

                        <p className={`mb-3 text-[12.5px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
                          Halo! Saya <strong className={isLight ? 'text-slate-900' : 'text-white'}>Asisten Robolab AI</strong>, siap membantu Anda di RoboLab Studio. 👋
                        </p>

                        <div className="space-y-2">
                          {[
                            { icon: '✦', text: `Menganalisis & mengedit kode`, sub: activeFileName },
                            { icon: '✦', text: `Mendiagnosis rangkaian simulator`, sub: activeComponents.length > 0 ? activeComponents.join(', ') : 'Belum ada komponen' },
                            { icon: '✦', text: 'Datasheet teknis & pinout komponen', sub: 'ESP32, Arduino, DHT11, Servo, dll.' },
                          ].map((item, i) => (
                            <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${isLight ? 'bg-slate-50 border border-slate-100' : 'bg-slate-800/30 border border-slate-700/30'}`}>
                              <span className={`text-xs font-bold mt-0.5 ${isLight ? 'text-sky-500' : 'text-sky-400'}`}>{item.icon}</span>
                              <div className="min-w-0">
                                <p className={`text-[11.5px] font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item.text}</p>
                                <p className={`text-[10.5px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  {aiChat.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start min-w-0 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                    >
                      {/* AI avatar */}
                      {msg.sender !== 'user' && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mr-2 mt-1 shadow-sm">
                          <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      {/* Bubble — min-w-0 + overflow-hidden prevents content escape */}
                      <div className={`min-w-0 max-w-[82%] overflow-hidden rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === 'user'
                          ? isLight
                            ? 'bg-sky-100 border border-sky-200/60 text-sky-950 rounded-tr-sm shadow-lg shadow-sky-500/5'
                            : 'bg-sky-600/25 border border-sky-500/30 text-sky-100 rounded-tr-sm shadow-lg shadow-sky-900/10'
                          : isLight
                            ? 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-sm shadow-slate-200/60'
                            : 'bg-[#151827] border border-slate-700/50 text-slate-200 rounded-tl-sm'
                      }`}>

                        {/* AI message header */}
                        {msg.sender !== 'user' && (
                          <div className={`flex items-center gap-2 mb-2 pb-1.5 border-b ${isLight ? 'border-slate-100' : 'border-slate-700/40'}`}>
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                              Asisten Robolab AI
                            </span>
                            {msg.isKiloCode && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${isLight ? 'bg-sky-100 text-sky-600 border border-sky-200' : 'bg-sky-500/15 text-sky-400 border border-sky-500/25'}`}>
                                AI
                              </span>
                            )}
                          </div>
                        )}

                        {/* User text */}
                        {msg.sender === 'user' ? (
                          <p className={`text-[12.5px] font-medium leading-relaxed break-words ${isLight ? 'text-sky-950' : 'text-sky-100'}`}>{msg.message}</p>
                        ) : (
                          <div className="min-w-0 overflow-hidden">
                            <FormattedMessage
                              content={msg.message}
                              themeMode={themeMode}
                              onApplyCodeToEditor={onApplyCodeToEditor}
                            />
                          </div>
                        )}
                      </div>

                      {/* User avatar */}
                      {msg.sender === 'user' && (
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center ml-2 mt-1 shadow-sm">
                          <span className="text-[10px] font-bold text-white">U</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isAiLoading && (
                    <div className="flex items-start justify-start animate-in fade-in duration-300">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mr-2 mt-1 shadow-sm">
                        <Bot className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className={`rounded-2xl rounded-tl-sm px-4 py-3 border shadow-sm
                        ${isLight ? 'bg-white border-slate-200/80' : 'bg-[#151827] border-slate-700/50'}`}>
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">
                          Asisten Robolab AI
                        </div>
                        <div className="flex items-center gap-3">
                          <TypingDots />
                          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>sedang mengetik...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Chat Input Bar ─────────────────────────────────────── */}
                <div className={`flex-shrink-0 p-3 border-t
                  ${isLight ? 'bg-white/90 border-slate-200/80' : 'bg-[#10121e]/90 border-slate-800/50'}`}>
                  <div className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-all duration-200
                    ${isLight
                      ? 'bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-400/20 shadow-sm'
                      : 'bg-slate-900/80 border-slate-700/50 focus-within:border-sky-500/50 focus-within:ring-2 focus-within:ring-sky-500/15 shadow-lg'
                    }`}>
                    <Sparkles className={`w-4 h-4 flex-shrink-0 ${isLight ? 'text-sky-400' : 'text-sky-500'}`} />
                    <input
                      type="text"
                      placeholder={isAiLoading ? 'AI sedang memproses...' : 'Tanyakan sesuatu kepada Asisten Robolab AI...'}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      onKeyUp={(e) => e.stopPropagation()}
                      onKeyPress={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter' && !isAiLoading && aiInput.trim()) {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      className={`flex-1 bg-transparent text-[12px] font-medium focus:outline-none disabled:opacity-40
                        ${isLight ? 'text-slate-800 placeholder-slate-400' : 'text-slate-100 placeholder-slate-600'}`}
                    />
                    {isAiLoading ? (
                      <button
                        onClick={() => onClearChat && onClearChat()}
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[10px] font-semibold transition-all cursor-pointer"
                        title="Batalkan permintaan"
                      >
                        <X className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendChat()}
                        disabled={!aiInput.trim()}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all duration-200
                          ${aiInput.trim()
                            ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md hover:shadow-lg hover:shadow-sky-500/30 hover:scale-105 cursor-pointer'
                            : isLight ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                          }`}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className={`text-center text-[9.5px] mt-1.5 ${isLight ? 'text-slate-400' : 'text-slate-700'}`}>
                    Tekan <kbd className={`px-1 py-0.5 rounded text-[9px] font-mono border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>Enter</kbd> untuk mengirim
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          ⚙️ SETTINGS MODAL — Premium Design
      ════════════════════════════════════════════════════════════════════════ */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowSettingsModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden
            ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#141620] border-slate-700/60 text-slate-100'}`}>

            {/* Modal gradient header */}
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600" />

            <div className="p-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className={`absolute top-5 right-5 p-1.5 rounded-lg transition-all cursor-pointer
                  ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/25">
                  <Settings className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className={`font-bold text-[15px] ${isLight ? 'text-slate-900' : 'text-white'}`}>Pengaturan Asisten Robolab AI</h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Konfigurasi kunci API dan model LLM</p>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  { label: 'API Key', sublabel: 'Kosongkan untuk Mode AI Lokal bawaan', placeholder: 'sk-...', value: tempApiKey, onChange: setTempApiKey, type: 'password' },
                  { label: 'Endpoint URL', sublabel: '', placeholder: 'https://api.kilo.ai/api/gateway', value: tempEndpoint, onChange: setTempEndpoint, type: 'text' },
                ].map(field => (
                  <div key={field.label}>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition-all
                        ${isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-100 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15'
                        }`}
                    />
                    {field.sublabel && <p className={`text-[10.5px] mt-1 ${isLight ? 'text-slate-400' : 'text-slate-400'}`}>{field.sublabel}</p>}
                  </div>
                ))}

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Model Name</label>
                  <input
                    type="text"
                    placeholder="kilo-auto/free"
                    value={tempModel}
                    onChange={(e) => setTempModel(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition-all
                      ${isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                        : 'bg-slate-900/60 border-slate-700/60 text-slate-100 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/15'
                      }`}
                  />
                  <div className={`flex gap-2 mt-2 flex-wrap`}>
                    {['kilo-auto/free', 'kilo-auto/balanced', 'stepfun/step-3.7-flash:free'].map(m => (
                      <button
                        key={m}
                        onClick={() => setTempModel(m)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-mono font-medium transition-all cursor-pointer
                          ${tempModel === m
                            ? isLight ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : isLight ? 'text-slate-500 hover:text-sky-600 bg-slate-100 border border-slate-200 hover:border-sky-200' : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border border-slate-700/50'
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
                    ${isLight ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200' : 'text-slate-400 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50'}`}
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/25 transition-all cursor-pointer hover:scale-105"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          📖 DATASHEET BROWSER MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      {showDatasheetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-md" onClick={() => setShowDatasheetModal(false)} />
          <div className={`relative w-full max-w-3xl h-[82vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden
            ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#11131f] border-slate-700/60 text-slate-100'}`}>

            {/* Gradient accent */}
            <div className="h-1 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 flex-shrink-0" />

            {/* Modal Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b flex-shrink-0
              ${isLight ? 'bg-white border-slate-200/80' : 'bg-[#151825] border-slate-800/60'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isLight ? 'bg-sky-50 border border-sky-200' : 'bg-sky-500/15 border border-sky-500/25'}`}>
                  <BookOpen className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <h3 className={`font-bold text-[14px] ${isLight ? 'text-slate-900' : 'text-white'}`}>Direktori Datasheet Komponen</h3>
                  <p className={`text-[10.5px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Spesifikasi teknis, pinout, dan sampel kode hardware</p>
                </div>
              </div>
              <button
                onClick={() => setShowDatasheetModal(false)}
                className={`p-2 rounded-xl transition-all cursor-pointer
                  ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200' : 'text-slate-500 hover:text-white hover:bg-slate-800 border border-slate-700/50'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Split */}
            <div className="flex-1 min-h-0 flex overflow-hidden">

              {/* Sidebar */}
              <div className={`w-56 border-r overflow-y-auto flex-shrink-0
                ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-[#0e1018] border-slate-800/50'}`}>
                <div className={`px-4 py-3 text-[10px] uppercase font-bold tracking-widest border-b
                  ${isLight ? 'text-slate-400 border-slate-200/60' : 'text-slate-600 border-slate-800/60'}`}>
                  Komponen
                </div>
                <div className="p-2 space-y-0.5">
                  {Object.values(DATASHEET_DATABASE).map(ds => (
                    <button
                      key={ds.id}
                      onClick={() => setSelectedDsKey(ds.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-[11.5px] font-medium transition-all flex items-center justify-between cursor-pointer group
                        ${selectedDsKey === ds.id
                          ? isLight
                            ? 'bg-sky-600 text-white font-bold shadow-sm'
                            : 'bg-sky-600/90 text-white font-bold shadow-sm'
                          : isLight
                            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                        }`}
                    >
                      <span className="truncate">{ds.name}</span>
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${selectedDsKey === ds.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-5 select-text ${isLight ? 'bg-white' : 'bg-[#11131f]'}`}>
                {/* Title row */}
                <div className={`flex items-start justify-between pb-4 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <h2 className="text-lg font-bold text-sky-500">{selectedDatasheet.name}</h2>
                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{selectedDatasheet.description}</p>
                  </div>
                  <button
                    onClick={() => { setShowDatasheetModal(false); handleSendChat(`Jelaskan secara rinci tentang ${selectedDatasheet.name} dan berikan contoh kode penggunaannya`); }}
                    className="flex-shrink-0 ml-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer hover:scale-105"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Tanya AI
                  </button>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tegangan Kerja', value: selectedDatasheet.operatingVoltage, color: 'text-emerald-500' },
                    { label: 'Arus Maksimum', value: selectedDatasheet.maxCurrent, color: 'text-amber-500' },
                  ].map(item => (
                    <div key={item.label} className={`p-3.5 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161925] border-slate-800/60'}`}>
                      <span className={`block text-[10px] font-bold uppercase tracking-wider mb-1 ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{item.label}</span>
                      <span className={`font-bold text-sm ${item.color}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {/* Main specs */}
                <div>
                  <h4 className={`font-bold text-[11px] uppercase tracking-widest mb-2.5 flex items-center gap-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ⚡ Spesifikasi Utama
                  </h4>
                  <div className={`rounded-xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800/60'}`}>
                    {Object.entries(selectedDatasheet.specs).map(([k, v], idx) => (
                      <div key={k} className={`flex items-center justify-between px-4 py-2.5 text-xs ${
                        idx % 2 === 0
                          ? isLight ? 'bg-slate-50' : 'bg-[#161925]'
                          : isLight ? 'bg-white' : 'bg-[#131520]'
                      }`}>
                        <span className={`font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{k}</span>
                        <span className={`font-semibold font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pinout */}
                <div>
                  <h4 className={`font-bold text-[11px] uppercase tracking-widest mb-2.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    📌 Pinout & Fungsi Pin
                  </h4>
                  <div className="space-y-2">
                    {selectedDatasheet.pinout.map((p, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border text-xs flex items-start gap-3
                        ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#161925] border-slate-800/60'}`}>
                        <span className={`px-2 py-1 rounded-lg font-mono font-bold flex-shrink-0 text-[10.5px]
                          ${isLight ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-sky-500/15 text-sky-300 border border-sky-500/25'}`}>
                          {p.name}
                        </span>
                        <div className="min-w-0">
                          <span className={`text-[9.5px] uppercase font-bold block ${isLight ? 'text-slate-400' : 'text-slate-600'}`}>{p.type}</span>
                          <span className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{p.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Code */}
                {(selectedDatasheet.sampleCodeArduino || selectedDatasheet.sampleCodePython) && (
                  <div>
                    <h4 className={`font-bold text-[11px] uppercase tracking-widest mb-2.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      💻 Contoh Kode
                    </h4>
                    <FormattedMessage
                      content={`\`\`\`${selectedDatasheet.sampleCodeArduino ? 'cpp' : 'python'}\n${selectedDatasheet.sampleCodeArduino || selectedDatasheet.sampleCodePython}\n\`\`\``}
                      themeMode={themeMode}
                      onApplyCodeToEditor={onApplyCodeToEditor}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TerminalPanel;
