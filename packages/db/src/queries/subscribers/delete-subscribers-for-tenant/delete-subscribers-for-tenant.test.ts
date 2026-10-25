import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { deleteSubscribersForTenant } from './delete-subscribers-for-tenant';

vi.mock('@blog/db/client');

const MOCK_FIRST_EMAIL = 'one@example.com';
const MOCK_SECOND_EMAIL = 'two@example.com';

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.subscribers);
  await db().delete(schema.tenants);
});

describe(deleteSubscribersForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes every subscriber row for the tenant and returns the count', async () => {
    await db()
      .insert(schema.subscribers)
      .values([
        { tenantId, email: MOCK_FIRST_EMAIL },
        { tenantId, email: MOCK_SECOND_EMAIL },
      ]);

    await expect(deleteSubscribersForTenant(tenantId)).resolves.toBe(2);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, tenantId));
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's subscribers untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await db()
      .insert(schema.subscribers)
      .values({ tenantId: otherTenantId, email: MOCK_FIRST_EMAIL });

    await deleteSubscribersForTenant(tenantId);

    const rows = await db()
      .select()
      .from(schema.subscribers)
      .where(eq(schema.subscribers.tenantId, otherTenantId));
    expect(rows).toHaveLength(1);
  });

  it('is idempotent — returns 0 when nothing matches', async () => {
    await expect(deleteSubscribersForTenant(tenantId)).resolves.toBe(0);
  });
});
