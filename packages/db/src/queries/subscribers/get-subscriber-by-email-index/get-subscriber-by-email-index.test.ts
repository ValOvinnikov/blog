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

import { getSubscriberByEmailIndex } from './get-subscriber-by-email-index';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);
usePersonalDataKeys();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(getSubscriberByEmailIndex, () => {
  let tenantId: string;
  let otherTenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: otherTenantId } = await insertTestTenant(db()));
    await db()
      .insert(schema.subscribers)
      .values({
        tenantId,
        email: MOCK_SUBSCRIBER_EMAIL,
        emailIndex: testPersonalEmailIndex(MOCK_SUBSCRIBER_EMAIL),
      });
  });

  it("finds the tenant's subscriber by the address's index", async () => {
    await expect(
      getSubscriberByEmailIndex(tenantId, MOCK_SUBSCRIBER_EMAIL.toUpperCase()),
    ).resolves.toMatchObject({ tenantId, email: MOCK_SUBSCRIBER_EMAIL });
  });

  it("does not find another tenant's subscriber", async () => {
    await expect(
      getSubscriberByEmailIndex(otherTenantId, MOCK_SUBSCRIBER_EMAIL),
    ).resolves.toBeUndefined();
  });
});
