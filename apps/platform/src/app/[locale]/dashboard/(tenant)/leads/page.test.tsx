import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN, ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeLead } from '@platform/testing/leads/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
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
  tenantId: TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};

const useTenant = ({
  plan = TENANT_PLAN.GROWTH,
  role = MEMBERSHIP_ROLE.OWNER,
}: {
  plan?: string;
  role?: string;
}) =>
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    { membership: { ...membership, role }, tenant: { id: TENANT_ID, plan } },
  ]);

const setup = customRenderAsync(DashboardLeadsPage, {
  searchParams: Promise.resolve({}),
});

const ADA_LOVELACE = 'Ada Lovelace';

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
      { membership, tenant: { id: TENANT_ID, plan: TENANT_PLAN.GROWTH } },
    ]);
    listLeadsMock.mockResolvedValue({
      leads: [makeLead({ name: ADA_LOVELACE })],
      total: 1,
    });
  });

  it('redirects to sign-in without a session, reading no leads', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it('sends a user with no membership to the pending workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it("shows a member their own tenant's leads, never one named by the request", async () => {
    await setup({ searchParams: Promise.resolve({ page: '1' }) });

    expect(listLeadsMock).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      page: 1,
      pageSize: 25,
    });
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeVisible();
    expect(screen.getByText(ADA_LOVELACE)).toBeVisible();
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
    useTenant({ plan: TENANT_PLAN.FREE });
    listLeadsMock.mockResolvedValue({ leads: [], total: 0 });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(notFound).toHaveBeenCalled();
  });

  it('keeps the page for a downgraded owner with stored leads, with the plan notice', async () => {
    useTenant({ plan: TENANT_PLAN.FREE });

    await setup();

    expect(
      screen.getByText('Contact form not included in your plan'),
    ).toBeVisible();
    expect(screen.getByText(ADA_LOVELACE)).toBeVisible();
  });

  it('is not found for an editor', async () => {
    useTenant({ role: MEMBERSHIP_ROLE.EDITOR });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listLeadsMock).not.toHaveBeenCalled();
  });

  it('opens for an operator on a tenant they have no membership in', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      userId: 'user-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
    listTenantsMock.mockResolvedValue([
      { id: 'tenant-9', plan: TENANT_PLAN.GROWTH },
    ]);

    await setup();

    expect(listLeadsMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-9' }),
    );
  });
});
