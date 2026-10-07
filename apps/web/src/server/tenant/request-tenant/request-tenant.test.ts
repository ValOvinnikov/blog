import { LOCALE_ISO_CODES } from '@blog/config';
import { queries, TENANT_STATUS } from '@blog/db';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import {
  resolveTenant,
  resolveTenantById,
} from '@web/server/tenant/resolve-tenant/resolve-tenant';

import { getRequestTenantId, resolveRequestTenant } from './request-tenant';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenant: vi.fn(),
  resolveTenantById: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: vi.fn(),
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

describe(resolveRequestTenant, () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenant).mockReset();
    vi.mocked(resolveTenantById).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockReset();
  });

  it('resolves from the Host header, ignoring any x-tenant-id header on the request', async () => {
    headersMock.mockResolvedValue(
      new Headers({ host: 'acme.example.com', 'x-tenant-id': 'tenant-1' }),
    );
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);

    await expect(resolveRequestTenant()).resolves.toEqual({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    });
    expect(resolveTenant).toHaveBeenCalledWith('acme.example.com');
  });

  it('does not let a spoofed x-tenant-id naming a different tenant than Host change which tenant is resolved', async () => {
    headersMock.mockResolvedValue(
      new Headers({
        host: 'victim.example.com',
        'x-tenant-id': 'attacker-tenant',
      }),
    );
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'victim-tenant',
      primaryDomain: 'victim.example.com',
    } as never);
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue({
      id: 'attacker-tenant',
      primaryDomain: 'attacker.example.com',
    } as never);

    await expect(resolveRequestTenant()).resolves.toEqual({
      id: 'victim-tenant',
      primaryDomain: 'victim.example.com',
    });
    expect(resolveTenant).toHaveBeenCalledWith('victim.example.com');
    expect(resolveTenant).not.toHaveBeenCalledWith(
      expect.stringContaining('attacker'),
    );
  });

  it('resolves undefined when Host-based resolution finds no tenant', async () => {
    headersMock.mockResolvedValue(new Headers());
    vi.mocked(resolveTenant).mockResolvedValue(undefined);

    await expect(resolveRequestTenant()).resolves.toBeUndefined();
  });

  it('prefers an explicitly supplied tenant id over Host, resolving by id without reading headers', async () => {
    vi.mocked(resolveTenantById).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);

    await expect(resolveRequestTenant('tenant-1')).resolves.toEqual(
      expect.objectContaining({ id: 'tenant-1' }),
    );

    expect(headersMock).not.toHaveBeenCalled();
    expect(resolveTenant).not.toHaveBeenCalled();
    expect(resolveTenantById).toHaveBeenCalledWith('tenant-1');
  });

  it('resolves undefined for the unresolved-tenant placeholder, without looking it up by id or by Host', async () => {
    await expect(
      resolveRequestTenant(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBeUndefined();

    expect(resolveTenantById).not.toHaveBeenCalled();
    expect(resolveTenant).not.toHaveBeenCalled();
    expect(headersMock).not.toHaveBeenCalled();
  });
});

describe('resolveRequestTenant memoization', () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenant).mockReset();
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReset();
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReset();
    headersMock.mockResolvedValue(new Headers({ host: 'acme.example.com' }));
    vi.mocked(resolveTenant).mockResolvedValue({
      id: 'tenant-1',
      primaryDomain: 'acme.example.com',
    } as never);
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
    vi.doMock('@web/utils/is-production-environment', () => ({
      isProductionEnvironment: () => false,
    }));
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
      defaultLocale: LOCALE_ISO_CODES.EN,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the underlying lookup when called more than once in the same render pass', async () => {
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./request-tenant');

    await freshResolveRequestTenant();
    await freshResolveRequestTenant();

    expect(resolveTenant).toHaveBeenCalledTimes(1);
  });

  it('resolves the tenant exactly once when getTenantBaseUrl and getHostTenantSanityContext both ask for it in the same render pass', async () => {
    const { getTenantBaseUrl } =
      await import('@web/server/tenant/tenant-base-url/tenant-base-url');
    const { getHostTenantSanityContext } =
      await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

    await getTenantBaseUrl();
    await getHostTenantSanityContext();

    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
    expect(resolveTenant).toHaveBeenCalledTimes(1);
  });

  it('resolves the tenant exactly once when getHostTenantSanityContext and getHostTenantSanityWriteContext both ask for it in the same render pass', async () => {
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'write-tok',
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      provisioningStatus: null,
    });

    const { getHostTenantSanityContext } =
      await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');
    const { getHostTenantSanityWriteContext } =
      await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

    await getHostTenantSanityContext();
    await getHostTenantSanityWriteContext();

    expect(resolveTenant).toHaveBeenCalledTimes(1);
    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
  });
});

const VALID_TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

describe(getRequestTenantId, () => {
  beforeEach(() => {
    headersMock.mockReset();
    headersMock.mockResolvedValue(new Headers());
  });

  it('returns the resolved tenant id from the x-tenant-id header', async () => {
    headersMock.mockResolvedValue(new Headers({ 'x-tenant-id': 'tenant-1' }));

    await expect(getRequestTenantId()).resolves.toBe('tenant-1');
  });

  it('returns undefined when the header is absent', async () => {
    await expect(getRequestTenantId()).resolves.toBeUndefined();
  });

  it('prefers an explicitly supplied tenant over the header, without reading headers at all', async () => {
    await expect(getRequestTenantId(VALID_TENANT_ID)).resolves.toBe(
      VALID_TENANT_ID,
    );

    expect(headersMock).not.toHaveBeenCalled();
  });

  it('returns undefined for the unresolved-tenant placeholder supplied as the tenant param, without forwarding it as a real id', async () => {
    await expect(
      getRequestTenantId(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBeUndefined();
  });

  it('returns undefined for the unresolved-tenant placeholder read from the header', async () => {
    headersMock.mockResolvedValue(
      new Headers({ 'x-tenant-id': UNRESOLVED_TENANT_PLACEHOLDER }),
    );

    await expect(getRequestTenantId()).resolves.toBeUndefined();
  });

  it('returns undefined for a tenant param that is not tenant-shaped, without reading headers at all', async () => {
    await expect(getRequestTenantId('.well-known')).resolves.toBeUndefined();

    expect(headersMock).not.toHaveBeenCalled();
  });

  it('returns undefined for a tenant param carrying a valid tenant id plus trailing garbage', async () => {
    await expect(
      getRequestTenantId(`${VALID_TENANT_ID}-trailing-garbage`),
    ).resolves.toBeUndefined();
  });
});

describe('getRequestTenantId memoization', () => {
  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the header read when called more than once in the same render pass', async () => {
    headersMock.mockClear();
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
    headersMock.mockResolvedValue(new Headers({ 'x-tenant-id': 'tenant-1' }));

    const { getRequestTenantId: freshGetRequestTenantId } =
      await import('./request-tenant');

    await freshGetRequestTenantId();
    await freshGetRequestTenantId();

    expect(headersMock).toHaveBeenCalledTimes(1);
  });
});
