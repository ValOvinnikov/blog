// Re-runs only deprovision-tenant's cache purge for one tenant, which that workflow's `deprovisionedAt` guard blocks once the tenant is archived.
import type { TMaybeUndefined } from '@blog/config/types';

import { getTenantRow } from '../deprovision-tenant/lib/get-tenant-row';
import { invalidateTenantCache } from '../deprovision-tenant/steps/invalidate-tenant-cache';
import { runIfEntrypoint } from '../lib/run-if-entrypoint';

import { loadInvalidateCacheEnv, type TInvalidateCacheEnv } from './lib/env';

const TENANT_ID_FLAG = '--tenant-id=';
const DRY_RUN_FLAG = '--dry-run=';

function parseFlagValue(argv: string[], flag: string): TMaybeUndefined<string> {
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

// Defaults to a dry run; only `--dry-run=false` (or `DRY_RUN=false`) invalidates.
function parseDryRun(argv: string[]): boolean {
  const value = parseFlagValue(argv, DRY_RUN_FLAG) ?? process.env['DRY_RUN'];
  return value !== 'false';
}

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
  const tenantId = parseTenantId(argv);
  const dryRun = parseDryRun(argv);
  const env = loadInvalidateCacheEnv(dryRun);

  const { ok } = await runInvalidateTenantCache(tenantId, env);
  if (!ok) {
    process.exitCode = 1;
  }
}

runIfEntrypoint(import.meta.url, main, 'invalidate-tenant-cache');
