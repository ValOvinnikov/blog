import * as schema from '@blog/db/schema';
import {
  insertTestLead,
  insertTestTenant,
  MOCK_LEAD_READ_AT,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { countUnreadLeadsForTenant } from './count-unread-leads-for-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(countUnreadLeadsForTenant, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('counts only the unread leads for the tenant', async () => {
    await insertTestLead(db(), tenantId);
    await insertTestLead(db(), tenantId);
    await insertTestLead(db(), tenantId, { readAt: MOCK_LEAD_READ_AT });

    await expect(countUnreadLeadsForTenant(tenantId)).resolves.toBe(2);
  });

  it("does not count another tenant's unread leads", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await insertTestLead(db(), otherTenantId);

    await expect(countUnreadLeadsForTenant(tenantId)).resolves.toBe(0);
  });
});
