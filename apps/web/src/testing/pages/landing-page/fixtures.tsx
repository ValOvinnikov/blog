import { LOCALE_ISO_CODES } from '@blog/config/constants';
import type { TLandingPage, TLandingSectionNavigation } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

export const LANDING_PAGE_OG_IMAGE = makeSanityImage();

export const mockLandingPage: TLandingPage = {
  id: 'about-us',
  path: 'about-us',
  translations: [{ language: LOCALE_ISO_CODES.EN, slug: 'about-us' }],
  headingBlock: { heading: 'About Us', supportingText: undefined },
  hero: undefined,
  modules: [],
  faqs: [],
  sectionNavigation: undefined,
  seo: makeSeo({
    title: 'About Us',
    description: 'Who we are.',
    ogTitle: 'About Us OG',
    ogDescription: 'Who we are OG.',
    ogImage: LANDING_PAGE_OG_IMAGE,
  }),
};

export const makeLandingSectionNavigation = (
  overrides: Partial<TLandingSectionNavigation> = {},
): TLandingSectionNavigation => {
  return {
    root: { title: 'Modules', path: 'modules', isCurrent: false },
    pages: [
      { title: 'FAQ', path: 'modules/faq', isCurrent: true },
      { title: 'Pricing', path: 'modules/pricing', isCurrent: false },
    ],
    breadcrumbs: [
      { title: 'Modules', path: 'modules' },
      { title: 'FAQ', path: 'modules/faq' },
    ],
    ...overrides,
  };
};
