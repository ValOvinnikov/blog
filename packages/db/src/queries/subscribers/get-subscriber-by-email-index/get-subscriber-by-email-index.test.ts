import * as schema from '@shinefold/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';

import { getSubscriberByEmailIndex } from './get-subscriber-by-email-index';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getSubscriberByEmailIndex, () => {
  let tenantId: string;
  let otherTenantId: string;
  let subscriber: schema.TSubscriber;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: otherTenantId } = await insertTestTenant(db()));
    subscriber = await insertTestSubscriber(
      db(),
      tenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );
  });

  it("finds the tenant's subscriber by the address's index", async () => {
    const result = await getSubscriberByEmailIndex(
      tenantId,
      MOCK_SUBSCRIBER_EMAIL.toUpperCase(),
    );

    expect(result).toEqual(subscriber);
  });

  it("does not find another tenant's subscriber", async () => {
    const result = await getSubscriberByEmailIndex(
      otherTenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toBeUndefined();
  });
});
