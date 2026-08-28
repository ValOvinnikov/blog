import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import { requireSuperAdmin } from './require-super-admin';

const { authMock, getAdminByUserIdMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

describe(requireSuperAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the admins row when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
  });

  it('404s when the admin row is below SUPERADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    await expect(requireSuperAdmin()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves to the admin row when the role is SUPERADMIN', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const admin = { id: 'admin-1', role: 'SUPERADMIN' };
    getAdminByUserIdMock.mockResolvedValue(admin);

    const result = await requireSuperAdmin();

    expect(result).toEqual(admin);
    expect(redirect).not.toHaveBeenCalled();
  });
});
