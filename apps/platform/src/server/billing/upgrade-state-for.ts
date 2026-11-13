import 'server-only';

import type { TMaybeUndefined } from '@blog/config';
import { SELLABLE_TENANT_PLANS } from '@blog/config/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import { isTenantWritable } from '@blog/db/utils/is-tenant-writable/is-tenant-writable';
import { isOneOf } from '@blog/utils/primitives';
import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeGate,
} from '@platform/constants/plan-change';
import { isRealTenantOwner } from '@platform/server/auth/is-real-tenant-owner';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

type TUpgradeTenant = Pick<
  TPlatformTenant,
  'plan' | 'status' | 'deprovisionedAt' | 'stripeSubscriptionId'
>;

// The webhook keeps a cancelled subscription's id and moves the site to Free, so the id alone is not enough.
export const hasStoredSubscription = ({
  plan,
  stripeSubscriptionId,
}: Pick<TUpgradeTenant, 'plan' | 'stripeSubscriptionId'>) =>
  Boolean(stripeSubscriptionId) && isOneOf(SELLABLE_TENANT_PLANS, plan);

const ownerGate = (tenant: TUpgradeTenant, membership: TMembership) => {
  if (!isRealTenantOwner(membership)) return UPGRADE_STATE.NOT_OWNER;
  if (!isTenantWritable(tenant)) return UPGRADE_STATE.UNAVAILABLE;
  return undefined;
};

export const upgradeStateFor = (
  tenant: TUpgradeTenant,
  membership: TMembership,
): TUpgradeState => {
  if (hasStoredSubscription(tenant)) return UPGRADE_STATE.SUBSCRIBED;
  return ownerGate(tenant, membership) ?? UPGRADE_STATE.AVAILABLE;
};

export const planChangeRefusalFor = (
  tenant: TUpgradeTenant,
  membership: TMembership,
): TMaybeUndefined<TPlanChangeGate> => {
  if (!hasStoredSubscription(tenant)) return PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED;
  return ownerGate(tenant, membership);
};
