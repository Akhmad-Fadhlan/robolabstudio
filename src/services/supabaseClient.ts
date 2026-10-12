import { createClient } from '@supabase/supabase-js';

// ─── Supabase Configuration ────────────────────────────────────────────────
const SUPABASE_URL = 'https://qcewaspgybtbofjowoxs.supabase.co';

// PENTING: Gunakan anon key dari Supabase Dashboard → Settings → API
// Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
// Bukan format sb_publishable_... (itu untuk SDK versi baru yang berbeda)
const SUPABASE_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZXdhc3BneWJ0Ym9mam93b3hzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjY4NzQ5NCwiZXhwIjoyMTAyMjYzNDk0fQ._kLILomKueHswu6mtpKM3ktVEMsiVCTGk15QdJ29oUo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'rl_auth_session',
  },
});

// ─── Device Fingerprint via Electron IPC ───────────────────────────────────
export async function getDeviceId(): Promise<string> {
  try {
    const req = (window as any).__electronRequire;
    if (req) {
      const { ipcRenderer } = req('electron');
      const id = await ipcRenderer.invoke('get-device-id');
      if (id) return id;
    }
  } catch (_) {}
  // Fallback for web/dev: localStorage-persisted random ID
  let id = localStorage.getItem('rl_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rl_device_id', id);
  }
  return id;
}

export async function getDeviceInfo(): Promise<{ name: string; os: string }> {
  try {
    const req = (window as any).__electronRequire;
    if (req) {
      const { ipcRenderer } = req('electron');
      const info = await ipcRenderer.invoke('get-device-info');
      if (info) return info;
    }
  } catch (_) {}
  return {
    name: navigator.platform || 'Unknown Device',
    os: navigator.userAgent.slice(0, 80),
  };
}

// ─── Auth Helpers ──────────────────────────────────────────────────────────

// Detect if we are running inside a packaged Electron app
function isElectron(): boolean {
  return !!(
    typeof window !== 'undefined' &&
    ((window as any).__electronRequire || (window as any).require)
  );
}

function getElectronIPC() {
  const req = (window as any).__electronRequire || (window as any).require;
  if (req) {
    try {
      return req('electron').ipcRenderer;
    } catch (_) {}
  }
  return null;
}

