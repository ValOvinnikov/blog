import path from 'node:path';

// Assumes invocation via `pnpm --filter @blog/db db:provision-tenant` (pnpm
// always runs a filtered script with cwd = that package's directory) —
// never invoke this script's entrypoint directly with `tsx` from an
// arbitrary cwd, or this resolves the wrong root.
export const REPO_ROOT = path.resolve(process.cwd(), '..', '..');
