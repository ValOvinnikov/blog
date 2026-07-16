#!/usr/bin/env node
/**
 * Migration helper — track the migration you're working on once, then dry-run /
 * run / export against a chosen dataset without retyping ids. Also usable
 * non-interactively from a deployment pipeline.
 *
 *   pnpm --filter cms migrate:new <name>       # scaffold a new, timestamped
 *                                              # migration (or reuse a matching
 *                                              # existing one), track it
 *   pnpm --filter cms migrate:track [name]     # set current (defaults to newest)
 *   pnpm --filter cms migrate:current          # print the current migration
 *   pnpm --filter cms migrate:dry [name]       # dry-run (read-only) current-or-name
 *   pnpm --filter cms migrate:run [name] [--yes]
 *                                              # apply (--no-dry-run) current-or-name;
 *                                              # --yes (or CI=true) skips the prompt
 *   pnpm --filter cms migrate:deploy [--yes]   # run every UN-APPLIED migration, in
 *                                              # order (dry-run -> run -> record in the
 *                                              # per-dataset `migrationState` ledger);
 *                                              # a second run is a no-op
 *   pnpm --filter cms migrate:backfill [--yes] # record every current folder migration
 *                                              # as applied WITHOUT running it (one-time,
 *                                              # per dataset — see migrations/README.md)
 *   pnpm --filter cms dataset:export [dest]    # export the dataset to a tarball
 *
 * Dataset: read from `SANITY_STUDIO_DATASET` (falls back to `production`), so you
 * can target e.g. a `development` dataset with
 * `SANITY_STUDIO_DATASET=development pnpm --filter cms migrate:dry`. The resolved
 * dataset is printed before every command.
 *
 * Target resolution: explicit [name] → tracked id in `migrations/.current` →
 * newest migration folder (see `scripts/migrate-lib.mjs` for id ordering).
 * Applying to `production` mutates data — keep it human-gated unless a deploy
 * pipeline runs it deliberately (after a backup).
 *
 * `migrate:deploy` / `migrate:backfill` additionally read/write the
 * `migrationState` ledger document via `@sanity/client`, authenticated with
 * `SANITY_AUTH_TOKEN` (falls back to `SANITY_DEPLOY_TOKEN`) — a write token,
 * unlike the read-only CLI login session `dry`/`run`/`export` rely on. That
 * ledger is a system document, not a Studio schema type — it is never part of
 * typegen.
 */
import { createClient } from '@sanity/client';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

import {
  appliedIdsFromLedger,
  buildLedgerEntry,
  computePending,
  slugify,
  slugOf,
  sortMigrationIds,
  timestampedId,
} from './migrate-lib.mjs';

const cmsDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = join(cmsDir, 'migrations');
const stateFile = join(migrationsDir, '.current');
const dataset = process.env.SANITY_STUDIO_DATASET ?? 'production';

const LEDGER_ID = 'migrationState';
const LEDGER_TYPE = 'migrationState';
// Pinned so the client's request-building behavior doesn't silently drift.
const LEDGER_API_VERSION = '2024-08-01';

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
  const ids = sortMigrationIds(listMigrations());
  return ids.length === 0 ? undefined : ids[ids.length - 1];
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

const gitSha = () => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: cmsDir })
      .toString()
      .trim();
  } catch {
    // No git checkout available (e.g. a tarball) — the ledger entry just
    // omits `sha`, which stays optional in the shape.
    return undefined;
  }
};

const requireEnv = (name, value) => {
  if (!value) {
    fail(
      `Missing required env ${name}. Set it locally (apps/cms/.env) or as a ` +
        `GitHub Actions / deploy environment variable.`,
    );
  }
  return value;
};

const writeToken = () =>
  process.env.SANITY_AUTH_TOKEN ?? process.env.SANITY_DEPLOY_TOKEN;

/**
 * A `@sanity/client` authenticated for reading/writing the `migrationState`
 * ledger. Distinct from `dry`/`run`/`export`, which shell out to the `sanity`
 * CLI and rely on its own login session — the ledger needs an explicit write
 * token because it's a plain API call, not a CLI-mediated one.
 */
const ledgerClient = () => {
  const projectId = requireEnv(
    'SANITY_STUDIO_PROJECT_ID',
    process.env.SANITY_STUDIO_PROJECT_ID,
  );
  const token = writeToken();
  if (!token) {
    fail(
      'Missing a write token for the migrationState ledger. Set SANITY_AUTH_TOKEN ' +
        '(or SANITY_DEPLOY_TOKEN) to a token with write access to dataset ' +
        `"${dataset}".`,
    );
  }
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: LEDGER_API_VERSION,
    useCdn: false,
  });
};

const readLedger = async (client) => {
  const doc = await client.fetch('*[_id == $id][0]', { id: LEDGER_ID });
  return doc ?? { _id: LEDGER_ID, _type: LEDGER_TYPE, applied: [] };
};

