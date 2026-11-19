import { deleteRetentionBatch } from '@shinefold/db/queries/retention/retention-batch';
import { sessions } from '@shinefold/db/schema/auth';
import { lt } from 'drizzle-orm';

export async function deleteExpiredSessions(
  now: Date,
  limit: number,
): Promise<number> {
  return deleteRetentionBatch(
    sessions,
    [sessions.sessionToken],
    lt(sessions.expires, now),
    limit,
  );
}
