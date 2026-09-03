import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../studio',
);

export type TRunTenantMigrationDeployParams = {
  projectId: string;
  dataset: string;
  token: string;
  // Records every currently pending migration as applied without running
  // it — the safe path for a tenant whose ledger has never recorded one
  // (see `isTenantMigrationLedgerEmpty`), since replaying migrations
  // written against older document shapes against a tenant already seeded
  // at the current schema ranges from no-op to destructive.
  backfill: boolean;
};

/**
 * Runs `migrate.mjs deploy` scoped to one tenant's project/dataset/token via
 * env overrides — `migrate.mjs` has no programmatic API of its own, so this
 * shells out the same way `validateTenantDocuments` does for the `sanity`
 * CLI. Output streams straight through (`stdio: 'inherit'`): `migrate.mjs`
 * has no structured/JSON output mode, and its own dry-run-then-run log
 * lines are exactly what a failed deploy needs for diagnosis.
 */
export function runTenantMigrationDeploy({
  projectId,
  dataset,
  token,
  backfill,
}: TRunTenantMigrationDeployParams): void {
  execFileSync(
    'node',
    [
      'scripts/migrate.mjs',
      'deploy',
      '--yes',
      ...(backfill ? ['--backfill'] : []),
    ],
    {
      cwd: studioDir,
      env: {
        ...process.env,
        SANITY_STUDIO_PROJECT_ID: projectId,
        SANITY_STUDIO_DATASET: dataset,
        SANITY_AUTH_TOKEN: token,
      },
      stdio: 'inherit',
    },
  );
}