/** Append entries to the ledger's `applied[]` in one transactional patch. */
const appendLedgerEntries = async (client, entries) => {
  await client.createIfNotExists({
    _id: LEDGER_ID,
    _type: LEDGER_TYPE,
    applied: [],
  });
  await client
    .patch(LEDGER_ID)
    .setIfMissing({ applied: [] })
    .append('applied', entries)
    .commit();
};

const confirm = async (message) => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  try {
    const answer = await rl.question(`${message} (y/N) `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
};

/**
 * `migrate:deploy` — run every migration not yet recorded in the
 * `migrationState` ledger, in order: dry-run (any error throws and aborts the
 * whole job), then run (`--no-dry-run --no-confirm`), then append
 * `{id, runAt, sha}` to the ledger before moving to the next one. A second
 * run with nothing new is a no-op (exit 0) — safe to call on every deploy.
 *
 * `migrate:backfill` (same command, `--backfill`) records every currently
 * pending folder migration as applied WITHOUT running it — for migrations
 * that were already run manually before this tooling tracked a ledger.
 */
const runDeploy = async ({ backfill, nonInteractive }) => {
  console.log(`Resolved dataset: "${dataset}"`);

  const folderIds = listMigrations();
  if (folderIds.length === 0) {
    console.log('No migrations in migrations/ — nothing to deploy.');
    return;
  }

  const client = ledgerClient();
  const ledger = await readLedger(client);
  const applied = appliedIdsFromLedger(ledger);
  const pending = computePending(folderIds, applied);

  if (pending.length === 0) {
    console.log(
      `Ledger up to date for dataset "${dataset}" — no pending migrations.`,
    );
    return;
  }

  console.log(
    `${pending.length} pending migration(s) for dataset "${dataset}": ${pending.join(', ')}`,
  );

  if (backfill) {
    if (!nonInteractive) {
      const ok = await confirm(
        `Backfill will mark ${pending.length} migration(s) as applied WITHOUT ` +
          `running them, against dataset "${dataset}". Continue?`,
      );
      if (!ok) fail('Aborted.');
    }
    const runAt = new Date().toISOString();
    const sha = gitSha();
    const entries = pending.map((id) => buildLedgerEntry(id, { runAt, sha }));
    await appendLedgerEntries(client, entries);
    console.log(
      `Backfilled ${entries.length} migration(s) into the ledger for dataset "${dataset}".`,
    );
    return;
  }

  if (!nonInteractive) {
    const ok = await confirm(
      `About to dry-run then apply ${pending.length} migration(s) non-interactively ` +
        `against dataset "${dataset}". Continue?`,
    );
    if (!ok) fail('Aborted.');
  }

  for (const id of pending) {
    console.log(`Dry-run "${id}" against dataset "${dataset}"`);
    // Any error here throws (execFileSync) and aborts the whole job — the
    // ledger stays accurate up to the last successfully-applied migration.
    runSanity(['migrations', 'run', id]);

    console.log(`Run (mutates) "${id}" against dataset "${dataset}"`);
    runSanity(['migrations', 'run', id, '--no-dry-run', '--no-confirm']);

    const entry = buildLedgerEntry(id, {
      runAt: new Date().toISOString(),
      sha: gitSha(),
    });
    await appendLedgerEntries(client, [entry]);
    console.log(`Recorded "${id}" in the migrationState ledger.`);
  }

  console.log(
    `Deployed ${pending.length} migration(s) to dataset "${dataset}".`,
  );
};

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [command, name] = args.filter((a) => !a.startsWith('--'));
const nonInteractive = flags.has('--yes') || process.env.CI === 'true';

const main = async () => {
  switch (command) {
    case 'new': {
      if (!name) fail('Usage: migrate new <name>');
      // Reuse a matching migration regardless of when it was created, so
      // re-running `migrate:new` with the same name never creates a
      // duplicate — it just tracks the existing one (same as before
      // timestamping, generalized across the timestamp prefix).
      const slug = slugify(name);
      const existing = listMigrations().find((id) => slugOf(id) === slug);
      if (existing) {
        console.log(
          `Migration matching "${name}" already exists as "${existing}" — tracking it.`,
        );
        track(existing);
        break;
      }
      const id = timestampedId(name);
      const indexFile = join(migrationsDir, id, 'index.ts');
      mkdirSync(join(migrationsDir, id), { recursive: true });
      writeFileSync(indexFile, template(name), { flag: 'wx' });
      console.log(`Created migration: ${id}`);
      track(id);
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
    case 'deploy': {
      await runDeploy({ backfill: flags.has('--backfill'), nonInteractive });
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
      fail(
        'Usage: migrate <new|track|current|dry|run|deploy|export> [name] [--yes] [--backfill]',
      );
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
