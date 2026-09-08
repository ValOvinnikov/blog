import type { TLandingPage } from '@blog/service';
import { makeSeo } from '@web/testing/shared/seo/fixtures';

export const mockLandingPage: TLandingPage = {
  title: 'About Us',
  slug: 'about-us',
  hero: undefined,
  modules: [],
  seo: makeSeo({
    title: 'About Us',
    description: 'Who we are.',
    ogTitle: 'About Us OG',
    ogDescription: 'Who we are OG.',
    ogImageUrl: 'https://cdn.example.com/about-og.jpg',
  }),
};
