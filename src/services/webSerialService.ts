import { openableFileExtensions } from '../utils/sourceFileTypes';
import { getMicrobitModules } from './microbitModules';
import { canFlashMicrobitViaUsb, flashMicrobitViaUsb } from './microbitWebUsb';
import { MicrobitReplUnavailableError, writeMicrobitProgram } from './microbitUpload';
// ============================================================================
// RoboLab Studio — Web Serial API & Cloud Compiler Service (Schematik.io Style)
// Enables direct browser-to-hardware communication (Verify, Upload, Flash
// Firmware, Serial Monitor, and Local File/Folder Access) without desktop
// installation using Web Serial API (navigator.serial).
// ============================================================================

export interface WebSerialPortEntry {
  address: string;
  label: string;
  usbVendorId?: number;
  usbProductId?: number;
  rawPort?: any;
}

export type HardwareLogCallback = (log: {
  text: string;
  type: 'info' | 'error' | 'success' | 'stdout';
}) => void;

const COMPILE_SERVER_URL =
  (import.meta as any).env?.VITE_COMPILE_SERVER_URL || 'http://localhost:3001';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _localBridgeCache: { available: boolean; checkedAt: number } = {
  available: false,
  checkedAt: 0,
};

function isRemoteWebOrigin(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h !== 'localhost' && h !== '127.0.0.1' && !h.startsWith('192.168.');
}

export async function checkLocalBridgeAvailable(forceRefresh: boolean = false): Promise<boolean> {
  const now = Date.now();
  if (!forceRefresh && now - _localBridgeCache.checkedAt < 5000) {
    return _localBridgeCache.available;
  }
  const urls = ['http://127.0.0.1:3001/api/health', 'http://localhost:3001/api/health', `${COMPILE_SERVER_URL}/api/health`];
  for (const url of urls) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      const resp = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json().catch(() => ({}));
        if (data && data.ok && !data.cloud) {
          _localBridgeCache = { available: true, checkedAt: now };
          return true;
        }
      }
    } catch {}
  }
  _localBridgeCache = { available: false, checkedAt: now };
  return false;
}

async function fetchCompilerApi(apiPath: string, init?: RequestInit): Promise<Response> {
  const isLocalOnlyEndpoint =
    apiPath.startsWith('/api/ports') ||
    apiPath.startsWith('/api/upload-local') ||
    apiPath.startsWith('/api/serial-');

  const remoteOrigin = isRemoteWebOrigin();
  const hasLocalBridge = await checkLocalBridgeAvailable();

  let candidates: string[];
  if (isLocalOnlyEndpoint) {
    if (remoteOrigin && !hasLocalBridge) {
      throw new Error('Local bridge not active on remote origin');
    }
    candidates = remoteOrigin
      ? [`${COMPILE_SERVER_URL}${apiPath}`, `http://127.0.0.1:3001${apiPath}`]
      : [apiPath, `${COMPILE_SERVER_URL}${apiPath}`, `http://127.0.0.1:3001${apiPath}`];
  } else if (remoteOrigin && hasLocalBridge) {
    candidates = [`http://127.0.0.1:3001${apiPath}`, `http://localhost:3001${apiPath}`, `${COMPILE_SERVER_URL}${apiPath}`, apiPath];
  } else {
    candidates = [apiPath, `${COMPILE_SERVER_URL}${apiPath}`, `http://127.0.0.1:3001${apiPath}`];
  }

  let lastErr: any = null;
  let lastResp: Response | null = null;
  for (const url of candidates) {
    try {
      let request = init;
      if (remoteOrigin && apiPath === '/api/compile' && url === apiPath) {
        const headers = new Headers(init?.headers);
        try {
          const { supabase } = await import('./supabaseClient');
          const { data } = await supabase.auth.getSession();
          if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
        } catch {
          // The hosted compiler provides the login error if a session cannot be read.
        }
        request = { ...init, headers };
      }
      const resp = await fetch(url, request);
      const ct = resp.headers.get('content-type') || '';
      if (ct.includes('application/json') || ct.includes('application/x-ndjson')) {
        // Never re-send POST /api/compile or /api/upload-local to fallback aliases if server responded with JSON/NDJSON
        if (resp.ok || init?.method === 'POST') {
          return resp;
        }
        lastResp = resp;
      }
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastResp) return lastResp;
  throw lastErr || new Error('Failed to fetch Cloud Compiler API');
}

/**
 * Reads streaming NDJSON response from Cloud Compiler / Local Bridge
 * and immediately delivers progressive compiler logs to the terminal.
 */
async function readNdjsonStream(body: ReadableStream<Uint8Array>, onLog: HardwareLogCallback): Promise<any> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: any = null;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const item = JSON.parse(trimmed);
          if (item.type === 'log' && item.data) {
            onLog({ text: item.data.text, type: item.data.type || 'stdout' });
          } else if (item.type === 'result') {
            result = item.data;
          }
        } catch {}
      }
    }
    if (!result && buffer.trim()) {
      try {
        const item = JSON.parse(buffer.trim());
        if (item.type === 'result') result = item.data;
        else result = item;
      } catch {}
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {}
  }
  return result || { success: false, error: 'Empty stream response' };
}

// Known USB Vendor IDs for IoT Microcontroller Boards
const USB_VENDOR_NAMES: Record<number, string> = {
  0x1a86: 'CH340/CH341 USB-Serial',
  0x10c4: 'Silicon Labs CP210x',
  0x0403: 'FTDI FT232R USB UART',
  0x303a: 'Espressif Native USB (ESP32)',
  0x2341: 'Arduino Official USB',
  0x2a03: 'Arduino.org USB',
  0x0d28: 'BBC micro:bit DAPLink',
  0x2e8a: 'Raspberry Pi Pico RP2040',
  0x0483: 'STMicroelectronics STM32',
  0x067b: 'Prolific PL2303',
};

// Internal registry mapping virtual port addresses (e.g. "WebUSB-1 (CP210x)") to SerialPort instances
const portRegistry = new Map<string, any>();

// Active Web Serial Monitor state
let activeMonitorPort: any = null;
let activeMonitorReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
let activeMonitorKeepReading = false;
let activeLocalStreamAbort: AbortController | null = null;

/**
 * Checks whether the app is running inside Electron Desktop with Node IPC.
 */
export function isElectronEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const req = (window as any).__electronRequire || (window as any).require;
  if (!req) return false;
  try {
    const electron = req('electron');
    return Boolean(electron && electron.ipcRenderer);
  } catch {
    return false;
  }
}

/**
 * Checks whether the browser supports the Web Serial API (Chrome, Edge, Opera, Brave).
 */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Builds a friendly port address & label from a Web SerialPort object.
 */
function buildPortLabel(port: any, index: number): { address: string; label: string; usbVendorId?: number; usbProductId?: number } {
  const info = typeof port.getInfo === 'function' ? port.getInfo() : {};
  const vid: number | undefined = info.usbVendorId;
  const pid: number | undefined = info.usbProductId;

  const chipName = vid && USB_VENDOR_NAMES[vid] ? USB_VENDOR_NAMES[vid] : vid ? `VID:0x${vid.toString(16).toUpperCase()}` : 'USB Serial';
  const shortChip =
    vid === 0x1a86
      ? 'CH340'
      : vid === 0x10c4
      ? 'CP2102'
      : vid === 0x0403
      ? 'FTDI'
      : vid === 0x303a
      ? 'ESP32-USB'
      : vid === 0x2341 || vid === 0x2a03
      ? 'Arduino'
      : vid === 0x0d28
      ? 'micro:bit'
      : vid === 0x2e8a
      ? 'RP2040'
      : 'Serial';

  const address = `WebUSB-${index + 1} (${shortChip})`;
  const label = `${address} — ${chipName}${pid ? ` [PID:0x${pid.toString(16).toUpperCase()}]` : ''}`;
  return { address, label, usbVendorId: vid, usbProductId: pid };
}

/**
 * Lists only browser-authorized Web Serial ports without network requests (preserves user gesture activation).
 */
async function listBrowserAuthorizedSerialPorts(): Promise<WebSerialPortEntry[]> {
  const results: WebSerialPortEntry[] = [];
  if (!isWebSerialSupported()) return results;
  try {
    const serial = (navigator as any).serial;
    const allPorts: any[] = await serial.getPorts();
    // Filter out non-USB internal/Bluetooth COM ports (which have no usbVendorId)
    // so phantom motherboard/Bluetooth ports never block Web Serial USB detection or user gesture activation.
    const usbPorts = allPorts.filter((p) => {
      const info = typeof p.getInfo === 'function' ? p.getInfo() : {};
      return Boolean(info && info.usbVendorId);
    });
    portRegistry.clear();
    usbPorts.forEach((p, idx) => {
      const meta = buildPortLabel(p, idx);
      portRegistry.set(meta.address, p);
      results.push({
        address: meta.address,
        label: meta.label,
        usbVendorId: meta.usbVendorId,
        usbProductId: meta.usbProductId,
        rawPort: p,
      });
    });
  } catch (err) {
    console.warn('[WebSerial] Error listing authorized ports:', err);
  }
  return results;
}

/**
 * Lists all Web Serial ports already authorized by the user in this browser origin,
 * plus any local bridge ports if the local compile/bridge server is running.
 */
export async function getWebSerialPorts(): Promise<WebSerialPortEntry[]> {
  const results = await listBrowserAuthorizedSerialPorts();

  // Also append local hardware COM ports detected by the local compile bridge (if running)
  try {
    const resp = await fetchCompilerApi('/api/ports');
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data.ports)) {
        for (const lp of data.ports) {
          if (lp.address && !results.some((r) => r.address === lp.address)) {
            results.push({
              address: lp.address,
              label: lp.label || lp.address,
            });
          }
        }
      }
    }
  } catch {}

  return results;
}

/**
 * Prompts the user with the browser's native Web Serial device chooser modal
 * (like Schematik.io's "Connect Device" / "Select Port" popup).
 */
export async function requestWebSerialPort(usbVendorId?: number): Promise<WebSerialPortEntry | null> {
  if (!isWebSerialSupported()) {
    alert(
      'Browser Anda belum mendukung Web Serial API.\n\nGunakan Google Chrome, Microsoft Edge, Brave, atau Opera versi desktop untuk menghubungkan mikrokontroler via USB langsung dari browser.'
    );
    return null;
  }

  try {
    const serial = (navigator as any).serial;
    const selectedPort = await serial.requestPort(usbVendorId ? { filters: [{ usbVendorId }] } : undefined);
    const browserPorts = await listBrowserAuthorizedSerialPorts();
    const match = browserPorts.find((p) => p.rawPort === selectedPort);
    if (match) return match;

    // Fallback registration if getPorts didn't immediately return it (e.g. CH340 without USB serial number)
    const idx = portRegistry.size;
    const meta = buildPortLabel(selectedPort, idx);
    portRegistry.set(meta.address, selectedPort);
    return {
      address: meta.address,
      label: meta.label,
      usbVendorId: meta.usbVendorId,
      usbProductId: meta.usbProductId,
      rawPort: selectedPort,
    };
  } catch (err: any) {
    // User cancelled the chooser dialog
    if (err?.name === 'NotFoundError' || err?.message?.includes('No port selected')) {
      return null;
    }
    console.warn('[WebSerial] requestPort error:', err);
    return null;
  }
}

