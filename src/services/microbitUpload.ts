export class MicrobitReplUnavailableError extends Error {}

interface MicrobitSerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}

const encoder = new TextEncoder();
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export async function writeMicrobitProgram(port: MicrobitSerialPort, source: string) {
  const program = encoder.encode(source.replace(/\r\n/g, '\n'));
  if (!source.trim()) throw new Error('Program MicroPython kosong.');

  if (!port.readable || !port.writable) await port.open({ baudRate: 115200 });
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;
  let reading: Promise<void> | undefined;
  let response = '';
  let disconnected = false;
  try {
    reader = port.readable!.getReader();
    writer = port.writable!.getWriter();
    const input = reader;
    const decoder = new TextDecoder();
    reading = (async () => {
      try {
        while (true) {
          const frame = await input.read();
          if (frame.done) break;
          response += decoder.decode(frame.value, { stream: true });
        }
      } finally {
        disconnected = true;
      }
    })().catch(() => {});
    const send = (text: string) => writer!.write(encoder.encode(text));
    async function waitFor(pattern: RegExp, message: string, timeout = 4000) {
      const until = Date.now() + timeout;
      while (!pattern.test(response) && !disconnected && Date.now() < until) await pause(25);
      if (!pattern.test(response)) throw new Error(disconnected ? 'Board terputus saat upload.' : message);
    }

    await send('\r\x03\x03');
    await pause(150);
    response = '';
    await send('\r\x01');
    try {
      await waitFor(/raw REPL[^\r\n]*[\r\n]+>/i, 'MicroPython tidak merespons lewat serial.');
    } catch (error) {
      throw new MicrobitReplUnavailableError(error instanceof Error ? error.message : String(error));
    }

    async function run(command: string) {
      response = '';
      await send(command + '\x04');
      await waitFor(/^OK[\s\S]*?\x04[\s\S]*?\x04>/, 'micro:bit tidak mengonfirmasi penulisan main.py.');
      const [output, error] = response.slice(2).split('\x04');
      if (error) throw new Error(error.trim() || 'micro:bit gagal menulis main.py.');
      return output.trim();
    }

    // Small writes fit the serial buffer of both generations of micro:bit.
    await run("f=open('main.py','wb')\n");
    for (let offset = 0; offset < program.length; offset += 48) {
      const chunk = Array.from(program.subarray(offset, offset + 48), byte => '\\x' + byte.toString(16).padStart(2, '0')).join('');
      await run(`f.write(b'${chunk}')\n`);
    }
    const written = await run("f.close();f=open('main.py','rb');print(len(f.read()));f.close()\n");
    if (Number(written) !== program.length) throw new Error('Ukuran main.py di board berbeda dari kode yang dikirim.');

    response = '';
    await send('\x02');
    await waitFor(/>>> /, 'micro:bit belum kembali ke prompt MicroPython.');
    response = '';
    await send('\x04');
    await waitFor(/soft reboot/i, 'main.py tersimpan, tetapi micro:bit belum mengonfirmasi restart.');
    await pause(300);
    if (/Traceback|SyntaxError/.test(response)) throw new Error(response.trim());
  } finally {
    try { await reader?.cancel(); } catch {}
    await reading;
    reader?.releaseLock();
    writer?.releaseLock();
    await port.close().catch(() => {});
  }
}
