import * as schema from '@blog/db/schema';
import { insertTestLead, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { deleteLead } from './delete-lead';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.leads);
  await db().delete(schema.tenants);
});

describe(deleteLead, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('deletes the lead and reports that a row was removed', async () => {
    const { id } = await insertTestLead(db(), tenantId);

    const removed = await deleteLead({ tenantId, id });

    expect(removed).toBe(true);
    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(0);
  });

  it('reports false when no lead has that id', async () => {
    const removed = await deleteLead({
      tenantId,
      id: '00000000-0000-0000-0000-000000000000',
    });

    expect(removed).toBe(false);
  });

  it("never deletes another tenant's lead", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    const { id } = await insertTestLead(db(), otherTenantId);

    const removed = await deleteLead({ tenantId, id });

    expect(removed).toBe(false);
    const rows = await db().select().from(schema.leads);
    expect(rows).toHaveLength(1);
  });
});
