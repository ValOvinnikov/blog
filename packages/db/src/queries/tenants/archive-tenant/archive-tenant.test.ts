import { ERROR_CODE } from '@shinefold/config/constants';
import { TENANT_STATUS } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { tenants } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  unwrapOk,
} from '@shinefold/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { archiveTenant } from './archive-tenant';

vi.mock('@shinefold/db/client');

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
      statusBeforeHold: tenant.status,
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

  it('keeps the status a suspended tenant had before its suspension', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      statusBeforeHold: TENANT_STATUS.PAST_DUE,
    });

    const { statusBeforeHold } = unwrapOk(await archiveTenant(tenant.id));

    expect(statusBeforeHold).toBe(TENANT_STATUS.PAST_DUE);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await archiveTenant(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
