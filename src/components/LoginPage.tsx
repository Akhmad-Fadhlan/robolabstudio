import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import robolabLogo from '../assets/robolab-logo.png';
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

// ─── Main Login Page Component ──────────────────────────────────────────────
export const LoginPage: React.FC<LoginPageProps> = ({ onSignIn, error, loading }) => {
  const [btnHovered, setBtnHovered] = useState(false);

  const handleGoogleSignIn = async () => {
    if (loading) return;
    await onSignIn();
  };

  return (
    <div className="robolab-login-root">
      {/* ── Light Background Ambiance ── */}
      <div className="bg-pattern" />
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />
      <div className="bg-glow" />

      {/* ── Main Widescreen Split Container ── */}
      <motion.div
        className="login-container"
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── LEFT PANEL: Login Form ── */}
        <div className="login-panel">
          {/* Prominent & Extra Large Branding Logo */}
          <div className="logo-wrapper">
            <img
              src={robolabLogo}
              alt="RoboLab Studio Pymasterclass"
              className="robolab-logo-img"
            />
          </div>

          {/* Heading & Subtitle */}
          <div className="login-header">
            <h1 className="login-title">Welcome to RoboLab Studio</h1>
            <p className="login-subtitle">
              Login to access your IoT &amp; Robotics workspace
            </p>
          </div>

          {/* Authentication Section - Only Google Sign In */}
          <div className="auth-action-area">
            <button
              id="btn-google-signin"
              className={`google-signin-btn ${btnHovered ? 'hovered' : ''} ${loading ? 'loading' : ''}`}
              onClick={handleGoogleSignIn}
              onMouseEnter={() => setBtnHovered(true)}
              onMouseLeave={() => setBtnHovered(false)}
              disabled={loading}
              type="button"
              aria-label="Continue with Google"
            >
              {loading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="btn-content">
                  <GoogleIcon size={24} />
                  <span className="btn-text">Continue with Google</span>
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
                      <div className="error-title">Akses Ditolak</div>
                      <div className="error-desc">{error}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Product Showcase (Visible only on Mobile via CSS) */}
          <div className="mobile-showcase-wrapper">
            <div className="mobile-preview-card">
              <img
                src={h1Preview}
                alt="RoboLab Studio workspace"
                className="mobile-preview-img"
              />
            </div>
            <div className="mobile-tagline">
              <h2>Build. Learn. Innovate.</h2>
              <p>A creative workspace for learning programming, electronics, IoT, and robotics.</p>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="login-footer">
            <div className="copyright-text">
              © RoboLab Studio · PYMASTERCLASS
            </div>
            <div className="security-note">
              🔒 Secure authentication · Single-device login protection
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: RoboLab Studio Preview (h1.jpg) ── */}
        <div className="preview-panel">
          <div className="preview-header">
            <div className="preview-badge">
              <span className="badge-dot" />
              <span>ROBOLAB STUDIO PREVIEW</span>
            </div>
            <h2 className="preview-title">Build. Learn. Innovate.</h2>
            <p className="preview-subtitle">
              A creative workspace for learning programming, electronics, IoT, and robotics.
            </p>
          </div>

          {/* Large Widescreen Showcase Container using h1.jpg */}
          <motion.div
            className="showcase-container"
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="showcase-window">
              {/* Window Header Bar */}
              <div className="window-bar">
                <div className="window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="window-title-bar">
                  <span className="lock-icon">🔒</span>
                  <span>RoboLab Studio — Main Workspace</span>
                </div>
                <div style={{ width: 42 }} />
              </div>

              {/* Screenshot Image (h1.jpg) */}
              <div className="showcase-img-wrap">
                <img
                  src={h1Preview}
                  alt="RoboLab Studio workspace"
                  className="showcase-img"
                />
              </div>
            </div>
          </motion.div>

          {/* Feature Badges */}
          <div className="feature-tags">
            <div className="tag">
              <span className="tag-icon">⚡</span> Visual &amp; Python Code
            </div>
            <div className="tag">
              <span className="tag-icon">🔌</span> ESP32 &amp; Arduino Ready
            </div>
            <div className="tag">
              <span className="tag-icon">🤖</span> Real-time Hardware Sync
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
          background-color: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          overflow: hidden;
          z-index: 9999;
          padding: 24px;
          box-sizing: border-box;
        }

        /* ── Light Ambiance Backgrounds ── */
        .bg-pattern {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#CBD5E1 1.2px, transparent 1.2px);
          background-size: 32px 32px;
          opacity: 0.35;
          pointer-events: none;
        }

        .bg-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          opacity: 0.55;
        }

        .blob-1 {
          width: 650px;
          height: 650px;
          top: -150px;
          left: -150px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, rgba(239, 246, 255, 0) 70%);
        }

        .blob-2 {
          width: 750px;
          height: 750px;
          bottom: -200px;
          right: -180px;
          background: radial-gradient(circle, rgba(29, 78, 216, 0.12) 0%, rgba(239, 246, 255, 0) 70%);
        }

        .bg-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 80% at 50% 50%, rgba(255, 255, 255, 0.85) 0%, transparent 100%);
          pointer-events: none;
        }

        /* ── Full Widescreen Split Container ── */
        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1600px;
          height: 100%;
          max-height: 920px;
          background: #FFFFFF;
          border-radius: 28px;
          border: 1px solid #E2E8F0;
          box-shadow:
            0 30px 80px -20px rgba(37, 99, 235, 0.1),
            0 12px 36px -10px rgba(15, 23, 42, 0.05),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
          display: grid;
          grid-template-columns: 520px 1fr;
          overflow: hidden;
        }

        /* ── LEFT PANEL: LOGIN FORM ── */
        .login-panel {
          padding: 44px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #FFFFFF;
          position: relative;
          z-index: 2;
          border-right: 1px solid #F1F5F9;
        }

        /* Extra Large & Highly Readable Logo Styling */
        .logo-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 16px;
          padding: 8px 0;
        }

        .robolab-logo-img {
          width: 100%;
          max-width: 360px;
          max-height: 250px;
          height: auto;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 6px 16px rgba(37, 99, 235, 0.1));
        }

        .login-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #172554;
          letter-spacing: -0.03em;
          margin: 0 0 8px 0;
          line-height: 1.25;
        }

        .login-subtitle {
          font-size: 15px;
          color: #64748B;
          margin: 0;
          line-height: 1.5;
          font-weight: 400;
        }

        /* ── Auth Button Area ── */
        .auth-action-area {
          margin-bottom: 28px;
          width: 100%;
        }

        .google-signin-btn {
          width: 100%;
          height: 56px;
          background: #FFFFFF;
          border: 1.5px solid #E5E7EB;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          outline: none;
          padding: 0 24px;
          box-sizing: border-box;
          user-select: none;
        }

        .google-signin-btn:hover,
        .google-signin-btn.hovered {
          border-color: #2563EB;
          background-color: #EFF6FF;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.14);
          transform: translateY(-1px);
        }

        .google-signin-btn:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.1);
        }

        .google-signin-btn.loading {
          cursor: not-allowed;
          opacity: 0.85;
          border-color: #CBD5E1;
          background-color: #F8FAFC;
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
        }

        .btn-text {
          font-size: 16px;
          font-weight: 600;
          color: #1E293B;
          letter-spacing: -0.01em;
        }

        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #475569;
          font-size: 15px;
          font-weight: 500;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #CBD5E1;
          border-top-color: #2563EB;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Box */
        .error-box {
          margin-top: 16px;
          padding: 14px 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 12px;
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
          margin-top: 1px;
        }

        .error-text-wrap {
          flex: 1;
        }

        .error-title {
          color: #991B1B;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .error-desc {
          color: #B91C1C;
          font-size: 12px;
          line-height: 1.45;
        }

        /* Footer */
        .login-footer {
          text-align: center;
          margin-top: auto;
          padding-top: 16px;
          border-top: 1px solid #F1F5F9;
        }

        .copyright-text {
          font-size: 12.5px;
          font-weight: 600;
          color: #64748B;
          letter-spacing: 0.02em;
          margin-bottom: 4px;
        }

        .security-note {
          font-size: 11.5px;
          color: #94A3B8;
        }

        /* ── RIGHT PANEL: PREVIEW ── */
        .preview-panel {
          background: linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 100%);
          border-left: 1px solid #E2E8F0;
          padding: 48px 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .preview-header {
          position: relative;
          z-index: 2;
        }

        .preview-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 14px;
          background: #DBEAFE;
          border-radius: 20px;
          color: #1D4ED8;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-bottom: 14px;
        }

        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #2563EB;
        }

        .preview-title {
          font-size: 28px;
          font-weight: 700;
          color: #172554;
          letter-spacing: -0.025em;
          margin: 0 0 8px 0;
        }

        .preview-subtitle {
          font-size: 14.5px;
          color: #64748B;
          line-height: 1.55;
          margin: 0;
          max-width: 600px;
        }

        /* Showcase Screenshot Container */
        .showcase-container {
          margin: 20px 0;
          position: relative;
          z-index: 2;
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .showcase-window {
          width: 100%;
          max-height: 100%;
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow:
            0 28px 75px rgba(37, 99, 235, 0.13),
            0 12px 32px rgba(15, 23, 42, 0.06);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .window-bar {
          height: 38px;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          flex-shrink: 0;
        }

        .window-dots {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .dot-red { background: #EF4444; }
        .dot-yellow { background: #F59E0B; }
        .dot-green { background: #10B981; }

        .window-title-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
        }

        .lock-icon {
          font-size: 11px;
        }

        .showcase-img-wrap {
          width: 100%;
          height: 100%;
          background: #FFFFFF;
          padding: 4px;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .showcase-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          display: block;
          border-radius: 0 0 16px 16px;
        }

        /* Feature Badges */
        .feature-tags {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(8px);
        }

        .tag-icon {
          font-size: 14px;
        }

        .mobile-showcase-wrapper {
          display: none;
        }

        /* ── RESPONSIVE DESIGN FOR MOBILE & TABLET ── */
        @media (max-width: 1100px) {
          .login-container {
            grid-template-columns: 460px 1fr;
          }
          .login-panel {
            padding: 36px 32px;
          }
          .preview-panel {
            padding: 40px 36px;
          }
          .robolab-logo-img {
            max-width: 320px;
            max-height: 200px;
          }
        }

        @media (max-width: 900px) {
          .robolab-login-root {
            overflow-y: auto;
            align-items: flex-start;
            padding: 20px 16px;
          }

          .login-container {
            grid-template-columns: 1fr;
            max-width: 540px;
            height: auto;
            max-height: none;
            border-radius: 24px;
          }

          .preview-panel {
            display: none;
          }

          .login-panel {
            padding: 36px 28px;
            border-right: none;
          }

          .robolab-logo-img {
            max-width: 320px;
            max-height: 220px;
          }

          .mobile-showcase-wrapper {
            display: block;
            margin: 32px 0;
          }

          .mobile-preview-card {
            background: #FFFFFF;
            border-radius: 20px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 18px 45px rgba(37, 99, 235, 0.12);
            padding: 4px;
            overflow: hidden;
            margin-bottom: 20px;
          }

          .mobile-preview-img {
            width: 100%;
            height: auto;
            border-radius: 16px;
            display: block;
          }

          .mobile-tagline {
            text-align: center;
          }

          .mobile-tagline h2 {
            font-size: 20px;
            font-weight: 700;
            color: #172554;
            margin: 0 0 6px 0;
          }

          .mobile-tagline p {
            font-size: 13.5px;
            color: #64748B;
            margin: 0;
            line-height: 1.5;
          }
        }

        @media (max-width: 480px) {
          .robolab-login-root {
            padding: 12px 10px;
          }

          .login-panel {
            padding: 28px 20px;
          }

          .login-title {
            font-size: 24px;
          }

          .robolab-logo-img {
            max-width: 280px;
            max-height: 190px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
