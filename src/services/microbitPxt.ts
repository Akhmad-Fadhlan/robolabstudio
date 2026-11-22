export const pxtOrigin = 'https://makecode.microbit.org';
export const pxtEditorUrl = `${pxtOrigin}/?controller=1#editor`;

const repoPattern = /^[a-z\d][a-z\d-]*\/[a-z\d_][a-z\d_.-]*$/i;
const tagPattern = /^[a-z\d][a-z\d_.-]{0,95}$/i;

export function parsePxtPackage(input: string) {
  const [path, tag, ...extra] = input.trim().replace(/^github:/i, '')
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '').split('?')[0].split('#');
  const repo = path.replace(/\/$/, '').replace(/\.git$/i, '').toLowerCase();
  if (!repoPattern.test(repo) || extra.length || (tag && !tagPattern.test(tag))) return null;
  return { repo, tag, spec: `github:${repo}${tag ? `#${tag}` : ''}` };
}

export type PxtProject = {
  header: Record<string, unknown> & { id: string; editor: string; target: 'microbit' };
  text: Record<string, string>;
};

function isPxtProject(value: unknown): value is PxtProject {
  if (!value || typeof value !== 'object' || !('header' in value) || !('text' in value)) return false;
  const { header, text } = value;
  return Boolean(header && typeof header === 'object' && 'target' in header && header.target === 'microbit' &&
    'id' in header && typeof header.id === 'string' && 'editor' in header && typeof header.editor === 'string' &&
    text && typeof text === 'object' && !Array.isArray(text) &&
    Object.values(text).every(file => typeof file === 'string') && Object.hasOwn(text, 'pxt.json'));
}

export function readPxtProject(key: string): PxtProject | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return isPxtProject(value) ? value : null;
  } catch {
    return null;
  }
}

export function savePxtProject(key: string, value: unknown): PxtProject | null {
  if (!isPxtProject(value)) return null;
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function newPxtProject(): PxtProject {
  const name = 'RoboLab micro:bit';
  const time = Math.floor(Date.now() / 1000);
  return {
    header: {
      id: crypto.randomUUID(), name, target: 'microbit', editor: 'blocksprj',
      meta: {}, pubId: '', pubCurrent: false, recentUse: time, modificationTime: time,
    },
    text: {
      'main.blocks': '<xml xmlns="https://developers.google.com/blockly/xml"><block type="pxt-on-start" x="0" y="0"></block></xml>',
      'main.ts': '\n',
      'README.md': '',
      'pxt.json': JSON.stringify({
        name, dependencies: { core: '*', radio: '*', microphone: '*' },
        files: ['main.blocks', 'main.ts', 'README.md'],
      }, null, 2),
    },
  };
}

export async function addPxtPackage(project: PxtProject, input: string, signal: AbortSignal): Promise<PxtProject> {
  const dependency = parsePxtPackage(input);
  if (!dependency) throw new Error('Gunakan URL repositori GitHub atau nama pemilik/repo.');
  const manifestUrl = `https://raw.githubusercontent.com/${dependency.repo}/${dependency.tag || 'HEAD'}/pxt.json`;
  const response = await fetch(manifestUrl, { signal });
  if (!response.ok) throw new Error('Manifest pxt.json tidak ditemukan pada repositori atau tag ini.');
  const manifest = await response.json();
  const name = manifest?.name;
  if (typeof name !== 'string' || !/^[a-z\d][a-z\d_.-]{0,95}$/i.test(name) ||
      Reflect.has(Object.prototype, name) || ['core', 'radio', 'microphone', 'base'].includes(name.toLowerCase()) ||
      !Array.isArray(manifest.files) || !manifest.files.every((file: unknown) => typeof file === 'string')) {
    throw new Error('Repositori ini tidak menyediakan manifest ekstensi PXT yang valid.');
  }
  if (Array.isArray(manifest.supportedTargets) && !manifest.supportedTargets.includes('microbit')) {
    throw new Error('Ekstensi ini tidak mendukung target micro:bit.');
  }
  const config = JSON.parse(project.text['pxt.json']);
  const dependencies: Record<string, string> = { ...config.dependencies };
  for (const [key, spec] of Object.entries(dependencies)) {
    if (key !== name && typeof spec === 'string' && parsePxtPackage(spec)?.repo === dependency.repo) delete dependencies[key];
  }
  if (Object.hasOwn(dependencies, name) && parsePxtPackage(dependencies[name])?.repo !== dependency.repo) {
    throw new Error(`Nama ekstensi "${name}" sudah dipakai paket lain di proyek ini.`);
  }
  return {
    header: { ...project.header, modificationTime: Math.floor(Date.now() / 1000) },
    text: {
      ...project.text,
      'pxt.json': JSON.stringify({ ...config, dependencies: { ...dependencies, [name]: dependency.spec } }, null, 2),
    },
  };
}

export function pxtPythonSource(project: PxtProject | null): string | undefined {
  return project?.header.editor === 'pyprj' ? project.text['main.py'] : undefined;
}
