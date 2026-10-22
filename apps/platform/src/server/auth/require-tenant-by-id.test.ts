import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import { auth } from './auth';
import { requireTenantById } from './require-tenant-by-id';

const { getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
}));

vi.mock('./auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const SIGN_IN_CALLBACK_PREFIX = '/api/auth/signin?callbackUrl=%2F';
const INVALID_INPUT_SYNTAX = 'invalid input syntax';
const NOT_A_UUID = 'not-a-uuid';

describe(requireTenantById, () => {
  let admin: {
    id: string;
    userId: string;
    role: string;
    grantedBy: null;
    grantedVia: string;
    grantedAt: Date;
    createdAt: Date;
  };

  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    admin = {
      id: 'admin-1',
      userId: 'user-1',
      role: ADMIN_ROLE.ADMIN,
      grantedBy: null,
      grantedVia: 'MANUAL',
      grantedAt: new Date(),
      createdAt: new Date(),
    };
    getAdminByUserIdMock.mockResolvedValue(admin);
  });

  it('redirects to sign-in without querying admins when signed out', async () => {
    authMock.mockResolvedValue(null);

    await expect(requireTenantById(TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(SIGN_IN_CALLBACK_PREFIX);
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('redirects to sign-in when signed out, even for a malformed tenant id', async () => {
    authMock.mockResolvedValue(null);
    getTenantByIdMock.mockRejectedValue(new Error(INVALID_INPUT_SYNTAX));

    await expect(requireTenantById(NOT_A_UUID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
    );

    expect(redirect).toHaveBeenCalledWith(SIGN_IN_CALLBACK_PREFIX);
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(requireTenantById(TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('404s a signed-in user with no admins row, even for a malformed tenant id', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getTenantByIdMock.mockRejectedValue(new Error(INVALID_INPUT_SYNTAX));

    await expect(requireTenantById(NOT_A_UUID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });

  it('surfaces a failed tenant read for an admin', async () => {
    getTenantByIdMock.mockRejectedValue(new Error(INVALID_INPUT_SYNTAX));

    await expect(requireTenantById(NOT_A_UUID)).rejects.toThrow(
      INVALID_INPUT_SYNTAX,
    );
  });

  it('404s for an unknown tenant id', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.ADMIN,
    });
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(requireTenantById('ghost')).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getTenantByIdMock).toHaveBeenCalledWith('ghost', {
      includeArchived: true,
    });
  });

  it('returns the tenant and admin for an admins row without checking membership', async () => {
    const tenant = { id: TENANT_ID };
    getTenantByIdMock.mockResolvedValue(tenant);

    const result = await requireTenantById(TENANT_ID);

    expect(result).toEqual({ tenant, admin });
    expect(redirect).not.toHaveBeenCalled();
  });

  it('resolves an archived tenant by requesting it with includeArchived', async () => {
    const archivedTenant = {
      id: TENANT_ID,
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    };
    getTenantByIdMock.mockResolvedValue(archivedTenant);

    const result = await requireTenantById(TENANT_ID);

    expect(result).toEqual({ tenant: archivedTenant, admin });
    expect(getTenantByIdMock).toHaveBeenCalledWith(TENANT_ID, {
      includeArchived: true,
    });
  });
});
