import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MOCK_LOGO_URL,
  MOCK_THEME_FIELDS,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import { getSiteConfigOrDefaults } from './site-config-or-defaults';

faker.seed(5998);

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 359 });

describe(getSiteConfigOrDefaults, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it('returns the theme fields and asset URLs from an existing row', async () => {
    const theme = {
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
    };
    getSiteConfigMock.mockResolvedValue({
      ...theme,
      logoHue: undefined,
      logoAssetUrl: MOCK_LOGO_URL,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });

    const result = await getSiteConfigOrDefaults(MOCK_TENANT_ID);

    expect(result).toEqual({
      ...theme,
      logoAssetUrl: MOCK_LOGO_URL,
      faviconAssetUrl: undefined,
    });
  });

  it('falls back to the Console preset defaults with no asset URLs when no row exists', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await getSiteConfigOrDefaults(MOCK_TENANT_ID);

    expect(result).toEqual({
      ...MOCK_THEME_FIELDS,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
  });
});
