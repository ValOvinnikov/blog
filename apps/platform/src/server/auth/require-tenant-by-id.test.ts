import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { queries } from '@blog/db';
import { faker } from '@faker-js/faker';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { redirect } from 'next/navigation';

import { requireTenantById } from './require-tenant-by-id';

vi.mock('@platform/server/auth/require-admin');

vi.mock('@blog/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: { tenants: { getTenantById: vi.fn() } },
  };
});

faker.seed(5997);

const MOCK_READ_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_MALFORMED_TENANT_ID = faker.lorem.slug();
const MOCK_UNKNOWN_TENANT_ID = faker.string.uuid();

const getTenantById = vi.mocked(queries.tenants.getTenantById);

const tenant = mockTenant();

const TENANT_READS = [
  {
    tenantCase: 'an existing tenant',
    tenantId: MOCK_TENANT_ID,
    arrangeRead: () => getTenantById.mockResolvedValue(tenant),
  },
  {
    tenantCase: 'a malformed id whose read fails',
    tenantId: MOCK_MALFORMED_TENANT_ID,
    arrangeRead: () =>
      getTenantById.mockRejectedValue(new Error(MOCK_READ_ERROR_MESSAGE)),
  },
];

const LIVE_AND_ARCHIVED_TENANTS = [
  { tenantCase: 'a live tenant', resolvedTenant: tenant },
  {
    tenantCase: 'an archived tenant',
    resolvedTenant: mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
  },
];

describe(requireTenantById, () => {
  beforeEach(() => {
    getTenantById.mockReset();
  });

  it.each(TENANT_READS)(
    'surfaces the admin gate failure for $tenantCase',
    async ({ tenantId, arrangeRead }) => {
      vi.mocked(requireAdmin).mockRejectedValueOnce(
        new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
      );
      arrangeRead();

      await expect(requireTenantById(tenantId)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_REDIRECT,
      );
    },
  );

  it('surfaces a failed tenant read for an admin', async () => {
    getTenantById.mockRejectedValue(new Error(MOCK_READ_ERROR_MESSAGE));

    await expect(requireTenantById(MOCK_MALFORMED_TENANT_ID)).rejects.toThrow(
      MOCK_READ_ERROR_MESSAGE,
    );
  });

  it('404s for an unknown tenant id', async () => {
    getTenantById.mockResolvedValue(undefined);

    await expect(requireTenantById(MOCK_UNKNOWN_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );

    expect(getTenantById).toHaveBeenCalledWith(MOCK_UNKNOWN_TENANT_ID, {
      includeArchived: true,
    });
  });

  it.each(LIVE_AND_ARCHIVED_TENANTS)(
    'returns $tenantCase and the admin without checking membership',
    async ({ resolvedTenant }) => {
      getTenantById.mockResolvedValue(resolvedTenant);

      const result = await requireTenantById(MOCK_TENANT_ID);

      expect(result).toEqual({ tenant: resolvedTenant, admin: mockAdmin() });
      expect(getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        includeArchived: true,
      });
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});
