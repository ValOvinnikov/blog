import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { archiveTenant } from './archive-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(archiveTenant, () => {
  it('stamps the tenant deprovisioned and ARCHIVED, returning the updated row', async () => {
    const tenant = await insertTestTenant(db());
    const archived = {
      ...tenant,
      deprovisionedAt: MOCK_NOW,
      status: TENANT_STATUS.ARCHIVED,
      updatedAt: MOCK_NOW,
    };

    const result = await archiveTenant(tenant.id);

    const [row] = await db()
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenant.id));
    expect(result).toEqual({ ok: true, data: archived });
    expect(row).toEqual(archived);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await archiveTenant(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
