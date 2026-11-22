import 'server-only';

import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { notFound } from 'next/navigation';

export const requireSubscribersManager = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const context = await requireTenantManager(tenantId);

  if (!context.tenant.pageAccess.subscribers) notFound();

  return context;
};
