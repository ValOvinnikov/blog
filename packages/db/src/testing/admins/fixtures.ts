import { ADMIN_ROLE, GRANTED_VIA } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import type { TAdmin } from '@shinefold/db/schema/admins';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import { insertTestUser, type TTestDb } from '@shinefold/db/testing/fixtures';

export const MOCK_SUPERADMIN_GRANT = {
  role: ADMIN_ROLE.SUPERADMIN,
  grantedVia: GRANTED_VIA.BREAK_GLASS,
} satisfies Partial<typeof schema.admins.$inferInsert>;

export async function insertTestAdminForUser(
  db: TTestDb,
  userId: string,
  overrides: Partial<typeof schema.admins.$inferInsert> = {},
): Promise<TAdmin> {
  return firstRowOrThrow(
    await db
      .insert(schema.admins)
      .values({
        userId,
        role: ADMIN_ROLE.ADMIN,
        grantedVia: GRANTED_VIA.PROMOTION,
        ...overrides,
      })
      .returning(),
    'insertTestAdminForUser',
  );
}

export async function insertTestAdmin(
  db: TTestDb,
  user: Partial<typeof schema.users.$inferInsert> = {},
  overrides: Partial<typeof schema.admins.$inferInsert> = {},
): Promise<TAdmin> {
  const { id: userId } = await insertTestUser(db, user);

  return insertTestAdminForUser(db, userId, overrides);
}

export function useTestAdmin(db: () => TTestDb): () => string {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  afterEach(async () => {
    await db().delete(schema.admins);
    await db().delete(schema.users);
  });

  return () => adminId;
}
