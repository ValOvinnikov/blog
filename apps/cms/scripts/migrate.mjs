#!/usr/bin/env node
/**
 * Migration helper — track the migration you're working on once, then dry-run /
 * run / export against a chosen dataset without retyping ids. Also usable
 * non-interactively from a deployment pipeline.
 *
 *   pnpm --filter cms migrate:new <name>       # scaffold a new migration (or
 *                                              # reuse the existing one), track it
 *   pnpm --filter cms migrate:track [name]     # set current (defaults to newest)
 *   pnpm --filter cms migrate:current          # print the current migration
 *   pnpm --filter cms migrate:dry [name]       # dry-run (read-only) current-or-name
 *   pnpm --filter cms migrate:run [name] [--yes]
 *                                              # apply (--no-dry-run) current-or-name;
 *                                              # --yes (or CI=true) skips the prompt
 *   pnpm --filter cms dataset:export [dest]    # export the dataset to a tarball
 *
 * Dataset: read from `SANITY_STUDIO_DATASET` (falls back to `production`), so you
 * can target e.g. a `development` dataset with
 * `SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:dry`. The resolved
 * dataset is printed before every command.
 *
 * Target resolution: explicit [name] → tracked id in `migrations/.current` →
 * newest migration folder. Applying to `production` mutates data — keep it
 * human-gated unless a deploy pipeline runs it deliberately (after a backup).
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(cmsDir, 'migrations');
const stateFile = join(migrationsDir, '.current');
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const template = (name) => `import { defineMigration } from 'sanity/migrate';

export default defineMigration({
  title: '${name}',
  // documentTypes: ['<type>'],
  migrate: {
    // Fill in the transform. See ../README.md and the existing migrations for
    // examples (at/set/unset, createIfNotExists, …).
    document() {
      return [];
    },
  },
});
`;

const listMigrations = () =>
  readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'backups')
    .map((entry) => entry.name);

const newestMigration = () => {
  const names = listMigrations();
  if (names.length === 0) return undefined;
  return names
    .map((name) => ({
      name,
      mtimeMs: statSync(join(migrationsDir, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs)[0].name;
};

const trackedMigration = () => {
  if (!existsSync(stateFile)) return undefined;
  const value = readFileSync(stateFile, 'utf8').trim();
  return value === '' ? undefined : value;
};

const resolveTarget = (explicit) =>
  explicit ?? trackedMigration() ?? newestMigration();

const track = (id) => {
  writeFileSync(stateFile, `${id}\n`);
  console.log(`Tracking migration: ${id}`);
};

const assertExists = (id) => {
  const available = listMigrations();
  if (!id || !available.includes(id)) {
    fail(
      `Migration "${id ?? '(none)'}" not found. Available: ${
        available.join(', ') || '(none)'
      }`,
    );
  }
};

const runSanity = (commandArgs) => {
  execFileSync('pnpm', ['exec', 'sanity', ...commandArgs], {
    cwd: cmsDir,
    stdio: 'inherit',
  });
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [command, name] = args.filter((a) => !a.startsWith('--'));
const nonInteractive = flags.has('--yes') || process.env.CI === 'true';

switch (command) {
  case 'new': {
    if (!name) fail('Usage: migrate new <name>');
    const indexFile = join(migrationsDir, name, 'index.ts');
    if (existsSync(indexFile)) {
      console.log(`Migration "${name}" already exists — tracking it.`);
    } else {
      mkdirSync(join(migrationsDir, name), { recursive: true });
      writeFileSync(indexFile, template(name));
      console.log(`Created migration: ${name}`);
    }
    track(name);
    break;
  }
  case 'track': {
    const id = name ?? newestMigration();
    assertExists(id);
    track(id);
    break;
  }
  case 'current': {
    console.log(resolveTarget() ?? '(none tracked)');
    break;
  }
  case 'dry': {
    const id = resolveTarget(name);
    assertExists(id);
    console.log(`Dry-run (read-only) "${id}" against dataset "${dataset}"`);
    // Dataset comes from sanity.cli.ts (SANITY_STUDIO_DATASET); `migrations run`
    // defaults to the CLI-config dataset, and passing --dataset alone is
    // rejected (the CLI requires --dataset and --project together).
    runSanity(['migrations', 'run', id]);
    break;
  }
  case 'run': {
    const id = resolveTarget(name);
    assertExists(id);
    console.log(`Run (mutates) "${id}" against dataset "${dataset}"`);
    runSanity([
      'migrations',
      'run',
      id,
      '--no-dry-run',
      ...(nonInteractive ? ['--no-confirm'] : []),
    ]);
    break;
  }
  case 'export': {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = name ?? `migrations/backups/${dataset}-${stamp}.tar.gz`;
    console.log(`Exporting dataset "${dataset}" -> ${dest}`);
    runSanity(['datasets', 'export', dataset, dest]);
    break;
  }
  default:
    fail('Usage: migrate <new|track|current|dry|run|export> [name] [--yes]');
}
