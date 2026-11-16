import 'server-only';

import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';
import {
  PLAN_CHANGE_REFUSAL,
  type TPlanChangeGate,
} from '@platform/constants/plan-change';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import type { TMaybeUndefined } from '@shinefold/config';
import { SELLABLE_TENANT_PLANS } from '@shinefold/config/constants';
import { isTenantWritable } from '@shinefold/db/utils/is-tenant-writable/is-tenant-writable';
import { isOneOf } from '@shinefold/utils/primitives';

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

const ownerGate = (tenant: TUpgradeTenant, { isOwner }: TPlatformViewer) => {
  if (!isOwner) return UPGRADE_STATE.NOT_OWNER;
  if (!isTenantWritable(tenant)) return UPGRADE_STATE.UNAVAILABLE;
  return undefined;
};

export const upgradeStateFor = (
  tenant: TUpgradeTenant,
  viewer: TPlatformViewer,
): TUpgradeState => {
  if (hasStoredSubscription(tenant)) return UPGRADE_STATE.SUBSCRIBED;
  return ownerGate(tenant, viewer) ?? UPGRADE_STATE.AVAILABLE;
};

export const planChangeRefusalFor = (
  tenant: TUpgradeTenant,
  viewer: TPlatformViewer,
): TMaybeUndefined<TPlanChangeGate> => {
  if (!hasStoredSubscription(tenant)) return PLAN_CHANGE_REFUSAL.NOT_SUBSCRIBED;
  return ownerGate(tenant, viewer);
};
