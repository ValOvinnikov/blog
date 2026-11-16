import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import type { TMembershipWithTenant } from '@shinefold/db/queries/memberships';

export const mockMembershipWithTenant = (
  tenant = mockTenant(),
): TMembershipWithTenant => ({
  membership: mockMembership({ tenantId: tenant.id }),
  tenant,
});
