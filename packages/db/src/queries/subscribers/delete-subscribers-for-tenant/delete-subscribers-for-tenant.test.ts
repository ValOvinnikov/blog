import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { deleteSubscribersForTenant } from './delete-subscribers-for-tenant';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(deleteSubscribersForTenant, () => {
  it('deletes every subscriber row for the tenant and returns the count', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values([
        { tenantId, email: 'one@example.com' },
        { tenantId, email: 'two@example.com' },
      ]);

    await expect(deleteSubscribersForTenant(tenantId)).resolves.toBe(2);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, tenantId));
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's subscribers untouched", async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: otherTenantId, email: 'one@example.com' });

    await deleteSubscribersForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, otherTenantId));
    expect(rows).toHaveLength(1);
  });

  it('is idempotent — returns 0 when nothing matches', async () => {
    const { id: tenantId } = await insertTestTenant(db());

    await expect(deleteSubscribersForTenant(tenantId)).resolves.toBe(0);
  });
});
