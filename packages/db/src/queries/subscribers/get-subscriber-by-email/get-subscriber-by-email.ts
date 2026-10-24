import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { normalizeEmail } from '@blog/utils/normalize-email-identity';
import { and, eq } from 'drizzle-orm';

export async function getSubscriberByEmail(
  tenantId: string,
  email: string,
): Promise<TMaybeUndefined<TSubscriber>> {
  const db = getDb();
  const normalizedEmail = normalizeEmail(email);

  const [existing] = await db
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.email, normalizedEmail),
      ),
    );

  return existing;
}
