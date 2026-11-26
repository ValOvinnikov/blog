import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenantsPageRow } from '@platform/testing/tenants/fixtures';
import { mockPinnedTenant } from '@platform/testing/tenants/pinned-tenant';

import { loadPinnedTenants } from './load-pinned-tenants';

const { listPinnedTenantsMock } = vi.hoisted(() => ({
  listPinnedTenantsMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { pinnedTenants: { listPinnedTenants: listPinnedTenantsMock } },
}));

const MOCK_ADMIN_ID = mockAdmin().id;

describe(loadPinnedTenants, () => {
  beforeEach(() => {
    listPinnedTenantsMock.mockResolvedValue([mockTenantsPageRow()]);
  });

  it('reads the pins of the admin it is given', async () => {
    await loadPinnedTenants(MOCK_ADMIN_ID);

    expect(listPinnedTenantsMock).toHaveBeenCalledWith(MOCK_ADMIN_ID);
  });

  it('returns each pin as the fields the tiles need', async () => {
    const pinned = await loadPinnedTenants(MOCK_ADMIN_ID);

    expect(pinned).toEqual([mockPinnedTenant()]);
  });
});
