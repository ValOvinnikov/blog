import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { claimConfirmationSend } from './claim-confirmation-send';

const NO_CLAIM_ERROR = 'expected a claim';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const COOLDOWN_MS = 15 * 60_000;

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(claimConfirmationSend, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  async function insertSubscriber(
    overrides: Partial<typeof schema.subscribers.$inferInsert> = {},
  ): Promise<schema.TSubscriber> {
    const [subscriber] = await db()
      .insert(schema.subscribers)
      .values({ tenantId, email: MOCK_SUBSCRIBER_EMAIL, ...overrides })
      .returning();
    if (!subscriber) throw new Error('failed to seed a subscriber row');
    return subscriber;
  }

  async function readRow(id: string) {
    const [row] = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.id, id));
    if (!row) throw new Error('subscriber row missing');
    return row;
  }

  describe('with a pending subscriber', () => {
    let subscriber: schema.TSubscriber;

    beforeEach(async () => {
      subscriber = await insertSubscriber();
    });

    it('claims a pending subscriber that has never been sent a confirmation', async () => {
      const claim = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      expect(claim?.claimedAt).toBeInstanceOf(Date);
      expect((await readRow(subscriber.id)).confirmationSentAt).toEqual(
        claim?.claimedAt,
      );
    });

    it('leaves the stored token hashes untouched', async () => {
      const { id, confirmationTokenHash, unsubscribeTokenHash } = subscriber;

      const claim = await claimConfirmationSend(id, COOLDOWN_MS);

      expect(claim?.confirmationToken).toBeTypeOf('string');
      const row = await readRow(id);
      expect(row.confirmationTokenHash).toBe(confirmationTokenHash);
      expect(row.unsubscribeTokenHash).toBe(unsubscribeTokenHash);
    });

    it('refuses a second claim inside the cooldown and keeps the first send time', async () => {
      const first = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);
      if (!first) throw new Error(NO_CLAIM_ERROR);

      await expect(
        claimConfirmationSend(subscriber.id, COOLDOWN_MS),
      ).resolves.toBeNull();
      expect((await readRow(subscriber.id)).confirmationSentAt).toEqual(
        first.claimedAt,
      );
    });

    it('claims again with a fresh token once the last send is older than the cooldown', async () => {
      const first = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);
      await db()
        .update(schema.subscribers)
        .set({ confirmationSentAt: new Date(Date.now() - COOLDOWN_MS - 1000) })
        .where(eq(schema.subscribers.id, subscriber.id));

      const second = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      expect(second?.claimedAt).toBeInstanceOf(Date);
      expect(second?.confirmationToken).not.toBe(first?.confirmationToken);
    });

    it('lets exactly one of two concurrent claims through', async () => {
      const results = await Promise.all([
        claimConfirmationSend(subscriber.id, COOLDOWN_MS),
        claimConfirmationSend(subscriber.id, COOLDOWN_MS),
      ]);

      expect(results.filter((result) => result !== null)).toHaveLength(1);
    });
  });

  it('never claims an active subscriber', async () => {
    const { id } = await insertSubscriber({
      status: SUBSCRIBER_STATUS.ACTIVE,
      confirmedAt: new Date(),
    });

    await expect(claimConfirmationSend(id, COOLDOWN_MS)).resolves.toBeNull();
    expect((await readRow(id)).confirmationSentAt).toBeNull();
  });
});
