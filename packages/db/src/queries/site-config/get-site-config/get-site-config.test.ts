import { CARD_STYLE, PRESET_ID } from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSiteConfig } from './get-site-config';

const { getDbMock } = vi.hoisted(() => ({ getDbMock: vi.fn() }));

vi.mock('@blog/db/client', () => ({ getDb: getDbMock }));

const db = useQueryTestDb(getDbMock);

afterEach(async () => {
  await db().delete(schema.siteConfig);
  await db().delete(schema.tenants);
});

describe(getSiteConfig, () => {
  let tenantId: string;

  beforeEach(async () => {
    ({ id: tenantId } = await insertTestTenant(db()));
  });

  it('returns undefined when the tenant has no config row', async () => {
    const result = await getSiteConfig(tenantId);

    expect(result).toBeUndefined();
  });

  it('maps null theme columns to undefined', async () => {
    await db().insert(schema.siteConfig).values({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
    });

    const result = await getSiteConfig(tenantId);

    expect(result).toMatchObject({
      tenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      cardStyle: CARD_STYLE.ACCENT_BAR,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });
  });
});
