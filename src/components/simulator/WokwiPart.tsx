import { createElement, useEffect, useRef } from 'react';
import '@wokwi/elements';
import tags from './wokwi-catalog.json';

export const wokwiParts = tags;
export const wokwiPartWidth = 184;
export const wokwiPartHeight = 128;
export const wokwiPartName = (tag: string) => tag.replace(/^wokwi-/, '').replace(/-/g, ' ').toUpperCase();
export const wokwiPartPinId = (id: string, index: number) => `${id}:${index}`;

export interface WokwiPin {
  name: string;
  signals?: { type: string; signal?: string; voltage?: number }[];
  x: number;
  y: number;
}

type WokwiElement = HTMLElement & {
  updateComplete?: Promise<unknown>;
  pinInfo?: WokwiPin[];
};

export function WokwiPart({ id, tag, onPins, displayState }: { id: string; tag: string; onPins: (id: string, pins: WokwiPin[]) => void; displayState?: Record<string, boolean | number> }) {
  const element = useRef<WokwiElement>(null);
  useEffect(() => {
    const part = element.current;
    if (!part) return;
    let mounted = true;
    const measure = () => {
      if (!mounted) return;
      const width = part.offsetWidth;
      const height = part.offsetHeight;
      if (!width || !height) return;
      const scale = Math.min((wokwiPartWidth - 16) / width, (wokwiPartHeight - 24) / height, 1);
      part.style.transform = `scale(${scale})`;
      onPins(id, (part.pinInfo || []).filter(pin => Number.isFinite(pin.x) && Number.isFinite(pin.y)).map(pin => ({
        name: pin.name, signals: pin.signals, x: 8 + pin.x * scale, y: 8 + pin.y * scale,
      })));
    };
    void Promise.resolve(part.updateComplete).then(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(part);
    return () => { mounted = false; observer.disconnect(); };
  }, [id, onPins, tag]);

  useEffect(() => {
    if (element.current && displayState) Object.assign(element.current, displayState);
  }, [displayState]);

  return <foreignObject width={wokwiPartWidth} height={wokwiPartHeight} pointerEvents="none">
    <div className="relative h-full w-full overflow-hidden">
      {createElement(tag, { ref: element, style: { position: 'absolute', top: 8, left: 8, display: 'inline-block', transformOrigin: 'top left' } })}
      <span className="absolute inset-x-1 bottom-0 truncate bg-white/90 px-1 text-center text-[7px] font-semibold text-slate-800">{wokwiPartName(tag)}</span>
    </div>
  </foreignObject>;
}
