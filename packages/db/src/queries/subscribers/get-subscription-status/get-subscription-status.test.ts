import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { getSubscriptionStatus } from './get-subscription-status';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.users);
});

describe(getSubscriptionStatus, () => {
  let userId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
  });

  it.each(Object.values(SUBSCRIBER_STATUS))(
    "returns the account's %s subscription",
    async (status) => {
      await insertTestSubscriber(db(), tenant().id, MOCK_SUBSCRIBER_EMAIL, {
        status,
      });

      const result = await getSubscriptionStatus(tenant().id, userId);

      expect(result).toEqual(toOutcome(status));
    },
  );

  it('returns not-subscribed when the account has no subscription', async () => {
    const result = await getSubscriptionStatus(tenant().id, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED));
  });
});
