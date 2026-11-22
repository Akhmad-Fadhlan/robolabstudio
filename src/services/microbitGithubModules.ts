import { microbitModuleBudget, microbitModulePath, microbitModulesBytes } from './microbitModules';
import { parsePxtPackage } from './microbitPxt';

const maxFilesPerImport = 12;
const maxCandidates = 100;
const gitSha = /^[a-f\d]{40}$/i;

export type GithubPythonFile = { path: string; filename: string; sha: string; size: number };

export class GithubModuleImportError extends Error {}

async function githubJson(path: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`https://api.github.com/repos/${path}`, {
    signal,
    headers: { Accept: 'application/vnd.github+json' },
    credentials: 'omit',
  });
  if (response.status === 403 || response.status === 429) {
    throw new GithubModuleImportError('GitHub membatasi permintaan. Coba lagi nanti atau gunakan Impor file .py.');
  }
  if (response.status === 404) {
    throw new GithubModuleImportError('Repositori publik atau versi yang diminta tidak ditemukan.');
  }
  if (!response.ok) throw new GithubModuleImportError(`GitHub mengembalikan status ${response.status}.`);
  return response.json();
}

function objectValue(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export async function inspectMicrobitGithub(input: string, signal: AbortSignal) {
  const ref = parsePxtPackage(input);
  if (!ref) throw new GithubModuleImportError('Tempel URL repositori GitHub atau tulis pemilik/repo#versi.');
  const response = await githubJson(`${ref.repo}/git/trees/${encodeURIComponent(ref.tag || 'HEAD')}?recursive=1`, signal);
  if (!objectValue(response) || !Array.isArray(response.tree)) {
    throw new GithubModuleImportError('Daftar file GitHub tidak dapat dibaca.');
  }
  const candidates: GithubPythonFile[] = [];
  let pxt = false;
  for (const entry of response.tree) {
    if (!objectValue(entry) || entry.type !== 'blob' || entry.mode !== '100644' && entry.mode !== '100755' ||
        typeof entry.path !== 'string') continue;
    if (entry.path === 'pxt.json') pxt = true;
    const filename = entry.path.split('/').pop() || '';
    if (!microbitModulePath(filename) || filename.startsWith('__') ||
        /(?:^|\/)(?:tests?|examples?|docs?|demos?)(?:\/|$)|(?:^|\/)(?:setup|test_.+|.+_test)\.py$/i.test(entry.path)) continue;
    if (typeof entry.size !== 'number' || !Number.isInteger(entry.size) || entry.size <= 0 || entry.size > microbitModuleBudget ||
        typeof entry.sha !== 'string' || !gitSha.test(entry.sha)) continue;
    candidates.push({ path: entry.path, filename, size: entry.size, sha: entry.sha });
  }
  candidates.sort((a, b) => a.path.split('/').length - b.path.split('/').length || a.path.localeCompare(b.path));
  return { repo: ref.repo, candidates: candidates.slice(0, maxCandidates), pxt, truncated: response.truncated === true || candidates.length > maxCandidates };
}

export async function downloadGithubMicrobitModules(
  repository: string,
  selected: GithubPythonFile[],
  installed: Record<string, string>,
  signal: AbortSignal,
): Promise<[path: string, source: string][]> {
  const repo = parsePxtPackage(repository)?.repo;
  if (!repo || selected.length < 1 || selected.length > maxFilesPerImport) {
    throw new GithubModuleImportError(`Pilih antara 1 dan ${maxFilesPerImport} file .py.`);
  }
  const paths = new Set(Object.keys(installed).map(name => name.toLowerCase()));
  let total = microbitModulesBytes(installed);
  for (const file of selected) {
    if (!microbitModulePath(file.filename) || !gitSha.test(file.sha) || !Number.isInteger(file.size) || file.size < 1) {
      throw new GithubModuleImportError('Salah satu file GitHub tidak dapat dipasang.');
    }
    const name = file.filename.toLowerCase();
    if (paths.has(name)) throw new GithubModuleImportError(`Nama modul sudah dipakai: ${file.filename}.`);
    paths.add(name);
    total += file.size;
  }
  if (total > microbitModuleBudget) throw new GithubModuleImportError('Total pustaka melebihi batas 20 KB per proyek.');

  const files = await Promise.all(selected.map(async (file): Promise<[string, string]> => {
    const blob = await githubJson(`${repo}/git/blobs/${file.sha}`, signal);
    if (!objectValue(blob) || blob.sha !== file.sha || blob.encoding !== 'base64' ||
        typeof blob.content !== 'string' || blob.content.length > 30_000) {
      throw new GithubModuleImportError(`Isi ${file.filename} tidak dapat dibaca.`);
    }
    let source: string;
    try {
      const bytes = Uint8Array.from(atob(blob.content.replace(/\s/g, '')), char => char.charCodeAt(0));
      if (bytes.length !== file.size) throw Error('size');
      source = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      if (!source.trim() || source.includes('\0')) throw Error('text');
    } catch {
      throw new GithubModuleImportError(`${file.filename} harus berupa teks Python UTF-8.`);
    }
    return [microbitModulePath(file.filename)!, source];
  }));
  return files;
}
