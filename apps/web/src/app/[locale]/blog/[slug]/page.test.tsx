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

vi.mock('@web/i18n/routing', () => ({
  routing: { locales: ['EN'] },
}));

vi.mock('@web/metadata/post-metadata', () => ({
  buildPostMetadata: vi.fn().mockResolvedValue({ title: 'Hello World' }),
}));

vi.mock('@web/components/pages/blog-post-page', () => ({
  BlogPostPage: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="blog-post-page">
      {slug}-{locale}
    </div>
  ),
}));

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
}));

describe('generateStaticParams', () => {
  it('builds one entry per locale x slug combination', async () => {
    getPostParamsMock.mockResolvedValue([{ slug: 'a' }, { slug: 'b' }]);

    const params = await generateStaticParams();

    expect(params).toEqual([
      { locale: 'EN', slug: 'a' },
      { locale: 'EN', slug: 'b' },
    ]);
  });

  it('returns an empty array when getPostParams rejects', async () => {
    getPostParamsMock.mockRejectedValue(new Error('projectId missing'));

    const params = await generateStaticParams();

    expect(params).toEqual([]);
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

describe('BlogPostSlugPage', () => {
  it('renders BlogPostPage with the resolved locale and slug', async () => {
    const ui = await BlogPostSlugPage({
      params: Promise.resolve({ locale: 'EN', slug: 'hello-world' }),
    });

    expect(ui.props.slug).toBe('hello-world');
    expect(ui.props.locale).toBe('EN');
  });
});
