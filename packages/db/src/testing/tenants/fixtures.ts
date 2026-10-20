import { SANITY_LOGIN_PROVIDER } from '@blog/config/constants';
import { SANITY_PROJECT_ROLE } from '@blog/db/constants';
import type { TTenantOwnerAccess } from '@blog/db/queries/tenants/tenant-owner-access';
import type * as schema from '@blog/db/schema';
import { faker } from '@faker-js/faker';

export function makeTenantOwnerAccess(
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
  };
}
