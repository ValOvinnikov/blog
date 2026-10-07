import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLayout from './layout';

const { listMembershipsForUserMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  listMembershipsForUserMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { listMembershipsForUser: listMembershipsForUserMock },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
    admins: { getAdminByUserId: vi.fn().mockResolvedValue(undefined) },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(DashboardLayout, {
  children: <div>dashboard content</div>,
});

describe(`<${DashboardLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsForUserMock.mockReset();
    listTenantsByIdsMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to sign-in without querying memberships when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listMembershipsForUserMock).not.toHaveBeenCalled();
  });

  it('redirects to /workspace-pending when the signed-in user has zero memberships', async () => {
    listMembershipsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
  });

  it('renders the gated content for any membership without resolving a single tenant', async () => {
    listMembershipsForUserMock.mockResolvedValue([
      { id: 'm-1', userId: 'user-1', tenantId: 'tenant-1', role: 'OWNER' },
      { id: 'm-2', userId: 'user-1', tenantId: 'tenant-2', role: 'OWNER' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1' },
      { id: 'tenant-2' },
    ]);

    await setup();

    expect(screen.getByText('dashboard content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
