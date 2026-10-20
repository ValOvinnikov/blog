import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { isSuperAdmin } from './is-super-admin';
import { requireTenantOwnerOrAdmin } from './require-tenant-owner-or-admin';

const { getMembershipMock, getAdminByUserIdMock } = vi.hoisted(() => ({
  getMembershipMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(requireTenantOwnerOrAdmin, () => {
  beforeEach(() => {
    authMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue({ role: 'OWNER' });
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantOwnerOrAdmin('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
  });

  it('404s for a signed-in user with no membership in the tenant', async () => {
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantOwnerOrAdmin('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  it('404s for an EDITOR of the tenant', async () => {
    getMembershipMock.mockResolvedValue({ role: 'EDITOR' });

    await expect(requireTenantOwnerOrAdmin('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  it("admits the tenant's OWNER", async () => {
    await expect(requireTenantOwnerOrAdmin('tenant-1')).resolves.toBe(
      undefined,
    );

    expect(getMembershipMock).toHaveBeenCalledWith('user-1', 'tenant-1');
  });

  it('admits any admin by default, without a membership', async () => {
    getAdminByUserIdMock.mockResolvedValue({ role: 'MODERATOR' });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantOwnerOrAdmin('tenant-1')).resolves.toBe(
      undefined,
    );
  });

  it('404s for an admin the predicate refuses who does not own the tenant', async () => {
    getAdminByUserIdMock.mockResolvedValue({ role: 'ADMIN' });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(
      requireTenantOwnerOrAdmin('tenant-1', isSuperAdmin),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('admits an admin the predicate refuses who owns the tenant', async () => {
    getAdminByUserIdMock.mockResolvedValue({ role: 'ADMIN' });

    await expect(
      requireTenantOwnerOrAdmin('tenant-1', isSuperAdmin),
    ).resolves.toBe(undefined);
  });
});
