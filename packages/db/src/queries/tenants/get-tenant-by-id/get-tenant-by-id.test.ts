import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import type { TTenant } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DEPROVISIONED_AT,
  MOCK_MISSING_TENANT_ID,
} from '@blog/db/testing/tenants/fixtures';

import { getTenantById } from './get-tenant-by-id';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantById, () => {
  it('returns the row for an existing id', async () => {
    const tenant = await insertTestTenant(db());

    const result = await getTenantById(tenant.id);

    expect(result).toEqual(tenant);
  });

  describe('a deprovisioned tenant', () => {
    let tenant: TTenant;

    beforeEach(async () => {
      tenant = await insertTestTenant(db(), {
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_DEPROVISIONED_AT,
      });
    });

    it('excludes a deprovisioned tenant by default', async () => {
      const result = await getTenantById(tenant.id);

      expect(result).toBeUndefined();
    });

    it('returns a deprovisioned tenant when includeArchived is true', async () => {
      const result = await getTenantById(tenant.id, { includeArchived: true });

      expect(result).toEqual(tenant);
    });
  });

  it('returns undefined for an id with no row', async () => {
    const result = await getTenantById(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
