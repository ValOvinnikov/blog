import {
  ERROR_CODE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
  TENANT_PLAN,
  type TTenantPlan,
} from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { tenants } from '@shinefold/db/schema/tenants';
import { insertTestTenant } from '@shinefold/db/testing/fixtures';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import {
  insertTestEntitlementGrant,
  MOCK_GRANT_PAST,
} from '@shinefold/db/testing/tenant-entitlement-grants/fixtures';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { setTenantAdditionalLocales } from './set-tenant-additional-locales';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const MOCK_GRANTED_LOCALE_LIMIT = 3;

function grantLocaleLimit(
  tenantId: string,
  overrides: { revokedAt?: Date } = {},
) {
  return insertTestEntitlementGrant(db(), tenantId, {
    kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
    key: ENTITLEMENT_KIND.LOCALE_LIMIT,
    value: MOCK_GRANTED_LOCALE_LIMIT,
    ...overrides,
  });
}

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

  describe('a FREE tenant with a language grant', () => {
    let tenantId: string;

    beforeEach(async () => {
      tenantId = await insertTenant(TENANT_PLAN.FREE);
    });

    describe('while the grant is open', () => {
      beforeEach(async () => {
        await grantLocaleLimit(tenantId);
      });

      it('saves additional locales up to the granted limit', async () => {
        const result = await setTenantAdditionalLocales(tenantId, [NL, FR]);

        expect(result).toEqual({ ok: true, data: [NL, FR] });
      });

      it('rejects locales past the granted limit', async () => {
        const result = await setTenantAdditionalLocales(tenantId, [NL, FR, DE]);

        expect(result).toEqual({
          ok: false,
          error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
        });
      });
    });

    it('ignores a revoked grant', async () => {
      await grantLocaleLimit(tenantId, { revokedAt: MOCK_GRANT_PAST });

      const result = await setTenantAdditionalLocales(tenantId, [NL]);

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
      });
    });
  });

  it('reports a missing tenant as not found', async () => {
    const result = await setTenantAdditionalLocales(MOCK_MISSING_TENANT_ID, [
      NL,
    ]);

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
