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
}) => {
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
    subStage: 'ACTION' as 'ACTION' | 'BRAKE' | 'SPEED_A' | 'DONE',
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
        subStage: 'ACTION',
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

      const scale = hardwareConfig.robotScale || 1.0;
      const sensorForwardDist = 30 * scale;
      const arrayWidth = Math.min(54, Math.max(22, count * 6.5)) * scale;

      const cosT = Math.cos(rTheta);
      const sinT = Math.sin(rTheta);
      // Perpendicular vector (left to right from robot's perspective)
      const perpX = -sinT;
      const perpY = cosT;

      for (let i = 0; i < count; i++) {
        const frac = count === 1 ? 0 : i / (count - 1) - 0.5;
        const offsetLat = frac * arrayWidth;
        const sx = Math.round(rx + cosT * sensorForwardDist + perpX * offsetLat);
        const sy = Math.round(ry + sinT * sensorForwardDist + perpY * offsetLat);

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
        subStage: 'ACTION',
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

          // Broadcast live running block highlight to Blockly
          onHighlightChange?.({
            running: true,
            planId: currentPlan.planId,
            stepIndex: step.index,
            stage: s.subStage === 'SPEED_A' ? 'SPEED_A' : 'ACTION',
            blockId: step.blockId || null,
          });

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
            if (hardwareConfig.hasEncoder && unit === 'enc_l') {
              return s.encL - s.stageStartEncL >= targetVal;
            }
            if (hardwareConfig.hasEncoder && unit === 'enc_r') {
              return s.encR - s.stageStartEncR >= targetVal;
            }
            return s.elapsedMs - s.stageStartMs >= targetVal;
          };

          if (s.subStage === 'ACTION') {
            setExecStatus({
              stepIndex: step.index,
              stage: 'ACTION',
              message: `▶ Index #${step.index} [ACTION: ${step.action}] · Jika ${step.triggerMode === 'MOTION' ? 'MOTION' : `${step.sensorPattern} (${step.logicOp})`} · PID ${step.pidId || 'OFF'}`,
              stoppedByInterrupt: false,
            });

            if (step.action === 'PAUSE') {
              cmdSpeedL = 0;
              cmdSpeedR = 0;
            } else {
              const pidCorr = computePidCorrection();
              cmdSpeedL = Math.max(-255, Math.min(255, step.speedL + pidCorr));
              cmdSpeedR = Math.max(-255, Math.min(255, step.speedR - pidCorr));
            }

            // Check if Action trigger condition is satisfied
            const minGuardElapsed = s.elapsedMs - s.stageStartMs > 120;
            const patternMatched =
              step.triggerMode === 'MOTION'
                ? true
                : minGuardElapsed &&
                  evaluateSensorPatternMatch(
                    sensors,
                    normalizeSensorPattern(step.sensorPattern, hardwareConfig.sensorCount),
                    step.logicOp
                  );

            if (patternMatched) {
              if (step.brake > 0) {
                s.subStage = 'BRAKE';
                s.stageStartMs = s.elapsedMs;
              } else if (hasStopAfterAction) {
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
                s.subStage = 'SPEED_A';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
              }
            }
          } else if (s.subStage === 'BRAKE') {
            cmdSpeedL = -step.speedL * 0.4;
            cmdSpeedR = -step.speedR * 0.4;
            if (s.elapsedMs - s.stageStartMs >= step.brake) {
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
                s.subStage = 'SPEED_A';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
              }
            }
          } else if (s.subStage === 'SPEED_A') {
            setExecStatus({
              stepIndex: step.index,
              stage: 'SPEED_A',
              message: `⚡ Index #${step.index} [SPEED A: ${step.speedA}] · Timer ${step.timerValue} ${step.timerUnit.toUpperCase()}`,
              stoppedByInterrupt: false,
            });

            if (step.action === 'LEFT') {
              cmdSpeedL = -step.speedA;
              cmdSpeedR = step.speedA;
            } else if (step.action === 'RIGHT') {
              cmdSpeedL = step.speedA;
              cmdSpeedR = -step.speedA;
            } else if (step.action === 'MUNDUR') {
              cmdSpeedL = -step.speedA;
              cmdSpeedR = -step.speedA;
            } else if (step.action === 'PAUSE') {
              cmdSpeedL = 0;
              cmdSpeedR = 0;
            } else {
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
                // Advance to next step
                s.itemCursor += 1;
                s.subStage = 'ACTION';
                s.stageStartMs = s.elapsedMs;
                s.stageStartEncL = s.encL;
                s.stageStartEncR = s.encR;
              }
            }
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
          const omega = (vR - vL) / wheelBasePx;

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
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const s = simStateRef.current;

      // Deep space background matching screenshot
      const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
      bgGrad.addColorStop(0, '#07111f');
      bgGrad.addColorStop(1, '#040912');
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

        // Default: 3D Perspective Orbit (like the uploaded reference screenshot!)
        const cx = wx - TRACK_W / 2;
        const cy = wy - TRACK_H / 2;
        const cosY = Math.cos(camYaw);
        const sinY = Math.sin(camYaw);
        const rx = cx * cosY - cy * sinY;
        const ry = cx * sinY + cy * cosY;

        const baseScale = Math.min(cw / 1480, ch / 920) * camZoom;
        const persp = 1 / Math.max(0.45, 1 + (ry / 2200) * Math.sin(camPitch));
        const sx = cw * 0.54 + rx * baseScale * persp;
        const sy = ch * 0.53 + ry * Math.cos(camPitch) * baseScale * persp - wz * baseScale * persp;
        return { sx, sy, scale: baseScale * persp };
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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.beginPath();
      outerCornersBase.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy + 18) : ctx.lineTo(pt.sx, pt.sy + 18)));
      ctx.closePath();
      ctx.fill();

      // Side extrusions of the 3D table border
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#334155';
        ctx.beginPath();
        ctx.moveTo(outerCornersBase[i].sx, outerCornersBase[i].sy);
        ctx.lineTo(outerCornersBase[next].sx, outerCornersBase[next].sy);
        ctx.lineTo(outerCornersTop[next].sx, outerCornersTop[next].sy);
        ctx.lineTo(outerCornersTop[i].sx, outerCornersTop[i].sy);
        ctx.closePath();
        ctx.fill();
      }

      // Top rim of the 3D arena border
      ctx.fillStyle = '#3b4a63';
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

      // Draw 3D Robot Body, Wheels, and Live LED Sensor Bar
      const rScale = hardwareConfig.robotScale || 1.0;
      const halfL = 28 * rScale;
      const halfW = 22 * rScale;
      const chassisH = 18 * rScale;

      const localToWorld = (lx: number, ly: number) => ({
        wx: s.x + lx * Math.cos(s.theta) - ly * Math.sin(s.theta),
        wy: s.y + lx * Math.sin(s.theta) + ly * Math.cos(s.theta),
      });

      const botCornersWorld = [
        localToWorld(halfL, -halfW),
        localToWorld(halfL, halfW),
        localToWorld(-halfL, halfW),
        localToWorld(-halfL, -halfW),
      ];
      const botBase2D = botCornersWorld.map((p) => project3D(p.wx, p.wy, 2));
      const botTop2D = botCornersWorld.map((p) => project3D(p.wx, p.wy, 2 + chassisH));

      // Robot shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      botBase2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy + 4) : ctx.lineTo(pt.sx, pt.sy + 4)));
      ctx.closePath();
      ctx.fill();

      // Robot 3D side walls (Vibrant Orange/Teal Kids-Friendly Robotics theme matching screenshot)
      for (let i = 0; i < 4; i++) {
        const next = (i + 1) % 4;
        ctx.fillStyle = i === 0 ? '#ea580c' : '#c2410c';
        ctx.beginPath();
        ctx.moveTo(botBase2D[i].sx, botBase2D[i].sy);
        ctx.lineTo(botBase2D[next].sx, botBase2D[next].sy);
        ctx.lineTo(botTop2D[next].sx, botTop2D[next].sy);
        ctx.lineTo(botTop2D[i].sx, botTop2D[i].sy);
        ctx.closePath();
        ctx.fill();
      }

      // Robot Top Deck
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#ffedd5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      botTop2D.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Microcontroller Board visual on top of robot
      const mcuCorners = [
        localToWorld(halfL * 0.45, -halfW * 0.55),
        localToWorld(halfL * 0.45, halfW * 0.55),
        localToWorld(-halfL * 0.55, halfW * 0.55),
        localToWorld(-halfL * 0.55, -halfW * 0.55),
      ].map((p) => project3D(p.wx, p.wy, 4 + chassisH));
      ctx.fillStyle = '#0d9488';
      ctx.beginPath();
      mcuCorners.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.sx, pt.sy) : ctx.lineTo(pt.sx, pt.sy)));
      ctx.closePath();
      ctx.fill();

      // Draw Left & Right Wheels
      const wheelPositions = [
        localToWorld(0, -halfW * 1.12),
        localToWorld(0, halfW * 1.12),
      ];
      for (const wp of wheelPositions) {
        const w2d = project3D(wp.wx, wp.wy, 8 * rScale);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(w2d.sx, w2d.sy, Math.max(4, 10 * w2d.scale * rScale), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Draw Front Sensor Array LEDs ('0' / 'X' visual feedback)
      const sCount = hardwareConfig.sensorCount;
      const sensorForward = 30 * rScale;
      const sWidth = Math.min(54, Math.max(22, sCount * 6.5)) * rScale;
      for (let i = 0; i < sCount; i++) {
        const frac = sCount === 1 ? 0 : i / (sCount - 1) - 0.5;
        const spWorld = localToWorld(sensorForward, frac * sWidth);
        const sp2d = project3D(spWorld.wx, spWorld.wy, 5 * rScale);
        const isOnLine = sensorReadings[i];
        ctx.fillStyle = isOnLine ? '#22c55e' : '#ef4444';
        ctx.beginPath();
        ctx.arc(sp2d.sx, sp2d.sy, Math.max(2.5, 4.2 * sp2d.scale), 0, Math.PI * 2);
        ctx.fill();
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
  ]);

  // Convert click on canvas to 2D track coordinates when placementTool is active
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (placementTool === 'none') return;
    const canvas = viewportCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * TRACK_W;
    const clickY = ((e.clientY - rect.top) / rect.height) * TRACK_H;
    const tx = Math.max(50, Math.min(TRACK_W - 50, Math.round(clickX)));
    const ty = Math.max(50, Math.min(TRACK_H - 50, Math.round(clickY)));

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
    if (recalcPins) {
      merged.pins = estimateRobotPins(merged.mcu, merged.sensorCount, merged.sensorMode);
    }
    if (recalcPids) {
      merged.pids = computeAutoPidProfiles(merged.motorRpm, merged.sensorCount);
    }
    onChangeHardwareConfig(merged);
  };

  const boardPins = getBoardPinOptions(hardwareConfig.mcu);
  const currentPatternPreview = sensorReadings.map((on) => (on ? '0' : 'X')).join('');

  return (
    <div
      className={`${
        isFullscreen ? 'fixed inset-0 z-[9999]' : 'w-full h-full relative'
      } flex flex-col bg-[#060d18] text-slate-100 select-none overflow-hidden`}
    >
      {/* Hidden File Input for PDF / Track Upload */}
      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleUploadTrackFile}
        className="hidden"
      />

      {/* ── ROW 1: Arena / PDF Track Selector + Hardware/PID Quick Buttons ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0b1526] border-b border-slate-800/90 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-sky-400 mr-1">Pilih Arena:</span>
          <select
            value={selectedTrackId}
            onChange={(e) => handleSelectTrack(e.target.value)}
            className="bg-[#111e34] text-slate-100 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold outline-none hover:border-sky-400 cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 font-bold text-[11px] cursor-pointer transition-all"
            title="Upload file PDF lintasan untuk dijadikan track simulasi"
          >
            <Upload className="w-3.5 h-3.5" /> Tambah Arena PDF
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'pdf_samples' ? 'none' : 'pdf_samples')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Contoh PDF Track
          </button>

          {selectedTrackId.startsWith('pdf_') && (
            <button
              type="button"
              onClick={() => {
                setTracks((prev) => prev.filter((t) => t.id !== selectedTrackId));
                handleSelectTrack('maze');
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-[11px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus Arena Ini
            </button>
          )}
        </div>

        {/* Right side: Kids-Friendly Hardware, Pinout & Multi-PID Drawers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'hardware' ? 'none' : 'hardware')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              activeDrawer === 'hardware'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                : 'bg-[#132238] hover:bg-[#1a2e4a] text-amber-300 border-amber-500/30'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> Komponen, Motor ({hardwareConfig.motorRpm} RPM) & Pin
          </button>

          <button
            type="button"
            onClick={() => setActiveDrawer(activeDrawer === 'pid' ? 'none' : 'pid')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-bold text-[11px] cursor-pointer transition-all ${
              activeDrawer === 'pid'
                ? 'bg-fuchsia-500 text-white border-fuchsia-400 shadow-md'
                : 'bg-[#132238] hover:bg-[#1a2e4a] text-fuchsia-300 border-fuchsia-500/30'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Setting PID 1–5 (Auto)
          </button>

          <button
            type="button"
            onClick={() => onSyncToCodeAndBlocks(hardwareConfig, plans, activePlanId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold text-[11px] shadow-md cursor-pointer transition-all"
            title="Sinkronkan konfigurasi robot, pinout PWM/Mux/Encoder, dan PID ke Block & Kode (.ino / .py)"
          >
            <Sparkles className="w-3.5 h-3.5" /> Kirim ke Code-Block (.ino & .py)
          </button>
        </div>
      </div>

      {/* ── ROW 2: 3D Perspective Switcher, Start/Finish Placement & Robot Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-1.5 bg-[#091220] border-b border-slate-800/80 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            🤖 Uji Robotmu:
          </span>

          {/* 3D Camera Perspective Selector */}
          <select
            value={cameraMode}
            onChange={(e) => setCameraMode(e.target.value as CameraViewMode)}
            className="bg-[#111e34] text-sky-200 border border-slate-700 rounded-md px-2 py-1 font-bold outline-none cursor-pointer"
          >
            <option value="3d_persp">🎥 3D Perspektif (Orbit)</option>
            <option value="2d_top">🗺️ 2D Atas (Top-Down)</option>
            <option value="chase_cam">🏎️ Chase Cam (Belakang Robot)</option>
            <option value="pov_cam">👀 POV Cam (Depan Robot)</option>
          </select>

          <button
            type="button"
            onClick={() => setCamYaw((y) => y + 0.35)}
            className="px-2 py-1 rounded-md bg-[#111e34] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
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
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#111e34] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            <Camera className="w-3 h-3" /> Kamera
          </button>

          <button
            type="button"
            onClick={() => {
              const scales = [0.8, 1.0, 1.25];
              const nextScale = scales[(scales.indexOf(hardwareConfig.robotScale) + 1) % scales.length] || 1.0;
              updateHardware({ robotScale: nextScale });
            }}
            className="px-2 py-1 rounded-md bg-[#111e34] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold cursor-pointer"
          >
            Ukuran Robot ({hardwareConfig.robotScale}x)
          </button>

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'start' ? 'none' : 'start')}
            className={`px-2 py-1 rounded-md border font-semibold cursor-pointer ${
              placementTool === 'start'
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-purple-300'
            }`}
          >
            Posisi Start
          </button>

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'finish' ? 'none' : 'finish')}
            className={`px-2 py-1 rounded-md border font-semibold cursor-pointer ${
              placementTool === 'finish'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-emerald-300'
            }`}
          >
            Posisi Finis
          </button>

          <button
            type="button"
            onClick={() => setAutoFinish((v) => !v)}
            className={`px-2 py-1 rounded-md border font-semibold cursor-pointer ${
              autoFinish
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-[#111e34] text-slate-400 border-slate-700'
            }`}
          >
            Finis Otomatis: {autoFinish ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedTrackId('empty');
              setLastDrawPoint(null);
              setPlacementTool(placementTool === 'draw_line' ? 'none' : 'draw_line');
            }}
            className={`px-2 py-1 rounded-md border font-semibold cursor-pointer ${
              placementTool === 'draw_line'
                ? 'bg-sky-600 text-white border-sky-400'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-sky-300'
            }`}
          >
            ✏️ Jalur
          </button>

          <button
            type="button"
            onClick={() => setPlacementTool(placementTool === 'robot' ? 'none' : 'robot')}
            className={`px-2 py-1 rounded-md border font-semibold cursor-pointer ${
              placementTool === 'robot'
                ? 'bg-orange-500 text-slate-950 border-orange-300'
                : 'bg-[#111e34] hover:bg-slate-800 border-slate-700 text-orange-300'
            }`}
          >
            📍 Robot
          </button>

          <div className="flex items-center gap-1 bg-[#111e34] border border-slate-700 rounded-md px-2 py-0.5">
            <span className="text-slate-400">Arah:</span>
            <input
              type="number"
              value={initialHeadingDeg}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10) || 0;
                setInitialHeadingDeg(val);
                resetRobotToStart(startPos.x, startPos.y, val);
              }}
              className="w-12 bg-transparent text-amber-300 font-mono font-bold text-center outline-none"
            />
            <span className="text-slate-400">°</span>
          </div>

          <button
            type="button"
            onClick={() => resetRobotToStart()}
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>

          {selectedTrackId === 'empty' && customSegments.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setCustomSegments((prev) => prev.slice(0, -1))}
                className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Hapus Segmen Terakhir
              </button>
              <button
                type="button"
                onClick={() => setCustomSegments([])}
                className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 cursor-pointer"
              >
                Hapus Jalur
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── DRAWER 1: Sample PDF Tracks Download & Quick Load ── */}
      {activeDrawer === 'pdf_samples' && (
        <div className="px-4 py-3 bg-[#0e1b30] border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-emerald-300">📄 Paket Contoh File PDF Track Siap Pakai</div>
            <div className="text-slate-400 text-[11px]">
              Unduh file PDF berikut untuk diuji dengan tombol &quot;Tambah Arena PDF&quot;, atau klik Gunakan Langsung.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'oval', label: 'Track 1: Basic Oval (.pdf)', href: '/tracks/track-basic-oval.pdf' },
              {
                id: 'maze',
                label: 'Track 2: Perempatan Maze (.pdf)',
                href: '/tracks/track-perempatan-maze.pdf',
              },
              { id: 'pro', label: 'Track 3: Lomba Pro (.pdf)', href: '/tracks/track-lomba-pro.pdf' },
            ].map((sample) => (
              <div
                key={sample.id}
                className="flex items-center gap-1.5 bg-[#091220] border border-slate-700 rounded-lg px-2.5 py-1.5"
              >
                <button
                  type="button"
                  onClick={() => handleSelectTrack(sample.id)}
                  className="text-sky-300 hover:text-sky-200 font-bold cursor-pointer"
                >
                  {sample.label}
                </button>
                <a
                  href={sample.href}
                  download
                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px]"
                >
                  ⬇ Unduh PDF
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── DRAWER 2: Hardware, Motor RPM & Smart Pinout (PWM, Multiplexer, Encoder) ── */}
      {activeDrawer === 'hardware' && (
        <div className="px-4 py-3 bg-[#0e1b30] border-b border-amber-500/30 space-y-3 text-xs max-h-[290px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="font-extrabold text-amber-300 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Konfigurasi Robot Real, Motor RPM & Smart Auto-Pinout
            </div>
            <button
              type="button"
              onClick={() => updateHardware({}, true, true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] cursor-pointer"
            >
              ✨ Estimasi Pin & PID Otomatis
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Robot Preset */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Robot</label>
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
                className="w-full bg-[#111e34] text-slate-100 border border-slate-700 rounded px-2 py-1 font-semibold"
              >
                <option value="line_follower">🏎️ Line Follower</option>
                <option value="maze_solver">🧩 Maze Solver Pro</option>
                <option value="free_robot">🤖 Robot Bebas (Custom)</option>
              </select>
            </div>

            {/* Microcontroller */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mikrokontroler</label>
              <select
                value={hardwareConfig.mcu}
                onChange={(e) =>
                  updateHardware({ mcu: e.target.value as RobotMcuId }, true, false)
                }
                className="w-full bg-[#111e34] text-sky-300 border border-slate-700 rounded px-2 py-1 font-bold"
              >
                <option value="Arduino Uno">Arduino Uno</option>
                <option value="Arduino Nano">Arduino Nano</option>
                <option value="Arduino Mega">Arduino Mega</option>
                <option value="ESP32 DevKit V1">ESP32 DevKit V1</option>
                <option value="NodeMCU / ESP8266">NodeMCU / ESP8266</option>
              </select>
            </div>

            {/* Jumlah Sensor Garis */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Jumlah Sensor Garis (0 / X)
              </label>
              <select
                value={hardwareConfig.sensorCount}
                onChange={(e) => {
                  const sc = parseInt(e.target.value, 10) as SensorCount;
                  const mode: SensorReadMode =
                    sc >= 6 ? 'mux_4067' : hardwareConfig.sensorMode;
                  updateHardware({ sensorCount: sc, sensorMode: mode }, true, true);
                }}
                className="w-full bg-[#111e34] text-emerald-300 border border-slate-700 rounded px-2 py-1 font-bold"
              >
                {[2, 4, 5, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} Sensor (Pola: {'0'.repeat(Math.min(2, n)) + 'x'.repeat(Math.max(0, n - 4)) + (n > 2 ? '0'.repeat(Math.min(2, n - 2)) : '')})
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Pembacaan Sensor (Direct vs Multiplexer) */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Mode Baca Sensor / Mux
              </label>
              <select
                value={hardwareConfig.sensorMode}
                onChange={(e) =>
                  updateHardware({ sensorMode: e.target.value as SensorReadMode }, true, false)
                }
                className="w-full bg-[#111e34] text-slate-100 border border-slate-700 rounded px-2 py-1 font-semibold"
              >
                <option value="mux_4067">Multiplexer CD74HC4067 (S0..S3 + SIG)</option>
                <option value="mux_4051">Multiplexer 74HC4051 (S0..S2 + SIG)</option>
                <option value="direct">Pin Sensor Langsung (Direct ADC/Digital)</option>
              </select>
            </div>

            {/* Jenis Motor & RPM */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jenis Motor DC</label>
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
                className="w-full bg-[#111e34] text-amber-300 border border-slate-700 rounded px-2 py-1 font-bold"
              >
                {Object.entries(MOTOR_PRESETS).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Input RPM Motor Manual */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
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
                  className="w-20 bg-[#111e34] text-amber-300 border border-slate-700 rounded px-2 py-1 font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">RPM</span>
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
                  className="w-14 bg-[#111e34] text-slate-200 border border-slate-700 rounded px-1.5 py-1 font-mono"
                />
                <span className="text-[10px] text-slate-400">mm</span>
              </div>
            </div>

            {/* Wheel Encoder Toggle */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Encoder Roda (L & R)
              </label>
              <select
                value={hardwareConfig.hasEncoder ? 'yes' : 'no'}
                onChange={(e) => updateHardware({ hasEncoder: e.target.value === 'yes' })}
                className="w-full bg-[#111e34] text-cyan-300 border border-slate-700 rounded px-2 py-1 font-bold"
              >
                <option value="yes">✅ Ada Encoder (ms / Enc L / Enc R)</option>
                <option value="no">❌ Tidak Ada Encoder (Hanya ms)</option>
              </select>
            </div>

            {/* Ultrasonic Sensor Toggle */}
            <div className="bg-[#091220] p-2 rounded-lg border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                Sensor Ultrasonic
              </label>
              <select
                value={hardwareConfig.ultrasonicMode}
                onChange={(e) =>
                  updateHardware({ ultrasonicMode: e.target.value as UltrasonicMode })
                }
                className="w-full bg-[#111e34] text-slate-100 border border-slate-700 rounded px-2 py-1 font-semibold"
              >
                <option value="none">Tidak Pakai Ultrasonic</option>
                <option value="front">1 Ultrasonic (Depan)</option>
                <option value="three">3 Ultrasonic (Depan, Kiri, Kanan)</option>
              </select>
            </div>
          </div>

          {/* Pin Selector Row (PWM, Multiplexer S0..S3/SIG, Encoder Interrupt) */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800 text-[11px]">
            <span className="font-bold text-sky-400">🔌 Pilihan Pin Otomatis ({hardwareConfig.mcu}):</span>
            <label className="flex items-center gap-1">
              <span className="text-slate-400">PWM L:</span>
              <select
                value={hardwareConfig.pins.pwmL}
                onChange={(e) =>
                  updateHardware({ pins: { ...hardwareConfig.pins, pwmL: e.target.value } })
                }
                className="bg-[#111e34] border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-mono"
              >
                {boardPins.pwmPins.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-slate-400">PWM R:</span>
              <select
                value={hardwareConfig.pins.pwmR}
                onChange={(e) =>
                  updateHardware({ pins: { ...hardwareConfig.pins, pwmR: e.target.value } })
                }
                className="bg-[#111e34] border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-mono"
              >
                {boardPins.pwmPins.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>

            {hardwareConfig.sensorMode !== 'direct' && (
              <>
                <span className="text-emerald-300 font-mono">
                  Mux S0..S3: [{hardwareConfig.pins.muxS0}, {hardwareConfig.pins.muxS1}, {hardwareConfig.pins.muxS2}
                  {hardwareConfig.sensorMode === 'mux_4067' ? `, ${hardwareConfig.pins.muxS3}` : ''}]
                </span>
                <label className="flex items-center gap-1">
                  <span className="text-slate-400">Mux SIG:</span>
                  <select
                    value={hardwareConfig.pins.muxSig}
                    onChange={(e) =>
                      updateHardware({ pins: { ...hardwareConfig.pins, muxSig: e.target.value } })
                    }
                    className="bg-[#111e34] border border-slate-700 rounded px-1.5 py-0.5 text-emerald-300 font-mono"
                  >
                    {boardPins.analogPins.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
              </>
            )}

            {hardwareConfig.hasEncoder && (
              <span className="text-cyan-300 font-mono">
                Interrupt Enc L/R: [{hardwareConfig.pins.encLA}, {hardwareConfig.pins.encRA}]
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── DRAWER 3: Multi-PID 1..5 Configuration (Kp, Ki, Kd, dt) + Auto Combination ── */}
      {activeDrawer === 'pid' && (
        <div className="px-4 py-3 bg-[#12112a] border-b border-fuchsia-500/30 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-extrabold text-fuchsia-300">
                🎛️ Kombinasi PID 1 – 5 (Menyesuaikan Motor {hardwareConfig.motorRpm} RPM & {hardwareConfig.sensorCount} Sensor)
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                updateHardware({
                  pids: computeAutoPidProfiles(hardwareConfig.motorRpm, hardwareConfig.sensorCount),
                })
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 text-fuchsia-200 border border-fuchsia-500/40 font-bold text-[11px] cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" /> Reset Kombinasi Auto PID 1–5
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {hardwareConfig.pids.map((pid, idx) => (
              <div
                key={pid.id}
                className="bg-[#090d1a] border border-slate-800 rounded-lg p-2 space-y-1.5"
              >
                <div className="font-bold text-fuchsia-300 text-[11px] truncate">{pid.label}</div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <label className="flex flex-col">
                    <span className="text-slate-400">Kp</span>
                    <input
                      type="number"
                      step="0.5"
                      value={pid.kp}
                      onChange={(e) => {
                        const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                        nextPids[idx] = { ...pid, kp: parseFloat(e.target.value) || 0 };
                        updateHardware({ pids: nextPids });
                      }}
                      className="bg-[#11192e] border border-slate-700 rounded px-1.5 py-0.5 text-amber-300 font-mono font-bold"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-400">Ki</span>
                    <input
                      type="number"
                      step="0.01"
                      value={pid.ki}
                      onChange={(e) => {
                        const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                        nextPids[idx] = { ...pid, ki: parseFloat(e.target.value) || 0 };
                        updateHardware({ pids: nextPids });
                      }}
                      className="bg-[#11192e] border border-slate-700 rounded px-1.5 py-0.5 text-emerald-300 font-mono font-bold"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-400">Kd</span>
                    <input
                      type="number"
                      step="0.5"
                      value={pid.kd}
                      onChange={(e) => {
                        const nextPids = [...hardwareConfig.pids] as RobotHardwareConfig['pids'];
                        nextPids[idx] = { ...pid, kd: parseFloat(e.target.value) || 0 };
                        updateHardware({ pids: nextPids });
                      }}
                      className="bg-[#11192e] border border-slate-700 rounded px-1.5 py-0.5 text-sky-300 font-mono font-bold"
                    />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-slate-400">dt (ms)</span>
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
                      className="bg-[#11192e] border border-slate-700 rounded px-1.5 py-0.5 text-purple-300 font-mono font-bold"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN 3D ARENA VIEWPORT ── */}
      <div className="relative flex-1 w-full h-full min-h-[380px] overflow-hidden">
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
          className={`w-full h-full object-cover ${
            placementTool !== 'none' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
          }`}
        />

        {/* Top-Left Live Timer & Robot Model Card (Matches Reference Image!) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-xs font-mono shadow-lg w-fit">
            <span className="text-slate-400 font-bold">JEDA</span>
            <span className="text-white font-extrabold text-sm">{simElapsedSec.toFixed(2)} s</span>
            <span className="text-[10px] text-amber-400 border-l border-slate-700 pl-2">
              {hardwareConfig.motorRpm} RPM
            </span>
          </div>

          <div className="px-4 py-3 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800/90 shadow-xl max-w-[330px]">
            <div className="text-base font-extrabold text-white tracking-tight">
              {hardwareConfig.robotName}
            </div>
            <div className="text-xs font-semibold text-amber-400 mt-0.5">
              Model aktif · {hardwareConfig.sensorCount} sensor garis ·{' '}
              {cameraMode === '2d_top' ? '2D' : '3D'}
            </div>

            {/* Live Sensor Bar ('0' = mendeteksi garis / dibaca, 'X' = tidak mendeteksi) */}
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400">Sensor:</span>
              <div className="flex items-center gap-1">
                {sensorReadings.map((active, i) => (
                  <span
                    key={i}
                    className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[11px] font-extrabold border ${
                      active
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {active ? '0' : 'X'}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Telemetry (Speed L/R, Encoder L/R, Ultrasonic) */}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-300">
              <span>PWM L/R: {liveSpeeds.l} / {liveSpeeds.r}</span>
              {hardwareConfig.hasEncoder && (
                <span className="text-cyan-300">Enc L/R: {encoderLeft} / {encoderRight}</span>
              )}
              {hardwareConfig.ultrasonicMode !== 'none' && (
                <span className="text-sky-300">Ultra: {ultrasonicCm} cm</span>
              )}
            </div>
          </div>

          {/* Active Running Step Index Banner */}
          <div
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold shadow-lg flex items-center gap-2 transition-all ${
              execStatus.stoppedByInterrupt
                ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                : isRunning
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}
          >
            {execStatus.stoppedByInterrupt ? (
              <OctagonAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{execStatus.message}</span>
          </div>
        </div>

        {/* Top-Right Fullscreen Button (Matches Reference Screenshot "Perbesar") */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            {isFullscreen ? 'Perkecil' : 'Perbesar'}
          </button>
        </div>

        {/* Placement Mode Helper Toast */}
        {placementTool !== 'none' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow-xl flex items-center gap-2">
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
    </div>
  );
};
export default RobotArena3D;
