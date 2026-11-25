import { faker } from '@faker-js/faker';
import { ERROR_CODE } from '@shinefold/config/constants';
import { deleteAdmin } from '@shinefold/db/queries/admins/delete-admin';
import { archiveTenant } from '@shinefold/db/queries/tenants/archive-tenant';
import { deleteTenant } from '@shinefold/db/queries/tenants/delete-tenant';
import * as schema from '@shinefold/db/schema';
import {
  insertTestAdmin,
  useAdminRowCleanup,
} from '@shinefold/db/testing/admins/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { errorResult, okResult } from '@shinefold/utils';

import { pinTenant } from './pin-tenant';

vi.mock('@shinefold/db/client');

faker.seed(8078);

const MOCK_MISSING_ADMIN_ID = faker.string.uuid();
const MOCK_NOT_UUID = faker.string.alpha(12);

const db = useQueryTestDb();

useAdminRowCleanup(db);
const tenant = useTestTenant(db);

describe(pinTenant, () => {
  let adminId: string;

  beforeEach(async () => {
    ({ id: adminId } = await insertTestAdmin(db()));
  });

  describe('with the tenant already pinned', () => {
    beforeEach(async () => {
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
      await expect(pinTenant(adminId, tenant().id)).resolves.toEqual(
        okResult(),
      );

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

  it.each([
    ['a tenant id that is not a UUID', MOCK_NOT_UUID, undefined],
    ['an admin id that is not a UUID', undefined, MOCK_NOT_UUID],
    ['a tenant that does not exist', MOCK_MISSING_TENANT_ID, undefined],
    ['an admin that does not exist', undefined, MOCK_MISSING_ADMIN_ID],
  ])(
    'returns DB_NOT_FOUND and stores nothing for %s',
    async (_title, missingTenantId, missingAdminId) => {
      const result = await pinTenant(
        missingAdminId ?? adminId,
        missingTenantId ?? tenant().id,
      );

      const rows = await db().select().from(schema.pinnedTenants);
      expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
      expect(rows).toEqual([]);
    },
  );
});
