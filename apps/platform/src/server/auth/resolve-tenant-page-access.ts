import 'server-only';

import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { hasStoredLeads } from '@platform/server/leads/has-stored-leads';
import {
  planPageAccess,
  type TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';

export const resolveTenantPageAccess = async (
  { id, plan }: TTenant,
  membership: TMembership,
): Promise<TPlanPageAccess> => {
  const access = planPageAccess(plan);
  if (!isTenantOwner(membership)) return { ...access, leads: false };
  if (access.leads) return access;

  return { ...access, leads: await hasStoredLeads(id) };
};
