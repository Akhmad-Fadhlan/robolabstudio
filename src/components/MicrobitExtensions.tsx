import { AudioLines, Cable, Compass, Database, Gauge, Mic, Package, Radar, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { parsePxtPackage } from '../services/microbitPxt';
import { microbitModulePath } from '../services/microbitModules';

export const MICROBIT_EXTENSIONS = [
  { id: 'neopixel', name: 'NeoPixel', repo: 'microsoft/pxt-neopixel', description: 'Atur warna dan tampilkan warna pada strip LED RGB.' },
  { id: 'servo', name: 'Servo', repo: '', description: 'Atur sudut, lebar pulsa, dan hentikan sinyal servo.' },
  { id: 'datalogger', name: 'Data Logger', repo: '', description: 'Catat data ke MY_DATA di micro:bit V2.' },
  { id: 'i2c', name: 'I²C Tools', repo: '', description: 'Cari alamat perangkat yang terhubung ke bus I²C.' },
  { id: 'compass', name: 'Compass', repo: '', description: 'Kalibrasi kompas dan baca arah atau kuat medan magnet.' },
  { id: 'speech', name: 'Speech', repo: '', description: 'Ubah teks menjadi suara pada micro:bit.' },
  { id: 'sonar', name: 'Sonar HC-SR04', repo: 'microsoft/pxt-sonar', description: 'Baca jarak dalam sentimeter. Gunakan sensor 3,3 V atau penyesuai level untuk pin Echo.' },
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

export function MicrobitExtensions({ installed, onToggle, onClose, modules = {}, onUpdateModule, onOpenPxt }: {
  installed: MicrobitExtensionId[];
  onToggle: (id: MicrobitExtensionId) => void;
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

  const icons = { neopixel: Sparkles, servo: Gauge, datalogger: Database, i2c: Cable, compass: Compass, speech: AudioLines, microphone: Mic, sonar: Radar };
  return createPortal(
    <dialog ref={dialog}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === event.currentTarget) onClose(); }}
      aria-labelledby="microbit-extension-title" className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-4xl rounded-2xl border border-slate-300 bg-slate-50 p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60">
      <header className="sticky top-0 z-10 space-y-3 border-b border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 id="microbit-extension-title" className="text-lg font-bold">Ekstensi micro:bit</h2>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Tutup</button>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Cari ekstensi atau tempel URL GitHub
          <input autoFocus type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }}
            className="rounded-lg border border-slate-400 px-3 py-2 font-normal" placeholder="Cari NeoPixel, Compass, atau URL GitHub" />
        </label>
      </header>
      <div className="space-y-5 p-4 sm:p-5">
        {onUpdateModule && <section aria-label="Pustaka MicroPython" className="rounded-xl border border-slate-200 bg-white p-3">
          <h3 className="mb-1 text-sm font-bold">Tambahkan pustaka MicroPython</h3>
          <p className="mb-2 text-sm text-slate-600">Pilih file .py yang kompatibel dengan micro:bit, lalu gunakan <code>import nama_modul</code> di kode Python. File ikut dibawa saat unggah atau ekspor HEX.</p>
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
              const encoder = new TextEncoder();
              const currentSize = Object.values(modules).reduce((size, source) => size + encoder.encode(source).length, 0);
              if (currentSize + file.size > 20 * 1024) {
                setModuleMessage('Total file pustaka melebihi batas 20 KB per proyek.');
                return;
              }
              try {
                const source = await file.text();
                if (!source.trim()) { setModuleMessage('File .py kosong.'); return; }
                if (!dialog.current?.open) return;
                onUpdateModule(path, source);
                setModuleMessage(`${file.name} ditambahkan. Gunakan import ${file.name.slice(0, -3)}.`);
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
              return <article key={entry.id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="relative grid h-24 place-items-center bg-sky-50 text-sky-800">
                  <Icon className="size-10" aria-hidden="true" />
                  {entry.repo && <img loading="lazy" alt="" referrerPolicy="no-referrer"
                    src={`https://raw.githubusercontent.com/${entry.repo}/HEAD/icon.png`} onError={event => { event.currentTarget.hidden = true; }}
                    className="absolute inset-0 h-full w-full bg-white object-contain" />}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div><h4 className="font-bold">{entry.name}</h4><p className="text-sm text-slate-600">{entry.description}</p></div>
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold">Katalog resmi MakeCode</h3>
            {onOpenPxt && <button type="button" className="rounded-lg border border-sky-700 px-3 py-2 text-sm font-semibold text-sky-800"
              onClick={() => onOpenPxt(null)}>Ruang kerja PXT</button>}
          </div>
          <p className="my-1 text-xs text-slate-600">
            {onOpenPxt ? 'Pasang ekstensi dalam proyek PXT untuk menggunakan blok dan konversi Python MakeCode.'
              : 'Ruang kerja PXT tersedia pada RoboLab versi web.'}
          </p>
          {onOpenPxt && repository && <button type="button" className="mt-2 max-w-full break-all rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => onOpenPxt(repository.spec)}>Pasang {repository.repo}{repository.tag ? `#${repository.tag}` : ''} di PXT</button>}
          {status !== 'ready' && <p role="status" className="my-2 text-sm">{status === 'loading' ? 'Memuat katalog…' : 'Katalog sedang tidak dapat dijangkau. Ekstensi RoboLab tetap tersedia.'}</p>}
          {unsupported.length > 0 && <ul className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {unsupported.slice(0, limit).map(entry => <li key={entry.repo} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="relative grid h-20 place-items-center bg-slate-100 text-slate-500">
                <Package className="size-8" aria-hidden="true" />
                <img loading="lazy" alt="" referrerPolicy="no-referrer" src={`https://raw.githubusercontent.com/${entry.repo}/HEAD/icon.png`}
                  onError={event => { event.currentTarget.hidden = true; }} className="absolute inset-0 h-full w-full bg-white object-contain" />
              </div>
              <div className="space-y-1 p-3">
                <a className="block break-all text-sm font-semibold text-sky-800 underline" target="_blank" rel="noreferrer" href={`https://github.com/${entry.repo}`}>{entry.repo}</a>
                {entry.tags.length > 0 && <p className="text-xs text-slate-600">{entry.tags.join(' · ')}</p>}
                {onOpenPxt && <button type="button" aria-label={`Pasang ${entry.repo} di PXT`}
                  className="rounded-lg bg-sky-700 px-2.5 py-1.5 text-xs font-semibold text-white"
                  onClick={() => onOpenPxt(entry.repo)}>Pasang di PXT</button>}
              </div>
            </li>)}
          </ul>}
          {unsupported.length > limit && <button type="button" onClick={() => setLimit(count => count + 30)} className="mt-3 rounded-lg border px-3 py-2 text-sm">Tampilkan berikutnya</button>}
          {status === 'ready' && !supported.length && !unsupported.length && (!onOpenPxt || !repository) && <p className="mt-2 text-sm">Ekstensi tidak ditemukan.</p>}
        </section>
      </div>
    </dialog>,
    document.body,
  );
}
