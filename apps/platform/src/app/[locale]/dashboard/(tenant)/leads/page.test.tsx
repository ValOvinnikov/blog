import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE, MEMBERSHIP_ROLE, TENANT_PLAN } from '@blog/db/constants';
import messages from '@platform/i18n/messages/en.json';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockLead } from '@platform/testing/leads/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';

import DashboardLeadsPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  listLeadsByCursorMock,
  listTenantsMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  listLeadsByCursorMock: vi.fn(),
  listTenantsMock: vi.fn(),
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
      countLeadsForTenant: vi.fn(async () => 1),
    },
    tenants: { listTenants: listTenantsMock },
  },
}));

const MOCK_LEAD = mockLead();
const MOCK_LEAD_ROW_NAME = new RegExp(MOCK_LEAD.name);
const MOCK_GROWTH_TENANT = mockReadyTenant({ plan: TENANT_PLAN.GROWTH });

const setup = customRenderAsync(DashboardLeadsPage, {});

describe(`<${DashboardLeadsPage.name}/>`, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listTenantsMock.mockResolvedValue([]);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership: mockMembership(), tenant: MOCK_GROWTH_TENANT },
    ]);
    listLeadsByCursorMock.mockResolvedValue({
      leads: [MOCK_LEAD],
      nextCursor: undefined,
    });
  });

  it("shows a member their own tenant's leads", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      name: messages.leadsView.title,
    });
    const leadRow = screen.getByRole('button', { name: MOCK_LEAD_ROW_NAME });

    expect(listLeadsByCursorMock).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
    expect(heading).toBeVisible();
    expect(leadRow).toBeVisible();
  });

  it('is not found for a member who cannot open Leads, reading no leads', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      {
        membership: mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
        tenant: MOCK_GROWTH_TENANT,
      },
    ]);

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
