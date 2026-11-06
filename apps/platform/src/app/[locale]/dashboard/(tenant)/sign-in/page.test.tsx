import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockMembershipWithTenant } from '@platform/testing/memberships/membership-with-tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardSignInAppsPage from './page';

const { listMembershipsWithTenantsForUserMock, listTenantOAuthClientsMock } =
  vi.hoisted(() => ({
    listMembershipsWithTenantsForUserMock: vi.fn(),
    listTenantOAuthClientsMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    admins: { getAdminByUserId: vi.fn() },
    tenantOAuthCredentials: {
      listTenantOAuthClients: listTenantOAuthClientsMock,
    },
  },
}));

const t = makeEnTranslator('signInAppsPage');

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(DashboardSignInAppsPage, {});

describe(`<${DashboardSignInAppsPage.name}/>`, () => {
  beforeEach(() => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      mockMembershipWithTenant(mockTenant()),
    ]);
    listTenantOAuthClientsMock.mockResolvedValue([]);
  });

  it('redirects a signed-out visitor to sign-in', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(listTenantOAuthClientsMock).not.toHaveBeenCalled();
  });

  it("renders the session tenant's sign-in page", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('pageTitle'),
    });

    expect(heading).toBeVisible();
  });
});
