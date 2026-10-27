import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { mockMembership } from '@platform/testing/memberships/fixtures';
import { mockTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Session } from 'next-auth';

import { resolveHomeHref } from './resolve-home-href';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      admins: { getAdminByUserId: vi.fn() },
      memberships: { listMembershipsWithTenantsForUser: vi.fn() },
    },
  };
});

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);
const listMembershipsWithTenantsForUser = vi.mocked(
  queries.memberships.listMembershipsWithTenantsForUser,
);

describe(resolveHomeHref, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getAdminByUserId.mockReset();
    getAdminByUserId.mockResolvedValue(undefined);
    listMembershipsWithTenantsForUser.mockReset();
    listMembershipsWithTenantsForUser.mockResolvedValue([]);
  });

  it('links to sign-in when there is no session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(resolveHomeHref()).resolves.toBe(MOCK_SIGN_IN_HREF);
    expect(getAdminByUserId).not.toHaveBeenCalled();
  });

  it('links an admin to the tenants list', async () => {
    getAdminByUserId.mockResolvedValue(mockAdmin({ userId: MOCK_USER_ID }));

    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.tenants());
    expect(getAdminByUserId).toHaveBeenCalledWith(MOCK_USER_ID);
  });

  it('links a member to the dashboard', async () => {
    listMembershipsWithTenantsForUser.mockResolvedValue([
      {
        membership: mockMembership({ userId: MOCK_USER_ID }),
        tenant: mockTenant(),
      },
    ]);

    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.dashboard());
  });

  it('links a user with no membership to onboarding', async () => {
    await expect(resolveHomeHref()).resolves.toBe(adminRoutes.onboarding());
  });
});
