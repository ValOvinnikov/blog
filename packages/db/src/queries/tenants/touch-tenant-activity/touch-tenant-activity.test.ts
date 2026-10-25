import { ERROR_CODE } from '@blog/config/constants';
import { INACTIVITY_STAGE_DAY, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_MISSING_TENANT_ID,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';
import {
  daysAfterLastActivity,
  MOCK_LAST_ACTIVITY_AT,
} from '@blog/db/testing/tenants/inactivity';

import { touchTenantActivity } from './touch-tenant-activity';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const TOUCHED_AT = daysAfterLastActivity(INACTIVITY_STAGE_DAY.SUSPENSION);

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(touchTenantActivity, () => {
  it('moves last activity forward and clears the warning and deletion stamps', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
      inactivityWarnedAt: MOCK_LAST_ACTIVITY_AT,
      suspendedAt: MOCK_LAST_ACTIVITY_AT,
      deletionNotifiedAt: MOCK_LAST_ACTIVITY_AT,
    });

    const {
      lastActivityAt,
      inactivityWarnedAt,
      deletionNotifiedAt,
      suspendedAt,
    } = unwrapOk(await touchTenantActivity(tenant.id, TOUCHED_AT));

    expect(lastActivityAt).toEqual(TOUCHED_AT);
    expect(inactivityWarnedAt).toBeNull();
    expect(deletionNotifiedAt).toBeNull();
    expect(suspendedAt).toEqual(MOCK_LAST_ACTIVITY_AT);
  });

  it('never moves last activity backwards', async () => {
    const tenant = await insertTestTenant(db(), { lastActivityAt: TOUCHED_AT });

    const { lastActivityAt } = unwrapOk(
      await touchTenantActivity(tenant.id, MOCK_LAST_ACTIVITY_AT),
    );

    expect(lastActivityAt).toEqual(TOUCHED_AT);
  });

  it('leaves an archived tenant untouched', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: MOCK_LAST_ACTIVITY_AT,
      lastActivityAt: MOCK_LAST_ACTIVITY_AT,
    });

    const result = await touchTenantActivity(tenant.id, TOUCHED_AT);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
    const [row] = await db().select().from(schema.tenants);
    expect(row?.lastActivityAt).toEqual(MOCK_LAST_ACTIVITY_AT);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await touchTenantActivity(
      MOCK_MISSING_TENANT_ID,
      TOUCHED_AT,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
