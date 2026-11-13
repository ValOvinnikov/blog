import 'server-only';

import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isTenantWritable } from '@blog/db/utils/is-tenant-writable/is-tenant-writable';
import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';
import { isRealTenantOwner } from '@platform/server/auth/is-real-tenant-owner';

export const upgradeStateFor = (
  tenant: Pick<TTenant, 'plan' | 'status' | 'deprovisionedAt'>,
  membership: TMembership,
): TUpgradeState => {
  const { plan, status } = tenant;
  const isTrial = status === TENANT_STATUS.TRIAL;

  if (plan === TENANT_PLAN.GROWTH && !isTrial) return UPGRADE_STATE.ON_GROWTH;
  if (!isRealTenantOwner(membership)) return UPGRADE_STATE.NOT_OWNER;
  if (!isTenantWritable(tenant)) return UPGRADE_STATE.UNAVAILABLE;
  if (plan === TENANT_PLAN.FREE || isTrial) return UPGRADE_STATE.AVAILABLE;
  return UPGRADE_STATE.PAID_PLAN;
};
