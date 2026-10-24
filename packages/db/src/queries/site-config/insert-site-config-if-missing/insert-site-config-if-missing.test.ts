import { PRESET_ID } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { siteConfig } from '@blog/db/schema/site-config';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { eq } from 'drizzle-orm';

import { getSiteConfig } from '../get-site-config';

import { insertSiteConfigIfMissing } from './insert-site-config-if-missing';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

const CUSTOM_ACCENT_HUE = 123;

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(insertSiteConfigIfMissing, () => {
  it('gives a tenant with no site config the preset it is seeded with', async () => {
    const { id } = await insertTestTenant(db());

    await insertSiteConfigIfMissing(id, PRESET_ID.EDITORIAL);

    expect((await getSiteConfig(id))?.preset).toBe(PRESET_ID.EDITORIAL);
  });

  it('seeds the accent hue it is given instead of the preset default', async () => {
    const { id } = await insertTestTenant(db());

    await insertSiteConfigIfMissing(id, PRESET_ID.CONSOLE, CUSTOM_ACCENT_HUE);

    expect((await getSiteConfig(id))?.accentHue).toBe(CUSTOM_ACCENT_HUE);
  });

  it('leaves an existing site config untouched', async () => {
    const { id } = await insertTestTenant(db());
    await insertSiteConfigIfMissing(id, PRESET_ID.CONSOLE);
    const [before] = await db()
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.tenantId, id));

    await insertSiteConfigIfMissing(id, PRESET_ID.EDITORIAL);

    const [after] = await db()
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.tenantId, id));
    expect(after).toEqual(before);
  });
});
