import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import {
  MOCK_TENANT_ID,
  mockFirstStepRunningProvisioningSteps,
} from '@platform/testing/tenants/fixtures';
import { NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';

import { getTenantProvisioningStatusAction } from './get-tenant-provisioning-status-action';

vi.mock('@platform/server/auth/require-tenant-owner-or-admin');

vi.mock('@shinefold/db', () => ({
  queries: { tenants: { getTenantProvisioningStatus: vi.fn() } },
}));

const getTenantProvisioningStatusMock = vi.mocked(
  queries.tenants.getTenantProvisioningStatus,
);

describe(getTenantProvisioningStatusAction, () => {
  it("requires the tenant's owner or an admin before querying", async () => {
    vi.mocked(requireTenantOwnerOrAdmin).mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(
      getTenantProvisioningStatusAction(MOCK_TENANT_ID),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(requireTenantOwnerOrAdmin).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getTenantProvisioningStatusMock).not.toHaveBeenCalled();
  });

  it('returns the fresh status and step map for the given tenant id', async () => {
    const status = {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: mockFirstStepRunningProvisioningSteps(),
    };
    getTenantProvisioningStatusMock.mockResolvedValueOnce(status);

    const result = await getTenantProvisioningStatusAction(MOCK_TENANT_ID);

    expect(getTenantProvisioningStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(result).toEqual(status);
  });
});
