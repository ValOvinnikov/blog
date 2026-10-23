import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockTranslationLink } from '@blog/service/testing/shared/fixtures';

const { EN, NL } = LOCALE_ISO_CODES;

export const MOCK_ABOUT_EN_PAGE_ID = 'about-en';
export const MOCK_ABOUT_NL_PAGE_ID = 'about-nl';
export const MOCK_ABOUT_SLUG = 'about-us';
export const MOCK_ABOUT_HREF = '/about-us';
export const MOCK_ABOUT_NL_SLUG = 'over-ons';
export const MOCK_PRICING_EN_PAGE_ID = 'pricing-en';
export const MOCK_PRICING_NL_PAGE_ID = 'pricing-nl';
export const MOCK_PRICING_SLUG = 'pricing';
export const MOCK_PRICING_NL_SLUG = 'prijzen';
export const MOCK_TEAM_EN_PAGE_ID = 'team-en';
export const MOCK_TEAM_NL_PAGE_ID = 'team-nl';
export const MOCK_TEAM_SLUG = 'team';
export const MOCK_ABOUT_TRANSLATION_METADATA_ID = 'meta-about';

export function mockLandingPageDocument(
  id: string,
  language: string,
  slug?: string,
) {
  return {
    _id: id,
    _type: 'page_landing',
    language,
    ...(slug ? { slug: { current: slug } } : {}),
  };
}

export function mockTranslationMetadata(
  id: string,
  translations: [language: string, ref: string][],
) {
  return {
    _id: id,
    _type: 'translation.metadata',
    translations: translations.map(([language, ref]) =>
      mockTranslationLink(language, ref),
    ),
  };
}

export const MOCK_ABOUT_TRANSLATION_METADATA = mockTranslationMetadata(
  MOCK_ABOUT_TRANSLATION_METADATA_ID,
  [
    [EN, MOCK_ABOUT_EN_PAGE_ID],
    [NL, MOCK_ABOUT_NL_PAGE_ID],
  ],
);
