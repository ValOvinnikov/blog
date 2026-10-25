import { SUBSCRIBER_OUTCOME } from '@blog/config';
import { SUBSCRIBER_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
  storeLegacySubscriberStatus,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';

import { getSubscriptionStatus } from './get-subscription-status';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

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

  it.each(Object.values(SUBSCRIBER_STATUS))(
    'reads a %s subscription still stored lowercase as the same status',
    async (status) => {
      const { id } = await insertTestSubscriber(
        db(),
        tenantId,
        MOCK_SUBSCRIBER_EMAIL,
        { status },
      );
      await storeLegacySubscriberStatus(db(), id);

      const result = await getSubscriptionStatus(tenantId, userId);

      expect(result).toEqual(toOutcome(status));
    },
  );

  it('returns not-subscribed when the account has no subscription', async () => {
    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual(toOutcome(SUBSCRIBER_OUTCOME.NOT_SUBSCRIBED));
  });
});
