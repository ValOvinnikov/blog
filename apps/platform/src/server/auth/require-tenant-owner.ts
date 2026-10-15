import 'server-only';

import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { notFound } from 'next/navigation';

import {
  requireTenantMembership,
  type TTenantMembershipContext,
} from './require-tenant-membership';

export const requireTenantOwner = async (
  tenantId: string,
): Promise<TTenantMembershipContext> => {
  const context = await requireTenantMembership(tenantId);

  if (context.membership.role !== MEMBERSHIP_ROLE.OWNER) {
    notFound();
  }

  return context;
};
