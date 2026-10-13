export type RobotPresetId = 'line_follower' | 'maze_solver' | 'free_robot';

export type RobotMcuId =
  | 'Arduino Uno'
  | 'Arduino Nano'
  | 'Arduino Mega'
  | 'ESP32 DevKit V1'
  | 'NodeMCU / ESP8266';

export type SensorCount = 2 | 4 | 5 | 6 | 8 | 12;

export type SensorReadMode = 'direct' | 'mux_4051' | 'mux_4067';

export type UltrasonicMode = 'none' | 'front' | 'three';

export type MotorPresetId =
  | 'tt_200'
  | 'n20_300'
  | 'n20_600'
  | 'jga25_500'
  | 'pg28_1000'
  | 'custom';

export type PlanActionType = 'MAJU' | 'MUNDUR' | 'LEFT' | 'RIGHT' | 'PAUSE';

export type PlanTriggerMode = 'SENSOR' | 'MOTION';

export type PlanLogicOp = 'EQUAL' | 'AND' | 'OR' | 'XOR';

export type PlanDurationUnit = 'ms' | 'enc_l' | 'enc_r';

export type PlanLineColor = 'HITAM' | 'PUTIH';

export type StopHereStage = 'ACTION' | 'SPEED_A';

export interface PIDProfile {
  id: 1 | 2 | 3 | 4 | 5;
  label: string;
  kp: number;
  ki: number;
  kd: number;
  dt: number; // ms
}

export interface RobotPinConfig {
  pwmL: string;
  dirL1: string;
  dirL2: string;
  pwmR: string;
  dirR1: string;
  dirR2: string;
  sensorDirectPins: string[];
  muxS0: string;
  muxS1: string;
  muxS2: string;
  muxS3: string;
  muxSig: string;
  encLA: string;
  encLB: string;
  encRA: string;
  encRB: string;
  ultraTrig: string;
  ultraEcho: string;
}

export interface RobotHardwareConfig {
  preset: RobotPresetId;
  robotName: string;
  mcu: RobotMcuId;
  sensorCount: SensorCount;
  sensorMode: SensorReadMode;
  hasEncoder: boolean;
  encoderPpr: number;
  ultrasonicMode: UltrasonicMode;
  hasGripper: boolean;
  motorPreset: MotorPresetId;
  motorRpm: number;
  wheelDiameterMm: number;
  robotScale: number;
  pins: RobotPinConfig;
  pids: [PIDProfile, PIDProfile, PIDProfile, PIDProfile, PIDProfile];
}

export interface RobotPlanStep {
  type: 'step';
  blockId?: string;
  index: number;
  action: PlanActionType;
  triggerValue: number;
  triggerUnit: PlanDurationUnit;
  triggerMode: PlanTriggerMode;
  /**
   * Strictly '0' and 'x' (length === sensorCount).
   * '0' = membaca sensor pada titik tersebut
   * 'x' = tidak membaca sensor (diabaikan) pada titik tersebut
   */
  sensorPattern: string;
  logicOp: PlanLogicOp;
  brake: number; // default 0 (ms brake)
  speedL: number;
  speedR: number;
  pidId: 0 | 1 | 2 | 3 | 4 | 5;
  speedA: number;
  timerValue: number;
  timerUnit: PlanDurationUnit;
  lineColor: PlanLineColor;
}

export interface RobotPlanStopItem {
  type: 'stop_here';
  blockId?: string;
  stage: StopHereStage;
}

export type RobotPlanItem = RobotPlanStep | RobotPlanStopItem;

export interface RobotPlan {
  planId: number; // 1..10
  blockId?: string;
  items: RobotPlanItem[];
}

export interface ActiveExecutionHighlight {
  running: boolean;
  planId: number | null;
  stepIndex: number | null;
  stage: 'ACTION' | 'BRAKE' | 'SPEED_A' | 'STOPPED' | 'FINISHED' | null;
  blockId: string | null;
  stoppedByInterrupt?: boolean;
}

export const MOTOR_PRESETS: Record<
  MotorPresetId,
  { label: string; rpm: number; wheelMm: number; desc: string }
> = {
  tt_200: {
    label: 'TT Gearbox Kuning (200 RPM)',
    rpm: 200,
    wheelMm: 65,
    desc: 'Motor edukasi standar torsi stabil',
  },
  n20_300: {
    label: 'N20 Metal Gear (300 RPM)',
    rpm: 300,
    wheelMm: 34,
    desc: 'Mini robot presisi & maze solving',
  },
  jga25_500: {
    label: 'JGA25-370 (500 RPM)',
    rpm: 500,
    wheelMm: 45,
    desc: 'Line follower menengah cepat',
  },
  n20_600: {
    label: 'N20 High-Speed (600 RPM)',
    rpm: 600,
    wheelMm: 34,
    desc: 'Kompetisi line follower lincah',
  },
  pg28_1000: {
    label: 'PG28 Pro Competition (1000 RPM)',
    rpm: 1000,
    wheelMm: 40,
    desc: 'Kecepatan tinggi lomba nasional',
  },
  custom: {
    label: 'Motor Custom (Atur RPM Sendiri)',
    rpm: 400,
    wheelMm: 42,
    desc: 'Sesuaikan RPM & roda dengan robot asli',
  },
};

export interface BoardPinOptions {
  pwmPins: string[];
  digitalPins: string[];
  analogPins: string[];
  interruptPins: string[];
}

export function getBoardPinOptions(mcu: RobotMcuId): BoardPinOptions {
  if (mcu === 'ESP32 DevKit V1') {
    return {
      pwmPins: ['25', '26', '27', '14', '32', '33', '12', '13', '15', '2', '4'],
      digitalPins: ['16', '17', '5', '18', '19', '21', '22', '23', '13', '12', '14', '27'],
      analogPins: ['34', '35', '36', '39', '32', '33'],
      interruptPins: ['18', '19', '21', '22', '23', '34', '35'],
    };
  }
  if (mcu === 'NodeMCU / ESP8266') {
    return {
      pwmPins: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
      digitalPins: ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8'],
      analogPins: ['A0'],
      interruptPins: ['D5', 'D6', 'D7', 'D1', 'D2'],
    };
  }
  if (mcu === 'Arduino Mega') {
    return {
      pwmPins: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'],
      digitalPins: ['22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35'],
      analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'],
      interruptPins: ['2', '3', '18', '19', '20', '21'],
    };
  }
  // Arduino Uno / Nano default
  return {
    pwmPins: ['3', '5', '6', '9', '10', '11'],
    digitalPins: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
    analogPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'],
    interruptPins: ['2', '3'],
  };
}

/**
 * Smart Pin Estimator: automatically allocates non-conflicting pins for PWM Motor,
 * Multiplexer (CD74HC4067 / 74HC4051) or Direct Sensors, Wheel Encoder interrupts, and Ultrasonic.
 */
