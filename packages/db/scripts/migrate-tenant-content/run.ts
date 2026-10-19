// `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
// resolve to a no-op outside Next.js's own build.

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { TENANT_STATUS } from '@blog/db/constants';
import {
  getTenantById,
  getTenantSanityWriteCredentials,
  listActiveTenants,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';

import { isTenantMigrationLedgerEmpty } from './lib/read-tenant-migration-ledger';
import {
  exportTenantDataset,
  runTenantMigrationDeploy,
} from './lib/run-tenant-migrate-script';

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
    const exportDir = process.env['TENANT_EXPORT_DIR'];
    if (exportDir) {
      console.log(
        `migrate-tenant-content: exporting tenant "${tenant.id}" dataset before migrating it.`,
      );
      exportTenantDataset(credentials, join(exportDir, `${tenant.id}.tar.gz`));
    }

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
    await migrateOne(tenant, summary);
  }

  console.log(
    `migrate-tenant-content: checked ${summary.checked} tenant(s) — ` +
      `migrated=${summary.migrated} backfilled=${summary.backfilled} ` +
      `skipped=${summary.skipped} errors=${summary.errors}`,
  );

  return summary;
}

export async function runMigration(): Promise<TMigrateSummary> {
  const candidates = await listActiveTenants();
  return migrateCandidates(candidates);
}

export async function runMigrationForTenant(
  tenantId: string,
): Promise<TMigrateSummary> {
  const tenant = await getTenantById(tenantId);
  return migrateCandidates(tenant ? [tenant] : []);
}

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

// Keeps `main()` from running as a side effect when a test imports this module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('migrate-tenant-content: unexpected failure:', error);
    process.exitCode = 1;
  });
}
