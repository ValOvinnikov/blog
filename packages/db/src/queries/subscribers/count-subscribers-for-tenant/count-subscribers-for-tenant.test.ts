import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { countSubscribersForTenant } from './count-subscribers-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(countSubscribersForTenant, () => {
  it('counts every subscriber row for the tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values([
        { tenantId, email: 'one@example.com' },
        { tenantId, email: 'two@example.com' },
      ]);

    await expect(countSubscribersForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's subscribers", async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: otherTenantId, email: 'one@example.com' });

    await expect(countSubscribersForTenant(tenantId)).resolves.toBe(0);
  });
});
