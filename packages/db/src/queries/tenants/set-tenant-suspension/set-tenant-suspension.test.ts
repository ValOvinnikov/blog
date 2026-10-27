import { ERROR_CODE } from '@blog/config/constants';
import {
  SUSPENSION_REASON,
  TENANT_STATUS,
  type TTenantStatus,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DEPROVISIONED_AT,
  MOCK_MISSING_TENANT_ID,
  unwrapOk,
} from '@blog/db/testing/tenants/fixtures';
import { MOCK_LAST_ACTIVITY_AT } from '@blog/db/testing/tenants/inactivity';
import { eq } from 'drizzle-orm';

import { setTenantSuspension } from './set-tenant-suspension';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function insertTenant(
  status: TTenantStatus,
  deprovisionedAt?: Date,
): Promise<string> {
  const tenant = await insertTestTenant(db(), { status, deprovisionedAt });

  return tenant.id;
}

async function readStatus(tenantId: string) {
  const [row] = await db()
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row?.status;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantSuspension, () => {
  it.each([
    [TENANT_STATUS.ACTIVE, TENANT_STATUS.SUSPENDED],
    [TENANT_STATUS.SUSPENDED, TENANT_STATUS.ACTIVE],
  ])('moves a %s tenant to %s', async (from, to) => {
    const tenantId = await insertTenant(from);

    const { status } = unwrapOk(await setTenantSuspension(tenantId, to));

    const storedStatus = await readStatus(tenantId);
    expect(status).toBe(to);
    expect(storedStatus).toBe(to);
  });

  it('records an operator suspension over an inactivity one', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const { suspensionReason } = unwrapOk(
      await setTenantSuspension(tenant.id, TENANT_STATUS.SUSPENDED),
    );

    expect(suspensionReason).toBe(SUSPENSION_REASON.OPERATOR);
  });

  it('clears the suspension reason and stamp when the suspension is lifted', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.SUSPENDED,
      suspendedAt: MOCK_LAST_ACTIVITY_AT,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const { suspensionReason, suspendedAt } = unwrapOk(
      await setTenantSuspension(tenant.id, TENANT_STATUS.ACTIVE),
    );

    expect(suspensionReason).toBeNull();
    expect(suspendedAt).toBeNull();
  });

  it.each([
    [TENANT_STATUS.ARCHIVED, TENANT_STATUS.ACTIVE],
    [TENANT_STATUS.ACTIVE, TENANT_STATUS.SUSPENDED],
  ])(
    'leaves a deprovisioned %s tenant untouched when asked for %s',
    async (status, target) => {
      const tenantId = await insertTenant(status, MOCK_DEPROVISIONED_AT);

      const result = await setTenantSuspension(tenantId, target);

      const storedStatus = await readStatus(tenantId);
      expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
      expect(storedStatus).toBe(status);
    },
  );

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await setTenantSuspension(
      MOCK_MISSING_TENANT_ID,
      TENANT_STATUS.SUSPENDED,
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
