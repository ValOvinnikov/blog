import { TENANT_STATUS } from '@blog/db';

import { isTenantActive } from './is-tenant-active';

const { getTenantByIdMock } = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
    },
  },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));

const TENANT_ID = 'tenant-a';

describe(isTenantActive, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
  });

  it('returns true for an active tenant', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ACTIVE,
    });

    const result = await isTenantActive(TENANT_ID);

    expect(result).toBe(true);
  });

  it('returns false for a suspended tenant', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.SUSPENDED,
    });

    const result = await isTenantActive(TENANT_ID);

    expect(result).toBe(false);
  });

  it('returns false for an archived tenant', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: TENANT_ID,
      status: TENANT_STATUS.ARCHIVED,
    });

    const result = await isTenantActive(TENANT_ID);

    expect(result).toBe(false);
  });

  it('returns false when the tenant lookup returns undefined', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    const result = await isTenantActive(TENANT_ID);

    expect(result).toBe(false);
  });
});
