export {};

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
      throw new Error('NEXT_REDIRECT');
    });
    const { getTenantProvisioningStatusAction } =
      await import('./get-tenant-provisioning-status-action');

    await expect(getTenantProvisioningStatusAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(requireTenantOwnerOrAdminMock).toHaveBeenCalledWith('tenant-1');
    expect(getTenantProvisioningStatusMock).not.toHaveBeenCalled();
  });

  it('returns the fresh status and step map for the given tenant id', async () => {
    const result = {
      provisioningStatus: 'PROVISIONING',
      provisioningSteps: { SANITY_PROJECT: { status: 'RUNNING' } },
    };
    getTenantProvisioningStatusMock.mockResolvedValue(result);
    const { getTenantProvisioningStatusAction } =
      await import('./get-tenant-provisioning-status-action');

    await expect(
      getTenantProvisioningStatusAction('tenant-1'),
    ).resolves.toEqual(result);
    expect(getTenantProvisioningStatusMock).toHaveBeenCalledWith('tenant-1');
  });
});
