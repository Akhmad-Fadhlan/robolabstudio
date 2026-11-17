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
  Cpu,
  Sparkles,
  Code2,
  Lock,
  Activity,
  Play,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import robolabLogo from '../assets/robolab-logo-only.png';
import showcaseCircuit from '../assets/showcase-circuit.png';
import showcaseBlocks from '../assets/showcase-blocks.png';

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
  'Simulasi sirkuit ESP32 & LED! ⚡',
  'Susun balok & jalankan kodenya! 🧩',
  'Ayo mulai petualangan seru ini! 🚀',
];

// ─── Cute Animated Robot Companion Avatar ──────────────────────────────────
const RobotCompanion: React.FC = () => {
  const [bubbleTextIdx, setBubbleTextIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBubbleTextIdx((prev) => (prev + 1) % SPEECH_QUOTES.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="robot-mascot-wrap">
      {/* Interactive Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={bubbleTextIdx}
          initial={{ opacity: 0, y: 5, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.94 }}
          transition={{ duration: 0.28 }}
          className="mascot-speech-bubble"
        >
          <span className="bubble-text">{SPEECH_QUOTES[bubbleTextIdx]}</span>
          <div className="speech-arrow" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Robot SVG */}
      <motion.div
        className="robot-avatar"
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          width="74"
          height="74"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Shadow beneath */}
          <ellipse cx="50" cy="94" rx="24" ry="4.5" fill="#CBD5E1" opacity="0.6" />

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
  const [activeTab, setActiveTab] = useState<'circuit' | 'blocks'>('circuit');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-switch showcase tabs every 8 seconds if user hasn't manually interacted
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === 'circuit' ? 'blocks' : 'circuit'));
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    await onSignIn();
  };

  const showcaseTabs = [
    {
      id: 'circuit' as const,
      icon: <Zap size={15} className="text-amber-500" />,
      title: 'Simulator Rangkaian & ESP32',
      badge: 'Live Interactive Circuit',
      desc: 'Simulasi board ESP32 DevKit, komponen LED menyala, kabel wiring, dan sensor interaktif.',
      image: showcaseCircuit,
      windowTitle: 'RoboLab Studio — Simulator Rangkaian ESP32 DevKit V1',
      highlights: [
        { label: '⚡ ESP32 DevKit V1', sub: 'Simulasi pin I/O & PWM interaktif', pos: 'top-left' },
        { label: '💡 Dual LED Glow Effect', sub: 'Visualisasi pin D4 & D15 real-time', pos: 'bottom-right' },
        { label: '📜 Live C++ (Ino) Sync', sub: 'Kode Arduino terbentuk seketika', pos: 'bottom-left' },
      ],
    },
    {
      id: 'blocks' as const,
      icon: <Layers size={15} className="text-blue-500" />,
      title: 'Visual Block Studio',
      badge: 'Blockly & Logic Studio',
      desc: 'Pemrograman blok visual drag-and-drop dengan pembacaan sensor pH, ultrasonic, & Serial Monitor.',
      image: showcaseBlocks,
      windowTitle: 'RoboLab Studio — Visual Blocks & Real-time Code Editor',
      highlights: [
        { label: '🧩 Drag & Drop Blockly', sub: 'Susun fungsi setup() & loop() mudah', pos: 'top-left' },
        { label: '📡 Integrated Serial Monitor', sub: 'Baudrate 115200 & terminal interaktif', pos: 'bottom-right' },
        { label: '🎓 Mode Siswa & Pro Mode', sub: 'Transisi bertahap ke kode teks profesional', pos: 'bottom-left' },
      ],
    },
  ];

  const currentShowcase = showcaseTabs.find((t) => t.id === activeTab) || showcaseTabs[0];

  return (
    <div className="robolab-login-root">
      {/* ── Background Ambiance: Elegant Soft Modern Tech Glow ── */}
      <div className="bg-dots-pattern" />
      <div className="bg-shape shape-blue" />
      <div className="bg-shape shape-cyan" />
      <div className="bg-shape shape-amber" />
      <div className="bg-shape shape-violet" />

      {/* Subtle modern floating accents */}
      <motion.div
        className="floating-accent accent-1"
        animate={{ y: [-6, 6, -6], rotate: [0, 6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="accent-pill">✨ Edukasi Robotika 2026</span>
      </motion.div>
      <motion.div
        className="floating-accent accent-2"
        animate={{ y: [6, -6, 6], rotate: [0, -6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <span className="accent-pill">🚀 Ready for Competition</span>
      </motion.div>

      {/* ── Main Glass Card Container ── */}
      <motion.div
        className="login-card-container"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── LEFT PANEL: Welcoming Kids-Friendly & Elegant Auth ── */}
        <div className="left-auth-panel">
          {/* Top Brand & Category Header */}
          <div className="panel-top-section">
            <div className="top-platform-badge">
              <Sparkles size={13} className="text-blue-600" />
              <span>PLATFORM EDUKASI ROBOTIKA &amp; IOT</span>
            </div>

            <div className="brand-header">
              <div className="brand-logo-wrap">
                <img
                  src={robolabLogo}
                  alt="RoboLab Studio Logo"
                  className="robolab-brand-emblem"
                />
              </div>
              <div className="brand-text-wrap">
                <div className="brand-app-title">RoboLab Studio</div>
                <div className="brand-app-sub">Pymasterclass Indonesia</div>
              </div>
            </div>

            {/* Mascot & Greeting Card */}
            <div className="mascot-greeting-card">
              <RobotCompanion />
              <div className="greeting-text-area">
                <h1 className="main-title">
                  Mulai Petualangan <span className="highlight-text">Robotikamu!</span>
                </h1>
                <p className="main-subtitle">
                  Rakit logika visual, simulasikan sirkuit ESP32 &amp; sensor, serta flash ke robot fisik semudah menekan tombol.
                </p>
              </div>
            </div>
          </div>

          {/* Central Auth Area: Google Sign-In */}
          <div className="panel-auth-section">
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
                      <span className="btn-sub-label">Memverifikasi akun Google Anda</span>
                    </div>
                  </div>
                ) : (
                  <div className="btn-content-flex">
                    <div className="google-icon-wrapper">
                      <GoogleIcon size={24} />
                    </div>
                    <div className="btn-labels">
                      <span className="btn-main-label">Lanjutkan dengan Google</span>
                      <span className="btn-sub-label">Akun Belajar.id atau Akun Google Pribadi</span>
                    </div>
                    <div className="btn-action-icon">
                      <ChevronRight size={18} className="btn-arrow" />
                    </div>
                  </div>
                )}
              </button>

              {/* Error Message Box */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="login-error"
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="error-box"
                  >
                    <div className="error-content">
                      <div className="error-icon-wrap">
                        <Lock size={16} className="text-red-500" />
                      </div>
                      <div className="error-text-wrap">
                        <div className="error-title">Akses Perangkat Belum Terdaftar</div>
                        <div className="error-desc">{error}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Learning Feature Badges */}
            <div className="learning-highlights">
              <div className="highlight-pill">
                <CheckCircle2 size={13} className="pill-icon text-emerald-500" />
                <span>Simulasi ESP32 &amp; Rangkaian Nyata</span>
              </div>
              <div className="highlight-pill">
                <CheckCircle2 size={13} className="pill-icon text-blue-500" />
                <span>Visual Block &amp; C++ / MicroPython</span>
              </div>
              <div className="highlight-pill">
                <CheckCircle2 size={13} className="pill-icon text-amber-500" />
                <span>WebUSB &amp; Serial Flash 1-Klik</span>
              </div>
            </div>
          </div>

          {/* Footer Security & Info */}
          <div className="panel-footer-section">
            <div className="security-guarantee">
              <ShieldCheck size={15} className="security-icon" />
              <span>Single-Device Protection · 1 Akun Pelajar per Perangkat</span>
            </div>
            <div className="copyright-note">
              © {new Date().getFullYear()} RoboLab Studio · Hak Cipta Dilindungi Undang-Undang
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: Interactive Workspace Showcase ── */}
        <div 
          className="right-showcase-panel"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Showcase Header */}
          <div className="showcase-header">
            <div className="showcase-top-row">
              <div className="showcase-tag">
                <Compass size={13} className="text-blue-600" />
                <span>WORKSPACE INTERAKTIF PELAJAR</span>
              </div>
              <div className="live-indicator-pill">
                <span className="live-pulse-dot" />
                <span>Sistem Siap Digunakan</span>
              </div>
            </div>

            <h2 className="showcase-headline">
              Belajar Coding &amp; Robotika Jadi <span className="headline-accent">Mudah &amp; Menyenangkan</span>
            </h2>
            <p className="showcase-description">
              Lingkungan belajar visual interaktif dengan simulasi mikrokontroler real-time, circuit builder, dan generator kode C++ otomatis.
            </p>
          </div>

          {/* Tab Switcher Selector */}
          <div className="showcase-tab-bar">
            {showcaseTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-chip ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsAutoPlaying(false);
                  }}
                >
                  <span className="tab-icon-wrap">{tab.icon}</span>
                  <div className="tab-title-group">
                    <span className="tab-chip-title">{tab.title}</span>
                    <span className="tab-chip-sub">{tab.badge}</span>
                  </div>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="tab-active-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Workspace Window Showcase */}
          <div className="workspace-window-wrapper">
            <div className="window-frame">
              {/* Window Mac Header Bar */}
              <div className="window-topbar">
                <div className="mac-dots">
                  <span className="mac-dot red" />
                  <span className="mac-dot yellow" />
                  <span className="mac-dot green" />
                </div>
                <div className="window-title">
                  <Bot size={13} className="text-blue-500" />
                  <span>{currentShowcase.windowTitle}</span>
                </div>
                <div className="window-status-pill">
                  <span className="pulse-dot" />
                  <span>Interactive Live View</span>
                </div>
              </div>

              {/* Dynamic Image Display with Framer Motion Transition */}
              <div className="window-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.01 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="screenshot-display-wrap"
                  >
                    <img
                      src={currentShowcase.image}
                      alt={currentShowcase.title}
                      className="preview-screenshot"
                    />

                    {/* Floating Contextual Badges over Preview */}
                    {currentShowcase.highlights.map((badge, idx) => (
                      <motion.div
                        key={badge.label}
                        className={`glass-badge badge-${badge.pos}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + idx * 0.1 }}
                      >
                        <div className="badge-glow-dot" />
                        <div>
                          <div className="badge-name">{badge.label}</div>
                          <div className="badge-sub">{badge.sub}</div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 3 Modern Feature Cards */}
          <div className="kids-benefit-grid">
            <div className="benefit-card card-blue">
              <div className="benefit-icon-box bg-blue-50 text-blue-600 border border-blue-200">
                <Zap size={17} />
              </div>
              <div className="benefit-content">
                <h4 className="benefit-title">1. Simulasi Sirkuit</h4>
                <p className="benefit-desc">Rakit mikrokontroler ESP32, sensor, dan LED interaktif tanpa takut salah colok.</p>
              </div>
            </div>

            <div className="benefit-card card-emerald">
              <div className="benefit-icon-box bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Layers size={17} />
              </div>
              <div className="benefit-content">
                <h4 className="benefit-title">2. Logika Visual Blok</h4>
                <p className="benefit-desc">Susun balok pemrograman semudah bermain Lego; kode C++ terbit secara otomatis.</p>
              </div>
            </div>

            <div className="benefit-card card-amber">
              <div className="benefit-icon-box bg-amber-50 text-amber-600 border border-amber-200">
                <Rocket size={17} />
              </div>
              <div className="benefit-content">
                <h4 className="benefit-title">3. Flash ke Robot Fisik</h4>
                <p className="benefit-desc">Kirim program langsung ke board nyata lewat WebUSB &amp; Serial dengan 1-klik.</p>
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
          background: linear-gradient(135deg, #F0F6FF 0%, #FAF5FF 45%, #F0FDF4 100%);
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
          background-image: radial-gradient(#94A3B8 1px, transparent 1px);
          background-size: 26px 26px;
          opacity: 0.22;
          pointer-events: none;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(110px);
          pointer-events: none;
          opacity: 0.55;
        }

        .shape-blue {
          width: 700px;
          height: 700px;
          top: -180px;
          left: -160px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.22) 0%, rgba(219, 234, 254, 0) 70%);
        }

        .shape-cyan {
          width: 550px;
          height: 550px;
          bottom: -140px;
          left: 28%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(207, 250, 254, 0) 70%);
        }

        .shape-amber {
          width: 520px;
          height: 520px;
          bottom: -140px;
          right: -80px;
          background: radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, rgba(254, 243, 199, 0) 70%);
        }

        .shape-violet {
          width: 480px;
          height: 480px;
          top: -120px;
          right: 22%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(237, 233, 254, 0) 70%);
        }

        /* Floating Modern Accents */
        .floating-accent {
          position: absolute;
          pointer-events: none;
          user-select: none;
          z-index: 2;
        }
        .accent-1 { top: 3.5%; left: 4%; }
        .accent-2 { bottom: 4%; right: 4%; }

        .accent-pill {
          display: inline-block;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.85);
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
        }

        /* ── Main Split Card Container ── */
        .login-card-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1520px;
          height: 100%;
          max-height: 890px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(24px);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          box-shadow:
            0 24px 60px -12px rgba(37, 99, 235, 0.13),
            0 12px 28px -6px rgba(15, 23, 42, 0.05),
            0 0 0 1px rgba(226, 232, 240, 0.8);
          display: grid;
          grid-template-columns: 480px 1fr;
          overflow: hidden;
        }

        /* ── LEFT PANEL: AUTH & GREETING ── */
        .left-auth-panel {
          padding: 34px 38px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #FFFFFF;
          border-right: 1px solid #EDF2F7;
          position: relative;
          z-index: 2;
        }

        .panel-top-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .top-platform-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 20px;
          width: fit-content;
          font-size: 11px;
          font-weight: 700;
          color: #1D4ED8;
          letter-spacing: 0.04em;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 2px;
        }

        .brand-logo-wrap {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
          flex-shrink: 0;
        }

        .robolab-brand-emblem {
          height: 32px;
          width: auto;
          object-fit: contain;
        }

        .brand-text-wrap {
          display: flex;
          flex-direction: column;
        }

        .brand-app-title {
          font-size: 19px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .brand-app-sub {
          font-size: 11px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.02em;
        }

        /* Mascot Greeting Card */
        .mascot-greeting-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
          border: 1px solid #E2E8F0;
          border-radius: 18px;
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
          top: -26px;
          left: 50%;
          transform: translateX(-50%);
          background: #0F172A;
          color: #FFFFFF;
          padding: 3px 9px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.18);
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
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #0F172A;
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
          font-size: 18.5px;
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
          font-size: 12px;
          color: #64748B;
          line-height: 1.45;
          margin: 0;
        }

        /* ── Central Auth Box ── */
        .panel-auth-section {
          margin: 16px 0;
        }

        .auth-box {
          margin-bottom: 14px;
        }

        .kid-google-btn {
          width: 100%;
          min-height: 60px;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 8px 16px;
          box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.04),
            0 1px 2px rgba(0, 0, 0, 0.02);
          outline: none;
          user-select: none;
        }

        .kid-google-btn:hover,
        .kid-google-btn.hovered {
          border-color: #2563EB;
          background: #F8FAFC;
          box-shadow:
            0 10px 24px -4px rgba(37, 99, 235, 0.18),
            0 2px 6px rgba(37, 99, 235, 0.08);
          transform: translateY(-2px);
        }

        .kid-google-btn:active {
          transform: translateY(0);
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.12);
        }

        .kid-google-btn.loading {
          cursor: not-allowed;
          opacity: 0.9;
          background: #F1F5F9;
        }

        .btn-content-flex {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .google-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 11px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
        }

        .btn-labels {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          flex: 1;
        }

        .btn-main-label {
          font-size: 15px;
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

        .btn-action-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
          transition: all 0.2s;
        }

        .kid-google-btn:hover .btn-action-icon {
          color: #2563EB;
          background: #EFF6FF;
          transform: translateX(2px);
        }

        .loading-state {
          display: flex;
          align-items: center;
          gap: 13px;
          width: 100%;
        }

        .spinner-orbit {
          width: 24px;
          height: 24px;
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
          margin-top: 10px;
          padding: 10px 12px;
          background: #FEF2F2;
          border: 1.5px solid #FECACA;
          border-radius: 12px;
          overflow: hidden;
        }

        .error-content {
          display: flex;
          align-items: flex-start;
          gap: 9px;
        }

        .error-icon-wrap {
          margin-top: 2px;
          flex-shrink: 0;
        }

        .error-text-wrap {
          flex: 1;
        }

        .error-title {
          color: #991B1B;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .error-desc {
          color: #B91C1C;
          font-size: 11px;
          line-height: 1.45;
        }

        /* Highlights Pills */
        .learning-highlights {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .highlight-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 11px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
        }

        .pill-icon {
          flex-shrink: 0;
        }

        /* Left Footer */
        .panel-footer-section {
          padding-top: 12px;
          border-top: 1px solid #F1F5F9;
        }

        .security-guarantee {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 3px;
        }

        .security-icon {
          color: #10B981;
          flex-shrink: 0;
        }

        .copyright-note {
          font-size: 10.5px;
          color: #94A3B8;
        }

        /* ── RIGHT PANEL: SHOWCASE ── */
        .right-showcase-panel {
          padding: 34px 38px;
          background: linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 50%, #FAF5FF 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .showcase-header {
          margin-bottom: 12px;
        }

        .showcase-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .showcase-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 11px;
          background: #DBEAFE;
          border: 1px solid #BFDBFE;
          border-radius: 20px;
          color: #1D4ED8;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.05em;
        }

        .live-indicator-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          border-radius: 20px;
          color: #059669;
          font-size: 11px;
          font-weight: 600;
        }

        .live-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10B981;
          animation: pulseDot 2s infinite;
        }

        .showcase-headline {
          font-size: 22px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.025em;
          margin: 0 0 4px 0;
          line-height: 1.25;
        }

        .headline-accent {
          background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .showcase-description {
          font-size: 12.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.45;
          max-width: 680px;
        }

        /* Tab Switchers */
        .showcase-tab-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .tab-chip {
          position: relative;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          text-align: left;
        }

        .tab-chip:hover {
          background: #FFFFFF;
          border-color: #94A3B8;
        }

        .tab-chip.active {
          background: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15);
        }

        .tab-icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 7px;
          background: #F1F5F9;
        }

        .tab-chip.active .tab-icon-wrap {
          background: #EFF6FF;
        }

        .tab-title-group {
          display: flex;
          flex-direction: column;
        }

        .tab-chip-title {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.2;
        }

        .tab-chip.active .tab-chip-title {
          color: #1D4ED8;
        }

        .tab-chip-sub {
          font-size: 10px;
          font-weight: 500;
          color: #64748B;
        }

        .tab-active-indicator {
          position: absolute;
          bottom: -1px;
          left: 14px;
          right: 14px;
          height: 2.5px;
          background: #2563EB;
          border-radius: 3px;
        }

        /* Workspace Window Showcase */
        .workspace-window-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 6px 0 14px 0;
          min-height: 0;
        }

        .window-frame {
          width: 100%;
          height: 100%;
          max-height: 450px;
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #CBD5E1;
          box-shadow:
            0 20px 45px rgba(37, 99, 235, 0.12),
            0 6px 16px rgba(15, 23, 42, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .window-topbar {
          height: 36px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 14px;
          flex-shrink: 0;
        }

        .mac-dots {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .mac-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .mac-dot.red { background: #EF4444; }
        .mac-dot.yellow { background: #F59E0B; }
        .mac-dot.green { background: #10B981; }

        .window-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }

        .window-status-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 600;
          color: #059669;
          background: #ECFDF5;
          padding: 2px 7px;
          border-radius: 10px;
          border: 1px solid #A7F3D0;
        }

        .pulse-dot {
          width: 5px;
          height: 5px;
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
          background: #0F172A;
          overflow: hidden;
        }

        .screenshot-display-wrap {
          position: relative;
          width: 100%;
          height: 100%;
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
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 11px;
          padding: 6px 11px;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
          pointer-events: none;
        }

        .badge-glow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #3B82F6;
          box-shadow: 0 0 8px #3B82F6;
          flex-shrink: 0;
        }

        .badge-top-left {
          top: 14px;
          left: 14px;
        }

        .badge-bottom-right {
          bottom: 14px;
          right: 14px;
        }

        .badge-bottom-left {
          bottom: 14px;
          left: 14px;
        }

        .badge-name {
          font-size: 11.5px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.2;
        }

        .badge-sub {
          font-size: 10px;
          color: #64748B;
          font-weight: 500;
        }

        /* Kids Benefits Grid */
        .kids-benefit-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .benefit-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: flex-start;
          gap: 9px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .benefit-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
          border-color: #CBD5E1;
        }

        .benefit-icon-box {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .benefit-content {
          flex: 1;
        }

        .benefit-title {
          font-size: 12px;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 2px 0;
        }

        .benefit-desc {
          font-size: 10.5px;
          color: #64748B;
          margin: 0;
          line-height: 1.35;
        }

        /* ── RESPONSIVE DESIGN ── */
        @media (max-width: 1200px) {
          .login-card-container {
            grid-template-columns: 440px 1fr;
          }
          .left-auth-panel {
            padding: 28px 30px;
          }
          .right-showcase-panel {
            padding: 28px 30px;
          }
          .badge-bottom-left {
            display: none;
          }
        }

        @media (max-width: 980px) {
          .robolab-login-root {
            overflow-y: auto;
            align-items: flex-start;
            padding: 16px;
          }

          .login-card-container {
            grid-template-columns: 1fr;
            max-width: 500px;
            height: auto;
            max-height: none;
            border-radius: 24px;
            margin: auto;
          }

          .right-showcase-panel {
            display: none;
          }

          .left-auth-panel {
            padding: 32px 26px;
            border-right: none;
          }

          .main-title {
            font-size: 19px;
          }

          .floating-accent {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .robolab-login-root {
            padding: 8px;
          }

          .left-auth-panel {
            padding: 24px 16px;
          }

          .mascot-greeting-card {
            flex-direction: column;
            text-align: center;
            gap: 8px;
          }

          .greeting-text-area {
            text-align: center;
          }

          .main-title {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
