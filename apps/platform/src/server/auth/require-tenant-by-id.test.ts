import { faker } from '@faker-js/faker';
import { requireAdmin } from '@platform/server/auth/require-admin';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { mockViewer } from '@platform/testing/memberships/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
  mockEntitlementGrant,
  mockTenant,
} from '@platform/testing/tenants/fixtures';
import { noEntitlementGrantQueries } from '@platform/testing/tenants/no-entitlement-grant-queries';
import { CAPABILITY, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE } from '@shinefold/db/constants';
import { redirect } from 'next/navigation';

import { requireTenantById } from './require-tenant-by-id';

vi.mock('@platform/server/auth/require-admin');

vi.mock('@shinefold/db', async () => {
  const { mockDbConstants } =
    await import('@platform/testing/mock-db-constants');

  return {
    ...(await mockDbConstants()),
    queries: {
      ...noEntitlementGrantQueries(),
      tenants: { getTenantById: vi.fn() },
    },
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

      expect(result).toEqual({
        tenant: resolvedTenant,
        admin: mockAdmin(),
        viewer: mockViewer({ admin: mockAdmin() }),
        canGrantEntitlements: false,
      });
      expect(getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        includeArchived: true,
      });
      expect(redirect).not.toHaveBeenCalled();
    },
  );

  it.each([
    { role: ADMIN_ROLE.SUPERADMIN, canGrant: true },
    { role: ADMIN_ROLE.ADMIN, canGrant: false },
    { role: ADMIN_ROLE.MODERATOR, canGrant: false },
  ])(
    'lets a $role admin grant entitlements: $canGrant',
    async ({ role, canGrant }) => {
      getTenantById.mockResolvedValue(tenant);
      vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin({ role }));

      const { canGrantEntitlements } = await requireTenantById(MOCK_TENANT_ID);

      expect(canGrantEntitlements).toBe(canGrant);
    },
  );

  it("opens what the tenant's open grants unlock", async () => {
    getTenantById.mockResolvedValue(tenant);
    vi.mocked(
      queries.tenantEntitlementGrants.listResolvableEntitlementGrants,
    ).mockResolvedValueOnce([
      mockEntitlementGrant({ key: CAPABILITY.CONTACT_FORM }),
    ]);

    const { tenant: resolved } = await requireTenantById(MOCK_TENANT_ID);

    expect(
      queries.tenantEntitlementGrants.listResolvableEntitlementGrants,
    ).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(resolved.pageAccess.leads).toBe(true);
  });
});
