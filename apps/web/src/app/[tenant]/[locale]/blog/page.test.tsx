import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import PostIndexRoute, { generateMetadata, revalidate } from './page';

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
