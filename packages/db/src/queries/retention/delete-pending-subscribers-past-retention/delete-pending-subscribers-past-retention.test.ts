import {
  PENDING_SUBSCRIBER_RETENTION_DAYS,
  SUBSCRIBER_STATUS,
} from '@blog/db/constants';
import { daysBefore } from '@blog/db/queries/retention/retention-cutoff';
import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_NOW,
} from '@blog/db/testing/retention/fixtures';
import { faker } from '@faker-js/faker';

import { deletePendingSubscribersPastRetention } from './delete-pending-subscribers-past-retention';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const CUTOFF = daysBefore(
  MOCK_RETENTION_NOW,
  PENDING_SUBSCRIBER_RETENTION_DAYS,
);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(deletePendingSubscribersPastRetention, () => {
  let tenantId: string;

  async function insertSubscriber(
    overrides: Partial<typeof schema.subscribers.$inferInsert>,
  ): Promise<string> {
    const { id } = await insertTestSubscriber(
      db(),
      tenantId,
      faker.internet.email().toLowerCase(),
      overrides,
    );
    return id;
  }

  async function remainingIds(): Promise<string[]> {
    const rows = await db()
      .select({ id: schema.subscribers.id })
      .from(schema.subscribers);
    return rows.map(({ id }) => id);
  }

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes a pending subscriber whose last confirmation email is past the period', async () => {
    await insertSubscriber({ confirmationSentAt: justPast(CUTOFF) });

    await expect(
      deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(1);
    expect(await remainingIds()).toEqual([]);
  });

  it('keeps a pending subscriber whose last confirmation email is within the period', async () => {
    const recentId = await insertSubscriber({
      subscribedAt: justPast(CUTOFF),
      confirmationSentAt: justWithin(CUTOFF),
    });

    await expect(
      deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
    expect(await remainingIds()).toEqual([recentId]);
  });

  it('dates a pending subscriber never sent a confirmation from when they subscribed', async () => {
    await insertSubscriber({ subscribedAt: justPast(CUTOFF) });
    const recentId = await insertSubscriber({
      subscribedAt: justWithin(CUTOFF),
    });

    await expect(
      deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(1);
    expect(await remainingIds()).toEqual([recentId]);
  });

  it('never deletes an active subscriber', async () => {
    const activeId = await insertSubscriber({
      status: SUBSCRIBER_STATUS.ACTIVE,
      subscribedAt: justPast(CUTOFF),
      confirmationSentAt: justPast(CUTOFF),
    });

    await expect(
      deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
    expect(await remainingIds()).toEqual([activeId]);
  });

  it('deletes nothing when run a second time', async () => {
    await insertSubscriber({ confirmationSentAt: justPast(CUTOFF) });
    await deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW);

    await expect(
      deletePendingSubscribersPastRetention(MOCK_RETENTION_NOW),
    ).resolves.toBe(0);
  });
});
