import { useRef } from 'react';

export function SimulatorDivider({ value, onChange }: { value: number; onChange: (width: number) => void }) {
  const dragging = useRef(false);
  const update = (next: number) => onChange(Math.max(30, Math.min(72, Math.round(next))));
  return <div role="separator" aria-orientation="vertical" aria-label="Lebar panel coding simulator"
    aria-valuemin={30} aria-valuemax={72} aria-valuenow={value} aria-valuetext={`${value}%`} tabIndex={0}
    className="lab-divider hidden w-3 shrink-0 touch-none select-none cursor-col-resize items-center justify-center rounded-lg lg:flex"
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.focus({ preventScroll: true });
      dragging.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
      if (bounds && dragging.current) update((event.clientX - bounds.left) / bounds.width * 100);
    }}
    onLostPointerCapture={() => { dragging.current = false; }}
    onDoubleClick={() => update(42)}
    onKeyDown={event => {
      const target = { ArrowLeft: value - 3, ArrowRight: value + 3, Home: 30, End: 72 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      update(target);
    }}>
    <span className="h-10 w-1 rounded-full bg-current opacity-55" aria-hidden="true" />
  </div>;
}
