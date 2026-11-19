import { faker } from '@faker-js/faker';
import {
  PENDING_SUBSCRIBER_RETENTION_DAYS,
  SUBSCRIBER_STATUS,
} from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { insertTestSubscriber } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  justPast,
  justWithin,
  MOCK_RETENTION_LIMIT,
  MOCK_RETENTION_NOW,
} from '@shinefold/db/testing/retention/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { daysBefore } from '@shinefold/db/utils/day-offset/day-offset';

import { deletePendingSubscribersPastRetention } from './delete-pending-subscribers-past-retention';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

faker.seed(6022);

const CUTOFF = daysBefore(
  MOCK_RETENTION_NOW,
  PENDING_SUBSCRIBER_RETENTION_DAYS,
);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(deletePendingSubscribersPastRetention, () => {
  async function insertSubscriber(
    overrides: Partial<typeof schema.subscribers.$inferInsert>,
  ): Promise<string> {
    const { id } = await insertTestSubscriber(
      db(),
      tenant().id,
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

  it('keeps a pending subscriber whose confirmation email is within the period', async () => {
    const recentId = await insertSubscriber({
      subscribedAt: justPast(CUTOFF),
      confirmationSentAt: justWithin(CUTOFF),
    });

    const deleted = await deletePendingSubscribersPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(0);
    expect(remaining).toEqual([recentId]);
  });

  it('falls back to the subscribe date when no confirmation email was sent', async () => {
    await insertSubscriber({ subscribedAt: justPast(CUTOFF) });
    const recentId = await insertSubscriber({
      subscribedAt: justWithin(CUTOFF),
    });

    const deleted = await deletePendingSubscribersPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(1);
    expect(remaining).toEqual([recentId]);
  });

  it('never deletes an active subscriber', async () => {
    const activeId = await insertSubscriber({
      status: SUBSCRIBER_STATUS.ACTIVE,
      subscribedAt: justPast(CUTOFF),
      confirmationSentAt: justPast(CUTOFF),
    });

    const deleted = await deletePendingSubscribersPastRetention(
      MOCK_RETENTION_NOW,
      MOCK_RETENTION_LIMIT,
    );
    const remaining = await remainingIds();

    expect(deleted).toBe(0);
    expect(remaining).toEqual([activeId]);
  });

  describe('with a pending subscriber past the period', () => {
    beforeEach(async () => {
      await insertSubscriber({ confirmationSentAt: justPast(CUTOFF) });
    });

    it('deletes a pending subscriber whose confirmation email is past the period', async () => {
      const deleted = await deletePendingSubscribersPastRetention(
        MOCK_RETENTION_NOW,
        MOCK_RETENTION_LIMIT,
      );
      const remaining = await remainingIds();

      expect(deleted).toBe(1);
      expect(remaining).toEqual([]);
    });

    it('deletes at most the given number of subscribers per call', async () => {
      await insertSubscriber({ confirmationSentAt: justPast(CUTOFF) });

      const deleted = await deletePendingSubscribersPastRetention(
        MOCK_RETENTION_NOW,
        1,
      );
      const remaining = await remainingIds();

      expect(deleted).toBe(1);
      expect(remaining).toHaveLength(1);
    });

    it('deletes nothing when run a second time', async () => {
      await deletePendingSubscribersPastRetention(
        MOCK_RETENTION_NOW,
        MOCK_RETENTION_LIMIT,
      );

      await expect(
        deletePendingSubscribersPastRetention(
          MOCK_RETENTION_NOW,
          MOCK_RETENTION_LIMIT,
        ),
      ).resolves.toBe(0);
    });
  });
});
