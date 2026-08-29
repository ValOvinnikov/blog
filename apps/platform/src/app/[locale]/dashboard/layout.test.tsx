import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import DashboardLayout from './layout';

const { authMock, listMembershipsForUserMock, listTenantsByIdsMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    listMembershipsForUserMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: vi.fn().mockResolvedValue(undefined) },
  },
}));

const setup = customRenderAsync(DashboardLayout, {
  children: <div>dashboard content</div>,
});

describe(`<${DashboardLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('renders the gated content for a user with at least one membership, without resolving to a single tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
      { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', slug: 'acme' },
      { id: 'tenant-2', slug: 'globex' },
    ]);

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
