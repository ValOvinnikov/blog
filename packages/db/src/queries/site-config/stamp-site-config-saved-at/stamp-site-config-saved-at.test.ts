import { SITE_CONFIG_SAVED_AT } from '@shinefold/db/constants';
import * as schema from '@shinefold/db/schema';
import { MOCK_NOW, useFrozenClock } from '@shinefold/db/testing/frozen-clock';
import { useQueryTestDb } from '@shinefold/db/testing/query-test-db';
import { insertTestSiteConfig } from '@shinefold/db/testing/site-config/fixtures';
import { useTestTenant } from '@shinefold/db/testing/test-tenant';

import { stampSiteConfigSavedAt } from './stamp-site-config-saved-at';

vi.mock('@shinefold/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

describe(stampSiteConfigSavedAt, () => {
  it.each([
    { savedAt: SITE_CONFIG_SAVED_AT.LOOK, stamped: { lookSavedAt: MOCK_NOW } },
    {
      savedAt: SITE_CONFIG_SAVED_AT.VOICE,
      stamped: { voiceSavedAt: MOCK_NOW },
    },
  ])(
    'stamps $savedAt, leaving every other column untouched',
    async ({ savedAt, stamped }) => {
      const before = await insertTestSiteConfig(db(), tenant().id);

      await stampSiteConfigSavedAt(tenant().id, savedAt);

      const [row] = await db().select().from(schema.siteConfig);
      expect(row).toEqual({
        ...before,
        ...stamped,
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
