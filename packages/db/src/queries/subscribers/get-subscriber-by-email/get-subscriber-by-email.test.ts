import * as schema from '@blog/db/schema';
import {
  insertTestTenant,
  MOCK_SUBSCRIBER_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { insertTestSubscriberRow } from '@blog/db/testing/subscribers/fixtures-confirmation';
import { faker } from '@faker-js/faker';

import { getSubscriberByEmail } from './get-subscriber-by-email';

vi.mock('@blog/db/client');

faker.seed(5805);

const MOCK_UNKNOWN_EMAIL = faker.internet.email().toLowerCase();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getSubscriberByEmail, () => {
  let tenantId: string;
  let otherTenantId: string;
  let subscriber: schema.TSubscriber;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: otherTenantId } = await insertTestTenant(db()));
    subscriber = await insertTestSubscriberRow(db(), {
      tenantId,
      email: MOCK_SUBSCRIBER_EMAIL,
    });
  });

  it('returns the row for an existing email', async () => {
    const result = await getSubscriberByEmail(tenantId, MOCK_SUBSCRIBER_EMAIL);

    expect(result).toEqual(subscriber);
  });

  it('finds the row regardless of casing and surrounding whitespace', async () => {
    const result = await getSubscriberByEmail(
      tenantId,
      `  ${MOCK_SUBSCRIBER_EMAIL.toUpperCase()}  `,
    );

    expect(result).toEqual(subscriber);
  });

  it('returns undefined for an email with no row', async () => {
    const result = await getSubscriberByEmail(tenantId, MOCK_UNKNOWN_EMAIL);

    expect(result).toBeUndefined();
  });

  it("returns undefined for another tenant's row with the same email", async () => {
    const result = await getSubscriberByEmail(
      otherTenantId,
      MOCK_SUBSCRIBER_EMAIL,
    );

    expect(result).toBeUndefined();
  });
});
