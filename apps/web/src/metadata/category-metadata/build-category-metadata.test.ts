import { buildCategoryMetadata } from './build-category-metadata';

const { getCategoryPageMock } = vi.hoisted(() => ({
  getCategoryPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: { v1: { getCategoryPage: getCategoryPageMock } },
    },
  },
}));

const category = {
  id: 'cat-1',
  title: 'Engineering',
  slug: 'engineering',
  description: 'Posts about building things.',
};

describe('buildCategoryMetadata', () => {
  it('builds metadata from the category title/description, self-canonical to /category/[slug]', async () => {
    getCategoryPageMock.mockResolvedValue({
      category,
      posts: [],
      currentPage: 1,
      totalPages: 1,
      total: 0,
    });

    const metadata = await buildCategoryMetadata('engineering');

    expect(metadata.title).toBe('Engineering');
    expect(metadata.description).toBe('Posts about building things.');
    expect(metadata.alternates?.canonical).toBe('/category/engineering');
    expect(metadata.openGraph?.title).toBe('Engineering');
    expect(metadata.openGraph?.description).toBe(
      'Posts about building things.',
    );
    expect(getCategoryPageMock).toHaveBeenCalledWith('engineering', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('falls back to the category title as description when none is authored', async () => {
    getCategoryPageMock.mockResolvedValue({
      category: { ...category, description: undefined },
      posts: [],
      currentPage: 1,
      totalPages: 1,
      total: 0,
    });

    const metadata = await buildCategoryMetadata('engineering');

    expect(metadata.description).toBe('Engineering');
  });

  it('returns empty metadata when the category does not exist', async () => {
    getCategoryPageMock.mockResolvedValue(null);

    const metadata = await buildCategoryMetadata('missing');

    expect(metadata).toEqual({});
  });

  it('builds page-N metadata with a "– Page N" suffix, self-canonical to /category/[slug]/page/N — never /category/[slug]', async () => {
    getCategoryPageMock.mockResolvedValue({
      category,
      posts: [],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    const metadata = await buildCategoryMetadata('engineering', 2);

    expect(metadata.title).toBe('Engineering – Page 2');
    expect(metadata.openGraph?.title).toBe('Engineering – Page 2');
    expect(metadata.alternates?.canonical).toBe('/category/engineering/page/2');
    expect(metadata.alternates?.canonical).not.toBe('/category/engineering');
    expect(getCategoryPageMock).toHaveBeenCalledWith('engineering', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('returns empty metadata for page N when the category does not exist', async () => {
    getCategoryPageMock.mockResolvedValue(null);

    const metadata = await buildCategoryMetadata('missing', 2);

    expect(metadata).toEqual({});
  });
});
