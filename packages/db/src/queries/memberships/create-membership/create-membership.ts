import type { TMembershipRole } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { and, eq } from 'drizzle-orm';

// Grants `userId` a role on `tenantId`. Idempotent on the (userId, tenantId)
// pair (the table's unique constraint) — matches `addBookmark`'s
// insert-first shape, so re-running the seed script never throws a raw
// constraint violation. Does not update `role` on an existing row; changing
// an existing member's role is a distinct, deliberate action, not implied by
// calling this again.
export async function createMembership(
  userId: string,
  tenantId: string,
  role: TMembershipRole,
): Promise<TMembership> {
  const db = getDb();

  const [inserted] = await db
    .insert(memberships)
    .values({ userId, tenantId, role })
    .onConflictDoNothing()
    .returning();

  if (inserted) return inserted;

  const [existing] = await db
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)),
    );

  if (!existing) {
    throw new Error(
      `createMembership: expected an existing row for user "${userId}" / tenant "${tenantId}" after a no-op insert.`,
    );
  }

  return existing;
}
