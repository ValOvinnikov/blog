import {
  ERROR_CODE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { setTenantAdditionalLocales } from './set-tenant-additional-locales';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

async function insertTenant(
  plan: TTenantPlan,
  additionalLocales: TLocaleIsoCode[] = [],
): Promise<string> {
  const tenant = await insertTestTenant(db(), {
    locale: EN,
    additionalLocales,
    plan,
  });

  return tenant.id;
}

async function storedAdditionalLocales(tenantId: string) {
  const [row] = await db()
    .select({ additionalLocales: tenants.additionalLocales })
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return row?.additionalLocales;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(setTenantAdditionalLocales, () => {
  describe('a GROWTH tenant', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenant(TENANT_PLAN.GROWTH);
    });

    it('saves additional locales within the plan limit', async () => {
      const result = await setTenantAdditionalLocales(tenantId, [NL, FR]);

      const stored = await storedAdditionalLocales(tenantId);
      expect(result).toEqual({ ok: true, data: [NL, FR] });
      expect(stored).toEqual([NL, FR]);
    });

    it('rejects more locales than the plan allows, counting the default', async () => {
      const result = await setTenantAdditionalLocales(tenantId, [NL, FR, DE]);

      const stored = await storedAdditionalLocales(tenantId);
      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
      });
      expect(stored).toEqual([]);
    });

    it('rejects the default locale among the additional ones', async () => {
      const result = await setTenantAdditionalLocales(tenantId, [EN]);

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_DEFAULT_LOCALE_REPEATED,
      });
    });

    it('counts a repeated locale once', async () => {
      const result = await setTenantAdditionalLocales(tenantId, [NL, NL, FR]);

      expect(result).toEqual({ ok: true, data: [NL, FR] });
    });

    it('clears the additional locales when given none', async () => {
      await setTenantAdditionalLocales(tenantId, [NL]);

      const result = await setTenantAdditionalLocales(tenantId, []);

      const stored = await storedAdditionalLocales(tenantId);
      expect(result).toEqual({ ok: true, data: [] });
      expect(stored).toEqual([]);
    });
  });

  it('rejects any additional locale on a plan that allows only the default', async () => {
    const tenantId = await insertTenant(TENANT_PLAN.FREE);

    const result = await setTenantAdditionalLocales(tenantId, [NL]);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
    });
  });

  it('keeps stored locales past the limit in the order given after a downgrade', async () => {
    const tenantId = await insertTenant(TENANT_PLAN.FREE, [NL, FR, DE]);

    const result = await setTenantAdditionalLocales(tenantId, [DE, NL, FR]);

    const stored = await storedAdditionalLocales(tenantId);
    expect(result).toEqual({ ok: true, data: [DE, NL, FR] });
    expect(stored).toEqual([DE, NL, FR]);
  });

  it('rejects adding a new locale while over the limit', async () => {
    const tenantId = await insertTenant(TENANT_PLAN.FREE, [NL, FR]);

    const result = await setTenantAdditionalLocales(tenantId, [NL, ES]);

    const stored = await storedAdditionalLocales(tenantId);
    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
    });
    expect(stored).toEqual([NL, FR]);
  });

  it('reports a missing tenant as not found', async () => {
    const result = await setTenantAdditionalLocales(MOCK_MISSING_TENANT_ID, [
      NL,
    ]);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
