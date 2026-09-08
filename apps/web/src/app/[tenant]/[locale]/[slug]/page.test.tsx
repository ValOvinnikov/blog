import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import LandingSlugPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/landing-page-metadata', () => ({
  buildLandingPageMetadata: vi.fn().mockResolvedValue({ title: 'About Us' }),
}));

vi.mock('@web/components/pages/landing-page', () => ({
  LandingPage: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="landing-page">
      {slug}-{locale}
    </div>
  ),
}));

describe('LandingSlugPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildLandingPageMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'about-us',
        }),
      });

      expect(metadata).toEqual({ title: 'About Us' });
    });
  });

  it('renders LandingPage with the resolved locale and slug', async () => {
    const ui = await LandingSlugPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: 'about-us',
      }),
    });

    expect(ui.props.slug).toBe('about-us');
    expect(ui.props.locale).toBe('EN');
  });
});
