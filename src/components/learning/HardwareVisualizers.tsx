// src/components/learning/HardwareVisualizers.tsx
// Visualizer interaktif untuk materi pembelajaran hardware Arduino

import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Radio, AlertTriangle, CheckCircle, RefreshCw, Send, Sliders } from 'lucide-react';

// ==========================================
// 1. PINOUT INTERACTIVE VISUALIZER
// ==========================================
export const ArduinoPinoutVisualizer: React.FC = () => {
  const [selectedPin, setSelectedPin] = useState<string>('D13');

  const pinsData: Record<string, { label: string; type: string; features: string[]; desc: string; voltage: string; maxCurrent: string }> = {
    'D13': { label: 'Pin D13 (Built-in LED)', type: 'Digital I/O & SPI SCK', features: ['Onboard LED', 'SPI Clock (SCK)'], desc: 'Terhubung langsung ke LED warna oranye bawaan Arduino Uno melalui resistor seri.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D12': { label: 'Pin D12 (MISO)', type: 'Digital I/O & SPI', features: ['SPI MISO (Master In Slave Out)'], desc: 'Jalur input data dari periferal SPI (seperti SD Card atau RFID) menuju mikrokontroler.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D11': { label: 'Pin D11 (PWM ~ / MOSI)', type: 'Digital I/O, PWM & SPI', features: ['PWM ~ (490Hz)', 'SPI MOSI'], desc: 'Mendukung analogWrite() untuk pengatur kecerahan/kecepatan dan jalur kirim SPI.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D10': { label: 'Pin D10 (PWM ~ / SS)', type: 'Digital I/O, PWM & SPI', features: ['PWM ~ (490Hz)', 'SPI Slave Select (SS)'], desc: 'Mendukung sinyal PWM dan sering digunakan sebagai Chip Select (CS) untuk layar atau modul SD.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D9': { label: 'Pin D9 (PWM ~)', type: 'Digital I/O & PWM', features: ['PWM ~ (490Hz)', 'Timer1 Pin'], desc: 'Pin PWM favorit untuk mengendalikan servo motor atau motor DC shield.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D3': { label: 'Pin D3 (PWM ~ / INT1)', type: 'Digital I/O, PWM & Interrupt', features: ['PWM ~ (490Hz)', 'Hardware Interrupt 1'], desc: 'Mendukung external interrupt seketika saat sinyal berubah dengan attachInterrupt().', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D2': { label: 'Pin D2 (INT0)', type: 'Digital I/O & Interrupt', features: ['Hardware Interrupt 0'], desc: 'Pin interupsi eksternal utama untuk sensor encoder putaran atau tombol darurat.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D1': { label: 'Pin D1 (TX)', type: 'Hardware Serial TX', features: ['UART Transmit (TX)'], desc: 'Kirim data serial ke komputer. Jangan hubungkan beban jika menggunakan Serial.begin()!', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'D0': { label: 'Pin D0 (RX)', type: 'Hardware Serial RX', features: ['UART Receive (RX)'], desc: 'Terima data serial dari komputer via chip USB. Jangan pasang sensor jika upload program.', voltage: '5.0V TTL', maxCurrent: '20 mA' },
    'A0': { label: 'Pin A0 (ADC Input)', type: 'Analog Input & GPIO', features: ['ADC 10-bit (0-1023)', 'Digital Pin 14'], desc: 'Membaca tegangan 0-5V dari potensiometer, sensor suhu LM35, atau sensor LDR.', voltage: '0.0V s/d 5.0V Analog', maxCurrent: 'Impedansi Tinggi (ADC)' },
    'A4': { label: 'Pin A4 (SDA / ADC4)', type: 'Analog Input & I2C SDA', features: ['I2C Serial Data (SDA)', 'ADC 10-bit'], desc: 'Jalur kabel data I2C untuk menghubungkan LCD 16x2 I2C, sensor MPU6050, dan RTC.', voltage: '5.0V TTL (Open-Drain)', maxCurrent: '20 mA' },
    'A5': { label: 'Pin A5 (SCL / ADC5)', type: 'Analog Input & I2C SCL', features: ['I2C Serial Clock (SCL)', 'ADC 10-bit'], desc: 'Jalur detak clock sinkronisasi protokol I2C.', voltage: '5.0V TTL (Open-Drain)', maxCurrent: '20 mA' },
    '5V': { label: 'Pin 5V (Power Output)', type: 'Regulated DC Power', features: ['VCC 5.0V Regulated'], desc: 'Tegangan keluaran teregulasi 5V dari regulator onboard untuk daya IC dan sensor.', voltage: '5.0V DC (+/- 5%)', maxCurrent: 'Maks ~500 mA (USB)' },
    '3.3V': { label: 'Pin 3.3V (Power Output)', type: 'Regulated DC Power', features: ['VCC 3.3V Regulated'], desc: 'Tegangan keluaran 3.3V untuk sensor modern sensitif (ESP, NRF24, dsb).', voltage: '3.3V DC', maxCurrent: 'Maks 50 mA' },
    'GND': { label: 'Pin GND (Ground)', type: 'Ground Reference', features: ['0 Volt Reference'], desc: 'Jalur referensi 0V. Seluruh komponen dan power supply eksternal wajib berbagi common ground.', voltage: '0.0V Ground', maxCurrent: 'Semua Arus Kembali' }
  };

  const current = pinsData[selectedPin] || pinsData['D13'];

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Interactive Uno Pinout Inspector</span>
        </span>
        <span className="text-[8px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
          ATmega328P
        </span>
      </div>

      {/* Pin Selector Pills */}
      <div className="flex flex-wrap gap-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
        {Object.keys(pinsData).map(p => (
          <button
            key={p}
            onClick={() => setSelectedPin(p)}
            className={`px-1.5 py-1 text-[8.5px] font-mono font-bold rounded transition cursor-pointer ${
              selectedPin === p
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Pin Details Card */}
      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 shadow-inner">
        <div>
          <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <h4 className="text-[11px] font-bold text-white font-mono">{current.label}</h4>
              <span className="text-[8.5px] text-sky-400 font-semibold">{current.type}</span>
            </div>
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
              {current.voltage}
            </span>
          </div>

          <p className="text-[9.5px] text-slate-300 leading-relaxed mt-2.5">
            {current.desc}
          </p>

          <div className="mt-3 flex flex-wrap gap-1">
            {current.features.map((feat, i) => (
              <span key={i} className="text-[8px] font-semibold bg-blue-950/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/50">
                ✓ {feat}
              </span>
            ))}
          </div>
        </div>

        <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 flex items-center justify-between text-[9px] font-mono">
          <span className="text-slate-400">Arus Aman Maks:</span>
          <span className="text-amber-400 font-bold">{current.maxCurrent}</span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. DIGITAL OUTPUT & LED RESISTOR VISUALIZER
// ==========================================
export const DigitalOutputVisualizer: React.FC = () => {
  const [pinState, setPinState] = useState<'HIGH' | 'LOW'>('HIGH');
  const [resistance, setResistance] = useState<number>(220); // 220 Ohm

  const vSupply = pinState === 'HIGH' ? 5.0 : 0.0;
  const vLed = pinState === 'HIGH' ? 2.0 : 0.0;
  const currentMa = pinState === 'HIGH' ? Math.round(((vSupply - vLed) / resistance) * 1000 * 10) / 10 : 0.0;
  const isSafe = currentMa <= 25.0;

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulasi Digital Output & LED</span>
        </span>
      </div>

      {/* Interactive Switch */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
        <span className="text-[9.5px] font-mono text-slate-300">digitalWrite(pin, ...)</span>
        <button
          onClick={() => setPinState(prev => prev === 'HIGH' ? 'LOW' : 'HIGH')}
          className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition shadow cursor-pointer ${
            pinState === 'HIGH'
              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/40'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          {pinState === 'HIGH' ? '⚡ HIGH (5V)' : '⚪ LOW (0V)'}
        </button>
      </div>

      {/* Virtual Circuit Animation */}
      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-3 relative shadow-inner">
        {/* Animated LED Graphic */}
        <div className="relative flex flex-col items-center">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
              pinState === 'HIGH'
                ? 'bg-amber-400 shadow-[0_0_35px_#f59e0b] ring-4 ring-amber-300/60 scale-105'
                : 'bg-slate-800 border-2 border-slate-700'
            }`}
          >
            <span className={`text-[10px] font-bold font-mono ${pinState === 'HIGH' ? 'text-amber-950' : 'text-slate-500'}`}>
              {pinState === 'HIGH' ? 'ON' : 'OFF'}
            </span>
          </div>
          <span className="text-[8px] font-mono text-slate-400 mt-1">LED (Vf ≈ 2.0V)</span>
        </div>

        {/* Resistor Control Slider */}
        <div className="w-full space-y-1 mt-1">
          <div className="flex justify-between text-[8.5px] font-mono text-slate-400">
            <span>Resistor Seri (R):</span>
            <span className="text-amber-400 font-bold">{resistance} Ω</span>
          </div>
          <input
            type="range"
            min={100}
            max={1000}
            step={10}
            value={resistance}
            onChange={(e) => setResistance(Number(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        {/* Real-time Math Output */}
        <div className="w-full bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1 font-mono text-[8.5px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Arus Beban (I = V/R):</span>
            <span className={`font-bold ${isSafe ? 'text-emerald-400' : 'text-red-400'}`}>
              {currentMa} mA
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isSafe ? (
              <span className="text-emerald-400 text-[8px] flex items-center gap-1">
                <CheckCircle className="w-3 h-3 inline" /> Arus aman (di bawah batas 20mA)
              </span>
            ) : (
              <span className="text-red-400 text-[8px] flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 inline" /> Resistor terlalu kecil! Risiko merusak pin.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. DIGITAL INPUT & PULL-UP VISUALIZER
// ==========================================
export const DigitalInputVisualizer: React.FC = () => {
  const [mode, setMode] = useState<'INPUT_PULLUP' | 'FLOATING'>('INPUT_PULLUP');
  const [isPressed, setIsPressed] = useState<boolean>(false);
  const [noiseVal, setNoiseVal] = useState<number>(0);

  useEffect(() => {
    if (mode === 'FLOATING' && !isPressed) {
      const interval = setInterval(() => {
        setNoiseVal(Math.random() > 0.5 ? 1 : 0);
      }, 180);
      return () => clearInterval(interval);
    }
  }, [mode, isPressed]);

  const liveState = mode === 'INPUT_PULLUP' 
    ? (isPressed ? 0 : 1) // Active-LOW
    : (isPressed ? 1 : noiseVal);

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>Input & Pull-Up Simulator</span>
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
        <button
          onClick={() => setMode('INPUT_PULLUP')}
          className={`py-1 text-[8.5px] font-mono font-bold rounded transition cursor-pointer ${
            mode === 'INPUT_PULLUP'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          INPUT_PULLUP
        </button>
        <button
          onClick={() => setMode('FLOATING')}
          className={`py-1 text-[8.5px] font-mono font-bold rounded transition cursor-pointer ${
            mode === 'FLOATING'
              ? 'bg-red-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Floating (Tanpa R)
        </button>
      </div>

      {/* Interactive Button */}
      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-3.5 shadow-inner">
        <button
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center transition-transform select-none cursor-pointer ${
            isPressed
              ? 'bg-sky-600/30 border-sky-400 scale-95 shadow-[0_0_20px_#38bdf8]'
              : 'bg-slate-900 border-slate-700 hover:border-slate-500'
          }`}
        >
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {isPressed ? 'Ditekan' : 'Tekan & Tahan'}
          </span>
          <span className="text-[8px] font-mono text-slate-400 mt-1">Push Button</span>
        </button>

        {/* Live Logic State Display */}
        <div className="w-full bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 font-mono text-[9px] space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">digitalRead(pin):</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              liveState === 1
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {liveState === 1 ? 'HIGH (1)' : 'LOW (0)'}
            </span>
          </div>

          <div className="text-[8px] text-slate-400 leading-normal border-t border-slate-800/80 pt-1.5">
            {mode === 'INPUT_PULLUP' ? (
              <span className="text-emerald-400">
                ✓ Stabil Active-LOW: Dilepas = HIGH (5V), Ditekan = LOW (0V).
              </span>
            ) : (
              <span className="text-red-400">
                ⚠️ Floating Pin: Saat tombol dilepas, sinyal acak akibat noise udara bebas!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. ADC ANALOG INPUT & VOLTAGE GAUGE
// ==========================================
export const AdcHardwareVisualizer: React.FC = () => {
  const [voltage, setVoltage] = useState<number>(2.5); // 0.0V s/d 5.0V

  const adcVal = Math.round((voltage / 5.0) * 1023);
  const binary10Bit = adcVal.toString(2).padStart(10, '0');

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>ADC 10-Bit Converter</span>
        </span>
        <span className="text-[8px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
          analogRead(A0)
        </span>
      </div>

      {/* Voltage Potentiometer Slider */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex justify-between text-[9px] font-mono text-slate-300">
          <span>Tegangan Fisik Pin (Vin):</span>
          <span className="text-emerald-400 font-bold">{voltage.toFixed(2)} Volt</span>
        </div>
        <input
          type="range"
          min={0.0}
          max={5.0}
          step={0.05}
          value={voltage}
          onChange={(e) => setVoltage(Number(e.target.value))}
          className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
        />
        <div className="flex justify-between text-[7.5px] font-mono text-slate-500">
          <span>0.0V (GND)</span>
          <span>2.5V</span>
          <span>5.0V (VCC)</span>
        </div>
      </div>

      {/* ADC 10-Bit Gauge & Math Breakdown */}
      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner font-mono text-[9px]">
        <div>
          <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-1">Nilai ADC Register ATmega328P:</span>
          <div className="text-2xl font-bold text-white flex items-baseline gap-2">
            <span>{adcVal}</span>
            <span className="text-xs text-slate-500 font-normal">/ 1023</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 transition-all duration-150"
              style={{ width: `${(adcVal / 1023) * 100}%` }}
            />
          </div>

          {/* 10-bit Binary Stream */}
          <div className="mt-3 p-2 bg-slate-900 rounded border border-slate-800 text-[8px] flex items-center justify-between">
            <span className="text-slate-500">Bit Register (10-bit):</span>
            <span className="text-sky-300 font-bold tracking-widest">{binary10Bit}</span>
          </div>
        </div>

        {/* Calculation Box */}
        <div className="p-2.5 bg-blue-950/30 rounded border border-blue-900/40 text-[8px] text-blue-200 leading-relaxed">
          <span className="font-bold block text-blue-300 mb-0.5">Rumus Konversi:</span>
          Vin = ({adcVal} / 1023) × 5.0V = <strong>{voltage.toFixed(2)} V</strong>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. PWM DUTY CYCLE & WAVE OSCILLOSCOPE
// ==========================================
export const PwmHardwareVisualizer: React.FC = () => {
  const [pwmVal, setPwmVal] = useState<number>(128); // 0 s/d 255

  const dutyPct = Math.round((pwmVal / 255) * 100);
  const avgVoltage = Math.round((pwmVal / 255) * 5.0 * 100) / 100;

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-purple-400" />
          <span>PWM Waveform Oscilloscope</span>
        </span>
        <span className="text-[8px] font-mono bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
          Pin ~9 (490Hz)
        </span>
      </div>

      {/* analogWrite Slider */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
        <div className="flex justify-between text-[9px] font-mono text-slate-300">
          <span>analogWrite(9, ...)</span>
          <span className="text-purple-400 font-bold">{pwmVal} / 255</span>
        </div>
        <input
          type="range"
          min={0}
          max={255}
          value={pwmVal}
          onChange={(e) => setPwmVal(Number(e.target.value))}
          className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded cursor-pointer"
        />
        <div className="flex justify-between text-[7.5px] font-mono text-slate-500">
          <span>0 (0%)</span>
          <span>Duty {dutyPct}%</span>
          <span>255 (100%)</span>
        </div>
      </div>

      {/* Simulated Oscilloscope Waveform */}
      <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner">
        <div className="w-full h-24 bg-slate-900/90 rounded border border-slate-800 p-2 relative overflow-hidden flex flex-col justify-between">
          <div className="text-[7.5px] font-mono text-slate-500 flex justify-between">
            <span>CH1: 5V/DIV</span>
            <span>FREQ: ~490 Hz</span>
          </div>

          {/* SVG Square Wave */}
          <svg className="w-full h-12 stroke-purple-400 fill-none" viewBox="0 0 300 40">
            {/* Draw 3 PWM periods */}
            {[0, 100, 200].map(offset => {
              const highWidth = Math.max(2, Math.min(98, (dutyPct / 100) * 100));
              const lowWidth = 100 - highWidth;
              return (
                <path
                  key={offset}
                  d={`M ${offset} 35 L ${offset} 5 L ${offset + highWidth} 5 L ${offset + highWidth} 35 L ${offset + 100} 35`}
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          <div className="text-[7.5px] font-mono text-slate-500 flex justify-between">
            <span>GND</span>
            <span className="text-purple-300 font-bold">Duty: {dutyPct}%</span>
          </div>
        </div>

        {/* LED Opacity Preview & Voltage Output */}
        <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 font-mono text-[8.5px]">
          <div>
            <span className="text-slate-400 block text-[7.5px]">Tegangan Rata-Rata:</span>
            <span className="text-purple-400 font-bold text-xs">{avgVoltage.toFixed(2)} V</span>
          </div>
          {/* Virtual LED */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-slate-400">LED Dimmer:</span>
            <div
              className="w-5 h-5 rounded-full bg-purple-400 transition-all duration-100 ring-2 ring-purple-300/40"
              style={{
                opacity: Math.max(0.08, pwmVal / 255),
                boxShadow: pwmVal > 20 ? `0 0 ${pwmVal / 10}px #c084fc` : 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. SERIAL UART TELEMETRY VISUALIZER
// ==========================================
export const SerialHardwareVisualizer: React.FC = () => {
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [logs, setLogs] = useState<string[]>([
    "[TX -> RX] Serial link initialized at 9600 baud.",
    "[DATA] Sensor Suhu: 27.4 C | Status: OK"
  ]);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);

  const handleSendPacket = () => {
    setIsBlinking(true);
    const newLog = `[TELEMETRY] Packet #${logs.length + 1} sent: { temp: ${(25 + Math.random() * 5).toFixed(1)}, adc: ${Math.floor(Math.random() * 1023)} }`;
    setLogs(prev => [...prev.slice(-6), newLog]);
    setTimeout(() => setIsBlinking(false), 300);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span>Serial UART Telemetry Monitor</span>
        </span>
      </div>

      {/* Baud Rate & Controls */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800">
        <div className="flex items-center gap-1">
          <span className="text-[8.5px] font-mono text-slate-400">Baud:</span>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 text-[8.5px] font-mono text-white rounded px-1.5 py-0.5"
          >
            <option value={9600}>9600 bps</option>
            <option value={115200}>115200 bps</option>
          </select>
        </div>

        {/* Blinking LEDs indicator */}
        <div className="flex items-center gap-2 font-mono text-[7.5px]">
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isBlinking ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'}`} />
            TX (D1)
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isBlinking ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
            RX (D0)
          </span>
        </div>
      </div>

      {/* Virtual Terminal Output */}
      <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[8.5px] flex flex-col justify-between shadow-inner">
        <div className="space-y-1 overflow-y-auto max-h-[160px] text-emerald-400 pr-1">
          {logs.map((log, i) => (
            <div key={i} className="leading-relaxed truncate">{log}</div>
          ))}
        </div>

        <button
          onClick={handleSendPacket}
          className="mt-2 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[8.5px] flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
        >
          <Send className="w-3 h-3" />
          <span>Kirim Data Telemetri Uji</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 7. I2C BUS & SCANNER VISUALIZER
// ==========================================
export const I2cBusVisualizer: React.FC = () => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [detectedDevices, setDetectedDevices] = useState<string[]>(['0x27', '0x68']);

  const devicesMap: Record<string, string> = {
    '0x27': 'LCD Karakter 16x2 I2C',
    '0x68': 'Sensor IMU MPU6050',
    '0x3C': 'OLED Display SSD1306'
  };

  const runScan = () => {
    setIsScanning(true);
    setDetectedDevices([]);
    setTimeout(() => {
      setDetectedDevices(['0x27', '0x3C', '0x68']);
      setIsScanning(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span>I2C Bus & Sensor Scanner</span>
        </span>
        <span className="text-[8px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30">
          SDA (A4) / SCL (A5)
        </span>
      </div>

      {/* Bus Lines Illustration */}
      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[8.5px]">
        <div className="flex items-center justify-between text-teal-400">
          <span>── SDA (Serial Data / A4) ──</span>
          <span className="text-[7.5px] text-slate-400">Pulled-up 4.7k</span>
        </div>
        <div className="flex items-center justify-between text-sky-400">
          <span>── SCL (Serial Clock / A5) ──</span>
          <span className="text-[7.5px] text-slate-400">Master Clock</span>
        </div>
      </div>

      {/* Detected Devices List */}
      <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col justify-between shadow-inner">
        <div>
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            Perangkat Terhubung ({detectedDevices.length}):
          </span>

          <div className="space-y-1.5">
            {detectedDevices.map((addr) => (
              <div
                key={addr}
                className="flex items-center justify-between p-2 rounded bg-slate-900 border border-teal-500/30 text-[8.5px] font-mono animate-fadeIn"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span className="font-bold text-white">{addr}</span>
                </div>
                <span className="text-slate-400">{devicesMap[addr] || 'Unknown Device'}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={runScan}
          disabled={isScanning}
          className="mt-3 w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-mono font-bold text-[8.5px] flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
          <span>{isScanning ? 'Memindai Alamat 0x01-0x7F...' : 'Pindai Bus I2C Sekarang'}</span>
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 8. HARDWARE INTERRUPT VISUALIZER
// ==========================================
export const InterruptHardwareVisualizer: React.FC = () => {
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [lastTriggerTime, setLastTriggerTime] = useState<string>('Belum Terpicu');
  const [loopProgress, setLoopProgress] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLoopProgress(prev => (prev + 5) % 100);
    }, 150);
    return () => clearInterval(timer);
  }, []);

  const triggerInterrupt = () => {
    setPulseCount(prev => prev + 1);
    const now = new Date();
    setLastTriggerTime(`${now.getSeconds()}.${String(now.getMilliseconds()).padStart(3, '0')}s`);
  };

  return (
    <div className="flex flex-col h-full gap-3 text-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-rose-400" />
          <span>Hardware Interrupt Demo (Pin D2)</span>
        </span>
      </div>

      {/* Simulated Slow Background Loop */}
      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[8.5px]">
        <div className="flex justify-between text-slate-400">
          <span>Background loop() [delay 3000ms]:</span>
          <span className="text-blue-400">{loopProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${loopProgress}%` }}
          />
        </div>
      </div>

      {/* Instant Interrupt Trigger Button */}
      <div className="flex-1 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between items-center shadow-inner">
        <button
          onClick={triggerInterrupt}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 flex flex-col items-center justify-center gap-1 cursor-pointer select-none transition-all"
        >
          <span>🚨 Picu Interupsi Hardware (Pin D2)</span>
          <span className="text-[8px] font-normal opacity-80">Merespons Seketika Mengabaikan delay()</span>
        </button>

        {/* ISR Telemetry Counter */}
        <div className="w-full bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[9px] space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-400">volatile int pulseCount:</span>
            <span className="text-rose-400 font-bold text-sm">{pulseCount} kali</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 pt-1 border-t border-slate-800">
            <span>Timestamp ISR Terakhir:</span>
            <span className="text-slate-300">{lastTriggerTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
