import type { TRawSiteSettings } from '#/features/global/site-settings/adaptor/transformer';
import { makeRawImage } from '#/testing/shared/fixtures';

export function makeRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    title: 'My Blog',
    description: 'A blog about things',
    tagline: null,
    brandPrefix: 'val',
    brandSuffix: null,
    logo: makeRawImage('Logo'),
    defaultSeo: {
      ogTitle: null,
      ogDescription: null,
      ogImage: makeRawImage('OG image'),
    },
    navigation: null,
    socialLinks: null,
    ...overrides,
  };
}