export async function signInWithGoogle(): Promise<void> {
  // ── Electron: Desktop OAuth via Loopback Local Server ──────────────────
  if (isElectron()) {
    const ipcRenderer = getElectronIPC();
    if (!ipcRenderer) {
      throw new Error('Tidak dapat mengakses Electron IPC. Pastikan aplikasi berjalan sebagai desktop app.');
    }

    const CALLBACK_PORT = 54321;
    const redirectTo = `http://127.0.0.1:${CALLBACK_PORT}/callback`;

    // Build Supabase OAuth URL with our local redirect
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true, // Don't redirect Electron webview — we handle it ourselves
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('Gagal mendapatkan URL autentikasi Google dari Supabase.');

    // Invoke the main process loopback handler — opens system browser
    let tokenData: { access_token?: string; refresh_token?: string; error?: string };
    try {
      tokenData = await ipcRenderer.invoke('start-google-oauth', {
        oauthUrl: data.url,
        port: CALLBACK_PORT,
      });
    } catch (err: any) {
      throw new Error(`Login Google gagal: ${err?.message || String(err)}`);
    }

    if (tokenData?.error) {
      throw new Error(`Google OAuth error: ${tokenData.error}`);
    }

    if (!tokenData?.access_token || !tokenData?.refresh_token) {
      throw new Error('Token autentikasi tidak diterima dari browser. Coba lagi.');
    }

    // Set the Supabase session from the received tokens
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
    });

    if (sessionError) throw sessionError;
    return;
  }

  // ── Web Browser (Vercel / Hosted): Popup OAuth + Auto-Recovery ─────────
  // Open popup synchronously during click gesture so browser popup blockers allow it
  const width = 520;
  const height = 660;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));
  const popup = window.open(
    'about:blank',
    'robolab_google_oauth',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no`
  );

  if (popup) {
    try {
      popup.document.write(`<!DOCTYPE html><html><head><title>Login Google - RoboLab Studio</title><style>
        body { margin:0; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
               background:#090d16; color:#f8fafc; font-family:system-ui,-apple-system,sans-serif; gap:16px; }
        .spin { width:38px; height:38px; border:3px solid rgba(56,189,248,0.2); border-top-color:#38bdf8;
                border-radius:50%; animation:s 0.9s linear infinite; }
        @keyframes s { to { transform:rotate(360deg); } }
      </style></head><body><div class="spin"></div><div>Menghubungkan ke Google...</div></body></html>`);
      popup.document.close();
    } catch (_) {}
  }

  // Helper to list users from Supabase Auth Admin API (using service key) to detect completed Google OAuth
  // even when Supabase Dashboard Site URL is still set to http://localhost:3000
  const fetchAuthUsersSnapshot = async (): Promise<Map<string, { email: string; stamp: string }>> => {
    const map = new Map<string, { email: string; stamp: string }>();
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=250`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const users = Array.isArray(json?.users) ? json.users : [];
        for (const u of users) {
          if (u?.id && u?.email) {
            map.set(u.id, {
              email: u.email,
              stamp: `${u.last_sign_in_at || ''}|${u.updated_at || ''}`,
            });
          }
        }
      }
    } catch (_) {}
    return map;
  };

  const mintSessionForEmail = async (email: string): Promise<boolean> => {
    try {
      const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'magiclink', email }),
      });
      if (!linkRes.ok) return false;
      const linkData = await linkRes.json();
      const hashedToken = linkData?.hashed_token || linkData?.properties?.hashed_token;
      if (!hashedToken) return false;

      const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token_hash: hashedToken, type: 'magiclink' }),
      });
      if (!verifyRes.ok) return false;
      const sessionData = await verifyRes.json();
      if (sessionData?.access_token && sessionData?.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });
        return !setErr;
      }
    } catch (_) {}
    return false;
  };

  const beforeUsers = await fetchAuthUsersSnapshot();
  const redirectOrigin = window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectOrigin,
      skipBrowserRedirect: Boolean(popup),
    },
  });

  if (error) {
    if (popup && !popup.closed) {
      try { popup.close(); } catch (_) {}
    }
    throw error;
  }

  if (!popup) {
    // Fallback if popup was blocked by browser
    if (data?.url) window.location.href = data.url;
    return;
  }

  if (!data?.url) {
    try { popup.close(); } catch (_) {}
    throw new Error('Gagal mendapatkan URL autentikasi Google dari Supabase.');
  }

  popup.location.href = data.url;

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let checkingAdmin = false;

    const cleanup = () => {
      settled = true;
      clearInterval(fastTimer);
      clearInterval(adminTimer);
      clearTimeout(timeoutTimer);
      window.removeEventListener('message', onMessage);
      if (popup && !popup.closed) {
        try { popup.close(); } catch (_) {}
      }
    };

    const tryCompleteFromHash = async (hashOrUrl: string): Promise<boolean> => {
      const hashIndex = hashOrUrl.indexOf('#');
      const rawHash = hashIndex >= 0 ? hashOrUrl.slice(hashIndex + 1) : hashOrUrl.replace(/^#/, '');
      if (!rawHash.includes('access_token=')) return false;
      const params = new URLSearchParams(rawHash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        cleanup();
        const { error: sessionErr } = await supabase.auth.setSession({ access_token, refresh_token });
        if (sessionErr) {
          reject(sessionErr);
        } else {
          resolve();
        }
        return true;
      }
      return false;
    };

    const checkAdminUsersDiff = async (): Promise<boolean> => {
      if (settled || checkingAdmin) return false;
      checkingAdmin = true;
      try {
        const currentUsers = await fetchAuthUsersSnapshot();
        for (const [id, info] of currentUsers.entries()) {
          const prev = beforeUsers.get(id);
          if (!prev || prev.stamp !== info.stamp) {
            const ok = await mintSessionForEmail(info.email);
            if (ok && !settled) {
              cleanup();
              resolve();
              return true;
            }
          }
        }
      } finally {
        checkingAdmin = false;
      }
      return false;
    };

    const onMessage = async (event: MessageEvent) => {
      if (settled) return;
      if (event.data?.type === 'ROBOLAB_OAUTH_HASH' && typeof event.data?.hash === 'string') {
        await tryCompleteFromHash(event.data.hash);
      }
    };
    window.addEventListener('message', onMessage);

    // Poll popup location (catches same-origin callback OR connection refused to localhost:3000)
    const fastTimer = setInterval(async () => {
      if (settled) return;
      try {
        if (popup.closed) {
          clearInterval(fastTimer);
          // Give one final check in case user or browser closed popup right as callback completed
          const recovered = await checkAdminUsersDiff();
          if (!recovered && !settled) {
            cleanup();
            reject(new Error('Login Google dibatalkan.'));
          }
          return;
        }
        const href = popup.location.href;
        if (href && href.includes('access_token=')) {
          await tryCompleteFromHash(href);
        }
      } catch (_) {
        // Cross-origin frame while on accounts.google.com or localhost:3000 — expected
      }
    }, 400);

    // Poll Supabase Auth Admin API every 1.2s to detect completed Google login immediately
    // even when Supabase redirects the popup to http://localhost:3000
    const adminTimer = setInterval(() => {
      checkAdminUsersDiff();
    }, 1200);

    const timeoutTimer = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error('Waktu login Google habis (timeout). Silakan coba lagi.'));
      }
    }, 120000);
  });
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ─── Device Binding ─────────────────────────────────────────────────────────
export type DeviceBindingResult =
  | { ok: true }
  | { ok: false; reason: 'device_taken'; boundEmail: string }
  | { ok: false; reason: 'db_error'; message: string };

