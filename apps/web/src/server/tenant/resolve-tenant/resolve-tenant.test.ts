import { queries } from '@blog/db';
import { TENANT_PROVISIONING_STATUS, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import { mockServableTenant } from '@web/testing/server/tenant/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

import {
  isTenantServable,
  resolveTenant,
  resolveTenantById,
  resolveTenantId,
} from './resolve-tenant';

faker.seed(7301);

vi.mock('@web/utils/is-production-environment');
vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    tenantDomains: { getTenantByDomain: vi.fn() },
    tenants: { listTenants: vi.fn(), getTenantById: vi.fn() },
  },
}));

const MOCK_UNKNOWN_HOST = faker.internet.domainName();

const MOCK_TENANT = mockServableTenant();

const MOCK_TENANT_WITHOUT_SANITY_CREDENTIALS = mockServableTenant({
  sanityProjectId: null,
  sanityDataset: null,
  sanityReadTokenEncrypted: null,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe(resolveTenant, () => {
  beforeEach(() => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      MOCK_TENANT,
    );
    vi.mocked(queries.tenants.listTenants).mockResolvedValue([MOCK_TENANT]);
  });

  it('resolves the tenant owning the host without the sole-tenant fallback', async () => {
    await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toEqual(MOCK_TENANT);
    expect(queries.tenants.listTenants).not.toHaveBeenCalled();
  });

  it('refuses a matched tenant with no Sanity credentials set yet', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      MOCK_TENANT_WITHOUT_SANITY_CREDENTIALS,
    );

    await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toBeUndefined();
    expect(queries.tenants.listTenants).not.toHaveBeenCalled();
  });

  it('resolves a matched suspended tenant', async () => {
    const suspendedTenant = mockServableTenant({
      status: TENANT_STATUS.SUSPENDED,
    });
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      suspendedTenant,
    );

    await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toEqual(
      suspendedTenant,
    );
  });

  it('refuses an archived matched tenant without falling back to the sole tenant', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      mockServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );

    await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toBeUndefined();
    expect(queries.tenants.listTenants).not.toHaveBeenCalled();
  });

  describe('outside production', () => {
    it.each([TENANT_PROVISIONING_STATUS.READY, null])(
      'falls back to the sole tenant when there is no host (provisioning %s)',
      async (provisioningStatus) => {
        const soleTenant = mockServableTenant({ provisioningStatus });
        vi.mocked(queries.tenants.listTenants).mockResolvedValue([soleTenant]);

        await expect(resolveTenant(null)).resolves.toEqual(soleTenant);
        expect(queries.tenantDomains.getTenantByDomain).not.toHaveBeenCalled();
      },
    );

    it('falls back to the sole tenant when the host matches no tenant', async () => {
      vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
        undefined,
      );

      await expect(resolveTenant(MOCK_UNKNOWN_HOST)).resolves.toEqual(
        MOCK_TENANT,
      );
    });

    it.each([
      ['no tenant exists', []],
      [
        'several tenants exist',
        [MOCK_TENANT, mockServableTenant({ id: MOCK_OTHER_TENANT_ID })],
      ],
    ])(
      'resolves undefined when the host matches nothing and %s',
      async (_, tenants: TTenant[]) => {
        vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
          undefined,
        );
        vi.mocked(queries.tenants.listTenants).mockResolvedValue(tenants);

        await expect(resolveTenant(MOCK_UNKNOWN_HOST)).resolves.toBeUndefined();
      },
    );
  });

  describe('in production', () => {
    beforeEach(() => {
      vi.mocked(isProductionEnvironment).mockReturnValue(true);
    });

    it('never falls back to the sole tenant', async () => {
      vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
        undefined,
      );

      await expect(resolveTenant(MOCK_UNKNOWN_HOST)).resolves.toBeUndefined();
      expect(queries.tenants.listTenants).not.toHaveBeenCalled();
    });

    it('resolves the matched tenant without touching the fallback', async () => {
      await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toEqual(
        MOCK_TENANT,
      );
      expect(queries.tenants.listTenants).not.toHaveBeenCalled();
    });

    it('refuses a matched tenant whose provisioning is not ready', async () => {
      vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
        mockServableTenant({
          provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
        }),
      );

      await expect(resolveTenant(MOCK_TENANT_HOST)).resolves.toBeUndefined();
    });
  });
});