export function estimateRobotPins(
  mcu: RobotMcuId,
  sensorCount: SensorCount,
  sensorMode: SensorReadMode
): RobotPinConfig {
  if (mcu === 'ESP32 DevKit V1') {
    return {
      pwmL: '25',
      dirL1: '26',
      dirL2: '27',
      pwmR: '14',
      dirR1: '12',
      dirR2: '13',
      sensorDirectPins: ['34', '35', '36', '39', '32', '33', '15', '4', '2', '16', '17', '5'].slice(0, sensorCount),
      muxS0: '16',
      muxS1: '17',
      muxS2: '5',
      muxS3: '23',
      muxSig: '34',
      encLA: '18',
      encLB: '19',
      encRA: '21',
      encRB: '22',
      ultraTrig: '32',
      ultraEcho: '33',
    };
  }

  if (mcu === 'NodeMCU / ESP8266') {
    return {
      pwmL: 'D1',
      dirL1: 'D3',
      dirL2: 'D4',
      pwmR: 'D2',
      dirR1: 'D7',
      dirR2: 'D8',
      sensorDirectPins: ['A0', 'D0', 'D5', 'D6', 'D7', 'D8'].slice(0, Math.min(sensorCount, 6)),
      muxS0: 'D0',
      muxS1: 'D3',
      muxS2: 'D4',
      muxS3: 'D8',
      muxSig: 'A0',
      encLA: 'D5',
      encLB: 'D5',
      encRA: 'D6',
      encRB: 'D6',
      ultraTrig: 'D7',
      ultraEcho: 'D8',
    };
  }

  if (mcu === 'Arduino Mega') {
    return {
      pwmL: '5',
      dirL1: '22',
      dirL2: '23',
      pwmR: '6',
      dirR1: '24',
      dirR2: '25',
      sensorDirectPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'].slice(
        0,
        sensorCount
      ),
      muxS0: '26',
      muxS1: '27',
      muxS2: '28',
      muxS3: '29',
      muxSig: 'A0',
      encLA: '2',
      encLB: '30',
      encRA: '3',
      encRB: '31',
      ultraTrig: '32',
      ultraEcho: '33',
    };
  }

  // Arduino Uno / Nano
  const useMux = sensorMode !== 'direct' || sensorCount > 6;
  return {
    pwmL: '5',
    dirL1: '4',
    dirL2: '7',
    pwmR: '6',
    dirR1: '8',
    dirR2: '9',
    sensorDirectPins: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'].slice(0, Math.min(sensorCount, 8)),
    muxS0: '10',
    muxS1: '11',
    muxS2: '12',
    muxS3: '13',
    muxSig: 'A0',
    encLA: '2',
    encLB: 'A4',
    encRA: '3',
    encRB: 'A5',
    ultraTrig: useMux ? 'A1' : '12',
    ultraEcho: useMux ? 'A2' : '13',
  };
}

/**
 * Automatically computes PID 1..5 combinations adapted to Motor RPM and Sensor Count.
 */
export function computeAutoPidProfiles(
  motorRpm: number,
  sensorCount: SensorCount
): [PIDProfile, PIDProfile, PIDProfile, PIDProfile, PIDProfile] {
  const rpmRatio = Math.max(0.4, Math.min(2.5, motorRpm / 350));
  const sensorFactor = Math.max(0.65, Math.min(1.6, 6 / sensorCount));
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return [
    {
      id: 1,
      label: 'PID 1 · Halus & Stabil',
      kp: round2(12 * sensorFactor * Math.sqrt(rpmRatio)),
      ki: round2(0.02),
      kd: round2(8 * rpmRatio),
      dt: motorRpm >= 600 ? 8 : 12,
    },
    {
      id: 2,
      label: 'PID 2 · Standar Track',
      kp: round2(18 * sensorFactor * Math.sqrt(rpmRatio)),
      ki: round2(0.05),
      kd: round2(14 * rpmRatio),
      dt: motorRpm >= 600 ? 6 : 10,
    },
    {
      id: 3,
      label: 'PID 3 · Tikungan Tajam',
      kp: round2(28 * sensorFactor * Math.sqrt(rpmRatio)),
      ki: round2(0.08),
      kd: round2(24 * rpmRatio),
      dt: motorRpm >= 600 ? 5 : 8,
    },
    {
      id: 4,
      label: 'PID 4 · Cepat / Sprint',
      kp: round2(22 * sensorFactor * Math.sqrt(rpmRatio)),
      ki: round2(0.0),
      kd: round2(32 * rpmRatio),
      dt: 5,
    },
    {
      id: 5,
      label: 'PID 5 · Presisi Simpang/Finis',
      kp: round2(15 * sensorFactor),
      ki: round2(0.18),
      kd: round2(11 * rpmRatio),
      dt: 10,
    },
  ];
}

/**
 * Normalizes a sensor point pattern so it ONLY contains '0' (baca sensor) and 'x' (tidak baca sensor)
 * and matches `sensorCount` characters.
 */
export function normalizeSensorPattern(raw: string, sensorCount: SensorCount): string {
  const cleaned = String(raw || '')
    .trim()
    .split('')
    .map((ch) => (ch === '0' ? '0' : 'x'))
    .join('');

  if (cleaned.length === sensorCount) return cleaned;
  if (cleaned.length > sensorCount) return cleaned.slice(0, sensorCount);

  // Build default symmetric pattern like 00xx00
  const defaultPattern = getDefaultSensorPattern(sensorCount);
  return (cleaned + defaultPattern.slice(cleaned.length)).slice(0, sensorCount);
}

export function getDefaultSensorPattern(sensorCount: SensorCount): string {
  if (sensorCount === 2) return '00';
  if (sensorCount === 4) return '0xx0';
  if (sensorCount === 5) return '0xxx0';
  if (sensorCount === 6) return '00xx00';
  if (sensorCount === 8) return '00xxxx00';
  return '000xxxxxx000';
}

export interface SensorPresetOption {
  id: string;
  label: string;
  pattern: string;
  category: 'center' | 'center_left' | 'center_right' | 'left' | 'right' | 'wings' | 'all' | 'custom';
  description?: string;
}

/**
 * Returns complete, hardware-calibrated sensor combination presets
 * adapted to the robot's active sensorCount (2, 4, 5, 6, 8, or 12 sensors).
 * Supports Center, Center-Left, Center-Right, multiple left/right detector widths,
 * wings (T-junction), and full intersection crosses.
 */
