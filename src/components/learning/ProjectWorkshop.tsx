import { useState } from 'react';
import projects from '../../data/learningProjects.json';

export function ProjectWorkshop() {
  const [id, setId] = useState(projects[0].id);
  const project = projects.find(item => item.id === id)!;
  const root = `/learning-projects/${id}/`;

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
      <section className="min-w-0 rounded-2xl border border-slate-400/40 p-4"><h4 className="font-bold">2. Susun blok</h4>{figures(project.blocks, 'Susunan Blockly')}</section>
    </div>
    <section className="space-y-2 rounded-2xl bg-sky-50 p-5 text-slate-900"><h4 className="font-bold">3. Coba proyekmu</h4><ol className="list-decimal space-y-2 pl-5">{project.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <p><strong>Amati hasilnya. </strong>{project.result}</p><p><strong>Jika belum sesuai. </strong>{project.fix}</p><p><strong>Tantangan. </strong>{project.challenge}</p>
    </section>
  </section>;
}
