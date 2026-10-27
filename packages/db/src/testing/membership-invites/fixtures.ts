import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TMembershipInvite } from '@blog/db/schema/membership-invites';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { faker } from '@faker-js/faker';

export const MOCK_INVITE_CONSUMED_AT = new Date('2026-08-12T00:00:00.000Z');

export async function mockMembershipInvite(
  db: TTestDb,
  tenantId: string,
  overrides: Partial<typeof schema.membershipInvites.$inferInsert> = {},
): Promise<TMembershipInvite> {
  const [invite] = await db
    .insert(schema.membershipInvites)
    .values({
      tenantId,
      email: faker.internet.email().toLowerCase(),
      role: MEMBERSHIP_ROLE.OWNER,
      ...overrides,
    })
    .returning();

  if (!invite) {
    throw new Error('mockMembershipInvite: insert returned no row.');
  }

  return invite;
}
