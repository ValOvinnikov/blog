import {
  ERROR_CODE,
  LOCALE_ISO_CODES,
  type TLocaleIsoCode,
} from '@blog/config/constants';
import {
  TENANT_PLAN,
  TENANT_STATUS,
  type TTenantPlan,
} from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { setTenantAdditionalLocales } from './set-tenant-additional-locales';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

async function insertTenant(
  plan: TTenantPlan,
  additionalLocales: TLocaleIsoCode[] = [],
): Promise<string> {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: EN,
      additionalLocales,
      plan,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

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

      expect(result).toEqual({ ok: true, data: [NL, FR] });
      expect(await storedAdditionalLocales(tenantId)).toEqual([NL, FR]);
    });

    it('rejects more locales than the plan allows, counting the default', async () => {
      const result = await setTenantAdditionalLocales(tenantId, [NL, FR, DE]);

      expect(result).toEqual({
        ok: false,
        error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
      });
      expect(await storedAdditionalLocales(tenantId)).toEqual([]);
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

      expect(result).toEqual({ ok: true, data: [] });
      expect(await storedAdditionalLocales(tenantId)).toEqual([]);
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

    expect(result).toEqual({ ok: true, data: [DE, NL, FR] });
    expect(await storedAdditionalLocales(tenantId)).toEqual([DE, NL, FR]);
  });

  it('rejects adding a new locale while over the limit', async () => {
    const tenantId = await insertTenant(TENANT_PLAN.FREE, [NL, FR]);

    const result = await setTenantAdditionalLocales(tenantId, [NL, ES]);

    expect(result).toEqual({
      ok: false,
      error: ERROR_CODE.DB_LOCALE_LIMIT_EXCEEDED,
    });
    expect(await storedAdditionalLocales(tenantId)).toEqual([NL, FR]);
  });

  it('reports a missing tenant as not found', async () => {
    const result = await setTenantAdditionalLocales(
      '00000000-0000-0000-0000-000000000000',
      [NL],
    );

    expect(result).toEqual({ ok: false, error: ERROR_CODE.DB_NOT_FOUND });
  });
});