export function getSensorPresetOptions(sensorCount: SensorCount): SensorPresetOption[] {
  const makePat = (activeIndices: number[]): string => {
    const arr = Array(sensorCount).fill('x');
    for (const idx of activeIndices) {
      if (idx >= 0 && idx < sensorCount) arr[idx] = '0';
    }
    return arr.join('');
  };

  const options: SensorPresetOption[] = [];

  // 1. Tengah (Lurus)
  if (sensorCount === 2) {
    options.push({
      id: 'center',
      label: '🎯 Tengah · 2 Sensor (S0, S1)',
      pattern: makePat([0, 1]),
      category: 'center',
      description: 'Membaca kedua sensor di tengah garis',
    });
  } else if (sensorCount % 2 === 1) {
    const mid = Math.floor(sensorCount / 2);
    options.push({
      id: 'center',
      label: `🎯 Tengah · 1 Sensor Tengah (S${mid})`,
      pattern: makePat([mid]),
      category: 'center',
      description: 'Sensor paling tengah tepat di atas garis',
    });
  } else {
    const midL = sensorCount / 2 - 1;
    const midR = sensorCount / 2;
    options.push({
      id: 'center',
      label: `🎯 Tengah · 2 Sensor Tengah (S${midL}, S${midR})`,
      pattern: makePat([midL, midR]),
      category: 'center',
      description: 'Dua sensor tengah mendeteksi garis lurus',
    });
  }

  // 2. Tengah Kiri
  if (sensorCount === 2) {
    options.push({
      id: 'center_left',
      label: '↖️ Tengah Kiri · Sensor Kiri (S0)',
      pattern: makePat([0]),
      category: 'center_left',
      description: 'Garis condong agak ke kiri',
    });
  } else if (sensorCount === 4) {
    options.push({
      id: 'center_left',
      label: '↖️ Tengah Kiri · Sensor S1',
      pattern: makePat([1]),
      category: 'center_left',
    });
  } else if (sensorCount === 5) {
    options.push({
      id: 'center_left_1',
      label: '↖️ Tengah Kiri · Sensor S1',
      pattern: makePat([1]),
      category: 'center_left',
    });
    options.push({
      id: 'center_left_2',
      label: '↖️ Tengah Kiri · 2 Sensor (S1, S2)',
      pattern: makePat([1, 2]),
      category: 'center_left',
    });
  } else if (sensorCount === 6) {
    options.push({
      id: 'center_left_1',
      label: '↖️ Tengah Kiri · 1 Sensor (S2)',
      pattern: makePat([2]),
      category: 'center_left',
    });
    options.push({
      id: 'center_left_2',
      label: '↖️ Tengah Kiri · 2 Sensor (S1, S2)',
      pattern: makePat([1, 2]),
      category: 'center_left',
    });
  } else if (sensorCount === 8) {
    options.push({
      id: 'center_left_1',
      label: '↖️ Tengah Kiri · 1 Sensor (S3)',
      pattern: makePat([3]),
      category: 'center_left',
    });
    options.push({
      id: 'center_left_2',
      label: '↖️ Tengah Kiri · 2 Sensor (S2, S3)',
      pattern: makePat([2, 3]),
      category: 'center_left',
    });
  } else {
    // 12 sensor
    options.push({
      id: 'center_left_1',
      label: '↖️ Tengah Kiri · 2 Sensor (S4, S5)',
      pattern: makePat([4, 5]),
      category: 'center_left',
    });
    options.push({
      id: 'center_left_2',
      label: '↖️ Tengah Kiri · 3 Sensor (S3..S5)',
      pattern: makePat([3, 4, 5]),
      category: 'center_left',
    });
  }

  // 3. Tengah Kanan
  if (sensorCount === 2) {
    options.push({
      id: 'center_right',
      label: '↗️ Tengah Kanan · Sensor Kanan (S1)',
      pattern: makePat([1]),
      category: 'center_right',
      description: 'Garis condong agak ke kanan',
    });
  } else if (sensorCount === 4) {
    options.push({
      id: 'center_right',
      label: '↗️ Tengah Kanan · Sensor S2',
      pattern: makePat([2]),
      category: 'center_right',
    });
  } else if (sensorCount === 5) {
    options.push({
      id: 'center_right_1',
      label: '↗️ Tengah Kanan · Sensor S3',
      pattern: makePat([3]),
      category: 'center_right',
    });
    options.push({
      id: 'center_right_2',
      label: '↗️ Tengah Kanan · 2 Sensor (S2, S3)',
      pattern: makePat([2, 3]),
      category: 'center_right',
    });
  } else if (sensorCount === 6) {
    options.push({
      id: 'center_right_1',
      label: '↗️ Tengah Kanan · 1 Sensor (S3)',
      pattern: makePat([3]),
      category: 'center_right',
    });
    options.push({
      id: 'center_right_2',
      label: '↗️ Tengah Kanan · 2 Sensor (S3, S4)',
      pattern: makePat([3, 4]),
      category: 'center_right',
    });
  } else if (sensorCount === 8) {
    options.push({
      id: 'center_right_1',
      label: '↗️ Tengah Kanan · 1 Sensor (S4)',
      pattern: makePat([4]),
      category: 'center_right',
    });
    options.push({
      id: 'center_right_2',
      label: '↗️ Tengah Kanan · 2 Sensor (S4, S5)',
      pattern: makePat([4, 5]),
      category: 'center_right',
    });
  } else {
    // 12 sensor
    options.push({
      id: 'center_right_1',
      label: '↗️ Tengah Kanan · 2 Sensor (S6, S7)',
      pattern: makePat([6, 7]),
      category: 'center_right',
    });
    options.push({
      id: 'center_right_2',
      label: '↗️ Tengah Kanan · 3 Sensor (S6..S8)',
      pattern: makePat([6, 7, 8]),
      category: 'center_right',
    });
  }

  // 4. Kiri: Beberapa Pilihan Banyak Sensor yang Terdeteksi
  const maxLeft = Math.max(1, Math.min(sensorCount - 1, Math.floor(sensorCount / 2) + 1));
  for (let k = 1; k <= maxLeft; k++) {
    const indices = Array.from({ length: k }, (_, i) => i);
    const pat = makePat(indices);
    let name = `⬅️ Kiri · ${k} Sensor`;
    if (k === 1) name += ' Terluar (S0)';
    else if (k === Math.floor(sensorCount / 2)) name += ' (Separuh Kiri)';
    else name += ` (S0..S${k - 1})`;

    options.push({
      id: `left_${k}`,
      label: name,
      pattern: pat,
      category: 'left',
      description: `Mendeteksi cabang / belokan kiri (${k} sensor)`,
    });
  }

  // 5. Kanan: Beberapa Pilihan Banyak Sensor yang Terdeteksi
  const maxRight = maxLeft;
  for (let k = 1; k <= maxRight; k++) {
    const indices = Array.from({ length: k }, (_, i) => sensorCount - 1 - i);
    const pat = makePat(indices);
    let name = `➡️ Kanan · ${k} Sensor`;
    if (k === 1) name += ` Terluar (S${sensorCount - 1})`;
    else if (k === Math.floor(sensorCount / 2)) name += ' (Separuh Kanan)';
    else name += ` (S${sensorCount - k}..S${sensorCount - 1})`;

    options.push({
      id: `right_${k}`,
      label: name,
      pattern: pat,
      category: 'right',
      description: `Mendeteksi cabang / belokan kanan (${k} sensor)`,
    });
  }

  // 6. Kanan & Kiri: Sayap / Simpang T / Melintang Parsial
  if (sensorCount >= 4) {
    options.push({
      id: 'wings_1',
      label: `↔️ Kanan & Kiri · 1 Sensor Sayap (S0, S${sensorCount - 1})`,
      pattern: makePat([0, sensorCount - 1]),
      category: 'wings',
      description: 'Sensor paling kiri dan paling kanan mendeteksi sayap / simpang T',
    });
  }
  if (sensorCount >= 5) {
    options.push({
      id: 'wings_2',
      label: `↔️ Kanan & Kiri · 2 Sensor Sayap (S0,S1 & S${sensorCount - 2},S${sensorCount - 1})`,
      pattern: makePat([0, 1, sensorCount - 2, sensorCount - 1]),
      category: 'wings',
      description: 'Dua sensor kiri dan dua sensor kanan mendeteksi sayap garis',
    });
  }
  if (sensorCount >= 8) {
    options.push({
      id: 'wings_3',
      label: `↔️ Kanan & Kiri · 3 Sensor Sayap`,
      pattern: makePat([0, 1, 2, sensorCount - 3, sensorCount - 2, sensorCount - 1]),
      category: 'wings',
    });
  }

  // 7. Semua Sensor (Perempatan / Full Cross Line)
  options.push({
    id: 'cross_all',
    label: `➕ Semua Sensor · Perempatan / Cross (${sensorCount} Sensor)`,
    pattern: '0'.repeat(sensorCount),
    category: 'all',
    description: 'Semua sensor mendeteksi garis (garis melintang / perempatan)',
  });

  return options;
}

