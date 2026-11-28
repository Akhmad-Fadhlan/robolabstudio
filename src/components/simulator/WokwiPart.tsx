import { createElement, useEffect, useRef } from 'react';
import '@wokwi/elements';
import tags from './wokwi-catalog.json';

export const wokwiParts = tags;
export const wokwiPartWidth = 184;
export const wokwiPartHeight = 128;
export const wokwiPartName = (tag: string) => {
  const customNames: Record<string, string> = {
    'wokwi-led': 'LED Standar 5mm',
    'wokwi-rgb-led': 'LED RGB 4-Pin',
    'wokwi-neopixel': 'Smart LED RGB Addressable',
    'wokwi-led-ring': 'Cincin LED RGB 16-Bit',
    'wokwi-neopixel-matrix': 'Matriks LED RGB 8x8',
    'wokwi-7segment': 'Layar Angka 7-Segmen',
    'wokwi-led-bar-graph': 'Bar Graph LED 10-Segmen',
    'wokwi-LCD1602': 'Layar Karakter LCD 16x2',
    'wokwi-ssd1306': 'Layar OLED Grafis 128x64 I2C',
    'wokwi-ili9341': 'Layar TFT Warna 240x320 SPI',
    'wokwi-pushbutton': 'Tombol Tekan Taktil 12mm',
    'wokwi-pushbutton-6mm': 'Tombol Tekan Mini 6mm',
    'wokwi-slide-switch': 'Sakelar Geser SPDT',
    'wokwi-dip-switch-8': 'Sakelar DIP 8-Kanal',
    'wokwi-potentiometer': 'Potensiometer Putar Analog',
    'wokwi-slide-potentiometer': 'Potensiometer Geser Linear',
    'wokwi-analog-joystick': 'Joystick Analog 2-Axis',
    'wokwi-ky-040': 'Rotary Encoder Modul KY-040',
    'wokwi-membrane-keypad': 'Keypad Membran Matriks 4x4',
    'wokwi-hc-sr04': 'Sensor Jarak Ultrasonik HC-SR04',
    'wokwi-dht22': 'Sensor Suhu & Kelembapan DHT22',
    'wokwi-pir-motion-sensor': 'Sensor Gerak Inframerah PIR',
    'wokwi-photoresistor-sensor': 'Sensor Cahaya Modul LDR',
    'wokwi-ntc-temperature-sensor': 'Sensor Suhu Termistor NTC',
    'wokwi-gas-sensor': 'Sensor Deteksi Gas MQ',
    'wokwi-flame-sensor': 'Sensor Deteksi Api Inframerah',
    'wokwi-big-sound-sensor': 'Sensor Suara Mikrofon Sensitif',
    'wokwi-small-sound-sensor': 'Sensor Suara Mikrofon Mini',
    'wokwi-heart-beat-sensor': 'Sensor Detak Jantung Pulsa',
    'wokwi-mpu6050': 'Sensor Giroskop & Akselerometer 6-Axis',
    'wokwi-hx711': ' Penguat Sensor Berat Load Cell HX711',
    'wokwi-ds1307': 'Modul Jam Waktu Nyata RTC DS1307',
    'wokwi-microsd-card': 'Modul Pembaca Kartu MicroSD SPI',
    'wokwi-ir-receiver': 'Penerima Sinyal Inframerah 38kHz',
    'wokwi-ir-remote': 'Remote Kontrol Inframerah',
    'wokwi-buzzer': 'Buzzer Piezoelektrik Aktif/Pasif',
    'wokwi-servo': 'Motor Servo Presisi 180°',
    'wokwi-stepper-motor': 'Motor Stepper Bipolar 4-Kabel',
    'wokwi-resistor': 'Resistor Pembatas Arus',
  };
  if (customNames[tag]) return customNames[tag];
  return tag
    .replace(/^wokwi-/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
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
