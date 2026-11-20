import { getDb } from '@shinefold/db/client';
import {
  confirmedSubscriberColumns,
  isConfirmedSubscriberOf,
  NEWEST_CONFIRMED_FIRST,
  toConfirmedSubscribers,
  type TConfirmedSubscriber,
} from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import { subscribers } from '@shinefold/db/schema/subscribers';
import { count } from 'drizzle-orm';

export type TSubscribersPageRequest = {
  page: number;
  pageSize: number;
};

export type TSubscribersPage = {
  rows: TConfirmedSubscriber[];
  total: number;
};

export async function listSubscribersPage(
  tenantId: string,
  { page, pageSize }: TSubscribersPageRequest,
): Promise<TSubscribersPage> {
  const db = getDb();
  const isConfirmed = isConfirmedSubscriberOf(tenantId);

  const [rows, [totalRow]] = await Promise.all([
    db
      .select(confirmedSubscriberColumns)
      .from(subscribers)
      .where(isConfirmed)
      .orderBy(...NEWEST_CONFIRMED_FIRST)
      .limit(pageSize)
      .offset(Math.max(page - 1, 0) * pageSize),
    db.select({ total: count() }).from(subscribers).where(isConfirmed),
  ]);

  return {
    rows: toConfirmedSubscribers(rows),
    total: totalRow?.total ?? 0,
  };
}
