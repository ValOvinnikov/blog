import BlogPostSlugPage, { generateMetadata } from './page';

vi.mock('@web/metadata/post-metadata', () => ({
  buildPostMetadata: vi.fn().mockResolvedValue({ title: 'Hello World' }),
}));

vi.mock('@web/components/pages/blog-post-page', () => ({
  BlogPostPage: ({ slug }: { slug: string }) => (
    <div data-testid="blog-post-page">{slug}</div>
  ),
}));

describe('BlogPostSlugPage', () => {
  describe('generateMetadata', () => {
    it('delegates to buildPostMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({
          tenant: 'tenant-1',
          locale: 'EN',
          slug: 'hello-world',
        }),
      });

      expect(metadata).toEqual({ title: 'Hello World' });
    });
  });

  it('renders BlogPostPage with the resolved slug', async () => {
    const ui = await BlogPostSlugPage({
      params: Promise.resolve({
        tenant: 'tenant-1',
        locale: 'EN',
        slug: 'hello-world',
      }),
    });

    expect(ui.props.slug).toBe('hello-world');
  });
});
