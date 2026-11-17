import { faker } from '@faker-js/faker';
import { SANITY_LOGIN_PROVIDER } from '@shinefold/config/constants';
import type { TMemberStudioAccess } from '@shinefold/db/queries/memberships/member-studio-access';
import type * as schema from '@shinefold/db/schema';

export function mockMemberStudioAccess(
  overrides: Partial<TMemberStudioAccess> = {},
): TMemberStudioAccess {
  const inviteSentAt = faker.date.recent();

  return {
    sanityInviteId: faker.string.uuid(),
    inviteSentAt,
    inviteAcceptedAt: faker.date.soon({ refDate: inviteSentAt }),
    sanityUserId: faker.string.alphanumeric(10),
    loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
    ...overrides,
  };
}

export function toMemberStudioAccessColumns(
  access: Partial<TMemberStudioAccess>,
): Partial<typeof schema.memberships.$inferInsert> {
  return {
    sanityInviteId: access.sanityInviteId,
    sanityInviteSentAt: access.inviteSentAt,
    sanityInviteAcceptedAt: access.inviteAcceptedAt,
    sanityUserId: access.sanityUserId,
    sanityLoginProvider: access.loginProvider,
  };
}
