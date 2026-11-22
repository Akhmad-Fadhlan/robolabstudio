import { useState } from 'react';
import {
  normalizeSensorPattern, getDefaultSensorPattern,
  type RobotPlan, type RobotPlanStep, type RobotPlanItem, type SensorCount,
} from '../types/robotSimulator';

const actionOptions = { MAJU: 'Maju', MUNDUR: 'Mundur', LEFT: 'Kiri', RIGHT: 'Kanan', PAUSE: 'Jeda' } as const;
const unitOptions = { ms: 'ms', enc_l: 'Encoder kiri', enc_r: 'Encoder kanan' } as const;
const triggerOptions = { SENSOR: 'Sensor', MOTION: 'Gerak' } as const;
const logicOptions = { EQUAL: 'EQUAL', AND: 'AND', OR: 'OR', XOR: 'XOR' } as const;
const lineOptions = { HITAM: 'Hitam', PUTIH: 'Putih' } as const;
const control = 'lab-control h-9 min-w-20 rounded-lg px-2 text-sm';

function NumberCell({ label, value, min, max, onCommit }: {
  label: string; value: number; min: number; max: number; onCommit: (value: number) => boolean | void;
}) {
  return <input key={value} type="number" aria-label={label} className={control} defaultValue={value} min={min} max={max}
    onBlur={event => {
      const raw = event.currentTarget.valueAsNumber;
      const next = Number.isFinite(raw) ? Math.max(min, Math.min(max, Math.round(raw))) : value;
      event.currentTarget.value = String(next);
      if (next !== value && onCommit(next) === false) event.currentTarget.value = String(value);
    }}
    onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} />;
}

function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: Record<T, string>; onChange: (value: T) => void;
}) {
  return <select className={control} aria-label={label} value={value} onChange={event => onChange(event.target.value as T)}>
    {Object.entries(options).map(([key, name]) => <option value={key} key={key}>{String(name)}</option>)}
  </select>;
}

