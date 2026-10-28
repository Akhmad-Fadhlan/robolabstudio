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
  servoPin?: string;
  ultrasonicTrigPin?: string;
  ultrasonicEchoPin?: string;
  potPin?: string;
  btnPin?: string;
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
  const [localSimMode, setLocalSimMode] = useState<'robot' | 'circuit'>('robot');
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
    compType: string,
    relX: number,
    relY: number,
    centerX: number,
    centerY: number
  ) => {
    const angle = rotations[compType] || 0;
    const posX = positions[compType]?.x ?? 0;
    const posY = positions[compType]?.y ?? 0;
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
        setWifiNetworks(['Wokwi-GUEST', 'Simulator-Net']);
        setSelectedWifi('Wokwi-GUEST');
        setIsScanningWifi(false);
      }
    };
    fetchWifi();
  }, []);

  const handleWifiConnectToggle = () => {
    const nextState = !isWifiConnected;
    setIsWifiConnected(nextState);
    if (nextState) {
      localStorage.setItem('simulatorWifiSSID', selectedWifi);
      localStorage.setItem('simulatorWifiPwd', wifiPassword);
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

    console.log('[Simulator] parsed final frames:', finalFrames.length);
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
    setActiveComponents(prev => {
      const merged = [...prev];
      detected.forEach(c => { if (!merged.includes(c)) merged.push(c); });
      return merged;
    });

    const autoWires: Wire[] = [];
    const hasLed = detected.includes('led');
    const hasServo = detected.includes('servo');
    const hasUltrasonic = detected.includes('ultrasonic');
    const hasPot = detected.includes('pot');
    const hasButton = detected.includes('button');
    const hasMotor = detected.includes('motor');

    const getMcuPinId = (type: 'digital' | 'analog', programPin: string | undefined, defaultNum: string): string => {
      if (isArduino) {
        const prefix = type === 'analog' ? 'A' : 'D';
        return programPin ? `${prefix}${programPin}` : `${prefix}${defaultNum}`;
      } else if (isMicrobit) {
        return programPin ? `P${programPin}` : `P${defaultNum}`;
      } else if (isEsp8266) {
        if (type === 'analog') return 'A0';
        if (!programPin) return `D${defaultNum}`;
        return programPin.startsWith('D') ? programPin : (programPin.startsWith('G') ? programPin.replace('G', 'D') : `D${programPin}`);
      } else {
        return programPin ? `G${programPin}` : `G${defaultNum}`;
      }
    };

    const gndPin = isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_L'));
    const vccPin = isArduino ? '5V' : (isMicrobit ? 'PAD_3V' : (isEsp8266 ? '3V3_R' : '3V3'));

    if (hasLed) {
      const pin = getMcuPinId('digital', programPins?.ledPin, isArduino ? '9' : (isMicrobit ? '2' : (isEsp8266 ? '4' : '2')));
      autoWires.push({ from: pin, to: 'LED_A', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'LED_K', color: '#1e293b', bendPoints: [] });
    }
    if (hasServo) {
      const pin = getMcuPinId('digital', programPins?.servoPin, isArduino ? '3' : (isMicrobit ? '1' : (isEsp8266 ? '2' : '18')));
      autoWires.push({ from: pin, to: 'SERVO_SIG', color: '#3b82f6', bendPoints: [] });
      autoWires.push({ from: vccPin, to: 'SERVO_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_R')), to: 'SERVO_GND', color: '#1e293b', bendPoints: [] });
    }
    if (hasUltrasonic) {
      const trig = getMcuPinId('digital', programPins?.ultrasonicTrigPin, isArduino ? '12' : (isMicrobit ? '8' : (isEsp8266 ? '5' : '23')));
      const echo = getMcuPinId('digital', programPins?.ultrasonicEchoPin, isArduino ? '13' : (isMicrobit ? '9' : (isEsp8266 ? '6' : '22')));
      autoWires.push({ from: vccPin, to: 'SR04_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: trig, to: 'SR04_TRIG', color: '#10b981', bendPoints: [] });
      autoWires.push({ from: echo, to: 'SR04_ECHO', color: '#f59e0b', bendPoints: [] });
      autoWires.push({ from: isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_R')), to: 'SR04_GND', color: '#1e293b', bendPoints: [] });
    }
    if (hasPot) {
      const pin = getMcuPinId('analog', programPins?.potPin, isArduino ? '0' : (isMicrobit ? '0' : (isEsp8266 ? '0' : '26')));
      autoWires.push({ from: vccPin, to: 'POT_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin, to: 'POT_SIG', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'POT_GND', color: '#1e293b', bendPoints: [] });
    }
    if (hasButton) {
      const pin = getMcuPinId('digital', programPins?.btnPin, isArduino ? '2' : (isMicrobit ? '1' : (isEsp8266 ? '3' : '27')));
      autoWires.push({ from: pin, to: 'BTN_SIG', color: '#eab308', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'BTN_GND', color: '#1e293b', bendPoints: [] });
    }
    if (detected.includes('dht11')) {
      const pin = getMcuPinId('digital', undefined, isArduino ? '4' : (isMicrobit ? '4' : (isEsp8266 ? '7' : '4')));
      autoWires.push({ from: vccPin, to: 'DHT11_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin, to: 'DHT11_DATA', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'DHT11_GND', color: '#1e293b', bendPoints: [] });
    }
    if (detected.includes('lcd')) {
      const sdaPin = isArduino ? 'A4' : (isMicrobit ? 'P20' : (isEsp8266 ? 'D2' : 'G21'));
      const sclPin = isArduino ? 'A5' : (isMicrobit ? 'P19' : (isEsp8266 ? 'D1' : 'G22'));
      autoWires.push({ from: gndPin, to: 'LCD_GND', color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: vccPin, to: 'LCD_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: sdaPin, to: 'LCD_SDA', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: sclPin, to: 'LCD_SCL', color: '#3b82f6', bendPoints: [] });
    }
    if (hasMotor) {
      const pin = getMcuPinId('digital', undefined, isArduino ? '5' : (isMicrobit ? '5' : (isEsp8266 ? '1' : '5')));
      autoWires.push({ from: pin, to: 'MOTOR_POS', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'MOTOR_NEG', color: '#1e293b', bendPoints: [] });
    }
    if (detected.includes('rfid')) {
      const sdaPin = isArduino ? 'D10' : (isMicrobit ? 'P16' : (isEsp8266 ? 'D8' : 'G5'));
      const sckPin = isArduino ? 'D13' : (isMicrobit ? 'P13' : (isEsp8266 ? 'D5' : 'G18'));
      const mosiPin = isArduino ? 'D11' : (isMicrobit ? 'P15' : (isEsp8266 ? 'D7' : 'G23'));
      const misoPin = isArduino ? 'D12' : (isMicrobit ? 'P14' : (isEsp8266 ? 'D6' : 'G19'));
      const rstPin = isArduino ? 'D9' : (isMicrobit ? 'P8' : (isEsp8266 ? 'D4' : 'G22'));
      const p3v3Pin = isArduino ? '3V3' : (isMicrobit ? 'PAD_3V' : (isEsp8266 ? '3V3_R' : '3V3'));
      autoWires.push({ from: sdaPin, to: 'RFID_SDA', color: '#06b6d4', bendPoints: [] });
      autoWires.push({ from: sckPin, to: 'RFID_SCK', color: '#3b82f6', bendPoints: [] });
      autoWires.push({ from: mosiPin, to: 'RFID_MOSI', color: '#10b981', bendPoints: [] });
      autoWires.push({ from: misoPin, to: 'RFID_MISO', color: '#eab308', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'RFID_GND', color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: rstPin, to: 'RFID_RST', color: '#8b5cf6', bendPoints: [] });
      autoWires.push({ from: p3v3Pin, to: 'RFID_3V3', color: '#f43f5e', bendPoints: [] });
    }

    // Merge autoWires with any existing manually-placed wires (preserve manual connections)
    setWires(prev => {
      const componentPins = [
        'LED_A', 'LED_K',
        'SERVO_SIG', 'SERVO_VCC', 'SERVO_GND',
        'SR04_VCC', 'SR04_TRIG', 'SR04_ECHO', 'SR04_GND',
        'POT_VCC', 'POT_SIG', 'POT_GND',
        'BTN_SIG', 'BTN_GND',
        'DHT11_VCC', 'DHT11_DATA', 'DHT11_GND',
        'LCD_GND', 'LCD_VCC', 'LCD_SDA', 'LCD_SCL',
        'RFID_SDA', 'RFID_SCK', 'RFID_MOSI', 'RFID_MISO', 'RFID_IRQ', 'RFID_GND', 'RFID_RST', 'RFID_3V3'
      ];

      const autoTargetComponentPins = new Set<string>();
      autoWires.forEach(w => {
        if (componentPins.includes(w.from)) autoTargetComponentPins.add(w.from);
        if (componentPins.includes(w.to)) autoTargetComponentPins.add(w.to);
      });

      const existingKept = prev.filter(w => {
        const connectsToAutoTarget = autoTargetComponentPins.has(w.from) || autoTargetComponentPins.has(w.to);
        return !connectsToAutoTarget;
      });

      return [...existingKept, ...autoWires];
    });
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

  // Determine active components
  const hasServo = activeComponents.includes('servo');
  const hasUltrasonic = activeComponents.includes('ultrasonic') || activeComponents.includes('hcsr') || activeComponents.includes('hcsr04');
  const hasLed = activeComponents.includes('led');
  const hasPot = activeComponents.includes('pot');
  const hasButton = activeComponents.includes('button');
  const hasLcd = activeComponents.includes('lcd');
  const hasMotor = activeComponents.includes('motor') || activeComponents.includes('dc_motor') || activeComponents.includes('motordc');
  const hasDht11 = activeComponents.includes('dht11') || activeComponents.includes('dht');
  const hasRfid = activeComponents.includes('rfid') || activeComponents.includes('mfrc522') || activeComponents.includes('rc522');

  const checkMotorWiring = (): boolean => {
    const posWire = wires.find(w => w.to === 'MOTOR_POS' || w.from === 'MOTOR_POS');
    const negWire = wires.find(w => w.to === 'MOTOR_NEG' || w.from === 'MOTOR_NEG');
    return !!posWire && !!negWire;
  };
  const isMotorWired = checkMotorWiring();

  const gndPins = [
    'GND', 'GND_L', 'GND_R', 'GND_T', 'GND_B', 'PAD_GND', 'GND_M', 'G_M', 'GND_L2', 'GND_R2',
    ...Array.from({ length: 21 }, (_, i) => `G${i}`)
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
    if (hasLed) {
      const ledA = getRotatedPinCoords('led', 80, 185, 100, 100);
      const ledK = getRotatedPinCoords('led', 120, 185, 100, 100);
      componentPins.push(
        { id: 'LED_A', name: 'LED Anode (+)',    cx: ledA.cx, cy: ledA.cy, type: 'component' },
        { id: 'LED_K', name: 'LED Cathode (-)',  cx: ledK.cx, cy: ledK.cy, type: 'component' }
      );
    }
    
    // Servo Pins (size 200x200, center 100x100) — GND left (85), VCC center (100), SIG right (115) over header cable
    if (hasServo) {
      const gnd = getRotatedPinCoords('servo', 85, 20, 100, 100);
      const vcc = getRotatedPinCoords('servo', 100, 20, 100, 100);
      const sig = getRotatedPinCoords('servo', 115, 20, 100, 100);
      componentPins.push(
        { id: 'SERVO_GND', name: 'Servo GND (Ground)', cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: 'SERVO_VCC', name: 'Servo VCC (5V)', cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: 'SERVO_SIG', name: 'Servo PWM Signal', cx: sig.cx, cy: sig.cy, type: 'component' }
      );
    }

    // HC-SR04 Pins - real PNG image coordinates (size 200x200, center 100x100)
    if (hasUltrasonic) {
      const vcc = getRotatedPinCoords('ultrasonic', 84, 157, 100, 100);
      const trig = getRotatedPinCoords('ultrasonic', 94, 157, 100, 100);
      const echo = getRotatedPinCoords('ultrasonic', 105, 157, 100, 100);
      const gnd = getRotatedPinCoords('ultrasonic', 115, 157, 100, 100);
      componentPins.push(
        { id: 'SR04_VCC',  name: 'SR04 VCC (5V)',          cx: vcc.cx,  cy: vcc.cy,  type: 'component' },
        { id: 'SR04_TRIG', name: 'SR04 Trig Trigger Pin',  cx: trig.cx, cy: trig.cy, type: 'component' },
        { id: 'SR04_ECHO', name: 'SR04 Echo Pulse Pin',    cx: echo.cx, cy: echo.cy, type: 'component' },
        { id: 'SR04_GND',  name: 'SR04 GND (Ground)',      cx: gnd.cx,  cy: gnd.cy,  type: 'component' }
      );
    }

    // Potentiometer Pins (size 200x200, center 100x100)
    if (hasPot) {
      const gnd = getRotatedPinCoords('pot', 50, 150, 100, 100);
      const sig = getRotatedPinCoords('pot', 100, 150, 100, 100);
      const vcc = getRotatedPinCoords('pot', 150, 150, 100, 100);
      componentPins.push(
        { id: 'POT_VCC', name: 'Pot VCC (3.3V/5V)', cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: 'POT_SIG', name: 'Pot Signal Analog Out', cx: sig.cx, cy: sig.cy, type: 'component' },
        { id: 'POT_GND', name: 'Pot GND (Ground)', cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    }

    // Push Button Pins (size 120x120, center 60x60)
    if (hasButton) {
      const sig = getRotatedPinCoords('button', 35, 95, 60, 60);
      const gnd = getRotatedPinCoords('button', 85, 95, 60, 60);
      componentPins.push(
        { id: 'BTN_SIG', name: 'Button Signal (Output)', cx: sig.cx, cy: sig.cy, type: 'component' },
        { id: 'BTN_GND', name: 'Button GND (Ground)', cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    }

    // LCD 16x2 I2C Pins (size 200x200, center 100x100)
    if (hasLcd) {
      const gnd = getRotatedPinCoords('lcd', 22, 68, 100, 100);
      const vcc = getRotatedPinCoords('lcd', 22, 82, 100, 100);
      const sda = getRotatedPinCoords('lcd', 22, 96, 100, 100);
      const scl = getRotatedPinCoords('lcd', 22, 110, 100, 100);
      componentPins.push(
        { id: 'LCD_GND', name: 'LCD GND', cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: 'LCD_VCC', name: 'LCD VCC (5V)', cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: 'LCD_SDA', name: 'LCD SDA (Data)', cx: sda.cx, cy: sda.cy, type: 'component' },
        { id: 'LCD_SCL', name: 'LCD SCL (Clock)', cx: scl.cx, cy: scl.cy, type: 'component' }
      );
    }

    // DC Motor Pins (size 200x200, center 100x100)
    if (hasMotor) {
      const pos = getRotatedPinCoords('motor', 78, 185, 100, 100);
      const neg = getRotatedPinCoords('motor', 122, 185, 100, 100);
      componentPins.push(
        { id: 'MOTOR_POS', name: 'DC Motor Positif (+)', cx: pos.cx, cy: pos.cy, type: 'component' },
        { id: 'MOTOR_NEG', name: 'DC Motor Negatif (-)', cx: neg.cx, cy: neg.cy, type: 'component' }
      );
    }

    // DHT11 Pins (aligned with dht11 layout, pitch 20px, corrected offset)
    if (hasDht11) {
      const vcc = getRotatedPinCoords('dht11', 15, 115, 45, 60);
      const data = getRotatedPinCoords('dht11', 35, 115, 45, 60);
      const nc = getRotatedPinCoords('dht11', 55, 115, 45, 60);
      const gnd = getRotatedPinCoords('dht11', 75, 115, 45, 60);
      componentPins.push(
        { id: 'DHT11_VCC', name: 'DHT11 VCC (5V/3V3)', cx: vcc.cx, cy: vcc.cy, type: 'component' },
        { id: 'DHT11_DATA', name: 'DHT11 Data Pin', cx: data.cx, cy: data.cy, type: 'component' },
        { id: 'DHT11_NC', name: 'DHT11 NC (No Conn)', cx: nc.cx, cy: nc.cy, type: 'component' },
        { id: 'DHT11_GND', name: 'DHT11 GND (Ground)', cx: gnd.cx, cy: gnd.cy, type: 'component' }
      );
    }

    // RC522 RFID Reader Pins (8 pins, 2.54mm pitch)
    if (hasRfid) {
      const sda = getRotatedPinCoords('rfid', 16, 162, 55, 80);
      const sck = getRotatedPinCoords('rfid', 27, 162, 55, 80);
      const mosi = getRotatedPinCoords('rfid', 38, 162, 55, 80);
      const miso = getRotatedPinCoords('rfid', 49, 162, 55, 80);
      const irq = getRotatedPinCoords('rfid', 60, 162, 55, 80);
      const gnd = getRotatedPinCoords('rfid', 71, 162, 55, 80);
      const rst = getRotatedPinCoords('rfid', 82, 162, 55, 80);
      const v33 = getRotatedPinCoords('rfid', 93, 162, 55, 80);
      componentPins.push(
        { id: 'RFID_SDA', name: 'RFID SDA / SS (Chip Select)', cx: sda.cx, cy: sda.cy, type: 'component' },
        { id: 'RFID_SCK', name: 'RFID SCK (SPI Clock)', cx: sck.cx, cy: sck.cy, type: 'component' },
        { id: 'RFID_MOSI', name: 'RFID MOSI (Master Out)', cx: mosi.cx, cy: mosi.cy, type: 'component' },
        { id: 'RFID_MISO', name: 'RFID MISO (Master In)', cx: miso.cx, cy: miso.cy, type: 'component' },
        { id: 'RFID_IRQ', name: 'RFID IRQ (Interrupt)', cx: irq.cx, cy: irq.cy, type: 'component' },
        { id: 'RFID_GND', name: 'RFID GND (Ground)', cx: gnd.cx, cy: gnd.cy, type: 'component' },
        { id: 'RFID_RST', name: 'RFID RST (Reset Pin)', cx: rst.cx, cy: rst.cy, type: 'component' },
        { id: 'RFID_3V3', name: 'RFID 3.3V (VCC Power)', cx: v33.cx, cy: v33.cy, type: 'component' }
      );
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
    const potSigPin = getConnectedMcuPin('POT_SIG');
    if (potSigPin && onPinStateChange) {
      const numMatch = potSigPin.id.match(/\d+/);
      const pinKey = numMatch ? numMatch[0] : potSigPin.id;
      const analogVal = Math.round(potValue * 1023 / 100);
      onPinStateChange(pinKey, analogVal);
      onPinStateChange(potSigPin.id, analogVal);
    }
  }, [potValue, wires, board, onPinStateChange, isRunning]);

  useEffect(() => {
    const btnSigPin = getConnectedMcuPin('BTN_SIG');
    if (btnSigPin && onPinStateChange) {
      const numMatch = btnSigPin.id.match(/\d+/);
      const pinKey = numMatch ? numMatch[0] : btnSigPin.id;
      const state = buttonPressed ? 'HIGH' : 'LOW';
      onPinStateChange(pinKey, state);
      onPinStateChange(btnSigPin.id, state);
    }
  }, [buttonPressed, wires, board, onPinStateChange, isRunning]);

  const powerPins = [
    '5V', '3V3', '3V', 'VIN', 'VIN_L', 'VIN_R', 'PAD_3V', '5V_M', 'V_M', '3V3_L', '3V3_R', '3V3_R2',
    ...Array.from({ length: 21 }, (_, i) => `V${i}`)
  ];

  const ledAnodePin = getConnectedMcuPin('LED_A');
  const ledCathodePin = getConnectedMcuPin('LED_K');
  
  const checkLedPinMatch = (targetPin: Pin | null): boolean => {
    if (!targetPin) return false;
    if (!programPins.ledPin) return true; // if not defined in code, we don't block
    const mcuPinNum = targetPin.id.match(/\d+/)?.[0] || targetPin.id;
    return mcuPinNum === programPins.ledPin;
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

  const checkServoPinMatch = (): boolean => {
    if (!servoSigPin) return false;
    if (!programPins.servoPin) return true;
    const mcuPinNum = servoSigPin.id.match(/\d+/)?.[0] || servoSigPin.id;
    return mcuPinNum === programPins.servoPin;
  };

  const isServoWired = servoSigPin !== null && 
                       servoVccPin !== null && 
                       servoGndPin !== null && 
                       gndPins.includes(servoGndPin.id) &&
                       powerPins.includes(servoVccPin.id) &&
                       checkServoPinMatch();

  const getServoAngle = (): number => {
    if (!isServoWired || !isRunning) return 90;
    
    const resolveAngle = (rawVal: number): number => {
      // BBC micro:bit: maps duty cycle values (30 to 120) back to degrees (0 to 180)
      if (board === 'BBC micro:bit') {
        // duty = 30 + (angle * 90) / 180
        // (duty - 30) * 2 = angle
        const mappedAngle = (rawVal - 30) * 2;
        const res = Math.max(0, Math.min(180, mappedAngle));
        console.log(`ROBOLAB SIMULATOR: Microbit Servo angle resolved: ${res}° from raw PWM: ${rawVal}`);
        return res;
      }
      console.log(`ROBOLAB SIMULATOR: Standard Servo angle resolved: ${rawVal}°`);
      return rawVal;
    };

    if (servoSigPin && pinStates) {
      const exactState = pinStates[servoSigPin.id];
      if (exactState !== undefined) {
        const parsed = Number(exactState);
        if (!isNaN(parsed)) return resolveAngle(parsed);
      }
      const numPart = servoSigPin.id.match(/\d+/);
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
    
    if (programPins.ultrasonicTrigPin) {
      const trigNum = trigPin.id.match(/\d+/)?.[0] || trigPin.id;
      if (trigNum !== programPins.ultrasonicTrigPin) return false;
    }
    if (programPins.ultrasonicEchoPin) {
      const echoNum = echoPin.id.match(/\d+/)?.[0] || echoPin.id;
      if (echoNum !== programPins.ultrasonicEchoPin) return false;
    }
    return true;
  };

  const isUltrasonicWired = checkUltrasonicWiring();

  const checkPotWiring = (): boolean => {
    const sigPin = getConnectedMcuPin('POT_SIG');
    const vccPin = getConnectedMcuPin('POT_VCC');
    const gndPin = getConnectedMcuPin('POT_GND');
    
    if (!sigPin || !vccPin || !gndPin || !gndPins.includes(gndPin.id) || !powerPins.includes(vccPin.id)) return false;
    
    if (programPins.potPin) {
      const sigNum = sigPin.id.match(/\d+/)?.[0] || sigPin.id;
      if (sigNum !== programPins.potPin) return false;
    }
    return true;
  };

  const isPotWired = checkPotWiring();

  const checkBtnWiring = (): boolean => {
    const sigPin = getConnectedMcuPin('BTN_SIG');
    const gndPin = getConnectedMcuPin('BTN_GND');
    
    if (!sigPin || !gndPin || !gndPins.includes(gndPin.id)) return false;
    
    if (programPins.btnPin) {
      const sigNum = sigPin.id.match(/\d+/)?.[0] || sigPin.id;
      if (sigNum !== programPins.btnPin) return false;
    }
    return true;
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
      setDraggedElement(elementId);
      setDragStart({
        x: transformedPoint.x - positions[elementId].x,
        y: transformedPoint.y - positions[elementId].y
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

        setActiveBendPoints(prev => [...prev, { x: transformedPoint.x, y: transformedPoint.y }]);
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
    const isArduino = board === 'Arduino Uno';
    const isMicrobit = board === 'BBC micro:bit';
    const isEsp8266 = board.toLowerCase().includes('esp8266') || board.toLowerCase().includes('esp266') || board.toLowerCase().includes('nodemcu');
    const autoWires: Wire[] = [];

    const getMcuPinId = (type: 'digital' | 'analog', programPin: string | undefined, defaultNum: string): string => {
      if (isArduino) {
        const prefix = type === 'analog' ? 'A' : 'D';
        return programPin ? `${prefix}${programPin}` : `${prefix}${defaultNum}`;
      } else if (isMicrobit) {
        return programPin ? `P${programPin}` : `P${defaultNum}`;
      } else if (isEsp8266) {
        if (type === 'analog') return 'A0';
        if (!programPin) return `D${defaultNum}`;
        return programPin.startsWith('D') ? programPin : (programPin.startsWith('G') ? programPin.replace('G', 'D') : `D${programPin}`);
      } else {
        return programPin ? `G${programPin}` : `G${defaultNum}`;
      }
    };

    const gndPin = isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_L'));
    const vccPin = isArduino ? '5V' : (isMicrobit ? 'PAD_3V' : (isEsp8266 ? '3V3_R' : '3V3'));

    // Only wire LED if it's already added
    if (hasLed) {
      const pin = getMcuPinId('digital', programPins?.ledPin, isArduino ? '9' : (isMicrobit ? '2' : (isEsp8266 ? '4' : '2')));
      autoWires.push({ from: pin,    to: 'LED_A', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'LED_K', color: '#1e293b', bendPoints: [] });
    }
    // Only wire Servo if it's already added
    if (hasServo) {
      const pin = getMcuPinId('digital', programPins?.servoPin, isArduino ? '3' : (isMicrobit ? '1' : (isEsp8266 ? '2' : '18')));
      autoWires.push({ from: pin,  to: 'SERVO_SIG', color: '#3b82f6', bendPoints: [] });
      autoWires.push({ from: vccPin,  to: 'SERVO_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_R')), to: 'SERVO_GND', color: '#1e293b', bendPoints: [] });
    }
    // Only wire HC-SR04 if it's already added
    if (hasUltrasonic) {
      const trig = getMcuPinId('digital', programPins?.ultrasonicTrigPin, isArduino ? '12' : (isMicrobit ? '8' : (isEsp8266 ? '5' : '23')));
      const echo = getMcuPinId('digital', programPins?.ultrasonicEchoPin, isArduino ? '13' : (isMicrobit ? '9' : (isEsp8266 ? '6' : '22')));
      autoWires.push({ from: vccPin,  to: 'SR04_VCC',  color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: trig, to: 'SR04_TRIG', color: '#10b981', bendPoints: [] });
      autoWires.push({ from: echo, to: 'SR04_ECHO', color: '#f59e0b', bendPoints: [] });
      autoWires.push({ from: isArduino ? 'GND_B' : (isMicrobit ? 'PAD_GND' : (isEsp8266 ? 'GND_R' : 'GND_R')), to: 'SR04_GND', color: '#1e293b', bendPoints: [] });
    }
    // Only wire Potentiometer if it's already added
    if (hasPot) {
      const pin = getMcuPinId('analog', programPins?.potPin, isArduino ? '0' : (isMicrobit ? '0' : (isEsp8266 ? '0' : '26')));
      autoWires.push({ from: vccPin,  to: 'POT_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin,  to: 'POT_SIG', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'POT_GND', color: '#1e293b', bendPoints: [] });
    }
    // Only wire Button if it's already added
    if (hasButton) {
      const pin = getMcuPinId('digital', programPins?.btnPin, isArduino ? '2' : (isMicrobit ? '1' : (isEsp8266 ? '3' : '27')));
      autoWires.push({ from: pin,  to: 'BTN_SIG', color: '#eab308', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'BTN_GND', color: '#1e293b', bendPoints: [] });
    }
    // Only wire DHT11 if it's already added
    if (hasDht11) {
      const pin = getMcuPinId('digital', undefined, isArduino ? '4' : (isMicrobit ? '4' : (isEsp8266 ? '7' : '4')));
      autoWires.push({ from: vccPin,  to: 'DHT11_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: pin,   to: 'DHT11_DATA', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'DHT11_GND', color: '#1e293b', bendPoints: [] });
    }
    // Only wire LCD if it's already added
    if (hasLcd) {
      const sdaPin = isArduino ? 'A4' : (isMicrobit ? 'P20' : (isEsp8266 ? 'D2' : 'G21'));
      const sclPin = isArduino ? 'A5' : (isMicrobit ? 'P19' : (isEsp8266 ? 'D1' : 'G22'));
      autoWires.push({ from: gndPin, to: 'LCD_GND', color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: vccPin, to: 'LCD_VCC', color: '#ef4444', bendPoints: [] });
      autoWires.push({ from: sdaPin, to: 'LCD_SDA', color: '#a78bfa', bendPoints: [] });
      autoWires.push({ from: sclPin, to: 'LCD_SCL', color: '#3b82f6', bendPoints: [] });
    }
    // Only wire RC522 RFID if it's already added
    if (hasRfid) {
      const sdaPin = isArduino ? 'D10' : (isMicrobit ? 'P16' : (isEsp8266 ? 'D8' : 'G5'));
      const sckPin = isArduino ? 'D13' : (isMicrobit ? 'P13' : (isEsp8266 ? 'D5' : 'G18'));
      const mosiPin = isArduino ? 'D11' : (isMicrobit ? 'P15' : (isEsp8266 ? 'D7' : 'G23'));
      const misoPin = isArduino ? 'D12' : (isMicrobit ? 'P14' : (isEsp8266 ? 'D6' : 'G19'));
      const rstPin = isArduino ? 'D9' : (isMicrobit ? 'P8' : (isEsp8266 ? 'D4' : 'G22'));
      const p3v3Pin = isArduino ? '3V3' : (isMicrobit ? 'PAD_3V' : (isEsp8266 ? '3V3_R' : '3V3'));
      autoWires.push({ from: sdaPin, to: 'RFID_SDA', color: '#06b6d4', bendPoints: [] });
      autoWires.push({ from: sckPin, to: 'RFID_SCK', color: '#3b82f6', bendPoints: [] });
      autoWires.push({ from: mosiPin, to: 'RFID_MOSI', color: '#10b981', bendPoints: [] });
      autoWires.push({ from: misoPin, to: 'RFID_MISO', color: '#eab308', bendPoints: [] });
      autoWires.push({ from: gndPin, to: 'RFID_GND', color: '#1e293b', bendPoints: [] });
      autoWires.push({ from: rstPin, to: 'RFID_RST', color: '#8b5cf6', bendPoints: [] });
      autoWires.push({ from: p3v3Pin, to: 'RFID_3V3', color: '#f43f5e', bendPoints: [] });
    }

    // Only apply wires (don't change activeComponents — preserve user's workspace)
    if (autoWires.length > 0) {
      setWires(prev => {
        const componentPins = [
          'LED_A', 'LED_K',
          'SERVO_SIG', 'SERVO_VCC', 'SERVO_GND',
          'SR04_VCC', 'SR04_TRIG', 'SR04_ECHO', 'SR04_GND',
          'POT_VCC', 'POT_SIG', 'POT_GND',
          'BTN_SIG', 'BTN_GND',
          'DHT11_VCC', 'DHT11_DATA', 'DHT11_GND',
          'LCD_GND', 'LCD_VCC', 'LCD_SDA', 'LCD_SCL',
          'RFID_SDA', 'RFID_SCK', 'RFID_MOSI', 'RFID_MISO', 'RFID_IRQ', 'RFID_GND', 'RFID_RST', 'RFID_3V3'
        ];

        const autoTargetComponentPins = new Set<string>();
        autoWires.forEach(w => {
          if (componentPins.includes(w.from)) autoTargetComponentPins.add(w.from);
          if (componentPins.includes(w.to)) autoTargetComponentPins.add(w.to);
        });

        const existingKept = prev.filter(w => {
          const connectsToAutoTarget = autoTargetComponentPins.has(w.from) || autoTargetComponentPins.has(w.to);
          return !connectsToAutoTarget;
        });

        return [...existingKept, ...autoWires];
      });
    }
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

  // Add component handler
  const handleAddComponent = (compType: string) => {
    if (compType && !activeComponents.includes(compType)) {
      setActiveComponents(prev => [...prev, compType]);
    }
  };

  const handleRemoveComponent = (compType: string) => {
    const typesToRemove = compType === 'ultrasonic' ? ['ultrasonic', 'hcsr', 'hcsr04'] : (compType === 'dht11' ? ['dht11', 'dht'] : (compType === 'rfid' ? ['rfid', 'mfrc522', 'rc522'] : [compType]));
    setActiveComponents(prev => prev.filter(c => !typesToRemove.includes(c)));
    
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
      rfid: ['RFID_'],
      mfrc522: ['RFID_'],
      rc522: ['RFID_']
    }[compType] || [compType.toUpperCase() + '_'];

    const compPinIds = pins
      .filter(p => p.type === 'component' && pinPrefixes.some(pref => p.id.startsWith(pref)))
      .map(p => p.id);

    setWires(prev => prev.filter(w => !compPinIds.includes(w.from) && !compPinIds.includes(w.to)));
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
      <div className={`flex-1 min-h-[400px] ${isExpanded ? 'lg:min-h-full order-2 lg:order-1' : 'order-1'} ${isLight ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-[#0b0d14] border-slate-800/80 shadow-inner'} border rounded-xl relative overflow-hidden flex items-center justify-center group transition-colors`}>
        
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

          {/* A. RED LED — WP7113ID 5mm Through-hole LED
               WP7113ID.mod: outer flange r=2.95mm, dome r=2.5mm, courtyard r=3.6mm
               Pad A (anode, round): x=+1.27mm | Pad K (cathode, square): x=-1.27mm
               Cathode flat-side marker: from DC -2.9,-1.6 to -2.773,-1.6
               Scale: 1mm → 10px | LED body center at svg (35,45) */}
          {/* A. RED LED — PNG Image */}
          {hasLed && (
            <g
              transform={`translate(${positions.led.x}, ${positions.led.y}) rotate(${rotations.led || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('led', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('led');
              }}
              filter="url(#shadow3d)"
            >
              {/* LED Glow Halo */}
              {ledBrightness > 0 && (
                <ellipse cx="100" cy="85" rx={35 + ledBrightness * 18} ry={35 + ledBrightness * 18}
                  fill={`rgba(239,68,68,${ledBrightness * 0.4})`} className="animate-pulse"/>
              )}

              {/* PNG Image */}
              <image href="./led.png" xlinkHref="./led.png" x="0" y="0" width="200" height="200" />

              {/* Pin indicator dots */}
              <circle cx="80" cy="185" r="3.5" fill={isLedWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="120" cy="185" r="3.5" fill={isLedWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="80" y="198" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">A (+)</text>
              <text x="120" y="198" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">K (−)</text>

              {/* Badge label */}
              <rect x="55" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isLedWired ? '#34d399' : '#6366f1'} strokeWidth="1.2"/>
              <text x="100" y="26" fontSize="8" fill={isLedWired ? '#34d399' : '#a5b4fc'} fontWeight="bold" textAnchor="middle">
                {isLedWired ? '✔ LED' : 'LED'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('led')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('led')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* B. SG90 SERVO MOTOR — PNG Image */}
          {hasServo && (
            <g
              transform={`translate(${positions.servo.x}, ${positions.servo.y}) rotate(${rotations.servo || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('servo', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('servo');
              }}
              filter="url(#shadow3d)"
            >
              {/* Servo PNG Image */}
              <image href="./servo.png" xlinkHref="./servo.png" x="0" y="0" width="200" height="200" />

              {/* Animated Rotating Horn overlay over shaft center (100, 95) */}
              <g transform={`translate(100, 95) rotate(${servoAngle - 90}) translate(-100, -95)`}>
                <rect x="75" y="91" width="50" height="8" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <circle cx="100" cy="95" r="5" fill="#38bdf8" />
                <circle cx="120" cy="95" r="2.5" fill="#ef4444" />
              </g>

              {/* Pin indicator dots directly over cable header plug (GND left:85, VCC center:100, SIG right:115) */}
              <circle cx="85" cy="20" r="3.5" fill={isServoWired ? "#1e293b" : "#64748b"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="100" cy="20" r="3.5" fill={isServoWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="115" cy="20" r="3.5" fill={isServoWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="85" y="34" fontSize="6.5" fill="#94a3b8" fontWeight="bold" textAnchor="middle">GND</text>
              <text x="100" y="34" fontSize="6.5" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>
              <text x="115" y="34" fontSize="6.5" fill="#3b82f6" fontWeight="bold" textAnchor="middle">SIG</text>

              {/* Badge label at BOTTOM */}
              <rect x="55" y="170" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isServoWired ? '#34d399' : '#0284c7'} strokeWidth="1.2"/>
              <text x="100" y="181" fontSize="8" fill={isServoWired ? '#34d399' : '#38bdf8'} fontWeight="bold" textAnchor="middle">
                {isServoWired ? '✔ Servo SG90' : 'Servo SG90'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('servo')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="25" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 22.5 23 A 3 3 0 1 1 25 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 25 24 L 25 26 L 27 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('servo')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="42" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="39" y1="20" x2="45" y2="26" stroke="#fff" strokeWidth="1.5"/>
                <line x1="45" y1="20" x2="39" y2="26" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* C. HC-SR04 ULTRASONIC — PNG Image Component */}
          {hasUltrasonic && (
            <g
              transform={`translate(${positions.ultrasonic.x}, ${positions.ultrasonic.y}) rotate(${rotations.ultrasonic || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('ultrasonic', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('ultrasonic');
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
              <circle cx="84" cy="157" r="3.5" fill={isUltrasonicWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="94" cy="157" r="3.5" fill={isUltrasonicWired ? "#10b981" : "#6ee7b7"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="105" cy="157" r="3.5" fill={isUltrasonicWired ? "#f59e0b" : "#fcd34d"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="115" cy="157" r="3.5" fill={isUltrasonicWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="84" y="174" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>
              <text x="94" y="174" fontSize="7" fill="#10b981" fontWeight="bold" textAnchor="middle">TRIG</text>
              <text x="105" y="174" fontSize="7" fill="#f59e0b" fontWeight="bold" textAnchor="middle">ECHO</text>
              <text x="115" y="174" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>

              {/* Component Label */}
              <rect x="55" y="32" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isUltrasonicWired ? '#34d399' : '#3b82f6'} strokeWidth="1.2"/>
              <text x="100" y="43" fontSize="8.5" fill={isUltrasonicWired ? '#34d399' : '#93c5fd'} fontWeight="bold" textAnchor="middle">
                {isUltrasonicWired ? '✔ HC-SR04' : 'HC-SR04'}
              </text>

              {/* Rotate button */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('ultrasonic')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="165" cy="45" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 162.5 45 A 3 3 0 1 1 165 48" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 165 46 L 165 48 L 167 48" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>

              {/* Delete button */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('ultrasonic')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="182" cy="45" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="179" y1="42" x2="185" y2="48" stroke="#fff" strokeWidth="1.5"/>
                <line x1="185" y1="42" x2="179" y2="48" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* D. ROTARY POTENTIOMETER — PNG Image */}
          {hasPot && (
            <g
              transform={`translate(${positions.pot.x}, ${positions.pot.y}) rotate(${rotations.pot || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('pot', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('pot');
              }}
              filter="url(#shadow3d)"
            >
              {/* Potentiometer PNG Image */}
              <image href="./potentiometer.png" xlinkHref="./potentiometer.png" x="0" y="0" width="200" height="200" />

              {/* Pin indicator dots at bottom */}
              <circle cx="50" cy="150" r="3.5" fill={isPotWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="100" cy="150" r="3.5" fill={isPotWired ? "#a78bfa" : "#c4b5fd"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="150" cy="150" r="3.5" fill={isPotWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="50" y="165" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>
              <text x="100" y="165" fontSize="7" fill="#a78bfa" fontWeight="bold" textAnchor="middle">SIG</text>
              <text x="150" y="165" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">VCC</text>

              {/* Knob indicator dot rotating over center (100, 80) */}
              <line
                x1="100" y1="80"
                x2={100 + Math.cos(((potValue - 50) * 2.6 - 90) * Math.PI / 180) * 14}
                y2={80 + Math.sin(((potValue - 50) * 2.6 - 90) * Math.PI / 180) * 14}
                stroke="#10b981" strokeWidth="3" strokeLinecap="round"
              />

              {/* Value display */}
              <rect x="75" y="170" width="50" height="14" rx="3" fill="rgba(15, 23, 42, 0.9)" stroke="#22c55e" strokeWidth="1"/>
              <text x="100" y="180" fontSize="7.5" fill="#34d399" textAnchor="middle" fontWeight="bold">{potValue}%</text>

              {/* Slider */}
              <foreignObject x="35" y="186" width="130" height="14" onMouseDown={e => e.stopPropagation()}>
                <input
                  type="range" min="0" max="100" value={potValue}
                  onChange={(e) => setPotValue(Number(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </foreignObject>

              {/* Badge label */}
              <rect x="55" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isPotWired ? '#34d399' : '#22c55e'} strokeWidth="1.2"/>
              <text x="100" y="26" fontSize="8" fill={isPotWired ? '#34d399' : '#86efac'} fontWeight="bold" textAnchor="middle">
                {isPotWired ? '✔ Potentiometer' : 'Potentiometer'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('pot')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('pot')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* E. TACTILE PUSH BUTTON — PNG Image */}
          {hasButton && (
            <g
              transform={`translate(${positions.button.x}, ${positions.button.y}) rotate(${rotations.button || 0}, 60, 60)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('button', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('button');
              }}
              filter="url(#shadow3d)"
            >
              {/* Push Button PNG Image */}
              <image href="./pushButton.png" xlinkHref="./pushButton.png" x="0" y="0" width="120" height="120" />

              {/* Pin indicator dots */}
              <circle cx="35" cy="95" r="3" fill={isButtonWired ? "#eab308" : "#fef08a"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="85" cy="95" r="3" fill={isButtonWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="35" y="108" fontSize="6.5" fill="#eab308" fontWeight="bold" textAnchor="middle">SIG</text>
              <text x="85" y="108" fontSize="6.5" fill="#3b82f6" fontWeight="bold" textAnchor="middle">GND</text>

              {/* Clickable button cap trigger overlay */}
              <circle
                cx="60" cy="55" r="18"
                fill={buttonPressed ? "rgba(239,68,68,0.4)" : "transparent"}
                stroke={buttonPressed ? "#ef4444" : "none"}
                strokeWidth="2"
                className="cursor-pointer"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setButtonPressed(true);
                  const btnSigPin = getConnectedMcuPin('BTN_SIG');
                  if (btnSigPin && onPinStateChange) {
                    const numMatch = btnSigPin.id.match(/\d+/);
                    const pinKey = numMatch ? numMatch[0] : btnSigPin.id;
                    onPinStateChange(pinKey, 'HIGH');
                    onPinStateChange(btnSigPin.id, 'HIGH');
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  setButtonPressed(false);
                  const btnSigPin = getConnectedMcuPin('BTN_SIG');
                  if (btnSigPin && onPinStateChange) {
                    const numMatch = btnSigPin.id.match(/\d+/);
                    const pinKey = numMatch ? numMatch[0] : btnSigPin.id;
                    onPinStateChange(pinKey, 'LOW');
                    onPinStateChange(btnSigPin.id, 'LOW');
                  }
                }}
              />

              {/* Badge label */}
              <rect x="20" y="8" width="80" height="14" rx="3" fill="rgba(15, 23, 42, 0.85)" stroke={isButtonWired ? '#34d399' : '#475569'} strokeWidth="1"/>
              <text x="60" y="18" fontSize="7" fill={isButtonWired ? '#34d399' : '#94a3b8'} fontWeight="bold" textAnchor="middle">
                {isButtonWired ? '✔ Button' : 'Button'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('button')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="102" cy="15" r="5.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                <path d="M 100 15 A 2 2 0 1 1 102 17" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round"/>
                <path d="M 102 15.5 L 102 17 L 103.5 17" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('button')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="114" cy="15" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                <line x1="112" y1="13" x2="116" y2="17" stroke="#fff" strokeWidth="1"/>
                <line x1="116" y1="13" x2="112" y2="17" stroke="#fff" strokeWidth="1"/>
              </g>
            </g>
          )}

          {/* F. LCD DISPLAY 16x2 I2C — PNG Image */}
          {hasLcd && (
            <g
              transform={`translate(${positions.lcd.x}, ${positions.lcd.y}) rotate(${rotations.lcd || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('lcd', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('lcd');
              }}
              filter="url(#shadow3d)"
            >
              {/* LCD PNG Image */}
              <image href="./displayLCD16x2I2C.png" xlinkHref="./displayLCD16x2I2C.png" x="0" y="0" width="200" height="200" />

              {/* Dynamic LCD Screen Content Overlay */}
              <rect x="52" y="80" width="96" height="34" rx="2" fill="#0f172a" opacity="0.9" />
              <text x="56" y="93" fontSize="6.5" fill="#93c5fd" fontWeight="bold" fontFamily="monospace">
                {isRunning ? (isUltrasonicWired || isPotWired || isDhtWired ? `TEMP: ${currentTemp}C` : 'NO WIRES!') : 'SYSTEM IDLE'}
              </text>
              <text x="56" y="107" fontSize="6.5" fill="#93c5fd" fontWeight="bold" fontFamily="monospace">
                {isRunning ? (isUltrasonicWired || isPotWired || isDhtWired ? `DIST: ${currentDistance}CM` : 'CONNECT PINS') : 'READY TO WIRE'}
              </text>
              {isRunning && <rect x="16" y="53" width="4" height="6" fill="#60a5fa" opacity="0.7" className="animate-pulse"/>}

              {/* Pin indicator dots on I2C module (left side) */}
              <circle cx="22" cy="68" r="3" fill={isLcdWired ? "#10b981" : "#6ee7b7"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="22" cy="82" r="3" fill={isLcdWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="22" cy="96" r="3" fill={isLcdWired ? "#a78bfa" : "#c4b5fd"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="22" cy="110" r="3" fill={isLcdWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="12" y="70" fontSize="5.5" fill="#10b981" fontWeight="bold" textAnchor="end">GND</text>
              <text x="12" y="84" fontSize="5.5" fill="#ef4444" fontWeight="bold" textAnchor="end">VCC</text>
              <text x="12" y="98" fontSize="5.5" fill="#a78bfa" fontWeight="bold" textAnchor="end">SDA</text>
              <text x="12" y="112" fontSize="5.5" fill="#3b82f6" fontWeight="bold" textAnchor="end">SCL</text>

              {/* Badge label */}
              <rect x="55" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isLcdWired ? '#34d399' : '#047857'} strokeWidth="1.2"/>
              <text x="100" y="26" fontSize="8" fill={isLcdWired ? '#34d399' : '#a7f3d0'} fontWeight="bold" textAnchor="middle">
                {isLcdWired ? '✔ LCD 16x2 I2C' : 'LCD 16x2 I2C'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('lcd')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('lcd')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* G. DHT11 TEMP/HUMIDITY SENSOR — 3D */}
          {hasDht11 && positions.dht11 && (
            <g
              transform={`translate(${positions.dht11.x}, ${positions.dht11.y}) rotate(${rotations.dht11 || 0}, 45, 60)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('dht11', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('dht11');
              }}
              filter="url(#shadow3d)"
            >
              {/* 3D board depth — bottom face */}
              <polygon points="0,120 90,120 96,126 6,126" fill="#011b2e" opacity="0.9"/>
              {/* 3D board depth — right face */}
              <polygon points="90,0 96,6 96,126 90,120" fill="#012b4a" opacity="0.9"/>
              {/* Main PCB face */}
              <rect x="0" y="0" width="90" height="120" rx="5" fill="url(#pcbBlueGrad)" stroke={isDhtWired ? '#34d399' : '#0284c7'} strokeWidth="1.5"/>
              {/* PCB surface highlight */}
              <rect x="2" y="2" width="86" height="18" rx="3" fill="rgba(255,255,255,0.06)"/>
              {/* Label */}
              <text x="8" y="13" fontSize="7.5" fill={isDhtWired ? '#34d399' : '#38bdf8'} fontWeight="bold">
                {isDhtWired ? '✔ DHT11 Sensor' : 'DHT11 Temp'}
              </text>
              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('dht11')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="71" cy="8" r="5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                <path d="M 69 8 A 2 2 0 1 1 71 10" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round"/>
                <path d="M 71 8.5 L 71 10 L 72.5 10" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete button */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('dht11')} onMouseDown={e => e.stopPropagation()}>
                <circle cx="83" cy="8" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                <line x1="81" y1="6" x2="85" y2="10" stroke="#fff" strokeWidth="1.2"/>
                <line x1="85" y1="6" x2="81" y2="10" stroke="#fff" strokeWidth="1.2"/>
              </g>

              {/* === DHT11 Sensor body - based on SENSOR-DHT11.mod ===
                   Body outline: x=-6 to +6 (12mm), y=-2.25 to +2.25 (4.5mm)
                   4 pads: x=-3.81,-1.27,+1.27,+3.81 all at y=0
                   Scale: 1mm = 8px, centered at component center (45,55) */}
              {/* Sensor Case - Blue plastic 96px wide x 80px tall (12mm x 10mm visual) */}
              <rect x="5" y="22" width="80" height="72" rx="5" fill="url(#bodyBlueGrad)" stroke="#0369a1" strokeWidth="1.5"/>
              {/* Case top highlight */}
              <rect x="7" y="24" width="76" height="8" rx="3" fill="rgba(255,255,255,0.15)"/>
              {/* Vent grille area (upper 60% of case) */}
              <rect x="12" y="34" width="66" height="44" rx="3" fill="#082f49" stroke="#0369a1" strokeWidth="1"/>
              {/* Horizontal grille slots */}
              <rect x="15" y="38" width="60" height="4" rx="1" fill="#0369a1" opacity="0.5"/>
              <rect x="15" y="46" width="60" height="4" rx="1" fill="#0369a1" opacity="0.5"/>
              <rect x="15" y="54" width="60" height="4" rx="1" fill="#0369a1" opacity="0.5"/>
              <rect x="15" y="62" width="60" height="4" rx="1" fill="#0369a1" opacity="0.5"/>
              <rect x="15" y="70" width="60" height="4" rx="1" fill="#0369a1" opacity="0.5"/>
              {/* Vertical dividers */}
              <line x1="33" y1="34" x2="33" y2="78" stroke="#0284c7" strokeWidth="0.8" opacity="0.5"/>
              <line x1="57" y1="34" x2="57" y2="78" stroke="#0284c7" strokeWidth="0.8" opacity="0.5"/>
              {/* Branding */}
              <text x="45" y="92" fontSize="9" fill="#ffffff" textAnchor="middle" fontWeight="bold">DHT11</text>
              {/* 4 pins - 2.54mm pitch = ~20px, at y=22 (bottom of PCB) */}
              {/* P1=VCC at x=45-30=15, P2=DATA at x=15+20=35, P3=NC at x=55, P4=GND at x=75 */}
              <rect x="13" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
              <rect x="33" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
              <rect x="53" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
              <rect x="73" y="94" width="4" height="14" rx="1" fill="#e2e8f0"/>
              {/* Pin labels */}
              <text x="9" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">VCC</text>
              <text x="29" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">DAT</text>
              <text x="50" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">NC</text>
              <text x="69" y="114" fontSize="6.5" fill="#38bdf8" fontWeight="bold">GND</text>
            </g>
          )}

          {/* G. DC MOTOR — PNG Image Component */}
          {hasMotor && positions.motor && (
            <g
              transform={`translate(${positions.motor.x}, ${positions.motor.y}) rotate(${rotations.motor || 0}, 100, 100)`}
              className="cursor-move"
              onMouseDown={(e) => startDrag('motor', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('motor');
              }}
              filter="url(#shadow3d)"
            >
              {/* DC Motor PNG Image */}
              <image href="./motorDC.png" xlinkHref="./motorDC.png" x="0" y="0" width="200" height="200" />

              {/* Spinning Propeller Fan Overlay when Motor is Running */}
              {isRunning && isMotorWired && (
                <g transform="translate(100, 45)" className="animate-spin" style={{ transformOrigin: '100px 45px', animationDuration: '0.3s' }}>
                  <circle cx="100" cy="45" r="6" fill="#ca8a04" />
                  <ellipse cx="100" cy="30" rx="4" ry="15" fill="#eab308" opacity="0.8" />
                  <ellipse cx="100" cy="60" rx="4" ry="15" fill="#eab308" opacity="0.8" />
                  <ellipse cx="85" cy="45" rx="15" ry="4" fill="#eab308" opacity="0.8" />
                  <ellipse cx="115" cy="45" rx="15" ry="4" fill="#eab308" opacity="0.8" />
                </g>
              )}

              {/* Pin indicator dots at bottom terminals */}
              <circle cx="78" cy="185" r="3.5" fill={isMotorWired ? "#ef4444" : "#fca5a5"} stroke="#ffffff" strokeWidth="1" />
              <circle cx="122" cy="185" r="3.5" fill={isMotorWired ? "#3b82f6" : "#93c5fd"} stroke="#ffffff" strokeWidth="1" />

              {/* Pin labels */}
              <text x="78" y="198" fontSize="7" fill="#ef4444" fontWeight="bold" textAnchor="middle">POS (+)</text>
              <text x="122" y="198" fontSize="7" fill="#3b82f6" fontWeight="bold" textAnchor="middle">NEG (−)</text>

              {/* Badge label */}
              <rect x="55" y="15" width="90" height="16" rx="4" fill="rgba(15, 23, 42, 0.85)" stroke={isMotorWired ? '#34d399' : '#eab308'} strokeWidth="1.2"/>
              <text x="100" y="26" fontSize="8" fill={isMotorWired ? '#34d399' : '#fef08a'} fontWeight="bold" textAnchor="middle">
                {isMotorWired ? '✔ DC Motor' : 'DC Motor'}
              </text>

              {/* Rotate */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('motor')} onMouseDown={e => e.stopPropagation()}>
                <title>Rotate Component</title>
                <circle cx="165" cy="23" r="7" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1"/>
                <path d="M 162.5 23 A 3 3 0 1 1 165 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round"/>
                <path d="M 165 24 L 165 26 L 167 26" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Delete */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('motor')} onMouseDown={e => e.stopPropagation()}>
                <title>Remove Component</title>
                <circle cx="182" cy="23" r="7" fill="#ef4444" stroke="#fca5a5" strokeWidth="1"/>
                <line x1="179" y1="20" x2="185" y2="26" stroke="#fff" strokeWidth="1.5"/>
                <line x1="185" y1="20" x2="179" y2="26" stroke="#fff" strokeWidth="1.5"/>
              </g>
            </g>
          )}

          {/* H. RC522 RFID READER — 3D Board & Interactive RFID Tag */}
          {hasRfid && positions.rfid && (
            <g
              transform={`translate(${positions.rfid.x}, ${positions.rfid.y}) rotate(${rotations.rfid || 0}, 55, 80)`}
              className="cursor-move select-none"
              onMouseDown={(e) => startDrag('rfid', e)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleRotateComponent('rfid');
              }}
              filter="url(#shadow3d)"
            >
              {/* Rotate Button */}
              <g className="cursor-pointer" onClick={() => handleRotateComponent('rfid')} onMouseDown={e => e.stopPropagation()}>
                <circle cx="8" cy="8" r="5.5" fill="#3b82f6" stroke="#93c5fd" strokeWidth="0.8"/>
                <path d="M6 8a2 2 0 1 1 2 2M6 8l1.5-1M6 8l1.5 1" stroke="#fff" strokeWidth="0.9" fill="none"/>
              </g>
              {/* Delete button */}
              <g className="cursor-pointer" onClick={() => handleRemoveComponent('rfid')} onMouseDown={e => e.stopPropagation()}>
                <circle cx="102" cy="8" r="5.5" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8"/>
                <line x1="100" y1="6" x2="104" y2="10" stroke="#fff" strokeWidth="1.2"/>
                <line x1="104" y1="6" x2="100" y2="10" stroke="#fff" strokeWidth="1.2"/>
              </g>

              {/* PCB Base: Classic blue FR-4 (110x150, rx=6) */}
              <rect x="0" y="16" width="110" height="136" rx="6" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5"/>
              <rect x="2" y="18" width="106" height="132" rx="5" fill="none" stroke="#2563eb" strokeWidth="0.8" opacity="0.6"/>

              {/* Top Antenna Area (Coil traces in silkscreen gold) */}
              <rect x="8" y="24" width="94" height="64" rx="4" fill="#172554" stroke="#d97706" strokeWidth="1.2"/>
              <rect x="12" y="28" width="86" height="56" rx="3" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8"/>
              <rect x="16" y="32" width="78" height="48" rx="2" fill="none" stroke="#d97706" strokeWidth="0.6" opacity="0.7"/>
              <rect x="20" y="36" width="70" height="40" rx="2" fill="none" stroke="#f59e0b" strokeWidth="0.5" opacity="0.6"/>

              {/* Antenna Icon & Text */}
              <text x="55" y="49" fontSize="7" fill="#fde68a" textAnchor="middle" fontWeight="bold" fontFamily="monospace">RFID-RC522</text>
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
          )}

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
          const isUltrasonicPopup = activePopup === 'ultrasonic' || activePopup === 'hcsr' || activePopup === 'hcsr04';
          const isDhtPopup = activePopup === 'dht11' || activePopup === 'dht';
          const isPotPopup = activePopup === 'pot';
          const isRfidPopup = activePopup === 'rfid' || activePopup === 'mfrc522' || activePopup === 'rc522';
          
          if (!isUltrasonicPopup && !isDhtPopup && !isPotPopup && !isRfidPopup) return null;
          
          return (
            <div className="absolute top-2 left-2 z-40 bg-slate-900/95 border border-slate-750 p-3 rounded-xl shadow-2xl w-44 text-white select-none animate-in fade-in zoom-in-95 duration-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                  {isUltrasonicPopup ? '🔊 HC-SR04' : isDhtPopup ? '🌡️ DHT11' : isRfidPopup ? '🏷️ RC522 RFID' : '🎛️ Potentiometer'}
                </span>
                <button 
                  onClick={() => setActivePopup(null)}
                  className="text-[10px] hover:text-rose-400 text-slate-400 font-bold transition cursor-pointer select-none"
                >
                  ✕
                </button>
              </div>
              
              {isUltrasonicPopup && (
                <div className="space-y-1.5">
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
                <div className="space-y-2.5">
                  {/* Temp slider */}
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
                  {/* Humidity slider */}
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

              {isPotPopup && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-350">
                    <span>Analog In:</span>
                    <span className="font-mono text-cyan-400">{Math.round((potValue / 100) * 1023)}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={potValue}
                    onChange={(e) => {
                      if (onPotValueChange) onPotValueChange(parseInt(e.target.value));
                    }}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="text-[7px] text-slate-500 text-center font-mono">
                    Percentage: {potValue}%
                  </div>
                </div>
              )}

              {isRfidPopup && (
                <div className="space-y-2">
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
            </div>
          );
        })()}
      </div>

      {/* ── 2. SIDEBAR CONTROLS (Bento Grid Style) ── */}
      <div className={`w-full ${isExpanded ? 'lg:w-[320px] xl:w-[360px] order-1 lg:order-2' : 'order-2'} flex flex-col gap-3 flex-shrink-0 overflow-y-auto pr-1`}>
        
        {/* Title */}
        <div className="flex items-center justify-between px-1">
          <span className={`text-[11px] font-bold flex items-center gap-2 uppercase tracking-widest ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            <Cpu className="w-4 h-4 text-indigo-400" />
            Simulator
          </span>
          <span className={`text-[9px] flex items-center gap-1.5 font-semibold px-2 py-1 rounded-md border ${isLight ? 'text-slate-500 bg-slate-200/60 border-slate-300/60' : 'text-slate-400 bg-[#131724] border-slate-800'}`}>
            <Move className="w-3 h-3 text-sky-400" /> DRAG TO MOVE
          </span>
        </div>

        {/* WiFi Simulator Panel */}
        {board !== 'Arduino Uno R3' && board !== 'BBC micro:bit' && (
          <div className={`flex flex-col gap-2.5 p-3.5 rounded-xl border shadow-sm transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f131f] border-slate-800/90'}`}>
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
        <div className={`p-3.5 rounded-xl border shadow-sm space-y-3.5 transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f131f] border-slate-800/90'}`}>
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
          <div className={`p-3 rounded-xl border shadow-sm flex flex-col gap-2 transition-colors ${isLight ? 'bg-white border-slate-200' : 'bg-[#0f131f] border-slate-800/90'}`}>
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
