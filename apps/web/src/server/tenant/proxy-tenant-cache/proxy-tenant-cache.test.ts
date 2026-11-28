import { faker } from '@faker-js/faker';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { getCache, type RuntimeCache } from '@vercel/functions';
import { PROXY_LOG } from '@web/constants/proxy';
import type { TResolvedHost } from '@web/server/tenant/resolve-tenant/resolve-tenant';
import { mockServableTenant } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { logger } from '@web/utils/logger/logger';

import {
  expireProxyTenantCache,
  readThroughProxyTenantCache,
} from './proxy-tenant-cache';

faker.seed(5271);

vi.mock('@vercel/functions', async (importOriginal) => {
  const actual = await importOriginal<{ getCache: typeof getCache }>();
  return { ...actual, getCache: vi.fn(actual.getCache) };
});

const MANY_TENANT_COUNT = 250;

const stubCache = (overrides: Partial<RuntimeCache> = {}): RuntimeCache => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  expireTag: vi.fn(),
  ...overrides,
});

const failingCache = (): RuntimeCache =>
  stubCache({
    get: vi.fn().mockRejectedValue(MOCK_ERROR),
    set: vi.fn().mockRejectedValue(MOCK_ERROR),
  });

const resolvedHost = (tenant: TTenant): TResolvedHost => ({
  tenant,
  isOwnHost: true,
});

describe(readThroughProxyTenantCache, () => {
  let host: string;
  let tenant: TTenant;
  const resolve = vi.fn<Parameters<typeof readThroughProxyTenantCache>[1]>();

  beforeEach(() => {
    vi.stubEnv('RUNTIME_CACHE_DISABLE_BUILD_CACHE', 'true');
    resolve.mockReset();
    host = faker.internet.domainName();
    tenant = mockServableTenant({
      id: faker.string.uuid(),
      suspendedAt: faker.date.past(),
    });
    resolve.mockResolvedValue(resolvedHost(tenant));
  });

  it('looks a host up again after it resolved no tenant', async () => {
    resolve.mockResolvedValueOnce(undefined);

    await expect(
      readThroughProxyTenantCache(host, resolve),
    ).resolves.toBeUndefined();

    await expect(readThroughProxyTenantCache(host, resolve)).resolves.toEqual(
      resolvedHost(tenant),
    );
  });

  it('looks a request without a host up every time', async () => {
    await readThroughProxyTenantCache(null, resolve);
    await readThroughProxyTenantCache(null, resolve);

    expect(resolve).toHaveBeenCalledTimes(2);
  });

  describe('once a host is cached', () => {
    beforeEach(async () => {
      await readThroughProxyTenantCache(host, resolve);
    });

    it('resolves it from the cache with its timestamps intact', async () => {
      await expect(readThroughProxyTenantCache(host, resolve)).resolves.toEqual(
        resolvedHost(tenant),
      );
      expect(resolve).toHaveBeenCalledTimes(1);
    });

    it('resolves the next request afresh once its tenant is expired', async () => {
      const savedTenant = { ...tenant, suspendedAt: null };
      resolve.mockResolvedValueOnce(resolvedHost(savedTenant));

      await expireProxyTenantCache([tenant.id]);

      await expect(readThroughProxyTenantCache(host, resolve)).resolves.toEqual(
        resolvedHost(savedTenant),
      );
    });

    it("keeps another tenant's host cached when one tenant is expired", async () => {
      await expireProxyTenantCache([faker.string.uuid()]);
      await readThroughProxyTenantCache(host, resolve);

      expect(resolve).toHaveBeenCalledTimes(1);
    });
  });

  it('resolves the host itself and logs when the cache cannot be read or written', async () => {
    vi.mocked(getCache)
      .mockReturnValueOnce(failingCache())
      .mockReturnValueOnce(failingCache());

    await expect(readThroughProxyTenantCache(host, resolve)).resolves.toEqual(
      resolvedHost(tenant),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      PROXY_LOG.TENANT_CACHE_READ_FAILED,
      { host, error: MOCK_ERROR },
    );
    expect(logger.warn).toHaveBeenCalledWith(
      PROXY_LOG.TENANT_CACHE_WRITE_FAILED,
      { host, error: MOCK_ERROR },
    );
  });

  it('treats an entry filled for another host as a miss', async () => {
    const otherHost = faker.internet.domainName();
    const otherTenant = mockServableTenant({ id: faker.string.uuid() });
    vi.mocked(getCache).mockReturnValueOnce(
      stubCache({
        get: vi
          .fn()
          .mockResolvedValue({ host: otherHost, ...resolvedHost(otherTenant) }),
      }),
    );

    await expect(readThroughProxyTenantCache(host, resolve)).resolves.toEqual(
      resolvedHost(tenant),
    );
    expect(resolve).toHaveBeenCalledWith(host);
  });
});

describe(expireProxyTenantCache, () => {
  it("expires every tenant's tag across several requests", async () => {
    const expireTag = vi.fn<RuntimeCache['expireTag']>();
    vi.mocked(getCache).mockReturnValue(stubCache({ expireTag }));
    const tenantIds = Array.from({ length: MANY_TENANT_COUNT }, () =>
      faker.string.uuid(),
    );

    await expireProxyTenantCache(tenantIds);

    const expiredTags = expireTag.mock.calls.flatMap(([tags]) => tags);
    expect(expireTag.mock.calls.length).toBeGreaterThan(1);
    expect(expiredTags).toHaveLength(MANY_TENANT_COUNT);
    tenantIds.forEach((tenantId, index) => {
      expect(expiredTags[index]).toContain(tenantId);
    });
  });
});
