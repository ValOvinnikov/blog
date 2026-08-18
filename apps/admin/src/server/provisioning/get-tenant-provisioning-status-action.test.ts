export {};

const { requireAdminMock, getTenantProvisioningStatusMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    getTenantProvisioningStatusMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantProvisioningStatus: getTenantProvisioningStatusMock },
  },
}));

describe('getTenantProvisioningStatusAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    getTenantProvisioningStatusMock.mockReset();
  });

  it('requires an admin session before querying', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { getTenantProvisioningStatusAction } =
      await import('./get-tenant-provisioning-status-action');

    await expect(getTenantProvisioningStatusAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
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