export function findMatchingSensorPreset(
  pattern: string,
  sensorCount: SensorCount
): SensorPresetOption | null {
  const norm = normalizeSensorPattern(pattern, sensorCount);
  const options = getSensorPresetOptions(sensorCount);
  return options.find((opt) => opt.pattern === norm) || null;
}

export function createDefaultRobotHardwareConfig(): RobotHardwareConfig {
  const mcu: RobotMcuId = 'Arduino Uno';
  const sensorCount: SensorCount = 6;
  const sensorMode: SensorReadMode = 'mux_4067';
  const motorRpm = 300;
  return {
    preset: 'line_follower',
    robotName: 'Robot Line Follower',
    mcu,
    sensorCount,
    sensorMode,
    hasEncoder: true,
    encoderPpr: 20,
    ultrasonicMode: 'front',
    hasGripper: false,
    motorPreset: 'n20_300',
    motorRpm,
    wheelDiameterMm: 34,
    robotScale: 1.0,
    pins: estimateRobotPins(mcu, sensorCount, sensorMode),
    pids: computeAutoPidProfiles(motorRpm, sensorCount),
  };
}

export function createDefaultRobotPlans(sensorCount: SensorCount = 6): RobotPlan[] {
  const patCross = '0'.repeat(sensorCount);
  const patCenter = getDefaultSensorPattern(sensorCount);
  return [
    {
      planId: 1,
      items: [
        {
          type: 'step',
          index: 0,
          action: 'MAJU',
          triggerValue: 100,
          triggerUnit: 'ms',
          triggerMode: 'SENSOR',
          sensorPattern: patCross,
          logicOp: 'EQUAL',
          brake: 20,
          speedL: 160,
          speedR: 160,
          pidId: 2,
          speedA: 120,
          timerValue: 150,
          timerUnit: 'ms',
          lineColor: 'HITAM',
        },
        {
          type: 'step',
          index: 1,
          action: 'RIGHT',
          triggerValue: 80,
          triggerUnit: 'ms',
          triggerMode: 'SENSOR',
          sensorPattern: patCenter,
          logicOp: 'OR',
          brake: 15,
          speedL: 140,
          speedR: -140,
          pidId: 3,
          speedA: 130,
          timerValue: 120,
          timerUnit: 'ms',
          lineColor: 'HITAM',
        },
        {
          type: 'step',
          index: 2,
          action: 'MAJU',
          triggerValue: 100,
          triggerUnit: 'ms',
          triggerMode: 'SENSOR',
          sensorPattern: patCross,
          logicOp: 'EQUAL',
          brake: 30,
          speedL: 170,
          speedR: 170,
          pidId: 4,
          speedA: 0,
          timerValue: 100,
          timerUnit: 'ms',
          lineColor: 'HITAM',
        },
      ],
    },
  ];
}

/**
 * Evaluates whether the current active sensor array matches the user's '0' / 'x' pattern.
 * Note:
 * - '0' in pattern means this sensor point IS READ (checked for line detection)
 * - 'x' in pattern means this sensor point IS NOT READ (ignored)
 */
export function evaluateSensorPatternMatch(
  sensorOnLine: boolean[],
  pattern: string,
  logicOp: PlanLogicOp
): boolean {
  const checkedIndices: number[] = [];
  for (let i = 0; i < pattern.length && i < sensorOnLine.length; i++) {
    if (pattern[i] === '0') {
      checkedIndices.push(i);
    }
  }
  if (checkedIndices.length === 0) return true;

  if (logicOp === 'EQUAL' || logicOp === 'AND') {
    // All '0' (read) sensor points must detect the line
    return checkedIndices.every((idx) => sensorOnLine[idx]);
  }
  if (logicOp === 'OR') {
    // At least one '0' (read) sensor point detects the line
    return checkedIndices.some((idx) => sensorOnLine[idx]);
  }
  if (logicOp === 'XOR') {
    // Exactly an odd number (typically 1) of '0' (read) sensor points detect the line
    const activeCount = checkedIndices.filter((idx) => sensorOnLine[idx]).length;
    return activeCount % 2 === 1;
  }
  return false;
}

/**
 * Generates complete, hardware-ready Arduino C++ (.ino) code from RobotHardwareConfig + RobotPlan list.
 */