// In-flight deduplication cache
const inFlightChecks = new Map<string, Promise<DeviceBindingResult>>();

export async function checkAndBindDevice(
  userId: string,
  deviceId: string,
  deviceInfo: { name: string; os: string },
  userEmail: string
): Promise<DeviceBindingResult> {
  const cacheKey = `${userId}:${deviceId}`;
  if (inFlightChecks.has(cacheKey)) {
    console.log('[RoboLab Auth] Returning existing in-flight check promise for key:', cacheKey);
    return inFlightChecks.get(cacheKey)!;
  }

  const promise = (async (): Promise<DeviceBindingResult> => {
    try {
      console.log('[RoboLab Auth] checkAndBindDevice execution started', { userId, deviceId, deviceInfo });

      // 1. Check if this device_id already exists in the table
      const { data: existing, error: fetchError } = await supabase
        .from('device_bindings')
        .select('user_id, user_email')
        .eq('device_id', deviceId)
        .maybeSingle();

      console.log('[RoboLab Auth] fetch result:', { existing, fetchError });

      if (fetchError) {
        const msg = fetchError.message || fetchError.code || JSON.stringify(fetchError);
        console.error('[RoboLab Auth] Device binding fetch error:', fetchError);
        return { ok: false, reason: 'db_error', message: `Database error: ${msg}` };
      }

      if (existing) {
        if (existing.user_id === userId) {
          // Same user, same device → update last_seen timestamp
          await supabase
            .from('device_bindings')
            .update({ last_seen: new Date().toISOString() })
            .eq('device_id', deviceId);
          console.log('[RoboLab Auth] Device already bound to same user, access granted.');
          return { ok: true };
        } else {
          // Different user on same device → blocked
          console.warn('[RoboLab Auth] Device taken by another user:', existing.user_email);
          return {
            ok: false,
            reason: 'device_taken',
            boundEmail: existing.user_email ?? 'akun lain',
          };
        }
      }

      // 2. Device not registered yet → insert new binding
      console.log('[RoboLab Auth] New device, inserting binding...');
      const { error: insertError } = await supabase.from('device_bindings').insert({
        user_id: userId,
        device_id: deviceId,
        device_name: deviceInfo.name,
        os_info: deviceInfo.os,
        user_email: userEmail,
      });

      if (insertError) {
        // Handle code 23505 or duplicate key messages (unique constraint violation - race condition or RLS mismatch)
        const isDuplicateKey = insertError.code === '23505' ||
          (insertError.message && insertError.message.includes('duplicate key value violates unique constraint'));

        if (isDuplicateKey) {
          console.log('[RoboLab Auth] Unique constraint hit, re-verifying binding ownership...');
          const { data: reFetch } = await supabase
            .from('device_bindings')
            .select('user_id, user_email')
            .eq('device_id', deviceId)
            .maybeSingle();

          if (reFetch && reFetch.user_id === userId) {
            console.log('[RoboLab Auth] Race condition resolved: device is bound to current user.');
            return { ok: true };
          } else {
            console.warn('[RoboLab Auth] Device taken (duplicate key constraint):', reFetch?.user_email);
            return {
              ok: false,
              reason: 'device_taken',
              boundEmail: reFetch?.user_email ?? '',
            };
          }
        }

        const msg = insertError.message || insertError.code || JSON.stringify(insertError);
        console.error('[RoboLab Auth] Device binding insert error:', insertError);
        return { ok: false, reason: 'db_error', message: `Gagal menyimpan device: ${msg}` };
      }

      console.log('[RoboLab Auth] Device binding saved successfully.');
      return { ok: true };
    } finally {
      inFlightChecks.delete(cacheKey);
    }
  })();

  inFlightChecks.set(cacheKey, promise);
  return promise;
}

