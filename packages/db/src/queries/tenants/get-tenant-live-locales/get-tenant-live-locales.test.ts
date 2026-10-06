import { LOCALE_ISO_CODES, type TLocaleIsoCode } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { getTenantLiveLocales } from './get-tenant-live-locales';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const { EN, NL, FR } = LOCALE_ISO_CODES;

async function insertGrowthTenantWith(
  additionalLocales: TLocaleIsoCode[],
): Promise<string> {
  const [tenant] = await db()
    .insert(schema.tenants)
    .values({
      name: 'Acme',
      primaryDomain: 'acme.example.com',
      locale: EN,
      additionalLocales,
      plan: TENANT_PLAN.GROWTH,
      status: TENANT_STATUS.ACTIVE,
    })
    .returning();

  if (!tenant) throw new Error('setup: tenant insert returned no row.');

  return tenant.id;
}

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantLiveLocales, () => {
  it('returns the default locale first, then the additional ones', async () => {
    const tenantId = await insertGrowthTenantWith([NL, FR]);

    expect(await getTenantLiveLocales(tenantId)).toEqual([EN, NL, FR]);
  });

  it('serves only what the plan allows after a downgrade, keeping the stored locales', async () => {
    const tenantId = await insertGrowthTenantWith([NL, FR]);
    await db()
      .update(tenants)
      .set({ plan: TENANT_PLAN.FREE })
      .where(eq(tenants.id, tenantId));

    const live = await getTenantLiveLocales(tenantId);
    const [stored] = await db()
      .select({ additionalLocales: tenants.additionalLocales })
      .from(tenants)
      .where(eq(tenants.id, tenantId));

    expect(live).toEqual([EN]);
    expect(stored?.additionalLocales).toEqual([NL, FR]);
  });

  it('returns undefined for a missing tenant', async () => {
    expect(
      await getTenantLiveLocales('00000000-0000-0000-0000-000000000000'),
    ).toBeUndefined();
  });
});
