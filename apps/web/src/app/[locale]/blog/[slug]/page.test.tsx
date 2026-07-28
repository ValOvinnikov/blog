import BlogPostSlugPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { getPostParamsMock } = vi.hoisted(() => ({
  getPostParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      post: { v1: { getPostParams: getPostParamsMock } },
    },
  },
}));

vi.mock('@web/metadata/post-metadata', () => ({
  buildPostMetadata: vi.fn().mockResolvedValue({ title: 'Hello World' }),
}));

vi.mock('@web/components/pages/blog-post-page', () => ({
  BlogPostPage: ({ slug }: { slug: string }) => (
    <div data-testid="blog-post-page">{slug}</div>
  ),
}));

describe('BlogPostSlugPage', () => {
  describe('generateStaticParams', () => {
    it('returns the bare slug for each post, letting Next combine it with the locale segment', async () => {
      getPostParamsMock.mockResolvedValue([
        { slug: 'a', publishedAt: '2026-01-01' },
        { slug: 'b', publishedAt: '2026-01-02' },
      ]);

      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'a' }, { slug: 'b' }]);
    });

    it('returns an empty array when getPostParams rejects', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getPostParamsMock.mockRejectedValue(new Error('projectId missing'));

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe('generateMetadata', () => {
    it('delegates to buildPostMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: 'EN', slug: 'hello-world' }),
      });

      expect(metadata).toEqual({ title: 'Hello World' });
    });
  });

  it('renders BlogPostPage with the resolved slug', async () => {
    const ui = await BlogPostSlugPage({
      params: Promise.resolve({ locale: 'EN', slug: 'hello-world' }),
    });

    expect(ui.props.slug).toBe('hello-world');
  });
});
