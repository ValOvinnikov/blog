import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import type { TConfirmedSubscriber } from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import * as schema from '@shinefold/db/schema';
import { firstRowOrThrow } from '@shinefold/db/testing/first-row-or-throw';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  type TTestDb,
} from '@shinefold/db/testing/fixtures';
import { MOCK_NOW } from '@shinefold/db/testing/frozen-clock';
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

function mockConfirmedSubscriber(confirmedAt: Date) {
  return { status: SUBSCRIBER_STATUS.ACTIVE, confirmedAt };
}

export async function insertTestConfirmedSubscribers(
  db: TTestDb,
  tenantId: string,
  subscribers: { email: string; confirmedAt: Date }[],
): Promise<TConfirmedSubscriber[]> {
  const confirmed = await Promise.all(
    subscribers.map(async ({ email, confirmedAt }) => {
      const { id } = await insertTestSubscriber(
        db,
        tenantId,
        email,
        mockConfirmedSubscriber(confirmedAt),
      );
      return { id, email, confirmedAt };
    }),
  );
  const { id: otherTenantId } = await insertTestTenant(db);
  await insertTestSubscriber(
    db,
    otherTenantId,
    MOCK_SUBSCRIBER_EMAIL,
    mockConfirmedSubscriber(MOCK_NOW),
  );
  return confirmed;
}
