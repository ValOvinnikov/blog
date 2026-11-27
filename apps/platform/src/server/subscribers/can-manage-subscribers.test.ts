import {
  mockEditorMembershipContext,
  mockMembership,
  mockMembershipContext,
  mockOperatorMembershipContext,
} from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockPlatformNewsletterTenant } from '@platform/testing/subscribers/fixtures';
import {
  MOCK_ARCHIVED_AT,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { TENANT_PLAN } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { ADMIN_ROLE, MEMBERSHIP_ROLE } from '@shinefold/db/constants';

import { canManageSubscribers } from './can-manage-subscribers';

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { memberships: { getMembership: vi.fn() } },
}));

const getMembership = vi.mocked(queries.memberships.getMembership);

describe(canManageSubscribers, () => {
  beforeEach(() => {
    getMembership.mockResolvedValue(undefined);
  });

  it('admits the owner of a site whose plan includes the newsletter', async () => {
    const isAllowed = await canManageSubscribers(
      mockMembershipContext(mockPlatformNewsletterTenant()),
    );

    expect(isAllowed).toBe(true);
    expect(getMembership).not.toHaveBeenCalled();
  });

  it.each([TENANT_PLAN.FREE, TENANT_PLAN.STARTER])(
    'refuses the owner of a %s site',
    async (plan) => {
      const isAllowed = await canManageSubscribers(
        mockMembershipContext(mockPlatformNewsletterTenant({ plan })),
      );

      expect(isAllowed).toBe(false);
    },
  );

  it('refuses an editor', async () => {
    const isAllowed = await canManageSubscribers(
      mockEditorMembershipContext(mockPlatformNewsletterTenant()),
    );

    expect(isAllowed).toBe(false);
  });

  it('admits a super admin on a platform-created site', async () => {
    const isAllowed = await canManageSubscribers(
      mockOperatorMembershipContext(
        mockPlatformNewsletterTenant(),
        ADMIN_ROLE.SUPERADMIN,
      ),
    );

    expect(isAllowed).toBe(true);
  });

  it.each([
    ['an admin', ADMIN_ROLE.ADMIN, {}],
    [
      'a super admin on a self-serve site',
      ADMIN_ROLE.SUPERADMIN,
      { createdFromPlatform: false },
    ],
    [
      'a super admin on an archived site',
      ADMIN_ROLE.SUPERADMIN,
      { deprovisionedAt: MOCK_ARCHIVED_AT },
    ],
  ])(
    'refuses %s who is not a member of the site',
    async (_viewer, role, tenantOverrides) => {
      const isAllowed = await canManageSubscribers(
        mockOperatorMembershipContext(
          mockPlatformNewsletterTenant(tenantOverrides),
          role,
        ),
      );

      expect(isAllowed).toBe(false);
    },
  );

  it('admits an admin who owns the site', async () => {
    const context = mockOperatorMembershipContext(
      mockPlatformNewsletterTenant({ createdFromPlatform: false }),
      ADMIN_ROLE.ADMIN,
    );
    getMembership.mockResolvedValue(mockMembership());

    const isAllowed = await canManageSubscribers(context);

    expect(isAllowed).toBe(true);
    expect(getMembership).toHaveBeenCalledWith(
      context.membership.userId,
      MOCK_TENANT_ID,
    );
  });

  it('refuses an admin who only edits the site', async () => {
    getMembership.mockResolvedValue(
      mockMembership({ role: MEMBERSHIP_ROLE.EDITOR }),
    );

    const isAllowed = await canManageSubscribers(
      mockOperatorMembershipContext(
        mockPlatformNewsletterTenant(),
        ADMIN_ROLE.ADMIN,
      ),
    );

    expect(isAllowed).toBe(false);
  });
});
