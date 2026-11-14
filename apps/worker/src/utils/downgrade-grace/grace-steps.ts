import {
  GRACE_EMAIL,
  PLAN_ENTITLEMENTS,
  type TGraceEmail,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import { claimGraceEmail, endTenantTrial } from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  findGraceLocks,
  hasGraceLocks,
} from '@blog/db/utils/grace-locks/grace-locks';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import type { TInactivitySweepContext } from '@worker/utils/inactivity-sweep/inactivity-stages';
import { logger } from '@worker/utils/logger/logger';
import { invalidateSiteCache } from '@worker/utils/site-cache/invalidate-site-cache';

import { sendOwnerGraceEmail } from './grace-emails';

export type TGraceStepInput = {
  tenant: TTenant;
  hosts: string[];
  ctx: TInactivitySweepContext;
};

export async function endTrial({
  tenant,
  ctx,
}: TGraceStepInput): Promise<boolean> {
  const ended = await endTenantTrial(tenant.id, ctx.now);
  if (!ended) return false;

  await invalidateSiteCache(tenant.id, ctx.env);
  return true;
}

export async function sendGraceEmail(
  email: TGraceEmail,
  { tenant, hosts, ctx }: TGraceStepInput,
): Promise<boolean> {
  const { id: tenantId } = tenant;
  const { now, env } = ctx;
  const locks = await findGraceLocks(
    tenant,
    PLAN_ENTITLEMENTS[tenant.plan],
    hosts,
    env.tenantRootDomain,
  );
  if (email !== GRACE_EMAIL.STARTED && !hasGraceLocks(locks)) return false;

  const claimed = await claimGraceEmail(tenantId, email, now);
  if (!claimed?.downgradeGraceStartedAt) return false;

  const ownerEmail = await getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.error(DOWNGRADE_GRACE_LOG.OWNER_MISSING, { tenantId, email });
    return true;
  }

  await sendOwnerGraceEmail(email, {
    tenant: claimed,
    graceStartedAt: claimed.downgradeGraceStartedAt,
    ownerEmail,
    locks,
    env,
  });
  return true;
}
