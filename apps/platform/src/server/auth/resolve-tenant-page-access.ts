import 'server-only';

import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { hasStoredLeads } from '@platform/server/leads/has-stored-leads';
import { canManageSubscribers } from '@platform/server/subscribers/can-manage-subscribers';
import { isTeamOverSeatsOrLocked } from '@platform/server/team/is-team-over-seats-or-locked';
import type { TPlanPageAccess } from '@platform/utils/plan-page-access/plan-page-access';

export const resolveTenantPageAccess = async (
  context: TTenantMembershipContext,
): Promise<TPlanPageAccess> => {
  const {
    tenant: { id, pageAccess, entitlements },
    viewer: { isOwner, canManage, isSuperAdmin },
  } = context;
  const access = { ...pageAccess, billing: isOwner || isSuperAdmin };
  if (!canManage) {
    return { ...access, leads: false, subscribers: false, team: false };
  }
  const [leads, subscribers, team] = await Promise.all([
    access.leads || hasStoredLeads(id),
    canManageSubscribers(context),
    access.team || isTeamOverSeatsOrLocked(id, entitlements.seats),
  ]);

  return { ...access, leads, subscribers, team };
};
