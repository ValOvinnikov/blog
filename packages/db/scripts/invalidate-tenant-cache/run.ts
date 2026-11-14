// Re-runs only deprovision-tenant's cache purge for one tenant, which that workflow's `deprovisionedAt` guard blocks once the tenant is archived.
import { getTenantRow } from '../deprovision-tenant/lib/get-tenant-row';
import { invalidateTenantCache } from '../deprovision-tenant/steps/invalidate-tenant-cache';
import { parseDryRun, readRequiredTenantId } from '../lib/cli-flags';
import { runIfEntrypoint } from '../lib/run-if-entrypoint';

import { loadInvalidateCacheEnv, type TInvalidateCacheEnv } from './lib/env';

const TOOL = 'invalidate-tenant-cache';

export type TRunInvalidateTenantCacheResult = { ok: boolean };

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
  const tenantId = readRequiredTenantId(argv, TOOL);
  const dryRun = parseDryRun(argv);
  const env = loadInvalidateCacheEnv(dryRun);

  const { ok } = await runInvalidateTenantCache(tenantId, env);
  if (!ok) {
    process.exitCode = 1;
  }
}

runIfEntrypoint(import.meta.url, main, TOOL);
