import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import {
  type TPlatformViewer,
  toPlatformViewer,
  type TViewerRecords,
} from '@platform/server/auth/platform-viewer';
import type { TTenantByIdContext } from '@platform/server/auth/require-tenant-by-id';
import type { TTenantMembershipContext } from '@platform/server/auth/require-tenant-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  type TAdminRole,
} from '@shinefold/db/constants';
import type { TMembership } from '@shinefold/db/schema/memberships';

export const mockMembership = (
  overrides: Partial<TMembership> = {},
): TMembership => ({
  id: '6a1b2c3d-0000-4000-8000-000000000001',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
  createdAt: new Date('2026-10-01T00:00:00.000Z'),
  lockedAt: null,
  sanityInviteId: null,
  sanityInviteSentAt: null,
  sanityInviteAcceptedAt: null,
  sanityUserId: null,
  sanityLoginProvider: null,
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

export const mockEditorMembershipContext = (
  tenant: TPlatformTenant,
): TTenantMembershipContext =>
  mockMembershipContext(
    tenant,
    mockMembership({ tenantId: tenant.id, role: MEMBERSHIP_ROLE.EDITOR }),
  );

export const mockOperatorMembershipContext = (
  tenant: TPlatformTenant,
  role: TAdminRole = ADMIN_ROLE.ADMIN,
): TTenantMembershipContext => {
  const admin = mockAdmin({ role });
  const membership = buildVirtualAdminMembership(admin.userId, tenant.id);

  return { tenant, membership, viewer: mockViewer({ membership, admin }) };
};

export const mockTenantByIdContext = (
  tenant: TPlatformTenant,
  role: TAdminRole = ADMIN_ROLE.ADMIN,
): TTenantByIdContext => {
  const admin = mockAdmin({ role });
  const viewer = mockViewer({ admin });

  return { tenant, admin, viewer, canGrantEntitlements: viewer.isSuperAdmin };
};
