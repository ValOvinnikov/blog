import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

import {
  listTouchedSourceFiles,
  repoRoot,
  resolveBase,
} from './touched-files.mjs';

const hasEslintConfig = (dir) =>
  readdirSync(dir).some((name) => name.startsWith('eslint.config.'));

const workspaceDirOf = (file) => {
  let dir = dirname(join(repoRoot, file));
  while (dir !== repoRoot && !hasEslintConfig(dir)) {
    dir = dirname(dir);
  }
  return dir === repoRoot ? undefined : dir;
};

const main = () => {
  const base = resolveBase();
  if (!base) {
    console.log(
      'No origin/main to diff against; skipping the touched-file lint.',
    );
    return;
  }
  const byWorkspace = new Map();
  for (const file of listTouchedSourceFiles(base)) {
    const workspace = workspaceDirOf(file);
    if (workspace) {
      byWorkspace.set(workspace, [
        ...(byWorkspace.get(workspace) ?? []),
        join(repoRoot, file),
      ]);
    }
  }
  const eslint = join(repoRoot, 'node_modules/.bin/eslint');
  let failed = false;
  for (const [workspace, files] of byWorkspace) {
    console.log(
      `Linting ${files.length} touched file(s) in ${relative(repoRoot, workspace)}`,
    );
    const { status } = spawnSync(eslint, ['--no-warn-ignored', ...files], {
      cwd: workspace,
      stdio: 'inherit',
      env: { ...process.env, BLOG_LINT_TOUCHED: '1' },
    });
    failed ||= status !== 0;
  }
  if (failed) {
    process.exit(1);
  }
};

main();
