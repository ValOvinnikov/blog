import { ERROR_CODE, TENANT_PLAN } from '@blog/config/constants';
import { getTenantBilling } from '@blog/db/queries/tenants/get-tenant-billing';
import type { TTenantBilling } from '@blog/db/queries/tenants/tenant-billing';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { mockTenantBilling } from '@blog/db/testing/tenants/billing';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { setTenantBilling } from './set-tenant-billing';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantBilling, () => {
  it('writes billing that reads back unchanged', async () => {
    const { id } = await insertTestTenant(db());
    const billing = mockTenantBilling();

    await setTenantBilling(id, billing);

    const stored = await getTenantBilling(id);
    expect(stored).toEqual(billing);
  });

  describe('a tenant with billing stored', () => {
    let billing: TTenantBilling;
    let id: string;

    beforeEach(async () => {
      billing = mockTenantBilling();
      ({ id } = await insertTestTenant(db(), billing));
    });

    it('keeps fields the input leaves out', async () => {
      const { graceHalfwayEmailSentAt: graceEndingEmailSentAt } = billing;

      const result = await setTenantBilling(id, { graceEndingEmailSentAt });

      expect(result).toEqual({
        ok: true,
        data: { ...billing, graceEndingEmailSentAt },
      });
    });

    it('clears a field set to null', async () => {
      await setTenantBilling(id, {
        downgradeGraceStartedAt: null,
        graceStartedEmailSentAt: null,
        graceHalfwayEmailSentAt: null,
      });

      const stored = await getTenantBilling(id);
      expect(stored).toEqual({
        ...billing,
        downgradeGraceStartedAt: undefined,
        graceStartedEmailSentAt: undefined,
        graceHalfwayEmailSentAt: undefined,
      });
    });

    it('writes no field outside billing when given a wider object', async () => {
      const wider = { ...billing, plan: TENANT_PLAN.GROWTH };

      await setTenantBilling(id, wider);

      const [stored] = await db()
        .select({ plan: schema.tenants.plan })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, id));
      expect(stored).toEqual({ plan: TENANT_PLAN.FREE });
    });

    it('leaves every billing field untouched given an empty input', async () => {
      const result = await setTenantBilling(id, {});

      expect(result).toEqual({ ok: true, data: billing });
    });

    it('refuses a Stripe customer id another tenant already holds', async () => {
      const { id: otherId } = await insertTestTenant(db());

      await expect(
        setTenantBilling(otherId, {
          stripeCustomerId: billing.stripeCustomerId,
        }),
      ).rejects.toThrow();
    });
  });

  it('returns DB_NOT_FOUND for a tenant id that does not exist', async () => {
    const { stripeCustomerId } = mockTenantBilling();

    const result = await setTenantBilling(MOCK_MISSING_TENANT_ID, {
      stripeCustomerId,
    });

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
