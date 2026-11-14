// `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
// resolve to a no-op outside Next.js's own build.

import { getTenantById, listActiveTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import { readOptionalTenantId } from '../lib/cli-flags';
import { runIfEntrypoint } from '../lib/run-if-entrypoint';

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

runIfEntrypoint(import.meta.url, main, 'migrate-tenant-content');
