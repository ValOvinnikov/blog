import 'server-only';

import { notFound } from 'next/navigation';

import {
  requireTenantMembership,
  type TTenantMembershipContext,
} from './require-tenant-membership';

export const requireTenantOwner = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const context = await requireTenantMembership(tenantId);

  if (!context.viewer.canManage) {
    notFound();
  }

  return context;
};
