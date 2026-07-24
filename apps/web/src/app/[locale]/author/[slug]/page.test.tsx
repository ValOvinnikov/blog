import AuthorDetailPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { getAuthorParamsMock } = vi.hoisted(() => ({
  getAuthorParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      author: { v1: { getAuthorParams: getAuthorParamsMock } },
    },
  },
}));

vi.mock('@web/components/pages/author-page', () => ({
  AuthorPage: ({ slug }: { slug: string }) => (
    <div data-testid="author-page">{slug}</div>
  ),
}));

vi.mock('@web/metadata/author-metadata', () => ({
  buildAuthorMetadata: vi.fn().mockResolvedValue({ title: 'Jane Doe' }),
}));

describe('AuthorDetailPage', () => {
  describe('generateStaticParams', () => {
    it('returns the author slugs on success', async () => {
      getAuthorParamsMock.mockResolvedValue([
        { slug: 'jane-doe' },
        { slug: 'john-smith' },
      ]);

      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'jane-doe' }, { slug: 'john-smith' }]);
    });

    it('returns an empty array when the fetch rejects', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getAuthorParamsMock.mockRejectedValue(new Error('boom'));

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe('generateMetadata', () => {
    it('delegates to buildAuthorMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: 'EN', slug: 'jane-doe' }),
      });

      expect(metadata).toEqual({ title: 'Jane Doe' });
    });
  });

  it('renders AuthorPage with the resolved slug', async () => {
    const ui = await AuthorDetailPage({
      params: Promise.resolve({ locale: 'EN', slug: 'jane-doe' }),
    });

    expect(ui.props.slug).toBe('jane-doe');
  });
});
