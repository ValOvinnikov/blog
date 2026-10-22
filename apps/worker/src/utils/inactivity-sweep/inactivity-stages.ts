import type { TMaybeUndefined } from '@blog/config/types';
import {
  INACTIVITY_STAGE,
  type TInactivityStage,
  type TStampedInactivityStage,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { stampTenantInactivityStage } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { INACTIVITY_OWNER_MISSING_EVENT } from '@worker/constants/inactivity-sweep';
import { reportDeprovisioningRunStart } from '@worker/utils/deprovisioning-report/deprovisioning-report';
import { logger } from '@worker/utils/logger/logger';
import { deprovisionTenant } from '@worker/workflows/deprovision-tenant';
import { start } from 'workflow/api';

import { inactivityStageDate } from './inactivity-dates';
import {
  alertOperatorsOfSuspensionWarning,
  sendOwnerInactivityEmail,
} from './inactivity-emails';
import type { TInactivitySweepEnv } from './inactivity-sweep-env';

export type TInactivitySweepContext = {
  now: Date;
  env: TInactivitySweepEnv;
};

type TInactivityStageHandler = (
  tenant: TTenant,
  ctx: TInactivitySweepContext,
) => Promise<boolean>;

async function findOwnerEmail(
  tenantId: string,
  stage: TStampedInactivityStage,
): Promise<TMaybeUndefined<string>> {
  const ownerEmail = await getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.error(INACTIVITY_OWNER_MISSING_EVENT, { tenantId, stage });
  }
  return ownerEmail;
}

async function warnOfSuspension(
  { id }: TTenant,
  { now, env }: TInactivitySweepContext,
): Promise<boolean> {
  const stage = INACTIVITY_STAGE.SUSPENSION_WARNING;
  const tenant = await stampTenantInactivityStage(id, stage, now);
  if (!tenant) return false;

  const ownerEmail = await findOwnerEmail(id, stage);
  if (ownerEmail) {
    const input = {
      tenant,
      ownerEmail,
      date: inactivityStageDate(tenant, INACTIVITY_STAGE.SUSPENSION),
      env,
    };
    await Promise.all([
      sendOwnerInactivityEmail(stage, input),
      alertOperatorsOfSuspensionWarning(input),
    ]);
  }
  return true;
}

async function suspend(
  { id }: TTenant,
  { now, env }: TInactivitySweepContext,
): Promise<boolean> {
  const tenant = await stampTenantInactivityStage(
    id,
    INACTIVITY_STAGE.SUSPENSION,
    now,
  );
  if (!tenant) return false;

  await requestTenantCacheInvalidation({
    webAppUrl: env.webAppBaseUrl,
    secret: env.siteConfigRevalidateSecret,
    tenantId: id,
  });
  return true;
}

async function noticeDeletion(
  { id }: TTenant,
  { now, env }: TInactivitySweepContext,
): Promise<boolean> {
  const stage = INACTIVITY_STAGE.DELETION_NOTICE;
  const tenant = await stampTenantInactivityStage(id, stage, now);
  if (!tenant) return false;

  const ownerEmail = await findOwnerEmail(id, stage);
  if (ownerEmail) {
    await sendOwnerInactivityEmail(stage, {
      tenant,
      ownerEmail,
      date: inactivityStageDate(tenant, INACTIVITY_STAGE.DEPROVISIONING),
      env,
    });
  }
  return true;
}

async function startDeprovisioning({ id }: TTenant): Promise<boolean> {
  await start(deprovisionTenant, [id]);
  await reportDeprovisioningRunStart(id);
  return true;
}

export const INACTIVITY_STAGE_HANDLERS: Record<
  TInactivityStage,
  TInactivityStageHandler
> = {
  [INACTIVITY_STAGE.SUSPENSION_WARNING]: warnOfSuspension,
  [INACTIVITY_STAGE.SUSPENSION]: suspend,
  [INACTIVITY_STAGE.DELETION_NOTICE]: noticeDeletion,
  [INACTIVITY_STAGE.DEPROVISIONING]: startDeprovisioning,
};
