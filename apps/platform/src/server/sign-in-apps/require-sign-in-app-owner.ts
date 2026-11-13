import 'server-only';

import { requireTenantOwner } from '@platform/server/auth/require-tenant-owner';
import { notFound } from 'next/navigation';

// An operator's virtual owner membership gets the read-only view, so it may not write either.
export const requireSignInAppOwner = async (tenantId: string) => {
  const context = await requireTenantOwner(tenantId);
  if (!context.viewer.isOwner) notFound();
  return context;
};
