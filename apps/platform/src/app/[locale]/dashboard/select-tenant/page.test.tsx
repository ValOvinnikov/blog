import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import SelectTenantPage from './page';

const { listMembershipsWithTenantsForUserMock, getAdminByUserIdMock } =
  vi.hoisted(() => ({
    listMembershipsWithTenantsForUserMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(SelectTenantPage, {});

describe(`<${SelectTenantPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('redirects to /workspace-pending with zero memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('redirects straight to /dashboard for exactly one membership — nothing to pick', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1' },
        tenant: { id: 'tenant-1' },
      },
    ]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders the picker for multiple memberships', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1' },
        tenant: { id: 'tenant-1', name: 'Acme Inc.' },
      },
      {
        membership: { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2' },
        tenant: { id: 'tenant-2', name: 'Globex Corp.' },
      },
    ]);

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Choose a workspace' }),
    ).toBeVisible();
  });
});
