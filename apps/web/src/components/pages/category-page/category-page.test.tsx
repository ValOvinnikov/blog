import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { CategoryPage } from './category-page';

const { getCategoryPageMock, getCategoriesMock } = vi.hoisted(() => ({
  getCategoryPageMock: vi.fn(),
  getCategoriesMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: { v1: { getCategoryPage: getCategoryPageMock } },
    },
    entities: {
      categories: { v1: { getCategories: getCategoriesMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const post = {
  id: 'post-1',
  title: 'My Post Title',
  slug: 'my-post-slug',
  excerpt: 'An excerpt.',
  publishedAt: '2026-01-01T00:00:00.000Z',
  categories: [{ id: 'cat-1', title: 'News', slug: 'news' }],
};

const setup = customRenderAsync(CategoryPage, {
  slug: 'news',
  locale: 'en',
});

describe('CategoryPage', () => {
  beforeEach(() => {
    getCategoryPageMock.mockReset();
    getCategoriesMock.mockReset();
    getCategoriesMock.mockResolvedValue([
      { id: 'cat-1', title: 'News', slug: 'news', postCount: 1 },
      { id: 'cat-2', title: 'Design', slug: 'design', postCount: 2 },
    ]);
  });

  it('calls notFound() when the category does not exist', async () => {
    getCategoryPageMock.mockResolvedValue({ ok: true, data: null });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getCategoryPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the category heading, description, and posts', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.getByText('The latest updates.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the empty-state message when the category has no posts', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [],
        currentPage: 1,
        totalPages: 1,
        total: 0,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Posts in News' }),
    ).toBeVisible();
    expect(screen.getByText('No posts in News yet.')).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'My Post Title' }),
    ).not.toBeInTheDocument();
  });

  it('renders the category chip row with the current category highlighted', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(
      screen.getByRole('navigation', { name: 'Categories' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Design' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('calls getCategoryPage with the fixed itemsPerPage, page undefined, on page 1', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 1,
        totalPages: 1,
        total: 1,
      },
    });

    await setup();

    expect(getCategoryPageMock).toHaveBeenCalledWith('news', {
      page: undefined,
      itemsPerPage: 9,
    });
  });

  it('calls the paginated getCategoryPage with the fixed itemsPerPage when a page is given', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(getCategoryPageMock).toHaveBeenCalledWith('news', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('renders pagination on page 1 when there is more than one page', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(
      screen.getByRole('navigation', { name: 'Category pages' }),
    ).toBeVisible();
  });

  it('renders pagination wired to routes.category(slug, page) when a page is given', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [post],
        currentPage: 2,
        totalPages: 3,
        total: 20,
      },
    });

    await setup({ page: 2 });

    expect(
      screen.getByRole('navigation', { name: 'Category pages' }),
    ).toBeVisible();
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/category/news/page/3');
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getCategoryPageMock.mockResolvedValue({
      ok: true,
      data: {
        category: {
          id: 'cat-1',
          title: 'News',
          slug: 'news',
          description: 'The latest updates.',
        },
        posts: [],
        currentPage: 5,
        totalPages: 1,
        total: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });
});
