import type { TAdminRole, TGrantedVia } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { admins, type TAdmin } from '@blog/db/schema/admins';
import { eq } from 'drizzle-orm';

// Idempotent on `userId` (the table's unique constraint) rather than
// throwing on a re-grant. Does not update `role` on an existing row —
// changing an admin's role is a distinct, deliberate action, not implied by
// calling this again.
//
// `grantedVia` is required and passed explicitly rather than inferred from
// whether `grantedBy` is set — inferring it would tie the grant path back to
// `grantedBy`'s presence, the exact ambiguity `grantedVia` exists to remove.
export async function createAdmin(
  userId: string,
  role: TAdminRole,
  grantedVia: TGrantedVia,
  grantedBy?: string,
): Promise<TAdmin> {
  const db = getDb();

  const [inserted] = await db
    .insert(admins)
    .values({ userId, role, grantedVia, grantedBy })
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
