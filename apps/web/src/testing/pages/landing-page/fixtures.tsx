import type { TLandingPage } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

export const LANDING_PAGE_OG_IMAGE = makeSanityImage();

export const mockLandingPage: TLandingPage = {
  slug: 'about-us',
  headingBlock: { heading: 'About Us', supportingText: undefined },
  hero: undefined,
  modules: [],
  seo: makeSeo({
    title: 'About Us',
    description: 'Who we are.',
    ogTitle: 'About Us OG',
    ogDescription: 'Who we are OG.',
    ogImage: LANDING_PAGE_OG_IMAGE,
  }),
};
