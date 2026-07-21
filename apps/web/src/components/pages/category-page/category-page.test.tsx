import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoryPage } from './category-page';

const { getCategoryPageMock } = vi.hoisted(() => ({
  getCategoryPageMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      category: { v1: { getCategoryPage: getCategoryPageMock } },
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

describe('CategoryPage', () => {
  beforeEach(() => {
    getCategoryPageMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the category does not exist', async () => {
    getCategoryPageMock.mockResolvedValue(null);

    await expect(
      CategoryPage({ slug: 'missing', locale: 'en' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the category heading, description, and posts', async () => {
    getCategoryPageMock.mockResolvedValue({
      category: {
        id: 'cat-1',
        title: 'News',
        slug: 'news',
        description: 'The latest updates.',
      },
      posts: [post],
    });

    const ui = await CategoryPage({ slug: 'news', locale: 'en' });
    render(<>{ui}</>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.getByText('The latest updates.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('renders the category heading with no posts section when the category has no posts', async () => {
    getCategoryPageMock.mockResolvedValue({
      category: {
        id: 'cat-1',
        title: 'News',
        slug: 'news',
        description: 'The latest updates.',
      },
      posts: [],
    });

    const ui = await CategoryPage({ slug: 'news', locale: 'en' });
    render(<>{ui}</>);

    expect(
      screen.getByRole('heading', { level: 1, name: 'News' }),
    ).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