export function generateRobotPlanArduinoCode(
  hw: RobotHardwareConfig,
  plans: RobotPlan[],
  activePlanToRun = 1
): string {
  const p = hw.pins;
  const useMux = hw.sensorMode !== 'direct';
  const isMux16 = hw.sensorMode === 'mux_4067';

  const pidLines = hw.pids
    .map(
      (pid) =>
        `  { ${pid.kp.toFixed(2)}f, ${pid.ki.toFixed(3)}f, ${pid.kd.toFixed(2)}f, ${pid.dt} } // PID ${pid.id}: ${pid.label}`
    )
    .join('\n');

  const sensorPinSection = useMux
    ? `// Sensor Garis via Multiplexer (${isMux16 ? 'CD74HC4067 16-Ch' : '74HC4051 8-Ch'})
#define MUX_S0 ${p.muxS0}
#define MUX_S1 ${p.muxS1}
#define MUX_S2 ${p.muxS2}
${isMux16 ? `#define MUX_S3 ${p.muxS3}\n` : ''}#define MUX_SIG ${p.muxSig}`
    : `// Sensor Garis Direct Pin (${hw.sensorCount} Sensor)
const int SENSOR_PINS[${hw.sensorCount}] = { ${p.sensorDirectPins.slice(0, hw.sensorCount).join(', ')} };`;

  const encoderSection = hw.hasEncoder
    ? `// Wheel Encoder Interrupt (${hw.encoderPpr} PPR)
#define ENC_L_PIN ${p.encLA}
#define ENC_R_PIN ${p.encRA}
volatile long encLeftCount = 0;
volatile long encRightCount = 0;
void isrEncL() { encLeftCount++; }
void isrEncR() { encRightCount++; }`
    : `// Mode Tanpa Encoder (Timer menggunakan ms)`;

  const ultraSection =
    hw.ultrasonicMode !== 'none'
      ? `// Sensor Ultrasonic HC-SR04
#define ULTRA_TRIG ${p.ultraTrig}
#define ULTRA_ECHO ${p.ultraEcho}
long readUltrasonicCm() {
  digitalWrite(ULTRA_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(ULTRA_TRIG, HIGH); delayMicroseconds(10);
  digitalWrite(ULTRA_TRIG, LOW);
  long dur = pulseIn(ULTRA_ECHO, HIGH, 25000);
  return dur == 0 ? 999 : (dur * 0.034 / 2);
}`
      : '';

  const planFunctions = plans
    .map((plan) => {
      const bodyLines: string[] = [];
      let lastStepIdx = 0;
      for (const item of plan.items) {
        if (item.type === 'step') {
          lastStepIdx = item.index;
          const nextIdx = plan.items.indexOf(item) + 1;
          const nextItem = plan.items[nextIdx];
          const stopAtAction =
            nextItem && nextItem.type === 'stop_here' && nextItem.stage === 'ACTION';
          const stopAtSpeedA =
            nextItem && nextItem.type === 'stop_here' && nextItem.stage === 'SPEED_A';
          const trigVal = item.triggerValue ?? 100;

          bodyLines.push(
            `  // Index ${item.index}: ${item.action} (${trigVal} ${item.triggerUnit}) | Jika ${item.triggerMode === 'MOTION' ? 'MOTION' : `${item.sensorPattern} (${item.logicOp})`} | PID ${item.pidId} | Garis ${item.lineColor}`
          );
          bodyLines.push(
            `  runStep(${item.index}, ACT_${item.action}, ${trigVal}, UNIT_${item.triggerUnit.toUpperCase()}, "${item.triggerMode === 'MOTION' ? 'MOTION' : normalizeSensorPattern(item.sensorPattern, hw.sensorCount)}", OP_${item.logicOp}, ${item.brake}, ${item.speedL}, ${item.speedR}, ${item.pidId}, ${item.speedA}, ${item.timerValue}, UNIT_${item.timerUnit.toUpperCase()}, LINE_${item.lineColor}${stopAtAction ? ', STOP_AT_ACTION' : stopAtSpeedA ? ', STOP_AT_SPEED_A' : ', STOP_NONE'});`
          );
          if (stopAtAction || stopAtSpeedA) {
            bodyLines.push(
              `  // 🛑 Stop Disini pada Index ${lastStepIdx} (Tahap ${stopAtAction ? 'ACTION' : 'SPEED_A'})`
            );
            bodyLines.push(`  stopRobotForever(); return;`);
          }
        }
      }
      if (bodyLines.length === 0) {
        bodyLines.push('  stopMotors();');
      }
      return `void plan${plan.planId}() {\n${bodyLines.join('\n')}\n}`;
    })
    .join('\n\n');

  return `// ============================================================================
// ROBOLAB STUDIO - AUTO-GENERATED ROBOT PLAN & HARDWARE CONFIGURATION
// Board: ${hw.mcu} | Robot: ${hw.robotName} | Sensor: ${hw.sensorCount} (${hw.sensorMode.toUpperCase()})
// Motor: ${hw.motorRpm} RPM (Ø${hw.wheelDiameterMm}mm) | Encoder: ${hw.hasEncoder ? 'YA' : 'TIDAK'} | Ultrasonic: ${hw.ultrasonicMode.toUpperCase()}
// ============================================================================

#define MOTOR_PWM_L ${p.pwmL}
#define MOTOR_DIR_L1 ${p.dirL1}
#define MOTOR_DIR_L2 ${p.dirL2}
#define MOTOR_PWM_R ${p.pwmR}
#define MOTOR_DIR_R1 ${p.dirR1}
#define MOTOR_DIR_R2 ${p.dirR2}
#define NUM_SENSORS ${hw.sensorCount}
#define MOTOR_RPM ${hw.motorRpm}

${sensorPinSection}
${encoderSection}
${ultraSection}

enum ActionType { ACT_MAJU, ACT_MUNDUR, ACT_LEFT, ACT_RIGHT, ACT_PAUSE };
enum LogicOp { OP_EQUAL, OP_AND, OP_OR, OP_XOR };
enum DurationUnit { UNIT_MS, UNIT_ENC_L, UNIT_ENC_R };
enum LineColor { LINE_HITAM, LINE_PUTIH };
enum StopStage { STOP_NONE, STOP_AT_ACTION, STOP_AT_SPEED_A };

struct PIDConfig { float kp; float ki; float kd; int dt; };
PIDConfig pidList[5] = {
${pidLines}
};

bool sensorState[NUM_SENSORS];
float pidIntegral = 0, pidLastError = 0;

void setMotorSpeed(int speedL, int speedR) {
  speedL = constrain(speedL, -255, 255);
  speedR = constrain(speedR, -255, 255);
  digitalWrite(MOTOR_DIR_L1, speedL >= 0 ? HIGH : LOW);
  digitalWrite(MOTOR_DIR_L2, speedL >= 0 ? LOW : HIGH);
  analogWrite(MOTOR_PWM_L, abs(speedL));
  digitalWrite(MOTOR_DIR_R1, speedR >= 0 ? HIGH : LOW);
  digitalWrite(MOTOR_DIR_R2, speedR >= 0 ? LOW : HIGH);
  analogWrite(MOTOR_PWM_R, abs(speedR));
}

void stopMotors() { setMotorSpeed(0, 0); }
void stopRobotForever() { stopMotors(); while (true) { delay(100); } }

void readAllSensors(LineColor lineColor) {
  for (int i = 0; i < NUM_SENSORS; i++) {
${
  useMux
    ? `    digitalWrite(MUX_S0, i & 0x01);
    digitalWrite(MUX_S1, (i >> 1) & 0x01);
    digitalWrite(MUX_S2, (i >> 2) & 0x01);
${isMux16 ? '    digitalWrite(MUX_S3, (i >> 3) & 0x01);\n' : ''}    delayMicroseconds(10);
    int raw = analogRead(MUX_SIG);`
    : `    int raw = analogRead(SENSOR_PINS[i]);`
}
    bool isDark = (raw > 512);
    sensorState[i] = (lineColor == LINE_HITAM) ? isDark : !isDark;
  }
}

// Pola Poin Sensor: '0' = membaca sensor, 'x' = tidak membaca sensor
bool matchSensorPattern(const char* pattern, LogicOp op, LineColor lineColor) {
  if (pattern[0] == 'M') return true; // MOTION (tidak baca sensor)
  readAllSensors(lineColor);
  int checked = 0, active = 0;
  for (int i = 0; i < NUM_SENSORS && pattern[i] != '\\0'; i++) {
    if (pattern[i] == '0') {
      checked++;
      if (sensorState[i]) active++;
    }
  }
  if (checked == 0) return true;
  if (op == OP_EQUAL || op == OP_AND) return active == checked;
  if (op == OP_OR) return active > 0;
  if (op == OP_XOR) return (active % 2) == 1;
  return false;
}

void waitDuration(long targetVal, DurationUnit unit) {
  if (targetVal <= 0) return;
${
  hw.hasEncoder
    ? `  if (unit == UNIT_ENC_L) {
    long startL = encLeftCount;
    while ((encLeftCount - startL) < targetVal) { delay(1); }
    return;
  }
  if (unit == UNIT_ENC_R) {
    long startR = encRightCount;
    while ((encRightCount - startR) < targetVal) { delay(1); }
    return;
  }`
    : ''
}
  delay(targetVal);
}

void runStep(
  int idx, ActionType act, long trigVal, DurationUnit trigUnit,
  const char* pattern, LogicOp op,
  int brakeMs, int speedL, int speedR,
  int pidId, int speedA, long timerVal, DurationUnit timerUnit,
  LineColor lineColor, StopStage stopStage = STOP_NONE
) {
  if (act == ACT_PAUSE) {
    stopMotors();
    waitDuration(trigVal > 0 ? trigVal : timerVal, trigVal > 0 ? trigUnit : timerUnit);
    return;
  }
  // Tahap 1: Action & Durasi Aksi (ms / Encoder L / Encoder R) / Sensor PID
  int actSpeedL = speedL;
  int actSpeedR = speedR;
  if (act == ACT_LEFT) {
    actSpeedL = (speedL < 0 || (speedL == 0 && speedR > 0)) ? speedL : -abs(speedL);
    actSpeedR = (speedL < 0 || (speedL == 0 && speedR > 0)) ? speedR : abs(speedR);
  } else if (act == ACT_RIGHT) {
    actSpeedL = (speedR < 0 || (speedR == 0 && speedL > 0)) ? speedL : abs(speedL);
    actSpeedR = (speedR < 0 || (speedR == 0 && speedL > 0)) ? speedR : -abs(speedR);
  } else if (act == ACT_MUNDUR) {
    actSpeedL = -abs(speedL);
    actSpeedR = -abs(speedR);
  } else if (act == ACT_PAUSE) {
    actSpeedL = 0;
    actSpeedR = 0;
  }
  setMotorSpeed(actSpeedL, actSpeedR);
  if (trigVal > 0) {
    waitDuration(trigVal, trigUnit);
  }
  if (pattern[0] != 'M') {
    while (!matchSensorPattern(pattern, op, lineColor)) {
      setMotorSpeed(actSpeedL, actSpeedR);
      delay(pidId >= 1 && pidId <= 5 ? pidList[pidId - 1].dt : 5);
    }
  }
  // Brake
  if (brakeMs > 0) {
    setMotorSpeed(-actSpeedL / 2, -actSpeedR / 2);
    delay(brakeMs);
    stopMotors();
  }
  if (stopStage == STOP_AT_ACTION) {
    stopMotors();
    return;
  }
  // Tahap 2: Lanjut Speed A selama Timer
  if (timerVal > 0) {
    int dirL = (act == ACT_LEFT) ? -speedA : (act == ACT_MUNDUR ? -speedA : speedA);
    int dirR = (act == ACT_RIGHT) ? -speedA : (act == ACT_MUNDUR ? -speedA : speedA);
    setMotorSpeed(dirL, dirR);
    waitDuration(timerVal, timerUnit);
  }
  if (stopStage == STOP_AT_SPEED_A) {
    stopMotors();
  }
}

${planFunctions}

void setup() {
  Serial.begin(115200);
  pinMode(MOTOR_PWM_L, OUTPUT);
  pinMode(MOTOR_DIR_L1, OUTPUT);
  pinMode(MOTOR_DIR_L2, OUTPUT);
  pinMode(MOTOR_PWM_R, OUTPUT);
  pinMode(MOTOR_DIR_R1, OUTPUT);
  pinMode(MOTOR_DIR_R2, OUTPUT);
${
  useMux
    ? `  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
${isMux16 ? '  pinMode(MUX_S3, OUTPUT);\n' : ''}`
    : ''
}${
    hw.hasEncoder
      ? `  pinMode(ENC_L_PIN, INPUT_PULLUP);
  pinMode(ENC_R_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(ENC_L_PIN), isrEncL, RISING);
  attachInterrupt(digitalPinToInterrupt(ENC_R_PIN), isrEncR, RISING);\n`
      : ''
  }${
    hw.ultrasonicMode !== 'none'
      ? `  pinMode(ULTRA_TRIG, OUTPUT);
  pinMode(ULTRA_ECHO, INPUT);\n`
      : ''
  }  plan${activePlanToRun}();
  stopMotors();
}

void loop() {
  // Plan selesai dieksekusi di setup()
}
`;
}

