import { LOCALE_ISO_CODES, CONTENT_ALIGNMENT } from '@blog/config/constants';
import type { TLandingPage, TLandingSectionNavigation } from '@blog/service';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

export const MOCK_SECTION_ROOT_PATH = 'modules';
export const MOCK_SECTION_FAQ_PATH = `${MOCK_SECTION_ROOT_PATH}/faq`;
export const MOCK_SECTION_PRICING_PATH = `${MOCK_SECTION_ROOT_PATH}/pricing`;
export const MOCK_SECTION_ROOT_TITLE = 'Modules';
export const MOCK_SECTION_FAQ_TITLE = 'FAQ';
export const MOCK_SECTION_PRICING_TITLE = 'Pricing';

export const MOCK_LANDING_PAGE_OG_IMAGE = mockSanityImage();

export const MOCK_LANDING_PAGE: TLandingPage = {
  id: 'about-us',
  path: 'about-us',
  translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'about-us' }],
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: { heading: 'About Us', supportingText: undefined },
  hero: undefined,
  modules: [],
  faqs: [],
  sectionNavigation: undefined,
  seo: mockSeo({
    title: 'About Us',
    description: 'Who we are.',
    ogTitle: 'About Us OG',
    ogDescription: 'Who we are OG.',
    ogImage: MOCK_LANDING_PAGE_OG_IMAGE,
  }),
};

export const mockLandingSectionNavigation = (
  overrides: Partial<TLandingSectionNavigation> = {},
): TLandingSectionNavigation => {
  return {
    title: null,
    root: {
      title: MOCK_SECTION_ROOT_TITLE,
      path: MOCK_SECTION_ROOT_PATH,
      isCurrent: false,
    },
    pages: [
      {
        title: MOCK_SECTION_FAQ_TITLE,
        path: MOCK_SECTION_FAQ_PATH,
        isCurrent: true,
      },
      {
        title: MOCK_SECTION_PRICING_TITLE,
        path: MOCK_SECTION_PRICING_PATH,
        isCurrent: false,
      },
    ],
    breadcrumbs: [
      { title: MOCK_SECTION_ROOT_TITLE, path: MOCK_SECTION_ROOT_PATH },
      { title: MOCK_SECTION_FAQ_TITLE, path: MOCK_SECTION_FAQ_PATH },
    ],
    parentSection: undefined,
    ...overrides,
  };
};
