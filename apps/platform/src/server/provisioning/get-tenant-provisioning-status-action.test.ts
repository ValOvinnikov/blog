import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';

const { requireTenantOwnerOrAdminMock, getTenantProvisioningStatusMock } =
  vi.hoisted(() => ({
    requireTenantOwnerOrAdminMock: vi.fn(),
    getTenantProvisioningStatusMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-tenant-owner-or-admin', () => ({
  requireTenantOwnerOrAdmin: requireTenantOwnerOrAdminMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantProvisioningStatus: getTenantProvisioningStatusMock },
  },
}));

describe('getTenantProvisioningStatusAction', () => {
  beforeEach(() => {
    requireTenantOwnerOrAdminMock.mockReset();
    requireTenantOwnerOrAdminMock.mockResolvedValue(undefined);
    getTenantProvisioningStatusMock.mockReset();
  });

  it("requires the tenant's owner or an admin before querying", async () => {
    requireTenantOwnerOrAdminMock.mockImplementation(() => {
      throw new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);
    });
    const { getTenantProvisioningStatusAction } =
      await import('./get-tenant-provisioning-status-action');

    await expect(getTenantProvisioningStatusAction(TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );
    expect(requireTenantOwnerOrAdminMock).toHaveBeenCalledWith(TENANT_ID);
    expect(getTenantProvisioningStatusMock).not.toHaveBeenCalled();
  });

  it('returns the fresh status and step map for the given tenant id', async () => {
    const result = {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    };
    getTenantProvisioningStatusMock.mockResolvedValue(result);
    const { getTenantProvisioningStatusAction } =
      await import('./get-tenant-provisioning-status-action');

    await expect(getTenantProvisioningStatusAction(TENANT_ID)).resolves.toEqual(
      result,
    );
    expect(getTenantProvisioningStatusMock).toHaveBeenCalledWith(TENANT_ID);
  });
});
