import { parsePxtPackage } from './microbitPxt';

export const MICROBIT_PXT_ADAPTERS = {
  neopixel: 'microsoft/pxt-neopixel',
  sonar: 'microsoft/pxt-sonar',
  stopbit: 'kitronikltd/pxt-kitronik-stopbit',
  lampbit: 'kitronikltd/pxt-kitronik-lampbit',
  servo16: 'kitronikltd/pxt-kitronik-i2c-16-servo',
} as const;

export type NativePxtAdapter = keyof typeof MICROBIT_PXT_ADAPTERS;

const registeredPxtRepos = new Map(
  (Object.entries(MICROBIT_PXT_ADAPTERS) as [NativePxtAdapter, string][]).map(([id, repo]) => [repo, id]),
);

export function findNativePxtAdapter(input: string) {
  return registeredPxtRepos.get(parsePxtPackage(input)?.repo ?? '');
}

export function readNativePxtDependencies(source: string) {
  let manifest: unknown;
  try {
    manifest = JSON.parse(source);
  } catch {
    throw new Error('File pxt.json harus berisi JSON yang valid.');
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) ||
      !('dependencies' in manifest) || !manifest.dependencies ||
      typeof manifest.dependencies !== 'object' || Array.isArray(manifest.dependencies)) {
    throw new Error('Bagian dependencies tidak ditemukan di pxt.json.');
  }
  if ('supportedTargets' in manifest && Array.isArray(manifest.supportedTargets) &&
      manifest.supportedTargets.length > 0 && !manifest.supportedTargets.includes('microbit')) {
    throw new Error('Manifest ini tidak mendukung target BBC micro:bit.');
  }

  const adapters = new Set<NativePxtAdapter>();
  const unsupported = new Set<string>();
  for (const value of Object.values(manifest.dependencies)) {
    if (typeof value !== 'string') continue;
    const spec = value.trim();
    if (!/^(github:|https?:\/\/(?:www\.)?github\.com\/)/i.test(spec)) continue;
    const pkg = parsePxtPackage(spec);
    if (!pkg) {
      unsupported.add(spec.slice(0, 120));
      continue;
    }
    const adapter = registeredPxtRepos.get(pkg.repo);
    if (adapter) adapters.add(adapter);
    else unsupported.add(pkg.repo);
  }
  return { adapters: [...adapters], unsupported: [...unsupported] };
}

// Uses the Kitronik board at 0x6A. Initialization is local to the chip, with
// no I²C general-call reset or automatic movement of the other servos.
export const kitronikServo16Python = [
  '_robolab_servo16_ready = False',
  '',
  'def _robolab_servo16(channel, angle=None):',
  '    global _robolab_servo16_ready',
  '    address = 0x6A',
  '    if not 1 <= channel <= 16:',
  '        return',
  '    if not _robolab_servo16_ready:',
  '        i2c.write(address, bytes((0x00, 0x30)))  # SLEEP + auto-increment',
  '        i2c.write(address, bytes((0xFE, 125)))   # 50 Hz',
  '        i2c.write(address, bytes((0x01, 0x04)))  # output driver mode',
  '        i2c.write(address, bytes((0x00, 0x20)))  # oscillator on',
  '        sleep(1)',
  '        i2c.write(address, bytes((0x00, 0xA0)))  # restart PWM',
  '        _robolab_servo16_ready = True',
  '    register = 0x06 + 4 * (channel - 1)',
  '    if angle is None:',
  '        i2c.write(address, bytes((register, 0, 0, 0, 0x10)))',
  '        return',
  '    angle = max(0, min(180, angle))',
  '    duty = 102 + int(226 * angle / 100)',
  '    i2c.write(address, bytes((register, 0, 0, duty & 255, duty >> 8)))',
  '',
].join('\n') + '\n';
