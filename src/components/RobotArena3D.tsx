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
  Flag,
  MapPin,
  Navigation,
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
  estimateRobotPins,
  computeAutoPidProfiles,
  evaluateSensorPatternMatch,
  normalizeSensorPattern,
  parseRobotPlansFromCode,
} from '../types/robotSimulator';

interface RobotArena3DProps {
  isRunning: boolean;
  onToggleRun?: () => void;
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
  type: 'empty' | 'oval' | 'maze' | 'pro' | 'custom_pdf';
  customCanvas?: HTMLCanvasElement;
}

const TRACK_W = 1200;
const TRACK_H = 800;

export const RobotArena3D: React.FC<RobotArena3DProps> = ({
  isRunning,
  onToggleRun,
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
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('3d_persp');
  const [camYaw, setCamYaw] = useState<number>(-0.32); // radians
  const [camPitch, setCamPitch] = useState<number>(0.78); // tilt
  const [camZoom, setCamZoom] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track & Arena state
  const [tracks, setTracks] = useState<TrackPreset[]>([
    { id: 'empty', name: 'Arena Kosong (Gambar Sendiri)', type: 'empty' },
    {
      id: 'oval',
      name: 'Track 1: Basic Oval & Checkpoint (PDF)',
      type: 'oval',
      pdfUrl: '/tracks/track-basic-oval.pdf',
    },
    {
      id: 'maze',
      name: 'Track 2: Perempatan & Maze Plan (PDF)',
      type: 'maze',
      pdfUrl: '/tracks/track-perempatan-maze.pdf',
    },
    {
      id: 'pro',
      name: 'Track 3: Kompetisi Pro Hitam/Putih (PDF)',
      type: 'pro',
      pdfUrl: '/tracks/track-lomba-pro.pdf',
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
  const [activeDrawer, setActiveDrawer] = useState<'none' | 'hardware' | 'pid' | 'pdf_samples'>('none');

  // Robot live state
  const [robotPose, setRobotPose] = useState<{ x: number; y: number; theta: number }>({
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

  // Trail history
  const trailRef = useRef<Array<{ x: number; y: number }>>([]);
  const viewportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackSurfaceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trackImageDataRef = useRef<ImageData | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

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
    }

    trackImageDataRef.current = ctx.getImageData(0, 0, TRACK_W, TRACK_H);
  }, [selectedTrackId, tracks, customSegments]);

  useEffect(() => {
    rebuildTrackSurface();
  }, [rebuildTrackSurface]);

  // Adjust default Start/Finish when switching preset track
  const handleSelectTrack = (id: string) => {
    setSelectedTrackId(id);
    if (id === 'oval') {
      setStartPos({ x: 205, y: 645 });
      setFinishPos({ x: 985, y: 175 });
      resetRobotToStart(205, 645, -90);
    } else if (id === 'maze') {
      setStartPos({ x: 155, y: 665 });
      setFinishPos({ x: 1035, y: 155 });
      resetRobotToStart(155, 665, -90);
    } else if (id === 'pro') {
      setStartPos({ x: 145, y: 660 });
      setFinishPos({ x: 1035, y: 635 });
      resetRobotToStart(145, 660, -90);
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
        wheelAngle: 0,
        finished: false,
      };
      trailRef.current = [{ x: sx, y: sy }];
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
        const frac = count === 1 ? 0 : i / (count - 1) - 0.5;
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

  // Reset simulation state when isRunning transitions from false -> true
  useEffect(() => {
    if (isRunning) {
      const rad = (initialHeadingDeg * Math.PI) / 180;
      simStateRef.current = {
        x: startPos.x,
        y: startPos.y,
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
        wheelAngle: 0,
        finished: false,
      };
      trailRef.current = [{ x: startPos.x, y: startPos.y }];
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

    // Determine active plan (from props or parsed from code)
    const parsedFromCode = parseRobotPlansFromCode(code, hardwareConfig.sensorCount);
    const effectivePlans = plans.length > 0 ? plans : parsedFromCode?.plans || [];
    const targetPlanId = activePlanId || parsedFromCode?.activePlanId || 1;
    const currentPlan =
      effectivePlans.find((p) => p.planId === targetPlanId) || effectivePlans[0] || null;

    const tick = (now: number) => {
      const dtMs = Math.min(40, Math.max(4, now - lastTime));
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
          setSensorReadings(sensors);

          let cmdSpeedL = 0;
          let cmdSpeedR = 0;

          // Calculate PID steering correction if PID 1..5 is selected
          const computePidCorrection = (): number => {
            if (step.pidId < 1 || step.pidId > 5) return 0;
            const pid = hardwareConfig.pids[step.pidId - 1];
            if (!pid) return 0;

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
            s.pidIntegral = Math.max(-30, Math.min(30, s.pidIntegral + err * (dtMs / 1000)));
            const deriv = (err - s.pidLastErr) / Math.max(0.005, dtMs / 1000);
            s.pidLastErr = err;
            return pid.kp * err + pid.ki * s.pidIntegral + pid.kd * deriv * 0.08;
          };

          const hasDurationElapsed = (targetVal: number, unit: 'ms' | 'enc_l' | 'enc_r'): boolean => {
            if (targetVal <= 0) return true;
            if (unit === 'enc_l') {
              return Math.abs(s.encL - s.stageStartEncL) >= targetVal;
            }
            if (unit === 'enc_r') {
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
              const minGuardPassed = s.itemCursor === 0 ? true : s.elapsedMs - s.stageStartMs >= 35;
              const patternMatched =
                minGuardPassed &&
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
            const trigVal = step.triggerValue ?? 100;
            setExecStatus({
              stepIndex: step.index,
              stage: 'ACTION',
              message: `▶ Index #${step.index} [AKSI: ${step.action} ${trigVal} ${step.triggerUnit.toUpperCase()}] · Speed L:${step.speedL} R:${step.speedR}`,
              stoppedByInterrupt: false,
            });

            if (step.action === 'PAUSE') {
              cmdSpeedL = 0;
              cmdSpeedR = 0;
            } else if (step.action === 'LEFT') {
              // Belok kiri: roda kiri mundur/lambat, roda kanan maju
              if (step.speedL < 0 || (step.speedL === 0 && step.speedR > 0)) {
                cmdSpeedL = step.speedL;
                cmdSpeedR = step.speedR;
              } else {
                cmdSpeedL = -Math.abs(step.speedL || 140);
                cmdSpeedR = Math.abs(step.speedR || 140);
              }
            } else if (step.action === 'RIGHT') {
              // Belok kanan: roda kiri maju, roda kanan mundur/lambat
              if (step.speedR < 0 || (step.speedR === 0 && step.speedL > 0)) {
                cmdSpeedL = step.speedL;
                cmdSpeedR = step.speedR;
              } else {
                cmdSpeedL = Math.abs(step.speedL || 140);
                cmdSpeedR = -Math.abs(step.speedR || 140);
              }
            } else if (step.action === 'MUNDUR') {
              cmdSpeedL = -Math.abs(step.speedL || 140);
              cmdSpeedR = -Math.abs(step.speedR || 140);
            } else {
              // MAJU
              if (step.pidId > 0) {
                const pidCorr = computePidCorrection();
                cmdSpeedL = Math.max(-255, Math.min(255, step.speedL + pidCorr));
                cmdSpeedR = Math.max(-255, Math.min(255, step.speedR - pidCorr));
              } else {
                cmdSpeedL = step.speedL;
                cmdSpeedR = step.speedR;
              }
            }

            // Cek apakah aksi sudah selesai sesuai durasi / encoder yang ditentukan
            const actionDone = hasDurationElapsed(trigVal, step.triggerUnit);

            if (actionDone) {
              // Aksi pada index selesai -> Lanjut ke tahap Pengereman
              s.subStage = 'BRAKE';
              s.stageStartMs = s.elapsedMs;
              s.stageStartEncL = s.encL;
              s.stageStartEncR = s.encR;
            }
          } else if (s.subStage === 'BRAKE') {
            // ── 3. PENGEREMAN ──
            const brakeMs = step.brake > 0 ? step.brake : 20;
            let prevL = step.speedL || 140;
            let prevR = step.speedR || 140;
            if (step.action === 'LEFT') {
              prevL = -Math.abs(step.speedL || 140);
              prevR = Math.abs(step.speedR || 140);
            } else if (step.action === 'RIGHT') {
              prevL = Math.abs(step.speedL || 140);
              prevR = -Math.abs(step.speedR || 140);
            } else if (step.action === 'MUNDUR') {
              prevL = -Math.abs(step.speedL || 140);
              prevR = -Math.abs(step.speedR || 140);
            } else if (step.action === 'PAUSE') {
              prevL = 0;
              prevR = 0;
            }
            cmdSpeedL = -prevL * 0.45;
            cmdSpeedR = -prevR * 0.45;

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
            const pidCorr = computePidCorrection();
            const baseSpeedA = step.speedA || 120;
            cmdSpeedL = Math.max(-255, Math.min(255, baseSpeedA + pidCorr));
            cmdSpeedR = Math.max(-255, Math.min(255, baseSpeedA - pidCorr));

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
          setLiveSpeeds({ l: Math.round(cmdSpeedL), r: Math.round(cmdSpeedR) });
        }
      } else if (!isRunning) {
        // Sample sensors passively when idle so LEDs react as user moves robot
        const passiveSensors = sampleSensorsAtPose(s.x, s.y, s.theta, 'HITAM');
        setSensorReadings(passiveSensors);
      }

      // Render 3D / 2D Viewport
      renderArenaViewport();
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

      // Draw Robot Movement Trail on track plane
      if (trailRef.current.length > 1) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.65)';
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        trailRef.current.forEach((pt, idx) =>
          idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)
        );
        ctx.stroke();
        ctx.setLineDash([]);
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
      // REALISTIC 3D LINE FOLLOWER ROBOT RENDERER (T-Hammerhead Competition Chassis)
      // ============================================================================
      const rScale = (hardwareConfig.robotScale || 1.0) * 1.18;

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

      // 1. Soft Robot Ground Shadow (T-Hammerhead silhouette)
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

      // 2. Left & Right 3D Rubber Tires + Yellow DC Gearbox Motors
      const wheelSides = [-1, 1]; // -1 = Left, +1 = Right
      for (const side of wheelSides) {
        const yInner = side * 22;
        const yOuter = side * 32;

        // Yellow DC Gearbox Motor block (inside wheel)
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
          '#facc15',
          '#ca8a04',
          '#eab308',
          '#fef08a',
          1
        );

        // Slotted Optical Encoder Disc (if hasEncoder is enabled)
        if (hardwareConfig.hasEncoder) {
          const encY = side * 20.5;
          drawExtrudedLocalPoly(
            [
              [-6, encY - side * 1.2],
              [-6, encY + side * 1.2],
              [-20, encY + side * 1.2],
              [-20, encY - side * 1.2],
            ],
            5,
            18,
            '#38bdf8',
            '#0284c7',
            '#0369a1',
            '#e0f2fe',
            0.8
          );
        }

        // Main Black Rubber Tire with Wide Grip Profile
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

        // Sport Yellow Wheel Rim Hub on the outer side of the tire
        drawExtrudedLocalPoly(
          [
            [2, yOuter - side * 1.5],
            [2, yOuter + side * 0.5],
            [-20, yOuter + side * 0.5],
            [-20, yOuter - side * 1.5],
          ],
          5,
          16,
          '#f59e0b',
          '#d97706',
          '#b45309',
          '#fef3c7',
          0.9
        );

        // Animated Rotating Tire Tread Grooves across top of tire
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.4;
        const treadPhase = ((s.wheelAngle * 6) % 6 + 6) % 6;
        for (let tx = -21 + treadPhase; tx <= 4; tx += 6) {
          const pA = localToWorld(tx, yInner + side * 1.2);
          const pB = localToWorld(tx, yOuter - side * 1.2);
          const sA = project3D(pA.wx, pA.wy, 20.4 * rScale);
          const sB = project3D(pB.wx, pB.wy, 20.4 * rScale);
          ctx.beginPath();
          ctx.moveTo(sA.sx, sA.sy);
          ctx.lineTo(sB.sx, sB.sy);
          ctx.stroke();
        }
      }

      // 3. Main Line Follower T-Hammerhead PCB Chassis (Rear Deck + Neck Bridge + Wide Front Sensor Wing)
      // 3a. Rear & Center Chassis Deck (Vibrant Robotics Orange/Carbon)
      const mainDeckPts: Array<[number, number]> = [
        [25, -12],
        [25, 12],
        [10, 14],
        [6, 22],
        [-27, 22],
        [-33, 16],
        [-33, -16],
        [-27, -22],
        [6, -22],
        [10, -14],
      ];
      drawExtrudedLocalPoly(
        mainDeckPts,
        5,
        13,
        '#f97316',
        '#c2410c',
        '#ea580c',
        '#ffedd5',
        1.5
      );

      // Gold PCB Traces on the Neck Bridge connecting MCU to Front Sensor Bar
      for (const traceY of [-6, -2, 2, 6]) {
        const tStart = localToWorld(6, traceY);
        const tEnd = localToWorld(27, traceY * 1.4);
        const pStart = project3D(tStart.wx, tStart.wy, 13.4 * rScale);
        const pEnd = project3D(tEnd.wx, tEnd.wy, 13.4 * rScale);
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(pStart.sx, pStart.sy);
        ctx.lineTo(pEnd.sx, pEnd.sy);
        ctx.stroke();
      }

      // 3b. Wide Curved/Angled Front Sensor Array Wing Bar (Iconic Line Follower Nose)
      const sensorWingWidth =
        hardwareConfig.sensorCount === 2
          ? 16
          : hardwareConfig.sensorCount === 4
          ? 24
          : Math.max(33, Math.min(44, 24 + hardwareConfig.sensorCount * 1.6));
      const sSpan =
        hardwareConfig.sensorCount === 2
          ? 16
          : hardwareConfig.sensorCount === 4
          ? 30
          : (sensorWingWidth - 5) * 2;
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
      drawExtrudedLocalPoly(
        frontWingPts,
        3,
        11,
        '#0f172a',
        '#020617',
        '#1e293b',
        '#38bdf8',
        1.6
      );

      // 4. On-Board Electronics: LiPo Battery + MCU Board + Mini OLED + Push Buttons
      // 4a. Rear 2S LiPo Battery Pack (Cobalt Blue with Yellow Label)
      drawExtrudedLocalPoly(
        [
          [-16, -15],
          [-16, 15],
          [-30, 15],
          [-30, -15],
        ],
        13,
        20,
        '#2563eb',
        '#1d4ed8',
        '#1e40af',
        '#93c5fd',
        1
      );
      // Yellow LiPo strap
      drawExtrudedLocalPoly(
        [
          [-21, -15.3],
          [-21, 15.3],
          [-25, 15.3],
          [-25, -15.3],
        ],
        13.2,
        20.4,
        '#facc15',
        '#ca8a04',
        '#eab308'
      );

      // 4b. Microcontroller Board (Teal/Emerald PCB in Center)
      drawExtrudedLocalPoly(
        [
          [11, -13],
          [11, 13],
          [-14, 13],
          [-14, -13],
        ],
        13,
        18,
        '#0d9488',
        '#0f766e',
        '#115e59',
        '#5eead4',
        1
      );

      // 4c. Glowing Cyan Mini OLED Screen on top of MCU
      drawExtrudedLocalPoly(
        [
          [7, -8],
          [7, 8],
          [-7, 8],
          [-7, -8],
        ],
        18,
        20,
        '#083344',
        '#06b6d4',
        '#0891b2',
        '#22d3ee',
        1.2
      );
      // Glowing telemetry bars on Mini OLED
      const oledCenter = localToWorld(0, 0);
      const oled2D = project3D(oledCenter.wx, oledCenter.wy, 20.5 * rScale);
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(oled2D.sx, oled2D.sy, Math.max(2, 3.2 * oled2D.scale), 0, Math.PI * 2);
      ctx.fill();

      // 4d. Ultrasonic Sensor HC-SR04 ("Mata Robot") if enabled
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
        // Two silver acoustic cylinders on front of HC-SR04
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

      // 5. Forward Direction Arrow on Robot Nose Bridge
      const arrowPts = [
        localToWorld(23, 0),
        localToWorld(14, -5.5),
        localToWorld(14, 5.5),
      ].map((p) => project3D(p.wx, p.wy, 14.5 * rScale));
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      arrowPts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.fill();

      // 6. Front Sensor Array LEDs ('0' = Green Glow on Line, 'X' = Red Off Line)
      const sCount = hardwareConfig.sensorCount;
      for (let i = 0; i < sCount; i++) {
        const frac = sCount === 1 ? 0 : i / (sCount - 1) - 0.5;
        // Slight arc along the front wing nose
        const ly = frac * sSpan;
        const lx = 35 - Math.abs(frac) * 5;
        const spWorld = localToWorld(lx, ly);
        const isOnLine = sensorReadings[i];

        // Floor projection beam dot
        const floor2d = project3D(spWorld.wx, spWorld.wy, 1);
        ctx.fillStyle = isOnLine ? 'rgba(34, 197, 94, 0.45)' : 'rgba(239, 68, 68, 0.22)';
        ctx.beginPath();
        ctx.arc(floor2d.sx, floor2d.sy, Math.max(2.5, 4.5 * floor2d.scale * rScale), 0, Math.PI * 2);
        ctx.fill();

        // Top PCB LED indicator with bright halo when detecting line ('0')
        const sp2d = project3D(spWorld.wx, spWorld.wy, 11.8 * rScale);
        if (isOnLine) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
          ctx.beginPath();
          ctx.arc(sp2d.sx, sp2d.sy, Math.max(4.5, 7.5 * sp2d.scale * rScale), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = isOnLine ? '#22c55e' : '#ef4444';
        ctx.strokeStyle = isOnLine ? '#dcfce7' : '#fecaca';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(sp2d.sx, sp2d.sy, Math.max(2.8, 4.4 * sp2d.scale * rScale), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    isRunning,
    plans,
    activePlanId,
    code,
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
    isLight,
  ]);

  // Convert click on canvas to exact 2D track coordinates (inverting the 3D/2D camera floor projection)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (placementTool === 'none') return;
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

    if (placementTool === 'start') {
      setStartPos({ x: tx, y: ty });
      resetRobotToStart(tx, ty, initialHeadingDeg);
      setPlacementTool('none');
    } else if (placementTool === 'finish') {
      setFinishPos({ x: tx, y: ty });
      setPlacementTool('none');
    } else if (placementTool === 'robot') {
      simStateRef.current.x = tx;
      simStateRef.current.y = ty;
      setRobotPose((p) => ({ ...p, x: tx, y: ty }));
      setPlacementTool('none');
    } else if (placementTool === 'draw_line') {
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

  return (
    <div
      className={`${
        isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full relative'
      } flex flex-col ${
        isLight ? 'bg-slate-50 text-slate-800' : 'bg-[#060d18] text-slate-100'
      } select-none overflow-hidden transition-colors`}
    >
      {/* Hidden File Input for PDF / Track Upload */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleUploadTrackFile}
        className="hidden"
      />

      {/* ── COMPACT KIDS-FRIENDLY TOP TOOLBAR (Row 1: Track + Robot Setup + PID + Sync) ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-1 px-2.5 py-1 border-b text-xs shrink-0 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-700'
            : 'bg-[#0b1526] border-slate-800/90 text-slate-100'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[11px] font-extrabold ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>
            🗺️ Arena:
          </span>
          <select
            value={selectedTrackId}
            onChange={(e) => handleSelectTrack(e.target.value)}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold outline-none cursor-pointer border transition-colors ${
              isLight
                ? 'bg-slate-100 text-slate-800 border-slate-300 hover:border-sky-500'
                : 'bg-[#111e34] text-slate-100 border-slate-700 hover:border-sky-400'
            }`}
          >
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

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
            <Cpu className="w-3 h-3" /> ⚙️ Robot ({hardwareConfig.sensorCount} Sensor • {hardwareConfig.motorRpm} RPM)
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
            <Sliders className="w-3 h-3" /> 🎛️ PID 1–5
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
            <option value="3d_persp">🎥 3D Perspektif (Orbit)</option>
            <option value="2d_top">🗺️ 2D Atas (Top-Down)</option>
            <option value="chase_cam">🏎️ Chase Cam (Belakang Robot)</option>
            <option value="pov_cam">👀 POV Cam (Depan Robot)</option>
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
            🏁 Set Start
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
            🎯 Set Finis
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
            📍 Pindah Robot
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
            ✏️ Gambar Jalur
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

          <button
            type="button"
            onClick={() => resetRobotToStart()}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-bold cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" /> Reset Posisi
          </button>

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

      {/* ── MAIN 3D ARENA VIEWPORT (100% Unobstructed Track!) ── */}
      <div className="relative flex-1 w-full min-h-[220px] overflow-hidden">
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
                  {[2, 4, 5, 6, 8, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} Sensor (Pola: {'0'.repeat(Math.min(2, n)) + 'x'.repeat(Math.max(0, n - 4)) + (n > 2 ? '0'.repeat(Math.min(2, n - 2)) : '')})
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
            👀 Sensor ({hardwareConfig.sensorCount}):
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
