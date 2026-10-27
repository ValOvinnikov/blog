import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';

import DashboardLayout from './layout';

faker.seed(5996);

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

const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRenderAsync(DashboardLayout, {
  children: <p>{MOCK_CONTENT}</p>,
});

describe(`<${DashboardLayout.name}/>`, () => {
  it('sends a user with no workspace to onboarding', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValueOnce([]);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.onboarding());
  });

  it('renders the gated content for a member of any workspace', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValueOnce([
      { membership: mockMembership(), tenant: mockTenant() },
    ]);

    await setup();

    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });
});
