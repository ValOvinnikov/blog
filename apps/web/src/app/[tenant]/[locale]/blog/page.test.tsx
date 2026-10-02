import {
  CONTENT_ROUTE_REVALIDATE_SECONDS,
  LOCALE_ISO_CODES,
} from '@blog/config';
import { enterRequestContext } from '@web/server/request-context/request-context';

import PostIndexRoute, { generateMetadata, revalidate } from './page';

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/metadata/post-index-metadata', () => ({
  buildPostIndexMetadata: vi.fn().mockResolvedValue({ title: 'Blog' }),
}));

vi.mock('@web/components/pages/post-index-page', () => ({
  PostIndexPage: ({ page }: { page: number }) => (
    <div data-testid="post-index-page">{page}</div>
  ),
}));

describe('PostIndexRoute', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  it('enters the request context with the route params', async () => {
    const params = Promise.resolve({
      tenant: 'tenant-1',
      locale: LOCALE_ISO_CODES.EN,
      slug: 'a-slug',
    });

    await PostIndexRoute({ params });

    expect(enterRequestContext).toHaveBeenCalledWith(params);
  });

  describe('generateMetadata', () => {
    it('delegates to buildPostIndexMetadata for page 1', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Blog' });
    });
  });

  it('renders PostIndexPage for page 1', async () => {
    const ui = await PostIndexRoute({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props.page).toBe(1);
  });
});
