import { DENSITY, FONT_CHOICE, PRESET_ID, RADIUS_SCALE } from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';

import { defaultLookFormValues, toLookFormValues } from './default-look-values';

describe(defaultLookFormValues, () => {
  it('matches the Console preset registry defaults, with logo hue following accent', () => {
    expect(defaultLookFormValues()).toEqual({
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      chromeOn: true,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
    });
  });
});

describe(toLookFormValues, () => {
  it('carries every stored column through unchanged', () => {
    const siteConfig: TSiteConfigResult = {
      id: 'config-1',
      tenantId: 'tenant-1',
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      logoHue: 90,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
      voiceOverrides: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(toLookFormValues(siteConfig)).toEqual({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      logoHue: 90,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      chromeOn: false,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
  });

  it("derives chromeOn from the stored preset's registry default, since no column stores it", () => {
    const siteConfig: TSiteConfigResult = {
      id: 'config-1',
      tenantId: 'tenant-1',
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(toLookFormValues(siteConfig).chromeOn).toBe(true);
  });
});
