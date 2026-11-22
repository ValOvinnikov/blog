import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  confirmedSubscriberColumns,
  isConfirmedSubscriberOf,
  NEWEST_CONFIRMED_FIRST,
  toConfirmedSubscribers,
  type TConfirmedSubscriber,
} from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { hasLength } from '@shinefold/utils/primitives';
import { and, sql } from 'drizzle-orm';

const SUBSCRIBER_EXPORT_BATCH_SIZE = 1000;

export type TExportedSubscriber = Omit<TConfirmedSubscriber, 'id'>;

async function readBatch(
  tenantId: string,
  batchSize: number,
  after: TMaybeUndefined<TConfirmedSubscriber>,
): Promise<TConfirmedSubscriber[]> {
  const rows = await getDb()
    .select(confirmedSubscriberColumns)
    .from(subscribers)
    .where(
      and(
        isConfirmedSubscriberOf(tenantId),
        after
          ? sql`(${subscribers.confirmedAt}, ${subscribers.id}) < (${after.confirmedAt.toISOString()}::timestamp, ${after.id})`
          : undefined,
      ),
    )
    .orderBy(...NEWEST_CONFIRMED_FIRST)
    .limit(batchSize);

  return toConfirmedSubscribers(rows);
}

export async function listSubscribersForExport(
  tenantId: string,
  batchSize = SUBSCRIBER_EXPORT_BATCH_SIZE,
): Promise<TExportedSubscriber[]> {
  const exported: TExportedSubscriber[] = [];
  let batch = await readBatch(tenantId, batchSize, undefined);
  while (hasLength(batch)) {
    exported.push(
      ...batch.map(({ email, confirmedAt }) => ({ email, confirmedAt })),
    );
    batch =
      batch.length < batchSize
        ? []
        : await readBatch(tenantId, batchSize, batch.at(-1));
  }
  return exported;
}
