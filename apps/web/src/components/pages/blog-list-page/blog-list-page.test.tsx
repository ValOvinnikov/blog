import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { BlogListPage } from './blog-list-page';

const { getIndexPageMock, getCategoriesMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
  getCategoriesMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
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

const setup = customRenderAsync(BlogListPage, { page: 1, locale: 'en' });

describe('BlogListPage', () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    getCategoriesMock.mockReset();
    getCategoriesMock.mockResolvedValue([
      { id: 'cat-1', title: 'News', slug: 'news', postCount: 1 },
    ]);
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { posts: [post], currentPage: 5, totalPages: 1, total: 1 },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the posts for a page within range', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Blog' }),
    ).toBeVisible();
    expect(screen.getByText('Essays and notes.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
  });

  it('renders the category chip row', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: {
        heading: 'Blog',
        supportingText: 'Essays and notes.',
        posts: [post],
        currentPage: 1,
        totalPages: 3,
        total: 20,
      },
    });

    await setup();

    expect(
      screen.getByRole('navigation', { name: 'Categories' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute(
      'href',
      '/category/news',
    );
  });
});
