import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { enterRequestContext } from '@web/server/request-context/request-context';

import LandingSlugPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/landing-page-metadata', () => ({
  buildLandingPageMetadata: vi.fn().mockResolvedValue({ title: 'About Us' }),
}));

vi.mock('@web/components/pages/landing-page', () => ({
  LandingPage: ({ path }: { path: string }) => (
    <div data-testid="landing-page">{path}</div>
  ),
}));

describe('LandingSlugPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: ['a-slug'],
    });

    await LandingSlugPage({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  describe('generateMetadata', () => {
    it('delegates to buildLandingPageMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: ['about-us'],
        }),
      });

      expect(metadata).toEqual({ title: 'About Us' });
    });

    it('enters the request context with the route params', async () => {
      const params: Parameters<typeof generateMetadata>[0]['params'] =
        Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: ['about-us'],
        });

      await generateMetadata({ params });

      expect(enterRequestContext).toHaveBeenCalledWith(params);
    });
  });

  it('renders LandingPage with the joined path of a nested page', async () => {
    const ui = await LandingSlugPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: ['modules', 'faq'],
      }),
    });

    expect(ui.props).toEqual({ path: 'modules/faq' });
  });

  it('renders LandingPage with the resolved slug', async () => {
    const ui = await LandingSlugPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: ['about-us'],
      }),
    });

    expect(ui.props).toEqual({ path: 'about-us' });
  });
});