/**
 * Generates equivalent MicroPython (.py) code from RobotHardwareConfig + RobotPlan list.
 */
export function generateRobotPlanPythonCode(
  hw: RobotHardwareConfig,
  plans: RobotPlan[],
  activePlanToRun = 1
): string {
  const p = hw.pins;
  const pidEntries = hw.pids
    .map(
      (pid) =>
        `    ${pid.id}: {"kp": ${pid.kp.toFixed(2)}, "ki": ${pid.ki.toFixed(3)}, "kd": ${pid.kd.toFixed(2)}, "dt": ${pid.dt}}, # ${pid.label}`
    )
    .join('\n');

  const planDefs = plans
    .map((plan) => {
      const lines: string[] = [];
      for (let i = 0; i < plan.items.length; i++) {
        const item = plan.items[i];
        if (item.type === 'step') {
          const nextItem = plan.items[i + 1];
          const stopStage =
            nextItem && nextItem.type === 'stop_here' ? nextItem.stage : 'NONE';
          const trigVal = item.triggerValue ?? 100;
          lines.push(
            `    # Index ${item.index}: ${item.action} (${trigVal} ${item.triggerUnit}) | Jika ${item.triggerMode === 'MOTION' ? 'MOTION' : item.sensorPattern} (${item.logicOp})`
          );
          lines.push(
            `    run_step(${item.index}, "${item.action}", ${trigVal}, "${item.triggerUnit}", "${item.triggerMode === 'MOTION' ? 'MOTION' : normalizeSensorPattern(item.sensorPattern, hw.sensorCount)}", "${item.logicOp}", ${item.brake}, ${item.speedL}, ${item.speedR}, ${item.pidId}, ${item.speedA}, ${item.timerValue}, "${item.timerUnit}", "${item.lineColor}", "${stopStage}")`
          );
          if (stopStage !== 'NONE') {
            lines.push(`    stop_motors()`);
            lines.push(`    return  # 🛑 Stop Disini (Tahap ${stopStage})`);
          }
        }
      }
      if (lines.length === 0) lines.push('    stop_motors()');
      return `def plan_${plan.planId}():\n${lines.join('\n')}`;
    })
    .join('\n\n');

  return `# ============================================================================
# ROBOLAB STUDIO - AUTO-GENERATED MICROPYTHON ROBOT PLAN
# Board: ${hw.mcu} | Sensor: ${hw.sensorCount} (${hw.sensorMode}) | Motor: ${hw.motorRpm} RPM
# ============================================================================
from machine import Pin, PWM, ADC
import time

MOTOR_PWM_L = "${p.pwmL}"
MOTOR_PWM_R = "${p.pwmR}"
NUM_SENSORS = ${hw.sensorCount}
MOTOR_RPM = ${hw.motorRpm}
HAS_ENCODER = ${hw.hasEncoder ? 'True' : 'False'}

PID_PROFILES = {
${pidEntries}
}

def set_motor_speed(speed_l, speed_r):
    pass

def stop_motors():
    set_motor_speed(0, 0)

def run_step(idx, action, trig_val, trig_unit, pattern, logic_op, brake_ms, speed_l, speed_r, pid_id, speed_a, timer_val, timer_unit, line_color, stop_stage="NONE"):
    # Pola Sensor: '0' = membaca sensor, 'x' = tidak membaca sensor
    act_l, act_r = speed_l, speed_r
    if action == "LEFT":
        act_l = speed_l if (speed_l < 0 or (speed_l == 0 and speed_r > 0)) else -abs(speed_l)
        act_r = speed_r if (speed_l < 0 or (speed_l == 0 and speed_r > 0)) else abs(speed_r)
    elif action == "RIGHT":
        act_l = speed_l if (speed_r < 0 or (speed_r == 0 and speed_l > 0)) else abs(speed_l)
        act_r = speed_r if (speed_r < 0 or (speed_r == 0 and speed_l > 0)) else -abs(speed_r)
    elif action == "MUNDUR":
        act_l, act_r = -abs(speed_l), -abs(speed_r)
    elif action == "PAUSE":
        act_l, act_r = 0, 0
    set_motor_speed(act_l, act_r)
    if trig_val > 0:
        time.sleep_ms(trig_val)
    if brake_ms > 0:
        set_motor_speed(-act_l // 2, -act_r // 2)
        time.sleep_ms(brake_ms)
        stop_motors()
    if stop_stage == "ACTION":
        stop_motors()
        return
    if timer_val > 0:
        dir_l = -speed_a if action in ("LEFT", "MUNDUR") else speed_a
        dir_r = -speed_a if action in ("RIGHT", "MUNDUR") else speed_a
        set_motor_speed(dir_l, dir_r)
        time.sleep_ms(timer_val)
    if stop_stage == "SPEED_A":
        stop_motors()

${planDefs}

# Jalankan Plan ${activePlanToRun}
plan_${activePlanToRun}()
stop_motors()
`;
}

