import { getDb } from '@blog/db/client';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { eq } from 'drizzle-orm';

// Every tenant a user belongs to — the admin app's future tenant switcher
// (Phase 8) — not called from `apps/web` today.
export async function listMembershipsForUser(
  userId: string,
): Promise<TMembership[]> {
  const db = getDb();

  return db.select().from(memberships).where(eq(memberships.userId, userId));
}
