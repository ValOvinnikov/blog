import { SITE_CONFIG_SAVED_AT } from '@blog/db/constants';
import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_SITE_CONFIG_FIELDS } from '@blog/db/testing/site-config/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { stampSiteConfigSavedAt } from './stamp-site-config-saved-at';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

describe(stampSiteConfigSavedAt, () => {
  it.each(Object.values(SITE_CONFIG_SAVED_AT))(
    'stamps %s, leaving every other column untouched',
    async (column) => {
      const [before] = await db()
        .insert(schema.siteConfig)
        .values({ tenantId: tenant().id, ...MOCK_SITE_CONFIG_FIELDS })
        .returning();

      await stampSiteConfigSavedAt(tenant().id, column);

      const [row] = await db().select().from(schema.siteConfig);
      expect(row).toEqual({
        ...before,
        [column]: MOCK_NOW,
        updatedAt: MOCK_NOW,
      });
    },
  );

  it('writes nothing for a tenant with no config row', async () => {
    await stampSiteConfigSavedAt(tenant().id, SITE_CONFIG_SAVED_AT.LOOK);

    const rows = await db().select().from(schema.siteConfig);
    expect(rows).toEqual([]);
  });
});
