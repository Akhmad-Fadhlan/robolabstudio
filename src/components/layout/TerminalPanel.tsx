import React, { useState, useRef, useEffect, type FormEvent, type UIEvent } from 'react';
import {
  Activity, BookOpen, Bot, Cable, Check, ChevronDown, ChevronRight, Copy,
  FileCode, LoaderCircle, Plug, Send, Settings, Sparkles, Terminal, Trash2, X, Zap,
} from 'lucide-react';
import {
  ASSISTANT_PROVIDERS, DEFAULT_KILOCODE_CONFIG, testAssistantConnection,
  type KiloCodeConfig, type ChatMessage,
} from '../../services/kilocodeService';
import './TerminalPanel.css';
import { SERIAL_BAUD_RATES } from '../../data/serialBaudRates';
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
  handleSendChat: (customPrompt?: string, includeProject?: boolean) => void;

  kiloConfig?: KiloCodeConfig;
  setKiloConfig?: (cfg: KiloCodeConfig) => void;
  onApplyCodeToEditor?: (code: string) => void;
  onClearChat?: () => void;
  activeFileName?: string;
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
const quickPrompts = [
  { label: 'Cek kode', prompt: 'Analisis kode aktif saya. Jelaskan perbaikan yang bisa saya coba.', icon: FileCode },
  { label: 'Cek rangkaian', prompt: 'Analisis rangkaian proyek saya dan sarankan langkah pengecekan.', icon: Plug },
  { label: 'Contoh program', prompt: 'Buat contoh program sederhana untuk proyek saya dan jelaskan langkahnya.', icon: Zap },
];

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  isTerminalCollapsed, setIsTerminalCollapsed, terminalHeight, setIsResizingTerminal,
  terminalTab, setTerminalTab, port, board, themeMode,
  terminalLogs = [], setTerminalLogs, serialRawOutput, setSerialRawOutput,
  interactiveTerminalLogs, setInteractiveTerminalLogs, serialBaudrate, setSerialBaudrate,
  isSerialConnected, setIsSerialConnected, terminalInput, setTerminalInput, handleTerminalCommand,
  aiChat, aiInput, setAiInput, handleSendChat, kiloConfig = DEFAULT_KILOCODE_CONFIG,
  setKiloConfig, onApplyCodeToEditor, onClearChat, activeFileName, isAiLoading = false,
}) => {
  const isLight = themeMode === 'light';
  const currentTab = terminalTab === 'problems' ? 'terminal' : terminalTab;
  const [showDatasheetModal, setShowDatasheetModal] = useState(false);
  const [selectedDsKey, setSelectedDsKey] = useState('esp32');
  const selectedDatasheet: ComponentDatasheet = DATASHEET_DATABASE[selectedDsKey] || DATASHEET_DATABASE.esp32;
  const [draft, setDraft] = useState(kiloConfig);
  const [testResult, setTestResult] = useState<{ success: boolean; text: string }>();
  const [testing, setTesting] = useState(false);
  const [includeProject, setIncludeProject] = useState(false);
  const [serialTxInput, setSerialTxInput] = useState('');
  const [serialEnding, setSerialEnding] = useState('\r\n');
  const [serialBusy, setSerialBusy] = useState(false);
  const [serialError, setSerialError] = useState('');
  const [showBuildLogs, setShowBuildLogs] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const followOutput = useRef(true);
  const desktopRequire = (window as any).__electronRequire || (window as any).require;
  const hasAiKey = Boolean(kiloConfig.apiKey.trim());

  useEffect(() => {
    followOutput.current = true;
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [currentTab, isTerminalCollapsed, showBuildLogs]);

  useEffect(() => {
    if (streamRef.current && followOutput.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [aiChat, isAiLoading, serialRawOutput, interactiveTerminalLogs, terminalLogs, currentTab]);

  const openSettings = () => {
    setDraft(kiloConfig);
    setTestResult(undefined);
    dialogRef.current?.showModal();
  };

  const updateDraft = (next: KiloCodeConfig) => {
    setDraft(next);
    setTestResult(undefined);
  };

  const runConnectionTest = async () => {
    setTesting(true);
    setTestResult(undefined);
    try {
      await testAssistantConnection(draft);
      setTestResult({ success: true, text: 'Berhasil. Penyedia AI membalas pesan uji.' });
    } catch (err) {
      setTestResult({ success: false, text: err instanceof Error ? err.message : 'Uji koneksi gagal.' });
    } finally {
      setTesting(false);
    }
  };

  const toggleSerial = async () => {
    setSerialError('');
    setSerialBusy(true);
    try {
      if (isSerialConnected) {
        if (desktopRequire) await desktopRequire('electron').ipcRenderer.invoke('stop-serial-monitor');
        else await stopWebSerialMonitor();
        setIsSerialConnected(false);
      } else {
        if (desktopRequire && (!port || port === 'none')) throw new Error('Pilih port board di toolbar proyek terlebih dahulu.');
        const result = desktopRequire
          ? await desktopRequire('electron').ipcRenderer.invoke('start-serial-monitor', port, board, serialBaudrate)
          : await startWebSerialMonitor(port, serialBaudrate, chunk => {
            setSerialRawOutput(prev => (prev + chunk).slice(-50000));
          }, () => setIsSerialConnected(false));
        if (!result.success) throw new Error(result.error || 'Port serial tidak bisa dibuka.');
        setIsSerialConnected(true);
      }
    } catch (err) {
      setSerialError(err instanceof Error ? err.message : 'Koneksi serial gagal.');
    } finally {
      setSerialBusy(false);
    }
  };

  const sendSerial = async (event: FormEvent) => {
    event.preventDefault();
    if (!serialTxInput || !isSerialConnected || serialBusy) return;
    setSerialError('');
    setSerialBusy(true);
    try {
      const data = serialTxInput + serialEnding;
      const sent = desktopRequire
        ? await desktopRequire('electron').ipcRenderer.invoke('write-serial-monitor', data)
        : await sendWebSerialData(data);
      if (!sent) throw new Error('Pesan belum terkirim. Periksa koneksi board.');
      setSerialTxInput('');
    } catch (err) {
      setSerialError(err instanceof Error ? err.message : 'Pesan serial gagal dikirim.');
    } finally {
      setSerialBusy(false);
    }
  };

  const clearPanel = () => {
    if (currentTab === 'ai') onClearChat?.();
    else if (currentTab === 'serial') setSerialRawOutput('');
    else if (showBuildLogs || !interactiveTerminalLogs.length) setTerminalLogs([]);
    else setInteractiveTerminalLogs?.([]);
  };

  const trackScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    followOutput.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  const submitChat = (event?: FormEvent) => {
    event?.preventDefault();
    if (!isAiLoading && aiInput.trim()) {
      followOutput.current = true;
      handleSendChat(undefined, includeProject);
    }
  };

  const streamProps = { ref: streamRef, onScroll: trackScroll };
  const displayedLogs = showBuildLogs || !interactiveTerminalLogs.length ? terminalLogs : interactiveTerminalLogs;
  const clearLabel = currentTab === 'ai' ? 'Hapus percakapan' : currentTab === 'serial' ? 'Bersihkan data serial' : 'Bersihkan log terminal';

  return (
    <>
      {!isTerminalCollapsed && (
        <div className="rl-dock-grip" onMouseDown={event => { event.preventDefault(); setIsResizingTerminal(true); }}>
          <span />
        </div>
      )}
      <section className="rl-dock" data-mode={themeMode} data-accent={currentTab}
        aria-label="Konsol proyek" style={{ height: isTerminalCollapsed ? 44 : terminalHeight }}>
        <header className="rl-dock-bar">
          <nav aria-label="Panel proyek" className="rl-dock-tabs">
            {([
              ['serial', 'Serial', Activity],
              ['terminal', 'Terminal', Terminal],
              ['ai', 'RoboLab AI', Bot],
            ] as const).map(([id, label, Icon]) => (
              <button key={id} type="button" className="rl-tab" aria-pressed={currentTab === id}
                onClick={() => { setTerminalTab(id); setIsTerminalCollapsed(false); }}>
                <Icon size={15} aria-hidden /> {label}
                {id === 'serial' && isSerialConnected && <i className="rl-connection-dot" title="Serial terhubung" />}
              </button>
            ))}
          </nav>
          <div className="rl-dock-actions">
            <button type="button" className="rl-icon-btn" onClick={clearPanel} title={clearLabel}
              aria-label={clearLabel} disabled={isTerminalCollapsed || (currentTab === 'ai' && (isAiLoading || !aiChat.length))}>
              <Trash2 size={16} aria-hidden />
            </button>
            <button type="button" className="rl-icon-btn" aria-expanded={!isTerminalCollapsed}
              aria-label={isTerminalCollapsed ? 'Buka panel' : 'Lipat panel'} onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}>
              <ChevronDown size={18} aria-hidden style={{ rotate: isTerminalCollapsed ? '180deg' : undefined }} />
            </button>
          </div>
        </header>

        {!isTerminalCollapsed && currentTab === 'serial' && (
          <div className="rl-dock-content">
            <div className="rl-toolbar">
              <div className="rl-tool-heading">
                <span className="rl-tool-icon"><Cable size={17} aria-hidden /></span>
                <div><strong>Monitor Serial</strong><small>{board}</small></div>
              </div>
              <div className="rl-dock-actions">
                <span className="rl-status" data-connected={isSerialConnected} role="status">{isSerialConnected ? 'Terhubung' : 'Siap disambungkan'}</span>
                <select aria-label="Kecepatan serial" className="rl-control" value={serialBaudrate} disabled={isSerialConnected || serialBusy}
                  onChange={event => setSerialBaudrate(Number(event.target.value))}>
                  {SERIAL_BAUD_RATES.map(baud => <option key={baud} value={baud}>{baud} baud</option>)}
                </select>
                <button type="button" className={isSerialConnected ? 'rl-control' : 'rl-primary'} disabled={serialBusy} onClick={() => void toggleSerial()}>
                  {isSerialConnected ? 'Putuskan' : 'Hubungkan'}
                </button>
              </div>
            </div>
            <div {...streamProps} className="rl-stream rl-console-stream" aria-label="Data Serial">
              {serialRawOutput
                ? <pre>{serialRawOutput}</pre>
                : <div className="rl-empty"><Activity size={19} aria-hidden /><strong>Menunggu data board</strong>
                    <span>{isSerialConnected ? 'Cetak data dari program agar muncul di sini.' : 'Hubungkan board untuk melihat data dari program.'}</span></div>}
            </div>
            {serialError && <p className="rl-feedback" role="alert">{serialError}</p>}
            <form className="rl-composer" onSubmit={sendSerial} aria-label="Kirim ke board">
              <input aria-label="Pesan ke board" placeholder="Pesan ke board…" value={serialTxInput} maxLength={4096} onChange={event => setSerialTxInput(event.target.value)} />
              <select aria-label="Akhir baris serial" className="rl-control" value={serialEnding} onChange={event => setSerialEnding(event.target.value)}>
                <option value={'\r\n'}>CR + LF</option><option value={'\n'}>LF</option><option value={'\r'}>CR</option><option value="">Tanpa akhir baris</option>
              </select>
              <button type="submit" className="rl-primary" disabled={!isSerialConnected || !serialTxInput || serialBusy} aria-label="Kirim ke board"><Send size={15} aria-hidden /></button>
            </form>
          </div>
        )}

        {!isTerminalCollapsed && currentTab === 'terminal' && (
          <div className="rl-dock-content">
            <div className="rl-toolbar">
              <div className="rl-tool-heading">
                <span className="rl-tool-icon"><Terminal size={17} aria-hidden /></span>
                <div><strong>Terminal proyek</strong><small>Perintah dan hasil program</small></div>
              </div>
              <button type="button" className="rl-control" aria-pressed={showBuildLogs} disabled={!terminalLogs.length && !showBuildLogs} onClick={() => setShowBuildLogs(!showBuildLogs)}>
                {showBuildLogs ? 'Tampilkan aktivitas' : 'Lihat log build'}
              </button>
            </div>
            <div {...streamProps} className="rl-stream rl-console-stream" role="log" aria-label="Log terminal">
              {!displayedLogs.length && <div className="rl-empty"><Terminal size={19} aria-hidden /><strong>Belum ada keluaran</strong><span>Jalankan program atau ketik perintah di bawah.</span></div>}
              {displayedLogs.map((log, index) => (
                <div key={index} className="rl-log-row" data-kind={log.type}>
                  <span aria-hidden>{log.type === 'error' ? '!' : log.type === 'success' ? '✓' : log.type === 'input' ? '›' : '·'}</span>
                  <pre>{log.text}</pre>
                </div>
              ))}
            </div>
            <form className="rl-composer" onSubmit={event => { setShowBuildLogs(false); handleTerminalCommand(event); }}>
              <span className="rl-prompt" aria-hidden>›</span>
              <input value={terminalInput} aria-label="Perintah terminal" placeholder="Ketik perintah terminal…" onChange={event => setTerminalInput(event.target.value)} />
              <button type="submit" className="rl-primary" disabled={!terminalInput.trim()}>Jalankan</button>
            </form>
          </div>
        )}

        {!isTerminalCollapsed && currentTab === 'ai' && (
          <div className="rl-dock-content rl-chat">
            <div className="rl-toolbar">
              <div className="rl-tool-heading">
                <span className="rl-tool-icon"><Bot size={19} aria-hidden /></span>
                <div><strong>Asisten RoboLab</strong><small>{hasAiKey ? ASSISTANT_PROVIDERS[kiloConfig.provider].label : 'Panduan lokal'}</small></div>
              </div>
              <div className="rl-dock-actions">
                <button type="button" className="rl-icon-btn" aria-label="Buka datasheet" title="Datasheet" onClick={() => setShowDatasheetModal(true)}><BookOpen size={17} aria-hidden /></button>
                <button type="button" className="rl-icon-btn" aria-label="Pengaturan AI" title="Pengaturan AI" onClick={openSettings}><Settings size={17} aria-hidden /></button>
              </div>
            </div>
            <div {...streamProps} className="rl-stream rl-chat-stream" role="log" aria-label="Percakapan dengan RoboLab">
              {!aiChat.length && <div className="rl-chat-welcome">
                <strong>Mau bikin apa hari ini?</strong>
                <p>{hasAiKey ? 'Tanyakan ide proyek, jelaskan error, atau minta bantuan langkah demi langkah.' : 'Panduan lokal bisa membantu cek kode, rangkaian, dan komponen. Aktifkan API di pengaturan untuk percakapan AI.'}</p>
                <div className="rl-suggestions">{quickPrompts.map(({ label, prompt, icon: Icon }) => (
                  <button type="button" className="rl-control" key={label} onClick={() => setAiInput(prompt)}><Icon size={14} aria-hidden />{label}</button>
                ))}</div>
              </div>}
              {aiChat.map((msg, index) => (
                <article key={index} className="rl-message" data-sender={msg.sender} data-error={!!msg.isError}>
                  <small>{msg.sender === 'user' ? 'Kamu' : msg.isError ? 'Koneksi AI' : msg.isKiloCode ? 'RoboLab AI' : 'Panduan lokal'}</small>
                  {msg.sender === 'user' || msg.isError ? <p>{msg.message}</p>
                    : <FormattedMessage content={msg.message} themeMode={themeMode} onApplyCodeToEditor={onApplyCodeToEditor} />}
                </article>
              ))}
              {isAiLoading && <div className="rl-thinking" role="status"><LoaderCircle size={16} className="motion-safe:animate-spin" aria-hidden /> RoboLab sedang menyiapkan jawaban…</div>}
            </div>
            <form className="rl-composer rl-chat-composer" onSubmit={submitChat} aria-label="Kirim pesan ke RoboLab">
              <textarea aria-label="Pesan untuk RoboLab" placeholder="Tulis pertanyaanmu…" rows={2} maxLength={4000} value={aiInput}
                onChange={event => setAiInput(event.target.value)}
                onKeyDown={event => {
                  event.stopPropagation();
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) submitChat(event);
                }} />
              <button type="submit" className="rl-primary" disabled={isAiLoading || !aiInput.trim()} aria-label="Kirim pesan"><Send size={16} aria-hidden /></button>
            </form>
            {hasAiKey && <label className="rl-project-context" title={activeFileName}>
              <input type="checkbox" checked={includeProject} onChange={event => setIncludeProject(event.target.checked)} />
              Sertakan kode aktif dan rangkaian
            </label>}
          </div>
        )}

        <dialog ref={dialogRef} className="rl-ai-dialog" aria-labelledby="rl-ai-settings-title" onCancel={event => { if (testing) event.preventDefault(); }}>
          <form onSubmit={event => {
            event.preventDefault();
            const next = { ...draft, apiKey: draft.apiKey.trim(), model: draft.model.trim() || ASSISTANT_PROVIDERS[draft.provider].model };
            if (next.apiKey !== kiloConfig.apiKey || next.provider !== kiloConfig.provider || next.model !== kiloConfig.model) {
              onClearChat?.();
              setIncludeProject(false);
            }
            setKiloConfig?.(next);
            dialogRef.current?.close();
          }}>
            <div className="rl-toolbar">
              <div className="rl-tool-heading">
                <span className="rl-tool-icon"><Settings size={18} aria-hidden /></span>
                <h2 id="rl-ai-settings-title">Pengaturan AI</h2>
              </div>
              <button type="button" className="rl-icon-btn" aria-label="Tutup pengaturan" disabled={testing} onClick={() => dialogRef.current?.close()}><X size={19} aria-hidden /></button>
            </div>
            <p>Gunakan kunci dari Kilo Gateway atau OpenRouter. Kunci hanya berlaku selama halaman terbuka. Pesan dan riwayat chat dikirim ke penyedia yang dipilih.</p>
            <label>Penyedia
              <select className="rl-control" value={draft.provider} disabled={testing} onChange={event => {
                const provider = event.target.value as KiloCodeConfig['provider'];
                updateDraft({ provider, apiKey: '', model: ASSISTANT_PROVIDERS[provider].model });
              }}>
                {Object.entries(ASSISTANT_PROVIDERS).map(([id, provider]) => <option key={id} value={id}>{provider.label}</option>)}
              </select>
            </label>
            <label>Kunci API<input className="rl-control" type="password" autoComplete="off" spellCheck={false} value={draft.apiKey} disabled={testing}
              onChange={event => updateDraft({ ...draft, apiKey: event.target.value })} /></label>
            <label>ID model<input className="rl-control" spellCheck={false} placeholder={ASSISTANT_PROVIDERS[draft.provider].model} value={draft.model} disabled={testing}
              onChange={event => updateDraft({ ...draft, model: event.target.value })} /></label>
            {testResult && <p className="rl-feedback" data-success={testResult.success} role="status">{testResult.text}</p>}
            <footer className="rl-dock-actions">
              <button type="button" className="rl-control" disabled={testing || isAiLoading || !draft.apiKey.trim()} onClick={() => void runConnectionTest()}>
                {testing ? 'Sedang menguji…' : 'Uji koneksi'}
              </button>
              <button type="submit" className="rl-primary" disabled={testing || isAiLoading}>Simpan</button>
            </footer>
          </form>
        </dialog>
      </section>

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
