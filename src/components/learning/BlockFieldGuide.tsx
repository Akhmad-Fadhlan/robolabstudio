import { useState } from 'react';
import blocks from '../../data/lessonBlocks.json';

const images = import.meta.glob('../../assets/lessons/blocks/*.png',{eager:true,import:'default'}) as Record<string,string>;
export function BlockFieldGuide() {
  const [query,setQuery] = useState('');
  const [selected,setSelected] = useState(blocks[0].type);
  const matches = blocks.filter(b=>[b.label,b.category,...b.steps].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  const block = matches.find(b=>b.type===selected) ?? matches[0];
  return <details className="rounded-2xl p-4 border border-sky-200 bg-white text-slate-800">
    <summary className="font-bold cursor-pointer text-sky-900">Kamus blok praktik Arduino &amp; IoT</summary>
    <label className="block mt-3 text-sm">Apa yang ingin kamu buat?
      <input className="w-full rounded-lg border p-2 mt-1" placeholder="Misalnya: suhu, lampu, tunggu" value={query} onChange={e=>setQuery(e.target.value)} />
    </label>
    {block ? <><select aria-label="Pilih blok" className="my-2 w-full rounded-lg border p-2" value={block.type} onChange={e=>setSelected(e.target.value)}>{matches.map(b=><option key={b.type} value={b.type}>{b.category} · {b.label}</option>)}</select>
      <img className="my-3 max-h-32 max-w-full object-contain" src={images['../../assets/lessons/blocks/'+block.type+'.png']} alt={block.label}/>
      <dl className="grid gap-2 text-sm">{block.steps.map((v,i)=><div key={i}><dt className="font-bold text-sky-800">{['Gunanya','Contoh','Cara memasang','Hasil','Coba sendiri','Tips'][i]}</dt><dd>{v}</dd></div>)}</dl>
    </> : <p role="status">Belum ada hasil. Coba nama komponen atau tindakan lain.</p>}
  </details>;
}
