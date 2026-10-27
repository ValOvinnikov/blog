import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import {
  testPersonalEmailIndex,
  usePersonalDataKeys,
} from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { insertTestSubscriberRow } from '@blog/db/testing/subscribers/fixtures-confirmation';

import { getSubscriberByEmailIndex } from './get-subscriber-by-email-index';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
usePersonalDataKeys();

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
    subscriber = await insertTestSubscriberRow(db(), {
      tenantId,
      email: MOCK_SUBSCRIBER_EMAIL,
      emailIndex: testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
    });
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
