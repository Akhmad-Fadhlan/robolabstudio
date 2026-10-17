import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Rocket,
  Zap,
  CheckCircle2,
  Bot,
  Layers,
  ChevronRight,
  Compass,
} from 'lucide-react';
import robolabLogo from '../assets/robolab-logo-only.png';
import h1Preview from '../assets/h1.jpg';

// ─── Types ──────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onSignIn: () => Promise<void>;
  error?: string | null;
  loading?: boolean;
}

// ─── Official Google "G" SVG Icon ──────────────────────────────────────────
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const SPEECH_QUOTES = [
  'Halo Roboticist Muda! 👋',
  'Siap buat robot impianmu?',
  'Susun balok & jalankan simulasi!',
  'Yuk mulai petualangan seru ini! 🚀',
];

// ─── Cute Animated Robot Companion Avatar ──────────────────────────────────
const RobotCompanion: React.FC = () => {
  const [bubbleTextIdx, setBubbleTextIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBubbleTextIdx((prev) => (prev + 1) % SPEECH_QUOTES.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="robot-mascot-wrap">
      {/* Interactive Speech Bubble */}
      <motion.div
        key={bubbleTextIdx}
        initial={{ opacity: 0, y: 6, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="mascot-speech-bubble"
      >
        <span className="bubble-text">{SPEECH_QUOTES[bubbleTextIdx]}</span>
        <div className="speech-arrow" />
      </motion.div>

      {/* Floating Robot SVG */}
      <motion.div
        className="robot-avatar"
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width="82"
          height="82"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow beneath */}
          <ellipse cx="50" cy="94" rx="26" ry="5" fill="#CBD5E1" opacity="0.6" />

          {/* Antenna */}
          <line x1="50" y1="20" x2="50" y2="8" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="7" r="5" fill="#F59E0B" className="antenna-glow" />

          {/* Head Body */}
          <rect x="22" y="18" width="56" height="48" rx="20" fill="url(#botGrad)" stroke="#2563EB" strokeWidth="2.5" />

          {/* Glossy highlight on head */}
          <path d="M28 24C34 22 42 21 54 21C64 21 70 23 72 25" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />

          {/* Earphones */}
          <rect x="14" y="32" width="8" height="20" rx="4" fill="#3B82F6" />
          <rect x="78" y="32" width="8" height="20" rx="4" fill="#3B82F6" />

          {/* Face Screen */}
          <rect x="29" y="27" width="42" height="30" rx="12" fill="#0F172A" />

          {/* Blinking Glowing Eyes */}
          <g className="robot-eyes">
            <ellipse cx="40" cy="39" rx="4.5" ry="5.5" fill="#38BDF8" className="eye-left" />
            <ellipse cx="60" cy="39" rx="4.5" ry="5.5" fill="#38BDF8" className="eye-right" />
            <circle cx="41.5" cy="37.5" r="1.5" fill="#FFFFFF" />
            <circle cx="61.5" cy="37.5" r="1.5" fill="#FFFFFF" />
          </g>

          {/* Friendly Smile */}
          <path d="M43 49C46 52 54 52 57 49" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />

          {/* Cheeks */}
          <circle cx="34" cy="46" r="2.5" fill="#F43F5E" opacity="0.7" />
          <circle cx="66" cy="46" r="2.5" fill="#F43F5E" opacity="0.7" />

          {/* Body/Collar */}
          <path d="M35 66L42 76H58L65 66" fill="#1D4ED8" />
          <rect x="36" y="76" width="28" height="15" rx="7" fill="url(#botGrad)" stroke="#2563EB" strokeWidth="2" />
          <circle cx="50" cy="83.5" r="3.5" fill="#10B981" className="chest-core" />

          {/* Gradients */}
          <defs>
            <linearGradient id="botGrad" x1="22" y1="18" x2="78" y2="66" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EFF6FF" />
              <stop offset="1" stopColor="#DBEAFE" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );
};

// ─── Main Login Page Component ──────────────────────────────────────────────
export const LoginPage: React.FC<LoginPageProps> = ({ onSignIn, error, loading }) => {
  const [btnHovered, setBtnHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<'arena' | 'blocks' | 'hardware'>('arena');

  const handleGoogleSignIn = async () => {
    if (loading) return;
    await onSignIn();
  };

  const showcaseTabs = [
    {
      id: 'arena' as const,
      icon: '🏎️',
      title: '3D Robot Arena',
      desc: 'Simulasi manuver sensor garis & rintangan real-time',
    },
    {
      id: 'blocks' as const,
      icon: '🧩',
      title: 'Balok Visual',
      desc: 'Coding drag-and-drop semudah merakit Lego',
    },
    {
      id: 'hardware' as const,
      icon: '⚡',
      title: 'ESP32 & Arduino',
      desc: 'Langsung flash & upload ke mikrokontroler fisik',
    },
  ];

  return (
    <div className="robolab-login-root">
      {/* ── Background Ambiance (Light & Cheerful) ── */}
      <div className="bg-dots-pattern" />
      <div className="bg-shape shape-blue" />
      <div className="bg-shape shape-amber" />
      <div className="bg-shape shape-emerald" />
      <div className="bg-shape shape-violet" />

      {/* Floating Playful Decors */}
      <motion.div
        className="floating-decor float-1"
        animate={{ y: [-8, 8, -8], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span>🚀</span>
      </motion.div>
      <motion.div
        className="floating-decor float-2"
        animate={{ y: [6, -6, 6], rotate: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <span>⭐</span>
      </motion.div>
      <motion.div
        className="floating-decor float-3"
        animate={{ y: [-6, 6, -6], rotate: [0, 12, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <span>🧩</span>
      </motion.div>
      <motion.div
        className="floating-decor float-4"
        animate={{ y: [7, -7, 7], rotate: [0, -8, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <span>⚡</span>
      </motion.div>

      {/* ── Main Glass Card Container ── */}
      <motion.div
        className="login-card-container"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── LEFT PANEL: Welcoming Kids-Friendly & Professional Auth ── */}
        <div className="left-auth-panel">
          {/* Top Category Badge */}
          <div className="top-platform-badge">
            <span className="badge-sparkle">✨</span>
            <span className="badge-text">Platform Robotika &amp; Coding Pelajar</span>
          </div>

          {/* Logo & Brand Header */}
          <div className="brand-header">
            <img
              src={robolabLogo}
              alt="RoboLab Studio Pymasterclass Logo"
              className="robolab-brand-emblem"
            />
          </div>

          {/* Animated Mascot Section */}
          <div className="mascot-greeting-row">
            <RobotCompanion />
            <div className="greeting-text-area">
              <h1 className="main-title">
                Mulai Petualangan <span className="highlight-text">Robotikamu!</span>
              </h1>
              <p className="main-subtitle">
                Rakit logika, jelajahi arena 3D, dan kendalikan robot sungguhan secara visual &amp; interaktif.
              </p>
            </div>
          </div>

          {/* Google Sign In Area */}
          <div className="auth-box">
            <button
              id="btn-google-signin"
              className={`kid-google-btn ${btnHovered ? 'hovered' : ''} ${loading ? 'loading' : ''}`}
              onClick={handleGoogleSignIn}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              disabled={loading}
              type="button"
              aria-label="Masuk dengan Akun Google"
            >
              {loading ? (
                <div className="loading-state">
                  <div className="spinner-orbit" />
                  <div className="btn-labels">
                    <span className="btn-main-label">Menghubungkan ke Lab...</span>
                    <span className="btn-sub-label">Mohon tunggu sebentar</span>
                  </div>
                </div>
              ) : (
                <div className="btn-content-flex">
                  <div className="google-icon-wrapper">
                    <GoogleIcon size={26} />
                  </div>
                  <div className="btn-labels">
                    <span className="btn-main-label">Masuk dengan Google</span>
                    <span className="btn-sub-label">Akun Belajar.id atau Akun Google Pribadi</span>
                  </div>
                  <ChevronRight size={20} className="btn-arrow" />
                </div>
              )}
            </button>

            {/* Error Message Box */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="login-error"
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="error-box"
                >
                  <div className="error-content">
                    <span className="error-icon">⚠️</span>
                    <div className="error-text-wrap">
                      <div className="error-title">Akses Perangkat Belum Terdaftar</div>
                      <div className="error-desc">{error}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Learning Features Chips */}
          <div className="learning-highlights">
            <div className="highlight-pill">
              <CheckCircle2 size={14} className="pill-icon text-emerald-500" />
              <span>Simulasi 3D Interaktif</span>
            </div>
            <div className="highlight-pill">
              <CheckCircle2 size={14} className="pill-icon text-blue-500" />
              <span>Python &amp; C++ Otomatis</span>
            </div>
            <div className="highlight-pill">
              <CheckCircle2 size={14} className="pill-icon text-amber-500" />
              <span>100% Aman untuk Siswa</span>
            </div>
          </div>

          {/* Footer Security & Copyright */}
          <div className="auth-footer">
            <div className="security-guarantee">
              <ShieldCheck size={16} className="security-icon" />
              <span>Single-Device Protection · Data Pelajar Terlindungi &amp; Aman</span>
            </div>
            <div className="copyright-note">
              © {new Date().getFullYear()} RoboLab Studio · PYMASTERCLASS Indonesia
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Interactive Workspace Showcase & Education Highlights ── */}
        <div className="right-showcase-panel">
          <div className="showcase-header">
            <div className="showcase-tag">
              <Compass size={14} />
              <span>LABORATORIUM VIRTUAL INTERAKTIF</span>
            </div>
            <h2 className="showcase-headline">
              Belajar Coding &amp; Robotika Jadi <span className="headline-accent">Mudah &amp; Menyenangkan</span>
            </h2>
            <p className="showcase-description">
              Tingkatkan kreativitas siswa melalui lingkungan pemrograman visual berstandar lomba robotika nasional dan internasional.
            </p>
          </div>

          {/* Tab Switchers */}
          <div className="showcase-tab-bar">
            {showcaseTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-chip ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-emoji">{tab.icon}</span>
                <span className="tab-chip-title">{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Central Workspace Window Showcase */}
          <div className="workspace-window-wrapper">
            <div className="window-frame">
              {/* Window Bar */}
              <div className="window-topbar">
                <div className="mac-dots">
                  <span className="mac-dot red" />
                  <span className="mac-dot yellow" />
                  <span className="mac-dot green" />
                </div>
                <div className="window-title">
                  <Bot size={13} className="text-blue-500" />
                  <span>RoboLab Studio — Ruang Simulasi &amp; Robot Plan</span>
                </div>
                <div className="window-status-pill">
                  <span className="pulse-dot" />
                  <span>Ready to Run</span>
                </div>
              </div>

              {/* Preview Image with Floating Feature Badges */}
              <div className="window-body">
                <img
                  src={h1Preview}
                  alt="RoboLab Studio Workspace Showcase"
                  className="preview-screenshot"
                />

                {/* Dynamic Floating Badges over Preview */}
                <motion.div
                  className="glass-badge badge-top-left"
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <span className="badge-icon">🏎️</span>
                  <div>
                    <div className="badge-name">Line Follower Arena</div>
                    <div className="badge-sub">6-Sensor PID Kontrol</div>
                  </div>
                </motion.div>

                <motion.div
                  className="glass-badge badge-bottom-right"
                  animate={{ y: [3, -3, 3] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                >
                  <span className="badge-icon">🧩</span>
                  <div>
                    <div className="badge-name">Blockly Visual Logic</div>
                    <div className="badge-sub">Drag &amp; Drop Praktis</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* 3 Kids-Friendly Benefit Cards */}
          <div className="kids-benefit-grid">
            <div className="benefit-card card-blue">
              <div className="benefit-icon-box bg-blue-100 text-blue-600">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="benefit-title">1. Susun Balok</h4>
                <p className="benefit-desc">Atur logika robot semudah main Lego tanpa perlu pusing sintaks.</p>
              </div>
            </div>

            <div className="benefit-card card-emerald">
              <div className="benefit-icon-box bg-emerald-100 text-emerald-600">
                <Rocket size={18} />
              </div>
              <div>
                <h4 className="benefit-title">2. Uji di Arena 3D</h4>
                <p className="benefit-desc">Lihat pergerakan robot dan sensor garis secara real-time di layar.</p>
              </div>
            </div>

            <div className="benefit-card card-amber">
              <div className="benefit-icon-box bg-amber-100 text-amber-600">
                <Zap size={18} />
              </div>
              <div>
                <h4 className="benefit-title">3. Masuk ke Robot Asli</h4>
                <p className="benefit-desc">1-klik sinkron ke mikrokontroler ESP32, Arduino, atau Micro:bit.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── STYLES ── */}
      <style>{`
        /* ── Fullscreen Root Container ── */
        .robolab-login-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #F0F7FF 0%, #FAF5FF 50%, #F0FDF4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          z-index: 9999;
          padding: 24px;
          box-sizing: border-box;
        }

        /* ── Soft & Cheerful Background Ambiance ── */
        .bg-dots-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#94A3B8 1.1px, transparent 1.1px);
          background-size: 28px 28px;
          opacity: 0.28;
          pointer-events: none;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          opacity: 0.55;
        }

        .shape-blue {
          width: 650px;
          height: 650px;
          top: -160px;
          left: -140px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(219, 234, 254, 0) 70%);
        }

        .shape-amber {
          width: 580px;
          height: 580px;
          bottom: -150px;
          right: -100px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(254, 243, 199, 0) 70%);
        }

        .shape-emerald {
          width: 500px;
          height: 500px;
          bottom: -80px;
          left: 20%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(209, 250, 229, 0) 70%);
        }

        .shape-violet {
          width: 480px;
          height: 480px;
          top: -100px;
          right: 25%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(237, 233, 254, 0) 70%);
        }

        /* Floating Playful Emojis */
        .floating-decor {
          position: absolute;
          font-size: 32px;
          pointer-events: none;
          user-select: none;
          z-index: 1;
          filter: drop-shadow(0 4px 10px rgba(0,0,0,0.08));
        }
        .float-1 { top: 7%; left: 8%; }
        .float-2 { bottom: 10%; left: 6%; }
        .float-3 { top: 9%; right: 9%; }
        .float-4 { bottom: 12%; right: 7%; }

        /* ── Main Split Card Container ── */
        .login-card-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1540px;
          height: 100%;
          max-height: 900px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          box-shadow:
            0 24px 60px -12px rgba(37, 99, 235, 0.14),
            0 12px 28px -6px rgba(15, 23, 42, 0.05),
            0 0 0 1px rgba(226, 232, 240, 0.8);
          display: grid;
          grid-template-columns: 500px 1fr;
          overflow: hidden;
        }

        /* ── LEFT PANEL: AUTH & GREETING ── */
        .left-auth-panel {
          padding: 38px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #FFFFFF;
          border-right: 1px solid #EDF2F7;
          position: relative;
          z-index: 2;
        }

        .top-platform-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 20px;
          width: fit-content;
          margin-bottom: 14px;
        }

        .badge-sparkle {
          font-size: 13px;
        }

        .badge-text {
          font-size: 12px;
          font-weight: 700;
          color: #1D4ED8;
          letter-spacing: 0.02em;
        }

        .brand-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }

        .robolab-brand-emblem {
          height: 52px;
          width: auto;
          object-fit: contain;
          filter: drop-shadow(0 3px 8px rgba(37, 99, 235, 0.12));
        }

        /* Mascot Row */
        .mascot-greeting-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
          border: 1px solid #E2E8F0;
          border-radius: 20px;
        }

        .robot-mascot-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .mascot-speech-bubble {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #1E293B;
          color: #FFFFFF;
          padding: 4px 10px;
          border-radius: 10px;
          font-size: 10.5px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          pointer-events: none;
          z-index: 5;
        }

        .speech-arrow {
          position: absolute;
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid #1E293B;
        }

        .robot-avatar {
          cursor: pointer;
        }

        @keyframes eyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        .robot-eyes {
          animation: eyeBlink 3.8s infinite;
          transform-origin: 50% 39px;
        }

        .antenna-glow {
          filter: drop-shadow(0 0 5px #F59E0B);
        }

        .chest-core {
          filter: drop-shadow(0 0 4px #10B981);
        }

        .greeting-text-area {
          flex: 1;
        }

        .main-title {
          font-size: 21px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
          line-height: 1.25;
        }

        .highlight-text {
          color: #2563EB;
          background: linear-gradient(135deg, #2563EB 0%, #3B82F6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .main-subtitle {
          font-size: 12.5px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
        }

        /* ── Auth Box & Big Kid Google Button ── */
        .auth-box {
          margin-bottom: 16px;
        }

        .kid-google-btn {
          width: 100%;
          min-height: 62px;
          background: #FFFFFF;
          border: 2px solid #E2E8F0;
          border-radius: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 8px 18px;
          box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.04),
            0 1px 3px rgba(0, 0, 0, 0.02);
          outline: none;
          user-select: none;
        }

        .kid-google-btn:hover,
        .kid-google-btn.hovered {
          border-color: #3B82F6;
          background: #F8FAFC;
          box-shadow:
            0 10px 28px rgba(37, 99, 235, 0.16),
            0 2px 6px rgba(37, 99, 235, 0.08);
          transform: translateY(-2px);
        }

        .kid-google-btn:active {
          transform: translateY(0);
          box-shadow: 0 3px 10px rgba(37, 99, 235, 0.12);
        }

        .kid-google-btn.loading {
          cursor: not-allowed;
          opacity: 0.85;
          background: #F1F5F9;
        }

        .btn-content-flex {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .google-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .btn-labels {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          flex: 1;
        }

        .btn-main-label {
          font-size: 15.5px;
          font-weight: 700;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .btn-sub-label {
          font-size: 11px;
          color: #64748B;
          font-weight: 500;
          margin-top: 1px;
        }

        .btn-arrow {
          color: #94A3B8;
          transition: transform 0.2s;
        }

        .kid-google-btn:hover .btn-arrow {
          color: #2563EB;
          transform: translateX(3px);
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
        }

        .spinner-orbit {
          width: 26px;
          height: 26px;
          border: 3px solid #DBEAFE;
          border-top-color: #2563EB;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Box */
        .error-box {
          margin-top: 12px;
          padding: 12px 14px;
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          border-radius: 14px;
          overflow: hidden;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .error-icon {
          font-size: 16px;
          line-height: 1;
          margin-top: 2px;
        }

        .error-text-wrap {
          flex: 1;
        }

        .error-title {
          color: #991B1B;
          font-size: 12.5px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .error-desc {
          color: #B91C1C;
          font-size: 11.5px;
          line-height: 1.45;
        }

        /* Learning highlights pills */
        .learning-highlights {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 18px;
        }

        .highlight-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #334155;
        }

        .pill-icon {
          flex-shrink: 0;
        }

        /* Left Footer */
        .auth-footer {
          padding-top: 14px;
          border-top: 1px solid #F1F5F9;
        }

        .security-guarantee {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 4px;
        }

        .security-icon {
          color: #10B981;
          flex-shrink: 0;
        }

        .copyright-note {
          font-size: 11px;
          color: #94A3B8;
        }

        /* ── RIGHT PANEL: INTERACTIVE SHOWCASE ── */
        .right-showcase-panel {
          padding: 38px 44px;
          background: linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 50%, #F5F3FF 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .showcase-header {
          margin-bottom: 14px;
        }

        .showcase-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: #DBEAFE;
          border: 1px solid #BFDBFE;
          border-radius: 20px;
          color: #1D4ED8;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .showcase-headline {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          margin: 0 0 6px 0;
          line-height: 1.25;
        }

        .headline-accent {
          background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .showcase-description {
          font-size: 13.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
          max-width: 680px;
        }

        /* Tab switchers */
        .showcase-tab-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }

        .tab-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12.5px;
          font-weight: 600;
          color: #475569;
          outline: none;
        }

        .tab-chip:hover {
          background: #FFFFFF;
          border-color: #CBD5E1;
          color: #1E293B;
        }

        .tab-chip.active {
          background: #2563EB;
          border-color: #2563EB;
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
        }

        /* Workspace Window Showcase */
        .workspace-window-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 10px 0 16px 0;
          min-height: 0;
        }

        .window-frame {
          width: 100%;
          height: 100%;
          max-height: 440px;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          box-shadow:
            0 24px 50px rgba(37, 99, 235, 0.12),
            0 8px 20px rgba(15, 23, 42, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .window-topbar {
          height: 38px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          flex-shrink: 0;
        }

        .mac-dots {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .mac-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .mac-dot.red { background: #EF4444; }
        .mac-dot.yellow { background: #F59E0B; }
        .mac-dot.green { background: #10B981; }

        .window-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #475569;
        }

        .window-status-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          color: #059669;
          background: #ECFDF5;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid #A7F3D0;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: pulseDot 2s infinite;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .window-body {
          position: relative;
          width: 100%;
          height: 100%;
          background: #FFFFFF;
          overflow: hidden;
        }

        .preview-screenshot {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
        }

        /* Glass Badges floating over screenshot */
        .glass-badge {
          position: absolute;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(226, 232, 240, 0.95);
          border-radius: 14px;
          padding: 7px 12px;
          display: flex;
          align-items: center;
          gap: 9px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
        }

        .badge-top-left {
          top: 16px;
          left: 16px;
        }

        .badge-bottom-right {
          bottom: 16px;
          right: 16px;
        }

        .badge-icon {
          font-size: 20px;
        }

        .badge-name {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .badge-sub {
          font-size: 10.5px;
          color: #64748B;
          font-weight: 500;
        }

        /* Kids Benefits Grid */
        .kids-benefit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .benefit-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 12px 14px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .benefit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
        }

        .benefit-icon-box {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .benefit-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 2px 0;
        }

        .benefit-desc {
          font-size: 11px;
          color: #64748B;
          margin: 0;
          line-height: 1.4;
        }

        /* ── RESPONSIVE DESIGN ── */
        @media (max-width: 1180px) {
          .login-card-container {
            grid-template-columns: 440px 1fr;
          }
          .left-auth-panel {
            padding: 30px 32px;
          }
          .right-showcase-panel {
            padding: 30px 34px;
          }
          .kids-benefit-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }

        @media (max-width: 960px) {
          .robolab-login-root {
            overflow-y: auto;
            align-items: flex-start;
            padding: 16px;
          }

          .login-card-container {
            grid-template-columns: 1fr;
            max-width: 520px;
            height: auto;
            max-height: none;
            border-radius: 28px;
            margin: auto;
          }

          .right-showcase-panel {
            display: none;
          }

          .left-auth-panel {
            padding: 34px 28px;
            border-right: none;
          }

          .main-title {
            font-size: 20px;
          }

          .floating-decor {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .robolab-login-root {
            padding: 10px 8px;
          }

          .left-auth-panel {
            padding: 26px 18px;
          }

          .mascot-greeting-row {
            flex-direction: column;
            text-align: center;
            gap: 10px;
          }

          .greeting-text-area {
            text-align: center;
          }

          .main-title {
            font-size: 19px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
