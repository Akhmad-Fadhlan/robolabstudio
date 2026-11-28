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

/**
 * Interactive Visual Connected Circuit Schematic for each of the 12 Workshop Projects
 */
function ProjectVisualCircuit({ projectId, board }: { projectId: string; board: string }) {
  const isUno = board.toLowerCase().includes('uno');

  const renderBoard = (pins: Array<{ id: string; y: number; color: string }>) => {
    if (isUno) {
      return (
        <g>
          <rect x="14" y="20" width="122" height="176" rx="10" fill="#008184" stroke="#005f61" strokeWidth="2" />
          <rect x="19" y="25" width="112" height="166" rx="7" fill="none" stroke="#2dd4bf" strokeOpacity="0.3" strokeWidth="1" />
          <rect x="6" y="40" width="22" height="28" rx="3" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          <rect x="8" y="148" width="24" height="24" rx="3" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <rect x="44" y="88" width="42" height="72" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
          <text x="65" y="127" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace" transform="rotate(-90 65 127)">
            ATMEGA328P
          </text>
          <text x="65" y="42" textAnchor="middle" fontSize="9.5" fontWeight="900" fill="#ffffff">
            ARDUINO
          </text>
          <text x="65" y="54" textAnchor="middle" fontSize="8" fontWeight="800" fill="#a7f3d0" fontFamily="monospace">
            UNO R3
          </text>
          <rect x="118" y="32" width="12" height="154" rx="2.5" fill="#0f172a" />
          {pins.map((p) => (
            <g key={p.id}>
              <rect x="82" y={p.y - 6.5} width="46" height="13" rx="3" fill="#042f2e" stroke={p.color} strokeWidth="1.1" />
              <text x="105" y={p.y + 3} textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                {p.id}
              </text>
              <circle cx="132" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
            </g>
          ))}
        </g>
      );
    }
    return (
      <g>
        <rect x="14" y="20" width="122" height="176" rx="9" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
        <path d="M 42 28 H 96 M 42 32 H 86" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
        <rect x="34" y="38" width="72" height="54" rx="4" fill="#d4d4d8" stroke="#71717a" strokeWidth="1.5" />
        <text x="70" y="63" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#18181b" fontFamily="monospace">
          ESP-WROOM-32
        </text>
        <text x="70" y="75" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#3f3f46" fontFamily="monospace">
          Wi-Fi + BLE
        </text>
        <rect x="54" y="188" width="32" height="11" rx="2.5" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.2" />
        <rect x="118" y="32" width="12" height="154" rx="2" fill="#27272a" />
        {pins.map((p) => (
          <g key={p.id}>
            <rect x="78" y={p.y - 6.5} width="50" height="13" rx="3" fill="#090d16" stroke={p.color} strokeWidth="1.1" />
            <text x="103" y={p.y + 3} textAnchor="middle" fontSize="7.2" fontWeight="900" fill="#ffffff" fontFamily="monospace">
              {p.id}
            </text>
            <circle cx="132" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
          </g>
        ))}
      </g>
    );
  };

  const renderProjectScene = () => {
    switch (projectId) {
      case 'kedip': // D9 -> 330Ω -> LED -> GND
      case 'bluetooth': // GPIO25 -> 330Ω -> LED -> GND
        return (
          <>
            {renderBoard([
              { id: projectId === 'kedip' ? 'D9' : 'GPIO25', y: 80, color: '#06b6d4' },
              { id: 'GND', y: 152, color: '#64748b' },
            ])}
            <path d="M 132 80 H 192 M 244 80 H 312 V 96" fill="none" stroke="#06b6d4" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* 330Ω Resistor */}
            <rect x="192" y="73" width="52" height="14" rx="4" fill="#e6c28b" stroke="#855b35" strokeWidth="1.3" />
            <rect x="202" y="73.5" width="3.5" height="13" fill="#f97316" />
            <rect x="211" y="73.5" width="3.5" height="13" fill="#f97316" />
            <rect x="220" y="73.5" width="3.5" height="13" fill="#78350f" />
            <rect x="231" y="73.5" width="3" height="13" fill="#eab308" />
            <text x="218" y="67" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#fbbf24" fontFamily="monospace">
              Resistor 330Ω
            </text>
            {/* GND return wire */}
            <path d="M 132 152 H 328 V 96" fill="none" stroke="#64748b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            {/* Glowing Red LED */}
            <circle cx="320" cy="64" r="24" fill="rgba(239,68,68,0.35)" />
            <line x1="312" y1="80" x2="312" y2="96" stroke="#cbd5e1" strokeWidth="2.8" />
            <line x1="328" y1="80" x2="328" y2="96" stroke="#94a3b8" strokeWidth="2.8" />
            <circle cx="312" cy="96" r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.2" />
            <circle cx="328" cy="96" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
            <path d="M 306 80 L 306 60 A 14 14 0 0 1 334 60 L 334 80 Z" fill="#ef4444" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.4" />
            <rect x="303" y="76" width="34" height="4" rx="2" fill="#ef4444" />
            <text x="302" y="96" textAnchor="end" fontSize="8" fontWeight="900" fill="#06b6d4" fontFamily="monospace">Anoda (+)</text>
            <text x="338" y="96" textAnchor="start" fontSize="8" fontWeight="900" fill="#94a3b8" fontFamily="monospace">Katoda (−)</text>
            <text x="320" y="38" textAnchor="middle" fontSize="9" fontWeight="900" fill="#f87171">
              {projectId === 'bluetooth' ? 'LED BLUETOOTH (GPIO25)' : 'LED UTAMA (D9)'}
            </text>
          </>
        );

      case 'tombol': // D9 -> 330Ω -> LED -> GND, plus D2 -> Button -> GND
        return (
          <>
            {renderBoard([
              { id: 'D9', y: 60, color: '#ef4444' },
              { id: 'D2', y: 112, color: '#38bdf8' },
              { id: 'GND', y: 164, color: '#64748b' },
            ])}
            {/* D9 -> 330Ω -> LED */}
            <path d="M 132 60 H 184 M 228 60 H 276 V 76" fill="none" stroke="#ef4444" strokeWidth="2.8" strokeLinejoin="round" />
            <rect x="184" y="54" width="44" height="12" rx="3.5" fill="#e6c28b" stroke="#855b35" strokeWidth="1.2" />
            <text x="206" y="49" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#fbbf24" fontFamily="monospace">330Ω</text>
            <circle cx="282" cy="50" r="16" fill="rgba(239,68,68,0.35)" />
            <path d="M 271 64 L 271 48 A 11 11 0 0 1 293 48 L 293 64 Z" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
            <line x1="276" y1="64" x2="276" y2="76" stroke="#cbd5e1" strokeWidth="2.5" />
            <line x1="288" y1="64" x2="288" y2="76" stroke="#94a3b8" strokeWidth="2.5" />
            {/* D2 -> Push Button */}
            <g transform="translate(328, 96)">
              <rect x="0" y="0" width="54" height="54" rx="9" fill="#334155" stroke="#94a3b8" strokeWidth="1.8" />
              <circle cx="27" cy="27" r="14" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.4" />
              <text x="27" y="-7" textAnchor="middle" fontSize="8" fontWeight="900" fill="#38bdf8">TOMBOL</text>
              <circle cx="0" cy="16" r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="40" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <path d="M 132 112 H 328" fill="none" stroke="#38bdf8" strokeWidth="2.8" />
            {/* Common GND to LED Cathode & Button Terminal B */}
            <path d="M 132 164 H 310 V 136 H 328 M 288 164 V 76" fill="none" stroke="#64748b" strokeWidth="2.8" strokeLinejoin="round" />
            <circle cx="288" cy="164" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
          </>
        );

      case 'pwm': // D9 -> 330Ω -> LED -> GND, plus Potentiometer 5V, A0, GND
        return (
          <>
            {renderBoard([
              { id: '~D9 PWM', y: 50, color: '#a855f7' },
              { id: '5V', y: 88, color: '#ef4444' },
              { id: 'A0 (ADC)', y: 126, color: '#10b981' },
              { id: 'GND', y: 166, color: '#64748b' },
            ])}
            {/* ~D9 -> 330Ω -> LED */}
            <path d="M 132 50 H 180 M 220 50 H 264 V 66" fill="none" stroke="#a855f7" strokeWidth="2.8" strokeLinejoin="round" />
            <rect x="180" y="44" width="40" height="12" rx="3" fill="#e6c28b" stroke="#855b35" strokeWidth="1.2" />
            <text x="200" y="39" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#fbbf24" fontFamily="monospace">330Ω</text>
            <circle cx="270" cy="42" r="15" fill="rgba(168,85,247,0.4)" />
            <path d="M 260 56 L 260 40 A 10 10 0 0 1 280 40 L 280 56 Z" fill="#a855f7" stroke="#ffffff" strokeWidth="1.2" />
            <line x1="264" y1="56" x2="264" y2="66" stroke="#cbd5e1" strokeWidth="2.4" />
            <line x1="276" y1="56" x2="276" y2="66" stroke="#94a3b8" strokeWidth="2.4" />
            {/* Potentiometer on Far Right */}
            <g transform="translate(346, 98)">
              <circle cx="0" cy="0" r="28" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="0" cy="0" r="13" fill="#cbd5e1" />
              <line x1="0" y1="0" x2="9" y2="-9" stroke="#0f172a" strokeWidth="2.8" strokeLinecap="round" />
              <text x="0" y="-34" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#60a5fa">POT 10kΩ</text>
              <line x1="-14" y1="26" x2="-14" y2="42" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="0" y1="28" x2="0" y2="42" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="14" y1="26" x2="14" y2="42" stroke="#cbd5e1" strokeWidth="2.5" />
              <circle cx="-14" cy="42" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              <circle cx="0" cy="42" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
              <circle cx="14" cy="42" r="3" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
            </g>
            <path d="M 132 88 H 302 V 140 H 332" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 132 126 H 292 V 154 H 346 V 140" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M 132 166 H 360 V 140 M 276 166 V 66" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="276" cy="166" r="3.2" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
          </>
        );

      case 'relay': // D7 -> Relay IN, 5V -> VCC, GND -> GND, COM/NO -> Lamp 5V
        return (
          <>
            {renderBoard([
              { id: 'D7', y: 60, color: '#06b6d4' },
              { id: '5V', y: 110, color: '#ef4444' },
              { id: 'GND', y: 160, color: '#64748b' },
            ])}
            {/* Relay Module in Center */}
            <g transform="translate(186, 44)">
              <rect x="0" y="0" width="96" height="130" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.8" />
              <rect x="16" y="22" width="64" height="86" rx="5" fill="#2563eb" stroke="#93c5fd" strokeWidth="1.2" />
              <text x="48" y="60" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#ffffff" fontFamily="monospace">RELAY 5V</text>
              <text x="48" y="74" textAnchor="middle" fontSize="7" fontWeight="700" fill="#bfdbfe" fontFamily="monospace">10A / 250VAC</text>
              {/* Left Input Pins */}
              <circle cx="0" cy="16" r="3.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.2" />
              <text x="6" y="19" fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">IN</text>
              <circle cx="0" cy="66" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <text x="6" y="69" fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">VCC</text>
              <circle cx="0" cy="116" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
              <text x="6" y="119" fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">GND</text>
              {/* Right Screw Terminals (COM & NO) */}
              <circle cx="96" cy="40" r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <text x="89" y="43" textAnchor="end" fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">COM</text>
              <circle cx="96" cy="90" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
              <text x="89" y="93" textAnchor="end" fontSize="6.8" fontWeight="900" fill="#ffffff" fontFamily="monospace">NO</text>
            </g>
            <path d="M 132 60 H 186" fill="none" stroke="#06b6d4" strokeWidth="2.8" />
            <path d="M 132 110 H 186" fill="none" stroke="#ef4444" strokeWidth="2.8" />
            <path d="M 132 160 H 186" fill="none" stroke="#64748b" strokeWidth="2.8" />
            {/* 5V DC Lamp on Far Right */}
            <g transform="translate(346, 108)">
              <circle cx="0" cy="0" r="24" fill="rgba(250,204,21,0.3)" />
              <circle cx="0" cy="0" r="16" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
              <text x="0" y="-28" textAnchor="middle" fontSize="8" fontWeight="900" fill="#facc15">LAMPU 5V DC</text>
              <circle cx="-8" cy="20" r="3.2" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
              <circle cx="8" cy="20" r="3.2" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
            </g>
            <path d="M 162 110 V 32 H 302 V 84 H 282" fill="none" stroke="#ef4444" strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M 282 134 H 338 V 128" fill="none" stroke="#f59e0b" strokeWidth="2.8" strokeLinejoin="round" />
            <path d="M 162 160 V 184 H 354 V 128" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinejoin="round" />
          </>
        );

      case 'motor-dc': // D5, D6 -> MX1508 Driver IN1, IN2 -> N20 Motor + 4.8V NiMH Pack
      case 'robot-soccer': // ESP32 GPIO18,19,22,23 -> MX1508 -> 2x N20 Motors + 4.8V NiMH
        return (
          <>
            {renderBoard(
              projectId === 'motor-dc'
                ? [
                    { id: 'D5 (PWM)', y: 62, color: '#06b6d4' },
                    { id: 'D6 (PWM)', y: 102, color: '#38bdf8' },
                    { id: 'GND', y: 158, color: '#64748b' },
                  ]
                : [
                    { id: 'GPIO18', y: 52, color: '#06b6d4' },
                    { id: 'GPIO19', y: 82, color: '#38bdf8' },
                    { id: 'GPIO22', y: 112, color: '#10b981' },
                    { id: 'GPIO23', y: 142, color: '#a855f7' },
                    { id: 'GND', y: 172, color: '#64748b' },
                  ]
            )}
            {/* MX1508 Dual H-Bridge Driver */}
            <g transform="translate(186, 36)">
              <rect x="0" y="0" width="92" height="114" rx="8" fill="#881337" stroke="#f43f5e" strokeWidth="1.8" />
              <rect x="22" y="34" width="48" height="44" rx="4" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
              <text x="46" y="54" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fda4af" fontFamily="monospace">MX1508</text>
              <text x="46" y="66" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="#e4e4e7" fontFamily="monospace">H-BRIDGE</text>
              <circle cx="30" cy="114" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
              <text x="30" y="106" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#fca5a5" fontFamily="monospace">VM+</text>
              <circle cx="62" cy="114" r="3.5" fill="#64748b" stroke="#ffffff" strokeWidth="1" />
              <text x="62" y="106" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#cbd5e1" fontFamily="monospace">GND</text>
            </g>
            {/* Input wires from Board to Driver */}
            {projectId === 'motor-dc' ? (
              <>
                <path d="M 132 62 H 186" fill="none" stroke="#06b6d4" strokeWidth="2.6" />
                <path d="M 132 102 H 186" fill="none" stroke="#38bdf8" strokeWidth="2.6" />
                <path d="M 132 158 H 248 V 150" fill="none" stroke="#64748b" strokeWidth="2.6" />
              </>
            ) : (
              <>
                <path d="M 132 52 H 186" fill="none" stroke="#06b6d4" strokeWidth="2.4" />
                <path d="M 132 82 H 186" fill="none" stroke="#38bdf8" strokeWidth="2.4" />
                <path d="M 132 112 H 186" fill="none" stroke="#10b981" strokeWidth="2.4" />
                <path d="M 132 142 H 186" fill="none" stroke="#a855f7" strokeWidth="2.4" />
                <path d="M 132 172 H 248 V 150" fill="none" stroke="#64748b" strokeWidth="2.4" />
              </>
            )}
            {/* 4.8V NiMH Battery Pack at Bottom */}
            <g transform="translate(186, 168)">
              <rect x="0" y="0" width="92" height="28" rx="6" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
              <text x="46" y="17" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#e0e7ff" fontFamily="monospace">
                BATERAI 4.8V NiMH
              </text>
            </g>
            <line x1="216" y1="150" x2="216" y2="168" stroke="#ef4444" strokeWidth="2.8" />
            <line x1="248" y1="150" x2="248" y2="168" stroke="#64748b" strokeWidth="2.8" />
            {/* N20 Geared DC Motor(s) on Right */}
            <g transform="translate(314, 42)">
              <rect x="0" y="0" width="68" height="44" rx="7" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" />
              <rect x="68" y="8" width="12" height="28" rx="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
              <text x="34" y="25" textAnchor="middle" fontSize="8" fontWeight="900" fill="#1e293b" fontFamily="monospace">MOTOR N20 A</text>
            </g>
            <path d="M 278 56 H 314 M 278 70 H 314" fill="none" stroke="#a855f7" strokeWidth="2.6" />
            {projectId === 'robot-soccer' && (
              <>
                <g transform="translate(314, 104)">
                  <rect x="0" y="0" width="68" height="44" rx="7" fill="#eab308" stroke="#fef08a" strokeWidth="1.5" />
                  <rect x="68" y="8" width="12" height="28" rx="4" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.2" />
                  <text x="34" y="25" textAnchor="middle" fontSize="8" fontWeight="900" fill="#1e293b" fontFamily="monospace">MOTOR N20 B</text>
                </g>
                <path d="M 278 118 H 314 M 278 132 H 314" fill="none" stroke="#a855f7" strokeWidth="2.6" />
              </>
            )}
          </>
        );

      case 'servo': // D9 -> Servo Signal, +5V -> V+, GND -> GND
        return (
          <>
            {renderBoard([
              { id: '~D9 PWM', y: 64, color: '#f59e0b' },
              { id: '5V', y: 112, color: '#ef4444' },
              { id: 'GND', y: 160, color: '#64748b' },
            ])}
            {/* SG90 Micro Servo on Right */}
            <g transform="translate(234, 54)">
              <rect x="0" y="16" width="110" height="82" rx="9" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="2" />
              <rect x="-10" y="34" width="10" height="16" rx="2" fill="#1e40af" />
              <rect x="110" y="34" width="10" height="16" rx="2" fill="#1e40af" />
              {/* White Servo Horn Arm */}
              <circle cx="72" cy="48" r="20" fill="#1e293b" stroke="#93c5fd" strokeWidth="1.5" />
              <rect x="66" y="8" width="12" height="44" rx="6" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="72" cy="48" r="5" fill="#64748b" />
              <text x="48" y="84" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                SERVO SG90 (0°-180°)
              </text>
              {/* 3 Leads on Left */}
              <circle cx="0" cy="10" r="3.8" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="58" r="3.8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <circle cx="0" cy="106" r="3.8" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
            </g>
            <path d="M 132 64 H 234" fill="none" stroke="#f59e0b" strokeWidth="3" />
            <text x="183" y="58" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#f59e0b" fontFamily="monospace">Sinyal PWM (Oranye)</text>
            <path d="M 132 112 H 234" fill="none" stroke="#ef4444" strokeWidth="3" />
            <text x="183" y="106" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#ef4444" fontFamily="monospace">+5V Catu (Merah)</text>
            <path d="M 132 160 H 234" fill="none" stroke="#64748b" strokeWidth="3" />
            <text x="183" y="154" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#94a3b8" fontFamily="monospace">GND Bersama (Cokelat)</text>
          </>
        );

      case 'lcd': // 5V, GND, A4 SDA, A5 SCL -> LCD 16x2 I2C
        return (
          <>
            {renderBoard([
              { id: '5V', y: 54, color: '#ef4444' },
              { id: 'GND', y: 88, color: '#64748b' },
              { id: 'A4 (SDA)', y: 124, color: '#10b981' },
              { id: 'A5 (SCL)', y: 160, color: '#38bdf8' },
            ])}
            <g transform="translate(220, 40)">
              <rect x="0" y="0" width="152" height="136" rx="9" fill="#15803d" stroke="#22c55e" strokeWidth="2" />
              <rect x="14" y="18" width="126" height="66" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              <rect x="18" y="22" width="118" height="58" rx="3" fill="#84cc16" />
              <text x="77" y="46" textAnchor="middle" fontSize="11" fontWeight="900" fill="#1a2e05" fontFamily="monospace">
                HALO ROBO
              </text>
              <text x="77" y="66" textAnchor="middle" fontSize="10" fontWeight="800" fill="#365314" fontFamily="monospace">
                BELAJAR I2C
              </text>
              <text x="77" y="122" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#bbf7d0" fontFamily="monospace">
                LCD 16x2 I2C (0x27)
              </text>
              {[
                { label: 'VCC', y: 14, color: '#ef4444' },
                { label: 'GND', y: 48, color: '#64748b' },
                { label: 'SDA', y: 84, color: '#10b981' },
                { label: 'SCL', y: 120, color: '#38bdf8' },
              ].map((p) => (
                <g key={p.label}>
                  <circle cx="0" cy={p.y} r="3.8" fill={p.color} stroke="#ffffff" strokeWidth="1.2" />
                  <text x="7" y={p.y + 3} fontSize="7" fontWeight="900" fill="#ffffff" fontFamily="monospace">{p.label}</text>
                </g>
              ))}
            </g>
            <path d="M 132 54 H 220" fill="none" stroke="#ef4444" strokeWidth="3" />
            <path d="M 132 88 H 220" fill="none" stroke="#64748b" strokeWidth="3" />
            <path d="M 132 124 H 220" fill="none" stroke="#10b981" strokeWidth="3" />
            <path d="M 132 160 H 220" fill="none" stroke="#38bdf8" strokeWidth="3" />
          </>
        );

      case 'wifi': // ESP32 USB + WiFi Router
        return (
          <>
            {renderBoard([
              { id: 'Wi-Fi 2.4G', y: 74, color: '#38bdf8' },
              { id: 'USB Serial', y: 140, color: '#10b981' },
            ])}
            <g transform="translate(230, 38)">
              <rect x="0" y="0" width="144" height="62" rx="9" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
              <text x="72" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="#38bdf8" fontFamily="monospace">
                📶 ROUTER WI-FI 2.4GHz
              </text>
              <text x="72" y="44" textAnchor="middle" fontSize="8" fontWeight="700" fill="#34d399" fontFamily="monospace">
                IP: 192.168.1.105
              </text>
            </g>
            <path d="M 132 74 H 230" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5 3" />
            <g transform="translate(230, 114)">
              <rect x="0" y="0" width="144" height="62" rx="9" fill="#0f172a" stroke="#10b981" strokeWidth="1.8" />
              <text x="72" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="#10b981" fontFamily="monospace">
                💻 SERIAL MONITOR
              </text>
              <text x="72" y="44" textAnchor="middle" fontSize="8" fontWeight="700" fill="#e2e8f0" fontFamily="monospace">
                Kabel USB Data (115200)
              </text>
            </g>
            <path d="M 132 140 H 230" fill="none" stroke="#10b981" strokeWidth="3" />
          </>
        );

      case 'sensor-dht': // 3V3, GPIO27 DATA, GND -> DHT11 Sensor
      case 'blynk': // ESP32 + DHT11 (GPIO27) + Relay (GPIO25)
      default:
        return (
          <>
            {renderBoard(
              projectId === 'blynk'
                ? [
                    { id: '3V3', y: 48, color: '#ef4444' },
                    { id: 'GPIO27', y: 84, color: '#10b981' },
                    { id: 'GPIO25', y: 124, color: '#38bdf8' },
                    { id: 'GND', y: 164, color: '#64748b' },
                  ]
                : [
                    { id: '3V3', y: 58, color: '#ef4444' },
                    { id: 'GPIO27', y: 110, color: '#10b981' },
                    { id: 'GND', y: 162, color: '#64748b' },
                  ]
            )}
            {/* DHT11 Blue Grid Sensor Module */}
            <g transform="translate(242, 34)">
              <rect x="0" y="0" width="124" height={projectId === 'blynk' ? 80 : 142} rx="9" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
              <text x="62" y="28" textAnchor="middle" fontSize="10" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                SENSOR DHT11
              </text>
              <text x="62" y="46" textAnchor="middle" fontSize="8" fontWeight="700" fill="#e0f2fe" fontFamily="monospace">
                Suhu °C &amp; Lembap %
              </text>
              <circle cx="0" cy="14" r="3.8" fill="#ef4444" stroke="#ffffff" strokeWidth="1.2" />
              <text x="7" y="17" fontSize="7" fontWeight="900" fill="#ffffff" fontFamily="monospace">VCC</text>
              <circle cx="0" cy={projectId === 'blynk' ? 50 : 76} r="3.8" fill="#10b981" stroke="#ffffff" strokeWidth="1.2" />
              <text x="7" y={projectId === 'blynk' ? 53 : 79} fontSize="7" fontWeight="900" fill="#ffffff" fontFamily="monospace">DATA</text>
              {projectId !== 'blynk' && (
                <>
                  <circle cx="0" cy="128" r="3.8" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
                  <text x="7" y="131" fontSize="7" fontWeight="900" fill="#ffffff" fontFamily="monospace">GND</text>
                </>
              )}
            </g>
            {projectId === 'blynk' ? (
              <>
                <path d="M 132 48 H 242" fill="none" stroke="#ef4444" strokeWidth="2.8" />
                <path d="M 132 84 H 242" fill="none" stroke="#10b981" strokeWidth="2.8" />
                {/* Relay module for Blynk V0 */}
                <g transform="translate(242, 124)">
                  <rect x="0" y="0" width="124" height="58" rx="8" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.8" />
                  <text x="62" y="25" textAnchor="middle" fontSize="9" fontWeight="900" fill="#ffffff" fontFamily="monospace">
                    MODUL RELAY 5V
                  </text>
                  <text x="62" y="42" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#93c5fd" fontFamily="monospace">
                    Blynk V0 → Lampu
                  </text>
                  <circle cx="0" cy="14" r="3.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.2" />
                  <circle cx="0" cy="40" r="3.8" fill="#64748b" stroke="#ffffff" strokeWidth="1.2" />
                </g>
                <path d="M 132 124 H 242" fill="none" stroke="#38bdf8" strokeWidth="2.8" />
                <path d="M 132 164 H 242" fill="none" stroke="#64748b" strokeWidth="2.8" />
              </>
            ) : (
              <>
                <path d="M 132 58 H 242" fill="none" stroke="#ef4444" strokeWidth="3" />
                <path d="M 132 110 H 242" fill="none" stroke="#10b981" strokeWidth="3" />
                <path d="M 132 162 H 242" fill="none" stroke="#64748b" strokeWidth="3" />
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-slate-700/80 bg-[#070a12] p-3 text-slate-100 shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs font-extrabold">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Visual Rangkaian Terhubung ({board})</span>
        </span>
        <span className="text-[10px] font-mono text-slate-400">Pin-to-Pin Schematic</span>
      </div>
      <svg
        viewBox="0 0 400 208"
        className="w-full h-auto max-h-[250px] select-none"
        role="img"
        aria-label={`Diagram visual rangkaian terhubung untuk proyek ${projectId}`}
      >
        <defs>
          <pattern id="projCircuitGrid" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="400" height="208" fill="url(#projCircuitGrid)" />
        {renderProjectScene()}
      </svg>
    </div>
  );
}

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
          {/* Interactive Visual Connected Schematic */}
          <ProjectVisualCircuit projectId={project.id} board={project.board} />
          {figures(project.wiring, 'Tabel Sambungan Pin')}
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
