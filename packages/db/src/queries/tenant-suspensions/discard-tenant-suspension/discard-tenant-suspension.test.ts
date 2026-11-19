import * as schema from '@shinefold/db/schema';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@shinefold/db/testing/tenant-suspensions/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { discardTenantSuspension } from './discard-tenant-suspension';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
});

describe(discardTenantSuspension, () => {
  it('removes the case', async () => {
    const { id } = await insertTestTenantSuspension(db(), tenant().id);

    await discardTenantSuspension(id);

    expect(await db().select().from(schema.tenantSuspensions)).toEqual([]);
  });
});
