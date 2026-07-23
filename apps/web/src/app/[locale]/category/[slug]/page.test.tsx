import { generateStaticParams } from './page';

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
  CategoryPage: () => null,
}));

vi.mock('@web/metadata/category-metadata', () => ({
  buildCategoryMetadata: vi.fn().mockResolvedValue({}),
}));

describe('CategoryDetailPage generateStaticParams', () => {
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
