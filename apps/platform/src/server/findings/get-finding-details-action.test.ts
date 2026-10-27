import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { TENANT_PROVISIONING_STEP } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { getFindingDetailsAction } from './get-finding-details-action';

faker.seed(5998);

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

const MOCK_FINDING_ID = faker.string.uuid();
const MOCK_FINDING_DETAILS = { step: TENANT_PROVISIONING_STEP.MAP_DOMAIN };

describe(getFindingDetailsAction, () => {
  beforeEach(() => {
    requireTenantByIdMock.mockReset();
    getFindingDetailsMock.mockReset();
  });

  it('reads nothing when the tenant gate rejects', async () => {
    requireTenantByIdMock.mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(
      getFindingDetailsAction(MOCK_TENANT_ID, MOCK_FINDING_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    expect(getFindingDetailsMock).not.toHaveBeenCalled();
  });

  it('returns the details read for that tenant and finding', async () => {
    getFindingDetailsMock.mockResolvedValue(MOCK_FINDING_DETAILS);

    const result = await getFindingDetailsAction(
      MOCK_TENANT_ID,
      MOCK_FINDING_ID,
    );

    expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getFindingDetailsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_FINDING_ID,
    );
    expect(result).toEqual(MOCK_FINDING_DETAILS);
  });
});
