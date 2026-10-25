import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { deleteLeadsForTenant } from './delete-leads-for-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(deleteLeadsForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes every lead for the tenant and returns the count', async () => {
    await insertTestLead(db(), tenantId);
    await insertTestLead(db(), tenantId);

    await expect(deleteLeadsForTenant(tenantId)).resolves.toBe(2);

    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(0);
  });

  it("leaves another tenant's leads untouched", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestLead(db(), otherTenantId);

    await expect(deleteLeadsForTenant(tenantId)).resolves.toBe(0);

    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(1);
  });
});
