import 'server-only';

import { toPlatformViewer } from '@platform/server/auth/platform-viewer';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { queries } from '@shinefold/db';
import { notFound } from 'next/navigation';

import { canOperatorOpenSubscribers } from './can-operator-open-subscribers';

const managesOwnSite = async (userId: string, tenantId: string) =>
  toPlatformViewer({
    membership: await queries.memberships.getMembership(userId, tenantId),
  }).canManage;

export const requireSubscribersManager = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const context = await requireTenantManager(tenantId);
  const { tenant, membership, viewer } = context;

  if (!tenant.pageAccess.subscribers) notFound();

  if (
    viewer.isOperator &&
    !canOperatorOpenSubscribers(tenant, viewer) &&
    !(await managesOwnSite(membership.userId, tenant.id))
  ) {
    notFound();
  }

  return context;
};
