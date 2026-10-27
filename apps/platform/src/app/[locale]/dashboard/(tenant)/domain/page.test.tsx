import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockPendingProjectDomain } from '@platform/testing/domains/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockMembershipWithTenant } from '@platform/testing/memberships/membership-with-tenant';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  mockTenant,
  MOCK_CUSTOM_DOMAIN,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardDomainPage from './page';

const { listMembershipsWithTenantsForUserMock, getProjectDomainMock } =
  vi.hoisted(() => ({
    listMembershipsWithTenantsForUserMock: vi.fn(),
    getProjectDomainMock: vi.fn(),
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

vi.mock('@platform/server/provisioning/vercel-domains-api', () => ({
  getProjectDomain: getProjectDomainMock,
}));

const t = makeEnTranslator('tenantDomainPage');

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(DashboardDomainPage, {});

describe(`<${DashboardDomainPage.name}/>`, () => {
  beforeEach(() => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      mockMembershipWithTenant(
        mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
      ),
    ]);
    getProjectDomainMock.mockResolvedValue(mockPendingProjectDomain());
  });

  it('redirects a signed-out visitor to sign-in', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
    expect(getProjectDomainMock).not.toHaveBeenCalled();
  });

  it("renders the session tenant's domain page", async () => {
    await setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: t('pageTitle'),
    });
    const cardHeading = await screen.findByRole('heading', {
      level: 2,
      name: t('cardTitle', { domain: MOCK_CUSTOM_DOMAIN }),
    });

    expect(heading).toBeVisible();
    expect(cardHeading).toBeVisible();
  });
});
