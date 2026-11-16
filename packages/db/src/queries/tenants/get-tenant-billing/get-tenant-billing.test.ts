import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_EMPTY_TENANT_BILLING,
  mockTenantBilling,
} from '@shinefold/db/testing/tenants/billing';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { getTenantBilling } from './get-tenant-billing';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

describe(getTenantBilling, () => {
  describe('a tenant with no billing recorded', () => {
    const tenant = useTestTenant(db);

    it('reads every field as undefined', async () => {
      const result = await getTenantBilling(tenant().id);

      expect(result).toEqual(MOCK_EMPTY_TENANT_BILLING);
    });
  });

  describe('a tenant with billing stored', () => {
    const billing = mockTenantBilling();
    const tenant = useTestTenant(db, billing);

    it('reads the stored billing', async () => {
      const result = await getTenantBilling(tenant().id);

      expect(result).toEqual(billing);
    });
  });

  it('returns undefined for a tenant id that does not exist', async () => {
    const result = await getTenantBilling(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
