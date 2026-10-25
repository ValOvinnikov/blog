import { getDb } from '@blog/db/client';
import { verificationTokens } from '@blog/db/schema/auth';
import { lt } from 'drizzle-orm';

// Auth.js deletes a sign-in token when it is used, so only expired ones remain.
export async function deleteExpiredVerificationTokens(
  now: Date,
): Promise<number> {
  const deleted = await getDb()
    .delete(verificationTokens)
    .where(lt(verificationTokens.expires, now))
    .returning({ token: verificationTokens.token });

  return deleted.length;
}
