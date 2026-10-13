const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: getTenantByIdMock } },
}));

const tenant = {
  id: 'tenant-1',
  name: 'Acme',
  deprovisionedAt: null,
};

describe('resolveConfirmedTenant', () => {
  let resolveConfirmedTenant: typeof import('./resolve-confirmed-tenant').resolveConfirmedTenant;

  beforeEach(async () => {
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(tenant);
    ({ resolveConfirmedTenant } = await import('./resolve-confirmed-tenant'));
  });

  it('returns the tenant, archived ones included, when confirm matches its name', async () => {
    const result = await resolveConfirmedTenant('tenant-1', 'Acme');

    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1', {
      includeArchived: true,
    });
    expect(result).toEqual({ ok: true, tenant });
  });

  it('refuses an unknown tenant before running the precondition', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const precondition = vi.fn(() => 'notDeprovisioned' as const);

    const result = await resolveConfirmedTenant('ghost', 'Acme', {
      precondition,
    });

    expect(precondition).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'notFound' });
  });

  it('reports a failed precondition ahead of a name mismatch', async () => {
    const result = await resolveConfirmedTenant('tenant-1', 'wrong', {
      precondition: () => 'notDeprovisioned',
    });

    expect(result).toEqual({ ok: false, reason: 'notDeprovisioned' });
  });

  it('checks the name once the precondition passes', async () => {
    const result = await resolveConfirmedTenant('tenant-1', 'acme', {
      precondition: () => undefined,
    });

    expect(result).toEqual({ ok: false, reason: 'nameMismatch' });
  });
});
