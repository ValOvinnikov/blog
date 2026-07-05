import type { TRawSiteSettings } from '#/features/global/site-settings/adaptor/transformer';
import { makeRawImage } from '#/testing/shared/fixtures';

export function makeRawSiteSettings(
  overrides: Partial<TRawSiteSettings> = {},
): TRawSiteSettings {
  return {
    title: 'My Blog',
    description: 'A blog about things',
    tagline: null,
    logo: makeRawImage('Logo'),
    ogImage: makeRawImage('OG image'),
    ogTitle: null,
    ogDescription: null,
    navigation: null,
    socialLinks: null,
    ...overrides,
  };
}
