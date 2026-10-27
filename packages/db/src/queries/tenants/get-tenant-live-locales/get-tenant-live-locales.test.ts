import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { tenants } from '@blog/db/schema/tenants';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@blog/db/testing/tenants/fixtures';
import { eq } from 'drizzle-orm';

import { getTenantLiveLocales } from './get-tenant-live-locales';

vi.mock('@blog/db/client');

const db = useQueryTestDb();

const { EN, NL, FR } = LOCALE_ISO_CODES;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(getTenantLiveLocales, () => {
  describe('a growth tenant with NL and FR as additional locales', () => {
    let tenantId: string;

    beforeEach(async () => {
      ({ id: tenantId } = await insertTestTenant(db(), {
        locale: EN,
        additionalLocales: [NL, FR],
        plan: TENANT_PLAN.GROWTH,
      }));
    });

    it('returns the default locale first, then the additional ones', async () => {
      const result = await getTenantLiveLocales(tenantId);

      expect(result).toEqual([EN, NL, FR]);
    });

    it('serves only what the plan allows after a downgrade, keeping the stored locales', async () => {
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
      expect(stored).toEqual({ additionalLocales: [NL, FR] });
    });
  });

  it('returns undefined for a missing tenant', async () => {
    const result = await getTenantLiveLocales(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});
