import { pinTenant } from '@shinefold/db/queries/pinned-tenants/pin-tenant';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  useAdminRowCleanup,
} from '@shinefold/db/testing/admins/fixtures';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { unpinTenant } from './unpin-tenant';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

useAdminRowCleanup(db);
const tenant = useTestTenant(db);

describe(unpinTenant, () => {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  it('removes the admin and tenant pair', async () => {
    await pinTenant(adminId, tenant().id);

    await unpinTenant(adminId, tenant().id);

    const rows = await db().select().from(schema.pinnedTenants);
    expect(rows).toEqual([]);
  });

  it('resolves when the tenant is not pinned', async () => {
    await expect(unpinTenant(adminId, tenant().id)).resolves.toBeUndefined();
  });

  it('leaves the same tenant pinned by another admin', async () => {
    const { id: otherAdminId } = await insertTestAdmin(db());
    await pinTenant(adminId, tenant().id);
    await pinTenant(otherAdminId, tenant().id);

    await unpinTenant(adminId, tenant().id);

    const rows = await db().select().from(schema.pinnedTenants);
    const adminIds = rows.map((row) => row.adminId);
    expect(adminIds).toEqual([otherAdminId]);
  });

  it("leaves the admin's pin on another tenant", async () => {
    const { id: otherTenantId } = await insertTestTenant(db());
    await pinTenant(adminId, tenant().id);
    await pinTenant(adminId, otherTenantId);

    await unpinTenant(adminId, tenant().id);

    const rows = await db().select().from(schema.pinnedTenants);
    const tenantIds = rows.map((row) => row.tenantId);
    expect(tenantIds).toEqual([otherTenantId]);
  });
});
