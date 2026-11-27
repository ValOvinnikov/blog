import 'server-only';

import { toPlatformViewer } from '@platform/server/auth/platform-viewer';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { queries } from '@shinefold/db';

import { canOperatorOpenSubscribers } from './can-operator-open-subscribers';

const managesOwnSite = async (userId: string, tenantId: string) =>
  toPlatformViewer({
    membership: await queries.memberships.getMembership(userId, tenantId),
  }).canManage;

export const canManageSubscribers = async ({
  tenant,
  membership,
  viewer,
}: TTenantMembershipContext): Promise<boolean> => {
  if (!tenant.pageAccess.subscribers || !viewer.canManage) return false;
  if (!viewer.isOperator || canOperatorOpenSubscribers(tenant, viewer)) {
    return true;
  }

  return managesOwnSite(membership.userId, tenant.id);
};
