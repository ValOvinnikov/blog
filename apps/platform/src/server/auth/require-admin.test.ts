import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { auth } from '@platform/server/auth/auth';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { requireAdmin } from './require-admin';

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: { admins: { getAdminByUserId: vi.fn() } },
  };
});

faker.seed(5997);

const MOCK_USER_ID = faker.string.uuid();

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const getAdminByUserId = vi.mocked(queries.admins.getAdminByUserId);

describe(requireAdmin, () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    getAdminByUserId.mockReset();
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(requireAdmin()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
    expect(getAdminByUserId).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserId.mockResolvedValue(undefined);

    await expect(requireAdmin()).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getAdminByUserId).toHaveBeenCalledWith(MOCK_USER_ID);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves to the admin row for a signed-in admins row', async () => {
    const admin = mockAdmin({ userId: MOCK_USER_ID });
    getAdminByUserId.mockResolvedValue(admin);

    const result = await requireAdmin();

    expect(result).toEqual(admin);
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });
});
