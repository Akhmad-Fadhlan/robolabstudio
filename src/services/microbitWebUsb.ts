import { microbitBoardId } from '@microbit/microbit-fs';
import { DeviceError, ProgressStage } from '@microbit/microbit-connection';
import { createUSBConnection } from '@microbit/microbit-connection/usb';
import { loadMicrobitFilesystem } from './microbitHex';

export function canFlashMicrobitViaUsb() {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

export async function flashMicrobitViaUsb(source: string, reportProgress?: (percent: number) => void) {
  const connection = createUSBConnection({ pauseOnHidden: false });
  try {
    await connection.initialize();
    // Ask for the device before starting any network requests for the firmware.
    await connection.connect();
    reportProgress?.(20);
    const filesystem = await loadMicrobitFilesystem(source);
    await connection.flash(async version => filesystem.getIntelHex(microbitBoardId[version]), {
      partial: true,
      progress: (stage, value) => {
        if (value !== undefined && (stage === ProgressStage.PartialFlashing || stage === ProgressStage.FullFlashing)) {
          reportProgress?.(20 + Math.round(value * 79));
        }
      },
    });
    reportProgress?.(100);
  } catch (error) {
    if (error instanceof DeviceError && error.code === 'no-device-selected') {
      throw new Error('Pemilihan micro:bit dibatalkan. Klik Upload untuk mencoba lagi.');
    }
    throw error;
  } finally {
    await connection.disconnect().catch(() => {});
    connection.dispose();
  }
}
