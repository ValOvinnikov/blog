import { getDb } from '@blog/db/client';
import { users } from '@blog/db/schema/auth';
import { accountEmailIndex } from '@blog/utils/encryption';
import {
  EMAIL_TAG_SEPARATOR,
  normalizeEmail,
  normalizeEmailIdentity,
} from '@blog/utils/normalize-email-identity';
import { and, asc, eq, gt, isNotNull, like, sql } from 'drizzle-orm';

import { BATCH_SIZE } from './batch-size';
import type { TPersonalDataKeys } from './personal-data-keys';

interface IStaleUserIndex {
  id: string;
  email: string;
  emailIndex: string;
}

async function findStaleUserIndexes({
  indexKey,
}: TPersonalDataKeys): Promise<IStaleUserIndex[]> {
  const db = getDb();
  const stale: IStaleUserIndex[] = [];
  let afterId: string | undefined;

  for (;;) {
    const batch = await db
      .select({
        id: users.id,
        email: users.email,
        emailIndex: users.emailIndex,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.email),
          like(users.email, `%${EMAIL_TAG_SEPARATOR}%`),
          afterId === undefined ? undefined : gt(users.id, afterId),
        ),
      )
      .orderBy(asc(users.id))
      .limit(BATCH_SIZE);

    for (const { id, email, emailIndex } of batch) {
      if (!email || normalizeEmailIdentity(email) === normalizeEmail(email))
        continue;
      const exact = accountEmailIndex(email, indexKey);
      if (emailIndex !== exact) stale.push({ id, email, emailIndex: exact });
    }

    if (batch.length < BATCH_SIZE) return stale;
    afterId = batch.at(-1)?.id;
  }
}

export async function countStaleTaggedUserIndexes(
  keys: TPersonalDataKeys,
): Promise<number> {
  return (await findStaleUserIndexes(keys)).length;
}

export async function reindexTaggedUserEmails(
  keys: TPersonalDataKeys,
): Promise<number> {
  const db = getDb();
  let reindexed = 0;

  for (const { id, email, emailIndex } of await findStaleUserIndexes(keys)) {
    const updated = await db
      .update(users)
      .set({ emailIndex })
      .where(
        and(
          eq(users.id, id),
          eq(users.email, email),
          sql`${users.emailIndex} is distinct from ${emailIndex}`,
        ),
      )
      .returning({ id: users.id });

    reindexed += updated.length;
  }

  return reindexed;
}
