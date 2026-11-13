import type { TMaybeUndefined } from '@blog/config/types';
import { getDb } from '@blog/db/client';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import { subscribers } from '@blog/db/schema/subscribers';
import { decryptPersonalValueOrUndefined } from '@blog/db/utils/personal-data/personal-data';
import { isUndefined } from '@blog/utils/primitives';
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
