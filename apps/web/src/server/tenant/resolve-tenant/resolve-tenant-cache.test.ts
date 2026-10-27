import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { mockServableTenant } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';

import { resolveTenant } from './resolve-tenant';

faker.seed(6109);

vi.mock('@web/utils/is-production-environment');
vi.mock(
  'next/cache',
  () => import('@web/testing/server/next-cache/memoizing-next-cache'),
);
vi.mock('@blog/db', async () => ({
  ...(await import('@blog/db/constants')),
  queries: {
    tenantDomains: { getTenantByDomain: vi.fn() },
    tenants: { listTenants: vi.fn() },
  },
}));

const MOCK_TENANT = mockServableTenant({ suspendedAt: new Date() });

const getTenantByDomainMock = vi.mocked(
  queries.tenantDomains.getTenantByDomain,
);

describe('resolveTenant caching', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(queries.tenants.listTenants).mockResolvedValue([]);
  });

  it('resolves a repeated host from the cache with its timestamps intact', async () => {
    const host = faker.internet.domainName();
    getTenantByDomainMock.mockResolvedValue(MOCK_TENANT);

    await resolveTenant(host);

    await expect(resolveTenant(host)).resolves.toEqual(MOCK_TENANT);
    expect(getTenantByDomainMock).toHaveBeenCalledTimes(1);
  });

  it('looks a host up again after it resolved no tenant', async () => {
    const host = faker.internet.domainName();
    getTenantByDomainMock
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(MOCK_TENANT);

    await expect(resolveTenant(host)).resolves.toBeUndefined();

    await expect(resolveTenant(host)).resolves.toEqual(MOCK_TENANT);
    expect(getTenantByDomainMock).toHaveBeenCalledTimes(2);
  });

  it('rethrows a failed lookup without caching it', async () => {
    const host = faker.internet.domainName();
    getTenantByDomainMock
      .mockRejectedValueOnce(MOCK_ERROR)
      .mockResolvedValueOnce(MOCK_TENANT);

    await expect(resolveTenant(host)).rejects.toBe(MOCK_ERROR);

    await expect(resolveTenant(host)).resolves.toEqual(MOCK_TENANT);
  });
});
