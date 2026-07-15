import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogListPage } from './blog-list-page';

const { getIndexPageMock } = vi.hoisted(() => ({
  getIndexPageMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      blog: { v1: { getIndexPage: getIndexPageMock } },
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
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

describe('BlogListPage', () => {
  beforeEach(() => {
    getIndexPageMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { posts: [post], currentPage: 5, totalPages: 1, total: 1 },
    });

    await expect(BlogListPage({ page: 5, locale: 'en' })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('calls notFound() when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getIndexPageMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    await expect(BlogListPage({ page: 1, locale: 'en' })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(notFoundMock).toHaveBeenCalledTimes(1);

    errorSpy.mockRestore();
  });

  it('renders the posts for a page within range', async () => {
    getIndexPageMock.mockResolvedValue({
      ok: true,
      data: { posts: [post], currentPage: 1, totalPages: 3, total: 20 },
    });

    const ui = await BlogListPage({ page: 1, locale: 'en' });
    render(<>{ui}</>);

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
