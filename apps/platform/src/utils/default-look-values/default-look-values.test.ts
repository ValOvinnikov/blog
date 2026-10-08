import {
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
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
      cardStyle: CARD_STYLE.ACCENT_BAR,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
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
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      cardStyle: CARD_STYLE.OUTLINED,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
      voiceOverridesByLocale: {},
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
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      cardStyle: CARD_STYLE.OUTLINED,
      logoAssetUrl: 'https://example.blob.vercel-storage.com/logo.png',
      faviconAssetUrl: 'https://example.blob.vercel-storage.com/favicon.png',
    });
  });
});
