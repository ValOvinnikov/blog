import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants, type TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { setTenantProvisioningStatus } from './set-tenant-provisioning-status';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantProvisioningStatus, () => {
  describe('a PROVISIONING tenant', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db(), {
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      });
    });

    it.each([TENANT_PROVISIONING_STATUS.PENDING, null])(
      'reverts it to %s, leaving every other column untouched',
      async (provisioningStatus) => {
        const reverted = { ...tenant, provisioningStatus, updatedAt: MOCK_NOW };

        const result = await setTenantProvisioningStatus(
          tenant.id,
          provisioningStatus,
        );

        const [row] = await db()
          .select()
          .from(tenants)
          .where(eq(tenants.id, tenant.id));
        expect(result).toEqual({ ok: true, data: reverted });
        expect(row).toEqual(reverted);
      },
    );
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await setTenantProvisioningStatus(
      MOCK_MISSING_TENANT_ID,
      TENANT_PROVISIONING_STATUS.PENDING,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
