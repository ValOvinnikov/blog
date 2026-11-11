import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  listTouchedSourceFiles,
  repoRoot,
  resolveBase,
} from './touched-files.mjs';

const REPORT = 'jscpd-report.json';
const MIN_TOKENS = '60';
const MIN_LINES = '8';
const IGNORED = '**/node_modules/**,**/generated/**,**/.next/**';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const runJscpd = (jscpd, workspaces) => {
  const output = mkdtempSync(join(tmpdir(), 'check-clones-'));
  try {
    const { status } = spawnSync(
      jscpd,
      [
        '--min-tokens',
        MIN_TOKENS,
        '--min-lines',
        MIN_LINES,
        '--ignore',
        IGNORED,
        '--gitignore',
        '--reporters',
        'json',
        '--output',
        output,
        '--silent',
        ...workspaces,
      ],
      { cwd: repoRoot, stdio: 'inherit' },
    );
    const report = join(output, REPORT);
    if (status !== 0 || !existsSync(report)) {
      fail(`jscpd exited ${status} without a report.`);
    }
    return JSON.parse(readFileSync(report, 'utf8')).duplicates;
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
};

const main = () => {
  const jscpd = join(repoRoot, 'node_modules/.bin/jscpd');
  if (!existsSync(jscpd)) {
    fail('jscpd is not installed; run pnpm install first.');
  }
  const base = resolveBase();
  if (!base) {
    fail('No origin/main to diff against; cannot pick the touched files.');
  }
  const touched = new Set(listTouchedSourceFiles(base));
  const workspaces = [
    ...new Set(
      [...touched].map((file) => file.split('/').slice(0, 2).join('/')),
    ),
  ];
  if (workspaces.length === 0) {
    console.log('No touched .ts/.tsx files; nothing to scan for clones.');
    return;
  }
  const clones = runJscpd(jscpd, workspaces).filter(
    ({ firstFile, secondFile }) =>
      touched.has(firstFile.name) || touched.has(secondFile.name),
  );
  for (const { lines, firstFile, secondFile } of clones) {
    console.log(
      `${firstFile.name}:${firstFile.start}-${firstFile.end} ≈ ${secondFile.name}:${secondFile.start}-${secondFile.end} (${lines} lines)`,
    );
  }
  console.log(
    `${clones.length} clone(s) involving a touched file across ${workspaces.join(', ')}.`,
  );
};

main();