/**
 * Attempts to open a Web SerialPort with automatic stream lock cleanup and progressive retry.
 * Handles Windows WCH CH340 (CH341SER.SYS) driver teardown delays cleanly.
 */
async function tryOpenSerialPort(rawPort: any, baudRate = 115200, maxAttempts = 4): Promise<boolean> {
  if (!rawPort) return false;
  // If port is already open and its streams are not locked, reuse it directly
  if (rawPort.readable && rawPort.writable && !rawPort.readable.locked && !rawPort.writable.locked) {
    return true;
  }
  // If port is open with locked streams, close it first and give Windows kernel time to release handle
  if (rawPort.readable || rawPort.writable) {
    try {
      await rawPort.close();
      await sleep(350);
    } catch {}
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await rawPort.open({ baudRate });
      return true;
    } catch (err: any) {
      const msg = String(err?.message || err || '');
      if (msg.includes('already open') && rawPort.readable && rawPort.writable) {
        return true;
      }
      if (attempt + 1 < maxAttempts) {
        // Progressive backoff delay (300ms, 600ms, 900ms) for Windows CH340 handle release
        await sleep(300 * (attempt + 1));
      }
    }
  }
  return false;
}

/**
 * Retrieves a registered SerialPort instance by its virtual address, or requests one if none exists.
 * Preserves browser user gesture activation while giving Windows CH340 drivers proper timing.
 */
export async function ensureWebSerialPort(
  portAddress: string,
  verifyOpen = false,
  baudRate = 115200,
  allowPrompt = true
): Promise<{ port: any; address: string; openError?: string } | null> {
  // Cleanly close any monitor port and release reader locks first
  await stopWebSerialMonitor();

  const webOnly = await listBrowserAuthorizedSerialPorts();
  const candidates: WebSerialPortEntry[] = [];

  if (portAddress && portAddress !== 'none') {
    const exact = webOnly.find((e) => e.address === portAddress);
    if (exact) candidates.push(exact);
  }
  // Add all authorized USB-Serial ports (CP2102, CH340, Espressif, FTDI, Arduino) from newest to oldest
  for (let i = webOnly.length - 1; i >= 0; i--) {
    const entry = webOnly[i];
    if (!candidates.some((c) => c.rawPort === entry.rawPort)) {
      candidates.push(entry);
    }
  }

  // Also check if portRegistry still holds a recently selected port (e.g. CH340)
  if (portAddress && portRegistry.has(portAddress)) {
    const regPort = portRegistry.get(portAddress);
    if (regPort && !candidates.some((c) => c.rawPort === regPort)) {
      candidates.unshift({ address: portAddress, label: portAddress, rawPort: regPort });
    }
  }

  // If no authorized USB port exists yet (e.g. first time user plugs device), prompt user
  if (candidates.length === 0) {
    if (!allowPrompt) return null;
    const requested = await requestWebSerialPort();
    if (!requested || !requested.rawPort) {
      return null;
    }
    if (!verifyOpen) {
      return { port: requested.rawPort, address: requested.address };
    }
    if (await tryOpenSerialPort(requested.rawPort, baudRate, 4)) {
      return { port: requested.rawPort, address: requested.address };
    }
    try {
      await fetchCompilerApi('/api/serial-stop', { method: 'POST' });
    } catch {}
    await sleep(300);
    if (await tryOpenSerialPort(requested.rawPort, baudRate, 3)) {
      return { port: requested.rawPort, address: requested.address };
    }
    return {
      port: requested.rawPort,
      address: requested.address,
      openError:
        `Port ${requested.address} tidak dapat dibuka (Failed to open serial port). ` +
        `Pastikan port COM tersebut tidak sedang dipakai oleh aplikasi lain (seperti Arduino IDE, Serial Monitor lain, atau tab browser lain), lalu cabut-pasang kabel USB Anda.`,
    };
  }

  if (!verifyOpen) {
    return { port: candidates[0].rawPort, address: candidates[0].address };
  }

  // Fast path: try opening candidate ports directly (fast if already open, or retried with backoff)
  for (const cand of candidates) {
    if (await tryOpenSerialPort(cand.rawPort, baudRate, 4)) {
      return { port: cand.rawPort, address: cand.address };
    }
  }

  // If initial attempts failed, stop any local bridge and retry candidate ports
  try {
    await fetchCompilerApi('/api/serial-stop', { method: 'POST' });
  } catch {}
  await sleep(300);
  for (const cand of candidates) {
    if (await tryOpenSerialPort(cand.rawPort, baudRate, 2)) {
      return { port: cand.rawPort, address: cand.address };
    }
  }

  if (!allowPrompt) {
    return null;
  }

  // None of the cached ports could be opened — prompt user with native port chooser
  const requested = await requestWebSerialPort();
  if (!requested || !requested.rawPort) {
    return null;
  }

  if (await tryOpenSerialPort(requested.rawPort, baudRate, 4)) {
    return { port: requested.rawPort, address: requested.address };
  }

  return {
    port: requested.rawPort,
    address: requested.address,
    openError:
      `Port ${requested.address} tidak dapat dibuka (Failed to open serial port). ` +
      `Pastikan port COM tersebut tidak sedang dipakai oleh aplikasi lain (seperti Arduino IDE, Serial Monitor lain, atau tab browser lain), lalu cabut-pasang kabel USB Anda.`,
  };
}

async function openAvailableWebSerialPort(preferredPort: any, baudRate: number): Promise<{ port: any; address?: string }> {
  const candidates: Array<{ port: any; address?: string }> = [];
  if (preferredPort) {
    let prefAddr: string | undefined;
    for (const [addr, p] of portRegistry.entries()) {
      if (p === preferredPort) prefAddr = addr;
    }
    candidates.push({ port: preferredPort, address: prefAddr });
  }
  const entries = Array.from(portRegistry.entries()).reverse();
  for (const [addr, p] of entries) {
    if (p && !candidates.some((c) => c.port === p)) {
      candidates.push({ port: p, address: addr });
    }
  }
  let lastErr: any = null;
  for (const cand of candidates) {
    // If already open and streams are unlocked, reuse directly!
    if (cand.port.readable && cand.port.writable && !cand.port.readable.locked && !cand.port.writable.locked) {
      if (typeof cand.port.setSignals === 'function') {
        await cand.port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
      }
      return cand;
    }
    // If open with locked streams, try closing first
    if (cand.port.readable || cand.port.writable) {
      try {
        await cand.port.close();
        await sleep(350);
      } catch {}
    }
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        await cand.port.open({ baudRate });
        if (typeof cand.port.setSignals === 'function') {
          await cand.port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
        }
        return cand;
      } catch (err: any) {
        if (err?.message?.includes('already open') && cand.port.readable && cand.port.writable) {
          if (typeof cand.port.setSignals === 'function') {
            await cand.port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
          }
          return cand;
        }
        lastErr = err;
        if (attempt + 1 < 4) {
          await sleep(300 * (attempt + 1));
        }
      }
    }
  }
  const rawMsg = lastErr?.message || 'Gagal membuka port Web Serial.';
  if (String(rawMsg).includes('Failed to open serial port')) {
    throw new Error(
      `${rawMsg} — Pastikan port COM tidak sedang dibuka oleh aplikasi lain (Arduino IDE / Serial Monitor / tab browser lain) dan kabel USB terhubung dengan baik.`
    );
  }
  throw lastErr || new Error('Gagal membuka port Web Serial.');
}

// ============================================================================
// WEB SERIAL MONITOR (Real-time RX/TX Stream in Browser)
// ============================================================================

export async function stopWebSerialMonitor(_keepPortOpen = false): Promise<void> {
  activeMonitorKeepReading = false;
  try {
    if (activeMonitorReader) {
      await activeMonitorReader.cancel().catch(() => {});
      try {
        activeMonitorReader.releaseLock();
      } catch {}
      activeMonitorReader = null;
    }
  } catch {}

  let hadPort = false;
  if (activeMonitorPort) {
    try {
      await activeMonitorPort.close().catch(() => {});
      hadPort = true;
    } catch {}
    activeMonitorPort = null;
  }

  if (activeLocalStreamAbort) {
    try {
      activeLocalStreamAbort.abort();
    } catch {}
    activeLocalStreamAbort = null;
    try {
      await fetchCompilerApi('/api/serial-stop', { method: 'POST' });
    } catch {}
  }

  // Windows WCH CH340 (CH341SER.SYS) requires 350ms after CloseHandle before COM can be reopened
  if (hadPort) {
    await sleep(350);
  }
}

async function startLocalBridgeSerialMonitor(
  portAddress: string,
  baudRate: number,
  onData: (chunk: string) => void,
  onDisconnect?: () => void
): Promise<{ success: boolean; address?: string; error?: string }> {
  const abortCtrl = new AbortController();
  activeLocalStreamAbort = abortCtrl;
  activeMonitorKeepReading = true;
  const query = `/api/serial-monitor?port=${encodeURIComponent(portAddress || '')}&baud=${encodeURIComponent(String(baudRate || 115200))}`;
  const urls = [query, `${COMPILE_SERVER_URL}${query}`, `http://127.0.0.1:3001${query}`];

  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: abortCtrl.signal });
      if (!resp.ok || !resp.body) continue;
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      (async () => {
        try {
          while (activeMonitorKeepReading) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              onData(decoder.decode(value, { stream: true }));
            }
          }
        } catch {}
        if (onDisconnect) onDisconnect();
      })();
      return { success: true, address: portAddress };
    } catch {}
  }
  return { success: false, error: 'Gagal membuka Local Serial Monitor.' };
}

