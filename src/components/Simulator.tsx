Warning: truncated output (original token count: 51861)
Total output lines: 4112

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, RotateCcw, Zap, Trash2, Edit3, Move, Wifi, ChevronDown, Lock, Palette, Check, Bot } from 'lucide-react';
import { RobotArena3D } from './RobotArena3D';
import {
  type RobotHardwareConfig,
  type RobotPlan,
  type ActiveExecutionHighlight,
  createDefaultRobotHardwareConfig,
  createDefaultRobotPlans,
} from '../types/robotSimulator';

interface ProgramPinConfig {
  ledPin?: string;
  ledPins?: string[];
  servoPin?: string;
  servoPins?: string[];
  ultrasonicTrigPin?: string;
  ultrasonicEchoPin?: string;
  potPin?: string;
  potPins?: string[];
  btnPin?: string;
  btnPins?: string[];
}

export interface Wire {
  from: string;
  to: string; // pin id or 'floating'
  toCoord?: { x: number; y: number };
  color: string;
  bendPoints: { x: number; y: number }[];
}

const MICROBIT_ICONS: { [key: string]: string } = {
  HEART: "09090:99999:99999:09990:00900",
  HEART_SMALL: "00000:09090:09990:00900:00000",
  HAPPY: "00000:09090:00000:90009:09990",
  SMILE: "00000:09090:00000:90009:09990",
  SAD: "00000:09090:00000:09990:90009",
  CONFUSED: "00000:09090:00000:09090:90909",
  ANGRY: "90009:09090:00000:99999:90009",
  ASLEEP: "00000:99099:00000:09990:00000",
  SURPRISED: "00000:09090:00000:09990:09090",
  YES: "00000:00009:00090:09000:00000",
  NO: "90009:09090:00900:09090:90009"
};

const FONT_5X5: { [char: string]: string } = {
  '0': "09990:90009:90009:90009:09990",
  '1': "00900:09900:00900:00900:09990",
  '2': "09990:90009:00090:00900:99999",
  '3': "99999:00090:00990:90009:09990",
  '4': "90009:90009:99999:00009:00009",
  '5': "99999:90000:99990:00009:99990",
  '6': "09990:90000:99990:90009:09990",
  '7': "99999:00009:00090:00900:00900",
  '8': "09990:90009:09990:90009:09990",
  '9': "09990:90009:09999:00009:09990",
  'A': "09900:90090:99990:90090:90090",
  'B': "99990:90009:99990:90009:99990",
  'C': "09990:90000:90000:90000:09990",
  'D': "99900:90090:90090:90090:99900",
  'E': "99999:90000:99900:90000:99999",
  'F': "99999:90000:99900:90000:90000",
  'G': "09990:90000:90099:90009:09990",
  'H': "90009:90009:99999:90009:90009",
  'I': "09990:00900:00900:00900:09990",
  'J': "00009:00009:00009:90009:09990",
  'K': "90009:90090:99000:90090:90009",
  'L': "90000:90000:90000:90000:99999",
  'M': "90009:99099:90909:90009:90009",
  'N': "90009:99009:90909:90099:90009",
  'O': "09990:90009:90009:90009:09990",
  'P': "99990:90009:99990:90000:90000",
  'Q': "09990:90009:90009:90099:09999",
  'R': "99990:90009:99990:90090:90009",
  'S': "09999:90000:09990:00009:99990",
  'T': "99999:00900:00900:00900:00900",
  'U': "90009:90009:90009:90009:09990",
  'V': "90009:90009:90009:09090:00900",
  'W': "90009:90009:90909:99099:90009",
  'X': "90009:09090:00900:09090:90009",
  'Y': "90009:09090:00900:00900:00900",
  'Z': "99999:00090:00900:09000:99999",
  ' ': "00000:00000:00000:00000:00000",
  '!': "00900:00900:00900:00000:00900",
  '?': "09990:00009:00990:00000:00900",
  '.': "00000:00000:00000:00000:00900",
  ',': "00000:00000:00000:00900:00900",
  ':': "00000:00900:00000:00900:00000",
  ';': "00000:00900:00000:00900:00900",
  '-': "00000:00000:09990:00000:00000",
  '+': "00000:00900:09990:00900:00000",
  '*': "00000:09090:00900:09090:00000",
  '/': "00009:00090:00900:00900:09000",
  '=': "00000:09990:00000:09990:00000",
};

function generateScrollFrames(text: string): string[] {
  // Convert each char to 5 rows of 5 binary pixels (0/9)
  const rows: string[][] = [[], [], [], [], []];
  
  // Pad the start with empty space so it enters from the right
  for (let r = 0; r < 5; r++) {
    rows[r].push(...Array(5).fill('0'));
  }
  
  // Add each char representation
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    const pattern = FONT_5X5[char] || FONT_5X5['?'];
    const pRows = pattern.split(':');
    
    for (let r = 0; r < 5; r++) {
      const pRow = pRows[r] || '00000';
      rows[r].push(...pRow.split(''));
      // spacing column
      rows[r].push('0');
    }
  }
  
  // Pad the end with empty space so it leaves to the left
  for (let r = 0; r < 5; r++) {
    rows[r].push(...Array(5).fill('0'));
  }
  
  // Now extract 5x5 frames at each step
  const totalCols = rows[0].length;
  const frames: string[] = [];
  
  for (let step = 0; step <= totalCols - 5; step++) {
    const frameRows: string[] = [];
    for (let r = 0; r < 5; r++) {
      const slice = rows[r].slice(step, step + 5).join('');
      frameRows.push(slice);
    }
    frames.push(frameRows.join(':'));
  }
  
  return frames;
}

interface SimulatorProps {
  isRunning: boolean;
  robotCommand: string;
  sensorData: { 
    distance: number; 
    temp: number; 
    humidity?: number;
    battery: number; 
    accelX?: number; 
    accelY?: number; 
    accelZ?: number; 
    gesture?: string;
    rfidCardPresent?: boolean;
    rfidUid?: string;
  };
  board: string;
  activePythonCode: string;
  activeCode?: string;
  microbitFrames?: string[];
  pinStates?: { [pin: string]: 'HIGH' | 'LOW' | number };
  onPinStateChange?: (pin: string, state: 'HIGH' | 'LOW' | number) => void;
  programPins?: ProgramPinConfig;
  onSensorDataChange?: (data: any) => void;
  
  // Lifted state props for synchronization
  potValue?: number;
  onPotValueChange?: (val: number) => void;
  buttonPressed?: boolean;
  onButtonPressedChange?: (pressed: boolean) => void;
  activeComponents?: string[];
  onActiveComponentsChange?: (components: string[]) => void;
  positions?: { [key: string]: { x: number; y: number } };
  onPositionsChange?: (positions: { [key: string]: { x: number; y: number } }) => void;
  wires?: Wire[];
  onWiresChange?: (wires: Wire[]) => void;
  isExpanded?: boolean;
  blynkStatus?: 'offline' | 'connecting' | 'online';
  blynkVirtualPins?: { [vpin: string]: number };
  onBlynkVirtualWrite?: (vpin: string, val: number) => void;
  isWifiConnected?: boolean;
  onWifiConnectedChange?: (connected: boolean) => void;
  selectedWifi?: string;
  onSelectedWifiChange?: (ssid: string) => void;
  wifiPassword?: string;
  onWifiPasswordChange?: (password: string) => void;
  themeMode?: 'dark' | 'light';

  // 3D Robot Simulator props
  simulatorMode?: 'robot' | 'circuit';
  onSimulatorModeChange?: (mode: 'robot' | 'circuit') => void;
  robotHardwareConfig?: RobotHardwareConfig;
  onRobotHardwareChange?: (hw: RobotHardwareConfig) => void;
  robotPlans?: RobotPlan[];
  activePlanId?: number;
  onRobotPlansChange?: (plans: RobotPlan[], activePlanId?: number) => void;
  onSyncRobotToCodeAndBlocks?: (hw: RobotHardwareConfig, plans: RobotPlan[], activePlanId: number) => void;
  onRobotHighlightChange?: (highlight: ActiveExecutionHighlight) => void;
  onToggleRun?: () => void;
}

interface Pin {
  id: string;
  name: string;
  cx: number;
  cy: number;
  type: 'mcu' | 'component';
}

export const getBaseComponentType = (id: string): string => {
  if (id.startsWith('led')) return 'led';
  if (id.startsWith('servo')) return 'servo';
  if (id.startsWith('ultrasonic') || id.startsWith('hcsr')) return 'ultrasonic';
  if (id.startsWith('pot')) return 'pot';
  if (id.startsWith('button') || id.startsWith('btn')) return 'button';
  if (id.startsWith('lcd')) return 'lcd';
  if (id.startsWith('motor') || id.startsWith('dc_motor') || id.startsWith('motordc')) return 'motor';
  if (id.startsWith('dht')) return 'dht11';
  if (id.startsWith('rfid') || id.startsWith('rc522') || id.startsWith('mfrc522')) return 'rfid';
  return id.replace(/_\d+$/, '');
};