/**
 * Parses runStep(...) or run_step(...) calls from Arduino (.ino) or Python (.py) code
 * so manual code edits also drive the 3D Robot Simulator accurately.
 */
export function parseRobotPlansFromCode(
  code: string,
  sensorCount: SensorCount
): { plans: RobotPlan[]; activePlanId: number } | null {
  if (!code || (!code.includes('runStep(') && !code.includes('run_step('))) {
    return null;
  }

  const plans: RobotPlan[] = [];
  // Match C++ void planN() { ... }
  const cppPlanRegex = /void\s+plan(\d+)\s*\(\s*\)\s*\{([\s\S]*?)\}/g;
  let match: RegExpExecArray | null;
  while ((match = cppPlanRegex.exec(code)) !== null) {
    const planId = parseInt(match[1], 10);
    const body = match[2];
    const items: RobotPlanItem[] = [];
    // New format: runStep(idx, ACT_..., trigVal, UNIT_..., "pattern", OP_..., brake, speedL, speedR, pidId, speedA, timerVal, UNIT_..., LINE_..., STOP_...)
    const newStepRegex =
      /runStep\(\s*(\d+)\s*,\s*ACT_(\w+)\s*,\s*(-?\d+)\s*,\s*UNIT_(\w+)\s*,\s*"([^"]*)"\s*,\s*OP_(\w+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*UNIT_(\w+)\s*,\s*LINE_(\w+)(?:\s*,\s*STOP_(\w+))?\s*\)/g;
    let sm: RegExpExecArray | null;
    while ((sm = newStepRegex.exec(body)) !== null) {
      const rawPat = sm[5];
      const trigMode: PlanTriggerMode = rawPat === 'MOTION' ? 'MOTION' : 'SENSOR';
      const step: RobotPlanStep = {
        type: 'step',
        index: parseInt(sm[1], 10),
        action: (sm[2] as PlanActionType) || 'MAJU',
        triggerValue: parseInt(sm[3], 10) || 0,
        triggerUnit: (sm[4].toLowerCase() as PlanDurationUnit) || 'ms',
        triggerMode: trigMode,
        sensorPattern:
          trigMode === 'MOTION'
            ? getDefaultSensorPattern(sensorCount)
            : normalizeSensorPattern(rawPat, sensorCount),
        logicOp: (sm[6] as PlanLogicOp) || 'EQUAL',
        brake: parseInt(sm[7], 10) || 0,
        speedL: parseInt(sm[8], 10) || 0,
        speedR: parseInt(sm[9], 10) || 0,
        pidId: (parseInt(sm[10], 10) as 0 | 1 | 2 | 3 | 4 | 5) || 1,
        speedA: parseInt(sm[11], 10) || 0,
        timerValue: parseInt(sm[12], 10) || 0,
        timerUnit: (sm[13].toLowerCase() as PlanDurationUnit) || 'ms',
        lineColor: (sm[14] as PlanLineColor) || 'HITAM',
      };
      items.push(step);
      const stopFlag = sm[15];
      if (stopFlag === 'AT_ACTION') {
        items.push({ type: 'stop_here', stage: 'ACTION' });
      } else if (stopFlag === 'AT_SPEED_A') {
        items.push({ type: 'stop_here', stage: 'SPEED_A' });
      }
    }

    // Legacy format fallback if no new-format steps matched
    if (items.length === 0) {
      const legacyStepRegex =
        /runStep\(\s*(\d+)\s*,\s*ACT_(\w+)\s*,\s*"([^"]*)"\s*,\s*OP_(\w+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*UNIT_(\w+)\s*,\s*(\d+)\s*,\s*(-?\d+)\s*,\s*(\d+)\s*,\s*UNIT_(\w+)\s*,\s*LINE_(\w+)(?:\s*,\s*STOP_(\w+))?\s*\)/g;
      while ((sm = legacyStepRegex.exec(body)) !== null) {
        const rawPat = sm[3];
        const trigMode: PlanTriggerMode = rawPat === 'MOTION' ? 'MOTION' : 'SENSOR';
        const step: RobotPlanStep = {
          type: 'step',
          index: parseInt(sm[1], 10),
          action: (sm[2] as PlanActionType) || 'MAJU',
          triggerValue: 100,
          triggerUnit: (sm[8].toLowerCase() as PlanDurationUnit) || 'ms',
          triggerMode: trigMode,
          sensorPattern:
            trigMode === 'MOTION'
              ? getDefaultSensorPattern(sensorCount)
              : normalizeSensorPattern(rawPat, sensorCount),
          logicOp: (sm[4] as PlanLogicOp) || 'EQUAL',
          brake: parseInt(sm[5], 10) || 0,
          speedL: parseInt(sm[6], 10) || 0,
          speedR: parseInt(sm[7], 10) || 0,
          pidId: (parseInt(sm[9], 10) as 0 | 1 | 2 | 3 | 4 | 5) || 1,
          speedA: parseInt(sm[10], 10) || 0,
          timerValue: parseInt(sm[11], 10) || 0,
          timerUnit: (sm[12].toLowerCase() as PlanDurationUnit) || 'ms',
          lineColor: (sm[13] as PlanLineColor) || 'HITAM',
        };
        items.push(step);
        const stopFlag = sm[14];
        if (stopFlag === 'AT_ACTION') {
          items.push({ type: 'stop_here', stage: 'ACTION' });
        } else if (stopFlag === 'AT_SPEED_A') {
          items.push({ type: 'stop_here', stage: 'SPEED_A' });
        }
      }
    }

    if (items.length > 0) {
      plans.push({ planId, items });
    }
  }

  const callMatch = code.match(/\bplan_?(\d+)\s*\(\s*\)/);
  const activePlanId = callMatch ? parseInt(callMatch[1], 10) : plans[0]?.planId || 1;
  return plans.length > 0 ? { plans, activePlanId } : null;
}

