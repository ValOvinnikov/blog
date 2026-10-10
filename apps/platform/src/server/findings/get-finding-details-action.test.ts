import { mockDbConstants } from '@platform/testing/mock-db-constants';

import { getFindingDetailsAction } from './get-finding-details-action';

const { requireTenantByIdMock, getFindingDetailsMock } = vi.hoisted(() => ({
  requireTenantByIdMock: vi.fn(),
  getFindingDetailsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { findings: { getFindingDetails: getFindingDetailsMock } },
}));

describe(getFindingDetailsAction, () => {
  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    requireTenantByIdMock.mockResolvedValue({});
    getFindingDetailsMock.mockReset();
  });

  it('reads nothing when the tenant gate rejects', async () => {
    requireTenantByIdMock.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(
      getFindingDetailsAction('tenant-1', 'finding-1'),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(getFindingDetailsMock).not.toHaveBeenCalled();
  });

  it('returns the details read for that tenant and finding', async () => {
    getFindingDetailsMock.mockResolvedValue({ step: 'MAP_DOMAIN' });

    const result = await getFindingDetailsAction('tenant-1', 'finding-1');

    expect(requireTenantByIdMock).toHaveBeenCalledWith('tenant-1');
    expect(getFindingDetailsMock).toHaveBeenCalledWith('tenant-1', 'finding-1');
    expect(result).toEqual({ step: 'MAP_DOMAIN' });
  });
});
