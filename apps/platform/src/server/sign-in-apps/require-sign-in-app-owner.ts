import 'server-only';

import { isVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { notFound } from 'next/navigation';

// An operator's virtual owner membership gets the read-only view, so it may not write either.
export const requireSignInAppOwner = async (tenantId: string) => {
  const context = await requireTenantOwner(tenantId);
  if (isVirtualAdminMembership(context.membership)) notFound();
  return context;
};
