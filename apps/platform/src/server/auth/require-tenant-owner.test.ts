import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { requireTenantOwner } from './require-tenant-owner';

const { getTenantByIdMock, getMembershipMock, getAdminByUserIdMock } =
  vi.hoisted(() => ({
    getTenantByIdMock: vi.fn(),
    getMembershipMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
  }));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantById: getTenantByIdMock },
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

describe(requireTenantOwner, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantByIdMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantByIdMock.mockResolvedValue({ id: MOCK_TENANT_ID });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue({ role: MEMBERSHIP_ROLE.OWNER });
  });

  it('redirects to sign-in without a session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantOwner(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin?callbackUrl=%2F');
  });

  it('404s for a signed-in user with no membership in the tenant', async () => {
    getMembershipMock.mockResolvedValue(undefined);

    await expect(requireTenantOwner(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('404s for an editor', async () => {
    getMembershipMock.mockResolvedValue({ role: MEMBERSHIP_ROLE.EDITOR });

    await expect(requireTenantOwner(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('admits an owner', async () => {
    const { membership } = await requireTenantOwner(MOCK_TENANT_ID);

    expect(membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
  });

  it('admits an operator with no membership of their own', async () => {
    getAdminByUserIdMock.mockResolvedValue({ userId: 'user-1' });
    getMembershipMock.mockResolvedValue(undefined);

    const { membership } = await requireTenantOwner(MOCK_TENANT_ID);

    expect(membership.role).toBe(MEMBERSHIP_ROLE.OWNER);
  });
});
