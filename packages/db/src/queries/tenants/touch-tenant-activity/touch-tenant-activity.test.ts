import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { touchTenantActivity } from './touch-tenant-activity';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const LAST_ACTIVITY_AT = new Date('2026-01-01T00:00:00.000Z');
const TOUCHED_AT = new Date('2026-02-01T00:00:00.000Z');
const EXPECTED_OK = 'expected ok:true';
const MISSING_TENANT_ID = '00000000-0000-0000-0000-000000000000';

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(touchTenantActivity, () => {
  it('moves last activity forward and clears the warning and deletion-notice stamps', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      lastActivityAt: LAST_ACTIVITY_AT,
      inactivityWarnedAt: LAST_ACTIVITY_AT,
      suspendedAt: LAST_ACTIVITY_AT,
      deletionNotifiedAt: LAST_ACTIVITY_AT,
    });

    const result = await touchTenantActivity(tenant.id, TOUCHED_AT);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.lastActivityAt).toEqual(TOUCHED_AT);
    expect(result.data.inactivityWarnedAt).toBeNull();
    expect(result.data.deletionNotifiedAt).toBeNull();
    expect(result.data.suspendedAt).toEqual(LAST_ACTIVITY_AT);
  });

  it('never moves last activity backwards', async () => {
    const tenant = await insertTestTenant(db(), { lastActivityAt: TOUCHED_AT });

    const result = await touchTenantActivity(tenant.id, LAST_ACTIVITY_AT);

    if (!result.ok) throw new Error(EXPECTED_OK);
    expect(result.data.lastActivityAt).toEqual(TOUCHED_AT);
  });

  it('leaves an archived tenant untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: LAST_ACTIVITY_AT,
      lastActivityAt: LAST_ACTIVITY_AT,
    });

    const result = await touchTenantActivity(tenant.id, TOUCHED_AT);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    const [row] = await db().select().from(schema.tenants);
    expect(row?.lastActivityAt).toEqual(LAST_ACTIVITY_AT);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await touchTenantActivity(MISSING_TENANT_ID, TOUCHED_AT);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
