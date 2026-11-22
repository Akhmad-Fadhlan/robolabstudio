import { MicropythonFsHex, microbitBoardId } from '@microbit/microbit-fs';

export function createMicrobitFilesystem(source: string, v1: string, v2: string, modules: Record<string, string> = {}) {
  const filesystem = new MicropythonFsHex([
    { boardId: microbitBoardId.V1, hex: v1 },
    { boardId: microbitBoardId.V2, hex: v2 },
  ]);
  for (const [filename, contents] of Object.entries(modules)) {
    filesystem.write(filename, contents.replace(/\r\n/g, '\n'));
  }
  if (source.length) filesystem.write('main.py', source.replace(/\r\n/g, '\n'));
  return filesystem;
}

export async function loadMicrobitFilesystem(source: string, modules: Record<string, string> = {}) {
  const [v1, v2] = await Promise.all(['v1', 'v2'].map(async version => {
    const response = await fetch(`${import.meta.env.BASE_URL}firmware/microbit/${version}.hex`);
    if (!response.ok) throw new Error(`Firmware micro:bit ${version} tidak dapat dimuat.`);
    return response.text();
  }));
  return createMicrobitFilesystem(source, v1, v2, modules);
}

export async function downloadMicrobitHex(source: string, modules: Record<string, string> = {}) {
  const filesystem = await loadMicrobitFilesystem(source, modules);
  const hex = filesystem.getUniversalHex();
  const url = URL.createObjectURL(new Blob([hex], { type: 'application/octet-stream' }));
  const download = document.createElement('a');
  download.href = url;
  download.download = 'robolab-microbit.hex';
  download.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
