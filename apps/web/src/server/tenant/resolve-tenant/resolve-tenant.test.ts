import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db';
import type { TTenant } from '@blog/db/schema/tenants';

import {
  isTenantServable,
  resolveTenant,
  resolveTenantById,
  resolveTenantId,
} from './resolve-tenant';

const {
  getTenantByDomainMock,
  listTenantsMock,
  getTenantByIdMock,
  isProductionEnvironmentMock,
} = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
  listTenantsMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: {
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    tenants: { listTenants: listTenantsMock, getTenantById: getTenantByIdMock },
  },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
  TENANT_PROVISIONING_STATUS: {
    PENDING: 'PENDING',
    PROVISIONING: 'PROVISIONING',
    READY: 'READY',
    FAILED: 'FAILED',
  },
}));

vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const buildServableTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    primaryDomain: 'acme.example.com',
    status: TENANT_STATUS.ACTIVE,
    sanityProjectId: 'proj',
    sanityDataset: 'production',
    sanityReadTokenEncrypted: 'encrypted-token',
    provisioningStatus: 'READY',
    ...overrides,
  } as TTenant;
};

describe(resolveTenant, () => {
  let tenant: TTenant;

  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    listTenantsMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    tenant = buildServableTenant();
    getTenantByDomainMock.mockResolvedValue(tenant);
    listTenantsMock.mockResolvedValue([tenant]);
  });

  it('resolves the full tenant row owning the host, without checking the sole-tenant fallback', async () => {
    await expect(resolveTenant('acme.example.com')).resolves.toEqual(tenant);
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('falls back to the sole tenant row outside production when there is no host at all', async () => {
    await expect(resolveTenant(null)).resolves.toEqual(tenant);
    expect(getTenantByDomainMock).not.toHaveBeenCalled();
  });

  it('refuses a matched tenant with no Sanity project/dataset/token set yet', async () => {
    getTenantByDomainMock.mockResolvedValue(
      buildServableTenant({
        sanityProjectId: null,
        sanityDataset: null,
        sanityReadTokenEncrypted: null,
      }),
    );

    await expect(resolveTenant('draft.example.com')).resolves.toBeUndefined();
    expect(listTenantsMock).not.toHaveBeenCalled();
  });

  it('resolves a matched SUSPENDED tenant — reads stay allowed while suspended', async () => {
    const suspendedTenant = buildServableTenant({
      status: TENANT_STATUS.SUSPENDED,
    });
    getTenantByDomainMock.mockResolvedValue(suspendedTenant);

    await expect(resolveTenant('suspended.example.com')).resolves.toEqual(
      suspendedTenant,
    );
  });

  describe('when the host matches no tenant', () => {
    beforeEach(() => {
      getTenantByDomainMock.mockResolvedValue(undefined);
    });

    it('falls back to the sole tenant row outside production when the host has no match', async () => {
      await expect(resolveTenant('unknown.example.com')).resolves.toEqual(
        tenant,
      );
    });

    it('resolves undefined outside production when zero or multiple tenants exist', async () => {
      listTenantsMock.mockResolvedValue([]);
      await expect(
        resolveTenant('unknown.example.com'),
      ).resolves.toBeUndefined();

      listTenantsMock.mockResolvedValue([
        buildServableTenant({ id: 'tenant-1' }),
        buildServableTenant({ id: 'tenant-2' }),
      ]);
      await expect(
        resolveTenant('unknown.example.com'),
      ).resolves.toBeUndefined();
    });

    it('falls back to a sole dev tenant with no provisioningStatus recorded', async () => {
      const devTenant = buildServableTenant({ provisioningStatus: null });
      listTenantsMock.mockResolvedValue([devTenant]);

      await expect(resolveTenant('unknown.example.com')).resolves.toEqual(
        devTenant,
      );
    });
  });

  describe('when the matched tenant is archived', () => {
    beforeEach(() => {
      getTenantByDomainMock.mockResolvedValue(
        buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
      );
    });

    it('refuses an archived matched tenant instead of resolving it', async () => {
      await expect(
        resolveTenant('archived.example.com'),
      ).resolves.toBeUndefined();
    });

    it('never falls back to the sole tenant when the matched host is archived, even outside production', async () => {
      listTenantsMock.mockResolvedValue([buildServableTenant()]);

      await expect(
        resolveTenant('archived.example.com'),
      ).resolves.toBeUndefined();
      expect(listTenantsMock).not.toHaveBeenCalled();
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      isProductionEnvironmentMock.mockReturnValue(true);
    });

    it('never falls back to the sole tenant in production', async () => {
      getTenantByDomainMock.mockResolvedValue(undefined);

      await expect(
        resolveTenant('unknown.example.com'),
      ).resolves.toBeUndefined();
      expect(listTenantsMock).not.toHaveBeenCalled();
    });

    it('resolves the matched tenant in production without touching the fallback', async () => {
      await expect(resolveTenant('acme.example.com')).resolves.toEqual(tenant);
      expect(listTenantsMock).not.toHaveBeenCalled();
    });

    it('refuses a matched tenant whose provisioning is not READY in production', async () => {
      getTenantByDomainMock.mockResolvedValue(
        buildServableTenant({ provisioningStatus: 'FAILED' }),
      );

      await expect(
        resolveTenant('half-provisioned.example.com'),
      ).resolves.toBeUndefined();
    });

    it('refuses an archived matched tenant in production', async () => {
      getTenantByDomainMock.mockResolvedValue(
        buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
      );

      await expect(
        resolveTenant('archived.example.com'),
      ).resolves.toBeUndefined();
    });
  });
});