/**
 * Generates Blockly Workspace XML for RobotHardwareConfig + RobotPlan[],
 * assigning deterministic block IDs so the live glowing highlight works immediately.
 */
export function buildRobotPlanBlocklyXml(
  hw: RobotHardwareConfig,
  plans: RobotPlan[],
  activePlanId = 1
): { xml: string; plansWithBlockIds: RobotPlan[] } {
  const plansWithBlockIds: RobotPlan[] = plans.map((plan) => ({
    ...plan,
    blockId: `block_plan_container_${plan.planId}`,
    items: plan.items.map((it, idx) => ({
      ...it,
      blockId:
        it.blockId ||
        (it.type === 'step'
          ? `block_plan_${plan.planId}_step_${it.index}_${idx}`
          : `block_plan_${plan.planId}_stop_${idx}`),
    })),
  }));

  const buildChainXml = (items: RobotPlanItem[], idx = 0): string => {
    if (idx >= items.length) return '';
    const item = items[idx];
    const nextXml =
      idx + 1 < items.length ? `<next>${buildChainXml(items, idx + 1)}</next>` : '';
    const bid = item.blockId || `block_item_${idx}`;
    if (item.type === 'step') {
      const pat = normalizeSensorPattern(item.sensorPattern, hw.sensorCount);
      const matched = findMatchingSensorPreset(pat, hw.sensorCount);
      const presetVal = matched ? pat : 'CUSTOM';
      return `<block type="robot_plan_step" id="${bid}">
        <field name="INDEX">${item.index}</field>
        <field name="ACTION">${item.action}</field>
        <field name="TRIG_VAL">${item.triggerValue ?? 100}</field>
        <field name="TRIG_UNIT">${item.triggerUnit}</field>
        <field name="TRIG_MODE">${item.triggerMode}</field>
        <field name="SENSOR_PRESET">${presetVal}</field>
        <field name="PATTERN">${pat}</field>
        <field name="LOGIC_OP">${item.logicOp}</field>
        <field name="BRAKE">${item.brake}</field>
        <field name="SPEED_L">${item.speedL}</field>
        <field name="SPEED_R">${item.speedR}</field>
        <field name="PID_ID">${item.pidId}</field>
        <field name="SPEED_A">${item.speedA}</field>
        <field name="TIMER_VAL">${item.timerValue}</field>
        <field name="TIMER_UNIT">${item.timerUnit}</field>
        <field name="LINE_COLOR">${item.lineColor}</field>
        ${nextXml}
      </block>`;
    } else {
      return `<block type="robot_plan_stop" id="${bid}">
        <field name="STOP_STAGE">${item.stage}</field>
        ${nextXml}
      </block>`;
    }
  };

  let yPos = 190;
  const planBlocksXml = plansWithBlockIds
    .map((plan) => {
      const chain = buildChainXml(plan.items, 0);
      const xmlBlock = `<block type="robot_plan_container" id="${plan.blockId}" x="30" y="${yPos}">
        <field name="PLAN_ID">${plan.planId}</field>
        ${chain ? `<statement name="STEPS">${chain}</statement>` : ''}
      </block>`;
      yPos += Math.max(180, plan.items.length * 78 + 90);
      return xmlBlock;
    })
    .join('\n');

  const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="arduino_setup" id="block_arduino_setup" x="30" y="20">
    <statement name="STACK">
      <block type="robot_hw_setup" id="block_robot_hw_setup">
        <field name="PWM_L">${hw.pins.pwmL}</field>
        <field name="PWM_R">${hw.pins.pwmR}</field>
        <field name="MOTOR_RPM">${hw.motorRpm}</field>
        <field name="SENSOR_COUNT">${hw.sensorCount}</field>
        <field name="SENSOR_MODE">${hw.sensorMode}</field>
        <field name="MUX_SIG">${hw.pins.muxSig}</field>
        <field name="HAS_ENCODER">${hw.hasEncoder ? 'YES' : 'NO'}</field>
        <field name="ENC_L">${hw.pins.encLA}</field>
        <field name="ENC_R">${hw.pins.encRA}</field>
        <next>
          <block type="robot_run_plan" id="block_robot_run_plan">
            <field name="PLAN_ID">${activePlanId}</field>
          </block>
        </next>
      </block>
    </statement>
  </block>
  ${planBlocksXml}
</xml>`;

  return { xml, plansWithBlockIds };
}
