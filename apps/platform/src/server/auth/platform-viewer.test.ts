import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@blog/db/constants';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { buildVirtualAdminMembership } from './build-virtual-admin-membership';
import { toPlatformViewer } from './platform-viewer';

const operatorMembership = buildVirtualAdminMembership(
  mockAdmin().userId,
  MOCK_TENANT_ID,
);

describe(toPlatformViewer, () => {
  it('reads the site’s own owner as owner and manager, not operator', () => {
    expect(toPlatformViewer({ membership: mockMembership() })).toEqual({
      isOwner: true,
      canManage: true,
      isOperator: false,
      isSuperAdmin: false,
    });
  });

  it('gives another member neither ownership nor management', () => {
    const viewer = toPlatformViewer({
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    expect(viewer.isOwner).toBe(false);
    expect(viewer.canManage).toBe(false);
  });

  it('lets an operator’s virtual owner membership manage but never own', () => {
    const viewer = toPlatformViewer({
      membership: operatorMembership,
      admin: mockAdmin(),
    });

    expect(viewer.isOwner).toBe(false);
    expect(viewer.canManage).toBe(true);
    expect(viewer.isOperator).toBe(true);
  });

  it('reads an admin with no membership as an operator', () => {
    const viewer = toPlatformViewer({ admin: mockAdmin() });

    expect(viewer.isOperator).toBe(true);
    expect(viewer.isOwner).toBe(false);
  });

  it('reads a super admin as one', () => {
    const viewer = toPlatformViewer({
      admin: mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    });

    expect(viewer.isSuperAdmin).toBe(true);
  });

  it('reads a real member who is also a plain admin as no operator', () => {
    const viewer = toPlatformViewer({
      membership: mockMembership(),
      admin: mockAdmin(),
    });

    expect(viewer.isOperator).toBe(false);
    expect(viewer.isOwner).toBe(true);
  });

  it('reads no records as nobody', () => {
    expect(toPlatformViewer({})).toEqual({
      isOwner: false,
      canManage: false,
      isOperator: false,
      isSuperAdmin: false,
    });
  });
});
