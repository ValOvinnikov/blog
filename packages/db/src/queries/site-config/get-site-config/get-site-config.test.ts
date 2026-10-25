import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  LOCALE_ISO_CODES,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config/constants';
import * as schema from '@blog/db/schema';
import { insertTestTenant } from '@blog/db/testing/fixtures';
import { useQueryTestDb } from '@blog/db/testing/query-test-db';

import { getSiteConfig } from './get-site-config';

vi.mock('@blog/db/client');

const MOCK_DE_NOT_FOUND_HEADING = 'Nicht gefunden';

const db = useQueryTestDb();

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
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
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

  it("returns every language's overrides and the default language's slice", async () => {
    const { id: germanTenantId } = await insertTestTenant(db(), {
      locale: LOCALE_ISO_CODES.DE,
    });
    const voiceOverridesByLocale = {
      [LOCALE_ISO_CODES.DE]: { notFoundHeading: MOCK_DE_NOT_FOUND_HEADING },
      [LOCALE_ISO_CODES.EN]: { notFoundHeading: 'Lost the plot?' },
    };
    await db().insert(schema.siteConfig).values({
      tenantId: germanTenantId,
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      voiceOverridesByLocale,
    });

    const result = await getSiteConfig(germanTenantId);

    expect(result).toMatchObject({
      voiceOverridesByLocale,
      voiceOverrides: { notFoundHeading: MOCK_DE_NOT_FOUND_HEADING },
    });
  });
});
