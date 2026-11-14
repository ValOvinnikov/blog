import { TENANT_PLAN } from '@blog/config/constants';
import { queries } from '@blog/db';
import { PLAN_ENTITLEMENTS } from '@blog/db/constants';
import { countMembershipsOverSeats } from '@blog/db/queries/memberships';
import {
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_ROOT_DOMAIN,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { env } from '@platform/utils/env/env';

import { loadGraceLocks } from './load-grace-locks';

vi.mock('@platform/utils/env/env');

vi.mock('@blog/db', () => ({
  queries: { tenantDomains: { listTenantHosts: vi.fn() } },
}));

vi.mock('@blog/db/queries/memberships', () => ({
  countMembershipsOverSeats: vi.fn(),
}));

const listTenantHostsMock = vi.mocked(queries.tenantDomains.listTenantHosts);
const countMembershipsOverSeatsMock = vi.mocked(countMembershipsOverSeats);
const envMock: Partial<Record<keyof typeof env, string>> = env;
const MOCK_LOCKED_MEMBER_COUNT = 2;

const FREE_ON_CUSTOM_DOMAIN = mockTenant({
  plan: TENANT_PLAN.FREE,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
});

describe(loadGraceLocks, () => {
  beforeEach(() => {
    envMock.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    listTenantHostsMock
      .mockReset()
      .mockResolvedValue([MOCK_CUSTOM_DOMAIN, MOCK_TENANT_DOMAIN]);
    countMembershipsOverSeatsMock
      .mockReset()
      .mockResolvedValue(MOCK_LOCKED_MEMBER_COUNT);
  });

  it('applies the shared grace rule to the loaded plan entitlements', async () => {
    const locks = await loadGraceLocks(FREE_ON_CUSTOM_DOMAIN);

    expect(locks).toEqual({
      lockedMemberCount: MOCK_LOCKED_MEMBER_COUNT,
      customDomain: MOCK_CUSTOM_DOMAIN,
      subdomain: MOCK_TENANT_DOMAIN,
    });
    expect(countMembershipsOverSeatsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].seats,
    );
  });

  it('reads nothing without a tenant root domain', async () => {
    delete envMock.TENANT_ROOT_DOMAIN;

    const locks = await loadGraceLocks(FREE_ON_CUSTOM_DOMAIN);

    expect(locks).toBeUndefined();
    expect(listTenantHostsMock).not.toHaveBeenCalled();
  });
});
