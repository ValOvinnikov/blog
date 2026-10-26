import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Session } from 'next-auth';

import { resolveHomeHref } from './resolve-home-href';

vi.mock('@platform/server/auth/auth');

const { getAdminByUserIdMock, listMembershipsWithTenantsForUserMock } =
  vi.hoisted(() => ({
    getAdminByUserIdMock: vi.fn(),
    listMembershipsWithTenantsForUserMock: vi.fn(),
  }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    memberships: {
      listMembershipsWithTenantsForUser: listMembershipsWithTenantsForUserMock,
    },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const MOCK_USER_ID = 'user-1';

describe(resolveHomeHref, () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUserMock.mockReset();
    listMembershipsWithTenantsForUserMock.mockResolvedValue([]);
  });

  it('links to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(resolveHomeHref()).resolves.toBe(MOCK_SIGN_IN_HREF);
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('links an admin to the tenants list', async () => {
    getAdminByUserIdMock.mockResolvedValue(mockAdmin());

    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.tenants());
    expect(getAdminByUserIdMock).toHaveBeenCalledWith(MOCK_USER_ID);
  });

  it('links a member to the dashboard', async () => {
    listMembershipsWithTenantsForUserMock.mockResolvedValue([{}]);

    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.dashboard());
  });

  it('links a user with no membership to onboarding', async () => {
    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.onboarding());
  });
});
