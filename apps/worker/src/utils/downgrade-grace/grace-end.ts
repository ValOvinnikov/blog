import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { deleteCustomDomainClaim } from '@blog/db/queries/custom-domain-claims';
import { stopPendingInvitesOverSeats } from '@blog/db/queries/membership-invites';
import { lockMembershipsOverSeats } from '@blog/db/queries/memberships';
import {
  endDowngradeGrace,
  restoreDowngradeGrace,
  setTenantPrimaryDomain,
} from '@blog/db/queries/tenants';
import type { TTenant } from '@blog/db/schema/tenants';
import { sanitizeLogMessage } from '@blog/insight';
import { DOWNGRADE_GRACE_LOG } from '@worker/constants/downgrade-grace';
import { logger } from '@worker/utils/logger/logger';
import { invalidateSiteCache } from '@worker/utils/site-cache/invalidate-site-cache';

import { findSubdomain } from './grace-locks';
import type { TGraceStepInput } from './grace-steps';

async function moveMainAddressToSubdomain({
  tenant,
  hosts,
  ctx,
}: TGraceStepInput) {
  const { id: tenantId, plan, primaryDomain } = tenant;
  const subdomain = findSubdomain(hosts, ctx.env.tenantRootDomain);

  if (!subdomain) {
    logger.error(DOWNGRADE_GRACE_LOG.SUBDOMAIN_MISSING, { tenantId });
  } else if (subdomain !== primaryDomain) {
    const moved = await setTenantPrimaryDomain(tenantId, subdomain, plan);
    if (!moved.ok) throw new Error(moved.error);
    await invalidateSiteCache(tenantId, ctx.env);
  }
  await deleteCustomDomainClaim(tenantId, plan);
}

async function enforcePlan(input: TGraceStepInput): Promise<void> {
  const { tenant, ctx } = input;
  const { id, plan } = tenant;
  await lockMembershipsOverSeats(id, plan, ctx.now);
  await stopPendingInvitesOverSeats(id, plan);
  if (!PLAN_ENTITLEMENTS[plan].hasCustomDomain) {
    await moveMainAddressToSubdomain(input);
  }
}

async function giveGraceBack(
  { id, downgradeGraceStartedAt, downgradedFromPlan }: TTenant,
  error: unknown,
): Promise<void> {
  const failure = { tenantId: id, error: sanitizeLogMessage(error) };
  if (!downgradeGraceStartedAt) return;

  try {
    const isGivenBack = await restoreDowngradeGrace(id, {
      graceStartedAt: downgradeGraceStartedAt,
      downgradedFromPlan,
    });
    logger.error(DOWNGRADE_GRACE_LOG.GRACE_END_FAILED, {
      ...failure,
      isGivenBack,
    });
  } catch (giveBackError) {
    logger.error(DOWNGRADE_GRACE_LOG.GRACE_END_FAILED, {
      ...failure,
      isGivenBack: false,
      giveBackError: sanitizeLogMessage(giveBackError),
    });
  }
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

  try {
    await enforcePlan({ tenant: ended, hosts, ctx });
    return true;
  } catch (error) {
    await giveGraceBack(tenant, error);
    return false;
  }
}
