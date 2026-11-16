import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  subscribers,
  type TSubscriber,
} from '@shinefold/db/schema/subscribers';
import { requireEmailIndex } from '@shinefold/db/utils/personal-data/personal-data';
import { personalDataIndex } from '@shinefold/utils/encryption';
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
        eq(subscribers.emailIndex, requireEmailIndex(email, personalDataIndex)),
      ),
    );

  return existing;
}
