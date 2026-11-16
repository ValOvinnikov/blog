import { MEMBERSHIP_ROLE, type TMembershipRole } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TMembership } from '@shinefold/db/schema/memberships';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import { insertTestUser, type TTestDb } from '@shinefold/db/testing/fixtures';
import { createMockFaker } from '@shinefold/db/testing/mock-faker';

const membershipsFaker = createMockFaker(60221);

export const MOCK_USER_ID = membershipsFaker.string.uuid();
export const MOCK_MISSING_USER_ID = membershipsFaker.string.uuid();

export async function mockMembership(
  db: TTestDb,
  overrides: Pick<
    typeof schema.memberships.$inferInsert,
    'userId' | 'tenantId'
  > &
    Partial<typeof schema.memberships.$inferInsert>,
): Promise<TMembership> {
  return firstRowOrThrow(
    await db
      .insert(schema.memberships)
      .values({ role: MEMBERSHIP_ROLE.OWNER, ...overrides })
      .returning(),
    'mockMembership',
  );
}

export async function insertTeam(
  db: TTestDb,
  tenantId: string,
  roles: TMembershipRole[],
): Promise<TMembership[]> {
  const team: TMembership[] = [];
  for (const role of roles) {
    const { id: userId } = await insertTestUser(db, {
      id: membershipsFaker.string.uuid(),
    });
    team.push(await mockMembership(db, { userId, tenantId, role }));
  }
  return team;
}

export async function countLockedMemberships(db: TTestDb): Promise<number> {
  const rows = await db.select().from(schema.memberships);
  return rows.filter(({ lockedAt }) => lockedAt).length;
}
