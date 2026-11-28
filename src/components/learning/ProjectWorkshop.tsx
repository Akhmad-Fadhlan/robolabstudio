import { useState } from 'react';
import projects from '../../data/learningProjects.json';
import blockGuide from '../../data/lessonBlocks.json';

const blockImages = import.meta.glob('../../assets/lessons/blocks/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const projectBlocks: Record<string, string[]> = {
  kedip: ['arduino_setup', 'arduino_loop', 'arduino_pin_mode', 'pin_digital_write', 'arduino_delay'],
  tombol: ['arduino_setup', 'arduino_loop', 'arduino_pin_mode', 'pin_digital_read', 'pin_digital_write', 'controls_if'],
  relay: ['arduino_setup', 'arduino_loop', 'arduino_pin_mode', 'pin_digital_write', 'arduino_delay'],
  pwm: ['arduino_setup', 'arduino_loop', 'pin_analog_write', 'arduino_delay'],
  'motor-dc': ['arduino_setup', 'arduino_loop', 'pin_digital_write', 'pin_analog_write'],
  servo: ['arduino_setup', 'arduino_loop', 'arduino_servo_write', 'arduino_delay'],
  lcd: ['arduino_setup', 'lib_display_begin', 'lib_display_setcursor', 'lib_display_print'],
  wifi: ['arduino_setup', 'esp32_wifi_connect', 'esp32_wifi_status', 'esp32_wifi_ip'],
  bluetooth: ['arduino_setup', 'esp32_bluetooth_begin', 'esp32_bluetooth_available', 'esp32_bluetooth_read'],
  'sensor-dht': ['arduino_setup', 'dht_init', 'dht_read_temp', 'dht_read_humi', 'arduino_serial_print'],
  'robot-soccer': ['arduino_setup', 'esp32_wifi_connect', 'controls_if', 'pin_digital_write', 'pin_analog_write'],
  blynk: ['arduino_setup', 'blynk_config', 'blynk_begin', 'blynk_run', 'blynk_on_write', 'blynk_virtual_write'],
};

