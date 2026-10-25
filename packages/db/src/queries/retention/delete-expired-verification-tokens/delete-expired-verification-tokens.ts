import { getDb } from '@blog/db/client';
import { verificationTokens } from '@blog/db/schema/auth';
import { inArray, lt, sql } from 'drizzle-orm';

// Auth.js deletes a sign-in token when it is used, so only expired ones remain.
export async function deleteExpiredVerificationTokens(
  now: Date,
  limit: number,
): Promise<number> {
  const db = getDb();
  const batch = db
    .select({
      identifier: verificationTokens.identifier,
      token: verificationTokens.token,
    })
    .from(verificationTokens)
    .where(lt(verificationTokens.expires, now))
    .limit(limit);

  const deleted = await db
    .delete(verificationTokens)
    .where(
      inArray(
        sql`(${verificationTokens.identifier}, ${verificationTokens.token})`,
        batch,
      ),
    )
    .returning({ token: verificationTokens.token });

  return deleted.length;
}
