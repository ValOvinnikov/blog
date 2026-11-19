import { ERROR_CODE } from '@shinefold/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@shinefold/db/constants';
import { tenants } from '@shinefold/db/schema/tenants';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import { setTenantProvisioningStatus } from './set-tenant-provisioning-status';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
useFrozenClock();

describe(setTenantProvisioningStatus, () => {
  describe('a PROVISIONING tenant', () => {
    const tenant = useTestTenant(db, {
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
    });

    it.each([TENANT_PROVISIONING_STATUS.PENDING, null])(
      'reverts it to %s, leaving every other column untouched',
      async (provisioningStatus) => {
        const reverted = {
          ...tenant(),
          provisioningStatus,
          updatedAt: MOCK_NOW,
        };

        const result = await setTenantProvisioningStatus(
          tenant().id,
          provisioningStatus,
        );

        const [row] = await db()
          .select()
          .from(tenants)
          .where(eq(tenants.id, tenant().id));
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
