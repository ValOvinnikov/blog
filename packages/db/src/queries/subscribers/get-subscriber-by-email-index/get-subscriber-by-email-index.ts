import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { subscribers, type TSubscriber } from '@blog/db/schema/subscribers';
import { requirePersonalEmailIndex } from '@blog/db/utils/personal-data/personal-data';
import { and, eq } from 'drizzle-orm';

export async function getSubscriberByEmailIndex(
  tenantId: string,
  email: string,
): Promise<TMaybeUndefined<TSubscriber>> {
  const [existing] = await getDb()
    .select()
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.emailIndex, requirePersonalEmailIndex(email)),
      ),
    );

  return existing;
}
