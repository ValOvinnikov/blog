import { notFound, redirect } from 'next/navigation';

import { resolveDashboardTenant } from './resolve-dashboard-tenant';

const { listSessionTenantsMock, cookiesMock } = vi.hoisted(() => ({
  listSessionTenantsMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('./list-session-tenants', () => ({
  listSessionTenants: listSessionTenantsMock,
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const tenant1 = { id: 'tenant-1' };
const tenant2 = { id: 'tenant-2' };
const membership1 = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};
const membership2 = {
  id: 'm-2',
  userId: 'user-1',
  tenantId: 'tenant-2',
  role: 'OWNER',
};

const mockCookie = (value: string | undefined) => {
  cookiesMock.mockResolvedValue({
    get: vi.fn(() => (value === undefined ? undefined : { value })),
  });
};

describe(resolveDashboardTenant, () => {
  beforeEach(() => {
    listSessionTenantsMock.mockReset();
    cookiesMock.mockReset();
    vi.mocked(redirect).mockClear();
    vi.mocked(notFound).mockClear();
  });

  it('404s when the single membership points at a tenant that no longer exists', async () => {
    listSessionTenantsMock.mockResolvedValue({
      userId: 'user-1',
      memberships: [membership1],
      tenants: [],
    });

    await expect(resolveDashboardTenant()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(cookiesMock).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves directly with exactly one membership, without reading the active-tenant cookie', async () => {
    listSessionTenantsMock.mockResolvedValue({
      userId: 'user-1',
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

  it('resolves the tenant named by a valid active-tenant cookie when there are multiple memberships', async () => {
    listSessionTenantsMock.mockResolvedValue({
      userId: 'user-1',
      memberships: [membership1, membership2],
      tenants: [tenant1, tenant2],
    });
    mockCookie('tenant-2');

    const result = await resolveDashboardTenant();

    expect(result).toEqual({
      tenant: tenant2,
      membership: membership2,
      tenants: [tenant1, tenant2],
    });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects to the picker when there are multiple memberships and no active-tenant cookie', async () => {
    listSessionTenantsMock.mockResolvedValue({
      userId: 'user-1',
      memberships: [membership1, membership2],
      tenants: [tenant1, tenant2],
    });
    mockCookie(undefined);

    await expect(resolveDashboardTenant()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/select-tenant');
  });

  it('redirects to the picker when the cookie names a tenant the session no longer has a membership for', async () => {
    listSessionTenantsMock.mockResolvedValue({
      userId: 'user-1',
      memberships: [membership1, membership2],
      tenants: [tenant1, tenant2],
    });
    mockCookie('tenant-revoked');

    await expect(resolveDashboardTenant()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/select-tenant');
  });
});
