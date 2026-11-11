import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';

import { isRealTenantOwner } from './is-real-tenant-owner';

const owner = mockMembership();

describe(isRealTenantOwner, () => {
  it('accepts the tenant’s own owner', () => {
    expect(isRealTenantOwner(owner)).toBe(true);
  });

  it('rejects another member', () => {
    const editor = mockMembership({ role: MEMBERSHIP_ROLE.EDITOR });

    expect(isRealTenantOwner(editor)).toBe(false);
  });

  it('rejects an operator’s virtual owner membership', () => {
    const operator = buildVirtualAdminMembership(
      mockAdmin().userId,
      owner.tenantId,
    );

    expect(isRealTenantOwner(operator)).toBe(false);
  });
});
