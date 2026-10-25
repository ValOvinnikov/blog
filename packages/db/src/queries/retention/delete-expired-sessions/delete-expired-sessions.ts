import { getDb } from '@blog/db/client';
import { isInBatch } from '@blog/db/queries/retention/retention-batch';
import { sessions } from '@blog/db/schema/auth';
import { lt } from 'drizzle-orm';

export async function deleteExpiredSessions(
  now: Date,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select({ sessionToken: sessions.sessionToken })
    .from(sessions)
    .where(lt(sessions.expires, now))
    .limit(limit);

  const deleted = await db
    .delete(sessions)
    .where(isInBatch(sessions.sessionToken, batch))
    .returning({ sessionToken: sessions.sessionToken });

  return deleted.length;
}
