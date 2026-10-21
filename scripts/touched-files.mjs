import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

const git = (args) =>
  execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

const lines = (output) => output.split('\n').filter(Boolean);

export const resolveBase = () => {
  const baseRef = process.env.TOUCHED_BASE_REF ?? 'origin/main';
  try {
    return git(['merge-base', 'HEAD', baseRef]);
  } catch {
    return undefined;
  }
};

export const listTouchedSourceFiles = (base) =>
  [
    ...new Set([
      ...lines(git(['diff', '--name-only', '--diff-filter=ACMR', base])),
      ...lines(git(['ls-files', '--others', '--exclude-standard'])),
    ]),
  ]
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith('.d.ts'))
    .filter((file) => existsSync(join(repoRoot, file)))
    .sort();

export const readBaseVersion = (base, file) => {
  try {
    return git(['show', `${base}:${file}`]);
  } catch {
    return '';
  }
};
