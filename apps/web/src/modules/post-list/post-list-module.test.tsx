import { BRAND_VARIANT } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { notFound } from 'next/navigation';

import { PostListModule } from './post-list-module';

const { getPostListMock } = vi.hoisted(() => ({
  getPostListMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      postList: { v1: { getPostList: getPostListMock } },
    },
  },
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
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

const setup = customRenderAsync(PostListModule, {
  id: 'post-list-1',
  locale: 'en',
});

describe(PostListModule, () => {
  beforeEach(() => {
    getPostListMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getPostListMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('calls getPostList with the module id and page', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 2,
        totalPages: 2,
      },
    });

    await setup({ page: 2 });

    expect(getPostListMock).toHaveBeenCalledWith('post-list-1', 2);
  });

  it('renders an archive-appropriate accessible heading (never "Latest posts")', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: undefined,
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'All posts',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'All posts' }),
    ).toBeInTheDocument();
  });

  it('renders the derived empty message when zero posts resolve and the CMS field is blank', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });

  it('renders the authored emptyMessage override instead of the derived default', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: 'Nothing published yet — check back soon.',
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup();

    expect(
      screen.getByText('Nothing published yet — check back soon.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('No posts yet.')).not.toBeInTheDocument();
  });

  it('renders a pager with a fully translated aria-label and correct hrefs', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [
          {
            id: 'post-1',
            slug: 'first-post',
            title: 'First post',
            excerpt: 'An excerpt',
            publishedAt: '2026-01-01T00:00:00.000Z',
            topic: { id: 'topic-1', title: 'News', slug: 'news' },
            readingTimeMinutes: 2,
          },
        ],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 2,
        totalPages: 3,
      },
    });

    await setup({ page: 2 });

    const nav = screen.getByRole('navigation', { name: 'Blog pages' });
    expect(nav).toBeInTheDocument();

    const previousLink = screen.getByRole('link', { name: 'Previous' });
    expect(previousLink).toHaveAttribute('href', '/blog');

    const nextLink = screen.getByRole('link', { name: 'Next' });
    expect(nextLink).toHaveAttribute('href', '/blog/page/3');
  });

  it('calls notFound() when an explicit page exceeds totalPages', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 5,
        totalPages: 1,
      },
    });

    await expect(setup({ page: 5 })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('does not 404 page 1 of an empty archive when no explicit page is given', async () => {
    getPostListMock.mockResolvedValue({
      ok: true,
      data: {
        brandVariant: BRAND_VARIANT.PRIMARY,
        sectionHeader: {
          heading: 'Blog',
          supportingText: undefined,
          align: undefined,
        },
        posts: [],
        layout: undefined,
        emptyMessage: undefined,
        currentPage: 1,
        totalPages: 1,
      },
    });

    await setup({ page: undefined });

    expect(vi.mocked(notFound)).not.toHaveBeenCalled();
    expect(screen.getByText('No posts yet.')).toBeInTheDocument();
  });
});
