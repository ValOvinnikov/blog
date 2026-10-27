// `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
// resolve to a no-op outside Next.js's own build.

import { pathToFileURL } from 'node:url';

import type { TMaybeUndefined } from '@blog/config/types';
import { getTenantById, listActiveTenants } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  emptySummary,
  migrateTenant,
  type TMigrateSummary,
} from './lib/migrate-tenant';

const TENANT_ID_FLAG = '--tenant-id=';

function parseTenantId(argv: string[]): TMaybeUndefined<string> {
  const flag = argv.find((arg) => arg.startsWith(TENANT_ID_FLAG));
  return (
    flag?.slice(TENANT_ID_FLAG.length) || process.env['TENANT_ID'] || undefined
  );
}

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
