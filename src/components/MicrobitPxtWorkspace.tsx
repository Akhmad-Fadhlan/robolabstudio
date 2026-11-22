import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  addPxtPackage, newPxtProject, pxtEditorUrl, pxtOrigin, pxtPythonSource,
  readPxtProject, savePxtProject, type PxtProject,
} from '../services/microbitPxt';

type PendingRequest = { resolve: () => void; reject: (error: Error) => void; timer: number };

export function MicrobitPxtWorkspace({ scope, dependency, onClose }: {
  scope: string;
  dependency: string | null;
  onClose: () => void;
}) {
  const storageKey = `robolab_microbit_pxt_${scope}`;
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const project = useRef<PxtProject | null>(null);
  const requests = useRef(new Map<string, PendingRequest>());
  const conversion = useRef<number | null>(null);
  const [frameVisible, setFrameVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [pythonReady, setPythonReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Memuat ruang kerja PXT…');
  const [error, setError] = useState('');
  const closing = useRef(false);

  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => { if (node?.open) node.close(); };
  }, []);

  useEffect(() => {
    const request = new AbortController();
    const init = async () => {
      const initial = readPxtProject(storageKey) ?? newPxtProject();
      project.current = initial;
      if (dependency) {
        try {
          project.current = await addPxtPackage(initial, dependency, AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]));
        } catch (err) {
          if (!request.signal.aborted) setError(err instanceof Error ? err.message : 'Manifest ekstensi tidak dapat dimuat.');
        }
      }
      if (!request.signal.aborted) setFrameVisible(true);
    };

    const loadTimer = window.setTimeout(() => {
      setMessage('PXT belum merespons. Periksa koneksi internet atau tutup lalu buka kembali.');
    }, 25_000);
    const receive = (event: MessageEvent) => {
      const target = frame.current?.contentWindow;
      if (!target || event.source !== target || event.origin !== pxtOrigin) return;
      const data = event.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'pxteditor' && typeof data.id === 'string') {
        const pending = requests.current.get(data.id);
        if (pending) {
          requests.current.delete(data.id);
          window.clearTimeout(pending.timer);
          if (data.success) pending.resolve();
          else pending.reject(new Error('PXT tidak dapat menyelesaikan perintah.'));
        }
        return;
      }
      if (data.type !== 'pxthost') return;
      const reply = (fields: Record<string, unknown> = {}) => target.postMessage({
        type: 'pxthost', id: data.id, success: true, ...fields,
      }, pxtOrigin);
      if (data.action === 'workspacesync') {
        reply({ projects: project.current ? [project.current] : [], controllerId: 'robolab-studio' });
        return;
      }
      if (data.action === 'workspacesave') {
        try {
          const saved = savePxtProject(storageKey, data.project);
          if (saved) {
            project.current = saved;
            const hasPython = pxtPythonSource(saved) !== undefined;
            setPythonReady(hasPython);
            if (hasPython && conversion.current !== null) {
              window.clearTimeout(conversion.current);
              conversion.current = null;
              setBusy(false);
              setMessage('Python MakeCode siap diunduh.');
            }
          }
        } catch {
          setError('Proyek PXT tidak dapat disimpan di penyimpanan browser.');
        }
      }
      if (data.action === 'editorcontentloaded') {
        window.clearTimeout(loadTimer);
        setReady(true);
        setPythonReady(pxtPythonSource(project.current) !== undefined);
        setMessage('Gunakan blok ekstensi, lalu pilih Ubah ke Python untuk melihat hasilnya.');
      }
      if (data.response && typeof data.id === 'string') reply();
    };
    window.addEventListener('message', receive);
    void init();
    const pendingRequests = requests.current;
    return () => {
      request.abort();
      window.removeEventListener('message', receive);
      window.clearTimeout(loadTimer);
      if (conversion.current !== null) window.clearTimeout(conversion.current);
      conversion.current = null;
      for (const pending of pendingRequests.values()) {
        window.clearTimeout(pending.timer);
        pending.reject(new Error('Ruang kerja PXT ditutup.'));
      }
      pendingRequests.clear();
    };
  }, [dependency, storageKey]);

  const send = (action: 'switchpython' | 'saveproject', timeout = 7_000) => new Promise<void>((resolve, reject) => {
    const target = frame.current?.contentWindow;
    if (!target) { reject(new Error('Ruang kerja PXT belum siap.')); return; }
    const id = crypto.randomUUID();
    const timer = window.setTimeout(() => {
      requests.current.delete(id);
      reject(new Error('PXT belum mengonfirmasi perintah. Coba kembali.'));
    }, timeout);
    requests.current.set(id, { resolve, reject, timer });
    target.postMessage({ type: 'pxteditor', id, action, response: true }, pxtOrigin);
  });

  const convert = async () => {
    setBusy(true);
    setPythonReady(false);
    setMessage('Menunggu hasil konversi dari PXT…');
    try {
      await send('saveproject');
      if (pxtPythonSource(project.current) !== undefined) {
        setPythonReady(true);
        setBusy(false);
        setMessage('Python MakeCode siap diunduh.');
        return;
      }
      // The switch reply is an acknowledgement. Keep waiting for a confirmed saved Python view.
      conversion.current = window.setTimeout(() => {
        conversion.current = null;
        setBusy(false);
        setMessage('PXT belum menghasilkan Python. Periksa pesan atau kesalahan kode di editor.');
      }, 20_000);
      await send('switchpython');
      while (conversion.current !== null) {
        await new Promise<void>(resolve => window.setTimeout(resolve, 1_200));
        if (conversion.current !== null) await send('saveproject', 3_000);
      }
    } catch (err) {
      if (conversion.current !== null) window.clearTimeout(conversion.current);
      conversion.current = null;
      setBusy(false);
      setMessage(err instanceof Error ? err.message : 'Konversi Python gagal.');
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      await send('saveproject');
      const source = pxtPythonSource(project.current);
      if (source === undefined) throw new Error('Buka tampilan Python PXT terlebih dahulu.');
      const url = URL.createObjectURL(new Blob([source], { type: 'text/x-python;charset=utf-8' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'main.makecode.py';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'File Python gagal dibuat.');
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (closing.current) return;
    closing.current = true;
    try {
      if (ready) {
        setMessage('Menyimpan proyek PXT…');
        await send('saveproject', 1_500);
      }
    } catch {
      // Keep the last autosave if the editor is no longer responding.
    }
    onClose();
  };

  return createPortal(
    <dialog ref={dialog} aria-labelledby="pxt-workspace-title"
      onCancel={event => { event.preventDefault(); void close(); }}
      className="fixed inset-0 m-auto h-[94dvh] max-h-[94dvh] w-[min(98vw,1440px)] max-w-none rounded-xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/70">
      <div className="flex h-full flex-col">
        <header className="space-y-2 border-b border-slate-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="pxt-workspace-title" className="font-bold">Ruang kerja micro:bit PXT</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={!ready || busy} onClick={() => void convert()} className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm text-white disabled:opacity-50">Ubah ke Python</button>
              <button type="button" disabled={!pythonReady || busy} onClick={() => void download()} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50">Unduh .py</button>
              <button type="button" onClick={() => void close()} className="rounded-lg border px-3 py-1.5 text-sm">Tutup</button>
            </div>
          </div>
          <p className="text-xs text-slate-600">Kode hasil konversi memakai Python MakeCode. Gunakan Download di ruang kerja PXT untuk membuat HEX, atau gunakan editor MicroPython RoboLab untuk proyek MicroPython.</p>
          <p role="status" className="text-xs text-slate-700">{message}</p>
          {error && <p role="alert" className="text-xs text-rose-800">{error}</p>}
        </header>
        {frameVisible && <iframe ref={frame} title="Editor Microsoft MakeCode untuk micro:bit" src={pxtEditorUrl}
          sandbox="allow-scripts allow-same-origin allow-downloads allow-forms allow-modals"
          referrerPolicy="no-referrer" className="min-h-0 w-full flex-1 border-0" />}
      </div>
    </dialog>, document.body,
  );
}
