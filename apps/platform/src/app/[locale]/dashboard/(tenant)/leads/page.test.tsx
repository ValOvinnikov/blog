import { NEXT_NAVIGATION_ERROR, type TValueOf } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
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

vi.mock('@platform/server/leads/delete-lead-action');

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

const MOCK_LEAD = mockLead();
const MOCK_LEAD_ROW_NAME = new RegExp(MOCK_LEAD.name);

const useTenant = ({
  plan = TENANT_PLAN.GROWTH,
  role = MEMBERSHIP_ROLE.OWNER,
}: {
  plan?: TValueOf<typeof TENANT_PLAN>;
  role?: TValueOf<typeof MEMBERSHIP_ROLE>;
}) =>
  listMembershipsWithTenantsForUserMock.mockResolvedValue([
    {
      membership: mockMembership({ role }),
      tenant: mockReadyTenant({ plan }),
    },
  ]);

const setup = customRenderAsync(DashboardLeadsPage, {});

describe(`<${DashboardLeadsPage.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(auth).mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    useTenant({});
    listLeadsByCursorMock.mockResolvedValue({
      leads: [MOCK_LEAD],
      nextCursor: undefined,
    });
    countLeadsForTenantMock.mockResolvedValue(1);
  });

  it('redirects to sign-in without a session, reading no leads', async () => {
    vi.mocked<() => Promise<Session | null>>(auth).mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it('sends a user with no membership to the pending workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.workspacePending());
    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it("shows a member their own tenant's leads", async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: 'Leads' });
    const leadRow = screen.getByRole('button', { name: MOCK_LEAD_ROW_NAME });

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
    expect(heading).toBeVisible();
    expect(leadRow).toBeVisible();
  });

  it('is not found on a plan without the contact form and no stored leads', async () => {
    useTenant({ plan: TENANT_PLAN.FREE });
    countLeadsForTenantMock.mockResolvedValue(0);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(notFound).toHaveBeenCalled();
  });

  it('keeps the page for a downgraded owner with stored leads, with the notice', async () => {
    useTenant({ plan: TENANT_PLAN.FREE });

    await setup();

    const planNotice = screen.getByText(
      'Contact form not included in your plan',
    );
    const leadRow = screen.getByRole('button', { name: MOCK_LEAD_ROW_NAME });

    expect(planNotice).toBeVisible();
    expect(leadRow).toBeVisible();
  });

  it('is not found for an editor', async () => {
    useTenant({ role: MEMBERSHIP_ROLE.EDITOR });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(listLeadsByCursorMock).not.toHaveBeenCalled();
  });

  it('opens for an operator on a tenant they have no membership in', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
    listTenantsMock.mockResolvedValue([
      mockReadyTenant({ id: MOCK_OTHER_TENANT_ID, plan: TENANT_PLAN.GROWTH }),
    ]);

    await setup();

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_OTHER_TENANT_ID,
    });
  });
});
