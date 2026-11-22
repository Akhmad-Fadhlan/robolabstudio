import { useEffect, useRef, useState } from 'react';

export const MICROBIT_EXTENSIONS = [
  { id: 'neopixel', name: 'NeoPixel', repo: 'microsoft/pxt-neopixel', description: 'Atur warna dan tampilkan warna pada strip LED RGB.' },
  { id: 'servo', name: 'Servo', repo: '', description: 'Atur sudut, lebar pulsa, dan hentikan sinyal servo.' },
  { id: 'datalogger', name: 'Data Logger', repo: '', description: 'Catat data ke MY_DATA di micro:bit V2.' },
] as const;

export type MicrobitExtensionId = typeof MICROBIT_EXTENSIONS[number]['id'];

const catalogUrl = 'https://raw.githubusercontent.com/microsoft/pxt-microbit/master/targetconfig.json';
const repoPattern = /^[\w.-]+\/[\w.-]+$/;
type CatalogEntry = { repo: string; tags: string[]; preferred: boolean };

export function readMicrobitExtensions(scope: string): MicrobitExtensionId[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(scope) ?? '[]');
    return MICROBIT_EXTENSIONS.filter(({ id }) => Array.isArray(saved) && saved.includes(id)).map(({ id }) => id);
  } catch {
    return [];
  }
}

function normalizeRepository(input: string): string | null {
  const value = input.trim().replace(/^github:/i, '');
  const slug = value.replace(/^https:\/\/github\.com\//i, '').split('#')[0].replace(/\/$|\.git$/i, '');
  return repoPattern.test(slug) ? slug.toLowerCase() : null;
}

export function MicrobitExtensions({ installed, onToggle, onClose }: {
  installed: MicrobitExtensionId[];
  onToggle: (id: MicrobitExtensionId) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    dialog.current?.showModal();
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
          if (!repoPattern.test(repo)) return [];
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

  const repository = normalizeRepository(query);
  const search = repository ?? query.trim().toLowerCase();
  const supported = MICROBIT_EXTENSIONS.filter(entry => `${entry.name} ${entry.repo} ${entry.id}`.toLowerCase().includes(search));
  const unsupported = catalog.filter(entry =>
    !MICROBIT_EXTENSIONS.some(item => item.repo === entry.repo) && `${entry.repo} ${entry.tags.join(' ')}`.toLowerCase().includes(search));

  return (
    <dialog ref={dialog} onClose={onClose} className="fixed inset-0 m-auto max-h-[88dvh] w-[min(42rem,calc(100%-2rem))] rounded-2xl border border-slate-300 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60">
      <header className="sticky top-0 z-10 space-y-3 border-b border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Ekstensi micro:bit</h2>
          <button type="button" onClick={() => dialog.current?.close()} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Tutup</button>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          Cari ekstensi atau tempel URL GitHub
          <input autoFocus type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30); }}
            className="rounded-lg border border-slate-400 px-3 py-2 font-normal" placeholder="NeoPixel atau https://github.com/microsoft/pxt-neopixel" />
        </label>
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        {supported.length > 0 && <section aria-label="Ekstensi RoboLab" className="divide-y divide-slate-200">
          {supported.map(entry => {
            const enabled = installed.includes(entry.id);
            return <article key={entry.id} className="flex items-center justify-between gap-3 py-3">
              <div><h3 className="text-sm font-bold">{entry.name}</h3><p className="text-sm text-slate-600">{entry.description}</p></div>
              <button type="button" aria-pressed={enabled} onClick={() => onToggle(entry.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold ${enabled ? 'bg-slate-100 text-slate-700' : 'bg-sky-700 text-white'}`}>
                {enabled ? 'Lepas' : 'Pasang'}
              </button>
            </article>;
          })}
        </section>}
        <section aria-label="Katalog MakeCode" className="border-t border-slate-200 pt-3">
          <h3 className="text-sm font-bold">Katalog resmi MakeCode</h3>
          <p className="my-1 text-xs text-slate-600">Ekstensi PXT tetap dibuka di MakeCode. Tanda Pasang tersedia untuk blok yang sudah diadaptasi ke MicroPython RoboLab.</p>
          {status !== 'ready' && <p role="status" className="my-2 text-sm">{status === 'loading' ? 'Memuat katalog…' : 'Katalog sedang tidak dapat dijangkau. Ekstensi RoboLab tetap tersedia.'}</p>}
          {unsupported.length > 0 && <ul className="mt-2 divide-y divide-slate-100">
            {unsupported.slice(0, limit).map(entry => <li key={entry.repo} className="py-2 text-sm">
              <a className="break-all font-semibold text-sky-800 underline" target="_blank" rel="noreferrer" href={`https://github.com/${entry.repo}`}>{entry.repo}</a>
              {entry.tags.length > 0 && <p className="text-xs text-slate-600">{entry.tags.join(' · ')}</p>}
            </li>)}
          </ul>}
          {unsupported.length > limit && <button type="button" onClick={() => setLimit(count => count + 30)} className="mt-3 rounded-lg border px-3 py-2 text-sm">Tampilkan berikutnya</button>}
          {status === 'ready' && !supported.length && !unsupported.length && <p className="mt-2 text-sm">Ekstensi ini tidak ditemukan dalam daftar yang kompatibel atau disetujui.</p>}
          <a href="https://makecode.microbit.org/#editor" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-sky-800 underline">Buka editor MakeCode</a>
        </section>
      </div>
    </dialog>
  );
}
