import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import type { TTestDb } from '@shinefold/db/testing/fixtures';
import { eq } from 'drizzle-orm';

export const MOCK_CONFIRMATION_NOW = new Date('2026-10-23T09:00:00Z');

export const MOCK_ACTIVE_SUBSCRIBER = {
  status: SUBSCRIBER_STATUS.ACTIVE,
} as const;

export async function readSubscriberIds(db: TTestDb): Promise<string[]> {
  const rows = await db.select().from(schema.subscribers);
  return rows.map(({ id }) => id).sort();
}

export async function readTestSubscriber(
  db: TTestDb,
  id: string,
): Promise<schema.TSubscriber> {
  return firstRowOrThrow(
    await db
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, id)),
    `readTestSubscriber("${id}")`,
  );
}
