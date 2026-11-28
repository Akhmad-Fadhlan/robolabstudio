import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Camera,
  Maximize2,
  Minimize2,
  Upload,
  Download,
  Settings,
  Sliders,
  Cpu,
  Zap,
  Trash2,
  Sparkles,
  CheckCircle2,
  OctagonAlert,
} from 'lucide-react';
import {
  type RobotHardwareConfig,
  type RobotPlan,
  type RobotPlanStep,
  type ActiveExecutionHighlight,
  type RobotMcuId,
  type SensorCount,
  type SensorReadMode,
  type UltrasonicMode,
  type MotorPresetId,
  MOTOR_PRESETS,
  getBoardPinOptions,
  getSensorPresetOptions,
  getDefaultSensorPattern,
  getRobotActionSpeeds,
  estimateRobotPins,
  computeAutoPidProfiles,
  evaluateSensorPatternMatch,
  normalizeSensorPattern,
  parseRobotPlansFromCode,
} from '../types/robotSimulator';

interface RobotArena3DProps {
  isRunning: boolean;
  onToggleRun?: () => void;
  onRunComplete?: () => void;
  hardwareConfig: RobotHardwareConfig;
  onChangeHardwareConfig: (next: RobotHardwareConfig) => void;
  plans: RobotPlan[];
  activePlanId: number;
  onChangePlans: (plans: RobotPlan[], activePlanId?: number) => void;
  onSyncToCodeAndBlocks: (hw: RobotHardwareConfig, plans: RobotPlan[], activePlanId: number) => void;
  onHighlightChange?: (highlight: ActiveExecutionHighlight) => void;
  code?: string;
  theme?: 'dark' | 'light';
}

type CameraViewMode = '3d_persp' | '2d_top' | 'chase_cam' | 'pov_cam';
type PlacementTool = 'none' | 'start' | 'finish' | 'robot' | 'draw_line';

interface TrackPreset {
  id: string;
  name: string;
  pdfUrl?: string;
  type: 'empty' | 'oval' | 'maze' | 'pro' | 'technowars' | 'krpy' | 'custom_pdf';
  customCanvas?: HTMLCanvasElement;
}

interface CheckpointPose {
  x: number;
  y: number;
  deg: number;
  stepIndex: number | null;
  saved: boolean;
}

const TRACK_W = 1200;
const TRACK_H = 800;

