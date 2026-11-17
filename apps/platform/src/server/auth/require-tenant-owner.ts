import 'server-only';

import { requireTenantOwnerOrAdmin } from './require-tenant-owner-or-admin';

export const requireTenantOwner = (tenantId: string): Promise<void> =>
  requireTenantOwnerOrAdmin(tenantId, () => false);
