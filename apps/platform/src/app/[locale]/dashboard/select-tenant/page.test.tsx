import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import SelectTenantPage from './page';

const {
  authMock,
  listMembershipsForUserMock,
  listTenantsByIdsMock,
  getAdminByUserIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
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

const setup = customRenderAsync(SelectTenantPage, {});

describe(`<${SelectTenantPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('redirects to /workspace-pending with zero memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('redirects straight to /dashboard for exactly one membership — nothing to pick', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([{ id: 'tenant-1' }]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders the picker for multiple memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
      { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Inc.' },
      { id: 'tenant-2', name: 'Globex Corp.' },
    ]);

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Choose a workspace' }),
    ).toBeVisible();
  });
});
