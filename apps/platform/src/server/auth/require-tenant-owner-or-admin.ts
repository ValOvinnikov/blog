import 'server-only';

import { queries } from '@blog/db';
import type { TAdmin } from '@blog/db/schema/admins';
import { notFound } from 'next/navigation';

import { toPlatformViewer } from './platform-viewer';
import { requireSessionUserId } from './require-session-user-id';

export const requireTenantOwnerOrAdmin = async (
  tenantId: string,
  isAdminPermitted: (admin: TAdmin) => boolean = () => true,
): Promise<void> => {
  const userId = await requireSessionUserId();
  const admin = await queries.admins.getAdminByUserId(userId);

  if (admin && isAdminPermitted(admin)) {
    return;
  }

  const membership = await queries.memberships.getMembership(userId, tenantId);

  if (!membership || !toPlatformViewer({ membership }).isOwner) {
    notFound();
  }
};
