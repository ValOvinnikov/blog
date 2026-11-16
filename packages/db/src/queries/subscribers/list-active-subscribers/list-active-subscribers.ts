import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { decryptPersonalValueOrUndefined } from '@shinefold/db/utils/personal-data/personal-data';
import { isUndefined } from '@shinefold/utils/primitives';
import { and, asc, eq, gt } from 'drizzle-orm';

export interface IActiveSubscriber {
  id: string;
  email: TMaybeUndefined<string>;
}

export async function listActiveSubscribers(
  tenantId: string,
  pageSize: number,
  afterId: TMaybeUndefined<string>,
): Promise<IActiveSubscriber[]> {
  const rows = await getDb()
    .select({ id: subscribers.id, emailEncrypted: subscribers.emailEncrypted })
    .from(subscribers)
    .where(
      and(
        eq(subscribers.tenantId, tenantId),
        eq(subscribers.status, SUBSCRIBER_STATUS.ACTIVE),
        isUndefined(afterId) ? undefined : gt(subscribers.id, afterId),
      ),
    )
    .orderBy(asc(subscribers.id))
    .limit(pageSize);

  return rows.map(({ id, emailEncrypted }) => ({
    id,
    email: decryptPersonalValueOrUndefined(emailEncrypted),
  }));
}
