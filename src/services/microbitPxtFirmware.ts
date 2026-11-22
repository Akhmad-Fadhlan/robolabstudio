import { isUniversalHex, separateUniversalHex } from '@microbit/microbit-universal-hex';
import { DeviceError, ProgressStage, type BoardVersion } from '@microbit/microbit-connection';
import { createUSBConnection } from '@microbit/microbit-connection/usb';

export function readPxtHex(payload: unknown): string {
  if (typeof payload !== 'string' || payload.length > 16 * 1024 * 1024) {
    throw new Error('PXT belum mengirim file HEX yang valid.');
  }
  const lines = payload.trim().split(/\r?\n/);
  let hasData = false;
  const allowedTypes = new Set([0, 1, 2, 3, 4, 5, 10, 11, 12, 13, 14]);
  for (const [index, line] of lines.entries()) {
    if (!/^:(?:[a-f\d]{2}){5,260}$/i.test(line) || Number.parseInt(line.slice(1, 3), 16) * 2 + 11 !== line.length) {
      throw new Error('Format rekaman HEX dari PXT tidak valid.');
    }
    const kind = Number.parseInt(line.slice(7, 9), 16);
    if (!allowedTypes.has(kind) || (kind === 1) !== (index === lines.length - 1)) {
      throw new Error('Urutan rekaman HEX dari PXT tidak valid.');
    }
    let checksum = 0;
    for (let start = 1; start < line.length; start += 2) checksum += Number.parseInt(line.slice(start, start + 2), 16);
    if (checksum % 256 !== 0) throw new Error('Checksum HEX dari PXT tidak valid.');
    if ((kind === 0 || kind === 13) && line.slice(1, 3) !== '00') hasData = true;
  }
  if (!hasData || lines.at(-1)?.toUpperCase() !== ':00000001FF') {
    throw new Error('File HEX dari PXT tidak berisi program yang lengkap.');
  }
  return lines.join('\n') + '\n';
}

export function selectPxtHexForBoard(firmware: string, board: BoardVersion): string {
  if (!isUniversalHex(firmware)) {
    throw new Error('HEX ini tidak mencantumkan versi board untuk WebUSB. Gunakan Unduh HEX, atau kompilasi sebagai Universal HEX.');
  }
  const acceptedIds = board === 'V1' ? [0x9900, 0x9901] : [0x9903, 0x9904, 0x9905, 0x9906];
  const part = separateUniversalHex(firmware).find(image => acceptedIds.includes(image.boardId));
  if (!part) throw new Error(`Program PXT ini tidak berisi firmware untuk micro:bit ${board}.`);
  return part.hex;
}

export async function uploadPxtHex(
  compile: () => Promise<string>,
  reportProgress: (percent: number) => void,
) {
  if (typeof navigator === 'undefined' || !('usb' in navigator)) {
    throw new Error('WebUSB tidak tersedia. Gunakan Chrome atau Edge, atau Unduh HEX.');
  }
  const connection = createUSBConnection({ pauseOnHidden: false });
  try {
    await connection.initialize();
    // The picker must run before compiling, while the user's click can authorize WebUSB.
    await connection.connect();
    reportProgress(10);
    const expectedBoard = connection.getBoardVersion();
    const hexForBoard = selectPxtHexForBoard(await compile(), expectedBoard);
    reportProgress(25);
    await connection.flash(async board => {
      if (board !== expectedBoard) throw new Error('Board berubah setelah kompilasi. Mulai ulang upload.');
      return hexForBoard;
    }, {
      partial: false,
      progress: (stage, value) => {
        if (stage === ProgressStage.FullFlashing && value !== undefined) reportProgress(25 + Math.round(value * 74));
      },
    });
    reportProgress(100);
    return expectedBoard;
  } catch (error) {
    if (error instanceof DeviceError && error.code === 'no-device-selected') {
      throw new Error('Pemilihan micro:bit dibatalkan. Klik Upload ke micro:bit untuk mencoba lagi.');
    }
    throw error;
  } finally {
    await connection.disconnect().catch(() => {});
    connection.dispose();
  }
}