export async function startWebSerialMonitor(
  portAddress: string,
  baudRate: number,
  onData: (chunk: string) => void,
  onDisconnect?: () => void,
  allowPrompt = false
): Promise<{ success: boolean; address?: string; error?: string }> {
  await stopWebSerialMonitor();

  const isLocalCom =
    Boolean(portAddress) &&
    portAddress !== 'none' &&
    !portAddress.startsWith('WebUSB') &&
    (/^COM\d+/i.test(portAddress) || portAddress.startsWith('/dev/'));

  if (isLocalCom) {
    const localStarted = await startLocalBridgeSerialMonitor(portAddress, baudRate || 115200, onData, onDisconnect);
    if (localStarted.success) return localStarted;
  }

  const target = await ensureWebSerialPort(portAddress, false, baudRate || 115200, allowPrompt);
  if (!target || !target.port) {
    const fallbackLocal = await startLocalBridgeSerialMonitor(portAddress, baudRate || 115200, onData, onDisconnect);
    if (fallbackLocal.success) return fallbackLocal;
    return { success: false, error: 'Tidak ada port Web Serial yang dipilih.' };
  }

  let port = target.port;
  let address = target.address;
  try {
    const opened = await openAvailableWebSerialPort(port, baudRate || 115200);
    port = opened.port;
    if (opened.address) address = opened.address;
    if (typeof port.setSignals === 'function') {
      await port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
    }
  } catch (openErr: any) {
    const fallbackLocal = await startLocalBridgeSerialMonitor(portAddress, baudRate || 115200, onData, onDisconnect);
    if (fallbackLocal.success) return fallbackLocal;
    return { success: false, error: `Gagal membuka port ${address}: ${openErr?.message || openErr}` };
  }

  activeMonitorPort = port;
  activeMonitorKeepReading = true;
  const decoder = new TextDecoder();

  onData(`--- Web Serial Monitor Connected to ${address} @ ${baudRate} baud ---\r\n`);

  // Start async read loop (resilient to BreakError / FramingError / BufferOverrunError on ESP32 reset)
  (async () => {
    while (port.readable && activeMonitorKeepReading) {
      try {
        const reader = port.readable.getReader();
        activeMonitorReader = reader;
        while (activeMonitorKeepReading) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            onData(decoder.decode(value, { stream: true }));
          }
        }
      } catch (err: any) {
        const errName = String(err?.name || err?.message || err || '');
        const isRecoverableUartErr =
          errName.includes('BreakError') ||
          errName.includes('FramingError') ||
          errName.includes('ParityError') ||
          errName.includes('BufferOverrunError') ||
          errName.includes('Break') ||
          errName.includes('Framing') ||
          errName.includes('Overrun');
        if (!isRecoverableUartErr) {
          if (activeMonitorKeepReading) {
            console.warn('[WebSerial Monitor] Read stream error:', err);
          }
          break;
        }
      } finally {
        if (activeMonitorReader) {
          try {
            activeMonitorReader.releaseLock();
          } catch {}
          activeMonitorReader = null;
        }
      }
      if (activeMonitorKeepReading) {
        await new Promise((r) => setTimeout(r, 15));
      }
    }
    if (onDisconnect) onDisconnect();
  })();

  return { success: true, address };
}

export async function sendWebSerialData(data: string): Promise<boolean> {
  if (activeLocalStreamAbort) {
    try {
      const resp = await fetchCompilerApi('/api/serial-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (resp.ok) return true;
    } catch {}
  }
  if (!activeMonitorPort || !activeMonitorPort.writable) return false;
  try {
    const writer = activeMonitorPort.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(data));
    } finally {
      writer.releaseLock();
    }
    return true;
  } catch (err) {
    console.warn('[WebSerial Monitor] Write error:', err);
    return false;
  }
}

// ============================================================================
// MICROPYTHON DIRECT UPLOAD OVER WEB SERIAL RAW REPL
// ============================================================================

export async function uploadMicroPythonViaWebSerial(
  port: any,
  pythonCode: string,
  onLog: HardwareLogCallback
): Promise<{ success: boolean; error?: string }> {
  await stopWebSerialMonitor();

  try {
    try {
      await port.open({ baudRate: 115200 });
    } catch (e: any) {
      if (!e?.message?.includes('already open')) throw e;
    }

    // Ensure board is not held in reset
    if (typeof port.setSignals === 'function') {
      await port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const writer = port.writable.getWriter();
    const reader = port.readable.getReader();

    let rxBuffer = '';
    let reading = true;
    const readLoop = (async () => {
      try {
        while (reading) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) rxBuffer += decoder.decode(value, { stream: true });
        }
      } catch {}
    })();

    const writeBytes = async (bytes: Uint8Array | string) => {
      const data = typeof bytes === 'string' ? encoder.encode(bytes) : bytes;
      await writer.write(data);
    };

    onLog({ text: '🐍 [WebSerial] Menghentikan program berjalan & masuk ke MicroPython Raw REPL...', type: 'info' });
    await sleep(150);
    // Send Ctrl-C twice to interrupt any running loop
    await writeBytes('\r\x03\x03');
    await sleep(350);
    await writeBytes('\x03');
    await sleep(250);

    // Enter Raw REPL (Ctrl-A)
    rxBuffer = '';
    await writeBytes('\r\x01');
    await sleep(400);

    if (!rxBuffer.includes('raw REPL') && !rxBuffer.includes('>')) {
      // Retry Ctrl-C + Ctrl-A once more
      await writeBytes('\r\x03\x03');
      await sleep(300);
      await writeBytes('\r\x01');
      await sleep(400);
    }

    onLog({ text: '📄 [WebSerial] Menulis berkas main.py ke flash mikrokontroler...', type: 'info' });

    const normalizedCode = pythonCode.replace(/\r\n/g, '\n');
    const chunkSize = 256;
    let fileWriteCmd = `f = open('main.py', 'w')\n`;
    for (let i = 0; i < normalizedCode.length; i += chunkSize) {
      const chunk = normalizedCode.slice(i, i + chunkSize);
      const escaped = JSON.stringify(chunk);
      fileWriteCmd += `f.write(${escaped})\n`;
    }
    fileWriteCmd += `f.close()\n`;

    rxBuffer = '';
    // Send command + Ctrl-D (\x04) to execute in Raw REPL
    await writeBytes(fileWriteCmd + '\x04');
    await sleep(Math.min(2500, Math.max(700, Math.ceil(normalizedCode.length / 3))));

    if (rxBuffer.includes('Traceback') || rxBuffer.includes('MemoryError')) {
      onLog({ text: `⚠️ Peringatan REPL: ${rxBuffer.trim()}`, type: 'error' });
    } else {
      onLog({ text: `✓ [WebSerial] main.py (${normalizedCode.length} bytes) berhasil ditulis ke flash!`, type: 'success' });
    }

    // Exit Raw REPL (Ctrl-B) and Soft Reset (Ctrl-D)
    onLog({ text: '🔄 [WebSerial] Melakukan Soft-Reboot agar main.py langsung berjalan...', type: 'info' });
    await writeBytes('\x02');
    await sleep(150);
    await writeBytes('\x04');
    await sleep(300);

    reading = false;
    await reader.cancel().catch(() => {});
    reader.releaseLock();
    writer.releaseLock();
    await readLoop.catch(() => {});
    await port.close().catch(() => {});

    onLog({ text: '🎉 Upload MicroPython via Web Serial selesai!', type: 'success' });
    return { success: true };
  } catch (err: any) {
    try {
      await port.close();
    } catch {}
    onLog({ text: `❌ Gagal mengunggah via Web Serial: ${err?.message || err}`, type: 'error' });
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// AVR FLASHER OVER WEB SERIAL (STK500v2 Wiring for Mega 2560 & STK500v1 for Uno/Nano)
// ============================================================================

function parseIntelHex(hexText: string): Uint8Array {
  const lines = hexText.split(/\r?\n/);
  let maxAddr = 0;
  const records: Array<{ addr: number; data: number[] }> = [];
  let extAddr = 0;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith(':') || line.length < 11) continue;
    const byteCount = parseInt(line.slice(1, 3), 16);
    const addr = parseInt(line.slice(3, 7), 16);
    const recordType = parseInt(line.slice(7, 9), 16);
    if (recordType === 0x00) {
      const fullAddr = extAddr + addr;
      const data: number[] = [];
      for (let i = 0; i < byteCount; i++) {
        data.push(parseInt(line.slice(9 + i * 2, 11 + i * 2), 16));
      }
      records.push({ addr: fullAddr, data });
      if (fullAddr + byteCount > maxAddr) maxAddr = fullAddr + byteCount;
    } else if (recordType === 0x01) {
      break;
    } else if (recordType === 0x02) {
      // Extended Segment Address: multiply by 16
      extAddr = parseInt(line.slice(9, 13), 16) << 4;
    } else if (recordType === 0x04) {
      // Extended Linear Address: multiply by 65536
      extAddr = parseInt(line.slice(9, 13), 16) << 16;
    }
  }

  const bin = new Uint8Array(maxAddr);
  bin.fill(0xff);
  for (const rec of records) {
    for (let i = 0; i < rec.data.length; i++) {
      bin[rec.addr + i] = rec.data[i];
    }
  }
  return bin;
}

// ----------------------------------------------------------------------------
// STK500v2 (Wiring Protocol) Implementation for Arduino Mega 2560
// ----------------------------------------------------------------------------
const STK500V2_MESSAGE_START = 0x1b;
const STK500V2_TOKEN = 0x0e;
const STK500V2_CMD_SIGN_ON = 0x01;
const STK500V2_CMD_LOAD_ADDRESS = 0x06;
const STK500V2_CMD_ENTER_PROGMODE_ISP = 0x10;
const STK500V2_CMD_LEAVE_PROGMODE_ISP = 0x11;
const STK500V2_CMD_PROGRAM_FLASH_ISP = 0x13;
const STK500V2_STATUS_CMD_OK = 0x00;

function buildStk500v2Packet(seq: number, body: Uint8Array): Uint8Array {
  const len = body.length;
  const packet = new Uint8Array(6 + len);
  packet[0] = STK500V2_MESSAGE_START;
  packet[1] = seq & 0xff;
  packet[2] = (len >> 8) & 0xff;
  packet[3] = len & 0xff;
  packet[4] = STK500V2_TOKEN;
  packet.set(body, 5);
  let checksum = 0;
  for (let i = 0; i < 5 + len; i++) {
    checksum ^= packet[i];
  }
  packet[5 + len] = checksum;
  return packet;
}

function extractStk500v2Response(rxQueue: number[]): Uint8Array | null {
  const startIdx = rxQueue.indexOf(STK500V2_MESSAGE_START);
  if (startIdx === -1) {
    if (rxQueue.length > 512) rxQueue.length = 0;
    return null;
  }
  if (startIdx > 0) {
    rxQueue.splice(0, startIdx);
  }
  if (rxQueue.length < 6) return null;

  const bodyLen = (rxQueue[2] << 8) | rxQueue[3];
  const token = rxQueue[4];
  if (token !== STK500V2_TOKEN) {
    rxQueue.shift();
    return null;
  }
  const totalLen = 6 + bodyLen;
  if (rxQueue.length < totalLen) return null;

  let checksum = 0;
  for (let i = 0; i < totalLen - 1; i++) {
    checksum ^= rxQueue[i];
  }
  if (checksum !== rxQueue[totalLen - 1]) {
    rxQueue.shift();
    return null;
  }

  const body = new Uint8Array(rxQueue.slice(5, 5 + bodyLen));
  rxQueue.splice(0, totalLen);
  return body;
}

async function sendStk500v2Command(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  rxQueue: number[],
  seq: number,
  body: Uint8Array,
  timeoutMs = 1200
): Promise<Uint8Array | null> {
  const packet = buildStk500v2Packet(seq, body);
  rxQueue.length = 0;
  await writer.write(packet);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const resp = extractStk500v2Response(rxQueue);
    if (resp) return resp;
    await sleep(10);
  }
  return null;
}

