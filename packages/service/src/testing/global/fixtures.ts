import type { TRawFooter } from '#/features/global/footer/adaptor/transformer';
import type { TRawNavigation } from '#/features/global/navigation/adaptor/transformer';
import type { TRawSiteSettings } from '#/features/global/site-settings/adaptor/transformer';
import { makeRawImage } from '#/testing/shared/fixtures';

export function makeRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    brand: {
      name: 'My Blog',
      prefix: 'val',
      suffix: null,
      logo: makeRawImage('Logo'),
    },
    description: 'A blog about things',
    tagline: null,
    defaultSeo: {
      ogTitle: null,
      ogDescription: null,
      ogImage: makeRawImage('OG image'),
    },
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
