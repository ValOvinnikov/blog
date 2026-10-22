import { INACTIVITY_STAGE, type TInactivityStage } from '@blog/db/constants';
import { listTenantsDueForInactivityStage } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { INACTIVITY_STAGE_FAILED_EVENT } from '@worker/constants/inactivity-sweep';
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

async function advanceTenant(
  stage: TInactivityStage,
  tenant: TTenant,
  ctx: TInactivitySweepContext,
): Promise<boolean> {
  try {
    return await INACTIVITY_STAGE_HANDLERS[stage](tenant, ctx);
  } catch (error) {
    logger.error(INACTIVITY_STAGE_FAILED_EVENT, {
      tenantId: tenant.id,
      stage,
      error: sanitizeLogMessage(error),
    });
    return false;
  }
}

async function advanceDueTenants(
  stage: TInactivityStage,
  ctx: TInactivitySweepContext,
): Promise<number> {
  const due = await listTenantsDueForInactivityStage(stage, ctx.now);
  let advanced = 0;
  for (const tenant of due) {
    if (await advanceTenant(stage, tenant, ctx)) advanced += 1;
  }
  return advanced;
}

export async function runInactivitySweep(
  ctx: TInactivitySweepContext,
): Promise<TInactivitySweepResult> {
  const advanced: Partial<TInactivitySweepResult> = {};
  for (const stage of SWEEP_ORDER) {
    advanced[stage] = await advanceDueTenants(stage, ctx);
  }
  return advanced as TInactivitySweepResult;
}
