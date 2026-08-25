import { mockDbConstants } from '@admin/testing/mock-db-constants';

import { isSuperAdmin } from './is-super-admin';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

describe(isSuperAdmin, () => {
  beforeEach(() => {
    getAdminByUserIdMock.mockReset();
  });

  it('returns false when the user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(isSuperAdmin('user-1')).resolves.toBe(false);
    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
  });

  it('returns false for an ADMIN role', async () => {
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    await expect(isSuperAdmin('user-1')).resolves.toBe(false);
  });

  it('returns false for a MODERATOR role', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'MODERATOR',
    });

    await expect(isSuperAdmin('user-1')).resolves.toBe(false);
  });

  it('returns true for a SUPERADMIN role', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });

    await expect(isSuperAdmin('user-1')).resolves.toBe(true);
  });
});
