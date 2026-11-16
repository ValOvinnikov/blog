import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  insertTestTenant,
} from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@shinefold/db/testing/tenant-suspensions/fixtures';

import { reopenTenantSuspension } from './reopen-tenant-suspension';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(reopenTenantSuspension, () => {
  it('clears who lifted the case and when', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: liftedBy } = await insertTestAdmin(db());
    const { id } = await insertTestTenantSuspension(db(), tenantId, {
      liftedAt: new Date(),
      liftedBy,
    });

    await reopenTenantSuspension(id);

    const [row] = await db().select().from(schema.tenantSuspensions);
    expect(row).toMatchObject({ liftedAt: null, liftedBy: null });
  });
});
