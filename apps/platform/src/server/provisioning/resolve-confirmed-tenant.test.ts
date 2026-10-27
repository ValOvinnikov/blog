import { ACTION_OUTCOME } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_FIELD_ERROR, TENANT_REFUSAL } from '@platform/constants/tenant';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import { resolveConfirmedTenant } from './resolve-confirmed-tenant';

vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantById: vi.fn() } },
}));

const getTenantByIdMock = vi.mocked(queries.tenants.getTenantById);

const tenant = mockTenant();

describe(resolveConfirmedTenant, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
    getTenantByIdMock.mockResolvedValue(tenant);
  });

  it('returns the tenant, archived ones included, when confirm matches its name', async () => {
    const result = await resolveConfirmedTenant(
      MOCK_TENANT_ID,
      MOCK_TENANT_NAME,
    );

    expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS, tenant });
  });

  it('refuses an unknown tenant before running the precondition', async () => {
    getTenantByIdMock.mockResolvedValueOnce(undefined);
    const precondition = vi.fn(() => TENANT_REFUSAL.NOT_DEPROVISIONED);

    const result = await resolveConfirmedTenant(
      MOCK_OTHER_TENANT_ID,
      MOCK_TENANT_NAME,
      { precondition },
    );

    expect(precondition).not.toHaveBeenCalled();
    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_FOUND,
    });
  });

  it('reports a failed precondition ahead of a name mismatch', async () => {
    const result = await resolveConfirmedTenant(
      MOCK_TENANT_ID,
      MOCK_TENANT_NAME.toLowerCase(),
      { precondition: () => TENANT_REFUSAL.NOT_DEPROVISIONED },
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.REFUSED,
      reason: TENANT_REFUSAL.NOT_DEPROVISIONED,
    });
  });

  it('checks the name once the precondition passes', async () => {
    const result = await resolveConfirmedTenant(
      MOCK_TENANT_ID,
      MOCK_TENANT_NAME.toLowerCase(),
      { precondition: () => undefined },
    );

    expect(result).toEqual({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { confirm: { reason: TENANT_FIELD_ERROR.NAME_MISMATCH } },
    });
  });
});
