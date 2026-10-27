import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  MOCK_OTHER_TENANT_ID,
  MOCK_OTHER_TENANT_NAME,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import SelectTenantPage from './page';

const { listMembershipsWithTenantsForUserMock } = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: vi.fn() },
  },
}));

const setup = customRenderAsync(SelectTenantPage, {});

describe(`<${SelectTenantPage.name}/>`, () => {
  it('goes straight to the dashboard when there is only one workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValueOnce([
      { membership: mockMembership(), tenant: mockTenant() },
    ]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.dashboard());
  });

  it('offers a choice between several workspaces', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValueOnce([
      { membership: mockMembership(), tenant: mockTenant() },
      {
        membership: mockMembership({ tenantId: MOCK_OTHER_TENANT_ID }),
        tenant: mockTenant({
          id: MOCK_OTHER_TENANT_ID,
          name: MOCK_OTHER_TENANT_NAME,
        }),
      },
    ]);

    await setup();

    const heading = screen.getByRole('heading', {
      name: messages.dashboardTenantPicker.heading,
    });

    expect(heading).toBeVisible();
  });
});
