import { WokwiPart, type WokwiPin, wokwiPartHeight, wokwiPartName, wokwiPartPinId, wokwiParts, wokwiPartWidth } from './simulator/WokwiPart';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cpu, RotateCcw, Zap, Trash2, Edit3, Move, Wifi, Palette, Check, Bot } from 'lucide-react';
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
  const [checkingNetwork, setCheckingNetwork] = useState(false);
  const [networkError, setNetworkError] = useState('');
  const [localWifiConnected, setLocalWifiConnected] = useState<boolean>(false);
  const isWifiConnected = isWifiConnectedProp !== undefined ? isWifiConnectedProp : localWifiConnected;
  const setIsWifiConnected = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isWifiConnected) : val;
    if (onWifiConnectedChange) onWifiConnectedChange(nextVal);
    else setLocalWifiConnected(nextVal);
  };

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

  const handleWifiConnectToggle = async () => {
    setNetworkError('');
    if (isWifiConnected) {
      setIsWifiConnected(false);
      return;
    }
    if (!navigator.onLine) {
      setNetworkError('Perangkat offline. Sambungkan Wi-Fi atau hotspot di pengaturan perangkat.');
      return;
    }
    setCheckingNetwork(true);
    try {
      const url = new URL('https://robolabstudios.vercel.app/favicon.svg');
      if (location.protocol !== 'file:') url.href = new URL('./favicon.svg', document.baseURI).href;
      const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
      if (!response.ok || !response.headers.get('content-type')?.includes('image/svg+xml')) {
        throw new Error('Uji jaringan gagal');
      }
      setIsWifiConnected(true);
    } catch {
      setNetworkError('Aplikasi tidak dapat dijangkau melalui jaringan perangkat. Periksa koneksi dan coba lagi.');
    } finally {
      setCheckingNetwork(false);
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
          inputFrames.push('00000:00000:00000:00000:00000');
        }
      });
    }

    // Now convert any TEXT: frames into actual 5x5 matrix patterns (scroll or static)
    const finalFrames: string[] = [];
    inputFrames.forEach(frame => {
      if (frame.startsWith('TEXT:')) {
        const text = frame.slice(5);
        if (text.length === 1) {
          // Static single character
          const char = text.toUpperCase();
          finalFrames.push(FONT_5X5[char] || FONT_5X5['?']);
        } else if (text.length > 1) {
          // Scroll multi-character text
          finalFrames.push(...generateScrollFrames(text));
        }
      } else {
        // Standard icon or custom pattern
        finalFrames.push(frame);
      }
    });

    setLedFrames(finalFrames);
    setCurrentFrameIdx(0);
  }, [activeCode, isRunning, board, microbitFrames]);

  // Frame cycling timer
  useEffect(() => {
    if (ledFrames.length <= 1) return;
    
    // Scrolling frame sequences have more frames; cycle faster (180ms) for smooth scrolling.
    // Multi-icon animations cycle slower (1000ms).
    const delay = ledFrames.length > 5 ? 180 : 1000;
    
    const interval = setInterval(() => {
      setCurrentFrameIdx(prev => (prev + 1) % ledFrames.length);
    }, delay);
    
    return () => clearInterval(interval);
  }, [ledFrames]);

  // Auto-detect components based on code
  useEffect(() => {
    if (!activeCode) return;
    const isArduino = board === 'Arduino Uno';
    const isMicrobit = board === 'BBC micro:bit';
    const isEsp8266 = board.toLowerCase().includes('esp8266') || board.toLowerCase().includes('esp266') || board.toLowerCase().includes('nodemcu');

    const codeUpper = activeCode.toUpperCase();
    const detected: string[] = [];

    // Check LED
    if (codeUpper.includes('LED') || codeUpper.includes('DIGITALWRITE(') || codeUpper.includes('DIGITAL_WRITE(') || codeUpper.includes('WRITE_DIGITAL') || codeUpper.includes('WRITE_ANALOG') || codeUpper.includes('ANALOGWRITE(') || codeUpper.includes('ANALOG_WRITE(')) {
      detected.push('led');
    }
    // Check Servo
    if (codeUpper.includes('SERVO') || codeUpper.includes('SERVO_WRITE') || codeUpper.includes('SERVO_WRITE(') || codeUpper.includes('SERVOWRITE(')) {
      detected.push('servo');
    }
    // Check Ultrasonic (updated to support hcsr / hc_sr04 variations)
    if (codeUpper.includes('ULTRASONIC') || codeUpper.includes('DISTANCE') || codeUpper.includes('JARAK') || codeUpper.includes('HC-SR') || codeUpper.includes('HCSR') || codeUpper.includes('READ_ULTRASONIC') || codeUpper.includes('READULTRASONIC')) {
      detected.push('ultrasonic');
    }
    // Check Pot
    if (codeUpper.includes('POT') || codeUpper.includes('ANALOGREAD(') || codeUpper.includes('ANALOG_READ(') || codeUpper.includes('READ_ANALOG')) {
      detected.push('pot');
    }
    // Check Button
    if (codeUpper.includes('BTN') || codeUpper.includes('BUTTON') || codeUpper.includes('PULLUP') || codeUpper.includes('TOMBOL') || codeUpper.includes('READ_DIGITAL')) {
      detected.push('button');
    }
    // Check DHT11
    if (codeUpper.includes('DHT') || codeUpper.includes('DHT11') || codeUpper.includes('READ_DHT11') || codeUpper.includes('READ_TEMP') || codeUpper.includes('READ_HUMIDITY')) {
      detected.push('dht11');
    }
    if (codeUpper.includes('MOTOR') || codeUpper.includes('MOTOR_DC') || codeUpper.includes('MOTORDC') || codeUpper.includes('DC_MOTOR')) {
      detected.push('motor');
    }
    // Check RFID RC522
    if (codeUpper.includes('MFRC522') || codeUpper.includes('RFID') || codeUpper.includes('RC522') || codeUpper.includes('PICC_')) {
      detected.push('rfid');
    }

    // MERGE detected with existing — never wipe what the user manually added
    const mergedList = [...activeComponents];
    detected.forEach(c => { if (!mergedList.includes(c)) mergedList.push(c); });
    setActiveComponents(mergedList);

    // Auto-wire all components using smart pin allocation
    runAutoWire(mergedList);
  }, [activeCode, board, programPins]);

  // Draggable Component Positions (Optimized for expanded 780px canvas height)
  const [localPositions, setLocalPositions] = useState<{ [key: string]: { x: number; y: number } }>({
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
  });
  // Merge localPositions (defaults) with positionsProp overrides so positions.xxx
  // is NEVER undefined — even when parent only passes a partial positions object.
  const positions = { ...localPositions, ...(positionsProp ?? {}) };
  const setPositions = (val: { [key: string]: { x: number; y: number } } | ((prev: { [key: string]: { x: number; y: number } }) => { [key: string]: { x: number; y: number } })) => {
    const nextVal = typeof val === 'function' ? val(positions) : val;
    if (onPositionsChange) {
      onPositionsChange(nextVal);
    } else {
      setLocalPositions(nextVal);
    }
  };

  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [selectedColor, setSelectedColor] = useState('#ef4444'); // Red default
  const [activePinStart, setActivePinStart] = useState<Pin | null>(null);
  const [activeBendPoints, setActiveBendPoints] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  // const containerRef = useRef<HTMLDivElement>(null);

  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 3.0;
  const ZOOM_STEP = 0.2;

  const handleZoomIn  = () => setZoomLevel(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(1))));
  const handleZoomOut = () => setZoomLevel(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(1))));
  const handleZoomReset = () => { setZoomLevel(1.0); setPanOffset({ x: 0, y: 0 }); };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  // Filter active components by base type
  const [partSearch, setPartSearch] = useState('');
  const matchingWokwiParts = wokwiParts.filter(tag => wokwiPartName(tag).toLowerCase().includes(partSearch.trim().toLowerCase()));
  const [wokwiPins, setWokwiPins] = useState<Record<string, WokwiPin[]>>({});
  const catalogParts = activeComponents.filter(id => wokwiParts.includes(getBaseComponentType(id)));
  const updateWokwiPins = useCallback((id: string, next: WokwiPin[]) => {
    setWokwiPins(previous => ({ ...previous, [id]: next }));
  }, []);

  const ledComponents = activeComponents.filter(c => getBaseComponentType(c) === 'led');
  const servoComponents = activeComponents.filter(c => getBaseComponentType(c) === 'servo');
  const ultrasonicComponents = activeComponents.filter(c => getBaseComponentType(c) === 'ultrasonic');
  const potComponents = activeComponents.filter(c => getBaseComponentType(c) === 'pot');
  const buttonComponents = activeComponents.filter(c => getBaseComponentType(c) === 'button');
  const lcdComponents = activeComponents.filter(c => getBaseComponentType(c) === 'lcd');
  const motorComponents = activeComponents.filter(c => getBaseComponentType(c) === 'motor');
  const dht11Components = activeComponents.filter(c => getBaseComponentType(c) === 'dht11');
  const rfidComponents = activeComponents.filter(c => getBaseComponentType(c) === 'rfid');

  const hasServo = servoComponents.length > 0;
  const hasUltrasonic = ultrasonicComponents.length > 0;
  const hasLed = ledComponents.length > 0;
  const hasPot = potComponents.length > 0;
  const hasButton = buttonComponents.length > 0;
  const hasLcd = lcdComponents.length > 0;
  const hasMotor = motorComponents.length > 0;
  const hasDht11 = dht11Components.length > 0;
  const hasRfid = rfidComponents.length > 0;

  const checkMotorWiring = (id: string = 'motor'): boolean => {
    const pinPos = getInstancePinId(id, 'MOTOR_POS');
    const pinNeg = getInstancePinId(id, 'MOTOR_NEG');
    const posWire = wires.find(w => w.to === pinPos || w.from === pinPos);
    const negWire = wires.find(w => w.to === pinNeg || w.from === pinNeg);
    return !!posWire && !!negWire;
  };
  const isMotorWired = checkMotorWiring('motor');

  const gndPins = [
    'GND', 'GND_L', 'GND_R', 'GND_T', 'GND_B', 'PAD_GND', 'GND_M', 'G_M', 'GND_L2', 'GND_R2',
    ...(board === 'BBC micro:bit' ? Array.from({ length: 21 }, (_, i) => `G${i}`) : [])
  ];

  // Define Pins coordinates dynamically based on component positions (Mapping to Custom SVGs)
  const getPins = (): Pin[] => {
    const bx = positions.board.x;
    const by = positions.board.y;
    const isEsp8266 = board.toLowerCase().includes('esp8266') || board.toLowerCase().includes('esp266') || board.toLowerCase().includes('nodemcu');
    
    let mcuPins: Pin[] = [];
    if (board === 'Arduino Uno') {
      mcuPins = [
        // ── Arduino Uno Top Digital Header (scaled: 250→340, ratio 1.36)
        { id: 'AREF', name: 'AREF',  cx: bx + 119.1, cy: by + 16.2,  type: 'mcu' },
        { id: 'GND_T',name: 'GND',   cx: bx + 130.0, cy: by + 16.2,  type: 'mcu' },
        { id: 'D13',  name: 'D13',   cx: bx + 140.5, cy: by + 16.2,  type: 'mcu' },
        { id: 'D12',  name: 'D12',   cx: bx + 151.2, cy: by + 16.2,  type: 'mcu' },
        { id: 'D11',  name: 'D11',   cx: bx + 161.9, cy: by + 16.2,  type: 'mcu' },
        { id: 'D10',  name: 'D10',   cx: bx + 172.9, cy: by + 16.2,  type: 'mcu' },
        { id: 'D9',   name: 'D9',    cx: bx + 184.0, cy: by + 16.2,  type: 'mcu' },
        { id: 'D8',   name: 'D8',    cx: bx + 194.9, cy: by + 16.2,  type: 'mcu' },
        // Gap between D8 and D7
        { id: 'D7',   name: 'D7',    cx: bx + 216.1, cy: by + 16.2,  type: 'mcu' },
        { id: 'D6',   name: 'D6',    cx: bx + 234.9, cy: by + 16.2,  type: 'mcu' },
        { id: 'D5',   name: 'D5',    cx: bx + 245.9, cy: by + 16.2,  type: 'mcu' },
        { id: 'D4',   name: 'D4',    cx: bx + 256.2, cy: by + 16.2,  type: 'mcu' },
        { id: 'D3',   name: 'D3',    cx: bx + 266.9, cy: by + 16.2,  type: 'mcu' },
        { id: 'D2',   name: 'D2',    cx: bx + 278.1, cy: by + 16.2,  type: 'mcu' },
        { id: 'TX0_A',name: 'TX (D1)',cx: bx + 289.0, cy: by + 16.2,  type: 'mcu' },
        { id: 'RX0_A',name: 'RX (D0)',cx: bx + 299.5, cy: by + 16.2,  type: 'mcu' },

        // ── Arduino Uno Bottom Power + Analog Header (scaled Y: 161.6×1.36→219.8)
        { id: 'IOREF',name: 'IOREF', cx: bx + 152.7, cy: by + 219.8, type: 'mcu' },
        { id: 'RST',  name: 'RESET', cx: bx + 163.7, cy: by + 219.8, type: 'mcu' },
        { id: '3V3',  name: '3.3V',  cx: bx + 174.1, cy: by + 219.8, type: 'mcu' },
        { id: '5V',   name: '5V',    cx: bx + 184.8, cy: by + 219.8, type: 'mcu' },
        { id: 'GND_B',name: 'GND',   cx: bx + 195.8, cy: by + 219.8, type: 'mcu' },
        { id: 'GND_P',name: 'GND',   cx: bx + 206.9, cy: by + 219.8, type: 'mcu' },
        { id: 'VIN',  name: 'VIN',   cx: bx + 217.3, cy: by + 219.8, type: 'mcu' },
        // Gap then analog
        { id: 'A0',   name: 'A0',    cx: bx + 250.4, cy: by + 219.8, type: 'mcu' },
        { id: 'A1',   name: 'A1',    cx: bx + 261.3, cy: by + 219.8, type: 'mcu' },
        { id: 'A2',   name: 'A2',    cx: bx + 272.1, cy: by + 219.8, type: 'mcu' },
        { id: 'A3',   name: 'A3',    cx: bx + 283.2, cy: by + 219.8, type: 'mcu' },
        { id: 'A4',   name: 'A4',    cx: bx + 293.8, cy: by + 219.8, type: 'mcu' },
        { id: 'A5',   name: 'A5',    cx: bx + 304.4, cy: by + 219.8, type: 'mcu' },
      ];
    } else if (board === 'BBC micro:bit') {
      mcuPins = [
        // 5 Big Gold Hole Pads at the bottom edge (P0, P1, 3V, GND, P2) - aligned to actual gold pads
        { id: 'PAD0',    name: 'P0 Pad (Analog/Digital)', cx: bx + 115, cy: by + 226, type: 'mcu' },
        { id: 'PAD_3V',  name: '3V Pad (3.3V Power Out)', cx: bx + 160, cy: by + 226, type: 'mcu' },
        { id: 'PAD1',    name: 'P1 Pad (Analog/Digital)', cx: bx + 205, cy: by + 226, type: 'mcu' },
        { id: 'PAD_GND', name: 'GND Pad (Ground)',        cx: bx + 250, cy: by + 226, type: 'mcu' },
        { id: 'PAD2',    name: 'P2 Pad (Analog/Digital)', cx: bx + 295, cy: by + 226, type: 'mcu' },

        // Column of red/black pin headers on the far left (5V, GND, V, G, S) - aligned at cx=52 and shifted up
        { id: '5V_M',  name: '5V Pin Header',        cx: bx + 52, cy: by + 118, type: 'mcu' },
        { id: 'GND_M', name: 'GND Pin Header',       cx: bx + 52, cy: by + 133, type: 'mcu' },
        { id: 'V_M',   name: 'V (3.3V) Pin Header',  cx: bx + 52, cy: by + 148, type: 'mcu' },
        { id: 'G_M',   name: 'G (GND) Pin Header',   cx: bx + 52, cy: by + 163, type: 'mcu' },
        { id: 'S_M',   name: 'S (Signal) Pin Header',cx: bx + 52, cy: by + 178, type: 'mcu' },

        // Row of 21 yellow signal pin headers (P0 to P20) - aligned at cx=74, step=10.8
        ...Array.from({ length: 21 }, (_, i) => ({
          id: `P${i}`,
          name: `P${i} (Header Pin)`,
          cx: bx + 74 + i * 10.8,
          cy: by + 163,
          type: 'mcu' as const
        })),

        // Row of 21 red power pin headers (V0 to V20) - aligned at cx=74, step=10.8
        ...Array.from({ length: 21 }, (_, i) => ({
          id: `V${i}`,
          name: `3V3 Power Pin (Row V${i})`,
          cx: bx + 74 + i * 10.8,
          cy: by + 178,
          type: 'mcu' as const
        })),

        // Row of 21 black ground pin headers (G0 to G20) - aligned at cx=74, step=10.8
        ...Array.from({ length: 21 }, (_, i) => ({
          id: `G${i}`,
          name: `GND Ground Pin (Row G${i})`,
          cx: bx + 74 + i * 10.8,
          cy: by + 193,
          type: 'mcu' as const
        }))
      ];
    } else if (isEsp8266) {
      const leftX = bx + 11.0;
      const rightX = bx + 169.1;
      const startY = by + 53.8;
      const stepY = 15.94;

      mcuPins = [
        // Left Column (15 pins: D0 to 3V3)
        { id: 'D0',     name: 'D0 (GPIO16 / WAKE)',     cx: leftX, cy: startY + 0 * stepY,  type: 'mcu' },
        { id: 'D1',     name: 'D1 (GPIO5 / SCL)',       cx: leftX, cy: startY + 1 * stepY,  type: 'mcu' },
        { id: 'D2',     name: 'D2 (GPIO4 / SDA)',       cx: leftX, cy: startY + 2 * stepY,  type: 'mcu' },
        { id: 'D3',     name: 'D3 (GPIO0 / FLASH)',     cx: leftX, cy: startY + 3 * stepY,  type: 'mcu' },
        { id: 'D4',     name: 'D4 (GPIO2 / LED)',       cx: leftX, cy: startY + 4 * stepY,  type: 'mcu' },
        { id: '3V3_L',  name: '3.3V (Power Output)',    cx: leftX, cy: startY + 5 * stepY,  type: 'mcu' },
        { id: 'GND_L',  name: 'GND (Ground)',           cx: leftX, cy: startY + 6 * stepY,  type: 'mcu' },
        { id: 'D5',     name: 'D5 (GPIO14 / SCLK)',     cx: leftX, cy: startY + 7 * stepY,  type: 'mcu' },
        { id: 'D6',     name: 'D6 (GPIO12 / MISO)',     cx: leftX, cy: startY + 8 * stepY,  type: 'mcu' },
        { id: 'D7',     name: 'D7 (GPIO13 / MOSI)',     cx: leftX, cy: startY + 9 * stepY,  type: 'mcu' },
        { id: 'D8',     name: 'D8 (GPIO15 / CS)',       cx: leftX, cy: startY + 10 * stepY, type: 'mcu' },
        { id: 'RX',     name: 'RX (GPIO3 / UART RX)',   cx: leftX, cy: startY + 11 * stepY, type: 'mcu' },
        { id: 'TX',     name: 'TX (GPIO1 / UART TX)',   cx: leftX, cy: startY + 12 * stepY, type: 'mcu' },
        { id: 'GND_L2', name: 'GND (Ground)',           cx: leftX, cy: startY + 13 * stepY, type: 'mcu' },
        { id: '3V3_L2', name: '3.3V (Power Output)',    cx: leftX, cy: startY + 14 * stepY, type: 'mcu' },

        // Right Column (15 pins: A0 to VIN)
        { id: 'A0',     name: 'A0 (ADC 10-bit 0-3.3V)', cx: rightX, cy: startY + 0 * stepY,  type: 'mcu' },
        { id: 'RSV1',   name: 'RSV (Reserved)',         cx: rightX, cy: startY + 1 * stepY,  type: 'mcu' },
        { id: 'RSV2',   name: 'RSV (Reserved)',         cx: rightX, cy: startY + 2 * stepY,  type: 'mcu' },
        { id: 'SD3',    name: 'SD3 (GPIO10)',           cx: rightX, cy: startY + 3 * stepY,  type: 'mcu' },
        { id: 'SD2',    name: 'SD2 (GPIO9)',            cx: rightX, cy: startY + 4 * stepY,  type: 'mcu' },
        { id: 'SD1',    name: 'SD1 (GPIO8 / MOSI)',     cx: rightX, cy: startY + 5 * stepY,  type: 'mcu' },
        { id: 'CMD',    name: 'CMD (GPIO11 / CS)',      cx: rightX, cy: startY + 6 * stepY,  type: 'mcu' },
        { id: 'SD0',    name: 'SD0 (GPIO7 / MISO)',     cx: rightX, cy: startY + 7 * stepY,  type: 'mcu' },
        { id: 'CLK',    name: 'CLK (GPIO6 / SCLK)',     cx: rightX, cy: startY + 8 * stepY,  type: 'mcu' },
        { id: 'GND_R',  name: 'GND (Ground)',           cx: rightX, cy: startY + 9 * stepY,  type: 'mcu' },
        { id: '3V3_R',  name: '3.3V (Power Output)',    cx: rightX, cy: startY + 10 * stepY, type: 'mcu' },
        { id: 'EN',     name: 'EN (Enable/CH_PD)',      cx: rightX, cy: startY + 11 * stepY, type: 'mcu' },
        { id: 'RST',    name: 'RST (Reset)',            cx: rightX, cy: startY + 12 * stepY, type: 'mcu' },
        { id: 'GND_R2', name: 'GND (Ground)',           cx: rightX, cy: startY + 13 * stepY, type: 'mcu' },
        { id: 'VIN',    name: 'VIN / 5V (Power Input)', cx: rightX, cy: startY + 14 * stepY, type: 'mcu' },
      ];
    } else {
      mcuPins = [
        // ── ESP32 DevKitC V4 LEFT column (19 pins: 3V3, EN, VP, VN, 34, 35, 32, 33, 25, 26, 27, 14, 12, GND, 13, D2, D3, CMD, 5V)
        { id: '3V3',  name: '3V3 (3.3V Power Out)', cx: bx + 7.5, cy: by + 46.5,  type: 'mcu' },
        { id: 'EN',   name: 'EN (Enable/Reset)',    cx: bx + 7.5, cy: by + 62.1,  type: 'mcu' },
        { id: 'G36',  name: 'VP / G36 (ADC1_0)',    cx: bx + 7.5, cy: by + 77.8,  type: 'mcu' },
        { id: 'G39',  name: 'VN / G39 (ADC1_3)',    cx: bx + 7.5, cy: by + 93.5,  type: 'mcu' },
        { id: 'G34',  name: 'G34 (Input Only)',     cx: bx + 7.5, cy: by + 109.2, type: 'mcu' },
        { id: 'G35',  name: 'G35 (Input Only)',     cx: bx + 7.5, cy: by + 124.8, type: 'mcu' },
        { id: 'G32',  name: 'G32 (Touch9/ADC1_4)', cx: bx + 7.5, cy: by + 140.5, type: 'mcu' },
        { id: 'G33',  name: 'G33 (Touch8/ADC1_5)', cx: bx + 7.5, cy: by + 156.2, type: 'mcu' },
        { id: 'G25',  name: 'G25 (DAC1/ADC2_8)',   cx: bx + 7.5, cy: by + 171.9, type: 'mcu' },
        { id: 'G26',  name: 'G26 (DAC2/ADC2_9)',   cx: bx + 7.5, cy: by + 187.5, type: 'mcu' },
        { id: 'G27',  name: 'G27 (Touch7/ADC2_7)', cx: bx + 7.5, cy: by + 203.2, type: 'mcu' },
        { id: 'G14',  name: 'G14 (HSPI_CLK/Touch6)',cx: bx + 7.5, cy: by + 218.9, type: 'mcu' },
        { id: 'G12',  name: 'G12 (HSPI_MISO/Touch5)',cx: bx + 7.5, cy: by + 234.6, type: 'mcu' },
        { id: 'GND_L',name: 'GND (Ground)',         cx: bx + 7.5, cy: by + 250.2, type: 'mcu' },
        { id: 'G13',  name: 'G13 (HSPI_MOSI/Touch4)',cx: bx + 7.5, cy: by + 265.9, type: 'mcu' },
        { id: 'G9',   name: 'D2 / G9 (Flash D2)',   cx: bx + 7.5, cy: by + 281.6, type: 'mcu' },
        { id: 'G10',  name: 'D3 / G10 (Flash D3)',  cx: bx + 7.5, cy: by + 297.3, type: 'mcu' },
        { id: 'G11',  name: 'CMD / G11 (Flash CMD)',cx: bx + 7.5, cy: by + 312.9, type: 'mcu' },
        { id: 'VIN',  name: '5V / VIN (5V Power)',  cx: bx + 7.5, cy: by + 328.6, type: 'mcu' },
        
        // ── ESP32 DevKitC V4 RIGHT column (19 pins: GND, 23, 22, TX, RX, 21, GND, 19, 18, 5, 17, 16, 4, 0, 2, 15, D1, D0, CLK)
        { id: 'GND_R',name: 'GND (Ground)',         cx: bx + 162.2, cy: by + 46.5,  type: 'mcu' },
        { id: 'G23',  name: 'G23 (VSPI_MOSI)',      cx: bx + 162.2, cy: by + 62.1,  type: 'mcu' },
        { id: 'G22',  name: 'G22 (I2C SCL)',        cx: bx + 162.2, cy: by + 77.8,  type: 'mcu' },
        { id: 'G1',   name: 'TX / G1 (UART0 TX)',   cx: bx + 162.2, cy: by + 93.5,  type: 'mcu' },
        { id: 'G3',   name: 'RX / G3 (UART0 RX)',   cx: bx + 162.2, cy: by + 109.2, type: 'mcu' },
        { id: 'G21',  name: 'G21 (I2C SDA)',        cx: bx + 162.2, cy: by + 124.8, type: 'mcu' },
        { id: 'GND_M',name: 'GND (Ground)',         cx: bx + 162.2, cy: by + 140.5, type: 'mcu' },
        { id: 'G19',  name: 'G19 (VSPI_MISO)',      cx: bx + 162.2, cy: by + 156.2, type: 'mcu' },
        { id: 'G18',  name: 'G18 (VSPI_SCK)',       cx: bx + 162.2, cy: by + 171.9, type: 'mcu' },
        { id: 'G5',   name: 'G5 (VSPI_CS0)',        cx: bx + 162.2, cy: by + 187.5, type: 'mcu' },
        { id: 'G17',  name: 'G17 (UART2 TX)',       cx: bx + 162.2, cy: by + 203.2, type: 'mcu' },
        { id: 'G16',  name: 'G16 (UART2 RX)',       cx: bx + 162.2, cy: by + 218.9, type: 'mcu' },
        { id: 'G4',   name: 'G4 (Touch0/ADC2_0)',   cx: bx + 162.2, cy: by + 234.6, type: 'mcu' },
        { id: 'G0',   name: 'G0 (Boot/Touch1)',     cx: bx + 162.2, cy: by + 250.2, type: 'mcu' },
        { id: 'G2',   name: 'G2 (LED/Touch2)',      cx: bx + 162.2, cy: by + 265.9, type: 'mcu' },
        { id: 'G15',  name: 'G15 (Touch3/ADC2_3)',  cx: bx + 162.2, cy: by + 281.6, type: 'mcu' },
        { id: 'G8',   name: 'D1 / G8 (Flash D1)',   cx: bx + 162.2, cy: by + 297.3, type: 'mcu' },
        { id: 'G7',   name: 'D0 / G7 (Flash D0)',   cx: bx + 162.2, cy: by + 312.9, type: 'mcu' },
      ];
    }

    const componentPins: Pin[] = [];

    // LED Pins (size 200x200, center 100x100)
    ledComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const ledA = getRotatedPinCoords(id, 80, 185, 100, 100);
      const ledK = getRotatedPinCoords(id, 120, 185, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'LED_A'), name: `LED Anode (+)${s}`,    cx: ledA.cx, cy: ledA.cy, type: 'component' },
        { id: getInstancePinId(id, 'LED_K'), name: `LED Cathode (-)${s}`,  cx: ledK.cx, cy: ledK.cy, type: 'component' }
      );
    });
    
    // Servo Pins (size 200x200, center 100x100)
    servoComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const gnd = getRotatedPinCoords(id, 85, 20, 100, 100);
      const vcc = getRotatedPinCoords(id, 100, 20, 100, 100);
      const sig = getRotatedPinCoords(id, 115, 20, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'SERVO_GND'), name: `Servo GND (Ground)${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: getInstancePinId(id, 'SERVO_VCC'), name: `Servo VCC (5V)${s}`, cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: getInstancePinId(id, 'SERVO_SIG'), name: `Servo PWM Signal${s}`, cx: sig.cx, cy: sig.cy, type: 'component' }
      );
    });

    // HC-SR04 Pins (size 200x200, center 100x100)
    ultrasonicComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const vcc = getRotatedPinCoords(id, 84, 157, 100, 100);
      const trig = getRotatedPinCoords(id, 94, 157, 100, 100);
      const echo = getRotatedPinCoords(id, 105, 157, 100, 100);
      const gnd = getRotatedPinCoords(id, 115, 157, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'SR04_VCC'),  name: `SR04 VCC (5V)${s}`,          cx: vcc.cx,  cy: vcc.cy,  type: 'component' },
        { id: getInstancePinId(id, 'SR04_TRIG'), name: `SR04 Trig Trigger Pin${s}`,  cx: trig.cx, cy: trig.cy, type: 'component' },
        { id: getInstancePinId(id, 'SR04_ECHO'), name: `SR04 Echo Pulse Pin${s}`,    cx: echo.cx, cy: echo.cy, type: 'component' },
        { id: getInstancePinId(id, 'SR04_GND'),  name: `SR04 GND (Ground)${s}`,      cx: gnd.cx,  cy: gnd.cy,  type: 'component' }
      );
    });

    // Potentiometer Pins (size 200x200, center 100x100)
    potComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const gnd = getRotatedPinCoords(id, 50, 150, 100, 100);
      const sig = getRotatedPinCoords(id, 100, 150, 100, 100);
      const vcc = getRotatedPinCoords(id, 150, 150, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'POT_VCC'), name: `Pot VCC (3.3V/5V)${s}`, cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: getInstancePinId(id, 'POT_SIG'), name: `Pot Signal Analog Out${s}`, cx: sig.cx, cy: sig.cy, type: 'component' },
        { id: getInstancePinId(id, 'POT_GND'), name: `Pot GND (Ground)${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    });

    // Push Button Pins (size 120x120, center 60x60)
    buttonComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const sig = getRotatedPinCoords(id, 35, 95, 60, 60);
      const gnd = getRotatedPinCoords(id, 85, 95, 60, 60);
      componentPins.push(
        { id: getInstancePinId(id, 'BTN_SIG'), name: `Button Signal (Output)${s}`, cx: sig.cx, cy: sig.cy, type: 'component' },
        { id: getInstancePinId(id, 'BTN_GND'), name: `Button GND (Ground)${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    });

    // LCD 16x2 I2C Pins (size 200x200, center 100x100)
    lcdComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const gnd = getRotatedPinCoords(id, 22, 68, 100, 100);
      const vcc = getRotatedPinCoords(id, 22, 82, 100, 100);
      const sda = getRotatedPinCoords(id, 22, 96, 100, 100);
      const scl = getRotatedPinCoords(id, 22, 110, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'LCD_GND'), name: `LCD GND${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: getInstancePinId(id, 'LCD_VCC'), name: `LCD VCC (5V)${s}`, cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: getInstancePinId(id, 'LCD_SDA'), name: `LCD SDA (Data)${s}`, cx: sda.cx, cy: sda.cy, type: 'component' },
        { id: getInstancePinId(id, 'LCD_SCL'), name: `LCD SCL (Clock)${s}`, cx: scl.cx, cy: scl.cy, type: 'component' }
      );
    });

    // DC Motor Pins (size 200x200, center 100x100)
    motorComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const pos = getRotatedPinCoords(id, 78, 185, 100, 100);
      const neg = getRotatedPinCoords(id, 122, 185, 100, 100);
      componentPins.push(
        { id: getInstancePinId(id, 'MOTOR_POS'), name: `DC Motor Positif (+)${s}`, cx: pos.cx, cy: pos.cy, type: 'component' },
        { id: getInstancePinId(id, 'MOTOR_NEG'), name: `DC Motor Negatif (-)${s}`, cx: neg.cx, cy: neg.cy, type: 'component' }
      );
    });

    // DHT11 Pins (aligned with dht11 layout, pitch 20px, corrected offset)
    dht11Components.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const vcc = getRotatedPinCoords(id, 15, 115, 45, 60);
      const data = getRotatedPinCoords(id, 35, 115, 45, 60);
      const nc = getRotatedPinCoords(id, 55, 115, 45, 60);
      const gnd = getRotatedPinCoords(id, 75, 115, 45, 60);
      componentPins.push(
        { id: getInstancePinId(id, 'DHT11_VCC'), name: `DHT11 VCC (5V/3V3)${s}`, cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: getInstancePinId(id, 'DHT11_DATA'), name: `DHT11 Data Pin${s}`, cx: data.cx, cy: data.cy, type: 'component' },
        { id: getInstancePinId(id, 'DHT11_NC'), name: `DHT11 NC (No Conn)${s}`, cx: nc.cx, cy: nc.cy, type: 'component' },
        { id: getInstancePinId(id, 'DHT11_GND'), name: `DHT11 GND (Ground)${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    });

    // RC522 RFID Reader Pins (8 pins, 2.54mm pitch)
    rfidComponents.forEach(id => {
      const s = id.includes('_') ? ` #${id.split('_')[1]}` : '';
      const sda = getRotatedPinCoords(id, 16, 162, 55, 80);
      const sck = getRotatedPinCoords(id, 27, 162, 55, 80);
      const mosi = getRotatedPinCoords(id, 38, 162, 55, 80);
      const miso = getRotatedPinCoords(id, 49, 162, 55, 80);
      const irq = getRotatedPinCoords(id, 60, 162, 55, 80);
      const gnd = getRotatedPinCoords(id, 71, 162, 55, 80);
      const rst = getRotatedPinCoords(id, 82, 162, 55, 80);
      const v33 = getRotatedPinCoords(id, 93, 162, 55, 80);
      componentPins.push(
        { id: getInstancePinId(id, 'RFID_SDA'), name: `RFID SDA / SS (Chip Select)${s}`, cx: sda.cx, cy: sda.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_SCK'), name: `RFID SCK (SPI Clock)${s}`, cx: sck.cx, cy: sck.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_MOSI'), name: `RFID MOSI (Master Out)${s}`, cx: mosi.cx, cy: mosi.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_MISO'), name: `RFID MISO (Master In)${s}`, cx: miso.cx, cy: miso.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_IRQ'), name: `RFID IRQ (Interrupt)${s}`, cx: irq.cx, cy: irq.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_GND'), name: `RFID GND (Ground)${s}`, cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_RST'), name: `RFID RST (Reset Pin)${s}`, cx: rst.cx, cy: rst.cy, type: 'component' },
        { id: getInstancePinId(id, 'RFID_3V3'), name: `RFID 3.3V (VCC Power)${s}`, cx: v33.cx, cy: v33.cy, type: 'component' }
      );
    });

    for (const id of catalogParts) {
      (wokwiPins[id] || []).forEach((pin, index) => {
        componentPins.push({
          id: wokwiPartPinId(id, index),
          name: `${wokwiPartName(getBaseComponentType(id))} · ${pin.name}`,
          ...getRotatedPinCoords(id, pin.x, pin.y, wokwiPartWidth / 2, wokwiPartHeight / 2),
          type: 'component',
        });
      });
    }
    return [...mcuPins, ...componentPins];
  };

  const pins = getPins();

  // ESC keypress handler: Stops wiring and locks at last bend point or nearest snapped pin!
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePinStart) {
        // Check if cursor is currently snapped/close to any pin
        let nearestPin: Pin | null = null;
        let minDist = 99999;
        for (const pin of pins) {
          const dx = mousePos.x - pin.cx;
          const dy = mousePos.y - pin.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = pin.id.startsWith('PAD') ? 28 : 18;
          if (dist < maxDist && dist < minDist) {
            minDist = dist;
            nearestPin = pin;
          }
        }

        if (nearestPin && nearestPin.id !== activePinStart.id) {
          // Connect to the snapped pin instead of floating!
          const newWire: Wire = {
            from: activePinStart.id,
            to: nearestPin.id,
            color: selectedColor,
            bendPoints: activeBendPoints
          };
          setWires(prev => [...prev, newWire]);
        } else if (activeBendPoints.length > 0) {
          // Stop drawing, lock end of wire at last clicked bend point
          const lastPt = activeBendPoints[activeBendPoints.length - 1];
          const remainingPts = activeBendPoints.slice(0, activeBendPoints.length - 1);
          
          const newWire: Wire = {
            from: activePinStart.id,
            to: 'floating',
            toCoord: lastPt,
            color: selectedColor,
            bendPoints: remainingPts
          };
          setWires(prev => [...prev, newWire]);
        }
        setActivePinStart(null);
        setActiveBendPoints([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePinStart, activeBendPoints, selectedColor, mousePos, pins]);

  // Helper to trace which MCU pin is connected to a component pin
  const getConnectedMcuPin = (componentPin: string): Pin | null => {
    const wire = wires.find(w => 
      (w.from === componentPin && pins.find(p => p.id === w.to)?.type === 'mcu') ||
      (w.to === componentPin && pins.find(p => p.id === w.from)?.type === 'mcu')
    );
    if (!wire) return null;
    const mcuPinId = wire.from === componentPin ? wire.to : wire.from;
    return pins.find(p => p.id === mcuPinId) || null;
  };

  useEffect(() => {
    potComponents.forEach(id => {
      const pinSig = getInstancePinId(id, 'POT_SIG');
      const potSigPin = getConnectedMcuPin(pinSig);
      if (potSigPin && onPinStateChange) {
        const numMatch = potSigPin.id.match(/\d+/);
        const pinKey = numMatch ? numMatch[0] : potSigPin.id;
        const currentVal = id === 'pot' ? potValue : (extraPotValues[id] ?? potValue);
        const analogVal = Math.round(currentVal * 1023 / 100);
        onPinStateChange(pinKey, analogVal);
        onPinStateChange(potSigPin.id, analogVal);
      }
    });
  }, [potValue, extraPotValues, potComponents, wires, board, onPinStateChange, isRunning]);

  useEffect(() => {
    buttonComponents.forEach(id => {
      const pinSig = getInstancePinId(id, 'BTN_SIG');
      const btnSigPin = getConnectedMcuPin(pinSig);
      if (btnSigPin && onPinStateChange) {
        const numMatch = btnSigPin.id.match(/\d+/);
        const pinKey = numMatch ? numMatch[0] : btnSigPin.id;
        const isPressed = id === 'button' ? buttonPressed : (pressedButtons[id] || false);
        const state = isPressed ? 'HIGH' : 'LOW';
        onPinStateChange(pinKey, state);
        onPinStateChange(btnSigPin.id, state);
      }
    });
  }, [buttonPressed, pressedButtons, buttonComponents, wires, board, onPinStateChange, isRunning]);

  const powerPins = [
    '5V', '3V3', '3V', 'VIN', 'VIN_L', 'VIN_R', 'PAD_3V', '5V_M', 'V_M', '3V3_L', '3V3_R', '3V3_R2',
    ...(board === 'BBC micro:bit' ? Array.from({ length: 21 }, (_, i) => `V${i}`) : [])
  ];

  const ledAnodePin = getConnectedMcuPin('LED_A');
  const ledCathodePin = getConnectedMcuPin('LED_K');
  
  const checkLedPinMatch = (targetPin: Pin | null, _instanceId: string = 'led'): boolean => {
    if (!targetPin) return false;
    return targetPin.type === 'mcu' && !gndPins.includes(targetPin.id) && !powerPins.includes(targetPin.id);
  };

  const isLedActiveHighWired = ledAnodePin !== null && 
                               ledCathodePin !== null && 
                               gndPins.includes(ledCathodePin.id) &&
                               checkLedPinMatch(ledAnodePin);

  const isLedActiveLowWired = ledAnodePin !== null && 
                              ledCathodePin !== null && 
                              powerPins.includes(ledAnodePin.id) &&
                              !gndPins.includes(ledCathodePin.id) &&
                              checkLedPinMatch(ledCathodePin);

  const isLedWired = isLedActiveHighWired || isLedActiveLowWired;

  const getPinBrightness = (pin: Pin, activeLow: boolean = false): number => {
    if (!pinStates) return 0;
    
    const evalState = (s: any): number | null => {
      if (s === 'HIGH') return activeLow ? 0.0 : 1.0;
      if (s === 'LOW') return activeLow ? 1.0 : 0.0;
      if (typeof s === 'number') {
        const norm = Math.min(1.0, Math.max(0.0, s / 255));
        return activeLow ? (1.0 - norm) : norm;
      }
      return null;
    };

    const exactState = evalState(pinStates[pin.id]);
    if (exactState !== null) return exactState;
    
    const numPart = pin.id.match(/\d+/);
    if (numPart) {
      const numState = evalState(pinStates[numPart[0]]);
      if (numState !== null) return numState;
    }

    // Map ESP8266 D-pins to GPIO numbers and vice-versa
    const esp8266GpioMap: Record<string, string> = {
      'D0': '16', 'D1': '5', 'D2': '4', 'D3': '0',
      'D4': '2', 'D5': '14', 'D6': '12', 'D7': '13', 'D8': '15',
      'RX': '3', 'TX': '1'
    };
    if (esp8266GpioMap[pin.id]) {
      const altState = evalState(pinStates[esp8266GpioMap[pin.id]]);
      if (altState !== null) return altState;
    }

    return 0.0;
  };

  const targetLedMcuPin = isLedActiveLowWired ? ledCathodePin : ledAnodePin;
  const ledBrightness = isRunning && isLedWired && targetLedMcuPin ? getPinBrightness(targetLedMcuPin, isLedActiveLowWired) : 0.0;

  const servoSigPin = getConnectedMcuPin('SERVO_SIG');
  const servoVccPin = getConnectedMcuPin('SERVO_VCC');
  const servoGndPin = getConnectedMcuPin('SERVO_GND');

  const checkServoPinMatch = (targetSigPin: Pin | null = servoSigPin, _instanceId: string = 'servo'): boolean => {
    if (!targetSigPin) return false;
    return targetSigPin.type === 'mcu' && !gndPins.includes(targetSigPin.id) && !powerPins.includes(targetSigPin.id);
  };

  const isServoWired = servoSigPin !== null && 
                       servoVccPin !== null && 
                       servoGndPin !== null && 
                       gndPins.includes(servoGndPin.id) &&
                       powerPins.includes(servoVccPin.id) &&
                       checkServoPinMatch();

  const getServoAngle = (targetSigPin: Pin | null = servoSigPin, wired: boolean = isServoWired): number => {
    if (!wired || !isRunning || !targetSigPin) return 90;
    
    const resolveAngle = (rawVal: number): number => {
      // BBC micro:bit: maps duty cycle values (30 to 120) back to degrees (0 to 180)
      if (board === 'BBC micro:bit') {
        const mappedAngle = (rawVal - 30) * 2;
        const res = Math.max(0, Math.min(180, mappedAngle));
        return res;
      }
      return Math.max(0, Math.min(180, rawVal));
    };

    if (targetSigPin && pinStates) {
      const exactState = pinStates[targetSigPin.id];
      if (exactState !== undefined) {
        const parsed = Number(exactState);
        if (!isNaN(parsed)) return resolveAngle(parsed);
      }
      const numPart = targetSigPin.id.match(/\d+/);
      if (numPart) {
        const numState = pinStates[numPart[0]];
        if (numState !== undefined) {
          const parsed = Number(numState);
          if (!isNaN(parsed)) return resolveAngle(parsed);
        }
      }
    }
    return robotCommand === 'LEFT' ? 45 : robotCommand === 'RIGHT' ? 135 : 90;
  };

  const servoAngle = getServoAngle();

  const checkUltrasonicWiring = (): boolean => {
    const trigPin = getConnectedMcuPin('SR04_TRIG');
    const echoPin = getConnectedMcuPin('SR04_ECHO');
    const vccPin = getConnectedMcuPin('SR04_VCC');
    const gndPin = getConnectedMcuPin('SR04_GND');
    
    const isPowerOk = vccPin !== null && gndPin !== null && gndPins.includes(gndPin.id) && powerPins.includes(vccPin.id);
    if (!isPowerOk || !trigPin || !echoPin) return false;
    return trigPin.type === 'mcu' && echoPin.type === 'mcu' && !gndPins.includes(trigPin.id) && !gndPins.includes(echoPin.id);
  };

  const isUltrasonicWired = checkUltrasonicWiring();

  const checkPotWiring = (instanceId: string = 'pot'): boolean => {
    const sigPin = getConnectedMcuPin(getInstancePinId(instanceId, 'POT_SIG'));
    const vccPin = getConnectedMcuPin(getInstancePinId(instanceId, 'POT_VCC'));
    const gndPin = getConnectedMcuPin(getInstancePinId(instanceId, 'POT_GND'));
    
    if (!sigPin || !vccPin || !gndPin || !gndPins.includes(gndPin.id) || !powerPins.includes(vccPin.id)) return false;
    return sigPin.type === 'mcu' && !gndPins.includes(sigPin.id) && !powerPins.includes(sigPin.id);
  };

  const isPotWired = checkPotWiring();

  const checkBtnWiring = (instanceId: string = 'button'): boolean => {
    const sigPin = getConnectedMcuPin(getInstancePinId(instanceId, 'BTN_SIG'));
    const gndPin = getConnectedMcuPin(getInstancePinId(instanceId, 'BTN_GND'));
    
    if (!sigPin || !gndPin || (!gndPins.includes(gndPin.id) && !powerPins.includes(gndPin.id))) return false;
    return sigPin.type === 'mcu' && !gndPins.includes(sigPin.id) && !powerPins.includes(sigPin.id);
  };

  const isButtonWired = checkBtnWiring();

  const checkDhtWiring = (): boolean => {
    const dataPin = getConnectedMcuPin('DHT11_DATA');
    const vccPin = getConnectedMcuPin('DHT11_VCC');
    const gndPin = getConnectedMcuPin('DHT11_GND');
    
    if (!dataPin || !vccPin || !gndPin || !gndPins.includes(gndPin.id) || !powerPins.includes(vccPin.id)) return false;
    return true;
  };

  const isDhtWired = checkDhtWiring();

  const checkLcdWiring = (): boolean => {
    const gndPin = getConnectedMcuPin('LCD_GND');
    const vccPin = getConnectedMcuPin('LCD_VCC');
    const sdaPin = getConnectedMcuPin('LCD_SDA');
    const sclPin = getConnectedMcuPin('LCD_SCL');
    
    if (!gndPin || !vccPin || !sdaPin || !sclPin) return false;
    return gndPins.includes(gndPin.id) && powerPins.includes(vccPin.id);
  };

  const isLcdWired = checkLcdWiring();

  // Convert client coordinate and apply Snapping (lock onto nearby pin when mouse is close)
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const transformedPoint = point.matrixTransform(ctm.inverse());
      
      // Snapping check: within 18px of any pin
      let nearestPin: Pin | null = null;
      let minDist = 99999;
      for (const pin of pins) {
        const dx = transformedPoint.x - pin.cx;
        const dy = transformedPoint.y - pin.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = pin.id.startsWith('PAD') ? 28 : 18;
        if (dist < maxDist && dist < minDist) {
          minDist = dist;
          nearestPin = pin;
        }
      }

      if (nearestPin) {
        setHoveredPin(nearestPin);
        if (activePinStart) {
          setMousePos({ x: nearestPin.cx, y: nearestPin.cy });
        }
      } else {
        setHoveredPin(null);
        if (activePinStart) {
          setMousePos({ x: transformedPoint.x, y: transformedPoint.y });
        }
      }
      
      if (draggedElement) {
        hasMovedDuringDrag.current = true;
        const newX = transformedPoint.x - dragStart.x;
        const newY = transformedPoint.y - dragStart.y;
        setPositions(prev => ({
          ...prev,
          [draggedElement]: { x: newX, y: newY }
        }));
      }
    }
  };

  // Dragging handlers using getScreenCTM matrix transform
  const startDrag = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!svgRef.current) return;
    
    hasMovedDuringDrag.current = false;
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const transformedPoint = point.matrixTransform(ctm.inverse());
      const baseType = getBaseComponentType(elementId);
      const defaultPos = DEFAULT_COMPONENT_POSITIONS[baseType] || { x: 50, y: 400 };
      const posX = positions[elementId]?.x ?? (positions[baseType]?.x ?? defaultPos.x);
      const posY = positions[elementId]?.y ?? (positions[baseType]?.y ?? defaultPos.y);
      setDraggedElement(elementId);
      setDragStart({
        x: transformedPoint.x - posX,
        y: transformedPoint.y - posY
      });
    }
  };

  const stopDrag = () => {
    if (draggedElement && !hasMovedDuringDrag.current) {
      // Toggle/set active popup for component on click
      setActivePopup(draggedElement);
    }
    setDraggedElement(null);
  };

  // Handle background canvas click - checks for snapped pin to connect instead of bend point!
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (activePinStart && svgRef.current) {
      const svg = svgRef.current;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;
      
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const transformedPoint = point.matrixTransform(ctm.inverse());
        
        // Snapping check
        let nearestPin: Pin | null = null;
        let minDist = 99999;
        pins.forEach(pin => {
          const dx = transformedPoint.x - pin.cx;
          const dy = transformedPoint.y - pin.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = pin.id.startsWith('PAD') ? 28 : 18;
          if (dist < maxDist && dist < minDist) {
            minDist = dist;
            nearestPin = pin;
          }
        });

        if (nearestPin) {
          handlePinClick(nearestPin, e);
          return;
        }

        if (colorPickerOpenId) {
          setColorPickerOpenId(null);
        }

        setActiveBendPoints(prev => [...prev, { x: transformedPoint.x, y: transformedPoint.y }]);
      }
    } else {
      if (colorPickerOpenId) {
        setColorPickerOpenId(null);
      }
    }
  };

  const handlePinClick = (pin: Pin, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas bend point placement
    
    if (!activePinStart) {
      setActivePinStart(pin);
      setMousePos({ x: pin.cx, y: pin.cy });
      setActiveBendPoints([]);
    } else {
      if (activePinStart.id === pin.id) {
        setActivePinStart(null);
        setActiveBendPoints([]);
        return;
      }
      
      const newWire: Wire = {
        from: activePinStart.id,
        to: pin.id,
        color: selectedColor,
        bendPoints: activeBendPoints
      };
      setWires(prev => [...prev, newWire]);
      setActivePinStart(null);
      setActiveBendPoints([]);
    }
  };

  // Auto-wire: only wires components ALREADY in the workspace (activeComponents)
  // Does NOT spawn new components — respects user's existing workspace layout
  const handleAutoWire = () => {
    runAutoWire();
  };

  const handleClearWires = () => {
    setWires([]);
    setActivePinStart(null);
    setActiveBendPoints([]);
  };

  const deleteWire = (index: number) => {
    setWires(prev => prev.filter((_, i) => i !== index));
  };

  // Get SVG connection path coordinate points with right-angle user bend points
  const getWirePath = (wire: Wire) => {
    const startPin = pins.find(p => p.id === wire.from);
    if (!startPin) return '';
    
    let path = `M ${startPin.cx} ${startPin.cy}`;
    if (wire.bendPoints && wire.bendPoints.length > 0) {
      wire.bendPoints.forEach(pt => {
        path += ` L ${pt.x} ${pt.y}`;
      });
    }

    if (wire.to === 'floating' && wire.toCoord) {
      path += ` L ${wire.toCoord.x} ${wire.toCoord.y}`;
    } else {
      const endPin = pins.find(p => p.id === wire.to);
      if (endPin) {
        path += ` L ${endPin.cx} ${endPin.cy}`;
      }
    }
    return path;
  };

  // Live drawing wire with bend points
  const getPreviewWirePath = () => {
    if (!activePinStart) return '';
    let path = `M ${activePinStart.cx} ${activePinStart.cy}`;
    activeBendPoints.forEach(pt => {
      path += ` L ${pt.x} ${pt.y}`;
    });
    path += ` L ${mousePos.x} ${mousePos.y}`;
    return path;
  };

  const colors = [
    { value: '#ef4444', label: 'Red (VCC)' },
    { value: '#334155', label: 'Black (GND)' },
    { value: '#3b82f6', label: 'Blue (Signal)' },
    { value: '#10b981', label: 'Green (Data)' },
    { value: '#eab308', label: 'Yellow (Clock)' },
    { value: '#f97316', label: 'Orange (PWM)' },
    { value: '#a855f7', label: 'Purple (SDA)' },
    { value: '#06b6d4', label: 'Cyan (SCL)' },
    { value: '#ec4899', label: 'Pink (Aux)' },
    { value: '#84cc16', label: 'Lime (GPIO)' },
    { value: '#f59e0b', label: 'Amber (Analog)' },
    { value: '#6366f1', label: 'Indigo (TX/RX)' },
    { value: '#b45309', label: 'Brown (Ground)' },
    { value: '#f8fafc', label: 'White (Neutral)' }
  ];

  // Component wiring states for visual feedback (isLedWired, isServoWired, isUltrasonicWired, isPotWired, and isButtonWired are declared above)

  // Dynamic values
  const currentDistance = isUltrasonicWired ? Math.round(sensorData.distance ?? 42) : 0;
  const currentTemp = isPotWired || isDhtWired ? parseFloat((sensorData.temp ?? 28.4).toFixed(1)) : 0;

  // Add component handler (supports adding the same component multiple times)
  const handleAddComponent = (compType: string) => {
    if (!compType) return;
    const baseType = getBaseComponentType(compType);
    const prefix = compType.startsWith("button_") ? compType : baseType;
    let newId = prefix;
    if (activeComponents.includes(newId)) {
      let idx = 2;
      while (activeComponents.includes(`${prefix}_${idx}`)) {
        idx++;
      }
      newId = `${prefix}_${idx}`;
    }

    // Offset position for new instance
    const count = activeComponents.filter(c => getBaseComponentType(c) === baseType).length;
    const defaultPos = DEFAULT_COMPONENT_POSITIONS[baseType] || { x: 50, y: 420 };
    const basePos = positions[baseType] || defaultPos;
    const offset = count * 60;
    const newPos = {
      x: Math.min(basePos.x + offset, 440),
      y: basePos.y + (basePos.x + offset > 440 ? 40 * Math.floor((basePos.x + offset) / 440) : 0)
    };

    setPositions(prev => ({
      ...prev,
      [newId]: newPos
    }));
    setRotations(prev => ({
      ...prev,
      [newId]: 0
    }));
    setActiveComponents(prev => [...prev, newId]);
  };

  const handleRemoveComponent = (instanceId: string) => {
    setActiveComponents(prev => prev.filter(c => c !== instanceId));
    
    const baseType = getBaseComponentType(instanceId);
    const pinPrefixes = {
      led: ['LED_'],
      servo: ['SERVO_'],
      ultrasonic: ['SR04_'],
      hcsr: ['SR04_'],
      hcsr04: ['SR04_'],
      pot: ['POT_'],
      button: ['BTN_'],
      dht11: ['DHT11_'],
      dht: ['DHT11_'],
      lcd: ['LCD_'],
      motor: ['MOTOR_'],
      rfid: ['RFID_'],
      mfrc522: ['RFID_'],
      rc522: ['RFID_']
    }[baseType] || [baseType.toUpperCase() + '_'];

    const isTargetPin = (pinId: string) => {
      if (instanceId.startsWith('wokwi-')) return pinId.startsWith(instanceId + ':');
      const matchPrefix = pinPrefixes.some(pref => pinId.startsWith(pref));
      if (!matchPrefix) return false;
      if (instanceId.includes('_')) {
        const suffix = instanceId.split('_').slice(1).join('_');
        return pinId.endsWith(`_${suffix}`);
      } else {
        return !/_\d+$/.test(pinId);
      }
    };

    setWires(prev => prev.filter(w => !isTargetPin(w.from) && !isTargetPin(w.to)));
  };

  const renderMicrobitLeds = () => {
    if (board !== 'BBC micro:bit') return null;
    
    const currentFrame = ledFrames[currentFrameIdx] || "00000:00000:00000:00000:00000";
    const scale = 260 / 498;
    
    const rows = currentFrame.split(':');
    const ledElements: React.ReactNode[] = [];
    
    for (let r = 0; r < 5; r++) {
      const rowStr = rows[r] || "00000";
      for (let c = 0; c < 5; c++) {
        const brightnessChar = rowStr[c] || '0';
        if (brightnessChar !== '0') {
          // Calculate screen coordinates (relative to translated parent group)
          const lx = 40 + (152 + c * 46) * scale;
          const ly = -108 + (111 + r * 44) * scale;
          const w = 14 * scale;
          const h = 24 * scale;
          
          const opacity = parseInt(brightnessChar) / 9.0;
          
          ledElements.push(
            <g key={`led-${r}-${c}`}>
              {/* Outer Glow */}
              <rect
                x={lx}
                y={ly}
                width={w}
                height={h}
                rx={3 * scale}
                fill="#ef4444"
                opacity={opacity * 0.4}
                style={{ filter: 'blur(2px)' }}
              />
              {/* Main LED core */}
              <rect
                x={lx}
                y={ly}
                width={w}
                height={h}
                rx={3 * scale}
                fill="#f87171"
                opacity={opacity}
              />
            </g>
          );
        }
      }
    }
    
    return ledElements;
  };

  const modeSwitcherHeader = (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-1.5 border-b shrink-0 ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-800'
          : 'bg-[#0b0f1c] border-slate-800/90 text-slate-100'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSimMode('robot')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            activeSimMode === 'robot'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>🤖 Simulator Robot 3D</span>
          <span className="px-1.5 py-0.2 text-[9px] rounded bg-black/20 text-white font-bold">
            Track PDF • PID 1-5
          </span>
        </button>
        <button
          type="button"
          onClick={() => setSimMode('circuit')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
            activeSimMode === 'circuit'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/25'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>🔌 Simulator Rangkaian</span>
        </button>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-semibold opacity-75">
        {activeSimMode === 'robot' ? (
          <span>
            Sensor: <b>{robotHw.sensorCount} Titik (0/X)</b> • Motor: <b>{robotHw.motorRpm} RPM</b> •{' '}
            <b>{robotHw.hasEncoder ? 'Encoder L/R Aktif' : 'Timer ms'}</b>
          </span>
        ) : (
          <span>Board: <b>{board}</b></span>
        )}
      </div>
    </div>
  );

  if (activeSimMode === 'robot') {
    return (
      <div
        className={`w-full h-full flex flex-col ${
          isLight ? 'bg-slate-100 text-slate-800' : 'bg-[#08090f] text-slate-200'
        } overflow-hidden rounded-2xl select-none transition-colors`}
      >
        {simulatorModeProp === undefined && modeSwitcherHeader}
        <div className="flex-1 min-h-0 overflow-hidden">
          <RobotArena3D
            isRunning={isRunning}
            onToggleRun={onToggleRun}
            hardwareConfig={robotHw}
            onChangeHardwareConfig={setRobotHw}
            plans={robotPlans}
            activePlanId={activePlanId}
            onChangePlans={handleRobotPlansChange}
            onSyncToCodeAndBlocks={(hw, nextPlans, nextActiveId) => {
              setRobotHw(hw);
              handleRobotPlansChange(nextPlans, nextActiveId);
              onSyncRobotToCodeAndBlocks?.(hw, nextPlans, nextActiveId);
            }}
            onHighlightChange={onRobotHighlightChange}
            code={activeCode}
            theme={themeMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${isLight ? 'bg-slate-100/80 text-slate-800' : 'bg-[#08090f] text-slate-200'} overflow-hidden rounded-2xl select-none transition-colors`}>
      {simulatorModeProp === undefined && modeSwitcherHeader}
      <div className={`flex-1 min-h-0 w-full flex flex-col ${isExpanded ? 'lg:flex-row' : ''} gap-3 p-2 lg:p-3 overflow-hidden`}>
      {/* ── 1. MAIN HERO CANVAS (SVG 3D) ── */}
      <div className={`simulator-canvas flex-1 min-h-[400px] ${isExpanded ? 'lg:min-h-full order-2 lg:order-1' : 'order-1'} ${isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0b0d14] border-slate-800/80 shadow-inner'} border rounded-xl relative overflow-hidden flex items-center justify-center group transition-colors`}>
        
        {/* ZOOM TOOLBAR (floating top-right) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleZoomIn}
            className={`w-8 h-8 rounded-lg border font-bold text-lg flex items-center justify-center shadow-md transition hover:scale-105 cursor-pointer ${isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#141824] hover:bg-slate-800 border-slate-700/80 text-slate-100'}`}
            title="Zoom In"
          >+</button>
          <button
            onClick={handleZoomOut}
            className={`w-8 h-8 rounded-lg border font-bold text-lg flex items-center justify-center shadow-md transition hover:scale-105 cursor-pointer ${isLight ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#141824] hover:bg-slate-800 border-slate-700/80 text-slate-100'}`}
            title="Zoom Out"
          >−</button>
          <button
            onClick={handleZoomReset}
            className={`w-8 h-8 rounded-lg border font-bold text-[11px] flex items-center justify-center shadow-md transition hover:scale-105 leading-none cursor-pointer ${isLight ? 'bg-white hover:bg-sky-50 border-slate-200 text-sky-600' : 'bg-[#141824] hover:bg-sky-900/40 border-slate-700/80 text-sky-400'}`}
            title="Reset Zoom & Pan"
          >⌂</button>
          <div className={`w-8 h-6 mt-1 rounded-md border text-[9.5px] font-bold flex items-center justify-center shadow-sm ${isLight ? 'bg-white/90 border-slate-200 text-slate-600' : 'bg-[#141824]/95 border-slate-700/80 text-slate-300'}`}>
            {Math.round(zoomLevel * 100)}%
          </div>
        </div>

        <svg 
          ref={svgRef}
          className="w-full h-full block" 
          viewBox="0 0 340 780"
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onClick={handleCanvasClick}
          onMouseUp={stopDrag}
          onMouseLeave={stopDrag}
          onWheel={handleWheel}
        >
          {/* Static grid background (no zoom) */}
          <defs>
            <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke={isLight ? '#e2e8f0' : '#1e293b'} strokeOpacity={isLight ? '0.8' : '0.65'} strokeWidth="0.6"/>
            </pattern>
            {/* ── 3D GRADIENT DEFINITIONS ── */}
            {/* PCB Boards */}
            <linearGradient id="pcbGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#166534"/>
              <stop offset="100%" stopColor="#052e16"/>
            </linearGradient>
            <linearGradient id="pcbBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e40af"/>
              <stop offset="100%" stopColor="#1e1b4b"/>
            </linearGradient>
            <linearGradient id="pcbDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b"/>
              <stop offset="100%" stopColor="#0f172a"/>
            </linearGradient>
            <linearGradient id="pcbIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#312e81"/>
              <stop offset="100%" stopColor="#1e1b4b"/>
            </linearGradient>
            {/* LED dome */}
            <radialGradient id="ledDomeOff" cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#fecaca"/>
              <stop offset="55%" stopColor="#991b1b"/>
              <stop offset="100%" stopColor="#450a0a"/>
            </radialGradient>
            <radialGradient id="ledDomeOn" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="40%" stopColor="#fca5a5"/>
              <stop offset="75%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#7f1d1d"/>
            </radialGradient>
            {/* Metal leads */}
            <linearGradient id="leadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8"/>
              <stop offset="50%" stopColor="#e2e8f0"/>
              <stop offset="100%" stopColor="#64748b"/>
            </linearGradient>
            {/* Servo */}
            <linearGradient id="servoBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="50%" stopColor="#0284c7"/>
              <stop offset="100%" stopColor="#075985"/>
            </linearGradient>
            <radialGradient id="servoShaftGrad" cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#f1f5f9"/>
              <stop offset="60%" stopColor="#94a3b8"/>
              <stop offset="100%" stopColor="#334155"/>
            </radialGradient>
            <radialGradient id="hornCenterGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#fde68a"/>
              <stop offset="60%" stopColor="#f59e0b"/>
              <stop offset="100%" stopColor="#92400e"/>
            </radialGradient>
            {/* Ultrasonic */}
            <radialGradient id="transducerGrad" cx="38%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#cbd5e1"/>
              <stop offset="50%" stopColor="#64748b"/>
              <stop offset="100%" stopColor="#1e293b"/>
            </radialGradient>
            {/* Potentiometer knob */}
            <radialGradient id="potKnobGrad" cx="32%" cy="28%" r="68%">
              <stop offset="0%" stopColor="#fef9c3"/>
              <stop offset="40%" stopColor="#fbbf24"/>
              <stop offset="80%" stopColor="#d97706"/>
              <stop offset="100%" stopColor="#78350f"/>
            </radialGradient>
            <radialGradient id="potDialGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#e2e8f0"/>
              <stop offset="55%" stopColor="#94a3b8"/>
              <stop offset="100%" stopColor="#334155"/>
            </radialGradient>
            {/* Button cap */}
            <radialGradient id="btnCapOff" cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="55%" stopColor="#3730a3"/>
              <stop offset="100%" stopColor="#1e1b4b"/>
            </radialGradient>
            <radialGradient id="btnCapOn" cx="30%" cy="25%" r="70%">
              <stop offset="0%" stopColor="#ffffff"/>
              <stop offset="35%" stopColor="#fca5a5"/>
              <stop offset="70%" stopColor="#ef4444"/>
              <stop offset="100%" stopColor="#7f1d1d"/>
            </radialGradient>
            {/* LCD screen */}
            <linearGradient id="lcdScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8"/>
              <stop offset="100%" stopColor="#1e3a8a"/>
            </linearGradient>
            <linearGradient id="lcdBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#059669"/>
              <stop offset="100%" stopColor="#064e3b"/>
            </linearGradient>
            {/* Drop shadow filters */}
            <filter id="shadow3d" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="rgba(0,0,0,0.6)"/>
            </filter>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <filter id="ledGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
            <linearGradient id="bodyBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8"/>
              <stop offset="50%" stopColor="#0284c7"/>
              <stop offset="100%" stopColor="#0369a1"/>
            </linearGradient>
            <pattern id="ventPattern" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
              <rect width="1" height="1" fill="#022a40" opacity="0.8"/>
              <rect x="1" y="1" width="1" height="1" fill="#022a40" opacity="0.8"/>
            </pattern>
            {/* Potentiometer brass collar / mounting bracket */}
            <linearGradient id="brassCollarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ca8a04"/>
              <stop offset="40%" stopColor="#a16207"/>
              <stop offset="100%" stopColor="#713f12"/>
            </linearGradient>

            {/* LED Bulb and Legs Clip Paths */}
            <clipPath id="led_bulb_clip"><rect x="0" y="0" width="200" height="140" /></clipPath>
            <clipPath id="led_legs_clip"><rect x="0" y="140" width="200" height="60" /></clipPath>

            {/* Dynamic Gradients for LED Custom Colors */}
            {ledComponents.map(id => {
              const compColor = getComponentColor(id, '#ef4444');
              const lightColor = hexToRgbBoost(compColor, 1.35);
              const darkColor = hexToRgbDarken(compColor, 0.55);
              return (
                <React.Fragment key={`led_grads_${id}`}>
                  <linearGradient id={`led_body_grad_${id}`} x1="15%" y1="0%" x2="85%" y2="100%">
                    <stop offset="0%" stopColor={lightColor} stopOpacity={0.93} />
                    <stop offset="35%" stopColor={compColor} stopOpacity={0.90} />
                    <stop offset="100%" stopColor={darkColor} stopOpacity={0.96} />
                  </linearGradient>
                  <radialGradient id={`led_core_grad_${id}`} cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.98} />
                    <stop offset="35%" stopColor={lightColor} stopOpacity={0.90} />
                    <stop offset="70%" stopColor={compColor} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={compColor} stopOpacity={0} />
                  </radialGradient>
                </React.Fragment>
              );
            })}
            {servoComponents.map(id => {
              const compColor = getComponentColor(id, '#3b82f6');
              if (compColor.toLowerCase() === '#3b82f6') return null;
              const rgb = hexToRgb(compColor);
              const boost = 1.3;
              const rVal = Math.min(2.0, rgb.r * boost).toFixed(3);
              const gVal = Math.min(2.0, rgb.g * boost).toFixed(3);
              const bVal = Math.min(2.0, rgb.b * boost).toFixed(3);
              return (
                <filter key={`servo_tint_${id}`} id={`servo_tint_${id}`} colorInterpolationFilters="sRGB">
                  <feColorMatrix type="matrix" values="
                    0.15 0.25 0.60 0 0
                    0.15 0.25 0.60 0 0
                    0.15 0.25 0.60 0 0
                    0    0    0    1 0" result="gray" />
                  <feColorMatrix in="gray" type="matrix" values={`
                    ${rVal} 0 0 0 0
                    0 ${gVal} 0 0 0
                    0 0 ${bVal} 0 0
                    0 0 0 1 0`} />
                </filter>
              );
            })}
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* ── ZOOM + PAN WRAPPER: all board content is inside this transform group ── */}
          <g transform={`translate(${panOffset.x + 170 * (1 - zoomLevel)}, ${panOffset.y + 390 * (1 - zoomLevel)}) scale(${zoomLevel})`}>

          {/* ==================== MICROCONTROLLER BOARD GROUP ==================== */}
          {board === 'Arduino Uno' ? (
            /* Arduino Uno Group — scaled up 340×241 for better pin visibility */
            <g 
              transform={`translate(${positions.board.x}, ${positions.board.y})`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('board', e)}
            >
              <image 
                href="./Arduino-Fixed.svg" 
                xlinkHref="./Arduino-Fixed.svg"
                x="0" 
                y="0" 
                width="340" 
                height="241" 
              />
              <text x="60" y="230" fontSize="8" fill="#cbd5e1" fontWeight="bold" fontFamily="sans-serif">Arduino Uno R3</text>
            </g>
          ) : board === 'BBC micro:bit' ? (
            /* BBC micro:bit Group */
            <g 
              transform={`translate(${positions.board.x}, ${positions.board.y})`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('board', e)}
            >
              {/* 1. Expansion Board (default microbit image) */}
              <image 
                href="./microbit.svg" 
                xlinkHref="./microbit.svg"
                x="0" 
                y="0" 
                width="340" 
                height="266" 
              />
              
              {/* 2. Micro:bit Board (elearning image) on top of the default image, plugged into the slot */}
              <image 
                href="./microbit.simplified.svg" 
                xlinkHref="./microbit.simplified.svg"
                x="40" 
                y="-108" 
                width="260" 
                height="212" 
              />

              {/* 3. Glowing LED Overlay */}
              {renderMicrobitLeds()}

              {/* Main Ring contact labels rendered below for high legibility */}
              <g transform="translate(0, 248)" fontSize="7.5" fill="#cbd5e1" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                <text x="115" y="0">P0</text>
                <text x="160" y="0" fill="#f43f5e">3V</text>
                <text x="205" y="0">P1</text>
                <text x="250" y="0" fill="#38bdf8">GND</text>
                <text x="295" y="0">P2</text>
              </g>
              <text x="170" y="262" fontSize="8" fill="#cbd5e1" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">BBC micro:bit</text>
            </g>
          ) : isEsp8266 ? (
            /* NodeMCU ESP8266 Board Group — Ultra High Definition nodemcu.png */
            <g 
              transform={`translate(${positions.board.x}, ${positions.board.y})`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('board', e)}
            >
              <image 
                href="./nodemcu.png" 
                xlinkHref="./nodemcu.png"
                x="0" 
                y="0" 
                width="180" 
                height="340.2" 
              />

              {/* Left Pin Header Labels (outside left pin column) */}
              <g transform="translate(8, 56)" fontSize="6.5" fill="#38bdf8" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                <text x="0" y="0">D0</text>
                <text x="0" y="15.94">D1</text>
                <text x="0" y="31.88">D2</text>
                <text x="0" y="47.82">D3</text>
                <text x="0" y="63.76">D4</text>
                <text x="0" y="79.70" fill="#f43f5e">3V3</text>
                <text x="0" y="95.64" fill="#cbd5e1">GND</text>
                <text x="0" y="111.58">D5</text>
                <text x="0" y="127.52">D6</text>
                <text x="0" y="143.46">D7</text>
                <text x="0" y="159.40">D8</text>
                <text x="0" y="175.34" fill="#34d399">RX</text>
                <text x="0" y="191.28" fill="#34d399">TX</text>
                <text x="0" y="207.22" fill="#cbd5e1">GND</text>
                <text x="0" y="223.16" fill="#f43f5e">3V3</text>
              </g>

              {/* Right Pin Header Labels (outside right pin column) */}
              <g transform="translate(172, 56)" fontSize="6.5" fill="#38bdf8" fontWeight="bold" fontFamily="monospace" textAnchor="start">
                <text x="0" y="0">A0</text>
                <text x="0" y="15.94" fill="#64748b">RSV</text>
                <text x="0" y="31.88" fill="#64748b">RSV</text>
                <text x="0" y="47.82">SD3</text>
                <text x="0" y="63.76">SD2</text>
                <text x="0" y="79.70">SD1</text>
                <text x="0" y="95.64">CMD</text>
                <text x="0" y="111.58">SD0</text>
                <text x="0" y="127.52">CLK</text>
                <text x="0" y="143.46" fill="#cbd5e1">GND</text>
                <text x="0" y="159.40" fill="#f43f5e">3V3</text>
                <text x="0" y="175.34" fill="#a855f7">EN</text>
                <text x="0" y="191.28" fill="#a855f7">RST</text>
                <text x="0" y="207.22" fill="#cbd5e1">GND</text>
                <text x="0" y="223.16" fill="#ef4444">VIN</text>
              </g>

              <text x="90" y="334" fontSize="8" fill="#cbd5e1" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">NodeMCU ESP8266</text>
            </g>
          ) : (
            /* ESP32 DevKitC V4 Group - rotated vertical layout using user SVG: 1666364456Esp32_devkitc_v4.svg */
            <g 
              transform={`translate(${positions.board.x}, ${positions.board.y})`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('board', e)}
            >
              {/* Rotates horizontal SVG (345x170) by 90deg to orient vertically with antenna at top */}
              <g transform="translate(170, 0) rotate(90)">
                <image 
                  href="./1666364456Esp32_devkitc_v4.svg" 
                  xlinkHref="./1666364456Esp32_devkitc_v4.svg"
                  x="0" 
                  y="0" 
                  width="345" 
                  height="170" 
                />
              </g>

              {/* LEFT PIN HEADERS LABELS - positioned at x=22 (next to left pin column at x=7.5) */}
              <g transform="translate(22, 48.5)" fontSize="6.5" fill="#67e8f9" fontWeight="bold" fontFamily="monospace" textAnchor="start">
                <text x="0" y="0">3V3</text>
                <text x="0" y="15.7">EN</text>
                <text x="0" y="31.4">VP</text>
                <text x="0" y="47.1">VN</text>
                <text x="0" y="62.8">34</text>
                <text x="0" y="78.5">35</text>
                <text x="0" y="94.2">32</text>
                <text x="0" y="109.9">33</text>
                <text x="0" y="125.5">25</text>
                <text x="0" y="141.2">26</text>
                <text x="0" y="156.9">27</text>
                <text x="0" y="172.6">14</text>
                <text x="0" y="188.3">12</text>
                <text x="0" y="204.0">GND</text>
                <text x="0" y="219.7">13</text>
                <text x="0" y="235.4">D2</text>
                <text x="0" y="251.1">D3</text>
                <text x="0" y="266.8">CMD</text>
                <text x="0" y="282.5">5V</text>
              </g>

              {/* RIGHT PIN HEADERS LABELS - positioned at x=150 (next to right pin column at x=162.2) */}
              <g transform="translate(150, 48.5)" fontSize="6.5" fill="#67e8f9" fontWeight="bold" fontFamily="monospace" textAnchor="end">
                <text x="0" y="0">GND</text>
                <text x="0" y="15.7">23</text>
                <text x="0" y="31.4">22</text>
                <text x="0" y="47.1">TX</text>
                <text x="0" y="62.8">RX</text>
                <text x="0" y="78.5">21</text>
                <text x="0" y="94.2">GND</text>
                <text x="0" y="109.9">19</text>
                <text x="0" y="125.5">18</text>
                <text x="0" y="141.2">5</text>
                <text x="0" y="156.9">17</text>
                <text x="0" y="172.6">16</text>
                <text x="0" y="188.3">4</text>
                <text x="0" y="204.0">0</text>
                <text x="0" y="219.7">2</text>
                <text x="0" y="235.4">15</text>
                <text x="0" y="251.1">D1</text>
                <text x="0" y="266.8">D0</text>
                <text x="0" y="282.5">CLK</text>
              </g>

              <text x="45" y="340" fontSize="8" fill="#cbd5e1" fontWeight="bold" fontFamily="sans-serif">ESP32 DevKitC V4</text>
            </g>
          )}



          {/* ==================== ACTUATORS & COMPONENTS LAYER — 3D SVG ==================== */}

          {/* A. RED LED — Multi-instance support */}
          {ledComponents.map(id => {
            const pos = positions[id] || (positions.led ?? DEFAULT_COMPONENT_POSITIONS.led);
            const rot = rotations[id] || (rotations.led ?? 0);
            const pinA = getInstancePinId(id, 'LED_A');
            const pinK = getInstancePinId(id, 'LED_K');
            const anode = getConnectedMcuPin(pinA);
            const cathode = getConnectedMcuPin(pinK);
            const isActHigh = anode !== null && cathode !== null && gndPins.includes(cathode.id) && checkLedPinMatch(anode, id);
            const isActLow = anode !== null && cathode !== null && powerPins.includes(anode.id) && !gndPins.includes(cathode.id) && checkLedPinMatch(cathode, id);
            const isWired = isActHigh || isActLow;
            const targetLed = isActLow ? cathode : anode;
            const brightness = isRunning && isWired && targetLed ? getPinBrightness(targetLed, isActLow) : 0.0;
            const label = id.includes('_') ? `LED #${id.split('_')[1]}` : 'LED';
            const compColor = getComponentColor(id, '#ef4444');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* LED Glow Halo */}
                {brightness > 0 && (
                  <>
                    <ellipse cx="100" cy="74" rx={38 + brightness * 22} ry={42 + brightness * 22}
                      fill={hexToRgba(compColor, brightness * 0.45)} className="animate-pulse" filter="url(#ledGlow)"/>
                    <circle cx="100" cy="74" r={20 + brightness * 8} fill={compColor} opacity={0.75 * brightness} filter="url(#ledGlow)" />
                  </>
                )}

                {/* Metallic Legs (always realistic silver from led.png) */}
                <g clipPath="url(#led_legs_clip)">
                  <image href="./led.png" xlinkHref="./led.png" x="0" y="0" width="200" height="200" />
                </g>

                {/* Internal Lead Frame (Cathode Anvil Cup & Anode Post connecting to metallic legs at y=140) */}
                <path d="M 112,140 L 112,88 L 118,78 L 105,78 L 108,88 L 108,140 Z" fill="#94a3b8" opacity={0.65} />
                <path d="M 88,140 L 88,88 L 93,88 L 93,140 Z" fill="#94a3b8" opacity={0.65} />
                <path d="M 91,88 Q 97,76 106,78" fill="none" stroke="#fde68a" strokeWidth="1" opacity={0.75} />
                <rect x="105" y="77" width="3.5" height="3.5" fill={brightness > 0 ? '#ffffff' : '#f8fafc'} opacity={brightness > 0 ? 1 : 0.8} />

                {/* 100% Vector Bulb Dome — Covers ENTIRE LED body down to y=140 in Selected Color */}
                <path
                  d="M 61,110 L 61,52 C 61,24 77,15 98,15 C 119,15 135,24 135,52 L 135,110 L 138,114 L 138,122 L 124,140 L 72,140 L 58,122 L 58,114 Z"
                  fill={`url(#led_body_grad_${id})`}
                  stroke={hexToRgbDarken(compColor, 0.45)}
                  strokeWidth="1.2"
                />

                {/* Active Core Illumination when ON */}
                {brightness > 0 && (
                  <ellipse cx="100" cy="74" rx={24 + brightness * 6} ry={28 + brightness * 6} fill={`url(#led_core_grad_${id})`} />
                )}

                {/* 3D Glass Specular Reflections */}
                {/* Left curved edge glossy reflection */}
                <path d="M 66,128 L 66,52 C 66,28 76,20 95,18 C 92,21 72,32 72,54 L 72,126 Z" fill="#ffffff" opacity={0.34} />
                {/* Top curvature glint */}
                <ellipse cx="94" cy="24" rx="14" ry="4.5" transform="rotate(-15, 94, 24)" fill="#ffffff" opacity={0.42} />
                {/* Flange rim highlight */}
                <rect x="60" y="114" width="76" height="2" rx="1" fill="#ffffff" opacity={0.25} />
                {/* Bottom tapered skirt reflection */}
                <line x1="74" y1="139" x2="122" y2="139" stroke="#ffffff" strokeWidth="1" opacity={0.25} />
                {/* Right edge subtle rim reflection */}
                <path d="M 131,126 L 131,54 C 131,38 125,26 115,21 C 123,27 127,38 127,54 L 127,126 Z" fill="#ffffff" opacity={0.14} />

                {/* Pin indicator dots */}
                <circle cx="80" cy="185" r="3.5" fill={isWired ? compColor : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="120" cy="185" r="3.5" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="80" y="198" fontSize="7" fill={compColor} fontWeight="bold" textAnchor="middle">A (+)</text>
                <text x="120" y="198" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">K (−)</text>

                {/* Badge label */}
                <rect x="50" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : '#6366f1'} strokeWidth="1.2"/>
                <text x="95" y="26" fontSize="8" fill={isWired ? '#34d399' : '#a5b4fc'} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna LED</title>
                  <circle cx="148" cy="23" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 110, 35)}
              </g>
            );
          })}

          {/* B. SG90 SERVO MOTOR — Multi-instance support */}
          {servoComponents.map(id => {
            const pos = positions[id] || (positions.servo ?? DEFAULT_COMPONENT_POSITIONS.servo);
            const rot = rotations[id] || (rotations.servo ?? 0);
            const pinSig = getInstancePinId(id, 'SERVO_SIG');
            const pinVcc = getInstancePinId(id, 'SERVO_VCC');
            const pinGnd = getInstancePinId(id, 'SERVO_GND');
            const sigPin = getConnectedMcuPin(pinSig);
            const vccPin = getConnectedMcuPin(pinVcc);
            const gndPin = getConnectedMcuPin(pinGnd);
            const isWired = sigPin !== null && 
                            vccPin !== null && 
                            gndPin !== null && 
                            gndPins.includes(gndPin.id) &&
                            powerPins.includes(vccPin.id) &&
                            checkServoPinMatch(sigPin, id);
            const angle = getServoAngle(sigPin, isWired);
            const label = id.includes('_') ? `Servo #${id.split('_')[1]}` : 'Servo SG90';
            const compColor = getComponentColor(id, '#3b82f6');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* Servo PNG Image */}
                <image href="./servo.png" xlinkHref="./servo.png" x="0" y="0" width="200" height="200" filter={compColor.toLowerCase() !== '#3b82f6' ? `url(#servo_tint_${id})` : undefined} />
                {compColor.toLowerCase() !== '#3b82f6' && (
                  <rect x="58" y="66" width="84" height="92" rx="6" fill={compColor} opacity={0.65} style={{ mixBlendMode: 'color' }} />
                )}

                {/* Animated Rotating SG90 Horn — Single unified horn with 4 arms and linkage holes */}
                <g transform={`translate(100, 95) rotate(${angle - 90}) translate(-100, -95)`}>
                  {/* Primary vertical double arm */}
                  <rect x="96" y="52" width="8" height="86" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" filter="url(#shadow3d)" />
                  {/* Horizontal cross arm */}
                  <rect x="72" y="91" width="56" height="8" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
                  {/* Center hub disc */}
                  <circle cx="100" cy="95" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

                  {/* Precision linkage holes on primary top arm */}
                  <circle cx="100" cy="58" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="66" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="74" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="82" r="1.3" fill="#64748b" />

                  {/* Precision linkage holes on bottom arm */}
                  <circle cx="100" cy="108" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="116" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="124" r="1.3" fill="#64748b" />
                  <circle cx="100" cy="132" r="1.3" fill="#64748b" />

                  {/* Precision linkage holes on left & right arms */}
                  <circle cx="78" cy="95" r="1.3" fill="#64748b" />
                  <circle cx="86" cy="95" r="1.3" fill="#64748b" />
                  <circle cx="114" cy="95" r="1.3" fill="#64748b" />
                  <circle cx="122" cy="95" r="1.3" fill="#64748b" />

                  {/* Directional angle pointer indicator at top arm tip */}
                  <circle cx="100" cy="58" r="2.2" fill={compColor} />

                  {/* Center retaining screw */}
                  <circle cx="100" cy="95" r="3.6" fill="#94a3b8" stroke="#64748b" strokeWidth="0.8" />
                  <line x1="97.5" y1="95" x2="102.5" y2="95" stroke="#334155" strokeWidth="0.8" />
                  <line x1="100" y1="92.5" x2="100" y2="97.5" stroke="#334155" strokeWidth="0.8" />
                </g>

                {/* Pin indicator dots directly over cable header plug (GND left:85, VCC center:100, SIG right:115) */}
                <circle cx="85" cy="20" r="3.5" fill={isWired ? "#1e293b" : "#64748b"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="100" cy="20" r="3.5" fill={isWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="115" cy="20" r="3.5" fill={isWired ? compColor : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="85" y="34" fontSize="6.5" fill="#94a3b8" fontWeight="bold" textAnchor="middle">GND</text>
                <text x="100" y="34" fontSize="6.5" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>
                <text x="115" y="34" fontSize="6.5" fill={compColor} fontWeight="bold" textAnchor="middle">SIG</text>

                {/* Badge label at BOTTOM */}
                <rect x="50" y="170" width="100" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.2"/>
                <text x="100" y="181" fontSize="8" fill={isWired ? '#34d399' : '#38bdf8'} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna Servo</title>
                  <circle cx="8" cy="23" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="25" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 22.5 23 A 3 3 0 1 1 25 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 25 24 L 25 26 L 27 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="42" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="39" y1="20" x2="45" y2="26" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="45" y1="20" x2="39" y2="26" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 8, 35)}
              </g>
            );
          })}

          {/* C. HC-SR04 ULTRASONIC — Multi-instance support */}
          {ultrasonicComponents.map(id => {
            const pos = positions[id] || (positions.ultrasonic ?? DEFAULT_COMPONENT_POSITIONS.ultrasonic);
            const rot = rotations[id] || (rotations.ultrasonic ?? 0);
            const pinVcc = getInstancePinId(id, 'SR04_VCC');
            const pinTrig = getInstancePinId(id, 'SR04_TRIG');
            const pinEcho = getInstancePinId(id, 'SR04_ECHO');
            const pinGnd = getInstancePinId(id, 'SR04_GND');
            const trigPin = getConnectedMcuPin(pinTrig);
            const echoPin = getConnectedMcuPin(pinEcho);
            const vccPin = getConnectedMcuPin(pinVcc);
            const gndPin = getConnectedMcuPin(pinGnd);
            const isPowerOk = vccPin !== null && gndPin !== null && gndPins.includes(gndPin.id) && powerPins.includes(vccPin.id);
            const isWired = isPowerOk && !!trigPin && !!echoPin;
            const label = id.includes('_') ? `HC-SR04 #${id.split('_')[1]}` : 'HC-SR04';
            const compColor = getComponentColor(id, '#06b6d4');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* Ultrasonic PNG Image */}
                <image
                  href="./sensorUltrasonicDistance4Pin.png"
                  xlinkHref="./sensorUltrasonicDistance4Pin.png"
                  x="0"
                  y="0"
                  width="200"
                  height="200"
                />

                {/* Pin indicator dots & highlights */}
                <circle cx="84" cy="157" r="3.5" fill={isWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="94" cy="157" r="3.5" fill={isWired ? "#10b981" : "#6ee7b7"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="105" cy="157" r="3.5" fill={isWired ? "#f59e0b" : "#fcd34d"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="115" cy="157" r="3.5" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="84" y="174" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>
                <text x="94" y="174" fontSize="7" fill="#10b981" fontWeight="bold" textAnchor="middle">TRIG</text>
                <text x="105" y="174" fontSize="7" fill="#f59e0b" fontWeight="bold" textAnchor="middle">ECHO</text>
                <text x="115" y="174" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>

                {/* Component Label */}
                <rect x="50" y="32" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.2"/>
                <text x="95" y="43" fontSize="8.5" fill={isWired ? '#34d399' : compColor} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna Ultrasonic</title>
                  <circle cx="148" cy="45" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>

                {/* Rotate button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="165" cy="45" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 162.5 45 A 3 3 0 1 1 165 48" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 165 46 L 165 48 L 167 48" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>

                {/* Delete button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="182" cy="45" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="179" y1="42" x2="185" y2="48" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="185" y1="42" x2="179" y2="48" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 110, 57)}
              </g>
            );
          })}

          {/* D. ROTARY POTENTIOMETER — Multi-instance support */}
          {potComponents.map(id => {
            const pos = positions[id] || (positions.pot ?? DEFAULT_COMPONENT_POSITIONS.pot);
            const rot = rotations[id] || (rotations.pot ?? 0);
            const pinVcc = getInstancePinId(id, 'POT_VCC');
            const pinSig = getInstancePinId(id, 'POT_SIG');
            const pinGnd = getInstancePinId(id, 'POT_GND');
            const sigPin = getConnectedMcuPin(pinSig);
            const vccPin = getConnectedMcuPin(pinVcc);
            const gndPin = getConnectedMcuPin(pinGnd);
            const isWired = sigPin !== null && 
                            vccPin !== null && 
                            gndPin !== null && 
                            gndPins.includes(gndPin.id) && 
                            powerPins.includes(vccPin.id) &&
                            checkPotWiring(id);
            const currentVal = id === 'pot' ? potValue : (extraPotValues[id] ?? potValue);
            const label = id.includes('_') ? `Potentiometer #${id.split('_')[1]}` : 'Potentiometer';
            const compColor = getComponentColor(id, '#10b981');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* Potentiometer PNG Image */}
                <image href="./potentiometer.png" xlinkHref="./potentiometer.png" x="0" y="0" width="200" height="200" />

                {/* Pin indicator dots at bottom */}
                <circle cx="50" cy="150" r="3.5" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="100" cy="150" r="3.5" fill={isWired ? compColor : "#c4b5fd"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="150" cy="150" r="3.5" fill={isWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="50" y="165" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>
                <text x="100" y="165" fontSize="7" fill={compColor} fontWeight="bold" textAnchor="middle">SIG</text>
                <text x="150" y="165" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>

                {/* Knob indicator dot rotating over center (100, 80) */}
                <line
                  x1="100" y1="80"
                  x2={100 + Math.cos(((currentVal - 50) * 2.6 - 90) * Math.PI / 180) * 14}
                  y2={80 + Math.sin(((currentVal - 50) * 2.6 - 90) * Math.PI / 180) * 14}
                  stroke={compColor} strokeWidth="3" strokeLinecap="round"
                />

                {/* Value display */}
                <rect x="75" y="170" width="50" height="14" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke={compColor} strokeWidth="1"/>
                <text x="100" y="180" fontSize="7.5" fill={compColor} textAnchor="middle" fontWeight="bold">{currentVal}%</text>

                {/* Slider */}
                <foreignObject x="35" y="186" width="130" height="14" onMouseDown={e => e.stopPropagation()}>
                  <input
                    type="range" min="0" max="100" value={currentVal}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (id === 'pot') {
                        setPotValue(v);
                      } else {
                        setExtraPotValues(prev => ({ ...prev, [id]: v }));
                      }
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </foreignObject>

                {/* Badge label */}
                <rect x="50" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.2"/>
                <text x="95" y="26" fontSize="8" fill={isWired ? '#34d399' : compColor} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna Potentiometer</title>
                  <circle cx="148" cy="23" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 110, 35)}
              </g>
            );
          })}

          {/* E. TACTILE PUSH BUTTON — Multi-instance support */}
          {buttonComponents.map(id => {
            const pos = positions[id] || (positions.button ?? DEFAULT_COMPONENT_POSITIONS.button);
            const rot = rotations[id] || (rotations.button ?? 0);
            const pinSig = getInstancePinId(id, 'BTN_SIG');
            const pinGnd = getInstancePinId(id, 'BTN_GND');
            const sigPin = getConnectedMcuPin(pinSig);
            const gndPin = getConnectedMcuPin(pinGnd);
            const isWired = sigPin !== null && gndPin !== null && gndPins.includes(gndPin.id) && checkBtnWiring(id);
            const isPressed = id === 'button' ? buttonPressed : (pressedButtons[id] || false);
            const contactLabel = id.startsWith('button_reed') ? 'Reed switch' : id.startsWith('button_limit') ? 'Limit switch' : id.startsWith('button_tilt') ? 'Tilt switch' : '';
            const label = contactLabel || (id.includes('_') ? `Button #${id.split('_')[1]}` : 'Button');
            const compColor = getComponentColor(id, '#eab308');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 60, 60)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* Push Button PNG Image */}
                {contactLabel ? <g><rect x="12" y="25" width="96" height="70" rx="10" fill="#12354a"/><path d={isPressed ? 'M35 70 H85' : 'M35 70 L70 48 M78 70 H85'} stroke="white" strokeWidth="4"/><text x="60" y="42" textAnchor="middle" fill="white" fontSize="11">{contactLabel}</text></g> : <image href="./pushButton.png" xlinkHref="./pushButton.png" x="0" y="0" width="120" height="120" />}

                {/* Pin indicator dots */}
                <circle cx="35" cy="95" r="3" fill={isWired ? compColor : "#fef08a"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="85" cy="95" r="3" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="35" y="108" fontSize="6.5" fill={compColor} fontWeight="bold" textAnchor="middle">SIG</text>
                <text x="85" y="108" fontSize="6.5" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>

                {/* Clickable button cap trigger overlay with dynamic custom color */}
                <circle
                  cx="60" cy="55" r="16"
                  fill={compColor}
                  opacity={isPressed ? 0.95 : 0.8}
                  stroke={isPressed ? "#ffffff" : hexToRgba(compColor, 0.5)}
                  strokeWidth={isPressed ? "2" : "1"}
                  className="cursor-pointer"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (id === 'button') {
                      setButtonPressed(true);
                    } else {
                      setPressedButtons(prev => ({ ...prev, [id]: true }));
                    }
                    const btnPin = getConnectedMcuPin(pinSig);
                    if (btnPin && onPinStateChange) {
                      const numMatch = btnPin.id.match(/\d+/);
                      const pinKey = numMatch ? numMatch[0] : btnPin.id;
                      onPinStateChange(pinKey, 'HIGH');
                      onPinStateChange(btnPin.id, 'HIGH');
                    }
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    if (id === 'button') {
                      setButtonPressed(false);
                    } else {
                      setPressedButtons(prev => ({ ...prev, [id]: false }));
                    }
                    const btnPin = getConnectedMcuPin(pinSig);
                    if (btnPin && onPinStateChange) {
                      const numMatch = btnPin.id.match(/\d+/);
                      const pinKey = numMatch ? numMatch[0] : btnPin.id;
                      onPinStateChange(pinKey, 'LOW');
                      onPinStateChange(btnPin.id, 'LOW');
                    }
                  }}
                  onMouseLeave={() => {
                    if (id === 'button' ? buttonPressed : (pressedButtons[id] || false)) {
                      if (id === 'button') {
                        setButtonPressed(false);
                      } else {
                        setPressedButtons(prev => ({ ...prev, [id]: false }));
                      }
                      const btnPin = getConnectedMcuPin(pinSig);
                      if (btnPin && onPinStateChange) {
                        const numMatch = btnPin.id.match(/\d+/);
                        const pinKey = numMatch ? numMatch[0] : btnPin.id;
                        onPinStateChange(pinKey, 'LOW');
                        onPinStateChange(btnPin.id, 'LOW');
                      }
                    }
                  }}
                />

                {/* Badge label */}
                <rect x="15" y="8" width="72" height="14" rx="3" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1"/>
                <text x="51" y="18" fontSize="7" fill={isWired ? '#34d399' : compColor} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna Tombol</title>
                  <circle cx="90" cy="15" r="5.5" fill={compColor} stroke="#ffffff" strokeWidth="0.8"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="102" cy="15" r="5.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                  <path d="M 100 15 A 2 2 0 1 1 102 17" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round"/>
                  <path d="M 102 15.5 L 102 17 L 103.5 17" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="114" cy="15" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                  <line x1="112" y1="13" x2="116" y2="17" stroke="#fff" strokeWidth="1"/>
                  <line x1="116" y1="13" x2="112" y2="17" stroke="#fff" strokeWidth="1"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 20, 25)}
              </g>
            );
          })}

          {/* F. LCD DISPLAY 16x2 I2C — Multi-instance support */}
          {lcdComponents.map(id => {
            const pos = positions[id] || (positions.lcd ?? DEFAULT_COMPONENT_POSITIONS.lcd);
            const rot = rotations[id] || (rotations.lcd ?? 0);
            const pinGnd = getInstancePinId(id, 'LCD_GND');
            const pinVcc = getInstancePinId(id, 'LCD_VCC');
            const pinSda = getInstancePinId(id, 'LCD_SDA');
            const pinScl = getInstancePinId(id, 'LCD_SCL');
            const gndPin = getConnectedMcuPin(pinGnd);
            const vccPin = getConnectedMcuPin(pinVcc);
            const sdaPin = getConnectedMcuPin(pinSda);
            const sclPin = getConnectedMcuPin(pinScl);
            const isWired = !!gndPin && !!vccPin && !!sdaPin && !!sclPin && gndPins.includes(gndPin.id) && powerPins.includes(vccPin.id);
            const label = id.includes('_') ? `LCD #${id.split('_')[1]}` : 'LCD 16x2 I2C';
            const compColor = getComponentColor(id, '#0284c7');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* LCD PNG Image */}
                <image href="./displayLCD16x2I2C.png" xlinkHref="./displayLCD16x2I2C.png" x="0" y="0" width="200" height="200" />

                {/* Dynamic LCD Screen Content Overlay with Custom Color Backlight */}
                <rect x="52" y="80" width="96" height="34" rx="2" fill={hexToRgba(compColor, 0.25)} stroke={compColor} strokeWidth="1" />
                <text x="56" y="93" fontSize="6.5" fill={compColor === '#ffffff' ? '#ffffff' : '#93c5fd'} fontWeight="bold" fontFamily="monospace">
                  {isRunning ? (isUltrasonicWired || isPotWired || isDhtWired ? `TEMP: ${currentTemp}C` : 'NO WIRES!') : 'SYSTEM IDLE'}
                </text>
                <text x="56" y="107" fontSize="6.5" fill={compColor === '#ffffff' ? '#ffffff' : '#93c5fd'} fontWeight="bold" fontFamily="monospace">
                  {isRunning ? (isUltrasonicWired || isPotWired || isDhtWired ? `DIST: ${currentDistance}CM` : 'CONNECT PINS') : 'READY TO WIRE'}
                </text>
                {isRunning && <rect x="16" y="53" width="4" height="6" fill={compColor} opacity="0.7" className="animate-pulse"/>}

                {/* Pin indicator dots on I2C module (left side) */}
                <circle cx="22" cy="68" r="3" fill={isWired ? "#10b981" : "#6ee7b7"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="22" cy="82" r="3" fill={isWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="22" cy="96" r="3" fill={isWired ? "#a78bfa" : "#c4b5fd"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="22" cy="110" r="3" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="12" y="70" fontSize="5.5" fill="#10b981" fontWeight="bold" textAnchor="end">GND</text>
                <text x="12" y="84" fontSize="5.5" fill="#ef4444" fontWeight="bold" textAnchor="end">VCC</text>
                <text x="12" y="98" fontSize="5.5" fill="#a78bfa" fontWeight="bold" textAnchor="end">SDA</text>
                <text x="12" y="112" fontSize="5.5" fill="#3b82f6" fontWeight="bold" textAnchor="end">SCL</text>

                {/* Badge label */}
                <rect x="50" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.2"/>
                <text x="95" y="26" fontSize="8" fill={isWired ? '#34d399' : compColor} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna LCD</title>
                  <circle cx="148" cy="23" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 110, 35)}
              </g>
            );
          })}

          {/* G. DHT11 TEMP/HUMIDITY SENSOR — Multi-instance support */}
          {dht11Components.map(id => {
            const pos = positions[id] || (positions.dht11 ?? DEFAULT_COMPONENT_POSITIONS.dht11);
            const rot = rotations[id] || (rotations.dht11 ?? 0);
            const pinData = getInstancePinId(id, 'DHT11_DATA');
            const pinVcc = getInstancePinId(id, 'DHT11_VCC');
            const pinGnd = getInstancePinId(id, 'DHT11_GND');
            const dataPin = getConnectedMcuPin(pinData);
            const vccPin = getConnectedMcuPin(pinVcc);
            const gndPin = getConnectedMcuPin(pinGnd);
            const isWired = !!dataPin && !!vccPin && !!gndPin && gndPins.includes(gndPin.id) && powerPins.includes(vccPin.id);
            const label = id.includes('_') ? `DHT11 #${id.split('_')[1]}` : 'DHT11 Sensor';
            const compColor = getComponentColor(id, '#3b82f6');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 45, 60)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* 3D board depth — bottom face */}
                <polygon points="0,120 90,120 96,126 6,126" fill="#011b2e" opacity="0.9"/>
                {/* 3D board depth — right face */}
                <polygon points="90,0 96,6 96,126 90,120" fill="#012b4a" opacity="0.9"/>
                {/* Main PCB face */}
                <rect x="0" y="0" width="90" height="120" rx="5" fill="url(#pcbBlueGrad)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.5"/>
                {/* PCB surface highlight */}
                <rect x="2" y="2" width="86" height="18" rx="3" fill="rgba(255,255,255,0.06)"/>
                {/* Label */}
                <text x="8" y="13" fontSize="7.5" fill={isWired ? '#34d399' : compColor} fontWeight="bold">
                  {isWired ? `✔ ${label}` : label}
                </text>
                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna DHT11</title>
                  <circle cx="58" cy="8" r="5" fill={compColor} stroke="#ffffff" strokeWidth="0.8"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="71" cy="8" r="5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                  <path d="M 69 8 A 2 2 0 1 1 71 10" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round"/>
                  <path d="M 71 8.5 L 71 10 L 72.5 10" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <circle cx="83" cy="8" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                  <line x1="81" y1="6" x2="85" y2="10" stroke="#fff" strokeWidth="1.2"/>
                  <line x1="85" y1="6" x2="81" y2="10" stroke="#fff" strokeWidth="1.2"/>
                </g>

                {/* Sensor Case Tint */}
                <rect x="5" y="22" width="80" height="72" rx="5" fill={hexToRgba(compColor, 0.4)} stroke={compColor} strokeWidth="1.5"/>
                <rect x="7" y="24" width="76" height="8" rx="3" fill="rgba(255,255,255,0.15)"/>
                <rect x="12" y="34" width="66" height="44" rx="3" fill="#082f49" stroke={compColor} strokeWidth="1"/>
                <rect x="15" y="38" width="60" height="4" rx="1" fill={compColor} opacity="0.6"/>
                <rect x="15" y="46" width="60" height="4" rx="1" fill={compColor} opacity="0.6"/>
                <rect x="15" y="54" width="60" height="4" rx="1" fill={compColor} opacity="0.6"/>
                <rect x="15" y="62" width="60" height="4" rx="1" fill={compColor} opacity="0.6"/>
                <rect x="15" y="70" width="60" height="4" rx="1" fill={compColor} opacity="0.6"/>
                <line x1="33" y1="34" x2="33" y2="78" stroke={compColor} strokeWidth="0.8" opacity="0.6"/>
                <line x1="57" y1="34" x2="57" y2="78" stroke={compColor} strokeWidth="0.8" opacity="0.6"/>
                <text x="45" y="92" fontSize="9" fill="#ffffff" textAnchor="middle" fontWeight="bold">DHT11</text>
                <rect x="13" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
                <rect x="33" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
                <rect x="53" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
                <rect x="73" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
                <text x="9" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">VCC</text>
                <text x="29" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">DAT</text>
                <text x="50" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">NC</text>
                <text x="69" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">GND</text>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 5, 20)}
              </g>
            );
          })}

          {/* H. DC MOTOR — Multi-instance support */}
          {motorComponents.map(id => {
            const pos = positions[id] || (positions.motor ?? DEFAULT_COMPONENT_POSITIONS.motor);
            const rot = rotations[id] || (rotations.motor ?? 0);
            const isWired = checkMotorWiring(id);
            const label = id.includes('_') ? `DC Motor #${id.split('_')[1]}` : 'DC Motor';
            const compColor = getComponentColor(id, '#f97316');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 100, 100)`}
                className="cursor-move"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* DC Motor PNG Image */}
                <image href="./motorDC.png" xlinkHref="./motorDC.png" x="0" y="0" width="200" height="200" />

                {/* Spinning Propeller Fan Overlay when Motor is Running */}
                {isRunning && isWired && (
                  <g transform="translate(100, 45)" className="animate-spin" style={{ transformOrigin: '100px 45px', animationDuration: '0.3s' }}>
                    <circle cx="100" cy="45" r="6" fill={compColor} />
                    <ellipse cx="100" cy="30" rx="4" ry="15" fill={compColor} opacity="0.85" />
                    <ellipse cx="100" cy="60" rx="4" ry="15" fill={compColor} opacity="0.85" />
                    <ellipse cx="85" cy="45" rx="15" ry="4" fill={compColor} opacity="0.85" />
                    <ellipse cx="115" cy="45" rx="15" ry="4" fill={compColor} opacity="0.85" />
                  </g>
                )}

                {/* Pin indicator dots at bottom terminals */}
                <circle cx="78" cy="185" r="3.5" fill={isWired ? compColor : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="122" cy="185" r="3.5" fill={isWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

                {/* Pin labels */}
                <text x="78" y="198" fontSize="7" fill={compColor} fontWeight="bold" textAnchor="middle">POS (+)</text>
                <text x="122" y="198" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">NEG (−)</text>

                {/* Badge label */}
                <rect x="50" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isWired ? '#34d399' : compColor} strokeWidth="1.2"/>
                <text x="95" y="26" fontSize="8" fill={isWired ? '#34d399' : compColor} fontWeight="bold" textAnchor="middle">
                  {isWired ? `✔ ${label}` : label}
                </text>

                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna Motor</title>
                  <circle cx="148" cy="23" r="7" fill={compColor} stroke="#ffffff" strokeWidth="1.2"/>
                </g>
                {/* Rotate */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Rotate Component</title>
                  <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                  <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                  <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                {/* Delete */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Remove Component</title>
                  <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                  <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                  <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
                </g>

                {/* Color Popover */}
                {renderColorPickerPopover(id, 110, 35)}
              </g>
            );
          })}

          {/* I. RC522 RFID READER — Multi-instance support */}
          {rfidComponents.map(id => {
            const pos = positions[id] || (positions.rfid ?? DEFAULT_COMPONENT_POSITIONS.rfid);
            const rot = rotations[id] || (rotations.rfid ?? 0);
            const label = id.includes('_') ? `RFID #${id.split('_')[1]}` : 'RFID-RC522';
            const compColor = getComponentColor(id, '#8b5cf6');

            return (
              <g
                key={id}
                transform={`translate(${pos.x}, ${pos.y}) rotate(${rot}, 55, 80)`}
                className="cursor-move select-none"
                onMouseDown={(e) => startDrag(id, e)}
                onClick={() => setActivePopup(id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleRotateComponent(id);
                }}
                filter="url(#shadow3d)"
              >
                {/* Rotate Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRotateComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <circle cx="8" cy="8" r="5.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                  <path d="M6 8a2 2 0 1 1 2 2M6 8l1.5-1M6 8l1.5 1" stroke="#fff" strokeWidth="0.9" fill="none"/>
                </g>
                {/* Color Button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerOpenId(prev => prev === id ? null : id); }} onMouseDown={e => e.stopPropagation()}>
                  <title>Ganti Warna RFID</title>
                  <circle cx="22" cy="8" r="5.5" fill={compColor} stroke="#ffffff" strokeWidth="0.8"/>
                </g>
                {/* Delete button */}
                <g className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleRemoveComponent(id); }} onMouseDown={e => e.stopPropagation()}>
                  <circle cx="102" cy="8" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                  <line x1="100" y1="6" x2="104" y2="10" stroke="#fff" strokeWidth="1.2"/>
                  <line x1="104" y1="6" x2="100" y2="10" stroke="#fff" strokeWidth="1.2"/>
                </g>

                {/* PCB Base: Classic blue FR-4 (110x150, rx=6) */}
                <rect x="0" y="16" width="110" height="136" rx="6" fill="#1e3a8a" stroke={compColor} strokeWidth="1.5"/>
                <rect x="2" y="18" width="106" height="132" rx="5" fill={hexToRgba(compColor, 0.15)} stroke={compColor} strokeWidth="0.8" opacity="0.6"/>

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
          {catalogParts.map(id => {
            const tag = getBaseComponentType(id);
            const pos = positions[id] || { x: 50, y: 420 };
            return <g key={id} className="cursor-move" aria-label={wokwiPartName(tag)}
              transform={`translate(${pos.x}, ${pos.y}) rotate(${rotations[id] || 0}, ${wokwiPartWidth / 2}, ${wokwiPartHeight / 2})`}
              onMouseDown={event => startDrag(id, event)}
              onContextMenu={event => { event.preventDefault(); handleRotateComponent(id); }}>
              <rect width={wokwiPartWidth} height={wokwiPartHeight} rx="8" fill="transparent" pointerEvents="all" />
              <WokwiPart id={id} tag={tag} onPins={updateWokwiPins} />
            </g>;
          })}

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
          <div className="simulator-wire-notice absolute bottom-2.5 left-2.5 right-2.5 bg-sky-950/90 text-sky-300 text-[9px] px-2.5 py-1.5 rounded-md border border-sky-900/60 shadow flex items-center justify-between z-30 font-semibold select-none animate-pulse">
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
            if (basePopup.startsWith('wokwi-')) return wokwiPartName(basePopup);
            return `${activePopup.toUpperCase()}${instanceSuffix}`;
          };

          return (
            <div className="simulator-component-popup absolute top-2 left-2 z-40 bg-slate-900/95 border border-slate-750 p-3 rounded-xl shadow-2xl w-48 text-white select-none animate-in fade-in zoom-in-95 duration-100">
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

        {/* Wi-Fi uses the active network of the device running the simulator. */}
        {(isEsp8266 || board.toLowerCase().includes('esp32')) && (
          <section className={`space-y-3 rounded-2xl border p-3.5 ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f131f] border-slate-800'}`}>
            <h3 className="flex items-center gap-2 text-xs font-bold"><Wifi className="h-4 w-4" /> Wi-Fi simulator</h3>
            <p className="text-xs">Simulator memakai jaringan aktif perangkat. Pilih hotspot lewat pengaturan Wi-Fi perangkat, lalu aktifkan jaringan simulator.</p>
            <button type="button" disabled={checkingNetwork} onClick={handleWifiConnectToggle}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-60 ${isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'}`}>
              {checkingNetwork ? 'Memeriksa koneksi…' : isWifiConnected ? 'Putuskan jaringan simulator' : 'Aktifkan jaringan simulator'}
            </button>
            <p role="status" className="text-xs">{networkError || (isWifiConnected ? 'Jaringan simulator aktif. Jalankan program untuk menguji alamat tujuan.' : 'Jaringan simulator belum aktif.')}</p>
          </section>
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
          
          <label className="block space-y-1 text-xs">
            <span className="font-semibold">Cari komponen Wokwi</span>
            <input type="search" value={partSearch} onChange={event => setPartSearch(event.target.value)}
              placeholder="Misalnya resistor atau LCD"
              className={`w-full rounded-lg border px-3 py-2 ${isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-950'}`} />
          </label>
          <div className="relative">
            <select
              aria-label="Tambah komponen"
              value=""
              onChange={(e) => {
                handleAddComponent(e.target.value);
                e.target.value = ""; 
              }}
              className={`w-full text-[11px] font-bold border rounded-lg pl-3 pr-8 py-2.5 outline-none cursor-pointer hover:border-indigo-400 transition-colors appearance-none shadow-sm ${isLight ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-[#090b12] text-slate-200 border-slate-700/80'}`}
            >
              <option value="" disabled className={isLight ? 'bg-white text-slate-500' : 'bg-[#0f131f] text-slate-400'}>Tambah komponen</option>
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
              <optgroup label="Katalog aset Wokwi · visual rangkaian" disabled={!matchingWokwiParts.length}>
                {!matchingWokwiParts.length && <option>Tidak ada aset Wokwi yang cocok</option>}
                {matchingWokwiParts.map(tag => <option key={tag} value={tag}>{wokwiPartName(tag)}</option>)}
              </optgroup>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>

          <p className="text-[10px]">Aset Wokwi dapat dipasang dan dikabelkan sesuai pin yang tersedia. Gunakan komponen bawaan untuk simulasi perilaku program. <a href="/wokwi-elements-LICENSE.txt" target="_blank" rel="noreferrer" className="underline">Lisensi Wokwi Elements</a></p>

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
