import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTestDb } from '@blog/db/testing/fixtures';

export async function mockMembership(
  db: TTestDb,
  overrides: Pick<
    typeof schema.memberships.$inferInsert,
    'userId' | 'tenantId'
  > &
    Partial<typeof schema.memberships.$inferInsert>,
): Promise<TMembership> {
  const [membership] = await db
    .insert(schema.memberships)
    .values({ role: MEMBERSHIP_ROLE.OWNER, ...overrides })
    .returning();

  if (!membership) throw new Error('mockMembership: insert returned no row.');

  return membership;
}
