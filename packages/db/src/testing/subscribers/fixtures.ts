import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
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
  const [row] = await db
    .select()
    .from(schema.subscribers)
    .where(eq(schema.subscribers.id, id));

  if (!row) {
    throw new Error(`readTestSubscriber: no subscriber "${id}".`);
  }

  return row;
}
