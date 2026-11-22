import { findNativePxtAdapter, type NativePxtAdapter } from '../services/microbitPxtNative';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { downloadGithubMicrobitModules, GithubModuleImportError, inspectMicrobitGithub } from '../services/microbitGithubModules';

export function MicrobitGithubImport({ installed, onUpdateModule, onInstallAdapter, onOpenPxt }: {
  installed: Record<string, string>;
  onUpdateModule: (path: string, source: string) => void;
  onInstallAdapter: (adapter: NativePxtAdapter) => void;
  onOpenPxt?: (dependency: string) => void;
}) {
  const [input, setInput] = useState('');
  const [repo, setRepo] = useState<Awaited<ReturnType<typeof inspectMicrobitGithub>> | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const adapter = findNativePxtAdapter(input);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);

  async function handleInspect(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (adapter) {
      onInstallAdapter(adapter);
      setFeedback('Adaptor RoboLab sudah aktif di toolbox.');
      return;
    }
    setRepo(null);
    setSelected([]);
    setFeedback('Memeriksa repositori GitHub…');
    await run(async signal => {
      const next = await inspectMicrobitGithub(input, signal);
      if (signal.aborted) return;
      setRepo(next);
      setFeedback(next.candidates.length ? 'Pilih file driver yang kompatibel dengan MicroPython micro:bit.'
        : 'Belum ditemukan file .py yang dapat dipasang.');
    });
  }

  async function run(action: (signal: AbortSignal) => Promise<void>) {
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(() => {
      setFeedback('Permintaan ke GitHub terlalu lama. Coba lagi.');
      setBusy(false);
      controller.abort();
    }, 15_000);
    setBusy(true);
    try {
      await action(controller.signal);
    } catch (error) {
      if (!controller.signal.aborted) setFeedback(error instanceof GithubModuleImportError
        ? error.message : 'GitHub tidak dapat dijangkau atau datanya tidak dapat dibaca.');
    } finally {
      clearTimeout(timer);
      if (active.current === controller && !controller.signal.aborted) setBusy(false);
    }
  }

  return <details className="lab-surface rounded-xl border p-3">
    <summary className="cursor-pointer text-sm font-bold">Pasang library micro:bit dari GitHub</summary>
    <p className="my-2 text-sm opacity-75">Tempel repositori publik. Jika tersedia adaptor RoboLab, kamu bisa langsung memasangnya. Driver MicroPython dari repositori lain dapat dipilih dan dipasang ke kategori Pustaka Python.</p>
    <form onSubmit={handleInspect} className="flex flex-wrap gap-2">
      <input aria-label="URL repositori driver micro:bit" type="text" value={input}
        placeholder="https://github.com/pemilik/repo#versi" disabled={busy}
        onChange={event => { setInput(event.target.value); setRepo(null); setSelected([]); setFeedback(''); }}
        className="lab-control min-w-0 flex-1 basis-56 rounded-lg px-3 py-2 text-sm" />
      <button type="submit" disabled={!input.trim() || busy} className="lab-control rounded-lg px-3 py-2 text-sm font-semibold">
        {adapter ? 'Pasang adaptor' : 'Periksa GitHub'}
      </button>
    </form>
    {feedback && <p role="status" className="mt-2 text-sm">{feedback}</p>}
    {repo?.pxt && <div className="mt-2 space-y-1">
      <p className="text-xs opacity-80">Repositori menyediakan paket PXT. Jika tersedia, file driver .py juga bisa dipasang ke MicroPython.</p>
      {onOpenPxt && <button type="button" className="lab-control rounded-lg px-2 py-1 text-xs" onClick={() => onOpenPxt(input.trim())}>Pakai di proyek PXT</button>}
    </div>}
    {repo?.truncated && <p className="mt-2 text-xs opacity-80">Hanya sebagian daftar file ditampilkan untuk repositori ini.</p>}
    {repo && repo.candidates.length > 0 && <>
      <fieldset disabled={busy} className="mt-2 max-h-48 space-y-1 overflow-auto rounded-lg border p-2">
        <legend className="px-1 text-xs">File Python di {repo.repo}</legend>
        {repo.candidates.map(file => <label key={file.path} className="flex items-start gap-2 rounded-md p-1 text-xs">
          <input type="checkbox" checked={selected.includes(file.path)}
            onChange={event => {
              const checked = event.target.checked;
              setSelected(previous => checked ? [...previous, file.path] : previous.filter(path => path !== file.path));
            }} />
          <code className="break-all">{file.path}</code>
          <span className="ml-auto shrink-0 opacity-70">{Math.ceil(file.size / 1024)} KB</span>
        </label>)}
      </fieldset>
      <p className="my-2 text-xs opacity-75">Pilih juga dependensinya. File disimpan sebagai modul datar berdasarkan nama file. Periksa kode dan versi board sebelum mengunggah.</p>
      <button type="button" disabled={busy || selected.length === 0} className="lab-control rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => {
        const files = repo.candidates.filter(file => selected.includes(file.path));
        setFeedback('Mengunduh file Python dari GitHub…');
        void run(async signal => {
          const modules = await downloadGithubMicrobitModules(repo.repo, files, installed, signal);
          if (signal.aborted) return;
          for (const [path, source] of modules) onUpdateModule(path, source);
          setSelected([]);
          setFeedback(`${modules.length} file terpasang. Buka kategori Pustaka Python di Blockly.`);
        });
      }}>Pasang file terpilih</button>
    </>}
  </details>;
}
