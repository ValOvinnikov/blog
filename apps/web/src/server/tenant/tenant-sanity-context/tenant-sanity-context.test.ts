import { LOCALE_ISO_CODES } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';

import {
  getHostTenantSanityContext,
  getHostTenantSanityWriteContext,
} from './tenant-sanity-context';

const { isProductionEnvironmentMock, getPlatformSanityContextMock } =
  vi.hoisted(() => ({
    isProductionEnvironmentMock: vi.fn(),
    getPlatformSanityContextMock: vi.fn(),
  }));

vi.mock('@web/server/tenant/request-tenant/request-tenant', () => ({
  resolveRequestTenant: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      toTenantSanityCredentials: vi.fn(),
      toTenantSanityWriteCredentials: vi.fn(),
    },
  },
  TENANT_STATUS: {
    ACTIVE: 'ACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
  },
}));
vi.mock('@blog/service', () => ({
  getPlatformSanityContext: getPlatformSanityContextMock,
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));

const platformTenant = {
  projectId: 'platform-project',
  dataset: 'production',
  token: 'platform-token',
};

describe(getHostTenantSanityContext, () => {
  beforeEach(() => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReset();
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    getPlatformSanityContextMock.mockReset();
    getPlatformSanityContextMock.mockReturnValue(platformTenant);
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
    } as never);
  });

  it('resolves the tenant Sanity credentials for a resolved tenant', async () => {
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      defaultLocale: LOCALE_ISO_CODES.EN,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: {
        projectId: 'proj',
        dataset: 'production',
        token: 'tok',
        defaultLocale: LOCALE_ISO_CODES.EN,
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      },
    });
    expect(queries.tenants.toTenantSanityCredentials).toHaveBeenCalledWith({
      id: 'tenant-1',
    });
  });

  it('falls back to the platform Sanity context outside production when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: platformTenant,
    });
  });

  it('falls back to the platform Sanity context outside production when the matched tenant has no credentials set', async () => {
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
      undefined,
    );

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: platformTenant,
    });
  });

  describe('in production', () => {
    beforeEach(() => {
      isProductionEnvironmentMock.mockReturnValue(true);
    });

    it('resolves as unresolvable in production when no tenant resolves', async () => {
      vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

      await expect(getHostTenantSanityContext()).resolves.toEqual({
        isResolvable: false,
      });
      expect(queries.tenants.toTenantSanityCredentials).not.toHaveBeenCalled();
    });

    it('resolves as unresolvable in production when the matched tenant has no credentials set, never falling back to the platform context', async () => {
      vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
        undefined,
      );

      await expect(getHostTenantSanityContext()).resolves.toEqual({
        isResolvable: false,
      });
      expect(getPlatformSanityContextMock).not.toHaveBeenCalled();
    });
  });
});

describe('getHostTenantSanityContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and credentials derivation when called more than once in the same render pass', async () => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReset();
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      id: 'tenant-1',
    } as never);
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      defaultLocale: LOCALE_ISO_CODES.EN,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: (fn: () => unknown) => {
          let called = false;
          let result: unknown;
          return () => {
            if (!called) {
              result = fn();
              called = true;
            }
            return result;
          };
        },
      };
    });
    vi.resetModules();

    const { getHostTenantSanityContext: freshGetHostTenantSanityContext } =
      await import('./tenant-sanity-context');

    await freshGetHostTenantSanityContext();
    await freshGetHostTenantSanityContext();

    expect(resolveRequestTenant).toHaveBeenCalledTimes(1);
    expect(queries.tenants.toTenantSanityCredentials).toHaveBeenCalledTimes(1);
  });
});

const ACTIVE_ROW = {
  id: 'tenant-1',
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
};

describe(getHostTenantSanityWriteContext, () => {
  beforeEach(() => {
    isProductionEnvironmentMock.mockReset();
    isProductionEnvironmentMock.mockReturnValue(false);
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReset();
    vi.mocked(resolveRequestTenant).mockResolvedValue(ACTIVE_ROW as never);
  });

  it('resolves the tenant Sanity write credentials for a resolved tenant', async () => {
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: {
        projectId: 'proj',
        dataset: 'production',
        token: 'tok',
        status: TENANT_STATUS.ACTIVE,
        deprovisionedAt: null,
        provisioningStatus: null,
      },
      tenantId: 'tenant-1',
      isActive: true,
    });
    expect(queries.tenants.toTenantSanityWriteCredentials).toHaveBeenCalledWith(
      ACTIVE_ROW,
    );
  });

  it('reports a suspended resolved tenant as not active', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({
      ...ACTIVE_ROW,
      status: TENANT_STATUS.SUSPENDED,
    } as never);

    await expect(getHostTenantSanityWriteContext()).resolves.toMatchObject({
      isResolvable: true,
      tenantId: 'tenant-1',
      isActive: false,
    });
  });

  it('resolves as unresolvable in production when no tenant resolves', async () => {
    isProductionEnvironmentMock.mockReturnValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(
      queries.tenants.toTenantSanityWriteCredentials,
    ).not.toHaveBeenCalled();
  });

  it('resolves with an undefined tenant and tenantId outside production when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
      isActive: true,
    });
  });

  it('resolves with a defined tenantId but an undefined tenant when the resolved tenant has no usable write credentials', async () => {
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue(
      undefined,
    );

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: 'tenant-1',
      isActive: true,
    });
  });
});

describe('getHostTenantSanityWriteContext memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the host lookup and credentials query when called more than once in the same render pass', async () => {
    vi.mocked(resolveRequestTenant).mockReset();
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReset();
    vi.mocked(resolveRequestTenant).mockResolvedValue(ACTIVE_ROW as never);
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    vi.doMock('react', async (importOriginal) => {
      const actual = await importOriginal<typeof import('react')>();
      return {
        ...actual,
        cache: (fn: () => unknown) => {
          let called = false;
          let result: unknown;
          return () => {
            if (!called) {
              result = fn();
              called = true;
            }
            return result;
          };
        },
      };
    });
    vi.resetModules();

    const {
      getHostTenantSanityWriteContext: freshGetHostTenantSanityWriteContext,
    } = await import('./tenant-sanity-context');

    await freshGetHostTenantSanityWriteContext();
    await freshGetHostTenantSanityWriteContext();

    expect(resolveRequestTenant).toHaveBeenCalledTimes(1);
    expect(
      queries.tenants.toTenantSanityWriteCredentials,
    ).toHaveBeenCalledTimes(1);
  });
});
