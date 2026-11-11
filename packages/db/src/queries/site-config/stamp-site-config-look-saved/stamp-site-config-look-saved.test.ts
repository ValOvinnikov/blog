import * as schema from '@blog/db/schema';
import { MOCK_NOW, useFrozenClock } from '@blog/db/testing/frozen-clock';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { MOCK_SITE_CONFIG_FIELDS } from '@blog/db/testing/site-config/fixtures';
import { useTestTenant } from '@blog/db/testing/test-tenant';

import { stampSiteConfigLookSaved } from './stamp-site-config-look-saved';

vi.mock('@blog/db/client');

const db = useQueryTestDb();
const tenant = useTestTenant(db);
useFrozenClock();

describe(stampSiteConfigLookSaved, () => {
  it('records when the Look was saved, leaving every other column untouched', async () => {
    const [before] = await db()
      .insert(schema.siteConfig)
      .values({ tenantId: tenant().id, ...MOCK_SITE_CONFIG_FIELDS })
      .returning();

    await stampSiteConfigLookSaved(tenant().id);

    const [row] = await db().select().from(schema.siteConfig);
    expect(row).toEqual({
      ...before,
      lookSavedAt: MOCK_NOW,
      updatedAt: MOCK_NOW,
    });
  });

  it('writes nothing for a tenant with no config row', async () => {
    await stampSiteConfigLookSaved(tenant().id);

    const rows = await db().select().from(schema.siteConfig);
    expect(rows).toEqual([]);
  });
});
