import { ERROR_CODE, type TErrorCode } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/db/utils/normalize-email/normalize-email';
import type { TResult } from '@blog/utils';
import { and, eq } from 'drizzle-orm';

export type TCreatePendingSubscriberResult =
  | { outcome: 'created'; subscriber: TSubscriber }
  | { outcome: 'already-pending'; subscriber: TSubscriber }
  | { outcome: 'already-active'; subscriber: TSubscriber };

// Inserts first and reads only on conflict, so two concurrent signups for one
// new email resolve through the unique constraint instead of one throwing.
export async function createPendingSubscriber(
  tenantId: string,
  email: string,
): Promise<TResult<TCreatePendingSubscriberResult, TErrorCode>> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const [inserted] = await db
    .insert(subscribers)
    .values({ tenantId, email: normalizedEmail })
    .onConflictDoNothing()
    .returning();

  if (inserted) {
    return { ok: true, data: { outcome: 'created', subscriber: inserted } };
  }

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, normalizedEmail),
      ),
    );

  if (!existing) {
    return { ok: false, error: ERROR_CODE.DB_NOT_FOUND };
  }

  if (existing.status === 'active') {
    return {
      ok: true,
      data: { outcome: 'already-active', subscriber: existing },
    };
  }

  return {
    ok: true,
    data: { outcome: 'already-pending', subscriber: existing },
  };
}
