import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { MOCK_TENANT_ID, mockTenant } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
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

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const USER_ID = 'user-1';
const INVALID_INPUT_SYNTAX = 'invalid input syntax';
const NOT_A_UUID = 'not-a-uuid';
const UNKNOWN_TENANT_ID = 'ghost';

const admin = mockAdmin({ userId: USER_ID });
const tenant = mockTenant();

const TENANT_READS = [
  {
    tenantCase: 'an existing tenant',
    tenantId: MOCK_TENANT_ID,
    arrangeRead: () => getTenantByIdMock.mockResolvedValue(tenant),
  },
  {
    tenantCase: 'a malformed id whose read fails',
    tenantId: NOT_A_UUID,
    arrangeRead: () =>
      getTenantByIdMock.mockRejectedValue(new Error(INVALID_INPUT_SYNTAX)),
  },
];

describe('requireTenantById', () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    authMock.mockResolvedValue({ user: { id: USER_ID } });
    getAdminByUserIdMock.mockResolvedValue(admin);
  });

  it.each(TENANT_READS)(
    'redirects a signed-out visitor to sign-in for $tenantCase',
    async ({ tenantId, arrangeRead }) => {
      authMock.mockResolvedValue(null);
      arrangeRead();

      await expect(requireTenantById(tenantId)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );

      expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
      expect(getAdminByUserIdMock).not.toHaveBeenCalled();
    },
  );

  it.each(TENANT_READS)(
    '404s a signed-in user with no admins row for $tenantCase',
    async ({ tenantId, arrangeRead }) => {
      getAdminByUserIdMock.mockResolvedValue(undefined);
      arrangeRead();

      await expect(requireTenantById(tenantId)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );

      expect(getAdminByUserIdMock).toHaveBeenCalledWith(USER_ID);
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it('surfaces a failed tenant read for an admin', async () => {
    getTenantByIdMock.mockRejectedValue(new Error(INVALID_INPUT_SYNTAX));

    await expect(requireTenantById(NOT_A_UUID)).rejects.toThrow(
      INVALID_INPUT_SYNTAX,
    );
  });

  it('404s for an unknown tenant id', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(requireTenantById(UNKNOWN_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getTenantByIdMock).toHaveBeenCalledWith(UNKNOWN_TENANT_ID, {
      includeArchived: true,
    });
  });

  it.each([
    { tenantCase: 'a live tenant', resolvedTenant: tenant },
    {
      tenantCase: 'an archived tenant',
      resolvedTenant: mockTenant({
        deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
      }),
    },
  ])(
    'returns $tenantCase and the admin without checking membership',
    async ({ resolvedTenant }) => {
      getTenantByIdMock.mockResolvedValue(resolvedTenant);

      const result = await requireTenantById(MOCK_TENANT_ID);

      expect(result).toEqual({ tenant: resolvedTenant, admin });
      expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        includeArchived: true,
      });
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});
