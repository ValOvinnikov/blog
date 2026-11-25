import { getDb } from '@shinefold/db/client';
import { sessions } from '@shinefold/db/schema/auth';
import { eq } from 'drizzle-orm';

export async function deleteUserSessions(userId: string): Promise<number> {
  const deleted = await getDb()
    .delete(sessions)
    .where(eq(sessions.userId, userId))
    .returning({ sessionToken: sessions.sessionToken });

  return deleted.length;
}
