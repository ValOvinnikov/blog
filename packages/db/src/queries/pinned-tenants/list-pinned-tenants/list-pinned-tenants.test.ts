import { faker } from '@faker-js/faker';
import { pinTenant } from '@shinefold/db/queries/pinned-tenants/pin-tenant';
import { archiveTenant } from '@shinefold/db/queries/tenants/archive-tenant';
import { reactivateTenant } from '@shinefold/db/queries/tenants/reactivate-tenant';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  useAdminRowCleanup,
} from '@shinefold/db/testing/admins/fixtures';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_FIRST_NAME,
  MOCK_LAST_NAME,
} from '@shinefold/db/testing/tenants/tenant-list-fixtures';

import { listPinnedTenants } from './list-pinned-tenants';

vi.mock('@shinefold/db/client');

faker.seed(80782);

const MOCK_MIDDLE_NAME = `M ${faker.company.name()}`;
const MOCK_LOWEST_TENANT_ID = faker.string.uuid().replace(/^./, '0');
const MOCK_MIDDLE_TENANT_ID = faker.string.uuid().replace(/^./, '8');
const MOCK_HIGHEST_TENANT_ID = faker.string.uuid().replace(/^./, 'f');

const db = useQueryTestDb();

useAdminRowCleanup(db);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(listPinnedTenants, () => {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  it('returns an empty list when the admin pinned nothing', async () => {
    await insertTestTenant(db());

    await expect(listPinnedTenants(adminId)).resolves.toEqual([]);
  });

  it("returns only the given admin's pinned tenants", async () => {
    const { id: otherAdminId } = await insertTestAdmin(db());
    const { id: ownTenantId } = await insertTestTenant(db());
    const { id: otherTenantId } = await insertTestTenant(db());
    await pinTenant(adminId, ownTenantId);
    await pinTenant(otherAdminId, otherTenantId);

    const rows = await listPinnedTenants(adminId);

    const tenantIds = rows.map((row) => row.id);
    expect(tenantIds).toEqual([ownTenantId]);
  });

  it('orders the pinned tenants by name', async () => {
    await insertTestTenant(db(), {
      id: MOCK_LOWEST_TENANT_ID,
      name: MOCK_MIDDLE_NAME,
    });
    await insertTestTenant(db(), {
      id: MOCK_MIDDLE_TENANT_ID,
      name: MOCK_FIRST_NAME,
    });
    await insertTestTenant(db(), {
      id: MOCK_HIGHEST_TENANT_ID,
      name: MOCK_LAST_NAME,
    });
    await pinTenant(adminId, MOCK_HIGHEST_TENANT_ID);
    await pinTenant(adminId, MOCK_LOWEST_TENANT_ID);
    await pinTenant(adminId, MOCK_MIDDLE_TENANT_ID);

    const rows = await listPinnedTenants(adminId);

    const tenantIds = rows.map((row) => row.id);
    expect(tenantIds).toEqual([
      MOCK_MIDDLE_TENANT_ID,
      MOCK_LOWEST_TENANT_ID,
      MOCK_HIGHEST_TENANT_ID,
    ]);
  });

  describe('with a pinned tenant that gets archived', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db()));
      await pinTenant(adminId, tenantId);
      await archiveTenant(tenantId);
    });

    it('leaves the archived tenant out', async () => {
      await expect(listPinnedTenants(adminId)).resolves.toEqual([]);
    });

    it('lists the tenant again once it is reactivated', async () => {
      await reactivateTenant(tenantId);

      const rows = await listPinnedTenants(adminId);

      const tenantIds = rows.map((row) => row.id);
      expect(tenantIds).toEqual([tenantId]);
    });
  });
});
