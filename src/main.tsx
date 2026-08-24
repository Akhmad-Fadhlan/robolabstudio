import { StrictMode, useState, useEffect, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LoginPage } from './components/LoginPage.tsx'
import {
  supabase,
  signInWithGoogle,
  signOut as supabaseSignOut,
  getDeviceId,
  getDeviceInfo,
  checkAndBindDevice,
} from './services/supabaseClient.ts'
import type { Session } from '@supabase/supabase-js'

// ─── Renderer Log Forwarding ──────────────────────────────────────────────
if (typeof window !== 'undefined') {
  const req = (window as any).__electronRequire || (window as any).require;
  if (req) {
    try {
      const fs = req('fs');
      const path = req('path');
      const os = req('os');
      const logPath = path.join(os.homedir(), 'robolab-renderer-logs.txt');
      fs.writeFileSync(logPath, '--- RoboLab Renderer Logs started ---\n', 'utf-8');
      const writeLog = (msg: string) => {
        try { fs.appendFileSync(logPath, msg + '\n', 'utf-8'); } catch (_) {}
      };
      const oldLog = console.log;
      console.log = (...args) => { oldLog(...args); writeLog('[INFO] ' + args.map((a: any) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
      const oldError = console.error;
      console.error = (...args) => { oldError(...args); writeLog('[ERROR] ' + args.map((a: any) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
      const oldWarn = console.warn;
      console.warn = (...args) => { oldWarn(...args); writeLog('[WARN] ' + args.map((a: any) => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')); };
      window.onerror = (message, source, lineno, colno, error) => {
        writeLog(`[WINDOW ERROR] ${message} at ${source}:${lineno}:${colno} - Error: ${error?.stack || error}`);
        return false;
      };
      window.addEventListener('unhandledrejection', (event) => {
        writeLog(`[UNHANDLED REJECTION] ${event.reason?.stack || event.reason}`);
      });
    } catch (_) {}
  }
}

// ─── Auth Guard ───────────────────────────────────────────────────────────
type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'authenticated'; session: Session };

function AuthGuard() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  // ── Verify device binding after a session is established ──
  const verifyDevice = useCallback(async (session: Session) => {
    try {
      const user = session.user;
      const userEmail = user.email ?? user.user_metadata?.email ?? '';
      const deviceId = await getDeviceId();
      const deviceInfo = await getDeviceInfo();
      const result = await checkAndBindDevice(user.id, deviceId, deviceInfo, userEmail);

      if (!result.ok) {
        // Build error message from result (not from stale state)
        let errMsg: string;
        const isDuplicateKey = result.reason === 'db_error' && 
          (result.message.includes('duplicate key value') || result.message.includes('device_bindings_device_id_key'));

        if (result.reason === 'device_taken' || isDuplicateKey) {
          const boundEmail = result.reason === 'device_taken' ? result.boundEmail : '';
          if (boundEmail) {
            errMsg = `Perangkat ini sudah terdaftar dengan akun: ${boundEmail}. Silakan masuk dengan email yang sudah Anda daftarkan.`;
          } else {
            errMsg = `Perangkat ini sudah terdaftar dengan akun lain. Silakan masuk dengan email yang sudah Anda daftarkan.`;
          }
          // Sign out if another user owns this device
          await supabaseSignOut();
        } else {
          // db_error — surface the real message so user/admin can diagnose
          errMsg = result.message;
          // For DB errors we still let the user in (table may not be set up yet)
          // but we show a warning. Remove the next two lines if you want strict enforcement.
          console.error('[RoboLab Auth] DB error during device binding:', errMsg);
          setDeviceError(errMsg);
          setAuthState({ status: 'authenticated', session });
          return;
        }

        setDeviceError(errMsg);
        setAuthState({ status: 'unauthenticated', error: errMsg });
      } else {
        setDeviceError(null);
        setAuthState({ status: 'authenticated', session });
      }
    } catch (err: any) {
      // Surface unexpected errors rather than silently swallowing them
      const errMsg = err?.message ?? String(err);
      console.error('[RoboLab Auth] Device verification exception:', errMsg);
      setDeviceError(`Device check error: ${errMsg}`);
      // Still let the user in — don't hard-lock on unexpected exceptions
      setAuthState({ status: 'authenticated', session });
    }
  }, []);

  // ── On mount: restore existing session ──
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        verifyDevice(data.session);
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
    });

    // Subscribe to auth changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        verifyDevice(session);
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [verifyDevice]);

  // ── Sign in handler ──
  const handleSignIn = useCallback(async () => {
    setLoginLoading(true);
    setDeviceError(null);
    try {
      await signInWithGoogle();
      // After redirect, onAuthStateChange will fire automatically
    } catch (err: any) {
      console.error('[RoboLab Auth] Sign in error:', err);
      setAuthState({ status: 'unauthenticated', error: err.message });
      setLoginLoading(false);
    }
  }, []);

  // ── Sign out handler ──
  const handleSignOut = useCallback(async () => {
    try {
      await supabaseSignOut();
    } catch (err) {
      console.error('[RoboLab Auth] Sign out error:', err);
    }
  }, []);

  // ── Render: Loading splash ──
  if (authState.status === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0a1628 0%, #020817 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, zIndex: 9999,
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid rgba(56,189,248,0.2)',
          borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <span style={{ color: 'rgba(148,163,184,0.6)', fontSize: 13, fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          INITIALIZING...
        </span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Render: Login page ──
  if (authState.status === 'unauthenticated') {
    return (
      <LoginPage
        onSignIn={handleSignIn}
        loading={loginLoading}
        error={deviceError ?? (authState.error ?? null)}
      />
    );
  }

  // ── Render: Authenticated → Main App ──
  const user = authState.session.user;
  const userMeta = user.user_metadata ?? {};

  return (
    <>
      {/* DB error toast — shown when device binding fails but user is still let in */}
      {deviceError && (
        <div
          style={{
            position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 99999, maxWidth: 520, width: 'calc(100% - 32px)',
            background: 'rgba(120, 53, 15, 0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(251,146,60,0.4)', borderRadius: 12,
            padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#fcd34d', fontSize: 12, fontWeight: 700, margin: '0 0 3px', letterSpacing: '0.04em' }}>
              DEVICE BINDING ERROR
            </p>
            <p style={{ color: 'rgba(253,230,138,0.85)', fontSize: 11, margin: 0, lineHeight: 1.55, wordBreak: 'break-word' }}>
              {deviceError}
            </p>
            <p style={{ color: 'rgba(253,230,138,0.55)', fontSize: 10, margin: '6px 0 0', lineHeight: 1.4 }}>
              Pastikan tabel <code>device_bindings</code> sudah dibuat di Supabase SQL Editor menggunakan file <strong>supabase-setup.sql</strong>.
            </p>
          </div>
          <button
            onClick={() => setDeviceError(null)}
            style={{
              background: 'none', border: 'none', color: 'rgba(253,230,138,0.6)',
              cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px', flexShrink: 0,
            }}
            title="Tutup"
          >×</button>
        </div>
      )}
      <App
        authUser={{
          id: user.id,
          email: user.email ?? '',
          name: userMeta.full_name ?? userMeta.name ?? '',
          avatar: userMeta.avatar_url ?? userMeta.picture ?? '',
        }}
        onSignOut={handleSignOut}
      />
    </>
  );
}


// ─── Mount ─────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGuard />
  </StrictMode>,
)

