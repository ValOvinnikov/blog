import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

export const makeMembership = (
  overrides: Partial<TMembership> = {},
): TMembership => ({
  id: '6a1b2c3d-0000-4000-8000-000000000001',
  userId: 'user-1',
  tenantId: TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  ...overrides,
});
