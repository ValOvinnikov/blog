/**
 * Cache-invalidation-only entrypoint for one tenant — re-runs just
 * `deprovision-tenant`'s final step (`invalidateTenantCache`) against a
 * tenant id, independent of that workflow's `deprovisionedAt` guard. That
 * guard exists to stop a second full run re-removing a domain, re-archiving
 * a Sanity project and re-revoking tokens; it also, as a side effect, blocks
 * any resumed run from ever reaching the (non-destructive, safely repeatable)
 * cache purge once the tenant has already been archived. This script exists
 * so a failed purge — a network blip, a 500, a missing secret — has a
 * recovery path that doesn't require hand-crafting a request against
 * `apps/web`'s revalidation endpoint.
 *
 * Invoked only by `.github/workflows/invalidate-tenant-cache.yml` via
 * `pnpm --filter @blog/db db:invalidate-tenant-cache -- --tenant-id=<uuid>`.
 * Safe to run against an already-deprovisioned tenant — that is precisely
 * when it is needed — and equally safe against a still-active one.
 *
 * `--conditions=react-server` makes `getDb()`'s `import 'server-only'`
 * resolve to a no-op outside Next.js's own build, same trick
 * `deprovision-tenant/run.ts` relies on.
 */
import { pathToFileURL } from 'node:url';

import { getTenantRow } from '../deprovision-tenant/lib/get-tenant-row';
import { invalidateTenantCache } from '../deprovision-tenant/steps/invalidate-tenant-cache';

import { loadInvalidateCacheEnv, type TInvalidateCacheEnv } from './lib/env';

const TENANT_ID_FLAG = '--tenant-id=';
const DRY_RUN_FLAG = '--dry-run=';

function parseFlagValue(argv: string[], flag: string): string | undefined {
  return argv.find((arg) => arg.startsWith(flag))?.slice(flag.length);
}

function parseTenantId(argv: string[]): string {
  const value =
    parseFlagValue(argv, TENANT_ID_FLAG) ?? process.env['TENANT_ID'];
  if (!value) {
    throw new Error(
      'invalidate-tenant-cache: missing required --tenant-id=<uuid> (or TENANT_ID env var).',
    );
  }
  return value;
}

// Defaults to a dry run — an operator must explicitly pass `--dry-run=false`
// (or `DRY_RUN=false`) to actually invalidate anything.
function parseDryRun(argv: string[]): boolean {
  const value = parseFlagValue(argv, DRY_RUN_FLAG) ?? process.env['DRY_RUN'];
  return value !== 'false';
}

export type TRunInvalidateTenantCacheResult = { ok: boolean };

// Exported for direct testing of the invalidation call, given a tenant id,
// without also exercising argv parsing or env loading.
export async function runInvalidateTenantCache(
  tenantId: string,
  env: TInvalidateCacheEnv,
): Promise<TRunInvalidateTenantCacheResult> {
  const tenant = await getTenantRow(tenantId);

  try {
    await invalidateTenantCache(tenant, env);
  } catch (error) {
    console.error(
      `invalidate-tenant-cache: failed for tenant "${tenant.id}":`,
      error,
    );
    return { ok: false };
  }

  console.warn(
    `invalidate-tenant-cache: done for tenant "${tenant.id}" ("${tenant.name}").`,
  );
  return { ok: true };
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const tenantId = parseTenantId(argv);
  const dryRun = parseDryRun(argv);
  const env = loadInvalidateCacheEnv(dryRun);

  const { ok } = await runInvalidateTenantCache(tenantId, env);
  if (!ok) {
    process.exitCode = 1;
  }
}

// Only auto-run when this file is the CLI entrypoint (`tsx run.ts`) — guards
// against `main()` firing as an import side effect when a test imports
// `runInvalidateTenantCache` from this same module.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error: unknown) => {
    console.error('invalidate-tenant-cache: unexpected failure:', error);
    process.exitCode = 1;
  });
}
