import { userPersonalColumns } from '@blog/db/queries/users/user-personal-data/user-personal-data';
import * as schema from '@blog/db/schema';
import {
  insertTestAdmin,
  insertTestTenant,
  MOCK_OPERATOR_EMAIL,
} from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { insertTestTenantSuspension } from '@blog/db/testing/tenant-suspensions/fixtures';

import { getOpenTenantSuspension } from './get-open-tenant-suspension';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenantSuspensions);
  await db().delete(schema.tenants);
  await db().delete(schema.admins);
  await db().delete(schema.users);
});

describe(getOpenTenantSuspension, () => {
  it('returns the open case with the suspending admin email', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const { id: suspendedBy } = await insertTestAdmin(
      db(),
      userPersonalColumns({ email: MOCK_OPERATOR_EMAIL }),
    );
    const { reference } = await insertTestTenantSuspension(db(), tenantId, {
      suspendedBy,
    });

    expect(await getOpenTenantSuspension(tenantId)).toMatchObject({
      reference,
      suspendedByEmail: MOCK_OPERATOR_EMAIL,
    });
  });

  it('returns nothing once the case is lifted', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    await insertTestTenantSuspension(db(), tenantId, { liftedAt: new Date() });

    expect(await getOpenTenantSuspension(tenantId)).toBeUndefined();
  });

  it('returns nothing for another tenant', async () => {
    const { id: tenantId } = await insertTestTenant(db());
    const other = await insertTestTenant(db());
    await insertTestTenantSuspension(db(), other.id);

    expect(await getOpenTenantSuspension(tenantId)).toBeUndefined();
  });
});
