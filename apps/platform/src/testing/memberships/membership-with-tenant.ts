import type { TMembershipWithTenant } from '@blog/db/queries/memberships';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';

export const mockMembershipWithTenant = (
  tenant = mockTenant(),
): TMembershipWithTenant => ({
  membership: mockMembership({ tenantId: tenant.id }),
  tenant,
});