describe(resolveTenantById, () => {
  it('resolves the tenant row by id', async () => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(MOCK_TENANT);

    await expect(resolveTenantById(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_TENANT,
    );
    expect(queries.tenants.getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('resolves undefined when no tenant matches the id', async () => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(undefined);

    await expect(resolveTenantById(MOCK_TENANT_ID)).resolves.toBeUndefined();
  });

  it('refuses a matched tenant that is not servable', async () => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockServableTenant({ status: TENANT_STATUS.ARCHIVED }),
    );

    await expect(resolveTenantById(MOCK_TENANT_ID)).resolves.toBeUndefined();
  });
});

describe(isTenantServable, () => {
  it.each([
    {
      name: 'accepts a tenant with no provisioning status outside production',
      isProduction: false,
      tenant: mockServableTenant({ provisioningStatus: null }),
      expected: true,
    },
    {
      name: 'rejects an archived tenant outside production',
      isProduction: false,
      tenant: mockServableTenant({ status: TENANT_STATUS.ARCHIVED }),
      expected: false,
    },
    {
      name: 'rejects a tenant missing Sanity credentials outside production',
      isProduction: false,
      tenant: MOCK_TENANT_WITHOUT_SANITY_CREDENTIALS,
      expected: false,
    },
    {
      name: 'accepts a ready tenant with credentials in production',
      isProduction: true,
      tenant: MOCK_TENANT,
      expected: true,
    },
    {
      name: 'rejects a tenant whose provisioning failed in production',
      isProduction: true,
      tenant: mockServableTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.FAILED,
      }),
      expected: false,
    },
    {
      name: 'rejects a tenant with no provisioning status in production',
      isProduction: true,
      tenant: mockServableTenant({ provisioningStatus: null }),
      expected: false,
    },
    {
      name: 'rejects a ready tenant missing a Sanity project in production',
      isProduction: true,
      tenant: mockServableTenant({ sanityProjectId: null }),
      expected: false,
    },
    {
      name: 'rejects an archived ready tenant in production',
      isProduction: true,
      tenant: mockServableTenant({ status: TENANT_STATUS.ARCHIVED }),
      expected: false,
    },
  ])('$name', ({ isProduction, tenant, expected }) => {
    vi.mocked(isProductionEnvironment).mockReturnValue(isProduction);

    expect(isTenantServable(tenant)).toBe(expected);
  });
});

describe(resolveTenantId, () => {
  it("returns the resolved tenant's id", async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      MOCK_TENANT,
    );

    await expect(resolveTenantId(MOCK_TENANT_HOST)).resolves.toBe(
      MOCK_TENANT_ID,
    );
    expect(queries.tenantDomains.getTenantByDomain).toHaveBeenCalledWith(
      MOCK_TENANT_HOST,
    );
  });

  it('resolves undefined when no tenant resolves', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      undefined,
    );
    vi.mocked(queries.tenants.listTenants).mockResolvedValue([]);

    await expect(resolveTenantId(MOCK_UNKNOWN_HOST)).resolves.toBeUndefined();
  });

  it('resolves the sole tenant for a request without a host', async () => {
    vi.mocked(queries.tenants.listTenants).mockResolvedValue([MOCK_TENANT]);

    await expect(resolveTenantId(null)).resolves.toBe(MOCK_TENANT_ID);
    expect(queries.tenantDomains.getTenantByDomain).not.toHaveBeenCalled();
  });
});
