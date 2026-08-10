#!/usr/bin/env node
/**
 * Regenerate Sanity types into `@blog/config` — two `sanity` CLI steps run
 * in sequence: `schema extract` (writes schema.json into the generated dir)
 * then `typegen generate` (reads it back out to produce types.ts). Kept as
 * one script, not a bare `&&` in package.json, so a failure in either step
 * fails loudly with its own labeled log line instead of a single opaque
 * inline command.
 *
 *   pnpm --filter cms typegen
 *
 * Invoked by the root `pnpm typegen` (`turbo run typegen`) — see
 * `turbo.json`'s `typegen` task for the cache/env/outputs config.
 */
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = join(
  cmsDir,
  '../../packages/config/src/sanity/generated/schema.json',
);

const runSanity = (args) => {
  execFileSync('pnpm', ['exec', 'sanity', ...args], {
    cwd: cmsDir,
    stdio: 'inherit',
  });
};

console.log(`Extracting schema -> ${schemaPath}`);
runSanity(['schema', 'extract', '--path', schemaPath, '--force']);

console.log('Generating types from extracted schema...');
runSanity(['typegen', 'generate']);

console.log('Typegen complete.');
