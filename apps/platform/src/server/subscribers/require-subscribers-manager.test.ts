import { buildVirtualAdminMembership } from '@platform/server/auth/build-virtual-admin-membership';
import { requireTenantManager } from '@platform/server/auth/require-tenant-manager';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  mockMembership,
  mockMembershipContext,
  mockViewer,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockPlatformNewsletterTenant } from '@platform/testing/subscribers/fixtures';
import {
  MOCK_TENANT_ID,
  mockReadyTenant,
} from '@platform/testing/tenants/fixtures';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  NEXT_NAVIGATION_ERROR,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config';
import { queries } from '@shinefold/db';
import {
  ADMIN_ROLE,
  MEMBERSHIP_ROLE,
  type TAdminRole,
} from '@shinefold/db/constants';

import { requireSubscribersManager } from './require-subscribers-manager';

vi.mock('@platform/server/auth/require-tenant-manager', () => ({
  requireTenantManager: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { memberships: { getMembership: vi.fn() } },
}));

const getMembership = vi.mocked(queries.memberships.getMembership);

const contextOn = (plan: TTenantPlan) =>
  mockMembershipContext(mockReadyTenant({ id: MOCK_TENANT_ID, plan }));

const operatorContextOn = (tenant: TPlatformTenant, role: TAdminRole) => {
  const admin = mockAdmin({ role });
  const membership = buildVirtualAdminMembership(admin.userId, tenant.id);

  return { tenant, membership, viewer: mockViewer({ membership, admin }) };
};

describe(requireSubscribersManager, () => {
  beforeEach(() => {
    getMembership.mockResolvedValue(undefined);
  });

  it('admits the owner of a site whose plan includes the newsletter', async () => {
    const context = contextOn(TENANT_PLAN.GROWTH);
    vi.mocked(requireTenantManager).mockResolvedValue(context);

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).resolves.toBe(
      context,
    );
    expect(requireTenantManager).toHaveBeenCalledWith(MOCK_TENANT_ID);
    expect(getMembership).not.toHaveBeenCalled();
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'refuses a %s site as not found',
    async (plan) => {
      vi.mocked(requireTenantManager).mockResolvedValue(contextOn(plan));

      await expect(requireSubscribersManager(MOCK_TENANT_ID)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
    },
  );

  it('admits a super admin on a platform-created site', async () => {
    const context = operatorContextOn(
      mockPlatformNewsletterTenant(),
      ADMIN_ROLE.SUPERADMIN,
    );
    vi.mocked(requireTenantManager).mockResolvedValue(context);

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).resolves.toBe(
      context,
    );
  });

  it.each([
    ['an admin', ADMIN_ROLE.ADMIN, true],
    ['a super admin on a self-serve site', ADMIN_ROLE.SUPERADMIN, false],
  ])(
    'refuses %s who is not a member of the site',
    async (_viewer, role, createdFromPlatform) => {
      vi.mocked(requireTenantManager).mockResolvedValue(
        operatorContextOn(
          mockPlatformNewsletterTenant({ createdFromPlatform }),
          role,
        ),
      );

      await expect(requireSubscribersManager(MOCK_TENANT_ID)).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
    },
  );

  it('admits an admin who owns the site', async () => {
    const context = operatorContextOn(
      mockPlatformNewsletterTenant(),
      ADMIN_ROLE.ADMIN,
    );
    vi.mocked(requireTenantManager).mockResolvedValue(context);
    getMembership.mockResolvedValue(mockMembership());

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).resolves.toBe(
      context,
    );
    expect(getMembership).toHaveBeenCalledWith(
      context.membership.userId,
      MOCK_TENANT_ID,
    );
  });

  it('refuses an admin who only edits the site', async () => {
    vi.mocked(requireTenantManager).mockResolvedValue(
      operatorContextOn(mockPlatformNewsletterTenant(), ADMIN_ROLE.ADMIN),
    );
    getMembership.mockResolvedValue(
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    );

    await expect(requireSubscribersManager(MOCK_TENANT_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
  });
});
