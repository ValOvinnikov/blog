import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeLead } from '@platform/testing/leads/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLeadsPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  listLeadsMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  listLeadsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    leads: { listLeads: listLeadsMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};

const setup = customRenderAsync(DashboardLeadsPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${DashboardLeadsPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    listLeadsMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: 'tenant-1', plan: 'GROWTH' } },
    ]);
    listLeadsMock.mockResolvedValue({
      leads: [makeLead({ name: 'Ada Lovelace' })],
      total: 1,
    });
  });

  it('redirects to sign-in without a session, reading no leads', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it('sends a user with no membership to the pending workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it("shows a member their own tenant's leads, never one named by the request", async () => {
    await setup({ searchParams: Promise.resolve({ page: '1' }) });

    expect(listLeadsMock).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      page: 1,
      pageSize: 25,
    });
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeVisible();
    expect(screen.getByText('Ada Lovelace')).toBeVisible();
  });

  it('reads the requested page from the query string', async () => {
    listLeadsMock.mockResolvedValue({
      leads: [makeLead()],
      total: 40,
    });

    await setup({ searchParams: Promise.resolve({ page: '2' }) });

    expect(listLeadsMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    );
  });

  it('is not found on a plan without the contact form', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: 'tenant-1', plan: 'FREE' } },
    ]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
    expect(listLeadsMock).not.toHaveBeenCalled();
  });
});
