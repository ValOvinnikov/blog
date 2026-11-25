import 'server-only';

import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import { hasStoredLeads } from '@platform/server/leads/has-stored-leads';
import { isTenantOverSeats } from '@platform/server/team/is-tenant-over-seats';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const resolveTenantPageAccess = async (
  { id, pageAccess, entitlements }: TPlatformTenant,
  { isOwner, canManage, isSuperAdmin }: TPlatformViewer,
): Promise<TPlanPageAccess> => {
  const access = { ...pageAccess, billing: isOwner || isSuperAdmin };
  if (!canManage) {
    return { ...access, leads: false, subscribers: false, team: false };
  }
  const [leads, team] = await Promise.all([
    access.leads || hasStoredLeads(id),
    access.team || isTenantOverSeats(id, entitlements.seats),
  ]);

  return { ...access, leads, team };
};
