import {
  type TMaybeNull,
  LOCALE_ISO_CODES,
  NEXT_NAVIGATION_ERROR,
} from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import DashboardLookPage from './page';

const {
  listMembershipsWithTenantsForUserMock,
  getAdminByUserIdMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  listMembershipsWithTenantsForUserMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@platform/server/settings-features/get-enabled-capabilities');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
    tenants: {
      selectLiveLocales: vi.fn().mockReturnValue([LOCALE_ISO_CODES.EN]),
    },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const membership = {
  id: 'm-1',
  userId: 'user-1',
  tenantId: MOCK_TENANT_ID,
  role: MEMBERSHIP_ROLE.OWNER,
};

const setup = customRenderAsync(DashboardLookPage, {});

describe(`<${DashboardLookPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSiteConfigMock.mockReset();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockResolvedValue([
      { membership, tenant: { id: MOCK_TENANT_ID } },
    ]);
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it("renders the resolved tenant's Look form", async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(screen.getByRole('heading', { name: 'Look' })).toBeVisible();
  });
});
