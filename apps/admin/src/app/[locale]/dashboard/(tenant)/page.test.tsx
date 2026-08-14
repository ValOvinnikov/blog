import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { redirect } from 'next/navigation';

import DashboardOverviewPage from './page';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  cookiesMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const setup = customRenderAsync(DashboardOverviewPage, {});

describe(`<${DashboardOverviewPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    cookiesMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('renders the resolved tenant for a member with exactly one membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', slug: 'acme', name: 'Acme Inc.' },
    ]);

    await setup();

    expect(screen.getByRole('heading', { name: 'Acme Inc.' })).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