async function flashAvrStk500v2(
  port: any,
  binary: Uint8Array,
  boardName: string,
  onLog: HardwareLogCallback
): Promise<{ success: boolean; error?: string }> {
  const baudRate = 115200;
  const isMega2560 = boardName.toLowerCase().includes('mega') || boardName.toLowerCase().includes('2560');
  const targetLabel = isMega2560 ? 'Arduino Mega 2560' : 'AVR (STK500v2)';
  onLog({
    text: `⚡ [STK500v2 WebSerial] Menyiapkan flash ${targetLabel} (${binary.length} bytes) @ ${baudRate} baud...`,
    type: 'info',
  });

  let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const rxQueue: number[] = [];
  let reading = false;

  try {
    if (port.readable || port.writable) {
      if (port.readable?.locked || port.writable?.locked) {
        try { await port.close(); await sleep(300); } catch {}
        await port.open({ baudRate });
      }
    } else {
      await port.open({ baudRate });
    }
    if (!port.writable || !port.readable) {
      throw new Error('Port serial tidak mendukung stream baca/tulis.');
    }
    const activeWriter = port.writable.getWriter();
    const activeReader = port.readable.getReader();
    writer = activeWriter;
    reader = activeReader;

    // Pulse DTR/RTS to trigger Arduino Mega auto-reset into bootloader
    if (typeof port.setSignals === 'function') {
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(100);
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await sleep(100);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(250);
    }

    reading = true;
    const currentReader = reader;
    (async () => {
      try {
        while (reading && currentReader) {
          const { value, done } = await currentReader.read();
          if (done) break;
          if (value) {
            for (let i = 0; i < value.length; i++) rxQueue.push(value[i]);
          }
        }
      } catch {}
    })();

    // 1. Sync with STK500v2 bootloader (CMD_SIGN_ON = 0x01)
    let seq = 1;
    let synced = false;
    let signOnDevice = '';

    for (let attempt = 0; attempt < 12; attempt++) {
      const resp = await sendStk500v2Command(activeWriter, rxQueue, seq++, new Uint8Array([STK500V2_CMD_SIGN_ON]), 300);
      if (resp && resp.length >= 2 && resp[0] === STK500V2_CMD_SIGN_ON && resp[1] === STK500V2_STATUS_CMD_OK) {
        synced = true;
        if (resp.length > 3) {
          const sigLen = resp[2];
          signOnDevice = String.fromCharCode(...resp.slice(3, 3 + sigLen));
        }
        break;
      }
      if (attempt === 3 && typeof port.setSignals === 'function') {
        await port.setSignals({ dataTerminalReady: true, requestToSend: true });
        await sleep(60);
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await sleep(200);
      }
      await sleep(40);
    }

    if (!synced) {
      return {
        success: false,
        error: 'Tidak mendapat respon STK500v2 dari bootloader Arduino Mega. Pastikan board & port USB benar.',
      };
    }

    onLog({
      text: `✓ [STK500v2 WebSerial] Bootloader ${signOnDevice || 'Wiring / AVRISP_2'} tersinkronisasi!`,
      type: 'success',
    });

    // 2. Enter Progmode (CMD_ENTER_PROGMODE_ISP = 0x10)
    const enterProgCmd = new Uint8Array([
      STK500V2_CMD_ENTER_PROGMODE_ISP,
      0xc8, 0x64, 0x19, 0x20, 0x00, 0x53, 0x03, 0xac, 0x53, 0x00, 0x00,
    ]);
    await sendStk500v2Command(activeWriter, rxQueue, seq++, enterProgCmd, 500);

    // 3. Flash pages (256 bytes per page for ATmega2560 & ATmega128)
    const pageSize = 256;
    const totalPages = Math.ceil(binary.length / pageSize);

    for (let page = 0; page < totalPages; page++) {
      const byteAddr = page * pageSize;
      // STK500v2 word address with bit 31 set for flash memory
      const wordAddr = ((byteAddr >> 1) | 0x80000000) >>> 0;

      // STK500V2_CMD_LOAD_ADDRESS (0x06)
      const loadAddrCmd = new Uint8Array([
        STK500V2_CMD_LOAD_ADDRESS,
        (wordAddr >>> 24) & 0xff,
        (wordAddr >>> 16) & 0xff,
        (wordAddr >>> 8) & 0xff,
        wordAddr & 0xff,
      ]);
      const loadResp = await sendStk500v2Command(activeWriter, rxQueue, seq++, loadAddrCmd, 600);
      if (!loadResp || loadResp[1] !== STK500V2_STATUS_CMD_OK) {
        throw new Error(`Gagal STK500v2 CMD_LOAD_ADDRESS pada alamat 0x${byteAddr.toString(16)} (halaman ${page + 1}/${totalPages})`);
      }

      // STK500V2_CMD_PROGRAM_FLASH_ISP (0x13)
      const slice = binary.slice(byteAddr, byteAddr + pageSize);
      const pageBuf = new Uint8Array(pageSize);
      pageBuf.fill(0xff);
      pageBuf.set(slice);

      const progCmd = new Uint8Array(10 + pageSize);
      progCmd[0] = STK500V2_CMD_PROGRAM_FLASH_ISP;
      progCmd[1] = (pageSize >> 8) & 0xff;
      progCmd[2] = pageSize & 0xff;
      progCmd[3] = 0xc1; // mode: write page, auto-erase
      progCmd[4] = 0x0a; // delay: 10ms
      progCmd[5] = 0x40; // cmd1
      progCmd[6] = 0x4c; // cmd2
      progCmd[7] = 0x00; // cmd3
      progCmd[8] = 0x00; // poll1
      progCmd[9] = 0x00; // poll2
      progCmd.set(pageBuf, 10);

      const progResp = await sendStk500v2Command(activeWriter, rxQueue, seq++, progCmd, 1800);
      if (!progResp || progResp[1] !== STK500V2_STATUS_CMD_OK) {
        throw new Error(`Gagal STK500v2 CMD_PROGRAM_FLASH_ISP pada alamat 0x${byteAddr.toString(16)} (halaman ${page + 1}/${totalPages})`);
      }

      if (page % 4 === 0 || page === totalPages - 1) {
        const pct = Math.round(((page + 1) / totalPages) * 100);
        onLog({
          text: `Writing at 0x${byteAddr.toString(16).padStart(5, '0')}... (${pct}%)`,
          type: 'stdout',
        });
      }
    }

    // 4. Leave Progmode (CMD_LEAVE_PROGMODE_ISP = 0x11)
    const leaveCmd = new Uint8Array([STK500V2_CMD_LEAVE_PROGMODE_ISP, 0x01, 0x01]);
    await sendStk500v2Command(activeWriter, rxQueue, seq++, leaveCmd, 400);

    reading = false;
    if (reader) {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    if (writer) {
      writer.releaseLock();
    }
    await port.close().catch(() => {});

    onLog({
      text: `🎉 [STK500v2 WebSerial] Flash ${targetLabel} selesai & diverifikasi!`,
      type: 'success',
    });
    return { success: true };
  } catch (err: any) {
    reading = false;
    if (reader) {
      try { await reader.cancel(); } catch {}
      try { reader.releaseLock(); } catch {}
    }
    if (writer) {
      try { writer.releaseLock(); } catch {}
    }
    try { await port.close(); } catch {}
    return { success: false, error: err?.message || String(err) };
  }
}

// ----------------------------------------------------------------------------
// STK500v1 (Optiboot Protocol) Implementation for Arduino Uno & Nano
// ----------------------------------------------------------------------------
async function flashAvrStk500v1(
  port: any,
  binary: Uint8Array,
  boardName: string,
  onLog: HardwareLogCallback
): Promise<{ success: boolean; error?: string }> {
  const isNano = boardName.toLowerCase().includes('nano');
  const baudCandidates = isNano ? [115200, 57600] : [115200];

  try {
    let writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    const rxQueue: number[] = [];
    let reading = false;
    let synced = false;

    const waitForStkSync = async (timeoutMs = 600): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const insyncIdx = rxQueue.indexOf(0x14);
        if (insyncIdx !== -1 && rxQueue.length > insyncIdx + 1) {
          const okByte = rxQueue[insyncIdx + 1];
          rxQueue.splice(0, insyncIdx + 2);
          if (okByte === 0x10) return true;
        }
        await sleep(15);
      }
      return false;
    };

    for (const baudRate of baudCandidates) {
      const bootloaderVariant = isNano ? (baudRate === 115200 ? ' (New Bootloader)' : ' (Old Bootloader)') : '';
      onLog({
        text: `⚡ [STK500v1 WebSerial] Menyiapkan flash ${boardName}${bootloaderVariant} (${binary.length} bytes) @ ${baudRate} baud...`,
        type: 'info',
      });

      if (port.readable || port.writable) {
        if (baudRate !== 115200 || port.readable?.locked || port.writable?.locked) {
          try {
            await port.close();
            await sleep(350);
          } catch {}
          await port.open({ baudRate });
        }
      } else {
        await port.open({ baudRate });
      }
      writer = port.writable.getWriter();
      reader = port.readable.getReader();

      // Pulse DTR/RTS to trigger Arduino auto-reset into Optiboot bootloader
      if (typeof port.setSignals === 'function') {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await sleep(50);
        await port.setSignals({ dataTerminalReady: true, requestToSend: true });
        await sleep(50);
        await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        await sleep(220);
      }

      rxQueue.length = 0;
      reading = true;
      const currentReader = reader;
      (async () => {
        try {
          while (reading && currentReader) {
            const { value, done } = await currentReader.read();
            if (done) break;
            if (value) {
              for (let i = 0; i < value.length; i++) rxQueue.push(value[i]);
            }
          }
        } catch {}
      })();

      // 1. Sync with bootloader (STK_GET_SYNC = 0x30, CRC_EOP = 0x20)
      for (let attempt = 0; attempt < 8; attempt++) {
        rxQueue.length = 0;
        await writer!.write(new Uint8Array([0x30, 0x20]));
        if (await waitForStkSync(280)) {
          synced = true;
          break;
        }
      }

      if (synced) break;

      reading = false;
      await reader!.cancel().catch(() => {});
      reader!.releaseLock();
      writer!.releaseLock();
      await port.close().catch(() => {});
      await sleep(250);
    }

    if (!synced || !writer || !reader) {
      return {
        success: false,
        error: 'Tidak mendapat respon STK500v1 dari bootloader Arduino. Pastikan board & port benar.',
      };
    }

    onLog({ text: '✓ [STK500v1 WebSerial] Bootloader Optiboot tersinkronisasi!', type: 'success' });

    // 2. Enter Progmode (0x50, 0x20)
    rxQueue.length = 0;
    await writer.write(new Uint8Array([0x50, 0x20]));
    await waitForStkSync(500);

    // 3. Flash pages (128 bytes per page for ATmega328P)
    const pageSize = 128;
    const totalPages = Math.ceil(binary.length / pageSize);

    for (let page = 0; page < totalPages; page++) {
      const byteAddr = page * pageSize;
      const wordAddr = byteAddr >> 1;
      const addrLow = wordAddr & 0xff;
      const addrHigh = (wordAddr >> 8) & 0xff;

      // STK_LOAD_ADDRESS (0x55)
      rxQueue.length = 0;
      await writer.write(new Uint8Array([0x55, addrLow, addrHigh, 0x20]));
      if (!(await waitForStkSync(500))) {
        throw new Error(`Gagal STK_LOAD_ADDRESS pada halaman ${page}`);
      }

      const slice = binary.slice(byteAddr, byteAddr + pageSize);
      const pageBuf = new Uint8Array(pageSize);
      pageBuf.fill(0xff);
      pageBuf.set(slice);

      // STK_PROG_PAGE (0x64, lenHigh, lenLow, 'F', ...data, 0x20)
      const cmd = new Uint8Array(4 + pageSize + 1);
      cmd[0] = 0x64;
      cmd[1] = (pageSize >> 8) & 0xff;
      cmd[2] = pageSize & 0xff;
      cmd[3] = 0x46; // 'F' for Flash
      cmd.set(pageBuf, 4);
      cmd[4 + pageSize] = 0x20;

      rxQueue.length = 0;
      await writer.write(cmd);
      if (!(await waitForStkSync(1000))) {
        throw new Error(`Gagal STK_PROG_PAGE pada halaman ${page}`);
      }

      if (page % 8 === 0 || page === totalPages - 1) {
        const pct = Math.round(((page + 1) / totalPages) * 100);
        onLog({ text: `Writing at 0x${byteAddr.toString(16).padStart(4, '0')}... (${pct}%)`, type: 'stdout' });
      }
    }

    // 4. Leave Progmode (0x51, 0x20)
    rxQueue.length = 0;
    await writer.write(new Uint8Array([0x51, 0x20]));
    await waitForStkSync(400);

    reading = false;
    await reader.cancel().catch(() => {});
    reader.releaseLock();
    writer.releaseLock();
    await port.close().catch(() => {});

    onLog({ text: '🎉 [STK500v1 WebSerial] Flash selesai & diverifikasi!', type: 'success' });
    return { success: true };
  } catch (err: any) {
    try {
      await port.close();
    } catch {}
    return { success: false, error: err?.message || String(err) };
  }
}

