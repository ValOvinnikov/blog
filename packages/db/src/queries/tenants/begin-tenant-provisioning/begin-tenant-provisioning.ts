import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES,
  TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import type { TResult } from '@blog/utils';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';

export type TBeginTenantProvisioningResult = {
  tenant: TTenant;
  previousProvisioningStatus: TTenantProvisioningStatus | null;
};

// Moves a tenant to PROVISIONING, admitting either a fresh dispatch or a
// retry of one whose run is demonstrably dead — in one atomic
// `UPDATE ... WHERE ... RETURNING`, so a concurrent second call can never
// also succeed.
export async function beginTenantProvisioning(
  tenantId: string,
): Promise<TResult<TBeginTenantProvisioningResult, TErrorCode>> {
  const db = getDb();

  const [existing] = await db
    .select({ provisioningStatus: tenants.provisioningStatus })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!existing) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  const now = new Date().toISOString();
  const debounceCutoff = new Date(
    Date.now() - TENANT_PROVISIONING_RETRY_DEBOUNCE_MINUTES * 60_000,
  ).toISOString();
  const staleCutoff = new Date(
    Date.now() - TENANT_PROVISIONING_RUN_STALE_AFTER_MINUTES * 60_000,
  ).toISOString();

  // `run.admittedAt` (merged below, never touching `startedAt` or any step)
  // is the concurrency marker; a `FAILED` step or `finishedAt` only counts
  // as evidence of death when it postdates the current run's own `startedAt`
  // — otherwise it's residue from an earlier attempt.
  const runIsNotLive = sql`(
    ${tenants.provisioningSteps} IS NOT NULL
    AND (
      (${tenants.provisioningSteps} -> 'run' ->> 'admittedAt') IS NULL
      OR (${tenants.provisioningSteps} -> 'run' ->> 'admittedAt')::timestamptz < ${debounceCutoff}::timestamptz
    )
    AND (
      EXISTS (
        SELECT 1
        FROM jsonb_each(${tenants.provisioningSteps}) AS step(key, value)
        WHERE step.key <> 'run'
          AND step.value ->> 'status' = ${TENANT_PROVISIONING_STEP_STATUS.FAILED}
          AND step.value ->> 'updatedAt' IS NOT NULL
          AND (step.value ->> 'updatedAt')::timestamptz
            >= (${tenants.provisioningSteps} -> 'run' ->> 'startedAt')::timestamptz
      )
      OR (
        (${tenants.provisioningSteps} -> 'run' ->> 'finishedAt') IS NOT NULL
        AND (${tenants.provisioningSteps} -> 'run' ->> 'finishedAt')::timestamptz
          >= (${tenants.provisioningSteps} -> 'run' ->> 'startedAt')::timestamptz
      )
      OR (
        (${tenants.provisioningSteps} -> 'run' ->> 'startedAt') IS NULL
        OR (${tenants.provisioningSteps} -> 'run' ->> 'startedAt')::timestamptz < ${staleCutoff}::timestamptz
      )
    )
  )`;

  const [tenant] = await db
    .update(tenants)
    .set({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: sql`jsonb_set(
        coalesce(${tenants.provisioningSteps}, '{}'::jsonb),
        array['run']::text[],
        coalesce(${tenants.provisioningSteps} -> 'run', '{}'::jsonb) || ${JSON.stringify({ admittedAt: now })}::jsonb,
        true
      )`,
    })
    .where(
      and(
        eq(tenants.id, tenantId),
        or(
          isNull(tenants.provisioningStatus),
          ne(
            tenants.provisioningStatus,
            TENANT_PROVISIONING_STATUS.PROVISIONING,
          ),
          and(
            eq(
              tenants.provisioningStatus,
              TENANT_PROVISIONING_STATUS.PROVISIONING,
            ),
            runIsNotLive,
          ),
        ),
      ),
    )
    .returning();

  if (!tenant) {
    return { ok: false, error: ERROR_CODE.DB_ALREADY_PROVISIONING };
  }

  return {
    ok: true,
    data: { tenant, previousProvisioningStatus: existing.provisioningStatus },
  };
}
