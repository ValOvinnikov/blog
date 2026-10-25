import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { countLeadsForTenant } from './count-leads-for-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(countLeadsForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts every lead for the tenant', async () => {
    await insertTestLead(db(), tenantId);
    await insertTestLead(db(), tenantId);

    await expect(countLeadsForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's leads", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestLead(db(), otherTenantId);

    await expect(countLeadsForTenant(tenantId)).resolves.toBe(0);
  });
});
