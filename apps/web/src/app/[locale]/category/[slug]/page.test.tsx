import CategoryDetailPage, {
  generateMetadata,
  generateStaticParams,
} from './page';

const { getCategoryParamsMock } = vi.hoisted(() => ({
  getCategoryParamsMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: { v1: { getCategoryParams: getCategoryParamsMock } },
    },
  },
}));

vi.mock('@web/components/pages/category-page', () => ({
  CategoryPage: ({ slug, locale }: { slug: string; locale: string }) => (
    <div data-testid="category-page">
      {slug}-{locale}
    </div>
  ),
}));

vi.mock('@web/metadata/category-metadata', () => ({
  buildCategoryMetadata: vi.fn().mockResolvedValue({ title: 'Engineering' }),
}));

describe('CategoryDetailPage', () => {
  describe('generateStaticParams', () => {
    it('returns the category slugs on success', async () => {
      getCategoryParamsMock.mockResolvedValue([
        { slug: 'engineering' },
        { slug: 'design' },
      ]);

      const params = await generateStaticParams();

      expect(params).toEqual([{ slug: 'engineering' }, { slug: 'design' }]);
    });

    it('returns an empty array when the fetch rejects', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getCategoryParamsMock.mockRejectedValue(new Error('boom'));

      const params = await generateStaticParams();

      expect(params).toEqual([]);
      errorSpy.mockRestore();
    });
  });

  describe('generateMetadata', () => {
    it('delegates to buildCategoryMetadata with the resolved slug', async () => {
      const metadata = await generateMetadata({
        params: Promise.resolve({ locale: 'EN', slug: 'engineering' }),
      });

      expect(metadata).toEqual({ title: 'Engineering' });
    });
  });

  it('renders CategoryPage with the resolved locale and slug', async () => {
    const ui = await CategoryDetailPage({
      params: Promise.resolve({ locale: 'EN', slug: 'engineering' }),
    });

    expect(ui.props.slug).toBe('engineering');
    expect(ui.props.locale).toBe('EN');
  });
});
