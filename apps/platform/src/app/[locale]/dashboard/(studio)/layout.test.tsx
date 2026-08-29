import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import DashboardStudioLayout from './layout';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
  cookiesMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

vi.mock('next/headers', () => ({ cookies: cookiesMock }));

const tenant1 = { id: 'tenant-1', slug: 'acme', name: 'Acme Inc.' };
const tenant2 = { id: 'tenant-2', slug: 'globex', name: 'Globex Corp.' };
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

const setup = customRenderAsync(DashboardStudioLayout, {
  children: <div>studio content</div>,
});

describe(`<${DashboardStudioLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    cookiesMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('redirects to the picker for a user with multiple memberships and no active-tenant cookie, rather than guessing a Studio to render', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1, membership2]);
    listTenantsByIdsMock.mockResolvedValue([tenant1, tenant2]);
    mockCookie(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard/select-tenant');
  });

  it('renders its children bare, with no AdminShell chrome, for a user with exactly one membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([membership1]);
    listTenantsByIdsMock.mockResolvedValue([tenant1]);

    await setup();

    expect(screen.getByText('studio content')).toBeVisible();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
