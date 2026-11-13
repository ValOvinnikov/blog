import {
  GRACE_EMAIL,
  PLAN_ENTITLEMENTS,
  type TGraceEmail,
} from '@blog/db/constants';
import { deleteCustomDomainClaim } from '@blog/db/queries/custom-domain-claims';
import { stopPendingInvitesOverSeats } from '@blog/db/queries/membership-invites';
import {
  getTenantOwnerEmail,
  lockMembershipsOverSeats,
} from '@blog/db/queries/memberships';
import {
  claimGraceEmail,
  endDowngradeGrace,
  endTenantTrial,
  setTenantPrimaryDomain,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import type { TInactivitySweepContext } from '@worker/utils/inactivity-sweep/inactivity-stages';
import { logger } from '@worker/utils/logger/logger';
import { invalidateSiteCache } from '@worker/utils/site-cache/invalidate-site-cache';

import { sendOwnerGraceEmail } from './grace-emails';
import { findGraceLocks, findSubdomain, hasGraceLocks } from './grace-locks';

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

async function moveMainAddressToSubdomain({
  tenant,
  hosts,
  ctx,
}: TGraceStepInput) {
  const { id: tenantId, primaryDomain } = tenant;
  const subdomain = findSubdomain(hosts, ctx.env.tenantRootDomain);

  await deleteCustomDomainClaim(tenantId);
  if (!subdomain) {
    logger.error(DOWNGRADE_GRACE_LOG.SUBDOMAIN_MISSING, { tenantId });
    return;
  }
  if (subdomain === primaryDomain) return;

  const moved = await setTenantPrimaryDomain(tenantId, subdomain);
  if (!moved.ok) throw new Error(moved.error);
  await invalidateSiteCache(tenantId, ctx.env);
}

export async function endGrace({
  tenant,
  hosts,
  ctx,
}: TGraceStepInput): Promise<boolean> {
  const { id, downgradeGraceStartedAt } = tenant;
  if (!downgradeGraceStartedAt) return false;

  const ended = await endDowngradeGrace(id, downgradeGraceStartedAt);
  if (!ended) return false;

  const { seats, hasCustomDomain } = PLAN_ENTITLEMENTS[ended.plan];
  await lockMembershipsOverSeats(id, seats, ctx.now);
  await stopPendingInvitesOverSeats(id, seats);
  if (!hasCustomDomain) {
    await moveMainAddressToSubdomain({ tenant: ended, hosts, ctx });
  }
  return true;
}

export async function sendGraceEmail(
  email: TGraceEmail,
  { tenant, hosts, ctx }: TGraceStepInput,
): Promise<boolean> {
  const { id: tenantId } = tenant;
  const { now, env } = ctx;
  const locks = await findGraceLocks(tenant, hosts, env.tenantRootDomain);
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
