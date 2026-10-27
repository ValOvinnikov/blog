import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';

import { getTenantRow } from './get-tenant-row';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantRow, () => {
  it('returns the row for an existing tenant id', async () => {
    const tenant = await insertTestTenant(db());

    const result = await getTenantRow(tenant.id);

    expect(result).toEqual(tenant);
  });

  it('throws for an unknown tenant id', async () => {
    await expect(getTenantRow(MOCK_MISSING_TENANT_ID)).rejects.toThrow(
      `deprovision-tenant: no "tenants" row for id "${MOCK_MISSING_TENANT_ID}".`,
    );
  });
});
