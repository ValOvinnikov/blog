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

const baseRef = () => process.env.TOUCHED_BASE_REF ?? 'origin/main';

export const resolveBase = () => {
  try {
    return git(['merge-base', 'HEAD', baseRef()]);
  } catch {
    return undefined;
  }
};

export const missingBaseMessage = () =>
  `No merge-base between HEAD and ${baseRef()}, so the touched files are unknown. Run \`git fetch origin main\` (with \`--unshallow\` in a shallow clone) and retry.`;

export const readAtBase = (base, file) => {
  try {
    return git(['show', `${base}:${file}`]);
  } catch {
    return undefined;
  }
};

const PURE_MOVE = 'R100';

export const listTouchedChanges = (base) => {
  const touched = new Map();
  const moves = new Map();
  for (const line of lines(
    git(['diff', '--name-status', '-M', '--diff-filter=AMR', base]),
  )) {
    const [status, from, to] = line.split('\t');
    if (status.startsWith('R')) {
      moves.set(from, to);
      if (status !== PURE_MOVE) touched.set(to, from);
    } else {
      touched.set(from, from);
    }
  }
  return { touched, moves };
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
