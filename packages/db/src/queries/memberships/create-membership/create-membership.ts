import { getDb } from '@blog/db/client';
import type { TMembershipRole } from '@blog/db/constants';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { and, eq } from 'drizzle-orm';

// Idempotent on the (userId, tenantId) pair (the table's unique
// constraint) rather than throwing on a re-insert. Does not update `role`
// on an existing row — changing a member's role is a distinct, deliberate
// action, not implied by calling this again.
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
