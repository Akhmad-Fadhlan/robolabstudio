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

  // ── Web Browser Fallback: Standard OAuth redirect ───────────────────────
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.href,
      skipBrowserRedirect: false,
    },
  });
  if (error) throw error;
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
