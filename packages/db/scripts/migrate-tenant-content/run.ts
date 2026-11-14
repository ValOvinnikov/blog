import { pathToFileURL } from 'node:url';

import { getTenantById, listActiveTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import { readOptionalTenantId } from '../lib/cli-flags';

import {
  emptySummary,
  migrateTenant,
  type TMigrateSummary,
} from './lib/migrate-tenant';

async function migrateCandidates(
  candidates: TTenant[],
): Promise<TMigrateSummary> {
  const summary = emptySummary();
  summary.checked = candidates.length;

  for (const tenant of candidates) {
    await migrateTenant(tenant, summary);
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
  const tenantId = readOptionalTenantId(process.argv.slice(2));

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
