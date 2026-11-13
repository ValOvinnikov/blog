import {
  GRACE_EMAIL,
  PLAN_ENTITLEMENTS,
  type TGraceEmail,
} from '@blog/db/constants';
import { deleteCustomDomainClaim } from '@blog/db/queries/custom-domain-claims';
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
import { requestTenantCacheInvalidation } from '@blog/db/utils/tenant-cache/request-tenant-cache-invalidation';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import type { TInactivitySweepContext } from '@worker/utils/inactivity-sweep/inactivity-stages';
import { logger } from '@worker/utils/logger/logger';

import { sendOwnerGraceEmail } from './grace-emails';
import {
  findGraceLocks,
  hasGraceLocks,
  isUnderRootDomain,
} from './grace-locks';

export type TGraceStepInput = {
  tenant: TTenant;
  hosts: string[];
  ctx: TInactivitySweepContext;
};

function invalidateSiteCache(
  tenantId: string,
  { env }: TInactivitySweepContext,
) {
  return requestTenantCacheInvalidation({
    webAppUrl: env.webAppBaseUrl,
    secret: env.siteConfigRevalidateSecret,
    tenantId,
  });
}

export async function endTrial({
  tenant,
  ctx,
}: TGraceStepInput): Promise<boolean> {
  const ended = await endTenantTrial(tenant.id, ctx.now);
  if (!ended) return false;

  await invalidateSiteCache(tenant.id, ctx);
  return true;
}

async function moveMainAddressToSubdomain({
  tenant,
  hosts,
  ctx,
}: TGraceStepInput) {
  const { id: tenantId, primaryDomain } = tenant;
  const subdomain = hosts.find((host) =>
    isUnderRootDomain(host, ctx.env.tenantRootDomain),
  );

  await deleteCustomDomainClaim(tenantId);
  if (!subdomain) {
    logger.error(DOWNGRADE_GRACE_LOG.SUBDOMAIN_MISSING, { tenantId });
    return;
  }
  if (subdomain === primaryDomain) return;

  const moved = await setTenantPrimaryDomain(tenantId, subdomain);
  if (!moved.ok) throw new Error(moved.error);
  await invalidateSiteCache(tenantId, ctx);
}

export async function endGrace(input: TGraceStepInput): Promise<boolean> {
  const { tenant, ctx } = input;
  const { id, plan, downgradeGraceStartedAt } = tenant;
  if (!downgradeGraceStartedAt) return false;

  const { seats, hasCustomDomain } = PLAN_ENTITLEMENTS[plan];
  await lockMembershipsOverSeats(id, seats, ctx.now);
  if (!hasCustomDomain) await moveMainAddressToSubdomain(input);

  return endDowngradeGrace(id, downgradeGraceStartedAt);
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
