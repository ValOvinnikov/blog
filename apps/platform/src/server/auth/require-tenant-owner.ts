import 'server-only';

import { notFound } from 'next/navigation';

import { isTenantOwner } from './is-tenant-owner';
import {
  requireTenantMembership,
  type TTenantMembershipContext,
} from './require-tenant-membership';

export const requireTenantOwner = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const context = await requireTenantMembership(tenantId);

  if (!isTenantOwner(context.membership)) {
    notFound();
  }

  return context;
};
