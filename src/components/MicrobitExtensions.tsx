import { MicrobitGithubImport } from './MicrobitGithubImport';
import { AudioLines, Cable, Compass, Database, Gauge, Lightbulb, Mic, Package, Radar, Sparkles, TrafficCone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parsePxtPackage } from '../services/microbitPxt';
import { MICROBIT_PXT_ADAPTERS, readNativePxtDependencies, type NativePxtAdapter } from '../services/microbitPxtNative';
import { microbitModuleBudget, microbitModulePath, microbitModulesBytes } from '../services/microbitModules';

export const MICROBIT_EXTENSIONS = [
  { id: 'neopixel', name: 'NeoPixel', repo: MICROBIT_PXT_ADAPTERS.neopixel, description: 'Atur warna dan tampilkan warna pada strip LED RGB.' },
  { id: 'servo', name: 'Servo', repo: '', description: 'Atur sudut, lebar pulsa, dan hentikan sinyal servo.' },
  { id: 'datalogger', name: 'Data Logger', repo: '', description: 'Catat data ke MY_DATA di micro:bit V2.' },
  { id: 'i2c', name: 'I²C Tools', repo: '', description: 'Cari alamat perangkat yang terhubung ke bus I²C.' },
  { id: 'compass', name: 'Compass', repo: '', description: 'Kalibrasi kompas dan baca arah atau kuat medan magnet.' },
  { id: 'speech', name: 'Speech', repo: '', description: 'Ubah teks menjadi suara pada micro:bit.' },
  { id: 'sonar', name: 'Sonar HC-SR04', repo: MICROBIT_PXT_ADAPTERS.sonar, description: 'Baca jarak dalam sentimeter. Gunakan sensor 3,3 V atau penyesuai level untuk pin Echo.' },
  { id: 'stopbit', name: 'Kitronik STOP:bit', repo: MICROBIT_PXT_ADAPTERS.stopbit, description: 'Kontrol lampu merah, kuning, dan hijau langsung dari RoboLab.' },
  { id: 'lampbit', name: 'Kitronik LAMP:bit', repo: MICROBIT_PXT_ADAPTERS.lampbit, description: 'Kontrol lampu, baca sensor cahaya, dan tentukan ambang mati-nyala.' },
  { id: 'servo16', name: 'Kitronik I²C 16-Servo', repo: MICROBIT_PXT_ADAPTERS.servo16, description: 'Atur sudut dan hentikan sinyal pada 16 kanal servo papan Kitronik.' },
  { id: 'microphone', name: 'Microphone V2', repo: '', description: 'Baca tingkat suara dari mikrofon micro:bit V2.' },
] as const;

export type MicrobitExtensionId = typeof MICROBIT_EXTENSIONS[number]['id'];

const catalogUrl = 'https://raw.githubusercontent.com/microsoft/pxt-microbit/master/targetconfig.json';
type CatalogEntry = { repo: string; tags: string[]; preferred: boolean };

export function readMicrobitExtensions(scope: string): MicrobitExtensionId[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(scope) ?? '[]');
    return MICROBIT_EXTENSIONS.filter(({ id }) => Array.isArray(saved) && saved.includes(id)).map(({ id }) => id);
  } catch {
    return [];
  }
}

