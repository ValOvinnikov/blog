import * as schema from '@blog/db/schema';
import {
  insertTestSubscriber,
  insertTestTenant,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { deleteSubscribersForTenant } from './delete-subscribers-for-tenant';

vi.mock('@blog/db/client');

faker.seed(5804);

const MOCK_FIRST_EMAIL = faker.internet.email().toLowerCase();
const MOCK_SECOND_EMAIL = faker.internet.email().toLowerCase();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(deleteSubscribersForTenant, () => {
  let tenantId: string;

  async function readTenantSubscribers(
    forTenantId: string,
  ): Promise<schema.TSubscriber[]> {
    return db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, forTenantId));
  }

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes every subscriber row for the tenant and returns the count', async () => {
    await insertTestSubscriber(db(), tenantId, MOCK_FIRST_EMAIL);
    await insertTestSubscriber(db(), tenantId, MOCK_SECOND_EMAIL);

    const deleted = await deleteSubscribersForTenant(tenantId);

    const rows = await readTenantSubscribers(tenantId);
    expect(deleted).toBe(2);
    expect(rows).toEqual([]);
  });

  it("leaves another tenant's subscribers untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestSubscriber(db(), otherTenantId, MOCK_FIRST_EMAIL);

    await deleteSubscribersForTenant(tenantId);

    const rows = await readTenantSubscribers(otherTenantId);
    expect(rows).toHaveLength(1);
  });

  it('returns 0 when the tenant has no subscribers', async () => {
    const deleted = await deleteSubscribersForTenant(tenantId);

    expect(deleted).toBe(0);
  });
});
