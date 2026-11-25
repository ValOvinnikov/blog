import { deleteAdmin } from '@shinefold/db/queries/admins/delete-admin';
import { archiveTenant } from '@shinefold/db/queries/tenants/archive-tenant';
import { deleteTenant } from '@shinefold/db/queries/tenants/delete-tenant';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  useAdminRowCleanup,
} from '@shinefold/db/testing/admins/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { pinTenant } from './pin-tenant';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

useAdminRowCleanup(db);
const tenant = useTestTenant(db);

describe(pinTenant, () => {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
    await pinTenant(adminId, tenant().id);
  });

  it('stores the admin and tenant pair', async () => {
    const rows = await db().select().from(schema.pinnedTenants);
    const pairs = rows.map((row) => ({
      adminId: row.adminId,
      tenantId: row.tenantId,
    }));
    expect(pairs).toEqual([{ adminId, tenantId: tenant().id }]);
  });

  it('keeps a single pair when the tenant is pinned again', async () => {
    await expect(pinTenant(adminId, tenant().id)).resolves.toBeUndefined();

    const rows = await db().select().from(schema.pinnedTenants);
    expect(rows).toHaveLength(1);
  });

  it('removes the pin with the admin', async () => {
    await deleteAdmin(adminId);

    const rows = await db().select().from(schema.pinnedTenants);
    expect(rows).toEqual([]);
  });

  it('removes the pin with the tenant', async () => {
    await archiveTenant(tenant().id);
    await deleteTenant(tenant().id);

    const rows = await db().select().from(schema.pinnedTenants);
    expect(rows).toEqual([]);
  });
});
