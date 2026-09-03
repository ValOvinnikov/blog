import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../studio',
);

const LEDGER_QUERY = '*[_id == "migrationState"]{applied}';
// Pinned so a `sanity` CLI version bump can't silently change the response
// shape this parses — matches `migrate.mjs`'s own LEDGER_API_VERSION.
const LEDGER_API_VERSION = '2024-08-01';

export type TReadTenantMigrationLedgerParams = {
  projectId: string;
  dataset: string;
  token: string;
};

type TLedgerQueryResult = { applied?: unknown[] }[];

/**
 * Whether a tenant's `migrationState` ledger has never recorded an applied
 * migration — true both when the ledger document doesn't exist yet (a
 * tenant provisioned before this fan-out existed) and when it exists with
 * an empty `applied[]`. Queries rather than `documents get`s the ledger
 * document, since a missing document there errors instead of resolving to
 * a checkable value.
 */
export function isTenantMigrationLedgerEmpty({
  projectId,
  dataset,
  token,
}: TReadTenantMigrationLedgerParams): boolean {
  const stdout = execFileSync(
    'pnpm',
    [
      'exec',
      'sanity',
      'documents',
      'query',
      LEDGER_QUERY,
      '--api-version',
      LEDGER_API_VERSION,
    ],
    {
      cwd: studioDir,
      env: {
        ...process.env,
        SANITY_STUDIO_PROJECT_ID: projectId,
        SANITY_STUDIO_DATASET: dataset,
        SANITY_AUTH_TOKEN: token,
      },
      encoding: 'utf8',
    },
  );

  const results = JSON.parse(stdout) as TLedgerQueryResult;
  const applied = results[0]?.applied ?? [];
  return applied.length === 0;
}
