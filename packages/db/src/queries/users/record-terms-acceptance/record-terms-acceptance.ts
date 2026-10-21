import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { and, eq, isNull } from 'drizzle-orm';

export async function recordTermsAcceptance(
  userId: string,
  termsVersion: string,
): Promise<void> {
  await getDb()
    .update(users)
    .set({ termsAcceptedAt: new Date(), termsVersion })
    .where(and(eq(users.id, userId), isNull(users.termsAcceptedAt)));
}
