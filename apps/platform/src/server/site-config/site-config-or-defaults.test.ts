import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';

import { getSiteConfigOrDefaults } from './site-config-or-defaults';

const { getSiteConfigMock } = vi.hoisted(() => ({
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', () => ({
  queries: { siteConfig: { getSiteConfig: getSiteConfigMock } },
}));

describe(getSiteConfigOrDefaults, () => {
  beforeEach(() => {
    getSiteConfigMock.mockReset();
  });

  it('returns the theme fields and asset URLs from an existing row', async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      logoHue: undefined,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: undefined,
      voiceOverrides: {},
    });

    const result = await getSiteConfigOrDefaults('tenant-1');

    expect(result).toEqual({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: undefined,
    });
  });

  it('falls back to the Console preset defaults with no asset URLs when no row exists', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await getSiteConfigOrDefaults('tenant-1');

    expect(result).toEqual({
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
  });
});