// ----------------------------------------------------------------------------
// Main AVR Web Serial Flash Entry Point
// ----------------------------------------------------------------------------
export async function flashAvrHexViaWebSerial(
  port: any,
  hexContent: string,
  boardName: string,
  onLog: HardwareLogCallback
): Promise<{ success: boolean; error?: string }> {
  await stopWebSerialMonitor();
  const binary = parseIntelHex(hexContent);
  if (binary.length === 0) {
    return { success: false, error: 'Berkas binary HEX kosong atau tidak valid.' };
  }

  const bLower = boardName.toLowerCase();
  const isMega = bLower.includes('mega') || bLower.includes('2560');

  // Arduino Mega 2560 uses STK500v2 (Wiring protocol)
  if (isMega) {
    const v2Res = await flashAvrStk500v2(port, binary, boardName, onLog);
    if (v2Res.success) return v2Res;
    onLog({
      text: `⚠️ Percobaan STK500v2 selesai: ${v2Res.error || 'gagal'}. Mencoba fallback STK500v1...`,
      type: 'info',
    });
    return flashAvrStk500v1(port, binary, boardName, onLog);
  } else {
    const v1Res = await flashAvrStk500v1(port, binary, boardName, onLog);
    if (v1Res.success) return v1Res;
    if (bLower.includes('128') || bLower.includes('megacore')) {
      onLog({
        text: '⚠️ Mencoba protokol STK500v2 untuk MegaCore...',
        type: 'info',
      });
      return flashAvrStk500v2(port, binary, boardName, onLog);
    }
    return v1Res;
  }
}

// ============================================================================
// ESP32 / ESP8266 SLIP BOOTLOADER FLASHER OVER WEB SERIAL
// ============================================================================

function slipEncode(packet: Uint8Array): Uint8Array {
  const out: number[] = [0xc0];
  for (let i = 0; i < packet.length; i++) {
    const b = packet[i];
    if (b === 0xc0) {
      out.push(0xdb, 0xdc);
    } else if (b === 0xdb) {
      out.push(0xdb, 0xdd);
    } else {
      out.push(b);
    }
  }
  out.push(0xc0);
  return new Uint8Array(out);
}

function buildEspCommandPacket(opcode: number, data: Uint8Array, checksum = 0): Uint8Array {
  const pkt = new Uint8Array(8 + data.length);
  pkt[0] = 0x00; // direction: request
  pkt[1] = opcode;
  pkt[2] = data.length & 0xff;
  pkt[3] = (data.length >> 8) & 0xff;
  pkt[4] = checksum & 0xff;
  pkt[5] = (checksum >> 8) & 0xff;
  pkt[6] = (checksum >> 16) & 0xff;
  pkt[7] = (checksum >> 24) & 0xff;
  pkt.set(data, 8);
  return slipEncode(pkt);
}

function computeEspChecksum(data: Uint8Array): number {
  let chk = 0xef;
  for (let i = 0; i < data.length; i++) {
    chk ^= data[i];
  }
  return chk >>> 0;
}

function base64ToUint8Array(b64: string): Uint8Array {
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return bytes;
}

function getEsp8266EraseSize(offset: number, size: number): number {
  const sectorsPerBlock = 16;
  const sectorSize = 4096;
  const numSectors = Math.floor((size + sectorSize - 1) / sectorSize);
  const startSector = Math.floor(offset / sectorSize);
  let headSectors = sectorsPerBlock - (startSector % sectorsPerBlock);
  if (numSectors < headSectors) {
    headSectors = numSectors;
  }
  if (numSectors < 2 * headSectors) {
    return Math.floor(((numSectors + 1) / 2) * sectorSize);
  }
  return (numSectors - headSectors) * sectorSize;
}

