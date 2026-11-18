import { LOCALE_ISO_CODES, TENANT_PLAN } from '@shinefold/config/constants';
import { tenants } from '@shinefold/db/schema/tenants';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { MOCK_MISSING_TENANT_ID } from '@shinefold/db/testing/tenants/fixtures';
import {
  patchTestTenant,
  useTestTenant,
} from '@shinefold/db/testing/test-tenant';
import { eq } from 'drizzle-orm';

import {
  getTenantLiveLocales,
  selectLiveLocalesWithin,
} from './get-tenant-live-locales';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();

const { EN, NL, FR } = LOCALE_ISO_CODES;

describe(getTenantLiveLocales, () => {
  describe('a growth tenant with NL and FR as additional locales', () => {
    const tenant = useTestTenant(db, {
      locale: EN,
      additionalLocales: [NL, FR],
      plan: TENANT_PLAN.GROWTH,
    });

    it('returns the default locale first, then the additional ones', async () => {
      const result = await getTenantLiveLocales(tenant().id);

      expect(result).toEqual([EN, NL, FR]);
    });

    it('serves only what the plan allows after a downgrade, keeping the stored locales', async () => {
      await patchTestTenant(db(), tenant().id, { plan: TENANT_PLAN.FREE });

      const live = await getTenantLiveLocales(tenant().id);

      const [stored] = await db()
        .select({ additionalLocales: tenants.additionalLocales })
        .from(tenants)
        .where(eq(tenants.id, tenant().id));
      expect(live).toEqual([EN]);
      expect(stored).toEqual({ additionalLocales: [NL, FR] });
    });
  });

  it('returns undefined for a missing tenant', async () => {
    const result = await getTenantLiveLocales(MOCK_MISSING_TENANT_ID);

    expect(result).toBeUndefined();
  });
});

describe(selectLiveLocalesWithin, () => {
  it('serves the default locale and the additional ones up to the limit', () => {
    expect(
      selectLiveLocalesWithin(
        { locale: EN, additionalLocales: [NL, FR] },
        { localeLimit: 2 },
      ),
    ).toEqual([EN, NL]);
  });
});
