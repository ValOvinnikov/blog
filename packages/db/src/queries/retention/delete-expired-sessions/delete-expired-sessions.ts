import { getDb } from '@shinefold/db/client';
import { isInBatch } from '@shinefold/db/queries/retention/retention-batch';
import { sessions } from '@shinefold/db/schema/auth';
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
