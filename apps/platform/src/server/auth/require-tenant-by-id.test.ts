import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import { requireTenantById } from './require-tenant-by-id';

const { authMock, getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
  }),
);

vi.mock('./auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

describe(requireTenantById, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying admins or the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantById('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s without querying the tenant when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(requireTenantById('tenant-1')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(redirect).not.toHaveBeenCalled();
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(requireTenantById('ghost')).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getTenantByIdMock).toHaveBeenCalledWith('ghost', {
      includeArchived: true,
    });
  });

  it('returns the tenant and admin for a signed-in admins row, without checking membership', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const admin = {
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      grantedBy: null,
      grantedVia: 'MANUAL',
      grantedAt: new Date(),
      createdAt: new Date(),
    };
    getAdminByUserIdMock.mockResolvedValue(admin);
    const tenant = { id: 'tenant-1', slug: 'acme' };
    getTenantByIdMock.mockResolvedValue(tenant);

    const result = await requireTenantById('tenant-1');

    expect(result).toEqual({ tenant, admin });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves an archived tenant, requesting it with includeArchived so the query does not filter it out', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    const admin = {
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      grantedBy: null,
      grantedVia: 'MANUAL',
      grantedAt: new Date(),
      createdAt: new Date(),
    };
    getAdminByUserIdMock.mockResolvedValue(admin);
    const archivedTenant = {
      id: 'tenant-1',
      slug: 'acme',
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    };
    getTenantByIdMock.mockResolvedValue(archivedTenant);

    const result = await requireTenantById('tenant-1');

    expect(result).toEqual({ tenant: archivedTenant, admin });
    expect(getTenantByIdMock).toHaveBeenCalledWith('tenant-1', {
      includeArchived: true,
    });
  });
});
