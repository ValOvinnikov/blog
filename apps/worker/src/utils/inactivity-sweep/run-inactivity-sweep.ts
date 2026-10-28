import { INACTIVITY_STAGE, type TInactivityStage } from '@blog/db/constants';
import { listTenantHosts } from '@blog/db/queries/tenant-domains/list-tenant-hosts';
import { listTenantsDueForInactivityStage } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { isPlatformTenant } from '@blog/db/utils/is-platform-tenant/is-platform-tenant';
import { sanitizeLogMessage } from '@blog/insight';
import { INACTIVITY_SWEEP_LOG } from '@worker/constants/inactivity-sweep';
import { logger } from '@worker/utils/logger/logger';

import {
  INACTIVITY_STAGE_HANDLERS,
  type TInactivitySweepContext,
} from './inactivity-stages';

export type TInactivitySweepResult = Record<TInactivityStage, number>;

// Latest stage first, so one sweep never warns and then suspends a tenant.
const SWEEP_ORDER: TInactivityStage[] = [
  INACTIVITY_STAGE.DEPROVISIONING,
  INACTIVITY_STAGE.DELETION_NOTICE,
  INACTIVITY_STAGE.SUSPENSION,
  INACTIVITY_STAGE.SUSPENSION_WARNING,
];

type TSweepRun = TInactivitySweepContext & { skippedTenantIds: Set<string> };

async function advanceTenant(
  stage: TInactivityStage,
  tenant: TTenant,
  run: TSweepRun,
): Promise<boolean> {
  try {
    const hosts = await listTenantHosts(tenant);
    if (isPlatformTenant(hosts, run.env.tenantRootDomain)) {
      run.skippedTenantIds.add(tenant.id);
      return false;
    }
    return await INACTIVITY_STAGE_HANDLERS[stage](tenant, run);
  } catch (error) {
    logger.error(INACTIVITY_SWEEP_LOG.STAGE_FAILED, {
      tenantId: tenant.id,
      stage,
      error: sanitizeLogMessage(error),
    });
    return false;
  }
}

async function advanceDueTenants(
  stage: TInactivityStage,
  run: TSweepRun,
): Promise<number> {
  const due = await listTenantsDueForInactivityStage(stage, run.now);
  let advanced = 0;
  for (const tenant of due) {
    if (await advanceTenant(stage, tenant, run)) advanced += 1;
  }
  return advanced;
}

export async function runInactivitySweep(
  ctx: TInactivitySweepContext,
): Promise<TInactivitySweepResult> {
  const run: TSweepRun = { ...ctx, skippedTenantIds: new Set() };
  const advanced: Partial<TInactivitySweepResult> = {};
  for (const stage of SWEEP_ORDER) {
    advanced[stage] = await advanceDueTenants(stage, run);
  }
  for (const tenantId of run.skippedTenantIds) {
    logger.info(INACTIVITY_SWEEP_LOG.PLATFORM_TENANT_SKIPPED, { tenantId });
  }
  return advanced as TInactivitySweepResult;
}
