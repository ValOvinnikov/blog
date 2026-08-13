import { getDb } from '@blog/db/client';
import { memberships, type TMembership } from '@blog/db/schema/memberships';
import { and, eq } from 'drizzle-orm';

export async function getMembership(
  userId: string,
  tenantId: string,
): Promise<TMembership | undefined> {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(memberships)
    .where(
      and(eq(memberships.userId, userId), eq(memberships.tenantId, tenantId)),
    );

  return existing;
}
