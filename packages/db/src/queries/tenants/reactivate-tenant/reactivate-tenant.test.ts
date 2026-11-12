import { ERROR_CODE } from '@blog/config/constants';
import {
  SUSPENSION_REASON,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import { wakeTenantFromInactivity } from '@blog/db/queries/tenants/wake-tenant-from-inactivity';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { testPersonalEmailIndex } from '@blog/db/testing/personal-data';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import {
  MOCK_DEPROVISIONED_AT,
  MOCK_IDLE_DEPROVISIONING_STEPS,
  MOCK_MISSING_TENANT_ID,
} from '@blog/db/testing/tenants/fixtures';
import {
  MOCK_RESUME_CASES,
  pickResumedFields,
} from '@blog/db/testing/tenants/resume';
import { MOCK_SELF_SERVE_OWNER_EMAIL } from '@blog/db/testing/tenants/self-serve-fixtures';
import { patchTestTenant } from '@blog/db/testing/test-tenant';
import { errorResult } from '@blog/utils';
import { eq } from 'drizzle-orm';

import { reactivateTenant } from './reactivate-tenant';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
useFrozenClock();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(reactivateTenant, () => {
  it('makes an archived tenant ACTIVE, leaving its provisioning artifacts as they are', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    });
    const reactivated = {
      ...tenant,
      status: TENANT_STATUS.ACTIVE,
      deprovisionedAt: null,
      updatedAt: MOCK_NOW,
    };

    const result = await reactivateTenant(tenant.id);

    const rows = await db().select().from(schema.tenants);
    expect(result).toEqual({ ok: true, data: reactivated });
    expect(rows).toEqual([reactivated]);
  });

  it.each(MOCK_RESUME_CASES)(
    'reactivates %s from archive into its resumed plan, status and slot',
    async (_, overrides, resumed) => {
      const tenant = await insertTestTenant(db(), {
        ...overrides,
        status: TENANT_STATUS.ARCHIVED,
        deprovisionedAt: MOCK_DEPROVISIONED_AT,
      });

      const result = await reactivateTenant(tenant.id);

      expect(result.ok && pickResumedFields(result.data)).toEqual(resumed);
    },
  );

  it.each([TENANT_STATUS.ACTIVE, TENANT_STATUS.SUSPENDED])(
    'leaves a %s tenant at that status and not deprovisioned',
    async (status) => {
      const tenant = await insertTestTenant(db(), { status });
      const unchanged = { ...tenant, updatedAt: MOCK_NOW };

      const result = await reactivateTenant(tenant.id);

      const rows = await db().select().from(schema.tenants);
      expect(result).toEqual({ ok: true, data: unchanged });
      expect(rows).toEqual([unchanged]);
    },
  );

  it('lets a reactivated tenant wake from a later inactivity suspension', async () => {
    const tenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
      deprovisioningSteps: MOCK_IDLE_DEPROVISIONING_STEPS,
    });
    await reactivateTenant(tenant.id);
    await patchTestTenant(db(), tenant.id, {
      status: TENANT_STATUS.SUSPENDED,
      suspensionReason: SUSPENSION_REASON.INACTIVITY,
    });

    const woken = await wakeTenantFromInactivity(tenant.id);

    expect(woken?.status).toBe(TENANT_STATUS.ACTIVE);
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const result = await reactivateTenant(MOCK_MISSING_TENANT_ID);

    expect(result).toEqual(errorResult(ERROR_CODE.DB_NOT_FOUND));
  });

  it('refuses with DB_ALREADY_OWNS_FREE_TENANT when the owner took a new Free slot', async () => {
    const selfServeOwnerEmailIndex = testPersonalEmailIndex(
      MOCK_SELF_SERVE_OWNER_EMAIL,
    );
    const archivedTenant = await insertTestTenant(db(), {
      status: TENANT_STATUS.ARCHIVED,
      deprovisionedAt: MOCK_DEPROVISIONED_AT,
      selfServeOwnerEmailIndex,
    });
    await insertTestTenant(db(), { selfServeOwnerEmailIndex });

    const result = await reactivateTenant(archivedTenant.id);

    const [row] = await db()
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, archivedTenant.id));
    expect(result).toEqual(errorResult(ERROR_CODE.DB_ALREADY_OWNS_FREE_TENANT));
    expect(row).toEqual(archivedTenant);
  });
});
