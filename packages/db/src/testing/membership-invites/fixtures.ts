import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import * as schema from '@blog/db/schema';
import type { TMembershipInvite } from '@blog/db/schema/membership-invites';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { faker } from '@faker-js/faker';

export const MOCK_INVITE_CONSUMED_AT = new Date('2026-08-12T00:00:00.000Z');

export async function mockMembershipInvite(
  db: TTestDb,
  tenantId: string,
  {
    email = faker.internet.email().toLowerCase(),
    ...overrides
  }: Partial<
    typeof schema.membershipInvites.$inferInsert & { email: string }
  > = {},
): Promise<TMembershipInvite> {
  const [invite] = await db
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      ...inviteEmailColumns(email),
      role: MEMBERSHIP_ROLE.OWNER,
      ...overrides,
    })
    .returning();

  if (!invite) {
    throw new Error('mockMembershipInvite: insert returned no row.');
  }

  return invite;
}
