import { ACTION_OUTCOME } from '@blog/config';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';

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
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
  });

  it('refuses an unknown tenant before running the precondition', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);
    const precondition = vi.fn(() => TENANT_REFUSAL.NOT_DEPROVISIONED);

    const result = await resolveConfirmedTenant('ghost', 'Acme', {
      precondition,
    });

    expect(precondition).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it('reports a failed precondition ahead of a name mismatch', async () => {
    const result = await resolveConfirmedTenant('tenant-1', 'wrong', {
      precondition: () => TENANT_REFUSAL.NOT_DEPROVISIONED,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_DEPROVISIONED,
    });
  });

  it('checks the name once the precondition passes', async () => {
    const result = await resolveConfirmedTenant('tenant-1', 'acme', {
      precondition: () => undefined,
    });

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
  });
});
