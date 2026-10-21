import type { TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  blockedSignupIdentities,
  type TBlockedSignupIdentity,
} from '@blog/db/schema/blocked-signup-identities';
import type { TResult } from '@blog/utils';
import { desc } from 'drizzle-orm';

export async function listBlockedIdentities(): Promise<
  TResult<TBlockedSignupIdentity[], TErrorCode>
> {
  const db = getDb();

  const rows = await db
    .select()
    .from(blockedSignupIdentities)
    .orderBy(
      desc(blockedSignupIdentities.createdAt),
      desc(blockedSignupIdentities.id),
    );

  return { ok: true, data: rows };
}
