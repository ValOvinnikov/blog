import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import { requireTenantOwner } from './require-tenant-owner';

vi.mock('@platform/server/auth/require-tenant-membership');

describe(requireTenantOwner, () => {
  it('passes on the failure of the membership gate', async () => {
    vi.mocked(requireTenantMembership).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(requireTenantOwner(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('404s for an editor', async () => {
    vi.mocked(requireTenantMembership).mockResolvedValueOnce({
      tenant: mockReadyTenant({ id: MOCK_TENANT_ID }),
      membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    });

    await expect(requireTenantOwner(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('admits an owner', async () => {
    const { membership } = await requireTenantOwner(MOCK_TENANT_ID);

    expect(membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
  });
});
