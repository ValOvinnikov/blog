import { CONTENT_ROUTE_REVALIDATE_SECONDS } from '@blog/config';

import BlogIndexPage, { generateMetadata, revalidate } from './page';

vi.mock('@web/metadata/blog-list-metadata', () => ({
  buildBlogListMetadata: vi.fn().mockResolvedValue({ title: 'Blog' }),
}));

vi.mock('@web/components/pages/blog-list-page', () => ({
  BlogListPage: ({ page }: { page: number }) => (
    <div data-testid="blog-list-page">{page}</div>
  ),
}));

describe('BlogIndexPage', () => {
  it('declares the shared content-route revalidate backstop', () => {
    expect(revalidate).toBe(CONTENT_ROUTE_REVALIDATE_SECONDS);
  });

  describe('generateMetadata', () => {
    it('delegates to buildBlogListMetadata for page 1', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
      });

      expect(metadata).toEqual({ title: 'Blog' });
    });
  });

  it('renders BlogListPage for page 1', async () => {
    const ui = await BlogIndexPage({
      params: Promise.resolve({ tenant: 'tenant-1', locale: 'EN' }),
    });

    expect(ui.props.page).toBe(1);
  });
});
