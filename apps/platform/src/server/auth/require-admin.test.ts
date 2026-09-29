import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound, redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { requireAdmin } from './require-admin';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(requireAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireAdmin()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(requireAdmin()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves to the admin row for a signed-in admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const admin = { id: 'admin-1', userId: 'user-1', role: 'ADMIN' };
    getAdminByUserIdMock.mockResolvedValue(admin);

    const result = await requireAdmin();

    expect(result).toEqual(admin);
    expect(redirect).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
  });
});