describe(resolveTenantById, () => {
  beforeEach(() => {
    getTenantByIdMock.mockReset();
  });

  it('resolves the full tenant row by id', async () => {
    const tenant = buildServableTenant();
    getTenantByIdMock.mockResolvedValue(tenant);

    await expect(resolveTenantById('tenant-1')).resolves.toEqual(tenant);
    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1');
  });

  it('resolves undefined when no tenant matches the id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(resolveTenantById('missing')).resolves.toBeUndefined();
  });

  it('refuses an archived matched tenant instead of resolving it', async () => {
    getTenantByIdMock.mockResolvedValue(
      buildServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );

    await expect(resolveTenantById('tenant-1')).resolves.toBeUndefined();
  });

  it('refuses a matched tenant with no Sanity project/dataset/token set yet', async () => {
    getTenantByIdMock.mockResolvedValue(
      buildServableTenant({
        sanityProjectId: null,
        sanityDataset: null,
        sanityReadTokenEncrypted: null,
      }),
    );

    await expect(resolveTenantById('tenant-1')).resolves.toBeUndefined();
  });
});

describe(isTenantServable, () => {
  beforeEach(() => {
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it('does not require READY outside production', () => {
    const tenant = buildServableTenant({ provisioningStatus: null });

    expect(isTenantServable(tenant)).toBe(true);
  });

  it('rejects an archived tenant regardless of provisioning status', () => {
    const tenant = buildServableTenant({ status: TENANT_STATUS.ARCHIVED });

    expect(isTenantServable(tenant)).toBe(false);
  });

  describe('in production', () => {
    beforeEach(() => {
      isProductionEnvironmentMock.mockReturnValue(true);
    });

    it('accepts a READY tenant with credentials in production', () => {
      const tenant = buildServableTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });

      expect(isTenantServable(tenant)).toBe(true);
    });

    it('rejects a non-READY tenant in production even with credentials present', () => {
      const tenant = buildServableTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      });

      expect(isTenantServable(tenant)).toBe(false);
    });

    it('rejects a tenant with no provisioningStatus recorded in production', () => {
      const tenant = buildServableTenant({ provisioningStatus: null });

      expect(isTenantServable(tenant)).toBe(false);
    });

    it('rejects a tenant missing Sanity credentials regardless of provisioning status', () => {
      const tenant = buildServableTenant({
        sanityProjectId: null,
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      });

      expect(isTenantServable(tenant)).toBe(false);
    });
  });
});

describe(resolveTenantId, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockReset();
    listTenantsMock.mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
  });

  it("delegates to resolveTenant and returns the resolved row's id", async () => {
    getTenantByDomainMock.mockResolvedValue(buildServableTenant());

    await expect(resolveTenantId('acme.example.com')).resolves.toBe('tenant-1');
    expect(getTenantByDomainMock).toHaveBeenCalledWith('acme.example.com');
  });

  it('resolves undefined when resolveTenant resolves no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([]);

    await expect(
      resolveTenantId('unknown.example.com'),
    ).resolves.toBeUndefined();
  });

  it('passes a null host through unchanged', async () => {
    listTenantsMock.mockResolvedValue([buildServableTenant()]);

    await expect(resolveTenantId(null)).resolves.toBe('tenant-1');
    expect(getTenantByDomainMock).not.toHaveBeenCalled();
  });
});
