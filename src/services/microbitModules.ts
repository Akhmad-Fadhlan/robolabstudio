const moduleFolder = 'python/lib/';
const moduleFilename = /^[A-Za-z_][A-Za-z0-9_]*\.py$/;
const reserved = new Set(['main', 'boot', 'microbit', 'machine', 'micropython', 'neopixel', 'radio', 'music', 'speech', 'audio', 'log', 'time', 'os', 'sys', 'random', 'math', 'utime', 'ustruct', 'struct']);

export function microbitModulePath(filename: string): string | null {
  if (filename.length > 80 || !moduleFilename.test(filename) || reserved.has(filename.slice(0, -3).toLowerCase())) return null;
  return moduleFolder + filename;
}

export function isMicrobitModulePath(path: string): boolean {
  return path.startsWith(moduleFolder) && microbitModulePath(path.slice(moduleFolder.length)) === path;
}

export function getMicrobitModules(files: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(files).flatMap(([path, source]) => {
      return isMicrobitModulePath(path) ? [[path.slice(moduleFolder.length), source]] : [];
    }),
  );
}

export const microbitModuleBudget = 20 * 1024;

export function microbitModulesBytes(modules: Record<string, string>) {
  const encoder = new TextEncoder();
  return Object.values(modules).reduce((sum, source) => sum + encoder.encode(source).length, 0);
}

export function getMicrobitDriverNames(source: string) {
  const names = new Set<string>();
  // This detects common single-file drivers. The generic call block handles other layouts.
  const withoutMultilineStrings = source.replace(/"""[\s\S]*?"""|'''[\s\S]*?'''/g, '');
  for (const [, name] of withoutMultilineStrings.matchAll(/^(?:def|class)[ \t]+([A-Za-z][A-Za-z0-9_]*)[ \t]*(?:\(|:)/gm)) {
    names.add(name);
    if (names.size === 8) break;
  }
  return [...names];
}
