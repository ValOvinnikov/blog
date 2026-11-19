import { deleteRetentionBatch } from '@shinefold/db/queries/retention/retention-batch';
import { verificationTokens } from '@shinefold/db/schema/auth';
import { lt } from 'drizzle-orm';

// Auth.js deletes a sign-in token when it is used, so only expired ones remain.
export async function deleteExpiredVerificationTokens(
  now: Date,
  limit: number,
): Promise<number> {
  return deleteRetentionBatch(
    verificationTokens,
    [verificationTokens.identifier, verificationTokens.token],
    lt(verificationTokens.expires, now),
    limit,
  );
}
