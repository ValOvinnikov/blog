import 'server-only';

import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { hasStoredLeads } from '@platform/server/leads/has-stored-leads';
import {
  planPageAccess,
  type TPlanPageAccess,
} from '@platform/utils/plan-page-access/plan-page-access';

export const resolveTenantPageAccess = async (
  { id, plan }: TTenant,
  { role }: TMembership,
): Promise<TPlanPageAccess> => {
  const access = planPageAccess(plan);
  if (role !== MEMBERSHIP_ROLE.OWNER) return { ...access, leads: false };
  if (access.leads) return access;

  return { ...access, leads: await hasStoredLeads(id) };
};