export function MicrobitExtensions({ installed, onToggle, onInstallAdapters, onClose, onOpenPxt, modules = {}, onUpdateModule }: {
  installed: MicrobitExtensionId[];
  onToggle: (id: MicrobitExtensionId) => void;
  onInstallAdapters: (ids: NativePxtAdapter[]) => void;
  onClose: () => void;
  onOpenPxt?: (dependency: string | null) => void;
  modules?: Record<string, string>;
  onUpdateModule?: (path: string, source: string | null) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [limit, setLimit] = useState(30);
  const [moduleMessage, setModuleMessage] = useState('');
  const [manifestMessage, setManifestMessage] = useState('');
  const [unsupportedDependencies, setUnsupportedDependencies] = useState<string[]>([]);

  useEffect(() => {
    const activeDialog = dialog.current;
    if (!activeDialog) return;
    activeDialog.showModal();
    return () => { if (activeDialog.open) activeDialog.close(); };
  }, []);

  useEffect(() => {
    const request = new AbortController();
    fetch(catalogUrl, { signal: request.signal })
      .then(response => {
        if (!response.ok) throw Error('Catalog unavailable');
        return response.json();
      })
      .then(data => {
        const approved = data?.packages?.approvedRepoLib;
        if (!approved || typeof approved !== 'object') throw Error('Invalid catalog');
        const entries = Object.entries(approved).flatMap(([repo, meta]) => {
          if (!parsePxtPackage(repo)) return [];
          const detail = meta as { tags?: unknown; preferred?: boolean } | null;
          const tags = Array.isArray(detail?.tags) ? detail.tags.filter((tag): tag is string => typeof tag === 'string') : [];
          return [{ repo: repo.toLowerCase(), tags, preferred: detail?.preferred === true }];
        });
        if (request.signal.aborted) return;
        setCatalog(entries.sort((a, b) => Number(b.preferred) - Number(a.preferred) || a.repo.localeCompare(b.repo)));
        setStatus('ready');
      })
      .catch(() => { if (!request.signal.aborted) setStatus('offline'); });
    return () => request.abort();
  }, []);

  const repository = parsePxtPackage(query);
  const search = repository?.repo ?? query.trim().toLowerCase();
  const supported = MICROBIT_EXTENSIONS.filter(entry => `${entry.name} ${entry.repo} ${entry.id}`.toLowerCase().includes(search));
  const unsupported = catalog.filter(entry =>
    !MICROBIT_EXTENSIONS.some(item => item.repo === entry.repo) && `${entry.repo} ${entry.tags.join(' ')}`.toLowerCase().includes(search));

  const icons = { neopixel: Sparkles, servo: Gauge, datalogger: Database, i2c: Cable, compass: Compass, speech: AudioLines, microphone: Mic, sonar: Radar, stopbit: TrafficCone, lampbit: Lightbulb, servo16: Gauge };
  return createPortal(
    <dialog ref={dialog}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      aria-labelledby="microbit-extension-title" className="lab-surface fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-4xl rounded-2xl border p-0 shadow-xl backdrop:bg-slate-950/60">
      <header className="lab-surface sticky top-0 z-10 space-y-3 border-b p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="microbit-extension-title" className="text-lg font-bold">Ekstensi micro:bit</h2>
          <button type="button" onClick={onClose} className="lab-control rounded-lg px-3 py-1.5 text-sm">Tutup</button>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Cari ekstensi atau tempel URL GitHub
          <input autoFocus type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }}
            className="lab-control rounded-lg px-3 py-2 font-normal" placeholder="Cari NeoPixel, Compass, atau URL GitHub" />
        </label>
      </header>
      <div className="space-y-5 p-4 sm:p-5">
        <section className="lab-surface rounded-xl border p-3" aria-label="Adaptor paket PXT">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold">Adaptor paket PXT</h3>
            {onOpenPxt && <button type="button" className="lab-control rounded-lg px-3 py-2 text-sm font-semibold" onClick={() => onOpenPxt(null)}>Buka proyek PXT</button>}
          </div>
          <p className="mb-2 text-sm opacity-75">Tempel URL GitHub untuk mencari adaptor, atau pilih pxt.json untuk memasang adaptor yang sesuai ke toolbox proyek ini.</p>
          <label className="lab-control inline-block cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold focus-within:outline-2">
            Pasang dari pxt.json
            <input type="file" accept=".json,application/json" className="sr-only" onChange={async event => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              setUnsupportedDependencies([]);
              if (file.size > 128 * 1024) {
                setManifestMessage('File pxt.json melebihi 128 KB.');
                return;
              }
              try {
                const { adapters, unsupported } = readNativePxtDependencies(await file.text());
                if (!dialog.current?.open) return;
                if (adapters.length > 0) onInstallAdapters(adapters);
                setUnsupportedDependencies(unsupported);
                setManifestMessage(adapters.length > 0
                  ? `${adapters.length} adaptor tersedia di toolbox proyek ini.`
                  : 'Tidak ada dependensi dengan adaptor RoboLab di manifest ini.');
              } catch (error) {
                setManifestMessage(error instanceof Error ? error.message : 'File pxt.json tidak dapat dibaca.');
              }
            }} />
          </label>
          {manifestMessage && <p role="status" className="mt-2 text-sm">{manifestMessage}</p>}
          {unsupportedDependencies.length > 0 && <p className="mt-1 break-words text-sm opacity-75">
            Adaptor belum tersedia: {unsupportedDependencies.join(', ')}
          </p>}
        </section>
        {onUpdateModule && <MicrobitGithubImport installed={modules} onUpdateModule={onUpdateModule} onInstallAdapter={id => onInstallAdapters([id])} onOpenPxt={onOpenPxt} />}
        {onUpdateModule && <section aria-label="Pustaka MicroPython" className="lab-surface rounded-xl border p-3">
          <h3 className="mb-1 text-sm font-bold">Tambahkan pustaka MicroPython</h3>
          <p className="mb-2 text-sm opacity-75">Tambahkan file MicroPython .py, lalu cari bloknya di kategori Pustaka Python. Isi nama fungsi atau metode. Jika perlu, sambungkan blok daftar sebagai argumen. File ikut dibawa saat unggah atau ekspor HEX.</p>
          <label className="inline-block cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus-within:outline-2">
            Impor file .py
            <input type="file" accept=".py" className="sr-only" onChange={async event => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              if (!file) return;
              const path = microbitModulePath(file.name);
              if (!path) {
                setModuleMessage('Gunakan nama modul Python, misalnya oled.py. Nama main.py dan modul bawaan dicadangkan.');
                return;
              }
              if (Object.hasOwn(modules, file.name)) {
                setModuleMessage(`${file.name} sudah ada. Lepas file lama sebelum memasang pengganti.`);
                return;
              }
              if (microbitModulesBytes(modules) + file.size > microbitModuleBudget) {
                setModuleMessage('Total file pustaka melebihi batas 20 KB per proyek.');
                return;
              }
              try {
                const source = await file.text();
                if (!source.trim()) { setModuleMessage('File .py kosong.'); return; }
                if (!dialog.current?.open) return;
                onUpdateModule(path, source);
                setModuleMessage(`${file.name} ditambahkan. Buka kategori Pustaka Python untuk memakai fungsi dari modul ini.`);
              } catch {
                setModuleMessage('File tidak dapat dibaca.');
              }
            }} />
          </label>
          {moduleMessage && <p role="status" className="mt-2 text-sm">{moduleMessage}</p>}
          {Object.keys(modules).length > 0 && <ul className="mt-2 space-y-1">
            {Object.keys(modules).map(filename => <li key={filename} className="flex items-center justify-between gap-2 border-t border-slate-100 pt-1 text-sm">
              <code className="break-all">{filename}</code>
              <button type="button" aria-label={`Lepas ${filename}`} onClick={() => {
                onUpdateModule(microbitModulePath(filename)!, null);
                setModuleMessage(`${filename} dilepas.`);
              }} className="rounded-lg border border-slate-300 px-2 py-1">Lepas</button>
            </li>)}
          </ul>}
        </section>}
        {supported.length > 0 && <section aria-label="Ekstensi RoboLab">
          <h3 className="mb-2 text-sm font-bold">Bisa dipasang di RoboLab</h3>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {supported.map(entry => {
              const enabled = installed.includes(entry.id);
              const Icon = icons[entry.id];
              return <article key={entry.id} className="flex flex-col overflow-hidden lab-surface rounded-xl border">
                <div className="relative grid h-24 place-items-center bg-sky-50 text-sky-800">
                  <Icon className="size-10" aria-hidden="true" />
                  {entry.repo && <img loading="lazy" alt="" referrerPolicy="no-referrer"
                    src={`https://raw.githubusercontent.com/${entry.repo}/HEAD/icon.png`} onError={event => { event.currentTarget.hidden = true; }}
                    className="absolute inset-0 h-full w-full bg-white object-contain" />}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div><h4 className="font-bold">{entry.name}</h4>{entry.repo && <p className="text-xs opacity-75">Adaptor PXT</p>}<p className="text-sm opacity-75">{entry.description}</p></div>
                  <button type="button" aria-pressed={enabled} onClick={() => onToggle(entry.id)}
                    className={`mt-auto self-start rounded-lg px-3 py-2 text-sm font-semibold ${enabled ? 'bg-slate-100 text-slate-700' : 'bg-sky-700 text-white'}`}>
                    {enabled ? 'Lepas' : 'Pasang'}
                  </button>
                </div>
              </article>;
            })}
          </div>
        </section>}
        <section aria-label="Katalog MakeCode" className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-bold">Referensi paket MakeCode</h3>
          <p className="my-1 text-xs opacity-75">Paket yang memiliki adaptor dapat dipasang dari bagian RoboLab. Paket lain memerlukan adaptor atau file driver MicroPython yang kompatibel.</p>
          {status !== 'ready' && <p role="status" className="my-2 text-sm">{status === 'loading' ? 'Memuat katalog…' : 'Katalog sedang tidak dapat dijangkau. Ekstensi RoboLab tetap tersedia.'}</p>}
          {unsupported.length > 0 && <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {unsupported.slice(0, limit).map(entry => <li key={entry.repo} className="overflow-hidden lab-surface rounded-xl border">
              <div className="relative grid h-20 place-items-center bg-slate-100 text-slate-500">
                <Package className="size-8" aria-hidden="true" />
                <img loading="lazy" alt="" referrerPolicy="no-referrer" src={`https://raw.githubusercontent.com/${entry.repo}/HEAD/icon.png`}
                  onError={event => { event.currentTarget.hidden = true; }} className="absolute inset-0 h-full w-full bg-white object-contain" />
              </div>
              <div className="space-y-1 p-3">
                <a className="block break-all text-sm font-semibold underline" target="_blank" rel="noreferrer" href={`https://github.com/${entry.repo}`}>{entry.repo}</a>
                {entry.tags.length > 0 && <p className="text-xs opacity-75">{entry.tags.join(' · ')}</p>}
                {onOpenPxt ? <button type="button" className="lab-control rounded-lg px-2 py-1 text-xs" onClick={() => onOpenPxt(entry.repo)}>Pakai di proyek PXT</button>
                  : <p className="text-xs opacity-75">Adaptor RoboLab belum tersedia.</p>}
              </div>
            </li>)}
          </ul>}
          {unsupported.length > limit && <button type="button" onClick={() => setLimit(count => count + 30)} className="mt-3 rounded-lg border px-3 py-2 text-sm">Tampilkan berikutnya</button>}
          {status === 'ready' && !supported.length && !unsupported.length && <p className="mt-2 text-sm">Ekstensi tidak ditemukan.</p>}
        </section>
      </div>
    </dialog>,
    document.body,
  );
}
