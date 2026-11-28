import { useState } from 'react';
import blocks from '../../data/lessonBlocks.json';

const images = import.meta.glob('../../assets/lessons/blocks/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export function BlockFieldGuide({ themeMode = 'dark' }: { themeMode?: 'light' | 'dark' }) {
  const isLight = themeMode === 'light';
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(blocks[0].type);
  const matches = blocks.filter((b) =>
    [b.label, b.category, ...b.steps].join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );
  const block = matches.find((b) => b.type === selected) ?? matches[0];
  const stepTitles = [
    '💡 Apa Gunanya?',
    '📌 Contoh Pemakaian',
    '🧩 Cara Memasang Blok',
    '✨ Hasilnya di Robot',
    '🚀 Ayo Coba Sendiri',
    '⭐ Tips Rahasia',
  ];

  return (
    <details
      className={`rounded-2xl p-4 border transition-colors group ${
        isLight
          ? 'bg-white border-slate-200/90 text-slate-800 shadow-xs'
          : 'bg-slate-900/70 border-slate-800 text-slate-100'
      }`}
      style={{
        borderColor: isLight ? 'rgba(var(--accent-rgb), 0.28)' : 'rgba(var(--accent-rgb), 0.32)',
      }}
    >
      <summary className="font-extrabold text-sm cursor-pointer flex items-center justify-between gap-2 select-none">
        <span className="flex items-center gap-2">
          <span>📖</span>
          <span>Kamus Blok Visual Arduino &amp; Sensor (Klik untuk Membuka)</span>
        </span>
        <span
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
          style={{
            background: 'rgba(var(--accent-rgb), 0.12)',
            color: 'var(--accent-primary)',
            borderColor: 'rgba(var(--accent-rgb), 0.28)',
          }}
        >
          {blocks.length} Blok Penting
        </span>
      </summary>

      <div className="mt-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="block text-xs font-bold">
            🔍 Cari fungsi atau komponen:
            <input
              className={`w-full rounded-xl border px-3 py-2 mt-1 text-xs font-medium outline-none transition ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
                  : 'bg-slate-950 border-slate-800 text-slate-100'
              }`}
              placeholder="Ketik misalnya: lampu, suhu, tombol, tunggu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {block && (
            <label className="block text-xs font-bold">
              🧩 Pilih blok yang ingin dipelajari:
              <select
                aria-label="Pilih blok"
                className={`w-full rounded-xl border px-3 py-2 mt-1 text-xs font-bold outline-none cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-800'
                    : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
                value={block.type}
                onChange={(e) => setSelected(e.target.value)}
              >
                {matches.map((b) => (
                  <option key={b.type} value={b.type}>
                    {b.category} · {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {block ? (
          <div className="space-y-3">
            <div
              className={`rounded-xl p-3 border flex flex-col sm:flex-row items-center gap-4 ${
                isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <img
                className="max-h-28 max-w-full object-contain rounded-lg"
                src={images['../../assets/lessons/blocks/' + block.type + '.png']}
                alt={block.label}
              />
              <div className="space-y-1 text-center sm:text-left">
                <span
                  className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{
                    background: 'rgba(var(--accent-rgb), 0.15)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  Kategori: {block.category}
                </span>
                <h4 className="text-sm font-black">{block.label}</h4>
                <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {block.steps[0]}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {block.steps.map((v, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/50 border-slate-800/90'
                  }`}
                >
                  <dt
                    className="font-extrabold mb-1"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {stepTitles[i] || 'Info'}
                  </dt>
                  <dd className={`leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p role="status" className="text-xs py-2 opacity-75">
            Belum ada blok yang cocok dengan pencarianmu. Coba ketik kata seperti "LED" atau "delay".
          </p>
        )}
      </div>
    </details>
  );
}
