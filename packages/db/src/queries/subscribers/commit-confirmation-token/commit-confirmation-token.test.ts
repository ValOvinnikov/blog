import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_CONFIRMATION_NOW,
  readTestSubscriber,
} from '@blog/db/testing/subscribers/fixtures';
import { sha256Hex } from '@blog/utils/hash';
import { faker } from '@faker-js/faker';

import { commitConfirmationToken } from './commit-confirmation-token';

vi.mock('@blog/db/client');

faker.seed(5801);

const MOCK_CONFIRMATION_TOKEN = faker.string.uuid();

const db = useQueryTestDb();
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(commitConfirmationToken, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  describe('with an unconfirmed subscriber', () => {
    let subscriber: schema.TSubscriber;

    beforeEach(async () => {
      subscriber = await insertTestSubscriber(
        db(),
        tenantId,
        MOCK_SUBSCRIBER_EMAIL,
      );
      await commitConfirmationToken(subscriber.id, MOCK_CONFIRMATION_TOKEN);
    });

    it('stores only the hash of the token', async () => {
      const row = await readTestSubscriber(db(), subscriber.id);

      expect(row.confirmationTokenHash).toBe(
        sha256Hex(MOCK_CONFIRMATION_TOKEN),
      );
    });

    it('leaves the unsubscribe token hash untouched', async () => {
      const row = await readTestSubscriber(db(), subscriber.id);

      expect(row.unsubscribeTokenHash).toBe(subscriber.unsubscribeTokenHash);
    });
  });

  it('never changes a subscriber who has confirmed', async () => {
    const subscriber = await insertTestSubscriber(
      db(),
      tenantId,
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
