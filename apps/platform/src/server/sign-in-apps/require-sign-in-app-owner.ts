import 'server-only';

import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { notFound } from 'next/navigation';

// An operator's virtual owner membership gets the read-only view, so it may not write either.
export const requireSignInAppOwner = async (tenantId: string) => {
  const context = await requireTenantManager(tenantId);
  if (!context.viewer.isOwner) notFound();
  return context;
};
