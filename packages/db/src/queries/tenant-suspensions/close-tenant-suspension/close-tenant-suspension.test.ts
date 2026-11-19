import * as schema from '@shinefold/db/schema';
import { insertTestAdmin } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@shinefold/db/testing/tenant-suspensions/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { closeTenantSuspension } from './close-tenant-suspension';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(closeTenantSuspension, () => {
  let liftedBy: string;

  beforeEach(async () => {
    ({ id: liftedBy } = await insertTestAdmin(db()));
  });

  it('stamps who lifted the open case and when', async () => {
    const { reference } = await insertTestTenantSuspension(db(), tenant().id);

    const closed = await closeTenantSuspension(tenant().id, liftedBy);

    expect(closed).toMatchObject({ reference, liftedBy });
    expect(closed?.liftedAt).toBeInstanceOf(Date);
  });

  it('leaves an already lifted case alone', async () => {
    await insertTestTenantSuspension(db(), tenant().id, {
      liftedAt: new Date(),
    });

    expect(await closeTenantSuspension(tenant().id, liftedBy)).toBeUndefined();
  });
});
