import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@blog/db/testing/tenant-suspensions/fixtures';

import { discardTenantSuspension } from './discard-tenant-suspension';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
});

describe(discardTenantSuspension, () => {
  it('removes the case', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id } = await insertTestTenantSuspension(db(), tenantId);

    await discardTenantSuspension(id);

    expect(await db().select().from(schema.tenantSuspensions)).toEqual([]);
  });
});
