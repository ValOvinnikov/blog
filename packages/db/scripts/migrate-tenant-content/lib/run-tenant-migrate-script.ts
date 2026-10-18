import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const studioDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../studio',
);

export type TTenantSanityTarget = {
  projectId: string;
  dataset: string;
  token: string;
};

export type TRunTenantMigrationDeployParams = TTenantSanityTarget & {
  // Records every currently pending migration as applied without running
  // it — the safe path for a tenant whose ledger has never recorded one
  // (see `isTenantMigrationLedgerEmpty`), since replaying migrations
  // written against older document shapes against a tenant already seeded
  // at the current schema ranges from no-op to destructive.
  backfill: boolean;
};

// `migrate.mjs` has no programmatic API and no structured output mode, so it
// is shelled out with the tenant's project, dataset and token as env
// overrides, its own log lines streaming straight through for diagnosis.
function runMigrateScript(
  { projectId, dataset, token }: TTenantSanityTarget,
  args: string[],
): void {
  execFileSync('node', ['scripts/migrate.mjs', ...args], {
    cwd: studioDir,
    env: {
      ...process.env,
      SANITY_STUDIO_PROJECT_ID: projectId,
      SANITY_STUDIO_DATASET: dataset,
      SANITY_AUTH_TOKEN: token,
    },
    stdio: 'inherit',
  });
}

export function runTenantMigrationDeploy({
  backfill,
  ...target
}: TRunTenantMigrationDeployParams): void {
  runMigrateScript(target, [
    'deploy',
    '--yes',
    ...(backfill ? ['--backfill'] : []),
  ]);
}

export function exportTenantDataset(
  target: TTenantSanityTarget,
  destination: string,
): void {
  runMigrateScript(target, ['export', destination]);
}
