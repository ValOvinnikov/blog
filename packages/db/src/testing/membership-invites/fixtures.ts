import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TCreateMembershipInviteResult } from '@blog/db/queries/membership-invites/create-membership-invite';
import { inviteEmailColumns } from '@blog/db/queries/membership-invites/invite-email-columns';
import * as schema from '@blog/db/schema';
import type { TMembershipInvite } from '@blog/db/schema/membership-invites';
import { firstRowOrThrow } from '@blog/db/testing/first-row-or-throw';
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
  return firstRowOrThrow(
    await db
      .insert(schema.membershipInvites)
      .values({
        tenantId,
        ...inviteEmailColumns(email),
        role: MEMBERSHIP_ROLE.OWNER,
        ...overrides,
      })
      .returning(),
    'mockMembershipInvite',
  );
}

export function inviteOf(
  result: TCreateMembershipInviteResult,
): TMembershipInvite {
  if (!('invite' in result)) {
    throw new Error(`inviteOf: the invite was refused (${result.outcome}).`);
  }

  return result.invite;
}

export async function deleteSeatRows(db: TTestDb): Promise<void> {
  await db.delete(schema.membershipInvites);
  await db.delete(schema.memberships);
  await db.delete(schema.tenants);
  await db.delete(schema.users);
}
