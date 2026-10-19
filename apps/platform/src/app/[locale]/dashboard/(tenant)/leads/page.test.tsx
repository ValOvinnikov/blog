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
  listTenantsMock,
} = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
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
    tenants: { listTenants: listTenantsMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: 'tenant-1',
  role: 'OWNER',
};

const useTenant = ({
  plan = 'GROWTH',
  role = 'OWNER',
}: {
  plan?: string;
  role?: string;
}) =>
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    { membership: { ...membership, role }, tenant: { id: 'tenant-1', plan } },
  ]);

const setup = customRenderAsync(DashboardLeadsPage, {
  searchParams: Promise.resolve({}),
});

describe(`<${DashboardLeadsPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    listLeadsMock.mockReset();
    listTenantsMock.mockReset();

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

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
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

  it('is not found on a plan without the contact form and no stored leads', async () => {
    useTenant({ plan: 'FREE' });
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('keeps the page for a downgraded owner with stored leads, with the plan notice', async () => {
    useTenant({ plan: 'FREE' });

    await setup();

    expect(
      screen.getByText('Contact form not included in your plan'),
    ).toBeVisible();
    expect(screen.getByText('Ada Lovelace')).toBeVisible();
  });

  it('is not found for an editor', async () => {
    useTenant({ role: 'EDITOR' });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it('opens for an operator on a tenant they have no membership in', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      userId: 'user-1',
      role: 'SUPERADMIN',
    });
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
    listTenantsMock.mockResolvedValue([{ id: 'tenant-9', plan: 'GROWTH' }]);

    await setup();

    expect(listLeadsMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-9' }),
    );
  });
});
