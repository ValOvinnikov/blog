import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { hasStoredLeads } from '@platform/server/leads/has-stored-leads';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const resolveTenantPageAccess = async (
  { id, pageAccess }: TPlatformTenant,
  { isOwner, canManage, isSuperAdmin }: TPlatformViewer,
): Promise<TPlanPageAccess> => {
  const access = { ...pageAccess, billing: isOwner || isSuperAdmin };
  if (!canManage) return { ...access, leads: false };
  if (access.leads) return access;

  return { ...access, leads: await hasStoredLeads(id) };
};
