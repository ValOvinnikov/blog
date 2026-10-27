import * as schema from '@blog/db/schema';
import type { TTestDb } from '@blog/db/testing/fixtures';
import { eq } from 'drizzle-orm';

export const MOCK_CONFIRMATION_NOW = new Date('2026-10-23T09:00:00Z');

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
