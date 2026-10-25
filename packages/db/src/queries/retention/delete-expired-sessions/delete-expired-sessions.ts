import { getDb } from '@blog/db/client';
import { sessions } from '@blog/db/schema/auth';
import { lt } from 'drizzle-orm';

export async function deleteExpiredSessions(now: Date): Promise<number> {
  const deleted = await getDb()
    .delete(sessions)
    .where(lt(sessions.expires, now))
    .returning({ sessionToken: sessions.sessionToken });

  return deleted.length;
}
