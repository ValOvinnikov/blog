import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import {
  TENANT_ID_HEADER,
  UNRESOLVED_TENANT_PLACEHOLDER,
} from '@web/server/tenant/constants/constants';
import {
  mockServableTenant,
  mockTenantSanityCredentials,
  mockTenantSanityWriteCredentials,
} from '@web/testing/server/tenant/fixtures';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
} from '@web/testing/shared/tenant/fixtures';

import { getRequestTenantId, resolveRequestTenant } from './request-tenant';

faker.seed(2288);

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }));

vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('@web/utils/is-production-environment');
vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/passthrough-next-cache'),
);
vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    tenantDomains: { getTenantByDomain: vi.fn() },
    tenants: {
      getTenantById: vi.fn(),
      listTenants: vi.fn(),
      toTenantSanityCredentials: vi.fn(),
      toTenantSanityWriteCredentials: vi.fn(),
    },
  },
}));

const MOCK_TENANT = mockServableTenant();
const MOCK_NON_TENANT_SHAPED_SEGMENT = '.well-known';

describe(resolveRequestTenant, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headersMock.mockResolvedValue(new Headers({ host: MOCK_TENANT_HOST }));
  });

  it('resolves by Host even when x-tenant-id names a different tenant', async () => {
    headersMock.mockResolvedValueOnce(
      new Headers({
        host: MOCK_TENANT_HOST,
        [TENANT_ID_HEADER]: MOCK_OTHER_TENANT_ID,
      }),
    );
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValueOnce(
      MOCK_TENANT,
    );

    await expect(resolveRequestTenant()).resolves.toEqual(MOCK_TENANT);
    expect(queries.tenantDomains.getTenantByDomain).toHaveBeenCalledWith(
      MOCK_TENANT_HOST,
    );
    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
  });

  it('resolves undefined when Host-based resolution finds no tenant', async () => {
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValueOnce(
      undefined,
    );
    vi.mocked(queries.tenants.listTenants).mockResolvedValueOnce([]);

    await expect(resolveRequestTenant()).resolves.toBeUndefined();
  });

  it('resolves a supplied tenant id by id, without reading headers', async () => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValueOnce(MOCK_TENANT);

    await expect(resolveRequestTenant(MOCK_TENANT_ID)).resolves.toEqual(
      MOCK_TENANT,
    );

    expect(headersMock).not.toHaveBeenCalled();
    expect(queries.tenantDomains.getTenantByDomain).not.toHaveBeenCalled();
    expect(queries.tenants.getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID);
  });

  it('resolves undefined for the placeholder without any lookup', async () => {
    await expect(
      resolveRequestTenant(UNRESOLVED_TENANT_PLACEHOLDER),
    ).resolves.toBeUndefined();

    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
    expect(queries.tenantDomains.getTenantByDomain).not.toHaveBeenCalled();
    expect(headersMock).not.toHaveBeenCalled();
  });
});

describe(getRequestTenantId, () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headersMock.mockResolvedValue(new Headers());
  });

  it('returns the tenant id from the x-tenant-id header', async () => {
    headersMock.mockResolvedValueOnce(
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
    headersMock.mockResolvedValueOnce(requestHeaders);

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
    ['a segment that is not tenant-shaped', MOCK_NON_TENANT_SHAPED_SEGMENT],
    ['a tenant id with trailing garbage', `${MOCK_TENANT_ID}-trailing-garbage`],
  ])(
    'returns undefined for %s as the tenant param, without reading headers',
    async (_, tenant) => {
      await expect(getRequestTenantId(tenant)).resolves.toBeUndefined();

      expect(headersMock).not.toHaveBeenCalled();
    },
  );
});

describe('request-scoped memoization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headersMock.mockResolvedValue(
      new Headers({
        host: MOCK_TENANT_HOST,
        [TENANT_ID_HEADER]: MOCK_TENANT_ID,
      }),
    );
    vi.mocked(queries.tenantDomains.getTenantByDomain).mockResolvedValue(
      MOCK_TENANT,
    );
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
      mockTenantSanityCredentials(),
    );
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue(
      mockTenantSanityWriteCredentials(),
    );
    vi.doMock('react', withMemoizingReactCache);
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the tenant lookup when called more than once in one render pass', async () => {
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('./request-tenant');

    await freshResolveRequestTenant();
    await freshResolveRequestTenant();

    expect(queries.tenantDomains.getTenantByDomain).toHaveBeenCalledTimes(1);
  });

  it('dedupes the header read when the tenant id is requested more than once', async () => {
    const { getRequestTenantId: freshGetRequestTenantId } =
      await import('./request-tenant');

    await freshGetRequestTenantId();
    await freshGetRequestTenantId();

    expect(headersMock).toHaveBeenCalledTimes(1);
  });

  it('resolves once for the base URL and the read context in one render pass', async () => {
    const { getTenantBaseUrl } =
      await import('@web/server/tenant/tenant-base-url/tenant-base-url');
    const { getHostTenantSanityContext } =
      await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

    await getTenantBaseUrl();
    await getHostTenantSanityContext();

    expect(queries.tenantDomains.getTenantByDomain).toHaveBeenCalledTimes(1);
  });

  it('resolves once for the read and write contexts in one render pass', async () => {
    const { getHostTenantSanityContext, getHostTenantSanityWriteContext } =
      await import('@web/server/tenant/tenant-sanity-context/tenant-sanity-context');

    await getHostTenantSanityContext();
    await getHostTenantSanityWriteContext();

    expect(queries.tenantDomains.getTenantByDomain).toHaveBeenCalledTimes(1);
  });
});
