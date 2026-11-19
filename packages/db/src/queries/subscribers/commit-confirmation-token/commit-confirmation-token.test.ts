import { faker } from '@faker-js/faker';
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
import { sha256Hex } from '@shinefold/utils/hash';

import { commitConfirmationToken } from './commit-confirmation-token';

vi.mock('@shinefold/db/client');

faker.seed(5801);

const MOCK_CONFIRMATION_TOKEN = faker.string.uuid();

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
});

describe(commitConfirmationToken, () => {
  describe('with an unconfirmed subscriber', () => {
    let subscriber: schema.TSubscriber;
    let row: schema.TSubscriber;

    beforeEach(async () => {
      subscriber = await insertTestSubscriber(
        db(),
        tenant().id,
        MOCK_SUBSCRIBER_EMAIL,
      );
      await commitConfirmationToken(subscriber.id, MOCK_CONFIRMATION_TOKEN);
      row = await readTestSubscriber(db(), subscriber.id);
    });

    it('stores only the hash of the token', () => {
      expect(row.confirmationTokenHash).toBe(
        sha256Hex(MOCK_CONFIRMATION_TOKEN),
      );
    });

    it('leaves the unsubscribe token hash untouched', () => {
      expect(row.unsubscribeTokenHash).toBe(subscriber.unsubscribeTokenHash);
    });
  });

  it('never changes a subscriber who has confirmed', async () => {
    const subscriber = await insertTestSubscriber(
      db(),
      tenant().id,
      MOCK_SUBSCRIBER_EMAIL,
      {
        confirmedAt: MOCK_CONFIRMATION_NOW,
      },
    );

    await commitConfirmationToken(subscriber.id, MOCK_CONFIRMATION_TOKEN);

    const row = await readTestSubscriber(db(), subscriber.id);
    expect(row).toEqual(subscriber);
  });
});
