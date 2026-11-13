import 'server-only';

import { SELLABLE_TENANT_PLANS } from '@blog/config/constants';
import { isTenantWritable } from '@blog/db/utils/is-tenant-writable/is-tenant-writable';
import { isOneOf } from '@blog/utils/primitives';
import { type TUpgradeState, UPGRADE_STATE } from '@platform/constants/billing';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

type TUpgradeTenant = Pick<
  TPlatformTenant,
  'plan' | 'status' | 'deprovisionedAt' | 'stripeSubscriptionId'
>;

// The webhook keeps a cancelled subscription's id and moves the site to Free, so the id alone is not enough.
const hasStoredSubscription = ({
  plan,
  stripeSubscriptionId,
}: TUpgradeTenant) =>
  Boolean(stripeSubscriptionId) && isOneOf(SELLABLE_TENANT_PLANS, plan);

export const upgradeStateFor = (
  tenant: TUpgradeTenant,
  { isOwner }: TPlatformViewer,
): TUpgradeState => {
  if (hasStoredSubscription(tenant)) return UPGRADE_STATE.SUBSCRIBED;
  if (!isOwner) return UPGRADE_STATE.NOT_OWNER;
  if (!isTenantWritable(tenant)) return UPGRADE_STATE.UNAVAILABLE;
  return UPGRADE_STATE.AVAILABLE;
};
