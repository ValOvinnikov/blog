import { notFound, redirect } from 'next/navigation';

const { requireSuperAdminMock, startProvisioningMock, getTenantByIdMock } =
  vi.hoisted(() => ({
    requireSuperAdminMock: vi.fn(),
    startProvisioningMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('./start-provisioning', () => ({
  startProvisioning: startProvisioningMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
    },
  },
}));

describe('retryProvisioningStepAction', () => {
  let retryProvisioningStepAction: typeof import('./retry-provisioning-step-action').retryProvisioningStepAction;

  beforeEach(async () => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    startProvisioningMock.mockReset();
    startProvisioningMock.mockResolvedValue({ outcome: 'dispatched' });
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      deprovisionedAt: null,
    });
    ({ retryProvisioningStepAction } =
      await import('./retry-provisioning-step-action'));
  });

  it('requires a super-admin session before dispatching', async () => {
    requireSuperAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(retryProvisioningStepAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it("rejects an ADMIN-role caller via requireSuperAdmin's 404, before touching provisioning", async () => {
    requireSuperAdminMock.mockImplementation(() => {
      notFound();
    });

    await expect(retryProvisioningStepAction('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(redirect).not.toHaveBeenCalled();
    expect(startProvisioningMock).not.toHaveBeenCalled();
  });

  it.each(['dispatched', 'already-in-progress', 'not-found', 'dispatch-error'])(
    'starts provisioning and returns its %s outcome',
    async (outcome) => {
      startProvisioningMock.mockResolvedValue({ outcome });

      const result = await retryProvisioningStepAction('tenant-1');

      expect(startProvisioningMock).toHaveBeenCalledWith('tenant-1');
      expect(result).toEqual({ outcome });
    },
  );

  it('returns "not-found" without starting provisioning when the tenant does not exist', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await retryProvisioningStepAction('ghost');

    expect(getTenantByIdMock).toHaveBeenCalledWith('ghost', {
      includeArchived: true,
    });
    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'not-found' });
  });

  it('rejects a start/retry against an archived tenant server-side, without starting provisioning', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    const result = await retryProvisioningStepAction('tenant-1');

    expect(startProvisioningMock).not.toHaveBeenCalled();
    expect(result).toEqual({ outcome: 'archived' });
  });
});
