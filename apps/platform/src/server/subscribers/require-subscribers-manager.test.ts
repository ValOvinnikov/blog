import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { mockMembershipContext } from '@platform/testing/memberships/fixtures';
import { mockPlatformNewsletterTenant } from '@platform/testing/subscribers/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';

import { canManageSubscribers } from './can-manage-subscribers';
import { requireSubscribersManager } from './require-subscribers-manager';

vi.mock('@platform/server/auth/require-tenant-manager', () => ({
  requireTenantManager: vi.fn(),
}));
vi.mock('./can-manage-subscribers', () => ({
  canManageSubscribers: vi.fn(),
}));

const context = mockMembershipContext(mockPlatformNewsletterTenant());

describe(requireSubscribersManager, () => {
  beforeEach(() => {
    vi.mocked(requireTenantManager).mockResolvedValue(context);
  });

  it('returns the manager context the subscribers rule admits', async () => {
    vi.mocked(canManageSubscribers).mockResolvedValue(true);

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).resolves.toBe(
      context,
    );
    expect(requireTenantManager).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(canManageSubscribers).toHaveBeenCalledWith(context);
  });

  it('answers not found when the subscribers rule refuses', async () => {
    vi.mocked(canManageSubscribers).mockResolvedValue(false);

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });
});
