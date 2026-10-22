import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

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
    requireTenantByIdMock.mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(
      getFindingDetailsAction(TENANT_ID, 'finding-1'),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(getFindingDetailsMock).not.toHaveBeenCalled();
  });

  it('returns the details read for that tenant and finding', async () => {
    getFindingDetailsMock.mockResolvedValue({
      step: TENANT_PROVISIONING_STEP.MAP_DOMAIN,
    });

    const result = await getFindingDetailsAction(TENANT_ID, 'finding-1');

    expect(requireTenantByIdMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getFindingDetailsMock).toHaveBeenCalledWith(TENANT_ID, 'finding-1');
    expect(result).toEqual({ step: TENANT_PROVISIONING_STEP.MAP_DOMAIN });
  });
});
