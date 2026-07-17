// pnpm `preinstall` guard for shared-deps agent worktrees.
//
// `.husky/post-checkout` symlinks a new worktree's root node_modules to the
// primary checkout's copy. pnpm follows that symlink, so an install run inside
// such a worktree would prune and rewrite the PRIMARY checkout's dependencies.
// pnpm runs this script before it links anything, so failing here keeps the
// primary checkout intact. In the primary checkout (and on CI/Vercel)
// node_modules is a real directory and this is a no-op.
import { lstatSync } from 'node:fs';

let sharesMainNodeModules = false;
try {
  sharesMainNodeModules = lstatSync(
    new URL('../node_modules', import.meta.url),
  ).isSymbolicLink();
} catch {
  // No node_modules yet — a fresh, private install is fine.
}

if (sharesMainNodeModules) {
  console.error(
    [
      '',
      "This worktree shares the primary checkout's node_modules via a symlink;",
      "an install here would mutate the primary checkout's dependencies.",
      '',
      'To change dependencies on this branch, give the worktree a private tree:',
      '  rm node_modules   # removes only the symlink, not its target',
      '  pnpm install',
      '',
      'See README.md § "Working with Claude Code".',
    ].join('\n'),
  );
  process.exit(1);
}
