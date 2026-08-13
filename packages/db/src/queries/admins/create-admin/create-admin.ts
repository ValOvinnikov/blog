import type { TAdminRole } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { admins, type TAdmin } from '@blog/db/schema/admins';
import { eq } from 'drizzle-orm';

// Idempotent on `userId` (the table's unique constraint) rather than
// throwing on a re-grant. Does not update `role` on an existing row —
// changing an admin's role is a distinct, deliberate action, not implied by
// calling this again.
export async function createAdmin(
  userId: string,
  role: TAdminRole,
): Promise<TAdmin> {
  const db = getDb();

  const [inserted] = await db
    .insert(admins)
    .values({ userId, role })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, userId));

  if (!existing) {
    throw new Error(
      `createAdmin: expected an existing row for user "${userId}" after a no-op insert.`,
    );
  }

  return existing;
}
