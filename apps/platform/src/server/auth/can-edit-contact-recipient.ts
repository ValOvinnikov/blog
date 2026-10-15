import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { isTenantOwner } from '@platform/server/auth/is-tenant-owner';
import { planPageAccess } from '@platform/utils/plan-page-access/plan-page-access';

export const canEditContactRecipient = (
  { plan }: TTenant,
  membership: TMembership,
): boolean => planPageAccess(plan).leads && isTenantOwner(membership);