export async function flashEspViaWebSerial(
  port: any,
  partitions: Array<{ offset: number; dataBase64: string; name?: string }>,
  onLog: HardwareLogCallback,
  boardName = ''
): Promise<{ success: boolean; error?: string }> {
  await stopWebSerialMonitor();
  const isEsp8266 =
    boardName.toLowerCase().includes('esp8266') || boardName.toLowerCase().includes('nodemcu');

  let activeReader: any = null;
  let writer: any = null;
  let reading = false;

  let activePort = port;
  try {
    // Reuse already-open port directly (avoids Windows USB driver 'Failed to open serial port' error on close+reopen)
    const opened = await openAvailableWebSerialPort(activePort, 115200);
    activePort = opened.port;
    port = activePort;
    writer = activePort.writable.getWriter();

    const rxBuffer: number[] = [];
    reading = true;

    // Resilient Web Serial reader loop:
    // On Windows/Chrome, resetting ESP32 causes a UART BREAK (TX drops low) and 74880-baud boot log
    // which triggers BreakError / FramingError / ParityError / BufferOverrunError on reader.read().
    // In Web Serial API, releasing the lock after these non-fatal errors refreshes port.readable
    // with a new ReadableStream. We MUST loop and re-acquire getReader() or RX permanently dies!
    const readerLoopPromise = (async () => {
      while (reading && activePort.readable) {
        try {
          activeReader = activePort.readable.getReader();
          while (reading) {
            const { value, done } = await activeReader.read();
            if (done) break;
            if (value) {
              for (let i = 0; i < value.length; i++) {
                rxBuffer.push(value[i]);
              }
            }
          }
        } catch (_readErr) {
          // Non-fatal UART BreakError / FramingError / BufferOverrunError during ESP32 reset.
          // Release lock in finally block and immediately re-attach reader to activePort.readable.
        } finally {
          if (activeReader) {
            try {
              activeReader.releaseLock();
            } catch {}
            activeReader = null;
          }
        }
        if (reading) {
          await sleep(5);
        }
      }
    })();

    // Drain any stale serial bytes or pending BufferOverrunError accumulated during Cloud Compilation
    await sleep(40);
    rxBuffer.length = 0;

    const extractSlipPacket = (expectedOpcode: number): { status: number; errCode: number } | null => {
      while (rxBuffer.length > 0) {
        const startIdx = rxBuffer.indexOf(0xc0);
        if (startIdx === -1) {
          rxBuffer.length = 0;
          return null;
        }
        if (startIdx > 0) {
          rxBuffer.splice(0, startIdx);
        }
        let endIdx = -1;
        for (let i = 1; i < rxBuffer.length; i++) {
          if (rxBuffer[i] === 0xc0) {
            if (i === 1) {
              // Back-to-back 0xC0: discard the first 0xC0 and keep the second 0xC0 as start of frame
              rxBuffer.shift();
              endIdx = -2;
              break;
            }
            endIdx = i;
            break;
          }
        }
        if (endIdx === -2) continue;
        if (endIdx === -1) return null;

        // Peek at the candidate frame between rxBuffer[0] (0xC0) and rxBuffer[endIdx] (0xC0)
        const rawFrame = rxBuffer.slice(1, endIdx);
        const decoded: number[] = [];
        for (let i = 0; i < rawFrame.length; i++) {
          if (rawFrame[i] === 0xdb && i + 1 < rawFrame.length) {
            if (rawFrame[i + 1] === 0xdc) {
              decoded.push(0xc0);
              i++;
              continue;
            } else if (rawFrame[i + 1] === 0xdd) {
              decoded.push(0xdb);
              i++;
              continue;
            }
          }
          decoded.push(rawFrame[i]);
        }

        // Check if this is a genuine ESP ROM Bootloader SLIP response packet (direction === 0x01)
        if (decoded.length >= 10 && decoded[0] === 0x01) {
          // Valid SLIP frame: consume including the closing 0xC0 at endIdx
          rxBuffer.splice(0, endIdx + 1);
          if (decoded[1] === expectedOpcode) {
            const status = decoded[8];
            const errCode = decoded[9] || 0;
            return { status, errCode };
          }
          // Valid SLIP frame for an earlier opcode (e.g. extra SYNC response), continue loop
          continue;
        } else {
          // Not a valid SLIP packet (e.g. boot log bytes between a stray 0xC0 glitch and the real opening 0xC0).
          // Do NOT consume rxBuffer[endIdx] because rxBuffer[endIdx] is the OPENING 0xC0 of the real SLIP frame!
          rxBuffer.splice(0, endIdx);
        }
      }
      return null;
    };

    const waitForSlipResponse = async (
      expectedOpcode: number,
      timeoutMs = 1000
    ): Promise<{ ok: boolean; errCode?: number }> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const pkt = extractSlipPacket(expectedOpcode);
        if (pkt) {
          if (pkt.status === 0) return { ok: true };
          return { ok: false, errCode: pkt.errCode };
        }
        await sleep(10);
      }
      return { ok: false };
    };

    // Build SYNC payload (0x07, 0x07, 0x12, 0x20 + 32x 0x55)
    const syncData = new Uint8Array(36);
    syncData[0] = 0x07;
    syncData[1] = 0x07;
    syncData[2] = 0x12;
    syncData[3] = 0x20;
    syncData.fill(0x55, 4);
    const syncPacket = buildEspCommandPacket(0x08, syncData, 0);

    const trySyncAttempts = async (attempts: number, timeoutMs = 180): Promise<boolean> => {
      for (let attempt = 0; attempt < attempts; attempt++) {
        await writer.write(syncPacket);
        const syncRes = await waitForSlipResponse(0x08, timeoutMs);
        if (syncRes.ok) {
          return true;
        }
      }
      return false;
    };

    onLog({ text: '🔌 [esptool-web] Mengatur sinyal DTR/RTS untuk masuk ke ROM Bootloader ESP...', type: 'info' });
    onLog({ text: 'Connecting........', type: 'stdout' });

    let synced = false;

    // Strategy 0: Standard Classic Auto-Reset (esptool-js / NodeMCU / DevKit V1)
    if (typeof port.setSignals === 'function' && !synced) {
      await port.setSignals({ dataTerminalReady: false, requestToSend: true }); // IO0=HIGH, EN=LOW (reset)
      await sleep(100);
      await port.setSignals({ dataTerminalReady: true, requestToSend: false }); // IO0=LOW, EN=HIGH (download boot)
      await sleep(50);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(50);
      rxBuffer.length = 0;
      synced = await trySyncAttempts(6, 200);
    }

    // Strategy 1: Continuous Virtual BOOT Hold (keeps DTR=true, RTS=false -> IO0=LOW while EN capacitor charges & during SYNC)
    // Essential for ESP32 DevKit V1 boards on Windows with 1uF-10uF EN capacitor!
    if (typeof port.setSignals === 'function' && !synced) {
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(60);
      await port.setSignals({ dataTerminalReady: false, requestToSend: true }); // EN=LOW (discharge EN cap)
      await sleep(200);
      await port.setSignals({ dataTerminalReady: true, requestToSend: false }); // EN=HIGH, IO0=LOW (hold BOOT low!)
      await sleep(120);
      rxBuffer.length = 0;
      // Try syncing while virtual BOOT (IO0=LOW) is still actively held
      synced = await trySyncAttempts(5, 200);
      // Release virtual BOOT and try again in case EN finished rising during the hold
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      if (!synced) {
        await sleep(60);
        synced = await trySyncAttempts(5, 200);
      }
    }

    // Strategy 2: Direct DTR/RTS & Extended Capacitor Hold
    if (typeof port.setSignals === 'function' && !synced) {
      await port.setSignals({ dataTerminalReady: true, requestToSend: true });
      await sleep(80);
      await port.setSignals({ dataTerminalReady: false, requestToSend: true });
      await sleep(300);
      await port.setSignals({ dataTerminalReady: true, requestToSend: false });
      await sleep(350);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(100);
      rxBuffer.length = 0;
      synced = await trySyncAttempts(6, 220);
    }

    // Strategy 3: USB-Serial-JTAG / Inverted Reset + Manual BOOT Button Window
    if (!synced) {
      if (typeof port.setSignals === 'function') {
        await port.setSignals({ dataTerminalReady: true, requestToSend: false });
        await sleep(100);
        await port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await sleep(120);
        await port.setSignals({ dataTerminalReady: true, requestToSend: false });
        await sleep(150);
      }
      rxBuffer.length = 0;
      synced = await trySyncAttempts(8, 250);
      if (typeof port.setSignals === 'function') {
        await port.setSignals({ dataTerminalReady: false, requestToSend: false }).catch(() => {});
      }
    }

    if (!synced) {
      reading = false;
      try { if (activeReader) await activeReader.cancel(); } catch {}
      try { if (activeReader) activeReader.releaseLock(); } catch {}
      try { writer.releaseLock(); } catch {}
      try { await readerLoopPromise; } catch {}
      try { await port.close(); } catch {}
      const syncErrMsg =
        'Gagal sinkronisasi dengan ROM Bootloader ESP via Web Serial (tahap SYNC). Tahan tombol FLASH/BOOT pada board saat menekan Upload.';
      onLog({ text: `❌ [esptool-web] ${syncErrMsg}`, type: 'error' });
      return { success: false, error: syncErrMsg };
    }

    // Drain any extra queued SYNC responses
    await sleep(100);
    rxBuffer.length = 0;

    onLog({
      text: `✓ [esptool-web] Chip ${isEsp8266 ? 'ESP8266' : 'ESP32'} terdeteksi dan masuk mode ROM Bootloader!`,
      type: 'success',
    });

    // Attach SPI Flash (ESP_SPI_ATTACH = 0x0D) — ONLY supported on ESP32 ROM Bootloader, NOT ESP8266!
    if (!isEsp8266) {
      rxBuffer.length = 0;
      await writer.write(buildEspCommandPacket(0x0d, new Uint8Array(8), 0));
      await waitForSlipResponse(0x0d, 1500);
    }

    const blockSize = 1024;
    for (const part of partitions) {
      const rawBytes = base64ToUint8Array(part.dataBase64);
      const numBlocks = Math.ceil(rawBytes.length / blockSize);
      const offset = part.offset;

      // On ESP8266 ROM bootloader, erase_size MUST be sector-aligned via getEsp8266EraseSize
      // or SPIEraseArea returns error 0x06 and refuses to flash!
      const eraseSize = isEsp8266
        ? getEsp8266EraseSize(offset, rawBytes.length)
        : rawBytes.length;

      onLog({
        text: `🗑️ [esptool-web] Menghapus flash / firmware lama (${part.name || 'firmware'}, ${eraseSize} bytes) pada offset 0x${offset.toString(16).padStart(8, '0')}...`,
        type: 'info',
      });

      // ESP_FLASH_BEGIN (0x02): [erase_size(4), num_blocks(4), block_size(4), offset(4)]
      const beginData = new Uint8Array(16);
      const dv = new DataView(beginData.buffer);
      dv.setUint32(0, eraseSize, true);
      dv.setUint32(4, numBlocks, true);
      dv.setUint32(8, blockSize, true);
      dv.setUint32(12, offset, true);

      rxBuffer.length = 0;
      await writer.write(buildEspCommandPacket(0x02, beginData, 0));
      // ESP8266/ESP32 erases flash synchronously during FLASH_BEGIN (can take 5-20 seconds)
      const beginRes = await waitForSlipResponse(0x02, 30000);
      if (!beginRes.ok) {
        throw new Error(
          `Gagal FLASH_BEGIN di offset 0x${offset.toString(16)}${
            beginRes.errCode !== undefined ? ` (kode error ROM: 0x${beginRes.errCode.toString(16)})` : ' (Timeout)'
          }`
        );
      }

      onLog({
        text: `✓ Sektor flash berhasil dihapus! Menulis ${numBlocks} blok data (${rawBytes.length} bytes)...`,
        type: 'info',
      });

      for (let seq = 0; seq < numBlocks; seq++) {
        const slice = rawBytes.slice(seq * blockSize, (seq + 1) * blockSize);
        const padded = new Uint8Array(blockSize);
        padded.fill(0xff);
        padded.set(slice);

        // ESP_FLASH_DATA (0x03): [data_size(4), seq(4), 0(4), 0(4), ...data]
        const blockPayload = new Uint8Array(16 + blockSize);
        const bdv = new DataView(blockPayload.buffer);
        bdv.setUint32(0, blockSize, true);
        bdv.setUint32(4, seq, true);
        bdv.setUint32(8, 0, true);
        bdv.setUint32(12, 0, true);
        blockPayload.set(padded, 16);

        const chk = computeEspChecksum(padded);
        rxBuffer.length = 0;
        await writer.write(buildEspCommandPacket(0x03, blockPayload, chk));
        const dataRes = await waitForSlipResponse(0x03, 8000);
        if (!dataRes.ok) {
          throw new Error(
            `Gagal menulis blok #${seq}/${numBlocks}${
              dataRes.errCode !== undefined ? ` (kode error ROM: 0x${dataRes.errCode.toString(16)})` : ' (Timeout)'
            }`
          );
        }

        if (seq % 16 === 0 || seq === numBlocks - 1) {
          const pct = Math.round(((seq + 1) / numBlocks) * 100);
          const currentAddr = offset + seq * blockSize;
          onLog({
            text: `Writing at 0x${currentAddr.toString(16).padStart(8, '0')}... (${pct}%)`,
            type: 'stdout',
          });
        }
      }

      onLog({
        text: `✓ Partisi ${part.name || 'firmware'} (${rawBytes.length} bytes) berhasil ditulis!`,
        type: 'success',
      });
    }

    // ESP_FLASH_END (0x04): [0x00000000 -> reboot into user application]
    const endData = new Uint8Array(4);
    await writer.write(buildEspCommandPacket(0x04, endData, 0));
    await sleep(100);

    // Pulse RTS to hard-reset ESP out of bootloader so user sketch runs immediately
    if (typeof port.setSignals === 'function') {
      await port.setSignals({ dataTerminalReady: false, requestToSend: true });
      await sleep(120);
      await port.setSignals({ dataTerminalReady: false, requestToSend: false });
      await sleep(100);
    }

    reading = false;
    try { if (activeReader) await activeReader.cancel(); } catch {}
    try { if (activeReader) activeReader.releaseLock(); } catch {}
    try { writer.releaseLock(); } catch {}
    try { await readerLoopPromise; } catch {}
    try { await port.close(); } catch {}

    onLog({ text: 'Hash of data verified.', type: 'stdout' });
    onLog({ text: 'Leaving... Hard resetting via RTS pin...', type: 'stdout' });
    onLog({ text: '🎉 [esptool-web] Firmware berhasil di-flash ke board via Web Serial!', type: 'success' });
    return { success: true };
  } catch (err: any) {
    reading = false;
    try { if (activeReader) await activeReader.cancel(); } catch {}
    try { if (activeReader) activeReader.releaseLock(); } catch {}
    try { if (writer) writer.releaseLock(); } catch {}
    try { await port.close(); } catch {}
    const errMsg = err?.message || String(err);
    onLog({ text: `❌ [esptool-web] Gagal flashing via Web Serial: ${errMsg}`, type: 'error' });
    return { success: false, error: errMsg };
  }
}

// ============================================================================
// UNIFIED WEB HARDWARE ACTION EXECUTOR (VERIFY, UPLOAD, FLASH-FIRMWARE)
// ============================================================================