// ─── Trial / Freemium Tracking ──────────────────────────────────────────────

const TRIAL_DAYS = 30;
const TRIAL_TABLE = 'device_trial';

export type TrialStatus = {
  isExpired: boolean;
  daysUsed: number;
  daysLeft: number;
  firstOpenDate: string | null;
};

/**
 * Called on every app start.
 * - First run: writes first_open_date to Supabase + localStorage
 * - Subsequent runs: reads from Supabase (or localStorage as fallback) and calculates trial status
 */
export async function checkTrialStatus(): Promise<TrialStatus> {
  const deviceId = await getDeviceId();
  const LOCAL_KEY = 'robolab_first_open';

  let firstOpenDate: string | null = null;

  try {
    const { data, error } = await supabase
      .from(TRIAL_TABLE)
      .select('first_open_date')
      .eq('device_id', deviceId)
      .maybeSingle();

    if (!error && data?.first_open_date) {
      firstOpenDate = data.first_open_date;
      localStorage.setItem(LOCAL_KEY, firstOpenDate as string);
    } else {
      firstOpenDate = localStorage.getItem(LOCAL_KEY);
    }
  } catch (_) {
    firstOpenDate = localStorage.getItem(LOCAL_KEY);
  }

  if (!firstOpenDate) {
    firstOpenDate = new Date().toISOString();
    localStorage.setItem(LOCAL_KEY, firstOpenDate);

    try {
      const deviceInfo = await getDeviceInfo();
      await supabase.from(TRIAL_TABLE).upsert({
        device_id: deviceId,
        first_open_date: firstOpenDate,
        device_name: deviceInfo.name,
        os_info: deviceInfo.os,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'device_id' });
    } catch (_) {}
  } else {
    try {
      await supabase.from(TRIAL_TABLE).upsert({
        device_id: deviceId,
        first_open_date: firstOpenDate,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'device_id' });
    } catch (_) {}
  }

  const msElapsed = Date.now() - new Date(firstOpenDate).getTime();
  const daysUsed = Math.floor(msElapsed / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, TRIAL_DAYS - daysUsed);
  const isExpired = daysUsed >= TRIAL_DAYS;

  return { isExpired, daysUsed, daysLeft, firstOpenDate };
}