export function ProjectWorkshop({ themeMode = 'dark' }: { themeMode?: 'light' | 'dark' }) {
  const isLight = themeMode === 'light';
  const [id, setId] = useState(projects[0].id);
  const project = projects.find((item) => item.id === id)!;
  const root = `/learning-projects/${id}/`;
  const visibleBlocks = blockGuide.filter((block) => projectBlocks[id]?.includes(block.type));

  function figures(files: string[], label: string) {
    return files.map((file, index) => {
      const caption = files.length > 1 ? `${label} · Bagian ${index + 1}/${files.length}` : label;
      return (
        <figure key={file} className="mt-3">
          <a
            href={root + file}
            target="_blank"
            rel="noreferrer"
            aria-label={`Perbesar ${caption}`}
            className="block overflow-hidden rounded-xl border border-slate-200/80 bg-white p-2 shadow-xs transition hover:scale-[1.01]"
          >
            <img
              src={root + file}
              alt={`${caption} untuk ${project.title}`}
              loading="lazy"
              className="w-full rounded-lg object-contain max-h-[340px]"
            />
          </a>
          <figcaption className={`mt-1.5 text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            🔍 {caption} · Klik gambar untuk memperbesar
          </figcaption>
        </figure>
      );
    });
  }

  return (
    <section className="mx-auto max-w-6xl space-y-5">
      {/* Project Picker Pills + Dropdown */}
      <div
        className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0e111a] border-slate-800 shadow-lg'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border inline-block mb-1"
              style={{
                background: 'rgba(var(--accent-rgb), 0.14)',
                color: 'var(--accent-primary)',
                borderColor: 'rgba(var(--accent-rgb), 0.3)',
              }}
            >
              🛠️ Panduan Proyek Langkah-demi-Langkah
            </span>
            <h3 className="text-lg sm:text-xl font-black">{project.title}</h3>
          </div>

          <label className="text-xs font-bold sm:w-72">
            Pilih Proyek Seru:
            <select
              className={`mt-1 block w-full rounded-xl border px-3 py-2.5 text-xs font-bold outline-none cursor-pointer ${
                isLight
                  ? 'border-slate-300 bg-slate-50 text-slate-900'
                  : 'border-slate-700 bg-slate-900 text-slate-100'
              }`}
              value={id}
              onChange={(event) => setId(event.target.value)}
            >
              {projects.map((item, idx) => (
                <option key={item.id} value={item.id}>
                  {idx + 1}. {item.title} ({item.board})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Quick Horizontal Project Pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-500/15">
          {projects.map((item, idx) => {
            const active = item.id === id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setId(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  active
                    ? 'text-white shadow-sm'
                    : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
                style={
                  active
                    ? {
                        background: 'var(--accent-gradient)',
                        borderColor: 'var(--accent-primary)',
                      }
                    : undefined
                }
              >
                {idx + 1}. {item.title}
              </button>
            );
          })}
        </div>

        <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          🎯 <b>Tujuan Proyek:</b> {project.goal}
        </p>
      </div>

      {/* Step 1 & Step 2 Grid */}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section
          className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0e111a] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-gradient)' }}
            >
              1
            </span>
            <h4 className="font-extrabold text-sm sm:text-base">Pasang Rangkaian Kabelnya</h4>
          </div>
          {figures(project.wiring, 'Diagram Rangkaian')}
          {project.note && (
            <div
              className="mt-3 p-3 rounded-xl border text-xs leading-relaxed"
              style={{
                background: 'rgba(var(--accent-rgb), 0.08)',
                borderColor: 'rgba(var(--accent-rgb), 0.25)',
              }}
            >
              💡 <b>Catatan Penting:</b> {project.note}
            </div>
          )}
        </section>

        <section
          className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0e111a] border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent-gradient)' }}
            >
              2
            </span>
            <h4 className="font-extrabold text-sm sm:text-base">Susun Blok Programnya</h4>
          </div>
          {figures(project.blocks, 'Susunan Blok Blockly')}

          <h5 className="mt-5 font-extrabold text-xs uppercase tracking-wider" style={{ color: 'var(--accent-primary)' }}>
            🧩 Blok-Blok yang Dipakai di Proyek Ini:
          </h5>
          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
            {visibleBlocks.map((block) => (
              <article
                key={block.type}
                className={`rounded-xl border p-3 transition ${
                  isLight ? 'border-slate-200 bg-slate-50/70 text-slate-800' : 'border-slate-800 bg-slate-900/70 text-slate-100'
                }`}
              >
                <div className="bg-white rounded-lg p-1.5 flex items-center justify-center">
                  <img
                    src={blockImages[`../../assets/lessons/blocks/${block.type}.png`]}
                    alt={`Blok Blockly ${block.label}`}
                    className="max-h-20 max-w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <h6 className="mt-2 font-extrabold text-xs">{block.label}</h6>
                <p className={`text-xs mt-0.5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  {block.steps[0]}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Step 3: Action Checklist */}
      <section
        className="space-y-3 rounded-2xl border p-5"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.08) 0%, rgba(255,255,255,0.96) 100%)'
            : 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.14) 0%, rgba(14,17,26,0.96) 100%)',
          borderColor: 'rgba(var(--accent-rgb), 0.3)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-xl text-white text-xs font-black flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-gradient)' }}
          >
            3
          </span>
          <h4 className="font-extrabold text-sm sm:text-base">Ayo Jalankan &amp; Uji Proyekmu!</h4>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs sm:text-sm">
          {project.steps.map((step, i) => (
            <li
              key={step}
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <span
                className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  background: 'rgba(var(--accent-rgb), 0.16)',
                  color: 'var(--accent-primary)',
                }}
              >
                {i + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'}`}>
            <strong className="block font-extrabold mb-1 text-emerald-600 dark:text-emerald-400">✅ Hasil yang Benar:</strong>
            <p className="leading-relaxed">{project.result}</p>
          </div>
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-amber-50/80 border-amber-200 text-amber-950' : 'bg-amber-950/30 border-amber-800/50 text-amber-200'}`}>
            <strong className="block font-extrabold mb-1 text-amber-600 dark:text-amber-400">🔧 Kalau Belum Menyala:</strong>
            <p className="leading-relaxed">{project.fix}</p>
          </div>
          <div className={`p-3.5 rounded-xl border ${isLight ? 'bg-purple-50/80 border-purple-200 text-purple-950' : 'bg-purple-950/30 border-purple-800/50 text-purple-200'}`}>
            <strong className="block font-extrabold mb-1 text-purple-600 dark:text-purple-400">🏆 Tantangan Ekstra:</strong>
            <p className="leading-relaxed">{project.challenge}</p>
          </div>
        </div>
      </section>
    </section>
  );
}