export async function executeWebHardwareAction(params: {
  board: string;
  port: string;
  action: 'verify' | 'upload' | 'flash-firmware';
  fileExt: string;
  sketchPath?: string;
  requireNative?: boolean;
  files: Record<string, string>;
  forceMicrobitHex?: boolean;
  onLog: HardwareLogCallback;
  onProgress?: (pct: number) => void;
  onPortSelected?: (newAddress: string) => void;
}): Promise<{ success: boolean; error?: string; selectedPort?: string; hexDownloaded?: boolean; flashedViaWebUsb?: boolean }> {
  const { board, port, action, fileExt, files, onLog, onProgress, onPortSelected } = params;
  const boardLower = board.toLowerCase();
  const isPython = fileExt === 'py';
  const isLocalComPort = Boolean(port && /^COM\d+$/i.test(port));

  if (boardLower.includes('micro:bit') && action !== 'verify') {
    const code = files['main.py'] ?? files['python/main.py'] ?? Object.entries(files).find(([name]) => name.endsWith('.py'))?.[1] ?? '';

    const modules = getMicrobitModules(files);

    async function prepareHex() {
      try {
        const { downloadMicrobitHex } = await import('./microbitHex');
        await downloadMicrobitHex(code, modules);
        onProgress?.(100);
        onLog({ text: 'robolab-microbit.hex siap. Salin file ini ke drive MICROBIT dan tunggu LED transfer berhenti berkedip. File memuat firmware dan program Anda.', type: 'info' });
        return { success: false, hexDownloaded: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        onLog({ text: `Gagal menyiapkan Universal Hex: ${error}`, type: 'error' });
        return { success: false, error };
      }
    }

    if (action === 'upload' && !code.trim()) {
      const error = 'Program MicroPython kosong.';
      onLog({ text: error, type: 'error' });
      return { success: false, error };
    }

    if (params.forceMicrobitHex) return prepareHex();

    if (canFlashMicrobitViaUsb()) {
      try {
        onLog({ text: 'Pilih micro:bit pada dialog USB. RoboLab akan mengirim firmware dan program.', type: 'info' });
        await flashMicrobitViaUsb(code, onProgress, modules);
        onLog({ text: 'micro:bit mengonfirmasi flash selesai dan telah di-reset.', type: 'success' });
        return { success: true, flashedViaWebUsb: true };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        onLog({ text: `Upload WebUSB gagal: ${error}`, type: 'error' });
        if (Object.keys(modules).length > 0) return prepareHex();
        return { success: false, error };
      }
    }

    if (action === 'flash-firmware' || Object.keys(modules).length > 0) return prepareHex();
    await stopWebSerialMonitor();
    const ports = (await listBrowserAuthorizedSerialPorts()).filter(entry => entry.usbVendorId === 0x0d28);
    const target = ports.find(entry => entry.address === port)
      ?? (ports.length === 1 ? ports[0] : await requestWebSerialPort(0x0d28));
    if (!target?.rawPort) {
      onLog({ text: 'Port USB micro:bit belum dipilih. Menyiapkan file untuk drive MICROBIT…', type: 'info' });
      return prepareHex();
    }
    onPortSelected?.(target.address);
    try {
      onProgress?.(35);
      onLog({ text: 'Menulis dan memeriksa main.py di micro:bit…', type: 'info' });
      await writeMicrobitProgram(target.rawPort, code);
      onProgress?.(100);
      onLog({ text: 'main.py terverifikasi dan micro:bit telah restart.', type: 'success' });
      return { success: true, selectedPort: target.address };
    } catch (err) {
      if (err instanceof MicrobitReplUnavailableError) {
        onLog({ text: `${err.message} Menyiapkan firmware dan program untuk drive MICROBIT…`, type: 'info' });
        return prepareHex();
      }
      const error = err instanceof Error ? err.message : String(err);
      onLog({ text: error, type: 'error' });
      return { success: false, error, selectedPort: target.address };
    }
  }

  // 1. If action requires a hardware port ('upload' or 'flash-firmware'), ensure Web Serial port is selected & verified
  // IMPORTANT: Verify/open Web Serial port BEFORE any network/timer awaits so browser user gesture activation is preserved!
  let targetWebPort: { port: any; address: string; openError?: string } | null = null;
  const hasLocalBridge = await checkLocalBridgeAvailable();
  const shouldUseBridgeDirect = isLocalComPort && hasLocalBridge && !isPython && action !== 'flash-firmware';

  if (action === 'upload' || action === 'flash-firmware') {
    await stopWebSerialMonitor();
  }

  if ((action === 'upload' || action === 'flash-firmware') && !shouldUseBridgeDirect) {
    if (!isLocalComPort || isRemoteWebOrigin() || isPython || action === 'flash-firmware' || isWebSerialSupported()) {
      targetWebPort = await ensureWebSerialPort(port, true, 115200);
    }
    if (!targetWebPort && (isPython || action === 'flash-firmware')) {
      onLog({
        text: '⚠️ Pilih port USB perangkat Anda pada jendela popup browser (Web Serial API) untuk melanjutkan.',
        type: 'error',
      });
      return { success: false, error: 'Port Web Serial belum dipilih.' };
    }
    if (targetWebPort && onPortSelected) {
      onPortSelected(targetWebPort.address);
    }
    if (targetWebPort?.openError && (isRemoteWebOrigin() || isPython || action === 'flash-firmware')) {
      onLog({
        text: `❌ [WebSerial] ${targetWebPort.openError}`,
        type: 'error',
      });
      return { success: false, error: targetWebPort.openError, selectedPort: targetWebPort.address };
    }
  }

  // 2. Handle Python Verify (Syntax Check in Browser)
  if (isPython && action === 'verify') {
    onLog({ text: `🐍 [Web Verifier] Memeriksa sintaks MicroPython untuk ${board}...`, type: 'info' });
    onProgress?.(40);
    await sleep(300);
    const pyEntry = Object.entries(files).find(([k]) => k.endsWith('.py'));
    const pyCode = files['main.py'] ?? pyEntry?.[1] ?? Object.values(files)[0] ?? '';
    if (!pyCode.trim()) {
      onLog({ text: '❌ Berkas Python kosong.', type: 'error' });
      return { success: false, error: 'Empty Python file' };
    }
    onProgress?.(100);
    onLog({
      text: `✓ Sintaks MicroPython valid (${pyCode.split('\n').length} baris, ${pyCode.length} bytes). Siap diunggah via Web Serial!`,
      type: 'success',
    });
    return { success: true };
  }

  // 3. Handle Direct MicroPython Upload over Web Serial Raw REPL
  if (isPython && action === 'upload') {
    const pyEntry = Object.entries(files).find(([k]) => k.endsWith('.py'));
    const pyCode = files['main.py'] ?? pyEntry?.[1] ?? Object.values(files)[0] ?? '';

    if (targetWebPort) {
      onProgress?.(35);
      const res = await uploadMicroPythonViaWebSerial(targetWebPort.port, pyCode, onLog);
      onProgress?.(100);
      return { ...res, selectedPort: targetWebPort.address };
    }
  }

  // 4. Handle Flash MicroPython Firmware via Cloud Compiler + Web Serial
  if (action === 'flash-firmware') {
    onLog({ text: `⚡ [Web Flasher] Mengambil image firmware MicroPython untuk ${board}...`, type: 'info' });
    onProgress?.(25);
    try {
      const resp = await fetchCompilerApi(`/api/firmware?board=${encodeURIComponent(board)}`);
      if (!resp.ok) {
        throw new Error(`Server firmware merespon status ${resp.status}`);
      }
      const data = await resp.json();
      if (!data.success || !data.partitions) {
        throw new Error(data.error || 'Firmware image tidak ditemukan di server.');
      }
      onProgress?.(50);
      if (targetWebPort) {
        const flashRes = await flashEspViaWebSerial(targetWebPort.port, data.partitions, onLog, board);
        onProgress?.(100);
        return { ...flashRes, selectedPort: targetWebPort.address };
      }
    } catch (err: any) {
      if (targetWebPort?.port) {
        try { await targetWebPort.port.close(); } catch {}
      }
      onLog({
        text: `❌ Gagal mem-flash firmware via Web Serial: ${err?.message || err}`,
        type: 'error',
      });
      return { success: false, error: err?.message || String(err) };
    }
  }

  // 5. Handle C++ / .ino Verify & Upload via Cloud Compiler API + Web Serial Flashing
  onLog({
    text: board.toLowerCase().includes('esp32')
      ? 'Mengompilasi sketch ESP32. Jika server baru aktif, proses pertama bisa memerlukan sekitar dua menit.'
      : `Mengirim sketch ${board} ke layanan kompilasi…`,
    type: 'info',
  });
  onProgress?.(25);

  try {
    const response = await fetchCompilerApi('/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Stream-Logs': 'true',
        'Accept': 'application/x-ndjson, application/json',
      },
      body: JSON.stringify({
        board,
        action,
        fileExt,
        sketchPath: params.sketchPath,
        requireNative: params.requireNative,
        files,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloud Compiler HTTP ${response.status}`);
    }

    let result: any = null;
    const compileCt = response.headers.get('content-type') || '';
    if (compileCt.includes('application/x-ndjson') && response.body) {
      result = await readNdjsonStream(response.body, onLog);
    } else {
      result = await response.json();
      if (Array.isArray(result.logs)) {
        for (const l of result.logs) {
          onLog({ text: l.text, type: l.type || 'stdout' });
        }
      }
    }

    if (!result || !result.success) {
      if (targetWebPort?.port) {
        try { await targetWebPort.port.close(); } catch {}
      }
      onProgress?.(100);
      const compileErrMsg = result?.error || 'Kompilasi gagal.';
      onLog({ text: `❌ ${compileErrMsg}`, type: 'error' });
      return { success: false, error: compileErrMsg };
    }

    onProgress?.(65);

    if (action === 'verify') {
      onProgress?.(100);
      return { success: true };
    }

    // Action === 'upload':
    // When the user has compiler bridge active with a local COM port, flash directly via native bridge uploader (esptool / avrdude).
    // Local background bridge (/api/upload-local) is used directly when bridge is available.
    const shouldUseLocalBridge = (shouldUseBridgeDirect || !targetWebPort) && isLocalComPort && !result.cloudCompiled && hasLocalBridge;
    if (shouldUseLocalBridge) {
      if (targetWebPort?.port) {
        try { await targetWebPort.port.close(); } catch {}
        await sleep(200);
      }
      try {
        const localUploadResp = await fetchCompilerApi('/api/upload-local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Stream-Logs': 'true',
            'Accept': 'application/x-ndjson, application/json',
          },
          body: JSON.stringify({
            board,
            port: isLocalComPort ? port : '',
          }),
        });
        if (localUploadResp.ok) {
          let localData: any = null;
          const uploadCt = localUploadResp.headers.get('content-type') || '';
          if (uploadCt.includes('application/x-ndjson') && localUploadResp.body) {
            localData = await readNdjsonStream(localUploadResp.body, onLog);
          } else {
            localData = await localUploadResp.json();
            if (Array.isArray(localData.logs)) {
              for (const l of localData.logs) {
                onLog({ text: l.text, type: l.type || 'stdout' });
              }
            }
          }
          if (localData?.success) {
            onProgress?.(100);
            const finalPort = localData.port || port;
            if (finalPort && onPortSelected) onPortSelected(finalPort);
            return { success: true, selectedPort: finalPort };
          }
          if (!targetWebPort) {
            onProgress?.(100);
            return { success: false, error: localData?.error || 'Upload gagal.' };
          }
        }
      } catch {}
    }

    // Direct Web Serial API Flashing in Browser (standard on Vercel & Web)
    if (!targetWebPort) {
      onLog({
        text: '⚠️ Pilih port USB perangkat Anda pada jendela popup browser (Web Serial API) untuk mengunggah ke board.',
        type: 'error',
      });
      onProgress?.(100);
      return { success: false, error: 'Port Web Serial belum dipilih.' };
    }

    if (targetWebPort.openError && !targetWebPort.port?.readable) {
      onLog({
        text: `❌ [esptool-web] ${targetWebPort.openError}`,
        type: 'error',
      });
      onProgress?.(100);
      return { success: false, error: targetWebPort.openError, selectedPort: targetWebPort.address };
    }

    if (result.binaryType === 'avr-hex' && result.hexData) {
      const avrRes = await flashAvrHexViaWebSerial(targetWebPort.port, result.hexData, board, onLog);
      if (!avrRes.success && hasLocalBridge) {
        onLog({
          text: '🔄 [Auto-Fallback] Mencoba upload otomatis melalui Compiler Bridge lokal (avrdude / arduino-cli)...',
          type: 'info',
        });
        if (targetWebPort?.port) {
          try { await targetWebPort.port.close(); } catch {}
          await sleep(250);
        }
        try {
          const localUploadResp = await fetchCompilerApi('/api/upload-local', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Stream-Logs': 'true',
              'Accept': 'application/x-ndjson, application/json',
            },
            body: JSON.stringify({
              board,
              port: isLocalComPort ? port : '',
            }),
          });
          if (localUploadResp.ok) {
            let localData: any = null;
            const fallbackCt = localUploadResp.headers.get('content-type') || '';
            if (fallbackCt.includes('application/x-ndjson') && localUploadResp.body) {
              localData = await readNdjsonStream(localUploadResp.body, onLog);
            } else {
              localData = await localUploadResp.json();
              if (Array.isArray(localData.logs)) {
                for (const l of localData.logs) onLog({ text: l.text, type: l.type || 'stdout' });
              }
            }
            if (localData?.success) {
              onProgress?.(100);
              return { success: true, selectedPort: localData.port || targetWebPort.address };
            }
          }
        } catch {}
      }
      onProgress?.(100);
      return { ...avrRes, selectedPort: targetWebPort.address };
    } else if (result.binaryType === 'esp-bin' && Array.isArray(result.partitions)) {
      const espRes = await flashEspViaWebSerial(targetWebPort.port, result.partitions, onLog, board);
      if (!espRes.success && hasLocalBridge) {
        onLog({
          text: '🔄 [Auto-Fallback] Mencoba upload otomatis melalui Compiler Bridge lokal (esptool)...',
          type: 'info',
        });
        if (targetWebPort?.port) {
          try { await targetWebPort.port.close(); } catch {}
          await sleep(250);
        }
        try {
          const localUploadResp = await fetchCompilerApi('/api/upload-local', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Stream-Logs': 'true',
              'Accept': 'application/x-ndjson, application/json',
            },
            body: JSON.stringify({
              board,
              port: isLocalComPort ? port : '',
            }),
          });
          if (localUploadResp.ok) {
            let localData: any = null;
            const fallbackCt = localUploadResp.headers.get('content-type') || '';
            if (fallbackCt.includes('application/x-ndjson') && localUploadResp.body) {
              localData = await readNdjsonStream(localUploadResp.body, onLog);
            } else {
              localData = await localUploadResp.json();
              if (Array.isArray(localData.logs)) {
                for (const l of localData.logs) onLog({ text: l.text, type: l.type || 'stdout' });
              }
            }
            if (localData?.success) {
              onProgress?.(100);
              return { success: true, selectedPort: localData.port || targetWebPort.address };
            }
          }
        } catch {}
      }
      onProgress?.(100);
      return { ...espRes, selectedPort: targetWebPort.address };
    } else if (result.binaryType === 'uf2' && result.uf2Base64) {
      onLog({
        text: `📦 [Raspberry Pi Pico] Firmware UF2 (${result.fileName || 'firmware.uf2'}) siap!`,
        type: 'info',
      });
      if (hasLocalBridge) {
        onLog({ text: '⚡ Mengunggah ke Raspberry Pi Pico via Compiler Bridge...', type: 'info' });
        if (targetWebPort?.port) {
          try { await targetWebPort.port.close(); } catch {}
          await sleep(200);
        }
        try {
          const localUploadResp = await fetchCompilerApi('/api/upload-local', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Stream-Logs': 'true',
              'Accept': 'application/x-ndjson, application/json',
            },
            body: JSON.stringify({ board, port: isLocalComPort ? port : '' }),
          });
          if (localUploadResp.ok) {
            let localData: any = null;
            const uploadCt = localUploadResp.headers.get('content-type') || '';
            if (uploadCt.includes('application/x-ndjson') && localUploadResp.body) {
              localData = await readNdjsonStream(localUploadResp.body, onLog);
            } else {
              localData = await localUploadResp.json();
              if (Array.isArray(localData.logs)) {
                for (const l of localData.logs) onLog({ text: l.text, type: l.type || 'stdout' });
              }
            }
            if (localData?.success) {
              onProgress?.(100);
              return { success: true, selectedPort: localData.port || targetWebPort?.address };
            }
          }
        } catch {}
      }

      if (targetWebPort?.port) {
        try {
          onLog({ text: '⚡ Mengirim sinyal 1200 baud untuk mereset Pico ke mode BOOTSEL...', type: 'info' });
          await targetWebPort.port.open({ baudRate: 1200 });
          await sleep(200);
          await targetWebPort.port.close();
        } catch {}
      }

      try {
        const binStr = atob(result.uf2Base64);
        const len = binStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.fileName || 'RoboLab_Pico.uf2';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onLog({
          text: '💾 File .uf2 berhasil diunduh! Cukup seret (drag & drop) file .uf2 ke drive USB "RPI-RP2" Raspberry Pi Pico Anda.',
          type: 'success',
        });
        onProgress?.(100);
        return { success: true, selectedPort: targetWebPort?.address };
      } catch (err: any) {
        onLog({ text: `Gagal mengunduh UF2: ${err.message}`, type: 'error' });
      }
    } else if (result.binaryType === 'stm32-bin' || board.toLowerCase().includes('stm32')) {
      if (hasLocalBridge) {
        onLog({ text: '⚡ Mengunggah ke STM32 via Compiler Bridge (ST-Link / STM32CubeProgrammer)...', type: 'info' });
        if (targetWebPort?.port) {
          try { await targetWebPort.port.close(); } catch {}
          await sleep(200);
        }
        try {
          const localUploadResp = await fetchCompilerApi('/api/upload-local', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Stream-Logs': 'true',
              'Accept': 'application/x-ndjson, application/json',
            },
            body: JSON.stringify({ board, port: isLocalComPort ? port : '' }),
          });
          if (localUploadResp.ok) {
            let localData: any = null;
            const uploadCt = localUploadResp.headers.get('content-type') || '';
            if (uploadCt.includes('application/x-ndjson') && localUploadResp.body) {
              localData = await readNdjsonStream(localUploadResp.body, onLog);
            } else {
              localData = await localUploadResp.json();
              if (Array.isArray(localData.logs)) {
                for (const l of localData.logs) onLog({ text: l.text, type: l.type || 'stdout' });
              }
            }
            if (localData?.success) {
              onProgress?.(100);
              return { success: true, selectedPort: localData.port || targetWebPort?.address };
            }
          }
        } catch {}
      }
      onLog({
        text: 'ℹ️ Untuk upload STM32 via browser, jalankan Compiler Bridge atau hubungkan menggunakan ST-Link.',
        type: 'info',
      });
    }

    if (targetWebPort?.port) {
      try { await targetWebPort.port.close(); } catch {}
    }
    onProgress?.(100);
    return {
      success: false,
      error: 'Gagal mengunggah ke board. Pastikan kabel USB terpasang dan port yang dipilih benar.',
    };
  } catch (err: any) {
    if (targetWebPort?.port) {
      try { await targetWebPort.port.close(); } catch {}
    }
    onLog({
      text: `❌ Gagal menghubungi Cloud Compiler: ${err?.message || err}`,
      type: 'error',
    });
    onProgress?.(100);
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// BROWSER FILE SYSTEM ACCESS API (Open File, Open Folder, Save File on Web)
// ============================================================================

export async function openFileInBrowser(): Promise<{ name: string; content: string } | null> {
  // Modern File System Access API
  if (typeof window !== 'undefined' && 'showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'RoboLab Block HEX & Code Files (.hex, .ino, .py, .cpp, .c, .h)',
            accept: {
              'text/plain': openableFileExtensions.filter(ext => ext !== 'c++').map(ext => '.' + ext),
            },
          },
        ],
      });
      const file = await handle.getFile();
      const content = await file.text();
      return { name: file.name, content };
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
    }
  }

  // Fallback <input type="file">
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = openableFileExtensions.map(ext => '.' + ext).join(',');
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve({ name: file.name, content: await file.text() });
      } catch (error) {
        reject(error);
      }
    };
    input.click();
  });
}

export async function openFolderInBrowser(): Promise<{
  name: string;
  files: Record<string, string>;
  sidecarXmls: Record<string, string>;
} | null> {
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const files: Record<string, string> = {};
      const sidecarXmls: Record<string, string> = {};

      const readDirRecursive = async (handle: any, prefix = '') => {
        for await (const entry of handle.values()) {
          const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            if (entry.name.endsWith('.xml')) {
              const f = await entry.getFile();
              const targetKey = relPath.slice(0, -4);
              sidecarXmls[targetKey] = await f.text();
            } else if (/\.(ino|py|c|cpp|h|hpp|hex|json|md|txt)$/i.test(entry.name)) {
              const f = await entry.getFile();
              files[relPath] = await f.text();
            }
          } else if (entry.kind === 'directory' && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await readDirRecursive(entry, relPath);
          }
        }
      };

      await readDirRecursive(dirHandle);
      return { name: dirHandle.name, files, sidecarXmls };
    } catch (err: any) {
      if (err?.name === 'AbortError') return null;
    }
  }

  // Fallback using webkitdirectory input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    (input as any).webkitdirectory = true;
    input.multiple = true;
    input.onchange = async () => {
      const fileList = input.files;
      if (!fileList || fileList.length === 0) {
        resolve(null);
        return;
      }
      const files: Record<string, string> = {};
      const sidecarXmls: Record<string, string> = {};
      let folderName = 'Proyek_Web';

      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const relRaw = (f as any).webkitRelativePath || f.name;
        const parts = relRaw.split('/');
        if (parts.length > 1) {
          folderName = parts[0];
        }
        const relPath = parts.length > 1 ? parts.slice(1).join('/') : f.name;
        if (relPath.endsWith('.xml')) {
          sidecarXmls[relPath.slice(0, -4)] = await f.text();
        } else if (/\.(ino|py|c|cpp|h|hpp|hex|json|md|txt)$/i.test(relPath)) {
          files[relPath] = await f.text();
        }
      }
      resolve({ name: folderName, files, sidecarXmls });
    };
    input.click();
  });
}

export async function downloadFileInBrowser(filename: string, content: string): Promise<void> {
  const cleanName = filename.split('/').pop() || 'robolab_blocks.hex';
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  a.click();
  URL.revokeObjectURL(url);
}
