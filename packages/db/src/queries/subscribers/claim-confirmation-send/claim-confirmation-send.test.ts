import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_CONFIRMATION_NOW,
  readTestSubscriber,
} from '@shinefold/db/testing/subscribers/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { isNull } from '@shinefold/utils/primitives';

import { claimConfirmationSend } from './claim-confirmation-send';

vi.mock('@shinefold/db/client');

const COOLDOWN_MS = 15 * 60_000;

const db = useQueryTestDb();
const tenant = useTestTenant(db);

beforeEach(() => {
  vi.useFakeTimers({ now: MOCK_CONFIRMATION_NOW, toFake: ['Date'] });
});

afterEach(async () => {
  vi.useRealTimers();
  await db().delete(schema.subscribers);
});

describe(claimConfirmationSend, () => {
  describe('with a pending subscriber', () => {
    let subscriber: schema.TSubscriber;

    beforeEach(async () => {
      subscriber = await insertTestSubscriber(
        db(),
        tenant().id,
        MOCK_SUBSCRIBER_EMAIL,
      );
    });

    it('claims a pending subscriber never sent a confirmation', async () => {
      const claim = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      const row = await readTestSubscriber(db(), subscriber.id);
      expect(claim?.claimedAt).toEqual(MOCK_CONFIRMATION_NOW);
      expect(row.confirmationSentAt).toEqual(MOCK_CONFIRMATION_NOW);
    });

    it('leaves the stored token hashes untouched', async () => {
      const { id, confirmationTokenHash, unsubscribeTokenHash } = subscriber;

      await claimConfirmationSend(id, COOLDOWN_MS);

      const row = await readTestSubscriber(db(), id);
      expect(row.confirmationTokenHash).toBe(confirmationTokenHash);
      expect(row.unsubscribeTokenHash).toBe(unsubscribeTokenHash);
    });

    it('refuses a second claim inside the cooldown', async () => {
      await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      const second = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      const row = await readTestSubscriber(db(), subscriber.id);
      expect(second).toBeNull();
      expect(row.confirmationSentAt).toEqual(MOCK_CONFIRMATION_NOW);
    });

    it('claims again with a fresh token once the cooldown has passed', async () => {
      const first = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);
      const afterCooldown = new Date(
        MOCK_CONFIRMATION_NOW.getTime() + COOLDOWN_MS + 1,
      );
      vi.setSystemTime(afterCooldown);

      const second = await claimConfirmationSend(subscriber.id, COOLDOWN_MS);

      expect(second?.claimedAt).toEqual(afterCooldown);
      expect(second?.confirmationToken).not.toBe(first?.confirmationToken);
    });

    it('lets exactly one of two concurrent claims through', async () => {
      const results = await Promise.all([
        claimConfirmationSend(subscriber.id, COOLDOWN_MS),
        claimConfirmationSend(subscriber.id, COOLDOWN_MS),
      ]);

      const claims = results.filter((result) => !isNull(result));
      expect(claims).toHaveLength(1);
    });
  });

  it('never claims an active subscriber', async () => {
    const { id } = await insertTestSubscriber(
      db(),
      tenant().id,
      MOCK_SUBSCRIBER_EMAIL,
      {
        status: SUBSCRIBER_STATUS.ACTIVE,
        confirmedAt: MOCK_CONFIRMATION_NOW,
      },
    );

    const claim = await claimConfirmationSend(id, COOLDOWN_MS);

    const row = await readTestSubscriber(db(), id);
    expect(claim).toBeNull();
    expect(row.confirmationSentAt).toBeNull();
  });
});
