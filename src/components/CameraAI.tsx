import React, { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';

interface CameraAIProps {
  isActive: boolean;
  aiMode: 'gesture' | 'object' | 'face' | 'line' | 'none';
  onDetectCommand?: (cmd: string) => void;
}

export const CameraAI: React.FC<CameraAIProps> = ({ isActive, aiMode, onDetectCommand }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('640x480');

  // Request webcam
  useEffect(() => {
    if (!isActive) {
      stopCamera();
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        setStreamError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        const track = stream.getVideoTracks()[0];
        if (track) {
          const settings = track.getSettings();
          setResolution(`${settings.width}x${settings.height}`);
        }
      })
      .catch((err) => {
        console.warn("Webcam access not allowed, falling back to simulator feed.", err);
        setStreamError("Physical camera not connected. Running in simulation mode.");
      });

    return () => {
      stopCamera();
    };
  }, [isActive]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Render mock AI detections overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frameCount = 0;
    let lastFpsUpdate = Date.now();

    // Box coordinate states
    let x = 100;
    let y = 100;
    let dx = 3;
    let dy = 2;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Measure FPS
      frameCount++;
      const now = Date.now();
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Draw Grid / Scanning effect if active
      if (isActive && aiMode !== 'none') {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let i = 0; i < canvas.width; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for (let j = 0; j < canvas.height; j += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, j);
          ctx.lineTo(canvas.width, j);
          ctx.stroke();
        }

        // Animated scanline
        const scanY = (now / 10) % canvas.height;
        const scanGrad = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        scanGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        scanGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.25)');
        scanGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 10, canvas.width, 20);

        // Bouncing box animation to simulate AI object detection
        x += dx;
        y += dy;
        const boxW = 120;
        const boxH = 120;

        if (x < 20 || x + boxW > canvas.width - 20) {
          dx = -dx;
          if (onDetectCommand) onDetectCommand(dx > 0 ? "RIGHT" : "LEFT");
        }
        if (y < 20 || y + boxH > canvas.height - 20) {
          dy = -dy;
        }

        // Draw Bounding Box & Label based on AI Mode
        let label = 'Object';
        let conf = 0.94;
        let color = '#3b82f6'; // Blue

        if (aiMode === 'object') {
          label = 'Red Ball';
          color = '#ef4444'; // Red
          conf = 0.96;
        } else if (aiMode === 'gesture') {
          label = dx > 0 ? 'Fist (LEFT)' : 'Open Hand (RIGHT)';
          color = '#8b5cf6'; // Purple
          conf = 0.88;
        } else if (aiMode === 'face') {
          label = 'RoboMaker Student';
          color = '#10b981'; // Emerald
          conf = 0.99;
        } else if (aiMode === 'line') {
          // Draw a line on the bottom
          ctx.strokeStyle = '#eab308'; // Yellow
          ctx.lineWidth = 12;
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 50 + Math.sin(now / 500) * 100, canvas.height - 40);
          ctx.lineTo(canvas.width / 2 + 50 + Math.sin(now / 500) * 100, canvas.height - 40);
          ctx.stroke();

          label = 'Line Center';
          color = '#eab308';
          conf = 0.91;
          x = canvas.width / 2 - 60 + Math.sin(now / 500) * 100;
          y = canvas.height - 100;
        }

        // Bounding Box Rectangle
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeRect(x, y, boxW, boxH);

        // Bounding box corner ticks
        ctx.fillStyle = color;
        const tick = 15;
        // top left
        ctx.fillRect(x - 2, y - 2, tick, 4);
        ctx.fillRect(x - 2, y - 2, 4, tick);
        // top right
        ctx.fillRect(x + boxW - tick + 2, y - 2, tick, 4);
        ctx.fillRect(x + boxW - 2, y - 2, 4, tick);
        // bottom left
        ctx.fillRect(x - 2, y + boxH - 2, tick, 4);
        ctx.fillRect(x - 2, y + boxH - tick + 2, 4, tick);
        // bottom right
        ctx.fillRect(x + boxW - tick + 2, y + boxH - 2, tick, 4);
        ctx.fillRect(x + boxW - 2, y + boxH - tick + 2, 4, tick);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Label Background Tag
        ctx.fillStyle = color;
        ctx.fillRect(x - 1, y - 24, ctx.measureText(`${label} ${(conf * 100).toFixed(0)}%`).width + 12, 22);

        // Label Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${label} ${(conf * 100).toFixed(0)}%`, x + 5, y - 8);
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive, aiMode, onDetectCommand]);

  return (
    <div className="relative w-full aspect-video bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex flex-col items-center justify-center">
      {isActive ? (
        <>
          {/* Real Video element */}
          {!streamError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
            />
          )}

          {/* Fallback Simulator Screen */}
          {streamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-500 font-mono text-xs select-none">
              <Camera className="w-10 h-10 text-slate-700 mb-2 animate-pulse" />
              <span>[ SIMULATOR CAMERA FEED ACTIVE ]</span>
              <span className="text-[10px] text-slate-600 mt-1">{streamError}</span>
            </div>
          )}

          {/* AI Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* AI Metrics Overlay bar */}
          <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              LIVE
            </span>
            <span>{resolution}</span>
            <span>FPS: {fps || 30}</span>
            <span>LAT: 12ms</span>
          </div>

          <div className="absolute bottom-2 right-2 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded text-[10px] font-mono text-slate-400">
            Engine: {aiMode === 'none' ? 'IDLE' : 'YOLOv8-Nano (Simulated)'}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-slate-500 p-4 text-center select-none font-mono">
          <Camera className="w-12 h-12 text-slate-700 mb-3" />
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">AI Vision Offline</span>
          <span className="text-[10px] text-slate-600 mt-1 max-w-[240px]">
            Run a Python AI project or click "Run All" to initialize camera feed.
          </span>
        </div>
      )}
    </div>
  );
};