export const getInstancePinId = (instanceId: string, basePin: string): string => {
  if (!instanceId.includes('_')) return basePin;
  const suffix = instanceId.split('_').slice(1).join('_');
  return `${basePin}_${suffix}`;
};

const DEFAULT_COMPONENT_POSITIONS: { [key: string]: { x: number; y: number } } = {
  board: { x: 85, y: 15 },
  led: { x: 15, y: 420 },
  servo: { x: 110, y: 420 },
  ultrasonic: { x: 215, y: 420 },
  pot: { x: 15, y: 530 },
  button: { x: 120, y: 530 },
  lcd: { x: 210, y: 530 },
  motor: { x: 330, y: 420 },
  dht11: { x: 15, y: 640 },
  rfid: { x: 160, y: 640 }
};

export const isComponentPin = (pinId: string): boolean => {
  return /^(LED_|SERVO_|SR04_|POT_|BTN_|DHT11_|LCD_|MOTOR_|RFID_)/.test(pinId);
};

export const hexToRgba = (hex: string, alpha: number): string => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(239, 68, 68, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0.93, g: 0.26, b: 0.26 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
};

export const hexToRgbBoost = (hex: string, factor: number = 1.25): string => {
  const { r, g, b } = hexToRgb(hex);
  const br = Math.min(255, Math.round(r * 255 * factor + (1 - r) * 255 * 0.25));
  const bg = Math.min(255, Math.round(g * 255 * factor + (1 - g) * 255 * 0.25));
  const bb = Math.min(255, Math.round(b * 255 * factor + (1 - b) * 255 * 0.25));
  return `rgb(${br}, ${bg}, ${bb})`;
};

export const hexToRgbDarken = (hex: string, factor: number = 0.65): string => {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.round(r * 255 * factor);
  const dg = Math.round(g * 255 * factor);
  const db = Math.round(b * 255 * factor);
  return `rgb(${dr}, ${dg}, ${db})`;
};

