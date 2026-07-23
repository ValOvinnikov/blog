import { customRenderAsync, screen } from '@web/testing/custom-render';

import { TagPage } from './tag-page';

const { getTagPageMock } = vi.hoisted(() => ({
  getTagPageMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      tag: { v1: { getTagPage: getTagPageMock } },
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

const seo = {
  title: 'TypeScript',
  description: 'The latest TypeScript posts.',
  ogTitle: 'TypeScript',
  ogDescription: 'The latest TypeScript posts.',
  ogImageUrl: undefined,
};

const post = {
  id: 'post-1',
  title: 'My Post Title',
  slug: 'my-post-slug',
  excerpt: 'An excerpt.',
  publishedAt: '2026-01-01T00:00:00.000Z',
  categories: [{ id: 'cat-1', title: 'News', slug: 'news' }],
};

const setup = customRenderAsync(TagPage, {
  slug: 'typescript',
  locale: 'en',
});

describe('TagPage', () => {
  beforeEach(() => {
    getTagPageMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the tag does not exist', async () => {
    getTagPageMock.mockResolvedValue(null);

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the tag heading, description, and posts', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'The latest TypeScript posts.',
        seo,
      },
      posts: [post],
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(screen.getByText('The latest TypeScript posts.')).toBeVisible();

    const link = screen.getByRole('link', { name: 'My Post Title' });
    expect(link).toBeVisible();
    expect(link).toHaveAttribute('href', '/blog/my-post-slug');
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('renders the tag heading with no posts section when the tag has no posts', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'The latest TypeScript posts.',
        seo,
      },
      posts: [],
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'TypeScript' }),
    ).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('calls the paginated getTagPage with the fixed itemsPerPage when a page is given', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'The latest TypeScript posts.',
        seo,
      },
      posts: [post],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    await setup({ page: 2 });

    expect(getTagPageMock).toHaveBeenCalledWith('typescript', {
      page: 2,
      itemsPerPage: 9,
    });
  });

  it('renders pagination wired to routes.tag(slug, page) when a page is given', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'The latest TypeScript posts.',
        seo,
      },
      posts: [post],
      currentPage: 2,
      totalPages: 3,
      total: 20,
    });

    await setup({ page: 2 });

    expect(screen.getByRole('navigation', { name: 'Tag pages' })).toBeVisible();
    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/tag/typescript/page/3');
  });

  it('calls notFound() when the requested page is beyond totalPages', async () => {
    getTagPageMock.mockResolvedValue({
      tag: {
        id: 'tag-1',
        title: 'TypeScript',
        slug: 'typescript',
        description: 'The latest TypeScript posts.',
        seo,
      },
      posts: [],
      currentPage: 5,
      totalPages: 1,
      total: 1,
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
