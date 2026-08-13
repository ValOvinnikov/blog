import { getDb } from '@blog/db/client';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { eq } from 'drizzle-orm';

export async function listMembershipsForUser(
  userId: string,
): Promise<TMembership[]> {
  const db = getDb();

  return db.select().from(memberships).where(eq(memberships.userId, userId));
}
