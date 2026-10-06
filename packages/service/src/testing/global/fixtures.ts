import type { TRawFooter } from '@blog/service/features/global/footer/adaptor/transformer';
import type { TRawNavigation } from '@blog/service/features/global/navigation/adaptor/transformer';
import type { TRawSiteSettings } from '@blog/service/features/global/site-settings/adaptor/transformer';
import type { TRawThemeSettings } from '@blog/service/features/global/theme-settings/adaptor/transformer';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

export function makeRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    brand: {
      name: 'My Blog',
      tagline: null,
      logo: makeRawSanityImage('Logo'),
    },
    currency: 'USD',
    ...overrides,
  };
}

export function makeRawNavigation(
  overrides: Partial<TRawNavigation> = {},
): TRawNavigation {
  return {
    items: null,
    showLanguageSwitcher: null,
    ...overrides,
  };
}

export function makeRawFooter(overrides: Partial<TRawFooter> = {}): TRawFooter {
  return {
    social: null,
    showLanguageSwitcher: null,
    ...overrides,
  };
}

export function makeRawThemeSettings(
  overrides: Partial<NonNullable<TRawThemeSettings>> = {},
): NonNullable<TRawThemeSettings> {
  return {
    preset: null,
    accentHue: null,
    logoHue: null,
    headingFont: null,
    bodyFont: null,
    radiusScale: null,
    density: null,
    ...overrides,
  };
}