export const Simulator: React.FC<SimulatorProps> = ({
  isRunning,
  robotCommand,
  sensorData,
  board = 'ESP32 DevKit V1',
  pinStates = {},
  onPinStateChange,
  programPins = {},
  activeCode = '',
  activePythonCode: _activePythonCode = '',
  microbitFrames,
  potValue: potValueProp,
  onPotValueChange,
  buttonPressed: buttonPressedProp,
  onButtonPressedChange,
  activeComponents: activeComponentsProp,
  onActiveComponentsChange,
  positions: positionsProp,
  onPositionsChange,
  wires: wiresProp,
  onWiresChange,
  onSensorDataChange,
  isExpanded = false,
  blynkStatus: _blynkStatus = 'offline',
  blynkVirtualPins: _blynkVirtualPins = {},
  onBlynkVirtualWrite: _onBlynkVirtualWrite,
  isWifiConnected: isWifiConnectedProp,
  onWifiConnectedChange,
  selectedWifi: selectedWifiProp,
  onSelectedWifiChange,
  wifiPassword: wifiPasswordProp,
  onWifiPasswordChange,
  themeMode = 'dark',
  simulatorMode: simulatorModeProp,
  onSimulatorModeChange,
  robotHardwareConfig: robotHwProp,
  onRobotHardwareChange,
  robotPlans: robotPlansProp,
  activePlanId: activePlanIdProp,
  onRobotPlansChange,
  onSyncRobotToCodeAndBlocks,
  onRobotHighlightChange,
  onToggleRun,
}) => {
  const isLight = themeMode === 'light';
  const [localSimMode, setLocalSimMode] = useState<'robot' | 'circuit'>('circuit');
  const activeSimMode = simulatorModeProp ?? localSimMode;
  const setSimMode = (m: 'robot' | 'circuit') => {
    if (onSimulatorModeChange) onSimulatorModeChange(m);
    else setLocalSimMode(m);
  };

  const [localRobotHw, setLocalRobotHw] = useState<RobotHardwareConfig>(() => createDefaultRobotHardwareConfig());
  const robotHw = robotHwProp ?? localRobotHw;
  const setRobotHw = (next: RobotHardwareConfig) => {
    if (onRobotHardwareChange) onRobotHardwareChange(next);
    else setLocalRobotHw(next);
  };

  const [localRobotPlans, setLocalRobotPlans] = useState<RobotPlan[]>(() =>
    createDefaultRobotPlans(robotHw.sensorCount)
  );
  const [localActivePlanId, setLocalActivePlanId] = useState<number>(1);
  const robotPlans = robotPlansProp ?? localRobotPlans;
  const activePlanId = activePlanIdProp ?? localActivePlanId;
  const handleRobotPlansChange = (nextPlans: RobotPlan[], nextActiveId?: number) => {
    if (onRobotPlansChange) {
      onRobotPlansChange(nextPlans, nextActiveId);
    } else {
      setLocalRobotPlans(nextPlans);
      if (nextActiveId !== undefined) setLocalActivePlanId(nextActiveId);
    }
  };
  const isEsp8266 = board.toLowerCase().includes('esp8266') || board.toLowerCase().includes('esp266') || board.toLowerCase().includes('nodemcu');

  // Wifi Simulator State
  const [wifiNetworks, setWifiNetworks] = useState<string[]>([]);
  const [localSelectedWifi, setLocalSelectedWifi] = useState<string>('');
  const selectedWifi = selectedWifiProp !== undefined ? selectedWifiProp : localSelectedWifi;
  const setSelectedWifi = (val: string | ((prev: string) => string)) => {
    const nextVal = typeof val === 'function' ? val(selectedWifi) : val;
    if (onSelectedWifiChange) onSelectedWifiChange(nextVal);
    else setLocalSelectedWifi(nextVal);
  };
  const [localWifiPassword, setLocalWifiPassword] = useState<string>('');
  const wifiPassword = wifiPasswordProp !== undefined ? wifiPasswordProp : localWifiPassword;
  const setWifiPassword = (val: string | ((prev: string) => string)) => {
    const nextVal = typeof val === 'function' ? val(wifiPassword) : val;
    if (onWifiPasswordChange) onWifiPasswordChange(nextVal);
    else setLocalWifiPassword(nextVal);
  };
  const [localWifiConnected, setLocalWifiConnected] = useState<boolean>(false);
  const isWifiConnected = isWifiConnectedProp !== undefined ? isWifiConnectedProp : localWifiConnected;
  const setIsWifiConnected = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isWifiConnected) : val;
    if (onWifiConnectedChange) onWifiConnectedChange(nextVal);
    else setLocalWifiConnected(nextVal);
  };
  const [isScanningWifi, setIsScanningWifi] = useState<boolean>(false);
  const [isWifiDropdownOpen, setIsWifiDropdownOpen] = useState<boolean>(false);

  // Simulator state
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const hasMovedDuringDrag = useRef(false);

  // Potentiometer and button states
  const [localPotValue, setLocalPotValue] = useState(50);
  const potValue = potValueProp !== undefined ? potValueProp : localPotValue;
  const setPotValue = (val: number | ((prev: number) => number)) => {
    const nextVal = typeof val === 'function' ? val(potValue) : val;
    if (onPotValueChange) {
      onPotValueChange(nextVal);
    } else {
      setLocalPotValue(nextVal);
    }
  };

  const [localButtonPressed, setLocalButtonPressed] = useState(false);
  const buttonPressed = buttonPressedProp !== undefined ? buttonPressedProp : localButtonPressed;
  const setButtonPressed = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(buttonPressed) : val;
    if (onButtonPressedChange) {
      onButtonPressedChange(nextVal);
    } else {
      setLocalButtonPressed(nextVal);
    }
  };

  // Active components list (starts clean: only mcu board rendered by default)
  const [localActiveComponents, setLocalActiveComponents] = useState<string[]>([]);
  const activeComponents = activeComponentsProp !== undefined ? activeComponentsProp : localActiveComponents;
  const setActiveComponents = (val: string[] | ((prev: string[]) => string[])) => {
    const nextVal = typeof val === 'function' ? val(activeComponents) : val;
    if (onActiveComponentsChange) {
      onActiveComponentsChange(nextVal);
    } else {
      setLocalActiveComponents(nextVal);
    }
  };

  const [extraPotValues, setExtraPotValues] = useState<{ [key: string]: number }>({});
  const [pressedButtons, setPressedButtons] = useState<{ [key: string]: boolean }>({});

  // Component custom colors state
  const [componentColors, setComponentColors] = useState<{ [id: string]: string }>({});
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(null);

  const COMPONENT_COLOR_PALETTE = [
    '#ef4444', // Red
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#f97316', // Orange
    '#a855f7', // Purple
    '#06b6d4', // Cyan
    '#ffffff', // White
  ];

  const getComponentColor = (id: string, defaultColor?: string): string => {
    if (componentColors[id]) return componentColors[id];
    const base = getBaseComponentType(id);
    if (componentColors[base]) return componentColors[base];
    if (defaultColor) return defaultColor;
    switch (base) {
      case 'led': return '#ef4444';
      case 'servo': return '#3b82f6';
      case 'ultrasonic': return '#06b6d4';
      case 'pot': return '#10b981';
      case 'button': return '#eab308';
      case 'dht11': return '#3b82f6';
      case 'lcd': return '#0284c7';
      case 'motor': return '#f97316';
      case 'rfid': return '#8b5cf6';
      default: return '#3b82f6';
    }
  };

  // Interactive Wiring State
  const [localWires, setLocalWires] = useState<Wire[]>([]);
  const wires = wiresProp !== undefined ? wiresProp : localWires;
  const setWires = (val: Wire[] | ((prev: Wire[]) => Wire[])) => {
    const nextVal = typeof val === 'function' ? val(wires) : val;
    if (onWiresChange) {
      onWiresChange(nextVal);
    } else {
      setLocalWires(nextVal);
    }
  };

  const handleUpdateComponentColor = (id: string, color: string) => {
    setComponentColors(prev => ({ ...prev, [id]: color }));
    const base = getBaseComponentType(id);
    let sigPinName = '';
    if (base === 'led') sigPinName = 'LED_A';
    else if (base === 'servo') sigPinName = 'SERVO_SIG';
    else if (base === 'button') sigPinName = 'BTN_SIG';
    else if (base === 'pot') sigPinName = 'POT_SIG';
    else if (base === 'motor') sigPinName = 'MOTOR_POS';

    if (sigPinName) {
      const sigPinId = getInstancePinId(id, sigPinName);
      setWires(prev => prev.map(w => {
        if (w.from === sigPinId || w.to === sigPinId) {
          return { ...w, color };
        }
        return w;
      }));
    }
  };

  const renderColorPickerPopover = (id: string, x: number, y: number) => {
    if (colorPickerOpenId !== id) return null;
    return (
      <g 
        transform={`translate(${x}, ${y})`} 
        className="z-50 select-none"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <rect x="-4" y="-4" width="76" height="42" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.2" filter="url(#shadow3d)"/>
        <text x="34" y="6" fontSize="6" fill="#94a3b8" fontWeight="bold" textAnchor="middle">WARNA</text>
        {COMPONENT_COLOR_PALETTE.map((c, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          const cx = 8 + col * 17;
          const cy = 16 + row * 15;
          const isSelected = getComponentColor(id) === c;
          return (
            <g 
              key={c} 
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleUpdateComponentColor(id, c);
              }}
            >
              <circle cx={cx} cy={cy} r="6" fill={c} stroke={isSelected ? '#ffffff' : '#475569'} strokeWidth={isSelected ? 1.8 : 0.8}/>
              {isSelected && <circle cx={cx} cy={cy} r="2" fill="#ffffff" />}
            </g>
          );
        })}
      </g>
    );
  };

  // Comprehensive Auto-Wire: connects ALL component instances in workspace.
  // Signal/Data/IO pins are uniquely allocated so no two components share the same signal pin.
  // VCC and GND pins can safely be shared across components without restriction.
  const runAutoWire = (componentsToWire?: string[]) => {
    const isArduino = board === 'Arduino Uno';
    const isMicrobit = board === 'BBC micro:bit';
    const isEsp8266 = board.toLowerCase().includes('esp8266') || board.toLowerCase().includes('esp266') || board.toLowerCase().includes('nodemcu');

    const list = componentsToWire || activeComponents;
    if (!list || list.length === 0) return;

    // Available Microcontroller I/O pin pools
    let availableDigital: string[] = [];
    let availableAnalog: string[] = [];
    let gndPin = 'GND_B';
    let vccPin = '5V';
    let p3v3Pin = '3V3';
    let sdaPin = 'A4';
    let sclPin = 'A5';

    if (isArduino) {
      availableDigital = ['D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2'];
      availableAnalog = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
      gndPin = 'GND_B';
      vccPin = '5V';
      p3v3Pin = '3V3';
      sdaPin = 'A4';
      sclPin = 'A5';
    } else if (isMicrobit) {
      availableDigital = ['P0', 'P1', 'P2', 'P8', 'P9', 'P12', 'P13', 'P14', 'P15', 'P16'];
      availableAnalog = ['P0', 'P1', 'P2'];
      gndPin = 'PAD_GND';
      vccPin = 'PAD_3V';
      p3v3Pin = 'PAD_3V';
      sdaPin = 'P20';
      sclPin = 'P19';
    } else if (isEsp8266) {
      availableDigital = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'];
      availableAnalog = ['A0'];
      gndPin = 'GND_R';
      vccPin = '3V3_R';
      p3v3Pin = '3V3_R';
      sdaPin = 'D2';
      sclPin = 'D1';
    } else {
      // ESP32 DevKit
      availableDigital = ['G13', 'G12', 'G14', 'G27', 'G26', 'G25', 'G33', 'G32', 'G4', 'G16', 'G17', 'G5', 'G18', 'G19', 'G21', 'G22', 'G23'];
      availableAnalog = ['G36', 'G39', 'G34', 'G35', 'G32', 'G33', 'G25', 'G26'];
      gndPin = 'GND_L';
      vccPin = 'VIN';
      p3v3Pin = '3V3';
      sdaPin = 'G21';
      sclPin = 'G22';
    }

    const usedSignalPins = new Set<string>();

    const getMcuPinId = (type: 'digital' | 'analog', programPin: string | undefined, defaultNum?: string): string => {
      const cleanProgramPin = programPin ? programPin.replace(/^[ADPG]/i, '') : undefined;
      if (isArduino) {
        const prefix = type === 'analog' ? 'A' : 'D';
        return cleanProgramPin !== undefined ? `${prefix}${cleanProgramPin}` : (defaultNum !== undefined ? `${prefix}${defaultNum}` : '');
      } else if (isMicrobit) {
        return cleanProgramPin !== undefined ? `P${cleanProgramPin}` : (defaultNum !== undefined ? `P${defaultNum}` : '');
      } else if (isEsp8266) {
        if (type === 'analog') return 'A0';
        if (cleanProgramPin === undefined) return defaultNum !== undefined ? `D${defaultNum}` : '';
        return cleanProgramPin.startsWith('D') ? cleanProgramPin : `D${cleanProgramPin}`;
      } else {
        return cleanProgramPin !== undefined ? `G${cleanProgramPin}` : (defaultNum !== undefined ? `G${defaultNum}` : '');
      }
    };

    const allocatePin = (type: 'digital' | 'analog', preferredPin?: string, fallbackDefault?: string): string => {
      if (preferredPin && preferredPin !== '' && !usedSignalPins.has(preferredPin)) {
        usedSignalPins.add(preferredPin);
        return preferredPin;
      }
      if (fallbackDefault && fallbackDefault !== '' && !usedSignalPins.has(fallbackDefault)) {
        usedSignalPins.add(fallbackDefault);
        return fallbackDefault;
      }
      const pool = type === 'analog' ? availableAnalog : availableDigital;
      for (const p of pool) {
        if (!usedSignalPins.has(p)) {
          usedSignalPins.add(p);
          return p;
        }
      }
      const allPool = [...availableDigital, ...availableAnalog];
      for (const p of allPool) {
        if (!usedSignalPins.has(p)) {
          usedSignalPins.add(p);
          return p;
        }
      }
      return fallbackDefault || (type === 'analog' ? 'A0' : 'D2');
    };

    const autoWires: Wire[] = [];

    const leds = list.filter(id => id === 'led' || id.startsWith('led_'));
    const servos = list.filter(id => id === 'servo' || id.startsWith('servo_'));
    const ultrasonics = list.filter(id => id === 'ultrasonic' || id === 'hcsr04' || id === 'sr04' || id.startsWith('ultrasonic_') || id.startsWith('hcsr04_') || id.startsWith('sr04_'));
    const pots = list.filter(id => id === 'pot' || id === 'potentiometer' || id.startsWith('pot_') || id.startsWith('potentiometer_'));
    const buttons = list.filter(id => id === 'button' || id.startsWith('button_'));
    const dht11s = list.filter(id => id === 'dht11' || id === 'dht' || id.startsWith('dht11_') || id.startsWith('dht_'));
    const lcds = list.filter(id => id === 'lcd' || id.startsWith('lcd_'));
    const motors = list.filter(id => id === 'motor' || id.startsWith('motor_'));
    const rfids = list.filter(id => id === 'rfid' || id === 'mfrc522' || id === 'rc522' || id.startsWith('rfid_') || id.startsWith('mfrc522_') || id.startsWith('rc522_'));

    // 1. LEDs
    leds.forEach((id, idx) => {
      const targetPin = (programPins?.ledPins && programPins.ledPins[idx]) 
        ? programPins.ledPins[idx] 
        : (idx === 0 ? programPins?.ledPin : undefined);
      const pref = targetPin 
        ? getMcuPinId('digital', targetPin) 
        : (idx === 0 ? getMcuPinId('digital', undefined, isArduino ? '9' : (isMicrobit ? '2' : (isEsp8266 ? '4' : '4'))) : undefined);
      const def = isArduino ? (idx === 0 ? 'D9' : `D${Math.max(2, 9 - idx)}`) : undefined;
      const pin = allocatePin('digital', pref, def);
      const color = getComponentColor(id, '#ef4444');
      autoWires.push({ from: pin, to: getInstancePinId(id, 'LED_A'), color, bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'LED_K'), color: '#1e293b', bendPoints: [] });
    });

    // 2. Servos
    servos.forEach((id, idx) => {
      const targetPin = (programPins?.servoPins && programPins.servoPins[idx])
        ? programPins.servoPins[idx]
        : (idx === 0 ? programPins?.servoPin : undefined);
      const pref = targetPin
        ? getMcuPinId('digital', targetPin)
        : (idx === 0 ? getMcuPinId('digital', undefined, isArduino ? '3' : (isMicrobit ? '1' : (isEsp8266 ? '2' : '18'))) : undefined);
      const def = isArduino ? (idx === 0 ? 'D3' : `D${Math.min(11, 3 + idx * 2)}`) : undefined;
      const pin = allocatePin('digital', pref, def);
      const color = getComponentColor(id, '#3b82f6');
      autoWires.push({ from: pin, to: getInstancePinId(id, 'SERVO_SIG'), color, bendPoints: [] });
      autoWires.push({ from: vccPin, to: getInstancePinId(id, 'SERVO_VCC'), color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'SERVO_GND'), color: '#1e293b', bendPoints: [] });
    });

    // 3. HC-SR04
    ultrasonics.forEach((id) => {
      const prefTrig = getMcuPinId('digital', programPins?.ultrasonicTrigPin, isArduino ? '12' : (isMicrobit ? '8' : (isEsp8266 ? '5' : '23')));
      const prefEcho = getMcuPinId('digital', programPins?.ultrasonicEchoPin, isArduino ? '13' : (isMicrobit ? '9' : (isEsp8266 ? '6' : '22')));
      const trig = allocatePin('digital', prefTrig, isArduino ? 'D12' : undefined);
      const echo = allocatePin('digital', prefEcho, isArduino ? 'D13' : undefined);
      autoWires.push({ from: vccPin, to: getInstancePinId(id, 'SR04_VCC'), color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: trig, to: getInstancePinId(id, 'SR04_TRIG'), color: '#10b981', bendPoints: [] });
      autoWires.push({ from: echo, to: getInstancePinId(id, 'SR04_ECHO'), color: '#f59e0b', bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'SR04_GND'), color: '#1e293b', bendPoints: [] });
    });

    // 4. Potentiometers
    pots.forEach((id, idx) => {
      const targetPin = (programPins?.potPins && programPins.potPins[idx])
        ? programPins.potPins[idx]
        : (idx === 0 ? programPins?.potPin : undefined);
      const pref = targetPin
        ? getMcuPinId('analog', targetPin)
        : (idx === 0 ? getMcuPinId('analog', undefined, isArduino ? '0' : (isMicrobit ? '0' : (isEsp8266 ? '0' : '36'))) : undefined);
      const def = isArduino ? `A${idx}` : undefined;
      const pin = allocatePin('analog', pref, def);
      const color = getComponentColor(id, '#a78bfa');
      autoWires.push({ from: vccPin, to: getInstancePinId(id, 'POT_VCC'), color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin, to: getInstancePinId(id, 'POT_SIG'), color, bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'POT_GND'), color: '#1e293b', bendPoints: [] });
    });

    // 5. Buttons
    buttons.forEach((id, idx) => {
      const targetPin = (programPins?.btnPins && programPins.btnPins[idx])
        ? programPins.btnPins[idx]
        : (idx === 0 ? programPins?.btnPin : undefined);
      const pref = targetPin
        ? getMcuPinId('digital', targetPin)
        : (idx === 0 ? getMcuPinId('digital', undefined, isArduino ? '2' : (isMicrobit ? '1' : (isEsp8266 ? '3' : '27'))) : undefined);
      const def = isArduino ? (idx === 0 ? 'D2' : `D${Math.min(10, 2 + idx * 2)}`) : undefined;
      const pin = allocatePin('digital', pref, def);
      const color = getComponentColor(id, '#eab308');
      autoWires.push({ from: pin, to: getInstancePinId(id, 'BTN_SIG'), color, bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'BTN_GND'), color: '#1e293b', bendPoints: [] });
    });

    // 6. DHT11
    dht11s.forEach((id, idx) => {
      const def = isArduino ? (idx === 0 ? 'D4' : `D${Math.max(2, 4 + idx)}`) : undefined;
      const pin = allocatePin('digital', undefined, def);
      const color = getComponentColor(id, '#a78bfa');
      autoWires.push({ from: vccPin, to: getInstancePinId(id, 'DHT11_VCC'), color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin, to: getInstancePinId(id, 'DHT11_DATA'), color, bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'DHT11_GND'), color: '#1e293b', bendPoints: [] });
    });

    // 7. LCD (I2C bus: shared SDA/SCL, VCC, GND)
    lcds.forEach((id) => {
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'LCD_GND'), color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: vccPin, to: getInstancePinId(id, 'LCD_VCC'), color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: sdaPin, to: getInstancePinId(id, 'LCD_SDA'), color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: sclPin, to: getInstancePinId(id, 'LCD_SCL'), color: '#3b82f6', bendPoints: [] });
    });

    // 8. Motors
    motors.forEach((id, idx) => {
      const def = isArduino ? (idx === 0 ? 'D5' : `D${Math.min(11, 5 + idx * 2)}`) : undefined;
      const pin = allocatePin('digital', undefined, def);
      const color = getComponentColor(id, '#ef4444');
      autoWires.push({ from: pin, to: getInstancePinId(id, 'MOTOR_POS'), color, bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'MOTOR_NEG'), color: '#1e293b', bendPoints: [] });
    });

    // 9. RFID
    rfids.forEach((id, idx) => {
      const sdaPinRfid = idx === 0 ? (isArduino ? 'D10' : (isMicrobit ? 'P16' : (isEsp8266 ? 'D8' : 'G5'))) : allocatePin('digital');
      const rstPinRfid = idx === 0 ? (isArduino ? 'D9' : (isMicrobit ? 'P8' : (isEsp8266 ? 'D4' : 'G22'))) : allocatePin('digital');
      const sckPinRfid = isArduino ? 'D13' : (isMicrobit ? 'P13' : (isEsp8266 ? 'D5' : 'G18'));
      const mosiPinRfid = isArduino ? 'D11' : (isMicrobit ? 'P15' : (isEsp8266 ? 'D7' : 'G23'));
      const misoPinRfid = isArduino ? 'D12' : (isMicrobit ? 'P14' : (isEsp8266 ? 'D6' : 'G19'));
      autoWires.push({ from: sdaPinRfid, to: getInstancePinId(id, 'RFID_SDA'), color: '#06b6d4', bendPoints: [] });
      autoWires.push({ from: sckPinRfid, to: getInstancePinId(id, 'RFID_SCK'), color: '#3b82f6', bendPoints: [] });
      autoWires.push({ from: mosiPinRfid, to: getInstancePinId(id, 'RFID_MOSI'), color: '#10b981', bendPoints: [] });
      autoWires.push({ from: misoPinRfid, to: getInstancePinId(id, 'RFID_MISO'), color: '#eab308', bendPoints: [] });
      autoWires.push({ from: gndPin, to: getInstancePinId(id, 'RFID_GND'), color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: rstPinRfid, to: getInstancePinId(id, 'RFID_RST'), color: '#8b5cf6', bendPoints: [] });
      autoWires.push({ from: p3v3Pin, to: getInstancePinId(id, 'RFID_3V3'), color: '#f43f5e', bendPoints: [] });
    });

    if (autoWires.length > 0) {
      setWires(prev => {
        const targetCompPins = new Set<string>();
        autoWires.forEach(w => {
          if (isComponentPin(w.from)) targetCompPins.add(w.from);
          if (isComponentPin(w.to)) targetCompPins.add(w.to);
        });

        const kept = prev.filter(w => {
          const fromIsTarget = isComponentPin(w.from) && targetCompPins.has(w.from);
          const toIsTarget = isComponentPin(w.to) && targetCompPins.has(w.to);
          return !fromIsTarget && !toIsTarget;
        });

        return [...kept, ...autoWires];
      });
    }
  };

  // Component rotations state
  const [rotations, setRotations] = useState<{ [key: string]: number }>({
    led: 0,
    servo: 0,
    ultrasonic: 0,
    pot: 0,
    button: 0,
    lcd: 0,
    dht11: 0,
    rfid: 0,
  });

  const handleRotateComponent = (compType: string) => {
    setRotations(prev => ({
      ...prev,
      [compType]: ((prev[compType] || 0) + 90) % 360
    }));
  };

  const getRotatedPinCoords = (
    compId: string,
    relX: number,
    relY: number,
    centerX: number,
    centerY: number
  ) => {
    const angle = rotations[compId] || 0;
    const baseType = getBaseComponentType(compId);
    const defaultPos = DEFAULT_COMPONENT_POSITIONS[baseType] || { x: 50, y: 400 };
    const posX = positions[compId]?.x ?? (positions[baseType]?.x ?? defaultPos.x);
    const posY = positions[compId]?.y ?? (positions[baseType]?.y ?? defaultPos.y);
    if (angle === 0) {
      return { cx: posX + relX, cy: posY + relY };
    }
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = relX - centerX;
    const dy = relY - centerY;
    return {
      cx: posX + centerX + dx * cos - dy * sin,
      cy: posY + centerY + dx * sin + dy * cos
    };
  };

  // micro:bit 5x5 LED Matrix states
  const [ledFrames, setLedFrames] = useState<string[]>([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);

  // Fetch WiFi Networks
  useEffect(() => {
    const fetchWifi = async () => {
      try {
        const req = (window as any).__electronRequire || (window as any).require;
        const electron = req('electron');
        if (electron && electron.ipcRenderer) {
          setIsScanningWifi(true);
          const networks = await electron.ipcRenderer.invoke('scan-wifi');
          setWifiNetworks(networks);
          if (networks.length > 0) setSelectedWifi(networks[0]);
          setIsScanningWifi(false);
        }
      } catch (err) {
        console.log("Could not scan wifi", err);
        setWifiNetworks(['Jaringan browser']);
        setSelectedWifi('Jaringan browser');
        setIsScanningWifi(false);
      }
    };
    fetchWifi();
  }, []);

  const handleWifiConnectToggle = () => {
    const nextState = !isWifiConnected && navigator.onLine;
    setIsWifiConnected(nextState);
    if (nextState) {
      localStorage.setItem('simulatorWifiSSID', selectedWifi);
      localStorage.removeItem('simulatorWifiPwd');
    } else {
      localStorage.removeItem('simulatorWifiSSID');
      localStorage.removeItem('simulatorWifiPwd');
    }
  };

  // Parse display commands from activeCode — BBC micro:bit display preview
  useEffect(() => {
    if (board !== 'BBC micro:bit') {
      setLedFrames([]);
      setCurrentFrameIdx(0);
      return;
    }

    const inputFrames: string[] = [];

    // If we have direct frames from BlocklyEditor, use them
    if (microbitFrames && microbitFrames.length > 0) {
      console.log('[Simulator] Using direct microbitFrames:', microbitFrames);
      inputFrames.push(...microbitFrames);
    } else if (activeCode) {
      const lines = activeCode.split('\n');

      lines.forEach(line => {
        const t = line.trim();
        if (!t || t.startsWith('#')) return;

        // ── display.show(Image.ICON) ──────────────────────────────────────
        if (t.includes('display.show(Image.') || t.includes('display.show(microbit.Image.')) {
          const dotIdx = t.lastIndexOf('.', t.indexOf(')'));
          const closeIdx = t.indexOf(')', dotIdx);
          if (dotIdx >= 0 && closeIdx > dotIdx) {
            const iconName = t.slice(dotIdx + 1, closeIdx).trim().toUpperCase();
            if (MICROBIT_ICONS[iconName]) inputFrames.push(MICROBIT_ICONS[iconName]);
          }

        // ── display.show(Image("...")) ── custom LED pattern ──────────────
        } else if (t.includes('display.show(Image(') || t.includes('display.show(microbit.Image(')) {
          const q1 = t.indexOf('"') >= 0 ? t.indexOf('"') : t.indexOf("'");
          const q2 = t.lastIndexOf('"') >= 0 ? t.lastIndexOf('"') : t.lastIndexOf("'");
          if (q1 >= 0 && q2 > q1) inputFrames.push(t.slice(q1 + 1, q2));

        // ── display.scroll("text") ────────────────────────────────────────
        } else if (t.includes('display.scroll(')) {
          const parenOpen = t.indexOf('(', t.indexOf('display.scroll'));
          if (parenOpen >= 0) {
            const inner = t.slice(parenOpen + 1);
            if (inner.startsWith('"') || inner.startsWith("'")) {
              const quote = inner[0];
              const end = inner.indexOf(quote, 1);
              const text = end > 0 ? inner.slice(1, end) : '';
              inputFrames.push('TEXT:' + text);
            } else if (inner.startsWith('str(')) {
              const end = inner.indexOf(')', 4);
              inputFrames.push('TEXT:' + (end > 4 ? inner.slice(4, end) : '…'));
            } else {
              const end = inner.search(/[,)]/);
              const text = end > 0 ? inner.slice(0, end).trim() : inner.trim();
              if (text) inputFrames.push('TEXT:' + text);
            }
          }

        // ── display.show(number or "text") ───────────────────────────────
        } else if (t.includes('display.show(')) {
          const parenOpen = t.indexOf('(', t.indexOf('display.show'));
          if (parenOpen >= 0) {
            const inner = t.slice(parenOpen + 1);
            if (inner.startsWith('"') || inner.startsWith("'")) {
              const quote = inner[0];
              const end = inner.indexOf(quote, 1);
              if (end > 0) inputFrames.push('TEXT:' + inner.slice(1, end));
            } else {
              const end = inner.search(/[,)]/);
              const val = end > 0 ? inner.slice(0, end).trim() : inner.trim();
              if (val && /^\d+$/.test(val)) inputFrames.push('TEXT:' + val);
            }
          }

        // ── display.clear() ──────────────────────────────────────────────
        } else if (t.includes('display.clear()')) {
          inputFrames.push('00000:00000:00000:00000:00000');

        // ── Arduino equivalents ───────────────────────────────────────────
        } else if (t.includes('Microbit.showString(')) {
          const q1 = t.indexOf('"') >= 0 ? t.indexOf('"') : t.indexOf("'");
          const q2 = t.lastIndexOf('"') >= 0 ? t.lastIndexOf('"') : t.lastIndexOf("'");
          if (q1 >= 0 && q2 > q1) inputFrames.push('TEXT:' + t.slice(q1 + 1, q2));
        } else if (t.includes('Microbit.showIcon(')) {
          const q1 = t.indexOf('"') >= 0 ? t.indexOf('"') : t.indexOf("'");
          const q2 = t.lastIndexOf('"') >= 0 ? t.lastIndexOf('"') : t.lastIndexOf("'");
          if (q1 >= 0 && q2 > q1) {
            const iconName = t.slice(q1 + 1, q2).toUpperCase();
            if (MICROBIT_ICONS[iconName]) inputFrames.push(MICROBIT_ICONS[iconName]);
          }
        } else if (t.includes('Microbit.clearScreen()')) {
          inputFrames.push('00000:00000:00000:00000:0000…31861 tokens truncated…="5" fill={hexToRgba(compColor, 0.15)} stroke={compColor} strokeWidth="0.8" opacity="0.6"/>

                {/* Top Antenna Area (Coil traces in silkscreen gold) */}
                <rect x="8" y="24" width="94" height="64" rx="4" fill="#172554" stroke="#d97706" strokeWidth="1.2"/>
                <rect x="12" y="28" width="86" height="56" rx="3" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8"/>
                <rect x="16" y="32" width="78" height="48" rx="2" fill="none" stroke="#d97706" strokeWidth="0.6" opacity="0.7"/>
                <rect x="20" y="36" width="70" height="40" rx="2" fill="none" stroke="#f59e0b" strokeWidth="0.5" opacity="0.6"/>

                {/* Antenna Icon & Text */}
                <text x="55" y="49" fontSize="7" fill="#fde68a" textAnchor="middle" fontWeight="bold" fontFamily="monospace">{label}</text>
                <path d="M49 57a7 7 0 0 1 12 0 M46 54a11 11 0 0 1 18 0 M43 51a15 15 0 0 1 24 0" stroke="#fbbf24" strokeWidth="1" fill="none" strokeLinecap="round"/>
                <circle cx="55" cy="59" r="1.5" fill="#f59e0b"/>

                {/* Interactive Tap RFID Card Button / Tag directly on Antenna */}
                <g
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newPresent = !sensorData.rfidCardPresent;
                    if (onSensorDataChange) {
                      onSensorDataChange({ rfidCardPresent: newPresent, rfidUid: sensorData.rfidUid || '53 7A 92 1F' });
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <rect
                    x="14"
                    y="67"
                    width="82"
                    height="17"
                    rx="4"
                    fill={sensorData.rfidCardPresent ? '#15803d' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="0.9"
                  />
                  <text x="55" y="78.5" fontSize="6.5" fill="#ffffff" textAnchor="middle" fontWeight="bold">
                    {sensorData.rfidCardPresent ? '✓ KARTU MENEMPEL' : '🏷️ TEMPEL KARTU'}
                  </text>
                </g>

                {/* Middle Circuit: IC MFRC522 (QFN32 black chip with pins) */}
                <rect x="42" y="93" width="26" height="26" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8"/>
                <circle cx="45" cy="96" r="1" fill="#94a3b8"/>
                <text x="55" y="108" fontSize="5.5" fill="#cbd5e1" textAnchor="middle" fontFamily="monospace" fontWeight="bold">RC522</text>
                {/* SMD Crystal Oscillator (27.12 MHz) */}
                <rect x="15" y="98" width="18" height="10" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8"/>
                <text x="24" y="105" fontSize="4.5" fill="#0f172a" textAnchor="middle" fontWeight="bold">27.12M</text>

                {/* Power LED & Status Indicator LED */}
                <rect x="80" y="96" width="6" height="8" rx="0.5" fill="#1e293b" stroke="#475569" strokeWidth="0.5"/>
                <circle cx="83" cy="100" r="2" fill="#ef4444"/>
                <text x="83" y="110" fontSize="4.5" fill="#94a3b8" textAnchor="middle">PWR</text>

                {/* Card Detected Status Glow */}
                {sensorData.rfidCardPresent && (
                  <g>
                    <circle cx="55" cy="56" r="28" fill="#22c55e" opacity="0.2"/>
                    <text x="55" y="123" fontSize="5.5" fill="#86efac" textAnchor="middle" fontWeight="bold">UID: {sensorData.rfidUid || '53 7A 92 1F'}</text>
                  </g>
                )}
                {!sensorData.rfidCardPresent && (
                  <text x="55" y="124" fontSize="5.5" fill="#93c5fd" textAnchor="middle" fontWeight="bold">3.3V SPI READER</text>
                )}

                {/* Color Popover */}
                {renderColorPickerPopover(id, 15, 20)}

                {/* Bottom 8-Pin Header (Pins: SDA, SCK, MOSI, MISO, IRQ, GND, RST, 3.3V) */}
                <rect x="10" y="132" width="90" height="8" rx="1" fill="#09090b" stroke="#27272a" strokeWidth="0.5"/>
                {/* Metal pin leads extending down to y=162 */}
                {[16, 27, 38, 49, 60, 71, 82, 93].map((px, i) => (
                  <g key={i}>
                    <rect x={px - 1.5} y="136" width="3" height="26" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.4"/>
                    <circle cx={px} cy="138" r="1.5" fill="#cbd5e1"/>
                  </g>
                ))}
                {/* Pin Labels */}
                <text x="16" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">SDA</text>
                <text x="27" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">SCK</text>
                <text x="38" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">MOSI</text>
                <text x="49" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">MISO</text>
                <text x="60" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">IRQ</text>
                <text x="71" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">GND</text>
                <text x="82" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">RST</text>
                <text x="93" y="130" fontSize="5" fill="#38bdf8" textAnchor="middle" fontWeight="bold">3V3</text>
              </g>
            );
          })}

          {/* ==================== INTERACTIVE PINS TERMINAL CIRCLES (SCALED UP FOR HIT-TEST ACCURACY) ==================== */}
          {pins.map(pin => {
            const isStarting = activePinStart?.id === pin.id;
            return (
              <g key={pin.id} className="cursor-pointer" onClick={(e) => handlePinClick(pin, e)} onMouseDown={e => e.stopPropagation()}>
                {/* INVISIBLE CLICKING HIT-BOX INCREASED TO 14px RADIUS FOR EASY TRIGGER (Bulletproof UX) */}
                <circle cx={pin.cx} cy={pin.cy} r="14" fill="transparent" />
                
                {/* Visual copper border rings increased size */}
                <circle 
                  cx={pin.cx} 
                  cy={pin.cy} 
                  r="7.5" 
                  fill="transparent" 
                  stroke={isStarting ? '#38bdf8' : '#e2e8f0'} 
                  strokeWidth={isStarting ? '3.5' : '1.8'}
                  className="opacity-75 hover:opacity-100 hover:scale-115 transition-all"
                />
                {/* Center contact hole increased size */}
                <circle cx={pin.cx} cy={pin.cy} r="3.5" fill="#0f172a" />
              </g>
            );
          })}

          {/* ==================== WIRING LAYER RENDERED AT THE VERY END (ON TOP OF EVERYTHING) ==================== */}
          {/* Render User Wires */}
          {wires.map((wire, idx) => (
            <g key={idx} className="cursor-pointer group" onClick={() => deleteWire(idx)}>
              {/* Thick transparent hit-box path for easier hovering/clicking */}
              <path
                d={getWirePath(wire)}
                stroke="transparent"
                strokeWidth="10"
                fill="none"
              />
              {/* Highlight path on hover */}
              <path
                d={getWirePath(wire)}
                stroke="#38bdf8"
                strokeWidth="5"
                fill="none"
                className="opacity-0 group-hover:opacity-40 transition-opacity"
              />
              {/* Dynamic physical wire curve */}
              <path
                d={getWirePath(wire)}
                stroke={wire.color}
                strokeWidth="3.2"
                fill="none"
                strokeLinecap="round"
                className="shadow-lg filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
              />
              {/* Visual Delete Indicator on hover */}
              <circle
                cx={(pins.find(p => p.id === wire.from)?.cx || 0)}
                cy={(pins.find(p => p.id === wire.from)?.cy || 0)}
                r="5"
                fill="#ef4444"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </g>
          ))}

          {/* Render Wire Preview Drag */}
          {activePinStart && (
            <path
              d={getPreviewWirePath()}
              stroke={selectedColor}
              strokeWidth="3.2"
              fill="none"
              strokeDasharray="4,4"
            />
          )}

          {/* ==================== REAL-TIME HOVER PIN TOOLTIP NOTIFICATION ==================== */}
          {hoveredPin && (
            <g 
              transform={`translate(${hoveredPin.cx}, ${hoveredPin.cy - 22})`} 
              className="pointer-events-none select-none z-50 animate-bounce"
            >
              {/* Dynamic Tooltip Capsule width */}
              {(() => {
                const labelWidth = Math.max(56, hoveredPin.name.length * 5.8 + 14);
                const labelX = -labelWidth / 2;
                return (
                  <g>
                    {/* Shadow capsule */}
                    <rect 
                      x={labelX + 2} 
                      y="-11" 
                      width={labelWidth} 
                      height="17" 
                      rx="4" 
                      fill="#020617" 
                      opacity="0.5" 
                    />
                    {/* Main capsule */}
                    <rect 
                      x={labelX} 
                      y="-13" 
                      width={labelWidth} 
                      height="17" 
                      rx="4" 
                      fill="#0f172a" 
                      stroke="#22d3ee" 
                      strokeWidth="1.8" 
                    />
                    {/* Tooltip text */}
                    <text 
                      x="0" 
                      y="-1" 
                      fill="#22d3ee" 
                      fontSize="8" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {hoveredPin.name}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}

          {/* ── END ZOOM WRAPPER ── */}
          </g>

        </svg>

        {/* Floating wiring instruction info */}
        {activePinStart && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-sky-950/90 text-sky-300 text-[9px] px-2.5 py-1.5 rounded-md border border-sky-900/60 shadow flex items-center justify-between z-30 font-semibold select-none animate-pulse">
            <span className="flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              Wiring: Select target pin for {activePinStart.name}...
            </span>
            <button 
              onClick={() => {
                setActivePinStart(null);
                setActiveBendPoints([]);
              }}
              className="text-[8px] bg-sky-900 hover:bg-sky-850 px-1 py-0.5 rounded text-white font-bold cursor-pointer transition select-none"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── SENSOR DYNAMIC SIMULATOR POPUP OVERLAY ── */}
        {activePopup && (() => {
          const basePopup = getBaseComponentType(activePopup);
          const isUltrasonicPopup = basePopup === 'ultrasonic' || basePopup === 'hcsr' || basePopup === 'hcsr04';
          const isDhtPopup = basePopup === 'dht11' || basePopup === 'dht';
          const isPotPopup = basePopup === 'pot';
          const isRfidPopup = basePopup === 'rfid' || basePopup === 'mfrc522' || basePopup === 'rc522';
          const isLedPopup = basePopup === 'led';
          const isServoPopup = basePopup === 'servo';
          const isButtonPopup = basePopup === 'button';
          const isLcdPopup = basePopup === 'lcd';
          const isMotorPopup = basePopup === 'motor';

          const instanceSuffix = activePopup !== basePopup ? ` #${activePopup.split('_')[1]}` : '';
          const compColor = getComponentColor(activePopup);

          const getPopupTitle = () => {
            if (isUltrasonicPopup) return `🔊 HC-SR04${instanceSuffix}`;
            if (isDhtPopup) return `🌡️ DHT11${instanceSuffix}`;
            if (isRfidPopup) return `🏷️ RFID RC522${instanceSuffix}`;
            if (isPotPopup) return `🎛️ Potentiometer${instanceSuffix}`;
            if (isLedPopup) return `💡 LED${instanceSuffix}`;
            if (isServoPopup) return `🦾 Servo SG90${instanceSuffix}`;
            if (isButtonPopup) return `🔘 Button${instanceSuffix}`;
            if (isLcdPopup) return `📟 LCD 16x2${instanceSuffix}`;
            if (isMotorPopup) return `⚙️ DC Motor${instanceSuffix}`;
            return `${activePopup.toUpperCase()}${instanceSuffix}`;
          };

          return (
            <div className="absolute top-2 left-2 z-40 bg-slate-900/95 border border-slate-750 p-3 rounded-xl shadow-2xl w-48 text-white select-none animate-in fade-in zoom-in-95 duration-100">
              <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-slate-800">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shadow-sm" style={{ backgroundColor: compColor }} />
                  {getPopupTitle()}
                </span>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="text-[11px] hover:text-rose-400 text-slate-400 font-bold transition cursor-pointer select-none px-1"
                >
                  ✕
                </button>
              </div>
              
              {isUltrasonicPopup && (
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                    <span>Distance:</span>
                    <span className="font-mono text-cyan-400">{Math.round(sensorData.distance ?? 42)} cm</span>
                  </div>
                  <input 
                    type="range"
                    min="2"
                    max="400"
                    value={sensorData.distance ?? 42}
                    onChange={(e) => {
                      if (onSensorDataChange) onSensorDataChange({ distance: parseInt(e.target.value) });
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>
              )}

              {isDhtPopup && (
                <div className="space-y-2 mb-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                      <span>Temp:</span>
                      <span className="font-mono text-cyan-400">{sensorData.temp ?? 28.4} °C</span>
                    </div>
                    <input 
                      type="range"
                      min="-40"
                      max="80"
                      step="0.1"
                      value={sensorData.temp ?? 28.4}
                      onChange={(e) => {
                        if (onSensorDataChange) onSensorDataChange({ temp: parseFloat(e.target.value) });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                      <span>Humidity:</span>
                      <span className="font-mono text-cyan-400">{sensorData.humidity ?? 65.0} %</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={sensorData.humidity ?? 65.0}
                      onChange={(e) => {
                        if (onSensorDataChange) onSensorDataChange({ humidity: parseFloat(e.target.value) });
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>
              )}

              {isPotPopup && (() => {
                const curPotVal = extraPotValues[activePopup] ?? potValue;
                return (
                  <div className="space-y-1.5 mb-2.5">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                      <span>Analog In:</span>
                      <span className="font-mono text-cyan-400">{Math.round((curPotVal / 100) * 1023)}</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={curPotVal}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (activePopup === 'pot' && onPotValueChange) {
                          onPotValueChange(val);
                        }
                        setExtraPotValues(prev => ({ ...prev, [activePopup]: val }));
                      }}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="text-[8px] text-slate-400 text-center font-mono">
                      Percentage: {curPotVal}%
                    </div>
                  </div>
                );
              })()}

              {isButtonPopup && (() => {
                const isPressed = activePopup === 'button' ? buttonPressed : (pressedButtons[activePopup] || false);
                return (
                  <div className="space-y-2 mb-2.5">
                    <button
                      onMouseDown={() => {
                        if (activePopup === 'button') setButtonPressed(true);
                        else setPressedButtons(prev => ({ ...prev, [activePopup]: true }));
                      }}
                      onMouseUp={() => {
                        if (activePopup === 'button') setButtonPressed(false);
                        else setPressedButtons(prev => ({ ...prev, [activePopup]: false }));
                      }}
                      className={`w-full py-1.5 rounded-lg text-[9px] font-bold transition shadow cursor-pointer ${isPressed ? 'bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'}`}
                    >
                      {isPressed ? '🔘 Sedang Ditekan' : '👆 Tekan Tombol'}
                    </button>
                  </div>
                );
              })()}

              {isRfidPopup && (
                <div className="space-y-2 mb-2.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                    <span>Status Kartu:</span>
                    <span className={`font-mono font-bold ${sensorData.rfidCardPresent ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {sensorData.rfidCardPresent ? 'TERDETEKSI' : 'TIDAK ADA'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                    <span>Card UID:</span>
                    <input
                      type="text"
                      value={sensorData.rfidUid || '53 7A 92 1F'}
                      onChange={(e) => {
                        if (onSensorDataChange) {
                          onSensorDataChange({ rfidUid: e.target.value.toUpperCase() });
                        }
                      }}
                      className="w-24 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[9px] text-cyan-400 font-bold text-center focus:outline-none focus:border-cyan-500"
                      placeholder="UID HEX"
                    />
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        if (onSensorDataChange) {
                          onSensorDataChange({ rfidCardPresent: !sensorData.rfidCardPresent, rfidUid: sensorData.rfidUid || '53 7A 92 1F' });
                        }
                      }}
                      className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition shadow cursor-pointer ${sensorData.rfidCardPresent ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
                    >
                      {sensorData.rfidCardPresent ? '✕ Lepas Kartu' : '🏷️ Tempel Kartu'}
                    </button>
                    <button
                      onClick={() => {
                        const uids = ['53 7A 92 1F', 'B4 1C 48 2A', 'A1 F3 0D 8E', '7C 2E 91 3B'];
                        const currentIdx = uids.indexOf(sensorData.rfidUid || '53 7A 92 1F');
                        const nextUid = uids[(currentIdx + 1) % uids.length];
                        if (onSensorDataChange) {
                          onSensorDataChange({ rfidUid: nextUid });
                        }
                      }}
                      className="px-2 py-1.5 text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 cursor-pointer"
                      title="Ganti Kartu / UID"
                    >
                      🔄 Ganti
                    </button>
                  </div>
                </div>
              )}

              {/* Component Color Swatches in Active Popup */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[8px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>GANTI WARNA:</span>
                  <span className="font-mono text-[7px] text-slate-400">{compColor}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {COMPONENT_COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleUpdateComponentColor(activePopup, c)}
                      className={`w-4 h-4 rounded-full border transition cursor-pointer ${compColor === c ? 'border-white scale-110 shadow ring-1 ring-white' : 'border-slate-700 hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                      title={`Pilih warna ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 2. SIDEBAR CONTROLS (Bento Grid Style) ── */}
      <div className={`w-full ${isExpanded ? 'lg:w-[320px] xl:w-[360px] order-1 lg:order-2' : 'order-2'} flex flex-col gap-3 flex-shrink-0 overflow-y-auto pr-1`}>
        
        {/* Title */}
        <div className="flex items-center justify-between px-1">
          <span className={`text-xs font-extrabold flex items-center gap-2 uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
            <span>⚙️</span>
            <span>SIMULATOR</span>
          </span>
          <span className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${isLight ? 'text-sky-700 bg-sky-50 border-sky-200' : 'text-slate-400 bg-[#131724] border-slate-800'}`}>
            <Move className="w-3 h-3 text-sky-400" /> DRAG TO MOVE
          </span>
        </div>

        {/* WiFi Simulator Panel */}
        {board !== 'Arduino Uno R3' && board !== 'BBC micro:bit' && (
          <div className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border shadow-sm transition-colors ${isLight ? 'bg-white/95 border-[var(--theme-border,rgba(186,230,253,0.9))] shadow-[0_4px_16px_var(--theme-active-shadow,rgba(59,130,246,0.06))]' : 'bg-[#0f131f] border-slate-800/90'}`}>
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Wifi className={`w-3.5 h-3.5 ${isWifiConnected ? 'text-emerald-500' : 'text-slate-400'}`} />
                Virtual WiFi
              </div>
              {isWifiConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsWifiDropdownOpen(!isWifiDropdownOpen)}
                  disabled={isWifiConnected}
                  className={`w-full text-left border ${
                    isWifiConnected
                      ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/5'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-400'
                        : 'bg-[#090b12] border-slate-700/80 text-slate-200 hover:border-indigo-500/60'
                  } rounded-lg px-3 py-2 text-[11px] font-medium flex items-center justify-between transition-colors cursor-pointer`}
                >
                  <span className="truncate">{isScanningWifi ? 'Scanning networks...' : (selectedWifi || 'Select Network')}</span>
                  {!isWifiConnected && <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                </button>
                
                {isWifiDropdownOpen && !isWifiConnected && wifiNetworks.length > 0 && (
                  <div className={`absolute top-full left-0 mt-1.5 w-full max-h-40 overflow-y-auto border rounded-lg shadow-xl z-50 py-1 ${isLight ? 'bg-white border-slate-200' : 'bg-[#141826] border-slate-700'}`}>
                    {wifiNetworks.map(net => (
                      <div 
                        key={net}
                        className={`px-3 py-2 text-[11px] font-medium cursor-pointer truncate transition-colors ${isLight ? 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-600' : 'text-slate-200 hover:bg-indigo-500/20 hover:text-indigo-300'}`}
                        onClick={() => { setSelectedWifi(net); setIsWifiDropdownOpen(false); }}
                      >
                        {net}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={wifiPassword}
                    onChange={e => setWifiPassword(e.target.value)}
                    disabled={isWifiConnected}
                    className={`w-full border rounded-lg px-3 pl-8 py-2 text-[11px] focus:outline-none focus:border-indigo-500 disabled:opacity-60 transition-colors ${isLight ? 'bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400' : 'bg-[#090b12] border-slate-700/80 text-slate-200 placeholder:text-slate-500'}`}
                  />
                </div>
                
                <button 
                  onClick={handleWifiConnectToggle}
                  className={`px-4 py-2 text-[10px] font-bold rounded-lg flex-shrink-0 transition-all shadow-sm cursor-pointer ${
                    isWifiConnected
                      ? isLight
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                        : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30'
                      : isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                        : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isWifiConnected ? 'DISCONNECT' : 'CONNECT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Wiring & Components Panel */}
        <div className={`p-3.5 rounded-2xl border shadow-sm space-y-3.5 transition-colors ${isLight ? 'bg-white/95 border-[var(--theme-border,rgba(186,230,253,0.9))] shadow-[0_4px_16px_var(--theme-active-shadow,rgba(59,130,246,0.06))]' : 'bg-[#0f131f] border-slate-800/90'}`}>
          <div className="flex items-center justify-between">
             <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
               <Edit3 className="w-3.5 h-3.5 text-indigo-400" /> Circuit Builder
             </div>
             
             {/* Delete Wires & Add Auto-Wire */}
             <div className="flex gap-1.5">
               <button 
                 onClick={handleAutoWire}
                 className={`flex justify-center items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all shadow-sm border ${isLight ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/30'}`}
               >
                 <Zap className="w-3 h-3" /> Auto
               </button>
               <button 
                 onClick={handleClearWires}
                 className={`flex justify-center items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[9px] font-bold cursor-pointer transition-all shadow-sm ${isLight ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#161b2c] hover:bg-slate-800 text-slate-300 border-slate-700/80'}`}
               >
                 <RotateCcw className="w-3 h-3" /> Clear
               </button>
             </div>
          </div>
          
          <div className="relative">
            <select
              value=""
              onChange={(e) => {
                handleAddComponent(e.target.value);
                e.target.value = ""; 
              }}
              className={`w-full text-[11px] font-bold border rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer hover:border-indigo-400 transition-colors appearance-none shadow-sm ${isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-[#090b12] text-slate-200 border-slate-700/80'}`}
            >
              <option value="" disabled className={isLight ? 'bg-white text-slate-500' : 'bg-[#0f131f] text-slate-400'}>➕ ADD COMPONENT</option>
              <option value="led" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🔴 Red LED Bulb</option>
              <option value="servo" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>⚙️ SG90 Servo Motor</option>
              <option value="ultrasonic" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🔊 HC-SR04 Ultrasonic</option>
              <option value="button_reed">Reed switch · kontak magnet</option>
              <option value="button_limit">Limit switch · batas gerak</option>
              <option value="button_tilt">Tilt switch · kemiringan</option>
              <option value="pot" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🎛️ Rotary Potentiometer</option>
              <option value="button" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🔘 Tactile Push Button</option>
              <option value="lcd" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>📺 16x2 OLED LCD Screen</option>
              <option value="dht11" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🌡️ DHT11 Temp/Humid</option>
              <option value="rfid" className={isLight ? 'bg-white text-slate-800' : 'bg-[#0f131f] text-slate-200'}>🏷️ RC522 RFID Reader</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>

          <div className={`border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`} />

          {/* Rich Wire Color Palette + Custom Color Picker */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Palette className="w-3 h-3 text-indigo-400" />
                Wire Color Palette
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#090b12] border-slate-800 text-slate-300'}`}>
                <span className="w-2.5 h-2.5 rounded-full shadow-sm border border-white/20" style={{ backgroundColor: selectedColor }} />
                {colors.find(c => c.value.toLowerCase() === selectedColor.toLowerCase())?.label.split(' ')[0] || selectedColor.toUpperCase()}
              </span>
            </div>

            <div className={`p-2 rounded-xl border ${isLight ? 'bg-slate-50/80 border-slate-200/70' : 'bg-[#090b12] border-slate-800/80'}`}>
              <div className="grid grid-cols-8 gap-2 items-center justify-items-center">
                {colors.map(c => {
                  const isSelected = selectedColor.toLowerCase() === c.value.toLowerCase();
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setSelectedColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center relative ${
                        isSelected
                          ? 'ring-2 ring-indigo-500 border-white scale-110 shadow-md z-10'
                          : isLight
                            ? 'border-slate-300/80 hover:scale-110'
                            : 'border-slate-700/80 hover:scale-110 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={`${c.label} (${c.value})`}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3 h-3 stroke-[3] ${
                            c.value === '#f8fafc' || c.value === '#eab308' || c.value === '#84cc16'
                              ? 'text-slate-900'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}

                {/* Custom Color Picker Button */}
                <label
                  title="Pilih warna kabel kustom dari Color Picker"
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center relative overflow-hidden shadow-sm hover:scale-110 ${
                    !colors.some(c => c.value.toLowerCase() === selectedColor.toLowerCase())
                      ? 'ring-2 ring-indigo-500 border-white scale-110'
                      : isLight
                        ? 'border-slate-300'
                        : 'border-slate-600'
                  }`}
                  style={{
                    background: 'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #10b981, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)'
                  }}
                >
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="sr-only"
                  />
                  <Palette className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" />
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wires List Management */}
        {wires.length > 0 && (
          <div className={`p-3.5 rounded-2xl border shadow-sm flex flex-col gap-2 transition-colors ${isLight ? 'bg-white/95 border-[var(--theme-border,rgba(186,230,253,0.9))] shadow-[0_4px_16px_var(--theme-active-shadow,rgba(59,130,246,0.06))]' : 'bg-[#0f131f] border-slate-800/90'}`}>
             <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
               Connections ({wires.length})
               <span className="text-[8px] opacity-75 normal-case font-medium">Klik warna untuk ubah</span>
             </span>
             <div className="max-h-[140px] overflow-y-auto space-y-1.5 scrollbar-thin pr-1">
                {wires.map((w, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border transition-colors ${
                      isLight
                        ? 'bg-slate-50 border-slate-200/80 hover:border-indigo-300'
                        : 'bg-[#090b12] border-slate-800/90 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const newWires = wires.map((wireItem, i) =>
                          i === idx ? { ...wireItem, color: selectedColor } : wireItem
                        );
                        setWires(newWires);
                      }}
                      title={`Klik untuk ubah warna kabel ini ke warna terpilih (${selectedColor})`}
                      className={`flex items-center gap-2 text-[9.5px] font-mono cursor-pointer transition-opacity hover:opacity-85 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shadow-sm border border-white/25 flex-shrink-0 transition-transform hover:scale-125"
                        style={{ backgroundColor: w.color }}
                      />
                      <span>{w.from} ⚡ {w.to}</span>
                    </button>
                    <button 
                      onClick={() => {
                        const newWires = [...wires];
                        newWires.splice(idx, 1);
                        setWires(newWires);
                      }}
                      className="text-slate-400 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                      title="Hapus koneksi kabel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

      </div>
      </div>

    </div>
  );
};
