import { LOCALE_ISO_CODES } from '@blog/config';
import { queries } from '@blog/db';
import { TENANT_STATUS } from '@blog/db/constants';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import {
  resolveTenant,
  resolveTenantById,
} from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';

import { getRequestTenantId, resolveRequestTenant } from './request-tenant';

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('@web/server/tenant/resolve-tenant/resolve-tenant', () => ({
  resolveTenant: vi.fn(),
  resolveTenantById: vi.fn(),
}));
vi.mock('@blog/db', async () => ({
  queries: {
    tenants: {
      getTenantById: vi.fn(),
      toTenantSanityCredentials: vi.fn(),
      toTenantSanityWriteCredentials: vi.fn(),
    },
  },
  TENANT_STATUS: (await import('@blog/db/constants')).TENANT_STATUS,
}));

const OTHER_HOST = 'attacker.example.com';
const SANITY_PROJECT_ID = 'proj';
const SANITY_DATASET = 'production';

const TENANT = mockTenant();

const SANITY_ACCESS = {
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  status: TENANT_STATUS.ACTIVE,
  deprovisionedAt: null,
  provisioningStatus: null,
};

describe(resolveRequestTenant, () => {
  beforeEach(() => {
    headersMock.mockReset();
    vi.mocked(resolveTenant).mockReset();
    vi.mocked(resolveTenantById).mockReset();
    vi.mocked(queries.tenants.getTenantById).mockReset();
  });

  it('resolves by Host even when x-tenant-id names a different tenant', async () => {
    headersMock.mockResolvedValue(
      new Headers({
        host: MOCK_TENANT_HOST,
        [TENANT_ID_HEADER]: MOCK_OTHER_TENANT_ID,
      }),
    );
    vi.mocked(resolveTenant).mockResolvedValue(TENANT);
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockTenant({
        id: MOCK_OTHER_TENANT_ID,
        primaryDomain: OTHER_HOST,
      }),
    );

    await expect(resolveRequestTenant()).resolves.toEqual(TENANT);
    expect(resolveTenant).toHaveBeenCalledTimes(1);
    expect(resolveTenant).toHaveBeenCalledWith(MOCK_TENANT_HOST);
  });

  it('resolves undefined when Host-based resolution finds no tenant', async () => {
    headersMock.mockResolvedValue(new Headers());
    vi.mocked(resolveTenant).mockResolvedValue(undefined);

    await expect(resolveRequestTenant()).resolves.toBeUndefined();
  });

  it('resolves a supplied tenant id by id, without reading headers', async () => {
    vi.mocked(resolveTenantById).mockResolvedValue(TENANT);

    await expect(resolveRequestTenant(MOCK_TENANT_ID)).resolves.toEqual(TENANT);

    expect(headersMock).not.toHaveBeenCalled();
    expect(resolveTenant).not.toHaveBeenCalled();
    expect(resolveTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('resolves undefined for the placeholder without any lookup', async () => {
    await expect(
      resolveRequestTenant(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBeUndefined();

    expect(resolveTenantById).not.toHaveBeenCalled();
    expect(resolveTenant).not.toHaveBeenCalled();
    expect(headersMock).not.toHaveBeenCalled();
  });

  describe('memoization', () => {
    beforeEach(() => {
      vi.mocked(queries.tenants.toTenantSanityCredentials).mockReset();
      vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReset();
      headersMock.mockResolvedValue(new Headers({ host: MOCK_TENANT_HOST }));
      vi.mocked(resolveTenant).mockResolvedValue(TENANT);
      vi.doMock('react', withMemoizingReactCache);
      vi.doMock('@web/utils/is-production-environment', () => ({
        isProductionEnvironment: () => false,
      }));
      vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue({
        ...SANITY_ACCESS,
        token: 'tok',
        defaultLocale: LOCALE_ISO_CODES.EN,
      });
      vi.resetModules();
    });

    afterEach(() => {
      vi.doUnmock('react');
      vi.resetModules();
    });

    it('dedupes the lookup when called more than once in one render pass', async () => {
      const { resolveRequestTenant: freshResolveRequestTenant } =
        await import('./request-tenant');

      await freshResolveRequestTenant();
      await freshResolveRequestTenant();

      expect(resolveTenant).toHaveBeenCalledTimes(1);
    });

    it('resolves once for the base URL and the read context in one render pass', async () => {
      const { getTenantBaseUrl } =
        await import('@web/server/tenant/tenant-base-url/tenant-base-url');
      const { getHostTenantSanityContext } =
        await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

      await getTenantBaseUrl();
      await getHostTenantSanityContext();

      expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
      expect(resolveTenant).toHaveBeenCalledTimes(1);
    });

    it('resolves once for the read and write contexts in one render pass', async () => {
      vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue(
        { ...SANITY_ACCESS, token: 'write-tok' },
      );
      const { getHostTenantSanityContext, getHostTenantSanityWriteContext } =
        await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

      await getHostTenantSanityContext();
      await getHostTenantSanityWriteContext();

      expect(resolveTenant).toHaveBeenCalledTimes(1);
      expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
    });
  });
});

describe(getRequestTenantId, () => {
  beforeEach(() => {
    headersMock.mockReset();
    headersMock.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('returns the tenant id from the x-tenant-id header', async () => {
    headersMock.mockResolvedValue(
      new Headers({ [TENANT_ID_HEADER]: MOCK_TENANT_ID }),
    );

    await expect(getRequestTenantId()).resolves.toBe(MOCK_TENANT_ID);
  });

  it.each([
    ['the header is absent', new Headers()],
    [
      'the header carries the placeholder',
      new Headers({ [TENANT_ID_HEADER]: UNRESOLVED_TENANT_PLACEHOLDER }),
    ],
  ])('returns undefined when %s', async (_, requestHeaders) => {
    headersMock.mockResolvedValue(requestHeaders);

    await expect(getRequestTenantId()).resolves.toBeUndefined();
  });

  it('prefers a supplied tenant over the header, without reading headers', async () => {
    await expect(getRequestTenantId(MOCK_TENANT_ID)).resolves.toBe(
      MOCK_TENANT_ID,
    );

    expect(headersMock).not.toHaveBeenCalled();
  });

  it.each([
    ['the placeholder', UNRESOLVED_TENANT_PLACEHOLDER],
    ['a segment that is not tenant-shaped', '.well-known'],
    ['a tenant id with trailing garbage', `${MOCK_TENANT_ID}-trailing-garbage`],
  ])(
    'returns undefined for %s as the tenant param, without reading headers',
    async (_, tenant) => {
      await expect(getRequestTenantId(tenant)).resolves.toBeUndefined();

      expect(headersMock).not.toHaveBeenCalled();
    },
  );

  it('dedupes the header read when called more than once in one render pass', async () => {
    vi.doMock('react', withMemoizingReactCache);
    vi.resetModules();
    headersMock.mockResolvedValue(
      new Headers({ [TENANT_ID_HEADER]: MOCK_TENANT_ID }),
    );
    const { getRequestTenantId: freshGetRequestTenantId } =
      await import('./request-tenant');

    await freshGetRequestTenantId();
    await freshGetRequestTenantId();

    expect(headersMock).toHaveBeenCalledTimes(1);
  });
});
