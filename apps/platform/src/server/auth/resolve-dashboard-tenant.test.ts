import { NEXT_NAVIGATION_ERROR, type TMaybeUndefined } from '@blog/config';
import { faker } from '@faker-js/faker';
import { listSessionTenants } from '@platform/server/auth/list-session-tenants';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import { resolveDashboardTenant } from './resolve-dashboard-tenant';

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock('@platform/server/auth/list-session-tenants', () => ({
  listSessionTenants: vi.fn(),
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();
const MOCK_REVOKED_TENANT_ID = faker.string.uuid();
const MOCK_OTHER_MEMBERSHIP_ID = faker.string.uuid();

const tenant1 = mockTenant({ id: MOCK_TENANT_ID });
const tenant2 = mockTenant({ id: MOCK_OTHER_TENANT_ID });
const membership1 = mockMembership({
  userId: MOCK_USER_ID,
  tenantId: MOCK_TENANT_ID,
});
const membership2 = mockMembership({
  id: MOCK_OTHER_MEMBERSHIP_ID,
  userId: MOCK_USER_ID,
  tenantId: MOCK_OTHER_TENANT_ID,
});

const MISSING_ACTIVE_TENANT_COOKIES = [
  { cookieCase: 'no active-tenant cookie', value: undefined },
  {
    cookieCase: 'a cookie naming a tenant without a membership',
    value: MOCK_REVOKED_TENANT_ID,
  },
];

const mockCookie = (value: TMaybeUndefined<string>) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

describe(resolveDashboardTenant, () => {
  beforeEach(() => {
    cookiesMock.mockReset();
    vi.mocked(listSessionTenants).mockResolvedValue({
      userId: MOCK_USER_ID,
      admin: undefined,
      memberships: [membership1, membership2],
      tenants: [tenant1, tenant2],
    });
  });

  it('404s when the single membership points at a tenant that no longer exists', async () => {
    vi.mocked(listSessionTenants).mockResolvedValue({
      userId: MOCK_USER_ID,
      admin: undefined,
      memberships: [membership1],
      tenants: [],
    });

    await expect(resolveDashboardTenant()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(cookiesMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves directly with exactly one membership, without reading the cookie', async () => {
    vi.mocked(listSessionTenants).mockResolvedValue({
      userId: MOCK_USER_ID,
      admin: undefined,
      memberships: [membership1],
      tenants: [tenant1],
    });

    const result = await resolveDashboardTenant();

    expect(result).toEqual({
      tenant: tenant1,
      membership: membership1,
      tenants: [tenant1],
    });
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves the tenant named by a valid cookie when there are multiple memberships', async () => {
    mockCookie(MOCK_OTHER_TENANT_ID);

    const result = await resolveDashboardTenant();

    expect(result).toEqual({
      tenant: tenant2,
      membership: membership2,
      tenants: [tenant1, tenant2],
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it.each(MISSING_ACTIVE_TENANT_COOKIES)(
    'redirects to the picker with multiple memberships and $cookieCase',
    async ({ value }) => {
      mockCookie(value);

      await expect(resolveDashboardTenant()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(
        adminRoutes.dashboardSelectTenant(),
      );
    },
  );
});
