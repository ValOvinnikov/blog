import { BRAND_VARIANTS } from '@blog/config';
import type { TRawFooter } from '@blog/service/features/global/footer/adaptor/transformer';
import type { TRawNavigation } from '@blog/service/features/global/navigation/adaptor/transformer';
import type { TRawSiteSettings } from '@blog/service/features/global/site-settings/adaptor/transformer';
import { makeRawImage } from '@blog/service/testing/shared/fixtures';

export function makeRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    brand: {
      name: 'My Blog',
      prefix: 'val',
      suffix: null,
      specLine: null,
      logo: makeRawImage('Logo'),
      variant: BRAND_VARIANTS.CONSOLE,
    },
    description: 'A blog about things',
    tagline: null,
    defaultOgImage: makeRawImage('Default OG image'),
    ...overrides,
  };
}

export function makeRawNavigation(
  overrides: Partial<TRawNavigation> = {},
): TRawNavigation {
  return {
    items: null,
    ...overrides,
  };
}

export function makeRawFooter(overrides: Partial<TRawFooter> = {}): TRawFooter {
  return {
    social: null,
    ...overrides,
  };
}
