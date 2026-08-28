import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { notFound, redirect } from 'next/navigation';

import { requireAdmin } from './require-admin';

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

describe(requireAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
    vi.mocked(notFound).mockClear();
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