export const RobotArena3D: React.FC<RobotArena3DProps> = ({
  isRunning,
  onToggleRun,
  onRunComplete,
  hardwareConfig,
  onChangeHardwareConfig,
  plans,
  activePlanId,
  onChangePlans,
  onSyncToCodeAndBlocks,
  onHighlightChange,
  code = '',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('2d_top');
  const [camYaw, setCamYaw] = useState<number>(-0.32); // radians
  const [camPitch, setCamPitch] = useState<number>(0.78); // tilt
  const [camZoom, setCamZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track & Arena state
  const [tracks, setTracks] = useState<TrackPreset[]>([
    { id: 'empty', name: 'Arena Kosong (Gambar Sendiri)', type: 'empty' },
    {
      id: 'oval',
      name: 'Oval latihan',
      type: 'oval',
      pdfUrl: '/tracks/track-basic-oval.pdf',
    },
    {
      id: 'maze',
      name: 'Labirin perempatan',
      type: 'maze',
      pdfUrl: '/tracks/track-perempatan-maze.pdf',
    },
    {
      id: 'pro',
      name: 'Lintasan kompetisi',
      type: 'pro',
      pdfUrl: '/tracks/track-lomba-pro.pdf',
    },
    {
      id: 'technowars',
      name: 'Ichibot Technowars Track',
      type: 'technowars',
    },
    {
      id: 'krpy',
      name: 'Ichibot KRPY Championship',
      type: 'krpy',
    },
  ]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('maze');
  const [placementTool, setPlacementTool] = useState<PlacementTool>('none');
  const [autoFinish, setAutoFinish] = useState<boolean>(true);
  const [customSegments, setCustomSegments] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([
    { x1: 200, y1: 640, x2: 200, y2: 220 },
    { x1: 200, y1: 220, x2: 650, y2: 220 },
    { x1: 650, y1: 220, x2: 650, y2: 520 },
    { x1: 650, y1: 520, x2: 980, y2: 520 },
    { x1: 980, y1: 520, x2: 980, y2: 180 },
  ]);
  const [lastDrawPoint, setLastDrawPoint] = useState<{ x: number; y: number } | null>(null);

  // Start & Finish coordinates in track space (1200 x 800)
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 155, y: 665 });
  const [finishPos, setFinishPos] = useState<{ x: number; y: number }>({ x: 1035, y: 155 });
  const [initialHeadingDeg, setInitialHeadingDeg] = useState<number>(-90); // -90 = facing UP

  // Active configuration modals / drawers
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hardware' | 'pid' | 'pdf_samples' | 'plan' | 'oled'>('none');
  const [robotChassisStyle, setRobotChassisStyle] = useState<'ichibot' | 'classic'>('ichibot');
  const [showTrail, setShowTrail] = useState<boolean>(true);
  const [freeMoveMode, setFreeMoveMode] = useState<boolean>(false);
  const [isGelengActive, setIsGelengActive] = useState<boolean>(false);
  const [activeCheckpoint, setActiveCheckpoint] = useState<number>(0); // 0 = ST, 1..9 = CP1..CP9
  const [checkpoints, setCheckpoints] = useState<Record<number, CheckpointPose>>({
    1: { x: 155, y: 520, deg: -90, stepIndex: 0, saved: true },
    2: { x: 155, y: 340, deg: 0, stepIndex: 1, saved: true },
    3: { x: 420, y: 340, deg: -90, stepIndex: 2, saved: true },
    4: { x: 720, y: 155, deg: 90, stepIndex: 3, saved: true },
    5: { x: 720, y: 520, deg: 0, stepIndex: 4, saved: true },
  });
  const [oledMenuPage, setOledMenuPage] = useState<'home' | 'sensor' | 'plan' | 'pid'>('home');
  const [oledCursor, setOledCursor] = useState<number>(0);

  const [playbackRate, setPlaybackRate] = useState(1);
  const [startStep, setStartStep] = useState<number | null>(null);
  const [results, setResults] = useState<{ trackId: string; planId: number; seconds: number }[]>([]);
  const currentPlan = React.useMemo(() => {
    const parsed = plans.length ? null : parseRobotPlansFromCode(code, hardwareConfig.sensorCount);
    const available = plans.length ? plans : parsed?.plans ?? [];
    const planId = activePlanId || parsed?.activePlanId || 1;
    return available.find(plan => plan.planId === planId) ?? available[0];
  }, [plans, activePlanId, code, hardwareConfig.sensorCount]);
  const steps = currentPlan?.items.filter(item => item.type === 'step') ?? [];
  const chosenStep = steps.some(step => step.index === startStep) ? startStep : null;
  const trackResults = results.filter(result => result.trackId === selectedTrackId && result.planId === currentPlan?.planId);

  const replacePlanItems = (items: RobotPlan['items']) => {
    if (!currentPlan || isRunning) return;
    onChangePlans(plans.map(plan => plan.planId === currentPlan.planId ? { ...plan, items } : plan), currentPlan.planId);
  };

  const editStep = (position: number, patch: Partial<Omit<RobotPlanStep, 'type' | 'blockId'>>) => {
    if (!currentPlan) return;
    replacePlanItems(currentPlan.items.map((item, index) =>
      index === position && item.type === 'step' ? { ...item, ...patch } : item
    ));
  };

  const changeStop = (position: number, stage: '' | 'ACTION' | 'SPEED_A') => {
    if (!currentPlan || isRunning) return;
    const items = [...currentPlan.items];
    const next = items[position + 1];
    const previousStop = next?.type === 'stop_here' ? next : undefined;
    items.splice(position + 1, previousStop ? 1 : 0, ...(stage ? [{ ...previousStop, type: 'stop_here' as const, stage }] : []));
    replacePlanItems(items);
  };

  const newStepIndex = Array.from({ length: 100 }, (_, index) => index).find(index => !steps.some(step => step.index === index));
  const addStep = () => {
    if (!currentPlan || newStepIndex === undefined) return;
    const items: RobotPlan['items'] = [...currentPlan.items, {
      type: 'step', index: newStepIndex, triggerMode: 'MOTION', sensorPattern: getDefaultSensorPattern(hardwareConfig.sensorCount),
      logicOp: 'OR', action: 'MAJU', triggerValue: 500, triggerUnit: 'ms', brake: 0,
      speedL: 80, speedR: 80, pidId: 0, speedA: 0, timerValue: 0, timerUnit: 'ms', lineColor: 'HITAM',
    }];
    replacePlanItems(items);
    setExpandedStep(items.length - 1);
  };
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  // Robot live state
  const [, setRobotPose] = useState<{ x: number; y: number; theta: number }>({
    x: 155,
    y: 665,
    theta: -Math.PI / 2,
  });
  const [simElapsedSec, setSimElapsedSec] = useState<number>(0);
  const [sensorReadings, setSensorReadings] = useState<boolean[]>(
    Array(hardwareConfig.sensorCount).fill(false)
  );
  const [encoderLeft, setEncoderLeft] = useState<number>(0);
  const [encoderRight, setEncoderRight] = useState<number>(0);
  const [ultrasonicCm, setUltrasonicCm] = useState<number>(120);
  const [liveSpeeds, setLiveSpeeds] = useState<{ l: number; r: number }>({ l: 0, r: 0 });
  const [execStatus, setExecStatus] = useState<{
    stepIndex: number | null;
    stage: string;
    message: string;
    stoppedByInterrupt: boolean;
  }>({
    stepIndex: null,
    stage: 'READY',
    message: 'Siap menjalankan Plan',
    stoppedByInterrupt: false,
  });

  // Trail history & step transition markers
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const stepMarkersRef = useRef<Array<{ x: number; y: number; stepIndex: number; action: string }>>([]);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackSurfaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackImageDataRef = useRef<ImageData | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const canvas = viewportCanvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // Mutable simulation physics state inside RAF
  const simStateRef = useRef({
    x: 155,
    y: 665,
    theta: -Math.PI / 2,
    elapsedMs: 0,
    encL: 0,
    encR: 0,
    itemCursor: 0,
    subStage: 'WAIT_TRIGGER' as 'WAIT_TRIGGER' | 'ACTION' | 'BRAKE' | 'SPEED_A' | 'DONE',
    stageStartMs: 0,
    stageStartEncL: 0,
    stageStartEncR: 0,
    pidIntegral: 0,
    pidLastErr: 0,
    pidLastUpdateMs: -Infinity,
    pidCorrection: 0,
    wheelAngle: 0,
    finished: false,
  });

  // Drag orbit state
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false,
    lastX: 0,
    lastY: 0,
  });

  // Rebuild offscreen 1200x800 track surface canvas whenever selectedTrackId or customSegments change
  const rebuildTrackSurface = useCallback(() => {
    let off = trackSurfaceCanvasRef.current;
    if (!off) {
      off = document.createElement('canvas');
      off.width = TRACK_W;
      off.height = TRACK_H;
      trackSurfaceCanvasRef.current = off;
    }
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const currentTrack = tracks.find((t) => t.id === selectedTrackId) || tracks[0];

    // If custom uploaded PDF canvas is present, draw it directly
    if (currentTrack.type === 'custom_pdf' && currentTrack.customCanvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, TRACK_W, TRACK_H);
      ctx.drawImage(currentTrack.customCanvas, 0, 0, TRACK_W, TRACK_H);
      trackImageDataRef.current = ctx.getImageData(0, 0, TRACK_W, TRACK_H);
      return;
    }

    // White base floor
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, TRACK_W, TRACK_H);

    // Subtle floor grid (light enough so sensors don't mistake it for a black line)
    ctx.strokeStyle = '#e8eef5';
    ctx.lineWidth = 1;
    for (let gx = 60; gx < TRACK_W; gx += 60) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, TRACK_H);
      ctx.stroke();
    }
    for (let gy = 60; gy < TRACK_H; gy += 60) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(TRACK_W, gy);
      ctx.stroke();
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTrack.type === 'empty') {
      // Draw user's custom line segments
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      for (const seg of customSegments) {
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      }
    } else if (currentTrack.type === 'oval') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(205, 645);
      ctx.lineTo(205, 180);
      ctx.lineTo(580, 180);
      ctx.lineTo(580, 410);
      ctx.lineTo(985, 410);
      ctx.lineTo(985, 175);
      ctx.stroke();

      // Checkpoint crossbars
      ctx.beginPath();
      ctx.moveTo(140, 380);
      ctx.lineTo(270, 380);
      ctx.moveTo(510, 300);
      ctx.lineTo(650, 300);
      ctx.stroke();
    } else if (currentTrack.type === 'maze') {
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      const cols = [155, 420, 720, 1035];
      for (const cx of cols) {
        ctx.beginPath();
        ctx.moveTo(cx, 155);
        ctx.lineTo(cx, 665);
        ctx.stroke();
      }
      const rows = [520, 340];
      for (const ry of rows) {
        ctx.beginPath();
        ctx.moveTo(95, ry);
        ctx.lineTo(1095, ry);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(155, 155);
      ctx.lineTo(720, 155);
      ctx.moveTo(420, 665);
      ctx.lineTo(1035, 665);
      ctx.stroke();
    } else if (currentTrack.type === 'pro') {
      // Inverse black zone on top-right
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(660, 90, 460, 280);

      // Main black line on white floor
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(145, 660);
      ctx.lineTo(145, 160);
      ctx.lineTo(380, 160);
      ctx.lineTo(380, 560);
      ctx.lineTo(560, 560);
      ctx.lineTo(560, 230);
      ctx.lineTo(660, 230);
      ctx.stroke();

      // Intersections
      const crosses = [
        [85, 440, 205, 440],
        [85, 280, 205, 280],
        [320, 360, 440, 360],
        [500, 410, 620, 410],
      ];
      for (const [x1, y1, x2, y2] of crosses) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // White line inside black zone
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(660, 230);
      ctx.lineTo(1035, 230);
      ctx.lineTo(1035, 370);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(780, 170);
      ctx.lineTo(780, 290);
      ctx.moveTo(920, 170);
      ctx.lineTo(920, 290);
      ctx.stroke();

      // Exit black line to finish
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(1035, 370);
      ctx.lineTo(1035, 635);
      ctx.moveTo(975, 500);
      ctx.lineTo(1095, 500);
      ctx.stroke();
    } else if (currentTrack.type === 'technowars') {
      // Ichibot Technowars Competition Track: Start bottom-left -> S-curve -> 90° acute turns -> inverse zone -> chicane -> Finish
      // Inverse black zone top-center
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(460, 80, 320, 210);

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(150, 670);
      ctx.lineTo(150, 420);
      ctx.arc(240, 420, 90, Math.PI, 0, false);
      ctx.lineTo(330, 560);
      ctx.lineTo(480, 560);
      ctx.lineTo(480, 350);
      ctx.lineTo(260, 350);
      ctx.lineTo(260, 185);
      ctx.lineTo(460, 185);
      ctx.stroke();

      // White line inside inverse black zone
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(460, 185);
      ctx.lineTo(620, 185);
      ctx.lineTo(620, 125);
      ctx.lineTo(720, 125);
      ctx.lineTo(720, 290);
      ctx.stroke();
      // Crossbar inside inverse zone
      ctx.beginPath();
      ctx.moveTo(560, 185);
      ctx.lineTo(560, 245);
      ctx.stroke();

      // Continue black line out of inverse zone -> zig-zag chicane -> finish
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(720, 290);
      ctx.lineTo(720, 430);
      ctx.lineTo(860, 350);
      ctx.lineTo(860, 580);
      ctx.lineTo(1035, 580);
      ctx.lineTo(1035, 165);
      ctx.stroke();

      // Index trigger crossbars
      const twCrosses = [
        [95, 530, 205, 530],
        [370, 500, 370, 620],
        [200, 265, 320, 265],
        [660, 360, 780, 360],
        [975, 420, 1095, 420],
        [975, 280, 1095, 280],
      ];
      for (const [x1, y1, x2, y2] of twCrosses) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    } else if (currentTrack.type === 'krpy') {
      // Ichibot KRPY Championship Track: High-speed technical circuit with loops, acute turns & intersections
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(160, 665);
      ctx.lineTo(160, 160);
      ctx.lineTo(440, 160);
      ctx.lineTo(320, 360);
      ctx.lineTo(560, 360);
      ctx.lineTo(560, 160);
      ctx.lineTo(840, 160);
      ctx.arc(840, 270, 110, -Math.PI / 2, Math.PI / 2, false);
      ctx.lineTo(560, 380);
      ctx.lineTo(560, 620);
      ctx.lineTo(1030, 620);
      ctx.lineTo(1030, 165);
      ctx.stroke();

      const krpyCrosses = [
        [100, 480, 220, 480],
        [100, 290, 220, 290],
        [680, 105, 680, 215],
        [500, 500, 620, 500],
        [780, 560, 780, 680],
        [970, 380, 1090, 380],
      ];
      for (const [x1, y1, x2, y2] of krpyCrosses) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    trackImageDataRef.current = ctx.getImageData(0, 0, TRACK_W, TRACK_H);
  }, [selectedTrackId, tracks, customSegments]);

  useEffect(() => {
    rebuildTrackSurface();
  }, [rebuildTrackSurface]);

  // Adjust default Start/Finish and Checkpoints when switching preset track
  const handleSelectTrack = (id: string) => {
    setSelectedTrackId(id);
    setActiveCheckpoint(0);
    if (id !== 'empty' && !['oval', 'maze', 'pro', 'technowars', 'krpy'].includes(id)) return;
    setInitialHeadingDeg(-90);
    if (id === 'oval') {
      setStartPos({ x: 205, y: 645 });
      setFinishPos({ x: 985, y: 175 });
      setCheckpoints({
        1: { x: 205, y: 380, deg: -90, stepIndex: 0, saved: true },
        2: { x: 205, y: 180, deg: 0, stepIndex: 1, saved: true },
        3: { x: 580, y: 300, deg: 90, stepIndex: 2, saved: true },
        4: { x: 780, y: 410, deg: 0, stepIndex: 3, saved: true },
        5: { x: 985, y: 320, deg: -90, stepIndex: 4, saved: true },
      });
      resetRobotToStart(205, 645, -90);
    } else if (id === 'maze') {
      setStartPos({ x: 155, y: 665 });
      setFinishPos({ x: 1035, y: 155 });
      setCheckpoints({
        1: { x: 155, y: 520, deg: -90, stepIndex: 0, saved: true },
        2: { x: 155, y: 340, deg: 0, stepIndex: 1, saved: true },
        3: { x: 420, y: 340, deg: -90, stepIndex: 2, saved: true },
        4: { x: 720, y: 155, deg: 90, stepIndex: 3, saved: true },
        5: { x: 720, y: 520, deg: 0, stepIndex: 4, saved: true },
      });
      resetRobotToStart(155, 665, -90);
    } else if (id === 'pro') {
      setStartPos({ x: 145, y: 660 });
      setFinishPos({ x: 1035, y: 635 });
      setCheckpoints({
        1: { x: 145, y: 440, deg: -90, stepIndex: 0, saved: true },
        2: { x: 380, y: 360, deg: 90, stepIndex: 1, saved: true },
        3: { x: 560, y: 410, deg: -90, stepIndex: 2, saved: true },
        4: { x: 780, y: 230, deg: 0, stepIndex: 3, saved: true },
        5: { x: 1035, y: 500, deg: 90, stepIndex: 4, saved: true },
      });
      resetRobotToStart(145, 660, -90);
    } else if (id === 'technowars') {
      setStartPos({ x: 150, y: 670 });
      setFinishPos({ x: 1035, y: 165 });
      setCheckpoints({
        1: { x: 150, y: 530, deg: -90, stepIndex: 0, saved: true },
        2: { x: 370, y: 560, deg: 0, stepIndex: 1, saved: true },
        3: { x: 260, y: 265, deg: -90, stepIndex: 2, saved: true },
        4: { x: 560, y: 185, deg: 0, stepIndex: 3, saved: true },
        5: { x: 720, y: 360, deg: 90, stepIndex: 4, saved: true },
        6: { x: 1035, y: 420, deg: -90, stepIndex: 5, saved: true },
      });
      resetRobotToStart(150, 670, -90);
    } else if (id === 'krpy') {
      setStartPos({ x: 160, y: 665 });
      setFinishPos({ x: 1030, y: 165 });
      setCheckpoints({
        1: { x: 160, y: 480, deg: -90, stepIndex: 0, saved: true },
        2: { x: 440, y: 160, deg: 120, stepIndex: 1, saved: true },
        3: { x: 560, y: 260, deg: -90, stepIndex: 2, saved: true },
        4: { x: 780, y: 620, deg: 0, stepIndex: 3, saved: true },
        5: { x: 1030, y: 380, deg: -90, stepIndex: 4, saved: true },
      });
      resetRobotToStart(160, 665, -90);
    } else if (id === 'empty') {
      setStartPos({ x: 200, y: 640 });
      setFinishPos({ x: 980, y: 180 });
      resetRobotToStart(200, 640, -90);
    }
  };

  const resetRobotToStart = useCallback(
    (sx = startPos.x, sy = startPos.y, deg = initialHeadingDeg) => {
      const rad = (deg * Math.PI) / 180;
      simStateRef.current = {
        x: sx,
        y: sy,
        theta: rad,
        elapsedMs: 0,
        encL: 0,
        encR: 0,
        itemCursor: 0,
        subStage: 'WAIT_TRIGGER',
        stageStartMs: 0,
        stageStartEncL: 0,
        stageStartEncR: 0,
        pidIntegral: 0,
        pidLastErr: 0,
        pidLastUpdateMs: -Infinity,
        pidCorrection: 0,
        wheelAngle: 0,
        finished: false,
      };
      trailRef.current = [{ x: sx, y: sy }];
      stepMarkersRef.current = [];
      setIsGelengActive(false);
      setRobotPose({ x: sx, y: sy, theta: rad });
      setSimElapsedSec(0);
      setEncoderLeft(0);
      setEncoderRight(0);
      setLiveSpeeds({ l: 0, r: 0 });
      setExecStatus({
        stepIndex: null,
        stage: 'READY',
        message: 'Siap menjalankan Plan',
        stoppedByInterrupt: false,
      });
      onHighlightChange?.({
        running: false,
        planId: null,
        stepIndex: null,
        stage: null,
        blockId: null,
      });
    },
    [startPos.x, startPos.y, initialHeadingDeg, onHighlightChange]
  );

  // Sample pixel darkness on offscreen track bitmap
  const sampleSensorsAtPose = useCallback(
    (rx: number, ry: number, rTheta: number, lineColor: 'HITAM' | 'PUTIH'): boolean[] => {
      const img = trackImageDataRef.current;
      const count = hardwareConfig.sensorCount;
      const results: boolean[] = Array(count).fill(false);
      if (!img) return results;

      const rScale = (hardwareConfig.robotScale || 1.0) * 1.18;
      const sensorWingWidth =
        count === 2 ? 16 : count === 4 ? 24 : Math.max(33, Math.min(44, 24 + count * 1.6));
      const sSpan = count === 2 ? 16 : count === 4 ? 30 : (sensorWingWidth - 5) * 2;

      const cosT = Math.cos(rTheta);
      const sinT = Math.sin(rTheta);

      for (let i = 0; i < count; i++) {
        const frac = count <= 1 ? 0 : i / (count - 1) - 0.5;
        const ly = frac * sSpan;
        const lx = 35 - Math.abs(frac) * 5;
        const sx = Math.round(rx + (lx * cosT - ly * sinT) * rScale);
        const sy = Math.round(ry + (lx * sinT + ly * cosT) * rScale);

        if (sx >= 0 && sx < TRACK_W && sy >= 0 && sy < TRACK_H) {
          const idx = (sy * TRACK_W + sx) * 4;
          const r = img.data[idx];
          const g = img.data[idx + 1];
          const b = img.data[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const isDark = luma < 115;
          results[i] = lineColor === 'HITAM' ? isDark : !isDark;
        }
      }
      return results;
    },
    [hardwareConfig.sensorCount, hardwareConfig.robotScale]
  );

  // Upload PDF or Image Track handler (renders via pdf.js CDN or fallback vector/image parser)
  const handleUploadTrackFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = TRACK_W;
      offCanvas.height = TRACK_H;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      if (file.type.startsWith('image/')) {
        const bitmap = await createImageBitmap(file);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TRACK_W, TRACK_H);
        ctx.drawImage(bitmap, 0, 0, TRACK_W, TRACK_H);
      } else {
        // Load PDF using pdf.js from CDN if available, else parse stream commands
        const arrayBuf = await file.arrayBuffer();
        let renderedViaPdfJs = false;
        try {
          if (!(window as any).pdfjsLib) {
            await new Promise<void>((resolve, reject) => {
              const sc = document.createElement('script');
              sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
              sc.onload = () => resolve();
              sc.onerror = () => reject(new Error('CDN offline'));
              document.head.appendChild(sc);
            });
          }
          const pdfjsLib = (window as any).pdfjsLib;
          if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc =
              'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
            const page = await pdfDoc.getPage(1);
            const vp = page.getViewport({ scale: 2.0 });
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = vp.width;
            tempCanvas.height = vp.height;
            await page.render({ canvasContext: tempCanvas.getContext('2d')!, viewport: vp }).promise;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, TRACK_W, TRACK_H);
            ctx.drawImage(tempCanvas, 0, 0, TRACK_W, TRACK_H);
            renderedViaPdfJs = true;
          }
        } catch (_) {}

        if (!renderedViaPdfJs) {
          // Offline fallback vector stream interpreter for standard PDF tracks
          const text = new TextDecoder('latin1').decode(new Uint8Array(arrayBuf));
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TRACK_W, TRACK_H);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 18;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const streamMatch = text.match(/stream\r?\n([\s\S]*?)\r?\nendstream/);
          if (streamMatch) {
            const lines = streamMatch[1].split('\n');
            ctx.beginPath();
            for (const ln of lines) {
              const parts = ln.trim().split(/\s+/);
              const cmd = parts[parts.length - 1];
              if (cmd === 'm' && parts.length >= 3) {
                ctx.moveTo(parseFloat(parts[0]), TRACK_H - parseFloat(parts[1]));
              } else if (cmd === 'l' && parts.length >= 3) {
                ctx.lineTo(parseFloat(parts[0]), TRACK_H - parseFloat(parts[1]));
              } else if (cmd === 'S') {
                ctx.stroke();
                ctx.beginPath();
              }
            }
          }
        }
      }

      const newId = `pdf_${Date.now()}`;
      const newTrack: TrackPreset = {
        id: newId,
        name: `📄 ${file.name.replace(/\.pdf$/i, '')}`,
        type: 'custom_pdf',
        customCanvas: offCanvas,
      };
      setTracks((prev) => [...prev, newTrack]);
      setSelectedTrackId(newId);
    } catch (err) {
      console.error('Gagal memuat file arena PDF:', err);
    }
  };

  // Jump to or save a Checkpoint (ST, CP1..CP9) like Ichibot Simulator
  const handleJumpToCheckpoint = useCallback(
    (cpId: number) => {
      if (isRunning) return;
      setActiveCheckpoint(cpId);
      if (cpId === 0) {
        setStartStep(null);
        resetRobotToStart(startPos.x, startPos.y, initialHeadingDeg);
        return;
      }
      const cp = checkpoints[cpId];
      if (cp && cp.saved) {
        if (cp.stepIndex !== null && steps.some((st) => st.index === cp.stepIndex)) {
          setStartStep(cp.stepIndex);
        }
        resetRobotToStart(cp.x, cp.y, cp.deg);
      } else {
        // Save current robot pose to this unassigned CP slot
        const deg = Math.round((simStateRef.current.theta * 180) / Math.PI);
        setCheckpoints((prev) => ({
          ...prev,
          [cpId]: {
            x: Math.round(simStateRef.current.x),
            y: Math.round(simStateRef.current.y),
            deg,
            stepIndex: chosenStep,
            saved: true,
          },
        }));
      }
    },
    [isRunning, startPos.x, startPos.y, initialHeadingDeg, checkpoints, steps, chosenStep, resetRobotToStart]
  );

  const handleSaveCurrentToCheckpoint = useCallback(() => {
    const targetCp = activeCheckpoint >= 1 && activeCheckpoint <= 9 ? activeCheckpoint : 1;
    const deg = Math.round((simStateRef.current.theta * 180) / Math.PI);
    setCheckpoints((prev) => ({
      ...prev,
      [targetCp]: {
        x: Math.round(simStateRef.current.x),
        y: Math.round(simStateRef.current.y),
        deg,
        stepIndex: chosenStep,
        saved: true,
      },
    }));
    setActiveCheckpoint(targetCp);
    setExecStatus((prev) => ({
      ...prev,
      message: `📍 Posisi robot & langkah disimpan ke CP${targetCp} (${Math.round(simStateRef.current.x)}, ${Math.round(simStateRef.current.y)}, ${deg}°)`,
    }));
  }, [activeCheckpoint, chosenStep]);

  // Free Move keyboard control (Arrow keys + Shift for fine precision when simulation is not running)
  useEffect(() => {
    if (!freeMoveMode || isRunning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const stepPx = e.shiftKey ? 3 : 12;
      const stepRad = ((e.shiftKey ? 3 : 10) * Math.PI) / 180;
      const s = simStateRef.current;
      let handled = false;
      if (e.key === 'ArrowUp') {
        s.x = Math.max(35, Math.min(TRACK_W - 35, s.x + Math.cos(s.theta) * stepPx));
        s.y = Math.max(35, Math.min(TRACK_H - 35, s.y + Math.sin(s.theta) * stepPx));
        handled = true;
      } else if (e.key === 'ArrowDown') {
        s.x = Math.max(35, Math.min(TRACK_W - 35, s.x - Math.cos(s.theta) * stepPx));
        s.y = Math.max(35, Math.min(TRACK_H - 35, s.y - Math.sin(s.theta) * stepPx));
        handled = true;
      } else if (e.key === 'ArrowLeft') {
        s.theta -= stepRad;
        handled = true;
      } else if (e.key === 'ArrowRight') {
        s.theta += stepRad;
        handled = true;
      }
      if (handled) {
        e.preventDefault();
        setRobotPose({ x: s.x, y: s.y, theta: s.theta });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [freeMoveMode, isRunning]);

  // Geleng (Check Sensor) oscillation animation when paused
  useEffect(() => {
    if (!isGelengActive || isRunning) return;
    const baseTheta = simStateRef.current.theta;
    const startT = performance.now();
    let timer = 0;
    const animateGeleng = (now: number) => {
      const elapsed = (now - startT) / 1000;
      if (elapsed > 2.4) {
        simStateRef.current.theta = baseTheta;
        setRobotPose((p) => ({ ...p, theta: baseTheta }));
        setIsGelengActive(false);
        return;
      }
      const offset = Math.sin(elapsed * Math.PI * 3.5) * ((28 * Math.PI) / 180);
      simStateRef.current.theta = baseTheta + offset;
      setRobotPose((p) => ({ ...p, theta: baseTheta + offset }));
      timer = requestAnimationFrame(animateGeleng);
    };
    timer = requestAnimationFrame(animateGeleng);
    return () => {
      cancelAnimationFrame(timer);
      simStateRef.current.theta = baseTheta;
    };
  }, [isGelengActive, isRunning]);

  // Reset simulation state when isRunning transitions from false -> true
  useEffect(() => {
    if (isRunning) {
      setIsGelengActive(false);
      const cp = activeCheckpoint >= 1 ? checkpoints[activeCheckpoint] : null;
      const spawnX = cp?.saved ? cp.x : startPos.x;
      const spawnY = cp?.saved ? cp.y : startPos.y;
      const spawnDeg = cp?.saved ? cp.deg : initialHeadingDeg;
      const rad = (spawnDeg * Math.PI) / 180;
      const cursor = chosenStep === null ? 0 : (currentPlan?.items.findIndex(item => item.type === 'step' && item.index === chosenStep) ?? 0);
      simStateRef.current = {
        x: spawnX,
        y: spawnY,
        theta: rad,
        elapsedMs: 0,
        encL: 0,
        encR: 0,
        itemCursor: Math.max(0, cursor),
        subStage: 'WAIT_TRIGGER',
        stageStartMs: 0,
        stageStartEncL: 0,
        stageStartEncR: 0,
        pidIntegral: 0,
        pidLastErr: 0,
        pidLastUpdateMs: -Infinity,
        pidCorrection: 0,
        wheelAngle: 0,
        finished: false,
      };
      trailRef.current = [{ x: spawnX, y: spawnY }];
      stepMarkersRef.current = [{ x: spawnX, y: spawnY, stepIndex: chosenStep ?? 0, action: 'START' }];
      setPlacementTool('none');
      setActiveDrawer('none');
      setExecStatus({ stepIndex: null, stage: 'READY', message: 'Robot mulai bergerak', stoppedByInterrupt: false });
      setSimElapsedSec(0);
      setEncoderLeft(0);
      setEncoderRight(0);
      setLiveSpeeds({ l: 0, r: 0 });
    } else {
      onHighlightChange?.({
        running: false,
        planId: null,
        stepIndex: null,
        stage: null,
        blockId: null,
      });
    }
  }, [isRunning]);

  // Main Simulation Physics + Step Index Execution + 3D Renderer Loop
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dtMs = Math.min(40, Math.max(4, now - lastTime)) * playbackRate;
      lastTime = now;

      const s = simStateRef.current;

      if (isRunning && !s.finished && currentPlan && currentPlan.items.length > 0) {
        const items = currentPlan.items;
        const currentItem = items[s.itemCursor];

        if (!currentItem) {
          s.finished = true;
          setLiveSpeeds({ l: 0, r: 0 });
          setExecStatus({
            stepIndex: null,
            stage: 'FINISHED',
            message: `✅ Plan ${currentPlan.planId} Selesai (${(s.elapsedMs / 1000).toFixed(2)}s)`,
            stoppedByInterrupt: false,
          });
          onHighlightChange?.({
            running: false,
            planId: currentPlan.planId,
            stepIndex: null,
            stage: 'FINISHED',
            blockId: null,
          });
        } else if (currentItem.type === 'stop_here') {
          // Direct stop_here item reached
          s.finished = true;
          setLiveSpeeds({ l: 0, r: 0 });
          setExecStatus({
            stepIndex: s.itemCursor,
            stage: 'STOPPED',
            message: `🛑 Stop Disini (Tahap ${currentItem.stage})`,
            stoppedByInterrupt: true,
          });
          onHighlightChange?.({
            running: true,
            planId: currentPlan.planId,
            stepIndex: null,
            stage: 'STOPPED',
            blockId: currentItem.blockId || null,
            stoppedByInterrupt: true,
          });
        } else {
          // Execute RobotPlanStep
          const step: RobotPlanStep = currentItem;
          const nextItem = items[s.itemCursor + 1];
          const hasStopAfterAction =
            nextItem?.type === 'stop_here' && nextItem.stage === 'ACTION';
          const hasStopAfterSpeedA =
            nextItem?.type === 'stop_here' && nextItem.stage === 'SPEED_A';

          const sensors = sampleSensorsAtPose(s.x, s.y, s.theta, step.lineColor);
          setSensorReadings(previous =>
            previous.length === sensors.length && previous.every((value, index) => value === sensors[index])
              ? previous : sensors
          );

          let cmdSpeedL = 0;
          let cmdSpeedR = 0;

          // Calculate PID steering correction if PID 1..5 is selected
          const computePidCorrection = (): number => {
            if (step.pidId < 1 || step.pidId > 5) return 0;
            const pid = hardwareConfig.pids[step.pidId - 1];
            if (!pid) return 0;
            if (s.elapsedMs - s.pidLastUpdateMs < pid.dt) return s.pidCorrection;
            s.pidLastUpdateMs = s.elapsedMs;

            let weightedSum = 0;
            let activeCount = 0;
            const half = ( sensors.length - 1 ) / 2;
            for (let i = 0; i < sensors.length; i++) {
              if (sensors[i]) {
                weightedSum += i - half;
                activeCount++;
              }
            }
            const err = activeCount > 0 ? weightedSum / activeCount : s.pidLastErr * 0.9;
            const dt = pid.dt / 1000;
            s.pidIntegral = Math.max(-30, Math.min(30, s.pidIntegral + err * dt));
            const deriv = (err - s.pidLastErr) / Math.max(0.005, dt);
            s.pidLastErr = err;
            s.pidCorrection = pid.kp * err + pid.ki * s.pidIntegral + pid.kd * deriv * 0.08;
            return s.pidCorrection;
          };

          const hasDurationElapsed = (targetVal: number, unit: 'ms' | 'enc_l' | 'enc_r'): boolean => {
            if (targetVal <= 0) return true;
            if (hardwareConfig.hasEncoder && unit === 'enc_l') {
              return Math.abs(s.encL - s.stageStartEncL) >= targetVal;
            }
            if (hardwareConfig.hasEncoder && unit === 'enc_r') {
              return Math.abs(s.encR - s.stageStartEncR) >= targetVal;
            }
            return s.elapsedMs - s.stageStartMs >= targetVal;
          };

          // ── 1. EVALUASI SENSOR TERLEBIH DAHULU: Apakah sensor (...) terdeteksi? ──
          if (s.subStage === 'WAIT_TRIGGER') {
            if (step.triggerMode === 'MOTION') {
              // Motion tanpa sensor: Langsung lanjut mengeksekusi aksi pada index
              s.subStage = 'ACTION';
              s.stageStartMs = s.elapsedMs;
              s.stageStartEncL = s.encL;
              s.stageStartEncR = s.encR;
            } else {
              // Evaluasi kecocokan sensor terlebih dahulu sebelum melakukan aksi apapun
              const patternMatched =
                evaluateSensorPatternMatch(
                  sensors,
                  normalizeSensorPattern(step.sensorPattern, hardwareConfig.sensorCount),
                  step.logicOp
                );

              if (patternMatched) {
                // JIKA SENSOR TERDETEKSI -> Langsung jalankan Aksi pada index!
                s.subStage = 'ACTION';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
              } else {
                // JIKA BELUM TERDETEKSI:
                // Robot membaca sensor terlebih dahulu (BUKAN menjalankan aksi).
                // Hanya bergerak menelusuri garis jika user menentukan speedA > 0. Jika speedA === 0, robot diam menunggu sensor.
                const cruiseSpeed = step.speedA > 0 ? step.speedA : 0;
                if (cruiseSpeed > 0) {
                  const pidCorr = computePidCorrection();
                  cmdSpeedL = Math.max(-255, Math.min(255, cruiseSpeed + pidCorr));
                  cmdSpeedR = Math.max(-255, Math.min(255, cruiseSpeed - pidCorr));
                } else {
                  cmdSpeedL = 0;
                  cmdSpeedR = 0;
                }

                setExecStatus({
                  stepIndex: step.index,
                  stage: 'WAIT_TRIGGER',
                  message: `🔍 Index #${step.index} [MEMBACA SENSOR: ${step.sensorPattern}] · Menunggu Terdeteksi`,
                  stoppedByInterrupt: false,
                });
              }
            }
          }

          // ── 2. AKSI PADA INDEX (HANYA DIEKSEKUSI JIKA SENSOR SUDAH TERDETEKSI ATAU MOTION) ──
          if (s.subStage === 'ACTION') {
            const trigVal = step.action === 'PAUSE' && step.triggerValue <= 0 ? 100 : step.triggerValue;
            setExecStatus({
              stepIndex: step.index,
              stage: 'ACTION',
              message: `▶ Index #${step.index} [AKSI: ${step.action} ${trigVal} ${step.triggerUnit.toUpperCase()}] · Speed L:${step.speedL} R:${step.speedR}`,
              stoppedByInterrupt: false,
            });

            const direction = getRobotActionSpeeds(step);
            cmdSpeedL = direction.left;
            cmdSpeedR = direction.right;

            // Cek apakah aksi sudah selesai sesuai durasi / encoder yang ditentukan
            const actionDone = hasDurationElapsed(trigVal, step.action === 'PAUSE' ? 'ms' : step.triggerUnit);

            if (actionDone) {
              cmdSpeedL = 0;
              cmdSpeedR = 0;
              // Aksi pada index selesai -> Lanjut ke tahap Pengereman
              s.subStage = 'BRAKE';
              s.stageStartMs = s.elapsedMs;
              s.stageStartEncL = s.encL;
              s.stageStartEncR = s.encR;
            }
          } else if (s.subStage === 'BRAKE') {
            // ── 3. PENGEREMAN ──
            const brakeMs = step.brake;
            const direction = getRobotActionSpeeds(step);
            if (!hasDurationElapsed(brakeMs, 'ms')) {
              cmdSpeedL = Math.trunc(-direction.left / 2);
              cmdSpeedR = Math.trunc(-direction.right / 2);
            }

            setExecStatus({
              stepIndex: step.index,
              stage: 'BRAKE',
              message: `🛑 Index #${step.index} [PENGEREMAN: ${brakeMs}ms]`,
              stoppedByInterrupt: false,
            });

            if (s.elapsedMs - s.stageStartMs >= brakeMs) {
              if (hasStopAfterAction) {
                s.finished = true;
                setLiveSpeeds({ l: 0, r: 0 });
                setExecStatus({
                  stepIndex: step.index,
                  stage: 'STOPPED (ACTION)',
                  message: `🛑 Diinterupsi pada Index #${step.index} (Tahap Action)`,
                  stoppedByInterrupt: true,
                });
                onHighlightChange?.({
                  running: true,
                  planId: currentPlan.planId,
                  stepIndex: step.index,
                  stage: 'STOPPED',
                  blockId: nextItem?.blockId || step.blockId || null,
                  stoppedByInterrupt: true,
                });
              } else {
                // Pengereman selesai -> Lanjut ke tahap menjalankan Speed A (mengikuti garis)
                s.subStage = 'SPEED_A';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
              }
            }
          } else if (s.subStage === 'SPEED_A') {
            // ── 4. MENJALANKAN SPEED A MENGIKUTI GARIS SELAMA WAKTU/ENCODER YANG DITENTUKAN ──
            setExecStatus({
              stepIndex: step.index,
              stage: 'SPEED_A',
              message: `⚡ Index #${step.index} [SPEED A: ${step.speedA}] · Mengikuti Garis · Timer ${step.timerValue} ${step.timerUnit.toUpperCase()}`,
              stoppedByInterrupt: false,
            });

            // Selalu mengikuti garis menggunakan kontrol PID saat Speed A
            if (!hasDurationElapsed(step.timerValue, step.timerUnit) && step.speedA !== 0) {
              const pidCorr = computePidCorrection();
              cmdSpeedL = Math.max(-255, Math.min(255, step.speedA + pidCorr));
              cmdSpeedR = Math.max(-255, Math.min(255, step.speedA - pidCorr));
            }

            if (hasDurationElapsed(step.timerValue, step.timerUnit)) {
              if (hasStopAfterSpeedA) {
                s.finished = true;
                setLiveSpeeds({ l: 0, r: 0 });
                setExecStatus({
                  stepIndex: step.index,
                  stage: 'STOPPED (SPEED A)',
                  message: `🛑 Diinterupsi pada Index #${step.index} (Tahap Speed A)`,
                  stoppedByInterrupt: true,
                });
                onHighlightChange?.({
                  running: true,
                  planId: currentPlan.planId,
                  stepIndex: step.index,
                  stage: 'STOPPED',
                  blockId: nextItem?.blockId || step.blockId || null,
                  stoppedByInterrupt: true,
                });
              } else {
                // ── 5. BERPINDAH KE INDEX BERIKUTNYA ──
                s.itemCursor += 1;
                s.subStage = 'WAIT_TRIGGER';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
                const nextStepItem = items[s.itemCursor];
                if (nextStepItem && nextStepItem.type === 'step') {
                  stepMarkersRef.current.push({
                    x: s.x,
                    y: s.y,
                    stepIndex: nextStepItem.index,
                    action: nextStepItem.action,
                  });
                }
              }
            }
          }

          // Broadcast live running block highlight to Blockly
          if (!s.finished) {
            onHighlightChange?.({
              running: true,
              planId: currentPlan.planId,
              stepIndex: step.index,
              stage: s.subStage === 'SPEED_A' ? 'SPEED_A' : s.subStage === 'BRAKE' ? 'BRAKE' : s.subStage === 'ACTION' ? 'ACTION' : 'SENSOR',
              blockId: step.blockId || null,
            });
          }

          // Differential drive kinematics calibrated to Motor RPM & Wheel Diameter
          // v_max (px/s) proportional to RPM * wheelDiameterMm
          const rpmScale = (hardwareConfig.motorRpm / 300) * (hardwareConfig.wheelDiameterMm / 34);
          const maxPxPerSec = 175 * rpmScale;
          const vL = (cmdSpeedL / 255) * maxPxPerSec;
          const vR = (cmdSpeedR / 255) * maxPxPerSec;
          const dtSec = dtMs / 1000;

          const vLinear = (vL + vR) / 2;
          const wheelBasePx = 42 * (hardwareConfig.robotScale || 1.0);
          const omega = (vL - vR) / wheelBasePx;

          s.x = Math.max(35, Math.min(TRACK_W - 35, s.x + vLinear * Math.cos(s.theta) * dtSec));
          s.y = Math.max(35, Math.min(TRACK_H - 35, s.y + vLinear * Math.sin(s.theta) * dtSec));
          s.theta += omega * dtSec;
          s.elapsedMs += dtMs;
          s.wheelAngle += (vLinear * dtSec) * 0.15;

          // Update wheel encoders based on RPM & PPR
          const revsPerSecL = (Math.abs(cmdSpeedL) / 255) * (hardwareConfig.motorRpm / 60);
          const revsPerSecR = (Math.abs(cmdSpeedR) / 255) * (hardwareConfig.motorRpm / 60);
          s.encL += revsPerSecL * hardwareConfig.encoderPpr * dtSec;
          s.encR += revsPerSecR * hardwareConfig.encoderPpr * dtSec;

          // Ultrasonic distance to arena walls
          const distToWallX = Math.cos(s.theta) > 0 ? (TRACK_W - s.x) / Math.cos(s.theta) : -s.x / Math.cos(s.theta);
          const distToWallY = Math.sin(s.theta) > 0 ? (TRACK_H - s.y) / Math.sin(s.theta) : -s.y / Math.sin(s.theta);
          const minWallPx = Math.max(5, Math.min(Math.abs(distToWallX), Math.abs(distToWallY)));
          setUltrasonicCm(Math.min(400, Math.round(minWallPx * 0.25)));

          // Trail recording
          const lastPt = trailRef.current[trailRef.current.length - 1];
          if (!lastPt || Math.hypot(s.x - lastPt.x, s.y - lastPt.y) > 6) {
            trailRef.current.push({ x: s.x, y: s.y });
            if (trailRef.current.length > 500) trailRef.current.shift();
          }

          // Check auto-finish proximity
          if (autoFinish && Math.hypot(s.x - finishPos.x, s.y - finishPos.y) < 38) {
            s.finished = true;
            if (chosenStep === null) {
              setResults(previous => [
                { trackId: selectedTrackId, planId: currentPlan.planId, seconds: s.elapsedMs / 1000 },
                ...previous.slice(0, 29),
              ]);
            }
            setExecStatus({
              stepIndex: step.index,
              stage: 'FINISH',
              message: `🏆 Robot Mencapai Titik Finis! Waktu: ${(s.elapsedMs / 1000).toFixed(2)}s`,
              stoppedByInterrupt: false,
            });
          }

          setRobotPose({ x: s.x, y: s.y, theta: s.theta });
          setSimElapsedSec(s.elapsedMs / 1000);
          setEncoderLeft(Math.round(s.encL));
          setEncoderRight(Math.round(s.encR));
          setLiveSpeeds(s.finished ? { l: 0, r: 0 } : { l: Math.round(cmdSpeedL), r: Math.round(cmdSpeedR) });
        }
      } else if (!isRunning) {
        // Sample sensors passively when idle so LEDs react as user moves robot
        const passiveSensors = sampleSensorsAtPose(s.x, s.y, s.theta, 'HITAM');
        setSensorReadings(previous =>
          previous.length === passiveSensors.length && previous.every((value, index) => value === passiveSensors[index])
            ? previous : passiveSensors
        );
      }

      // Render the final frame and let the workspace release its running state.
      renderArenaViewport();
      if (isRunning && s.finished && onRunComplete) {
        onRunComplete();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const renderArenaViewport = () => {
      const canvas = viewportCanvasRef.current;
      const trackSurface = trackSurfaceCanvasRef.current;
      if (!canvas || !trackSurface) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 100 && rect.height > 100) {
        const targetW = Math.round(rect.width);
        const targetH = Math.round(rect.height);
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const s = simStateRef.current;

      // Background adapting to Light / Dark theme
      const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
      if (isLight) {
        bgGrad.addColorStop(0, '#e0f2fe');
        bgGrad.addColorStop(1, '#e2e8f0');
      } else {
        bgGrad.addColorStop(0, '#07111f');
        bgGrad.addColorStop(1, '#040912');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Project 3D world point (wx in 0..TRACK_W, wy in 0..TRACK_H, wz height) to 2D screen
      const project3D = (wx: number, wy: number, wz = 0): { sx: number; sy: number; scale: number } => {
        if (cameraMode === '2d_top') {
          const fitScale = Math.min((cw - 60) / TRACK_W, (ch - 60) / TRACK_H) * camZoom;
          return {
            sx: cw / 2 + (wx - TRACK_W / 2) * fitScale,
            sy: ch / 2 + (wy - TRACK_H / 2) * fitScale - wz * fitScale,
            scale: fitScale,
          };
        }

        if (cameraMode === 'chase_cam' || cameraMode === 'pov_cam') {
          const forwardDist = cameraMode === 'pov_cam' ? -30 : 190;
          const camX = s.x - Math.cos(s.theta) * forwardDist;
          const camY = s.y - Math.sin(s.theta) * forwardDist;
          const dx = wx - camX;
          const dy = wy - camY;
          // Rotate into robot camera frame
          const forward = dx * Math.cos(s.theta) + dy * Math.sin(s.theta);
          const right = -dx * Math.sin(s.theta) + dy * Math.cos(s.theta);
          const depth = Math.max(40, forward + 160);
          const fov = (cameraMode === 'pov_cam' ? 520 : 620) * camZoom;
          const camHeight = cameraMode === 'pov_cam' ? 65 : 190;
          return {
            sx: cw / 2 + (right / depth) * fov,
            sy: ch * 0.34 + ((camHeight - wz) / depth) * fov,
            scale: fov / depth,
          };
        }

        // Default: 3D Axonometric Orbit (matches affine floor surface 100% pixel-for-pixel)
        const cx = wx - TRACK_W / 2;
        const cy = wy - TRACK_H / 2;
        const cosY = Math.cos(camYaw);
        const sinY = Math.sin(camYaw);
        const rx = cx * cosY - cy * sinY;
        const ry = cx * sinY + cy * cosY;

        const baseScale = Math.min(cw / 1420, ch / 860) * camZoom;
        const sx = cw * 0.50 + rx * baseScale;
        const sy = ch * 0.50 + ry * Math.cos(camPitch) * baseScale - wz * baseScale;
        return { sx, sy, scale: baseScale };
      };

      // Draw 3D Arena Outer Frame / Walls
      const wallMargin = 38;
      const wallHeight = 32;
      const outerCornersBase = [
        project3D(-wallMargin, -wallMargin, 0),
        project3D(TRACK_W + wallMargin, -wallMargin, 0),
        project3D(TRACK_W + wallMargin, TRACK_H + wallMargin, 0),
        project3D(-wallMargin, TRACK_H + wallMargin, 0),
      ];
      const outerCornersTop = [
        project3D(-wallMargin, -wallMargin, wallHeight),
        project3D(TRACK_W + wallMargin, -wallMargin, wallHeight),
        project3D(TRACK_W + wallMargin, TRACK_H + wallMargin, wallHeight),
        project3D(-wallMargin, TRACK_H + wallMargin, wallHeight),
      ];
      const innerCornersTop = [
        project3D(0, 0, wallHeight),
        project3D(TRACK_W, 0, wallHeight),
        project3D(TRACK_W, TRACK_H, wallHeight),
        project3D(0, TRACK_H, wallHeight),
      ];

      // Shadow under 3D table
      ctx.save();
      ctx.fillStyle = isLight ? 'rgba(15, 23, 42, 0.18)' : 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      outerCornersBase.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy + 18) : ctx.lineTo(pt.sx, pt.sy + 18)));
      ctx.closePath();
      ctx.fill();

      // Side extrusions of the 3D table border
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        ctx.fillStyle = isLight
          ? i % 2 === 0 ? '#94a3b8' : '#cbd5e1'
          : i % 2 === 0 ? '#1e293b' : '#334155';
        ctx.beginPath();
        ctx.moveTo(outerCornersBase[i].sx, outerCornersBase[i].sy);
        ctx.lineTo(outerCornersBase[next].sx, outerCornersBase[next].sy);
        ctx.lineTo(outerCornersTop[next].sx, outerCornersTop[next].sy);
        ctx.lineTo(outerCornersTop[i].sx, outerCornersTop[i].sy);
        ctx.closePath();
        ctx.fill();
      }

      // Top rim of the 3D arena border
      ctx.fillStyle = isLight ? '#cbd5e1' : '#3b4a63';
      ctx.beginPath();
      outerCornersTop.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.fill();

      // Render Track Surface via affine transform matching the 3D table plane
      const p00 = project3D(0, 0, 0);
      const p10 = project3D(TRACK_W, 0, 0);
      const p01 = project3D(0, TRACK_H, 0);

      ctx.save();
      ctx.beginPath();
      const c0 = p00;
      const c1 = p10;
      const c2 = project3D(TRACK_W, TRACK_H, 0);
      const c3 = p01;
      ctx.moveTo(c0.sx, c0.sy);
      ctx.lineTo(c1.sx, c1.sy);
      ctx.lineTo(c2.sx, c2.sy);
      ctx.lineTo(c3.sx, c3.sy);
      ctx.closePath();
      ctx.clip();

      const a = (p10.sx - p00.sx) / TRACK_W;
      const b = (p10.sy - p00.sy) / TRACK_W;
      const c = (p01.sx - p00.sx) / TRACK_H;
      const d = (p01.sy - p00.sy) / TRACK_H;
      ctx.setTransform(a, b, c, d, p00.sx, p00.sy);
      ctx.drawImage(trackSurface, 0, 0);

      // Draw START zone on track plane
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.strokeStyle = '#9333ea';
      ctx.lineWidth = 3;
      ctx.fillRect(startPos.x - 36, startPos.y - 36, 72, 72);
      ctx.strokeRect(startPos.x - 36, startPos.y - 36, 72, 72);
      ctx.fillStyle = '#6b21a8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('START', startPos.x - 26, startPos.y + 54);

      // Draw FINISH zone on track plane
      ctx.fillStyle = 'rgba(16, 185, 129, 0.30)';
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(finishPos.x, finishPos.y, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('FINIS', finishPos.x - 22, finishPos.y - 45);

      // Draw Saved Checkpoints (CP1..CP9) on track plane
      Object.entries(checkpoints).forEach(([cpKey, cp]) => {
        if (!cp.saved) return;
        const isCurrentCp = activeCheckpoint === Number(cpKey);
        ctx.fillStyle = isCurrentCp ? 'rgba(249, 115, 22, 0.28)' : 'rgba(56, 189, 248, 0.18)';
        ctx.strokeStyle = isCurrentCp ? '#f97316' : '#0284c7';
        ctx.lineWidth = isCurrentCp ? 2.5 : 1.5;
        ctx.beginPath();
        ctx.arc(cp.x, cp.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isCurrentCp ? '#c2410c' : '#0369a1';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`CP${cpKey}`, cp.x - 11, cp.y + 4);
      });

      // Draw Ichibot-Style Green Robot Movement Trail & Orange Step Transition Markers on track plane
      if (showTrail && trailRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(22, 163, 74, 0.85)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        trailRef.current.forEach((pt, idx) =>
          idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
        );
        ctx.stroke();

        // Orange step index transition markers along the green trail
        stepMarkersRef.current.forEach((mk) => {
          ctx.fillStyle = '#f97316';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mk.x, mk.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`${mk.stepIndex}`, mk.x - (mk.stepIndex >= 10 ? 5.5 : 3), mk.y + 3);
        });
      }

      // Draw Ultrasonic Raycast Cone if enabled
      if (hardwareConfig.ultrasonicMode !== 'none') {
        const angles =
          hardwareConfig.ultrasonicMode === 'three'
            ? [s.theta - 0.6, s.theta, s.theta + 0.6]
            : [s.theta];
        for (const ang of angles) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.arc(s.x, s.y, 110, ang - 0.18, ang + 0.18);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      ctx.restore();

      // Inner border highlight
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      innerCornersTop.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // ============================================================================
      // REALISTIC 3D LINE FOLLOWER ROBOT RENDERER (Ichibot Ultimate 5 & Classic T-Chassis)
      // ============================================================================
      const rScale = (hardwareConfig.robotScale || 1.0) * 1.18;
      const isIchibotStyle = robotChassisStyle === 'ichibot';

      const localToWorld = (lx: number, ly: number) => ({
        wx: s.x + lx * rScale * Math.cos(s.theta) - ly * rScale * Math.sin(s.theta),
        wy: s.y + lx * rScale * Math.sin(s.theta) + ly * rScale * Math.cos(s.theta),
      });

      // Helper to render any 3D extruded polygon in robot local coordinates (lx, ly)
      const drawExtrudedLocalPoly = (
        localPts: Array<[number, number]>,
        zBase: number,
        zTop: number,
        topFill: string,
        sideFillA: string,
        sideFillB: string,
        strokeColor?: string,
        strokeWidth = 1.2
      ) => {
        const worldPts = localPts.map(([lx, ly]) => localToWorld(lx, ly));
        const base2D = worldPts.map((p) => project3D(p.wx, p.wy, zBase * rScale));
        const top2D = worldPts.map((p) => project3D(p.wx, p.wy, zTop * rScale));

        // Side faces
        for (let i = 0; i < localPts.length; i++) {
          const next = (i + 1) % localPts.length;
          ctx.fillStyle = i % 2 === 0 ? sideFillA : sideFillB;
          ctx.beginPath();
          ctx.moveTo(base2D[i].sx, base2D[i].sy);
          ctx.lineTo(base2D[next].sx, base2D[next].sy);
          ctx.lineTo(top2D[next].sx, top2D[next].sy);
          ctx.lineTo(top2D[i].sx, top2D[i].sy);
          ctx.closePath();
          ctx.fill();
        }

        // Top face
        ctx.fillStyle = topFill;
        ctx.beginPath();
        top2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
        ctx.closePath();
        ctx.fill();
        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = strokeWidth;
          ctx.stroke();
        }
        return { base2D, top2D };
      };

      const sensorWingWidth =
        hardwareConfig.sensorCount === 2
          ? 18
          : hardwareConfig.sensorCount === 4
          ? 26
          : Math.max(35, Math.min(46, 25 + hardwareConfig.sensorCount * 1.55));
      const sSpan =
        hardwareConfig.sensorCount === 2
          ? 18
          : hardwareConfig.sensorCount === 4
          ? 32
          : (sensorWingWidth - 4.5) * 2;

      if (isIchibotStyle) {
        // ── ICHIBOT ULTIMATE 5 DELTA / V-WING MATTE-BLACK PCB CHASSIS ──
        // 1. Soft ground shadow matching Ichibot delta wing + crescent sensor bar
        const ichiShadow: Array<[number, number]> = [
          [44, 0],
          [38, -sensorWingWidth * 0.72],
          [24, -sensorWingWidth],
          [18, -sensorWingWidth * 0.92],
          [16, -15],
          [4, -27],
          [-26, -32],
          [-34, -18],
          [-36, 0],
          [-34, 18],
          [-26, 32],
          [4, 27],
          [16, 15],
          [18, sensorWingWidth * 0.92],
          [24, sensorWingWidth],
          [38, sensorWingWidth * 0.72],
        ];
        const shadow2D = ichiShadow.map(([lx, ly]) => {
          const wp = localToWorld(lx, ly);
          return project3D(wp.wx, wp.wy, 0.5);
        });
        ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
        ctx.beginPath();
        shadow2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy + 3) : ctx.lineTo(pt.sx, pt.sy + 3)));
        ctx.closePath();
        ctx.fill();

        // 2. Crimson-Red Rear Competition Wheels with Metallic Silver Inner Hubs
        for (const side of [-1, 1]) {
          const yInner = side * 20.5;
          const yOuter = side * 31.5;

          // Silver metal motor bracket & inner hub
          drawExtrudedLocalPoly(
            [
              [-3, side * 12],
              [-3, yInner],
              [-22, yInner],
              [-22, side * 12],
            ],
            4,
            13,
            '#cbd5e1',
            '#64748b',
            '#94a3b8',
            '#f8fafc',
            0.9
          );

          // Crimson-Red Competition Tire
          drawExtrudedLocalPoly(
            [
              [4, yInner],
              [4, yOuter],
              [-25, yOuter],
              [-25, yInner],
            ],
            1,
            19.5,
            '#dc2626',
            '#991b1b',
            '#b91c1c',
            '#fca5a5',
            1.1
          );

          // Silver Outer Rim Cap
          drawExtrudedLocalPoly(
            [
              [-1, yOuter - side * 2.2],
              [-1, yOuter - side * 0.3],
              [-20, yOuter - side * 0.3],
              [-20, yOuter - side * 2.2],
            ],
            5,
            15.5,
            '#e2e8f0',
            '#94a3b8',
            '#cbd5e1',
            '#475569',
            0.8
          );

          // Rotating Dark Crimson Tread Grooves
          ctx.strokeStyle = '#450a0a';
          ctx.lineWidth = 1.5;
          const treadPhase = ((s.wheelAngle * 6) % 6 + 6) % 6;
          for (let tx = -22 + treadPhase; tx <= 2; tx += 6) {
            const pA = localToWorld(tx, yInner + side * 1.1);
            const pB = localToWorld(tx, yOuter - side * 1.1);
            const sA = project3D(pA.wx, pA.wy, 19.9 * rScale);
            const sB = project3D(pB.wx, pB.wy, 19.9 * rScale);
            ctx.beginPath();
            ctx.moveTo(sA.sx, sA.sy);
            ctx.lineTo(sB.sx, sB.sy);
            ctx.stroke();
          }
        }

        // 3. Delta / Arrowhead Matte-Black Ichibot PCB Body with Side Wing Lobes & Rear Curved Bridge
        const deltaBodyPts: Array<[number, number]> = [
          [26, -7.5],
          [26, 7.5],
          [15, 11],
          [7, 25],
          [-2, 26],
          [-4, 19.5],
          [-24, 19.5],
          [-26, 26],
          [-32, 21],
          [-35, 10],
          [-36, 0],
          [-35, -10],
          [-32, -21],
          [-26, -26],
          [-24, -19.5],
          [-4, -19.5],
          [-2, -26],
          [7, -25],
          [15, -11],
        ];
        drawExtrudedLocalPoly(
          deltaBodyPts,
          5,
          12.5,
          '#111622',
          '#060911',
          '#1e293b',
          '#94a3b8',
          1.5
        );

        // 4. Sweeping Crescent Front Sensor Wing with Hook Tips (Ichibot Ultimate 5 Signature Nose)
        const crescentPts: Array<[number, number]> = [
          [43, 0],
          [41.5, -sensorWingWidth * 0.35],
          [37.5, -sensorWingWidth * 0.72],
          [31, -sensorWingWidth],
          [21, -sensorWingWidth],
          [20, -sensorWingWidth * 0.84],
          [26, -sensorWingWidth * 0.78],
          [29, -12],
          [24, -7.5],
          [24, 7.5],
          [29, 12],
          [26, sensorWingWidth * 0.78],
          [20, sensorWingWidth * 0.84],
          [21, sensorWingWidth],
          [31, sensorWingWidth],
          [37.5, sensorWingWidth * 0.72],
          [41.5, sensorWingWidth * 0.35],
        ];
        drawExtrudedLocalPoly(
          crescentPts,
          3.5,
          11.2,
          '#0c101a',
          '#020617',
          '#1e293b',
          '#e2e8f0',
          1.4
        );

        // 5. White ICHIBOT DRIVER HUB Bar + 4-Color Ribbon Wires to Left & Right Motors
        drawExtrudedLocalPoly(
          [
            [-11, -13],
            [-11, 13],
            [-16.5, 13],
            [-16.5, -13],
          ],
          12.6,
          15.5,
          '#f8fafc',
          '#cbd5e1',
          '#94a3b8',
          '#475569',
          0.9
        );

        // 4-Color Ribbon Wires (Yellow, Orange, Red, Blue) curving from Driver Hub to Left & Right Motor Terminals
        const ribbonColors = ['#eab308', '#f97316', '#ef4444', '#3b82f6'];
        for (const side of [-1, 1]) {
          ribbonColors.forEach((col, wIdx) => {
            const startW = localToWorld(-13 - wIdx * 0.8, side * (11 + wIdx * 0.5));
            const midW = localToWorld(-18 - wIdx * 1.1, side * (16.5 + wIdx * 0.6));
            const endW = localToWorld(-14 - wIdx * 1.3, side * 19.5);
            const p0 = project3D(startW.wx, startW.wy, 13.8 * rScale);
            const p1 = project3D(midW.wx, midW.wy, 14.2 * rScale);
            const p2 = project3D(endW.wx, endW.wy, 13.2 * rScale);
            ctx.strokeStyle = col;
            ctx.lineWidth = 1.35;
            ctx.beginPath();
            ctx.moveTo(p0.sx, p0.sy);
            ctx.quadraticCurveTo(p1.sx, p1.sy, p2.sx, p2.sy);
            ctx.stroke();
          });
        }

        // 6. Central On-Chassis Ichibot OLED Display Module
        drawExtrudedLocalPoly(
          [
            [11, -9.5],
            [11, 9.5],
            [-9.5, 9.5],
            [-9.5, -9.5],
          ],
          12.6,
          16.5,
          '#050811',
          '#0f172a',
          '#1e293b',
          '#38bdf8',
          1.2
        );

        // Glowing Cyan/White OLED Screen Text & Telemetry Dot
        const oledTop = localToWorld(4.5, 0);
        const oledMid = localToWorld(0.5, 0);
        const oledBot = localToWorld(-4.5, 0);
        const pOledTop = project3D(oledTop.wx, oledTop.wy, 17 * rScale);
        const pOledMid = project3D(oledMid.wx, oledMid.wy, 17 * rScale);
        const pOledBot = project3D(oledBot.wx, oledBot.wy, 17 * rScale);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pOledTop.sx, pOledTop.sy, Math.max(1.8, 2.5 * pOledTop.scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(pOledMid.sx, pOledMid.sy, Math.max(1.5, 2.1 * pOledMid.scale), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(pOledBot.sx, pOledBot.sy, Math.max(1.5, 2.0 * pOledBot.scale), 0, Math.PI * 2);
        ctx.fill();

        // 7. 6 Tactile Push Buttons on Left & Right Wings (UPL/OKL/DWNL green, UPR/OKR/DWNR red)
        const btnOffsets = [6.5, 1.5, -3.5];
        for (const bx of btnOffsets) {
          // Left Wing Button (Green Cap)
          const bLeft = localToWorld(bx, -17.5);
          const pLeft = project3D(bLeft.wx, bLeft.wy, 13.8 * rScale);
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#ecfdf5';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(pLeft.sx, pLeft.sy, Math.max(2, 2.8 * pLeft.scale * rScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Wing Button (Red Cap)
          const bRight = localToWorld(bx, 17.5);
          const pRight = project3D(bRight.wx, bRight.wy, 13.8 * rScale);
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#fef2f2';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(pRight.sx, pRight.sy, Math.max(2, 2.8 * pRight.scale * rScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Rear Bridge Silkscreen Accent & Status LEDs
        const rearLogo = localToWorld(-30.5, 0);
        const pRearLogo = project3D(rearLogo.wx, rearLogo.wy, 13.2 * rScale);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(pRearLogo.sx, pRearLogo.sy, Math.max(1.8, 2.6 * pRearLogo.scale), 0, Math.PI * 2);
        ctx.fill();
      } else {
        // ── CLASSIC T-HAMMERHEAD COMPETITION CHASSIS ──
        const shadowOutline: Array<[number, number]> = [
          [44, -18],
          [36, -34],
          [24, -34],
          [21, -13],
          [8, -13],
          [8, -30],
          [-28, -30],
          [-34, -22],
          [-34, 22],
          [-28, 30],
          [8, 30],
          [8, 13],
          [21, 13],
          [24, 34],
          [36, 34],
          [44, 18],
        ];
        const shadow2D = shadowOutline.map(([lx, ly]) => {
          const wp = localToWorld(lx, ly);
          return project3D(wp.wx, wp.wy, 0.5);
        });
        ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
        ctx.beginPath();
        shadow2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy + 3) : ctx.lineTo(pt.sx, pt.sy + 3)));
        ctx.closePath();
        ctx.fill();

        for (const side of [-1, 1]) {
          const yInner = side * 22;
          const yOuter = side * 32;
          const gearInner = side * 11;
          const gearOuter = side * 22;
          drawExtrudedLocalPoly(
            [
              [-4, gearInner],
              [-4, gearOuter],
              [-23, gearOuter],
              [-23, gearInner],
            ],
            4,
            14,
            '#8b9599',
            '#4a555c',
            '#66737a',
            '#dbe6e8',
            1
          );
          drawExtrudedLocalPoly(
            [
              [6, yInner],
              [6, yOuter],
              [-24, yOuter],
              [-24, yInner],
            ],
            1,
            20,
            '#111827',
            '#090d16',
            '#1e293b',
            '#475569',
            1.2
          );
        }

        const mainDeckPts: Array<[number, number]> = [
          [27, -9],
          [27, 9],
          [7, 14],
          [4, 22],
          [-24, 22],
          [-31, 14],
          [-31, -14],
          [-24, -22],
          [4, -22],
          [7, -14],
        ];
        drawExtrudedLocalPoly(mainDeckPts, 5, 13, '#2a3e45', '#14282d', '#24363c', '#5f797c', 1.5);

        const innerW = Math.min(13, sensorWingWidth - 3);
        const frontWingPts: Array<[number, number]> = [
          [44, -sensorWingWidth * 0.48],
          [37, -sensorWingWidth],
          [25, -sensorWingWidth],
          [23, -innerW],
          [23, innerW],
          [25, sensorWingWidth],
          [37, sensorWingWidth],
          [44, sensorWingWidth * 0.48],
        ];
        drawExtrudedLocalPoly(frontWingPts, 3, 11, '#0f172a', '#020617', '#1e293b', '#648b89', 1.6);
      }

      // Optional Ultrasonic Sensor HC-SR04 ("Mata Robot") if enabled
      if (hardwareConfig.ultrasonicMode !== 'none') {
        drawExtrudedLocalPoly(
          [
            [24, -10],
            [24, 10],
            [18, 10],
            [18, -10],
          ],
          13,
          24,
          '#0284c7',
          '#0369a1',
          '#075985',
          '#7dd3fc',
          1
        );
        for (const eyeY of [-5.5, 5.5]) {
          const eyeW = localToWorld(25.5, eyeY);
          const eye2D = project3D(eyeW.wx, eyeW.wy, 19 * rScale);
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(eye2D.sx, eye2D.sy, Math.max(2.5, 4 * eye2D.scale * rScale), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // Forward Direction Arrow on Robot Nose Bridge
      const arrowPts = [
        localToWorld(24, 0),
        localToWorld(15, -4.8),
        localToWorld(15, 4.8),
      ].map((p) => project3D(p.wx, p.wy, 14.5 * rScale));
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      arrowPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.fill();

      // Front Sensor Array LEDs (Ichibot Style: Bright Magenta-Red '#ff1e56' when ON Line '0', Dark Slate when OFF Line 'X')
      const sCount = hardwareConfig.sensorCount;
      for (let i = 0; i < sCount; i++) {
        const frac = sCount <= 1 ? 0 : i / (sCount - 1) - 0.5;
        // Sweeping crescent curve along the front sensor wing
        const ly = frac * sSpan;
        const lx = 36 - Math.pow(Math.abs(frac) * 1.4, 1.55) * 6.5;
        const spWorld = localToWorld(lx, ly);
        const isOnLine = sensorReadings[i];

        // Floor projection beam dot
        const floor2d = project3D(spWorld.wx, spWorld.wy, 1);
        ctx.fillStyle = isOnLine
          ? isIchibotStyle
            ? 'rgba(255, 30, 86, 0.52)'
            : 'rgba(34, 197, 94, 0.45)'
          : 'rgba(148, 163, 184, 0.18)';
        ctx.beginPath();
        ctx.arc(floor2d.sx, floor2d.sy, Math.max(2.2, 4.0 * floor2d.scale * rScale), 0, Math.PI * 2);
        ctx.fill();

        // Top PCB LED indicator with bright halo when detecting line ('0')
        const sp2d = project3D(spWorld.wx, spWorld.wy, 11.8 * rScale);
        if (isOnLine) {
          ctx.fillStyle = isIchibotStyle ? 'rgba(255, 0, 68, 0.55)' : 'rgba(34, 197, 94, 0.45)';
          ctx.beginPath();
          ctx.arc(sp2d.sx, sp2d.sy, Math.max(4.5, 7.6 * sp2d.scale * rScale), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = isOnLine
          ? isIchibotStyle
            ? '#ff1e56'
            : '#22c55e'
          : '#1e293b';
        ctx.strokeStyle = isOnLine ? '#ffffff' : '#94a3b8';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.arc(sp2d.sx, sp2d.sy, Math.max(2.6, 4.0 * sp2d.scale * rScale), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    isRunning,
    currentPlan,
    chosenStep,
    selectedTrackId,
    playbackRate,
    hardwareConfig,
    cameraMode,
    camYaw,
    camPitch,
    camZoom,
    startPos,
    finishPos,
    autoFinish,
    sensorReadings,
    sampleSensorsAtPose,
    onHighlightChange,
    onRunComplete,
    isLight,
    robotChassisStyle,
    showTrail,
    checkpoints,
    activeCheckpoint,
  ]);

  // Convert click on canvas to exact 2D track coordinates (inverting the 3D/2D camera floor projection)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;
    const effectiveTool = placementTool !== 'none' ? placementTool : freeMoveMode ? 'robot' : 'none';
    if (effectiveTool === 'none') return;
    const canvas = viewportCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const sx = ((e.clientX - rect.left) / rect.width) * cw;
    const sy = ((e.clientY - rect.top) / rect.height) * ch;
    const s = simStateRef.current;

    const projectFloorPoint = (wx: number, wy: number): { sx: number; sy: number } => {
      if (cameraMode === '2d_top') {
        const fitScale = Math.min((cw - 60) / TRACK_W, (ch - 60) / TRACK_H) * camZoom;
        return {
          sx: cw / 2 + (wx - TRACK_W / 2) * fitScale,
          sy: ch / 2 + (wy - TRACK_H / 2) * fitScale,
        };
      }
      if (cameraMode === 'chase_cam' || cameraMode === 'pov_cam') {
        const forwardDist = cameraMode === 'pov_cam' ? -30 : 190;
        const camX = s.x - Math.cos(s.theta) * forwardDist;
        const camY = s.y - Math.sin(s.theta) * forwardDist;
        const dx = wx - camX;
        const dy = wy - camY;
        const forward = dx * Math.cos(s.theta) + dy * Math.sin(s.theta);
        const right = -dx * Math.sin(s.theta) + dy * Math.cos(s.theta);
        const depth = Math.max(40, forward + 160);
        const fov = (cameraMode === 'pov_cam' ? 520 : 620) * camZoom;
        const camHeight = cameraMode === 'pov_cam' ? 65 : 190;
        return {
          sx: cw / 2 + (right / depth) * fov,
          sy: ch * 0.34 + (camHeight / depth) * fov,
        };
      }
      const cx = wx - TRACK_W / 2;
      const cy = wy - TRACK_H / 2;
      const cosY = Math.cos(camYaw);
      const sinY = Math.sin(camYaw);
      const rx = cx * cosY - cy * sinY;
      const ry = cx * sinY + cy * cosY;
      const baseScale = Math.min(cw / 1420, ch / 860) * camZoom;
      return {
        sx: cw * 0.50 + rx * baseScale,
        sy: ch * 0.50 + ry * Math.cos(camPitch) * baseScale,
      };
    };

    const p00 = projectFloorPoint(0, 0);
    const p10 = projectFloorPoint(TRACK_W, 0);
    const p01 = projectFloorPoint(0, TRACK_H);

    const a = (p10.sx - p00.sx) / TRACK_W;
    const b = (p10.sy - p00.sy) / TRACK_W;
    const c = (p01.sx - p00.sx) / TRACK_H;
    const d = (p01.sy - p00.sy) / TRACK_H;
    const det = a * d - b * c;

    let clickX = ((e.clientX - rect.left) / rect.width) * TRACK_W;
    let clickY = ((e.clientY - rect.top) / rect.height) * TRACK_H;
    if (Math.abs(det) > 1e-8) {
      const dx = sx - p00.sx;
      const dy = sy - p00.sy;
      clickX = (d * dx - c * dy) / det;
      clickY = (-b * dx + a * dy) / det;
    }

    const tx = Math.max(36, Math.min(TRACK_W - 36, Math.round(clickX)));
    const ty = Math.max(36, Math.min(TRACK_H - 36, Math.round(clickY)));

    if (effectiveTool === 'start') {
      setStartPos({ x: tx, y: ty });
      resetRobotToStart(tx, ty, initialHeadingDeg);
      setPlacementTool('none');
    } else if (effectiveTool === 'finish') {
      setFinishPos({ x: tx, y: ty });
      setPlacementTool('none');
    } else if (effectiveTool === 'robot') {
      simStateRef.current.x = tx;
      simStateRef.current.y = ty;
      setRobotPose((p) => ({ ...p, x: tx, y: ty }));
      if (!freeMoveMode) setPlacementTool('none');
    } else if (effectiveTool === 'draw_line') {
      if (!lastDrawPoint) {
        setLastDrawPoint({ x: tx, y: ty });
      } else {
        setCustomSegments((prev) => [...prev, { x1: lastDrawPoint.x, y1: lastDrawPoint.y, x2: tx, y2: ty }]);
        setLastDrawPoint({ x: tx, y: ty });
      }
    }
  };

  // Update hardware helper that also triggers auto-PID & smart pin estimator
  const updateHardware = (patch: Partial<RobotHardwareConfig>, recalcPins = false, recalcPids = false) => {
    const merged: RobotHardwareConfig = { ...hardwareConfig, ...patch };
    if (merged.sensorCount === 2 || merged.sensorCount === 4) {
      merged.sensorMode = 'direct';
    }
    if (recalcPins) {
      merged.pins = estimateRobotPins(merged.mcu, merged.sensorCount, merged.sensorMode);
    }
    if (recalcPids) {
      merged.pids = computeAutoPidProfiles(merged.motorRpm, merged.sensorCount);
    }
    onChangeHardwareConfig(merged);
  };

  const boardPins = getBoardPinOptions(hardwareConfig.mcu);
  const sensorPresets = getSensorPresetOptions(hardwareConfig.sensorCount);
  const controlStyle = `min-h-9 rounded-lg border px-2 py-1 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-sky-500 disabled:opacity-60 ${isLight ? 'border-slate-300 bg-white text-slate-800' : 'border-slate-600 bg-slate-800 text-slate-100'}`;

  return (
    <div
      className={`${
        isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full relative'
      } flex flex-col ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#060d18] text-slate-100'
      } select-none overflow-y-auto transition-colors`}
    >
      {/* Hidden File Input for PDF / Track Upload */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleUploadTrackFile}
        className="hidden"
      />

      <header className={`shrink-0 border-b px-3 py-2.5 ${isLight ? 'border-sky-100 bg-white' : 'border-slate-700 bg-slate-900'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black tracking-tight">Arena Line Follower</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
              isLight ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
            }`}>
              Ichibot Ultimate 5 Edition
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveDrawer(activeDrawer === 'oled' ? 'none' : 'oled')}
              aria-expanded={activeDrawer === 'oled'}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-extrabold transition cursor-pointer ${
                activeDrawer === 'oled'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                  : isLight
                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                  : 'bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 border-cyan-500/40'
              }`}
              title="Buka Layar OLED Robot & Tombol UPL/OKL/DWNL - UPR/OKR/DWNR"
            >
              📟 Layar OLED
            </button>
            <button type="button" onClick={() => setActiveDrawer(activeDrawer === 'plan' ? 'none' : 'plan')}
              aria-expanded={activeDrawer === 'plan'} className={controlStyle}>
              Langkah Plan
            </button>
            <button type="button" onClick={() => resetRobotToStart()} disabled={isRunning}
              title="Kembalikan robot ke titik Start" className={`inline-flex items-center gap-1 ${controlStyle}`}>
              <RotateCcw className="size-3.5" /> Ulang posisi
            </button>
            {onToggleRun && (
              <button type="button" disabled={!isRunning && !steps.length} onClick={onToggleRun}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold text-white disabled:opacity-50 cursor-pointer ${isRunning ? 'bg-rose-700 hover:bg-rose-800' : 'bg-blue-700 hover:bg-blue-800'}`}>
                {isRunning ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
                {isRunning ? 'Berhenti' : 'Jalankan'}
              </button>
            )}
          </div>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <label className="grid min-w-0 gap-1 font-semibold">Lintasan
            <select value={selectedTrackId} disabled={isRunning} onChange={event => handleSelectTrack(event.target.value)} className={controlStyle}>
              {tracks.map(track => <option key={track.id} value={track.id}>{track.name}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 font-semibold">Plan
            <select value={currentPlan?.planId ?? ''} disabled={isRunning || !plans.length} onChange={event => {
              setStartStep(null);
              onChangePlans(plans, Number(event.target.value));
            }} className={controlStyle}>
              {!currentPlan && <option value="">Belum ada Plan</option>}
              {(plans.length ? plans : currentPlan ? [currentPlan] : []).map(plan => <option key={plan.planId} value={plan.planId}>Plan {plan.planId}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 font-semibold">Mulai dari langkah
            <select value={chosenStep ?? ''} disabled={isRunning || !steps.length} onChange={event => setStartStep(event.target.value === '' ? null : Number(event.target.value))}
              title="Pilih langkah index awal saat simulasi dijalankan." className={controlStyle}>
              <option value="">Awal Plan</option>
              {steps.map((step, index) => <option key={index} value={step.index}>Langkah {step.index}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-1 font-semibold">Laju simulasi
            <select value={playbackRate} onChange={event => setPlaybackRate(Number(event.target.value))} className={controlStyle}>
              <option value={0.1}>0,1× · Ultra Slow</option>
              <option value={0.25}>0,25× · Amati sensor</option>
              <option value={0.5}>0,5× · Pelan</option>
              <option value={1}>1× · Normal</option>
              <option value={2}>2× · Cepat</option>
            </select>
          </label>
        </div>

        {/* ── ICHIBOT QUICK CONTROL BAR: Checkpoints (ST, CP1-CP9), Free Move, Geleng & Trail ── */}
        <div className={`mt-2 pt-2 border-t flex flex-wrap items-center justify-between gap-1.5 text-[11px] ${isLight ? 'border-slate-200/80' : 'border-slate-800'}`}>
          {/* Checkpoints Bar */}
          <div className="flex flex-wrap items-center gap-1">
            <span className={`font-bold text-[10px] uppercase tracking-wider mr-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Checkpoint:
            </span>
            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleJumpToCheckpoint(0)}
              className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border transition cursor-pointer disabled:opacity-50 ${
                activeCheckpoint === 0
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Posisi Start Utama (ST)"
            >
              ST
            </button>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((cpId) => {
              const cp = checkpoints[cpId];
              const isSelected = activeCheckpoint === cpId;
              return (
                <button
                  key={cpId}
                  type="button"
                  disabled={isRunning}
                  onClick={() => handleJumpToCheckpoint(cpId)}
                  className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm font-extrabold'
                      : cp?.saved
                      ? isLight
                        ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                        : 'bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 border-sky-700/60'
                      : isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-500 border-slate-800'
                  }`}
                  title={
                    cp?.saved
                      ? `CP${cpId}: (${cp.x}, ${cp.y}, ${cp.deg}°)${cp.stepIndex !== null ? ` • Index #${cp.stepIndex}` : ''}`
                      : `Klik untuk menyimpan posisi robot saat ini ke CP${cpId}`
                  }
                >
                  CP{cpId}
                </button>
              );
            })}
            <button
              type="button"
              disabled={isRunning}
              onClick={handleSaveCurrentToCheckpoint}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
              }`}
              title="Simpan posisi & arah robot saat ini ke slot CP yang dipilih"
            >
              💾 Simpan CP
            </button>
          </div>

          {/* Right side: Free Move, Geleng Sensor Test, Trail Toggle & Chassis Style */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={isRunning}
              onClick={() => setFreeMoveMode((v) => !v)}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer disabled:opacity-50 ${
                freeMoveMode
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Free Move: Gerakkan robot dengan tombol panah keyboard (↑↓←→ + Shift) atau klik langsung di lintasan"
            >
              🕹️ Free Move {freeMoveMode ? 'ON (↑↓←→)' : 'OFF'}
            </button>

            <button
              type="button"
              disabled={isRunning}
              onClick={() => setIsGelengActive((v) => !v)}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer disabled:opacity-50 ${
                isGelengActive
                  ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                  : isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                  : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
              }`}
              title="Goyangkan kepala robot ke kiri-kanan untuk menguji pembacaan sensor garis"
            >
              〰️ Geleng (Cek Sensor)
            </button>

            <button
              type="button"
              onClick={() => setShowTrail((v) => !v)}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer ${
                showTrail
                  ? isLight
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : isLight
                  ? 'bg-slate-100 text-slate-500 border-slate-300'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Tampilkan/Sembunyikan garis jejak lintasan hijau & titik perpindahan index"
            >
              🟢 Jejak: {showTrail ? 'ON' : 'OFF'}
            </button>

            <button
              type="button"
              onClick={() => setRobotChassisStyle((s) => (s === 'ichibot' ? 'classic' : 'ichibot'))}
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition cursor-pointer ${
                robotChassisStyle === 'ichibot'
                  ? isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title="Ganti desain sasis robot antara Ichibot Ultimate 5 (Delta V-Wing) dan Classic T-Chassis"
            >
              🏎️ Sasis: {robotChassisStyle === 'ichibot' ? 'Ichibot Ultimate 5' : 'Classic'}
            </button>
          </div>
        </div>
      </header>

      <details className={`shrink-0 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold">Pengaturan arena</summary>
      {/* ── COMPACT KIDS-FRIENDLY TOP TOOLBAR (Row 1: Track + Robot Setup + PID + Sync) ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-1 px-2.5 py-1 border-b text-xs shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-700'
            : 'bg-[#0b1526] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300'
                : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40'
            }`}
            title="Upload file PDF lintasan untuk dijadikan track simulasi"
          >
            <Upload className="w-3 h-3" /> Upload PDF
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'pdf_samples' ? 'none' : 'pdf_samples')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              activeDrawer === 'pdf_samples'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <Download className="w-3 h-3" /> Contoh PDF
          </button>

          {selectedTrackId.startsWith('pdf_') && (
            <button
              type="button"
              onClick={() => {
                setTracks((prev) => prev.filter((t) => t.id !== selectedTrackId));
                handleSelectTrack('maze');
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[11px] cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-300'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
              }`}
            >
              <Trash2 className="w-3 h-3" /> Hapus
            </button>
          )}
        </div>

        {/* Right side: Kids-Friendly Hardware, Pinout & Multi-PID Popover Triggers */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'hardware' ? 'none' : 'hardware')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              activeDrawer === 'hardware'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-[#132238] hover:bg-[#1a2e4a] text-amber-300 border-amber-500/30'
            }`}
          >
            <Cpu className="w-3 h-3" /> Robot ({hardwareConfig.sensorCount} Sensor • {hardwareConfig.motorRpm} RPM)
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'pid' ? 'none' : 'pid')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              activeDrawer === 'pid'
                ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-sm'
                : isLight
                  ? 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300'
                  : 'bg-[#132238] hover:bg-[#1a2e4a] text-fuchsia-300 border-fuchsia-500/30'
            }`}
          >
            <Sliders className="w-3 h-3" /> PID 1–5
          </button>

          <button
            type="button"
            onClick={() => onSyncToCodeAndBlocks(hardwareConfig, plans, activePlanId)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold text-[11px] shadow-sm cursor-pointer transition-all"
            title="Sinkronkan konfigurasi robot, pinout PWM/Mux/Encoder, dan PID ke Block & Kode (.ino / .py)"
          >
            <Sparkles className="w-3 h-3" /> Sync ke Blok & Kode
          </button>
        </div>
      </div>

      {/* ── COMPACT ROW 2: Camera View, Start/Finish & Robot Pose Controls + Fullscreen ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-1 px-2.5 py-1 border-b text-[11px] shrink-0 transition-colors ${
          isLight
            ? 'bg-slate-100/90 border-slate-200 text-slate-700'
            : 'bg-[#091220] border-slate-800/80 text-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1">
          {/* 3D Camera Perspective Selector */}
          <select
            value={cameraMode}
            onChange={(e) => setCameraMode(e.target.value as CameraViewMode)}
            className={`rounded-lg px-2 py-0.5 font-bold outline-none cursor-pointer border ${
              isLight
                ? 'bg-white text-sky-700 border-slate-300'
                : 'bg-[#111e34] text-sky-200 border-slate-700'
            }`}
          >
            <option value="3d_persp">3D perspektif</option>
            <option value="2d_top">Tampak atas</option>
            <option value="chase_cam">Ikuti dari belakang</option>
            <option value="pov_cam">Kamera robot</option>
          </select>

          <button
            type="button"
            onClick={() => setCamYaw((y) => y + 0.35)}
            className={`px-2 py-0.5 rounded-lg border font-semibold cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Putar sudut pandang 3D"
          >
            ↻ Putar
          </button>

          <label className="inline-flex min-h-8 items-center gap-2 px-2 font-semibold">
            Zoom
            <input type="range" min={0.55} max={2.2} step={0.05} value={camZoom}
              onChange={event => setCamZoom(Number(event.target.value))} className="w-20 accent-sky-600" />
          </label>
          <button
            type="button"
            onClick={() => {
              setCamYaw(-0.32);
              setCamPitch(0.78);
              setCamZoom(1.0);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-semibold cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
            title="Reset Kamera"
          >
            <Camera className="w-3 h-3" /> Reset View
          </button>

          <button
            type="button"
            onClick={() => {
              const scales = [0.85, 1.0, 1.25, 1.45];
              const nextScale = scales[(scales.indexOf(hardwareConfig.robotScale) + 1) % scales.length] || 1.0;
              updateHardware({ robotScale: nextScale });
            }}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-amber-700'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            🔍 Robot {hardwareConfig.robotScale}x
          </button>

          <div className={`h-3.5 w-px mx-0.5 ${isLight ? 'bg-slate-300' : 'bg-slate-800'}`} />

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'start' ? 'none' : 'start')}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              placementTool === 'start'
                ? 'bg-purple-600 text-white border-purple-400'
                : isLight
                  ? 'bg-white hover:bg-purple-50 border-slate-300 text-purple-700'
                  : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-purple-300'
            }`}
          >
            Titik mulai
          </button>

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'finish' ? 'none' : 'finish')}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              placementTool === 'finish'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : isLight
                  ? 'bg-white hover:bg-emerald-50 border-slate-300 text-emerald-700'
                  : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-emerald-300'
            }`}
          >
            Titik finis
          </button>

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'robot' ? 'none' : 'robot')}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              placementTool === 'robot'
                ? 'bg-orange-500 text-slate-950 border-orange-300'
                : isLight
                  ? 'bg-white hover:bg-orange-50 border-slate-300 text-orange-700'
                  : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-orange-300'
            }`}
          >
            Pindah robot
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTrackId('empty');
              setLastDrawPoint(null);
              setPlacementTool(placementTool === 'draw_line' ? 'none' : 'draw_line');
            }}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              placementTool === 'draw_line'
                ? 'bg-sky-600 text-white border-sky-400'
                : isLight
                  ? 'bg-white hover:bg-sky-50 border-slate-300 text-sky-700'
                  : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-sky-300'
            }`}
          >
            Gambar jalur
          </button>

          <div
            className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 ${
              isLight ? 'bg-white border-slate-300' : 'bg-[#111e34] border-slate-700'
            }`}
          >
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Arah:</span>
            <input
              type="number"
              value={initialHeadingDeg}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setInitialHeadingDeg(val);
                resetRobotToStart(startPos.x, startPos.y, val);
              }}
              className={`w-10 bg-transparent font-mono font-bold text-center outline-none ${
                isLight ? 'text-amber-700' : 'text-amber-300'
              }`}
            />
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>°</span>
          </div>

          {selectedTrackId === 'empty' && customSegments.length > 0 && (
            <button
              type="button"
              onClick={() => setCustomSegments([])}
              className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-300'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
              }`}
            >
              Hapus Jalur
            </button>
          )}
        </div>

        {/* Right: Auto-Finish & Fullscreen Button (Now in toolbar so it never covers the track!) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setAutoFinish((v) => !v)}
            className={`px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              autoFinish
                ? isLight
                  ? 'bg-teal-50 text-teal-700 border-teal-300'
                  : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : isLight
                  ? 'bg-white text-slate-500 border-slate-300'
                  : 'bg-[#111e34] text-slate-400 border-slate-700'
            }`}
          >
            Finis Otomatis: {autoFinish ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold cursor-pointer transition-transform active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            {isFullscreen ? 'Perkecil' : 'Perbesar'}
          </button>
        </div>
      </div>

      </details>

      {/* ── MAIN 3D ARENA VIEWPORT (100% Unobstructed Track!) ── */}
      <div className="relative flex-1 w-full min-h-[220px] overflow-hidden">
        {activeDrawer === 'oled' && (
          <div className="absolute top-2 right-2 z-30 w-[330px] rounded-2xl border border-cyan-500/40 bg-[#070b14]/95 p-3.5 text-slate-100 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-black tracking-wider uppercase text-cyan-300">
                  ICHIBOT ULTIMATE 5 • OLED
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>

            {/* Interactive 6-Button + 128x64 OLED Layout */}
            <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
              {/* Left 3 Tactile Buttons: UPL, OKL, DWNL */}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const pages: Array<'home' | 'sensor' | 'plan' | 'pid'> = ['home', 'sensor', 'plan', 'pid'];
                    const idx = pages.indexOf(oledMenuPage);
                    setOledMenuPage(pages[(idx + pages.length - 1) % pages.length]);
                  }}
                  className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[9px] shadow border border-emerald-400/50 cursor-pointer"
                  title="UPL: Menu Sebelumnya"
                >
                  UPL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (oledMenuPage === 'home' && onToggleRun) {
                      onToggleRun();
                    } else if (oledMenuPage === 'sensor') {
                      setIsGelengActive((v) => !v);
                    } else if (oledMenuPage === 'plan') {
                      onSyncToCodeAndBlocks(hardwareConfig, plans, activePlanId);
                    } else if (oledMenuPage === 'pid') {
                      setActiveDrawer('pid');
                    }
                  }}
                  className="py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-[9px] shadow border border-emerald-300 cursor-pointer"
                  title="OKL: Pilih / Jalankan"
                >
                  OKL
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pages: Array<'home' | 'sensor' | 'plan' | 'pid'> = ['home', 'sensor', 'plan', 'pid'];
                    const idx = pages.indexOf(oledMenuPage);
                    setOledMenuPage(pages[(idx + 1) % pages.length]);
                  }}
                  className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-[9px] shadow border border-emerald-400/50 cursor-pointer"
                  title="DWNL: Menu Berikutnya"
                >
                  DWNL
                </button>
              </div>

              {/* Center 128x64 Monochrome Cyan/White OLED Screen */}
              <div className="h-[132px] rounded-xl border-2 border-cyan-500/60 bg-[#020409] p-2.5 font-mono text-[10px] flex flex-col justify-between shadow-[inset_0_0_18px_rgba(34,211,238,0.18)]">
                <div className="flex items-center justify-between border-b border-cyan-900/80 pb-1 text-[9px] text-cyan-400 font-bold">
                  <span>ULTIMATE 5S</span>
                  <span>PLAN:{currentPlan?.planId ?? 1}</span>
                  <span>{hardwareConfig.sensorCount}S</span>
                </div>

                {oledMenuPage === 'home' && (
                  <div className="my-auto space-y-1 text-center">
                    <div className="text-xs font-black text-white tracking-wider">ICHIBOT SIMULATOR</div>
                    <div className="text-[9.5px] text-cyan-300">
                      IDX: #{execStatus.stepIndex ?? chosenStep ?? 0} • {isRunning ? 'RUNNING' : 'READY'}
                    </div>
                    <div className="text-[9px] text-emerald-400">
                      PWM L:{liveSpeeds.l} R:{liveSpeeds.r} | {simElapsedSec.toFixed(1)}s
                    </div>
                  </div>
                )}

                {oledMenuPage === 'sensor' && (
                  <div className="my-auto space-y-1.5">
                    <div className="text-[9px] text-cyan-300 font-bold text-center">CAL / VIEW SENSORS</div>
                    <div className="flex items-center justify-center gap-0.5 h-8 px-1 bg-slate-950 rounded border border-cyan-950">
                      {sensorReadings.map((act, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 rounded-xs transition-all ${
                            act ? 'h-6 bg-rose-500 shadow-[0_0_6px_#ff1e56]' : 'h-2 bg-cyan-900/60'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-[8.5px] text-center text-slate-400">
                      OKL: Geleng • UPR/DWNR: Jml Sensor ({hardwareConfig.sensorCount})
                    </div>
                  </div>
                )}

                {oledMenuPage === 'plan' && (
                  <div className="my-auto space-y-1 text-center">
                    <div className="text-[9.5px] text-cyan-300 font-bold">SELECT PLAN &amp; INDEX</div>
                    <div className="text-xs font-extrabold text-amber-300">
                      ACTIVE PLAN {currentPlan?.planId ?? 1} ({steps.length} Step)
                    </div>
                    <div className="text-[9px] text-slate-300">
                      Start Idx: {chosenStep === null ? '0 (Awal)' : `#${chosenStep}`}
                    </div>
                  </div>
                )}

                {oledMenuPage === 'pid' && (
                  <div className="my-auto space-y-1">
                    <div className="text-[9.5px] text-cyan-300 font-bold text-center">
                      {hardwareConfig.pids[oledCursor % 5]?.label || 'PID 1'}
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center text-[9px] bg-slate-950 py-1 rounded border border-cyan-950">
                      <div>Kp:<b className="text-amber-300">{hardwareConfig.pids[oledCursor % 5]?.kp}</b></div>
                      <div>Ki:<b className="text-emerald-300">{hardwareConfig.pids[oledCursor % 5]?.ki}</b></div>
                      <div>Kd:<b className="text-sky-300">{hardwareConfig.pids[oledCursor % 5]?.kd}</b></div>
                    </div>
                    <div className="text-[8.5px] text-center text-slate-400">
                      UPR/DWNR: Pilih PID 1-5 • OKL: Edit Detail
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-cyan-900/80 pt-1 text-[8.5px] text-cyan-400">
                  <span>{oledMenuPage === 'home' ? (isRunning ? '[OKL]STOP' : '[OKL]RUN') : '[OKL]ACT'}</span>
                  <span>www.ichibot.id</span>
                </div>
              </div>

              {/* Right 3 Tactile Buttons: UPR, OKR, DWNR */}
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (oledMenuPage === 'plan' && plans.length > 0 && !isRunning) {
                      const curIdx = plans.findIndex((p) => p.planId === currentPlan?.planId);
                      const nextPlan = plans[(curIdx + 1) % plans.length];
                      if (nextPlan) onChangePlans(plans, nextPlan.planId);
                    } else if (oledMenuPage === 'sensor' && !isRunning) {
                      const counts: SensorCount[] = [2, 4, 5, 6, 8, 12, 14];
                      const nextSc = counts[(counts.indexOf(hardwareConfig.sensorCount) + 1) % counts.length];
                      updateHardware({ sensorCount: nextSc, sensorMode: nextSc >= 6 ? 'mux_4067' : 'direct' }, true, true);
                    } else {
                      setOledCursor((c) => (c + 1) % 5);
                    }
                  }}
                  className="py-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-[9px] shadow border border-rose-400/50 cursor-pointer"
                  title="UPR: Naik / Ganti Nilai"
                >
                  UPR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSyncToCodeAndBlocks(hardwareConfig, plans, activePlanId);
                  }}
                  className="py-2 rounded-lg bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-[9px] shadow border border-rose-300 cursor-pointer"
                  title="OKR: Sync ke Kode Arduino & Blok"
                >
                  OKR
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (oledMenuPage === 'plan' && steps.length > 0 && !isRunning) {
                      const curStepIdx = steps.findIndex((s) => s.index === chosenStep);
                      const nextStep = curStepIdx + 1 < steps.length ? steps[curStepIdx + 1].index : null;
                      setStartStep(nextStep);
                    } else {
                      setOledCursor((c) => (c + 4) % 5);
                    }
                  }}
                  className="py-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-[9px] shadow border border-rose-400/50 cursor-pointer"
                  title="DWNR: Turun / Langkah Berikutnya"
                >
                  DWNR
                </button>
              </div>
            </div>
          </div>
        )}
        {activeDrawer === 'plan' && (
          <section aria-label="Langkah Plan" className={`absolute inset-x-2 top-2 z-30 max-h-[calc(100%-1rem)] overflow-auto rounded-2xl border p-3 shadow-xl ${isLight ? 'border-sky-200 bg-white' : 'border-slate-600 bg-slate-900'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold">{currentPlan ? `Langkah Plan ${currentPlan.planId}` : 'Langkah Plan'}</h3>
              <div className="flex gap-2">
                <button type="button" onClick={addStep} disabled={!currentPlan || isRunning || newStepIndex === undefined} className={controlStyle}>Tambah langkah</button>
                <button type="button" onClick={() => setActiveDrawer('none')} className={controlStyle}>Tutup</button>
              </div>
            </div>
            <p className="my-2 text-xs text-slate-500 dark:text-slate-400">Pilih langkah untuk mengatur sensor, motor, dan kapan robot berhenti.</p>
            {currentPlan?.items.length ? (
              <ol className="divide-y divide-slate-500/20">
                {currentPlan.items.map((item, position) => {
                  if (item.type !== 'step') return position === 0 || currentPlan.items[position - 1].type === 'stop_here'
                    ? <li key={position} className="py-2 text-xs">Stop · {item.stage}</li> : null;
                  const active = isRunning && execStatus.stepIndex === item.index;
                  const nextItem = currentPlan.items[position + 1];
                  const numericFields = [
                    ['index', 'Index', 0, 99], ['triggerValue', 'Durasi gerakan', 0, 20000], ['brake', 'Rem (ms)', 0, 1000],
                    ['speedL', 'PWM kiri', -255, 255], ['speedR', 'PWM kanan', -255, 255], ['speedA', 'Speed A', -255, 255],
                    ['timerValue', 'Durasi Speed A', 0, 10000],
                  ] as const;
                  const unitOptions = [['ms', 'Milidetik'], ['enc_l', 'Encoder kiri'], ['enc_r', 'Encoder kanan']] as const;
                  const choices = [
                    ['triggerMode', 'Pemicu', [['SENSOR', 'Sensor garis'], ['MOTION', 'Langsung bergerak']]],
                    ['sensorPattern', 'Pola sensor', [
                      ...(sensorPresets.some(preset => preset.pattern === item.sensorPattern) ? [] : [[item.sensorPattern, item.sensorPattern]]),
                      ...sensorPresets.map(preset => [preset.pattern, `${preset.label} · ${preset.pattern}`]),
                    ]],
                    ['logicOp', 'Logika sensor', [['EQUAL', 'EQUAL'], ['AND', 'AND'], ['OR', 'OR'], ['XOR', 'XOR']]],
                    ['action', 'Gerakan', [['MAJU', 'Maju'], ['MUNDUR', 'Mundur'], ['LEFT', 'Belok kiri'], ['RIGHT', 'Belok kanan'], ['PAUSE', 'Jeda']]],
                    ['triggerUnit', 'Satuan durasi gerakan', unitOptions],
                    ['pidId', 'Profil PID', [['0', 'Tanpa PID'], ...hardwareConfig.pids.map(profile => [String(profile.id), `PID ${profile.id} · ${profile.label}`])]],
                    ['timerUnit', 'Satuan Speed A', unitOptions],
                    ['lineColor', 'Warna garis', [['HITAM', 'Hitam'], ['PUTIH', 'Putih']]],
                  ] as const;
                  return <li key={item.blockId ?? position} aria-current={active ? 'step' : undefined}>
                    <button type="button" aria-expanded={expandedStep === position} onClick={() => setExpandedStep(value => value === position ? null : position)}
                      className={`flex min-h-10 w-full items-center justify-between gap-2 px-2 text-left text-xs font-semibold ${active ? (isLight ? 'bg-sky-100' : 'bg-sky-950') : ''}`}>
                      <span>Langkah {item.index} · {choices[3][2].find(([value]) => value === item.action)?.[1]}</span>
                      <span className="font-mono">{item.speedL} / {item.speedR} PWM</span>
                    </button>
                    {expandedStep === position && <fieldset disabled={isRunning || !plans.length} className="grid grid-cols-2 gap-2 px-2 pb-3 text-xs sm:grid-cols-3">
                      {choices.map(([field, label, options]) => <label key={field} className="grid min-w-0 gap-1">
                        {label}
                        <select value={item[field]} className={controlStyle}
                          onChange={event => editStep(position, { [field]: field === 'pidId' ? Number(event.target.value) : event.target.value })}>
                          {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                        </select>
                      </label>)}
                      {numericFields.map(([field, label, min, max]) => <label key={field} className="grid min-w-0 gap-1">
                        {label}
                        <input key={item[field]} type="number" min={min} max={max} defaultValue={item[field]} className={controlStyle}
                          onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                          onBlur={event => {
                            const input = event.currentTarget;
                            const value = Number.isFinite(input.valueAsNumber) ? Math.min(max, Math.max(min, Math.round(input.valueAsNumber))) : item[field];
                            input.value = String(value);
                            if (value !== item[field]) editStep(position, { [field]: value });
                          }} />
                      </label>)}
                      <label className="grid min-w-0 gap-1">Berhenti setelah
                        <select value={nextItem?.type === 'stop_here' ? nextItem.stage : ''} className={controlStyle}
                          onChange={event => changeStop(position, event.target.value as '' | 'ACTION' | 'SPEED_A')}>
                          <option value="">Lanjut ke langkah berikutnya</option>
                          <option value="ACTION">Gerakan dan rem</option>
                          <option value="SPEED_A">Speed A</option>
                        </select>
                      </label>
                      <button type="button" className={controlStyle} onClick={() => {
                        replacePlanItems(currentPlan.items.filter((_, i) => i !== position && !(i === position + 1 && nextItem?.type === 'stop_here')));
                        setExpandedStep(null);
                      }}>Hapus langkah</button>
                    </fieldset>}
                  </li>;
                })}
              </ol>
            ) : <p className="text-xs">Susun Plan di editor blok untuk mulai.</p>}
          </section>
        )}
        {/* Floating Collapsible Drawers with Close Button */}
        {activeDrawer === 'pdf_samples' && (
          <div
            className={`absolute top-2 left-2 right-2 z-30 px-4 py-3 rounded-xl backdrop-blur-md border shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs ${
              isLight
                ? 'bg-white/95 border-emerald-400 text-slate-800'
                : 'bg-[#0e1b30]/95 border-emerald-500/40 text-slate-100'
            }`}
          >
            <div>
              <div className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                📄 Paket Contoh File PDF Track Siap Pakai
              </div>
              <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Klik nama track untuk langsung mencoba di arena, atau unduh file PDF-nya.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'oval', label: 'Track 1: Basic Oval', href: '/tracks/track-basic-oval.pdf' },
                { id: 'maze', label: 'Track 2: Perempatan Maze', href: '/tracks/track-perempatan-maze.pdf' },
                { id: 'pro', label: 'Track 3: Lomba Pro', href: '/tracks/track-lomba-pro.pdf' },
              ].map((sample) => (
                <div
                  key={sample.id}
                  className={`flex items-center gap-1.5 border rounded-lg px-2.5 py-1.5 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectTrack(sample.id);
                      setActiveDrawer('none');
                    }}
                    className={`font-bold cursor-pointer ${
                      isLight ? 'text-sky-600 hover:text-sky-700' : 'text-sky-300 hover:text-sky-200'
                    }`}
                  >
                    {sample.label}
                  </button>
                  <a
                    href={sample.href}
                    download
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      isLight
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    ⬇ PDF
                  </a>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setActiveDrawer('none')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                ✕ Tutup
              </button>
            </div>
          </div>
        )}

        {activeDrawer === 'hardware' && (
          <div
            className={`absolute top-2 left-2 right-2 z-30 px-4 py-3 rounded-xl backdrop-blur-md border shadow-2xl space-y-3 text-xs max-h-[85%] overflow-y-auto ${
              isLight
                ? 'bg-white/95 border-amber-400 text-slate-800'
                : 'bg-[#0e1b30]/95 border-amber-500/40 text-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`font-extrabold flex items-center gap-2 ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                <Settings className="w-4 h-4" /> ⚙️ Konfigurasi Robot Real, Motor RPM & Smart Auto-Pinout
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateHardware({}, true, true)}
                  className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  }`}
                >
                  ✨ Estimasi Pin & PID Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {/* Robot Preset */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Jenis Robot
                </label>
                <select
                  value={hardwareConfig.preset}
                  onChange={(e) => {
                    const preset = e.target.value as RobotHardwareConfig['preset'];
                    const name =
                      preset === 'line_follower'
                        ? 'Robot Line Follower'
                        : preset === 'maze_solver'
                          ? 'Maze Solver Pro'
                          : 'Robot Bebas';
                    updateHardware({ preset, robotName: name });
                  }}
                  className={`w-full border rounded px-2 py-1 font-semibold ${
                    isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#111e34] text-slate-100 border-slate-700'
                  }`}
                >
                  <option value="line_follower">🏎️ Line Follower</option>
                  <option value="maze_solver">🧩 Maze Solver Pro</option>
                  <option value="free_robot">🤖 Robot Bebas (Custom)</option>
                </select>
              </div>

              {/* Microcontroller */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Mikrokontroler
                </label>
                <select
                  value={hardwareConfig.mcu}
                  onChange={(e) =>
                    updateHardware({ mcu: e.target.value as RobotMcuId }, true, false)
                  }
                  className={`w-full border rounded px-2 py-1 font-bold ${
                    isLight ? 'bg-white text-sky-700 border-slate-300' : 'bg-[#111e34] text-sky-300 border-slate-700'
                  }`}
                >
                  <option value="Arduino Uno">Arduino Uno</option>
                  <option value="Arduino Nano">Arduino Nano</option>
                  <option value="Arduino Mega">Arduino Mega</option>
                  <option value="ESP32 DevKit V1">ESP32 DevKit V1</option>
                  <option value="NodeMCU / ESP8266">NodeMCU / ESP8266</option>
                </select>
              </div>

              {/* Jumlah Sensor Garis */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Jumlah Sensor Garis (0 / X)
                </label>
                <select
                  value={hardwareConfig.sensorCount}
                  onChange={(e) => {
                    const sc = parseInt(e.target.value, 10) as SensorCount;
                    const mode: SensorReadMode =
                      (sc === 2 || sc === 4)
                        ? 'direct'
                        : (sc >= 6 ? 'mux_4067' : (hardwareConfig.sensorMode === 'direct' ? 'mux_4051' : hardwareConfig.sensorMode));
                    updateHardware({ sensorCount: sc, sensorMode: mode }, true, true);
                  }}
                  className={`w-full border rounded px-2 py-1 font-bold ${
                    isLight ? 'bg-white text-emerald-700 border-slate-300' : 'bg-[#111e34] text-emerald-300 border-slate-700'
                  }`}
                >
                  {[2, 4, 5, 6, 8, 12, 14].map((n) => (
                    <option key={n} value={n}>
                      {n} Sensor {n === 14 ? '(Ichibot Ultimate 5)' : `(Pola: ${'0'.repeat(Math.min(2, n)) + 'x'.repeat(Math.max(0, n - 4)) + (n > 2 ? '0'.repeat(Math.min(2, n - 2)) : '')})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Pembacaan Sensor (Direct vs Multiplexer) */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Mode Baca Sensor / Mux
                </label>
                {hardwareConfig.sensorCount === 2 || hardwareConfig.sensorCount === 4 ? (
                  <div className={`px-2 py-1.5 rounded text-xs font-semibold flex items-center justify-between ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/60'
                  }`}>
                    <span>⚡ Tanpa Multiplexer (Direct Pin)</span>
                    <span className="text-[10px] opacity-75">Otomatis ({hardwareConfig.sensorCount} Sensor)</span>
                  </div>
                ) : (
                  <select
                    value={hardwareConfig.sensorMode}
                    onChange={(e) =>
                      updateHardware({ sensorMode: e.target.value as SensorReadMode }, true, false)
                    }
                    className={`w-full border rounded px-2 py-1 font-semibold ${
                      isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#111e34] text-slate-100 border-slate-700'
                    }`}
                  >
                    <option value="mux_4067">Multiplexer CD74HC4067 (S0..S3 + SIG)</option>
                    <option value="mux_4051">Multiplexer 74HC4051 (S0..S2 + SIG)</option>
                    <option value="direct">Pin Sensor Langsung (Direct ADC/Digital)</option>
                  </select>
                )}
              </div>

              {/* Jenis Motor & RPM */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Jenis Motor DC
                </label>
                <select
                  value={hardwareConfig.motorPreset}
                  onChange={(e) => {
                    const mp = e.target.value as MotorPresetId;
                    const info = MOTOR_PRESETS[mp];
                    updateHardware(
                      {
                        motorPreset: mp,
                        motorRpm: info.rpm,
                        wheelDiameterMm: info.wheelMm,
                      },
                      false,
                      true
                    );
                  }}
                  className={`w-full border rounded px-2 py-1 font-bold ${
                    isLight ? 'bg-white text-amber-700 border-slate-300' : 'bg-[#111e34] text-amber-300 border-slate-700'
                  }`}
                >
                  {Object.entries(MOTOR_PRESETS).map(([id, m]) => (
                    <option key={id} value={id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input RPM Motor Manual */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Kecepatan Motor (RPM) & Ø Roda
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={50}
                    max={3000}
                    value={hardwareConfig.motorRpm}
                    onChange={(e) =>
                      updateHardware(
                        {
                          motorPreset: 'custom',
                          motorRpm: Math.max(50, parseInt(e.target.value, 10) || 300),
                        },
                        false,
                        true
                      )
                    }
                    className={`w-20 border rounded px-2 py-1 font-mono font-bold ${
                      isLight ? 'bg-white text-amber-700 border-slate-300' : 'bg-[#111e34] text-amber-300 border-slate-700'
                    }`}
                  />
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>RPM</span>
                  <input
                    type="number"
                    min={20}
                    max={120}
                    value={hardwareConfig.wheelDiameterMm}
                    onChange={(e) =>
                      updateHardware({
                        wheelDiameterMm: Math.max(20, parseInt(e.target.value, 10) || 34),
                      })
                    }
                    className={`w-14 border rounded px-1.5 py-1 font-mono ${
                      isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#111e34] text-slate-200 border-slate-700'
                    }`}
                  />
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>mm</span>
                </div>
              </div>

              {/* Wheel Encoder Toggle */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Encoder Roda (L & R)
                </label>
                <select
                  value={hardwareConfig.hasEncoder ? 'yes' : 'no'}
                  onChange={(e) => updateHardware({ hasEncoder: e.target.value === 'yes' })}
                  className={`w-full border rounded px-2 py-1 font-bold ${
                    isLight ? 'bg-white text-cyan-700 border-slate-300' : 'bg-[#111e34] text-cyan-300 border-slate-700'
                  }`}
                >
                  <option value="yes">✅ Ada Encoder (ms / Enc L / Enc R)</option>
                  <option value="no">❌ Tidak Ada Encoder (Hanya ms)</option>
                </select>
              </div>

              {/* Ultrasonic Sensor Toggle */}
              <div className={`p-2 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#091220] border-slate-800'}`}>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sensor Ultrasonic
                </label>
                <select
                  value={hardwareConfig.ultrasonicMode}
                  onChange={(e) =>
                    updateHardware({ ultrasonicMode: e.target.value as UltrasonicMode })
                  }
                  className={`w-full border rounded px-2 py-1 font-semibold ${
                    isLight ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#111e34] text-slate-100 border-slate-700'
                  }`}
                >
                  <option value="none">Tidak Pakai Ultrasonic</option>
                  <option value="front">1 Ultrasonic (Depan)</option>
                  <option value="three">3 Ultrasonic (Depan, Kiri, Kanan)</option>
                </select>
              </div>
            </div>

            {/* Pin Selector Row (PWM, Multiplexer S0..S3/SIG, Encoder Interrupt) */}
            <div
              className={`flex flex-wrap items-center gap-3 pt-1 border-t text-[11px] ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}
            >
              <span className={`font-bold ${isLight ? 'text-sky-700' : 'text-sky-400'}`}>
                🔌 Pilihan Pin Otomatis ({hardwareConfig.mcu}):
              </span>
              <label className="flex items-center gap-1">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>PWM L:</span>
                <select
                  value={hardwareConfig.pins.pwmL}
                  onChange={(e) =>
                    updateHardware({ pins: { ...hardwareConfig.pins, pwmL: e.target.value } })
                  }
                  className={`border rounded px-1.5 py-0.5 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-amber-700' : 'bg-[#111e34] border-slate-700 text-amber-300'
                  }`}
                >
                  {boardPins.pwmPins.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>PWM R:</span>
                <select
                  value={hardwareConfig.pins.pwmR}
                  onChange={(e) =>
                    updateHardware({ pins: { ...hardwareConfig.pins, pwmR: e.target.value } })
                  }
                  className={`border rounded px-1.5 py-0.5 font-mono ${
                    isLight ? 'bg-white border-slate-300 text-amber-700' : 'bg-[#111e34] border-slate-700 text-amber-300'
                  }`}
                >
                  {boardPins.pwmPins.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              {hardwareConfig.sensorMode !== 'direct' && hardwareConfig.sensorCount !== 2 && hardwareConfig.sensorCount !== 4 ? (
                <>
                  <span className={`font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                    Mux S0..S3: [{hardwareConfig.pins.muxS0}, {hardwareConfig.pins.muxS1}, {hardwareConfig.pins.muxS2}
                    {hardwareConfig.sensorMode === 'mux_4067' ? `, ${hardwareConfig.pins.muxS3}` : ''}]
                  </span>
                  <label className="flex items-center gap-1">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Mux SIG:</span>
                    <select
                      value={hardwareConfig.pins.muxSig}
                      onChange={(e) =>
                        updateHardware({ pins: { ...hardwareConfig.pins, muxSig: e.target.value } })
                      }
                      className={`border rounded px-1.5 py-0.5 font-mono ${
                        isLight ? 'bg-white border-slate-300 text-emerald-700' : 'bg-[#111e34] border-slate-700 text-emerald-300'
                      }`}
                    >
                      {boardPins.analogPins.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : (
                <span className={`font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                  Direct Pin Sensor: [{hardwareConfig.pins.sensorDirectPins.slice(0, hardwareConfig.sensorCount).join(', ')}] (Tanpa Mux)
                </span>
              )}

              {hardwareConfig.hasEncoder && (
                <span className={`font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                  Interrupt Enc L/R: [{hardwareConfig.pins.encLA}, {hardwareConfig.pins.encRA}]
                </span>
              )}
            </div>
          </div>
        )}

        {activeDrawer === 'pid' && (
          <div
            className={`absolute top-2 left-2 right-2 z-30 px-4 py-3 rounded-xl backdrop-blur-md border shadow-2xl space-y-2.5 text-xs ${
              isLight
                ? 'bg-white/95 border-fuchsia-400 text-slate-800'
                : 'bg-[#12112a]/95 border-fuchsia-500/40 text-slate-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className={`font-extrabold ${isLight ? 'text-fuchsia-700' : 'text-fuchsia-300'}`}>
                  🎛️ Kombinasi PID 1 – 5 (Menyesuaikan Motor {hardwareConfig.motorRpm} RPM & {hardwareConfig.sensorCount} Sensor)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    updateHardware({
                      pids: computeAutoPidProfiles(hardwareConfig.motorRpm, hardwareConfig.sensorCount),
                    })
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-[11px] cursor-pointer ${
                    isLight
                      ? 'bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300'
                      : 'bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border-fuchsia-500/40'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" /> Reset Kombinasi Auto PID 1–5
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDrawer('none')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {hardwareConfig.pids.map((pid, idx) => (
                <div
                  key={pid.id}
                  className={`border rounded-lg p-2 space-y-1.5 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d1a] border-slate-800'
                  }`}
                >
                  <div className={`font-bold text-[11px] truncate ${isLight ? 'text-fuchsia-700' : 'text-fuchsia-300'}`}>
                    {pid.label}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <label className="flex flex-col">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Kp</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pid.kp}
                        onChange={(e) => {
                          const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                          nextPids[idx] = { ...pid, kp: parseFloat(e.target.value) || 0 };
                          updateHardware({ pids: nextPids });
                        }}
                        className={`border rounded px-1.5 py-0.5 font-mono font-bold ${
                          isLight ? 'bg-white border-slate-300 text-amber-700' : 'bg-[#11192e] border-slate-700 text-amber-300'
                        }`}
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Ki</span>
                      <input
                        type="number"
                        step="0.01"
                        value={pid.ki}
                        onChange={(e) => {
                          const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                          nextPids[idx] = { ...pid, ki: parseFloat(e.target.value) || 0 };
                          updateHardware({ pids: nextPids });
                        }}
                        className={`border rounded px-1.5 py-0.5 font-mono font-bold ${
                          isLight ? 'bg-white border-slate-300 text-emerald-700' : 'bg-[#11192e] border-slate-700 text-emerald-300'
                        }`}
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Kd</span>
                      <input
                        type="number"
                        step="0.5"
                        value={pid.kd}
                        onChange={(e) => {
                          const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                          nextPids[idx] = { ...pid, kd: parseFloat(e.target.value) || 0 };
                          updateHardware({ pids: nextPids });
                        }}
                        className={`border rounded px-1.5 py-0.5 font-mono font-bold ${
                          isLight ? 'bg-white border-slate-300 text-sky-700' : 'bg-[#11192e] border-slate-700 text-sky-300'
                        }`}
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>dt (ms)</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={pid.dt}
                        onChange={(e) => {
                          const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                          nextPids[idx] = { ...pid, dt: Math.max(1, parseInt(e.target.value, 10) || 10) };
                          updateHardware({ pids: nextPids });
                        }}
                        className={`border rounded px-1.5 py-0.5 font-mono font-bold ${
                          isLight ? 'bg-white border-slate-300 text-purple-700' : 'bg-[#11192e] border-slate-700 text-purple-300'
                        }`}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <canvas
          ref={viewportCanvasRef}
          width={1280}
          height={760}
          aria-label="Lintasan robot"
          onClick={handleCanvasClick}
          onMouseDown={(e) => {
            if (placementTool !== 'none') return;
            dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
          }}
          onMouseMove={(e) => {
            if (!dragRef.current.active || cameraMode !== '3d_persp') return;
            const dx = e.clientX - dragRef.current.lastX;
            const dy = e.clientY - dragRef.current.lastY;
            dragRef.current.lastX = e.clientX;
            dragRef.current.lastY = e.clientY;
            setCamYaw((y) => y + dx * 0.006);
            setCamPitch((p) => Math.max(0.3, Math.min(1.35, p + dy * 0.005)));
          }}
          onMouseUp={() => {
            dragRef.current.active = false;
          }}
          onWheel={(e) => {
            setCamZoom((z) => Math.max(0.55, Math.min(2.2, z - e.deltaY * 0.0008)));
          }}
          className={`w-full h-full block ${
            placementTool !== 'none' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* Placement Mode Helper Toast */}
        {placementTool !== 'none' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-2">
            <span>
              {placementTool === 'start' && 'Klik pada lantai arena untuk memindahkan titik START'}
              {placementTool === 'finish' && 'Klik pada lantai arena untuk memindahkan titik FINIS'}
              {placementTool === 'robot' && 'Klik pada lantai arena untuk memindahkan posisi Robot'}
              {placementTool === 'draw_line' && 'Klik titik-titik pada arena untuk menggambar garis lintasan'}
            </span>
            <button
              type="button"
              onClick={() => setPlacementTool('none')}
              className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] cursor-pointer"
            >
              Selesai
            </button>
          </div>
        )}
      </div>

      {/* ── KIDS-FRIENDLY BOTTOM TELEMETRY & SENSOR STATUS DOCK (Never covers the Arena Track!) ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 border-t text-xs shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-700'
            : 'bg-[#0a1324] border-slate-800/90 text-slate-100'
        }`}
      >
        {trackResults.length > 0 && (
          <p className="w-full text-xs font-semibold">
            Finis terakhir: {trackResults[0].seconds.toFixed(2)} dtk · Terbaik sesi ini: {Math.min(...trackResults.map(result => result.seconds)).toFixed(2)} dtk
          </p>
        )}
        {/* Left: Timer, RPM & Motor Speeds */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700/80'
            }`}
          >
            <span className={`text-[10px] font-bold ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>⏱️ WAKTU</span>
            <span className={`font-extrabold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {simElapsedSec.toFixed(2)}s
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-[11px] ${
              isLight
                ? 'bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
              ⚡ {hardwareConfig.motorRpm} RPM
            </span>
            <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
            <span>
              PWM L/R:{' '}
              <b className={isLight ? 'text-slate-900' : 'text-white'}>{liveSpeeds.l}</b> /{' '}
              <b className={isLight ? 'text-slate-900' : 'text-white'}>{liveSpeeds.r}</b>
            </span>
            {hardwareConfig.hasEncoder && (
              <>
                <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
                <span className={isLight ? 'text-cyan-700' : 'text-cyan-300'}>
                  Enc: <b>{encoderLeft}</b>/<b>{encoderRight}</b>
                </span>
              </>
            )}
            {hardwareConfig.ultrasonicMode !== 'none' && (
              <>
                <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
                <span className={isLight ? 'text-sky-700' : 'text-sky-300'}>
                  Ultra: <b>{ultrasonicCm}cm</b>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Center: Kids-Friendly Live Sensor Array ('0' = Garis, 'X' = Luar Garis) */}
        <div
          className={`flex items-center gap-1.5 border px-2.5 py-0.5 rounded-xl ${
            isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wide ${
              isLight ? 'text-sky-700' : 'text-sky-300'
            }`}
          >
            Sensor ({hardwareConfig.sensorCount}):
          </span>
          <div className="flex items-center gap-1">
            {sensorReadings.map((active, i) => (
              <span
                key={i}
                title={active ? `Sensor ${i + 1}: 0 (Membaca Garis)` : `Sensor ${i + 1}: X (Tidak Membaca Garis)`}
                className={`w-4 h-4 rounded flex items-center justify-center font-mono text-[10px] font-extrabold border transition-all ${
                  active
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_6px_rgba(34,197,94,0.75)] scale-105'
                    : isLight
                      ? 'bg-white text-rose-600 border-slate-300'
                      : 'bg-slate-800 text-rose-400 border-slate-700'
                }`}
              >
                {active ? '0' : 'X'}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Active Running Block / Step Index Status */}
        <div
          className={`px-2.5 py-0.5 rounded-xl border text-[11px] font-extrabold flex items-center gap-1.5 transition-all ${
            execStatus.stoppedByInterrupt
              ? isLight
                ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse'
                : 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
              : isRunning
                ? isLight
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                  : 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                : isLight
                  ? 'bg-slate-100 border-slate-300 text-slate-600'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          {execStatus.stoppedByInterrupt ? (
            <OctagonAlert className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
          ) : (
            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
          )}
          <span className="truncate max-w-[300px]">{execStatus.message}</span>
        </div>
      </div>
    </div>
  );
};
export default RobotArena3D;