export function RobotPlanTable({ plans, activeId, sensorCount, running, onChange, onImport }: {
  plans: RobotPlan[];
  activeId: number;
  sensorCount: SensorCount;
  running: boolean;
  onChange: (plans: RobotPlan[], activeId: number) => void;
  onImport: () => string;
}) {
  const [notice, setNotice] = useState('');
  const plan = plans.find(entry => entry.planId === activeId) ?? plans[0];
  const rows = plan?.items.flatMap((item, position) => item.type === 'step' ? [{ item, position }] : []) ?? [];
  const nextIndex = Array.from({ length: 100 }, (_, index) => index).find(index => !rows.some(row => row.item.index === index));
  const nextPlan = Array.from({ length: 10 }, (_, index) => index + 1).find(id => !plans.some(entry => entry.planId === id));

  const replace = (items: RobotPlanItem[]) => {
    if (!plan || running) return;
    setNotice('');
    onChange(plans.map(entry => entry.planId === plan.planId ? { ...entry, items } : entry), plan.planId);
  };
  const patch = (position: number, update: Partial<RobotPlanStep>) => {
    if (update.index !== undefined && rows.some(row => row.position !== position && row.item.index === update.index)) {
      setNotice('Nomor langkah sudah dipakai dalam plan ini.');
      return false;
    }
    replace(plan!.items.map((item, index) => index === position && item.type === 'step' ? { ...item, ...update } : item));
  };
  const setStop = (position: number, stage: '' | 'ACTION' | 'SPEED_A') => {
    const items = [...plan!.items];
    const existing = items[position + 1];
    items.splice(position + 1, existing?.type === 'stop_here' ? 1 : 0, ...(stage ? [{ type: 'stop_here' as const, stage }] : []));
    replace(items);
  };

  return <div className="lab-surface flex h-full min-h-0 flex-col overflow-hidden">
    <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] p-3">
      <div>
        <h3 className="text-sm font-bold">Tabel Robot Plan</h3>
        <p className="text-xs opacity-75">Geser tabel untuk melihat semua pengaturan. Tekan Enter untuk menyimpan angka.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={running} className="lab-control rounded-lg px-3 py-2 text-xs" onClick={() => setNotice(onImport())}>Ambil dari kode teks</button>
        <button type="button" disabled={running || nextPlan === undefined} className="lab-control rounded-lg px-3 py-2 text-xs" onClick={() => {
          if (nextPlan !== undefined) onChange([...plans, { planId: nextPlan, items: [] }], nextPlan);
        }}>Tambah plan</button>
      </div>
    </header>
    <div className="flex flex-wrap gap-2 p-3">
      <label className="flex items-center gap-2 text-xs font-semibold">Plan
        <select className={control} value={plan?.planId ?? ''} disabled={running || !plan} onChange={event => onChange(plans, Number(event.target.value))}>
          {!plan && <option value="">Belum ada plan</option>}
          {plans.map(entry => <option key={entry.planId} value={entry.planId}>Plan {entry.planId}</option>)}
        </select>
      </label>
      <button type="button" disabled={running || !plan || nextIndex === undefined} className="lab-control rounded-lg px-3 py-2 text-xs" onClick={() => {
        if (!plan || nextIndex === undefined) return;
        replace([...plan.items, { type: 'step', index: nextIndex, action: 'MAJU', triggerMode: 'MOTION', triggerValue: 500, triggerUnit: 'ms',
          sensorPattern: getDefaultSensorPattern(sensorCount), logicOp: 'OR', brake: 0, speedL: 80, speedR: 80, pidId: 0,
          speedA: 0, timerValue: 0, timerUnit: 'ms', lineColor: 'HITAM' }]);
      }}>Tambah langkah</button>
      {notice && <p role="status" className="self-center text-xs">{notice}</p>}
    </div>
    <fieldset className="min-h-0 min-w-0 flex-1 overflow-auto" disabled={running}>
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10">
          <tr>{['Langkah', 'Arah', 'Pemicu', 'Nilai pemicu', 'Satuan', 'Pola sensor', 'Logika', 'Garis', 'PWM kiri', 'PWM kanan', 'Rem (ms)', 'PID', 'Kecepatan A', 'Durasi A', 'Satuan A', 'Berhenti', ''].map((heading, index) =>
            <th className="lab-surface whitespace-nowrap px-2 py-2" scope="col" key={index}>{heading}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(({ item, position }) => {
            const edit = (update: Partial<RobotPlanStep>) => patch(position, update);
            const label = (name: string) => `${name}, langkah ${item.index}`;
            const number = (key: 'index' | 'triggerValue' | 'speedL' | 'speedR' | 'brake' | 'pidId' | 'speedA' | 'timerValue', title: string, min: number, max: number) =>
              <NumberCell label={label(title)} value={item[key]} min={min} max={max} onCommit={value => edit({ [key]: value })} />;
            const next = plan?.items[position + 1];
            const cells = [
              number('index', 'Nomor', 0, 99),
              <Choice label={label('Arah')} value={item.action} options={actionOptions} onChange={action => edit({ action })} />,
              <Choice label={label('Pemicu')} value={item.triggerMode} options={triggerOptions} onChange={triggerMode => edit({ triggerMode })} />,
              number('triggerValue', 'Nilai pemicu', 0, 20000),
              <Choice label={label('Satuan pemicu')} value={item.triggerUnit} options={unitOptions} onChange={triggerUnit => edit({ triggerUnit })} />,
              <input key={item.sensorPattern} aria-label={label('Pola sensor')} defaultValue={item.sensorPattern} maxLength={sensorCount}
                className={control} onBlur={event => {
                  const sensorPattern = normalizeSensorPattern(event.currentTarget.value, sensorCount);
                  event.currentTarget.value = sensorPattern;
                  if (sensorPattern !== item.sensorPattern) edit({ sensorPattern });
                }} />,
              <Choice label={label('Logika')} value={item.logicOp} options={logicOptions} onChange={logicOp => edit({ logicOp })} />,
              <Choice label={label('Warna garis')} value={item.lineColor} options={lineOptions} onChange={lineColor => edit({ lineColor })} />,
              number('speedL', 'PWM kiri', -255, 255), number('speedR', 'PWM kanan', -255, 255), number('brake', 'Rem', 0, 1000),
              number('pidId', 'PID', 0, 5), number('speedA', 'Kecepatan A', -255, 255), number('timerValue', 'Durasi A', 0, 10000),
              <Choice label={label('Satuan A')} value={item.timerUnit} options={unitOptions} onChange={timerUnit => edit({ timerUnit })} />,
              <Choice label={label('Berhenti')} value={next?.type === 'stop_here' ? next.stage : ''} options={{ '': 'Lanjut', ACTION: 'Setelah aksi', SPEED_A: 'Setelah A' }} onChange={stage => setStop(position, stage)} />,
              <button type="button" aria-label={label('Hapus')} className="lab-control rounded-lg px-2 py-1" onClick={() => {
                const items = [...plan!.items];
                items.splice(position, next?.type === 'stop_here' ? 2 : 1);
                replace(items);
              }}>Hapus</button>,
            ];
            return <tr key={item.blockId ?? position}>{cells.map((cell, index) => <td className="border-t border-[var(--glass-border)] p-2" key={index}>{cell}</td>)}</tr>;
          })}
        </tbody>
      </table>
      {!rows.length && <p className="p-4 text-sm opacity-75">Tambahkan plan dan langkah untuk mulai.</p>}
    </fieldset>
  </div>;
}
