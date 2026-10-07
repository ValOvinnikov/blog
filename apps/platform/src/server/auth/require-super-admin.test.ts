import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { requireSuperAdmin } from './require-super-admin';

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

describe(requireSuperAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('redirects to sign-in without querying the admins row when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
  });

  it('404s when the admin row is below SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves to the admin row when the role is SUPERADMIN', async () => {
    const admin = { id: 'admin-1', role: 'SUPERADMIN' };
    getAdminByUserIdMock.mockResolvedValue(admin);

    const result = await requireSuperAdmin();

    expect(result).toEqual(admin);
    expect(redirect).not.toHaveBeenCalled();
  });
});
