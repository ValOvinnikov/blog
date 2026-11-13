import { MEMBERSHIP_ROLE, type TAdminRole } from '@blog/db/constants';
import type { TMembership } from '@blog/db/schema/memberships';
import {
  type TPlatformViewer,
  toPlatformViewer,
  type TViewerRecords,
} from '@platform/server/auth/platform-viewer';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const mockMembership = (
  overrides: Partial<TMembership> = {},
): TMembership => ({
  id: '6a1b2c3d-0000-4000-8000-000000000001',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  lockedAt: null,
  ...overrides,
});

export const mockViewer = (
  records: TViewerRecords = {
    membership: mockMembership(),
  },
): TPlatformViewer => toPlatformViewer(records);

export const mockOperatorViewer = (role: TAdminRole): TPlatformViewer =>
  mockViewer({ admin: mockAdmin({ role }) });

export const mockMembershipContext = (
  tenant: TPlatformTenant,
  membership: TMembership = mockMembership({ tenantId: tenant.id }),
): TTenantMembershipContext => ({
  tenant,
  membership,
  viewer: mockViewer({ membership }),
});
