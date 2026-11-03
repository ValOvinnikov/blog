import * as schema from '@blog/db/schema';
import { insertTestAdmin, insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@blog/db/testing/tenant-suspensions/fixtures';

import { closeTenantSuspension } from './close-tenant-suspension';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(closeTenantSuspension, () => {
  let tenantId: string;
  let liftedBy: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
    ({ id: liftedBy } = await insertTestAdmin(db()));
  });

  it('stamps who lifted the open case and when', async () => {
    const { reference } = await insertTestTenantSuspension(db(), tenantId);

    const closed = await closeTenantSuspension(tenantId, liftedBy);

    expect(closed).toMatchObject({ reference, liftedBy });
    expect(closed?.liftedAt).toBeInstanceOf(Date);
  });

  it('leaves an already lifted case alone', async () => {
    await insertTestTenantSuspension(db(), tenantId, { liftedAt: new Date() });

    expect(await closeTenantSuspension(tenantId, liftedBy)).toBeUndefined();
  });
});
