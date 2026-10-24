import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE, TENANT_PLAN, ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLeadsPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  listLeadsByCursorMock,
  countLeadsForTenantMock,
  listTenantsMock,
} = vi.hoisted(() => ({
  listTenantsMock: vi.fn(),
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  listLeadsByCursorMock: vi.fn(),
  countLeadsForTenantMock: vi.fn(),
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
    leads: {
      listLeadsByCursor: listLeadsByCursorMock,
      countLeadsForTenant: countLeadsForTenantMock,
    },
    tenants: { listTenants: listTenantsMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
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
    {
      membership: { ...membership, role },
      tenant: { id: MOCK_TENANT_ID, plan },
    },
  ]);

const setup = customRenderAsync(DashboardLeadsPage, {});

const ADA_LOVELACE = 'Ada Lovelace';

describe(`<${DashboardLeadsPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    listLeadsByCursorMock.mockReset();
    countLeadsForTenantMock.mockReset();
    listTenantsMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: MOCK_TENANT_ID, plan: TENANT_PLAN.GROWTH } },
    ]);
    listLeadsByCursorMock.mockResolvedValue({
      leads: [mockLead({ name: ADA_LOVELACE })],
      nextCursor: undefined,
    });
    countLeadsForTenantMock.mockResolvedValue(1);
  });

  it('redirects to sign-in without a session, reading no leads', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it('sends a user with no membership to the pending workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/workspace-pending');
    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it("shows a member their own tenant's leads, never one named by the request", async () => {
    await setup();

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
    expect(screen.getByRole('heading', { name: 'Leads' })).toBeVisible();
    expect(screen.getByText(ADA_LOVELACE)).toBeVisible();
  });

  it('is not found on a plan without the contact form and no stored leads', async () => {
    useTenant({ plan: TENANT_PLAN.FREE });
    countLeadsForTenantMock.mockResolvedValue(0);

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

    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
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

    expect(listLeadsByCursorMock).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: 'tenant-9' }),
    );
  });
});
