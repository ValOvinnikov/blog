import { SANITY_LOGIN_PROVIDER } from '@blog/config/constants';
import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import type { TTenantOwnerAccess } from '@blog/db/queries/tenants/tenant-owner-access';
import type * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';

export const MOCK_NO_OWNER_ACCESS = {
  ownerSanityInviteId: null,
  ownerInviteSentAt: null,
  ownerInviteAcceptedAt: null,
  ownerSanityUserId: null,
  ownerLoginProvider: null,
  ownerSanityRole: null,
  ownerInviteHeadsUpSentAt: null,
  ownerInviteNudgeSentAt: null,
  ownerSiteReadySentAt: null,
} as const satisfies Partial<TTenant>;

export function mockTenantOwnerAccess(
  overrides: Partial<TTenantOwnerAccess> = {},
): TTenantOwnerAccess {
  const inviteSentAt = faker.date.recent();

  return {
    sanityInviteId: faker.string.uuid(),
    inviteSentAt,
    inviteAcceptedAt: faker.date.soon({ refDate: inviteSentAt }),
    sanityUserId: faker.string.alphanumeric(10),
    loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    sanityRole: SANITY_PROJECT_ROLE.ADMINISTRATOR,
    inviteHeadsUpSentAt: inviteSentAt,
    inviteNudgeSentAt: faker.date.soon({ refDate: inviteSentAt }),
    siteReadySentAt: faker.date.soon({ refDate: inviteSentAt }),
    ...overrides,
  };
}

export function toTenantOwnerAccessColumns(
  access: Partial<TTenantOwnerAccess>,
): Partial<typeof schema.tenants.$inferInsert> {
  return {
    ownerSanityInviteId: access.sanityInviteId,
    ownerInviteSentAt: access.inviteSentAt,
    ownerInviteAcceptedAt: access.inviteAcceptedAt,
    ownerSanityUserId: access.sanityUserId,
    ownerLoginProvider: access.loginProvider,
    ownerSanityRole: access.sanityRole,
    ownerInviteHeadsUpSentAt: access.inviteHeadsUpSentAt,
    ownerInviteNudgeSentAt: access.inviteNudgeSentAt,
    ownerSiteReadySentAt: access.siteReadySentAt,
  };
}
