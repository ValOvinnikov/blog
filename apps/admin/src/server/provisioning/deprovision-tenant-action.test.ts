export {};

const {
  requireAdminMock,
  listTenantsByIdsMock,
  dispatchDeprovisioningWorkflowMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  dispatchDeprovisioningWorkflowMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

vi.mock('./dispatch-deprovisioning-workflow', () => ({
  dispatchDeprovisioningWorkflow: dispatchDeprovisioningWorkflowMock,
}));

const tenant = {
  id: 'tenant-1',
  slug: 'acme',
  deprovisionedAt: null as Date | null,
};

describe('deprovisionTenantAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    listTenantsByIdsMock.mockReset();
    listTenantsByIdsMock.mockResolvedValue([tenant]);
    dispatchDeprovisioningWorkflowMock.mockReset();
    dispatchDeprovisioningWorkflowMock.mockResolvedValue(undefined);
  });

  it('requires an admin session before dispatching', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    await expect(
      deprovisionTenantAction('tenant-1', { confirm: 'acme', dryRun: true }),
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns a field error when confirm does not match the tenant slug', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'wrong-slug',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is not found', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('returns an error when the tenant is already deprovisioned', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      { ...tenant, deprovisionedAt: new Date('2026-01-01T00:00:00.000Z') },
    ]);
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: true,
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(dispatchDeprovisioningWorkflowMock).not.toHaveBeenCalled();
  });

  it('dispatches the deprovisioning workflow when confirm matches the live slug', async () => {
    const { deprovisionTenantAction } =
      await import('./deprovision-tenant-action');

    const result = await deprovisionTenantAction('tenant-1', {
      confirm: 'acme',
      dryRun: false,
    });

    expect(result).toEqual({ ok: true });
    expect(dispatchDeprovisioningWorkflowMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      confirm: 'acme',
      dryRun: false,
    });
  });
});
