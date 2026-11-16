import { SUBSCRIBER_OUTCOME } from '@shinefold/config';
import { SUBSCRIBER_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { toOutcome } from '@shinefold/utils/to-outcome';

import { getSubscriptionStatus } from './get-subscription-status';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
  await db().delete(schema.users);
});

describe(getSubscriptionStatus, () => {
  let userId: string;
  let tenantId: string;

  beforeEach(async () => {
    ({ id: userId } = await insertTestReader(db(), MOCK_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it.each(Object.values(SUBSCRIBER_STATUS))(
    "returns the account's %s subscription",
    async (status) => {
      await insertTestSubscriber(db(), tenantId, MOCK_SUBSCRIBER_EMAIL, {
        status,
      });

      const result = await getSubscriptionStatus(tenantId, userId);

      expect(result).toEqual(toOutcome(status));
    },
  );

  it('returns not-subscribed when the account has no subscription', async () => {
    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED));
  });
});
