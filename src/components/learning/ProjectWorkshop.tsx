import { useState } from 'react';
import projects from '../../data/learningProjects.json';
import blockGuide from '../../data/lessonBlocks.json';

const blockImages = import.meta.glob('../../assets/lessons/blocks/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const projectBlocks: Record<string, string[]> = {
  kedip: ['arduino_setup','arduino_loop','arduino_pin_mode','pin_digital_write','arduino_delay'],
  tombol: ['arduino_setup','arduino_loop','arduino_pin_mode','pin_digital_read','pin_digital_write','controls_if'],
  relay: ['arduino_setup','arduino_loop','arduino_pin_mode','pin_digital_write','arduino_delay'],
  pwm: ['arduino_setup','arduino_loop','pin_analog_write','arduino_delay'],
  'motor-dc': ['arduino_setup','arduino_loop','pin_digital_write','pin_analog_write'],
  servo: ['arduino_setup','arduino_loop','arduino_servo_write','arduino_delay'],
  lcd: ['arduino_setup','lib_display_begin','lib_display_setcursor','lib_display_print'],
  wifi: ['arduino_setup','esp32_wifi_connect','esp32_wifi_status','esp32_wifi_ip'],
  bluetooth: ['arduino_setup','esp32_bluetooth_begin','esp32_bluetooth_available','esp32_bluetooth_read'],
  'sensor-dht': ['arduino_setup','dht_init','dht_read_temp','dht_read_humi','arduino_serial_print'],
  'robot-soccer': ['arduino_setup','esp32_wifi_connect','controls_if','pin_digital_write','pin_analog_write'],
  blynk: ['arduino_setup','blynk_config','blynk_begin','blynk_run','blynk_on_write','blynk_virtual_write'],
};

export function ProjectWorkshop() {
  const [id, setId] = useState(projects[0].id);
  const project = projects.find(item => item.id === id)!;
  const root = `/learning-projects/${id}/`;
  const visibleBlocks = blockGuide.filter(block => projectBlocks[id]?.includes(block.type));

  function figures(files: string[], label: string) {
    return files.map((file, index) => {
      const caption = files.length > 1 ? `${label} · ${index + 1}/${files.length}` : label;
      return <figure key={file} className="mt-3">
        <a href={root + file} target="_blank" rel="noreferrer" aria-label={`Perbesar ${caption}`}>
          <img src={root + file} alt={`${caption} untuk ${project.title}`} loading="lazy" className="w-full rounded-xl bg-white p-2" />
        </a>
        <figcaption className="mt-1 text-xs">{caption} · Ketuk untuk memperbesar</figcaption>
      </figure>;
    });
  }

  return <section className="mx-auto max-w-6xl space-y-5">
    <label className="block text-sm font-semibold">Pilih proyek
      <select className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900" value={id} onChange={event => setId(event.target.value)}>
        {projects.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
      </select>
    </label>
    <header><p className="text-sm font-semibold">{project.board}</p><h3 className="text-2xl font-bold">{project.title}</h3><p>{project.goal}</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-slate-400/40 p-4"><h4 className="font-bold">1. Telusuri rangkaian</h4>{figures(project.wiring, 'Diagram rangkaian')}{project.note && <p className="mt-3 text-sm">{project.note}</p>}</section>
      <section className="min-w-0 rounded-2xl border border-slate-400/40 p-4"><h4 className="font-bold">2. Susun blok</h4>
        {figures(project.blocks, 'Contoh program Blockly')}
        <h5 className="mt-5 font-bold">Kenali blok yang dipakai</h5>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {visibleBlocks.map(block => <article key={block.type} className="rounded-xl border border-slate-200 bg-white p-3 text-slate-800">
            <img src={blockImages[`../../assets/lessons/blocks/${block.type}.png`]} alt={`Blok Blockly ${block.label}`} className="max-h-24 max-w-full object-contain" loading="lazy" />
            <h6 className="mt-2 font-bold">{block.label}</h6>
            <p className="text-sm">{block.steps[0]}</p>
            <p className="mt-1 text-xs text-slate-600">{block.steps[2]}</p>
          </article>)}
        </div>
      </section>
    </div>
    <section className="space-y-2 rounded-2xl bg-sky-50 p-5 text-slate-900"><h4 className="font-bold">3. Coba proyekmu</h4><ol className="list-decimal space-y-2 pl-5">{project.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p><strong>Amati hasilnya. </strong>{project.result}</p><p><strong>Jika belum sesuai. </strong>{project.fix}</p><p><strong>Tantangan. </strong>{project.challenge}</p>
    </section>
  </section>;
}
