import { auth } from '@platform/server/auth/auth';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import type { Session } from 'next-auth';

import { resolveHomeHref } from './resolve-home-href';

vi.mock('@platform/server/auth/auth');

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(resolveHomeHref, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
  });

  it('links to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(resolveHomeHref()).resolves.toBe('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('links an admin to the tenants list', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });

    await expect(resolveHomeHref()).resolves.toBe('/tenants');
    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
  });

  it('links anyone else to the dashboard', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(resolveHomeHref()).resolves.toBe('/dashboard');
  });
});
