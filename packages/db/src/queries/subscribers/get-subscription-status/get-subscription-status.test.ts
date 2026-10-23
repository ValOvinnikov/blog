import * as schema from '@blog/db/schema';
import {
  insertTestReader,
  insertTestSubscriber,
  insertTestTenant,
  TEST_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { usePersonalDataKeys } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { toOutcome } from '@blog/utils/to-outcome';

import { getSubscriptionStatus } from './get-subscription-status';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
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
    ({ id: userId } = await insertTestReader(db(), TEST_SUBSCRIBER_EMAIL));
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it.each(['active', 'pending'] as const)(
    "returns the account's %s subscription",
    async (status) => {
      await insertTestSubscriber(db(), tenantId, TEST_SUBSCRIBER_EMAIL, {
        status,
      });

      const result = await getSubscriptionStatus(tenantId, userId);

      expect(result).toEqual(toOutcome(status));
    },
  );

  it('returns not-subscribed when the account has no subscription', async () => {
    const result = await getSubscriptionStatus(tenantId, userId);

    expect(result).toEqual(toOutcome('not-subscribed'));
  });
});
