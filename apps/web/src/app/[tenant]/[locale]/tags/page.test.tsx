import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { enterRequestContext } from '@web/server/request-context/request-context';

import TagIndexRoute, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/tag-index-metadata', () => ({
  buildTagIndexMetadata: vi.fn().mockResolvedValue({ title: 'Tags' }),
}));

vi.mock('@web/components/pages/tag-index-page', () => ({
  TagIndexPage: () => <div data-testid="tag-index-page" />,
}));

describe('TagIndexRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: 'a-slug',
    });

    await TagIndexRoute({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  describe('generateMetadata', () => {
    it('delegates to buildTagIndexMetadata', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Tags' });
    });

    it('enters the request context with the route params', async () => {
      const params: Parameters<typeof generateMetadata>[0]['params'] =
        Promise.resolve({ tenant: 'tenant-1', locale: 'EN' });

      await generateMetadata({ params });

      expect(enterRequestContext).toHaveBeenCalledWith(params);
    });
  });

  it('renders TagIndexPage without forwarding route params', async () => {
    const ui = await TagIndexRoute({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props).toEqual({});
  });
});
