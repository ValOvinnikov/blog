/**
 * Tenant content-migration fan-out entrypoint — runs `migrate.mjs deploy`
 * against every in-scope tenant's own Sanity project/dataset, authenticated
 * with that tenant's own persisted write token (env-overridden per
 * invocation — see `lib/run-tenant-migration-deploy.ts`). A tenant whose
 * `migrationState` ledger has never recorded an applied migration is
 * backfilled instead of replayed — see `lib/read-tenant-migration-ledger.ts`
 * for why replaying migrations written for older document shapes against
 * such a tenant is unsafe.
 *
 * Invoked only by `.github/workflows/migrate-tenant-content.yml` — an
 * automatic sweep on merge to `main`, a `workflow_dispatch` (optionally
 * scoped to one tenant via `--tenant-id=<uuid>`), or a `workflow_call` from
 * another workflow migrating a single tenant — never run by hand against a
 * shared/production tenant registry outside that workflow.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `provision-tenant/run.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import { TENANT_STATUS } from '@blog/db/constants';
import {
  getTenantById,
  getTenantSanityWriteCredentials,
  listTenantsForDocumentValidation,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { isTenantMigrationLedgerEmpty } from './lib/read-tenant-migration-ledger';
import { runTenantMigrationDeploy } from './lib/run-tenant-migration-deploy';

const TENANT_ID_FLAG = '--tenant-id=';

function parseTenantId(argv: string[]): string | undefined {
  const flag = argv.find((arg) => arg.startsWith(TENANT_ID_FLAG));
  return (
    flag?.slice(TENANT_ID_FLAG.length) || process.env['TENANT_ID'] || undefined
  );
}

export type TMigrateSummary = {
  checked: number;
  migrated: number;
  backfilled: number;
  skipped: number;
  errors: number;
};

function emptySummary(): TMigrateSummary {
  return { checked: 0, migrated: 0, backfilled: 0, skipped: 0, errors: 0 };
}

async function migrateOne(
  tenant: TTenant,
  summary: TMigrateSummary,
): Promise<void> {
  const credentials = await getTenantSanityWriteCredentials(tenant.id);
  if (!credentials) {
    summary.skipped += 1;
    return;
  }

  if (
    credentials.status !== TENANT_STATUS.ACTIVE ||
    credentials.deprovisionedAt
  ) {
    summary.skipped += 1;
    console.log(
      `migrate-tenant-content: skipping tenant "${tenant.id}" — status="${credentials.status}" deprovisionedAt=${credentials.deprovisionedAt ? credentials.deprovisionedAt.toISOString() : 'null'}`,
    );
    return;
  }

  try {
    const backfill = isTenantMigrationLedgerEmpty(credentials);
    if (backfill) {
      console.log(
        `migrate-tenant-content: tenant "${tenant.id}" has an empty migration ledger — backfilling instead of replaying history.`,
      );
    }

    console.log(
      `migrate-tenant-content: running ${backfill ? 'backfill' : 'deploy'} for tenant "${tenant.id}" (project "${credentials.projectId}", dataset "${credentials.dataset}").`,
    );
    runTenantMigrationDeploy({ ...credentials, backfill });

    if (backfill) {
      summary.backfilled += 1;
    } else {
      summary.migrated += 1;
    }
  } catch (error) {
    summary.errors += 1;
    console.error(
      `migrate-tenant-content: migration deploy failed for tenant "${tenant.id}": ${sanitizeLogMessage(error)}`,
    );
  }
}

async function migrateCandidates(
  candidates: TTenant[],
): Promise<TMigrateSummary> {
  const summary = emptySummary();
  summary.checked = candidates.length;

  for (const tenant of candidates) {
    // Each tenant is independent — one tenant's CLI/network failure must
    // never abort the sweep for the rest.
    await migrateOne(tenant, summary);
  }

  console.log(
    `migrate-tenant-content: checked ${summary.checked} tenant(s) — ` +
      `migrated=${summary.migrated} backfilled=${summary.backfilled} ` +
      `skipped=${summary.skipped} errors=${summary.errors}`,
  );

  return summary;
}

// Exported for direct testing of the sweep logic without also exercising
// tenant enumeration.
export async function runMigration(): Promise<TMigrateSummary> {
  const candidates = await listTenantsForDocumentValidation();
  return migrateCandidates(candidates);
}

// Exported for direct testing of the single-tenant path — used by an
// operator's scoped `workflow_dispatch` and by a caller migrating one
// freshly provisioned tenant.
export async function runMigrationForTenant(
  tenantId: string,
): Promise<TMigrateSummary> {
  const tenant = await getTenantById(tenantId);
  return migrateCandidates(tenant ? [tenant] : []);
}

// Exported for direct testing of the exit-code decision. `errors` means a
// tenant's migration deploy itself failed to run (a CLI/network failure, or
// a failed migration mid-deploy) — `migrated`/`backfilled`/`skipped` are all
// expected, successful outcomes and never count here.
export function hasSystemicFailures(summary: TMigrateSummary): boolean {
  return summary.errors > 0;
}

async function main(): Promise<void> {
  const tenantId = parseTenantId(process.argv.slice(2));

  const summary = tenantId
    ? await runMigrationForTenant(tenantId)
    : await runMigration();

  if (tenantId && summary.checked === 0) {
    console.error(
      `migrate-tenant-content: tenant "${tenantId}" not found (or deprovisioned) — nothing to migrate.`,
    );
    process.exitCode = 1;
    return;
  }

  if (hasSystemicFailures(summary)) {
    process.exitCode = 1;
  }
}

// Only auto-run when this file is the CLI entrypoint (`tsx run.ts`) — guards
// against `main()` firing as an import side effect when a test imports
// `runMigration` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('migrate-tenant-content: unexpected failure:', error);
    process.exitCode = 1;
  });
}
