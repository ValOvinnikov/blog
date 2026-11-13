import { TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { mockTenantDomainRows } from '@platform/testing/custom-domain/fixtures';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import { hasGraceLocks, loadGraceLocks } from './load-grace-locks';

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: {
    memberships: { countMembershipsOverSeats: vi.fn() },
    tenantDomains: { listTenantDomains: vi.fn() },
  },
}));

const countMembershipsOverSeatsMock = vi.mocked(
  queries.memberships.countMembershipsOverSeats,
);
const listTenantDomainsMock = vi.mocked(
  queries.tenantDomains.listTenantDomains,
);
const envMock: Partial<Record<keyof typeof env, string>> = env;
const MOCK_LOCKED_MEMBER_COUNT = 2;

const FREE_ON_CUSTOM_DOMAIN = {
  id: MOCK_TENANT_ID,
  plan: TENANT_PLAN.FREE,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
};

describe(loadGraceLocks, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    countMembershipsOverSeatsMock
      .mockReset()
      .mockResolvedValue(MOCK_LOCKED_MEMBER_COUNT);
    listTenantDomainsMock.mockReset().mockResolvedValue(mockTenantDomainRows());
  });

  it('counts members past the seats and the custom domain that will redirect', async () => {
    const locks = await loadGraceLocks(FREE_ON_CUSTOM_DOMAIN);

    expect(locks).toEqual({
      lockedMemberCount: MOCK_LOCKED_MEMBER_COUNT,
      domainRedirect: {
        customDomain: MOCK_CUSTOM_DOMAIN,
        subdomain: MOCK_TENANT_DOMAIN,
      },
    });
    expect(countMembershipsOverSeatsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].seats,
    );
  });

  it('names no redirect when the subdomain is already the main address', async () => {
    const locks = await loadGraceLocks({
      ...FREE_ON_CUSTOM_DOMAIN,
      primaryDomain: MOCK_TENANT_DOMAIN,
    });

    expect(locks.domainRedirect).toBeUndefined();
    expect(listTenantDomainsMock).not.toHaveBeenCalled();
  });

  it('names no redirect on a plan that includes a custom domain', async () => {
    const locks = await loadGraceLocks({
      ...FREE_ON_CUSTOM_DOMAIN,
      plan: TENANT_PLAN.GROWTH,
    });

    expect(locks.domainRedirect).toBeUndefined();
  });

  it('names no redirect when the site has no subdomain to fall back to', async () => {
    listTenantDomainsMock.mockResolvedValue([]);

    const locks = await loadGraceLocks(FREE_ON_CUSTOM_DOMAIN);

    expect(locks.domainRedirect).toBeUndefined();
  });
});

describe(hasGraceLocks, () => {
  it.each([
    [
      true,
      {
        lockedMemberCount: MOCK_LOCKED_MEMBER_COUNT,
        domainRedirect: undefined,
      },
    ],
    [
      true,
      {
        lockedMemberCount: 0,
        domainRedirect: {
          customDomain: MOCK_CUSTOM_DOMAIN,
          subdomain: MOCK_TENANT_DOMAIN,
        },
      },
    ],
    [false, { lockedMemberCount: 0, domainRedirect: undefined }],
  ])('reports %s for %o', (expected, locks) => {
    expect(hasGraceLocks(locks)).toBe(expected);
  });
});
