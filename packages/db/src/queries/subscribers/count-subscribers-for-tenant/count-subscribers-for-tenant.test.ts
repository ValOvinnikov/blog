import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';

import { countSubscribersForTenant } from './count-subscribers-for-tenant';

vi.mock('@blog/db/client');

faker.seed(5803);

const MOCK_FIRST_EMAIL = faker.internet.email().toLowerCase();
const MOCK_SECOND_EMAIL = faker.internet.email().toLowerCase();

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(countSubscribersForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts every subscriber row for the tenant', async () => {
    await db()
      .insert(schema.subscribers)
      .values([
        { tenantId, email: MOCK_FIRST_EMAIL },
        { tenantId, email: MOCK_SECOND_EMAIL },
      ]);

    const count = await countSubscribersForTenant(tenantId);

    expect(count).toBe(2);
  });

  it("does not count another tenant's subscribers", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: otherTenantId, email: MOCK_FIRST_EMAIL });

    const count = await countSubscribersForTenant(tenantId);

    expect(count).toBe(0);
  });
});
