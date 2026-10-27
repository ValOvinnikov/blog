import { PRESET_ID } from '@blog/config/constants';
import { getSiteConfig } from '@blog/db/queries/site-config/get-site-config';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';
import { faker } from '@faker-js/faker';
import { eq } from 'drizzle-orm';

import { insertSiteConfigIfMissing } from './insert-site-config-if-missing';

faker.seed(6022);

vi.mock('@blog/db/client');

const MOCK_CUSTOM_ACCENT_HUE = faker.number.int({ min: 1, max: 360 });

const db = useQueryTestDb();

afterEach(async () => {
  await db().delete(schema.tenants);
});

describe(insertSiteConfigIfMissing, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('seeds a tenant with no site config with the given preset', async () => {
    await insertSiteConfigIfMissing(tenantId, PRESET_ID.EDITORIAL);

    const config = await getSiteConfig(tenantId);

    expect(config?.preset).toBe(PRESET_ID.EDITORIAL);
  });

  it('seeds the accent hue it is given', async () => {
    await insertSiteConfigIfMissing(
      tenantId,
      PRESET_ID.CONSOLE,
      MOCK_CUSTOM_ACCENT_HUE,
    );

    const config = await getSiteConfig(tenantId);

    expect(config?.accentHue).toBe(MOCK_CUSTOM_ACCENT_HUE);
  });

  it('leaves an existing site config untouched', async () => {
    await insertSiteConfigIfMissing(tenantId, PRESET_ID.CONSOLE);
    const [before] = await db()
      .select()
      .from(schema.siteConfig)
      .where(eq(schema.siteConfig.tenantId, tenantId));

    await insertSiteConfigIfMissing(tenantId, PRESET_ID.EDITORIAL);

    const [after] = await db()
      .select()
      .from(schema.siteConfig)
      .where(eq(schema.siteConfig.tenantId, tenantId));
    expect(after).toEqual(before);
  });
});
