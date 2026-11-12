import { ERROR_CODE } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { MOCK_SELF_SERVE_OWNER_EMAIL_INDEX } from '@blog/db/testing/tenants/self-serve-fixtures';
import { eq } from 'drizzle-orm';

import { setTenantPlan } from './set-tenant-plan';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

async function readSelfServeIndex(tenantId: string) {
  const [row] = await db()
    .select({ selfServeOwnerEmailIndex: tenants.selfServeOwnerEmailIndex })
    .from(tenants)
    .where(eq(tenants.id, tenantId));
  return row?.selfServeOwnerEmailIndex;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantPlan, () => {
  describe('a self-serve Free tenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.FREE,
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      }));
    });

    it('writes a paid plan and status and clears the Free-site key', async () => {
      const result = await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.PAST_DUE,
      });

      expect(result).toEqual({
        ok: true,
        data: { plan: TENANT_PLAN.GROWTH, status: TENANT_STATUS.PAST_DUE },
      });
      expect(await readSelfServeIndex(tenantId)).toBeNull();
    });

    it('keeps the Free-site key on a write that stays on FREE', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readSelfServeIndex(tenantId)).toBe(
        MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      );
    });

    it('moves back to FREE after a paid plan while the owner holds another Free site', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.STARTER,
        status: TENANT_STATUS.ACTIVE,
      });
      await insertTestTenant(db(), {
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      });

      const result = await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.FREE,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(result).toEqual({
        ok: true,
        data: { plan: TENANT_PLAN.FREE, status: TENANT_STATUS.ACTIVE },
      });
    });
  });

  describe('a self-serve trial', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.TRIAL,
        selfServeOwnerEmailIndex: MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      }));
    });

    it('keeps the Free-or-trial key while it stays in TRIAL', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.TRIAL,
      });

      expect(await readSelfServeIndex(tenantId)).toBe(
        MOCK_SELF_SERVE_OWNER_EMAIL_INDEX,
      );
    });

    it('clears the key when it converts to a paid, running site', async () => {
      await setTenantPlan(tenantId, {
        plan: TENANT_PLAN.GROWTH,
        status: TENANT_STATUS.ACTIVE,
      });

      expect(await readSelfServeIndex(tenantId)).toBeNull();
    });
  });

  it('returns not-found for a tenant id that does not exist', async () => {
    const result = await setTenantPlan(MOCK_MISSING_TENANT_ID, {
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
